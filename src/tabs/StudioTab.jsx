import React from 'react';

const STUDIO_QUESTIONS = [
  { id:"subject",   label:"Sur quoi porte le tuto ?",         placeholder:"Ex : L'onglet Smart Router de Multi-IA Hub", type:"text" },
  { id:"url",       label:"URL ou application à filmer ?",     placeholder:"Ex : https://multiia-hub.vercel.app ou GIMP local", type:"text" },
  { id:"duration",  label:"Durée cible ?",                     placeholder:"Ex : 2 minutes, 5 minutes", type:"text" },
  { id:"audience",  label:"Pour qui ? (niveau public)",        placeholder:"Ex : Débutants, développeurs, utilisateurs avancés", type:"text" },
  { id:"style",     label:"Style de narration ?",              placeholder:"Ex : Détendu, professionnel, enthousiaste", type:"text" },
  { id:"lang",      label:"Langue du tuto ?",                  placeholder:"Ex : Français, Anglais", type:"text" },
];

const STUDIO_PIPELINE_STEPS = [
  { id:"script",   icon:"✍️", label:"Génération du script",        tool:"IA",           color:"#D4A853" },
  { id:"questions",icon:"💬", label:"Questions de clarification",   tool:"IA",           color:"#60A5FA" },
  { id:"navigate", icon:"🌐", label:"Navigation Browser-Use",       tool:"Browser-Use",  color:"#4ADE80",  optional:true },
  { id:"record",   icon:"🔴", label:"Enregistrement OBS",           tool:"OBS",          color:"#F87171",  optional:true },
  { id:"narration",icon:"🎙", label:"Script narration IA",          tool:"IA",           color:"#A78BFA" },
  { id:"assemble", icon:"🎬", label:"Montage Kdenlive",             tool:"Kdenlive",     color:"#F97316",  optional:true },
  { id:"export",   icon:"📹", label:"Export vidéo finale",          tool:"Kdenlive",     color:"#F97316",  optional:true },
];

