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
  const navigate = useNavigate();
  const monthlyLimit = useMonthlyLimit();
  const nextMonthQuota = useNextMonthQuota();

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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createModalCount, setCreateModalCount] = useState(1);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadDragActive, setUploadDragActive] = useState(false);
  const [uploadPreviewUrl, setUploadPreviewUrl] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
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

  // Refs for character counting
  const textareaRef = useRef(null);
  const charCountRef = useRef(null);

  // Ref for file input
  const fileInputRef = useRef(null);

  // Ref for edit modal form
  const editFormRef = useRef(null);

  // fetchMixpostPosts siirretty usePosts hookiin

  // Hae avatar-kuvat kuten /settings sivulla (vain näyttö toistaiseksi)
  useEffect(() => {
    const fetchAvatars = async () => {
      try {
        if (!showEditModal || editModalStep !== 2) return;
        if (!user || !orgId) return;
        // Optimization #5: Estä uudelleenhaku jos avataarit on jo haettu
        if (avatarImages.length > 0) return;

        setAvatarLoading(true);
        setAvatarError("");

        // Hae company_id suoraan Supabasesta
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("company_id")
          .eq("id", orgId)
          .single();

        if (userError || !userData?.company_id) {
          setAvatarImages([]);
          setAvatarError("company_id puuttuu");
          return;
        }

        // Kutsu avatar-status APIa
        const res = await fetch("/api/avatars/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ companyId: userData.company_id }),
        });

        const data = await res.json();

        // Poimi Media[] URLit kuten SettingsPage.extractAvatarImages
        const extractAvatarImages = (apiData) => {
          if (!Array.isArray(apiData)) return [];
          const images = [];
          for (const record of apiData) {
            if (Array.isArray(record.Media)) {
              for (const media of record.Media) {
                let url = null;
                if (media.thumbnails?.full?.url)
                  url = media.thumbnails.full.url;
                else if (media.thumbnails?.large?.url)
                  url = media.thumbnails.large.url;
                else if (media.url) url = media.url;
                if (url) {
                  images.push({
                    url,
                    id: media.id || url,
                    variableId: record["Variable ID"] || record.id,
                  });
                }
              }
            }
            if (images.length >= 4) break;
          }
          return images.slice(0, 4);
        };

        setAvatarImages(extractAvatarImages(data));
      } catch (e) {
        setAvatarError("Virhe avatar-kuvien haussa");
        setAvatarImages([]);
      } finally {
        setAvatarLoading(false);
      }
    };

    fetchAvatars();
  }, [showEditModal, editModalStep, user, orgId]);

  // Synkkaa voiceover checkboxin tila kun modaalin vaihe 1 avataan
  useEffect(() => {
    if (showEditModal && editModalStep === 1 && editingPost) {
      setVoiceoverReadyChecked(!!editingPost.voiceoverReady);
    }
  }, [showEditModal, editModalStep, editingPost]);

  // Notification states
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const hasInitialized = useRef(false);
  const isUuid = (value) =>
    typeof value === "string" &&
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
      value,
    );

  // Auto-hide notifications
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

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

  // Hae kaikki data kun sivu avataan (vain kerran)
  useEffect(() => {
    if (!user || hasInitialized.current) return;

    hasInitialized.current = true;
    // Optimization #2: Parallel Data Fetching - haetaan kaikki data rinnakkain
    Promise.all([
      fetchPosts(),
      fetchReelsPosts(),
      fetchSocialAccounts(),
      fetchMixpostPosts(),
    ]).catch((error) => {
      console.error("Error fetching initial data:", error);
    });
  }, [
    user,
    fetchPosts,
    fetchReelsPosts,
    fetchSocialAccounts,
    fetchMixpostPosts,
  ]);

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
        setShowCreateModal(false);
        setErrorMessage("Kuukausiraja täynnä");
        return;
      }

      // Tarkista että kuukausiraja riittää useamman postauksen luomiseen
      if (count > 1) {
        const remaining = monthlyLimit.remaining || 0;
        if (remaining < count) {
          setShowCreateModal(false);
          setErrorMessage(
            `Kuukausiraja ei riitä. Voit luoda vielä ${remaining} postausta tässä kuussa.`,
          );
          monthlyLimit.refresh();
          return;
        }
      }

      if (!orgId) {
        throw new Error(t("posts.messages.userIdNotFound"));
      }

      // Hae company_id users taulusta
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("company_id")
        .eq("id", orgId)
        .single();

      if (userError || !userData?.company_id) {
        throw new Error(t("posts.messages.companyIdNotFound"));
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
            companyId: userData.company_id,
            caption: postData.caption,
            count: count,
          }),
        });

        if (!response.ok) {
          // Tarkista onko kyse kuukausiraja-virheestä
          const errorData = await response.json().catch(() => null);
          if (errorData?.error?.includes("Monthly content limit exceeded")) {
            setShowCreateModal(false);
            setErrorMessage(
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

      setShowCreateModal(false);
      if (count > 1) {
        setSuccessMessage(`${count} postausta lähetetty generoitavaksi`);
      } else {
        setSuccessMessage(t("posts.messages.ideaSent"));
      }
      monthlyLimit.refresh(); // Päivitä raja-tiedot onnistuneen luonnin jälkeen
    } catch (error) {
      console.error("Virhe uuden julkaisun luomisessa:", error);
      if (error.message?.includes("Monthly content limit exceeded")) {
        setErrorMessage(
          "Kuukausiraja ylitetty! Voit luoda uutta sisältöä vasta ensi kuussa.",
        );
        monthlyLimit.refresh();
      } else {
        setErrorMessage(t("posts.messages.errorCreating"));
      }
    }
  };

  const handleEditPost = async (post) => {
    console.log("handleEditPost called with:", {
      id: post.id,
      status: post.status,
      source: post.source,
      type: post.type,
    });

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
        console.log("Fetched Mixpost posts:", data);

        // Etsi oikea postaus ID:n perusteella
        const fullPost = data.find((p) => p.id === post.id);
        if (fullPost) {
          console.log("Found full Mixpost post:", fullPost);
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
            setErrorMessage(t("posts.messages.errorCompanyId"));
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
            setErrorMessage(t("posts.messages.voiceoverError"));
            return;
          }

          const result = await response.json();

          // Näytä käyttäjälle onnistumisviesti
          setSuccessMessage(t("posts.messages.voiceoverSuccess"));
        } catch (error) {
          console.error("Voiceover webhook error:", error);
          setErrorMessage(t("posts.messages.voiceoverError"));
          return;
        }
      }

      // Päivitä Supabase kaikille postauksille
      try {
        if (!orgId) {
          console.error("Could not fetch user_id");
          setErrorMessage("Käyttäjätietojen haku epäonnistui");
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
          setErrorMessage("Tietojen tallentaminen epäonnistui");
          return;
        }

        setSuccessMessage("Tiedot tallennettu onnistuneesti");
      } catch (error) {
        console.error("Error updating Supabase:", error);
        setErrorMessage("Tietojen tallentaminen epäonnistui");
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
        setErrorMessage("Kuukausiraja täynnä, et voi monistaa postausta.");
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
      setErrorMessage("Postauksen monistaminen epäonnistui: " + error.message);
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
        setErrorMessage(t("posts.messages.selectAtLeastOneChannel"));
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

      setSuccessMessage(result.message || t("posts.messages.scheduleSuccess"));
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
      setErrorMessage(t("posts.messages.scheduleError") + " " + error.message);
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
    console.log("handleConfirmPublish called with:", {
      publishingPost,
      selectedAccounts,
      publishDate,
    });

    if (!publishingPost || selectedAccounts.length === 0) {
      setErrorMessage(t("posts.messages.selectAccounts"));
      return;
    }

    try {
      console.log("Starting publish process...");
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

      console.log("Sending publish data:", publishData);

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

      console.log("API response status:", response.status);
      const result = await response.json();
      console.log("API response data:", result);

      if (!response.ok) {
        throw new Error(result.error || "Julkaisu epäonnistui");
      }

      // Optimization #1: Ei haeta dataa uudelleen onnistumisen jälkeen

      setSuccessMessage(result.message || t("posts.messages.publishSuccess"));
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
      setErrorMessage(t("posts.messages.publishError") + " " + error.message);
    }
  };

  const handleMoveToNext = async (post, newStatus) => {
    // Varmistetaan että kyseessä on Supabase-postaus
    if (post.source !== "supabase") {
      setErrorMessage("Siirtyminen on mahdollista vain Supabase-postauksille");
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

      setSuccessMessage(`Postaus siirretty sarakkeeseen: ${newStatus}`);
    } catch (error) {
      console.error("Move to next error:", error);
      setErrorMessage(t("posts.messages.moveError") + " " + error.message);
      // Optimization #1: Virhetilanteessa palautetaan vanha data
      setPosts(previousPosts);
      if (previousEditingPost) {
        setEditingPost(previousEditingPost);
      }
    }
  };

  const deleteMixpostPost = async (postUuid) => {
    try {
      console.log("🔵 deleteMixpostPost called with postUuid:", postUuid);
      console.log("🔵 postUuid type:", typeof postUuid);
      console.log("🔵 postUuid length:", postUuid?.length);

      // Hae access token
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Käyttäjä ei ole kirjautunut");
      }

      console.log(
        "🔵 Access token found:",
        session.access_token.substring(0, 20) + "...",
      );

      const requestBody = { postUuid };
      console.log("🔵 Request body:", requestBody);

      // Kutsu API endpointia
      const response = await fetch("/api/integrations/mixpost/delete-post", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(requestBody),
      });

      console.log("🔵 Response status:", response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ API error response:", errorData);
        throw new Error(errorData.error || "Postauksen poisto epäonnistui");
      }

      const result = await response.json();
      console.log("✅ Post deleted successfully:", result);

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

      setSuccessMessage("Image deleted successfully!");
    } catch (error) {
      console.error("Error deleting image:", error);
      setErrorMessage("Image deletion failed: " + error.message);
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

      setSuccessMessage("Kuva lisätty kuvapankista!");
      setShowKuvapankkiSelector(false);
    } catch (error) {
      console.error("Error adding image from kuvapankki:", error);
      setErrorMessage("Kuvan lisäys epäonnistui: " + error.message);
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

      console.log("DEBUG - Sending image upload request:", {
        contentId,
        userId: orgId,
      });

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
        console.error("DEBUG - Upload failed:", errorData);
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

      setSuccessMessage("Image added successfully!");
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

      setErrorMessage(errorMessage);

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
    if (showCreateModal) {
      setShowCreateModal(false);
    }
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
      <div className="p-4 sm:p-8 lg:p-12 max-w-[1700px] mx-auto min-h-screen space-y-12">
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-gray-900 tracking-tight leading-none">{t("posts.header")}</h1>
            <p className="text-gray-400 text-lg font-medium">{t("posts.subtitle") || "Hallitse ja aikatauluta somesisältöjäsi"}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full lg:w-auto">
            {/* Quota Indicator: This Month */}
            <div className="group bg-white rounded-[32px] border border-gray-100 shadow-xl shadow-gray-200/20 p-6 hover:shadow-2xl hover:border-blue-100 transition-all duration-500 min-w-0">
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest group-hover:text-blue-500 transition-colors truncate pr-2">
                  {t("monthlyLimit.generatedThisMonth")}
                </span>
                {monthlyLimit.loading ? (
                  <div className="w-4 h-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin flex-shrink-0" />
                ) : (
                  <div className={`flex-shrink-0 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${monthlyLimit.remaining <= 5 ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
                    {monthlyLimit.remaining} {t("monthlyLimit.remaining") || "jäljellä"}
                  </div>
                )}
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-gray-900 leading-none">
                  {monthlyLimit.currentCount}
                </span>
                <span className="text-sm font-bold text-gray-300">
                  / {monthlyLimit.isUnlimited ? "∞" : monthlyLimit.monthlyLimit}
                </span>
              </div>
              <div className="mt-5 h-2 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ease-out ${monthlyLimit.remaining <= 5 ? 'bg-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.4)]' : 'bg-blue-600 shadow-[0_0_12px_rgba(37,99,235,0.4)]'}`}
                  style={{ width: `${Math.min(100, (monthlyLimit.currentCount / (monthlyLimit.isUnlimited ? 100 : monthlyLimit.monthlyLimit)) * 100)}%` }}
                />
              </div>
            </div>

            {/* Quota Indicator: Next Month */}
            <div className="group bg-white rounded-[32px] border border-gray-100 shadow-xl shadow-gray-200/20 p-6 hover:shadow-2xl hover:border-indigo-100 transition-all duration-500 min-w-0">
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest group-hover:text-indigo-500 transition-colors truncate pr-2">
                  {t("monthlyLimit.generatedNextMonth")}
                </span>
                {nextMonthQuota.loading ? (
                  <div className="w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin flex-shrink-0" />
                ) : (
                  <div className="flex-shrink-0 px-3 py-1 rounded-full bg-gray-50 text-gray-500 text-[9px] font-black uppercase tracking-widest">
                    Saldossa
                  </div>
                )}
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-gray-900 leading-none">
                  {nextMonthQuota.nextMonthCount}
                </span>
                <span className="text-sm font-bold text-gray-300">
                  / {nextMonthQuota.isUnlimited ? "∞" : nextMonthQuota.nextMonthLimit}
                </span>
              </div>
              <div className="mt-5 h-2 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                <div
                  className="h-full rounded-full bg-indigo-400 shadow-[0_0_12px_rgba(129,140,248,0.4)] transition-all duration-1000 ease-out"
                  style={{ width: `${Math.min(100, (nextMonthQuota.nextMonthCount / (nextMonthQuota.isUnlimited ? 100 : nextMonthQuota.nextMonthLimit)) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation & Action Bar Container */}
        <div className="bg-white/60 backdrop-blur-xl rounded-[32px] border border-gray-100 shadow-xl shadow-gray-200/10 p-2 sm:p-3 flex flex-row gap-2 sm:gap-6 justify-between items-center sticky top-4 z-40 transition-all hover:shadow-2xl overflow-hidden">
          <div className="flex p-1 sm:p-1.5 bg-gray-50/80 rounded-[24px] overflow-x-auto no-scrollbar gap-1 border border-gray-100 flex-1 sm:flex-none">
            {[
              { id: 'kanban', label: t("posts.tabs.posts"), icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg> },
              { id: 'carousels', label: t("posts.tabs.carousels"), icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg> },
              { id: 'calendar', label: t("posts.tabs.calendar"), icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
              { id: 'ugc', label: t("posts.tabs.ugc"), feature: 'UGC', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg> }
            ].filter(tab => !tab.feature || (user?.features?.includes(tab.feature))).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-center gap-2 px-3 sm:px-6 py-2 sm:py-3 text-[10px] sm:text-xs font-bold rounded-[18px] transition-all duration-300 whitespace-nowrap ${activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-lg shadow-gray-200/50'
                  : 'text-gray-400 hover:text-gray-900 hover:bg-white/50'
                  }`}
              >
                {tab.icon}
                <span className="uppercase tracking-widest hidden md:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 sm:gap-6 flex-shrink-0">
            {userAccountType === "personal_brand" && (
              <button
                onClick={() => setShowImageBankModal(true)}
                className="hidden lg:flex text-[10px] sm:text-xs font-bold text-gray-400 hover:text-gray-900 uppercase tracking-widest transition-colors py-2"
              >
                {t("posts.tabs.imageBank")}
              </button>
            )}
            <div className="h-4 w-px bg-gray-200 hidden lg:block" />
            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-3 sm:px-6 py-2 sm:py-3 bg-white hover:bg-gray-50 text-gray-900 text-[10px] sm:text-xs font-bold uppercase tracking-widest rounded-2xl border border-gray-100 shadow-lg shadow-gray-200/20 transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
              >
                <span className="sm:hidden">+</span>
                <span className="hidden sm:inline">{t("posts.buttons.importPost")}</span>
              </button>
              <button
                onClick={() => {
                  if (monthlyLimit.canCreate) {
                    setCreateModalCount(1);
                    setShowCreateModal(true);
                  } else {
                    setErrorMessage(t("posts.errors.monthlyLimitReached"));
                  }
                }}
                disabled={!monthlyLimit.canCreate}
                className="px-4 sm:px-8 py-2 sm:py-3 bg-gray-900 hover:bg-black text-white text-[10px] sm:text-xs font-bold uppercase tracking-widest rounded-2xl shadow-xl shadow-gray-900/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                <span className="sm:hidden">Luo</span>
                <span className="hidden sm:inline">{t("posts.buttons.generateNew")}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Search and Filters Bar */}
        {activeTab !== "ugc" && (
          <div className="flex flex-col md:flex-row gap-6">
            <div className="relative flex-1 group">
              <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-gray-300 group-focus-within:text-blue-500 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t("posts.filters.searchPlaceholder") || "Hae julkaisuja..."}
                className="w-full pl-16 pr-8 py-4 bg-white border border-gray-100 rounded-[24px] shadow-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all placeholder:text-gray-300 font-medium text-sm"
              />
            </div>

            <div className="flex gap-4 min-w-[300px]">
              <div className="relative flex-1">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full px-6 py-4 bg-white border border-gray-100 rounded-[24px] shadow-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer text-xs font-bold uppercase tracking-widest text-gray-600"
                >
                  <option value="">{t("posts.filters.allTypes")}</option>
                  <option value="Photo">{t("posts.typeOptions.photo")}</option>
                  <option value="Carousel">{t("posts.typeOptions.carousel")}</option>
                  <option value="Reels">{t("posts.typeOptions.reels")}</option>
                  <option value="LinkedIn">{t("posts.typeOptions.linkedin")}</option>
                  <option value="Video">{t("posts.typeOptions.video")}</option>
                </select>
                <div className="absolute inset-y-0 right-6 flex items-center pointer-events-none text-gray-300">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>

              <div className="relative flex-1">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-6 py-4 bg-white border border-gray-100 rounded-[24px] shadow-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer text-xs font-bold uppercase tracking-widest text-gray-600"
                >
                  <option value="">{t("posts.filters.allStatuses") || "Kaikki tilat"}</option>
                  <option value="Kesken">{t("posts.statuses.draft") || "Kesken"}</option>
                  <option value="Tarkistuksessa">{t("posts.statuses.pending") || "Tarkistuksessa"}</option>
                  <option value="Aikataulutettu">{t("posts.statuses.scheduled") || "Ajastettu"}</option>
                  <option value="Julkaistu">{t("posts.statuses.published") || "Julkaistu"}</option>
                </select>
                <div className="absolute inset-y-0 right-6 flex items-center pointer-events-none text-gray-300">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {currentError && (
          <div className="bg-red-50/50 border border-red-100 rounded-[40px] p-12 text-center animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-white rounded-3xl shadow-xl shadow-red-200/50 flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{t("posts.errors.error")}</h3>
            <p className="text-red-600 font-medium mb-8 max-w-md mx-auto">{currentError}</p>
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

        {/* Create Modal */}
        {showCreateModal &&
          createPortal(
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <div
                className="absolute inset-0 bg-gray-900/40 backdrop-blur-md animate-in fade-in duration-300"
                onClick={() => setShowCreateModal(false)}
              />
              <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl shadow-blue-500/10 border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-6 py-6 border-b border-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Generoi uusi julkaisu</h2>
                      <p className="text-xs text-gray-500 font-medium">Luo tekoälyllä uutta sisältöä</p>
                    </div>
                  </div>
                  <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-gray-900 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                  </button>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    const title = formData.get("title")?.trim() || "";
                    const countValue = parseInt(createModalCount, 10);
                    const count = !isNaN(countValue) ? Math.min(Math.max(countValue, 1), 10) : 1;
                    const type = formData.get("type") || "";

                    if (count === 1 && !title) { toast.warning(t("errors.titleRequired")); return; }
                    if (count === 1 && !type) { toast.warning(t("errors.typeRequired")); return; }

                    handleCreatePost({
                      title: title,
                      type: type,
                      caption: formData.get("caption"),
                      count: count,
                    });
                  }}
                  className="p-6 space-y-6"
                >
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">
                        Otsikko {createModalCount === 1 && <span className="text-red-500">*</span>}
                      </label>
                      <input name="title" type="text" className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm font-medium" placeholder="Esim. Kesäkampanja 2024" />
                      {createModalCount > 1 && <p className="text-[10px] text-gray-400 px-1 italic">Otsikko on valinnainen useamman julkaisun luonnissa</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">Tyyppi {createModalCount === 1 ? <span className="text-red-500">*</span> : ''}</label>
                          <select name="type" className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all text-sm font-medium appearance-none cursor-pointer" defaultValue="Photo">
                            <option value="All">Kaikki</option>
                            <option value="Photo">Photo</option>
                            <option value="Carousel">Carousel</option>
                            <option value="Reels">Reels</option>
                            <option value="LinkedIn">LinkedIn</option>
                          </select>
                        </div>
                      <div className={`space-y-2 ${createModalCount === 1 ? "" : "col-span-2"}`}>
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">Lukumäärä</label>
                        <div className="flex items-center gap-3">
                          <input
                            name="count"
                            type="number"
                            min="1"
                            max="10"
                            value={createModalCount}
                            onChange={(e) => {
                              const v = e.target.value;
                              if (v === "") { setCreateModalCount(""); return; }
                              const n = parseInt(v, 10);
                              if (!isNaN(n)) setCreateModalCount(Math.min(Math.max(n, 1), 10));
                            }}
                            onBlur={(e) => { if (e.target.value === "" || isNaN(parseInt(e.target.value, 10))) setCreateModalCount(1); }}
                            className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all text-sm font-bold"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">Kuvaus (valinnainen)</label>
                      <textarea
                        name="caption"
                        rows={4}
                        className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all text-sm font-medium resize-none"
                        placeholder={t("placeholders.addDescription")}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-3 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors">
                      Peruuta
                    </button>
                    <button type="submit" className="flex-[2] py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-sm shadow-xl shadow-blue-500/20 transition-all active:scale-[0.98]">
                      Generoi julkaisut
                    </button>
                  </div>
                </form>
              </div>
            </div>,
            document.body,
          )}

        {/* Upload Modal */}
        {showUploadModal &&
          createPortal(
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <div
                className="absolute inset-0 bg-gray-900/40 backdrop-blur-md animate-in fade-in duration-300"
                onClick={() => setShowUploadModal(false)}
              />
              <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl shadow-emerald-500/10 border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-6 py-6 border-b border-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{t("posts.importModal.title")}</h2>
                      <p className="text-xs text-gray-500 font-medium">Tuo omaa mediatiedostoa</p>
                    </div>
                  </div>
                  <button onClick={() => setShowUploadModal(false)} className="p-2 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-gray-900 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                  </button>
                </div>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    try {
                      setUploadLoading(true);
                      const { data: sessionData } = await supabase.auth.getSession();
                      if (!sessionData?.session?.access_token) throw new Error(t("posts.errors.loginRequired"));

                      const response = await axios.post("/api/content/import-post", formData, {
                        headers: { Authorization: `Bearer ${sessionData.session.access_token}`, "Content-Type": "multipart/form-data" },
                        timeout: 60000,
                      });

                      if (response.data.success) {
                        setShowUploadModal(false);
                        setUploadPreviewUrl(null);
                        toast.success(t("posts.errors.importSuccess"));
                        await fetchPosts();
                      } else throw new Error(response.data.error || t("posts.errors.importFailed"));
                    } catch (error) {
                      toast.error(error.response?.data?.error || error.message);
                      setErrorMessage(error.message);
                    } finally { setUploadLoading(false); }
                  }}
                  className="p-6 space-y-6"
                >
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">{t("posts.importModal.fields.type")}</label>
                      <select name="type" required className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-emerald-500 outline-none transition-all text-sm font-medium appearance-none cursor-pointer">
                        <option value="Photo">{t("posts.typeOptions.photo")}</option>
                        <option value="Reels">{t("posts.typeOptions.reels")}</option>
                        <option value="LinkedIn">{t("posts.typeOptions.linkedin")}</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">{t("posts.importModal.fields.media")}</label>
                      <div
                        className={`relative aspect-video rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center p-4 ${uploadDragActive ? "border-emerald-500 bg-emerald-50/50" : "border-gray-200 hover:border-gray-300 bg-gray-50/30"
                          }`}
                        onDragOver={(e) => { e.preventDefault(); setUploadDragActive(true); }}
                        onDragLeave={() => setUploadDragActive(false)}
                        onDrop={(e) => {
                          e.preventDefault(); setUploadDragActive(false);
                          const file = e.dataTransfer.files?.[0];
                          if (file) {
                            if (fileInputRef.current) {
                              const dt = new DataTransfer(); dt.items.add(file); fileInputRef.current.files = dt.files;
                            }
                            if (file.type.startsWith("image/")) {
                              const r = new FileReader(); r.onload = (e) => setUploadPreviewUrl(e.target.result); r.readAsDataURL(file);
                            } else if (file.type.startsWith("video/")) setUploadPreviewUrl(URL.createObjectURL(file));
                          }
                        }}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {uploadPreviewUrl ? (
                          <div className="absolute inset-0 group">
                            {uploadPreviewUrl.startsWith("blob:")
                              ? <video src={uploadPreviewUrl} className="w-full h-full object-cover" controls />
                              : <img src={uploadPreviewUrl} alt="Preview" className="w-full h-full object-cover" />
                            }
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setUploadPreviewUrl(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                              className="absolute top-2 right-2 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-colors"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="text-center">
                            <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mx-auto mb-3">
                              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                            </div>
                            <p className="text-xs font-bold text-gray-900 mb-1">{t("posts.upload.dropzone")}</p>
                            <p className="text-[10px] text-gray-400">{t("posts.upload.hint")}</p>
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
                              const reader = new FileReader(); reader.onload = (ev) => setUploadPreviewUrl(ev.target.result); reader.readAsDataURL(file);
                            } else if (file.type.startsWith("video/")) setUploadPreviewUrl(URL.createObjectURL(file));
                          }
                        }}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">{t("posts.importModal.fields.title")}</label>
                      <input name="title" type="text" className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-emerald-500 text-sm font-medium outline-none transition-all" placeholder={t("posts.importModal.placeholders.title")} />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">{t("posts.importModal.fields.caption")}</label>
                      <textarea name="caption" rows={4} className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-emerald-500 text-sm font-medium outline-none transition-all resize-none" placeholder={t("placeholders.writeContent")} />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button type="button" onClick={() => setShowUploadModal(false)} className="flex-1 py-3 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors">
                      Peruuta
                    </button>
                    <button type="submit" disabled={uploadLoading} className="flex-[2] py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-sm shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-2">
                      {uploadLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Tuodaan...
                        </>
                      ) : t("posts.buttons.import")}
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
              setSuccessMessage("Kuva vaihdettu onnistuneesti");

              // Päivitä myös posts-lista uudella datalla
              setPosts((prevPosts) =>
                prevPosts.map((post) =>
                  post.id === updatedPost.id ? updatedPost : post,
                ),
              );

              // Älä sulje modaalia kun kuva vaihdetaan - anna käyttäjän nähdä uusi kuva
              // Modaali pysyy auki kunnes käyttäjä sulkee sen manuaalisesti
            } else {
              setSuccessMessage("Tiedot tallennettu onnistuneesti");
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
            console.log(
              "ManagePostsPage - onEdit callback called with:",
              result,
            );
            console.log("ManagePostsPage - result type:", typeof result);
            console.log(
              "ManagePostsPage - result.wasScheduled:",
              result?.wasScheduled,
            );
            console.log(
              "ManagePostsPage - result.originalPost:",
              result?.originalPost,
            );

            // Jos postaus ajastettiin Supabase-postauksesta, muunnetaan se Mixpost-postauksen muotoon
            // ja lisätään se mixpostPosts-listaan heti, jotta se näkyy "Aikataulutettu" -sarakkeessa
            if (result && result.wasScheduled && result.originalPost) {
              console.log(
                "ManagePostsPage - Ajastetaan Supabase-postaus, muunnetaan Mixpost-postaukseksi",
              );
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
              fetchMixpostPosts().catch((err) => {
                console.warn(
                  "Mixpost-postauksien haku epäonnistui, mutta postaus näkyy jo listassa:",
                  err,
                );
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

                              if (shouldShow) {
                                console.log(
                                  "CarouselSegmentsEditor should render:",
                                  {
                                    type: editingPost.type,
                                    source: editingPost.source,
                                    segmentsCount: editingPost.segments?.length,
                                  },
                                );
                              }

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
                                  setErrorMessage(
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
                                  setErrorMessage(
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
                                setSuccessMessage(
                                  "Avatar valittu tälle postaukselle",
                                );
                              } catch (e) {
                                console.error(
                                  "Avatar selection send failed:",
                                  e,
                                );
                                setErrorMessage("Avatarin valinta epäonnistui");
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
            setSuccessMessage("Avatar valittu tälle postaukselle");
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
                setCreateModalCount(1);
                setShowCreateModal(true);
              }}
            />,
            document.body,
          )}

        {/* Success/Error Notifications */}
        {successMessage && (
          <div className="notification success-notification">
            <div className="notification-content">
              <span className="notification-icon">✅</span>
              <span className="notification-message">{successMessage}</span>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="notification error-notification">
            <div className="notification-content">
              <span className="notification-icon">❌</span>
              <span className="notification-message">{errorMessage}</span>
            </div>
          </div>
        )}

        {/* Image Bank Modal */}
        <ImageBankModal
          show={showImageBankModal}
          onClose={() => setShowImageBankModal(false)}
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
      </div>
    </>
  );
}
