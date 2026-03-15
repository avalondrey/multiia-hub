# 📋 Changelog — Multi-IA Hub

> Fichier de référence officiel. La version affichée dans l'app se synchronise avec `APP_VERSION` dans `src/config/models.js`.

---

## [v18.2] — 2026-03-15
### ✦ Consensus Multi-IAs (Mixture of Agents)
- Bouton `✦ Consensus` dans la barre de chat
- Jusqu'à 4 IAs répondent en parallèle à la même question
- Une IA arbitre synthétise toutes les réponses : Réponse Consensus + Erreurs détectées + Points de divergence
- Réduit les hallucinations à quasi zéro
- Boutons → Chat et ⎘ Copier sur la synthèse

### 🎨 Canvas restauré + bouton Modifier
- Panneau iframe HTML latéral restauré (▶ Canvas sur les blocs code)
- Nouveau champ "Modifie avec l'IA" en bas du Canvas
- Décris la modification souhaitée → l'IA met à jour le code → iframe se recharge

### ⚡ Slash Commands
- Tape `/` dans le chat pour voir les suggestions autocomplétées
- 10 commandes : `/code` `/seo` `/mail` `/resume` `/traduit` `/critique` `/simple` `/pro` `/debug` `/idea`
- Change le system prompt automatiquement sans changer d'onglet

### 🧠 Smart Context (ai-service.js)
- Compression automatique des longues conversations (> 14 messages)
- Groq/Llama 3.3 résume les anciens messages en 3 points clés
- Les 4 derniers messages restent toujours intacts
- Fallback silencieux si pas de clé Groq

### 📄 RAG TF-IDF amélioré
- Scoring basé sur TF-IDF (fréquence × rareté des termes)
- Retourne les 3 meilleurs chunks au lieu de 2
- Bonus pour les correspondances de phrases exactes

### 🔀 Templates Workflows prédéfinis
- 4 templates en 1 clic : News→LinkedIn, Analyse→Rapport, Idée→Code→Tests, Contenu multilingue
- Affichés en bleu dans l'onglet Workflows, distincts des templates personnels

### ▶ YouTube détection dans les réponses
- Regex détecte les liens YouTube dans les réponses des IAs
- Bouton `▶ Play` à côté du lien → player intégré directement dans l'app

### 📊 Stats live session
- Widget "Session en cours" dans l'onglet Stats
- Tokens input/output par IA en temps réel
- Coût estimé à 5 décimales, badge FREE pour les IAs gratuites

---

## [v18.1] — 2026-03-15
### 🔔 Popups flottants (Dashboard)
- Système de notifications bas-droite, disparaissent après 8s
- Déclenchables depuis le Dashboard ou les actualités

### ☀️ Météo automatique
- Détection IP → météo locale via open-meteo.com (gratuit, sans clé)
- Se charge automatiquement en arrivant sur le Dashboard

### 📰 News avec images
- Chaque actualité affiche une image générée par Pollinations FLUX Turbo
- 8 actualités au lieu de 6, descriptions plus détaillées (3 phrases)
- Boutons "🔔 Notifier" et "💬 En savoir plus"

---

## [v18.0] — 2026-03-15
### 🏠 Dashboard
- Nouvel onglet en première position
- Météo locale, stats session, accès rapide, annonces, news IA, IAs actives

### ⚔ Prompt Battle
- Compare 2 à 4 variantes du même prompt
- La même IA exécute toutes les variantes, jury désigne la gagnante avec score /10
- Bouton "Envoyer le gagnant dans le Chat"

### 🔬 Analyse document Multi-IAs
- Upload d'un fichier → chaque IA analyse sous un angle différent en parallèle
- Angles : Résumé, Failles, Données chiffrées, Recommandations, Qualité, Q&A
- Question optionnelle pour guider l'analyse

### 🌍 Traduction auto EN
- Bouton toggle `🌍 EN` dans la barre de chat
- Traduit le prompt en anglais avant envoi (+30% qualité réponse)

### 🔗 Partage par URL
- Encode la conversation en base64 dans l'URL
- Aucun serveur — tout dans le lien

### 🌐 IAs Web — Refonte cartes
- Description 2-3 phrases sur les spécialisations réelles
- Tags cliquables, barre de tendance, tri par popularité
- Tarifs précis ("Gratuit limité", "X crédits/jour", "depuis $X/mois")

### 🏗 Refactoring Phase 1
- `src/config/models.js` (322L) — données statiques
- `src/api/ai-service.js` (249L) — appels API
- `src/App.jsx` réduit de 841 lignes

