import React, { useState } from "react";
import { useTranslation } from "react-i18next";

const Toast = ({ id, message, type, onClose }) => {
  const { t } = useTranslation("common");
  const [isExiting, setIsExiting] = useState(false);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose(id);
    }, 300); // Match animation duration
  };

  const getIcon = () => {
    switch (type) {
      case "success":
        return "\u2713";
      case "error":
        return "\u2715";
      case "warning":
        return "\u26A0";
      case "info":
      default:
        return "\u2139";
    }
  };

  return (
    <div
      className={`toast toast-${type} ${isExiting ? "toast-exit" : ""}`}
      role="alert"
    >
      <div className="toast-icon">{getIcon()}</div>
      <div className="toast-message">{message}</div>
      <button
        className="toast-close-button"
        onClick={handleClose}
        aria-label={t("accessibility.closeNotification")}
      >
        ×
      </button>
    </div>
  );
};

export default Toast;
