import React from 'react';

export default function TaskToIAsTab({ enabled, apiKeys, navigateTab, setChatInput, ...anyOtherProps }) {
// ╔══════════════════════════════════════════════════════════════╗
// ║  TASK TO IAs — Décomposition + routage multi-modèle          ║
// ╚══════════════════════════════════════════════════════════════╝
  const [task, setTask] = React.useState("");
  const [plan, setPlan] = React.useState(null);       // [{id,title,type,ia,prompt,status,output}]
  const [planning, setPlanning] = React.useState(false);
  const [running, setRunning] = React.useState(false);
  const [results, setResults] = React.useState([]);
  const [assembly, setAssembly] = React.useState("");
  const [assembling, setAssembling] = React.useState(false);
  const [editingPlan, setEditingPlan] = React.useState(false);

  const activeIds = Object.keys(MODEL_DEFS).filter(id => enabled[id] && !MODEL_DEFS[id]?.serial);

  // Spécialités par IA pour le routage intelligent
  const IA_SPECIALTIES = {
    groq:       { best:["vitesse","brainstorming","idées","recherche rapide","liste"], icon:"⚡" },
    mistral:    { best:["français","rédaction","reformulation","mail","rapport"], icon:"▲" },
    cohere:     { best:["résumé","extraction","analyse document","rag","structured"], icon:"⌘" },
    cerebras:   { best:["code","débogage","algorithme","fonction","script"], icon:"◉" },
    sambanova:  { best:["raisonnement","analyse complexe","stratégie","décision"], icon:"∞" },
    qwen3:      { best:["code","maths","multilingue","calcul","logique"], icon:"◈" },
    llama4s:    { best:["multimodal","image","vision","créatif","diversité"], icon:"🦙" },
    gemma2:     { best:["synthèse rapide","classification","catégorie","format"], icon:"◎" },
    poll_gpt:   { best:["polyvalent","créatif","général","conversation"], icon:"◈" },
    poll_claude:{ best:["analyse","nuance","éthique","long texte","profond"], icon:"✦" },
  };

  const TASK_TYPES = [
    { id:"recherche",  label:"🔍 Recherche",  color:"#60A5FA", desc:"Trouver, analyser, synthétiser" },
    { id:"redaction",  label:"✍️ Rédaction",  color:"#34D399", desc:"Écrire, reformuler, structurer" },
    { id:"code",       label:"💻 Code",       color:"#A78BFA", desc:"Programmer, déboguer, optimiser" },
    { id:"strategie",  label:"🎯 Stratégie",  color:"#F97316", desc:"Planifier, décider, prioriser" },
    { id:"analyse",    label:"🔬 Analyse",    color:"#F87171", desc:"Critiquer, évaluer, comparer" },
    { id:"creation",   label:"🎨 Création",   color:"#EC4899", desc:"Générer, inventer, brainstormer" },
  ];

  // Routage intelligent : trouve la meilleure IA pour un type de tâche
  const routeTask = (taskType) => {
    const available = activeIds;
    if (!available.length) return available[0];
    // Cherche l'IA dont les spécialités matchent le type
    const scored = available.map(id => {
      const spec = IA_SPECIALTIES[id]?.best || [];
      const score = spec.filter(s => taskType.toLowerCase().includes(s) || s.includes(taskType.toLowerCase())).length;
      return { id, score };
    }).sort((a,b) => b.score - a.score);
    return scored[0]?.id || available[0];
  };

  const generatePlan = async () => {
    if (!task.trim() || !activeIds.length) return;
    setPlanning(true); setPlan(null); setResults([]); setAssembly("");

    const plannerIA = activeIds.find(id=>["groq","mistral","sambanova"].includes(id)) || activeIds[0];
    const availableIAs = activeIds.map(id => `- ${id} (${MODEL_DEFS[id]?.short}): spécialités ${IA_SPECIALTIES[id]?.best?.join(", ")||"généraliste"}`).join("\n");

    const prompt = `Tu es un orchestrateur d'agents IA. L'utilisateur veut accomplir cette tâche complexe :
"${task}"

IAs disponibles :
${availableIAs}

Décompose cette tâche en 3 à 6 sous-tâches, en assignant chaque sous-tâche à l'IA la plus adaptée.
Types disponibles : recherche, redaction, code, strategie, analyse, creation.

Réponds UNIQUEMENT en JSON valide :
[
  {
    "id": "step1",
    "title": "Titre court de la sous-tâche",
    "type": "recherche|redaction|code|strategie|analyse|creation",
    "ia": "id_de_lia",
    "rationale": "pourquoi cette IA pour cette tâche (1 phrase)",
    "prompt": "Le prompt complet et précis à envoyer à cette IA pour accomplir SA partie"
  }
]`;

    try {
      const reply = await callModel(plannerIA, [{role:"user",content:prompt}], apiKeys, "Orchestrateur d'agents. JSON uniquement, sans markdown.");
      const clean = reply.replace(/```json|```/g,"").trim();
      const steps = JSON.parse(clean.match(/\[[\s\S]*\]/)?.[0] || clean);
      // Override le routage avec notre logique si l'IA suggérée n'est pas disponible
      const validatedSteps = steps.map((s,i) => ({
        ...s,
        id: `step${i+1}`,
        ia: activeIds.includes(s.ia) ? s.ia : routeTask(s.type),
        status: "pending",
        output: null,
      }));
      setPlan(validatedSteps);
    } catch(e) {
      alert("Erreur lors de la planification : " + e.message);
    }
    setPlanning(false);
  };

  const runPlan = async () => {
    if (!plan?.length) return;
    setRunning(true); setResults([]); setAssembly("");

    const newResults = [];
    for (const step of plan) {
      // Mettre à jour le statut
      setPlan(prev => prev.map(s => s.id===step.id ? {...s, status:"running"} : s));

      // Enrichir le prompt avec les outputs précédents si pertinent
      const prevOutputs = newResults.map(r => `[${r.title}]:\n${r.output}`).join("\n\n");
      const enrichedPrompt = prevOutputs
        ? `Contexte des étapes précédentes :\n${prevOutputs}\n\n---\nTa mission :\n${step.prompt}`
        : step.prompt;

      try {
        const start = Date.now();
        const output = await callModel(step.ia, [{role:"user", content:enrichedPrompt}], apiKeys,
          `Tu es un expert spécialisé en ${step.type}. Tu travailles sur la tâche : "${task}". Sois précis et actionnable.`
        );
        const duration = ((Date.now()-start)/1000).toFixed(1);
        const result = { ...step, output, status:"done", duration };
        newResults.push(result);
        setPlan(prev => prev.map(s => s.id===step.id ? result : s));
        setResults([...newResults]);
      } catch(e) {
        const result = { ...step, output:`❌ ${e.message}`, status:"error" };
        newResults.push(result);
        setPlan(prev => prev.map(s => s.id===step.id ? result : s));
        setResults([...newResults]);
      }
    }
    setRunning(false);
  };

  const assembleResults = async () => {
    if (!results.length) return;
    setAssembling(true);
    const assemblerIA = activeIds.find(id=>["mistral","groq","sambanova","poll_claude"].includes(id)) || activeIds[0];
    const allOutputs = results.filter(r=>r.status==="done").map((r,i) => `## Étape ${i+1} — ${r.title}\n${r.output}`).join("\n\n");

    const prompt = `Tu es un expert en synthèse. Voici les résultats d'un pipeline multi-IA pour accomplir :
"${task}"

Résultats des différentes IAs :
${allOutputs}

Assemble ces résultats en un livrable final cohérent, structuré et actionnable.
Format : titre, introduction, sections claires, conclusion avec prochaines étapes.`;

    try {
      const output = await callModel(assemblerIA, [{role:"user",content:prompt}], apiKeys, "Expert en assemblage et synthèse. Produis un document final professionnel.");
      setAssembly(output);
    } catch(e) { setAssembly("❌ " + e.message); }
    setAssembling(false);
  };

  const typeInfo = (type) => TASK_TYPES.find(t=>t.id===type) || {label:type, color:"var(--mu)", icon:"📌"};
  const statusIcon = s => ({pending:"○", running:"⟳", done:"✓", error:"✗"}[s]||"○");
  const statusColor = s => ({pending:"var(--mu)", running:"var(--ac)", done:"var(--green)", error:"var(--red)"}[s]||"var(--mu)");

  return (
    <div style={{flex:1, overflow:"auto", padding:"clamp(10px,2vw,16px)"}}>
      {/* Header */}
      <div style={{display:"flex", alignItems:"center", gap:10, marginBottom:6, flexWrap:"wrap"}}>
        <div style={{fontFamily:"var(--font-display)", fontWeight:800, fontSize:"clamp(14px,2.5vw,18px)", color:"#F97316"}}>🔀 Task to IAs</div>
        <div style={{fontSize:9, color:"var(--mu)"}}>— Décompose une tâche complexe et route chaque partie vers la meilleure IA</div>
      </div>
      <div style={{fontSize:9, color:"var(--mu)", marginBottom:14, padding:"8px 12px", background:"rgba(249,115,22,.06)", border:"1px solid rgba(249,115,22,.15)", borderRadius:6}}>
        Tu décris une tâche complexe. Une IA orchestre et décompose en sous-tâches. <strong style={{color:"var(--tx)"}}>Chaque sous-tâche est automatiquement routée vers l'IA la plus adaptée</strong> (vitesse, rédaction, code, analyse…). Les résultats sont assemblés en un livrable final.
      </div>

      {/* IAs disponibles + spécialités */}
      <div style={{marginBottom:12, display:"flex", gap:6, flexWrap:"wrap"}}>
        {activeIds.map(id => {
          const m = MODEL_DEFS[id];
          const spec = IA_SPECIALTIES[id]?.best?.slice(0,2).join(", ") || "généraliste";
          return <div key={id} style={{padding:"4px 10px", borderRadius:8, border:"1px solid "+m.color+"33", background:m.color+"0A", fontSize:8}}>
            <span style={{color:m.color, fontWeight:700}}>{m.icon} {m.short}</span>
            <span style={{color:"var(--mu)"}}> · {spec}</span>
          </div>;
        })}
        {activeIds.length === 0 && <span style={{fontSize:9, color:"var(--red)"}}>Active des IAs dans Config</span>}
      </div>

      {/* Input */}
      {!plan && !planning && (
        <>
          <textarea value={task} onChange={e=>setTask(e.target.value)}
            placeholder={"Décris ta tâche complexe…\nEx: Lancer une newsletter IA hebdomadaire\nEx: Créer un cours en ligne sur Python pour débutants\nEx: Analyser et améliorer ma stratégie LinkedIn"}
            rows={4} style={{width:"100%", background:"var(--s2)", border:"1px solid var(--bd)", borderRadius:8, color:"var(--tx)", fontSize:11, padding:"10px 12px", resize:"vertical", outline:"none", boxSizing:"border-box", marginBottom:10}}/>

          {/* Exemples rapides */}
          <div style={{marginBottom:12}}>
            <div style={{fontSize:8, color:"var(--mu)", fontWeight:700, marginBottom:6}}>EXEMPLES RAPIDES</div>
            <div style={{display:"flex", gap:6, flexWrap:"wrap"}}>
              {[
                "Lancer une newsletter IA hebdomadaire",
                "Créer un tutoriel vidéo sur React",
                "Préparer une présentation business pour investisseurs",
                "Rédiger un plan de formation Python débutants",
                "Analyser et améliorer une stratégie marketing",
              ].map(ex => (
                <button key={ex} onClick={()=>setTask(ex)}
                  style={{padding:"4px 10px", borderRadius:10, border:"1px solid var(--bd)", background:"var(--s1)", color:"var(--mu)", fontSize:8, cursor:"pointer"}}>
                  {ex}
                </button>
              ))}
            </div>
          </div>

          <button onClick={generatePlan} disabled={planning||!task.trim()||activeIds.length<1}
            style={{padding:"9px 22px", background:"rgba(249,115,22,.15)", border:"1px solid rgba(249,115,22,.4)", borderRadius:6, color:"#F97316", fontSize:10, cursor:"pointer", fontWeight:700, fontFamily:"var(--font-mono)"}}>
            🧠 Planifier et router les tâches
          </button>
        </>
      )}

      {planning && (
        <div style={{textAlign:"center", padding:"40px 20px"}}>
          <div style={{fontSize:28, marginBottom:8, display:"inline-block", animation:"spin 1.5s linear infinite"}}>🔀</div>
          <div style={{fontSize:11, color:"var(--mu)"}}>Analyse de la tâche et création du plan d'exécution…</div>
        </div>
      )}

      {/* Plan d'exécution */}
      {plan && (
        <div style={{marginBottom:16}}>
          {/* Tâche + actions */}
          <div style={{display:"flex", alignItems:"flex-start", gap:10, marginBottom:12, padding:"10px 14px", background:"var(--s1)", border:"1px solid rgba(249,115,22,.3)", borderRadius:8, flexWrap:"wrap"}}>
            <div style={{flex:1}}>
              <div style={{fontSize:8, color:"#F97316", fontWeight:700, marginBottom:2}}>TÂCHE PRINCIPALE</div>
              <div style={{fontSize:11, color:"var(--tx)", fontWeight:600}}>{task}</div>
              <div style={{fontSize:8, color:"var(--mu)", marginTop:3}}>{plan.length} sous-tâches · {activeIds.length} IAs disponibles</div>
            </div>
            <div style={{display:"flex", gap:6, flexShrink:0}}>
              <button onClick={()=>{setPlan(null);setResults([]);setAssembly("");}}
                style={{fontSize:8, padding:"4px 10px", background:"transparent", border:"1px solid var(--bd)", borderRadius:5, color:"var(--mu)", cursor:"pointer"}}>
                ✕ Recréer
              </button>
              {!running && results.length === 0 && (
                <button onClick={runPlan}
                  style={{fontSize:9, padding:"6px 16px", background:"rgba(249,115,22,.15)", border:"1px solid rgba(249,115,22,.4)", borderRadius:5, color:"#F97316", cursor:"pointer", fontWeight:700}}>
                  ▶ Exécuter le plan
                </button>
              )}
            </div>
          </div>

          {/* Étapes avec pipeline visuel */}
          <div style={{position:"relative"}}>
            <div style={{position:"absolute", left:19, top:0, bottom:0, width:2, background:"linear-gradient(to bottom,#F97316,#A78BFA,#34D399)", borderRadius:2, zIndex:0}}/>
            {plan.map((step, i) => {
              const m = MODEL_DEFS[step.ia];
              const type = typeInfo(step.type);
              const isDone = step.status === "done";
              const isRunning = step.status === "running";
              return (
                <div key={step.id} style={{display:"flex", gap:12, alignItems:"flex-start", marginBottom:10, position:"relative", zIndex:1}}>
                  {/* Numéro step */}
                  <div style={{width:38, height:38, borderRadius:"50%", background:"var(--bg)", border:"2px solid "+(isDone?"var(--green)":isRunning?"var(--ac)":"var(--bd)"), display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:isRunning?16:12, color:statusColor(step.status), fontWeight:700, transition:"all .3s"}}>
                    {isRunning ? <span style={{animation:"spin 1s linear infinite", display:"inline-block"}}>⟳</span> : isDone ? "✓" : i+1}
                  </div>
                  {/* Contenu */}
                  <div style={{flex:1, background:"var(--s1)", border:"1px solid "+(isDone?"var(--green)33":isRunning?"rgba(212,168,83,.3)":"var(--bd)"), borderRadius:10, padding:"10px 14px", marginBottom:2, transition:"border-color .3s"}}>
                    <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:4, flexWrap:"wrap"}}>
                      <span style={{fontSize:9, fontWeight:700, color:type.color, padding:"2px 6px", background:type.color+"18", borderRadius:6}}>{type.label}</span>
                      <span style={{fontSize:10, fontWeight:700, color:"var(--tx)", flex:1}}>{step.title}</span>
                      {m && <span style={{fontSize:8, color:m.color, fontWeight:600, display:"flex", alignItems:"center", gap:3}}>{m.icon} {m.short}</span>}
                      {step.duration && <span style={{fontSize:7, color:"var(--mu)", fontFamily:"var(--font-mono)"}}>{step.duration}s</span>}
                    </div>
                    {step.rationale && <div style={{fontSize:8, color:"var(--mu)", marginBottom:step.output?6:0, fontStyle:"italic"}}>{step.rationale}</div>}
                    {step.output && isDone && (
                      <div style={{fontSize:9, color:"var(--tx)", lineHeight:1.6, maxHeight:120, overflow:"auto", paddingTop:6, borderTop:"1px solid var(--bd)"}}>
                        {step.output.slice(0,400)}{step.output.length>400?"…":""}
                      </div>
                    )}
                    {step.output && step.status==="error" && (
                      <div style={{fontSize:9, color:"var(--red)", paddingTop:4}}>{step.output}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Assemblage */}
          {results.filter(r=>r.status==="done").length >= 2 && !running && (
            <div style={{marginTop:16, background:"var(--s1)", border:"1px solid rgba(52,211,153,.25)", borderRadius:10, padding:"14px 16px"}}>
              {!assembly && !assembling && (
                <button onClick={assembleResults}
                  style={{padding:"8px 20px", background:"rgba(52,211,153,.12)", border:"1px solid rgba(52,211,153,.35)", borderRadius:6, color:"var(--green)", fontSize:10, cursor:"pointer", fontWeight:700}}>
                  ✨ Assembler le livrable final
                </button>
              )}
              {assembling && <div style={{fontSize:10, color:"var(--mu)"}}>⏳ Assemblage en cours…</div>}
              {assembly && (
                <>
                  <div style={{fontSize:9, color:"var(--green)", fontWeight:700, marginBottom:10}}>✨ LIVRABLE FINAL</div>
                  <div style={{fontSize:10, color:"var(--tx)", lineHeight:1.8, whiteSpace:"pre-wrap"}}>{assembly}</div>
                  <div style={{display:"flex", gap:8, marginTop:12}}>
                    <button onClick={()=>navigator.clipboard.writeText(assembly)}
                      style={{fontSize:9, padding:"5px 12px", background:"transparent", border:"1px solid var(--bd)", borderRadius:5, color:"var(--mu)", cursor:"pointer"}}>📋 Copier</button>
                    <button onClick={()=>{setChatInput(assembly); navigateTab("chat");}}
                      style={{fontSize:9, padding:"5px 12px", background:"rgba(212,168,83,.1)", border:"1px solid rgba(212,168,83,.3)", borderRadius:5, color:"var(--ac)", cursor:"pointer"}}>→ Continuer dans le Chat</button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
