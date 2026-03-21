import React from "react";
import { DEFAULT_PROMPTS, EXTRA_PROMPTS } from "../config/models.js";
import { callClaude } from "../api/ai-service.js";

function PromptsTab({ onInject, apiKeys }) {
  const [catFilter, setCatFilter] = React.useState("Tout");
  const [customPrompts, setCustomPrompts] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem("multiia_prompts") || "[]"); } catch { return []; }
  });
  const [showAdd, setShowAdd] = React.useState(false);
  const [form, setForm] = React.useState({ title:"", cat:"Code", icon:"💡", text:"" });
  const [search, setSearch] = React.useState("");

  const saveCustom = (list) => { setCustomPrompts(list); try { localStorage.setItem("multiia_prompts", JSON.stringify(list)); } catch {} };
  const allPrompts = [...customPrompts, ...DEFAULT_PROMPTS, ...EXTRA_PROMPTS];
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
              <button className="prom-del" title="Partager ce prompt par lien" onClick={()=>{
                try{const b64=btoa(unescape(encodeURIComponent(JSON.stringify({type:"prompt",text:p.text,title:p.title}))));
                navigator.clipboard.writeText(window.location.origin+window.location.pathname+"?prompt="+encodeURIComponent(b64));
                }catch(e){navigator.clipboard.writeText(p.text);}
              }} style={{color:"var(--blue)",borderColor:"rgba(96,165,250,.3)"}}>🔗</button>
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

export default PromptsTab;
