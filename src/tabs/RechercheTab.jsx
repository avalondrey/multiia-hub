import React from "react";
import { MODEL_DEFS } from "../config/models.js";
import { callModel } from "../api/ai-service.js";
import MarkdownRenderer from "../components/MarkdownRenderer.jsx";

export default function RechercheTab({ enabled, apiKeys, setChatInput, setTab }) {
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
                {loading[id] ? <span className="dots"><span>·</span><span>·</span><span>·</span></span> : (results[id] ? <MarkdownRenderer text={results[id]}/> : <span style={{color:"var(--mu)"}}>En attente…</span>)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
