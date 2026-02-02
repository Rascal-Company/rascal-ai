import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { createPortal } from "react-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { getUserOrgId } from "../lib/getUserOrgId";
import { useMonthlyLimit } from "../hooks/useMonthlyLimit";
import { useNextMonthQuota } from "../hooks/useNextMonthQuota";
import Button from "../components/Button";
import ReactMarkdown from "react-markdown";
import axios from "axios";

// Data muunnos funktio Supabase datasta
const transformSupabaseData = (supabaseData, t) => {
  if (!supabaseData || !Array.isArray(supabaseData)) {
    return [];
  }

  const transformed = supabaseData.map((item) => {
    // Muunnetaan Supabase status käännöksillä
    const statusMap = {
      Draft: t("status.draft"),
      "In Progress": t("status.inProgress"),
      "Under Review": t("status.underReview"),
      Scheduled: t("status.scheduled"),
      Done: t("status.done"),
      Published: t("status.published"),
      Deleted: t("status.deleted"),
      Archived: t("status.archived"),
    };

    let status = statusMap[item.status] || t("status.draft");

    // Jos status on "Done" mutta publish_date on tulevaisuudessa, se on "Aikataulutettu"
    const now = new Date();
    const publishDate = item.publish_date ? new Date(item.publish_date) : null;

    if (publishDate && publishDate > now && status === t("status.published")) {
      status = t("status.scheduled");
    }

    // Käytetään placeholder-kuvaa jos media_urls ei ole saatavilla tai on tyhjä
    const thumbnail =
      item.media_urls && item.media_urls.length > 0 && item.media_urls[0]
        ? item.media_urls[0]
        : "/placeholder.png";

    const transformedItem = {
      id: item.id,
      title: item.idea || item.caption || t("general.untitledContent"),
      status: status,
      thumbnail: thumbnail,
      caption: item.caption || item.idea || t("general.noDescription"),
      type: item.type || t("general.blog"),
      idea: item.idea || "",
      blog_post: item.blog_post || "",
      meta_description: item.meta_description || "",
      createdAt: item.created_at
        ? new Date(item.created_at).toISOString().split("T")[0]
        : null,
      scheduledDate:
        item.publish_date && publishDate > now
          ? new Date(item.publish_date).toISOString().split("T")[0]
          : null,
      publishedAt:
        item.publish_date && publishDate <= now
          ? new Date(item.publish_date).toISOString().split("T")[0]
          : null,
      publishDate: item.publish_date
        ? new Date(item.publish_date).toISOString().slice(0, 16)
        : null,
      mediaUrls: item.media_urls || [],
      hashtags: item.hashtags || [],
      voiceover: item.voiceover || "",
      voiceoverReady: item.voiceover_ready || false,
      originalData: item,
      source: "supabase",
    };

    return transformedItem;
  });

  return transformed;
};

