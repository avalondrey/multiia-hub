import React, { useState, useRef, useEffect } from "react";

// ╔══════════════════════════════════════════════════════════════╗
// ║  SECTION CONFIG — Seule partie à modifier lors d'une MAJ    ║
// ╚══════════════════════════════════════════════════════════════╝
const APP_VERSION = "9.0";

const MODEL_DEFS = {
  claude:   { name:"Claude Sonnet 4",  short:"Claude",   provider:"Anthropic",    color:"#D4A853", bg:"#1A1208", border:"#3D2E0A", icon:"✦", apiType:"claude",  maxTokens:200000, free:true,  desc:"Intégré sans clé" },
  gpt4:     { name:"GPT-4o",           short:"GPT-4o",   provider:"OpenAI",       color:"#74C98C", bg:"#081A0E", border:"#0A3D1A", icon:"◈", apiType:"openai",  maxTokens:128000, free:false, keyName:"openai",   keyLink:"https://platform.openai.com/api-keys",                desc:"Modèle phare OpenAI" },
  gemini:   { name:"Gemini 1.5 Flash", short:"Gemini",   provider:"Google",       color:"#6BA5E0", bg:"#080E1A", border:"#0A1E3D", icon:"◇", apiType:"gemini",  maxTokens:1048576,free:true,  keyName:"gemini",   keyLink:"https://aistudio.google.com/app/apikey",              desc:"Tier gratuit généreux" },
  deepseek: { name:"DeepSeek V3",      short:"DeepSeek", provider:"DeepSeek",     color:"#A0C8FF", bg:"#081018", border:"#0A2040", icon:"⬡", apiType:"compat",  maxTokens:64000,  free:false, keyName:"deepseek", keyLink:"https://platform.deepseek.com/api_keys",              desc:"Très peu cher",      baseUrl:"https://api.deepseek.com/v1",                          model:"deepseek-chat" },
  mistral:  { name:"Mistral Small",    short:"Mistral",  provider:"Mistral AI",   color:"#FF8C69", bg:"#180E08", border:"#3D1E0A", icon:"▲", apiType:"compat",  maxTokens:32000,  free:true,  keyName:"mistral",  keyLink:"https://console.mistral.ai/",                         desc:"Tier gratuit dispo", baseUrl:"https://api.mistral.ai/v1",                            model:"mistral-small-latest" },
  groq:     { name:"Llama 3.3 (Groq)", short:"Groq",     provider:"Groq / Meta",  color:"#F97316", bg:"#180C04", border:"#3D1A00", icon:"⚡", apiType:"compat",  maxTokens:128000, free:true,  keyName:"groq_inf", keyLink:"https://console.groq.com/keys",                       desc:"GRATUIT 14 400/jour",baseUrl:"https://api.groq.com/openai/v1",                     model:"llama-3.3-70b-versatile" },
  kimi:     { name:"Kimi (Moonshot)",  short:"Kimi",     provider:"Moonshot AI",  color:"#E07FA0", bg:"#1A0812", border:"#3D0A1E", icon:"月", apiType:"compat",  maxTokens:128000, free:false, keyName:"kimi",     keyLink:"https://platform.moonshot.cn/console/api-keys",       desc:"Long contexte",      baseUrl:"https://api.moonshot.cn/v1",                           model:"moonshot-v1-8k" },
  qwen:     { name:"Qwen Plus",        short:"Qwen",     provider:"Alibaba",      color:"#E0A850", bg:"#1A1208", border:"#3D2A0A", icon:"千", apiType:"compat",  maxTokens:32768,  free:false, keyName:"qwen",     keyLink:"https://dashscope.console.aliyun.com/apiKey",         desc:"Multilingue Alibaba",baseUrl:"https://dashscope.aliyuncs.com/compatible-mode/v1",  model:"qwen-plus" },
  grok:     { name:"Grok 3",           short:"Grok",     provider:"xAI",          color:"#60C8E0", bg:"#081418", border:"#0A2830", icon:"X", apiType:"compat",  maxTokens:131072, free:false, keyName:"grok",     keyLink:"https://console.x.ai/",                               desc:"IA xAI",             baseUrl:"https://api.x.ai/v1",                                model:"grok-3-latest" },
};

