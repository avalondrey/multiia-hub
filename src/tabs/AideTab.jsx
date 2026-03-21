import React from 'react';

const TUTORIALS = [
  { id:"t01", num:"01", icon:"🤖", title:"Bienvenue sur Multi-IA Hub",   sub:"Présentation générale · 6 slides",        color:"#D4A853", level:"Débutant",       file:"tuto_01_bienvenue.html" },
  { id:"t02", num:"02", icon:"💬", title:"Premier Chat & Clés API",       sub:"Configurer les IAs gratuites · 6 slides", color:"#60A5FA", level:"Débutant",       file:"tuto_02_premier_chat.html" },
  { id:"t03", num:"03", icon:"🧭", title:"Le Smart Router",               sub:"Analyse de fichiers auto · 5 slides",     color:"#A78BFA", level:"Débutant",       file:"tuto_03_smart_router.html" },
  { id:"t04", num:"04", icon:"⚡", title:"Le Débat Multi-IAs",            sub:"Analyser sous tous les angles · 5 slides",color:"#F97316", level:"Intermédiaire",  file:"tuto_04_debat.html" },
  { id:"t05", num:"05", icon:"⬡", title:"ComfyUI — Images locales",       sub:"Générer avec ta GPU · 5 slides",          color:"#A78BFA", level:"Intermédiaire",  file:"tuto_05_comfyui.html" },
  { id:"t06", num:"06", icon:"🔀", title:"Les Workflows",                 sub:"Automatiser des tâches · 5 slides",       color:"#F97316", level:"Intermédiaire",  file:"tuto_06_workflows.html" },
  { id:"t07", num:"07", icon:"🧱", title:"Prompt Builder",                sub:"Écrire de meilleurs prompts · 5 slides",  color:"#D4A853", level:"Intermédiaire",  file:"tuto_07_prompt_builder.html" },
];

