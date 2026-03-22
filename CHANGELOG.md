# 📋 Changelog — Multi-IA Hub

> Mis à jour à chaque session. Version courante : `APP_VERSION` dans `src/config/models.js`.

---

## [v21.2] — 2026-03-22

### 🐛 Bugfixes — Pages blanches (multiples onglets)

**Cause racine identifiée** : les onglets extraits en `src/tabs/` dépendaient soit de props non transmises, soit de classes CSS définies dans `App.jsx`, soit de wrappers `overflow:hidden` qui écrasaient leur hauteur à 0 dans le conteneur scroll principal (`.cols`).

- **ConferenceTab** — `MODEL_DEFS` et `callModel` déclarés en props mais jamais transmis depuis App.jsx → `TypeError` silencieux → page blanche. Corrigé par import direct depuis les modules.
- **TraducteurTab** — dépendait de 6 classes CSS (`trad-wrap`, `trad-left`, `trad-right`, etc.) définies dans le bloc `<style>` de App.jsx. Ces classes ne sont pas disponibles quand le composant est isolé. Réécriture complète avec styles inline.
- **AgentTab** — wrapper `overflow:hidden` dans App.jsx + `.agent-wrap{overflow:hidden}` dans le CSS global → composant visible dans le DOM mais hauteur 0. Corrigé : `overflow:auto`.
- **MorningBriefTab** — double problème : wrapper `overflow:hidden` + variable `projects` jamais déclarée dans App.jsx (passée comme prop `projects={projects}` sans `useState`). Ajout du `useState` et correction du wrapper.
- **SecondBrainTab** — même wrapper `overflow:hidden`. Corrigé : `overflow:auto`.

---

## [v21.1] — 2026-03-21

### 🏗️ Refactoring (extraction des onglets)
- **Structure** — App.jsx réduit de ~14 160 à ~7 860 lignes (-44%)
- **33 composants extraits** dans `src/tabs/` :
  - `AgentTab`, `AideTab`, `ApiOptimizerTab`, `BenchmarkTab`
  - `CivilisationsTab`, `ConferenceTab`, `ConsensusTab`, `ContextTranslatorTab`
  - `ContradictionTab`, `GlossaireTab`, `IaMentorTab`, `JournalisteTab`
  - `LiveDebateTimerTab`, `ModeFlashTab`, `MorningBriefTab`, `NotesTab`
  - `ProjectsTab`, `PromptAutopsyTab`, `PromptDNATab`, `PromptsTab`
  - `RechercheTab`, `RedactionTab`, `SecondBrainTab`, `SkillBuilderTab`
  - `StatsTab`, `StudioTab`, `TaskToIAsTab`, `TraducteurTab`
  - `VeilleTab`, `VoiceTab`, `WebIAsTab`, `YouTubeTab`
- **Composant partagé** `src/components/MarkdownRenderer.jsx`
- **Exports centralisés** dans `src/tabs/index.js`

---

## [v21.0] — 2026-03-20

### ✨ Nouveaux onglets (17)

