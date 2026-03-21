// ╔══════════════════════════════════════════════════════════════╗
// ║  src/api/ai-service.js — Appels API vers tous les providers  ║
// ║  Ajouter un provider : copier callCompat et adapter          ║
// ╚══════════════════════════════════════════════════════════════╝

import { MODEL_DEFS } from "../config/models.js";

export const fmt = (n) => n>=1e6?(n/1e6).toFixed(1)+"M":n>=1000?(n/1000).toFixed(1)+"k":String(n);

export function classifyError(msg) {
  const m = (msg||"").toLowerCase();
  if (m.includes("429")||m.includes("rate limit")||m.includes("too many")) return "ratelimit";
  if (m.includes("quota")||m.includes("credit")||m.includes("billing")||m.includes("insufficient")||m.includes("exceeded")) return "credit_warn"; // warn only, don't block
  return "other";
}


// ── Smart message truncation based on model context limit ────────
export function truncateForModel(messages, modelId, system="") {
  const m = MODEL_DEFS[modelId];
  const limit = m?.inputLimit || 28000; // default safe 28k tokens
  const CHARS_PER_TOKEN = 4;
  const maxChars = limit * CHARS_PER_TOKEN;

  // Count current chars
  const sysChars = (system||"").length;
  const msgChars = messages.reduce((a,m)=>a+(m.content||"").length, 0);
  const totalChars = sysChars + msgChars;

  if (totalChars <= maxChars) return messages; // no truncation needed

  // Find the last user message and truncate its content
  const budget = maxChars - sysChars - 200; // 200 chars safety margin
  const msgs = [...messages];

  // First try: truncate only the last message
  for (let i = msgs.length-1; i >= 0; i--) {
    if (msgs[i].role === "user" && msgs[i].content.length > 500) {
      const otherChars = msgs.reduce((a,m,idx)=>idx!==i?a+(m.content||"").length:a, 0);
      const allowedChars = budget - otherChars;
      if (allowedChars > 200) {
        const orig = msgs[i].content;
        // Keep the end of the message (the question) + truncate the middle (context)
        const keepEnd = Math.min(800, Math.floor(allowedChars * 0.3));
        const keepStart = allowedChars - keepEnd - 60;
        msgs[i] = {
          ...msgs[i],
          content: orig.slice(0, keepStart) +
            `\n\n[... ${Math.round((orig.length - keepStart - keepEnd)/CHARS_PER_TOKEN)}k tokens tronqués pour respecter la limite du modèle (${limit}k tokens) ...]\n\n` +
            orig.slice(-keepEnd)
        };
        return msgs;
      }
    }
  }

  // Fallback: keep only last 2 messages
  return msgs.slice(-2);
}

