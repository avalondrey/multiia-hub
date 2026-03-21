import React from 'react';
import { MODEL_DEFS } from "../config/models.js";
import { callModel } from "../api/ai-service.js";

export default function ContextTranslatorTab({ enabled, apiKeys }) {
  const [text, setText] = React.useState("");
  const [results, setResults] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [domain, setDomain] = React.useState("auto");

  const activeIds = Object.keys(MODEL_DEFS).filter(id => enabled[id] && !MODEL_DEFS[id]?.serial);

  const LEVELS = [
    { id:"enfant",    label:"👦 Enfant 10 ans",   color:"#4ADE80", desc:"Mots simples, analogies jouets/jeux" },
    { id:"lyceen",    label:"🎒 Lycéen",           color:"#60A5FA", desc:"Concepts de base, exemples concrets" },
    { id:"adulte",    label:"👤 Adulte lambda",    color:"#F59E0B", desc:"Langage courant, sans jargon" },
    { id:"expert",    label:"🔬 Expert",           color:"#A78BFA", desc:"Terminologie technique complète" },
    { id:"tweet",     label:"🐦 Tweet (280 car.)", color:"#EC4899", desc:"Ultra-condensé, percutant" },
  ];

  const DOMAINS = [
    {id:"auto",label:"🤖 Auto-detect"},{id:"medical",label:"🏥 Médical"},{id:"juridique",label:"⚖️ Juridique"},
    {id:"financier",label:"💰 Financier"},{id:"technique",label:"💻 Technique"},{id:"scientifique",label:"🔬 Scientifique"},
  ];

  const QUICK_TEXTS = [
    "Les LLMs utilisent l'attention multi-têtes pour pondérer les tokens dans leur fenêtre de contexte.",
    "La clause de non-concurrence stipule que le salarié s'interdit d'exercer toute activité concurrente pendant 24 mois.",
    "Le QE3 (Quantitative Easing) de la Fed a injecté 85 milliards de dollars mensuels en MBS et Treasuries.",
    "L'ARNm code pour la séquence d'acides aminés lors de la traduction ribosomale.",
  ];

  const translate = async () => {
    if (!text.trim() || !activeIds.length) return;
    setLoading(true); setResults(null);

    const domainCtx = domain!=="auto" ? ` (domaine : ${domain})` : "";
    const results = {};

    await Promise.all(LEVELS.map(async (level, i) => {
      const iaId = activeIds[i % activeIds.length];
      const prompts = {
        enfant:  `Explique ce texte${domainCtx} à un enfant de 10 ans. Utilise des analogies avec des jouets, la nourriture, les jeux ou le quotidien. MAX 80 mots :\n\n${text}`,
        lyceen:  `Explique ce texte${domainCtx} à un lycéen de 16 ans. Utilise le vocabulaire de base, sans jargon. MAX 100 mots :\n\n${text}`,
        adulte:  `Explique ce texte${domainCtx} à un adulte cultivé mais sans expertise dans ce domaine. Langage courant, exemples du quotidien. MAX 100 mots :\n\n${text}`,
        expert:  `Explique ce texte${domainCtx} à un expert du domaine. Utilise la terminologie technique précise, les nuances et les références pertinentes. MAX 150 mots :\n\n${text}`,
        tweet:   `Résume ce texte${domainCtx} en un tweet percutant de 280 caractères maximum. Sois direct, impactant :\n\n${text}`,
      };
      try {
        const output = await callModel(iaId, [{role:"user",content:prompts[level.id]}], apiKeys,
          `Tu es expert en vulgarisation ${domain!=="auto"?domain+".":"."} Réponds directement sans intro.`
        );
        results[level.id] = { output: output.trim(), iaId, ok:true };
      } catch(e) {
        results[level.id] = { output:"❌ "+e.message, iaId, ok:false };
      }
    }));

    setResults(results);
    setLoading(false);
  };

  return (
    <div style={{flex:1,overflow:"auto",padding:"clamp(10px,2vw,16px)"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6,flexWrap:"wrap"}}>
        <div style={{fontFamily:"var(--font-display)",fontWeight:800,fontSize:"clamp(14px,2.5vw,18px)",color:"#4ADE80"}}>🔄 Traducteur de Contexte</div>
        <div style={{fontSize:9,color:"var(--mu)"}}>— N'importe quel texte traduit en 5 niveaux de compréhension simultanément</div>
      </div>
      <div style={{fontSize:9,color:"var(--mu)",marginBottom:14,padding:"8px 12px",background:"rgba(74,222,128,.06)",border:"1px solid rgba(74,222,128,.15)",borderRadius:6}}>
        Colle n'importe quel texte technique, juridique, médical ou financier. Tes IAs le réécrivent en parallèle pour : enfant de 10 ans, lycéen, adulte lambda, expert du domaine et tweet.
      </div>

      {/* Exemples */}
      <div style={{marginBottom:10}}>
        <div style={{fontSize:8,color:"var(--mu)",fontWeight:700,marginBottom:5}}>EXEMPLES RAPIDES</div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {QUICK_TEXTS.map((t,i)=>(
            <button key={i} onClick={()=>setText(t)}
              style={{padding:"4px 10px",borderRadius:8,border:"1px solid var(--bd)",background:"var(--s1)",color:"var(--mu)",fontSize:8,cursor:"pointer"}}>
              {t.slice(0,45)}…
            </button>
          ))}
        </div>
      </div>

      <textarea value={text} onChange={e=>setText(e.target.value)}
        placeholder="Colle ton texte technique, juridique, médical ou financier…"
        rows={4} style={{width:"100%",background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:8,color:"var(--tx)",fontSize:11,padding:"10px 12px",resize:"vertical",outline:"none",boxSizing:"border-box",marginBottom:10}}/>

      <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap",alignItems:"center"}}>
        <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
          {DOMAINS.map(d=>(
            <button key={d.id} onClick={()=>setDomain(d.id)}
              style={{padding:"4px 9px",borderRadius:8,border:"1px solid "+(domain===d.id?"var(--ac)":"var(--bd)"),background:domain===d.id?"rgba(212,168,83,.1)":"transparent",color:domain===d.id?"var(--ac)":"var(--mu)",fontSize:8,cursor:"pointer"}}>
              {d.label}
            </button>
          ))}
        </div>
        <button onClick={translate} disabled={loading||!text.trim()||!activeIds.length}
          style={{marginLeft:"auto",padding:"8px 20px",background:loading?"var(--s2)":"rgba(74,222,128,.12)",border:"1px solid "+(loading?"var(--bd)":"rgba(74,222,128,.3)"),borderRadius:6,color:loading?"var(--mu)":"var(--green)",fontSize:10,cursor:loading?"default":"pointer",fontWeight:700}}>
          {loading?"⏳ Traduction…":"🔄 Traduire les 5 niveaux"}
        </button>
      </div>

      {/* Résultats */}
      {results && (
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {LEVELS.map(level=>results[level.id]&&(
            <div key={level.id} style={{background:"var(--s1)",border:"1px solid "+level.color+"33",borderLeft:"3px solid "+level.color,borderRadius:8,padding:"12px 14px"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                <span style={{padding:"2px 8px",borderRadius:8,background:level.color+"22",color:level.color,fontSize:8,fontWeight:700}}>{level.label}</span>
                <span style={{fontSize:8,color:"var(--mu)"}}>{MODEL_DEFS[results[level.id].iaId]?.icon} {MODEL_DEFS[results[level.id].iaId]?.short}</span>
                {results[level.id].ok && <span style={{marginLeft:"auto",fontSize:8,color:"var(--green)"}}>✓</span>}
              </div>
              <div style={{fontSize:10,color:"var(--tx)",lineHeight:1.7,whiteSpace:"pre-wrap"}}>{results[level.id].output}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
