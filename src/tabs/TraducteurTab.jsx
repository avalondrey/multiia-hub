import React from "react";
import { MODEL_DEFS } from "../config/models.js";
import { callModel } from "../api/ai-service.js";

export default function TraducteurTab({ enabled, apiKeys }) {
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
