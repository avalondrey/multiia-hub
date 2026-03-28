# Changelog

Toutes les modifications notables de ce projet sont documentées dans ce fichier.

---

## [v22.0] — 27 Mars 2026

### 🎉 **NOUVEAUTÉS MAJEURES**

#### ⚡ **Mode 100% Gratuit (SANS CLÉ API)**
- **Pollinations.ai** : Llama 3.3 70B, Mistral, SDXL, FLUX
  - Texte : API compatible OpenAI
  - Image : Génération via URL simple
  - Audio : TTS gratuit
  - 100% open source, pas de compte, CDN mondial
- **Smart Fallback System** :
  - Ordre : Pollinations → WebLLM → Hugging Face → Clé user
  - Cache intelligent des réponses (1h)
  - Stats par provider
  - Graceful degradation automatique
- **WebLLM** : IA 100% dans le navigateur
  - Offline après chargement
  - 100% privé, rien ne sort du navigateur
  - Modèles : Llama 3 8B, Mistral 7B, Phi-3, Qwen2, Gemma 2
  - WebGPU requis (Chrome/Edge récent)

#### 🌱 **Multi-IA Greenhouse** — Jardin Intelligent
- **Dashboard** : Stats en temps réel (plants, tâches, récoltes)
- **Mes Plants** :
  - Catalogue avec conseils IA auto
  - Suivi par plant (arrosage, lumière, température)
  - Emplacement (serre, extérieur, balcon, intérieur)
  - Photos (à venir)
- **Conseiller Jardin IA** :
  - Analyse climat + plantes + saison
  - Conseils personnalisés (arrosage, entretien, maladies)
  - Tâches hebdomadaires prioritaires
- **Diagnostic Photo** :
  - Upload de photo
  - 3 IAs analysent simultanément
  - Détection maladies, carences, ravageurs
- **Planning Intelligent** :
  - Adapté à TES contraintes (temps, physique, outils)
  - Export vers Google Calendar (.ics)
- **Journal des Récoltes** :
  - Track tes productions (poids, qualité, date)
  - Historique complet
  - Stats de rendement
- **Météo** :
  - Prévisions 3 jours
  - Conseils adaptés

#### 🔐 **Chiffrement Web Crypto API**
- AES-GCM 256-bit pour clés API
- Protection même en cas de XSS
- SecureStorage wrapper
- Hash SHA-256, signatures HMAC

#### 💾 **IndexedDB**
- Stockage illimité (2GB+) pour l'historique
- Migration automatique depuis localStorage
- Meilleures performances
- Requêtes complexes (filtrage, recherche)

#### 📊 **Heatmap de Confiance**
- Visualisation consensus/divergences entre IAs
- Similarité de Jaccard
- Stats globales (moyenne, max, min)
- Analyse textuelle automatique

#### 🎭 **Mode Persona (10 personas)**
- Expert Jardin 🌱
- Coach Productivité ⚡
- Le Sceptique 🤔
- Le Créatif 🎨
- Le Pédagogue 📚
- Expert Business 💼
- Coach Sportif 🏋️
- Chef Cuisinier 🍳
- Coach Mindfulness 🧘
- Optimiseur Technique 🤖

#### 📋 **Audit des Permissions API**
- Transparence totale sur chaque clé
- Permissions détaillées (✅/⚠️/❌)
- Pricing, limits, free tier
- 9 providers documentés

#### 🚀 **Déploiement Cloudflare Pages**
- Script `deploy-cloudflare.sh`
- Alternative Vercel (plus rapide en EU)
- 100GB gratuit, build minutes illimitées

#### 🆕 **Système de Badges "NEW"**
- Modal de bienvenue (première visite)
- Badges animés sur les onglets
- Tooltips au survol
- Disparaît après 7 jours

---

### 📦 **NOUVELLES DÉPENDANCES**

```json
{
  "@mlc-ai/web-llm": "^0.2.78",
  "wrangler": "^3.0.0"
}
```

---

### 🐛 **CORRECTIONS**

- Fix pages blanches (ConferenceTab, TraducteurTab)
- Fix overflow CSS (AgentTab, MorningBriefTab, SecondBrainTab)
- Fix imports manquants
- Nettoyage caractères Unicode (compatibilité parse5)
- .gitignore amélioré (protection données sensibles)

---

### 📚 **DOCUMENTATION**

- `README.md` — Mis à jour avec mode gratuit
- `CHANGELOG.md` — Tenu à jour
- `NOUVELLES_FEATURES.md` — Guide complet
- `INTEGRATION_NEW_FEATURES.md` — Intégration

---

### ⬆️ **AMÉLIORATIONS**

- Build Vite optimisé (370ms)
- CSS réduit de 1317 lignes
- Scripts npm ajoutés (`dev`, `preview`, `deploy:*`)
- Backup automatique avant modification

---

## [v21.6] — 26 Mars 2026

### Ajouts
- new-s CSS avec thèmes Nord/Dracula
- Nettoyage caractères Unicode
- Sidebar moderne avec icônes

### Corrections
- Suppression bordures Unicode (compatibilité parse5)

---

## [v21.2] — 25 Mars 2026

### Corrections
- Fix pages blanches
- Fix imports dans ConferenceTab, TraducteurTab
- Fix overflow CSS

---

## [v21.1] — 24 Mars 2026

### Refactoring
- Extraction de 33 onglets depuis `App.jsx`
- Architecture modulaire
- `App.jsx` réduit de 14160 à 7860 lignes

### Nouveaux onglets
- AgentTab, BenchmarkTab, CompareTab
- ConferenceTab, ConsensusTab, ContradictionTab
- ContextTranslatorTab, GlossaireTab, IaMentorTab
- ImageFluxTab, JournalisteTab, LiveDebateTimerTab
- LongTermMemoryTab, ModeFlashTab, MorningBriefTab
- NotesTab, ProjectsTab, PromptAutopsyTab
- PromptDNATab, PromptIteratorTab, PromptsTab
- RechercheTab, RedactionTab, RouterTab
- SecondBrainTab, SkillBuilderTab, StatsTab
- StudioTab, TaskToIAsTab, TraducteurTab
- VeilleTab, VoiceTab, WebIAsTab, YouTubeTab

---

## [v21.0] — 23 Mars 2026

### Nouveautés
- 10+ nouveaux onglets
- Parallel chat (jusqu'à 12 IAs)
- Expert panels, débats, workflows
- Prompt management, voice conversation
- Analytics

---

## Versions Antérieures

- v20.x — Architecture initiale
- v19.x — Premières fonctionnalités
- v18.x — Prototype

---

## 📊 Statistiques

| Version | Lignes | Fichiers | Features |
|---------|--------|----------|----------|
| v22.0 | ~25 000 | 100+ | 33 onglets, mode gratuit |
| v21.0 | ~15 000 | 50+ | 20 onglets |
| v20.0 | ~8 000 | 20+ | Chat de base |

---

**Total des commits :** 254+  
**Contributeurs :** 1  
**License :** MIT

---

*Pour plus de détails, voir les commits sur GitHub.*
