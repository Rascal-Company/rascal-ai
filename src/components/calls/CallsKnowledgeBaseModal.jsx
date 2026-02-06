import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { supabase } from "../../lib/supabase";

function toErrorString(error) {
  if (typeof error === "string") return error;
  if (error && typeof error === "object") {
    return error.message || error.error || JSON.stringify(error);
  }
  return String(error || "Unknown error");
}

export default function CallsKnowledgeBaseModal({ open, onClose }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasDatabase, setHasDatabase] = useState(false);
  const [files, setFiles] = useState([]);
  const [activeTab, setActiveTab] = useState("files");
  const [addMode, setAddMode] = useState("pdf");
  const [inboundEnabled, setInboundEnabled] = useState(false);
  const [outboundEnabled, setOutboundEnabled] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(false);

  const [pendingFiles, setPendingFiles] = useState([]);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");
  const dropRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);

  const [webTitle, setWebTitle] = useState("");
  const [webUrl, setWebUrl] = useState("");
  const [webLoading, setWebLoading] = useState(false);
  const [webError, setWebError] = useState("");

  const fetchStatusAndList = async () => {
    setError("");
    setLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Ei aktiivista sessiota");

      const statusResp = await axios.post(
        "/api/calls/knowledge-base",
        { action: "status" },
        { headers: { Authorization: `Bearer ${session.access_token}` } },
      );
      const has = Boolean(statusResp?.data?.vector_store_id);
      setHasDatabase(has);
      setInboundEnabled(Boolean(statusResp?.data?.inbound_enabled));
      setOutboundEnabled(Boolean(statusResp?.data?.outbound_enabled));

      if (!has) {
        setFiles([]);
        return;
      }

      const listResp = await axios.post(
        "/api/calls/knowledge-base",
        { action: "list" },
        { headers: { Authorization: `Bearer ${session.access_token}` } },
      );

      const arr = Array.isArray(listResp?.data?.files)
        ? listResp.data.files
        : [];
      const normalized = arr.map((item) => ({
        id: item?.id,
        file_name: item?.file_name || "Tiedosto",
        source_type: item?.source_type || "file",
        source_url: item?.source_url || null,
      }));
      setFiles(normalized);
    } catch (e) {
      setError(
        toErrorString(
          e?.response?.data?.error ||
            e?.message ||
            "Tietokannan haku epäonnistui",
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    setPendingFiles([]);
    setUploadError("");
    setUploadSuccess("");
    setWebError("");
    setActiveTab("files");
    setAddMode("pdf");
    fetchStatusAndList();
  }, [open]);

  const handlePickFiles = (fileList) => {
    const next = Array.from(fileList || []);
    if (!next.length) return;
    setPendingFiles((prev) => [...prev, ...next]);
  };

  const handleCreate = async () => {
    setError("");
    setLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Ei aktiivista sessiota");

      await axios.post(
        "/api/calls/knowledge-base",
        { action: "create" },
        { headers: { Authorization: `Bearer ${session.access_token}` } },
      );
      setHasDatabase(true);
      await fetchStatusAndList();
    } catch (e) {
      setError(
        toErrorString(
          e?.response?.data?.error ||
            e?.message ||
            "Tietokannan luonti epäonnistui",
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (bot, enabled) => {
    setError("");
    setToggleLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Ei aktiivista sessiota");

      const resp = await axios.post(
        "/api/calls/knowledge-base",
        { action: "set_enabled", bot, enabled },
        { headers: { Authorization: `Bearer ${session.access_token}` } },
      );

      setInboundEnabled(Boolean(resp?.data?.inbound_enabled));
      setOutboundEnabled(Boolean(resp?.data?.outbound_enabled));
    } catch (e) {
      setError(
        toErrorString(
          e?.response?.data?.error || e?.message || "Kytkentä epäonnistui",
        ),
      );
    } finally {
      setToggleLoading(false);
    }
  };

  const handleUpload = async () => {
    setUploadError("");
    setUploadSuccess("");
    setUploadLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Ei aktiivista sessiota");
      if (!pendingFiles.length) throw new Error("Ei valittuja tiedostoja");

      // Get org data for storage path
      const statusResp = await axios.post(
        "/api/calls/knowledge-base",
        { action: "status" },
        { headers: { Authorization: `Bearer ${session.access_token}` } },
      );
      const orgId = statusResp?.data?.org_id;
      if (!orgId) throw new Error("Organisaatio-ID puuttuu");

      const bucket = "temp-ingest";
      const uploadedFiles = [];

      // Upload each file directly to Supabase Storage
      for (let i = 0; i < pendingFiles.length; i++) {
        const file = pendingFiles[i];
        const sanitizedName = sanitizeFilename(file.name);
        const storagePath = `${orgId}/${Date.now()}-${i}-${sanitizedName}`;

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(storagePath, file, {
            contentType: file.type || "application/octet-stream",
            upsert: true,
          });

        if (uploadError) {
          throw new Error(
            `Tiedoston ${file.name} lähetys epäonnistui: ${uploadError.message}`,
          );
        }

        uploadedFiles.push({
          fileName: file.name,
          storagePath,
          mimeType: file.type,
          size: file.size,
        });
      }

      // Register uploaded files via API
      const resp = await axios.post(
        "/api/calls/knowledge-base-register",
        { files: uploadedFiles },
        { headers: { Authorization: `Bearer ${session.access_token}` } },
      );

      const registeredCount = resp?.data?.registered || uploadedFiles.length;
      setUploadSuccess(`${registeredCount} tiedosto(a) ladattu`);
      setPendingFiles([]);
      await fetchStatusAndList();
    } catch (e) {
      setUploadError(
        toErrorString(
          e?.response?.data?.error ||
            e?.message ||
            "Tiedostojen lähetys epäonnistui",
        ),
      );
    } finally {
      setUploadLoading(false);
    }
  };

  function sanitizeFilename(inputName) {
    const trimmed = (inputName || "").trim();
    const justName = trimmed.split("\\").pop().split("/").pop();
    const dotIdx = justName.lastIndexOf(".");
    const ext = dotIdx >= 0 ? justName.slice(dotIdx) : "";
    const base = dotIdx >= 0 ? justName.slice(0, dotIdx) : justName;
    const withoutDiacritics = base
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    const asciiSafe = withoutDiacritics.replace(/[^a-zA-Z0-9._-]+/g, "-");
    const collapsed = asciiSafe
      .replace(/-+/g, "-")
      .replace(/^[.-]+|[.-]+$/g, "");
    return (collapsed || "file") + ext;
  }

  const handleDelete = async (id) => {
    if (!id) return;
    setError("");
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Ei aktiivista sessiota");

      await axios.post(
        "/api/calls/knowledge-base",
        { action: "delete", id },
        { headers: { Authorization: `Bearer ${session.access_token}` } },
      );

      setFiles((prev) => prev.filter((f) => f.id !== id));
    } catch (e) {
      setError(
        toErrorString(
          e?.response?.data?.error || e?.message || "Poisto epäonnistui",
        ),
      );
    }
  };

  const handleAddWeb = async () => {
    setWebError("");
    setWebLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Ei aktiivista sessiota");

      await axios.post(
        "/api/calls/knowledge-base-ingest",
        { type: "web", title: webTitle, url: webUrl },
        { headers: { Authorization: `Bearer ${session.access_token}` } },
      );

      setWebTitle("");
      setWebUrl("");
      await fetchStatusAndList();
    } catch (e) {
      setWebError(
        toErrorString(
          e?.response?.data?.error || e?.message || "URL:n lisäys epäonnistui",
        ),
      );
    } finally {
      setWebLoading(false);
    }
  };

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9998] p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-[720px] max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Tietokanta</h2>
          <button
            className="text-gray-500 bg-gray-100 border border-gray-200 cursor-pointer p-2 rounded-lg transition-all duration-200 w-9 h-9 flex items-center justify-center hover:bg-gray-200 hover:text-gray-700 active:scale-95 text-xl"
            onClick={onClose}
            disabled={loading || uploadLoading}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto px-6 py-6">
          <div className="text-xs text-gray-500 mb-4">
            Sallitut arvot: <strong>pdf</strong>, <strong>web</strong>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}

          {hasDatabase ? (
            <>
              {/* Tabs */}
              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "files" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                  onClick={() => setActiveTab("files")}
                  disabled={loading || uploadLoading || webLoading}
                >
                  Tiedostot
                </button>
                <button
                  type="button"
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "add" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                  onClick={() => setActiveTab("add")}
                  disabled={loading || uploadLoading || webLoading}
                >
                  Lisää
                </button>
              </div>

              {activeTab === "files" && (
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-sm font-medium text-gray-700">
                      Tiedostot ({files.length})
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600">Inbound</span>
                        <label
                          className="switch"
                          title="Inbound tietokanta käyttöön/pois"
                        >
                          <input
                            type="checkbox"
                            checked={inboundEnabled}
                            onChange={(e) =>
                              handleToggle("inbound", e.target.checked)
                            }
                            disabled={
                              !hasDatabase ||
                              toggleLoading ||
                              loading ||
                              uploadLoading ||
                              webLoading
                            }
                          />
                          <span className="slider round"></span>
                        </label>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600">Outbound</span>
                        <label
                          className="switch"
                          title="Outbound tietokanta käyttöön/pois"
                        >
                          <input
                            type="checkbox"
                            checked={outboundEnabled}
                            onChange={(e) =>
                              handleToggle("outbound", e.target.checked)
                            }
                            disabled={
                              !hasDatabase ||
                              toggleLoading ||
                              loading ||
                              uploadLoading ||
                              webLoading
                            }
                          />
                          <span className="slider round"></span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4 min-h-[150px] bg-gray-50">
                    {loading ? (
                      <div className="text-sm text-gray-500">Ladataan...</div>
                    ) : files.length === 0 ? (
                      <div className="text-sm text-gray-500">Ei tiedostoja</div>
                    ) : (
                      <ul className="space-y-2">
                        {files.map((f, idx) => (
                          <li
                            key={(f.id || f.file_name || "file") + idx}
                            className="flex justify-between items-center bg-white px-3 py-2 rounded-lg border border-gray-200"
                          >
                            <span
                              className="text-sm text-gray-700 truncate flex-1 mr-2"
                              title={
                                f.source_type === "web"
                                  ? f.source_url || f.file_name
                                  : f.file_name
                              }
                            >
                              {f.source_type === "web"
                                ? `URL: ${f.file_name}`
                                : f.file_name}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDelete(f.id)}
                              title="Poista"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 w-7 h-7 flex items-center justify-center rounded transition-all"
                            >
                              ×
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "add" && (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Lisää tyyppi:
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${addMode === "pdf" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                        onClick={() => setAddMode("pdf")}
                        disabled={loading || uploadLoading || webLoading}
                      >
                        PDF
                      </button>
                      <button
                        type="button"
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${addMode === "web" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                        onClick={() => setAddMode("web")}
                        disabled={loading || uploadLoading || webLoading}
                      >
                        URL
                      </button>
                    </div>
                  </div>

                  {addMode === "pdf" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Lisää PDF:
                      </label>

                      <div
                        ref={dropRef}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setDragActive(true);
                        }}
                        onDragLeave={() => setDragActive(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setDragActive(false);
                          handlePickFiles(e.dataTransfer.files);
                        }}
                        onClick={() =>
                          dropRef.current
                            ?.querySelector("input[type=file]")
                            ?.click()
                        }
                        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-gray-50 hover:border-gray-400"}`}
                      >
                        <div className="text-sm font-medium text-gray-700 mb-1">
                          Vedä ja pudota PDF tähän
                        </div>
                        <div className="text-xs text-gray-500">
                          tai klikkaa valitaksesi (.pdf)
                        </div>
                        <input
                          type="file"
                          multiple
                          accept=".pdf,application/pdf"
                          className="hidden"
                          onChange={(e) => handlePickFiles(e.target.files)}
                        />
                      </div>

                      {pendingFiles.length > 0 && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                          <div className="text-sm font-medium text-blue-700 mb-2">
                            Valitut tiedostot ({pendingFiles.length})
                          </div>
                          <ul className="text-sm text-blue-600 space-y-1">
                            {pendingFiles.map((f, idx) => (
                              <li key={f.name + f.size + idx}>{f.name}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {uploadError && (
                        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm mt-4">
                          {uploadError}
                        </div>
                      )}

                      {uploadSuccess && (
                        <div className="bg-green-50 text-green-600 px-4 py-3 rounded-lg text-sm mt-4">
                          {uploadSuccess}
                        </div>
                      )}
                    </div>
                  )}

                  {addMode === "web" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Lisää URL:
                      </label>
                      <input
                        type="text"
                        value={webTitle}
                        onChange={(e) => setWebTitle(e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-3"
                        placeholder="Otsikko (valinnainen)"
                      />
                      <input
                        type="url"
                        value={webUrl}
                        onChange={(e) => setWebUrl(e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="https://example.com/..."
                      />
                      {webError && (
                        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm mt-3">
                          {webError}
                        </div>
                      )}
                      <div className="mt-4">
                        <button
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={handleAddWeb}
                          disabled={loading || webLoading || !webUrl.trim()}
                        >
                          {webLoading ? "Lisätään..." : "Lisää URL"}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            <div className="bg-amber-50 text-amber-700 px-4 py-3 rounded-lg text-sm">
              Tietokantaa ei ole vielä luotu tälle organisaatiolle.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-all disabled:opacity-50"
            onClick={onClose}
            disabled={loading || uploadLoading || webLoading}
          >
            Sulje
          </button>

          {!hasDatabase ? (
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-all disabled:opacity-50"
              onClick={handleCreate}
              disabled={loading}
            >
              {loading ? "Luodaan..." : "Luo tietokanta"}
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-all disabled:opacity-50"
                onClick={fetchStatusAndList}
                disabled={loading || uploadLoading || webLoading}
              >
                Päivitä lista
              </button>
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleUpload}
                disabled={
                  activeTab !== "add" ||
                  addMode !== "pdf" ||
                  loading ||
                  uploadLoading ||
                  pendingFiles.length === 0
                }
              >
                {uploadLoading ? "Lähetetään..." : "Lähetä tiedostot"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
