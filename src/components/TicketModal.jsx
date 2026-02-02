import React, { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { supabase } from "../lib/supabase";

const TicketModal = ({ isOpen, onClose }) => {
  const { t } = useTranslation("common");
  const [formData, setFormData] = useState({
    page: "",
    description: "",
  });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success' | 'error' | null
  const [dragActive, setDragActive] = useState(false);
  const [fileError, setFileError] = useState("");
  const fileInputRef = useRef(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    addFiles(files);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    addFiles(files);
  };

  const addFiles = (files) => {
    setFileError(""); // Tyhjennä edelliset virheet

    const validFiles = [];
    const errors = [];

    files.forEach((file) => {
      const validTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
        "video/mp4",
        "video/webm",
        "video/quicktime",
        "audio/mp3",
        "audio/wav",
        "audio/mpeg",
        "audio/ogg",
      ];

      if (!validTypes.includes(file.type)) {
        errors.push(
          t("ticket.fileTypeNotSupported", {
            type: file.type,
            name: file.name,
          }),
        );
        return;
      }

      validFiles.push(file);
    });

    if (errors.length > 0) {
      setFileError(errors.join(". "));
    }

    setSelectedFiles((prev) => [...prev, ...validFiles].slice(0, 5)); // Max 5 files
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.page || !formData.description.trim()) {
      alert(t("ticket.fillAllRequired"));
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      // Hae käyttäjätiedot ja session
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const companyId = user?.companyId || user?.user?.companyId || "Unknown";

      // Hae session token
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();
      if (sessionError || !sessionData.session?.access_token) {
        throw new Error(t("ticket.sessionExpired"));
      }

      // Luo FormData
      const formDataToSend = new FormData();
      formDataToSend.append("page", formData.page);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("userEmail", user?.email || "Unknown");
      formDataToSend.append("companyId", companyId);
      formDataToSend.append("timestamp", new Date().toISOString());
      formDataToSend.append("userAgent", navigator.userAgent);

      // Lisää tiedostot
      selectedFiles.forEach((file, index) => {
        formDataToSend.append(`attachment_${index}`, file);
      });

      console.log("DEBUG - Sending ticket request:", {
        page: formData.page,
        filesCount: selectedFiles.length,
        userEmail: user?.email,
      });

      // Lähetä API endpointiin (ei suoraan N8N:ään)
      const response = await axios.post("/api/support/ticket", formDataToSend, {
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
        timeout: 60000, // 60s timeout (tiedostojen käsittely voi kestää)
      });

      if (response.status === 200 || response.status === 201) {
        setSubmitStatus("success");
        setFormData({ page: "", description: "" });
        setSelectedFiles([]);

        // Sulje modal 3 sekunnin kuluttua
        setTimeout(() => {
          onClose();
          setSubmitStatus(null);
        }, 3000);
      } else {
        throw new Error(t("ticket.unexpectedResponse"));
      }
    } catch (error) {
      console.error("Ticket submission error:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);

      // Näytä tarkempi virheviesti käyttäjälle
      if (error.response?.data?.details) {
        alert(
          t("ticket.errorDetails", { details: error.response.data.details }),
        );
      }

      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay modal-overlay--light" onClick={onClose}>
      <div
        className="modal-container max-w-[600px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 className="modal-title">{t("ticket.title")}</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-content">
          {submitStatus === "success" && (
            <div className="alert alert-success mb-5">
              {t("ticket.successMessage")}
            </div>
          )}

          {submitStatus === "error" && (
            <div className="alert alert-error mb-5">
              {t("ticket.errorMessage")}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="page">
                {t("ticket.pageLabel")}{" "}
                <span className="text-xs text-gray-500">
                  ({t("ticket.pageHint")})
                </span>
              </label>
              <input
                type="text"
                id="page"
                name="page"
                value={formData.page}
                onChange={handleInputChange}
                className="form-input"
                placeholder={t("ticket.pagePlaceholder")}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="description">
                {t("ticket.descriptionLabel")}{" "}
                <span className="text-xs text-gray-500">
                  ({t("ticket.descriptionHint")})
                </span>
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="form-textarea"
                rows="4"
                placeholder={t("ticket.descriptionPlaceholder")}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                {t("ticket.attachmentsLabel")}{" "}
                <span className="text-xs text-gray-500">
                  ({t("ticket.attachmentsHint")})
                </span>
              </label>

              <div
                className={`drag-drop-zone border-2 border-dashed border-gray-300 rounded-lg p-5 text-center cursor-pointer transition-all duration-300 ${
                  dragActive ? "drag-active bg-blue-50" : "bg-gray-50"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <p className="m-0 mb-1.5 font-medium text-sm block">
                  {t("ticket.dragDropText")}
                </p>
                <p className="m-0 mb-4 text-[13px] text-gray-400 block">
                  {t("ticket.dragDropHint")}
                </p>
                <p className="m-0 text-xs text-gray-500 block">
                  {t("ticket.supportedFiles")}
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*,audio/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              {fileError && (
                <div className="text-red-500 mt-2 py-2 px-3 bg-red-50 border border-red-200 rounded-md text-[13px]">
                  <div className="flex items-center gap-1.5">
                    <span>⚠️</span>
                    <span>{fileError}</span>
                  </div>
                </div>
              )}

              {selectedFiles.length > 0 && (
                <div className="mt-4">
                  <h4 className="m-0 mb-2.5 text-sm">
                    {t("ticket.selectedFiles")}
                  </h4>
                  {selectedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-md mb-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{file.name}</span>
                        <span className="text-xs text-gray-500">
                          ({(file.size / 1024 / 1024).toFixed(1)}MB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="bg-transparent border-none text-red-500 cursor-pointer text-base p-1"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {selectedFiles.length >= 5 && (
                    <p className="text-xs text-gray-500 mt-2 mb-0">
                      {t("general.maxFiles", { count: 5 })}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="form-actions flex gap-3 justify-end mt-5">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
                disabled={isSubmitting}
              >
                {t("common.cancel")}
              </button>
              <button
                type="submit"
                className="btn btn-primary min-w-[120px]"
                disabled={
                  isSubmitting || !formData.page || !formData.description.trim()
                }
              >
                {isSubmitting
                  ? t("ui.buttons.sending")
                  : t("general.sendTicket")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TicketModal;
