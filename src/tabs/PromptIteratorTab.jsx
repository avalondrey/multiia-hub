import React from 'react';
import { MODEL_DEFS } from '../config/models.js';
import { callModel } from '../api/ai-service.js';

const ANGLES = [
  { id:'precise',  icon:'🎯', label:'Ultra-précis',    color:'#60A5FA', instruction:'Reformule ce prompt en étant beaucoup plus précis et spécifique. Ajoute des contraintes claires sur le format, la longueur, le style attendu.' },
  { id:'simple',   icon:'✂️', label:'Simplifié',        color:'#4ADE80', instruction:'Reformule ce prompt de façon plus courte et directe. Supprime tout ce qui est superflu. Va à l\'essentiel en 1-2 phrases max.' },
  { id:'expert',   icon:'🧠', label:'Rôle Expert',      color:'#A78BFA', instruction:'Reformule ce prompt en assignant un rôle expert précis à l\'IA (ex: "Tu es un expert en X avec 20 ans d\'expérience..."). Définit clairement l\'expertise requise.' },
  { id:'example',  icon:'📎', label:'Avec exemple',     color:'#F59E0B', instruction:'Reformule ce prompt en ajoutant un exemple concret de ce que tu attends (format, style, contenu). Montre à l\'IA ce que "bon" veut dire.' },
  { id:'chain',    icon:'🔗', label:'Chaîne de pensée', color:'#F87171', instruction:'Reformule ce prompt pour forcer l\'IA à raisonner étape par étape avant de répondre. Ajoute des instructions pour décomposer le problème.' },
];

