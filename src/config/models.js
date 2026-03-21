// ╔══════════════════════════════════════════════════════════════╗
// ║  src/config/models.js — Données statiques (aucun JSX)        ║
// ║  Modifier un modèle IA : changer baseUrl, model, inputLimit  ║
// ╚══════════════════════════════════════════════════════════════╝

// ╔══════════════════════════════════════════════════════════════╗
// ║  SECTION CONFIG — Seule partie à modifier lors d'une MAJ    ║
// ╚══════════════════════════════════════════════════════════════╝
export const APP_VERSION = "21.1";
export const BUILD_DATE = new Date().toISOString().slice(0,10);

export const MODEL_DEFS = {
  // ── IAs 100% gratuites ────────────────────────────────────────────
  groq:       { name:"Llama 3.3 (Groq)",   short:"Groq",      provider:"Groq / Meta",   color:"#F97316", bg:"#180C04", border:"#3D1A00", icon:"⚡", apiType:"compat", maxTokens:128000, inputLimit:32000, free:true, keyName:"groq_inf",   keyLink:"https://console.groq.com/keys",             desc:"GRATUIT 14 400/jour",   baseUrl:"https://api.groq.com/openai/v1",              model:"llama-3.3-70b-versatile" },
  mistral:    { name:"Mistral Small 4",     short:"Mistral",   provider:"Mistral AI",    color:"#FF8C69", bg:"#180E08", border:"#3D1E0A", icon:"▲", apiType:"compat", maxTokens:32000,  inputLimit:28000, free:true, keyName:"mistral",    keyLink:"https://console.mistral.ai/",               desc:"Tier gratuit dispo",    baseUrl:"https://api.mistral.ai/v1",                   model:"mistral-small-latest" },
  cohere:     { name:"Command R+ (Cohere)",   short:"Cohere",    provider:"Cohere",         color:"#39D353", bg:"#081A0E", border:"#0A3D1A", icon:"⌘", apiType:"cohere",  maxTokens:128000, inputLimit:60000, free:true, keyName:"cohere",     keyLink:"https://dashboard.cohere.com/api-keys",     desc:"Gratuit — 1000 req/mois" },
  cerebras:   { name:"Llama 3.1 (Cerebras)",short:"Cerebras",  provider:"Cerebras",      color:"#A78BFA", bg:"#0E0818", border:"#201040", icon:"◉", apiType:"compat", maxTokens:8192,   inputLimit:6000, free:true, keyName:"cerebras",   keyLink:"https://cloud.cerebras.ai/",                desc:"Gratuit — 8B ultra rapide (ctx 8k)", baseUrl:"https://api.cerebras.ai/v1", model:"llama3.1-8b" },
  sambanova:  { name:"Llama 3.3 (SambaNova)", short:"Samba",     provider:"SambaNova",     color:"#34D399", bg:"#08180E", border:"#0A3D20", icon:"∞", apiType:"compat", maxTokens:32000,  inputLimit:28000, free:true, keyName:"sambanova",  keyLink:"https://cloud.sambanova.ai/",               desc:"Gratuit — Llama 3.3 70B",     baseUrl:"https://api.sambanova.ai/v1",                 model:"Meta-Llama-3.3-70B-Instruct" },
  qwen3:      { name:"Qwen3 32B (Groq)",    short:"Qwen3",   provider:"Groq / Qwen", color:"#C084FC", bg:"#120818", border:"#2E0A3D", icon:"◈", apiType:"compat", maxTokens:32768,  inputLimit:28000, free:true, keyName:"groq_inf",   keyLink:"https://console.groq.com/keys",             desc:"Gratuit — même clé Groq",    baseUrl:"https://api.groq.com/openai/v1",           model:"qwen/qwen3-32b" },
  // ── Ollama Cloud (clé Ollama gratuite) ─────────────────────────────
  minimax_m27: { name:"MiniMax M2.7 (Ollama)", short:"M2.7",   provider:"MiniMax via Ollama", color:"#06B6D4", bg:"#040E12", border:"#083040", icon:"⬡", apiType:"ollama_cloud", maxTokens:32768, inputLimit:28000, free:false, keyName:"ollama_cloud", keyLink:"https://ollama.com/settings/tokens", desc:"Clé Ollama gratuite · #1 open-source code & agents", baseUrl:"https://ollama.com", model:"minimax-m2.7:cloud" },
  minimax_m25: { name:"MiniMax M2.5 (Ollama)", short:"M2.5",   provider:"MiniMax via Ollama", color:"#0891B2", bg:"#040C10", border:"#062030", icon:"⬡", apiType:"ollama_cloud", maxTokens:32768, inputLimit:28000, free:false, keyName:"ollama_cloud", keyLink:"https://ollama.com/settings/tokens", desc:"Clé Ollama gratuite · SWE-Bench = Claude Opus 4.6", baseUrl:"https://ollama.com", model:"minimax-m2.5:cloud" },
  // ── OpenRouter (clé gratuite) ─────────────────────────────────────
  nemotron3:   { name:"Nemotron 3 Super (120B)", short:"Nemotron", provider:"NVIDIA via OpenRouter", color:"#76B900", bg:"#081200", border:"#1A3300", icon:"⬟", apiType:"compat", maxTokens:131072, inputLimit:8000, free:false, keyName:"openrouter", keyLink:"https://openrouter.ai/keys", desc:"Clé OpenRouter · 120B MoE, #1 pour agents multi-étapes", baseUrl:"https://openrouter.ai/api/v1", model:"nvidia/nemotron-3-super-120b-a12b:free" },
  // ── Via Pollinations.AI (clé Pollen gratuite sur enter.pollinations.ai) ─
  llama4s:    { name:"Llama 4 Scout (Groq)",   short:"L4 Scout", provider:"Groq / Meta",    color:"#FF6B35", bg:"#180A04", border:"#3D1500", icon:"🦙", apiType:"compat", maxTokens:128000, inputLimit:32000, free:true, keyName:"groq_inf",  keyLink:"https://console.groq.com/keys",   desc:"GRATUIT — Llama 4 Scout 17B multimodal", baseUrl:"https://api.groq.com/openai/v1", model:"meta-llama/llama-4-scout-17b-16e-instruct" },
  gemma2:     { name:"Llama 3.1 8B (Groq)",     short:"L3.1-8B",  provider:"Groq / Meta",    color:"#34D399", bg:"#08180E", border:"#0A3D20", icon:"◎", apiType:"compat", maxTokens:8192,   inputLimit:6000, free:true, keyName:"groq_inf",  keyLink:"https://console.groq.com/keys",   desc:"GRATUIT — même clé Groq, très rapide (ctx 8k)", baseUrl:"https://api.groq.com/openai/v1", model:"llama-3.1-8b-instant" },
  poll_gpt:      { name:"GPT-4o (Pollinations)",    short:"GPT-4o",    provider:"OpenAI via Pollinations",   color:"#74C98C", bg:"#081A0E", border:"#0A3D1E", icon:"◈", apiType:"pollinations_paid", maxTokens:128000, inputLimit:12000, serial:true, free:true,  keyName:"pollen",      keyLink:"https://enter.pollinations.ai", desc:"Clé Pollen gratuite · enter.pollinations.ai", model:"openai" },
  poll_claude:   { name:"Claude (Pollinations)",     short:"Claude✦",  provider:"Anthropic via Pollinations", color:"#D4A853", bg:"#1A1408", border:"#3D3000", icon:"✦", apiType:"pollinations_paid", maxTokens:128000, free:false, keyName:"pollen",      keyLink:"https://enter.pollinations.ai",  desc:"Clé Pollen gratuite · enter.pollinations.ai (Seed tier)", model:"claude-airforce" },
  poll_deepseek: { name:"DeepSeek (Pollinations)",   short:"DeepSeek", provider:"DeepSeek via Pollinations", color:"#A0C8FF", bg:"#080E1A", border:"#0A1A3D", icon:"⬡", apiType:"pollinations_paid", maxTokens:128000, free:false, keyName:"pollen",      keyLink:"https://enter.pollinations.ai",  desc:"Clé Pollen gratuite · enter.pollinations.ai (Seed tier)", model:"deepseek" },
  poll_gemini:   { name:"GPT-4o Large (Pollinations)", short:"GPT-4o L", provider:"OpenAI via Pollinations",   color:"#6BA5E0", bg:"#080E18", border:"#0A1A3D", icon:"◇", apiType:"pollinations_paid", maxTokens:128000, inputLimit:12000, serial:true, free:true,  keyName:"pollen",      keyLink:"https://enter.pollinations.ai",   desc:"Clé Pollen gratuite · enter.pollinations.ai", model:"openai-large" },
};

