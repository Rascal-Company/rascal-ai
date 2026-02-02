import React from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";

export function ViewContentModal({
  isOpen,
  content,
  onClose,
  onPublish,
  onDelete,
  publishingId,
}) {
  const { t, i18n } = useTranslation("common");

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
            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-600 flex-shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-gray-900 truncate">{content.title}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-gray-900 transition-colors flex-shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Thumbnail */}
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

          {/* Meta badges */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="px-3 py-1.5 bg-gray-100 text-gray-600 text-[10px] font-bold uppercase tracking-wider rounded-lg">
              {content.type === "Blog" ? t("general.blog") : t("general.newsletter")}
            </span>
            <span className="px-3 py-1.5 bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wider rounded-lg">
              {content.status}
            </span>
            <span className="text-xs text-gray-400 font-medium">
              {content.createdAt
                ? new Date(content.createdAt).toLocaleDateString(i18n.language === "fi" ? "fi-FI" : "en-US")
                : t("blogNewsletter.placeholders.noDate")}
            </span>
          </div>

          {/* Content body */}
          <div className="prose prose-gray prose-sm max-w-none">
            {content.blog_post ? (
              <ReactMarkdown>{content.blog_post}</ReactMarkdown>
            ) : content.caption ? (
              <ReactMarkdown>{content.caption}</ReactMarkdown>
            ) : (
              <p className="text-gray-400 italic">{t("blogNewsletter.placeholders.noContent")}</p>
            )}
          </div>

          {/* Original idea */}
          {content.idea && content.idea !== content.title && (
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                {t("blogNewsletter.viewModal.originalIdea")}
              </h4>
              <p className="text-sm text-gray-600">{content.idea}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-gray-50 flex items-center justify-between bg-gray-50/50 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors"
          >
            {t("blogNewsletter.actions.close")}
          </button>
          <div className="flex items-center gap-3">
            {content.status !== "Valmis" &&
              content.status !== "Done" &&
              content.status !== "Julkaistu" &&
              content.status !== "Published" &&
              content.status !== "Arkistoitu" &&
              content.status !== "Archived" && (
                <button
                  onClick={() => onPublish(content)}
                  disabled={publishingId === content.id}
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all disabled:opacity-50"
                >
                  {publishingId === content.id
                    ? t("blogNewsletter.actions.publishing")
                    : t("blogNewsletter.actions.publish")}
                </button>
              )}
            <button
              onClick={() => {
                if (window.confirm(t("blogNewsletter.alerts.deleteConfirm"))) {
                  onDelete(content.id);
                  onClose();
                }
              }}
              className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all"
            >
              {t("blogNewsletter.actions.delete")}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
