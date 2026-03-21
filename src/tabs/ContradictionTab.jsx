import React from 'react';
import { MODEL_DEFS } from "../config/models.js";
import { callModel } from "../api/ai-service.js";

export default function ContradictionTab({ enabled, apiKeys, conversations }) {
  const [textA, setTextA] = React.useState("");
  const [textB, setTextB] = React.useState("");
  const [labelA, setLabelA] = React.useState("Texte A");
  const [labelB, setLabelB] = React.useState("Texte B");
  const [result, setResult] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [mode, setMode] = React.useState("compare"); // compare|single

  const activeIds = Object.keys(MODEL_DEFS).filter(id => enabled[id] && !MODEL_DEFS[id]?.serial);
  const judge = activeIds.find(id=>["sambanova","mistral","groq","poll_claude"].includes(id)) || activeIds[0];

  // Pré-remplir depuis les réponses du chat
  const lastResponses = React.useMemo(() => {
    return activeIds.map(id => {
      const msgs = conversations[id]||[];
      const last = [...msgs].reverse().find(m=>m.role==="assistant");
      return last ? {id, text:last.content, name:MODEL_DEFS[id]?.short} : null;
    }).filter(Boolean).slice(0,4);
  }, [conversations, activeIds]);

  const analyze = async () => {
    if (mode==="compare" && (!textA.trim()||!textB.trim())) return;
    if (mode==="single" && !textA.trim()) return;
    if (!judge) return;
    setLoading(true); setResult(null);

    const prompt = mode==="compare"
      ? `Tu es un expert en logique, rhétorique et analyse critique. Analyse ces deux textes :

TEXTE A (${labelA}) :
${textA.slice(0,1500)}

TEXTE B (${labelB}) :
${textB.slice(0,1500)}

Identifie toutes les contradictions, désaccords factuels et incohérences logiques entre eux.
Réponds UNIQUEMENT en JSON valide :
{
  "score_coherence": 75,
  "resume": "Résumé de la relation entre les deux textes (2 phrases)",
  "contradictions": [
    {
      "type": "Factuel|Logique|Rhétorique|Nuance",
      "gravite": "haute|moyenne|faible",
      "claim_a": "Ce que dit le texte A",
      "claim_b": "Ce que dit le texte B",
      "explication": "Pourquoi c'est contradictoire",
      "verdict": "A a raison|B a raison|Les deux|Aucun des deux|Contextuel"
    }
  ],
  "points_communs": ["Point sur lequel ils s'accordent"],
  "recommandation": "Que faire face à ces contradictions ?"
}`
      : `Tu es un expert en analyse critique et détection de biais. Analyse ce texte :

${textA.slice(0,2000)}

Effectue une analyse complète : contradictions internes, biais cognitifs, arguments fallacieux.
Réponds UNIQUEMENT en JSON valide :
{
  "score_coherence": 75,
  "resume": "Résumé de la qualité argumentative (2 phrases)",
  "contradictions": [
    {
      "type": "Contradiction interne|Biais cognitif|Argument fallacieux|Généralisation",
      "gravite": "haute|moyenne|faible",
      "passage": "Le passage problématique (courte citation)",
      "explication": "Pourquoi c'est problématique",
      "suggestion": "Comment l'améliorer"
    }
  ],
  "biais_detectes": ["Biais 1", "Biais 2"],
  "points_forts": ["Ce qui est bien argumenté"],
  "recommandation": "Conseil global pour améliorer ce texte"
}`;

    try {
      const reply = await callModel(judge, [{role:"user",content:prompt}], apiKeys, "Expert logique et analyse critique. JSON uniquement, sans markdown.");
      const clean = reply.replace(/```json|```/g,"").trim();
      const data = JSON.parse(clean.match(/\{[\s\S]*\}/)?.[0]||clean);
      setResult(data);
    } catch(e) {
      setResult({score_coherence:0, resume:"Erreur d'analyse : "+e.message, contradictions:[], points_communs:[], recommandation:""});
    }
    setLoading(false);
  };

  const graviteColor = g => ({haute:"var(--red)",moyenne:"var(--orange)",faible:"var(--mu)"}[g]||"var(--mu)");
  const scoreColor   = s => s>=75?"var(--green)":s>=50?"var(--orange)":"var(--red)";
  const typeColors   = {"Factuel":"#F87171","Logique":"#F97316","Rhétorique":"#A78BFA","Nuance":"#60A5FA","Contradiction interne":"#F87171","Biais cognitif":"#F97316","Argument fallacieux":"#A78BFA","Généralisation":"#FCD34D"};

  return (
    <div style={{flex:1,overflow:"auto",padding:"clamp(10px,2vw,16px)"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6,flexWrap:"wrap"}}>
        <div style={{fontFamily:"var(--font-display)",fontWeight:800,fontSize:"clamp(14px,2.5vw,18px)",color:"#F97316"}}>⚡ Contradiction Detector</div>
        <div style={{fontSize:9,color:"var(--mu)"}}>— Contradictions, biais et incohérences logiques détectés par IA</div>
      </div>

      {/* Mode switch */}
      <div style={{display:"flex",gap:6,marginBottom:14}}>
        {[["compare","⚖️ Comparer 2 textes"],["single","🔬 Analyser 1 texte"]].map(([m,l])=>(
          <button key={m} onClick={()=>{setMode(m);setResult(null);}}
            style={{padding:"6px 14px",borderRadius:8,border:"1px solid "+(mode===m?"var(--ac)":"var(--bd)"),background:mode===m?"rgba(212,168,83,.12)":"transparent",color:mode===m?"var(--ac)":"var(--mu)",fontSize:9,cursor:"pointer",fontWeight:mode===m?700:400}}>
            {l}
          </button>
        ))}
      </div>

      {/* Pré-remplir depuis le chat */}
      {lastResponses.length>=2 && (
        <div style={{marginBottom:12,background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:8,padding:"10px 12px"}}>
          <div style={{fontSize:8,color:"var(--mu)",fontWeight:700,marginBottom:6}}>COMPARER LES RÉPONSES DU CHAT</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {lastResponses.map((r,i)=>{
              const m=MODEL_DEFS[r.id];
              return <button key={r.id} onClick={()=>{
                if(i===0||mode==="single"){setTextA(r.text.slice(0,1500));setLabelA(m.short);}
                else{setTextB(r.text.slice(0,1500));setLabelB(m.short);}
              }}
                style={{padding:"4px 10px",borderRadius:8,border:"1px solid "+m.color+"44",background:m.color+"11",color:m.color,fontSize:8,cursor:"pointer"}}>
                {i===0||mode==="single"?"A":"B"}: {m.icon} {m.short}
              </button>;
            })}
          </div>
        </div>
      )}

      {/* Inputs */}
      <div style={{display:"grid",gridTemplateColumns:mode==="compare"?"1fr 1fr":"1fr",gap:10,marginBottom:12}}>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:5}}>
            <input value={mode==="compare"?labelA:"Texte à analyser"} readOnly={mode==="single"} onChange={e=>setLabelA(e.target.value)}
              style={{flex:1,background:"transparent",border:"none",color:"var(--ac)",fontSize:9,fontWeight:700,outline:"none",fontFamily:"var(--font-mono)"}}/>
          </div>
          <textarea value={textA} onChange={e=>setTextA(e.target.value)}
            placeholder={mode==="compare"?"Colle le premier texte, article ou réponse IA…":"Colle le texte à analyser…"}
            rows={6} style={{width:"100%",background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:6,color:"var(--tx)",fontSize:10,padding:"8px 10px",resize:"vertical",outline:"none",boxSizing:"border-box"}}/>
          <div style={{fontSize:7,color:"var(--mu)",marginTop:2}}>{textA.length} caractères</div>
        </div>
        {mode==="compare" && (
          <div>
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:5}}>
              <input value={labelB} onChange={e=>setLabelB(e.target.value)}
                style={{flex:1,background:"transparent",border:"none",color:"#60A5FA",fontSize:9,fontWeight:700,outline:"none",fontFamily:"var(--font-mono)"}}/>
            </div>
            <textarea value={textB} onChange={e=>setTextB(e.target.value)}
              placeholder="Colle le deuxième texte, article ou réponse IA…"
              rows={6} style={{width:"100%",background:"var(--s2)",border:"1px solid rgba(96,165,250,.3)",borderRadius:6,color:"var(--tx)",fontSize:10,padding:"8px 10px",resize:"vertical",outline:"none",boxSizing:"border-box"}}/>
            <div style={{fontSize:7,color:"var(--mu)",marginTop:2}}>{textB.length} caractères</div>
          </div>
        )}
      </div>

      <button onClick={analyze} disabled={loading||!judge||(mode==="compare"?(!textA.trim()||!textB.trim()):!textA.trim())}
        style={{padding:"9px 22px",background:loading?"var(--s2)":"rgba(249,115,22,.15)",border:"1px solid "+(loading?"var(--bd)":"rgba(249,115,22,.4)"),borderRadius:6,color:loading?"var(--mu)":"#F97316",fontSize:10,cursor:loading?"default":"pointer",fontWeight:700,fontFamily:"var(--font-mono)",marginBottom:16}}>
        {loading?"⚡ Analyse en cours…":"⚡ Lancer l'analyse"}
      </button>

      {/* Résultats */}
      {result && (
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {/* Score */}
          <div style={{padding:"14px 18px",background:"var(--s1)",border:"2px solid "+scoreColor(result.score_coherence)+"44",borderRadius:12,display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}}>
            <div style={{textAlign:"center",minWidth:70}}>
              <div style={{fontSize:36,fontWeight:900,color:scoreColor(result.score_coherence),fontFamily:"var(--font-display)",lineHeight:1}}>{result.score_coherence}%</div>
              <div style={{fontSize:8,color:"var(--mu)"}}>Cohérence</div>
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:10,color:"var(--tx)",lineHeight:1.6,marginBottom:6}}>{result.resume}</div>
              {result.recommandation && <div style={{fontSize:9,color:"var(--ac)",fontStyle:"italic"}}>→ {result.recommandation}</div>}
            </div>
          </div>

          {/* Contradictions */}
          {result.contradictions?.length>0 && (
            <div>
              <div style={{fontSize:10,fontWeight:700,color:"var(--red)",marginBottom:8}}>⚡ {result.contradictions.length} contradiction{result.contradictions.length>1?"s":""} détectée{result.contradictions.length>1?"s":""}</div>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {result.contradictions.map((c,i)=>(
                  <div key={i} style={{background:"var(--s1)",border:"1px solid "+graviteColor(c.gravite)+"44",borderRadius:10,padding:"12px 14px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8,flexWrap:"wrap"}}>
                      <span style={{padding:"2px 8px",borderRadius:8,background:(typeColors[c.type]||"var(--mu)")+"22",color:typeColors[c.type]||"var(--mu)",fontSize:8,fontWeight:700}}>{c.type}</span>
                      <span style={{padding:"2px 8px",borderRadius:8,background:graviteColor(c.gravite)+"22",color:graviteColor(c.gravite),fontSize:8,fontWeight:700}}>Gravité {c.gravite}</span>
                      {c.verdict && <span style={{fontSize:8,color:"var(--mu)",marginLeft:"auto"}}>Verdict : <strong style={{color:"var(--tx)"}}>{c.verdict}</strong></span>}
                    </div>
                    {mode==="compare" ? (
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                        <div style={{background:"rgba(212,168,83,.06)",borderRadius:6,padding:"6px 8px"}}>
                          <div style={{fontSize:7,color:"var(--ac)",fontWeight:700,marginBottom:3}}>{labelA}</div>
                          <div style={{fontSize:9,color:"var(--tx)",lineHeight:1.5}}>{c.claim_a}</div>
                        </div>
                        <div style={{background:"rgba(96,165,250,.06)",borderRadius:6,padding:"6px 8px"}}>
                          <div style={{fontSize:7,color:"#60A5FA",fontWeight:700,marginBottom:3}}>{labelB}</div>
                          <div style={{fontSize:9,color:"var(--tx)",lineHeight:1.5}}>{c.claim_b}</div>
                        </div>
                      </div>
                    ) : (
                      <div style={{background:"rgba(248,113,113,.06)",borderRadius:6,padding:"6px 8px",marginBottom:8}}>
                        <div style={{fontSize:7,color:"var(--red)",fontWeight:700,marginBottom:3}}>PASSAGE PROBLÉMATIQUE</div>
                        <div style={{fontSize:9,color:"var(--tx)",lineHeight:1.5,fontStyle:"italic"}}>"{c.passage}"</div>
                      </div>
                    )}
                    <div style={{fontSize:9,color:"var(--mu)",lineHeight:1.5}}>{c.explication}</div>
                    {c.suggestion && <div style={{marginTop:5,fontSize:9,color:"var(--green)"}}>✓ {c.suggestion}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Points communs ou forts */}
          {(result.points_communs||result.points_forts||result.biais_detectes) && (
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:8}}>
              {(result.points_communs||result.points_forts)?.length>0 && (
                <div style={{background:"var(--s1)",border:"1px solid rgba(74,222,128,.2)",borderRadius:8,padding:"10px 12px"}}>
                  <div style={{fontSize:8,color:"var(--green)",fontWeight:700,marginBottom:6}}>{mode==="compare"?"✓ POINTS COMMUNS":"✓ POINTS FORTS"}</div>
                  {(result.points_communs||result.points_forts||[]).map((p,i)=><div key={i} style={{fontSize:9,color:"var(--tx)",marginBottom:3}}>• {p}</div>)}
                </div>
              )}
              {result.biais_detectes?.length>0 && (
                <div style={{background:"var(--s1)",border:"1px solid rgba(249,115,22,.2)",borderRadius:8,padding:"10px 12px"}}>
                  <div style={{fontSize:8,color:"var(--orange)",fontWeight:700,marginBottom:6}}>🧠 BIAIS DÉTECTÉS</div>
                  {result.biais_detectes.map((b,i)=><div key={i} style={{fontSize:9,color:"var(--tx)",marginBottom:3}}>• {b}</div>)}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