// ── Liste de base des IAs Web ───────────────────────────────────
export const BASE_WEB_AIS = [
  // ── Chatbots généraux gratuits ──────────────────────────────────
  { id:"chatgpt",      name:"ChatGPT",         subtitle:"OpenAI • Gratuit limité",      cat:"gratuit",    url:"https://chatgpt.com/",                    color:"#74C98C", icon:"◈", trend:10, desc:"Le chatbot IA le plus utilisé au monde. GPT-4o gratuit, DALL-E, navigation web, plugins, mémoire persistante.", tags:["Généraliste","Web","Images","Plugins","Mémoire"] },
  { id:"claude_web",   name:"Claude.ai",       subtitle:"Anthropic • Gratuit limité",   cat:"gratuit",    url:"https://claude.ai/",                      color:"#D4A853", icon:"✦", trend:10, desc:"Meilleur pour l'analyse de longs documents, le code et la rédaction. Contexte 200k tokens, upload de fichiers, projets.", tags:["Documents","Code","Rédaction","Analyse","Projets"] },
  { id:"gemini_web",   name:"Gemini",          subtitle:"Google • Gratuit limité",      cat:"gratuit",    url:"https://gemini.google.com/",              color:"#6BA5E0", icon:"◇", trend:9,  desc:"IA Google multimodale. Analyse images/vidéos, intégré à Google Drive/Gmail, modèle 2.5 Flash ultra-rapide.", tags:["Multimodal","Google Drive","Images","Vidéo","Gratuit"] },
  { id:"deepseek_web", name:"DeepSeek",        subtitle:"DeepSeek • Gratuit (file d'attente)",    cat:"gratuit",    url:"https://chat.deepseek.com/",              color:"#A0C8FF", icon:"⬡", trend:9,  desc:"Modèle chinois open-source, exceptionnel en raisonnement mathématique et code. R1 pense étape par étape visible.", tags:["Raisonnement","Maths","Code","Open-source","Gratuit"] },
  { id:"grok_web",     name:"Grok",            subtitle:"xAI (Elon Musk) • Gratuit limité", cat:"gratuit", url:"https://grok.com/", color:"#60C8E0", icon:"𝕏", trend:8, desc:"IA d'xAI avec accès temps réel à X/Twitter. Grok 3 fort en raisonnement, génération images Aurora, humour décalé.", tags:["Temps réel","X/Twitter","Images","Raisonnement","Actualité"] },
  { id:"copilot",      name:"Copilot",         subtitle:"Microsoft • Gratuit (sans compte)", cat:"gratuit", url:"https://copilot.microsoft.com/",          color:"#4FC3F7", icon:"⊞", trend:8,  desc:"GPT-4o via Microsoft entièrement gratuit, sans limite. Intégré à Windows 11, Edge, Office. Génération images DALL-E.", tags:["GPT-4o gratuit","Windows","Office","Images","Bing"] },
  { id:"mistral_web",  name:"Le Chat",         subtitle:"Mistral AI • Gratuit limité",  cat:"gratuit",    url:"https://chat.mistral.ai/",                color:"#FF8C69", icon:"▲", trend:7,  desc:"Interface officielle Mistral. Mistral Large 2 gratuit, excellent en français. Mode Flash ultra-rapide, Canvas pour écrire.", tags:["Français","Rapide","Canvas","Europe","Mistral Large"] },
  { id:"kimi_web",     name:"Kimi",            subtitle:"Moonshot AI • Gratuit limité", cat:"gratuit",    url:"https://www.kimi.com/",                   color:"#E07FA0", icon:"月", trend:7,  desc:"Fenêtre de contexte massive de 1M tokens — analyse de très longs documents PDF, livres entiers, bases de code.", tags:["1M tokens","Longs docs","PDF","Analyse","Contexte"] },
  { id:"qwen_web",     name:"Qwen Chat",       subtitle:"Alibaba • Gratuit limité",     cat:"gratuit",    url:"https://chat.qwen.ai/",                   color:"#E0A850", icon:"千", trend:7,  desc:"Qwen3-235B gratuit. Excellent en code, maths et multilingue. Mode thinking activable, concurrence GPT-4o sur les benchmarks.", tags:["Code","Maths","Multilingue","Thinking","Alibaba"] },
  { id:"zai",          name:"Z.ai",            subtitle:"z.ai • Gratuit limité",        cat:"gratuit",    url:"https://chat.z.ai/",                      color:"#B07FE0", icon:"Ζ", trend:8,  desc:"Accès gratuit à GPT-4o, Claude 3.5, Gemini Pro et Z1 dans une seule interface. Comparaison side-by-side des modèles.", tags:["Multi-modèles","GPT-4o","Claude","Gemini","Comparaison"] },
  { id:"llama_meta",   name:"Meta AI",         subtitle:"Meta • Gratuit (compte requis)",        cat:"gratuit",    url:"https://www.meta.ai/",                    color:"#1877F2", icon:"⬟", trend:7,  desc:"Llama 4 Maverick directement via Meta. Intégré à WhatsApp, Instagram, Messenger. Génération images, recherche web.", tags:["Llama 4","WhatsApp","Instagram","Images","Gratuit"] },
  { id:"t3chat",       name:"T3 Chat",         subtitle:"T3 • Gratuit (compte requis)",          cat:"gratuit",    url:"https://t3.chat/",                        color:"#A855F7", icon:"T", trend:6,   desc:"Interface minimaliste ultra-rapide, zéro friction. Accès Llama 4, Gemini Flash, DeepSeek R1 gratuit, historique local.", tags:["Rapide","Minimaliste","Gratuit","Multi-modèles","Privé"] },
  { id:"cerebras_w",   name:"Cerebras Chat",   subtitle:"Cerebras • Gratuit (compte requis)",    cat:"gratuit",    url:"https://inference.cerebras.ai/",          color:"#FF6B35", icon:"◉", trend:6,  desc:"Inférence sur puce dédiée — 2000+ tokens/seconde. Le chatbot le plus RAPIDE au monde, idéal pour prototypage rapide.", tags:["Ultra-rapide","2000 tok/s","Llama","Prototype","Vitesse"] },
  { id:"sambanova_w",  name:"SambaNova Chat",  subtitle:"SambaNova • Gratuit (compte requis)",   cat:"gratuit",    url:"https://cloud.sambanova.ai/",             color:"#34D399", icon:"∞", trend:6,  desc:"Accès gratuit à Llama 4 Maverick et DeepSeek-R1 avec vitesse d'inférence très élevée. Bonne alternative à Groq.", tags:["Llama 4","DeepSeek-R1","Rapide","Gratuit","API"] },
  // ── Recherche ───────────────────────────────────────────────────
  { id:"perplexity",   name:"Perplexity",      subtitle:"Perplexity • Gratuit limité / Pro $20/mois", cat:"recherche", url:"https://www.perplexity.ai/",            color:"#20B2AA", icon:"◎", trend:9,  desc:"Moteur de recherche IA avec sources citées en temps réel. Remplace Google pour les questions complexes. Threads, Spaces.", tags:["Recherche web","Sources","Temps réel","Threads","Citer"] },
  { id:"phind",        name:"Phind",           subtitle:"Phind • Gratuit limité",       cat:"recherche",   url:"https://www.phind.com/",                color:"#8B5CF6", icon:"φ", trend:7,   desc:"Moteur de recherche IA spécialisé pour les développeurs. Répond aux questions de code avec le contexte des docs officielles.", tags:["Code","Dev","Documentation","Stack Overflow","Technique"] },
  { id:"you",          name:"You.com",         subtitle:"You.com • Gratuit / Pro $15/mois",     cat:"recherche",   url:"https://you.com/",                      color:"#6366F1", icon:"Y", trend:6,   desc:"Moteur IA hybride : recherche web classique + réponses IA. Modes spécialisés : Research, Code, Writing, Smart.", tags:["Web","Recherche","Modes","Code","Privé"] },
  { id:"andi",         name:"Andi Search",     subtitle:"Andi • 100% Gratuit",        cat:"recherche",   url:"https://andisearch.com/",               color:"#10B981", icon:"∂", trend:5,   desc:"Moteur de recherche conversationnel sans publicité, sans tracking. Résume les pages web, répond directement.", tags:["Sans pub","Privé","Résumé","Conversationnel","Clean"] },
  // ── Multi-modèles / Playground ──────────────────────────────────
  { id:"hf",           name:"HuggingFace Chat",subtitle:"HuggingFace • Gratuit (Pro $9/mois)", cat:"multimodele", url:"https://huggingface.co/chat/",          color:"#FFD21E", icon:"🤗", trend:8,  desc:"Accès à 100+ modèles open-source : Llama 4, Mistral, Gemma, Phi, Falcon... Assistants personnalisables, RAG, web search.", tags:["Open-source","100+ modèles","Llama","Mistral","Assistants"] },
  { id:"openrouter_w", name:"OpenRouter Chat",  subtitle:"OpenRouter • Gratuit + Pay-per-use",  cat:"multimodele", url:"https://openrouter.ai/chat",            color:"#E07FA0", icon:"⊕", trend:8,  desc:"200+ modèles en un seul endroit. Modèles gratuits : Llama, Gemma, DeepSeek. Comparaison de prix entre providers API.", tags:["200+ modèles","Gratuits","API","Prix","Comparaison"] },
  { id:"poe",          name:"Poe",             subtitle:"Quora • Gratuit limité / $20/mois",       cat:"multimodele", url:"https://poe.com/",                      color:"#9CA3AF", icon:"P", trend:7,   desc:"Plateforme Quora réunissant Claude, GPT-4, Llama, Stable Diffusion. Création de chatbots personnalisés, partage de bots.", tags:["Claude","GPT-4","Llama","Bots custom","Quora"] },
  { id:"lmsys",        name:"LMArena",         subtitle:"LMSys • 100% Gratuit",       cat:"multimodele", url:"https://lmarena.ai/",                   color:"#F59E0B", icon:"⚔", trend:7,   desc:"Arène de comparaison de modèles IA en mode aveugle. Vote pour le meilleur. Leaderboard Chatbot Arena de référence mondiale.", tags:["Arène","Benchmark","Comparaison","Leaderboard","Aveugle"] },
  { id:"groq_web",     name:"Groq Playground", subtitle:"Groq • Gratuit (limites API)",        cat:"multimodele", url:"https://console.groq.com/playground",   color:"#F97316", icon:"⚡", trend:6,  desc:"Interface Groq pour tester Llama 4, Qwen3, DeepSeek à des vitesses extrêmes. Utile pour prototyper des prompts API.", tags:["Rapide","Llama","Qwen3","Prototype","API"] },
  { id:"together_w",   name:"Together AI",     subtitle:"Together • Gratuit limité + API payante",    cat:"multimodele", url:"https://api.together.ai/playground",    color:"#F59E0B", icon:"∿", trend:6,   desc:"Playground cloud pour Llama, Mixtral, SDXL. Infrastructure open-source dédiée, fine-tuning disponible, API performante.", tags:["Open-source","Fine-tuning","Llama","SDXL","API"] },
  { id:"nat_dev",      name:"Nat.dev",         subtitle:"Nat.dev • Gratuit limité",     cat:"multimodele", url:"https://nat.dev/",                      color:"#A78BFA", icon:"⋄", trend:5,   desc:"Playground comparatif multi-modèles côte à côte. Teste GPT-4, Claude, Llama avec le même prompt simultanément.", tags:["Côte à côte","Comparaison","GPT-4","Claude","Prompt"] },
  // ── Image IA ────────────────────────────────────────────────────
  { id:"ideogram",     name:"Ideogram",        subtitle:"Ideogram • Gratuit (10 imgs/jour) / $8/mois",    cat:"image",       url:"https://ideogram.ai/",                  color:"#EC4899", icon:"🎨", trend:9,  desc:"Génération d'images IA avec texte intégré parfaitement. Idéal logos, affiches, thumbnails. Style photoréaliste, illustration.", tags:["Texte dans images","Logos","Affiches","Photoréaliste","Tendance"] },
  { id:"adobe_ff",     name:"Adobe Firefly",   subtitle:"Adobe • 25 crédits/mois gratuits",       cat:"image",       url:"https://firefly.adobe.com/",            color:"#FF6B35", icon:"🔥", trend:8,  desc:"Génération d'images 100% légale, entraîné sur images sous licence Adobe. Intégré à Photoshop, Illustrator. Sans problèmes de droits.", tags:["Légal","Adobe","Photoshop","Commercial","Droits"] },
  { id:"kling",        name:"Kling AI",        subtitle:"Kuaishou • Gratuit limité / Pro $10/mois",    cat:"image",       url:"https://klingai.com/",                  color:"#0EA5E9", icon:"▶", trend:8,   desc:"Génération vidéo IA 5s-10s haute qualité et images. Concurrent direct de Sora, accès gratuit limité. Très réaliste.", tags:["Vidéo IA","Images","Réaliste","Gratuit","Concurrent Sora"] },
  { id:"leonardo",     name:"Leonardo.ai",     subtitle:"Leonardo • 150 crédits/jour gratuits",    cat:"image",       url:"https://app.leonardo.ai/",              color:"#7C3AED", icon:"🖼", trend:7,   desc:"150 crédits/jour gratuits. Spécialisé jeux vidéo, concept art, personnages. Modèles fine-tunés, ControlNet, inpainting.", tags:["Jeux vidéo","Concept art","Personnages","ControlNet","Inpainting"] },
  { id:"playground_ai",name:"Playground AI",  subtitle:"Playground • 500 images/jour gratuites",  cat:"image",       url:"https://playground.com/",               color:"#F472B6", icon:"🎭", trend:6,   desc:"500 images/jour gratuites avec Playground v3. Interface simple, édition d'images, mix de styles, fond transparent.", tags:["500/jour","Édition","Mix styles","Transparent","Simple"] },
  // ── Code & Développement ────────────────────────────────────────
  { id:"bolt",         name:"Bolt.new",        subtitle:"StackBlitz • Gratuit limité / Pro $20/mois",  cat:"code",        url:"https://bolt.new/",                     color:"#7C3AED", icon:"⚡", trend:10,  desc:"Génère des applications web complètes (React, Vue, Node) en quelques secondes depuis une description. Preview live intégré.", tags:["Full-stack","React","Preview live","Génération app","Tendance"] },
  { id:"lovable",      name:"Lovable",         subtitle:"Lovable • Gratuit limité / Pro $20/mois",     cat:"code",        url:"https://lovable.dev/",                  color:"#FF6B6B", icon:"♥", trend:10,  desc:"Génère des applications fullstack avec backend Supabase depuis une description. Déploiement 1-clic, édition visuelle.", tags:["Fullstack","Supabase","Backend","Déploiement","No-code"] },
  { id:"cursor",       name:"Cursor",          subtitle:"Cursor • Gratuit (2000 complétion/mois) / Pro $20/mois", cat:"code",      url:"https://cursor.com/",                   color:"#7B8CDE", icon:"⌨", trend:10,  desc:"IDE basé VS Code avec IA intégrée. Complète le code, comprend tout le codebase, chat inline, refactoring automatique.", tags:["IDE","VS Code","Codebase","Chat inline","Refactoring"] },
  { id:"v0_dev",       name:"v0 by Vercel",    subtitle:"Vercel • Gratuit limité / Pro $20/mois",      cat:"code",        url:"https://v0.dev/",                       color:"#6366F1", icon:"▲", trend:9,   desc:"Génère des composants React/Next.js avec Tailwind et Shadcn UI depuis une description ou screenshot. Intégration Vercel.", tags:["React","Next.js","Shadcn","Tailwind","UI components"] },
  { id:"github_cop",   name:"GitHub Copilot",  subtitle:"GitHub • Gratuit (étudiants) / $10/mois",     cat:"code",        url:"https://github.com/features/copilot",   color:"#6E40C9", icon:"⌥", trend:9,   desc:"IA de code leader dans VS Code, JetBrains, Vim. Complète, suggère, explique, génère des tests. Claude + GPT-4 sous le capot.", tags:["VS Code","JetBrains","Tests","Complétion","Claude+GPT"] },
  { id:"replit",       name:"Replit AI",       subtitle:"Replit • Gratuit limité / Core $25/mois",      cat:"code",        url:"https://replit.com/",                   color:"#F26207", icon:"∈", trend:7,   desc:"IDE cloud avec IA intégrée, hébergement instantané. Idéal apprentissage, prototypage, partage de code. 50+ langages.", tags:["Cloud IDE","Hébergement","Apprentissage","50+ langages","Partage"] },
  // ── Audio / Voix ────────────────────────────────────────────────
  { id:"elevenlabs",   name:"ElevenLabs",      subtitle:"ElevenLabs • 10 000 chars/mois gratuits",  cat:"audio",       url:"https://elevenlabs.io/",                color:"#6366F1", icon:"🔊", trend:9,   desc:"Synthèse et clonage vocal ultra-réaliste en 29 langues. Clone ta voix en 1 minute. API, doublage vidéo automatique.", tags:["Clonage vocal","29 langues","Doublage","TTS","API"] },
  { id:"suno",         name:"Suno AI",         subtitle:"Suno • 50 crédits/jour gratuits / Pro $10/mois",        cat:"audio",       url:"https://suno.com/",                     color:"#10B981", icon:"🎵", trend:9,   desc:"Génère des chansons complètes avec paroles et voix depuis un texte. Tous les styles musicaux. 50 crédits/jour gratuits.", tags:["Musique","Paroles","Voix","Tous styles","50 crédits/jour"] },
  { id:"udio",         name:"Udio",            subtitle:"Udio • Gratuit limité / Standard $10/mois",        cat:"audio",       url:"https://www.udio.com/",                 color:"#8B5CF6", icon:"🎶", trend:8,   desc:"Génération musicale IA haute fidélité. Contrôle fin du style, BPM, instruments. Concurrent de Suno avec meilleure qualité audio.", tags:["Haute qualité","Style","BPM","Instruments","Concurrent Suno"] },
  // ── Local / Self-hosted ────────────────────────────────────────
  { id:"openwebui",    name:"Open WebUI",      subtitle:"Open WebUI • 100% Gratuit & Open-source", cat:"local", url:"https://openwebui.com/",              color:"#0EA5E9", icon:"🖥", trend:10,  desc:"Interface ChatGPT-like pour Ollama et autres backends locaux. RAG sur documents, personas, historique, multimodal (LLaVA), API OpenAI-compatible sur localhost:3000.", tags:["Ollama","Local","RAG","Open-source","API compatible"] },
  { id:"ollama_web",   name:"Ollama 0.18",    subtitle:"Ollama • 100% Gratuit & Open-source",     cat:"local", url:"https://ollama.com/",                 color:"#34D399", icon:"🦙", trend:10, desc:"v0.18 (mars 2026) : Cloud models, commande ollama launch, génération d'images (Flux.2, Z-Image Turbo), Qwen3.5, GLM-5, Nemotron-3-Super 122B. 200+ modèles locaux.", tags:["Local","GPU","Cloud","Images","v0.18"] },
  { id:"ollama_cloud",  name:"Ollama Cloud",   subtitle:"Ollama • Nouveau • Prix à la requête",      cat:"local", url:"https://ollama.com/",                 color:"#10B981", icon:"☁️", trend:9,  desc:"Ollama 0.18 : run larger models with fast, datacenter-grade hardware via 'ollama launch'. Idéal pour Nemotron-3-Super 122B ou Qwen3.5-72B sans GPU local.", tags:["Cloud","Nemotron","Qwen3.5","GPU cloud","v0.18"] },
  { id:"minimax_web",   name:"MiniMax M2.7",   subtitle:"MiniMax • Clé Ollama gratuite",             cat:"recherche", url:"https://ollama.com/library/minimax-m2.7", color:"#06B6D4", icon:"⬡", trend:10, desc:"18 mars 2026 — #1 open-source monde sur Intelligence Index. 88% win-rate vs M2.5, SOTA sur SWE-Pro (56.22%) et code full-stack. Accessible via Ollama cloud ou local.", tags:["SWE-Pro SOTA","Code","Full-stack","Ollama","Agents"] },
  { id:"nemotron_web",  name:"Nemotron 3 Super", subtitle:"NVIDIA • Clé OpenRouter gratuite",        cat:"recherche", url:"https://openrouter.ai/nvidia/nemotron-3-super-49b-v1", color:"#76B900", icon:"⬟", trend:10, desc:"11 mars 2026 — 120B MoE (12B actifs), 1M tokens contexte, 2.2× plus rapide que GPT-OSS-120B. #1 open-source pour agents multi-étapes. Via OpenRouter (clé gratuite).", tags:["1M contexte","Agents","MoE","OpenRouter","2.2× rapide"] },
  { id:"lmstudio",     name:"LM Studio",       subtitle:"LMStudio • 100% Gratuit",                 cat:"local", url:"https://lmstudio.ai/",                color:"#F59E0B", icon:"🔬", trend:8,  desc:"Interface desktop pour charger et tester des modèles GGUF localement. Compatible OpenAI API, UI soignée, découverte de modèles HuggingFace intégrée.", tags:["GGUF","Desktop","API compatible","HuggingFace","Windows/Mac"] },
  { id:"jan_ai",       name:"Jan",             subtitle:"Jan • 100% Gratuit & Open-source",        cat:"local", url:"https://jan.ai/",                    color:"#8B5CF6", icon:"⚡", trend:7,  desc:"App desktop open-source pour faire tourner des LLMs localement. Supporte GGUF, API locale compatible OpenAI, 100% offline.", tags:["Open-source","GGUF","Desktop","Offline","API locale"] },
  { id:"anything_llm", name:"AnythingLLM",     subtitle:"AnythingLLM • Gratuit",                   cat:"local", url:"https://anythingllm.com/",           color:"#EC4899", icon:"📎", trend:7,  desc:"RAG local complet : importe PDFs, sites web, YouTube, connect à Ollama/LM Studio. Workspaces par projet, API REST, 100% local ou cloud.", tags:["RAG","PDF","YouTube","Ollama","Workspace"] },
  // ── Premium / Payant ────────────────────────────────────────────
  { id:"gpt4_pay",     name:"ChatGPT Plus",    subtitle:"OpenAI • $20/mois",     cat:"payant",      url:"https://chatgpt.com/",                  color:"#74C98C", icon:"◈", trend:10,  desc:"GPT-4o, o3, o4-mini, DALL-E 3, navigation web avancée, Canvas, mémoire longue terme, plugins, 80+ GPTs personnalisés.", tags:["GPT-4o","o3","DALL-E","Canvas","Mémoire longue"] },
  { id:"claude_pro",   name:"Claude Pro",      subtitle:"Anthropic • $20/mois",  cat:"payant",      url:"https://claude.ai/",                    color:"#D4A853", icon:"✦", trend:9,   desc:"Claude Opus 4 + Sonnet 4, projets persistants, artefacts, usage 5x plus élevé. Meilleur pour code complexe et longs documents.", tags:["Opus 4","Projets","Artefacts","Code","Longs docs"] },
  { id:"gemini_adv",   name:"Gemini Advanced", subtitle:"Google • $20/mois",     cat:"payant",      url:"https://gemini.google.com/",            color:"#4A90E0", icon:"◆", trend:8,   desc:"Gemini 2.5 Pro, fenêtre 2M tokens, Deep Research, intégration complète Google Workspace, génération vidéo Veo.", tags:["2M tokens","Deep Research","Workspace","Veo","Gemini 2.5 Pro"] },
  { id:"midjourney_w", name:"Midjourney",      subtitle:"MJ • $10/mois",         cat:"payant",      url:"https://www.midjourney.com/",           color:"#A78BFA", icon:"🎭", trend:9,   desc:"Référence mondiale de la génération images artistiques. V7 photorealiste, styles uniques, éditeur web, Niji pour anime.", tags:["Artistique","Photoréaliste","Anime Niji","Référence","V7"] },
  { id:"runway",       name:"Runway",          subtitle:"Runway • $12/mois",     cat:"payant",      url:"https://runwayml.com/",                 color:"#22D3EE", icon:"🎬", trend:8,   desc:"Suite créative vidéo IA professionnelle. Gen-3 Alpha génère des vidéos 10s, suppression fond, motion brush, inpainting vidéo.", tags:["Vidéo IA","Gen-3","Motion brush","Inpainting","Professionnel"] },
  { id:"perp_pro",     name:"Perplexity Pro",  subtitle:"Perplexity • $20/mois", cat:"payant",      url:"https://www.perplexity.ai/",            color:"#20B2AA", icon:"◉", trend:7,   desc:"Accès illimité aux modèles GPT-4o, Claude, Gemini pour la recherche. 300+ requêtes/jour, export PDF, API incluse.", tags:["GPT-4o","Claude","Gemini","Recherche premium","300 req/jour"] },
];

