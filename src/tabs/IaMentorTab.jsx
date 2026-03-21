import React from 'react';
import { MODEL_DEFS } from '../config/models.js';
import { callModel } from '../api/ai-service.js';

export default function IaMentorTab({ enabled, apiKeys }) {
  const MENTOR_KEY = "multiia_mentor_sessions";
  const [sessions, setSessions] = React.useState(() => { try { return JSON.parse(localStorage.getItem(MENTOR_KEY)||"[]"); } catch { return []; } });
  const [activeSession, setActiveSession] = React.useState(null);
  const [creating, setCreating] = React.useState(false);
  const [topic, setTopic] = React.useState("");
  const [level, setLevel] = React.useState("débutant");
  const [sessionCount, setSessionCount] = React.useState(6);
  const [generating, setGenerating] = React.useState(false);
  const [currentStep, setCurrentStep] = React.useState(null); // {type:"lesson"|"exercise"|"quiz", content, answer:"", result}
  const [stepLoading, setStepLoading] = React.useState(false);
  const [userAnswer, setUserAnswer] = React.useState("");

  const saveS = (s) => { setSessions(s); try { localStorage.setItem(MENTOR_KEY, JSON.stringify(s)); } catch {} };
  const activeIds = Object.keys(MODEL_DEFS).filter(id => enabled[id] && !MODEL_DEFS[id]?.serial);
  const judge = activeIds.find(id=>["groq","mistral","cerebras","sambanova"].includes(id)) || activeIds[0];

  const createSession = async () => {
    if (!topic.trim() || !judge) return;
    setGenerating(true);
    const prompt = `Tu es un pédagogue expert. Crée un programme d'apprentissage de ${sessionCount} sessions pour apprendre : "${topic}" (niveau ${level}).

Réponds UNIQUEMENT en JSON valide :
{
  "titre": "titre du programme",
  "description": "2 phrases de description",
  "objectif_final": "ce que l'apprenant saura faire à la fin",
  "sessions": [
    {
      "num": 1,
      "titre": "titre de la session",
      "objectif": "objectif de cette session",
      "concepts": ["concept 1","concept 2"],
      "duree_min": 15
    }
  ]
}`;
    try {
      const reply = await callModel(judge, [{role:"user",content:prompt}], apiKeys, "Pédagogue expert. JSON uniquement.");
      const clean = reply.replace(/```json|```/g,"").trim();
      const data = JSON.parse(clean.match(/\{[\s\S]*\}/)?.[0]||clean);
      const session = {
        id: Date.now().toString(),
        topic, level, createdAt: new Date().toISOString(),
        ...data,
        sessions: (data.sessions||[]).map(s=>({...s, completed:false, score:null})),
        currentSession: 0,
        xp: 0,
      };
      const updated = [session, ...sessions];
      saveS(updated);
      setActiveSession(session.id);
      setCreating(false); setTopic("");
    } catch(e) { alert("Erreur : "+e.message); }
    setGenerating(false);
  };

  const launchStep = async (session, stepType) => {
    if (!judge) return;
    setStepLoading(true); setCurrentStep(null); setUserAnswer("");
    const sess = session.sessions[session.currentSession];
    const prompts = {
      lesson: `Tu es un professeur expert en "${session.topic}". Donne une leçon complète sur : "${sess.titre}" pour niveau ${session.level}.
Structure : 1) Explication claire (avec analogies), 2) Exemple concret, 3) Résumé en 3 points clés. Maximum 400 mots.`,
      exercise: `Crée un exercice pratique sur "${sess.titre}" pour niveau ${session.level}.
Format : Présente l'exercice clairement, sans donner la solution. Termine par "Ta réponse :"`,
      quiz: `Crée une question de quiz à choix multiples (A/B/C/D) sur "${sess.titre}".
Format : La question, puis A) B) C) D). Termine par "Ta réponse (A/B/C/D) :"`
    };
    try {
      const reply = await callModel(judge, [{role:"user",content:prompts[stepType]}], apiKeys, `Tu es un mentor pédagogue expert en "${session.topic}".`);
      setCurrentStep({ type:stepType, content:reply, answer:"", result:null, sessInfo:sess });
    } catch(e) { setCurrentStep({ type:stepType, content:"Erreur : "+e.message, answer:"", result:null }); }
    setStepLoading(false);
  };

  const submitAnswer = async () => {
    if (!currentStep || !userAnswer.trim() || !judge) return;
    setStepLoading(true);
    const evalPrompt = `L'apprenant a répondu à cet ${currentStep.type==="quiz"?"quiz":"exercice"} :

CONTENU : ${currentStep.content}
RÉPONSE DE L'APPRENANT : ${userAnswer}

Évalue la réponse. Réponds en JSON :
{"correct":true/false,"score":0-10,"feedback":"explication en 2-3 phrases","points_forts":["..."],"a_ameliorer":["..."],"bonne_reponse":"la réponse correcte complète"}`;
    try {
      const reply = await callModel(judge, [{role:"user",content:evalPrompt}], apiKeys, "Évaluateur pédagogique. JSON uniquement.");
      const clean = reply.replace(/```json|```/g,"").trim();
      const eval_ = JSON.parse(clean.match(/\{[\s\S]*\}/)?.[0]||clean);
      setCurrentStep(prev=>({...prev, result:eval_, answer:userAnswer}));
      // Update session XP + progression
      const xpGained = eval_.correct ? 30 : 10;
      setSessions(prev => {
        const updated = prev.map(s => {
          if (s.id !== activeSession) return s;
          return { ...s, xp: (s.xp||0) + xpGained };
        });
        saveS(updated);
        return updated;
      });
    } catch(e) { setCurrentStep(prev=>({...prev, result:{correct:false, feedback:"Erreur d'évaluation : "+e.message, score:0}})); }
    setStepLoading(false);
  };

  const completeSession = () => {
    setSessions(prev => {
      const updated = prev.map(s => {
        if (s.id !== activeSession) return s;
        const newSessions = s.sessions.map((sess,i) => i===s.currentSession ? {...sess, completed:true, score: currentStep?.result?.score||5} : sess);
        const nextIdx = Math.min(s.currentSession+1, s.sessions.length-1);
        return { ...s, sessions:newSessions, currentSession:nextIdx, xp:(s.xp||0)+50 };
      });
      saveS(updated);
      return updated;
    });
    setCurrentStep(null); setUserAnswer("");
  };

  const active = sessions.find(s=>s.id===activeSession);
  const levels = ["débutant","intermédiaire","avancé","expert"];

  return (
    <div style={{flex:1,display:"flex",overflow:"hidden"}}>
      {/* Sidebar sessions */}
      <div style={{width:200,flexShrink:0,borderRight:"1px solid var(--bd)",display:"flex",flexDirection:"column",overflow:"hidden",background:"var(--s1)"}}>
        <div style={{padding:"10px 12px",borderBottom:"1px solid var(--bd)"}}>
          <div style={{fontFamily:"var(--font-display)",fontWeight:800,fontSize:12,color:"var(--ac)",marginBottom:8}}>🎓 IA Mentor</div>
          <button onClick={()=>setCreating(true)}
            style={{width:"100%",padding:"6px 10px",background:"rgba(212,168,83,.15)",border:"1px solid rgba(212,168,83,.4)",borderRadius:5,color:"var(--ac)",fontSize:9,cursor:"pointer",fontWeight:700}}>
            + Nouveau programme
          </button>
        </div>
        <div style={{flex:1,overflow:"auto"}}>
          {sessions.length===0&&<div style={{padding:16,fontSize:9,color:"var(--mu)",textAlign:"center"}}>Aucun programme</div>}
          {sessions.map(s=>{
            const done = s.sessions?.filter(x=>x.completed).length||0;
            const total = s.sessions?.length||0;
            const pct = total>0?Math.round(done/total*100):0;
            return <div key={s.id} onClick={()=>{setActiveSession(s.id);setCreating(false);setCurrentStep(null);}}
              style={{padding:"9px 12px",cursor:"pointer",borderBottom:"1px solid var(--bd)",background:activeSession===s.id?"rgba(212,168,83,.08)":"transparent",borderLeft:"3px solid "+(activeSession===s.id?"var(--ac)":"transparent")}}>
              <div style={{fontSize:10,fontWeight:600,color:activeSession===s.id?"var(--ac)":"var(--tx)",marginBottom:3}}>{s.titre||s.topic}</div>
              <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:3}}>
                <div style={{flex:1,height:3,background:"var(--s2)",borderRadius:2}}><div style={{height:"100%",width:pct+"%",background:"var(--green)",borderRadius:2}}/></div>
                <span style={{fontSize:7,color:"var(--mu)"}}>{pct}%</span>
              </div>
              <div style={{fontSize:7,color:"var(--mu)"}}>{s.level} · ⚡{s.xp||0} XP · {done}/{total}</div>
            </div>;
          })}
        </div>
      </div>

      {/* Main */}
      <div style={{flex:1,overflow:"auto",padding:"14px 16px"}}>
        {/* Créer un programme */}
        {creating && (
          <div style={{maxWidth:500}}>
            <div style={{fontWeight:700,fontSize:14,color:"var(--ac)",marginBottom:14,fontFamily:"var(--font-display)"}}>🆕 Nouveau programme d'apprentissage</div>
            <div style={{marginBottom:10}}>
              <div style={{fontSize:8,color:"var(--mu)",fontWeight:700,marginBottom:5}}>JE VEUX APPRENDRE</div>
              <input value={topic} onChange={e=>setTopic(e.target.value)} placeholder="Ex: Python, Marketing digital, Photographie…"
                style={{width:"100%",background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:6,color:"var(--tx)",fontSize:11,padding:"8px 11px",outline:"none",boxSizing:"border-box"}}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
              <div>
                <div style={{fontSize:8,color:"var(--mu)",fontWeight:700,marginBottom:5}}>MON NIVEAU</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                  {levels.map(l=><button key={l} onClick={()=>setLevel(l)}
                    style={{padding:"4px 9px",borderRadius:10,border:"1px solid "+(level===l?"var(--ac)":"var(--bd)"),background:level===l?"rgba(212,168,83,.12)":"transparent",color:level===l?"var(--ac)":"var(--mu)",fontSize:8,cursor:"pointer"}}>{l}</button>)}
                </div>
              </div>
              <div>
                <div style={{fontSize:8,color:"var(--mu)",fontWeight:700,marginBottom:5}}>NOMBRE DE SESSIONS</div>
                <div style={{display:"flex",gap:4}}>
                  {[4,6,8,10].map(n=><button key={n} onClick={()=>setSessionCount(n)}
                    style={{flex:1,padding:"4px",borderRadius:6,border:"1px solid "+(sessionCount===n?"var(--ac)":"var(--bd)"),background:sessionCount===n?"rgba(212,168,83,.12)":"transparent",color:sessionCount===n?"var(--ac)":"var(--mu)",fontSize:9,cursor:"pointer"}}>{n}</button>)}
                </div>
              </div>
            </div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={createSession} disabled={generating||!topic.trim()||!judge}
                style={{flex:1,padding:"8px",background:"rgba(212,168,83,.15)",border:"1px solid rgba(212,168,83,.4)",borderRadius:6,color:"var(--ac)",fontSize:10,cursor:"pointer",fontWeight:700}}>
                {generating?"⏳ Génération du programme…":"✨ Créer le programme"}
              </button>
              <button onClick={()=>setCreating(false)} style={{padding:"8px 14px",background:"transparent",border:"1px solid var(--bd)",borderRadius:6,color:"var(--mu)",fontSize:10,cursor:"pointer"}}>Annuler</button>
            </div>
          </div>
        )}

        {/* Session active */}
        {active && !creating && (
          <>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12,flexWrap:"wrap"}}>
              <div style={{fontFamily:"var(--font-display)",fontWeight:800,fontSize:15,color:"var(--tx)"}}>{active.titre}</div>
              <div style={{marginLeft:"auto",display:"flex",gap:8,alignItems:"center"}}>
                <span style={{fontSize:9,color:"var(--green)",fontWeight:700}}>⚡ {active.xp} XP</span>
                <span style={{fontSize:9,color:"var(--mu)"}}>{active.sessions?.filter(s=>s.completed).length||0}/{active.sessions?.length||0} sessions</span>
              </div>
            </div>
            {/* Barre de progression globale */}
            <div style={{marginBottom:14}}>
              <div style={{height:6,background:"var(--s2)",borderRadius:3,overflow:"hidden"}}>
                <div style={{height:"100%",width:((active.sessions?.filter(s=>s.completed).length||0)/(active.sessions?.length||1)*100)+"%",background:"var(--green)",borderRadius:3,transition:"width .5s"}}/>
              </div>
            </div>
            {/* Sessions roadmap */}
            <div style={{display:"flex",gap:6,marginBottom:16,overflowX:"auto",paddingBottom:4}}>
              {active.sessions?.map((s,i)=>(
                <div key={i} style={{flexShrink:0,width:110,padding:"8px 10px",borderRadius:8,border:"2px solid "+(i===active.currentSession?"var(--ac)":s.completed?"var(--green)":"var(--bd)"),background:i===active.currentSession?"rgba(212,168,83,.08)":s.completed?"rgba(74,222,128,.06)":"var(--s1)",cursor:"pointer",opacity: i > active.currentSession + 1 ? 0.6 : 1}}
                  onClick={()=>{setSessions(prev=>{const u=prev.map(x=>x.id===active.id?{...x,currentSession:i}:x);saveS(u);return u;});setCurrentStep(null);}}>
                  <div style={{fontSize:9,color:s.completed?"var(--green)":i===active.currentSession?"var(--ac)":"var(--mu)",fontWeight:700,marginBottom:2}}>{s.completed?"✓":i===active.currentSession?"▶":"○"} S{i+1}</div>
                  <div style={{fontSize:8,color:"var(--tx)",lineHeight:1.3}}>{s.titre}</div>
                  {s.score!==null&&<div style={{fontSize:7,color:"var(--ac)",marginTop:2}}>★ {s.score}/10</div>}
                </div>
              ))}
            </div>

            {/* Session courante */}
            {active.sessions?.[active.currentSession] && (
              <div style={{background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:10,padding:"14px 16px",marginBottom:14}}>
                <div style={{fontWeight:700,fontSize:13,color:"var(--ac)",marginBottom:4}}>
                  Session {active.currentSession+1} : {active.sessions[active.currentSession].titre}
                </div>
                <div style={{fontSize:9,color:"var(--mu)",marginBottom:10}}>{active.sessions[active.currentSession].objectif}</div>
                {!currentStep && !stepLoading && (
                  <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                    {[["📖","lesson","Leçon"],["✏️","exercise","Exercice"],["❓","quiz","Quiz"]].map(([ico,type,label])=>(
                      <button key={type} onClick={()=>launchStep(active,type)}
                        style={{padding:"8px 16px",background:"rgba(212,168,83,.1)",border:"1px solid rgba(212,168,83,.3)",borderRadius:6,color:"var(--ac)",fontSize:9,cursor:"pointer",fontWeight:700}}>
                        {ico} {label}
                      </button>
                    ))}
                    {active.sessions[active.currentSession].completed && (
                      <div style={{fontSize:9,color:"var(--green)",padding:"8px",display:"flex",alignItems:"center",gap:4}}>✅ Session complétée</div>
                    )}
                  </div>
                )}
                {stepLoading && <div style={{fontSize:10,color:"var(--mu)",padding:"12px 0"}}>⏳ Génération en cours…</div>}
                {currentStep && !stepLoading && (
                  <div>
                    <div style={{fontSize:8,color:"var(--ac)",fontWeight:700,marginBottom:8,textTransform:"uppercase"}}>
                      {currentStep.type==="lesson"?"📖 Leçon":currentStep.type==="exercise"?"✏️ Exercice":"❓ Quiz"}
                    </div>
                    <div style={{fontSize:10,color:"var(--tx)",lineHeight:1.7,marginBottom:12,whiteSpace:"pre-wrap"}}>{currentStep.content}</div>
                    {currentStep.type !== "lesson" && !currentStep.result && (
                      <>
                        <textarea value={userAnswer} onChange={e=>setUserAnswer(e.target.value)} placeholder="Ta réponse…" rows={3}
                          style={{width:"100%",background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:6,color:"var(--tx)",fontSize:10,padding:"8px 10px",resize:"vertical",outline:"none",boxSizing:"border-box",marginBottom:8}}/>
                        <button onClick={submitAnswer} disabled={!userAnswer.trim()}
                          style={{padding:"7px 18px",background:"rgba(212,168,83,.15)",border:"1px solid rgba(212,168,83,.4)",borderRadius:6,color:"var(--ac)",fontSize:9,cursor:"pointer",fontWeight:700}}>
                          Soumettre ma réponse
                        </button>
                      </>
                    )}
                    {currentStep.result && (
                      <div style={{padding:"10px 12px",borderRadius:8,background:currentStep.result.correct?"rgba(74,222,128,.08)":"rgba(248,113,113,.08)",border:"1px solid "+(currentStep.result.correct?"rgba(74,222,128,.3)":"rgba(248,113,113,.3)"),marginTop:8}}>
                        <div style={{fontWeight:700,fontSize:11,color:currentStep.result.correct?"var(--green)":"var(--red)",marginBottom:4}}>
                          {currentStep.result.correct?"✅ Correct !":"❌ Pas tout à fait…"} — {currentStep.result.score}/10
                        </div>
                        <div style={{fontSize:9,color:"var(--tx)",lineHeight:1.6,marginBottom:6}}>{currentStep.result.feedback}</div>
                        {currentStep.result.bonne_reponse && <div style={{fontSize:9,color:"var(--ac)",padding:"6px 8px",background:"rgba(212,168,83,.06)",borderRadius:5}}>✨ {currentStep.result.bonne_reponse}</div>}
                      </div>
                    )}
                    <div style={{display:"flex",gap:8,marginTop:10}}>
                      <button onClick={()=>{setCurrentStep(null);setUserAnswer("");}} style={{fontSize:9,padding:"5px 12px",background:"transparent",border:"1px solid var(--bd)",borderRadius:5,color:"var(--mu)",cursor:"pointer"}}>↺ Réessayer</button>
                      {(currentStep.type==="lesson"||currentStep.result) && (
                        <button onClick={completeSession} style={{fontSize:9,padding:"5px 12px",background:"rgba(74,222,128,.1)",border:"1px solid rgba(74,222,128,.3)",borderRadius:5,color:"var(--green)",cursor:"pointer",fontWeight:700}}>
                          ✓ Session suivante →
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
        {!active && !creating && <div style={{textAlign:"center",padding:40,color:"var(--mu)",fontSize:10}}>Sélectionne ou crée un programme d'apprentissage</div>}
      </div>
    </div>
  );
}
