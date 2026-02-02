import React from "react";
import { useTranslation } from "react-i18next";

export default function UserInfoModal({
  isOpen,
  onClose,
  organizationData,
  memberData,
}) {
  const { t } = useTranslation("common");

  if (!isOpen) return null;

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("fi-FI", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case "admin":
        return t("ui.labels.admin");
      case "member":
        return t("ui.labels.member");
      case "owner":
        return t("ui.labels.owner");
      default:
        return role || "-";
    }
  };

  return (
    <div className="user-info-overlay" onClick={onClose}>
      <div className="user-info-modal" onClick={(e) => e.stopPropagation()}>
        <div className="user-info-header">
          <h2>{t("settings.userInfo.title")}</h2>
          <button
            className="user-info-close"
            onClick={onClose}
            aria-label={t("common.close")}
          >
            ×
          </button>
        </div>

        <div className="user-info-body">
          {/* Organisaation tiedot */}
          <div className="user-info-section user-info-section-org">
            <h3 className="user-info-section-title">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              {t("settings.userInfo.organizationInfo")}
            </h3>
            <div className="user-info-fields">
              <div className="user-info-field">
                <span className="user-info-label">
                  {t("settings.fields.company")}
                </span>
                <span className="user-info-value">
                  {organizationData?.company_name ||
                    t("settings.common.notSet")}
                </span>
              </div>
              <div className="user-info-field">
                <span className="user-info-label">
                  {t("settings.fields.industry")}
                </span>
                <span className="user-info-value">
                  {organizationData?.industry || t("settings.common.notSet")}
                </span>
              </div>
            </div>
          </div>

          {/* Käyttäjän tiedot */}
          <div className="user-info-section user-info-section-personal">
            <h3 className="user-info-section-title">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              {t("settings.userInfo.personalInfo")}
            </h3>
            <div className="user-info-fields">
              {memberData?.name && (
                <div className="user-info-field">
                  <span className="user-info-label">
                    {t("settings.fields.name")}
                  </span>
                  <span className="user-info-value">{memberData.name}</span>
                </div>
              )}
              <div className="user-info-field">
                <span className="user-info-label">
                  {t("settings.fields.email")}
                </span>
                <span className="user-info-value">
                  {memberData?.email || t("settings.common.notAvailable")}
                </span>
              </div>
              <div className="user-info-field">
                <span className="user-info-label">{t("ui.labels.role")}</span>
                <span className="user-info-value user-info-role">
                  {getRoleLabel(memberData?.role)}
                </span>
              </div>
              {memberData?.created_at && (
                <div className="user-info-field">
                  <span className="user-info-label">
                    {t("settings.userInfo.memberSince")}
                  </span>
                  <span className="user-info-value">
                    {formatDate(memberData.created_at)}
                  </span>
                </div>
              )}
              {memberData?.userId && (
                <div className="user-info-field">
                  <span className="user-info-label">
                    {t("settings.fields.userId")}
                  </span>
                  <span
                    className="user-info-value"
                    style={{ fontFamily: "monospace", fontSize: "12px" }}
                  >
                    {memberData.userId}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="user-info-footer">
          <button className="user-info-close-btn" onClick={onClose}>
            {t("common.close")}
          </button>
        </div>
      </div>
    </div>
  );
}
