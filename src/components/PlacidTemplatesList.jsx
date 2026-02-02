import React, { useEffect, useState } from "react";
import axios from "axios";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { getUserOrgId } from "../lib/getUserOrgId";
import { useTranslation } from "react-i18next";
import PlacidEditor from "./PlacidEditor";

export default function PlacidTemplatesList() {
  const { user } = useAuth();
  const toast = useToast();
  const { t } = useTranslation("common");
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [creating, setCreating] = useState(false);
  const [togglingTemplateId, setTogglingTemplateId] = useState(null);

  // Tarkista onko käyttäjä admin
  const isAdmin =
    user?.systemRole === "admin" ||
    user?.systemRole === "superadmin" ||
    user?.systemRole === "moderator";

  // Näytä vain admin-, superadmin- ja moderator-käyttäjille
  if (!isAdmin) {
    return null;
  }

  const fetchTemplates = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const orgId = await getUserOrgId(user.id);
      if (!orgId) return;

      // Hae kaikki rivit variables-taulusta jossa on placid_id
      const { data, error } = await supabase
        .from("variables")
        .select("id, placid_id, variable_id, thumbnail_url, template_ready")
        .eq("user_id", orgId)
        .not("placid_id", "is", null);

      if (error) {
        console.error("Error fetching templates:", error);
      } else {
        // Suodatetaan tyhjät pois varmuuden vuoksi
        const validTemplates = data
          .filter((t) => t.placid_id && t.placid_id.trim() !== "")
          .map((t) => ({
            ...t,
            template_ready: t.template_ready ?? false, // Käytä oletusarvoa jos null
          }));
        setTemplates(validTemplates);
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [user]);

  const handleCreateTemplate = async () => {
    if (!user?.id) return;

    try {
      setCreating(true);

      // Hae session token
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();
      if (sessionError || !sessionData.session?.access_token) {
        throw new Error("Sessio vanhentunut. Kirjaudu uudelleen.");
      }

      const response = await axios.post(
        "/api/placid/create-template",
        {
          templateData: {},
        },
        {
          headers: {
            Authorization: `Bearer ${sessionData.session.access_token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.data.success) {
        toast.success(t("general.templateCreationStarted"));

        // Päivitä lista hetken päästä, jotta N8N ehtii luoda rivin kantaan
        setLoading(true); // Näytä latausindikaattori hetken
        setTimeout(() => {
          fetchTemplates(); // Kutsu listanhakufunktiota
          setLoading(false);
        }, 3000); // 3 sekunnin odotus (säädä N8N nopeuden mukaan)
      }
    } catch (error) {
      console.error("Error creating template:", error);
      const errorMessage = error.response?.data?.message || error.message;
      toast.error(
        t("general.templateCreationFailed", { message: errorMessage }),
      );
    } finally {
      setCreating(false);
    }
  };

  const handleToggleReady = async (templateId, currentReady) => {
    if (!user?.id) return;

    try {
      setTogglingTemplateId(templateId);

      // Hae session token
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();
      if (sessionError || !sessionData.session?.access_token) {
        throw new Error("Sessio vanhentunut. Kirjaudu uudelleen.");
      }

      const orgId = await getUserOrgId(user.id);
      if (!orgId) return;

      // Hae template-tiedot placid_id:n saamiseksi
      const { data: template, error: templateError } = await supabase
        .from("variables")
        .select("id, placid_id")
        .eq("id", templateId)
        .eq("user_id", orgId)
        .single();

      if (templateError || !template) {
        throw new Error("Templatea ei löytynyt");
      }

      const newReadyStatus = !currentReady;

      // Päivitä template_ready kenttä Supabasessa
      const { error: updateError } = await supabase
        .from("variables")
        .update({ template_ready: newReadyStatus })
        .eq("id", templateId)
        .eq("user_id", orgId);

      if (updateError) {
        throw new Error(updateError.message);
      }

      // Päivitä Airtableen N8N:n kautta
      try {
        await axios.post(
          "/api/placid/create-template",
          {
            action: "update_template_ready",
            templateId: template.placid_id, // Lähetä placid_id N8N:ään
            templateReady: newReadyStatus,
          },
          {
            headers: {
              Authorization: `Bearer ${sessionData.session.access_token}`,
              "Content-Type": "application/json",
            },
          },
        );
      } catch (n8nError) {
        // Loggaa virhe mutta älä peruuta koko toimintoa - Supabase on jo päivitetty
        console.warn("N8N sync failed (continuing anyway):", n8nError);
      }

      // Päivitä paikallinen tila
      setTemplates((prev) =>
        prev.map((t) =>
          t.id === templateId ? { ...t, template_ready: newReadyStatus } : t,
        ),
      );

      toast.success(
        newReadyStatus
          ? t("general.templateMarkedReady")
          : t("general.templateMarkedNotReady"),
      );
    } catch (error) {
      console.error("Error toggling template ready status:", error);
      toast.error(error.message || t("general.templateToggleFailed"));
    } finally {
      setTogglingTemplateId(null);
    }
  };

  if (loading) {
    return (
      <div className="placid-templates-loading">{t("ui.buttons.loading")}</div>
    );
  }

  return (
    <div className="placid-templates-container">
      <div className="placid-templates-header">
        <h3 className="placid-templates-title">{t("general.myTemplates")}</h3>
        <button
          onClick={handleCreateTemplate}
          disabled={creating}
          className="placid-templates-create-button"
        >
          {creating ? t("ui.buttons.creating") : t("general.createTemplate")}
        </button>
      </div>

      {templates.length === 0 ? (
        <div className="placid-templates-empty-state">
          {t("general.noTemplatesYet")}
        </div>
      ) : (
        <div className="placid-templates-grid">
          {templates.map((template) => (
            <div key={template.id} className="placid-templates-card">
              {template.thumbnail_url && (
                <div className="placid-templates-thumbnail-wrapper">
                  <img
                    src={template.thumbnail_url}
                    alt={template.variable_id || t("general.untitledTemplate")}
                    className="placid-templates-thumbnail"
                  />
                </div>
              )}
              <div className="placid-templates-card-content">
                <div className="placid-templates-template-name">
                  {template.variable_id || t("general.untitledTemplate")}
                </div>
                <div className="placid-templates-template-id">
                  ID: {template.placid_id}
                </div>
                <div className="placid-templates-ready-toggle">
                  <span className="placid-templates-ready-label">
                    {template.template_ready
                      ? t("general.templateReady")
                      : t("general.templateNotReady")}
                  </span>
                  <label className="placid-templates-switch">
                    <input
                      type="checkbox"
                      checked={template.template_ready || false}
                      onChange={() =>
                        handleToggleReady(
                          template.id,
                          template.template_ready || false,
                        )
                      }
                      disabled={togglingTemplateId === template.id}
                    />
                    <span className="placid-templates-slider" />
                  </label>
                </div>
              </div>
              <button
                onClick={() => setEditingTemplate(template.placid_id)}
                className="placid-templates-edit-button"
              >
                {t("posts.actions.edit")}
              </button>
            </div>
          ))}
        </div>
      )}

      {editingTemplate && (
        <PlacidEditor
          placidId={editingTemplate}
          onClose={() => setEditingTemplate(null)}
        />
      )}
    </div>
  );
}
