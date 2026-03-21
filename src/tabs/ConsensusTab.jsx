import React from 'react';
import { MODEL_DEFS } from "../config/models.js";
import { callModel } from "../api/ai-service.js";

export default function ConsensusTab({ enabled, apiKeys, conversations, ...anyOtherProps }) {
  const [claim, setClaim] = React.useState("");
  const [result, setResult] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const activeIds = Object.keys(MODEL_DEFS).filter(id => enabled[id] && !MODEL_DEFS[id]?.serial);

  // Pré-remplir depuis le chat
  const lastResponses = React.useMemo(() => {
    return activeIds.map(id => {
      const msgs = conversations[id]||[];
      const last = [...msgs].reverse().find(m=>m.role==="assistant");
      return last ? {id, text:last.content.slice(0,300)} : null;
    }).filter(Boolean).slice(0,3);
  }, [conversations, activeIds]);

  const runConsensus = async () => {
    if (!claim.trim() || activeIds.length < 2) return;
    setLoading(true); setResult(null);
    const voters = activeIds.filter(id=>!MODEL_DEFS[id]?.serial).slice(0, 6);
    const votes = await Promise.all(voters.map(async (id) => {
      const prompt = `Évalue cette affirmation : "${claim.slice(0,500)}"

Réponds UNIQUEMENT en JSON :
{"verdict":"vrai|faux|partiel|incertain","confiance":85,"raison":"1 phrase","sources_suggérées":["source 1","source 2"]}

- vrai = tu es certain que c'est correct
- faux = tu es certain que c'est incorrect
- partiel = partiellement vrai/faux
- incertain = tu ne peux pas vérifier`;
      try {
        const reply = await callModel(id, [{role:"user",content:prompt}], apiKeys, "Vérificateur de faits. JSON uniquement.");
        const clean = reply.replace(/```json|```/g,"").trim();
        const data = JSON.parse(clean.match(/\{[\s\S]*\}/)?.[0]||clean);
        return { id, ...data, ok:true };
      } catch(e) { return { id, verdict:"incertain", confiance:0, raison:"Erreur: "+e.message, ok:false }; }
    }));

    // Calcul du score de consensus
    const verdictCounts = {vrai:0, faux:0, partiel:0, incertain:0};
    votes.forEach(v=>{ if(verdictCounts[v.verdict]!==undefined) verdictCounts[v.verdict]++; });
    const total = votes.length;
    const topVerdict = Object.entries(verdictCounts).sort(([,a],[,b])=>b-a)[0];
    const consensusRate = Math.round((topVerdict[1]/total)*100);
    const avgConfidence = Math.round(votes.reduce((a,v)=>a+(v.confiance||0),0)/total);
    const reliabilityScore = Math.round((consensusRate*0.6 + avgConfidence*0.4));
    const sources = [...new Set(votes.flatMap(v=>v.sources_suggérées||[]))].slice(0,5);

    setResult({ votes, verdictCounts, topVerdict:topVerdict[0], consensusRate, avgConfidence, reliabilityScore, sources, total });
    setLoading(false);
  };

  const verdictColor = v => ({vrai:"var(--green)",faux:"var(--red)",partiel:"var(--orange)",incertain:"var(--mu)"}[v]||"var(--mu)");
  const verdictLabel = v => ({vrai:"✅ Vrai",faux:"❌ Faux",partiel:"⚠️ Partiel",incertain:"❓ Incertain"}[v]||v);
  const scoreColor = s => s>=75?"var(--green)":s>=50?"var(--orange)":"var(--red)";

  return (
    <div style={{flex:1,overflow:"auto",padding:"clamp(10px,2vw,16px)"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6,flexWrap:"wrap"}}>
        <div style={{fontFamily:"var(--font-display)",fontWeight:800,fontSize:"clamp(14px,2.5vw,18px)",color:"#34D399"}}>🔎 Consensus Score</div>
        <div style={{fontSize:9,color:"var(--mu)"}}>— Fiabilité d'une affirmation par vote croisé de toutes tes IAs</div>
      </div>
      <div style={{fontSize:9,color:"var(--mu)",marginBottom:14,padding:"8px 12px",background:"rgba(52,211,153,.06)",border:"1px solid rgba(52,211,153,.15)",borderRadius:6}}>
        Colle une affirmation, un fait, ou la réponse d'une IA. Toutes tes IAs actives votent indépendamment. Plus le consensus est élevé, plus l'affirmation est fiable.
      </div>

      {/* Pré-remplir */}
      {lastResponses.length>0 && (
        <div style={{marginBottom:12,background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:8,padding:"10px 12px"}}>
          <div style={{fontSize:8,color:"var(--mu)",fontWeight:700,marginBottom:6}}>VÉRIFIER UNE RÉPONSE DU CHAT</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {lastResponses.map(r=>{
              const m=MODEL_DEFS[r.id];
              return <button key={r.id} onClick={()=>setClaim(r.text)}
                style={{padding:"4px 10px",borderRadius:8,border:"1px solid "+m.color+"44",background:m.color+"11",color:m.color,fontSize:8,cursor:"pointer"}}>
                {m.icon} Réponse {m.short}
              </button>;
            })}
          </div>
        </div>
      )}

      <textarea value={claim} onChange={e=>setClaim(e.target.value)}
        placeholder="Ex: La Terre est plus vieille que le Soleil. / Ex: colle ici la réponse d'une IA à vérifier…"
        rows={3} style={{width:"100%",background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:8,color:"var(--tx)",fontSize:11,padding:"10px 12px",resize:"vertical",outline:"none",boxSizing:"border-box",marginBottom:10}}/>

      <button onClick={runConsensus} disabled={loading||!claim.trim()||activeIds.length<2}
        style={{padding:"9px 22px",background:loading?"var(--s2)":"rgba(52,211,153,.15)",border:"1px solid "+(loading?"var(--bd)":"rgba(52,211,153,.4)"),borderRadius:6,color:loading?"var(--mu)":"#34D399",fontSize:10,cursor:loading?"default":"pointer",fontWeight:700,fontFamily:"var(--font-mono)",marginBottom:16}}>
        {loading?"🔎 Vote en cours…":"🔎 Lancer le vote de fiabilité"}
      </button>
      {activeIds.length<2&&<div style={{fontSize:9,color:"var(--red)",marginBottom:10}}>Active au moins 2 IAs pour le vote croisé</div>}

      {result && (
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {/* Score principal */}
          <div style={{padding:"16px 20px",background:"var(--s1)",border:"2px solid "+scoreColor(result.reliabilityScore)+"55",borderRadius:12,textAlign:"center"}}>
            <div style={{fontSize:48,fontWeight:900,color:scoreColor(result.reliabilityScore),fontFamily:"var(--font-display)",lineHeight:1}}>
              {result.reliabilityScore}%
            </div>
            <div style={{fontSize:12,color:"var(--tx)",marginTop:4,fontWeight:700}}>Score de fiabilité</div>
            <div style={{fontSize:10,color:verdictColor(result.topVerdict),marginTop:4,fontWeight:700}}>
              {verdictLabel(result.topVerdict)} · {result.consensusRate}% de consensus · Confiance moy. {result.avgConfidence}%
            </div>
            <div style={{marginTop:10,height:8,background:"var(--s2)",borderRadius:4,overflow:"hidden",maxWidth:300,margin:"10px auto 0"}}>
              <div style={{height:"100%",width:result.reliabilityScore+"%",background:scoreColor(result.reliabilityScore),borderRadius:4,transition:"width .8s"}}/>
            </div>
          </div>

          {/* Distribution des votes */}
          <div style={{background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:8,padding:"12px"}}>
            <div style={{fontSize:9,color:"var(--mu)",fontWeight:700,marginBottom:10}}>DISTRIBUTION DES VOTES ({result.total} IAs)</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {Object.entries(result.verdictCounts).filter(([,v])=>v>0).map(([verdict,count])=>(
                <div key={verdict} style={{flex:1,minWidth:80,padding:"8px",background:verdictColor(verdict)+"11",border:"1px solid "+verdictColor(verdict)+"33",borderRadius:8,textAlign:"center"}}>
                  <div style={{fontSize:18}}>{verdictLabel(verdict).split(" ")[0]}</div>
                  <div style={{fontSize:16,fontWeight:900,color:verdictColor(verdict)}}>{count}</div>
                  <div style={{fontSize:8,color:"var(--mu)",textTransform:"capitalize"}}>{verdict}</div>
                  <div style={{fontSize:9,color:verdictColor(verdict),fontWeight:700}}>{Math.round(count/result.total*100)}%</div>
                </div>
              ))}
            </div>
          </div>

          {/* Votes détaillés */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:8}}>
            {(result.votes||[]).map((v,i)=>{
              const m=MODEL_DEFS[v.id];
              if (!m) return null;
              return <div key={i} style={{background:"var(--s1)",border:"1px solid "+verdictColor(v.verdict)+"33",borderRadius:8,padding:"10px 12px"}}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:5}}>
                  <span style={{color:m.color,fontSize:12}}>{m.icon}</span>
                  <span style={{fontWeight:700,fontSize:10,color:m.color}}>{m.short}</span>
                  <span style={{marginLeft:"auto",padding:"2px 7px",borderRadius:8,background:verdictColor(v.verdict)+"22",color:verdictColor(v.verdict),fontSize:8,fontWeight:700}}>{verdictLabel(v.verdict)}</span>
                </div>
                <div style={{fontSize:9,color:"var(--mu)",marginBottom:4}}>Confiance : <span style={{color:v.confiance>70?"var(--green)":v.confiance>40?"var(--orange)":"var(--red)",fontWeight:700}}>{v.confiance}%</span></div>
                <div style={{fontSize:9,color:"var(--tx)",lineHeight:1.5}}>{v.raison}</div>
              </div>;
            })}
          </div>

          {/* Sources suggérées */}
          {(result.sources||[]).length>0 && (
            <div style={{background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:8,padding:"10px 12px"}}>
              <div style={{fontSize:8,color:"var(--mu)",fontWeight:700,marginBottom:6}}>📚 SOURCES SUGGÉRÉES POUR VÉRIFIER</div>
              {(result.sources||[]).map((s,i)=><div key={i} style={{fontSize:9,color:"var(--blue)",marginBottom:3}}>• {s}</div>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
