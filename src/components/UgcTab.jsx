import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { getUserOrgId } from "../lib/getUserOrgId";
import { useUgcPosts } from "../hooks/queries/useTabsData";

export default function UgcTab() {
  const { t, i18n } = useTranslation("common");
  const { user } = useAuth();

  // Use TanStack Query for UGC posts - replaces useState + useEffect
  const {
    data: ugcPosts = [],
    isLoading: ugcLoading,
    refetch: refetchUgcPosts,
  } = useUgcPosts();

  // Lataa tallennettu formData localStorageesta tai käytä oletusta
  const [ugcFormData, setUgcFormDataState] = useState(() => {
    try {
      const saved = localStorage.getItem("ugcFormData");
      if (saved) {
        const parsed = JSON.parse(saved);
        // Palauta tallennettu data, mutta productImage on aina null (ei voi tallentaa File-objektia)
        return {
          ...parsed,
          productImage: null, // File-objekti ei voi olla localStorage:ssa
        };
      }
    } catch (e) {
      console.error("Error loading UGC form data from localStorage:", e);
    }
    return {
      productName: "",
      productDetails: "",
      productImage: null,
      productImageUrl: null,
      contentType: "Kuva", // 'Kuva' tai 'Video'
      styleId: "", // Visuaalinen tyyli
      formatId: "", // Kuvan muoto
    };
  });

  // Wrapper-funktio joka tallentaa formDatan localStorageen
  // Tukee sekä objektia että funktionaalista päivitystä (prev => ...)
  const setUgcFormData = (dataOrUpdater) => {
    if (typeof dataOrUpdater === "function") {
      // Funktionaalinen päivitys
      setUgcFormDataState((prev) => {
        const newData = dataOrUpdater(prev);
        try {
          // Tallenna localStorageen (ilman productImage File-objektia)
          const toSave = { ...newData, productImage: null };
          localStorage.setItem("ugcFormData", JSON.stringify(toSave));
        } catch (e) {
          console.error("Error saving UGC form data to localStorage:", e);
        }
        return newData;
      });
    } else {
      // Suora objekti
      setUgcFormDataState(dataOrUpdater);
      try {
        // Tallenna localStorageen (ilman productImage File-objektia)
        const toSave = { ...dataOrUpdater, productImage: null };
        localStorage.setItem("ugcFormData", JSON.stringify(toSave));
      } catch (e) {
        console.error("Error saving UGC form data to localStorage:", e);
      }
    }
  };

  const [ugcUploading, setUgcUploading] = useState(false);
  const [productDragActive, setProductDragActive] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: "" });

  // UGC data fetching now handled by TanStack Query hook above

  // UGC kuvan upload handler
  const handleImageUpload = async (file, type) => {
    if (!file) return null;

    try {
      setUgcUploading(true);

      // Upload kuva Supabase temp-ingest bucketiin
      const userId = await getUserOrgId(user.id);
      if (!userId) {
        throw new Error(t("posts.ugcTab.userIdNotFound"));
      }

      const bucket = "temp-ingest";
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const path = `${userId}/ugc/${Date.now()}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          upsert: true,
          contentType: file.type || "image/jpeg",
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      // Hae julkinen URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(path);

      const imageUrl = urlData.publicUrl;

      // Päivitä form data
      if (type === "product") {
        setUgcFormData((prev) => ({
          ...prev,
          productImageUrl: imageUrl,
          productImage: file,
        }));
      }

      return imageUrl;
    } catch (err) {
      console.error("Error uploading image:", err);
      setToast({
        visible: true,
        message: t("posts.ugcTab.uploadError") + ": " + err.message,
      });
      setTimeout(() => setToast({ visible: false, message: "" }), 3000);
      return null;
    } finally {
      setUgcUploading(false);
    }
  };

  // Muunna formatId aspectRatio:ksi
  const getAspectRatio = (formatId) => {
    switch (formatId) {
      case "social_story":
        return "9:16";
      case "feed_square":
        return "1:1";
      case "web_landscape":
        return "16:9";
      default:
        return "";
    }
  };

  // UGC form submit handler
  const handleUgcSubmit = async (e) => {
    e.preventDefault();

    // Validoi pakolliset kentät
    if (
      !ugcFormData.productName.trim() ||
      !ugcFormData.productDetails.trim() ||
      !ugcFormData.productImageUrl ||
      !ugcFormData.contentType ||
      !ugcFormData.styleId ||
      !ugcFormData.formatId
    ) {
      setToast({ visible: true, message: t("posts.ugcTab.formError") });
      setTimeout(() => setToast({ visible: false, message: "" }), 3000);
      return;
    }

    try {
      setUgcUploading(true);

      // Hae session token autentikointia varten
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        throw new Error("Session expired or invalid. Please log in again.");
      }

      // Laske aspectRatio formatId:n perusteella
      const aspectRatio = getAspectRatio(ugcFormData.formatId);

      // Lähetä data N8N:ään
      const response = await axios.post(
        "/api/content/ugc-video",
        {
          productName: ugcFormData.productName,
          productDetails: ugcFormData.productDetails,
          productImageUrl: ugcFormData.productImageUrl,
          contentType: ugcFormData.contentType,
          styleId: ugcFormData.styleId,
          formatId: ugcFormData.formatId,
          aspectRatio: aspectRatio,
        },
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        },
      );

      if (response.data.success) {
        setToast({ visible: true, message: t("posts.ugcTab.requestSuccess") });
        setTimeout(() => setToast({ visible: false, message: "" }), 3000);

        // Tyhjennä formi ja localStorage
        const emptyFormData = {
          productName: "",
          productDetails: "",
          productImage: null,
          productImageUrl: null,
          contentType: "Kuva",
          styleId: "",
          formatId: "",
        };
        setUgcFormData(emptyFormData);
        localStorage.removeItem("ugcFormData");

        // Päivitä lista
        await refetchUgcPosts();
      }
    } catch (err) {
      console.error("Error sending UGC request:", err);
      setToast({
        visible: true,
        message:
          t("posts.ugcTab.requestError") +
          ": " +
          (err.response?.data?.error || err.message),
      });
      setTimeout(() => setToast({ visible: false, message: "" }), 3000);
    } finally {
      setUgcUploading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-10 items-start">
      {/* Left Sidebar: Form */}
      <div className="w-full lg:w-1/3 lg:sticky lg:top-6">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900">
              {t("posts.ugcTab.title")}
            </h3>
          </div>

          <form onSubmit={handleUgcSubmit} className="space-y-6">
            {/* Content Type Selector */}
            <div className="space-y-3">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                {t("posts.ugcTab.contentType")}
              </label>
              <div className="flex p-1 bg-gray-50 rounded-xl">
                {["Kuva", "Video"].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() =>
                      setUgcFormData({ ...ugcFormData, contentType: type })
                    }
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                      ugcFormData.contentType === type
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    {type === "Kuva"
                      ? t("posts.ugcTab.image")
                      : t("posts.ugcTab.video")}
                  </button>
                ))}
              </div>
            </div>

            {/* Product Image Upload */}
            <div className="space-y-3">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                {t("posts.ugcTab.productImage")}
              </label>
              {ugcFormData.productImageUrl ? (
                <div className="relative group aspect-video rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                  <img
                    src={ugcFormData.productImageUrl}
                    alt="Tuote"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                    <button
                      type="button"
                      onClick={() =>
                        setUgcFormData((prev) => ({
                          ...prev,
                          productImageUrl: null,
                          productImage: null,
                        }))
                      }
                      className="px-4 py-2 bg-white text-red-600 rounded-xl text-xs font-bold shadow-xl hover:scale-105 transition-transform"
                    >
                      {t("posts.ugcTab.removeImage")}
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className={`relative aspect-video rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center p-6 text-center ${
                    productDragActive
                      ? "border-blue-500 bg-blue-50/50"
                      : "border-gray-200 hover:border-gray-300 bg-gray-50/30"
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setProductDragActive(true);
                  }}
                  onDragLeave={() => setProductDragActive(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setProductDragActive(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file?.type.startsWith("image/"))
                      handleImageUpload(file, "product");
                  }}
                  onClick={() =>
                    document.getElementById("ugc-product-image").click()
                  }
                >
                  <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <svg
                      className="w-6 h-6 text-gray-400"
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
                  <p className="text-xs font-bold text-gray-900 mb-1">
                    {t("posts.ugcTab.selectProductImage")}
                  </p>
                  <p className="text-[10px] text-gray-400">
                    {t("posts.ugcTab.imageHint")}
                  </p>
                  <input
                    type="file"
                    id="ugc-product-image"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file, "product");
                    }}
                    className="hidden"
                  />
                </div>
              )}
            </div>

            {/* Product Inputs */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">
                  {t("posts.ugcTab.productName")}
                </label>
                <input
                  type="text"
                  value={ugcFormData.productName}
                  onChange={(e) =>
                    setUgcFormData({
                      ...ugcFormData,
                      productName: e.target.value,
                    })
                  }
                  placeholder={t("posts.ugcTab.productNamePlaceholder")}
                  className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">
                  {t("posts.ugcTab.productDetails")}
                </label>
                <textarea
                  value={ugcFormData.productDetails}
                  onChange={(e) =>
                    setUgcFormData({
                      ...ugcFormData,
                      productDetails: e.target.value,
                    })
                  }
                  placeholder={t("posts.ugcTab.productDetailsPlaceholder")}
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm font-medium resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">
                    {t("posts.ugcTab.style")}
                  </label>
                  <select
                    value={ugcFormData.styleId}
                    onChange={(e) =>
                      setUgcFormData({
                        ...ugcFormData,
                        styleId: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all text-sm font-medium appearance-none cursor-pointer"
                  >
                    <option value="">{t("posts.ugcTab.select")}</option>
                    <option value="studio_clean">
                      {t("posts.ugcTab.styles.studio")}
                    </option>
                    <option value="lifestyle_home">
                      {t("posts.ugcTab.styles.lifestyle")}
                    </option>
                    <option value="premium_luxury">
                      {t("posts.ugcTab.styles.premium")}
                    </option>
                    <option value="nature_organic">
                      {t("posts.ugcTab.styles.nature")}
                    </option>
                    <option value="urban_street">
                      {t("posts.ugcTab.styles.urban")}
                    </option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">
                    {t("posts.ugcTab.format")}
                  </label>
                  <select
                    value={ugcFormData.formatId}
                    onChange={(e) =>
                      setUgcFormData({
                        ...ugcFormData,
                        formatId: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all text-sm font-medium appearance-none cursor-pointer"
                  >
                    <option value="">{t("posts.ugcTab.select")}</option>
                    <option value="social_story">
                      {t("posts.ugcTab.formats.story")}
                    </option>
                    <option value="feed_square">
                      {t("posts.ugcTab.formats.square")}
                    </option>
                    <option value="web_landscape">
                      {t("posts.ugcTab.formats.landscape")}
                    </option>
                  </select>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-gray-900 hover:bg-black text-white rounded-2xl font-bold text-sm shadow-xl shadow-gray-200 transition-all disabled:opacity-50 disabled:bg-gray-400 flex items-center justify-center gap-2"
              disabled={
                ugcUploading ||
                !ugcFormData.productName.trim() ||
                !ugcFormData.productImageUrl ||
                !ugcFormData.styleId ||
                !ugcFormData.formatId
              }
            >
              {ugcUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  {t("posts.ugcTab.sending")}
                </>
              ) : (
                t("posts.ugcTab.generate")
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Right Content: Grid */}
      <div className="w-full lg:w-2/3">
        {ugcLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="aspect-[4/5] bg-gray-100 rounded-3xl animate-pulse"
              />
            ))}
          </div>
        ) : ugcPosts.length === 0 ? (
          <div className="py-32 flex flex-col items-center justify-center text-center bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-100">
            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-3xl mb-4 grayscale opacity-50">
              📁
            </div>
            <p className="text-gray-500 font-medium max-w-xs">
              {t("posts.ugcTab.empty")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {ugcPosts.map((post) => {
              const mediaUrl = post.media_urls?.[0];
              const isVideo =
                mediaUrl &&
                (mediaUrl.includes(".mp4") ||
                  mediaUrl.includes(".webm") ||
                  mediaUrl.includes(".mov"));

              return (
                <div
                  key={post.id}
                  className="group bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col"
                >
                  <div className="relative aspect-[4/5] bg-gray-50 overflow-hidden">
                    {mediaUrl ? (
                      isVideo ? (
                        <video
                          src={mediaUrl}
                          controls
                          className="w-full h-full object-cover"
                          preload="metadata"
                        />
                      ) : (
                        <img
                          src={mediaUrl}
                          alt={post.idea}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                      )
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                        <svg
                          className="w-12 h-12 mb-2 opacity-50"
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
                        <span className="text-[10px] font-bold uppercase tracking-widest">
                          {t("posts.ugcTab.processing")}
                        </span>
                      </div>
                    )}

                    <div className="absolute top-4 left-4 flex gap-2">
                      <span className="px-2 py-1 bg-white/90 backdrop-blur-md rounded-lg text-[9px] font-bold uppercase tracking-widest shadow-sm text-gray-900 border border-white/50">
                        {post.type}
                      </span>
                    </div>

                    <div className="absolute top-4 right-4">
                      <span
                        className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest shadow-sm border border-white/50 backdrop-blur-md ${
                          post.status === "Valmis"
                            ? "bg-emerald-500/90 text-white"
                            : "bg-orange-500/90 text-white"
                        }`}
                      >
                        {post.status === "Valmis"
                          ? t("posts.ugcTab.ready")
                          : post.status}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 flex flex-col gap-2">
                    <h3 className="text-sm font-bold text-gray-900 line-clamp-1">
                      {post.idea || t("posts.ugcTab.untitled")}
                    </h3>
                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed h-8">
                      {post.caption || t("posts.ugcTab.loading")}
                    </p>
                    <div className="mt-2 pt-3 border-t border-gray-50 flex items-center justify-between">
                      <span className="text-[10px] font-medium text-gray-400">
                        {new Date(post.created_at).toLocaleDateString(
                          i18n.language === "en" ? "en-US" : "fi-FI",
                        )}
                      </span>
                      <button className="text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-widest">
                        {t("posts.ugcTab.viewDetails")}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