export async function callClaude(messages, system="Tu es un assistant IA utile et concis.", attachedFile=null) {
  // Construire les messages avec support fichiers (vision + texte)
  const apiMessages = messages.map((m, i) => {
    const isLast = i === messages.length - 1;
    if (isLast && attachedFile) {
      if (attachedFile.type === "image") {
        return { role: m.role, content: [
          { type: "image", source: { type: "base64", media_type: attachedFile.mimeType, data: attachedFile.base64 } },
          { type: "text", text: m.content }
        ]};
      } else {
        return { role: m.role, content: `📎 Fichier : ${attachedFile.name}\n\n${attachedFile.content}\n\n---\n${m.content}` };
      }
    }
    return { role: m.role, content: m.content };
  });
  const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  const endpoint = isLocal ? "https://api.anthropic.com/v1/messages" : "/api/claude";
  const claudeHeaders = isLocal
    ? {"Content-Type":"application/json","x-api-key":"","anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"}
    : {"Content-Type":"application/json"};
  const r = await fetch(endpoint,{method:"POST",headers:claudeHeaders,body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:2000,system,messages:apiMessages})});
  const rawText = await r.text();
  let d;
  try { d = JSON.parse(rawText); } catch {
    // La réponse n'est pas du JSON → le proxy n'est pas configuré
    if (!isLocal) {
      throw new Error("❌ Proxy Claude non configuré sur Vercel. Va dans Vercel → Settings → Environment Variables → ajoute ANTHROPIC_API_KEY. En attendant, utilise Groq ou Mistral (100% gratuits, aucune config).");
    }
    throw new Error("Réponse invalide de l'API Claude : " + rawText.slice(0,100));
  }
  if(d.error) throw new Error(d.error.message || JSON.stringify(d.error));
  return d.content[0].text;
}
export async function callGemini(messages, apiKey, system="Tu es un assistant IA utile et concis.") {
  if (!apiKey) throw new Error("Clé Gemini manquante. Va sur aistudio.google.com/app/apikey pour en créer une gratuite.");
  const last = messages[messages.length-1].content;
  const history = messages.slice(0,-1).map(m => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{text: m.content}]
  }));
  const body = {
    systemInstruction: { parts: [{text: system}] },
    contents: [...history, {role:"user", parts:[{text:last}]}],
    generationConfig: { maxOutputTokens: 1500 }
  };
  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body)}
  );
  const raw = await r.text();
  let d; try { d = JSON.parse(raw); } catch { throw new Error("Réponse Gemini invalide: " + raw.slice(0,100)); }
  if(d.error) throw new Error(d.error.message||JSON.stringify(d.error));
  if(!d.candidates?.[0]?.content?.parts?.[0]?.text) throw new Error("Gemini: réponse vide. Détail: " + JSON.stringify(d).slice(0,200));
  return d.candidates[0].content.parts[0].text;
}
// ── Ollama Cloud ─────────────────────────────────────────────────
// API Ollama Cloud : https://ollama.com/api/chat avec Bearer token
export async function callOllamaCloud(messages, apiKey, model, system="Tu es un assistant IA utile et concis.") {
  if (!apiKey) throw new Error("Clé Ollama Cloud manquante. Va sur ollama.com/settings/tokens pour en créer une gratuite.");
  const msgs = system ? [{role:"system",content:system},...messages] : messages;
  const r = await fetch("https://ollama.com/api/chat", {
    method:"POST",
    headers:{"Content-Type":"application/json","Authorization":`Bearer ${apiKey}`},
    body:JSON.stringify({ model, messages:msgs, stream:false })
  });
  if (!r.ok) {
    const txt = await r.text().catch(()=>"");
    throw new Error(`Ollama Cloud ${r.status}: ${txt.slice(0,150)}`);
  }
  const d = await r.json();
  if (d.error) throw new Error(d.error.message||JSON.stringify(d.error));
  return d.message?.content || "";
}
export async function callOllamaCloudStream(messages, apiKey, model, system="Tu es un assistant IA utile et concis.", onChunk) {
  if (!apiKey) throw new Error("Clé Ollama Cloud manquante. Va sur ollama.com/settings/tokens pour en créer une gratuite.");
  const msgs = system ? [{role:"system",content:system},...messages] : messages;
  const r = await fetch("https://ollama.com/api/chat", {
    method:"POST",
    headers:{"Content-Type":"application/json","Authorization":`Bearer ${apiKey}`},
    body:JSON.stringify({ model, messages:msgs, stream:true })
  });
  if (!r.ok) {
    const txt = await r.text().catch(()=>"");
    throw new Error(`Ollama Cloud ${r.status}: ${txt.slice(0,150)}`);
  }
  const reader = r.body.getReader();
  const decoder = new TextDecoder();
  let fullText = "";
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream:true });
    const lines = buffer.split("\n");
    buffer = lines.pop();
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const json = JSON.parse(trimmed);
        const content = json.message?.content;
        if (content) {
          fullText += content;
          onChunk(fullText);
        }
      } catch {}
    }
  }
  return fullText;
}
// ── Pollinations.AI — deux endpoints ──────────────────────────────
// text.pollinations.ai/openai  = GRATUIT ANONYME, modèle "openai" uniquement (legacy)
// gen.pollinations.ai/v1/...   = TOUS les modèles (claude, deepseek, gemini…) — clé Pollen gratuite sur enter.pollinations.ai
let _pollQueue = Promise.resolve();
const POLL_DELAY_MS = 8000; // 8s entre requêtes Pollinations (gen endpoint plus permissif)

