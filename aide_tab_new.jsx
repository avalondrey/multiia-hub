// ── AideTab ──────────────────────────────────────────────────────
const TUTORIALS = [
  { id:"t01", num:"01", icon:"🤖", title:"Bienvenue sur Multi-IA Hub",   sub:"Présentation générale · 6 slides",        color:"#D4A853", level:"Débutant",       file:"tuto_01_bienvenue.html" },
  { id:"t02", num:"02", icon:"💬", title:"Premier Chat & Clés API",       sub:"Configurer les IAs gratuites · 6 slides", color:"#60A5FA", level:"Débutant",       file:"tuto_02_premier_chat.html" },
  { id:"t03", num:"03", icon:"🧭", title:"Le Smart Router",               sub:"Analyse de fichiers auto · 5 slides",     color:"#A78BFA", level:"Débutant",       file:"tuto_03_smart_router.html" },
  { id:"t04", num:"04", icon:"⚡", title:"Le Débat Multi-IAs",            sub:"Analyser sous tous les angles · 5 slides",color:"#F97316", level:"Intermédiaire",  file:"tuto_04_debat.html" },
  { id:"t05", num:"05", icon:"⬡", title:"ComfyUI — Images locales",       sub:"Générer avec ta GPU · 5 slides",          color:"#A78BFA", level:"Intermédiaire",  file:"tuto_05_comfyui.html" },
  { id:"t06", num:"06", icon:"🔀", title:"Les Workflows",                 sub:"Automatiser des tâches · 5 slides",       color:"#F97316", level:"Intermédiaire",  file:"tuto_06_workflows.html" },
  { id:"t07", num:"07", icon:"🧱", title:"Prompt Builder",                sub:"Écrire de meilleurs prompts · 5 slides",  color:"#D4A853", level:"Intermédiaire",  file:"tuto_07_prompt_builder.html" },
];

const QUICK_TABS = [
  { id:"chat",       icon:"◈",  label:"Chat multi-IAs",      desc:"Parle à 8 IAs en parallèle",           color:"#60A5FA", bg:"rgba(96,165,250,.08)"   },
  { id:"router",     icon:"🧭", label:"Smart Router",         desc:"Analyse fichiers + routing auto",       color:"#A78BFA", bg:"rgba(167,139,250,.08)"  },
  { id:"debate",     icon:"⚡", label:"Débat",                desc:"Confronte les IAs sur un sujet",        color:"#F97316", bg:"rgba(249,115,22,.08)"   },
  { id:"workflows",  icon:"🔀", label:"Workflows",            desc:"Automatise des pipelines multi-étapes", color:"#D4A853", bg:"rgba(212,168,83,.08)"   },
  { id:"redaction",  icon:"✍️", label:"Rédaction",            desc:"Améliore et transforme tes textes",     color:"#4ADE80", bg:"rgba(74,222,128,.08)"   },
  { id:"recherche",  icon:"🔎", label:"Recherche web",        desc:"Recherche multi-IAs simultanée",        color:"#60A5FA", bg:"rgba(96,165,250,.08)"   },
  { id:"studio",     icon:"🎬", label:"Studio Auto",          desc:"Génère des tutos vidéo automatiques",   color:"#F87171", bg:"rgba(248,113,113,.08)"  },
  { id:"agent",      icon:"🤖", label:"Agent autonome",       desc:"Laisse l'IA agir de façon autonome",    color:"#A78BFA", bg:"rgba(167,139,250,.08)"  },
  { id:"arena",      icon:"⚔",  label:"Arène",                desc:"Benchmark et comparaison de modèles",   color:"#FB923C", bg:"rgba(251,146,60,.08)"   },
  { id:"medias",     icon:"🖼",  label:"Médias",               desc:"YouTube + générateurs d'images",        color:"#F87171", bg:"rgba(248,113,113,.08)"  },
  { id:"comfyui",    icon:"⬡",  label:"ComfyUI",              desc:"Génération d'images locales (GPU)",      color:"#A78BFA", bg:"rgba(167,139,250,.08)"  },
  { id:"config",     icon:"⚙",  label:"Configuration",        desc:"Clés API, thème et paramètres",         color:"#9CA3AF", bg:"rgba(156,163,175,.06)"  },
];

