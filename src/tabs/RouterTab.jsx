import React, { useState, useRef } from "react";
import { useApi } from "../context/ApiContext.jsx";
import { useModels } from "../context/ModelContext.jsx";
import { useNav } from "../context/NavContext.jsx";
import { useUI } from "../context/UIContext.jsx";
import { useRouter } from "../context/RouterContext.jsx";
import { useChat } from "../context/ChatContext.jsx";

// ── Smart Router ───────────────────────────────────────────────
const ROUTER_ROUTES = [
  { id:"chat",       icon:"◈", label:"Chat IA",       desc:"Poser des questions, discuter du contenu",      color:"#74C98C" },
  { id:"debate",     icon:"⚡", label:"Débat / Analyse", desc:"Analyse multi-IAs sous plusieurs angles",    color:"#F59E0B" },
  { id:"redaction",  icon:"✍️", label:"Rédaction",        desc:"Réécrire, corriger, améliorer le texte",    color:"#60A5FA" },
  { id:"recherche",  icon:"🔎", label:"Recherche",        desc:"Questions de recherche sur ce contenu",    color:"#34D399" },
  { id:"workflows",  icon:"🔀", label:"Workflow",         desc:"Chaîner des traitements automatiques",      color:"#F97316" },
  { id:"comfyui",    icon:"⬡", label:"ComfyUI",          desc:"Générer/modifier des images avec ComfyUI", color:"#A78BFA" },
  { id:"rag",        icon:"📄", label:"RAG Contextuel",   desc:"Indexer le document pour Q&A intelligent",  color:"#D4A853" },
  { id:"canvas",     icon:"🎨", label:"Canvas Exécution", desc:"Exécuter/visualiser le code HTML/SVG/JS", color:"#F472B6" },
];

const ROUTER_MAX_SIZE = 15 * 1024 * 1024; // 15MB

