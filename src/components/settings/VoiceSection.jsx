import React, { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useVoiceStatus, useVoiceUpload } from "../../hooks/queries";

export default function VoiceSection({ companyId }) {
  const { t } = useTranslation("common");
  const fileInputRef = useRef(null);
  const [uploadError, setUploadError] = useState("");
  const [pendingFile, setPendingFile] = useState(null);

  const {
    data: audioFiles = [],
    isLoading,
    error: fetchError,
  } = useVoiceStatus(companyId);

  const uploadMutation = useVoiceUpload(companyId);

  const handleAddAudio = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (audioFiles.length >= 1) return;

    setUploadError("");
    setPendingFile(file);

    uploadMutation.mutate(file, {
      onSuccess: () => {
        setPendingFile(null);
      },
      onError: (error) => {
        setUploadError(error.message || t("settings.voice.uploadError"));
        setPendingFile(null);
      },
    });

    e.target.value = "";
  };

  const openFileDialog = () => {
    if (audioFiles.length === 0 && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const hasAudio = audioFiles.length > 0;
  const loading = isLoading || uploadMutation.isPending;
  const error = fetchError ? t("settings.voice.fetchError") : uploadError;

  return (
    <div>
      <h2 className="m-0 mb-4 text-base font-semibold text-gray-800">
        {t("settings.voice.title")}
      </h2>
      {loading ? (
        <div className="text-gray-500 text-sm">
          {t("settings.voice.loading")}
        </div>
      ) : hasAudio || pendingFile ? (
        <div className="p-8 text-center bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border-2 border-dashed border-slate-300 relative overflow-hidden min-h-[200px] flex flex-col justify-center">
          <div className="absolute -top-1/2 -right-1/2 w-[200%] h-[200%] bg-[radial-gradient(circle,rgba(16,185,129,0.05)_0%,transparent_70%)] pointer-events-none" />

          <div className="relative z-[1]">
            {pendingFile ? (
              <>
                <div className="w-6 h-6 mx-auto mb-4 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                <div className="text-slate-700 text-base font-semibold mb-2">
                  {t("settings.voice.uploading")}
                </div>
                <div className="text-slate-500 text-[13px] leading-normal">
                  {pendingFile.name}
                </div>
              </>
            ) : (
              <>
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                  className="mx-auto mb-4 block"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  />
                </svg>
                <div className="text-slate-700 text-base font-semibold mb-2">
                  {t("settings.voice.cloned")}
                </div>
                <div className="text-slate-500 text-[13px] leading-normal">
                  {t("settings.voice.clonedDescription")}
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        <div
          className="p-8 text-center bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border-2 border-dashed border-slate-300 relative overflow-hidden cursor-pointer transition-all duration-200 min-h-[200px] flex flex-col justify-center hover:border-blue-500 hover:bg-gradient-to-br hover:from-blue-50 hover:to-blue-100"
          onClick={openFileDialog}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") openFileDialog();
          }}
          role="button"
          aria-label={t("settings.voice.addNewAria")}
        >
          <div className="absolute -top-1/2 -right-1/2 w-[200%] h-[200%] bg-[radial-gradient(circle,rgba(59,130,246,0.05)_0%,transparent_70%)] pointer-events-none" />

          <div className="relative z-[1]">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#9ca3af"
              strokeWidth="2"
              className="mx-auto mb-4 block"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4v16m8-8H4"
              />
            </svg>
            <div className="text-slate-700 text-base font-semibold mb-2">
              {t("settings.voice.addAudioFile")}
            </div>
            <div className="text-slate-500 text-[13px] leading-normal">
              {t("settings.voice.dragOrSelect")}
            </div>
          </div>
        </div>
      )}
      <input
        type="file"
        accept="audio/*"
        className="hidden"
        ref={fileInputRef}
        onChange={handleAddAudio}
        disabled={audioFiles.length >= 1}
      />
      {audioFiles.length === 0 && !pendingFile && (
        <div className="text-gray-500 text-[11px] mt-2">
          {t("settings.voice.infoNone", { count: audioFiles.length })}
        </div>
      )}
      {error && <div className="text-red-500 text-[11px] mt-1.5">{error}</div>}
    </div>
  );
}
