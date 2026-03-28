# 🎯 Intégration des New Features dans App.jsx

## 1. Ajouter l'import

Au début de App.jsx, après les autres imports :

```javascript
import { NewFeaturesModal, NewBadge, initFirstVisit, useNewFeaturesModal } from "./utils/newFeatures.js";
import GreenhouseTab from "./tabs/GreenhouseTab.jsx";
```

## 2. Initialiser au montage

Dans le composant principal App, ajoute au début du useEffect principal :

```javascript
useEffect(() => {
  initFirstVisit();
  // ... le reste du useEffect existant
}, []);
```

## 3. Afficher le modal

Juste avant la fermeture de `</div>` final de App, ajoute :

```javascript
<NewFeaturesModal />
```

## 4. Ajouter les badges sur les onglets

Dans la sidebar, autour des noms d'onglets :

### Pour l'onglet Greenhouse :
```jsx
<div className="nt" onClick={() => setActiveTab('greenhouse')}>
  <div className="nt-ico">🌱</div>
  <div className="nt-txt">
    <span className="nt-name">
      Greenhouse
      <NewBadge small />
    </span>
    <span className="nt-det">Jardin IA</span>
  </div>
</div>
```

### Pour l'onglet Config (chiffrement) :
```jsx
<div className="nt" onClick={() => setActiveTab('config')}>
  <div className="nt-ico">⚙️</div>
  <div className="nt-txt">
    <span className="nt-name">
      Config
      <NewBadge small />
    </span>
    <span className="nt-det">Clés & options</span>
  </div>
</div>
```

## 5. Dans le rendu des onglets

Quand tu rendus l'onglet Greenhouse :

```jsx
{activeTab === 'greenhouse' && (
  <div className="scroll-tab pad tab-animate">
    <GreenhouseTab apiKeys={apiKeys} enabled={enabled} />
  </div>
)}
```

## 6. Pour la Heatmap de confiance

Dans le rendu des réponses multi-IA (cherche où s'affichent les réponses de Benchmark/Compare/Consensus) :

```jsx
import { ConfidenceHeatmap } from "./components/ConfidenceHeatmap.jsx";

// Après l'affichage des réponses
<ConfidenceHeatmap responses={responses} />
```

## 7. Pour le Mode Persona

Dans la zone de chat, avant le textarea :

```jsx
import { PersonaSelector } from "./config/personas.js";

<PersonaSelector
  selected={selectedPersona}
  onChange={setSelectedPersona}
  compact
/>
```

## 8. Audit API dans ConfigTab

Dans ConfigTab.jsx, ajoute après la section des clés API :

```jsx
import { APIAuditCard, getAllProviders } from "./config/api-permissions.js";

<div className="sec">
  <div className="sec-title">📋 Audit des permissions API</div>
  {getAllProviders().map(provider => (
    <APIAuditCard key={provider.id} providerId={provider.id} />
  ))}
</div>
```

---

## 🎨 Styles CSS à ajouter

Dans `const S = \`` (le CSS inline de App.jsx), ajoute vers la fin :

```css
/* NEW BADGES */
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.05); }
}

.new-features-modal {
  animation: modalIn 0.25s cubic-bezier(0.4, 0, 0.2, 1) both;
}
```

---

## ✅ Checklist d'intégration

- [ ] Import `newFeatures.js` et `GreenhouseTab.jsx`
- [ ] Appel à `initFirstVisit()` dans useEffect
- [ ] `<NewFeaturesModal />` avant la fermeture de App
- [ ] Badge sur l'onglet Greenhouse
- [ ] Badge sur l'onglet Config
- [ ] Rendu de l'onglet Greenhouse
- [ ] Heatmap dans Benchmark/Compare
- [ ] PersonaSelector dans le chat
- [ ] Audit API dans ConfigTab
- [ ] CSS des badges ajouté

---

## 🚀 Test

Après intégration :

1. Vide le localStorage : `localStorage.clear()`
2. Recharge la page
3. Le modal de bienvenue doit apparaître
4. Les badges "NEW" doivent clignoter sur les onglets
5. Clique sur "Essayer" → doit naviguer vers l'onglet

---

**Temps estimé : 15-20 minutes**
