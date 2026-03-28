<div align="center">

# 🌐 Multi-IA Hub

### **Compare, combine et automatise 12+ IA simultanément — 100% GRATUIT, SANS CLÉ API**

[![Version](https://img.shields.io/github/v/release/avalondrey/multiia-hub?color=4ADE80&style=for-the-badge)](https://github.com/avalondrey/multiia-hub/releases)
[![License](https://img.shields.io/github/license/avalondrey/multiia-hub?color=3B82F6&style=for-the-badge)](https://github.com/avalondrey/multiia-hub/blob/main/LICENSE)
[![Deploy](https://img.shields.io/badge/Vercel-Déployé-success?style=for-the-badge&logo=vercel)](https://multiia-hub.vercel.app)

[**🌐 Démo Live**](https://multiia-hub.vercel.app) • [**📖 Documentation**](#-documentation) • [**🚀 Déployer**](#-déploiement)

</div>

---

## ⚡ **Mode 100% Gratuit — Zéro Configuration**

**Ton message est automatiquement envoyé au meilleur provider disponible :**

| Provider | Gratuit ? | Clé ? | Limites | Vitesse |
|----------|-----------|-------|---------|---------|
| **🌸 Pollinations.ai** | ✅ 100% | ❌ Non | 15 req/min | ⚡⚡⚡ |
| **🧠 WebLLM** | ✅ 100% | ❌ Non | Offline | ⚡⚡ |
| **🤗 Hugging Face** | ✅ Limité | ❌ Non | 1-2 req/min | ⚡ |
| **☁️ Cloudflare AI** | ✅ 10k/jour | ⚠️ Worker | 10 000/jour | ⚡⚡⚡ |
| **⚡ Groq** | ✅ Limité | ✅ Oui | 30 RPM gratuit | ⚡⚡⚡⚡ |
| **🟣 Claude** | ❌ Payant | ✅ Oui | Selon quota | ⚡⚡⚡ |
| **🟢 OpenAI** | ❌ Payant | ✅ Oui | Selon quota | ⚡⚡⚡ |

**Smart Fallback** : Si Pollinations échoue → WebLLM → Hugging Face → Ta clé API

---

## 🌱 **Multi-IA Greenhouse** — Ton Jardin Intelligent

<div align="center">

**Pilote ta serre avec l'IA — 100% gratuit**

</div>

| Feature | Description |
|---------|-------------|
| **📊 Dashboard** | Stats en temps réel (plants, tâches, récoltes) |
| **🌿 Catalogue** | Tes plants (serre, extérieur, balcon) + conseils IA auto |
| **🤖 Conseiller** | Arrosage, entretien, maladies — adapté à ta région |
| **📸 Diagnostic** | Photo → 3 IAs analysent (maladies, carences, ravageurs) |
| **📅 Planning** | Génération intelligente + export Google Calendar |
| **🧺 Récoltes** | Track tes productions (poids, qualité, historique) |
| **🌤️ Météo** | Prévisions 3 jours + conseils adaptés |

---

## 🎯 **Fonctionnalités Principales**

<div align="center">

| 💬 Parallel Chat | 📊 Benchmark | 🎭 Persona |
|-----------------|--------------|------------|
| 12+ IAs en parallèle | Teste toutes tes IAs | Donne un rôle à chaque IA |

| 📈 Stats | 📝 Prompts | 📓 Notes |
|----------|------------|----------|
| Conso, tokens, coûts | 200+ templates | Markdown synchronisé |

| 🎬 Conference | 🗳️ Consensus | 📰 Morning Brief |
|--------------|--------------|-----------------|
| Débat Oxford | Vote entre IAs | Résumé quotidien |

| 🎨 Image Flux | 🎤 Voice | 📺 YouTube |
|--------------|----------|-----------|
| SDXL, FLUX.1 | TTS, STT | Recherche + résumé |

| 🌐 Web IAs | 📚 Glossaire | ⚙️ Config |
|-----------|-------------|----------|
| 57 interfaces | 200+ termes | Clés API chiffrées |

</div>

---

## 🔐 **Confidentialité & Sécurité**

<div align="center">

| ✅ | **Clés API chiffrées** |
|----|------------------------|
| 🔒 | AES-GCM 256-bit (Web Crypto API) |

| ✅ | **Mode offline 100% privé** |
|----|-----------------------------|
| 🧠 | WebLLM — rien ne sort du navigateur |

| ✅ | **IndexedDB local** |
|----|---------------------|
| 💾 | 2GB+, pas de cloud |

| ✅ | **Open source, auditable** |
|----|---------------------------|
| 🔍 | Code transparent, vérifiable |

| ✅ | **Heatmap de confiance** |
|----|--------------------------|
| 📊 | Visualise les consensus entre IAs |

</div>

---

## 📦 **Installation**

### **Local (Développement)**

```bash
# Cloner
git clone https://github.com/avalondrey/multiia-hub
cd multiia-hub

# Installer
npm install

# Lancer
npm run dev

# Ouvrir http://localhost:5173
```

### **Build Production**

```bash
npm run build
npm run preview
```

---

## 🚀 **Déploiement**

### **Vercel (1-clic)**

<div align="center">

[![Deploy with Vercel](https://img.shields.io/badge/DÉPLOYER%20AVEC-VERCEL-black?style=for-the-badge&logo=vercel)](https://vercel.com/new/clone?repository-url=https://github.com/avalondrey/multiia-hub)

</div>

### **Cloudflare Pages**

```bash
# Installer Wrangler
npm install -g wrangler

# Login
wrangler login

# Déployer
npm run deploy:cloudflare
```

**URL :** `https://multiia-hub.pages.dev`

---

## 🎯 **Utilisation**

### **Mode 100% Gratuit (Recommandé)**

1. **Ouvre** → https://multiia-hub.vercel.app
2. **Aucune configuration nécessaire !**
3. **Parle avec les IAs** → Pollinations est utilisé par défaut
4. **Smart Fallback** gère tout automatiquement

### **Avec Clés API (Optionnel)**

1. **Va dans** ⚙️ **Config**
2. **Ajoute tes clés** (Groq, Mistral, etc.)
3. **Active les IAs** souhaitées
4. **Clés chiffrées localement** (AES-GCM)

---

## 📊 **Providers Supportés**

### **Gratuits (Sans Clé)**

| Provider | Modèles | Limites | Vitesse |
|----------|---------|---------|---------|
| **🌸 Pollinations.ai** | Llama 3.3 70B, Mistral, SDXL | 15 req/min | ⚡⚡⚡ |
| **🧠 WebLLM** | Llama 3 8B, Mistral 7B, Phi-3 | Offline | ⚡⚡ |
| **🤗 Hugging Face** | 10 000+ modèles | 1-2 req/min | ⚡ |
| **☁️ Cloudflare AI** | Llama, Mistral, Gemma | 10k/jour | ⚡⚡⚡ |

### **Avec Clé (Gratuits/Payants)**

| Provider | Modèles | Gratuit ? | Clé |
|----------|---------|-----------|-----|
| **⚡ Groq** | Llama 3.3 70B, Mixtral | ✅ 30 RPM | [Obtenir](https://console.groq.com/keys) |
| **🟠 Mistral** | Mistral Large, Medium | ✅ Essai | [Obtenir](https://console.mistral.ai/api-keys/) |
| **🔵 Google** | Gemini Pro, Ultra | ✅ 60 RPM | [Obtenir](https://makersuite.google.com/app/apikey) |
| **🔷 Cohere** | Command R+ | ✅ 5 RPM | [Obtenir](https://dashboard.cohere.com/api-keys) |
| **🧠 Cerebras** | Llama 3.1 70B | ✅ Bêta | [Obtenir](https://cloud.cerebras.ai/) |
| **🔶 SambaNova** | Llama 3.1 405B | ✅ Bêta | [Obtenir](https://cloud.sambanova.ai/) |
| **🟣 Anthropic** | Claude 3.5/3 | ❌ Payant | [Obtenir](https://console.anthropic.com/settings/keys) |
| **🟢 OpenAI** | GPT-4, GPT-4o | ❌ Payant | [Obtenir](https://platform.openai.com/api-keys) |

---

## 🛠️ **Tech Stack**

| Couche | Technologie |
|--------|-------------|
| **Frontend** | React 19, Vite 7 |
| **State** | Context API + IndexedDB |
| **Styles** | CSS inline (8000+ lignes) |
| **AI** | Pollinations, WebLLM, Hugging Face |
| **Crypto** | Web Crypto API (AES-GCM) |
| **Deploy** | Vercel, Cloudflare Pages |

---

## 📈 **Roadmap**

### **v22.0 — Actuel** ✅

- [x] Mode 100% gratuit (Pollinations + Smart Fallback)
- [x] WebLLM (offline)
- [x] Multi-IA Greenhouse (jardin intelligent)
- [x] Chiffrement AES-GCM
- [x] Heatmap de confiance
- [x] Mode Persona (10 personas)
- [x] IndexedDB (2GB+)

### **v23.0 — À venir**

- [ ] Mode offline complet (Transformers.js)
- [ ] Cache collaboratif IPFS
- [ ] Réseau P2P d'inférence
- [ ] Micro-modèles thématiques
- [ ] TTS natif (accessibilité)
- [ ] Export PDF des conversations
- [ ] Partage via lien public

---

## 🤝 **Contribution**

1. **Fork** le projet
2. `git checkout -b feat/ma-feature`
3. **Code** + teste
4. `git commit -m "feat: description"`
5. **Push** + Pull Request

**Branches :**
- `main` — Production
- `dev` — Développement

---

## 📄 **License**

<div align="center">

**MIT** — Utilise, modifie, partage !

```
Copyright (c) 2026 Avalon Drey

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software.
```

</div>

---

## 🙏 **Remerciements**

<div align="center">

| [🌸 Pollinations.ai](https://pollinations.ai) | [🧠 MLC AI](https://webllm.mlc.ai/) |
|----------------------------------------------|-------------------------------------|
| API 100% gratuite | WebLLM (IA navigateur) |

| [🤗 Hugging Face](https://huggingface.co) | [☁️ Cloudflare AI](https://ai.cloudflare.com/) |
|------------------------------------------|----------------------------------------------|
| Modèles open source | Edge AI gratuit |

| [⚡ Groq](https://groq.com) |
|----------------------------|
| Inference ultra-rapide |

</div>

---

## 📞 **Support**

<div align="center">

| [📧 Issues](https://github.com/avalondrey/multiia-hub/issues) | [🌐 Demo](https://multiia-hub.vercel.app) | [📖 Wiki](https://github.com/avalondrey/multiia-hub/wiki) |
|--------------------------------------------------------------|-------------------------------------------|----------------------------------------------------------|

</div>

---

## 🌟 **Stats**

<div align="center">

![GitHub stars](https://img.shields.io/github/stars/avalondrey/multiia-hub?style=social)
![GitHub forks](https://img.shields.io/github/forks/avalondrey/multiia-hub?style=social)
![GitHub issues](https://img.shields.io/github/issues/avalondrey/multiia-hub)

**Développé avec ❤️ par Avalon Drey**

*« L'IA doit être gratuite, privée et accessible à tous »*

</div>
