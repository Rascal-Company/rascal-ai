import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import CarouselTemplateSelector from "../components/CarouselTemplateSelector";
import PlacidTemplatesList from "../components/PlacidTemplatesList";
import TimeoutSettings from "../components/TimeoutSettings";
import { useMixpostIntegration } from "../components/SocialMedia/hooks/useMixpostIntegration";
import { getUserOrgId } from "../lib/getUserOrgId";
import SettingsIntegrationsTab from "../components/SettingsIntegrationsTab";
import VoiceSection from "../components/settings/VoiceSection";
import AccountTypeSection from "../components/settings/AccountTypeSection";
import UserInfoModal from "../components/UserInfoModal";

const SETTINGS_TABS = new Set([
  "profile",
  "avatar",
  "carousel",
  "features",
  "security",
]);

export default function SettingsPage() {
  const { user, organization } = useAuth();
  const { t } = useTranslation("common");
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
  const [activeTab, setActiveTab] = useState(() => {
    const tabFromUrl = searchParams.get("tab");
    return SETTINGS_TABS.has(tabFromUrl) ? tabFromUrl : "profile";
  });
  const [showUserInfoModal, setShowUserInfoModal] = useState(false);
  const [orgMemberData, setOrgMemberData] = useState(null);

  const { socialAccounts, fetchSavedSocialAccounts } = useMixpostIntegration();

  const syncSocialAccountsToSupabase = async () => {
    if (!user?.id || syncInProgress) return;

    let orgUserId = null;
    if (organization?.id) {
      orgUserId = organization.id;
    } else {
      orgUserId = await getUserOrgId(user.id);
    }

    if (!orgUserId) {
      console.error("Organization ID missing, cannot sync social accounts");
      return;
    }

    setSyncInProgress(true);
    try {
      const { data: existingAccounts } = await supabase
        .from("user_social_accounts")
        .select("id, mixpost_account_uuid, provider")
        .eq("user_id", orgUserId);

      const mixpostAccountsSet = new Set(
        socialAccounts?.map((acc) => `${acc.provider}:${acc.id}`) || [],
      );

      const existingAccountsSet = new Set(
        existingAccounts?.map(
          (acc) => `${acc.provider}:${acc.mixpost_account_uuid}`,
        ) || [],
      );

      const newAccounts =
        socialAccounts?.filter((account) => {
          const accountKey = `${account.provider}:${account.id}`;
          return !existingAccountsSet.has(accountKey);
        }) || [];

      const accountsToRemove =
        existingAccounts?.filter((account) => {
          const accountKey = `${account.provider}:${account.mixpost_account_uuid}`;
          const notInMixpost = !mixpostAccountsSet.has(accountKey);
          if (!notInMixpost) return false;

          const accountDataStr =
            typeof account.account_data === "string"
              ? account.account_data
              : JSON.stringify(account.account_data || {});

          if (accountDataStr.toLowerCase().includes("blotato")) {
            return false;
          }
          return true;
        }) || [];

      if (newAccounts.length > 0) {
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
          visibility: "public",
          created_by: authUser?.id || null,
          account_data: account,
          last_synced_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        }));

        await supabase.from("user_social_accounts").upsert(accountsToInsert, {
          onConflict: "user_id,mixpost_account_uuid",
        });
      }

      if (accountsToRemove.length > 0) {
        const idsToRemove = accountsToRemove.map((acc) => acc.id);
        await supabase
          .from("user_social_accounts")
          .delete()
          .in("id", idsToRemove);
      }

      await fetchSavedSocialAccounts();
    } catch (error) {
      console.error("Error syncing social accounts:", error);
    } finally {
      setSyncInProgress(false);
    }
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.id) return;

      try {
        const userId = await getUserOrgId(user.id);
        if (!userId) {
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
          setMessage(t("settings.profile.notFoundSupport"));
        } else {
          setUserProfile(data);
        }
      } catch (error) {
        setMessage(t("settings.profile.fetchError"));
      } finally {
        setProfileLoading(false);
      }
    };

    fetchUserProfile();
  }, [user?.id]);

  useEffect(() => {
    const fetchOrgMemberData = async () => {
      if (!user?.id) return;

      try {
        const { data, error } = await supabase
          .from("org_members")
          .select("*")
          .eq("auth_user_id", user.id)
          .single();

        if (!error) {
          setOrgMemberData(data);
        }
      } catch (error) {
        console.error("Error fetching org_member data:", error);
      }
    };

    fetchOrgMemberData();
  }, [user?.id]);

  useEffect(() => {
    if (socialAccounts !== null && user?.id) {
      syncSocialAccountsToSupabase();
    }
  }, [socialAccounts, user?.id]);

  useEffect(() => {
    const emailChanged = searchParams.get("email");
    if (emailChanged === "changed") {
      setEmailMessage(t("settings.email.changeSuccess"));
      setShowEmailChange(false);
      setEmailData({ newEmail: "", confirmEmail: "" });
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete("email");
      setSearchParams(nextParams, { replace: true });
      const refreshUserData = async () => {
        if (user?.id) {
          try {
            const { data: authData } = await supabase.auth.getUser();
            if (authData?.user?.email) {
              const newEmail = authData.user.email;
              const userId = await getUserOrgId(user.id);
              if (userId) {
                await supabase
                  .from("users")
                  .update({
                    contact_email: newEmail,
                    updated_at: new Date().toISOString(),
                  })
                  .eq("id", userId);
              }
            }

            const userId = await getUserOrgId(user.id);
            if (userId) {
              const { data: profileData } = await supabase
                .from("users")
                .select("*")
                .eq("id", userId)
                .single();
              if (profileData) {
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

  // Restore active settings tab from URL on refresh/navigation.
  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    if (!tabFromUrl) return;
    if (!SETTINGS_TABS.has(tabFromUrl)) return;
    if (tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams, activeTab]);

  // Keep URL in sync with active tab without cluttering default profile state.
  useEffect(() => {
    const currentTabParam = searchParams.get("tab");
    const normalizedCurrent = currentTabParam || "profile";
    if (
      currentTabParam &&
      SETTINGS_TABS.has(currentTabParam) &&
      currentTabParam !== activeTab
    ) {
      return;
    }
    if (normalizedCurrent === activeTab) return;

    const nextParams = new URLSearchParams(searchParams);
    if (activeTab === "profile") {
      nextParams.delete("tab");
    } else {
      nextParams.set("tab", activeTab);
    }
    setSearchParams(nextParams, { replace: true });
  }, [activeTab, searchParams, setSearchParams]);

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
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateAndSetLogoFile = (file) => {
    if (!file) return false;

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

    if (file.size > 2 * 1024 * 1024) {
      setLogoMessage(t("settings.logo.validationSize"));
      return false;
    }

    setLogoFile(file);
    setLogoMessage("");

    const reader = new FileReader();
    reader.onloadend = () => setLogoPreview(reader.result);
    reader.readAsDataURL(file);
    return true;
  };

  const handleLogoFileChange = (e) => {
    const file = e.target.files?.[0];
    validateAndSetLogoFile(file);
  };

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
    if (e.dataTransfer.files?.[0]) {
      validateAndSetLogoFile(e.dataTransfer.files[0]);
    }
  };

  const handleLogoUpload = async () => {
    if (!logoFile || !user?.id) return;

    setLogoUploading(true);
    setLogoMessage("");

    try {
      const fileExt = logoFile.name.split(".").pop();
      const fileName = `${user.id}/logo.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("user-logos")
        .upload(fileName, logoFile, {
          upsert: true,
          contentType: logoFile.type,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("user-logos")
        .getPublicUrl(fileName);

      const logoUrl = urlData.publicUrl;
      const userId = await getUserOrgId(user.id);

      if (!userId) throw new Error(t("settings.messages.userNotFound"));

      const { error: updateError } = await supabase
        .from("users")
        .update({ logo_url: logoUrl, updated_at: new Date().toISOString() })
        .eq("id", userId);

      if (updateError) throw updateError;

      setLogoMessage(t("settings.logo.uploadSuccess"));
      setLogoFile(null);
      setLogoPreview(null);

      const { data: updatedUser } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (updatedUser) setUserProfile(updatedUser);
      window.location.reload();
    } catch (error) {
      setLogoMessage(`Virhe: ${error.message}`);
    } finally {
      setLogoUploading(false);
    }
  };

  const handleLogoRemove = async () => {
    if (!user?.id) return;

    setLogoUploading(true);
    setLogoMessage("");

    try {
      const userId = await getUserOrgId(user.id);
      if (!userId) throw new Error(t("settings.messages.userNotFound"));

      const { error: updateError } = await supabase
        .from("users")
        .update({ logo_url: null, updated_at: new Date().toISOString() })
        .eq("id", userId);

      if (updateError) throw updateError;

      setLogoMessage(t("settings.logo.removeSuccess"));
      setLogoFile(null);
      setLogoPreview(null);

      const { data: updatedUser } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (updatedUser) setUserProfile(updatedUser);
      window.location.reload();
    } catch (error) {
      setLogoMessage(`Virhe: ${error.message}`);
    } finally {
      setLogoUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;

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
        const { data } = await supabase
          .from("users")
          .select("*")
          .eq("id", userProfile.id)
          .single();
        if (data) setUserProfile(data);
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
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordSave = async () => {
    if (!user) return;

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
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: passwordData.currentPassword,
      });

      if (signInError) {
        setPasswordMessage(t("settings.password.currentWrong"));
        return;
      }

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

  const isValidEmail = (value) => /[^@\s]+@[^@\s]+\.[^@\s]+/.test(value);

  const handleEmailSave = async () => {
    if (!user) return;

    if (emailData.newEmail !== emailData.confirmEmail) {
      setEmailMessage(t("settings.email.mismatch"));
      return;
    }

    if (!isValidEmail(emailData.newEmail)) {
      setEmailMessage(t("settings.email.invalid"));
      return;
    }

    if (emailData.newEmail === user.email) {
      setEmailMessage(t("settings.email.sameAsOld"));
      return;
    }

    setEmailLoading(true);
    setEmailMessage("");

    try {
      const { error } = await supabase.auth.updateUser(
        { email: emailData.newEmail },
        { emailRedirectTo: `${window.location.origin}/auth/callback` },
      );

      if (error) {
        setEmailMessage(`Virhe: ${error.message}`);
      } else {
        setEmailMessage(
          t("settings.email.verificationSent", { email: emailData.newEmail }),
        );
        setEmailData({ newEmail: "", confirmEmail: "" });
      }
    } catch (err) {
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

  const tabs = [
    { id: "profile", label: t("ui.tabs.profile") },
    { id: "avatar", label: t("ui.tabs.avatarVoice") },
    { id: "carousel", label: t("ui.tabs.carousels") },
    { id: "features", label: t("ui.tabs.features") },
    { id: "security", label: t("ui.tabs.security") },
  ];

  return (
    <>
      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            {t("settings.title")}
          </h2>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 pb-4 border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`py-2.5 px-5 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? "bg-primary-500 text-white shadow-md"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800"
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {profileLoading ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <div className="flex items-center justify-center">
                  <span className="text-gray-500">
                    {t("settings.profile.loading")}
                  </span>
                </div>
              </div>
            ) : (
              <>
                {/* Logo Card */}
                {!isInvitedUser && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                      <h3 className="text-base font-semibold text-gray-800">
                        {t("settings.logo.title")}
                      </h3>
                    </div>
                    <div className="p-6">
                      <div className="flex flex-col gap-4">
                        {userProfile?.logo_url && !logoPreview && (
                          <div className="flex flex-col items-center gap-3 p-4 bg-gray-50 rounded-xl">
                            <p className="text-sm text-gray-500">
                              {t("settings.logo.currentLogo")}
                            </p>
                            <img
                              src={userProfile.logo_url}
                              alt="Company Logo"
                              className="max-w-[200px] max-h-[100px] object-contain rounded-lg"
                            />
                            <button
                              onClick={handleLogoRemove}
                              disabled={logoUploading}
                              className="py-2 px-4 rounded-lg text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors disabled:opacity-50"
                            >
                              {logoUploading
                                ? t("ui.buttons.removing")
                                : t("ui.buttons.removeLogo")}
                            </button>
                          </div>
                        )}

                        {/* Drop Zone */}
                        <div
                          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer ${
                            logoDragActive
                              ? "border-primary-500 bg-primary-50"
                              : "border-gray-300 bg-gray-50 hover:border-primary-500 hover:bg-primary-50"
                          }`}
                          onDragEnter={handleLogoDrag}
                          onDragLeave={handleLogoDrag}
                          onDragOver={handleLogoDrag}
                          onDrop={handleLogoDrop}
                        >
                          {logoPreview ? (
                            <div className="flex flex-col items-center gap-4">
                              <img
                                src={logoPreview}
                                alt="Logo Preview"
                                className="max-w-[200px] max-h-[100px] object-contain rounded-lg"
                              />
                              <p className="text-sm text-gray-600">
                                {t("settings.logo.logoSelected")}
                              </p>
                              <div className="flex gap-2">
                                <button
                                  onClick={handleLogoUpload}
                                  disabled={logoUploading}
                                  className="py-2 px-4 rounded-lg text-sm font-medium bg-primary-500 text-white hover:bg-primary-600 transition-colors disabled:opacity-50"
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
                                  className="py-2 px-4 rounded-lg text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
                                >
                                  {t("settings.buttons.cancel")}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary-100 flex items-center justify-center">
                                <svg
                                  width="20"
                                  height="20"
                                  viewBox="0 0 24 24"
                                  fill="none"
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
                              <p className="text-sm text-gray-600 mb-1">
                                {logoDragActive
                                  ? t("settings.logo.dropHere")
                                  : t("settings.logo.dragHere")}
                              </p>
                              <p className="text-xs text-gray-400 mb-3">
                                {t("ui.labels.or")}
                              </p>
                              <label className="py-2 px-4 rounded-lg text-sm font-medium bg-primary-100 text-primary-600 hover:bg-primary-200 transition-colors cursor-pointer inline-block">
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
                          className={`mt-4 text-sm p-3 rounded-lg ${
                            logoMessage.includes("Virhe") ||
                            logoMessage.includes("liian")
                              ? "bg-red-50 text-red-600"
                              : "bg-green-50 text-green-600"
                          }`}
                        >
                          {logoMessage}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* User Info Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                    <h3 className="text-base font-semibold text-gray-800">
                      {isInvitedUser
                        ? t("settings.personalInfo.title")
                        : t("settings.profile.title")}
                    </h3>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Organization Info */}
                    <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-800">
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
                                className="py-1.5 px-3 rounded-lg text-xs font-medium bg-primary-100 text-primary-600 hover:bg-primary-200 transition-colors"
                              >
                                {t("settings.buttons.edit")}
                              </button>
                            ) : (
                              <div className="flex gap-2">
                                <button
                                  onClick={async () => {
                                    await handleSave();
                                    setIsEditingOrgInfo(false);
                                  }}
                                  disabled={loading}
                                  className="py-1.5 px-3 rounded-lg text-xs font-medium bg-primary-500 text-white hover:bg-primary-600 transition-colors disabled:opacity-50"
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
                                  className="py-1.5 px-3 rounded-lg text-xs font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
                                >
                                  {t("settings.buttons.cancel")}
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {!isEditingOrgInfo ? (
                        <div className="space-y-2">
                          <div className="flex justify-between py-2 border-b border-orange-200/50">
                            <span className="text-sm text-gray-500">
                              {t("settings.fields.company")}
                            </span>
                            <span className="text-sm font-medium text-gray-800">
                              {userProfile?.company_name ||
                                t("settings.common.notSet")}
                            </span>
                          </div>
                          <div className="flex justify-between py-2">
                            <span className="text-sm text-gray-500">
                              {t("settings.fields.industry")}
                            </span>
                            <span className="text-sm font-medium text-gray-800">
                              {userProfile?.industry ||
                                t("settings.common.notSet")}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {t("settings.fields.company")}
                            </label>
                            <input
                              type="text"
                              value={
                                userProfile?.company_name ||
                                t("settings.common.notSet")
                              }
                              readOnly
                              className="w-full py-2.5 px-3 rounded-lg border border-gray-300 bg-gray-100 text-sm text-gray-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {t("settings.fields.industry")}
                            </label>
                            <input
                              type="text"
                              name="industry"
                              value={formData.industry}
                              onChange={handleInputChange}
                              className="w-full py-2.5 px-3 rounded-lg border border-gray-300 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                              placeholder={t("settings.fields.industry")}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Personal Info */}
                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-800">
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
                                className="py-1.5 px-3 rounded-lg text-xs font-medium bg-primary-100 text-primary-600 hover:bg-primary-200 transition-colors"
                              >
                                {t("settings.buttons.edit")}
                              </button>
                            ) : (
                              <div className="flex gap-2">
                                <button
                                  onClick={async () => {
                                    await handleSave();
                                    setIsEditingPersonalInfo(false);
                                  }}
                                  disabled={loading}
                                  className="py-1.5 px-3 rounded-lg text-xs font-medium bg-primary-500 text-white hover:bg-primary-600 transition-colors disabled:opacity-50"
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
                                  className="py-1.5 px-3 rounded-lg text-xs font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
                                >
                                  {t("settings.buttons.cancel")}
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {!isEditingPersonalInfo ? (
                        <div className="space-y-2">
                          {orgMemberData?.name && (
                            <div className="flex justify-between py-2 border-b border-blue-200/50">
                              <span className="text-sm text-gray-500">
                                {t("settings.fields.name")}
                              </span>
                              <span className="text-sm font-medium text-gray-800">
                                {orgMemberData.name}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between py-2 border-b border-blue-200/50">
                            <span className="text-sm text-gray-500">
                              {t("settings.fields.email")}
                            </span>
                            <span className="text-sm font-medium text-gray-800">
                              {orgMemberData?.email ||
                                user?.email ||
                                t("settings.common.notAvailable")}
                            </span>
                          </div>
                          <div className="flex justify-between py-2">
                            <span className="text-sm text-gray-500">
                              {t("ui.labels.role")}
                            </span>
                            <span className="py-1 px-2.5 rounded-full text-xs font-medium bg-primary-100 text-primary-600">
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
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {t("settings.fields.name")}
                            </label>
                            <input
                              type="text"
                              name="contact_person"
                              value={formData.contact_person}
                              onChange={handleInputChange}
                              className="w-full py-2.5 px-3 rounded-lg border border-gray-300 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                              placeholder={t("settings.fields.namePlaceholder")}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {t("settings.fields.email")}
                            </label>
                            <input
                              type="email"
                              name="contact_email"
                              value={formData.contact_email}
                              onChange={handleInputChange}
                              className="w-full py-2.5 px-3 rounded-lg border border-gray-300 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                              placeholder={t(
                                "settings.fields.emailPlaceholder",
                              )}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Show Details Button */}
                    <button
                      onClick={() => setShowUserInfoModal(true)}
                      className="w-full py-2.5 px-4 rounded-lg text-sm font-medium bg-primary-100 text-primary-600 hover:bg-primary-200 transition-colors"
                    >
                      {t("settings.userInfo.showDetails")}
                    </button>

                    {message && (
                      <div
                        className={`p-3 rounded-lg text-sm ${
                          message.includes(t("settings.common.error"))
                            ? "bg-red-50 text-red-600"
                            : "bg-green-50 text-green-600"
                        }`}
                      >
                        {message}
                      </div>
                    )}
                  </div>
                </div>

                {/* Account Type Card */}
                {!isInvitedUser && (
                  <div className="lg:col-span-2">
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

        {/* Avatar & Voice Tab */}
        {activeTab === "avatar" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6">
              {/* Avatar Section */}
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  {t("settings.avatar.title")}
                </h2>
                <div className="relative p-8 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5" />
                  <div className="relative flex flex-col items-center text-center gap-4">
                    <svg
                      width="48"
                      height="48"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2"
                      className="opacity-75"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <div className="text-lg font-semibold text-green-700">
                      {t("settings.avatar.comingSoon")}
                    </div>
                    <div className="text-sm text-green-600">
                      {t("settings.avatar.workInProgress")}
                    </div>
                  </div>
                </div>
              </div>

              {/* Voice Section */}
              <div>
                <VoiceSection companyId={userProfile?.company_id || null} />
              </div>
            </div>
          </div>
        )}

        {/* Carousel Tab */}
        {activeTab === "carousel" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden p-6">
            <CarouselTemplateSelector />
            <PlacidTemplatesList />
          </div>
        )}

        {/* Features Tab */}
        {activeTab === "features" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden p-6">
            <SettingsIntegrationsTab />
          </div>
        )}

        {/* Security Tab */}
        {activeTab === "security" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Security Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <h3 className="text-base font-semibold text-gray-800">
                  {t("settings.security.title")}
                </h3>
              </div>
              <div className="p-6 space-y-6">
                {/* Password Change */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-semibold text-gray-800">
                      {t("settings.password.title")}
                    </h4>
                    {!showPasswordChange ? (
                      <button
                        onClick={() => setShowPasswordChange(true)}
                        className="py-2 px-4 rounded-lg text-sm font-medium bg-primary-100 text-primary-600 hover:bg-primary-200 transition-colors"
                      >
                        {t("settings.buttons.changePassword")}
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={handlePasswordSave}
                          disabled={passwordLoading}
                          className="py-2 px-4 rounded-lg text-sm font-medium bg-primary-500 text-white hover:bg-primary-600 transition-colors disabled:opacity-50"
                        >
                          {passwordLoading
                            ? t("settings.password.saving")
                            : t("settings.password.save")}
                        </button>
                        <button
                          onClick={handlePasswordCancel}
                          className="py-2 px-4 rounded-lg text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
                        >
                          {t("settings.password.cancel")}
                        </button>
                      </div>
                    )}
                  </div>

                  {passwordMessage && (
                    <div
                      className={`mb-4 p-3 rounded-lg text-sm ${
                        passwordMessage.includes("Virhe")
                          ? "bg-red-50 text-red-600"
                          : "bg-green-50 text-green-600"
                      }`}
                    >
                      {passwordMessage}
                    </div>
                  )}

                  {showPasswordChange && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t("settings.password.current")}
                        </label>
                        <input
                          type="password"
                          name="currentPassword"
                          value={passwordData.currentPassword}
                          onChange={handlePasswordChange}
                          className="w-full py-2.5 px-3 rounded-lg border border-gray-300 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                          placeholder={t(
                            "settings.password.currentPlaceholder",
                          )}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t("settings.password.new")}
                        </label>
                        <input
                          type="password"
                          name="newPassword"
                          value={passwordData.newPassword}
                          onChange={handlePasswordChange}
                          className="w-full py-2.5 px-3 rounded-lg border border-gray-300 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                          placeholder={t("settings.password.newPlaceholder")}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t("settings.password.confirm")}
                        </label>
                        <input
                          type="password"
                          name="confirmPassword"
                          value={passwordData.confirmPassword}
                          onChange={handlePasswordChange}
                          className="w-full py-2.5 px-3 rounded-lg border border-gray-300 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                          placeholder={t(
                            "settings.password.confirmPlaceholder",
                          )}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <hr className="border-gray-200" />

                {/* Email Change */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-semibold text-gray-800">
                      {t("settings.email.title")}
                    </h4>
                    {!showEmailChange ? (
                      <button
                        onClick={() => setShowEmailChange(true)}
                        className="py-2 px-4 rounded-lg text-sm font-medium bg-primary-100 text-primary-600 hover:bg-primary-200 transition-colors"
                      >
                        {t("settings.buttons.changeEmail")}
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={handleEmailSave}
                          disabled={emailLoading}
                          className="py-2 px-4 rounded-lg text-sm font-medium bg-primary-500 text-white hover:bg-primary-600 transition-colors disabled:opacity-50"
                        >
                          {emailLoading
                            ? t("settings.email.saving")
                            : t("settings.email.save")}
                        </button>
                        <button
                          onClick={handleEmailCancel}
                          className="py-2 px-4 rounded-lg text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
                        >
                          {t("settings.email.cancel")}
                        </button>
                      </div>
                    )}
                  </div>

                  {emailMessage && (
                    <div
                      className={`mb-4 p-3 rounded-lg text-sm ${
                        emailMessage.includes("Virhe") ||
                        emailMessage.includes("sama kuin")
                          ? "bg-red-50 text-red-600"
                          : emailMessage.includes("Vahvistuslinkki")
                            ? "bg-blue-50 text-blue-600"
                            : "bg-green-50 text-green-600"
                      }`}
                    >
                      {emailMessage.includes("Vahvistuslinkki") ? (
                        <div>
                          <div className="flex items-center gap-2 font-medium mb-1">
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
                          <div className="text-sm">
                            {emailMessage.split(".")[1]?.trim()}
                          </div>
                          <div className="text-xs opacity-75 mt-1">
                            {t("settings.email.checkSpam")}
                          </div>
                        </div>
                      ) : (
                        emailMessage
                      )}
                    </div>
                  )}

                  {showEmailChange && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t("settings.email.new")}
                        </label>
                        <input
                          type="email"
                          name="newEmail"
                          value={emailData.newEmail}
                          onChange={handleEmailChangeInput}
                          className="w-full py-2.5 px-3 rounded-lg border border-gray-300 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                          placeholder={t("settings.email.newPlaceholder")}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t("settings.email.confirm")}
                        </label>
                        <input
                          type="email"
                          name="confirmEmail"
                          value={emailData.confirmEmail}
                          onChange={handleEmailChangeInput}
                          className="w-full py-2.5 px-3 rounded-lg border border-gray-300 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                          placeholder={t("settings.email.confirmPlaceholder")}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Session Settings Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <h3 className="text-base font-semibold text-gray-800">
                  {t("settings.security.sessionSettings")}
                </h3>
              </div>
              <div className="p-6">
                <TimeoutSettings />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* UserInfoModal */}
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
