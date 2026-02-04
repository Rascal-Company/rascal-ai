/**
 * Keskitetty modaalien hallinta
 * Korvaa 5+ erillistä state-muuttujaa yhdellä
 */

import { useState, useCallback, useEffect } from "react";

/**
 * @typedef {Object} ModalState
 * @property {'none' | 'create' | 'edit' | 'publish' | 'schedule' | 'upload' | 'imageBank' | 'kuvapankkiSelector'} type
 * @property {number} [count] - create modal
 * @property {any} [post] - edit/publish/schedule modal
 * @property {1 | 2} [step] - edit modal step
 * @property {string} [postId] - kuvapankki selector
 */

/**
 * Modal manager hook
 * @returns {{
 *   modal: ModalState,
 *   openModal: (state: ModalState) => void,
 *   closeModal: () => void,
 *   isOpen: (type: string) => boolean
 * }}
 */
export const useModalManager = () => {
  const [modal, setModal] = useState({ type: "none" });

  const openModal = useCallback((state) => {
    setModal(state);
  }, []);

  const closeModal = useCallback(() => {
    setModal({ type: "none" });
  }, []);

  const isOpen = useCallback(
    (type) => {
      return modal.type === type;
    },
    [modal.type],
  );

  // ESC-näppäin sulkee modaalin
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && modal.type !== "none") {
        closeModal();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [modal.type, closeModal]);

  // Focus management - focus first input when modal opens
  useEffect(() => {
    if (modal.type !== "none") {
      // Pieni viive jotta modal ehtii renderöityä
      setTimeout(() => {
        const firstInput = document.querySelector(
          "dialog[open] input, dialog[open] textarea, dialog[open] button:not([disabled])",
        );
        firstInput?.focus();
      }, 100);
    }
  }, [modal.type]);

  return {
    modal,
    openModal,
    closeModal,
    isOpen,
  };
};
