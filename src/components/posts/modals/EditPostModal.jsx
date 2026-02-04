/**
 * Edit Post Modal
 * Käsittelee julkaisun muokkauksen kaikilla ominaisuuksilla
 *
 * Kattaa:
 * - Caption editing
 * - Publish date
 * - Media preview
 * - Carousel segments editing
 * - Basic actions (save, delete, move to next status)
 */

import React, { useState, useRef } from "react";
import { createPortal } from "react-dom";
import CarouselSegmentsEditor from "../../CarouselSegmentsEditor";

const EditPostModal = ({
  show,
  post,
  onClose,
  onSave,
  onDelete,
  onMoveToNext,
  t,
}) => {
  const [caption, setCaption] = useState(post?.caption || "");
  const [publishDate, setPublishDate] = useState(post?.publishDate || "");
  const carouselEditorRef = useRef(null);

  if (!show || !post) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    // Check if carousel editor has pending changes
    if (carouselEditorRef.current?.hasPendingChanges()) {
      // Trigger carousel editor's save which will show approval modal if needed
      carouselEditorRef.current.triggerSave();
      return;
    }

    // No carousel changes, save normally
    onSave({
      caption,
      publishDate,
    });
  };

  // Get media URL (normalized)
  const mediaUrl =
    post.mediaUrls?.[0] || post.media_urls?.[0] || post.thumbnail;
  const isVideo =
    mediaUrl &&
    (mediaUrl.includes(".mp4") ||
      mediaUrl.includes(".webm") ||
      mediaUrl.includes("video"));

  const isCarousel = post.type === "Carousel";
  const charCount = caption.length;

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
              {post.status === "Tarkistuksessa"
                ? t("posts.editModal.viewTitle") || "Tarkista julkaisu"
                : t("posts.editModal.editTitle") || "Muokkaa julkaisua"}
            </h2>
            <p className="text-xs text-gray-400 mt-1.5">
              Status: {post.status} | Type: {post.type}
              {isCarousel &&
                post.segments?.length > 0 &&
                ` | ${post.segments.length} slidea`}
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

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto flex flex-col md:flex-row"
        >
          {/* Media Preview */}
          <div className="flex-1 p-8 bg-gray-50/30">
            <div className="max-w-[400px] mx-auto space-y-6">
              <div className="aspect-square bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                {mediaUrl ? (
                  isVideo ? (
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
                  <div className="h-full flex items-center justify-center text-gray-300 text-xs flex-col gap-2">
                    <svg
                      className="w-12 h-12"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span>{t("posts.editModal.noMedia") || "Ei mediaa"}</span>
                  </div>
                )}
              </div>

              {/* Info badges */}
              <div className="flex gap-2 flex-wrap">
                {post.voiceoverReady && (
                  <span className="px-3 py-1 bg-green-50 text-green-600 text-[10px] font-bold uppercase tracking-widest rounded-full">
                    Voiceover valmis
                  </span>
                )}
                {post.isGenerated && (
                  <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-widest rounded-full">
                    AI-generoitu
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Edit Fields */}
          <div className="flex-1 p-8 border-l border-gray-50 space-y-6 overflow-y-auto">
            {/* Caption */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                  {t("posts.editModal.caption") || "Kuvateksti"}
                </label>
                <span
                  className={`text-[10px] font-bold ${
                    charCount > 2000
                      ? "text-red-500"
                      : charCount > 1800
                        ? "text-orange-500"
                        : "text-blue-500"
                  }`}
                >
                  {charCount} / 2200
                </span>
              </div>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={isCarousel ? 4 : 8}
                className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm font-medium resize-none"
                placeholder={
                  t("posts.editModal.captionPlaceholder") ||
                  "Kirjoita kuvateksti..."
                }
              />
            </div>

            {/* Carousel Segments Editor */}
            {isCarousel && post.segments?.length > 0 && (
              <div className="pt-6 border-t border-gray-100">
                <CarouselSegmentsEditor
                  ref={carouselEditorRef}
                  segments={post.segments}
                  contentId={post.id}
                  onSave={() => {
                    // Close modal and refresh data
                    onSave({
                      caption,
                      publishDate,
                    });
                  }}
                  t={t}
                />
              </div>
            )}

            {/* Publish Date */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                {t("posts.editModal.publishDate") || "Julkaisupäivä"}
              </label>
              <input
                type="datetime-local"
                value={publishDate || ""}
                onChange={(e) => setPublishDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm font-medium"
              />
              <p className="text-[10px] text-gray-400 italic">
                {t("posts.editModal.publishDateHint") ||
                  "Jätä tyhjäksi jos ei ajastusta"}
              </p>
            </div>

            {/* Quick Actions */}
            {post.status === "Kesken" && (
              <div className="pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => onMoveToNext(post, "Tarkistuksessa")}
                  className="w-full px-4 py-3 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl text-sm font-bold transition-colors"
                >
                  {t("posts.editModal.moveToReview") ||
                    "Siirrä tarkistukseen →"}
                </button>
              </div>
            )}

            {post.status === "Tarkistuksessa" && (
              <div className="pt-4 border-t border-gray-100 space-y-2">
                <button
                  type="button"
                  onClick={() => onMoveToNext(post, "Aikataulutettu")}
                  className="w-full px-4 py-3 bg-green-50 hover:bg-green-100 text-green-600 rounded-xl text-sm font-bold transition-colors"
                >
                  {t("posts.editModal.approve") || "Hyväksy ja aikatauluta →"}
                </button>
                <button
                  type="button"
                  onClick={() => onMoveToNext(post, "Kesken")}
                  className="w-full px-4 py-3 bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-xl text-sm font-bold transition-colors"
                >
                  {t("posts.editModal.backToDraft") || "← Palauta luonnokseksi"}
                </button>
              </div>
            )}

            {/* Delete */}
            <div className="pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  if (
                    window.confirm(
                      t("posts.editModal.deleteConfirm") ||
                        "Haluatko varmasti poistaa tämän julkaisun?",
                    )
                  ) {
                    onDelete(post);
                  }
                }}
                className="w-full px-4 py-2 text-red-500 hover:bg-red-50 rounded-xl text-sm font-bold transition-colors"
              >
                {t("posts.editModal.delete") || "Poista julkaisu"}
              </button>
            </div>
          </div>
        </form>

        {/* Action Bar */}
        <div className="px-8 py-6 border-t border-gray-100 bg-white flex justify-end gap-3">
          <button
            onClick={onClose}
            type="button"
            className="px-6 py-3 text-sm font-bold text-gray-400 hover:text-gray-900 transition-colors"
          >
            {t("posts.editModal.cancel") || "Peruuta"}
          </button>
          <button
            onClick={handleSubmit}
            className="px-8 py-3 rounded-2xl text-sm font-bold bg-gray-900 text-white shadow-lg hover:bg-black active:scale-95 transition-all"
          >
            {t("posts.editModal.save") || "Tallenna muutokset"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default EditPostModal;