const WEB_AIS = [
  { id:"zai",         name:"Z.ai",          subtitle:"z.ai",           url:"https://chat.z.ai/",                color:"#B07FE0", icon:"Ζ",  desc:"Chat IA nouvelle génération" },
  { id:"kimi_web",    name:"Kimi",          subtitle:"Moonshot AI",    url:"https://www.kimi.com/",             color:"#E07FA0", icon:"月", desc:"Long contexte par Moonshot" },
  { id:"qwen_web",    name:"Qwen Chat",     subtitle:"Alibaba",        url:"https://chat.qwen.ai/",             color:"#E0A850", icon:"千", desc:"IA multilingue Alibaba" },
  { id:"grok_web",    name:"Grok",          subtitle:"xAI",            url:"https://grok.com/",                 color:"#60C8E0", icon:"X",  desc:"IA de xAI / Elon Musk" },
  { id:"copilot",     name:"Copilot",       subtitle:"Microsoft",      url:"https://copilot.microsoft.com/",    color:"#4FC3F7", icon:"⊞",  desc:"IA Microsoft, GPT-4 gratuit" },
  { id:"hf",          name:"HuggingFace",   subtitle:"Open Source",    url:"https://huggingface.co/chat/",      color:"#FFD21E", icon:"🤗", desc:"Modèles open-source gratuits" },
  { id:"perplexity",  name:"Perplexity",    subtitle:"Perplexity AI",  url:"https://www.perplexity.ai/",        color:"#20B2AA", icon:"◎",  desc:"Recherche web augmentée" },
  { id:"mistral_web", name:"Le Chat",       subtitle:"Mistral AI",     url:"https://chat.mistral.ai/",          color:"#FF8C69", icon:"▲",  desc:"Chat officiel Mistral" },
  { id:"deepseek_web",name:"DeepSeek Chat", subtitle:"DeepSeek",       url:"https://chat.deepseek.com/",        color:"#A0C8FF", icon:"⬡",  desc:"Chat DeepSeek gratuit" },
  { id:"gemini_web",  name:"Gemini",        subtitle:"Google",         url:"https://gemini.google.com/",        color:"#6BA5E0", icon:"◇",  desc:"Gemini en version web" },
  { id:"claude_web",  name:"Claude.ai",     subtitle:"Anthropic",      url:"https://claude.ai/",                color:"#D4A853", icon:"✦",  desc:"Claude version complète" },
  { id:"chatgpt",     name:"ChatGPT",       subtitle:"OpenAI",         url:"https://chatgpt.com/",              color:"#74C98C", icon:"◈",  desc:"ChatGPT version web" },
  { id:"ernie_web",   name:"Ernie Bot",     subtitle:"Baidu",          url:"https://yiyan.baidu.com/",          color:"#C89BFF", icon:"文",  desc:"IA de Baidu, optimisée mandarin" },
  { id:"yi_web",      name:"Yi Chat",       subtitle:"01.AI",          url:"https://www.01.ai/",                color:"#7BE0C0", icon:"一",  desc:"Yi par 01.AI, bilingue fort" },
];

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
  `Tu es un expert YouTube spécialisé en IA et technologie. Liste 8 vidéos YouTube récentes et populaires sur : "${q}".
IMPORTANT : génère des URLs YouTube de RECHERCHE (format https://www.youtube.com/results?search_query=...) ou des vraies URLs de chaînes connues. Ne génère PAS de faux IDs de vidéos.
Retourne UNIQUEMENT un tableau JSON valide sans markdown :
[{"title":"...","channel":"...","duration":"X:XX ou XhXX","date":"Il y a Xj / Cette semaine / Ce mois","views":"XXXk vues","category":"Tutoriel|Actualité|Analyse|Review|Interview","summary":"...1 phrase...","url":"https://www.youtube.com/results?search_query=...","lang":"FR ou EN","important":true/false}]`;

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

  if (keys.gemini) {
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${keys.gemini}`,
        { method:"POST", headers:{"Content-Type":"application/json"},
          body: JSON.stringify({ contents:[{role:"user",parts:[{text:YT_VIDEO_PROMPT(themeQuery)}]}], generationConfig:{maxOutputTokens:2000} }) });
      const d = await r.json();
      if (d.error) throw new Error(d.error.message);
      return { items: parse(d.candidates[0].content.parts[0].text), provider:"Gemini ◇", fallback:false };
    } catch(e) { errors.push(e.message); }
  }
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
      { title:"Andrej Karpathy — Let's build GPT from scratch", channel:"Andrej Karpathy", duration:"1h56", date:"2023", views:"4.2M vues", category:"Tutoriel", summary:"Le meilleur cours pour comprendre les transformers et GPT en codant from scratch.", url:makeYTUrl("Andrej Karpathy let's build GPT from scratch"), lang:"EN", important:true },
      { title:"Comment fonctionne vraiment ChatGPT ?", channel:"Underscore_", duration:"28:14", date:"2023", views:"890k vues", category:"Analyse", summary:"Explication claire du fonctionnement des LLMs et de l'entraînement de ChatGPT en français.", url:makeYTUrl("Underscore_ ChatGPT comment fonctionne"), lang:"FR", important:true },
      { title:"3Blue1Brown — But what is a neural network?", channel:"3Blue1Brown", duration:"19:13", date:"2017", views:"14M vues", category:"Tutoriel", summary:"La meilleure introduction visuelle aux réseaux de neurones. Intemporel.", url:makeYTUrl("3blue1brown neural network introduction"), lang:"EN", important:true },
      { title:"Installer et tester Llama 3 localement avec Ollama", channel:"Matthew Berman", duration:"15:32", date:"2024", views:"420k vues", category:"Tutoriel", summary:"Guide complet pour faire tourner des LLMs open source sur son propre PC.", url:makeYTUrl("ollama llama 3 local install tutorial"), lang:"EN", important:false },
      { title:"DeepSeek R1 — l'IA qui a choqué le monde", channel:"AI Explained", duration:"22:17", date:"Janv 2025", views:"1.8M vues", category:"Analyse", summary:"Analyse complète de DeepSeek R1 et pourquoi il a provoqué une crise en Silicon Valley.", url:makeYTUrl("DeepSeek R1 analysis explained"), lang:"EN", important:true },
      { title:"FLUX.1 — Génération d'images IA gratuite et open source", channel:"Matthew Berman", duration:"18:45", date:"2024", views:"320k vues", category:"Review", summary:"Test complet de FLUX.1 vs Stable Diffusion vs Midjourney. Résultats surprenants.", url:makeYTUrl("FLUX.1 image generation tutorial vs midjourney"), lang:"EN", important:false },
      { title:"Lex Fridman × Sam Altman — L'avenir de l'IA", channel:"Lex Fridman", duration:"3h12", date:"2024", views:"5.1M vues", category:"Interview", summary:"Interview fleuve avec le CEO d'OpenAI sur GPT-5, AGI et l'avenir de l'humanité.", url:makeYTUrl("Lex Fridman Sam Altman interview 2024"), lang:"EN", important:true },
      { title:"Les agents IA : la révolution qui arrive", channel:"Underscore_", duration:"35:22", date:"2024", views:"650k vues", category:"Actualité", summary:"Les agents IA autonomes vont transformer le travail. Analyse des risques et opportunités.", url:makeYTUrl("Underscore_ agents IA autonomes 2024"), lang:"FR", important:true },
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
  claude:   { in:3.00,  out:15.00,  label:"Claude Sonnet 4" },
  gpt4:     { in:2.50,  out:10.00,  label:"GPT-4o" },
  gemini:   { in:0.075, out:0.30,   label:"Gemini 1.5 Flash" },
  deepseek: { in:0.27,  out:1.10,   label:"DeepSeek V3" },
  mistral:  { in:0.20,  out:0.60,   label:"Mistral Small" },
  groq:     { in:0.05,  out:0.08,   label:"Llama 3.3 (Groq)" },
  kimi:     { in:0.12,  out:0.12,   label:"Kimi (Moonshot)" },
  qwen:     { in:0.40,  out:1.20,   label:"Qwen Plus" },
  grok:     { in:2.00,  out:10.00,  label:"Grok 3" },
};

// ── Prompts par défaut ────────────────────────────────────────────
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

const est = (t) => Math.ceil((t||"").length / 3.8);
const convTokens = (msgs) => msgs.reduce((a,m) => a + est(m.content), 0);
const fmt = (n) => n>=1e6?(n/1e6).toFixed(1)+"M":n>=1000?(n/1000).toFixed(1)+"k":String(n);
const tColor = (p) => p<0.5?"#4ADE80":p<0.8?"#FACC15":"#F87171";

function classifyError(msg) {
  const m = (msg||"").toLowerCase();
  if (m.includes("429")||m.includes("rate limit")||m.includes("too many")) return "ratelimit";
  if (m.includes("quota")||m.includes("credit")||m.includes("billing")||m.includes("insufficient")||m.includes("exceeded")) return "credit";
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
  const r = await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","x-api-key":"","anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:2000,system,messages:apiMessages})});
  const d = await r.json();
  if(d.error) throw new Error(d.error.message);
  return d.content[0].text;
}
async function callGemini(messages, apiKey, system="Tu es un assistant IA utile et concis.") {
  const last=messages[messages.length-1].content;
  const history=messages.slice(0,-1).map(m=>({role:m.role==="assistant"?"model":"user",parts:[{text:m.content}]}));
  const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({systemInstruction:{parts:[{text:system}]},contents:[...history,{role:"user",parts:[{text:last}]}],generationConfig:{maxOutputTokens:1500}})});
  const d=await r.json();
  if(d.error) throw new Error(d.error.message||JSON.stringify(d.error));
  return d.candidates[0].content.parts[0].text;
}
async function callCompat(messages, apiKey, baseUrl, model, system="Tu es un assistant IA utile et concis.") {
  const r=await fetch(`${baseUrl}/chat/completions`,{method:"POST",headers:{"Content-Type":"application/json","Authorization":`Bearer ${apiKey}`},body:JSON.stringify({model,max_tokens:1500,messages:[{role:"system",content:system},...messages.map(m=>({role:m.role,content:m.content}))]})});
  const d=await r.json();
  if(d.error) throw new Error(typeof d.error==="string"?d.error:(d.error.message||JSON.stringify(d.error)));
  return d.choices[0].message.content;
}
async function callModel(id, messages, keys, system, attachedFile=null) {
  const m=MODEL_DEFS[id];
  if(m.apiType==="claude") return callClaude(messages,system,attachedFile);
  // Pour les autres IAs : injecter le contenu du fichier dans le texte si pas image
  const msgWithFile = attachedFile && attachedFile.type !== "image"
    ? messages.map((msg,i) => i===messages.length-1 ? {...msg, content:`📎 Fichier: ${attachedFile.name}\n\n${attachedFile.content}\n\n---\n${msg.content}`} : msg)
    : messages;
  if(m.apiType==="gemini") return callGemini(msgWithFile,keys.gemini,system);
  if(m.apiType==="openai") return callCompat(msgWithFile,keys.openai,"https://api.openai.com/v1","gpt-4o",system);
  if(m.apiType==="compat") return callCompat(msgWithFile,keys[m.keyName],m.baseUrl,m.model,system);
}
async function correctGrammar(text) {
  return callClaude([{role:"user",content:`Corrige les fautes d'orthographe, grammaire et ponctuation. Retourne UNIQUEMENT le texte corrigé, sans commentaires.\n\n${text}`}],"Tu es un correcteur expert. Tu corriges sans changer le sens.");
}