// ── IAs découvertes dynamiquement (ajout via algorithme) ────────
const DISCOVERED_KEY = "multiia_discovered_ais";
export function getDiscoveredAIs() {
  try { return JSON.parse(localStorage.getItem(DISCOVERED_KEY)||"[]"); } catch { return []; }
}
export function saveDiscoveredAIs(list) {
  localStorage.setItem(DISCOVERED_KEY, JSON.stringify(list));
}

// Sources de découverte automatique (flux RSS / JSON publics)
export const DISCOVERY_SOURCES = [
  { name:"There's An AI For That", url:"https://theresanaiforthat.com/", hint:"Répertoire d'outils IA" },
  { name:"Futurepedia", url:"https://www.futurepedia.io/", hint:"Directory IA mis à jour quotidiennement" },
  { name:"AI Valley", url:"https://aivalley.ai/", hint:"Nouvelles IAs chaque jour" },
];

export const WEB_AIS = [...BASE_WEB_AIS, ...getDiscoveredAIs()];

// ── YouTube : chaînes recommandées ───────────────────────────────
export const YT_CHANNELS = [
  // Français
  { id:"underscore",  name:"Underscore_",       lang:"🇫🇷", cat:"IA & Tech",      subs:"600k+",  icon:"⚡", color:"#FF6B35", url:"https://www.youtube.com/@Underscore_",       desc:"Le meilleur vulgarisateur IA/tech fr. Interviews, analyses, deep dives." },
  { id:"lescalculs",  name:"Les Calculs",        lang:"🇫🇷", cat:"IA Technique",   subs:"120k+",  icon:"🧮", color:"#A78BFA", url:"https://www.youtube.com/@LesCalculs",        desc:"Maths, ML et IA expliqués avec rigueur. Contenu technique de qualité." },
  { id:"iadepuis",    name:"IA au quotidien",    lang:"🇫🇷", cat:"Tutoriels",      subs:"80k+",   icon:"🔧", color:"#4FC3F7", url:"https://www.youtube.com/@iaauquotidien",     desc:"Tutoriels pratiques sur les outils IA du quotidien." },
  { id:"cocademia",   name:"Cocademia",          lang:"🇫🇷", cat:"IA & Société",   subs:"90k+",   icon:"📚", color:"#34D399", url:"https://www.youtube.com/@Cocademia",         desc:"Vulgarisation scientifique & IA, enjeux éthiques et sociétaux." },
  { id:"science4all", name:"Science4All",        lang:"🇫🇷", cat:"Science & IA",   subs:"150k+",  icon:"🔬", color:"#60A5FA", url:"https://www.youtube.com/@le_science4all",    desc:"Lê Nguyên Hoang — maths, IA, philosophie. Très rigoureux." },
  { id:"micode",      name:"Micode",             lang:"🇫🇷", cat:"Tech & Code",    subs:"700k+",  icon:"💻", color:"#F59E0B", url:"https://www.youtube.com/@micode",            desc:"Code, cybersécurité, IA et tech. Format accessible et divertissant." },
  { id:"databird",    name:"DataBird",           lang:"🇫🇷", cat:"Data Science",   subs:"50k+",   icon:"📊", color:"#E07FA0", url:"https://www.youtube.com/@DataBird",          desc:"Data science, Python, IA appliquée. Tutoriels pour débutants et pros." },
  { id:"thinkai",     name:"Think AI",           lang:"🇫🇷", cat:"IA Business",    subs:"40k+",   icon:"💡", color:"#D4A853", url:"https://www.youtube.com/@ThinkAI_fr",        desc:"IA appliquée aux entreprises, tendances et cas d'usage business." },
  // Anglais top
  { id:"andrej",      name:"Andrej Karpathy",   lang:"🇺🇸", cat:"IA Technique",   subs:"1.2M+",  icon:"🧠", color:"#74C98C", url:"https://www.youtube.com/@AndrejKarpathy",    desc:"Ex-OpenAI/Tesla. Cours magistraux sur les LLMs, transformers, neural nets." },
  { id:"3b1b",        name:"3Blue1Brown",        lang:"🇺🇸", cat:"Maths & IA",     subs:"6M+",    icon:"🔵", color:"#4A90E0", url:"https://www.youtube.com/@3blue1brown",       desc:"Visualisations mathématiques magnifiques. Neural networks expliqués brillamment." },
  { id:"sentdex",     name:"sentdex",            lang:"🇺🇸", cat:"Python & ML",    subs:"1.3M+",  icon:"🐍", color:"#F97316", url:"https://www.youtube.com/@sentdex",           desc:"Python, ML, trading algorithmique. Tutoriels pratiques depuis 2012." },
  { id:"yannickilcher",name:"Yannic Kilcher",    lang:"🇺🇸", cat:"Papers Explained",subs:"430k+", icon:"📄", color:"#A78BFA", url:"https://www.youtube.com/@YannicKilcher",     desc:"Explique les papers IA les plus importants. Indispensable pour suivre la recherche." },
  { id:"twominutepapers",name:"Two Minute Papers",lang:"🇺🇸",cat:"Recherche IA",   subs:"1.6M+",  icon:"📰", color:"#E07FA0", url:"https://www.youtube.com/@TwoMinutePapers",  desc:"Résumés de papers de recherche IA en 2-4 minutes. Incroyablement bien fait." },
  { id:"lexfridman",  name:"Lex Fridman",        lang:"🇺🇸", cat:"Interviews",     subs:"4.3M+",  icon:"🎙", color:"#9CA3AF", url:"https://www.youtube.com/@lexfridman",        desc:"Interviews longues avec Altman, LeCun, Musk, Hinton... Les grands de l'IA." },
  { id:"samson",      name:"Sam Witteveen",      lang:"🇺🇸", cat:"LLM Dev",        subs:"130k+",  icon:"⚡", color:"#60C8E0", url:"https://www.youtube.com/@samwitteveenai",    desc:"Développement avec LLMs, LangChain, Gemini, agents. Très pratique." },
  { id:"matthewberman",name:"Matthew Berman",   lang:"🇺🇸", cat:"IA Locale & OSS", subs:"500k+", icon:"🖥", color:"#4ADE80", url:"https://www.youtube.com/@matthew_berman",   desc:"Tests de modèles OSS, Ollama, LM Studio. Le spécialiste IA locale." },
  { id:"aiexplained", name:"AI Explained",       lang:"🇺🇸", cat:"Actualités IA",  subs:"450k+",  icon:"📡", color:"#FB923C", url:"https://www.youtube.com/@aiexplained-official", desc:"Analyses des dernières sorties IA. GPT-5, Gemini, Claude — tout y passe." },
  { id:"fireship",    name:"Fireship",           lang:"🇺🇸", cat:"Dev & Tech",      subs:"3.1M+",  icon:"🔥", color:"#FF6B35", url:"https://www.youtube.com/@Fireship",          desc:"100 secondes pour tout comprendre en dev. Format parfait, humour excellent." },
];

