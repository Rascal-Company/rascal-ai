/**
 * Create Post Modal
 * Generoi uusia julkaisuja tekoälyllä
 * Siirretty ManagePostsPage:sta erilliseksi komponentiksi
 */

import React, { useState } from "react";
import { createPortal } from "react-dom";

const CreatePostModal = ({ show, onClose, onSubmit, t, toast }) => {
  const [count, setCount] = useState(1);

  if (!show) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const title = formData.get("title")?.trim() || "";
    const countValue = parseInt(count, 10);
    const validCount = !isNaN(countValue)
      ? Math.min(Math.max(countValue, 1), 10)
      : 1;
    const type = formData.get("type") || "";

    // Validointi
    if (validCount === 1 && !title) {
      toast.warning(t("errors.titleRequired") || "Otsikko vaaditaan");
      return;
    }
    if (validCount === 1 && !type) {
      toast.warning(t("errors.typeRequired") || "Tyyppi vaaditaan");
      return;
    }

    onSubmit({
      title: title,
      type: type,
      caption: formData.get("caption"),
      count: validCount,
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl shadow-blue-500/10 border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-6 border-b border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
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
                  d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {t("posts.createModal.title") || "Generoi uusi julkaisu"}
              </h2>
              <p className="text-xs text-gray-500 font-medium">
                {t("posts.createModal.subtitle") ||
                  "Luo tekoälyllä uutta sisältöä"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-gray-900 transition-colors"
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            {/* Otsikko */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">
                {t("posts.createModal.titleLabel") || "Otsikko"}{" "}
                {count === 1 && <span className="text-red-500">*</span>}
              </label>
              <input
                name="title"
                type="text"
                className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm font-medium"
                placeholder={
                  t("posts.createModal.titlePlaceholder") ||
                  "Esim. Kesäkampanja 2024"
                }
              />
              {count > 1 && (
                <p className="text-[10px] text-gray-400 px-1 italic">
                  {t("posts.createModal.titleOptionalHint") ||
                    "Otsikko on valinnainen useamman julkaisun luonnissa"}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Tyyppi */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">
                  {t("posts.createModal.typeLabel") || "Tyyppi"}{" "}
                  {count === 1 && <span className="text-red-500">*</span>}
                </label>
                <select
                  name="type"
                  className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all text-sm font-medium appearance-none cursor-pointer"
                  defaultValue="Photo"
                >
                  <option value="All">
                    {t("posts.createModal.typeAll") || "Kaikki"}
                  </option>
                  <option value="Photo">
                    {t("posts.createModal.typePhoto") || "Photo"}
                  </option>
                  <option value="Carousel">
                    {t("posts.createModal.typeCarousel") || "Carousel"}
                  </option>
                  <option value="Reels">
                    {t("posts.createModal.typeReels") || "Reels"}
                  </option>
                  <option value="LinkedIn">
                    {t("posts.createModal.typeLinkedIn") || "LinkedIn"}
                  </option>
                </select>
              </div>

              {/* Lukumäärä */}
              <div className={`space-y-2 ${count === 1 ? "" : "col-span-2"}`}>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">
                  {t("posts.createModal.countLabel") || "Lukumäärä"}
                </label>
                <div className="flex items-center gap-3">
                  <input
                    name="count"
                    type="number"
                    min="1"
                    max="10"
                    value={count}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === "") {
                        setCount("");
                        return;
                      }
                      const n = parseInt(v, 10);
                      if (!isNaN(n)) setCount(Math.min(Math.max(n, 1), 10));
                    }}
                    onBlur={(e) => {
                      if (
                        e.target.value === "" ||
                        isNaN(parseInt(e.target.value, 10))
                      )
                        setCount(1);
                    }}
                    className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all text-sm font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Kuvaus */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">
                {t("posts.createModal.captionLabel") || "Kuvaus (valinnainen)"}
              </label>
              <textarea
                name="caption"
                rows={4}
                className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all text-sm font-medium resize-none"
                placeholder={
                  t("posts.createModal.captionPlaceholder") || "Lisää kuvaus..."
                }
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors"
            >
              {t("posts.createModal.cancel") || "Peruuta"}
            </button>
            <button
              type="submit"
              className="flex-[2] py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-sm shadow-xl shadow-blue-500/20 transition-all active:scale-[0.98]"
            >
              {t("posts.createModal.submit") || "Generoi julkaisut"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
};

export default CreatePostModal;
