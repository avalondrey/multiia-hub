import React from "react";
import { MODEL_DEFS } from "../config/models.js";
import { callModel } from "../api/ai-service.js";
import MarkdownRenderer from "../components/MarkdownRenderer.jsx";

// AGENT AUTONOME TAB
// ═══════════════════════════════════════════════════════════
export default function AgentTab({ enabled, apiKeys }) {
  const AGENT_PREFERRED = ["groq","mistral","cohere","cerebras","sambanova","mixtral"];
  const [objective, setObjective] = React.useState("");
  const [steps, setSteps] = React.useState([]);
  const [running, setRunning] = React.useState(false);
  const [currentStep, setCurrentStep] = React.useState(-1);
  const [finalResult, setFinalResult] = React.useState("");
  const activeAgentIds = Object.keys(MODEL_DEFS).filter(id => enabled[id]);
  const AGENT_PREF = ["groq","mistral","cohere","cerebras","sambanova","mixtral"];
  const defaultAgentIA = AGENT_PREF.find(id => enabled[id]) || "mistral";
  const [agentIA, setAgentIA] = React.useState(defaultAgentIA);
  const activeIds = Object.keys(MODEL_DEFS).filter(id => enabled[id]);

  const run = async () => {
    if (!objective.trim()) return;
    const ia = activeIds.includes(agentIA) ? agentIA : activeIds[0];
    if (!ia) return;
    setRunning(true); setSteps([]); setFinalResult(""); setCurrentStep(0);
    try {
      // Étape 1: Décomposer l'objectif
      const planPrompt = `Tu es un agent IA autonome. Décompose cet objectif en 3 à 5 étapes concrètes et exécutables.
Objectif : ${objective}

Réponds UNIQUEMENT avec un JSON valide dans ce format exact :
{"steps": [{"id":1,"title":"Titre court","action":"Description de l'action à réaliser"},...]}`;
      
      const planRaw = await callModel(ia,[{role:"user",content:planPrompt}],apiKeys,"Tu es un agent autonome. Tu réponds uniquement en JSON valide, sans markdown.");
      let plan;
      try {
        const clean = planRaw.replace(/\`\`\`json|\`\`\`/g,"").trim();
        plan = JSON.parse(clean);
      } catch { 
        plan = {steps:[
          {id:1,title:"Analyse",action:"Analyser l'objectif et les contraintes"},
          {id:2,title:"Exécution",action:"Réaliser la tâche principale : "+objective},
          {id:3,title:"Synthèse",action:"Synthétiser et présenter les résultats"}
        ]};
      }
      const plannedSteps = (plan.steps || plan).map(s=>({...s,output:"",status:"pending"}));
      setSteps(plannedSteps);

      // Exécuter chaque étape
      let context = "";
      for (let i=0; i<plannedSteps.length; i++) {
        setCurrentStep(i);
        const step = plannedSteps[i];
        setSteps(prev=>prev.map((s,idx)=>idx===i?{...s,status:"running"}:s));
        
        const stepPrompt = `Objectif global : ${objective}
${context ? "Contexte des étapes précédentes :\n"+context+"\n\n" : ""}Étape actuelle (${i+1}/${plannedSteps.length}) : ${step.title}
Action : ${step.action}

Réalise cette étape de façon concrète et utile. Sois précis et actionnable.`;
        
        try {
          const output = await callModel(ia,[{role:"user",content:stepPrompt}],apiKeys,"Tu es un agent IA expert. Tu exécutes chaque étape de façon concrète et précise.");
          context += `\nÉtape ${i+1} (${step.title}): ${output.slice(0,500)}`;
          setSteps(prev=>prev.map((s,idx)=>idx===i?{...s,output,status:"done"}:s));
        } catch(e) {
          setSteps(prev=>prev.map((s,idx)=>idx===i?{...s,output:"❌ "+e.message,status:"error"}:s));
        }
      }

      // Synthèse finale
      setCurrentStep(plannedSteps.length);
      const synthPrompt = `Objectif : ${objective}\n\nToutes les étapes ont été réalisées. Voici le contexte :\n${context}\n\nFais une synthèse finale claire, structurée et actionnable pour l'utilisateur.`;
      const synthesis = await callModel(ia,[{role:"user",content:synthPrompt}],apiKeys,"Tu es un expert en synthèse. Tu présentes les résultats de façon claire et utile.");
      setFinalResult(synthesis);
    } finally { setRunning(false); setCurrentStep(-1); }
  };

  const STEP_TEMPLATES = [
    {label:"📝 Article de blog",obj:"Écris un article de blog complet sur l'intelligence artificielle en 2025, avec introduction accrocheuse, 3 sections développées et conclusion"},
    {label:"📊 Analyse concurrentielle",obj:"Fais une analyse concurrentielle de ChatGPT, Claude et Gemini : forces, faiblesses, cas d'usage idéaux"},
    {label:"💻 Plan technique",obj:"Crée un plan technique détaillé pour développer une application React de gestion de tâches avec backend Node.js"},
    {label:"🎯 Stratégie marketing",obj:"Développe une stratégie marketing pour lancer une application mobile IA sur le marché français"},
  ];

  return (
    <div className="agent-wrap">
      <div className="agent-hdr">
        <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:14,color:"var(--ac)"}}>🤖 Agent Autonome</div>
        <div style={{fontSize:9,color:"var(--mu)",marginTop:3}}>Donne un objectif complexe → l'IA planifie, décompose et exécute étape par étape</div>
      </div>
      <div style={{padding:"10px 14px",borderBottom:"1px solid var(--bd)",flexShrink:0,background:"var(--s1)"}}>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8}}>
          {STEP_TEMPLATES.map(t=>(
            <button key={t.label} onClick={()=>setObjective(t.obj)}
              style={{padding:"4px 10px",background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:5,color:"var(--mu)",fontSize:9,cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace"}}>
              {t.label}
            </button>
          ))}
        </div>
        <textarea style={{width:"100%",background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:7,color:"var(--tx)",fontFamily:"'IBM Plex Mono',monospace",fontSize:12,padding:"10px 12px",resize:"none",outline:"none",minHeight:64,boxSizing:"border-box"}}
          value={objective} onChange={e=>setObjective(e.target.value)}
          placeholder="Décris ton objectif… Ex: Écris un article complet sur le machine learning, avec exemples de code Python et cas d'usage pratiques"/>
        <div style={{display:"flex",alignItems:"center",gap:8,marginTop:8}}>
          <span style={{fontSize:9,color:"var(--mu)"}}>IA :</span>
          <select className="yt-add-inp" style={{flex:"none",width:"auto",padding:"3px 6px",fontSize:10}} value={agentIA} onChange={e=>setAgentIA(e.target.value)}>
            {activeIds.map(id=><option key={id} value={id}>{MODEL_DEFS[id].icon} {MODEL_DEFS[id].short}</option>)}
          </select>
          <button onClick={run} disabled={running||!objective.trim()||!activeIds.length}
            style={{marginLeft:"auto",background:running?"var(--s2)":"var(--ac)",border:"none",borderRadius:7,color:running?"var(--mu)":"#09090B",fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:12,padding:"9px 20px",cursor:running?"not-allowed":"pointer"}}>
            {running?"⏳ Exécution...":"▶ Lancer l'agent"}
          </button>
        </div>
      </div>
      <div className="agent-body">
        {steps.length===0 && !running && (
          <div style={{textAlign:"center",padding:"40px 20px",color:"var(--mu)"}}>
            <div style={{fontSize:40,marginBottom:12}}>🤖</div>
            <div style={{fontSize:12,marginBottom:6}}>L'agent va :</div>
            <div style={{fontSize:10,lineHeight:1.9,color:"#555568"}}>
              1️⃣ Analyser ton objectif<br/>
              2️⃣ Le décomposer en étapes<br/>
              3️⃣ Exécuter chaque étape séquentiellement<br/>
              4️⃣ Produire une synthèse finale
            </div>
          </div>
        )}
        {steps.map((s,i)=>(
          <div key={s.id} className={`agent-step-card ${s.status}`}>
            <div style={{fontSize:9,color:"var(--mu)",marginBottom:4,display:"flex",alignItems:"center",gap:6}}>
              <span style={{background:s.status==="done"?"var(--green)":s.status==="running"?"var(--ac)":"var(--bd)",color:s.status==="done"||s.status==="running"?"#09090B":"var(--mu)",padding:"1px 6px",borderRadius:3,fontWeight:700}}>
                {s.status==="done"?"✓":s.status==="running"?"⏳":i+1}
              </span>
              ÉTAPE {i+1}/{steps.length}
            </div>
            <div style={{fontSize:12,fontWeight:700,color:"var(--tx)",marginBottom:4}}>{s.title}</div>
            <div style={{fontSize:9,color:"var(--mu)",marginBottom:6,fontStyle:"italic"}}>{s.action}</div>
            {s.output && <div className="agent-step-output">{s.output}</div>}
          </div>
        ))}
        {finalResult && (
          <div className="agent-final">
            <div style={{fontSize:10,color:"var(--ac)",fontWeight:700,marginBottom:8,display:"flex",alignItems:"center",gap:8}}>
              ✨ SYNTHÈSE FINALE
              <button onClick={()=>navigator.clipboard.writeText(finalResult)} style={{marginLeft:"auto",background:"none",border:"1px solid rgba(212,168,83,.3)",borderRadius:3,color:"var(--ac)",fontSize:9,padding:"2px 8px",cursor:"pointer"}}>⎘ Copier</button>
            </div>
            <div className="agent-final-content"><MarkdownRenderer text={finalResult}/></div>
          </div>
        )}
      </div>
    </div>
  );
}