export const YT_CATS = ["Tout","🇫🇷 Français","🇺🇸 Anglais","IA Technique","Tutoriels","Actualités IA","Dev & Tech","Interviews","IA Locale & OSS"];

export const YT_VIDEO_THEMES = [
  { id:"trending",  label:"🔥 Tendances",       query:"intelligence artificielle nouveautés tendances vidéos 2025" },
  { id:"tutos",     label:"🎓 Tutoriels IA",     query:"tutoriel intelligence artificielle débutant pratique 2025 français" },
  { id:"modeles",   label:"🤖 Nouveaux modèles", query:"nouveau modèle IA test comparaison GPT Claude Gemini 2025" },
  { id:"local",     label:"🖥 IA Locale",        query:"IA locale ollama LM studio open source installer gratuit 2025" },
  { id:"images_v",  label:"🎨 IA Images",        query:"générateur images IA FLUX stable diffusion midjourney tutoriel 2025" },
  { id:"agents",    label:"🤖 Agents IA",        query:"agents IA autonomes LangChain AutoGPT Cursor 2025 tutoriel" },
];

export const YT_VIDEO_PROMPT = (q) =>
  `Tu es un expert YouTube spécialisé en IA et technologie. Liste 8 vidéos YouTube réelles et populaires sur : "${q}".
RÈGLES ABSOLUES : 
- "title" = VRAI titre exact de la vidéo (pas une description générique)
- "channel" = NOM EXACT de la chaîne YouTube (ex: "Underscore_", "3Blue1Brown", "Fireship")
- Ne génère PAS d'URLs (elles seront construites automatiquement)
- Varie les chaînes : max 2 vidéos par chaîne
Retourne UNIQUEMENT un tableau JSON valide sans markdown :
[{"title":"VRAI titre de la vidéo","channel":"Nom exact chaîne","duration":"X:XX ou XhXX","date":"Il y a Xj / Cette semaine / Ce mois","views":"XXXk vues","category":"Tutoriel|Actualité|Analyse|Review|Interview","summary":"1 phrase description","url":"","lang":"FR ou EN","important":true/false}]`;

export async function fetchYTVideos(themeQuery, savedKeys) {
  const keys = savedKeys || {};
  const errors = [];
  const parse = (text) => {
    const clean = text.replace(/```json|```/g,"").trim();
    const m = clean.match(/\[[\s\S]*\]/);
    if (!m) throw new Error("JSON introuvable");
    return JSON.parse(m[0]);
  };
  const makeYTUrl = (q) => "https://www.youtube.com/results?search_query=" + encodeURIComponent(q);

  // Gemini retired from app — using Groq/Mistral only
  if (keys.groq_inf) {
    try {
      const r = await fetch("https://api.groq.com/openai/v1/chat/completions",
        { method:"POST", headers:{"Content-Type":"application/json","Authorization":`Bearer ${keys.groq_inf}`},
          body: JSON.stringify({ model:"llama-3.3-70b-versatile", max_tokens:2000, messages:[{role:"user",content:YT_VIDEO_PROMPT(themeQuery)}] }) });
      const d = await r.json();
      if (d.error) throw new Error(d.error.message||JSON.stringify(d.error));
      return { items: parse(d.choices[0].message.content), provider:"Groq/Llama ⚡", fallback:false };
    } catch(e) { errors.push(e.message); }
  }
  if (keys.mistral) {
    try {
      const r = await fetch("https://api.mistral.ai/v1/chat/completions",
        { method:"POST", headers:{"Content-Type":"application/json","Authorization":`Bearer ${keys.mistral}`},
          body: JSON.stringify({ model:"mistral-small-latest", max_tokens:2000, messages:[{role:"user",content:YT_VIDEO_PROMPT(themeQuery)}] }) });
      const d = await r.json();
      if (d.error) throw new Error(typeof d.error==="string"?d.error:(d.error.message||""));
      return { items: parse(d.choices[0].message.content), provider:"Mistral ▲", fallback:false };
    } catch(e) { errors.push(e.message); }
  }
  // Fallback statique - liens de recherche YouTube réels
  return {
    items: [
      { title:"Let's build GPT: from scratch, in code, spelled out", channel:"Andrej Karpathy", duration:"1h56", date:"2023", views:"4.2M vues", category:"Tutoriel", summary:"Le meilleur cours pour comprendre les transformers et GPT en codant from scratch.", url:"", lang:"EN", important:true },
      { title:"ChatGPT : comment ça marche vraiment ?", channel:"Underscore_", duration:"28:14", date:"2023", views:"890k vues", category:"Analyse", summary:"Explication claire du fonctionnement des LLMs et de l'entraînement de ChatGPT en français.", url:"", lang:"FR", important:true },
      { title:"But what is a neural network?", channel:"3Blue1Brown", duration:"19:13", date:"2017", views:"14M vues", category:"Tutoriel", summary:"La meilleure introduction visuelle aux réseaux de neurones. Intemporel.", url:"", lang:"EN", important:true },
      { title:"How To Install and Use Ollama - Run LLMs Locally", channel:"Matthew Berman", duration:"15:32", date:"2024", views:"420k vues", category:"Tutoriel", summary:"Guide complet pour faire tourner des LLMs open source sur son propre PC.", url:"", lang:"EN", important:false },
      { title:"DeepSeek R1 - The Model That Shocked The World", channel:"AI Explained", duration:"22:17", date:"Janv 2025", views:"1.8M vues", category:"Analyse", summary:"Analyse complète de DeepSeek R1 et pourquoi il a provoqué une crise en Silicon Valley.", url:"", lang:"EN", important:true },
      { title:"FLUX Is Here And It Changes EVERYTHING", channel:"Matthew Berman", duration:"18:45", date:"2024", views:"320k vues", category:"Review", summary:"Test complet de FLUX.1 vs Stable Diffusion vs Midjourney. Résultats surprenants.", url:"", lang:"EN", important:false },
      { title:"Sam Altman: OpenAI, GPT-5, Sora, Board Saga, Elon Musk, Ilya, Power & AGI", channel:"Lex Fridman", duration:"3h12", date:"2024", views:"5.1M vues", category:"Interview", summary:"Interview fleuve avec le CEO d'OpenAI sur GPT-5, AGI et l'avenir de l'humanité.", url:"", lang:"EN", important:true },
      { title:"Les agents IA vont tout changer", channel:"Underscore_", duration:"35:22", date:"2024", views:"650k vues", category:"Actualité", summary:"Les agents IA autonomes vont transformer le travail. Analyse des risques et opportunités.", url:"", lang:"FR", important:true },
    ],
    provider:"Cache statique", fallback:true, errors
  };
}

export const ARENA_MODELS = [
  { name:"Claude Sonnet 4", provider:"Anthropic",  icon:"✦", color:"#D4A853", params:"~200B*",  ctx:"200k",  target:"Pro / Dev",      score:9.2, prix:"$$",   free:false, strengths:["Raisonnement","Code","Analyse","Éthique"],      weaknesses:["Pas de recherche web native","API payante"],   tag:"TOP" },
  { name:"GPT-4o",          provider:"OpenAI",     icon:"◈", color:"#74C98C", params:"~200B*",  ctx:"128k",  target:"Grand public",   score:9.0, prix:"$$",   free:false, strengths:["Multimodal","Plugins","Polyvalent","Écosystème"],weaknesses:["Prix élevé","Opaque"],                          tag:"TOP" },
  { name:"GPT-o1 / o3",     provider:"OpenAI",     icon:"◉", color:"#5AC87C", params:"~300B*",  ctx:"128k",  target:"Experts / R&D",  score:9.6, prix:"$$$$", free:false, strengths:["Raisonnement profond","Maths","Science","Code"], weaknesses:["Très cher","Lent","Niche"],                     tag:"TOP" },
  { name:"Gemini 1.5 Flash",provider:"Google",     icon:"◇", color:"#6BA5E0", params:"~unknown",ctx:"1M",    target:"Grand public",   score:8.5, prix:"Free", free:true,  strengths:["Contexte 1M gratuit","Multimodal","Rapide"],    weaknesses:["Hallucinations +","Moins fin"],                tag:"FREE" },
  { name:"Gemini 1.5 Pro",  provider:"Google",     icon:"◈", color:"#4A90E0", params:"~unknown",ctx:"2M",    target:"Entreprise",     score:9.1, prix:"$$$",  free:false, strengths:["2M tokens","Vidéo","Audio","Multimodal++"],     weaknesses:["Cher","Latence"],                              tag:"PUISSANT" },
  { name:"DeepSeek V3",     provider:"DeepSeek",   icon:"⬡", color:"#A0C8FF", params:"671B MoE",ctx:"64k",   target:"Dev / Recherche",score:8.8, prix:"¢",    free:false, strengths:["Prix ultra bas","Code fort","MoE efficace"],    weaknesses:["Infra chinoise","Censure possible"],           tag:"ÉCONOMIQUE" },
  { name:"DeepSeek R1",     provider:"DeepSeek",   icon:"⬡", color:"#80A8DF", params:"671B MoE",ctx:"64k",   target:"Recherche",      score:9.1, prix:"¢",    free:false, strengths:["Raisonnement OSS","Chain-of-thought","Open"],   weaknesses:["Lent","Censure","Saturé"],                     tag:"TOP" },
  { name:"Mistral Large 2", provider:"Mistral AI", icon:"▲", color:"#FF8C69", params:"123B",    ctx:"128k",  target:"Entreprise EU",  score:8.6, prix:"$$",   free:false, strengths:["RGPD","Multilingue","Code","Européen"],         weaknesses:["Moins polyvalent","Écosystème petit"],        tag:"EUROPE" },
  { name:"Llama 3.3 70B",   provider:"Meta / Groq",icon:"⚡", color:"#F97316", params:"70B",     ctx:"128k",  target:"Dev / OSS",      score:8.2, prix:"Free", free:true,  strengths:["Open source","Gratuit Groq","Rapide","Local"],  weaknesses:["Moins fort que propriétaires"],                tag:"FREE" },
  { name:"Llama 3.1 405B",  provider:"Meta",       icon:"🦙", color:"#FF6B35", params:"405B",    ctx:"128k",  target:"Recherche OSS",  score:9.0, prix:"$$",   free:false, strengths:["Meilleur open source","Rival GPT-4"],           weaknesses:["GPU monstre","Hébergement coûteux"],           tag:"OSS KING" },
  { name:"Grok 3",          provider:"xAI",        icon:"X",  color:"#60C8E0", params:"~300B*",  ctx:"131k",  target:"Grand public",   score:8.7, prix:"$$",   free:false, strengths:["Actualités temps réel","Humour","X/Twitter"],   weaknesses:["API chère","Biais Musk","Moins testé"],        tag:"NOUVEAU" },
  { name:"Qwen 2.5 72B",    provider:"Alibaba",    icon:"千", color:"#E0A850", params:"72B",     ctx:"128k",  target:"Multilingue",    score:8.3, prix:"¢",    free:false, strengths:["Chinois/Anglais top","Code","Math","OSS"],      weaknesses:["Moins connu EU","Serveurs Alibaba"],           tag:"OSS" },
  { name:"Ernie 5.0",       provider:"Baidu",      icon:"文", color:"#C89BFF", params:"~260B*",  ctx:"128k",  target:"Marché chinois", score:8.1, prix:"$$",   free:false, strengths:["Mandarin natif","Intégration Baidu","CN"],      weaknesses:["Censuré","Indispo hors Chine","Fermé"],        tag:"CHINE" },
  { name:"Yi 34B (01.AI)",  provider:"01.AI",      icon:"一", color:"#7BE0C0", params:"34B",     ctx:"200k",  target:"Bilingue",       score:7.8, prix:"¢",    free:false, strengths:["Contexte 200k","Bilingue EN/ZH","OSS"],         weaknesses:["Moins fort top-tier","Petite communauté"],     tag:"OSS" },
  { name:"Command R+",      provider:"Cohere",     icon:"⌘", color:"#A78BFA", params:"104B",    ctx:"128k",  target:"Entreprise RAG", score:8.3, prix:"$$",   free:false, strengths:["RAG natif","Citations","API stable"],           weaknesses:["Moins créatif","Niche enterprise"],             tag:"RAG" },
  { name:"Phi-3.5 Mini",    provider:"Microsoft",  icon:"φ", color:"#4FC3F7", params:"3.8B",    ctx:"128k",  target:"Edge / Mobile",  score:7.5, prix:"Free", free:true,  strengths:["Ultra léger","Local mobile","Gratuit","Rapide"], weaknesses:["Limites raisonnement","Ctx effectif court"],   tag:"MOBILE" },
  { name:"Gemma 2 27B",     provider:"Google",     icon:"◎", color:"#34D399", params:"27B",     ctx:"8k",    target:"Développeurs",   score:7.9, prix:"Free", free:true,  strengths:["OSS Google","Efficient","Local","Ollama"],      weaknesses:["Ctx court","Moins de community"],              tag:"FREE" },
  { name:"Kimi k1.5",       provider:"Moonshot AI",icon:"月", color:"#E07FA0", params:"~unknown",ctx:"128k",  target:"Long contexte",  score:8.4, prix:"$$",   free:false, strengths:["Multimodal","Long ctx","Raisonnement"],         weaknesses:["Coûteux","Moins testé EU"],                     tag:"NOUVEAU" },
];