export async function callPollinations(messages, model, system="Tu es un assistant IA utile et concis.") {
  const msgs = system ? [{role:"system",content:system},...messages] : messages;
  const r = await fetch("https://text.pollinations.ai/openai", {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({ model:"openai", messages:msgs, max_tokens:1500, private:true, referrer:"multiia-hub.vercel.app" })
  });
  if (!r.ok) {
    const txt = await r.text().catch(()=>"");
    throw new Error("Pollinations " + r.status + ": " + txt.slice(0,150));
  }
  const d = await r.json();
  if (d.error) throw new Error(d.error.message||JSON.stringify(d.error));
  return d.choices?.[0]?.message?.content || "";
}

export async function callPollinationsPaid(messages, apiKey, model, system="Tu es un assistant IA utile et concis.") {
  // Endpoint gen.pollinations.ai — partage la même queue IP que callPollinations
  if(!apiKey) throw new Error("Clé Pollen manquante. Va sur enter.pollinations.ai → inscription gratuite → copie ta clé dans Config.");
  const ticket = _pollQueue;
  _pollQueue = ticket.then(() => new Promise(res => setTimeout(res, POLL_DELAY_MS)));
  await ticket;
  const msgs = system ? [{role:"system",content:system},...messages] : messages;
  const r = await fetch("https://gen.pollinations.ai/v1/chat/completions", {
    method:"POST",
    headers:{"Content-Type":"application/json","Authorization":`Bearer ${apiKey}`},
    body:JSON.stringify({ model, messages:msgs, max_tokens:1500 })
  });
  if(!r.ok) { const txt = await r.text().catch(()=>""); throw new Error("Pollinations " + r.status + ": " + txt.slice(0,150)); }
  const d = await r.json();
  if(d.error) throw new Error(d.error.message||JSON.stringify(d.error));
  return d.choices?.[0]?.message?.content || "";
}

export async function callCompat(messages, apiKey, baseUrl, model, system="Tu es un assistant IA utile et concis.") {
  const headers = {"Content-Type":"application/json","Authorization":`Bearer ${apiKey}`};
  if (baseUrl.includes("openrouter")) {
    headers["HTTP-Referer"] = "https://multiia-hub.vercel.app";
    headers["X-Title"] = "Multi-IA Hub";
  }
  const modelId = Object.keys(MODEL_DEFS).find(id => MODEL_DEFS[id].model === model && MODEL_DEFS[id].baseUrl === baseUrl);
  const safeMessages = truncateForModel(messages, modelId, system);
  const r = await fetch(`${baseUrl}/chat/completions`,{method:"POST",headers,body:JSON.stringify({model,max_tokens:1500,messages:[{role:"system",content:system},...safeMessages.map(m=>({role:m.role,content:m.content}))]})});
  const raw = await r.text();
  let d;
  try { d = JSON.parse(raw); } catch { throw new Error("Réponse invalide : " + raw.slice(0,120)); }
  if(d.error) throw new Error(typeof d.error==="string"?d.error:(d.error.message||JSON.stringify(d.error)));
  if(!d.choices || !d.choices[0]) throw new Error("Réponse vide — modèle indisponible. Détail: " + JSON.stringify(d).slice(0,200));
  return d.choices[0].message.content;
}

