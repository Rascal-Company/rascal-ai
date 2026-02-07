/**
 * Post Header Component
 * Displays page title, subtitle, and monthly quota indicators
 * @typedef {Object} MonthlyLimitData
 * @property {number} currentCount - Current month's generated count
 * @property {number} monthlyLimit - Monthly limit
 * @property {number} remaining - Remaining quota
 * @property {boolean} isUnlimited - Whether plan is unlimited
 * @property {boolean} loading - Loading state
 *
 * @typedef {Object} NextMonthQuotaData
 * @property {number} nextMonthCount - Next month's generated count
 * @property {number} nextMonthLimit - Next month's limit
 * @property {boolean} isUnlimited - Whether plan is unlimited
 * @property {boolean} loading - Loading state
 */

import React from "react";

/**
 * @param {Object} props
 * @param {Function} props.t - Translation function
 * @param {MonthlyLimitData} props.monthlyLimit - Current month quota data
 * @param {NextMonthQuotaData} props.nextMonthQuota - Next month quota data
 */
const PostHeader = ({ t, monthlyLimit, nextMonthQuota }) => {
  return (
    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 tracking-tight leading-none">
          {t("posts.header")}
        </h1>
        <p className="text-gray-400 text-sm sm:text-base lg:text-lg font-medium">
          {t("posts.subtitle") || "Hallitse ja aikatauluta somesisältöjäsi"}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full lg:w-auto">
        {/* Quota Indicator: This Month */}
        <div className="group bg-white rounded-[32px] border border-gray-100 shadow-xl shadow-gray-200/20 p-4 sm:p-6 hover:shadow-2xl hover:border-blue-100 transition-all duration-500 min-w-0">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest group-hover:text-blue-500 transition-colors truncate pr-2">
              {t("monthlyLimit.generatedThisMonth")}
            </span>
            {monthlyLimit.loading ? (
              <div className="w-4 h-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin flex-shrink-0" />
            ) : (
              <div
                className={`flex-shrink-0 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${monthlyLimit.remaining <= 5 ? "bg-orange-50 text-orange-600" : "bg-blue-50 text-blue-600"}`}
              >
                {monthlyLimit.remaining}{" "}
                {t("monthlyLimit.remaining") || "jäljellä"}
              </div>
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-gray-900 leading-none">
              {monthlyLimit.currentCount}
            </span>
            <span className="text-xs sm:text-sm font-bold text-gray-300">
              / {monthlyLimit.isUnlimited ? "∞" : monthlyLimit.monthlyLimit}
            </span>
          </div>
          <div className="mt-5 h-2 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-100">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-out ${monthlyLimit.remaining <= 5 ? "bg-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.4)]" : "bg-blue-600 shadow-[0_0_12px_rgba(37,99,235,0.4)]"}`}
              style={{
                width: `${Math.min(100, (monthlyLimit.currentCount / (monthlyLimit.isUnlimited ? 100 : monthlyLimit.monthlyLimit)) * 100)}%`,
              }}
            />
          </div>
        </div>

        {/* Quota Indicator: Next Month */}
        <div className="group bg-white rounded-[32px] border border-gray-100 shadow-xl shadow-gray-200/20 p-4 sm:p-6 hover:shadow-2xl hover:border-indigo-100 transition-all duration-500 min-w-0">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest group-hover:text-indigo-500 transition-colors truncate pr-2">
              {t("monthlyLimit.generatedNextMonth")}
            </span>
            {nextMonthQuota.loading ? (
              <div className="w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin flex-shrink-0" />
            ) : (
              <div className="flex-shrink-0 px-3 py-1 rounded-full bg-gray-50 text-gray-500 text-[9px] font-black uppercase tracking-widest">
                Saldossa
              </div>
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-gray-900 leading-none">
              {nextMonthQuota.nextMonthCount}
            </span>
            <span className="text-xs sm:text-sm font-bold text-gray-300">
              /{" "}
              {nextMonthQuota.isUnlimited ? "∞" : nextMonthQuota.nextMonthLimit}
            </span>
          </div>
          <div className="mt-5 h-2 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-100">
            <div
              className="h-full rounded-full bg-indigo-400 shadow-[0_0_12px_rgba(129,140,248,0.4)] transition-all duration-1000 ease-out"
              style={{
                width: `${Math.min(100, (nextMonthQuota.nextMonthCount / (nextMonthQuota.isUnlimited ? 100 : nextMonthQuota.nextMonthLimit)) * 100)}%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostHeader;
