# 🤖 Multi-IA Hub

> Interface web parallèle pour comparer et utiliser plusieurs IAs simultanément — gratuit, open source, déployable en 1 clic.

![Version](https://img.shields.io/badge/version-16.1-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Deploy](https://img.shields.io/badge/deploy-Vercel-black)

## ✨ Fonctionnalités

- **10 IAs en parallèle** — Groq, Mistral, Cohere, Cerebras, SambaNova, Qwen3, + 4 via Pollinations (GPT-4o, Claude, DeepSeek, GPT-4o Large)
- **🏆 Jury IA automatique** — une IA note les autres après chaque échange (podium, barres de score, raison)
- **🔍 Vue diff** — surlignage des mots communs/uniques entre deux réponses
- **⚖ Historique des comparaisons** — win rate cumulé par IA sur tous tes échanges
- **📄 RAG** — coller un document long, injection du contexte pertinent
- **🎭 13 Personas** — Dev senior, Rédacteur, Coach, Avocat du diable, Socrate, Débutant, Tuteur IA…
- **🔀 Workflow** — chaîne de prompts séquentiels avec sortie → entrée
- **🖥 Ollama local** — connecte tes modèles locaux
- **⌨️ Raccourcis clavier** — Ctrl+Enter, Ctrl+1..9, Ctrl+K, Ctrl+L, Ctrl+M, Escape
- **📝 Export** — Markdown, PDF, .txt, JSON
- **📺 Médias** — chaînes YouTube IA (FR + EN), générateurs d'images
- **⚔ Arène** — tableau comparatif de 18 modèles
- **🌐 37 IAs Web** — liens directs vers les interfaces web
- **💾 Historique** — sauvegarde automatique jusqu'à 50 conversations (localStorage)
- **📲 PWA** — installable sur mobile/desktop, fonctionne hors-ligne

## 🚀 Déploiement rapide (Vercel)

### 1. Fork ce dépôt

```bash
git clone https://github.com/TON_PSEUDO/multiia-hub.git
cd multiia-hub
npm install
```

### 2. Déploie sur Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

- Build Command : `node node_modules/vite/bin/vite.js build`
- Output Directory : `dist`

### 3. Variables d'environnement (optionnel)

Uniquement si tu veux activer Claude via proxy Vercel :

| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | Clé API Anthropic (claude.ai) |

> ⚠️ Ne jamais mettre de clés dans le code source. Utilise toujours les variables d'environnement Vercel.

## 🔑 Clés API — Où les obtenir ?

Toutes les clés se saisissent dans l'onglet **⚙ Config** de l'app — elles sont stockées **uniquement dans ton navigateur** (localStorage), jamais envoyées à un serveur tiers.

| IA | Prix | Lien |
|---|---|---|
| Groq (Llama 3.3) | ✅ Gratuit (14 400 req/jour) | [console.groq.com](https://console.groq.com/keys) |
| Mistral Small | ✅ Gratuit | [console.mistral.ai](https://console.mistral.ai) |
| Cohere Command R+ | ✅ Gratuit | [dashboard.cohere.com](https://dashboard.cohere.com) |
| Cerebras | ✅ Gratuit | [cloud.cerebras.ai](https://cloud.cerebras.ai) |
| SambaNova | ✅ Gratuit | [cloud.sambanova.ai](https://cloud.sambanova.ai) |
| Pollen (Claude/DeepSeek) | ✅ Gratuit Seed tier | [enter.pollinations.ai](https://enter.pollinations.ai) |
| GPT-4o, GPT-4o Large | ✅ Sans clé | Via [Pollinations](https://pollinations.ai) |

## 🔒 Sécurité

- **Aucune clé stockée côté serveur** — tout reste dans ton `localStorage`
- **Pas de backend** sauf le proxy Vercel (optionnel) pour Claude
- **Pas de tracking, pas de télémétrie**
- **Proxy Vercel** : la clé Anthropic est lue depuis `process.env` (variable d'environnement Vercel), jamais exposée au client
- Les clés API exportées (`multiia-keys.json`) sont dans le `.gitignore` — ne les commite jamais

### ⚠️ Avertissements

- Les clés dans `localStorage` sont lisibles via DevTools du navigateur — n'utilise pas l'app sur un ordinateur partagé
- Si tu forks et déploies publiquement, les utilisateurs saisissent leurs propres clés — c'est leur responsabilité
- Ne commite **jamais** un fichier `.env` ou `multiia-keys.json`

## 🗂 Structure du projet

```
multiia-hub/
├── src/
│   └── App.jsx          # Application React complète (single-file)
├── public/
│   ├── manifest.json    # PWA manifest
│   └── sw.js            # Service Worker
├── api/
│   └── claude.js        # Proxy Vercel pour Claude (optionnel)
├── index.html
├── vite.config.js
├── package.json
└── .gitignore           # ← multiia-keys.json exclu
```

## 📋 Historique des versions

| Version | Nouveautés majeures |
|---|---|
| v16 | Jury visuel podium + Vue diff + Tableau récap + Onglet Comparer |
| v15 | Fix Pollinations · 4 IAs gratuites · Clé Pollen |
| v14 | Jury IA · Raccourcis clavier · RAG · Ollama · Workflow · Personas |
| v13 | 37 IAs Web en 8 catégories · Découverte automatique |
| v12 | Refonte nav · Thème clair/sombre · TTS · Dictée vocale · Personas |
| v11 | Chaînes YouTube personnalisées |
| v10 | Sidebar historique · Sauvegarde auto · Mode Solo |
| v9 | Onglet YouTube · Vidéos dynamiques |
| v8 | Actualités IA avec fallback automatique |
| v7 | Arène comparatif · Onglet Images |
| v6 | Responsive mobile · 12 IAs Web · Blocage rate-limit |
| v5 | Groq/Mistral/DeepSeek · Correcteur orthographique |
| v4 | Config complète · Export/Import clés · Mode Débat |
| v1 | Lancement Multi-IA Hub |

## 🤝 Contribution

Les PRs sont bienvenues ! Pour les bugs ou suggestions, ouvre une Issue.

## 📄 Licence

MIT — libre d'utilisation, modification et distribution.
