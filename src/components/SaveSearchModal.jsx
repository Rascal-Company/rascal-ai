/**
 * SaveSearchModal - Save current search with a name
 * Feature 3: Save searches
 */

import React, { useState } from "react";
import { createPortal } from "react-dom";
import Button from "./Button";

const SaveSearchModal = ({
  isOpen,
  onClose,
  searchQuery,
  location,
  headcount,
  ownership,
  onSave,
}) => {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Nimi on pakollinen");
      return;
    }

    if (name.length > 255) {
      setError("Nimi voi olla korkeintaan 255 merkkiä");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onSave({
        name: name.trim(),
        query: searchQuery,
        location,
        headcount,
        ownership,
        filters: {
          location,
          headcount,
          ownership,
        },
      });
      setName("");
      onClose();
    } catch (err) {
      setError(err.message || "Tallennus epäonnistui");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName("");
    setError(null);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={handleClose}
      />
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-gray-900">
                💾 Tallenna haku
              </h2>
              <p className="text-sm text-gray-500 mt-1 font-medium">
                Anna haulle nimi, jotta voit käyttää sitä myöhemmin
              </p>
            </div>
            <button
              onClick={handleClose}
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

        <div className="p-8 space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Haun nimi
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              placeholder="Esim. IT-päättäjät Helsinki"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              maxLength={255}
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-1">
              {name.length}/255 merkkiä
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-600 font-medium">{error}</p>
            </div>
          )}

          <div className="p-4 bg-gray-50 rounded-2xl space-y-2">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Haun parametrit
            </p>
            <div className="space-y-1 text-sm">
              <p>
                <span className="text-gray-500">Haku:</span>{" "}
                <span className="font-medium text-gray-900">{searchQuery}</span>
              </p>
              {location && (
                <p>
                  <span className="text-gray-500">Sijainti:</span>{" "}
                  <span className="font-medium text-gray-900">{location}</span>
                </p>
              )}
              {headcount && (
                <p>
                  <span className="text-gray-500">Henkilömäärä:</span>{" "}
                  <span className="font-medium text-gray-900">
                    {headcount}+
                  </span>
                </p>
              )}
              {ownership && (
                <p>
                  <span className="text-gray-500">Omistus:</span>{" "}
                  <span className="font-medium text-gray-900">{ownership}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 flex gap-3">
          <Button
            onClick={handleSave}
            variant="primary"
            size="md"
            loading={loading}
            disabled={!name.trim()}
            className="flex-1"
          >
            Tallenna
          </Button>
          <Button
            onClick={handleClose}
            variant="secondary"
            size="md"
            disabled={loading}
          >
            Peruuta
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default SaveSearchModal;
