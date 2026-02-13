/**
 * Post Tabs Component
 * Tab navigation for Posts, Carousels, Calendar, and UGC
 */

import React from "react";

/**
 * @param {Object} props
 * @param {string} props.activeTab - Currently active tab ID
 * @param {Function} props.onTabChange - Callback when tab changes
 * @param {Function} props.t - Translation function
 * @param {Object} props.user - User object with features array
 */
const PostTabs = ({ activeTab, onTabChange, t, user }) => {
  const tabs = [
    {
      id: "kanban",
      label: t("posts.tabs.posts"),
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M4 6h16M4 10h16M4 14h16M4 18h16"
          />
        </svg>
      ),
    },
    {
      id: "carousels",
      label: t("posts.tabs.carousels"),
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
      ),
    },
    {
      id: "calendar",
      label: t("posts.tabs.calendar"),
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
    },
    {
      id: "ugc",
      label: t("posts.tabs.ugc"),
      feature: "UGC",
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
      ),
    },
  ];

  const visibleTabs = tabs.filter(
    (tab) => !tab.feature || user?.features?.includes(tab.feature),
  );

  return (
    <div className="posts-main-tabs-wrap flex p-2 sm:p-2 bg-gray-50/80 rounded-[24px] overflow-visible no-scrollbar gap-1.5 border border-gray-100 flex-1 sm:flex-none">
      {visibleTabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`posts-main-tab-btn flex items-center justify-center gap-2 px-3 sm:px-6 py-2 sm:py-3 text-[10px] sm:text-xs font-bold rounded-[18px] border-2 transition-all duration-300 whitespace-nowrap ${
            activeTab === tab.id
              ? "bg-white text-gray-900 shadow-lg shadow-gray-200/50 border-orange-400"
              : "text-gray-400 hover:text-gray-900 hover:bg-white/50 border-transparent"
          }`}
        >
          {tab.icon}
          <span className="uppercase tracking-widest hidden md:inline">
            {tab.label}
          </span>
        </button>
      ))}
    </div>
  );
};

export default PostTabs;
