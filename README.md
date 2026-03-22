# 🤖 Multi-IA Hub — v21.2

> Interface web parallèle pour comparer, combiner et automatiser plusieurs IAs simultanément — gratuit, open source, déployable en 1 clic.

[![Version](https://img.shields.io/badge/version-21.2-blue)](CHANGELOG.md)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![Live](https://img.shields.io/badge/live-multiia--hub.vercel.app-brightgreen)](https://multiia-hub.vercel.app)

---

## ✨ Fonctionnalités

| Onglet | Description |
|---|---|
| **◈ Chat** | Chat parallèle avec jusqu'à 12 IAs simultanément |
| **🧠 Experts** | Panel d'experts multi-agent (Sécurité/Perf/UX/SEO…) |
| **⚡ Débat** | Débat 3 phases + Pipeline Concrétisation |
| **⏱ Débat Live** | Format Oxford gamifié : 6 tours, timer, votes, score |
| **🔀 Workflows** | Automatisation en chaîne, templates prédéfinis |
| **🔀 Task→IAs** | Décompose une tâche complexe et route vers la meilleure IA |
| **🎙 Conférence** | 3 IAs en chaîne : Explorateur → Critique → Constructeur |
| **🔎 Consensus** | Vote croisé de fiabilité sur une affirmation |
| **⚡ Contradiction** | Détecteur de contradictions et biais logiques |
| **📰 Journaliste** | Rapport multi-angles généré en équipe d'IAs |
| **☀️ Morning Brief** | Briefing IA personnalisé chaque matin |
| **🎓 IA Mentor** | Programme d'apprentissage adaptatif |
| **🛠 Skill Builder** | Automatisations IA personnalisées par description naturelle |
| **🌍 Civilisations** | La même question vue par 12 civilisations différentes |
| **🔄 Contexte** | Texte traduit en 5 niveaux de compréhension en parallèle |
| **⚡ Mode Flash** | Course de vitesse entre toutes tes IAs |
| **🔬 Prompt Autopsy** | Analyse pourquoi une réponse IA était mauvaise |
| **🧬 Prompt DNA** | Bibliothèque arborescente de prompts avec variantes |
| **💡 API Optimizer** | Recommandations d'optimisation basées sur l'usage réel |
| **🧠 Second Brain** | Export Obsidian/Notion de toutes tes données |
| **🎬 Studio Auto** | Génération automatique de tutoriels vidéo |
| **🧭 Smart Router** | Analyse un fichier et route vers l'onglet optimal |
| **📰 Veille** | Agrégateur de news IA personnalisé |
| **🎙 Voice** | Conversation vocale mains-libres |
| **📁 Projets** | Projets avec contexte IA persistant |
| **⚡ Benchmark** | Test parallèle de toutes tes IAs sur le même prompt |
| **📖 Glossaire** | 50+ termes IA expliqués simplement |
| **📈 Analytics** | Coûts et utilisation par modèle |
| **🌐 IAs Web** | 41+ IAs web classées par tendances |
| **❓ Aide** | Centre de tutoriels interactifs |

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

## 🆕 Nouveautés v21.x

### v21.2 — Bugfixes pages blanches
- **ConferenceTab** — import `MODEL_DEFS` et `callModel` manquants (page blanche corrigée)
- **TraducteurTab** — réécriture avec styles inline, suppression dépendance CSS externe
- **AgentTab** — `overflow:hidden` → `overflow:auto` sur le wrapper et `.agent-wrap` CSS
- **MorningBriefTab** — `overflow:hidden` → `overflow:auto` + ajout `projects` useState manquant
- **SecondBrainTab** — `overflow:hidden` → `overflow:auto` sur le wrapper

### v21.1 — Refactoring architecture
- **33 onglets extraits** de App.jsx vers `src/tabs/` — App.jsx réduit de ~14 160 à ~7 860 lignes
- Composant partagé `src/components/MarkdownRenderer.jsx`
- Structure modulaire : chaque onglet est un fichier indépendant

### v21.0 — Nouveaux onglets (10+)
- **🔀 Task→IAs** — décomposition + routage intelligent multi-modèle
- **🎙 Conférence** — pipeline Explorateur→Critique→Constructeur
- **⏱ Débat Live** — format Oxford gamifié avec timer et score
- **🔎 Consensus** — vote croisé de fiabilité
- **⚡ Contradiction** — détecteur de contradictions et biais
- **📰 Journaliste** — rapport multi-angles en équipe
- **☀️ Morning Brief** — briefing IA personnalisé automatique
- **🎓 IA Mentor** — apprentissage adaptatif en sessions
- **🛠 Skill Builder** — création d'automatisations par langage naturel
- **🌍 Civilisations** — 12 perspectives historiques sur une question
- **🔄 Contexte** — traduction en 5 niveaux simultanés
- **⚡ Mode Flash** — course de vitesse entre IAs
- **🔬 Prompt Autopsy** — analyse de mauvaises réponses
- **🧬 Prompt DNA** — bibliothèque arborescente
- **💡 API Optimizer** — recommandations basées sur l'usage
- **🧠 Second Brain** — export Obsidian/Notion
- **🎬 Studio Auto** — génération de tutoriels vidéo

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
| **OpenRouter** | Crédits gratuits | [openrouter.ai/keys](https://openrouter.ai/keys) |
| **Pollinations GPT-4o** | Sans clé | Automatique |

> Les clés sont stockées **uniquement dans ton navigateur** (localStorage).

---

## 🏗 Structure

```
src/
├── App.jsx                  ← Interface + logique principale (~7 860L)
├── config/models.js         ← Modèles, IAs Web, constantes
├── api/ai-service.js        ← callModel, compressContext, truncate
├── components/
│   └── MarkdownRenderer.jsx ← Rendu Markdown partagé
├── tabs/                    ← 33 onglets extraits (1 fichier chacun)
│   ├── AgentTab.jsx
│   ├── BenchmarkTab.jsx
│   ├── CivilisationsTab.jsx
│   └── ... (30 autres)
└── main.jsx
api/
└── claude.js                ← Proxy Vercel optionnel
```

---

## 🔒 Sécurité
- ✅ Aucune clé stockée côté serveur — tout reste dans localStorage
- ✅ Proxy Claude : rate-limit 20 req/min/IP
- ✅ Canvas sandbox : `allow-scripts` (sans `allow-same-origin`)
- ✅ Validation fichiers : whitelist extensions, 10MB max, MIME check

---

## 📋 Changelog
Voir [CHANGELOG.md](CHANGELOG.md)

## 📄 Licence
MIT
