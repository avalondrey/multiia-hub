# 🌱 NOUVELLES FONCTIONNALITÉS - Multi-IA Hub

## 📦 Fonctionnalités ajoutées (v22.0+)

### 1. 💾 **Cache IndexedDB**
**Fichier :** `src/db/index.js`

**Pourquoi :**
- localStorage limité à 5MB
- IndexedDB permet de stocker jusqu'à 2GB+
- Meilleures performances pour les grosses conversations

**Utilisation :**
```javascript
import { db } from './db/index.js';

// Sauvegarder une conversation
await db.saveConversation({
  id: 'conv-123',
  title: 'Ma conversation',
  messages: [...],
  updatedAt: Date.now()
});

// Récupérer toutes les conversations
const convs = await db.getAllConversations();

// Migration depuis localStorage
await db.migrateFromLocalStorage();
```

---

### 2. 🔐 **Chiffrement des données**
**Fichier :** `src/utils/encryption.js`

**Pourquoi :**
- Protège tes clés API dans localStorage
- Utilise AES-GCM 256-bit via Web Crypto API
- Même en cas de XSS, les clés sont illisibles

**Utilisation :**
```javascript
import { secureStorage } from './utils/encryption.js';

// Sauvegarder une clé API chiffrée
await secureStorage.set('openai_key', 'sk-...');

// Récupérer la clé déchiffrée
const key = await secureStorage.get('openai_key');

// Pour un objet
await secureStorage.setObject('settings', {theme: 'dark', ...});
```

---

### 3. 🌱 **Multi-IA Greenhouse** ⭐ FEATURE PHARE
**Fichier :** `src/tabs/GreenhouseTab.jsx`

**Qu'est-ce que c'est :**
Un écosystème complet pour les passionnés de jardinage, piloté par l'IA.

**Sous-features :**

#### A. 🤖 Conseiller Jardin
- Analyse climat + plantes + saison
- Conseils personnalisés (arrosage, entretien, maladies)
- Tâches hebdomadaires prioritaires

#### B. 📸 Diagnostic Photo
- Upload une photo de plante
- 3 IAs analysent simultanément (Claude, Gemini, etc.)
- Détection maladies, carences, ravageurs
- Traitements recommandés

#### C. 📅 Planning Intelligent
- Génère un planning adapté à TES contraintes
- Temps disponible, limitations physiques, outils
- Export vers Google Calendar (.ics)

#### D. 🌿 Mes Plantes (à venir)
- Catalogue de tes plantes
- Suivi individuel par plante
- Historique des soins

**Comment l'utiliser :**
1. Va dans l'onglet 🌱 Greenhouse
2. Sélectionne une section (Conseiller, Diagnostic, Planning)
3. Remplis les infos demandées
4. Lance l'analyse IA

---

### 4. 📊 **Heatmap de Confiance**
**Fichier :** `src/components/ConfidenceHeatmap.jsx`

**Pourquoi :**
- Visualiser rapidement si les IAs sont d'accord
- Identifier les zones de consensus/divergence
- Prendre de meilleures décisions

**Utilisation :**
```jsx
import { ConfidenceHeatmap } from './components/ConfidenceHeatmap.jsx';

<ConfidenceHeatmap responses={[
  {ia: 'groq', content: '...'},
  {ia: 'claude', content: '...'},
  {ia: 'gemini', content: '...'}
]} />
```

**Affiche :**
- Grille de similarité entre toutes les paires d'IA
- % d'accord entre chaque paire
- Stats globales (moyenne, max, min)
- Analyse textuelle automatique

---

### 5. 🎭 **Mode Persona**
**Fichier :** `src/config/personas.js`

**Pourquoi :**
- Donner un rôle spécifique à chaque IA
- Obtenir des réponses adaptées au contexte
- Plus de personnalité dans les réponses