// ── Personas par défaut ───────────────────────────────────────────
const DEFAULT_PERSONAS = [
  { id:"default", name:"Assistant général", icon:"🤖", color:"#D4A853", system:"Tu es un assistant IA utile, précis et concis. Tu réponds en français sauf si l'utilisateur écrit dans une autre langue." },
  { id:"dev",     name:"Développeur senior", icon:"💻", color:"#4ADE80", system:"Tu es un développeur senior full-stack avec 15 ans d'expérience. Tu fournis du code propre, documenté et optimisé. Tu expliques toujours tes choix techniques et signales les erreurs potentielles." },
  { id:"writer",  name:"Rédacteur professionnel", icon:"✍️", color:"#60A5FA", system:"Tu es un rédacteur professionnel expert en copywriting et communication. Tu écris des textes clairs, convaincants et adaptés au public cible. Tu maîtrises parfaitement le français." },
  { id:"analyst", name:"Analyste business", icon:"📊", color:"#A78BFA", system:"Tu es un consultant business senior avec expertise en stratégie, marketing et finance. Tu analyses les situations avec rigueur et fournis des insights actionnables basés sur des données." },
  { id:"teacher", name:"Pédagogue expert", icon:"🎓", color:"#FB923C", system:"Tu es un pédagogue passionné qui explique les concepts complexes simplement. Tu utilises des analogies, des exemples concrets et tu vérifies la compréhension. Tu adaptes ton niveau à l'interlocuteur." },
  { id:"creative",name:"Créatif / Storyteller", icon:"🎨", color:"#E07FA0", system:"Tu es un directeur créatif avec une imagination débordante. Tu génères des idées originales, des histoires captivantes et du contenu créatif. Tu penses hors des sentiers battus." },
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
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,400;0,600;1,400&family=Syne:wght@400;600;700;800&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--bg:#09090B;--s1:#0F0F13;--s2:#16161C;--bd:#222228;--tx:#DDDDE8;--mu:#555568;--ac:#D4A853;--green:#4ADE80;--red:#F87171;--orange:#FB923C;--blue:#60A5FA;--r:7px}
html{font-size:16px}
body{background:var(--bg);color:var(--tx);font-family:'IBM Plex Mono',monospace;overflow:hidden}
.app{display:flex;flex-direction:column;height:100vh;height:100dvh;overflow:hidden}
.nav{padding:clamp(5px,1.2vw,9px) clamp(8px,2vw,14px);border-bottom:1px solid var(--bd);display:flex;align-items:center;gap:clamp(5px,1.2vw,9px);background:linear-gradient(180deg,#0D0D11,var(--bg));flex-shrink:0;flex-wrap:wrap;min-height:42px}
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
.cols{display:flex;flex:1;overflow:hidden}
.col{flex:1;display:flex;flex-direction:column;border-right:1px solid var(--bd);overflow:hidden;min-width:0;transition:opacity .3s,filter .3s}
.col:last-child{border-right:none}
.col.off{opacity:.10;filter:grayscale(1);pointer-events:none}
.col.solo-dim{opacity:.10;filter:grayscale(1);pointer-events:none}
.col.solo-focus{flex:2.5}
/* ── HISTORY SIDEBAR ── */
.hist-sidebar{width:220px;flex-shrink:0;border-right:1px solid var(--bd);display:flex;flex-direction:column;background:var(--bg);overflow:hidden;transition:width .2s}
.hist-sidebar.closed{width:0;border-right:none}
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
.hist-item-del:hover{color:var(--red)}
.hist-toggle{background:var(--s1);border:none;border-right:1px solid var(--bd);color:var(--mu);cursor:pointer;font-size:11px;padding:0 5px;writing-mode:vertical-lr;letter-spacing:1px;transition:background .15s;flex-shrink:0;display:flex;align-items:center;justify-content:center;min-height:40px}
.hist-toggle:hover{background:var(--s2);color:var(--tx)}
.chat-area{flex:1;display:flex;flex-direction:column;overflow:hidden}
.ch{padding:clamp(5px,1vw,7px) clamp(7px,1.5vw,11px);border-bottom:1px solid;display:flex;align-items:center;gap:5px;flex-shrink:0}
.ch-actions{display:flex;gap:3px;margin-left:auto;flex-shrink:0;align-items:center}
.ch-btn{background:none;border:1px solid transparent;border-radius:3px;color:var(--mu);cursor:pointer;font-size:10px;padding:2px 4px;transition:all .15s;line-height:1;font-family:'IBM Plex Mono',monospace}
.ch-btn:hover{border-color:var(--bd);color:var(--tx);background:rgba(255,255,255,.05)}
.ch-btn.solo-on{border-color:var(--ac);color:var(--ac);background:rgba(212,168,83,.12)}
.ci{font-size:clamp(10px,1.8vw,13px)}
.cn{font-family:'Syne',sans-serif;font-weight:700;font-size:clamp(8px,1.5vw,10px);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.csub{font-size:7px;color:var(--mu)}
.cm{margin-left:auto;display:flex;align-items:center;gap:4px;flex-shrink:0;margin-right:4px}
.mbw{width:clamp(20px,3.5vw,32px);height:3px;background:var(--bd);border-radius:2px;overflow:hidden}
.mbf{height:100%;border-radius:2px;transition:width .4s}
.mt{font-size:7px;color:var(--mu);white-space:nowrap}
.dot{width:5px;height:5px;border-radius:50%;background:var(--mu);flex-shrink:0}
.dot.live{background:var(--green);box-shadow:0 0 6px var(--green);animation:pulse 1.5s infinite}
.dot.limited{background:var(--red)}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.25}}
.countdown{font-size:8px;color:var(--red);white-space:nowrap;font-family:'IBM Plex Mono',monospace;background:rgba(248,113,113,.1);border:1px solid rgba(248,113,113,.3);border-radius:3px;padding:1px 5px}
.msgs{flex:1;overflow-y:auto;padding:clamp(5px,1.2vw,9px);display:flex;flex-direction:column;gap:5px;scrollbar-width:thin;scrollbar-color:var(--bd) transparent}
.msg{padding:clamp(5px,1vw,8px) clamp(7px,1.5vw,10px);border-radius:5px;font-size:clamp(9px,1.6vw,12px);line-height:1.68;border:1px solid var(--bd)}
.msg.u{background:#15151B;color:var(--mu);font-style:italic}
.msg.u::before{content:'> ';color:var(--ac)}
.msg.a{background:var(--s1);color:var(--tx);white-space:pre-wrap}
.msg.e{color:var(--red);background:#180808;border-color:#350A0A}
.msg.ld{color:var(--mu);background:var(--s1)}
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
  .cols{flex-direction:column;overflow:hidden}
  .col{flex:none;height:100%}.col.mobile-hidden{display:none}
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
.pgc-body{font-size:clamp(9px,1.6vw,11px);line-height:1.68;color:var(--tx);white-space:pre-wrap}
.pgc-body.mu{color:var(--mu);font-style:italic}
.syn-block{margin:clamp(7px,1.5vw,12px);border:1px solid var(--ac);border-radius:9px;overflow:hidden;flex-shrink:0}
.syn-hdr{padding:9px clamp(10px,2vw,14px);background:linear-gradient(90deg,#1A1208,#0F0F13);display:flex;align-items:center;gap:7px;border-bottom:1px solid var(--ac)}
.syn-title{font-family:'Syne',sans-serif;font-size:clamp(10px,1.8vw,13px);font-weight:800;color:var(--ac)}
.syn-by{font-size:9px;color:var(--mu);margin-left:auto}
.syn-body{padding:clamp(9px,1.8vw,13px);font-size:clamp(10px,1.7vw,12px);line-height:1.72;white-space:pre-wrap;color:var(--tx);background:var(--s1)}
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
.filter-btn{padding:4px 10px;border-radius:4px;font-size:9px;font-family:'IBM Plex Mono',monospace;cursor:pointer;border:1px solid var(--bd);background:transparent;color:var(--mu);transition:all .2s}
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
.yt-vgrid{display:flex;flex-direction:column;gap:7px;margin-bottom:16px}
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
.red-result-body{padding:12px;font-size:clamp(10px,1.6vw,12px);line-height:1.7;color:var(--tx);white-space:pre-wrap;word-break:break-word}
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
.srch-card-body{padding:12px;font-size:clamp(10px,1.6vw,12px);line-height:1.75;color:var(--tx);white-space:pre-wrap;word-break:break-word;max-height:300px;overflow-y:auto}
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
.wf-out-body{padding:12px;font-size:clamp(10px,1.6vw,12px);line-height:1.7;white-space:pre-wrap;word-break:break-word;max-height:250px;overflow-y:auto}
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
.agent-final-content{font-size:12px;color:var(--tx);line-height:1.7;white-space:pre-wrap}
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
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`,
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
  if (keys.gemini)   { try { return { items:await tryGemini(themeQuery,keys.gemini),   provider:"Gemini ◇",      fallback:false }; } catch(e) { errors.push(e.message); } }
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
  const [objective, setObjective] = React.useState("");
  const [steps, setSteps] = React.useState([]);
  const [running, setRunning] = React.useState(false);
  const [currentStep, setCurrentStep] = React.useState(-1);
  const [finalResult, setFinalResult] = React.useState("");
  const [agentIA, setAgentIA] = React.useState("claude");
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
            <div className="agent-final-content">{finalResult}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function YouTubeTab() {
  const [chCatFilter, setChCatFilter] = useState("Tout");
  const [vidTheme, setVidTheme] = useState("trending");
  const [vidItems, setVidItems] = useState([]);
  const [vidLoading, setVidLoading] = useState(false);
  const [vidError, setVidError] = useState(null);
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
  });

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
            const isPlaying = playingVid === vidId && vidId;
            const isHovered = hoverVid === vidId && vidId;
            return (
              <div key={i} className={`yt-vcard ${v.important?"important":""}`}
                style={{cursor:"pointer",display:"flex",flexDirection:"column",borderRadius:8,background:"var(--s1)",border:"1px solid var(--bd)",overflow:"hidden",position:"relative"}}
                onMouseEnter={() => handleVidMouseEnter(vidId)}
                onMouseLeave={handleVidMouseLeave}>

                {/* Thumbnail zone — clic direct pour lire */}
                <div style={{position:"relative",width:"100%",paddingTop:"56.25%",background:"#0a0a0a",flexShrink:0,cursor:"pointer"}}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); if(vidId) setPlayingVid(isPlaying?null:vidId); }}>
                  {/* Thumbnail image */}
                  {vidId && (
                    <img
                      src={`https://img.youtube.com/vi/${vidId}/mqdefault.jpg`}
                      alt={v.title}
                      style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",
                        opacity: isPlaying ? 0 : 1, transition:"opacity .3s"}}
                    />
                  )}
                  {!vidId && (
                    <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",background:"#111"}}>
                      <span style={{fontSize:28}}>▶</span>
                    </div>
                  )}

                  {/* Lecteur iframe inline au survol prolongé ou au clic */}
                  {vidId && (isPlaying || isHovered) && (
                    <iframe
                      style={{position:"absolute",inset:0,width:"100%",height:"100%",border:"none"}}
                      src={`https://www.youtube.com/embed/${vidId}?autoplay=1&mute=${isHovered&&!isPlaying?1:0}&rel=0`}
                      allow="autoplay; encrypted-media"
                      allowFullScreen
                    />
                  )}

                  {/* Overlay play button */}
                  {!isPlaying && !isHovered && (
                    <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",
                      background:"rgba(0,0,0,.35)",opacity:0,transition:"opacity .2s"}}
                      className="yt-play-overlay">
                      <span style={{fontSize:32,filter:"drop-shadow(0 2px 8px rgba(0,0,0,.9))"}}>▶️</span>
                    </div>
                  )}

                  {/* Bouton plein écran */}
                  {vidId && (
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPlayingVid(isPlaying?null:vidId); }}
                      style={{position:"absolute",bottom:5,right:5,background:"rgba(0,0,0,.75)",border:"none",
                        borderRadius:4,color:"#fff",fontSize:9,padding:"2px 6px",cursor:"pointer",zIndex:30}}>
                      {isPlaying ? "✕ Fermer" : "▶ Lire"}
                    </button>
                  )}
                  {v.duration && <span style={{position:"absolute",bottom:5,left:5,fontSize:7,background:"rgba(0,0,0,.8)",color:"#fff",padding:"1px 3px",borderRadius:2,zIndex:5}}>{v.duration}</span>}
                </div>

                {/* Infos vidéo */}
                <a href={v.url || "https://www.youtube.com/results?search_query="+encodeURIComponent(v.title+" "+v.channel)}
                  target="_blank" rel="noreferrer" className="yt-vbody" style={{textDecoration:"none",padding:"8px 10px",flex:1,display:"flex",flexDirection:"column",gap:4}}>
                  <div className="yt-vtitle">{v.important && <span className="yt-vstar">★ </span>}{v.title}</div>
                  <div className="yt-vmeta" style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center"}}>
                    <span className="yt-vch">{v.channel}</span>
                    {v.views && <span className="yt-vviews">· {v.views}</span>}
                    {v.date && <span className="yt-vdate">· {v.date}</span>}
                    {v.lang && <span className="yt-vlang">{v.lang==="FR"?"🇫🇷":"🇺🇸"}</span>}
                    {v.category && <span className="yt-vcat" style={{background:vcatColor(v.category)+"18",color:vcatColor(v.category)}}>{v.category}</span>}
                  </div>
                  {v.summary && <div className="yt-vdesc">{v.summary}</div>}
                  {v.lang==="EN" && <div style={{fontSize:8,color:"var(--mu)",fontStyle:"italic"}}>💬 Sous-titres FR disponibles sur YouTube</div>}
                </a>
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
                    {isLoad ? <span className="dots"><span>·</span><span>·</span><span>·</span></span> : (res || <span style={{color:"var(--mu)"}}>En attente…</span>)}
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
                    onClick={()=>{setChatInput(query);setTab("chat");}}>↗ Chat</button>
                )}
              </div>
              <div className="srch-card-body">
                {loading[id] ? <span className="dots"><span>·</span><span>·</span><span>·</span></span> : (results[id] || <span style={{color:"var(--mu)"}}>En attente…</span>)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── WORKFLOWS TAB ─────────────────────────────────────────────────
function WorkflowsTab({ enabled, apiKeys }) {
  const activeIds = Object.keys(MODEL_DEFS).filter(id => enabled[id]);
  const firstIA = activeIds[0]||"claude";
  const [steps, setSteps] = React.useState([
    { id:1, label:"Génération d'idées", ia:firstIA, prompt:"Génère 5 idées créatives pour : {INPUT}", useInput:true },
    { id:2, label:"Développement", ia:activeIds[1]||firstIA, prompt:"Développe la meilleure idée :\n\n{PREVIOUS}", useInput:false },
    { id:3, label:"Synthèse finale", ia:activeIds[2]||firstIA, prompt:"Rédige un résumé exécutif basé sur :\n\n{PREVIOUS}", useInput:false },
  ]);
  const [wfInput, setWfInput] = React.useState("");
  const [outputs, setOutputs] = React.useState({});
  const [runningStep, setRunningStep] = React.useState(null);
  const [doneSteps, setDoneSteps] = React.useState(new Set());
  const [isRunning, setIsRunning] = React.useState(false);

  const TEMPLATES = [
    { name:"Article blog", steps:[
      {id:1,label:"Plan",ia:firstIA,prompt:"Plan en 5 parties pour un article sur : {INPUT}",useInput:true},
      {id:2,label:"Rédaction",ia:activeIds[1]||firstIA,prompt:"Rédige l'article complet basé sur :\n{PREVIOUS}",useInput:false},
      {id:3,label:"Révision",ia:activeIds[2]||firstIA,prompt:"Corrige et améliore cet article :\n{PREVIOUS}",useInput:false},
    ]},
    { name:"Analyse marché", steps:[
      {id:1,label:"Infos clés",ia:firstIA,prompt:"Infos clés sur ce marché : {INPUT}",useInput:true},
      {id:2,label:"SWOT",ia:activeIds[1]||firstIA,prompt:"Analyse SWOT basée sur :\n{PREVIOUS}",useInput:false},
      {id:3,label:"Recommandations",ia:activeIds[2]||firstIA,prompt:"5 recommandations stratégiques basées sur :\n{PREVIOUS}",useInput:false},
    ]},
    { name:"Pitch produit", steps:[
      {id:1,label:"Problème",ia:firstIA,prompt:"Décris le problème que résout : {INPUT}. Sois factuel.",useInput:true},
      {id:2,label:"Solution",ia:activeIds[1]||firstIA,prompt:"Propose une solution et un USP basés sur :\n{PREVIOUS}",useInput:false},
      {id:3,label:"Pitch",ia:activeIds[2]||firstIA,prompt:"Rédige un pitch de 30 secondes basé sur :\n{PREVIOUS}",useInput:false},
    ]},
  ];

  const runWorkflow = async () => {
    if (!wfInput.trim() || !steps.length) return;
    setIsRunning(true); setOutputs({}); setDoneSteps(new Set());
    let prev = wfInput;
    for (const step of steps) {
      setRunningStep(step.id);
      const prompt = step.prompt.replace("{INPUT}", wfInput).replace("{PREVIOUS}", prev);
      try {
        const reply = await callModel(step.ia, [{role:"user",content:prompt}], apiKeys);
        setOutputs(p => ({...p,[step.id]:{text:reply,ia:step.ia}}));
        setDoneSteps(p => new Set([...p, step.id]));
        prev = reply;
      } catch(e) {
        setOutputs(p => ({...p,[step.id]:{text:"❌ "+e.message,ia:step.ia}}));
        break;
      }
    }
    setRunningStep(null); setIsRunning(false);
  };

  const loadTemplate = (tpl) => {
    setSteps(tpl.steps.map(s=>({...s,ia:enabled[s.ia]?s.ia:firstIA})));
    setOutputs({}); setDoneSteps(new Set());
  };

  return (
    <div className="wf-wrap">
      <div className="wf-left">
        <div style={{padding:"8px 10px",borderBottom:"1px solid var(--bd)",display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
          <span style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:11,color:"var(--ac)"}}>🤖 WORKFLOW</span>
          <span style={{fontSize:8,color:"var(--mu)",flex:1}}>Chaîne d'IAs automatisée</span>
        </div>
        <div style={{padding:"8px",borderBottom:"1px solid var(--bd)",flexShrink:0}}>
          <div style={{fontSize:8,color:"var(--mu)",marginBottom:5,fontWeight:700,letterSpacing:".5px"}}>MODÈLES RAPIDES</div>
          <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
            {TEMPLATES.map((t,i)=><button key={i} className="filter-btn" style={{fontSize:8}} onClick={()=>loadTemplate(t)}>{t.name}</button>)}
          </div>
        </div>
        <div style={{padding:"8px",borderBottom:"1px solid var(--bd)",flexShrink:0}}>
          <div style={{fontSize:8,color:"var(--mu)",marginBottom:4,fontWeight:700,letterSpacing:".5px"}}>INPUT DE DÉPART</div>
          <textarea style={{width:"100%",height:70,background:"var(--bg)",border:"1px solid var(--bd)",borderRadius:5,color:"var(--tx)",fontFamily:"'IBM Plex Mono',monospace",fontSize:10,padding:"6px 8px",outline:"none",resize:"none",lineHeight:1.55}}
            placeholder="Sujet, texte ou question…" value={wfInput} onChange={e=>setWfInput(e.target.value)}/>
        </div>
        <div className="wf-steps">
          {steps.map((step,idx) => (
            <div key={step.id} className={"wf-step "+(doneSteps.has(step.id)?"done":runningStep===step.id?"running":"")}>
              <div className="wf-step-hdr">
                <div className="wf-step-num">{idx+1}</div>
                <div className="wf-step-label">{step.label}</div>
                <div className="wf-step-ia" style={{color:MODEL_DEFS[step.ia]?.color}}>{MODEL_DEFS[step.ia]?.icon} {MODEL_DEFS[step.ia]?.short}</div>
                {doneSteps.has(step.id) && <span style={{color:"var(--green)",fontSize:12}}>✓</span>}
              </div>
              <select style={{background:"var(--bg)",border:"1px solid var(--bd)",borderRadius:4,color:"var(--mu)",fontFamily:"'IBM Plex Mono',monospace",fontSize:9,padding:"3px 6px",width:"100%"}}
                value={step.ia} onChange={e=>setSteps(prev=>prev.map(s=>s.id===step.id?{...s,ia:e.target.value}:s))}>
                {activeIds.map(id=><option key={id} value={id}>{MODEL_DEFS[id].icon} {MODEL_DEFS[id].name}</option>)}
              </select>
              <textarea style={{width:"100%",height:55,background:"var(--bg)",border:"1px solid var(--bd)",borderRadius:4,color:"var(--mu)",fontFamily:"'IBM Plex Mono',monospace",fontSize:8,padding:"4px 6px",outline:"none",resize:"none",lineHeight:1.5}}
                value={step.prompt} onChange={e=>setSteps(prev=>prev.map(s=>s.id===step.id?{...s,prompt:e.target.value}:s))}/>
              <div style={{fontSize:7,color:"var(--mu)"}}>Utilise {"{INPUT}"} pour l'input initial, {"{PREVIOUS}"} pour la sortie précédente</div>
            </div>
          ))}
        </div>
        <button className="wf-run-btn" onClick={runWorkflow} disabled={isRunning||!wfInput.trim()}>
          {isRunning ? "⚙ Étape "+runningStep+"/"+steps.length+" en cours…" : "▶ Lancer le workflow"}
        </button>
      </div>
      <div className="wf-right">
        {Object.keys(outputs).length === 0 ? (
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",gap:10,color:"var(--mu)",fontSize:11,textAlign:"center",padding:20}}>
            <div style={{fontSize:36}}>🤖</div>
            <strong style={{color:"var(--tx)"}}>Workflow prêt</strong>
            <div style={{maxWidth:280}}>Configure les étapes, saisis ton input, puis lance. Chaque IA passe sa sortie à la suivante automatiquement.</div>
          </div>
        ) : (
          <div className="wf-output">
            {steps.map(step => {
              const out = outputs[step.id];
              if (!out) return null;
              const m = MODEL_DEFS[out.ia];
              return (
                <div key={step.id} className="wf-out-card" style={{borderColor:m?.color+"33"}}>
                  <div className="wf-out-hdr">
                    <div className="wf-step-num">{step.id}</div>
                    <span style={{fontSize:10,fontWeight:700,color:"var(--tx)"}}>{step.label}</span>
                    <span style={{fontSize:9,color:m?.color,marginLeft:4}}>{m?.icon} {m?.name}</span>
                    <button style={{marginLeft:"auto",background:"none",border:"1px solid var(--bd)",borderRadius:3,color:"var(--mu)",cursor:"pointer",fontSize:8,padding:"2px 5px",fontFamily:"'IBM Plex Mono',monospace"}}
                      onClick={()=>{try{navigator.clipboard.writeText(out.text);}catch{}}}>⎘</button>
                  </div>
                  <div className="wf-out-body" style={{color:out.text.startsWith("❌")?"var(--red)":"var(--tx)"}}>{out.text}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

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
export default function App() {
  const [tab, setTab] = useState(() => {
    // Shortcuts PWA — ?tab=chat, ?tab=redaction, etc.
    const params = new URLSearchParams(window.location.search);
    const t = params.get("tab");
    const VALID_TABS = ["chat","prompts","redaction","recherche","workflows","medias","arena","debate","stats","config"];
    return VALID_TABS.includes(t) ? t : "chat";
  });
  const [mobileCol, setMobileCol] = useState("claude");
  const [soloId, setSoloId] = useState(null);
  const [arenaFilter, setArenaFilter] = useState("all");
  const [imgFilter, setImgFilter] = useState("free");
  const [arenaSort, setArenaSort] = useState("score");

  const [enabled, setEnabled] = useState(() => {
    try { const s = localStorage.getItem("multiia_enabled"); return s ? JSON.parse(s) : { claude:true,gpt4:false,gemini:false,deepseek:false,mistral:false,groq:false,kimi:false,qwen:false,grok:false }; }
    catch { return { claude:true,gpt4:false,gemini:false,deepseek:false,mistral:false,groq:false,kimi:false,qwen:false,grok:false }; }
  });

  const [apiKeys, setApiKeys] = useState(() => {
    try { const s = localStorage.getItem("multiia_keys"); return s ? JSON.parse(s) : { openai:"",gemini:"",deepseek:"",mistral:"",groq_inf:"",kimi:"",qwen:"",grok:"" }; }
    catch { return { openai:"",gemini:"",deepseek:"",mistral:"",groq_inf:"",kimi:"",qwen:"",grok:"" }; }
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
    const secs = type === "credit" ? CREDIT_COOLDOWN : RATE_LIMIT_COOLDOWN;
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
  const [chatInput, setChatInput] = useState("");
  const [modal, setModal] = useState(null);
  const [keyDraft, setKeyDraft] = useState("");

  // ── Historique des conversations ──
  const [savedConvs, setSavedConvs] = useState(() => {
    try { return JSON.parse(localStorage.getItem("multiia_history") || "[]"); } catch { return []; }
  });
  const [activeHistId, setActiveHistId] = useState(null);
  const [showHist, setShowHist] = useState(true);
  const [toast, setToast] = useState(null);
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

  // ── Voix (TTS) ──
  const [ttsEnabled, setTtsEnabled] = useState(false);
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
  const startVoice = () => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) { showToast("Dictée non supportée sur ce navigateur"); return; }
    if (isListening) { recognizerRef.current?.stop(); setIsListening(false); return; }
    const rec = new SpeechRec();
    rec.lang="fr-FR"; rec.continuous=false; rec.interimResults=false;
    rec.onresult = (e) => { const t=e.results[0][0].transcript; setChatInput(prev=>prev?prev+" "+t:t); };
    rec.onend = () => setIsListening(false);
    rec.onerror = () => setIsListening(false);
    recognizerRef.current = rec;
    rec.start(); setIsListening(true);
  };

  // ── Statistiques d'usage ──
  const [usageStats, setUsageStats] = useState(() => {
    try { return JSON.parse(localStorage.getItem("multiia_stats")||"{}"); } catch { return {}; }
  });
  const trackUsage = (id, tokens) => {
    setUsageStats(prev => {
      const n = {
        ...prev,
        convs: (prev.convs||0),
        msgs: {...(prev.msgs||{}), [id]:((prev.msgs||{})[id]||0)+1},
        tokens: {...(prev.tokens||{}), [id]:((prev.tokens||{})[id]||0)+(tokens||0)},
      };
      try{localStorage.setItem("multiia_stats",JSON.stringify(n));}catch{}
      return n;
    });
  };
  const resetStats = () => {
    const empty = {convs:0,msgs:{},tokens:{}};
    setUsageStats(empty);
    try{localStorage.setItem("multiia_stats",JSON.stringify(empty));}catch{}
    showToast("✓ Statistiques réinitialisées");
  };

  // ── Injection prompt depuis Bibliothèque ──
  const injectPrompt = (text) => { setChatInput(text); setTab("chat"); showToast("✓ Prompt injecté dans le Chat"); };

  // ── Onglet médias sous-onglet ──
  const [mediaSubTab, setMediaSubTab] = useState("youtube");

  // ── Détection mobile & offline ──
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  // mobileCol unified into mobileCol
  
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize, {passive:true});
    window.addEventListener('online', () => setIsOnline(true));
    window.addEventListener('offline', () => setIsOnline(false));
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('online', () => setIsOnline(true));
      window.removeEventListener('offline', () => setIsOnline(false));
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
      const corrected = await correctGrammar(text);
      if (corrected.trim() === text) showToast("✓ Aucune faute détectée !");
      else { setGrammarResult({ original: text, corrected: corrected.trim() }); setShowGrammarPopup(true); }
    } catch(e) { showToast("✗ Erreur: " + e.message); }
    finally { setGrammarLoading(false); }
  };

  const enabledIds = IDS.filter(id => enabled[id]);
  const availableIds = enabledIds.filter(id => !isLimited(id));
  const isLoadingAny = Object.values(loading).some(Boolean);
  const totalTok = IDS.reduce((a, id) => a + convTokens(conversations[id]), 0);

  const sendChat = async () => {
    const text = chatInput.trim(); if (!text) return;
    setShowGrammarPopup(false); setGrammarResult(null); setChatInput("");
    const file = attachedFile; setAttachedFile(null);
    requestNotifPerm();
    const ids = IDS.filter(id => enabled[id] && !isLimited(id));
    const blockedIds = IDS.filter(id => enabled[id] && isLimited(id));
    const userMsg = { role:"user", content:text, file: file ? {name:file.name, icon:file.icon} : null };
    const allActive = [...ids, ...blockedIds];
    setConversations(prev => { const n={...prev}; allActive.forEach(id => { n[id] = [...prev[id], userMsg]; }); return n; });
    if (blockedIds.length) {
      setConversations(prev => { const n={...prev}; blockedIds.forEach(id => { n[id] = [...prev[id], { role:"blocked", content:`⏳ ${MODEL_DEFS[id].short} bloqué. Réessai dans ${fmtCd(id)||"..."}s` }]; }); return n; });
    }
    if (!ids.length) return;
    setLoading(prev => { const n={...prev}; ids.forEach(id => { n[id]=true; }); return n; });
    await Promise.all(ids.map(async (id) => {
      try {
        const hist = [...conversations[id], userMsg];
        const reply = await callModel(id, hist, apiKeys, currentSystem, file);
        const replyTok = Math.ceil((reply||"").length / 3.8);
        trackUsage(id, replyTok);
        if (ttsEnabled && ids.length===1) speakText(reply);
        setConversations(prev => {
          const updated = { ...prev, [id]: [...prev[id], { role:"assistant", content:reply }] };
          return updated;
        });
      } catch(e) {
        const errType = classifyError(e.message);
        if (errType==="ratelimit"||errType==="credit") markLimited(id, errType);
        setConversations(prev => ({ ...prev, [id]: [...prev[id], { role:"error", content:`❌ ${e.message}` }] }));
      } finally { setLoading(prev => ({ ...prev, [id]:false })); }
    }));
    // Auto-save après toutes les réponses
    setConversations(prev => { autoSave(prev);
      setUsageStats(p => { const n={...p,convs:(p.convs||0)}; return n; });
      return prev; });
  };

  const launchDebate = async () => {
    const question = debInput.trim(); if (!question) return;
    const ids = IDS.filter(id => enabled[id] && !isLimited(id));
    if (ids.length < 2) { showToast("Active au moins 2 IAs disponibles"); return; }
    setDebQuestion(question); setDebRound1({}); setDebRound2({}); setDebSynthesis(""); setDebSynthBy("Claude");
    setDebPhase(1); setOpenPhases({ r1:true, r2:true, syn:true });
    const total = ids.length + ids.length + 1; let done = 0;
    const tick = (lbl) => { done++; setDebProgress(Math.round(done/total*100)); setDebProgressLabel(lbl); };
    const r1 = {};
    await Promise.all(ids.map(async (id) => {
      try { r1[id] = await callModel(id, [{ role:"user", content:question }], apiKeys, "Tu es un expert. Réponds à la question de manière complète et précise."); }
      catch(e) { const t=classifyError(e.message); if(t==="ratelimit"||t==="credit") markLimited(id,t); r1[id]=`❌ ${e.message}`; }
      tick(`Tour 1 — ${MODEL_DEFS[id].short}`);
      setDebRound1(prev => ({ ...prev, [id]:r1[id] }));
    }));
    setDebPhase(2);
    const r2 = {};
    await Promise.all(ids.map(async (id) => {
      const others = ids.filter(o=>o!==id).map(o=>`**${MODEL_DEFS[o].short}**:\n${r1[o]||"(pas de réponse)"}`).join("\n\n---\n\n");
      const prompt = `Question: "${question}"\n\nRéponses des autres IAs:\n\n${others}\n\n---\n\nEn tenant compte de ces perspectives, affine ta réponse finale.`;
      try { r2[id] = await callModel(id, [{ role:"user", content:prompt }], apiKeys, "Tu analyses les réponses de tes pairs et affines ta propre réponse."); }
      catch(e) { const t=classifyError(e.message); if(t==="ratelimit"||t==="credit") markLimited(id,t); r2[id]=`❌ ${e.message}`; }
      tick(`Tour 2 — ${MODEL_DEFS[id].short}`);
      setDebRound2(prev => ({ ...prev, [id]:r2[id] }));
    }));
    setDebPhase(3);
    const allAnswers = ids.map(id=>`**${MODEL_DEFS[id].short}**:\n${r2[id]||r1[id]||"(pas de réponse)"}`).join("\n\n---\n\n");
    const synPrompt = `Question: "${question}"\n\nRéponses finales:\n\n${allAnswers}\n\n---\n\nProduis:\n1. La MEILLEURE RÉPONSE SYNTHÉTISÉE\n2. POINTS DE CONSENSUS\n3. DIVERGENCES notables`;
    const synthPriority = ["claude","gemini","mistral","groq","gpt4","deepseek","kimi","qwen","grok"];
    let synDone = false;
    for (const sid of synthPriority) {
      if (!enabled[sid] || isLimited(sid)) continue;
      try {
        const syn = await callModel(sid, [{ role:"user", content:synPrompt }], apiKeys, "Tu produis des synthèses claires et objectives.");
        setDebSynthesis(syn); setDebSynthBy(MODEL_DEFS[sid].name); synDone = true; break;
      } catch(e) { const t=classifyError(e.message); if(t==="ratelimit"||t==="credit") markLimited(sid,t); }
    }
    if (!synDone) {
      const valid = ids.filter(id => r2[id] && !r2[id].startsWith("❌"));
      if (valid.length > 0) { setDebSynthesis(`⚠️ Aucune IA dispo pour synthèse. Meilleure réponse (${MODEL_DEFS[valid[0]].short}):\n\n${r2[valid[0]]}`); setDebSynthBy(MODEL_DEFS[valid[0]].name + " (fallback)"); }
      else setDebSynthesis("❌ Aucune IA disponible pour produire une synthèse.");
    }
    tick("Synthèse générée"); setDebPhase(4);
  };

  const clearDebate = () => { setDebPhase(0); setDebInput(""); setDebRound1({}); setDebRound2({}); setDebSynthesis(""); setDebQuestion(""); setDebProgress(0); };

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
      <div className="app">

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
          <div className="logo">multi<em>IA</em> <em style={{fontSize:9,color:"#444455"}}>v{APP_VERSION}</em></div>
          <div className="nav-tabs">
            {[
              ["chat","◈ Chat"],
              ["prompts","📋 Prompts"],
              ["redaction","✍️ Rédaction"],
              ["recherche","🔎 Recherche"],
              ["workflows","🤖 Workflows"],
              ["medias","🎬 Médias"],
              ["arena","⚔ Arène"],
              ["debate","⚡ Débat"],
              ["notes","📝 Notes"],
              ["traducteur","🌍 Trad."],
              ["agent","🤖 Agent"],
              ["stats","📊 Stats"],
              ["config","⚙ Config"],
            ].map(([t,l]) => (
              <button key={t} className={`nt ${tab===t?"on":""}`} onClick={()=>setTab(t)}>{l}</button>
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
        <div className="tbar" style={isMobile?{display:"none"}:{}}>
          <span className="tbar-lbl">TOKENS</span>
          {IDS.map(id => {
            const m = MODEL_DEFS[id];
            const used = convTokens(conversations[id]);
            const pct = Math.min(used / m.maxTokens, 1);
            return (
              <div className="ti" key={id} style={{ opacity:enabled[id]?1:0.2 }}>
                <span style={{ color:m.color, fontSize:8 }}>{m.icon}</span>
                <div className="tr"><div className="tf" style={{ width:`${pct*100}%`, background:tColor(pct) }}/></div>
                <span style={{ fontSize:8 }}>{fmt(used)}/{fmt(m.maxTokens)}</span>
              </div>
            );
          })}
          <span className="tbar-total">∑ <span style={{ color:"var(--tx)" }}>{fmt(totalTok)}</span></span>
        </div>

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
              <div className="hist-list">
                {savedConvs.length === 0 ? (
                  <div className="hist-empty">
                    Aucune conversation.<br/>Envoie un message,<br/>ça se sauvegarde<br/>automatiquement. 💬
                  </div>
                ) : savedConvs.map(entry => (
                  <div key={entry.id}
                    className={`hist-item ${activeHistId === entry.id ? "active" : ""}`}
                    onClick={() => loadConv(entry)}>
                    <div className="hist-item-title">{entry.title}</div>
                    <div className="hist-item-meta">
                      <span className="hist-item-date">🕐 {entry.date}</span>
                      <div className="hist-item-ias">
                        {(entry.ias||[]).slice(0,4).map(id => (
                          <span key={id} className="hist-item-ia"
                            style={{background:MODEL_DEFS[id]?.color+"18",color:MODEL_DEFS[id]?.color}}>
                            {MODEL_DEFS[id]?.icon}
                          </span>
                        ))}
                      </div>
                    </div>
                    <button className="hist-item-del" onClick={e => deleteConv(e, entry.id)} title="Supprimer">✕</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Zone de chat principale */}
            <div className="chat-area">
          <div className="cols tab-content-mobile"
              onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}
              style={isMobile?{flexDirection:"column"}:{}}>
            {IDS.map(id => {
              const m = MODEL_DEFS[id];
              const used = convTokens(conversations[id]);
              const pct = Math.min(used / m.maxTokens, 1);
              const lim = isLimited(id);
              const isMobileHidden = enabledIds.length > 0 && mobileCol !== id;
              const isSoloDim = soloId && soloId !== id;
              const isSoloFocus = soloId === id;
              return (
                <div key={id}
                  className={`col ${!enabled[id]?"off":""} ${isSoloDim?"solo-dim":""} ${isSoloFocus?"solo-focus":""}`}
                  style={{
                    background:enabled[id]?`${m.bg}22`:"transparent",
                    display: isMobile && mobileCol !== id ? "none" : undefined,
                    flex: isMobile && mobileCol === id ? "1" : undefined,
                    width: isMobile ? "100%" : undefined,
                  }}>
                  <div className="ch" style={{ borderBottomColor:lim?"var(--red)":m.border }}>
                    <span className="ci" style={{ color:lim?"var(--red)":m.color }}>{m.icon}</span>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div className="cn" style={{ color:lim?"var(--red)":m.color }}>{m.name}</div>
                      <div className="csub">{m.provider}{m.free&&<span style={{color:"var(--green)",marginLeft:4}}>· FREE</span>}</div>
                    </div>
                    <div className="cm">
                      {lim && <span className="countdown">⏳ {fmtCd(id)}</span>}
                      <div><div className="mt">{fmt(used)}t</div><div className="mbw"><div className="mbf" style={{ width:`${pct*100}%`, background:tColor(pct) }}/></div></div>
                      <div className={`dot ${loading[id]?"live":lim?"limited":""}`}/>
                    </div>
                    {/* Boutons Solo + Export */}
                    <div className="ch-actions">
                      <button className={`ch-btn ${isSoloFocus?"solo-on":""}`}
                        title={isSoloFocus?"Quitter le mode solo (voir toutes les IAs)":"Mode solo — afficher uniquement cette IA"}
                        onClick={() => setSoloId(isSoloFocus ? null : id)}>
                        {isSoloFocus ? "⊙" : "◎"}
                      </button>
                      <button className="ch-btn"
                        title="Exporter la conversation (fichier .txt collable dans une autre IA)"
                        onClick={() => exportConv(id)}>
                        ⬇
                      </button>
                    </div>
                  </div>
                  <div className="msgs" ref={el => msgRefs.current[id] = el}>
                    {conversations[id].length === 0 && !loading[id] && <div className="empty">{enabled[id]?lim?`⏳ Bloqué — ${fmtCd(id)}`:"En attente…":"Désactivé"}</div>}
                    {conversations[id].map((msg, i) => (
                      <div key={i} className={`msg ${msg.role==="user"?"u":msg.role==="error"?"e":msg.role==="blocked"?"blocked":"a"}`} style={msg.role==="assistant"?{borderColor:m.border,position:"relative"}:{}}>
                        {msg.content}
                        {msg.role==="assistant" && (
                          <div style={{display:"flex",gap:4,marginTop:5,justifyContent:"flex-end"}}>
                            <button className="voice-btn" title="Lire à voix haute" onClick={()=>speakText(msg.content)}>🔊</button>
                            <button className="voice-btn" title="Copier" onClick={()=>{try{navigator.clipboard.writeText(msg.content);}catch{}}}>⎘</button>
                          </div>
                        )}
                      </div>
                    ))}
                    {loading[id] && <div className="msg ld"><span className="dots"><span>·</span><span>·</span><span>·</span></span></div>}
                  </div>
                </div>
              );
            })}
          </div>
          {/* File attachment preview */}
        {attachedFile && (
          <div className="attach-preview">
            <span>{attachedFile.icon} {attachedFile.name}</span>
            <span style={{fontSize:8,color:"var(--mu)"}}>{attachedFile.type==="image"?"Image":"Texte"} · {attachedFile.type!=="image"?Math.round((attachedFile.content||"").length/1000)+"k car":""}</span>
            <button onClick={()=>setAttachedFile(null)}>✕</button>
          </div>
        )}
        <div className="foot">
            <div className="ir">
              <div className="ta-wrap">
                <textarea rows={1} value={chatInput} style={isMobile?{fontSize:"16px"}:{}}
                  placeholder={availableIds.length?`Envoyer à : ${availableIds.map(id=>MODEL_DEFS[id].short).join(", ")}…`:"Toutes les IAs sont bloquées…"}
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
            <div className="fhint">Entrée = envoyer · Shift+Entrée = saut · {availableIds.length}/{enabledIds.length} IA(s) dispo{enabledIds.length>availableIds.length&&<span style={{color:"var(--red)",marginLeft:6}}>· {enabledIds.length-availableIds.length} bloquée(s)</span>}</div>
          </div>
            </div>{/* fin chat-area */}
          </div>{/* fin layout hist+chat */}
        </>}

        {/* ── WEB TAB ── */}
        {tab === "web" && (
          <div className="scroll-tab pad">
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
              {[["youtube","▶ YouTube"],["images","🎨 Images IA"]].map(([k,l])=>(
                <button key={k} className={"media-stab "+(mediaSubTab===k?"on":"")} onClick={()=>setMediaSubTab(k)}>{l}</button>
              ))}
            </div>
            <div className="media-content">
              {mediaSubTab==="youtube" && <YouTubeTab />}
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
        {tab === "workflows" && (
          <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
            <WorkflowsTab enabled={enabled} apiKeys={apiKeys}/>
          </div>
        )}

        {/* ── NOTES TAB ── */}
        {tab === "notes" && (
          <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
            <NotesTab onCopyToChat={(text) => { setTab("chat"); setTimeout(()=>setChatInput(text),100); }}/>
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
          <div className="debate-wrap">
            {debPhase === 0 && (
              <div className="debate-intro">
                <div style={{ fontSize:28 }}>⚡</div>
                <div className="debate-title">Mode Débat</div>
                <div className="debate-desc">
                  Les IAs répondent indépendamment, confrontent leurs points de vue, puis une synthèse finale est produite par la <strong>première IA disponible</strong> (fallback automatique si Claude est KO).<br/><br/>
                  <em style={{ fontSize:9 }}>IAs disponibles : {availableIds.length>0?availableIds.map(id=>`${MODEL_DEFS[id].icon}${MODEL_DEFS[id].short}`).join(" · "):"aucune"}</em>
                </div>
              </div>
            )}
            {debPhase > 0 && debQuestion && (
              <div style={{ padding:"7px 14px", borderBottom:"1px solid var(--bd)", background:"var(--s1)" }}>
                <span style={{ fontSize:8, color:"var(--ac)", fontWeight:600, letterSpacing:1 }}>QUESTION </span>
                <span style={{ fontSize:10, color:"var(--tx)" }}>{debQuestion}</span>
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
                      <div className={`pgc-body ${debRound1[id]?"":"mu"}`}>{debRound1[id]||"En attente…"}</div>
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
                      <div className={`pgc-body ${debRound2[id]?"":"mu"}`}>{debRound2[id]||"En attente…"}</div>
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
                <div className={`syn-body ${debSynthesis?"":"mu"}`}>{debSynthesis||"En cours…"}</div>
              </div>
            )}
          </div>
          <div className="debate-foot">
            <div style={{ display:"flex", gap:7, alignItems:"flex-end" }}>
              <textarea rows={1} value={debInput}
                placeholder="Question à débattre…"
                onChange={e => setDebInput(e.target.value)}
                onKeyDown={e => { if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();if(debPhase===0||debPhase===4)launchDebate();} }}
                onInput={e => { e.target.style.height="auto"; e.target.style.height=Math.min(e.target.scrollHeight,100)+"px"; }}
                disabled={debPhase>0&&debPhase<4}
              />
              {(debPhase===0||debPhase===4) && <button className="launch-btn" onClick={debPhase===4?clearDebate:launchDebate} disabled={debPhase===0&&!debInput.trim()}>{debPhase===4?"↺ Nouveau":"⚡ Débattre"}</button>}
              {debPhase>0&&debPhase<4 && <button className="launch-btn" disabled>⟳ En cours…</button>}
            </div>
            <div className="fhint" style={{ marginTop:4 }}>{debPhase===0&&`${availableIds.length} IA(s) · Synthèse auto sur première IA dispo si Claude KO`}{debPhase===4&&`Terminé · Synthèse par ${debSynthBy}`}</div>
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

        {tab === "config" && (
          <div className="cfg-wrap">
            <div className="sec">
              <div className="sec-title">🤖 Modèles & Clés API</div>
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
          <button key={t} className={"mobile-tab-btn "+(tab===t?"on":"")} onClick={()=>setTab(t)} style={{position:"relative"}}>
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
