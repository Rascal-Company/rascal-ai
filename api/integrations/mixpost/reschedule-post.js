import { withOrganization } from "../../_middleware/with-organization.js";
import { setCorsHeaders, handlePreflight } from "../../_lib/cors.js";

async function handler(req, res) {
  // CORS headers
  setCorsHeaders(res, ["PATCH", "OPTIONS"]);

  if (handlePreflight(req, res)) {
    return;
  }

  if (req.method !== "PATCH") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // req.organization.id = organisaation ID (public.users.id)
    // req.supabase = authenticated Supabase client
    const orgId = req.organization.id;

    const { postUuid, scheduledDate } = req.body;

    if (!postUuid) {
      return res.status(400).json({ error: "postUuid puuttuu" });
    }

    if (!scheduledDate) {
      return res.status(400).json({ error: "scheduledDate puuttuu" });
    }

    // Hae Mixpost-konfiguraatio käyttäen organisaation ID:tä
    const { data: configData, error: configError } = await req.supabase
      .from("user_mixpost_config")
      .select("mixpost_workspace_uuid, mixpost_api_token")
      .eq("user_id", orgId)
      .single();

    if (
      configError ||
      !configData?.mixpost_workspace_uuid ||
      !configData?.mixpost_api_token
    ) {
      return res.status(400).json({ error: "Mixpost-konfiguraatio puuttuu" });
    }

    // Hae ensin postauksen tiedot Mixpostista
    const mixpostApiUrl =
      process.env.MIXPOST_API_URL || "https://mixpost.mak8r.fi";
    const getUrl = `${mixpostApiUrl}/mixpost/api/${configData.mixpost_workspace_uuid}/posts/${postUuid}`;

    console.log("📅 Fetching post from Mixpost:", getUrl);

    const getResponse = await fetch(getUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${configData.mixpost_api_token}`,
        Accept: "application/json",
      },
    });

    if (!getResponse.ok) {
      const errorText = await getResponse.text();
      console.error("❌ Failed to fetch post:", errorText);
      throw new Error(`Postauksen haku epäonnistui: ${getResponse.status}`);
    }

    const postData = await getResponse.json();
    console.log("📦 Current post data:", postData);

    // Päivitä postauksen aikataulutus
    // Mixpost API odottaa date-kenttää ISO 8601 muodossa
    const updateData = {
      ...postData,
      date: scheduledDate, // ISO 8601 format (YYYY-MM-DDTHH:mm)
    };

    console.log("📅 Rescheduling post to:", scheduledDate);

    const putUrl = `${mixpostApiUrl}/mixpost/api/${configData.mixpost_workspace_uuid}/posts/${postUuid}`;

    const putResponse = await fetch(putUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${configData.mixpost_api_token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(updateData),
    });

    if (!putResponse.ok) {
      const errorText = await putResponse.text();
      console.error("❌ Mixpost PUT failed:", errorText);
      return res.status(putResponse.status).json({
        error: "Uudelleenajastus epäonnistui",
        details: errorText,
      });
    }

    const responseData = await putResponse.json();
    console.log("✅ Post rescheduled successfully:", responseData);

    return res.status(200).json({
      success: true,
      message: "Julkaisu ajastettu uudelleen onnistuneesti",
      data: responseData,
    });
  } catch (error) {
    console.error("❌ Reschedule API error:", error);
    return res.status(500).json({
      error: "Uudelleenajastus epäonnistui",
      details: error.message,
    });
  }
}

export default withOrganization(handler);
