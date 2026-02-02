import React, { useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabase";

export default function PlacidEditor({ placidId, onClose }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sdkReady, setSdkReady] = useState(false);
  const containerRef = useRef(null);
  const editorInstanceRef = useRef(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // 1. Load Placid SDK Script
  useEffect(() => {
    window.EditorSDKConfig = {
      theme: {
        primary_color: "#ff6600",
        secondary_color: "#9ca3af",
      },
    };

    if (window.EditorSDK) {
      setSdkReady(true);
      return;
    }

    window.EditorSDKReady = () => {
      setSdkReady(true);
    };

    const scriptId = "placid-sdk";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://sdk.placid.app/editor-sdk@latest/sdk.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // 2. Initialize Editor when SDK is ready
  useEffect(() => {
    if (!sdkReady || !placidId) return;

    let cancelled = false;

    const initEditor = async () => {
      try {
        setLoading(true);
        setError(null);

        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.access_token) {
          throw new Error("Sessio vanhentunut. Kirjaudu uudelleen.");
        }

        const response = await fetch(
          `/api/placid/auth?template_id=${encodeURIComponent(placidId)}`,
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          },
        );
        const data = await response.json();

        if (!response.ok) {
          if (data.error === "CONFIGURATION_ERROR") {
            throw new Error(data.message);
          }
          throw new Error(
            data.message || data.error || "Autentikaatio epäonnistui",
          );
        }

        if (cancelled) return;

        const { token } = data;

        if (containerRef.current && containerRef.current.offsetWidth > 0) {
          if (editorInstanceRef.current) {
            try {
              editorInstanceRef.current.destroy();
            } catch (e) {
              console.warn("Old editor destroy failed", e);
            }
          }
          containerRef.current.innerHTML = "";

          const instance = await window.EditorSDK.editor.create(
            containerRef.current,
            {
              access_token: token,
              template_uuid: placidId,
              prefill_layers: {},
            },
          );

          if (cancelled) {
            instance.destroy();
            return;
          }

          editorInstanceRef.current = instance;

          instance.on("editor:closed", () => {
            onCloseRef.current();
          });

          instance.on("editor:template:saved", () => {
            console.log("Template saved");
          });
        }
        setLoading(false);
      } catch (err) {
        if (!cancelled) {
          console.error("Editor initialization error:", err);
          setError(err.message);
          setLoading(false);
        }
      }
    };

    const frameId = requestAnimationFrame(() => {
      initEditor();
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frameId);

      if (editorInstanceRef.current) {
        try {
          editorInstanceRef.current.destroy();
          editorInstanceRef.current = null;
        } catch (e) {
          console.warn("Editor cleanup error:", e);
        }
      }
    };
  }, [sdkReady, placidId]);

  return (
    <div className="placid-editor-modal-overlay">
      <div className="placid-editor-modal-content">
        <div className="placid-editor-modal-header">
          <h3>Muokkaa mallia</h3>
          <button
            onClick={onClose}
            className="placid-editor-close-button"
            aria-label="Sulje"
          >
            ×
          </button>
        </div>

        {error ? (
          <div className="placid-editor-error-container">
            <div className="placid-editor-error-title">
              Virhe editorin latauksessa
            </div>
            <div className="placid-editor-error-message">{error}</div>
          </div>
        ) : (
          <div className="placid-editor-wrapper">
            {loading && (
              <div className="placid-editor-loading-overlay">
                <div className="placid-editor-loading-text">
                  <div className="placid-editor-loading-spinner" />
                  Ladataan editoria...
                </div>
              </div>
            )}
            <div
              id="editor"
              ref={containerRef}
              className="placid-editor-frame"
            />
          </div>
        )}
      </div>
    </div>
  );
}
