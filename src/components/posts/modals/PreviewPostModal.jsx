/**
 * Preview Post Modal
 * Platform-specific preview of posts (Instagram, LinkedIn, Facebook style)
 * Supports Photos, Carousels, Reels, and Videos
 */

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useEscapeKey } from "../../../hooks/useEscapeKey";

/**
 * @param {Object} props
 * @param {boolean} props.show - Whether modal is shown
 * @param {Object} props.post - Post to preview
 * @param {Function} props.onClose - Close callback
 * @param {Function} props.t - Translation function
 */
const PreviewPostModal = ({ show, post, onClose, t }) => {
  const [platform, setPlatform] = useState("instagram");
  const [viewMode, setViewMode] = useState("mobile"); // 'mobile' | 'desktop'
  const [currentSlide, setCurrentSlide] = useState(0);

  // Close modal on Escape key
  useEscapeKey(onClose);

  if (!show || !post) return null;

  // Get media URLs
  const isCarousel = post.type === "Carousel";
  const segments = isCarousel ? post.segments || [] : [];
  const singleMediaUrl =
    post.thumbnail ||
    (post.media_urls && post.media_urls[0]) ||
    post.mediaUrls?.[0];

  const allMedia = isCarousel
    ? segments.map((seg) => ({
        url: seg.media_urls?.[0],
        caption: seg.text || "",
      }))
    : [{ url: singleMediaUrl, caption: post.caption || "" }];

  const currentMedia = allMedia[currentSlide] || allMedia[0];
  const isVideo =
    currentMedia?.url?.includes(".mp4") ||
    currentMedia?.url?.includes(".webm") ||
    currentMedia?.url?.includes(".mov");

  // Platform-specific styles
  const platforms = [
    { id: "instagram", label: "Instagram" },
    { id: "linkedin", label: "LinkedIn" },
    { id: "facebook", label: "Facebook" },
  ];

  const renderInstagramPreview = () => (
    <div className="bg-white rounded-none md:rounded-2xl overflow-hidden border border-gray-200 shadow-2xl max-w-[470px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 p-3 border-b border-gray-100">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400" />
        <div className="flex-1">
          <div className="text-sm font-semibold">your_brand</div>
          <div className="text-xs text-gray-500">Sponsored</div>
        </div>
        <button className="p-1">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="5" r="1.5" />
            <circle cx="12" cy="12" r="1.5" />
            <circle cx="12" cy="19" r="1.5" />
          </svg>
        </button>
      </div>

      {/* Media */}
      <div className="relative aspect-square bg-black">
        {currentMedia?.url ? (
          isVideo ? (
            <video
              src={currentMedia.url}
              controls
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              src={currentMedia.url}
              alt="Preview"
              className="w-full h-full object-cover"
            />
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white text-sm">
            No Media
          </div>
        )}

        {/* Carousel indicators */}
        {allMedia.length > 1 && (
          <>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {allMedia.map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    i === currentSlide ? "bg-blue-500 w-2" : "bg-white/60"
                  }`}
                />
              ))}
            </div>
            {currentSlide > 0 && (
              <button
                onClick={() => setCurrentSlide((prev) => prev - 1)}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center text-gray-900 hover:bg-white transition-all"
              >
                ‹
              </button>
            )}
            {currentSlide < allMedia.length - 1 && (
              <button
                onClick={() => setCurrentSlide((prev) => prev + 1)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center text-gray-900 hover:bg-white transition-all"
              >
                ›
              </button>
            )}
          </>
        )}
      </div>

      {/* Actions */}
      <div className="p-3 space-y-2">
        <div className="flex items-center gap-4">
          <svg
            className="w-7 h-7"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
          <svg
            className="w-7 h-7"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <svg
            className="w-7 h-7"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
            />
          </svg>
          <svg
            className="w-7 h-7 ml-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
            />
          </svg>
        </div>

        <div className="text-sm">
          <span className="font-semibold">1,234</span> likes
        </div>

        <div className="text-sm leading-relaxed whitespace-pre-wrap">
          <span className="font-semibold">your_brand</span>{" "}
          {currentMedia?.caption || post.caption || "No caption"}
        </div>

        <div className="text-sm text-gray-400">View all 42 comments</div>
        <div className="text-xs text-gray-400">2 HOURS AGO</div>
      </div>
    </div>
  );

  const renderLinkedInPreview = () => (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-2xl max-w-[550px] mx-auto">
      {/* Header */}
      <div className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
            YB
          </div>
          <div className="flex-1">
            <div className="font-semibold text-sm">Your Brand</div>
            <div className="text-xs text-gray-500">1,234 followers</div>
            <div className="text-xs text-gray-400">2h • 🌐</div>
          </div>
          <button className="p-1">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="5" r="1.5" />
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="12" cy="19" r="1.5" />
            </svg>
          </button>
        </div>

        <div className="text-sm leading-relaxed whitespace-pre-wrap">
          {currentMedia?.caption || post.caption || "No caption"}
        </div>
      </div>

      {/* Media */}
      <div className="relative bg-black">
        {currentMedia?.url ? (
          isVideo ? (
            <video
              src={currentMedia.url}
              controls
              className="w-full max-h-[400px] object-contain"
            />
          ) : (
            <img
              src={currentMedia.url}
              alt="Preview"
              className="w-full max-h-[400px] object-contain"
            />
          )
        ) : (
          <div className="w-full h-64 flex items-center justify-center text-white text-sm">
            No Media
          </div>
        )}

        {/* Carousel navigation */}
        {allMedia.length > 1 && (
          <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full text-white text-xs font-medium">
            {currentSlide + 1} / {allMedia.length}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-3 border-t border-gray-100">
        <div className="flex items-center justify-between text-xs text-gray-600 mb-3">
          <div>👍 ❤️ 💡 1,234</div>
          <div>42 comments • 12 reposts</div>
        </div>

        <div className="flex gap-1">
          {["Like", "Comment", "Repost", "Send"].map((action) => (
            <button
              key={action}
              className="flex-1 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded transition-colors"
            >
              {action}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderFacebookPreview = () => (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-2xl max-w-[500px] mx-auto">
      {/* Header */}
      <div className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-500" />
          <div className="flex-1">
            <div className="font-semibold text-sm">Your Brand</div>
            <div className="text-xs text-gray-500">2h • 🌐</div>
          </div>
          <button className="p-1">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="5" r="1.5" />
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="12" cy="19" r="1.5" />
            </svg>
          </button>
        </div>

        <div className="text-sm leading-relaxed whitespace-pre-wrap">
          {currentMedia?.caption || post.caption || "No caption"}
        </div>
      </div>

      {/* Media */}
      <div className="relative bg-black">
        {currentMedia?.url ? (
          isVideo ? (
            <video
              src={currentMedia.url}
              controls
              className="w-full max-h-[500px] object-cover"
            />
          ) : (
            <img
              src={currentMedia.url}
              alt="Preview"
              className="w-full max-h-[500px] object-cover"
            />
          )
        ) : (
          <div className="w-full h-64 flex items-center justify-center text-white text-sm">
            No Media
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-3 border-t border-gray-100">
        <div className="flex items-center justify-between text-xs text-gray-600 mb-3">
          <div>👍 ❤️ 😮 1.2K</div>
          <div>42 comments • 12 shares</div>
        </div>

        <div className="flex gap-1">
          {["👍 Like", "💬 Comment", "↗️ Share"].map((action) => (
            <button
              key={action}
              className="flex-1 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded transition-colors"
            >
              {action}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-6xl h-[90vh] bg-gray-50 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-gray-900">
                {t("posts.preview.title") || "Esikatsele julkaisu"}
              </h2>
              <p className="text-sm text-gray-500 mt-1 font-medium">
                {post.title ||
                  t("posts.preview.subtitle") ||
                  "Katso miltä julkaisu näyttää"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-900 transition-all"
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
        </div>

        {/* Controls */}
        <div className="px-8 py-4 bg-white border-b border-gray-200 flex items-center justify-between gap-4">
          {/* Platform selector */}
          <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
            {platforms.map((p) => (
              <button
                key={p.id}
                onClick={() => setPlatform(p.id)}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                  platform === p.id
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* View mode toggle */}
          <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode("mobile")}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                viewMode === "mobile"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              {t("posts.preview.mobile") || "Mobile"}
            </button>
            <button
              onClick={() => setViewMode("desktop")}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                viewMode === "desktop"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              {t("posts.preview.desktop") || "Desktop"}
            </button>
          </div>
        </div>

        {/* Preview Area */}
        <div className="flex-1 overflow-y-auto p-8">
          <div
            className={`mx-auto transition-all duration-300 ${
              viewMode === "mobile" ? "max-w-[375px]" : "max-w-4xl"
            }`}
          >
            {platform === "instagram" && renderInstagramPreview()}
            {platform === "linkedin" && renderLinkedInPreview()}
            {platform === "facebook" && renderFacebookPreview()}
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 bg-white border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500">
              {t("posts.preview.tip") ||
                "Esikatselu näyttää arvion julkaisusta"}
            </div>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-900 hover:bg-black text-white rounded-xl font-bold text-sm transition-all hover:scale-105 active:scale-95"
            >
              {t("ui.buttons.close") || "Sulje"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default PreviewPostModal;
