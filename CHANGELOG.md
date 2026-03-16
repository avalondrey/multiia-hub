# 📋 Changelog — Multi-IA Hub

> Fichier mis à jour automatiquement à chaque session de développement.
> Version courante : voir `APP_VERSION` dans `src/config/models.js`.

---

## [v19.0] — 2026-03-16
### 🔧 Self-Healing Canvas
- Le Canvas capture les erreurs JS via `window.onerror` dans l'iframe
- Bandeau rouge s'affiche avec le message d'erreur exact
- Bouton **🔧 Auto-corriger** : envoie automatiquement l'erreur + le code à Groq/Llama
- L'IA corrige et l'iframe se recharge — sans copier-coller
- Compteur d'auto-corrections affiché dans le header du Canvas
- Bouton **✦ Modifier** : champ de texte pour demander une modification manuelle

### 🧠 Panel d'Experts (Multi-Agent)
- Nouvel onglet **🧠 Experts** dans la nav
- 3 panels prédéfinis : **Dev** (Sécurité / Perf / Architecture), **Produit** (UX / Business / Tech), **Contenu** (SEO / Copywriting / Audience)
- Chaque expert analyse le problème avec son system prompt dédié en parallèle
- Un 4ème modèle synthétise : Consensus / Tensions / Recommandation finale
- Bouton → Chat pour envoyer la synthèse

### 📈 Onglet Analytics
- Remplace l'onglet Stats basique avec une vue plus riche
- Cartes résumé : messages, tokens, conversations, coût estimé
- Barres d'utilisation par modèle avec coût affiché (FREE ou $X)
- Widget session en cours temps réel

### 📰 Veille Intelligente
- Nouvel onglet **📰 Veille**
- Sujets de veille personnalisables (stockés en localStorage)
- Génération de 10 articles récents via l'IA active
- Bouton **✦ Résumé exécutif** : synthèse en 5 points clés
- Chaque article a un bouton "💬 En savoir plus" → Chat

### 🎙 Mode Vocal dédié
- Nouvel onglet **🎙 Voice** — interface mains-libres
- Gros bouton micro central, sélecteur d'IA
- Reconnaissance vocale → réponse IA → lecture TTS automatique
- Historique de session, bouton Réécouter/Stop
- Bouton → Chat pour continuer en mode texte

### 📁 Gestion de Projets
- Nouvel onglet **📁 Projets**
- Création de projets avec nom, description, contexte IA, notes
- Le **contexte IA** est injecté automatiquement dans le Chat
- Sidebar de navigation entre projets
- Stockage localStorage, suppression avec confirmation

### ⚡ Optimisations React (v18.2)
- `useMemo` sur `enabledIds`, `availableIds`, `isLoadingAny`, `sortedArena`, `filteredImages`
- `useCallback` sur `buildSystem`
- Repartir d'une base propre depuis GitHub (corruption backtick résolue)

---

## [v18.2] — 2026-03-15
### ✦ Consensus Multi-IAs (Mixture of Agents)
- Bouton `✦ Consensus` dans la barre de chat
- Jusqu'à 4 IAs répondent en parallèle, une 5ème synthétise
- Réponse Consensus + Erreurs détectées + Points de divergence

### ⚡ Slash Commands
- `/code` `/seo` `/mail` `/resume` `/traduit` `/critique` `/simple` `/pro` `/debug` `/idea`
- Autocomplete au tap de `/`

### 🧠 Smart Context (ai-service.js)
- Compression automatique des longues conversations (> 14 messages) via Groq

### 📄 RAG TF-IDF
- Scoring basé sur TF-IDF, 3 chunks, bonus phrases exactes

### 🔀 Templates Workflows
- 4 templates prédéfinis : News→LinkedIn, Analyse→Rapport, Idée→Code→Tests, Contenu multilingue

### ▶ YouTube détection dans les réponses
- Bouton `▶ Play` sur les liens YouTube générés par les IAs

---

## [v18.1] — 2026-03-15
- Popups flottants bas-droite (notifications)
- Météo automatique via IP (open-meteo.com)
- News dashboard avec images Pollinations

---

## [v18.0] — 2026-03-15
- 🏠 Dashboard (météo, stats, news, accès rapide)
- ⚔ Prompt Battle (variantes de prompt + jury IA)
- 🔬 Analyse document Multi-IAs
- 🌍 Traduction auto EN
- 🔗 Partage par URL
- Refactoring Phase 1 (models.js + ai-service.js)

---

## [v17.x] — 2026-03-14/15
- Pipeline Concrétisation (Plan/Code/Doc)
- Débat + fichier (Analyse vs Débat)
- Fix Pollinations queue ticket-based (18s)
- Cerebras/L3.1-8B limite 6k tokens

---

## [v16.x] — 2026-03-10/13
- Markdown complet + Prism.js syntax highlighting
- Mode Zen, Mémoire locale, Canvas HTML
- CoT Raisonnement `<think>` pliable
- Compteur tokens/coût session
- Variables `{{date}}` `{{heure}}`
- Workflows multi-steps refonte

---

## [v15.0] — 2026-03-08
- 12 plugins JS, vidéos vues, Personas Débutant/Tuteur

---

## [v14.0] — 2026-03-05
- Jury IA automatique, raccourcis clavier, RAG, Ollama local

---

## [v13.0] — 2026-03-01
- 37 IAs Web en 8 catégories, découverte automatique

---

## [v12.0] — 2026-02-25
- Navigation 10 onglets, thème clair/sombre, TTS+dictée, Personas

---

## [v10.0] — 2026-02-20
- Historique auto 50 conversations, panneau latéral

---

## [v1-9] — 2026-01-20 → 2026-02-15
- Lancement, Débat 3 phases, Config clés, Arène, YouTube, Responsive mobile
