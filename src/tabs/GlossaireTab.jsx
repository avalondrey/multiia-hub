import React from "react";
import { GLOSSAIRE_IA } from "../config/models.js";

export default function GlossaireTab({ navigateTab, setChatInput }) {
  const [search, setSearch] = React.useState("");
  const [cat, setCat] = React.useState("Tout");
  const [expanded, setExpanded] = React.useState(null);
  const cats = ["Tout", ...new Set(GLOSSAIRE_IA.map(g => g.cat))];
  const filtered = GLOSSAIRE_IA.filter(g => {
    const matchCat = cat === "Tout" || g.cat === cat;
    const q = search.toLowerCase();
    const matchSearch = !q || g.terme.toLowerCase().includes(q) || g.simple.toLowerCase().includes(q) || g.def.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });
  return (
    <div style={{flex:1,overflow:"auto",padding:"clamp(10px,2vw,16px)"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14,flexWrap:"wrap"}}>
        <div style={{fontFamily:"var(--font-display)",fontWeight:800,fontSize:"clamp(14px,2.5vw,18px)",color:"var(--ac)"}}>📖 Glossaire IA</div>
        <div style={{fontSize:9,color:"var(--mu)"}}>— {GLOSSAIRE_IA.length} termes expliqués simplement</div>
      </div>
      {/* Search + filtre */}
      <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Rechercher un terme…"
          style={{flex:1,minWidth:160,background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:6,color:"var(--tx)",fontSize:10,padding:"7px 11px",outline:"none"}}/>
        <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
          {cats.map(c=>(
            <button key={c} onClick={()=>setCat(c)}
              style={{padding:"5px 10px",borderRadius:12,border:"1px solid "+(cat===c?"var(--ac)":"var(--bd)"),background:cat===c?"rgba(212,168,83,.12)":"transparent",color:cat===c?"var(--ac)":"var(--mu)",fontSize:8,cursor:"pointer",fontWeight:cat===c?700:400}}>
              {c}
            </button>
          ))}
        </div>
      </div>
      {/* Grille */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:8}}>
        {filtered.map(g=>(
          <div key={g.terme} onClick={()=>setExpanded(expanded===g.terme?null:g.terme)}
            style={{background:"var(--s1)",border:"1px solid "+(expanded===g.terme?"rgba(212,168,83,.4)":"var(--bd)"),borderRadius:10,padding:"12px 14px",cursor:"pointer",transition:"all .15s"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
              <span style={{fontSize:18}}>{g.icon}</span>
              <div style={{flex:1}}>
                <div style={{fontWeight:800,fontSize:12,color:"var(--tx)",fontFamily:"var(--font-display)"}}>{g.terme}</div>
                <div style={{fontSize:9,color:"var(--ac)",fontStyle:"italic"}}>{g.simple}</div>
              </div>
              <span style={{fontSize:7,padding:"2px 6px",background:"rgba(167,139,250,.1)",color:"#A78BFA",borderRadius:8,fontWeight:700,flexShrink:0}}>{g.cat}</span>
            </div>
            <div style={{fontSize:9,color:"var(--mu)",lineHeight:1.6}}>{g.def}</div>
            {expanded===g.terme && (
              <div style={{marginTop:8,paddingTop:8,borderTop:"1px solid var(--bd)"}}>
                <div style={{fontSize:8,color:"var(--green)",fontWeight:700,marginBottom:3}}>EXEMPLE</div>
                <div style={{fontSize:9,color:"var(--tx)",fontStyle:"italic",lineHeight:1.5}}>{g.exemple}</div>
                <button onClick={e=>{e.stopPropagation();setChatInput("Explique-moi le concept de "+g.terme+" en IA avec des exemples concrets.");navigateTab("chat");}}
                  style={{marginTop:8,fontSize:8,padding:"3px 9px",background:"rgba(212,168,83,.1)",border:"1px solid rgba(212,168,83,.3)",borderRadius:4,color:"var(--ac)",cursor:"pointer"}}>
                  💬 Approfondir dans le Chat
                </button>
              </div>
            )}
          </div>
        ))}
        {filtered.length===0 && <div style={{gridColumn:"1/-1",textAlign:"center",padding:32,color:"var(--mu)",fontSize:10}}>Aucun terme trouvé pour "{search}"</div>}
      </div>
    </div>
  );
}
