import React from 'react';
import { MODEL_DEFS } from '../config/models.js';

// ── TF-IDF léger en mémoire ──────────────────────────────────
function tokenize(text) {
  return text.toLowerCase().replace(/[^a-zA-ZÀ-ÿ\s]/g,' ')
    .split(/\s+/).filter(w => w.length > 2);
}
function tfidf(docs, query) {
  const N = docs.length;
  if (!N) return [];
  const qTokens = new Set(tokenize(query));
  return docs.map((doc, i) => {
    const tokens = tokenize(doc.text);
    const total  = tokens.length || 1;
    let score = 0;
    qTokens.forEach(qt => {
      const tf  = tokens.filter(t => t === qt).length / total;
      const df  = docs.filter(d => tokenize(d.text).includes(qt)).length;
      const idf = df > 0 ? Math.log((N + 1) / (df + 1)) + 1 : 0;
      score += tf * idf;
    });
    return { ...doc, score };
  }).filter(d => d.score > 0).sort((a,b) => b.score - a.score);
}

const STORE_KEY = 'multiia_ltm';

export default function LongTermMemoryTab({ savedConvs, setChatInput, navigateTab }) {
  const [query,      setQuery]      = React.useState('');
  const [results,    setResults]    = React.useState([]);
  const [searched,   setSearched]   = React.useState(false);
  const [autoInject, setAutoInject] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem('multiia_ltm_auto')||'false'); } catch { return false; }
  });
  const [indexStats, setIndexStats] = React.useState(null);

  // Construit l'index depuis savedConvs
  const buildIndex = React.useCallback(() => {
    const docs = [];
    (savedConvs || []).forEach(conv => {
      // Extrait tous les messages user de cette conversation
      const allMsgs = Object.values(conv.conversations || {}).flat();
      const userMsgs = allMsgs.filter(m => m.role === 'user').map(m => m.content).join(' ');
      const asstMsgs = allMsgs.filter(m => m.role === 'assistant').slice(0,3).map(m => m.content).join(' ');
      if (userMsgs.length > 20) {
        docs.push({
          id:      conv.id,
          title:   conv.title || 'Sans titre',
          date:    conv.date  || '',
          ias:     (conv.ias  || []).map(id => MODEL_DEFS[id]?.short || id).join(', '),
          text:    userMsgs + ' ' + asstMsgs,
          preview: userMsgs.slice(0, 200),
          msgCount: allMsgs.length,
        });
      }
    });
    return docs;
  }, [savedConvs]);

  React.useEffect(() => {
    const docs = buildIndex();
    setIndexStats({ total: docs.length, convs: savedConvs?.length || 0 });
  }, [savedConvs, buildIndex]);

  const search = () => {
    if (!query.trim()) return;
    const docs = buildIndex();
    const res  = tfidf(docs, query).slice(0, 8);
    setResults(res);
    setSearched(true);
  };

  const injectContext = (docs) => {
    const ctx = docs.slice(0,3).map(d =>
      `[Conversation : "${d.title}" — ${d.date}]\n${d.preview}`
    ).join('\n\n---\n\n');
    setChatInput(`Contexte de conversations précédentes :\n${ctx}\n\n`);
    navigateTab('chat');
  };

  const toggleAuto = () => {
    const next = !autoInject;
    setAutoInject(next);
    localStorage.setItem('multiia_ltm_auto', JSON.stringify(next));
  };

  return (
    <div style={{flex:1,overflow:'auto',padding:'clamp(10px,2vw,16px)'}}>
      {/* Header */}
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:6,flexWrap:'wrap'}}>
        <div style={{fontFamily:'var(--font-display)',fontWeight:800,fontSize:'clamp(14px,2.5vw,18px)',color:'#34D399'}}>🧠 Mémoire Long Terme</div>
        <div style={{fontSize:9,color:'var(--mu)'}}>— Recherche sémantique TF-IDF dans toutes tes conversations</div>
      </div>
      <div style={{fontSize:9,color:'var(--mu)',marginBottom:14,padding:'8px 12px',background:'rgba(52,211,153,.06)',border:'1px solid rgba(52,211,153,.15)',borderRadius:6}}>
        Retrouve n'importe quelle conversation passée par thème ou sujet. Injecte les plus pertinentes en contexte dans le Chat pour que l'IA se souvienne de tes projets.
      </div>

      {/* Stats index */}
      {indexStats && (
        <div style={{display:'flex',gap:8,marginBottom:14,flexWrap:'wrap'}}>
          {[
            ['💬', indexStats.total, 'Conversations indexées'],
            ['📊', savedConvs?.length||0, 'Total conversations'],
            ['🔍', 'TF-IDF', 'Moteur de recherche'],
          ].map(([ico,val,lbl]) => (
            <div key={lbl} style={{flex:1,minWidth:100,padding:'10px',background:'var(--s1)',border:'1px solid var(--bd)',borderRadius:8,textAlign:'center'}}>
              <div style={{fontSize:18}}>{ico}</div>
              <div style={{fontSize:15,fontWeight:900,color:'var(--green)',fontFamily:'var(--font-display)'}}>{val}</div>
              <div style={{fontSize:8,color:'var(--mu)'}}>{lbl}</div>
            </div>
          ))}
        </div>
      )}

      {/* Auto-inject toggle */}
      <div style={{marginBottom:14,padding:'10px 14px',background:'var(--s1)',border:'1px solid var(--bd)',borderRadius:8,display:'flex',alignItems:'center',gap:12}}>
        <div style={{flex:1}}>
          <div style={{fontSize:10,fontWeight:700,color:'var(--tx)',marginBottom:2}}>🔗 Injection automatique</div>
          <div style={{fontSize:9,color:'var(--mu)'}}>Quand activé, les 3 conversations les plus pertinentes sont injectées dans le Chat à chaque recherche.</div>
        </div>
        <button onClick={toggleAuto}
          style={{padding:'5px 14px',borderRadius:20,border:'1px solid '+(autoInject?'rgba(52,211,153,.5)':'var(--bd)'),background:autoInject?'rgba(52,211,153,.12)':'transparent',color:autoInject?'var(--green)':'var(--mu)',fontSize:9,cursor:'pointer',fontWeight:700,transition:'all .2s'}}>
          {autoInject ? '● Actif' : '○ Inactif'}
        </button>
      </div>

      {/* Barre de recherche */}
      <div style={{display:'flex',gap:8,marginBottom:14}}>
        <input value={query} onChange={e=>setQuery(e.target.value)}
          onKeyDown={e=>{if(e.key==='Enter')search();}}
          placeholder='Recherche dans tes conversations… (ex: "React hooks", "planning RH", "prompt engineering")'
          style={{flex:1,background:'var(--s2)',border:'1px solid var(--bd)',borderRadius:8,color:'var(--tx)',fontSize:11,padding:'10px 14px',outline:'none'}}/>
        <button onClick={search} disabled={!query.trim()||(indexStats?.total||0)===0}
          style={{padding:'10px 20px',background:'rgba(52,211,153,.15)',border:'1px solid rgba(52,211,153,.4)',borderRadius:8,color:'var(--green)',fontSize:10,cursor:'pointer',fontWeight:700}}>
          🔍 Rechercher
        </button>
      </div>

      {/* Résultats */}
      {searched && results.length === 0 && (
        <div style={{textAlign:'center',padding:32,color:'var(--mu)',fontSize:10}}>
          Aucune conversation trouvée pour "{query}"
        </div>
      )}

      {results.length > 0 && (
        <div>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10,flexWrap:'wrap'}}>
            <span style={{fontSize:9,color:'var(--mu)'}}>{results.length} résultats · classés par pertinence</span>
            <button onClick={()=>injectContext(results)}
              style={{fontSize:9,padding:'4px 12px',background:'rgba(52,211,153,.12)',border:'1px solid rgba(52,211,153,.3)',borderRadius:5,color:'var(--green)',cursor:'pointer',fontWeight:700}}>
              → Injecter top 3 dans le Chat
            </button>
          </div>

          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {results.map((r, i) => {
              const pct = Math.min(100, Math.round((r.score / (results[0].score || 1)) * 100));
              return (
                <div key={r.id} style={{background:'var(--s1)',border:'1px solid '+(i<3?'rgba(52,211,153,.3)':'var(--bd)'),borderRadius:8,padding:'12px 14px'}}>
                  <div style={{display:'flex',alignItems:'flex-start',gap:10,marginBottom:6,flexWrap:'wrap'}}>
                    <div style={{flex:1}}>
                      <div style={{fontSize:10,fontWeight:700,color:'var(--tx)',marginBottom:2}}>
                        {i<3&&<span style={{fontSize:8,padding:'1px 5px',borderRadius:4,background:'rgba(52,211,153,.12)',color:'var(--green)',marginRight:5}}>#{i+1}</span>}
                        {r.title}
                      </div>
                      <div style={{fontSize:8,color:'var(--mu)'}}>{r.date} · {r.ias} · {r.msgCount} msgs</div>
                    </div>
                    <div style={{textAlign:'right',flexShrink:0}}>
                      <div style={{fontSize:10,fontWeight:700,color:'var(--green)'}}>{pct}%</div>
                      <div style={{width:50,height:3,background:'var(--bd)',borderRadius:2,marginTop:3}}>
                        <div style={{width:pct+'%',height:'100%',background:'var(--green)',borderRadius:2}}/>
                      </div>
                    </div>
                  </div>
                  <div style={{fontSize:9,color:'var(--mu)',lineHeight:1.5,marginBottom:8}}>{r.preview}</div>
                  <button onClick={()=>injectContext([r])}
                    style={{fontSize:8,padding:'3px 10px',background:'rgba(212,168,83,.1)',border:'1px solid rgba(212,168,83,.3)',borderRadius:4,color:'var(--ac)',cursor:'pointer'}}>
                    → Injecter dans le Chat
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Aide si pas de conversations */}
      {(indexStats?.total||0) === 0 && (
        <div style={{textAlign:'center',padding:'40px 20px',color:'var(--mu)'}}>
          <div style={{fontSize:32,marginBottom:10}}>💭</div>
          <div style={{fontSize:12,fontWeight:700,color:'var(--tx)',marginBottom:6}}>Aucune conversation indexée</div>
          <div style={{fontSize:10,maxWidth:300,margin:'0 auto'}}>
            Utilise le Chat et sauvegarde des conversations (icône 💾 dans l'historique). Elles apparaîtront ici pour la recherche sémantique.
          </div>
        </div>
      )}
    </div>
  );
}
