# 📋 Changelog — Multi-IA Hub

> Mis à jour à chaque session. Version courante : `APP_VERSION` dans `src/config/models.js`.

---

## [v21.1] — 2026-03-20

### 🏗️ Refactoring (extraction des onglets)
- **Structure** — App.jsx réduit de ~14 160 à ~12 439 lignes
- **Nouveaux fichiers** dans `src/tabs/` (11 tabs) :
  - `NotesTab.jsx` — onglet Notes (~68 lignes)
  - `PromptsTab.jsx` — onglet Prompts (~253 lignes)
  - `RedactionTab.jsx` — onglet Rédaction (~87 lignes)
  - `RechercheTab.jsx` — onglet Recherche (~89 lignes)
  - `BenchmarkTab.jsx` — onglet Benchmark (~131 lignes)
  - `AgentTab.jsx` — onglet Agent IA (~153 lignes)
  - `TraducteurTab.jsx` — onglet Traducteur (~73 lignes)
- **Composant partagé** `src/components/MarkdownRenderer.jsx` — placeholder pour les tabs
- **Note** — ~21 onglets restent à extraire (ChatTab, ArenaTab, DebateTab, etc.)

---

## [v20.0] — 2026-03-16

### 🔧 Corrections (bugs critiques)
- **Canvas listener leak** — `window.addEventListener('message')` s'accumulait à chaque re-render. Corrigé avec `el.__msgHandler` pour cleanup propre
- **VALID_TABS incomplet** — les nouveaux onglets `expert`, `veille`, `analytics`, `voice`, `projects`, `advanced` n'étaient pas dans la liste de validation des params URL `?tab=`. Corrigé
- **Recherche historique** — déjà full-text sur titre + contenu des messages (confirmé)

### 📄 PDF professionnel (jsPDF)
- Export PDF mis en page avec header doré, couleurs par IA, pagination numérotée
- Chaque message : bloc coloré avec bordure gauche, label IA, contenu formaté
- Fallback automatique vers `window.print()` si jsPDF non disponible (activer via plugins)
- Téléchargement direct `conversation-multiia-[timestamp].pdf`

### 🔬 Paramètres Avancés (nouvel onglet)
- **System prompt global** — injecté dans toutes les requêtes en plus du persona
- **Température par IA** — slider 0→1 pour chaque modèle actif (défaut 0.7)
- **Providers custom OpenAI-compatible** — ajouter LM Studio, Jan, n'importe quel endpoint `/v1` avec nom, URL, modèle
- Sauvegarde localStorage

### ⚡ Diff de réponses
- Bouton `⚡ Diff` dans la barre de chat
- Modal avec diff mot-à-mot : vert = mots ajoutés, rouge = mots supprimés
- Score de similarité en %, barre de progression
- Sélecteurs d'IAs dans le modal
- Raccourci dans l'onglet Compare

### 🧱 Prompt Builder visuel
- Bouton `🧱 Builder` dans la barre de chat
- 5 blocs : Rôle / Contexte / Tâche / Format / Contraintes
- Exemples cliquables pour chaque bloc
- Aperçu du prompt assemblé en temps réel
- Bouton `✦ Optimiser avec l'IA` — envoie à Groq pour amélioration avant injection

### 🧠 Auto-mémoire
- Après chaque 6 messages, Groq extrait automatiquement 2 faits importants
- Bandeau de suggestion bas-centre : "🧠 Mémoriser ces informations ?"
- Bouton "✓ Mémoriser" par fait, "Ignorer tout"
- Les faits acceptés rejoignent la mémoire persistante

### 🔗 Partage de prompts par URL
- Bouton `🔗` sur chaque carte de la bibliothèque de prompts
- Encode le prompt en base64 dans `?prompt=...`
- Import automatique à l'ouverture de l'URL → injecté dans le chat

---

## [v19.0] — 2026-03-16

### 🔧 Self-Healing Canvas
- `window.onerror` dans l'iframe capte les erreurs JS
- Bandeau rouge avec message d'erreur + bouton **🔧 Auto-corriger**
- L'IA corrige le code automatiquement, l'iframe se recharge
- Compteur d'auto-corrections dans le header

### 🧠 Panel d'Experts
- Onglet `🧠 Experts` — 3 panels : Dev / Produit / Contenu
- Analyse parallèle par 3 experts spécialisés
- Synthèse : Consensus / Tensions / Recommandation finale

### 📈 Analytics
- Onglet `📈 Analytics` avec cartes résumé et barres par modèle
- Coût FREE ou $X par IA, widget session temps réel

### 📰 Veille Intelligente
- Onglet `📰 Veille` — sujets personnalisables, 10 articles IA générés
- Résumé exécutif en 5 points, bouton → Chat

### 🎙 Mode Vocal
- Onglet `🎙 Voice` — gros bouton micro, sélecteur d'IA
- Reconnaissance → réponse IA → TTS auto, historique session

### 📁 Gestion de Projets
- Onglet `📁 Projets` — nom, description, contexte IA, notes
- Contexte injecté automatiquement dans le Chat

---

## [v18.2] — 2026-03-15
- ✦ Consensus Multi-IAs (Mixture of Agents)
- ⚡ Slash Commands (`/code` `/seo` `/mail` `/pro` `/debug`…)
- 🧠 Smart Context (compression auto via Groq)
- 📄 RAG TF-IDF (3 chunks, score sémantique)
- 🔀 4 Templates Workflows prédéfinis
- ▶ YouTube Play dans les réponses IA

## [v18.1] — 2026-03-15
- Popups flottants, météo auto, news avec images

## [v18.0] — 2026-03-15
- Dashboard, Prompt Battle, Analyse doc Multi-IAs
- Traduction EN, Partage URL, Refactoring Phase 1

## [v17.x] — 2026-03-14/15
- Pipeline Concrétisation, Débat + Fichier
- Fix Pollinations queue, limites Cerebras

## [v16.x] — 2026-03-10/13
- Markdown + Prism.js, Mode Zen, Mémoire locale
- Canvas HTML, CoT Raisonnement, Workflows refonte

## [v14.0–v15.0] — 2026-03-05/08
- Jury IA, RAG, Ollama local, 12 Plugins JS

## [v13.0] — 2026-03-01
- 37 IAs Web, découverte automatique

## [v12.0] — 2026-02-25
- Navigation 10 onglets, TTS+Dictée, Personas, Thème sombre/clair

## [v1.0–v10.0] — 2026-01-20 → 02-20
- Lancement, Débat 3 phases, Config, Arène, YouTube, Mobile