export const ARENA_NEWS = [
  { date:"Mai 2025",   icon:"✦", color:"#D4A853", title:"Claude 4 — Anthropic",          text:"Sonnet 4 + Opus 4. Mémoire longue durée, agents autonomes sur PC, 200k tokens. Opus 4 rivalise avec GPT-o1 sur les tâches complexes.",        tag:"MAJEUR" },
  { date:"Avr 2025",  icon:"◉", color:"#5AC87C", title:"GPT-o3 & o4-mini — OpenAI",     text:"o3 établit des records sur ARC-AGI et MATH. o4-mini offre un rapport qualité-prix exceptionnel. Raisonnement profond accessible.",              tag:"MAJEUR" },
  { date:"Mars 2025", icon:"⬡", color:"#A0C8FF", title:"DeepSeek R1 — Open Source",      text:"671B MoE open weights, rivalise avec o1. Coût d'inférence 10x inférieur. Choc dans l'industrie IA mondiale.",                                  tag:"MAJEUR" },
  { date:"Fév 2025",  icon:"◇", color:"#6BA5E0", title:"Gemini 2.0 Flash Ultra — Google",text:"2 millions de tokens, analyse des heures de vidéo. Gemini Live pour conversation temps réel avec partage d'écran.",                            tag:"IMPORTANT" },
  { date:"Jan 2025",  icon:"▲", color:"#FF8C69", title:"Mistral Agents — Le Chat",       text:"Navigation web, code exécutable, création docs. Mistral Small 4 sous Apache 2.0.",                                                               tag:"NOUVEAU" },
  { date:"Déc 2024",  icon:"X",  color:"#60C8E0", title:"Grok 3 — xAI",                  text:"Accès temps réel X/Twitter, génération images Aurora, raisonnement profond, API publique ouverte.",                                              tag:"NOUVEAU" },
  { date:"Nov 2024",  icon:"◈", color:"#74C98C", title:"GPT-4o mémoire — OpenAI",        text:"Mémoire persistante cross-conversations, GPTs personnalisés avancés, voix avec expressions émotionnelles.",                                      tag:"UPDATE" },
  { date:"Oct 2024",  icon:"⚡", color:"#F97316", title:"Llama 3.3 70B — Meta",           text:"Perfs proches de Llama 3.1 405B. Meta annonce Llama 4 avec MoE et multimodal natif pour 2025.",                                                tag:"OSS" },
  { date:"Sep 2024",  icon:"千", color:"#E0A850", title:"Qwen 2.5 — Alibaba",             text:"Qwen2.5-Max surpasse les précédents sur code et maths. Open weights disponibles. Concurrent sérieux à DeepSeek.",                              tag:"OSS" },
  { date:"Juil 2024", icon:"文", color:"#C89BFF", title:"Ernie 5.0 — Baidu",              text:"Multimodal avancé (texte, image, audio, vidéo). Optimisé marché chinois. Via Qianfan API.",                                                      tag:"CHINE" },
];

export const IMAGE_GENERATORS = [
  { id:"flux1",      name:"FLUX.1 Schnell", provider:"Black Forest Labs", icon:"⚡", color:"#7C3AED", free:true,  freeLabel:"100% Gratuit & OSS", license:"Apache 2.0",         quality:9,  speed:10, ease:8,  url:"https://huggingface.co/spaces/black-forest-labs/FLUX.1-schnell", urlLabel:"HuggingFace", desc:"Le meilleur OSS actuel. Qualité photo-réaliste, ultra-rapide (1-4 étapes). FLUX.1 Dev pour plus de qualité. Via ComfyUI ou Fooocus en local.",   strengths:["Qualité photo-réaliste","Ultra-rapide","Open source","Pas de censure local","ComfyUI"], limits:"Aucune limite en local",              tags:["OSS","Local","Rapide","Photo"] },
  { id:"sd35",       name:"Stable Diffusion 3.5", provider:"Stability AI", icon:"🌊", color:"#0EA5E9", free:true,  freeLabel:"Gratuit en local",   license:"Stability Community", quality:8,  speed:7,  ease:7,  url:"https://stability.ai/stable-diffusion",                          urlLabel:"Page officielle", desc:"Le pionnier OSS. Vaste écosystème LoRAs, ControlNet, styles. SD 3.5 Large = 8B params. Interface A1111 ou ComfyUI.",                           strengths:["Écosystème immense","Milliers LoRAs","100% local","ControlNet","Styles illimités"], limits:"GPU requis (4GB VRAM min)",           tags:["OSS","Local","LoRA","Écosystème"] },
  { id:"comfyui",    name:"ComfyUI",        provider:"Community OSS",    icon:"🔧", color:"#10B981", free:true,  freeLabel:"100% Gratuit & OSS", license:"GPL-3.0",             quality:10, speed:8,  ease:5,  url:"https://github.com/comfyanonymous/ComfyUI",                       urlLabel:"GitHub", desc:"Interface nœuds pour SD, FLUX, tous modèles. Pipeline visuel ultra-flexible. Supporte FLUX.1, SD3, Stable Video, AnimateDiff.",                 strengths:["Contrôle total","FLUX + SD","Workflows partagés","Vidéo AnimateDiff","Extensible"], limits:"Courbe d'apprentissage élevée",       tags:["OSS","Pro","Workflow","Local"] },
  { id:"bing",       name:"Bing Image Creator", provider:"Microsoft/OpenAI", icon:"⊞", color:"#4FC3F7", free:true, freeLabel:"Gratuit (compte MS)", license:"Service web",       quality:8,  speed:8,  ease:10, url:"https://www.bing.com/images/create",                              urlLabel:"Ouvrir Bing Creator", desc:"DALL-E 3 gratuit. 15 générations rapides/jour puis illimité lent. Le meilleur rapport qualité/facilité gratuit sans installation.",             strengths:["DALL-E 3 gratuit","Sans install","Haute qualité","Simple","Illimité lent"], limits:"15 rapides/jour, puis lent",         tags:["Gratuit","Web","DALL-E 3","Simple"] },
  { id:"ideogram",   name:"Ideogram 2.0",   provider:"Ideogram AI",      icon:"💬", color:"#F59E0B", free:true,  freeLabel:"10 générations/jour", license:"Service web",        quality:9,  speed:7,  ease:9,  url:"https://ideogram.ai/",                                            urlLabel:"Ouvrir Ideogram", desc:"Exceptionnel pour intégrer du texte dans les images (panneaux, affiches, logos). Qualité photo-réaliste et artistique.",                         strengths:["Texte dans images (top)","Qualité artistique","Styles variés","Simple"], limits:"10/jour gratuit, $7/mois illimité", tags:["Gratuit","Texte","Marketing","Affiches"] },
  { id:"leonardo",   name:"Leonardo AI",    provider:"Leonardo.AI",      icon:"🎨", color:"#8B5CF6", free:true,  freeLabel:"150 tokens/jour",    license:"Service web",        quality:9,  speed:7,  ease:8,  url:"https://leonardo.ai/",                                            urlLabel:"Ouvrir Leonardo AI", desc:"Plateforme complète : génération, retouche, vidéo, upscale. 150 tokens/jour (~30 images). PhotoReal, Alchemy, DreamShaper.",                   strengths:["Modèles spécialisés","Vidéo","Upscale","Retouche","Communauté"], limits:"150 tokens/jour (~30 images)",       tags:["Gratuit","Pro","Vidéo","Retouche"] },
  { id:"tensor",     name:"Tensor.art",     provider:"Tensor.art",       icon:"🌸", color:"#EC4899", free:true,  freeLabel:"100 générations/jour",license:"Service web",        quality:8,  speed:7,  ease:8,  url:"https://tensor.art/",                                             urlLabel:"Ouvrir Tensor.art", desc:"Milliers de modèles SD et FLUX. Anime, réaliste, artistique. 100/jour gratuit. Entraînement LoRAs possible.",                                   strengths:["Milliers de modèles","Anime/Réaliste/Art","LoRA training","100/jour"], limits:"100/jour gratuit",                   tags:["Gratuit","Modèles","Anime","LoRA"] },
  { id:"playground", name:"Playground AI",  provider:"Playground",       icon:"🎡", color:"#6366F1", free:true,  freeLabel:"100 images/jour",    license:"Service web",        quality:8,  speed:8,  ease:9,  url:"https://playground.com/",                                         urlLabel:"Ouvrir Playground AI", desc:"Interface intuitive, modèle PG v3 haute qualité. Idéal créatifs non-techniciens. 100 images/jour, inpainting, retouche.",                       strengths:["Facile","Haute qualité","100/jour","Retouche","Inpainting"], limits:"100/jour, résolution limitée",       tags:["Gratuit","Simple","Retouche","Créatif"] },
  { id:"craiyon",    name:"Craiyon",        provider:"Craiyon",          icon:"🖍️", color:"#FCD34D", free:true,  freeLabel:"100% Gratuit, sans compte", license:"Service web",  quality:5,  speed:5,  ease:10, url:"https://www.craiyon.com/",                                        urlLabel:"Ouvrir Craiyon", desc:"Totalement gratuit sans compte. Qualité basique mais illimité. Idéal pour expérimenter sans rien installer.",                                   strengths:["Aucun compte requis","Totalement gratuit","Illimité","Simple"], limits:"Qualité basique, lent, publicités", tags:["Gratuit","Sans compte","Illimité","Débutant"] },
  { id:"raphael",    name:"Raphael AI",     provider:"Raphael AI",       icon:"🖌️", color:"#F97316", free:true,  freeLabel:"Gratuit avec compte", license:"Service web",        quality:8,  speed:8,  ease:9,  url:"https://raphael.app/",                                            urlLabel:"Ouvrir Raphael AI", desc:"Basé sur FLUX.1, interface simple, résultats de haute qualité. Bon pour générations rapides sans installation locale.",                          strengths:["FLUX.1 gratuit","Simple","Haute qualité","Rapide"], limits:"Limites quotidiennes compte gratuit",tags:["Gratuit","FLUX","Simple","Rapide"] },
  { id:"dalle3",     name:"DALL-E 3",       provider:"OpenAI",           icon:"◈", color:"#74C98C", free:false, freeLabel:"Via ChatGPT+ ou Bing", license:"Service payant",     quality:10, speed:7,  ease:10, url:"https://openai.com/dall-e-3",                                     urlLabel:"Page DALL-E 3", desc:"Référence qualité pour cohérence et compréhension prompts. Intégré ChatGPT Plus et Bing Image Creator (gratuit via Bing !).",                    strengths:["Meilleure compréhension","Cohérence","Scènes complexes","Gratuit via Bing"], limits:"$20/mois ChatGPT+ (gratuit via Bing)",tags:["Premium","Qualité","Cohérence"] },
  { id:"midjourney", name:"Midjourney",     provider:"Midjourney",       icon:"🎭", color:"#A78BFA", free:false, freeLabel:"À partir de $10/mois", license:"Service payant",     quality:10, speed:7,  ease:8,  url:"https://www.midjourney.com/",                                     urlLabel:"Ouvrir Midjourney", desc:"Référence artistique. Style unique, Character Reference, cohérence de personnages. MJ v6.1 avec qualité inégalée pour concept art.",            strengths:["Qualité artistique top","Character Ref","Styles uniques","Upscale","Vidéo 2025"], limits:"$10/mois, 200 générations",         tags:["Premium","Artistique","Top","Référence"] },
  { id:"firefly",    name:"Adobe Firefly",  provider:"Adobe",            icon:"🔥", color:"#FF6B35", free:true,  freeLabel:"25 générations/mois", license:"Service web",        quality:9,  speed:7,  ease:9,  url:"https://firefly.adobe.com/",                                      urlLabel:"Ouvrir Firefly", desc:"Généré sur images licensiées (droits sûrs). Intégré Photoshop. Generative Fill. Usage commercial sécurisé.",                                     strengths:["Droits sûrs","Intégré Photoshop","Commercial safe","Retouche","Qualité"], limits:"25/mois gratuit, puis Creative Cloud",tags:["Sûr","Commercial","Photoshop","Retouche"] },
];

