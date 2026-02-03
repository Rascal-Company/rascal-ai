import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [inviteData, setInviteData] = useState(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [settingPassword, setSettingPassword] = useState(false);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Tarkista onko token_hash parametrit URL:ssa
        const token_hash = searchParams.get("token_hash");
        const type = searchParams.get("type");

        if (token_hash && type) {
          // Verify OTP kun tulee email linkistä (signup, recovery, email_change, invite, jne.)
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash,
            type: type,
          });

          if (error) {
            console.error("Error verifying OTP:", error.message);
            navigate("/signin?error=" + encodeURIComponent(error.message));
            return;
          }

          if (data.session && data.user) {
            // Jos tulee kutsulinkistä (type === 'invite'), tarkista onko salasana asetettu
            if (type === "invite") {
              // Tarkista onko käyttäjällä salasana
              // Uudet käyttäjät eivät yleensä ole vielä asettaneet salasanaa
              // Tarkistetaan onko käyttäjä juuri luotu (ei ole vielä vahvistanut sähköpostia tai asettanut salasanaa)
              const needsPassword =
                !data.user.email_confirmed_at || !data.user.confirmed_at;

              if (needsPassword) {
                // Näytä salasanan asettamislomake
                setShowPasswordForm(true);
                setLoading(false);
                return;
              }

              // Jos salasana on jo asetettu, hae organisaatiotiedot ja näytä kutsun hyväksymismodaali
              try {
                const { data: orgMember, error: orgError } = await supabase
                  .from("org_members")
                  .select("org_id, role, users(company_name, contact_email)")
                  .eq("auth_user_id", data.user.id)
                  .maybeSingle();

                if (!orgError && orgMember) {
                  setInviteData({
                    orgName: orgMember.users?.company_name || "Organisaatio",
                    role: orgMember.role,
                    orgId: orgMember.org_id,
                  });
                  setShowInviteModal(true);
                  setLoading(false);
                  return;
                }
              } catch (err) {
                console.error("Error fetching organization data:", err);
              }

              // Jos organisaatiotietoja ei löydy, ohjaa dashboardiin
              navigate("/select");
              return;
            }

            // Sähköpostin vaihdon jälkeen ohjaa settings-sivulle
            if (type === "email_change") {
              navigate("/settings?email=changed");
            } else {
              navigate("/select");
            }
            return;
          }
        }

        // Fallback: tarkista onko sessio jo olemassa
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Error during auth callback:", error.message);
          navigate("/signin?error=" + encodeURIComponent(error.message));
        } else if (data.session) {
          navigate("/select");
        } else {
          navigate("/signin");
        }
      } catch (error) {
        console.error("Unexpected error:", error);
        navigate(
          "/signin?error=" + encodeURIComponent("Odottamaton virhe tapahtui"),
        );
      } finally {
        setLoading(false);
      }
    };

    handleAuthCallback();
  }, [navigate, searchParams]);

  const handleSetPassword = async (e) => {
    e.preventDefault();
    setPasswordError("");

    // Validoi salasanat
    if (password !== confirmPassword) {
      setPasswordError("Salasanat eivät täsmää");
      return;
    }

    if (password.length < 6) {
      setPasswordError("Salasanan tulee olla vähintään 6 merkkiä pitkä");
      return;
    }

    setSettingPassword(true);

    try {
      // Aseta salasana
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        setPasswordError(error.message);
        setSettingPassword(false);
        return;
      }

      // Salasana asetettu onnistuneesti, hae organisaatiotiedot ja näytä kutsun hyväksymismodaali
      try {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();

        if (currentUser) {
          const { data: orgMember, error: orgError } = await supabase
            .from("org_members")
            .select("org_id, role, users(company_name, contact_email)")
            .eq("auth_user_id", currentUser.id)
            .maybeSingle();

          if (!orgError && orgMember) {
            setInviteData({
              orgName: orgMember.users?.company_name || "Organisaatio",
              role: orgMember.role,
              orgId: orgMember.org_id,
            });
            setShowPasswordForm(false);
            setShowInviteModal(true);
            setSettingPassword(false);
            return;
          }
        }
      } catch (err) {
        console.error(
          "Error fetching organization data after password set:",
          err,
        );
      }

      // Jos organisaatiotietoja ei löydy, ohjaa dashboardiin
      setShowPasswordForm(false);
      navigate("/select");
    } catch (error) {
      console.error("Error setting password:", error);
      setPasswordError("Odottamaton virhe tapahtui");
    } finally {
      setSettingPassword(false);
    }
  };

  const handleAcceptInvite = async () => {
    // Kutsu on jo hyväksytty kun käyttäjä klikkasi linkkiä
    // Vain vahvistetaan ja ohjataan dashboardiin
    setShowInviteModal(false);
    navigate("/select");
  };

  if (loading && !showInviteModal && !showPasswordForm) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Käsitellään kirjautumista...</p>
        </div>
      </div>
    );
  }

  if (showPasswordForm) {
    return (
      <div className="invite-modal-overlay">
        <div className="invite-modal">
          <div className="invite-modal-header">
            <h2>Aseta salasana</h2>
          </div>
          <div className="invite-modal-content">
            <p>Aseta salasana tilillesi jatkaaksesi:</p>
            <form onSubmit={handleSetPassword} className="invite-password-form">
              <div className="invite-form-group">
                <label htmlFor="password" className="invite-label">
                  Salasana
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="invite-input"
                  placeholder="Vähintään 6 merkkiä"
                  autoComplete="new-password"
                />
              </div>
              <div className="invite-form-group">
                <label htmlFor="confirmPassword" className="invite-label">
                  Vahvista salasana
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="invite-input"
                  placeholder="Vahvista salasana"
                  autoComplete="new-password"
                />
              </div>
              {passwordError && (
                <div className="invite-error">{passwordError}</div>
              )}
              <div className="invite-modal-footer">
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={settingPassword}
                >
                  {settingPassword ? "Asetetaan..." : "Aseta salasana"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (showInviteModal && inviteData) {
    return (
      <div className="invite-modal-overlay">
        <div className="invite-modal">
          <div className="invite-modal-header">
            <h2>🎉 Kutsu organisaatioon</h2>
          </div>
          <div className="invite-modal-content">
            <p>Sinut on kutsuttu organisaatioon:</p>
            <div className="invite-org-info">
              <h3>{inviteData.orgName}</h3>
              <p className="invite-role">
                Rooli:{" "}
                <strong>
                  {inviteData.role === "owner"
                    ? "Omistaja"
                    : inviteData.role === "admin"
                      ? "Admin"
                      : "Jäsen"}
                </strong>
              </p>
            </div>
            <p className="invite-description">
              Olet nyt jäsenenä tässä organisaatiossa. Voit aloittaa käytön
              välittömästi!
            </p>
          </div>
          <div className="invite-modal-footer">
            <button className="btn-primary" onClick={handleAcceptInvite}>
              Jatka dashboardiin
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
