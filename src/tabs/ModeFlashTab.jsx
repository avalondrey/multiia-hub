import React from "react";
import { MODEL_DEFS } from "../config/models.js";
import { callModel } from "../api/ai-service.js";

export default function ModeFlashTab({ enabled, apiKeys, navigateTab, setChatInput }) {
  const [prompt, setPrompt] = React.useState("");
  const [results, setResults] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [startTime, setStartTime] = React.useState(null);
  const [elapsed, setElapsed] = React.useState(0);
  const [winner, setWinner] = React.useState(null);
  const [history, setHistory] = React.useState(() => { try { return JSON.parse(localStorage.getItem("multiia_flash_history")||"[]"); } catch { return []; } });
  const timerRef = React.useRef(null);

  const activeIds = Object.keys(MODEL_DEFS).filter(id => enabled[id] && !MODEL_DEFS[id]?.serial && !MODEL_DEFS[id]?.serial);

  const FLASH_PROMPTS = [
    "Explique l'IA générative en 3 phrases",
    "Quel est le meilleur conseil pour être productif ?",
    "Nomme 5 startups IA qui vont changer le monde",
    "Quelle est la différence entre Groq et Mistral ?",
    "Écris un haïku sur l'intelligence artificielle",
    "Quel livre lire absolument sur l'IA ?",
    "Explique-moi les transformers simplement",
    "Quelle IA choisir pour écrire du code ?",
  ];

  // Timer en direct
  React.useEffect(() => {
    if (loading && startTime) {
      timerRef.current = setInterval(() => setElapsed(Date.now()-startTime), 100);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [loading, startTime]);

  const flash = async () => {
    if (!prompt.trim() || !activeIds.length) return;
    setLoading(true); setResults([]); setWinner(null);
    const t0 = Date.now(); setStartTime(t0);

    // Lancer toutes les IAs en même temps
    const promises = activeIds.map(async id => {
      const t = Date.now();
      try {
        const output = await callModel(id, [{role:"user",content:prompt}], apiKeys, "Tu es un assistant ultra-concis. Réponds directement et précisément en 2-5 phrases max.");
        return { id, output, time:Date.now()-t, ok:true };
      } catch(e) {
        return { id, output:"❌ "+e.message, time:Date.now()-t, ok:false };
      }
    });

    // Afficher les résultats au fur et à mesure
    const settled = [];
    await Promise.all(promises.map(p => p.then(r => {
      settled.push(r);
      setResults([...settled].sort((a,b)=>a.time-b.time));
    })));

    // Déterminer le plus rapide et le meilleur (le plus long = potentiellement plus complet)
    const successful = settled.filter(r=>r.ok);
    if (successful.length > 0) {
      const fastest = successful.reduce((a,b)=>a.time<b.time?a:b);
      setWinner(fastest.id);
      // Sauvegarder dans l'historique
      const entry = {
        id:Date.now().toString(),
        prompt,
        date:new Date().toLocaleString("fr-FR",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"}),
        fastest:fastest.id,
        count:successful.length,
        totalTime:Date.now()-t0,
      };
      const newHistory = [entry,...history].slice(0,15);
      setHistory(newHistory);
      try { localStorage.setItem("multiia_flash_history",JSON.stringify(newHistory)); } catch {}
    }

    setLoading(false);
    setElapsed(Date.now()-t0);
  };

  const fmtMs = ms => ms < 1000 ? ms+"ms" : (ms/1000).toFixed(1)+"s";
  const fastest = results.filter(r=>r.ok).length>0 ? results.filter(r=>r.ok).reduce((a,b)=>a.time<b.time?a:b) : null;
  const slowest = results.filter(r=>r.ok).length>0 ? results.filter(r=>r.ok).reduce((a,b)=>a.time>b.time?a:b) : null;

  return (
    <div style={{flex:1,overflow:"auto",padding:"clamp(10px,2vw,16px)"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6,flexWrap:"wrap"}}>
        <div style={{fontFamily:"var(--font-display)",fontWeight:800,fontSize:"clamp(14px,2.5vw,18px)",color:"#FCD34D"}}>⚡ Mode Flash</div>
        <div style={{fontSize:9,color:"var(--mu)"}}>— Un prompt → toutes tes IAs en même temps · Course de vitesse en temps réel</div>
      </div>
      <div style={{fontSize:9,color:"var(--mu)",marginBottom:14,padding:"8px 12px",background:"rgba(252,211,77,.06)",border:"1px solid rgba(252,211,77,.15)",borderRadius:6}}>
        Toutes tes IAs actives reçoivent le même prompt simultanément. Tu vois leurs réponses arriver en temps réel, classées par vitesse. Idéal pour les questions rapides ou comparer les styles.
      </div>

      {/* Exemples */}
      <div style={{marginBottom:10}}>
        <div style={{fontSize:8,color:"var(--mu)",fontWeight:700,marginBottom:5}}>PROMPTS FLASH</div>
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
          {FLASH_PROMPTS.map(p=>(
            <button key={p} onClick={()=>setPrompt(p)}
              style={{padding:"4px 9px",borderRadius:8,border:"1px solid var(--bd)",background:"var(--s1)",color:"var(--mu)",fontSize:8,cursor:"pointer"}}>
              {p.slice(0,36)}{p.length>36?"…":""}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div style={{display:"flex",gap:8,marginBottom:14}}>
        <input value={prompt} onChange={e=>setPrompt(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&!loading&&prompt.trim()&&flash()}
          placeholder="Tape ton prompt flash (Entrée pour lancer)…"
          style={{flex:1,background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:8,color:"var(--tx)",fontSize:11,padding:"10px 14px",outline:"none"}}/>
        <button onClick={flash} disabled={loading||!prompt.trim()||!activeIds.length}
          style={{padding:"10px 20px",background:loading?"var(--s2)":"rgba(252,211,77,.15)",border:"1px solid "+(loading?"var(--bd)":"rgba(252,211,77,.4)"),borderRadius:8,color:loading?"var(--mu)":"#FCD34D",fontSize:12,cursor:loading?"default":"pointer",fontWeight:900,fontFamily:"var(--font-mono)",minWidth:60}}>
          {loading?"…":"⚡"}
        </button>
      </div>

      {/* Timer en direct */}
      {(loading || results.length > 0) && (
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14,padding:"8px 14px",background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:8,flexWrap:"wrap"}}>
          <div style={{fontSize:24,fontWeight:900,color:"#FCD34D",fontFamily:"var(--font-mono)",minWidth:70}}>
            {fmtMs(loading ? elapsed : elapsed)}
          </div>
          <div style={{flex:1}}>
            <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
              {activeIds.map(id=>{
                const r = results.find(x=>x.id===id);
                const m = MODEL_DEFS[id];
                return <div key={id} style={{padding:"3px 8px",borderRadius:6,background:r?.ok?"rgba(74,222,128,.1)":r?"rgba(248,113,113,.1)":"var(--s2)",border:"1px solid "+(r?.ok?"rgba(74,222,128,.3)":r?"rgba(248,113,113,.3)":"var(--bd)"),fontSize:8,color:r?.ok?"var(--green)":r?"var(--red)":m.color,display:"flex",alignItems:"center",gap:4}}>
                  {r?.ok ? "✓" : r ? "✗" : <span style={{animation:"spin 1s linear infinite",display:"inline-block"}}>⟳</span>}
                  {m.short}
                  {r?.ok && <span style={{color:"var(--mu)"}}>{fmtMs(r.time)}</span>}
                </div>;
              })}
            </div>
          </div>
          <div style={{fontSize:9,color:"var(--mu)",textAlign:"right"}}>
            {results.filter(r=>r.ok).length}/{activeIds.length} IAs
          </div>
        </div>
      )}

      {/* Résultats classés */}
      {results.length > 0 && (
        <div>
          {/* Podium */}
          {!loading && results.filter(r=>r.ok).length >= 2 && (
            <div style={{display:"flex",gap:8,marginBottom:14,alignItems:"flex-end",justifyContent:"center",flexWrap:"wrap"}}>
              {results.filter(r=>r.ok).slice(0,3).map((r,i)=>{
                const m = MODEL_DEFS[r.id];
                const medals = ["🥇","🥈","🥉"];
                const heights = [80,60,50];
                return <div key={r.id} style={{textAlign:"center",minWidth:80}}>
                  <div style={{fontSize:16}}>{medals[i]}</div>
                  <div style={{height:heights[i],background:m.color+"22",border:"1px solid "+m.color+"44",borderRadius:"6px 6px 0 0",display:"flex",alignItems:"flex-end",justifyContent:"center",padding:"0 0 6px"}}>
                    <div>
                      <div style={{fontSize:16}}>{m.icon}</div>
                      <div style={{fontSize:8,color:m.color,fontWeight:700}}>{m.short}</div>
                    </div>
                  </div>
                  <div style={{background:m.color+"33",padding:"4px 8px",borderRadius:"0 0 6px 6px",fontSize:8,color:"var(--mu)",fontFamily:"var(--font-mono)"}}>{fmtMs(r.time)}</div>
                </div>;
              })}
            </div>
          )}

          {/* Réponses */}
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {results.map((r,i)=>{
              const m = MODEL_DEFS[r.id];
              const isFastest = r.id===fastest?.id && r.ok;
              const isSlowest = r.id===slowest?.id && r.ok && results.filter(x=>x.ok).length>1;
              return (
                <div key={r.id} style={{background:"var(--s1)",border:"1px solid "+(isFastest?"rgba(252,211,77,.4)":r.ok?"var(--bd)":"rgba(248,113,113,.2)"),borderRadius:10,padding:"12px 14px",position:"relative"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,flexWrap:"wrap"}}>
                    <span style={{fontSize:18}}>{["🥇","🥈","🥉","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣"][i]||"·"}</span>
                    <span style={{color:m.color,fontSize:12}}>{m.icon}</span>
                    <span style={{fontWeight:700,fontSize:10,color:m.color}}>{m.name}</span>
                    {isFastest&&<span style={{fontSize:8,padding:"2px 6px",background:"rgba(252,211,77,.2)",border:"1px solid rgba(252,211,77,.4)",borderRadius:6,color:"#FCD34D",fontWeight:700}}>⚡ Plus rapide</span>}
                    {isSlowest&&<span style={{fontSize:8,color:"var(--mu)"}}>🐢</span>}
                    <span style={{marginLeft:"auto",fontSize:9,color:"var(--mu)",fontFamily:"var(--font-mono)",fontWeight:700}}>{fmtMs(r.time)}</span>
                  </div>
                  <div style={{fontSize:10,color:r.ok?"var(--tx)":"var(--red)",lineHeight:1.7}}>{r.output}</div>
                  {r.ok && (
                    <div style={{display:"flex",gap:5,marginTop:8}}>
                      <button onClick={()=>navigator.clipboard.writeText(r.output)} style={{fontSize:8,padding:"2px 7px",background:"transparent",border:"1px solid var(--bd)",borderRadius:4,color:"var(--mu)",cursor:"pointer"}}>📋</button>
                      <button onClick={()=>{setChatInput(r.output);navigateTab("chat");}} style={{fontSize:8,padding:"2px 7px",background:"rgba(212,168,83,.08)",border:"1px solid rgba(212,168,83,.2)",borderRadius:4,color:"var(--ac)",cursor:"pointer"}}>→ Chat</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Stats de la session */}
          {!loading && results.filter(r=>r.ok).length > 1 && (
            <div style={{marginTop:12,padding:"10px 14px",background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:8,display:"flex",gap:16,flexWrap:"wrap",fontSize:9,color:"var(--mu)"}}>
              <span>⚡ Plus rapide : <strong style={{color:"var(--green)"}}>{fastest&&MODEL_DEFS[fastest.id]?.short} ({fmtMs(fastest?.time||0)})</strong></span>
              <span>⏱ Plus lent : <strong>{slowest&&MODEL_DEFS[slowest.id]?.short} ({fmtMs(slowest?.time||0)})</strong></span>
              <span>⏰ Total : <strong style={{color:"#FCD34D"}}>{fmtMs(elapsed)}</strong></span>
              <span>✓ {results.filter(r=>r.ok).length}/{activeIds.length} IAs</span>
            </div>
          )}
        </div>
      )}

      {/* Historique flash */}
      {history.length > 0 && !loading && results.length === 0 && (
        <div style={{marginTop:14}}>
          <div style={{fontSize:9,fontWeight:700,color:"var(--mu)",marginBottom:8}}>HISTORIQUE FLASH</div>
          <div style={{display:"flex",flexDirection:"column",gap:5}}>
            {history.slice(0,8).map(h=>(
              <div key={h.id} onClick={()=>setPrompt(h.prompt)}
                style={{padding:"7px 12px",background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:7,cursor:"pointer",display:"flex",gap:10,alignItems:"center"}}>
                <span style={{fontSize:9,color:"var(--tx)",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{h.prompt}</span>
                <span style={{fontSize:7,color:MODEL_DEFS[h.fastest]?.color,flexShrink:0}}>⚡ {MODEL_DEFS[h.fastest]?.short}</span>
                <span style={{fontSize:7,color:"var(--mu)",flexShrink:0,fontFamily:"var(--font-mono)"}}>{fmtMs(h.totalTime)}</span>
                <span style={{fontSize:7,color:"var(--mu)",flexShrink:0}}>{h.date}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
