import { withOrganization } from "../_middleware/with-organization.js";
import { streamFromN8N } from "../_lib/n8n-client.js";

// Yksinkertainen in-memory duplikaattisuojus viesteille
// Säilytetään viimeisimmät clientMessageId:t lyhyen aikaa
const RECENT_IDS = new Map(); // id -> timestamp
const WINDOW_MS = 2 * 60 * 1000; // 2 minuuttia

function isDuplicateAndMark(id) {
  if (!id) {
    console.log("[ai-chat] No ID provided, not a duplicate");
    return false;
  }

  const now = Date.now();
  // Siivous
  for (const [key, ts] of RECENT_IDS) {
    if (now - ts > WINDOW_MS) RECENT_IDS.delete(key);
  }

  // Tarkista onko ID jo merkitty
  if (RECENT_IDS.has(id)) {
    console.log(
      "[ai-chat] Duplicate ID found:",
      id,
      "Existing IDs:",
      Array.from(RECENT_IDS.keys()),
    );
    return true;
  }

  // Merkitse ID käytetyksi
  RECENT_IDS.set(id, now);
  console.log("[ai-chat] New ID marked:", id, "Total IDs:", RECENT_IDS.size);
  return false;
}

async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const N8N_CHAT_API_URL = process.env.N8N_CHAT_API_URL;
  if (!N8N_CHAT_API_URL) {
    return res.status(500).json({ error: "N8N_CHAT_API_URL not set" });
  }

  try {
    // Duplikaattisuojus: jos sama clientMessageId on jo käsitelty äskettäin, palautetaan 200 heti
    // clientMessageId voi olla joko ylimmällä tasolla tai data-objektissa
    const clientMessageId =
      req.body?.clientMessageId || req.body?.data?.clientMessageId;
    console.log("[ai-chat] Received request:", {
      hasClientMessageId: !!clientMessageId,
      clientMessageId,
      bodyKeys: Object.keys(req.body || {}),
      dataKeys: req.body?.data ? Object.keys(req.body.data) : [],
    });

    // Tarkista duplikaatti ENNEN kuin merkitään käytetyksi
    // HUOM: React Strict Mode lähettää viestin kaksi kertaa kehityksessä, joten
    // duplikaattisuojaus on tärkeä, mutta se ei estä ensimmäistä lähetystä
    const isDuplicate = clientMessageId
      ? isDuplicateAndMark(clientMessageId)
      : false;
    console.log("[ai-chat] Duplicate check result:", {
      clientMessageId,
      isDuplicate,
    });

    if (isDuplicate) {
      console.log(
        "[ai-chat] Duplicate request detected, returning early (not sending to N8N)",
      );
      // Palautetaan success vaikka se on duplikaatti, jotta frontend ei näytä virhettä
      return res.status(200).json({ duplicated: true, ok: true });
    }

    // Luodaan turvallinen payload: userId on luotettu, data on epäluotettu
    // Poistetaan userId datasta koska se on jo ylimmällä tasolla
    const { userId: _, ...dataWithoutUserId } = req.body;

    const safePayload = {
      userId: req.organization.id, // Luotettu organisaation ID (withOrganization middleware varmistaa)
      data: dataWithoutUserId, // Epäluotettu (sisältää message, threadId, assistantType, clientMessageId, jne. ilman userId:ta)
    };

    // Lähetetään N8N:ään HMAC-allekirjoituksella ja striimataan vastaus
    console.log("[ai-chat] Sending to N8N (streaming):", {
      clientMessageId,
      userId: safePayload.userId,
      hasData: !!safePayload.data,
    });
    const n8nResponse = await streamFromN8N(N8N_CHAT_API_URL, safePayload);
    console.log("[ai-chat] N8N response received, streaming through");

    // Asetetaan streaming-headerit
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Transfer-Encoding", "chunked");

    // Striimataan N8N:n vastaus suoraan clientille
    const reader = n8nResponse.body.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
    } finally {
      reader.releaseLock();
    }
    return res.end();
  } catch (error) {
    console.error("Chat proxy error:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
    });

    const status = error.message?.includes("status")
      ? parseInt(error.message.match(/status (\d+)/)?.[1] || "500")
      : 500;
    const isDevelopment = process.env.NODE_ENV === "development";

    // Jos headerit on jo lähetetty (streaming alkanut), ei voi enää lähettää JSON-virhettä
    if (res.headersSent) {
      return res.end();
    }

    return res.status(status).json({
      error: "Chat proxy error",
      status,
      ...(isDevelopment && { details: { message: error.message } }),
      hint:
        status === 403
          ? "N8N workflow ei vielä tue HMAC-allekirjoitusta. Tarkista N8N workflow konfiguraatio."
          : undefined,
    });
  }
}

export default withOrganization(handler);
