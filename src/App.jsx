import React, { useState, useRef, useEffect } from "react";

// ╔══════════════════════════════════════════════════════════════╗
// ║  SECTION CONFIG — Seule partie à modifier lors d'une MAJ    ║
// ╚══════════════════════════════════════════════════════════════╝
const APP_VERSION = "16.9";
const BUILD_DATE = new Date().toISOString().slice(0,10);

const MODEL_DEFS = {
  // ── IAs 100% gratuites ────────────────────────────────────────────
  groq:       { name:"Llama 3.3 (Groq)",   short:"Groq",      provider:"Groq / Meta",   color:"#F97316", bg:"#180C04", border:"#3D1A00", icon:"⚡", apiType:"compat", maxTokens:128000, free:true, keyName:"groq_inf",   keyLink:"https://console.groq.com/keys",             desc:"GRATUIT 14 400/jour",   baseUrl:"https://api.groq.com/openai/v1",              model:"llama-3.3-70b-versatile" },
  mistral:    { name:"Mistral Small 3",     short:"Mistral",   provider:"Mistral AI",    color:"#FF8C69", bg:"#180E08", border:"#3D1E0A", icon:"▲", apiType:"compat", maxTokens:32000,  free:true, keyName:"mistral",    keyLink:"https://console.mistral.ai/",               desc:"Tier gratuit dispo",    baseUrl:"https://api.mistral.ai/v1",                   model:"mistral-small-latest" },
  cohere:     { name:"Command R+ (Cohere)",   short:"Cohere",    provider:"Cohere",         color:"#39D353", bg:"#081A0E", border:"#0A3D1A", icon:"⌘", apiType:"cohere",  maxTokens:128000, free:true, keyName:"cohere",     keyLink:"https://dashboard.cohere.com/api-keys",     desc:"Gratuit — 1000 req/mois" },
  cerebras:   { name:"Llama 3.1 (Cerebras)",short:"Cerebras",  provider:"Cerebras",      color:"#A78BFA", bg:"#0E0818", border:"#201040", icon:"◉", apiType:"compat", maxTokens:128000, free:true, keyName:"cerebras",   keyLink:"https://cloud.cerebras.ai/",                desc:"Gratuit — 8B ultra rapide", baseUrl:"https://api.cerebras.ai/v1",                  model:"llama3.1-8b" },
  sambanova:  { name:"Llama 3.3 (SambaNova)", short:"Samba",     provider:"SambaNova",     color:"#34D399", bg:"#08180E", border:"#0A3D20", icon:"∞", apiType:"compat", maxTokens:32000,  free:true, keyName:"sambanova",  keyLink:"https://cloud.sambanova.ai/",               desc:"Gratuit — Llama 3.3 70B",     baseUrl:"https://api.sambanova.ai/v1",                 model:"Meta-Llama-3.3-70B-Instruct" },
  qwen3:      { name:"Qwen3 32B (Groq)",    short:"Qwen3",   provider:"Groq / Qwen", color:"#C084FC", bg:"#120818", border:"#2E0A3D", icon:"◈", apiType:"compat", maxTokens:32768,  free:true, keyName:"groq_inf",   keyLink:"https://console.groq.com/keys",             desc:"Gratuit — même clé Groq",    baseUrl:"https://api.groq.com/openai/v1",           model:"qwen/qwen3-32b" },
  // ── Via Pollinations.AI (SANS CLÉ) ──────────────────────────────
  llama4s:    { name:"Llama 4 Scout (Groq)",   short:"L4 Scout", provider:"Groq / Meta",    color:"#FF6B35", bg:"#180A04", border:"#3D1500", icon:"🦙", apiType:"compat", maxTokens:128000, free:true, keyName:"groq_inf",  keyLink:"https://console.groq.com/keys",   desc:"GRATUIT — Llama 4 Scout 17B multimodal", baseUrl:"https://api.groq.com/openai/v1", model:"meta-llama/llama-4-scout-17b-16e-instruct" },
  gemma2:     { name:"Llama 3.1 8B (Groq)",     short:"L3.1-8B",  provider:"Groq / Meta",    color:"#34D399", bg:"#08180E", border:"#0A3D20", icon:"◎", apiType:"compat", maxTokens:131072, free:true, keyName:"groq_inf",  keyLink:"https://console.groq.com/keys",   desc:"GRATUIT — même clé Groq, très rapide", baseUrl:"https://api.groq.com/openai/v1", model:"llama-3.1-8b-instant" },
  poll_gpt:      { name:"GPT-4o (Pollinations)",    short:"GPT-4o",    provider:"OpenAI via Pollinations",   color:"#74C98C", bg:"#081A0E", border:"#0A3D1E", icon:"◈", apiType:"pollinations",      maxTokens:128000, free:true,  keyName:null,          keyLink:"https://text.pollinations.ai", desc:"SANS CLÉ — modèle openai uniquement · legacy endpoint", model:"openai" },
  poll_claude:   { name:"Claude (Pollinations)",     short:"Claude✦",  provider:"Anthropic via Pollinations", color:"#D4A853", bg:"#1A1408", border:"#3D3000", icon:"✦", apiType:"pollinations_paid", maxTokens:128000, free:false, keyName:"pollen",      keyLink:"https://enter.pollinations.ai",  desc:"Clé Pollen gratuite · enter.pollinations.ai (Seed tier)", model:"claude-airforce" },
  poll_deepseek: { name:"DeepSeek (Pollinations)",   short:"DeepSeek", provider:"DeepSeek via Pollinations", color:"#A0C8FF", bg:"#080E1A", border:"#0A1A3D", icon:"⬡", apiType:"pollinations_paid", maxTokens:128000, free:false, keyName:"pollen",      keyLink:"https://enter.pollinations.ai",  desc:"Clé Pollen gratuite · enter.pollinations.ai (Seed tier)", model:"deepseek" },
  poll_gemini:   { name:"GPT-4o Large (Pollinations)", short:"GPT-4o L", provider:"OpenAI via Pollinations",   color:"#6BA5E0", bg:"#080E18", border:"#0A1A3D", icon:"◇", apiType:"pollinations",      maxTokens:128000, free:true,  keyName:null,          keyLink:"https://text.pollinations.ai",   desc:"SANS CLÉ — openai-large (GPT-4o Large)", model:"openai-large" },
};

// ── Liste de base des IAs Web ───────────────────────────────────
const BASE_WEB_AIS = [
  // ── Chatbots généraux gratuits ──────────────────────────────────
  { id:"chatgpt",      name:"ChatGPT",         subtitle:"OpenAI • Gratuit",      cat:"gratuit", url:"https://chatgpt.com/",                    color:"#74C98C", icon:"◈", desc:"GPT-4o gratuit via interface web" },
  { id:"claude_web",   name:"Claude.ai",       subtitle:"Anthropic • Gratuit",   cat:"gratuit", url:"https://claude.ai/",                      color:"#D4A853", icon:"✦", desc:"Claude Sonnet 4 gratuit" },
  { id:"gemini_web",   name:"Gemini",          subtitle:"Google • Gratuit",      cat:"gratuit", url:"https://gemini.google.com/",              color:"#6BA5E0", icon:"◇", desc:"Gemini 2.5 Flash gratuit, multimodal" },
  { id:"copilot",      name:"Copilot",         subtitle:"Microsoft • Gratuit",   cat:"gratuit", url:"https://copilot.microsoft.com/",          color:"#4FC3F7", icon:"⊞", desc:"GPT-4o via Microsoft, 100% gratuit" },
  { id:"mistral_web",  name:"Le Chat",         subtitle:"Mistral • Gratuit",     cat:"gratuit", url:"https://chat.mistral.ai/",                color:"#FF8C69", icon:"▲", desc:"Mistral Large gratuit" },
  { id:"deepseek_web", name:"DeepSeek",        subtitle:"DeepSeek • Gratuit",    cat:"gratuit", url:"https://chat.deepseek.com/",              color:"#A0C8FF", icon:"⬡", desc:"DeepSeek V3/R1 — très puissant en raisonnement" },
  { id:"grok_web",     name:"Grok",            subtitle:"xAI • Gratuit limité",  cat:"gratuit", url:"https://grok.com/",                       color:"#60C8E0", icon:"𝕏", desc:"Grok 3 avec accès temps réel X" },
  { id:"kimi_web",     name:"Kimi",            subtitle:"Moonshot • Gratuit",    cat:"gratuit", url:"https://www.kimi.com/",                   color:"#E07FA0", icon:"月", desc:"Contexte 1M tokens gratuit" },
  { id:"qwen_web",     name:"Qwen Chat",       subtitle:"Alibaba • Gratuit",     cat:"gratuit", url:"https://chat.qwen.ai/",                   color:"#E0A850", icon:"千", desc:"Qwen3 gratuit, fort en code et raisonnement" },
  { id:"llama_meta",   name:"Meta AI",         subtitle:"Meta • Gratuit",        cat:"gratuit", url:"https://www.meta.ai/",                    color:"#1877F2", icon:"⬟", desc:"Llama 4 Maverick gratuit via Meta" },
  { id:"zai",          name:"Z.ai",            subtitle:"z.ai • Gratuit",         cat:"gratuit", url:"https://chat.z.ai/",                      color:"#B07FE0", icon:"Ζ",  desc:"Modèles ultra-puissants : Z1 et accès à GPT-4o, Claude, Gemini gratuits" },
  { id:"t3chat",       name:"T3 Chat",          subtitle:"T3 • Gratuit",           cat:"gratuit", url:"https://t3.chat/",                        color:"#A855F7", icon:"T",  desc:"Interface rapide et épurée, accès Llama, Gemini gratuit" },
  { id:"cerebras_w",   name:"Cerebras Chat",    subtitle:"Cerebras • Gratuit",     cat:"gratuit", url:"https://inference.cerebras.ai/",          color:"#FF6B35", icon:"◉", desc:"Llama 3.1 à vitesse extrême — 2000 tokens/s" },
  { id:"sambanova_w",  name:"SambaNova Chat",   subtitle:"SambaNova • Gratuit",    cat:"gratuit", url:"https://cloud.sambanova.ai/",             color:"#E0A850", icon:"∞", desc:"Llama 4 et Qwen très rapides, gratuit" },
  // ── Recherche & spécialisés gratuits ────────────────────────────
  { id:"perplexity",   name:"Perplexity",      subtitle:"Perplexity • Gratuit",  cat:"recherche",url:"https://www.perplexity.ai/",            color:"#20B2AA", icon:"◎", desc:"Recherche IA avec sources en temps réel" },
  { id:"you",          name:"You.com",         subtitle:"You.com • Gratuit",     cat:"recherche",url:"https://you.com/",                      color:"#6366F1", icon:"Y", desc:"IA + recherche web intégrée" },
  { id:"phind",        name:"Phind",           subtitle:"Phind • Gratuit",       cat:"recherche",url:"https://www.phind.com/",                color:"#8B5CF6", icon:"φ", desc:"Moteur IA spécialisé code & dev" },
  { id:"andi",         name:"Andi Search",     subtitle:"Andi • Gratuit",        cat:"recherche",url:"https://andisearch.com/",               color:"#10B981", icon:"∂", desc:"Recherche IA conversationnelle sans pub" },
  // ── Multi-modèles / Playground ──────────────────────────────────
  { id:"hf",           name:"HuggingFace Chat",subtitle:"HuggingFace • Gratuit", cat:"multimodele",url:"https://huggingface.co/chat/",       color:"#FFD21E", icon:"🤗", desc:"50+ modèles open-source: Llama, Mistral, Gemma..." },
  { id:"poe",          name:"Poe",             subtitle:"Quora • Gratuit",       cat:"multimodele",url:"https://poe.com/",                   color:"#9CA3AF", icon:"P",  desc:"Claude, GPT-4, Llama, tous en un" },
  { id:"groq_web",     name:"Groq Playground", subtitle:"Groq • Gratuit",        cat:"multimodele",url:"https://console.groq.com/playground",color:"#F97316", icon:"⚡", desc:"Llama ultra rapide — test de modèles" },
  { id:"openrouter_w", name:"OpenRouter Chat",  subtitle:"OpenRouter • Gratuit", cat:"multimodele",url:"https://openrouter.ai/chat",         color:"#E07FA0", icon:"⊕", desc:"100+ modèles dont gratuits: Gemma, Llama..." },
  { id:"lmsys",        name:"LMArena",         subtitle:"LMSys • Gratuit",       cat:"multimodele",url:"https://lmarena.ai/",                color:"#F59E0B", icon:"⚔", desc:"Comparaison de modèles en arène anonyme" },
  { id:"nat_dev",      name:"Nat.dev",         subtitle:"Nat.dev • Gratuit",     cat:"multimodele",url:"https://nat.dev/",                   color:"#A78BFA", icon:"⋄", desc:"Playground multi-modèles, compare GPT/Claude/Llama" },
  { id:"together_w",   name:"Together AI",     subtitle:"Together • Gratuit",    cat:"multimodele",url:"https://api.together.ai/playground", color:"#F59E0B", icon:"∿", desc:"Playground Llama, Mixtral & modèles open source" },
  // ── Image IA ────────────────────────────────────────────────────
  { id:"ideogram",     name:"Ideogram",        subtitle:"Ideogram • Gratuit",    cat:"image",   url:"https://ideogram.ai/",                    color:"#EC4899", icon:"🎨", desc:"Génération images IA — excellent pour texte" },
  { id:"adobe_ff",     name:"Adobe Firefly",   subtitle:"Adobe • Gratuit",       cat:"image",   url:"https://firefly.adobe.com/",              color:"#FF6B35", icon:"🔥", desc:"Génération images IA légale, sans copyright" },
  { id:"leonardo",     name:"Leonardo.ai",     subtitle:"Leonardo • Gratuit",    cat:"image",   url:"https://app.leonardo.ai/",                color:"#7C3AED", icon:"🖼", desc:"150 crédits/jour gratuits — style artistique" },
  { id:"kling",        name:"Kling AI",        subtitle:"Kuaishou • Gratuit",    cat:"image",   url:"https://klingai.com/",                    color:"#0EA5E9", icon:"▶", desc:"Génération vidéo & image IA, gratuit" },
  { id:"playground_ai",name:"Playground AI",  subtitle:"Playground • Gratuit",  cat:"image",   url:"https://playground.com/",                 color:"#F472B6", icon:"🎭", desc:"500 images/jour gratuites" },
  // ── Code & Développement ────────────────────────────────────────
  { id:"github_cop",   name:"GitHub Copilot",  subtitle:"GitHub • $10/mois",     cat:"code",    url:"https://github.com/features/copilot",     color:"#6E40C9", icon:"⌥", desc:"IA de code intégrée dans VS Code, JetBrains..." },
  { id:"cursor",       name:"Cursor",          subtitle:"Cursor • Gratuit/payant",cat:"code",   url:"https://cursor.com/",                     color:"#7B8CDE", icon:"⌨", desc:"IDE IA basé sur VS Code, très populaire" },
  { id:"replit",       name:"Replit AI",       subtitle:"Replit • Gratuit",      cat:"code",    url:"https://replit.com/",                     color:"#F26207", icon:"∈", desc:"Environnement de code IA en ligne" },
  { id:"bolt",         name:"Bolt.new",        subtitle:"StackBlitz • Gratuit",  cat:"code",    url:"https://bolt.new/",                       color:"#7C3AED", icon:"⚡", desc:"Génère des apps web complètes en quelques secondes" },
  { id:"v0_dev",       name:"v0 by Vercel",    subtitle:"Vercel • Gratuit",      cat:"code",    url:"https://v0.dev/",                         color:"#000000", icon:"▲", desc:"Génère du code React/UI avec Shadcn" },
  { id:"lovable",      name:"Lovable",         subtitle:"Lovable • Gratuit",     cat:"code",    url:"https://lovable.dev/",                    color:"#FF6B6B", icon:"♥", desc:"Génère des apps fullstack depuis une description" },
  // ── Audio / Voix ────────────────────────────────────────────────
  { id:"elevenlabs",   name:"ElevenLabs",      subtitle:"ElevenLabs • Gratuit",  cat:"audio",   url:"https://elevenlabs.io/",                  color:"#6366F1", icon:"🔊", desc:"Clonage et synthèse vocale ultra-réaliste" },
  { id:"suno",         name:"Suno AI",         subtitle:"Suno • Gratuit",        cat:"audio",   url:"https://suno.com/",                       color:"#10B981", icon:"🎵", desc:"Génère de la musique complète avec paroles" },
  { id:"udio",         name:"Udio",            subtitle:"Udio • Gratuit",        cat:"audio",   url:"https://www.udio.com/",                   color:"#8B5CF6", icon:"🎶", desc:"Génération musicale IA de haute qualité" },
  // ── Premium / Payant ────────────────────────────────────────────
  { id:"gpt4_pay",     name:"ChatGPT Plus",    subtitle:"OpenAI • $20/mois",     cat:"payant",  url:"https://chatgpt.com/",                    color:"#74C98C", icon:"◈", desc:"GPT-4o + o3 + DALL-E 3 + plugins" },
  { id:"claude_pro",   name:"Claude Pro",      subtitle:"Anthropic • $20/mois",  cat:"payant",  url:"https://claude.ai/",                      color:"#D4A853", icon:"✦", desc:"Claude Opus 4, projets, priorité" },
  { id:"gemini_adv",   name:"Gemini Advanced", subtitle:"Google • $20/mois",     cat:"payant",  url:"https://gemini.google.com/",              color:"#4A90E0", icon:"◆", desc:"Gemini 2.5 Pro, 2M contexte, DeepResearch" },
  { id:"perp_pro",     name:"Perplexity Pro",  subtitle:"Perplexity • $20/mois", cat:"payant",  url:"https://www.perplexity.ai/",              color:"#20B2AA", icon:"◉", desc:"Modèles premium + recherche illimitée" },
  { id:"midjourney_w", name:"Midjourney",      subtitle:"MJ • $10/mois",         cat:"payant",  url:"https://www.midjourney.com/",             color:"#A78BFA", icon:"🎭", desc:"Meilleure génération images artistique" },
  { id:"runway",       name:"Runway",          subtitle:"Runway • $12/mois",     cat:"payant",  url:"https://runwayml.com/",                   color:"#22D3EE", icon:"🎬", desc:"Génération vidéo IA professionnelle" },
];

// ── IAs découvertes dynamiquement (ajout via algorithme) ────────
const DISCOVERED_KEY = "multiia_discovered_ais";
function getDiscoveredAIs() {
  try { return JSON.parse(localStorage.getItem(DISCOVERED_KEY)||"[]"); } catch { return []; }
}
function saveDiscoveredAIs(list) {
  localStorage.setItem(DISCOVERED_KEY, JSON.stringify(list));
}

// Sources de découverte automatique (flux RSS / JSON publics)
const DISCOVERY_SOURCES = [
  { name:"There's An AI For That", url:"https://theresanaiforthat.com/", hint:"Répertoire d'outils IA" },
  { name:"Futurepedia", url:"https://www.futurepedia.io/", hint:"Directory IA mis à jour quotidiennement" },
  { name:"AI Valley", url:"https://aivalley.ai/", hint:"Nouvelles IAs chaque jour" },
];

const WEB_AIS = [...BASE_WEB_AIS, ...getDiscoveredAIs()];

// ── YouTube : chaînes recommandées ───────────────────────────────
const YT_CHANNELS = [
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

const YT_CATS = ["Tout","🇫🇷 Français","🇺🇸 Anglais","IA Technique","Tutoriels","Actualités IA","Dev & Tech","Interviews","IA Locale & OSS"];

const YT_VIDEO_THEMES = [
  { id:"trending",  label:"🔥 Tendances",       query:"intelligence artificielle nouveautés tendances vidéos 2025" },
  { id:"tutos",     label:"🎓 Tutoriels IA",     query:"tutoriel intelligence artificielle débutant pratique 2025 français" },
  { id:"modeles",   label:"🤖 Nouveaux modèles", query:"nouveau modèle IA test comparaison GPT Claude Gemini 2025" },
  { id:"local",     label:"🖥 IA Locale",        query:"IA locale ollama LM studio open source installer gratuit 2025" },
  { id:"images_v",  label:"🎨 IA Images",        query:"générateur images IA FLUX stable diffusion midjourney tutoriel 2025" },
  { id:"agents",    label:"🤖 Agents IA",        query:"agents IA autonomes LangChain AutoGPT Cursor 2025 tutoriel" },
];

const YT_VIDEO_PROMPT = (q) =>
  `Tu es un expert YouTube spécialisé en IA et technologie. Liste 8 vidéos YouTube réelles et populaires sur : "${q}".
RÈGLES ABSOLUES : 
- "title" = VRAI titre exact de la vidéo (pas une description générique)
- "channel" = NOM EXACT de la chaîne YouTube (ex: "Underscore_", "3Blue1Brown", "Fireship")
- Ne génère PAS d'URLs (elles seront construites automatiquement)
- Varie les chaînes : max 2 vidéos par chaîne
Retourne UNIQUEMENT un tableau JSON valide sans markdown :
[{"title":"VRAI titre de la vidéo","channel":"Nom exact chaîne","duration":"X:XX ou XhXX","date":"Il y a Xj / Cette semaine / Ce mois","views":"XXXk vues","category":"Tutoriel|Actualité|Analyse|Review|Interview","summary":"1 phrase description","url":"","lang":"FR ou EN","important":true/false}]`;

async function fetchYTVideos(themeQuery, savedKeys) {
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

const ARENA_MODELS = [
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

const ARENA_NEWS = [
  { date:"Juin 2025",  icon:"✦", color:"#D4A853", title:"Claude 4 — Anthropic",          text:"Sonnet 4 + Opus 4. Mémoire longue durée, agents autonomes sur PC, 200k tokens. Opus 4 rivalise avec GPT-o1 sur les tâches complexes.",        tag:"MAJEUR" },
  { date:"Avr 2025",  icon:"◉", color:"#5AC87C", title:"GPT-o3 & o4-mini — OpenAI",     text:"o3 établit des records sur ARC-AGI et MATH. o4-mini offre un rapport qualité-prix exceptionnel. Raisonnement profond accessible.",              tag:"MAJEUR" },
  { date:"Mars 2025", icon:"⬡", color:"#A0C8FF", title:"DeepSeek R1 — Open Source",      text:"671B MoE open weights, rivalise avec o1. Coût d'inférence 10x inférieur. Choc dans l'industrie IA mondiale.",                                  tag:"MAJEUR" },
  { date:"Fév 2025",  icon:"◇", color:"#6BA5E0", title:"Gemini 2.0 Flash Ultra — Google",text:"2 millions de tokens, analyse des heures de vidéo. Gemini Live pour conversation temps réel avec partage d'écran.",                            tag:"IMPORTANT" },
  { date:"Jan 2025",  icon:"▲", color:"#FF8C69", title:"Mistral Agents — Le Chat",       text:"Navigation web, code exécutable, création docs. Mistral Small 3 sous Apache 2.0.",                                                               tag:"NOUVEAU" },
  { date:"Déc 2024",  icon:"X",  color:"#60C8E0", title:"Grok 3 — xAI",                  text:"Accès temps réel X/Twitter, génération images Aurora, raisonnement profond, API publique ouverte.",                                              tag:"NOUVEAU" },
  { date:"Nov 2024",  icon:"◈", color:"#74C98C", title:"GPT-4o mémoire — OpenAI",        text:"Mémoire persistante cross-conversations, GPTs personnalisés avancés, voix avec expressions émotionnelles.",                                      tag:"UPDATE" },
  { date:"Oct 2024",  icon:"⚡", color:"#F97316", title:"Llama 3.3 70B — Meta",           text:"Perfs proches de Llama 3.1 405B. Meta annonce Llama 4 avec MoE et multimodal natif pour 2025.",                                                tag:"OSS" },
  { date:"Sep 2024",  icon:"千", color:"#E0A850", title:"Qwen 2.5 — Alibaba",             text:"Qwen2.5-Max surpasse les précédents sur code et maths. Open weights disponibles. Concurrent sérieux à DeepSeek.",                              tag:"OSS" },
  { date:"Juil 2024", icon:"文", color:"#C89BFF", title:"Ernie 5.0 — Baidu",              text:"Multimodal avancé (texte, image, audio, vidéo). Optimisé marché chinois. Via Qianfan API.",                                                      tag:"CHINE" },
];

const IMAGE_GENERATORS = [
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

// ╔══════════════════════════════════════════════════════════════╝
const IDS = Object.keys(MODEL_DEFS);
const RATE_LIMIT_COOLDOWN = 60;
const CREDIT_COOLDOWN = 300;

// ── Prix API ($ / 1M tokens input·output) ────────────────────────
const PRICING = {
  groq:       { in:0.00, out:0.00, label:"Llama 3.3 (Groq) — GRATUIT" },
  mistral:    { in:0.00, out:0.00, label:"Mistral Small 3 — GRATUIT" },
  cohere:     { in:0.00, out:0.00, label:"Command R+ (Cohere) — GRATUIT" },
  cerebras:   { in:0.00, out:0.00, label:"Llama 3.1 (Cerebras) — GRATUIT" },
  sambanova:  { in:0.00, out:0.00, label:"Llama 4 (SambaNova) — GRATUIT" },
  mixtral:    { in:0.00, out:0.00, label:"Qwen3 32B (Groq) — GRATUIT" },
  llama4s:      { in:0.00, out:0.00, label:"Llama 4 Scout (Groq) — GRATUIT" },
  gemma2:       { in:0.00, out:0.00, label:"Gemma 2 9B (Groq) — GRATUIT" },
  poll_gpt:   { in:0.00, out:0.00, label:"GPT-4o (Pollinations) — SANS CLÉ" },
  poll_claude:{ in:0.00, out:0.00, label:"Claude (Pollinations) — SANS CLÉ" },
  poll_deepseek:{ in:0.00, out:0.00, label:"DeepSeek (Pollinations) — SANS CLÉ" },
  poll_gemini:  { in:0.00, out:0.00, label:"Gemini (Pollinations) — SANS CLÉ" },
};

// ── Prompts par défaut ────────────────────────────────────────────
// ── Token pricing per 1M tokens (USD) — input/output
const TOKEN_PRICE = {
  groq:      { in: 0.59,  out: 0.79,  free:true },
  mistral:   { in: 0.10,  out: 0.30,  free:true },
  cohere:    { in: 0.0,   out: 0.0,   free:true },
  cerebras:  { in: 0.10,  out: 0.10,  free:true },
  sambanova: { in: 0.60,  out: 1.20,  free:false },
  qwen3:     { in: 0.10,  out: 0.20,  free:true },
  llama4s:   { in: 0.11,  out: 0.34,  free:true },
  gemma2:    { in: 0.08,  out: 0.08,  free:true },
  poll_gpt:  { in: 0.0,   out: 0.0,   free:true },
  poll_claude: { in: 0.0, out: 0.0,   free:true },
  poll_deepseek:{ in:0.0, out: 0.0,   free:true },
  poll_gemini: { in: 0.0, out: 0.0,   free:true },
};

const DEFAULT_PROMPTS = [
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

function tokenizeCode(code, lang) {
  const l = (lang || "").toLowerCase();
  const KW = {
    js:   new Set(["const","let","var","function","return","if","else","for","while","do","class","import","export","default","from","async","await","try","catch","throw","new","this","typeof","instanceof","of","in","null","undefined","true","false","switch","case","break","continue","void","delete","yield","extends","super","static"]),
    ts:   new Set(["const","let","var","function","return","if","else","for","while","class","import","export","default","from","async","await","try","catch","throw","new","this","typeof","interface","type","enum","string","number","boolean","any","void","never","null","undefined","true","false","extends","implements","public","private","protected","readonly","abstract"]),
    py:   new Set(["def","return","if","elif","else","for","while","class","import","from","as","with","try","except","finally","raise","pass","break","continue","True","False","None","and","or","not","in","is","lambda","yield","global","nonlocal","del","assert","async","await","print","len","range","str","int","float","list","dict","set","tuple","type"]),
    bash: new Set(["echo","if","then","else","fi","for","do","done","while","function","return","exit","export","source","cd","ls","mkdir","rm","cp","mv","cat","grep","sed","chmod","chown","curl","wget","git","npm","pip","python","node"]),
    css:  new Set(["display","flex","grid","position","color","background","margin","padding","border","font","width","height","overflow","transition","animation","transform","opacity","cursor","top","left","right","bottom","none","block","inline","absolute","relative","fixed","sticky","center","bold","normal","auto"]),
    java: new Set(["class","public","private","protected","static","void","return","if","else","for","while","new","import","package","this","super","extends","implements","interface","abstract","final","try","catch","throw","true","false","null","int","long","double","float","boolean","String"]),
    rust: new Set(["fn","let","mut","if","else","for","while","loop","match","return","use","mod","pub","struct","enum","impl","trait","type","where","self","Self","true","false","None","Some","Ok","Err","async","await","move","Box","Vec","String","Option","Result"]),
    sql:  new Set(["SELECT","FROM","WHERE","JOIN","INNER","LEFT","RIGHT","ON","GROUP","BY","ORDER","HAVING","INSERT","INTO","VALUES","UPDATE","SET","DELETE","CREATE","TABLE","DROP","ALTER","INDEX","UNIQUE","PRIMARY","KEY","FOREIGN","REFERENCES","AS","AND","OR","NOT","NULL","IS","IN","LIKE","BETWEEN","DISTINCT","COUNT","SUM","AVG","MAX","MIN"]),
  };
  const jsLike = new Set(["js","jsx","ts","tsx","java","c","cpp","cs","go","rust","swift","kotlin","dart"]);
  const pyLike = new Set(["py","python","rb","ruby"]);
  const kws = KW[l==="tsx"?"ts":l==="jsx"?"js":l==="sh"?"bash":l] || KW.js;
  const tokens = [];
  let i = 0; const n = code.length;
  while (i < n) {
    const ch = code[i];
    // Line comment //
    if (jsLike.has(l) && ch==="/" && code[i+1]==="/") {
      let j=i; while(j<n&&code[j]!=="\n")j++;
      tokens.push({t:"cm",v:code.slice(i,j)}); i=j; continue;
    }
    // Block comment /* */
    if ((jsLike.has(l)||l==="css") && ch==="/" && code[i+1]==="*") {
      let j=i+2; while(j<n&&!(code[j-1]==="*"&&code[j]==="/"))j++;
      tokens.push({t:"cm",v:code.slice(i,j+1)}); i=j+1; continue;
    }
    // Python/bash comment #
    if ((pyLike.has(l)||l==="bash"||l==="sh"||l==="yaml"||l==="yml") && ch==="#") {
      let j=i; while(j<n&&code[j]!=="\n")j++;
      tokens.push({t:"cm",v:code.slice(i,j)}); i=j; continue;
    }
    // HTML comment
    if ((l==="html"||l==="xml") && code.slice(i,i+4)==="<!--") {
      let j=i+4; while(j<n&&code.slice(j,j+3)!=="-->")j++;
      tokens.push({t:"cm",v:code.slice(i,j+3)}); i=j+3; continue;
    }
    // SQL comment --
    if (l==="sql" && ch==="-" && code[i+1]==="-") {
      let j=i; while(j<n&&code[j]!=="\n")j++;
      tokens.push({t:"cm",v:code.slice(i,j)}); i=j; continue;
    }
    // String "
    if (ch==="\"") {
      let j=i+1; while(j<n){if(code[j]==="\"")break;if(code[j]==="\\")j++;j++;}
      tokens.push({t:"st",v:code.slice(i,j+1)}); i=j+1; continue;
    }
    // String '
    if (ch==="'") {
      let j=i+1; while(j<n){if(code[j]==="'")break;if(code[j]==="\\")j++;j++;}
      tokens.push({t:"st",v:code.slice(i,j+1)}); i=j+1; continue;
    }
    // Template literal backtick
    if (ch==="`") {
      let j=i+1; while(j<n){if(code[j]==="`")break;if(code[j]==="\\")j++;j++;}
      tokens.push({t:"st",v:code.slice(i,j+1)}); i=j+1; continue;
    }
    // Number
    if (/[0-9]/.test(ch)) {
      let j=i; while(j<n&&/[0-9._xXa-fA-FbBoOeE]/.test(code[j]))j++;
      tokens.push({t:"nm",v:code.slice(i,j)}); i=j; continue;
    }
    // Identifier / keyword
    if (/[a-zA-Z_$]/.test(ch)) {
      let j=i; while(j<n&&/[a-zA-Z0-9_$]/.test(code[j]))j++;
      const w=code.slice(i,j);
      tokens.push({t:kws.has(w)?"kw":"id",v:w}); i=j; continue;
    }
    // Whitespace
    if (/\s/.test(ch)) {
      let j=i; while(j<n&&/\s/.test(code[j]))j++;
      tokens.push({t:"ws",v:code.slice(i,j)}); i=j; continue;
    }
    // Operator / punct
    tokens.push({t:"op",v:ch}); i++;
  }
  return tokens;
}

function CodeBlock({ code, lang }) {
  const [copied, setCopied] = useState(false);
  const [highlighted, setHighlighted] = useState(null);
  const codeStr = (code||"").trimEnd();
  const isHtmlLike = lang && (lang==="html"||lang==="html5"||lang==="svg");

  // Try Prism highlight, fall back to homemade tokenizer
  React.useEffect(() => {
    loadPrism();
    const doHL = () => {
      if (!window.Prism) { setHighlighted(null); return; }
      try {
        const grammar = window.Prism.languages[lang] || window.Prism.languages.clike || window.Prism.languages.markup;
        if (grammar) {
          setHighlighted(window.Prism.highlight(codeStr, grammar, lang||"text"));
        } else {
          // Language not loaded yet — wait for autoloader
          window.Prism.highlightAll && window.Prism.hooks?.add("complete", () => {
            const g2 = window.Prism.languages[lang];
            if (g2) setHighlighted(window.Prism.highlight(codeStr, g2, lang));
          });
        }
      } catch { setHighlighted(null); }
    };
    onPrismReady(doHL);
  }, [codeStr, lang]);

  const copy = () => {
    try { navigator.clipboard.writeText(codeStr); } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  // Fallback tokenizer (homemade)
  const tokens = highlighted ? null : tokenizeCode(codeStr, lang);
  const CLR = { kw:"#C084FC", st:"#FB923C", cm:"#6B6B85", nm:"#60A5FA", op:"#94A3B8" };
  return (
    <div className="md-code-block">
      <div className="md-code-hdr">
        <span className="md-code-lang">{lang||"code"}</span>
        <div style={{display:"flex",gap:4,alignItems:"center"}}>
          {isHtmlLike && (
            <button className="md-code-copy" style={{background:"rgba(96,165,250,.15)",borderColor:"rgba(96,165,250,.4)",color:"var(--blue)"}}
              onClick={()=>{ if(window.__openCanvas) window.__openCanvas(codeStr, lang, "Aperçu HTML"); }}>▶ Canvas</button>
          )}
          <button className={"md-code-copy"+(copied?" copied":"")} onClick={copy}>
            {copied ? "✓ Copié" : "⎘ Copier"}
          </button>
        </div>
      </div>
      <div className="md-code-body">
        {highlighted
          ? <code dangerouslySetInnerHTML={{__html: window.DOMPurify ? window.DOMPurify.sanitize(highlighted) : highlighted}}
              style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"inherit",background:"none",display:"block"}}/>
          : (tokens||[]).map((tok,idx) => {
              if (tok.t==="ws"||tok.t==="id") return tok.v;
              if (CLR[tok.t]) return <span key={idx} style={{color:CLR[tok.t],fontStyle:tok.t==="cm"?"italic":"normal"}}>{tok.v}</span>;
              return tok.v;
            })
        }
      </div>
    </div>
  );
}

function parseInline(text) {
  if (!text) return [];
  const re = /\*\*(.+?)\*\*|\*(.+?)\*|__(.+?)__|~~(.+?)~~|`([^`\n]+)`|\[([^\]]+)\]\(([^)]+)\)/g;
  const parts=[]; let last=0, m, k=0;
  while ((m=re.exec(text))!==null) {
    if (m.index>last) parts.push(text.slice(last,m.index));
    if      (m[1]!==undefined) parts.push(<strong key={k++}>{m[1]}</strong>);
    else if (m[2]!==undefined) parts.push(<em key={k++}>{m[2]}</em>);
    else if (m[3]!==undefined) parts.push(<u key={k++} style={{textDecorationColor:"var(--ac)",textUnderlineOffset:"3px"}}>{m[3]}</u>);
    else if (m[4]!==undefined) parts.push(<del key={k++} style={{color:"var(--mu)"}}>{m[4]}</del>);
    else if (m[5]!==undefined) parts.push(<code key={k++} className="md-ic">{m[5]}</code>);
    else if (m[6]!==undefined) parts.push(<a key={k++} href={m[7]} target="_blank" rel="noopener noreferrer" className="md-link">{m[6]}</a>);
    last=m.index+m[0].length;
  }
  if (last<text.length) parts.push(text.slice(last));
  return parts;
}

function MarkdownRenderer({ text }) {
  if (!text) return null;
  // Split code blocks from text
  const segs=[];
  const codeRe = /```(\w*)\n?([\s\S]*?)```/g;
  let last=0, m;
  while ((m=codeRe.exec(text))!==null) {
    if (m.index>last) segs.push({type:"text",content:text.slice(last,m.index)});
    segs.push({type:"code",lang:m[1]||"",content:m[2]||""});
    last=m.index+m[0].length;
  }
  if (last<text.length) segs.push({type:"text",content:text.slice(last)});

  const renderText = (content, si) => {
    const lines=content.split("\n");
    const els=[]; let listBuf=[], listType=null, k=0;
    const flushList=()=>{
      if(!listBuf.length) return;
      const El=listType==="ol"?"ol":"ul";
      els.push(<El key={"l"+k++} className="md-list">{listBuf.map((li,j)=><li key={j}>{parseInline(li)}</li>)}</El>);
      listBuf=[]; listType=null;
    };
    for(let i=0;i<lines.length;i++){
      const line=lines[i];
      // Headers
      const hm=line.match(/^(#{1,3})\s+(.+)$/);
      if(hm){flushList();const lv=hm[1].length;const Tag="h"+lv;els.push(React.createElement(Tag,{key:k++,className:"md-h"+lv},parseInline(hm[2])));continue;}
      // HR
      if(/^-{3,}$/.test(line.trim())){flushList();els.push(<hr key={k++} className="md-hr"/>);continue;}
      // Blockquote
      if(line.startsWith("> ")){flushList();els.push(<blockquote key={k++} className="md-bq">{parseInline(line.slice(2))}</blockquote>);continue;}
      // Unordered list
      const ulm=line.match(/^[\-\*\+]\s+(.+)$/);
      if(ulm){if(listType!=="ul"){flushList();listType="ul";}listBuf.push(ulm[1]);continue;}
      // Ordered list
      const olm=line.match(/^\d+\.\s+(.+)$/);
      if(olm){if(listType!=="ol"){flushList();listType="ol";}listBuf.push(olm[1]);continue;}
      // Empty line → spacer
      if(!line.trim()){flushList();if(i>0&&i<lines.length-1)els.push(<br key={k++}/>);continue;}
      // Regular paragraph
      flushList();
      els.push(<p key={k++} className="md-p">{parseInline(line)}</p>);
    }
    flushList();
    return <div key={si}>{els}</div>;
  };

  return (
    <div className="md">
      {segs.map((seg,si)=>
        seg.type==="code"
          ? <CodeBlock key={si} code={seg.content} lang={seg.lang}/>
          : renderText(seg.content,si)
      )}
    </div>
  );
}

// ── Prompt variables {{date}}, {{heure}}, etc. ────────────────────
// ── Supprime les blocs <think>…</think> (Qwen3, DeepSeek R1) ──────

// ── Prism.js dynamic loader ─────────────────────────────────────
let _prismReady = false;
const _prismCallbacks = [];
function onPrismReady(cb) { if (_prismReady) cb(); else _prismCallbacks.push(cb); }
function loadPrism() {
  if (_prismReady || document.getElementById("prism-js")) return;
  // Theme CSS
  const link = document.createElement("link");
  link.rel = "stylesheet"; link.id = "prism-css";
  link.href = "https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css";
  document.head.appendChild(link);
  // Autoloader (handles all languages automatically)
  const script = document.createElement("script");
  script.id = "prism-js";
  script.src = "https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-core.min.js";
  script.onload = () => {
    const autoload = document.createElement("script");
    autoload.src = "https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/plugins/autoloader/prism-autoloader.min.js";
    autoload.onload = () => {
      if (window.Prism?.plugins?.autoloader) {
        window.Prism.plugins.autoloader.languages_path = "https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/";
      }
      _prismReady = true;
      _prismCallbacks.forEach(cb => cb());
    };
    document.head.appendChild(autoload);
  };
  document.head.appendChild(script);
}

function CoTBlock({ think }) {
  const [open, setOpen] = React.useState(false);
  if (!think) return null;
  const words = think.split(/\s+/).length;
  return (
    <div className="cot-block">
      <button className="cot-toggle" onClick={()=>setOpen(o=>!o)}>
        <span style={{fontSize:10}}>{open?"▼":"▶"}</span>
        <span style={{opacity:.7}}>🧠 Raisonnement interne</span>
        <span style={{marginLeft:"auto",opacity:.5}}>{words} mots</span>
        <span style={{opacity:.5}}>{open?"Masquer":"Afficher"}</span>
      </button>
      {open && <div className="cot-body">{think}</div>}
    </div>
  );
}

function stripThink(text) {
  if (!text) return text;
  return text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
}
function extractThink(text) {
  if (!text) return null;
  const m = text.match(/<think>([\s\S]*?)<\/think>/i);
  return m ? m[1].trim() : null;
}

function applyPromptVars(text) {
  const now=new Date();
  const pad=n=>String(n).padStart(2,"0");
  const vars={
    date: now.toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long",year:"numeric"}),
    heure: pad(now.getHours())+":"+pad(now.getMinutes()),
    jour:  now.toLocaleDateString("fr-FR",{weekday:"long"}),
    mois:  now.toLocaleDateString("fr-FR",{month:"long"}),
    annee: String(now.getFullYear()),
    ts:    now.toISOString(),
    today: now.toLocaleDateString("fr-FR"),
  };
  return text.replace(/\{\{(\w+)\}\}/g,(_,k)=>vars[k]!==undefined?vars[k]:"{{"+k+"}}");
}

const fmt = (n) => n>=1e6?(n/1e6).toFixed(1)+"M":n>=1000?(n/1000).toFixed(1)+"k":String(n);

function classifyError(msg) {
  const m = (msg||"").toLowerCase();
  if (m.includes("429")||m.includes("rate limit")||m.includes("too many")) return "ratelimit";
  if (m.includes("quota")||m.includes("credit")||m.includes("billing")||m.includes("insufficient")||m.includes("exceeded")) return "credit_warn"; // warn only, don't block
  return "other";
}

async function callClaude(messages, system="Tu es un assistant IA utile et concis.", attachedFile=null) {
  // Construire les messages avec support fichiers (vision + texte)
  const apiMessages = messages.map((m, i) => {
    const isLast = i === messages.length - 1;
    if (isLast && attachedFile) {
      if (attachedFile.type === "image") {
        return { role: m.role, content: [
          { type: "image", source: { type: "base64", media_type: attachedFile.mimeType, data: attachedFile.base64 } },
          { type: "text", text: m.content }
        ]};
      } else {
        return { role: m.role, content: `📎 Fichier : ${attachedFile.name}\n\n${attachedFile.content}\n\n---\n${m.content}` };
      }
    }
    return { role: m.role, content: m.content };
  });
  const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  const endpoint = isLocal ? "https://api.anthropic.com/v1/messages" : "/api/claude";
  const claudeHeaders = isLocal
    ? {"Content-Type":"application/json","x-api-key":"","anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"}
    : {"Content-Type":"application/json"};
  const r = await fetch(endpoint,{method:"POST",headers:claudeHeaders,body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:2000,system,messages:apiMessages})});
  const rawText = await r.text();
  let d;
  try { d = JSON.parse(rawText); } catch {
    // La réponse n'est pas du JSON → le proxy n'est pas configuré
    if (!isLocal) {
      throw new Error("❌ Proxy Claude non configuré sur Vercel. Va dans Vercel → Settings → Environment Variables → ajoute ANTHROPIC_API_KEY. En attendant, utilise Groq ou Mistral (100% gratuits, aucune config).");
    }
    throw new Error("Réponse invalide de l'API Claude : " + rawText.slice(0,100));
  }
  if(d.error) throw new Error(d.error.message || JSON.stringify(d.error));
  return d.content[0].text;
}
async function callGemini(messages, apiKey, system="Tu es un assistant IA utile et concis.") {
  if (!apiKey) throw new Error("Clé Gemini manquante. Va sur aistudio.google.com/app/apikey pour en créer une gratuite.");
  const last = messages[messages.length-1].content;
  const history = messages.slice(0,-1).map(m => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{text: m.content}]
  }));
  const body = {
    systemInstruction: { parts: [{text: system}] },
    contents: [...history, {role:"user", parts:[{text:last}]}],
    generationConfig: { maxOutputTokens: 1500 }
  };
  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body)}
  );
  const raw = await r.text();
  let d; try { d = JSON.parse(raw); } catch { throw new Error("Réponse Gemini invalide: " + raw.slice(0,100)); }
  if(d.error) throw new Error(d.error.message||JSON.stringify(d.error));
  if(!d.candidates?.[0]?.content?.parts?.[0]?.text) throw new Error("Gemini: réponse vide. Détail: " + JSON.stringify(d).slice(0,200));
  return d.candidates[0].content.parts[0].text;
}
// ── Pollinations.AI — deux endpoints ──────────────────────────────
// text.pollinations.ai/openai  = GRATUIT ANONYME, modèle "openai" uniquement (legacy)
// gen.pollinations.ai/v1/...   = TOUS les modèles (claude, deepseek, gemini…) — clé Pollen gratuite sur enter.pollinations.ai
let _pollQueue = Promise.resolve();

async function callPollinations(messages, model, system="Tu es un assistant IA utile et concis.") {
  // Endpoint legacy anonyme — uniquement modèle "openai"
  _pollQueue = _pollQueue.then(() => new Promise(res => setTimeout(res, 16000)));
  await _pollQueue;
  const msgs = system ? [{role:"system",content:system},...messages] : messages;
  const r = await fetch("https://text.pollinations.ai/openai", {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({ model:"openai", messages:msgs, max_tokens:1500, private:true, referrer:"multiia-hub.vercel.app" })
  });
  if(!r.ok) { const txt = await r.text().catch(()=>""); throw new Error("Pollinations " + r.status + ": " + txt.slice(0,150)); }
  const d = await r.json();
  if(d.error) throw new Error(d.error.message||JSON.stringify(d.error));
  return d.choices?.[0]?.message?.content || "";
}

async function callPollinationsPaid(messages, apiKey, model, system="Tu es un assistant IA utile et concis.") {
  // Endpoint gen.pollinations.ai — clé Pollen gratuite sur enter.pollinations.ai
  if(!apiKey) throw new Error("Clé Pollen manquante. Va sur enter.pollinations.ai → inscription gratuite → copie ta clé dans Config.");
  const msgs = system ? [{role:"system",content:system},...messages] : messages;
  const r = await fetch("https://gen.pollinations.ai/v1/chat/completions", {
    method:"POST",
    headers:{"Content-Type":"application/json","Authorization":`Bearer ${apiKey}`},
    body:JSON.stringify({ model, messages:msgs, max_tokens:1500 })
  });
  if(!r.ok) { const txt = await r.text().catch(()=>""); throw new Error("Pollinations " + r.status + ": " + txt.slice(0,150)); }
  const d = await r.json();
  if(d.error) throw new Error(d.error.message||JSON.stringify(d.error));
  return d.choices?.[0]?.message?.content || "";
}

async function callCompat(messages, apiKey, baseUrl, model, system="Tu es un assistant IA utile et concis.") {
  const headers = {"Content-Type":"application/json","Authorization":`Bearer ${apiKey}`};
  // OpenRouter needs HTTP-Referer
  if (baseUrl.includes("openrouter")) {
    headers["HTTP-Referer"] = "https://multiia-hub.vercel.app";
    headers["X-Title"] = "Multi-IA Hub";
  }
  const r = await fetch(`${baseUrl}/chat/completions`,{method:"POST",headers,body:JSON.stringify({model,max_tokens:1500,messages:[{role:"system",content:system},...messages.map(m=>({role:m.role,content:m.content}))]})});
  const raw = await r.text();
  let d;
  try { d = JSON.parse(raw); } catch { throw new Error("Réponse invalide : " + raw.slice(0,120)); }
  if(d.error) throw new Error(typeof d.error==="string"?d.error:(d.error.message||JSON.stringify(d.error)));
  if(!d.choices || !d.choices[0]) throw new Error("Réponse vide — modèle indisponible. Détail: " + JSON.stringify(d).slice(0,200));
  return d.choices[0].message.content;
}
async function callCohere(messages, apiKey, system="Tu es un assistant IA utile et concis.") {
  if (!apiKey) throw new Error("Clé Cohere manquante. Va sur dashboard.cohere.com/api-keys");
  const chatHistory = messages.slice(0,-1).map(m => ({
    role: m.role === "assistant" ? "CHATBOT" : "USER",
    message: m.content
  }));
  const last = messages[messages.length-1].content;
  const r = await fetch("https://api.cohere.ai/v1/chat", {
    method:"POST",
    headers:{"Content-Type":"application/json","Authorization":`Bearer ${apiKey}`},
    body: JSON.stringify({ model:"command-r-plus-08-2024", message: last, chat_history: chatHistory, preamble: system, max_tokens: 1500 })
  });
  const raw = await r.text();
  let d; try { d = JSON.parse(raw); } catch { throw new Error("Réponse Cohere invalide"); }
  if(d.message) throw new Error(d.message);
  return d.text;
}
async function callModel(id, messages, keys, system, attachedFile=null) {
  const m=MODEL_DEFS[id];
  if(!m) throw new Error("IA inconnue : " + id);
  // Injecter fichier dans le texte
  const msgWithFile = attachedFile && attachedFile.type !== "image"
    ? messages.map((msg,i) => i===messages.length-1 ? {...msg, content:`📎 Fichier: ${attachedFile.name}\n\n${attachedFile.content}\n\n---\n${msg.content}`} : msg)
    : messages;
  if(m.apiType==="gemini") return callGemini(msgWithFile,keys.gemini,system);
  if(m.apiType==="cohere") return callCohere(messages,keys.cohere,system);
  if(m.apiType==="pollinations")      return callPollinations(msgWithFile,m.model,system);
  if(m.apiType==="pollinations_paid") return callPollinationsPaid(msgWithFile,keys.pollen||"",m.model,system);
  if(m.apiType==="compat") {
    const key = keys[m.keyName];
    if(!key) throw new Error(`Clé API manquante pour ${m.name}. Va dans ⚙ Config pour l'ajouter gratuitement.`);
    return callCompat(msgWithFile,key,m.baseUrl,m.model,system);
  }
  throw new Error("Type d'API non supporté : " + m.apiType);
}
async function correctGrammar(text, keys) {
  const sys = "Tu es un correcteur expert. Tu corriges sans changer le sens.";
  const msgs = [{role:"user",content:`Corrige les fautes d'orthographe, grammaire et ponctuation. Retourne UNIQUEMENT le texte corrigé, sans commentaires.\n\n${text}`}];
  if (keys && keys.groq_inf) return callCompat(msgs, keys.groq_inf, "https://api.groq.com/openai/v1", "llama-3.3-70b-versatile", sys);
  if (keys && keys.mistral) return callCompat(msgs, keys.mistral, "https://api.mistral.ai/v1", "mistral-small-latest", sys);
  throw new Error("Active Groq ou Mistral pour utiliser le correcteur.");
}

// ── Personas par défaut ───────────────────────────────────────────
const DEFAULT_PERSONAS = [
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
const REDACTION_ACTIONS = [
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
const S = `
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,400;0,600;1,400&family=Inter:wght@300;400;500;600;700&family=Syne:wght@400;600;700;800&display=swap');
@import url('https://fonts.cdnfonts.com/css/geist');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--bg:#09090B;--s1:#0F0F13;--s2:#16161C;--bd:#222228;--tx:#DDDDE8;--mu:#555568;--ac:#D4A853;--green:#4ADE80;--red:#F87171;--orange:#FB923C;--blue:#60A5FA;--r:7px;--font-ui:'Inter',system-ui,sans-serif;--font-mono:'IBM Plex Mono',monospace;--font-display:'Geist','Syne',sans-serif}
html{font-size:16px}
body{background:var(--bg);color:var(--tx);font-family:var(--font-ui);overflow:hidden}
.app{display:flex;flex-direction:column;height:100vh;height:100dvh;overflow:hidden}
.nav{padding:clamp(5px,1.2vw,9px) clamp(8px,2vw,14px);border-bottom:1px solid rgba(255,255,255,.07);display:flex;align-items:center;gap:clamp(5px,1.2vw,9px);background:rgba(13,13,17,.82);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);flex-shrink:0;flex-wrap:wrap;min-height:42px;position:sticky;top:0;z-index:200}
.logo{font-family:'Syne',sans-serif;font-weight:800;font-size:clamp(13px,2.5vw,17px);color:var(--ac);white-space:nowrap}
.logo em{color:var(--mu);font-style:normal;font-weight:400}
.nav-tabs{display:flex;gap:2px;background:var(--s1);border:1px solid var(--bd);border-radius:6px;padding:2px;flex-wrap:wrap}
.nt{padding:clamp(3px,.8vw,5px) clamp(7px,1.8vw,11px);border-radius:4px;font-size:clamp(8px,1.6vw,10px);font-family:'IBM Plex Mono',monospace;border:none;cursor:pointer;transition:all .15s;color:var(--mu);background:transparent;white-space:nowrap}
.nt.on{background:var(--ac);color:#09090B;font-weight:600}
.pills{display:flex;gap:3px;margin-left:auto;flex-wrap:wrap;align-items:center}
.pill{display:flex;align-items:center;gap:3px;padding:clamp(2px,.6vw,4px) clamp(5px,1.2vw,8px);border-radius:4px;border:1px solid;font-family:'IBM Plex Mono',monospace;font-size:clamp(7px,1.4vw,10px);cursor:pointer;transition:all .18s;background:transparent;white-space:nowrap}
.pill:hover{filter:brightness(1.2)}
.pfree{font-size:7px;padding:1px 3px;border-radius:2px;background:rgba(74,222,128,.15);color:var(--green);font-weight:700}
.btn-xs{background:transparent;border:1px solid var(--bd);color:var(--mu);padding:3px 7px;border-radius:4px;font-size:9px;font-family:'IBM Plex Mono',monospace;cursor:pointer}
.btn-xs:hover{border-color:var(--red);color:var(--red)}
.tbar{padding:3px clamp(8px,2vw,14px);border-bottom:1px solid var(--bd);display:flex;align-items:center;gap:clamp(5px,1.5vw,10px);font-size:8px;color:var(--mu);flex-shrink:0;flex-wrap:wrap}
.tbar-lbl{color:var(--ac);font-weight:700;letter-spacing:1px;font-size:7px}
.ti{display:flex;align-items:center;gap:3px;flex-shrink:0}
.tr{width:clamp(24px,4vw,44px);height:3px;background:var(--bd);border-radius:2px;overflow:hidden}
.tf{height:100%;border-radius:2px;transition:width .4s}
.tbar-total{margin-left:auto;white-space:nowrap}
.cols{display:flex;flex:1;overflow-y:auto;overflow-x:hidden;flex-direction:column;scrollbar-width:thin;scrollbar-color:var(--bd) transparent}
.col{flex:none;display:flex;flex-direction:column;border-bottom:1px solid var(--bd);overflow:hidden;width:100%;min-height:clamp(300px,42vh,520px);transition:opacity .3s,filter .3s,box-shadow .35s ease,outline .35s ease}
.col:last-child{border-bottom:none}
.col.off{opacity:.10;filter:grayscale(1);pointer-events:none}
.col.solo-dim{opacity:.10;filter:grayscale(1);pointer-events:none}
.col.solo-focus{min-height:clamp(480px,70vh,800px)}
/* ── HISTORY SIDEBAR ── */
.hist-sidebar{width:170px;flex-shrink:0;border-right:1px solid rgba(255,255,255,.06);display:flex;flex-direction:column;background:rgba(10,10,14,.88);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);overflow:hidden;transition:width .2s}
.hist-sidebar.closed{width:0;border-right:none}
.hist-folder-tabs{display:flex;gap:2px;padding:5px 6px;flex-wrap:wrap;border-bottom:1px solid var(--bd);flex-shrink:0;background:var(--s1)}
.hist-folder-tab{padding:2px 7px;border-radius:3px;border:1px solid transparent;font-size:8px;cursor:pointer;color:var(--mu);background:transparent;font-family:'IBM Plex Mono',monospace;white-space:nowrap;transition:all .15s;max-width:80px;overflow:hidden;text-overflow:ellipsis}
.hist-folder-tab:hover{background:rgba(255,255,255,.05);color:var(--tx)}
.hist-folder-tab.active{background:rgba(212,168,83,.12);border-color:rgba(212,168,83,.3);color:var(--ac)}
.hist-folder-add{padding:2px 5px;border-radius:3px;border:1px dashed rgba(255,255,255,.15);font-size:8px;cursor:pointer;color:var(--mu);background:transparent;font-family:'IBM Plex Mono',monospace}
.hist-hdr{padding:8px 10px;border-bottom:1px solid var(--bd);display:flex;align-items:center;gap:6px;flex-shrink:0}
.hist-hdr-title{font-family:'Syne',sans-serif;font-weight:700;font-size:10px;color:var(--tx);flex:1;white-space:nowrap;overflow:hidden}
.hist-new-btn{background:rgba(212,168,83,.12);border:1px solid rgba(212,168,83,.35);border-radius:4px;color:var(--ac);font-size:9px;font-weight:700;cursor:pointer;padding:3px 7px;font-family:'IBM Plex Mono',monospace;white-space:nowrap;transition:all .15s}
.hist-new-btn:hover{background:rgba(212,168,83,.22)}
.hist-save-btn{background:rgba(74,222,128,.08);border:1px solid rgba(74,222,128,.3);border-radius:4px;color:var(--green);font-size:9px;font-weight:700;cursor:pointer;padding:3px 7px;font-family:'IBM Plex Mono',monospace;white-space:nowrap}
.hist-save-btn:hover{background:rgba(74,222,128,.16)}
.hist-list{flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:0;scrollbar-width:thin;scrollbar-color:var(--bd) transparent}
.hist-empty{padding:20px 12px;text-align:center;font-size:9px;color:var(--mu);line-height:1.7}
.hist-item{padding:9px 10px;border-bottom:1px solid var(--bd);cursor:pointer;transition:background .15s;display:flex;flex-direction:column;gap:3px;position:relative}
.hist-item:hover{background:rgba(255,255,255,.04)}
.hist-item.active{background:rgba(212,168,83,.07);border-left:2px solid var(--ac)}
.hist-item-title{font-size:10px;font-weight:600;color:var(--tx);line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;padding-right:16px}
.hist-item-meta{display:flex;align-items:center;gap:5px;flex-wrap:wrap}
.hist-item-date{font-size:8px;color:var(--mu)}
.hist-item-ias{display:flex;gap:2px}
.hist-item-ia{font-size:7px;padding:1px 3px;border-radius:2px;font-weight:600}
.hist-item-del{position:absolute;top:7px;right:7px;background:none;border:none;color:var(--mu);cursor:pointer;font-size:11px;padding:1px 3px;border-radius:3px;opacity:0;transition:opacity .15s}
.hist-item:hover .hist-item-del{opacity:1}
.hist-item:hover .hist-item-folder-sel{opacity:1 !important}
.hist-item-del:hover{color:var(--red)}
.hist-toggle{background:var(--s1);border:none;border-right:1px solid var(--bd);color:var(--mu);cursor:pointer;font-size:11px;padding:0 5px;writing-mode:vertical-lr;letter-spacing:1px;transition:background .15s;flex-shrink:0;display:flex;align-items:center;justify-content:center;min-height:40px}
.hist-toggle:hover{background:var(--s2);color:var(--tx)}
.chat-area{flex:1;display:flex;flex-direction:column;overflow:hidden}
.ch{padding:clamp(5px,1vw,7px) clamp(7px,1.5vw,11px);border-bottom:1px solid;display:flex;align-items:center;gap:5px;flex-shrink:0;background:rgba(15,15,20,.82);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);position:sticky;top:0;z-index:10}
.ch-actions{display:flex;gap:3px;margin-left:auto;flex-shrink:0;align-items:center}
.ch-btn{background:none;border:1px solid transparent;border-radius:3px;color:var(--mu);cursor:pointer;font-size:10px;padding:2px 4px;transition:all .15s;line-height:1;font-family:'IBM Plex Mono',monospace}
.ch-btn:hover{border-color:var(--bd);color:var(--tx);background:rgba(255,255,255,.05)}
.ch-btn.solo-on{border-color:var(--ac);color:var(--ac);background:rgba(212,168,83,.12)}
.ci{font-size:clamp(10px,1.8vw,13px)}
.cn{font-family:'Syne',sans-serif;font-weight:700;font-size:clamp(8px,1.5vw,10px);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.csub{font-size:7px;color:var(--mu)}
.cm{margin-left:auto;display:flex;align-items:center;gap:4px;flex-shrink:0;margin-right:4px}
.mt{font-size:7px;color:var(--mu);white-space:nowrap}
.dot{width:5px;height:5px;border-radius:50%;background:var(--mu);flex-shrink:0}
.dot.live{background:var(--green);box-shadow:0 0 6px var(--green);animation:pulse 1.5s infinite}
.dot.limited{background:var(--red)}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.25}}
/* ── Tab transitions (Framer Motion-like) ── */
@keyframes tabEnter{from{opacity:0;transform:translateY(8px) scale(.99)}to{opacity:1;transform:translateY(0) scale(1)}}
@keyframes tabEnterLeft{from{opacity:0;transform:translateX(-18px)}to{opacity:1;transform:translateX(0)}}
@keyframes tabEnterRight{from{opacity:0;transform:translateX(18px)}to{opacity:1;transform:translateX(0)}}
.tab-animate{animation:tabEnter .22s cubic-bezier(.4,0,.2,1) both}
.tab-animate-left{animation:tabEnterLeft .22s cubic-bezier(.4,0,.2,1) both}
.tab-animate-right{animation:tabEnterRight .22s cubic-bezier(.4,0,.2,1) both}

@keyframes pulse-glow{0%,100%{opacity:.5;transform:scale(1)}50%{opacity:1;transform:scale(1.25)}}
@keyframes stream-bar-anim{0%{background-position:0% 50%}100%{background-position:200% 50%}}
@keyframes fadeInUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
.countdown{font-size:8px;color:var(--red);white-space:nowrap;font-family:'IBM Plex Mono',monospace;background:rgba(248,113,113,.1);border:1px solid rgba(248,113,113,.3);border-radius:3px;padding:1px 5px}
.msgs{flex:1;overflow-y:auto;padding:clamp(5px,1.2vw,9px);display:flex;flex-direction:column;gap:5px;scrollbar-width:thin;scrollbar-color:var(--bd) transparent}
.msg{padding:clamp(5px,1vw,8px) clamp(7px,1.5vw,10px);border-radius:5px;font-size:clamp(9px,1.6vw,12px);line-height:1.72;border:1px solid var(--bd);font-family:var(--font-ui)}
.msg.u{background:#15151B;color:var(--mu);font-style:italic}
.msg.u::before{content:'> ';color:var(--ac)}
.msg.a{background:var(--s1);color:var(--tx)}
.msg.e{color:var(--red);background:#180808;border-color:#350A0A}
.msg.ld{color:var(--mu);background:var(--s1)}
.scroll-to-bottom{position:absolute;bottom:10px;right:10px;background:rgba(212,168,83,.2);border:1px solid rgba(212,168,83,.4);border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:12px;color:var(--ac);z-index:20;backdrop-filter:blur(6px);transition:opacity .2s;box-shadow:0 2px 8px rgba(0,0,0,.4)}
.msg.blocked{color:var(--orange);background:rgba(251,146,60,.08);border-color:rgba(251,146,60,.3);font-size:10px}
.dots span{animation:blink 1.2s infinite;font-size:14px;line-height:0}
.dots span:nth-child(2){animation-delay:.2s}.dots span:nth-child(3){animation-delay:.4s}
@keyframes blink{0%,80%,100%{opacity:.15}40%{opacity:1}}
.empty{color:var(--mu);font-size:9px;text-align:center;margin-top:clamp(14px,3vh,28px);font-style:italic}
.foot{padding:clamp(6px,1.2vw,9px) clamp(8px,2vw,14px);border-top:1px solid var(--bd);flex-shrink:0;background:var(--bg)}
.ir{display:flex;gap:6px;align-items:flex-end}
.ta-wrap{flex:1;position:relative}
textarea{width:100%;background:var(--s1);border:1px solid var(--bd);border-radius:6px;color:var(--tx);font-family:'IBM Plex Mono',monospace;font-size:clamp(11px,1.9vw,13px);padding:clamp(6px,1.2vw,9px) clamp(8px,1.8vw,11px);resize:none;outline:none;line-height:1.5;max-height:100px;transition:border-color .2s}
textarea:focus{border-color:var(--ac)}
textarea::placeholder{color:var(--mu)}
.foot-btns{display:flex;gap:5px;align-items:flex-end}
.sbtn{background:var(--ac);color:#09090B;border:none;border-radius:6px;width:clamp(30px,4.5vw,38px);height:clamp(30px,4.5vw,38px);cursor:pointer;font-size:15px;font-weight:bold;display:flex;align-items:center;justify-content:center;transition:all .2s;flex-shrink:0}
.sbtn:hover{background:#E8BC6A;transform:scale(1.05)}
.sbtn:disabled{opacity:.36;cursor:not-allowed;transform:none}
.gbtn{background:var(--s2);border:1px solid var(--bd);color:var(--mu);border-radius:6px;width:clamp(30px,4.5vw,38px);height:clamp(30px,4.5vw,38px);cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;transition:all .2s;flex-shrink:0;position:relative}
.gbtn:hover{border-color:var(--green);color:var(--green)}
.gbtn.loading{animation:glow .8s infinite alternate}
@keyframes glow{from{box-shadow:none}to{box-shadow:0 0 8px var(--ac)}}
.grammar-popup{position:absolute;bottom:calc(100% + 8px);left:0;right:0;background:var(--s2);border:1px solid var(--ac);border-radius:8px;padding:10px;z-index:50;font-size:10px;min-width:200px}
.gp-title{color:var(--ac);font-weight:600;font-size:8px;letter-spacing:.8px;margin-bottom:6px}
.gp-orig{color:var(--mu);text-decoration:line-through;font-size:9px;margin-bottom:3px}
.gp-corr{color:var(--green);font-size:10px}
.gp-btns{display:flex;gap:5px;margin-top:8px}
.gp-btn{flex:1;padding:4px 8px;border-radius:4px;font-size:9px;font-family:'IBM Plex Mono',monospace;cursor:pointer;border:1px solid var(--bd);background:transparent;color:var(--mu)}
.gp-btn.apply{background:var(--ac);border-color:var(--ac);color:#09090B;font-weight:600}
.fhint{margin-top:4px;font-size:clamp(7px,1.3vw,9px);color:var(--mu);text-align:center}
.mobile-col-tabs{display:none}
@media(max-width:768px){
  body{overflow:auto}.app{height:100dvh;overflow:hidden}
  .tbar{display:none}.pills{display:none}
  .col{flex:none;height:100dvh}.col.mobile-hidden{display:none}
  .mobile-col-tabs{display:flex !important;padding:4px 8px;gap:4px;overflow-x:auto;border-bottom:1px solid var(--bd);flex-shrink:0;background:var(--s1);scrollbar-width:none}
  .mobile-col-tabs::-webkit-scrollbar{display:none}
  .mct-btn{padding:4px 10px;border-radius:4px;border:1px solid var(--bd);font-size:10px;font-family:'IBM Plex Mono',monospace;cursor:pointer;background:transparent;color:var(--mu);white-space:nowrap;flex-shrink:0}
  .mct-btn.active{background:var(--ac);color:#09090B;border-color:var(--ac);font-weight:600}
  .nav{padding:5px 8px}
}
.scroll-tab{flex:1;overflow-y:auto;scrollbar-width:thin;scrollbar-color:var(--bd) transparent}
.pad{padding:clamp(10px,2vw,18px)}
.web-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(clamp(150px,20vw,210px),1fr));gap:clamp(7px,1.3vw,11px)}
.web-card{background:var(--s1);border:1px solid var(--bd);border-radius:9px;padding:clamp(11px,2vw,15px);display:flex;flex-direction:column;gap:9px;transition:border-color .2s,transform .2s}
.web-card:hover{transform:translateY(-2px)}
.wc-hdr{display:flex;align-items:center;gap:8px}
.wc-icon{width:clamp(26px,3.5vw,34px);height:clamp(26px,3.5vw,34px);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:clamp(11px,1.8vw,15px);font-weight:700;flex-shrink:0}
.wc-name{font-family:'Syne',sans-serif;font-weight:700;font-size:clamp(10px,1.8vw,12px)}
.wc-sub{font-size:8px;color:var(--mu)}
.wc-desc{font-size:clamp(9px,1.5vw,11px);color:var(--mu);line-height:1.5;flex:1}
.wc-btn{display:flex;align-items:center;justify-content:center;gap:5px;padding:7px;border-radius:6px;border:1px solid;font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:600;cursor:pointer;background:transparent;text-decoration:none;transition:all .2s}
.wc-btn:hover{opacity:.8;transform:scale(1.02)}
.debate-wrap{flex:1;overflow-y:auto;display:flex;flex-direction:column;scrollbar-width:thin;scrollbar-color:var(--bd) transparent}
.debate-intro{padding:clamp(14px,3.5vw,26px);display:flex;flex-direction:column;align-items:center;gap:12px;flex:1;justify-content:center;text-align:center}
.debate-title{font-family:'Syne',sans-serif;font-size:clamp(15px,3vw,21px);font-weight:800;color:var(--ac)}
.debate-desc{font-size:clamp(10px,1.7vw,12px);color:var(--mu);line-height:1.7;max-width:480px}
.phase-block{border-bottom:1px solid var(--bd);flex-shrink:0}
.phase-header{padding:8px clamp(10px,2vw,16px);display:flex;align-items:center;gap:7px;cursor:pointer;background:var(--s1);user-select:none}
.phase-header:hover{background:var(--s2)}
.ph-badge{padding:2px 6px;border-radius:3px;font-size:7px;font-weight:600;letter-spacing:1px}
.ph-title{font-family:'Syne',sans-serif;font-size:clamp(10px,1.8vw,12px);font-weight:700}
.ph-chev{margin-left:auto;color:var(--mu);transition:transform .2s}
.ph-chev.open{transform:rotate(180deg)}
.phase-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(clamp(170px,26vw,250px),1fr));border-top:1px solid var(--bd)}
.pg-cell{padding:clamp(7px,1.5vw,11px);border-right:1px solid var(--bd);border-bottom:1px solid var(--bd)}
.pgc-hdr{display:flex;align-items:center;gap:5px;margin-bottom:5px}
.pgc-body{font-size:clamp(9px,1.6vw,11px);line-height:1.68;color:var(--tx)}
.pgc-body.mu{color:var(--mu);font-style:italic}
.syn-block{margin:clamp(7px,1.5vw,12px);border:1px solid var(--ac);border-radius:9px;overflow:hidden;flex-shrink:0}
.syn-hdr{padding:9px clamp(10px,2vw,14px);background:linear-gradient(90deg,#1A1208,#0F0F13);display:flex;align-items:center;gap:7px;border-bottom:1px solid var(--ac)}
.syn-title{font-family:'Syne',sans-serif;font-size:clamp(10px,1.8vw,13px);font-weight:800;color:var(--ac)}
.syn-by{font-size:9px;color:var(--mu);margin-left:auto}
.syn-body{padding:clamp(9px,1.8vw,13px);font-size:clamp(10px,1.7vw,12px);line-height:1.72;color:var(--tx);background:var(--s1)}
.syn-body.mu{color:var(--mu);font-style:italic}
.debate-foot{padding:clamp(7px,1.5vw,11px) clamp(8px,2vw,14px);border-top:1px solid var(--bd);background:var(--bg);flex-shrink:0}
.launch-btn{background:var(--ac);color:#09090B;border:none;border-radius:6px;padding:0 clamp(11px,2.2vw,17px);height:clamp(30px,4.5vw,38px);font-family:'IBM Plex Mono',monospace;font-size:clamp(9px,1.6vw,11px);font-weight:600;cursor:pointer;transition:all .2s;white-space:nowrap;flex-shrink:0}
.launch-btn:hover{background:#E8BC6A}
.launch-btn:disabled{opacity:.36;cursor:not-allowed}
.prog-bar{height:3px;background:var(--bd);border-radius:2px;overflow:hidden;margin:5px clamp(8px,2vw,14px) 0}
.prog-fill{height:100%;background:var(--ac);border-radius:2px;transition:width .5s}
.prog-lbl{padding:3px clamp(8px,2vw,14px) 5px;font-size:8px;color:var(--mu)}
.cfg-wrap{flex:1;overflow-y:auto;padding:clamp(11px,2.2vw,18px);scrollbar-width:thin;scrollbar-color:var(--bd) transparent}
.sec-title{font-family:'Syne',sans-serif;font-size:clamp(10px,1.8vw,13px);font-weight:800;color:var(--ac);margin-bottom:10px;padding-bottom:5px;border-bottom:1px solid var(--bd);display:flex;align-items:center;gap:7px}
.sec{margin-bottom:20px}
.tbl-wrap{overflow-x:auto}
.tbl{width:100%;border-collapse:collapse;border:1px solid var(--bd);border-radius:7px;overflow:hidden;min-width:500px}
.tbl th{padding:5px 9px;background:var(--s1);font-size:8px;color:var(--mu);text-align:left;font-weight:600;letter-spacing:.8px;border-bottom:1px solid var(--bd)}
.tbl td{padding:7px 9px;border-bottom:1px solid var(--bd);font-size:clamp(9px,1.6vw,11px);vertical-align:middle}
.tbl tr:last-child td{border-bottom:none}
.tbl tr:hover td{background:var(--s1)}
.sbadge{display:inline-flex;align-items:center;gap:3px;padding:2px 6px;border-radius:3px;font-size:8px;font-weight:600}
.free-badge{display:inline-flex;padding:1px 4px;border-radius:3px;font-size:7px;font-weight:700;background:rgba(74,222,128,.12);color:var(--green);margin-left:3px}
.key-row{display:flex;gap:4px;align-items:center}
.key-inp{flex:1;background:var(--bg);border:1px solid var(--bd);border-radius:4px;color:var(--tx);font-family:'IBM Plex Mono',monospace;font-size:10px;padding:5px 7px;outline:none;min-width:0}
.key-inp:focus{border-color:var(--ac)}
.key-inp::placeholder{color:var(--mu)}
.key-link{color:var(--ac);text-decoration:none;font-size:8px;white-space:nowrap;border:1px solid var(--bd);padding:3px 6px;border-radius:3px}
.key-link:hover{border-color:var(--ac)}
.save-btn{background:var(--ac);color:#09090B;border:none;border-radius:3px;padding:4px 7px;font-family:'IBM Plex Mono',monospace;font-size:8px;font-weight:600;cursor:pointer;white-space:nowrap}
.save-btn:disabled{opacity:.35;cursor:not-allowed}
.file-btns{display:flex;gap:7px;flex-wrap:wrap}
.fbtn{display:flex;align-items:center;gap:5px;padding:clamp(6px,1.2vw,9px) clamp(9px,1.8vw,13px);border-radius:6px;font-family:'IBM Plex Mono',monospace;font-size:clamp(8px,1.6vw,10px);cursor:pointer;transition:all .2s;border:1px solid var(--bd);background:var(--s1);color:var(--tx)}
.fbtn:hover{border-color:var(--ac);color:var(--ac)}
.fbtn.p{background:var(--ac);color:#09090B;border-color:var(--ac);font-weight:600}
.fbtn.p:hover{background:#E8BC6A}
.cfg-note{font-size:clamp(8px,1.4vw,10px);color:var(--mu);line-height:1.6;margin-top:6px;padding:8px;background:var(--s1);border-radius:5px;border:1px solid var(--bd)}
.cfg-note code{color:var(--ac);background:var(--bg);padding:1px 4px;border-radius:3px;font-size:10px}
.ps-block{background:#0A0A0F;border:1px solid var(--bd);border-radius:7px;overflow:hidden;margin:8px 0}
.ps-hdr{padding:5px 12px;background:var(--s2);border-bottom:1px solid var(--bd);display:flex;align-items:center;justify-content:space-between}
.ps-lang{font-size:9px;color:var(--ac);font-weight:700;letter-spacing:.5px}
.ps-copy{font-size:9px;color:var(--mu);cursor:pointer;padding:2px 6px;border:1px solid var(--bd);border-radius:3px;background:transparent;font-family:'IBM Plex Mono',monospace}
.ps-copy:hover{color:var(--green);border-color:var(--green)}
.ps-code{padding:10px 14px;overflow-x:auto}
.ps-code pre{font-family:'IBM Plex Mono',monospace;font-size:11px;color:#C8C8E0;line-height:1.7;white-space:pre}
.ps-comment{color:#555568;font-style:italic}
.ps-cmd{color:var(--green)}
.ps-arg{color:var(--ac)}
.ps-str{color:#FB923C}
.status-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(90px,1fr));gap:5px}
.sc{padding:6px 9px;border-radius:6px;border:1px solid}
input[type=file]{display:none}
.toast{position:fixed;bottom:clamp(10px,2.5vw,18px);right:clamp(10px,2.5vw,18px);background:var(--s2);border:1px solid var(--bd);border-radius:7px;padding:7px 13px;font-size:11px;color:var(--tx);z-index:999;animation:tin .3s ease;display:flex;align-items:center;gap:7px;max-width:280px}
@keyframes tin{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
.ov{position:fixed;inset:0;background:rgba(0,0,0,.85);display:flex;align-items:center;justify-content:center;z-index:300;backdrop-filter:blur(5px);padding:16px}
.modal{background:#111116;border:1px solid var(--bd);border-radius:11px;padding:clamp(14px,2.5vw,22px);width:100%;max-width:360px}
.modal h3{font-family:'Syne',sans-serif;font-size:clamp(12px,2.2vw,15px);font-weight:700;margin-bottom:4px}
.modal p{font-size:clamp(9px,1.6vw,10px);color:var(--mu);margin-bottom:11px;line-height:1.6}
.modal a{color:var(--ac);text-decoration:none}
.modal input{width:100%;background:var(--bg);border:1px solid var(--bd);border-radius:5px;color:var(--tx);font-family:'IBM Plex Mono',monospace;font-size:12px;padding:8px 10px;outline:none;margin-bottom:11px}
.modal input:focus{border-color:var(--ac)}
.mbtns{display:flex;gap:7px;justify-content:flex-end}
.mbg{background:transparent;border:1px solid var(--bd);color:var(--mu);padding:5px 11px;border-radius:4px;font-family:'IBM Plex Mono',monospace;font-size:9px;cursor:pointer}
.mbs{background:var(--ac);border:none;color:#09090B;padding:5px 11px;border-radius:4px;font-family:'IBM Plex Mono',monospace;font-size:9px;font-weight:600;cursor:pointer}
.mbs:disabled{opacity:.36;cursor:not-allowed}
.exp-json{width:100%;background:var(--bg);border:1px solid var(--bd);border-radius:5px;color:var(--green);font-family:'IBM Plex Mono',monospace;font-size:9px;padding:8px;resize:none;outline:none;height:120px;margin-bottom:9px}
.copy-btn{background:var(--green);color:#09090B;border:none;padding:5px 11px;border-radius:4px;font-family:'IBM Plex Mono',monospace;font-size:9px;font-weight:600;cursor:pointer}
.arena-wrap{flex:1;overflow-y:auto;padding:clamp(10px,2vw,16px);scrollbar-width:thin;scrollbar-color:var(--bd) transparent}
.arena-hero{text-align:center;padding:clamp(14px,3vw,24px) 0 clamp(10px,2vw,18px);margin-bottom:clamp(10px,2vw,18px);border-bottom:1px solid var(--bd)}
.arena-title{font-family:'Syne',sans-serif;font-size:clamp(18px,3.5vw,26px);font-weight:800;color:var(--ac);margin-bottom:6px}
.arena-sub{font-size:clamp(9px,1.6vw,11px);color:var(--mu);line-height:1.7;max-width:600px;margin:0 auto}
.criteria-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(clamp(120px,18vw,180px),1fr));gap:8px;margin-bottom:clamp(12px,2.5vw,20px)}
.crit-card{background:var(--s1);border:1px solid var(--bd);border-radius:8px;padding:10px 12px}
.crit-icon{font-size:18px;margin-bottom:5px}
.crit-title{font-family:'Syne',sans-serif;font-size:10px;font-weight:700;color:var(--tx);margin-bottom:3px}
.crit-desc{font-size:9px;color:var(--mu);line-height:1.5}
.arena-tbl{width:100%;border-collapse:collapse;border:1px solid var(--bd);border-radius:8px;overflow:hidden;min-width:700px}
.arena-tbl th{padding:6px 10px;background:var(--s1);font-size:8px;color:var(--mu);text-align:left;font-weight:600;letter-spacing:.7px;border-bottom:1px solid var(--bd)}
.arena-tbl td{padding:8px 10px;border-bottom:1px solid var(--bd);font-size:clamp(9px,1.5vw,11px);vertical-align:middle}
.arena-tbl tr:last-child td{border-bottom:none}
.arena-tbl tr:hover td{background:rgba(255,255,255,.02)}
.score-bar{display:flex;align-items:center;gap:5px}
.score-num{font-weight:700;font-size:12px;min-width:28px}
.score-bg{flex:1;height:5px;background:var(--bd);border-radius:3px;overflow:hidden;min-width:40px}
.score-fill{height:100%;border-radius:3px}
.tag-badge{display:inline-flex;padding:1px 5px;border-radius:3px;font-size:7px;font-weight:700;letter-spacing:.5px;background:rgba(212,168,83,.12);color:var(--ac)}
.prix-badge{font-family:'IBM Plex Mono',monospace;font-size:10px}
.params-badge{font-family:'IBM Plex Mono',monospace;font-size:9px;color:var(--blue)}
.news-grid{display:flex;flex-direction:column;gap:8px;margin-top:10px}
.rss-wrap{background:var(--s1);border:1px solid var(--bd);border-radius:10px;overflow:hidden;margin-bottom:20px}
.rss-head{padding:10px 14px;background:linear-gradient(90deg,#0A0F0A,#0F0F13);border-bottom:1px solid var(--bd);display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.rss-title{font-family:'Syne',sans-serif;font-size:13px;font-weight:800;color:var(--green)}
.rss-src-tabs{display:flex;gap:4px;flex-wrap:wrap;flex:1}
.rss-stab{padding:2px 8px;border-radius:3px;font-size:8px;font-family:'IBM Plex Mono',monospace;cursor:pointer;border:1px solid var(--bd);background:transparent;color:var(--mu);transition:all .15s}
.rss-stab.on{background:var(--green);color:#09090B;border-color:var(--green);font-weight:700}
.rss-stab:hover{border-color:var(--green);color:var(--green)}
.rss-refresh{font-size:9px;color:var(--mu);cursor:pointer;padding:2px 7px;border:1px solid var(--bd);border-radius:3px;background:transparent;font-family:'IBM Plex Mono',monospace}
.rss-refresh:hover{color:var(--green);border-color:var(--green)}
.rss-loading{padding:20px;text-align:center;color:var(--mu);font-size:10px;font-style:italic}
.rss-err{padding:12px 14px;color:var(--orange);font-size:10px;background:rgba(251,146,60,.07)}
.rss-list{display:flex;flex-direction:column;gap:0}
.rss-item{display:flex;flex-direction:column;padding:12px 14px;border-bottom:1px solid var(--bd);text-decoration:none;transition:background .15s;cursor:pointer}
.rss-item:last-child{border-bottom:none}
.rss-item:hover{background:rgba(255,255,255,.03)}
.rss-item-hdr{display:flex;gap:8px;align-items:flex-start}
.rss-item-hdr-left{flex:1;min-width:0}
.rss-src-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;margin-top:4px}
.rss-body{flex:1;min-width:0}
.rss-ititle{font-size:clamp(10px,1.7vw,12px);font-weight:600;color:var(--tx);line-height:1.45;margin-bottom:4px}
.rss-item:hover .rss-ititle{color:var(--ac)}
.rss-meta{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.rss-site{font-size:8px;font-weight:700;padding:1px 5px;border-radius:3px}
.rss-date{font-size:8px;color:var(--mu)}
.rss-summary{font-size:clamp(9px,1.4vw,10px);color:var(--mu);line-height:1.6;margin-top:5px}
.rss-expand-body{margin-top:8px;padding-top:8px;border-top:1px solid var(--bd);display:flex;flex-direction:column;gap:7px}
.rss-detail{font-size:clamp(9px,1.4vw,10px);color:#9DB4CC;line-height:1.6}
.rss-impact{font-size:clamp(8px,1.3vw,9px);color:var(--green);padding:5px 8px;background:rgba(74,222,128,.06);border-radius:4px;border-left:2px solid var(--green)}
.rss-expand-footer{display:flex;align-items:center;gap:8px;margin-top:4px;flex-wrap:wrap}
.rss-gnews-btn{display:inline-flex;align-items:center;gap:4px;padding:4px 10px;background:rgba(212,168,83,.1);border:1px solid rgba(212,168,83,.3);border-radius:4px;color:var(--ac);font-size:9px;font-weight:600;text-decoration:none;font-family:'IBM Plex Mono',monospace;transition:all .2s}
.rss-gnews-btn:hover{background:rgba(212,168,83,.2)}
.rss-toggle{margin-left:auto;background:none;border:none;color:var(--mu);cursor:pointer;font-size:9px;font-family:'IBM Plex Mono',monospace;padding:2px 6px;border-radius:3px;transition:color .2s}
.rss-toggle:hover{color:var(--tx)}
.rss-arrow{font-size:11px;color:var(--mu);flex-shrink:0;margin-top:1px;transition:color .2s}
.rss-item:hover .rss-arrow{color:var(--ac)}
.live-dot{display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--green);animation:pulse 1.5s infinite;margin-right:5px}
.news-card{background:var(--s1);border:1px solid var(--bd);border-radius:8px;padding:10px 13px;display:flex;gap:10px}
.news-icon{font-size:20px;flex-shrink:0;margin-top:2px}
.news-body{flex:1}
.news-hdr{display:flex;align-items:center;gap:7px;margin-bottom:4px;flex-wrap:wrap}
.news-title{font-family:'Syne',sans-serif;font-size:clamp(10px,1.8vw,12px);font-weight:700}
.news-date{font-size:8px;color:var(--mu)}
.news-tag{padding:1px 5px;border-radius:3px;font-size:7px;font-weight:700;letter-spacing:.5px}
.news-text{font-size:clamp(9px,1.5vw,11px);color:var(--mu);line-height:1.6}
.img-wrap{flex:1;overflow-y:auto;padding:clamp(10px,2vw,16px);scrollbar-width:thin;scrollbar-color:var(--bd) transparent}
.img-filter{display:flex;gap:5px;flex-wrap:wrap;margin-bottom:clamp(10px,2vw,16px)}
.filter-btn{padding:4px 10px;border-radius:4px;font-size:9px;font-family:var(--font-ui);cursor:pointer;border:1px solid var(--bd);background:transparent;color:var(--mu);transition:all .2s}
.filter-btn.on{background:var(--ac);color:#09090B;border-color:var(--ac);font-weight:600}
.filter-btn:hover{border-color:var(--ac)}
.img-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(clamp(220px,28vw,300px),1fr));gap:clamp(8px,1.5vw,12px)}
.img-card{background:var(--s1);border:1px solid var(--bd);border-radius:10px;padding:clamp(12px,2vw,16px);display:flex;flex-direction:column;gap:10px;transition:border-color .2s,transform .15s}
.img-card:hover{transform:translateY(-2px)}
.img-card.oss{border-color:rgba(74,222,128,.2)}
.ic-hdr{display:flex;align-items:center;gap:9px}
.ic-icon{width:clamp(30px,4vw,40px);height:clamp(30px,4vw,40px);border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:clamp(14px,2.2vw,18px);flex-shrink:0}
.ic-name{font-family:'Syne',sans-serif;font-weight:700;font-size:clamp(11px,1.9vw,13px)}
.ic-sub{font-size:8px;color:var(--mu)}
.ic-free{display:inline-flex;padding:2px 7px;border-radius:4px;font-size:8px;font-weight:700}
.ic-meters{display:grid;grid-template-columns:repeat(3,1fr);gap:5px}
.meter-item{text-align:center}
.meter-lbl{font-size:7px;color:var(--mu);margin-bottom:3px}
.meter-bg{height:4px;background:var(--bd);border-radius:2px;overflow:hidden}
.meter-fill{height:100%;border-radius:2px}
.meter-val{font-size:8px;font-weight:700;margin-top:2px}
.ic-desc{font-size:clamp(9px,1.5vw,11px);color:var(--mu);line-height:1.55;flex:1}
.ic-strengths{display:flex;flex-wrap:wrap;gap:4px}
.ic-str{padding:1px 6px;border-radius:3px;font-size:8px;background:rgba(255,255,255,.05);border:1px solid var(--bd);color:var(--mu)}
.ic-limits{font-size:8px;color:var(--orange);padding:4px 7px;background:rgba(251,146,60,.07);border-radius:4px;border:1px solid rgba(251,146,60,.2)}
.ic-btn{display:flex;align-items:center;justify-content:center;gap:5px;padding:8px;border-radius:6px;border:1px solid;font-family:'IBM Plex Mono',monospace;font-size:9px;font-weight:600;cursor:pointer;background:transparent;text-decoration:none;transition:all .2s}
.ic-btn:hover{opacity:.8;transform:scale(1.01)}
.ic-tags{display:flex;flex-wrap:wrap;gap:3px}
.ic-tag{padding:1px 5px;border-radius:3px;font-size:7px;background:rgba(255,255,255,.04);border:1px solid var(--bd);color:var(--mu)}
.yt-wrap{flex:1;overflow-y:auto;padding:clamp(10px,2vw,16px);scrollbar-width:thin;scrollbar-color:var(--bd) transparent}
.yt-hero{display:flex;align-items:center;gap:12px;padding:clamp(12px,2vw,18px);background:linear-gradient(135deg,#0D0608,#100808,#0A0A0F);border:1px solid #330A0A;border-radius:10px;margin-bottom:clamp(12px,2vw,18px)}
.yt-hero-icon{font-size:clamp(28px,5vw,40px);flex-shrink:0}
.yt-hero-title{font-family:'Syne',sans-serif;font-size:clamp(16px,3vw,22px);font-weight:800;color:#FF6B6B;margin-bottom:4px}
.yt-hero-sub{font-size:clamp(9px,1.5vw,11px);color:var(--mu);line-height:1.6}
.yt-search-bar{display:flex;gap:8px;margin-bottom:clamp(10px,2vw,16px)}
.yt-search-inp{flex:1;background:var(--s1);border:1px solid var(--bd);border-radius:6px;color:var(--tx);font-family:'IBM Plex Mono',monospace;font-size:clamp(11px,1.8vw,13px);padding:8px 12px;outline:none}
.yt-search-inp:focus{border-color:#FF6B6B}
.yt-search-btn{background:#FF0000;color:#fff;border:none;border-radius:6px;padding:8px 16px;font-family:'IBM Plex Mono',monospace;font-size:11px;font-weight:600;cursor:pointer;white-space:nowrap;display:flex;align-items:center;gap:5px}
.yt-search-btn:hover{background:#CC0000}
.yt-sec-title{font-family:'Syne',sans-serif;font-weight:800;font-size:clamp(10px,1.8vw,12px);color:var(--tx);margin-bottom:10px;padding-bottom:5px;border-bottom:1px solid var(--bd);display:flex;align-items:center;gap:7px;letter-spacing:.5px}
.yt-ch-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(clamp(180px,22vw,240px),1fr));gap:clamp(7px,1.2vw,10px);margin-bottom:clamp(16px,3vw,24px)}
.yt-add-card{background:var(--s1);border:1px dashed var(--bd);border-radius:9px;padding:clamp(11px,1.8vw,14px);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;cursor:pointer;transition:all .2s;min-height:140px}
.yt-add-card:hover{border-color:#FF6B6B88;background:rgba(255,107,107,.05)}
.yt-add-card-icon{font-size:24px;color:var(--mu)}
.yt-add-card-label{font-size:10px;color:var(--mu);text-align:center;line-height:1.5}
.yt-add-modal{position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px}
.yt-add-modal-box{background:var(--s1);border:1px solid var(--bd);border-radius:12px;padding:20px;max-width:480px;width:100%;display:flex;flex-direction:column;gap:14px}
.yt-add-modal-title{font-family:'Syne',sans-serif;font-weight:800;font-size:15px;color:var(--tx)}
.yt-add-field{display:flex;flex-direction:column;gap:5px}
.yt-add-label{font-size:9px;font-weight:700;color:var(--mu);letter-spacing:.5px;text-transform:uppercase}
.yt-add-inp{background:var(--bg);border:1px solid var(--bd);border-radius:6px;color:var(--tx);font-family:'IBM Plex Mono',monospace;font-size:11px;padding:8px 10px;outline:none;transition:border-color .2s}
.yt-add-inp:focus{border-color:#FF6B6B}
.yt-add-row{display:flex;gap:8px}
.yt-add-colors{display:flex;gap:5px;flex-wrap:wrap}
.yt-add-color{width:22px;height:22px;border-radius:50%;cursor:pointer;border:2px solid transparent;transition:transform .15s}
.yt-add-color.sel{transform:scale(1.25);border-color:#fff}
.yt-custom-badge{font-size:7px;padding:1px 4px;background:rgba(255,107,107,.15);border:1px solid rgba(255,107,107,.3);border-radius:2px;color:#FF6B6B;font-weight:700}
.yt-ch-del{position:absolute;top:6px;right:6px;background:rgba(0,0,0,.6);border:none;border-radius:3px;color:var(--mu);cursor:pointer;font-size:10px;padding:2px 5px;opacity:0;transition:opacity .15s}
.yt-ch-card:hover .yt-ch-del{opacity:1}
.yt-ch-card:hover .yt-ch-del:hover{color:#FF6B6B}
.yt-ch-card{background:var(--s1);border:1px solid var(--bd);border-radius:9px;padding:clamp(11px,1.8vw,14px);display:flex;flex-direction:column;gap:8px;transition:border-color .2s,transform .15s;text-decoration:none}
.yt-ch-card:hover{transform:translateY(-2px)}
.yt-ch-hdr{display:flex;align-items:center;gap:8px}
.yt-ch-icon{width:clamp(28px,4vw,36px);height:clamp(28px,4vw,36px);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:clamp(13px,2vw,16px);flex-shrink:0;border:2px solid}
.yt-ch-name{font-family:'Syne',sans-serif;font-weight:700;font-size:clamp(9px,1.6vw,11px)}
.yt-ch-meta{display:flex;gap:5px;align-items:center;flex-wrap:wrap}
.yt-ch-lang{font-size:10px}
.yt-ch-subs{font-size:8px;color:var(--mu);padding:1px 4px;border-radius:2px;background:rgba(255,255,255,.05)}
.yt-ch-cat{font-size:7px;font-weight:700;padding:1px 5px;border-radius:3px;letter-spacing:.4px}
.yt-ch-desc{font-size:clamp(8px,1.4vw,10px);color:var(--mu);line-height:1.55;flex:1}
.yt-ch-btn{display:flex;align-items:center;justify-content:center;gap:4px;padding:6px;border-radius:5px;border:1px solid;font-family:'IBM Plex Mono',monospace;font-size:8px;font-weight:600;background:transparent;text-decoration:none;transition:all .2s}
.yt-ch-btn:hover{opacity:.8}
.yt-cat-filter{display:flex;gap:5px;flex-wrap:wrap;margin-bottom:12px}
.yt-vgrid{display:flex;flex-direction:column;gap:5px;margin-bottom:16px}
.yt-vcard{background:var(--s1);border:1px solid var(--bd);border-radius:8px;padding:clamp(9px,1.6vw,12px);display:flex;gap:10px;text-decoration:none;transition:background .15s,border-color .15s}
.yt-vcard:hover{background:var(--s2);border-color:#FF6B6B44}
.yt-vcard.important{border-left:3px solid #FF6B6B}
.yt-thumb{width:clamp(70px,12vw,90px);height:clamp(42px,7vw,54px);background:#1A0A0A;border-radius:5px;display:flex;align-items:center;justify-content:center;flex-shrink:0;border:1px solid #330A0A;position:relative;overflow:hidden}
.yt-play{font-size:clamp(16px,3vw,22px);color:#FF4444}
.yt-vbody{flex:1;min-width:0}
.yt-vtitle{font-size:clamp(10px,1.7vw,12px);font-weight:600;color:var(--tx);line-height:1.4;margin-bottom:4px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.yt-vcard:hover .yt-vtitle{color:#FF6B6B}
.yt-vmeta{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:3px}
.yt-vch{font-size:9px;font-weight:600;color:#FF6B6B}
.yt-vviews{font-size:8px;color:var(--mu)}
.yt-vdur{font-size:8px;color:var(--mu);padding:1px 4px;background:rgba(0,0,0,.4);border-radius:2px}
.yt-vdate{font-size:8px;color:var(--mu)}
.yt-vcat{font-size:7px;padding:1px 5px;border-radius:3px;font-weight:700}
.yt-vlang{font-size:10px}
.yt-vdesc{font-size:clamp(8px,1.4vw,10px);color:var(--mu);line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.yt-vstar{color:#FF6B6B;font-size:10px;flex-shrink:0}

/* ── THÈME CLAIR ── */
.light{--bg:#F5F5F7;--s1:#FFFFFF;--s2:#EAEAF0;--bd:#D0D0DC;--tx:#1A1A2E;--mu:#8888A0;--ac:#B8860B;--green:#16A34A;--red:#DC2626;--orange:#EA580C;--blue:#2563EB}
.light body{background:var(--bg)}
.light .nav{background:linear-gradient(180deg,#FFFFFF,#F5F5F7)}
.light .msg.u{background:#E8E8F0;color:var(--tx)}
.light .toast{background:#1A1A2E;color:#F5F5F7}

/* ── THEME TOGGLE ── */
.theme-btn{background:none;border:1px solid var(--bd);border-radius:5px;color:var(--mu);cursor:pointer;font-size:12px;padding:3px 7px;transition:all .15s;line-height:1}
.theme-btn:hover{border-color:var(--ac);color:var(--ac)}

/* ── PERSONA SELECTOR ── */
.persona-bar{padding:5px clamp(8px,2vw,14px);border-bottom:1px solid var(--bd);display:flex;align-items:center;gap:8px;flex-shrink:0;background:var(--s1);flex-wrap:wrap}
.persona-lbl{font-size:8px;color:var(--mu);font-weight:700;letter-spacing:.5px;text-transform:uppercase;white-space:nowrap}
.persona-chips{display:flex;gap:4px;flex-wrap:wrap;flex:1}
.persona-chip{padding:3px 9px;border-radius:20px;border:1px solid var(--bd);background:transparent;color:var(--mu);font-size:9px;cursor:pointer;font-family:'IBM Plex Mono',monospace;transition:all .15s;white-space:nowrap;display:flex;align-items:center;gap:4px}
.persona-chip.on{font-weight:600}
.persona-chip:hover{border-color:var(--ac);color:var(--ac)}
.persona-add{background:none;border:1px dashed var(--bd);border-radius:20px;color:var(--mu);font-size:9px;cursor:pointer;padding:3px 9px;font-family:'IBM Plex Mono',monospace;transition:all .15s}
.persona-add:hover{border-color:var(--ac);color:var(--ac)}

/* ── VOICE BUTTONS ── */
.voice-btn{background:none;border:1px solid var(--bd);border-radius:4px;cursor:pointer;font-size:11px;padding:2px 5px;transition:all .15s;color:var(--mu);line-height:1}
.voice-btn:hover{border-color:var(--blue);color:var(--blue)}
.voice-btn.listening{border-color:var(--red);color:var(--red);animation:pulse 1s infinite}
.voice-btn.speaking{border-color:var(--green);color:var(--green)}
.mic-btn{background:rgba(96,165,250,.1);border:1px solid rgba(96,165,250,.3);border-radius:5px;color:#60A5FA;cursor:pointer;font-size:13px;padding:4px 8px;transition:all .18s}
.mic-btn.on{background:rgba(248,113,113,.15);border-color:var(--red);color:var(--red);animation:pulse 1s infinite}
.mic-btn:hover{opacity:.8}

/* ── DOC UPLOAD ── */
.doc-zone{border:1.5px dashed var(--bd);border-radius:7px;padding:10px 14px;display:flex;align-items:center;gap:8px;font-size:9px;color:var(--mu);cursor:pointer;transition:all .2s;flex-shrink:0;margin:4px clamp(8px,2vw,14px)}
.doc-zone:hover{border-color:var(--ac);color:var(--ac)}
.doc-zone.has-file{border-color:var(--green);color:var(--green);background:rgba(74,222,128,.05)}
.doc-name{font-weight:600;color:var(--tx);max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.doc-clear{background:none;border:none;color:var(--red);cursor:pointer;font-size:12px;margin-left:auto}

/* ── RÉDACTION TAB ── */
.red-wrap{flex:1;display:flex;overflow:hidden}
.red-left{width:clamp(280px,35vw,420px);flex-shrink:0;border-right:1px solid var(--bd);display:flex;flex-direction:column;overflow:hidden}
.red-textarea{flex:1;resize:none;background:var(--bg);border:none;color:var(--tx);font-family:'IBM Plex Mono',monospace;font-size:clamp(10px,1.6vw,12px);line-height:1.7;padding:14px;outline:none}
.red-textarea::placeholder{color:var(--mu)}
.red-actions{padding:8px;border-top:1px solid var(--bd);display:flex;flex-wrap:wrap;gap:5px;background:var(--s1);flex-shrink:0}
.red-act-btn{padding:5px 10px;border-radius:5px;border:1px solid var(--bd);background:var(--s2);color:var(--tx);font-size:9px;cursor:pointer;font-family:'IBM Plex Mono',monospace;transition:all .15s;white-space:nowrap}
.red-act-btn:hover{border-color:var(--ac);color:var(--ac)}
.red-act-btn.active{border-color:var(--ac);background:rgba(212,168,83,.12);color:var(--ac);font-weight:600}
.red-right{flex:1;display:flex;flex-direction:column;overflow:hidden}
.red-results{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:12px;scrollbar-width:thin;scrollbar-color:var(--bd) transparent}
.red-result-card{background:var(--s1);border:1px solid var(--bd);border-radius:8px;overflow:hidden}
.red-result-hdr{padding:8px 12px;border-bottom:1px solid var(--bd);display:flex;align-items:center;gap:7px;flex-shrink:0}
.red-result-body{padding:12px;font-size:clamp(10px,1.6vw,12px);line-height:1.7;color:var(--tx);word-break:break-word}
.red-copy-btn{margin-left:auto;background:none;border:1px solid var(--bd);border-radius:3px;color:var(--mu);cursor:pointer;font-size:8px;padding:2px 6px;font-family:'IBM Plex Mono',monospace;transition:all .15s}
.red-copy-btn:hover{border-color:var(--ac);color:var(--ac)}
.red-placeholder{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:10px;color:var(--mu);font-size:11px;text-align:center;padding:20px}

/* ── RECHERCHE TAB ── */
.srch-wrap{flex:1;display:flex;flex-direction:column;overflow:hidden}
.srch-top{padding:clamp(10px,2vw,16px);border-bottom:1px solid var(--bd);flex-shrink:0;display:flex;flex-direction:column;gap:8px}
.srch-input-row{display:flex;gap:8px}
.srch-inp{flex:1;background:var(--s1);border:1px solid var(--bd);border-radius:7px;color:var(--tx);font-family:'IBM Plex Mono',monospace;font-size:clamp(11px,1.8vw,14px);padding:10px 14px;outline:none;transition:border-color .2s}
.srch-inp:focus{border-color:var(--ac)}
.srch-btn{background:var(--ac);border:none;border-radius:7px;color:#09090B;font-family:'IBM Plex Mono',monospace;font-size:11px;font-weight:700;padding:10px 18px;cursor:pointer;white-space:nowrap}
.srch-btn:hover{opacity:.85}
.srch-btn:disabled{opacity:.4;cursor:not-allowed}
.srch-results{flex:1;overflow-y:auto;padding:clamp(10px,2vw,16px);display:flex;flex-direction:column;gap:10px;scrollbar-width:thin;scrollbar-color:var(--bd) transparent}
.srch-card{background:var(--s1);border:1px solid var(--bd);border-radius:9px;overflow:hidden}
.srch-card-hdr{padding:8px 12px;border-bottom:1px solid var(--bd);display:flex;align-items:center;gap:7px}
.srch-card-body{padding:12px;font-size:clamp(10px,1.6vw,12px);line-height:1.75;color:var(--tx);word-break:break-word;max-height:300px;overflow-y:auto}
.srch-suggestions{display:flex;gap:5px;flex-wrap:wrap}

/* ── PROMPTS TAB ── */
.prom-wrap{flex:1;overflow-y:auto;padding:clamp(10px,2vw,16px);scrollbar-width:thin;scrollbar-color:var(--bd) transparent}
.prom-hdr{display:flex;align-items:center;gap:10px;margin-bottom:14px;flex-wrap:wrap}
.prom-cats{display:flex;gap:4px;flex-wrap:wrap}
.prom-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(clamp(240px,30vw,320px),1fr));gap:9px;margin-top:10px}
.prom-card{background:var(--s1);border:1px solid var(--bd);border-radius:8px;padding:12px;display:flex;flex-direction:column;gap:8px;transition:border-color .2s}
.prom-card:hover{border-color:var(--ac)}
.prom-card.custom{border-left:2px solid var(--ac)}
.prom-card-hdr{display:flex;align-items:flex-start;gap:8px}
.prom-icon{font-size:16px;flex-shrink:0;line-height:1}
.prom-title{font-size:11px;font-weight:600;color:var(--tx);line-height:1.35;flex:1}
.prom-cat-badge{font-size:7px;padding:1px 5px;border-radius:3px;background:rgba(212,168,83,.12);color:var(--ac);font-weight:700;white-space:nowrap;flex-shrink:0}
.prom-preview{font-size:9px;color:var(--mu);line-height:1.55;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;flex:1}
.prom-btns{display:flex;gap:5px;margin-top:auto}
.prom-inject{flex:1;padding:5px 8px;background:rgba(212,168,83,.1);border:1px solid rgba(212,168,83,.3);border-radius:5px;color:var(--ac);font-size:9px;font-weight:700;cursor:pointer;font-family:'IBM Plex Mono',monospace;transition:all .15s}
.prom-inject:hover{background:rgba(212,168,83,.2)}
.prom-del{padding:5px 7px;background:none;border:1px solid var(--bd);border-radius:5px;color:var(--mu);font-size:9px;cursor:pointer;font-family:'IBM Plex Mono',monospace}
.prom-del:hover{border-color:var(--red);color:var(--red)}
.prom-add-card{background:var(--s1);border:1.5px dashed var(--bd);border-radius:8px;padding:16px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;cursor:pointer;transition:all .2s;min-height:120px}
.prom-add-card:hover{border-color:var(--ac);background:rgba(212,168,83,.04)}

/* ── WORKFLOWS TAB ── */
.wf-wrap{flex:1;display:flex;overflow:hidden}
.wf-left{width:clamp(280px,35vw,380px);border-right:1px solid var(--bd);display:flex;flex-direction:column;overflow:hidden;flex-shrink:0}
.wf-steps{flex:1;overflow-y:auto;padding:10px;display:flex;flex-direction:column;gap:6px;scrollbar-width:thin;scrollbar-color:var(--bd) transparent}
.wf-step{background:var(--s1);border:1px solid var(--bd);border-radius:8px;padding:10px;display:flex;flex-direction:column;gap:6px;position:relative}
.wf-step.done{border-color:var(--green)}
.wf-step.running{border-color:var(--ac);animation:borderPulse 1.5s infinite}
@keyframes borderPulse{0%,100%{border-color:var(--ac)}50%{border-color:transparent}}
.wf-step-num{width:20px;height:20px;border-radius:50%;background:var(--ac);color:#09090B;font-size:9px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.wf-step-hdr{display:flex;align-items:center;gap:7px}
.wf-step-label{font-size:10px;font-weight:600;color:var(--tx);flex:1}
.wf-step-ia{font-size:8px;color:var(--mu);padding:1px 5px;border-radius:3px;border:1px solid var(--bd)}
.wf-right{flex:1;display:flex;flex-direction:column;overflow:hidden}
.wf-output{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;scrollbar-width:thin;scrollbar-color:var(--bd) transparent}
.wf-out-card{background:var(--s1);border:1px solid var(--bd);border-radius:8px;overflow:hidden}
.wf-out-hdr{padding:7px 12px;border-bottom:1px solid var(--bd);display:flex;align-items:center;gap:7px;background:var(--s2)}
.wf-out-body{padding:12px;font-size:clamp(10px,1.6vw,12px);line-height:1.7;word-break:break-word;max-height:250px;overflow-y:auto}
.wf-run-btn{margin:10px;padding:10px;background:var(--ac);border:none;border-radius:7px;color:#09090B;font-family:'Syne',sans-serif;font-weight:800;font-size:12px;cursor:pointer;transition:opacity .15s}
.wf-run-btn:hover{opacity:.85}
.wf-run-btn:disabled{opacity:.4;cursor:not-allowed}

/* ── STATS TAB ── */
.stats-wrap{flex:1;overflow-y:auto;padding:clamp(10px,2vw,16px);scrollbar-width:thin;scrollbar-color:var(--bd) transparent}
.stats-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(clamp(160px,20vw,220px),1fr));gap:10px;margin-bottom:18px}
.stat-card{background:var(--s1);border:1px solid var(--bd);border-radius:9px;padding:clamp(12px,2vw,16px);display:flex;flex-direction:column;gap:5px}
.stat-val{font-family:'Syne',sans-serif;font-weight:800;font-size:clamp(22px,4vw,30px);color:var(--ac)}
.stat-lbl{font-size:9px;color:var(--mu);text-transform:uppercase;letter-spacing:.5px}
.stat-sub{font-size:9px;color:var(--tx)}
.stats-bar-section{margin-bottom:18px}
.stats-bar-row{display:flex;align-items:center;gap:8px;margin-bottom:6px}
.stats-bar-name{font-size:10px;color:var(--tx);width:clamp(70px,12vw,110px);flex-shrink:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.stats-bar-track{flex:1;height:10px;background:var(--bd);border-radius:5px;overflow:hidden}
.stats-bar-fill{height:100%;border-radius:5px;transition:width .6s}
.stats-bar-val{font-size:8px;color:var(--mu);width:60px;text-align:right;flex-shrink:0}
.cost-section{background:var(--s1);border:1px solid var(--bd);border-radius:9px;padding:14px;margin-bottom:18px}
.cost-row{display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--bd)}
.cost-row:last-child{border-bottom:none}

/* ── MEDIAS TAB (YouTube+Images merge) ── */
.media-subtabs{display:flex;gap:0;border-bottom:1px solid var(--bd);flex-shrink:0}
.media-stab{flex:1;padding:8px;text-align:center;font-size:11px;font-family:'IBM Plex Mono',monospace;border:none;cursor:pointer;transition:all .15s;color:var(--mu);background:var(--s1)}
.media-stab.on{color:var(--ac);font-weight:700;border-bottom:2px solid var(--ac)}
.media-content{flex:1;overflow:hidden;display:flex;flex-direction:column}

/* ═══════════════════════════════════════════════════════════════
   MOBILE PWA — Expérience native complète
   ═══════════════════════════════════════════════════════════════ */

/* ── Base mobile / safe areas ── */
*{ -webkit-tap-highlight-color: transparent; }
html, body{
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: none;
  -webkit-text-size-adjust: 100%;
  text-size-adjust: 100%;
  touch-action: manipulation;
}
.app{
  /* Respecte le notch, la home bar, etc. */
  padding-top: env(safe-area-inset-top, 0px);
  padding-left: env(safe-area-inset-left, 0px);
  padding-right: env(safe-area-inset-right, 0px);
  /* padding-bottom géré par la tab bar fixe */
}

/* ══ NOTES TAB ══ */
.notes-wrap{flex:1;display:flex;overflow:hidden}
.notes-list{width:200px;flex-shrink:0;border-right:1px solid var(--bd);display:flex;flex-direction:column;background:var(--s1)}
.notes-list-hdr{padding:10px 12px;border-bottom:1px solid var(--bd);display:flex;align-items:center;gap:6px;flex-shrink:0}
.notes-list-hdr span{flex:1;font-size:10px;font-weight:700;color:var(--ac)}
.notes-new-btn{background:var(--ac);border:none;border-radius:4px;color:#09090B;font-size:11px;padding:4px 8px;cursor:pointer;font-weight:700}
.notes-item{padding:10px 12px;border-bottom:1px solid var(--bd);cursor:pointer;transition:background .15s}
.notes-item:hover{background:var(--s2)}.notes-item.on{background:rgba(212,168,83,.1);border-left:2px solid var(--ac)}
.notes-item-title{font-size:11px;color:var(--tx);font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.notes-item-date{font-size:8px;color:var(--mu);margin-top:2px}
.notes-editor{flex:1;display:flex;flex-direction:column;overflow:hidden}
.notes-editor-hdr{padding:8px 12px;border-bottom:1px solid var(--bd);display:flex;align-items:center;gap:8px;flex-shrink:0;background:var(--s1)}
.notes-title-inp{flex:1;background:none;border:none;color:var(--tx);font-size:13px;font-weight:700;font-family:'Syne',sans-serif;outline:none}
.notes-del-btn{background:none;border:1px solid var(--bd);border-radius:4px;color:var(--mu);font-size:10px;padding:3px 8px;cursor:pointer}
.notes-del-btn:hover{color:var(--red);border-color:var(--red)}
.notes-textarea{flex:1;background:transparent;border:none;color:var(--tx);font-family:'IBM Plex Mono',monospace;font-size:12px;padding:16px;resize:none;outline:none;line-height:1.7}
.notes-toolbar{padding:6px 12px;border-top:1px solid var(--bd);display:flex;gap:6px;flex-wrap:wrap;flex-shrink:0;background:var(--s1)}
.notes-tbtn{background:none;border:1px solid var(--bd);border-radius:4px;color:var(--mu);font-size:10px;padding:4px 10px;cursor:pointer;transition:all .15s}
.notes-tbtn:hover{color:var(--ac);border-color:var(--ac)}
/* ══ FILE UPLOAD ══ */
.attach-btn{background:none;border:1px solid var(--bd);border-radius:6px;color:var(--mu);font-size:14px;padding:0 10px;cursor:pointer;display:flex;align-items:center;justify-content:center;min-height:36px;transition:all .15s;flex-shrink:0}
.attach-btn:hover{color:var(--ac);border-color:var(--ac)}
.attach-preview{display:flex;align-items:center;gap:6px;padding:5px 10px;background:rgba(212,168,83,.1);border:1px solid rgba(212,168,83,.3);border-radius:6px;font-size:10px;color:var(--ac);margin:0 4px 4px}
.attach-preview button{background:none;border:none;color:var(--mu);cursor:pointer;font-size:12px;padding:0 2px}
.attach-preview button:hover{color:var(--red)}
.msg-file-badge{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;background:rgba(212,168,83,.1);border:1px solid rgba(212,168,83,.3);border-radius:4px;font-size:9px;color:var(--ac);margin-bottom:4px;cursor:pointer}
/* ══ AGENT AUTONOME ══ */
.agent-wrap{flex:1;display:flex;flex-direction:column;overflow:hidden}
.agent-hdr{padding:14px 16px;border-bottom:1px solid var(--bd);flex-shrink:0;background:var(--s1)}
.agent-body{flex:1;overflow-y:auto;padding:12px 16px}
.agent-step-card{background:var(--s1);border:1px solid var(--bd);border-radius:8px;padding:12px 14px;margin-bottom:10px;transition:border-color .3s}
.agent-step-card.running{border-color:var(--ac);animation:pulse-border 1.5s infinite}
.agent-step-card.done{border-color:rgba(74,222,128,.4)}
@keyframes pulse-border{0%,100%{border-color:var(--ac)}50%{border-color:rgba(212,168,83,.2)}}
.agent-step-output{font-size:11px;color:var(--mu);line-height:1.65;white-space:pre-wrap;max-height:180px;overflow-y:auto;margin-top:6px}
.agent-final{background:linear-gradient(135deg,rgba(212,168,83,.08),rgba(74,222,128,.04));border:1px solid rgba(212,168,83,.3);border-radius:8px;padding:14px;margin-top:10px}
.agent-final-content{font-size:12px;color:var(--tx);line-height:1.7}
/* ══ TRADUCTEUR ══ */
.trad-wrap{flex:1;display:flex;overflow:hidden}
.trad-left{width:48%;border-right:1px solid var(--bd);display:flex;flex-direction:column}
.trad-right{flex:1;display:flex;flex-direction:column;overflow-y:auto}
.trad-lang-bar{padding:8px 10px;border-bottom:1px solid var(--bd);display:flex;align-items:center;gap:5px;flex-shrink:0;background:var(--s1);flex-wrap:wrap}
.trad-lang-btn{padding:4px 10px;border-radius:5px;border:1px solid var(--bd);font-size:10px;cursor:pointer;background:transparent;color:var(--mu);transition:all .15s}
.trad-lang-btn.on{background:var(--ac);border-color:var(--ac);color:#09090B;font-weight:700}
.trad-textarea{flex:1;background:transparent;border:none;color:var(--tx);font-family:'IBM Plex Mono',monospace;font-size:13px;padding:14px;resize:none;outline:none;line-height:1.7;min-height:120px}
.trad-run-btn{margin:8px;background:var(--ac);border:none;border-radius:6px;color:#09090B;font-family:'Syne',sans-serif;font-weight:800;font-size:11px;padding:9px 18px;cursor:pointer;align-self:flex-end}
.trad-result-card{padding:12px 14px;border-bottom:1px solid var(--bd)}
/* ══ VIDEO HOVER PLAY ══ */
.yt-vcard{position:relative}
.yt-play-overlay{position:absolute;top:0;left:0;right:0;height:90px;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;border-radius:8px 8px 0 0;opacity:0;transition:opacity .2s;pointer-events:none}
.yt-vcard:hover .yt-play-overlay{opacity:1}
.yt-play-big{font-size:28px}
@media(max-width:767px){
  .notes-list{display:none}
  .trad-wrap{flex-direction:column}
  .trad-left{width:100%;border-right:none;border-bottom:1px solid var(--bd);max-height:40vh}
}

/* ── MOBILE BOTTOM TAB BAR ── */
.mobile-tabbar{ display:none; }

@media(max-width:767px){
  /* Masquer la nav top sur mobile (remplacée par bottom tabbar) */
  .nav{ display:none !important; }
  
  /* ── App header mobile ── */
  .mobile-header{
    display:flex !important;
    align-items:center;
    padding:0 12px;
    padding-top: max(10px, env(safe-area-inset-top));
    height: calc(44px + env(safe-area-inset-top));
    background:var(--s1);
    border-bottom:1px solid var(--bd);
    flex-shrink:0;
    gap:10px;
    z-index:50;
  }
  .mobile-header-title{
    font-family:'Syne',sans-serif; font-weight:800; font-size:15px; color:var(--ac); flex:1;
  }
  .mobile-header-subtitle{
    font-size:9px; color:var(--mu); font-family:'IBM Plex Mono',monospace;
  }
  .mh-btn{
    background:none; border:1px solid var(--bd); border-radius:6px; color:var(--mu);
    padding:5px 8px; font-size:11px; cursor:pointer; min-width:34px; min-height:34px;
    display:flex; align-items:center; justify-content:center;
  }
  .mh-btn.on{ border-color:var(--ac); color:var(--ac); }

  /* ── Persona bar mobile ── */
  .persona-bar{ overflow-x:auto; scrollbar-width:none; padding:5px 10px; }
  .persona-bar::-webkit-scrollbar{ display:none; }
  .persona-chips{ flex-wrap:nowrap; }

  /* ── Tab content padding pour la tabbar ── */
  .tab-content-mobile{ padding-bottom: calc(65px + env(safe-area-inset-bottom)); }

  /* ── CHAT : une colonne à la fois avec sélecteur ── */
  .cols{ flex-direction:column; overflow:hidden; }
  .col{
    flex:none !important;
    width:100% !important;
    min-width:0 !important;
    border-right:none !important;
    border-bottom:none !important;
    display:none; /* caché par défaut, visible via JS */
    opacity:1 !important;
    filter:none !important;
  }
  .col.mobile-active{ display:flex !important; flex:1 !important; }
  
  /* Sélecteur IA en haut du chat (chips scrollables) */
  .mobile-ia-selector{
    display:flex !important;
    overflow-x:auto; scrollbar-width:none;
    padding:8px 10px; gap:8px; flex-shrink:0;
    background:var(--s1); border-bottom:2px solid var(--bd);
    align-items:center;
  }
  .mobile-ia-selector::-webkit-scrollbar{ display:none; }
  .mobile-ia-chip{
    flex-shrink:0; padding:8px 16px; border-radius:8px; border:2px solid;
    font-size:13px; font-weight:600; cursor:pointer; font-family:'IBM Plex Mono',monospace;
    transition:all .15s; background:var(--s2); white-space:nowrap;
    display:flex; align-items:center; gap:6px; min-height:42px;
    color: var(--tx);
  }
  .mobile-ia-chip.active{
    font-weight:800;
    box-shadow: 0 0 12px rgba(255,255,255,.1);
    transform: scale(1.04);
  }

  /* ── Input chat mobile ── */
  .foot{ padding:8px 10px calc(8px + env(safe-area-inset-bottom)) !important; }
  .ta-wrap textarea{ font-size:16px !important; } /* 16px évite le zoom iOS */
  .sbtn{ min-height:40px !important; min-width:40px !important; }
  .gbtn, .mic-btn{ min-height:40px !important; }

  /* ── Rédaction mobile ── */
  .red-wrap{ flex-direction:column; }
  .red-left{ width:100% !important; border-right:none; border-bottom:1px solid var(--bd); max-height:45vh; flex-shrink:0; }
  .red-textarea{ font-size:15px !important; }
  .red-actions{ overflow-x:auto; flex-wrap:nowrap; }

  /* ── Workflow mobile ── */
  .wf-wrap{ flex-direction:column; }
  .wf-left{ width:100% !important; border-right:none; border-bottom:1px solid var(--bd); max-height:50vh; overflow-y:auto; flex-shrink:0; }

  /* ── Recherche mobile ── */
  .srch-inp{ font-size:16px !important; }

  /* ── Stats & Prompts mobile ── */
  .stats-grid{ grid-template-columns:1fr 1fr !important; }
  .prom-grid{ grid-template-columns:1fr !important; }

  /* ── YouTube grid mobile ── */
  .yt-ch-grid{ grid-template-columns:1fr 1fr !important; }

  /* ── Arène mobile ── */
  .arena-wrap{ padding:10px; }
  .arena-table td, .arena-table th{ padding:5px 4px !important; font-size:9px !important; }

  /* ── Messages taille tactile ── */
  .msg{ font-size:14px !important; line-height:1.65 !important; padding:10px 12px !important; }
  .voice-btn{ min-height:32px !important; min-width:32px !important; font-size:14px !important; }

  /* ── Hist sidebar mobile (drawer) ── */
  .hist-sidebar{
    position:fixed !important; z-index:300; top:0; left:0; bottom:0;
    width:85vw !important; max-width:320px;
    box-shadow:4px 0 30px rgba(0,0,0,.7);
    transform:translateX(-100%); transition:transform .28s cubic-bezier(.4,0,.2,1);
  }
  .hist-sidebar.open{
    transform:translateX(0) !important;
  }
  .hist-overlay{
    display:none;
    position:fixed; inset:0; background:rgba(0,0,0,.55); z-index:299;
  }
  .hist-overlay.open{ display:block; }
  
  /* ── Cards arena mobile ── */
  .arena-card{ padding:10px !important; }
  
  /* ── Débat mobile ── */
  .debate-cols{ flex-direction:column !important; }
  
  /* ── Masquer des éléments sur mobile ── */
  .tbar{ display:none !important; }
  .hide-mobile{ display:none !important; }
}

@media(max-width:767px){
  .mobile-tabbar{
    display:flex !important;
    position:fixed; bottom:0; left:0; right:0;
    background:var(--s1);
    border-top:1px solid var(--bd);
    padding:5px 0 calc(5px + env(safe-area-inset-bottom));
    z-index:250;
    backdrop-filter:blur(12px);
    -webkit-backdrop-filter:blur(12px);
  }
  .mobile-tab-btn{
    flex:1; display:flex; flex-direction:column; align-items:center; gap:2px;
    background:none; border:none; cursor:pointer; padding:5px 2px;
    color:var(--mu); font-size:8px; font-family:'IBM Plex Mono',monospace;
    transition:all .18s; -webkit-tap-highlight-color:transparent;
  }
  .mobile-tab-btn .ico{ font-size:19px; line-height:1; transition:transform .18s; }
  .mobile-tab-btn.on{ color:var(--ac); }
  .mobile-tab-btn.on .ico{ transform:scale(1.15); }
  .mobile-tab-btn:active{ transform:scale(.92); }
}

/* ── Scrolling tactile amélioré partout ── */
.msgs, .prom-wrap, .stats-wrap, .srch-results, .red-results, .wf-output,
.yt-ch-grid, .img-wrap, .arena-wrap, .red-left, .wf-left, .wf-steps{
  -webkit-overflow-scrolling: touch;
}

/* ── Boutons tactiles 44pt minimum ── */
@media(hover:none) and (pointer:coarse){
  button{ min-height:40px; }
  .sbtn, .gbtn, .mic-btn, .wf-run-btn{ min-height:44px !important; }
  .nt, .prom-inject, .red-act-btn{ min-height:38px !important; }
  .persona-chip, .filter-btn{ min-height:36px !important; }
  .mobile-tab-btn{ min-height:50px !important; }
  /* Espacer les liens pour le toucher */
  .yt-link{ padding:8px !important; }
}

/* ── PWA Standalone — ajustements ── */
@media(display-mode:standalone){
  /* L'app tourne en standalone = vraie app */
  .app{
    padding-top: env(safe-area-inset-top, 0px);
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }
  /* Titre dans le header standalone */
  .pwa-standalone-badge{ display:inline-block !important; }
}

/* ── Animations fluides (prefers-reduced-motion) ── */
@media(prefers-reduced-motion:reduce){
  *, *::before, *::after{
    animation-duration:.01ms !important;
    transition-duration:.01ms !important;
  }
}

/* ── Desktop (garde l'ancien comportement) ── */
@media(min-width:768px) and (hover:hover){
  .mobile-header{ display:none; }
  .mobile-ia-selector{ display:none; }
  .mobile-tabbar{ display:none; }
  .hist-overlay{ display:none !important; }
  .col{ display:flex; }
  .hist-sidebar{ position:relative !important; transform:none !important; box-shadow:none !important; }
}

/* ── Toast mobile (repositionné au dessus de la tabbar) ── */
@media(max-width:767px){
  .toast{ bottom:calc(70px + env(safe-area-inset-bottom)) !important; }
  .pwa-banner{ bottom:calc(60px + env(safe-area-inset-bottom)) !important; }
}

/* ── Tablet (768-1024px) ── */
@media(min-width:768px) and (max-width:1024px){
  .cols{ flex-wrap:nowrap; overflow-x:auto; }
  .col{ min-width:280px !important; }
  .prom-grid{ grid-template-columns:1fr 1fr !important; }
  .stats-grid{ grid-template-columns:1fr 1fr 1fr !important; }
}

/* ── Offline indicator ── */
.offline-bar{
  display:none; position:fixed; top:0; left:0; right:0; z-index:9999;
  background:linear-gradient(90deg,#78350F,#92400E);
  color:#FDE68A; font-family:'IBM Plex Mono',monospace; font-size:10px;
  padding:6px 12px; text-align:center; letter-spacing:.5px;
  animation:slideDown .3s ease;
}
@keyframes slideDown{ from{transform:translateY(-100%)} to{transform:translateY(0)} }
.offline-bar.show{ display:block; }

/* ── Loading skeleton (offline UX) ── */
.skeleton{
  background:linear-gradient(90deg,var(--s1) 25%,var(--s2) 50%,var(--s1) 75%);
  background-size:200% 100%;
  animation:shimmer 1.5s infinite;
  border-radius:4px;
}
@keyframes shimmer{ 0%{background-position:200% 0} 100%{background-position:-200% 0} }

/* ── Pull-to-refresh visuel ── */
.ptr-indicator{
  position:absolute; top:-50px; left:0; right:0;
  display:flex; align-items:center; justify-content:center;
  color:var(--ac); font-size:11px; font-family:'IBM Plex Mono',monospace; gap:6px;
  transition:top .2s;
}
.ptr-indicator.visible{ top:8px; }

/* ── PWA Install Banner ── */
.pwa-banner{
  position:fixed; bottom:0; left:0; right:0; z-index:500;
  background:linear-gradient(135deg,#1A1208,#0F0F13);
  border-top:1px solid var(--ac);
  padding:12px clamp(12px,4vw,20px) calc(12px + env(safe-area-inset-bottom));
  display:flex; align-items:center; gap:12px;
  animation:slideUp .4s ease;
}
@keyframes slideUp{ from{transform:translateY(100%)} to{transform:translateY(0)} }
.pwa-banner-icon{ font-size:28px; flex-shrink:0; }
.pwa-banner-text{ flex:1 }
.pwa-banner-title{ font-family:'Syne',sans-serif; font-weight:800; font-size:13px; color:var(--ac); }
.pwa-banner-sub{ font-size:10px; color:var(--mu); margin-top:2px; }
.pwa-install-btn{
  background:var(--ac); border:none; border-radius:7px; color:#09090B;
  font-family:'Syne',sans-serif; font-weight:800; font-size:11px;
  padding:9px 16px; cursor:pointer; white-space:nowrap; flex-shrink:0;
}
.pwa-dismiss-btn{
  background:none; border:1px solid var(--bd); border-radius:5px; color:var(--mu);
  font-size:10px; padding:6px 10px; cursor:pointer; flex-shrink:0;
  font-family:'IBM Plex Mono',monospace;
}
/* ══════════════════════════════════════════════════════
   MARKDOWN RENDERER
   ══════════════════════════════════════════════════════ */
.mem-panel{position:fixed;top:0;left:0;bottom:0;width:min(320px,90vw);background:var(--bg);border-right:1px solid var(--bd);z-index:9991;display:flex;flex-direction:column;box-shadow:8px 0 40px rgba(0,0,0,.5);transition:transform .25s}
.mem-hdr{padding:10px 14px;border-bottom:1px solid var(--bd);display:flex;align-items:center;gap:8px;background:var(--s1);flex-shrink:0}
.mem-list{flex:1;overflow-y:auto;padding:10px;display:flex;flex-direction:column;gap:6px}
.mem-fact{background:var(--s2);border:1px solid var(--bd);border-radius:6px;padding:8px 10px;display:flex;align-items:flex-start;gap:8px;font-size:10px;color:var(--tx);line-height:1.5}
.mem-fact-del{background:none;border:none;color:var(--mu);cursor:pointer;font-size:12px;padding:0 2px;flex-shrink:0;margin-top:1px;line-height:1}
.mem-fact-del:hover{color:var(--red)}
.canvas-panel{position:fixed;top:0;right:0;bottom:0;width:min(540px,50vw);background:var(--bg);border-left:1px solid var(--bd);z-index:9990;display:flex;flex-direction:column;box-shadow:-8px 0 40px rgba(0,0,0,.5)}
.canvas-hdr{padding:10px 14px;border-bottom:1px solid var(--bd);display:flex;align-items:center;gap:8px;background:var(--s1);flex-shrink:0}
.canvas-iframe{flex:1;border:none;background:#fff}
@media(max-width:768px){.canvas-panel{width:100vw;top:50vh}}
.zen-mode .nav,.zen-mode .hist-sidebar,.zen-mode .mobile-header,.zen-mode .mobile-ia-selector{display:none !important}
.zen-mode .chat-area{flex:1}
.zen-mode .col-cmds{display:none !important}
.zen-mode-btn{position:fixed;bottom:18px;right:18px;z-index:9998;width:36px;height:36px;background:rgba(212,168,83,.15);border:1px solid rgba(212,168,83,.4);border-radius:50%;color:var(--ac);font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(6px);transition:background .2s}
.zen-mode-btn:hover{background:rgba(212,168,83,.3)}

/* ── Prism.js dark theme override ── */
.token.comment,.token.prolog,.token.doctype,.token.cdata{color:#6B6B85!important;font-style:italic}
.token.keyword,.token.selector,.token.important,.token.atrule{color:#C084FC!important}
.token.string,.token.attr-value,.token.char,.token.builtin{color:#FB923C!important}
.token.number,.token.boolean,.token.constant,.token.symbol{color:#60A5FA!important}
.token.operator,.token.entity,.token.url,.token.variable{color:#94A3B8!important}
.token.function,.token.class-name{color:#34D399!important}
.token.tag,.token.attr-name{color:#F472B6!important}
pre[class*="language-"],code[class*="language-"]{background:none!important;text-shadow:none!important}

.cot-block{margin-bottom:8px;border:1px solid rgba(96,165,250,.2);border-radius:5px;overflow:hidden}
.cot-toggle{width:100%;display:flex;align-items:center;gap:6px;padding:5px 9px;background:rgba(96,165,250,.06);border:none;cursor:pointer;color:var(--blue);font-family:'IBM Plex Mono',monospace;font-size:8.5px;text-align:left}
.cot-toggle:hover{background:rgba(96,165,250,.12)}
.cot-body{padding:8px 10px;background:rgba(96,165,250,.03);color:var(--mu);line-height:1.6;white-space:pre-wrap;font-family:'IBM Plex Mono',monospace;font-size:8px;max-height:220px;overflow-y:auto;border-top:1px solid rgba(96,165,250,.15)}
.md{line-height:1.72;font-size:inherit}
.md-h1{font-family:'Syne',sans-serif;font-size:clamp(13px,2.1vw,16px);font-weight:800;color:var(--ac);margin:10px 0 5px;border-bottom:1px solid var(--bd);padding-bottom:4px}
.md-h2{font-family:'Syne',sans-serif;font-size:clamp(11px,1.8vw,14px);font-weight:700;color:var(--tx);margin:8px 0 4px}
.md-h3{font-family:'Syne',sans-serif;font-size:clamp(10px,1.6vw,12px);font-weight:700;color:var(--blue);margin:6px 0 3px}
.md-p{margin:2px 0;line-height:1.72}
.md-p:empty{display:none}
.md-list{margin:4px 0 4px 18px;padding:0;display:flex;flex-direction:column;gap:2px}
.md-list li{font-size:inherit;color:var(--tx);line-height:1.65}
.md ul.md-list{list-style:disc}
.md ol.md-list{list-style:decimal}
.md-hr{border:none;border-top:1px solid var(--bd);margin:8px 0}
.md-bq{border-left:3px solid var(--ac);padding:4px 10px;margin:5px 0;background:rgba(212,168,83,.07);border-radius:0 4px 4px 0;color:var(--mu);font-style:italic;font-size:.95em}
.md-ic{background:var(--bg);border:1px solid rgba(255,255,255,.1);border-radius:3px;padding:1px 5px;font-family:'IBM Plex Mono',monospace;font-size:.88em;color:#FB923C}
.md-link{color:var(--ac);text-decoration:none}
.md-link:hover{text-decoration:underline}
.md strong{font-weight:700;color:var(--tx)}
.md em{font-style:italic;color:#BDB9D0}
.md del{text-decoration:line-through;color:var(--mu)}
/* ── Code blocks ── */
.md-code-block{background:#080810;border:1px solid var(--bd);border-radius:7px;overflow:hidden;margin:7px 0;font-size:11px}
.md-code-hdr{display:flex;align-items:center;padding:4px 10px;background:var(--s2);border-bottom:1px solid var(--bd)}
.md-code-lang{font-size:8px;color:var(--ac);font-weight:700;letter-spacing:.8px;text-transform:uppercase;flex:1}
.md-code-copy{font-size:8px;color:var(--mu);cursor:pointer;padding:2px 7px;border:1px solid var(--bd);border-radius:3px;background:transparent;font-family:'IBM Plex Mono',monospace;transition:all .15s}
.md-code-copy:hover{color:var(--green);border-color:var(--green)}
.md-code-copy.copied{color:var(--green);border-color:rgba(74,222,128,.5);background:rgba(74,222,128,.08)}
.md-code-body{padding:10px 13px;overflow-x:auto;font-family:'IBM Plex Mono',monospace;font-size:11px;line-height:1.75;color:#C8C8E0;white-space:pre}
/* ── Prompt vars hint ── */
.pvar-hint{display:flex;gap:5px;flex-wrap:wrap;padding:3px 8px;font-size:8px;color:var(--mu);border-top:1px solid var(--bd);background:rgba(212,168,83,.04)}
.pvar-chip{padding:1px 5px;border-radius:3px;background:rgba(212,168,83,.12);color:var(--ac);border:1px solid rgba(212,168,83,.25);cursor:pointer;font-family:var(--font-ui)}
.pvar-chip:hover{background:rgba(212,168,83,.22)}
`;

// ── COMPONENTS ────────────────────────────────────────────────────
function PSBlock({ title, code, comment }) {
  const copy = () => { try { navigator.clipboard.writeText(code); } catch {} };
  return (
    <div className="ps-block">
      <div className="ps-hdr">
        <span className="ps-lang">POWERSHELL {title && <span style={{color:"#9999AA",fontWeight:400,letterSpacing:0}}>— {title}</span>}</span>
        <button className="ps-copy" onClick={copy}>copier</button>
      </div>
      <div className="ps-code">
        <pre>{comment && <span className="ps-comment"># {comment}{"\n"}</span>}{code}</pre>
      </div>
    </div>
  );
}

function ScoreBar({ score, color }) {
  const fill = (score / 10) * 100;
  const c = score >= 9 ? "#4ADE80" : score >= 8 ? "#D4A853" : "#FB923C";
  return (
    <div className="score-bar">
      <span className="score-num" style={{ color: c }}>{score}</span>
      <div className="score-bg"><div className="score-fill" style={{ width: `${fill}%`, background: c }} /></div>
    </div>
  );
}

function MeterBar({ val, color }) {
  const c = val >= 8 ? "#4ADE80" : val >= 6 ? "#D4A853" : "#FB923C";
  return (
    <div>
      <div className="meter-bg"><div className="meter-fill" style={{ width: `${val * 10}%`, background: c }} /></div>
      <div className="meter-val" style={{ color: c }}>{val}/10</div>
    </div>
  );
}

// ── ACTUALITÉS IA — Fallback multi-IA (Gemini → Groq → Mistral → Statiques) ──
const NEWS_THEMES = [
  { id:"general",  label:"🔥 Toutes les news",  query:"actualités intelligence artificielle semaine nouvelles sorties modèles IA 2025" },
  { id:"modeles",  label:"🤖 Nouveaux modèles", query:"nouveaux modèles IA sortis 2025 GPT Claude Gemini DeepSeek Llama Mistral Grok" },
  { id:"gratuit",  label:"⭐ IA gratuites",     query:"nouveaux outils IA gratuits open source 2025 disponibles" },
  { id:"images",   label:"🎨 IA Images/Vidéo",  query:"nouveaux générateurs images vidéo IA 2025 FLUX MidJourney Sora Runway Kling" },
  { id:"france",   label:"🇫🇷 IA en France",    query:"intelligence artificielle France entreprises startups régulation actualités 2025" },
  { id:"code",     label:"💻 IA & Code",        query:"IA coding assistants nouveautés 2025 Copilot Cursor Devin Codex" },
];

const NEWS_PROMPT = (q) =>
  `Tu es un journaliste tech expert en IA. Génère 10 actualités IA récentes et détaillées sur : "${q}".

RÈGLES IMPORTANTES :
1. Les URL doivent être des RECHERCHES GOOGLE NEWS valides : https://news.google.com/search?q=MOTS_CLÉS&hl=fr
   Ex: https://news.google.com/search?q=DeepSeek+R1+open+source&hl=fr
   JAMAIS d'URLs d'articles directes qui peuvent être mortes.
2. summary doit faire 3 à 5 phrases complètes et détaillées en français.
3. detail doit faire 2-3 phrases supplémentaires d'analyse ou de contexte.
4. impact doit décrire en 1 phrase l'impact concret pour les utilisateurs.

Retourne UNIQUEMENT un tableau JSON valide, sans markdown :
[{
  "title": "Titre accrocheur en français (max 90 chars)",
  "source": "Nom du média ou de l'entreprise",
  "date": "Il y a Xj / Cette semaine / Ce mois / Xjours 2025",
  "category": "Nouveau modèle|Outil gratuit|Open Source|Entreprise|Recherche|Réglementation|Image/Vidéo|Code|Agent IA",
  "summary": "3 à 5 phrases complètes décrivant la news en détail...",
  "detail": "2-3 phrases de contexte ou d'analyse approfondie...",
  "impact": "Impact concret pour les développeurs/utilisateurs en 1 phrase.",
  "url": "https://news.google.com/search?q=MOTS+CLÉS+DE+LA+NEWS&hl=fr",
  "important": true/false
}]`;

function parseNewsJSON(text) {
  const clean = text.replace(/```json|```/g,"").trim();
  const m = clean.match(/\[[\s\S]*\]/);
  if (!m) throw new Error("JSON introuvable");
  return JSON.parse(m[0]);
}

async function tryGemini(query, apiKey) {
  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    { method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ contents:[{role:"user",parts:[{text:NEWS_PROMPT(query)}]}], generationConfig:{maxOutputTokens:2000} }) }
  );
  const d = await r.json();
  if (d.error) throw new Error("Gemini: " + d.error.message);
  return parseNewsJSON(d.candidates[0].content.parts[0].text);
}

async function tryGroq(query, apiKey) {
  const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method:"POST", headers:{"Content-Type":"application/json","Authorization":`Bearer ${apiKey}`},
    body: JSON.stringify({ model:"llama-3.3-70b-versatile", max_tokens:2000,
      messages:[{role:"user",content:NEWS_PROMPT(query)}] })
  });
  const d = await r.json();
  if (d.error) throw new Error("Groq: " + (d.error.message||JSON.stringify(d.error)));
  return parseNewsJSON(d.choices[0].message.content);
}

async function tryMistral(query, apiKey) {
  const r = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method:"POST", headers:{"Content-Type":"application/json","Authorization":`Bearer ${apiKey}`},
    body: JSON.stringify({ model:"mistral-small-latest", max_tokens:2000,
      messages:[{role:"user",content:NEWS_PROMPT(query)}] })
  });
  const d = await r.json();
  if (d.error) throw new Error("Mistral: " + (typeof d.error==="string"?d.error:(d.error.message||"")));
  return parseNewsJSON(d.choices[0].message.content);
}

async function tryOpenAI(query, apiKey) {
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method:"POST", headers:{"Content-Type":"application/json","Authorization":`Bearer ${apiKey}`},
    body: JSON.stringify({ model:"gpt-4o-mini", max_tokens:2000,
      messages:[{role:"user",content:NEWS_PROMPT(query)}] })
  });
  const d = await r.json();
  if (d.error) throw new Error("OpenAI: " + d.error.message);
  return parseNewsJSON(d.choices[0].message.content);
}

const GNEWS = (q) => "https://news.google.com/search?q=" + encodeURIComponent(q) + "&hl=fr";

const FALLBACK_NEWS = [
  {
    title:"DeepSeek R1 — l'IA open source qui a choqué la Silicon Valley",
    source:"DeepSeek / Nature", date:"Mars 2025", category:"Nouveau modèle",
    summary:"DeepSeek R1 est un modèle de raisonnement open source avec 671 milliards de paramètres en architecture Mixture-of-Experts (MoE), dont seulement 37B sont actifs à chaque inférence. Ses poids sont publiés librement sur HuggingFace, ce qui en fait le modèle open source le plus puissant disponible. Il rivalise directement avec GPT-o1 d'OpenAI sur les benchmarks mathématiques et scientifiques, avec un coût d'inférence 10 à 20 fois inférieur. Le lancement a provoqué une chute boursière des valeurs technologiques américaines, notamment Nvidia.",
    detail:"L'architecture MoE permet à DeepSeek d'être économique : seule une fraction des paramètres est activée par requête. Cette approche avait déjà été utilisée par Mixtral de Mistral AI. La publication des poids permet à n'importe qui de l'héberger localement ou de l'affiner pour des usages spécifiques.",
    impact:"Les développeurs peuvent désormais utiliser un modèle de niveau GPT-o1 à une fraction du coût, via API ou en local.",
    url:GNEWS("DeepSeek R1 open source raisonnement"), important:true
  },
  {
    title:"Claude 4 (Sonnet + Opus) — Anthropic repousse les limites des agents IA",
    source:"Anthropic", date:"Juin 2025", category:"Nouveau modèle",
    summary:"Anthropic a lancé Claude Sonnet 4 et Claude Opus 4 avec des capacités inédites : mémoire longue durée persistante entre les conversations, contrôle autonome d'ordinateur (computer use), et une fenêtre de contexte de 200 000 tokens. Opus 4 est positionné comme le modèle le plus capable d'Anthropic, rivalisant avec GPT-o1 sur les tâches de raisonnement complexe. Sonnet 4 offre un excellent rapport qualité-prix pour les usages professionnels intensifs.",
    detail:"La mémoire longue durée permet à Claude de se souvenir des préférences, projets et contextes entre sessions. Le computer use permet à Claude de naviguer sur le web, ouvrir des applications et effectuer des tâches complexes de manière autonome.",
    impact:"Les entreprises peuvent désormais déployer des agents IA capables d'effectuer des workflows complets sans supervision humaine constante.",
    url:GNEWS("Claude 4 Sonnet Opus Anthropic agents"), important:true
  },
  {
    title:"GPT-o3 et o4-mini — OpenAI établit de nouveaux records absolus",
    source:"OpenAI", date:"Avr 2025", category:"Recherche",
    summary:"OpenAI a lancé GPT-o3 et o4-mini, deux modèles de raisonnement qui établissent des records historiques sur ARC-AGI (89,5%) et le benchmark MATH (évaluation de niveau olympiade). o3 est le premier modèle à dépasser significativement les capacités humaines sur des tâches de raisonnement abstrait. o4-mini offre des performances proches d'o3 à un coût très inférieur, rendant le raisonnement profond accessible pour les applications à grande échelle.",
    detail:"ARC-AGI est un benchmark conçu pour être résistant aux LLMs entraînés par mémorisation. Le score de 89,5% d'o3 suggère une forme de généralisation qui dépasse le simple pattern matching. Les chercheurs débattent de ce que cela implique pour la définition de l'AGI.",
    impact:"Les développeurs d'applications scientifiques, médicales et d'ingénierie ont maintenant accès à un raisonnement de niveau expert via API.",
    url:GNEWS("GPT o3 o4-mini OpenAI ARC-AGI records"), important:true
  },
  {
    title:"Gemini 2.0 Flash Ultra — Google passe à 2 millions de tokens",
    source:"Google DeepMind", date:"Fév 2025", category:"Nouveau modèle",
    summary:"Google a lancé Gemini 2.0 Flash Ultra avec une fenêtre de contexte de 2 millions de tokens, soit l'équivalent de plusieurs livres entiers ou de plusieurs heures de vidéo. Le modèle peut analyser de longs documents, des films complets ou des bases de code entières en une seule requête. Gemini Live permet des conversations vocales en temps réel avec partage d'écran, ouvrant la voie aux assistants IA multimodaux interactifs.",
    detail:"Le modèle 2.0 Pro est également planifié avec des capacités d'agent et une intégration Search Google Live. La version Flash reste dans le tier gratuit d'AI Studio avec une généreuse limite de tokens.",
    impact:"Les développeurs peuvent analyser des bases de code complètes ou des rapports entiers en une seule requête API, sans avoir à fragmenter le contenu.",
    url:GNEWS("Gemini 2.0 Flash Ultra contexte 2 millions tokens"), important:true
  },
  {
    title:"Mistral AI lance les Agents dans Le Chat — navigation web autonome",
    source:"Mistral AI", date:"Jan 2025", category:"Outil gratuit",
    summary:"Mistral AI a intégré des agents autonomes dans son interface Le Chat, permettant à l'IA de naviguer sur le web, d'exécuter du code Python, de créer des documents Word et Excel, et d'effectuer des recherches approfondies. Ces fonctionnalités sont disponibles gratuitement pour les utilisateurs de Le Chat. Mistral Small 3 a également été publié sous licence Apache 2.0, permettant un usage commercial libre.",
    detail:"Les agents de Mistral utilisent une approche 'tool use' standard compatible avec l'API OpenAI. La décision de proposer ces fonctionnalités gratuitement est une stratégie agressive pour concurrencer ChatGPT et Claude.",
    impact:"Pour les utilisateurs européens soucieux du RGPD, Mistral offre une alternative complète aux outils américains avec des serveurs en France.",
    url:GNEWS("Mistral Le Chat agents navigation web 2025"), important:false
  },
  {
    title:"Llama 3.3 70B et l'annonce de Llama 4 — Meta en force dans l'OSS",
    source:"Meta AI", date:"Oct 2024", category:"Open Source",
    summary:"Meta a lancé Llama 3.3 70B avec des performances proches de Llama 3.1 405B malgré sa taille bien inférieure, grâce à des améliorations dans le fine-tuning instruction. Le modèle est disponible gratuitement via Groq avec jusqu'à 14 400 requêtes par jour. Meta a également annoncé Llama 4 pour 2025, avec une architecture MoE et des capacités multimodales natives intégrées dès la base.",
    detail:"Groq utilise des puces spécialisées LPU (Language Processing Unit) qui permettent d'inférer Llama 3.3 70B à des vitesses de 800+ tokens/seconde, soit 10x plus vite que les GPU classiques. C'est pourquoi la version Groq est si rapide.",
    impact:"Les développeurs obtiennent un modèle de qualité professionnelle gratuitement, idéal pour prototyper des applications ou pour des usages à faible volume.",
    url:GNEWS("Llama 3.3 70B Meta Groq gratuit open source"), important:false
  },
  {
    title:"FLUX.1 Schnell — la révolution open source de la génération d'images",
    source:"Black Forest Labs", date:"Nov 2024", category:"Image/Vidéo",
    summary:"Black Forest Labs, fondé par d'anciens chercheurs de Stability AI, a lancé FLUX.1 sous licence Apache 2.0. Le modèle surpasse Stable Diffusion XL et rivalise avec Midjourney v6 sur la qualité photo-réaliste, tout en étant 3 à 5 fois plus rapide grâce à une architecture flow matching avec seulement 1 à 4 étapes de débruitage. FLUX.1 Dev (usage non-commercial) et FLUX.1 Pro (payant) complètent la gamme.",
    detail:"L'architecture flow matching de FLUX remplace les diffusion models classiques, permettant une génération en moins d'étapes sans perte de qualité. ComfyUI et Fooocus ont rapidement intégré FLUX, créant un écosystème de workflows partagés.",
    impact:"Les créatifs peuvent générer des images photo-réalistes de qualité professionnelle localement sur leur PC sans abonnement, avec un GPU de 8GB VRAM minimum.",
    url:GNEWS("FLUX.1 Schnell Black Forest Labs image generation open source"), important:false
  },
  {
    title:"Grok 3 de xAI — l'IA d'Elon Musk avec accès temps réel à X/Twitter",
    source:"xAI", date:"Déc 2024", category:"Nouveau modèle",
    summary:"xAI a lancé Grok 3 avec des améliorations significatives par rapport à la version 2 : accès en temps réel aux données de la plateforme X (Twitter), génération d'images via Aurora, et un mode de raisonnement approfondi pour les problèmes complexes. L'API publique est maintenant accessible aux développeurs. Grok 3 se positionne comme le principal concurrent de Claude et GPT-4o, avec un avantage sur les actualités en temps réel.",
    detail:"L'intégration X/Twitter est une différenciation unique : Grok peut analyser les tendances du moment, les tweets viraux et les discussions en cours. Ce contexte temps réel est impossible à obtenir avec les autres modèles.",
    impact:"Idéal pour les applications de veille médiatique, d'analyse de sentiment social et de monitoring de marques qui ont besoin de données ultra-fraîches.",
    url:GNEWS("Grok 3 xAI Elon Musk Twitter temps réel 2024"), important:false
  },
  {
    title:"Qwen 2.5 d'Alibaba — le challenger chinois qui s'impose sur le code",
    source:"Alibaba DAMO Academy", date:"Déc 2024", category:"Nouveau modèle",
    summary:"Alibaba a lancé Qwen 2.5 en plusieurs tailles (7B, 14B, 32B, 72B) avec des performances remarquables sur les benchmarks de code et de mathématiques, surpassant GPT-4o sur HumanEval. Les poids open source sont disponibles sur HuggingFace. Qwen2.5-Max, la version non-publiée, rivalise avec Claude 3.5 Sonnet selon les évaluations internes. Les tarifs API sont parmi les plus compétitifs du marché.",
    detail:"La famille Qwen comprend aussi des modèles spécialisés : Qwen-Coder pour le code, Qwen-Math pour les mathématiques, et Qwen-VL pour la vision. L'écosystème Qwen est particulièrement populaire en Asie et dans la communauté open source mondiale.",
    impact:"Pour les développeurs et data scientists, Qwen 2.5 72B offre des performances de niveau GPT-4 à un coût très inférieur, avec possibilité de le faire tourner localement.",
    url:GNEWS("Qwen 2.5 Alibaba code open source benchmarks"), important:false
  },
  {
    title:"Ernie 5.0 de Baidu — multimodal complet pour le marché chinois",
    source:"Baidu", date:"Juil 2024", category:"Nouveau modèle",
    summary:"Baidu a lancé Ernie 5.0 (文心一言 5.0) avec des capacités multimodales complètes intégrant texte, images, audio et vidéo dans un seul modèle. Le modèle est optimisé pour le mandarin et les tâches spécifiques au marché chinois. Disponible via l'API Qianfan, Ernie 5.0 est intégré dans l'écosystème Baidu Search et les outils bureautiques Wenku.",
    detail:"Ernie 5.0 fait face à des défis de disponibilité hors de Chine en raison des restrictions réglementaires. L'accès via API est limité aux entités enregistrées en Chine ou disposant de partenariats officiels avec Baidu.",
    impact:"Principalement pertinent pour les entreprises travaillant sur le marché chinois ou nécessitant un traitement de texte en mandarin de haute qualité.",
    url:GNEWS("Ernie 5.0 Baidu multimodal intelligence artificielle Chine"), important:false
  },
];

async function fetchAINews(themeQuery, savedKeys) {
  const keys = savedKeys || {};
  const errors = [];
  // Gemini retiré (non disponible dans cette config)
  if (keys.groq_inf) { try { return { items:await tryGroq(themeQuery,keys.groq_inf),   provider:"Groq/Llama ⚡", fallback:false }; } catch(e) { errors.push(e.message); } }
  if (keys.mistral)  { try { return { items:await tryMistral(themeQuery,keys.mistral), provider:"Mistral ▲",     fallback:false }; } catch(e) { errors.push(e.message); } }
  if (keys.openai)   { try { return { items:await tryOpenAI(themeQuery,keys.openai),   provider:"GPT-4o mini ◈", fallback:false }; } catch(e) { errors.push(e.message); } }
  return { items:FALLBACK_NEWS, provider:"Cache statique", fallback:true, errors };
}

const CAT_COLORS = {
  "Nouveau modèle":"#D4A853","Outil gratuit":"#4ADE80","Open Source":"#4ADE80",
  "Entreprise":"#60A5FA","Recherche":"#A78BFA","Réglementation":"#FB923C",
  "Image/Vidéo":"#E07FA0","Code":"#6BA5E0",
};
const getCatColor = (cat) => {
  for (const [k,v] of Object.entries(CAT_COLORS)) { if (cat?.includes(k)) return v; }
  return "#9CA3AF";
};
function AINewsBlock() {
  const [activeTheme, setActiveTheme] = useState("general");
  const [newsItems, setNewsItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);
  const [cache, setCache] = useState({});
  const [usedProvider, setUsedProvider] = useState(null);
  const [isFallback, setIsFallback] = useState(false);

  const getKeys = () => {
    try { return JSON.parse(localStorage.getItem("multiia_keys") || "{}"); }
    catch { return {}; }
  };

  const fetchNews = async (themeId) => {
    if (cache[themeId]) {
      setNewsItems(cache[themeId].items);
      setUsedProvider(cache[themeId].provider);
      setIsFallback(cache[themeId].fallback || false);
      setLastFetch(new Date()); return;
    }
    const theme = NEWS_THEMES.find(t => t.id === themeId);
    setLoading(true); setError(null); setNewsItems([]);
    try {
      const result = await fetchAINews(theme.query, getKeys());
      setNewsItems(result.items);
      setUsedProvider(result.provider);
      setIsFallback(result.fallback || false);
      setCache(prev => ({ ...prev, [themeId]: result }));
      setLastFetch(new Date());
    } catch(e) {
      setError("Erreur inattendue : " + e.message);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchNews("general"); }, []);

  const handleTheme = (id) => { setActiveTheme(id); fetchNews(id); };

  const fmtTime = (d) => {
    if (!d) return "";
    const m = Math.floor((Date.now() - d.getTime()) / 60000);
    if (m < 1) return "à l'instant";
    if (m < 60) return `il y a ${m}min`;
    return `il y a ${Math.floor(m/60)}h`;
  };

  return (
    <div className="rss-wrap">
      <div className="rss-head">
        <span style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
          <span className="live-dot"/>
          <span className="rss-title">📰 ACTUALITÉS IA{usedProvider && !loading ? <span style={{fontWeight:400,fontSize:9,color:"var(--mu)",marginLeft:5}}>via {usedProvider}</span> : ""}</span>
        </span>
        <div className="rss-src-tabs">
          {NEWS_THEMES.map(t => (
            <button key={t.id}
              className={`rss-stab ${activeTheme===t.id?"on":""}`}
              onClick={() => handleTheme(t.id)}
              disabled={loading}>{t.label}
            </button>
          ))}
        </div>
        <button className="rss-refresh"
          onClick={() => { setCache(prev => ({...prev,[activeTheme]:null})); fetchNews(activeTheme); }}
          disabled={loading}>
          {loading ? "⟳" : "↺"} {lastFetch ? fmtTime(lastFetch) : ""}
        </button>
      </div>

      {loading && (
        <div className="rss-loading">
          <div style={{marginBottom:8}}>
            <span className="dots"><span>·</span><span>·</span><span>·</span></span>
          </div>
          <div>Recherche des actualités IA… (Gemini → Groq → Mistral)</div>
          <div style={{fontSize:9,marginTop:4,color:"var(--mu)"}}>Essai automatique sur tes IAs disponibles · ~5-15 secondes</div>
        </div>
      )}

      {isFallback && !loading && newsItems.length > 0 && (
        <div style={{padding:"7px 14px",background:"rgba(251,146,60,.08)",borderBottom:"1px solid rgba(251,146,60,.2)",fontSize:9,color:"var(--orange)",display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
          <span>⚠️ <strong>Aucune clé API dispo</strong> — affichage du cache statique (news 2024-2025)</span>
          <span style={{color:"var(--mu)"}}>·</span>
          <span>Active <strong>Gemini</strong> (gratuit) ou <strong>Groq</strong> (gratuit) dans Config pour les vraies actus</span>
        </div>
      )}

      {error && !loading && (
        <div className="rss-err">
          ⚠️ {error}
          <button onClick={() => fetchNews(activeTheme)}
            style={{marginLeft:10,padding:"2px 8px",borderRadius:3,border:"1px solid var(--orange)",background:"transparent",color:"var(--orange)",fontSize:9,cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace"}}>
            Réessayer
          </button>
        </div>
      )}

      {!loading && !error && newsItems.length > 0 && (() => {
        const NewsCard = ({ item, i }) => {
          const [open, setOpen] = React.useState(false);
          const catColor = getCatColor(item.category);
          // Toujours générer un lien Google News valide
          const gnewsUrl = item.url && item.url.startsWith("http")
            ? item.url
            : "https://news.google.com/search?q=" + encodeURIComponent(item.title) + "&hl=fr";
          return (
            <div className="rss-item" style={item.important ? { borderLeft:`3px solid ${catColor}`, paddingLeft:11 } : {}}
              onClick={() => setOpen(o => !o)}>
              <div className="rss-item-hdr">
                <div className="rss-item-hdr-left">
                  <div style={{display:"flex",alignItems:"flex-start",gap:6,marginBottom:4}}>
                    {item.important && <span style={{color:"#FACC15",fontSize:12,flexShrink:0,lineHeight:1.4}}>★</span>}
                    <div className="rss-ititle">{item.title}</div>
                  </div>
                  <div className="rss-meta">
                    <span className="rss-site" style={{background:catColor+"18",color:catColor}}>{item.category}</span>
                    <span style={{fontSize:8,color:"var(--mu)",fontWeight:600}}>{item.source}</span>
                    <span className="rss-date">{item.date}</span>
                  </div>
                  {/* Summary toujours visible */}
                  {item.summary && <div className="rss-summary">{item.summary}</div>}
                </div>
                <button className="rss-toggle" onClick={e => { e.stopPropagation(); setOpen(o=>!o); }}
                  style={{flexShrink:0,marginTop:2,fontSize:14,padding:"0 4px"}}>
                  {open ? "▲" : "▼"}
                </button>
              </div>

              {/* Contenu expandé */}
              {open && (
                <div className="rss-expand-body" onClick={e => e.stopPropagation()}>
                  {item.detail && (
                    <div>
                      <div style={{fontSize:8,fontWeight:700,color:"var(--mu)",letterSpacing:".5px",marginBottom:3,textTransform:"uppercase"}}>🔍 Analyse</div>
                      <div className="rss-detail">{item.detail}</div>
                    </div>
                  )}
                  {item.impact && (
                    <div className="rss-impact">
                      <strong>💡 Impact :</strong> {item.impact}
                    </div>
                  )}
                  <div className="rss-expand-footer">
                    <a href={gnewsUrl} target="_blank" rel="noreferrer"
                      className="rss-gnews-btn" onClick={e => e.stopPropagation()}>
                      🔎 Chercher sur Google News ↗
                    </a>
                    <a href={"https://www.google.com/search?q=" + encodeURIComponent(item.title + " " + (item.source||""))}
                      target="_blank" rel="noreferrer"
                      className="rss-gnews-btn" style={{background:"rgba(96,165,250,.08)",borderColor:"rgba(96,165,250,.3)",color:"#60A5FA"}}
                      onClick={e => e.stopPropagation()}>
                      🌐 Google ↗
                    </a>
                    {item.source && (
                      <span style={{fontSize:8,color:"var(--mu)",marginLeft:"auto"}}>Source : {item.source}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        };
        return (
          <div className="rss-list">
            {newsItems.map((item, i) => <NewsCard key={i} item={item} i={i} />)}
          </div>
        );
      })()}

      {!loading && !error && newsItems.length === 0 && (
        <div className="rss-loading">
          Clique sur un thème pour charger les actualités.
        </div>
      )}

      <div style={{padding:"6px 14px",borderTop:"1px solid var(--bd)",fontSize:8,color:"var(--mu)",display:"flex",gap:8,flexWrap:"wrap"}}>
        <span>⚡ Propulsé par Claude + Web Search</span>
        <span>·</span>
        <span>★ = News importante</span>
        <span>·</span>
        <span>Clique sur un article pour l'ouvrir</span>
        <span>·</span>
        <span>↺ pour rafraîchir</span>
      </div>
    </div>
  );
}

// ── YOUTUBE TAB COMPONENT ─────────────────────────────────────────

// ═══════════════════════════════════════════════════════════
// NOTES TAB
// ═══════════════════════════════════════════════════════════
function NotesTab({ onCopyToChat }) {
  const load = () => { try { return JSON.parse(localStorage.getItem("multiia_notes")||"[]"); } catch { return []; } };
  const save = (list) => { try { localStorage.setItem("multiia_notes", JSON.stringify(list)); } catch {} };
  const [notes, setNotes] = React.useState(load);
  const [activeId, setActiveId] = React.useState(null);
  const activeNote = notes.find(n => n.id === activeId);

  const newNote = () => {
    const n = { id: "n_"+Date.now(), title: "Nouvelle note", content: "", date: new Date().toISOString() };
    const updated = [n, ...notes]; setNotes(updated); save(updated); setActiveId(n.id);
  };
  const updateNote = (field, val) => {
    const updated = notes.map(n => n.id===activeId ? {...n, [field]:val, date:new Date().toISOString()} : n);
    setNotes(updated); save(updated);
  };
  const delNote = () => {
    if (!window.confirm("Supprimer cette note ?")) return;
    const updated = notes.filter(n => n.id!==activeId);
    setNotes(updated); save(updated); setActiveId(updated[0]?.id || null);
  };
  const fmtDate = (d) => new Date(d).toLocaleDateString("fr-FR",{day:"2-digit",month:"2-digit",year:"2-digit",hour:"2-digit",minute:"2-digit"});

  return (
    <div className="notes-wrap">
      <div className="notes-list">
        <div className="notes-list-hdr">
          <span>📝 {notes.length} note{notes.length!==1?"s":""}</span>
          <button className="notes-new-btn" onClick={newNote}>＋</button>
        </div>
        {notes.length === 0 && <div style={{padding:"20px 12px",fontSize:10,color:"var(--mu)",textAlign:"center"}}>Aucune note.<br/>Clique sur ＋</div>}
        {notes.map(n => (
          <div key={n.id} className={`notes-item ${n.id===activeId?"on":""}`} onClick={() => setActiveId(n.id)}>
            <div className="notes-item-title">{n.title||"Sans titre"}</div>
            <div className="notes-item-date">{fmtDate(n.date)}</div>
            {n.content && <div className="notes-item-preview">{n.content.slice(0,50)}</div>}
          </div>
        ))}
      </div>
      <div className="notes-editor">
        {!activeNote ? (
          <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:12,color:"var(--mu)"}}>
            <div style={{fontSize:32}}>📝</div>
            <div style={{fontSize:11}}>Sélectionne une note ou crée-en une</div>
            <button className="notes-new-btn" onClick={newNote} style={{padding:"8px 16px",fontSize:11}}>＋ Nouvelle note</button>
          </div>
        ) : (
          <>
            <div className="notes-editor-hdr">
              <input className="notes-title-inp" value={activeNote.title}
                onChange={e => updateNote("title", e.target.value)} placeholder="Titre de la note"/>
              <button className="notes-del-btn" onClick={delNote}>🗑</button>
            </div>
            <textarea className="notes-textarea" value={activeNote.content}
              onChange={e => updateNote("content", e.target.value)}
              placeholder="Écris ici... Markdown supporté (visuellement).&#10;&#10;Ctrl+A pour tout sélectionner, puis copie vers le chat."/>
            <div className="notes-toolbar">
              <button className="notes-tbtn" onClick={() => navigator.clipboard.writeText(activeNote.content||"")}>⎘ Copier</button>
              <button className="notes-tbtn" onClick={() => onCopyToChat && onCopyToChat(activeNote.content||"")}>↗ Vers Chat</button>
              <span style={{marginLeft:"auto",fontSize:8,color:"var(--mu)"}}>{(activeNote.content||"").length} car · {(activeNote.content||"").split(/\s+/).filter(Boolean).length} mots</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// TRADUCTEUR TAB
// ═══════════════════════════════════════════════════════════
function TraducteurTab({ enabled, apiKeys }) {
  const LANGS = ["🇫🇷 Français","🇬🇧 Anglais","🇪🇸 Espagnol","🇩🇪 Allemand","🇮🇹 Italien","🇵🇹 Portugais","🇷🇺 Russe","🇯🇵 Japonais","🇨🇳 Chinois","🇦🇪 Arabe"];
  const [src, setSrc] = React.useState("🇫🇷 Français");
  const [tgt, setTgt] = React.useState("🇬🇧 Anglais");
  const [text, setText] = React.useState("");
  const [results, setResults] = React.useState({});
  const [loading, setLoading] = React.useState({});
  const activeIds = Object.keys(MODEL_DEFS).filter(id => enabled[id]);

  const translate = async () => {
    if (!text.trim() || !activeIds.length) return;
    const prompt = `Traduis ce texte du ${src.replace(/^.+\s/,"")} vers le ${tgt.replace(/^.+\s/,"")}. Retourne UNIQUEMENT la traduction, sans commentaires ni explications.\n\n${text}`;
    const newLoad = {}; activeIds.forEach(id=>{newLoad[id]=true;}); setLoading(newLoad);
    const newRes = {}; activeIds.forEach(id=>{newRes[id]="";}); setResults(newRes);
    await Promise.all(activeIds.map(async id => {
      try {
        const r = await callModel(id,[{role:"user",content:prompt}],apiKeys,"Tu es un traducteur expert. Tu traduis fidèlement sans ajouter de commentaires.");
        setResults(prev=>({...prev,[id]:r}));
      } catch(e) { setResults(prev=>({...prev,[id]:"❌ "+e.message})); }
      finally { setLoading(prev=>({...prev,[id]:false})); }
    }));
  };

  return (
    <div className="trad-wrap">
      <div className="trad-left">
        <div className="trad-lang-bar">
          <span style={{fontSize:9,color:"var(--mu)"}}>De :</span>
          <select style={{background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:5,color:"var(--tx)",fontFamily:"'IBM Plex Mono',monospace",fontSize:10,padding:"3px 6px"}}
            value={src} onChange={e=>setSrc(e.target.value)}>
            {LANGS.map(l=><option key={l} value={l}>{l}</option>)}
          </select>
          <span style={{fontSize:12,color:"var(--mu)"}}>→</span>
          <select style={{background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:5,color:"var(--tx)",fontFamily:"'IBM Plex Mono',monospace",fontSize:10,padding:"3px 6px"}}
            value={tgt} onChange={e=>setTgt(e.target.value)}>
            {LANGS.map(l=><option key={l} value={l}>{l}</option>)}
          </select>
          <button style={{marginLeft:"auto",background:"none",border:"1px solid var(--bd)",borderRadius:4,color:"var(--mu)",fontSize:10,padding:"2px 6px",cursor:"pointer"}}
            onClick={()=>{const t=src; setSrc(tgt); setTgt(t);}}>⇄ Inverser</button>
        </div>
        <textarea className="trad-textarea" value={text} onChange={e=>setText(e.target.value)}
          placeholder={`Texte à traduire en ${tgt.replace(/^.+\s/,"")}...`}/>
        <div style={{padding:"8px 10px",borderTop:"1px solid var(--bd)",display:"flex",alignItems:"center",gap:8,background:"var(--s1)",flexShrink:0}}>
          <span style={{fontSize:9,color:"var(--mu)",flex:1}}>{activeIds.length} IA{activeIds.length!==1?"s":""} active{activeIds.length!==1?"s":""}</span>
          <button className="trad-run-btn" onClick={translate} disabled={!text.trim()||!activeIds.length}>
            🌍 Traduire avec toutes les IAs
          </button>
        </div>
      </div>
      <div className="trad-right">
        {activeIds.length===0 && <div style={{padding:20,fontSize:11,color:"var(--mu)"}}>Active au moins une IA dans Config.</div>}
        {activeIds.map(id => {
          const m = MODEL_DEFS[id];
          return (
            <div key={id} className="trad-result-card">
              <div style={{fontSize:9,fontWeight:700,color:m.color,marginBottom:6,display:"flex",alignItems:"center",gap:6}}>
                {m.icon} {m.name}
                {loading[id] && <span style={{fontSize:8,color:"var(--mu)"}}>⏳ traduction...</span>}
                {results[id] && !loading[id] && <button onClick={()=>navigator.clipboard.writeText(results[id])} style={{marginLeft:"auto",background:"none",border:"1px solid var(--bd)",borderRadius:3,color:"var(--mu)",fontSize:9,padding:"1px 5px",cursor:"pointer"}}>⎘</button>}
              </div>
              {results[id] ? <div style={{fontSize:12,color:"var(--tx)",lineHeight:1.7,whiteSpace:"pre-wrap"}}>{results[id]}</div>
                : <div style={{fontSize:10,color:"var(--bd)"}}>{loading[id]?"...":"—"}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// AGENT AUTONOME TAB
// ═══════════════════════════════════════════════════════════
function AgentTab({ enabled, apiKeys }) {
  const AGENT_PREFERRED = ["groq","mistral","cohere","cerebras","sambanova","mixtral"];
  const [objective, setObjective] = React.useState("");
  const [steps, setSteps] = React.useState([]);
  const [running, setRunning] = React.useState(false);
  const [currentStep, setCurrentStep] = React.useState(-1);
  const [finalResult, setFinalResult] = React.useState("");
  const activeAgentIds = Object.keys(MODEL_DEFS).filter(id => enabled[id]);
  const AGENT_PREF = ["groq","mistral","cohere","cerebras","sambanova","mixtral"];
  const defaultAgentIA = AGENT_PREF.find(id => enabled[id]) || "mistral";
  const [agentIA, setAgentIA] = React.useState(defaultAgentIA);
  const activeIds = Object.keys(MODEL_DEFS).filter(id => enabled[id]);

  const run = async () => {
    if (!objective.trim()) return;
    const ia = activeIds.includes(agentIA) ? agentIA : activeIds[0];
    if (!ia) return;
    setRunning(true); setSteps([]); setFinalResult(""); setCurrentStep(0);
    try {
      // Étape 1: Décomposer l'objectif
      const planPrompt = `Tu es un agent IA autonome. Décompose cet objectif en 3 à 5 étapes concrètes et exécutables.
Objectif : ${objective}

Réponds UNIQUEMENT avec un JSON valide dans ce format exact :
{"steps": [{"id":1,"title":"Titre court","action":"Description de l'action à réaliser"},...]}`;
      
      const planRaw = await callModel(ia,[{role:"user",content:planPrompt}],apiKeys,"Tu es un agent autonome. Tu réponds uniquement en JSON valide, sans markdown.");
      let plan;
      try {
        const clean = planRaw.replace(/\`\`\`json|\`\`\`/g,"").trim();
        plan = JSON.parse(clean);
      } catch { 
        plan = {steps:[
          {id:1,title:"Analyse",action:"Analyser l'objectif et les contraintes"},
          {id:2,title:"Exécution",action:"Réaliser la tâche principale : "+objective},
          {id:3,title:"Synthèse",action:"Synthétiser et présenter les résultats"}
        ]};
      }
      const plannedSteps = plan.steps.map(s=>({...s,output:"",status:"pending"}));
      setSteps(plannedSteps);

      // Exécuter chaque étape
      let context = "";
      for (let i=0; i<plannedSteps.length; i++) {
        setCurrentStep(i);
        const step = plannedSteps[i];
        setSteps(prev=>prev.map((s,idx)=>idx===i?{...s,status:"running"}:s));
        
        const stepPrompt = `Objectif global : ${objective}
${context ? "Contexte des étapes précédentes :\n"+context+"\n\n" : ""}Étape actuelle (${i+1}/${plannedSteps.length}) : ${step.title}
Action : ${step.action}

Réalise cette étape de façon concrète et utile. Sois précis et actionnable.`;
        
        try {
          const output = await callModel(ia,[{role:"user",content:stepPrompt}],apiKeys,"Tu es un agent IA expert. Tu exécutes chaque étape de façon concrète et précise.");
          context += `\nÉtape ${i+1} (${step.title}): ${output.slice(0,500)}`;
          setSteps(prev=>prev.map((s,idx)=>idx===i?{...s,output,status:"done"}:s));
        } catch(e) {
          setSteps(prev=>prev.map((s,idx)=>idx===i?{...s,output:"❌ "+e.message,status:"error"}:s));
        }
      }

      // Synthèse finale
      setCurrentStep(plannedSteps.length);
      const synthPrompt = `Objectif : ${objective}\n\nToutes les étapes ont été réalisées. Voici le contexte :\n${context}\n\nFais une synthèse finale claire, structurée et actionnable pour l'utilisateur.`;
      const synthesis = await callModel(ia,[{role:"user",content:synthPrompt}],apiKeys,"Tu es un expert en synthèse. Tu présentes les résultats de façon claire et utile.");
      setFinalResult(synthesis);
    } finally { setRunning(false); setCurrentStep(-1); }
  };

  const STEP_TEMPLATES = [
    {label:"📝 Article de blog",obj:"Écris un article de blog complet sur l'intelligence artificielle en 2025, avec introduction accrocheuse, 3 sections développées et conclusion"},
    {label:"📊 Analyse concurrentielle",obj:"Fais une analyse concurrentielle de ChatGPT, Claude et Gemini : forces, faiblesses, cas d'usage idéaux"},
    {label:"💻 Plan technique",obj:"Crée un plan technique détaillé pour développer une application React de gestion de tâches avec backend Node.js"},
    {label:"🎯 Stratégie marketing",obj:"Développe une stratégie marketing pour lancer une application mobile IA sur le marché français"},
  ];

  return (
    <div className="agent-wrap">
      <div className="agent-hdr">
        <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:14,color:"var(--ac)"}}>🤖 Agent Autonome</div>
        <div style={{fontSize:9,color:"var(--mu)",marginTop:3}}>Donne un objectif complexe → l'IA planifie, décompose et exécute étape par étape</div>
      </div>
      <div style={{padding:"10px 14px",borderBottom:"1px solid var(--bd)",flexShrink:0,background:"var(--s1)"}}>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8}}>
          {STEP_TEMPLATES.map(t=>(
            <button key={t.label} onClick={()=>setObjective(t.obj)}
              style={{padding:"4px 10px",background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:5,color:"var(--mu)",fontSize:9,cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace"}}>
              {t.label}
            </button>
          ))}
        </div>
        <textarea style={{width:"100%",background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:7,color:"var(--tx)",fontFamily:"'IBM Plex Mono',monospace",fontSize:12,padding:"10px 12px",resize:"none",outline:"none",minHeight:64,boxSizing:"border-box"}}
          value={objective} onChange={e=>setObjective(e.target.value)}
          placeholder="Décris ton objectif… Ex: Écris un article complet sur le machine learning, avec exemples de code Python et cas d'usage pratiques"/>
        <div style={{display:"flex",alignItems:"center",gap:8,marginTop:8}}>
          <span style={{fontSize:9,color:"var(--mu)"}}>IA :</span>
          <select className="yt-add-inp" style={{flex:"none",width:"auto",padding:"3px 6px",fontSize:10}} value={agentIA} onChange={e=>setAgentIA(e.target.value)}>
            {activeIds.map(id=><option key={id} value={id}>{MODEL_DEFS[id].icon} {MODEL_DEFS[id].short}</option>)}
          </select>
          <button onClick={run} disabled={running||!objective.trim()||!activeIds.length}
            style={{marginLeft:"auto",background:running?"var(--s2)":"var(--ac)",border:"none",borderRadius:7,color:running?"var(--mu)":"#09090B",fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:12,padding:"9px 20px",cursor:running?"not-allowed":"pointer"}}>
            {running?"⏳ Exécution...":"▶ Lancer l'agent"}
          </button>
        </div>
      </div>
      <div className="agent-body">
        {steps.length===0 && !running && (
          <div style={{textAlign:"center",padding:"40px 20px",color:"var(--mu)"}}>
            <div style={{fontSize:40,marginBottom:12}}>🤖</div>
            <div style={{fontSize:12,marginBottom:6}}>L'agent va :</div>
            <div style={{fontSize:10,lineHeight:1.9,color:"#555568"}}>
              1️⃣ Analyser ton objectif<br/>
              2️⃣ Le décomposer en étapes<br/>
              3️⃣ Exécuter chaque étape séquentiellement<br/>
              4️⃣ Produire une synthèse finale
            </div>
          </div>
        )}
        {steps.map((s,i)=>(
          <div key={s.id} className={`agent-step-card ${s.status}`}>
            <div style={{fontSize:9,color:"var(--mu)",marginBottom:4,display:"flex",alignItems:"center",gap:6}}>
              <span style={{background:s.status==="done"?"var(--green)":s.status==="running"?"var(--ac)":"var(--bd)",color:s.status==="done"||s.status==="running"?"#09090B":"var(--mu)",padding:"1px 6px",borderRadius:3,fontWeight:700}}>
                {s.status==="done"?"✓":s.status==="running"?"⏳":i+1}
              </span>
              ÉTAPE {i+1}/{steps.length}
            </div>
            <div style={{fontSize:12,fontWeight:700,color:"var(--tx)",marginBottom:4}}>{s.title}</div>
            <div style={{fontSize:9,color:"var(--mu)",marginBottom:6,fontStyle:"italic"}}>{s.action}</div>
            {s.output && <div className="agent-step-output">{s.output}</div>}
          </div>
        ))}
        {finalResult && (
          <div className="agent-final">
            <div style={{fontSize:10,color:"var(--ac)",fontWeight:700,marginBottom:8,display:"flex",alignItems:"center",gap:8}}>
              ✨ SYNTHÈSE FINALE
              <button onClick={()=>navigator.clipboard.writeText(finalResult)} style={{marginLeft:"auto",background:"none",border:"1px solid rgba(212,168,83,.3)",borderRadius:3,color:"var(--ac)",fontSize:9,padding:"2px 8px",cursor:"pointer"}}>⎘ Copier</button>
            </div>
            <div className="agent-final-content"><MarkdownRenderer text={finalResult}/></div>
          </div>
        )}
      </div>
    </div>
  );
}

function YouTubeTab({ apiKeys = {} }) {
  const [chCatFilter, setChCatFilter] = useState("Tout");
  const [vidTheme, setVidTheme] = useState("trending");
  const [watchedVids, setWatchedVids] = useState(() => { try { return JSON.parse(localStorage.getItem("multiia_watched_vids")||"[]"); } catch { return []; } });
  // Clé unique = titre+chaîne (url peut être "" pour tous → collision)
  const vidKey = (v) => (v.title||"") + "|" + (v.channel||"");
  const markWatched = (v) => { const k=vidKey(v); const nw = [...new Set([...watchedVids, k])]; setWatchedVids(nw); localStorage.setItem("multiia_watched_vids", JSON.stringify(nw)); };
  const unmarkWatched = (v) => { const k=vidKey(v); const nw = watchedVids.filter(u=>u!==k); setWatchedVids(nw); localStorage.setItem("multiia_watched_vids", JSON.stringify(nw)); };
  const [replaceLoading, setReplaceLoading] = useState(false);
  const replaceWatchedVideos = async () => {
    // Supprimer les vidéos déjà vues de la liste et en charger de nouvelles
    const currentWatched = watchedVids;
    if (!currentWatched.length) { return; }
    const theme = YT_VIDEO_THEMES.find(t => t.id === vidTheme) || YT_VIDEO_THEMES[0];
    setReplaceLoading(true);
    try {
      const watchedTitles = vidItems.filter(v => currentWatched.includes(vidKey(v))).map(v => v.title).slice(0,5);
      const avoidStr = watchedTitles.length ? `\n\nÉvite ces vidéos déjà recommandées : ${watchedTitles.join(" | ")}` : "";
      const result = await fetchYTVideos(theme.query + avoidStr, getKeys());
      // Remplacer seulement les vidéos déjà vues par les nouvelles
      const kept = vidItems.filter(v => !currentWatched.includes(vidKey(v)));
      const fresh = result.items.filter(v => !currentWatched.includes(v.url) && !kept.find(k=>k.url===v.url));
      const merged = [...kept, ...fresh].slice(0, 20);
      setVidItems(merged);
      // Effacer les vues puisqu'on a remplacé
      setWatchedVids([]); localStorage.removeItem("multiia_watched_vids");
    } catch(e) { console.warn("Replace failed:", e.message); }
    setReplaceLoading(false);
  };
  const [hideWatched, setHideWatched] = useState(false);
  const [vidItems, setVidItems] = useState([]);
  const [vidLoading, setVidLoading] = useState(false);
  const [vidError, setVidError] = useState(null);
  // ── YouTube Player Modal ────────────────────────────────────────
  const [ytPlayer, setYtPlayer] = useState(null); // {videoId, title, channel}
  const [ytSearching, setYtSearching] = useState(null); // index de la carte en cours de recherche

  const searchAndPlay = async (v, idx) => {
    setYtSearching(idx);
    const ytKey = (apiKeys || {}).youtube_data;
    if (ytKey) {
      // Recherche via YouTube Data API v3
      try {
        const q = encodeURIComponent(`${v.title} ${v.channel}`);
        const r = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${q}&type=video&maxResults=1&key=${ytKey}`);
        const d = await r.json();
        if (d.items?.[0]?.id?.videoId) {
          markWatched(v);
          setYtPlayer({ videoId: d.items[0].id.videoId, title: v.title, channel: v.channel });
          setYtSearching(null); return;
        }
      } catch {}
    }
    // Fallback : ouvre dans un nouvel onglet (recherche précise)
    const q = encodeURIComponent(`${v.title} ${v.channel}`);
    markWatched(v);
    window.open(`https://www.youtube.com/results?search_query=${q}`, "_blank");
    setYtSearching(null);
  };
  const [vidProvider, setVidProvider] = useState(null);
  const [vidFallback, setVidFallback] = useState(false);
  const [vidCache, setVidCache] = useState({});
  const [vidLastFetch, setVidLastFetch] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [langFilter, setLangFilter] = useState("Tout");
  const [playingVid, setPlayingVid] = useState(null); // videoId en cours de lecture inline
  const [hoverVid, setHoverVid] = useState(null);     // videoId survolé (aperçu)
  const hoverTimerRef = React.useRef(null);

  const [customChannels, setCustomChannels] = useState(() => {
    try { return JSON.parse(localStorage.getItem("multiia_yt_channels") || "[]"); } catch { return []; }
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ name:"", url:"", desc:"", lang:"🇫🇷", cat:"IA & Tech", icon:"⭐", color:"#FF6B35" });
  const [addError, setAddError] = useState("");

  const CUSTOM_COLORS = ["#FF6B35","#D4A853","#4ADE80","#60A5FA","#A78BFA","#E07FA0","#F97316","#34D399","#60C8E0","#FB923C","#FACC15","#C084FC"];
  const CUSTOM_CATS = ["IA & Tech","IA Technique","Tutoriels","Actualités IA","Dev & Tech","Interviews","IA Locale & OSS","Science & IA","Data Science","IA Business","Autre"];

  const saveCustom = (list) => { setCustomChannels(list); try { localStorage.setItem("multiia_yt_channels", JSON.stringify(list)); } catch {} };

  const extractHandle = (url) => {
    const m = url.match(/youtube\.com\/@([^/?&]+)/) || url.match(/youtube\.com\/c\/([^/?&]+)/) || url.match(/youtube\.com\/user\/([^/?&]+)/);
    return m ? m[1] : "";
  };

  const handleUrlChange = (url) => {
    const handle = extractHandle(url);
    setAddForm(f => ({ ...f, url, name: f.name || (handle || "") }));
  };

  const addChannel = () => {
    setAddError("");
    if (!addForm.name.trim()) { setAddError("Le nom est requis"); return; }
    if (!addForm.url.trim() || !addForm.url.includes("youtube")) { setAddError("Lien YouTube invalide"); return; }
    const ch = {
      id: "custom_" + Date.now(), name: addForm.name.trim(),
      url: addForm.url.trim().startsWith("http") ? addForm.url.trim() : "https://" + addForm.url.trim(),
      desc: addForm.desc.trim() || "Chaîne ajoutée manuellement.", lang: addForm.lang,
      cat: addForm.cat, icon: addForm.icon || "⭐", color: addForm.color, subs: "", custom: true,
    };
    saveCustom([ch, ...customChannels]);
    setShowAddModal(false);
    setAddForm({ name:"", url:"", desc:"", lang:"🇫🇷", cat:"IA & Tech", icon:"⭐", color:"#FF6B35" });
  };

  const deleteCustom = (e, id) => { e.preventDefault(); e.stopPropagation(); saveCustom(customChannels.filter(c => c.id !== id)); };
  const getKeys = () => { try { return JSON.parse(localStorage.getItem("multiia_keys")||"{}"); } catch { return {}; } };

  const fetchVideos = async (themeId, extraChannels) => {
    const cacheKey = themeId + (extraChannels ? "_ch" : "");
    if (vidCache[cacheKey]) {
      const cached = vidCache[cacheKey];
      setVidItems(cached.items); setVidProvider(cached.provider); setVidFallback(cached.fallback||false); setVidLastFetch(new Date()); return;
    }
    const theme = YT_VIDEO_THEMES.find(t => t.id === themeId);
    setVidLoading(true); setVidError(null); setVidItems([]);
    try {
      // Injecter les chaînes perso FR/EN dans le prompt
      const custFrEn = (customChannels||[]).filter(ch => ch.lang === "🇫🇷" || ch.lang === "🇺🇸").slice(0,5);
      const channelContext = custFrEn.length > 0
        ? `\n\nChaînes personnalisées à inclure dans les recommandations : ${custFrEn.map(ch => ch.name).join(", ")}`
        : "";
      const customTheme = {...theme, query: theme.query + channelContext};
      const result = await fetchYTVideos(customTheme.query, getKeys());
      setVidItems(result.items); setVidProvider(result.provider); setVidFallback(result.fallback||false);
      setVidCache(prev => ({...prev, [cacheKey]: result})); setVidLastFetch(new Date());
    } catch(e) { setVidError("Erreur : " + e.message); }
    finally { setVidLoading(false); }
  };

  useEffect(() => { fetchVideos("trending", true); }, []);

  const handleTheme = (id) => { setVidTheme(id); fetchVideos(id, true); };
  const openYTSearch = () => {
    if (searchQuery.trim()) window.open("https://www.youtube.com/results?search_query=" + encodeURIComponent(searchQuery.trim() + " IA intelligence artificielle"), "_blank");
  };

  const extractVideoId = (url) => {
    if (!url) return null;
    const m = url.match(/[?&]v=([^&]{11})/) || url.match(/youtu\.be\/([^?]{11})/) || url.match(/embed\/([^?]{11})/);
    return m ? m[1] : null;
  };

  const allChannels = [...customChannels, ...YT_CHANNELS];
  const filteredChannels = allChannels.filter(ch => {
    if (chCatFilter === "Tout") return true;
    if (chCatFilter === "🇫🇷 Français") return ch.lang === "🇫🇷";
    if (chCatFilter === "🇺🇸 Anglais") return ch.lang === "🇺🇸";
    if (chCatFilter === "⭐ Mes chaînes") return ch.custom === true;
    return ch.cat === chCatFilter;
  });

  const filteredVideos = vidItems.filter(v => {
    if (langFilter === "Tout") return true;
    if (langFilter === "🇫🇷 Français") return v.lang === "FR";
    if (langFilter === "🇺🇸 Anglais") return v.lang === "EN";
    return true;
  }).filter(v => hideWatched ? !watchedVids.includes(vidKey(v)) : true);

  const fmtTime = (d) => {
    if (!d) return ""; const m = Math.floor((Date.now() - d.getTime()) / 60000);
    if (m < 1) return "à l'instant"; if (m < 60) return `${m}min`; return `${Math.floor(m/60)}h`;
  };
  const VCatColors = { "Tutoriel":"#4ADE80","Actualité":"#D4A853","Analyse":"#60A5FA","Review":"#A78BFA","Interview":"#E07FA0" };
  const vcatColor = (col) => VCatColors[col] || "#9CA3AF";

  const handleVidMouseEnter = (vidId) => {
    if (!vidId) return;
    clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => setHoverVid(vidId), 700);
  };
  const handleVidMouseLeave = () => {
    clearTimeout(hoverTimerRef.current);
    setHoverVid(null);
  };

  return (
    <div className="yt-wrap">
      {/* Hero */}
      <div className="yt-hero">
        <div className="yt-hero-icon">▶️</div>
        <div>
          <div className="yt-hero-title">YouTube IA & Tech</div>
          <div className="yt-hero-sub">Vidéos recommandées par IA en premier · Chaînes FR &amp; EN · Lecture inline au survol · Tes chaînes perso intégrées aux recommandations.</div>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="yt-search-bar">
        <input className="yt-search-inp" placeholder="Rechercher une vidéo IA sur YouTube…"
          value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          onKeyDown={e => { if(e.key==="Enter") openYTSearch(); }}/>
        <button className="yt-search-btn" onClick={openYTSearch}>▶ Rechercher sur YouTube</button>
        <a href="https://www.youtube.com/@Underscore_" target="_blank" rel="noreferrer"
          className="yt-search-btn" style={{background:"var(--s1)",color:"var(--ac)",border:"1px solid var(--bd)",textDecoration:"none",fontSize:10}}>
          🇫🇷 Sélection FR
        </a>
      </div>

      {/* ══ VIDÉOS RECOMMANDÉES EN PREMIER ══ */}
      <div className="yt-sec-title" style={{marginTop:0}}>🎬 Vidéos recommandées
        {vidProvider && !vidLoading && <span style={{fontWeight:400,fontSize:9,color:"var(--mu)",marginLeft:6}}>via {vidProvider} · {vidLastFetch?fmtTime(vidLastFetch):""}</span>}
        {customChannels.filter(ch=>ch.lang==="🇫🇷"||ch.lang==="🇺🇸").length>0 &&
          <span style={{fontSize:8,color:"var(--ac)",marginLeft:8,background:"rgba(212,168,83,.1)",padding:"1px 5px",borderRadius:3}}>+ tes {customChannels.filter(ch=>ch.lang==="🇫🇷"||ch.lang==="🇺🇸").length} chaîne(s) perso</span>
        }
        <button className="rss-refresh" style={{marginLeft:"auto"}}
          onClick={() => { setVidCache({}); fetchVideos(vidTheme, true); }} disabled={vidLoading}>↺</button>
      </div>

      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10,alignItems:"center"}}>
        <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
          {YT_VIDEO_THEMES.map(t => (
            <button key={t.id} className={`filter-btn ${vidTheme===t.id?"on":""}`}
              style={vidTheme!==t.id?{borderColor:"#FF6B6B44"}:{background:"#CC0000",borderColor:"#CC0000",color:"#fff"}}
              onClick={() => handleTheme(t.id)} disabled={vidLoading}>{t.label}</button>
          ))}
        </div>
        <div style={{marginLeft:"auto",display:"flex",gap:4}}>
          {["Tout","🇫🇷 Français","🇺🇸 Anglais"].map(l => (
            <button key={l} className={`filter-btn ${langFilter===l?"on":""}`} style={{fontSize:9}} onClick={() => setLangFilter(l)}>{l}</button>
          ))}
          <button className={`filter-btn ${hideWatched?"on":""}`}
            style={{fontSize:9, borderColor:hideWatched?"var(--green)":"var(--bd)",color:hideWatched?"var(--green)":"var(--mu)",background:hideWatched?"rgba(74,222,128,.1)":"transparent"}}
            onClick={()=>setHideWatched(h=>!h)}
            title={hideWatched?"Afficher toutes les vidéos":"Masquer les vidéos déjà vues"}>
            {hideWatched?"✓ Masquer vues":"👁 Masquer vues"}
          </button>
          {watchedVids.length>0&&<button className="filter-btn" style={{fontSize:9,borderColor:"var(--red)",color:"var(--red)"}} onClick={()=>{setWatchedVids([]);localStorage.removeItem("multiia_watched_vids");}} title="Réinitialiser les vues">🗑 Reset ({watchedVids.length})</button>}
          {watchedVids.length>0&&<button className="filter-btn" disabled={replaceLoading} style={{fontSize:9,borderColor:"var(--blue)",color:replaceLoading?"var(--mu)":"var(--blue)",background:replaceLoading?"transparent":"rgba(96,165,250,.08)"}} onClick={replaceWatchedVideos} title="Remplacer les vidéos déjà vues par de nouvelles recommandations">{replaceLoading?"⟳ Chargement…":"🔄 Remplacer les vues"}</button>}
        </div>
      </div>

      {vidFallback && !vidLoading && (
        <div style={{padding:"7px 12px",background:"rgba(251,146,60,.08)",border:"1px solid rgba(251,146,60,.2)",borderRadius:6,fontSize:9,color:"var(--orange)",marginBottom:10}}>
          ⚠️ <strong>Mode cache</strong> — Active <strong>Gemini</strong> ou <strong>Groq</strong> dans Config pour des recommandations dynamiques.
        </div>
      )}
      {vidLoading && (
        <div className="rss-loading">
          <span className="dots"><span>·</span><span>·</span><span>·</span></span>
          <div style={{marginTop:8}}>Génération des recommandations… (Gemini → Groq → Mistral)</div>
        </div>
      )}
      {vidError && !vidLoading && (
        <div className="rss-err">⚠️ {vidError}
          <button onClick={() => fetchVideos(vidTheme, true)} style={{marginLeft:10,padding:"2px 8px",borderRadius:3,border:"1px solid var(--orange)",background:"transparent",color:"var(--orange)",fontSize:9,cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace"}}>Réessayer</button>
        </div>
      )}

      {!vidLoading && filteredVideos.length > 0 && (
        <div className="yt-vgrid" style={{marginBottom:24}}>
          {filteredVideos.map((v, i) => {
            const vidId = extractVideoId(v.url);
            const thumbUrl = vidId ? `https://img.youtube.com/vi/${vidId}/mqdefault.jpg` : null;
            const isWatched = watchedVids.includes(vidKey(v));
            const isSrch = ytSearching === i;
            return (
            <div key={i} style={{position:"relative"}}>
              <div className={`yt-vcard ${v.important?"important":""}`}
                style={{display:"flex",flexDirection:"row",gap:10,alignItems:"center",borderRadius:6,textDecoration:"none",transition:"background .15s,border-color .15s",opacity:isWatched?.55:1,cursor:isSrch?"wait":"pointer"}}
                onClick={()=>{ if(!isSrch){ searchAndPlay(v, i); } }}
                onMouseEnter={e=>e.currentTarget.style.borderColor="#FF6B6B44"}
                onMouseLeave={e=>e.currentTarget.style.borderColor="var(--bd)"}>
                {/* Thumbnail compact */}
                <div style={{position:"relative",width:120,height:68,flexShrink:0,background:"#111",borderRadius:4,overflow:"hidden"}}>
                  {thumbUrl
                    ? <img src={thumbUrl} alt={v.title} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                    : <div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:20,opacity:.3}}>▶</span></div>
                  }
                  {v.duration && <span style={{position:"absolute",bottom:2,right:2,fontSize:7,background:"rgba(0,0,0,.85)",color:"#fff",padding:"1px 3px",borderRadius:2}}>{v.duration}</span>}
                  {isWatched && <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.5)",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:20,color:"var(--green)"}}>✓</span></div>}
                </div>
                {/* Infos */}
                <div style={{flex:1,minWidth:0,display:"flex",flexDirection:"column",gap:2}}>
                  <div className="yt-vtitle" style={{fontSize:11}}>{v.important && <span className="yt-vstar">★ </span>}{v.title}</div>
                  <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
                    <span className="yt-vch">{v.channel}</span>
                    {v.lang && <span style={{fontSize:9}}>{v.lang==="FR"?"🇫🇷":"🇺🇸"}</span>}
                    {v.duration && <span style={{fontSize:8,color:"var(--mu)"}}>{v.duration}</span>}
                    {v.views && <span style={{fontSize:8,color:"var(--mu)"}}>· {v.views}</span>}
                    {v.category && <span className="yt-vcat" style={{background:vcatColor(v.category)+"18",color:vcatColor(v.category)}}>{v.category}</span>}
                    {isWatched && <span style={{fontSize:8,color:"var(--green)",fontWeight:700}}>✓ Vu</span>}
                  </div>
                  {v.summary && <div style={{fontSize:9,color:"var(--mu)",lineHeight:1.4,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:1,WebkitBoxOrient:"vertical"}}>{v.summary}</div>}
                </div>
                <span style={{fontSize:11,color:"var(--mu)",flexShrink:0}}>{ytSearching===filteredVideos.indexOf(v)?"⏳":"▶"}</span>
              </div>
              {/* Bouton marquer vu / démarquer */}
              <button
                onClick={e=>{e.preventDefault();e.stopPropagation();isWatched?unmarkWatched(v):markWatched(v);}}
                title={isWatched?"Marquer comme non vu (remplacer)":"Marquer comme vu"}
                style={{position:"absolute",top:4,right:4,background:isWatched?"rgba(74,222,128,.15)":"rgba(255,255,255,.06)",border:"1px solid "+(isWatched?"rgba(74,222,128,.4)":"var(--bd)"),borderRadius:3,color:isWatched?"var(--green)":"var(--mu)",fontSize:8,padding:"2px 5px",cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace",zIndex:2}}>
                {isWatched?"✓ Vu":"+ Vu"}
              </button>
            </div>
            );
          })}
        </div>
      )}

      {/* ══ CHAÎNES RECOMMANDÉES ══ */}
      <div className="yt-sec-title">📡 Chaînes recommandées
        <span style={{fontWeight:400,fontSize:9,color:"var(--mu)",marginLeft:4}}>— {filteredChannels.length} chaîne{filteredChannels.length>1?"s":""}{customChannels.length>0&&<span style={{color:"#FF6B6B",marginLeft:6}}>· {customChannels.length} perso</span>}</span>
        <button className="yt-search-btn" style={{marginLeft:"auto",padding:"4px 10px",fontSize:9,background:"rgba(255,107,107,.15)",border:"1px solid rgba(255,107,107,.4)",color:"#FF6B6B"}}
          onClick={() => setShowAddModal(true)}>＋ Ajouter une chaîne</button>
      </div>
      <div className="yt-cat-filter">
        {["Tout","⭐ Mes chaînes","🇫🇷 Français","🇺🇸 Anglais",...CUSTOM_CATS.slice(0,5)].map(cat => (
          <button key={cat} className={`filter-btn ${chCatFilter===cat?"on":""}`}
            style={chCatFilter!==cat?{borderColor:"#FF6B6B44",color:"var(--mu)"}:{background:"#FF0000",borderColor:"#FF0000",color:"#fff"}}
            onClick={() => setChCatFilter(cat)}>{cat}</button>
        ))}
      </div>
      <div className="yt-ch-grid">
        <div className="yt-add-card" onClick={() => setShowAddModal(true)}>
          <div className="yt-add-card-icon">＋</div>
          <div className="yt-add-card-label">Ajouter une chaîne<br/><span style={{fontSize:8,color:"var(--mu)"}}>Colle l'URL YouTube</span></div>
        </div>
        {filteredChannels.map(ch => (
          <div key={ch.id} className="yt-ch-card" style={{borderColor:ch.color+"33",position:"relative",display:"flex",flexDirection:"column",gap:8,padding:"clamp(11px,1.8vw,14px)",background:"var(--s1)",border:`1px solid ${ch.color}33`,borderRadius:9,cursor:"pointer"}}
            onClick={() => window.open(ch.url,"_blank")}>
            {ch.custom && (
              <>
                <span className="yt-custom-badge" style={{position:"absolute",top:7,left:7}}>PERSO</span>
                <button className="yt-ch-del" onClick={e => deleteCustom(e, ch.id)} title="Supprimer">✕</button>
              </>
            )}
            <div className="yt-ch-hdr" style={{marginTop:ch.custom?12:0}}>
              <div className="yt-ch-icon" style={{background:ch.color+"18",color:ch.color,borderColor:ch.color+"44"}}>{ch.icon}</div>
              <div>
                <div className="yt-ch-name" style={{color:ch.color}}>{ch.name}</div>
                <div className="yt-ch-meta">
                  <span className="yt-ch-lang">{ch.lang}</span>
                  {ch.subs && <span className="yt-ch-subs">{ch.subs}</span>}
                </div>
              </div>
            </div>
            <span className="yt-ch-cat" style={{background:ch.color+"18",color:ch.color}}>{ch.cat}</span>
            <div className="yt-ch-desc">{ch.desc}</div>
            <div className="yt-ch-btn" style={{borderColor:ch.color,color:ch.color,display:"flex",alignItems:"center",justifyContent:"center",gap:4,padding:6,borderRadius:5,border:"1px solid",fontFamily:"'IBM Plex Mono',monospace",fontSize:8,fontWeight:600}}>▶ Ouvrir la chaîne</div>
          </div>
        ))}
      </div>

      {/* Modal ajout chaîne */}
      {showAddModal && (
        <div className="yt-add-modal" onClick={e => { if(e.target===e.currentTarget) setShowAddModal(false); }}>
          <div className="yt-add-modal-box">
            <div className="yt-add-modal-title">➕ Ajouter une chaîne YouTube</div>
            <div className="yt-add-field">
              <label className="yt-add-label">Lien YouTube *</label>
              <input className="yt-add-inp" placeholder="https://www.youtube.com/@NomDeLaChaine"
                value={addForm.url} onChange={e => handleUrlChange(e.target.value)}/>
              <span style={{fontSize:8,color:"var(--mu)"}}>Ex : youtube.com/@Underscore_</span>
            </div>
            <div className="yt-add-row">
              <div className="yt-add-field" style={{flex:2}}>
                <label className="yt-add-label">Nom *</label>
                <input className="yt-add-inp" value={addForm.name} onChange={e=>setAddForm(f=>({...f,name:e.target.value}))} placeholder="Nom affiché"/>
              </div>
              <div className="yt-add-field" style={{flex:1}}>
                <label className="yt-add-label">Icône</label>
                <input className="yt-add-inp" placeholder="🎬" maxLength={2} value={addForm.icon} onChange={e=>setAddForm(f=>({...f,icon:e.target.value}))} style={{textAlign:"center",fontSize:16}}/>
              </div>
            </div>
            <div className="yt-add-field">
              <label className="yt-add-label">Description</label>
              <input className="yt-add-inp" value={addForm.desc} onChange={e=>setAddForm(f=>({...f,desc:e.target.value}))} placeholder="Ce que fait cette chaîne…"/>
            </div>
            <div className="yt-add-row">
              <div className="yt-add-field" style={{flex:1}}>
                <label className="yt-add-label">Langue</label>
                <select className="yt-add-inp" value={addForm.lang} onChange={e=>setAddForm(f=>({...f,lang:e.target.value}))}>
                  <option value="🇫🇷">🇫🇷 Français</option>
                  <option value="🇺🇸">🇺🇸 Anglais</option>
                  <option value="🌐">🌐 Autre</option>
                </select>
              </div>
              <div className="yt-add-field" style={{flex:2}}>
                <label className="yt-add-label">Catégorie</label>
                <select className="yt-add-inp" value={addForm.cat} onChange={e=>setAddForm(f=>({...f,cat:e.target.value}))}>
                  {CUSTOM_CATS.map(cat=><option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
            </div>
            <div className="yt-add-field">
              <label className="yt-add-label">Couleur</label>
              <div className="yt-add-colors">
                {CUSTOM_COLORS.map(col=>(
                  <div key={col} className={`yt-add-color ${addForm.color===col?"sel":""}`} style={{background:col}} onClick={()=>setAddForm(f=>({...f,color:col}))}/>
                ))}
              </div>
            </div>
            {addForm.name && (
              <div style={{padding:"8px 10px",background:addForm.color+"12",border:`1px solid ${addForm.color}33`,borderRadius:6,display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:28,height:28,borderRadius:"50%",background:addForm.color+"22",border:`2px solid ${addForm.color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,color:addForm.color}}>{addForm.icon||"⭐"}</div>
                <div>
                  <div style={{fontSize:10,fontWeight:700,color:addForm.color}}>{addForm.name}</div>
                  <div style={{fontSize:8,color:"var(--mu)"}}>{addForm.lang} · {addForm.cat}</div>
                </div>
              </div>
            )}
            {addError && <div style={{fontSize:9,color:"var(--red)",padding:"4px 8px",background:"rgba(248,113,113,.1)",borderRadius:4}}>⚠️ {addError}</div>}
            <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
              <button onClick={()=>{setShowAddModal(false);setAddError("");}}
                style={{padding:"7px 14px",background:"transparent",border:"1px solid var(--bd)",borderRadius:5,color:"var(--mu)",cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace",fontSize:10}}>Annuler</button>
              <button onClick={addChannel}
                style={{padding:"7px 18px",background:"rgba(255,107,107,.15)",border:"1px solid #FF6B6B",borderRadius:5,color:"#FF6B6B",cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace",fontSize:10,fontWeight:700}}>＋ Ajouter</button>
            </div>
          </div>
        </div>
      )}

      {/* Recherches rapides */}
      <div className="yt-sec-title" style={{marginTop:8}}>🔗 Recherches rapides YouTube</div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:16}}>
        {[["🤖 IA 2025 FR","intelligence artificielle 2025 français"],["💻 LLM tutoriel","LLM tutorial local llama ollama"],["🎨 Stable Diffusion","stable diffusion FLUX tutorial 2025"],["⚡ Groq Llama","groq llama fast inference"],["🧠 DeepSeek","deepseek R1 explained"],["🔥 Claude vs GPT","claude vs gpt-4 comparison 2025"],["📊 Machine Learning","machine learning course beginner 2025"],["🇫🇷 IA France","intelligence artificielle France actualités 2025"],
        ].map(([label,q]) => (
          <a key={label} href={"https://www.youtube.com/results?search_query="+encodeURIComponent(q)}
            target="_blank" rel="noreferrer" className="fbtn" style={{fontSize:9,padding:"5px 10px",textDecoration:"none"}}>
            {label}
          </a>
        ))}
      </div>
    {/* ── Zen mode FAB ── */}
    {zenMode && (
      <button className="zen-mode-btn" title="Quitter le mode Zen" onClick={()=>setZenMode(false)}>⊡</button>
    )}
    {/* ── Memory panel ── */}
    {showMemPanel && (
      <div className="mem-panel">
        <div className="mem-hdr">
          <span style={{fontSize:14}}>💾</span>
          <span style={{flex:1,fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:11,color:"var(--tx)"}}>Mémoire locale</span>
          <span style={{fontSize:8,color:"var(--mu)",padding:"2px 6px",background:"var(--s2)",borderRadius:3}}>{memFacts.length} fait{memFacts.length>1?"s":""}</span>
          <button onClick={()=>setShowMemPanel(false)} style={{background:"none",border:"1px solid var(--bd)",borderRadius:4,color:"var(--mu)",fontSize:12,width:24,height:24,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
        </div>
        <div style={{padding:"8px 10px",borderBottom:"1px solid var(--bd)",flexShrink:0}}>
          <div style={{fontSize:8,color:"var(--mu)",marginBottom:6,lineHeight:1.5}}>Ces faits sont injectés automatiquement dans le <strong style={{color:"var(--ac)"}}>system prompt</strong> de chaque IA.</div>
          <div style={{display:"flex",gap:6}}>
            <input value={memInput} onChange={e=>setMemInput(e.target.value)}
              onKeyDown={e=>{if(e.key==="Enter"&&memInput.trim())addMemFact(memInput);}}
              placeholder="Ex: Je préfère Python, niveau intermédiaire…"
              style={{flex:1,background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:5,color:"var(--tx)",fontSize:10,padding:"6px 9px",fontFamily:"'IBM Plex Mono',monospace",outline:"none"}}/>
            <button onClick={()=>addMemFact(memInput)} disabled={!memInput.trim()}
              style={{background:"rgba(212,168,83,.15)",border:"1px solid rgba(212,168,83,.4)",borderRadius:5,color:"var(--ac)",fontSize:10,padding:"6px 10px",cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace",fontWeight:700}}>＋</button>
          </div>
        </div>
        <div className="mem-list">
          {memFacts.length === 0 && (
            <div style={{color:"var(--mu)",fontSize:9,textAlign:"center",padding:"20px 10px",opacity:.6}}>
              Aucun souvenir encore.<br/>Ajoute des faits sur toi pour personnaliser les réponses.
            </div>
          )}
          {memFacts.map(f => (
            <div key={f.id} className="mem-fact">
              <span style={{fontSize:12,flexShrink:0}}>📌</span>
              <span style={{flex:1}}>{f.text}</span>
              <button className="mem-fact-del" onClick={()=>delMemFact(f.id)}>✕</button>
            </div>
          ))}
        </div>
      </div>
    )}
    {/* ── Canvas preview panel ── */}
    {canvasContent && (
      <div className="canvas-panel">
        <div className="canvas-hdr">
          <span style={{fontSize:11}}>🎨</span>
          <span style={{flex:1,fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:11,color:"var(--tx)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{canvasContent.title||"Aperçu"}</span>
          <span style={{fontSize:8,color:"var(--mu)",padding:"2px 6px",background:"var(--s2)",borderRadius:3}}>{canvasContent.lang}</span>
          <button onClick={()=>{const b=new Blob([canvasContent.code],{type:"text/html"});const u=URL.createObjectURL(b);window.open(u,"_blank");}}
            style={{fontSize:8,padding:"3px 8px",background:"rgba(96,165,250,.1)",border:"1px solid rgba(96,165,250,.3)",borderRadius:4,color:"var(--blue)",cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace"}}>↗ Nouvel onglet</button>
          <button onClick={()=>setCanvasContent(null)} style={{background:"none",border:"1px solid var(--bd)",borderRadius:4,color:"var(--mu)",fontSize:12,width:24,height:24,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
        </div>
        <iframe className="canvas-iframe" sandbox="allow-scripts allow-same-origin"
          srcDoc={canvasContent.code} title="Canvas preview"/>
      </div>
    )}
    {/* ── YouTube Player Modal ── */}
    {ytPlayer && (
      <div onClick={()=>setYtPlayer(null)} style={{position:"fixed",inset:0,zIndex:9999,background:"rgba(0,0,0,.85)",display:"flex",alignItems:"center",justifyContent:"center",padding:16,backdropFilter:"blur(6px)"}}>
        <div onClick={e=>e.stopPropagation()} style={{width:"min(900px,96vw)",background:"var(--bg)",border:"1px solid var(--bd)",borderRadius:10,overflow:"hidden",boxShadow:"0 24px 80px rgba(0,0,0,.7)"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderBottom:"1px solid var(--bd)",background:"var(--s1)"}}>
            <span style={{fontSize:14}}>▶</span>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:11,fontWeight:700,color:"var(--tx)",fontFamily:"'Syne',sans-serif",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ytPlayer.title}</div>
              <div style={{fontSize:9,color:"var(--mu)"}}>{ytPlayer.channel}</div>
            </div>
            <a href={`https://www.youtube.com/watch?v=${ytPlayer.videoId}`} target="_blank" rel="noreferrer"
              style={{fontSize:8,padding:"4px 10px",background:"rgba(255,107,107,.12)",border:"1px solid rgba(255,107,107,.3)",borderRadius:4,color:"#FF6B6B",textDecoration:"none",whiteSpace:"nowrap",fontFamily:"'IBM Plex Mono',monospace"}}>
              ↗ Ouvrir dans YouTube
            </a>
            <button onClick={()=>setYtPlayer(null)} style={{background:"none",border:"1px solid var(--bd)",borderRadius:4,color:"var(--mu)",fontSize:12,width:26,height:26,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>✕</button>
          </div>
          <div style={{position:"relative",paddingBottom:"56.25%",height:0}}>
            <iframe
              src={`https://www.youtube.com/embed/${ytPlayer.videoId}?autoplay=1&rel=0`}
              title={ytPlayer.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",border:"none"}}
            />
          </div>
        </div>
      </div>
    )}
    </div>
  );
}


// ── PROMPTS TAB ───────────────────────────────────────────────────
function PromptsTab({ onInject }) {
  const [catFilter, setCatFilter] = React.useState("Tout");
  const [customPrompts, setCustomPrompts] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem("multiia_prompts") || "[]"); } catch { return []; }
  });
  const [showAdd, setShowAdd] = React.useState(false);
  const [form, setForm] = React.useState({ title:"", cat:"Code", icon:"💡", text:"" });
  const [search, setSearch] = React.useState("");

  const saveCustom = (list) => { setCustomPrompts(list); try { localStorage.setItem("multiia_prompts", JSON.stringify(list)); } catch {} };
  const allPrompts = [...customPrompts, ...DEFAULT_PROMPTS];
  const cats = ["Tout", ...new Set(allPrompts.map(p => p.cat))];
  const filtered = allPrompts.filter(p => {
    const matchCat = catFilter === "Tout" || p.cat === catFilter;
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.text.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const addPrompt = () => {
    if (!form.title.trim() || !form.text.trim()) return;
    const p = { id:"c_"+Date.now(), ...form, custom:true };
    saveCustom([p, ...customPrompts]);
    setShowAdd(false); setForm({ title:"", cat:"Code", icon:"💡", text:"" });
  };
  const delPrompt = (id) => saveCustom(customPrompts.filter(p => p.id !== id));
  const PROMPT_CATS_FORM = ["Code","Rédaction","Analyse","Créatif","Business","Traduction","Autre"];

  const [genDesc, setGenDesc] = React.useState("");
  const [genLoading, setGenLoading] = React.useState(false);
  const [genResults, setGenResults] = React.useState([]);

  // ── Trending Prompts ──────────────────────────────────────────
  const TRENDING_KEY = "multiia_trending_prompts";
  const DEFAULT_TRENDING = [
    { rank:1,  cat:"💼 Business",    title:"Analyse concurrentielle", usage:"Très demandé", trend:"▲", prompt:"Fais une analyse concurrentielle complète de [ENTREPRISE/PRODUIT]. Identifie les 5 principaux concurrents, compare les forces/faiblesses, prix, positionnement et propose une stratégie de différenciation." },
    { rank:2,  cat:"💻 Code",        title:"Refactoring & Clean Code", usage:"Tendance", trend:"▲", prompt:"Analyse ce code et propose un refactoring complet : améliore la lisibilité, applique les principes SOLID, extrait les fonctions trop longues, ajoute des commentaires JSDoc.\n\n[COLLE TON CODE]" },
    { rank:3,  cat:"✍️ Rédaction",   title:"Thread LinkedIn viral",   usage:"Populaire", trend:"→", prompt:"Crée un thread LinkedIn en 8 posts sur [SUJET]. Format : post d'accroche fort, 6 posts de valeur (insight, chiffre, astuce, erreur courante, exemple, leçon), CTA final. Ton authentique et engageant." },
    { rank:4,  cat:"🎯 Prompt Eng.", title:"Améliorer un prompt",     usage:"Incontournable", trend:"▲", prompt:"Tu es expert en prompt engineering. Analyse ce prompt et propose une version optimisée 10x plus précise, avec contexte, format de sortie, exemples et contraintes.\n\nPrompt original : [TON PROMPT]" },
    { rank:5,  cat:"📊 Analyse",     title:"Business Plan rapide",    usage:"Demandé", trend:"→", prompt:"Génère un business plan structuré pour : [IDÉE]. Sections : résumé exécutif, problème résolu, solution, marché cible (TAM/SAM/SOM), modèle économique, roadmap 12 mois, risques et mitigation." },
    { rank:6,  cat:"🤖 IA Pratique", title:"Prompt système expert",   usage:"Nouveau", trend:"🆕", prompt:"Crée un prompt système complet pour un assistant IA spécialisé en [DOMAINE]. Inclus : rôle, ton, expertise, règles de réponse, exemples de Q&A, limites et comportements par défaut." },
    { rank:7,  cat:"📧 Comm.",       title:"Cold email personnalisé", usage:"Populaire", trend:"→", prompt:"Rédige un cold email de prospection en [3/5/7] phrases pour [PRODUIT/SERVICE]. Cible : [PROFIL]. Accroche sur le problème spécifique, pas sur notre solution. Appel à l'action : réponse simple oui/non." },
    { rank:8,  cat:"🔍 Recherche",   title:"Synthèse de sources",     usage:"Tendance", trend:"▲", prompt:"Synthétise ces [N] sources/articles sur [SUJET] en : 1) Points de consensus, 2) Points contradictoires, 3) Ce qui manque dans la littérature, 4) Tes 3 conclusions actionnables.\n\n[SOURCES]" },
  ];
  const [trendingPrompts, setTrendingPrompts] = React.useState(() => {
    try { const s = localStorage.getItem(TRENDING_KEY); return s ? JSON.parse(s) : DEFAULT_TRENDING; } catch { return DEFAULT_TRENDING; }
  });
  const [trendingLoading, setTrendingLoading] = React.useState(false);
  const [trendingDate, setTrendingDate] = React.useState(() => {
    try { return localStorage.getItem(TRENDING_KEY+"_date") || null; } catch { return null; }
  });
  const [showTrending, setShowTrending] = React.useState(true);

  const refreshTrending = async () => {
    setTrendingLoading(true);
    try {
      const sysPrompt = "Tu es un expert en IA et prompt engineering. Tu surveilles les tendances des communautés : Reddit r/ChatGPT, r/ClaudeAI, r/PromptEngineering, PromptBase, FlowGPT, et les discussions Twitter/X IA. Tu réponds UNIQUEMENT en JSON valide, sans markdown ni backticks.";
      const userPrompt = "Génère 8 prompts tendance du moment pour les utilisateurs d'IA (ChatGPT, Claude, Groq). Ce sont les types de prompts les plus utilisés et partagés en ce moment.\nRetourne UNIQUEMENT ce JSON valide :\n[{\"rank\":1,\"cat\":\"emoji Catégorie\",\"title\":\"Titre court\",\"usage\":\"Populaire/Tendance/Nouveau/Viral\",\"trend\":\"▲/→/🆕\",\"prompt\":\"Le prompt complet prêt à l'emploi avec [PLACEHOLDERS]\"}]";
      let raw;
      if (apiKeys.groq_inf) {
        const r = await fetch("https://api.groq.com/openai/v1/chat/completions",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+apiKeys.groq_inf},body:JSON.stringify({model:"llama-3.3-70b-versatile",max_tokens:2500,messages:[{role:"system",content:sysPrompt},{role:"user",content:userPrompt}]})});
        const d = await r.json();
        raw = d.choices?.[0]?.message?.content;
      } else if (apiKeys.mistral) {
        const r = await fetch("https://api.mistral.ai/v1/chat/completions",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+apiKeys.mistral},body:JSON.stringify({model:"mistral-small-latest",max_tokens:2500,messages:[{role:"system",content:sysPrompt},{role:"user",content:userPrompt}]})});
        const d = await r.json();
        raw = d.choices?.[0]?.message?.content;
      } else { throw new Error("Active Groq ou Mistral dans Config pour rafraîchir"); }
      const clean = (raw||"").replace(/```json|```/g,"").trim();
      const m = clean.match(/\[[\s\S]*\]/);
      if (!m) throw new Error("Réponse invalide");
      const data = JSON.parse(m[0]);
      setTrendingPrompts(data);
      const now = new Date().toLocaleDateString("fr-FR",{day:"2-digit",month:"2-digit",year:"2-digit",hour:"2-digit",minute:"2-digit"});
      setTrendingDate(now);
      try { localStorage.setItem(TRENDING_KEY, JSON.stringify(data)); localStorage.setItem(TRENDING_KEY+"_date", now); } catch {}
    } catch(e) { alert("Erreur : "+e.message); }
    setTrendingLoading(false);
  };

  const generatePrompts = async () => {
    if (!genDesc.trim()) return;
    setGenLoading(true); setGenResults([]);
    try {
      const prompt = "Tu es un expert en prompt engineering. Genere exactement 5 prompts optimises pour cette intention : " + genDesc + "\n\nChaque prompt doit etre pret a l'emploi, precis et efficace.\nReponds UNIQUEMENT avec JSON valide :\n{\"prompts\":[{\"title\":\"Titre court\",\"prompt\":\"Le prompt complet\",\"use\":\"Ideal pour...\"}]}";
      const r = await callClaude([{role:"user",content:prompt}],"Tu es expert en prompt engineering. Tu reponds uniquement en JSON valide, sans markdown ni backticks.");
      const clean = r.replace(/```json|```/g,"").trim();
      const data = JSON.parse(clean);
      setGenResults(data.prompts||[]);
    } catch(e) { setGenResults([{title:"Erreur",prompt:"Impossible de generer : "+e.message,use:""}]); }
    setGenLoading(false);
  };

  return (
    <div className="prom-wrap">
      {/* ══ GÉNÉRATEUR DE PROMPTS IA ══ */}
      <div style={{padding:"12px 14px",borderBottom:"1px solid var(--bd)",flexShrink:0}}>
        <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:12,color:"var(--ac)",marginBottom:8}}>✨ Générateur de prompts IA
          <span style={{fontSize:8,color:"var(--mu)",fontWeight:400,marginLeft:6}}>— Décris ton intention → Claude génère 5 prompts optimisés</span>
        </div>
        <div style={{display:"flex",gap:8,marginBottom:8}}>
          <input style={{flex:1,background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:7,color:"var(--tx)",fontFamily:"'IBM Plex Mono',monospace",fontSize:12,padding:"8px 12px",outline:"none"}}
            value={genDesc} onChange={e=>setGenDesc(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")generatePrompts();}}
            placeholder="Ex: résumer un PDF, écrire un email pro, déboguer du Python…"/>
          <button onClick={generatePrompts} disabled={genLoading||!genDesc.trim()}
            style={{background:genLoading?"var(--s2)":"var(--ac)",border:"none",borderRadius:7,color:genLoading?"var(--mu)":"#09090B",fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:11,padding:"8px 14px",cursor:genLoading?"not-allowed":"pointer",whiteSpace:"nowrap"}}>
            {genLoading?"⏳...":"✨ Générer 5 prompts"}
          </button>
        </div>
        {genResults.length > 0 && (
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {genResults.map((p,i)=>(
              <div key={i} style={{background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:7,padding:"9px 11px"}}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:5,flexWrap:"wrap"}}>
                  <span style={{fontSize:9,fontWeight:700,color:"var(--ac)"}}>{i+1}. {p.title}</span>
                  {p.use && <span style={{fontSize:8,color:"var(--mu)",fontStyle:"italic"}}>{p.use}</span>}
                  <div style={{marginLeft:"auto",display:"flex",gap:4}}>
                    <button onClick={()=>navigator.clipboard.writeText(p.prompt)}
                      style={{background:"none",border:"1px solid var(--bd)",borderRadius:4,color:"var(--mu)",fontSize:9,padding:"2px 7px",cursor:"pointer"}}>⎘ Copier</button>
                    <button onClick={()=>onInject&&onInject(p.prompt)}
                      style={{background:"rgba(212,168,83,.15)",border:"1px solid rgba(212,168,83,.4)",borderRadius:4,color:"var(--ac)",fontSize:9,padding:"2px 7px",cursor:"pointer",fontWeight:700}}>↗ Utiliser</button>
                  </div>
                </div>
                <div style={{fontSize:11,color:"var(--tx)",lineHeight:1.65,fontFamily:"'IBM Plex Mono',monospace",wordBreak:"break-word"}}>{p.prompt}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ══ TRENDING PROMPTS ══ */}
      <div style={{padding:"10px 14px 14px",borderBottom:"1px solid var(--bd)",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8,flexWrap:"wrap"}}>
          <button onClick={()=>setShowTrending(v=>!v)} style={{display:"flex",alignItems:"center",gap:6,fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:12,color:"var(--orange)",background:"none",border:"none",cursor:"pointer",padding:0}}>
            🔥 Prompts Tendance {showTrending?"▲":"▼"}
          </button>
          {trendingDate && <span style={{fontSize:8,color:"var(--mu)"}}>Mis à jour le {trendingDate}</span>}
          <button onClick={refreshTrending} disabled={trendingLoading}
            style={{marginLeft:"auto",fontSize:8,padding:"3px 10px",background:trendingLoading?"var(--s2)":"rgba(251,146,60,.12)",border:"1px solid rgba(251,146,60,.4)",borderRadius:4,color:trendingLoading?"var(--mu)":"var(--orange)",cursor:trendingLoading?"not-allowed":"pointer",fontFamily:"'IBM Plex Mono',monospace",fontWeight:700}}>
            {trendingLoading ? "⏳ Génération…" : "🔄 Rafraîchir via IA"}
          </button>
        </div>
        {showTrending && (
          <div style={{overflowX:"auto",paddingBottom:4}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:10,minWidth:560}}>
              <thead>
                <tr style={{background:"var(--s2)"}}>
                  <th style={{padding:"5px 8px",textAlign:"left",color:"var(--mu)",fontWeight:600,fontSize:8,whiteSpace:"nowrap"}}>#</th>
                  <th style={{padding:"5px 8px",textAlign:"left",color:"var(--mu)",fontWeight:600,fontSize:8}}>Catégorie</th>
                  <th style={{padding:"5px 8px",textAlign:"left",color:"var(--mu)",fontWeight:600,fontSize:8}}>Prompt</th>
                  <th style={{padding:"5px 8px",textAlign:"left",color:"var(--mu)",fontWeight:600,fontSize:8}}>Usage</th>
                  <th style={{padding:"5px 8px",textAlign:"left",color:"var(--mu)",fontWeight:600,fontSize:8}}>Trend</th>
                  <th style={{padding:"5px 8px",color:"var(--mu)",fontWeight:600,fontSize:8}}></th>
                </tr>
              </thead>
              <tbody>
                {trendingPrompts.map((p,i) => (
                  <tr key={i} style={{borderTop:"1px solid var(--bd)",transition:"background .15s",cursor:"pointer"}}
                    onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,.03)"}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <td style={{padding:"6px 8px",fontWeight:700,color:"var(--ac)",fontSize:10}}>#{p.rank||i+1}</td>
                    <td style={{padding:"6px 8px",fontSize:9,color:"var(--orange)",whiteSpace:"nowrap"}}>{p.cat}</td>
                    <td style={{padding:"6px 8px",fontWeight:700,color:"var(--tx)",fontSize:10}}>{p.title}</td>
                    <td style={{padding:"6px 8px",fontSize:9,color:"var(--mu)",whiteSpace:"nowrap"}}>{p.usage}</td>
                    <td style={{padding:"6px 8px",fontSize:12,textAlign:"center"}}>{p.trend}</td>
                    <td style={{padding:"6px 8px",textAlign:"right",whiteSpace:"nowrap"}}>
                      <button onClick={()=>onInject&&onInject(p.prompt)}
                        style={{fontSize:8,padding:"3px 8px",background:"rgba(212,168,83,.12)",border:"1px solid rgba(212,168,83,.35)",borderRadius:4,color:"var(--ac)",cursor:"pointer",marginRight:3,fontFamily:"'IBM Plex Mono',monospace",fontWeight:700}}>↗ Injecter</button>
                      <button onClick={()=>{try{navigator.clipboard.writeText(p.prompt);}catch{}}}
                        style={{fontSize:8,padding:"3px 8px",background:"transparent",border:"1px solid var(--bd)",borderRadius:4,color:"var(--mu)",cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace"}}>⎘</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="prom-hdr">
        <div style={{flex:1}}>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:"clamp(14px,2.5vw,18px)",color:"var(--tx)",marginBottom:4}}>📋 Bibliothèque de Prompts</div>
          <div style={{fontSize:9,color:"var(--mu)"}}>Clique sur <strong style={{color:"var(--ac)"}}>↗ Injecter</strong> pour envoyer le prompt dans le Chat · {allPrompts.length} prompts</div>
        </div>
        <button className="prom-inject" style={{flex:"none",padding:"7px 14px"}} onClick={() => setShowAdd(true)}>＋ Nouveau prompt</button>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap",alignItems:"center"}}>
        <input style={{background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:6,color:"var(--tx)",fontFamily:"'IBM Plex Mono',monospace",fontSize:11,padding:"6px 10px",outline:"none",flex:1,minWidth:160}}
          placeholder="Rechercher…" value={search} onChange={e=>setSearch(e.target.value)}/>
        <div className="prom-cats">
          {cats.map(c => <button key={c} className={"filter-btn "+(catFilter===c?"on":"")} onClick={()=>setCatFilter(c)}>{c}</button>)}
        </div>
      </div>
      <div className="prom-grid">
        {filtered.map(p => (
          <div key={p.id} className={"prom-card "+(p.custom?"custom":"")}>
            <div className="prom-card-hdr">
              <span className="prom-icon">{p.icon}</span>
              <span className="prom-title">{p.title}</span>
              <span className="prom-cat-badge">{p.cat}</span>
            </div>
            <div className="prom-preview">{p.text}</div>
            <div className="prom-btns">
              <button className="prom-inject" onClick={() => onInject(p.text)}>↗ Injecter dans Chat</button>
              {p.custom && <button className="prom-del" onClick={() => delPrompt(p.id)}>✕</button>}
            </div>
          </div>
        ))}
      </div>
      {showAdd && (
        <div className="yt-add-modal" onClick={e => { if(e.target===e.currentTarget) setShowAdd(false); }}>
          <div className="yt-add-modal-box" style={{maxWidth:520}}>
            <div className="yt-add-modal-title">📋 Nouveau Prompt</div>
            <div className="yt-add-row" style={{gap:8}}>
              <div className="yt-add-field" style={{flex:"none",width:60}}>
                <label className="yt-add-label">Icône</label>
                <input className="yt-add-inp" value={form.icon} onChange={e=>setForm(f=>({...f,icon:e.target.value}))} style={{textAlign:"center",fontSize:16}} maxLength={2}/>
              </div>
              <div className="yt-add-field" style={{flex:2}}>
                <label className="yt-add-label">Titre *</label>
                <input className="yt-add-inp" placeholder="Nom du prompt" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))}/>
              </div>
              <div className="yt-add-field" style={{flex:1}}>
                <label className="yt-add-label">Catégorie</label>
                <select className="yt-add-inp" value={form.cat} onChange={e=>setForm(f=>({...f,cat:e.target.value}))}>
                  {PROMPT_CATS_FORM.map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="yt-add-field">
              <label className="yt-add-label">Texte *</label>
              <textarea className="yt-add-inp" rows={6} placeholder="Écris ton prompt ici… Utilise [PLACEHOLDER] pour les zones à remplir." style={{resize:"vertical",lineHeight:1.6}} value={form.text} onChange={e=>setForm(f=>({...f,text:e.target.value}))}/>
            </div>
            <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
              <button onClick={()=>setShowAdd(false)} style={{padding:"7px 14px",background:"transparent",border:"1px solid var(--bd)",borderRadius:5,color:"var(--mu)",cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace",fontSize:10}}>Annuler</button>
              <button onClick={addPrompt} style={{padding:"7px 18px",background:"rgba(212,168,83,.15)",border:"1px solid var(--ac)",borderRadius:5,color:"var(--ac)",cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace",fontSize:10,fontWeight:700}}>＋ Créer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── RÉDACTION TAB ─────────────────────────────────────────────────
function RedactionTab({ enabled, apiKeys }) {
  const [inputText, setInputText] = React.useState("");
  const [activeAction, setActiveAction] = React.useState(null);
  const [results, setResults] = React.useState({});
  const [loading, setLoading] = React.useState({});
  const activeIds = Object.keys(MODEL_DEFS).filter(id => enabled[id]);

  const runAction = async (action) => {
    if (!inputText.trim()) return;
    setActiveAction(action.id);
    const prompt = action.prompt(inputText);
    const ids = activeIds;
    if (!ids.length) return;
    const newLoad = {}; ids.forEach(id=>{newLoad[id]=true;}); setLoading(newLoad);
    const newRes = {}; ids.forEach(id=>{newRes[id]="";}); setResults(newRes);
    await Promise.all(ids.map(async (id) => {
      try {
        const reply = await callModel(id, [{role:"user",content:prompt}], apiKeys);
        setResults(prev => ({...prev, [id]:reply}));
      } catch(e) {
        setResults(prev => ({...prev, [id]:"❌ "+e.message}));
      } finally { setLoading(prev => ({...prev,[id]:false})); }
    }));
  };

  return (
    <div className="red-wrap">
      <div className="red-left">
        <div style={{padding:"8px 10px",borderBottom:"1px solid var(--bd)",fontSize:9,color:"var(--mu)",display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
          <span style={{color:"var(--ac)",fontWeight:700}}>✍️ RÉDACTION</span>
          <span style={{flex:1}}>— Colle ou écris ton texte</span>
          <button style={{background:"none",border:"1px solid var(--bd)",borderRadius:3,color:"var(--mu)",cursor:"pointer",fontSize:8,padding:"1px 5px",fontFamily:"'IBM Plex Mono',monospace"}}
            onClick={()=>{setInputText("");setResults({});setActiveAction(null);}}>↺ Vider</button>
        </div>
        <textarea className="red-textarea" placeholder={"Colle ton texte ici…\n\nChoisis ensuite une action en bas."}
          value={inputText} onChange={e=>setInputText(e.target.value)}/>
        <div style={{padding:"4px 8px",borderTop:"1px solid var(--bd)",fontSize:8,color:"var(--mu)",background:"var(--s1)",flexShrink:0}}>
          {inputText.length} caractères · {activeIds.length} IA{activeIds.length>1?"s":""} active{activeIds.length>1?"s":""}
        </div>
        <div className="red-actions">
          {REDACTION_ACTIONS.map(a => (
            <button key={a.id} className={"red-act-btn "+(activeAction===a.id?"active":"")}
              onClick={() => runAction(a)} disabled={!inputText.trim()}>
              {a.icon} {a.label}
            </button>
          ))}
        </div>
      </div>
      <div className="red-right">
        {!activeAction ? (
          <div className="red-placeholder">
            <div style={{fontSize:32}}>✍️</div>
            <strong style={{color:"var(--tx)"}}>Choisis une action</strong>
            <div style={{maxWidth:280,color:"var(--mu)",textAlign:"center"}}>Colle un texte à gauche, puis clique sur une action pour le faire traiter par toutes tes IAs actives simultanément.</div>
          </div>
        ) : (
          <div className="red-results">
            {activeIds.map(id => {
              const m = MODEL_DEFS[id];
              const res = results[id];
              const isLoad = loading[id];
              return (
                <div key={id} className="red-result-card" style={{borderColor:m.color+"33"}}>
                  <div className="red-result-hdr" style={{borderBottomColor:m.border}}>
                    <span style={{color:m.color,fontSize:12}}>{m.icon}</span>
                    <span style={{color:m.color,fontWeight:700,fontSize:10,fontFamily:"'Syne',sans-serif"}}>{m.name}</span>
                    {res && !isLoad && <button className="red-copy-btn" onClick={()=>{try{navigator.clipboard.writeText(res);}catch{}}}>⎘ Copier</button>}
                  </div>
                  <div className="red-result-body">
                    {isLoad ? <span className="dots"><span>·</span><span>·</span><span>·</span></span> : (res ? <MarkdownRenderer text={res}/> : <span style={{color:"var(--mu)"}}>En attente…</span>)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── RECHERCHE TAB ─────────────────────────────────────────────────
function RechercheTab({ enabled, apiKeys, setChatInput, setTab }) {
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState({});
  const [loading, setLoading] = React.useState({});
  const [hasSearched, setHasSearched] = React.useState(false);
  const activeIds = Object.keys(MODEL_DEFS).filter(id => enabled[id]);

  const SUGGESTIONS = [
    "Quelle est la meilleure IA gratuite en 2025 ?",
    "Comment fonctionne un LLM en pratique ?",
    "Quelles IAs sont bonnes pour coder ?",
    "IA générative : quels risques éthiques ?",
    "Comment créer un agent IA autonome ?",
  ];
  const SEARCH_SYSTEM = "Tu es un assistant de recherche expert. Réponds de manière structurée, factuelle et complète. Utilise des sous-titres et listes pour organiser.";

  const doSearch = async (q) => {
    const qry = (q || query).trim();
    if (!qry || !activeIds.length) return;
    setQuery(qry); setHasSearched(true);
    const newLoad = {}; activeIds.forEach(id=>{newLoad[id]=true;}); setLoading(newLoad);
    const newRes = {}; activeIds.forEach(id=>{newRes[id]=""}); setResults(newRes);
    await Promise.all(activeIds.map(async (id) => {
      try {
        const reply = await callModel(id, [{role:"user",content:qry}], apiKeys, SEARCH_SYSTEM);
        setResults(prev => ({...prev,[id]:reply}));
      } catch(e) { setResults(prev => ({...prev,[id]:"❌ "+e.message})); }
      finally { setLoading(prev => ({...prev,[id]:false})); }
    }));
  };

  return (
    <div className="srch-wrap">
      <div className="srch-top">
        <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:"clamp(13px,2.2vw,16px)",color:"var(--tx)"}}>
          🔎 Recherche Multi-IA
          <span style={{fontWeight:400,fontSize:9,color:"var(--mu)",marginLeft:8}}>Toutes tes IAs actives répondent en parallèle</span>
        </div>
        <div className="srch-input-row">
          <input className="srch-inp" placeholder="Pose ta question…"
            value={query} onChange={e=>setQuery(e.target.value)}
            onKeyDown={e=>{ if(e.key==="Enter") doSearch(); }}/>
          <button className="srch-btn" onClick={()=>doSearch()} disabled={!query.trim()||!activeIds.length}>
            🔎 Chercher ({activeIds.length} IAs)
          </button>
        </div>
        {!hasSearched && (
          <div className="srch-suggestions">
            {SUGGESTIONS.map((s,i) => (
              <button key={i} className="filter-btn" style={{fontSize:9}} onClick={()=>doSearch(s)}>{s}</button>
            ))}
          </div>
        )}
      </div>
      <div className="srch-results">
        {!hasSearched && (
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",gap:10,color:"var(--mu)",fontSize:11,textAlign:"center",padding:20}}>
            <div style={{fontSize:36}}>🔎</div>
            <strong style={{color:"var(--tx)"}}>Recherche simultanée</strong>
            <div style={{maxWidth:300}}>Tape une question et compare les réponses de {activeIds.length} IA{activeIds.length>1?"s":""} côte à côte.</div>
          </div>
        )}
        {hasSearched && activeIds.map(id => {
          const m = MODEL_DEFS[id];
          return (
            <div key={id} className="srch-card" style={{borderColor:m.color+"33"}}>
              <div className="srch-card-hdr" style={{background:m.bg+"44"}}>
                <span style={{color:m.color,fontSize:13}}>{m.icon}</span>
                <span style={{color:m.color,fontWeight:700,fontSize:11,fontFamily:"'Syne',sans-serif"}}>{m.name}</span>
                {results[id] && !loading[id] && (
                  <button style={{marginLeft:"auto",background:"none",border:"1px solid var(--bd)",borderRadius:3,color:"var(--mu)",cursor:"pointer",fontSize:8,padding:"2px 6px",fontFamily:"'IBM Plex Mono',monospace"}}
                    onClick={()=>{setChatInput(query);navigateTab("chat");}}>↗ Chat</button>
                )}
              </div>
              <div className="srch-card-body">
                {loading[id] ? <span className="dots"><span>·</span><span>·</span><span>·</span></span> : (results[id] ? <MarkdownRenderer text={results[id]}/> : <span style={{color:"var(--mu)"}}>En attente…</span>)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── WORKFLOWS TAB ─────────────────────────────────────────────────

// ── STATS TAB ─────────────────────────────────────────────────────
function StatsTab({ stats, onReset }) {
  const totalMsgs = Object.values(stats.msgs||{}).reduce((a,b)=>a+b,0);
  const totalTok = Object.values(stats.tokens||{}).reduce((a,b)=>a+b,0);
  const totalConvs = stats.convs || 0;
  const topIA = Object.entries(stats.msgs||{}).sort(([,a],[,b])=>b-a)[0];
  const maxTok = Math.max(...Object.values(stats.tokens||{}).map(v=>v||0),1);

  const estimateCost = (id) => {
    const tok = stats.tokens?.[id] || 0;
    const p = PRICING[id];
    if (!p || !tok) return 0;
    return ((tok*0.7/1e6)*p.in + (tok*0.3/1e6)*p.out);
  };
  const totalCost = Object.keys(MODEL_DEFS).reduce((a,id)=>a+estimateCost(id),0);
  const fmtN = (n) => n>=1e6?(n/1e6).toFixed(1)+"M":n>=1000?(n/1000).toFixed(1)+"k":String(n||0);
  const fmtCost = (c) => c<0.01?"< $0.01":"$"+c.toFixed(3);

  return (
    <div className="stats-wrap">
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16,flexWrap:"wrap"}}>
        <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:"clamp(14px,2.5vw,18px)",color:"var(--tx)"}}>📊 Statistiques d'usage</div>
        <button style={{marginLeft:"auto",padding:"5px 12px",background:"rgba(248,113,113,.1)",border:"1px solid rgba(248,113,113,.3)",borderRadius:5,color:"var(--red)",cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace",fontSize:9}}
          onClick={()=>{ if(window.confirm("Réinitialiser les statistiques ?")) onReset(); }}>↺ Réinitialiser</button>
      </div>
      <div className="stats-grid">
        <div className="stat-card"><div className="stat-val">{totalConvs}</div><div className="stat-lbl">Conversations</div></div>
        <div className="stat-card"><div className="stat-val">{fmtN(totalMsgs)}</div><div className="stat-lbl">Messages envoyés</div></div>
        <div className="stat-card"><div className="stat-val">{fmtN(totalTok)}</div><div className="stat-lbl">Tokens estimés</div></div>
        <div className="stat-card"><div className="stat-val">{fmtCost(totalCost)}</div><div className="stat-lbl">Coût estimé</div></div>
        {topIA && <div className="stat-card"><div className="stat-val">{MODEL_DEFS[topIA[0]]?.icon}</div><div className="stat-lbl">IA préférée</div><div className="stat-sub" style={{color:MODEL_DEFS[topIA[0]]?.color}}>{MODEL_DEFS[topIA[0]]?.short} — {topIA[1]} msg</div></div>}
      </div>
      <div className="stats-bar-section">
        <div style={{fontSize:10,fontWeight:700,color:"var(--tx)",marginBottom:10,borderBottom:"1px solid var(--bd)",paddingBottom:6}}>Messages par IA</div>
        {Object.keys(MODEL_DEFS).map(id => {
          const m = MODEL_DEFS[id]; const count = stats.msgs?.[id]||0;
          const maxC = Math.max(...Object.values(stats.msgs||{}).map(v=>v||0),1);
          return (<div key={id} className="stats-bar-row">
            <div className="stats-bar-name" style={{color:m.color}}>{m.icon} {m.short}</div>
            <div className="stats-bar-track"><div className="stats-bar-fill" style={{width:(count/maxC*100)+"%",background:m.color}}/></div>
            <div className="stats-bar-val">{count} msg</div>
          </div>);
        })}
      </div>
      <div className="stats-bar-section">
        <div style={{fontSize:10,fontWeight:700,color:"var(--tx)",marginBottom:10,borderBottom:"1px solid var(--bd)",paddingBottom:6}}>Tokens & Coûts estimés par IA</div>
        {Object.keys(MODEL_DEFS).map(id => {
          const m = MODEL_DEFS[id]; const tok = stats.tokens?.[id]||0; const p = PRICING[id];
          return (<div key={id} className="stats-bar-row">
            <div className="stats-bar-name" style={{color:m.color}}>{m.icon} {m.short}</div>
            <div className="stats-bar-track"><div className="stats-bar-fill" style={{width:(tok/maxTok*100)+"%",background:m.color}}/></div>
            <div className="stats-bar-val">{fmtN(tok)}t · {fmtCost(estimateCost(id))}</div>
          </div>);
        })}
        <div style={{marginTop:10,paddingTop:8,borderTop:"1px solid var(--bd)",display:"flex",justifyContent:"space-between",fontSize:11,fontWeight:700}}>
          <span style={{color:"var(--tx)"}}>Total estimé</span><span style={{color:"var(--ac)"}}>{fmtCost(totalCost)}</span>
        </div>
        <div style={{marginTop:4,fontSize:8,color:"var(--mu)"}}>⚠️ Estimation approx. (70% input / 30% output). Claude est intégré donc sans coût API ici.</div>
      </div>
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────
// ── COMPOSANT WebIAsTab ─────────────────────────────────────────
function WebIAsTab() {
  const [discovered, setDiscovered] = React.useState(getDiscoveredAIs());
  const [discovering, setDiscovering] = React.useState(false);
  const [discMsg, setDiscMsg] = React.useState("");
  const [filterCat, setFilterCat] = React.useState("all");
  const [search, setSearch] = React.useState("");

  const allAIs = [...BASE_WEB_AIS, ...discovered];
  const cats = [
    {id:"all",      label:"Tout",          icon:"🌐"},
    {id:"gratuit",  label:"Chatbots",      icon:"💬"},
    {id:"recherche",label:"Recherche",     icon:"🔍"},
    {id:"multimodele",label:"Multi-modèles",icon:"🔀"},
    {id:"image",    label:"Image",         icon:"🎨"},
    {id:"code",     label:"Code",          icon:"💻"},
    {id:"audio",    label:"Audio/Musique", icon:"🎵"},
    {id:"payant",   label:"Premium",       icon:"💳"},
  ];

  const filtered = allAIs.filter(ia => {
    const matchCat = filterCat === "all" || ia.cat === filterCat;
    const matchSearch = !search || ia.name.toLowerCase().includes(search.toLowerCase()) || ia.desc.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  async function discoverNewAIs() {
    setDiscovering(true);
    setDiscMsg("🔍 Recherche de nouvelles IAs via Groq...");
    try {
      let groqKey = "";
      try { groqKey = JSON.parse(localStorage.getItem("multiia_keys")||"{}").groq_inf||""; } catch{}
      if (!groqKey) throw new Error("Clé Groq manquante — configure-la dans ⚙ Config d'abord");
      const prompt = "Tu es un expert en outils IA. Liste 5 nouvelles IAs web accessibles gratuitement en 2025-2026 qui ne font PAS partie de cette liste: " + allAIs.map(a=>a.name).join(", ") + ". Reponds UNIQUEMENT en JSON valide, tableau d objets avec ces champs: [{id,name,subtitle,cat,url,color,icon,desc}] ou cat est parmi: gratuit|recherche|multimodele|image|code|audio|payant. Pas de texte avant ou apres le JSON.";
      const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method:"POST",
        headers:{"Content-Type":"application/json","Authorization":"Bearer "+groqKey},
        body:JSON.stringify({ model:"llama-3.3-70b-versatile", max_tokens:1000,
          messages:[{role:"user",content:prompt}] })
      });
      const data = await resp.json();
      const text = data.choices?.[0]?.message?.content || "[]";
      const clean = text.replace(/```json|```/g,"").trim();
      const newAIs = JSON.parse(clean);
      const existing = new Set(allAIs.map(a=>a.id));
      const toAdd = newAIs.filter(a=>a.id && a.name && a.url && !existing.has(a.id));
      if(toAdd.length > 0) {
        const updated = [...discovered, ...toAdd];
        setDiscovered(updated);
        saveDiscoveredAIs(updated);
        setDiscMsg(`✅ ${toAdd.length} nouvelle(s) IA(s) ajoutée(s) !`);
      } else {
        setDiscMsg("ℹ️ Aucune nouvelle IA trouvée pour l'instant.");
      }
    } catch(e) {
      setDiscMsg("❌ Erreur: " + e.message);
    }
    setDiscovering(false);
    setTimeout(()=>setDiscMsg(""), 4000);
  }

  function removeDiscovered(id) {
    const updated = discovered.filter(a=>a.id!==id);
    setDiscovered(updated);
    saveDiscoveredAIs(updated);
  }

  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      {/* Header */}
      <div style={{padding:"10px 14px",borderBottom:"1px solid var(--bd)",flexShrink:0,background:"var(--s1)",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
        <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:14,color:"var(--ac)"}}>🌐 IAs Web</div>
        <div style={{flex:1,fontSize:9,color:"var(--mu)"}}>{allAIs.length} IAs — s'ouvrent dans un nouvel onglet</div>
        <button onClick={discoverNewAIs} disabled={discovering}
          style={{padding:"4px 10px",fontSize:9,fontWeight:700,borderRadius:5,border:"1px solid var(--ac)",background:"transparent",color:"var(--ac)",cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace",opacity:discovering?.6:1}}>
          {discovering?"⏳ Recherche...":"🔭 Découvrir de nouvelles IAs"}
        </button>
        {discMsg && <div style={{fontSize:9,color:"var(--green)"}}>{discMsg}</div>}
      </div>
      {/* Filtres */}
      <div style={{display:"flex",gap:6,padding:"8px 14px",borderBottom:"1px solid var(--bd)",flexShrink:0,flexWrap:"wrap",alignItems:"center"}}>
        {cats.map(c=>(
          <button key={c.id} onClick={()=>setFilterCat(c.id)}
            style={{padding:"3px 9px",fontSize:9,fontWeight:600,borderRadius:12,border:"1px solid "+(filterCat===c.id?"var(--ac)":"var(--bd)"),background:filterCat===c.id?"var(--ac)":"transparent",color:filterCat===c.id?"var(--bg)":"var(--mu)",cursor:"pointer",transition:"all .15s"}}>
            {c.icon} {c.label} {filterCat===c.id&&<span style={{opacity:.7}}>({allAIs.filter(a=>c.id==="all"||a.cat===c.id).length})</span>}
          </button>
        ))}
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Rechercher..."
          style={{marginLeft:"auto",padding:"3px 9px",fontSize:9,borderRadius:12,border:"1px solid var(--bd)",background:"var(--s1)",color:"var(--tx)",outline:"none",width:140}}/>
      </div>
      {/* Grille */}
      <div style={{flex:1,overflow:"auto",padding:"12px 14px"}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:8}}>
          {filtered.map(ia=>(
            <div key={ia.id} style={{position:"relative"}}>
              <a href={ia.url} target="_blank" rel="noreferrer"
                style={{display:"flex",flexDirection:"column",gap:6,padding:"10px 12px",background:"var(--s1)",border:`1px solid ${ia.color}33`,borderRadius:7,textDecoration:"none",transition:"all .15s",height:"100%",boxSizing:"border-box"}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=ia.color;e.currentTarget.style.transform="translateY(-2px)"}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=ia.color+"33";e.currentTarget.style.transform=""}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:16,width:24,textAlign:"center"}}>{ia.icon}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:11,fontWeight:700,color:"var(--tx)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{ia.name}</div>
                    <div style={{fontSize:8,color:ia.color}}>{ia.subtitle}</div>
                  </div>
                  <span style={{fontSize:9,color:"var(--mu)"}}>↗</span>
                </div>
                <div style={{fontSize:9,color:"var(--mu)",lineHeight:1.4}}>{ia.desc}</div>
                <div style={{marginTop:"auto"}}>
                  <span style={{fontSize:7,padding:"1px 5px",borderRadius:3,background:ia.color+"18",color:ia.color,fontWeight:700}}>
                    {ia.cat==="gratuit"?"GRATUIT":ia.cat==="recherche"?"RECHERCHE":ia.cat==="multimodele"?"MULTI-MODÈLES":ia.cat==="image"?"IMAGE":ia.cat==="code"?"CODE":ia.cat==="audio"?"AUDIO":"PREMIUM"}
                  </span>
                </div>
              </a>
              {discovered.find(d=>d.id===ia.id) && (
                <button onClick={()=>removeDiscovered(ia.id)}
                  title="Retirer cette IA"
                  style={{position:"absolute",top:4,right:4,fontSize:8,background:"rgba(0,0,0,.5)",border:"none",color:"var(--mu)",cursor:"pointer",borderRadius:3,padding:"1px 4px",zIndex:2}}>✕</button>
              )}
            </div>
          ))}
        </div>
        {filtered.length===0 && <div style={{textAlign:"center",color:"var(--mu)",fontSize:11,padding:40}}>Aucune IA trouvée pour "{search}"</div>}
        {/* Sources discovery */}
        <div style={{marginTop:20,padding:"10px 14px",background:"var(--s1)",borderRadius:8,border:"1px solid var(--bd)"}}>
          <div style={{fontSize:9,fontWeight:700,color:"var(--mu)",marginBottom:8}}>🔭 Sources pour découvrir de nouvelles IAs</div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {DISCOVERY_SOURCES.map(s=>(
              <a key={s.name} href={s.url} target="_blank" rel="noreferrer"
                style={{fontSize:9,color:"var(--ac)",textDecoration:"none",padding:"3px 8px",border:"1px solid var(--bd)",borderRadius:4}}>
                ↗ {s.name}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  const prevTabRef = React.useRef(null);

  // Tab order for transition direction
  const TAB_ORDER = ["chat","prompts","redaction","recherche","workflows","medias","arena","debate","compare","notes","traducteur","agent","webia","stats","config"];
  const navigateTab = (newTab) => {
    const oldIdx = TAB_ORDER.indexOf(prevTabRef.current || "chat");
    const newIdx = TAB_ORDER.indexOf(newTab);
    setTabAnimDir(newIdx > oldIdx ? "right" : newIdx < oldIdx ? "left" : "enter");
    prevTabRef.current = newTab;
    setTab(newTab);
  };

  const [tabAnimDir, setTabAnimDir] = React.useState('enter');
  const [tab, setTab] = useState(() => {
    // Shortcuts PWA — ?tab=chat, ?tab=redaction, etc.
    const params = new URLSearchParams(window.location.search);
    const t = params.get("tab");
    const VALID_TABS = ["chat","prompts","redaction","recherche","workflows","workflow","web","medias","arena","debate","compare","notes","traducteur","agent","webia","stats","config"];
    return VALID_TABS.includes(t) ? t : "chat";
  });
  const [mobileCol, setMobileCol] = useState("groq");
  const [soloId, setSoloId] = useState(null);
  const [arenaFilter, setArenaFilter] = useState("all");
  const [imgFilter, setImgFilter] = useState("free");
  const [arenaSort, setArenaSort] = useState("score");

  const [enabled, setEnabled] = useState(() => {
    try { const s = localStorage.getItem("multiia_enabled"); return s ? JSON.parse(s) : { groq:true,mistral:true,cohere:false,cerebras:false,sambanova:false,qwen3:false,llama4s:false,gemma2:false,poll_gpt:false,poll_claude:false,poll_deepseek:false,poll_gemini:false }; }
    catch { return { groq:true,mistral:true,cohere:false,cerebras:false,sambanova:false,qwen3:false,llama4s:false,gemma2:false,poll_gpt:false,poll_claude:false,poll_deepseek:false,poll_gemini:false }; }
  });

  const [apiKeys, setApiKeys] = useState(() => {
    try { const s = localStorage.getItem("multiia_keys"); return s ? JSON.parse(s) : { mistral:"",groq_inf:"",cohere:"",cerebras:"",sambanova:"",pollen:"" }; }
    catch { return { mistral:"",groq_inf:"",cohere:"",cerebras:"",sambanova:"",pollen:"" }; }
  });

  useEffect(() => { try { localStorage.setItem("multiia_keys", JSON.stringify(apiKeys)); } catch {} }, [apiKeys]);
  useEffect(() => { try { localStorage.setItem("multiia_enabled", JSON.stringify(enabled)); } catch {} }, [enabled]);

  const [limited, setLimited] = useState({});
  const [countdowns, setCountdowns] = useState({});

  useEffect(() => {
    const iv = setInterval(() => {
      const now = Date.now();
      const newCd = {};
      let changed = false;
      Object.entries(limited).forEach(([id, info]) => {
        const rem = Math.ceil((info.until - now) / 1000);
        if (rem > 0) newCd[id] = rem; else changed = true;
      });
      if (changed) setLimited(prev => { const n={...prev}; Object.keys(n).forEach(id => { if((n[id].until-now)<=0) delete n[id]; }); return n; });
      setCountdowns(newCd);
    }, 1000);
    return () => clearInterval(iv);
  }, [limited]);

  const markLimited = (id, type) => {
    if (type === "credit_warn") return; // Ne pas bloquer sur erreur de crédit — l'utilisateur a peut-être du crédit
    const secs = RATE_LIMIT_COOLDOWN;
    setLimited(prev => ({ ...prev, [id]: { until: Date.now() + secs * 1000, type } }));
  };
  const isLimited = (id) => limited[id] && limited[id].until > Date.now();
  const fmtCd = (id) => { const s = countdowns[id]; if(!s) return ""; return s >= 60 ? `${Math.floor(s/60)}m${s%60}s` : `${s}s`; };

  const exportConv = (id) => {
    const m = MODEL_DEFS[id];
    const msgs = conversations[id];
    if (!msgs || msgs.length === 0) { showToast("Aucune conversation à exporter"); return; }
    const lines = [
      `━━━ Conversation exportée depuis Multi-IA Hub ━━━`,
      `IA : ${m.name} (${m.provider})`,
      `Date : ${new Date().toLocaleString("fr-FR")}`,
      `Messages : ${msgs.filter(x=>x.role!=="error"&&x.role!=="blocked").length}`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      "",
      ...msgs.filter(x => x.role !== "error" && x.role !== "blocked").map(msg => {
        const label = msg.role === "user" ? "👤 Vous" : `🤖 ${m.short}`;
        return `${label} :\n${msg.content}\n`;
      }),
      `━━━ Fin de conversation ━━━`,
      `Copiez ce texte et collez-le dans une autre IA pour continuer.`,
    ];
    const txt = lines.join("\n");
    try {
      const blob = new Blob([txt], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `conv-${m.short.toLowerCase()}-${Date.now()}.txt`;
      a.click(); URL.revokeObjectURL(url);
      showToast(`✓ Conversation ${m.short} exportée`);
    } catch {
      // fallback: modal avec textarea
      const modal = document.createElement("div");
      modal.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px";
      modal.innerHTML = `<div style="background:#1A1A1A;border:1px solid #333;border-radius:10px;padding:20px;max-width:600px;width:100%;max-height:80vh;display:flex;flex-direction:column;gap:12px">
        <div style="font-family:'Syne',sans-serif;font-weight:700;color:#D4A853">📋 Conversation — ${m.name}</div>
        <textarea readonly style="flex:1;min-height:300px;background:#0D0D0D;border:1px solid #333;border-radius:6px;color:#CCC;padding:10px;font-size:11px;font-family:'IBM Plex Mono',monospace;resize:vertical">${txt}</textarea>
        <div style="display:flex;gap:8px;justify-content:flex-end">
          <button onclick="navigator.clipboard.writeText(this.closest('div').previousElementSibling.value)" style="padding:7px 14px;background:rgba(212,168,83,.15);border:1px solid #D4A853;border-radius:5px;color:#D4A853;cursor:pointer;font-family:'IBM Plex Mono',monospace;font-size:11px">⎘ Copier</button>
          <button onclick="this.closest('[style*=fixed]').remove()" style="padding:7px 14px;background:transparent;border:1px solid #333;border-radius:5px;color:#888;cursor:pointer;font-family:'IBM Plex Mono',monospace;font-size:11px">✕ Fermer</button>
        </div>
      </div>`;
      document.body.appendChild(modal);
    }
  };

  const [conversations, setConversations] = useState(() => Object.fromEntries(IDS.map(id => [id, []])));
  const [loading, setLoading] = useState(() => Object.fromEntries(IDS.map(id => [id, false])));
  const abortRefs = React.useRef({}); // {id: AbortController}
  const msgsEndRefs = React.useRef({}); // {id: ref}
  const [chatInput, setChatInput] = useState("");
  const [modal, setModal] = useState(null);
  const [keyDraft, setKeyDraft] = useState("");

  // ── Historique des conversations ──
  const [savedConvs, setSavedConvs] = useState(() => {
    try { return JSON.parse(localStorage.getItem("multiia_history") || "[]"); } catch { return []; }
  });
  const [activeHistId, setActiveHistId] = useState(null);
  const [showHist, setShowHist] = useState(false);
  const [toast, setToast] = useState(null);

  // ── Stats d'usage ───────────────────────────────────────────────
  const STATS_KEY = "multiia_stats";
  const loadStats = () => { try { return JSON.parse(localStorage.getItem(STATS_KEY)||"{}"); } catch { return {}; } };
  const [usageStats, setUsageStats] = React.useState(loadStats);
  const resetStats = () => { setUsageStats({}); localStorage.removeItem(STATS_KEY); };
  React.useEffect(() => { localStorage.setItem(STATS_KEY, JSON.stringify(usageStats)); }, [usageStats]);
  const [cfgDrafts, setCfgDrafts] = useState({});
  const [showExportModal, setShowExportModal] = useState(false);
  const fileRef = useRef(null);
  const msgRefs = useRef(Object.fromEntries(IDS.map(id => [id, null])));

  const [grammarLoading, setGrammarLoading] = useState(false);
  const [grammarResult, setGrammarResult] = useState(null);
  const [showGrammarPopup, setShowGrammarPopup] = useState(false);

  // ── Thème clair/sombre ──
  const [darkMode, setDarkMode] = useState(() => {
    try { return localStorage.getItem("multiia_theme") !== "light"; } catch { return true; }
  });
  useEffect(() => {
    document.documentElement.classList.toggle("light", !darkMode);
    try { localStorage.setItem("multiia_theme", darkMode?"dark":"light"); } catch {}
  }, [darkMode]);

  // ── Mode Focus (1 IA plein écran) ──────────────────────────────
  const [focusId, setFocusId] = useState(null);

  // ── Recherche plein-texte historique ───────────────────────────
  const [histSearch, setHistSearch] = useState("");
  const FOLDERS_KEY = "multiia_hist_folders";
  const [histFolders, setHistFolders] = useState(() => {
    try { return JSON.parse(localStorage.getItem(FOLDERS_KEY) || '["Tout","⭐ Favoris"]'); } catch { return ["Tout","⭐ Favoris"]; }
  });
  const [activeFolder, setActiveFolder] = useState("Tout");
  const [showFolderInput, setShowFolderInput] = useState(false);
  const [folderInput, setFolderInput] = useState("");
  const saveHistFolders = (fl) => { setHistFolders(fl); try { localStorage.setItem(FOLDERS_KEY, JSON.stringify(fl)); } catch {} };
  const addFolder = () => {
    const name = folderInput.trim(); if (!name || histFolders.includes(name)) return;
    saveHistFolders([...histFolders, name]);
    setFolderInput(""); setShowFolderInput(false);
  };
  const moveConvToFolder = (convId, folder) => {
    const updated = savedConvs.map(c => c.id === convId ? {...c, folder} : c);
    setSavedConvs(updated);
    try { localStorage.setItem("multiia_history", JSON.stringify(updated)); } catch {}
  };
  const filteredConvs = savedConvs.filter(c => {
    const matchFolder = activeFolder === "Tout" ? true
      : activeFolder === "⭐ Favoris" ? c.favorite === true
      : (c.folder || "Sans dossier") === activeFolder;
    if (!matchFolder) return false;
    if (!histSearch.trim()) return true;
    const q = histSearch.toLowerCase();
    if (c.title.toLowerCase().includes(q)) return true;
    return Object.values(c.conversations||{}).flat().some(m => m.content?.toLowerCase().includes(q));
  });

  // ── RAG : document long → chunks ───────────────────────────────
  const [ragText, setRagText] = useState("");
  const [ragChunks, setRagChunks] = useState([]);
  const [showRagPanel, setShowRagPanel] = useState(false);
  const processRagText = (text) => {
    const CHUNK = 1200;
    const chunks = [];
    for (let i = 0; i < text.length; i += CHUNK) chunks.push(text.slice(i, i+CHUNK));
    setRagChunks(chunks);
    setRagText(text);
    showToast(`✓ Document découpé en ${chunks.length} morceaux`);
  };
  const getRagContext = (query) => {
    if (!ragChunks.length) return null;
    const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const scored = ragChunks.map((chunk, i) => ({
      chunk, i,
      score: words.reduce((acc, w) => acc + (chunk.toLowerCase().split(w).length - 1), 0)
    })).sort((a,b) => b.score - a.score);
    const top = scored.slice(0, 2).map(s => s.chunk).join("\n\n---\n\n");
    return `[Contexte du document]\n${top}\n\n[Question de l'utilisateur]\n${query}`;
  };

  // ── Ollama local ────────────────────────────────────────────────
  const [ollamaUrl, setOllamaUrl] = useState(() => { try { return localStorage.getItem("multiia_ollama")||"http://localhost:11434"; } catch { return "http://localhost:11434"; } });
  const [ollamaModels, setOllamaModels] = useState([]);
  const [ollamaConnected, setOllamaConnected] = useState(false);
  const [ollamaActive, setOllamaActive] = useState(false);
  const [ollamaModel, setOllamaModel] = useState("");
  const [showOllamaPanel, setShowOllamaPanel] = useState(false);
  const checkOllama = async (url) => {
    const base = (url||ollamaUrl).replace(/\/$/, "");
    try {
      const r = await fetch(base+"/api/tags", { signal: AbortSignal.timeout(3000) });
      if (r.ok) {
        const d = await r.json();
        const models = (d.models||[]).map(m => m.name);
        setOllamaModels(models);
        setOllamaConnected(true);
        if (models.length && !ollamaModel) setOllamaModel(models[0]);
        localStorage.setItem("multiia_ollama", base);
        showToast(`✓ Ollama connecté — ${models.length} modèle(s)`);
        return true;
      }
    } catch {}
    setOllamaConnected(false);
    setOllamaModels([]);
    showToast("✗ Ollama non trouvé — Lance Ollama sur ton PC");
    return false;
  };
  const callOllama = async (model, messages, system) => {
    const base = ollamaUrl.replace(/\/$/, "");
    const msgs = system ? [{role:"system",content:system},...messages] : messages;
    const r = await fetch(base+"/api/chat", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ model: model||ollamaModel, messages: msgs, stream: false })
    });
    if (!r.ok) throw new Error("Ollama "+r.status+" — modèle disponible ?");
    const d = await r.json();
    return d.message?.content || "";
  };

  // ── Vote automatique "Meilleure réponse" ────────────────────────
  const [bestVote, setBestVote] = useState(null); // { winner, scores:{id:{precision,clarte,completude,utilite,total}}, reason, points:{id:[]} }
  const [voteLoading, setVoteLoading] = useState(false);
  const [voteHistory, setVoteHistory] = useState([]); // historique tous les verdicts
  const [showVoteDetail, setShowVoteDetail] = useState(false); // expand jury bandeau
  const [showDiffModal, setShowDiffModal] = useState(false); // modal diff
  const [diffPair, setDiffPair] = useState([null,null]); // [id1, id2] pour diff
  const [showRecap, setShowRecap] = useState(false); // recap table collapsible
  const runAutoVote = async (convSnapshot) => {
    const activeIds = IDS.filter(id => enabled[id]);
    if (activeIds.length < 2) return;
    const responses = activeIds.map(id => {
      const msgs = convSnapshot[id] || [];
      const last = [...msgs].reverse().find(m => m.role === "assistant");
      return { id, text: last?.content || "" };
    }).filter(r => r.text.length > 10);
    if (responses.length < 2) return;
    setVoteLoading(true);
    try {
      const judge = IDS.find(id => enabled[id] && !isLimited(id));
      if (!judge) return;
      const sep = ",";
      const scoresSchema = responses.map(r=>'"'+r.id+'": {"precision":0,"clarte":0,"completude":0,"utilite":0,"total":0}').join(sep);
      const pointsSchema = responses.map(r=>'"'+r.id+'": ["point clé 1","point clé 2"]').join(sep);
      const rankingSchema = responses.map(r=>'"'+r.id+'"').join(",");
      const responsesText = responses.map((r,i)=>"IA "+(i+1)+" (id:"+r.id+"):\n"+r.text.slice(0,500)).join("\n\n");
      const prompt = "Tu es un juge expert en IA. Évalue ces "+responses.length+" réponses à la même question.\n\n"+responsesText+"\n\nRéponds UNIQUEMENT en JSON valide, sans markdown, sans texte autour :\n{\n  \"winner\": \"id_du_gagnant\",\n  \"scores\": {"+scoresSchema+"},\n  \"reason\": \"explication 1-2 phrases du classement\",\n  \"points\": {"+pointsSchema+"},\n  \"ranking\": ["+rankingSchema+"]\n}\nScores de 1 à 10. total = moyenne des 4. ranking = du meilleur au moins bon.";
      const reply = await callModel(judge, [{role:"user",content:prompt}], apiKeys, "Tu es un juge objectif. JSON uniquement, sans markdown ni texte autour.");
      const clean = reply.replace(/```json[\s\S]*?```|```[\s\S]*?```/g, s => s.replace(/```json|```/g,"")).replace(/```/g,"").trim();
      const result = JSON.parse(clean);
      setBestVote(result);
      setVoteHistory(prev => [...prev.slice(-49), {...result, ts: Date.now(), question: (Object.values(convSnapshot).find(msgs=>msgs)?.[0]?.content||"").slice(0,60) }]);
    } catch(e) { console.warn("Vote err:", e.message); }
    setVoteLoading(false);
  };

  // ── Workflow visuel (chaîne de prompts) ────────────────────────
  const [workflowNodes, setWorkflowNodes] = useState(() => {
    try { return JSON.parse(localStorage.getItem("multiia_workflow")||"[]"); } catch { return []; }
  });
  const [workflowRunning, setWorkflowRunning] = useState(false);
  const [workflowResults, setWorkflowResults] = useState([]); // [{nodeId,label,ia,output,ok,duration}]
  const [workflowRunStep, setWorkflowRunStep] = useState(null); // id of currently running step
  const [workflowSavedTpls, setWorkflowSavedTpls] = useState(() => {
    try { return JSON.parse(localStorage.getItem("multiia_wf_templates")||"[]"); } catch { return []; }
  });
  const [workflowInput, setWorkflowInput] = useState("");
  const wfAbortRef = React.useRef(null);

  const saveWorkflow = (nodes) => { setWorkflowNodes(nodes); try { localStorage.setItem("multiia_workflow", JSON.stringify(nodes)); } catch {} };
  const saveWfTemplates = (tpls) => { setWorkflowSavedTpls(tpls); try { localStorage.setItem("multiia_wf_templates", JSON.stringify(tpls)); } catch {} };

  const addWorkflowNode = (type="prompt") => {
    const firstActive = IDS.find(id=>enabled[id]) || IDS[0];
    const node = {
      id: Date.now().toString(),
      label: `Étape ${workflowNodes.length+1}`,
      type,                          // "prompt" | "parallel" | "transform"
      ia: firstActive,
      parallel_ias: [firstActive],   // for parallel type
      prompt: "",
      name: `step${workflowNodes.length+1}`, // variable name for {stepN}
      usePrevOutput: workflowNodes.length > 0,
      maxTokens: 2000,
    };
    saveWorkflow([...workflowNodes, node]);
  };

  const cancelModelCall = (id) => {
    if (abortRefs.current[id]) {
      abortRefs.current[id].abort();
      delete abortRefs.current[id];
    }
    setLoading(prev => ({ ...prev, [id]: false }));
    setConversations(prev => ({
      ...prev,
      [id]: [...(prev[id]||[]), { role:"error", content:"⏹ Réponse annulée" }]
    }));
  };

  const cancelWorkflow = () => {
    if (wfAbortRef.current) wfAbortRef.current.abort();
    setWorkflowRunning(false);
    setWorkflowRunStep(null);
    showToast("⏹ Workflow annulé");
  };

  const runWorkflow = async (input) => {
    const inp = (input !== undefined ? input : workflowInput) || "";
    if (!workflowNodes.length) { showToast("Ajoute des étapes d'abord !"); return; }
    const abort = new AbortController();
    wfAbortRef.current = abort;
    setWorkflowRunning(true); setWorkflowResults([]); setWorkflowRunStep(null);

    const namedOutputs = { INPUT: inp }; // {stepName: output}
    let prevOutput = inp;
    const results = [];
    const t0 = Date.now();

    const resolvePrompt = (template, prev, named) => {
      let p = template || prev;
      p = p.replace(/\{INPUT\}/g, inp);
      p = p.replace(/\{PREVIOUS\}/g, prev);
      Object.entries(named).forEach(([k,v]) => { p = p.replace(new RegExp("\\{"+k+"\\}", "g"), v); });
      return p;
    };

    for (const node of workflowNodes) {
      if (abort.signal.aborted) break;
      setWorkflowRunStep(node.id);
      const stepT0 = Date.now();

      try {
        let output = "";
        if (node.type === "parallel") {
          // Run multiple IAs simultaneously, combine results
          const ias = (node.parallel_ias||[node.ia]).filter(id => enabled[id] || id === node.ia);
          const prompt = resolvePrompt(node.prompt, prevOutput, namedOutputs);
          const replies = await Promise.all(ias.map(async id => {
            try {
              const r = await callModel(id, [{role:"user",content:prompt}], apiKeys, buildSystem(), null);
              return `**${MODEL_DEFS[id]?.short||id}**: ${r}`;
            } catch(e) { return `**${MODEL_DEFS[id]?.short||id}**: ❌ ${e.message}`; }
          }));
          output = replies.join("\n\n---\n\n");
        } else if (node.type === "transform") {
          // JS transform function: receives prev output, returns transformed string
          try {
            // eslint-disable-next-line no-new-func
            const fn = new Function("input","prev","named", node.prompt || "return prev;");
            output = String(fn(inp, prevOutput, namedOutputs));
          } catch(e) { output = "❌ Erreur transform : " + e.message; }
        } else {
          // Default: prompt type
          const prompt = resolvePrompt(node.prompt, prevOutput, namedOutputs);
          const reply = await callModel(node.ia, [{role:"user",content:prompt}], apiKeys, buildSystem(), null);
          output = reply;
        }

        prevOutput = output;
        namedOutputs[node.name || node.id] = output;
        const duration = Date.now() - stepT0;
        results.push({ nodeId:node.id, label:node.label, ia:node.ia, type:node.type, output, ok:true, duration });
      } catch(e) {
        const duration = Date.now() - stepT0;
        results.push({ nodeId:node.id, label:node.label, ia:node.ia, type:node.type, output:e.message, ok:false, duration });
        setWorkflowResults([...results]);
        break;
      }
      setWorkflowResults([...results]);
    }
    setWorkflowRunStep(null); setWorkflowRunning(false);
    const totalTime = ((Date.now()-t0)/1000).toFixed(1);
    if (!abort.signal.aborted) showToast(`✓ Workflow — ${results.filter(r=>r.ok).length}/${workflowNodes.length} étapes en ${totalTime}s`);
  };

  // ── Plugins JS ──────────────────────────────────────────────────
  const [plugins, setPlugins] = useState(() => {
    try { return JSON.parse(localStorage.getItem("multiia_plugins")||"[]"); } catch { return []; }
  });
  const [showPluginPanel, setShowPluginPanel] = useState(false);
  const [pluginUrlInput, setPluginUrlInput] = useState("");
  const loadPlugin = async (url) => {
    try {
      const script = document.createElement("script");
      script.src = url;
      script.onload = () => {
        const name = url.split("/").pop().replace(".js","");
        const newPlugins = [...plugins.filter(p=>p.url!==url), {name, url, loaded:true}];
        setPlugins(newPlugins);
        localStorage.setItem("multiia_plugins", JSON.stringify(newPlugins));
        showToast(`✓ Plugin "${name}" chargé`);
      };
      script.onerror = () => showToast("✗ Impossible de charger le plugin");
      document.head.appendChild(script);
    } catch(e) { showToast("✗ Erreur plugin: "+e.message); }
  };

  // ── Export Markdown / PDF ───────────────────────────────────────
  const exportMarkdown = (id) => {
    const m = MODEL_DEFS[id] || { name:"Toutes les IAs", short:"all" };
    const ids = id ? [id] : IDS.filter(i => enabled[i]);
    let md = `# Conversation Multi-IA Hub\n**IA:** ${ids.map(i=>MODEL_DEFS[i]?.name||i).join(", ")}\n**Date:** ${new Date().toLocaleString("fr-FR")}\n\n---\n\n`;
    ids.forEach(cid => {
      const msgs = (conversations[cid]||[]).filter(m=>m.role==="user"||m.role==="assistant");
      if (!msgs.length) return;
      md += `## ${MODEL_DEFS[cid]?.icon} ${MODEL_DEFS[cid]?.name}\n\n`;
      msgs.forEach(msg => {
        md += msg.role==="user" ? `**👤 Vous :**\n${msg.content}\n\n` : `**🤖 ${MODEL_DEFS[cid]?.short} :**\n${msg.content}\n\n---\n\n`;
      });
    });
    const blob = new Blob([md], {type:"text/markdown;charset=utf-8"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href=url; a.download=`conversation-${Date.now()}.md`; a.click();
    URL.revokeObjectURL(url); showToast("✓ Export Markdown téléchargé");
  };
  const exportPDF = (id) => {
    const ids = id ? [id] : IDS.filter(i => enabled[i]);
    const allMsgs = ids.flatMap(cid =>
      (conversations[cid]||[]).filter(m=>m.role==="user"||m.role==="assistant")
        .map(m=>({...m, ia:MODEL_DEFS[cid]?.short||cid, color:MODEL_DEFS[cid]?.color||"#888"}))
    );
    if (!allMsgs.length) { showToast("Aucun message à exporter"); return; }
    const win = window.open("","_blank");
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Conversation Multi-IA Hub</title><style>
body{font-family:Georgia,serif;max-width:800px;margin:40px auto;color:#222;line-height:1.7}
h1{font-size:22px;border-bottom:2px solid #D4A853;padding-bottom:8px}
.msg{margin:16px 0;padding:14px 18px;border-radius:8px}
.user{background:#F3F4F6;border-left:4px solid #6B7280}
.assistant{background:#FFF9F0;border-left:4px solid #D4A853}
.ia-label{font-size:11px;font-weight:bold;color:#888;margin-bottom:6px;text-transform:uppercase}
.content{font-size:14px;white-space:pre-wrap}
.footer{margin-top:40px;font-size:11px;color:#AAA;text-align:center}
</style></head><body>
<h1>🤖 Conversation Multi-IA Hub</h1>
<p style="color:#888;font-size:12px">Exporté le ${new Date().toLocaleString("fr-FR")}</p>
${allMsgs.map(m=>`
<div class="msg ${m.role}">
  <div class="ia-label">${m.role==="user"?"👤 Vous":("🤖 "+m.ia)}</div>
  <div class="content">${m.content.replace(/</g,"&lt;").replace(/>/g,"&gt;")}</div>
</div>`).join("")}
<div class="footer">Généré par Multi-IA Hub v${APP_VERSION}</div>
</body></html>`;
    win.document.write(html); win.document.close();
    setTimeout(()=>win.print(), 500);
    showToast("✓ Fenêtre impression ouverte → Enregistrer en PDF");
  };

  // ── Persona actif ──
  const [activePersona, setActivePersona] = useState("default");
  const [customPersonas, setCustomPersonas] = useState(() => {
    try { return JSON.parse(localStorage.getItem("multiia_personas")||"[]"); } catch { return []; }
  });
  const savePersonas = (list) => { setCustomPersonas(list); try{localStorage.setItem("multiia_personas",JSON.stringify(list));}catch{} };
  const [showPersonaModal, setShowPersonaModal] = useState(false);
  const [personaForm, setPersonaForm] = useState({name:"",icon:"🤖",color:"#D4A853",system:""});
  const allPersonas = [...DEFAULT_PERSONAS, ...customPersonas];
  const currentPersona = allPersonas.find(p=>p.id===activePersona) || DEFAULT_PERSONAS[0];
  const currentSystem = currentPersona.system;

  // ── Mémoire locale (faits persistants injectés dans system) ────
  const MEM_KEY = "multiia_memory";
  const [memFacts, setMemFacts] = useState(() => {
    try { return JSON.parse(localStorage.getItem(MEM_KEY) || "[]"); } catch { return []; }
  });
  const [showMemPanel, setShowMemPanel] = useState(false);
  const [memInput, setMemInput] = useState("");
  const addMemFact = (text) => {
    const fact = text.trim(); if (!fact) return;
    const updated = [...memFacts, { id: Date.now(), text: fact }];
    setMemFacts(updated);
    try { localStorage.setItem(MEM_KEY, JSON.stringify(updated)); } catch {}
    setMemInput("");
  };
  const delMemFact = (id) => {
    const updated = memFacts.filter(f => f.id !== id);
    setMemFacts(updated);
    try { localStorage.setItem(MEM_KEY, JSON.stringify(updated)); } catch {}
  };
  const buildSystem = () => {
    let sys = currentSystem || "";
    if (memFacts.length > 0) {
      const facts = memFacts.map(f => "- " + f.text).join("\n");
      sys = `${sys}\n\n📌 Mémoire utilisateur (rappels persistants) :\n${facts}`.trim();
    }
    return sys;
  };

  // ── Raccourcis clavier globaux ─────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      const active = document.activeElement;
      const inInput = active && (active.tagName==="INPUT"||active.tagName==="TEXTAREA");
      // Ctrl+Enter = envoyer même depuis textarea
      if (e.ctrlKey && e.key==="Enter") { e.preventDefault(); if(tab==="chat" && chatInput.trim()) sendChat(); return; }
      if (inInput && e.key!=="Escape") return;
      // Ctrl+1..9 = toggle IA
      if (e.ctrlKey && e.key>="1" && e.key<="9") {
        const idx = parseInt(e.key)-1; const id = IDS[idx];
        if (id) { e.preventDefault(); setEnabled(prev=>({...prev,[id]:!prev[id]})); showToast(`${MODEL_DEFS[id].icon} ${MODEL_DEFS[id].short} ${enabled[id]?"désactivé":"activé"}`); }
      }
      // Ctrl+K = focus recherche historique
      if (e.ctrlKey && e.key==="k") { e.preventDefault(); navigateTab("chat"); setTimeout(()=>document.getElementById("hist-search-inp")?.focus(),150); }
      // Ctrl+L = clear conversations
      if (e.ctrlKey && e.key==="l") { e.preventDefault(); setConversations(Object.fromEntries(IDS.map(id=>[id,[]]))); showToast("💬 Conversations effacées"); }
      // Ctrl+M = export markdown
      if (e.ctrlKey && e.key==="m") { e.preventDefault(); exportMarkdown(null); }
      // Escape = quitter focus / solo
      if (e.key==="Escape") { setFocusId(null); setSoloId(null); setShowRagPanel(false); setCanvasContent(null); }
      // Ctrl+T = reset session tokens
      if (e.ctrlKey && e.key==="t" && !inInput) { e.preventDefault(); setSessionTokens({}); showToast("🔢 Compteur tokens réinitialisé"); }
    };
    window.addEventListener("keydown", handler);
    return ()=>window.removeEventListener("keydown", handler);
  }, [tab, chatInput, enabled, soloId, focusId]);

  // ── Voix (TTS) ──
  const [ttsEnabled, setTtsEnabled] = useState(false);
  // ── Son de notification fin de réponse ──────────────────────────
  const playBeep = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.35);
      setTimeout(() => ctx.close(), 500);
    } catch {}
  };

  const speakText = (text) => {
    if (!ttsEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text.slice(0,500));
    utt.lang="fr-FR"; utt.rate=1.05;
    window.speechSynthesis.speak(utt);
  };

  // ── Dictée vocale ──
  const [isListening, setIsListening] = useState(false);
  const recognizerRef = useRef(null);
  const shouldListenRef = useRef(false);   // intention de l'utilisateur (survive aux redémarrages)

  const startRecognizer = () => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec || !shouldListenRef.current) return;
    const rec = new SpeechRec();
    rec.lang = "fr-FR";
    rec.continuous = false;      // false = plus stable cross-browser, on redémarre dans onend
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => {
      let transcript = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) transcript += e.results[i][0].transcript + " ";
      }
      if (transcript.trim()) setChatInput(prev => prev ? prev + " " + transcript.trim() : transcript.trim());
    };
    rec.onend = () => {
      // Redémarre automatiquement tant que l'utilisateur n'a pas cliqué stop
      if (shouldListenRef.current) {
        try { startRecognizer(); } catch {}
      } else {
        setIsListening(false);
      }
    };
    rec.onerror = (e) => {
      if (e.error === "not-allowed") {
        shouldListenRef.current = false;
        setIsListening(false);
        showToast("❌ Micro refusé — autorise le micro dans les paramètres du navigateur");
      } else if (e.error === "aborted") {
        // silence volontaire, on laisse onend gérer
      } else if (e.error === "no-speech") {
        // pas de parole, continue d'écouter
      } else if (e.error === "network") {
        shouldListenRef.current = false;
        setIsListening(false);
        showToast("⚠️ Micro : réseau requis (Chrome envoie l'audio à Google). Essaie Edge ou connecte-toi à Internet.");
      } else {
        shouldListenRef.current = false;
        setIsListening(false);
        showToast("Erreur micro : " + e.error);
      }
    };
    recognizerRef.current = rec;
    try { rec.start(); } catch {}
  };

  const startVoice = async () => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) { showToast("Dictée non supportée — utilise Chrome ou Edge"); return; }
    if (isListening) {
      // Arrêt volontaire
      shouldListenRef.current = false;
      recognizerRef.current?.stop();
      setIsListening(false);
      return;
    }
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      showToast("❌ Micro refusé — autorise le micro dans les paramètres du navigateur"); return;
    }
    shouldListenRef.current = true;
    setIsListening(true);
    startRecognizer();
  };

  // ── Statistiques d'usage ──

  // ── Injection prompt depuis Bibliothèque ──
  const injectPrompt = (text) => { setChatInput(text); navigateTab("chat"); showToast("✓ Prompt injecté dans le Chat"); };

  // ── Onglet médias sous-onglet ──
  const [mediaSubTab, setMediaSubTab] = useState("youtube");

  // ── Détection mobile & offline ──
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  // mobileCol unified into mobileCol
  
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    const handleOnline  = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('resize',  handleResize,  {passive:true});
    window.addEventListener('online',  handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('resize',  handleResize);
      window.removeEventListener('online',  handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleTouchStart = () => {};
  const handleTouchEnd = () => {};

  // ── File attachment ──
  const [attachedFile, setAttachedFile] = React.useState(null);
  const fileInputRef = useRef(null);

  const handleFileAttach = async (file) => {
    if (!file) return;
    const name = file.name; const type = file.type;
    if (type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => setAttachedFile({name, type:"image", base64:reader.result.split(",")[1], mimeType:type, icon:"🖼"});
      reader.readAsDataURL(file);
    } else if (name.endsWith(".txt")||name.endsWith(".md")||name.endsWith(".csv")||name.endsWith(".json")) {
      const text = await file.text();
      setAttachedFile({name, type:"text", content:text.slice(0,12000), icon:"📄"});
    } else if (name.endsWith(".pdf")) {
      // Extraction basique PDF côté client
      const reader = new FileReader();
      reader.onload = () => {
        const raw = reader.result;
        // Extraire les séquences de texte lisibles (méthode simple sans lib externe)
        let extracted = "";
        const matches = raw.match(/[ -~À-ÿ]{4,}/g) || [];
        extracted = matches.filter(s => /[a-zA-ZÀ-ÿ]{3,}/.test(s)).join(" ").slice(0,8000);
        setAttachedFile({name, type:"pdf", content:extracted||"[PDF chargé — extraction de texte limitée]", icon:"📕"});
      };
      reader.readAsBinaryString(file);
    } else {
      showToast("⚠️ Format non supporté. Utilise PDF, TXT, MD, CSV, JSON ou image.");
    }
  };

  // ── Notifications PWA ──
  const requestNotifPerm = async () => {
    if ("Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }
  };
  const sendNotif = (title, body) => {
    if ("Notification" in window && Notification.permission === "granted" && document.hidden) {
      new Notification(title, { body, icon:"/icon-192.png", badge:"/icon-192.png" });
    }
  };

  // ── Zoom / Échelle UI ──
  const [zenMode, setZenMode] = React.useState(false);
  const [canvasContent, setCanvasContent] = React.useState(null); // {code, lang, title}
  // Expose to window so CodeBlock (non-child) can trigger canvas
  React.useEffect(() => { window.__openCanvas = (code, lang, title) => setCanvasContent({code, lang, title}); return () => { delete window.__openCanvas; }; }, []);
  const [sessionTokens, setSessionTokens] = React.useState({}); // {id: {in:N, out:N}}
  const estimateCost = (id, inTok, outTok) => {
    const p = TOKEN_PRICE[id];
    if (!p) return 0;
    return (inTok / 1e6 * p.in) + (outTok / 1e6 * p.out);
  };
  const addTokens = (id, inTok, outTok) => {
    setSessionTokens(prev => {
      const cur = prev[id] || {in:0, out:0};
      return {...prev, [id]: {in: cur.in + inTok, out: cur.out + outTok}};
    });
  };

  const [uiZoom, setUiZoom] = React.useState(() => {
    try { return parseFloat(localStorage.getItem("multiia_zoom") || "1"); } catch { return 1; }
  });
  const saveZoom = (v) => { setUiZoom(v); try { localStorage.setItem("multiia_zoom", v); } catch {} };

  // ── PWA Install prompt ──
  const [pwaPrompt, setPwaPrompt] = useState(null);
  const [showPwaBanner, setShowPwaBanner] = useState(false);
  const [pwaInstalled, setPwaInstalled] = useState(false);
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault(); setPwaPrompt(e);
      if (!localStorage.getItem("multiia_pwa_dismissed")) setShowPwaBanner(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    if (window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone) setPwaInstalled(true);
    window.addEventListener("appinstalled", () => { setPwaInstalled(true); setShowPwaBanner(false); });
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);
  const installPwa = async () => {
    if (!pwaPrompt) return;
    pwaPrompt.prompt();
    const { outcome } = await pwaPrompt.userChoice;
    if (outcome === "accepted") { setPwaInstalled(true); setShowPwaBanner(false); }
    setPwaPrompt(null);
  };
  const dismissPwaBanner = () => { setShowPwaBanner(false); localStorage.setItem("multiia_pwa_dismissed","1"); };

  const MOBILE_TABS = [["chat","◈","Chat"],["recherche","🔎","Cherche"],["notes","📝","Notes"],["agent","🤖","Agent"],["config","⚙","Config"]];

  const [debInput, setDebInput] = useState("");
  const [debPhase, setDebPhase] = useState(0);
  const [debProgress, setDebProgress] = useState(0);
  const [debProgressLabel, setDebProgressLabel] = useState("");
  const [debRound1, setDebRound1] = useState({});
  const [debRound2, setDebRound2] = useState({});
  const [debSynthesis, setDebSynthesis] = useState("");
  const [debSynthBy, setDebSynthBy] = useState("Claude");
  const [debQuestion, setDebQuestion] = useState("");
  const [openPhases, setOpenPhases] = useState({ r1:true, r2:true, syn:true });
  // ── Fichier dans le Débat ────────────────────────────────────
  const [debFile, setDebFile] = useState(null);   // {name, type, content, base64, mimeType, icon}
  const [debMode, setDebMode] = useState("debate"); // "debate" | "analyse"
  const debFileRef = useRef(null);
  const handleDebFile = async (file) => {
    if (!file) return;
    const name = file.name; const ftype = file.type;
    if (ftype.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => setDebFile({name, type:"image", base64:reader.result.split(",")[1], mimeType:ftype, icon:"🖼"});
      reader.readAsDataURL(file);
    } else if (name.endsWith(".txt")||name.endsWith(".md")||name.endsWith(".csv")||name.endsWith(".json")) {
      const text = await file.text();
      setDebFile({name, type:"text", content:text.slice(0,12000), icon:"📄"});
    } else if (name.endsWith(".pdf")) {
      const reader = new FileReader();
      reader.onload = () => {
        const raw = reader.result;
        const matches = raw.match(/[ -~À-ÿ]{4,}/g) || [];
        const extracted = matches.filter(s=>/[a-zA-ZÀ-ÿ]{3,}/.test(s)).join(" ").slice(0,8000);
        setDebFile({name, type:"pdf", content:extracted||"[PDF chargé — extraction basique]", icon:"📕"});
      };
      reader.readAsBinaryString(file);
    } else if (name.endsWith(".docx")||name.endsWith(".doc")) {
      const text = await file.text().catch(()=>"[Fichier binaire — contenu non extractible]");
      setDebFile({name, type:"text", content:text.slice(0,10000), icon:"📝"});
    } else if (name.endsWith(".js")||name.endsWith(".py")||name.endsWith(".ts")||name.endsWith(".html")||name.endsWith(".css")||name.endsWith(".jsx")||name.endsWith(".tsx")||name.endsWith(".sql")||name.endsWith(".xml")) {
      const text = await file.text();
      setDebFile({name, type:"code", content:text.slice(0,12000), icon:"💻"});
    } else {
      showToast("Format supporté : PDF, TXT, MD, CSV, JSON, code source, images");
    }
  };

  useEffect(() => { IDS.forEach(id => { const el = msgRefs.current[id]; if(el) el.scrollTop = el.scrollHeight; }); }, [conversations, loading]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2800); };

  const toggleModel = (id) => {
    const m = MODEL_DEFS[id];
    if (!enabled[id] && m.keyName && !apiKeys[m.keyName]) { setModal(id); setKeyDraft(""); return; }
    setEnabled(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const saveKeyModal = () => {
    const m = MODEL_DEFS[modal];
    setApiKeys(prev => ({ ...prev, [m.keyName]: keyDraft.trim() }));
    setEnabled(prev => ({ ...prev, [modal]: true }));
    setModal(null);
    showToast(`✓ Clé ${m.short} enregistrée`);
  };

  const saveCfgKey = (keyName) => {
    const val = (cfgDrafts[keyName] || "").trim();
    if (!val) return;
    setApiKeys(prev => ({ ...prev, [keyName]: val }));
    setCfgDrafts(prev => ({ ...prev, [keyName]: "" }));
    showToast("✓ Clé enregistrée");
  };

  const exportJson = JSON.stringify({ _info:`MultiIA v${APP_VERSION} - clés API`, ...apiKeys }, null, 2);

  const exportKeys = () => {
    try {
      const a = document.createElement("a");
      a.href = "data:application/json;charset=utf-8," + encodeURIComponent(exportJson);
      a.download = "multiia-keys.json";
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      showToast("✓ Fichier exporté");
    } catch { setShowExportModal(true); }
  };

  const importKeys = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const p = JSON.parse(ev.target.result);
        const merged = { ...apiKeys };
        let count = 0;
        Object.keys(apiKeys).forEach(k => { if(p[k]) { merged[k] = p[k]; count++; } });
        setApiKeys(merged); showToast(`✓ ${count} clé(s) importée(s)`);
      } catch { showToast("✗ Fichier invalide"); }
    };
    reader.readAsText(file); e.target.value = "";
  };

  // ── Fonctions d'historique ──
  const persistHistory = (list) => {
    setSavedConvs(list);
    try { localStorage.setItem("multiia_history", JSON.stringify(list)); } catch {}
  };

  const getConvTitle = (convs) => {
    // Cherche le premier message utilisateur dans n'importe quelle IA
    for (const id of IDS) {
      const first = (convs[id] || []).find(m => m.role === "user");
      if (first) return first.content.slice(0, 60) + (first.content.length > 60 ? "…" : "");
    }
    return "Conversation sans titre";
  };

  const saveConv = (customTitle) => {
    const hasContent = IDS.some(id => conversations[id].some(m => m.role === "user"));
    if (!hasContent) { showToast("Aucun message à sauvegarder"); return; }
    const title = customTitle || getConvTitle(conversations);
    const activeIds = IDS.filter(id => conversations[id].some(m => m.role === "user" || m.role === "assistant"));
    const entry = {
      id: Date.now().toString(),
      title,
      date: new Date().toLocaleString("fr-FR", { day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit" }),
      ias: activeIds,
      conversations: { ...conversations },
    };
    // Si conversation active déjà dans l'historique → màj
    if (activeHistId) {
      const updated = savedConvs.map(c => c.id === activeHistId ? { ...entry, id: activeHistId } : c);
      persistHistory(updated);
      showToast("✓ Conversation mise à jour");
    } else {
      const newList = [entry, ...savedConvs].slice(0, 50); // max 50 convs
      persistHistory(newList);
      setActiveHistId(entry.id);
      showToast("✓ Conversation sauvegardée");
    }
  };

  const loadConv = (entry) => {
    if (IDS.some(id => conversations[id].some(m => m.role === "user")) && !window.confirm("Charger cette conversation ? La conversation actuelle non sauvegardée sera perdue.")) return;
    setConversations(entry.conversations);
    setActiveHistId(entry.id);
    // Activer les IAs qui ont du contenu
    entry.ias.forEach(id => { if (!enabled[id]) setEnabled(prev => ({ ...prev, [id]: true })); });
    showToast(`✓ "${entry.title.slice(0,30)}" chargée`);
  };

  const deleteConv = (e, entryId) => {
    e.stopPropagation();
    const newList = savedConvs.filter(c => c.id !== entryId);
    persistHistory(newList);
    if (activeHistId === entryId) setActiveHistId(null);
    showToast("Conversation supprimée");
  };

  const newConv = () => {
    if (IDS.some(id => conversations[id].some(m => m.role === "user")) && !window.confirm("Nouvelle conversation ? La conversation actuelle non sauvegardée sera perdue.")) return;
    setConversations(Object.fromEntries(IDS.map(id => [id, []])));
    setActiveHistId(null);
    setChatInput("");
  };

  // Auto-save après chaque réponse complète
  const autoSave = (newConvs) => {
    const hasContent = IDS.some(id => (newConvs[id]||[]).some(m => m.role === "user"));
    if (!hasContent) return;
    const title = getConvTitle(newConvs);
    const activeIds = IDS.filter(id => (newConvs[id]||[]).some(m => m.role === "user" || m.role === "assistant"));
    const entry = {
      id: activeHistId || Date.now().toString(),
      title,
      date: new Date().toLocaleString("fr-FR", { day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit" }),
      ias: activeIds,
      conversations: { ...newConvs },
    };
    setSavedConvs(prev => {
      const exists = prev.find(c => c.id === entry.id);
      const newList = exists ? prev.map(c => c.id === entry.id ? entry : c) : [entry, ...prev].slice(0, 50);
      try { localStorage.setItem("multiia_history", JSON.stringify(newList)); } catch {}
      return newList;
    });
    if (!activeHistId) setActiveHistId(entry.id);
  };

  const handleGrammarCheck = async () => {
    const text = chatInput.trim(); if (!text || grammarLoading) return;
    if (grammarResult?.corrected && text === grammarResult.original) { setShowGrammarPopup(true); return; }
    setGrammarLoading(true);
    try {
      const corrected = await correctGrammar(text, apiKeys);
      if (corrected.trim() === text) showToast("✓ Aucune faute détectée !");
      else { setGrammarResult({ original: text, corrected: corrected.trim() }); setShowGrammarPopup(true); }
    } catch(e) { showToast("✗ Erreur: " + e.message); }
    finally { setGrammarLoading(false); }
  };

  const enabledIds = IDS.filter(id => enabled[id]);
  const availableIds = enabledIds.filter(id => !isLimited(id));
  const isLoadingAny = Object.values(loading).some(Boolean);

  const sendChat = async () => {
    const text = applyPromptVars(chatInput.trim()); if (!text) return;
    setShowGrammarPopup(false); setGrammarResult(null); setChatInput(""); setBestVote(null);
    const file = attachedFile; setAttachedFile(null);
    requestNotifPerm();
    // ── RAG : enrichir le message avec contexte document ──────────
    const ragCtx = ragChunks.length > 0 ? getRagContext(text) : null;
    const effectiveText = ragCtx || text;
    // ── Respect du mode solo : n'envoyer qu'à l'IA sélectionnée ──
    const targetIds = soloId ? [soloId] : IDS.filter(id => enabled[id]);
    // Sur mobile, n'envoyer qu'à l'IA visible
    const finalTargets = isMobile && !soloId ? [mobileCol] : targetIds;
    const ids = finalTargets.filter(id => !isLimited(id));
    const blockedIds = finalTargets.filter(id => isLimited(id));
    const userMsg = { role:"user", content:effectiveText, displayContent: ragCtx ? text : null, file: file ? {name:file.name, icon:file.icon} : null };
    const allActive = [...ids, ...blockedIds];
    setConversations(prev => { const n={...prev}; allActive.forEach(id => { n[id] = [...prev[id], userMsg]; }); return n; });
    if (blockedIds.length) {
      setConversations(prev => { const n={...prev}; blockedIds.forEach(id => { n[id] = [...prev[id], { role:"blocked", id_blocked:id, content:`⏳ ${MODEL_DEFS[id].short} temporairement limité (rate limit). Réessai dans ${fmtCd(id)||"..."}s — ou clique sur Débloquer` }]; }); return n; });
    }
    if (!ids.length) return;
    setLoading(prev => { const n={...prev}; ids.forEach(id => { n[id]=true; }); return n; });
    // Create AbortControllers per IA
    ids.forEach(id => { abortRefs.current[id] = new AbortController(); });
    await Promise.all(ids.map(async (id) => {
      try {
        const hist = [...conversations[id], userMsg];
        let reply;
        if (ollamaActive && ollamaConnected && ollamaModel && id === "__ollama__") {
          reply = await callOllama(ollamaModel, hist, buildSystem());
        } else {
          reply = await callModel(id, hist, apiKeys, buildSystem(), file);
        }
        const thinkContent = extractThink(reply);
        const cleanReply = stripThink(reply);
        if (ttsEnabled && ids.length===1) speakText(cleanReply);
        // Auto-scroll to bottom
        setTimeout(()=>{ const el = msgsEndRefs.current[id]; if(el) el.scrollIntoView({behavior:"smooth"}); }, 50);
        // Token estimation (heuristic: 1 token ≈ 4 chars)
        const inEst = Math.round(hist.reduce((a,m)=>(a+(m.content||"").length),0)/4);
        const outEst = Math.round((cleanReply||"").length/4);
        addTokens(id, inEst, outEst);
        setConversations(prev => {
          const updated = { ...prev, [id]: [...prev[id], { role:"assistant", content:cleanReply, think:thinkContent||undefined }] };
          return updated;
        });
      } catch(e) {
        const errType = classifyError(e.message);
        if (errType==="ratelimit") markLimited(id, errType);
        setConversations(prev => ({ ...prev, [id]: [...prev[id], { role:"error", content:`❌ ${e.message}` }] }));
      } finally { setLoading(prev => ({ ...prev, [id]:false })); }
    }));
    // ── Son + notification fin de réponse ──────────────────────────
    const successCount = IDS.filter(id=>enabled[id]).length;
    playBeep();
    sendNotif("✅ Réponses reçues", `${successCount} IA${successCount>1?"s":""} ont répondu`);
    // Auto-save après toutes les réponses
    setConversations(prev => {
      autoSave(prev);
      // Vote automatique si 2+ IAs actives
      const activeCount = IDS.filter(id => enabled[id]).length;
      if (activeCount >= 2) setTimeout(()=>runAutoVote(prev), 500);
      return prev;
    });
  };

  const launchDebate = async () => {
    const question = debInput.trim();
    const hasFile = !!debFile;
    const isAnalyse = debMode === "analyse";
    if (!question && !hasFile) { showToast("Saisis une question ou attache un fichier"); return; }
    const ids = IDS.filter(id => enabled[id] && !isLimited(id));
    if (ids.length < 2) { showToast("Active au moins 2 IAs disponibles"); return; }

    // Build file context string for text injection
    const buildFileCtx = () => {
      if (!debFile) return "";
      if (debFile.type === "image") return ""; // handled via callModel file param
      return `\n\n📎 **Fichier joint : ${debFile.name}**\n\`\`\`\n${debFile.content}\n\`\`\``;
    };
    const fileCtx = buildFileCtx();
    const fileParam = (debFile?.type === "image") ? debFile : null; // image passed as file param
    const displayQ = question || `Analyse du fichier : ${debFile?.name}`;

    setDebQuestion(displayQ);
    setDebRound1({}); setDebRound2({}); setDebSynthesis(""); setDebSynthBy("Claude");
    setDebPhase(1); setOpenPhases({ r1:true, r2:true, syn:true });
    const total = ids.length + ids.length + 1; let done = 0;
    const tick = (lbl) => { done++; setDebProgress(Math.round(done/total*100)); setDebProgressLabel(lbl); };

    // Build Tour 1 prompt — inject file content
    const buildT1Prompt = (id) => {
      const m = MODEL_DEFS[id];
      if (isAnalyse) {
        // Mode Analyse : consignes précises d'analyse fichier
        const analyseInstructions = [
          "Identifie les points clés, la structure et le sujet principal",
          "Évalue la qualité, la cohérence et les lacunes",
          "Propose des améliorations ou des actions concrètes",
          "Donne ton avis d'expert avec exemples et arguments",
        ];
        const myTask = analyseInstructions[ids.indexOf(id) % analyseInstructions.length];
        return `${question ? `Contexte : "${question}"\n\n` : ""}Analyse ce fichier. Ta mission spécifique : **${myTask}**.${fileCtx}`;
      } else {
        // Mode Débat : chaque IA défend une perspective
        return `${question}${fileCtx}`;
      }
    };

    const sysT1 = isAnalyse
      ? "Tu es un expert analyste. Analyse le document fourni selon ta mission. Sois précis, factuel et actionnable."
      : "Tu es un expert. Réponds à la question de manière complète et précise. Si un fichier est joint, base-toi dessus.";

    const r1 = {};
    await Promise.all(ids.map(async (id) => {
      try {
        const prompt = buildT1Prompt(id);
        r1[id] = await callModel(id, [{ role:"user", content:prompt }], apiKeys, sysT1, fileParam);
      }
      catch(e) { const t=classifyError(e.message); if(t==="ratelimit") markLimited(id,t); r1[id]=`❌ ${e.message}`; }
      tick(`Tour 1 — ${MODEL_DEFS[id].short}`);
      setDebRound1(prev => ({ ...prev, [id]:r1[id] }));
    }));

    setDebPhase(2);
    const r2 = {};
    await Promise.all(ids.map(async (id) => {
      const others = ids.filter(o=>o!==id).map(o=>`**${MODEL_DEFS[o].short}** :\n${r1[o]||"(pas de réponse)"}`).join("\n\n---\n\n");
      const fileReminder = hasFile && !fileParam ? `\n\n(Rappel fichier : ${debFile.name})\n${debFile.content?.slice(0,2000)||""}` : "";
      const prompt = isAnalyse
        ? `Voici les analyses des autres IAs sur "${debFile?.name||"ce document"}" :\n\n${others}${fileReminder}\n\n---\nComplète et enrichis l'analyse avec ce que les autres ont manqué. Fusionne les points importants.`
        : `Question : "${question}"${fileCtx.slice(0,500)}\n\nRéponses des autres IAs :\n\n${others}\n\n---\nEn tenant compte de ces perspectives, affine ta réponse finale.`;
      try { r2[id] = await callModel(id, [{ role:"user", content:prompt }], apiKeys, "Tu analyses les réponses de tes pairs et affines ta propre analyse."); }
      catch(e) { const t=classifyError(e.message); if(t==="ratelimit") markLimited(id,t); r2[id]=`❌ ${e.message}`; }
      tick(`Tour 2 — ${MODEL_DEFS[id].short}`);
      setDebRound2(prev => ({ ...prev, [id]:r2[id] }));
    }));

    setDebPhase(3);
    const allAnswers = ids.map(id=>`**${MODEL_DEFS[id].short}** :\n${r2[id]||r1[id]||"(pas de réponse)"}`).join("\n\n---\n\n");
    const synPrompt = isAnalyse
      ? `Synthèse finale de l'analyse du fichier "${debFile?.name||"document"}"${question?` (contexte : "${question}")`:""}.\n\nToutes les analyses :\n\n${allAnswers}\n\n---\nProduis :\n1. **SYNTHÈSE COMPLÈTE** — combine toutes les analyses\n2. **POINTS CLÉS** — les insights les plus importants\n3. **ACTIONS RECOMMANDÉES** — que faire concrètement\n4. **POINTS DE DÉSACCORD** entre les IAs`
      : `Question : "${question}"${fileCtx.slice(0,300)}\n\nRéponses finales :\n\n${allAnswers}\n\n---\nProduis :\n1. La MEILLEURE RÉPONSE SYNTHÉTISÉE\n2. POINTS DE CONSENSUS\n3. DIVERGENCES notables`;

    const synthPriority = ["groq","mistral","cohere","cerebras","sambanova","mixtral"];
    let synDone = false;
    for (const sid of synthPriority) {
      if (!enabled[sid] || isLimited(sid)) continue;
      try {
        const syn = await callModel(sid, [{ role:"user", content:synPrompt }], apiKeys, "Tu produis des synthèses claires, structurées et actionnables.");
        setDebSynthesis(syn); setDebSynthBy(MODEL_DEFS[sid].name); synDone = true; break;
      } catch(e) { const t=classifyError(e.message); if(t==="ratelimit"||t==="credit") markLimited(sid,t); }
    }
    if (!synDone) {
      const valid = ids.filter(id => r2[id] && !r2[id].startsWith("❌"));
      if (valid.length > 0) { setDebSynthesis(`⚠️ Synthèse auto — ${MODEL_DEFS[valid[0]].short}:\n\n${r2[valid[0]]}`); setDebSynthBy(MODEL_DEFS[valid[0]].name + " (fallback)"); }
      else setDebSynthesis("❌ Aucune IA disponible pour produire une synthèse.");
    }
    tick("Synthèse générée"); setDebPhase(4);
  };

  const clearDebate = () => { setDebPhase(0); setDebInput(""); setDebRound1({}); setDebRound2({}); setDebSynthesis(""); setDebQuestion(""); setDebProgress(0); setDebFile(null); };

  const sortedArena = [...ARENA_MODELS].sort((a,b) => {
    if (arenaSort === "score") return b.score - a.score;
    if (arenaSort === "free") return (b.free?1:0) - (a.free?1:0);
    return a.name.localeCompare(b.name);
  }).filter(m => {
    if (arenaFilter === "all") return true;
    if (arenaFilter === "free") return m.free;
    if (arenaFilter === "top") return m.score >= 9;
    if (arenaFilter === "oss") return m.tag === "OSS" || m.tag === "OSS KING" || m.tag === "FREE";
    return true;
  });

  const filteredImages = IMAGE_GENERATORS.filter(g => {
    if (imgFilter === "all") return true;
    if (imgFilter === "free") return g.free;
    if (imgFilter === "oss") return g.license && (g.license.includes("Apache")||g.license.includes("GPL")||g.license.includes("OSS")||g.license.includes("Community"));
    if (imgFilter === "paid") return !g.free;
    return true;
  });

  return (
    <>
      <style>{S}</style>
      <div className={`app ${zenMode?"zen-mode":""}`} style={{zoom: uiZoom, transformOrigin:"top left"}}>

        {/* ── OFFLINE BAR ── */}
        {!isOnline && (
          <div className="offline-bar show">
            📡 Hors-ligne — Les IAs sont indisponibles. L'app fonctionne mais les messages ne peuvent pas être envoyés.
          </div>
        )}

        {/* ── MOBILE HEADER (remplace la nav top sur mobile) ── */}
        <div className="mobile-header" style={isMobile?{display:"flex"}:{display:"none"}}>
          <span className="mobile-header-title">
            multi<span style={{color:"var(--mu)",fontWeight:400}}>IA</span>
          </span>
          {tab === "chat" && (
            <button className="mh-btn" title="Historique" onClick={()=>setShowHist(h=>!h)}>📋</button>
          )}
          <button className={`mh-btn ${ttsEnabled?"on":""}`} title="Lecture vocale" onClick={()=>setTtsEnabled(v=>!v)}>🔊</button>
          <button className={`mh-btn ${memFacts.length>0?"on":""}`} style={memFacts.length>0?{borderColor:"var(--ac)",color:"var(--ac)"}:{}} title="Mémoire locale" onClick={()=>setShowMemPanel(m=>!m)}>💾</button>
          <button className="mh-btn" title={darkMode?"Mode clair":"Mode sombre"} onClick={()=>setDarkMode(d=>!d)}>
            {darkMode?"☀":"🌙"}
          </button>
          {pwaPrompt && !pwaInstalled && (
            <button className="mh-btn" style={{borderColor:"var(--ac)",color:"var(--ac)"}} onClick={installPwa} title="Installer l'app">📲</button>
          )}
        </div>

        {/* ── HIST OVERLAY (mobile — ferme en cliquant à côté) ── */}
        {showHist && tab==="chat" && isMobile && (
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",zIndex:299,display:"block"}} onClick={()=>setShowHist(false)}/>
        )}

        {/* ── SÉLECTEUR IA MOBILE (dans le chat) ── */}
        {tab==="chat" && (
          <div className="mobile-ia-selector" style={isMobile?{display:"flex"}:{display:"none"}}>
            {IDS.filter(id=>enabled[id]).map(id => {
              const m = MODEL_DEFS[id];
              const lim = isLimited(id);
              const isActive = mobileCol===id;
              return (
                <button key={id}
                  className={`mobile-ia-chip ${isActive?"active":""}`}
                  style={{
                    borderColor: lim?"#F87171": isActive ? m.color : "var(--bd)",
                    color: lim?"#F87171": isActive ? "#fff" : "var(--mu)",
                    background: isActive ? m.color+"33" : "var(--s2)",
                  }}
                  onClick={()=>setMobileCol(id)}>
                  <span style={{fontSize:16}}>{m.icon}</span>
                  <span>{m.short}</span>
                  {lim && <span style={{fontSize:9,color:"#F87171",marginLeft:2}}>⏳</span>}
                </button>
              );
            })}
          </div>
        )}

        {/* NAV */}
        <div className="nav" style={isMobile?{display:"none"}:{}}>
          <button onClick={()=>setShowMemPanel(m=>!m)} title="Mémoire locale" style={{background:memFacts.length>0?"rgba(212,168,83,.15)":"var(--s1)",border:"1px solid "+(memFacts.length>0?"rgba(212,168,83,.4)":"var(--bd)"),borderRadius:5,color:memFacts.length>0?"var(--ac)":"var(--mu)",fontSize:10,padding:"4px 8px",cursor:"pointer",fontFamily:"var(--font-ui)",whiteSpace:"nowrap",flexShrink:0,position:"relative"}}>
            💾 Mémoire{memFacts.length>0?` (${memFacts.length})`:""}
          </button>
          <button className="zen-mode-btn" style={{position:"relative",bottom:"auto",right:"auto",width:28,height:28,fontSize:11,borderRadius:5,flexShrink:0}} title={zenMode?"Quitter le mode Zen":"Mode Zen (focus)"} onClick={()=>setZenMode(z=>!z)}>{zenMode?"⊡":"⊞"}</button>
          <div className="logo" style={{display:"flex",alignItems:"center",gap:6}}>multi<em>IA</em>
  <em style={{fontSize:11,color:"var(--ac)",background:"rgba(212,168,83,.15)",padding:"1px 6px",borderRadius:4,border:"1px solid rgba(212,168,83,.3)",cursor:"pointer"}}
    title="Cliquer pour forcer le rechargement"
    onClick={()=>{ if(window.caches) window.caches.keys().then(ks=>ks.forEach(k=>window.caches.delete(k))); window.location.reload(true); }}>
    v{APP_VERSION}
  </em>
</div>
          <div className="nav-tabs">
            {[
              ["chat","◈ Chat"],
              ["prompts","📋 Prompts"],
              ["redaction","✍️ Rédaction"],
              ["recherche","🔎 Recherche"],
              ["workflows","🔀 Workflows"],
              ["medias","🎬 Médias"],
              ["arena","⚔ Arène"],
              ["debate","⚡ Débat"],
              ["notes","📝 Notes"],
              ["traducteur","🌍 Trad."],
              ["agent","🤖 Agent"],
              ["webia","🌐 IAs Web"],
              ["compare","⚖ Comparer"],
              ["stats","📊 Stats"],
              ["config","⚙ Config"],
            ].map(([t,l]) => (
              <button key={t} className={`nt ${tab===t?"on":""}`} onClick={()=>navigateTab(t)}>{l}</button>
            ))}
          </div>
          <div className="pills">
            {IDS.map(id => {
              const m = MODEL_DEFS[id];
              const needsKey = m.keyName && !apiKeys[m.keyName];
              const lim = isLimited(id);
              return (
                <button key={id} className="pill"
                  style={{ borderColor:lim?"var(--red)":enabled[id]?m.color:"var(--bd)", color:lim?"var(--red)":enabled[id]?m.color:"var(--mu)", background:enabled[id]?m.bg:"transparent" }}
                  onClick={() => toggleModel(id)} title={lim?`Bloqué ${fmtCd(id)}`:needsKey?"Clé requise":""}>
                  <span>{m.icon}</span><span>{m.short}</span>
                  {m.free && !lim && <span className="pfree">FREE</span>}
                  {lim && <span style={{fontSize:7,color:"var(--red)"}}>{fmtCd(id)}</span>}
                </button>
              );
            })}
            <button className="btn-xs" onClick={newConv} title="Nouvelle conversation">↺</button>
            <button className="theme-btn" onClick={()=>setDarkMode(d=>!d)} title={darkMode?"Thème clair":"Thème sombre"}>{darkMode?"☀":"🌙"}</button>
            <button className={`voice-btn ${ttsEnabled?"speaking":""}`} onClick={()=>setTtsEnabled(v=>!v)} title="Lecture vocale des réponses">🔊</button>
          </div>
        </div>

        {/* PERSONA BAR */}
        {tab==="chat" && (
          <div className="persona-bar" style={{overflowX:"auto",flexWrap:"nowrap"}}>
            <span className="persona-lbl">Mode :</span>
            <div className="persona-chips">
              {allPersonas.map(p => (
                <button key={p.id} className={`persona-chip ${activePersona===p.id?"on":""}`}
                  style={activePersona===p.id?{borderColor:p.color,color:p.color,background:p.color+"15"}:{}}
                  onClick={()=>setActivePersona(p.id)}>
                  {p.icon} {p.name}
                </button>
              ))}
              <button className="persona-add" onClick={()=>setShowPersonaModal(true)}>＋ Perso</button>
            </div>
          </div>
        )}

        {/* TOKEN BAR */}


        {/* MOBILE COL TABS */}
        {tab === "chat" && (
          <div className="mobile-col-tabs">
            {enabledIds.map(id => {
              const m = MODEL_DEFS[id]; const lim = isLimited(id);
              return (
                <button key={id} className={`mct-btn ${mobileCol===id?"active":""}`}
                  style={mobileCol===id?{}:{borderColor:lim?"var(--red)":m.color,color:lim?"var(--red)":m.color}}
                  onClick={() => setMobileCol(id)}>
                  {m.icon} {m.short}{lim?` ⏳${fmtCd(id)}`:""}
                </button>
              );
            })}
          </div>
        )}

        {/* ── CHAT TAB ── */}
        {tab === "chat" && <>
          {enabled.groq && <div style={{padding:"3px 14px",background:"rgba(249,115,22,.07)",borderBottom:"1px solid rgba(249,115,22,.2)",fontSize:9,color:"var(--orange)",flexShrink:0}}>⚡ <strong>Groq</strong> = <strong>Llama 3.3 70B</strong> (Meta) propulsé par l'infrastructure Groq — Gratuit jusqu'à 14 400 req/jour · Disponible aussi en Débat</div>}

          {/* Layout historique + chat */}
          <div style={{flex:1,display:"flex",overflow:"hidden"}}>

            {/* Bouton toggle sidebar */}
            <button className="hist-toggle" onClick={() => setShowHist(h => !h)} style={isMobile?{display:"none"}:{}}
              title={showHist ? "Masquer l'historique" : "Afficher l'historique"}>
              {showHist ? (isMobile?"✕":"◀") : (isMobile?"📋":"▶")}
            </button>

            {/* Sidebar historique */}
            <div className={`hist-sidebar ${showHist ? "" : "closed"}`}
              style={isMobile ? {
                position:"fixed", top:0, left:0, bottom:0, zIndex:300,
                width:"82vw", maxWidth:300,
                transform: showHist ? "translateX(0)" : "translateX(-105%)",
                transition:"transform .28s cubic-bezier(.4,0,.2,1)",
                boxShadow:"4px 0 30px rgba(0,0,0,.7)",
              } : {}}>
              <div className="hist-hdr">
                <span className="hist-hdr-title">📂 Historique</span>
                <button className="hist-save-btn" onClick={() => saveConv(null)} title="Sauvegarder maintenant">💾</button>
                <button className="hist-save-btn" style={{background:"rgba(96,165,250,.08)",border:"1px solid rgba(96,165,250,.3)",color:"var(--blue)"}} title="Partager la conversation" onClick={() => {
                  const msgs = Object.values(conversations).flat().slice(-8);
                  if (!msgs.length) { showToast("Aucun message à partager"); return; }
                  const txt = msgs.map(m=>(m.role==="user"?"Tu: ":"IA: ")+m.content.slice(0,300)).join("\n\n");
                  navigator.clipboard.writeText(txt);
                  showToast("📋 Conversation copiée !");
                }}>🔗</button>
                <button className="hist-new-btn" onClick={newConv} title="Nouvelle conversation">＋</button>
              </div>
              {/* 🔍 Recherche plein-texte */}
              <div style={{padding:"6px 8px",borderBottom:"1px solid var(--bd)",flexShrink:0}}>
                <input id="hist-search-inp" type="text" value={histSearch} onChange={e=>setHistSearch(e.target.value)}
                  placeholder="🔍 Rechercher… (Ctrl+K)"
                  style={{width:"100%",background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:4,padding:"4px 8px",color:"var(--tx)",fontSize:9,fontFamily:"'IBM Plex Mono',monospace",outline:"none"}}
                />
              </div>
              {/* 📁 Dossiers */}
              <div className="hist-folder-tabs">
                {histFolders.map(f => (
                  <button key={f} className={`hist-folder-tab ${activeFolder===f?"active":""}`}
                    onClick={()=>setActiveFolder(f)} title={f}>{f}</button>
                ))}
                {showFolderInput
                  ? <input autoFocus value={folderInput} onChange={e=>setFolderInput(e.target.value)}
                      onKeyDown={e=>{if(e.key==="Enter")addFolder();if(e.key==="Escape")setShowFolderInput(false);}}
                      onBlur={()=>setShowFolderInput(false)}
                      placeholder="Nom…"
                      style={{width:60,background:"var(--s2)",border:"1px solid var(--ac)",borderRadius:3,padding:"1px 5px",color:"var(--tx)",fontSize:8,fontFamily:"'IBM Plex Mono',monospace",outline:"none"}}/>
                  : <button className="hist-folder-add" onClick={()=>setShowFolderInput(true)} title="Nouveau dossier">＋</button>
                }
              </div>
              <div className="hist-list">
                {filteredConvs.length === 0 ? (
                  <div className="hist-empty">
                    {histSearch ? `Aucun résultat pour "${histSearch}"` : <>Aucune conversation.<br/>Envoie un message,<br/>ça se sauvegarde<br/>automatiquement. 💬</>}
                  </div>
                ) : filteredConvs.map(entry => (
                  <div key={entry.id}
                    className={`hist-item ${activeHistId === entry.id ? "active" : ""}`}
                    onClick={() => loadConv(entry)}>
                    <div className="hist-item-title" style={{display:"flex",alignItems:"flex-start",gap:4}}>
                      <button onClick={e=>{e.stopPropagation();const upd=savedConvs.map(cc=>cc.id===entry.id?{...cc,favorite:!cc.favorite}:cc);setSavedConvs(upd);try{localStorage.setItem("multiia_history",JSON.stringify(upd));}catch{}}}
                        style={{background:"none",border:"none",cursor:"pointer",fontSize:9,padding:0,flexShrink:0,opacity:entry.favorite?1:.3,color:"var(--ac)"}}>⭐</button>
                      <span>{histSearch ? entry.title.replace(new RegExp(`(${histSearch})`, "gi"), "**$1**") : entry.title}</span>
                    </div>
                    <div className="hist-item-meta">
                      <span className="hist-item-date">🕐 {entry.date}</span>
                      {entry.folder && <span style={{fontSize:7,background:"rgba(212,168,83,.12)",color:"var(--ac)",borderRadius:2,padding:"0 3px"}}>{entry.folder}</span>}
                      <div className="hist-item-ias">
                        {(entry.ias||[]).slice(0,4).map(id => (
                          <span key={id} className="hist-item-ia"
                            style={{background:MODEL_DEFS[id]?.color+"18",color:MODEL_DEFS[id]?.color}}>
                            {MODEL_DEFS[id]?.icon}
                          </span>
                        ))}
                      </div>
                    </div>
                    <select
                      title="Déplacer vers un dossier"
                      value={entry.folder||""}
                      onClick={e=>e.stopPropagation()}
                      onChange={e=>{e.stopPropagation();moveConvToFolder(entry.id, e.target.value);}}
                      style={{position:"absolute",top:7,right:24,fontSize:7,background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:3,color:"var(--mu)",padding:"1px 2px",cursor:"pointer",opacity:0,transition:"opacity .15s",width:14}}
                      className="hist-item-folder-sel">
                      <option value="">📁 Sans dossier</option>
                      {histFolders.filter(f=>f!=="Tout"&&f!=="⭐ Favoris").map(f=><option key={f} value={f}>{f}</option>)}
                    </select>
                    <button className="hist-item-del" onClick={e => deleteConv(e, entry.id)} title="Supprimer">✕</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Zone de chat principale */}
            <div className="chat-area">
          {Object.values(loading).some(Boolean) && (
            <div style={{position:"absolute",top:0,left:0,right:0,height:2,zIndex:100,overflow:"hidden",pointerEvents:"none"}}>
              <div style={{height:"100%",background:"linear-gradient(90deg,var(--ac),var(--blue),var(--green),var(--ac))",backgroundSize:"200% 100%",animation:"stream-bar-anim 2s linear infinite",width:"100%"}}/>
            </div>
          )}
          <div className="cols tab-content-mobile"
              onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}
              style={isMobile?{flexDirection:"column"}:{}}>
            {/* 🏆 Bandeau jury amélioré */}
            {voteLoading && (
              <div style={{position:"absolute",top:4,left:"50%",transform:"translateX(-50%)",zIndex:99,background:"rgba(212,168,83,.1)",border:"1px solid rgba(212,168,83,.35)",borderRadius:8,padding:"5px 16px",fontSize:10,color:"var(--mu)",fontFamily:"'IBM Plex Mono',monospace",whiteSpace:"nowrap",pointerEvents:"none",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",gap:6}}>
                <span style={{animation:"spin 1s linear infinite",display:"inline-block"}}>⚖️</span> Jury IA en train de noter…
              </div>
            )}
            {bestVote && !voteLoading && (() => {
              const ranking = bestVote.ranking || [bestVote.winner];
              const medals = ["🥇","🥈","🥉"];
              const winM = MODEL_DEFS[bestVote.winner];
              return (
                <div style={{position:"absolute",top:4,left:"50%",transform:"translateX(-50%)",zIndex:99,width:"min(96vw,1100px)",backdropFilter:"blur(10px)"}}>
                  {/* Header cliquable */}
                  <div onClick={()=>setShowVoteDetail(v=>!v)} style={{cursor:"pointer",background:`linear-gradient(135deg,rgba(212,168,83,.18),rgba(212,168,83,.08))`,border:"1px solid rgba(212,168,83,.5)",borderRadius:showVoteDetail?"8px 8px 0 0":"8px",padding:"6px 12px",display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:14}}>🏆</span>
                    <div style={{flex:1,minWidth:0}}>
                      <span style={{fontSize:10,fontWeight:700,color:winM?.color||"var(--ac)",fontFamily:"'Syne',sans-serif"}}>{winM?.icon} {winM?.short}</span>
                      <span style={{fontSize:9,color:"var(--mu)",marginLeft:8,fontFamily:"'IBM Plex Mono',monospace"}}>— {bestVote.reason?.slice(0,70)}{(bestVote.reason?.length||0)>70?"…":""}</span>
                    </div>
                    <div style={{display:"flex",gap:4,alignItems:"center",flexShrink:0}}>
                      {ranking.slice(0,3).map((id,i)=>( <span key={id} style={{fontSize:9,opacity:.85}}>{medals[i]}{MODEL_DEFS[id]?.icon}</span> ))}
                      <span style={{fontSize:9,color:"var(--mu)",marginLeft:4}}>{showVoteDetail?"▲":"▼"}</span>
                    </div>
                  </div>
                  {/* Détail expand */}
                  {showVoteDetail && (
                    <div style={{background:"rgba(18,18,28,.96)",border:"1px solid rgba(212,168,83,.35)",borderTop:"none",borderRadius:"0 0 8px 8px",padding:"10px 12px",display:"flex",flexDirection:"column",gap:8}}>
                      {/* Podium scores */}
                      <div style={{display:"grid",gridTemplateColumns:`repeat(${ranking.length},minmax(115px,1fr))`,gap:5,overflowX:"auto",paddingBottom:2}}>
                        {ranking.map((id,rank) => {
                          const m = MODEL_DEFS[id]; const sc = bestVote.scores?.[id]; const tot = sc?.total||0;
                          const pts = bestVote.points?.[id]||[];
                          return (
                            <div key={id} style={{background:`${m.color}12`,border:`1px solid ${m.color}40`,borderRadius:6,padding:"5px 7px",position:"relative",minWidth:0}}>
                              <div style={{position:"absolute",top:4,right:6,fontSize:12}}>{medals[rank]||""}</div>
                              <div style={{fontSize:10,fontWeight:700,color:m.color,marginBottom:4,fontFamily:"'Syne',sans-serif"}}>{m.icon} {m.short}</div>
                              {/* Mini score bars */}
                              {[["précision",sc?.precision],["clarté",sc?.clarte],["complétude",sc?.completude],["utilité",sc?.utilite]].map(([lbl,val])=>(
                                <div key={lbl} style={{marginBottom:3}}>
                                  <div style={{display:"flex",justifyContent:"space-between",fontSize:6.5,color:"var(--mu)",marginBottom:1}}><span>{lbl}</span><span style={{color:m.color,fontWeight:700}}>{val||0}</span></div>
                                  <div style={{height:3,background:"var(--s1)",borderRadius:2,overflow:"hidden"}}>
                                    <div style={{height:"100%",width:`${(val||0)*10}%`,background:m.color,borderRadius:2,transition:"width .4s"}}/>
                                  </div>
                                </div>
                              ))}
                              <div style={{marginTop:5,fontSize:8,fontWeight:700,color:m.color}}>TOTAL : {typeof tot==="number"?tot.toFixed(1):tot}/10</div>
                              {pts.length>0 && <div style={{marginTop:4,borderTop:`1px solid ${m.color}25`,paddingTop:4}}>{pts.slice(0,2).map((p,i)=><div key={i} style={{fontSize:7,color:"var(--mu)",marginBottom:1}}>• {p}</div>)}</div>}
                            </div>
                          );
                        })}
                      </div>
                      {/* Raison complète + actions */}
                      <div style={{fontSize:9,color:"var(--mu)",fontFamily:"'IBM Plex Mono',monospace",background:"var(--s1)",padding:"6px 8px",borderRadius:4,borderLeft:"3px solid rgba(212,168,83,.5)"}}>
                        {bestVote.reason}
                      </div>
                      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                        {ranking.length>=2 && (
                          <button onClick={()=>{setDiffPair([ranking[0],ranking[1]]);setShowDiffModal(true);}} style={{fontSize:8,padding:"4px 10px",background:"rgba(96,165,250,.1)",border:"1px solid rgba(96,165,250,.3)",borderRadius:4,color:"var(--blue)",cursor:"pointer"}}>
                            🔍 Voir diff {MODEL_DEFS[ranking[0]]?.icon} vs {MODEL_DEFS[ranking[1]]?.icon}
                          </button>
                        )}
                        <button onClick={()=>setShowRecap(v=>!v)} style={{fontSize:8,padding:"4px 10px",background:"rgba(74,222,128,.08)",border:"1px solid rgba(74,222,128,.25)",borderRadius:4,color:"var(--green)",cursor:"pointer"}}>
                          📋 {showRecap?"Masquer":"Voir"} tableau récap
                        </button>
                        <button onClick={()=>navigateTab("compare")} style={{fontSize:8,padding:"4px 10px",background:"rgba(212,168,83,.1)",border:"1px solid rgba(212,168,83,.3)",borderRadius:4,color:"var(--ac)",cursor:"pointer"}}>
                          📊 Historique comparaisons
                        </button>
                      </div>
                      {/* Tableau récap collapsible */}
                      {showRecap && (
                        <div style={{background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:6,overflow:"hidden"}}>
                          <div style={{overflowX:"auto"}}>
                          <table style={{width:"100%",borderCollapse:"collapse",fontSize:9,minWidth:580}}>
                            <thead>
                              <tr style={{background:"var(--s2)"}}>
                                <th style={{padding:"4px 8px",textAlign:"left",color:"var(--mu)",fontWeight:600}}>IA</th>
                                <th style={{padding:"4px 8px",color:"var(--mu)",fontWeight:600}}>Précision</th>
                                <th style={{padding:"4px 8px",color:"var(--mu)",fontWeight:600}}>Clarté</th>
                                <th style={{padding:"4px 8px",color:"var(--mu)",fontWeight:600}}>Complétude</th>
                                <th style={{padding:"4px 8px",color:"var(--mu)",fontWeight:600}}>Utilité</th>
                                <th style={{padding:"4px 8px",color:"var(--mu)",fontWeight:600}}>Total</th>
                                <th style={{padding:"4px 8px",color:"var(--mu)",fontWeight:600}}>Points clés</th>
                              </tr>
                            </thead>
                            <tbody>
                              {ranking.map((id,i) => {
                                const m=MODEL_DEFS[id]; const sc=bestVote.scores?.[id]||{}; const pts=bestVote.points?.[id]||[];
                                return (
                                  <tr key={id} style={{borderTop:"1px solid var(--bd)",background:i===0?`${m.color}08`:"transparent"}}>
                                    <td style={{padding:"4px 8px",color:m.color,fontWeight:700}}>{medals[i]||""} {m.icon} {m.short}</td>
                                    <td style={{padding:"4px 8px",textAlign:"center",color:"var(--tx)"}}>{sc.precision||"-"}</td>
                                    <td style={{padding:"4px 8px",textAlign:"center",color:"var(--tx)"}}>{sc.clarte||"-"}</td>
                                    <td style={{padding:"4px 8px",textAlign:"center",color:"var(--tx)"}}>{sc.completude||"-"}</td>
                                    <td style={{padding:"4px 8px",textAlign:"center",color:"var(--tx)"}}>{sc.utilite||"-"}</td>
                                    <td style={{padding:"4px 8px",textAlign:"center",fontWeight:700,color:m.color}}>{typeof sc.total==="number"?sc.total.toFixed(1):"-"}</td>
                                    <td style={{padding:"4px 8px",color:"var(--mu)"}}>{pts.slice(0,2).join(" · ")}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}
            {IDS.map(id => {
              const m = MODEL_DEFS[id];
              const lim = isLimited(id);
              const isMobileHidden = enabledIds.length > 0 && mobileCol !== id;
              const isSoloDim = soloId && soloId !== id;
              const isSoloFocus = soloId === id;
              const isFocus = focusId === id;
              const isWinner = bestVote?.winner === id;
              return (
                <div key={id}
                  className={`col ${!enabled[id]?"off":""} ${isSoloDim?"solo-dim":""} ${isSoloFocus?"solo-focus":""}`}
                  style={{
                    background:enabled[id]?`${m.bg}22`:"transparent",
                    display: focusId ? (focusId===id?"flex":"none") : isMobile && mobileCol !== id ? "none" : undefined,
                    flex: focusId===id ? "1" : isMobile && mobileCol === id ? "1" : undefined,
                    width: isMobile ? "100%" : undefined,
                    outline: isWinner ? `2px solid ${m.color}` : loading[id] ? `1px solid ${m.color}60` : undefined,
                    boxShadow: isWinner ? `0 0 20px ${m.color}40` : loading[id] ? `inset 0 0 30px ${m.color}08, 0 0 12px ${m.color}20` : undefined,
                    transition: "box-shadow .4s ease, outline .4s ease",
                  }}>
                  <div className="ch" style={{ borderBottomColor:lim?"var(--red)":loading[id]?m.color:m.border, transition:"border-color .3s" }}>
                    <span className="ci" style={{ color:lim?"var(--red)":m.color, animation: loading[id]?"pulse-glow 1.2s ease-in-out infinite":undefined }}>{m.icon}</span>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div className="cn" style={{ color:lim?"var(--red)":m.color }}>
                        {m.name}
                        {isWinner && <span style={{marginLeft:5,fontSize:9,color:"var(--ac)"}}>🏆</span>}
                      </div>
                      <div className="csub">{m.provider}{m.free&&<span style={{color:"var(--green)",marginLeft:4}}>· FREE</span>}</div>
                      {sessionTokens[id] && (() => {
                        const t = sessionTokens[id];
                        const cost = estimateCost(id, t.in, t.out);
                        const totalTok = t.in + t.out;
                        return (
                          <div style={{fontSize:7,color:"var(--mu)",marginTop:1,fontFamily:"'IBM Plex Mono',monospace"}}>
                            ~{totalTok > 1000 ? (totalTok/1000).toFixed(1)+"k" : totalTok} tokens
                            {cost > 0.0001 && <span style={{color:"var(--green)",marginLeft:4}}>${cost.toFixed(4)}</span>}
                            {cost <= 0.0001 && TOKEN_PRICE[id]?.free && <span style={{color:"var(--green)",marginLeft:4}}>gratuit</span>}
                          </div>
                        );
                      })()}
                    </div>
                    <div className="cm">
                      {loading[id] && (
                        <button onClick={()=>cancelModelCall(id)} title="Annuler la réponse"
                          style={{background:"rgba(248,113,113,.12)",border:"1px solid rgba(248,113,113,.35)",borderRadius:4,color:"var(--red)",fontSize:9,padding:"2px 6px",cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace",marginRight:3,flexShrink:0}}>⏹</button>
                      )}
                      {lim && <span className="countdown">⏳ {fmtCd(id)}</span>}
                      <div className={`dot ${loading[id]?"live":lim?"limited":""}`}/>
                    </div>
                    {/* Boutons Solo + Focus + Export */}
                    <div className="ch-actions">
                      <button className={`ch-btn ${isFocus?"solo-on":""}`}
                        title={isFocus?"Quitter le mode plein écran":"Mode plein écran — cette IA uniquement"}
                        onClick={() => setFocusId(isFocus ? null : id)}>
                        {isFocus ? "⊡" : "⛶"}
                      </button>
                      <button className={`ch-btn ${isSoloFocus?"solo-on":""}`}
                        title={isSoloFocus?"Quitter le mode solo":"Mode solo — envoyer uniquement à cette IA"}
                        onClick={() => setSoloId(isSoloFocus ? null : id)}>
                        {isSoloFocus ? "⊙" : "◎"}
                      </button>
                      <button className="ch-btn" title="Export Markdown" onClick={() => exportMarkdown(id)}>📝</button>
                      <button className="ch-btn" title="Export PDF / Impression" onClick={() => exportPDF(id)}>🖨</button>
                      <button className="ch-btn"
                        title="Exporter la conversation (fichier .txt collable dans une autre IA)"
                        onClick={() => exportConv(id)}>
                        ⬇
                      </button>
                    </div>
                  </div>
                  <div className="msgs" style={{position:"relative"}} ref={el => msgRefs.current[id] = el}>
                    {conversations[id].length === 0 && !loading[id] && <div className="empty">{enabled[id]?lim?`⏳ Bloqué — ${fmtCd(id)}`:"En attente…":"Désactivé"}</div>}
                    {conversations[id].map((msg, i) => (
                      <div key={i} className={`msg ${msg.role==="user"?"u":msg.role==="error"?"e":msg.role==="blocked"?"blocked":"a"}`} style={msg.role==="assistant"?{borderColor:m.border,position:"relative",animation:"fadeInUp .3s ease-out"}:{animation:"fadeInUp .25s ease-out"}}>
                        {msg.think && <CoTBlock think={msg.think}/>}
                        <MarkdownRenderer text={msg.displayContent || msg.content} />
                        {msg.displayContent && <span style={{fontSize:8,color:"var(--mu)",marginLeft:6,verticalAlign:"middle"}}>📄 RAG</span>}
                        {msg.role==="blocked" && (
                          <button onClick={()=>setLimited(prev=>{const n={...prev};delete n[id];return n;})}
                            style={{marginLeft:8,background:"rgba(251,146,60,.2)",border:"1px solid rgba(251,146,60,.5)",borderRadius:4,color:"var(--orange)",fontSize:9,padding:"2px 8px",cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace"}}>
                            🔓 Débloquer
                          </button>
                        )}
                        {msg.role==="assistant" && (
                          <div style={{display:"flex",gap:4,marginTop:5,justifyContent:"flex-end",flexWrap:"wrap"}}>
                            <button className="voice-btn" title="Lire à voix haute" onClick={()=>speakText(msg.content)}>🔊</button>
                            <button className="voice-btn" title="Copier" onClick={()=>{try{navigator.clipboard.writeText(msg.content);}catch{}}}>⎘</button>
                            <button className="voice-btn" title="Réutiliser dans le chat" onClick={()=>{
                              const prev=conversations[id].slice(0,i).reverse().find(x=>x.role==="user");
                              if(prev){setChatInput(prev.content);navigateTab("chat");}
                            }} style={{fontSize:8}}>↩ Renvoyer</button>
                          </div>
                        )}
                      </div>
                    ))}
                    {loading[id] && <div className="msg ld"><span className="dots"><span>·</span><span>·</span><span>·</span></span></div>}
                    <div ref={el => { if(el) msgsEndRefs.current[id] = el; }} style={{height:1}}/>
                  </div>
                  {/* Scroll-to-bottom btn */}
                  {conversations[id]?.length > 4 && !loading[id] && (
                    <button className="scroll-to-bottom" onClick={()=>msgsEndRefs.current[id]?.scrollIntoView({behavior:"smooth"})} title="Défiler vers le bas">↓</button>
                  )}
                </div>
              );
            })}
          </div>
          {/* File attachment preview */}
        {attachedFile && (
          <div className="attach-preview" style={{flexDirection:"column",alignItems:"flex-start",gap:6,padding:"8px 12px"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,width:"100%"}}>
              {attachedFile.type==="image" && attachedFile.base64 && (
                <img src={`data:${attachedFile.mimeType};base64,${attachedFile.base64}`}
                  alt={attachedFile.name}
                  style={{width:64,height:64,objectFit:"cover",borderRadius:5,border:"1px solid var(--bd)",flexShrink:0}}/>
              )}
              {attachedFile.type!=="image" && (
                <div style={{width:48,height:48,background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:5,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <span style={{fontSize:18}}>{attachedFile.icon||"📄"}</span>
                  <span style={{fontSize:6,color:"var(--mu)",marginTop:2}}>{(attachedFile.name||"").split(".").pop().toUpperCase()}</span>
                </div>
              )}
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:10,fontWeight:700,color:"var(--tx)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{attachedFile.name}</div>
                <div style={{fontSize:8,color:"var(--mu)",marginTop:2}}>
                  {attachedFile.type==="image" ? "🖼️ Image" : "📄 Document"} · {attachedFile.type!=="image" ? Math.round((attachedFile.content||"").length/1000)+"k car" : attachedFile.mimeType}
                </div>
                <div style={{fontSize:8,color:"var(--green)",marginTop:2}}>✓ Prêt à envoyer aux IAs</div>
              </div>
              <button onClick={()=>setAttachedFile(null)} style={{marginLeft:"auto",background:"rgba(248,113,113,.1)",border:"1px solid rgba(248,113,113,.3)",borderRadius:4,color:"var(--red)",fontSize:10,padding:"3px 7px",cursor:"pointer",flexShrink:0}}>✕ Retirer</button>
            </div>
          </div>
        )}
        {/* ── RAG Panel ── */}
        {showRagPanel && (
          <div style={{padding:"8px 14px",background:"rgba(96,165,250,.06)",borderBottom:"1px solid rgba(96,165,250,.25)",flexShrink:0}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
              <span style={{fontSize:10,color:"var(--blue)",fontWeight:700}}>📄 RAG — Document contextuel</span>
              {ragChunks.length>0&&<span style={{fontSize:9,color:"var(--green)"}}>✓ {ragChunks.length} morceaux · {Math.round(ragText.length/1000)}k car</span>}
              <button onClick={()=>{setRagText("");setRagChunks([]);showToast("Document RAG effacé");}} style={{marginLeft:"auto",background:"rgba(248,113,113,.1)",border:"1px solid rgba(248,113,113,.3)",borderRadius:4,color:"var(--red)",fontSize:9,padding:"2px 8px",cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace"}}>✕ Effacer</button>
              <button onClick={()=>setShowRagPanel(false)} style={{background:"transparent",border:"1px solid var(--bd)",borderRadius:4,color:"var(--mu)",fontSize:9,padding:"2px 8px",cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace"}}>Masquer</button>
            </div>
            <textarea
              placeholder="Colle ici un texte long (article, PDF, code, rapport…) et pose tes questions dessous. Les passages pertinents seront envoyés automatiquement aux IAs."
              value={ragText}
              onChange={e=>processRagText(e.target.value)}
              style={{width:"100%",minHeight:70,maxHeight:120,background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:5,color:"var(--tx)",fontSize:9,fontFamily:"'IBM Plex Mono',monospace",padding:"6px 10px",resize:"vertical",outline:"none"}}
            />
          </div>
        )}
        {/* ── Session cost strip ── */}
        {Object.keys(sessionTokens).length > 0 && (() => {
          const totalTok = Object.values(sessionTokens).reduce((a,t)=>a+t.in+t.out, 0);
          const totalCost = Object.entries(sessionTokens).reduce((a,[id,t])=>a+estimateCost(id,t.in,t.out), 0);
          return (
            <div style={{display:"flex",alignItems:"center",gap:8,padding:"3px 10px",background:"rgba(212,168,83,.04)",borderTop:"1px solid rgba(212,168,83,.1)",fontSize:8,color:"var(--mu)",fontFamily:"'IBM Plex Mono',monospace",flexShrink:0,flexWrap:"wrap"}}>
              <span>🔢 Session : ~{totalTok>1000?(totalTok/1000).toFixed(1)+"k":totalTok} tokens</span>
              {totalCost > 0.0001 && <span style={{color:"var(--green)"}}>💰 ${totalCost.toFixed(4)}</span>}
              {totalCost <= 0.0001 && <span style={{color:"var(--green)"}}>✓ Gratuit</span>}
              <button onClick={()=>setSessionTokens({})} style={{marginLeft:"auto",background:"none",border:"none",color:"var(--mu)",fontSize:7,cursor:"pointer",padding:"1px 4px",borderRadius:3}}>↺ Reset</button>
            </div>
          );
        })()}
        <div className="foot">
            {/* Prompt variables hint */}
            {chatInput.includes("{{") && (
              <div className="pvar-hint">
                <span style={{color:"var(--ac)",fontWeight:700,marginRight:4}}>📋 Vars :</span>
                {[["{{date}}","📅"],["{{heure}}","🕐"],["{{jour}}","📆"],["{{mois}}","🗓"],["{{annee}}","🔢"]].map(([v,ic])=>(
                  <button key={v} className="pvar-chip" onClick={()=>setChatInput(p=>p.replace(v,applyPromptVars(v)))} title={"Remplacer "+v}>{ic} {v}</button>
                ))}
              </div>
            )}
            {/* Barre d'outils supérieure */}
            <div style={{display:"flex",gap:4,padding:"3px 8px",borderBottom:"1px solid var(--bd)",flexWrap:"wrap",alignItems:"center"}}>
              <button onClick={()=>setShowRagPanel(r=>!r)} title="RAG — coller un document long"
                style={{background:showRagPanel?"rgba(96,165,250,.2)":"transparent",border:"1px solid "+(showRagPanel?"rgba(96,165,250,.6)":"var(--bd)"),borderRadius:4,color:showRagPanel?"var(--blue)":"var(--mu)",fontSize:9,padding:"2px 7px",cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace"}}>
                📄 RAG{ragChunks.length>0&&<span style={{color:"var(--green)",marginLeft:3}}>●</span>}
              </button>
              <button onClick={()=>setShowOllamaPanel(r=>!r)} title="Ollama local"
                style={{background:ollamaConnected?"rgba(74,222,128,.12)":"transparent",border:"1px solid "+(ollamaConnected?"rgba(74,222,128,.4)":"var(--bd)"),borderRadius:4,color:ollamaConnected?"var(--green)":"var(--mu)",fontSize:9,padding:"2px 7px",cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace"}}>
                🖥 Ollama{ollamaConnected&&<span style={{fontSize:7,marginLeft:3}}>●</span>}
              </button>
              <button onClick={()=>navigateTab("workflow")} title="Éditeur de workflow visuel"
                style={{background:"transparent",border:"1px solid var(--bd)",borderRadius:4,color:"var(--mu)",fontSize:9,padding:"2px 7px",cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace"}}>
                🔀 Workflow
              </button>
              <button onClick={()=>exportMarkdown(null)} title="Exporter toutes les conversations en Markdown (Ctrl+M)"
                style={{background:"transparent",border:"1px solid var(--bd)",borderRadius:4,color:"var(--mu)",fontSize:9,padding:"2px 7px",cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace"}}>
                📝 .md
              </button>
              <button onClick={()=>exportPDF(null)} title="Exporter en PDF / Imprimer"
                style={{background:"transparent",border:"1px solid var(--bd)",borderRadius:4,color:"var(--mu)",fontSize:9,padding:"2px 7px",cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace"}}>
                🖨 PDF
              </button>
              {focusId && <span style={{fontSize:9,color:"var(--ac)",marginLeft:"auto"}}>⛶ Plein écran : {MODEL_DEFS[focusId]?.short} — <button onClick={()=>setFocusId(null)} style={{background:"none",border:"none",color:"var(--ac)",cursor:"pointer",fontSize:9,fontFamily:"'IBM Plex Mono',monospace"}}>Esc pour quitter</button></span>}
            </div>
            {/* Ollama mini-panel */}
            {showOllamaPanel && (
              <div style={{padding:"8px 14px",background:"rgba(74,222,128,.06)",borderBottom:"1px solid rgba(74,222,128,.2)",flexShrink:0}}>
                <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                  <span style={{fontSize:10,color:"var(--green)",fontWeight:700}}>🖥 Ollama local</span>
                  <input value={ollamaUrl} onChange={e=>setOllamaUrl(e.target.value)}
                    style={{background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:4,color:"var(--tx)",fontSize:9,padding:"3px 8px",fontFamily:"'IBM Plex Mono',monospace",flex:1,minWidth:160,outline:"none"}} placeholder="http://localhost:11434"/>
                  <button onClick={()=>checkOllama(ollamaUrl)}
                    style={{background:"rgba(74,222,128,.15)",border:"1px solid rgba(74,222,128,.4)",borderRadius:4,color:"var(--green)",fontSize:9,padding:"3px 8px",cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace"}}>
                    {ollamaConnected?"↺ Refresh":"🔌 Connecter"}
                  </button>
                  {ollamaConnected && ollamaModels.length>0 && (
                    <select value={ollamaModel} onChange={e=>setOllamaModel(e.target.value)}
                      style={{background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:4,color:"var(--tx)",fontSize:9,padding:"3px 6px",fontFamily:"'IBM Plex Mono',monospace",outline:"none"}}>
                      {ollamaModels.map(m=><option key={m} value={m}>{m}</option>)}
                    </select>
                  )}
                  {ollamaConnected && (
                    <label style={{display:"flex",alignItems:"center",gap:4,fontSize:9,color:"var(--green)",cursor:"pointer"}}>
                      <input type="checkbox" checked={ollamaActive} onChange={e=>setOllamaActive(e.target.checked)} style={{accentColor:"var(--green)"}}/>
                      Activer pour le chat
                    </label>
                  )}
                  {!ollamaConnected && <span style={{fontSize:9,color:"var(--mu)"}}>Installe Ollama + lance <code style={{color:"var(--ac)"}}>ollama serve</code></span>}
                </div>
              </div>
            )}
            <div className="ir">
              <div className="ta-wrap">
                <textarea rows={1} value={chatInput} style={isMobile?{fontSize:"16px"}:{}}
                  placeholder={availableIds.length?`Envoyer à : ${availableIds.map(id=>MODEL_DEFS[id].short).join(", ")}… (Ctrl+Enter)`:"Toutes les IAs sont bloquées…"}
                  onChange={e => { setChatInput(e.target.value); setShowGrammarPopup(false); setGrammarResult(null); }}
                  onKeyDown={e => { if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendChat();} }}
                  onInput={e => { e.target.style.height="auto"; e.target.style.height=Math.min(e.target.scrollHeight,100)+"px"; }}
                />
                {showGrammarPopup && grammarResult && (
                  <div className="grammar-popup">
                    <div className="gp-title">✦ CORRECTION</div>
                    <div className="gp-orig">{grammarResult.original}</div>
                    <div className="gp-corr">{grammarResult.corrected}</div>
                    <div className="gp-btns">
                      <button className="gp-btn" onClick={() => setShowGrammarPopup(false)}>Ignorer</button>
                      <button className="gp-btn apply" onClick={() => { setChatInput(grammarResult.corrected); setShowGrammarPopup(false); }}>✓ Appliquer</button>
                    </div>
                  </div>
                )}
              </div>
              <div className="foot-btns">
                <button className={`gbtn ${grammarLoading?"loading":""}`} onClick={handleGrammarCheck} disabled={!chatInput.trim()||grammarLoading} title="Corriger">
                  {grammarLoading?"⟳":"✎"}
                </button>
                <button className={`mic-btn ${isListening?"on":""}`} onClick={startVoice} title={isListening?"Arrêter la dictée":"Dicter (voix)"}>🎙</button>
                <button className="sbtn" onClick={sendChat} disabled={isLoadingAny||!chatInput.trim()}>↑</button>
              </div>
            </div>
            <div className="fhint">Entrée = envoyer · Shift+Entrée = saut · Ctrl+1/2… = toggle IA · Ctrl+K = chercher · {availableIds.length}/{enabledIds.length} IA(s) dispo{enabledIds.length>availableIds.length&&<span style={{color:"var(--red)",marginLeft:6}}>· {enabledIds.length-availableIds.length} bloquée(s)</span>}</div>
          </div>
            </div>{/* fin chat-area */}
          </div>{/* fin layout hist+chat */}
        </>}

        {/* ── WORKFLOW TAB ── */}
        {(tab === "workflow" || tab === "workflows") && (
          <div className={`scroll-tab pad tab-animate${tabAnimDir==="left"?" tab-animate-left":tabAnimDir==="right"?" tab-animate-right":""}`}>
            {/* ── Header ── */}
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16,flexWrap:"wrap"}}>
              <div style={{fontFamily:"var(--font-display,'Syne',sans-serif)",fontWeight:800,fontSize:14,color:"var(--tx)"}}>🔀 Workflow Multi-Steps</div>
              <div style={{fontSize:9,color:"var(--mu)",flex:1}}>Chaîne d'IAs — sortie de chaque étape → entrée suivante · Variables : {"{INPUT}"} {"{PREVIOUS}"} {"{stepN}"}</div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                <button onClick={()=>addWorkflowNode("prompt")} style={{background:"rgba(212,168,83,.15)",border:"1px solid rgba(212,168,83,.4)",borderRadius:5,color:"var(--ac)",fontSize:9,padding:"5px 10px",cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace"}}>＋ Prompt</button>
                <button onClick={()=>addWorkflowNode("parallel")} style={{background:"rgba(96,165,250,.1)",border:"1px solid rgba(96,165,250,.3)",borderRadius:5,color:"var(--blue)",fontSize:9,padding:"5px 10px",cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace"}}>⚡ Parallèle</button>
                <button onClick={()=>addWorkflowNode("transform")} style={{background:"rgba(251,146,60,.1)",border:"1px solid rgba(251,146,60,.3)",borderRadius:5,color:"var(--orange)",fontSize:9,padding:"5px 10px",cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace"}}>⚙ Transform</button>
              </div>
            </div>

            {/* ── Quick templates ── */}
            <div style={{marginBottom:14,display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
              <span style={{fontSize:8,color:"var(--mu)",fontWeight:700,letterSpacing:".5px"}}>MODÈLES RAPIDES :</span>
              {[
                {name:"📝 Article blog", nodes:[
                  {id:"t1",label:"Plan en 5 parties",type:"prompt",ia:IDS.find(id=>enabled[id])||IDS[0],prompt:"Génère un plan en 5 parties pour un article sur : {INPUT}",name:"plan",usePrevOutput:false,parallel_ias:[]},
                  {id:"t2",label:"Rédaction complète",type:"prompt",ia:IDS.find(id=>enabled[id])||IDS[0],prompt:"Rédige l'article complet basé sur ce plan :\n{PREVIOUS}",name:"draft",usePrevOutput:true,parallel_ias:[]},
                  {id:"t3",label:"Révision & SEO",type:"prompt",ia:IDS.find(id=>enabled[id])||IDS[0],prompt:"Corrige et optimise SEO cet article :\n{PREVIOUS}",name:"final",usePrevOutput:true,parallel_ias:[]},
                ]},
                {name:"🔬 Analyse IA", nodes:[
                  {id:"t1",label:"Analyse parallèle",type:"parallel",ia:IDS.find(id=>enabled[id])||IDS[0],prompt:"Analyse ce sujet en profondeur : {INPUT}",name:"analyses",usePrevOutput:false,parallel_ias:IDS.filter(id=>enabled[id]).slice(0,3)},
                  {id:"t2",label:"Synthèse des analyses",type:"prompt",ia:IDS.find(id=>enabled[id])||IDS[0],prompt:"Synthétise ces analyses en points clés :\n{PREVIOUS}",name:"synthese",usePrevOutput:true,parallel_ias:[]},
                ]},
                {name:"💼 Pitch produit", nodes:[
                  {id:"t1",label:"Problème",type:"prompt",ia:IDS.find(id=>enabled[id])||IDS[0],prompt:"Décris le problème que résout : {INPUT}. Sois factuel et précis.",name:"problem",usePrevOutput:false,parallel_ias:[]},
                  {id:"t2",label:"Solution & USP",type:"prompt",ia:IDS.find(id=>enabled[id])||IDS[0],prompt:"Propose une solution et un USP basés sur :\n{problem}",name:"solution",usePrevOutput:false,parallel_ias:[]},
                  {id:"t3",label:"Pitch 30s",type:"prompt",ia:IDS.find(id=>enabled[id])||IDS[0],prompt:"Rédige un pitch de 30 secondes à partir de :\nProblème: {problem}\nSolution: {solution}",name:"pitch",usePrevOutput:false,parallel_ias:[]},
                ]},
              ].map((tpl,ti) => (
                <button key={ti} onClick={()=>{saveWorkflow(tpl.nodes.map(n=>({...n,id:Date.now().toString()+Math.random()})));setWorkflowResults([]);}}
                  style={{fontSize:8,padding:"3px 9px",background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:4,color:"var(--mu)",cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace",transition:"border-color .15s"}}
                  onMouseEnter={e=>e.currentTarget.style.borderColor="var(--ac)"}
                  onMouseLeave={e=>e.currentTarget.style.borderColor="var(--bd)"}
                >{tpl.name}</button>
              ))}
              {workflowSavedTpls.map((tpl,ti) => (
                <button key={"s"+ti} onClick={()=>{saveWorkflow(tpl.nodes.map(n=>({...n,id:Date.now().toString()+Math.random()})));setWorkflowResults([]);}}
                  style={{fontSize:8,padding:"3px 9px",background:"rgba(212,168,83,.08)",border:"1px solid rgba(212,168,83,.3)",borderRadius:4,color:"var(--ac)",cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace",position:"relative"}}>
                  ⭐ {tpl.name}
                  <span onClick={e=>{e.stopPropagation();saveWfTemplates(workflowSavedTpls.filter((_,i)=>i!==ti));}}
                    style={{marginLeft:4,opacity:.5,cursor:"pointer"}}>✕</span>
                </button>
              ))}
            </div>

            {/* ── Input + run bar ── */}
            <div style={{display:"flex",gap:8,marginBottom:16,alignItems:"center",flexWrap:"wrap"}}>
              <input value={workflowInput} onChange={e=>setWorkflowInput(e.target.value)}
                onKeyDown={e=>{if(e.key==="Enter"&&!workflowRunning&&workflowNodes.length)runWorkflow();}}
                placeholder="Entrée initiale — {INPUT} dans les prompts…"
                style={{flex:1,minWidth:200,background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:6,color:"var(--tx)",fontSize:10,padding:"8px 12px",fontFamily:"'IBM Plex Mono',monospace",outline:"none"}}/>
              {workflowRunning
                ? <button onClick={cancelWorkflow} style={{background:"rgba(248,113,113,.15)",border:"1px solid rgba(248,113,113,.4)",borderRadius:6,color:"var(--red)",fontSize:10,fontWeight:700,padding:"8px 14px",cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace",whiteSpace:"nowrap"}}>⏹ Annuler</button>
                : <button onClick={()=>runWorkflow()} disabled={!workflowNodes.length} style={{background:"rgba(212,168,83,.2)",border:"1px solid rgba(212,168,83,.5)",borderRadius:6,color:"var(--ac)",fontSize:11,fontWeight:700,padding:"8px 16px",cursor:workflowNodes.length?"pointer":"not-allowed",fontFamily:"var(--font-display,'Syne',sans-serif)",opacity:workflowNodes.length?1:.4,whiteSpace:"nowrap"}}>▶ Lancer</button>
              }
              {workflowNodes.length > 0 && !workflowRunning && (
                <button onClick={()=>{const name=prompt("Nom du template :");if(name?.trim())saveWfTemplates([...workflowSavedTpls,{name:name.trim(),nodes:workflowNodes}]);}}
                  style={{background:"rgba(212,168,83,.08)",border:"1px solid rgba(212,168,83,.3)",borderRadius:6,color:"var(--ac)",fontSize:9,padding:"6px 10px",cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace",whiteSpace:"nowrap"}}>⭐ Sauvegarder</button>
              )}
              {workflowResults.length > 0 && (
                <button onClick={()=>{
                  const md = workflowResults.map((r,i)=>`## Étape ${i+1}: ${r.label}\n\n${r.output}`).join("\n\n---\n\n");
                  navigator.clipboard.writeText(md).then(()=>showToast("📋 Résultats copiés en Markdown"));
                }} style={{background:"rgba(96,165,250,.1)",border:"1px solid rgba(96,165,250,.3)",borderRadius:6,color:"var(--blue)",fontSize:9,padding:"6px 10px",cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace",whiteSpace:"nowrap"}}>⎘ Exporter</button>
              )}
              <button onClick={()=>{if(window.confirm("Vider le workflow ?"))saveWorkflow([]);}} style={{background:"rgba(248,113,113,.08)",border:"1px solid rgba(248,113,113,.25)",borderRadius:6,color:"var(--red)",fontSize:9,padding:"6px 9px",cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace"}}>🗑</button>
            </div>

            {/* ── Timeline ── */}
            {workflowNodes.length > 0 && (
              <div style={{display:"flex",gap:0,alignItems:"center",marginBottom:16,overflowX:"auto",paddingBottom:4}}>
                {workflowNodes.map((node,idx) => {
                  const res = workflowResults.find(r=>r.nodeId===node.id);
                  const isRunning = workflowRunStep === node.id;
                  const color = node.type==="parallel"?"var(--blue)":node.type==="transform"?"var(--orange)":"var(--ac)";
                  return (
                    <React.Fragment key={node.id}>
                      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,flexShrink:0}}>
                        <div style={{width:28,height:28,borderRadius:"50%",background:res?.ok?"rgba(74,222,128,.2)":res&&!res.ok?"rgba(248,113,113,.2)":isRunning?`${color}22`:"var(--s2)",border:`2px solid ${res?.ok?"var(--green)":res&&!res.ok?"var(--red)":isRunning?color:"var(--bd)"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:res?.ok?"var(--green)":res&&!res.ok?"var(--red)":isRunning?color:"var(--mu)",animation:isRunning?"pulse-glow 1.2s ease-in-out infinite":undefined,transition:"all .3s"}}>
                          {res?.ok?"✓":res&&!res.ok?"✗":isRunning?"⟳":(idx+1)}
                        </div>
                        <div style={{fontSize:7,color:"var(--mu)",whiteSpace:"nowrap",maxWidth:60,overflow:"hidden",textOverflow:"ellipsis",textAlign:"center"}}>{node.label}</div>
                        {res?.duration && <div style={{fontSize:6,color:"var(--mu)"}}>{(res.duration/1000).toFixed(1)}s</div>}
                      </div>
                      {idx < workflowNodes.length-1 && <div style={{flex:1,height:2,minWidth:12,background:res?.ok?"var(--green)":"var(--bd)",margin:"0 2px",marginBottom:18,transition:"background .5s"}}/>}
                    </React.Fragment>
                  );
                })}
              </div>
            )}

            {/* ── Steps ── */}
            {workflowNodes.length === 0 && (
              <div style={{textAlign:"center",padding:"50px 20px",color:"var(--mu)",fontSize:11}}>
                <div style={{fontSize:40,marginBottom:12}}>🔀</div>
                <div style={{marginBottom:8,color:"var(--tx)",fontWeight:600}}>Aucune étape</div>
                <div style={{fontSize:10,opacity:.7,maxWidth:340,margin:"0 auto"}}>Ajoute des étapes Prompt, Parallèle ou Transform. Chaque sortie est transmise à l'étape suivante automatiquement.</div>
              </div>
            )}
            {workflowNodes.map((node, idx) => {
              const res = workflowResults.find(r=>r.nodeId===node.id);
              const isRunning = workflowRunStep === node.id;
              const typeColor = node.type==="parallel"?"var(--blue)":node.type==="transform"?"var(--orange)":"var(--ac)";
              const typeLabel = node.type==="parallel"?"⚡ Parallèle":node.type==="transform"?"⚙ Transform":"💬 Prompt";
              return (
                <div key={node.id} style={{background:"var(--s1)",border:`1px solid ${isRunning?typeColor:res?.ok?"rgba(74,222,128,.25)":res&&!res.ok?"rgba(248,113,113,.3)":"var(--bd)"}`,borderRadius:10,padding:12,marginBottom:8,display:"flex",flexDirection:"column",gap:8,transition:"border-color .3s",boxShadow:isRunning?`0 0 16px ${typeColor}20`:undefined}}>
                  {/* Step header */}
                  <div style={{display:"flex",alignItems:"center",gap:7,flexWrap:"wrap"}}>
                    <div style={{width:22,height:22,borderRadius:"50%",background:typeColor+"22",border:`1.5px solid ${typeColor}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:800,color:typeColor,flexShrink:0}}>{idx+1}</div>
                    <input value={node.label} onChange={e=>{const n=[...workflowNodes];n[idx]={...n[idx],label:e.target.value};saveWorkflow(n);}}
                      style={{flex:1,background:"transparent",border:"none",color:"var(--tx)",fontSize:11,fontFamily:"'IBM Plex Mono',monospace",outline:"none",fontWeight:600,minWidth:80}} placeholder="Nom de l'étape"/>
                    <span style={{fontSize:8,padding:"2px 6px",background:typeColor+"18",border:`1px solid ${typeColor}40`,borderRadius:3,color:typeColor,whiteSpace:"nowrap"}}>{typeLabel}</span>
                    {/* IA selector */}
                    {node.type !== "parallel" && (
                      <select value={node.ia} onChange={e=>{const n=[...workflowNodes];n[idx]={...n[idx],ia:e.target.value};saveWorkflow(n);}}
                        style={{background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:4,color:"var(--tx)",fontSize:8,padding:"2px 5px",fontFamily:"'IBM Plex Mono',monospace",outline:"none"}}>
                        {IDS.map(id=><option key={id} value={id}>{MODEL_DEFS[id].icon} {MODEL_DEFS[id].short}</option>)}
                      </select>
                    )}
                    {/* Variable name */}
                    <div style={{display:"flex",alignItems:"center",gap:3}}>
                      <span style={{fontSize:7,color:"var(--mu)"}}>{"{"}</span>
                      <input value={node.name||""} onChange={e=>{const n=[...workflowNodes];n[idx]={...n[idx],name:e.target.value.replace(/[^a-zA-Z0-9_]/g,"")};saveWorkflow(n);}}
                        style={{width:55,background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:3,color:"var(--ac)",fontSize:8,padding:"1px 4px",fontFamily:"'IBM Plex Mono',monospace",outline:"none"}}
                        placeholder="varName" title="Nom de variable pour référencer la sortie"/>
                      <span style={{fontSize:7,color:"var(--mu)"}}>{"}"}</span>
                    </div>
                    {/* Reorder */}
                    <button onClick={()=>{if(idx===0)return;const n=[...workflowNodes];[n[idx-1],n[idx]]=[n[idx],n[idx-1]];saveWorkflow(n);}} disabled={idx===0}
                      style={{background:"none",border:"1px solid var(--bd)",borderRadius:3,color:"var(--mu)",fontSize:9,width:20,height:20,cursor:idx===0?"default":"pointer",display:"flex",alignItems:"center",justifyContent:"center",opacity:idx===0?.3:1}}>↑</button>
                    <button onClick={()=>{if(idx===workflowNodes.length-1)return;const n=[...workflowNodes];[n[idx],n[idx+1]]=[n[idx+1],n[idx]];saveWorkflow(n);}} disabled={idx===workflowNodes.length-1}
                      style={{background:"none",border:"1px solid var(--bd)",borderRadius:3,color:"var(--mu)",fontSize:9,width:20,height:20,cursor:idx===workflowNodes.length-1?"default":"pointer",display:"flex",alignItems:"center",justifyContent:"center",opacity:idx===workflowNodes.length-1?.3:1}}>↓</button>
                    <button onClick={()=>saveWorkflow(workflowNodes.filter((_,i)=>i!==idx))}
                      style={{background:"rgba(248,113,113,.1)",border:"1px solid rgba(248,113,113,.3)",borderRadius:4,color:"var(--red)",fontSize:9,padding:"2px 6px",cursor:"pointer"}}>✕</button>
                  </div>

                  {/* Parallel IAs selector */}
                  {node.type === "parallel" && (
                    <div>
                      <div style={{fontSize:8,color:"var(--mu)",marginBottom:5}}>IAs à lancer en parallèle :</div>
                      <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                        {IDS.filter(id=>enabled[id]).map(id => (
                          <label key={id} style={{display:"flex",alignItems:"center",gap:3,fontSize:9,color:MODEL_DEFS[id].color,cursor:"pointer",padding:"2px 6px",background:(node.parallel_ias||[]).includes(id)?`${MODEL_DEFS[id].color}18`:"transparent",border:`1px solid ${(node.parallel_ias||[]).includes(id)?MODEL_DEFS[id].color+"60":"var(--bd)"}`,borderRadius:4,transition:"all .15s"}}>
                            <input type="checkbox" checked={(node.parallel_ias||[]).includes(id)} onChange={e=>{
                              const pias = e.target.checked ? [...(node.parallel_ias||[]), id] : (node.parallel_ias||[]).filter(x=>x!==id);
                              const n=[...workflowNodes]; n[idx]={...n[idx],parallel_ias:pias}; saveWorkflow(n);
                            }} style={{accentColor:MODEL_DEFS[id].color,margin:0}}/>
                            {MODEL_DEFS[id].icon} {MODEL_DEFS[id].short}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Prompt / Transform textarea */}
                  <div>
                    <div style={{fontSize:7,color:"var(--mu)",marginBottom:3}}>
                      {node.type==="transform" ? "Code JS — fonction(input, prev, named) { … return string; }" : "Prompt — variables : {INPUT} {PREVIOUS}"+( idx>0?" {"+workflowNodes[idx-1].name+"}":"" )}
                    </div>
                    <textarea value={node.prompt} onChange={e=>{const n=[...workflowNodes];n[idx]={...n[idx],prompt:e.target.value};saveWorkflow(n);}}
                      placeholder={node.type==="transform"?"return prev.toUpperCase();" : node.type==="parallel"?"Analyse ce sujet : {INPUT}":"Résume ceci en 5 points :\n{PREVIOUS}"}
                      rows={node.type==="transform"?3:2}
                      style={{width:"100%",background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:5,color:"var(--tx)",fontSize:9,fontFamily:"'IBM Plex Mono',monospace",padding:"6px 9px",resize:"vertical",outline:"none",lineHeight:1.55}}/>
                  </div>

                  {/* Result */}
                  {res && (
                    <div style={{background:res.ok?"rgba(74,222,128,.04)":"rgba(248,113,113,.04)",border:`1px solid ${res.ok?"rgba(74,222,128,.2)":"rgba(248,113,113,.2)"}`,borderRadius:6,overflow:"hidden"}}>
                      <div style={{display:"flex",alignItems:"center",gap:6,padding:"4px 9px",background:res.ok?"rgba(74,222,128,.06)":"rgba(248,113,113,.06)",borderBottom:`1px solid ${res.ok?"rgba(74,222,128,.15)":"rgba(248,113,113,.15)"}`}}>
                        <span style={{fontSize:9,color:res.ok?"var(--green)":"var(--red)"}}>{res.ok?"✓ Succès":"✗ Erreur"}</span>
                        {res.duration && <span style={{fontSize:8,color:"var(--mu)"}}>{(res.duration/1000).toFixed(1)}s</span>}
                        <button onClick={()=>{try{navigator.clipboard.writeText(res.output);}catch{}}} style={{marginLeft:"auto",background:"none",border:"1px solid var(--bd)",borderRadius:3,color:"var(--mu)",fontSize:8,padding:"1px 5px",cursor:"pointer"}}>⎘</button>
                        <button onClick={()=>{setChatInput(res.output);navigateTab("chat");}} style={{background:"rgba(212,168,83,.1)",border:"1px solid rgba(212,168,83,.3)",borderRadius:3,color:"var(--ac)",fontSize:8,padding:"1px 5px",cursor:"pointer"}}>→ Chat</button>
                      </div>
                      <div style={{padding:"8px 10px",maxHeight:160,overflowY:"auto"}}>
                        <MarkdownRenderer text={res.output}/>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* ── Plugin section (kept) ── */}
            <div style={{marginTop:24,borderTop:"1px solid var(--bd)",paddingTop:16}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
                <span style={{fontFamily:"var(--font-display,'Syne',sans-serif)",fontWeight:700,fontSize:12,color:"var(--tx)"}}>🔌 Plugins JS</span>
                <span style={{fontSize:9,color:"var(--mu)"}}>Charger des modules JavaScript depuis un CDN</span>
              </div>
              <div style={{marginBottom:14,overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:9,fontFamily:"'IBM Plex Mono',monospace"}}>
                  <thead><tr style={{borderBottom:"1px solid var(--bd)"}}>{["Plugin","Utilité","Action"].map(h=><th key={h} style={{padding:"5px 8px",color:"var(--mu)",textAlign:"left",fontWeight:600}}>{h}</th>)}</tr></thead>
                  <tbody>{[
                    {name:"📊 Chart.js",usage:"Graphiques",url:"https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js"},
                    {name:"🎨 Highlight.js",usage:"Coloration syntaxique",url:"https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"},
                    {name:"🔒 DOMPurify",usage:"Anti-XSS",url:"https://cdnjs.cloudflare.com/ajax/libs/dompurify/3.0.6/purify.min.js"},
                    {name:"📐 Math.js",usage:"Calcul avancé",url:"https://cdnjs.cloudflare.com/ajax/libs/mathjs/12.4.1/math.min.js"},
                    {name:"📦 JSZip",usage:"ZIP",url:"https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"},
                    {name:"🔁 Lodash",usage:"Utilitaires JS",url:"https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.min.js"},
                  ].map(p=>(<tr key={p.url} style={{borderBottom:"1px solid rgba(255,255,255,.03)"}}>
                    <td style={{padding:"5px 8px",color:"var(--tx)",fontWeight:600}}>{p.name}</td>
                    <td style={{padding:"5px 8px",color:"var(--mu)"}}>{p.usage}</td>
                    <td style={{padding:"5px 8px"}}><button onClick={()=>loadPlugin(p.url)} style={{background:"rgba(74,222,128,.12)",border:"1px solid rgba(74,222,128,.3)",borderRadius:3,color:"var(--green)",fontSize:8,padding:"2px 8px",cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace",whiteSpace:"nowrap"}}>{plugins.find(x=>x.url===p.url)?"✓ Chargé":"+ Charger"}</button></td>
                  </tr>))}</tbody>
                </table>
              </div>
              <div style={{display:"flex",gap:6,marginBottom:10}}>
                <input value={pluginUrlInput} onChange={e=>setPluginUrlInput(e.target.value)}
                  placeholder="URL CDN personnalisée…"
                  style={{flex:1,background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:5,color:"var(--tx)",fontSize:10,padding:"6px 10px",fontFamily:"'IBM Plex Mono',monospace",outline:"none"}}/>
                <button onClick={()=>{if(pluginUrlInput.trim()){loadPlugin(pluginUrlInput.trim());setPluginUrlInput("");}}} style={{background:"rgba(96,165,250,.15)",border:"1px solid rgba(96,165,250,.4)",borderRadius:5,color:"var(--blue)",fontSize:10,padding:"6px 12px",cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace"}}>Charger URL</button>
              </div>
              {plugins.length>0&&<div style={{fontSize:9,color:"var(--mu)",marginBottom:6}}>Plugins actifs :</div>}
              {plugins.map(p=>(<div key={p.url} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 8px",background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:5,marginBottom:5,fontSize:9,fontFamily:"'IBM Plex Mono',monospace"}}>
                <span style={{color:p.loaded?"var(--green)":"var(--mu)"}}>{p.loaded?"●":"○"}</span>
                <span style={{flex:1,color:"var(--tx)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</span>
                <button onClick={()=>{const np=plugins.filter(x=>x.url!==p.url);setPlugins(np);localStorage.setItem("multiia_plugins",JSON.stringify(np));}} style={{background:"rgba(248,113,113,.1)",border:"1px solid rgba(248,113,113,.3)",borderRadius:3,color:"var(--red)",fontSize:9,padding:"1px 6px",cursor:"pointer"}}>✕</button>
              </div>))}
            </div>
          </div>
        )}

        {/* ── WEB TAB ── */}
        {/* ── WEB TAB ── */}
        {tab === "web" && (
          <div className={`scroll-tab pad tab-animate${tabAnimDir==="left"?" tab-animate-left":tabAnimDir==="right"?" tab-animate-right":""}`}>
            <div style={{ marginBottom:12, fontSize:11, color:"var(--mu)" }}>
              🌐 <strong style={{ color:"var(--tx)" }}>IAs Web</strong> — Ces services ne peuvent pas être intégrés (sécurité iframe). Clique pour ouvrir dans un nouvel onglet.
            </div>
            <div className="web-grid">
              {WEB_AIS.map(ai => (
                <div key={ai.id} className="web-card" style={{ borderColor:ai.color+"33" }}>
                  <div className="wc-hdr">
                    <div className="wc-icon" style={{ background:ai.color+"18", color:ai.color }}>{ai.icon}</div>
                    <div><div className="wc-name" style={{ color:ai.color }}>{ai.name}</div><div className="wc-sub">{ai.subtitle}</div></div>
                  </div>
                  <div className="wc-desc">{ai.desc}</div>
                  <a href={ai.url} target="_blank" rel="noreferrer" className="wc-btn" style={{ borderColor:ai.color, color:ai.color }}>↗ Ouvrir {ai.name}</a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── ARENA TAB ── */}
        {tab === "arena" && (
          <div className="arena-wrap">
            <div className="arena-hero">
              <div className="arena-title">⚔ Arène Algorithmique</div>
              <div className="arena-sub">Pas de favoritisme. Comparaison sans pitié sur 5 critères réels. Les chiffres parlent, les benchmarks ne mentent pas (enfin, pas toujours).</div>
            </div>

            <div className="pad" style={{ paddingTop:0 }}>

              {/* ── ACTUALITÉS EN PREMIER ── */}
              <AINewsBlock />

              {/* ── CRITÈRES ── */}
              <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:11, color:"var(--ac)", marginBottom:10, letterSpacing:1 }}>📋 NOS CRITÈRES DE JUGEMENT</div>
              <div className="criteria-grid">
                {[
                  { icon:"⚡", title:"Performances pures", desc:"Taille du modèle (B params), rapidité d'inférence, taux d'hallucinations, benchmarks MMLU/HumanEval" },
                  { icon:"🔧", title:"Fonctionnalités avancées", desc:"Plugins, multimodal (image/audio/vidéo), agents autonomes, outils de code et recherche web" },
                  { icon:"💰", title:"Tarification (sans pitié)", desc:"Du gratuit total au 'plutôt douloureux'. Coût réel pour 1M tokens, tiers gratuits, limites" },
                  { icon:"🔐", title:"Vie privée & éthique", desc:"Données stockées où ? Censure ? Politique d'entraînement sur vos données ? Juridiction RGPD ?" },
                  { icon:"💼", title:"Cas d'usage réels", desc:"Parce que faire des haïkus ne paie pas les factures. Code, analyse, SEO, agents, RAG, multilingue" },
                ].map(c => (
                  <div key={c.title} className="crit-card">
                    <div className="crit-icon">{c.icon}</div>
                    <div className="crit-title">{c.title}</div>
                    <div className="crit-desc">{c.desc}</div>
                  </div>
                ))}
              </div>

              <div style={{ display:"flex", gap:6, marginBottom:10, flexWrap:"wrap", alignItems:"center" }}>
                <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:11, color:"var(--ac)", letterSpacing:1, marginRight:4 }}>🏆 TABLEAU COMPARATIF</div>
                <span style={{ fontSize:8, color:"var(--mu)", padding:"1px 5px", border:"1px solid var(--bd)", borderRadius:3 }}>Mis à jour manuellement · pas de source temps réel standardisée</span>
                {[["all","Tous"],["top","Top ≥9"],["free","Gratuits"],["oss","Open Source"]].map(([f,l]) => (
                  <button key={f} className={`filter-btn ${arenaFilter===f?"on":""}`} onClick={() => setArenaFilter(f)}>{l}</button>
                ))}
                <div style={{ marginLeft:"auto", display:"flex", gap:5 }}>
                  {[["score","Score"],["free","Gratuit"],["name","Nom"]].map(([s,l]) => (
                    <button key={s} className={`filter-btn ${arenaSort===s?"on":""}`} onClick={() => setArenaSort(s)} style={{ fontSize:8 }}>↕ {l}</button>
                  ))}
                </div>
              </div>

              <div className="tbl-wrap" style={{ marginBottom:24 }}>
                <table className="arena-tbl">
                  <thead>
                    <tr>
                      <th>#</th><th>IA</th><th>Provider</th><th>Params</th><th>Contexte</th><th>Cible</th><th>Score</th><th>Prix</th><th>Tag</th><th>Points forts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedArena.map((m, i) => (
                      <tr key={m.name}>
                        <td style={{ color:"var(--mu)", fontSize:9 }}>{i+1}</td>
                        <td>
                          <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                            <span style={{ color:m.color, fontSize:13 }}>{m.icon}</span>
                            <div>
                              <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:10, color:m.color }}>{m.name}</div>
                              {m.free && <span className="free-badge">FREE</span>}
                            </div>
                          </div>
                        </td>
                        <td style={{ color:"var(--mu)", fontSize:9 }}>{m.provider}</td>
                        <td><span className="params-badge">{m.params}</span></td>
                        <td style={{ fontSize:9 }}>{m.ctx}</td>
                        <td style={{ color:"var(--mu)", fontSize:9 }}>{m.target}</td>
                        <td><ScoreBar score={m.score} /></td>
                        <td><span className="prix-badge">{m.prix}</span></td>
                        <td><span className="tag-badge" style={{ color:m.color, background:m.color+"18" }}>{m.tag}</span></td>
                        <td style={{ fontSize:9, color:"var(--mu)", maxWidth:160 }}>{m.strengths.slice(0,3).join(" · ")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="cfg-note" style={{ marginBottom:20 }}>* = estimation non-officielle (les labs ne publient pas les tailles exactes) · Prix : ¢=très peu cher · $ à $$$$=progressif · B=milliards de paramètres d'entraînement</div>

              <div style={{ display:"flex", gap:12, marginBottom:16, flexWrap:"wrap" }}>
                <div style={{ flex:1, minWidth:200 }}>
                  <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:11, color:"var(--green)", marginBottom:8, letterSpacing:1 }}>🏆 TOPS</div>
                  {[
                    { icon:"◉", color:"#5AC87C", title:"Raisonnement : GPT-o3", sub:"Records absolus sur maths et science. Irremplaçable pour les problèmes complexes." },
                    { icon:"✦", color:"#D4A853", title:"Polyvalent Pro : Claude Sonnet 4", sub:"Meilleur ratio qualité/prix pour usage professionnel intensif." },
                    { icon:"⬡", color:"#A0C8FF", title:"Économique : DeepSeek V3/R1", sub:"671B MoE à des prix dérisoires. Parfait pour scaler en production." },
                    { icon:"◇", color:"#6BA5E0", title:"Contexte géant gratuit : Gemini Flash", sub:"1 million de tokens gratuits. Aucun rival sur ce terrain." },
                    { icon:"⚡", color:"#F97316", title:"OSS Gratuit : Llama 3.3 via Groq", sub:"14 400 requêtes/jour gratuitement. Résultats pro pour 0€." },
                  ].map(t => (
                    <div key={t.title} style={{ display:"flex", gap:7, padding:"6px 0", borderBottom:"1px solid var(--bd)" }}>
                      <span style={{ color:t.color, fontSize:14, flexShrink:0 }}>{t.icon}</span>
                      <div><div style={{ fontSize:10, fontWeight:700, color:t.color }}>{t.title}</div><div style={{ fontSize:9, color:"var(--mu)", lineHeight:1.5 }}>{t.sub}</div></div>
                    </div>
                  ))}
                </div>
                <div style={{ flex:1, minWidth:200 }}>
                  <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:11, color:"var(--red)", marginBottom:8, letterSpacing:1 }}>💀 FLOPS</div>
                  {[
                    { icon:"⊞", color:"#9999AA", title:"Copilot : marketing > substance", sub:"Les promesses de l'IA intégrée à Office déçoivent en pratique quotidienne." },
                    { icon:"文", color:"#9999AA", title:"Ernie 5.0 : inaccessible hors Chine", sub:"Censuré, serveurs saturés hors Asie, peu de confiance pour données pro." },
                    { icon:"◉", color:"#9999AA", title:"GPT-o3 : facture salée", sub:"Performances exceptionnelles mais coût prohibitif pour la plupart des usages." },
                    { icon:"φ", color:"#9999AA", title:"Phi-3.5 : trop petit pour tâches complexes", sub:"Bien pour l'edge/mobile mais les limites sont vite atteintes." },
                  ].map(t => (
                    <div key={t.title} style={{ display:"flex", gap:7, padding:"6px 0", borderBottom:"1px solid var(--bd)" }}>
                      <span style={{ color:t.color, fontSize:14, flexShrink:0 }}>{t.icon}</span>
                      <div><div style={{ fontSize:10, fontWeight:700, color:"var(--mu)" }}>{t.title}</div><div style={{ fontSize:9, color:"var(--mu)", lineHeight:1.5 }}>{t.sub}</div></div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom:8, display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:11, color:"var(--ac)", letterSpacing:1 }}>📅 GRANDES ACTUALITÉS 2024–2025</div>
                <span style={{ fontSize:8, color:"var(--mu)", padding:"1px 5px", border:"1px solid var(--bd)", borderRadius:3 }}>Chronologie · Voir flux RSS ci-dessus pour l'actu en temps réel</span>
              </div>
              <div className="news-grid" style={{ marginBottom:20 }}>
                {ARENA_NEWS.map((n, i) => (
                  <div key={i} className="news-card" style={{ borderColor:n.color+"33" }}>
                    <div className="news-icon" style={{ color:n.color }}>{n.icon}</div>
                    <div className="news-body">
                      <div className="news-hdr">
                        <div className="news-title" style={{ color:n.color }}>{n.title}</div>
                        <span className="news-tag" style={{ background:n.color+"18", color:n.color }}>{n.tag}</span>
                        <span className="news-date">{n.date}</span>
                      </div>
                      <div className="news-text">{n.text}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:11, color:"var(--ac)", marginBottom:10, letterSpacing:1 }}>🔌 PLUGINS & COMMUNAUTÉ EN CROISSANCE</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))", gap:8, marginBottom:20 }}>
                {[
                  { icon:"◈", color:"#74C98C", name:"GPTs / OpenAI Store", desc:"Des milliers d'agents spécialisés. Le plus grand écosystème de plugins IA.", note:"En croissance" },
                  { icon:"🤗", color:"#FFD21E", name:"HuggingFace Hub", desc:"200k+ modèles open source. LoRAs, datasets, Spaces interactifs.", note:"Très actif" },
                  { icon:"🔧", color:"#10B981", name:"ComfyUI Community", desc:"Des milliers de workflows image/vidéo partagés. Nodes custom.", note:"Explosion" },
                  { icon:"⚡", color:"#F97316", name:"Ollama + Open WebUI", desc:"Run local n'importe quel modèle. Interface web soignée.", note:"Viral" },
                  { icon:"▲", color:"#FF8C69", name:"Mistral Agents API", desc:"Agents avec outils, mémoire, navigation web. Européen RGPD.", note:"Nouveau" },
                  { icon:"✦", color:"#D4A853", name:"Claude Tool Use", desc:"Claude avec outils : computer use, navigation web, exécution code.", note:"En expansion" },
                ].map(p => (
                  <div key={p.name} style={{ background:"var(--s1)", border:`1px solid ${p.color}33`, borderRadius:8, padding:"10px 12px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:5 }}>
                      <span style={{ color:p.color, fontSize:16 }}>{p.icon}</span>
                      <div>
                        <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:10, color:p.color }}>{p.name}</div>
                        <span style={{ fontSize:7, padding:"1px 4px", borderRadius:2, background:p.color+"18", color:p.color, fontWeight:700 }}>{p.note}</span>
                      </div>
                    </div>
                    <div style={{ fontSize:9, color:"var(--mu)", lineHeight:1.5 }}>{p.desc}</div>
                  </div>
                ))}
              </div>

              <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:11, color:"var(--blue)", marginBottom:10, letterSpacing:1 }}>🐋 MODÈLES XXL — Les mastodontes</div>
              <div className="cfg-note">
                Les modèles qui jouent dans la cour des grands (150B+ paramètres ou 200k+ tokens) :<br/><br/>
                <strong style={{color:"var(--ac)"}}>GPT-o1/o3 (~300B*)</strong> — Raisonnement profond, records sur ARC-AGI, mathématiques complexes · 
                <strong style={{color:"var(--ac)"}}>  Claude Opus 4 (~200B*)</strong> — Multimodal, 200k tokens, agents autonomes sur PC · 
                <strong style={{color:"var(--ac)"}}>  DeepSeek V3/R1 (671B MoE)</strong> — Architecture Mixture-of-Experts, 37B params actifs, open source · 
                <strong style={{color:"var(--ac)"}}>  Llama 3.1 405B</strong> — Le géant open weights de Meta, 128k tokens · 
                <strong style={{color:"var(--ac)"}}>  Gemini 1.5 Pro (2M tokens)</strong> — Le seul modèle avec 2 millions de tokens de contexte · 
                <strong style={{color:"var(--ac)"}}>  Grok 3 (~300B*)</strong> — Accès temps réel, image/audio · 
                <strong style={{color:"var(--ac)"}}>  Ernie 5.0 (~260B*)</strong> — Multimodal full pour le marché chinois<br/><br/>
                Image, plugins, agents personnalisés… tout y est chez les top-tier. Les modèles XXL surpassent les petits sur le raisonnement en plusieurs étapes, le code complexe, et la cohérence sur de longs documents.
              </div>
            </div>
          </div>
        )}

        {/* ── YOUTUBE TAB ── */}
        {/* ── MÉDIAS TAB (YouTube + Images fusionnés) ── */}
        {tab === "medias" && (
          <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",paddingBottom:isMobile?"64px":"0"}}>
            <div className="media-subtabs">
              {[["youtube","▶ YouTube"],["images","🎨 Images IA"],["webia","🌐 IAs Web"]].map(([k,l])=>(
                <button key={k} className={"media-stab "+(mediaSubTab===k?"on":"")} onClick={()=>setMediaSubTab(k)}>{l}</button>
              ))}
            </div>
            <div className="media-content">
              {mediaSubTab==="youtube" && <YouTubeTab apiKeys={apiKeys} />}
              {mediaSubTab==="webia" && (
                <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
                  <div style={{padding:"8px 12px",borderBottom:"1px solid var(--bd)",flexShrink:0,background:"var(--s1)",display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
                    <span style={{fontSize:10,color:"var(--mu)"}}>Clique sur une IA pour l'ouvrir en iframe ·</span>
                    <span style={{fontSize:9,color:"var(--orange)"}}>⚠️ Certains sites bloquent les iframes (ouvrent dans un nouvel onglet)</span>
                  </div>
                  <div style={{display:"flex",gap:8,padding:"10px 12px",flexWrap:"wrap",flexShrink:0,borderBottom:"1px solid var(--bd)",background:"var(--s1)"}}>
                    {WEB_AIS.map(ia=>(
                      <a key={ia.id} href={ia.url} target="_blank" rel="noreferrer"
                        style={{display:"flex",alignItems:"center",gap:7,padding:"7px 12px",background:"var(--s2)",border:`1px solid ${ia.color}44`,borderRadius:8,textDecoration:"none",cursor:"pointer",transition:"all .15s"}}
                        onMouseEnter={e=>e.currentTarget.style.borderColor=ia.color}
                        onMouseLeave={e=>e.currentTarget.style.borderColor=ia.color+"44"}>
                        <span style={{fontSize:14,color:ia.color}}>{ia.icon}</span>
                        <div>
                          <div style={{fontSize:10,fontWeight:700,color:ia.color}}>{ia.name}</div>
                          <div style={{fontSize:8,color:"var(--mu)"}}>{ia.subtitle}</div>
                        </div>
                        <span style={{fontSize:9,color:"var(--mu)",marginLeft:4}}>↗</span>
                      </a>
                    ))}
                  </div>
                  <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12,color:"var(--mu)",padding:20,textAlign:"center"}}>
                    <div style={{fontSize:36}}>🌐</div>
                    <div style={{fontSize:12}}>Les IAs web s'ouvrent dans un nouvel onglet</div>
                    <div style={{fontSize:10}}>La plupart des sites IA bloquent les iframes pour des raisons de sécurité.</div>
                    <div style={{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"center",marginTop:8}}>
                      {WEB_AIS.map(ia=>(
                        <a key={ia.id} href={ia.url} target="_blank" rel="noreferrer"
                          style={{padding:"8px 16px",background:`${ia.color}18`,border:`1px solid ${ia.color}44`,borderRadius:8,color:ia.color,textDecoration:"none",fontSize:11,fontWeight:700,display:"flex",alignItems:"center",gap:6}}>
                          {ia.icon} {ia.name}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {mediaSubTab==="images" && (
          <div className="img-wrap">
            <div style={{ marginBottom:12 }}>
              <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:"clamp(14px,2.5vw,18px)", color:"var(--ac)", marginBottom:5 }}>🎨 Générateurs d'Images IA</div>
              <div style={{ fontSize:11, color:"var(--mu)", marginBottom:12 }}>Priorité aux outils <strong style={{color:"var(--green)"}}>gratuits et open source</strong>. Qualité, vitesse et facilité notées sur 10.</div>
              <div className="img-filter">
                {[["free","⭐ Gratuits d'abord"],["oss","🔓 Open Source"],["all","Tous"],["paid","💰 Payants"]].map(([f,l]) => (
                  <button key={f} className={`filter-btn ${imgFilter===f?"on":""}`} onClick={() => setImgFilter(f)}>{l}</button>
                ))}
              </div>
            </div>
            <div className="img-grid">
              {filteredImages.map(g => (
                <div key={g.id} className={`img-card ${g.license&&(g.license.includes("Apache")||g.license.includes("GPL"))?"oss":""}`} style={{ borderColor:g.color+"44" }}>
                  <div className="ic-hdr">
                    <div className="ic-icon" style={{ background:g.color+"18", color:g.color }}>{g.icon}</div>
                    <div style={{ flex:1 }}>
                      <div className="ic-name" style={{ color:g.color }}>{g.name}</div>
                      <div className="ic-sub">{g.provider}</div>
                    </div>
                    <div>
                      <span className="ic-free" style={{ background:g.free?"rgba(74,222,128,.12)":"rgba(251,146,60,.1)", color:g.free?"var(--green)":"var(--orange)" }}>{g.free?"GRATUIT":"PAYANT"}</span>
                      {g.license && (g.license.includes("Apache")||g.license.includes("GPL")) && <div style={{ fontSize:7, color:"var(--green)", marginTop:2 }}>🔓 {g.license}</div>}
                    </div>
                  </div>
                  <div className="ic-meters">
                    {[["Qualité",g.quality],["Vitesse",g.speed],["Facilité",g.ease]].map(([l,v]) => (
                      <div key={l} className="meter-item">
                        <div className="meter-lbl">{l}</div>
                        <MeterBar val={v} />
                      </div>
                    ))}
                  </div>
                  <div className="ic-desc">{g.desc}</div>
                  <div className="ic-strengths">{g.strengths.slice(0,4).map(s => <span key={s} className="ic-str">{s}</span>)}</div>
                  <div className="ic-limits">⚠️ {g.limits}</div>
                  <div className="ic-tags">{g.freeLabel && <span className="ic-tag" style={{ color:g.free?"var(--green)":"var(--orange)", borderColor:g.free?"rgba(74,222,128,.3)":"rgba(251,146,60,.3)" }}>{g.freeLabel}</span>}{g.tags.map(t=><span key={t} className="ic-tag">{t}</span>)}</div>
                  <a href={g.url} target="_blank" rel="noreferrer" className="ic-btn" style={{ borderColor:g.color, color:g.color }}>↗ {g.urlLabel}</a>
                </div>
              ))}
            </div>
            <div className="cfg-note" style={{ marginTop:14 }}>
              💡 <strong>Conseil</strong> : Pour la meilleure qualité gratuite localement → <strong style={{color:"var(--green)"}}>FLUX.1 via ComfyUI</strong>. Pour la plus simple sans installation → <strong style={{color:"#4FC3F7"}}>Bing Image Creator</strong> (DALL-E 3 gratuit). Pour le texte dans les images → <strong style={{color:"#F59E0B"}}>Ideogram</strong>.
            </div>
          </div>
              )}
            </div>
          </div>
        )}

        {/* ── PROMPTS TAB ── */}
        {tab === "prompts" && (
          <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
            <PromptsTab onInject={injectPrompt}/>
          </div>
        )}

        {/* ── RÉDACTION TAB ── */}
        {tab === "redaction" && (
          <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
            <RedactionTab enabled={enabled} apiKeys={apiKeys}/>
          </div>
        )}

        {/* ── RECHERCHE TAB ── */}
        {tab === "recherche" && (
          <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
            <RechercheTab enabled={enabled} apiKeys={apiKeys} setChatInput={setChatInput} setTab={setTab}/>
          </div>
        )}

        {/* ── WORKFLOWS TAB ── */}


        {/* ── WEB IAs TAB ── */}
        {tab === "webia" && (
          <WebIAsTab />
        )}
        {false && (
          <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
            <div style={{padding:"12px 16px",borderBottom:"1px solid var(--bd)",flexShrink:0,background:"var(--s1)",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
              <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:14,color:"var(--ac)"}}>🌐 IAs Web</div>
              <div style={{fontSize:9,color:"var(--mu)"}}>Toutes les IAs accessibles via navigateur — s'ouvrent dans un nouvel onglet</div>
            </div>
            <div style={{flex:1,overflow:"auto",padding:"16px",display:"flex",flexDirection:"column",gap:20}}>
              {["gratuit","payant"].map(cat=>{
                const items = WEB_AIS.filter(ia=>ia.cat===cat);
                return (
                  <div key={cat}>
                    <div style={{fontSize:10,fontWeight:700,color:cat==="gratuit"?"var(--green)":"var(--orange)",marginBottom:10,display:"flex",alignItems:"center",gap:6}}>
                      {cat==="gratuit"?"✅ GRATUITES — Aucun compte requis (ou compte gratuit)":"💳 PREMIUM — Abonnement payant pour accès complet"}
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))",gap:10}}>
                      {items.map(ia=>(
                        <a key={ia.id} href={ia.url} target="_blank" rel="noreferrer"
                          style={{display:"flex",flexDirection:"column",gap:8,padding:"12px 14px",background:"var(--s1)",border:`1px solid ${ia.color}33`,borderRadius:8,textDecoration:"none",transition:"all .2s"}}
                          onMouseEnter={e=>{e.currentTarget.style.borderColor=ia.color;e.currentTarget.style.transform="translateY(-2px)"}}
                          onMouseLeave={e=>{e.currentTarget.style.borderColor=ia.color+"33";e.currentTarget.style.transform=""}}>
                          <div style={{display:"flex",alignItems:"center",gap:8}}>
                            <div style={{width:32,height:32,borderRadius:"50%",background:ia.color+"18",border:`2px solid ${ia.color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,color:ia.color,flexShrink:0}}>{ia.icon}</div>
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{fontSize:11,fontWeight:700,color:ia.color}}>{ia.name}</div>
                              <div style={{fontSize:8,color:"var(--mu)"}}>{ia.subtitle}</div>
                            </div>
                            <span style={{fontSize:11,color:"var(--mu)"}}>↗</span>
                          </div>
                          <div style={{fontSize:9,color:"var(--mu)",lineHeight:1.4}}>{ia.desc}</div>
                        </a>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── NOTES TAB ── */}
        {tab === "notes" && (
          <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
            <NotesTab onCopyToChat={(text) => { navigateTab("chat"); setTimeout(()=>setChatInput(text),100); }}/>
          </div>
        )}

        {/* ── TRADUCTEUR TAB ── */}
        {tab === "traducteur" && (
          <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
            <div style={{padding:"10px 14px",borderBottom:"1px solid var(--bd)",flexShrink:0,background:"var(--s1)",display:"flex",alignItems:"center",gap:8}}>
              <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:14,color:"var(--ac)"}}>🌍 Traducteur Multi-IA</div>
              <div style={{fontSize:9,color:"var(--mu)",marginLeft:4}}>Toutes les IAs traduisent en parallèle — compare et choisis la meilleure version</div>
            </div>
            <TraducteurTab enabled={enabled} apiKeys={apiKeys}/>
          </div>
        )}

        {/* ── AGENT TAB ── */}
        {tab === "agent" && (
          <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
            <AgentTab enabled={enabled} apiKeys={apiKeys}/>
          </div>
        )}

        {/* ── STATS TAB ── */}
        {tab === "stats" && (
          <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
            <StatsTab stats={usageStats} onReset={resetStats}/>
          </div>
        )}

        {/* ── DEBATE TAB ── */}
        {tab === "debate" && <>
          <div className="debate-wrap"
            onDragOver={e=>{e.preventDefault();e.currentTarget.style.outline="2px dashed var(--ac)";}}
            onDragLeave={e=>{e.currentTarget.style.outline="none";}}
            onDrop={e=>{e.preventDefault();e.currentTarget.style.outline="none";const f=e.dataTransfer.files?.[0];if(f)handleDebFile(f);}}>
            {debPhase === 0 && (
              <div className="debate-intro">
                <div style={{ fontSize:28 }}>{debMode==="analyse"?"🔬":"⚡"}</div>
                <div className="debate-title">{debMode==="analyse"?"Mode Analyse":"Mode Débat"}</div>
                <div className="debate-desc">
                  {debMode==="analyse" ? <>
                    <strong>Chaque IA analyse sous un angle différent</strong> — structure, qualité, insights, améliorations — puis une synthèse complète combine tout.<br/><br/>
                    <strong style={{color:"var(--blue)"}}>Idéal pour :</strong> contrats, code, rapports, articles, emails importants.<br/><br/>
                    <em style={{fontSize:9}}>Glisse ton fichier ici ou clique sur 📎 · PDF, TXT, MD, code, images</em>
                  </> : <>
                    Les IAs répondent indépendamment, confrontent leurs points de vue, puis une synthèse finale est produite.<br/><br/>
                    <em style={{ fontSize:9 }}>IAs disponibles : {availableIds.length>0?availableIds.map(id=>`${MODEL_DEFS[id].icon}${MODEL_DEFS[id].short}`).join(" · "):"aucune"}</em>
                  </>}
                </div>
                {/* Drop zone visual */}
                <div style={{marginTop:12,border:"2px dashed rgba(96,165,250,.3)",borderRadius:8,padding:"12px 20px",color:"var(--mu)",fontSize:9,cursor:"pointer",transition:"all .2s"}}
                  onMouseEnter={e=>e.currentTarget.style.borderColor="var(--ac)"}
                  onMouseLeave={e=>e.currentTarget.style.borderColor="rgba(96,165,250,.3)"}
                  onClick={()=>debFileRef.current?.click()}>
                  {debFile
                    ? <span style={{color:"var(--blue)"}}>✓ {debFile.icon} <strong>{debFile.name}</strong> — {debFile.type==="image"?"Image":Math.round((debFile.content||"").length/1000)+"k car"}</span>
                    : <span>📎 Glisse un fichier ici ou <span style={{color:"var(--ac)",textDecoration:"underline"}}>clique pour parcourir</span><br/><span style={{opacity:.6}}>PDF · TXT · MD · CSV · JSON · Code · Images</span></span>
                  }
                </div>
              </div>
            )}
            {debPhase > 0 && debQuestion && (
              <div style={{ padding:"7px 14px", borderBottom:"1px solid var(--bd)", background:"var(--s1)", display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
                <div>
                  <span style={{ fontSize:8, color:"var(--ac)", fontWeight:600, letterSpacing:1 }}>{debMode==="analyse"?"ANALYSE":"QUESTION"} </span>
                  <span style={{ fontSize:10, color:"var(--tx)" }}>{debQuestion}</span>
                </div>
                {debFile && (
                  <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:5,background:"rgba(96,165,250,.08)",border:"1px solid rgba(96,165,250,.2)",borderRadius:4,padding:"2px 8px"}}>
                    <span style={{fontSize:10}}>{debFile.icon}</span>
                    <span style={{fontSize:8,color:"var(--blue)",fontFamily:"var(--font-mono)","overflow":"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:120}}>{debFile.name}</span>
                  </div>
                )}
              </div>
            )}
            {debPhase >= 1 && debPhase <= 3 && <>
              <div className="prog-bar"><div className="prog-fill" style={{ width:`${debProgress}%` }}/></div>
              <div className="prog-lbl">{["","⟳ Tour 1…","⟳ Tour 2…","⟳ Synthèse…"][debPhase]} {debProgressLabel&&<span style={{marginLeft:6,color:"var(--tx)"}}>{debProgressLabel}</span>}</div>
            </>}
            {Object.keys(debRound1).length > 0 && (
              <div className="phase-block">
                <div className="phase-header" onClick={() => setOpenPhases(p=>({...p,r1:!p.r1}))}>
                  <span className="ph-badge" style={{ background:"rgba(85,85,104,.2)", color:"var(--mu)" }}>TOUR 1</span>
                  <span className="ph-title">Réponses indépendantes</span>
                  <span className={`ph-chev ${openPhases.r1?"open":""}`}>▾</span>
                </div>
                {openPhases.r1 && <div className="phase-grid">
                  {IDS.filter(id=>enabled[id]).map(id => { const m=MODEL_DEFS[id]; return (
                    <div key={id} className="pg-cell">
                      <div className="pgc-hdr"><span style={{color:m.color,fontSize:12}}>{m.icon}</span><span style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:10,color:m.color}}>{m.short}</span></div>
                      <div className={`pgc-body ${debRound1[id]?"":"mu"}`}>{debRound1[id]?<MarkdownRenderer text={debRound1[id]}/>:"En attente…"}</div>
                    </div>
                  );})}
                </div>}
              </div>
            )}
            {Object.keys(debRound2).length > 0 && (
              <div className="phase-block">
                <div className="phase-header" onClick={() => setOpenPhases(p=>({...p,r2:!p.r2}))}>
                  <span className="ph-badge" style={{ background:"rgba(212,168,83,.12)", color:"var(--ac)" }}>TOUR 2</span>
                  <span className="ph-title">Confrontation des points de vue</span>
                  <span className={`ph-chev ${openPhases.r2?"open":""}`}>▾</span>
                </div>
                {openPhases.r2 && <div className="phase-grid">
                  {IDS.filter(id=>enabled[id]).map(id => { const m=MODEL_DEFS[id]; return (
                    <div key={id} className="pg-cell">
                      <div className="pgc-hdr"><span style={{color:m.color,fontSize:12}}>{m.icon}</span><span style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:10,color:m.color}}>{m.short}</span></div>
                      <div className={`pgc-body ${debRound2[id]?"":"mu"}`}>{debRound2[id]?<MarkdownRenderer text={debRound2[id]}/>:"En attente…"}</div>
                    </div>
                  );})}
                </div>}
              </div>
            )}
            {(debPhase === 3 || debPhase === 4) && (
              <div className="syn-block">
                <div className="syn-hdr">
                  <span style={{ fontSize:14 }}>✦</span>
                  <div className="syn-title">Synthèse Finale</div>
                  <span className="syn-by">par {debSynthBy}</span>
                </div>
                <div className={`syn-body ${debSynthesis?"":"mu"}`}>{debSynthesis?<MarkdownRenderer text={debSynthesis}/>:"En cours…"}</div>
              </div>
            )}
          </div>
          <div className="debate-foot" style={{padding:"8px 12px",borderTop:"1px solid var(--bd)",background:"var(--bg)",flexShrink:0}}>
            {/* Mode selector */}
            <div style={{display:"flex",gap:5,marginBottom:8,flexWrap:"wrap",alignItems:"center"}}>
              <span style={{fontSize:8,color:"var(--mu)",fontWeight:700,letterSpacing:".5px"}}>MODE :</span>
              {[["debate","⚡ Débat","Les IAs défendent des positions différentes"],["analyse","🔬 Analyse","Chaque IA analyse selon un angle différent — idéal pour les fichiers"]].map(([m,label,desc])=>(
                <button key={m} onClick={()=>setDebMode(m)} title={desc}
                  style={{fontSize:9,padding:"3px 10px",background:debMode===m?"rgba(212,168,83,.2)":"transparent",border:`1px solid ${debMode===m?"rgba(212,168,83,.5)":"var(--bd)"}`,borderRadius:5,color:debMode===m?"var(--ac)":"var(--mu)",cursor:"pointer",fontFamily:"var(--font-ui)",transition:"all .15s"}}>
                  {label}
                </button>
              ))}
              {debFile && <span style={{marginLeft:"auto",fontSize:8,color:"var(--green)"}}>✓ Fichier : {debFile.icon} {debFile.name} · {debFile.type==="image"?"Image":Math.round((debFile.content||"").length/1000)+"k car"}</span>}
            </div>

            {/* File preview if attached */}
            {debFile && (
              <div style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",background:"rgba(96,165,250,.06)",border:"1px solid rgba(96,165,250,.2)",borderRadius:6,marginBottom:8}}>
                {debFile.type==="image" && debFile.base64 && (
                  <img src={`data:${debFile.mimeType};base64,${debFile.base64}`} alt={debFile.name}
                    style={{width:48,height:48,objectFit:"cover",borderRadius:4,border:"1px solid var(--bd)",flexShrink:0}}/>
                )}
                {debFile.type!=="image" && (
                  <div style={{width:40,height:40,background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:4,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    <span style={{fontSize:16}}>{debFile.icon}</span>
                    <span style={{fontSize:6,color:"var(--mu)",marginTop:1}}>{debFile.name.split(".").pop().toUpperCase()}</span>
                  </div>
                )}
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:10,fontWeight:700,color:"var(--tx)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{debFile.name}</div>
                  <div style={{fontSize:8,color:"var(--mu)",marginTop:1}}>
                    {debFile.type==="image"?"🖼️ Image":"📄 Document"}{debFile.content?" · "+Math.round(debFile.content.length/1000)+"k car":""}
                    {" · "}Les IAs analyseront ce fichier
                  </div>
                  {debFile.type!=="image" && debFile.content && (
                    <div style={{fontSize:7,color:"var(--mu)",marginTop:2,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:1,WebkitBoxOrient:"vertical",opacity:.6}}>
                      {debFile.content.slice(0,120)}…
                    </div>
                  )}
                </div>
                <button onClick={()=>setDebFile(null)}
                  style={{background:"rgba(248,113,113,.1)",border:"1px solid rgba(248,113,113,.3)",borderRadius:4,color:"var(--red)",fontSize:10,padding:"3px 7px",cursor:"pointer",flexShrink:0}}>✕</button>
              </div>
            )}

            {/* Input row */}
            <div style={{display:"flex",gap:6,alignItems:"flex-end",flexWrap:"wrap"}}>
              {/* File attach button */}
              <input type="file" ref={debFileRef} style={{display:"none"}}
                accept=".pdf,.txt,.md,.csv,.json,.js,.py,.ts,.jsx,.tsx,.html,.css,.sql,.xml,image/*"
                onChange={e=>{const f=e.target.files?.[0];if(f)handleDebFile(f);e.target.value="";}}/>
              <button onClick={()=>debFileRef.current?.click()} title="Joindre un fichier (PDF, texte, code, image)"
                disabled={debPhase>0&&debPhase<4}
                style={{background:debFile?"rgba(96,165,250,.15)":"var(--s2)",border:`1px solid ${debFile?"rgba(96,165,250,.4)":"var(--bd)"}`,borderRadius:7,color:debFile?"var(--blue)":"var(--mu)",fontSize:14,width:38,height:38,cursor:debPhase>0&&debPhase<4?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all .15s"}}>
                📎
              </button>
              <textarea rows={1} value={debInput}
                placeholder={debFile ? `Question sur "${debFile.name}"… (optionnel en mode Analyse)` : "Question à débattre ou analyser…"}
                onChange={e=>setDebInput(e.target.value)}
                onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();if(debPhase===0||debPhase===4)launchDebate();}}}
                onInput={e=>{e.target.style.height="auto";e.target.style.height=Math.min(e.target.scrollHeight,100)+"px";}}
                disabled={debPhase>0&&debPhase<4}
                style={{flex:1,minWidth:120,background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:7,color:"var(--tx)",fontFamily:"var(--font-ui)",fontSize:11,padding:"8px 11px",outline:"none",resize:"none",lineHeight:1.5,transition:"border-color .2s"}}
                onFocus={e=>e.target.style.borderColor="var(--ac)"}
                onBlur={e=>e.target.style.borderColor="var(--bd)"}
              />
              {(debPhase===0||debPhase===4) && (
                <button className="launch-btn" onClick={debPhase===4?clearDebate:launchDebate}
                  disabled={debPhase===0&&!debInput.trim()&&!debFile}
                  style={{background:debMode==="analyse"?"rgba(96,165,250,.2)":"var(--ac)",borderColor:debMode==="analyse"?"rgba(96,165,250,.5)":undefined,color:debMode==="analyse"?"var(--blue)":"#09090B"}}>
                  {debPhase===4?"↺ Nouveau":debMode==="analyse"?"🔬 Analyser":"⚡ Débattre"}
                </button>
              )}
              {debPhase>0&&debPhase<4 && <button className="launch-btn" disabled style={{opacity:.5}}>⟳ En cours…</button>}
            </div>

            {/* Drag-and-drop zone */}
            <div style={{marginTop:6,fontSize:8,color:"var(--mu)",opacity:.6}}>
              {debPhase===0&&`${availableIds.length} IA(s) active(s) · ${debMode==="analyse"?"Chaque IA analyse selon un angle différent":"Les IAs débattent et confrontent leurs points de vue"} · Glisse un fichier ici`}
              {debPhase===4&&`✓ Terminé · Synthèse par ${debSynthBy}`}
            </div>
          </div>
        </>}

        {/* ── CONFIG TAB ── */}
        {/* ── PWA CONFIG SECTION ── */}
        {tab === "config" && pwaPrompt && !pwaInstalled && (
          <div style={{padding:"8px 14px",background:"rgba(212,168,83,.08)",borderBottom:"1px solid rgba(212,168,83,.2)",display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
            <span style={{fontSize:18}}>📲</span>
            <div style={{flex:1}}>
              <span style={{fontSize:10,fontWeight:700,color:"var(--ac)"}}>Installer comme application</span>
              <span style={{fontSize:9,color:"var(--mu)",marginLeft:8}}>Accès rapide, plein écran, fonctionne hors-ligne</span>
            </div>
            <button className="pwa-install-btn" style={{padding:"6px 14px",fontSize:10}} onClick={installPwa}>📲 Installer</button>
          </div>
        )}
        {tab === "config" && pwaInstalled && (
          <div style={{padding:"6px 14px",background:"rgba(74,222,128,.08)",borderBottom:"1px solid rgba(74,222,128,.2)",fontSize:9,color:"var(--green)",flexShrink:0}}>
            ✓ Application installée sur cet appareil — Ouvre-la depuis ton écran d'accueil
          </div>
        )}

        {/* ── DIFF MODAL ── */}
        {showDiffModal && diffPair[0] && diffPair[1] && (() => {
          const id1 = diffPair[0], id2 = diffPair[1];
          const m1 = MODEL_DEFS[id1], m2 = MODEL_DEFS[id2];
          const conv1 = conversations[id1]||[], conv2 = conversations[id2]||[];
          const last1 = [...conv1].reverse().find(m=>m.role==="assistant")?.content||"";
          const last2 = [...conv2].reverse().find(m=>m.role==="assistant")?.content||"";
          // Tokenize simple
          const tokenize = t => t.toLowerCase().replace(/[^a-zà-ÿ0-9\s]/g,"").split(/\s+/).filter(Boolean);
          const words1 = new Set(tokenize(last1));
          const words2 = new Set(tokenize(last2));
          const common = new Set([...words1].filter(w=>words2.has(w)&&w.length>3));
          const highlightText = (text, commonSet, uniqueColor) => {
            const parts = text.split(/(\s+)/);
            return parts.map((word, i) => {
              const clean = word.toLowerCase().replace(/[^a-zà-ÿ0-9]/g,"");
              if (clean.length <= 3) return word;
              if (commonSet.has(clean)) return (<span key={i} style={{background:"rgba(74,222,128,.2)",borderRadius:2,padding:"0 1px"}}>{word}</span>);
              return (<span key={i} style={{background:`rgba(${uniqueColor},.15)`,borderRadius:2,padding:"0 1px"}}>{word}</span>);
            });
          };
          return (
            <div style={{position:"fixed",inset:0,zIndex:1000,background:"rgba(0,0,0,.75)",backdropFilter:"blur(4px)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={()=>setShowDiffModal(false)}>
              <div style={{background:"var(--bg)",border:"1px solid var(--bd)",borderRadius:10,width:"min(900px,100%)",maxHeight:"85vh",display:"flex",flexDirection:"column",overflow:"hidden"}} onClick={e=>e.stopPropagation()}>
                <div style={{padding:"10px 16px",borderBottom:"1px solid var(--bd)",display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
                  <span style={{fontSize:16}}>🔍</span>
                  <span style={{fontWeight:700,color:"var(--tx)",fontSize:12,fontFamily:"'Syne',sans-serif"}}>Vue diff — comparaison côte à côte</span>
                  <div style={{display:"flex",gap:8,marginLeft:8,fontSize:9,color:"var(--mu)"}}>
                    <span style={{background:"rgba(74,222,128,.15)",border:"1px solid rgba(74,222,128,.3)",borderRadius:3,padding:"1px 6px",color:"var(--green)"}}>● mots communs</span>
                    <span style={{background:"rgba(248,113,113,.1)",border:"1px solid rgba(248,113,113,.2)",borderRadius:3,padding:"1px 6px",color:"var(--red)"}}>● unique IA 1</span>
                    <span style={{background:"rgba(96,165,250,.1)",border:"1px solid rgba(96,165,250,.2)",borderRadius:3,padding:"1px 6px",color:"var(--blue)"}}>● unique IA 2</span>
                  </div>
                  <div style={{marginLeft:"auto",display:"flex",gap:6}}>
                    {[id1,id2].map((id,i)=>(
                      <select key={i} value={id} onChange={e=>{const p=[...diffPair];p[i]=e.target.value;setDiffPair(p);}}
                        style={{fontSize:9,background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:4,color:"var(--tx)",padding:"2px 6px"}}>
                        {IDS.filter(x=>enabled[x]).map(x=><option key={x} value={x}>{MODEL_DEFS[x]?.icon} {MODEL_DEFS[x]?.short}</option>)}
                      </select>
                    ))}
                    <button onClick={()=>setShowDiffModal(false)} style={{background:"transparent",border:"1px solid var(--bd)",borderRadius:4,color:"var(--mu)",padding:"2px 8px",cursor:"pointer",fontSize:12}}>✕</button>
                  </div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:0,overflow:"auto",flex:1}}>
                  {[[id1,last1,"248,113,113"],[id2,last2,"96,165,250"]].map(([id,text,uniqueRgb],i)=>{
                    const m=MODEL_DEFS[id];
                    const otherWords = i===0 ? words2 : words1;
                    const myWords = i===0 ? words1 : words2;
                    return (
                      <div key={id} style={{padding:"12px 14px",borderRight:i===0?"1px solid var(--bd)":undefined}}>
                        <div style={{fontSize:10,fontWeight:700,color:m.color,marginBottom:8,fontFamily:"'Syne',sans-serif"}}>{m.icon} {m.name}</div>
                        <div style={{fontSize:9,color:"var(--tx)",lineHeight:1.7,whiteSpace:"pre-wrap",fontFamily:"'IBM Plex Mono',monospace"}}>
                          {text.split(/(\s+)/).map((word,j)=>{
                            const clean = word.toLowerCase().replace(/[^a-zà-ÿ0-9]/g,"");
                            if(clean.length<=3) return <span key={j}>{word}</span>;
                            if(common.has(clean)) return <span key={j} style={{background:"rgba(74,222,128,.2)",borderRadius:2}}>{word}</span>;
                            return <span key={j} style={{background:`rgba(${uniqueRgb},.12)`,borderRadius:2}}>{word}</span>;
                          })}
                        </div>
                        <div style={{marginTop:10,paddingTop:8,borderTop:"1px solid var(--bd)",fontSize:8,color:"var(--mu)",display:"flex",gap:12}}>
                          <span>📝 {text.split(/\s+/).length} mots</span>
                          <span style={{color:"var(--green)"}}>✦ {[...new Set(tokenize(text))].filter(w=>w.length>3&&common.has(w)).length} communs</span>
                          <span style={{color:`rgb(${uniqueRgb})`}}>◆ {[...new Set(tokenize(text))].filter(w=>w.length>3&&!common.has(w)).length} uniques</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── ONGLET COMPARE ── */}
        {tab === "compare" && (
          <div style={{flex:1,overflow:"auto",padding:16,display:"flex",flexDirection:"column",gap:16}}>
            <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:14,color:"var(--ac)",letterSpacing:1}}>📊 HISTORIQUE DES COMPARAISONS</div>
            {voteHistory.length === 0 ? (
              <div style={{textAlign:"center",color:"var(--mu)",fontSize:11,padding:40}}>
                Aucune comparaison encore.<br/>
                <span style={{fontSize:9}}>Active 2+ IAs et envoie un message → le jury notera automatiquement.</span>
              </div>
            ) : (<>
              {/* Win rate cumulé */}
              <div style={{background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:8,padding:"12px 16px"}}>
                <div style={{fontSize:10,fontWeight:700,color:"var(--tx)",marginBottom:10,fontFamily:"'Syne',sans-serif"}}>🏆 CLASSEMENT CUMULÉ — {voteHistory.length} verdicts</div>
                <div style={{display:"flex",flexDirection:"column",gap:6}}>
                  {(() => {
                    const wins = {}; const totals = {}; const counts = {};
                    IDS.forEach(id => { wins[id]=0; totals[id]=0; counts[id]=0; });
                    voteHistory.forEach(v => {
                      if(v.winner) wins[v.winner]=(wins[v.winner]||0)+1;
                      Object.entries(v.scores||{}).forEach(([id,sc])=>{ const t=typeof sc==="object"?sc.total:sc; if(t){totals[id]=(totals[id]||0)+t; counts[id]=(counts[id]||0)+1;} });
                    });
                    const sorted = IDS.filter(id=>wins[id]||counts[id]).sort((a,b)=>wins[b]-wins[a]);
                    const maxWins = Math.max(...sorted.map(id=>wins[id]),1);
                    return sorted.map((id,i)=>{
                      const m=MODEL_DEFS[id];
                      const avgScore = counts[id]>0?(totals[id]/counts[id]).toFixed(1):"-";
                      const winRate = voteHistory.length>0?Math.round(wins[id]/voteHistory.length*100):0;
                      return (
                        <div key={id} style={{display:"flex",alignItems:"center",gap:10}}>
                          <span style={{fontSize:12,width:20}}>{["🥇","🥈","🥉"][i]||"  "}</span>
                          <span style={{width:80,fontSize:10,fontWeight:700,color:m.color,fontFamily:"'Syne',sans-serif"}}>{m.icon} {m.short}</span>
                          <div style={{flex:1,height:12,background:"var(--s2)",borderRadius:6,overflow:"hidden"}}>
                            <div style={{height:"100%",width:`${(wins[id]/maxWins)*100}%`,background:m.color,borderRadius:6,transition:"width .5s",display:"flex",alignItems:"center",justifyContent:"flex-end",paddingRight:4}}>
                            </div>
                          </div>
                          <span style={{fontSize:9,color:m.color,width:50,textAlign:"right",fontWeight:700}}>{wins[id]} victoire{wins[id]!==1?"s":""}</span>
                          <span style={{fontSize:9,color:"var(--mu)",width:40,textAlign:"right"}}>{winRate}%</span>
                          <span style={{fontSize:9,color:"var(--ac)",width:50,textAlign:"right"}}>⌀ {avgScore}/10</span>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
              {/* Liste des verdicts */}
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                <div style={{fontSize:10,fontWeight:700,color:"var(--tx)",fontFamily:"'Syne',sans-serif"}}>📋 TOUS LES VERDICTS</div>
                {[...voteHistory].reverse().map((v,i)=>{
                  const wm = MODEL_DEFS[v.winner];
                  const ranking = v.ranking||[v.winner];
                  const medals = ["🥇","🥈","🥉"];
                  return (
                    <div key={i} style={{background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:6,padding:"8px 12px",display:"flex",gap:10,alignItems:"flex-start"}}>
                      <div style={{flexShrink:0,textAlign:"center"}}>
                        <div style={{fontSize:16}}>🏆</div>
                        <div style={{fontSize:7,color:"var(--mu)",marginTop:2}}>{v.ts?new Date(v.ts).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}):""}</div>
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        {v.question && <div style={{fontSize:9,color:"var(--mu)",marginBottom:4,fontStyle:"italic"}}>« {v.question}… »</div>}
                        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:4}}>
                          {ranking.slice(0,3).map((id,ri)=>{ const m=MODEL_DEFS[id]; const sc=v.scores?.[id]; const tot=typeof sc==="object"?sc?.total:sc; return (
                            <span key={id} style={{fontSize:9,background:`${m?.color||"#888"}18`,border:`1px solid ${m?.color||"#888"}35`,borderRadius:4,padding:"2px 7px",color:m?.color||"var(--tx)"}}>
                              {medals[ri]} {m?.icon} {m?.short} {tot?`· ${typeof tot==="number"?tot.toFixed(1):tot}/10`:""}
                            </span>
                          );})}
                        </div>
                        <div style={{fontSize:9,color:"var(--mu)",fontFamily:"'IBM Plex Mono',monospace"}}>{v.reason}</div>
                      </div>
                      <button onClick={()=>{setBestVote(v);setShowVoteDetail(true);setShowDiffModal(false);navigateTab("chat");}} style={{flexShrink:0,fontSize:8,padding:"3px 8px",background:"rgba(212,168,83,.1)",border:"1px solid rgba(212,168,83,.3)",borderRadius:4,color:"var(--ac)",cursor:"pointer"}}>↩ Revoir</button>
                    </div>
                  );
                })}
              </div>
              <button onClick={()=>setVoteHistory([])} style={{alignSelf:"flex-start",fontSize:9,padding:"5px 12px",background:"rgba(248,113,113,.1)",border:"1px solid rgba(248,113,113,.3)",borderRadius:5,color:"var(--red)",cursor:"pointer"}}>🗑 Effacer l'historique</button>
            </>)}
          </div>
        )}

                {tab === "config" && (
          <div className="cfg-wrap">
            <div className="sec">
              <div className="sec-title">⌨️ Raccourcis clavier</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:6,fontSize:9,fontFamily:"'IBM Plex Mono',monospace"}}>
                {[
                  ["Ctrl+Enter","Envoyer le message"],
                  ["Ctrl+1..9","Activer/désactiver l'IA n°X"],
                  ["Ctrl+K","Rechercher dans l'historique"],
                  ["Ctrl+L","Effacer toutes les conversations"],
                  ["Ctrl+M","Exporter en Markdown"],
                  ["Escape","Quitter focus / solo / RAG"],
                ].map(([k,d])=>(
                  <div key={k} style={{display:"flex",alignItems:"center",gap:8,background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:5,padding:"5px 10px"}}>
                    <code style={{background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:3,padding:"2px 6px",color:"var(--ac)",fontSize:9,whiteSpace:"nowrap"}}>{k}</code>
                    <span style={{color:"var(--mu)"}}>{d}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* ── INFO POLLINATIONS ── */}
            <div className="sec" style={{background:"rgba(116,201,140,.04)",border:"1px solid rgba(116,201,140,.2)"}}>
              <div className="sec-title" style={{color:"var(--green)"}}>🌸 IAs Pollinations — Sans clé API</div>
              <div style={{fontSize:9,color:"var(--mu)",lineHeight:1.7,fontFamily:"'IBM Plex Mono',monospace"}}>
                {/* Tier 1 : GPT-4o legacy */}
                <div style={{marginBottom:8,padding:"6px 10px",background:"rgba(74,222,128,.06)",border:"1px solid rgba(74,222,128,.2)",borderRadius:5}}>
                  <strong style={{color:"var(--green)"}}>◈ GPT-4o</strong> — <code>text.pollinations.ai/openai</code> · <span style={{color:"var(--green)"}}>100% gratuit, sans clé</span>, 1 req/16s
                </div>
                {/* Tier 2 : gen.pollinations.ai avec clé Pollen */}
                <div style={{marginBottom:8,padding:"6px 10px",background:"rgba(212,168,83,.06)",border:"1px solid rgba(212,168,83,.25)",borderRadius:5}}>
                  <strong style={{color:"var(--ac)"}}>✦ Claude &nbsp;⬡ DeepSeek</strong> — <code>gen.pollinations.ai/v1</code><br/>
                  <span style={{color:"var(--ac)"}}>→ Clé Pollen requise (gratuite Seed tier)</span> :<br/>
                  <span style={{color:"var(--mu)"}}>1. Va sur <strong style={{color:"var(--tx)"}}>enter.pollinations.ai</strong> → crée un compte (gratuit)<br/>
                  2. Récupère ta clé API (Bearer token)<br/>
                  3. Colle-la dans le champ <strong style={{color:"var(--tx)"}}>Pollen API Key</strong> ci-dessous (tableau des clés)</span>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:6}}>
                  {[
                    {id:"poll_gpt",     note:"✅ Sans clé — anonymous",            tier:"free"},
                    {id:"poll_gemini",  note:"✅ Sans clé — openai-large anonymous",tier:"free"},
                    {id:"poll_claude",  note:"🔑 Clé Pollen Seed gratuite requise", tier:"paid"},
                    {id:"poll_deepseek",note:"🔑 Clé Pollen Seed gratuite requise", tier:"paid"},
                  ].map(p=>(
                    <div key={p.id} style={{background:"var(--s2)",border:"1px solid "+(p.tier==="free"?"rgba(74,222,128,.3)":"rgba(212,168,83,.3)"),borderRadius:5,padding:"6px 10px"}}>
                      <div style={{color:"var(--tx)",fontWeight:600,marginBottom:2}}>{MODEL_DEFS[p.id]?.icon} {MODEL_DEFS[p.id]?.name}</div>
                      <div style={{color:p.tier==="free"?"var(--green)":"var(--ac)",fontSize:8}}>{p.note}</div>
                      <div style={{color:"var(--mu)",fontSize:8,marginTop:2}}>Modèle : <code style={{color:"var(--ac)"}}>{MODEL_DEFS[p.id]?.model}</code></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="sec">
              
              <div className="sec-title">🤖 Modèles & Clés API</div>
              {/* ── YouTube Data API key ── */}
              <div style={{marginBottom:10,padding:"10px 14px",background:"rgba(255,0,0,.05)",border:"1px solid rgba(255,80,80,.25)",borderRadius:6,display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
                <div style={{flex:"0 0 auto"}}>
                  <div style={{fontSize:10,fontWeight:700,color:"#FF5555",marginBottom:2}}>▶ YouTube Data API v3 — Player intégré</div>
                  <div style={{fontSize:8,color:"var(--mu)",lineHeight:1.6}}>
                    Gratuit · 10 000 req/jour · <a href="https://console.cloud.google.com/apis/library/youtube.googleapis.com" target="_blank" rel="noreferrer" style={{color:"#FF5555"}}>console.cloud.google.com</a><br/>
                    <span style={{opacity:.7}}>1. Nouveau projet → Activer "YouTube Data API v3" → Identifiants → Clé API</span><br/>
                    <span style={{opacity:.7}}>Sans clé : clic vidéo = ouvre YouTube dans un nouvel onglet</span>
                  </div>
                </div>
                <div style={{display:"flex",gap:6,flex:1,minWidth:220,alignItems:"center"}}>
                  <input className="key-inp" type="password"
                    placeholder={apiKeys.youtube_data ? "••••••••" : "Coller la clé YouTube Data API v3…"}
                    value={cfgDrafts.youtube_data||""}
                    onChange={e=>setCfgDrafts(p=>({...p,youtube_data:e.target.value}))}
                    onKeyDown={e=>{if(e.key==="Enter"&&cfgDrafts.youtube_data)saveCfgKey("youtube_data");}}
                    style={{flex:1}}
                  />
                  <button className="save-btn" disabled={!cfgDrafts.youtube_data} onClick={()=>saveCfgKey("youtube_data")}>✓ Sauvegarder</button>
                  {apiKeys.youtube_data && <span style={{fontSize:8,color:"var(--green)",whiteSpace:"nowrap"}}>✓ Player actif</span>}
                </div>
              </div>

              {/* ── Pollen key banner ── */}
              <div style={{marginBottom:10,padding:"10px 14px",background:"rgba(212,168,83,.08)",border:"1px solid rgba(212,168,83,.3)",borderRadius:6,display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
                <div style={{flex:"0 0 auto"}}>
                  <div style={{fontSize:10,fontWeight:700,color:"var(--ac)",marginBottom:2}}>🌸 Clé Pollen — ✦ Claude · ⬡ DeepSeek · ◇ Gemini</div>
                  <div style={{fontSize:8,color:"var(--mu)"}}>Gratuit · <a href="https://enter.pollinations.ai" target="_blank" rel="noreferrer" style={{color:"var(--ac)"}}>enter.pollinations.ai</a> → inscription → copie ton Bearer token</div>
                </div>
                <div style={{display:"flex",gap:6,flex:1,minWidth:220,alignItems:"center"}}>
                  <input className="key-inp" type="password"
                    placeholder={apiKeys.pollen ? "••••••••" : "Coller ta clé Pollen ici…"}
                    value={cfgDrafts.pollen||""}
                    onChange={e=>setCfgDrafts(p=>({...p,pollen:e.target.value}))}
                    onKeyDown={e=>{if(e.key==="Enter"&&cfgDrafts.pollen)saveCfgKey("pollen");}}
                    style={{flex:1}}
                  />
                  <button className="save-btn" disabled={!cfgDrafts.pollen} onClick={()=>saveCfgKey("pollen")}>✓ Sauvegarder</button>
                  {apiKeys.pollen && <span style={{fontSize:8,color:"var(--green)",whiteSpace:"nowrap"}}>✓ Clé OK</span>}
                </div>
              </div>
              <div className="tbl-wrap">
                <table className="tbl">
                  <thead><tr><th>IA</th><th>Provider</th><th>Contexte</th><th>Prix</th><th>Statut</th><th>Clé API</th></tr></thead>
                  <tbody>
                    {IDS.map(id => {
                      const m = MODEL_DEFS[id]; const hasKey = !m.keyName || apiKeys[m.keyName]; const lim = isLimited(id);
                      return (
                        <tr key={id}>
                          <td><span style={{color:m.color,marginRight:4}}>{m.icon}</span><span style={{fontFamily:"'Syne',sans-serif",fontWeight:700,color:m.color,fontSize:10}}>{m.short}</span></td>
                          <td style={{color:"var(--mu)",fontSize:9}}>{m.provider}</td>
                          <td style={{fontSize:9}}>{fmt(m.maxTokens)}</td>
                          <td>{m.free?<span className="free-badge">FREE</span>:<span style={{fontSize:8,color:"var(--mu)"}}>Payant</span>}</td>
                          <td>
                            {lim?<span className="sbadge" style={{background:"rgba(248,113,113,.1)",color:"var(--red)"}}>⏳ {fmtCd(id)}</span>:
                            <span className="sbadge" style={{background:enabled[id]?"rgba(74,222,128,.1)":hasKey?"rgba(212,168,83,.08)":"rgba(85,85,104,.08)",color:enabled[id]?"var(--green)":hasKey?"var(--ac)":"var(--mu)"}}>
                              {enabled[id]?"● Actif":hasKey?"○ Prêt":"✗ Sans clé"}
                            </span>}
                          </td>
                          <td>
                            {!m.keyName?<span style={{fontSize:8,color:"var(--mu)"}}>Intégré</span>:(
                              <div className="key-row">
                                <input className="key-inp" type="password" placeholder={apiKeys[m.keyName]?"••••••••":"Coller ici…"} value={cfgDrafts[m.keyName]||""} onChange={e=>setCfgDrafts(p=>({...p,[m.keyName]:e.target.value}))} onKeyDown={e=>{if(e.key==="Enter"&&cfgDrafts[m.keyName])saveCfgKey(m.keyName);}}/>
                                <button className="save-btn" disabled={!cfgDrafts[m.keyName]} onClick={()=>saveCfgKey(m.keyName)}>✓</button>
                                {m.keyLink&&<a className="key-link" href={m.keyLink} target="_blank" rel="noreferrer">↗</a>}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="cfg-note">💡 Gratuits sans CB : <strong>Claude</strong> (intégré) · <strong>Gemini</strong> · <strong>Mistral</strong> · <strong style={{color:"var(--orange)"}}>⚡ Groq = Llama 3.3 70B</strong> gratuit (14 400 req/jour) — Llama tourne via l'infrastructure Groq</div>
            </div>

            <div className="sec">
              <div className="sec-title">💾 Fichier de Clés</div>
              <div className="file-btns">
                <button className="fbtn p" onClick={exportKeys}><span>⬇</span><div><div>Exporter les clés</div><div style={{fontSize:8,opacity:.7}}>multiia-keys.json</div></div></button>
                <button className="fbtn" onClick={()=>fileRef.current?.click()}><span>⬆</span><div><div>Importer les clés</div><div style={{fontSize:8,opacity:.7}}>Charger un .json</div></div></button>
                <input type="file" ref={fileRef} accept=".json" onChange={importKeys}/>
              </div>
              <div className="cfg-note" style={{marginTop:8}}>📁 Exporte tes clés avant chaque mise à jour. À la réouverture, importe le fichier → toutes tes clés sont restaurées instantanément.</div>
            </div>

            <div className="sec">
              <div className="sec">
                <div className="sec-title">🔍 Zoom de l'interface</div>
                <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
                  {[0.7,0.8,0.9,1.0,1.1,1.2,1.3,1.5,1.75,2.0].map(z=>(
                    <button key={z} onClick={()=>saveZoom(z)}
                      style={{padding:"5px 12px",borderRadius:5,border:`1px solid ${uiZoom===z?"var(--ac)":"var(--bd)"}`,
                        background:uiZoom===z?"rgba(212,168,83,.2)":"transparent",
                        color:uiZoom===z?"var(--ac)":"var(--mu)",cursor:"pointer",fontSize:11,fontFamily:"'IBM Plex Mono',monospace",fontWeight:uiZoom===z?700:400}}>
                      {Math.round(z*100)}%
                    </button>
                  ))}
                </div>
                <div className="cfg-note" style={{marginTop:8}}>
                  🖥️ 4K / grand écran → essaie <strong style={{color:"var(--ac)"}}>150%</strong> ou <strong style={{color:"var(--ac)"}}>175%</strong>. Laptop → 80% ou 90%. Sauvegardé automatiquement.
                </div>
              </div>

              <div className="sec-title">☁️ Backup complet (clés + notes + prompts + chaînes)</div>
              <div className="file-btns">
                <button className="fbtn p" onClick={() => {
                  const keys = JSON.parse(localStorage.getItem("multiia_keys")||"{}");
                  const prompts = JSON.parse(localStorage.getItem("multiia_prompts")||"[]");
                  const notes = JSON.parse(localStorage.getItem("multiia_notes")||"[]");
                  const channels = JSON.parse(localStorage.getItem("multiia_yt_channels")||"[]");
                  const backup = {_v:"multiia_backup_v1",_date:new Date().toISOString(),keys,prompts,notes,channels};
                  const blob = new Blob([JSON.stringify(backup,null,2)],{type:"application/json"});
                  const a = document.createElement("a"); a.href=URL.createObjectURL(blob);
                  a.download="multiia-backup-"+new Date().toISOString().slice(0,10)+".json"; a.click();
                  showToast("✅ Backup complet téléchargé !");
                }}><span>⬇</span><div><div>Télécharger backup</div><div style={{fontSize:8,opacity:.7}}>Tout en un fichier</div></div></button>
                <label className="fbtn" style={{cursor:"pointer"}}>
                  <span>⬆</span><div><div>Restaurer backup</div><div style={{fontSize:8,opacity:.7}}>Importe le .json</div></div>
                  <input type="file" accept=".json" style={{display:"none"}} onChange={async e => {
                    const f = e.target.files[0]; if (!f) return;
                    const text = await f.text();
                    try {
                      const backup = JSON.parse(text);
                      if (!backup._v||!backup._v.startsWith("multiia_backup")) { showToast("❌ Fichier invalide"); return; }
                      if (backup.keys) { localStorage.setItem("multiia_keys",JSON.stringify(backup.keys)); }
                      if (backup.prompts) localStorage.setItem("multiia_prompts",JSON.stringify(backup.prompts));
                      if (backup.notes) localStorage.setItem("multiia_notes",JSON.stringify(backup.notes));
                      if (backup.channels) localStorage.setItem("multiia_yt_channels",JSON.stringify(backup.channels));
                      showToast("✅ Tout restauré ! Recharge la page.");
                    } catch { showToast("❌ Erreur de lecture"); }
                    e.target.value="";
                  }}/>
                </label>
              </div>
              <div className="cfg-note" style={{marginTop:8}}>☁️ Ce fichier backup contient TOUT : clés API, prompts perso, notes et chaînes YouTube. Parfait pour sync entre appareils ou après mise à jour.</div>
            </div>

            {/* ── HISTORIQUE DES VERSIONS ── */}
            <div className="sec">
              <div className="sec-title">📋 Historique des versions</div>
              <div style={{display:"flex",flexDirection:"column",gap:4,maxHeight:420,overflowY:"auto",paddingRight:4}}>
                {[
                  { v:"v15 — actuelle", date:"Mar 2026", color:"#D4A853", items:[
                    "🔴 Fix Pollinations 401 : retour sur text.pollinations.ai/openai (endpoint anonyme gratuit)",
                    "🌸 4ème IA Pollinations : Gemini via Pollinations (sans clé)",
                    "🌱 Persona Débutant : explications comme à une personne âgée, étapes numérotées, max 3 étapes",
                    "🧑‍🏫 Persona Tuteur IA : apprend à utiliser les IAs, prompts, LLMs",
                    "🔌 Plugins JS : tableau de 12 plugins prêts à charger (Chart.js, Marked, Highlight, Math.js…)",
                    "🎬 Vidéos vues : badge ✓, masquer les vues, reset, bouton +Vu sur chaque carte",
                    "📋 Config : section Pollinations explicative + historique des versions",
                  ]},
                  { v:"v14", date:"Mar 2026", color:"#A78BFA", items:[
                    "🏆 Jury IA automatique : note les réponses après chaque échange, affiche la meilleure",
                    "⌨️ Raccourcis clavier : Ctrl+Enter, Ctrl+1..9, Ctrl+K, Ctrl+L, Ctrl+M, Escape",
                    "🔍 Recherche plein-texte dans l'historique (titres + contenu messages)",
                    "📝 Export Markdown + 🖨 Export PDF pour chaque colonne IA",
                    "😈 5 nouveaux Personas : Avocat du diable, Expert, Socrate, Optimiste radical, Philosophe stoïcien",
                    "📄 RAG : coller un document long, découpage auto en chunks, injection contextuelle",
                    "⛶ Mode Focus plein écran par colonne IA",
                    "🖥 Ollama local : auto-détection modèles, sélecteur, toggle chat",
                    "🔀 Onglet Workflow : éditeur chaîne de prompts séquentiels",
                    "🔌 Plugins JS : charger scripts JS par URL",
                  ]},
                  { v:"v13", date:"Fév 2026", color:"#60A5FA", items:[
                    "🌐 IAs Web : 37 IAs en 8 catégories (Chatbots, Recherche, Multi-modèles, Image, Code, Audio, Premium)",
                    "🔭 Bouton Découvrir : appel IA pour trouver 5 nouvelles IAs, sauvegardées en localStorage",
                  ]},
                  { v:"v12", date:"Fév 2026", color:"#4ADE80", items:[
                    "🗂 Nouvelle barre de navigation réorganisée (10 onglets)",
                    "🌙/☀ Thème clair/sombre",
                    "🔊 Lecture vocale TTS par réponse IA",
                    "🎙 Dictée vocale dans la zone de saisie Chat",
                    "🎭 Personas : 6 modes prêts + créer ses propres system prompts",
                    "⎘ Bouton Copier sur chaque réponse IA",
                  ]},
                  { v:"v11", date:"Jan 2026", color:"#FB923C", items:[
                    "📺 Médias : ajout chaînes YouTube personnalisées (formulaire + couleurs + localStorage)",
                    "⭐ Filtre Mes chaînes + badge PERSO + bouton ✕ pour supprimer",
                  ]},
                  { v:"v10", date:"Jan 2026", color:"#F97316", items:[
                    "◀▶ Sidebar historique rétractable",
                    "💾 Sauvegarde automatique des conversations (max 50, localStorage)",
                    "📂 Chargement/suppression de conversations depuis l'historique",
                    "◎ Mode Solo : focalise l'affichage sur une seule IA",
                    "⬇ Export conversation en .txt (collable dans d'autres IAs)",
                  ]},
                  { v:"v9", date:"Déc 2025", color:"#E07FA0", items:[
                    "▶ Onglet YouTube : 18 chaînes recommandées (FR + EN) avec filtres",
                    "🎬 Vidéos dynamiques (6 thèmes : Tendances, Tutoriels, Modèles, Local, Images, Agents)",
                    "🔗 8 raccourcis de recherche YouTube prêts à l'emploi",
                  ]},
                  { v:"v8", date:"Nov 2025", color:"#34D399", items:[
                    "📡 Actualités IA : fallback automatique Gemini → Groq → Mistral → cache statique",
                    "💬 Descriptif complet des news + accordéon Analyse/Impact",
                    "✓ Affichage du nom de l'IA source utilisée",
                  ]},
                  { v:"v7", date:"Oct 2025", color:"#FCD34D", items:[
                    "⚔ Onglet Arène : tableau comparatif 18 modèles, filtres, scores, actualités, tops/flops",
                    "🎨 Onglet Images : 13 générateurs avec jauges qualité/vitesse/facilité",
                    "⚙ Config : procédure MAJ PowerShell complète avec blocs copier-coller",
                  ]},
                  { v:"v6", date:"Sep 2025", color:"#94A3B8", items:[
                    "📱 Responsive & mobile : colonnes → onglets swipables",
                    "🌐 Onglet Web IAs : 12 IAs (ChatGPT, Claude.ai, Gemini, DeepSeek, Mistral, Copilot…)",
                    "⏳ Détection rate-limit : blocage + countdown automatique + bouton Débloquer",
                    "🔄 Débat : fallback synthèse sur l'IA disponible si Claude KO",
                  ]},
                  { v:"v5", date:"Août 2025", color:"#FF8C69", items:[
                    "🆕 3 nouvelles IAs : DeepSeek V3, Mistral Small, Groq/Llama 3.3 (gratuit 14 400/jour)",
                    "✎ Correcteur orthographique : popup diff original/corrigé avec Appliquer/Ignorer",
                  ]},
                  { v:"v4", date:"Juil 2025", color:"#F87171", items:[
                    "⚙ Onglet Config complet : tableau modèles, champs clés, liens obtenir",
                    "💾 Export/Import fichier multiia-keys.json",
                    "⚡ Mode Débat 3 phases : Tour 1, Tour 2 (réfutation), Synthèse finale",
                    "IAs ajoutées : DeepSeek, Mistral, Groq (FREE)",
                  ]},
                  { v:"v2–v3", date:"Juin 2025", color:"#A78BFA", items:[
                    "Nouvelles IAs : Kimi (Moonshot), Qwen (Alibaba), Grok (xAI)",
                    "Clés API multi-providers configurables",
                  ]},
                  { v:"v1", date:"Mai 2025", color:"#4ADE80", items:[
                    "🚀 Lancement Multi-IA Hub",
                    "Compteur de tokens avec barre de progression par IA",
                    "Onglet IAs Web : Z.ai, Kimi, Qwen, Grok",
                    "Chat parallèle multi-IA (Claude, Gemini, GPT)",
                  ]},
                ].map(entry=>(
                  <div key={entry.v} style={{background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:6,padding:"8px 12px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
                      <span style={{background:entry.color+"22",border:"1px solid "+entry.color+"44",borderRadius:4,padding:"2px 8px",fontSize:9,fontWeight:700,color:entry.color,fontFamily:"'Syne',sans-serif"}}>{entry.v}</span>
                      <span style={{fontSize:9,color:"var(--mu)"}}>{entry.date}</span>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:2}}>
                      {entry.items.map((item,i)=>(
                        <div key={i} style={{fontSize:9,color:"var(--mu)",fontFamily:"'IBM Plex Mono',monospace",paddingLeft:8,borderLeft:"2px solid "+entry.color+"33"}}>{item}</div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="sec">
              <div className="sec-title">🔄 Procédure de Mise à Jour — Copier-Coller PowerShell</div>
              <div className="cfg-note" style={{marginBottom:12}}>
                ⚠️ <strong>ÉTAPE 0 obligatoire</strong> : Exporte tes clés (bouton ci-dessus) avant de commencer.
              </div>

              <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:10,color:"var(--ac)",margin:"12px 0 6px",letterSpacing:.5}}>ÉTAPE 1 — Aller dans le dossier du projet</div>
              <PSBlock title="Navigation" comment="Remplace 'Administrateur' par ton nom d'utilisateur si différent" code={`cd C:\\Users\\Administrateur\\multiia-app`}/>

              <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:10,color:"var(--ac)",margin:"12px 0 6px",letterSpacing:.5}}>ÉTAPE 2 — Remplacer le fichier App.jsx</div>
              <div className="cfg-note" style={{marginBottom:6}}>💡 Télécharge d'abord le nouveau <strong>multi-ai-hub.jsx</strong> depuis Claude dans ton dossier Téléchargements.</div>
              <PSBlock title="Remplacement du fichier" comment="Copie le nouveau fichier jsx vers src/App.jsx" code={`copy C:\\Users\\Administrateur\\Downloads\\multi-ai-hub.jsx src\\App.jsx`}/>
              <div className="cfg-note" style={{marginBottom:6}}>Si tu as téléchargé sous un autre nom, adapte le chemin :</div>
              <PSBlock title="Vérifier quel fichier jsx est dans Téléchargements" comment="Cherche tous les fichiers jsx dans Downloads" code={`dir C:\\Users\\Administrateur\\Downloads\\*.jsx`}/>

              <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:10,color:"var(--ac)",margin:"12px 0 6px",letterSpacing:.5}}>ÉTAPE 3 — Reconstruire l'application</div>
              <PSBlock title="Build de production" comment="Reconstruit l'app optimisée pour le .bat (prend 10-30 secondes)" code={`npm run build`}/>
              <div className="cfg-note" style={{marginBottom:6}}>Tu dois voir <code>✓ built in X.XXs</code> à la fin. Si erreur → relis le message d'erreur et copie-le à Claude.</div>

              <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:10,color:"var(--ac)",margin:"12px 0 6px",letterSpacing:.5}}>ÉTAPE 4 — Mettre à jour le dossier portable (ZIP)</div>
              <div className="cfg-note" style={{marginBottom:6}}>Copie les nouveaux fichiers compilés dans ton dossier portable sur le bureau :</div>
              <PSBlock title="Mise à jour du dossier portable" comment="Copie le dossier dist/ compilé vers ton portable sur le bureau" code={`xcopy /E /Y dist\\* C:\\Users\\Administrateur\\Desktop\\MultiIA-Portable\\portable\\dist\\`}/>

              <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:10,color:"var(--ac)",margin:"12px 0 6px",letterSpacing:.5}}>ÉTAPE 5 — Tester</div>
              <PSBlock title="Lancement du serveur local pour test" comment="Lance en local pour vérifier avant de fermer l'ancienne version" code={`npm run dev`}/>
              <div className="cfg-note" style={{marginBottom:6}}>Ouvre <code>http://localhost:5173</code> dans ton navigateur. Vérifie que tout marche. Ensuite ferme avec <code>Ctrl+C</code>.</div>

              <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:10,color:"var(--ac)",margin:"12px 0 6px",letterSpacing:.5}}>ÉTAPE 6 — Réimporter tes clés</div>
              <div className="cfg-note">
                Ouvre l'app (via <code>MultiIA.bat</code> sur le bureau) → onglet <strong>Config</strong> → bouton <strong>Importer les clés</strong> → sélectionne ton <code>multiia-keys.json</code> sauvegardé à l'étape 0. ✓
              </div>

              <div style={{margin:"14px 0 6px",padding:"10px 14px",background:"rgba(74,222,128,.05)",border:"1px solid rgba(74,222,128,.2)",borderRadius:7}}>
                <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:10,color:"var(--green)",marginBottom:6}}>✦ RÉSUMÉ RAPIDE — Toutes les commandes en une fois</div>
                <PSBlock title="Copier-coller intégral (remplace le nom d'utilisateur)" comment="Exécute ces 3 commandes dans l'ordre dans PowerShell" code={`cd C:\\Users\\Administrateur\\multiia-app\ncopy C:\\Users\\Administrateur\\Downloads\\multi-ai-hub.jsx src\\App.jsx\nnpm run build\nxcopy /E /Y dist\\* C:\\Users\\Administrateur\\Desktop\\MultiIA-Portable\\portable\\dist\\`}/>
              </div>
            </div>

            <div className="sec">
              <div className="sec-title">📊 État des connexions</div>
              <div className="status-cards">
                {IDS.map(id => { const m=MODEL_DEFS[id]; const ok=!m.keyName||apiKeys[m.keyName]; const lim=isLimited(id); return(
                  <div key={id} className="sc" style={{borderColor:lim?"var(--red)":ok?m.border:"var(--bd)",background:lim?"rgba(248,113,113,.05)":ok?`${m.bg}44`:"var(--s1)"}}>
                    <div style={{display:"flex",alignItems:"center",gap:3,marginBottom:2}}>
                      <span style={{color:lim?"var(--red)":m.color}}>{m.icon}</span>
                      <span style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:9,color:lim?"var(--red)":m.color}}>{m.short}</span>
                      {m.free&&!lim&&<span className="free-badge">FREE</span>}
                    </div>
                    <div style={{fontSize:8,color:lim?"var(--red)":ok?"var(--green)":"var(--mu)"}}>{lim?`⏳ ${fmtCd(id)}`:!m.keyName?"✦ Intégré":ok?"✓ Clé OK":"✗ Manquante"}</div>
                    <div style={{fontSize:7,color:"var(--mu)",marginTop:1}}>{m.desc}</div>
                  </div>
                );})}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL CLÉ */}
      {modal && MODEL_DEFS[modal] && (() => {
        const m = MODEL_DEFS[modal];
        return (
          <div className="ov" onClick={() => setModal(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h3 style={{ color:m.color }}>{m.icon} Clé API {m.name}</h3>
              <p>Entre ta clé API {m.provider}.{m.free&&<><br/><span style={{color:"var(--green)"}}>✦ Ce service a un tier gratuit !</span></>}{m.keyLink&&<><br/><br/>Obtenir une clé : <a href={m.keyLink} target="_blank" rel="noreferrer">{m.keyLink}</a></>}</p>
              <input type="password" autoFocus placeholder={`Clé API ${m.provider}…`} value={keyDraft} onChange={e=>setKeyDraft(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&keyDraft.trim())saveKeyModal();}}/>
              <div className="mbtns"><button className="mbg" onClick={()=>setModal(null)}>Annuler</button><button className="mbs" onClick={saveKeyModal} disabled={!keyDraft.trim()}>Activer</button></div>
            </div>
          </div>
        );
      })()}

      {/* MODAL EXPORT */}
      {showExportModal && (
        <div className="ov" onClick={() => setShowExportModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 style={{ color:"var(--ac)" }}>💾 Exporter les clés</h3>
            <p>Copie ce JSON dans un fichier <strong>multiia-keys.json</strong> sur ton PC.</p>
            <textarea className="exp-json" readOnly value={exportJson} onClick={e=>e.target.select()}/>
            <div className="mbtns">
              <button className="mbg" onClick={()=>setShowExportModal(false)}>Fermer</button>
              <button className="copy-btn" onClick={()=>{navigator.clipboard.writeText(exportJson).then(()=>showToast("✓ Copié")).catch(()=>showToast("Sélectionne et copie manuellement"));setShowExportModal(false);}}>⎘ Copier</button>
            </div>
          </div>
        </div>
      )}

      {/* PERSONA CREATION MODAL */}
      {showPersonaModal && (
        <div className="yt-add-modal" onClick={e=>{if(e.target===e.currentTarget)setShowPersonaModal(false);}}>
          <div className="yt-add-modal-box" style={{maxWidth:500}}>
            <div className="yt-add-modal-title">🎭 Créer un persona</div>
            <div className="yt-add-row">
              <div className="yt-add-field" style={{flex:"none",width:60}}>
                <label className="yt-add-label">Icône</label>
                <input className="yt-add-inp" value={personaForm.icon} onChange={e=>setPersonaForm(f=>({...f,icon:e.target.value}))} style={{textAlign:"center",fontSize:16}} maxLength={2}/>
              </div>
              <div className="yt-add-field" style={{flex:2}}>
                <label className="yt-add-label">Nom *</label>
                <input className="yt-add-inp" placeholder="Ex : Expert marketing, Dev Python…" value={personaForm.name} onChange={e=>setPersonaForm(f=>({...f,name:e.target.value}))}/>
              </div>
            </div>
            <div className="yt-add-field">
              <label className="yt-add-label">System prompt *</label>
              <textarea className="yt-add-inp" rows={5} placeholder={"Tu es un expert en [DOMAINE]. Tu réponds de façon [STYLE]…"} style={{resize:"vertical",lineHeight:1.6}} value={personaForm.system} onChange={e=>setPersonaForm(f=>({...f,system:e.target.value}))}/>
              <span style={{fontSize:8,color:"var(--mu)"}}>Ce texte est envoyé en instruction système à chaque message.</span>
            </div>
            <div className="yt-add-field">
              <label className="yt-add-label">Couleur</label>
              <div className="yt-add-colors">
                {["#D4A853","#4ADE80","#60A5FA","#A78BFA","#FB923C","#E07FA0","#34D399","#F97316","#FACC15","#C084FC"].map(col=>(
                  <div key={col} className={"yt-add-color "+(personaForm.color===col?"sel":"")} style={{background:col}} onClick={()=>setPersonaForm(f=>({...f,color:col}))}/>
                ))}
              </div>
            </div>
            {personaForm.name && (
              <div style={{padding:"7px 10px",background:personaForm.color+"12",border:"1px solid "+personaForm.color+"33",borderRadius:6,display:"flex",alignItems:"center",gap:8,fontSize:10}}>
                <span style={{fontSize:15}}>{personaForm.icon}</span>
                <span style={{color:personaForm.color,fontWeight:700}}>{personaForm.name}</span>
              </div>
            )}
            <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
              <button onClick={()=>setShowPersonaModal(false)} style={{padding:"7px 14px",background:"transparent",border:"1px solid var(--bd)",borderRadius:5,color:"var(--mu)",cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace",fontSize:10}}>Annuler</button>
              <button onClick={()=>{
                if(!personaForm.name.trim()||!personaForm.system.trim()) return;
                const p={id:"cp_"+Date.now(),...personaForm,custom:true};
                savePersonas([...customPersonas,p]);
                setActivePersona(p.id);
                setShowPersonaModal(false);
                setPersonaForm({name:"",icon:"🤖",color:"#D4A853",system:""});
                showToast("✓ Persona créé");
              }} style={{padding:"7px 18px",background:"rgba(212,168,83,.15)",border:"1px solid var(--ac)",borderRadius:5,color:"var(--ac)",cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace",fontSize:10,fontWeight:700}}>＋ Créer</button>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE BOTTOM TAB BAR */}
      <div className="mobile-tabbar" style={isMobile?{display:"flex"}:{display:"none"}}>
        {MOBILE_TABS.map(([t,ico,lbl,badge])=>(
          <button key={t} className={"mobile-tab-btn "+(tab===t?"on":"")} onClick={()=>navigateTab(t)} style={{position:"relative"}}>
            <span className="ico">{ico}</span>
            <span>{lbl}</span>
            {badge && <span style={{position:"absolute",top:4,right:"calc(50% - 14px)",background:"var(--red)",borderRadius:"50%",width:8,height:8,fontSize:0}}/>}
          </button>
        ))}
      </div>

      {/* PWA INSTALL BANNER */}
      {showPwaBanner && !pwaInstalled && (
        <div className="pwa-banner">
          <div className="pwa-banner-icon">📲</div>
          <div className="pwa-banner-text">
            <div className="pwa-banner-title">Installer Multi-IA Hub</div>
            <div className="pwa-banner-sub">Accès rapide depuis ton écran d'accueil, fonctionne hors-ligne</div>
          </div>
          {pwaPrompt && <button className="pwa-install-btn" onClick={installPwa}>Installer</button>}
          <button className="pwa-dismiss-btn" onClick={dismissPwaBanner}>✕</button>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}

export default App;
