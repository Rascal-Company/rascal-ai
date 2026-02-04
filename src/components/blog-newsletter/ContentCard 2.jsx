import React from "react";
import { useTranslation } from "react-i18next";

export function ContentCard({
  content,
  onView,
  onPublish,
  onArchive,
  onDownload,
  onEdit,
  publishingId,
}) {
  const { t } = useTranslation("common");
  const isPublishing = publishingId === content.id;

  const getStatusStyles = (status) => {
    const s = status?.toLowerCase().replace(" ", "-");
    if (s === "valmis" || s === "done" || s === "julkaistu" || s === "published") {
      return "bg-emerald-50 text-emerald-600";
    }
    if (s === "tarkistuksessa" || s === "under-review") {
      return "bg-amber-50 text-amber-600";
    }
    if (s === "arkistoitu" || s === "archived") {
      return "bg-gray-100 text-gray-500";
    }
    return "bg-blue-50 text-blue-600";
  };

  return (
    <div className="group bg-white rounded-[28px] border border-gray-100 shadow-lg shadow-gray-200/20 overflow-hidden hover:shadow-xl hover:border-gray-200 transition-all duration-300">
      {/* Thumbnail */}
      <div className="relative aspect-[16/9] bg-gray-50 overflow-hidden">
        {content.thumbnail && content.thumbnail !== "/placeholder.png" ? (
          <>
            <img
              src={content.thumbnail}
              alt="thumbnail"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(e) => {
                e.target.src = "/placeholder.png";
              }}
            />
            <button
              className="absolute top-3 right-3 w-9 h-9 bg-white/90 hover:bg-white rounded-xl flex items-center justify-center text-gray-600 hover:text-gray-900 shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300"
              onClick={() => onDownload(content.thumbnail, content.title)}
              title={t("blogNewsletter.actions.download")}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7,10 12,15 17,10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </button>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
            <div className="text-4xl mb-2">📄</div>
            <div className="text-xs font-medium">{t("blogNewsletter.placeholders.noImage")}</div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 space-y-4">
        {/* Header with badges */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-[10px] font-bold uppercase tracking-wider rounded-lg">
              {content.type === "Blog"
                ? t("general.blog")
                : content.type === "Newsletter"
                  ? t("general.newsletter")
                  : content.type}
            </span>
            <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg ${getStatusStyles(content.status)}`}>
              {content.status}
            </span>
          </div>
          <h3 className="text-base font-bold text-gray-900 leading-snug line-clamp-2">
            {content.title.includes(".")
              ? content.title.split(".")[0] + "."
              : content.title}
          </h3>
        </div>

        {/* Caption */}
        <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">
          {content.meta_description
            ? content.meta_description.includes(".")
              ? content.meta_description.split(".")[0] + "."
              : content.meta_description
            : content.caption.includes(".")
              ? content.caption.split(".")[0] + "."
              : content.caption}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-50">
          <span className="text-xs text-gray-400 font-medium">
            {content.scheduledDate
              ? content.scheduledDate
              : content.createdAt || content.publishedAt}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onView(content)}
              className="px-3 py-1.5 text-[10px] font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors uppercase tracking-wider"
            >
              {t("blogNewsletter.actions.view")}
            </button>
            {content.status !== "Valmis" &&
              content.status !== "Done" &&
              content.status !== "Julkaistu" &&
              content.status !== "Published" &&
              content.status !== "Arkistoitu" &&
              content.status !== "Archived" && (
                <button
                  onClick={() => onEdit(content)}
                  className="px-3 py-1.5 text-[10px] font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors uppercase tracking-wider"
                >
                  {t("blogNewsletter.actions.edit")}
                </button>
              )}
            {content.status !== "Valmis" &&
              content.status !== "Done" &&
              content.status !== "Julkaistu" &&
              content.status !== "Published" &&
              content.status !== "Arkistoitu" &&
              content.status !== "Archived" && (
                <button
                  onClick={() => onPublish(content)}
                  disabled={isPublishing}
                  className="px-3 py-1.5 text-[10px] font-bold text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-colors uppercase tracking-wider disabled:opacity-50"
                >
                  {isPublishing
                    ? t("blogNewsletter.actions.publishing")
                    : t("blogNewsletter.actions.publish")}
                </button>
              )}
            {content.status !== "Arkistoitu" && content.status !== "Archived" && (
              <button
                onClick={() => onArchive(content)}
                className="px-3 py-1.5 text-[10px] font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors uppercase tracking-wider"
              >
                {t("blogNewsletter.actions.archive")}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