export default function StudioTab({ apiKeys, enabled, MODEL_DEFS, callModel, buildSystem, showToast }) {
  // ── État persistant via localStorage ──────────────────────────
  const _load = (key, def) => { try { const v = localStorage.getItem('studio_'+key); return v !== null ? JSON.parse(v) : def; } catch { return def; } };
  const _save = (key, val) => { try { localStorage.setItem('studio_'+key, JSON.stringify(val)); } catch {} };

  const [phase, setPhase]             = React.useState(() => _load('phase', 'intro'));
  const [subject, setSubject]         = React.useState(() => _load('subject', ''));
  const [answers, setAnswers]         = React.useState(() => _load('answers', {}));
  const [aiQuestions, setAiQuestions] = React.useState(() => _load('aiQuestions', []));
  const [aiAnswers, setAiAnswers]     = React.useState(() => _load('aiAnswers', {}));
  const [script, setScript]           = React.useState(() => _load('script', ''));
  const [narration, setNarration]     = React.useState(() => _load('narration', ''));
  const [pipelineLog, setPipelineLog] = React.useState(() => _load('pipelineLog', []));
  const [running, setRunning]         = React.useState(false);
  const [toolStatus, setToolStatus]   = React.useState({ browseruse: null, obs: null, kdenlive: null });

  // Sauvegarde automatique à chaque changement
  React.useEffect(() => { _save('phase', phase); }, [phase]);
  React.useEffect(() => { _save('subject', subject); }, [subject]);
  React.useEffect(() => { _save('answers', answers); }, [answers]);
  React.useEffect(() => { _save('aiQuestions', aiQuestions); }, [aiQuestions]);
  React.useEffect(() => { _save('aiAnswers', aiAnswers); }, [aiAnswers]);
  React.useEffect(() => { _save('script', script); }, [script]);
  React.useEffect(() => { _save('narration', narration); }, [narration]);
  React.useEffect(() => { _save('pipelineLog', pipelineLog); }, [pipelineLog]);

  const firstIA = (Object.keys(enabled || {}).find(id => enabled[id] && MODEL_DEFS?.[id])) || Object.keys(MODEL_DEFS || {})[0] || "";

  // ── Vérification optionnelle des outils ──────────────────────
  const checkTools = async () => {
    const status = { browseruse: false, obs: false, kdenlive: false };
    // Relay CLI-Anything (port 5678) — vérifie OBS, Kdenlive et Browser-Use
    try {
      const r = await fetch("http://localhost:5678/ping", { signal: AbortSignal.timeout(2000) });
      if(r.ok) {
        const d = await r.json();
        status.obs        = d.obs        || false;
        status.kdenlive   = d.kdenlive   || false;
        status.browseruse = d.browseruse || false;
      }
    } catch {}
    setToolStatus(status);
    return status;
  };

  const log = (step, status, msg) => {
    setPipelineLog(prev => {
      const existing = prev.findIndex(l => l.step === step);
      const entry = { step, status, msg, ts: Date.now() };
      if(existing >= 0) { const n=[...prev]; n[existing]=entry; return n; }
      return [...prev, entry];
    });
  };

  // ── Phase 1 : l'IA pose des questions de clarification ───────
  const startQuestionsPhase = async () => {
    if(!subject.trim()) { showToast("Décris d'abord le sujet du tuto"); return; }
    setPhase("questions");
    try {
      const prompt = `Tu es un expert en création de tutoriels vidéo. Un utilisateur veut créer un tuto sur : "${subject}".
Pose exactement 5 questions courtes et précises pour t'assurer de créer le meilleur tuto possible.
Format de réponse : JSON array uniquement, sans texte avant ou après.
Exemple : ["Quel est le niveau de l'audience ?","Quelle durée idéale ?","URL ou logiciel à filmer ?","Style de narration ?","Points clés à montrer ?"]`;
      const reply = await callModel(firstIA, [{role:"user",content:prompt}], apiKeys, buildSystem(), null);
      const clean = reply.replace(/```json|```/g,"").trim();
      const questions = JSON.parse(clean);
      const finalQuestions = Array.isArray(questions) ? questions : STUDIO_QUESTIONS.map(q=>q.label);
      setAiQuestions(finalQuestions);
      // Init les réponses vides
      const initAnswers = {};
      finalQuestions.forEach(q => { initAnswers[q] = ""; });
      setAiAnswers(initAnswers);
    } catch(e) {
      const fallback = STUDIO_QUESTIONS.map(q => q.label);
      setAiQuestions(fallback);
      const initAnswers = {};
      fallback.forEach(q => { initAnswers[q] = ""; });
      setAiAnswers(initAnswers);
    }
  };

  // ── Phase 2 : Confirmation avant lancement ────────────────────
  const confirmAndStart = () => {
    setPhase("confirm");
    checkTools();
  };

  // ── Phase 3 : Pipeline complet ────────────────────────────────
  const runPipeline = async () => {
    setPhase("running");
    setRunning(true);
    setPipelineLog([]);
    const tools = await checkTools();

    // ÉTAPE 1 — Génération du script
    log("script","running","Génération du script de tuto…");
    let scriptContent = "";
    try {
      const answersStr = Object.entries(aiAnswers).map(([q,a])=>`${q}: ${a}`).join("\n");
      const prompt = `Crée un script complet de tutoriel vidéo sur : "${subject}".
Informations complémentaires :
${answersStr}

Format du script :
- INTRO (15s) : accroche, présentation du sujet
- PARTIE 1 (30s-1min) : première démonstration
- PARTIE 2 (30s-1min) : fonctionnalité principale
- ASTUCE (20s) : conseil pratique
- CONCLUSION (15s) : résumé, call-to-action
Pour chaque partie : [TIMECODE] | ACTION À L'ÉCRAN | NARRATION

Sois précis sur ce que l'IA doit cliquer/montrer à l'écran.`;
      scriptContent = await callModel(firstIA, [{role:"user",content:prompt}], apiKeys, buildSystem(), null);
      setScript(scriptContent);
      log("script","done","✅ Script généré");
    } catch(e) { log("script","error","❌ "+e.message); scriptContent = subject; }

    // ÉTAPE 2 — Navigation Browser-Use (optionnel)
    if(tools.browseruse) {
      log("navigate","running","Browser-Use navigue vers la page…");
      try {
        // Cherche une vraie URL dans toutes les réponses
        const urlRegex = /https?:\/\/[^\s]+/;
        let url = "https://multiia-hub.vercel.app"; // défaut
        for(const ans of Object.values(aiAnswers)) {
          const m = String(ans).match(urlRegex);
          if(m) { url = m[0]; break; }
        }
        const r = await fetch("http://localhost:5678/navigate", {
          method:"POST", headers:{"Content-Type":"application/json"},
          body: JSON.stringify({ url, script: scriptContent }),
          signal: AbortSignal.timeout(30000)
        });
        if(r.ok) log("navigate","done","✅ Browser-Use a navigué");
        else log("navigate","skip","⚠️ Browser-Use erreur — étape ignorée");
      } catch { log("navigate","skip","ℹ️ Browser-Use non disponible — ignoré"); }
    } else {
      log("navigate","skip","ℹ️ Browser-Use non installé — étape ignorée");
    }

    // ÉTAPE 3 — Enregistrement OBS (optionnel)
    if(tools.obs) {
      log("record","running","OBS démarre l'enregistrement…");
      try {
        const r = await fetch("http://localhost:5678/obs/record/start", {
          method:"POST", headers:{"Content-Type":"application/json"},
          body: JSON.stringify({}),
          signal: AbortSignal.timeout(10000)
        });
        if(r.ok) {
            log("record","done","✅ OBS enregistre — Ouvre multiia-hub.vercel.app dans ton navigateur maintenant pour que l'écran ne soit pas noir ! Enregistrement pendant 30s…");
            await new Promise(res=>setTimeout(res, 30000)); // 30 secondes d'enregistrement
          }
        else log("record","skip","⚠️ OBS WebSocket non dispo — active-le dans OBS : Outils → WebSocket Server → port 4455");
      } catch { log("record","skip","ℹ️ OBS non disponible — ignoré"); }
    } else {
      log("record","skip","ℹ️ OBS non installé — étape ignorée");
    }

    // ÉTAPE 4 — Génération narration IA
    log("narration","running","Génération du script de narration voix off…");
    let narrationContent = "";
    try {
      const prompt = `À partir de ce script de tuto :\n${scriptContent}\n\nGénère uniquement le texte de narration voix off, sans les indications techniques. Ton naturel, fluide, en ${aiAnswers[aiQuestions[0]] ? "s'adaptant au niveau "+aiAnswers[aiQuestions[0]] : "français"}.`;
      narrationContent = await callModel(firstIA, [{role:"user",content:prompt}], apiKeys, buildSystem(), null);
      setNarration(narrationContent);
      log("narration","done","✅ Narration générée");
    } catch(e) { log("narration","error","❌ "+e.message); }

    // ÉTAPE 5 — Montage Kdenlive (optionnel)
    if(tools.kdenlive) {
      log("assemble","running","Kdenlive assemble la vidéo…");
      try {
        const r = await fetch("http://localhost:5678/execute", {
          method:"POST", headers:{"Content-Type":"application/json"},
          body: JSON.stringify({ command:"cli-anything-kdenlive project new --name tuto_output --width 1920 --height 1080 --fps-num 25 --fps-den 1 --output ./tuto_output.kdenlive", software:"kdenlive" }),
          signal: AbortSignal.timeout(30000)
        });
        if(r.ok) log("assemble","done","✅ Projet Kdenlive créé");
        else log("assemble","skip","⚠️ Kdenlive erreur — ignoré");
      } catch { log("assemble","skip","ℹ️ Kdenlive non disponible — ignoré"); }
    } else {
      log("assemble","skip","ℹ️ Kdenlive non installé — étape ignorée");
    }

    // ÉTAPE 6 — Arrêt OBS
    if(tools.obs) {
      try {
        await fetch("http://localhost:5678/obs/record/stop", {
          method:"POST", headers:{"Content-Type":"application/json"},
          body: JSON.stringify({}),
          signal: AbortSignal.timeout(10000)
        });
        log("export","done","✅ OBS a arrêté l'enregistrement");
      } catch { log("export","skip","ℹ️ OBS stop ignoré"); }
    } else {
      log("export","skip","ℹ️ Export manuel requis — voir script ci-dessous");
    }

    setRunning(false);
    setPhase("done");
  };

  const reset = () => {
    ['phase','subject','answers','aiQuestions','aiAnswers','script','narration','pipelineLog']
      .forEach(k => { try { localStorage.removeItem('studio_'+k); } catch {} });
    setPhase("intro"); setSubject(""); setAnswers({}); setAiQuestions([]); setAiAnswers({});
    setScript(""); setNarration(""); setPipelineLog([]);
  };

  const statusColor = s => s==="done"?"#4ADE80":s==="running"?"#D4A853":s==="error"?"#F87171":"#666674";
  const statusIcon  = s => s==="done"?"✅":s==="running"?"⏳":s==="error"?"❌":"⏸";

  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>

      {/* ── HEADER FIXE ── */}
      <div style={{flexShrink:0,padding:"10px clamp(10px,2vw,20px) 0",borderBottom:"1px solid var(--bd)",background:"var(--bg)"}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:8,flexWrap:"wrap"}}>
          <div style={{fontFamily:"var(--font-display)",fontWeight:800,fontSize:"clamp(14px,2.5vw,18px)",color:"var(--tx)"}}>🎬 Studio Auto</div>
          <div style={{fontSize:9,color:"var(--mu)",flex:1}}>Génère des tutos vidéo automatiquement · Surcouche optionnelle : Browser-Use + OBS + IA + Kdenlive</div>
          {phase !== "intro" && <button onClick={reset} style={{fontSize:9,padding:"4px 10px",border:"1px solid var(--bd)",borderRadius:5,background:"transparent",color:"var(--mu)",cursor:"pointer"}}>↺ Recommencer</button>}
        </div>

        {/* Barre outils compacte */}
        <div style={{display:"flex",gap:6,marginBottom:8,flexWrap:"wrap",alignItems:"center"}}>
          {[
            {key:"browseruse",label:"Browser-Use",icon:"🌐"},
            {key:"obs",       label:"OBS Studio", icon:"🔴"},
            {key:"kdenlive",  label:"Kdenlive",   icon:"🎬"},
          ].map(t => (
            <div key={t.key} style={{padding:"3px 9px",borderRadius:5,border:"1px solid "+(toolStatus[t.key]?"rgba(74,222,128,.3)":"var(--bd)"),background:toolStatus[t.key]?"rgba(74,222,128,.06)":"var(--s1)",display:"flex",alignItems:"center",gap:5,fontSize:8,color:toolStatus[t.key]?"var(--green)":"var(--mu)"}}>
              {t.icon} {t.label} <span style={{opacity:.6}}>{toolStatus[t.key]?"● actif":"○ opt."}</span>
            </div>
          ))}
          <button onClick={checkTools} style={{fontSize:8,padding:"3px 8px",border:"1px solid var(--bd)",borderRadius:4,background:"transparent",color:"var(--mu)",cursor:"pointer"}}>🔄</button>
        </div>
      </div>

      {/* ── CONTENU SCROLLABLE ── */}
      <div style={{flex:"1 1 0",overflow:"auto",minHeight:0,padding:"clamp(10px,2vw,20px)"}}>


        {/* ══ GUIDE D'INSTALLATION ══ */}
        <div style={{marginBottom:10,padding:"6px 12px",background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:7,fontSize:9,color:"var(--mu)",display:"flex",alignItems:"center",gap:8}}>
          💡 Outils non installés ? Consulte l'onglet <strong style={{color:"var(--ac)"}}>❓ Aide</strong> → section "Tunnels CLI-Anything" pour les commandes PowerShell.
        </div>

        {/* ══ PHASE : INTRO ══ */}
        {phase === "intro" && (
          <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
            {/* Explication */}
            <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <div style={{maxWidth:500,textAlign:"center",padding:"0 20px"}}>
                <div style={{fontSize:32,marginBottom:12}}>🎬</div>
                <div style={{fontWeight:800,fontSize:16,color:"var(--tx)",marginBottom:8}}>Crée un tuto vidéo automatiquement</div>
                <div style={{fontSize:10,color:"var(--mu)",lineHeight:1.8}}>
                  L'IA pose des questions · tu confirmes · le pipeline génère le script, la narration, et filme avec OBS
                </div>
                {!firstIA && <div style={{marginTop:10,fontSize:9,color:"var(--red)"}}>⚠️ Active au moins une IA dans l'onglet Config</div>}
              </div>
            </div>
            {/* Barre de saisie style Chat */}
            <div style={{flexShrink:0,borderTop:"1px solid var(--bd)",padding:"10px 14px",background:"var(--s1)"}}>
              <div style={{fontSize:9,color:"var(--mu)",marginBottom:6,fontFamily:"var(--font-mono)"}}>SUJET DU TUTO</div>
              <div className="ir">
                <div className="ta-wrap">
                  <textarea rows={2} value={subject} onChange={e=>setSubject(e.target.value)}
                    placeholder="Ex : Comment utiliser le Smart Router de Multi-IA Hub…"
                    onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();startQuestionsPhase();}}}
                    style={{fontSize:12,resize:"none"}}
                  />
                </div>
                <button className="sbtn" onClick={startQuestionsPhase}
                  disabled={!subject.trim()||!firstIA}
                  title="L'IA pose ses questions">↑</button>
              </div>
            </div>
          </div>
        )}

        {/* ══ PHASE : QUESTIONS IA ══ */}
        {phase === "questions" && (
          <div style={{maxWidth:620}}>
            <div style={{marginBottom:16,padding:"10px 14px",background:"rgba(96,165,250,.06)",border:"1px solid rgba(96,165,250,.2)",borderRadius:8,fontSize:10,color:"var(--blue)"}}>
              💬 L'IA a besoin de quelques précisions pour créer le meilleur tuto possible sur : <strong>"{subject}"</strong>
            </div>
            {aiQuestions.length === 0 ? (
              <div style={{fontSize:11,color:"var(--mu)"}}>⏳ L'IA génère ses questions…</div>
            ) : (
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                {aiQuestions.map((q,i) => (
                  <div key={i}>
                    <div style={{fontSize:10,color:"var(--tx)",fontWeight:700,marginBottom:5}}>{i+1}. {q}</div>
                    <input
                      value={aiAnswers[q]||""}
                      onChange={e=>setAiAnswers(prev=>({...prev,[q]:e.target.value}))}
                      placeholder="Ta réponse…"
                      style={{width:"100%",background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:6,color:"var(--tx)",fontSize:10,padding:"7px 10px",outline:"none"}}
                    />
                  </div>
                ))}
                <button
                  onClick={confirmAndStart}
                  disabled={aiQuestions.some(q => !aiAnswers[q]?.trim())}
                  style={{marginTop:8,padding:"10px 24px",background:"linear-gradient(135deg,#60A5FA,#93C5FD)",border:"none",borderRadius:8,color:"var(--bg)",fontWeight:700,fontSize:12,cursor:"pointer",alignSelf:"flex-start",opacity:aiQuestions.some(q=>!aiAnswers[q]?.trim())?0.5:1}}>
                  ✅ Confirmer et lancer le pipeline →
                </button>
                <div style={{fontSize:9,color:"var(--mu)",marginTop:4}}>Réponds à toutes les questions pour continuer</div>
              </div>
            )}
          </div>
        )}

        {/* ══ PHASE : CONFIRMATION ══ */}
        {phase === "confirm" && (
          <div style={{maxWidth:620}}>
            <div style={{marginBottom:16,padding:"14px 16px",background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:10}}>
              <div style={{fontWeight:700,fontSize:12,color:"var(--tx)",marginBottom:10}}>📋 Récapitulatif du tuto</div>
              <div style={{fontSize:10,color:"var(--mu)",marginBottom:5}}><strong style={{color:"var(--tx)"}}>Sujet :</strong> {subject}</div>
              {aiQuestions.map((q,i) => aiAnswers[q] && (
                <div key={i} style={{fontSize:10,color:"var(--mu)",marginBottom:3}}>
                  <strong style={{color:"var(--tx)"}}>{q} :</strong> {aiAnswers[q]}
                </div>
              ))}
            </div>
            <div style={{marginBottom:14,fontSize:10,color:"var(--mu)"}}>
              <strong style={{color:"var(--tx)"}}>Outils disponibles :</strong>
              {[["Browser-Use","browseruse","🌐"],["OBS","obs","🔴"],["Kdenlive","kdenlive","🎬"]].map(([label,key,icon])=>(
                <span key={key} style={{marginLeft:8,padding:"2px 7px",borderRadius:4,background:toolStatus[key]?"rgba(74,222,128,.1)":"rgba(255,255,255,.05)",border:"1px solid "+(toolStatus[key]?"rgba(74,222,128,.3)":"var(--bd)"),color:toolStatus[key]?"var(--green)":"var(--mu)"}}>
                  {icon} {label} {toolStatus[key]?"✓":"(ignoré)"}
                </span>
              ))}
            </div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={runPipeline} style={{padding:"10px 24px",background:"linear-gradient(135deg,#4ADE80,#22C55E)",border:"none",borderRadius:8,color:"var(--bg)",fontWeight:700,fontSize:12,cursor:"pointer"}}>
                🚀 Lancer la génération automatique
              </button>
              <button onClick={()=>setPhase("questions")} style={{padding:"10px 16px",background:"transparent",border:"1px solid var(--bd)",borderRadius:8,color:"var(--mu)",fontSize:11,cursor:"pointer"}}>
                ← Modifier
              </button>
            </div>
          </div>
        )}

        {/* ══ PHASE : RUNNING + DONE ══ */}
        {(phase === "running" || phase === "done") && (
          <div style={{maxWidth:680}}>
            {/* Pipeline steps */}
            <div style={{marginBottom:20}}>
              <div style={{fontSize:10,fontWeight:700,color:"var(--mu)",fontFamily:"var(--font-mono)",marginBottom:10,letterSpacing:1}}>PIPELINE EN COURS</div>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {STUDIO_PIPELINE_STEPS.map(step => {
                  const entry = pipelineLog.find(l=>l.step===step.id);
                  const status = entry?.status || "pending";
                  return (
                    <div key={step.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",borderRadius:8,background:"var(--s1)",border:"1px solid "+(status==="done"?"rgba(74,222,128,.25)":status==="running"?"rgba(212,168,83,.25)":status==="error"?"rgba(248,113,113,.2)":status==="skip"?"rgba(255,255,255,.04)":"var(--bd)")}}>
                      <span style={{fontSize:18}}>{step.icon}</span>
                      <div style={{flex:1}}>
                        <div style={{fontSize:11,fontWeight:700,color:"var(--tx)",display:"flex",alignItems:"center",gap:6}}>
                          {step.label}
                          {step.optional && <span style={{fontSize:7,padding:"1px 5px",borderRadius:3,background:"rgba(255,255,255,.07)",color:"var(--mu)"}}>optionnel</span>}
                        </div>
                        <div style={{fontSize:9,color:"var(--mu)",fontFamily:"var(--font-mono)"}}>{entry?.msg || "En attente…"}</div>
                      </div>
                      <span style={{fontSize:16}}>{statusIcon(status)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Script généré */}
            {script && (
              <div style={{marginBottom:16}}>
                <div style={{fontSize:10,fontWeight:700,color:"var(--ac)",fontFamily:"var(--font-mono)",marginBottom:8,letterSpacing:1}}>📄 SCRIPT GÉNÉRÉ</div>
                <textarea readOnly value={script}
                  style={{width:"100%",background:"var(--s2)",border:"1px solid rgba(212,168,83,.2)",borderRadius:8,color:"var(--tx)",fontSize:9,padding:"10px 12px",fontFamily:"var(--font-mono)",resize:"vertical",minHeight:140,outline:"none"}}/>
              </div>
            )}

            {/* Narration générée */}
            {narration && (
              <div style={{marginBottom:16}}>
                <div style={{fontSize:10,fontWeight:700,color:"var(--purple,#A78BFA)",fontFamily:"var(--font-mono)",marginBottom:8,letterSpacing:1}}>🎙 NARRATION VOIX OFF</div>
                <textarea readOnly value={narration}
                  style={{width:"100%",background:"var(--s2)",border:"1px solid rgba(167,139,250,.2)",borderRadius:8,color:"var(--tx)",fontSize:9,padding:"10px 12px",fontFamily:"var(--font-ui)",resize:"vertical",minHeight:120,outline:"none",lineHeight:1.7}}/>
                <div style={{marginTop:8,display:"flex",gap:8}}>
                  <button onClick={()=>{navigator.clipboard.writeText(narration);showToast("✓ Narration copiée");}} style={{fontSize:9,padding:"5px 12px",border:"1px solid rgba(167,139,250,.3)",borderRadius:5,background:"rgba(167,139,250,.08)",color:"#A78BFA",cursor:"pointer"}}>📋 Copier la narration</button>
                  <button onClick={()=>{navigator.clipboard.writeText(script);showToast("✓ Script copié");}} style={{fontSize:9,padding:"5px 12px",border:"1px solid rgba(212,168,83,.3)",borderRadius:5,background:"rgba(212,168,83,.08)",color:"var(--ac)",cursor:"pointer"}}>📋 Copier le script</button>
                </div>
              </div>
            )}

            {phase === "done" && (
              <div style={{padding:"12px 16px",background:"rgba(74,222,128,.06)",border:"1px solid rgba(74,222,128,.2)",borderRadius:8,display:"flex",alignItems:"center",gap:12}}>
                <span style={{fontSize:24}}>🎉</span>
                <div>
                  <div style={{fontWeight:700,fontSize:12,color:"var(--green)",marginBottom:3}}>Pipeline terminé !</div>
                  <div style={{fontSize:9,color:"var(--mu)"}}>Script et narration prêts. {!toolStatus.obs && "Enregistre manuellement ton écran avec OBS ou Loom."} {!toolStatus.kdenlive && "Monte la vidéo avec Kdenlive ou CapCut."}</div>
                </div>
                <button onClick={reset} style={{marginLeft:"auto",fontSize:9,padding:"6px 14px",border:"1px solid rgba(74,222,128,.3)",borderRadius:6,background:"rgba(74,222,128,.1)",color:"var(--green)",cursor:"pointer",fontWeight:700}}>+ Nouveau tuto</button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
