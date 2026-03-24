import React from "react";
import { useApi } from "../context/ApiContext.jsx";
import { useModels } from "../context/ModelContext.jsx";
import { useAdvanced } from "../context/AdvancedContext.jsx";

export default function AdvancedTab() {
  const { enabled } = useApi();
  const { MODEL_DEFS, IDS } = useModels();
  const {
    THEMES, theme, setTheme,
    streamingEnabled, setStreamingEnabled,
    modelTemps, setModelTemps,
    customProviders, setCustomProviders,
    globalSysPrompt, setGlobalSysPrompt,
    saveAdvSettings,
    setShowOnboarding, setOnboardStep,
  } = useAdvanced();

  return (
    <div style={{flex:1,overflow:"auto",padding:"clamp(10px,2vw,16px)"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16,flexWrap:"wrap"}}>
        <div style={{fontFamily:"var(--font-display)",fontWeight:800,fontSize:"clamp(14px,2.5vw,18px)",color:"var(--ac)"}}>🔬 Paramètres Avancés</div>
        <button onClick={saveAdvSettings} style={{marginLeft:"auto",padding:"5px 14px",background:"rgba(212,168,83,.15)",border:"1px solid rgba(212,168,83,.4)",borderRadius:5,color:"var(--ac)",cursor:"pointer",fontSize:9,fontFamily:"var(--font-mono)",fontWeight:700}}>💾 Sauvegarder</button>
      </div>

      {/* Thème + Streaming */}
      <div style={{marginBottom:14,background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:8,padding:"12px 14px"}}>
        <div style={{fontSize:9,color:"var(--mu)",fontWeight:700,letterSpacing:1,marginBottom:12}}>APPARENCE & PERFORMANCE</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          {/* Thème */}
          <div>
            <div style={{fontSize:8,color:"var(--mu)",marginBottom:6}}>THÈME DE COULEUR</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {Object.entries(THEMES).map(([k,t])=>(
                <button key={k} onClick={()=>setTheme(k)}
                  style={{padding:"5px 12px",borderRadius:8,border:"1px solid "+(theme===k?"var(--ac)":"var(--bd)"),background:theme===k?"rgba(212,168,83,.12)":"transparent",color:theme===k?"var(--ac)":"var(--tx)",fontSize:9,cursor:"pointer",fontWeight:theme===k?700:400}}>
                  {t.icon} {t.label.split(" ").slice(1).join(" ")}
                </button>
              ))}
            </div>
          </div>
          {/* Streaming */}
          <div>
            <div style={{fontSize:8,color:"var(--mu)",marginBottom:6}}>STREAMING DES RÉPONSES</div>
            <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer"}}>
              <input type="checkbox" checked={streamingEnabled} onChange={e=>setStreamingEnabled(e.target.checked)}/>
              <div>
                <div style={{fontSize:9,color:"var(--tx)",fontWeight:600}}>⚡ Streaming activé</div>
                <div style={{fontSize:8,color:"var(--mu)"}}>Affiche les tokens en temps réel (Groq, Mistral, etc.)</div>
              </div>
            </label>
            <div style={{marginTop:8}}>
              <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer"}} onClick={()=>{setShowOnboarding(true);setOnboardStep(0);}}>
                <span style={{fontSize:12}}>❓</span>
                <div style={{fontSize:9,color:"var(--blue)",cursor:"pointer"}}>Revoir le guide de démarrage</div>
              </label>
            </div>
          </div>
        </div>
      </div>
      <div style={{marginBottom:14,background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:8,padding:"12px 14px"}}>
        <div style={{fontSize:9,color:"var(--mu)",fontWeight:700,letterSpacing:1,marginBottom:8}}>SYSTEM PROMPT GLOBAL</div>
        <div style={{fontSize:8,color:"var(--mu)",marginBottom:6}}>Ajouté à toutes les requêtes, en plus du persona actif.</div>
        <textarea value={globalSysPrompt} onChange={e=>setGlobalSysPrompt(e.target.value)}
          placeholder="Ex: Réponds toujours en français. Sois concis. Utilise des bullet points..."
          rows={4} style={{width:"100%",background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:6,color:"var(--tx)",fontSize:10,padding:"8px 10px",fontFamily:"var(--font-ui)",resize:"vertical",outline:"none",boxSizing:"border-box"}}/>
      </div>

      {/* temperature per model */}
      <div style={{marginBottom:14,background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:8,padding:"12px 14px"}}>
        <div style={{fontSize:9,color:"var(--mu)",fontWeight:700,letterSpacing:1,marginBottom:8}}>TEMPÉRATURE PAR MODÈLE</div>
        <div style={{fontSize:8,color:"var(--mu)",marginBottom:10}}>0 = déterministe / 1 = créatif. Défaut : 0.7</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:8}}>
          {IDS.filter(id=>enabled[id]).map(id=>{
            const m=MODEL_DEFS[id];
            const val=modelTemps[id]!==undefined?modelTemps[id]:0.7;
            return (
              <div key={id} style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{color:m.color,fontSize:10,width:20}}>{m.icon}</span>
                <span style={{fontSize:9,color:"var(--tx)",flex:1}}>{m.short}</span>
                <input type="range" min="0" max="1" step="0.05" value={val}
                  onChange={e=>setModelTemps(prev=>({...prev,[id]:parseFloat(e.target.value)}))}
                  style={{width:80}}/>
                <span style={{fontSize:8,color:"var(--mu)",fontFamily:"var(--font-mono)",width:26}}>{val.toFixed(2)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Custom providers */}
      <div style={{background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:8,padding:"12px 14px"}}>
        <div style={{fontSize:9,color:"var(--mu)",fontWeight:700,letterSpacing:1,marginBottom:8}}>PROVIDERS CUSTOM (OpenAI-compatible)</div>
        <div style={{fontSize:8,color:"var(--mu)",marginBottom:10}}>LM Studio, Jan, Ollama API, ou tout provider compatible OpenAI.</div>
        {customProviders.map((prov,i)=>(
          <div key={i} style={{display:"flex",gap:6,marginBottom:6,flexWrap:"wrap"}}>
            <input value={prov.name||""} placeholder="Nom" onChange={e=>{const np=[...customProviders];np[i]={...np[i],name:e.target.value};setCustomProviders(np);}}
              style={{flex:"0 0 100px",background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:4,color:"var(--tx)",fontSize:9,padding:"4px 8px",outline:"none"}}/>
            <input value={prov.baseUrl||""} placeholder="http://localhost:1234/v1" onChange={e=>{const np=[...customProviders];np[i]={...np[i],baseUrl:e.target.value};setCustomProviders(np);}}
              style={{flex:1,minWidth:180,background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:4,color:"var(--tx)",fontSize:9,padding:"4px 8px",outline:"none"}}/>
            <input value={prov.model||""} placeholder="model-name" onChange={e=>{const np=[...customProviders];np[i]={...np[i],model:e.target.value};setCustomProviders(np);}}
              style={{flex:"0 0 130px",background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:4,color:"var(--tx)",fontSize:9,padding:"4px 8px",outline:"none"}}/>
            <button onClick={()=>setCustomProviders(prev=>prev.filter((_,j)=>j!==i))} style={{background:"rgba(248,113,113,.1)",border:"1px solid rgba(248,113,113,.3)",borderRadius:4,color:"var(--red)",fontSize:10,padding:"2px 8px",cursor:"pointer"}}>✕</button>
          </div>
        ))}
        <button onClick={()=>setCustomProviders(prev=>[...prev,{name:"",baseUrl:"",model:"",apiKey:""}])}
          style={{fontSize:9,padding:"4px 12px",background:"rgba(96,165,250,.1)",border:"1px solid rgba(96,165,250,.3)",borderRadius:5,color:"var(--blue)",cursor:"pointer",marginTop:4}}>
          ＋ Ajouter un provider
        </button>
      </div>
    </div>
  );
}
