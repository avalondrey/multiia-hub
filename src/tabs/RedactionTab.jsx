import React from "react";
import { MODEL_DEFS, REDACTION_ACTIONS } from "../config/models.js";
import { callModel } from "../api/ai-service.js";
import MarkdownRenderer from "../components/MarkdownRenderer.jsx";

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

export default RedactionTab;