function AideTab({ navigateTab, apiKeys = {}, enabled = {} }) {
  const [activeTuto, setActiveTuto]       = React.useState(null);
  const [filterLevel, setFilterLevel]     = React.useState("all");
  const [search, setSearch]               = React.useState("");
  const [iframeLoaded, setIframeLoaded]   = React.useState(false);
  const [activeSection, setActiveSection] = React.useState("home");

  const filtered = TUTORIALS.filter(t => {
    if (filterLevel !== "all" && t.level !== filterLevel) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return t.title.toLowerCase().includes(q) || t.sub.toLowerCase().includes(q) || t.level.toLowerCase().includes(q);
    }
    return true;
  });

  const openTuto = (tuto) => { setIframeLoaded(false); setActiveTuto(tuto); };

  const API_STATUS = [
    { id:"groq",      label:"Groq",      key:"groqKey",     free:true  },
    { id:"openai",    label:"OpenAI",    key:"openaiKey",   free:false },
    { id:"claude",    label:"Claude",    key:"claudeKey",   free:false },
    { id:"gemini",    label:"Gemini",    key:"geminiKey",   free:true  },
    { id:"mistral",   label:"Mistral",   key:"mistralKey",  free:true  },
    { id:"cohere",    label:"Cohere",    key:"cohereKey",   free:true  },
    { id:"deepseek",  label:"DeepSeek",  key:"deepseekKey", free:true  },
    { id:"xai",       label:"xAI",       key:"xaiKey",      free:false },
  ];
  const configuredCount = API_STATUS.filter(a => apiKeys[a.key]).length;

  // ── VIEWER iframe ──────────────────────────────────────────────
  if (activeTuto) {
    return (
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{padding:"7px 14px",borderBottom:"1px solid var(--bd)",background:"var(--s1)",display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
          <button onClick={()=>setActiveTuto(null)}
            style={{background:"transparent",border:"1px solid var(--bd)",borderRadius:5,color:"var(--mu)",fontSize:9,padding:"3px 10px",cursor:"pointer",fontFamily:"var(--font-mono)"}}>
            ← Retour
          </button>
          <span style={{fontSize:10,fontWeight:700,color:"var(--tx)",fontFamily:"var(--font-display)"}}>{activeTuto.icon} {activeTuto.title}</span>
          <span style={{marginLeft:"auto",fontSize:8,padding:"2px 8px",borderRadius:4,background:"rgba(255,255,255,.05)",color:"var(--mu)",fontFamily:"var(--font-mono)"}}>{activeTuto.level}</span>
          <button onClick={()=>window.open("tutos/"+activeTuto.file,"_blank")}
            style={{background:"transparent",border:"1px solid var(--bd)",borderRadius:5,color:"var(--mu)",fontSize:9,padding:"3px 10px",cursor:"pointer",fontFamily:"var(--font-mono)"}}>
            ⛶ Plein écran
          </button>
        </div>
        <div style={{flex:1,position:"relative",background:"var(--bg)"}}>
          {!iframeLoaded && (
            <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12,color:"var(--mu)"}}>
              <div style={{fontSize:32,animation:"spin 1s linear infinite"}}>⟳</div>
              <span style={{fontFamily:"var(--font-mono)",fontSize:10}}>Chargement du tuto…</span>
              <span style={{fontSize:9,opacity:.6,maxWidth:300,textAlign:"center"}}>
                Place les fichiers HTML dans <code style={{color:"var(--ac)"}}>public/tutos/</code>
              </span>
            </div>
          )}
          <iframe key={activeTuto.file} src={"tutos/"+activeTuto.file}
            style={{width:"100%",height:"100%",border:"none",opacity:iframeLoaded?1:0,transition:"opacity .3s"}}
            onLoad={()=>setIframeLoaded(true)} title={activeTuto.title} allow="fullscreen"/>
        </div>
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  // ── MAIN LAYOUT ───────────────────────────────────────────────
  return (
    <div style={{flex:1,overflow:"auto",scrollbarWidth:"thin",scrollbarColor:"var(--bd) transparent"}}>

      {/* ── SOUS-NAV ── */}
      <div style={{position:"sticky",top:0,zIndex:20,background:"var(--s1)",borderBottom:"1px solid var(--bd)",
        display:"flex",gap:2,padding:"5px 14px",alignItems:"center",flexWrap:"wrap"}}>
        {[["home","🏠 Accueil"],["tutos","📖 Tutos (7)"],["cli","🔌 Outils CLI"]].map(([id,label]) => (
          <button key={id} onClick={() => setActiveSection(id)}
            style={{padding:"4px 12px",borderRadius:5,border:"1px solid "+(activeSection===id?"var(--ac)":"var(--bd)"),
              background:activeSection===id?"rgba(212,168,83,.12)":"transparent",
              color:activeSection===id?"var(--ac)":"var(--mu)",
              fontSize:9,cursor:"pointer",fontFamily:"var(--font-mono)",fontWeight:activeSection===id?700:400,transition:"all .15s"}}>
            {label}
          </button>
        ))}
        {activeSection === "tutos" && <>
          <div style={{width:1,background:"var(--bd)",margin:"0 4px",height:16}}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Filtrer…"
            style={{background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:5,color:"var(--tx)",fontSize:9,
              padding:"3px 9px",fontFamily:"var(--font-ui)",outline:"none",width:130}}/>
          {["all","Débutant","Intermédiaire"].map(lvl => (
            <button key={lvl} onClick={()=>setFilterLevel(lvl)}
              style={{fontSize:8,padding:"3px 8px",borderRadius:4,border:"1px solid "+(filterLevel===lvl?"var(--ac)":"var(--bd)"),
                background:filterLevel===lvl?"rgba(212,168,83,.12)":"transparent",
                color:filterLevel===lvl?"var(--ac)":"var(--mu)",cursor:"pointer",fontFamily:"var(--font-mono)"}}>
              {lvl==="all"?"Tous":lvl}
            </button>
          ))}
        </>}
      </div>

      <div style={{padding:"clamp(12px,2vw,20px)"}}>

        {/* ═══════════════ ACCUEIL ═══════════════ */}
        {activeSection === "home" && <>

          {/* Hero banner */}
          <div style={{marginBottom:18,padding:"clamp(16px,3vw,26px)",
            background:"linear-gradient(135deg,#0D0A02,#110E03,#0A0A0F)",
            border:"1px solid rgba(212,168,83,.22)",borderRadius:14,position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:-50,right:-50,width:220,height:220,
              background:"radial-gradient(circle,rgba(212,168,83,.10),transparent 70%)",pointerEvents:"none"}}/>
            <div style={{display:"flex",alignItems:"flex-start",gap:18,flexWrap:"wrap"}}>
              <div style={{flex:1,minWidth:200}}>
                <div style={{fontFamily:"var(--font-display)",fontWeight:800,
                  fontSize:"clamp(24px,4.5vw,36px)",color:"var(--ac)",marginBottom:4,letterSpacing:"-0.5px",lineHeight:1}}>
                  multi<span style={{color:"var(--mu)",fontWeight:400}}>IA</span>
                  <span style={{fontSize:"clamp(10px,1.5vw,13px)",color:"var(--ac)",fontWeight:400,
                    background:"rgba(212,168,83,.15)",padding:"1px 8px",borderRadius:4,
                    border:"1px solid rgba(212,168,83,.3)",marginLeft:10,verticalAlign:"middle"}}>
                    v{typeof APP_VERSION!=="undefined"?APP_VERSION:"21.0"}
                  </span>
                </div>
                <div style={{fontSize:"clamp(10px,1.7vw,12px)",color:"var(--mu)",lineHeight:1.75,marginBottom:16,maxWidth:440}}>
                  Ton cockpit multi-IAs — chat, débat, workflows, images, agents et bien plus.<br/>
                  <strong style={{color:"var(--tx)"}}>44 onglets · 8 IAs intégrées · 100% gratuit</strong> avec les IAs gratuites.
                </div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  <button onClick={() => navigateTab && navigateTab("chat")}
                    style={{padding:"8px 20px",background:"var(--ac)",border:"none",borderRadius:7,
                      color:"#09090B",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"var(--font-mono)",transition:"all .2s"}}>
                    ◈ Ouvrir le Chat
                  </button>
                  <button onClick={() => navigateTab && navigateTab("router")}
                    style={{padding:"8px 16px",background:"transparent",border:"1px solid rgba(212,168,83,.4)",borderRadius:7,
                      color:"var(--ac)",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"var(--font-mono)"}}>
                    🧭 Smart Router
                  </button>
                  <button onClick={() => navigateTab && navigateTab("config")}
                    style={{padding:"8px 14px",background:"transparent",border:"1px solid var(--bd)",borderRadius:7,
                      color:"var(--mu)",fontSize:10,cursor:"pointer",fontFamily:"var(--font-mono)"}}>
                    ⚙ Config
                  </button>
                </div>
              </div>
              {/* Stats badges */}
              <div style={{display:"flex",flexDirection:"column",gap:5,flexShrink:0}}>
                {[["44","onglets","#D4A853"],["8","IAs","#4ADE80"],[String(configuredCount),"configurées","#60A5FA"],["11","outils CLI","#A78BFA"]].map(([val,lbl,col])=>(
                  <div key={lbl} style={{display:"flex",alignItems:"baseline",gap:5,padding:"5px 12px",
                    background:"rgba(255,255,255,.03)",borderRadius:7,border:"1px solid var(--bd)"}}>
                    <span style={{fontFamily:"var(--font-display)",fontWeight:800,fontSize:18,color:col}}>{val}</span>
                    <span style={{fontSize:9,color:"var(--mu)"}}>{lbl}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Statut des clés API */}
          <div style={{marginBottom:18}}>
            <div style={{fontSize:9,color:"var(--mu)",fontWeight:700,letterSpacing:1,
              fontFamily:"var(--font-mono)",marginBottom:8}}>STATUT DES CLÉS API</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(120px,1fr))",gap:6}}>
              {[
                {id:"groq",    label:"Groq",     key:"groqKey",     free:true,  color:"#F97316"},
                {id:"openai",  label:"OpenAI",   key:"openaiKey",   free:false, color:"#10B981"},
                {id:"claude",  label:"Claude",   key:"claudeKey",   free:false, color:"#F59E0B"},
                {id:"gemini",  label:"Gemini",   key:"geminiKey",   free:true,  color:"#60A5FA"},
                {id:"mistral", label:"Mistral",  key:"mistralKey",  free:true,  color:"#A78BFA"},
                {id:"cohere",  label:"Cohere",   key:"cohereKey",   free:true,  color:"#4ADE80"},
                {id:"deepseek",label:"DeepSeek", key:"deepseekKey", free:true,  color:"#60A5FA"},
                {id:"xai",     label:"xAI",      key:"xaiKey",      free:false, color:"#9CA3AF"},
              ].map(api => {
                const hasKey = !!(apiKeys && apiKeys[api.key]);
                const isEnabled = !!(enabled && enabled[api.id]);
                return (
                  <div key={api.id} style={{padding:"7px 10px",borderRadius:7,
                    border:"1px solid "+(hasKey?"rgba(74,222,128,.25)":"var(--bd)"),
                    background:hasKey?"rgba(74,222,128,.04)":"transparent",
                    display:"flex",alignItems:"center",gap:6}}>
                    <div style={{width:6,height:6,borderRadius:"50%",flexShrink:0,
                      background:hasKey?"var(--green)":isEnabled?"var(--red)":"var(--mu)",
                      boxShadow:hasKey?"0 0 5px var(--green)":""}}/>
                    <span style={{fontSize:9,color:hasKey?"var(--tx)":"var(--mu)",
                      fontFamily:"var(--font-mono)",flex:1,overflow:"hidden",
                      textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{api.label}</span>
                    {api.free && <span style={{fontSize:6,padding:"1px 3px",borderRadius:2,
                      background:"rgba(74,222,128,.12)",color:"var(--green)",fontWeight:700}}>FREE</span>}
                    {!hasKey && (
                      <button onClick={() => navigateTab && navigateTab("config")}
                        style={{fontSize:7,padding:"1px 5px",borderRadius:3,
                          border:"1px solid var(--bd)",background:"transparent",
                          color:"var(--mu)",cursor:"pointer",fontFamily:"var(--font-mono)"}}>
                        + Clé
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            {configuredCount === 0 && (
              <div style={{marginTop:8,padding:"8px 12px",background:"rgba(249,115,22,.07)",
                border:"1px solid rgba(249,115,22,.25)",borderRadius:7,fontSize:9,color:"var(--orange)"}}>
                ⚡ Aucune clé configurée — va dans <button onClick={() => navigateTab && navigateTab("config")}
                  style={{background:"none",border:"none",color:"var(--ac)",cursor:"pointer",
                    fontSize:9,fontFamily:"var(--font-mono)",fontWeight:700,padding:0}}>⚙ Config</button> pour
                ajouter Groq (gratuit, 14 400 req/jour).
              </div>
            )}
          </div>

          {/* Accès rapide — 12 tiles */}
          <div style={{marginBottom:18}}>
            <div style={{fontSize:9,color:"var(--mu)",fontWeight:700,letterSpacing:1,
              fontFamily:"var(--font-mono)",marginBottom:8}}>ACCÈS RAPIDE</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:8}}>
              {QUICK_TABS.map(tile => (
                <button key={tile.id} onClick={() => navigateTab && navigateTab(tile.id)}
                  style={{padding:"11px 13px",borderRadius:9,border:"1px solid var(--bd)",
                    background:tile.bg,textAlign:"left",cursor:"pointer",transition:"all .18s",
                    display:"flex",flexDirection:"column",gap:4}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=tile.color+"88";e.currentTarget.style.transform="translateY(-2px)";}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--bd)";e.currentTarget.style.transform="none";}}>
                  <div style={{display:"flex",alignItems:"center",gap:7}}>
                    <span style={{fontSize:18}}>{tile.icon}</span>
                    <span style={{fontFamily:"var(--font-display)",fontWeight:700,
                      fontSize:11,color:tile.color}}>{tile.label}</span>
                  </div>
                  <div style={{fontSize:8,color:"var(--mu)",lineHeight:1.4}}>{tile.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Démarrage rapide */}
          <div style={{padding:"12px 16px",background:"rgba(212,168,83,.05)",
            border:"1px solid rgba(212,168,83,.18)",borderRadius:10,
            display:"flex",alignItems:"center",gap:12}}>
            <span style={{fontSize:22,flexShrink:0}}>🚀</span>
            <div style={{flex:1}}>
              <div style={{fontFamily:"var(--font-display)",fontWeight:700,
                fontSize:11,color:"var(--ac)",marginBottom:2}}>Nouveau sur Multi-IA Hub ?</div>
              <div style={{fontSize:9,color:"var(--mu)"}}>
                Commence par le Tuto 01 — présentation complète en 6 slides.
                Ensuite configure tes clés API dans Config.
              </div>
            </div>
            <div style={{display:"flex",gap:6,flexShrink:0}}>
              <button onClick={() => { setActiveSection("tutos"); }}
                style={{padding:"6px 12px",background:"rgba(212,168,83,.15)",
                  border:"1px solid rgba(212,168,83,.4)",borderRadius:6,
                  color:"var(--ac)",fontSize:9,cursor:"pointer",
                  fontFamily:"var(--font-mono)",fontWeight:700}}>
                📖 Tutos
              </button>
              <button onClick={() => navigateTab && navigateTab("config")}
                style={{padding:"6px 12px",background:"transparent",
                  border:"1px solid var(--bd)",borderRadius:6,
                  color:"var(--mu)",fontSize:9,cursor:"pointer",fontFamily:"var(--font-mono)"}}>
                ⚙ Config
              </button>
            </div>
          </div>
        </>}

        {/* ═══════════════ TUTOS ═══════════════ */}
        {activeSection === "tutos" && <>
          {/* Quick start banner */}
          <div style={{marginBottom:14,padding:"10px 16px",
            background:"rgba(212,168,83,.06)",border:"1px solid rgba(212,168,83,.2)",
            borderRadius:10,display:"flex",alignItems:"center",gap:12}}>
            <span style={{fontSize:22,flexShrink:0}}>🚀</span>
            <div style={{flex:1}}>
              <div style={{fontFamily:"var(--font-display)",fontWeight:700,fontSize:11,color:"var(--ac)",marginBottom:1}}>
                Nouveau sur Multi-IA Hub ?
              </div>
              <div style={{fontSize:9,color:"var(--mu)"}}>
                Commence par le Tuto 01 — présentation complète de l'app en quelques slides.
              </div>
            </div>
            <button onClick={()=>openTuto(TUTORIALS[0])}
              style={{padding:"5px 13px",background:"rgba(212,168,83,.15)",
                border:"1px solid rgba(212,168,83,.4)",borderRadius:6,
                color:"var(--ac)",fontSize:9,cursor:"pointer",
                fontFamily:"var(--font-mono)",fontWeight:700,flexShrink:0}}>
              ▶ Commencer
            </button>
          </div>

          {/* Tutorial grid */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:10,marginBottom:16}}>
            {filtered.map(tuto=>(
              <div key={tuto.id} onClick={()=>openTuto(tuto)}
                style={{background:"var(--s1)",border:"1px solid var(--bd)",
                  borderRadius:10,overflow:"hidden",cursor:"pointer",transition:"all .2s"}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=tuto.color+"66";
                  e.currentTarget.style.transform="translateY(-2px)";
                  e.currentTarget.style.boxShadow="0 8px 24px "+tuto.color+"15";}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--bd)";
                  e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="none";}}>
                <div style={{height:3,background:"linear-gradient(90deg,"+tuto.color+","+tuto.color+"88)"}}/>
                <div style={{padding:"12px 14px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:7}}>
                    <span style={{fontSize:22}}>{tuto.icon}</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:8,color:"var(--mu)",fontFamily:"var(--font-mono)",marginBottom:1}}>
                        TUTO {tuto.num}
                      </div>
                      <div style={{fontFamily:"var(--font-display)",fontWeight:700,fontSize:11,
                        color:"var(--tx)",lineHeight:1.2}}>{tuto.title}</div>
                    </div>
                    <span style={{fontSize:7,padding:"2px 6px",borderRadius:3,
                      background:"rgba(255,255,255,.05)",color:"var(--mu)",
                      fontFamily:"var(--font-mono)",flexShrink:0}}>{tuto.level}</span>
                  </div>
                  <div style={{fontSize:9,color:"var(--mu)",marginBottom:8}}>{tuto.sub}</div>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    {tuto.level==="Débutant"
                      ? <span style={{fontSize:7,padding:"1px 6px",background:"rgba(74,222,128,.08)",
                          border:"1px solid rgba(74,222,128,.2)",borderRadius:8,color:"var(--green)"}}>Débutant</span>
                      : <span style={{fontSize:7,padding:"1px 6px",background:"rgba(212,168,83,.08)",
                          border:"1px solid rgba(212,168,83,.2)",borderRadius:8,color:"var(--ac)"}}>Intermédiaire</span>
                    }
                    <span style={{fontSize:9,color:tuto.color,opacity:.7}}>▶ Voir</span>
                  </div>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div style={{gridColumn:"1/-1",textAlign:"center",padding:"40px 20px",
                color:"var(--mu)",fontSize:12}}>
                Aucun tuto trouvé pour "{search}"
              </div>
            )}
          </div>

          {/* Statut API */}
          <div style={{marginBottom:18,padding:"14px 16px",background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:10}}>
            <div style={{fontSize:9,color:"var(--mu)",fontWeight:700,letterSpacing:1,fontFamily:"var(--font-mono)",marginBottom:10}}>
              STATUT DES CLÉS API — {configuredCount}/8 configurées
              <span style={{marginLeft:8,fontSize:8,padding:"1px 7px",borderRadius:3,
                background:configuredCount===0?"rgba(248,113,113,.12)":configuredCount>=4?"rgba(74,222,128,.12)":"rgba(212,168,83,.12)",
                color:configuredCount===0?"var(--red)":configuredCount>=4?"var(--green)":"var(--ac)",
                border:"1px solid "+(configuredCount===0?"rgba(248,113,113,.3)":configuredCount>=4?"rgba(74,222,128,.3)":"rgba(212,168,83,.3)")}}>
                {configuredCount===0?"⚠ Aucune clé":configuredCount>=6?"✓ Bien configuré":"◑ Partiel"}
              </span>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(120px,1fr))",gap:6}}>
              {API_STATUS.map(api => {
                const ok = !!apiKeys[api.key];
                return (
                  <div key={api.id} onClick={() => navigateTab && navigateTab("config")}
                    style={{display:"flex",alignItems:"center",gap:7,padding:"6px 10px",borderRadius:7,
                      border:"1px solid "+(ok?"rgba(74,222,128,.25)":"var(--bd)"),
                      background:ok?"rgba(74,222,128,.05)":"var(--s2)",cursor:"pointer",transition:"all .15s"}}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor=ok?"rgba(74,222,128,.5)":"rgba(212,168,83,.4)";}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor=ok?"rgba(74,222,128,.25)":"var(--bd)";}}>
                    <div style={{width:6,height:6,borderRadius:"50%",flexShrink:0,
                      background:ok?"var(--green)":"var(--mu)",
                      boxShadow:ok?"0 0 6px var(--green)":""}}/>
                    <span style={{fontSize:9,fontWeight:600,color:ok?"var(--tx)":"var(--mu)",flex:1}}>{api.label}</span>
                    {api.free && <span style={{fontSize:7,padding:"1px 4px",borderRadius:2,
                      background:"rgba(74,222,128,.1)",color:"var(--green)",fontWeight:700}}>FREE</span>}
                  </div>
                );
              })}
            </div>
            {configuredCount === 0 && (
              <div style={{marginTop:10,padding:"8px 12px",background:"rgba(212,168,83,.06)",
                border:"1px solid rgba(212,168,83,.2)",borderRadius:7,fontSize:9,color:"var(--mu)",lineHeight:1.7}}>
                💡 <strong style={{color:"var(--ac)"}}>Démarrage rapide :</strong> Groq, Gemini, Mistral, Cohere sont <strong>100% gratuits</strong>. 
                Clique sur une IA ci-dessus pour aller dans ⚙ Config et coller ta clé API.
              </div>
            )}
          </div>

          {/* FAQ */}
          <div style={{padding:"12px 16px",background:"var(--s1)",
            border:"1px solid var(--bd)",borderRadius:10}}>
            <div style={{fontSize:9,color:"var(--mu)",fontWeight:700,marginBottom:10,
              letterSpacing:1,fontFamily:"var(--font-mono)"}}>QUESTIONS FRÉQUENTES</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:6}}>
              {[
                ["C'est quoi une clé API ?","t02"],
                ["Comment obtenir Groq gratuit ?","t02"],
                ["Quelle IA choisir pour débuter ?","t01"],
                ["ComfyUI — comment installer ?","t05"],
                ["Comment automatiser ?","t06"],
                ["Comment améliorer mes prompts ?","t07"],
              ].map(([q,tid])=>(
                <div key={q} onClick={()=>openTuto(TUTORIALS.find(t=>t.id===tid))}
                  style={{padding:"6px 10px",borderRadius:6,background:"var(--s2)",
                    border:"1px solid var(--bd)",fontSize:9,color:"var(--mu)",
                    cursor:"pointer",transition:"all .15s"}}
                  onMouseEnter={e=>{e.currentTarget.style.color="var(--tx)";
                    e.currentTarget.style.borderColor="var(--ac)";}}
                  onMouseLeave={e=>{e.currentTarget.style.color="var(--mu)";
                    e.currentTarget.style.borderColor="var(--bd)";}}>
                  ❓ {q}
                </div>
              ))}
            </div>
          </div>

          {/* Install note */}
          <div style={{marginTop:12,padding:"10px 14px",
            background:"rgba(96,165,250,.05)",border:"1px solid rgba(96,165,250,.15)",
            borderRadius:8,fontSize:9,color:"var(--mu)",lineHeight:1.6}}>
            📂 <strong style={{color:"var(--tx)"}}>Pour afficher les tutos dans l'app :</strong> place les
            fichiers HTML dans le dossier{" "}
            <code style={{color:"var(--ac)",background:"rgba(212,168,83,.08)",
              padding:"1px 5px",borderRadius:3}}>public/tutos/</code> de ton projet Vite.
          </div>
        </>}

          {/* Quick access grid */}
          <div style={{marginBottom:18}}>
            <div style={{fontSize:9,color:"var(--mu)",fontWeight:700,letterSpacing:1,
              fontFamily:"var(--font-mono)",marginBottom:10}}>ACCÈS RAPIDE — 12 ONGLETS CLÉS</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:8}}>
              {QUICK_TABS.map(qt => (
                <div key={qt.id} onClick={() => navigateTab && navigateTab(qt.id)}
                  style={{display:"flex",alignItems:"center",gap:9,padding:"10px 12px",
                    background:qt.bg,border:"1px solid "+qt.color+"33",borderRadius:9,
                    cursor:"pointer",transition:"all .2s"}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=qt.color+"88";e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 6px 18px "+qt.color+"18";}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor=qt.color+"33";e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="none";}}>
                  <span style={{fontSize:20,flexShrink:0}}>{qt.icon}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:10,fontWeight:700,color:qt.color,lineHeight:1.2,
                      whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{qt.label}</div>
                    <div style={{fontSize:8,color:"var(--mu)",lineHeight:1.4,marginTop:1}}>{qt.desc}</div>
                  </div>
                  <span style={{color:qt.color,opacity:.5,fontSize:10,flexShrink:0}}>→</span>
                </div>
              ))}
            </div>
          </div>

          {/* Démarrage rapide */}
          <div style={{padding:"12px 16px",background:"rgba(212,168,83,.06)",
            border:"1px solid rgba(212,168,83,.2)",borderRadius:10,
            display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
            <span style={{fontSize:22,flexShrink:0}}>🚀</span>
            <div style={{flex:1,minWidth:180}}>
              <div style={{fontFamily:"var(--font-display)",fontWeight:700,fontSize:12,color:"var(--ac)",marginBottom:2}}>
                Nouveau sur Multi-IA Hub ?
              </div>
              <div style={{fontSize:9,color:"var(--mu)"}}>
                Commence par le Tuto 01 — présentation complète en quelques slides.
              </div>
            </div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",flexShrink:0}}>
              <button onClick={() => { setActiveSection("tutos"); openTuto(TUTORIALS[0]); }}
                style={{padding:"7px 16px",background:"rgba(212,168,83,.15)",
                  border:"1px solid rgba(212,168,83,.4)",borderRadius:6,
                  color:"var(--ac)",fontSize:9,cursor:"pointer",fontFamily:"var(--font-mono)",fontWeight:700}}>
                ▶ Lancer tuto 01
              </button>
              <button onClick={() => setActiveSection("tutos")}
                style={{padding:"7px 12px",background:"transparent",
                  border:"1px solid var(--bd)",borderRadius:6,
                  color:"var(--mu)",fontSize:9,cursor:"pointer",fontFamily:"var(--font-mono)"}}>
                📖 Tous les tutos
              </button>
            </div>
          </div>
        </>}

        {/* ═══════════════ OUTILS CLI ═══════════════ */}
        {activeSection === "cli" && <>
          <div style={{marginBottom:14,fontSize:9,color:"var(--mu)",lineHeight:1.7,
            padding:"8px 12px",background:"rgba(212,168,83,.05)",
            border:"1px solid rgba(212,168,83,.15)",borderRadius:7}}>
            Les tunnels CLI-Anything permettent à Multi-IA Hub de contrôler des logiciels locaux
            (GIMP, LibreOffice, Blender…). Ils sont{" "}
            <strong style={{color:"var(--tx)"}}>100% optionnels</strong> — si un logiciel n'est pas
            installé, l'étape est ignorée et l'app continue normalement.
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:10}}>
            {CLI_TOOLS_DATA.map((tool,i) => (
              <div key={i} style={{padding:"12px 14px",background:"var(--s1)",
                border:"1px solid "+(tool.required?"rgba(212,168,83,.25)":"var(--bd)"),
                borderRadius:9}}>
                <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:7}}>
                  <span style={{fontSize:18}}>{tool.icon}</span>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700,fontSize:11,color:tool.color}}>{tool.name}</div>
                    <div style={{fontSize:8,color:"var(--mu)"}}>{tool.desc}</div>
                  </div>
                  {tool.required && (
                    <span style={{fontSize:7,padding:"1px 5px",
                      border:"1px solid rgba(212,168,83,.4)",borderRadius:3,color:"var(--ac)"}}>
                      requis
                    </span>
                  )}
                </div>
                <div style={{background:"var(--bg)",borderRadius:5,padding:"6px 9px"}}>
                  {tool.steps.map((s,si) => (
                    <div key={si} style={{fontSize:8,color:"var(--green)",
                      fontFamily:"var(--font-mono)",lineHeight:1.9,display:"flex",gap:5}}>
                      <span style={{color:"var(--mu)",flexShrink:0}}>{si+1}.</span>{s}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{marginTop:10,padding:"8px 12px",
            background:"rgba(74,222,128,.05)",border:"1px solid rgba(74,222,128,.15)",
            borderRadius:7,fontSize:9,color:"var(--mu)"}}>
            💡 <strong style={{color:"var(--tx)"}}>100% gratuit via PowerShell</strong> —
            un seul <code style={{color:"var(--ac)"}}>git clone https://github.com/HKUDS/CLI-Anything.git</code> suffit.
          </div>
        </>}

      </div>{/* /padding wrapper */}
    </div>
  );
}


        {/* ═══════════════ TUTOS ═══════════════ */}
        {activeSection === "tutos" && <>

          {/* Grid tutoriels */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:10,marginBottom:16}}>
            {filtered.map(tuto => (
              <div key={tuto.id} onClick={() => openTuto(tuto)}
                style={{background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:10,overflow:"hidden",cursor:"pointer",transition:"all .2s"}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=tuto.color+"66";e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 8px 24px "+tuto.color+"15";}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--bd)";e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="none";}}>
                <div style={{height:3,background:"linear-gradient(90deg,"+tuto.color+","+tuto.color+"88)"}}/>
                <div style={{padding:"12px 14px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:7}}>
                    <span style={{fontSize:22}}>{tuto.icon}</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:8,color:"var(--mu)",fontFamily:"var(--font-mono)",marginBottom:1}}>TUTO {tuto.num}</div>
                      <div style={{fontFamily:"var(--font-display)",fontWeight:700,fontSize:11,color:"var(--tx)",lineHeight:1.2}}>{tuto.title}</div>
                    </div>
                    <span style={{fontSize:7,padding:"2px 6px",borderRadius:3,background:"rgba(255,255,255,.05)",color:"var(--mu)",fontFamily:"var(--font-mono)",flexShrink:0}}>{tuto.level}</span>
                  </div>
                  <div style={{fontSize:9,color:"var(--mu)",marginBottom:8}}>{tuto.sub}</div>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <div>
                      {tuto.level==="Débutant"
                        ? <span style={{fontSize:7,padding:"1px 6px",background:"rgba(74,222,128,.08)",border:"1px solid rgba(74,222,128,.2)",borderRadius:8,color:"var(--green)"}}>Débutant</span>
                        : <span style={{fontSize:7,padding:"1px 6px",background:"rgba(212,168,83,.08)",border:"1px solid rgba(212,168,83,.2)",borderRadius:8,color:"var(--ac)"}}>Intermédiaire</span>
                      }
                    </div>
                    <span style={{fontSize:9,color:tuto.color,opacity:.7}}>▶ Voir</span>
                  </div>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div style={{gridColumn:"1/-1",textAlign:"center",padding:"40px",color:"var(--mu)",fontSize:12}}>
                Aucun tuto trouvé pour "{search}"
              </div>
            )}
          </div>

          {/* FAQ */}
          <div style={{padding:"12px 16px",background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:10,marginBottom:12}}>
            <div style={{fontSize:9,color:"var(--mu)",fontWeight:700,marginBottom:10,letterSpacing:1,fontFamily:"var(--font-mono)"}}>QUESTIONS FRÉQUENTES</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:6}}>
              {[
                ["C'est quoi une clé API ?","t02"],
                ["Comment obtenir Groq gratuit ?","t02"],
                ["Quelle IA choisir pour débuter ?","t01"],
                ["ComfyUI — comment installer ?","t05"],
                ["Comment automatiser ?","t06"],
                ["Comment améliorer mes prompts ?","t07"],
              ].map(([q,tid]) => (
                <div key={q} onClick={() => openTuto(TUTORIALS.find(t => t.id===tid))}
                  style={{padding:"6px 10px",borderRadius:6,background:"var(--s2)",border:"1px solid var(--bd)",
                    fontSize:9,color:"var(--mu)",cursor:"pointer",transition:"all .15s"}}
                  onMouseEnter={e=>{e.currentTarget.style.color="var(--tx)";e.currentTarget.style.borderColor="var(--ac)";}}
                  onMouseLeave={e=>{e.currentTarget.style.color="var(--mu)";e.currentTarget.style.borderColor="var(--bd)";}}>
                  ❓ {q}
                </div>
              ))}
            </div>
          </div>

          {/* Install note */}
          <div style={{padding:"10px 14px",background:"rgba(96,165,250,.05)",border:"1px solid rgba(96,165,250,.15)",borderRadius:8,fontSize:9,color:"var(--mu)",lineHeight:1.6}}>
            📂 <strong style={{color:"var(--tx)"}}>Pour afficher les tutos dans l'app :</strong> place les fichiers HTML dans le dossier&nbsp;
            <code style={{color:"var(--ac)",background:"rgba(212,168,83,.08)",padding:"1px 5px",borderRadius:3}}>public/tutos/</code> de ton projet Vite.
          </div>
        </>}

        {/* ═══════════════ CLI TOOLS ═══════════════ */}
        {activeSection === "cli" && <>
          <div style={{marginBottom:14,padding:"10px 14px",background:"rgba(212,168,83,.05)",
            border:"1px solid rgba(212,168,83,.15)",borderRadius:8,fontSize:9,color:"var(--mu)",lineHeight:1.7}}>
            Les tunnels CLI-Anything permettent à l'app de contrôler des logiciels locaux (GIMP, LibreOffice, Blender…).
            Ils sont <strong style={{color:"var(--tx)"}}>100% optionnels</strong> — si un logiciel n'est pas installé, l'étape est ignorée et l'app continue normalement.
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:10,marginBottom:12}}>
            {CLI_TOOLS_DATA.map((tool,i) => (
              <div key={i} style={{padding:"12px 14px",background:"var(--s1)",
                border:"1px solid "+(tool.required?"rgba(212,168,83,.25)":"var(--bd)"),borderRadius:9}}>
                <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:7}}>
                  <span style={{fontSize:18}}>{tool.icon}</span>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700,fontSize:11,color:tool.color}}>{tool.name}</div>
                    <div style={{fontSize:8,color:"var(--mu)"}}>{tool.desc}</div>
                  </div>
                  {tool.required && <span style={{fontSize:7,padding:"1px 5px",border:"1px solid rgba(212,168,83,.4)",borderRadius:3,color:"var(--ac)"}}>requis</span>}
                </div>
                <div style={{background:"var(--bg)",borderRadius:5,padding:"6px 9px"}}>
                  {tool.steps.map((s,si) => (
                    <div key={si} style={{fontSize:8,color:"var(--green)",fontFamily:"var(--font-mono)",lineHeight:1.9,display:"flex",gap:5}}>
                      <span style={{color:"var(--mu)",flexShrink:0}}>{si+1}.</span>{s}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{padding:"8px 12px",background:"rgba(74,222,128,.05)",border:"1px solid rgba(74,222,128,.15)",borderRadius:7,fontSize:9,color:"var(--mu)"}}>
            💡 <strong style={{color:"var(--tx)"}}>100% gratuit via PowerShell</strong> — les pilotes CLI-Anything sont pré-construits dans le repo GitHub.
            Un seul <code style={{color:"var(--ac)"}}>git clone https://github.com/HKUDS/CLI-Anything.git</code> suffit pour tous les outils.
          </div>
        </>}

      </div>{/* /padding wrapper */}
    </div>{/* /scroll container */}
  );
}

