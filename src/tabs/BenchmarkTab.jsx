import React from "react";
import { MODEL_DEFS, BENCHMARK_TESTS } from "../config/models.js";
import { callModel } from "../api/ai-service.js";

export default function BenchmarkTab({ enabled, apiKeys }) {
  const [results, setResults] = React.useState({}); // {iaId: {testId: {response, time, score}}}
  const [running, setRunning] = React.useState(false);
  const [selectedTest, setSelectedTest] = React.useState("reasoning");
  const [customPrompt, setCustomPrompt] = React.useState("");
  const [useCustom, setUseCustom] = React.useState(false);
  const [progress, setProgress] = React.useState({});

  const activeIds = Object.keys(MODEL_DEFS).filter(id => enabled[id] && MODEL_DEFS[id].apiType !== "pollinations" && !MODEL_DEFS[id].serial);
  const test = BENCHMARK_TESTS.find(t => t.id === selectedTest) || BENCHMARK_TESTS[0];
  const prompt = useCustom ? customPrompt : test.prompt;

  const runBenchmark = async () => {
    if (!prompt.trim() || !activeIds.length) return;
    setRunning(true); setResults({}); setProgress({});
    const newResults = {};
    await Promise.all(activeIds.map(async (id) => {
      setProgress(p => ({...p, [id]:"running"}));
      const start = Date.now();
      try {
        const resp = await callModel(id, [{role:"user", content:prompt}], apiKeys, "Tu es un assistant concis. Réponds directement sans intro.");
        const time = ((Date.now() - start) / 1000).toFixed(1);
        newResults[id] = { response: resp, time: parseFloat(time), status:"ok" };
        setProgress(p => ({...p, [id]:"done"}));
      } catch(e) {
        newResults[id] = { response: "❌ "+e.message, time: null, status:"error" };
        setProgress(p => ({...p, [id]:"error"}));
      }
      setResults({...newResults});
    }));
    setRunning(false);
  };

  const sorted = Object.entries(results)
    .filter(([,r]) => r.status==="ok")
    .sort(([,a],[,b]) => (a.time||99)-(b.time||99));

  const medals = ["🥇","🥈","🥉"];

  return (
    <div style={{flex:1,overflow:"auto",padding:"clamp(10px,2vw,16px)"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14,flexWrap:"wrap"}}>
        <div style={{fontFamily:"var(--font-display)",fontWeight:800,fontSize:"clamp(14px,2.5vw,18px)",color:"var(--ac)"}}>⚡ Benchmark Live</div>
        <div style={{fontSize:9,color:"var(--mu)"}}>— Teste toutes tes IAs en parallèle sur le même prompt</div>
      </div>
      {/* Sélecteur de test */}
      <div style={{marginBottom:12,background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:8,padding:"12px"}}>
        <div style={{fontSize:8,color:"var(--mu)",fontWeight:700,letterSpacing:1,marginBottom:8}}>TESTS PRÉDÉFINIS</div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:useCustom?0:10}}>
          {BENCHMARK_TESTS.map(t=>(
            <button key={t.id} onClick={()=>{setSelectedTest(t.id);setUseCustom(false);}}
              style={{padding:"5px 11px",borderRadius:12,border:"1px solid "+(selectedTest===t.id&&!useCustom?"var(--ac)":"var(--bd)"),background:selectedTest===t.id&&!useCustom?"rgba(212,168,83,.12)":"transparent",color:selectedTest===t.id&&!useCustom?"var(--ac)":"var(--mu)",fontSize:9,cursor:"pointer",fontWeight:selectedTest===t.id&&!useCustom?700:400}}>
              {t.icon} {t.label}
            </button>
          ))}
          <button onClick={()=>setUseCustom(true)}
            style={{padding:"5px 11px",borderRadius:12,border:"1px solid "+(useCustom?"var(--ac)":"var(--bd)"),background:useCustom?"rgba(212,168,83,.12)":"transparent",color:useCustom?"var(--ac)":"var(--mu)",fontSize:9,cursor:"pointer",fontWeight:useCustom?700:400}}>
            ✏️ Prompt perso
          </button>
        </div>
        {!useCustom && <div style={{fontSize:9,color:"var(--mu)",fontStyle:"italic",lineHeight:1.5,marginTop:6,padding:"8px 10px",background:"var(--s2)",borderRadius:6}}>{test.prompt.slice(0,120)}…</div>}
        {useCustom && <textarea value={customPrompt} onChange={e=>setCustomPrompt(e.target.value)} placeholder="Tape ton prompt ici…" rows={3}
          style={{width:"100%",marginTop:8,background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:6,color:"var(--tx)",fontSize:10,padding:"8px 10px",resize:"vertical",outline:"none",boxSizing:"border-box"}}/>}
      </div>
      {/* Lancer */}
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14,flexWrap:"wrap"}}>
        <button onClick={runBenchmark} disabled={running||!activeIds.length}
          style={{padding:"8px 20px",background:running?"var(--s2)":"rgba(212,168,83,.15)",border:"1px solid "+(running?"var(--bd)":"rgba(212,168,83,.4)"),borderRadius:6,color:running?"var(--mu)":"var(--ac)",fontSize:10,cursor:running?"default":"pointer",fontWeight:700,fontFamily:"var(--font-mono)"}}>
          {running ? "⏳ Benchmark en cours…" : "▶ Lancer le benchmark"}
        </button>
        {activeIds.length===0 && <span style={{fontSize:9,color:"var(--red)"}}>Active au moins une IA dans Config</span>}
        {activeIds.length>0 && !running && <span style={{fontSize:9,color:"var(--mu)"}}>{activeIds.length} IAs testées en parallèle</span>}
      </div>
      {/* Progression */}
      {running && (
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>
          {activeIds.map(id=>{
            const m=MODEL_DEFS[id]; const s=progress[id];
            return <div key={id} style={{padding:"4px 10px",borderRadius:8,border:"1px solid "+(s==="done"?"var(--green)":s==="error"?"var(--red)":m.color+"44"),background:s==="done"?"rgba(74,222,128,.08)":s==="error"?"rgba(248,113,113,.08)":"rgba(255,255,255,.03)",fontSize:9,color:s==="done"?"var(--green)":s==="error"?"var(--red)":m.color,display:"flex",alignItems:"center",gap:5}}>
              {s==="running"?<span style={{animation:"spin 1s linear infinite",display:"inline-block"}}>⟳</span>:s==="done"?"✓":s==="error"?"✕":"…"}
              {m.short}
            </div>;
          })}
        </div>
      )}
      {/* Podium vitesse */}
      {sorted.length>0 && (
        <div style={{marginBottom:14,background:"var(--s1)",border:"1px solid rgba(212,168,83,.2)",borderRadius:8,padding:"12px"}}>
          <div style={{fontSize:9,color:"var(--ac)",fontWeight:700,marginBottom:8}}>🏆 CLASSEMENT VITESSE</div>
          <div style={{display:"flex",flexDirection:"column",gap:5}}>
            {sorted.map(([id,r],i)=>{
              const m=MODEL_DEFS[id];
              const fastest=sorted[0][1].time;
              const pct=fastest?Math.round((fastest/r.time)*100):100;
              return <div key={id} style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:16,width:24,textAlign:"center"}}>{medals[i]||"·"}</span>
                <span style={{color:m.color,fontSize:11,width:20}}>{m.icon}</span>
                <span style={{fontSize:10,color:"var(--tx)",width:80,flexShrink:0}}>{m.short}</span>
                <div style={{flex:1,height:6,background:"var(--s2)",borderRadius:3,overflow:"hidden"}}>
                  <div style={{height:"100%",width:pct+"%",background:m.color,borderRadius:3,transition:"width .5s"}}/>
                </div>
                <span style={{fontSize:9,color:"var(--mu)",fontFamily:"var(--font-mono)",width:40,textAlign:"right"}}>{r.time}s</span>
              </div>;
            })}
          </div>
        </div>
      )}
      {/* Réponses détaillées */}
      {Object.keys(results).length>0 && (
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:10}}>
          {Object.entries(results).sort(([,a],[,b])=>(a.time||99)-(b.time||99)).map(([id,r],i)=>{
            const m=MODEL_DEFS[id];
            return <div key={id} style={{background:"var(--s1)",border:"1px solid "+(r.status==="error"?"rgba(248,113,113,.3)":m.color+"33"),borderRadius:8,padding:"12px"}}>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
                <span style={{fontSize:16}}>{medals[i]||"·"}</span>
                <span style={{color:m.color,fontSize:14}}>{m.icon}</span>
                <span style={{fontWeight:700,fontSize:11,color:m.color}}>{m.name}</span>
                {r.time && <span style={{marginLeft:"auto",fontSize:9,fontFamily:"var(--font-mono)",color:"var(--mu)"}}>{r.time}s</span>}
              </div>
              <div style={{fontSize:9,color:"var(--tx)",lineHeight:1.6,maxHeight:120,overflow:"auto"}}>{r.response.slice(0,400)}{r.response.length>400?"…":""}</div>
            </div>;
          })}
        </div>
      )}
    </div>
  );
}
