import React from 'react';
import { MODEL_DEFS } from '../config/models.js';

export default function PromptAutopsyTab({ enabled, apiKeys, conversations }) {
  const [badResponse, setBadResponse] = React.useState("");
  const [originalPrompt, setOriginalPrompt] = React.useState("");
  const [result, setResult] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const activeIds = Object.keys(MODEL_DEFS).filter(id => enabled[id] && !MODEL_DEFS[id]?.serial);

  // Pré-remplir depuis la dernière réponse du chat
  const lastResponses = React.useMemo(() => {
    return activeIds.map(id => {
      const msgs = conversations[id] || [];
      const last = [...msgs].reverse().find(m => m.role === "assistant");
      const q = [...msgs].reverse().find(m => m.role === "user");
      return last ? { id, text: last.content, question: q?.content || "" } : null;
    }).filter(Boolean);
  }, [conversations, activeIds]);

  const runAutopsy = async () => {
    if (!badResponse.trim()) return;
    setLoading(true); setResult(null);
    const judge = activeIds.find(id => ["groq","mistral","cerebras"].includes(id)) || activeIds[0];
    if (!judge) { setLoading(false); return; }
    const prompt = `Tu es un expert en prompt engineering et évaluation de LLMs. Analyse cette réponse d'IA qui a déçu l'utilisateur.

PROMPT ORIGINAL : ${originalPrompt || "(non fourni)"}
RÉPONSE DÉCEVANTE :
${badResponse.slice(0, 1500)}

Effectue une autopsie complète. Réponds UNIQUEMENT en JSON valide :
{
  "verdict": "phrase de 1 ligne résumant le problème principal",
  "score_mauvais": 3,
  "biais": [{"nom":"Nom du biais","description":"ce qui s'est passé","gravite":"haute|moyenne|faible"}],
  "erreurs_raisonnement": ["erreur 1","erreur 2"],
  "problemes_prompt": ["problème dans le prompt qui a causé ça"],
  "prompt_ameliore": "version améliorée du prompt original qui évite ces problèmes",
  "prompt_v2": "deuxième variante encore plus précise",
  "lecon": "conseil principal à retenir pour éviter ce problème"
}`;
    try {
      const { callModel: cm } = await import("../api/ai-service.js");
      const reply = await cm(judge, [{role:"user", content:prompt}], apiKeys, "Expert analyse IA. JSON uniquement, sans markdown.");
      const clean = reply.replace(/```json|```/g,"").trim();
      const data = JSON.parse(clean.match(/\{[\s\S]*\}/)?.[0] || clean);
      setResult(data);
    } catch(e) { setResult({ verdict:"Erreur d'analyse : "+e.message, biais:[], erreurs_raisonnement:[], problemes_prompt:[], prompt_ameliore:"", prompt_v2:"", lecon:"" }); }
    setLoading(false);
  };

  const graviteColor = g => g==="haute"?"var(--red)":g==="moyenne"?"var(--orange)":"var(--mu)";

  return (
    <div style={{flex:1,overflow:"auto",padding:"clamp(10px,2vw,16px)"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6,flexWrap:"wrap"}}>
        <div style={{fontFamily:"var(--font-display)",fontWeight:800,fontSize:"clamp(14px,2.5vw,18px)",color:"#F87171"}}>🔬 Prompt Autopsy</div>
        <div style={{fontSize:9,color:"var(--mu)"}}>— Disséquer pourquoi une réponse d'IA était mauvaise</div>
      </div>
      <div style={{fontSize:9,color:"var(--mu)",marginBottom:14,padding:"8px 12px",background:"rgba(248,113,113,.06)",border:"1px solid rgba(248,113,113,.15)",borderRadius:6}}>
        Colle une réponse d'IA qui t'a déçu. L'autopsie identifie les biais, erreurs de raisonnement, et génère un prompt amélioré qui évite ces problèmes.
      </div>

      {/* Pré-remplir depuis le chat */}
      {lastResponses.length > 0 && (
        <div style={{marginBottom:12,background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:8,padding:"10px 12px"}}>
          <div style={{fontSize:8,color:"var(--mu)",fontWeight:700,marginBottom:6}}>PRÉ-REMPLIR DEPUIS LE CHAT</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {lastResponses.slice(0,5).map(r=>{
              const m = MODEL_DEFS[r.id];
              return <button key={r.id} onClick={()=>{setBadResponse(r.text.slice(0,1500));setOriginalPrompt(r.question.slice(0,500));}}
                style={{padding:"4px 10px",borderRadius:8,border:"1px solid "+m.color+"44",background:m.color+"11",color:m.color,fontSize:8,cursor:"pointer"}}>
                {m.icon} Dernière réponse {m.short}
              </button>;
            })}
          </div>
        </div>
      )}

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
        <div>
          <div style={{fontSize:8,color:"var(--mu)",fontWeight:700,marginBottom:5}}>PROMPT ORIGINAL (optionnel)</div>
          <textarea value={originalPrompt} onChange={e=>setOriginalPrompt(e.target.value)} placeholder="Le prompt que tu avais envoyé…" rows={3}
            style={{width:"100%",background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:6,color:"var(--tx)",fontSize:10,padding:"8px 10px",resize:"vertical",outline:"none",boxSizing:"border-box"}}/>
        </div>
        <div>
          <div style={{fontSize:8,color:"var(--red)",fontWeight:700,marginBottom:5}}>RÉPONSE DÉCEVANTE *</div>
          <textarea value={badResponse} onChange={e=>setBadResponse(e.target.value)} placeholder="Colle ici la réponse qui t'a déçu…" rows={3}
            style={{width:"100%",background:"var(--s2)",border:"1px solid rgba(248,113,113,.3)",borderRadius:6,color:"var(--tx)",fontSize:10,padding:"8px 10px",resize:"vertical",outline:"none",boxSizing:"border-box"}}/>
        </div>
      </div>

      <button onClick={runAutopsy} disabled={loading||!badResponse.trim()||!activeIds.length}
        style={{padding:"9px 22px",background:loading?"var(--s2)":"rgba(248,113,113,.15)",border:"1px solid "+(loading?"var(--bd)":"rgba(248,113,113,.4)"),borderRadius:6,color:loading?"var(--mu)":"var(--red)",fontSize:10,cursor:loading?"default":"pointer",fontWeight:700,fontFamily:"var(--font-mono)",marginBottom:16}}>
        {loading?"🔬 Autopsie en cours…":"🔬 Lancer l'autopsie"}
      </button>

      {result && (
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {/* Verdict */}
          <div style={{padding:"12px 16px",background:"rgba(248,113,113,.08)",border:"1px solid rgba(248,113,113,.3)",borderRadius:8}}>
            <div style={{fontSize:8,color:"var(--red)",fontWeight:700,marginBottom:4}}>VERDICT</div>
            <div style={{fontSize:12,fontWeight:700,color:"var(--tx)",lineHeight:1.5}}>{result.verdict}</div>
            {result.lecon && <div style={{marginTop:6,fontSize:9,color:"var(--mu)",fontStyle:"italic"}}>💡 {result.lecon}</div>}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:10}}>
            {/* Biais */}
            {result.biais?.length > 0 && (
              <div style={{background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:8,padding:"12px"}}>
                <div style={{fontSize:8,color:"var(--orange)",fontWeight:700,marginBottom:8}}>🧠 BIAIS DÉTECTÉS</div>
                {result.biais.map((b,i)=>(
                  <div key={i} style={{marginBottom:8,paddingBottom:8,borderBottom:i<result.biais.length-1?"1px solid var(--bd)":"none"}}>
                    <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:3}}>
                      <span style={{fontWeight:700,fontSize:10,color:graviteColor(b.gravite)}}>{b.nom}</span>
                      <span style={{fontSize:7,padding:"1px 5px",borderRadius:8,background:graviteColor(b.gravite)+"22",color:graviteColor(b.gravite),fontWeight:700}}>{b.gravite}</span>
                    </div>
                    <div style={{fontSize:9,color:"var(--mu)",lineHeight:1.5}}>{b.description}</div>
                  </div>
                ))}
              </div>
            )}
            {/* Erreurs */}
            {result.erreurs_raisonnement?.length > 0 && (
              <div style={{background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:8,padding:"12px"}}>
                <div style={{fontSize:8,color:"var(--red)",fontWeight:700,marginBottom:8}}>⚠️ ERREURS DE RAISONNEMENT</div>
                {result.erreurs_raisonnement.map((e,i)=>(
                  <div key={i} style={{display:"flex",gap:6,marginBottom:5,fontSize:9,color:"var(--tx)"}}>
                    <span style={{color:"var(--red)",flexShrink:0}}>✗</span>{e}
                  </div>
                ))}
              </div>
            )}
            {/* Problèmes prompt */}
            {result.problemes_prompt?.length > 0 && (
              <div style={{background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:8,padding:"12px"}}>
                <div style={{fontSize:8,color:"var(--ac)",fontWeight:700,marginBottom:8}}>📝 PROBLÈMES DANS TON PROMPT</div>
                {result.problemes_prompt.map((p,i)=>(
                  <div key={i} style={{display:"flex",gap:6,marginBottom:5,fontSize:9,color:"var(--tx)"}}>
                    <span style={{color:"var(--ac)",flexShrink:0}}>→</span>{p}
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Prompts améliorés */}
          {(result.prompt_ameliore||result.prompt_v2) && (
            <div style={{background:"var(--s1)",border:"1px solid rgba(74,222,128,.25)",borderRadius:8,padding:"12px"}}>
              <div style={{fontSize:8,color:"var(--green)",fontWeight:700,marginBottom:10}}>✨ PROMPTS AMÉLIORÉS</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                {[["Version 1",result.prompt_ameliore],["Version 2",result.prompt_v2]].filter(([,t])=>t).map(([label,text])=>(
                  <div key={label}>
                    <div style={{fontSize:8,color:"var(--mu)",marginBottom:4}}>{label}</div>
                    <div style={{background:"var(--s2)",borderRadius:6,padding:"8px 10px",fontSize:9,color:"var(--tx)",lineHeight:1.6,position:"relative"}}>
                      {text}
                      <button onClick={()=>{navigator.clipboard.writeText(text);}}
                        style={{position:"absolute",top:4,right:4,fontSize:8,padding:"2px 6px",background:"rgba(212,168,83,.15)",border:"1px solid rgba(212,168,83,.3)",borderRadius:4,color:"var(--ac)",cursor:"pointer"}}>📋</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
