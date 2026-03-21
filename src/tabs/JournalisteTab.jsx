import React from 'react';

export default function JournalisteTab({ enabled, apiKeys, ...anyOtherProps }) {
  const [subject, setSubject] = React.useState("");
  const [depth, setDepth] = React.useState("standard"); // rapide|standard|approfondi
  const [angles, setAngles] = React.useState([]);
  const [report, setReport] = React.useState(null);
  const [running, setRunning] = React.useState(false);
  const [phase, setPhase] = React.useState("idle"); // idle|planning|researching|writing|done

  const activeIds = Object.keys(MODEL_DEFS).filter(id => enabled[id] && !MODEL_DEFS[id]?.serial);
  const SAVED_KEY = "multiia_journalist_reports";
  const [savedReports, setSavedReports] = React.useState(() => { try { return JSON.parse(localStorage.getItem(SAVED_KEY)||"[]"); } catch { return []; } });
  const [viewReport, setViewReport] = React.useState(null);

  const ANGLES_PRESETS = {
    rapide:    ["📰 Faits essentiels", "🔍 Analyse critique", "🎯 Conclusions pratiques"],
    standard:  ["📰 Actualité & contexte", "📊 Données & chiffres", "🔍 Analyse experte", "🎯 Impact pratique", "🔮 Perspectives"],
    approfondi:["📰 Contexte historique", "📊 Données & sources", "🔍 Angles contradictoires", "🌍 Dimension internationale", "⚖️ Enjeux éthiques", "🎯 Applications concrètes", "🔮 Scénarios futurs"],
  };

  const QUICK_SUBJECTS = [
    "L'impact de l'IA générative sur l'emploi en 2026",
    "DeepSeek vs GPT-4 : qui domine vraiment ?",
    "Faut-il réguler les LLMs open source ?",
    "L'IA dans la santé : promesses et dangers",
    "Le marché des agents IA autonomes en 2026",
    "Mistral AI : l'espoir européen face à OpenAI",
  ];

  const generateReport = async () => {
    if (!subject.trim() || !activeIds.length) return;
    setRunning(true); setReport(null); setPhase("planning");
    const selectedAngles = ANGLES_PRESETS[depth];
    const numAngles = selectedAngles.length;
    const results = [];

    // Phase 1 : Chaque IA couvre un angle différent en parallèle
    setPhase("researching");
    await Promise.all(selectedAngles.map(async (angle, i) => {
      const iaId = activeIds[i % activeIds.length];
      const prompt = `Tu es un journaliste expert. Rédige une section d'article sur : "${subject}"

ANGLE ASSIGNÉ : ${angle}

Règles :
- 200-350 mots maximum
- Commence directement par le contenu (pas d'intro type "Dans cette section...")
- Inclus des faits concrets, des chiffres ou des exemples précis si possible
- Sois percutant et informatif
- Termine par 1 phrase de transition vers la suite`;

      try {
        const output = await callModel(iaId, [{role:"user", content:prompt}], apiKeys,
          `Tu es un journaliste expert spécialisé en ${angle.replace(/[^a-zA-ZÀ-ÿ\s]/g,"")}. Réponds directement avec le contenu.`
        );
        results[i] = { angle, iaId, output, ok:true };
      } catch(e) {
        results[i] = { angle, iaId, output:`⚠️ Erreur : ${e.message}`, ok:false };
      }
    }));

    // Phase 2 : IA rédactrice en chef assemble le rapport final
    setPhase("writing");
    const redacIa = activeIds.find(id => ["mistral","poll_claude","sambanova","groq"].includes(id)) || activeIds[0];
    const sections = results.map((r,i) => `### ${r.angle}\n${r.output}`).join("\n\n");

    const assemblPrompt = `Tu es rédacteur en chef. Voici les sections rédigées par différents journalistes sur : "${subject}"

${sections}

Assemble ces sections en un rapport journalistique cohérent et professionnel :
1. Ajoute un **titre accrocheur**
2. Écris un **chapeau** (2-3 phrases d'intro percutantes)
3. Intègre les sections en fluidifiant les transitions
4. Ajoute une **conclusion** avec les 3 points à retenir
5. Génère 3 **questions ouvertes** pour approfondir le sujet

Format Markdown propre.`;

    let finalReport = "";
    try {
      finalReport = await callModel(redacIa, [{role:"user", content:assemblPrompt}], apiKeys,
        "Tu es rédacteur en chef senior. Tu produis des rapports journalistiques clairs et percutants."
      );
    } catch(e) {
      finalReport = sections;
    }

    const reportObj = {
      id: Date.now().toString(),
      subject,
      depth,
      angles: selectedAngles,
      sections: results,
      finalReport,
      redacIa,
      date: new Date().toISOString(),
      ias: [...new Set(results.map(r=>r.iaId))],
    };

    setReport(reportObj);
    const updated = [reportObj, ...savedReports].slice(0, 10);
    setSavedReports(updated);
    try { localStorage.setItem(SAVED_KEY, JSON.stringify(updated)); } catch {}
    setPhase("done");
    setRunning(false);
  };

  const DEPTH_OPTIONS = [
    { id:"rapide",     label:"⚡ Flash",      desc:"3 angles · ~1 min", color:"#4ADE80" },
    { id:"standard",   label:"📰 Standard",   desc:"5 angles · ~2 min", color:"#60A5FA" },
    { id:"approfondi", label:"🔬 Approfondi", desc:"7 angles · ~4 min", color:"#A78BFA" },
  ];

  const PHASE_LABELS = {
    planning:"🧠 Analyse du sujet…", researching:"📰 Journalistes en cours…", writing:"✍️ Rédaction du rapport final…"
  };

  return (
    <div style={{flex:1,display:"flex",overflow:"hidden"}}>
      {/* Sidebar rapports sauvegardés */}
      {savedReports.length > 0 && (
        <div style={{width:180,flexShrink:0,borderRight:"1px solid var(--bd)",display:"flex",flexDirection:"column",overflow:"hidden",background:"var(--s1)"}}>
          <div style={{padding:"10px 12px",borderBottom:"1px solid var(--bd)",fontSize:8,color:"var(--mu)",fontWeight:700}}>RAPPORTS SAUVEGARDÉS</div>
          <div style={{flex:1,overflow:"auto"}}>
            {savedReports.map(r=>(
              <div key={r.id} onClick={()=>setViewReport(r.id===viewReport?null:r.id)}
                style={{padding:"8px 12px",cursor:"pointer",borderBottom:"1px solid var(--bd)",background:viewReport===r.id?"rgba(212,168,83,.08)":"transparent",borderLeft:"3px solid "+(viewReport===r.id?"var(--ac)":"transparent")}}>
                <div style={{fontSize:9,fontWeight:600,color:viewReport===r.id?"var(--ac)":"var(--tx)",lineHeight:1.3,marginBottom:2}}>{r.subject.slice(0,45)}{r.subject.length>45?"…":""}</div>
                <div style={{fontSize:7,color:"var(--mu)"}}>{new Date(r.date).toLocaleDateString("fr-FR")} · {r.angles.length} angles</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main */}
      <div style={{flex:1,overflow:"auto",padding:"clamp(10px,2vw,16px)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6,flexWrap:"wrap"}}>
          <div style={{fontFamily:"var(--font-display)",fontWeight:800,fontSize:"clamp(14px,2.5vw,18px)",color:"#60A5FA"}}>📰 IA Journaliste</div>
          <div style={{fontSize:9,color:"var(--mu)"}}>— Rapport complet multi-angles généré par tes IAs en équipe</div>
        </div>
        <div style={{fontSize:9,color:"var(--mu)",marginBottom:14,padding:"8px 12px",background:"rgba(96,165,250,.06)",border:"1px solid rgba(96,165,250,.15)",borderRadius:6}}>
          Chaque IA couvre un angle différent (faits, données, analyse, impact…) en parallèle. Une IA rédactrice en chef assemble le tout en un rapport professionnel.
        </div>

        {/* Rapport sauvegardé affiché */}
        {viewReport && (() => {
          const r = savedReports.find(x=>x.id===viewReport);
          if (!r) return null;
          return (
            <div>
              <div style={{display:"flex",gap:8,marginBottom:12,alignItems:"center"}}>
                <button onClick={()=>setViewReport(null)} style={{fontSize:9,padding:"4px 10px",background:"transparent",border:"1px solid var(--bd)",borderRadius:5,color:"var(--mu)",cursor:"pointer"}}>← Retour</button>
                <button onClick={()=>navigator.clipboard.writeText(r.finalReport)} style={{fontSize:9,padding:"4px 10px",background:"rgba(212,168,83,.1)",border:"1px solid rgba(212,168,83,.3)",borderRadius:5,color:"var(--ac)",cursor:"pointer"}}>📋 Copier</button>
                <button onClick={()=>{setSavedReports(prev=>{const u=prev.filter(x=>x.id!==viewReport);try{localStorage.setItem(SAVED_KEY,JSON.stringify(u));}catch{}return u;});setViewReport(null);}} style={{fontSize:9,padding:"4px 10px",background:"rgba(248,113,113,.1)",border:"1px solid rgba(248,113,113,.3)",borderRadius:5,color:"var(--red)",cursor:"pointer"}}>🗑</button>
              </div>
              <div style={{background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:10,padding:"16px",fontSize:10,lineHeight:1.8,color:"var(--tx)",whiteSpace:"pre-wrap"}}>{r.finalReport}</div>
            </div>
          );
        })()}

        {/* Formulaire */}
        {!viewReport && !running && !report && (
          <>
            <textarea value={subject} onChange={e=>setSubject(e.target.value)}
              placeholder="Sur quel sujet veux-tu un rapport complet ?"
              rows={3} style={{width:"100%",background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:8,color:"var(--tx)",fontSize:11,padding:"10px 12px",resize:"vertical",outline:"none",boxSizing:"border-box",marginBottom:10}}/>

            {/* Exemples */}
            <div style={{marginBottom:12}}>
              <div style={{fontSize:8,color:"var(--mu)",fontWeight:700,marginBottom:6}}>SUJETS POPULAIRES</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {QUICK_SUBJECTS.map(s=>(
                  <button key={s} onClick={()=>setSubject(s)}
                    style={{padding:"4px 10px",borderRadius:10,border:"1px solid var(--bd)",background:"var(--s1)",color:"var(--mu)",fontSize:8,cursor:"pointer"}}>
                    {s.slice(0,40)}{s.length>40?"…":""}
                  </button>
                ))}
              </div>
            </div>

            {/* Profondeur */}
            <div style={{marginBottom:14}}>
              <div style={{fontSize:8,color:"var(--mu)",fontWeight:700,marginBottom:6}}>PROFONDEUR D'ANALYSE</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {DEPTH_OPTIONS.map(d=>(
                  <button key={d.id} onClick={()=>setDepth(d.id)}
                    style={{flex:1,minWidth:100,padding:"10px 12px",borderRadius:8,border:"2px solid "+(depth===d.id?d.color:"var(--bd)"),background:depth===d.id?d.color+"15":"transparent",cursor:"pointer",textAlign:"center",transition:"all .15s"}}>
                    <div style={{fontSize:11,fontWeight:700,color:depth===d.id?d.color:"var(--tx)"}}>{d.label}</div>
                    <div style={{fontSize:8,color:"var(--mu)",marginTop:2}}>{d.desc}</div>
                    <div style={{marginTop:6,display:"flex",gap:3,justifyContent:"center"}}>
                      {ANGLES_PRESETS[d.id].map((a,i)=>(
                        <div key={i} style={{width:6,height:6,borderRadius:"50%",background:depth===d.id?d.color:"var(--bd)"}}/>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* IAs assignées */}
            <div style={{marginBottom:14,background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:8,padding:"10px 12px"}}>
              <div style={{fontSize:8,color:"var(--mu)",fontWeight:700,marginBottom:6}}>IAs ASSIGNÉES AUX ANGLES</div>
              <div style={{display:"flex",flexDirection:"column",gap:4}}>
                {ANGLES_PRESETS[depth].map((angle,i)=>{
                  const iaId = activeIds[i%activeIds.length];
                  const m = iaId ? MODEL_DEFS[iaId] : null;
                  return (
                    <div key={i} style={{display:"flex",alignItems:"center",gap:8,fontSize:9}}>
                      <span style={{width:160,color:"var(--tx)"}}>{angle}</span>
                      <span style={{color:"var(--bd)"}}>→</span>
                      {m ? <span style={{color:m.color,fontWeight:700}}>{m.icon} {m.short}</span> : <span style={{color:"var(--red)"}}>Aucune IA active</span>}
                    </div>
                  );
                })}
              </div>
            </div>

            <button onClick={generateReport} disabled={!subject.trim()||!activeIds.length}
              style={{padding:"10px 24px",background:"rgba(96,165,250,.15)",border:"1px solid rgba(96,165,250,.4)",borderRadius:6,color:"#60A5FA",fontSize:11,cursor:"pointer",fontWeight:700,fontFamily:"var(--font-mono)"}}>
              📰 Lancer la rédaction en équipe
            </button>
          </>
        )}

        {/* Loading */}
        {running && (
          <div style={{textAlign:"center",padding:"50px 20px"}}>
            <div style={{fontSize:32,marginBottom:12,display:"inline-block",animation:"spin 2s linear infinite"}}>📰</div>
            <div style={{fontSize:13,fontWeight:700,color:"var(--tx)",marginBottom:6}}>{PHASE_LABELS[phase]}</div>
            <div style={{display:"flex",gap:6,justifyContent:"center",flexWrap:"wrap",marginTop:12}}>
              {ANGLES_PRESETS[depth].map((a,i)=>(
                <div key={i} style={{fontSize:8,padding:"4px 10px",borderRadius:8,background:"var(--s1)",border:"1px solid var(--bd)",color:"var(--mu)"}}>{a}</div>
              ))}
            </div>
          </div>
        )}

        {/* Rapport généré */}
        {report && !running && !viewReport && (
          <div>
            <div style={{display:"flex",gap:8,marginBottom:12,alignItems:"center",flexWrap:"wrap"}}>
              <div style={{fontSize:9,color:"var(--mu)"}}>
                {(report.ias||[]).map(id=>MODEL_DEFS[id]?.icon+""+MODEL_DEFS[id]?.short).join(" · ")}
                <span style={{marginLeft:6}}>· {report.angles.length} angles couverts</span>
              </div>
              <div style={{marginLeft:"auto",display:"flex",gap:6}}>
                <button onClick={()=>navigator.clipboard.writeText(report.finalReport)} style={{fontSize:9,padding:"4px 10px",background:"rgba(212,168,83,.1)",border:"1px solid rgba(212,168,83,.3)",borderRadius:5,color:"var(--ac)",cursor:"pointer"}}>📋 Copier</button>
                <button onClick={()=>{setReport(null);setSubject("");setPhase("idle");}} style={{fontSize:9,padding:"4px 10px",background:"transparent",border:"1px solid var(--bd)",borderRadius:5,color:"var(--mu)",cursor:"pointer"}}>+ Nouveau rapport</button>
              </div>
            </div>
            <div style={{background:"var(--s1)",border:"1px solid rgba(96,165,250,.2)",borderRadius:10,padding:"16px",fontSize:10,lineHeight:1.9,color:"var(--tx)",whiteSpace:"pre-wrap"}}>{report.finalReport}</div>
          </div>
        )}
      </div>
    </div>
  );
}
