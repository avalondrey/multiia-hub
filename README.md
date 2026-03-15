# 🤖 Multi-IA Hub — v18.0

> Interface web parallèle pour comparer et utiliser plusieurs IAs simultanément — gratuit, open source, déployable en 1 clic.

[![Version](https://img.shields.io/badge/version-18.0-blue)](CHANGELOG.md)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![Deploy](https://img.shields.io/badge/deploy-Vercel-black)](https://vercel.com/new)
[![Live](https://img.shields.io/badge/live-multiia--hub.vercel.app-brightgreen)](https://multiia-hub.vercel.app)

---

## ✨ Fonctionnalités principales

| Feature | Description |
|---|---|
| **12 IAs en parallèle** | Groq, Mistral, Cohere, Cerebras, SambaNova, Qwen3, Llama 4, + 4 via Pollinations |
| **⚡ Mode Débat** | Tour 1 → Tour 2 → Synthèse, avec fichier joint (PDF/code/image) |
| **🚀 Pipeline Concrétisation** | Plan d'action / Code+Tests / Document formel en 5 étapes vérifiées |
| **🏆 Jury IA** | Une IA note les autres après chaque échange (podium + barres de score) |
| **🌐 37 IAs Web** | Cartes enrichies avec tags, tendances, tarifs précis |
| **📋 Workflows Multi-Steps** | Pipeline de prompts séquentiels avec variables |
| **🧠 CoT visible** | Raisonnement `<think>` de Qwen3/DeepSeek affiché en panel pliable |
| **💾 Mémoire locale** | Faits persistants injectés dans le system prompt |
| **📎 Upload fichiers** | PDF, TXT, code, images dans le chat et le débat |
| **📲 PWA** | Installable sur mobile/desktop, fonctionne hors-ligne |

---

## 🚀 Déploiement rapide (Vercel — gratuit)

### Option 1 — Fork + Deploy

```bash
git clone https://github.com/avalondrey/multiia-hub.git
cd multiia-hub
npm install
npm run build   # test local
```

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/avalondrey/multiia-hub)

**Configuration Vercel :**
- Build Command : `node node_modules/vite/bin/vite.js build`
- Output Directory : `dist`
- Root Directory : *(laisser vide)*

### Option 2 — Utiliser directement

👉 **[multiia-hub.vercel.app](https://multiia-hub.vercel.app)** — aucune installation requise

---

## 🔑 Clés API — Toutes gratuites

| IA | Limite gratuite | Lien |
|---|---|---|
| **Groq** (Llama 3.3, Qwen3, Llama 4) | 14 400 req/jour | [console.groq.com](https://console.groq.com/keys) |
| **Mistral Small** | Tier gratuit | [console.mistral.ai](https://console.mistral.ai) |
| **Cohere Command R+** | 1 000 req/mois | [dashboard.cohere.com](https://dashboard.cohere.com/api-keys) |
| **Cerebras** | Gratuit | [cloud.cerebras.ai](https://cloud.cerebras.ai) |
| **SambaNova** | Gratuit | [cloud.sambanova.ai](https://cloud.sambanova.ai) |
| **GPT-4o via Pollinations** | Sans clé | Automatique |
| **Pollen** (Claude/DeepSeek via Pollinations) | Gratuit Seed tier | [enter.pollinations.ai](https://enter.pollinations.ai) |

> ⚠️ Les clés sont stockées **uniquement dans ton navigateur** (localStorage). Aucune donnée n'est envoyée à un serveur tiers.

---

## 🏗 Structure du projet

```
multiia-hub/
├── src/
│   ├── App.jsx              ← Interface + composants + logique (~6500L)
│   ├── config/
│   │   └── models.js        ← Modèles IA, constantes, données UI
│   ├── api/
│   │   └── ai-service.js    ← Appels API (callModel, truncate, etc.)
│   └── main.jsx             ← Point d'entrée React
├── api/
│   └── claude.js            ← Proxy Vercel sécurisé (optionnel)
├── index.html
├── vite.config.js
├── vercel.json
├── package.json
├── CHANGELOG.md             ← Historique complet des versions
└── .gitignore
```

---

## 🔧 Workflow de développement

```powershell
# Après modification de App.jsx
copy C:\Users\...\Downloads\multi-ai-hub.jsx src\App.jsx
git add src\
git commit -m "vX.X description"
git push
# Vercel déploie automatiquement
```

---

## 🔒 Sécurité

- ✅ Aucune clé API stockée côté serveur
- ✅ Proxy Vercel optionnel pour Claude (`api/claude.js`) lit depuis `process.env`
- ✅ Rate limiting sur le proxy (20 req/min/IP)
- ✅ `node_modules/` et `dist/` exclus du repo
- ⚠️ Les clés dans `localStorage` sont lisibles via DevTools — ne pas utiliser sur PC partagé

---

## 📋 Changelog

Voir [CHANGELOG.md](CHANGELOG.md) pour l'historique complet des versions.

---

## 📄 Licence

MIT — libre d'utilisation, modification et distribution.