// ── Streaming SSE — tokens affichés au fur et à mesure ────────────
export async function callCompatStream(messages, apiKey, baseUrl, model, system="Tu es un assistant IA utile et concis.", onChunk) {
  const headers = {"Content-Type":"application/json","Authorization":`Bearer ${apiKey}`};
  if (baseUrl.includes("openrouter")) {
    headers["HTTP-Referer"] = "https://multiia-hub.vercel.app";
    headers["X-Title"] = "Multi-IA Hub";
  }
  const modelId = Object.keys(MODEL_DEFS).find(id => MODEL_DEFS[id].model === model && MODEL_DEFS[id].baseUrl === baseUrl);
  const safeMessages = truncateForModel(messages, modelId, system);
  const r = await fetch(`${baseUrl}/chat/completions`, {
    method:"POST", headers,
    body: JSON.stringify({
      model, max_tokens:1500, stream:true,
      messages:[{role:"system",content:system},...safeMessages.map(m=>({role:m.role,content:m.content}))]
    })
  });
  if (!r.ok) {
    const txt = await r.text();
    throw new Error(`HTTP ${r.status}: ${txt.slice(0,120)}`);
  }
  const reader = r.body.getReader();
  const decoder = new TextDecoder();
  let fullText = "";
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream:true });
    const lines = buffer.split("\n");
    buffer = lines.pop(); // garde la ligne incomplète
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed === "data: [DONE]") continue;
      if (!trimmed.startsWith("data: ")) continue;
      try {
        const json = JSON.parse(trimmed.slice(6));
        const delta = json.choices?.[0]?.delta?.content;
        if (delta) {
          fullText += delta;
          onChunk(fullText);
        }
      } catch {}
    }
  }
  return fullText;
}

export async function callModelStream(id, messages, keys, system, onChunk, attachedFile=null) {
  const m = MODEL_DEFS[id];
  if (!m) throw new Error("IA inconnue : " + id);
  const msgWithFile = attachedFile && attachedFile.type !== "image"
    ? messages.map((msg,i) => i===messages.length-1 ? {...msg, content:`📎 Fichier: ${attachedFile.name}\n\n${attachedFile.content}\n\n---\n${msg.content}`} : msg)
    : messages;
  // Seuls les providers compat supportent le streaming natif
  if (m.apiType === "compat") {
    const key = keys[m.keyName];
    if (!key) throw new Error(`Clé API manquante pour ${m.name}.`);
    return callCompatStream(msgWithFile, key, m.baseUrl, m.model, system, onChunk);
  }
  if (m.apiType === "ollama_cloud") {
    const key = keys[m.keyName];
    if (!key) throw new Error(`Clé API manquante pour ${m.name}.`);
    return callOllamaCloudStream(msgWithFile, key, m.model, system, onChunk);
  }
  // Fallback non-streaming pour les autres (pollinations, cohere, gemini)
  const result = await callModel(id, messages, keys, system, attachedFile);
  onChunk(result);
  return result;
}
export async function callCohere(messages, apiKey, system="Tu es un assistant IA utile et concis.") {
  if (!apiKey) throw new Error("Clé Cohere manquante. Va sur dashboard.cohere.com/api-keys");
  const chatHistory = messages.slice(0,-1).map(m => ({
    role: m.role === "assistant" ? "CHATBOT" : "USER",
    message: m.content
  }));
  const last = messages[messages.length-1].content;
  const r = await fetch("https://api.cohere.ai/v1/chat", {
    method:"POST",
    headers:{"Content-Type":"application/json","Authorization":`Bearer ${apiKey}`},
    body: JSON.stringify({ model:"command-r-plus-08-2024", message: last, chat_history: chatHistory, preamble: system, max_tokens: 1500 })
  });
  const raw = await r.text();
  let d; try { d = JSON.parse(raw); } catch { throw new Error("Réponse Cohere invalide"); }
  if(d.message) throw new Error(d.message);
  return d.text;
}
export async function callModel(id, messages, keys, system, attachedFile=null) {
  const m=MODEL_DEFS[id];
  if(!m) throw new Error("IA inconnue : " + id);
  // Injecter fichier dans le texte
  const msgWithFile = attachedFile && attachedFile.type !== "image"
    ? messages.map((msg,i) => i===messages.length-1 ? {...msg, content:`📎 Fichier: ${attachedFile.name}\n\n${attachedFile.content}\n\n---\n${msg.content}`} : msg)
    : messages;
  if(m.apiType==="gemini") return callGemini(msgWithFile,keys.gemini,system);
  if(m.apiType==="cohere") return callCohere(messages,keys.cohere,system);
  if(m.apiType==="pollinations")      return callPollinations(msgWithFile,m.model,system);
  if(m.apiType==="pollinations_paid") return callPollinationsPaid(msgWithFile,keys.pollen||"",m.model,system);
  if(m.apiType==="ollama_cloud") return callOllamaCloud(msgWithFile,keys.ollama_cloud,m.model,system);
  if(m.apiType==="compat") {
    const key = keys[m.keyName];
    if(!key) throw new Error(`Clé API manquante pour ${m.name}. Va dans ⚙ Config pour l'ajouter gratuitement.`);
    return callCompat(msgWithFile,key,m.baseUrl,m.model,system);
  }
  throw new Error("Type d'API non supporté : " + m.apiType);
}
export async function correctGrammar(text, keys) {
  const sys = "Tu es un correcteur expert. Tu corriges sans changer le sens.";
  const msgs = [{role:"user",content:`Corrige les fautes d'orthographe, grammaire et ponctuation. Retourne UNIQUEMENT le texte corrigé, sans commentaires.\n\n${text}`}];
  if (keys && keys.groq_inf) return callCompat(msgs, keys.groq_inf, "https://api.groq.com/openai/v1", "llama-3.3-70b-versatile", sys);
  if (keys && keys.mistral) return callCompat(msgs, keys.mistral, "https://api.mistral.ai/v1", "mistral-small-latest", sys);
  throw new Error("Active Groq ou Mistral pour utiliser le correcteur.");
}

