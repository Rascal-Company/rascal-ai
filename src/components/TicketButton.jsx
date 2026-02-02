import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/AuthContext";
import TicketModal from "./TicketModal";

const TicketButton = () => {
  const { t } = useTranslation("common");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(!!user);
  }, [user]);

  if (!isVisible) return null;

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="btn btn-primary fixed top-1/2 right-2.5 -translate-y-1/2 z-[9999] rounded-[50px] px-4 py-3 text-sm font-semibold flex items-center gap-2 min-w-auto"
        title={t("ticket.buttonTitle")}
        style={{
          writingMode: "vertical-rl",
          textOrientation: "mixed",
        }}
      >
        <span>{t("ticket.buttonLabel")}</span>
      </button>

      {isModalOpen &&
        createPortal(
          <TicketModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
          />,
          document.body,
        )}
    </>
  );
};

export default TicketButton;