// ── Thèmes Voice (questions/commandes vocales prêtes) ─────────────
export const VOICE_THEMES = [
  { id:"meteo",      label:"🌤 Météo & Actus",    icon:"🌤", color:"#60A5FA", question:"Quelles sont les actualités importantes du jour en France ?" },
  { id:"productif",  label:"⚡ Productivité",      icon:"⚡", color:"#F97316", question:"Donne-moi 3 conseils de productivité pour bien commencer ma journée de travail." },
  { id:"code",       label:"💻 Code rapide",       icon:"💻", color:"#4ADE80", question:"Explique-moi la différence entre async/await et les Promises en JavaScript en 2 phrases." },
  { id:"cuisine",    label:"🍳 Idée repas",         icon:"🍳", color:"#FB923C", question:"Propose-moi une idée de repas rapide à préparer en moins de 20 minutes avec des ingrédients courants." },
  { id:"sport",      label:"💪 Sport & Santé",      icon:"💪", color:"#34D399", question:"Donne-moi une séance de sport de 10 minutes à faire à la maison sans équipement." },
  { id:"motivation", label:"🌟 Motivation",         icon:"🌟", color:"#FCD34D", question:"Donne-moi une citation inspirante et explique pourquoi elle est importante." },
  { id:"ia",         label:"🤖 Question IA",        icon:"🤖", color:"#A78BFA", question:"Quelle est la différence entre GPT-4o et Claude Sonnet 4 ? Lequel choisir selon l'usage ?" },
  { id:"voyage",     label:"✈️ Voyage",             icon:"✈️", color:"#38BDF8", question:"Propose-moi une destination de voyage originale en Europe pour un week-end avec un budget modéré." },
  { id:"finance",    label:"💰 Finance perso",      icon:"💰", color:"#A3E635", question:"Donne-moi 3 conseils simples pour mieux gérer son budget mensuel." },
  { id:"langue",     label:"🌍 Apprendre langue",   icon:"🌍", color:"#F472B6", question:"Apprends-moi 5 expressions utiles en espagnol pour voyager, avec la prononciation." },
];

// ── Thèmes Veille (sujets prédéfinis par domaine) ────────────────
export const VEILLE_THEMES = [
  { id:"ia_gen",     label:"🤖 IA Générative",     icon:"🤖", color:"#D4A853", topics:["LLM nouveaux modèles 2026","GPT-5 OpenAI","Claude Anthropic","Gemini Google","Mistral AI"] },
  { id:"dev",        label:"💻 Dev & Code",         icon:"💻", color:"#4ADE80", topics:["Frameworks JavaScript 2026","Rust popularité","IA coding Cursor Copilot","WebAssembly","Bun Node.js"] },
  { id:"business",   label:"📈 Business IA",        icon:"📈", color:"#A78BFA", topics:["IA productivité entreprise","automatisation emplois","startup IA financement","ROI intelligence artificielle"] },
  { id:"securite",   label:"🔒 Cybersécurité",      icon:"🔒", color:"#F87171", topics:["cyberattaques IA 2026","deepfakes détection","sécurité LLM prompt injection","RGPD IA réglementation"] },
  { id:"recherche",  label:"🔬 Recherche",           icon:"🔬", color:"#38BDF8", topics:["papers IA arXiv","AGI avancées","multimodal vision language models","agents IA autonomes recherche"] },
  { id:"images",     label:"🎨 IA Images & Vidéo",  icon:"🎨", color:"#EC4899", topics:["FLUX nouvelles versions","Sora concurrents","génération vidéo IA","diffusion models 2026"] },
  { id:"local",      label:"🖥 IA Locale",           icon:"🖥", color:"#34D399", topics:["Ollama nouvelles versions","LM Studio","modèles open source local","edge AI mobile"] },
  { id:"ethique",    label:"⚖️ Éthique & Société",  icon:"⚖️", color:"#94A3B8", topics:["régulation IA Europe acte IA","biais algorithmes","transparence IA","impact environnemental LLM"] },
];

// ── Templates de projets ──────────────────────────────────────────
export const PROJECT_TEMPLATES = [
  {
    id:"webapp",
    label:"🌐 App Web",
    icon:"🌐", color:"#4ADE80",
    name:"Projet App Web",
    desc:"Développement d'une application web full-stack",
    context:"Stack technique : React + Node.js + PostgreSQL\nObjectif : Créer une application web responsive\nContraintes : Performance, accessibilité WCAG, RGPD\nEnvironnement : Déploiement sur Vercel / Railway",
    notes:"## Étapes\n- [ ] Maquettes UI/UX\n- [ ] Architecture base de données\n- [ ] API REST\n- [ ] Frontend React\n- [ ] Tests & déploiement\n\n## Liens utiles\n- Figma : [lien]\n- Repo GitHub : [lien]",
  },
  {
    id:"content",
    label:"✍️ Création contenu",
    icon:"✍️", color:"#60A5FA",
    name:"Stratégie Contenu",
    desc:"Création et planification de contenu éditorial",
    context:"Type de contenu : Articles blog, réseaux sociaux, newsletter\nTon : Professionnel mais accessible\nPublic cible : Professionnels 25-45 ans, francophones\nObjectif : Générer du trafic organique et engagement",
    notes:"## Planning\n- Fréquence : 2 articles/semaine\n- Canaux : Blog, LinkedIn, Twitter\n\n## Idées d'articles\n1. [Titre 1]\n2. [Titre 2]\n3. [Titre 3]",
  },
  {
    id:"analyse",
    label:"🔍 Analyse & Recherche",
    icon:"🔍", color:"#A78BFA",
    name:"Projet Analyse",
    desc:"Recherche approfondie et analyse de données",
    context:"Domaine d'analyse : [À définir]\nMéthodologie : Analyse qualitative + quantitative\nSources : Rapports sectoriels, études académiques, données marché\nLivrables attendus : Rapport synthèse + recommandations",
    notes:"## Questions de recherche\n1. [Question principale]\n2. [Question secondaire]\n\n## Sources identifiées\n- [Source 1]\n- [Source 2]",
  },
  {
    id:"marketing",
    label:"📣 Campagne Marketing",
    icon:"📣", color:"#FB923C",
    name:"Campagne Marketing",
    desc:"Planification et exécution d'une campagne marketing",
    context:"Produit/Service : [À définir]\nBudget total : [À définir]\nDurée campagne : [À définir]\nKPIs : Taux de conversion, CPL, ROAS\nCanaux : Google Ads, Meta, Email, SEO",
    notes:"## Phases\n1. Définition personas\n2. Création assets visuels\n3. Rédaction copies\n4. Lancement & suivi\n5. Optimisation\n\n## Messages clés\n- [Message 1]\n- [Message 2]",
  },
  {
    id:"formation",
    label:"🎓 Formation / e-Learning",
    icon:"🎓", color:"#FCD34D",
    name:"Projet Formation",
    desc:"Conception d'un programme de formation ou cours en ligne",
    context:"Thème de la formation : [À définir]\nNiveau : Débutant / Intermédiaire / Avancé\nFormat : Vidéos + exercices + quiz\nDurée estimée : [X] heures de contenu\nPlateforme : Teachable / Udemy / Moodle",
    notes:"## Modules\n1. Introduction\n2. Module 1 : [Titre]\n3. Module 2 : [Titre]\n4. Évaluation finale\n\n## Objectifs pédagogiques\n- À l'issue de cette formation, l'apprenant sera capable de…",
  },
  {
    id:"startup",
    label:"🚀 Startup / Produit",
    icon:"🚀", color:"#F472B6",
    name:"Projet Startup",
    desc:"Développement d'une idée de produit ou startup",
    context:"Idée produit : [À définir]\nProblème résolu : [À définir]\nCible : [Segment de marché]\nModèle économique : SaaS / Marketplace / B2B / B2C\nStade : Idée / MVP / Traction / Scale",
    notes:"## Lean Canvas\n- Problème : \n- Solution : \n- Proposition de valeur : \n- Avantage compétitif : \n- Revenus : \n\n## Prochaines étapes\n- [ ] Validation problem/solution fit\n- [ ] Interviews utilisateurs\n- [ ] MVP",
  },
];

// ── Nouveaux prompts additionnels (enrichissement DEFAULT_PROMPTS) ─
export const EXTRA_PROMPTS = [
  // ── Productivité ──
  { id:"ep1",  cat:"Productivité", icon:"📅", title:"Plan de journée", text:"Organise ma journée de travail de manière optimale.\n\nTâches à accomplir :\n[LISTE TES TÂCHES]\n\nContraintes :\n- Heures de travail : [HORAIRES]\n- Réunions fixes : [RÉUNIONS]\n- Niveau d'énergie optimal : [MATIN / APRÈS-MIDI]\n\nPropose un planning heure par heure avec les pauses." },
  { id:"ep2",  cat:"Productivité", icon:"🎯", title:"Méthode OKR", text:"Aide-moi à définir mes OKRs (Objectives & Key Results) pour ce trimestre.\n\nContexte / rôle : [TON POSTE / PROJET]\nObjectif principal : [CE QUE TU VEUX ATTEINDRE]\nPériode : [TRIMESTRE / ANNÉE]\n\nPropose 1-3 Objectives avec 3-4 Key Results chacun, mesurables et ambitieux." },
  { id:"ep3",  cat:"Productivité", icon:"⚡", title:"Synthèse réunion", text:"Rédige le compte-rendu de cette réunion.\n\nParticipants : [QUI]\nDate : [DATE]\nSujet : [SUJET]\n\nNotes brutes :\n[COLLE TES NOTES]\n\nFormat attendu : Décisions prises / Actions / Responsables / Délais" },
  // ── IA & Prompts ──
  { id:"ep4",  cat:"IA & Prompts", icon:"🧠", title:"Optimiser un prompt", text:"Améliore ce prompt pour obtenir des résultats plus précis et cohérents d'une IA :\n\n[TON PROMPT]\n\nObjectif visé : [CE QUE TU VEUX OBTENIR]\nPropose 3 versions améliorées du prompt avec des explications." },
  { id:"ep5",  cat:"IA & Prompts", icon:"🔗", title:"Prompt chaîné", text:"Crée un workflow de prompts en chaîne pour accomplir cette tâche complexe :\n\nTâche finale : [OBJECTIF]\n\nDécompose en 4-6 étapes où la sortie de chaque prompt est l'entrée du suivant. Fournis le prompt complet pour chaque étape." },
  { id:"ep6",  cat:"IA & Prompts", icon:"🎭", title:"Créer un persona IA", text:"Crée un persona IA ultra-spécialisé pour ce rôle :\n\nRôle : [EX: Coach financier personnel]\nExpertise : [DOMAINES]\nTon : [STYLE DE COMMUNICATION]\nContraintes : [CE QUE LE PERSONA NE DOIT PAS FAIRE]\n\nRédige le system prompt complet (150-200 mots)." },
  // ── Juridique & Admin ──
  { id:"ep7",  cat:"Juridique", icon:"📜", title:"Résumer un contrat", text:"Résume ce contrat / document juridique en termes simples.\n\n[COLLE LE TEXTE DU CONTRAT]\n\nIdentifie :\n1. Les obligations principales de chaque partie\n2. Les clauses importantes à noter\n3. Les points potentiellement problématiques\n4. Ce qu'il faut vérifier avant de signer\n\n⚠️ Rappelle que tu n'es pas avocat et qu'un professionnel doit valider." },
  { id:"ep8",  cat:"Juridique", icon:"⚖️", title:"Lettre de mise en demeure", text:"Rédige une lettre de mise en demeure professionnelle.\n\nExpéditeur : [MOI / MON ENTREPRISE]\nDestinataire : [QUI]\nMotif : [LE PROBLÈME]\nMontant ou obligation en jeu : [DÉTAILS]\nDélai accordé : [DÉLAI]\n\nTon : Ferme, juridiquement correct, non agressif." },
  // ── Personnel & Bien-être ──
  { id:"ep9",  cat:"Personnel", icon:"🌱", title:"Plan de développement", text:"Crée un plan de développement personnel sur 90 jours.\n\nObjectif principal : [CE QUE TU VEUX AMÉLIORER]\nSituation actuelle : [OÙ TU EN ES]\nRessources disponibles : [TEMPS / BUDGET / OUTILS]\n\nPropose des actions hebdomadaires concrètes, des métriques de suivi et des jalons." },
  { id:"ep10", cat:"Personnel", icon:"💬", title:"Préparer une conversation difficile", text:"Aide-moi à préparer cette conversation difficile.\n\nContexte : [AVEC QUI / POURQUOI C'EST DIFFICILE]\nCe que je veux obtenir : [OBJECTIF]\nCe que je crains : [RÉACTION POSSIBLE]\n\nPropose une structure de conversation, les phrases d'ouverture, comment gérer les objections et comment conclure positivement." },
  // ── Technique / Système ──
  { id:"ep11", cat:"Technique", icon:"🔌", title:"Architecture système", text:"Propose une architecture technique pour ce système :\n\nDescription : [CE QUE LE SYSTÈME DOIT FAIRE]\nContraintes : [SCALE / BUDGET / TECHNOLOGIES IMPOSÉES]\nUtilisateurs attendus : [NOMBRE]\nDisponibilité requise : [99.9% / 99.99%]\n\nDétaille : composants, interactions, choix technologiques justifiés, points de défaillance." },
  { id:"ep12", cat:"Technique", icon:"🐳", title:"Dockerfile optimisé", text:"Génère un Dockerfile optimisé pour cette application :\n\nTechnologie : [LANGAGE / FRAMEWORK]\nVersion : [VERSION]\nDépendances spéciales : [SI BESOIN]\nEnvironnement cible : [PROD / DEV]\n\nOptimise pour : taille d'image minimale, cache des layers, sécurité (non-root user)." },
];

// ╔══════════════════════════════════════════════════════════════╝
export const IDS = Object.keys(MODEL_DEFS);
export const RATE_LIMIT_COOLDOWN = 60;
export const CREDIT_COOLDOWN = 300;