// ── Personas par défaut ───────────────────────────────────────────

// ── Smart Context Compression ────────────────────────────────────
// Quand l'historique dépasse N messages, résume les anciens avec Groq
export async function compressContext(messages, keys, threshold=12) {
  // Only compress if we have enough old messages
  if (messages.length <= threshold) return messages;

  // Keep the last 4 messages as-is (recent context)
  const recentMsgs = messages.slice(-4);
  const oldMsgs = messages.slice(0, -4);

  // Only user+assistant messages to summarize
  const toSummarize = oldMsgs.filter(m=>m.role==="user"||m.role==="assistant");
  if (toSummarize.length < 4) return messages;

  // Build summary prompt
  const conv = toSummarize.map(m=>`${m.role==="user"?"Utilisateur":"IA"}: ${m.content.slice(0,300)}`).join("\n");
  const summaryPrompt = `Résume cette conversation en 3 points clés maximum (50 mots max par point). Format bullet points :\n\n${conv}`;

  try {
    // Use Groq (fast + free) for summarization
    const groqKey = keys?.groq_inf;
    if (!groqKey) return messages; // No key → skip compression

    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method:"POST",
      headers:{"Content-Type":"application/json","Authorization":"Bearer "+groqKey},
      body:JSON.stringify({
        model:"llama-3.3-70b-versatile",
        max_tokens:200,
        messages:[{role:"user",content:summaryPrompt}]
      })
    });
    const d = await r.json();
    const summary = d.choices?.[0]?.message?.content;
    if (!summary) return messages;

    // Replace old messages with a single summary message
    const summaryMsg = {
      role:"system",
      content:`[📋 Résumé des ${toSummarize.length} messages précédents]\n${summary}`
    };
    return [summaryMsg, ...recentMsgs];
  } catch {
    return messages; // Fallback: no compression
  }
}
