// api/claude.js — Proxy Vercel sécurisé pour l'API Anthropic
// La clé API Anthropic reste côté serveur dans ANTHROPIC_API_KEY (variable d'environnement Vercel)
// Elle n'est JAMAIS exposée au client

// ── Rate limiting simple en mémoire (reset à chaque cold start Vercel) ──────
const ipHits = new Map();
const RATE_LIMIT = 20;       // max requêtes par IP
const RATE_WINDOW = 60000;   // sur 60 secondes

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = ipHits.get(ip) || { count: 0, start: now };
  if (now - entry.start > RATE_WINDOW) {
    ipHits.set(ip, { count: 1, start: now });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  ipHits.set(ip, entry);
  return true;
}

export default async function handler(req, res) {
  // ── CORS — restreindre à ton domaine en production ───────────────────────
  const origin = req.headers.origin || "";
  const allowed = process.env.ALLOWED_ORIGIN || "*"; // ex: "https://multiia-hub.vercel.app"
  res.setHeader("Access-Control-Allow-Origin", allowed === "*" ? "*" : (origin === allowed ? origin : "null"));
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // ── Rate limiting ─────────────────────────────────────────────────────────
  const ip = req.headers["x-forwarded-for"]?.split(",")[0].trim() || req.socket?.remoteAddress || "unknown";
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: { message: "Trop de requêtes. Réessaie dans une minute." } });
  }

  // ── Clé API depuis variable d'environnement Vercel ───────────────────────
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: { message: "Clé API Anthropic non configurée. Ajoute ANTHROPIC_API_KEY dans Vercel → Settings → Environment Variables." } });
  }

  // ── Validation du body ────────────────────────────────────────────────────
  const { model, messages, max_tokens, system } = req.body || {};
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: { message: "Body invalide : 'messages' requis." } });
  }
  // Limiter la taille pour éviter les abus
  const bodyStr = JSON.stringify(req.body);
  if (bodyStr.length > 100000) {
    return res.status(413).json({ error: { message: "Requête trop volumineuse (max 100KB)." } });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: model || "claude-sonnet-4-6",
        messages,
        max_tokens: Math.min(max_tokens || 2048, 4096), // plafonner à 4096 max
        ...(system ? { system } : {}),
      }),
    });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: { message: "Erreur proxy : " + err.message } });
  }
}
