import React from "react";
import { MODEL_DEFS, PRICING } from "../config/models.js";

export default function StatsTab({ stats, onReset }) {
  const totalMsgs = Object.values(stats.msgs||{}).reduce((a,b)=>a+b,0);
  const totalTok = Object.values(stats.tokens||{}).reduce((a,b)=>a+b,0);
  const totalConvs = stats.convs || 0;
  const topIA = Object.entries(stats.msgs||{}).sort(([,a],[,b])=>b-a)[0];
  const maxTok = Math.max(...Object.values(stats.tokens||{}).map(v=>v||0),1);
  const [activeView, setActiveView] = React.useState("overview");

  const estimateCost = (id) => {
    const tok = stats.tokens?.[id] || 0;
    const p = PRICING[id];
    if (!p || !tok) return 0;
    return ((tok*0.7/1e6)*p.in + (tok*0.3/1e6)*p.out);
  };
  const totalCost = Object.keys(MODEL_DEFS).reduce((a,id)=>a+estimateCost(id),0);
  const fmtN = (n) => n>=1e6?(n/1e6).toFixed(1)+"M":n>=1000?(n/1000).toFixed(1)+"k":String(n||0);
  const fmtCost = (c) => c<0.01?"< $0.01":"$"+c.toFixed(3);

  // ── Données par heure ──────────────────────────────────────────
  const byHour = stats.byHour || {};
  const maxHour = Math.max(...Array.from({length:24},(_,h)=>byHour[h]||0),1);
  const peakHour = Array.from({length:24},(_,h)=>h).sort((a,b)=>(byHour[b]||0)-(byHour[a]||0))[0];
  // ── Données par jour (7 derniers jours) ────────────────────────
  const byDate = stats.byDate || {};
  const last7 = Array.from({length:7},(_,i)=>{
    const d = new Date(); d.setDate(d.getDate()-i);
    return d.toISOString().slice(0,10);
  }).reverse();
  const maxDay = Math.max(...last7.map(d=>byDate[d]||0),1);

  const views = [["overview","📊 Vue globale"],["heure","🕐 Par heure"],["jours","📅 7 jours"],["cout","💰 Coûts"]];

  return (
    <div className="stats-wrap">
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12,flexWrap:"wrap"}}>
        <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:"clamp(14px,2.5vw,18px)",color:"var(--tx)"}}>📊 Statistiques avancées</div>
        <button style={{marginLeft:"auto",padding:"5px 12px",background:"rgba(248,113,113,.1)",border:"1px solid rgba(248,113,113,.3)",borderRadius:5,color:"var(--red)",cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace",fontSize:9}}
          onClick={()=>{ if(window.confirm("Réinitialiser les statistiques ?")) onReset(); }}>↺ Réinitialiser</button>
      </div>
      {/* Sous-onglets */}
      <div style={{display:"flex",gap:4,marginBottom:14,flexWrap:"wrap"}}>
        {views.map(([v,l])=>(
          <button key={v} onClick={()=>setActiveView(v)}
            style={{padding:"5px 12px",borderRadius:12,border:"1px solid "+(activeView===v?"var(--ac)":"var(--bd)"),background:activeView===v?"rgba(212,168,83,.12)":"transparent",color:activeView===v?"var(--ac)":"var(--mu)",fontSize:9,cursor:"pointer",fontWeight:activeView===v?700:400}}>
            {l}
          </button>
        ))}
      </div>

      {activeView==="overview" && <>
        <div className="stats-grid">
          <div className="stat-card"><div className="stat-val">{totalConvs}</div><div className="stat-lbl">Conversations</div></div>
          <div className="stat-card"><div className="stat-val">{fmtN(totalMsgs)}</div><div className="stat-lbl">Messages</div></div>
          <div className="stat-card"><div className="stat-val">{fmtN(totalTok)}</div><div className="stat-lbl">Tokens</div></div>
          <div className="stat-card"><div className="stat-val">{fmtCost(totalCost)}</div><div className="stat-lbl">Coût estimé</div></div>
          {topIA && <div className="stat-card"><div className="stat-val">{MODEL_DEFS[topIA[0]]?.icon}</div><div className="stat-lbl">IA préférée</div><div className="stat-sub" style={{color:MODEL_DEFS[topIA[0]]?.color}}>{MODEL_DEFS[topIA[0]]?.short} — {topIA[1]} msg</div></div>}
          {peakHour!==undefined && <div className="stat-card"><div className="stat-val">{peakHour}h</div><div className="stat-lbl">Heure de pointe</div><div className="stat-sub">{byHour[peakHour]||0} messages</div></div>}
        </div>
        <div className="stats-bar-section">
          <div style={{fontSize:10,fontWeight:700,color:"var(--tx)",marginBottom:10,borderBottom:"1px solid var(--bd)",paddingBottom:6}}>Messages par IA</div>
          {Object.keys(MODEL_DEFS).map(id => {
            const m = MODEL_DEFS[id]; const count = stats.msgs?.[id]||0;
            const maxC = Math.max(...Object.values(stats.msgs||{}).map(v=>v||0),1);
            return (<div key={id} className="stats-bar-row">
              <div className="stats-bar-name" style={{color:m.color}}>{m.icon} {m.short}</div>
              <div className="stats-bar-track"><div className="stats-bar-fill" style={{width:(count/maxC*100)+"%",background:m.color}}/></div>
              <div className="stats-bar-val">{count} msg</div>
            </div>);
          })}
        </div>
      </>}

      {activeView==="heure" && (
        <div className="stats-bar-section">
          <div style={{fontSize:10,fontWeight:700,color:"var(--tx)",marginBottom:4,borderBottom:"1px solid var(--bd)",paddingBottom:6}}>Activité par heure de la journée</div>
          <div style={{fontSize:8,color:"var(--mu)",marginBottom:12}}>Heure de pointe : {peakHour}h ({byHour[peakHour]||0} messages)</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(12,1fr)",gap:4,marginBottom:8}}>
            {Array.from({length:24},(_,h)=>{
              const count = byHour[h]||0;
              const pct = Math.round((count/maxHour)*100);
              const isNow = new Date().getHours()===h;
              const isPeak = h===peakHour && count>0;
              return <div key={h} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
                <div style={{width:"100%",height:60,display:"flex",alignItems:"flex-end",background:"var(--s2)",borderRadius:"3px 3px 0 0",overflow:"hidden",border:isNow?"1px solid var(--ac)":"1px solid transparent"}}>
                  <div style={{width:"100%",height:pct+"%",background:isPeak?"var(--ac)":isNow?"rgba(212,168,83,.6)":"var(--blue)",transition:"height .3s",minHeight:count>0?4:0,opacity:count>0?1:.2}}/>
                </div>
                <span style={{fontSize:7,color:isNow?"var(--ac)":"var(--mu)",fontFamily:"var(--font-mono)"}}>{h}h</span>
                {count>0 && <span style={{fontSize:7,color:"var(--tx)"}}>{count}</span>}
              </div>;
            })}
          </div>
        </div>
      )}

      {activeView==="jours" && (
        <div className="stats-bar-section">
          <div style={{fontSize:10,fontWeight:700,color:"var(--tx)",marginBottom:4,borderBottom:"1px solid var(--bd)",paddingBottom:6}}>Activité — 7 derniers jours</div>
          <div style={{display:"flex",gap:8,alignItems:"flex-end",height:120,marginBottom:8,padding:"0 4px"}}>
            {last7.map(d=>{
              const count = byDate[d]||0;
              const pct = Math.round((count/maxDay)*100);
              const isToday = d===new Date().toISOString().slice(0,10);
              const label = new Date(d).toLocaleDateString("fr-FR",{weekday:"short",day:"numeric"});
              return <div key={d} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                <span style={{fontSize:8,color:"var(--tx)",fontWeight:700}}>{count>0?count:""}</span>
                <div style={{width:"100%",flex:1,display:"flex",alignItems:"flex-end",background:"var(--s2)",borderRadius:"4px 4px 0 0",overflow:"hidden",border:isToday?"1px solid var(--ac)":"none"}}>
                  <div style={{width:"100%",height:Math.max(pct,count>0?8:0)+"%",background:isToday?"var(--ac)":"var(--blue)",transition:"height .4s"}}/>
                </div>
                <span style={{fontSize:7,color:isToday?"var(--ac)":"var(--mu)",textAlign:"center",lineHeight:1.2}}>{label}</span>
              </div>;
            })}
          </div>
          <div style={{fontSize:8,color:"var(--mu)"}}>Total 7 jours : {last7.reduce((a,d)=>a+(byDate[d]||0),0)} messages</div>
        </div>
      )}

      {activeView==="cout" && (
        <div className="stats-bar-section">
          <div style={{fontSize:10,fontWeight:700,color:"var(--tx)",marginBottom:10,borderBottom:"1px solid var(--bd)",paddingBottom:6}}>Tokens & Coûts estimés par IA</div>
          {Object.keys(MODEL_DEFS).map(id => {
            const m = MODEL_DEFS[id]; const tok = stats.tokens?.[id]||0; const p = PRICING[id];
            return (<div key={id} className="stats-bar-row">
              <div className="stats-bar-name" style={{color:m.color}}>{m.icon} {m.short}</div>
              <div className="stats-bar-track"><div className="stats-bar-fill" style={{width:(tok/maxTok*100)+"%",background:m.color}}/></div>
              <div className="stats-bar-val">{fmtN(tok)}t · {fmtCost(estimateCost(id))}</div>
            </div>);
          })}
          <div style={{marginTop:10,paddingTop:8,borderTop:"1px solid var(--bd)",display:"flex",justifyContent:"space-between",fontSize:11,fontWeight:700}}>
            <span style={{color:"var(--tx)"}}>Total estimé</span><span style={{color:"var(--ac)"}}>{fmtCost(totalCost)}</span>
          </div>
          <div style={{marginTop:4,fontSize:8,color:"var(--mu)"}}>⚠️ Estimation approx. (70% input / 30% output). Claude est intégré donc sans coût API ici.</div>
        </div>
      )}
    </div>
  );
}
