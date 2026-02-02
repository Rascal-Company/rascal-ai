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

  const [formData, setFormData] = useState({
    account_type: "company",
    company_type: null,
    content_language: "Suomi",
  });

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

  if (!userProfile) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="text-center py-10">
          <div className="text-base text-gray-500">
            {t("settings.accountSettings.loading")}
          </div>
        </div>
      </div>
    );
  }

  const getAccountTypeClass = (type) => {
    const isSelected = formData.account_type === type;
    const baseClass = "py-2 px-4 rounded-lg text-sm font-medium border transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
    if (type === "company") {
      return `${baseClass} ${isSelected ? "bg-blue-50 border-blue-500 text-blue-700" : "bg-white border-gray-300 text-gray-700 hover:border-gray-400"}`;
    }
    return `${baseClass} ${isSelected ? "bg-purple-50 border-purple-500 text-purple-700" : "bg-white border-gray-300 text-gray-700 hover:border-gray-400"}`;
  };

  const getCompanyTypeClass = (type) => {
    const isSelected = formData.company_type === type;
    const baseClass = "py-2 px-4 rounded-lg text-sm font-medium border transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
    if (type === null) {
      return `${baseClass} ${isSelected ? "bg-gray-100 border-gray-400 text-gray-700" : "bg-white border-gray-300 text-gray-700 hover:border-gray-400"}`;
    }
    return `${baseClass} ${isSelected ? "bg-green-50 border-green-500 text-green-700" : "bg-white border-gray-300 text-gray-700 hover:border-gray-400"}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 min-h-0 self-start">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-base font-semibold text-gray-800 m-0">
            {t("settings.accountSettings.title")}
          </h2>
          {!isEditing && (
            <div className="text-sm text-gray-500 mt-1">
              {getCurrentSelection()}
            </div>
          )}
        </div>
        {!isEditing ? (
          <button
            onClick={handleEdit}
            className="py-1.5 px-3 rounded-lg text-xs font-medium bg-primary-100 text-primary-600 hover:bg-primary-200 transition-colors"
          >
            {t("settings.accountSettings.edit")}
          </button>
        ) : (
          <div className="flex gap-1.5">
            <button
              onClick={handleSave}
              disabled={loading}
              className="py-1.5 px-3 rounded-lg text-xs font-medium bg-primary-500 text-white hover:bg-primary-600 transition-colors disabled:opacity-50"
            >
              {loading ? t("ui.buttons.saving") : t("ui.buttons.save")}
            </button>
            <button
              onClick={handleCancel}
              className="py-1.5 px-3 rounded-lg text-xs font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
            >
              {t("settings.accountSettings.cancel")}
            </button>
          </div>
        )}
      </div>

      {message && (
        <div
          className={`text-xs mb-3 p-2 rounded-lg ${message.includes("Virhe") ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}
        >
          {message}
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t("settings.accountSettings.contentVoice")}
        </label>
        <div className="grid grid-cols-2 gap-2">
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

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t("settings.accountSettings.targetAudience")}{" "}
          <span className="text-gray-400 font-normal">
            {t("settings.accountSettings.optional")}
          </span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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

      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t("settings.accountSettings.contentLanguage")}
        </label>
        <p className="text-xs text-gray-500 mb-2">
          {t("settings.accountSettings.contentLanguageDescription")}
        </p>
        <input
          type="text"
          value={formData.content_language}
          onChange={handleContentLanguageChange}
          disabled={!isEditing}
          placeholder={t("settings.accountSettings.contentLanguagePlaceholder")}
          className="w-full py-2.5 px-3 rounded-lg border border-gray-300 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all disabled:bg-gray-100 disabled:text-gray-500"
        />
      </div>

      {organization?.role !== "member" && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <SimpleSocialConnect />
        </div>
      )}
    </div>
  );
}
