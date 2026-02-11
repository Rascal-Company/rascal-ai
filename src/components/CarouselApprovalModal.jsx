import React from "react";
import { createPortal } from "react-dom";

export default function CarouselApprovalModal({
  show,
  onConfirm,
  onCancel,
  segmentCount,
  t,
}) {
  if (!show) return null;

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-xl animate-in fade-in duration-300"
        onClick={onCancel}
      />
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-8 h-8 text-emerald-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <h3 className="text-xl font-bold text-gray-900 text-center mb-3">
            {t?.("approvalModal.title") || "Hyväksy slaidit?"}
          </h3>

          <p className="text-sm text-gray-600 text-center mb-8">
            {t?.("approvalModal.description", {
              count: segmentCount,
            }) ||
              `Olet hyväksymässä ${segmentCount} ${segmentCount === 1 ? "slaidin" : "slaidia"}. Haluatko jatkaa?`}
          </p>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-6 py-3.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl text-sm font-bold transition-colors"
            >
              {t?.("ui.buttons.cancel") || "Peruuta"}
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-colors shadow-lg shadow-emerald-200"
            >
              {t?.("ui.buttons.approve") || "Hyväksy"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
