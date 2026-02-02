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

  const adjustTextareaHeight = (textarea) => {
    if (!textarea) return;
    textarea.style.height = "auto";
    const newHeight = Math.max(60, textarea.scrollHeight);
    textarea.style.height = newHeight + "px";
  };

  const sortedSegments = [...segments].sort((a, b) => {
    const aNum = parseInt(a.slide_no) || 999;
    const bNum = parseInt(b.slide_no) || 999;
    return aNum - bNum;
  });

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

      const userId = await getUserOrgId(user?.id);
      if (!userId) throw new Error("Käyttäjätietojen haku epäonnistui");

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Autentikointi puuttuu");

      const updates = [];
      sortedSegments.forEach((segment) => {
        const segmentId = segment.id;
        const edit = segmentEdits[segmentId];
        if (edit) {
          updates.push({
            recordId: segmentId,
            carouselRecordId: contentId,
            text: edit.text !== undefined ? edit.text : segment.text || segment.caption || "",
            approved: edit.approved !== undefined ? edit.approved : segment.approved || false,
          });
        }
      });

      if (updates.length === 0) {
        setSaveMessage({ type: "info", text: "Ei muutoksia tallennettavaksi" });
        return;
      }

      const response = await fetch("/api/integrations/airtable/carousels", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ action: "approve", updates: updates }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Tallennus epäonnistui");
      }

      setSaveMessage({ type: "success", text: `Tallennettu ${updates.length} muutosta` });

      setTimeout(() => {
        setSegmentEdits({});
        setSaveMessage(null);
        if (onSave) onSave();
      }, 2000);
    } catch (error) {
      console.error("Error saving segment changes:", error);
      setSaveMessage({ type: "error", text: error.message || "Tallennus epäonnistui" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-6 bg-gray-900 rounded-full" />
          <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest leading-none">
            {t?.("ui.carousel.segments") || "Sivut"} ({sortedSegments.length})
          </h4>
        </div>
        {Object.keys(segmentEdits).length > 0 && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 bg-gray-900 hover:bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-gray-200 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : null}
            {saving ? (t?.("ui.buttons.saving") || "Tallennetaan") : (t?.("ui.buttons.save") || "Tallenna")}
          </button>
        )}
      </div>

      {saveMessage && (
        <div className={`p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 animate-in fade-in duration-300 ${saveMessage.type === 'success' ? 'bg-emerald-50/50 text-emerald-600 border-emerald-100' :
          saveMessage.type === 'error' ? 'bg-red-50/50 text-red-600 border-red-100' :
            'bg-blue-50/50 text-blue-600 border-blue-100'
          }`}>
          {saveMessage.text}
        </div>
      )}

      <div className="space-y-4">
        {sortedSegments.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center bg-gray-50/30 rounded-3xl border border-dashed border-gray-100 italic text-gray-400 text-[10px] font-bold uppercase tracking-widest">
            {t?.("ui.carousel.noSegments") || "Ei sisältöä"}
          </div>
        ) : (
          sortedSegments.map((segment, index) => {
            const segmentId = segment.id;
            const currentText = segmentEdits[segmentId]?.text !== undefined ? segmentEdits[segmentId].text : segment.text || segment.caption || "";
            const currentApproved = segmentEdits[segmentId]?.approved !== undefined ? segmentEdits[segmentId].approved : segment.approved || false;

            return (
              <div key={segmentId} className="group p-6 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-gray-100 transition-all duration-300">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-50 group-hover:bg-gray-900 group-hover:text-white rounded-2xl flex items-center justify-center text-xs font-black transition-colors">
                      {segment.slide_no || index + 1}
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Slide</p>
                      <p className="text-xs font-bold text-gray-900">Sequence {index + 1}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">OK</span>
                    <button
                      onClick={() => {
                        setSegmentEdits((prev) => ({
                          ...prev,
                          [segmentId]: { ...prev[segmentId], approved: !currentApproved },
                        }));
                      }}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${currentApproved ? 'bg-emerald-500' : 'bg-gray-100'
                        }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${currentApproved ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
                  {segment.media_urls?.[0] && (
                    <div className="w-full aspect-video rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 shadow-sm relative group/media">
                      <img src={segment.media_urls[0]} alt="" className="w-full h-full object-cover group-hover/media:scale-105 transition-transform duration-700" />
                      <div className="absolute inset-0 bg-black/5 opacity-0 group-hover/media:opacity-100 transition-opacity" />
                    </div>
                  )}
                  <div className="px-1">
                    <textarea
                      value={currentText}
                      onChange={(e) => {
                        setSegmentEdits((prev) => ({
                          ...prev,
                          [segmentId]: { ...prev[segmentId], text: e.target.value },
                        }));
                        adjustTextareaHeight(e.target);
                      }}
                      onInput={(e) => adjustTextareaHeight(e.target)}
                      ref={(el) => { if (el) textareaRefs.current[segmentId] = el; else delete textareaRefs.current[segmentId]; }}
                      placeholder="Sivun teksti..."
                      className="w-full p-0 bg-transparent border-none focus:ring-0 text-sm font-bold text-gray-900 placeholder:text-gray-200 leading-relaxed min-h-[60px] resize-none"
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
