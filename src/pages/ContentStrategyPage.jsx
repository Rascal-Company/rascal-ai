import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { getUserOrgId } from "../lib/getUserOrgId";
import { useStrategyStatus } from "../contexts/StrategyStatusContext";
import {
  StrategyCard,
  MonthlyStrategyCard,
  StrategyEditModal,
  StrategyViewModal,
  TextEditModal,
} from "../components/Strategy";
import {
  getStrategyStatus,
  getStatusColor,
  getStatusText,
  formatMonth,
} from "../utils/strategyHelpers";

const getStrategy = async () => {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) {
      throw new Error("Käyttäjä ei ole kirjautunut");
    }

    const orgId = await getUserOrgId(session.user.id);
    if (!orgId) {
      throw new Error("Organisaation ID ei löytynyt");
    }

    const { data: userRecord, error: userError } = await supabase
      .from("users")
      .select("company_id")
      .eq("id", orgId)
      .single();

    if (userError || !userRecord?.company_id) {
      throw new Error("Company ID ei löytynyt");
    }

    const companyId = userRecord.company_id;
    const userId = orgId;

    const url = `/api/strategy?companyId=${companyId}&userId=${userId}`;

    const {
      data: { session: currentSession },
    } = await supabase.auth.getSession();
    if (!currentSession?.access_token) {
      throw new Error("Käyttäjä ei ole kirjautunut");
    }

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${currentSession.access_token}`,
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) throw new Error("Strategian haku epäonnistui");
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Error in getStrategy:", error);
    throw error;
  }
};

export default function ContentStrategyPage() {
  const { t, i18n } = useTranslation("common");
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const { refreshUserStatus } = useStrategyStatus();

  // State
  const [orgId, setOrgId] = useState(null);
  const [companyId, setCompanyId] = useState(null);
  const [strategy, setStrategy] = useState([]);
  const [icpSummary, setIcpSummary] = useState([]);
  const [kpiData, setKpiData] = useState([]);
  const [companySummary, setCompanySummary] = useState("");
  const [tov, setTov] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Edit states
  const [editId, setEditId] = useState(null);
  const [editText, setEditText] = useState("");
  const [generatedCount, setGeneratedCount] = useState(0);
  const [generatedCountLoading, setGeneratedCountLoading] = useState(false);

  // Modal states
  const [editingCompanySummaryModal, setEditingCompanySummaryModal] =
    useState(false);
  const [companySummaryEditText, setCompanySummaryEditText] = useState("");
  const [editingIcpModal, setEditingIcpModal] = useState(false);
  const [icpEditText, setIcpEditText] = useState("");
  const [editingKpiModal, setEditingKpiModal] = useState(false);
  const [kpiEditText, setKpiEditText] = useState("");
  const [editingTovModal, setEditingTovModal] = useState(false);
  const [tovEditText, setTovEditText] = useState("");

  // View modals
  const [viewingCompanySummary, setViewingCompanySummary] = useState(false);
  const [viewingIcp, setViewingIcp] = useState(false);
  const [viewingKpi, setViewingKpi] = useState(false);
  const [viewingTov, setViewingTov] = useState(false);

  // Set orgId when user is logged in
  useEffect(() => {
    const setOrgIdFromUser = async () => {
      if (user?.id) {
        const userId = await getUserOrgId(user.id);
        if (userId) {
          setOrgId(userId);
        }
      }
    };
    setOrgIdFromUser();
  }, [user?.id]);

  // Fetch generated count for a strategy
  const fetchGeneratedCount = async (strategyId) => {
    try {
      setGeneratedCountLoading(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) return;

      const orgId = await getUserOrgId(session.user.id);
      if (!orgId) return;

      const { count, error: cntErr } = await supabase
        .from("content")
        .select("id", { count: "exact", head: true })
        .eq("user_id", orgId)
        .eq("strategy_id", strategyId)
        .eq("is_generated", true);

      if (cntErr) {
        console.error("Error fetching generated count:", cntErr);
        setGeneratedCount(0);
      } else {
        setGeneratedCount(count || 0);
      }
    } catch (err) {
      console.error("fetchGeneratedCount error:", err);
      setGeneratedCount(0);
    } finally {
      setGeneratedCountLoading(false);
    }
  };

  // Fetch strategy data
  useEffect(() => {
    const fetchStrategy = async () => {
      try {
        setLoading(true);
        setError(null);

        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) {
          const orgId = await getUserOrgId(session.user.id);
          if (orgId) {
            const { data: userRecord } = await supabase
              .from("users")
              .select("company_id")
              .eq("id", orgId)
              .single();

            if (userRecord?.company_id) {
              setCompanyId(userRecord.company_id);
            }
          }
        }

        const data = await getStrategy();

        if (data && typeof data === "object") {
          setStrategy(data.strategies || []);
          setIcpSummary(data.icpSummary || []);
          setKpiData(data.kpi || []);
          setCompanySummary(data.summary || data.companySummary || "");
          setTov(data.tov || "");
        } else if (Array.isArray(data) && data.length > 0) {
          const firstItem = data[0];
          setStrategy(firstItem.strategyAndMonth || []);
          setIcpSummary(firstItem.icpSummary || []);
          setKpiData(firstItem.kpi || []);
          setCompanySummary(
            firstItem.summary || firstItem.companySummary || "",
          );
          setTov(firstItem.tov || "");
        } else {
          setStrategy([]);
          setIcpSummary([]);
          setKpiData([]);
          setCompanySummary("");
          setTov("");
        }
      } catch (e) {
        console.error("Error fetching strategy:", e);
        setStrategy([]);
        setIcpSummary([]);
        setKpiData([]);
        setCompanySummary("");
        setTov("");
        setError(t("strategy.errors.fetchFailed"));
      } finally {
        setLoading(false);
      }
    };
    if (orgId) {
      fetchStrategy();
    }
  }, [orgId, t]);

  // ESC key handler
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        if (editId) {
          setEditId(null);
          setEditText("");
        } else if (editingCompanySummaryModal) {
          setEditingCompanySummaryModal(false);
        } else if (editingIcpModal) {
          setEditingIcpModal(false);
        } else if (editingKpiModal) {
          setEditingKpiModal(false);
        } else if (editingTovModal) {
          setEditingTovModal(false);
        } else if (viewingCompanySummary) {
          setViewingCompanySummary(false);
        } else if (viewingIcp) {
          setViewingIcp(false);
        } else if (viewingKpi) {
          setViewingKpi(false);
        } else if (viewingTov) {
          setViewingTov(false);
        }
      }
    };

    if (
      editId ||
      editingCompanySummaryModal ||
      editingIcpModal ||
      editingKpiModal ||
      editingTovModal ||
      viewingCompanySummary ||
      viewingIcp ||
      viewingKpi ||
      viewingTov
    ) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    editId,
    editingCompanySummaryModal,
    editingIcpModal,
    editingKpiModal,
    editingTovModal,
    viewingCompanySummary,
    viewingIcp,
    viewingKpi,
    viewingTov,
  ]);

  // Strategy handlers
  const handleEdit = (item) => {
    setEditId(item.id);
    setEditText(item.strategy || item.Strategy);
    fetchGeneratedCount(item.id);
  };

  const handleSave = async (item) => {
    try {
      const { data: updatedStrategy, error } = await supabase
        .from("content_strategy")
        .update({
          strategy: editText,
          updated_at: new Date().toISOString(),
        })
        .eq("id", item.id)
        .select()
        .single();

      if (error) {
        console.error("Error updating strategy:", error);
        toast.error(t("errors.saveError", { error: error.message }));
        return;
      }

      const updated = {
        ...item,
        strategy: editText,
        Strategy: editText,
        updated_at: updatedStrategy.updated_at,
      };
      setStrategy(strategy.map((s) => (s.id === item.id ? updated : s)));
      setEditId(null);
    } catch (e) {
      console.error("Error in handleSave:", e);
      toast.error(t("errors.saveFailed"));
    }
  };

  const handleSaveAndApprove = async (item) => {
    try {
      const { data: updatedStrategy, error } = await supabase
        .from("content_strategy")
        .update({
          strategy: editText,
          approved: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", item.id)
        .select()
        .single();

      if (error) {
        console.error("Error updating and approving strategy:", error);
        toast.error(t("errors.saveAndApproveFailed", { error: error.message }));
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Käyttäjä ei ole kirjautunut");
      }

      if (!orgId) {
        throw new Error("Organisaation ID puuttuu");
      }

      const response = await axios.post(
        "/api/strategy/approve",
        {
          strategy_id: item.id,
          month: item.month,
          company_id: companyId,
          user_id: orgId,
        },
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "x-api-key": import.meta.env.N8N_SECRET_KEY || "fallback-key",
            "Content-Type": "application/json",
          },
        },
      );

      if (response.status !== 200 || !response.data?.success) {
        throw new Error(response.data?.error || "API-vastaus epäonnistui");
      }

      try {
        await axios.post(
          "/api/strategy/status",
          {
            status: "Approved",
          },
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              "Content-Type": "application/json",
            },
          },
        );
      } catch (userError) {
        console.error("Error updating user status:", userError);
      }

      const updated = {
        ...item,
        strategy: editText,
        Strategy: editText,
        approved: true,
        updated_at: updatedStrategy.updated_at,
      };
      setStrategy(strategy.map((s) => (s.id === item.id ? updated : s)));
      setEditId(null);
      refreshUserStatus();
      toast.success(t("errors.approvalSuccess"));
    } catch (e) {
      console.error("Error in handleSaveAndApprove:", e);
      const errorMessage =
        e.response?.data?.error ||
        e.response?.data?.details ||
        e.message ||
        "Tuntematon virhe";
      toast.error(t("errors.approvalFailed", { error: errorMessage }));
    }
  };

  const handleApproveStrategy = async (item) => {
    try {
      if (!orgId) {
        throw new Error("Organisaation ID puuttuu");
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Käyttäjä ei ole kirjautunut");
      }

      const response = await axios.post(
        "/api/strategy/approve",
        {
          strategy_id: item.id,
          month: item.month,
          company_id: companyId,
          user_id: orgId,
        },
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "x-api-key": import.meta.env.N8N_SECRET_KEY || "fallback-key",
            "Content-Type": "application/json",
          },
        },
      );

      if (response.status !== 200 || !response.data?.success) {
        throw new Error(response.data?.error || "API-vastaus epäonnistui");
      }

      const { data: updatedStrategy, error } = await supabase
        .from("content_strategy")
        .update({
          approved: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", item.id)
        .select()
        .single();

      if (error) {
        console.error("Error approving strategy:", error);
        toast.error(t("errors.confirmationFailed", { error: error.message }));
        return;
      }

      try {
        await axios.post(
          "/api/strategy/status",
          {
            status: "Approved",
          },
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              "Content-Type": "application/json",
            },
          },
        );
      } catch (userError) {
        console.error("Error updating user status:", userError);
      }

      const updated = {
        ...item,
        approved: true,
        updated_at: updatedStrategy.updated_at,
      };
      setStrategy(strategy.map((s) => (s.id === item.id ? updated : s)));
      refreshUserStatus();
      toast.success(t("errors.confirmationSuccess"));
    } catch (e) {
      console.error("Error in handleApproveStrategy:", e);
      const errorMessage =
        e.response?.data?.error ||
        e.response?.data?.details ||
        e.message ||
        "Tuntematon virhe";
      toast.error(t("errors.confirmationError", { error: errorMessage }));
    }
  };

  // ICP handlers
  const handleSaveIcp = async () => {
    try {
      const newIcpSummary = icpEditText
        .split("\n")
        .filter((line) => line.trim() !== "");

      if (!orgId) {
        toast.error("Organisaation ID puuttuu");
        return;
      }

      const { error } = await supabase
        .from("users")
        .update({
          icp_summary: newIcpSummary.join("\n"),
          updated_at: new Date().toISOString(),
        })
        .eq("id", orgId);

      if (error) {
        console.error("Error updating ICP:", error);
        toast.error(t("errors.icpSaveFailed", { error: error.message }));
        return;
      }

      setIcpSummary(newIcpSummary);
      setEditingIcpModal(false);
      setIcpEditText("");
    } catch (e) {
      console.error("Error in handleSaveIcp:", e);
      toast.error(t("errors.icpSaveError"));
    }
  };

  // KPI handlers
  const handleSaveKpi = async () => {
    try {
      const newKpiData = kpiEditText
        .split("\n")
        .filter((line) => line.trim() !== "");

      if (!orgId) {
        toast.error("Organisaation ID puuttuu");
        return;
      }

      const { error } = await supabase
        .from("users")
        .update({
          kpi: newKpiData.join("\n"),
          updated_at: new Date().toISOString(),
        })
        .eq("id", orgId);

      if (error) {
        console.error("Error updating KPI:", error);
        toast.error(t("errors.kpiSaveFailed", { error: error.message }));
        return;
      }

      setKpiData(newKpiData);
      setEditingKpiModal(false);
      setKpiEditText("");
    } catch (e) {
      console.error("Error in handleSaveKpi:", e);
      toast.error(t("errors.kpiSaveError"));
    }
  };

  // Company Summary handlers
  const handleSaveCompanySummary = async () => {
    try {
      if (!orgId) {
        toast.error("Organisaation ID puuttuu");
        return;
      }

      const { error } = await supabase
        .from("users")
        .update({
          company_summary: companySummaryEditText,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orgId);

      if (error) {
        console.error("Error updating company summary:", error);
        toast.error("Yritysanalyysin tallennus epäonnistui: " + error.message);
        return;
      }

      setCompanySummary(companySummaryEditText);
      setEditingCompanySummaryModal(false);
      setCompanySummaryEditText("");
    } catch (e) {
      console.error("Error in handleSaveCompanySummary:", e);
      toast.error("Yritysanalyysin tallennus epäonnistui");
    }
  };

  // TOV handlers
  const handleSaveTov = async () => {
    try {
      if (!orgId) {
        toast.error("Organisaation ID puuttuu");
        return;
      }

      const { error } = await supabase
        .from("users")
        .update({
          tov: tovEditText,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orgId);

      if (error) {
        console.error("Error updating TOV:", error);
        toast.error("TOV:n tallennus epäonnistui: " + error.message);
        return;
      }

      setTov(tovEditText);
      setEditingTovModal(false);
      setTovEditText("");
    } catch (e) {
      console.error("Error in handleSaveTov:", e);
      toast.error("TOV:n tallennus epäonnistui");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-gray-600 font-medium">
            {t("strategy.loading")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {t("strategy.header")}
          </h1>
        </div>

        {/* Top Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Company Analysis */}
          <StrategyCard
            title={t("strategy.companyAnalysis.title")}
            content={companySummary}
            isEmpty={!companySummary || companySummary.length === 0}
            emptyText={t("strategy.companyAnalysis.missing")}
            onEdit={() => {
              setEditingCompanySummaryModal(true);
              setCompanySummaryEditText(companySummary);
            }}
            onCreate={() => {
              setEditingCompanySummaryModal(true);
              setCompanySummaryEditText("");
            }}
            onClick={() => setViewingCompanySummary(true)}
            isClickable={companySummary && companySummary.length > 0}
          />

          {/* ICP */}
          <StrategyCard
            title={t("strategy.icp.title")}
            content={icpSummary.map((summary) => `- ${summary}`).join("\n")}
            isEmpty={!icpSummary || icpSummary.length === 0}
            emptyText={t("strategy.icp.empty")}
            onEdit={() => {
              setEditingIcpModal(true);
              setIcpEditText(icpSummary.join("\n"));
            }}
            onCreate={() => {
              setEditingIcpModal(true);
              setIcpEditText("");
            }}
            onClick={() => setViewingIcp(true)}
            isClickable={icpSummary && icpSummary.length > 0}
          />

          {/* KPI */}
          <StrategyCard
            title={t("strategy.kpi.title")}
            content={kpiData.map((kpi) => `- ${kpi}`).join("\n")}
            isEmpty={!kpiData || kpiData.length === 0}
            emptyText={t("strategy.kpi.empty")}
            onEdit={() => {
              setEditingKpiModal(true);
              setKpiEditText(kpiData.join("\n"));
            }}
            onCreate={() => {
              setEditingKpiModal(true);
              setKpiEditText("");
            }}
            onClick={() => setViewingKpi(true)}
            isClickable={kpiData && kpiData.length > 0}
          />

          {/* TOV */}
          <StrategyCard
            title={t("strategy.toneOfVoice.title")}
            content={tov}
            isEmpty={!tov || tov.length === 0}
            emptyText={t("strategy.toneOfVoice.missing")}
            onEdit={() => {
              setEditingTovModal(true);
              setTovEditText(tov);
            }}
            onCreate={() => {
              setEditingTovModal(true);
              setTovEditText("");
            }}
            onClick={() => setViewingTov(true)}
            isClickable={tov && tov.length > 0}
          />
        </div>

        {/* Monthly Strategies Section */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            {t("strategy.list.title")}
          </h2>
        </div>

        {/* Monthly Strategies Grid */}
        {Array.isArray(strategy) && strategy.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {strategy.map((item) => {
              // Get target month - try date fields first, then construct from month name
              let monthValue = item.target_month || item.targetMonth;
              if (!monthValue && (item.month || item.Month)) {
                const monthName = item.month || item.Month;
                const createdAt = item.created_at || item.createdTime;
                if (createdAt) {
                  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                                      'July', 'August', 'September', 'October', 'November', 'December'];
                  const monthIndex = monthNames.indexOf(monthName);
                  if (monthIndex >= 0) {
                    const createdDate = new Date(createdAt);
                    let year = createdDate.getFullYear();
                    const createdMonth = createdDate.getMonth();
                    // If strategy month is earlier than created month, it's probably next year
                    if (monthIndex < createdMonth) {
                      year += 1;
                    }
                    monthValue = `${year}-${String(monthIndex + 1).padStart(2, '0')}-01`;
                  } else {
                    monthValue = monthName;
                  }
                } else {
                  monthValue = monthName;
                }
              }
              const status = getStrategyStatus(monthValue);
              return (
                <MonthlyStrategyCard
                  key={item.id}
                  month={formatMonth(monthValue)}
                  strategy={item.strategy || item.Strategy}
                  status={status}
                  isApproved={item.approved}
                  createdAt={item.created_at || item.createdTime}
                  onEdit={() => handleEdit(item)}
                  onApprove={() => handleApproveStrategy(item)}
                  getStatusColor={getStatusColor}
                  getStatusText={(s) => getStatusText(s, t)}
                />
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-16 text-center">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {t("strategy.empty.title")}
            </h3>
            <p className="text-sm text-gray-600">
              {t("strategy.empty.description")}
            </p>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mt-6 px-6 py-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold border border-red-100">
            {error}
          </div>
        )}
      </div>

      {/* Strategy Edit Modal */}
      <StrategyEditModal
        show={!!editId}
        title={t("strategy.buttons.editStrategy")}
        value={editText}
        onChange={setEditText}
        onSave={() => handleSave(strategy.find((s) => s.id === editId))}
        onSaveAndApprove={() =>
          handleSaveAndApprove(strategy.find((s) => s.id === editId))
        }
        onCancel={() => {
          setEditId(null);
          setEditText("");
        }}
        generatedCount={generatedCount}
        generatedCountLoading={generatedCountLoading}
        isApproved={strategy.find((s) => s.id === editId)?.approved}
        placeholder={t("strategy.strategyCard.placeholder")}
      />

      {/* Company Summary Modals */}
      <StrategyViewModal
        show={viewingCompanySummary}
        title={t("strategy.companyAnalysis.title")}
        content={companySummary}
        onClose={() => setViewingCompanySummary(false)}
        onEdit={() => {
          setEditingCompanySummaryModal(true);
          setCompanySummaryEditText(companySummary);
        }}
      />

      <TextEditModal
        show={editingCompanySummaryModal}
        title={t("strategy.companyAnalysis.title")}
        value={companySummaryEditText}
        onChange={setCompanySummaryEditText}
        onSave={handleSaveCompanySummary}
        onCancel={() => setEditingCompanySummaryModal(false)}
        placeholder={t("strategy.companyAnalysis.placeholder")}
      />

      {/* ICP Modals */}
      <StrategyViewModal
        show={viewingIcp}
        title={t("strategy.icp.title")}
        content={icpSummary.map((summary) => `- ${summary}`).join("\n")}
        onClose={() => setViewingIcp(false)}
        onEdit={() => {
          setEditingIcpModal(true);
          setIcpEditText(icpSummary.join("\n"));
        }}
      />

      <TextEditModal
        show={editingIcpModal}
        title={t("strategy.icp.title")}
        value={icpEditText}
        onChange={setIcpEditText}
        onSave={handleSaveIcp}
        onCancel={() => setEditingIcpModal(false)}
        placeholder={t("strategy.icp.placeholder")}
      />

      {/* KPI Modals */}
      <StrategyViewModal
        show={viewingKpi}
        title={t("strategy.kpi.title")}
        content={kpiData.map((kpi) => `- ${kpi}`).join("\n")}
        onClose={() => setViewingKpi(false)}
        onEdit={() => {
          setEditingKpiModal(true);
          setKpiEditText(kpiData.join("\n"));
        }}
      />

      <TextEditModal
        show={editingKpiModal}
        title={t("strategy.kpi.title")}
        value={kpiEditText}
        onChange={setKpiEditText}
        onSave={handleSaveKpi}
        onCancel={() => setEditingKpiModal(false)}
        placeholder={t("strategy.kpi.placeholder")}
      />

      {/* TOV Modals */}
      <StrategyViewModal
        show={viewingTov}
        title={t("strategy.toneOfVoice.title")}
        content={tov}
        onClose={() => setViewingTov(false)}
        onEdit={() => {
          setEditingTovModal(true);
          setTovEditText(tov);
        }}
      />

      <TextEditModal
        show={editingTovModal}
        title={t("strategy.toneOfVoice.title")}
        value={tovEditText}
        onChange={setTovEditText}
        onSave={handleSaveTov}
        onCancel={() => setEditingTovModal(false)}
        placeholder={t("strategy.toneOfVoice.placeholder")}
      />
    </div>
  );
}
