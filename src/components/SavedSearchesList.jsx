/**
 * SavedSearchesList - Display saved searches in sidebar
 * Feature 3: Save searches
 */

import React, { useState } from "react";

const SavedSearchesList = ({ searches, onRun, onDelete }) => {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-gray-900">
            Tallennetut haut
          </span>
          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
            {searches.length}
          </span>
        </div>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {expanded && (
        <div className="border-t border-gray-100">
          {searches.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-sm text-gray-500">Ei tallennettuja hakuja</p>
              <p className="text-xs text-gray-400 mt-1">
                Tallenna haku käyttääksesi sitä myöhemmin
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {searches.map((search) => (
                <div
                  key={search.id}
                  className="p-3 hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {search.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {search.query}
                      </p>
                      {(search.location ||
                        search.headcount ||
                        search.ownership) && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {search.location && (
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-medium rounded">
                              📍 {search.location}
                            </span>
                          )}
                          {search.headcount && (
                            <span className="px-2 py-0.5 bg-green-50 text-green-700 text-[10px] font-medium rounded">
                              👥 {search.headcount}+
                            </span>
                          )}
                          {search.ownership && (
                            <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-[10px] font-medium rounded">
                              {search.ownership}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onRun(search)}
                        className="p-1.5 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                        title="Suorita haku"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Poistetaanko haku "${search.name}"?`)) {
                            onDelete(search.id);
                          }
                        }}
                        className="p-1.5 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                        title="Poista haku"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SavedSearchesList;
