import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import Button from "../components/Button";
import SaveSearchModal from "../components/SaveSearchModal";
import SavedSearchesList from "../components/SavedSearchesList";
import ExportLeadsModal from "../components/ExportLeadsModal";

export default function LeadScrapingPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("United States");
  const [headcount, setHeadcount] = useState(50);
  const [ownership, setOwnership] = useState("Private");
  const [intentToSell, setIntentToSell] = useState(false);
  const [loading, setLoading] = useState(false);
  const [exampleCompanies] = useState([]);
  const [error, setError] = useState("");
  const [jobId, setJobId] = useState(null);

  // Feature 3: Saved searches
  const [savedSearches, setSavedSearches] = useState([]);
  const [showSaveSearchModal, setShowSaveSearchModal] = useState(false);

  // Feature 5: Credits display
  const [credits, setCredits] = useState({ monthly: 0, used: 0 });

  // Feature 6: CSV Export & Bulk selection
  // TODO: setLeads will be used when webhook callback is implemented to populate leads
  const [leads] = useState([]);
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [showExportModal, setShowExportModal] = useState(false);

  // Location options
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

  // Ownership options
  const ownershipOptions = ["Private", "Public", "Non-Profit", "Government"];

  // Fetch saved searches
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

  // Save search handler
  const handleSaveSearch = async (searchData) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) throw new Error("Please log in");

    const response = await fetch("/api/leads/searches", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(searchData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to save search");
    }

    await fetchSavedSearches();
  };

  // Run saved search
  const runSavedSearch = async (search) => {
    setSearchQuery(search.query);
    setLocation(search.location || "United States");
    setHeadcount(search.headcount || 50);
    setOwnership(search.ownership || "Private");
    setIntentToSell(search.intent_to_sell || false);
  };

  // Delete saved search
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

  // Fetch credits
  const fetchCredits = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch("/api/organization/account", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await response.json();
      setCredits({
        monthly: data.enrichment_credits_monthly || 0,
        used: data.enrichment_credits_used || 0,
      });
    } catch (err) {
      console.error("Failed to fetch credits:", err);
    }
  };

  // Toggle lead selection
  const toggleLeadSelection = (leadId) => {
    setSelectedLeads((prev) =>
      prev.includes(leadId)
        ? prev.filter((id) => id !== leadId)
        : [...prev, leadId],
    );
  };

  // Select all leads
  const selectAllLeads = () => {
    setSelectedLeads(leads.map((l) => l.id));
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedLeads([]);
  };

  // Enrich selected leads
  const enrichSelectedLeads = async () => {
    const creditsNeeded = selectedLeads.length;
    const creditsRemaining = credits.monthly - credits.used;

    if (creditsNeeded > creditsRemaining) {
      alert(
        `Ei tarpeeksi credittejä! Tarvitset ${creditsNeeded}, sinulla on ${creditsRemaining}`,
      );
      return;
    }

    if (
      !confirm(
        `Rikastat ${creditsNeeded} liidiä. Tämä käyttää ${creditsNeeded} credittiä. Jatketaanko?`,
      )
    ) {
      return;
    }

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Please log in");

      const response = await fetch("/api/leads?action=enrich", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ leadIds: selectedLeads }),
      });

      if (response.ok) {
        alert("Rikastus aloitettu!");
        await fetchCredits();
        clearSelection();
      } else {
        const error = await response.json();
        throw new Error(error.error || "Rikastus epäonnistui");
      }
    } catch (err) {
      alert(err.message || "Rikastus epäonnistui");
    }
  };

  // Initialize data on mount
  useEffect(() => {
    fetchSavedSearches();
    fetchCredits();
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError("Please describe what you are looking for");
      return;
    }

    setLoading(true);
    setError("");
    setJobId(null);

    try {
      // Get authentication token
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        throw new Error("Please log in to search for leads");
      }

      // Prepare filters for n8n
      const filters = {
        query: searchQuery,
        location,
        headcount,
        ownership,
        intentToSell,
      };

      // Prepare Apify configuration
      // This format matches the Pipeline Labs / Apify actor requirements
      const apifyJson = {
        query: searchQuery,
        location: [location],
        companySize: `${headcount}`,
        ownership: [ownership],
        intentToSell,
        maxResults: 1000,
      };

      // Call the n8n endpoint
      const response = await fetch("/api/leads/scraping", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          filters,
          apifyJson,
          leadLimit: 1000,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to start lead scraping");
      }

      setJobId(data.jobId);
      setError("");

      // Show success message
      alert(
        "Lead scraping started! You will be notified when results are ready.",
      );
    } catch (err) {
      console.error("Search error:", err);
      setError(err.message || "Failed to search for leads");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Lead Scraping</h1>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Chat Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What are you looking for?
            </label>
            <textarea
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="I want to find residents needing solar panel installation"
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
            💾 Tallenna haku
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
                Example companies
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
              Location
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
              Headcount
            </label>
            <div className="space-y-3">
              <input
                type="range"
                min="1"
                max="10000"
                step="10"
                value={headcount}
                onChange={(e) => setHeadcount(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-500"
              />
              <div className="flex justify-between items-center">
                <span className="text-2xl font-semibold text-teal-500">
                  {headcount}
                </span>
                <span className="text-sm text-gray-500">employees</span>
              </div>
            </div>
          </div>

          {/* Ownership */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2">
              Ownership
            </label>
            <div className="relative">
              <select
                value={ownership}
                onChange={(e) => setOwnership(e.target.value)}
                className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none text-gray-700 bg-white cursor-pointer"
              >
                {ownershipOptions.map((own) => (
                  <option key={own} value={own}>
                    {own}
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

          {/* Intent to Sell */}
          <div>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm font-medium text-gray-700">
                Intent to sell
              </span>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={intentToSell}
                  onChange={(e) => setIntentToSell(e.target.checked)}
                  className="sr-only"
                />
                <div
                  onClick={() => setIntentToSell(!intentToSell)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    intentToSell ? "bg-teal-500" : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                      intentToSell ? "transform translate-x-6" : ""
                    }`}
                  />
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Search Button */}
        <div className="p-6 border-t border-gray-200">
          <Button
            onClick={handleSearch}
            loading={loading}
            disabled={!searchQuery.trim()}
            className="w-full"
          >
            Search
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header with Credits */}
        <div className="p-6 border-b border-gray-200 bg-white flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Results</h2>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Rikastus creditit:</span>
            <span className="text-lg font-bold text-blue-600">
              {credits.monthly - credits.used} / {credits.monthly}
            </span>
          </div>
        </div>

        {/* Actions bar (shown when leads selected) */}
        {selectedLeads.length > 0 && (
          <div className="p-4 bg-blue-50 border-b border-blue-200 flex items-center gap-4">
            <span className="font-medium text-gray-900">
              {selectedLeads.length} valittu
            </span>

            <Button onClick={enrichSelectedLeads} size="sm">
              ✨ Rikasta ({selectedLeads.length} €)
            </Button>

            <Button onClick={() => setShowExportModal(true)} size="sm">
              📤 Vie CSV
            </Button>

            <button
              onClick={clearSelection}
              className="text-sm text-gray-600 underline hover:text-gray-900"
            >
              Tyhjennä valinta
            </button>
          </div>
        )}

        <div className="flex-1 overflow-auto p-6">
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
                    Lead scraping started successfully!
                  </p>
                  <p className="text-green-700 text-xs mt-1">Job ID: {jobId}</p>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Starting lead scraping...</p>
                <p className="text-gray-500 text-sm mt-2">
                  This may take a few moments
                </p>
              </div>
            </div>
          ) : leads.length > 0 ? (
            <div className="space-y-4">
              {/* Select all checkbox */}
              <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                <input
                  type="checkbox"
                  checked={
                    selectedLeads.length === leads.length && leads.length > 0
                  }
                  onChange={() =>
                    selectedLeads.length === leads.length
                      ? clearSelection()
                      : selectAllLeads()
                  }
                  className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">Valitse kaikki</span>
              </div>

              {leads.map((lead, idx) => (
                <div
                  key={lead.id || idx}
                  className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedLeads.includes(lead.id || idx)}
                      onChange={() => toggleLeadSelection(lead.id || idx)}
                      className="mt-1 w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />

                    <div className="flex-1 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Name</p>
                        <p className="font-medium text-gray-900">
                          {lead.fullName ||
                            lead.firstName + " " + lead.lastName}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Position</p>
                        <p className="font-medium text-gray-900">
                          {lead.position}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Company</p>
                        <p className="font-medium text-gray-900">
                          {lead.orgName}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Location</p>
                        <p className="font-medium text-gray-900">
                          {lead.city}, {lead.country}
                        </p>
                      </div>
                      {lead.email && (
                        <div>
                          <p className="text-sm text-gray-500">Email</p>
                          <p className="font-medium text-blue-600">
                            {lead.email}
                          </p>
                        </div>
                      )}
                      {lead.phone && (
                        <div>
                          <p className="text-sm text-gray-500">Phone</p>
                          <p className="font-medium text-gray-900">
                            {lead.phone}
                          </p>
                        </div>
                      )}
                      {/* Score */}
                      {lead.score !== undefined && (
                        <div>
                          <p className="text-sm text-gray-500">Pisteet</p>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-lg text-gray-900">
                              {lead.score || 0}
                            </span>
                            <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-green-500"
                                style={{ width: `${lead.score || 0}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
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
                <p className="text-lg">No results yet</p>
                <p className="text-sm mt-2">
                  Describe what you're looking for and click Search
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
        headcount={headcount}
        ownership={ownership}
        intentToSell={intentToSell}
        onSave={handleSaveSearch}
      />

      <ExportLeadsModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        selectedLeads={leads.filter((l) =>
          selectedLeads.includes(l.id || leads.indexOf(l)),
        )}
      />
    </div>
  );
}
