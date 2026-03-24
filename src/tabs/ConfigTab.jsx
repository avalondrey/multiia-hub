import React from 'react';
import PSBlock from '../PSBlock.jsx';
import { useApi } from '../context/ApiContext.jsx';
import { useModels } from '../context/ModelContext.jsx';
import { useUI } from '../context/UIContext.jsx';
import { useConfig } from '../context/ConfigContext.jsx';

/**
 * @typedef {Object} ModelDef
 * @property {string} icon
 * @property {string} short
 * @property {string} name
 * @property {string} desc
 * @property {string} border
 * @property {string} bg
 * @property {string} color
 * @property {string} [keyName]
 * @property {string} [url]
 * @property {boolean} [free]
 * @property {string} [keyLink]
 * @property {string} [provider]
 */

/**
 * @typedef {Object} ConfigTabProps
 * @property {Record<string, string>} [apiKeys]
 * @property {Record<string, string>} [cfgDrafts]
 * @property {function(Record<string, string>): void} [setCfgDrafts]
 * @property {function(string, string?): void} [saveCfgKey]
 * @property {function(): void} [exportKeys]
 * @property {function(): void} [importKeys]
 * @property {React.RefObject<HTMLInputElement>} [fileRef]
 * @property {Record<string, ModelDef>} [MODEL_DEFS]
 * @property {string[]} [IDS]
 * @property {Record<string, boolean>} [enabled]
 * @property {function(string): boolean} [isLimited]
 * @property {function(string): string} [fmtCd]
 * @property {function(string, string): void} [showToast]
 * @property {function(number): void} [saveZoom]
 * @property {number} [uiZoom]
 * @property {object} [pwaPrompt]
 * @property {boolean} [pwaInstalled]
 * @property {function(): void} [installPwa]
 */

