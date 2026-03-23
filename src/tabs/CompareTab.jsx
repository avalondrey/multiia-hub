import React from "react";

export default function CompareTab({
  voteHistory, setVoteHistory,
  IDS, MODEL_DEFS, enabled,
  setDiffIA1, setDiffIA2, setDiffModal,
  setBestVote, setShowVoteDetail, navigateTab,
}) {
  return (
    <div style={{flex:1,overflow:"auto",padding:16,display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:2}}>
        <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:14,color:"var(--ac)",letterSpacing:1}}>⚖ COMPARAISON</div>
        {IDS.filter(id=>enabled[id]).length>=2&&(
          <button onClick={()=>{const ids=IDS.filter(id=>enabled[id]);setDiffIA1(ids[0]);setDiffIA2(ids[1]);setDiffModal(true);}} style={{marginLeft:"auto",fontSize:8,padding:"3px 10px",background:"rgba(74,222,128,.1)",border:"1px solid rgba(74,222,128,.3)",borderRadius:5,color:"var(--green)",cursor:"pointer"}}>⚡ Diff dernières réponses</button>
        )}
      </div>
      <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:14,color:"var(--ac)",letterSpacing:1}}>📊 HISTORIQUE DES COMPARAISONS</div>
      {voteHistory.length === 0 ? (
        <div style={{textAlign:"center",color:"var(--mu)",fontSize:11,padding:40}}>
          Aucune comparaison encore.<br/>
          <span style={{fontSize:9}}>Active 2+ IAs et envoie un message → le jury notera automatiquement.</span>
        </div>
      ) : (<>
        {/* Win rate cumulé */}
        <div style={{background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:8,padding:"12px 16px"}}>
          <div style={{fontSize:10,fontWeight:700,color:"var(--tx)",marginBottom:10,fontFamily:"'Syne',sans-serif"}}>🏆 CLASSEMENT CUMULÉ — {voteHistory.length} verdicts</div>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {(() => {
              const wins = {}; const totals = {}; const counts = {};
              IDS.forEach(id => { wins[id]=0; totals[id]=0; counts[id]=0; });
              voteHistory.forEach(v => {
                if(v.winner) wins[v.winner]=(wins[v.winner]||0)+1;
                Object.entries(v.scores||{}).forEach(([id,sc])=>{ const t=typeof sc==="object"?sc.total:sc; if(t){totals[id]=(totals[id]||0)+t; counts[id]=(counts[id]||0)+1;} });
              });
              const sorted = IDS.filter(id=>wins[id]||counts[id]).sort((a,b)=>wins[b]-wins[a]);
              const maxWins = Math.max(...sorted.map(id=>wins[id]),1);
              return sorted.map((id,i)=>{
                const m=MODEL_DEFS[id];
                const avgScore = counts[id]>0?(totals[id]/counts[id]).toFixed(1):"-";
                const winRate = voteHistory.length>0?Math.round(wins[id]/voteHistory.length*100):0;
                return (
                  <div key={id} style={{display:"flex",alignItems:"center",gap:10}}>
                    <span style={{fontSize:12,width:20}}>{["🥇","🥈","🥉"][i]||"  "}</span>
                    <span style={{width:80,fontSize:10,fontWeight:700,color:m.color,fontFamily:"'Syne',sans-serif"}}>{m.icon} {m.short}</span>
                    <div style={{flex:1,height:12,background:"var(--s2)",borderRadius:6,overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${(wins[id]/maxWins)*100}%`,background:m.color,borderRadius:6,transition:"width .5s",display:"flex",alignItems:"center",justifyContent:"flex-end",paddingRight:4}}>
                      </div>
                    </div>
                    <span style={{fontSize:9,color:m.color,width:50,textAlign:"right",fontWeight:700}}>{wins[id]} victoire{wins[id]!==1?"s":""}</span>
                    <span style={{fontSize:9,color:"var(--mu)",width:40,textAlign:"right"}}>{winRate}%</span>
                    <span style={{fontSize:9,color:"var(--ac)",width:50,textAlign:"right"}}>⌀ {avgScore}/10</span>
                  </div>
                );
              });
            })()}
          </div>
        </div>
        {/* Liste des verdicts */}
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          <div style={{fontSize:10,fontWeight:700,color:"var(--tx)",fontFamily:"'Syne',sans-serif"}}>📋 TOUS LES VERDICTS</div>
          {[...voteHistory].reverse().map((v,i)=>{
            const wm = MODEL_DEFS[v.winner];
            const ranking = v.ranking||[v.winner];
            const medals = ["🥇","🥈","🥉"];
            return (
              <div key={i} style={{background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:6,padding:"8px 12px",display:"flex",gap:10,alignItems:"flex-start"}}>
                <div style={{flexShrink:0,textAlign:"center"}}>
                  <div style={{fontSize:16}}>🏆</div>
                  <div style={{fontSize:7,color:"var(--mu)",marginTop:2}}>{v.ts?new Date(v.ts).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}):""}</div>
                </div>
                <div style={{flex:1,minWidth:0}}>
                  {v.question && <div style={{fontSize:9,color:"var(--mu)",marginBottom:4,fontStyle:"italic"}}>« {v.question}… »</div>}
                  <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:4}}>
                    {ranking.slice(0,3).map((id,ri)=>{ const m=MODEL_DEFS[id]; const sc=v.scores?.[id]; const tot=typeof sc==="object"?sc?.total:sc; return (
                      <span key={id} style={{fontSize:9,background:`${m?.color||"#888"}18`,border:`1px solid ${m?.color||"#888"}35`,borderRadius:4,padding:"2px 7px",color:m?.color||"var(--tx)"}}>
                        {medals[ri]} {m?.icon} {m?.short} {tot?`· ${typeof tot==="number"?tot.toFixed(1):tot}/10`:""}
                      </span>
                    );})}
                  </div>
                  <div style={{fontSize:9,color:"var(--mu)",fontFamily:"'IBM Plex Mono',monospace"}}>{v.reason}</div>
                </div>
                <button onClick={()=>{setBestVote(v);setShowVoteDetail(true);setShowVoteDetail(false);navigateTab("chat");}} style={{flexShrink:0,fontSize:8,padding:"3px 8px",background:"rgba(212,168,83,.1)",border:"1px solid rgba(212,168,83,.3)",borderRadius:4,color:"var(--ac)",cursor:"pointer"}}>↩ Revoir</button>
              </div>
            );
          })}
        </div>
        <button onClick={()=>setVoteHistory([])} style={{alignSelf:"flex-start",fontSize:9,padding:"5px 12px",background:"rgba(248,113,113,.1)",border:"1px solid rgba(248,113,113,.3)",borderRadius:5,color:"var(--red)",cursor:"pointer"}}>🗑 Effacer l'historique</button>
      </>)}
    </div>
  );
}