---

## [v17.3] — 2026-03-15
### 🎬 YouTube Player
- Restauration du player modal intégré (avec clé YouTube Data API v3)
- Sans clé : ouvre YouTube search dans un nouvel onglet

---

## [v17.2] — 2026-03-15
### 🔧 Déploiement stabilisé
- Fix `vercel.json` (BOM supprimé, `framework:null` retiré)
- `express` déplacé dans `devDependencies`
- "Require Verified Commits" désactivé → déploiements automatiques
- `node_modules/` et `dist/` retirés du tracking Git
- README et CHANGELOG ajoutés au repo

---

## [v17.1] — 2026-03-15
### ⚡ Performance & Stabilité API
- **Cerebras + L3.1-8B** : limite réelle 8192 tokens → `inputLimit:6000`, troncature auto
- **Pollinations** : queue ticket-based, délai 18s, `serial:true`
- Délai 800ms entre IAs dans le débat (évite le flood)
- Badge `⚡6k` / `⚡28k` dans Config pour les limites d'input

---

## [v17.0] — 2026-03-14
### 🚀 Pipeline de Concrétisation (après débat)
- **🎯 Plan d'Action** : Décomposition → Risques → Planning → Validation → Plan final
- **💻 Code + Vérification** : Specs → Code → Tests → Code Review → Livrable
- **📄 Document Formel** : Structure → Rédaction → Résumé → Relecture → Final
- Chaque étape confiée à une IA différente
- Export MD, → Chat, → Workflow

### 📎 Débat + Fichier
- Drag & drop sur l'onglet Débat
- **Mode Analyse** : chaque IA sous un angle différent
- **Mode Débat** : confrontation avec fichier comme contexte

---

## [v16.9] — 2026-03-13
### ✨ Polices & Animations
- Inter (UI), Geist (titres), IBM Plex Mono (code)
- Transitions onglets slide + fadeInUp
- AbortController par colonne (bouton ⏹)
- Scroll-to-bottom automatique

---

## [v16.8] — 2026-03-12
### 🧠 UX
- CoT Raisonnement (`<think>`) pliable (Qwen3/DeepSeek)
- Mode Zen (⊞)
- Mémoire locale (faits injectés dans system prompt)
- Dossiers historique + favoris ⭐
- Canvas HTML (iframe preview)
- Compteur tokens/coût session

---

## [v16.0] — 2026-03-10
### 📝 Markdown & Syntaxe
- Markdown complet dans toutes les réponses
- Syntax highlighting Prism.js + tokenizer maison
- Llama 4 Scout 17B, Gemma 2 9B (Groq)
- Variables `{{date}}`, `{{heure}}`

---

## [v15.0] — 2026-03-08
- 12 plugins JS (Chart.js, Marked, Highlight, etc.)
- Vidéos vues : marquage auto, masquage
- Personas : Mode Débutant, Tuteur IA

---

## [v14.0] — 2026-03-05
- Jury IA automatique (podium + barres de score)
- Raccourcis clavier (Ctrl+Enter, Ctrl+1-9, Ctrl+K, Ctrl+L)
- Export Markdown + PDF
- RAG (document → chunks → contexte pertinent)
- Ollama local (auto-détection)
- Workflows Multi-Steps
- 5 nouveaux Personas

---

## [v13.0] — 2026-03-01
- 37 IAs Web en 8 catégories
- Bouton 🔭 Découvrir nouvelles IAs

---

## [v12.0] — 2026-02-25
- Navigation 10 onglets
- Thème clair/sombre
- TTS vocal + dictée vocale
- 6 Personas de base

---

## [v10.0] — 2026-02-20
- Sauvegarde auto (50 conversations)
- Panneau historique

---

## [v9.0] — 2026-02-15
- Onglet YouTube : 18 chaînes, 6 thèmes

---

## [v7.0] — 2026-02-10
- Arène comparatif 18 modèles
- Actualités IA dynamiques
- Onglet Images : 13 générateurs

---

## [v6.0] — 2026-02-05
- Responsive mobile complet
- Blocage rate-limit + countdown

---

## [v5.0] — 2026-02-01
- DeepSeek V3, Mistral Small, Groq/Llama 3.3
- Correcteur orthographique (Claude)

---

## [v4.0] — 2026-01-28
- Config complète (export/import clés)
- Mode Débat 3 phases

---

## [v1.0] — 2026-01-20
- Lancement Multi-IA Hub
- Chat parallèle multi-IA
- Compteur tokens
