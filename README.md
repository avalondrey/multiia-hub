# 🤖 Multi-IA Hub — v19.0

> Interface web parallèle pour comparer, combiner et automatiser plusieurs IAs simultanément — gratuit, open source, déployable en 1 clic.

[![Version](https://img.shields.io/badge/version-19.0-blue)](CHANGELOG.md)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![Live](https://img.shields.io/badge/live-multiia--hub.vercel.app-brightgreen)](https://multiia-hub.vercel.app)

---

## ✨ Fonctionnalités

| Onglet | Description |
|---|---|
| **◈ Chat** | Chat parallèle avec jusqu'à 12 IAs simultanément |
| **🧠 Experts** | Panel d'experts multi-agent (Sécurité/Perf/UX/SEO…) |
| **⚡ Débat** | Débat 3 phases + Pipeline Concrétisation |
| **🔀 Workflows** | Automatisation en chaîne avec templates prédéfinis |
| **🎨 Canvas** | Exécution HTML live + Auto-correction d'erreurs JS |
| **📰 Veille** | Agrégateur de news IA personnalisé |
| **🎙 Voice** | Conversation vocale mains-libres avec TTS |
| **📁 Projets** | Gestion de projets avec contexte IA persistant |
| **📈 Analytics** | Statistiques d'usage et coûts par modèle |
| **🌐 IAs Web** | 40+ IAs web classées par tendances |
| **⚔ Arène** | Comparatif de 18 modèles |

### Features transversales
- **✦ Consensus** — Mixture of Agents, synthèse + détection d'erreurs
- **⚡ Slash Commands** — `/code` `/seo` `/mail` `/pro` `/debug` et 6 autres
- **🧠 Smart Context** — Compression automatique des longues conversations
- **📄 TF-IDF RAG** — Recherche sémantique dans les documents uploadés
- **🔗 Partage URL** — Conversations partageables par lien

---

## 🚀 Démarrage rapide

### Utiliser directement (recommandé)
👉 **[multiia-hub.vercel.app](https://multiia-hub.vercel.app)**

### Déployer sa propre instance
```bash
git clone https://github.com/avalondrey/multiia-hub.git
cd multiia-hub && npm install && npm run dev
```
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/avalondrey/multiia-hub)

**Config Vercel :**
- Build Command : `node node_modules/vite/bin/vite.js build`
- Output Directory : `dist`

---

## 🔑 Clés API — Toutes gratuites

| IA | Limite gratuite | Lien |
|---|---|---|
| **Groq** (Llama 3.3, Qwen3, Llama 4) | 14 400 req/jour | [console.groq.com](https://console.groq.com/keys) |
| **Mistral Small** | Tier gratuit | [console.mistral.ai](https://console.mistral.ai) |
| **Cohere Command R+** | 1 000 req/mois | [dashboard.cohere.com](https://dashboard.cohere.com) |
| **Cerebras** | Gratuit | [cloud.cerebras.ai](https://cloud.cerebras.ai) |
| **SambaNova** | Gratuit | [cloud.sambanova.ai](https://cloud.sambanova.ai) |
| **GPT-4o via Pollinations** | Sans clé | Automatique |

> Les clés sont stockées **uniquement dans ton navigateur** (localStorage). Rien n'est envoyé à un serveur tiers.

---

## 🏗 Structure

```
src/
├── App.jsx              ← Interface + composants React (~7200L)
├── config/models.js     ← Modèles, constantes, données UI
├── api/ai-service.js    ← callModel, compressContext, truncate…
└── main.jsx
api/
└── claude.js            ← Proxy Vercel optionnel (clé Anthropic côté serveur)
```

---

## 🔒 Sécurité
- ✅ Validation fichiers : whitelist extensions, limite 10MB, vérification MIME
- ✅ Canvas sandbox : `allow-scripts` uniquement (pas de `allow-same-origin`)
- ✅ Proxy Claude : rate-limit 20 req/min/IP, taille max 100KB
- ✅ Aucune clé stockée côté serveur (sauf si `ANTHROPIC_API_KEY` configurée dans Vercel)

---

## 📋 Changelog

Voir [CHANGELOG.md](CHANGELOG.md) pour l'historique complet.

---

## 📄 Licence
MIT — libre d'utilisation, modification et distribution.
