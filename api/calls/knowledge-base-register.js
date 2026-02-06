import { withOrganization } from "../_middleware/with-organization.js";
import { sendToN8N } from "../_lib/n8n-client.js";

/**
 * POST /api/calls/knowledge-base-register
 * Register files that were already uploaded to Supabase Storage.
 *
 * - Requires Authorization Bearer token (withOrganization)
 * - Expects files metadata (already uploaded to temp-ingest bucket)
 * - Writes upload metadata to public.calls_knowledge_files
 * - Sends URL payload to N8N_SYNTHFLOW_DATABASE (HMAC via sendToN8N)
 */
async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const webhookUrl = process.env.N8N_SYNTHFLOW_DATABASE;
    if (!webhookUrl)
      return res.status(500).json({ error: "N8N_SYNTHFLOW_DATABASE puuttuu" });

    const SUPABASE_URL =
      process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!SUPABASE_URL) {
      return res.status(500).json({ error: "SUPABASE_URL puuttuu" });
    }

    const { data: orgData } = req.organization;
    const orgId = orgData?.id;
    if (!orgId)
      return res.status(400).json({ error: "Organisaatiota ei löytynyt" });

    if (!orgData.vector_store_id) {
      return res
        .status(400)
        .json({ error: "Tietokantaa ei ole luotu (vector_store_id puuttuu)" });
    }

    const { files } = req.body;
    if (!Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: "files array vaaditaan" });
    }

    const bucket = "temp-ingest";

    // Insert rows to Supabase table (tracking)
    const rows = files.map((f) => ({
      org_id: orgId,
      created_by: req.authUser.id,
      vector_store_id: orgData.vector_store_id,
      source_type: "file",
      file_name: f.fileName,
      mime_type: f.mimeType || null,
      file_size: f.size || null,
      status: "uploaded_to_temp",
      storage_bucket: bucket,
      storage_path: f.storagePath,
      file_url: `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${f.storagePath}`,
    }));

    const { data: inserted, error: insertErr } = await req.supabase
      .from("calls_knowledge_files")
      .insert(rows)
      .select("id, file_name, storage_path, file_url");

    if (insertErr) {
      return res
        .status(500)
        .json({
          error: "Tiedostometadatan tallennus epäonnistui",
          details: insertErr.message,
        });
    }

    // Send URL payload to N8N (HMAC)
    const payloadFiles = (inserted || []).map((r, idx) => ({
      id: r.id,
      filename: r.file_name,
      url: r.file_url,
      bucket,
      path: r.storage_path,
      mimeType: files[idx]?.mimeType || null,
      size: files[idx]?.size || null,
    }));

    let n8nResp;
    try {
      n8nResp = await sendToN8N(webhookUrl, {
        action: "feed",
        orgId,
        vector_store_id: orgData.vector_store_id,
        files: payloadFiles,
        uploadedAt: new Date().toISOString(),
      });
    } catch (e) {
      const ids = (inserted || []).map((r) => r.id);
      try {
        await req.supabase
          .from("calls_knowledge_files")
          .update({ status: "failed", error: e.message })
          .in("id", ids);
      } catch {}
      return res
        .status(500)
        .json({ error: "N8N webhook virhe", details: e.message });
    }

    const ids = (inserted || []).map((r) => r.id);
    try {
      await req.supabase
        .from("calls_knowledge_files")
        .update({ status: "sent_to_webhook", error: null })
        .in("id", ids);
    } catch {}

    return res
      .status(200)
      .json({
        success: true,
        registered: inserted?.length || 0,
        webhookResponse: n8nResp,
      });
  } catch (e) {
    return res
      .status(500)
      .json({ error: "Virhe knowledge-base registerissä", details: e.message });
  }
}

export default withOrganization(handler);
