import React, { useState, useRef } from "react";
import Button from "../Button";
import ConfirmPopover from "../ConfirmPopover";

function PostCard({
  post,
  onEdit,
  onDelete,
  onDuplicate,
  onPublish,
  onSchedule,
  onMoveToNext,
  onDragStart,
  onDragEnd,
  isDragging,
  hideActions = false,
  t,
  compact = false,
  isSelected = false,
  onSelect,
  onPreview,
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const deleteButtonRef = useRef(null);

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    setShowDeleteConfirm(false);
    onDelete(post);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  // Common media logic
  let mediaUrl = post.thumbnail;
  let isVideo = false;
  if (post.type === "Carousel" && post.segments?.length > 0) {
    const firstSegment =
      post.segments.find((seg) => seg.slide_no === 1) || post.segments[0];
    mediaUrl = firstSegment.media_urls?.[0];
  }
  if (mediaUrl) {
    isVideo =
      mediaUrl.includes(".mp4") ||
      mediaUrl.includes(".webm") ||
      mediaUrl.includes(".mov");
  }

  if (compact) {
    return (
      <div
        className={`group relative bg-white rounded-2xl border transition-all duration-300 flex items-center gap-4 p-3 hover:shadow-lg hover:border-blue-200 ${isDragging ? "opacity-50 scale-95" : ""} ${isSelected ? "border-blue-500 bg-blue-50/30 ring-1 ring-blue-500" : "border-gray-100 shadow-sm shadow-gray-200/10"}`}
        draggable={true}
        onDragStart={(e) => onDragStart(e, post)}
        onDragEnd={onDragEnd}
        onClick={(e) => {
          if (e.metaKey || e.ctrlKey) {
            onSelect?.(post);
          } else if (hideActions) {
            onEdit(post);
          }
        }}
      >
        <div className="relative w-20 h-20 flex-shrink-0 rounded-2xl overflow-hidden bg-gray-50 border border-gray-100">
          {mediaUrl ? (
            isVideo ? (
              <video src={mediaUrl} className="w-full h-full object-cover" />
            ) : (
              <img
                src={mediaUrl}
                alt="prev"
                className="w-full h-full object-cover"
              />
            )
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
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
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                ></path>
              </svg>
            </div>
          )}
          {isSelected && (
            <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
              <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white">
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="3"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 py-0.5">
          <span
            className={`text-[8px] font-black uppercase tracking-tight px-1.5 py-0.5 rounded-md inline-block mb-1 ${
              post.type === "Reels"
                ? "bg-indigo-50 text-indigo-600"
                : post.type === "Carousel"
                  ? "bg-blue-50 text-blue-600"
                  : "bg-gray-50 text-gray-500"
            }`}
          >
            {post.type}
          </span>
          <p className="text-[10px] text-gray-500 line-clamp-2 leading-relaxed mb-1">
            {post.caption || t("posts.carouselsTab.postCard.noDescription")}
          </p>
          <span className="text-[9px] font-medium text-gray-400">
            {post.originalData?.created_at
              ? new Date(post.originalData.created_at).toLocaleDateString(
                  t("common.locale") === "fi" ? "fi-FI" : "en-US",
                )
              : "--"}
          </span>
        </div>

        <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
          {!hideActions && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(post);
              }}
              className="p-1.5 hover:bg-gray-50 text-gray-400 hover:text-blue-600 rounded-lg transition-colors"
            >
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                ></path>
              </svg>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`group relative bg-white rounded-[32px] border transition-all duration-500 overflow-hidden flex flex-col h-full hover:shadow-2xl hover:shadow-blue-500/10 hover:border-blue-100 ${isDragging ? "opacity-50 ring-2 ring-blue-500 ring-offset-4 scale-95 shadow-2xl" : "border-gray-100 shadow-xl shadow-gray-200/20"} ${isSelected ? "ring-2 ring-blue-500 border-blue-200" : ""} ${hideActions ? "cursor-pointer active:scale-[0.98]" : ""}`}
      draggable={true}
      onDragStart={(e) => onDragStart(e, post)}
      onDragEnd={onDragEnd}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey) {
          onSelect?.(post);
        } else if (hideActions) {
          onEdit(post);
        }
      }}
    >
      {isSelected && (
        <div className="absolute top-4 right-4 z-20">
          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-lg border-2 border-white">
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="3"
                d="M5 13l4 4L19 7"
              ></path>
            </svg>
          </div>
        </div>
      )}

      <div className="relative aspect-[4/3] overflow-hidden bg-gray-50">
        {mediaUrl ? (
          isVideo ? (
            <video
              src={mediaUrl}
              muted
              loop
              playsInline
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            />
          ) : (
            <img
              src={mediaUrl}
              alt="preview"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            />
          )
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-200 bg-gray-50 group-hover:bg-gray-100 transition-colors">
            <svg
              className="w-8 h-8 mb-2 opacity-30"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              ></path>
            </svg>
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">
              {t("posts.carouselsTab.postCard.noMedia")}
            </span>
          </div>
        )}

        <div className="absolute top-4 left-4 flex flex-wrap gap-2 z-10 transition-transform group-hover:translate-y-px">
          <span
            className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest shadow-lg backdrop-blur-md flex items-center gap-1.5 border border-white/20 ${
              post.type === "Reels"
                ? "bg-indigo-600/90 text-white"
                : post.type === "Carousel"
                  ? "bg-blue-500/90 text-white"
                  : "bg-white/90 text-gray-900 border-gray-100"
            }`}
          >
            {post.type === "Carousel" && (
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            )}
            {post.type}
          </span>
          {post.source === "mixpost" && post.provider && (
            <span className="px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest shadow-lg backdrop-blur-md bg-gray-900/90 text-white border border-white/10 uppercase italic">
              {post.provider}
            </span>
          )}
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-500" />
      </div>

      <div className="p-6 flex flex-col flex-1 gap-4">
        <div className="space-y-1.5">
          <h3
            className="text-sm font-bold text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors"
            title={post.title}
          >
            {post.title || t("posts.carouselsTab.postCard.untitled")}
          </h3>
          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed font-medium">
            {post.caption || t("posts.carouselsTab.postCard.noDescription")}
          </p>
        </div>

        <div className="mt-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50" />
            {post.originalData?.created_at && (
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                {new Date(post.originalData.created_at).toLocaleDateString(
                  t("common.locale") === "fi" ? "fi-FI" : "en-US",
                )}
              </span>
            )}
          </div>

          <div className="flex gap-2 isolate translate-y-0 opacity-100 md:translate-y-2 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 transition-all duration-300">
            {!hideActions && post.status !== "Julkaistu" && (
              <>
                {onPreview && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPreview(post);
                    }}
                    className="p-2 bg-white text-gray-600 rounded-xl shadow-lg border border-gray-100 hover:bg-gray-50 hover:text-purple-600 transition-all hover:scale-110 active:scale-95"
                    title={t("posts.actions.preview") || "Esikatsele"}
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  </button>
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(post);
                  }}
                  className="p-2 bg-white text-gray-600 rounded-xl shadow-lg border border-gray-100 hover:bg-gray-50 hover:text-blue-600 transition-all hover:scale-110 active:scale-95"
                  title={t("posts.actions.edit")}
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    ></path>
                  </svg>
                </button>

                {onDuplicate && post.source === "supabase" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicate(post);
                    }}
                    className="p-2 bg-white text-gray-600 rounded-xl shadow-lg border border-gray-100 hover:bg-gray-50 hover:text-indigo-600 transition-all hover:scale-110 active:scale-95"
                    title={t("posts.carouselsTab.postCard.duplicate")}
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"
                      ></path>
                    </svg>
                  </button>
                )}

                <button
                  ref={deleteButtonRef}
                  onClick={handleDeleteClick}
                  className="p-2 bg-red-50 text-red-600 rounded-xl shadow-lg border border-red-100 hover:bg-red-500 hover:text-white transition-all hover:scale-110 active:scale-95"
                  title={t("posts.actions.delete")}
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    ></path>
                  </svg>
                </button>
              </>
            )}

            {post.status === "Julkaistu" && (
              <>
                {onPreview && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPreview(post);
                    }}
                    className="p-2 bg-white text-gray-600 rounded-xl shadow-lg border border-gray-100 hover:bg-gray-50 hover:text-purple-600 transition-all hover:scale-110 active:scale-95"
                    title={t("posts.actions.preview") || "Esikatsele"}
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  </button>
                )}
                {onDuplicate && post.source === "supabase" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicate(post);
                    }}
                    className="p-2 bg-blue-50 text-blue-600 rounded-xl shadow-lg border border-blue-100 hover:bg-blue-600 hover:text-white transition-all hover:scale-110 active:scale-95"
                    title={t("posts.carouselsTab.postCard.duplicateNew")}
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"
                      ></path>
                    </svg>
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {!hideActions && (
          <div className="flex gap-2 pt-2">
            {post.status === "Kesken" && post.source === "supabase" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveToNext(post, "Tarkistuksessa");
                }}
                className="w-full py-2.5 bg-gray-900 hover:bg-black text-white text-[10px] font-bold uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-gray-200"
              >
                {t("posts.columns.readyToPublish")}
              </button>
            )}

            {post.status === "Tarkistuksessa" && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveToNext(post, "Kesken");
                  }}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] font-bold uppercase tracking-widest rounded-2xl transition-all border border-gray-200"
                >
                  {t("posts.columns.inProgress")}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPublish(post);
                  }}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-emerald-500/20"
                >
                  {t("posts.actions.publish")}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <ConfirmPopover
        show={showDeleteConfirm}
        message={t("posts.alerts.deleteConfirm") || "Poistetaanko tämä?"}
        confirmText={t("posts.actions.delete") || "Poista"}
        cancelText={t("ui.buttons.cancel") || "Peruuta"}
        variant="danger"
        anchorElement={deleteButtonRef.current}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        t={t}
      />
    </div>
  );
}

export default PostCard;
