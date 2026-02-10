import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

export default function AccountManagerPage() {
  const { t } = useTranslation("common");
  const { user, organization } = useAuth();
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("company"); // 'company' or 'lastLogin'
  const [sortDirection, setSortDirection] = useState("asc"); // 'asc' or 'desc'

  const currentUserId = organization?.id || null;
  const isAdmin =
    user?.systemRole === "moderator" || user?.systemRole === "superadmin";

  useEffect(() => {
    if (currentUserId !== null) {
      loadAccounts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId, isAdmin]);

  const loadAccounts = async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase.from("users").select(`
          id,
          company_name,
          contact_person,
          contact_email,
          last_sign_in_at
        `)
        .neq("status", "Canceled");

      if (!isAdmin) {
        query = query.eq("account_manager_id", currentUserId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const accountsWithStats = await Promise.all(
        (data || []).map(async (account) => {
          const { count: totalCount } = await supabase
            .from("content")
            .select("*", { count: "exact", head: true })
            .eq("user_id", account.id);

          const { count: publishedCount, error: publishedError } =
            await supabase
              .from("content")
              .select("*", { count: "exact", head: true })
              .eq("user_id", account.id)
              .in("status", ["Published", "Scheduled"]);

          if (publishedError) {
            console.error("Error counting published posts:", publishedError);
          }

          return {
            ...account,
            postsCount: totalCount || 0,
            publishedCount: publishedCount || 0,
          };
        }),
      );

      setAccounts(accountsWithStats);
    } catch (error) {
      console.error("Error loading accounts:", error);
      setError("Virhe tilien lataamisessa");
    } finally {
      setLoading(false);
    }
  };

  const filteredAccounts = accounts.filter((account) => {
    const matchesSearch =
      account.contact_person
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      account.contact_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.company_name?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const sortedAccounts = [...filteredAccounts].sort((a, b) => {
    if (sortBy === "company") {
      const companyA = a.company_name?.toLowerCase() || "";
      const companyB = b.company_name?.toLowerCase() || "";
      return sortDirection === "asc" ? companyA.localeCompare(companyB) : companyB.localeCompare(companyA);
    } else if (sortBy === "lastLogin") {
      const dateA = a.last_sign_in_at ? new Date(a.last_sign_in_at).getTime() : 0;
      const dateB = b.last_sign_in_at ? new Date(b.last_sign_in_at).getTime() : 0;
      return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
    }
    return 0;
  });

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center py-12 text-gray-500">
          Ladataan tilejä...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Salkun hallinta</h1>
        <p className="text-gray-500">
          {isAdmin
            ? "Hallitse kaikkia käyttäjiä"
            : "Hallitse sinulle määritettyjä käyttäjiä"}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm mb-6">
          {error}
        </div>
      )}

      <div className="mb-6">
        <input
          type="text"
          placeholder={t("placeholders.searchByUser")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-md px-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>

      <div className="mb-6 flex gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Järjestä:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="company">Nimen mukaan</option>
            <option value="lastLogin">Viimeksi kirjautunut</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Suunta:</label>
          <select
            value={sortDirection}
            onChange={(e) => setSortDirection(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="asc">Nouseva</option>
            <option value="desc">Laskeva</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="text-3xl font-bold text-gray-800">{accounts.length}</div>
          <div className="text-sm text-gray-500 mt-1">Yhteensä käyttäjiä</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="text-3xl font-bold text-gray-800">
            {accounts.reduce((sum, acc) => sum + acc.postsCount, 0)}
          </div>
          <div className="text-sm text-gray-500 mt-1">Yhteensä postauksia</div>
        </div>
      </div>

      {sortedAccounts.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-8 text-center text-gray-500">
          {searchTerm
            ? "Ei löytynyt käyttäjiä hakuehtojen perusteella"
            : "Sinulle ei ole vielä määritetty käyttäjiä"}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedAccounts.map((account) => (
            <div
              key={account.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
                <h3 className="font-semibold text-gray-800 truncate">
                  {account.company_name || "Yrityksen nimi puuttuu"}
                </h3>
                {account.contact_person && (
                  <div className="text-sm text-gray-500 mt-0.5 truncate">
                    {account.contact_person}
                  </div>
                )}
              </div>

              <div className="p-5 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Sähköposti:</span>
                  <span className="text-gray-800 font-medium truncate ml-2 max-w-[60%]">
                    {account.contact_email || "-"}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Viimeksi kirjautunut:</span>
                  <span className="text-gray-800 font-medium">
                    {account.last_sign_in_at
                      ? new Date(account.last_sign_in_at).toLocaleDateString(
                          "fi-FI",
                          {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          },
                        )
                      : "Ei koskaan"}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Postaukset yhteensä:</span>
                  <span className="text-gray-800 font-medium">{account.postsCount}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Julkaistut postaukset:</span>
                  <span className="text-green-600 font-semibold">
                    {account.publishedCount}
                  </span>
                </div>
              </div>

              <div className="px-5 py-4 border-t border-gray-100 bg-gray-50">
                <button
                  className="w-full py-2 px-4 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors"
                  onClick={() => navigate(`/account-manager/${account.id}`)}
                >
                  Näytä tiedot
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