// ── Prix API ($ / 1M tokens input·output) ────────────────────────
export const PRICING = {
  groq:       { in:0.00, out:0.00, label:"Llama 3.3 (Groq) — GRATUIT" },
  mistral:    { in:0.00, out:0.00, label:"Mistral Small 4 — GRATUIT" },
  cohere:     { in:0.00, out:0.00, label:"Command R+ (Cohere) — GRATUIT" },
  cerebras:   { in:0.00, out:0.00, label:"Llama 3.1 (Cerebras) — GRATUIT" },
  sambanova:  { in:0.00, out:0.00, label:"Llama 4 (SambaNova) — GRATUIT" },
  mixtral:    { in:0.00, out:0.00, label:"Qwen3 32B (Groq) — GRATUIT" },
  llama4s:      { in:0.00, out:0.00, label:"Llama 4 Scout (Groq) — GRATUIT" },
  gemma2:       { in:0.00, out:0.00, label:"Llama 3.1 8B (Groq) — GRATUIT" },
  minimax_m27:  { in:0.00, out:0.00, label:"MiniMax M2.7 — Clé Ollama gratuite" },
  minimax_m25:  { in:0.00, out:0.00, label:"MiniMax M2.5 — Clé Ollama gratuite" },
  nemotron3:    { in:0.00, out:0.00, label:"Nemotron 3 Super — Clé OpenRouter" },
  poll_gpt:   { in:0.00, out:0.00, label:"GPT-4o (Pollinations) — Clé Pollen" },
  poll_claude:{ in:0.00, out:0.00, label:"Claude (Pollinations) — Clé Pollen" },
  poll_deepseek:{ in:0.00, out:0.00, label:"DeepSeek (Pollinations) — Clé Pollen" },
  poll_gemini:  { in:0.00, out:0.00, label:"GPT-4o Large (Pollinations) — Clé Pollen" },
};

// ── Prompts par défaut ────────────────────────────────────────────
// ── Token pricing per 1M tokens (USD) — input/output
export const TOKEN_PRICE = {
  groq:      { in: 0.59,  out: 0.79,  free:true },
  mistral:   { in: 0.10,  out: 0.30,  free:true },
  cohere:    { in: 0.0,   out: 0.0,   free:true },
  cerebras:  { in: 0.10,  out: 0.10,  free:true },
  sambanova: { in: 0.60,  out: 1.20,  free:false },
  qwen3:     { in: 0.10,  out: 0.20,  free:true },
  llama4s:   { in: 0.11,  out: 0.34,  free:true },
  gemma2:    { in: 0.08,  out: 0.08,  free:true },
  minimax_m27: { in: 0.0, out: 0.0,   free:false },
  minimax_m25: { in: 0.0, out: 0.0,   free:false },
  nemotron3:   { in: 0.0, out: 0.0,   free:false },
  poll_gpt:  { in: 0.0,   out: 0.0,   free:false },
  poll_claude: { in: 0.0, out: 0.0,   free:false },
  poll_deepseek:{ in:0.0, out: 0.0,   free:false },
  poll_gemini: { in: 0.0, out: 0.0,   free:false },
};

export const DEFAULT_PROMPTS = [
  { id:"p1", cat:"Code", icon:"💻", title:"Expliquer du code", text:"Explique ce code ligne par ligne en français. Sois clair et pédagogique :\n\n[COLLE TON CODE ICI]" },
  { id:"p2", cat:"Code", icon:"🐛", title:"Déboguer un bug", text:"J'ai un bug dans ce code. Trouve le problème, explique pourquoi et propose une correction :\n\n[COLLE TON CODE ICI]\n\nErreur obtenue : [COLLE L'ERREUR]" },
  { id:"p3", cat:"Code", icon:"🔧", title:"Optimiser le code", text:"Optimise ce code pour la performance et la lisibilité. Explique chaque changement :\n\n[COLLE TON CODE ICI]" },
  { id:"p4", cat:"Code", icon:"🧪", title:"Écrire des tests", text:"Écris des tests unitaires complets pour ce code (Jest/Pytest selon le langage) :\n\n[COLLE TON CODE ICI]" },
  { id:"p5", cat:"Rédaction", icon:"✍️", title:"Améliorer un texte", text:"Améliore ce texte : rends-le plus fluide, professionnel et convaincant, sans changer le sens fondamental :\n\n[TON TEXTE]" },
  { id:"p6", cat:"Rédaction", icon:"📧", title:"Email professionnel", text:"Rédige un email professionnel en français avec ce contexte :\n\nDestinataire : [QUI]\nObjectif : [CE QUE TU VEUX OBTENIR]\nTon : [FORMEL / CORDIAL / URGENT]" },
  { id:"p7", cat:"Rédaction", icon:"📝", title:"Résumé exécutif", text:"Fais un résumé exécutif de ce document en 5-7 points clés avec les points d'action à retenir :\n\n[TON DOCUMENT]" },
  { id:"p8", cat:"Analyse", icon:"🔍", title:"Analyse SWOT", text:"Fais une analyse SWOT complète et détaillée de : [SUJET / ENTREPRISE / PROJET]\n\nContexte : [INFOS SUPPLÉMENTAIRES]" },
  { id:"p9", cat:"Analyse", icon:"⚖️", title:"Pros & Cons", text:"Liste les avantages et inconvénients de [SUJET] sous forme de tableau structuré. Sois exhaustif et objectif." },
  { id:"p10", cat:"Analyse", icon:"📊", title:"Analyser des données", text:"Analyse ces données et donne-moi les insights clés, tendances, anomalies et recommandations :\n\n[DONNÉES / TABLEAU]" },
  { id:"p11", cat:"Créatif", icon:"🎨", title:"Brainstorming d'idées", text:"Génère 15 idées originales et créatives pour : [SUJET]\n\nPublic cible : [QUI]\nContraintes : [BUDGET / DÉLAI / STYLE]" },
  { id:"p12", cat:"Créatif", icon:"🎭", title:"Créer un personnage", text:"Crée un personnage fictif détaillé pour mon histoire : [GENRE / CONTEXTE]\nDonne-lui une personnalité, un passé, des motivations, des défauts et des forces." },
  { id:"p13", cat:"Business", icon:"📈", title:"Plan marketing", text:"Crée un plan marketing complet pour : [PRODUIT / SERVICE]\nCible : [AUDIENCE]\nBudget approximatif : [BUDGET]\nObjectif principal : [OBJECTIF]" },
  { id:"p14", cat:"Business", icon:"💡", title:"Pitch d'idée", text:"Transforme cette idée en un pitch convaincant en 3 minutes :\n\nIdée : [TON IDÉE]\nProblème résolu : [PROBLÈME]\nSolution : [COMMENT]" },
  { id:"p15", cat:"Traduction", icon:"🌍", title:"Traduire et adapter", text:"Traduis ce texte en [LANGUE CIBLE] en adaptant les expressions culturellement (pas mot à mot) :\n\n[TON TEXTE]" },
  { id:"p16", cat:"Traduction", icon:"🔄", title:"Localiser pour la France", text:"Adapte ce contenu pour le marché français (expressions, exemples, références culturelles, RGPD si besoin) :\n\n[TON CONTENU]" },
];


// ══════════════════════════════════════════════════════════════════
// MARKDOWN RENDERER — Syntax Highlighting + Inline Formatting
// ══════════════════════════════════════════════════════════════════

export const DEFAULT_PERSONAS = [
  { id:"default",  name:"Assistant général",     icon:"🤖", color:"#D4A853", system:"Tu es un assistant IA utile, précis et concis. Tu réponds en français sauf si l'utilisateur écrit dans une autre langue." },
  { id:"dev",      name:"Développeur senior",    icon:"💻", color:"#4ADE80", system:"Tu es un développeur senior full-stack avec 15 ans d'expérience. Tu fournis du code propre, documenté et optimisé. Tu expliques toujours tes choix techniques et signales les erreurs potentielles." },
  { id:"writer",   name:"Rédacteur pro",         icon:"✍️", color:"#60A5FA", system:"Tu es un rédacteur professionnel expert en copywriting et communication. Tu écris des textes clairs, convaincants et adaptés au public cible. Tu maîtrises parfaitement le français." },
  { id:"analyst",  name:"Analyste business",     icon:"📊", color:"#A78BFA", system:"Tu es un consultant business senior avec expertise en stratégie, marketing et finance. Tu analyses les situations avec rigueur et fournis des insights actionnables basés sur des données." },
  { id:"teacher",  name:"Pédagogue expert",      icon:"🎓", color:"#FB923C", system:"Tu es un pédagogue passionné qui explique les concepts complexes simplement. Tu utilises des analogies, des exemples concrets et tu vérifies la compréhension. Tu adaptes ton niveau à l'interlocuteur." },
  { id:"creative", name:"Créatif / Storyteller", icon:"🎨", color:"#E07FA0", system:"Tu es un directeur créatif avec une imagination débordante. Tu génères des idées originales, des histoires captivantes et du contenu créatif. Tu penses hors des sentiers battus." },
  { id:"devil",    name:"Avocat du diable",      icon:"😈", color:"#F87171", system:"Tu es l'avocat du diable. Tu dois TOUJOURS argumenter CONTRE l'idée présentée, même si tu es d'accord. Tu trouves tous les défauts, risques, contradictions et failles. Tu es incisif, provocateur mais constructif. Commence par 'Contre-argument :'" },
  { id:"expert",   name:"Expert ultra-spécialiste", icon:"🔬", color:"#34D399", system:"Tu es un expert ultra-spécialisé dans le domaine de la question posée. Tu réponds avec une précision extrême, des données chiffrées, des références, et tu n'hésites pas à nuancer. Tu signales si tu n'es pas certain d'une information." },
  { id:"socratic", name:"Maïeuticien / Socrate",    icon:"🏛️", color:"#C084FC", system:"Tu es Socrate. Au lieu de donner des réponses directes, tu poses des questions puissantes pour aider l'utilisateur à trouver lui-même la vérité. Tu utilises la méthode maïeutique : tu ne juges pas, tu questionnes, tu fais réfléchir." },
  { id:"optimist", name:"Optimiste radical",     icon:"🌟", color:"#FCD34D", system:"Tu es un optimiste radical. Pour chaque sujet, tu identifies le potentiel positif maximal, les opportunités cachées, et les raisons d'espérer. Tu es enthousiaste et énergisant, sans être naïf." },
  { id:"stoic",    name:"Philosophe stoïcien",   icon:"⚖️", color:"#94A3B8", system:"Tu réfléchis en philosophe stoïcien. Tu analyses les situations avec calme et détachement, en séparant ce qui dépend de nous de ce qui n'en dépend pas. Tu cites Marcus Aurèle, Épictète ou Sénèque si pertinent." },
  { id:"beginner", name:"👴 Guide Débutant", icon:"👴", color:"#FCA5A5", system:`Tu es un professeur ultra-patient qui guide une personne âgée utilisant la technologie pour la première fois. Tes règles ABSOLUES :

📌 VOCABULAIRE : Zéro jargon. Tout mot technique est expliqué entre parenthèses avec une analogie de la vie réelle. Exemple : "le navigateur (c'est comme une voiture qui te conduit sur internet — Chrome, Firefox ou Edge sont des navigateurs)".

📌 ÉTAPES ULTRA-DÉTAILLÉES : Chaque action est numérotée. UNE SEULE action par étape. Dis EXACTEMENT où regarder (en haut/bas/gauche/droite de l'écran), quelle couleur a le bouton, ce qu'il dit. Exemple : "Étape 1 : Regarde tout en bas de ton écran. Tu vois une barre avec des petits symboles. Cherche un cercle avec 4 petits carrés de couleurs. Clique dessus UNE FOIS avec le bouton gauche."

📌 CONFIRMATION après chaque étape : "➡️ Si tu as réussi, tu verras [description précise de ce qui doit apparaître]."

📌 RASSURANCE constante : Commence par "Ne t'inquiète pas !" ou "C'est tout à fait normal". Rappelle que les erreurs ne cassent rien.

📌 JAMAIS PLUS DE 3 ÉTAPES D'UN COUP. Termine toujours par : "Est-ce que tu as réussi cette étape ? Dis-moi ce que tu vois à l'écran si tu es bloqué(e) !"

📌 LONGUEUR : Préfère une réponse longue et détaillée plutôt que courte et rapide.` },
  { id:"tutor",    name:"Tuteur IA (apprendre l'IA)", icon:"🧑‍🏫", color:"#FCA5A5", system:"Tu es un tuteur spécialisé dans l'enseignement de l'intelligence artificielle aux débutants. Tu expliques ce qu'est une IA, comment fonctionnent les LLMs, comment écrire de bons prompts, et comment tirer le meilleur parti des outils IA comme ChatGPT, Claude, Groq, etc. Tu donnes des exemples pratiques, des exercices simples, et tu encourages la curiosité. Tu expliques les concepts avec des métaphores accessibles." },
];