export default function RouterTab() {
  const { enabled, apiKeys } = useApi();
  const { MODEL_DEFS, IDS, isLimited } = useModels();
  const { navigateTab } = useNav();
  const { showToast } = useUI();
  const { chatInput, setChatInput } = useChat();
  const {
    callModel, setDebInput, setDebFile,
    setComfyPrompt, setComfySubTab, comfyConnected, generateComfy,
    processRagText, ragChunks,
    setRedInput, setRechercheInput,
  } = useRouter();

  const [routerFile, setRouterFile]           = useState(null);
  const [routerAnalysis, setRouterAnalysis]   = useState(null);
  const [routerAnalyzing, setRouterAnalyzing] = useState(false);
  const [routerSelected, setRouterSelected]   = useState(null);
  const [routerLaunching, setRouterLaunching] = useState(false);
  const [routerDone, setRouterDone]           = useState(false);
  const [routerQuestion, setRouterQuestion]   = useState("");
  const routerFileRef = useRef(null);

  const loadRouterFile = async (file) => {
    if (!file) return;
    if (file.size > ROUTER_MAX_SIZE) { showToast("Fichier trop volumineux (max 15 MB)"); return; }
    const ext = file.name.split(".").pop()?.toLowerCase()||"";
    const ALLOWED = new Set(["pdf","txt","md","csv","json","js","jsx","ts","tsx","py","html","css","sql","xml","jpg","jpeg","png","gif","webp","svg","docx","doc","zip"]);
    if (!ALLOWED.has(ext)) { showToast("Format non supporté : ."+ext); return; }

    setRouterFile(null); setRouterAnalysis(null); setRouterSelected(null); setRouterDone(false);
    showToast("⏳ Chargement…");

    const isImage = file.type.startsWith("image/");
    const sizeKB = Math.round(file.size/1024);
    let content = "";
    let base64 = "";
    let icon = "📄";

    if (isImage) {
      icon = "🖼";
      base64 = await new Promise((res,rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result.split(",")[1]);
        r.onerror = rej;
        r.readAsDataURL(file);
      });
    } else if (ext === "pdf") {
      icon = "📕";
      const raw = await new Promise((res,rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result);
        r.onerror = rej;
        r.readAsBinaryString(file);
      });
      try {
        const matches = raw.match(/[ -~À-ÿ]{4,}/g)||[];
        content = matches.filter(s=>/[a-zA-ZÀ-ÿ]{3,}/.test(s)).join(" ").slice(0,10000);
      } catch { content = "[PDF — extraction basique]"; }
    } else {
      try {
        content = (await file.text()).slice(0,12000);
        if (["js","jsx","ts","tsx","py","html","css","sql"].includes(ext)) icon="💻";
        if (["json","csv"].includes(ext)) icon="📊";
        if (ext==="md") icon="📝";
      } catch { content = "[Fichier binaire]"; }
    }

    setRouterFile({ name:file.name, type:isImage?"image":"text", ext, content, base64, mimeType:file.type, icon, sizeKB });
    showToast("✓ Fichier chargé — clique Analyser");
  };

  const analyzeRouterFile = async () => {
    if (!routerFile) return;
    setRouterAnalyzing(true); setRouterAnalysis(null); setRouterSelected(null);

    const activeIds = IDS.filter(id=>enabled[id]&&!MODEL_DEFS[id]?.serial&&!isLimited(id));
    const id = activeIds.find(i=>["groq","mistral","cohere"].includes(i))||activeIds[0];

    if (!id) {
      const fallback = heuristicRoute(routerFile);
      setRouterAnalysis(fallback);
      setRouterAnalyzing(false);
      return;
    }

    const preview = routerFile.type==="image"
      ? "[Image: "+routerFile.name+" ("+routerFile.sizeKB+"KB)]"
      : routerFile.content.slice(0,2000);

    const userQ = routerQuestion.trim() ? "Question de l'utilisateur : \""+routerQuestion.trim()+"\". " : "";
    const prompt = userQ+"Analyse ce fichier et propose les 3 meilleurs onglets pour le traiter. "+
      "Fichier : "+routerFile.name+" ("+routerFile.ext.toUpperCase()+", "+routerFile.sizeKB+"KB).\n"+
      "Aperçu : "+preview+"\n\n"+
      "Onglets disponibles : chat (questions générales), debate (analyse multi-angles), redaction (réécriture/correction), "+
      "recherche (Q&A recherche), workflows (automatisation), comfyui (images locales GPU), rag (Q&A sur long document), canvas (exécution code HTML/JS).\n\n"+
      "Réponds UNIQUEMENT en JSON valide :\n"+
      "{\"summary\":\"1-2 phrases sur le contenu\",\"suggestions\":[{\"route\":\"id_onglet\",\"reason\":\"1 phrase\",\"confidence\":0.95,\"params\":{\"prompt\":\"suggestion de prompt adapté au fichier\",\"action\":\"description courte action\"}}]}\n"+
      "3 suggestions max, triées par pertinence décroissante. JSON uniquement.";

    try {
      const r = await callModel(id, [{role:"user",content:prompt}], apiKeys, "Tu es un assistant qui analyse des fichiers et propose des actions. Réponds uniquement en JSON valide.");
      const d = JSON.parse(r.replace(/```json|```/g,"").trim());
      d.suggestions = (d.suggestions||[]).filter(s=>ROUTER_ROUTES.find(r=>r.id===s.route)).slice(0,3);
      if (!d.suggestions.length) d.suggestions = heuristicRoute(routerFile).suggestions;
      setRouterAnalysis(d);
      if (d.suggestions.length) setRouterSelected(d.suggestions[0].route);
    } catch(e) {
      const fallback = heuristicRoute(routerFile);
      setRouterAnalysis(fallback);
      if (fallback.suggestions.length) setRouterSelected(fallback.suggestions[0].route);
    }
    setRouterAnalyzing(false);
  };

  const heuristicRoute = (file) => {
    const ext = file.ext||"";
    let suggestions = [];
    if (["jpg","jpeg","png","gif","webp"].includes(ext)) {
      suggestions = [
        {route:"comfyui",reason:"Image détectée — ComfyUI peut la traiter ou générer des variantes",confidence:.9,params:{prompt:"analyze and describe this image",action:"Ouvrir dans ComfyUI"}},
        {route:"chat",reason:"Poser des questions sur l'image",confidence:.7,params:{prompt:"Décris en détail cette image",action:"Analyser dans le Chat"}},
        {route:"canvas",reason:"Afficher l'image dans le Canvas",confidence:.5,params:{prompt:"",action:"Visualiser"}},
      ];
    } else if (["pdf","docx"].includes(ext)) {
      suggestions = [
        {route:"rag",reason:"Long document — RAG pour Q&A intelligent sans saturer le contexte",confidence:.95,params:{prompt:"",action:"Indexer pour Q&A"}},
        {route:"debate",reason:"Analyse multi-IAs sous plusieurs angles",confidence:.8,params:{prompt:"Analyse ce document",action:"Analyser"}},
        {route:"redaction",reason:"Réécrire ou améliorer le contenu",confidence:.6,params:{prompt:"Résume ce document",action:"Synthétiser"}},
      ];
    } else if (["js","jsx","ts","tsx","py","html","css"].includes(ext)) {
      suggestions = [
        {route:"canvas",reason:"Code exécutable — aperçu live dans le Canvas",confidence:.9,params:{prompt:"",action:"Exécuter dans le Canvas"}},
        {route:"chat",reason:"Poser des questions sur le code",confidence:.8,params:{prompt:"Explique ce code",action:"Analyser le code"}},
        {route:"redaction",reason:"Refactorer ou optimiser le code",confidence:.7,params:{prompt:"Améliore et optimise ce code",action:"Refactorer"}},
      ];
    } else if (["csv","json"].includes(ext)) {
      suggestions = [
        {route:"recherche",reason:"Données structurées — questions analytiques",confidence:.85,params:{prompt:"Analyse ces données et donne les insights principaux",action:"Analyser les données"}},
        {route:"workflows",reason:"Traitement automatisé des données",confidence:.7,params:{prompt:"",action:"Lancer un workflow"}},
        {route:"chat",reason:"Explorer les données en discussion",confidence:.6,params:{prompt:"Décris la structure de ces données",action:"Explorer"}},
      ];
    } else {
      suggestions = [
        {route:"debate",reason:"Analyse multi-IAs du contenu",confidence:.8,params:{prompt:"Analyse ce document",action:"Analyser"}},
        {route:"rag",reason:"Document textuel — Q&A intelligent",confidence:.75,params:{prompt:"",action:"Indexer"}},
        {route:"redaction",reason:"Améliorer ou adapter le texte",confidence:.6,params:{prompt:"Améliore ce texte",action:"Rédiger"}},
      ];
    }
    return { summary:"Fichier "+file.ext.toUpperCase()+" détecté ("+file.sizeKB+"KB) — routage automatique.", suggestions };
  };

  const launchRouterAction = async () => {
    if (!routerSelected || !routerFile || !routerAnalysis) return;
    setRouterLaunching(true);
    const suggestion = routerAnalysis.suggestions.find(s=>s.route===routerSelected);
    const params = suggestion?.params||{};
    const fileContent = routerFile.type==="image" ? null : routerFile.content;
    const userQ = routerQuestion.trim();
    const basePrompt = userQ || params.prompt || "";

    try {
      switch(routerSelected) {
        case "chat": {
          const msg = basePrompt + (fileContent ? "\n\n📎 Fichier : "+routerFile.name+"\n```\n"+fileContent.slice(0,8000)+"\n```" : "");
          setChatInput(msg);
          navigateTab("chat");
          break;
        }
        case "debate": {
          setDebInput(basePrompt + (fileContent?"\n\n"+fileContent.slice(0,6000):""));
          if (routerFile.type==="image") {
            setDebFile({name:routerFile.name,type:"image",base64:routerFile.base64,mimeType:routerFile.mimeType,icon:"🖼"});
          } else if (fileContent) {
            setDebFile({name:routerFile.name,type:"text",content:fileContent.slice(0,10000),icon:routerFile.icon});
          }
          navigateTab("debate");
          break;
        }
        case "redaction": {
          setRedInput&&setRedInput(fileContent?.slice(0,8000)||basePrompt);
          navigateTab("redaction");
          break;
        }
        case "recherche": {
          setRechercheInput&&setRechercheInput(basePrompt||(fileContent?"Analyse ce contenu : "+fileContent.slice(0,4000):""));
          navigateTab("recherche");
          break;
        }
        case "workflows": {
          navigateTab("workflows");
          break;
        }
        case "comfyui": {
          if (routerFile.type==="image") {
            setComfyPrompt("style transfer from: "+routerFile.name+", "+basePrompt);
          } else {
            setComfyPrompt(basePrompt||"illustration of: "+routerFile.name);
          }
          setComfySubTab("generate");
          navigateTab("comfyui");
          if (comfyConnected) setTimeout(()=>generateComfy(), 500);
          break;
        }
        case "rag": {
          if (fileContent) {
            processRagText(fileContent);
            showToast("✓ Document indexé dans le RAG — "+ragChunks.length+" morceaux");
          }
          setChatInput(basePrompt||"Que dit ce document ?");
          navigateTab("chat");
          break;
        }
        case "canvas": {
          const code = fileContent||"";
          const isHtml = routerFile.ext==="html"||code.includes("<!DOCTYPE")||code.includes("<html");
          const isSvg = routerFile.ext==="svg"||code.includes("<svg");
          if ((isHtml||isSvg)&&window.__openCanvas) {
            window.__openCanvas(code, isHtml?"html":"svg", routerFile.name);
          } else if (routerFile.type==="image"&&window.__openCanvas) {
            window.__openCanvas('<img src="data:'+routerFile.mimeType+';base64,'+routerFile.base64+'" style="max-width:100%;max-height:100vh;"/>', "html", routerFile.name);
          } else {
            window.__openCanvas&&window.__openCanvas("<pre style='padding:20px;font-size:12px;overflow:auto;'>"+code.replace(/</g,"&lt;")+"</pre>","html",routerFile.name);
          }
          navigateTab("chat");
          break;
        }
      }
      setRouterDone(true);
      showToast("✓ Lancé dans l'onglet "+ROUTER_ROUTES.find(r=>r.id===routerSelected)?.label);
    } catch(e) { showToast("❌ "+e.message); }
    setRouterLaunching(false);
  };

  return (
    <div style={{flex:1,overflow:"auto",display:"flex",flexDirection:"column",alignItems:"center",padding:"clamp(14px,3vw,32px)",gap:0}}>
      {/* Header */}
      <div style={{width:"100%",maxWidth:700,marginBottom:24}}>
        <div style={{fontFamily:"var(--font-display)",fontWeight:800,fontSize:"clamp(18px,3vw,24px)",color:"var(--ac)",marginBottom:4}}>🧭 Smart Router</div>
        <div style={{fontSize:10,color:"var(--mu)"}}>Dépose un fichier → l'IA l'analyse → propose l'onglet optimal → lance automatiquement la procédure</div>
      </div>

      {/* DROP ZONE */}
      {!routerFile && (
        <div style={{width:"100%",maxWidth:700}}
          onDragOver={e=>{e.preventDefault();e.currentTarget.style.borderColor="var(--ac)";}}
          onDragLeave={e=>{e.currentTarget.style.borderColor="rgba(212,168,83,.25)";}}
          onDrop={e=>{e.preventDefault();e.currentTarget.style.borderColor="rgba(212,168,83,.25)";const f=e.dataTransfer.files?.[0];if(f)loadRouterFile(f);}}>
          <input type="file" ref={routerFileRef} style={{display:"none"}} onChange={e=>{const f=e.target.files?.[0];if(f)loadRouterFile(f);e.target.value="";}}/>
          <div onClick={()=>routerFileRef.current?.click()}
            style={{border:"2px dashed rgba(212,168,83,.25)",borderRadius:16,padding:"60px 24px",textAlign:"center",cursor:"pointer",transition:"all .2s",background:"rgba(212,168,83,.03)"}}
            onMouseEnter={e=>e.currentTarget.style.borderColor="var(--ac)"}
            onMouseLeave={e=>e.currentTarget.style.borderColor="rgba(212,168,83,.25)"}>
            <div style={{fontSize:48,marginBottom:14,opacity:.4}}>🧭</div>
            <div style={{fontSize:14,fontWeight:700,color:"var(--tx)",marginBottom:6}}>Dépose ton fichier ici</div>
            <div style={{fontSize:10,color:"var(--mu)",marginBottom:16}}>ou clique pour choisir</div>
            <div style={{display:"flex",gap:6,justifyContent:"center",flexWrap:"wrap"}}>
              {["📕 PDF","📊 CSV/JSON","💻 Code","🖼 Image","📝 Texte","📄 Docx"].map(t=>(
                <span key={t} style={{fontSize:8,padding:"2px 8px",background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:10,color:"var(--mu)"}}>{t}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* FILE LOADED */}
      {routerFile && (
        <div style={{width:"100%",maxWidth:700}}>
          {/* File card */}
          <div style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",background:"var(--s1)",border:"1px solid rgba(212,168,83,.3)",borderRadius:10,marginBottom:14}}>
            <span style={{fontSize:28}}>{routerFile.icon}</span>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:12,fontWeight:700,color:"var(--tx)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{routerFile.name}</div>
              <div style={{fontSize:9,color:"var(--mu)"}}>{routerFile.ext.toUpperCase()} · {routerFile.sizeKB} KB · {routerFile.type==="image"?"Image":"Texte"}</div>
            </div>
            <button onClick={()=>{setRouterFile(null);setRouterAnalysis(null);setRouterSelected(null);setRouterDone(false);}}
              style={{background:"rgba(248,113,113,.1)",border:"1px solid rgba(248,113,113,.25)",borderRadius:5,color:"var(--red)",fontSize:9,padding:"3px 9px",cursor:"pointer"}}>
              ✕ Changer
            </button>
          </div>

          {/* Optional question */}
          <div style={{marginBottom:14}}>
            <div style={{fontSize:9,color:"var(--mu)",fontWeight:700,marginBottom:5}}>QUESTION OPTIONNELLE <span style={{fontWeight:400}}>(guide le routage et la procédure)</span></div>
            <input value={routerQuestion} onChange={e=>setRouterQuestion(e.target.value)}
              placeholder='Ex: "Résume ce PDF", "Génère une variante de cette image", "Corrige le code"…'
              style={{width:"100%",background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:7,color:"var(--tx)",fontSize:10,padding:"8px 12px",fontFamily:"var(--font-ui)",outline:"none",boxSizing:"border-box"}}
              onFocus={e=>e.target.style.borderColor="var(--ac)"}
              onBlur={e=>e.target.style.borderColor="var(--bd)"}/>
          </div>

          {/* Analyze button */}
          {!routerAnalysis && (
            <button onClick={analyzeRouterFile} disabled={routerAnalyzing}
              style={{width:"100%",padding:"12px",background:"rgba(212,168,83,.15)",border:"2px solid rgba(212,168,83,.4)",borderRadius:9,color:"var(--ac)",fontSize:13,cursor:"pointer",fontWeight:800,fontFamily:"var(--font-display)",opacity: routerAnalyzing ? 0.6 : 1}}>
              {routerAnalyzing?"⟳ Analyse en cours…":"🔍 Analyser et proposer un routage"}
            </button>
          )}

          {/* Analysis result */}
          {routerAnalysis && !routerDone && (
            <div>
              {/* Summary */}
              <div style={{padding:"10px 14px",background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:8,fontSize:10,color:"var(--tx)",lineHeight:1.6,marginBottom:16,fontStyle:"italic"}}>
                💡 {routerAnalysis.summary}
              </div>

              {/* Route suggestions */}
              <div style={{fontSize:9,color:"var(--mu)",fontWeight:700,letterSpacing:1,marginBottom:10}}>ONGLETS RECOMMANDÉS — Clique pour sélectionner</div>
              <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:20}}>
                {routerAnalysis.suggestions.map((sug,i)=>{
                  const route = ROUTER_ROUTES.find(r=>r.id===sug.route);
                  if(!route) return null;
                  const isSelected = routerSelected===sug.route;
                  const conf = Math.round((sug.confidence||0.8)*100);
                  return (
                    <div key={sug.route} onClick={()=>setRouterSelected(sug.route)}
                      style={{padding:"14px 16px",background:isSelected?"rgba(212,168,83,.08)":"var(--s1)",border:`2px solid ${isSelected?"var(--ac)":"var(--bd)"}`,borderRadius:10,cursor:"pointer",transition:"all .15s",position:"relative"}}
                      onMouseEnter={e=>{if(!isSelected)e.currentTarget.style.borderColor="rgba(212,168,83,.4)";}}
                      onMouseLeave={e=>{if(!isSelected)e.currentTarget.style.borderColor="var(--bd)";}}>
                      {i===0&&<div style={{position:"absolute",top:10,right:12,fontSize:8,padding:"2px 7px",background:"rgba(212,168,83,.15)",color:"var(--ac)",borderRadius:4,fontWeight:700}}>⭐ RECOMMANDÉ</div>}
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <div style={{width:36,height:36,borderRadius:8,background:route.color+"18",border:"1px solid "+route.color+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>
                          {route.icon}
                        </div>
                        <div style={{flex:1,minWidth:0,paddingRight:60}}>
                          <div style={{fontSize:11,fontWeight:700,color:isSelected?"var(--ac)":"var(--tx)",marginBottom:2}}>{route.label}</div>
                          <div style={{fontSize:9,color:"var(--mu)",lineHeight:1.4}}>{sug.reason}</div>
                          {sug.params?.prompt&&<div style={{fontSize:8,color:"var(--ac)",marginTop:4,fontStyle:"italic"}}>Prompt : «{sug.params.prompt.slice(0,60)}{sug.params.prompt.length>60?"…":""}»</div>}
                        </div>
                        <div style={{flexShrink:0,textAlign:"right"}}>
                          <div style={{fontSize:10,fontWeight:700,color:conf>=85?"var(--green)":conf>=65?"var(--orange)":"var(--mu)"}}>{conf}%</div>
                          <div style={{fontSize:7,color:"var(--mu)"}}>confiance</div>
                          <div style={{width:40,height:3,background:"var(--bd)",borderRadius:2,marginTop:4,overflow:"hidden"}}>
                            <div style={{height:"100%",width:conf+"%",background:conf>=85?"var(--green)":conf>=65?"var(--orange)":"var(--mu)",borderRadius:2}}/>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* All routes quick-pick */}
              <div style={{marginBottom:16}}>
                <div style={{fontSize:9,color:"var(--mu)",marginBottom:6}}>Ou choisir manuellement :</div>
                <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                  {ROUTER_ROUTES.map(route=>(
                    <button key={route.id} onClick={()=>setRouterSelected(route.id)}
                      style={{fontSize:9,padding:"4px 10px",borderRadius:6,border:"1px solid "+(routerSelected===route.id?route.color:"var(--bd)"),background:routerSelected===route.id?route.color+"18":"transparent",color:routerSelected===route.id?route.color:"var(--mu)",cursor:"pointer",transition:"all .15s"}}>
                      {route.icon} {route.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* LAUNCH button */}
              {routerSelected && (
                <button onClick={launchRouterAction} disabled={routerLaunching}
                  style={{width:"100%",padding:"14px",background:"rgba(212,168,83,.2)",border:"2px solid var(--ac)",borderRadius:10,color:"var(--ac)",fontSize:14,cursor:"pointer",fontWeight:800,fontFamily:"var(--font-display)",opacity: routerLaunching ? 0.6 : 1,transition:"all .2s"}}
                  onMouseEnter={e=>{e.currentTarget.style.background="rgba(212,168,83,.3)";}}
                  onMouseLeave={e=>{e.currentTarget.style.background="rgba(212,168,83,.2)";}}>
                  {routerLaunching?"⟳ Lancement…":"▶ Lancer dans " + (ROUTER_ROUTES.find(r=>r.id===routerSelected)?.label||routerSelected)}
                </button>
              )}
            </div>
          )}

          {/* Done state */}
          {routerDone && (
            <div style={{textAlign:"center",padding:"32px 16px"}}>
              <div style={{fontSize:40,marginBottom:12}}>✓</div>
              <div style={{fontSize:14,fontWeight:700,color:"var(--green)",marginBottom:6}}>Procédure lancée !</div>
              <div style={{fontSize:10,color:"var(--mu)",marginBottom:20}}>L'onglet <strong style={{color:"var(--ac)"}}>{ROUTER_ROUTES.find(r=>r.id===routerSelected)?.label}</strong> a été activé avec ton fichier.</div>
              <div style={{display:"flex",gap:8,justifyContent:"center"}}>
                <button onClick={()=>{setRouterFile(null);setRouterAnalysis(null);setRouterSelected(null);setRouterDone(false);setRouterQuestion("");}}
                  style={{padding:"8px 18px",background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:6,color:"var(--mu)",fontSize:10,cursor:"pointer"}}>
                  🔄 Nouveau fichier
                </button>
                <button onClick={()=>navigateTab(routerSelected||"chat")}
                  style={{padding:"8px 18px",background:"rgba(212,168,83,.15)",border:"1px solid rgba(212,168,83,.4)",borderRadius:6,color:"var(--ac)",fontSize:10,cursor:"pointer",fontWeight:700}}>
                  → Aller à l'onglet
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
