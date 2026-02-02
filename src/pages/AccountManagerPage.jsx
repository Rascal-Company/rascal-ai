import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "../lib/supabase";
import { getCurrentUser } from "../utils/userApi";
import { useAuth } from "../contexts/AuthContext";

export default function AccountManagerPage() {
  const { t } = useTranslation("common");
  const { user } = useAuth();
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    loadCurrentUser();
  }, [user]);

  useEffect(() => {
    if (currentUserId !== null) {
      loadAccounts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId, isAdmin]);

  const loadCurrentUser = async () => {
    if (!user) return;

    try {
      // Hae käyttäjätiedot API:n kautta
      const data = await getCurrentUser();
      const error = null;

      if (error) throw error;
      setCurrentUserId(data.id);

      // Vain moderator ja superadmin pääsevät tälle sivulle
      const isModerator =
        user.systemRole === "moderator" || user.systemRole === "superadmin";
      setIsAdmin(isModerator);

      console.log("[AccountManagerPage] User role check:", {
        systemRole: user.systemRole,
        isModerator,
      });
    } catch (error) {
      console.error("Error loading current user:", error);
      setError("Virhe käyttäjän tiedoissa");
    }
  };

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
        `);

      // Jos ei ole admin, hae vain käyttäjät joiden account_manager_id vastaa
      if (!isAdmin) {
        query = query.eq("account_manager_id", currentUserId);
      }

      const { data, error } = await query.order("contact_person", {
        ascending: true,
      });

      if (error) throw error;

      // Hae postausten määrät ja organisaation viimeisin kirjautumisaika erikseen
      const accountsWithStats = await Promise.all(
        (data || []).map(async (account) => {
          const { count: totalCount } = await supabase
            .from("content")
            .select("*", { count: "exact", head: true })
            .eq("user_id", account.id);

          // Hae julkaistut postaukset (Published tai Scheduled)
          const { count: publishedCount, error: publishedError } =
            await supabase
              .from("content")
              .select("*", { count: "exact", head: true })
              .eq("user_id", account.id)
              .in("status", ["Published", "Scheduled"]);

          if (publishedError) {
            console.error("Error counting published posts:", publishedError);
          }

          // last_sign_in_at päivittyy automaattisesti handle_user_email_verification() triggerin kautta
          // kun organisaation käyttäjät kirjautuvat sisään, joten voimme käyttää suoraan account.last_sign_in_at

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

  if (loading) {
    return (
      <div className="account-manager-page">
        <div className="loading-message">Ladataan tilejä...</div>
      </div>
    );
  }

  return (
    <div className="account-manager-page">
      <div className="account-manager-header">
        <h1>Salkun hallinta</h1>
        <p>
          {isAdmin
            ? "Hallitse kaikkia käyttäjiä"
            : "Hallitse sinulle määritettyjä käyttäjiä"}
        </p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="account-manager-filters">
        <div className="search-container">
          <input
            type="text"
            placeholder={t("placeholders.searchByUser")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="accounts-stats">
        <div className="stat-card">
          <div className="stat-value">{accounts.length}</div>
          <div className="stat-label">Yhteensä käyttäjiä</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {accounts.reduce((sum, acc) => sum + acc.postsCount, 0)}
          </div>
          <div className="stat-label">Yhteensä postauksia</div>
        </div>
      </div>

      {filteredAccounts.length === 0 ? (
        <div className="no-accounts">
          {searchTerm
            ? "Ei löytynyt käyttäjiä hakuehtojen perusteella"
            : "Sinulle ei ole vielä määritetty käyttäjiä"}
        </div>
      ) : (
        <div className="accounts-grid">
          {filteredAccounts.map((account) => (
            <div key={account.id} className="account-card">
              <div className="card-header">
                <h3>{account.company_name || "Yrityksen nimi puuttuu"}</h3>
                {account.contact_person && (
                  <div className="contact-person">{account.contact_person}</div>
                )}
              </div>

              <div className="card-content">
                <div className="info-row">
                  <span className="info-label">Sähköposti:</span>
                  <span className="info-value">
                    {account.contact_email || "-"}
                  </span>
                </div>

                <div className="info-row">
                  <span className="info-label">Viimeksi kirjautunut:</span>
                  <span className="info-value">
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

                <div className="info-row">
                  <span className="info-label">Postaukset yhteensä:</span>
                  <span className="info-value">{account.postsCount}</span>
                </div>

                <div className="info-row">
                  <span className="info-label">Julkaistut postaukset:</span>
                  <span className="info-value published">
                    {account.publishedCount}
                  </span>
                </div>
              </div>

              <div className="card-footer">
                <button
                  className="view-details-btn"
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