export default function PromptIteratorTab({ enabled, apiKeys, setChatInput, navigateTab }) {
  const [origPrompt, setOrigPrompt]   = React.useState('');
  const [badResponse, setBadResponse] = React.useState('');
  const [phase, setPhase]             = React.useState('input'); // input | generating | results
  const [variants, setVariants]       = React.useState([]);      // [{angle, newPrompt, responses:{id:text}, loading}]
  const [votes, setVotes]             = React.useState({});      // {angleId: count}
  const [winner, setWinner]           = React.useState(null);
  const [generating, setGenerating]   = React.useState(false);

  const activeIds = Object.keys(MODEL_DEFS).filter(id => enabled[id] && !MODEL_DEFS[id]?.serial);
  const planner   = activeIds.find(id => ['groq','mistral','cerebras'].includes(id)) || activeIds[0];

  // ── Étape 1 : génère les 5 reformulations ──────────────────
  const generateVariants = async () => {
    if (!origPrompt.trim() || !planner) return;
    setGenerating(true);
    setPhase('generating');
    setVariants([]);
    setVotes({});
    setWinner(null);

    const contextBad = badResponse.trim()
      ? `\n\nLa réponse actuelle à améliorer :\n"""\n${badResponse.slice(0, 800)}\n"""`
      : '';

    const reformulations = await Promise.all(ANGLES.map(async angle => {
      const prompt = `Tu es un expert en prompt engineering.

Prompt original :
"""
${origPrompt.slice(0, 600)}
"""${contextBad}

Ta mission : ${angle.instruction}

Réponds UNIQUEMENT avec le nouveau prompt reformulé, sans explication ni commentaire autour.`;
      try {
        const newPrompt = await callModel(planner, [{role:'user', content:prompt}], apiKeys, 'Expert prompt engineering. Réponds uniquement avec le prompt reformulé.');
        return { angle, newPrompt: newPrompt.trim(), responses:{}, loading:{}, done:false };
      } catch(e) {
        return { angle, newPrompt:`❌ ${e.message}`, responses:{}, loading:{}, done:false };
      }
    }));

    setVariants(reformulations);
    setPhase('results');
    setGenerating(false);

    // ── Étape 2 : envoie chaque reformulation à toutes les IAs ──
    runAllVariants(reformulations);
  };

  const runAllVariants = async (reformulations) => {
    for (let vi = 0; vi < reformulations.length; vi++) {
      const v = reformulations[vi];
      if (v.newPrompt.startsWith('❌')) continue;

      // Lance toutes les IAs en parallèle pour cette variante
      await Promise.all(activeIds.slice(0, 3).map(async id => {
        setVariants(prev => prev.map((x, i) => i===vi ? {...x, loading:{...x.loading,[id]:true}} : x));
        try {
          const res = await callModel(id, [{role:'user', content:v.newPrompt}], apiKeys);
          setVariants(prev => prev.map((x, i) => i===vi ? {
            ...x,
            responses:{...x.responses,[id]:res},
            loading:{...x.loading,[id]:false}
          } : x));
        } catch(e) {
          setVariants(prev => prev.map((x, i) => i===vi ? {
            ...x,
            responses:{...x.responses,[id]:`❌ ${e.message}`},
            loading:{...x.loading,[id]:false}
          } : x));
        }
      }));
      setVariants(prev => prev.map((x, i) => i===vi ? {...x, done:true} : x));
    }
  };

  const vote = (angleId) => {
    const newVotes = {...votes, [angleId]:(votes[angleId]||0)+1};
    setVotes(newVotes);
    const top = Object.entries(newVotes).sort(([,a],[,b])=>b-a)[0];
    setWinner(top[0]);
  };

  const usePrompt = (prompt) => {
    setChatInput(prompt);
    navigateTab('chat');
  };

  return (
    <div style={{flex:1,overflow:'auto',padding:'clamp(10px,2vw,16px)'}}>
      {/* Header */}
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:6,flexWrap:'wrap'}}>
        <div style={{fontFamily:'var(--font-display)',fontWeight:800,fontSize:'clamp(14px,2.5vw,18px)',color:'#F59E0B'}}>🔁 Itérateur de Prompt</div>
        <div style={{fontSize:9,color:'var(--mu)'}}>— 5 reformulations générées + testées en parallèle · vote pour la meilleure</div>
      </div>
      <div style={{fontSize:9,color:'var(--mu)',marginBottom:14,padding:'8px 12px',background:'rgba(245,158,11,.06)',border:'1px solid rgba(245,158,11,.15)',borderRadius:6}}>
        Colle un prompt qui donne de mauvaises réponses. L'app génère <strong style={{color:'var(--tx)'}}>5 reformulations</strong> (précis, simplifié, rôle expert, avec exemple, chaîne de pensée) et les teste sur tes IAs. Tu votes pour la meilleure.
      </div>

      {/* Formulaire */}
      {(phase === 'input' || phase === 'results') && (
        <div style={{marginBottom:16}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
            <div>
              <div style={{fontSize:8,color:'var(--ac)',fontWeight:700,marginBottom:5}}>PROMPT À AMÉLIORER *</div>
              <textarea value={origPrompt} onChange={e=>setOrigPrompt(e.target.value)}
                placeholder='Colle le prompt qui ne donne pas satisfaction...'
                rows={4} style={{width:'100%',background:'var(--s2)',border:'1px solid rgba(245,158,11,.3)',borderRadius:6,color:'var(--tx)',fontSize:10,padding:'8px 10px',resize:'vertical',outline:'none',boxSizing:'border-box'}}/>
            </div>
            <div>
              <div style={{fontSize:8,color:'var(--mu)',fontWeight:700,marginBottom:5}}>MAUVAISE RÉPONSE (optionnel — aide à mieux reformuler)</div>
              <textarea value={badResponse} onChange={e=>setBadResponse(e.target.value)}
                placeholder='Colle la réponse décevante pour que l'IA comprenne ce qui cloche...'
                rows={4} style={{width:'100%',background:'var(--s2)',border:'1px solid var(--bd)',borderRadius:6,color:'var(--tx)',fontSize:10,padding:'8px 10px',resize:'vertical',outline:'none',boxSizing:'border-box'}}/>
            </div>
          </div>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <button onClick={generateVariants} disabled={generating||!origPrompt.trim()||!planner}
              style={{padding:'9px 22px',background:generating?'var(--s2)':'rgba(245,158,11,.15)',border:'1px solid '+(generating?'var(--bd)':'rgba(245,158,11,.4)'),borderRadius:6,color:generating?'var(--mu)':'#F59E0B',fontSize:10,cursor:generating?'default':'pointer',fontWeight:700,fontFamily:'var(--font-mono)'}}>
              {generating?'🔁 Génération…':'🔁 Générer 5 reformulations'}
            </button>
            {!planner && <span style={{fontSize:9,color:'var(--red)'}}>Active au moins une IA dans Config</span>}
            {phase==='results' && <span style={{fontSize:9,color:'var(--mu)'}}>↓ Résultats ci-dessous</span>}
          </div>
        </div>
      )}

      {/* Phase génération */}
      {phase === 'generating' && (
        <div style={{textAlign:'center',padding:'40px 20px'}}>
          <div style={{fontSize:32,marginBottom:10,display:'inline-block',animation:'spin 1.5s linear infinite'}}>🔁</div>
          <div style={{fontSize:11,color:'var(--mu)'}}>Génération des 5 reformulations par {MODEL_DEFS[planner]?.short}…</div>
        </div>
      )}

      {/* Résultats */}
      {phase === 'results' && variants.length > 0 && (
        <div>
          {/* Gagnant */}
          {winner && (
            <div style={{marginBottom:16,padding:'12px 16px',background:'rgba(245,158,11,.08)',border:'2px solid rgba(245,158,11,.4)',borderRadius:10,display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}}>
              <span style={{fontSize:24}}>🏆</span>
              <div style={{flex:1}}>
                <div style={{fontSize:9,color:'#F59E0B',fontWeight:700,marginBottom:2}}>REFORMULATION GAGNANTE ({Object.values(votes).reduce((a,b)=>a+b,0)} votes)</div>
                <div style={{fontSize:11,color:'var(--tx)',fontWeight:600}}>{ANGLES.find(a=>a.id===winner)?.icon} {ANGLES.find(a=>a.id===winner)?.label}</div>
              </div>
              <button onClick={()=>usePrompt(variants.find(v=>v.angle.id===winner)?.newPrompt||'')}
                style={{padding:'8px 18px',background:'rgba(245,158,11,.2)',border:'1px solid rgba(245,158,11,.5)',borderRadius:6,color:'#F59E0B',fontSize:10,cursor:'pointer',fontWeight:700}}>
                → Utiliser dans le Chat
              </button>
            </div>
          )}

          {/* Grille des variantes */}
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            {variants.map((v, vi) => {
              const isWinner = winner === v.angle.id;
              const voteCount = votes[v.angle.id] || 0;
              return (
                <div key={v.angle.id} style={{background:'var(--s1)',border:`2px solid ${isWinner?v.angle.color+'88':'var(--bd)'}`,borderRadius:10,overflow:'hidden',transition:'border-color .3s'}}>
                  {/* Header variante */}
                  <div style={{padding:'10px 14px',borderBottom:'1px solid var(--bd)',display:'flex',alignItems:'center',gap:10,background:isWinner?v.angle.color+'0A':'transparent',flexWrap:'wrap'}}>
                    <span style={{fontSize:20}}>{v.angle.icon}</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:11,fontWeight:700,color:v.angle.color}}>{v.angle.label}</div>
                      <div style={{fontSize:8,color:'var(--mu)',lineHeight:1.4}}>{v.angle.instruction.slice(0,80)}…</div>
                    </div>
                    {voteCount > 0 && <div style={{fontSize:12,color:v.angle.color,fontWeight:900}}>{voteCount} ★</div>}
                    <div style={{display:'flex',gap:6'}}>
                      <button onClick={()=>vote(v.angle.id)}
                        style={{padding:'5px 12px',background:v.angle.color+'22',border:'1px solid '+v.angle.color+'55',borderRadius:6,color:v.angle.color,fontSize:9,cursor:'pointer',fontWeight:700}}>
                        ★ Voter
                      </button>
                      <button onClick={()=>usePrompt(v.newPrompt)}
                        style={{padding:'5px 10px',background:'rgba(212,168,83,.1)',border:'1px solid rgba(212,168,83,.3)',borderRadius:6,color:'var(--ac)',fontSize:9,cursor:'pointer'}}>
                        → Chat
                      </button>
                    </div>
                  </div>

                  {/* Nouveau prompt */}
                  <div style={{padding:'10px 14px',borderBottom:'1px solid var(--bd)',background:'var(--s2)'}}>
                    <div style={{fontSize:7,color:v.angle.color,fontWeight:700,marginBottom:4}}>NOUVEAU PROMPT</div>
                    <div style={{fontSize:9,color:'var(--tx)',lineHeight:1.6,fontStyle:'italic'}}>
                      {v.newPrompt.startsWith('❌') ? <span style={{color:'var(--red)'}}>{v.newPrompt}</span> : `"${v.newPrompt.slice(0,250)}${v.newPrompt.length>250?'…':''}"` }
                    </div>
                  </div>

                  {/* Réponses IAs */}
                  <div style={{display:'grid',gridTemplateColumns:`repeat(${Math.min(activeIds.slice(0,3).length,3)},1fr)`,gap:0}}>
                    {activeIds.slice(0,3).map((id,ii) => {
                      const m = MODEL_DEFS[id];
                      const res = v.responses[id];
                      const isLoad = v.loading[id];
                      return (
                        <div key={id} style={{padding:'10px 12px',borderRight:ii<2?'1px solid var(--bd)':'none'}}>
                          <div style={{fontSize:8,color:m.color,fontWeight:700,marginBottom:5,display:'flex',alignItems:'center',gap:4}}>
                            {m.icon} {m.short}
                            {isLoad && <span style={{animation:'spin 1s linear infinite',display:'inline-block',fontSize:10}}>⟳</span>}
                          </div>
                          {res
                            ? <div style={{fontSize:9,color:'var(--tx)',lineHeight:1.6,maxHeight:100,overflow:'auto'}}>{res.slice(0,300)}{res.length>300?'…':''}</div>
                            : <div style={{fontSize:9,color:'var(--bd)'}}>{isLoad?'…':'—'}</div>
                          }
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
