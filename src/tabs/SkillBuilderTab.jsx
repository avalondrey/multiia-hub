import React from 'react';

export default function SkillBuilderTab({ enabled, apiKeys, navigateTab, setChatInput, ...anyOtherProps }) {
  const SKILLS_KEY = "multiia_skills";
  const [skills, setSkills] = React.useState(() => { try { return JSON.parse(localStorage.getItem(SKILLS_KEY)||"[]"); } catch { return []; } });
  const [creating, setCreating] = React.useState(false);
  const [description, setDescription] = React.useState("");
  const [generating, setGenerating] = React.useState(false);
  const [draft, setDraft] = React.useState(null);
  const [selected, setSelected] = React.useState(null);
  const [running, setRunning] = React.useState({});
  const [outputs, setOutputs] = React.useState({});

  const activeIds = Object.keys(MODEL_DEFS).filter(id => enabled[id] && !MODEL_DEFS[id]?.serial);
  const bestIA = activeIds.find(id=>["groq","mistral","sambanova"].includes(id)) || activeIds[0];

  const saveSkills = (s) => { setSkills(s); try { localStorage.setItem(SKILLS_KEY, JSON.stringify(s)); } catch {} };

  const SKILL_TEMPLATES = [
    { desc:"Chaque matin, génère-moi 3 idées de posts LinkedIn sur les actualités IA" },
    { desc:"Analyse n'importe quel texte que je colle et donne-moi ses points forts et faiblesses" },
    { desc:"Quand je colle une URL d'article, fais-en un résumé en 5 points avec une opinion critique" },
    { desc:"Transforme n'importe quelle idée brute en plan de projet structuré en 5 étapes" },
    { desc:"Lis mon texte et réécris-le dans un style professionnel adapté à LinkedIn" },
    { desc:"Prends n'importe quelle question technique et explique-la avec une analogie du quotidien" },
  ];

  const generateSkill = async () => {
    if (!description.trim() || !bestIA) return;
    setGenerating(true); setDraft(null);

    const prompt = `Tu es un expert en prompt engineering et automatisation IA. L'utilisateur veut créer ce skill automatisé :
"${description}"

Génère la configuration complète de ce skill. Réponds UNIQUEMENT en JSON valide :
{
  "name": "Nom court du skill (3-5 mots)",
  "icon": "emoji représentatif",
  "description": "Ce que fait ce skill en 1 phrase",
  "category": "Productivité|Rédaction|Analyse|Code|Créatif|Recherche",
  "color": "#hexcolor",
  "trigger": "Manuel|Auto-matin|Auto-soir|Sur texte collé",
  "inputLabel": "Ce que l'utilisateur doit fournir (ex: Ton texte à analyser)",
  "inputPlaceholder": "Exemple de ce qu'on peut coller ici",
  "needsInput": true,
  "systemPrompt": "Le system prompt complet pour ce skill (role, ton, règles)",
  "userPromptTemplate": "Le template de prompt avec {{input}} pour le contenu de l'utilisateur",
  "outputFormat": "Texte|Liste|JSON|Markdown|Tableau",
  "estimatedTime": "~10s|~30s|~1min",
  "tips": ["Conseil d'utilisation 1", "Conseil d'utilisation 2"]
}`;

    try {
      const reply = await callModel(bestIA, [{role:"user",content:prompt}], apiKeys, "Expert prompt engineering. JSON uniquement, sans markdown.");
      const clean = reply.replace(/```json|```/g,"").trim();
      const data = JSON.parse(clean.match(/\{[\s\S]*\}/)?.[0]||clean);
      setDraft({ ...data, id:Date.now().toString(), createdAt:new Date().toISOString(), uses:0 });
    } catch(e) {
      alert("Erreur : "+e.message);
    }
    setGenerating(false);
  };

  const saveSkill = () => {
    if (!draft) return;
    const updated = [draft, ...skills];
    saveSkills(updated);
    setSelected(draft.id);
    setDraft(null); setCreating(false); setDescription("");
  };

  const runSkill = async (skill, userInput="") => {
    if (!activeIds.length) return;
    const ia = activeIds.find(id=>["groq","mistral","cerebras"].includes(id)) || activeIds[0];
    setRunning(prev=>({...prev,[skill.id]:true}));
    setOutputs(prev=>({...prev,[skill.id]:""}));
    try {
      const prompt = skill.needsInput
        ? skill.userPromptTemplate.replace("{{input}}", userInput || "[Aucune entrée fournie]")
        : skill.userPromptTemplate;
      const output = await callModel(ia, [{role:"user",content:prompt}], apiKeys, skill.systemPrompt);
      setOutputs(prev=>({...prev,[skill.id]:output}));
      // Incrémenter les uses
      saveSkills(skills.map(s => s.id===skill.id ? {...s, uses:(s.uses||0)+1} : s));
    } catch(e) {
      setOutputs(prev=>({...prev,[skill.id]:"❌ "+e.message}));
    }
    setRunning(prev=>({...prev,[skill.id]:false}));
  };

  const deleteSkill = (id) => {
    saveSkills(skills.filter(s=>s.id!==id));
    if (selected===id) setSelected(null);
  };

  const CATS = ["Tout", ...new Set(skills.map(s=>s.category||"Autre"))];
  const [catFilter, setCatFilter] = React.useState("Tout");
  const [userInputs, setUserInputs] = React.useState({});
  const filteredSkills = catFilter==="Tout" ? skills : skills.filter(s=>s.category===catFilter);
  const sel = skills.find(s=>s.id===selected);

  return (
    <div style={{flex:1,display:"flex",overflow:"hidden"}}>
      {/* Sidebar */}
      <div style={{width:200,flexShrink:0,borderRight:"1px solid var(--bd)",display:"flex",flexDirection:"column",overflow:"hidden",background:"var(--s1)"}}>
        <div style={{padding:"10px 12px",borderBottom:"1px solid var(--bd)"}}>
          <div style={{fontFamily:"var(--font-display)",fontWeight:800,fontSize:12,color:"var(--ac)",marginBottom:8}}>🛠 Mes Skills</div>
          <button onClick={()=>{setCreating(true);setSelected(null);setDraft(null);}}
            style={{width:"100%",padding:"6px",background:"rgba(212,168,83,.15)",border:"1px solid rgba(212,168,83,.4)",borderRadius:5,color:"var(--ac)",fontSize:9,cursor:"pointer",fontWeight:700}}>
            + Créer un skill
          </button>
        </div>
        {/* Filtre catégories */}
        {CATS.length > 1 && (
          <div style={{padding:"6px 8px",borderBottom:"1px solid var(--bd)",display:"flex",gap:3,flexWrap:"wrap"}}>
            {CATS.map(c=>(
              <button key={c} onClick={()=>setCatFilter(c)}
                style={{padding:"2px 6px",borderRadius:6,border:"1px solid "+(catFilter===c?"var(--ac)":"transparent"),background:catFilter===c?"rgba(212,168,83,.12)":"transparent",color:catFilter===c?"var(--ac)":"var(--mu)",fontSize:7,cursor:"pointer"}}>
                {c}
              </button>
            ))}
          </div>
        )}
        <div style={{flex:1,overflow:"auto"}}>
          {filteredSkills.length===0 && <div style={{padding:16,fontSize:9,color:"var(--mu)",textAlign:"center"}}>Aucun skill.<br/>Crée le tien !</div>}
          {filteredSkills.map(s=>(
            <div key={s.id} onClick={()=>{setSelected(s.id);setCreating(false);}}
              style={{padding:"9px 12px",cursor:"pointer",borderBottom:"1px solid var(--bd)",background:selected===s.id?"rgba(212,168,83,.08)":"transparent",borderLeft:"3px solid "+(selected===s.id?s.color||"var(--ac)":"transparent")}}>
              <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:2}}>
                <span style={{fontSize:12}}>{s.icon}</span>
                <span style={{fontSize:9,fontWeight:600,color:selected===s.id?"var(--ac)":"var(--tx)",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.name}</span>
              </div>
              <div style={{fontSize:7,color:"var(--mu)"}}>{s.category||"Général"} · ×{s.uses||0}</div>
            </div>
          ))}
        </div>
        {skills.length>0 && (
          <div style={{padding:"6px 12px",borderTop:"1px solid var(--bd)",fontSize:7,color:"var(--mu)"}}>
            {skills.length} skills · {skills.reduce((a,s)=>a+(s.uses||0),0)} utilisations
          </div>
        )}
      </div>

      {/* Main */}
      <div style={{flex:1,overflow:"auto",padding:"14px 16px"}}>

        {/* Créer */}
        {creating && (
          <div style={{maxWidth:580}}>
            <div style={{fontFamily:"var(--font-display)",fontWeight:800,fontSize:14,color:"var(--ac)",marginBottom:14}}>🆕 Nouveau Skill</div>
            <div style={{fontSize:9,color:"var(--mu)",marginBottom:10,padding:"8px 12px",background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:6}}>
              Décris ce que tu veux automatiser en langage naturel. L'IA génère automatiquement le prompt, les paramètres et la configuration.
            </div>

            {/* Templates */}
            <div style={{marginBottom:12}}>
              <div style={{fontSize:8,color:"var(--mu)",fontWeight:700,marginBottom:6}}>EXEMPLES D'AUTOMATISATIONS</div>
              <div style={{display:"flex",flexDirection:"column",gap:4}}>
                {SKILL_TEMPLATES.map((t,i)=>(
                  <button key={i} onClick={()=>setDescription(t.desc)}
                    style={{padding:"6px 10px",textAlign:"left",background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:6,color:"var(--mu)",fontSize:9,cursor:"pointer",lineHeight:1.4}}>
                    → {t.desc}
                  </button>
                ))}
              </div>
            </div>

            <textarea value={description} onChange={e=>setDescription(e.target.value)}
              placeholder="Décris ton automatisation en langage naturel…"
              rows={4} style={{width:"100%",background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:6,color:"var(--tx)",fontSize:11,padding:"9px 12px",resize:"vertical",outline:"none",boxSizing:"border-box",marginBottom:10}}/>

            {!draft && (
              <button onClick={generateSkill} disabled={generating||!description.trim()||!bestIA}
                style={{padding:"8px 20px",background:"rgba(212,168,83,.15)",border:"1px solid rgba(212,168,83,.4)",borderRadius:6,color:"var(--ac)",fontSize:10,cursor:"pointer",fontWeight:700}}>
                {generating?"⏳ Génération…":"✨ Générer le skill"}
              </button>
            )}

            {/* Aperçu du draft */}
            {draft && (
              <div style={{marginTop:12,background:"var(--s1)",border:"1px solid rgba(74,222,128,.3)",borderRadius:10,padding:"14px 16px"}}>
                <div style={{fontSize:9,color:"var(--green)",fontWeight:700,marginBottom:10}}>✓ Skill généré — Aperçu</div>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                  <span style={{fontSize:24}}>{draft.icon}</span>
                  <div>
                    <div style={{fontWeight:700,fontSize:13,color:"var(--tx)"}}>{draft.name}</div>
                    <div style={{fontSize:9,color:"var(--mu)"}}>{draft.category} · {draft.trigger} · {draft.estimatedTime}</div>
                  </div>
                </div>
                <div style={{fontSize:9,color:"var(--tx)",marginBottom:8,lineHeight:1.5}}>{draft.description}</div>
                <div style={{fontSize:8,color:"var(--mu)",marginBottom:4,fontWeight:700}}>PROMPT SYSTÈME</div>
                <div style={{fontSize:9,color:"var(--mu)",background:"var(--s2)",borderRadius:5,padding:"6px 10px",marginBottom:10,lineHeight:1.5}}>{draft.systemPrompt?.slice(0,150)}…</div>
                {draft.tips?.length>0 && (
                  <div style={{fontSize:8,color:"var(--ac)",marginBottom:10}}>
                    {draft.tips.map((t,i)=><div key={i}>💡 {t}</div>)}
                  </div>
                )}
                <div style={{display:"flex",gap:8}}>
                  <button onClick={saveSkill}
                    style={{padding:"7px 18px",background:"rgba(74,222,128,.12)",border:"1px solid rgba(74,222,128,.3)",borderRadius:5,color:"var(--green)",fontSize:10,cursor:"pointer",fontWeight:700}}>
                    💾 Sauvegarder ce skill
                  </button>
                  <button onClick={()=>setDraft(null)}
                    style={{padding:"7px 12px",background:"transparent",border:"1px solid var(--bd)",borderRadius:5,color:"var(--mu)",fontSize:9,cursor:"pointer"}}>Regénérer</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Skill sélectionné */}
        {sel && !creating && (() => {
          const skillOutput = outputs[sel.id];
          const isRunning = running[sel.id];
          const userInput = userInputs[sel.id]||"";
          return (
            <div>
              {/* Header */}
              <div style={{display:"flex",alignItems:"flex-start",gap:12,marginBottom:14,flexWrap:"wrap"}}>
                <span style={{fontSize:32}}>{sel.icon}</span>
                <div style={{flex:1}}>
                  <div style={{fontFamily:"var(--font-display)",fontWeight:800,fontSize:16,color:sel.color||"var(--ac)",marginBottom:2}}>{sel.name}</div>
                  <div style={{fontSize:9,color:"var(--mu)",marginBottom:4}}>{sel.category} · {sel.trigger} · {sel.estimatedTime} · ×{sel.uses||0} utilisation{sel.uses!==1?"s":""}</div>
                  <div style={{fontSize:10,color:"var(--tx)"}}>{sel.description}</div>
                </div>
                <button onClick={()=>deleteSkill(sel.id)} style={{fontSize:9,padding:"4px 10px",background:"rgba(248,113,113,.1)",border:"1px solid rgba(248,113,113,.3)",borderRadius:5,color:"var(--red)",cursor:"pointer"}}>🗑</button>
              </div>

              {/* Input utilisateur */}
              {sel.needsInput && (
                <div style={{marginBottom:12}}>
                  <div style={{fontSize:8,color:"var(--mu)",fontWeight:700,marginBottom:5}}>{sel.inputLabel||"ENTRÉE"}</div>
                  <textarea value={userInput} onChange={e=>setUserInputs(prev=>({...prev,[sel.id]:e.target.value}))}
                    placeholder={sel.inputPlaceholder||"Colle ton contenu ici…"}
                    rows={4} style={{width:"100%",background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:6,color:"var(--tx)",fontSize:10,padding:"8px 10px",resize:"vertical",outline:"none",boxSizing:"border-box"}}/>
                </div>
              )}

              <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
                <button onClick={()=>runSkill(sel, userInput)} disabled={isRunning||(sel.needsInput&&!userInput.trim())}
                  style={{padding:"8px 20px",background:isRunning?"var(--s2)":`${sel.color||"#D4A853"}22`,border:`1px solid ${sel.color||"var(--ac)"}66`,borderRadius:6,color:isRunning?"var(--mu)":(sel.color||"var(--ac)"),fontSize:10,cursor:isRunning?"default":"pointer",fontWeight:700}}>
                  {isRunning?"⏳ Exécution…":`${sel.icon} Exécuter`}
                </button>
              </div>

              {/* Résultat */}
              {skillOutput && (
                <div style={{background:"var(--s1)",border:`1px solid ${sel.color||"var(--ac)"}33`,borderRadius:10,padding:"14px 16px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                    <div style={{fontSize:9,color:sel.color||"var(--ac)",fontWeight:700}}>RÉSULTAT</div>
                    <button onClick={()=>navigator.clipboard.writeText(skillOutput)} style={{fontSize:8,padding:"2px 8px",background:"rgba(212,168,83,.1)",border:"1px solid rgba(212,168,83,.3)",borderRadius:4,color:"var(--ac)",cursor:"pointer"}}>📋</button>
                    <button onClick={()=>{setChatInput(skillOutput);navigateTab("chat");}} style={{fontSize:8,padding:"2px 8px",background:"transparent",border:"1px solid var(--bd)",borderRadius:4,color:"var(--mu)",cursor:"pointer"}}>→ Chat</button>
                  </div>
                  <div style={{fontSize:10,color:"var(--tx)",lineHeight:1.8,whiteSpace:"pre-wrap"}}>{skillOutput}</div>
                </div>
              )}

              {/* Conseils */}
              {sel.tips?.length>0 && !skillOutput && (
                <div style={{marginTop:10,padding:"10px 12px",background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:8}}>
                  <div style={{fontSize:8,color:"var(--mu)",fontWeight:700,marginBottom:5}}>CONSEILS D'UTILISATION</div>
                  {sel.tips.map((t,i)=><div key={i} style={{fontSize:9,color:"var(--tx)",marginBottom:3}}>💡 {t}</div>)}
                </div>
              )}
            </div>
          );
        })()}

        {!creating && !sel && (
          <div style={{textAlign:"center",padding:"50px 20px"}}>
            <div style={{fontSize:40,marginBottom:10}}>🛠</div>
            <div style={{fontSize:13,fontWeight:700,color:"var(--tx)",marginBottom:6}}>Skill Builder</div>
            <div style={{fontSize:10,color:"var(--mu)",marginBottom:20,maxWidth:360,margin:"0 auto 20px"}}>Crée des automatisations IA personnalisées en décrivant ce que tu veux en langage naturel. L'IA génère le prompt parfait.</div>
            <button onClick={()=>setCreating(true)} style={{padding:"10px 24px",background:"rgba(212,168,83,.15)",border:"1px solid rgba(212,168,83,.4)",borderRadius:8,color:"var(--ac)",fontSize:11,cursor:"pointer",fontWeight:700}}>
              ✨ Créer mon premier skill
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
