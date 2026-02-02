import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import PageHeader from "../components/PageHeader";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import CarouselTemplateSelector from "../components/CarouselTemplateSelector";
import PlacidTemplatesList from "../components/PlacidTemplatesList";
import SocialMediaConnect from "../components/SocialMediaConnect";
import TimeoutSettings from "../components/TimeoutSettings";
import SimpleSocialConnect from "../components/SimpleSocialConnect";
import { useMixpostIntegration } from "../components/SocialMedia/hooks/useMixpostIntegration";
import { useStrategyStatus } from "../contexts/StrategyStatusContext";
import { getUserOrgId } from "../lib/getUserOrgId";
import SettingsIntegrationsTab from "../components/SettingsIntegrationsTab";
import VoiceSection from "../components/settings/VoiceSection";
import AccountTypeSection from "../components/settings/AccountTypeSection";
import UserInfoModal from "../components/UserInfoModal";

// CSS Module removed - styles moved to main.css

export default function SettingsPage() {
  const { user, organization } = useAuth();
  const { t } = useTranslation("common");
  const { refreshUserStatus, userStatus } = useStrategyStatus();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingOrgInfo, setIsEditingOrgInfo] = useState(false);
  const [isEditingPersonalInfo, setIsEditingPersonalInfo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [showEmailChange, setShowEmailChange] = useState(false);
  const [emailData, setEmailData] = useState({
    newEmail: "",
    confirmEmail: "",
  });
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailMessage, setEmailMessage] = useState("");
  const [userProfile, setUserProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoMessage, setLogoMessage] = useState("");
  const [logoDragActive, setLogoDragActive] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [showUserId, setShowUserId] = useState(false);
  const [showUserInfoModal, setShowUserInfoModal] = useState(false);
  const [orgMemberData, setOrgMemberData] = useState(null);

  // Mixpost-integration hook
  const {
    socialAccounts,
    savedSocialAccounts,
    fetchSocialAccounts,
    fetchSavedSocialAccounts,
    mixpostConfig,
  } = useMixpostIntegration();

  // Synkronoi sometilit Supabaseen
  const syncSocialAccountsToSupabase = async () => {
    if (!user?.id || syncInProgress) return;

    // Hae organisaation ID
    let orgUserId = null;
    if (organization?.id) {
      orgUserId = organization.id;
    } else {
      orgUserId = await getUserOrgId(user.id);
    }

    if (!orgUserId) {
      console.error(
        "Organisaation ID puuttuu, ei voida synkronoida sometilejä",
      );
      return;
    }

    setSyncInProgress(true);
    try {
      console.log("🔄 Synkronoidaan sometilejä Supabaseen...");

      // Hae olemassa olevat tilit Supabasesta
      const { data: existingAccounts } = await supabase
        .from("user_social_accounts")
        .select("id, mixpost_account_uuid, provider")
        .eq("user_id", orgUserId);

      // Luo Set Mixpost-tileistä (provider + mixpost_account_uuid)
      const mixpostAccountsSet = new Set(
        socialAccounts?.map((acc) => `${acc.provider}:${acc.id}`) || [],
      );

      // Luo Set olemassa olevista tileistä (provider + mixpost_account_uuid)
      const existingAccountsSet = new Set(
        existingAccounts?.map(
          (acc) => `${acc.provider}:${acc.mixpost_account_uuid}`,
        ) || [],
      );

      // Etsi uudet tilit joita ei ole Supabasessa
      const newAccounts =
        socialAccounts?.filter((account) => {
          const accountKey = `${account.provider}:${account.id}`;
          return !existingAccountsSet.has(accountKey);
        }) || [];

      // Etsi poistetut tilit (Supabasessa mutta ei Mixpostissa)
      // HUOM: Älä poista tilejä joiden account_data sisältää "blotato"
      const accountsToRemove =
        existingAccounts?.filter((account) => {
          const accountKey = `${account.provider}:${account.mixpost_account_uuid}`;
          const notInMixpost = !mixpostAccountsSet.has(accountKey);

          // Jos tili löytyy Mixpostista, ei poisteta
          if (!notInMixpost) return false;

          // TODO: Korvaa magic string tarkistus tietokannasta tulevalla boolean-kentällä
          // Tarkista onko tili merkitty sisäiseksi testitiliksi
          // Jos tietokannassa on is_internal_test_account tai vastaava kenttä, käytä sitä:
          // if (account.is_internal_test_account === true) return false
          //
          // Toistaiseksi käytetään turvallisempaa tapaa: tarkistetaan account_data-kentästä
          // mutta ilman magic stringiä. Jos tarvitaan suojattuja tilejä, lisää ne tietokantaan
          // boolean-kenttänä (esim. is_protected tai is_internal_test_account)
          const accountDataStr =
            typeof account.account_data === "string"
              ? account.account_data
              : JSON.stringify(account.account_data || {});

          // TODO: Poista tämä magic string -tarkistus kun tietokantaan on lisätty
          // is_internal_test_account tai vastaava boolean-kenttä
          if (accountDataStr.toLowerCase().includes("blotato")) {
            console.log(
              `🔒 Tiliä ${account.account_name} (${account.provider}) ei poisteta, koska se on merkitty suojatuksi`,
            );
            return false;
          }

          return true;
        }) || [];

      // Lisää uudet tilit Supabaseen
      if (newAccounts.length > 0) {
        console.log(`📝 Lisätään ${newAccounts.length} uutta tiliä Supabaseen`);

        // Hae käyttäjän auth ID
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        const accountsToInsert = newAccounts.map((account) => ({
          user_id: orgUserId,
          mixpost_account_uuid: account.id,
          provider: account.provider,
          account_name: account.name || account.username,
          username: account.username,
          profile_image_url:
            account.profile_image_url || account.image || account.picture,
          is_authorized: true,
          visibility: "public", // Oletuksena public (organisaation sisäinen)
          created_by: authUser?.id || null, // Tallenna kuka loi tilin
          account_data: account,
          last_synced_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        }));

        const { error: insertError } = await supabase
          .from("user_social_accounts")
          .upsert(accountsToInsert, {
            onConflict: "user_id,mixpost_account_uuid",
          });

        if (insertError) {
          console.error("❌ Virhe uusien tilien lisäämisessä:", insertError);
        }
      }

      // Poista tilit joita ei enää löydy Mixpostista
      if (accountsToRemove.length > 0) {
        console.log(
          `🗑️ Poistetaan ${accountsToRemove.length} tiliä joita ei enää löydy Mixpostista`,
        );

        const idsToRemove = accountsToRemove.map((acc) => acc.id);

        const { error: deleteError } = await supabase
          .from("user_social_accounts")
          .delete()
          .in("id", idsToRemove);

        if (deleteError) {
          console.error("❌ Virhe tilien poistamisessa:", deleteError);
        }
      }

      if (newAccounts.length === 0 && accountsToRemove.length === 0) {
        console.log("✅ Kaikki sometilit jo synkronoituna");
      } else {
        console.log("✅ Sometilit synkronoitu onnistuneesti");
      }

      // Päivitä tallennetut tilit
      await fetchSavedSocialAccounts();
    } catch (error) {
      console.error("❌ Virhe sometilien synkronoinnissa:", error);
    } finally {
      setSyncInProgress(false);
    }
  };

  // Hae käyttäjätiedot public.users taulusta
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.id) return;

      try {
        // Hae oikea user_id (organisaation ID kutsutuille käyttäjille)
        const userId = await getUserOrgId(user.id);

        if (!userId) {
          console.error("Error: User ID not found");
          setMessage(t("settings.profile.notFoundSupport"));
          setProfileLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", userId)
          .single();

        if (error) {
          console.error("Error fetching user profile:", error);
          setMessage(t("settings.profile.notFoundSupport"));
        } else {
          setUserProfile(data);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        setMessage(t("settings.profile.fetchError"));
      } finally {
        setProfileLoading(false);
      }
    };

    fetchUserProfile();
  }, [user?.id]);

  // Hae org_members tiedot kutsutuille käyttäjille
  useEffect(() => {
    const fetchOrgMemberData = async () => {
      if (!user?.id) return;

      try {
        const { data, error } = await supabase
          .from("org_members")
          .select("*")
          .eq("auth_user_id", user.id)
          .single();

        if (error) {
          if (error.code !== "PGRST116") {
            console.error("Error fetching org_member data:", error);
          }
          return;
        }

        setOrgMemberData(data);
      } catch (error) {
        console.error("Error fetching org_member data:", error);
      }
    };

    fetchOrgMemberData();
  }, [user?.id]);

  // Synkronoi sometilit kun ne on haettu Mixpostista
  useEffect(() => {
    if (socialAccounts !== null && user?.id) {
      syncSocialAccountsToSupabase();
    }
  }, [socialAccounts, user?.id]);

  // Tarkista onko käyttäjä tullut takaisin vahvistuslinkistä
  useEffect(() => {
    const emailChanged = searchParams.get("email");
    if (emailChanged === "changed") {
      setEmailMessage(t("settings.email.changeSuccess"));
      setShowEmailChange(false);
      setEmailData({ newEmail: "", confirmEmail: "" });
      // Poista parametri URL:sta
      setSearchParams({}, { replace: true });
      // Päivitä käyttäjätiedot - hae uudet tiedot
      const refreshUserData = async () => {
        if (user?.id) {
          try {
            // Hae uusi sähköpostiosoite Supabase Authista
            const { data: authData, error: authError } =
              await supabase.auth.getUser();
            if (authError) {
              console.error("Error fetching auth user:", authError);
              return;
            }

            if (authData?.user?.email) {
              const newEmail = authData.user.email;
              console.log("Email changed successfully:", newEmail);

              // Hae oikea user_id (organisaation ID kutsutuille käyttäjille)
              const userId = await getUserOrgId(user.id);

              if (userId) {
                // Päivitä users.contact_email kenttä uuteen sähköpostiosoitteeseen
                const { error: updateError } = await supabase
                  .from("users")
                  .update({
                    contact_email: newEmail,
                    updated_at: new Date().toISOString(),
                  })
                  .eq("id", userId);

                if (updateError) {
                  console.error("Error updating contact_email:", updateError);
                }
              }
            }

            // Päivitä käyttäjäprofiili
            const userId = await getUserOrgId(user.id);
            if (userId) {
              const { data: profileData, error: profileError } = await supabase
                .from("users")
                .select("*")
                .eq("id", userId)
                .single();

              if (profileError) {
                console.error("Error fetching user profile:", profileError);
              } else if (profileData) {
                setUserProfile(profileData);
              }
            }
          } catch (error) {
            console.error("Error refreshing user data:", error);
          }
        }
      };
      refreshUserData();
    }
  }, [searchParams, setSearchParams, user?.id]);

  // Käyttäjätiedot public.users taulusta
  // Kutsutut käyttäjät (member-rooli) näkevät vain henkilökohtaiset tiedot (sähköposti)
  // Organisaation tiedot näytetään erikseen
  // Owner ja admin näkevät kaikki tiedot ja voivat muokata tilejä
  const isInvitedUser = organization && organization.role === "member";
  const email = isInvitedUser
    ? user?.email || null
    : userProfile?.contact_email || user?.email || null;
  const name = isInvitedUser ? null : userProfile?.contact_person || null;
  const companyName = isInvitedUser
    ? organization?.data?.company_name || null
    : userProfile?.company_name || null;
  const industry = isInvitedUser
    ? organization?.data?.industry || null
    : userProfile?.industry || null;

  // Muokattavat kentät
  const [formData, setFormData] = useState({
    contact_person: name || "",
    company_name: companyName || "",
    contact_email: email || "",
    industry: industry || "",
  });

  useEffect(() => {
    setFormData({
      contact_person: name || "",
      company_name: companyName || "",
      contact_email: email || "",
      industry: industry || "",
    });
  }, [name, companyName, email, industry]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Logo-tiedoston validointi ja käsittely
  const validateAndSetLogoFile = (file) => {
    if (!file) return false;

    // Tarkista tiedostotyyppi
    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
      "image/svg+xml",
    ];
    if (!allowedTypes.includes(file.type)) {
      setLogoMessage(t("settings.logo.validationTypes"));
      return false;
    }

    // Tarkista tiedostokoko (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setLogoMessage(t("settings.logo.validationSize"));
      return false;
    }

    setLogoFile(file);
    setLogoMessage("");

    // Luo esikatselu
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result);
    };
    reader.readAsDataURL(file);
    return true;
  };

  // Logo-tiedoston käsittely input-kentästä
  const handleLogoFileChange = (e) => {
    const file = e.target.files?.[0];
    validateAndSetLogoFile(file);
  };

  // Drag & Drop -käsittelijät
  const handleLogoDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setLogoDragActive(true);
    } else if (e.type === "dragleave") {
      setLogoDragActive(false);
    }
  };

  const handleLogoDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setLogoDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      validateAndSetLogoFile(file);
    }
  };

  // Lataa logo Supabase Storageen
  const handleLogoUpload = async () => {
    if (!logoFile || !user?.id) return;

    setLogoUploading(true);
    setLogoMessage("");

    try {
      // Luo uniikki tiedostonimi
      const fileExt = logoFile.name.split(".").pop();
      const fileName = `${user.id}/logo.${fileExt}`;

      // Lataa tiedosto Supabase Storageen
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("user-logos")
        .upload(fileName, logoFile, {
          upsert: true, // Korvaa vanha jos on olemassa
          contentType: logoFile.type,
        });

      if (uploadError) throw uploadError;

      // Hae julkinen URL
      const { data: urlData } = supabase.storage
        .from("user-logos")
        .getPublicUrl(fileName);

      const logoUrl = urlData.publicUrl;

      // Hae oikea user_id (organisaation ID kutsutuille käyttäjille)
      const userId = await getUserOrgId(user.id);

      if (!userId) {
        throw new Error(t("settings.messages.userNotFound"));
      }

      // Päivitä users-tauluun
      const { error: updateError } = await supabase
        .from("users")
        .update({ logo_url: logoUrl, updated_at: new Date().toISOString() })
        .eq("id", userId);

      if (updateError) throw updateError;

      setLogoMessage(t("settings.logo.uploadSuccess"));
      setLogoFile(null);
      setLogoPreview(null);

      // Päivitä käyttäjäprofiili
      const { data: updatedUser } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (updatedUser) {
        setUserProfile(updatedUser);
      }

      // Päivitä sivu jotta logo näkyy sidebarissa
      window.location.reload();
    } catch (error) {
      console.error("Logo upload error:", error);
      setLogoMessage(`Virhe: ${error.message}`);
    } finally {
      setLogoUploading(false);
    }
  };

  // Poista logo
  const handleLogoRemove = async () => {
    if (!user?.id) return;

    setLogoUploading(true);
    setLogoMessage("");

    try {
      // Hae oikea user_id (organisaation ID kutsutuille käyttäjille)
      const userId = await getUserOrgId(user.id);

      if (!userId) {
        throw new Error(t("settings.messages.userNotFound"));
      }

      // Päivitä users-tauluun
      const { error: updateError } = await supabase
        .from("users")
        .update({ logo_url: null, updated_at: new Date().toISOString() })
        .eq("id", userId);

      if (updateError) throw updateError;

      setLogoMessage(t("settings.logo.removeSuccess"));
      setLogoFile(null);
      setLogoPreview(null);

      // Päivitä käyttäjäprofiili
      const { data: updatedUser } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (updatedUser) {
        setUserProfile(updatedUser);
      }

      // Päivitä sivu jotta muutos näkyy sidebarissa
      window.location.reload();
    } catch (error) {
      console.error("Logo remove error:", error);
      setLogoMessage(`Virhe: ${error.message}`);
    } finally {
      setLogoUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;

    // Kutsutut käyttäjät eivät voi muokata organisaation tietoja
    if (isInvitedUser) {
      setMessage(t("settings.messages.invitedUserRestriction"));
      setIsEditing(false);
      return;
    }

    if (!userProfile?.id) return;

    setLoading(true);
    setMessage("");

    try {
      const { error } = await supabase
        .from("users")
        .update({
          contact_person: formData.contact_person,
          company_name: formData.company_name,
          contact_email: formData.contact_email,
          industry: formData.industry || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userProfile.id);

      if (error) {
        setMessage(`${t("settings.common.error")}: ${error.message}`);
      } else {
        setMessage(t("settings.profile.updateSuccess"));
        setIsEditing(false);
        // Päivitä käyttäjätiedot
        const { data } = await supabase
          .from("users")
          .select("*")
          .eq("id", userProfile.id)
          .single();
        if (data) {
          setUserProfile(data);
        }
      }
    } catch (error) {
      setMessage(`${t("settings.common.error")}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      contact_person: name || "",
      company_name: companyName || "",
      contact_email: email || "",
      industry: industry || "",
    });
    setIsEditing(false);
    setMessage("");
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordSave = async () => {
    if (!user) return;

    // Validoi salasanat
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage(t("settings.password.mismatch"));
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordMessage(t("settings.password.tooShort"));
      return;
    }

    if (!passwordData.currentPassword) {
      setPasswordMessage(t("settings.password.currentRequired"));
      return;
    }

    setPasswordLoading(true);
    setPasswordMessage("");

    try {
      // Ensin tarkista nykyinen salasana
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: passwordData.currentPassword,
      });

      if (signInError) {
        setPasswordMessage(t("settings.password.currentWrong"));
        return;
      }

      // Jos nykyinen salasana on oikein, vaihda salasana
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });

      if (error) {
        setPasswordMessage(`${t("settings.common.error")}: ${error.message}`);
      } else {
        setPasswordMessage(t("settings.password.changed"));
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setShowPasswordChange(false);
      }
    } catch (error) {
      setPasswordMessage(`${t("settings.common.error")}: ${error.message}`);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handlePasswordCancel = () => {
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setShowPasswordChange(false);
    setPasswordMessage("");
  };

  const handleEmailChangeInput = (e) => {
    const { name, value } = e.target;
    setEmailData((prev) => ({ ...prev, [name]: value }));
  };

  const isValidEmail = (value) => {
    return /[^@\s]+@[^@\s]+\.[^@\s]+/.test(value);
  };

  const handleEmailSave = async () => {
    if (!user) return;

    // Validoi sähköpostit
    if (emailData.newEmail !== emailData.confirmEmail) {
      setEmailMessage(t("settings.email.mismatch"));
      return;
    }

    if (!isValidEmail(emailData.newEmail)) {
      setEmailMessage(t("settings.email.invalid"));
      return;
    }

    // Tarkista ettei uusi sähköposti ole sama kuin nykyinen
    if (emailData.newEmail === user.email) {
      setEmailMessage(t("settings.email.sameAsOld"));
      return;
    }

    setEmailLoading(true);
    setEmailMessage("");

    try {
      // Supabase lähettää vahvistuslinkin uuteen sähköpostiin
      const { data, error } = await supabase.auth.updateUser(
        { email: emailData.newEmail },
        {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      );

      if (error) {
        console.error("Email change error:", error);
        setEmailMessage(`Virhe: ${error.message}`);
      } else {
        // Onnistui - vahvistuslinkki lähetetään uuteen sähköpostiin
        setEmailMessage(
          t("settings.email.verificationSent", { email: emailData.newEmail }),
        );
        // Tyhjennä lomakkeen kentät, mutta jätä lomake näkyviin jotta käyttäjä näkee viestin
        setEmailData({ newEmail: "", confirmEmail: "" });
      }
    } catch (err) {
      console.error("Email change exception:", err);
      setEmailMessage(`Virhe: ${err.message}`);
    } finally {
      setEmailLoading(false);
    }
  };

  const handleEmailCancel = () => {
    setEmailData({ newEmail: "", confirmEmail: "" });
    setShowEmailChange(false);
    setEmailMessage("");
  };

  return (
    <>
      <div className="settings-container">
        <div className="settings-header">
          <h2 className="settings-page-title">{t("settings.title")}</h2>
        </div>

        {/* Tab-napit */}
        <div className="settings-tabs">
          <button
            className={`settings-tab ${activeTab === "profile" ? "settings-tab-active" : ""}`}
            onClick={() => setActiveTab("profile")}
          >
            {t("ui.tabs.profile")}
          </button>
          <button
            className={`settings-tab ${activeTab === "avatar" ? "settings-tab-active" : ""}`}
            onClick={() => setActiveTab("avatar")}
          >
            {t("ui.tabs.avatarVoice")}
          </button>
          <button
            className={`settings-tab ${activeTab === "carousel" ? "settings-tab-active" : ""}`}
            onClick={() => setActiveTab("carousel")}
          >
            {t("ui.tabs.carousels")}
          </button>
          <button
            className={`settings-tab ${activeTab === "features" ? "settings-tab-active" : ""}`}
            onClick={() => setActiveTab("features")}
          >
            {t("ui.tabs.features")}
          </button>
          <button
            className={`settings-tab ${activeTab === "security" ? "settings-tab-active" : ""}`}
            onClick={() => setActiveTab("security")}
          >
            {t("ui.tabs.security")}
          </button>
        </div>

        {/* Profiili-tab */}
        {activeTab === "profile" && (
          <div className="settings-bentogrid">
            {/* Vasen sarake: Loogisesti jaettu kortteihin */}
            {profileLoading ? (
              <div className="settings-card">
                <div className="settings-center-loading">
                  <div className="settings-loading-text">
                    {t("settings.profile.loading")}
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* 1. Yrityksen Logo -kortti (vasemmalla ylhäällä) */}
                {!isInvitedUser && (
                  <div
                    className="settings-card settings-card-no-padding settings-grid-col-1 settings-grid-row-1"
                  >
                    <div className="settings-card-header">
                      <h3>{t("settings.logo.title")}</h3>
                    </div>
                    <div className="settings-card-content">
                      <div className="settings-logo-container">
                        {/* Nykyinen logo */}
                        {userProfile?.logo_url && !logoPreview && (
                          <div className="settings-current-logo-section">
                            <p className="settings-current-logo-label">
                              {t("settings.logo.currentLogo")}
                            </p>
                            <img
                              src={userProfile.logo_url}
                              alt="Company Logo"
                              className="settings-current-logo-image"
                            />
                            <button
                              onClick={handleLogoRemove}
                              disabled={logoUploading}
                              className="settings-btn settings-btn-neutral"
                            >
                              {logoUploading
                                ? t("ui.buttons.removing")
                                : t("ui.buttons.removeLogo")}
                            </button>
                          </div>
                        )}

                        {/* Drag & Drop alue */}
                        <div
                          className={`settings-logo-drop-zone ${logoDragActive ? "active" : ""}`}
                          onDragEnter={handleLogoDrag}
                          onDragLeave={handleLogoDrag}
                          onDragOver={handleLogoDrag}
                          onDrop={handleLogoDrop}
                        >
                          {logoPreview ? (
                            <div className="settings-logo-preview-section">
                              <img
                                src={logoPreview}
                                alt="Logo Preview"
                                className="settings-logo-preview-image"
                              />
                              <p className="settings-logo-preview-text">
                                {t("settings.logo.logoSelected")}
                              </p>
                              <div className="settings-logo-preview-actions">
                                <button
                                  onClick={handleLogoUpload}
                                  disabled={logoUploading}
                                  className="settings-btn settings-btn-primary"
                                >
                                  {logoUploading
                                    ? t("ui.buttons.loading")
                                    : t("settings.buttons.save")}
                                </button>
                                <button
                                  onClick={() => {
                                    setLogoFile(null);
                                    setLogoPreview(null);
                                    setLogoMessage("");
                                  }}
                                  className="settings-btn settings-btn-neutral"
                                >
                                  {t("settings.buttons.cancel")}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="settings-upload-icon-wrapper">
                                <svg
                                  width="20"
                                  height="20"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
                                    stroke="#ff6600"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                  <path
                                    d="M17 8l-5-5-5 5"
                                    stroke="#ff6600"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                  <path
                                    d="M12 3v12"
                                    stroke="#ff6600"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </div>
                              <p className="settings-upload-text">
                                {logoDragActive
                                  ? t("settings.logo.dropHere")
                                  : t("settings.logo.dragHere")}
                              </p>
                              <p className="settings-upload-subtext">
                                {t("ui.labels.or")}
                              </p>
                              <label
                                className="settings-btn settings-btn-secondary"
                              >
                                {t("ui.buttons.selectFile")}
                                <input
                                  type="file"
                                  accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                                  onChange={handleLogoFileChange}
                                  className="hidden"
                                />
                              </label>
                            </>
                          )}
                        </div>
                      </div>

                      {logoMessage && (
                        <p
                          className={`settings-logo-message ${
                            logoMessage.includes("Virhe") ||
                            logoMessage.includes("liian") ||
                            logoMessage.includes("Sallitut")
                              ? "settings-logo-message-error"
                              : "settings-logo-message-success"
                          }`}
                        >
                          {logoMessage}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* 2. Käyttäjätiedot -kortti (vasemmalla logon alle) */}
                <div
                  className="settings-card settings-card-no-padding settings-grid-col-1 settings-grid-row-2"
                >
                  <div className="settings-card-header">
                    <h3>
                      {isInvitedUser
                        ? t("settings.personalInfo.title")
                        : t("settings.profile.title")}
                    </h3>
                  </div>

                  <div className="settings-card-content">
                    {/* Organisaation tiedot - kaikille käyttäjille */}
                    <div
                      className="settings-info-box"
                    >
                      <div className="settings-info-header">
                        <h4 className="settings-info-title">
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#ff6600"
                            strokeWidth="2"
                          >
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                            <polyline points="9 22 9 12 15 12 15 22" />
                          </svg>
                          {t("settings.userInfo.organizationInfo")}
                        </h4>
                        {!isInvitedUser && (
                          <>
                            {!isEditingOrgInfo ? (
                              <button
                                onClick={() => setIsEditingOrgInfo(true)}
                                className="settings-btn settings-btn-secondary settings-btn-sm"
                              >
                                {t("settings.buttons.edit")}
                              </button>
                            ) : (
                              <div className="settings-flex-gap-sm">
                                <button
                                  onClick={async () => {
                                    await handleSave();
                                    setIsEditingOrgInfo(false);
                                  }}
                                  disabled={loading}
                                  className="settings-btn settings-btn-primary settings-btn-sm"
                                >
                                  {loading
                                    ? t("settings.buttons.saving")
                                    : t("settings.buttons.save")}
                                </button>
                                <button
                                  onClick={() => {
                                    setIsEditingOrgInfo(false);
                                    handleCancel();
                                  }}
                                  className="settings-btn settings-btn-neutral settings-btn-sm"
                                >
                                  {t("settings.buttons.cancel")}
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {!isEditingOrgInfo ? (
                        <div className="settings-info-list">
                          <div className="settings-info-row">
                            <span className="settings-text-sm-gray">
                              {t("settings.fields.company")}
                            </span>
                            <span className="settings-info-value">
                              {userProfile?.company_name ||
                                t("settings.common.notSet")}
                            </span>
                          </div>
                          <div className="settings-info-row">
                            <span className="settings-text-sm-gray">
                              {t("settings.fields.industry")}
                            </span>
                            <span className="settings-info-value">
                              {userProfile?.industry ||
                                t("settings.common.notSet")}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="settings-form-group">
                            <label>{t("settings.fields.company")}</label>
                            <input
                              type="text"
                              value={
                                userProfile?.company_name ||
                                t("settings.common.notSet")
                              }
                              readOnly
                              className="settings-form-input settings-readonly"
                            />
                          </div>
                          <div className="settings-form-group">
                            <label>{t("settings.fields.industry")}</label>
                            <input
                              type="text"
                              name="industry"
                              value={formData.industry}
                              onChange={handleInputChange}
                              className="settings-form-input"
                              placeholder={t("settings.fields.industry")}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Käyttäjän tiedot - kaikille käyttäjille */}
                    <div className="settings-user-info-box">
                      <div className="settings-info-header">
                        <h4 className="settings-info-title">
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#0369a1"
                            strokeWidth="2"
                          >
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>
                          {t("settings.userInfo.personalInfo")}
                        </h4>
                        {!isInvitedUser && (
                          <>
                            {!isEditingPersonalInfo ? (
                              <button
                                onClick={() => setIsEditingPersonalInfo(true)}
                                className="settings-btn settings-btn-secondary settings-btn-sm"
                              >
                                {t("settings.buttons.edit")}
                              </button>
                            ) : (
                              <div className="settings-flex-gap-sm">
                                <button
                                  onClick={async () => {
                                    await handleSave();
                                    setIsEditingPersonalInfo(false);
                                  }}
                                  disabled={loading}
                                  className="settings-btn settings-btn-primary settings-btn-sm"
                                >
                                  {loading
                                    ? t("settings.buttons.saving")
                                    : t("settings.buttons.save")}
                                </button>
                                <button
                                  onClick={() => {
                                    setIsEditingPersonalInfo(false);
                                    handleCancel();
                                  }}
                                  className="settings-btn settings-btn-neutral settings-btn-sm"
                                >
                                  {t("settings.buttons.cancel")}
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {!isEditingPersonalInfo ? (
                        <div className="settings-info-list">
                          {orgMemberData?.name && (
                            <div className="settings-info-row">
                              <span className="settings-text-sm-gray">
                                {t("settings.fields.name")}
                              </span>
                              <span className="settings-info-value">
                                {orgMemberData.name}
                              </span>
                            </div>
                          )}
                          <div className="settings-info-row">
                            <span className="settings-text-sm-gray">
                              {t("settings.fields.email")}
                            </span>
                            <span className="settings-info-value">
                              {orgMemberData?.email ||
                                user?.email ||
                                t("settings.common.notAvailable")}
                            </span>
                          </div>
                          <div className="settings-info-row">
                            <span className="settings-text-sm-gray">
                              {t("ui.labels.role")}
                            </span>
                            <span className="settings-role-badge">
                              {orgMemberData?.role === "owner"
                                ? t("ui.labels.owner")
                                : orgMemberData?.role === "admin"
                                  ? t("ui.labels.admin")
                                  : orgMemberData?.role === "member"
                                    ? t("ui.labels.member")
                                    : organization?.role ||
                                      t("ui.labels.member")}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="settings-form-group">
                            <label>{t("settings.fields.name")}</label>
                            <input
                              type="text"
                              name="contact_person"
                              value={formData.contact_person}
                              onChange={handleInputChange}
                              className="settings-form-input"
                              placeholder={t("settings.fields.namePlaceholder")}
                            />
                          </div>
                          <div className="settings-form-group">
                            <label>{t("settings.fields.email")}</label>
                            <input
                              type="email"
                              name="contact_email"
                              value={formData.contact_email}
                              onChange={handleInputChange}
                              className="settings-form-input"
                              placeholder={t(
                                "settings.fields.emailPlaceholder",
                              )}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Näytä lisätiedot -nappi - kaikille käyttäjille */}
                    <button
                      onClick={() => setShowUserInfoModal(true)}
                      className="settings-btn settings-btn-secondary settings-full-width settings-mb-4"
                    >
                      {t("settings.userInfo.showDetails")}
                    </button>

                    {message && (
                      <div
                        className={`settings-message ${message.includes(t("settings.common.error")) ? "settings-message-error" : "settings-message-success"}`}
                      >
                        {message}
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Oikea sarake: Account-asetukset */}
                {!isInvitedUser && (
                  <div className="settings-grid-row-span settings-grid-col-2">
                    <AccountTypeSection
                      userProfile={userProfile}
                      onProfileUpdate={(updatedProfile) =>
                        setUserProfile(updatedProfile)
                      }
                      isInvitedUser={isInvitedUser}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Avatar & Ääni-tab */}
        {activeTab === "avatar" && (
          <div className="settings-bentogrid">
            <div className="settings-card settings-grid-col-span-full">
              <div className="settings-avatar-voice-grid">
                {/* Avatar-kuvat */}
                <div className="settings-avatar-voice-section">
                  <h2 className="settings-section-title">
                    {t("settings.avatar.title")}
                  </h2>
                  <div className="settings-coming-soon-box">
                    {/* Dekoratiivinen gradient */}
                    <div className="settings-coming-soon-gradient" />

                    {/* Sisältö */}
                    <div className="settings-coming-soon-content">
                      <svg
                        width="48"
                        height="48"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="2"
                        className="settings-coming-soon-icon"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      <div className="settings-coming-soon-title">
                        {t("settings.avatar.comingSoon")}
                      </div>
                      <div className="settings-coming-soon-text">
                        {t("settings.avatar.workInProgress")}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ääniklooni */}
                <div className="settings-avatar-voice-section">
                  <VoiceSection companyId={userProfile?.company_id || null} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Karusellit-tab */}
        {activeTab === "carousel" && (
          <div className="settings-bentogrid">
            <div className="settings-card settings-grid-col-span-full">
              <CarouselTemplateSelector />
              <PlacidTemplatesList />
            </div>
          </div>
        )}

        {/* Ominaisuudet-tab */}
        {activeTab === "features" && (
          <div className="settings-bentogrid">
            <div className="settings-card settings-grid-col-span-full">
              <SettingsIntegrationsTab />
            </div>
          </div>
        )}

        {/* Turvallisuus-tab */}
        {activeTab === "security" && (
          <div className="settings-bentogrid">
            {/* Turvallisuus -kortti (Salasana ja Sähköposti) */}
            <div className={`settings-card settings-card-no-padding`}>
              <div className="settings-card-header">
                <h3>{t("settings.security.title")}</h3>
              </div>
              <div className="settings-card-content">
                {/* Salasanan vaihto */}
                <div>
                  <div className="settings-security-header">
                    <h4 className="settings-security-title">
                      {t("settings.password.title")}
                    </h4>
                    {!showPasswordChange ? (
                      <button
                        onClick={() => setShowPasswordChange(true)}
                        className="settings-btn settings-btn-secondary"
                      >
                        {t("settings.buttons.changePassword")}
                      </button>
                    ) : (
                      <div className="settings-flex-gap-sm">
                        <button
                          onClick={handlePasswordSave}
                          disabled={passwordLoading}
                          className="settings-btn settings-btn-primary"
                        >
                          {passwordLoading
                            ? t("settings.password.saving")
                            : t("settings.password.save")}
                        </button>
                        <button
                          onClick={handlePasswordCancel}
                          className="settings-btn settings-btn-neutral"
                        >
                          {t("settings.password.cancel")}
                        </button>
                      </div>
                    )}
                  </div>

                  {passwordMessage && (
                    <div
                      className={`settings-message settings-mb-3 ${passwordMessage.includes("Virhe") ? "settings-message-error" : "settings-message-success"}`}
                    >
                      {passwordMessage}
                    </div>
                  )}

                  {showPasswordChange && (
                    <div>
                      <div className="settings-form-group">
                        <label>{t("settings.password.current")}</label>
                        <input
                          type="password"
                          name="currentPassword"
                          value={passwordData.currentPassword}
                          onChange={handlePasswordChange}
                          className="settings-form-input"
                          placeholder={t(
                            "settings.password.currentPlaceholder",
                          )}
                        />
                      </div>

                      <div className="settings-form-group">
                        <label>{t("settings.password.new")}</label>
                        <input
                          type="password"
                          name="newPassword"
                          value={passwordData.newPassword}
                          onChange={handlePasswordChange}
                          className="settings-form-input"
                          placeholder={t("settings.password.newPlaceholder")}
                        />
                      </div>

                      <div className="settings-form-group">
                        <label>{t("settings.password.confirm")}</label>
                        <input
                          type="password"
                          name="confirmPassword"
                          value={passwordData.confirmPassword}
                          onChange={handlePasswordChange}
                          className="settings-form-input"
                          placeholder={t(
                            "settings.password.confirmPlaceholder",
                          )}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="settings-divider"></div>

                {/* Sähköpostin vaihto */}
                <div>
                  <div className="settings-security-header">
                    <h4 className="settings-security-title">
                      {t("settings.email.title")}
                    </h4>
                    {!showEmailChange ? (
                      <button
                        onClick={() => setShowEmailChange(true)}
                        className="settings-btn settings-btn-secondary"
                      >
                        {t("settings.buttons.changeEmail")}
                      </button>
                    ) : (
                      <div className="settings-flex-gap-sm">
                        <button
                          onClick={handleEmailSave}
                          disabled={emailLoading}
                          className="settings-btn settings-btn-primary"
                        >
                          {emailLoading
                            ? t("settings.email.saving")
                            : t("settings.email.save")}
                        </button>
                        <button
                          onClick={handleEmailCancel}
                          className="settings-btn settings-btn-neutral"
                        >
                          {t("settings.email.cancel")}
                        </button>
                      </div>
                    )}
                  </div>

                  {emailMessage && (
                    <div
                      className={`settings-email-message ${
                        emailMessage.includes("Virhe") || emailMessage.includes("sama kuin")
                          ? "error"
                          : emailMessage.includes("Vahvistuslinkki")
                            ? "info"
                            : "success"
                      }`}
                    >
                      {emailMessage.includes("Vahvistuslinkki") ? (
                        <div>
                          <div className="settings-email-header">
                            <svg
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                            </svg>
                            {t("settings.email.verificationTitle")}
                          </div>
                          <div className="settings-email-body">
                            {emailMessage.split(".")[1]?.trim()}
                          </div>
                          <div className="settings-email-hint">
                            {t("settings.email.checkSpam")}
                          </div>
                        </div>
                      ) : (
                        emailMessage
                      )}
                    </div>
                  )}

                  {showEmailChange && (
                    <div>
                      <div className="settings-form-group">
                        <label>{t("settings.email.new")}</label>
                        <input
                          type="email"
                          name="newEmail"
                          value={emailData.newEmail}
                          onChange={handleEmailChangeInput}
                          className="settings-form-input"
                          placeholder={t("settings.email.newPlaceholder")}
                        />
                      </div>
                      <div className="settings-form-group">
                        <label>{t("settings.email.confirm")}</label>
                        <input
                          type="email"
                          name="confirmEmail"
                          value={emailData.confirmEmail}
                          onChange={handleEmailChangeInput}
                          className="settings-form-input"
                          placeholder={t("settings.email.confirmPlaceholder")}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sessio-asetukset -kortti */}
            <div className={`settings-card settings-card-no-padding`}>
              <div className="settings-card-header">
                <h3>{t("settings.security.sessionSettings")}</h3>
              </div>
              <div className="settings-card-content">
                <TimeoutSettings />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* UserInfoModal kaikille käyttäjille */}
      <UserInfoModal
        isOpen={showUserInfoModal}
        onClose={() => setShowUserInfoModal(false)}
        organizationData={userProfile}
        memberData={{
          name: orgMemberData?.name || null,
          email: orgMemberData?.email || user?.email,
          role: orgMemberData?.role || organization?.role || "owner",
          created_at: orgMemberData?.created_at,
          userId: orgMemberData?.id || null,
        }}
      />
    </>
  );
}
