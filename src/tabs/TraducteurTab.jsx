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
    const srcLang = src.replace(/^\S+\s/, "");
    const tgtLang = tgt.replace(/^\S+\s/, "");
    const prompt = `Traduis ce texte du ${srcLang} vers le ${tgtLang}. Retourne UNIQUEMENT la traduction, sans commentaires ni explications.\n\n${text}`;
    const newLoad = {}; activeIds.forEach(id => { newLoad[id] = true; }); setLoading(newLoad);
    const newRes = {}; activeIds.forEach(id => { newRes[id] = ""; }); setResults(newRes);
    await Promise.all(activeIds.map(async id => {
      try {
        const r = await callModel(id, [{role:"user", content:prompt}], apiKeys, "Tu es un traducteur expert. Tu traduis fidèlement sans ajouter de commentaires.");
        setResults(prev => ({...prev, [id]: r}));
      } catch(e) {
        setResults(prev => ({...prev, [id]: "❌ " + e.message}));
      } finally {
        setLoading(prev => ({...prev, [id]: false}));
      }
    }));
  };

  const srcLang = src.replace(/^\S+\s/, "");
  const tgtLang = tgt.replace(/^\S+\s/, "");

  return (
    <div style={{flex:1, display:"flex", overflow:"hidden", flexDirection:"column"}}>
      {/* Barre langue + bouton */}
      <div style={{padding:"8px 12px", borderBottom:"1px solid var(--bd)", display:"flex", alignItems:"center", gap:8, flexShrink:0, background:"var(--s1)", flexWrap:"wrap"}}>
        <span style={{fontSize:9, color:"var(--mu)"}}>De :</span>
        <select
          value={src} onChange={e => setSrc(e.target.value)}
          style={{background:"var(--s2)", border:"1px solid var(--bd)", borderRadius:5, color:"var(--tx)", fontFamily:"var(--font-mono)", fontSize:10, padding:"3px 6px"}}>
          {LANGS.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <span style={{fontSize:12, color:"var(--mu)"}}>→</span>
        <select
          value={tgt} onChange={e => setTgt(e.target.value)}
          style={{background:"var(--s2)", border:"1px solid var(--bd)", borderRadius:5, color:"var(--tx)", fontFamily:"var(--font-mono)", fontSize:10, padding:"3px 6px"}}>
          {LANGS.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <button
          onClick={() => { const t = src; setSrc(tgt); setTgt(t); }}
          style={{background:"none", border:"1px solid var(--bd)", borderRadius:4, color:"var(--mu)", fontSize:10, padding:"2px 8px", cursor:"pointer"}}>
          ⇄ Inverser
        </button>
        <span style={{marginLeft:"auto", fontSize:9, color:"var(--mu)"}}>{activeIds.length} IA{activeIds.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Corps principal — deux colonnes */}
      <div style={{flex:1, display:"flex", overflow:"hidden", minHeight:0}}>

        {/* Colonne gauche — saisie */}
        <div style={{width:"45%", minWidth:180, borderRight:"1px solid var(--bd)", display:"flex", flexDirection:"column", overflow:"hidden"}}>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={`Texte à traduire en ${tgtLang}…`}
            style={{flex:1, background:"transparent", border:"none", color:"var(--tx)", fontFamily:"var(--font-mono)", fontSize:13, padding:14, resize:"none", outline:"none", lineHeight:1.7}}
          />
          <div style={{padding:"8px 10px", borderTop:"1px solid var(--bd)", flexShrink:0, background:"var(--s1)"}}>
            <button
              onClick={translate}
              disabled={!text.trim() || !activeIds.length}
              style={{width:"100%", background:"var(--ac)", border:"none", borderRadius:6, color:"#09090B", fontFamily:"var(--font-display)", fontWeight:800, fontSize:11, padding:"9px 0", cursor: (!text.trim() || !activeIds.length) ? "not-allowed" : "pointer", opacity: (!text.trim() || !activeIds.length) ? 0.5 : 1}}>
              🌍 Traduire avec toutes les IAs
            </button>
          </div>
        </div>

        {/* Colonne droite — résultats */}
        <div style={{flex:1, overflow:"auto", display:"flex", flexDirection:"column"}}>
          {activeIds.length === 0 && (
            <div style={{padding:20, fontSize:11, color:"var(--mu)"}}>Active au moins une IA dans Config.</div>
          )}
          {activeIds.map(id => {
            const m = MODEL_DEFS[id];
            return (
              <div key={id} style={{padding:"12px 14px", borderBottom:"1px solid var(--bd)"}}>
                <div style={{fontSize:9, fontWeight:700, color:m.color, marginBottom:6, display:"flex", alignItems:"center", gap:6}}>
                  {m.icon} {m.name}
                  {loading[id] && <span style={{fontSize:8, color:"var(--mu)"}}>⏳ traduction…</span>}
                  {results[id] && !loading[id] && (
                    <button
                      onClick={() => navigator.clipboard.writeText(results[id])}
                      style={{marginLeft:"auto", background:"none", border:"1px solid var(--bd)", borderRadius:3, color:"var(--mu)", fontSize:9, padding:"1px 5px", cursor:"pointer"}}>
                      ⎘
                    </button>
                  )}
                </div>
                {results[id]
                  ? <div style={{fontSize:12, color:"var(--tx)", lineHeight:1.7, whiteSpace:"pre-wrap"}}>{results[id]}</div>
                  : <div style={{fontSize:10, color:"var(--bd)"}}>{loading[id] ? "…" : "—"}</div>
                }
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
