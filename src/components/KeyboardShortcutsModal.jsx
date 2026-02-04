/**
 * Keyboard Shortcuts Help Modal
 * Shows all available keyboard shortcuts in a beautiful modal
 */

import React from "react";
import { createPortal } from "react-dom";

const KeyboardShortcutsModal = ({ show, onClose, t }) => {
  if (!show) return null;

  const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;

  const shortcuts = [
    {
      category: t("shortcuts.general") || "Yleiset",
      items: [
        {
          keys: isMac ? ["⌘", "K"] : ["Ctrl", "K"],
          description: t("shortcuts.focusSearch") || "Aktivoi haku",
        },
        {
          keys: isMac ? ["⌘", "⇧", "P"] : ["Ctrl", "Shift", "P"],
          description: t("shortcuts.createNew") || "Luo uusi julkaisu",
        },
        {
          keys: isMac ? ["⌘", "I"] : ["Ctrl", "I"],
          description: t("shortcuts.import") || "Tuo julkaisu",
        },
        {
          keys: ["Esc"],
          description: t("shortcuts.closeModal") || "Sulje modaalit",
        },
        {
          keys: isMac ? ["⌘", "H"] : ["Ctrl", "H"],
          description: t("shortcuts.showHelp") || "Näytä pikanäppäimet",
        },
      ],
    },
  ];

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-gray-900">
                ⌨️ {t("shortcuts.title") || "Pikanäppäimet"}
              </h2>
              <p className="text-sm text-gray-500 mt-1 font-medium">
                {t("shortcuts.subtitle") ||
                  "Käytä näitä pikanäppäimiä nopeuttaaksesi työskentelyä"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/80 rounded-xl text-gray-400 hover:text-gray-900 transition-all"
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

        {/* Content */}
        <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto">
          {shortcuts.map((category, categoryIndex) => (
            <div key={categoryIndex}>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                {category.category}
              </h3>
              <div className="space-y-3">
                {category.items.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors group"
                  >
                    <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
                      {shortcut.description}
                    </span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, keyIndex) => (
                        <React.Fragment key={keyIndex}>
                          {keyIndex > 0 && (
                            <span className="text-gray-300 mx-1 text-xs font-bold">
                              +
                            </span>
                          )}
                          <kbd className="px-3 py-1.5 bg-white border-2 border-gray-200 rounded-lg text-xs font-bold text-gray-700 shadow-sm min-w-[2rem] text-center">
                            {key}
                          </kbd>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-8 py-5 bg-gray-50 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="font-medium">
              💡 {t("shortcuts.tip") || "Vinkki: Paina"}{" "}
              <kbd className="px-2 py-0.5 bg-white border border-gray-200 rounded text-gray-700 font-bold">
                {isMac ? "⌘" : "Ctrl"}
              </kbd>{" "}
              +{" "}
              <kbd className="px-2 py-0.5 bg-white border border-gray-200 rounded text-gray-700 font-bold">
                H
              </kbd>{" "}
              {t("shortcuts.tipEnd") || "milloin tahansa avataksesi tämän"}
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition-all hover:scale-105 active:scale-95"
            >
              {t("shortcuts.close") || "Sulje"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default KeyboardShortcutsModal;
