import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { getUserOrgId } from "../lib/getUserOrgId";
import { useAuth } from "../contexts/AuthContext";
import Button from "./Button";

export default function CarouselSegmentsEditor({
  segments = [],
  contentId,
  onSave,
  t,
}) {
  const { user } = useAuth();
  const [segmentEdits, setSegmentEdits] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);
  const textareaRefs = useRef({});

  // Automaattinen korkeuden säätö textarea-elementille
  const adjustTextareaHeight = (textarea) => {
    if (!textarea) return;
    // Nollaa korkeus jotta scrollHeight laskee sisällön korkeuden
    textarea.style.height = "auto";
    // Aseta korkeus scrollHeight:n mukaan (vähintään 60px)
    const newHeight = Math.max(60, textarea.scrollHeight);
    textarea.style.height = newHeight + "px";
  };

  // Järjestä segmentit slide_no:n mukaan
  const sortedSegments = [...segments].sort((a, b) => {
    const aNum = parseInt(a.slide_no) || 999;
    const bNum = parseInt(b.slide_no) || 999;
    return aNum - bNum;
  });

  // Säätää kaikkien textarea-kenttien korkeutta kun data muuttuu
  // useLayoutEffect suoritetaan synkronisesti DOM-päivityksen jälkeen, ennen renderöintiä
  useLayoutEffect(() => {
    Object.values(textareaRefs.current).forEach(adjustTextareaHeight);
  }, [segments, segmentEdits]);

  const handleSave = async () => {
    if (!contentId) {
      setSaveMessage({ type: "error", text: "Content ID puuttuu" });
      return;
    }

    try {
      setSaving(true);
      setSaveMessage(null);

      // Validoi käyttäjä
      const userId = await getUserOrgId(user?.id);
      if (!userId) {
        throw new Error("Käyttäjätietojen haku epäonnistui");
      }

      // Hae auth token API-kutsua varten
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Autentikointi puuttuu");
      }

      // Kerää kaikki muutokset API-endpointin odottamassa muodossa
      const updates = [];

      sortedSegments.forEach((segment) => {
        const segmentId = segment.id;
        const edit = segmentEdits[segmentId];

        if (edit) {
          updates.push({
            recordId: segmentId,
            carouselRecordId: contentId,
            text:
              edit.text !== undefined
                ? edit.text
                : segment.text || segment.caption || "",
            approved:
              edit.approved !== undefined
                ? edit.approved
                : segment.approved || false,
          });
        }
      });

      if (updates.length === 0) {
        setSaveMessage({ type: "info", text: "Ei muutoksia tallennettavaksi" });
        return;
      }

      // Lähetä API-endpointiin
      const response = await fetch("/api/integrations/airtable/carousels", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: "approve",
          updates: updates,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Tallennus epäonnistui");
      }

      setSaveMessage({
        type: "success",
        text: `Tallennettu ${updates.length} muutosta`,
      });

      // Tyhjennä muutokset onnistuneen tallennuksen jälkeen
      setTimeout(() => {
        setSegmentEdits({});
        setSaveMessage(null);
        if (onSave) {
          onSave();
        }
      }, 2000);
    } catch (error) {
      console.error("Error saving segment changes:", error);
      setSaveMessage({
        type: "error",
        text: error.message || "Tallennus epäonnistui",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="carousel-segments-editor">
      <div className="carousel-segments-editor-header">
        <h4>Slaidit ({sortedSegments.length})</h4>
        {Object.keys(segmentEdits).length > 0 && (
          <Button
            variant="primary"
            size="small"
            onClick={handleSave}
            disabled={saving}
          >
            {saving
              ? t?.("ui.buttons.saving") || "Tallennetaan..."
              : t?.("ui.buttons.save") || "Tallenna"}
          </Button>
        )}
      </div>

      {saveMessage && (
        <div className={`carousel-segments-save-message ${saveMessage.type}`}>
          {saveMessage.text}
        </div>
      )}

      <div className="carousel-segments-list">
        {sortedSegments.length === 0 ? (
          <div className="carousel-segment-empty">
            <p>Ei segmenttejä</p>
          </div>
        ) : (
          sortedSegments.map((segment, index) => {
            const segmentId = segment.id;
            const currentText =
              segmentEdits[segmentId]?.text !== undefined
                ? segmentEdits[segmentId].text
                : segment.text || segment.caption || "";
            const currentApproved =
              segmentEdits[segmentId]?.approved !== undefined
                ? segmentEdits[segmentId].approved
                : segment.approved || false;

            return (
              <div key={segmentId} className="carousel-segment-editor-item">
                <div className="carousel-segment-editor-header">
                  <span className="carousel-segment-number">
                    Slaidi {segment.slide_no || index + 1}
                  </span>
                  <div className="carousel-segment-editor-header-right">
                    <div className="carousel-segment-approved">
                      <label className="switch">
                        <input
                          type="checkbox"
                          checked={currentApproved}
                          onChange={(e) => {
                            setSegmentEdits((prev) => ({
                              ...prev,
                              [segmentId]: {
                                ...prev[segmentId],
                                approved: e.target.checked,
                              },
                            }));
                          }}
                        />
                        <span className="slider"></span>
                      </label>
                      <span className="carousel-segment-approved-label">
                        Hyväksytty
                      </span>
                    </div>
                  </div>
                </div>

                {segment.media_urls && segment.media_urls.length > 0 && (
                  <div className="carousel-segment-media-preview">
                    <img
                      src={segment.media_urls[0]}
                      alt={`Slaidi ${segment.slide_no || index + 1}`}
                      className="carousel-segment-thumbnail"
                    />
                  </div>
                )}

                <textarea
                  className="carousel-segment-text-input"
                  value={currentText}
                  onChange={(e) => {
                    setSegmentEdits((prev) => ({
                      ...prev,
                      [segmentId]: {
                        ...prev[segmentId],
                        text: e.target.value,
                      },
                    }));
                    adjustTextareaHeight(e.target);
                  }}
                  onInput={(e) => {
                    // Säätää korkeutta myös onInput:issa (Safari-yhteensopivuus)
                    adjustTextareaHeight(e.target);
                  }}
                  ref={(el) => {
                    if (el) {
                      textareaRefs.current[segmentId] = el;
                    } else {
                      delete textareaRefs.current[segmentId];
                    }
                  }}
                  placeholder="Slaidin teksti..."
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
