import React, { useState, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { createPortal } from "react-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { useMonthlyLimit } from "../hooks/useMonthlyLimit";
import { useNextMonthQuota } from "../hooks/useNextMonthQuota";
import { usePosts } from "../hooks/usePosts";
import { useOrgId } from "../hooks/queries";
import { useEscapeKey } from "../hooks/useEscapeKey";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import { POST_STATUS_REVERSE_MAP } from "../constants/posts";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";
import PostsCalendar from "../components/PostsCalendar";
import PublishModal from "../components/PublishModal";
import AvatarModal from "../components/AvatarModal";
import KeskenModal from "../components/KeskenModal";
import TarkistuksessaModal from "../components/TarkistuksessaModal";
import AikataulutettuModal from "../components/AikataulutettuModal";
import MonthlyLimitWarning from "../components/MonthlyLimitWarning";
import UgcTab from "../components/UgcTab";
import CarouselsTab from "../components/CarouselsTab";
import KanbanTab from "../components/KanbanTab";
import PostCard from "../components/PostCard/PostCard";
import KuvapankkiSelector from "../components/KuvapankkiSelector";
import ImageBankModal from "../components/ImageBankModal";
import CarouselSegmentsEditor from "../components/CarouselSegmentsEditor";
import PostHeader from "../components/posts/PostHeader";
import PostTabs from "../components/posts/PostTabs";
import PostActions from "../components/posts/PostActions";
import PostFilters from "../components/posts/PostFilters";
import KeyboardShortcutsModal from "../components/KeyboardShortcutsModal";

// New refactored modals
import CreatePostModal from "../components/posts/modals/CreatePostModal";
import UploadPostModal from "../components/posts/modals/UploadPostModal";
import SchedulePostModal from "../components/posts/modals/SchedulePostModal";
import PreviewPostModal from "../components/posts/modals/PreviewPostModal";

// New hooks
import { useModalManager } from "../hooks/useModalManager";
import { useNotification } from "../hooks/useNotification";

// Dummy data
const initialPosts = [
  {
    id: 1,
    title: "Miten rakentaa menestyksekäs sosiaalisen median strategia",
    status: "Kesken",
    thumbnail: "/placeholder.png",
    caption:
      "Opi tärkeimmät vaiheet tehokkaan sosiaalisen median strategian luomiseen.",
    createdAt: "2024-01-15",
  },
  {
    id: 2,
    title: "10 vinkkiä parempaan sisältömarkkinointiin",
    status: "Valmis",
    thumbnail: "/placeholder.png",
    caption: "Löydä todistetut strategiat sisältömarkkinoinnin parantamiseen.",
    createdAt: "2024-01-16",
  },
  {
    id: 3,
    title: "Digitaalisen markkinoinnin tulevaisuus 2024",
    status: "Ajastettu",
    thumbnail: "/placeholder.png",
    caption: "Tutustu uusimpiin trendeihin ja teknologioihin.",
    scheduledDate: "2024-01-20",
  },
  {
    id: 4,
    title: "Bränditietoisuuden rakentaminen sosiaalisessa mediassa",
    status: "Julkaistu",
    thumbnail: "/placeholder.png",
    caption: "Tehokkaat strategiat brändin näkyvyyden lisäämiseen.",
    publishedAt: "2024-01-10",
  },
];

// columns ja publishedColumn määritelmät siirretty KanbanTab-komponenttiin

// Transform funktiot siirretty usePosts hookiin

export default function ManagePostsPage() {
  const { t } = useTranslation("common");
  const { user } = useAuth();
  const toast = useToast();
  const notify = useNotification(); // Yhtenäinen notification handling
  const navigate = useNavigate();
  const monthlyLimit = useMonthlyLimit();
  const nextMonthQuota = useNextMonthQuota();

  // Keskitetty modal management
  const { modal, openModal, closeModal, isOpen } = useModalManager();

  // Use usePosts hook for data management
  const {
    posts,
    reelsPosts,
    mixpostPosts,
    allPosts,
    socialAccounts,
    loading,
    reelsLoading,
    mixpostLoading,
    loadingAccounts,
    currentLoading,
    error,
    reelsError,
    currentError,
    fetchPosts,
    fetchReelsPosts,
    fetchMixpostPosts,
    fetchSocialAccounts,
    setPosts,
    setReelsPosts,
    setMixpostPosts,
  } = usePosts(user, t);

  // Cached organization ID from TanStack Query
  const { orgId } = useOrgId();

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [dataSourceToggle, setDataSourceToggle] = useState("all"); // 'all', 'supabase', 'reels'
  // Lataa tallennettu tab localStorageesta tai käytä oletusta
  const [activeTab, setActiveTabState] = useState(() => {
    const savedTab = localStorage.getItem("managePostsActiveTab");
    return savedTab &&
      ["kanban", "carousels", "calendar", "ugc"].includes(savedTab)
      ? savedTab
      : "kanban";
  }); // 'kanban' | 'carousels' | 'calendar' | 'ugc'

  // Wrapper-funktio joka tallentaa tabin localStorageen
  const setActiveTab = (tab) => {
    setActiveTabState(tab);
    localStorage.setItem("managePostsActiveTab", tab);
  };

  // Legacy modals (TODO: Refactor edit modal)
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishingPost, setPublishingPost] = useState(null);
  const [selectedAccounts, setSelectedAccounts] = useState([]);
  const [editModalStep, setEditModalStep] = useState(1); // 1 = voiceover, 2 = avatar
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [avatarImages, setAvatarImages] = useState([]); // [{url, id}]
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [voiceoverReadyChecked, setVoiceoverReadyChecked] = useState(false);
  const [showLimitWarning, setShowLimitWarning] = useState(false);
  const [refreshingCalendar, setRefreshingCalendar] = useState(false);
  const [userAccountType, setUserAccountType] = useState(null);
  const [showKuvapankkiSelector, setShowKuvapankkiSelector] = useState(false);
  const [showImageBankModal, setShowImageBankModal] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewPost, setPreviewPost] = useState(null);

  // Refs for character counting
  const textareaRef = useRef(null);
  const charCountRef = useRef(null);

  // Ref for file input
  const fileInputRef = useRef(null);

  // Ref for edit modal form
  const editFormRef = useRef(null);

  // fetchMixpostPosts siirretty usePosts hookiin

  // TODO: Avatar-sarake poistettu käytöstä - ei haeta avatar-kuvia
  // Hae avatar-kuvat kuten /settings sivulla (vain näyttö toistaiseksi)
  // useEffect(() => {
  //   const fetchAvatars = async () => {
  //     try {
  //       if (!showEditModal || editModalStep !== 2) return;
  //       if (!user || !orgId) return;
  //       // Optimization #5: Estä uudelleenhaku jos avataarit on jo haettu
  //       if (avatarImages.length > 0) return;
  //
  //       setAvatarLoading(true);
  //       setAvatarError("");
  //
  //       // Hae company_id suoraan Supabasesta
  //       const { data: userData, error: userError } = await supabase
  //         .from("users")
  //         .select("company_id")
  //         .eq("id", orgId)
  //         .single();
  //
  //       if (userError || !userData?.company_id) {
  //         setAvatarImages([]);
  //         setAvatarError("company_id puuttuu");
  //         return;
  //       }
  //
  //       // Kutsu avatar-status APIa
  //       const res = await fetch("/api/avatars/status", {
  //         method: "POST",
  //         headers: { "Content-Type": "application/json" },
  //         body: JSON.stringify({ companyId: userData.company_id }),
  //       });
  //
  //       const data = await res.json();
  //
  //       // Poimi Media[] URLit kuten SettingsPage.extractAvatarImages
  //       const extractAvatarImages = (apiData) => {
  //         if (!Array.isArray(apiData)) return [];
  //         const images = [];
  //         for (const record of apiData) {
  //           if (Array.isArray(record.Media)) {
  //             for (const media of record.Media) {
  //               let url = null;
  //               if (media.thumbnails?.full?.url)
  //                 url = media.thumbnails.full.url;
  //               else if (media.thumbnails?.large?.url)
  //                 url = media.thumbnails.large.url;
  //               else if (media.url) url = media.url;
  //               if (url) {
  //                 images.push({
  //                   url,
  //                   id: media.id || url,
  //                   variableId: record["Variable ID"] || record.id,
  //                 });
  //               }
  //             }
  //           }
  //           if (images.length >= 4) break;
  //         }
  //         return images.slice(0, 4);
  //       };
  //
  //       setAvatarImages(extractAvatarImages(data));
  //     } catch (e) {
  //       setAvatarError("Virhe avatar-kuvien haussa");
  //       setAvatarImages([]);
  //     } finally {
  //       setAvatarLoading(false);
  //     }
  //   };
  //
  //   fetchAvatars();
  // }, [showEditModal, editModalStep, user, orgId]);

  // Synkkaa voiceover checkboxin tila kun modaalin vaihe 1 avataan
  useEffect(() => {
    if (showEditModal && editModalStep === 1 && editingPost) {
      setVoiceoverReadyChecked(!!editingPost.voiceoverReady);
    }
  }, [showEditModal, editModalStep, editingPost]);

  // Notification states - REMOVED (using useNotification instead)

  const isUuid = (value) =>
    typeof value === "string" &&
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
      value,
    );

  // Auto-hide notifications - REMOVED (ToastContext handles this)

  // fetchPosts siirretty usePosts hookiin

  // Hae account_type tarkistusta varten
  useEffect(() => {
    const fetchAccountType = async () => {
      if (!user || !orgId) return;

      try {
        const { data, error } = await supabase
          .from("users")
          .select("account_type")
          .eq("id", orgId)
          .single();

        if (!error && data) {
          setUserAccountType(data.account_type);
        }
      } catch (err) {
        console.error("Virhe account_type haussa:", err);
      }
    };

    fetchAccountType();
  }, [user, orgId]);

  // TanStack Query handles all data fetching automatically - no manual fetching needed

  // Siirrä pois UGC-tabista jos feature poistetaan
  useEffect(() => {
    if (activeTab === "ugc" && user) {
      const hasUgcFeature =
        user.features &&
        Array.isArray(user.features) &&
        user.features.includes("UGC");
      if (!hasUgcFeature) {
        setActiveTab("kanban");
      }
    }
  }, [user?.features, activeTab]);

  // fetchSocialAccounts siirretty usePosts hookiin

  // Debounced search for performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // fetchReelsPosts siirretty usePosts hookiin

  // allPosts, currentLoading, currentError käytetään hookista
  const currentPosts = allPosts;

  // Optimization #4: Memoize filteredPosts - suodatus ajetaan vain kun riippuvuudet muuttuvat
  const filteredPosts = useMemo(() => {
    return allPosts.filter((post) => {
      const matchesSearch =
        (post.title?.toLowerCase() || "").includes(
          debouncedSearchTerm.toLowerCase(),
        ) ||
        (post.caption?.toLowerCase() || "").includes(
          debouncedSearchTerm.toLowerCase(),
        );
      const matchesStatus = statusFilter === "" || post.status === statusFilter;
      const matchesType = typeFilter === "" || post.type === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [allPosts, debouncedSearchTerm, statusFilter, typeFilter]);

  // Calculate filter counts
  const filterCounts = useMemo(() => {
    const typeCounts = { all: allPosts.length };
    const statusCounts = { all: allPosts.length };

    allPosts.forEach((post) => {
      // Count by type
      if (post.type) {
        typeCounts[post.type] = (typeCounts[post.type] || 0) + 1;
      }
      // Count by status
      if (post.status) {
        statusCounts[post.status] = (statusCounts[post.status] || 0) + 1;
      }
    });

    return { type: typeCounts, status: statusCounts };
  }, [allPosts]);

  // "Valmiina julkaisuun" (Tarkistuksessa) postaukset
  const readyPosts = filteredPosts.filter(
    (post) => post.status === "Tarkistuksessa",
  );

  // Kalenterin tarvitsemat eventit (ajastetut tai julkaisuajalla varustetut)
  const calendarItems = filteredPosts
    .map((p) => {
      // Näytä kalenterissa vain julkaisut, joilla on publish_date (publishDate)
      if (!p.publishDate) return null;

      let isoDate = null;
      let time = "";

      try {
        // publishDate on joko ISO-muodossa (Z:llä) tai "YYYY-MM-DDTHH:MM" muodossa
        let d;
        if (p.publishDate.includes("Z") || p.publishDate.includes("+")) {
          // ISO-muoto, käytä suoraan
          d = new Date(p.publishDate);
        } else {
          // Lisätään 'Z' loppuun jotta se tulkitaan UTC:nä
          const utcDateString = p.publishDate.endsWith("Z")
            ? p.publishDate
            : p.publishDate + "Z";
          d = new Date(utcDateString);
        }

        if (!isNaN(d.getTime())) {
          isoDate = d.toISOString();
          // Näytä paikallinen aika (Europe/Helsinki)
          const localTime = d.toLocaleString("fi-FI", {
            timeZone: "Europe/Helsinki",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          });
          time = localTime;
        }
      } catch (err) {
        // Virheellinen päivämäärä, ohitetaan
      }

      if (!isoDate) return null;

      const dateObj = new Date(isoDate);
      const yyyy = dateObj.getFullYear();
      const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
      const dd = String(dateObj.getDate()).padStart(2, "0");

      // Määritä kanava/alusta provider-kentästä
      let channel = null;
      if (p.provider) {
        channel = p.provider.charAt(0).toUpperCase() + p.provider.slice(1);
      }

      return {
        id: p.id,
        title: p.title || "Postaus",
        dateKey: `${yyyy}-${mm}-${dd}`,
        time,
        source: p.source || "supabase",
        type: p.type || "Post",
        status: p.status || "",
        channel: channel || null,
      };
    })
    .filter(Boolean);

  const handleCreatePost = async (postData) => {
    try {
      const count = postData.count || 1;

      // Tarkista kuukausiraja ennen luontia
      // Jos luodaan useampi postaus, tarkista että riittää tilaa
      if (!monthlyLimit.canCreate) {
        closeModal();
        notify.error("Kuukausiraja täynnä");
        return;
      }

      // Tarkista että kuukausiraja riittää useamman postauksen luomiseen
      if (count > 1) {
        const remaining = monthlyLimit.remaining || 0;
        if (remaining < count) {
          closeModal();
          notify.error(
            `Kuukausiraja ei riitä. Voit luoda vielä ${remaining} postausta tässä kuussa.`,
          );
          monthlyLimit.refresh();
          return;
        }
      }

      if (!orgId) {
        throw new Error(t("posts.messages.userIdNotFound"));
      }

      // Lähetetään idea-generation kutsu N8N:lle
      try {
        const response = await fetch("/api/ai/generate-ideas", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            idea: postData.title,
            type: postData.type,
            companyId: orgId,
            userId: orgId,
            caption: postData.caption,
            count: count,
          }),
        });

        if (!response.ok) {
          // Tarkista onko kyse kuukausiraja-virheestä
          const errorData = await response.json().catch(() => null);
          if (errorData?.error?.includes("Monthly content limit exceeded")) {
            closeModal();
            notify.error(
              "Kuukausiraja ylitetty! Voit luoda uutta sisältöä vasta ensi kuussa.",
            );
            monthlyLimit.refresh(); // Päivitä raja-tiedot
            return;
          }
          console.error("Idea generation failed:", response.status);
          // Jatketaan silti postauksen luomista
        } else {
          const result = await response.json();
        }
      } catch (webhookError) {
        console.error("Idea generation webhook error:", webhookError);
        // Jatketaan silti postauksen luomista
      }

      closeModal();
      if (count > 1) {
        notify.success(`${count} postausta lähetetty generoitavaksi`);
      } else {
        notify.success(t("posts.messages.ideaSent"));
      }
      monthlyLimit.refresh(); // Päivitä raja-tiedot onnistuneen luonnin jälkeen
    } catch (error) {
      console.error("Virhe uuden julkaisun luomisessa:", error);
      if (error.message?.includes("Monthly content limit exceeded")) {
        notify.error(
          "Kuukausiraja ylitetty! Voit luoda uutta sisältöä vasta ensi kuussa.",
        );
        monthlyLimit.refresh();
      } else {
        notify.error(t("posts.messages.errorCreating"));
      }
    }
  };

  const handleEditPost = async (post) => {
    // Jos kyseessä on Mixpost-postaus, haetaan täysi data API:sta
    if (post.source === "mixpost") {
      try {
        const token = (await supabase.auth.getSession()).data.session
          ?.access_token;
        if (!token) {
          console.error("No auth token available");
          return;
        }

        const response = await fetch("/api/integrations/mixpost/posts", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          console.error("Failed to fetch Mixpost posts:", response.status);
          return;
        }

        const data = await response.json();

        // Etsi oikea postaus ID:n perusteella
        const fullPost = data.find((p) => p.id === post.id);
        if (fullPost) {
          setEditingPost(fullPost);
          setShowEditModal(true);
          return;
        } else {
          console.error("Post not found in Mixpost data");
        }
      } catch (error) {
        console.error("Error fetching Mixpost post:", error);
      }
    }

    // Jos kyseessä on Carousel-tyyppi, haetaan segments data
    if (post.type === "Carousel" && post.source === "supabase") {
      try {
        const { data: segmentsData, error: segmentsError } = await supabase
          .from("segments")
          .select("*")
          .eq("content_id", post.id)
          .order("slide_no", { ascending: true });

        if (segmentsError) {
          console.error("Virhe segments datan haussa:", segmentsError);
        } else {
          // Lisätään segments data post-objektiin
          const postWithSegments = {
            ...post,
            segments: segmentsData || [],
            // Kopioi created_at suoraan editingPost:iin modaaleja varten
            created_at: post.originalData?.created_at || post.created_at,
          };
          setEditingPost(postWithSegments);
          setShowEditModal(true);
          return;
        }
      } catch (error) {
        console.error("Virhe segments datan haussa:", error);
      }
    }

    // Varmistetaan että originalData on mukana ja media_urls löytyy
    const postWithOriginalData = {
      ...post,
      media_urls:
        post.media_urls ||
        post.mediaUrls ||
        post.originalData?.media_urls ||
        [],
      // Kopioi created_at suoraan editingPost:iin modaaleja varten
      created_at: post.originalData?.created_at || post.created_at,
      originalData: {
        ...post,
        media_urls:
          post.media_urls ||
          post.mediaUrls ||
          post.originalData?.media_urls ||
          [],
      },
    };

    setEditingPost(postWithOriginalData);
    setShowEditModal(true);
    setEditModalStep(1);
  };

  const handleSaveEdit = async (updatedData) => {
    if (editingPost) {
      // Käsittele julkaisupäivä
      let processedUpdatedData = { ...updatedData };

      // Lisää selectedAvatar id payloadiin jos valittu (variableId tai id)
      if (selectedAvatar) {
        processedUpdatedData.selectedAvatarId = selectedAvatar;
      }

      if (updatedData.publishDate && updatedData.publishDate.trim() !== "") {
        // Jos on päivä & aika, päivitä scheduledDate
        const dateTime = new Date(updatedData.publishDate);
        processedUpdatedData.scheduledDate = dateTime
          .toISOString()
          .split("T")[0]; // YYYY-MM-DD
      } else {
        // Jos tyhjä, aseta null
        processedUpdatedData.scheduledDate = null;
      }

      // Päivitä paikallinen tila
      setPosts((prev) =>
        prev.map((post) =>
          post.id === editingPost.id
            ? { ...post, ...processedUpdatedData }
            : post,
        ),
      );

      // Päivitä myös reelsPosts jos kyseessä on reels
      if (editingPost.source === "reels") {
        setReelsPosts((prev) =>
          prev.map((post) =>
            post.id === editingPost.id
              ? { ...post, ...processedUpdatedData }
              : post,
          ),
        );
      }

      // (Avatar webhook siirretty erilliseen käsittelijään vaiheessa 2)

      // Jos voiceover on merkitty valmiiksi, kyseessä on reels-postaus JA se on "Kesken" sarakkeessa, lähetä webhook
      if (
        updatedData.voiceoverReady &&
        (editingPost.source === "reels" || editingPost.type === "Reels") &&
        (editingPost.status === "Kesken" || editingPost.source === "reels")
      ) {
        try {
          if (!orgId) {
            return;
          }

          const { data: userData, error: userError } = await supabase
            .from("users")
            .select("company_id")
            .eq("id", orgId)
            .single();

          if (userError || !userData?.company_id) {
            console.error("Could not fetch company_id:", userError);
            notify.error(t("posts.messages.errorCompanyId"));
            return;
          }

          // Hae session token
          const { data: sessionData } = await supabase.auth.getSession();
          const token = sessionData?.session?.access_token;

          if (!token) {
            throw new Error("Käyttäjä ei ole kirjautunut");
          }

          const response = await fetch("/api/webhooks/voiceover-ready", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              recordId: editingPost.id,
              voiceover: updatedData.voiceover,
              voiceoverReady: updatedData.voiceoverReady,
            }),
          });

          if (!response.ok) {
            console.error("Voiceover webhook failed:", response.status);
            // Näytä käyttäjälle virheviesti
            notify.error(t("posts.messages.voiceoverError"));
            return;
          }

          const result = await response.json();

          // Näytä käyttäjälle onnistumisviesti
          notify.success(t("posts.messages.voiceoverSuccess"));
        } catch (error) {
          console.error("Voiceover webhook error:", error);
          notify.error(t("posts.messages.voiceoverError"));
          return;
        }
      }

      // Päivitä Supabase kaikille postauksille
      try {
        if (!orgId) {
          console.error("Could not fetch user_id");
          notify.error("Käyttäjätietojen haku epäonnistui");
          return;
        }

        // Päivitetään Supabase
        const { error: updateError } = await supabase
          .from("content")
          .update({
            caption: processedUpdatedData.caption || null,
            publish_date: processedUpdatedData.publishDate || null,
            selected_avatar_id: processedUpdatedData.selectedAvatarId || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingPost.id)
          .eq("user_id", orgId);

        if (updateError) {
          console.error("Supabase update error:", updateError);
          notify.error("Tietojen tallentaminen epäonnistui");
          return;
        }

        notify.success("Tiedot tallennettu onnistuneesti");
      } catch (error) {
        console.error("Error updating Supabase:", error);
        notify.error("Tietojen tallentaminen epäonnistui");
        // Optimization #1: Virhetilanteessa palautetaan vanha data
        try {
          await fetchPosts();
          if (editingPost.source === "reels") {
            await fetchReelsPosts();
          }
        } catch (fetchError) {
          console.error("Error recovering data:", fetchError);
        }
        return;
      }

      // Optimization #1: Ei haeta dataa uudelleen onnistumisen jälkeen - optimistinen päivitys riittää

      setShowEditModal(false);
      setEditingPost(null);
    }
  };

  const handlePreview = (post) => {
    setPreviewPost(post);
    setShowPreviewModal(true);
  };

  const handleDeletePost = async (post) => {
    // Optimization #1: Optimistinen UI-päivitys - poistetaan heti näkyvistä
    const previousPosts = [...posts];
    const previousReelsPosts = [...reelsPosts];
    const wasModalOpen = editingPost && editingPost.id === post.id;

    setPosts((prev) => prev.filter((p) => p.id !== post.id));
    if (post.source === "reels") {
      setReelsPosts((prev) => prev.filter((p) => p.id !== post.id));
    }

    // Sulje modaali jos se on auki tälle postaukselle
    if (wasModalOpen) {
      setShowEditModal(false);
      setEditingPost(null);
    }

    try {
      if (!orgId) {
        throw new Error(t("error.organizationIdNotFound"));
      }

      // Muutetaan status 'Deleted':ksi sen sijaan että poistetaan rivi
      const { error: updateError } = await supabase
        .from("content")
        .update({ status: "Deleted" })
        .eq("id", post.id)
        .eq("user_id", orgId);

      if (updateError) {
        throw new Error(updateError.message);
      }

      // Optimization #1: Ei haeta dataa uudelleen onnistumisen jälkeen

      toast.success(t("posts.alerts.deleted"));
    } catch (error) {
      console.error("Delete error:", error);
      // Optimization #1: Virhetilanteessa palautetaan alkuperäinen data
      setPosts(previousPosts);
      if (post.source === "reels") {
        setReelsPosts(previousReelsPosts);
      }
      toast.error(t("posts.alerts.deleteFailed", { message: error.message }));
    }
  };

  const handleDuplicatePost = async (post) => {
    try {
      // 1. Tarkista kuukausiraja (valinnainen, jos monistus kuluttaa kiintiötä)
      if (!monthlyLimit.canCreate) {
        notify.error("Kuukausiraja täynnä, et voi monistaa postausta.");
        return;
      }

      // 2. Tarkista organisaatio ID
      if (!orgId) throw new Error(t("posts.messages.userIdNotFound"));

      // 3. Valmistele kopioitava data
      // Poistetaan ID, luontiajat ja asetetaan status 'Kesken'
      // Korjattu: ei lähetetä thumbnail-kenttää, sillä sitä ei ole content-taulussa
      // Korjattu: käytetään idea-kenttää title-sijasta (content-taulussa ei ole title-kenttää)
      // Korjattu: status 'In Progress' englanniksi kuten muissakin lisäyksissä
      // Korjattu: varmistetaan että media_urls on oikeassa muodossa (array)

      // Kokeillaan eri lähteitä media_urls:lle
      let mediaUrls = [];

      // 1. Kokeillaan post.media_urls
      if (Array.isArray(post.media_urls) && post.media_urls.length > 0) {
        mediaUrls = [...post.media_urls];
      }
      // 2. Kokeillaan post.mediaUrls
      else if (Array.isArray(post.mediaUrls) && post.mediaUrls.length > 0) {
        mediaUrls = [...post.mediaUrls];
      }
      // 3. Kokeillaan post.originalData.media_urls
      else if (
        post.originalData?.media_urls &&
        Array.isArray(post.originalData.media_urls) &&
        post.originalData.media_urls.length > 0
      ) {
        mediaUrls = [...post.originalData.media_urls];
      }
      // 4. Kokeillaan thumbnailia (jos se on URL)
      else if (
        post.thumbnail &&
        typeof post.thumbnail === "string" &&
        post.thumbnail.startsWith("http")
      ) {
        mediaUrls = [post.thumbnail];
      }
      // 5. Kokeillaan segments-taulun media_urls (Carousel-tyypeille)
      else if (
        post.type === "Carousel" &&
        post.segments &&
        post.segments.length > 0
      ) {
        mediaUrls = post.segments
          .filter((seg) => seg.media_urls && Array.isArray(seg.media_urls))
          .flatMap((seg) => seg.media_urls);
      }

      const newPostData = {
        user_id: orgId,
        type: post.type,
        idea: `${post.originalData?.idea || post.title || post.caption} (Kopio)`,
        caption: post.caption,
        media_urls: mediaUrls,
        status: "In Progress", // Palautetaan luonnokseksi (englanniksi kuten API:ssa)
        voiceover: post.voiceover,
        voiceover_ready: post.voiceoverReady,
        provider: post.provider, // Säilytetään kanava tai tyhjennetään tarvittaessa
        is_generated: false, // Lisätään kuten import-post API:ssa
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // 4. Tallenna uusi postaus Supabaseen
      const { data: insertedPost, error: insertError } = await supabase
        .from("content")
        .insert(newPostData)
        .select()
        .single();

      if (insertError) throw insertError;

      // 5. Jos kyseessä on Carousel, monista myös segmentit
      if (
        post.type === "Carousel" &&
        post.segments &&
        post.segments.length > 0
      ) {
        const newSegments = post.segments.map((seg) => ({
          content_id: insertedPost.id, // Linkitä uuteen postaukseen
          slide_no: seg.slide_no,
          title: seg.title,
          description: seg.description,
          media_urls: seg.media_urls,
          image_prompt: seg.image_prompt,
          voiceover: seg.voiceover,
        }));

        const { error: segmentsError } = await supabase
          .from("segments")
          .insert(newSegments);

        if (segmentsError)
          console.error("Error duplicating segments:", segmentsError);
      }

      // 6. Päivitä näkymä ja ilmoita käyttäjälle
      toast.success("Postaus monistettu onnistuneesti");
      monthlyLimit.refresh(); // Päivitä limiitti jos tarpeen
      await fetchPosts(); // Lataa lista uudelleen
    } catch (error) {
      console.error("Duplicate error:", error);
      notify.error("Postauksen monistaminen epäonnistui: " + error.message);
    }
  };

  const handleSchedulePost = async (
    post,
    scheduledDate = null,
    selectedAccounts = [],
  ) => {
    try {
      // Jos päivämäärää ei annettu, kysytään käyttäjältä
      if (!scheduledDate) {
        scheduledDate = prompt(
          t("posts.messages.schedulePrompt"),
          new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
        );

        if (!scheduledDate) {
          return; // Käyttäjä perui
        }
      }

      // Tarkista että on valittu vähintään yksi kanava
      if (!selectedAccounts || selectedAccounts.length === 0) {
        notify.error(t("posts.messages.selectAtLeastOneChannel"));
        return;
      }

      // Haetaan media-data suoraan Supabase:sta (sama logiikka kuin PublishModal)
      let mediaUrls = [];
      let segments = [];

      if (post.source === "supabase") {
        if (!orgId) {
          throw new Error(t("posts.messages.userIdNotFound"));
        }

        // Haetaan content data
        const { data: contentData, error: contentError } = await supabase
          .from("content")
          .select("*")
          .eq("id", post.id)
          .eq("user_id", orgId)
          .single();

        if (contentError) {
          console.error("Error fetching content:", contentError);
        } else {
          mediaUrls = contentData.media_urls || [];

          // Jos Carousel, haetaan segments data
          if (post.type === "Carousel") {
            const { data: segmentsData, error: segmentsError } = await supabase
              .from("segments")
              .select("*")
              .eq("content_id", post.id)
              .order("slide_no", { ascending: true });

            if (!segmentsError && segmentsData) {
              segments = segmentsData;
              // Kerätään kaikki media_urls segments-taulusta
              mediaUrls = segmentsData
                .filter(
                  (segment) =>
                    segment.media_urls && segment.media_urls.length > 0,
                )
                .flatMap((segment) => segment.media_urls);
            }
          }
        }
      } else {
        // Reels data
        mediaUrls = post.mediaUrls || [];
      }

      // Lähetetään data backend:iin, joka hoitaa Supabase-kyselyt (sama logiikka kuin PublishModal)
      const scheduleData = {
        post_id: post.id,
        user_id: user.id,
        auth_user_id: user.id,
        content: post.caption || post.title,
        media_urls: mediaUrls,
        scheduled_date: scheduledDate,
        publish_date: scheduledDate, // Käytetään scheduledDate myös publish_date:ksi
        post_type:
          post.type === "Reels"
            ? "reel"
            : post.type === "Carousel"
              ? "carousel"
              : "post",
        action: "schedule",
        selected_accounts: selectedAccounts, // Lisätään valitut somekanavat
      };

      // Lisää segments-data Carousel-tyyppisillä postauksilla
      if (post.type === "Carousel" && segments.length > 0) {
        scheduleData.segments = segments;
      }

      const response = await fetch("/api/social/posts/actions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify(scheduleData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Ajastus epäonnistui");
      }

      // Optimistinen UI-päivitys - siirretään postaus heti sarakkeeseen
      const updatedPost = {
        ...post,
        status: "Aikataulutettu",
        scheduledDate: scheduledDate,
        source: "mixpost",
      };

      // Päivitetään paikallinen tila heti
      setPosts((prevPosts) =>
        prevPosts.map((p) => (p.id === post.id ? updatedPost : p)),
      );

      notify.success(result.message || t("posts.messages.scheduleSuccess"));
      setShowEditModal(false);
      setEditingPost(null);

      // Haetaan data taustalla varmistamaan synkronointi
      setTimeout(async () => {
        await fetchPosts();
        if (post.source === "reels") {
          await fetchReelsPosts();
        }
      }, 1000);
    } catch (error) {
      console.error("Schedule error:", error);
      notify.error(t("posts.messages.scheduleError") + " " + error.message);
    }
  };

  const handlePublishPost = async (post) => {
    // Aseta julkaistava post ja avaa modaali
    setPublishingPost(post);
    setSelectedAccounts([]); // Tyhjennä aiemmat valinnat
    setShowPublishModal(true);

    // Optimization #3: Haetaan somekanavat vain jos ne puuttuvat
    if (socialAccounts.length === 0) {
      await fetchSocialAccounts();
    }
  };

  const handleConfirmPublish = async (publishDate) => {
    if (!publishingPost || selectedAccounts.length === 0) {
      notify.error(t("posts.messages.selectAccounts"));
      return;
    }

    try {
      // Haetaan media-data suoraan Supabase:sta
      let mediaUrls = [];
      let segments = [];

      if (publishingPost.source === "supabase") {
        if (!orgId) {
          throw new Error(t("posts.messages.userIdNotFound"));
        }

        // Haetaan content data
        const { data: contentData, error: contentError } = await supabase
          .from("content")
          .select("*")
          .eq("id", publishingPost.id)
          .eq("user_id", orgId)
          .single();

        if (contentError) {
          console.error("Error fetching content:", contentError);
        } else {
          mediaUrls = contentData.media_urls || [];

          // Jos Carousel, haetaan segments data
          if (publishingPost.type === "Carousel") {
            const { data: segmentsData, error: segmentsError } = await supabase
              .from("segments")
              .select("*")
              .eq("content_id", publishingPost.id)
              .order("slide_no", { ascending: true });

            if (!segmentsError && segmentsData) {
              segments = segmentsData;
              // Kerätään kaikki media_urls segments-taulusta
              mediaUrls = segmentsData
                .filter(
                  (segment) =>
                    segment.media_urls && segment.media_urls.length > 0,
                )
                .flatMap((segment) => segment.media_urls);
            }
          }
        }
      } else {
        // Reels data
        mediaUrls = publishingPost.mediaUrls || [];
      }

      // Lähetetään data backend:iin, joka hoitaa Supabase-kyselyt
      const publishData = {
        post_id: publishingPost.id,
        user_id: user.id,
        auth_user_id: user.id,
        content: publishingPost.caption || publishingPost.title,
        media_urls: mediaUrls,
        scheduled_date: publishingPost.scheduledDate || null,
        publish_date: publishDate || null, // Käytetään modaalista saatu publishDate
        post_type:
          publishingPost.type === "Reels"
            ? "reel"
            : publishingPost.type === "Carousel"
              ? "carousel"
              : "post",
        action: "publish",
        selected_accounts: selectedAccounts, // Lisätään valitut somekanavat
      };

      // Lisää segments-data Carousel-tyyppisillä postauksilla
      if (publishingPost.type === "Carousel" && segments.length > 0) {
        publishData.segments = segments;
      }

      // Optimization #1: Optimistinen UI-päivitys - päivitetään status heti
      const previousPosts = [...posts];
      const previousReelsPosts = [...reelsPosts];

      const newStatus =
        publishDate && new Date(publishDate) > new Date()
          ? "Aikataulutettu"
          : "Julkaistu";

      setPosts((prev) =>
        prev.map((p) =>
          p.id === publishingPost.id
            ? {
                ...p,
                status: newStatus,
                publishDate: publishDate || p.publishDate,
              }
            : p,
        ),
      );

      if (publishingPost.source === "reels") {
        setReelsPosts((prev) =>
          prev.map((p) =>
            p.id === publishingPost.id
              ? {
                  ...p,
                  status: newStatus,
                  publishDate: publishDate || p.publishDate,
                }
              : p,
          ),
        );
      }

      const response = await fetch("/api/social/posts/actions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify(publishData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Julkaisu epäonnistui");
      }

      // Optimization #1: Ei haeta dataa uudelleen onnistumisen jälkeen

      notify.success(result.message || t("posts.messages.publishSuccess"));
      setShowPublishModal(false);
      setPublishingPost(null);
      setSelectedAccounts([]);
    } catch (error) {
      console.error("Publish error:", error);
      // Optimization #1: Virhetilanteessa palautetaan alkuperäinen data
      setPosts(previousPosts);
      if (publishingPost?.source === "reels") {
        setReelsPosts(previousReelsPosts);
      }
      notify.error(t("posts.messages.publishError") + " " + error.message);
    }
  };

  const handleMoveToNext = async (post, newStatus) => {
    // Varmistetaan että kyseessä on Supabase-postaus
    if (post.source !== "supabase") {
      notify.error("Siirtyminen on mahdollista vain Supabase-postauksille");
      return;
    }

    // Optimization #1: ENSIN päivitetään UI optimistisesti
    const updatedPost = {
      ...post,
      status: newStatus,
      updated_at: new Date().toISOString(),
    };

    const previousPosts = [...posts];
    const previousEditingPost = editingPost;

    setPosts((prevPosts) =>
      prevPosts.map((p) => (p.id === post.id ? updatedPost : p)),
    );

    // Jos modaali on auki tälle postaukselle, sulje se
    // Modaalit on tarkoitettu tietyille statuksille, joten kun status muuttuu, modaali ei ole enää relevantti
    if (editingPost && editingPost.id === post.id) {
      setShowEditModal(false);
      setEditingPost(null);
    }

    // Sulje myös julkaisumodaali jos se on auki
    if (publishingPost && publishingPost.id === post.id) {
      setShowPublishModal(false);
      setPublishingPost(null);
    }

    // SITTEN lähetetään API-kutsu taustalla
    try {
      if (!orgId) {
        throw new Error(t("posts.messages.userIdNotFound"));
      }

      // Käytetään vakiota status-mappaukselle
      const supabaseStatus = POST_STATUS_REVERSE_MAP[newStatus];
      if (!supabaseStatus) {
        throw new Error("Virheellinen status: " + newStatus);
      }

      // Päivitetään Supabase
      const { error: updateError } = await supabase
        .from("content")
        .update({
          status: supabaseStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", post.id)
        .eq("user_id", orgId);

      if (updateError) {
        throw new Error(t("posts.messages.supabaseUpdateFailed"));
      }

      notify.success(`Postaus siirretty sarakkeeseen: ${newStatus}`);
    } catch (error) {
      console.error("Move to next error:", error);
      notify.error(t("posts.messages.moveError") + " " + error.message);
      // Optimization #1: Virhetilanteessa palautetaan vanha data
      setPosts(previousPosts);
      if (previousEditingPost) {
        setEditingPost(previousEditingPost);
      }
    }
  };

  const rescheduleMixpostPost = async (event, newScheduledDate) => {
    try {
      // Hae access token
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Käyttäjä ei ole kirjautunut");
      }

      const requestBody = {
        postUuid: event.uuid || event.id,
        scheduledDate: newScheduledDate,
      };

      // Kutsu API endpointia
      const response = await fetch(
        "/api/integrations/mixpost/reschedule-post",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(requestBody),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ API error response:", errorData);
        throw new Error(errorData.error || "Uudelleenajastus epäonnistui");
      }

      const result = await response.json();

      // Päivitä mixpost-postaukset
      await fetchMixpostPosts();

      return result;
    } catch (error) {
      console.error("❌ Error in rescheduleMixpostPost:", error);
      throw error;
    }
  };

  const deleteMixpostPost = async (postUuid) => {
    try {
      // Hae access token
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Käyttäjä ei ole kirjautunut");
      }

      const requestBody = { postUuid };

      // Kutsu API endpointia
      const response = await fetch("/api/integrations/mixpost/delete-post", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ API error response:", errorData);
        throw new Error(errorData.error || "Postauksen poisto epäonnistui");
      }

      const result = await response.json();

      // Päivitä paikallinen state
      await fetchPosts();
      await fetchMixpostPosts();

      return true;
    } catch (error) {
      console.error("❌ Error deleting Mixpost post:", error);
      throw error;
    }
  };

  // Kuvien hallinta content-media bucket:iin
  const handleDeleteImage = async (imageUrl, contentId) => {
    try {
      if (!orgId) {
        throw new Error("User ID not found");
      }

      const response = await fetch("/api/content/media-management", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          contentId,
          imageUrl,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Image deletion failed");
      }

      const result = await response.json();

      // Update editingPost if modal is open
      if (editingPost && editingPost.id === contentId) {
        const currentMediaUrls =
          editingPost.originalData?.media_urls ||
          editingPost.media_urls ||
          editingPost.mediaUrls ||
          [];
        const newMediaUrls = currentMediaUrls.filter((url) => url !== imageUrl);

        setEditingPost((prev) => ({
          ...prev,
          originalData: {
            ...prev.originalData,
            media_urls: newMediaUrls,
          },
          media_urls: newMediaUrls,
          mediaUrls: newMediaUrls,
          // Päivitä myös thumbnail jos se oli sama kuin poistettu kuva
          thumbnail:
            prev.thumbnail === imageUrl
              ? newMediaUrls[0] || null
              : prev.thumbnail,
        }));
      }

      // Päivitä myös posts lista
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === contentId
            ? { ...post, media_urls: result.mediaUrls }
            : post,
        ),
      );

      notify.success("Image deleted successfully!");
    } catch (error) {
      console.error("Error deleting image:", error);
      notify.error("Image deletion failed: " + error.message);
    }
  };

  const handleAddImageFromKuvapankki = async (imageUrl, contentId) => {
    // Lisää kuva kuvapankista postaukseen
    try {
      if (!orgId) {
        throw new Error("User ID not found");
      }

      // Hae session ja tarkista että se on voimassa
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();
      if (sessionError || !sessionData.session?.access_token) {
        throw new Error("Session expired or invalid. Please log in again.");
      }

      // Lisää URL suoraan media_urls arrayhin Supabase:en
      const { data: contentData, error: contentError } = await supabase
        .from("content")
        .select("media_urls")
        .eq("id", contentId)
        .eq("user_id", orgId)
        .single();

      if (contentError) {
        throw new Error("Content not found");
      }

      const currentMediaUrls = contentData.media_urls || [];
      const newMediaUrls = [...currentMediaUrls, imageUrl];

      const { error: updateError } = await supabase
        .from("content")
        .update({
          media_urls: newMediaUrls,
          updated_at: new Date().toISOString(),
        })
        .eq("id", contentId)
        .eq("user_id", orgId);

      if (updateError) {
        throw new Error(`Image addition failed: ${updateError.message}`);
      }

      // Update editingPost if modal is open
      if (editingPost && editingPost.id === contentId) {
        setEditingPost((prev) => ({
          ...prev,
          originalData: {
            ...prev.originalData,
            media_urls: newMediaUrls,
          },
          media_urls: newMediaUrls,
          mediaUrls: newMediaUrls,
        }));
      }

      // Päivitä myös posts lista
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === contentId ? { ...post, media_urls: newMediaUrls } : post,
        ),
      );

      notify.success("Kuva lisätty kuvapankista!");
      setShowKuvapankkiSelector(false);
    } catch (error) {
      console.error("Error adding image from kuvapankki:", error);
      notify.error("Kuvan lisäys epäonnistui: " + error.message);
    }
  };

  const handleAddImage = async (file, contentId) => {
    try {
      if (!orgId) {
        throw new Error("User ID not found");
      }

      const formData = new FormData();
      formData.append("image", file);
      formData.append("contentId", contentId);
      formData.append("userId", orgId);

      // Hae session ja tarkista että se on voimassa
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();
      if (sessionError || !sessionData.session?.access_token) {
        throw new Error("Session expired or invalid. Please log in again.");
      }

      // Luodaan AbortController timeout:lle
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 sekuntia timeout

      const response = await fetch("/api/content/media-management", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || "Image addition failed");
      }

      const result = await response.json();

      // Update editingPost if modal is open
      if (editingPost && editingPost.id === contentId) {
        const currentMediaUrls =
          editingPost.originalData?.media_urls ||
          editingPost.media_urls ||
          editingPost.mediaUrls ||
          [];
        const newMediaUrls = [...currentMediaUrls, result.publicUrl];

        setEditingPost((prev) => ({
          ...prev,
          originalData: {
            ...prev.originalData,
            media_urls: newMediaUrls,
          },
          media_urls: newMediaUrls,
          mediaUrls: newMediaUrls,
        }));
      }

      // Päivitä myös posts lista
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === contentId ? { ...post, media_urls: newMediaUrls } : post,
        ),
      );

      notify.success("Image added successfully!");
    } catch (error) {
      console.error("Error adding image:", error);

      let errorMessage = "Image addition failed: " + error.message;

      // Jos timeout, anna selkeämpi viesti
      if (error.name === "AbortError") {
        errorMessage =
          "Image upload timed out. Please try again with a smaller image.";
      }

      // Jos network error, anna selkeämpi viesti
      if (
        error.message.includes("Failed to fetch") ||
        error.message.includes("NetworkError")
      ) {
        errorMessage =
          "Network error. Please check your internet connection and try again.";
      }

      notify.error(errorMessage);

      // Näytä toast käyttäjälle
      toast.error(t("errors.imageUploadError", { error: errorMessage }));

      // Jos session on vanhentunut, ohjaa takaisin login-sivulle
      if (error.message.includes("Session expired")) {
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
      }
    }
  };

  // Image drag & drop handlers (for adding images to posts)
  const handleImageDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add("drag-over");
  };

  const handleImageDragLeave = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove("drag-over");
  };

  const handleImageDrop = (e, contentId) => {
    e.preventDefault();
    e.currentTarget.classList.remove("drag-over");

    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));

    if (imageFiles.length > 0) {
      imageFiles.forEach((file) => {
        handleAddImage(file, contentId);
      });
    }
  };

  // ESC-näppäimellä sulkeutuminen
  useEscapeKey(() => {
    if (showEditModal) {
      setShowEditModal(false);
      setEditingPost(null);
    }
    if (isOpen("create") || isOpen("upload") || isOpen("schedule")) {
      closeModal();
    }
  });

  // Keyboard shortcuts
  useKeyboardShortcuts({
    "cmd+k": () => {
      // Focus search input
      const searchInput = document.querySelector('input[type="text"]');
      if (searchInput) {
        searchInput.focus();
      }
    },
    "cmd+shift+p": () => {
      // Open create modal (Shift+P = Post, avoids incognito conflict)
      if (monthlyLimit.canCreate) {
        openModal({ type: "create", count: 1 });
      }
    },
    "cmd+i": () => {
      // Open import modal
      openModal({ type: "upload" });
    },
    "cmd+h": () => {
      // Show keyboard shortcuts help (H = Help, easier on Finnish keyboard)
      setShowShortcutsModal(true);
    },
  });

  // Merkkien laskenta "Valmiina julkaisuun" (Tarkistuksessa) sarakkeelle
  useEffect(() => {
    if (
      showEditModal &&
      editingPost &&
      editingPost.status === "Tarkistuksessa"
    ) {
      const textarea = textareaRef.current;
      const charCount = charCountRef.current;

      if (textarea && charCount) {
        const updateCharCount = () => {
          const count = textarea.value.length;
          charCount.textContent = count;

          // Vaihda väriä jos yli 2000 merkkiä
          if (count > 2000) {
            charCount.style.color = "#ef4444";
          } else if (count > 1800) {
            charCount.style.color = "#f59e0b";
          } else {
            charCount.style.color = "#3B82F6";
          }
        };

        textarea.addEventListener("input", updateCharCount);
        updateCharCount(); // Alustetaan laskenta

        return () => textarea.removeEventListener("input", updateCharCount);
      }
    }
  }, [showEditModal, editingPost]);

  return (
    <>
      {/* Floating Keyboard Shortcut Hint */}
      <button
        onClick={() => setShowShortcutsModal(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-gray-900 hover:bg-black text-white rounded-2xl shadow-2xl shadow-gray-900/20 transition-all hover:scale-105 active:scale-95 group"
        title={t("shortcuts.showHelp") || "Näytä pikanäppäimet"}
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
        <span className="text-xs font-bold hidden sm:inline">
          <kbd className="px-2 py-0.5 bg-white/20 rounded text-[10px]">
            {navigator.platform.toUpperCase().indexOf("MAC") >= 0
              ? "⌘"
              : "Ctrl"}
          </kbd>{" "}
          + <kbd className="px-2 py-0.5 bg-white/20 rounded text-[10px]">H</kbd>
        </span>
        <span className="text-xs font-bold sm:hidden">?</span>
      </button>

      <div className="p-3 sm:p-6 lg:p-12 max-w-[1700px] mx-auto min-h-screen space-y-6 sm:space-y-8 lg:space-y-12">
        {/* Page Header */}
        <PostHeader
          t={t}
          monthlyLimit={monthlyLimit}
          nextMonthQuota={nextMonthQuota}
        />

        {/* Tab Navigation & Action Bar Container */}
        <div className="bg-white/60 backdrop-blur-xl rounded-[32px] border border-gray-100 shadow-xl shadow-gray-200/10 p-2 sm:p-3 flex flex-col sm:flex-row gap-2 sm:gap-6 justify-between items-stretch sm:items-center sticky top-4 z-40 transition-all hover:shadow-2xl overflow-hidden">
          <PostTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            t={t}
            user={user}
          />
          <PostActions
            onImageBankClick={() => setShowImageBankModal(true)}
            onImportClick={() => openModal({ type: "upload" })}
            onGenerateClick={() => {
              if (monthlyLimit.canCreate) {
                openModal({ type: "create", count: 1 });
              } else {
                notify.error(t("posts.errors.monthlyLimitReached"));
              }
            }}
            t={t}
            userAccountType={userAccountType}
            canCreate={monthlyLimit.canCreate}
          />
        </div>

        {/* Search and Filters Bar */}
        <PostFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          typeFilter={typeFilter}
          onTypeChange={setTypeFilter}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          t={t}
          show={activeTab !== "ugc"}
          counts={filterCounts}
        />

        {/* Error State */}
        {currentError && (
          <div className="bg-red-50/50 border border-red-100 rounded-[40px] p-12 text-center animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-white rounded-3xl shadow-xl shadow-red-200/50 flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-10 h-10 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {t("posts.errors.error")}
            </h3>
            <p className="text-red-600 font-medium mb-8 max-w-md mx-auto">
              {currentError}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-widest rounded-2xl shadow-xl shadow-red-200 transition-all hover:scale-105 active:scale-95"
            >
              {t("posts.actions.retry")}
            </button>
          </div>
        )}

        {/* Content Views */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Kanban Board */}
          {!currentError && !currentLoading && activeTab === "kanban" && (
            <KanbanTab
              posts={filteredPosts}
              onEdit={handleEditPost}
              onDelete={handleDeletePost}
              onDuplicate={handleDuplicatePost}
              onPublish={handlePublishPost}
              onSchedule={handleSchedulePost}
              onMoveToNext={handleMoveToNext}
              onPreview={handlePreview}
              t={t}
              onDeleteMixpostPost={deleteMixpostPost}
              onRefreshPosts={async () => {
                await fetchPosts();
                await fetchReelsPosts();
                await fetchMixpostPosts();
              }}
            />
          )}

          {/* Carousels View */}
          {activeTab === "carousels" && (
            <CarouselsTab
              posts={filteredPosts}
              onEdit={handleEditPost}
              onDelete={handleDeletePost}
              onPublish={handlePublishPost}
              onSchedule={handleSchedulePost}
              onMoveToNext={handleMoveToNext}
              t={t}
            />
          )}

          {/* Calendar View */}
          {activeTab === "calendar" && (
            <div className="calendar-wrapper">
              <PostsCalendar
                items={calendarItems}
                readyPosts={readyPosts}
                onSchedulePost={handleSchedulePost}
                onReschedulePost={rescheduleMixpostPost}
                socialAccounts={socialAccounts}
                selectedAccounts={selectedAccounts}
                setSelectedAccounts={setSelectedAccounts}
                loadingAccounts={loadingAccounts}
                onFetchSocialAccounts={fetchSocialAccounts}
                onRefresh={async () => {
                  setRefreshingCalendar(true);
                  try {
                    await fetchPosts();
                    await fetchReelsPosts();
                    await fetchMixpostPosts();
                  } catch (error) {
                    console.error("Error refreshing calendar:", error);
                  } finally {
                    setRefreshingCalendar(false);
                  }
                }}
                refreshing={refreshingCalendar}
                onEventClick={(ev) => {
                  // Etsi vastaava postaus kaikista nykyisistä posteista
                  const post = allPosts.find((p) => p.id === ev.id);
                  if (post) {
                    handleEditPost(post);
                  }
                }}
              />
            </div>
          )}

          {/* UGC View */}
          {activeTab === "ugc" && <UgcTab />}
        </div>

        {/* Create Modal - Refactored */}
        <CreatePostModal
          show={isOpen("create")}
          onClose={closeModal}
          onSubmit={handleCreatePost}
          t={t}
          toast={toast}
        />

        {/* Upload Modal - Refactored */}
        <UploadPostModal
          show={isOpen("upload")}
          onClose={closeModal}
          onSuccess={() => {
            fetchPosts();
            closeModal();
          }}
          t={t}
          toast={toast}
        />

        {/* OLD Upload Modal - TO BE REMOVED */}
        {false &&
          showUploadModal &&
          createPortal(
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <div
                className="absolute inset-0 bg-gray-900/40 backdrop-blur-md animate-in fade-in duration-300"
                onClick={() => {}}
              />
              <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl shadow-emerald-500/10 border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-6 py-6 border-b border-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                        ></path>
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        {t("posts.importModal.title")}
                      </h2>
                      <p className="text-xs text-gray-500 font-medium">
                        Tuo omaa mediatiedostoa
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowUploadModal(false)}
                    className="p-2 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-gray-900 transition-colors"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      ></path>
                    </svg>
                  </button>
                </div>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    try {
                      setUploadLoading(true);
                      const { data: sessionData } =
                        await supabase.auth.getSession();
                      if (!sessionData?.session?.access_token)
                        throw new Error(t("posts.errors.loginRequired"));

                      const response = await axios.post(
                        "/api/content/import-post",
                        formData,
                        {
                          headers: {
                            Authorization: `Bearer ${sessionData.session.access_token}`,
                            "Content-Type": "multipart/form-data",
                          },
                          timeout: 60000,
                        },
                      );

                      if (response.data.success) {
                        setShowUploadModal(false);
                        setUploadPreviewUrl(null);
                        toast.success(t("posts.errors.importSuccess"));
                        await fetchPosts();
                      } else
                        throw new Error(
                          response.data.error || t("posts.errors.importFailed"),
                        );
                    } catch (error) {
                      toast.error(error.response?.data?.error || error.message);
                      notify.error(error.message);
                    } finally {
                      setUploadLoading(false);
                    }
                  }}
                  className="p-6 space-y-6"
                >
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">
                        {t("posts.importModal.fields.type")}
                      </label>
                      <select
                        name="type"
                        required
                        className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-emerald-500 outline-none transition-all text-sm font-medium appearance-none cursor-pointer"
                      >
                        <option value="Photo">
                          {t("posts.typeOptions.photo")}
                        </option>
                        <option value="Reels">
                          {t("posts.typeOptions.reels")}
                        </option>
                        <option value="LinkedIn">
                          {t("posts.typeOptions.linkedin")}
                        </option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">
                        {t("posts.importModal.fields.media")}
                      </label>
                      <div
                        className={`relative aspect-video rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center p-4 ${
                          uploadDragActive
                            ? "border-emerald-500 bg-emerald-50/50"
                            : "border-gray-200 hover:border-gray-300 bg-gray-50/30"
                        }`}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setUploadDragActive(true);
                        }}
                        onDragLeave={() => setUploadDragActive(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setUploadDragActive(false);
                          const file = e.dataTransfer.files?.[0];
                          if (file) {
                            if (fileInputRef.current) {
                              const dt = new DataTransfer();
                              dt.items.add(file);
                              fileInputRef.current.files = dt.files;
                            }
                            if (file.type.startsWith("image/")) {
                              const r = new FileReader();
                              r.onload = (e) =>
                                setUploadPreviewUrl(e.target.result);
                              r.readAsDataURL(file);
                            } else if (file.type.startsWith("video/"))
                              setUploadPreviewUrl(URL.createObjectURL(file));
                          }
                        }}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {uploadPreviewUrl ? (
                          <div className="absolute inset-0 group">
                            {uploadPreviewUrl.startsWith("blob:") ? (
                              <video
                                src={uploadPreviewUrl}
                                className="w-full h-full object-cover"
                                controls
                              />
                            ) : (
                              <img
                                src={uploadPreviewUrl}
                                alt="Preview"
                                className="w-full h-full object-cover"
                              />
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setUploadPreviewUrl(null);
                                if (fileInputRef.current)
                                  fileInputRef.current.value = "";
                              }}
                              className="absolute top-2 right-2 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-colors"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="text-center">
                            <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mx-auto mb-3">
                              <svg
                                className="w-6 h-6 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                ></path>
                              </svg>
                            </div>
                            <p className="text-xs font-bold text-gray-900 mb-1">
                              {t("posts.upload.dropzone")}
                            </p>
                            <p className="text-[10px] text-gray-400">
                              {t("posts.upload.hint")}
                            </p>
                          </div>
                        )}
                      </div>
                      <input
                        ref={fileInputRef}
                        name="file"
                        type="file"
                        accept="image/*,video/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.type.startsWith("image/")) {
                              const reader = new FileReader();
                              reader.onload = (ev) =>
                                setUploadPreviewUrl(ev.target.result);
                              reader.readAsDataURL(file);
                            } else if (file.type.startsWith("video/"))
                              setUploadPreviewUrl(URL.createObjectURL(file));
                          }
                        }}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">
                        {t("posts.importModal.fields.title")}
                      </label>
                      <input
                        name="title"
                        type="text"
                        className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-emerald-500 text-sm font-medium outline-none transition-all"
                        placeholder={t("posts.importModal.placeholders.title")}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">
                        {t("posts.importModal.fields.caption")}
                      </label>
                      <textarea
                        name="caption"
                        rows={4}
                        className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-emerald-500 text-sm font-medium outline-none transition-all resize-none"
                        placeholder={t("placeholders.writeContent")}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowUploadModal(false)}
                      className="flex-1 py-3 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors"
                    >
                      Peruuta
                    </button>
                    <button
                      type="submit"
                      disabled={uploadLoading}
                      className="flex-[2] py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-sm shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                    >
                      {uploadLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Tuodaan...
                        </>
                      ) : (
                        t("posts.buttons.import")
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>,
            document.body,
          )}

        {/* Kesken Modal */}
        <KeskenModal
          show={
            showEditModal &&
            editingPost &&
            editingPost.status === "Kesken" &&
            editingPost.source === "supabase"
          }
          editingPost={editingPost}
          user={user}
          userAccountType={userAccountType}
          onClose={() => {
            setShowEditModal(false);
            setEditingPost(null);
          }}
          onSave={(updatedPost) => {
            if (updatedPost) {
              // Päivitä editingPost state uudella datalla
              setEditingPost(updatedPost);
              notify.success("Kuva vaihdettu onnistuneesti");

              // Päivitä myös posts-lista uudella datalla
              setPosts((prevPosts) =>
                prevPosts.map((post) =>
                  post.id === updatedPost.id ? updatedPost : post,
                ),
              );

              // Älä sulje modaalia kun kuva vaihdetaan - anna käyttäjän nähdä uusi kuva
              // Modaali pysyy auki kunnes käyttäjä sulkee sen manuaalisesti
            } else {
              notify.success("Tiedot tallennettu onnistuneesti");
              setShowEditModal(false);
              setEditingPost(null);
              fetchPosts();
            }
          }}
          t={t}
        />

        {/* Tarkistuksessa Modal */}
        <TarkistuksessaModal
          show={
            showEditModal &&
            editingPost &&
            editingPost.status === "Tarkistuksessa"
          }
          editingPost={editingPost}
          onClose={() => {
            setShowEditModal(false);
            setEditingPost(null);
          }}
          onPublish={() => {
            setShowEditModal(false);
            setEditingPost(null);
            handlePublishPost(editingPost);
          }}
          t={t}
        />

        {/* Aikataulutettu Modal */}
        <AikataulutettuModal
          show={
            showEditModal &&
            editingPost &&
            (editingPost.source === "mixpost" ||
              editingPost.status === "Aikataulutettu" ||
              editingPost.status === "Luonnos")
          }
          editingPost={editingPost}
          onClose={() => {
            setShowEditModal(false);
            setEditingPost(null);
          }}
          onEdit={async (result) => {
            // Jos postaus ajastettiin Supabase-postauksesta, muunnetaan se Mixpost-postauksen muotoon
            // ja lisätään se mixpostPosts-listaan heti, jotta se näkyy "Aikataulutettu" -sarakkeessa
            if (result && result.wasScheduled && result.originalPost) {
              const originalPost = result.originalPost;

              // Muunnetaan Supabase-postaus Mixpost-postauksen muotoon
              const mixpostPost = {
                id: result.mixpostUuid || originalPost.id,
                uuid: result.mixpostUuid || originalPost.id,
                title:
                  originalPost.title || originalPost.caption || "Ei otsikkoa",
                caption: originalPost.caption || "",
                status: "Aikataulutettu",
                source: "mixpost",
                thumbnail: originalPost.thumbnail || null,
                type: originalPost.type || "Photo",
                scheduled_at: result.scheduledAt || null,
                createdAt:
                  originalPost.createdAt ||
                  new Date().toISOString().split("T")[0],
                accounts: originalPost.accounts || [],
                versions: originalPost.versions || [],
                publishDate: result.scheduledAt
                  ? new Date(result.scheduledAt).toISOString().slice(0, 16)
                  : null,
                mediaUrls:
                  originalPost.mediaUrls || originalPost.media_urls || [],
                media_urls:
                  originalPost.mediaUrls || originalPost.media_urls || [],
                originalData: originalPost.originalData || {},
              };

              // Poistetaan postaus posts-listasta
              setPosts((prevPosts) =>
                prevPosts.filter((p) => p.id !== originalPost.id),
              );

              // Lisätään se mixpostPosts-listaan heti
              setMixpostPosts((prevPosts) => {
                // Varmistetaan ettei postaus ole jo listassa
                const exists = prevPosts.some(
                  (p) => p.uuid === mixpostPost.uuid || p.id === mixpostPost.id,
                );
                if (exists) {
                  // Päivitetään olemassa oleva postaus
                  return prevPosts.map((p) =>
                    p.uuid === mixpostPost.uuid || p.id === mixpostPost.id
                      ? mixpostPost
                      : p,
                  );
                }
                // Lisätään uusi postaus
                return [...prevPosts, mixpostPost];
              });

              // Haetaan Mixpost-postaukset taustalla varmistamaan synkronointi
              fetchMixpostPosts().catch(() => {
                // Haku epäonnistui, mutta postaus näkyy jo listassa
              });
            } else {
              // Muuten päivitetään molemmat datalähteet
              await Promise.all([fetchPosts(), fetchMixpostPosts()]);
            }

            setShowEditModal(false);
            setEditingPost(null);
          }}
          t={t}
        />

        {/* Yleinen Edit Modal - poistettu, korvattu sarakkeittain */}
        {false &&
          showEditModal &&
          editingPost &&
          editingPost.type !== "Avatar" &&
          editingPost.type !== "Reels" &&
          createPortal(
            <div
              className="modal-overlay modal-overlay--light"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setShowEditModal(false);
                  setEditingPost(null);
                }
              }}
            >
              <div className="modal-container edit-post-modal">
                <div className="modal-header">
                  <h2 className="modal-title">
                    {editingPost.status === "Tarkistuksessa"
                      ? t("posts.modals.viewTitle")
                      : t("posts.modals.editTitle")}
                  </h2>
                  {/* Vaihe-indikaattori */}
                  {false &&
                    editingPost.status === "Kesken" &&
                    editingPost.source === "reels" && (
                      <div className="status-indicator">
                        <div
                          className={`status-dot ${editModalStep === 1 ? "active" : ""}`}
                        ></div>
                        <div
                          className={`status-dot ${editModalStep === 2 ? "active" : ""}`}
                        ></div>
                      </div>
                    )}
                  {/* Debug: Näytä status */}
                  <div className="status-info text-xs text-gray-500 mb-2">
                    Status: {editingPost.status} | Source: {editingPost.source}{" "}
                    | Type: {editingPost.type} | Segments:{" "}
                    {editingPost.segments?.length || 0}
                  </div>
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingPost(null);
                      setEditModalStep(1);
                      setSelectedAvatar(null);
                    }}
                    className="modal-close-btn"
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
                <div className="modal-content">
                  {/* Vaihe 1: Voiceover-tarkistus */}
                  {editModalStep === 1 && (
                    <form
                      ref={editFormRef}
                      onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.target);

                        // Jos kyseessä on reels-postaus, siirry vaiheeseen 2
                        if (editingPost.source === "reels") {
                          setEditModalStep(2);
                          return;
                        }

                        // Muuten tallenna normaalisti
                        handleSaveEdit({
                          title: formData.get("title"),
                          caption: formData.get("caption"),
                          voiceover: formData.get("voiceover"),
                          publishDate: formData.get("publishDate"),
                          voiceoverReady:
                            formData.get("voiceoverReady") === "on",
                          type: formData.get("type"),
                          status: formData.get("status"),
                        });
                      }}
                    >
                      {/* Kaksi saraketta: media vasemmalle, kentät oikealle */}
                      <div className="edit-modal-grid">
                        <div className="edit-modal-media">
                          <div className="video-player">
                            <div className="video-container">
                              {(() => {
                                // Carousel: Näytä slideshow segments-taulusta
                                if (
                                  editingPost.type === "Carousel" &&
                                  editingPost.segments &&
                                  editingPost.segments.length > 0
                                ) {
                                  const slidesWithMedia =
                                    editingPost.segments.filter(
                                      (segment) =>
                                        segment.media_urls &&
                                        segment.media_urls.length > 0,
                                    );
                                  if (slidesWithMedia.length === 0) {
                                    return (
                                      <div className="no-media-message">
                                        <span>Dokumentti</span>
                                        <p>
                                          Ei mediaa saatavilla segments-taulusta
                                        </p>
                                      </div>
                                    );
                                  }

                                  return (
                                    <div className="carousel-slideshow">
                                      <div
                                        className="slideshow-container"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        {/* Vasen nuoli */}
                                        <button
                                          type="button"
                                          className="slideshow-arrow slideshow-arrow-left"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            e.preventDefault();
                                            const currentSlide =
                                              editingPost.currentSlide || 0;
                                            const newSlide =
                                              currentSlide > 0
                                                ? currentSlide - 1
                                                : slidesWithMedia.length - 1;
                                            setEditingPost((prev) => ({
                                              ...prev,
                                              currentSlide: newSlide,
                                            }));
                                          }}
                                        >
                                          ‹
                                        </button>

                                        {/* Oikea nuoli */}
                                        <button
                                          type="button"
                                          className="slideshow-arrow slideshow-arrow-right"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            e.preventDefault();
                                            const currentSlide =
                                              editingPost.currentSlide || 0;
                                            const newSlide =
                                              currentSlide <
                                              slidesWithMedia.length - 1
                                                ? currentSlide + 1
                                                : 0;
                                            setEditingPost((prev) => ({
                                              ...prev,
                                              currentSlide: newSlide,
                                            }));
                                          }}
                                        >
                                          ›
                                        </button>

                                        {/* Nykyinen slide */}
                                        <div className="slide-display">
                                          {(() => {
                                            const currentMedia =
                                              slidesWithMedia[
                                                editingPost.currentSlide || 0
                                              ].media_urls[0];
                                            const isVideo =
                                              currentMedia &&
                                              (currentMedia.includes(".mp4") ||
                                                currentMedia.includes(
                                                  ".webm",
                                                ) ||
                                                currentMedia.includes(".mov") ||
                                                currentMedia.includes(".avi"));

                                            if (isVideo) {
                                              return (
                                                <div className="video-wrapper">
                                                  <video
                                                    src={currentMedia}
                                                    className="slide-video"
                                                    controls
                                                    onError={(e) => {
                                                      if (
                                                        e.target &&
                                                        e.target.style
                                                      ) {
                                                        e.target.style.display =
                                                          "none";
                                                      }
                                                      if (
                                                        e.target &&
                                                        e.target.nextSibling &&
                                                        e.target.nextSibling
                                                          .style
                                                      ) {
                                                        e.target.nextSibling.style.display =
                                                          "block";
                                                      }
                                                    }}
                                                  >
                                                    Your browser does not
                                                    support the video tag.
                                                  </video>
                                                  <div className="video-fallback hidden">
                                                    <div className="placeholder-icon">
                                                      Video
                                                    </div>
                                                    <div className="placeholder-text">
                                                      Video ei saatavilla
                                                    </div>
                                                  </div>
                                                </div>
                                              );
                                            } else {
                                              return (
                                                <div>
                                                  <img
                                                    src={currentMedia}
                                                    alt={`Slide ${slidesWithMedia[editingPost.currentSlide || 0].slide_no}`}
                                                    className="slide-image"
                                                    onError={(e) => {
                                                      if (
                                                        e.target &&
                                                        e.target.style
                                                      ) {
                                                        e.target.style.display =
                                                          "none";
                                                      }
                                                      if (
                                                        e.target &&
                                                        e.target.nextSibling &&
                                                        e.target.nextSibling
                                                          .style
                                                      ) {
                                                        e.target.nextSibling.style.display =
                                                          "flex";
                                                      }
                                                    }}
                                                  />
                                                  <div className="video-fallback hidden">
                                                    <div className="placeholder-icon">
                                                      Kuva
                                                    </div>
                                                    <div className="placeholder-text">
                                                      Kuva ei saatavilla
                                                    </div>
                                                  </div>
                                                </div>
                                              );
                                            }
                                          })()}
                                        </div>

                                        {/* Pallot alapuolella */}
                                        <div className="slideshow-dots">
                                          {slidesWithMedia.map((_, index) => (
                                            <button
                                              key={index}
                                              type="button"
                                              className={`slideshow-dot ${index === (editingPost.currentSlide || 0) ? "active" : ""}`}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                e.preventDefault();
                                                setEditingPost((prev) => ({
                                                  ...prev,
                                                  currentSlide: index,
                                                }));
                                              }}
                                            >
                                              {index + 1}
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                }

                                // Avatar: Show image
                                if (editingPost.type === "Avatar") {
                                  // Get media URLs from the correct source
                                  let mediaUrls =
                                    editingPost.originalData?.media_urls ||
                                    editingPost.originalData?.mediaUrls ||
                                    editingPost.media_urls ||
                                    editingPost.mediaUrls ||
                                    [];

                                  // If mediaUrls is empty but thumbnail exists, use thumbnail
                                  if (
                                    mediaUrls.length === 0 &&
                                    editingPost.thumbnail
                                  ) {
                                    mediaUrls = [editingPost.thumbnail];
                                  }

                                  if (mediaUrls.length === 0) {
                                    return (
                                      <div className="content-media-management">
                                        <div className="placeholder-media">
                                          <div className="placeholder-icon">
                                            🖼️
                                          </div>
                                          <div className="placeholder-text">
                                            Avatar-kuva ei saatavilla
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  }

                                  return (
                                    <div className="content-media-management">
                                      <div className="avatar-preview">
                                        <img
                                          src={mediaUrls[0]}
                                          alt="Avatar"
                                          className="avatar-image"
                                          onError={(e) => {
                                            if (e.target && e.target.style) {
                                              e.target.style.display = "none";
                                            }
                                            if (
                                              e.target &&
                                              e.target.nextSibling &&
                                              e.target.nextSibling.style
                                            ) {
                                              e.target.nextSibling.style.display =
                                                "flex";
                                            }
                                          }}
                                        />
                                        <div className="video-fallback hidden">
                                          <div className="placeholder-icon">
                                            🖼️
                                          </div>
                                          <div className="placeholder-text">
                                            Avatar-kuva ei latautunut
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                }

                                // Carousel: Show images and management
                                if (editingPost.type === "Carousel") {
                                  // Get media URLs from the correct source - use thumbnail if media_urls is empty
                                  let mediaUrls =
                                    editingPost.originalData?.media_urls ||
                                    editingPost.originalData?.mediaUrls ||
                                    editingPost.media_urls ||
                                    editingPost.mediaUrls ||
                                    [];

                                  // If mediaUrls is empty but thumbnail exists, use thumbnail
                                  if (
                                    mediaUrls.length === 0 &&
                                    editingPost.thumbnail
                                  ) {
                                    mediaUrls = [editingPost.thumbnail];
                                  }

                                  if (mediaUrls.length === 0) {
                                    return (
                                      <div className="content-media-management">
                                        <div
                                          className="drag-drop-zone"
                                          onDragOver={handleImageDragOver}
                                          onDragLeave={handleImageDragLeave}
                                          onDrop={(e) =>
                                            handleImageDrop(e, editingPost.id)
                                          }
                                        >
                                          <div className="drag-drop-content">
                                            <div className="drag-drop-icon">
                                              📁
                                            </div>
                                            <h3>No images yet</h3>
                                            <p>
                                              Drag & drop images here or click
                                              to browse
                                            </p>
                                            <input
                                              type="file"
                                              accept="image/*"
                                              multiple
                                              onChange={(e) => {
                                                if (
                                                  e.target.files?.length > 0
                                                ) {
                                                  Array.from(
                                                    e.target.files,
                                                  ).forEach((file) => {
                                                    handleAddImage(
                                                      file,
                                                      editingPost.id,
                                                    );
                                                  });
                                                }
                                              }}
                                              className="file-input-hidden"
                                              id="image-upload"
                                            />
                                            <label
                                              htmlFor="image-upload"
                                              className="upload-button"
                                            >
                                              Browse Files
                                            </label>
                                            {userAccountType ===
                                              "personal_brand" && (
                                              <button
                                                type="button"
                                                className="upload-button mt-2 bg-violet-500"
                                                onClick={() =>
                                                  setShowKuvapankkiSelector(
                                                    true,
                                                  )
                                                }
                                              >
                                                Valitse kuvapankista
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  }

                                  return (
                                    <div className="content-media-management">
                                      <div className="media-gallery">
                                        {mediaUrls.map((imageUrl, index) => (
                                          <div
                                            key={index}
                                            className="media-item"
                                          >
                                            <img
                                              src={imageUrl}
                                              alt={`Image ${index + 1}`}
                                              className="media-image"
                                              onError={(e) => {
                                                if (
                                                  e.target &&
                                                  e.target.style
                                                ) {
                                                  e.target.style.display =
                                                    "none";
                                                }
                                                if (
                                                  e.target &&
                                                  e.target.nextSibling &&
                                                  e.target.nextSibling.style
                                                ) {
                                                  e.target.nextSibling.style.display =
                                                    "flex";
                                                }
                                              }}
                                            />
                                            <div className="media-fallback hidden">
                                              <div className="placeholder-icon">
                                                Image
                                              </div>
                                              <div className="placeholder-text">
                                                Image not available
                                              </div>
                                            </div>
                                            <button
                                              type="button"
                                              className="delete-image-btn"
                                              onClick={() =>
                                                handleDeleteImage(
                                                  imageUrl,
                                                  editingPost.id,
                                                )
                                              }
                                              title="Delete image"
                                            >
                                              <svg
                                                width="20"
                                                height="20"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                              >
                                                <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14Z" />
                                                <path d="M10 11v6M14 11v6" />
                                              </svg>
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                      {userAccountType === "personal_brand" && (
                                        <button
                                          type="button"
                                          className="upload-button mt-3 bg-violet-500 w-full"
                                          onClick={() =>
                                            setShowKuvapankkiSelector(true)
                                          }
                                        >
                                          {t("posts.buttons.addFromImageBank")}
                                        </button>
                                      )}
                                    </div>
                                  );
                                }

                                // Video: Toisto - käytä media_urls kenttää
                                const mediaUrls =
                                  editingPost.media_urls ||
                                  editingPost.mediaUrls ||
                                  editingPost.originalData?.media_urls ||
                                  [];

                                const videoUrl = mediaUrls.find(
                                  (url) =>
                                    url &&
                                    (url.includes(".mp4") ||
                                      url.includes(".webm") ||
                                      url.includes(".mov") ||
                                      url.includes(".avi")),
                                );

                                if (videoUrl) {
                                  return (
                                    <video
                                      src={videoUrl}
                                      controls
                                      className="video-element"
                                    >
                                      Your browser does not support the video
                                      tag.
                                    </video>
                                  );
                                }

                                // Fallback: käytä thumbnail kenttää jos se on video
                                if (
                                  editingPost.thumbnail &&
                                  (editingPost.thumbnail.includes(".mp4") ||
                                    editingPost.thumbnail.includes(".webm") ||
                                    editingPost.thumbnail.includes(".mov") ||
                                    editingPost.thumbnail.includes(".avi"))
                                ) {
                                  return (
                                    <video
                                      src={editingPost.thumbnail}
                                      controls
                                      className="video-element"
                                    >
                                      Your browser does not support the video
                                      tag.
                                    </video>
                                  );
                                }

                                // Kuva: Vain preview - käytä mediaUrls kenttää
                                const imageUrl = mediaUrls.find(
                                  (url) =>
                                    url &&
                                    !url.includes(".mp4") &&
                                    !url.includes(".webm") &&
                                    !url.includes(".mov") &&
                                    !url.includes(".avi"),
                                );

                                if (imageUrl) {
                                  return (
                                    <img
                                      src={imageUrl}
                                      alt="thumbnail"
                                      className="video-element"
                                    />
                                  );
                                }

                                // Fallback: käytä thumbnail kenttää jos mediaUrls on tyhjä
                                if (
                                  editingPost.thumbnail &&
                                  editingPost.thumbnail !== "/placeholder.png"
                                ) {
                                  return (
                                    <img
                                      src={editingPost.thumbnail}
                                      alt="thumbnail"
                                      className="video-element"
                                    />
                                  );
                                }

                                // Placeholder jos ei mediaa
                                return (
                                  <div className="video-placeholder">
                                    <span className="video-icon">Video</span>
                                    <p>Ei videota saatavilla</p>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        </div>

                        <div className="edit-modal-fields">
                          {/* Tabs */}
                          <div className="content-tabs">
                            <Button
                              type="button"
                              variant="primary"
                              className="button-primary-inline"
                            >
                              Sisältö
                            </Button>
                            <Button
                              type="button"
                              variant="secondary"
                              className="button-primary-inline"
                            >
                              Status
                            </Button>
                          </div>

                          {/* Content Fields */}
                          <div className="content-fields">
                            {/* Avatar/Reels: Ei näytetä tässä, vaan AvatarModal-komponentissa */}

                            {/* Muut Kesken: Postauksen sisältö muokattava */}
                            {editingPost.status === "Kesken" &&
                              !(
                                editingPost.source === "reels" ||
                                editingPost.type === "Reels" ||
                                editingPost.type === "Avatar"
                              ) && (
                                <div className="form-group">
                                  <label className="form-label">
                                    Postauksen sisältö
                                  </label>
                                  <textarea
                                    name="caption"
                                    rows={6}
                                    className="form-textarea"
                                    defaultValue={editingPost.caption || ""}
                                    placeholder={t("placeholders.writeContent")}
                                  />
                                </div>
                              )}

                            {/* "Valmiina julkaisuun" sarakkeessa: Read-only näkymä + voiceover (vain luku) */}
                            {(editingPost.status === "Tarkistuksessa" ||
                              editingPost.status === "Under Review" ||
                              editingPost.originalData?.status ===
                                "Under Review") && (
                              <>
                                <div className="form-group">
                                  <label className="form-label">
                                    Kuvaus
                                    <span
                                      ref={charCountRef}
                                      className="char-count char-count-inline"
                                    ></span>
                                  </label>
                                  <textarea
                                    ref={textareaRef}
                                    name="caption"
                                    rows={6}
                                    className="form-textarea form-input-disabled"
                                    defaultValue={editingPost.caption || ""}
                                    placeholder="Kuvaus (vain luku)"
                                    readOnly
                                  />
                                </div>

                                {/* Voiceover näkyy vain jos kyseessä on Reels tai Avatar */}
                                {(editingPost.source === "reels" ||
                                  editingPost.type === "Reels" ||
                                  editingPost.type === "Avatar") && (
                                  <div className="form-group">
                                    <label className="form-label">
                                      Voiceover (vain luku)
                                    </label>
                                    <textarea
                                      name="voiceover"
                                      rows={4}
                                      className="form-textarea form-input-disabled"
                                      defaultValue={editingPost.voiceover || ""}
                                      placeholder="Voiceover-teksti..."
                                      readOnly
                                    />
                                  </div>
                                )}
                              </>
                            )}

                            {/* Muissa sarakkeissa: Perusmuokkaus */}
                            {editingPost.status !== "Kesken" &&
                              editingPost.status !== "Tarkistuksessa" &&
                              editingPost.status !== "Under Review" &&
                              editingPost.originalData?.status !==
                                "Under Review" && (
                                <div className="form-group">
                                  <label className="form-label">Kuvaus</label>
                                  <textarea
                                    name="caption"
                                    rows={4}
                                    className="form-textarea"
                                    defaultValue={editingPost.caption || ""}
                                    placeholder={t(
                                      "posts.placeholders.caption",
                                    )}
                                  />
                                </div>
                              )}

                            {/* Näytä julkaisupäivä kenttä vain jos status ei ole "Avatar", "Kesken" tai "Tarkistuksessa" */}
                            {editingPost.status !== "Avatar" &&
                              editingPost.status !== "Kesken" &&
                              editingPost.status !== "Tarkistuksessa" && (
                                <div className="form-group">
                                  <label className="form-label">
                                    {t("posts.modals.publishDate")}
                                  </label>
                                  <input
                                    name="publishDate"
                                    type="datetime-local"
                                    className="form-input"
                                    defaultValue={editingPost.publishDate || ""}
                                    placeholder={t(
                                      "posts.modals.publishDatePlaceholder",
                                    )}
                                    readOnly={
                                      editingPost.status === "Tarkistuksessa"
                                    }
                                    style={
                                      editingPost.status === "Tarkistuksessa"
                                        ? {
                                            backgroundColor: "#f8f9fa",
                                            color: "#6c757d",
                                          }
                                        : undefined
                                    }
                                  />
                                </div>
                              )}

                            {/* Karusellin segmenttien muokkaus ja hyväksyntä - näytetään aina kun on Carousel-tyyppinen postaus ja segmenttejä on */}
                            {(() => {
                              const shouldShow =
                                editingPost.type === "Carousel" &&
                                editingPost.source === "supabase" &&
                                editingPost.segments &&
                                editingPost.segments.length > 0;

                              return shouldShow ? (
                                <div className="mt-6 border-t-2 border-gray-200 pt-6">
                                  <CarouselSegmentsEditor
                                    segments={editingPost.segments}
                                    contentId={editingPost.id}
                                    onSave={async () => {
                                      // Päivitä segments data
                                      if (orgId) {
                                        const { data: segmentsData } =
                                          await supabase
                                            .from("segments")
                                            .select("*")
                                            .eq("content_id", editingPost.id)
                                            .order("slide_no", {
                                              ascending: true,
                                            });

                                        if (segmentsData) {
                                          setEditingPost((prev) => ({
                                            ...prev,
                                            segments: segmentsData,
                                          }));
                                        }
                                      }
                                      await fetchPosts(); // Päivitä lista
                                    }}
                                    t={t}
                                  />
                                </div>
                              ) : null;
                            })()}
                          </div>
                          <div className="modal-actions">
                            <div className="modal-actions-left">
                              <Button
                                type="button"
                                variant="secondary"
                                onClick={() => {
                                  setShowEditModal(false);
                                  setEditingPost(null);
                                }}
                              >
                                <svg
                                  width="24"
                                  height="24"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <line x1="18" y1="6" x2="6" y2="18"></line>
                                  <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                              </Button>
                            </div>
                            <div className="modal-actions-right">
                              {editingPost.status !== "Tarkistuksessa" && (
                                <Button
                                  type="submit"
                                  variant="primary"
                                  disabled={
                                    editingPost.status === "Kesken" &&
                                    (editingPost.source === "reels" ||
                                      editingPost.type === "Avatar") &&
                                    editModalStep === 1 &&
                                    !voiceoverReadyChecked
                                  }
                                >
                                  {editingPost.status === "Kesken" &&
                                  (editingPost.source === "reels" ||
                                    editingPost.type === "Avatar") &&
                                  editModalStep === 1
                                    ? t("posts.messages.next")
                                    : t("posts.buttons.saveChanges")}
                                </Button>
                              )}
                              {/* Julkaisu-nappi vain jos status on "Valmiina julkaisuun" (Tarkistuksessa) tai "Aikataulutettu" */}
                              {(editingPost.status === "Tarkistuksessa" ||
                                editingPost.status === "Aikataulutettu") && (
                                <Button
                                  type="button"
                                  variant="primary"
                                  onClick={() => {
                                    // Päivitä editingPost modaalissa muokatuilla tiedoilla
                                    if (!editFormRef.current) return;
                                    const formData = new FormData(
                                      editFormRef.current,
                                    );

                                    let updatedPost = { ...editingPost };

                                    // Päivitä caption jos se on muokattu
                                    if (formData.get("caption")) {
                                      updatedPost.caption =
                                        formData.get("caption");
                                    }

                                    // Päivitä scheduledDate jos publishDate on muokattu
                                    const publishDate =
                                      formData.get("publishDate");
                                    if (
                                      publishDate &&
                                      publishDate.trim() !== ""
                                    ) {
                                      const dateTime = new Date(publishDate);
                                      updatedPost.scheduledDate = dateTime
                                        .toISOString()
                                        .split("T")[0];
                                      // Lisää myös alkuperäinen publishDate ajan käsittelyä varten
                                      updatedPost.publishDate = publishDate;
                                    }

                                    // Sulje modaali ja avaa julkaisu-modaali
                                    setShowEditModal(false);
                                    setEditingPost(null);
                                    handlePublishPost(updatedPost);
                                  }}
                                  className="button-success-inline"
                                >
                                  {t("posts.buttons.publish")}
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </form>
                  )}

                  {/* Vaihe 2: Avatar-valinta */}
                  {editModalStep === 2 && (
                    <div>
                      <div className="avatar-section">
                        <h3 className="avatar-section-title">
                          Valitse avatar-kuva
                        </h3>
                        <p className="avatar-section-description">
                          Valitse avatar-kuva jota haluat käyttää tässä
                          postauksessa.
                        </p>
                      </div>

                      {/* Avatar-kuvat grid */}
                      <div className="avatar-grid">
                        {avatarLoading ? (
                          <div className="avatar-grid-loading">
                            Ladataan kuvia…
                          </div>
                        ) : avatarError ? (
                          <div className="avatar-grid-error">{avatarError}</div>
                        ) : avatarImages.length === 0 ? (
                          <div className="avatar-grid-empty">
                            <div className="avatar-grid-empty-text">
                              Ei avatar-kuvia saatavilla
                            </div>
                          </div>
                        ) : (
                          avatarImages.map((img, idx) => {
                            const avatarId = img.variableId || img.id;
                            const isSelected = selectedAvatar === avatarId;
                            return (
                              <button
                                key={img.id || idx}
                                type="button"
                                onClick={() => setSelectedAvatar(avatarId)}
                                className={`avatar-item ${isSelected ? "selected" : ""}`}
                                aria-pressed={isSelected}
                              >
                                <img
                                  src={img.url}
                                  alt={`Avatar ${idx + 1}`}
                                  className="avatar-item-image"
                                />
                                {isSelected && (
                                  <span className="avatar-item-check">✓</span>
                                )}
                              </button>
                            );
                          })
                        )}
                      </div>

                      {/* Napit */}
                      <div className="modal-actions">
                        <div className="modal-actions-left">
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setEditModalStep(1)}
                          >
                            ← Takaisin
                          </Button>
                        </div>
                        <div className="modal-actions-right">
                          <Button
                            type="button"
                            variant="primary"
                            onClick={async () => {
                              if (!selectedAvatar) return;
                              try {
                                if (!orgId) {
                                  notify.error(
                                    t("posts.messages.userIdNotFound"),
                                  );
                                  return;
                                }

                                const { data: userData, error: userError } =
                                  await supabase
                                    .from("users")
                                    .select("company_id")
                                    .eq("id", orgId)
                                    .single();
                                if (userError || !userData?.company_id) {
                                  notify.error(
                                    t("posts.messages.errorCompanyId"),
                                  );
                                  return;
                                }
                                // Hae session token
                                const { data: sessionData } =
                                  await supabase.auth.getSession();
                                const token =
                                  sessionData?.session?.access_token;

                                if (!token) {
                                  throw new Error(
                                    "Käyttäjä ei ole kirjautunut",
                                  );
                                }

                                // Lähetä endpointiin
                                await fetch("/api/webhooks/voiceover-ready", {
                                  method: "POST",
                                  headers: {
                                    "Content-Type": "application/json",
                                    Authorization: `Bearer ${token}`,
                                  },
                                  body: JSON.stringify({
                                    recordId: editingPost.id,
                                    voiceover: editingPost.voiceover || null,
                                    voiceoverReady:
                                      !!editingPost.voiceoverReady,
                                    selectedAvatarId: selectedAvatar,
                                    action: "avatar_selected",
                                  }),
                                });
                                notify.success(
                                  "Avatar valittu tälle postaukselle",
                                );
                              } catch (e) {
                                notify.error("Avatarin valinta epäonnistui");
                              } finally {
                                setShowEditModal(false);
                                setEditingPost(null);
                                setEditModalStep(1);
                              }
                            }}
                            disabled={!selectedAvatar}
                          >
                            Valmis
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>,
            document.body,
          )}

        {/* Edit Modal - Kesken & Tarkistuksessa poistettu erillisinä; palattu yleiseen modaalin käyttöön */}

        {/* Avatar Modal */}
        <AvatarModal
          show={showEditModal && editingPost && editingPost.source === "reels"}
          editingPost={editingPost}
          editModalStep={editModalStep}
          setEditModalStep={setEditModalStep}
          selectedAvatar={selectedAvatar}
          setSelectedAvatar={setSelectedAvatar}
          avatarImages={avatarImages}
          setAvatarImages={setAvatarImages}
          avatarLoading={avatarLoading}
          setAvatarLoading={setAvatarLoading}
          avatarError={avatarError}
          setAvatarError={setAvatarError}
          voiceoverReadyChecked={voiceoverReadyChecked}
          setVoiceoverReadyChecked={setVoiceoverReadyChecked}
          user={user}
          onClose={() => {
            setShowEditModal(false);
            setEditingPost(null);
            setEditModalStep(1);
            setSelectedAvatar(null);
          }}
          onSave={() => {
            notify.success("Avatar valittu tälle postaukselle");
            setShowEditModal(false);
            setEditingPost(null);
            setEditModalStep(1);
            setSelectedAvatar(null);
            setVoiceoverReadyChecked(false);
            fetchPosts();
          }}
          t={t}
        />

        {/* Publish Modal */}
        <PublishModal
          show={showPublishModal}
          publishingPost={publishingPost}
          socialAccounts={socialAccounts}
          selectedAccounts={selectedAccounts}
          setSelectedAccounts={setSelectedAccounts}
          loadingAccounts={loadingAccounts}
          onClose={() => {
            setShowPublishModal(false);
            setShowEditModal(true);
          }}
          onConfirm={handleConfirmPublish}
          t={t}
        />

        {/* Monthly Limit Warning Modal */}
        {showLimitWarning &&
          createPortal(
            <MonthlyLimitWarning
              limitData={monthlyLimit}
              onClose={() => setShowLimitWarning(false)}
              onCreateAnyway={() => {
                setShowLimitWarning(false);
                openModal({ type: "create", count: 1 });
              }}
            />,
            document.body,
          )}

        {/* Image Bank Modal */}
        <ImageBankModal
          show={showImageBankModal}
          onClose={() => setShowImageBankModal(false)}
        />

        {/* Keyboard Shortcuts Modal */}
        <KeyboardShortcutsModal
          show={showShortcutsModal}
          onClose={() => setShowShortcutsModal(false)}
          t={t}
        />

        {/* Preview Post Modal */}
        <PreviewPostModal
          show={showPreviewModal}
          post={previewPost}
          onClose={() => {
            setShowPreviewModal(false);
            setPreviewPost(null);
          }}
          t={t}
        />

        {/* Kuvapankki Selector Modal */}
        {showKuvapankkiSelector &&
          editingPost &&
          createPortal(
            <div
              className="modal-overlay modal-overlay--light"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setShowKuvapankkiSelector(false);
                }
              }}
            >
              <div className="modal-container max-w-[800px] max-h-[90vh] overflow-auto">
                <KuvapankkiSelector
                  onSelectImage={(imageUrl) =>
                    handleAddImageFromKuvapankki(imageUrl, editingPost.id)
                  }
                  onClose={() => setShowKuvapankkiSelector(false)}
                />
              </div>
            </div>,
            document.body,
          )}
        {/* Schedule Modal - Refactored */}
        <SchedulePostModal
          show={isOpen("schedule")}
          post={modal.type === "schedule" ? modal.post : null}
          socialAccounts={socialAccounts}
          selectedAccounts={selectedAccounts}
          setSelectedAccounts={setSelectedAccounts}
          loadingAccounts={loadingAccounts}
          onClose={closeModal}
          onConfirm={handleSchedulePost}
          t={t}
        />
      </div>
    </>
  );
}