**Personas disponibles :**
| Persona | Icone | Description |
|---------|-------|-------------|
| 🌱 Expert Jardin | Jardinier expert 30 ans d'xp |
| ⚡ Coach Productivité | GTD, Pomodoro, direct et actionnable |
| 🤔 Le Sceptique | Esprit critique, questionne tout |
| 🎨 Le Créatif | Artiste, outside the box |
| 📚 Le Pédagogue | Professeur patient et clair |
| 💼 Expert Business | Consultant stratégie, startups |
| 🏋️ Coach Sportif | Entraînement + nutrition |
| 🍳 Chef Cuisinier | Recettes et techniques |
| 🧘 Coach Mindfulness | Méditation, gestion stress |
| 🤖 Optimiseur Technique | Code, perf, benchmarks |

**Utilisation :**
```jsx
import { PersonaSelector, formatPromptWithPersona } from './config/personas.js';

// Sélecteur UI
<PersonaSelector 
  selected={selectedPersona} 
  onChange={setSelectedPersona} 
/>

// Formater le prompt
const prompt = formatPromptWithPersona('jardin-expert', userMessage);
// → Ajoute automatiquement le system prompt du persona
```

---

### 6. 📋 **Audit des Permissions API**
**Fichier :** `src/config/api-permissions.js`

**Pourquoi :**
- Transparence totale sur ce que chaque clé API peut faire
- Comprendre les limitations et coûts
- Savoir exactement à quoi tu t'engages

**Affiche pour chaque provider :**
- ✅ Ce qu'il peut faire
- ⚠️ Les accès sensibles
- ❌ Ce qu'il ne peut PAS faire
- 💰 Pricing exact
- 🆓 Free tier disponible
- 📊 Rate limits

**Utilisation :**
```jsx
import { APIAuditCard, API_PERMISSIONS } from './config/api-permissions.js';

// Dans ConfigTab
{Object.keys(API_PERMISSIONS).map(id => (
  <APIAuditCard key={id} providerId={id} />
))}
```

---

### 7. 🚀 **Déploiement Cloudflare Pages**
**Fichier :** `deploy-cloudflare.sh`

**Pourquoi :**
- Alternative à Vercel
- Plus rapide en Europe
- 100GB bandwidth gratuit
- Build minutes illimitées

**Comment déployer :**

#### Setup initial :
```bash
# Installer Wrangler CLI
npm install -g wrangler

# Login
wrangler login

# Créer le projet
wrangler pages project create multiia-hub
```

#### Déployer :
```bash
# Build + deploy
npm run deploy:cloudflare

# Ou manuellement
bash deploy-cloudflare.sh
```

**URL :** https://multiia-hub.pages.dev

---

## 📊 **Statistiques d'utilisation**

### Fichiers créés :
| Fichier | Lignes | Description |
|---------|--------|-------------|
| `src/db/index.js` | ~200 | IndexedDB layer |
| `src/utils/encryption.js` | ~180 | Chiffrement AES-GCM |
| `src/tabs/GreenhouseTab.jsx` | ~600 | Greenhouse complet |
| `src/components/ConfidenceHeatmap.jsx` | ~200 | Heatmap de confiance |
| `src/config/personas.js` | ~250 | 10 personas |
| `src/config/api-permissions.js` | ~200 | Audit API |
| `deploy-cloudflare.sh` | ~30 | Script deploy |

**Total :** ~1660 lignes de code ajoutées

---

## 🎯 **Roadmap future**

### À implémenter :
- [ ] 🔍 Source Checker (vérification web des affirmations)
- [ ] 📱 PWA installable (manifest.json + service worker)
- [ ] 🔔 Notifications desktop
- [ ] 📄 Export conversations en PDF
- [ ] 🧠 Recherche sémantique dans l'historique
- [ ] 🖱️ Drag & drop pour réorganiser les colonnes
- [ ] 🎬 Mode présentation (cache les UI)
- [ ] 🔗 Partage de conversations via lien public

---

## 🤝 **Contribution**

Tu veux ajouter une feature ?

1. Fork le repo
2. Crée une branche `feat/ma-feature`
3. Code + teste
4. PR avec description détaillée

---

## 📞 **Support**

- 📧 Issues GitHub
- 💬 Discord (à venir)
- 📖 Docs complètes sur le wiki

---

**Développé avec ❤️ par Avalon Drey**
