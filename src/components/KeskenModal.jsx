import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "../lib/supabase";
import { getUserOrgId } from "../lib/getUserOrgId";
import KuvapankkiSelector from "./KuvapankkiSelector";
import CarouselSegmentsEditor from "./CarouselSegmentsEditor";
import ErrorDisplay from "./KeskenModal/ErrorDisplay";
import ModalActions from "./KeskenModal/ModalActions";
import CaptionEditor from "./KeskenModal/CaptionEditor";
import MediaPreview from "./KeskenModal/MediaPreview";

const KeskenModal = ({
  show,
  editingPost,
  user,
  onClose,
  onSave,
  t: tProp,
  userAccountType,
}) => {
  const { t: tHook } = useTranslation("common");
  const t = tProp || tHook;
  const [formData, setFormData] = useState({
    caption: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [imageLoading, setImageLoading] = useState(false);
  const [showMediaSourceMenu, setShowMediaSourceMenu] = useState(false);
  const [showKuvapankkiSelector, setShowKuvapankkiSelector] = useState(false);
  const fileInputRef = useRef(null);
  const carouselEditorRef = useRef(null);

  const validateMediaFile = (file) => {
    const validImageTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
    ];
    const validVideoTypes = ["video/mp4", "video/x-m4v"];
    const validTypes = [...validImageTypes, ...validVideoTypes];

    if (!validTypes.includes(file.type)) {
      return t("validation.fileTypeNotSupported", { type: file.type });
    }
    return null;
  };

  const hasUserEdited = useRef(false);
  const currentPostId = useRef(null);

  useEffect(() => {
    console.log("🚪 KeskenModal show changed:", show);
  }, [show]);

  useEffect(() => {
    if (editingPost) {
      if (currentPostId.current !== editingPost.id) {
        hasUserEdited.current = false;
        currentPostId.current = editingPost.id;
        setFormData({ caption: editingPost.caption || "" });
        return;
      }

      if (!hasUserEdited.current) {
        setFormData({ caption: editingPost.caption || "" });
      }
    }
  }, [editingPost]);

  const handleCaptionChange = (e) => {
    hasUserEdited.current = true;
    setFormData({ ...formData, caption: e.target.value });
  };

  if (!show || !editingPost) {
    if (!show) console.log("🔒 KeskenModal not showing because show is false");
    if (!editingPost)
      console.log("🔒 KeskenModal not showing because editingPost is null");
    return null;
  }

  const handleDeleteImage = async (imageUrl) => {
    if (!imageUrl) return;
    setImageLoading(true);
    setError("");
    try {
      const userId = await getUserOrgId(user?.id);
      if (!userId) {
        setError(t("keskenModal.errors.userNotFound"));
        return;
      }
      const response = await fetch("/api/content/media-management", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({ contentId: editingPost.id, imageUrl: imageUrl }),
      });
      if (!response.ok)
        throw new Error(t("keskenModal.errors.imageDeleteFailed"));
      onSave();
    } catch (err) {
      setError(
        t("keskenModal.errors.imageDeleteFailedWithDetails", {
          message: err.message,
        }),
      );
    } finally {
      setImageLoading(false);
    }
  };

  const handleAddImageFromKuvapankki = async (imageUrl) => {
    try {
      setImageLoading(true);
      setError("");
      const userId = await getUserOrgId(user?.id);
      if (!userId) {
        setError(t("keskenModal.errors.userNotFound"));
        return;
      }

      if (editingPost.media_urls && editingPost.media_urls.length > 0) {
        for (const oldImageUrl of editingPost.media_urls) {
          await fetch("/api/content/media-management", {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            },
            body: JSON.stringify({
              contentId: editingPost.id,
              imageUrl: oldImageUrl,
            }),
          });
        }
      }

      const imageResponse = await fetch(imageUrl);
      const imageBlob = await imageResponse.blob();
      const fileName = imageUrl.split("/").pop() || "kuvapankki.jpg";

      const uploadData = new FormData();
      uploadData.append("image", imageBlob, fileName);
      uploadData.append("contentId", editingPost.id);
      uploadData.append("userId", userId);
      uploadData.append("replaceMode", "true");

      const response = await fetch("/api/content/media-management", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: uploadData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          t("keskenModal.errors.imageUploadFailed", {
            error: errorData.error || response.statusText,
          }),
        );
      }

      const result = await response.json();
      const updatedPost = {
        ...editingPost,
        media_urls: [result.publicUrl],
        mediaUrls: [result.publicUrl],
        thumbnail: result.publicUrl,
      };

      setFormData((prev) => ({ ...prev, imageUpdated: Date.now() }));
      setShowKuvapankkiSelector(false);
      setTimeout(() => onSave(updatedPost), 100);
    } catch (err) {
      setError(
        t("keskenModal.errors.imageFromKuvapankkiFailed", {
          message: err.message,
        }),
      );
    } finally {
      setImageLoading(false);
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const validationError = validateMediaFile(file);
    if (validationError) {
      setError(validationError);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setImageLoading(true);
    setError("");

    try {
      const userId = await getUserOrgId(user?.id);
      if (!userId) {
        setError(t("keskenModal.errors.userNotFound"));
        return;
      }

      if (editingPost.media_urls && editingPost.media_urls.length > 0) {
        for (const imageUrl of editingPost.media_urls) {
          await fetch("/api/content/media-management", {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            },
            body: JSON.stringify({
              contentId: editingPost.id,
              imageUrl: imageUrl,
            }),
          });
        }
      }

      const uploadData = new FormData();
      uploadData.append("image", file);
      uploadData.append("contentId", editingPost.id);
      uploadData.append("userId", userId);
      uploadData.append("replaceMode", "true");

      const response = await fetch("/api/content/media-management", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: uploadData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          t("keskenModal.errors.imageUploadFailed", {
            error: errorData.error || response.statusText,
          }),
        );
      }

      const result = await response.json();

      try {
        const userId = await getUserOrgId(user?.id);
        if (userId && formData.caption !== undefined) {
          await supabase
            .from("content")
            .update({
              caption: formData.caption || null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", editingPost.id)
            .eq("user_id", userId);
        }
      } catch (captionError) {
        console.error("Error saving caption:", captionError);
      }

      const updatedPost = {
        ...editingPost,
        media_urls: [result.publicUrl],
        mediaUrls: [result.publicUrl],
        thumbnail: result.publicUrl,
        caption: formData.caption || editingPost.caption || "",
      };

      if (fileInputRef.current) fileInputRef.current.value = "";
      setFormData((prev) => ({ ...prev, imageUpdated: Date.now() }));
      setTimeout(() => onSave(updatedPost), 100);
    } catch (err) {
      setError(
        t("keskenModal.errors.imageUploadFailedGeneric", {
          message: err.message,
        }),
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
    } finally {
      setImageLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    console.log("🎯 handleSubmit called in KeskenModal");
    e.preventDefault();
    setLoading(true);
    setError("");

    if (formData.caption.length > 2000) {
      setError(t("keskenModal.errors.captionTooLong"));
      setLoading(false);
      return;
    }

    try {
      const userId = await getUserOrgId(user?.id);
      if (!userId) {
        setError(t("keskenModal.errors.userNotFound"));
        return;
      }

      // Save caption
      const { error: updateError } = await supabase
        .from("content")
        .update({
          caption: formData.caption || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingPost.id)
        .eq("user_id", userId);

      if (updateError) {
        setError(t("keskenModal.errors.saveFailed"));
        return;
      }

      console.log(
        "✅ Caption saved, checking carousel editor ref:",
        carouselEditorRef.current,
      );

      // Check if carousel editor has pending changes
      if (carouselEditorRef.current?.hasPendingChanges()) {
        console.log("🎠 Carousel editor has pending changes, triggering save");
        setLoading(false);
        // Trigger carousel editor's save which will show approval modal if needed
        carouselEditorRef.current.triggerSave();
        return;
      }

      // No carousel changes, just close modal
      onSave();
    } catch (err) {
      setError(t("keskenModal.errors.saveFailed"));
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-white/80 backdrop-blur-sm animate-in fade-in duration-500"
        onClick={onClose}
      />
      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-[0_32px_96px_-16px_rgba(0,0,0,0.1)] border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Simple Header */}
        <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-lg font-bold text-gray-900 leading-none">
              {t("keskenModal.title")}
            </h2>
            <p className="text-xs text-gray-400 mt-1.5">
              Edit your post caption and media
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
              ></path>
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto flex flex-col md:flex-row">
          {/* Left Side: Media Preview */}
          <div className="flex-1 p-8 bg-gray-50/30 overflow-y-auto custom-scrollbar">
            <div className="max-w-[400px] mx-auto space-y-6">
              <div className="bg-white rounded-[32px] border border-gray-100 p-2 shadow-sm">
                <MediaPreview
                  editingPost={editingPost}
                  userAccountType={userAccountType}
                  imageLoading={imageLoading}
                  showMediaSourceMenu={showMediaSourceMenu}
                  onToggleMediaSourceMenu={() =>
                    setShowMediaSourceMenu(!showMediaSourceMenu)
                  }
                  onSelectKuvapankki={() => {
                    setShowMediaSourceMenu(false);
                    setShowKuvapankkiSelector(true);
                  }}
                  onSelectKoneelta={() => fileInputRef.current?.click()}
                  onDeleteImage={handleDeleteImage}
                  fileInputRef={fileInputRef}
                  formData={formData}
                  t={t}
                />
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,video/mp4,video/x-m4v"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Right Side: Editors */}
          <div className="flex-1 p-8 border-l border-gray-50 overflow-y-auto custom-scrollbar bg-white">
            <form
              onSubmit={handleSubmit}
              className="space-y-8 h-full flex flex-col"
            >
              {(() => {
                const isCarousel = editingPost.type === "Carousel";
                const hasInProgressSegment = editingPost.segments?.some(
                  (s) => s.status === "In Progress",
                );
                const showSegmentsEditor =
                  isCarousel &&
                  editingPost.segments?.length > 0 &&
                  hasInProgressSegment;

                if (showSegmentsEditor) {
                  return (
                    <div className="space-y-8 flex-1">
                      <CaptionEditor
                        caption={formData.caption}
                        onChange={handleCaptionChange}
                        t={t}
                        height="300px"
                      />
                      <div className="pt-6 border-t border-gray-50">
                        <CarouselSegmentsEditor
                          ref={carouselEditorRef}
                          segments={editingPost.segments}
                          contentId={editingPost.id}
                          onSave={async () => {
                            // Call onSave without parameters to close the modal
                            onSave();
                          }}
                          t={t}
                        />
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="flex-1">
                    <CaptionEditor
                      caption={formData.caption}
                      onChange={handleCaptionChange}
                      t={t}
                      height="500px"
                    />
                  </div>
                );
              })()}

              <ErrorDisplay error={error} />
            </form>
          </div>
        </div>

        {/* Action Bar */}
        <div className="px-8 py-6 border-t border-gray-50 bg-white">
          <ModalActions
            onClose={onClose}
            onSave={handleSubmit}
            loading={loading}
            disabled={formData.caption.length > 2000}
            fileInputRef={fileInputRef}
            t={t}
          />
        </div>
      </div>

      {showKuvapankkiSelector &&
        createPortal(
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-xl animate-in fade-in duration-500"
              onClick={() => {
                setShowKuvapankkiSelector(false);
                setShowMediaSourceMenu(false);
              }}
            />
            <div className="relative w-full max-w-4xl bg-white rounded-[40px] shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-300">
              <KuvapankkiSelector
                onSelectImage={(imageUrl) =>
                  handleAddImageFromKuvapankki(imageUrl)
                }
                onClose={() => {
                  setShowKuvapankkiSelector(false);
                  setShowMediaSourceMenu(true);
                }}
              />
            </div>
          </div>,
          document.body,
        )}
    </div>,
    document.body,
  );
};

export default KeskenModal;
