/**
 * Upload Post Modal (Import)
 * Tuo omia mediatiedostoja suoraan postauslistaan
 */

import React, { useState, useRef } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { supabase } from "../../../lib/supabase";

const UploadPostModal = ({ show, onClose, onSuccess, t, toast }) => {
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  if (!show) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    try {
      setLoading(true);
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session?.access_token) {
        throw new Error(t("posts.errors.loginRequired") || "Kirjaudu sisään");
      }

      const response = await axios.post("/api/content/import-post", formData, {
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
          "Content-Type": "multipart/form-data",
        },
        timeout: 60000,
      });

      if (response.data.success) {
        toast.success(
          t("posts.errors.importSuccess") || "Postaus tuotu onnistuneesti!",
        );
        onSuccess();
        onClose();
        setPreviewUrl(null);
      } else {
        throw new Error(
          response.data.error ||
            t("posts.errors.importFailed") ||
            "Tuonti epäonnistui",
        );
      }
    } catch (error) {
      toast.error(error.response?.data?.error || error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (file) => {
    if (!file) return;

    // Set file to input
    if (fileInputRef.current) {
      const dt = new DataTransfer();
      dt.items.add(file);
      fileInputRef.current.files = dt.files;
    }

    // Show preview for images
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setPreviewUrl(e.target.result);
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl shadow-emerald-500/10 border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-6 border-b border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
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
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {t("posts.importModal.title") || "Tuo julkaisu"}
              </h2>
              <p className="text-xs text-gray-500 font-medium">
                {t("posts.importModal.subtitle") || "Tuo omaa mediatiedostoa"}
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
            {/* Type */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">
                {t("posts.importModal.fields.type") || "Tyyppi"}
              </label>
              <select
                name="type"
                required
                className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-emerald-500 outline-none transition-all text-sm font-medium appearance-none cursor-pointer"
              >
                <option value="Photo">
                  {t("posts.typeOptions.photo") || "Photo"}
                </option>
                <option value="Reels">
                  {t("posts.typeOptions.reels") || "Reels"}
                </option>
                <option value="LinkedIn">
                  {t("posts.typeOptions.linkedin") || "LinkedIn"}
                </option>
              </select>
            </div>

            {/* Media Upload */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">
                {t("posts.importModal.fields.media") || "Media"}
              </label>
              <div
                className={`relative aspect-video rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center p-4 ${
                  dragActive
                    ? "border-emerald-500 bg-emerald-50/50"
                    : "border-gray-200 hover:border-gray-300 bg-gray-50/30"
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragActive(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleFileChange(file);
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <>
                    <svg
                      className="w-12 h-12 text-gray-300 mb-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <p className="text-sm font-bold text-gray-600 mb-1">
                      {t("posts.importModal.dragDrop") ||
                        "Vedä ja pudota tiedosto tähän"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {t("posts.importModal.orClick") ||
                        "tai klikkaa valitaksesi"}
                    </p>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  name="media"
                  type="file"
                  accept="image/*,video/*"
                  required
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileChange(file);
                  }}
                  className="hidden"
                />
              </div>
            </div>

            {/* Caption */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">
                {t("posts.importModal.fields.caption") ||
                  "Kuvateksti (valinnainen)"}
              </label>
              <textarea
                name="caption"
                rows={3}
                className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-emerald-500 outline-none transition-all text-sm font-medium resize-none"
                placeholder={
                  t("posts.importModal.captionPlaceholder") ||
                  "Lisää kuvateksti..."
                }
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-3 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors disabled:opacity-50"
            >
              {t("posts.importModal.cancel") || "Peruuta"}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-sm shadow-xl shadow-emerald-500/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  {t("posts.importModal.uploading") || "Lähetetään..."}
                </>
              ) : (
                t("posts.importModal.submit") || "Tuo julkaisu"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
};

export default UploadPostModal;
