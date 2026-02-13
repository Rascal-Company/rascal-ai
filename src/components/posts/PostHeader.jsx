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
    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 tracking-tight leading-none">
          {t("posts.header")}
        </h1>
        <p className="text-gray-400 text-sm sm:text-base lg:text-lg font-medium">
          {t("posts.subtitle") || "Hallitse ja aikatauluta somesisältöjäsi"}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full xl:w-auto">
        {/* Quota Indicator: This Month */}
        <div className="post-quota-card group bg-white rounded-[28px] sm:rounded-[32px] border border-gray-100 shadow-xl shadow-gray-200/20 p-0 hover:shadow-2xl hover:border-blue-100 transition-all duration-500 min-w-0">
          <div className="post-quota-card-inner flex flex-col gap-4 sm:gap-5 min-w-0 px-5 py-5 sm:px-6 sm:py-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-start gap-2.5 min-w-0">
            <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 normal-case sm:uppercase tracking-normal sm:tracking-widest group-hover:text-blue-500 transition-colors pr-2 min-w-0 leading-snug break-words">
              {t("monthlyLimit.generatedThisMonth")}
            </span>
            {monthlyLimit.loading ? (
              <div className="w-4 h-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin flex-shrink-0" />
            ) : (
              <div
                className={`w-auto max-w-full px-2 sm:px-3 py-1 rounded-full text-[8px] sm:text-[9px] font-black normal-case sm:uppercase tracking-normal sm:tracking-widest ${monthlyLimit.remaining <= 5 ? "bg-orange-50 text-orange-600" : "bg-blue-50 text-blue-600"}`}
              >
                {monthlyLimit.remaining}{" "}
                {t("monthlyLimit.remaining") || "jäljellä"}
              </div>
            )}
          </div>
            <div className="flex items-baseline gap-2 sm:gap-3 min-w-0 flex-wrap">
              <span className="text-2xl sm:text-3xl font-black text-gray-900 leading-none">
                {monthlyLimit.currentCount}
              </span>
              <span className="text-xs sm:text-sm font-bold text-gray-300 break-all">
                / {monthlyLimit.isUnlimited ? "∞" : monthlyLimit.monthlyLimit}
              </span>
            </div>
            <div className="h-2.5 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-100">
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-out ${monthlyLimit.remaining <= 5 ? "bg-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.4)]" : "bg-blue-600 shadow-[0_0_12px_rgba(37,99,235,0.4)]"}`}
                style={{
                  width: `${Math.min(100, (monthlyLimit.currentCount / (monthlyLimit.isUnlimited ? 100 : monthlyLimit.monthlyLimit)) * 100)}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Quota Indicator: Next Month */}
        <div className="post-quota-card group bg-white rounded-[28px] sm:rounded-[32px] border border-gray-100 shadow-xl shadow-gray-200/20 p-0 hover:shadow-2xl hover:border-indigo-100 transition-all duration-500 min-w-0">
          <div className="post-quota-card-inner flex flex-col gap-4 sm:gap-5 min-w-0 px-5 py-5 sm:px-6 sm:py-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-start gap-2.5 min-w-0">
            <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 normal-case sm:uppercase tracking-normal sm:tracking-widest group-hover:text-indigo-500 transition-colors pr-2 min-w-0 leading-snug break-words">
              {t("monthlyLimit.generatedNextMonth")}
            </span>
            {nextMonthQuota.loading ? (
              <div className="w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin flex-shrink-0" />
            ) : (
              <div className="w-auto max-w-full px-2 sm:px-3 py-1 rounded-full bg-gray-50 text-gray-500 text-[8px] sm:text-[9px] font-black normal-case sm:uppercase tracking-normal sm:tracking-widest">
                Saldossa
              </div>
            )}
          </div>
            <div className="flex items-baseline gap-2 sm:gap-3 min-w-0 flex-wrap">
              <span className="text-2xl sm:text-3xl font-black text-gray-900 leading-none">
                {nextMonthQuota.nextMonthCount}
              </span>
              <span className="text-xs sm:text-sm font-bold text-gray-300 break-all">
                /{" "}
                {nextMonthQuota.isUnlimited ? "∞" : nextMonthQuota.nextMonthLimit}
              </span>
            </div>
            <div className="h-2.5 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-100">
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
    </div>
  );
};

export default PostHeader;
