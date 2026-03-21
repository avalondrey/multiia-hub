import React from 'react';
import { MODEL_DEFS } from "../config/models.js";
import { callModel } from "../api/ai-service.js";

export default function LiveDebateTimerTab({ enabled, apiKeys }) {
  const [topic, setTopic] = React.useState("");
  const [phase, setPhase] = React.useState("setup"); // setup|running|done
  const [rounds, setRounds] = React.useState([]);
  const nextRoundRef = React.useRef([]);
  const [currentRound, setCurrentRound] = React.useState(0);
  const [timer, setTimer] = React.useState(0);
  const [timerRunning, setTimerRunning] = React.useState(false);
  const [scores, setScores] = React.useState({});
  const [userVotes, setUserVotes] = React.useState([]);
  const [finalScore, setFinalScore] = React.useState(null);
  const [scoringIA, setScoringIA] = React.useState(null);
  const timerRef = React.useRef(null);

  const activeIds = Object.keys(MODEL_DEFS).filter(id => enabled[id] && !MODEL_DEFS[id]?.serial);
  const MAX_TOKENS = 300;
  const TIME_PER_ROUND = 90;

  const ROUND_STRUCTURE = [
    { label:"🎙 Ouverture",    role:"Pour",   desc:"Argumente EN FAVEUR de la proposition. Sois convaincant, concis, cite des faits. MAX 300 mots." },
    { label:"🎙 Ouverture",    role:"Contre", desc:"Argumente CONTRE la proposition. Démonte les arguments précédents. MAX 300 mots." },
    { label:"🔁 Réplique",     role:"Pour",   desc:"Réponds aux arguments adverses. Défends ta position et attaque les faiblesses de l'adversaire. MAX 250 mots." },
    { label:"🔁 Réplique",     role:"Contre", desc:"Réponds aux répliques. Renforce ta position avec des exemples concrets. MAX 250 mots." },
    { label:"🏁 Conclusion",   role:"Pour",   desc:"Conclusion finale POUR. Résume tes 3 arguments les plus forts. MAX 150 mots." },
    { label:"🏁 Conclusion",   role:"Contre", desc:"Conclusion finale CONTRE. Résume tes 3 contre-arguments. MAX 150 mots." },
  ];

  const QUICK_TOPICS = [
    "L'IA remplacera plus d'emplois qu'elle n'en créera d'ici 2030",
    "Les LLMs open source représentent un danger pour la société",
    "L'IA générative va tuer la créativité humaine",
    "Les réseaux sociaux font plus de mal que de bien",
    "Le travail à distance devrait être la norme par défaut",
    "La vie sur Mars est une priorité plus urgente que les problèmes terrestres",
  ];

  // Timer
  React.useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => {
        setTimer(t => {
          if (t <= 1) { clearInterval(timerRef.current); setTimerRunning(false); return 0; }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [timerRunning]);

  const startDebate = async () => {
    if (!topic.trim() || activeIds.length < 1) return;
    setPhase("running"); setRounds([]); setCurrentRound(0); setScores({}); setUserVotes([]); setFinalScore(null);
    const iaFor = activeIds[0];
    const iaAgainst = activeIds[1] || activeIds[0];
    await generateRound(0, iaFor, iaAgainst, []);
  };

  const generateRound = async (roundIdx, iaFor, iaAgainst, prevRounds) => {
    if (roundIdx >= ROUND_STRUCTURE.length) { setPhase("done"); return; }
    const roundDef = ROUND_STRUCTURE[roundIdx];
    const iaId = roundDef.role === "Pour" ? iaFor : iaAgainst;
    const m = MODEL_DEFS[iaId];
    setScoringIA(iaId);
    setTimer(TIME_PER_ROUND); setTimerRunning(true);

    const context = prevRounds.length > 0
      ? `\n\nÉchanges précédents :\n${prevRounds.map(r=>`[${r.role} — ${r.label}]: ${r.content.slice(0,200)}`).join("\n")}`
      : "";

    const prompt = `Débat Oxford sur : "${topic}"
Tu défends la position : ${roundDef.role==="Pour"?"EN FAVEUR":"CONTRE"}
${roundDef.desc}${context}

Commence directement par ton argument. Sois percutant et convaincant.`;

    try {
      const iaResponse = await callModel(iaId, [{role:"user",content:prompt}], apiKeys,
        `Tu es un débatteur expert. Tu défends la position "${roundDef.role==="Pour"?"POUR":"CONTRE"}" de façon convaincante et factuelle.`
      );
      const newRound = { roundIdx, label:roundDef.label, role:roundDef.role, iaId, iaName:m?.short||iaId, iaColor:m?.color||"#D4A853", content:iaResponse, ts:Date.now() };
      setRounds(prev => [...prev, newRound]);
      setScoringIA(null);
    } catch(e) {
      setRounds(prev => [...prev, { roundIdx, label:roundDef.label, role:roundDef.role, iaId, content:`❌ ${e.message}`, ts:Date.now() }]);
    }
    setCurrentRound(roundIdx+1);
  };

  const nextRound = async () => {
    if (currentRound >= ROUND_STRUCTURE.length) { await computeFinalScore(); return; }
    const iaFor = activeIds[0];
    const iaAgainst = activeIds[1] || activeIds[0];
    setRounds(prev => { nextRoundRef.current = prev; return prev; });
    await generateRound(currentRound, iaFor, iaAgainst, nextRoundRef.current || rounds);
  };

  const voteRound = (roundIdx, vote) => {
    setUserVotes(prev => {
      const filtered = prev.filter(v=>v.roundIdx!==roundIdx);
      return [...filtered, {roundIdx, vote}];
    });
  };

  const computeFinalScore = async () => {
    const judge = activeIds.find(id=>!activeIds.slice(0,2).includes(id)) || activeIds[activeIds.length-1] || activeIds[0];
    const transcript = rounds.map(r=>`[${r.role} — ${r.label}]:\n${r.content.slice(0,300)}`).join("\n\n");
    const userVotesSummary = userVotes.map(v=>`Tour ${v.roundIdx+1}: ${v.vote}`).join(", ");

    try {
      const reply = await callModel(judge, [{role:"user",content:`Tu es arbitre d'un débat Oxford sur : "${topic}"\n\nTranscript complet :\n${transcript}\n\nVotes du public : ${userVotesSummary||"aucun vote"}\n\nDécide du vainqueur. Réponds en JSON :\n{"winner":"Pour|Contre|Match nul","score_pour":7,"score_contre":6,"raison":"2 phrases","arguments_forts_pour":["arg1"],"arguments_forts_contre":["arg1"]}`}], apiKeys, "Arbitre objectif. JSON uniquement.");
      const clean = reply.replace(/```json|```/g,"").trim();
      const data = JSON.parse(clean.match(/\{[\s\S]*\}/)?.[0]||clean);
      setFinalScore(data);
    } catch(e) {
      setFinalScore({winner:"Match nul",score_pour:5,score_contre:5,raison:"Impossible de calculer le score : "+e.message});
    }
    setPhase("done");
  };

  const fmtTime = (s) => `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;
  const timerColor = timer > 30 ? "var(--green)" : timer > 10 ? "var(--orange)" : "var(--red)";

  return (
    <div style={{flex:1,overflow:"auto",padding:"clamp(10px,2vw,16px)"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6,flexWrap:"wrap"}}>
        <div style={{fontFamily:"var(--font-display)",fontWeight:800,fontSize:"clamp(14px,2.5vw,18px)",color:"#F59E0B"}}>⏱ Live Debate Timer</div>
        <div style={{fontSize:9,color:"var(--mu)"}}>— Format Oxford gamifié : 6 tours, timer, votes public, score final</div>
      </div>

      {phase==="setup" && (
        <>
          <textarea value={topic} onChange={e=>setTopic(e.target.value)}
            placeholder="La proposition à débattre…"
            rows={2} style={{width:"100%",background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:8,color:"var(--tx)",fontSize:11,padding:"10px 12px",resize:"vertical",outline:"none",boxSizing:"border-box",marginBottom:10}}/>
          <div style={{marginBottom:12}}>
            <div style={{fontSize:8,color:"var(--mu)",fontWeight:700,marginBottom:6}}>PROPOSITIONS RAPIDES</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {QUICK_TOPICS.map(t=>(
                <button key={t} onClick={()=>setTopic(t)}
                  style={{padding:"4px 10px",borderRadius:10,border:"1px solid var(--bd)",background:"var(--s1)",color:"var(--mu)",fontSize:8,cursor:"pointer"}}>
                  {t.slice(0,42)}{t.length>42?"…":""}
                </button>
              ))}
            </div>
          </div>
          <div style={{marginBottom:14,background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:8,padding:"10px 12px"}}>
            <div style={{fontSize:8,color:"var(--mu)",fontWeight:700,marginBottom:8}}>DÉBATTEURS</div>
            <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
              {[["🟢 POUR",activeIds[0]],["🔴 CONTRE",activeIds[1]||activeIds[0]]].map(([role,id])=>{
                const m=id?MODEL_DEFS[id]:null;
                return <div key={role} style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:10,fontWeight:700,color:role.includes("POUR")?"var(--green)":"var(--red)"}}>{role}</span>
                  <span style={{fontSize:10}}>{m?`${m.icon} ${m.short}`:"Aucune IA"}</span>
                </div>;
              })}
              {activeIds.length<2 && <div style={{fontSize:9,color:"var(--orange)"}}>⚠️ Active au moins 2 IAs pour un vrai débat</div>}
            </div>
            <div style={{marginTop:8,fontSize:8,color:"var(--mu)"}}>Format : 6 tours · Ouverture → Réplique → Conclusion · 90s par tour</div>
          </div>
          <button onClick={startDebate} disabled={!topic.trim()||!activeIds.length}
            style={{padding:"10px 24px",background:"rgba(245,158,11,.15)",border:"1px solid rgba(245,158,11,.4)",borderRadius:6,color:"#F59E0B",fontSize:11,cursor:"pointer",fontWeight:700}}>
            ⏱ Lancer le débat
          </button>
        </>
      )}

      {(phase==="running"||phase==="done") && (
        <div>
          <div style={{padding:"10px 14px",background:"var(--s1)",border:"1px solid rgba(245,158,11,.3)",borderRadius:8,marginBottom:12}}>
            <div style={{fontSize:8,color:"#F59E0B",fontWeight:700,marginBottom:2}}>PROPOSITION</div>
            <div style={{fontSize:11,fontWeight:700,color:"var(--tx)"}}>{topic}</div>
          </div>

          {phase==="running" && (
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14,padding:"10px 14px",background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:8,flexWrap:"wrap"}}>
              <div style={{fontSize:28,fontWeight:900,color:timerColor,fontFamily:"var(--font-mono)",minWidth:60}}>{fmtTime(timer)}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:8,color:"var(--mu)"}}>Tour {currentRound}/{ROUND_STRUCTURE.length}</div>
                {scoringIA && <div style={{fontSize:9,color:MODEL_DEFS[scoringIA]?.color}}>⏳ {MODEL_DEFS[scoringIA]?.short} rédige…</div>}
                <div style={{marginTop:4,height:4,background:"var(--s2)",borderRadius:2}}><div style={{height:"100%",width:`${(currentRound/ROUND_STRUCTURE.length)*100}%`,background:"#F59E0B",borderRadius:2,transition:"width .5s"}}/></div>
              </div>
              {!scoringIA && currentRound < ROUND_STRUCTURE.length && (
                <button onClick={nextRound}
                  style={{padding:"6px 16px",background:"rgba(245,158,11,.15)",border:"1px solid rgba(245,158,11,.4)",borderRadius:5,color:"#F59E0B",fontSize:9,cursor:"pointer",fontWeight:700}}>
                  ▶ Tour suivant
                </button>
              )}
              {!scoringIA && currentRound >= ROUND_STRUCTURE.length && !finalScore && (
                <button onClick={computeFinalScore}
                  style={{padding:"6px 16px",background:"rgba(212,168,83,.15)",border:"1px solid rgba(212,168,83,.4)",borderRadius:5,color:"var(--ac)",fontSize:9,cursor:"pointer",fontWeight:700}}>
                  🏆 Calculer le score
                </button>
              )}
            </div>
          )}

          <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
            {rounds.map((r,i)=>{
              const isPour = r.role==="Pour";
              const uVote = userVotes.find(v=>v.roundIdx===i);
              return (
                <div key={i} style={{background:"var(--s1)",border:"1px solid "+(isPour?"rgba(74,222,128,.2)":"rgba(248,113,113,.2)"),borderRadius:10,padding:"12px 14px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8,flexWrap:"wrap"}}>
                    <span style={{padding:"2px 8px",borderRadius:8,background:isPour?"rgba(74,222,128,.12)":"rgba(248,113,113,.12)",color:isPour?"var(--green)":"var(--red)",fontSize:8,fontWeight:700}}>{isPour?"🟢 POUR":"🔴 CONTRE"}</span>
                    <span style={{fontSize:9,color:"var(--mu)"}}>{r.label}</span>
                    <span style={{fontSize:8,color:r.iaColor||"var(--ac)",fontWeight:600,marginLeft:"auto"}}>{r.iaName}</span>
                  </div>
                  <div style={{fontSize:10,color:"var(--tx)",lineHeight:1.7}}>{r.content}</div>
                  <div style={{marginTop:8,display:"flex",gap:5,alignItems:"center"}}>
                    <span style={{fontSize:8,color:"var(--mu)"}}>Ton vote :</span>
                    {[["pour","🟢 Pour"],["contre","🔴 Contre"],["nul","⚖️ Nul"]].map(([v,l])=>(
                      <button key={v} onClick={()=>voteRound(i,v)}
                        style={{padding:"2px 8px",borderRadius:6,border:"1px solid "+(uVote?.vote===v?"var(--ac)":"var(--bd)"),background:uVote?.vote===v?"rgba(212,168,83,.12)":"transparent",color:uVote?.vote===v?"var(--ac)":"var(--mu)",fontSize:8,cursor:"pointer"}}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {finalScore && (
            <div style={{padding:"16px 20px",background:"var(--s1)",border:"2px solid rgba(245,158,11,.4)",borderRadius:12}}>
              <div style={{fontSize:9,color:"#F59E0B",fontWeight:700,marginBottom:10}}>🏆 VERDICT FINAL</div>
              <div style={{fontSize:22,fontWeight:900,color:"var(--ac)",fontFamily:"var(--font-display)",marginBottom:6}}>{finalScore.winner}</div>
              <div style={{display:"flex",gap:16,marginBottom:10}}>
                <div style={{textAlign:"center"}}><div style={{fontSize:20,fontWeight:900,color:"var(--green)"}}>{finalScore.score_pour}/10</div><div style={{fontSize:8,color:"var(--mu)"}}>POUR</div></div>
                <div style={{textAlign:"center"}}><div style={{fontSize:20,fontWeight:900,color:"var(--red)"}}>{finalScore.score_contre}/10</div><div style={{fontSize:8,color:"var(--mu)"}}>CONTRE</div></div>
                <div style={{textAlign:"center"}}><div style={{fontSize:20,fontWeight:900,color:"var(--ac)"}}>{userVotes.filter(v=>v.vote==="pour").length}/{userVotes.length}</div><div style={{fontSize:8,color:"var(--mu)"}}>Votes POUR</div></div>
              </div>
              <div style={{fontSize:10,color:"var(--tx)",lineHeight:1.6,marginBottom:10}}>{finalScore.raison}</div>
              <div style={{display:"flex",gap:10}}>
                {[["var(--green)","Arguments POUR",finalScore.arguments_forts_pour],["var(--red)","Arguments CONTRE",finalScore.arguments_forts_contre]].map(([c,l,args])=>args?.length>0&&(
                  <div key={l} style={{flex:1,padding:"8px 10px",background:c+"11",border:"1px solid "+c+"33",borderRadius:6}}>
                    <div style={{fontSize:7,color:c,fontWeight:700,marginBottom:4}}>{l}</div>
                    {args.map((a,i)=><div key={i} style={{fontSize:8,color:"var(--tx)",marginBottom:2}}>• {a}</div>)}
                  </div>
                ))}
              </div>
              <button onClick={()=>{setPhase("setup");setTopic("");setRounds([]);setCurrentRound(0);setFinalScore(null);setUserVotes([]);}}
                style={{marginTop:12,fontSize:9,padding:"5px 14px",background:"rgba(212,168,83,.1)",border:"1px solid rgba(212,168,83,.3)",borderRadius:5,color:"var(--ac)",cursor:"pointer"}}>
                + Nouveau débat
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