export default function AideTab() {
  const [activeTuto, setActiveTuto] = React.useState(null);
  const [filterLevel, setFilterLevel] = React.useState("all");
  const [search, setSearch] = React.useState("");
  const [iframeLoaded, setIframeLoaded] = React.useState(false);

  const filtered = TUTORIALS.filter(t => {
    if (filterLevel !== "all" && t.level !== filterLevel) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return t.title.toLowerCase().includes(q) || t.sub.toLowerCase().includes(q) || t.level.toLowerCase().includes(q);
    }
    return true;
  });

  const openTuto = (tuto) => {
    setIframeLoaded(false);
    setActiveTuto(tuto);
  };

  if (activeTuto) {
    return (
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{padding:"7px 14px",borderBottom:"1px solid var(--bd)",background:"var(--s1)",display:"flex",alignItems:"center",gap:10,flexShrink:0,zIndex:10}}>
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
            <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12,color:"var(--mu)",fontSize:12}}>
              <div style={{fontSize:32,animation:"spin 1s linear infinite"}}>⟳</div>
              <span style={{fontFamily:"var(--font-mono)",fontSize:10}}>Chargement du tuto…</span>
              <span style={{fontSize:9,opacity:.6,maxWidth:300,textAlign:"center"}}>
                Si le tuto ne s'affiche pas, place les fichiers HTML dans <code style={{color:"var(--ac)"}}>public/tutos/</code> de ton projet
              </span>
            </div>
          )}
          <iframe
            key={activeTuto.file}
            src={"tutos/" + activeTuto.file}
            style={{width:"100%",height:"100%",border:"none",display:iframeLoaded?"block":"block",opacity:iframeLoaded?1:0,transition:"opacity .3s"}}
            onLoad={()=>setIframeLoaded(true)}
            title={activeTuto.title}
            allow="fullscreen"
          />
        </div>
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div style={{flex:1,overflow:"auto",padding:"clamp(10px,2vw,20px)"}}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16,flexWrap:"wrap"}}>
        <div style={{fontFamily:"var(--font-display)",fontWeight:800,fontSize:"clamp(14px,2.5vw,20px)",color:"var(--ac)"}}>❓ Centre d'aide</div>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Chercher un tuto…"
          style={{flex:1,minWidth:140,background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:6,color:"var(--tx)",fontSize:9,padding:"5px 10px",fontFamily:"var(--font-ui)",outline:"none"}}/>
        <div style={{display:"flex",gap:5}}>
          {["all","Débutant","Intermédiaire"].map(lvl=>(
            <button key={lvl} onClick={()=>setFilterLevel(lvl)}
              style={{fontSize:8,padding:"3px 9px",borderRadius:5,border:"1px solid "+(filterLevel===lvl?"var(--ac)":"var(--bd)"),
                background:filterLevel===lvl?"rgba(212,168,83,.12)":"transparent",
                color:filterLevel===lvl?"var(--ac)":"var(--mu)",cursor:"pointer",fontFamily:"var(--font-mono)"}}>
              {lvl==="all"?"Tous":lvl}
            </button>
          ))}
        </div>
      </div>

      <div style={{marginBottom:16,padding:"12px 16px",background:"rgba(212,168,83,.06)",border:"1px solid rgba(212,168,83,.2)",borderRadius:10,display:"flex",alignItems:"center",gap:12}}>
        <span style={{fontSize:24,flexShrink:0}}>🚀</span>
        <div>
          <div style={{fontFamily:"var(--font-display)",fontWeight:700,fontSize:12,color:"var(--ac)",marginBottom:2}}>Nouveau sur Multi-IA Hub ?</div>
          <div style={{fontSize:9,color:"var(--mu)"}}>Commence par le Tuto 01 — présentation complète de l'app en quelques slides.</div>
        </div>
        <button onClick={()=>openTuto(TUTORIALS[0])}
          style={{marginLeft:"auto",padding:"6px 14px",background:"rgba(212,168,83,.15)",border:"1px solid rgba(212,168,83,.4)",
            borderRadius:6,color:"var(--ac)",fontSize:9,cursor:"pointer",fontFamily:"var(--font-mono)",fontWeight:700,flexShrink:0}}>
          ▶ Commencer
        </button>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:10,marginBottom:16}}>
        {filtered.map(tuto=>(
          <div key={tuto.id} onClick={()=>openTuto(tuto)}
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
                <div style={{display:"flex",gap:3}}>
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
          <div style={{gridColumn:"1/-1",textAlign:"center",padding:"40px 20px",color:"var(--mu)",fontSize:12}}>
            Aucun tuto trouvé pour "{search}"
          </div>
        )}
      </div>

      <div style={{padding:"12px 16px",background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:10}}>
        <div style={{fontSize:9,color:"var(--mu)",fontWeight:700,marginBottom:10,letterSpacing:1,fontFamily:"var(--font-mono)"}}>QUESTIONS FRÉQUENTES</div>
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
              style={{padding:"6px 10px",borderRadius:6,background:"var(--s2)",border:"1px solid var(--bd)",fontSize:9,color:"var(--mu)",cursor:"pointer",transition:"all .15s"}}
              onMouseEnter={e=>{e.currentTarget.style.color="var(--tx)";e.currentTarget.style.borderColor="var(--ac)";}}
              onMouseLeave={e=>{e.currentTarget.style.color="var(--mu)";e.currentTarget.style.borderColor="var(--bd)";}}>
              ❓ {q}
            </div>
          ))}
        </div>
      </div>

      <div style={{marginTop:12,padding:"10px 14px",background:"rgba(96,165,250,.05)",border:"1px solid rgba(96,165,250,.15)",borderRadius:8,fontSize:9,color:"var(--mu)",lineHeight:1.6}}>
        📂 <strong style={{color:"var(--tx)"}}>Pour afficher les tutos dans l'app :</strong> place les fichiers HTML dans le dossier <code style={{color:"var(--ac)",background:"rgba(212,168,83,.08)",padding:"1px 5px",borderRadius:3}}>public/tutos/</code> de ton projet Vite.
        Les tutos s'ouvriront directement en iframe dans cet onglet.
      </div>

      <div style={{marginTop:16}}>
        <div style={{fontSize:9,color:"var(--mu)",fontWeight:700,marginBottom:10,letterSpacing:1,fontFamily:"var(--font-mono)"}}>🔀 TUNNELS CLI-ANYTHING — OUTILS LOCAUX OPTIONNELS</div>
        <div style={{fontSize:9,color:"var(--mu)",marginBottom:12,lineHeight:1.7,padding:"8px 12px",background:"rgba(212,168,83,.05)",border:"1px solid rgba(212,168,83,.15)",borderRadius:7}}>
          Les tunnels CLI-Anything permettent à l'app de contrôler des logiciels locaux (GIMP, LibreOffice, Blender…). Ils sont <strong style={{color:"var(--tx)"}}>100% optionnels</strong> — si un logiciel n'est pas installé, l'étape est ignorée et l'app continue normalement.
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:10}}>
          {[
            { icon:"🔌", name:"Relay CLI-Anything", color:"#D4A853", required:true,
              desc:"Pont entre Multi-IA Hub et les logiciels locaux. À lancer une seule fois.",
              steps:["Télécharge cli_relay.py depuis ce projet","python cli_relay.py","Tourne sur http://localhost:5678"] },
            { icon:"📄", name:"LibreOffice", color:"#60A5FA", required:false,
              desc:"Génère des PDF, présentations et documents depuis les Workflows.",
              steps:["Si pas installé : winget install TheDocumentFoundation.LibreOffice","git clone https://github.com/HKUDS/CLI-Anything.git puis cd CLI-Anything\\libreoffice\\agent-harness && pip install -e .","Tester : cli-anything-libreoffice --help"] },
            { icon:"🎨", name:"GIMP", color:"#4ADE80", required:false,
              desc:"Traitement d'images, batch resize, création de visuels.",
              steps:["Si pas installé : winget install GIMP.GIMP","git clone https://github.com/HKUDS/CLI-Anything.git puis cd CLI-Anything\\gimp\\agent-harness && pip install -e .","Tester : cli-anything-gimp --help"] },
            { icon:"🎬", name:"Blender", color:"#F97316", required:false,
              desc:"Rendu 3D, animations, scènes depuis les Workflows.",
              steps:["Si pas installé : winget install BlenderFoundation.Blender","git clone https://github.com/HKUDS/CLI-Anything.git puis cd CLI-Anything\\blender\\agent-harness && pip install -e .","Tester : cli-anything-blender --help"] },
            { icon:"🗺", name:"Draw.io", color:"#A78BFA", required:false,
              desc:"Génère des diagrammes, flowcharts, mind maps automatiquement.",
              steps:["Si pas installé : winget install JGraph.Draw","git clone https://github.com/HKUDS/CLI-Anything.git puis cd CLI-Anything\\drawio\\agent-harness && pip install -e .","Tester : cli-anything-drawio --help"] },
            { icon:"🔴", name:"OBS Studio", color:"#F87171", required:false,
              desc:"Enregistre l'écran pour les tutos vidéo automatiques (Studio Auto).",
              steps:["Si pas installé : winget install OBSProject.OBSStudio","git clone https://github.com/HKUDS/CLI-Anything.git puis cd CLI-Anything\\obs-studio\\agent-harness && pip install -e .","Tester : cli-anything-obs-studio --help"] },
            { icon:"🎞", name:"Kdenlive", color:"#F97316", required:false,
              desc:"Monte les vidéos automatiquement après enregistrement OBS.",
              steps:["Si pas installé : winget install KDE.Kdenlive","git clone https://github.com/HKUDS/CLI-Anything.git puis cd CLI-Anything\\kdenlive\\agent-harness && pip install -e .","Tester : cli-anything-kdenlive --help"] },
            { icon:"🌐", name:"Browser-Use", color:"#4ADE80", required:false,
              desc:"Navigue dans les apps automatiquement pour les tutos vidéo.",
              steps:["PowerShell : pip install browser-use playwright","playwright install chromium","python -m browser_use.server --port 5679"] },
          ].map((tool,i) => (
            <div key={i} style={{padding:"12px 14px",background:"var(--s1)",border:"1px solid "+(tool.required?"rgba(212,168,83,.25)":"var(--bd)"),borderRadius:9}}>
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
        <div style={{marginTop:10,padding:"8px 12px",background:"rgba(74,222,128,.05)",border:"1px solid rgba(74,222,128,.15)",borderRadius:7,fontSize:9,color:"var(--mu)"}}>
          💡 <strong style={{color:"var(--tx)"}}>100% gratuit via PowerShell</strong> — les pilotes CLI-Anything sont pré-construits dans le repo GitHub. Un seul <code style={{color:"var(--ac)"}}>git clone</code> suffit, pas besoin de Claude Code ni de payer quoi que ce soit.
        </div>
      </div>
    </div>
  );
}
