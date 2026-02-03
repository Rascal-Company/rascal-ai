import { withOrganization } from "../_middleware/with-organization.js";

async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { threadId } = req.query;

    console.log("[ai-messages] GET request for threadId:", threadId);

    if (!threadId) {
      return res.status(400).json({ error: "threadId is required" });
    }

    // Hae viestit n8n_chat_histories taulusta session_id:n perusteella
    const { data: messages, error } = await req.supabase
      .from("n8n_chat_histories")
      .select("id, session_id, message")
      .eq("session_id", threadId)
      .order("id", { ascending: true });

    console.log("[ai-messages] Found messages:", messages?.length || 0);

    if (error) {
      console.error("[ai-messages] GET error:", error);
      return res
        .status(500)
        .json({ error: "Viestien haku epäonnistui", details: error.message });
    }

    // Muunna viestit oikeaan muotoon
    const formattedMessages = (messages || []).map((row, index) => {
      // Käsittele sekä objekti- että JSON-string -muoto
      let msg = row.message;

      // Jos message on jo objekti, käytä sitä suoraan
      if (typeof msg === "object" && msg !== null) {
        console.log(`[ai-messages] Message ${index} is already an object`);
      } else if (typeof msg === "string") {
        console.log(`[ai-messages] Message ${index} is a string, parsing...`);
        try {
          // Try parsing as-is first
          msg = JSON.parse(msg);
        } catch (e) {
          // If that fails, try fixing common control character issues
          console.log(
            `[ai-messages] Initial parse failed, fixing control characters...`,
          );
          try {
            // Fix unescaped control characters
            // This handles cases where the JSON string contains literal newlines/tabs
            const fixed = msg
              .replace(/\r\n/g, "\\n") // Windows line endings
              .replace(/\n/g, "\\n") // Unix line endings
              .replace(/\r/g, "\\r") // Old Mac line endings
              .replace(/\t/g, "\\t") // Tabs
              .replace(/\f/g, "\\f") // Form feeds
              .replace(/\b/g, "\\b"); // Backspaces

            msg = JSON.parse(fixed);
            console.log("[ai-messages] Successfully fixed and parsed JSON");
          } catch (e2) {
            console.error(
              "[ai-messages] JSON parse error even after fixes:",
              e2.message,
            );
            console.error(
              "[ai-messages] Original string:",
              msg.substring(0, 200),
            );
            msg = { type: "unknown", content: "" };
          }
        }
      } else {
        console.log(
          `[ai-messages] Message ${index} is unexpected type:`,
          typeof msg,
        );
        msg = { type: "unknown", content: "" };
      }

      msg = msg || {};

      const formatted = {
        role:
          msg.type === "human"
            ? "user"
            : msg.type === "ai"
              ? "assistant"
              : msg.type,
        content: msg.content || "",
      };

      console.log(`[ai-messages] Formatted message ${index}:`, {
        role: formatted.role,
        contentLength: formatted.content.length,
        hasContent: !!formatted.content,
      });

      return formatted;
    });

    console.log(
      "[ai-messages] Returning formatted messages:",
      formattedMessages.length,
    );
    return res.status(200).json({ messages: formattedMessages });
  } catch (e) {
    console.error("[ai-messages] Virhe:", e);
    return res
      .status(500)
      .json({ error: "Internal server error", details: e.message });
  }
}

export default withOrganization(handler);
