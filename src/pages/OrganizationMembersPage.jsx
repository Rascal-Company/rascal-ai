// src/pages/OrganizationMembersPage.jsx
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import Button from "../components/Button";

const OrganizationMembersPage = () => {
  const { t } = useTranslation("common");
  const { user, organization } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviting, setInviting] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);

  useEffect(() => {
    console.log("OrganizationMembersPage - useEffect triggered:", {
      organization,
      role: organization?.role,
      hasOrganization: !!organization,
    });
    if (
      organization &&
      (organization.role === "owner" || organization.role === "admin")
    ) {
      fetchMembers();
    }
  }, [organization]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) {
        setError(t("orgMembers.noAuthError"));
        return;
      }

      const response = await axios.get("/api/organization/members", {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("Fetched members from API:", response.data.members);
      // Näytä jokaisen jäsenen rooli
      if (response.data.members && response.data.members.length > 0) {
        console.log(
          "Members with roles:",
          response.data.members.map((m) => ({
            email: m.email,
            role: m.role,
            auth_user_id: m.auth_user_id,
          })),
        );
      }
      setMembers(response.data.members || []);
    } catch (e) {
      console.error("Error fetching members:", e);
      setError(e.response?.data?.error || t("orgMembers.fetchError"));
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail) return;

    try {
      setInviting(true);
      setError(null);

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) {
        setError(t("orgMembers.noAuthError"));
        return;
      }

      await axios.post(
        "/api/organization/invites",
        {
          email: inviteEmail,
          role: inviteRole,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      // Päivitä jäsenlista
      await fetchMembers();
      setInviteEmail("");
      setInviteRole("member");
      setShowInviteForm(false);
    } catch (e) {
      console.error("Error inviting member:", e);
      // Näytä myös hint ja details jos saatavilla
      const errorData = e.response?.data || {};
      const errorMessage = errorData.error || t("orgMembers.inviteError");
      const hint = errorData.hint ? `\n${errorData.hint}` : "";
      const details = errorData.details ? `\n${errorData.details}` : "";
      setError(`${errorMessage}${hint}${details}`);
    } finally {
      setInviting(false);
    }
  };

  const handleUpdateRole = async (authUserId, newRole) => {
    try {
      setError(null);

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) {
        setError(t("orgMembers.noAuthError"));
        return;
      }

      await axios.put(
        "/api/organization/members",
        {
          auth_user_id: authUserId,
          role: newRole,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      // Päivitä jäsenlista
      await fetchMembers();
    } catch (e) {
      console.error("Error updating role:", e);
      setError(
        e.response?.data?.error || e.message || t("orgMembers.updateRoleError"),
      );
    }
  };

  const handleRemoveMember = async (authUserId) => {
    if (!window.confirm(t("orgMembers.confirmRemove"))) {
      return;
    }

    try {
      setError(null);

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) {
        setError(t("orgMembers.noAuthError"));
        return;
      }

      await axios.delete("/api/organization/members", {
        params: {
          auth_user_id: authUserId,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Päivitä jäsenlista
      await fetchMembers();
    } catch (e) {
      console.error("Error removing member:", e);
      setError(
        e.response?.data?.error || e.message || t("orgMembers.removeError"),
      );
    }
  };

  const handleResendInvite = async (authUserId) => {
    try {
      setError(null);

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) {
        setError(t("orgMembers.noAuthError"));
        return;
      }

      await axios.post(
        "/api/organization/invites?action=resend",
        {
          auth_user_id: authUserId,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      // Näytä onnistumisviesti
      alert(t("orgMembers.resendSuccess"));
    } catch (e) {
      console.error("Error resending invite:", e);
      setError(
        e.response?.data?.error || e.message || t("orgMembers.resendError"),
      );
    }
  };

  // Tarkista oikeudet
  if (
    !organization ||
    (organization.role !== "owner" && organization.role !== "admin")
  ) {
    return (
      <div className="org-members-container">
        <div className="org-members-page-header">
          <h1>{t("orgMembers.pageTitle")}</h1>
        </div>
        <div className="org-members-card">
          <div className="org-members-error-message">
            <h2>{t("orgMembers.noPermissionsTitle")}</h2>
            <p>{t("orgMembers.noPermissionsMessage")}</p>
          </div>
        </div>
      </div>
    );
  }

  // Varmista että organization on olemassa ja rooli on asetettu
  const userRole = organization?.role;
  const canInvite = userRole === "owner" || userRole === "admin";
  const canRemove = userRole === "owner";
  const canUpdateRole = userRole === "owner" || userRole === "admin";

  // Debug: Tarkista organisaation rooli
  console.log("OrganizationMembersPage - Organization:", {
    organization,
    userRole,
    canUpdateRole,
    canInvite,
    canRemove,
    user: user?.id,
  });

  return (
    <div className="org-members-container">
      <div className="org-members-page-header">
        <h1>{t("orgMembers.pageTitle")}</h1>
        {canInvite && (
          <Button
            onClick={() => setShowInviteForm(!showInviteForm)}
            variant={showInviteForm ? "secondary" : "primary"}
          >
            {showInviteForm
              ? t("common.cancel")
              : t("organizationMembers.inviteUser")}
          </Button>
        )}
      </div>

      {error && <div className="org-members-error-message">{error}</div>}

      {showInviteForm && canInvite && (
        <div className="org-members-card">
          <h2 className="org-members-card-title">
            {t("orgMembers.inviteNewUser")}
          </h2>
          <form onSubmit={handleInvite} className="org-members-form">
            <div className="org-members-form-group">
              <label htmlFor="email">{t("orgMembers.emailLabel")}</label>
              <input
                type="email"
                id="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
                placeholder={t("orgMembers.emailPlaceholder")}
                className="org-members-input"
              />
            </div>
            <div className="org-members-form-group">
              <label htmlFor="role">{t("orgMembers.roleLabel")}</label>
              <select
                id="role"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="org-members-select"
              >
                <option value="member">{t("orgMembers.roleMember")}</option>
                <option value="admin">{t("orgMembers.roleAdmin")}</option>
                {organization.role === "owner" && (
                  <option value="owner">{t("orgMembers.roleOwner")}</option>
                )}
              </select>
            </div>
            <div className="org-members-form-actions">
              <Button type="submit" variant="primary" disabled={inviting}>
                {inviting ? t("orgMembers.inviting") : t("orgMembers.invite")}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowInviteForm(false);
                  setInviteEmail("");
                  setInviteRole("member");
                }}
              >
                {t("common.cancel")}
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="org-members-card">
        <h2 className="org-members-card-title">
          {t("orgMembers.membersTitle")}
        </h2>
        {loading ? (
          <div className="org-members-loading">{t("common.loading")}</div>
        ) : (
          <div className="org-members-list">
            {members.length === 0 ? (
              <p className="org-members-empty-state">
                {t("orgMembers.noMembers")}
              </p>
            ) : (
              <div className="org-members-table-wrapper">
                <table className="org-members-table">
                  <thead>
                    <tr>
                      <th>{t("orgMembers.emailColumn")}</th>
                      <th>{t("orgMembers.roleColumn")}</th>
                      <th>{t("orgMembers.joinedColumn")}</th>
                      <th>{t("orgMembers.actionsColumn")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((member) => {
                      const authUser = member.auth_users;
                      // Vertaile auth_user_id:tä suoraan, ei auth_users.id:ta
                      const isCurrentUser = member.auth_user_id === user?.id;
                      // Käytetään roolia suoraan org_members taulusta
                      const memberRole = member.role || "member";
                      const isOwner = memberRole === "owner";

                      // Roolin voi muuttaa jos:
                      // 1. Käyttäjällä on oikeudet (admin/owner) - tarkistetaan canUpdateRole
                      // 2. Ei ole oma käyttäjä - tarkistetaan !isCurrentUser
                      // 3. JA JOKO:
                      //    - Kirjautunut on owner (voi muuttaa ketä tahansa, myös ownereita)
                      //    - TAI kohde ei ole owner (admin voi muuttaa admin/member välillä)
                      const canChangeThisRole = Boolean(
                        canUpdateRole &&
                        !isCurrentUser &&
                        (organization.role === "owner" || !isOwner),
                      );

                      // Debug logi - näytetään vain jos ongelma
                      if (!canChangeThisRole && canUpdateRole) {
                        console.log("Member role check (cannot change):", {
                          email: authUser?.email,
                          memberRole,
                          memberAuthUserId: member.auth_user_id,
                          currentUserId: user?.id,
                          isCurrentUser,
                          isOwner,
                          organizationRole: organization?.role,
                          canUpdateRole,
                          canChangeThisRole,
                          reason: isCurrentUser
                            ? "is current user"
                            : isOwner && organization.role !== "owner"
                              ? "is owner (only owner can change owner role)"
                              : "unknown",
                        });
                      }

                      return (
                        <tr key={member.auth_user_id}>
                          <td>{authUser?.email || t("orgMembers.noEmail")}</td>
                          <td>
                            {canChangeThisRole ? (
                              <select
                                value={memberRole}
                                onChange={(e) =>
                                  handleUpdateRole(
                                    member.auth_user_id,
                                    e.target.value,
                                  )
                                }
                                className="org-members-role-select"
                              >
                                <option value="member">
                                  {t("orgMembers.roleMember")}
                                </option>
                                <option value="admin">
                                  {t("orgMembers.roleAdmin")}
                                </option>
                                {organization.role === "owner" && (
                                  <option value="owner">
                                    {t("orgMembers.roleOwner")}
                                  </option>
                                )}
                              </select>
                            ) : (
                              <span
                                className={`org-members-role-badge org-members-role-${memberRole}`}
                              >
                                {memberRole === "owner"
                                  ? t("orgMembers.roleOwner")
                                  : memberRole === "admin"
                                    ? t("orgMembers.roleAdmin")
                                    : t("orgMembers.roleMember")}
                              </span>
                            )}
                          </td>
                          <td>
                            {new Date(member.created_at).toLocaleDateString(
                              "fi-FI",
                            )}
                          </td>
                          <td>
                            <div className="flex gap-2 items-center">
                              {/* Lähetä kutsu uudelleen -nappi */}
                              {canInvite && !isCurrentUser && (
                                <Button
                                  variant="secondary"
                                  onClick={() =>
                                    handleResendInvite(member.auth_user_id)
                                  }
                                  className="text-[13px] py-1.5 px-3"
                                >
                                  {t("orgMembers.resendInvite")}
                                </Button>
                              )}
                              {/* Owner-roolia ei voi poistaa */}
                              {canRemove && !isCurrentUser && !isOwner && (
                                <Button
                                  variant="danger"
                                  onClick={() =>
                                    handleRemoveMember(member.auth_user_id)
                                  }
                                >
                                  {t("orgMembers.remove")}
                                </Button>
                              )}
                              {isCurrentUser && (
                                <span className="org-members-current-user-badge">
                                  {t("orgMembers.you")}
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrganizationMembersPage;
