# 🤖 Multi-IA Hub — v20.0

> Interface web parallèle pour comparer, combiner et automatiser plusieurs IAs simultanément — gratuit, open source, déployable en 1 clic.

[![Version](https://img.shields.io/badge/version-20.0-blue)](CHANGELOG.md)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![Live](https://img.shields.io/badge/live-multiia--hub.vercel.app-brightgreen)](https://multiia-hub.vercel.app)

---

## ✨ Fonctionnalités

| Onglet | Description |
|---|---|
| **◈ Chat** | Chat parallèle avec jusqu'à 12 IAs simultanément |
| **🧠 Experts** | Panel d'experts multi-agent (Sécurité/Perf/UX/SEO…) |
| **⚡ Débat** | Débat 3 phases + Pipeline Concrétisation |
| **🔀 Workflows** | Automatisation en chaîne, 4 templates prédéfinis |
| **🎨 Canvas** | Exécution HTML live + 🔧 Auto-correction d'erreurs JS |
| **📰 Veille** | Agrégateur de news IA personnalisé |
| **🎙 Voice** | Conversation vocale mains-libres |
| **📁 Projets** | Projets avec contexte IA persistant |
| **📈 Analytics** | Coûts et utilisation par modèle |
| **🔬 Avancé** | Température, providers custom, system prompt global |
| **🌐 IAs Web** | 41+ IAs web classées par tendances |

### Features transversales
- **✦ Consensus** — Mixture of Agents, synthèse + détection d'erreurs
- **⚡ Diff** — Comparaison mot-à-mot des réponses de deux IAs
- **🧱 Prompt Builder** — Constructeur visuel de prompts en 5 blocs
- **🔗 Partage prompts** — Par URL (encode le prompt en base64)
- **🧠 Auto-mémoire** — Extraction automatique de faits depuis les conversations
- **⚡ Slash Commands** — `/code` `/seo` `/mail` `/pro` `/debug` et 6 autres
- **🧠 Smart Context** — Compression automatique des longues conversations
- **📄 TF-IDF RAG** — Recherche sémantique dans les documents uploadés

---

## 🆕 Nouveautés v20.0

- **PDF professionnel** avec jsPDF — header, couleurs IA, pagination
- **Paramètres Avancés** — température par IA, providers OpenAI-compatible, system prompt global
- **Diff de réponses** — diff mot-à-mot avec score de similarité
- **Prompt Builder** — constructeur visuel avec optimisation IA
- **Auto-mémoire** — extraction automatique de faits après 6 messages
- **Partage prompts** — bouton 🔗 sur chaque prompt de la bibliothèque
- **ComfyUI** ajouté dans les IAs Web (catégorie Image)

---

## 🚀 Démarrage rapide

### Utiliser directement
👉 **[multiia-hub.vercel.app](https://multiia-hub.vercel.app)**

### Déployer sa propre instance
```bash
git clone https://github.com/avalondrey/multiia-hub.git
cd multiia-hub && npm install && npm run dev
```

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/avalondrey/multiia-hub)

**Config Vercel :**
- Build : `node node_modules/vite/bin/vite.js build`
- Output : `dist`

---

## 🔑 Clés API — Toutes gratuites

| IA | Limite | Lien |
|---|---|---|
| **Groq** (Llama 3.3, Qwen3, Llama 4) | 14 400 req/jour | [console.groq.com](https://console.groq.com/keys) |
| **Mistral Small** | Tier gratuit | [console.mistral.ai](https://console.mistral.ai) |
| **Cohere Command R+** | 1 000 req/mois | [dashboard.cohere.com](https://dashboard.cohere.com) |
| **Cerebras** | Gratuit | [cloud.cerebras.ai](https://cloud.cerebras.ai) |
| **SambaNova** | Gratuit | [cloud.sambanova.ai](https://cloud.sambanova.ai) |
| **Pollinations GPT-4o** | Sans clé | Automatique |

> Les clés sont stockées **uniquement dans ton navigateur** (localStorage).

---

## 🌐 IAs Web référencées (41+)

| Catégorie | IAs |
|---|---|
| 💬 Chatbots | ChatGPT, Claude, Gemini, DeepSeek, Grok, Kimi, Qwen, Meta AI… |
| 🔍 Recherche | Perplexity, Phind, You.com, Andi |
| 🔀 Multi-modèles | HuggingFace, OpenRouter, Poe, LMArena, Groq Playground… |
| 🎨 Image & Vidéo | **ComfyUI**, Ideogram, Adobe Firefly, Kling, Leonardo, Playground AI… |
| 💻 Code | Bolt.new, Lovable, Cursor, v0, GitHub Copilot, Replit |
| 🎵 Audio | ElevenLabs, Suno, Udio |
| 💳 Premium | ChatGPT Plus, Claude Pro, Gemini Advanced, Midjourney, Runway… |

---

## 🏗 Structure

```
src/
├── App.jsx              ← Interface + composants (~7600L)
├── config/models.js     ← Modèles, IAs Web, constantes
├── api/ai-service.js    ← callModel, compressContext, truncate
└── main.jsx
api/
└── claude.js            ← Proxy Vercel optionnel
```

---

## 🔒 Sécurité
- ✅ Validation fichiers : whitelist extensions, 10MB max, MIME check
- ✅ Canvas sandbox : `allow-scripts` (sans `allow-same-origin`)
- ✅ Canvas listener : cleanup propre, pas d'accumulation
- ✅ Proxy Claude : rate-limit 20 req/min/IP

---

## 📋 Changelog
Voir [CHANGELOG.md](CHANGELOG.md)

## 📄 Licence
MIT
