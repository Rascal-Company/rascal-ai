import { withOrganization } from "../_middleware/with-organization.js";
import { sendToN8N } from "../_lib/n8n-client.js";

/**
 * POST /api/calls/knowledge-base
 * - action: 'create' | 'status' | 'list' | 'delete' | 'set_enabled'
 *
 * Käyttää N8N_SYNTHFLOW_DATABASE webhookkia.
 * Tallentaa luodun tietokannan ID:n public.users.vector_store_id -kenttään (org-rivi).
 */
async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { data: orgData } = req.organization;
    const orgId = orgData?.id;
    if (!orgId) {
      return res.status(400).json({ error: "Organisaatiota ei löytynyt" });
    }

    const body = req.body || {};
    const action = body.action || "status";

    if (action === "status") {
      return res.status(200).json({
        success: true,
        org_id: orgId,
        vector_store_id: orgData.vector_store_id || null,
        inbound_enabled: Boolean(orgData.calls_kb_inbound_enabled),
        outbound_enabled: Boolean(orgData.calls_kb_outbound_enabled),
      });
    }

    if (action === "list") {
      if (!orgData.vector_store_id) {
        return res.status(200).json({ success: true, files: [] });
      }

      // Hae tiedostot suoraan Supabasesta (nopeampi kuin N8N)
      const { data, error } = await req.supabase
        .from("calls_knowledge_files")
        .select(
          "id, file_name, file_url, source_type, source_url, status, created_at",
        )
        .eq("org_id", orgId)
        .order("created_at", { ascending: false });

      if (error) {
        return res.status(500).json({
          error: "Tiedostojen haku epäonnistui",
          details: error.message,
        });
      }

      return res.status(200).json({
        success: true,
        vector_store_id: orgData.vector_store_id,
        files: data || [],
      });
    }

    if (action === "delete") {
      const { id } = body || {};
      if (!id) return res.status(400).json({ error: "id vaaditaan" });

      // Hae rivi (varmistetaan org)
      const { data: row, error: rowErr } = await req.supabase
        .from("calls_knowledge_files")
        .select("id, file_name, file_url, vector_store_id")
        .eq("org_id", orgId)
        .eq("id", id)
        .maybeSingle();

      if (rowErr) {
        return res
          .status(500)
          .json({
            error: "Poistettavan rivin haku epäonnistui",
            details: rowErr.message,
          });
      }
      if (!row) {
        return res.status(404).json({ error: "Riviä ei löytynyt" });
      }

      // Lähetä poistopyyntö N8N:ään (HMAC)
      const webhookUrl = process.env.N8N_SYNTHFLOW_DATABASE;
      if (!webhookUrl) {
        return res
          .status(500)
          .json({ error: "N8N_SYNTHFLOW_DATABASE puuttuu" });
      }

      await sendToN8N(webhookUrl, {
        action: "delete",
        orgId,
        vector_store_id: orgData.vector_store_id,
        row_id: row.id,
        file: {
          id: row.id,
          filename: row.file_name,
          url: row.file_url,
        },
        requestedAt: new Date().toISOString(),
      });

      // Poista rivi Supabasesta
      const { error: delErr } = await req.supabase
        .from("calls_knowledge_files")
        .delete()
        .eq("org_id", orgId)
        .eq("id", id);

      if (delErr) {
        return res
          .status(500)
          .json({ error: "Rivin poisto epäonnistui", details: delErr.message });
      }

      return res.status(200).json({ success: true, deleted_id: id });
    }

    if (action === "set_enabled") {
      const webhookUrl = process.env.N8N_SYNTHFLOW_DATABASE;
      if (!webhookUrl) {
        return res
          .status(500)
          .json({ error: "N8N_SYNTHFLOW_DATABASE puuttuu" });
      }
      if (!orgData.vector_store_id) {
        return res
          .status(400)
          .json({
            error: "Tietokantaa ei ole luotu (vector_store_id puuttuu)",
          });
      }

      const bot = body.bot;
      const enabled = Boolean(body.enabled);
      if (bot !== "inbound" && bot !== "outbound") {
        return res
          .status(400)
          .json({ error: "bot pitää olla inbound tai outbound" });
      }

      const updatePatch =
        bot === "inbound"
          ? { calls_kb_inbound_enabled: enabled }
          : { calls_kb_outbound_enabled: enabled };

      const { error: updErr } = await req.supabase
        .from("users")
        .update(updatePatch)
        .eq("id", orgId);

      if (updErr) {
        return res
          .status(500)
          .json({
            error: "Tilan tallennus epäonnistui",
            details: updErr.message,
          });
      }

      // Kytke knowledge base botille N8N:n kautta (HMAC)
      await sendToN8N(webhookUrl, {
        action: "set_enabled",
        orgId,
        bot,
        enabled,
        vector_store_id: orgData.vector_store_id,
        vapi_assistant_id: orgData.vapi_assistant_id || null,
        vapi_inbound_assistant_id: orgData.vapi_inbound_assistant_id || null,
        requestedAt: new Date().toISOString(),
      });

      // Palauta uudet flagit (päivitä in-muistiin myös)
      return res.status(200).json({
        success: true,
        inbound_enabled:
          bot === "inbound"
            ? enabled
            : Boolean(orgData.calls_kb_inbound_enabled),
        outbound_enabled:
          bot === "outbound"
            ? enabled
            : Boolean(orgData.calls_kb_outbound_enabled),
      });
    }

    if (action !== "create") {
      return res.status(400).json({ error: "Virheellinen action" });
    }

    const webhookUrl = process.env.N8N_SYNTHFLOW_DATABASE;
    if (!webhookUrl) {
      return res.status(500).json({ error: "N8N_SYNTHFLOW_DATABASE puuttuu" });
    }

    // Jos tietokanta on jo olemassa, palauta se sellaisenaan
    if (orgData.vector_store_id) {
      return res.status(200).json({
        success: true,
        vector_store_id: orgData.vector_store_id,
        already_exists: true,
      });
    }

    // Pyydä N8N:ää luomaan tietokanta / vector store
    const n8nResp = await sendToN8N(webhookUrl, {
      action: "create",
      orgId,
      authUserId: req.authUser?.id,
      companyId: orgData.company_id,
      companyName: orgData.company_name,
      requestedAt: new Date().toISOString(),
    });

    const createdId =
      n8nResp?.vector_store_id ||
      n8nResp?.vectorStoreId ||
      n8nResp?.id ||
      n8nResp?.data?.vector_store_id ||
      n8nResp?.data?.vectorStoreId ||
      n8nResp?.data?.id;

    if (!createdId) {
      return res.status(500).json({
        error: "Tietokannan luonti epäonnistui: ID puuttuu N8N-vastauksesta",
        details: n8nResp,
      });
    }

    const { error: updateError } = await req.supabase
      .from("users")
      .update({ vector_store_id: createdId })
      .eq("id", orgId);

    if (updateError) {
      return res.status(500).json({
        error: "Tietokannan ID:n tallennus epäonnistui",
        details: updateError.message,
      });
    }

    return res.status(200).json({
      success: true,
      vector_store_id: createdId,
    });
  } catch (e) {
    return res.status(500).json({
      error: "Virhe tietokanta-endpointissa",
      details: e.message,
    });
  }
}

export default withOrganization(handler);