export default function ConfigTab() {
  const { apiKeys } = useApi();
  const { MODEL_DEFS, IDS, isLimited, fmtCd } = useModels();
  const { showToast, saveZoom, uiZoom } = useUI();
  const { cfgDrafts, setCfgDrafts, saveCfgKey, exportKeys, importKeys, fileRef, pwaPrompt, pwaInstalled, installPwa } = useConfig();

  return (
    <div className="tab-content" style={{padding:'0 0 80px 0'}}>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14,flexWrap:'wrap'}}>
        <span style={{fontSize:11,fontFamily:"'Syne',sans-serif",fontWeight:800,color:'var(--ac)'}}>⚙️ CONFIGURATION</span>
        <div style={{flex:1}}/>
        <button className="btn-sm" onClick={() => {const a=document.createElement('a');a.href='#config';a.click()}} style={{fontSize:9}}>▲ Haut de page</button>
      </div>

      <div className="sec">
        <div className="sec-title">🔑 Clés API</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:8}}>
          {IDS.map(id => {
            const m = MODEL_DEFS[id];
            return (
              <div key={id} style={{background:'var(--s1)',border:`1px solid ${m.border}`,borderRadius:8,padding:'10px 12px',display:'flex',flexDirection:'column',gap:5}}>
                <div style={{display:'flex',alignItems:'center',gap:5,marginBottom:2}}>
                  <span style={{fontSize:12}}>{m.icon}</span>
                  <span style={{fontSize:10,fontFamily:"'Syne',sans-serif",fontWeight:700,color:m.color}}>{m.short}</span>
                  {m.free && <span className="free-badge">FREE</span>}
                  <div style={{flex:1}}/>
                  <span style={{fontSize:7,color:apiKeys[m.keyName]?'var(--green)':'var(--mu)'}}>{apiKeys[m.keyName]?'✓ Configurée':'✗ Non configurée'}</span>
                </div>
                {m.keyName && (
                  <input
                    type="password"
                    placeholder={`Clé ${m.name}…`}
                    value={cfgDrafts[id] ?? ''}
                    onChange={e => setCfgDrafts(d => ({...d, [id]: e.target.value}))}
                    style={{background:'var(--s2)',border:'1px solid var(--bd)',borderRadius:5,padding:'5px 8px',fontSize:9,color:'var(--tx)',width:'100%',boxSizing:'border-box'}}
                  />
                )}
                <div style={{display:'flex',gap:4}}>
                  <button className="btn-sm" onClick={() => saveCfgKey(id)} disabled={!cfgDrafts[id] || (m.keyName && cfgDrafts[id] === apiKeys[m.keyName])} style={{flex:1,fontSize:9}}>💾 Enregistrer</button>
                  {m.keyName && apiKeys[m.keyName] && (
                    <button className="btn-sm" onClick={() => {setCfgDrafts(d => ({...d, [id]: apiKeys[m.keyName]}))}} style={{flex:1,fontSize:9}}>♻️ Réinjecter</button>
                  )}
                  {m.url && (
                    <a href={m.url} target="_blank" rel="noopener noreferrer" className="btn-sm" style={{flex:1,fontSize:9,textAlign:'center',textDecoration:'none',display:'flex',alignItems:'center',justifyContent:'center'}}>
                      🔗 Obtenir
                    </a>
                  )}
                </div>
                {m.desc && <div style={{fontSize:7,color:'var(--mu)'}}>{m.desc}</div>}
                {isLimited(id) && <div style={{fontSize:7,color:'var(--red)',marginTop:2}}>⏳ Rate-limit: {fmtCd(id)}</div>}
              </div>
            );
          })}
        </div>

        <div style={{display:'flex',gap:8,marginTop:12,flexWrap:'wrap'}}>
          <button className="btn" onClick={exportKeys} style={{fontSize:10}}>📤 Exporter les clés</button>
          <button className="btn" onClick={importKeys} style={{fontSize:10}}>📥 Importer les clés</button>
          <input type="file" ref={fileRef} accept=".json" style={{display:'none'}} onChange={e => {
            const f = e.target.files[0];
            if (!f) return;
            const reader = new FileReader();
            reader.onload = ev => {
              try {
                const keys = JSON.parse(/** @type {string} */ (ev.target.result));
                Object.entries(keys).forEach(([k, v]) => {
                  const id = IDS.find(i => MODEL_DEFS[i].keyName === k);
                  if (id) {
                    setCfgDrafts(d => ({...d, [id]: /** @type {string} */ (v)}));
                    saveCfgKey(id, /** @type {string} */ (v));
                  }
                });
                showToast('Clés importées ✓', 'var(--green)');
              } catch {
                showToast('Fichier invalide', 'var(--red)');
              }
            };
            reader.readAsText(f);
            e.target.value = '';
          }}/>
        </div>
      </div>

      <div className="sec">
        <div className="sec-title">🖥️ Interface</div>
        <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
          <span style={{fontSize:9,color:'var(--mu)'}}>Zoom UI : {Math.round(uiZoom * 100)}%</span>
          <input
            type="range"
            min="0.7"
            max="1.3"
            step="0.05"
            value={uiZoom}
            onChange={e => saveZoom(parseFloat(e.target.value))}
            style={{flex:1,minWidth:120}}
          />
          <button className="btn-sm" onClick={() => saveZoom(1)} style={{fontSize:9}}>↺ Reset</button>
        </div>
      </div>

      <div className="sec">
        <div className="sec-title">📱 PWA</div>
        {!pwaInstalled && pwaPrompt && (
          <div style={{background:'rgba(59,130,246,.08)',border:'1px solid rgba(59,130,246,.25)',borderRadius:8,padding:'12px 14px',marginBottom:10}}>
            <div style={{fontSize:10,fontFamily:"'Syne',sans-serif",fontWeight:700,color:'var(--blue)',marginBottom:6}}>📲 Installer l'application</div>
            <div style={{fontSize:9,color:'var(--mu)',marginBottom:8}}>Installe MultiIA en tant qu'app sur ton appareil pour un accès rapide et hors-ligne.</div>
            <button className="btn" onClick={installPwa} style={{fontSize:10}}>Installer</button>
          </div>
        )}
        {pwaInstalled && (
          <div style={{background:'rgba(74,222,128,.08)',border:'1px solid rgba(74,222,128,.25)',borderRadius:8,padding:'12px 14px',fontSize:9,color:'var(--green)'}}>
            ✓ MultiIA est installé sur cet appareil
          </div>
        )}
      </div>

      <div className="sec">
        <div className="sec-title">📜 Historique des Versions</div>
        {[
          { v:"v11", date:"Fév 2026", color:"#3B82F6", items:[
            "📺 Médias : ajout chaînes YouTube personnalisées (formulaire + couleurs + localStorage)",
            "⭐ Filtre Mes chaînes + badge PERSO + bouton ✕ pour supprimer",
          ]},
          { v:"v10", date:"Jan 2026", color:"#F97316", items:[
            "◀▶ Sidebar historique rétractable",
            "💾 Sauvegarde automatique des conversations (max 50, localStorage)",
            "📂 Chargement/suppression de conversations depuis l'historique",
            "◎ Mode Solo : focalise l'affichage sur une seule IA",
            "⬇ Export conversation en .txt (collable dans d'autres IAs)",
          ]},
          { v:"v9", date:"Déc 2025", color:"#E07FA0", items:[
            "▶ Onglet YouTube : 18 chaînes recommandées (FR + EN) avec filtres",
            "🎬 Vidéos dynamiques (6 thèmes : Tendances, Tutoriels, Modèles, Local, Images, Agents)",
            "🔗 8 raccourcis de recherche YouTube prêts à l'emploi",
          ]},
          { v:"v8", date:"Nov 2025", color:"#34D399", items:[
            "📡 Actualités IA : fallback automatique Gemini → Groq → Mistral → cache statique",
            "💬 Descriptif complet des news + accordéon Analyse/Impact",
            "✓ Affichage du nom de l'IA source utilisée",
          ]},
          { v:"v7", date:"Oct 2025", color:"#FCD34D", items:[
            "⚔ Onglet Arène : tableau comparatif 18 modèles, filtres, scores, actualités, tops/flops",
            "🎨 Onglet Images : 13 générateurs avec jauges qualité/vitesse/facilité",
            "⚙ Config : procédure MAJ PowerShell complète avec blocs copier-coller",
          ]},
          { v:"v6", date:"Sep 2025", color:"#94A3B8", items:[
            "📱 Responsive & mobile : colonnes → onglets swipables",
            "🌐 Onglet Web IAs : 12 IAs (ChatGPT, Claude.ai, Gemini, DeepSeek, Mistral, Copilot…)",
            "⏳ Détection rate-limit : blocage + countdown automatique + bouton Débloquer",
            "🔄 Débat : fallback synthèse sur l'IA disponible si Claude KO",
          ]},
          { v:"v5", date:"Août 2025", color:"#FF8C69", items:[
            "🆕 3 nouvelles IAs : DeepSeek V3, Mistral Small, Groq/Llama 3.3 (gratuit 14 400/jour)",
            "✎ Correcteur orthographique : popup diff original/corrigé avec Appliquer/Ignorer",
          ]},
          { v:"v4", date:"Juil 2025", color:"#F87171", items:[
            "⚙ Onglet Config complet : tableau modèles, champs clés, liens obtenir",
            "💾 Export/Import fichier multiia-keys.json",
            "⚡ Mode Débat 3 phases : Tour 1, Tour 2 (réfutation), Synthèse finale",
            "IAs ajoutées : DeepSeek, Mistral, Groq (FREE)",
          ]},
          { v:"v2–v3", date:"Juin 2025", color:"#A78BFA", items:[
            "Nouvelles IAs : Kimi (Moonshot), Qwen (Alibaba), Grok (xAI)",
            "Clés API multi-providers configurables",
          ]},
          { v:"v1", date:"Mai 2025", color:"#4ADE80", items:[
            "🚀 Lancement Multi-IA Hub",
            "Compteur de tokens avec barre de progression par IA",
            "Onglet IAs Web : Z.ai, Kimi, Qwen, Grok",
            "Chat parallèle multi-IA (Claude, Gemini, GPT)",
          ]},
        ].map(entry=>(
          <div key={entry.v} style={{background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:6,padding:"8px 12px",marginBottom:8}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
              <span style={{background:entry.color+"22",border:"1px solid "+entry.color+"44",borderRadius:4,padding:"2px 8px",fontSize:9,fontWeight:700,color:entry.color,fontFamily:"'Syne',sans-serif"}}>{entry.v}</span>
              <span style={{fontSize:9,color:"var(--mu)"}}>{entry.date}</span>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:2}}>
              {entry.items.map((item,i)=>(
                <div key={i} style={{fontSize:9,color:"var(--mu)",fontFamily:"'IBM Plex Mono',monospace",paddingLeft:8,borderLeft:"2px solid "+entry.color+"33"}}>{item}</div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="sec">
        <div className="sec-title">🔄 Procédure de Mise à Jour — Copier-Coller PowerShell</div>
        <div className="cfg-note" style={{marginBottom:12}}>
          ⚠️ <strong>ÉTAPE 0 obligatoire</strong> : Exporte tes clés (bouton ci-dessus) avant de commencer.
        </div>

        <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:10,color:"var(--ac)",margin:"12px 0 6px",letterSpacing:.5}}>ÉTAPE 1 — Aller dans le dossier du projet</div>
        <PSBlock title="Navigation" comment="Remplace 'Administrateur' par ton nom d'utilisateur si différent" code={`cd C:\\Users\\Administrateur\\multiia-app`}/>

        <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:10,color:"var(--ac)",margin:"12px 0 6px",letterSpacing:.5}}>ÉTAPE 2 — Remplacer le fichier App.jsx</div>
        <div className="cfg-note" style={{marginBottom:6}}>💡 Télécharge d'abord le nouveau <strong>multi-ai-hub.jsx</strong> depuis Claude dans ton dossier Téléchargements.</div>
        <PSBlock title="Remplacement du fichier" comment="Copie le nouveau fichier jsx vers src/App.jsx" code={`copy C:\\Users\\Administrateur\\Downloads\\multi-ai-hub.jsx src\\App.jsx`}/>
        <div className="cfg-note" style={{marginBottom:6}}>Si tu as téléchargé sous un autre nom, adapte le chemin :</div>
        <PSBlock title="Vérifier quel fichier jsx est dans Téléchargements" comment="Cherche tous les fichiers jsx dans Downloads" code={`dir C:\\Users\\Administrateur\\Downloads\\*.jsx`}/>

        <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:10,color:"var(--ac)",margin:"12px 0 6px",letterSpacing:.5}}>ÉTAPE 3 — Reconstruire l'application</div>
        <PSBlock title="Build de production" comment="Reconstruit l'app optimisée pour le .bat (prend 10-30 secondes)" code={`npm run build`}/>
        <div className="cfg-note" style={{marginBottom:6}}>Tu dois voir <code>✓ built in X.XXs</code> à la fin. Si erreur → relis le message d'erreur et copie-le à Claude.</div>

        <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:10,color:"var(--ac)",margin:"12px 0 6px",letterSpacing:.5}}>ÉTAPE 4 — Mettre à jour le dossier portable (ZIP)</div>
        <div className="cfg-note" style={{marginBottom:6}}>Copie les nouveaux fichiers compilés dans ton dossier portable sur le bureau :</div>
        <PSBlock title="Mise à jour du dossier portable" comment="Copie le dossier dist/ compilé vers ton portable sur le bureau" code={`xcopy /E /Y dist\\* C:\\Users\\Administrateur\\Desktop\\MultiIA-Portable\\portable\\dist\\`}/>

        <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:10,color:"var(--ac)",margin:"12px 0 6px",letterSpacing:.5}}>ÉTAPE 5 — Tester</div>
        <PSBlock title="Lancement du serveur local pour test" comment="Lance en local pour vérifier avant de fermer l'ancienne version" code={`npm run dev`}/>
        <div className="cfg-note" style={{marginBottom:6}}>Ouvre <code>http://localhost:5173</code> dans ton navigateur. Vérifie que tout marche. Ensuite ferme avec <code>Ctrl+C</code>.</div>

        <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:10,color:"var(--ac)",margin:"12px 0 6px",letterSpacing:.5}}>ÉTAPE 6 — Réimporter tes clés</div>
        <div className="cfg-note">
          Ouvre l'app (via <code>MultiIA.bat</code> sur le bureau) → onglet <strong>Config</strong> → bouton <strong>Importer les clés</strong> → sélectionne ton <code>multiia-keys.json</code> sauvegardé à l'étape 0. ✓
        </div>

        <div style={{margin:"14px 0 6px",padding:"10px 14px",background:"rgba(74,222,128,.05)",border:"1px solid rgba(74,222,128,.2)",borderRadius:7}}>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:10,color:"var(--green)",marginBottom:6}}>✦ RÉSUMÉ RAPIDE — Toutes les commandes en une fois</div>
          <PSBlock title="Copier-coller intégral (remplace le nom d'utilisateur)" comment="Exécute ces 3 commandes dans l'ordre dans PowerShell" code={`cd C:\\Users\\Administrateur\\multiia-app\ncopy C:\\Users\\Administrateur\\Downloads\\multi-ai-hub.jsx src\\App.jsx\nnpm run build\nxcopy /E /Y dist\\* C:\\Users\\Administrateur\\Desktop\\MultiIA-Portable\\portable\\dist\\`}/>
        </div>
      </div>

      <div className="sec">
        <div className="sec-title">📊 État des connexions</div>
        <div className="status-cards">
          {IDS.map(id => { const m=MODEL_DEFS[id]; const ok=!m.keyName||apiKeys[m.keyName]; const lim=isLimited(id); return(
            <div key={id} className="sc" style={{borderColor:lim?"var(--red)":ok?m.border:"var(--bd)",background:lim?"rgba(248,113,113,.05)":ok?`${m.bg}44`:"var(--s1)"}}>
              <div style={{display:"flex",alignItems:"center",gap:3,marginBottom:2}}>
                <span style={{color:lim?"var(--red)":m.color}}>{m.icon}</span>
                <span style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:9,color:lim?"var(--red)":m.color}}>{m.short}</span>
                {m.free&&!lim&&<span className="free-badge">FREE</span>}
              </div>
              <div style={{fontSize:8,color:lim?"var(--red)":ok?"var(--green)":"var(--mu)"}}>{lim?`⏳ ${fmtCd(id)}`:!m.keyName?"✦ Intégré":ok?"✓ Clé OK":"✗ Manquante"}</div>
              <div style={{fontSize:7,color:"var(--mu)",marginTop:1}}>{m.desc}</div>
            </div>
          );})}
        </div>
      </div>
    </div>
  );
}
