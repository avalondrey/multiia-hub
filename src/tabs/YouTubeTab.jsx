import React, { useState, useEffect } from "react";
import { YT_CHANNELS, YT_CATS, YT_VIDEO_THEMES, YT_VIDEO_PROMPT, fetchYTVideos } from "../config/models.js";
import { callModel } from "../api/ai-service.js";

export default function YouTubeTab({ apiKeys = {} }) {
  const [chCatFilter, setChCatFilter] = useState("Tout");
  const [vidTheme, setVidTheme] = useState("trending");
  const [watchedVids, setWatchedVids] = useState(() => { try { return JSON.parse(localStorage.getItem("multiia_watched_vids")||"[]"); } catch { return []; } });
  // Clé unique = titre+chaîne (url peut être "" pour tous → collision)
  const vidKey = (v) => (v.title||"") + "|" + (v.channel||"");
  const markWatched = (v) => { const k=vidKey(v); const nw = [...new Set([...watchedVids, k])]; setWatchedVids(nw); localStorage.setItem("multiia_watched_vids", JSON.stringify(nw)); };
  const unmarkWatched = (v) => { const k=vidKey(v); const nw = watchedVids.filter(u=>u!==k); setWatchedVids(nw); localStorage.setItem("multiia_watched_vids", JSON.stringify(nw)); };
  const [replaceLoading, setReplaceLoading] = useState(false);
  const replaceWatchedVideos = async () => {
    // Supprimer les vidéos déjà vues de la liste et en charger de nouvelles
    const currentWatched = watchedVids;
    if (!currentWatched.length) { return; }
    const theme = YT_VIDEO_THEMES.find(t => t.id === vidTheme) || YT_VIDEO_THEMES[0];
    setReplaceLoading(true);
    try {
      const watchedTitles = vidItems.filter(v => currentWatched.includes(vidKey(v))).map(v => v.title).slice(0,5);
      const avoidStr = watchedTitles.length ? `\n\nÉvite ces vidéos déjà recommandées : ${watchedTitles.join(" | ")}` : "";
      const result = await fetchYTVideos(theme.query + avoidStr, getKeys());
      // Remplacer seulement les vidéos déjà vues par les nouvelles
      const kept = vidItems.filter(v => !currentWatched.includes(vidKey(v)));
      const fresh = result.items.filter(v => !currentWatched.includes(v.url) && !kept.find(k=>k.url===v.url));
      const merged = [...kept, ...fresh].slice(0, 20);
      setVidItems(merged);
      // Effacer les vues puisqu'on a remplacé
      setWatchedVids([]); localStorage.removeItem("multiia_watched_vids");
    } catch(e) { console.warn("Replace failed:", e.message); }
    setReplaceLoading(false);
  };
  const [hideWatched, setHideWatched] = useState(false);
  const [vidItems, setVidItems] = useState([]);
  const [vidLoading, setVidLoading] = useState(false);
  const [vidError, setVidError] = useState(null);
  // ── YouTube Player Modal ────────────────────────────────────────
  const [ytPlayer, setYtPlayer] = useState(null); // {videoId, title, channel}
  const [ytSearching, setYtSearching] = useState(null); // index de la carte en cours de recherche

  const searchAndPlay = async (v, idx) => {
    setYtSearching(idx);
    markWatched(v);

    // Avec clé YouTube Data API → recherche le vrai videoId → player intégré
    if (apiKeys.youtube_data) {
      try {
        const q = encodeURIComponent(`${v.title} ${v.channel}`);
        const r = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${q}&type=video&maxResults=1&key=${apiKeys.youtube_data}`);
        const d = await r.json();
        if (d.items?.[0]?.id?.videoId) {
          setYtPlayer({ videoId: d.items[0].id.videoId, title: v.title, channel: v.channel });
          setYtSearching(null);
          return;
        }
      } catch {}
    }

    // Sans clé → ouvre YouTube search dans un nouvel onglet
    const q = encodeURIComponent(`${v.title} ${v.channel}`);
    window.open(`https://www.youtube.com/results?search_query=${q}`, '_blank');
    setYtSearching(null);
  };
  const [vidProvider, setVidProvider] = useState(null);
  const [vidFallback, setVidFallback] = useState(false);
  const [vidCache, setVidCache] = useState({});
  const [vidLastFetch, setVidLastFetch] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [langFilter, setLangFilter] = useState("Tout");
  const [playingVid, setPlayingVid] = useState(null); // videoId en cours de lecture inline
  const [hoverVid, setHoverVid] = useState(null);     // videoId survolé (aperçu)
  const hoverTimerRef = React.useRef(null);

  const [customChannels, setCustomChannels] = useState(() => {
    try { return JSON.parse(localStorage.getItem("multiia_yt_channels") || "[]"); } catch { return []; }
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ name:"", url:"", desc:"", lang:"🇫🇷", cat:"IA & Tech", icon:"⭐", color:"#FF6B35" });
  const [addError, setAddError] = useState("");

  const CUSTOM_COLORS = ["#FF6B35","#D4A853","#4ADE80","#60A5FA","#A78BFA","#E07FA0","#F97316","#34D399","#60C8E0","#FB923C","#FACC15","#C084FC"];
  const CUSTOM_CATS = ["IA & Tech","IA Technique","Tutoriels","Actualités IA","Dev & Tech","Interviews","IA Locale & OSS","Science & IA","Data Science","IA Business","Autre"];

  const saveCustom = (list) => { setCustomChannels(list); try { localStorage.setItem("multiia_yt_channels", JSON.stringify(list)); } catch {} };

  const extractHandle = (url) => {
    const m = url.match(/youtube\.com\/@([^/?&]+)/) || url.match(/youtube\.com\/c\/([^/?&]+)/) || url.match(/youtube\.com\/user\/([^/?&]+)/);
    return m ? m[1] : "";
  };

  const handleUrlChange = (url) => {
    const handle = extractHandle(url);
    setAddForm(f => ({ ...f, url, name: f.name || (handle || "") }));
  };

  const addChannel = () => {
    setAddError("");
    if (!addForm.name.trim()) { setAddError("Le nom est requis"); return; }
    if (!addForm.url.trim() || !addForm.url.includes("youtube")) { setAddError("Lien YouTube invalide"); return; }
    const ch = {
      id: "custom_" + Date.now(), name: addForm.name.trim(),
      url: addForm.url.trim().startsWith("http") ? addForm.url.trim() : "https://" + addForm.url.trim(),
      desc: addForm.desc.trim() || "Chaîne ajoutée manuellement.", lang: addForm.lang,
      cat: addForm.cat, icon: addForm.icon || "⭐", color: addForm.color, subs: "", custom: true,
    };
    saveCustom([ch, ...customChannels]);
    setShowAddModal(false);
    setAddForm({ name:"", url:"", desc:"", lang:"🇫🇷", cat:"IA & Tech", icon:"⭐", color:"#FF6B35" });
  };

  const deleteCustom = (e, id) => { e.preventDefault(); e.stopPropagation(); saveCustom(customChannels.filter(c => c.id !== id)); };
  const getKeys = () => { try { return JSON.parse(localStorage.getItem("multiia_keys")||"{}"); } catch { return {}; } };

  const fetchVideos = async (themeId, extraChannels) => {
    const cacheKey = themeId + (extraChannels ? "_ch" : "");
    if (vidCache[cacheKey]) {
      const cached = vidCache[cacheKey];
      setVidItems(cached.items); setVidProvider(cached.provider); setVidFallback(cached.fallback||false); setVidLastFetch(new Date()); return;
    }
    const theme = YT_VIDEO_THEMES.find(t => t.id === themeId);
    setVidLoading(true); setVidError(null); setVidItems([]);
    try {
      // Injecter les chaînes perso FR/EN dans le prompt
      const custFrEn = (customChannels||[]).filter(ch => ch.lang === "🇫🇷" || ch.lang === "🇺🇸").slice(0,5);
      const channelContext = custFrEn.length > 0
        ? `\n\nChaînes personnalisées à inclure dans les recommandations : ${custFrEn.map(ch => ch.name).join(", ")}`
        : "";
      const customTheme = {...theme, query: theme.query + channelContext};
      const result = await fetchYTVideos(customTheme.query, getKeys());
      setVidItems(result.items); setVidProvider(result.provider); setVidFallback(result.fallback||false);
      setVidCache(prev => ({...prev, [cacheKey]: result})); setVidLastFetch(new Date());
    } catch(e) { setVidError("Erreur : " + e.message); }
    finally { setVidLoading(false); }
  };

  useEffect(() => { fetchVideos("trending", true); }, []);

  const handleTheme = (id) => { setVidTheme(id); fetchVideos(id, true); };
  const openYTSearch = () => {
    if (searchQuery.trim()) window.open("https://www.youtube.com/results?search_query=" + encodeURIComponent(searchQuery.trim() + " IA intelligence artificielle"), "_blank");
  };

  const extractVideoId = (url) => {
    if (!url) return null;
    const m = url.match(/[?&]v=([^&]{11})/) || url.match(/youtu\.be\/([^?]{11})/) || url.match(/embed\/([^?]{11})/);
    return m ? m[1] : null;
  };

  const allChannels = [...customChannels, ...YT_CHANNELS];
  const filteredChannels = allChannels.filter(ch => {
    if (chCatFilter === "Tout") return true;
    if (chCatFilter === "🇫🇷 Français") return ch.lang === "🇫🇷";
    if (chCatFilter === "🇺🇸 Anglais") return ch.lang === "🇺🇸";
    if (chCatFilter === "⭐ Mes chaînes") return ch.custom === true;
    return ch.cat === chCatFilter;
  });

  const filteredVideos = vidItems.filter(v => {
    if (langFilter === "Tout") return true;
    if (langFilter === "🇫🇷 Français") return v.lang === "FR";
    if (langFilter === "🇺🇸 Anglais") return v.lang === "EN";
    return true;
  }).filter(v => hideWatched ? !watchedVids.includes(vidKey(v)) : true);

  const fmtTime = (d) => {
    if (!d) return ""; const m = Math.floor((Date.now() - d.getTime()) / 60000);
    if (m < 1) return "à l'instant"; if (m < 60) return `${m}min`; return `${Math.floor(m/60)}h`;
  };
  const VCatColors = { "Tutoriel":"#4ADE80","Actualité":"#D4A853","Analyse":"#60A5FA","Review":"#A78BFA","Interview":"#E07FA0" };
  const vcatColor = (col) => VCatColors[col] || "#9CA3AF";

  const handleVidMouseEnter = (vidId) => {
    if (!vidId) return;
    clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => setHoverVid(vidId), 700);
  };
  const handleVidMouseLeave = () => {
    clearTimeout(hoverTimerRef.current);
    setHoverVid(null);
  };

  return (
    <div className="yt-wrap">
      {/* Hero */}
      <div className="yt-hero">
        <div className="yt-hero-icon">▶️</div>
        <div>
          <div className="yt-hero-title">YouTube IA & Tech</div>
          <div className="yt-hero-sub">Vidéos recommandées par IA en premier · Chaînes FR &amp; EN · Lecture inline au survol · Tes chaînes perso intégrées aux recommandations.</div>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="yt-search-bar">
        <input className="yt-search-inp" placeholder="Rechercher une vidéo IA sur YouTube…"
          value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          onKeyDown={e => { if(e.key==="Enter") openYTSearch(); }}/>
        <button className="yt-search-btn" onClick={openYTSearch}>▶ Rechercher sur YouTube</button>
        <a href="https://www.youtube.com/@Underscore_" target="_blank" rel="noreferrer"
          className="yt-search-btn" style={{background:"var(--s1)",color:"var(--ac)",border:"1px solid var(--bd)",textDecoration:"none",fontSize:10}}>
          🇫🇷 Sélection FR
        </a>
      </div>

      {/* ══ VIDÉOS RECOMMANDÉES EN PREMIER ══ */}
      <div className="yt-sec-title" style={{marginTop:0}}>🎬 Vidéos recommandées
        {vidProvider && !vidLoading && <span style={{fontWeight:400,fontSize:9,color:"var(--mu)",marginLeft:6}}>via {vidProvider} · {vidLastFetch?fmtTime(vidLastFetch):""}</span>}
        {customChannels.filter(ch=>ch.lang==="🇫🇷"||ch.lang==="🇺🇸").length>0 &&
          <span style={{fontSize:8,color:"var(--ac)",marginLeft:8,background:"rgba(212,168,83,.1)",padding:"1px 5px",borderRadius:3}}>+ tes {customChannels.filter(ch=>ch.lang==="🇫🇷"||ch.lang==="🇺🇸").length} chaîne(s) perso</span>
        }
        <button className="rss-refresh" style={{marginLeft:"auto"}}
          onClick={() => { setVidCache({}); fetchVideos(vidTheme, true); }} disabled={vidLoading}>↺</button>
      </div>

      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10,alignItems:"center"}}>
        <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
          {YT_VIDEO_THEMES.map(t => (
            <button key={t.id} className={`filter-btn ${vidTheme===t.id?"on":""}`}
              style={vidTheme!==t.id?{borderColor:"#FF6B6B44"}:{background:"#CC0000",borderColor:"#CC0000",color:"#fff"}}
              onClick={() => handleTheme(t.id)} disabled={vidLoading}>{t.label}</button>
          ))}
        </div>
        <div style={{marginLeft:"auto",display:"flex",gap:4}}>
          {["Tout","🇫🇷 Français","🇺🇸 Anglais"].map(l => (
            <button key={l} className={`filter-btn ${langFilter===l?"on":""}`} style={{fontSize:9}} onClick={() => setLangFilter(l)}>{l}</button>
          ))}
          <button className={`filter-btn ${hideWatched?"on":""}`}
            style={{fontSize:9, borderColor:hideWatched?"var(--green)":"var(--bd)",color:hideWatched?"var(--green)":"var(--mu)",background:hideWatched?"rgba(74,222,128,.1)":"transparent"}}
            onClick={()=>setHideWatched(h=>!h)}
            title={hideWatched?"Afficher toutes les vidéos":"Masquer les vidéos déjà vues"}>
            {hideWatched?"✓ Masquer vues":"👁 Masquer vues"}
          </button>
          {watchedVids.length>0&&<button className="filter-btn" style={{fontSize:9,borderColor:"var(--red)",color:"var(--red)"}} onClick={()=>{setWatchedVids([]);localStorage.removeItem("multiia_watched_vids");}} title="Réinitialiser les vues">🗑 Reset ({watchedVids.length})</button>}
          {watchedVids.length>0&&<button className="filter-btn" disabled={replaceLoading} style={{fontSize:9,borderColor:"var(--blue)",color:replaceLoading?"var(--mu)":"var(--blue)",background:replaceLoading?"transparent":"rgba(96,165,250,.08)"}} onClick={replaceWatchedVideos} title="Remplacer les vidéos déjà vues par de nouvelles recommandations">{replaceLoading?"⟳ Chargement…":"🔄 Remplacer les vues"}</button>}
        </div>
      </div>

      {vidFallback && !vidLoading && (
        <div style={{padding:"7px 12px",background:"rgba(251,146,60,.08)",border:"1px solid rgba(251,146,60,.2)",borderRadius:6,fontSize:9,color:"var(--orange)",marginBottom:10}}>
          ⚠️ <strong>Mode cache</strong> — Active <strong>Gemini</strong> ou <strong>Groq</strong> dans Config pour des recommandations dynamiques.
        </div>
      )}
      {vidLoading && (
        <div className="rss-loading">
          <span className="dots"><span>·</span><span>·</span><span>·</span></span>
          <div style={{marginTop:8}}>Génération des recommandations… (Gemini → Groq → Mistral)</div>
        </div>
      )}
      {vidError && !vidLoading && (
        <div className="rss-err">⚠️ {vidError}
          <button onClick={() => fetchVideos(vidTheme, true)} style={{marginLeft:10,padding:"2px 8px",borderRadius:3,border:"1px solid var(--orange)",background:"transparent",color:"var(--orange)",fontSize:9,cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace"}}>Réessayer</button>
        </div>
      )}

      {!vidLoading && filteredVideos.length > 0 && (
        <div className="yt-vgrid" style={{marginBottom:24}}>
          {filteredVideos.map((v, i) => {
            const vidId = extractVideoId(v.url);
            const thumbUrl = vidId ? `https://img.youtube.com/vi/${vidId}/mqdefault.jpg` : null;
            const isWatched = watchedVids.includes(vidKey(v));
            const isSrch = ytSearching === i;
            return (
            <div key={i} style={{position:"relative"}}>
              <div className={`yt-vcard ${v.important?"important":""}`}
                style={{display:"flex",flexDirection:"row",gap:10,alignItems:"center",borderRadius:6,textDecoration:"none",transition:"background .15s,border-color .15s",opacity:isWatched ? 0.55 : 1,cursor:isSrch?"wait":"pointer"}}
                onClick={()=>{ if(!isSrch){ searchAndPlay(v, i); } }}
                onMouseEnter={e=>e.currentTarget.style.borderColor="#FF6B6B44"}
                onMouseLeave={e=>e.currentTarget.style.borderColor="var(--bd)"}>
                {/* Thumbnail compact */}
                <div style={{position:"relative",width:120,height:68,flexShrink:0,background:"#111",borderRadius:4,overflow:"hidden"}}>
                  {thumbUrl
                    ? <img src={thumbUrl} alt={v.title} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                    : <div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:20,opacity:.3}}>▶</span></div>
                  }
                  {v.duration && <span style={{position:"absolute",bottom:2,right:2,fontSize:7,background:"rgba(0,0,0,.85)",color:"#fff",padding:"1px 3px",borderRadius:2}}>{v.duration}</span>}
                  {isWatched && <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.5)",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:20,color:"var(--green)"}}>✓</span></div>}
                </div>
                {/* Infos */}
                <div style={{flex:1,minWidth:0,display:"flex",flexDirection:"column",gap:2}}>
                  <div className="yt-vtitle" style={{fontSize:11}}>{v.important && <span className="yt-vstar">★ </span>}{v.title}</div>
                  <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
                    <span className="yt-vch">{v.channel}</span>
                    {v.lang && <span style={{fontSize:9}}>{v.lang==="FR"?"🇫🇷":"🇺🇸"}</span>}
                    {v.duration && <span style={{fontSize:8,color:"var(--mu)"}}>{v.duration}</span>}
                    {v.views && <span style={{fontSize:8,color:"var(--mu)"}}>· {v.views}</span>}
                    {v.category && <span className="yt-vcat" style={{background:vcatColor(v.category)+"18",color:vcatColor(v.category)}}>{v.category}</span>}
                    {isWatched && <span style={{fontSize:8,color:"var(--green)",fontWeight:700}}>✓ Vu</span>}
                  </div>
                  {v.summary && <div style={{fontSize:9,color:"var(--mu)",lineHeight:1.4,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:1,WebkitBoxOrient:"vertical"}}>{v.summary}</div>}
                </div>
                <span style={{fontSize:11,color:"var(--mu)",flexShrink:0}}>{ytSearching===filteredVideos.indexOf(v)?"⏳":"▶"}</span>
              </div>
              {/* Bouton marquer vu / démarquer */}
              <button
                onClick={e=>{e.preventDefault();e.stopPropagation();isWatched?unmarkWatched(v):markWatched(v);}}
                title={isWatched?"Marquer comme non vu (remplacer)":"Marquer comme vu"}
                style={{position:"absolute",top:4,right:4,background:isWatched?"rgba(74,222,128,.15)":"rgba(255,255,255,.06)",border:"1px solid "+(isWatched?"rgba(74,222,128,.4)":"var(--bd)"),borderRadius:3,color:isWatched?"var(--green)":"var(--mu)",fontSize:8,padding:"2px 5px",cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace",zIndex:2}}>
                {isWatched?"✓ Vu":"+ Vu"}
              </button>
            </div>
            );
          })}
        </div>
      )}

      {/* ══ CHAÎNES RECOMMANDÉES ══ */}
      <div className="yt-sec-title">📡 Chaînes recommandées
        <span style={{fontWeight:400,fontSize:9,color:"var(--mu)",marginLeft:4}}>— {filteredChannels.length} chaîne{filteredChannels.length>1?"s":""}{customChannels.length>0&&<span style={{color:"#FF6B6B",marginLeft:6}}>· {customChannels.length} perso</span>}</span>
        <button className="yt-search-btn" style={{marginLeft:"auto",padding:"4px 10px",fontSize:9,background:"rgba(255,107,107,.15)",border:"1px solid rgba(255,107,107,.4)",color:"#FF6B6B"}}
          onClick={() => setShowAddModal(true)}>＋ Ajouter une chaîne</button>
      </div>
      <div className="yt-cat-filter">
        {["Tout","⭐ Mes chaînes","🇫🇷 Français","🇺🇸 Anglais",...CUSTOM_CATS.slice(0,5)].map(cat => (
          <button key={cat} className={`filter-btn ${chCatFilter===cat?"on":""}`}
            style={chCatFilter!==cat?{borderColor:"#FF6B6B44",color:"var(--mu)"}:{background:"#FF0000",borderColor:"#FF0000",color:"#fff"}}
            onClick={() => setChCatFilter(cat)}>{cat}</button>
        ))}
      </div>
      <div className="yt-ch-grid">
        <div className="yt-add-card" onClick={() => setShowAddModal(true)}>
          <div className="yt-add-card-icon">＋</div>
          <div className="yt-add-card-label">Ajouter une chaîne<br/><span style={{fontSize:8,color:"var(--mu)"}}>Colle l'URL YouTube</span></div>
        </div>
        {filteredChannels.map(ch => (
          <div key={ch.id} className="yt-ch-card" style={{borderColor:ch.color+"33",position:"relative",display:"flex",flexDirection:"column",gap:8,padding:"clamp(11px,1.8vw,14px)",background:"var(--s1)",border:`1px solid ${ch.color}33`,borderRadius:9,cursor:"pointer"}}
            onClick={() => window.open(ch.url,"_blank")}>
            {ch.custom && (
              <>
                <span className="yt-custom-badge" style={{position:"absolute",top:7,left:7}}>PERSO</span>
                <button className="yt-ch-del" onClick={e => deleteCustom(e, ch.id)} title="Supprimer">✕</button>
              </>
            )}
            <div className="yt-ch-hdr" style={{marginTop:ch.custom?12:0}}>
              <div className="yt-ch-icon" style={{background:ch.color+"18",color:ch.color,borderColor:ch.color+"44"}}>{ch.icon}</div>
              <div>
                <div className="yt-ch-name" style={{color:ch.color}}>{ch.name}</div>
                <div className="yt-ch-meta">
                  <span className="yt-ch-lang">{ch.lang}</span>
                  {ch.subs && <span className="yt-ch-subs">{ch.subs}</span>}
                </div>
              </div>
            </div>
            <span className="yt-ch-cat" style={{background:ch.color+"18",color:ch.color}}>{ch.cat}</span>
            <div className="yt-ch-desc">{ch.desc}</div>
            <div className="yt-ch-btn" style={{borderColor:ch.color,color:ch.color,display:"flex",alignItems:"center",justifyContent:"center",gap:4,padding:6,borderRadius:5,border:"1px solid",fontFamily:"'IBM Plex Mono',monospace",fontSize:8,fontWeight:600}}>▶ Ouvrir la chaîne</div>
          </div>
        ))}
      </div>

      {/* Modal ajout chaîne */}
      {showAddModal && (
        <div className="yt-add-modal" onClick={e => { if(e.target===e.currentTarget) setShowAddModal(false); }}>
          <div className="yt-add-modal-box">
            <div className="yt-add-modal-title">➕ Ajouter une chaîne YouTube</div>
            <div className="yt-add-field">
              <label className="yt-add-label">Lien YouTube *</label>
              <input className="yt-add-inp" placeholder="https://www.youtube.com/@NomDeLaChaine"
                value={addForm.url} onChange={e => handleUrlChange(e.target.value)}/>
              <span style={{fontSize:8,color:"var(--mu)"}}>Ex : youtube.com/@Underscore_</span>
            </div>
            <div className="yt-add-row">
              <div className="yt-add-field" style={{flex:2}}>
                <label className="yt-add-label">Nom *</label>
                <input className="yt-add-inp" value={addForm.name} onChange={e=>setAddForm(f=>({...f,name:e.target.value}))} placeholder="Nom affiché"/>
              </div>
              <div className="yt-add-field" style={{flex:1}}>
                <label className="yt-add-label">Icône</label>
                <input className="yt-add-inp" placeholder="🎬" maxLength={2} value={addForm.icon} onChange={e=>setAddForm(f=>({...f,icon:e.target.value}))} style={{textAlign:"center",fontSize:16}}/>
              </div>
            </div>
            <div className="yt-add-field">
              <label className="yt-add-label">Description</label>
              <input className="yt-add-inp" value={addForm.desc} onChange={e=>setAddForm(f=>({...f,desc:e.target.value}))} placeholder="Ce que fait cette chaîne…"/>
            </div>
            <div className="yt-add-row">
              <div className="yt-add-field" style={{flex:1}}>
                <label className="yt-add-label">Langue</label>
                <select className="yt-add-inp" value={addForm.lang} onChange={e=>setAddForm(f=>({...f,lang:e.target.value}))}>
                  <option value="🇫🇷">🇫🇷 Français</option>
                  <option value="🇺🇸">🇺🇸 Anglais</option>
                  <option value="🌐">🌐 Autre</option>
                </select>
              </div>
              <div className="yt-add-field" style={{flex:2}}>
                <label className="yt-add-label">Catégorie</label>
                <select className="yt-add-inp" value={addForm.cat} onChange={e=>setAddForm(f=>({...f,cat:e.target.value}))}>
                  {CUSTOM_CATS.map(cat=><option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
            </div>
            <div className="yt-add-field">
              <label className="yt-add-label">Couleur</label>
              <div className="yt-add-colors">
                {CUSTOM_COLORS.map(col=>(
                  <div key={col} className={`yt-add-color ${addForm.color===col?"sel":""}`} style={{background:col}} onClick={()=>setAddForm(f=>({...f,color:col}))}/>
                ))}
              </div>
            </div>
            {addForm.name && (
              <div style={{padding:"8px 10px",background:addForm.color+"12",border:`1px solid ${addForm.color}33`,borderRadius:6,display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:28,height:28,borderRadius:"50%",background:addForm.color+"22",border:`2px solid ${addForm.color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,color:addForm.color}}>{addForm.icon||"⭐"}</div>
                <div>
                  <div style={{fontSize:10,fontWeight:700,color:addForm.color}}>{addForm.name}</div>
                  <div style={{fontSize:8,color:"var(--mu)"}}>{addForm.lang} · {addForm.cat}</div>
                </div>
              </div>
            )}
            {addError && <div style={{fontSize:9,color:"var(--red)",padding:"4px 8px",background:"rgba(248,113,113,.1)",borderRadius:4}}>⚠️ {addError}</div>}
            <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
              <button onClick={()=>{setShowAddModal(false);setAddError("");}}
                style={{padding:"7px 14px",background:"transparent",border:"1px solid var(--bd)",borderRadius:5,color:"var(--mu)",cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace",fontSize:10}}>Annuler</button>
              <button onClick={addChannel}
                style={{padding:"7px 18px",background:"rgba(255,107,107,.15)",border:"1px solid #FF6B6B",borderRadius:5,color:"#FF6B6B",cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace",fontSize:10,fontWeight:700}}>＋ Ajouter</button>
            </div>
          </div>
        </div>
      )}

      {/* Recherches rapides */}
      <div className="yt-sec-title" style={{marginTop:8}}>🔗 Recherches rapides YouTube</div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:16}}>
        {[["🤖 IA 2025 FR","intelligence artificielle 2025 français"],["💻 LLM tutoriel","LLM tutorial local llama ollama"],["🎨 Stable Diffusion","stable diffusion FLUX tutorial 2025"],["⚡ Groq Llama","groq llama fast inference"],["🧠 DeepSeek","deepseek R1 explained"],["🔥 Claude vs GPT","claude vs gpt-4 comparison 2025"],["📊 Machine Learning","machine learning course beginner 2025"],["🇫🇷 IA France","intelligence artificielle France actualités 2025"],
        ].map(([label,q]) => (
          <a key={label} href={"https://www.youtube.com/results?search_query="+encodeURIComponent(q)}
            target="_blank" rel="noreferrer" className="fbtn" style={{fontSize:9,padding:"5px 10px",textDecoration:"none"}}>
            {label}
          </a>
        ))}
      </div>
    
    {/* ── YouTube Player Modal ── */}
    {ytPlayer && (
      <div onClick={()=>setYtPlayer(null)} style={{position:"fixed",inset:0,zIndex:9999,background:"rgba(0,0,0,.88)",display:"flex",alignItems:"center",justifyContent:"center",padding:16,backdropFilter:"blur(8px)"}}>
        <div onClick={e=>e.stopPropagation()} style={{width:"min(900px,96vw)",background:"var(--bg)",border:"1px solid var(--bd)",borderRadius:10,overflow:"hidden",boxShadow:"0 24px 80px rgba(0,0,0,.8)"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderBottom:"1px solid var(--bd)",background:"var(--s1)"}}>
            <span style={{fontSize:14}}>▶</span>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:11,fontWeight:700,color:"var(--tx)",fontFamily:"'Syne',sans-serif",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ytPlayer.title}</div>
              <div style={{fontSize:9,color:"var(--mu)"}}>{ytPlayer.channel}</div>
            </div>
            <a href={`https://www.youtube.com/watch?v=${ytPlayer.videoId}`} target="_blank" rel="noreferrer"
              style={{fontSize:8,padding:"4px 10px",background:"rgba(255,80,80,.12)",border:"1px solid rgba(255,80,80,.3)",borderRadius:4,color:"#FF5555",textDecoration:"none",whiteSpace:"nowrap",fontFamily:"'IBM Plex Mono',monospace"}}>
              ↗ Ouvrir YouTube
            </a>
            <button onClick={()=>setYtPlayer(null)} style={{background:"none",border:"1px solid var(--bd)",borderRadius:4,color:"var(--mu)",fontSize:14,width:28,height:28,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>✕</button>
          </div>
          <div style={{position:"relative",paddingBottom:"56.25%",height:0,background:"#000"}}>
            <iframe
              src={`https://www.youtube.com/embed/${ytPlayer.videoId}?autoplay=1&rel=0`}
              title={ytPlayer.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",border:"none"}}
            />
          </div>
        </div>
      </div>
    )}
    </div>
  );
}
