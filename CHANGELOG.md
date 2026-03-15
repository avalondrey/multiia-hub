# 📋 Changelog — Multi-IA Hub

> Fichier de référence officiel. La version affichée dans l'app se synchronise avec `APP_VERSION` dans `src/config/models.js`.

---

## [v18.0] — 2026-03-15
### 🌐 IAs Web — Refonte complète des cartes
- Cartes enrichies : description 2-3 phrases sur les vraies spécialisations
- Tags cliquables → filtre automatique par compétence
- Barre de tendance 5 points + label (🔥 TENDANCE / ⭐ POPULAIRE / ✓ Actif)
- Tri par défaut : Tendances (score 1-10 par IA)
- Barre dorée sur les cartes trend ≥ 9
- Tarifs précis : "Gratuit limité", "X crédits/jour", "depuis $X/mois"
- Bouton 🔭 Découvrir : prompt amélioré + sanitisation des données reçues

### 🏗 Refactoring Phase 1
- `src/config/models.js` (322L) — données statiques extraites
- `src/api/ai-service.js` (249L) — appels API extraits
- `src/App.jsx` réduit de 841 lignes

---

## [v17.3] — 2026-03-15
### 🎬 YouTube Player
- Restauration du player modal intégré (avec clé YouTube Data API v3)
- Sans clé : ouvre YouTube search dans un nouvel onglet directement

---

## [v17.2] — 2026-03-15
### 🔧 Déploiement
- Fix `vercel.json` (BOM supprimé, `framework:null` retiré)
- `express` déplacé dans `devDependencies`
- "Require Verified Commits" désactivé → déploiements automatiques fonctionnels
- `node_modules/` et `dist/` retirés du tracking Git

---

## [v17.1] — 2026-03-15
### ⚡ Performance & Stabilité
- **Cerebras + L3.1-8B (Groq)** : limite réelle 8192 tokens → `inputLimit:6000`, troncature auto
- **Pollinations** : queue ticket-based, délai 18s, `serial:true` → exécution séquentielle dans le débat
- Délai 800ms entre IAs dans le débat (évite le flood des APIs gratuites)
- Badge `⚡6k` / `⚡28k` dans le tableau Config pour les limites d'input réelles

---

## [v17.0] — 2026-03-14
### 🚀 Pipeline de Concrétisation (après débat)
- **🎯 Plan d'Action** : Décomposition → Risques → Planning → Validation croisée → Plan final
- **💻 Code + Vérification** : Specs → Code → Tests unitaires → Code Review → Code final
- **📄 Document Formel** : Structure → Rédaction → Résumé exécutif → Relecture → Document final
- Chaque étape confiée à une IA différente
- Export MD, → Chat, → Workflow

### 📎 Débat + Fichier
- Drag & drop de fichiers sur l'onglet Débat
- **Mode Analyse** : chaque IA analyse selon un angle différent
- **Mode Débat** : confrontation avec fichier comme contexte
- Formats : PDF, TXT, MD, CSV, JSON, code source, images

---

## [v16.9] — 2026-03-13
### ✨ Polices & Animations
- Inter (UI), Geist (titres), IBM Plex Mono (code)
- Transitions onglets : slide gauche/droite + fadeInUp
- AbortController par colonne (bouton ⏹)
- Scroll-to-bottom automatique

---

## [v16.8] — 2026-03-12
### 🧠 UX & Features
- CoT Raisonnement (`<think>`) : panneau pliable Qwen3/DeepSeek
- Mode Zen (⊞ dans la nav)
- Mémoire locale (faits injectés dans system prompt)
- Dossiers historique + favoris ⭐
- Canvas HTML (iframe preview sur blocs code)
- Compteur tokens/coût session en temps réel
- Animations streaming (arc-en-ciel, pulse, fadeInUp)

---

## [v16.0] — 2026-03-10
### 📝 Markdown & Syntaxe
- Markdown complet dans toutes les réponses
- Syntax highlighting (Prism.js + tokenizer maison)
- 2 nouveaux modèles Groq : Llama 4 Scout 17B, Gemma 2 9B
- Variables de prompt `{{date}}`, `{{heure}}`

---

## [v15.0] — 2026-03-08
### 🔌 Plugins & Vidéos
- Catalogue 12 plugins JS (Chart.js, Marked, Highlight, etc.)
- Vidéos vues : marquage auto, masquage, reset
- 2 Personas : Mode Débutant, Tuteur IA

---

## [v14.0] — 2026-03-05
### 🏆 Jury & Outils
- Jury IA automatique (podium, barres de score)
- Raccourcis clavier (Ctrl+Enter, Ctrl+1-9, Ctrl+K, Ctrl+L)
- Export Markdown + PDF
- RAG (coller document, découpage auto)
- Ollama local (auto-détection)
- Workflows Multi-Steps refonte complète
- 5 nouveaux Personas (Avocat du diable, Socrate, etc.)

---

## [v13.0] — 2026-03-01
### 🌐 IAs Web
- 37 IAs en 8 catégories
- Bouton 🔭 Découvrir nouvelles IAs via API

---

## [v12.0] — 2026-02-25
### 🧭 Navigation & Thème
- Nouvelle barre de navigation (10 onglets)
- Thème clair/sombre
- Lecture vocale TTS
- Dictée vocale
- 6 Personas de base

---

## [v10.0] — 2026-02-20
### 💾 Historique
- Sauvegarde automatique (50 conversations localStorage)
- Panneau historique rétractable
- Titre + date + icônes IAs

---

## [v9.0] — 2026-02-15
### ▶ YouTube
- 18 chaînes recommandées (FR + EN)
- 6 thèmes de vidéos dynamiques
- Raccourcis recherche YouTube

---

## [v7.0] — 2026-02-10
### ⚔ Arène & Images
- Tableau comparatif 18 modèles
- Actualités IA dynamiques
- Onglet Images : 13 générateurs avec jauges

---

## [v6.0] — 2026-02-05
### 📱 Mobile & Stabilité
- Responsive complet, mode onglets mobile
- 12 IAs Web
- Blocage rate-limit + countdown automatique

---

## [v5.0] — 2026-02-01
### 🆕 Nouvelles IAs
- DeepSeek V3, Mistral Small, Groq/Llama 3.3
- Correcteur orthographique (Claude)

---

## [v4.0] — 2026-01-28
### ⚙ Config & Débat
- Onglet Config complet (tableau modèles, export/import clés)
- Mode Débat 3 phases (Tour 1 → Tour 2 → Synthèse)

---

## [v1.0] — 2026-01-20
### 🚀 Lancement
- Chat parallèle multi-IA
- Compteur tokens
- Onglet IAs Web (Z.ai, Kimi, Qwen, Grok)
