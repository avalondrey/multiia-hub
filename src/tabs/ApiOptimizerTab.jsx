import React from 'react';
import { MODEL_DEFS, TOKEN_PRICE } from "../config/models.js";

export default function ApiOptimizerTab({ usageStats, enabled }) {
  const [recommendations, setRecommendations] = React.useState(null);

  React.useEffect(() => { computeRecommendations(); }, [usageStats]);

  const computeRecommendations = () => {
    const msgs    = usageStats?.msgs    || {};
    const tokens  = usageStats?.tokens  || {};
    const byHour  = usageStats?.byHour  || {};
    const totalMsgs = Object.values(msgs).reduce((a,b)=>a+b,0);
    if (totalMsgs === 0) { setRecommendations(null); return; }

    const recs = [];
    const costs = {};
    let totalSaved = 0;

    Object.entries(msgs).filter(([,v])=>v>0).forEach(([id, count]) => {
      const m = MODEL_DEFS[id];
      const tok = tokens[id]||0;
      const tp = TOKEN_PRICE[id];
      if (!m || !tp) return;
      const actualCost = (tok*0.7/1e6)*tp.in + (tok*0.3/1e6)*tp.out;
      costs[id] = { count, tok, actualCost };

      const avgTok = tok / count;

      if (avgTok < 500 && count > 10 && !["cerebras","gemma2"].includes(id) && enabled["cerebras"]) {
        const altCost = (tok*0.7/1e6)*0.1 + (tok*0.3/1e6)*0.1;
        const saving = actualCost - altCost;
        if (saving > 0.001) {
          recs.push({
            type:"speed", icon:"⚡", priority:"haute",
            title:`Tes ${count} messages courts sur ${m.short}`,
            detail:`Tes messages sont courts (≈ ${Math.round(avgTok)} tokens/msg). Cerebras traite ça 10× plus vite pour le même prix.`,
            suggestion:`Utilise Cerebras pour les requêtes rapides < 500 tokens`,
            saving, altId:"cerebras"
          });
          totalSaved += saving;
        }
      }

      if (id !== "mistral" && count > 5 && enabled["mistral"]) {
        recs.push({
          type:"quality", icon:"▲", priority:"moyenne",
          title:`Rédaction française avec ${m.short}`,
          detail:`Mistral Small est optimisé pour le français et coûte moins cher pour la rédaction.`,
          suggestion:`Pour tes textes en français, Mistral Small donne souvent de meilleurs résultats`,
          saving:null, altId:"mistral"
        });
      }

      if (avgTok > 3000 && count > 3 && id !== "cohere" && enabled["cohere"]) {
        recs.push({
          type:"rag", icon:"⌘", priority:"haute",
          title:`Tes ${count} longs messages sur ${m.short}`,
          detail:`Tes messages sont très longs (≈ ${Math.round(avgTok)} tokens). Cohere a un RAG natif avec citations — parfait pour l'analyse de documents.`,
          suggestion:`Pour les longs documents, utilise Cohere Command R+`,
          saving:null, altId:"cohere"
        });
      }
    });

    const peakHour = Object.entries(byHour).sort(([,a],[,b])=>b-a)[0];
    if (peakHour) {
      const h = parseInt(peakHour[0]);
      const groqLimited = h >= 8 && h <= 10;
      if (groqLimited) {
        recs.push({
          type:"timing", icon:"🕐", priority:"info",
          title:`Pic d'usage à ${h}h`,
          detail:`Tu utilises beaucoup l'app à ${h}h. C'est l'heure de pointe où Groq peut être rate-limited.`,
          suggestion:`Prépare tes prompts longs le matin et bascule sur Mistral si Groq est limité`,
          saving:null, altId:null
        });
      }
    }

    const totalActualCost = Object.values(costs).reduce((a,c)=>a+c.actualCost,0);

    setRecommendations({
      recs: recs.slice(0,6),
      totalActualCost,
      totalSaved,
      totalMsgs,
      costs,
      peakHour: peakHour?parseInt(peakHour[0]):null,
    });
  };

  const prioColor = p => ({haute:"var(--red)",moyenne:"var(--orange)",info:"var(--blue)"}[p]||"var(--mu)");
  const fmtCost = c => c<0.001?"< $0.001":"$"+c.toFixed(4);

  return (
    <div style={{flex:1,overflow:"auto",padding:"clamp(10px,2vw,16px)"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6,flexWrap:"wrap"}}>
        <div style={{fontFamily:"var(--font-display)",fontWeight:800,fontSize:"clamp(14px,2.5vw,18px)",color:"#4ADE80"}}>⚡ API Optimizer</div>
        <div style={{fontSize:9,color:"var(--mu)"}}>— Analyse ton usage et recommande les meilleures clés API</div>
      </div>
      <div style={{fontSize:9,color:"var(--mu)",marginBottom:14,padding:"8px 12px",background:"rgba(74,222,128,.06)",border:"1px solid rgba(74,222,128,.15)",borderRadius:6}}>
        Basé sur la taille de tes messages et le volume, l'optimiseur te suggère les changements de configuration pour réduire les coûts et améliorer la vitesse.
      </div>

      {!recommendations ? (
        <div style={{textAlign:"center",padding:40,color:"var(--mu)",fontSize:10}}>
          Pas assez de données. Utilise l'app normalement pendant quelques jours pour voir les recommandations.
        </div>
      ) : (
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {/* Résumé */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:8,marginBottom:6}}>
            <div style={{background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:8,padding:"12px",textAlign:"center"}}>
              <div style={{fontSize:20}}>💬</div>
              <div style={{fontSize:16,fontWeight:900,color:"var(--ac)",fontFamily:"var(--font-display)"}}>{recommendations.totalMsgs}</div>
              <div style={{fontSize:8,color:"var(--mu)"}}>Messages</div>
            </div>
            <div style={{background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:8,padding:"12px",textAlign:"center"}}>
              <div style={{fontSize:20}}>💰</div>
              <div style={{fontSize:16,fontWeight:900,color:"var(--orange)",fontFamily:"var(--font-display)"}}>{fmtCost(recommendations.totalActualCost)}</div>
              <div style={{fontSize:8,color:"var(--mu)"}}>Coût estimé</div>
            </div>
            {recommendations.totalSaved>0&&(
              <div style={{background:"rgba(74,222,128,.08)",border:"1px solid rgba(74,222,128,.3)",borderRadius:8,padding:"12px",textAlign:"center"}}>
                <div style={{fontSize:20}}>📈</div>
                <div style={{fontSize:16,fontWeight:900,color:"var(--green)",fontFamily:"var(--font-display)"}}>{fmtCost(recommendations.totalSaved)}</div>
                <div style={{fontSize:8,color:"var(--mu)"}}>Économies possibles</div>
              </div>
            )}
          </div>

          {/* Recommandations */}
          {recommendations.recs.map((rec,i)=>(
            <div key={i} style={{background:"var(--s1)",border:"1px solid "+prioColor(rec.priority)+"33",borderLeft:"3px solid "+prioColor(rec.priority),borderRadius:8,padding:"12px 14px"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                <span style={{fontSize:16}}>{rec.icon}</span>
                <span style={{fontSize:10,fontWeight:700,color:"var(--tx)",flex:1}}>{rec.title}</span>
                <span style={{padding:"2px 8px",borderRadius:8,background:prioColor(rec.priority)+"22",color:prioColor(rec.priority),fontSize:7,fontWeight:700}}>{rec.priority.toUpperCase()}</span>
              </div>
              <div style={{fontSize:9,color:"var(--mu)",marginBottom:5,lineHeight:1.5}}>{rec.detail}</div>
              {rec.saving!==null&&<div style={{fontSize:9,color:"var(--green)",fontStyle:"italic"}}>→ Économie estimée : {fmtCost(rec.saving)}</div>}
              <div style={{fontSize:9,color:"var(--ac)",marginTop:3}}>💡 {rec.suggestion}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
