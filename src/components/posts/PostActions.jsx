/**
 * Post Actions Component
 * Action buttons for Image Bank, Import, and Generate new post
 */

import React from "react";

/**
 * @param {Object} props
 * @param {Function} props.onImageBankClick - Callback when Image Bank button clicked
 * @param {Function} props.onImportClick - Callback when Import button clicked
 * @param {Function} props.onGenerateClick - Callback when Generate button clicked
 * @param {Function} props.t - Translation function
 * @param {string} props.userAccountType - User account type (e.g., "personal_brand")
 * @param {boolean} props.canCreate - Whether user can create new posts (quota check)
 */
const PostActions = ({
  onImageBankClick,
  onImportClick,
  onGenerateClick,
  t,
  userAccountType,
  canCreate,
}) => {
  return (
    <div className="flex items-center gap-2 sm:gap-6 flex-shrink-0">
      {userAccountType === "personal_brand" && (
        <button
          onClick={onImageBankClick}
          className="hidden lg:flex text-[10px] sm:text-xs font-bold text-gray-400 hover:text-gray-900 uppercase tracking-widest transition-colors py-2"
        >
          {t("posts.tabs.imageBank")}
        </button>
      )}
      <div className="h-4 w-px bg-gray-200 hidden lg:block" />
      <div className="flex gap-2 sm:gap-3">
        <button
          onClick={onImportClick}
          className="px-3 sm:px-6 py-2 sm:py-3 bg-white hover:bg-gray-50 text-gray-900 text-[10px] sm:text-xs font-bold uppercase tracking-widest rounded-2xl border border-gray-100 shadow-lg shadow-gray-200/20 transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
        >
          <span className="sm:hidden">+</span>
          <span className="hidden sm:inline">
            {t("posts.buttons.importPost")}
          </span>
        </button>
        <button
          onClick={onGenerateClick}
          disabled={!canCreate}
          className="px-4 sm:px-8 py-2 sm:py-3 bg-gray-900 hover:bg-black text-white text-[10px] sm:text-xs font-bold uppercase tracking-widest rounded-2xl shadow-xl shadow-gray-900/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          <span className="sm:hidden">Luo</span>
          <span className="hidden sm:inline">
            {t("posts.buttons.generateNew")}
          </span>
        </button>
      </div>
    </div>
  );
};

export default PostActions;
