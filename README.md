# 🌐 Multi-IA Hub — 100% Gratuit, Zéro Configuration

**Compare, combine et automatise 12+ IA simultanément — SANS AUCUNE CLÉ API !**

[![Version](https://img.shields.io/github/v/release/avalondrey/multiia-hub?color=4ADE80)](https://github.com/avalondrey/multiia-hub/releases)
[![License](https://img.shields.io/github/license/avalondrey/multiia-hub?color=3B82F6)](https://github.com/avalondrey/multiia-hub/blob/main/LICENSE)
[![Deploy](https://vercelbadge.vercel.app/api/avalondrey/multiia-hub?style=flat)](https://vercel.com/new/clone?repository-url=https://github.com/avalondrey/multiia-hub)

---

## 🚀 Fonctionnalités

### ⚡ **Mode 100% Gratuit (SANS CLÉ API)**

Ton message est envoyé automatiquement au meilleur provider disponible :

| Provider | Gratuit ? | Clé ? | Limites | Vitesse |
|----------|-----------|-------|---------|---------|
| **Pollinations.ai** | ✅ 100% | ❌ Non | 15 req/min | ⚡⚡⚡ |
| **WebLLM** | ✅ 100% | ❌ Non | Offline | ⚡⚡ |
| **Hugging Face** | ✅ Limité | ❌ Non | 1-2 req/min | ⚡ |
| **Cloudflare AI** | ✅ 10k/jour | ⚠️ Worker | 10 000/jour | ⚡⚡⚡ |
| **Groq** | ✅ Limité | ✅ Oui | 30 RPM gratuit | ⚡⚡⚡⚡ |
| **Claude** | ❌ Payant | ✅ Oui | Selon quota | ⚡⚡⚡ |
| **OpenAI** | ❌ Payant | ✅ Oui | Selon quota | ⚡⚡⚡ |

**Smart Fallback** : Si Pollinations échoue → WebLLM → Hugging Face → Ta clé API

---

### 🌱 **Multi-IA Greenhouse** — Ton Jardin Intelligent

**Fonctionnalités :**
- 📊 Dashboard avec stats en temps réel
- 🌿 Catalogue de tes plants (serre, extérieur, balcon)
- 🤖 Conseiller jardin IA (arrosage, entretien, maladies)
- 📸 Diagnostic photo de plantes (3 IAs analysent)
- 📅 Planning intelligent adapté à tes contraintes
- 🧺 Journal des récoltes (poids, qualité, historique)
- 🌤️ Météo du jardin + prévisions 3 jours
- 📆 Export vers Google Calendar / Notion

**100% gratuit avec Pollinations.ai !**

---

### 🎯 **Fonctionnalités Principales**

| Onglet | Description | Gratuit ? |
|--------|-------------|-----------|
| 💬 **Parallel Chat** | Chat avec 12+ IAs en parallèle | ✅ |
| 🌱 **Greenhouse** | Jardin intelligent | ✅ |
| 📊 **Benchmark** | Teste toutes tes IAs en même temps | ✅ |
| 🎭 **Persona** | Donne un rôle à chaque IA | ✅ |
| 📈 **Stats** | Conso, tokens, coûts, perfs | ✅ |
| 📝 **Prompts** | Bibliothèque de prompts | ✅ |
| 📓 **Notes** | Notes synchronisées | ✅ |
| 🎬 **Conference** | Débat style Oxford | ✅ |
| 🗳️ **Consensus** | Vote entre IAs | ✅ |
| 📰 **Morning Brief** | Résumé quotidien | ✅ |
| 🎯 **Task→IAs** | Routing intelligent de tâches | ✅ |
| 🧠 **Second Brain** | Export Obsidian/Notion | ✅ |
| 🎨 **Image Flux** | Génération d'images | ✅ |
| 🎤 **Voice** | Conversation vocale | ✅ |
| 📺 **YouTube** | Recherche + résumé vidéos | ✅ |
| 🌐 **Web IAs** | IAs avec recherche web | ✅ |
| 📚 **Glossaire** | Lexique des termes IA | ✅ |
| ⚙️ **Config** | Gestion des clés API | ✅ |

---

### 🔐 **Confidentialité & Sécurité**

- ✅ **Clés API chiffrées** (AES-GCM 256-bit)
- ✅ **Mode offline** 100% privé (WebLLM)
- ✅ **IndexedDB local** (2GB+), pas de cloud
- ✅ **Open source**, auditables
- ✅ **Heatmap de confiance** (consensus entre IAs)

---

## 📦 Installation

### **Local (Développement)**

```bash
# Cloner le repo
git clone https://github.com/avalondrey/multiia-hub
cd multiia-hub

# Installer les dépendances
npm install

# Lancer en dev
npm run dev

# Ouvrir http://localhost:5173
```

### **Build de Production**

```bash
npm run build
npm run preview
```

---

## 🌐 Déploiement

### **Vercel (1-clic)**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/avalondrey/multiia-hub)

### **Cloudflare Pages**

```bash
# Installer Wrangler
npm install -g wrangler

# Login
wrangler login

# Déployer
npm run deploy:cloudflare
```

**URL :** https://multiia-hub.pages.dev

---

## 🎯 Utilisation

### **Mode 100% Gratuit (Recommandé)**

1. Ouvre l'app → https://multiia-hub.vercel.app
2. **Aucune configuration nécessaire !**
3. Parle avec les IAs via Pollinations (gratuit)
4. Le Smart Fallback utilise automatiquement le meilleur provider

### **Avec Clés API (Optionnel)**

1. Va dans l'onglet ⚙️ **Config**
2. Ajoute tes clés API (Groq, Mistral, etc.)
3. Active les IAs souhaitées
4. Les clés sont **chiffrées localement**

---

## 📊 Providers Supportés

### **Gratuits (Sans Clé)**

| Provider | Modèles | Limites | Vitesse |
|----------|---------|---------|---------|
| **Pollinations.ai** | Llama 3.3 70B, Mistral, SDXL | 15 req/min | ⚡⚡⚡ |
| **WebLLM** | Llama 3 8B, Mistral 7B, Phi-3 | Offline | ⚡⚡ |
| **Hugging Face** | 10 000+ modèles | 1-2 req/min | ⚡ |
| **Cloudflare AI** | Llama, Mistral, Gemma | 10k/jour | ⚡⚡⚡ |

### **Avec Clé (Payants/Gratuits limités)**

| Provider | Modèles | Gratuit ? | Clé |
|----------|---------|-----------|-----|
| **Groq** | Llama 3.3 70B, Mixtral | ✅ 30 RPM | [Obtenir](https://console.groq.com/keys) |
| **Mistral** | Mistral Large, Medium | ✅ Essai | [Obtenir](https://console.mistral.ai/api-keys/) |
| **Google** | Gemini Pro, Ultra | ✅ 60 RPM | [Obtenir](https://makersuite.google.com/app/apikey) |
| **Cohere** | Command R+ | ✅ 5 RPM | [Obtenir](https://dashboard.cohere.com/api-keys) |
| **Cerebras** | Llama 3.1 70B | ✅ Bêta | [Obtenir](https://cloud.cerebras.ai/) |
| **SambaNova** | Llama 3.1 405B | ✅ Bêta | [Obtenir](https://cloud.sambanova.ai/) |
| **Anthropic** | Claude 3.5/3 | ❌ Payant | [Obtenir](https://console.anthropic.com/settings/keys) |
| **OpenAI** | GPT-4, GPT-4o | ❌ Payant | [Obtenir](https://platform.openai.com/api-keys) |

---

## 🛠️ Tech Stack

| Couche | Technologie |
|--------|-------------|
| **Frontend** | React 19, Vite 7 |
| **State** | Context API + IndexedDB |
| **Styles** | CSS inline (8000+ lignes) |
| **AI** | Pollinations, WebLLM, Hugging Face |
| **Crypto** | Web Crypto API (AES-GCM) |
| **Deploy** | Vercel, Cloudflare Pages |

---

## 📈 Roadmap

### **v22.0 — Actuel**
- ✅ Multi-IA Greenhouse (jardin intelligent)
- ✅ Mode 100% gratuit (Pollinations + Smart Fallback)
- ✅ WebLLM (offline)
- ✅ Chiffrement AES-GCM
- ✅ Heatmap de confiance
- ✅ Mode Persona (10 personas)
- ✅ IndexedDB (2GB+)

### **v23.0 — À venir**
- [ ] Mode offline complet (Transformers.js)
- [ ] Cache collaboratif IPFS
- [ ] Réseau P2P d'inférence
- [ ] Micro-modèles thématiques
- [ ] TTS natif (accessibilité)
- [ ] Export PDF des conversations
- [ ] Partage via lien public

---

## 🤝 Contribution

1. Fork le projet
2. `git checkout -b feat/ma-feature`
3. Code + teste
4. `git commit -m "feat: description"`
5. Push + Pull Request

**Branches :**
- `main` — Production
- `dev` — Développement

---

## 📄 License

**MIT** — Utilise, modifie, partage !

```
Copyright (c) 2026 Avalon Drey

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software.
```

---

## 🙏 Remerciements

- **[Pollinations.ai](https://pollinations.ai)** — API 100% gratuite
- **[MLC AI](https://webllm.mlc.ai/)** — WebLLM (IA dans le navigateur)
- **[Hugging Face](https://huggingface.co)** — Modèles open source
- **[Cloudflare Workers AI](https://ai.cloudflare.com/)** — Edge AI gratuit
- **[Groq](https://groq.com)** — Inference ultra-rapide

---

## 📞 Support

- 📧 **Issues GitHub** : https://github.com/avalondrey/multiia-hub/issues
- 🌐 **Demo** : https://multiia-hub.vercel.app
- 📖 **Docs** : https://github.com/avalondrey/multiia-hub/wiki

---

## 🌟 Stats

![GitHub stars](https://img.shields.io/github/stars/avalondrey/multiia-hub?style=social)
![GitHub forks](https://img.shields.io/github/forks/avalondrey/multiia-hub?style=social)
![GitHub issues](https://img.shields.io/github/issues/avalondrey/multiia-hub)

---

**Développé avec ❤️ par Avalon Drey**

*« L'IA doit être gratuite, privée et accessible à tous »*
#   m u l t i i a - h u b  
 