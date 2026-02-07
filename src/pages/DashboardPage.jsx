import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { createPortal } from "react-dom";
import axios from "axios";
// Analytics data haetaan nyt iframe:n kautta
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";
import PageHeader from "../components/PageHeader";
import { supabase } from "../lib/supabase";
// CSS Module removed - styles moved to main.css
import { useAuth } from "../contexts/AuthContext";
import PageMeta from "../components/PageMeta";
import AikataulutettuModal from "../components/AikataulutettuModal";
import { useQueryClient } from "@tanstack/react-query";
import { useOrgId, useSocialAccounts, useCampaigns } from "../hooks/queries";
import {
  useSuccessStats,
  useDashboardStats,
  useGAVisitors,
  useCallPrice,
  useDashboardPosts,
  useMixpostAnalytics,
} from "../hooks/queries/useDashboardData";

function EditPostModal({ post, onClose, onSave }) {
  const { t } = useTranslation("common");
  const [idea, setIdea] = useState(post.Idea || "");
  const [caption, setCaption] = useState(post.Caption || "");
  const [publishDate, setPublishDate] = useState(
    post["Publish Date"] ? post["Publish Date"].slice(0, 16) : "",
  ); // yyyy-MM-ddTHH:mm
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 600);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 600);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      const payload = {
        "Record ID": post["Record ID"] || post.id,
        Idea: idea,
        Caption: caption,
        "Publish Date": publishDate,
        updateType: "postUpdate",
      };
      const res = await fetch("/api/social/posts/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(t("dashboard.edit.saveError"));
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onSave(payload);
      }, 1200);
    } catch (err) {
      setError(t("dashboard.edit.saveError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="edit-post-modal-overlay">
      <div className={`edit-post-modal-content ${isMobile ? "mobile" : ""}`}>
        <div className="edit-post-modal-header">
          <h2 className="edit-post-modal-title">{t("dashboard.edit.title")}</h2>
          <button onClick={onClose} className="edit-post-modal-close">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="edit-post-form">
          <div className="edit-post-form-group">
            <label>{t("dashboard.edit.ideaLabel")}</label>
            <textarea
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              className="edit-post-form-textarea min-h-[80px]"
              placeholder={t("dashboard.edit.ideaPlaceholder")}
            />
          </div>

          <div className="edit-post-form-group">
            <label>{t("dashboard.edit.captionLabel")}</label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="edit-post-form-textarea min-h-[120px]"
              placeholder={t("dashboard.edit.captionPlaceholder")}
            />
          </div>

          <div className="edit-post-form-group">
            <label>{t("dashboard.edit.publishDateLabel")}</label>
            <input
              type="datetime-local"
              value={publishDate}
              onChange={(e) => setPublishDate(e.target.value)}
              className="edit-post-form-input"
            />
          </div>

          {error && (
            <div className="p-4 rounded-md text-sm font-medium mb-4 bg-red-50 text-red-700 border border-red-200">
              {error || t("dashboard.edit.saveError")}
            </div>
          )}

          {success && (
            <div className="p-4 rounded-md text-sm font-medium mb-4 bg-green-50 text-green-700 border border-green-200">
              {t("dashboard.edit.saveSuccess")}
            </div>
          )}

          <div className="flex justify-end pt-4 gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {t("dashboard.edit.cancel")}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {saving ? t("dashboard.edit.saving") : t("dashboard.edit.save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { t, i18n } = useTranslation("common");
  const { user, organization, loading: authLoading } = useAuth();
  const { orgId, isLoading: orgLoading } = useOrgId();
  const { socialAccounts } = useSocialAccounts();
  const { campaigns } = useCampaigns();
  const queryClient = useQueryClient();

  // Filter state (must be declared before using in query hooks)
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [gaVisitorsFilter, setGaVisitorsFilter] = useState("week");
  const [mixpostTimeFilter, setMixpostTimeFilter] = useState("all");

  // TanStack Query hooks for data fetching - eliminates duplicates!
  const days = selectedFilter === "week" ? 7 : 30;
  const { data: successStats = {}, isLoading: successLoading } =
    useSuccessStats(days);
  const { data: statsData = {}, isLoading: statsLoading } = useDashboardStats();
  const {
    data: posts = [],
    isLoading: loading,
    error: postsError,
  } = useDashboardPosts();
  const { data: totalCallPrice = 0 } = useCallPrice();

  const gaVisitorsDays = gaVisitorsFilter === "week" ? 7 : 30;
  const { data: gaVisitorsResponse = {}, isLoading: gaLoading } =
    useGAVisitors(gaVisitorsDays);
  const gaConnected = gaVisitorsResponse.connected || false;
  const gaVisitors = gaVisitorsResponse.visitors || {
    total: 0,
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    trend: 0,
  };
  const gaVisitorsData = gaVisitorsResponse.data || [];

  const { data: mixpostData = null, isLoading: mixpostLoading } =
    useMixpostAnalytics(mixpostTimeFilter);

  // Local UI state
  const [editingPost, setEditingPost] = useState(null);
  const [imageModalUrl, setImageModalUrl] = useState(null);
  const [showScheduledModal, setShowScheduledModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const error = postsError?.message || null;

  // Stats data trendeillä - käytetään oikeita tietoja
  const dashboardStats = [
    {
      label: t("dashboard.metrics.stats.upcomingPosts"),
      value: statsData.upcomingCount || 0,
      trend: 12.5,
      color: "#9ca3af",
    },
    {
      label: t("dashboard.metrics.stats.publishedContent"),
      value: statsData.monthlyCount || 0,
      trend: -5.2,
      color: "#9ca3af",
    },
    {
      label: t("dashboard.metrics.stats.messageCosts"),
      value: statsData.totalMessagePrice
        ? `€${statsData.totalMessagePrice.toFixed(2)}`
        : "€0.00",
      trend: 8.7,
      color: "#9ca3af",
    },
    {
      label: t("dashboard.metrics.stats.callCosts"),
      value: statsData.totalCallPrice
        ? `€${statsData.totalCallPrice.toFixed(2)}`
        : "€0.00",
      trend: 15.3,
      color: "#9ca3af",
    },
  ];
  const [schedule, setSchedule] = useState([]);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [campaignMetrics, setCampaignMetrics] = useState([]);

  // Mixpost analytics now handled by TanStack Query - see useMixpostAnalytics() above

  // Kampanjametriikat lasketaan useCampaigns-hookin datasta (TanStack Query)
  useEffect(() => {
    if (!campaigns || campaigns.length === 0) {
      setCampaignMetrics([]);
      return;
    }
    const rows = campaigns.map((c) => {
      const total = Number(c.total_calls || 0);
      const success = Number(c.successful_calls || 0);
      const successRate = total > 0 ? Math.round((success / total) * 100) : 0;
      return { id: c.id, name: c.name, total, successRate };
    });
    setCampaignMetrics(rows);
  }, [campaigns]);

  // Platform värit
  const getPlatformColor = (platform) => {
    switch (platform?.toLowerCase()) {
      case "instagram":
        return "#e4405f";
      case "facebook":
        return "#1877f2";
      case "tiktok":
        return "#000000";
      case "twitter":
        return "#1da1f2";
      case "linkedin":
        return "#0a66c2";
      default:
        return "#6b7280";
    }
  };

  useEffect(() => {
    if (!imageModalUrl) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setImageModalUrl(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [imageModalUrl]);

  // Responsiivinen apu
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  useEffect(() => {
    const fetchSchedule = async () => {
      if (orgLoading || !orgId) {
        if (!orgLoading) {
          setSchedule([]);
          setScheduleLoading(false);
        }
        return;
      }

      setScheduleLoading(true);
      try {
        const userId = orgId;

        // Hae tulevat julkaisut Supabasesta
        const { data: supabaseData, error } = await supabase
          .from("content")
          .select(
            "id, type, idea, status, publish_date, created_at, media_urls, caption",
          )
          .eq("user_id", userId)
          .order("publish_date", { ascending: true, nullsFirst: true })
          .limit(20);

        if (error) {
          console.error("Error fetching schedule:", error);
        }

        // Hae myös Mixpost-postaukset (käytetään axiosia kuten ManagePostsPage)
        let mixpostData = [];
        try {
          const session = await supabase.auth.getSession();
          const token = session.data.session?.access_token;

          if (!token) {
            console.error("No auth token available for Mixpost API");
            mixpostData = [];
          } else {
            const response = await axios.get(
              "/api/integrations/mixpost/posts",
              {
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
              },
            );

            const mixpostPosts = response.data;

            // Käännä statusit suomeksi
            const statusMap = {
              published: "Julkaistu",
              scheduled: "Aikataulutettu",
              draft: t("status.draft"),
              failed: "Epäonnistui",
            };

            // Tarkista että mixpostPosts on array
            if (!Array.isArray(mixpostPosts)) {
              console.warn(
                "Mixpost API returned non-array data:",
                mixpostPosts,
              );
              mixpostData = [];
            } else {
              // Muunna kaikki Mixpost-postaukset samaan muotoon kuin Supabase-data
              // HUOM: API palauttaa publishDate (camelCase), muunnetaan publish_date:ksi
              mixpostData = mixpostPosts
                .filter((post) => post && post.publishDate) // Vain postaukset joilla on julkaisupäivä
                .map((post) => ({
                  id: post.id,
                  type: "Mixpost",
                  idea: post.title || post.caption?.slice(0, 80) || "Postaus",
                  status: statusMap[post.status] || post.status,
                  publish_date: post.publishDate, // API:sta tuleva publishDate -> publish_date
                  publishDate: post.publishDate, // Säilytetään myös alkuperäinen
                  created_at: post.createdAt,
                  media_urls: post.thumbnail ? [post.thumbnail] : [],
                  caption: post.caption,
                  source: "mixpost",
                  accounts: post.accounts || [],
                  channelNames: post.channelNames || [],
                }));
            }
          }
        } catch (mixpostError) {
          console.error("Error fetching Mixpost posts:", mixpostError);
        }

        // Yhdistä Supabase ja Mixpost data
        const allSchedule = [...(supabaseData || []), ...mixpostData];
        setSchedule(allSchedule);
      } catch (e) {
        console.error("Error in fetchSchedule:", e);
        setSchedule([]);
      } finally {
        setScheduleLoading(false);
      }
    };
    fetchSchedule();
  }, [orgLoading, orgId, t]);

  const handleSavePost = (updatedPost) => {
    // Update the cached posts data with TanStack Query
    queryClient.setQueryData(["dashboardPosts", orgId], (oldData) => {
      if (!oldData) return oldData;
      return oldData.map((post) =>
        post.id === updatedPost["Record ID"] ||
        post["Record ID"] === updatedPost["Record ID"]
          ? { ...post, ...updatedPost }
          : post,
      );
    });
    setEditingPost(null);
  };

  // Laske tulevat postaukset (seuraavat 7 päivää)
  const now = new Date();
  const weekFromNow = new Date();
  weekFromNow.setDate(now.getDate() + 7);
  const upcomingCount = posts.filter((post) => {
    const date = post.publish_date ? new Date(post.publish_date) : null;
    return date && date > now && date < weekFromNow;
  }).length;

  // Laske julkaisut kuluvassa kuukaudessa (created_at mukaan)
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  const monthlyCount = posts.filter((post) => {
    const date = post.created_at ? new Date(post.created_at) : null;
    return (
      date && date.getMonth() === thisMonth && date.getFullYear() === thisYear
    );
  }).length;

  const statusMap = {
    Draft: t("dashboard.status.Draft"),
    "In Progress": t("dashboard.status.In Progress"),
    "Under Review": t("dashboard.status.Under Review"),
    Scheduled: t("dashboard.status.Scheduled"),
    Done: t("dashboard.status.Done"),
    Deleted: t("dashboard.status.Deleted"),
    Odottaa: t("dashboard.status.Odottaa"),
    Pending: t("dashboard.status.Pending"),
  };

  function formatDate(dateStr) {
    if (!dateStr) return "--";
    const d = new Date(dateStr);
    const locale = i18n.language === "fi" ? "fi-FI" : "en-US";
    return d.toLocaleDateString(locale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const stats = [
    {
      label: t("dashboard.metrics.stats.upcomingPosts"),
      value: statsData.upcomingCount,
      sub: `${t("dashboard.upcoming.headers.status")}: ${t("dashboard.status.Scheduled")}`,
      color: "#22c55e",
    },
    {
      label: t("dashboard.metrics.stats.monthlyPosts"),
      value: `${statsData.monthlyCount} / 30`,
      sub: t("dashboard.monthly.headers.thisMonth"),
      color: "#2563eb",
    },
    {
      label: t("dashboard.metrics.stats.totalCallPrice"),
      value: statsData.totalCallPrice.toLocaleString("fi-FI", {
        style: "currency",
        currency: "EUR",
        minimumFractionDigits: 2,
      }),
      sub: t("dashboard.monthly.headers.thisMonth"),
      color: "#f59e42",
    },
    {
      label: t("dashboard.metrics.stats.totalMessagePrice"),
      value: statsData.totalMessagePrice.toLocaleString("fi-FI", {
        style: "currency",
        currency: "EUR",
        minimumFractionDigits: 2,
      }),
      sub: t("dashboard.monthly.headers.thisMonth"),
      color: "#059669",
    },
  ];

  // Aikataulu-kortin data: näytetään vain tulevat julkaisut (publish_date >= nyt)
  const nowDate = new Date();

  // Tulevat julkaisut -kortin data: media_urls ja caption mukaan
  const upcomingPosts = (schedule || [])
    .filter((row) => {
      if (!row.publish_date) {
        return false;
      }
      // Tarkista onko jo UTC-muodossa (sisältää Z tai +)
      const dateStr = row.publish_date;
      let publishDate;
      if (dateStr.includes("Z") || dateStr.includes("+")) {
        publishDate = new Date(dateStr);
      } else {
        // Lisää Z jotta tulkitaan UTC:nä
        publishDate = new Date(dateStr.replace(" ", "T") + "Z");
      }
      const isFuture = publishDate >= nowDate;
      if (!isFuture) {
      }
      return isFuture;
    })
    .sort((a, b) => {
      const dateA =
        a.publish_date.includes("Z") || a.publish_date.includes("+")
          ? new Date(a.publish_date)
          : new Date(a.publish_date.replace(" ", "T") + "Z");
      const dateB =
        b.publish_date.includes("Z") || b.publish_date.includes("+")
          ? new Date(b.publish_date)
          : new Date(b.publish_date.replace(" ", "T") + "Z");
      return dateA - dateB;
    });

  function renderMediaCell(row) {
    const urls = row.media_urls || [];
    const url = Array.isArray(urls)
      ? urls[0]
      : typeof urls === "string"
        ? urls
        : null;
    if (url) {
      return (
        <img
          src={url}
          alt="media"
          className="dashboard-media-thumbnail"
          onClick={() => setImageModalUrl(url)}
        />
      );
    }
    return <div className="dashboard-media-placeholder">–</div>;
  }

  function formatUpcomingDate(dateStr) {
    if (!dateStr) return "--";
    // Tarkista onko jo UTC-muodossa (sisältää Z tai +)
    let d;
    if (dateStr.includes("Z") || dateStr.includes("+")) {
      d = new Date(dateStr);
    } else {
      // Lisää Z jotta tulkitaan UTC:nä
      d = new Date(dateStr.replace(" ", "T") + "Z");
    }

    // Muunna Europe/Helsinki aikavyöhykkeeseen vertailua varten
    const helsinkiDate = new Date(
      d.toLocaleString("en-US", { timeZone: "Europe/Helsinki" }),
    );
    const now = new Date();

    // Hae kellonaika
    const timeStr = d.toLocaleString("fi-FI", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Europe/Helsinki",
    });

    if (
      helsinkiDate.getDate() === now.getDate() &&
      helsinkiDate.getMonth() === now.getMonth() &&
      helsinkiDate.getFullYear() === now.getFullYear()
    ) {
      return `${t("dashboard.upcoming.today")} klo ${timeStr}`;
    }
    const locale = i18n.language === "fi" ? "fi-FI" : "en-US";
    return d.toLocaleString(locale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Europe/Helsinki",
    });
  }

  const handleScheduledPostClick = (post) => {
    setSelectedPost(post);
    setShowScheduledModal(true);
  };

  const handleCloseScheduledModal = () => {
    setShowScheduledModal(false);
    setSelectedPost(null);
  };

  const handleSaveScheduledPost = async (updatedPost) => {
    // Päivitä schedule-lista
    setSchedule((prev) =>
      prev.map((p) => (p.id === updatedPost.id ? updatedPost : p)),
    );
    setShowScheduledModal(false);
    setSelectedPost(null);
  };

  return (
    <>
      <PageMeta
        title={t("dashboard.meta.title")}
        description={t("dashboard.meta.description")}
        image="/hero.png"
      />
      <div className="p-3 sm:p-6 lg:p-10 max-w-[1600px] mx-auto min-h-screen">
        <div className="flex flex-col gap-2 mb-6 sm:mb-8 lg:mb-12">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight">
            {t("dashboard.header.title")}
          </h1>
          <p className="text-gray-500 text-sm sm:text-base lg:text-lg">
            {t("dashboard.header.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-6">
          {/* Row 1: Key Metrics Header & Cards */}
          <div className="sm:col-span-2 lg:col-span-12 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-2">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 tracking-tight">
              {t("dashboard.metrics.title")}
            </h2>
            <div className="flex bg-gray-100 p-1 rounded-lg self-start sm:self-auto overflow-x-auto max-w-full">
              {["all", "week", "month"].map((f) => (
                <button
                  key={f}
                  className={`px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all duration-200 whitespace-nowrap ${selectedFilter === f ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"}`}
                  onClick={() => setSelectedFilter(f)}
                >
                  {t(`dashboard.metrics.filters.${f}`)}
                </button>
              ))}
            </div>
          </div>

          {/* KPI Row - Dedicated Grid for uniform sizing */}
          <div className="sm:col-span-2 lg:col-span-12">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-6">
              {statsLoading
                ? Array(6)
                    .fill(0)
                    .map((_, i) => (
                      <div
                        key={i}
                        className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 h-24 animate-pulse"
                      ></div>
                    ))
                : [
                    ...dashboardStats,
                    {
                      label: t("dashboard.metrics.stats.successCalls"),
                      value: successStats.success || 0,
                      trend: successStats.successRate || 0,
                      color: "#22c55e",
                    },
                    {
                      label: t("dashboard.metrics.stats.answerRate"),
                      value: `${successStats.answerRate || 0}%`,
                      trend: successStats.answerRate || 0,
                      color: "#2563eb",
                    },
                  ].map((stat, i) => (
                    <div
                      key={i}
                      className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-5 hover:shadow-md transition-shadow duration-200 flex flex-col justify-between min-h-[100px] sm:min-h-[110px]"
                    >
                      <div
                        className="text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1 sm:mb-2 truncate"
                        title={stat.label}
                      >
                        {stat.label}
                      </div>
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                          {stat.value}
                        </span>
                        {stat.trend !== undefined && !stat.noTrend && (
                          <span
                            className={`text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded ${stat.trend > 0 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}
                          >
                            {stat.trend > 0 ? "↑" : "↓"} {Math.abs(stat.trend)}%
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
            </div>
          </div>

          {/* Row 2: Analytics side-by-side */}

          {/* Mixpost Analytics */}
          <div className="sm:col-span-2 lg:col-span-8 bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-6 flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-3 sm:gap-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                {t("dashboard.mixpost.title")}
              </h3>
              <div className="flex bg-gray-100 p-1 rounded-lg w-full sm:w-auto overflow-x-auto">
                {["all", "week", "month"].map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setMixpostTimeFilter(tf)}
                    className={`flex-1 sm:flex-none px-3 py-1 text-xs font-medium rounded-md transition-all duration-200 whitespace-nowrap ${mixpostTimeFilter === tf ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"}`}
                  >
                    {t(`dashboard.metrics.filters.${tf}`)}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 flex-1">
              {mixpostLoading ? (
                Array(4)
                  .fill(0)
                  .map((_, i) => (
                    <div
                      key={i}
                      className="bg-gray-50 rounded-lg h-24 sm:h-28 animate-pulse"
                    ></div>
                  ))
              ) : mixpostData ? (
                [
                  {
                    label: t("dashboard.mixpost.metrics.fbEngagements"),
                    value: (mixpostData.fbEngagements ?? 0).toLocaleString(
                      "fi-FI",
                    ),
                    color: "#1877f2",
                  },
                  {
                    label: t("dashboard.mixpost.metrics.fbImpressions"),
                    value: (mixpostData.fbImpressions ?? 0).toLocaleString(
                      "fi-FI",
                    ),
                    color: "#1877f2",
                  },
                  {
                    label: t("dashboard.mixpost.metrics.igReach"),
                    value: (mixpostData.igReach ?? 0).toLocaleString("fi-FI"),
                    color: "#e4405f",
                  },
                  {
                    label: t("dashboard.mixpost.metrics.igFollowers"),
                    value: (mixpostData.igFollowers ?? 0).toLocaleString(
                      "fi-FI",
                    ),
                    color: "#e4405f",
                  },
                ].map((metric, i) => (
                  <div
                    key={i}
                    className="p-4 sm:p-5 rounded-2xl bg-gray-50/50 border border-gray-100 transition-all hover:bg-white hover:shadow-sm"
                  >
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                      {metric.label}
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-gray-900">
                      {metric.value}
                    </div>
                    <div className="h-1.5 w-full bg-gray-200 mt-3 sm:mt-4 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: "70%", background: metric.color }}
                      ></div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-8 sm:py-12 text-gray-400 text-sm">
                  {t("dashboard.mixpost.noData")}
                </div>
              )}
            </div>
          </div>

          {/* GA4 Section */}
          <div className="sm:col-span-2 lg:col-span-4 self-start bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-6 flex flex-col">
            <div className="flex justify-between items-center mb-6 sm:mb-8">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                {t("dashboard.visitors.title")}
              </h3>
              {gaConnected && (
                <div className="flex bg-gray-100 p-0.5 rounded-md">
                  <button
                    className={`px-3 py-1 text-[10px] font-bold rounded-sm transition-all ${gaVisitorsFilter === "week" ? "bg-white shadow-sm" : "text-gray-400"}`}
                    onClick={() => setGaVisitorsFilter("week")}
                  >
                    7D
                  </button>
                  <button
                    className={`px-3 py-1 text-[10px] font-bold rounded-sm transition-all ${gaVisitorsFilter === "30days" ? "bg-white shadow-sm" : "text-gray-400"}`}
                    onClick={() => setGaVisitorsFilter("30days")}
                  >
                    30D
                  </button>
                </div>
              )}
            </div>

            {!gaConnected ? (
              <div className="flex flex-col items-center justify-center py-10 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                  <svg
                    className="w-6 h-6 text-gray-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    ></path>
                  </svg>
                </div>
                <p className="text-sm text-gray-400 max-w-[180px]">
                  {t("dashboard.visitors.notConnected")}
                </p>
              </div>
            ) : gaLoading ? (
              <div className="h-40 bg-gray-50 rounded-2xl animate-pulse"></div>
            ) : (
              <div className="flex flex-col">
                <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
                  <div className="p-3 sm:p-4 rounded-xl bg-blue-50/30 border border-blue-50">
                    <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">
                      {t("dashboard.visitors.total")}
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-gray-900">
                      {gaVisitors.thisWeek.toLocaleString("fi-FI")}
                    </div>
                  </div>
                  <div className="p-3 sm:p-4 rounded-xl bg-orange-50/30 border border-orange-50">
                    <div className="text-[10px] font-bold text-orange-400 uppercase tracking-widest mb-1">
                      {t("dashboard.visitors.today")}
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-gray-900">
                      {gaVisitors.today.toLocaleString("fi-FI")}
                    </div>
                  </div>
                </div>

                <div className="h-[140px] w-full -mx-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={gaVisitorsData}>
                      <defs>
                        <linearGradient
                          id="colorVisitors"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#ff6600"
                            stopOpacity={0.15}
                          />
                          <stop
                            offset="95%"
                            stopColor="#ff6600"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#f3f4f6"
                      />
                      <Area
                        type="monotone"
                        dataKey="visitors"
                        stroke="#ff6600"
                        fillOpacity={1}
                        fill="url(#colorVisitors)"
                        strokeWidth={3}
                      />
                      <Tooltip
                        contentStyle={{
                          fontSize: "12px",
                          borderRadius: "12px",
                          border: "none",
                          boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                        }}
                        itemStyle={{ color: "#ff6600", fontWeight: "bold" }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

          {/* Row 3: Operations side-by-side */}

          {/* Upcoming Posts */}
          <div className="sm:col-span-2 lg:col-span-8 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 flex justify-between items-center bg-white">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                {t("dashboard.upcoming.title")}
              </h3>
              <button className="text-xs font-semibold text-blue-600 hover:text-blue-700 whitespace-nowrap">
                {t("dashboard.upcoming.today")}
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      {t("dashboard.upcoming.headers.media")}
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      {t("dashboard.upcoming.headers.caption")}
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      {t("dashboard.upcoming.headers.channels")}
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      {t("dashboard.upcoming.headers.date")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {scheduleLoading ? (
                    Array(4)
                      .fill(0)
                      .map((_, i) => (
                        <tr key={i}>
                          <td
                            colSpan={4}
                            className="px-3 sm:px-6 py-3 sm:py-4 h-14 sm:h-16 animate-pulse bg-gray-50/20"
                          ></td>
                        </tr>
                      ))
                  ) : upcomingPosts.length > 0 ? (
                    upcomingPosts.slice(0, 5).map((row) => (
                      <tr
                        key={row.id}
                        onClick={() => handleScheduledPostClick(row)}
                        className="hover:bg-gray-50 transition-colors cursor-pointer group"
                      >
                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                          {(() => {
                            const url = Array.isArray(row.media_urls)
                              ? row.media_urls[0]
                              : typeof row.media_urls === "string"
                                ? row.media_urls
                                : null;
                            return url ? (
                              <img
                                src={url}
                                className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover border border-gray-100 group-hover:scale-105 transition-transform"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setImageModalUrl(url);
                                }}
                              />
                            ) : (
                              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gray-100 flex items-center justify-center text-[10px] text-gray-400 font-bold uppercase text-center leading-tight">
                                No image
                              </div>
                            );
                          })()}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                          <div className="text-xs sm:text-sm font-medium text-gray-700 line-clamp-2 max-w-[200px] leading-relaxed">
                            {row.caption || "--"}
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                          <div className="flex flex-wrap gap-1.5">
                            {row.accounts?.map((acc, idx) => (
                              <span
                                key={idx}
                                className="bg-blue-50 text-blue-600 text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-blue-100/50"
                              >
                                {acc.name || acc.provider}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 font-medium">
                          {formatUpcomingDate(row.publish_date)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-3 sm:px-6 py-8 sm:py-12 text-center text-gray-400 text-sm"
                      >
                        {t("dashboard.upcoming.empty")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Campaigns */}
          <div className="sm:col-span-2 lg:col-span-4 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 bg-white">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                {t("dashboard.campaigns.title")}
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      {t("dashboard.campaigns.headers.campaign")}
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">
                      {t("dashboard.campaigns.headers.successRate")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {campaignMetrics.length > 0 ? (
                    campaignMetrics.slice(0, 8).map((row) => (
                      <tr
                        key={row.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-700">
                          {row.name}
                        </td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-12 h-1 bg-gray-100 rounded-full overflow-hidden hidden xl:block">
                              <div
                                className="h-full bg-green-500 rounded-full"
                                style={{ width: `${row.successRate}%` }}
                              ></div>
                            </div>
                            <span className="text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-md">
                              {row.successRate}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={2}
                        className="px-4 sm:px-6 py-8 sm:py-12 text-center text-gray-400 text-sm"
                      >
                        {t("dashboard.campaigns.noCampaigns")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {imageModalUrl &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setImageModalUrl(null);
              }
            }}
          >
            <div className="bg-transparent max-w-5xl w-full max-h-[90vh] flex items-center justify-center relative">
              <button
                onClick={() => setImageModalUrl(null)}
                className="absolute top-4 right-4 text-white/50 hover:text-white bg-black/50 hover:bg-black/70 rounded-full p-2 transition-colors z-10"
              >
                <svg
                  className="w-6 h-6"
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
              <img
                src={imageModalUrl}
                alt="media"
                className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
              />
            </div>
          </div>,
          document.body,
        )}

      {/* Aikataulutettu Modal */}
      {showScheduledModal && selectedPost && (
        <AikataulutettuModal
          editingPost={selectedPost}
          onClose={handleCloseScheduledModal}
          onSave={handleSaveScheduledPost}
        />
      )}
    </>
  );
}