- **🔀 Task→IAs** — Décompose une tâche complexe, route chaque sous-tâche vers l'IA la plus adaptée (vitesse, rédaction, code, analyse), assemble un livrable final
- **🎙 Conférence** — Pipeline séquentiel Explorateur → Critique → Constructeur, chaque IA construit sur la précédente
- **⏱ Débat Live** — Format Oxford gamifié : 6 tours (Ouverture/Réplique/Conclusion), timer 90s, votes public, score arbitre IA
- **🔎 Consensus** — Vote croisé de fiabilité : toutes les IAs notent une affirmation indépendamment (vrai/faux/partiel/incertain), score de consensus calculé
- **⚡ Contradiction** — Détecteur de contradictions, biais cognitifs et arguments fallacieux entre deux textes ou dans un seul
- **📰 Journaliste** — Rapport multi-angles (3, 5 ou 7 angles) : chaque IA couvre un angle différent en parallèle, une IA rédactrice en chef assemble
- **☀️ Morning Brief** — Briefing IA personnalisé : actualités, tâches du jour, conseil, citation, IA du jour. Génération automatique à heure programmée
- **🎓 IA Mentor** — Programme d'apprentissage adaptatif : sessions, leçons, exercices, quiz avec évaluation et système XP
- **🛠 Skill Builder** — Création d'automatisations IA par description naturelle : l'IA génère le prompt, les paramètres et la configuration
- **🌍 Civilisations** — 12 civilisations/époques (Grèce antique, Islam, Silicon Valley 2026…) répondent à la même question contemporaine, avec synthèse comparatiste
- **🔄 Contexte** — Traducteur de complexité : un texte technique traduit simultanément pour enfant 10 ans / lycéen / adulte / expert / tweet
- **⚡ Mode Flash** — Course de vitesse en temps réel : toutes les IAs reçoivent le même prompt, classement par vitesse avec podium
- **🔬 Prompt Autopsy** — Analyse d'une mauvaise réponse IA : biais détectés, erreurs de raisonnement, problèmes de prompt, 2 versions améliorées générées
- **🧬 Prompt DNA** — Bibliothèque arborescente de prompts : variantes hiérarchisées, étoiles, statistiques d'utilisation
- **💡 API Optimizer** — Analyse l'historique d'usage et recommande les changements de configuration pour réduire coûts et améliorer vitesse
- **🧠 Second Brain** — Export de toutes les données (conversations, projets, mémoire, stats) en Obsidian / Notion / Markdown / JSON, avec profil utilisateur généré par IA
- **🎬 Studio Auto** — Pipeline de génération de tutoriels vidéo : IA pose des questions → génère script + narration → filme avec OBS (optionnel) → monte avec Kdenlive (optionnel)

### 🔧 Corrections
- **PromptDNATab** — import manquant corrigé
- **Syntax errors** — 15+ occurrences de `condition?.55:1` (optional chaining invalide sur booléens) corrigées en `condition ? 0.55 : 1`
- **Fuite mémoire** — `appinstalled` listener sans cleanup corrigé

---

## [v20.0] — 2026-03-16

### 🔧 Corrections (bugs critiques)
- **Canvas listener leak** — `window.addEventListener('message')` s'accumulait à chaque re-render. Corrigé avec `el.__msgHandler` pour cleanup propre
- **VALID_TABS incomplet** — nouveaux onglets manquants dans la liste de validation URL

### 📄 PDF professionnel (jsPDF)
- Export PDF avec header doré, couleurs par IA, pagination numérotée

### 🔬 Paramètres Avancés
- System prompt global, température par IA, providers custom OpenAI-compatible

### ⚡ Diff de réponses
- Diff mot-à-mot, score de similarité, modal interactif

### 🧱 Prompt Builder visuel
- 5 blocs (Rôle/Contexte/Tâche/Format/Contraintes), optimisation IA

### 🧠 Auto-mémoire
- Extraction automatique de faits après 6 messages, confirmation utilisateur

### 🔗 Partage prompts par URL
- Encode en base64 dans `?prompt=...`, import automatique

---

## [v19.0] — 2026-03-16
- 🔧 Self-Healing Canvas (auto-correction d'erreurs JS)
- 🧠 Panel d'Experts (Dev / Produit / Contenu)
- 📈 Analytics (coûts et usage par modèle)
- 📰 Veille Intelligente
- 🎙 Mode Vocal
- 📁 Gestion de Projets

## [v18.2] — 2026-03-15
- ✦ Consensus Multi-IAs (Mixture of Agents)
- ⚡ Slash Commands
- 🧠 Smart Context (compression auto)
- 📄 RAG TF-IDF
- 🔀 4 Templates Workflows prédéfinis

## [v18.0–v18.1] — 2026-03-15
- Dashboard, Prompt Battle, Analyse doc Multi-IAs, Traduction EN

## [v17.x] — 2026-03-14/15
- Pipeline Concrétisation, Débat + Fichier, Fix Pollinations

## [v16.x] — 2026-03-10/13
- Markdown + Prism.js, Mode Zen, Mémoire locale, Canvas HTML, Workflows

## [v14.0–v15.0] — 2026-03-05/08
- Jury IA, RAG, Ollama local, 12 Plugins JS

## [v13.0] — 2026-03-01
- 37 IAs Web, découverte automatique

## [v12.0] — 2026-02-25
- Navigation 10 onglets, TTS+Dictée, Personas, Thème sombre/clair

## [v1.0–v10.0] — 2026-01-20 → 02-20
- Lancement, Débat 3 phases, Config, Arène, YouTube, Mobile
