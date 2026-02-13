import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "../lib/supabase";
import Button from "../components/Button";
import SaveSearchModal from "../components/SaveSearchModal";
import SavedSearchesList from "../components/SavedSearchesList";
import ExportLeadsModal from "../components/ExportLeadsModal";
import ConfirmationToast from "../components/ConfirmationToast";
import { useNotification } from "../hooks/useNotification";

export default function LeadScrapingPage() {
  const { t } = useTranslation("common");
  const notify = useNotification();
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("Finland");
  const [headcountIndex, setHeadcountIndex] = useState(1);
  const [ownership, setOwnership] = useState("Private");
  const [maxResultsIndex, setMaxResultsIndex] = useState(2);
  const [loading, setLoading] = useState(false);
  const [exampleCompanies] = useState([]);
  const [error, setError] = useState("");
  const [jobId, setJobId] = useState(null);

  const [savedSearches, setSavedSearches] = useState([]);
  const [showSaveSearchModal, setShowSaveSearchModal] = useState(false);

  const [credits, setCredits] = useState({ monthly: 0, used: 0 });

  const [leads, setLeads] = useState([]);
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showEnrichConfirm, setShowEnrichConfirm] = useState(false);
  const [viewingLead, setViewingLead] = useState(null);

  const [buyerPersona, setBuyerPersona] = useState("");
  const [buyerPersonaDraft, setBuyerPersonaDraft] = useState("");
  const [showBuyerPersona, setShowBuyerPersona] = useState(false);
  const [savingPersona, setSavingPersona] = useState(false);

  const [filterText, setFilterText] = useState("");
  const [filterHasEmail, setFilterHasEmail] = useState(false);
  const [filterHasPhone, setFilterHasPhone] = useState(false);
  const [filterCountry, setFilterCountry] = useState("");
  const [filterMinScore, setFilterMinScore] = useState(0);
  const [sortField, setSortField] = useState("created_at");
  const [sortDir, setSortDir] = useState("desc");

  const filteredLeads = leads
    .filter((lead) => {
      if (filterHasEmail && !lead.email) return false;
      if (filterHasPhone && !lead.phone) return false;
      if (filterCountry && lead.country !== filterCountry) return false;
      if (filterMinScore > 0 && (lead.score || 0) < filterMinScore) return false;
      if (filterText) {
        const q = filterText.toLowerCase();
        const searchable = [
          lead.fullName, lead.firstName, lead.lastName,
          lead.email, lead.orgName, lead.position, lead.city,
        ].filter(Boolean).join(" ").toLowerCase();
        if (!searchable.includes(q)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortField === "score") return ((a.score || 0) - (b.score || 0)) * dir;
      if (sortField === "created_at") return (new Date(a.created_at || 0) - new Date(b.created_at || 0)) * dir;
      const aVal = (a[sortField] || "").toLowerCase();
      const bVal = (b[sortField] || "").toLowerCase();
      return aVal.localeCompare(bVal) * dir;
    });

  const leadCountries = [...new Set(leads.map((l) => l.country).filter(Boolean))].sort();

  const maxResultsOptions = [
    { label: "10", value: 10 },
    { label: "25", value: 25 },
    { label: "50", value: 50 },
    { label: "100", value: 100 },
    { label: "250", value: 250 },
    { label: "500", value: 500 },
    { label: "1000", value: 1000 },
  ];

  const headcountRanges = [
    { label: "1-10", value: "1-10", apiValue: 10 },
    { label: "11-50", value: "11-50", apiValue: 50 },
    { label: "51-200", value: "51-200", apiValue: 200 },
    { label: "201-500", value: "201-500", apiValue: 500 },
    { label: "501-1000", value: "501-1000", apiValue: 1000 },
    { label: "1000+", value: "1000+", apiValue: 10000 },
  ];

  const locationOptions = [
    "Albania",
    "Andorra",
    "Austria",
    "Belarus",
    "Belgium",
    "Bosnia and Herzegovina",
    "Bulgaria",
    "Canada",
    "Croatia",
    "Cyprus",
    "Czech Republic",
    "Denmark",
    "Estonia",
    "Faroe Islands",
    "Finland",
    "France",
    "Germany",
    "Gibraltar",
    "Greece",
    "Guernsey",
    "Hungary",
    "Iceland",
    "Ireland",
    "Isle of Man",
    "Italy",
    "Jersey",
    "Kosovo",
    "Latvia",
    "Liechtenstein",
    "Lithuania",
    "Luxembourg",
    "Malta",
    "Mexico",
    "Moldova",
    "Monaco",
    "Montenegro",
    "Netherlands",
    "North Macedonia",
    "Norway",
    "Poland",
    "Portugal",
    "Romania",
    "San Marino",
    "Serbia",
    "Slovakia",
    "Slovenia",
    "Spain",
    "Sweden",
    "Switzerland",
    "Ukraine",
    "United Kingdom",
    "United States",
    "Vatican City",
  ];

  const ownershipOptions = [
    { labelKey: "leadScraping.ownershipPrivate", value: "Private" },
    { labelKey: "leadScraping.ownershipPublic", value: "Public" },
    { labelKey: "leadScraping.ownershipNonProfit", value: "Non-Profit" },
    { labelKey: "leadScraping.ownershipGovernment", value: "Government" },
  ];

  const fetchLeads = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch("/api/leads", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await response.json();
      setLeads(data.leads || []);
    } catch (err) {
      console.error("Failed to fetch leads:", err);
    }
  };

  const fetchSavedSearches = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch("/api/leads/searches", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await response.json();
      setSavedSearches(data.searches || []);
    } catch (err) {
      console.error("Failed to fetch saved searches:", err);
    }
  };

  const handleSaveSearch = async (searchData) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) throw new Error(t("leadScraping.errorLoginGeneric"));

    const response = await fetch("/api/leads/searches", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(searchData),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || t("leadScraping.errorSaveSearchFailed"));
    }

    await fetchSavedSearches();
  };

  const runSavedSearch = async (search) => {
    setSearchQuery(search.query);
    setLocation(search.location || "United States");

    const savedHeadcount = search.headcount || 50;
    const matchingIndex = headcountRanges.findIndex(
      (range) => range.apiValue === savedHeadcount,
    );
    setHeadcountIndex(matchingIndex !== -1 ? matchingIndex : 1);

    setOwnership(search.ownership || "Private");
  };

  const deleteSavedSearch = async (id) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      await fetch(`/api/leads/searches?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      await fetchSavedSearches();
    } catch (err) {
      console.error("Failed to delete search:", err);
    }
  };

  const fetchCredits = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch("/api/users/me", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await response.json();
      setCredits({
        monthly: data.enrichment_credits_monthly || 0,
        used: data.enrichment_credits_used || 0,
      });
      setBuyerPersona(data.buyer_persona || "");
      setBuyerPersonaDraft(data.buyer_persona || "");
    } catch (err) {
      console.error("Failed to fetch credits:", err);
    }
  };

  const saveBuyerPersona = async () => {
    setSavingPersona(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch("/api/users/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ buyer_persona: buyerPersonaDraft }),
      });

      if (response.ok) {
        setBuyerPersona(buyerPersonaDraft);
        notify.success("Ostajapersoona tallennettu");
      } else {
        notify.error("Tallentaminen epäonnistui");
      }
    } catch (err) {
      console.error("Failed to save buyer persona:", err);
      notify.error("Tallentaminen epäonnistui");
    } finally {
      setSavingPersona(false);
    }
  };

  const toggleLeadSelection = (leadId) => {
    setSelectedLeads((prev) =>
      prev.includes(leadId)
        ? prev.filter((id) => id !== leadId)
        : [...prev, leadId],
    );
  };

  const selectAllLeads = () => {
    setSelectedLeads(filteredLeads.map((l) => l.id));
  };

  const clearSelection = () => {
    setSelectedLeads([]);
  };

  const enrichSelectedLeads = () => {
    const creditsNeeded = selectedLeads.length;
    const creditsRemaining = credits.monthly - credits.used;

    if (creditsNeeded > creditsRemaining) {
      notify.warning(
        t("leadScraping.notEnoughCredits", {
          needed: creditsNeeded,
          remaining: creditsRemaining,
        }),
      );
      return;
    }

    setShowEnrichConfirm(true);
  };

  const confirmEnrich = async () => {
    setShowEnrichConfirm(false);
    const creditsNeeded = selectedLeads.length;

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error(t("leadScraping.errorLoginGeneric"));

      const response = await fetch("/api/leads?action=enrich", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ leadIds: selectedLeads }),
      });

      if (response.ok) {
        notify.success(
          t("leadScraping.enrichmentStarted", { count: creditsNeeded }),
        );
        await fetchCredits();
        clearSelection();
      } else {
        const err = await response.json();
        throw new Error(err.error || t("leadScraping.enrichmentFailed"));
      }
    } catch (err) {
      notify.error(err.message || t("leadScraping.enrichmentFailed"));
    }
  };

  useEffect(() => {
    fetchLeads();
    fetchSavedSearches();
    fetchCredits();
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError(t("leadScraping.errorEmptyQuery"));
      return;
    }

    setLoading(true);
    setError("");
    setJobId(null);

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        throw new Error(t("leadScraping.errorLoginSearch"));
      }

      const currentHeadcountRange = headcountRanges[headcountIndex];

      const filters = {
        query: searchQuery,
        location,
        headcount: currentHeadcountRange.apiValue,
        ownership,
      };

      const currentMaxResults = maxResultsOptions[maxResultsIndex].value;

      const apifyJson = {
        query: searchQuery,
        location: [location],
        companySize: `${currentHeadcountRange.apiValue}`,
        ownership: [ownership],
        maxResults: currentMaxResults,
      };

      const response = await fetch("/api/leads/scraping", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          filters,
          apifyJson,
          leadLimit: currentMaxResults,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || t("leadScraping.errorScrapingFailed"),
        );
      }

      setJobId(data.jobId);
      setError("");

      notify.success(t("leadScraping.scrapingStartedAlert"));
    } catch (err) {
      console.error("Search error:", err);
      setError(err.message || t("leadScraping.errorSearchFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lead-scraping-page flex bg-gray-50">
      {/* Sidebar */}
      <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
        <div className="h-[73px] shrink-0 px-6 border-b border-gray-200 flex items-center">
          <h2 className="text-xl font-semibold text-gray-900">
            {t("leadScraping.pageTitle")}
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Chat Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("leadScraping.searchLabel")}
            </label>
            <textarea
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("leadScraping.searchPlaceholder")}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900 placeholder-gray-400"
            />
          </div>

          {/* Save Search Button */}
          <Button
            onClick={() => setShowSaveSearchModal(true)}
            variant="secondary"
            size="sm"
            disabled={!searchQuery.trim()}
            className="w-full"
          >
            {t("leadScraping.saveSearch")}
          </Button>

          {/* Saved Searches List */}
          <SavedSearchesList
            searches={savedSearches}
            onRun={runSavedSearch}
            onDelete={deleteSavedSearch}
          />

          {/* Example Companies */}
          {exampleCompanies.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">
                {t("leadScraping.exampleCompanies")}
              </label>
              <div className="space-y-2">
                {exampleCompanies.map((company, idx) => (
                  <div
                    key={idx}
                    className="px-4 py-2 bg-gray-50 rounded-lg text-gray-700 text-sm"
                  >
                    {company}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2">
              {t("leadScraping.locationLabel")}
            </label>
            <div className="relative">
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none text-gray-700 bg-white cursor-pointer"
              >
                {locationOptions.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Headcount */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2">
              {t("leadScraping.headcountLabel")}
            </label>
            <div className="space-y-3">
              <input
                type="range"
                min="0"
                max={headcountRanges.length - 1}
                step="1"
                value={headcountIndex}
                onChange={(e) => setHeadcountIndex(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-500"
              />
              <div className="flex justify-between items-center">
                <span className="text-2xl font-semibold text-teal-500">
                  {headcountRanges[headcountIndex].label}
                </span>
                <span className="text-sm text-gray-500">
                  {t("leadScraping.employeesUnit")}
                </span>
              </div>
            </div>
          </div>

          {/* Ownership */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2">
              {t("leadScraping.ownershipLabel")}
            </label>
            <div className="relative">
              <select
                value={ownership}
                onChange={(e) => setOwnership(e.target.value)}
                className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none text-gray-700 bg-white cursor-pointer"
              >
                {ownershipOptions.map((own) => (
                  <option key={own.value} value={own.value}>
                    {t(own.labelKey)}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Max Results */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2">
              {t("leadScraping.maxResultsLabel")}
            </label>
            <div className="space-y-3">
              <input
                type="range"
                min="0"
                max={maxResultsOptions.length - 1}
                step="1"
                value={maxResultsIndex}
                onChange={(e) => setMaxResultsIndex(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-500"
              />
              <div className="flex justify-between items-center">
                <span className="text-2xl font-semibold text-teal-500">
                  {maxResultsOptions[maxResultsIndex].label}
                </span>
                <span className="text-sm text-gray-500">
                  {t("leadScraping.maxResultsUnit")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Buyer Persona */}
        <div className="px-6">
          <button
            onClick={() => {
              setShowBuyerPersona(!showBuyerPersona);
              setBuyerPersonaDraft(buyerPersona);
            }}
            className="w-full flex items-center justify-between py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            <span>Ostajapersoona</span>
            <svg className={`w-4 h-4 transition-transform ${showBuyerPersona ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showBuyerPersona && (
            <div className="pb-4 space-y-3">
              <textarea
                value={buyerPersonaDraft}
                onChange={(e) => setBuyerPersonaDraft(e.target.value)}
                rows={8}
                placeholder="Kuvaile ihanneasiakkaasi..."
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-y focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
              {buyerPersonaDraft !== buyerPersona && (
                <div className="flex gap-2">
                  <Button
                    onClick={saveBuyerPersona}
                    loading={savingPersona}
                    size="sm"
                    className="flex-1"
                  >
                    Tallenna
                  </Button>
                  <Button
                    onClick={() => setBuyerPersonaDraft(buyerPersona)}
                    variant="secondary"
                    size="sm"
                  >
                    Peruuta
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Search Button */}
        <div className="p-6 border-t border-gray-200">
          <Button
            onClick={handleSearch}
            loading={loading}
            disabled={!searchQuery.trim()}
            className="w-full"
          >
            {t("leadScraping.searchButton")}
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header with Credits */}
        <div className="h-[73px] shrink-0 px-6 border-b border-gray-200 bg-white flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">
            {t("leadScraping.resultsTitle")}
          </h2>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {t("leadScraping.enrichCreditsLabel")}
              </span>
              <span className="text-lg font-bold text-blue-600">
                {credits.monthly - credits.used} / {credits.monthly}
              </span>
            </div>
            <Button
              onClick={() => { fetchLeads(); fetchCredits(); }}
              variant="secondary"
              size="sm"
            >
              {t("leadScraping.refreshButton", "Päivitä")}
            </Button>
          </div>
        </div>

        {/* Filter bar */}
        {leads.length > 0 && (
          <div className="shrink-0 border-b border-gray-200 bg-white">
            <div className="px-6 py-3 flex items-center gap-6">
              {/* Search */}
              <div className="relative flex-1 max-w-xs">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  placeholder={t("leadScraping.filterPlaceholder", "Hae nimellä, yrityksellä...")}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                />
              </div>

              {/* Dropdowns */}
              {leadCountries.length > 1 && (
                <select
                  value={filterCountry}
                  onChange={(e) => setFilterCountry(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">{t("leadScraping.filterAllCountries", "Kaikki maat")}</option>
                  {leadCountries.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              )}

              {/* Toggles */}
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setFilterHasEmail((v) => !v)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${filterHasEmail ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                >
                  {t("leadScraping.filterHasEmail", "Sähköposti")}
                </button>
                <button
                  onClick={() => setFilterHasPhone((v) => !v)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${filterHasPhone ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                >
                  {t("leadScraping.filterHasPhone", "Puhelin")}
                </button>
              </div>

              {/* Score */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 whitespace-nowrap">Score &ge;</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="10"
                  value={filterMinScore}
                  onChange={(e) => setFilterMinScore(Number(e.target.value))}
                  className="w-20 h-1.5 accent-blue-500"
                />
                <span className="text-xs font-medium text-gray-700 w-6">{filterMinScore}</span>
              </div>

              {/* Sort */}
              <div className="flex items-center gap-1.5 ml-auto">
                <select
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="created_at">{t("leadScraping.sortDate", "Uusin ensin")}</option>
                  <option value="fullName">{t("leadScraping.sortName", "Nimi")}</option>
                  <option value="orgName">{t("leadScraping.sortCompany", "Yritys")}</option>
                  <option value="score">{t("leadScraping.sortScore", "Score")}</option>
                  <option value="country">{t("leadScraping.sortCountry", "Maa")}</option>
                </select>
                <button
                  onClick={() => setSortDir((d) => d === "asc" ? "desc" : "asc")}
                  className="p-2 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-500 transition-colors"
                >
                  {sortDir === "asc" ? "\u2191" : "\u2193"}
                </button>
              </div>

              {/* Count + Export */}
              <span className="text-xs text-gray-400">{filteredLeads.length}/{leads.length}</span>
              <Button
                onClick={() => setShowExportModal(true)}
                variant="secondary"
                size="sm"
                disabled={filteredLeads.length === 0}
              >
                {t("leadScraping.exportCsvButton", "Vie CSV")}
              </Button>
            </div>
          </div>
        )}

        {/* Actions bar (shown when leads selected) */}
        {selectedLeads.length > 0 && (
          <div className="px-6 py-2.5 bg-blue-50 border-b border-blue-200 flex items-center gap-4">
            <span className="text-sm font-medium text-gray-900">
              {t("leadScraping.selectedCount", {
                count: selectedLeads.length,
              })}
            </span>

            <Button onClick={enrichSelectedLeads} size="sm">
              {t("leadScraping.enrichButton", {
                count: selectedLeads.length,
              })}
            </Button>

            <button
              onClick={clearSelection}
              className="text-sm text-gray-600 underline hover:text-gray-900"
            >
              {t("leadScraping.clearSelection")}
            </button>
          </div>
        )}

        <div className="flex-1 min-h-0 overflow-auto p-6">
          {/* Error message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start">
                <svg
                  className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Job started confirmation */}
          {jobId && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start">
                <svg
                  className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <p className="text-green-800 text-sm font-medium">
                    {t("leadScraping.scrapingStartedTitle")}
                  </p>
                  <p className="text-green-700 text-xs mt-1">
                    {t("leadScraping.jobIdLabel", { jobId })}
                  </p>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-600">
                  {t("leadScraping.startingScraping")}
                </p>
                <p className="text-gray-500 text-sm mt-2">
                  {t("leadScraping.pleaseWait")}
                </p>
              </div>
            </div>
          ) : filteredLeads.length > 0 ? (
            <div className="space-y-2">
              {/* Select all checkbox */}
              <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                <input
                  type="checkbox"
                  checked={
                    selectedLeads.length === filteredLeads.length && filteredLeads.length > 0
                  }
                  onChange={() =>
                    selectedLeads.length === filteredLeads.length
                      ? clearSelection()
                      : selectAllLeads()
                  }
                  className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">
                  {t("leadScraping.selectAll")}
                </span>
              </div>

              {filteredLeads.map((lead, idx) => (
                <div
                  key={lead.id || idx}
                  className="bg-white px-4 py-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => setViewingLead(lead)}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedLeads.includes(lead.id || idx)}
                      onChange={() => toggleLeadSelection(lead.id || idx)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />

                    <div className="flex-1 flex items-center gap-4 min-w-0">
                      <div className="w-44 shrink-0">
                        <p className="font-medium text-sm text-gray-900 truncate">
                          {lead.fullName ||
                            lead.firstName + " " + lead.lastName}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {lead.position}
                        </p>
                      </div>
                      <div className="w-36 shrink-0">
                        <p className="text-sm text-gray-900 truncate">{lead.orgName}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {[lead.city, lead.country].filter(Boolean).join(", ")}
                        </p>
                      </div>
                      <div className="flex-1 min-w-0">
                        {lead.email && (
                          <p className="text-sm text-blue-600 truncate">{lead.email}</p>
                        )}
                        {lead.phone && (
                          <p className="text-xs text-gray-500">{lead.phone}</p>
                        )}
                      </div>
                      {lead.score != null && (
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-500"
                              style={{ width: `${lead.score || 0}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-gray-600 w-7 text-right">
                            {lead.score || 0}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : leads.length > 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500">
                <p className="text-lg">{t("leadScraping.noFilterResults", "Ei tuloksia suodattimilla")}</p>
                <button
                  onClick={() => { setFilterText(""); setFilterHasEmail(false); setFilterHasPhone(false); setFilterCountry(""); }}
                  className="text-sm text-blue-600 hover:underline mt-2"
                >
                  {t("leadScraping.clearFilters", "Tyhjennä suodattimet")}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500">
                <svg
                  className="w-16 h-16 mx-auto mb-4 text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <p className="text-lg">{t("leadScraping.noResultsYet")}</p>
                <p className="text-sm mt-2">
                  {t("leadScraping.noResultsHint")}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <SaveSearchModal
        isOpen={showSaveSearchModal}
        onClose={() => setShowSaveSearchModal(false)}
        searchQuery={searchQuery}
        location={location}
        headcount={headcountRanges[headcountIndex].apiValue}
        ownership={ownership}
        onSave={handleSaveSearch}
      />

      <ExportLeadsModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        selectedLeads={
          selectedLeads.length > 0
            ? filteredLeads.filter((l) => selectedLeads.includes(l.id))
            : filteredLeads
        }
      />

      <ConfirmationToast
        show={showEnrichConfirm}
        message={t("leadScraping.confirmEnrich", {
          count: selectedLeads.length,
          credits: selectedLeads.length,
          creditsPerLead: 1,
        })}
        onSave={confirmEnrich}
        onDiscard={() => setShowEnrichConfirm(false)}
        saveLabel={t("leadScraping.enrichButton", { count: selectedLeads.length })}
        discardLabel={t("common.cancel", "Peruuta")}
      />

      {viewingLead && <LeadDetailModal lead={viewingLead} onClose={() => setViewingLead(null)} />}
    </div>
  );
}

function LeadDetailModal({ lead, onClose }) {
  const [descExpanded, setDescExpanded] = useState(false);

  const fullName = lead.fullName || [lead.firstName, lead.lastName].filter(Boolean).join(" ");
  const location = [lead.city, lead.state, lead.country].filter(Boolean).join(", ");
  const orgLocation = [lead.orgCity, lead.orgState, lead.orgCountry].filter(Boolean).join(", ");
  const orgIndustry = Array.isArray(lead.orgIndustry) ? lead.orgIndustry.join(", ") : lead.orgIndustry;
  const orgLinkedin = Array.isArray(lead.orgLinkedinUrl) ? lead.orgLinkedinUrl[0] : lead.orgLinkedinUrl;
  const functional = Array.isArray(lead.functional) ? lead.functional.join(", ") : lead.functional;
  const specialties = Array.isArray(lead.org_specialties) ? lead.org_specialties.join(", ") : lead.org_specialties;

  const truncateUrl = (url) => {
    if (!url) return "";
    try {
      const u = new URL(url.startsWith("http") ? url : `https://${url}`);
      return u.hostname.replace("www.", "");
    } catch {
      return url.length > 30 ? url.slice(0, 30) + "..." : url;
    }
  };

  const LinkValue = ({ href, children }) => {
    const url = href && href.startsWith("http") ? href : `https://${href}`;
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 hover:underline truncate block">
        {children || truncateUrl(href)}
      </a>
    );
  };

  const Field = ({ label, children }) => {
    if (!children && children !== 0) return null;
    return (
      <div>
        <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-0.5">{label}</div>
        <div className="text-sm text-gray-900">{children}</div>
      </div>
    );
  };

  const scoreColor = (lead.score || 0) >= 70 ? "text-green-600" : (lead.score || 0) >= 40 ? "text-amber-600" : "text-gray-400";

  const description = lead.orgDescription || "";
  const showDescToggle = description.length > 150;
  const displayDesc = descExpanded ? description : description.slice(0, 150);

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="shrink-0 px-6 py-5 bg-gradient-to-r from-gray-50 to-white flex items-start justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold shrink-0">
              {(fullName || "?")[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-gray-900 truncate">{fullName}</h2>
              {lead.position && <p className="text-sm text-gray-600">{lead.position}{lead.seniority ? ` · ${lead.seniority}` : ""}</p>}
              {lead.orgName && <p className="text-sm text-gray-400">{lead.orgName}</p>}
              {location && <p className="text-xs text-gray-400 mt-0.5">{location}</p>}
            </div>
          </div>
          <div className="flex items-start gap-3 shrink-0">
            {lead.score != null && (
              <div className="text-center px-3 py-1 rounded-lg bg-white border border-gray-200">
                <div className={`text-2xl font-bold ${scoreColor}`}>{lead.score}</div>
                <div className="text-[10px] text-gray-400 uppercase tracking-wider">Score</div>
              </div>
            )}
            <button onClick={onClose} className="mt-1 p-1.5 hover:bg-gray-200 rounded-lg text-gray-400 hover:text-gray-700 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-5">
          {/* Contact + Company side by side */}
          <div className="grid grid-cols-2 gap-6">
            {/* Yhteystiedot */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider pb-2 border-b border-gray-100">Yhteystiedot</h3>
              <div className="space-y-3">
                {lead.email && (
                  <Field label="Sähköposti">
                    <a href={`mailto:${lead.email}`} className="text-blue-600 hover:text-blue-800 hover:underline">{lead.email}</a>
                    {lead.email_status && <span className="ml-2 text-xs text-gray-400">({lead.email_status})</span>}
                  </Field>
                )}
                {lead.phone && (
                  <Field label="Puhelin">
                    <a href={`tel:${lead.phone}`} className="text-blue-600 hover:text-blue-800 hover:underline">{lead.phone}</a>
                  </Field>
                )}
                {lead.linkedinUrl && (
                  <Field label="LinkedIn">
                    <LinkValue href={lead.linkedinUrl} />
                  </Field>
                )}
                {functional && <Field label="Toiminnot">{functional}</Field>}
              </div>
              {lead.score_criteria && (
                <div className="pt-3 mt-3 border-t border-gray-100">
                  <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">Pisteytyksen perustelu</div>
                  <p className="text-sm text-gray-600 leading-relaxed">{lead.score_criteria}</p>
                </div>
              )}
            </div>

            {/* Yritystiedot */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider pb-2 border-b border-gray-100">Yritystiedot</h3>
              <div className="space-y-3">
                {lead.orgName && <Field label="Yritys">{lead.orgName}</Field>}
                {orgIndustry && <Field label="Toimiala">{orgIndustry}</Field>}
                {(lead.orgSize || lead.orgFoundedYear) && (
                  <div className="flex gap-6">
                    {lead.orgSize && <Field label="Koko">{lead.orgSize} hlö</Field>}
                    {lead.orgFoundedYear && <Field label="Perustettu">{lead.orgFoundedYear}</Field>}
                  </div>
                )}
                {orgLocation && <Field label="Sijainti">{orgLocation}</Field>}
                {lead.orgWebsite && (
                  <Field label="Verkkosivusto">
                    <LinkValue href={lead.orgWebsite} />
                  </Field>
                )}
                {orgLinkedin && (
                  <Field label="LinkedIn">
                    <LinkValue href={orgLinkedin} />
                  </Field>
                )}
                {specialties && <Field label="Erikoisalat">{specialties}</Field>}
              </div>
            </div>
          </div>

          {/* Description - full width */}
          {description && (
            <div className="pt-4 border-t border-gray-100">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Yrityksen kuvaus</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {displayDesc}{showDescToggle && !descExpanded && "..."}
              </p>
              {showDescToggle && (
                <button onClick={() => setDescExpanded(!descExpanded)} className="text-xs text-blue-600 hover:text-blue-800 mt-1">
                  {descExpanded ? "Näytä vähemmän" : "Näytä lisää"}
                </button>
              )}
            </div>
          )}

        </div>
      </div>
    </div>,
    document.body,
  );
}
