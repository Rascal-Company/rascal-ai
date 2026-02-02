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
        className="fixed top-1/2 right-0 -translate-y-1/2 z-[9999] bg-orange-500 hover:bg-orange-600 text-white shadow-2xl shadow-orange-500/40 rounded-l-[24px] px-3 py-8 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 min-w-auto [writing-mode:vertical-rl] [text-orientation:mixed] transition-all duration-300 hover:pl-4 active:scale-95 border-y border-l border-white/20 backdrop-blur-sm group"
        title={t("ticket.buttonTitle")}
      >
        <span className="group-hover:scale-110 transition-transform duration-300">{t("ticket.buttonLabel")}</span>
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
