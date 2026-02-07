/**
 * Post Filters Component
 * Search bar and filter dropdowns for type and status
 */

import React from "react";

/**
 * @param {Object} props
 * @param {string} props.searchTerm - Current search term
 * @param {Function} props.onSearchChange - Callback when search term changes
 * @param {string} props.typeFilter - Current type filter
 * @param {Function} props.onTypeChange - Callback when type filter changes
 * @param {string} props.statusFilter - Current status filter
 * @param {Function} props.onStatusChange - Callback when status filter changes
 * @param {Function} props.t - Translation function
 * @param {boolean} props.show - Whether to show filters (hidden on UGC tab)
 * @param {Object} props.counts - Count of posts per filter { type: {Photo: 5, Reels: 3}, status: {Kesken: 2} }
 */
const PostFilters = ({
  searchTerm,
  onSearchChange,
  typeFilter,
  onTypeChange,
  statusFilter,
  onStatusChange,
  t,
  show = true,
  counts = { type: {}, status: {} },
}) => {
  if (!show) return null;

  return (
    <div className="flex flex-col md:flex-row gap-6">
      <div className="relative flex-1 group">
        <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-gray-300 group-focus-within:text-blue-500 transition-colors">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={
            t("posts.filters.searchPlaceholder") || "Hae julkaisuja..."
          }
          className="w-full pl-16 pr-8 py-4 bg-white border border-gray-100 rounded-[24px] shadow-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all placeholder:text-gray-300 font-medium text-sm"
        />
      </div>

      <div className="flex gap-4 md:min-w-[300px]">
        <div className="relative flex-1">
          <select
            value={typeFilter}
            onChange={(e) => onTypeChange(e.target.value)}
            className="w-full px-6 py-4 bg-white border border-gray-100 rounded-[24px] shadow-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer text-xs font-bold uppercase tracking-widest text-gray-600"
          >
            <option value="">
              {t("posts.filters.allTypes")}
              {counts.type.all > 0 && ` (${counts.type.all})`}
            </option>
            <option value="Photo">
              {t("posts.typeOptions.photo")}
              {counts.type.Photo > 0 && ` (${counts.type.Photo})`}
            </option>
            <option value="Carousel">
              {t("posts.typeOptions.carousel")}
              {counts.type.Carousel > 0 && ` (${counts.type.Carousel})`}
            </option>
            <option value="Reels">
              {t("posts.typeOptions.reels")}
              {counts.type.Reels > 0 && ` (${counts.type.Reels})`}
            </option>
            <option value="LinkedIn">
              {t("posts.typeOptions.linkedin")}
              {counts.type.LinkedIn > 0 && ` (${counts.type.LinkedIn})`}
            </option>
            <option value="Video">
              {t("posts.typeOptions.video")}
              {counts.type.Video > 0 && ` (${counts.type.Video})`}
            </option>
          </select>
          <div className="absolute inset-y-0 right-6 flex items-center pointer-events-none text-gray-300">
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
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>

        <div className="relative flex-1">
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full px-6 py-4 bg-white border border-gray-100 rounded-[24px] shadow-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer text-xs font-bold uppercase tracking-widest text-gray-600"
          >
            <option value="">
              {t("posts.filters.allStatuses")}
              {counts.status.all > 0 && ` (${counts.status.all})`}
            </option>
            <option value="Kesken">
              {t("posts.status.Kesken")}
              {counts.status.Kesken > 0 && ` (${counts.status.Kesken})`}
            </option>
            <option value="Tarkistuksessa">
              {t("posts.status.Tarkistuksessa")}
              {counts.status.Tarkistuksessa > 0 &&
                ` (${counts.status.Tarkistuksessa})`}
            </option>
            <option value="Aikataulutettu">
              {t("posts.status.Aikataulutettu")}
              {counts.status.Aikataulutettu > 0 &&
                ` (${counts.status.Aikataulutettu})`}
            </option>
            <option value="Julkaistu">
              {t("posts.status.Julkaistu")}
              {counts.status.Julkaistu > 0 && ` (${counts.status.Julkaistu})`}
            </option>
          </select>
          <div className="absolute inset-y-0 right-6 flex items-center pointer-events-none text-gray-300">
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
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostFilters;
