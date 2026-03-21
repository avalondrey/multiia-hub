import React from 'react';
import { BASE_WEB_AIS, DISCOVERY_SOURCES } from "../config/models.js";
import { getDiscoveredAIs, saveDiscoveredAIs } from "../config/models.js";

export default function WebIAsTab() {
  const [discovered, setDiscovered] = React.useState(getDiscoveredAIs());
  const [discovering, setDiscovering] = React.useState(false);
  const [discMsg, setDiscMsg] = React.useState("");
  const [filterCat, setFilterCat] = React.useState("all");
  const [search, setSearch] = React.useState("");
  const [sortBy, setSortBy] = React.useState("trend");
  const [expandedId, setExpandedId] = React.useState(null);

  const allAIs = [...BASE_WEB_AIS, ...discovered];

  const cats = [
    {id:"all",        label:"Tout",           icon:"🌐"},
    {id:"gratuit",    label:"Chatbots",        icon:"💬"},
    {id:"recherche",  label:"Recherche",       icon:"🔍"},
    {id:"multimodele",label:"Multi-modèles",   icon:"🔀"},
    {id:"image",      label:"Image & Vidéo",   icon:"🎨"},
    {id:"code",       label:"Code & Dev",      icon:"💻"},
    {id:"audio",      label:"Audio & Musique", icon:"🎵"},
    {id:"local",      label:"Local / Self-hosted", icon:"🖥"},
    {id:"payant",     label:"Premium",         icon:"💳"},
  ];

  const catColors = {
    gratuit:"#4ADE80", recherche:"#60A5FA", multimodele:"#F59E0B",
    image:"#F472B6", code:"#A78BFA", audio:"#34D399", local:"#0EA5E9", payant:"#FB923C"
  };
  const catLabels = {
    gratuit:"GRATUIT", recherche:"RECHERCHE", multimodele:"MULTI-MODÈLES",
    image:"IMAGE", code:"CODE", audio:"AUDIO", local:"LOCAL", payant:"PREMIUM"
  };

  const filtered = allAIs
    .filter(ia => {
      const matchCat = filterCat === "all" || ia.cat === filterCat;
      const q = search.toLowerCase();
      const matchSearch = !search || ia.name.toLowerCase().includes(q) ||
        (ia.desc||"").toLowerCase().includes(q) ||
        (ia.tags||[]).some(t => t.toLowerCase().includes(q));
      return matchCat && matchSearch;
    })
    .sort((a,b) => {
      if (sortBy === "trend") return (b.trend||5) - (a.trend||5);
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return a.cat.localeCompare(b.cat);
    });

  const hotCount = filtered.filter(ia => (ia.trend||0) >= 9).length;

  async function discoverNewAIs() {
    setDiscovering(true); setDiscMsg("🔍 Recherche de nouvelles IAs via Groq...");
    try {
      let groqKey = "";
      try { groqKey = JSON.parse(localStorage.getItem("multiia_keys")||"{}").groq_inf||""; } catch{}
      if (!groqKey) throw new Error("Clé Groq manquante — configure-la dans ⚙ Config d'abord");
      const prompt = "Tu es un expert en outils IA. Liste 5 nouvelles IAs web accessibles en 2025-2026 qui ne font PAS partie de cette liste: " + allAIs.map(a=>a.name).join(", ") + ". Reponds UNIQUEMENT en JSON valide, tableau de 5 objets avec ces champs OBLIGATOIRES:\n[{\"id\":\"identifiant-court\",\"name\":\"Nom de l IA\",\"subtitle\":\"Fournisseur • Prix (ex: OpenAI • Gratuit)\",\"cat\":\"gratuit\",\"url\":\"https://...\",\"color\":\"#RRGGBB\",\"icon\":\"emoji\",\"desc\":\"Description 2-3 phrases sur les spécialisations et forces de cet outil\",\"tags\":[\"tag1\",\"tag2\",\"tag3\"],\"trend\":7}]\nRÈGLES STRICTES: subtitle = NOM_FOURNISSEUR • PRIX uniquement (PAS une URL). icon = 1 seul emoji. desc = 2-3 phrases max. tags = 3 à 5 mots-clés courts. trend = score popularité 1-10. cat parmi: gratuit|recherche|multimodele|image|code|audio|payant. Pas de texte avant ou apres le JSON.";
      const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method:"POST",
        headers:{"Content-Type":"application/json","Authorization":"Bearer "+groqKey},
        body:JSON.stringify({ model:"llama-3.3-70b-versatile", max_tokens:1200,
          messages:[{role:"user",content:prompt}] })
      });
      const data = await resp.json();
      const text = data.choices?.[0]?.message?.content || "[]";
      const clean = text.replace(/```json|```/g,"").trim();
      const newAIs = JSON.parse(clean);
      const existing = new Set(allAIs.map(a=>a.id));
      const toAdd = newAIs
        .filter(a => a.id && a.name && a.url && !existing.has(a.id))
        .map(a => ({
          ...a,
          subtitle: (a.subtitle && !a.subtitle.startsWith("http")) ? a.subtitle.slice(0,50) : (a.name+" • Web"),
          icon: a.icon ? String(a.icon).slice(0,2).trim()||"🤖" : "🤖",
          desc: a.desc ? String(a.desc).slice(0,200) : "Outil IA en ligne",
          color: /^#[0-9A-Fa-f]{6}$/.test(a.color) ? a.color : "#60A5FA",
          tags: Array.isArray(a.tags) ? a.tags.slice(0,5).map(t=>String(t).slice(0,20)) : [],
          trend: typeof a.trend === "number" ? Math.min(10,Math.max(1,a.trend)) : 5,
        }));
      if(toAdd.length > 0) {
        const updated = [...discovered, ...toAdd];
        setDiscovered(updated); saveDiscoveredAIs(updated);
        setDiscMsg(`✅ ${toAdd.length} nouvelle(s) IA(s) ajoutée(s) !`);
      } else { setDiscMsg("ℹ️ Aucune nouvelle IA trouvée."); }
    } catch(e) { setDiscMsg("❌ Erreur: "+e.message); }
    setDiscovering(false);
    setTimeout(()=>setDiscMsg(""),4000);
  }

  function removeDiscovered(id) {
    const updated = discovered.filter(a=>a.id!==id);
    setDiscovered(updated); saveDiscoveredAIs(updated);
  }

  const TrendBar = ({score}) => {
    const color = score>=9?"#4ADE80":score>=7?"#F59E0B":score>=5?"#60A5FA":"#6B7280";
    return (
      <div style={{display:"flex",alignItems:"center",gap:4}}>
        <div style={{display:"flex",gap:1}}>
          {[1,2,3,4,5,6,7,8,9,10].map(s=>(
            <div key={s} style={{width:6,height:s<=score?10:6,background:s<=score?color:"var(--bd)",borderRadius:1,transition:"all .2s",marginTop:s<=score?0:2}}/>
          ))}
        </div>
        <span style={{fontSize:7,color,fontWeight:700}}>{score>=9?"🔥 TENDANCE":score>=7?"⭐ POPULAIRE":score>=5?"✓ Actif":"○"}</span>
      </div>
    );
  };

  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      {/* Header */}
      <div style={{padding:"10px 14px",borderBottom:"1px solid var(--bd)",flexShrink:0,background:"var(--s1)",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
        <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:14,color:"var(--ac)"}}>🌐 IAs Web</div>
        <div style={{fontSize:9,color:"var(--mu)"}}>{allAIs.length} IAs · {hotCount} en tendance</div>
        <div style={{marginLeft:"auto",display:"flex",gap:5,alignItems:"center",flexWrap:"wrap"}}>
          <div style={{display:"flex",gap:3}}>
            {[["trend","🔥 Tendances"],["name","A-Z"],["cat","Catégorie"]].map(([k,l])=>(
              <button key={k} onClick={()=>setSortBy(k)}
                style={{fontSize:8,padding:"2px 7px",borderRadius:4,border:`1px solid ${sortBy===k?"var(--ac)":"var(--bd)"}`,background:sortBy===k?"rgba(212,168,83,.15)":"transparent",color:sortBy===k?"var(--ac)":"var(--mu)",cursor:"pointer",fontFamily:"var(--font-mono)"}}>
                {l}
              </button>
            ))}
          </div>
          <button onClick={discoverNewAIs} disabled={discovering}
            style={{padding:"4px 10px",fontSize:9,fontWeight:700,borderRadius:5,border:"1px solid var(--ac)",background:"transparent",color:"var(--ac)",cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace",opacity: discovering ? 0.6 : 1}}>
            {discovering?"⏳ Recherche...":"🔭 Découvrir nouvelles IAs"}
          </button>
        </div>
        {discMsg && <div style={{fontSize:9,color:"var(--green)",width:"100%"}}>{discMsg}</div>}
      </div>

      {/* Filtres catégories */}
      <div style={{display:"flex",gap:5,padding:"7px 14px",borderBottom:"1px solid var(--bd)",flexShrink:0,flexWrap:"wrap",alignItems:"center"}}>
        {cats.map(cat=>(
          <button key={cat.id} onClick={()=>setFilterCat(cat.id)}
            style={{padding:"3px 9px",fontSize:9,fontWeight:600,borderRadius:12,border:`1px solid ${filterCat===cat.id?"var(--ac)":"var(--bd)"}`,background:filterCat===cat.id?"var(--ac)":"transparent",color:filterCat===cat.id?"var(--bg)":"var(--mu)",cursor:"pointer",transition:"all .15s"}}>
            {cat.icon} {cat.label}
            {filterCat===cat.id&&<span style={{opacity:.7,marginLeft:3}}>({allAIs.filter(a=>cat.id==="all"||a.cat===cat.id).length})</span>}
          </button>
        ))}
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Nom, tag, spécialité..."
          style={{marginLeft:"auto",padding:"3px 9px",fontSize:9,borderRadius:12,border:"1px solid var(--bd)",background:"var(--s1)",color:"var(--tx)",outline:"none",width:160}}/>
      </div>

      {/* Grille enrichie */}
      <div style={{flex:1,overflow:"auto",padding:"12px 14px"}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(230px,1fr))",gap:10}}>
          {filtered.map(ia=>{
            const isNew = discovered.find(d=>d.id===ia.id);
            const isExpanded = expandedId === ia.id;
            const col = catColors[ia.cat]||"#60A5FA";
            return (
              <div key={ia.id} style={{position:"relative",display:"flex",flexDirection:"column"}}>
                <div
                  style={{display:"flex",flexDirection:"column",gap:0,background:"var(--s1)",border:`1px solid ${ia.color}33`,borderRadius:8,overflow:"hidden",transition:"all .2s",cursor:"pointer",boxShadow:(ia.trend||0)>=9?`0 0 12px ${ia.color}20`:"none"}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=ia.color;e.currentTarget.style.transform="translateY(-1px)";}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor=ia.color+"33";e.currentTarget.style.transform="";}}>

                  {/* Barre tendance en haut */}
                  {(ia.trend||0)>=9&&(
                    <div style={{height:2,background:`linear-gradient(90deg,${ia.color},${ia.color}88)`,flexShrink:0}}/>
                  )}

                  {/* Header cliquable → ouvre le lien */}
                  <a href={ia.url} target="_blank" rel="noreferrer" style={{textDecoration:"none",display:"flex",alignItems:"center",gap:8,padding:"10px 12px 6px"}}>
                    <div style={{width:32,height:32,borderRadius:8,background:ia.color+"18",border:`1.5px solid ${ia.color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0}}>{ia.icon}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:11,fontWeight:700,color:"var(--tx)",display:"flex",alignItems:"center",gap:5}}>
                        {ia.name}
                        {(ia.trend||0)>=9&&<span style={{fontSize:8,padding:"1px 4px",borderRadius:3,background:"rgba(250,204,21,.15)",color:"#FCD34D",fontWeight:700}}>🔥 TENDANCE</span>}
                      </div>
                      <div style={{fontSize:8,color:ia.color,marginTop:1}}>{ia.subtitle}</div>
                    </div>
                    <span style={{fontSize:11,color:"var(--mu)",flexShrink:0}}>↗</span>
                  </a>

                  {/* Description */}
                  <div style={{padding:"0 12px 8px",fontSize:9,color:"var(--mu)",lineHeight:1.55}}>{ia.desc}</div>

                  {/* Tags */}
                  {ia.tags&&ia.tags.length>0&&(
                    <div style={{padding:"0 12px 8px",display:"flex",gap:4,flexWrap:"wrap"}}>
                      {ia.tags.map(tag=>(
                        <span key={tag} style={{fontSize:7,padding:"1px 5px",borderRadius:3,background:ia.color+"15",color:ia.color,border:`1px solid ${ia.color}30`,fontWeight:600,cursor:"pointer"}}
                          onClick={()=>setSearch(tag)}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Footer */}
                  <div style={{padding:"6px 12px",borderTop:"1px solid var(--bd)",display:"flex",alignItems:"center",gap:8,background:"var(--bg)"}}>
                    <TrendBar score={ia.trend||5}/>
                    <div style={{marginLeft:"auto"}}>
                      <span style={{fontSize:7,padding:"2px 6px",borderRadius:3,background:col+"15",color:col,fontWeight:700,border:`1px solid ${col}30`}}>
                        {catLabels[ia.cat]||ia.cat.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bouton supprimer (découvertes) */}
                {isNew&&(
                  <button onClick={()=>removeDiscovered(ia.id)} title="Retirer"
                    style={{position:"absolute",top:6,right:6,fontSize:8,background:"rgba(0,0,0,.6)",border:"none",color:"var(--mu)",cursor:"pointer",borderRadius:3,padding:"1px 5px",zIndex:2}}>✕</button>
                )}
              </div>
            );
          })}
        </div>
        {filtered.length===0&&<div style={{textAlign:"center",color:"var(--mu)",fontSize:11,padding:40}}>Aucune IA pour "{search}"</div>}

        {/* Sources discovery */}
        <div style={{marginTop:20,padding:"10px 14px",background:"var(--s1)",borderRadius:8,border:"1px solid var(--bd)"}}>
          <div style={{fontSize:9,color:"var(--mu)",marginBottom:8,fontWeight:700}}>📡 Sources de veille IA</div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {DISCOVERY_SOURCES.map(s=>(
              <a key={s.url} href={s.url} target="_blank" rel="noreferrer"
                style={{fontSize:8,color:"var(--blue)",textDecoration:"none",padding:"2px 8px",border:"1px solid rgba(96,165,250,.2)",borderRadius:4,background:"rgba(96,165,250,.05)"}}>
                ↗ {s.name}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