function ContentCard({
  content,
  onView,
  onPublish,
  onArchive,
  onDownload,
  onEdit,
  publishingId,
}) {
  const { t } = useTranslation("common");
  const isPublishing = publishingId === content.id;
  return (
    <div className="content-card">
      <div className="content-card-content">
        <div className="content-thumbnail">
          {content.thumbnail && content.thumbnail !== "/placeholder.png" ? (
            <>
              <img
                src={content.thumbnail}
                alt="thumbnail"
                onError={(e) => {
                  e.target.src = "/placeholder.png";
                }}
              />
              <button
                className="download-button"
                onClick={() => onDownload(content.thumbnail, content.title)}
                title={t("blogNewsletter.actions.download")}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7,10 12,15 17,10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </button>
            </>
          ) : (
            <div className="placeholder-content">
              <img
                src="/placeholder.png"
                alt={t("blogNewsletter.placeholders.noMedia")}
                className="placeholder-image"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "flex";
                }}
              />
              <div className="placeholder-fallback hidden">
                <div className="placeholder-icon">📄</div>
                <div className="placeholder-text">
                  {t("blogNewsletter.placeholders.noImage")}
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="content-info">
          <div className="content-header">
            <h3 className="content-title">
              {content.title.includes(".")
                ? content.title.split(".")[0] + "."
                : content.title}
            </h3>
            <div className="content-badges">
              <span className="content-type">
                {content.type === "Blog"
                  ? t("general.blog")
                  : content.type === "Newsletter"
                    ? t("general.newsletter")
                    : content.type}
              </span>
              <span
                className={`content-status ${content.status.toLowerCase().replace(" ", "-")}`}
              >
                {content.status}
              </span>
            </div>
          </div>
          <p className="content-caption">
            {content.meta_description
              ? content.meta_description.includes(".")
                ? content.meta_description.split(".")[0] + "."
                : content.meta_description
              : content.caption.includes(".")
                ? content.caption.split(".")[0] + "."
                : content.caption}
          </p>
          <div className="content-footer">
            <span className="content-date">
              {content.scheduledDate
                ? content.scheduledDate
                : content.createdAt || content.publishedAt}
            </span>
            <div className="content-actions">
              <Button
                variant="secondary"
                onClick={() => onView(content)}
                className="text-[11px] py-1.5 px-2.5"
              >
                {t("blogNewsletter.actions.view")}
              </Button>
              {content.status !== "Valmis" &&
                content.status !== "Done" &&
                content.status !== "Julkaistu" &&
                content.status !== "Published" &&
                content.status !== "Arkistoitu" &&
                content.status !== "Archived" && (
                  <Button
                    variant="secondary"
                    onClick={() => onEdit(content)}
                    className="text-[11px] py-1.5 px-2.5"
                  >
                    {t("blogNewsletter.actions.edit")}
                  </Button>
                )}
              {/* Julkaisu-nappi jos ei ole jo julkaistu tai arkistoitu */}
              {content.status !== "Valmis" &&
                content.status !== "Done" &&
                content.status !== "Julkaistu" &&
                content.status !== "Published" &&
                content.status !== "Arkistoitu" &&
                content.status !== "Archived" && (
                  <Button
                    variant="primary"
                    onClick={() => onPublish(content)}
                    disabled={isPublishing}
                    className="bg-green-500 text-[11px] py-1.5 px-2.5"
                  >
                    {isPublishing
                      ? t("blogNewsletter.actions.publishing")
                      : t("blogNewsletter.actions.publish")}
                  </Button>
                )}
              {/* Arkistoi-nappi kaikille muille paitsi jo arkistoiduille */}
              {content.status !== "Arkistoitu" && (
                <Button
                  variant="secondary"
                  onClick={() => onArchive(content)}
                  className="bg-gray-200 text-[11px] py-1.5 px-2.5"
                >
                  {t("blogNewsletter.actions.archive")}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BlogNewsletterPage() {
  const { t, i18n } = useTranslation("common");
  const { user } = useAuth();
  const toast = useToast();
  const monthlyLimit = useMonthlyLimit();
  const nextMonthQuota = useNextMonthQuota();
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [activeTab, setActiveTab] = useState("main"); // 'main' | 'archive'
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [viewingContent, setViewingContent] = useState(null);
  const [editingContent, setEditingContent] = useState(null);
  const [socialAccounts, setSocialAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [publishingId, setPublishingId] = useState(null);

  const hasInitialized = useRef(false);

  // Data haku Supabasesta
  const fetchContents = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Hae organisaation ID (public.users.id)
      const orgId = await getUserOrgId(user.id);
      if (!orgId) {
        throw new Error(t("alerts.error.organizationIdNotFound"));
      }

      // Haetaan organisaation Blog ja Newsletter sisältö
      const { data, error } = await supabase
        .from("content")
        .select("*")
        .eq("user_id", orgId) // Käytetään organisaation ID:tä
        .in("type", ["Blog", "Newsletter"])
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      const transformedData = transformSupabaseData(data, t);
      setContents(transformedData || []);
    } catch (err) {
      console.error("Virhe datan haussa:", err);
      setError("Datan haku epäonnistui");
    } finally {
      setLoading(false);
    }
  };

  // Hae somekanavat Supabasesta
  const fetchSocialAccounts = async () => {
    if (!user) return [];

    try {
      setLoadingAccounts(true);

      // Hae organisaation ID (public.users.id)
      const orgId = await getUserOrgId(user.id);
      if (!orgId) {
        console.error("Organisaation ID ei löytynyt");
        setSocialAccounts([]);
        return [];
      }

      // Haetaan yhdistetyt sometilit käyttäen organisaation ID:tä
      const { data: accountsData, error: accountsError } = await supabase
        .from("user_social_accounts")
        .select(
          "mixpost_account_uuid, provider, account_name, profile_image_url, username",
        )
        .eq("user_id", orgId) // Käytetään organisaation ID:tä
        .eq("is_authorized", true)
        .order("last_synced_at", { ascending: false });

      if (accountsError) {
        console.error("Error fetching social accounts:", accountsError);
        setSocialAccounts([]);
        return [];
      }
      setSocialAccounts(accountsData || []);
      return accountsData || [];
    } catch (error) {
      console.error("Error fetching social accounts:", error);
      setSocialAccounts([]);
      return [];
    } finally {
      setLoadingAccounts(false);
    }
  };

  useEffect(() => {
    if (!user || hasInitialized.current) return;

    hasInitialized.current = true;
    fetchContents();
    // Somekanavat haetaan vain jos niitä tarvitaan
  }, [user]);

  // Filtteröidään sisältö
  const filteredContents = contents
    // Tab-kohtainen perussuodatus
    .filter((content) =>
      activeTab === "archive"
        ? content.status === "Arkistoitu"
        : content.status !== "Arkistoitu",
    )
    // Hakusana, status ja tyyppi
    .filter((content) => {
      const matchesSearch =
        (content.title?.toLowerCase() || "").includes(
          searchTerm.toLowerCase(),
        ) ||
        (content.caption?.toLowerCase() || "").includes(
          searchTerm.toLowerCase(),
        );
      const matchesStatus =
        statusFilter === "" || content.status === statusFilter;
      const matchesType = typeFilter === "" || content.type === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });

  const handleCreateContent = async (contentData) => {
    try {
      // Estä luonti jos kuukausiraja täynnä
      if (!monthlyLimit.canCreate) {
        setShowCreateModal(false);
        toast.warning(t("errors.monthlyLimitReached"));
        return;
      }
      // Hae organisaation ID (public.users.id)
      const orgId = await getUserOrgId(user.id);
      if (!orgId) {
        throw new Error("Organisaation ID ei löytynyt");
      }

      // Hae myös company_id jos tarvitaan
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("company_id")
        .eq("id", orgId)
        .single();

      const companyId = userData?.company_id || null;

      // Lähetetään idea-generation kutsu N8N:lle
      try {
        const response = await fetch("/api/ai/generate-ideas", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            idea: contentData.title,
            content: contentData.content,
            type: contentData.type,
            companyId: companyId,
          }),
        });

        if (!response.ok) {
          console.error("Idea generation failed:", response.status);
        } else {
          const result = await response.json();
        }
      } catch (webhookError) {
        console.error("Idea generation webhook error:", webhookError);
      }

      setShowCreateModal(false);
      toast.success(t("blogNewsletter.alerts.ideaSent"));
      monthlyLimit.refresh();
    } catch (error) {
      console.error("Virhe uuden sisällön luomisessa:", error);
      toast.error(t("errors.contentCreationFailed"));
    }
  };

  const handleViewContent = async (content) => {
    setViewingContent(content);
    setShowViewModal(true);
  };

  const handleEditContent = async (content) => {
    setEditingContent(content);
    setShowEditModal(true);
  };

  const handleUpdateContent = async (contentData) => {
    try {
      // Hae organisaation ID (public.users.id)
      const orgId = await getUserOrgId(user.id);
      if (!orgId) {
        throw new Error("Organisaation ID ei löytynyt");
      }

      // Päivitetään content Supabase:sta
      const { error } = await supabase
        .from("content")
        .update({
          idea: contentData.title,
          caption: contentData.caption,
          blog_post: contentData.blog_post,
          updated_at: new Date().toISOString(),
        })
        .eq("id", contentData.id)
        .eq("user_id", orgId); // Käytetään organisaation ID:tä

      if (error) {
        throw error;
      }

      // Päivitetään UI
      await fetchContents();
      setShowEditModal(false);
      setEditingContent(null);
      toast.success(t("dashboard.edit.saveSuccess"));
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Päivitys epäonnistui: " + error.message);
    }
  };

  const handleImageUpload = async (event, contentId) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      // Hae organisaation ID (public.users.id)
      const orgId = await getUserOrgId(user.id);
      if (!orgId) {
        throw new Error("Organisaation ID ei löytynyt");
      }

      const formData = new FormData();
      formData.append("image", file);
      formData.append("contentId", contentId);
      formData.append("userId", orgId); // Käytetään organisaation ID:tä
      formData.append("replaceMode", "true");

      const response = await fetch("/api/content/media-management", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Kuvan lataus epäonnistui");
      }

      // Päivitetään UI
      await fetchContents();
      toast.success("Kuva päivitetty");
    } catch (error) {
      console.error("Image upload error:", error);

      let errorMessage = "Kuvan lataus epäonnistui: " + error.message;

      // Jos network error, anna selkeämpi viesti
      if (
        error.message.includes("Failed to fetch") ||
        error.message.includes("NetworkError")
      ) {
        errorMessage =
          "Verkkoyhteys ongelma. Tarkista internetyhteytesi ja kokeile uudelleen.";
      }

      // Näytä toast käyttäjälle
      toast.error(t("errors.imageUploadError", { error: errorMessage }));
    }
  };

  const handlePublishContent = async (content) => {
    try {
      setPublishingId(content.id);

      // Estä julkaisu, jos blogiteksti puuttuu
      if (
        !content?.blog_post ||
        String(content.blog_post).trim().length === 0
      ) {
        setPublishingId(null);
        toast.warning(t("blogNewsletter.alerts.addBlogTextFirst"));
        return;
      }

      // Haetaan media-data suoraan Supabase:sta
      let mediaUrls = [];
      let segments = [];
      let mixpostConfig = null;

      // Hae organisaation ID (public.users.id)
      const orgId = await getUserOrgId(user.id);
      if (!orgId) {
        throw new Error("Organisaation ID ei löytynyt");
      }

      // Haetaan Mixpost config data käyttäen organisaation ID:tä
      const { data: mixpostConfigData, error: mixpostError } = await supabase
        .from("user_mixpost_config")
        .select("mixpost_api_token, mixpost_workspace_uuid")
        .eq("user_id", orgId) // Käytetään organisaation ID:tä
        .eq("is_active", true)
        .single();

      if (mixpostError) {
        console.error("Error fetching Mixpost config:", mixpostError);
      } else {
        mixpostConfig = mixpostConfigData;
      }

      // Haetaan content data
      const { data: contentData, error: contentError } = await supabase
        .from("content")
        .select("*")
        .eq("id", content.id)
        .eq("user_id", orgId) // Käytetään organisaation ID:tä
        .single();

      if (contentError) {
        console.error("Error fetching content:", contentError);
      } else {
        mediaUrls = contentData.media_urls || [];
      }

      // Blogit ja newsletterit eivät vaadi sometilejä julkaisuun
      // Sometilit tarvitaan vain jos ne halutaan jakaa sosiaalisessa mediassa
      let selectedAccountIds = [];

      // Lähetetään data backend:iin, joka hoitaa Supabase-kyselyt
      const publishData = {
        post_id: content.id,
        user_id: user.id,
        auth_user_id: user.id,
        content: content.caption || content.title,
        media_urls: mediaUrls,
        scheduled_date: content.scheduledDate || null,
        publish_date: content.publishDate || null,
        post_type: content.type === "Newsletter" ? "post" : "post", // Blog ja Newsletter ovat 'post' tyyppiä
        action: "publish",
        selected_accounts: selectedAccountIds, // Lisätään valitut somekanavat
      };

      // Lisää Mixpost config data jos saatavilla
      if (mixpostConfig) {
        publishData.mixpost_api_token = mixpostConfig.mixpost_api_token;
        publishData.mixpost_workspace_uuid =
          mixpostConfig.mixpost_workspace_uuid;
      }

      // Hae access token
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Käyttäjä ei ole kirjautunut");
      }

      // Blogien julkaisu käyttää erillistä endpointia
      const response = await axios.post(
        "/api/content/blog/publish",
        publishData,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.status === 200 && response.data?.success) {
        // Päivitetään UI
        await fetchContents();
        toast.success(response.data.message || "Julkaistu");
      } else {
        throw new Error(response.data?.error || "Julkaisu epäonnistui");
      }
    } catch (error) {
      console.error("Publish error:", error);

      // Käsittele axios-virheet erikseen
      let errorMessage = "Julkaisu epäonnistui";

      if (error.response) {
        // Serveri vastasi virhekoodilla
        const status = error.response.status;
        const data = error.response.data;

        if (data?.error) {
          errorMessage = data.error;
          if (data?.details) {
            errorMessage += `: ${data.details}`;
          }
          if (data?.hint) {
            errorMessage += `\n\nVihje: ${data.hint}`;
          }
        } else if (data?.message) {
          errorMessage = data.message;
        } else {
          errorMessage = `HTTP ${status}: ${error.response.statusText || "Tuntematon virhe"}`;
        }
      } else if (error.request) {
        // Pyyntö lähetettiin mutta vastausta ei saatu
        errorMessage = "Ei vastausta palvelimelta. Tarkista verkkoyhteys.";
      } else {
        // Jokin muu virhe
        errorMessage = error.message || "Tuntematon virhe";
      }

      toast.error(errorMessage);
    } finally {
      setPublishingId(null);
    }
  };

  const handleArchiveContent = async (content) => {
    try {
      // Hae organisaation ID (public.users.id)
      const orgId = await getUserOrgId(user.id);
      if (!orgId) {
        throw new Error("Organisaation ID ei löytynyt");
      }

      const { error } = await supabase
        .from("content")
        .update({ status: "Archived" })
        .eq("id", content.id)
        .eq("user_id", orgId); // Käytetään organisaation ID:tä

      if (error) throw error;

      await fetchContents();
      toast.success("Siirretty arkistoon");
    } catch (err) {
      console.error("Archive error:", err);
      toast.error(t("alerts.error.archiveFailed", { error: err.message }));
    }
  };

  const handleDeleteContent = async (contentId) => {
    try {
      // Hae organisaation ID (public.users.id)
      const orgId = await getUserOrgId(user.id);
      if (!orgId) {
        throw new Error("Organisaation ID ei löytynyt");
      }

      // Poistetaan sisältö Supabase:sta
      const { error } = await supabase
        .from("content")
        .delete()
        .eq("id", contentId)
        .eq("user_id", orgId); // Käytetään organisaation ID:tä

      if (error) {
        throw error;
      }

      // Päivitetään UI
      await fetchContents();
      toast.success("Poistettu");
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(t("alerts.error.deleteFailed", { error: error.message }));
    }
  };

  const handleDownloadImage = async (imageUrl, title) => {
    try {
      // Luodaan turvallinen tiedostonimi
      const safeTitle = title
        .replace(/[^a-zA-Z0-9\s]/g, "")
        .replace(/\s+/g, "_");
      const fileName = `${safeTitle}_image.jpg`;

      // Haetaan kuva
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error("Kuvan lataus epäonnistui");
      }

      const blob = await response.blob();

      // Luodaan latauslinkki
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();

      // Siivotaan
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Kuva ladattu");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Lataus epäonnistui");
    }
  };

  // ESC-näppäimellä sulkeutuminen
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape") {
        if (showCreateModal) {
          setShowCreateModal(false);
        }
        if (showViewModal) {
          setShowViewModal(false);
          setViewingContent(null);
        }
        if (showEditModal) {
          setShowEditModal(false);
          setEditingContent(null);
        }
      }
    };

    if (showCreateModal || showViewModal || showEditModal) {
      document.addEventListener("keydown", handleEscKey);
      return () => document.removeEventListener("keydown", handleEscKey);
    }
  }, [showCreateModal, showViewModal, showEditModal]);

  return (
    <div className="blog-newsletter-container">
      {/* Page Header */}
      <div className="blog-newsletter-header">
        <h2>{t("blogNewsletter.header")}</h2>
        <div className="quota-indicators">
          {monthlyLimit.loading ? (
            <div className="monthly-limit-indicator loading">
              {t("monthlyLimit.loading")}
            </div>
          ) : (
            <div
              className={`monthly-limit-indicator ${!monthlyLimit.isUnlimited && monthlyLimit.remaining <= 5 ? "warning" : "normal"}`}
            >
              <span className="limit-text">
                {monthlyLimit.currentCount}/
                {monthlyLimit.isUnlimited ? "∞" : monthlyLimit.monthlyLimit}{" "}
                {t("monthlyLimit.generatedThisMonth")}
              </span>
              {!monthlyLimit.isUnlimited &&
                monthlyLimit.remaining <= 5 &&
                monthlyLimit.remaining > 0 && (
                  <span className="warning-text">
                    {t("monthlyLimit.onlyRemaining", {
                      count: monthlyLimit.remaining,
                    })}
                  </span>
                )}
              {!monthlyLimit.isUnlimited && monthlyLimit.remaining === 0 && (
                <span className="limit-reached">
                  {t("monthlyLimit.quotaFull")}
                </span>
              )}
            </div>
          )}

          {nextMonthQuota.loading ? (
            <div className="monthly-limit-indicator loading">
              {t("monthlyLimit.loadingNextMonth")}
            </div>
          ) : (
            <div
              className={`monthly-limit-indicator ${!nextMonthQuota.isUnlimited && nextMonthQuota.nextMonthRemaining <= 5 ? "warning" : "normal"}`}
            >
              <span className="limit-text">
                {nextMonthQuota.nextMonthCount}/
                {nextMonthQuota.isUnlimited
                  ? "∞"
                  : nextMonthQuota.nextMonthLimit}{" "}
                {t("monthlyLimit.generatedNextMonth")}
              </span>
              {!nextMonthQuota.isUnlimited &&
                nextMonthQuota.nextMonthRemaining <= 5 &&
                nextMonthQuota.nextMonthRemaining > 0 && (
                  <span className="warning-text">
                    {t("monthlyLimit.onlyRemaining", {
                      count: nextMonthQuota.nextMonthRemaining,
                    })}
                  </span>
                )}
              {!nextMonthQuota.isUnlimited &&
                nextMonthQuota.nextMonthRemaining === 0 && (
                  <span className="limit-reached">
                    {t("monthlyLimit.nextMonthQuotaFull")}
                  </span>
                )}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab-button ${activeTab === "main" ? "active" : ""}`}
          onClick={() => setActiveTab("main")}
        >
          {t("blogNewsletter.tabs.content")}
        </button>
        <button
          className={`tab-button ${activeTab === "archive" ? "active" : ""}`}
          onClick={() => setActiveTab("archive")}
        >
          {t("blogNewsletter.tabs.archive")}
        </button>
      </div>

      {/* Search and Filters */}
      <div className="search-filters">
        <input
          type="text"
          placeholder={t("blogNewsletter.searchPlaceholder")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="status-filter"
        >
          <option value="">{t("blogNewsletter.filters.allStatuses")}</option>
          <option value="Tarkistuksessa">
            {t("blogNewsletter.status.Tarkistuksessa")}
          </option>
          <option value="Valmis">{t("blogNewsletter.status.Valmis")}</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="type-filter"
        >
          <option value="">{t("blogNewsletter.filters.allTypes")}</option>
          <option value="Blog">{t("blogNewsletter.types.blog")}</option>
          <option value="Newsletter">
            {t("blogNewsletter.types.newsletter")}
          </option>
        </select>
        <Button
          variant="primary"
          onClick={() => {
            if (monthlyLimit.canCreate) {
              setShowCreateModal(true);
            } else {
              toast.warning("Kuukausiraja täynnä");
            }
          }}
          disabled={!monthlyLimit.canCreate}
        >
          {t("blogNewsletter.actions.createNew")}
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <div className="error-state">
          <p>❌ {error}</p>
          <Button
            variant="secondary"
            onClick={() => {
              window.location.reload();
            }}
          >
            {t("blogNewsletter.actions.retry")}
          </Button>
        </div>
      )}

      {/* Content Grid */}
      {!error && (
        <div className="content-grid">
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>{t("blogNewsletter.loading.loadingContent")}</p>
            </div>
          ) : filteredContents.length === 0 ? (
            activeTab === "archive" ? (
              <div className="empty-state">
                <div className="empty-icon"></div>
                <h3>{t("blogNewsletter.empty.archiveTitle")}</h3>
                <p>{t("blogNewsletter.empty.archiveDescription")}</p>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon"></div>
                <h3>{t("blogNewsletter.empty.title")}</h3>
                <p>{t("blogNewsletter.empty.description")}</p>
                <Button
                  variant="primary"
                  onClick={() => setShowCreateModal(true)}
                >
                  {t("blogNewsletter.empty.createFirst")}
                </Button>
              </div>
            )
          ) : (
            filteredContents.map((content) => (
              <ContentCard
                key={content.id}
                content={content}
                onView={handleViewContent}
                onPublish={handlePublishContent}
                onArchive={handleArchiveContent}
                onDownload={handleDownloadImage}
                onEdit={handleEditContent}
                publishingId={publishingId}
              />
            ))
          )}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal &&
        createPortal(
          <div
            className="modal-overlay modal-overlay--light"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowCreateModal(false);
              }
            }}
          >
            <div className="modal-container max-w-[900px] h-[80vh]">
              <div className="modal-header">
                <h2 className="modal-title">
                  {t("blogNewsletter.createModal.title")}
                </h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="modal-close-btn"
                >
                  ✕
                </button>
              </div>
              <div className="modal-content">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    handleCreateContent({
                      title: formData.get("title"),
                      content: formData.get("content"),
                      type: formData.get("type"),
                    });
                  }}
                >
                  <div className="form-group">
                    <label className="form-label">
                      {t("blogNewsletter.createModal.fields.title")}
                    </label>
                    <input
                      name="title"
                      type="text"
                      required
                      className="form-input"
                      placeholder={t(
                        "blogNewsletter.createModal.placeholders.title",
                      )}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">
                      {t("blogNewsletter.createModal.fields.type")}
                    </label>
                    <select name="type" required className="form-select">
                      <option value="blog">Blog</option>
                      <option value="newsletter">Newsletter</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">
                      {t("blogNewsletter.createModal.fields.content")}
                    </label>
                    <textarea
                      name="content"
                      rows={12}
                      required
                      className="form-textarea"
                      placeholder={t(
                        "blogNewsletter.createModal.placeholders.content",
                      )}
                    />
                  </div>
                  <div className="modal-actions">
                    <div className="modal-actions-left">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setShowCreateModal(false)}
                      >
                        {t("blogNewsletter.actions.cancel")}
                      </Button>
                    </div>
                    <div className="modal-actions-right">
                      <Button type="submit" variant="primary">
                        {t("blogNewsletter.createModal.create")}
                      </Button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* View Modal */}
      {showViewModal &&
        viewingContent &&
        createPortal(
          <div
            className="modal-overlay modal-overlay--light"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowViewModal(false);
              }
            }}
          >
            <div className="modal-container max-w-[900px] h-[80vh]">
              <div className="modal-header">
                <h2 className="modal-title">{viewingContent.title}</h2>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="modal-close-btn"
                >
                  X
                </button>
              </div>
              <div className="modal-content">
                <div className="content-view">
                  {/* Näytä thumbnail kuva jos saatavilla */}
                  {viewingContent.thumbnail &&
                  viewingContent.thumbnail !== "/placeholder.png" ? (
                    <div className="view-thumbnail">
                      <img
                        src={viewingContent.thumbnail}
                        alt="Thumbnail"
                        className="view-thumbnail-image"
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.nextSibling.style.display = "flex";
                        }}
                      />
                      <div className="view-thumbnail-placeholder hidden">
                        <img
                          src="/placeholder.png"
                          alt="Placeholder"
                          className="w-full h-full object-cover rounded-xl"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="view-thumbnail">
                      <img
                        src="/placeholder.png"
                        alt="Placeholder"
                        className="w-full h-full object-cover rounded-xl"
                      />
                    </div>
                  )}

                  <div className="content-meta">
                    <span className="content-type">
                      {viewingContent.type === "Blog"
                        ? t("general.blog")
                        : t("general.newsletter")}
                    </span>
                    <span className="content-date">
                      {viewingContent.createdAt
                        ? new Date(viewingContent.createdAt).toLocaleDateString(
                            i18n.language === "fi" ? "fi-FI" : "en-US",
                          )
                        : t("blogNewsletter.placeholders.noDate")}
                    </span>
                  </div>
                  <div className="content-body">
                    {/* Näytä blog_post jos se on olemassa, muuten caption */}
                    {viewingContent.blog_post ? (
                      <ReactMarkdown>{viewingContent.blog_post}</ReactMarkdown>
                    ) : viewingContent.caption ? (
                      <ReactMarkdown>{viewingContent.caption}</ReactMarkdown>
                    ) : (
                      <p className="text-gray-500 italic">
                        {t("blogNewsletter.placeholders.noContent")}
                      </p>
                    )}
                  </div>

                  {/* Näytä lisätietoja jos saatavilla */}
                  {viewingContent.idea &&
                    viewingContent.idea !== viewingContent.title && (
                      <div className="mt-5 p-4 bg-gray-50 rounded-lg">
                        <h4 className="m-0 mb-2 text-sm text-gray-500">
                          {t("blogNewsletter.viewModal.originalIdea")}
                        </h4>
                        <p className="m-0 text-sm">
                          {viewingContent.idea}
                        </p>
                      </div>
                    )}

                  {/* Näytä status */}
                  <div className="mt-4 p-3 bg-slate-100 rounded-md">
                    <span className="text-xs font-semibold text-slate-600">
                      {t("blogNewsletter.viewModal.status")}{" "}
                      {viewingContent.status}
                    </span>
                  </div>
                </div>
                <div className="modal-actions">
                  <div className="modal-actions-left">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setShowViewModal(false)}
                    >
                      {t("blogNewsletter.actions.close")}
                    </Button>
                  </div>
                  <div className="modal-actions-right">
                    {viewingContent.status !== "Valmis" &&
                      viewingContent.status !== "Done" &&
                      viewingContent.status !== "Julkaistu" &&
                      viewingContent.status !== "Published" &&
                      viewingContent.status !== "Arkistoitu" &&
                      viewingContent.status !== "Archived" && (
                        <Button
                          type="button"
                          variant="primary"
                          onClick={() => {
                            handlePublishContent(viewingContent);
                          }}
                          disabled={publishingId === viewingContent.id}
                          className="mr-2 bg-green-500 border-green-600"
                        >
                          {publishingId === viewingContent.id
                            ? t("blogNewsletter.actions.publishing")
                            : t("blogNewsletter.actions.publish")}
                        </Button>
                      )}
                    <Button
                      type="button"
                      variant="danger"
                      onClick={() => {
                        if (
                          window.confirm(
                            t("blogNewsletter.alerts.deleteConfirm"),
                          )
                        ) {
                          handleDeleteContent(viewingContent.id);
                          setShowViewModal(false);
                        }
                      }}
                    >
                      {t("blogNewsletter.actions.delete")}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Edit Modal */}
      {showEditModal &&
        editingContent &&
        createPortal(
          <div
            className="modal-overlay modal-overlay--light"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowEditModal(false);
                setEditingContent(null);
              }
            }}
          >
            <div className="modal-container max-w-[900px] h-[80vh]">
              <div className="modal-header">
                <h2 className="modal-title">{editingContent.title}</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingContent(null);
                  }}
                  className="modal-close-btn"
                >
                  X
                </button>
              </div>
              <div className="modal-content">
                {/* Yhtenäistetty esikatseluosio kuten katselumodaalissa */}
                <div className="content-view">
                  {editingContent.thumbnail &&
                  editingContent.thumbnail !== "/placeholder.png" ? (
                    <div className="view-thumbnail">
                      <img
                        src={editingContent.thumbnail}
                        alt="Thumbnail"
                        className="view-thumbnail-image"
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.nextSibling.style.display = "flex";
                        }}
                      />
                      <div className="view-thumbnail-placeholder hidden">
                        <img
                          src="/placeholder.png"
                          alt="Placeholder"
                          className="w-full h-full object-cover rounded-xl"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="view-thumbnail">
                      <img
                        src="/placeholder.png"
                        alt="Placeholder"
                        className="w-full h-full object-cover rounded-xl"
                      />
                    </div>
                  )}
                  <div className="content-meta">
                    <span className="content-type">
                      {editingContent.type === "Blog" ? "Blog" : "Newsletter"}
                    </span>
                    <span className="content-date">
                      {editingContent.createdAt || ""}
                    </span>
                  </div>
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    handleUpdateContent({
                      id: editingContent.id,
                      title: formData.get("title"),
                      caption: editingContent.caption,
                      blog_post: formData.get("blog_post"),
                    });
                  }}
                >
                  <div className="form-group">
                    <label className="form-label hidden">
                      Otsikko
                    </label>
                    <input
                      name="title"
                      type="text"
                      required
                      className="form-input border-none outline-none bg-transparent p-0 text-xl font-semibold mb-2"
                      defaultValue={editingContent.title}
                      placeholder={t("placeholders.contentTitle")}
                    />
                  </div>
                  {/* Tyyppi näkyvissä (read-only) */}
                  <div className="form-group">
                    <label className="form-label">Tyyppi</label>
                    <div className="form-input pointer-events-none opacity-80">
                      {editingContent.type === "Blog" ? "Blog" : "Newsletter"}
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Blogiteksti</label>
                    <textarea
                      name="blog_post"
                      rows={14}
                      className="form-textarea"
                      defaultValue={editingContent.blog_post || ""}
                      placeholder="Blogiteksti markdownina"
                    />
                  </div>
                  <div className="form-group mt-2">
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-600">
                      <strong>Markdown-vinkit:</strong>
                      <div className="mt-1.5">
                        <code># Otsikko 1</code>, <code>## Otsikko 2</code>,{" "}
                        <code>### Otsikko 3</code>
                      </div>
                    </div>
                  </div>
                  {/* Meta description vain luettavana */}
                  {editingContent.meta_description && (
                    <div className="form-group">
                      <label className="form-label">Meta Description</label>
                      <div className="form-textarea pointer-events-none opacity-80">
                        {editingContent.meta_description}
                      </div>
                    </div>
                  )}
                  <div className="modal-actions">
                    <div className="modal-actions-left">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          setShowEditModal(false);
                          setEditingContent(null);
                        }}
                      >
                        {t("blogNewsletter.actions.cancel")}
                      </Button>
                    </div>
                    <div className="modal-actions-right">
                      <Button type="submit" variant="primary">
                        {t("blogNewsletter.actions.saveChanges")}
                      </Button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
