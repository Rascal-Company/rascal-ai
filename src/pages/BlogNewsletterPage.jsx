import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { getUserOrgId } from "../lib/getUserOrgId";
import { useMonthlyLimit } from "../hooks/useMonthlyLimit";
import { useNextMonthQuota } from "../hooks/useNextMonthQuota";
import axios from "axios";

import {
  ContentCard,
  CreateContentModal,
  ViewContentModal,
  EditContentModal,
  transformSupabaseData,
} from "../components/blog-newsletter";

export default function BlogNewsletterPage() {
  const { t } = useTranslation("common");
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
  const [activeTab, setActiveTab] = useState("main");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [viewingContent, setViewingContent] = useState(null);
  const [editingContent, setEditingContent] = useState(null);
  const [publishingId, setPublishingId] = useState(null);

  const hasInitialized = useRef(false);

  // Fetch data from Supabase
  const fetchContents = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const orgId = await getUserOrgId(user.id);
      if (!orgId) {
        throw new Error(t("alerts.error.organizationIdNotFound"));
      }

      const { data, error } = await supabase
        .from("content")
        .select("*")
        .eq("user_id", orgId)
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

  useEffect(() => {
    if (!user || hasInitialized.current) return;
    hasInitialized.current = true;
    fetchContents();
  }, [user]);

  // Filter contents
  const filteredContents = contents
    .filter((content) =>
      activeTab === "archive"
        ? content.status === "Arkistoitu"
        : content.status !== "Arkistoitu",
    )
    .filter((content) => {
      const matchesSearch =
        (content.title?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (content.caption?.toLowerCase() || "").includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "" || content.status === statusFilter;
      const matchesType = typeFilter === "" || content.type === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });

  // Handlers
  const handleCreateContent = async (contentData) => {
    try {
      if (!monthlyLimit.canCreate) {
        setShowCreateModal(false);
        toast.warning(t("errors.monthlyLimitReached"));
        return;
      }

      const orgId = await getUserOrgId(user.id);
      if (!orgId) {
        throw new Error("Organisaation ID ei löytynyt");
      }

      const { data: userData } = await supabase
        .from("users")
        .select("company_id")
        .eq("id", orgId)
        .single();

      const companyId = userData?.company_id || null;

      try {
        const response = await fetch("/api/ai/generate-ideas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            idea: contentData.title,
            content: contentData.content,
            type: contentData.type,
            companyId: companyId,
            userId: orgId,
          }),
        });

        if (!response.ok) {
          console.error("Idea generation failed:", response.status);
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
      const orgId = await getUserOrgId(user.id);
      if (!orgId) {
        throw new Error("Organisaation ID ei löytynyt");
      }

      const { error } = await supabase
        .from("content")
        .update({
          idea: contentData.title,
          caption: contentData.caption,
          blog_post: contentData.blog_post,
          updated_at: new Date().toISOString(),
        })
        .eq("id", contentData.id)
        .eq("user_id", orgId);

      if (error) {
        throw error;
      }

      await fetchContents();
      setShowEditModal(false);
      setEditingContent(null);
      toast.success(t("dashboard.edit.saveSuccess"));
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Päivitys epäonnistui: " + error.message);
    }
  };

  const handlePublishContent = async (content) => {
    try {
      setPublishingId(content.id);

      if (!content?.blog_post || String(content.blog_post).trim().length === 0) {
        setPublishingId(null);
        toast.warning(t("blogNewsletter.alerts.addBlogTextFirst"));
        return;
      }

      let mediaUrls = [];
      let mixpostConfig = null;

      const orgId = await getUserOrgId(user.id);
      if (!orgId) {
        throw new Error("Organisaation ID ei löytynyt");
      }

      const { data: mixpostConfigData, error: mixpostError } = await supabase
        .from("user_mixpost_config")
        .select("mixpost_api_token, mixpost_workspace_uuid")
        .eq("user_id", orgId)
        .eq("is_active", true)
        .single();

      if (!mixpostError) {
        mixpostConfig = mixpostConfigData;
      }

      const { data: contentData, error: contentError } = await supabase
        .from("content")
        .select("*")
        .eq("id", content.id)
        .eq("user_id", orgId)
        .single();

      if (!contentError) {
        mediaUrls = contentData.media_urls || [];
      }

      const publishData = {
        post_id: content.id,
        user_id: user.id,
        auth_user_id: user.id,
        content: content.caption || content.title,
        media_urls: mediaUrls,
        scheduled_date: content.scheduledDate || null,
        publish_date: content.publishDate || null,
        post_type: "post",
        action: "publish",
        selected_accounts: [],
      };

      if (mixpostConfig) {
        publishData.mixpost_api_token = mixpostConfig.mixpost_api_token;
        publishData.mixpost_workspace_uuid = mixpostConfig.mixpost_workspace_uuid;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Käyttäjä ei ole kirjautunut");
      }

      const response = await axios.post("/api/content/blog/publish", publishData, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.status === 200 && response.data?.success) {
        await fetchContents();
        toast.success(response.data.message || "Julkaistu");
      } else {
        throw new Error(response.data?.error || "Julkaisu epäonnistui");
      }
    } catch (error) {
      console.error("Publish error:", error);

      let errorMessage = "Julkaisu epäonnistui";

      if (error.response) {
        const data = error.response.data;
        if (data?.error) {
          errorMessage = data.error;
          if (data?.details) errorMessage += `: ${data.details}`;
          if (data?.hint) errorMessage += `\n\nVihje: ${data.hint}`;
        } else if (data?.message) {
          errorMessage = data.message;
        } else {
          errorMessage = `HTTP ${error.response.status}: ${error.response.statusText || "Tuntematon virhe"}`;
        }
      } else if (error.request) {
        errorMessage = "Ei vastausta palvelimelta. Tarkista verkkoyhteys.";
      } else {
        errorMessage = error.message || "Tuntematon virhe";
      }

      toast.error(errorMessage);
    } finally {
      setPublishingId(null);
    }
  };

  const handleArchiveContent = async (content) => {
    try {
      const orgId = await getUserOrgId(user.id);
      if (!orgId) {
        throw new Error("Organisaation ID ei löytynyt");
      }

      const { error } = await supabase
        .from("content")
        .update({ status: "Archived" })
        .eq("id", content.id)
        .eq("user_id", orgId);

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
      const orgId = await getUserOrgId(user.id);
      if (!orgId) {
        throw new Error("Organisaation ID ei löytynyt");
      }

      const { error } = await supabase
        .from("content")
        .delete()
        .eq("id", contentId)
        .eq("user_id", orgId);

      if (error) {
        throw error;
      }

      await fetchContents();
      toast.success("Poistettu");
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(t("alerts.error.deleteFailed", { error: error.message }));
    }
  };

  const handleDownloadImage = async (imageUrl, title) => {
    try {
      const safeTitle = title.replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "_");
      const fileName = `${safeTitle}_image.jpg`;

      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error("Kuvan lataus epäonnistui");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Kuva ladattu");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Lataus epäonnistui");
    }
  };

  // ESC key to close modals
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape") {
        if (showCreateModal) setShowCreateModal(false);
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
    <div className="p-4 sm:p-8 lg:p-12 max-w-[1700px] mx-auto min-h-screen space-y-12">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-gray-900 tracking-tight leading-none">{t("blogNewsletter.header")}</h1>
          <p className="text-gray-400 text-lg font-medium">{t("blogNewsletter.subtitle") || "Hallinnoi blogeja ja uutiskirjeitä"}</p>
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

      {/* Tab Navigation & Action Bar */}
      <div className="bg-white/60 backdrop-blur-xl rounded-[32px] border border-gray-100 shadow-xl shadow-gray-200/10 p-2 sm:p-3 flex flex-row gap-2 sm:gap-6 justify-between items-center sticky top-4 z-40 transition-all hover:shadow-2xl overflow-hidden">
        <div className="flex p-1 sm:p-1.5 bg-gray-50/80 rounded-[24px] overflow-x-auto no-scrollbar gap-1 border border-gray-100 flex-1 sm:flex-none">
          {[
            { id: 'main', label: t("blogNewsletter.tabs.content"), icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg> },
            { id: 'archive', label: t("blogNewsletter.tabs.archive"), icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg> },
          ].map(tab => (
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

        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <button
            onClick={() => {
              if (monthlyLimit.canCreate) {
                setShowCreateModal(true);
              } else {
                toast.warning("Kuukausiraja täynnä");
              }
            }}
            disabled={!monthlyLimit.canCreate}
            className="px-4 sm:px-8 py-2 sm:py-3 bg-gray-900 hover:bg-black text-white text-[10px] sm:text-xs font-bold uppercase tracking-widest rounded-2xl shadow-xl shadow-gray-900/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            <span className="sm:hidden">+ Luo</span>
            <span className="hidden sm:inline">{t("blogNewsletter.actions.createNew")}</span>
          </button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="relative flex-1 group">
          <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-gray-300 group-focus-within:text-blue-500 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t("blogNewsletter.searchPlaceholder")}
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
              <option value="">{t("blogNewsletter.filters.allTypes")}</option>
              <option value="Blog">{t("blogNewsletter.types.blog")}</option>
              <option value="Newsletter">{t("blogNewsletter.types.newsletter")}</option>
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
              <option value="">{t("blogNewsletter.filters.allStatuses")}</option>
              <option value="Tarkistuksessa">{t("blogNewsletter.status.Tarkistuksessa")}</option>
              <option value="Valmis">{t("blogNewsletter.status.Valmis")}</option>
            </select>
            <div className="absolute inset-y-0 right-6 flex items-center pointer-events-none text-gray-300">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50/50 border border-red-100 rounded-[40px] p-12 text-center animate-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-white rounded-3xl shadow-xl shadow-red-200/50 flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">{t("blogNewsletter.errors.error") || "Virhe"}</h3>
          <p className="text-red-600 font-medium mb-8 max-w-md mx-auto">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-widest rounded-2xl shadow-xl shadow-red-200 transition-all hover:scale-105 active:scale-95"
          >
            {t("blogNewsletter.actions.retry")}
          </button>
        </div>
      )}

      {/* Content Views */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {!error && loading && (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-16 h-16 rounded-full border-4 border-gray-100 border-t-blue-500 animate-spin mb-6" />
            <p className="text-gray-400 font-medium">{t("blogNewsletter.loading.loadingContent")}</p>
          </div>
        )}

        {!error && !loading && filteredContents.length === 0 && (
          activeTab === "archive" ? (
            <div className="bg-gray-50/50 rounded-[40px] p-16 text-center">
              <div className="w-24 h-24 bg-white rounded-3xl shadow-xl shadow-gray-200/50 flex items-center justify-center mx-auto mb-8">
                <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">{t("blogNewsletter.empty.archiveTitle")}</h3>
              <p className="text-gray-400 font-medium max-w-md mx-auto">{t("blogNewsletter.empty.archiveDescription")}</p>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-blue-50/50 to-indigo-50/50 rounded-[40px] p-16 text-center">
              <div className="w-24 h-24 bg-white rounded-3xl shadow-xl shadow-blue-200/50 flex items-center justify-center mx-auto mb-8">
                <svg className="w-12 h-12 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">{t("blogNewsletter.empty.title")}</h3>
              <p className="text-gray-400 font-medium max-w-md mx-auto mb-8">{t("blogNewsletter.empty.description")}</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-8 py-4 bg-gray-900 hover:bg-black text-white text-xs font-bold uppercase tracking-widest rounded-2xl shadow-xl shadow-gray-900/20 transition-all hover:scale-105 active:scale-95"
              >
                {t("blogNewsletter.empty.createFirst")}
              </button>
            </div>
          )
        )}

        {!error && !loading && filteredContents.length > 0 && (
          <div className="content-cards-grid">
            {filteredContents.map((content) => (
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
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateContentModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateContent}
      />

      <ViewContentModal
        isOpen={showViewModal}
        content={viewingContent}
        onClose={() => {
          setShowViewModal(false);
          setViewingContent(null);
        }}
        onPublish={handlePublishContent}
        onDelete={handleDeleteContent}
        publishingId={publishingId}
      />

      <EditContentModal
        isOpen={showEditModal}
        content={editingContent}
        onClose={() => {
          setShowEditModal(false);
          setEditingContent(null);
        }}
        onSubmit={handleUpdateContent}
      />
    </div>
  );
}
