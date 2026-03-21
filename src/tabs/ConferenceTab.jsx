import React from 'react';

export default function ConferenceTab({ enabled, apiKeys, MODEL_DEFS, callModel }) {
  const [question, setQuestion] = React.useState("");
  const [chain, setChain] = React.useState([]); // [{iaId, role, output, loading}]
  const [running, setRunning] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [synthesis, setSynthesis] = React.useState("");
  const [synthLoading, setSynthLoading] = React.useState(false);
  const activeIds = Object.keys(MODEL_DEFS).filter(id => enabled[id] && !MODEL_DEFS[id]?.serial);

  const ROLES = [
    { id:"explorateur", label:"🔭 Explorateur", color:"#60A5FA", instruction:"Tu es l'Explorateur. Ton rôle : explorer toutes les pistes, angles et perspectives possibles sur le sujet. Sois large, créatif, ne t'autocensure pas. Propose des idées inattendues." },
    { id:"critique",    label:"🔍 Critique",    color:"#F87171", instruction:"Tu es le Critique. Ton rôle : analyser rigoureusement ce qu'a dit l'Explorateur. Identifie les failles, les imprécisions, les angles manquants. Sois précis et constructif." },
    { id:"constructeur",label:"🔨 Constructeur",color:"#4ADE80", instruction:"Tu es le Constructeur. En tenant compte de ce qu'ont dit l'Explorateur ET le Critique, construis la meilleure réponse possible. Synthétise, enrichis, structure clairement." },
  ];

  const runConference = async () => {
    if (!question.trim() || activeIds.length < 1) return;
    setRunning(true); setDone(false); setSynthesis(""); setChain([]);
    const steps = ROLES.slice(0, Math.min(ROLES.length, activeIds.length));
    let context = "";
    const results = [];
    for (let i = 0; i < steps.length; i++) {
      const role = steps[i];
      const iaId = activeIds[i % activeIds.length];
      const m = MODEL_DEFS[iaId];
      const newEntry = { iaId, roleId:role.id, roleLabel:role.label, roleColor:role.color, output:"", loading:true };
      setChain(prev=>[...prev, newEntry]);
      const prompt = i===0
        ? `Question : "${question}"\n\n${role.instruction}`
        : `Question originale : "${question}"\n\nÉchanges précédents :\n${context}\n\n${role.instruction}\n\nAppuie-toi sur ce qui précède pour aller plus loin.`;
      try {
        const reply = await callModel(iaId, [{role:"user", content:prompt}], apiKeys, role.instruction);
        context += `\n\n[${role.label} — ${m.short}]:\n${reply}`;
        results.push({ ...newEntry, output:reply, loading:false });
        setChain([...results]);
      } catch(e) {
        results.push({ ...newEntry, output:"❌ "+e.message, loading:false });
        setChain([...results]);
      }
    }
    setRunning(false); setDone(true);
  };

  const runSynthesis = async () => {
    if (!chain.length) return;
    setSynthLoading(true);
    const judge = activeIds[activeIds.length-1] || activeIds[0];
    const fullContext = chain.map(c=>`[${c.roleLabel}]:\n${c.output}`).join("\n\n");
    const prompt = `Voici une conférence IA en 3 étapes sur : "${question}"\n\n${fullContext}\n\nTu es le Synthétiseur Final. Produis une réponse définitive, claire et actionnable qui capitalise sur toute cette réflexion collective. Structure : 1) Réponse principale, 2) Points clés, 3) Prochaines étapes concrètes.`;
    try {
      const reply = await callModel(judge, [{role:"user",content:prompt}], apiKeys, "Tu es le Synthétiseur Final d'une conférence IA.");
      setSynthesis(reply);
    } catch(e) { setSynthesis("❌ "+e.message); }
    setSynthLoading(false);
  };

  return (
    <div style={{flex:1,overflow:"auto",padding:"clamp(10px,2vw,16px)"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6,flexWrap:"wrap"}}>
        <div style={{fontFamily:"var(--font-display)",fontWeight:800,fontSize:"clamp(14px,2.5vw,18px)",color:"#A78BFA"}}>🎙 Mode Conférence</div>
        <div style={{fontSize:9,color:"var(--mu)"}}>— 3 IAs en chaîne : Explorateur → Critique → Constructeur</div>
      </div>
      <div style={{fontSize:9,color:"var(--mu)",marginBottom:14,padding:"8px 12px",background:"rgba(167,139,250,.06)",border:"1px solid rgba(167,139,250,.15)",borderRadius:6}}>
        Contrairement au Débat (positions opposées), ici chaque IA <strong style={{color:"var(--tx)"}}>construit sur la précédente</strong>. Le résultat final est collectivement meilleur que n'importe quelle IA seule.
      </div>

      {/* Rôles visuels */}
      <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
        {ROLES.map((r,i)=>{
          const iaId = activeIds[i%activeIds.length];
          const m = iaId ? MODEL_DEFS[iaId] : null;
          return <div key={r.id} style={{flex:1,minWidth:140,padding:"10px 12px",background:"var(--s1)",border:"1px solid "+r.color+"33",borderRadius:8}}>
            <div style={{fontSize:12,color:r.color,fontWeight:700,marginBottom:3}}>{r.label}</div>
            <div style={{fontSize:8,color:"var(--mu)",lineHeight:1.4}}>{r.instruction.split(":")[1]?.trim().slice(0,80)}…</div>
            {m&&<div style={{marginTop:5,fontSize:8,color:m.color,fontWeight:700}}>→ {m.icon} {m.short}</div>}
          </div>;
        })}
      </div>

      {/* Input */}
      <div style={{marginBottom:12}}>
        <textarea value={question} onChange={e=>setQuestion(e.target.value)} placeholder="Pose ta question ou sujet à la conférence…"
          rows={3} style={{width:"100%",background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:8,color:"var(--tx)",fontSize:11,padding:"10px 12px",resize:"vertical",outline:"none",boxSizing:"border-box"}}/>
      </div>
      <button onClick={runConference} disabled={running||!question.trim()||!activeIds.length}
        style={{padding:"9px 22px",background:running?"var(--s2)":"rgba(167,139,250,.15)",border:"1px solid "+(running?"var(--bd)":"rgba(167,139,250,.4)"),borderRadius:6,color:running?"var(--mu)":"#A78BFA",fontSize:10,cursor:running?"default":"pointer",fontWeight:700,fontFamily:"var(--font-mono)",marginBottom:16}}>
        {running?"🎙 Conférence en cours…":"🎙 Lancer la conférence"}
      </button>

      {/* Chaîne de réponses */}
      {chain.length>0 && (
        <div style={{display:"flex",flexDirection:"column",gap:2,marginBottom:16,position:"relative"}}>
          {/* Ligne verticale */}
          <div style={{position:"absolute",left:20,top:20,bottom:20,width:2,background:"linear-gradient(to bottom,#60A5FA,#F87171,#4ADE80)",borderRadius:2,zIndex:0}}/>
          {chain.map((c,i)=>(
            <div key={i} style={{display:"flex",gap:12,alignItems:"flex-start",position:"relative",zIndex:1}}>
              <div style={{width:40,height:40,borderRadius:"50%",background:"var(--bg)",border:"2px solid "+c.roleColor,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>
                {c.roleLabel.slice(0,2)}
              </div>
              <div style={{flex:1,background:"var(--s1)",border:"1px solid "+c.roleColor+"33",borderRadius:10,padding:"12px 14px",marginBottom:8}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                  <span style={{fontWeight:700,fontSize:10,color:c.roleColor}}>{c.roleLabel}</span>
                  <span style={{fontSize:8,color:MODEL_DEFS[c.iaId]?.color,fontWeight:600}}>— {MODEL_DEFS[c.iaId]?.icon} {MODEL_DEFS[c.iaId]?.short}</span>
                  {i<chain.length-1&&<span style={{fontSize:8,color:"var(--mu)",marginLeft:"auto"}}>↓ transmis au suivant</span>}
                </div>
                {c.loading
                  ? <div style={{fontSize:9,color:"var(--mu)"}}>⏳ En cours…</div>
                  : <div style={{fontSize:10,color:"var(--tx)",lineHeight:1.7,whiteSpace:"pre-wrap"}}>{c.output}</div>
                }
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Synthèse finale */}
      {done && (
        <div style={{background:"var(--s1)",border:"1px solid rgba(167,139,250,.3)",borderRadius:10,padding:"14px 16px"}}>
          {!synthesis && !synthLoading && (
            <button onClick={runSynthesis}
              style={{padding:"8px 20px",background:"rgba(167,139,250,.15)",border:"1px solid rgba(167,139,250,.4)",borderRadius:6,color:"#A78BFA",fontSize:10,cursor:"pointer",fontWeight:700}}>
              ✨ Générer la synthèse finale
            </button>
          )}
          {synthLoading && <div style={{fontSize:10,color:"var(--mu)"}}>⏳ Synthèse en cours…</div>}
          {synthesis && (
            <>
              <div style={{fontSize:9,color:"#A78BFA",fontWeight:700,marginBottom:8}}>✨ SYNTHÈSE FINALE</div>
              <div style={{fontSize:10,color:"var(--tx)",lineHeight:1.7,whiteSpace:"pre-wrap"}}>{synthesis}</div>
              <button onClick={()=>navigator.clipboard.writeText(synthesis)} style={{marginTop:10,fontSize:8,padding:"3px 10px",background:"rgba(212,168,83,.1)",border:"1px solid rgba(212,168,83,.3)",borderRadius:4,color:"var(--ac)",cursor:"pointer"}}>📋 Copier la synthèse</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
