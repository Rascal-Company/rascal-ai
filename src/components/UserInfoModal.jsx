import React from "react";
import { createPortal } from "react-dom";
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

  return createPortal(
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9998] p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">{t("settings.userInfo.title")}</h2>
          <button
            className="text-gray-500 bg-gray-100 border border-gray-200 cursor-pointer p-2 rounded-lg transition-all duration-200 w-9 h-9 flex items-center justify-center hover:bg-gray-200 hover:text-gray-700 active:scale-95 text-xl"
            onClick={onClose}
            aria-label={t("common.close")}
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-auto px-6 py-6 space-y-6">
          <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-4">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ff6600"
                strokeWidth="2"
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              {t("settings.userInfo.organizationInfo")}
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between py-2 border-b border-orange-200/50">
                <span className="text-sm text-gray-500">
                  {t("settings.fields.company")}
                </span>
                <span className="text-sm font-medium text-gray-800">
                  {organizationData?.company_name ||
                    t("settings.common.notSet")}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-sm text-gray-500">
                  {t("settings.fields.industry")}
                </span>
                <span className="text-sm font-medium text-gray-800">
                  {organizationData?.industry || t("settings.common.notSet")}
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-4">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#0369a1"
                strokeWidth="2"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              {t("settings.userInfo.personalInfo")}
            </h3>
            <div className="space-y-2">
              {memberData?.name && (
                <div className="flex justify-between py-2 border-b border-blue-200/50">
                  <span className="text-sm text-gray-500">
                    {t("settings.fields.name")}
                  </span>
                  <span className="text-sm font-medium text-gray-800">{memberData.name}</span>
                </div>
              )}
              <div className="flex justify-between py-2 border-b border-blue-200/50">
                <span className="text-sm text-gray-500">
                  {t("settings.fields.email")}
                </span>
                <span className="text-sm font-medium text-gray-800">
                  {memberData?.email || t("settings.common.notAvailable")}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-blue-200/50">
                <span className="text-sm text-gray-500">{t("ui.labels.role")}</span>
                <span className="py-1 px-2.5 rounded-full text-xs font-medium bg-primary-100 text-primary-600">
                  {getRoleLabel(memberData?.role)}
                </span>
              </div>
              {memberData?.created_at && (
                <div className="flex justify-between py-2 border-b border-blue-200/50">
                  <span className="text-sm text-gray-500">
                    {t("settings.userInfo.memberSince")}
                  </span>
                  <span className="text-sm font-medium text-gray-800">
                    {formatDate(memberData.created_at)}
                  </span>
                </div>
              )}
              {memberData?.userId && (
                <div className="flex justify-between py-2">
                  <span className="text-sm text-gray-500">
                    {t("settings.fields.userId")}
                  </span>
                  <span className="text-sm font-medium text-gray-800 font-mono text-xs">
                    {memberData.userId}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-all"
            onClick={onClose}
          >
            {t("common.close")}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
