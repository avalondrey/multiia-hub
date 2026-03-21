import React from 'react';
import { MODEL_DEFS } from "../config/models.js";
import { callModel } from "../api/ai-service.js";

export default function SecondBrainTab({ savedConvs, projects, memFacts, usageStats, apiKeys, enabled }) {
  const [generating, setGenerating] = React.useState(false);
  const [preview, setPreview] = React.useState(null);
  const [exportFormat, setExportFormat] = React.useState("obsidian");
  const [includeOptions, setIncludeOptions] = React.useState({
    conversations:true, projects:true, memory:true, prompts:true, stats:true, profile:true
  });

  const activeIds = Object.keys(MODEL_DEFS).filter(id => enabled[id] && !MODEL_DEFS[id]?.serial);
  const bestIA = activeIds.find(id=>["groq","mistral","cerebras"].includes(id)) || activeIds[0];

  const FORMATS = [
    { id:"obsidian", label:"🟣 Obsidian", ext:".md", desc:"Vault Markdown avec liens [[wikilinks]]" },
    { id:"notion",   label:"⬜ Notion",   ext:".md", desc:"Markdown compatible import Notion" },
    { id:"markdown", label:"📄 Markdown", ext:".md", desc:"Markdown universel" },
    { id:"json",     label:"📦 JSON",     ext:".json", desc:"Données structurées complètes" },
  ];

  const buildExport = async () => {
    setGenerating(true); setPreview(null);
    const fmt = exportFormat;
    const sections = [];
    const now = new Date().toLocaleDateString("fr-FR", {day:"2-digit",month:"long",year:"numeric"});

    if (fmt === "json") {
      const data = {
        exportDate: new Date().toISOString(),
        source: "Multi-IA Hub",
        version: "export-v1",
        memory: includeOptions.memory ? memFacts : [],
        projects: includeOptions.projects ? projects : [],
        conversations: includeOptions.conversations ? (savedConvs||[]).slice(0,20).map(c=>({
          id:c.id, title:c.title, date:c.date, ias:c.ias,
          summary: Object.values(c.conversations||{}).flat().filter(m=>m.role==="user").slice(0,1).map(m=>m.content?.slice(0,100)).join("")
        })) : [],
        stats: includeOptions.stats ? usageStats : {},
      };
      setPreview(JSON.stringify(data, null, 2));
      setGenerating(false);
      return;
    }

    const h = fmt==="obsidian" ? (n,l) => "#".repeat(l)+" "+n+"\n" : (n,l) => "#".repeat(l)+" "+n+"\n";
    const link = fmt==="obsidian" ? (t) => `[[${t}]]` : (t) => `**${t}**`;

    sections.push(`${h("🧠 Second Brain — Multi-IA Hub",1)}`);
    sections.push(`> Exporté le ${now} depuis Multi-IA Hub\n`);

    // Profil utilisateur généré par IA
    if (includeOptions.profile && bestIA && memFacts?.length > 0) {
      try {
        const facts = memFacts.map(f=>"- "+f.text).join("\n");
        const topIA = Object.entries(usageStats?.msgs||{}).sort(([,a],[,b])=>b-a)[0];
        const profilePrompt = `À partir de ces informations sur un utilisateur de Multi-IA Hub, génère un profil utilisateur en 3-5 phrases qui capture qui il est, ses intérêts et sa façon d'utiliser l'IA :\n\nMémoires :\n${facts}\n\nIA préférée : ${topIA?MODEL_DEFS[topIA[0]]?.name:"inconnue"}\nNombre de conversations : ${usageStats?.convs||0}\n\nRéponds directement avec le profil, sans intro.`;
        const profile = await callModel(bestIA, [{role:"user",content:profilePrompt}], apiKeys, "Tu génères des profils utilisateurs concis et précis.");
        sections.push(`${h("👤 Mon Profil IA",2)}\n${profile}\n`);
      } catch {}
    }

    // Mémoire
    if (includeOptions.memory && memFacts?.length > 0) {
      sections.push(`${h("📌 Mémoire Persistante",2)}`);
      memFacts.forEach(f => sections.push(`- ${f.text}`));
      sections.push("");
    }

    // Projets
    if (includeOptions.projects && projects?.length > 0) {
      sections.push(`${h("📁 Projets",2)}`);
      projects.forEach(p => {
        sections.push(`${h(p.name, 3)}`);
        if (p.desc) sections.push(`> ${p.desc}\n`);
        if (p.context) sections.push(`**Contexte IA :**\n${p.context}\n`);
        if (p.notes) sections.push(`**Notes :**\n${p.notes}\n`);
        sections.push(`*Créé le ${new Date(p.createdAt).toLocaleDateString("fr-FR")}*\n`);
      });
    }

    // Historique conversations
    if (includeOptions.conversations && savedConvs?.length > 0) {
      sections.push(`${h("💬 Historique des Conversations",2)}`);
      const convs = savedConvs.slice(0, 30);
      convs.forEach(c => {
        sections.push(`${h(c.title||"Sans titre", 3)}`);
        sections.push(`*${c.date} · IAs : ${(c.ias||[]).map(id=>MODEL_DEFS[id]?.short||id).join(", ")}*\n`);
        const firstUserMsg = Object.values(c.conversations||{}).flat().find(m=>m.role==="user");
        if (firstUserMsg) sections.push(`**Question :** ${firstUserMsg.content?.slice(0,200)}${firstUserMsg.content?.length>200?"…":""}\n`);
      });
    }

    // Stats
    if (includeOptions.stats) {
      const totalMsgs = Object.values(usageStats?.msgs||{}).reduce((a,b)=>a+b,0);
      const totalTok = Object.values(usageStats?.tokens||{}).reduce((a,b)=>a+b,0);
      const topIA = Object.entries(usageStats?.msgs||{}).sort(([,a],[,b])=>b-a)[0];
      sections.push(`${h("📊 Mes Statistiques",2)}`);
      sections.push(`| Métrique | Valeur |`);
      sections.push(`|----------|--------|`);
      sections.push(`| Conversations | ${usageStats?.convs||0} |`);
      sections.push(`| Messages envoyés | ${totalMsgs.toLocaleString()} |`);
      sections.push(`| Tokens estimés | ${(totalTok/1000).toFixed(1)}k |`);
      if (topIA) sections.push(`| IA préférée | ${MODEL_DEFS[topIA[0]]?.name} (${topIA[1]} msgs) |`);
      sections.push("");
      sections.push(`${h("Utilisation par IA", 3)}`);
      Object.entries(usageStats?.msgs||{}).filter(([,v])=>v>0).sort(([,a],[,b])=>b-a).forEach(([id,count])=>{
        const m = MODEL_DEFS[id];
        if (m) sections.push(`- **${m.name}** : ${count} messages`);
      });
    }

    setPreview(sections.join("\n"));
    setGenerating(false);
  };

  const downloadExport = () => {
    if (!preview) return;
    const fmt = FORMATS.find(f=>f.id===exportFormat);
    const blob = new Blob([preview], {type:"text/plain;charset=utf-8"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href=url; a.download=`second-brain-multiia${fmt.ext}`; a.click();
    URL.revokeObjectURL(url);
  };

  const totalItems = (savedConvs?.length||0) + (projects?.length||0) + (memFacts?.length||0);

  return (
    <div style={{flex:1,overflow:"auto",padding:"clamp(10px,2vw,16px)"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6,flexWrap:"wrap"}}>
        <div style={{fontFamily:"var(--font-display)",fontWeight:800,fontSize:"clamp(14px,2.5vw,18px)",color:"#A78BFA"}}>🧠 Second Brain Export</div>
        <div style={{fontSize:9,color:"var(--mu)"}}>— Exporte tout ton Multi-IA Hub vers Obsidian, Notion ou Markdown</div>
      </div>
      <div style={{fontSize:9,color:"var(--mu)",marginBottom:14,padding:"8px 12px",background:"rgba(167,139,250,.06)",border:"1px solid rgba(167,139,250,.15)",borderRadius:6}}>
        Toutes tes données (conversations, projets, mémoire, stats) sont compilées en un fichier structuré. Une IA génère aussi ton <strong style={{color:"var(--tx)"}}>profil utilisateur</strong> basé sur ton usage.
      </div>

      {/* Inventaire */}
      <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
        {[["💬",savedConvs?.length||0,"Conversations"],["📁",projects?.length||0,"Projets"],["📌",memFacts?.length||0,"Souvenirs"],["📊",Object.values(usageStats?.msgs||{}).reduce((a,b)=>a+b,0),"Messages"]].map(([ico,n,l])=>(
          <div key={l} style={{flex:1,minWidth:80,padding:"10px",background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:8,textAlign:"center"}}>
            <div style={{fontSize:18}}>{ico}</div>
            <div style={{fontSize:16,fontWeight:900,color:"var(--ac)",fontFamily:"var(--font-display)"}}>{n}</div>
            <div style={{fontSize:8,color:"var(--mu)"}}>{l}</div>
          </div>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
        {/* Format */}
        <div>
          <div style={{fontSize:8,color:"var(--mu)",fontWeight:700,marginBottom:6}}>FORMAT D'EXPORT</div>
          {FORMATS.map(f=>(
            <button key={f.id} onClick={()=>setExportFormat(f.id)}
              style={{display:"flex",alignItems:"center",gap:8,width:"100%",padding:"7px 10px",marginBottom:4,borderRadius:6,border:"1px solid "+(exportFormat===f.id?"rgba(167,139,250,.4)":"var(--bd)"),background:exportFormat===f.id?"rgba(167,139,250,.08)":"transparent",cursor:"pointer",textAlign:"left"}}>
              <span style={{fontSize:12,flexShrink:0}}>{f.label.slice(0,2)}</span>
              <div>
                <div style={{fontSize:9,fontWeight:700,color:exportFormat===f.id?"#A78BFA":"var(--tx)"}}>{f.label.slice(2).trim()}</div>
                <div style={{fontSize:7,color:"var(--mu)"}}>{f.desc}</div>
              </div>
            </button>
          ))}
        </div>
        {/* Contenu */}
        <div>
          <div style={{fontSize:8,color:"var(--mu)",fontWeight:700,marginBottom:6}}>CONTENU INCLUS</div>
          {Object.entries({conversations:"💬 Conversations",projects:"📁 Projets",memory:"📌 Mémoire",stats:"📊 Statistiques",profile:"🤖 Profil IA généré"}).map(([k,l])=>(
            <label key={k} style={{display:"flex",alignItems:"center",gap:8,marginBottom:7,cursor:"pointer"}}>
              <input type="checkbox" checked={!!includeOptions[k]} onChange={e=>setIncludeOptions(p=>({...p,[k]:e.target.checked}))}/>
              <span style={{fontSize:9,color:"var(--tx)"}}>{l}</span>
            </label>
          ))}
        </div>
      </div>

      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
        <button onClick={buildExport} disabled={generating||totalItems===0}
          style={{padding:"9px 22px",background:generating?"var(--s2)":"rgba(167,139,250,.15)",border:"1px solid "+(generating?"var(--bd)":"rgba(167,139,250,.4)"),borderRadius:6,color:generating?"var(--mu)":"#A78BFA",fontSize:10,cursor:generating?"default":"pointer",fontWeight:700,fontFamily:"var(--font-mono)"}}>
          {generating?"⏳ Génération…":"🧠 Générer le Second Brain"}
        </button>
        {preview && (
          <button onClick={downloadExport}
            style={{padding:"9px 22px",background:"rgba(74,222,128,.12)",border:"1px solid rgba(74,222,128,.3)",borderRadius:6,color:"var(--green)",fontSize:10,cursor:"pointer",fontWeight:700}}>
            ⬇️ Télécharger {FORMATS.find(f=>f.id===exportFormat)?.ext}
          </button>
        )}
      </div>

      {preview && (
        <div style={{background:"var(--s1)",border:"1px solid rgba(167,139,250,.2)",borderRadius:10,padding:"14px",maxHeight:400,overflow:"auto"}}>
          <div style={{fontSize:8,color:"#A78BFA",fontWeight:700,marginBottom:8}}>APERÇU</div>
          <pre style={{fontSize:9,color:"var(--tx)",lineHeight:1.7,whiteSpace:"pre-wrap",fontFamily:"var(--font-mono)"}}>{preview.slice(0,3000)}{preview.length>3000?"\n\n[… "+Math.round((preview.length-3000)/1000)+"k caractères supplémentaires …]":""}</pre>
        </div>
      )}
    </div>
  );
}
