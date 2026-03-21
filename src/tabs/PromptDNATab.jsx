import React from 'react';

export default function PromptDNATab({ onInject }) {
  const DNA_KEY = "multiia_prompt_dna";
  const [nodes, setNodes] = React.useState(() => { try { return JSON.parse(localStorage.getItem(DNA_KEY)||"[]"); } catch { return []; } });
  const [selected, setSelected] = React.useState(null);
  const [adding, setAdding] = React.useState(false);
  const [newPrompt, setNewPrompt] = React.useState("");
  const [newTitle, setNewTitle] = React.useState("");
  const [parentId, setParentId] = React.useState(null);
  const [search, setSearch] = React.useState("");

  const saveN = (n) => { setNodes(n); try { localStorage.setItem(DNA_KEY, JSON.stringify(n)); } catch {} };

  const addNode = () => {
    if (!newPrompt.trim()) return;
    const node = {
      id: Date.now().toString(),
      title: newTitle || newPrompt.slice(0,40)+"…",
      prompt: newPrompt,
      parentId: parentId || null,
      children: [],
      stars: 0,
      uses: 0,
      createdAt: new Date().toISOString(),
      tags: [],
    };
    const updated = [...nodes, node];
    if (parentId) {
      const withChild = updated.map(n => n.id===parentId ? {...n, children:[...n.children, node.id]} : n);
      saveN(withChild);
    } else {
      saveN(updated);
    }
    setAdding(false); setNewPrompt(""); setNewTitle(""); setParentId(null);
    setSelected(node.id);
  };

  const starNode = (id) => {
    const updated = nodes.map(n => n.id===id ? {...n, stars:(n.stars||0)+1} : n);
    saveN(updated);
  };

  const useNode = (id) => {
    const updated = nodes.map(n => n.id===id ? {...n, uses:(n.uses||0)+1} : n);
    saveN(updated);
    const node = nodes.find(n=>n.id===id);
    if (node) onInject(node.prompt);
  };

  const deleteNode = (id) => {
    const updated = nodes.filter(n=>n.id!==id).map(n=>({...n, children:n.children.filter(c=>c!==id)}));
    saveN(updated); if(selected===id) setSelected(null);
  };

  const roots = nodes.filter(n=>!n.parentId);
  const getChildren = (id) => nodes.filter(n=>n.parentId===id);
  const filtered = search ? nodes.filter(n=>n.title.toLowerCase().includes(search.toLowerCase())||n.prompt.toLowerCase().includes(search.toLowerCase())) : null;
  const sel = nodes.find(n=>n.id===selected);

  const renderNode = (node, depth=0) => (
    <div key={node.id} style={{marginLeft:depth*16}}>
      <div onClick={()=>setSelected(node.id)}
        style={{display:"flex",alignItems:"center",gap:6,padding:"6px 10px",borderRadius:6,cursor:"pointer",border:"1px solid "+(selected===node.id?"rgba(212,168,83,.4)":"transparent"),background:selected===node.id?"rgba(212,168,83,.06)":"transparent",marginBottom:2}}>
        {depth>0&&<span style={{color:"var(--mu)",fontSize:10,flexShrink:0}}>└</span>}
        <span style={{fontSize:9,color:"var(--tx)",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{node.title}</span>
        {node.stars>0&&<span style={{fontSize:8,color:"var(--ac)"}}>★{node.stars}</span>}
        {node.uses>0&&<span style={{fontSize:7,color:"var(--mu)"}}>×{node.uses}</span>}
        {getChildren(node.id).length>0&&<span style={{fontSize:7,color:"var(--blue)",flexShrink:0}}>⬡{getChildren(node.id).length}</span>}
      </div>
      {getChildren(node.id).map(c=>renderNode(c, depth+1))}
    </div>
  );

  return (
    <div style={{flex:1,display:"flex",overflow:"hidden"}}>
      {/* Sidebar arbre */}
      <div style={{width:220,flexShrink:0,borderRight:"1px solid var(--bd)",display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{padding:"10px 12px",borderBottom:"1px solid var(--bd)",background:"var(--s1)"}}>
          <div style={{fontFamily:"var(--font-display)",fontWeight:800,fontSize:12,color:"var(--ac)",marginBottom:8}}>🧬 Prompt DNA</div>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Rechercher…"
            style={{width:"100%",background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:5,color:"var(--tx)",fontSize:8,padding:"5px 8px",outline:"none",boxSizing:"border-box",marginBottom:6}}/>
          <button onClick={()=>{setAdding(true);setParentId(null);}}
            style={{width:"100%",padding:"5px",background:"rgba(212,168,83,.15)",border:"1px solid rgba(212,168,83,.4)",borderRadius:5,color:"var(--ac)",fontSize:8,cursor:"pointer",fontWeight:700}}>
            + Nouveau prompt racine
          </button>
        </div>
        <div style={{flex:1,overflow:"auto",padding:"6px 4px"}}>
          {nodes.length===0&&<div style={{padding:12,fontSize:9,color:"var(--mu)",textAlign:"center"}}>Aucun prompt.<br/>Ajoute ton premier !</div>}
          {(filtered||roots).map(n=>renderNode(n))}
        </div>
        {nodes.length>0&&(
          <div style={{padding:"8px 12px",borderTop:"1px solid var(--bd)",fontSize:8,color:"var(--mu)"}}>
            {nodes.length} prompts · {nodes.reduce((a,n)=>a+(n.stars||0),0)} ★ total
          </div>
        )}
      </div>

      {/* Main */}
      <div style={{flex:1,overflow:"auto",padding:"14px 16px"}}>
        {/* Formulaire d'ajout */}
        {adding && (
          <div style={{background:"var(--s1)",border:"1px solid rgba(212,168,83,.3)",borderRadius:10,padding:"14px 16px",marginBottom:14}}>
            <div style={{fontWeight:700,fontSize:12,color:"var(--ac)",marginBottom:10}}>{parentId?"🌿 Variante de :"+nodes.find(n=>n.id===parentId)?.title:"🌱 Nouveau prompt racine"}</div>
            <input value={newTitle} onChange={e=>setNewTitle(e.target.value)} placeholder="Titre court (optionnel)"
              style={{width:"100%",background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:5,color:"var(--tx)",fontSize:10,padding:"6px 10px",outline:"none",boxSizing:"border-box",marginBottom:8}}/>
            <textarea value={newPrompt} onChange={e=>setNewPrompt(e.target.value)} placeholder="Le prompt complet…" rows={4}
              style={{width:"100%",background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:5,color:"var(--tx)",fontSize:10,padding:"8px 10px",resize:"vertical",outline:"none",boxSizing:"border-box",marginBottom:8}}/>
            <div style={{display:"flex",gap:8}}>
              <button onClick={addNode} disabled={!newPrompt.trim()}
                style={{padding:"7px 16px",background:"rgba(212,168,83,.15)",border:"1px solid rgba(212,168,83,.4)",borderRadius:5,color:"var(--ac)",fontSize:9,cursor:"pointer",fontWeight:700}}>
                💾 Enregistrer
              </button>
              <button onClick={()=>{setAdding(false);setNewPrompt("");setNewTitle("");setParentId(null);}}
                style={{padding:"7px 12px",background:"transparent",border:"1px solid var(--bd)",borderRadius:5,color:"var(--mu)",fontSize:9,cursor:"pointer"}}>Annuler</button>
            </div>
          </div>
        )}

        {/* Détail du prompt sélectionné */}
        {sel && !adding && (
          <div>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12,flexWrap:"wrap"}}>
              <div style={{fontFamily:"var(--font-display)",fontWeight:800,fontSize:14,color:"var(--tx)",flex:1}}>{sel.title}</div>
              <div style={{display:"flex",gap:6}}>
                <button onClick={()=>starNode(sel.id)} style={{padding:"5px 10px",background:"rgba(212,168,83,.1)",border:"1px solid rgba(212,168,83,.3)",borderRadius:5,color:"var(--ac)",fontSize:9,cursor:"pointer"}}>★ Star ({sel.stars||0})</button>
                <button onClick={()=>useNode(sel.id)} style={{padding:"5px 10px",background:"rgba(74,222,128,.1)",border:"1px solid rgba(74,222,128,.3)",borderRadius:5,color:"var(--green)",fontSize:9,cursor:"pointer",fontWeight:700}}>▶ Utiliser</button>
                <button onClick={()=>{setAdding(true);setParentId(sel.id);setNewPrompt(sel.prompt+" ");}} style={{padding:"5px 10px",background:"rgba(96,165,250,.1)",border:"1px solid rgba(96,165,250,.3)",borderRadius:5,color:"var(--blue)",fontSize:9,cursor:"pointer"}}>⬡ Créer variante</button>
                <button onClick={()=>deleteNode(sel.id)} style={{padding:"5px 10px",background:"rgba(248,113,113,.1)",border:"1px solid rgba(248,113,113,.3)",borderRadius:5,color:"var(--red)",fontSize:9,cursor:"pointer"}}>🗑</button>
              </div>
            </div>
            {/* Généalogie */}
            {sel.parentId && (
              <div style={{marginBottom:10,fontSize:9,color:"var(--mu)",display:"flex",alignItems:"center",gap:4}}>
                <span>Dérivé de :</span>
                <button onClick={()=>setSelected(sel.parentId)} style={{background:"transparent",border:"none",color:"var(--blue)",fontSize:9,cursor:"pointer",textDecoration:"underline"}}>
                  {nodes.find(n=>n.id===sel.parentId)?.title||"parent"}
                </button>
              </div>
            )}
            {/* Stats */}
            <div style={{display:"flex",gap:10,marginBottom:12}}>
              {[["★","Stars",sel.stars||0],["▶","Utilisations",sel.uses||0],["⬡","Variantes",getChildren(sel.id).length],["📅","Créé",new Date(sel.createdAt).toLocaleDateString("fr-FR")]].map(([ico,l,v])=>(
                <div key={l} style={{background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:6,padding:"6px 10px",textAlign:"center",minWidth:60}}>
                  <div style={{fontSize:14}}>{ico}</div>
                  <div style={{fontSize:11,fontWeight:700,color:"var(--ac)"}}>{v}</div>
                  <div style={{fontSize:7,color:"var(--mu)"}}>{l}</div>
                </div>
              ))}
            </div>
            {/* Prompt */}
            <div style={{background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:8,padding:"12px 14px",marginBottom:12,position:"relative"}}>
              <div style={{fontSize:8,color:"var(--mu)",fontWeight:700,marginBottom:6}}>PROMPT COMPLET</div>
              <div style={{fontSize:10,color:"var(--tx)",lineHeight:1.7,whiteSpace:"pre-wrap"}}>{sel.prompt}</div>
              <button onClick={()=>navigator.clipboard.writeText(sel.prompt)}
                style={{position:"absolute",top:8,right:8,fontSize:8,padding:"2px 7px",background:"rgba(212,168,83,.1)",border:"1px solid rgba(212,168,83,.3)",borderRadius:4,color:"var(--ac)",cursor:"pointer"}}>📋</button>
            </div>
            {/* Variantes enfants */}
            {getChildren(sel.id).length>0 && (
              <div>
                <div style={{fontSize:9,fontWeight:700,color:"var(--mu)",marginBottom:8}}>⬡ VARIANTES ({getChildren(sel.id).length})</div>
                <div style={{display:"flex",flexDirection:"column",gap:4}}>
                  {getChildren(sel.id).map(c=>(
                    <div key={c.id} onClick={()=>setSelected(c.id)}
                      style={{padding:"8px 10px",borderRadius:6,border:"1px solid var(--bd)",background:"var(--s1)",cursor:"pointer",display:"flex",alignItems:"center",gap:8}}>
                      <span style={{fontSize:9,color:"var(--blue)"}}>└</span>
                      <span style={{fontSize:9,color:"var(--tx)",flex:1}}>{c.title}</span>
                      <span style={{fontSize:8,color:"var(--ac)"}}>★{c.stars||0}</span>
                      <span style={{fontSize:8,color:"var(--mu)"}}>×{c.uses||0}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        {!sel&&!adding&&<div style={{textAlign:"center",padding:40,color:"var(--mu)",fontSize:10}}>Sélectionne un prompt ou crée-en un nouveau</div>}
      </div>
    </div>
  );
}
