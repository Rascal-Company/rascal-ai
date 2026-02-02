import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../contexts/AuthContext";
import SimpleSocialConnect from "../SimpleSocialConnect";

export default function AccountTypeSection({
  userProfile,
  onProfileUpdate,
  isInvitedUser,
}) {
  const { organization } = useAuth();
  const { t } = useTranslation("common");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Form data state
  const [formData, setFormData] = useState({
    account_type: "company",
    company_type: null,
    content_language: "Suomi",
  });

  // Initialize form data from userProfile
  useEffect(() => {
    if (userProfile) {
      setFormData({
        account_type: userProfile.account_type || "company",
        company_type: userProfile.company_type || null,
        content_language: userProfile.content_language || "Suomi",
      });
    } else {
      setFormData({
        account_type: "company",
        company_type: null,
        content_language: "Suomi",
      });
    }
  }, [userProfile]);

  // Save original values for cancel
  const [originalValues, setOriginalValues] = useState(null);

  const handleAccountTypeChange = (type) => {
    setFormData((prev) => ({
      ...prev,
      account_type: type,
    }));
  };

  const handleCompanyTypeChange = (type) => {
    setFormData((prev) => ({
      ...prev,
      company_type: type,
    }));
  };

  const handleContentLanguageChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      content_language: e.target.value,
    }));
  };

  const handleEdit = () => {
    setOriginalValues({ ...formData });
    setIsEditing(true);
    setMessage("");
  };

  const handleCancel = () => {
    if (originalValues) {
      setFormData(originalValues);
    }
    setIsEditing(false);
    setMessage("");
  };

  const handleSave = async () => {
    if (!userProfile?.id) return;

    setLoading(true);
    setMessage("");

    try {
      const updateData = {
        account_type: formData.account_type,
        company_type: formData.company_type || null,
        content_language: formData.content_language || "Suomi",
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", userProfile.id);

      if (error) {
        setMessage(`${t("settings.common.error")}: ${error.message}`);
      } else {
        setMessage(t("settings.accountSettings.saveSuccess"));
        setIsEditing(false);

        // Fetch updated profile
        const { data: updatedProfile, error: fetchError } = await supabase
          .from("users")
          .select("*")
          .eq("id", userProfile.id)
          .single();

        if (!fetchError && updatedProfile) {
          onProfileUpdate(updatedProfile);
        }
      }
    } catch (error) {
      setMessage(`${t("settings.common.error")}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Get current selection summary
  const getCurrentSelection = () => {
    const accountTypeText =
      formData.account_type === "company"
        ? t("settings.accountSettings.company")
        : t("settings.accountSettings.personalBrand");
    const marketText =
      formData.company_type === "B2B"
        ? t("settings.accountSettings.businessCustomers")
        : formData.company_type === "B2C"
          ? t("settings.accountSettings.consumers")
          : formData.company_type === "Both"
            ? t("settings.accountSettings.both")
            : "";

    if (marketText) {
      return `${accountTypeText} → ${marketText}`;
    }
    return accountTypeText;
  };

  if (isInvitedUser) {
    return null;
  }

  // Don't render if userProfile is not loaded yet
  if (!userProfile) {
    return (
      <div className="settings-card p-4">
        <div className="text-center py-10">
          <div className="text-base text-gray-500">
            {t("settings.accountSettings.loading")}
          </div>
        </div>
      </div>
    );
  }

  // Get button classes based on state
  const getAccountTypeClass = (type) => {
    const isSelected = formData.account_type === type;
    if (type === "company") {
      return `settings-option-btn ${isSelected ? "active-blue" : ""}`;
    }
    return `settings-option-btn ${isSelected ? "active-purple" : ""}`;
  };

  const getCompanyTypeClass = (type) => {
    const isSelected = formData.company_type === type;
    if (type === null) {
      return `settings-option-btn ${isSelected ? "active-gray" : ""}`;
    }
    return `settings-option-btn ${isSelected ? "active-green" : ""}`;
  };

  return (
    <div className="settings-card p-4 min-h-0 self-start">
      {/* Header with current selection when not editing */}
      <div className="settings-section-header">
        <div>
          <h2 className="settings-section-title">
            {t("settings.accountSettings.title")}
          </h2>
          {!isEditing && (
            <div className="settings-section-subtitle">
              {getCurrentSelection()}
            </div>
          )}
        </div>
        {!isEditing ? (
          <button
            onClick={handleEdit}
            className="settings-btn settings-btn-secondary"
          >
            {t("settings.accountSettings.edit")}
          </button>
        ) : (
          <div className="flex gap-1.5">
            <button
              onClick={handleSave}
              disabled={loading}
              className="settings-btn settings-btn-primary"
            >
              {loading ? t("ui.buttons.saving") : t("ui.buttons.save")}
            </button>
            <button
              onClick={handleCancel}
              className="settings-btn settings-btn-neutral"
            >
              {t("settings.accountSettings.cancel")}
            </button>
          </div>
        )}
      </div>

      {message && (
        <div
          className={`settings-message text-xs mb-3 ${message.includes("Virhe") ? "settings-message-error" : "settings-message-success"}`}
        >
          {message}
        </div>
      )}

      {/* Sisällön ääni - Account Type Selector (2 columns grid) */}
      <div className="mb-4">
        <label className="settings-label">
          {t("settings.accountSettings.contentVoice")}
        </label>
        <div className="settings-option-grid-2">
          <button
            type="button"
            onClick={() => handleAccountTypeChange("company")}
            disabled={!isEditing}
            className={getAccountTypeClass("company")}
          >
            {t("settings.accountSettings.company")}
          </button>
          <button
            type="button"
            onClick={() => handleAccountTypeChange("personal_brand")}
            disabled={!isEditing}
            className={getAccountTypeClass("personal_brand")}
          >
            {t("settings.accountSettings.personalBrand")}
          </button>
        </div>
      </div>

      {/* Kohderyhmätyyppi - Target Market Selector (4 columns grid) */}
      <div>
        <label className="settings-label">
          {t("settings.accountSettings.targetAudience")}{" "}
          <span className="settings-label-optional">
            {t("settings.accountSettings.optional")}
          </span>
        </label>
        <div className="settings-option-grid-4">
          {["B2B", "B2C", "Both"].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() =>
                handleCompanyTypeChange(type === "Both" ? "Both" : type)
              }
              disabled={!isEditing}
              className={getCompanyTypeClass(type)}
            >
              {type === "B2B"
                ? t("settings.accountSettings.b2b")
                : type === "B2C"
                  ? t("settings.accountSettings.b2c")
                  : t("settings.accountSettings.both")}
            </button>
          ))}
          <button
            type="button"
            onClick={() => handleCompanyTypeChange(null)}
            disabled={!isEditing}
            className={getCompanyTypeClass(null)}
          >
            {t("settings.accountSettings.noSelection")}
          </button>
        </div>
      </div>

      {/* Sisällön kieli */}
      <div className="mt-4">
        <label className="settings-label">
          {t("settings.accountSettings.contentLanguage")}
        </label>
        <p className="settings-description">
          {t("settings.accountSettings.contentLanguageDescription")}
        </p>
        <input
          type="text"
          value={formData.content_language}
          onChange={handleContentLanguageChange}
          disabled={!isEditing}
          placeholder={t("settings.accountSettings.contentLanguagePlaceholder")}
          className="settings-text-input"
        />
      </div>

      {/* Sosiaalisen median yhdistäminen - vain owner/admin */}
      {organization?.role !== "member" && (
        <div className="settings-social-connect-section">
          <SimpleSocialConnect />
        </div>
      )}
    </div>
  );
}
