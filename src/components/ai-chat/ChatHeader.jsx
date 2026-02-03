import React from "react";
import { useTranslation } from "react-i18next";

export function ChatHeader({
  assistantType,
  onAssistantTypeChange,
  filesCount,
  onOpenDatabase,
}) {
  const { t } = useTranslation("common");

  return (
    <div className="flex items-center justify-between py-4 px-6 bg-white border-b border-gray-200">
      <h1 className="text-xl font-bold text-gray-800 m-0">
        {t("assistant.title")}
      </h1>

      {/* Assistant Type Selector */}
      <div className="flex items-center gap-2 p-1 rounded-xl bg-gray-100">
        <button
          className={`py-2 px-4 border-none rounded-lg text-sm font-medium cursor-pointer whitespace-nowrap transition-all duration-200 ${
            assistantType === "marketing"
              ? "text-white bg-primary-500 shadow-md"
              : "text-gray-500 bg-transparent hover:text-primary-500 hover:bg-primary-500/10"
          }`}
          onClick={() => onAssistantTypeChange("marketing")}
        >
          {t("assistant.types.marketing")}
        </button>
        <button
          className={`py-2 px-4 border-none rounded-lg text-sm font-medium cursor-pointer whitespace-nowrap transition-all duration-200 ${
            assistantType === "sales"
              ? "text-white bg-primary-500 shadow-md"
              : "text-gray-500 bg-transparent hover:text-primary-500 hover:bg-primary-500/10"
          }`}
          onClick={() => onAssistantTypeChange("sales")}
        >
          {t("assistant.types.sales")}
        </button>
      </div>

      {/* Database Toggle Button */}
      <button
        onClick={onOpenDatabase}
        className="flex items-center gap-1.5 py-2.5 px-4 rounded-xl text-sm font-semibold cursor-pointer transition-all duration-300 bg-gradient-to-br from-primary-500/10 to-primary-600/10 border border-primary-500/30 text-primary-500 shadow-lg shadow-primary-500/20 hover:-translate-y-0.5 hover:from-primary-500/20 hover:to-primary-600/20 hover:shadow-xl hover:shadow-primary-500/30"
      >
        {t("assistant.threads.databaseLink", { count: filesCount })}
      </button>
    </div>
  );
}