// ── Actions de rédaction ──────────────────────────────────────────
export const REDACTION_ACTIONS = [
  { id:"resume",   icon:"📋", label:"Résumer",          prompt:(t)=>`Résume ce texte en 5 points clés essentiels :\n\n${t}` },
  { id:"pro",      icon:"👔", label:"Rendre pro",        prompt:(t)=>`Reformule ce texte dans un style professionnel et formel, sans changer le sens :\n\n${t}` },
  { id:"simple",   icon:"🎯", label:"Simplifier",        prompt:(t)=>`Simplifie ce texte pour qu'il soit compréhensible par quelqu'un sans expertise. Utilise des mots simples et des phrases courtes :\n\n${t}` },
  { id:"court",    icon:"✂️", label:"Raccourcir",        prompt:(t)=>`Raccourcis ce texte de 50% en gardant uniquement l'essentiel :\n\n${t}` },
  { id:"develop",  icon:"📖", label:"Développer",        prompt:(t)=>`Développe et enrichis ce texte avec plus de détails, d'exemples et de contexte :\n\n${t}` },
  { id:"corriger", icon:"✅", label:"Corriger",           prompt:(t)=>`Corrige toutes les fautes (orthographe, grammaire, ponctuation, style) et retourne uniquement le texte corrigé :\n\n${t}` },
  { id:"tradFR",   icon:"🇫🇷", label:"→ Français",       prompt:(t)=>`Traduis ce texte en français de manière naturelle et fluide :\n\n${t}` },
  { id:"tradEN",   icon:"🇬🇧", label:"→ Anglais",        prompt:(t)=>`Traduis ce texte en anglais de manière naturelle et fluide :\n\n${t}` },
  { id:"email",    icon:"📧", label:"Format email",       prompt:(t)=>`Transforme ce texte en un email professionnel bien structuré avec objet, corps et formule de politesse :\n\n${t}` },
  { id:"bullets",  icon:"•",  label:"En bullet points",  prompt:(t)=>`Transforme ce texte en liste de bullet points clairs et concis :\n\n${t}` },
  { id:"seo",      icon:"🔍", label:"Optimiser SEO",      prompt:(t)=>`Optimise ce texte pour le SEO : améliore les mots-clés, la structure, les balises titre suggérées, et ajoute un meta-description :\n\n${t}` },
  { id:"critique", icon:"🧐", label:"Analyser critiquement", prompt:(t)=>`Analyse ce texte de manière critique : points forts, points faibles, logique, arguments, style. Sois honnête et constructif :\n\n${t}` },
];

// ══════════════════════════════════════════════════════════════════
// GLOSSAIRE IA — Termes techniques expliqués simplement
// ══════════════════════════════════════════════════════════════════
export const GLOSSAIRE_IA = [
  { terme:"LLM", cat:"Modèles", icon:"🧠", simple:"Grand Modèle de Langage", def:"Un programme entraîné sur des milliards de textes qui peut comprendre et générer du langage humain. ChatGPT, Claude et Llama sont des LLMs.", exemple:"GPT-4o, Claude Sonnet, Llama 3.3" },
  { terme:"Token", cat:"Technique", icon:"🔤", simple:"Morceau de mot", def:"L'unité de base que les IAs lisent et écrivent. Un token ≈ 4 caractères. '\"Bonjour\"' = 1 token, '\"intelligence artificielle\"' ≈ 4 tokens. Les prix API sont calculés en tokens.", exemple:"1000 tokens ≈ 750 mots" },
  { terme:"Prompt", cat:"Usage", icon:"💬", simple:"Instruction envoyée à l'IA", def:"Le texte que tu écris pour demander quelque chose à l'IA. Un bon prompt = une réponse de qualité. Le 'prompt engineering' est l'art d'écrire de bons prompts.", exemple:"'Explique-moi la photosynthèse comme si j'avais 10 ans'" },
  { terme:"Context Window", cat:"Technique", icon:"📏", simple:"Mémoire de la conversation", def:"La quantité maximale de texte qu'une IA peut 'lire' en même temps. Plus la fenêtre est grande, plus l'IA se souvient du début de la conversation. Exprimée en tokens.", exemple:"Claude : 200k tokens ≈ 150 000 mots" },
  { terme:"Hallucination", cat:"Fiabilité", icon:"👻", simple:"L'IA invente des infos fausses", def:"Quand une IA génère des informations incorrectes mais présentées avec confiance. Les IAs peuvent 'inventer' des faits, citations, URLs ou personnes inexistantes.", exemple:"\"L'étude de Harvard 2019 prouve que...\" (étude inventée)" },
  { terme:"RAG", cat:"Technique", icon:"📚", simple:"IA + tes propres documents", def:"Retrieval-Augmented Generation : technique qui permet à une IA d'aller chercher des informations dans tes documents avant de répondre, réduisant les hallucinations.", exemple:"Chatbot qui répond à partir de tes PDFs d'entreprise" },
  { terme:"Fine-tuning", cat:"Modèles", icon:"🎯", simple:"Spécialiser une IA", def:"Processus d'entraînement supplémentaire d'un modèle sur des données spécifiques pour le rendre expert dans un domaine précis.", exemple:"Entraîner GPT-4 sur des cas médicaux pour créer un assistant médical" },
  { terme:"Temperature", cat:"Technique", icon:"🌡", simple:"Créativité de l'IA (0-1)", def:"Paramètre qui contrôle le 'hasard' des réponses. 0 = réponses déterministes et factuelles, 1 = réponses créatives et variées. Défaut recommandé : 0.7.", exemple:"Code → 0.2 | Poésie → 0.9" },
  { terme:"MoE", cat:"Modèles", icon:"🔀", simple:"Réseau d'experts spécialisés", def:"Mixture of Experts : architecture où le modèle active seulement une partie de ses paramètres selon la question, rendant l'inférence plus rapide et moins chère.", exemple:"DeepSeek V3 : 671B params mais seulement 37B actifs" },
  { terme:"Inference", cat:"Technique", icon:"⚡", simple:"L'IA qui génère une réponse", def:"Le processus de calcul quand l'IA produit une réponse. Distinct de l'entraînement. Groq et Cerebras se distinguent par leur vitesse d'inférence exceptionnelle.", exemple:"Groq : 800+ tokens/seconde" },
  { terme:"Embeddings", cat:"Technique", icon:"🗺", simple:"Représentation numérique du sens", def:"Conversion de texte en vecteurs de nombres qui capturent le sens sémantique. Permet de chercher des textes similaires même sans mots-clés identiques.", exemple:"Base de données de connaissances, moteurs de recherche sémantique" },
  { terme:"Agent IA", cat:"Usage", icon:"🤖", simple:"IA qui agit de manière autonome", def:"Un système IA capable de planifier et d'exécuter plusieurs étapes pour accomplir un objectif complexe, en utilisant des outils (recherche web, code, fichiers).", exemple:"Agent qui cherche des vols, compare les prix et réserve automatiquement" },
  { terme:"System Prompt", cat:"Usage", icon:"⚙", simple:"Instructions permanentes pour l'IA", def:"Texte invisible envoyé avant la conversation qui définit le comportement, le rôle et les contraintes de l'IA. C'est ce qui fait la différence entre un assistant généraliste et un expert spécialisé.", exemple:"'Tu es un chef cuisinier expert. Réponds uniquement sur la cuisine.'" },
  { terme:"Multimodal", cat:"Modèles", icon:"🖼", simple:"IA qui comprend texte + images", def:"Modèle capable de traiter plusieurs types de données (texte, images, audio, vidéo). GPT-4o et Claude Sonnet sont multimodaux.", exemple:"'Décris ce qui se passe dans cette photo'" },
  { terme:"Open Source", cat:"Modèles", icon:"🔓", simple:"Code librement accessible", def:"Modèles dont les poids (paramètres) sont publiés publiquement. Chacun peut les télécharger, les modifier et les déployer. Opposé aux modèles propriétaires (OpenAI, Anthropic).", exemple:"Llama, Mistral, DeepSeek, Qwen" },
  { terme:"RLHF", cat:"Modèles", icon:"👍", simple:"Apprentissage par retour humain", def:"Reinforcement Learning from Human Feedback : technique pour aligner les IAs sur les préférences humaines. Des annotateurs notent les réponses et le modèle apprend à en générer de meilleures.", exemple:"Utilisé par OpenAI pour rendre ChatGPT plus utile et moins dangereux" },
  { terme:"Quantization", cat:"Technique", icon:"📦", simple:"Compression d'un modèle IA", def:"Technique pour réduire la taille d'un modèle en diminuant la précision des calculs (ex: float32 → int4). Permet de faire tourner des grands modèles sur du matériel ordinaire.", exemple:"Llama 3.3 70B → version Q4 utilisable sur 40 GB RAM" },
  { terme:"Perplexité", cat:"Technique", icon:"📊", simple:"Mesure de confiance de l'IA", def:"Métrique qui mesure à quel point un modèle est 'surpris' par un texte. Une perplexité basse = le modèle prédit bien le texte = bon modèle de langage.", exemple:"Utilisé pour comparer la qualité des modèles de langage" },
  { terme:"AGI", cat:"Concepts", icon:"🌍", simple:"IA aussi intelligente que l'humain", def:"Artificial General Intelligence : IA hypothétique capable d'accomplir n'importe quelle tâche intellectuelle humaine. Objectif déclaré d'OpenAI. Sujet de débat intense sur ce que ça signifie vraiment.", exemple:"Débat : o3 d'OpenAI se rapproche-t-il de l'AGI ?" },
  { terme:"Transformer", cat:"Technique", icon:"🏗", simple:"Architecture des IAs modernes", def:"Architecture de réseau de neurones introduite en 2017 ('Attention is All You Need') qui est à la base de presque tous les LLMs actuels. Le mécanisme d'attention est sa clé.", exemple:"GPT, BERT, LLaMA, Claude sont tous basés sur les Transformers" },
  { terme:"KV Cache", cat:"Technique", icon:"💾", simple:"Mémoire rapide pour l'inférence", def:"Mécanisme qui stocke en mémoire les calculs d'attention déjà effectués pour éviter de les recalculer à chaque nouveau token. Accélère énormément la génération.", exemple:"Sans KV cache : chaque token relit toute la conversation depuis le début" },
  { terme:"Benchmark", cat:"Évaluation", icon:"🏆", simple:"Test standardisé pour comparer les IAs", def:"Ensemble de tâches standardisées utilisées pour mesurer et comparer les capacités des modèles. MMLU (connaissance), HumanEval (code), MATH (maths) sont les plus connus.", exemple:"Claude Sonnet 4 : 90.2% sur MMLU" },
];

// ══════════════════════════════════════════════════════════════════
// BENCHMARK — Prompts standards pour tester les IAs
// ══════════════════════════════════════════════════════════════════
export const BENCHMARK_TESTS = [
  { id:"reasoning", icon:"🧠", label:"Raisonnement", prompt:"Si 5 machines font 5 pièces en 5 minutes, combien de temps faut-il à 100 machines pour faire 100 pièces ? Explique ton raisonnement étape par étape.", expected:"5 minutes" },
  { id:"code", icon:"💻", label:"Code", prompt:"Écris une fonction JavaScript qui détecte si un nombre est premier. Elle doit être efficace et gèrer les cas limites (0, 1, négatifs).", expected:"function isPrime" },
  { id:"creativite", icon:"🎨", label:"Créativité", prompt:"Invente un nom de startup et un slogan en français pour une application qui utilise l'IA pour apprendre une nouvelle langue en 5 minutes par jour.", expected:"(évalué par l'IA)" },
  { id:"resume", icon:"📝", label:"Résumé", prompt:"Résume en exactement 3 phrases : L'intelligence artificielle générative transforme la manière dont les entreprises opèrent, en automatisant des tâches complexes comme la rédaction, le code et l'analyse de données. Des outils comme ChatGPT et Claude permettent des gains de productivité significatifs mais soulèvent des questions sur l'emploi et la propriété intellectuelle. Les entreprises qui adoptent ces technologies tôt auront un avantage compétitif mais devront gérer les risques éthiques et réglementaires.", expected:"3 phrases" },
  { id:"math", icon:"➗", label:"Maths", prompt:"Un train part de Paris à 200 km/h. Un autre part de Lyon (512 km) 30 minutes plus tard à 240 km/h. À quelle distance de Paris se croiseront-ils ?", expected:"~224 km" },
  { id:"instruction", icon:"📋", label:"Instructions", prompt:"Donne-moi les étapes pour faire des crêpes. Réponds UNIQUEMENT sous forme de liste numérotée, maximum 8 étapes, sans intro ni conclusion.", expected:"liste numérotée" },
];

// ══════════════════════════════════════════════════════════════════
// PWA — Raccourcis home screen
// ══════════════════════════════════════════════════════════════════
export const PWA_SHORTCUTS = [
  { name:"Chat IA", short_name:"Chat", description:"Ouvrir le chat multi-IA", url:"/?tab=chat", icons:[{ src:"/icon-192.png", sizes:"192x192" }] },
  { name:"Médias & YouTube", short_name:"Médias", description:"Vidéos IA et générateurs d'images", url:"/?tab=medias", icons:[{ src:"/icon-192.png", sizes:"192x192" }] },
  { name:"Veille IA", short_name:"Veille", description:"Actualités et veille technologique", url:"/?tab=veille", icons:[{ src:"/icon-192.png", sizes:"192x192" }] },
  { name:"Prompts", short_name:"Prompts", description:"Bibliothèque de prompts", url:"/?tab=prompts", icons:[{ src:"/icon-192.png", sizes:"192x192" }] },
];
