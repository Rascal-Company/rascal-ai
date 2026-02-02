import React from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

export function CreateContentModal({ isOpen, onClose, onSubmit }) {
  const { t } = useTranslation("common");

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      />
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl shadow-blue-500/10 border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        <div className="px-6 py-6 border-b border-gray-50 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{t("blogNewsletter.createModal.title")}</h2>
              <p className="text-xs text-gray-500 font-medium">Luo uutta sisältöä tekoälyllä</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-gray-900 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            onSubmit({
              title: formData.get("title"),
              content: formData.get("content"),
              type: formData.get("type"),
            });
          }}
          className="p-6 space-y-6 overflow-y-auto flex-1"
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">
                {t("blogNewsletter.createModal.fields.title")} <span className="text-red-500">*</span>
              </label>
              <input
                name="title"
                type="text"
                required
                className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm font-medium"
                placeholder={t("blogNewsletter.createModal.placeholders.title")}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">
                {t("blogNewsletter.createModal.fields.type")} <span className="text-red-500">*</span>
              </label>
              <select
                name="type"
                required
                className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all text-sm font-medium appearance-none cursor-pointer"
              >
                <option value="blog">Blog</option>
                <option value="newsletter">Newsletter</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">
                {t("blogNewsletter.createModal.fields.content")} <span className="text-red-500">*</span>
              </label>
              <textarea
                name="content"
                rows={10}
                required
                className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all text-sm font-medium resize-none"
                placeholder={t("blogNewsletter.createModal.placeholders.content")}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors"
            >
              {t("blogNewsletter.actions.cancel")}
            </button>
            <button
              type="submit"
              className="flex-[2] py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-sm shadow-xl shadow-blue-500/20 transition-all active:scale-[0.98]"
            >
              {t("blogNewsletter.createModal.create")}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
