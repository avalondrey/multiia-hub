// ╔══════════════════════════════════════════════════════════════╗
// ║  src/config/models.js — Données statiques (aucun JSX)        ║
// ║  Modifier un modèle IA : changer baseUrl, model, inputLimit  ║
// ╚══════════════════════════════════════════════════════════════╝

// ╔══════════════════════════════════════════════════════════════╗
// ║  SECTION CONFIG — Seule partie à modifier lors d'une MAJ    ║
// ╚══════════════════════════════════════════════════════════════╝
export const APP_VERSION = "17.2";
export const BUILD_DATE = new Date().toISOString().slice(0,10);

export const MODEL_DEFS = {
  // ── IAs 100% gratuites ────────────────────────────────────────────
  groq:       { name:"Llama 3.3 (Groq)",   short:"Groq",      provider:"Groq / Meta",   color:"#F97316", bg:"#180C04", border:"#3D1A00", icon:"⚡", apiType:"compat", maxTokens:128000, inputLimit:32000, free:true, keyName:"groq_inf",   keyLink:"https://console.groq.com/keys",             desc:"GRATUIT 14 400/jour",   baseUrl:"https://api.groq.com/openai/v1",              model:"llama-3.3-70b-versatile" },
  mistral:    { name:"Mistral Small 3",     short:"Mistral",   provider:"Mistral AI",    color:"#FF8C69", bg:"#180E08", border:"#3D1E0A", icon:"▲", apiType:"compat", maxTokens:32000,  inputLimit:28000, free:true, keyName:"mistral",    keyLink:"https://console.mistral.ai/",               desc:"Tier gratuit dispo",    baseUrl:"https://api.mistral.ai/v1",                   model:"mistral-small-latest" },
  cohere:     { name:"Command R+ (Cohere)",   short:"Cohere",    provider:"Cohere",         color:"#39D353", bg:"#081A0E", border:"#0A3D1A", icon:"⌘", apiType:"cohere",  maxTokens:128000, inputLimit:60000, free:true, keyName:"cohere",     keyLink:"https://dashboard.cohere.com/api-keys",     desc:"Gratuit — 1000 req/mois" },
  cerebras:   { name:"Llama 3.1 (Cerebras)",short:"Cerebras",  provider:"Cerebras",      color:"#A78BFA", bg:"#0E0818", border:"#201040", icon:"◉", apiType:"compat", maxTokens:8192,   inputLimit:6000, free:true, keyName:"cerebras",   keyLink:"https://cloud.cerebras.ai/",                desc:"Gratuit — 8B ultra rapide (ctx 8k)", baseUrl:"https://api.cerebras.ai/v1", model:"llama3.1-8b" },
  sambanova:  { name:"Llama 3.3 (SambaNova)", short:"Samba",     provider:"SambaNova",     color:"#34D399", bg:"#08180E", border:"#0A3D20", icon:"∞", apiType:"compat", maxTokens:32000,  inputLimit:28000, free:true, keyName:"sambanova",  keyLink:"https://cloud.sambanova.ai/",               desc:"Gratuit — Llama 3.3 70B",     baseUrl:"https://api.sambanova.ai/v1",                 model:"Meta-Llama-3.3-70B-Instruct" },
  qwen3:      { name:"Qwen3 32B (Groq)",    short:"Qwen3",   provider:"Groq / Qwen", color:"#C084FC", bg:"#120818", border:"#2E0A3D", icon:"◈", apiType:"compat", maxTokens:32768,  inputLimit:28000, free:true, keyName:"groq_inf",   keyLink:"https://console.groq.com/keys",             desc:"Gratuit — même clé Groq",    baseUrl:"https://api.groq.com/openai/v1",           model:"qwen/qwen3-32b" },
  // ── Via Pollinations.AI (SANS CLÉ) ──────────────────────────────
  llama4s:    { name:"Llama 4 Scout (Groq)",   short:"L4 Scout", provider:"Groq / Meta",    color:"#FF6B35", bg:"#180A04", border:"#3D1500", icon:"🦙", apiType:"compat", maxTokens:128000, inputLimit:32000, free:true, keyName:"groq_inf",  keyLink:"https://console.groq.com/keys",   desc:"GRATUIT — Llama 4 Scout 17B multimodal", baseUrl:"https://api.groq.com/openai/v1", model:"meta-llama/llama-4-scout-17b-16e-instruct" },
  gemma2:     { name:"Llama 3.1 8B (Groq)",     short:"L3.1-8B",  provider:"Groq / Meta",    color:"#34D399", bg:"#08180E", border:"#0A3D20", icon:"◎", apiType:"compat", maxTokens:8192,   inputLimit:6000, free:true, keyName:"groq_inf",  keyLink:"https://console.groq.com/keys",   desc:"GRATUIT — même clé Groq, très rapide (ctx 8k)", baseUrl:"https://api.groq.com/openai/v1", model:"llama-3.1-8b-instant" },
  poll_gpt:      { name:"GPT-4o (Pollinations)",    short:"GPT-4o",    provider:"OpenAI via Pollinations",   color:"#74C98C", bg:"#081A0E", border:"#0A3D1E", icon:"◈", apiType:"pollinations",      maxTokens:128000, inputLimit:12000, serial:true, free:true,  keyName:null,          keyLink:"https://text.pollinations.ai", desc:"SANS CLÉ — 1 req/16s max", model:"openai" },
  poll_claude:   { name:"Claude (Pollinations)",     short:"Claude✦",  provider:"Anthropic via Pollinations", color:"#D4A853", bg:"#1A1408", border:"#3D3000", icon:"✦", apiType:"pollinations_paid", maxTokens:128000, free:false, keyName:"pollen",      keyLink:"https://enter.pollinations.ai",  desc:"Clé Pollen gratuite · enter.pollinations.ai (Seed tier)", model:"claude-airforce" },
  poll_deepseek: { name:"DeepSeek (Pollinations)",   short:"DeepSeek", provider:"DeepSeek via Pollinations", color:"#A0C8FF", bg:"#080E1A", border:"#0A1A3D", icon:"⬡", apiType:"pollinations_paid", maxTokens:128000, free:false, keyName:"pollen",      keyLink:"https://enter.pollinations.ai",  desc:"Clé Pollen gratuite · enter.pollinations.ai (Seed tier)", model:"deepseek" },
  poll_gemini:   { name:"GPT-4o Large (Pollinations)", short:"GPT-4o L", provider:"OpenAI via Pollinations",   color:"#6BA5E0", bg:"#080E18", border:"#0A1A3D", icon:"◇", apiType:"pollinations",      maxTokens:128000, inputLimit:12000, serial:true, free:true,  keyName:null,          keyLink:"https://text.pollinations.ai",   desc:"SANS CLÉ — 1 req/16s max", model:"openai-large" },
};

// ── Liste de base des IAs Web ───────────────────────────────────
export const BASE_WEB_AIS = [
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
export function getDiscoveredAIs() {
  try { return JSON.parse(localStorage.getItem(DISCOVERED_KEY)||"[]"); } catch { return []; }
}
export function saveDiscoveredAIs(list) {
  localStorage.setItem(DISCOVERED_KEY, JSON.stringify(list));
}

// Sources de découverte automatique (flux RSS / JSON publics)
const DISCOVERY_SOURCES = [
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
export const TOKEN_PRICE = {
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
