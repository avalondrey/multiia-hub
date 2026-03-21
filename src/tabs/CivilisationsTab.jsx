import React from 'react';
import { MODEL_DEFS } from "../config/models.js";
import { callModel } from "../api/ai-service.js";

export default function CivilisationsTab({ enabled, apiKeys }) {
  const [question, setQuestion] = React.useState("");
  const [results, setResults] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [synthesis, setSynthesis] = React.useState("");
  const [synthLoading, setSynthLoading] = React.useState(false);
  const [selectedCivs, setSelectedCivs] = React.useState(["grece","islam","chine","lumières","silicon"]);

  const activeIds = Object.keys(MODEL_DEFS).filter(id => enabled[id] && !MODEL_DEFS[id]?.serial);

  const CIVILISATIONS = [
    { id:"grece",      label:"🏛️ Grèce antique",        color:"#60A5FA", period:"Ve-IVe s. av. J.-C.",
      system:"Tu es un philosophe de la Grèce antique (mélange de Socrate, Aristote, Platon). Tu raisonnes par la dialectique, la vertu, le bien commun et la recherche de la vérité. Tu cites des exemples de la cité, de la nature, des dieux grecs." },
    { id:"rome",       label:"⚔️ Rome impériale",         color:"#F87171", period:"Ier-IIe s. apr. J.-C.",
      system:"Tu es un penseur romain (mélange de Marc Aurèle, Cicéron, Sénèque). Tu raisonnes par la pragmatique, la loi, la discipline stoïcienne, et le service de l'Empire. Tu valorises l'ordre, la hiérarchie et la vertu romaine." },
    { id:"chine",      label:"🐉 Chine impériale",         color:"#34D399", period:"Dynasties Tang-Song, VIIe-XIIIe s.",
      system:"Tu es un lettré confucéen de la Chine impériale (mélange de Confucius, Zhuangzi, Sun Tzu). Tu raisonnes par l'harmonie, la hiérarchie sociale, le yin-yang, la sagesse ancestrale et l'équilibre de la nature." },
    { id:"islam",      label:"🌙 Âge d'or islamique",      color:"#A78BFA", period:"VIIIe-XIIIe s.",
      system:"Tu es un savant de l'âge d'or islamique (mélange d'Ibn Rushd, Al-Ghazali, Ibn Khaldoun). Tu raisonnes par la foi, la raison, la connaissance comme devoir, et l'harmonie entre sciences et spiritualité." },
    { id:"moyen_age",  label:"⛪ Europe médiévale",        color:"#FCD34D", period:"XIIe-XIVe s.",
      system:"Tu es un théologien médiéval (mélange de Thomas d'Aquin, Abélard). Tu raisonnes par la foi chrétienne, la scolastique, la grâce divine et l'ordre naturel voulu par Dieu. La Bible et Aristote sont tes références." },
    { id:"lumières",   label:"💡 Lumières européennes",    color:"#FB923C", period:"XVIIIe s.",
      system:"Tu es un philosophe des Lumières (mélange de Voltaire, Rousseau, Kant). Tu raisonnes par la raison, la liberté individuelle, le contrat social, les droits naturels et le progrès de l'humanité." },
    { id:"japon",      label:"🗾 Japon féodal",            color:"#F472B6", period:"Ère Edo, XVIIe-XIXe s.",
      system:"Tu es un penseur japonais de l'ère Edo (mélange de Musashi, maîtres zen, confucéens japonais). Tu raisonnes par le Bushido, la discipline, le respect des ancêtres, la beauté dans la simplicité, et l'harmonie avec la nature." },
    { id:"africain",   label:"🌍 Afrique subsaharienne",   color:"#4ADE80", period:"Traditions bantou-yoruba",
      system:"Tu es un sage de la tradition africaine (philosophie ubuntu, traditions yoruba, bantou). Tu raisonnes par 'Je suis parce que nous sommes' (Ubuntu), la communauté, les ancêtres, l'interconnexion de tous les êtres vivants." },
    { id:"amerindien", label:"🦅 Peuples premiers",         color:"#38BDF8", period:"Traditions lakotas-aztèques",
      system:"Tu es un sage amérindien (traditions lakotas, aztèques, mayas). Tu raisonnes par la relation sacrée avec la Terre-mère, le respect des cycles naturels, la responsabilité envers les 7 générations futures." },
    { id:"silicon",    label:"💻 Silicon Valley 2026",     color:"#D4A853", period:"Époque actuelle",
      system:"Tu es un tech entrepreneur de la Silicon Valley en 2026 (pensée d'Elon Musk, Sam Altman, Reid Hoffman). Tu raisonnes par l'innovation disruptive, l'IA comme levier de transformation, la croissance exponentielle, le 'move fast', l'optimisme technologique radical." },
    { id:"stoicisme",  label:"⚖️ Stoïcisme",               color:"#94A3B8", period:"Antiquité tardive",
      system:"Tu es un stoïcien (Marc Aurèle, Épictète, Sénèque). Tu distingues ce qui dépend de toi de ce qui n'en dépend pas. Tu valorises la vertu, le détachement des passions, la discipline intérieure et l'acceptation du destin." },
    { id:"bouddhisme", label:"🪷 Bouddhisme",              color:"#EC4899", period:"Tradition Theravada-Mahayana",
      system:"Tu es un maître bouddhiste (mélange de traditions Theravada et Zen). Tu raisonnes par l'impermanence, la souffrance née de l'attachement, la voie du milieu, la compassion pour tous les êtres et l'éveil." },
  ];

  const QUICK_QUESTIONS = [
    "Qu'est-ce que le bonheur et comment l'atteindre ?",
    "Quelle est la place de l'individu face à la société ?",
    "Comment faire face à la mort ?",
    "L'intelligence artificielle est-elle une menace ou une opportunité ?",
    "Qu'est-ce qu'un chef ou un bon dirigeant ?",
    "Comment réagir face à l'injustice ?",
  ];

  const toggleCiv = (id) => {
    setSelectedCivs(prev => prev.includes(id) ? prev.filter(c=>c!==id) : [...prev,id].slice(0,6));
  };

  const run = async () => {
    if (!question.trim() || !activeIds.length || !selectedCivs.length) return;
    setLoading(true); setResults([]); setSynthesis("");
    const civs = CIVILISATIONS.filter(c => selectedCivs.includes(c.id));

    const allResults = await Promise.all(civs.map(async (civ, i) => {
      const iaId = activeIds[i % activeIds.length];
      const prompt = `Question contemporaine posée à ta civilisation :
"${question}"

Réponds depuis la perspective de ta civilisation et époque. Utilise des références à tes valeurs, tes penseurs, tes exemples historiques. Sois authentique à ton époque — ne connais pas les événements postérieurs. MAX 200 mots.`;
      try {
        const output = await callModel(iaId, [{role:"user",content:prompt}], apiKeys, civ.system);
        return { ...civ, output, iaId, ok:true };
      } catch(e) {
        return { ...civ, output:"❌ "+e.message, iaId, ok:false };
      }
    }));

    setResults(allResults);
    setLoading(false);
  };

  const runSynthesis = async () => {
    if (!results.length) return;
    setSynthLoading(true);
    const judge = activeIds.find(id=>["mistral","groq","sambanova","poll_claude"].includes(id)) || activeIds[0];
    const transcript = results.map(r=>`[${r.label} — ${r.period}] : ${r.output}`).join("\n\n");
    const prompt = `Tu es un historien comparatiste. Voici comment différentes civilisations répondent à la question : "${question}"

${transcript}

Synthétise en :
1. **Convergences universelles** : ce sur quoi toutes (ou la plupart) s'accordent
2. **Divergences fondamentales** : les points de désaccord profond entre les civilisations
3. **Ce que 2026 peut apprendre** de ces sagesses anciennes et diverses
4. **Ta conclusion** en 2 phrases sur ce que révèle cette diversité de réponses`;

    try {
      const out = await callModel(judge, [{role:"user",content:prompt}], apiKeys, "Historien comparatiste et philosophe. Tu analyses les convergences et divergences entre civilisations.");
      setSynthesis(out);
    } catch(e) { setSynthesis("❌ "+e.message); }
    setSynthLoading(false);
  };

  return (
    <div style={{flex:1,overflow:"auto",padding:"clamp(10px,2vw,16px)"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6,flexWrap:"wrap"}}>
        <div style={{fontFamily:"var(--font-display)",fontWeight:800,fontSize:"clamp(14px,2.5vw,18px)",color:"#F472B6"}}>🌍 Comparateur de Civilisations</div>
        <div style={{fontSize:9,color:"var(--mu)"}}>— La même question vue par 12 civilisations différentes</div>
      </div>
      <div style={{fontSize:9,color:"var(--mu)",marginBottom:14,padding:"8px 12px",background:"rgba(244,114,182,.06)",border:"1px solid rgba(244,114,182,.15)",borderRadius:6}}>
        Chaque IA incarne une civilisation ou époque. Tu poses une question contemporaine et vois comment chaque culture y répondrait selon ses propres valeurs, philosophie et histoire.
      </div>

      {/* Sélection civilisations */}
      <div style={{marginBottom:12}}>
        <div style={{fontSize:8,color:"var(--mu)",fontWeight:700,marginBottom:6}}>CIVILISATIONS (max 6 — {selectedCivs.length}/6 sélectionnées)</div>
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
          {CIVILISATIONS.map(civ => {
            const active = selectedCivs.includes(civ.id);
            const disabled = !active && selectedCivs.length >= 6;
            return (
              <button key={civ.id} onClick={()=>!disabled&&toggleCiv(civ.id)}
                style={{padding:"5px 10px",borderRadius:10,border:"1px solid "+(active?civ.color:"var(--bd)"),background:active?civ.color+"18":"transparent",color:active?civ.color:"var(--mu)",fontSize:8,cursor:disabled?"not-allowed":"pointer",opacity:disabled?0.4:1,transition:"all .15s"}}>
                {civ.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Questions rapides */}
      <div style={{marginBottom:10}}>
        <div style={{fontSize:8,color:"var(--mu)",fontWeight:700,marginBottom:5}}>QUESTIONS UNIVERSELLES</div>
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
          {QUICK_QUESTIONS.map(q=>(
            <button key={q} onClick={()=>setQuestion(q)}
              style={{padding:"4px 9px",borderRadius:8,border:"1px solid var(--bd)",background:"var(--s1)",color:"var(--mu)",fontSize:8,cursor:"pointer"}}>
              {q.slice(0,38)}{q.length>38?"…":""}
            </button>
          ))}
        </div>
      </div>

      <textarea value={question} onChange={e=>setQuestion(e.target.value)}
        placeholder="Ta question universelle…"
        rows={2} style={{width:"100%",background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:8,color:"var(--tx)",fontSize:11,padding:"10px 12px",resize:"vertical",outline:"none",boxSizing:"border-box",marginBottom:10}}/>

      <div style={{display:"flex",gap:8,marginBottom:16,alignItems:"center",flexWrap:"wrap"}}>
        <button onClick={run} disabled={loading||!question.trim()||!activeIds.length||!selectedCivs.length}
          style={{padding:"9px 22px",background:loading?"var(--s2)":"rgba(244,114,182,.15)",border:"1px solid "+(loading?"var(--bd)":"rgba(244,114,182,.4)"),borderRadius:6,color:loading?"var(--mu)":"#F472B6",fontSize:10,cursor:loading?"default":"pointer",fontWeight:700,fontFamily:"var(--font-mono)"}}>
          {loading?"🌍 Consultation des civilisations…":"🌍 Consulter les civilisations"}
        </button>
        {!activeIds.length&&<span style={{fontSize:9,color:"var(--red)"}}>Active des IAs dans Config</span>}
      </div>

      {/* Résultats */}
      {results.length > 0 && (
        <div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:10,marginBottom:16}}>
            {results.map(r=>(
              <div key={r.id} style={{background:"var(--s1)",border:"1px solid "+r.color+"33",borderRadius:10,padding:"12px 14px"}}>
                <div style={{display:"flex",alignItems:"flex-start",gap:8,marginBottom:8}}>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700,fontSize:11,color:r.color}}>{r.label}</div>
                    <div style={{fontSize:7,color:"var(--mu)",fontStyle:"italic"}}>{r.period}</div>
                  </div>
                  {r.iaId&&<span style={{fontSize:7,color:MODEL_DEFS[r.iaId]?.color}}>{MODEL_DEFS[r.iaId]?.icon}</span>}
                </div>
                <div style={{fontSize:9,color:"var(--tx)",lineHeight:1.7}}>{r.output}</div>
              </div>
            ))}
          </div>

          {/* Synthèse */}
          <div style={{background:"var(--s1)",border:"1px solid rgba(244,114,182,.25)",borderRadius:10,padding:"14px 16px"}}>
            {!synthesis && !synthLoading && (
              <button onClick={runSynthesis}
                style={{padding:"8px 20px",background:"rgba(244,114,182,.12)",border:"1px solid rgba(244,114,182,.35)",borderRadius:6,color:"#F472B6",fontSize:10,cursor:"pointer",fontWeight:700}}>
                🔍 Synthèse comparatiste
              </button>
            )}
            {synthLoading && <div style={{fontSize:10,color:"var(--mu)"}}>⏳ Analyse comparative…</div>}
            {synthesis && (
              <>
                <div style={{fontSize:9,color:"#F472B6",fontWeight:700,marginBottom:10}}>🔍 SYNTHÈSE COMPARATISTE</div>
                <div style={{fontSize:10,color:"var(--tx)",lineHeight:1.8,whiteSpace:"pre-wrap"}}>{synthesis}</div>
                <button onClick={()=>navigator.clipboard.writeText(synthesis)} style={{marginTop:10,fontSize:8,padding:"3px 10px",background:"rgba(212,168,83,.1)",border:"1px solid rgba(212,168,83,.3)",borderRadius:4,color:"var(--ac)",cursor:"pointer"}}>📋 Copier</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
