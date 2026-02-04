/**
 * ExportLeadsModal - Export leads to CSV
 * Feature 6: CSV Export
 * Pattern copied from ExportCallLogsModal.jsx
 */

import React, { useState } from "react";
import { createPortal } from "react-dom";
import Button from "./Button";

const ExportLeadsModal = ({ isOpen, onClose, selectedLeads }) => {
  const [exportFields, setExportFields] = useState({
    fullName: true,
    firstName: false,
    lastName: false,
    email: true,
    phone: true,
    position: true,
    orgName: true,
    city: true,
    country: true,
    linkedinUrl: true,
    score: true,
    seniority: false,
    functional: false,
  });

  if (!isOpen) return null;

  const handleExportCSV = () => {
    try {
      const leads = Array.isArray(selectedLeads) ? selectedLeads : [];
      if (!leads.length) {
        alert("Ei liidejä exportattavaksi!");
        return;
      }

      // Filter selected fields
      const selectedFields = Object.entries(exportFields)
        .filter(([, selected]) => selected)
        .map(([field]) => field);

      if (selectedFields.length === 0) {
        alert("Valitse vähintään yksi kenttä exportattavaksi!");
        return;
      }

      // Define labels (Finnish)
      const fieldLabels = {
        fullName: "Nimi",
        firstName: "Etunimi",
        lastName: "Sukunimi",
        email: "Sähköposti",
        phone: "Puhelin",
        position: "Asema",
        orgName: "Yritys",
        city: "Kaupunki",
        country: "Maa",
        linkedinUrl: "LinkedIn",
        score: "Pisteet",
        seniority: "Senioriteetti",
        functional: "Toiminto",
      };

      // Escape CSV values (prevent injection + handle commas/quotes)
      const escapeCSV = (value) => {
        const str = String(value || "");
        // Prevent CSV injection
        if (/^[=+\-@]/.test(str)) {
          return `'${str}`;
        }
        // Escape commas, quotes, and newlines
        if (
          str.includes(",") ||
          str.includes('"') ||
          str.includes("\n") ||
          str.includes("\r")
        ) {
          return `"${str.replace(/"/g, '""').replace(/[\r\n]+/g, " ")}"`;
        }
        return str;
      };

      // Build CSV content
      const headers = selectedFields.map((f) => fieldLabels[f]);
      const rows = leads.map((lead) =>
        selectedFields.map((field) => escapeCSV(lead[field])),
      );

      const csvContent = [
        "\ufeff", // UTF-8 BOM for Excel compatibility
        headers.join(","),
        ...rows.map((row) => row.join(",")),
      ].join("\n");

      // Download file
      const blob = new Blob([csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `liidit_${new Date().toISOString().split("T")[0]}.csv`;
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      onClose();
    } catch (error) {
      console.error("Export epäonnistui:", error);
      alert("Export epäonnistui: " + error.message);
    }
  };

  const fieldLabels = {
    fullName: "Nimi",
    firstName: "Etunimi",
    lastName: "Sukunimi",
    email: "Sähköposti",
    phone: "Puhelin",
    position: "Asema",
    orgName: "Yritys",
    city: "Kaupunki",
    country: "Maa",
    linkedinUrl: "LinkedIn",
    score: "Pisteet",
    seniority: "Senioriteetti",
    functional: "Toiminto",
  };

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-gray-900">
                📤 Vie liidit
              </h2>
              <p className="text-sm text-gray-500 mt-1 font-medium">
                Vie {selectedLeads.length} liidiä CSV-tiedostoon
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

        <div className="p-8 space-y-4 max-h-[60vh] overflow-y-auto">
          <p className="text-sm text-gray-600 font-medium">
            Valitse vietävät kentät:
          </p>
          <div className="space-y-2">
            {Object.keys(exportFields).map((field) => (
              <label
                key={field}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer group"
              >
                <input
                  type="checkbox"
                  checked={exportFields[field]}
                  onChange={(e) =>
                    setExportFields({
                      ...exportFields,
                      [field]: e.target.checked,
                    })
                  }
                  className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                  {fieldLabels[field]}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 flex gap-3">
          <Button
            onClick={handleExportCSV}
            variant="primary"
            size="md"
            className="flex-1"
          >
            Vie CSV
          </Button>
          <Button onClick={onClose} variant="secondary" size="md">
            Peruuta
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default ExportLeadsModal;
