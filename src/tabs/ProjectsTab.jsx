import React from 'react';
import { PROJECT_TEMPLATES } from "../config/models.js";

export default function ProjectsTab({ conversations, setChatInput, navigateTab, apiKeys, enabled }) {
  const PROJ_KEY = "multiia_projects";
  const [projects, setProjects] = React.useState(() => { try { return JSON.parse(localStorage.getItem(PROJ_KEY)||"[]"); } catch { return []; } });
  const [activeProj, setActiveProj] = React.useState(null);
  const [newName, setNewName] = React.useState("");
  const [editingId, setEditingId] = React.useState(null);

  const saveProjects = (p) => { setProjects(p); localStorage.setItem(PROJ_KEY, JSON.stringify(p)); };
  const createProject = () => {
    if (!newName.trim()) return;
    const p = {id:Date.now().toString(),name:newName.trim(),desc:"",context:"",notes:"",createdAt:new Date().toISOString(),color:"#"+(Math.random()*0xFFFFFF|0).toString(16).padStart(6,"0")};
    saveProjects([...projects,p]);
    setNewName("");
    setActiveProj(p.id);
  };
  const updateProject = (id, patch) => { saveProjects(projects.map(p=>p.id===id?{...p,...patch}:p)); };
  const deleteProject = (id) => { if(window.confirm("Supprimer ce projet ?")) { saveProjects(projects.filter(p=>p.id!==id)); if(activeProj===id) setActiveProj(null); }};

  const active = projects.find(p=>p.id===activeProj);

  return (
    <div style={{flex:1,display:"flex",overflow:"hidden"}}>
      {/* Sidebar */}
      <div style={{width:200,flexShrink:0,borderRight:"1px solid var(--bd)",display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{padding:"10px 12px",borderBottom:"1px solid var(--bd)",background:"var(--s1)"}}>
          <div style={{fontFamily:"var(--font-display)",fontWeight:700,fontSize:11,color:"var(--ac)",marginBottom:8}}>📁 Projets</div>
          <div style={{display:"flex",gap:5}}>
            <input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="Nouveau projet…"
              onKeyDown={e=>{if(e.key==="Enter")createProject();}}
              style={{flex:1,background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:4,color:"var(--tx)",fontSize:8,padding:"4px 7px",outline:"none"}}/>
            <button onClick={createProject} style={{background:"rgba(212,168,83,.15)",border:"1px solid rgba(212,168,83,.4)",borderRadius:4,color:"var(--ac)",fontSize:11,cursor:"pointer",padding:"2px 7px"}}>＋</button>
          </div>
        </div>
        {/* Templates */}
        <div style={{padding:"8px 10px",borderBottom:"1px solid var(--bd)",background:"var(--s2)",flexShrink:0}}>
          <div style={{fontSize:7,color:"var(--mu)",fontWeight:700,letterSpacing:1,marginBottom:6}}>TEMPLATES</div>
          <div style={{display:"flex",flexDirection:"column",gap:4}}>
            {PROJECT_TEMPLATES.map(tpl=>(
              <button key={tpl.id} onClick={()=>{
                const p={id:Date.now().toString(),name:tpl.name,desc:tpl.desc,context:tpl.context,notes:tpl.notes,createdAt:new Date().toISOString(),color:tpl.color};
                saveProjects([...projects,p]);
                setActiveProj(p.id);
              }}
              style={{padding:"5px 8px",borderRadius:5,border:"1px solid "+tpl.color+"33",background:tpl.color+"0D",color:tpl.color,fontSize:8,cursor:"pointer",textAlign:"left",fontWeight:600,transition:"all .15s"}}>
                {tpl.icon} {tpl.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{flex:1,overflow:"auto"}}>
          {projects.length===0&&<div style={{padding:16,fontSize:9,color:"var(--mu)",textAlign:"center"}}>Aucun projet</div>}
          {projects.map(p=>(
            <div key={p.id} onClick={()=>setActiveProj(p.id)}
              style={{padding:"9px 12px",cursor:"pointer",borderBottom:"1px solid var(--bd)",background:activeProj===p.id?"rgba(212,168,83,.08)":"transparent",borderLeft:"3px solid "+(activeProj===p.id?p.color:"transparent"),transition:"all .15s"}}>
              <div style={{fontSize:10,fontWeight:600,color:activeProj===p.id?"var(--ac)":"var(--tx)",marginBottom:2}}>{p.name}</div>
              <div style={{fontSize:7,color:"var(--mu)"}}>{new Date(p.createdAt).toLocaleDateString("fr-FR")}</div>
            </div>
          ))}
        </div>
      </div>
      {/* Main */}
      <div style={{flex:1,overflow:"auto",padding:"14px 16px"}}>
        {!active&&<div style={{textAlign:"center",padding:40,color:"var(--mu)",fontSize:10}}>Sélectionne ou crée un projet</div>}
        {active&&(
          <>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
              <div style={{width:12,height:12,borderRadius:"50%",background:active.color,flexShrink:0}}/>
              <input value={active.name} onChange={e=>updateProject(active.id,{name:e.target.value})}
                style={{fontSize:16,fontWeight:700,background:"transparent",border:"none",color:"var(--tx)",fontFamily:"var(--font-display)",outline:"none",flex:1}}/>
              <button onClick={()=>deleteProject(active.id)} style={{fontSize:9,padding:"3px 8px",background:"rgba(248,113,113,.1)",border:"1px solid rgba(248,113,113,.3)",borderRadius:4,color:"var(--red)",cursor:"pointer"}}>🗑 Supprimer</button>
            </div>
            <div style={{marginBottom:12}}>
              <div style={{fontSize:8,color:"var(--mu)",fontWeight:700,marginBottom:5}}>DESCRIPTION</div>
              <textarea value={active.desc||""} onChange={e=>updateProject(active.id,{desc:e.target.value})} placeholder="Description courte du projet…" rows={2}
                style={{width:"100%",background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:6,color:"var(--tx)",fontSize:10,padding:"8px 10px",fontFamily:"var(--font-ui)",resize:"vertical",outline:"none",boxSizing:"border-box"}}/>
            </div>
            <div style={{marginBottom:12}}>
              <div style={{fontSize:8,color:"var(--mu)",fontWeight:700,marginBottom:5}}>CONTEXTE IA (injecté dans chaque message)</div>
              <textarea value={active.context||""} onChange={e=>updateProject(active.id,{context:e.target.value})} placeholder="Contexte persistant : technologies utilisées, objectifs, contraintes… L'IA aura ce contexte en mémoire pour tout le projet." rows={4}
                style={{width:"100%",background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:6,color:"var(--tx)",fontSize:10,padding:"8px 10px",fontFamily:"var(--font-ui)",resize:"vertical",outline:"none",boxSizing:"border-box"}}/>
            </div>
            <div style={{marginBottom:12}}>
              <div style={{fontSize:8,color:"var(--mu)",fontWeight:700,marginBottom:5}}>NOTES PROJET</div>
              <textarea value={active.notes||""} onChange={e=>updateProject(active.id,{notes:e.target.value})} placeholder="Notes, idées, liens utiles…" rows={5}
                style={{width:"100%",background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:6,color:"var(--tx)",fontSize:10,padding:"8px 10px",fontFamily:"var(--font-ui)",resize:"vertical",outline:"none",boxSizing:"border-box"}}/>
            </div>
            <button onClick={()=>{
              const ctx = active.context ? "[Projet: "+active.name+"]\n"+active.context+"\n\n" : "";
              setChatInput(ctx);
              navigateTab("chat");
            }} style={{padding:"7px 16px",background:"rgba(212,168,83,.15)",border:"1px solid rgba(212,168,83,.4)",borderRadius:6,color:"var(--ac)",fontSize:9,cursor:"pointer",fontFamily:"var(--font-mono)",fontWeight:700}}>
              ◈ Ouvrir dans le Chat avec ce contexte
            </button>
          </>
        )}
      </div>
    </div>
  );
}
