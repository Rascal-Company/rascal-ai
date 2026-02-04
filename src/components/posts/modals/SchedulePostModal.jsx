/**
 * Schedule Post Modal
 * Korvaa ruman prompt() -dialogin
 * Antaa käyttäjän valita päivämäärän, ajan ja somekanavat
 */

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";

const SchedulePostModal = ({
  show,
  post,
  socialAccounts,
  selectedAccounts,
  setSelectedAccounts,
  loadingAccounts,
  onClose,
  onConfirm,
  t,
}) => {
  // Default: huominen klo 09:00
  const getDefaultScheduleDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    return tomorrow.toISOString().slice(0, 16); // "YYYY-MM-DDTHH:MM"
  };

  const [scheduleDate, setScheduleDate] = useState(getDefaultScheduleDate());
  const [error, setError] = useState("");

  useEffect(() => {
    if (show) {
      setScheduleDate(getDefaultScheduleDate());
      setError("");
    }
  }, [show]);

  if (!show || !post) return null;

  const toggleAccount = (accountId) => {
    if (selectedAccounts.includes(accountId)) {
      setSelectedAccounts(selectedAccounts.filter((id) => id !== accountId));
    } else {
      setSelectedAccounts([...selectedAccounts, accountId]);
    }
  };

  const handleConfirm = () => {
    // Validoi että päivämäärä on tulevaisuudessa
    const selectedDate = new Date(scheduleDate);
    const now = new Date();

    if (selectedDate <= now) {
      setError(
        t("posts.scheduleModal.pastDateError") ||
          "Ajastusaika täytyy olla tulevaisuudessa",
      );
      return;
    }

    if (selectedAccounts.length === 0) {
      setError(
        t("posts.scheduleModal.noAccountsError") ||
          "Valitse vähintään yksi kanava",
      );
      return;
    }

    onConfirm(scheduleDate, selectedAccounts);
  };

  const isCarousel = post.type === "Carousel";
  const mediaUrl =
    post.thumbnail ||
    (post.media_urls && post.media_urls[0]) ||
    post.mediaUrls?.[0];

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-white/80 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />

      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-[0_32px_96px_-16px_rgba(0,0,0,0.1)] border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-8 py-6 flex items-center justify-between border-b border-gray-50">
          <div>
            <h2 className="text-lg font-bold text-gray-900 leading-none">
              {t("posts.scheduleModal.title") || "Aikatauluta julkaisu"}
            </h2>
            <p className="text-xs text-gray-400 mt-1.5">
              {t("posts.scheduleModal.subtitle") ||
                "Valitse päivämäärä, aika ja somekanavat"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-50 rounded-full text-gray-400 hover:text-gray-900 transition-colors"
          >
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto flex flex-col md:flex-row">
          {/* Content Preview */}
          <div className="flex-1 p-8 bg-gray-50/30">
            <div className="max-w-[320px] mx-auto space-y-6">
              <div className="aspect-square bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                {isCarousel && post.segments?.length > 0 ? (
                  <img
                    src={post.segments[0].media_urls?.[0]}
                    className="w-full h-full object-cover"
                    alt="preview"
                  />
                ) : mediaUrl ? (
                  mediaUrl.includes(".mp4") || mediaUrl.includes("video") ? (
                    <video
                      src={mediaUrl}
                      className="w-full h-full object-cover"
                      controls
                    />
                  ) : (
                    <img
                      src={mediaUrl}
                      className="w-full h-full object-cover"
                      alt="preview"
                    />
                  )
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-300 text-xs">
                    {t("posts.scheduleModal.noMedia") || "Ei mediaa"}
                  </div>
                )}
              </div>
              <div className="text-sm text-gray-600 leading-relaxed max-h-40 overflow-y-auto pr-2 custom-scrollbar whitespace-pre-wrap italic">
                {post.caption ||
                  t("posts.scheduleModal.noCaption") ||
                  "Ei kuvatekstiä"}
              </div>
            </div>
          </div>

          {/* Configuration */}
          <div className="flex-1 p-8 border-l border-gray-50 space-y-10">
            {/* Schedule DateTime */}
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                {t("posts.scheduleModal.scheduleDateTime") || "Ajastusaika"}
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="datetime-local"
                value={scheduleDate}
                onChange={(e) => {
                  setScheduleDate(e.target.value);
                  setError("");
                }}
                className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm font-medium"
                required
              />
              <p className="text-[10px] text-gray-400 italic">
                {t("posts.scheduleModal.hint") ||
                  "Valitse tulevaisuuden päivämäärä ja aika"}
              </p>
            </div>

            {/* Account Selector */}
            <div className="space-y-4 pt-6 border-t border-gray-50">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                  {t("posts.scheduleModal.selectChannels") || "Valitse kanavat"}
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">
                  {selectedAccounts.length}
                </span>
              </div>

              {loadingAccounts ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                </div>
              ) : socialAccounts?.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {socialAccounts.map((account) => {
                    const isSelected = selectedAccounts.includes(
                      account.mixpost_account_uuid,
                    );
                    return (
                      <button
                        key={account.mixpost_account_uuid}
                        onClick={() =>
                          toggleAccount(account.mixpost_account_uuid)
                        }
                        className={`flex items-center gap-3 p-3 rounded-2xl border transition-all text-left ${
                          isSelected
                            ? "border-blue-500 bg-blue-50/50 shadow-sm"
                            : "border-gray-100 hover:border-gray-200"
                        }`}
                      >
                        <img
                          src={account.profile_image_url}
                          className="w-8 h-8 rounded-lg object-cover"
                          alt=""
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-gray-900 truncate">
                            {account.account_name}
                          </div>
                          <div className="text-[9px] text-gray-400 uppercase tracking-tighter">
                            {account.provider}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-sm text-gray-400">
                  {t("posts.scheduleModal.noAccounts") ||
                    "Ei yhdistettyjä somekanavia"}
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-100 rounded-2xl p-4 animate-in fade-in duration-200">
                <p className="text-xs text-red-600 font-medium">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Action Bar */}
        <div className="px-8 py-6 border-t border-gray-100 bg-white flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-3 text-sm font-bold text-gray-400 hover:text-gray-900 transition-colors"
          >
            {t("posts.scheduleModal.cancel") || "Peruuta"}
          </button>
          <button
            onClick={handleConfirm}
            disabled={!scheduleDate || selectedAccounts.length === 0}
            className={`px-8 py-3 rounded-2xl text-sm font-bold transition-all ${
              scheduleDate && selectedAccounts.length > 0
                ? "bg-gray-900 text-white shadow-lg hover:bg-black active:scale-95"
                : "bg-gray-100 text-gray-300 cursor-not-allowed"
            }`}
          >
            {t("posts.scheduleModal.confirm") || "Aikatauluta"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default SchedulePostModal;
