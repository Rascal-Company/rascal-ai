// api/lib/n8n-client.js
import { generateHmacSignature } from "./crypto.js";

export async function sendToN8N(webhookUrl, payload) {
  const secret = process.env.N8N_SECRET_KEY;

  if (!secret) {
    console.error("sendToN8N: N8N_SECRET_KEY missing");
    throw new Error("N8N_SECRET_KEY missing");
  }
  if (!webhookUrl) {
    console.error("sendToN8N: webhookUrl missing");
    throw new Error("N8N_WORKFLOW_URL missing");
  }

  console.log("sendToN8N: Sending to webhook:", webhookUrl);
  console.log("sendToN8N: Payload action:", payload?.action || "unknown");

  // Lähetetään vain HMAC-allekirjoitus HTTP headereina (standard webhook)
  const payloadString = JSON.stringify(payload);
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = generateHmacSignature(payloadString, secret, timestamp);

  // Lähetetään sekä HMAC-allekirjoitus että x-api-key taaksepäin yhteensopivuuden vuoksi
  // Mixpost-workflow odottaa vielä x-api-key headeria
  const headers = {
    "Content-Type": "application/json",
    "x-rascal-timestamp": timestamp, // HMAC timestamp
    "x-rascal-signature": signature, // HMAC signature
    "x-api-key": secret, // Taaksepäin yhteensopivuus Mixpost-workflowlle
  };

  const fetchOptions = {
    method: "POST",
    headers,
    body: payloadString,
  };

  console.log("sendToN8N: Making request with headers:", {
    "Content-Type": headers["Content-Type"],
    "x-rascal-timestamp": headers["x-rascal-timestamp"],
    "x-rascal-signature":
      headers["x-rascal-signature"]?.substring(0, 20) + "...",
    "x-api-key": headers["x-api-key"]
      ? "present (length: " + headers["x-api-key"].length + ")"
      : "missing",
  });

  const response = await fetch(webhookUrl, fetchOptions);

  console.log(
    "sendToN8N: Response status:",
    response.status,
    response.statusText,
  );

  if (!response.ok) {
    const errorText = await response.text().catch(() => "No error details");
    console.error("N8N webhook error:", {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      errorText,
    });
    throw new Error(
      `N8N webhook failed with status ${response.status}: ${errorText.substring(0, 200)}`,
    );
  }

  return await response.json().catch(() => ({ success: true }));
}

export async function streamFromN8N(webhookUrl, payload) {
  const secret = process.env.N8N_SECRET_KEY;

  if (!secret) {
    throw new Error("N8N_SECRET_KEY missing");
  }
  if (!webhookUrl) {
    throw new Error("N8N_WORKFLOW_URL missing");
  }

  const payloadString = JSON.stringify(payload);
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = generateHmacSignature(payloadString, secret, timestamp);

  const headers = {
    "Content-Type": "application/json",
    "x-rascal-timestamp": timestamp,
    "x-rascal-signature": signature,
    "x-api-key": secret,
  };

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers,
    body: payloadString,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "No error details");
    throw new Error(
      `N8N webhook failed with status ${response.status}: ${errorText.substring(0, 200)}`,
    );
  }

  return response;
}
