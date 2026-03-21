import React from 'react';
import { MODEL_DEFS, VEILLE_THEMES } from "../config/models.js";
import { callModel } from "../api/ai-service.js";
import MarkdownRenderer from "../components/MarkdownRenderer.jsx";

export default function VeilleTab({ enabled, apiKeys, navigateTab, setChatInput }) {
  const [feeds, setFeeds] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem("multiia_veille_feeds")||"[]"); } catch { return []; }
  });
  const [articles, setArticles] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [newFeed, setNewFeed] = React.useState("");
  const [summary, setSummary] = React.useState("");
  const DEFAULT_TOPICS = ["IA générative 2026","LLM nouveaux modèles","OpenAI Anthropic Google","IA outils productivité","Machine learning recherche"];

  const saveFeed = (f) => { localStorage.setItem("multiia_veille_feeds", JSON.stringify(f)); };

  const fetchVeille = async () => {
    setLoading(true); setArticles([]); setSummary("");
    const activeIds = Object.keys(MODEL_DEFS).filter(id => enabled[id] && !MODEL_DEFS[id]?.serial);
    if (!activeIds.length) { setLoading(false); return; }
    const id = activeIds.find(i=>i==="groq")||activeIds[0];
    const topics = feeds.length ? feeds : DEFAULT_TOPICS;
    const prompt = "Tu es un agr\u00e9gateur de veille technologique IA. G\u00e9n\u00e8re 10 articles r\u00e9cents fictifs mais r\u00e9alistes sur ces sujets : "+topics.slice(0,5).join(", ")+". Format JSON uniquement : [{titre:...,source:Blog,date:Mars 2026,resume:2 phrases,cat:Mod\u00e8les|Outils|Recherche|Business,hot:true}]. Vari\u00e9t\u00e9 de sources et cat\u00e9gories.";
    try {
      const r = await callModel(id, [{role:"user",content:prompt}], apiKeys, "Expert veille IA. JSON uniquement.");
      const d = JSON.parse(r.replace(/```json|```/g,"").trim());
      setArticles(Array.isArray(d)?d.slice(0,10):[]);
    } catch { setArticles([]); }
    setLoading(false);
  };

  const generateSummary = async () => {
    if (!articles.length) return;
    const activeIds = Object.keys(MODEL_DEFS).filter(id => enabled[id] && !MODEL_DEFS[id]?.serial);
    const id = activeIds.find(i=>i==="mistral")||activeIds[0];
    if (!id) return;
    const digest = articles.map(a=>a.titre+": "+a.resume).join("\n");
    try {
      const r = await callModel(id, [{role:"user",content:"Génère un résumé exécutif de veille IA en 5 points clés basé sur ces articles :\n"+digest}], apiKeys, "Expert synth\u00e8se. 5 bullet points maximum.");
      setSummary(r);
    } catch {}
  };

  return (
    <div style={{flex:1,overflow:"auto",padding:"clamp(10px,2vw,16px)"}}>
      <div style={{fontFamily:"var(--font-display)",fontWeight:800,fontSize:"clamp(14px,2.5vw,18px)",color:"var(--ac)",marginBottom:14}}>📰 Veille Intelligente</div>
      {/* Thèmes rapides */}
      <div style={{marginBottom:12,background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:8,padding:"12px"}}>
        <div style={{fontSize:9,fontWeight:700,color:"var(--mu)",marginBottom:8}}>THÈMES PRÉDÉFINIS — CLIQUE POUR CHARGER</div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {VEILLE_THEMES.map(t=>(
            <button key={t.id} onClick={()=>{
              setFeeds(t.topics);
              saveFeed(t.topics);
              setTimeout(fetchVeille, 100);
            }}
            style={{padding:"5px 11px",borderRadius:14,border:"1px solid "+t.color+"44",background:t.color+"11",color:t.color,fontSize:8,cursor:"pointer",fontWeight:600,transition:"all .15s"}}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>
      {/* Topics */}
      <div style={{marginBottom:12,background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:8,padding:"12px"}}>
        <div style={{fontSize:9,fontWeight:700,color:"var(--mu)",marginBottom:8}}>SUJETS DE VEILLE</div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8}}>
          {(feeds.length?feeds:DEFAULT_TOPICS).map((f,i)=>(
            <span key={i} style={{fontSize:8,padding:"2px 8px",background:"rgba(96,165,250,.1)",border:"1px solid rgba(96,165,250,.2)",borderRadius:10,color:"var(--blue)",display:"flex",alignItems:"center",gap:4}}>
              {f}
              {feeds.includes(f)&&<button onClick={()=>{const nf=feeds.filter(x=>x!==f);setFeeds(nf);saveFeed(nf);}} style={{background:"none",border:"none",color:"var(--mu)",cursor:"pointer",fontSize:10,padding:0}}>✕</button>}
            </span>
          ))}
        </div>
        <div style={{display:"flex",gap:7}}>
          <input value={newFeed} onChange={e=>setNewFeed(e.target.value)} placeholder="Ajouter un sujet de veille…"
            onKeyDown={e=>{if(e.key==="Enter"&&newFeed.trim()){const nf=[...feeds,newFeed.trim()];setFeeds(nf);saveFeed(nf);setNewFeed("");}}}
            style={{flex:1,background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:5,color:"var(--tx)",fontSize:9,padding:"5px 9px",outline:"none"}}/>
          <button onClick={fetchVeille} disabled={loading}
            style={{padding:"5px 14px",background:"rgba(212,168,83,.15)",border:"1px solid rgba(212,168,83,.4)",borderRadius:5,color:"var(--ac)",fontSize:9,cursor:"pointer",fontWeight:700,whiteSpace:"nowrap"}}>
            {loading?"⟳ Chargement…":"🔄 Actualiser"}
          </button>
        </div>
      </div>
      {/* Articles */}
      {articles.length>0&&(
        <>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
            <span style={{fontSize:9,color:"var(--mu)"}}>{articles.length} articles</span>
            <button onClick={generateSummary} style={{fontSize:8,padding:"3px 10px",background:"rgba(167,139,250,.1)",border:"1px solid rgba(167,139,250,.3)",borderRadius:4,color:"#A78BFA",cursor:"pointer"}}>✦ Résumé exécutif</button>
          </div>
          {summary&&(
            <div style={{marginBottom:12,padding:"10px 12px",background:"var(--s1)",border:"1px solid rgba(212,168,83,.3)",borderRadius:8,fontSize:9,lineHeight:1.6}}>
              <div style={{fontSize:8,color:"var(--ac)",fontWeight:700,marginBottom:6}}>✦ RÉSUMÉ EXÉCUTIF</div>
              <MarkdownRenderer text={summary}/>
            </div>
          )}
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:10}}>
            {articles.map((a,i)=>(
              <div key={i} style={{background:"var(--s1)",border:"1px solid "+(a.hot?"rgba(212,168,83,.35)":"var(--bd)"),borderRadius:8,padding:"12px 14px"}}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
                  <span style={{fontSize:7,padding:"1px 5px",background:"rgba(96,165,250,.1)",color:"var(--blue)",borderRadius:3,fontWeight:700}}>{a.cat}</span>
                  <span style={{fontSize:7,color:"var(--mu)",marginLeft:"auto"}}>{a.source} · {a.date}</span>
                  {a.hot&&<span style={{fontSize:10}}>🔥</span>}
                </div>
                <div style={{fontSize:10,fontWeight:700,color:"var(--tx)",marginBottom:5,lineHeight:1.4}}>{a.titre}</div>
                <div style={{fontSize:9,color:"var(--mu)",lineHeight:1.5}}>{a.resume}</div>
                <button onClick={()=>{setChatInput("Parle-moi de : "+a.titre);navigateTab("chat");}} style={{marginTop:8,fontSize:7,padding:"2px 7px",background:"transparent",border:"1px solid var(--bd)",borderRadius:3,color:"var(--mu)",cursor:"pointer"}}>💬 En savoir plus</button>
              </div>
            ))}
          </div>
        </>
      )}
      {!articles.length&&!loading&&<div style={{textAlign:"center",padding:40,color:"var(--mu)",fontSize:10}}>Clique sur "Actualiser" pour charger les actualités IA du jour.</div>}
    </div>
  );
}
