// api/ollama.js — Proxy Vercel pour Ollama Cloud (CORS proxy)
// Ollama Cloud nécessite un Bearer token qui reste côté client (non exposé ici)

export default async function handler(req, res) {
  // ── CORS ──────────────────────────────────────────────────────────
  const origin = req.headers.origin || "";
  const allowed = process.env.ALLOWED_ORIGIN || "*";
  res.setHeader("Access-Control-Allow-Origin", allowed === "*" ? "*" : (origin === allowed ? origin : "null"));
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // ── Validation du body ───────────────────────────────────────────
  const { model, messages, stream } = req.body || {};
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "Body invalide : 'messages' requis." });
  }
  const bodyStr = JSON.stringify(req.body);
  if (bodyStr.length > 100000) {
    return res.status(413).json({ error: "Requête trop volumineuse (max 100KB)." });
  }

  // ── Proxy vers Ollama Cloud ───────────────────────────────────────
  const authHeader = req.headers["authorization"];
  try {
    const response = await fetch("https://ollama.com/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { "Authorization": authHeader } : {}),
      },
      body: JSON.stringify({ model, messages, stream: stream || false }),
    });
    const data = await response.json().catch(() => ({}));
    return res.status(response.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: "Erreur proxy : " + err.message });
  }
}
