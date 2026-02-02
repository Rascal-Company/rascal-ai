import React from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

export function EditContentModal({ isOpen, content, onClose, onSubmit }) {
  const { t } = useTranslation("common");

  if (!isOpen || !content) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      />
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl shadow-gray-500/10 border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        <div className="px-6 py-6 border-b border-gray-50 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 flex-shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-gray-900 truncate">{t("blogNewsletter.editModal.title") || "Muokkaa sisältöä"}</h2>
              <p className="text-xs text-gray-400 font-medium">{content.type === "Blog" ? "Blog" : "Newsletter"}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-gray-900 transition-colors flex-shrink-0"
          >
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
              id: content.id,
              title: formData.get("title"),
              caption: content.caption,
              blog_post: formData.get("blog_post"),
            });
          }}
          className="flex flex-col flex-1 overflow-hidden"
        >
          <div className="p-6 space-y-6 overflow-y-auto flex-1">
            {/* Thumbnail preview */}
            {content.thumbnail && content.thumbnail !== "/placeholder.png" && (
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-gray-50">
                <img
                  src={content.thumbnail}
                  alt="Thumbnail"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              </div>
            )}

            {/* Title input */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">
                Otsikko <span className="text-red-500">*</span>
              </label>
              <input
                name="title"
                type="text"
                required
                className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-base font-semibold"
                defaultValue={content.title}
                placeholder={t("placeholders.contentTitle")}
              />
            </div>

            {/* Type badge (read-only) */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tyyppi:</span>
              <span className="px-3 py-1 bg-gray-100 text-gray-600 text-[10px] font-bold uppercase tracking-wider rounded-lg">
                {content.type === "Blog" ? "Blog" : "Newsletter"}
              </span>
            </div>

            {/* Blog text */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">
                Blogiteksti
              </label>
              <textarea
                name="blog_post"
                rows={12}
                className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all text-sm font-medium resize-none font-mono"
                defaultValue={content.blog_post || ""}
                placeholder="Blogiteksti markdownina"
              />
            </div>

            {/* Markdown tips */}
            <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
              <div className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-2">Markdown-vinkit</div>
              <div className="flex flex-wrap gap-2 text-xs text-blue-800">
                <code className="px-2 py-0.5 bg-blue-100 rounded"># Otsikko 1</code>
                <code className="px-2 py-0.5 bg-blue-100 rounded">## Otsikko 2</code>
                <code className="px-2 py-0.5 bg-blue-100 rounded">**lihavoitu**</code>
                <code className="px-2 py-0.5 bg-blue-100 rounded">*kursiivi*</code>
              </div>
            </div>

            {/* Meta description (read-only) */}
            {content.meta_description && (
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                  Meta Description
                </h4>
                <p className="text-sm text-gray-600">{content.meta_description}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="px-6 py-4 border-t border-gray-50 flex items-center justify-between bg-gray-50/50 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors"
            >
              {t("blogNewsletter.actions.cancel")}
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-gray-900 hover:bg-black text-white text-xs font-bold uppercase tracking-widest rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95"
            >
              {t("blogNewsletter.actions.saveChanges")}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
