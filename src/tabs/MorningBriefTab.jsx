import React from 'react';

export default function MorningBriefTab({ enabled, apiKeys, projects, memFacts, usageStats, ...anyOtherProps }) {
  const BRIEF_KEY = "multiia_morning_brief";
  const BRIEF_CONF = "multiia_brief_config";

  const [config, setConfig] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem(BRIEF_CONF) || "{}"); } catch { return {}; }
  });
  const [brief, setBrief] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem(BRIEF_KEY) || "null"); } catch { return null; }
  });
  const [loading, setLoading] = React.useState(false);
  const [editConfig, setEditConfig] = React.useState(false);

  const saveConfig = (c) => { setConfig(c); try { localStorage.setItem(BRIEF_CONF, JSON.stringify(c)); } catch {} };
  const saveBrief  = (b) => { setBrief(b);  try { localStorage.setItem(BRIEF_KEY, JSON.stringify(b)); } catch {} };

  const activeIds = Object.keys(MODEL_DEFS).filter(id => enabled[id] && !MODEL_DEFS[id]?.serial);
  const bestIA    = activeIds.find(id => ["groq","mistral","cerebras","sambanova"].includes(id)) || activeIds[0];

  // Vérification auto chaque minute — génère le brief si l'heure est atteinte
  React.useEffect(() => {
    if (!config.autoTime || !config.enabled) return;
    const iv = setInterval(() => {
      const now  = new Date();
      const hhmm = now.getHours().toString().padStart(2,"0") + ":" + now.getMinutes().toString().padStart(2,"0");
      const today = now.toISOString().slice(0,10);
      if (hhmm === config.autoTime && brief?.date !== today) {
        generateBrief(true); // silent auto-generation
      }
    }, 60000);
    return () => clearInterval(iv);
  }, [config, brief]);

  const generateBrief = async (silent = false) => {
    if (!bestIA) return;
    if (!silent) setLoading(true);

    // Contexte personnalisé
    const topIA = Object.entries(usageStats?.msgs || {}).sort(([,a],[,b])=>b-a)[0];
    const activeProjects = (projects || []).filter(p => p.context || p.notes).slice(0,2);
    const memories = (memFacts || []).slice(0,5).map(f => "- " + f.text).join("\n");

    const date = new Date().toLocaleDateString("fr-FR", { weekday:"long", day:"numeric", month:"long", year:"numeric" });
    const sections = config.sections || ["actu","taches","conseil","citation"];

    const sectionPrompts = {
      actu:     "📰 ACTUALITÉS IA DU JOUR (3 tendances ou nouvelles importantes du monde de l'IA aujourd'hui)",
      taches:   "✅ TOP 3 TÂCHES (basé sur les projets actifs, suggère les 3 actions les plus impactantes pour aujourd'hui)",
      conseil:  "💡 CONSEIL IA DU JOUR (1 astuce pratique pour mieux utiliser les LLMs aujourd'hui)",
      citation: "✨ INSPIRATION (1 citation motivante en lien avec l'IA ou la créativité)",
      meteo_ia: "🌡️ MÉTÉO IA (température du marché IA : chaud/tiède/calme, et pourquoi en 1 phrase)",
      prompt:   "🎯 PROMPT DU JOUR (1 prompt prêt à l'emploi, utile et original)",
    };

    const prompt = `Tu es l'assistant personnel de quelqu'un qui utilise des IAs tous les jours. Génère son briefing du matin pour ${date}.

CONTEXTE UTILISATEUR :
- IA préférée : ${topIA ? MODEL_DEFS[topIA[0]]?.name : "non définie"}
- Projets actifs : ${activeProjects.map(p=>p.name+"("+p.desc+")").join(", ") || "aucun"}
- Mémoire personnelle : ${memories || "vide"}
- Sections demandées : ${sections.join(", ")}

Génère UNIQUEMENT un JSON valide :
{
  "salutation": "Bonjour [prénom si connu, sinon utilisateur]",
  "date_str": "${date}",
  "sections": {
    ${sections.map(s => `"${s}": ${s === "taches" ? '["tâche 1","tâche 2","tâche 3"]' : s === "actu" ? '["actu 1","actu 2","actu 3"]' : '"contenu"'}`).join(",\n    ")}
  },
  "ia_du_jour": {"id":"${bestIA}","raison":"pourquoi utiliser cette IA aujourd'hui"},
  "minute_a_retenir": "1 chose importante à savoir aujourd'hui en IA (max 2 phrases)"
}`;

    try {
      const reply = await callModel(bestIA, [{role:"user", content:prompt}], apiKeys, "Assistant personnel briefing. JSON uniquement, sans markdown.");
      const clean = reply.replace(/```json|```/g,"").trim();
      const data  = JSON.parse(clean.match(/\{[\s\S]*\}/)?.[0] || clean);
      const result = { ...data, generatedAt: new Date().toISOString(), date: new Date().toISOString().slice(0,10), ia: bestIA };
      saveBrief(result);
    } catch(e) {
      if (!silent) saveBrief({ error: e.message, generatedAt: new Date().toISOString(), date: new Date().toISOString().slice(0,10) });
    }
    if (!silent) setLoading(false);
  };

  const SECTION_LABELS = {
    actu:     { icon:"📰", label:"Actualités IA" },
    taches:   { icon:"✅", label:"Mes 3 tâches" },
    conseil:  { icon:"💡", label:"Conseil du jour" },
    citation: { icon:"✨", label:"Inspiration" },
    meteo_ia: { icon:"🌡️", label:"Météo IA" },
    prompt:   { icon:"🎯", label:"Prompt du jour" },
  };

  const isToday = brief?.date === new Date().toISOString().slice(0,10);
  const m = MODEL_DEFS[brief?.ia];

  return (
    <div style={{flex:1, overflow:"auto", padding:"clamp(10px,2vw,16px)"}}>
      {/* Header */}
      <div style={{display:"flex", alignItems:"center", gap:10, marginBottom:6, flexWrap:"wrap"}}>
        <div style={{fontFamily:"var(--font-display)", fontWeight:800, fontSize:"clamp(14px,2.5vw,20px)", color:"var(--ac)"}}>☀️ Morning Brief</div>
        <div style={{fontSize:9, color:"var(--mu)"}}>— Ton briefing IA personnalisé, chaque matin</div>
        <div style={{marginLeft:"auto", display:"flex", gap:8}}>
          <button onClick={()=>setEditConfig(v=>!v)}
            style={{padding:"5px 12px", background:"transparent", border:"1px solid var(--bd)", borderRadius:5, color:"var(--mu)", fontSize:9, cursor:"pointer"}}>
            ⚙ Configurer
          </button>
          <button onClick={()=>generateBrief()} disabled={loading||!bestIA}
            style={{padding:"5px 14px", background:"rgba(212,168,83,.15)", border:"1px solid rgba(212,168,83,.4)", borderRadius:5, color:"var(--ac)", fontSize:9, cursor:"pointer", fontWeight:700}}>
            {loading ? "⏳ Génération…" : "🔄 Générer maintenant"}
          </button>
        </div>
      </div>

      {/* Config panel */}
      {editConfig && (
        <div style={{marginBottom:14, background:"var(--s1)", border:"1px solid var(--bd)", borderRadius:10, padding:"14px 16px"}}>
          <div style={{fontWeight:700, fontSize:11, color:"var(--tx)", marginBottom:12}}>⚙ Configuration du brief</div>
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12}}>
            <div>
              <div style={{fontSize:8, color:"var(--mu)", fontWeight:700, marginBottom:5}}>GÉNÉRATION AUTO</div>
              <div style={{display:"flex", alignItems:"center", gap:8}}>
                <input type="checkbox" checked={!!config.enabled} onChange={e=>saveConfig({...config, enabled:e.target.checked})}/>
                <label style={{fontSize:9, color:"var(--tx)"}}>Activer le brief automatique</label>
              </div>
              <div style={{marginTop:6, display:"flex", alignItems:"center", gap:6}}>
                <span style={{fontSize:9, color:"var(--mu)"}}>Heure :</span>
                <input type="time" value={config.autoTime||"08:00"} onChange={e=>saveConfig({...config, autoTime:e.target.value})}
                  style={{background:"var(--s2)", border:"1px solid var(--bd)", borderRadius:4, color:"var(--tx)", fontSize:9, padding:"3px 8px", outline:"none"}}/>
              </div>
            </div>
            <div>
              <div style={{fontSize:8, color:"var(--mu)", fontWeight:700, marginBottom:5}}>SECTIONS INCLUSES</div>
              <div style={{display:"flex", flexWrap:"wrap", gap:4}}>
                {Object.entries(SECTION_LABELS).map(([k,{icon,label}])=>{
                  const active = (config.sections||["actu","taches","conseil","citation"]).includes(k);
                  return <button key={k} onClick={()=>{
                    const cur = config.sections||["actu","taches","conseil","citation"];
                    const next = active ? cur.filter(s=>s!==k) : [...cur,k];
                    saveConfig({...config, sections:next});
                  }} style={{padding:"3px 8px", borderRadius:8, border:"1px solid "+(active?"var(--ac)":"var(--bd)"), background:active?"rgba(212,168,83,.12)":"transparent", color:active?"var(--ac)":"var(--mu)", fontSize:8, cursor:"pointer"}}>
                    {icon} {label}
                  </button>;
                })}
              </div>
            </div>
          </div>
          <div style={{fontSize:8, color:"var(--mu)", fontStyle:"italic"}}>
            💡 Le brief utilise tes projets actifs, ta mémoire personnelle et ton historique d'usage pour personnaliser le contenu.
          </div>
        </div>
      )}

      {/* Pas de brief */}
      {!brief && !loading && (
        <div style={{textAlign:"center", padding:"60px 20px"}}>
          <div style={{fontSize:48, marginBottom:12}}>☀️</div>
          <div style={{fontSize:14, fontWeight:700, color:"var(--tx)", marginBottom:6}}>Aucun brief généré</div>
          <div style={{fontSize:10, color:"var(--mu)", marginBottom:20}}>Clique sur "Générer maintenant" pour recevoir ton premier briefing personnalisé.</div>
          <button onClick={()=>generateBrief()} disabled={!bestIA}
            style={{padding:"10px 24px", background:"rgba(212,168,83,.15)", border:"1px solid rgba(212,168,83,.4)", borderRadius:8, color:"var(--ac)", fontSize:11, cursor:"pointer", fontWeight:700}}>
            ☀️ Créer mon premier brief
          </button>
          {!bestIA && <div style={{marginTop:8, fontSize:9, color:"var(--red)"}}>Active au moins une IA dans Config</div>}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{textAlign:"center", padding:"60px 20px"}}>
          <div style={{fontSize:32, marginBottom:10, animation:"spin 2s linear infinite", display:"inline-block"}}>⚙️</div>
          <div style={{fontSize:11, color:"var(--mu)"}}>Génération de ton briefing personnalisé…</div>
        </div>
      )}

      {/* Brief affiché */}
      {brief && !loading && !brief.error && (
        <div>
          {/* En-tête */}
          <div style={{marginBottom:16, padding:"16px 20px", background:"linear-gradient(135deg, rgba(212,168,83,.12), rgba(212,168,83,.04))", border:"1px solid rgba(212,168,83,.3)", borderRadius:12}}>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:6}}>
              <div>
                <div style={{fontFamily:"var(--font-display)", fontWeight:800, fontSize:"clamp(16px,3vw,22px)", color:"var(--ac)", marginBottom:2}}>{brief.salutation || "Bonjour !"}</div>
                <div style={{fontSize:10, color:"var(--mu)"}}>{brief.date_str}</div>
              </div>
              <div style={{display:"flex", alignItems:"center", gap:6, fontSize:9, color:"var(--mu)"}}>
                {m && <><span style={{color:m.color}}>{m.icon} {m.short}</span> · </>}
                {isToday ? <span style={{color:"var(--green)"}}>✓ Aujourd'hui</span> : <span style={{color:"var(--orange)"}}>Hier</span>}
              </div>
            </div>
            {brief.minute_a_retenir && (
              <div style={{marginTop:10, padding:"8px 12px", background:"rgba(212,168,83,.08)", borderRadius:6, fontSize:10, color:"var(--tx)", lineHeight:1.6, fontStyle:"italic"}}>
                🔑 {brief.minute_a_retenir}
              </div>
            )}
          </div>

          {/* IA du jour */}
          {brief.ia_du_jour && MODEL_DEFS[brief.ia_du_jour.id] && (
            <div style={{marginBottom:12, padding:"10px 14px", background:"var(--s1)", border:"1px solid "+MODEL_DEFS[brief.ia_du_jour.id].color+"33", borderRadius:8, display:"flex", alignItems:"center", gap:10}}>
              <span style={{fontSize:20}}>{MODEL_DEFS[brief.ia_du_jour.id].icon}</span>
              <div>
                <div style={{fontSize:9, color:"var(--mu)", fontWeight:700}}>IA DU JOUR</div>
                <div style={{fontSize:10, fontWeight:700, color:MODEL_DEFS[brief.ia_du_jour.id].color}}>{MODEL_DEFS[brief.ia_du_jour.id].name}</div>
                <div style={{fontSize:9, color:"var(--mu)"}}>{brief.ia_du_jour.raison}</div>
              </div>
            </div>
          )}

          {/* Sections */}
          <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:10}}>
            {Object.entries(brief.sections || {}).map(([key, content]) => {
              const meta = SECTION_LABELS[key] || {icon:"📌", label:key};
              const isList = Array.isArray(content);
              return (
                <div key={key} style={{background:"var(--s1)", border:"1px solid var(--bd)", borderRadius:10, padding:"12px 14px"}}>
                  <div style={{fontSize:9, fontWeight:700, color:"var(--ac)", marginBottom:8}}>{meta.icon} {meta.label.toUpperCase()}</div>
                  {isList
                    ? content.map((item,i) => (
                        <div key={i} style={{display:"flex", gap:8, marginBottom:6, fontSize:10, color:"var(--tx)", lineHeight:1.5}}>
                          <span style={{color:"var(--ac)", flexShrink:0, fontWeight:700}}>{i+1}.</span>{item}
                        </div>
                      ))
                    : <div style={{fontSize:10, color:"var(--tx)", lineHeight:1.7}}>{content}</div>
                  }
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div style={{marginTop:12, display:"flex", gap:8, justifyContent:"flex-end"}}>
            <button onClick={()=>{ const txt = `☀️ Morning Brief — ${brief.date_str}\n\n`+Object.entries(brief.sections||{}).map(([k,v])=>`${SECTION_LABELS[k]?.icon} ${SECTION_LABELS[k]?.label}\n${Array.isArray(v)?v.map((x,i)=>(i+1)+". "+x).join("\n"):v}`).join("\n\n"); navigator.clipboard.writeText(txt); }}
              style={{fontSize:9, padding:"5px 12px", background:"transparent", border:"1px solid var(--bd)", borderRadius:5, color:"var(--mu)", cursor:"pointer"}}>📋 Copier</button>
            <button onClick={()=>generateBrief()}
              style={{fontSize:9, padding:"5px 12px", background:"rgba(212,168,83,.1)", border:"1px solid rgba(212,168,83,.3)", borderRadius:5, color:"var(--ac)", cursor:"pointer"}}>🔄 Regénérer</button>
          </div>
        </div>
      )}

      {brief?.error && <div style={{padding:20, color:"var(--red)", fontSize:10}}>Erreur : {brief.error}</div>}
    </div>
  );
}
