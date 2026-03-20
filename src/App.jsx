import React, { useState, useRef, useEffect } from "react";
import {
  APP_VERSION, BUILD_DATE, MODEL_DEFS, TOKEN_PRICE,
  BASE_WEB_AIS, WEB_AIS, YT_CHANNELS, YT_CATS,
  YT_VIDEO_THEMES, YT_VIDEO_PROMPT, ARENA_MODELS, ARENA_NEWS,
  IMAGE_GENERATORS, DEFAULT_PROMPTS, DEFAULT_PERSONAS,
  REDACTION_ACTIONS, IDS, PRICING, RATE_LIMIT_COOLDOWN, CREDIT_COOLDOWN,
  getDiscoveredAIs, saveDiscoveredAIs, fetchYTVideos, DISCOVERY_SOURCES,
  VOICE_THEMES, VEILLE_THEMES, PROJECT_TEMPLATES, EXTRA_PROMPTS,
  GLOSSAIRE_IA, BENCHMARK_TESTS
} from "./config/models.js";
import {
  fmt, classifyError, truncateForModel,
  callModel, callClaude, callGemini, callCompat, callCohere,
  callPollinations, callPollinationsPaid, correctGrammar
} from "./api/ai-service.js";

function tokenizeCode(code, lang) {
  const l = (lang || "").toLowerCase();
  const KW = {
    js:   new Set(["const","let","var","function","return","if","else","for","while","do","class","import","export","default","from","async","await","try","catch","throw","new","this","typeof","instanceof","of","in","null","undefined","true","false","switch","case","break","continue","void","delete","yield","extends","super","static"]),
    ts:   new Set(["const","let","var","function","return","if","else","for","while","class","import","export","default","from","async","await","try","catch","throw","new","this","typeof","interface","type","enum","string","number","boolean","any","void","never","null","undefined","true","false","extends","implements","public","private","protected","readonly","abstract"]),
    py:   new Set(["def","return","if","elif","else","for","while","class","import","from","as","with","try","except","finally","raise","pass","break","continue","True","False","None","and","or","not","in","is","lambda","yield","global","nonlocal","del","assert","async","await","print","len","range","str","int","float","list","dict","set","tuple","type"]),
    bash: new Set(["echo","if","then","else","fi","for","do","done","while","function","return","exit","export","source","cd","ls","mkdir","rm","cp","mv","cat","grep","sed","chmod","chown","curl","wget","git","npm","pip","python","node"]),
    css:  new Set(["display","flex","grid","position","color","background","margin","padding","border","font","width","height","overflow","transition","animation","transform","opacity","cursor","top","left","right","bottom","none","block","inline","absolute","relative","fixed","sticky","center","bold","normal","auto"]),
    java: new Set(["class","public","private","protected","static","void","return","if","else","for","while","new","import","package","this","super","extends","implements","interface","abstract","final","try","catch","throw","true","false","null","int","long","double","float","boolean","String"]),
    rust: new Set(["fn","let","mut","if","else","for","while","loop","match","return","use","mod","pub","struct","enum","impl","trait","type","where","self","Self","true","false","None","Some","Ok","Err","async","await","move","Box","Vec","String","Option","Result"]),
    sql:  new Set(["SELECT","FROM","WHERE","JOIN","INNER","LEFT","RIGHT","ON","GROUP","BY","ORDER","HAVING","INSERT","INTO","VALUES","UPDATE","SET","DELETE","CREATE","TABLE","DROP","ALTER","INDEX","UNIQUE","PRIMARY","KEY","FOREIGN","REFERENCES","AS","AND","OR","NOT","NULL","IS","IN","LIKE","BETWEEN","DISTINCT","COUNT","SUM","AVG","MAX","MIN"]),
  };
  const jsLike = new Set(["js","jsx","ts","tsx","java","c","cpp","cs","go","rust","swift","kotlin","dart"]);
  const pyLike = new Set(["py","python","rb","ruby"]);
  const kws = KW[l==="tsx"?"ts":l==="jsx"?"js":l==="sh"?"bash":l] || KW.js;
  const tokens = [];
  let i = 0; const n = code.length;
  while (i < n) {
    const ch = code[i];
    // Line comment //
    if (jsLike.has(l) && ch==="/" && code[i+1]==="/") {
      let j=i; while(j<n&&code[j]!=="\n")j++;
      tokens.push({t:"cm",v:code.slice(i,j)}); i=j; continue;
    }
    // Block comment /* */
    if ((jsLike.has(l)||l==="css") && ch==="/" && code[i+1]==="*") {
      let j=i+2; while(j<n&&!(code[j-1]==="*"&&code[j]==="/"))j++;
      tokens.push({t:"cm",v:code.slice(i,j+1)}); i=j+1; continue;
    }
    // Python/bash comment #
    if ((pyLike.has(l)||l==="bash"||l==="sh"||l==="yaml"||l==="yml") && ch==="#") {
      let j=i; while(j<n&&code[j]!=="\n")j++;
      tokens.push({t:"cm",v:code.slice(i,j)}); i=j; continue;
    }
    // HTML comment
    if ((l==="html"||l==="xml") && code.slice(i,i+4)==="<!--") {
      let j=i+4; while(j<n&&code.slice(j,j+3)!=="-->")j++;
      tokens.push({t:"cm",v:code.slice(i,j+3)}); i=j+3; continue;
    }
    // SQL comment --
    if (l==="sql" && ch==="-" && code[i+1]==="-") {
      let j=i; while(j<n&&code[j]!=="\n")j++;
      tokens.push({t:"cm",v:code.slice(i,j)}); i=j; continue;
    }
    // String "
    if (ch==="\"") {
      let j=i+1; while(j<n){if(code[j]==="\"")break;if(code[j]==="\\")j++;j++;}
      tokens.push({t:"st",v:code.slice(i,j+1)}); i=j+1; continue;
    }
    // String '
    if (ch==="'") {
      let j=i+1; while(j<n){if(code[j]==="'")break;if(code[j]==="\\")j++;j++;}
      tokens.push({t:"st",v:code.slice(i,j+1)}); i=j+1; continue;
    }
    // Template literal backtick
    if (ch==="`") {
      let j=i+1; while(j<n){if(code[j]==="`")break;if(code[j]==="\\")j++;j++;}
      tokens.push({t:"st",v:code.slice(i,j+1)}); i=j+1; continue;
    }
    // Number
    if (/[0-9]/.test(ch)) {
      let j=i; while(j<n&&/[0-9._xXa-fA-FbBoOeE]/.test(code[j]))j++;
      tokens.push({t:"nm",v:code.slice(i,j)}); i=j; continue;
    }
    // Identifier / keyword
    if (/[a-zA-Z_$]/.test(ch)) {
      let j=i; while(j<n&&/[a-zA-Z0-9_$]/.test(code[j]))j++;
      const w=code.slice(i,j);
      tokens.push({t:kws.has(w)?"kw":"id",v:w}); i=j; continue;
    }
    // Whitespace
    if (/\s/.test(ch)) {
      let j=i; while(j<n&&/\s/.test(code[j]))j++;
      tokens.push({t:"ws",v:code.slice(i,j)}); i=j; continue;
    }
    // Operator / punct
    tokens.push({t:"op",v:ch}); i++;
  }
  return tokens;
}

function CodeBlock({ code, lang }) {
  const [copied, setCopied] = useState(false);
  const [highlighted, setHighlighted] = useState(null);
  const codeStr = (code||"").trimEnd();
  const isHtmlLike = lang && (lang==="html"||lang==="html5"||lang==="svg");

  // Try Prism highlight, fall back to homemade tokenizer
  React.useEffect(() => {
    loadPrism();
    const doHL = () => {
      if (!window.Prism) { setHighlighted(null); return; }
      try {
        const grammar = window.Prism.languages[lang] || window.Prism.languages.clike || window.Prism.languages.markup;
        if (grammar) {
          setHighlighted(window.Prism.highlight(codeStr, grammar, lang||"text"));
        } else {
          // Language not loaded yet — wait for autoloader
          window.Prism.highlightAll && window.Prism.hooks?.add("complete", () => {
            const g2 = window.Prism.languages[lang];
            if (g2) setHighlighted(window.Prism.highlight(codeStr, g2, lang));
          });
        }
      } catch { setHighlighted(null); }
    };
    onPrismReady(doHL);
  }, [codeStr, lang]);

  const copy = () => {
    try { navigator.clipboard.writeText(codeStr); } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  // Fallback tokenizer (homemade)
  const tokens = highlighted ? null : tokenizeCode(codeStr, lang);
  const CLR = { kw:"#C084FC", st:"#FB923C", cm:"#6B6B85", nm:"#60A5FA", op:"#94A3B8" };
  return (
    <div className="md-code-block">
      <div className="md-code-hdr">
        <span className="md-code-lang">{lang||"code"}</span>
        <div style={{display:"flex",gap:4,alignItems:"center"}}>
          {isHtmlLike && (
            <button className="md-code-copy" style={{background:"rgba(96,165,250,.15)",borderColor:"rgba(96,165,250,.4)",color:"var(--blue)"}}
              onClick={()=>{ if(window.__openCanvas) window.__openCanvas(codeStr, lang, "Aperçu HTML"); }}>▶ Canvas</button>
          )}
          <button className={"md-code-copy"+(copied?" copied":"")} onClick={copy}>
            {copied ? "✓ Copié" : "⎘ Copier"}
          </button>
        </div>
      </div>
      <div className="md-code-body">
        {highlighted
          ? <code dangerouslySetInnerHTML={{__html: window.DOMPurify ? window.DOMPurify.sanitize(highlighted) : highlighted}}
              style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"inherit",background:"none",display:"block"}}/>
          : (tokens||[]).map((tok,idx) => {
              if (tok.t==="ws"||tok.t==="id") return tok.v;
              if (CLR[tok.t]) return <span key={idx} style={{color:CLR[tok.t],fontStyle:tok.t==="cm"?"italic":"normal"}}>{tok.v}</span>;
              return tok.v;
            })
        }
      </div>
    </div>
  );
}

function parseInline(text) {
  if (!text) return [];
  const re = /\*\*(.+?)\*\*|\*(.+?)\*|__(.+?)__|~~(.+?)~~|`([^`\n]+)`|\[([^\]]+)\]\(([^)]+)\)/g;
  const parts=[]; let last=0, m, k=0;
  while ((m=re.exec(text))!==null) {
    if (m.index>last) parts.push(text.slice(last,m.index));
    if      (m[1]!==undefined) parts.push(<strong key={k++}>{m[1]}</strong>);
    else if (m[2]!==undefined) parts.push(<em key={k++}>{m[2]}</em>);
    else if (m[3]!==undefined) parts.push(<u key={k++} style={{textDecorationColor:"var(--ac)",textUnderlineOffset:"3px"}}>{m[3]}</u>);
    else if (m[4]!==undefined) parts.push(<del key={k++} style={{color:"var(--mu)"}}>{m[4]}</del>);
    else if (m[5]!==undefined) parts.push(<code key={k++} className="md-ic">{m[5]}</code>);
    else if (m[6]!==undefined) parts.push(<a key={k++} href={m[7]} target="_blank" rel="noopener noreferrer" className="md-link">{m[6]}</a>);
    last=m.index+m[0].length;
  }
  if (last<text.length) parts.push(text.slice(last));
  return parts;
}

function MarkdownRenderer({ text }) {
  if (!text) return null;
  // Split code blocks from text
  const segs=[];
  const codeRe = /```(\w*)\n?([\s\S]*?)```/g;
  let last=0, m;
  while ((m=codeRe.exec(text))!==null) {
    if (m.index>last) segs.push({type:"text",content:text.slice(last,m.index)});
    segs.push({type:"code",lang:m[1]||"",content:m[2]||""});
    last=m.index+m[0].length;
  }
  if (last<text.length) segs.push({type:"text",content:text.slice(last)});

  const renderText = (content, si) => {
    const lines=content.split("\n");
    const els=[]; let listBuf=[], listType=null, k=0;
    const flushList=()=>{
      if(!listBuf.length) return;
      const El=listType==="ol"?"ol":"ul";
      els.push(<El key={"l"+k++} className="md-list">{listBuf.map((li,j)=><li key={j}>{parseInline(li)}</li>)}</El>);
      listBuf=[]; listType=null;
    };
    for(let i=0;i<lines.length;i++){
      const line=lines[i];
      // Headers
      const hm=line.match(/^(#{1,3})\s+(.+)$/);
      if(hm){flushList();const lv=hm[1].length;const Tag="h"+lv;els.push(React.createElement(Tag,{key:k++,className:"md-h"+lv},parseInline(hm[2])));continue;}
      // HR
      if(/^-{3,}$/.test(line.trim())){flushList();els.push(<hr key={k++} className="md-hr"/>);continue;}
      // Blockquote
      if(line.startsWith("> ")){flushList();els.push(<blockquote key={k++} className="md-bq">{parseInline(line.slice(2))}</blockquote>);continue;}
      // Unordered list
      const ulm=line.match(/^[\-\*\+]\s+(.+)$/);
      if(ulm){if(listType!=="ul"){flushList();listType="ul";}listBuf.push(ulm[1]);continue;}
      // Ordered list
      const olm=line.match(/^\d+\.\s+(.+)$/);
      if(olm){if(listType!=="ol"){flushList();listType="ol";}listBuf.push(olm[1]);continue;}
      // Empty line → spacer
      if(!line.trim()){flushList();if(i>0&&i<lines.length-1)els.push(<br key={k++}/>);continue;}
      // Regular paragraph
      flushList();
      els.push(<p key={k++} className="md-p">{parseInline(line)}</p>);
    }
    flushList();
    return <div key={si}>{els}</div>;
  };

  return (
    <div className="md">
      {segs.map((seg,si)=>
        seg.type==="code"
          ? <CodeBlock key={si} code={seg.content} lang={seg.lang}/>
          : renderText(seg.content,si)
      )}
    </div>
  );
}

// ── Prompt variables {{date}}, {{heure}}, etc. ────────────────────
// ── Supprime les blocs <think>…</think> (Qwen3, DeepSeek R1) ──────

// ── Prism.js dynamic loader ─────────────────────────────────────
let _prismReady = false;
const _prismCallbacks = [];
function onPrismReady(cb) { if (_prismReady) cb(); else _prismCallbacks.push(cb); }
function loadPrism() {
  if (_prismReady || document.getElementById("prism-js")) return;
  // Theme CSS
  const link = document.createElement("link");
  link.rel = "stylesheet"; link.id = "prism-css";
  link.href = "https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css";
  document.head.appendChild(link);
  // Autoloader (handles all languages automatically)
  const script = document.createElement("script");
  script.id = "prism-js";
  script.src = "https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-core.min.js";
  script.onload = () => {
    const autoload = document.createElement("script");
    autoload.src = "https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/plugins/autoloader/prism-autoloader.min.js";
    autoload.onload = () => {
      if (window.Prism?.plugins?.autoloader) {
        window.Prism.plugins.autoloader.languages_path = "https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/";
      }
      _prismReady = true;
      _prismCallbacks.forEach(cb => cb());
    };
    document.head.appendChild(autoload);
  };
  document.head.appendChild(script);
}

function CoTBlock({ think }) {
  const [open, setOpen] = React.useState(false);
  if (!think) return null;
  const words = think.split(/\s+/).length;
  return (
    <div className="cot-block">
      <button className="cot-toggle" onClick={()=>setOpen(o=>!o)}>
        <span style={{fontSize:10}}>{open?"▼":"▶"}</span>
        <span style={{opacity:.7}}>🧠 Raisonnement interne</span>
        <span style={{marginLeft:"auto",opacity:.5}}>{words} mots</span>
        <span style={{opacity:.5}}>{open?"Masquer":"Afficher"}</span>
      </button>
      {open && <div className="cot-body">{think}</div>}
    </div>
  );
}

function stripThink(text) {
  if (!text) return text;
  return text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
}
function extractThink(text) {
  if (!text) return null;
  const m = text.match(/<think>([\s\S]*?)<\/think>/i);
  return m ? m[1].trim() : null;
}

function applyPromptVars(text) {
  const now=new Date();
  const pad=n=>String(n).padStart(2,"0");
  const vars={
    date: now.toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long",year:"numeric"}),
    heure: pad(now.getHours())+":"+pad(now.getMinutes()),
    jour:  now.toLocaleDateString("fr-FR",{weekday:"long"}),
    mois:  now.toLocaleDateString("fr-FR",{month:"long"}),
    annee: String(now.getFullYear()),
    ts:    now.toISOString(),
    today: now.toLocaleDateString("fr-FR"),
  };
  return text.replace(/\{\{(\w+)\}\}/g,(_,k)=>vars[k]!==undefined?vars[k]:"{{"+k+"}}");
}
const S = `
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,400;0,600;1,400&family=Inter:wght@300;400;500;600;700&family=Syne:wght@400;600;700;800&display=swap');
@import url('https://fonts.cdnfonts.com/css/geist');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--bg:#09090B;--s1:#0F0F13;--s2:#16161C;--bd:#222228;--tx:#DDDDE8;--mu:#555568;--ac:#D4A853;--green:#4ADE80;--red:#F87171;--orange:#FB923C;--blue:#60A5FA;--r:7px;--font-ui:'Inter',system-ui,sans-serif;--font-mono:'IBM Plex Mono',monospace;--font-display:'Geist','Syne',sans-serif}
html{font-size:16px}
body{background:var(--bg);color:var(--tx);font-family:var(--font-ui);overflow:hidden}
.app{display:flex;flex-direction:column;height:100vh;height:100dvh;overflow:hidden}
.nav{padding:clamp(5px,1.2vw,9px) clamp(8px,2vw,14px);border-bottom:1px solid rgba(255,255,255,.07);display:flex;align-items:center;gap:clamp(5px,1.2vw,9px);background:rgba(13,13,17,.82);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);flex-shrink:0;flex-wrap:wrap;min-height:42px;position:sticky;top:0;z-index:200}
.logo{font-family:'Syne',sans-serif;font-weight:800;font-size:clamp(13px,2.5vw,17px);color:var(--ac);white-space:nowrap}
.logo em{color:var(--mu);font-style:normal;font-weight:400}
.nav-tabs{display:flex;gap:2px;background:var(--s1);border:1px solid var(--bd);border-radius:6px;padding:2px;flex-wrap:wrap}
.nt{padding:clamp(3px,.8vw,5px) clamp(7px,1.8vw,11px);border-radius:4px;font-size:clamp(8px,1.6vw,10px);font-family:'IBM Plex Mono',monospace;border:none;cursor:pointer;transition:all .15s;color:var(--mu);background:transparent;white-space:nowrap}
.nt.on{background:var(--ac);color:#09090B;font-weight:600}
.pills{display:flex;gap:3px;margin-left:auto;flex-wrap:wrap;align-items:center}
.pill{display:flex;align-items:center;gap:3px;padding:clamp(2px,.6vw,4px) clamp(5px,1.2vw,8px);border-radius:4px;border:1px solid;font-family:'IBM Plex Mono',monospace;font-size:clamp(7px,1.4vw,10px);cursor:pointer;transition:all .18s;background:transparent;white-space:nowrap}
.pill:hover{filter:brightness(1.2)}
.pfree{font-size:7px;padding:1px 3px;border-radius:2px;background:rgba(74,222,128,.15);color:var(--green);font-weight:700}
.btn-xs{background:transparent;border:1px solid var(--bd);color:var(--mu);padding:3px 7px;border-radius:4px;font-size:9px;font-family:'IBM Plex Mono',monospace;cursor:pointer}
.btn-xs:hover{border-color:var(--red);color:var(--red)}
.tbar{padding:3px clamp(8px,2vw,14px);border-bottom:1px solid var(--bd);display:flex;align-items:center;gap:clamp(5px,1.5vw,10px);font-size:8px;color:var(--mu);flex-shrink:0;flex-wrap:wrap}
.tbar-lbl{color:var(--ac);font-weight:700;letter-spacing:1px;font-size:7px}
.ti{display:flex;align-items:center;gap:3px;flex-shrink:0}
.tr{width:clamp(24px,4vw,44px);height:3px;background:var(--bd);border-radius:2px;overflow:hidden}
.tf{height:100%;border-radius:2px;transition:width .4s}
.tbar-total{margin-left:auto;white-space:nowrap}
.cols{display:flex;flex:1;overflow-y:auto;overflow-x:hidden;flex-direction:column;scrollbar-width:thin;scrollbar-color:var(--bd) transparent}
.col{flex:none;display:flex;flex-direction:column;border-bottom:1px solid var(--bd);overflow:hidden;width:100%;min-height:clamp(300px,42vh,520px);transition:opacity .3s,filter .3s,box-shadow .35s ease,outline .35s ease}
.col:last-child{border-bottom:none}
.col.off{opacity:.10;filter:grayscale(1);pointer-events:none}
.col.solo-dim{opacity:.10;filter:grayscale(1);pointer-events:none}
.col.solo-focus{min-height:clamp(480px,70vh,800px)}
/* ── HISTORY SIDEBAR ── */
.hist-sidebar{width:170px;flex-shrink:0;border-right:1px solid rgba(255,255,255,.06);display:flex;flex-direction:column;background:rgba(10,10,14,.88);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);overflow:hidden;transition:width .2s}
.hist-sidebar.closed{width:0;border-right:none}
.hist-folder-tabs{display:flex;gap:2px;padding:5px 6px;flex-wrap:wrap;border-bottom:1px solid var(--bd);flex-shrink:0;background:var(--s1)}
.hist-folder-tab{padding:2px 7px;border-radius:3px;border:1px solid transparent;font-size:8px;cursor:pointer;color:var(--mu);background:transparent;font-family:'IBM Plex Mono',monospace;white-space:nowrap;transition:all .15s;max-width:80px;overflow:hidden;text-overflow:ellipsis}
.hist-folder-tab:hover{background:rgba(255,255,255,.05);color:var(--tx)}
.hist-folder-tab.active{background:rgba(212,168,83,.12);border-color:rgba(212,168,83,.3);color:var(--ac)}
.hist-folder-add{padding:2px 5px;border-radius:3px;border:1px dashed rgba(255,255,255,.15);font-size:8px;cursor:pointer;color:var(--mu);background:transparent;font-family:'IBM Plex Mono',monospace}
.hist-hdr{padding:8px 10px;border-bottom:1px solid var(--bd);display:flex;align-items:center;gap:6px;flex-shrink:0}
.hist-hdr-title{font-family:'Syne',sans-serif;font-weight:700;font-size:10px;color:var(--tx);flex:1;white-space:nowrap;overflow:hidden}
.hist-new-btn{background:rgba(212,168,83,.12);border:1px solid rgba(212,168,83,.35);border-radius:4px;color:var(--ac);font-size:9px;font-weight:700;cursor:pointer;padding:3px 7px;font-family:'IBM Plex Mono',monospace;white-space:nowrap;transition:all .15s}
.hist-new-btn:hover{background:rgba(212,168,83,.22)}
.hist-save-btn{background:rgba(74,222,128,.08);border:1px solid rgba(74,222,128,.3);border-radius:4px;color:var(--green);font-size:9px;font-weight:700;cursor:pointer;padding:3px 7px;font-family:'IBM Plex Mono',monospace;white-space:nowrap}
.hist-save-btn:hover{background:rgba(74,222,128,.16)}
.hist-list{flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:0;scrollbar-width:thin;scrollbar-color:var(--bd) transparent}
.hist-empty{padding:20px 12px;text-align:center;font-size:9px;color:var(--mu);line-height:1.7}
.hist-item{padding:9px 10px;border-bottom:1px solid var(--bd);cursor:pointer;transition:background .15s;display:flex;flex-direction:column;gap:3px;position:relative}
.hist-item:hover{background:rgba(255,255,255,.04)}
.hist-item.active{background:rgba(212,168,83,.07);border-left:2px solid var(--ac)}
.hist-item-title{font-size:10px;font-weight:600;color:var(--tx);line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;padding-right:16px}
.hist-item-meta{display:flex;align-items:center;gap:5px;flex-wrap:wrap}
.hist-item-date{font-size:8px;color:var(--mu)}
.hist-item-ias{display:flex;gap:2px}
.hist-item-ia{font-size:7px;padding:1px 3px;border-radius:2px;font-weight:600}
.hist-item-del{position:absolute;top:7px;right:7px;background:none;border:none;color:var(--mu);cursor:pointer;font-size:11px;padding:1px 3px;border-radius:3px;opacity:0;transition:opacity .15s}
.hist-item:hover .hist-item-del{opacity:1}
.hist-item:hover .hist-item-folder-sel{opacity:1 !important}
.hist-item-del:hover{color:var(--red)}
.hist-toggle{background:var(--s1);border:none;border-right:1px solid var(--bd);color:var(--mu);cursor:pointer;font-size:11px;padding:0 5px;writing-mode:vertical-lr;letter-spacing:1px;transition:background .15s;flex-shrink:0;display:flex;align-items:center;justify-content:center;min-height:40px}
.hist-toggle:hover{background:var(--s2);color:var(--tx)}
.chat-area{flex:1;display:flex;flex-direction:column;overflow:hidden}
.ch{padding:clamp(5px,1vw,7px) clamp(7px,1.5vw,11px);border-bottom:1px solid;display:flex;align-items:center;gap:5px;flex-shrink:0;background:rgba(15,15,20,.82);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);position:sticky;top:0;z-index:10}
.ch-actions{display:flex;gap:3px;margin-left:auto;flex-shrink:0;align-items:center}
.ch-btn{background:none;border:1px solid transparent;border-radius:3px;color:var(--mu);cursor:pointer;font-size:10px;padding:2px 4px;transition:all .15s;line-height:1;font-family:'IBM Plex Mono',monospace}
.ch-btn:hover{border-color:var(--bd);color:var(--tx);background:rgba(255,255,255,.05)}
.ch-btn.solo-on{border-color:var(--ac);color:var(--ac);background:rgba(212,168,83,.12)}
.ci{font-size:clamp(10px,1.8vw,13px)}
.cn{font-family:'Syne',sans-serif;font-weight:700;font-size:clamp(8px,1.5vw,10px);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.csub{font-size:7px;color:var(--mu)}
.cm{margin-left:auto;display:flex;align-items:center;gap:4px;flex-shrink:0;margin-right:4px}
.mt{font-size:7px;color:var(--mu);white-space:nowrap}
.dot{width:5px;height:5px;border-radius:50%;background:var(--mu);flex-shrink:0}
.dot.live{background:var(--green);box-shadow:0 0 6px var(--green);animation:pulse 1.5s infinite}
.dot.limited{background:var(--red)}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.25}}
/* ── Tab transitions (Framer Motion-like) ── */
@keyframes tabEnter{from{opacity:0;transform:translateY(8px) scale(.99)}to{opacity:1;transform:translateY(0) scale(1)}}
@keyframes tabEnterLeft{from{opacity:0;transform:translateX(-18px)}to{opacity:1;transform:translateX(0)}}
@keyframes tabEnterRight{from{opacity:0;transform:translateX(18px)}to{opacity:1;transform:translateX(0)}}
.tab-animate{animation:tabEnter .22s cubic-bezier(.4,0,.2,1) both}
.tab-animate-left{animation:tabEnterLeft .22s cubic-bezier(.4,0,.2,1) both}
.tab-animate-right{animation:tabEnterRight .22s cubic-bezier(.4,0,.2,1) both}

@keyframes pulse-glow{0%,100%{opacity:.5;transform:scale(1)}50%{opacity:1;transform:scale(1.25)}}
@keyframes stream-bar-anim{0%{background-position:0% 50%}100%{background-position:200% 50%}}
@keyframes fadeInUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
.countdown{font-size:8px;color:var(--red);white-space:nowrap;font-family:'IBM Plex Mono',monospace;background:rgba(248,113,113,.1);border:1px solid rgba(248,113,113,.3);border-radius:3px;padding:1px 5px}
.msgs{flex:1;overflow-y:auto;padding:clamp(5px,1.2vw,9px);display:flex;flex-direction:column;gap:5px;scrollbar-width:thin;scrollbar-color:var(--bd) transparent}
.msg{padding:clamp(5px,1vw,8px) clamp(7px,1.5vw,10px);border-radius:5px;font-size:clamp(9px,1.6vw,12px);line-height:1.72;border:1px solid var(--bd);font-family:var(--font-ui)}
.msg.u{background:#15151B;color:var(--mu);font-style:italic}
.msg.u::before{content:'> ';color:var(--ac)}
.msg.a{background:var(--s1);color:var(--tx)}
.msg.e{color:var(--red);background:#180808;border-color:#350A0A}
.msg.ld{color:var(--mu);background:var(--s1)}
.scroll-to-bottom{position:absolute;bottom:10px;right:10px;background:rgba(212,168,83,.2);border:1px solid rgba(212,168,83,.4);border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:12px;color:var(--ac);z-index:20;backdrop-filter:blur(6px);transition:opacity .2s;box-shadow:0 2px 8px rgba(0,0,0,.4)}
.msg.blocked{color:var(--orange);background:rgba(251,146,60,.08);border-color:rgba(251,146,60,.3);font-size:10px}
.dots span{animation:blink 1.2s infinite;font-size:14px;line-height:0}
.dots span:nth-child(2){animation-delay:.2s}.dots span:nth-child(3){animation-delay:.4s}
@keyframes blink{0%,80%,100%{opacity:.15}40%{opacity:1}}
.empty{color:var(--mu);font-size:9px;text-align:center;margin-top:clamp(14px,3vh,28px);font-style:italic}
.foot{padding:clamp(6px,1.2vw,9px) clamp(8px,2vw,14px);border-top:1px solid var(--bd);flex-shrink:0;background:var(--bg)}
.ir{display:flex;gap:6px;align-items:flex-end}
.ta-wrap{flex:1;position:relative}
textarea{width:100%;background:var(--s1);border:1px solid var(--bd);border-radius:6px;color:var(--tx);font-family:'IBM Plex Mono',monospace;font-size:clamp(11px,1.9vw,13px);padding:clamp(6px,1.2vw,9px) clamp(8px,1.8vw,11px);resize:none;outline:none;line-height:1.5;max-height:100px;transition:border-color .2s}
textarea:focus{border-color:var(--ac)}
textarea::placeholder{color:var(--mu)}
.foot-btns{display:flex;gap:5px;align-items:flex-end}
.sbtn{background:var(--ac);color:#09090B;border:none;border-radius:6px;width:clamp(30px,4.5vw,38px);height:clamp(30px,4.5vw,38px);cursor:pointer;font-size:15px;font-weight:bold;display:flex;align-items:center;justify-content:center;transition:all .2s;flex-shrink:0}
.sbtn:hover{background:#E8BC6A;transform:scale(1.05)}
.sbtn:disabled{opacity:.36;cursor:not-allowed;transform:none}
.gbtn{background:var(--s2);border:1px solid var(--bd);color:var(--mu);border-radius:6px;width:clamp(30px,4.5vw,38px);height:clamp(30px,4.5vw,38px);cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;transition:all .2s;flex-shrink:0;position:relative}
.gbtn:hover{border-color:var(--green);color:var(--green)}
.gbtn.loading{animation:glow .8s infinite alternate}
@keyframes glow{from{box-shadow:none}to{box-shadow:0 0 8px var(--ac)}}
.grammar-popup{position:absolute;bottom:calc(100% + 8px);left:0;right:0;background:var(--s2);border:1px solid var(--ac);border-radius:8px;padding:10px;z-index:50;font-size:10px;min-width:200px}
.gp-title{color:var(--ac);font-weight:600;font-size:8px;letter-spacing:.8px;margin-bottom:6px}
.gp-orig{color:var(--mu);text-decoration:line-through;font-size:9px;margin-bottom:3px}
.gp-corr{color:var(--green);font-size:10px}
.gp-btns{display:flex;gap:5px;margin-top:8px}
.gp-btn{flex:1;padding:4px 8px;border-radius:4px;font-size:9px;font-family:'IBM Plex Mono',monospace;cursor:pointer;border:1px solid var(--bd);background:transparent;color:var(--mu)}
.gp-btn.apply{background:var(--ac);border-color:var(--ac);color:#09090B;font-weight:600}
.fhint{margin-top:4px;font-size:clamp(7px,1.3vw,9px);color:var(--mu);text-align:center}
.mobile-col-tabs{display:none}
@media(max-width:768px){
  body{overflow:auto}.app{height:100dvh;overflow:hidden}
  .tbar{display:none}.pills{display:none}
  .col{flex:none;height:100dvh}.col.mobile-hidden{display:none}
  .mobile-col-tabs{display:flex !important;padding:4px 8px;gap:4px;overflow-x:auto;border-bottom:1px solid var(--bd);flex-shrink:0;background:var(--s1);scrollbar-width:none}
  .mobile-col-tabs::-webkit-scrollbar{display:none}
  .mct-btn{padding:4px 10px;border-radius:4px;border:1px solid var(--bd);font-size:10px;font-family:'IBM Plex Mono',monospace;cursor:pointer;background:transparent;color:var(--mu);white-space:nowrap;flex-shrink:0}
  .mct-btn.active{background:var(--ac);color:#09090B;border-color:var(--ac);font-weight:600}
  .nav{padding:5px 8px}
}
.scroll-tab{flex:1;overflow-y:auto;scrollbar-width:thin;scrollbar-color:var(--bd) transparent}
.pad{padding:clamp(10px,2vw,18px)}
.web-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(clamp(150px,20vw,210px),1fr));gap:clamp(7px,1.3vw,11px)}
.web-card{background:var(--s1);border:1px solid var(--bd);border-radius:9px;padding:clamp(11px,2vw,15px);display:flex;flex-direction:column;gap:9px;transition:border-color .2s,transform .2s}
.web-card:hover{transform:translateY(-2px)}
.wc-hdr{display:flex;align-items:center;gap:8px}
.wc-icon{width:clamp(26px,3.5vw,34px);height:clamp(26px,3.5vw,34px);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:clamp(11px,1.8vw,15px);font-weight:700;flex-shrink:0}
.wc-name{font-family:'Syne',sans-serif;font-weight:700;font-size:clamp(10px,1.8vw,12px)}
.wc-sub{font-size:8px;color:var(--mu)}
.wc-desc{font-size:clamp(9px,1.5vw,11px);color:var(--mu);line-height:1.5;flex:1}
.wc-btn{display:flex;align-items:center;justify-content:center;gap:5px;padding:7px;border-radius:6px;border:1px solid;font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:600;cursor:pointer;background:transparent;text-decoration:none;transition:all .2s}
.wc-btn:hover{opacity:.8;transform:scale(1.02)}
.debate-wrap{flex:1;overflow-y:auto;display:flex;flex-direction:column;scrollbar-width:thin;scrollbar-color:var(--bd) transparent}
.debate-intro{padding:clamp(14px,3.5vw,26px);display:flex;flex-direction:column;align-items:center;gap:12px;flex:1;justify-content:center;text-align:center}
.debate-title{font-family:'Syne',sans-serif;font-size:clamp(15px,3vw,21px);font-weight:800;color:var(--ac)}
.debate-desc{font-size:clamp(10px,1.7vw,12px);color:var(--mu);line-height:1.7;max-width:480px}
.phase-block{border-bottom:1px solid var(--bd);flex-shrink:0}
.phase-header{padding:8px clamp(10px,2vw,16px);display:flex;align-items:center;gap:7px;cursor:pointer;background:var(--s1);user-select:none}
.phase-header:hover{background:var(--s2)}
.ph-badge{padding:2px 6px;border-radius:3px;font-size:7px;font-weight:600;letter-spacing:1px}
.ph-title{font-family:'Syne',sans-serif;font-size:clamp(10px,1.8vw,12px);font-weight:700}
.ph-chev{margin-left:auto;color:var(--mu);transition:transform .2s}
.ph-chev.open{transform:rotate(180deg)}
.phase-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(clamp(170px,26vw,250px),1fr));border-top:1px solid var(--bd)}
.pg-cell{padding:clamp(7px,1.5vw,11px);border-right:1px solid var(--bd);border-bottom:1px solid var(--bd)}
.pgc-hdr{display:flex;align-items:center;gap:5px;margin-bottom:5px}
.pgc-body{font-size:clamp(9px,1.6vw,11px);line-height:1.68;color:var(--tx)}
.pgc-body.mu{color:var(--mu);font-style:italic}
.syn-block{margin:clamp(7px,1.5vw,12px);border:1px solid var(--ac);border-radius:9px;overflow:hidden;flex-shrink:0}
.syn-hdr{padding:9px clamp(10px,2vw,14px);background:linear-gradient(90deg,#1A1208,#0F0F13);display:flex;align-items:center;gap:7px;border-bottom:1px solid var(--ac)}
.syn-title{font-family:'Syne',sans-serif;font-size:clamp(10px,1.8vw,13px);font-weight:800;color:var(--ac)}
.syn-by{font-size:9px;color:var(--mu);margin-left:auto}
.syn-body{padding:clamp(9px,1.8vw,13px);font-size:clamp(10px,1.7vw,12px);line-height:1.72;color:var(--tx);background:var(--s1)}
.syn-body.mu{color:var(--mu);font-style:italic}
.debate-foot{padding:clamp(7px,1.5vw,11px) clamp(8px,2vw,14px);border-top:1px solid var(--bd);background:var(--bg);flex-shrink:0}
.launch-btn{background:var(--ac);color:#09090B;border:none;border-radius:6px;padding:0 clamp(11px,2.2vw,17px);height:clamp(30px,4.5vw,38px);font-family:'IBM Plex Mono',monospace;font-size:clamp(9px,1.6vw,11px);font-weight:600;cursor:pointer;transition:all .2s;white-space:nowrap;flex-shrink:0}
.launch-btn:hover{background:#E8BC6A}
.launch-btn:disabled{opacity:.36;cursor:not-allowed}
.prog-bar{height:3px;background:var(--bd);border-radius:2px;overflow:hidden;margin:5px clamp(8px,2vw,14px) 0}
.prog-fill{height:100%;background:var(--ac);border-radius:2px;transition:width .5s}
.prog-lbl{padding:3px clamp(8px,2vw,14px) 5px;font-size:8px;color:var(--mu)}
.cfg-wrap{flex:1;overflow-y:auto;padding:clamp(11px,2.2vw,18px);scrollbar-width:thin;scrollbar-color:var(--bd) transparent}
.sec-title{font-family:'Syne',sans-serif;font-size:clamp(10px,1.8vw,13px);font-weight:800;color:var(--ac);margin-bottom:10px;padding-bottom:5px;border-bottom:1px solid var(--bd);display:flex;align-items:center;gap:7px}
.sec{margin-bottom:20px}
.tbl-wrap{overflow-x:auto}
.tbl{width:100%;border-collapse:collapse;border:1px solid var(--bd);border-radius:7px;overflow:hidden;min-width:500px}
.tbl th{padding:5px 9px;background:var(--s1);font-size:8px;color:var(--mu);text-align:left;font-weight:600;letter-spacing:.8px;border-bottom:1px solid var(--bd)}
.tbl td{padding:7px 9px;border-bottom:1px solid var(--bd);font-size:clamp(9px,1.6vw,11px);vertical-align:middle}
.tbl tr:last-child td{border-bottom:none}
.tbl tr:hover td{background:var(--s1)}
.sbadge{display:inline-flex;align-items:center;gap:3px;padding:2px 6px;border-radius:3px;font-size:8px;font-weight:600}
.free-badge{display:inline-flex;padding:1px 4px;border-radius:3px;font-size:7px;font-weight:700;background:rgba(74,222,128,.12);color:var(--green);margin-left:3px}
.key-row{display:flex;gap:4px;align-items:center}
.key-inp{flex:1;background:var(--bg);border:1px solid var(--bd);border-radius:4px;color:var(--tx);font-family:'IBM Plex Mono',monospace;font-size:10px;padding:5px 7px;outline:none;min-width:0}
.key-inp:focus{border-color:var(--ac)}
.key-inp::placeholder{color:var(--mu)}
.key-link{color:var(--ac);text-decoration:none;font-size:8px;white-space:nowrap;border:1px solid var(--bd);padding:3px 6px;border-radius:3px}
.key-link:hover{border-color:var(--ac)}
.save-btn{background:var(--ac);color:#09090B;border:none;border-radius:3px;padding:4px 7px;font-family:'IBM Plex Mono',monospace;font-size:8px;font-weight:600;cursor:pointer;white-space:nowrap}
.save-btn:disabled{opacity:.35;cursor:not-allowed}
.file-btns{display:flex;gap:7px;flex-wrap:wrap}
.fbtn{display:flex;align-items:center;gap:5px;padding:clamp(6px,1.2vw,9px) clamp(9px,1.8vw,13px);border-radius:6px;font-family:'IBM Plex Mono',monospace;font-size:clamp(8px,1.6vw,10px);cursor:pointer;transition:all .2s;border:1px solid var(--bd);background:var(--s1);color:var(--tx)}
.fbtn:hover{border-color:var(--ac);color:var(--ac)}
.fbtn.p{background:var(--ac);color:#09090B;border-color:var(--ac);font-weight:600}
.fbtn.p:hover{background:#E8BC6A}
.cfg-note{font-size:clamp(8px,1.4vw,10px);color:var(--mu);line-height:1.6;margin-top:6px;padding:8px;background:var(--s1);border-radius:5px;border:1px solid var(--bd)}
.cfg-note code{color:var(--ac);background:var(--bg);padding:1px 4px;border-radius:3px;font-size:10px}
.ps-block{background:#0A0A0F;border:1px solid var(--bd);border-radius:7px;overflow:hidden;margin:8px 0}
.ps-hdr{padding:5px 12px;background:var(--s2);border-bottom:1px solid var(--bd);display:flex;align-items:center;justify-content:space-between}
.ps-lang{font-size:9px;color:var(--ac);font-weight:700;letter-spacing:.5px}
.ps-copy{font-size:9px;color:var(--mu);cursor:pointer;padding:2px 6px;border:1px solid var(--bd);border-radius:3px;background:transparent;font-family:'IBM Plex Mono',monospace}
.ps-copy:hover{color:var(--green);border-color:var(--green)}
.ps-code{padding:10px 14px;overflow-x:auto}
.ps-code pre{font-family:'IBM Plex Mono',monospace;font-size:11px;color:#C8C8E0;line-height:1.7;white-space:pre}
.ps-comment{color:#555568;font-style:italic}
.ps-cmd{color:var(--green)}
.ps-arg{color:var(--ac)}
.ps-str{color:#FB923C}
.status-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(90px,1fr));gap:5px}
.sc{padding:6px 9px;border-radius:6px;border:1px solid}
input[type=file]{display:none}
.toast{position:fixed;bottom:clamp(10px,2.5vw,18px);right:clamp(10px,2.5vw,18px);background:var(--s2);border:1px solid var(--bd);border-radius:7px;padding:7px 13px;font-size:11px;color:var(--tx);z-index:999;animation:tin .3s ease;display:flex;align-items:center;gap:7px;max-width:280px}
@keyframes tin{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
.ov{position:fixed;inset:0;background:rgba(0,0,0,.85);display:flex;align-items:center;justify-content:center;z-index:300;backdrop-filter:blur(5px);padding:16px}
.modal{background:#111116;border:1px solid var(--bd);border-radius:11px;padding:clamp(14px,2.5vw,22px);width:100%;max-width:360px}
.modal h3{font-family:'Syne',sans-serif;font-size:clamp(12px,2.2vw,15px);font-weight:700;margin-bottom:4px}
.modal p{font-size:clamp(9px,1.6vw,10px);color:var(--mu);margin-bottom:11px;line-height:1.6}
.modal a{color:var(--ac);text-decoration:none}
.modal input{width:100%;background:var(--bg);border:1px solid var(--bd);border-radius:5px;color:var(--tx);font-family:'IBM Plex Mono',monospace;font-size:12px;padding:8px 10px;outline:none;margin-bottom:11px}
.modal input:focus{border-color:var(--ac)}
.mbtns{display:flex;gap:7px;justify-content:flex-end}
.mbg{background:transparent;border:1px solid var(--bd);color:var(--mu);padding:5px 11px;border-radius:4px;font-family:'IBM Plex Mono',monospace;font-size:9px;cursor:pointer}
.mbs{background:var(--ac);border:none;color:#09090B;padding:5px 11px;border-radius:4px;font-family:'IBM Plex Mono',monospace;font-size:9px;font-weight:600;cursor:pointer}
.mbs:disabled{opacity:.36;cursor:not-allowed}
.exp-json{width:100%;background:var(--bg);border:1px solid var(--bd);border-radius:5px;color:var(--green);font-family:'IBM Plex Mono',monospace;font-size:9px;padding:8px;resize:none;outline:none;height:120px;margin-bottom:9px}
.copy-btn{background:var(--green);color:#09090B;border:none;padding:5px 11px;border-radius:4px;font-family:'IBM Plex Mono',monospace;font-size:9px;font-weight:600;cursor:pointer}
.arena-wrap{flex:1;overflow-y:auto;padding:clamp(10px,2vw,16px);scrollbar-width:thin;scrollbar-color:var(--bd) transparent}
.arena-hero{text-align:center;padding:clamp(14px,3vw,24px) 0 clamp(10px,2vw,18px);margin-bottom:clamp(10px,2vw,18px);border-bottom:1px solid var(--bd)}
.arena-title{font-family:'Syne',sans-serif;font-size:clamp(18px,3.5vw,26px);font-weight:800;color:var(--ac);margin-bottom:6px}
.arena-sub{font-size:clamp(9px,1.6vw,11px);color:var(--mu);line-height:1.7;max-width:600px;margin:0 auto}
.criteria-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(clamp(120px,18vw,180px),1fr));gap:8px;margin-bottom:clamp(12px,2.5vw,20px)}
.crit-card{background:var(--s1);border:1px solid var(--bd);border-radius:8px;padding:10px 12px}
.crit-icon{font-size:18px;margin-bottom:5px}
.crit-title{font-family:'Syne',sans-serif;font-size:10px;font-weight:700;color:var(--tx);margin-bottom:3px}
.crit-desc{font-size:9px;color:var(--mu);line-height:1.5}
.arena-tbl{width:100%;border-collapse:collapse;border:1px solid var(--bd);border-radius:8px;overflow:hidden;min-width:700px}
.arena-tbl th{padding:6px 10px;background:var(--s1);font-size:8px;color:var(--mu);text-align:left;font-weight:600;letter-spacing:.7px;border-bottom:1px solid var(--bd)}
.arena-tbl td{padding:8px 10px;border-bottom:1px solid var(--bd);font-size:clamp(9px,1.5vw,11px);vertical-align:middle}
.arena-tbl tr:last-child td{border-bottom:none}
.arena-tbl tr:hover td{background:rgba(255,255,255,.02)}
.score-bar{display:flex;align-items:center;gap:5px}
.score-num{font-weight:700;font-size:12px;min-width:28px}
.score-bg{flex:1;height:5px;background:var(--bd);border-radius:3px;overflow:hidden;min-width:40px}
.score-fill{height:100%;border-radius:3px}
.tag-badge{display:inline-flex;padding:1px 5px;border-radius:3px;font-size:7px;font-weight:700;letter-spacing:.5px;background:rgba(212,168,83,.12);color:var(--ac)}
.prix-badge{font-family:'IBM Plex Mono',monospace;font-size:10px}
.params-badge{font-family:'IBM Plex Mono',monospace;font-size:9px;color:var(--blue)}
.news-grid{display:flex;flex-direction:column;gap:8px;margin-top:10px}
.rss-wrap{background:var(--s1);border:1px solid var(--bd);border-radius:10px;overflow:hidden;margin-bottom:20px}
.rss-head{padding:10px 14px;background:linear-gradient(90deg,#0A0F0A,#0F0F13);border-bottom:1px solid var(--bd);display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.rss-title{font-family:'Syne',sans-serif;font-size:13px;font-weight:800;color:var(--green)}
.rss-src-tabs{display:flex;gap:4px;flex-wrap:wrap;flex:1}
.rss-stab{padding:2px 8px;border-radius:3px;font-size:8px;font-family:'IBM Plex Mono',monospace;cursor:pointer;border:1px solid var(--bd);background:transparent;color:var(--mu);transition:all .15s}
.rss-stab.on{background:var(--green);color:#09090B;border-color:var(--green);font-weight:700}
.rss-stab:hover{border-color:var(--green);color:var(--green)}
.rss-refresh{font-size:9px;color:var(--mu);cursor:pointer;padding:2px 7px;border:1px solid var(--bd);border-radius:3px;background:transparent;font-family:'IBM Plex Mono',monospace}
.rss-refresh:hover{color:var(--green);border-color:var(--green)}
.rss-loading{padding:20px;text-align:center;color:var(--mu);font-size:10px;font-style:italic}
.rss-err{padding:12px 14px;color:var(--orange);font-size:10px;background:rgba(251,146,60,.07)}
.rss-list{display:flex;flex-direction:column;gap:0}
.rss-item{display:flex;flex-direction:column;padding:12px 14px;border-bottom:1px solid var(--bd);text-decoration:none;transition:background .15s;cursor:pointer}
.rss-item:last-child{border-bottom:none}
.rss-item:hover{background:rgba(255,255,255,.03)}
.rss-item-hdr{display:flex;gap:8px;align-items:flex-start}
.rss-item-hdr-left{flex:1;min-width:0}
.rss-src-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;margin-top:4px}
.rss-body{flex:1;min-width:0}
.rss-ititle{font-size:clamp(10px,1.7vw,12px);font-weight:600;color:var(--tx);line-height:1.45;margin-bottom:4px}
.rss-item:hover .rss-ititle{color:var(--ac)}
.rss-meta{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.rss-site{font-size:8px;font-weight:700;padding:1px 5px;border-radius:3px}
.rss-date{font-size:8px;color:var(--mu)}
.rss-summary{font-size:clamp(9px,1.4vw,10px);color:var(--mu);line-height:1.6;margin-top:5px}
.rss-expand-body{margin-top:8px;padding-top:8px;border-top:1px solid var(--bd);display:flex;flex-direction:column;gap:7px}
.rss-detail{font-size:clamp(9px,1.4vw,10px);color:#9DB4CC;line-height:1.6}
.rss-impact{font-size:clamp(8px,1.3vw,9px);color:var(--green);padding:5px 8px;background:rgba(74,222,128,.06);border-radius:4px;border-left:2px solid var(--green)}
.rss-expand-footer{display:flex;align-items:center;gap:8px;margin-top:4px;flex-wrap:wrap}
.rss-gnews-btn{display:inline-flex;align-items:center;gap:4px;padding:4px 10px;background:rgba(212,168,83,.1);border:1px solid rgba(212,168,83,.3);border-radius:4px;color:var(--ac);font-size:9px;font-weight:600;text-decoration:none;font-family:'IBM Plex Mono',monospace;transition:all .2s}
.rss-gnews-btn:hover{background:rgba(212,168,83,.2)}
.rss-toggle{margin-left:auto;background:none;border:none;color:var(--mu);cursor:pointer;font-size:9px;font-family:'IBM Plex Mono',monospace;padding:2px 6px;border-radius:3px;transition:color .2s}
.rss-toggle:hover{color:var(--tx)}
.rss-arrow{font-size:11px;color:var(--mu);flex-shrink:0;margin-top:1px;transition:color .2s}
.rss-item:hover .rss-arrow{color:var(--ac)}
.live-dot{display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--green);animation:pulse 1.5s infinite;margin-right:5px}
.news-card{background:var(--s1);border:1px solid var(--bd);border-radius:8px;padding:10px 13px;display:flex;gap:10px}
.news-icon{font-size:20px;flex-shrink:0;margin-top:2px}
.news-body{flex:1}
.news-hdr{display:flex;align-items:center;gap:7px;margin-bottom:4px;flex-wrap:wrap}
.news-title{font-family:'Syne',sans-serif;font-size:clamp(10px,1.8vw,12px);font-weight:700}
.news-date{font-size:8px;color:var(--mu)}
.news-tag{padding:1px 5px;border-radius:3px;font-size:7px;font-weight:700;letter-spacing:.5px}
.news-text{font-size:clamp(9px,1.5vw,11px);color:var(--mu);line-height:1.6}
.img-wrap{flex:1;overflow-y:auto;padding:clamp(10px,2vw,16px);scrollbar-width:thin;scrollbar-color:var(--bd) transparent}
.img-filter{display:flex;gap:5px;flex-wrap:wrap;margin-bottom:clamp(10px,2vw,16px)}
.filter-btn{padding:4px 10px;border-radius:4px;font-size:9px;font-family:var(--font-ui);cursor:pointer;border:1px solid var(--bd);background:transparent;color:var(--mu);transition:all .2s}
.filter-btn.on{background:var(--ac);color:#09090B;border-color:var(--ac);font-weight:600}
.filter-btn:hover{border-color:var(--ac)}
.img-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(clamp(220px,28vw,300px),1fr));gap:clamp(8px,1.5vw,12px)}
.img-card{background:var(--s1);border:1px solid var(--bd);border-radius:10px;padding:clamp(12px,2vw,16px);display:flex;flex-direction:column;gap:10px;transition:border-color .2s,transform .15s}
.img-card:hover{transform:translateY(-2px)}
.img-card.oss{border-color:rgba(74,222,128,.2)}
.ic-hdr{display:flex;align-items:center;gap:9px}
.ic-icon{width:clamp(30px,4vw,40px);height:clamp(30px,4vw,40px);border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:clamp(14px,2.2vw,18px);flex-shrink:0}
.ic-name{font-family:'Syne',sans-serif;font-weight:700;font-size:clamp(11px,1.9vw,13px)}
.ic-sub{font-size:8px;color:var(--mu)}
.ic-free{display:inline-flex;padding:2px 7px;border-radius:4px;font-size:8px;font-weight:700}
.ic-meters{display:grid;grid-template-columns:repeat(3,1fr);gap:5px}
.meter-item{text-align:center}
.meter-lbl{font-size:7px;color:var(--mu);margin-bottom:3px}
.meter-bg{height:4px;background:var(--bd);border-radius:2px;overflow:hidden}
.meter-fill{height:100%;border-radius:2px}
.meter-val{font-size:8px;font-weight:700;margin-top:2px}
.ic-desc{font-size:clamp(9px,1.5vw,11px);color:var(--mu);line-height:1.55;flex:1}
.ic-strengths{display:flex;flex-wrap:wrap;gap:4px}
.ic-str{padding:1px 6px;border-radius:3px;font-size:8px;background:rgba(255,255,255,.05);border:1px solid var(--bd);color:var(--mu)}
.ic-limits{font-size:8px;color:var(--orange);padding:4px 7px;background:rgba(251,146,60,.07);border-radius:4px;border:1px solid rgba(251,146,60,.2)}
.ic-btn{display:flex;align-items:center;justify-content:center;gap:5px;padding:8px;border-radius:6px;border:1px solid;font-family:'IBM Plex Mono',monospace;font-size:9px;font-weight:600;cursor:pointer;background:transparent;text-decoration:none;transition:all .2s}
.ic-btn:hover{opacity:.8;transform:scale(1.01)}
.ic-tags{display:flex;flex-wrap:wrap;gap:3px}
.ic-tag{padding:1px 5px;border-radius:3px;font-size:7px;background:rgba(255,255,255,.04);border:1px solid var(--bd);color:var(--mu)}
.yt-wrap{flex:1;overflow-y:auto;padding:clamp(10px,2vw,16px);scrollbar-width:thin;scrollbar-color:var(--bd) transparent}
.yt-hero{display:flex;align-items:center;gap:12px;padding:clamp(12px,2vw,18px);background:linear-gradient(135deg,#0D0608,#100808,#0A0A0F);border:1px solid #330A0A;border-radius:10px;margin-bottom:clamp(12px,2vw,18px)}
.yt-hero-icon{font-size:clamp(28px,5vw,40px);flex-shrink:0}
.yt-hero-title{font-family:'Syne',sans-serif;font-size:clamp(16px,3vw,22px);font-weight:800;color:#FF6B6B;margin-bottom:4px}
.yt-hero-sub{font-size:clamp(9px,1.5vw,11px);color:var(--mu);line-height:1.6}
.yt-search-bar{display:flex;gap:8px;margin-bottom:clamp(10px,2vw,16px)}
.yt-search-inp{flex:1;background:var(--s1);border:1px solid var(--bd);border-radius:6px;color:var(--tx);font-family:'IBM Plex Mono',monospace;font-size:clamp(11px,1.8vw,13px);padding:8px 12px;outline:none}
.yt-search-inp:focus{border-color:#FF6B6B}
.yt-search-btn{background:#FF0000;color:#fff;border:none;border-radius:6px;padding:8px 16px;font-family:'IBM Plex Mono',monospace;font-size:11px;font-weight:600;cursor:pointer;white-space:nowrap;display:flex;align-items:center;gap:5px}
.yt-search-btn:hover{background:#CC0000}
.yt-sec-title{font-family:'Syne',sans-serif;font-weight:800;font-size:clamp(10px,1.8vw,12px);color:var(--tx);margin-bottom:10px;padding-bottom:5px;border-bottom:1px solid var(--bd);display:flex;align-items:center;gap:7px;letter-spacing:.5px}
.yt-ch-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(clamp(180px,22vw,240px),1fr));gap:clamp(7px,1.2vw,10px);margin-bottom:clamp(16px,3vw,24px)}
.yt-add-card{background:var(--s1);border:1px dashed var(--bd);border-radius:9px;padding:clamp(11px,1.8vw,14px);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;cursor:pointer;transition:all .2s;min-height:140px}
.yt-add-card:hover{border-color:#FF6B6B88;background:rgba(255,107,107,.05)}
.yt-add-card-icon{font-size:24px;color:var(--mu)}
.yt-add-card-label{font-size:10px;color:var(--mu);text-align:center;line-height:1.5}
.yt-add-modal{position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px}
.yt-add-modal-box{background:var(--s1);border:1px solid var(--bd);border-radius:12px;padding:20px;max-width:480px;width:100%;display:flex;flex-direction:column;gap:14px}
.yt-add-modal-title{font-family:'Syne',sans-serif;font-weight:800;font-size:15px;color:var(--tx)}
.yt-add-field{display:flex;flex-direction:column;gap:5px}
.yt-add-label{font-size:9px;font-weight:700;color:var(--mu);letter-spacing:.5px;text-transform:uppercase}
.yt-add-inp{background:var(--bg);border:1px solid var(--bd);border-radius:6px;color:var(--tx);font-family:'IBM Plex Mono',monospace;font-size:11px;padding:8px 10px;outline:none;transition:border-color .2s}
.yt-add-inp:focus{border-color:#FF6B6B}
.yt-add-row{display:flex;gap:8px}
.yt-add-colors{display:flex;gap:5px;flex-wrap:wrap}
.yt-add-color{width:22px;height:22px;border-radius:50%;cursor:pointer;border:2px solid transparent;transition:transform .15s}
.yt-add-color.sel{transform:scale(1.25);border-color:#fff}
.yt-custom-badge{font-size:7px;padding:1px 4px;background:rgba(255,107,107,.15);border:1px solid rgba(255,107,107,.3);border-radius:2px;color:#FF6B6B;font-weight:700}
.yt-ch-del{position:absolute;top:6px;right:6px;background:rgba(0,0,0,.6);border:none;border-radius:3px;color:var(--mu);cursor:pointer;font-size:10px;padding:2px 5px;opacity:0;transition:opacity .15s}
.yt-ch-card:hover .yt-ch-del{opacity:1}
.yt-ch-card:hover .yt-ch-del:hover{color:#FF6B6B}
.yt-ch-card{background:var(--s1);border:1px solid var(--bd);border-radius:9px;padding:clamp(11px,1.8vw,14px);display:flex;flex-direction:column;gap:8px;transition:border-color .2s,transform .15s;text-decoration:none}
.yt-ch-card:hover{transform:translateY(-2px)}
.yt-ch-hdr{display:flex;align-items:center;gap:8px}
.yt-ch-icon{width:clamp(28px,4vw,36px);height:clamp(28px,4vw,36px);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:clamp(13px,2vw,16px);flex-shrink:0;border:2px solid}
.yt-ch-name{font-family:'Syne',sans-serif;font-weight:700;font-size:clamp(9px,1.6vw,11px)}
.yt-ch-meta{display:flex;gap:5px;align-items:center;flex-wrap:wrap}
.yt-ch-lang{font-size:10px}
.yt-ch-subs{font-size:8px;color:var(--mu);padding:1px 4px;border-radius:2px;background:rgba(255,255,255,.05)}
.yt-ch-cat{font-size:7px;font-weight:700;padding:1px 5px;border-radius:3px;letter-spacing:.4px}
.yt-ch-desc{font-size:clamp(8px,1.4vw,10px);color:var(--mu);line-height:1.55;flex:1}
.yt-ch-btn{display:flex;align-items:center;justify-content:center;gap:4px;padding:6px;border-radius:5px;border:1px solid;font-family:'IBM Plex Mono',monospace;font-size:8px;font-weight:600;background:transparent;text-decoration:none;transition:all .2s}
.yt-ch-btn:hover{opacity:.8}
.yt-cat-filter{display:flex;gap:5px;flex-wrap:wrap;margin-bottom:12px}
.yt-vgrid{display:flex;flex-direction:column;gap:5px;margin-bottom:16px}
.yt-vcard{background:var(--s1);border:1px solid var(--bd);border-radius:8px;padding:clamp(9px,1.6vw,12px);display:flex;gap:10px;text-decoration:none;transition:background .15s,border-color .15s}
.yt-vcard:hover{background:var(--s2);border-color:#FF6B6B44}
.yt-vcard.important{border-left:3px solid #FF6B6B}
.yt-thumb{width:clamp(70px,12vw,90px);height:clamp(42px,7vw,54px);background:#1A0A0A;border-radius:5px;display:flex;align-items:center;justify-content:center;flex-shrink:0;border:1px solid #330A0A;position:relative;overflow:hidden}
.yt-play{font-size:clamp(16px,3vw,22px);color:#FF4444}
.yt-vbody{flex:1;min-width:0}
.yt-vtitle{font-size:clamp(10px,1.7vw,12px);font-weight:600;color:var(--tx);line-height:1.4;margin-bottom:4px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.yt-vcard:hover .yt-vtitle{color:#FF6B6B}
.yt-vmeta{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:3px}
.yt-vch{font-size:9px;font-weight:600;color:#FF6B6B}
.yt-vviews{font-size:8px;color:var(--mu)}
.yt-vdur{font-size:8px;color:var(--mu);padding:1px 4px;background:rgba(0,0,0,.4);border-radius:2px}
.yt-vdate{font-size:8px;color:var(--mu)}
.yt-vcat{font-size:7px;padding:1px 5px;border-radius:3px;font-weight:700}
.yt-vlang{font-size:10px}
.yt-vdesc{font-size:clamp(8px,1.4vw,10px);color:var(--mu);line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.yt-vstar{color:#FF6B6B;font-size:10px;flex-shrink:0}

/* ── THÈME CLAIR ── */
.light{--bg:#F5F5F7;--s1:#FFFFFF;--s2:#EAEAF0;--bd:#D0D0DC;--tx:#1A1A2E;--mu:#8888A0;--ac:#B8860B;--green:#16A34A;--red:#DC2626;--orange:#EA580C;--blue:#2563EB}
.light body{background:var(--bg)}
.light .nav{background:linear-gradient(180deg,#FFFFFF,#F5F5F7)}
.light .msg.u{background:#E8E8F0;color:var(--tx)}
.light .toast{background:#1A1A2E;color:#F5F5F7}

/* ── THEME TOGGLE ── */
.theme-btn{background:none;border:1px solid var(--bd);border-radius:5px;color:var(--mu);cursor:pointer;font-size:12px;padding:3px 7px;transition:all .15s;line-height:1}
.theme-btn:hover{border-color:var(--ac);color:var(--ac)}

/* ── PERSONA SELECTOR ── */
.persona-bar{padding:5px clamp(8px,2vw,14px);border-bottom:1px solid var(--bd);display:flex;align-items:center;gap:8px;flex-shrink:0;background:var(--s1);flex-wrap:wrap}
.persona-lbl{font-size:8px;color:var(--mu);font-weight:700;letter-spacing:.5px;text-transform:uppercase;white-space:nowrap}
.persona-chips{display:flex;gap:4px;flex-wrap:wrap;flex:1}
.persona-chip{padding:3px 9px;border-radius:20px;border:1px solid var(--bd);background:transparent;color:var(--mu);font-size:9px;cursor:pointer;font-family:'IBM Plex Mono',monospace;transition:all .15s;white-space:nowrap;display:flex;align-items:center;gap:4px}
.persona-chip.on{font-weight:600}
.persona-chip:hover{border-color:var(--ac);color:var(--ac)}
.persona-add{background:none;border:1px dashed var(--bd);border-radius:20px;color:var(--mu);font-size:9px;cursor:pointer;padding:3px 9px;font-family:'IBM Plex Mono',monospace;transition:all .15s}
.persona-add:hover{border-color:var(--ac);color:var(--ac)}

/* ── VOICE BUTTONS ── */
.voice-btn{background:none;border:1px solid var(--bd);border-radius:4px;cursor:pointer;font-size:11px;padding:2px 5px;transition:all .15s;color:var(--mu);line-height:1}
.voice-btn:hover{border-color:var(--blue);color:var(--blue)}
.voice-btn.listening{border-color:var(--red);color:var(--red);animation:pulse 1s infinite}
.voice-btn.speaking{border-color:var(--green);color:var(--green)}
.mic-btn{background:rgba(96,165,250,.1);border:1px solid rgba(96,165,250,.3);border-radius:5px;color:#60A5FA;cursor:pointer;font-size:13px;padding:4px 8px;transition:all .18s}
.mic-btn.on{background:rgba(248,113,113,.15);border-color:var(--red);color:var(--red);animation:pulse 1s infinite}
.mic-btn:hover{opacity:.8}

/* ── DOC UPLOAD ── */
.doc-zone{border:1.5px dashed var(--bd);border-radius:7px;padding:10px 14px;display:flex;align-items:center;gap:8px;font-size:9px;color:var(--mu);cursor:pointer;transition:all .2s;flex-shrink:0;margin:4px clamp(8px,2vw,14px)}
.doc-zone:hover{border-color:var(--ac);color:var(--ac)}
.doc-zone.has-file{border-color:var(--green);color:var(--green);background:rgba(74,222,128,.05)}
.doc-name{font-weight:600;color:var(--tx);max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.doc-clear{background:none;border:none;color:var(--red);cursor:pointer;font-size:12px;margin-left:auto}

/* ── RÉDACTION TAB ── */
.red-wrap{flex:1;display:flex;overflow:hidden}
.red-left{width:clamp(280px,35vw,420px);flex-shrink:0;border-right:1px solid var(--bd);display:flex;flex-direction:column;overflow:hidden}
.red-textarea{flex:1;resize:none;background:var(--bg);border:none;color:var(--tx);font-family:'IBM Plex Mono',monospace;font-size:clamp(10px,1.6vw,12px);line-height:1.7;padding:14px;outline:none}
.red-textarea::placeholder{color:var(--mu)}
.red-actions{padding:8px;border-top:1px solid var(--bd);display:flex;flex-wrap:wrap;gap:5px;background:var(--s1);flex-shrink:0}
.red-act-btn{padding:5px 10px;border-radius:5px;border:1px solid var(--bd);background:var(--s2);color:var(--tx);font-size:9px;cursor:pointer;font-family:'IBM Plex Mono',monospace;transition:all .15s;white-space:nowrap}
.red-act-btn:hover{border-color:var(--ac);color:var(--ac)}
.red-act-btn.active{border-color:var(--ac);background:rgba(212,168,83,.12);color:var(--ac);font-weight:600}
.red-right{flex:1;display:flex;flex-direction:column;overflow:hidden}
.red-results{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:12px;scrollbar-width:thin;scrollbar-color:var(--bd) transparent}
.red-result-card{background:var(--s1);border:1px solid var(--bd);border-radius:8px;overflow:hidden}
.red-result-hdr{padding:8px 12px;border-bottom:1px solid var(--bd);display:flex;align-items:center;gap:7px;flex-shrink:0}
.red-result-body{padding:12px;font-size:clamp(10px,1.6vw,12px);line-height:1.7;color:var(--tx);word-break:break-word}
.red-copy-btn{margin-left:auto;background:none;border:1px solid var(--bd);border-radius:3px;color:var(--mu);cursor:pointer;font-size:8px;padding:2px 6px;font-family:'IBM Plex Mono',monospace;transition:all .15s}
.red-copy-btn:hover{border-color:var(--ac);color:var(--ac)}
.red-placeholder{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:10px;color:var(--mu);font-size:11px;text-align:center;padding:20px}

/* ── RECHERCHE TAB ── */
.srch-wrap{flex:1;display:flex;flex-direction:column;overflow:hidden}
.srch-top{padding:clamp(10px,2vw,16px);border-bottom:1px solid var(--bd);flex-shrink:0;display:flex;flex-direction:column;gap:8px}
.srch-input-row{display:flex;gap:8px}
.srch-inp{flex:1;background:var(--s1);border:1px solid var(--bd);border-radius:7px;color:var(--tx);font-family:'IBM Plex Mono',monospace;font-size:clamp(11px,1.8vw,14px);padding:10px 14px;outline:none;transition:border-color .2s}
.srch-inp:focus{border-color:var(--ac)}
.srch-btn{background:var(--ac);border:none;border-radius:7px;color:#09090B;font-family:'IBM Plex Mono',monospace;font-size:11px;font-weight:700;padding:10px 18px;cursor:pointer;white-space:nowrap}
.srch-btn:hover{opacity:.85}
.srch-btn:disabled{opacity:.4;cursor:not-allowed}
.srch-results{flex:1;overflow-y:auto;padding:clamp(10px,2vw,16px);display:flex;flex-direction:column;gap:10px;scrollbar-width:thin;scrollbar-color:var(--bd) transparent}
.srch-card{background:var(--s1);border:1px solid var(--bd);border-radius:9px;overflow:hidden}
.srch-card-hdr{padding:8px 12px;border-bottom:1px solid var(--bd);display:flex;align-items:center;gap:7px}
.srch-card-body{padding:12px;font-size:clamp(10px,1.6vw,12px);line-height:1.75;color:var(--tx);word-break:break-word;max-height:300px;overflow-y:auto}
.srch-suggestions{display:flex;gap:5px;flex-wrap:wrap}

/* ── PROMPTS TAB ── */
.prom-wrap{flex:1;overflow-y:auto;padding:clamp(10px,2vw,16px);scrollbar-width:thin;scrollbar-color:var(--bd) transparent}
.prom-hdr{display:flex;align-items:center;gap:10px;margin-bottom:14px;flex-wrap:wrap}
.prom-cats{display:flex;gap:4px;flex-wrap:wrap}
.prom-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(clamp(240px,30vw,320px),1fr));gap:9px;margin-top:10px}
.prom-card{background:var(--s1);border:1px solid var(--bd);border-radius:8px;padding:12px;display:flex;flex-direction:column;gap:8px;transition:border-color .2s}
.prom-card:hover{border-color:var(--ac)}
.prom-card.custom{border-left:2px solid var(--ac)}
.prom-card-hdr{display:flex;align-items:flex-start;gap:8px}
.prom-icon{font-size:16px;flex-shrink:0;line-height:1}
.prom-title{font-size:11px;font-weight:600;color:var(--tx);line-height:1.35;flex:1}
.prom-cat-badge{font-size:7px;padding:1px 5px;border-radius:3px;background:rgba(212,168,83,.12);color:var(--ac);font-weight:700;white-space:nowrap;flex-shrink:0}
.prom-preview{font-size:9px;color:var(--mu);line-height:1.55;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;flex:1}
.prom-btns{display:flex;gap:5px;margin-top:auto}
.prom-inject{flex:1;padding:5px 8px;background:rgba(212,168,83,.1);border:1px solid rgba(212,168,83,.3);border-radius:5px;color:var(--ac);font-size:9px;font-weight:700;cursor:pointer;font-family:'IBM Plex Mono',monospace;transition:all .15s}
.prom-inject:hover{background:rgba(212,168,83,.2)}
.prom-del{padding:5px 7px;background:none;border:1px solid var(--bd);border-radius:5px;color:var(--mu);font-size:9px;cursor:pointer;font-family:'IBM Plex Mono',monospace}
.prom-del:hover{border-color:var(--red);color:var(--red)}
.prom-add-card{background:var(--s1);border:1.5px dashed var(--bd);border-radius:8px;padding:16px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;cursor:pointer;transition:all .2s;min-height:120px}
.prom-add-card:hover{border-color:var(--ac);background:rgba(212,168,83,.04)}

/* ── WORKFLOWS TAB ── */
.wf-wrap{flex:1;display:flex;overflow:hidden}
.wf-left{width:clamp(280px,35vw,380px);border-right:1px solid var(--bd);display:flex;flex-direction:column;overflow:hidden;flex-shrink:0}
.wf-steps{flex:1;overflow-y:auto;padding:10px;display:flex;flex-direction:column;gap:6px;scrollbar-width:thin;scrollbar-color:var(--bd) transparent}
.wf-step{background:var(--s1);border:1px solid var(--bd);border-radius:8px;padding:10px;display:flex;flex-direction:column;gap:6px;position:relative}
.wf-step.done{border-color:var(--green)}
.wf-step.running{border-color:var(--ac);animation:borderPulse 1.5s infinite}
@keyframes borderPulse{0%,100%{border-color:var(--ac)}50%{border-color:transparent}}
.wf-step-num{width:20px;height:20px;border-radius:50%;background:var(--ac);color:#09090B;font-size:9px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.wf-step-hdr{display:flex;align-items:center;gap:7px}
.wf-step-label{font-size:10px;font-weight:600;color:var(--tx);flex:1}
.wf-step-ia{font-size:8px;color:var(--mu);padding:1px 5px;border-radius:3px;border:1px solid var(--bd)}
.wf-right{flex:1;display:flex;flex-direction:column;overflow:hidden}
.wf-output{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;scrollbar-width:thin;scrollbar-color:var(--bd) transparent}
.wf-out-card{background:var(--s1);border:1px solid var(--bd);border-radius:8px;overflow:hidden}
.wf-out-hdr{padding:7px 12px;border-bottom:1px solid var(--bd);display:flex;align-items:center;gap:7px;background:var(--s2)}
.wf-out-body{padding:12px;font-size:clamp(10px,1.6vw,12px);line-height:1.7;word-break:break-word;max-height:250px;overflow-y:auto}
.wf-run-btn{margin:10px;padding:10px;background:var(--ac);border:none;border-radius:7px;color:#09090B;font-family:'Syne',sans-serif;font-weight:800;font-size:12px;cursor:pointer;transition:opacity .15s}
.wf-run-btn:hover{opacity:.85}
.wf-run-btn:disabled{opacity:.4;cursor:not-allowed}

/* ── STATS TAB ── */
.stats-wrap{flex:1;overflow-y:auto;padding:clamp(10px,2vw,16px);scrollbar-width:thin;scrollbar-color:var(--bd) transparent}
.stats-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(clamp(160px,20vw,220px),1fr));gap:10px;margin-bottom:18px}
.stat-card{background:var(--s1);border:1px solid var(--bd);border-radius:9px;padding:clamp(12px,2vw,16px);display:flex;flex-direction:column;gap:5px}
.stat-val{font-family:'Syne',sans-serif;font-weight:800;font-size:clamp(22px,4vw,30px);color:var(--ac)}
.stat-lbl{font-size:9px;color:var(--mu);text-transform:uppercase;letter-spacing:.5px}
.stat-sub{font-size:9px;color:var(--tx)}
.stats-bar-section{margin-bottom:18px}
.stats-bar-row{display:flex;align-items:center;gap:8px;margin-bottom:6px}
.stats-bar-name{font-size:10px;color:var(--tx);width:clamp(70px,12vw,110px);flex-shrink:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.stats-bar-track{flex:1;height:10px;background:var(--bd);border-radius:5px;overflow:hidden}
.stats-bar-fill{height:100%;border-radius:5px;transition:width .6s}
.stats-bar-val{font-size:8px;color:var(--mu);width:60px;text-align:right;flex-shrink:0}
.cost-section{background:var(--s1);border:1px solid var(--bd);border-radius:9px;padding:14px;margin-bottom:18px}
.cost-row{display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--bd)}
.cost-row:last-child{border-bottom:none}

/* ── MEDIAS TAB (YouTube+Images merge) ── */
.media-subtabs{display:flex;gap:0;border-bottom:1px solid var(--bd);flex-shrink:0}
.media-stab{flex:1;padding:8px;text-align:center;font-size:11px;font-family:'IBM Plex Mono',monospace;border:none;cursor:pointer;transition:all .15s;color:var(--mu);background:var(--s1)}
.media-stab.on{color:var(--ac);font-weight:700;border-bottom:2px solid var(--ac)}
.media-content{flex:1;overflow:hidden;display:flex;flex-direction:column}

/* ═══════════════════════════════════════════════════════════════
   MOBILE PWA — Expérience native complète
   ═══════════════════════════════════════════════════════════════ */

/* ── Base mobile / safe areas ── */
*{ -webkit-tap-highlight-color: transparent; }
html, body{
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: none;
  -webkit-text-size-adjust: 100%;
  text-size-adjust: 100%;
  touch-action: manipulation;
}
.app{
  /* Respecte le notch, la home bar, etc. */
  padding-top: env(safe-area-inset-top, 0px);
  padding-left: env(safe-area-inset-left, 0px);
  padding-right: env(safe-area-inset-right, 0px);
  /* padding-bottom géré par la tab bar fixe */
}

/* ══ NOTES TAB ══ */
.notes-wrap{flex:1;display:flex;overflow:hidden}
.notes-list{width:200px;flex-shrink:0;border-right:1px solid var(--bd);display:flex;flex-direction:column;background:var(--s1)}
.notes-list-hdr{padding:10px 12px;border-bottom:1px solid var(--bd);display:flex;align-items:center;gap:6px;flex-shrink:0}
.notes-list-hdr span{flex:1;font-size:10px;font-weight:700;color:var(--ac)}
.notes-new-btn{background:var(--ac);border:none;border-radius:4px;color:#09090B;font-size:11px;padding:4px 8px;cursor:pointer;font-weight:700}
.notes-item{padding:10px 12px;border-bottom:1px solid var(--bd);cursor:pointer;transition:background .15s}
.notes-item:hover{background:var(--s2)}.notes-item.on{background:rgba(212,168,83,.1);border-left:2px solid var(--ac)}
.notes-item-title{font-size:11px;color:var(--tx);font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.notes-item-date{font-size:8px;color:var(--mu);margin-top:2px}
.notes-editor{flex:1;display:flex;flex-direction:column;overflow:hidden}
.notes-editor-hdr{padding:8px 12px;border-bottom:1px solid var(--bd);display:flex;align-items:center;gap:8px;flex-shrink:0;background:var(--s1)}
.notes-title-inp{flex:1;background:none;border:none;color:var(--tx);font-size:13px;font-weight:700;font-family:'Syne',sans-serif;outline:none}
.notes-del-btn{background:none;border:1px solid var(--bd);border-radius:4px;color:var(--mu);font-size:10px;padding:3px 8px;cursor:pointer}
.notes-del-btn:hover{color:var(--red);border-color:var(--red)}
.notes-textarea{flex:1;background:transparent;border:none;color:var(--tx);font-family:'IBM Plex Mono',monospace;font-size:12px;padding:16px;resize:none;outline:none;line-height:1.7}
.notes-toolbar{padding:6px 12px;border-top:1px solid var(--bd);display:flex;gap:6px;flex-wrap:wrap;flex-shrink:0;background:var(--s1)}
.notes-tbtn{background:none;border:1px solid var(--bd);border-radius:4px;color:var(--mu);font-size:10px;padding:4px 10px;cursor:pointer;transition:all .15s}
.notes-tbtn:hover{color:var(--ac);border-color:var(--ac)}
/* ══ FILE UPLOAD ══ */
.attach-btn{background:none;border:1px solid var(--bd);border-radius:6px;color:var(--mu);font-size:14px;padding:0 10px;cursor:pointer;display:flex;align-items:center;justify-content:center;min-height:36px;transition:all .15s;flex-shrink:0}
.attach-btn:hover{color:var(--ac);border-color:var(--ac)}
.attach-preview{display:flex;align-items:center;gap:6px;padding:5px 10px;background:rgba(212,168,83,.1);border:1px solid rgba(212,168,83,.3);border-radius:6px;font-size:10px;color:var(--ac);margin:0 4px 4px}
.attach-preview button{background:none;border:none;color:var(--mu);cursor:pointer;font-size:12px;padding:0 2px}
.attach-preview button:hover{color:var(--red)}
.msg-file-badge{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;background:rgba(212,168,83,.1);border:1px solid rgba(212,168,83,.3);border-radius:4px;font-size:9px;color:var(--ac);margin-bottom:4px;cursor:pointer}
/* ══ AGENT AUTONOME ══ */
.agent-wrap{flex:1;display:flex;flex-direction:column;overflow:hidden}
.agent-hdr{padding:14px 16px;border-bottom:1px solid var(--bd);flex-shrink:0;background:var(--s1)}
.agent-body{flex:1;overflow-y:auto;padding:12px 16px}
.agent-step-card{background:var(--s1);border:1px solid var(--bd);border-radius:8px;padding:12px 14px;margin-bottom:10px;transition:border-color .3s}
.agent-step-card.running{border-color:var(--ac);animation:pulse-border 1.5s infinite}
.agent-step-card.done{border-color:rgba(74,222,128,.4)}
@keyframes pulse-border{0%,100%{border-color:var(--ac)}50%{border-color:rgba(212,168,83,.2)}}
.agent-step-output{font-size:11px;color:var(--mu);line-height:1.65;white-space:pre-wrap;max-height:180px;overflow-y:auto;margin-top:6px}
.agent-final{background:linear-gradient(135deg,rgba(212,168,83,.08),rgba(74,222,128,.04));border:1px solid rgba(212,168,83,.3);border-radius:8px;padding:14px;margin-top:10px}
.agent-final-content{font-size:12px;color:var(--tx);line-height:1.7}
/* ══ TRADUCTEUR ══ */
.trad-wrap{flex:1;display:flex;overflow:hidden}
.trad-left{width:48%;border-right:1px solid var(--bd);display:flex;flex-direction:column}
.trad-right{flex:1;display:flex;flex-direction:column;overflow-y:auto}
.trad-lang-bar{padding:8px 10px;border-bottom:1px solid var(--bd);display:flex;align-items:center;gap:5px;flex-shrink:0;background:var(--s1);flex-wrap:wrap}
.trad-lang-btn{padding:4px 10px;border-radius:5px;border:1px solid var(--bd);font-size:10px;cursor:pointer;background:transparent;color:var(--mu);transition:all .15s}
.trad-lang-btn.on{background:var(--ac);border-color:var(--ac);color:#09090B;font-weight:700}
.trad-textarea{flex:1;background:transparent;border:none;color:var(--tx);font-family:'IBM Plex Mono',monospace;font-size:13px;padding:14px;resize:none;outline:none;line-height:1.7;min-height:120px}
.trad-run-btn{margin:8px;background:var(--ac);border:none;border-radius:6px;color:#09090B;font-family:'Syne',sans-serif;font-weight:800;font-size:11px;padding:9px 18px;cursor:pointer;align-self:flex-end}
.trad-result-card{padding:12px 14px;border-bottom:1px solid var(--bd)}
/* ══ VIDEO HOVER PLAY ══ */
.yt-vcard{position:relative}
.yt-play-overlay{position:absolute;top:0;left:0;right:0;height:90px;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;border-radius:8px 8px 0 0;opacity:0;transition:opacity .2s;pointer-events:none}
.yt-vcard:hover .yt-play-overlay{opacity:1}
.yt-play-big{font-size:28px}
@media(max-width:767px){
  .notes-list{display:none}
  .trad-wrap{flex-direction:column}
  .trad-left{width:100%;border-right:none;border-bottom:1px solid var(--bd);max-height:40vh}
}

/* ── MOBILE BOTTOM TAB BAR ── */
.mobile-tabbar{ display:none; }

@media(max-width:767px){
  /* Masquer la nav top sur mobile (remplacée par bottom tabbar) */
  .nav{ display:none !important; }
  
  /* ── App header mobile ── */
  .mobile-header{
    display:flex !important;
    align-items:center;
    padding:0 12px;
    padding-top: max(10px, env(safe-area-inset-top));
    height: calc(44px + env(safe-area-inset-top));
    background:var(--s1);
    border-bottom:1px solid var(--bd);
    flex-shrink:0;
    gap:10px;
    z-index:50;
  }
  .mobile-header-title{
    font-family:'Syne',sans-serif; font-weight:800; font-size:15px; color:var(--ac); flex:1;
  }
  .mobile-header-subtitle{
    font-size:9px; color:var(--mu); font-family:'IBM Plex Mono',monospace;
  }
  .mh-btn{
    background:none; border:1px solid var(--bd); border-radius:6px; color:var(--mu);
    padding:5px 8px; font-size:11px; cursor:pointer; min-width:34px; min-height:34px;
    display:flex; align-items:center; justify-content:center;
  }
  .mh-btn.on{ border-color:var(--ac); color:var(--ac); }

  /* ── Persona bar mobile ── */
  .persona-bar{ overflow-x:auto; scrollbar-width:none; padding:5px 10px; }
  .persona-bar::-webkit-scrollbar{ display:none; }
  .persona-chips{ flex-wrap:nowrap; }

  /* ── Tab content padding pour la tabbar ── */
  .tab-content-mobile{ padding-bottom: calc(65px + env(safe-area-inset-bottom)); }

  /* ── CHAT : une colonne à la fois avec sélecteur ── */
  .cols{ flex-direction:column; overflow:hidden; }
  .col{
    flex:none !important;
    width:100% !important;
    min-width:0 !important;
    border-right:none !important;
    border-bottom:none !important;
    display:none; /* caché par défaut, visible via JS */
    opacity:1 !important;
    filter:none !important;
  }
  .col.mobile-active{ display:flex !important; flex:1 !important; }
  
  /* Sélecteur IA en haut du chat (chips scrollables) */
  .mobile-ia-selector{
    display:flex !important;
    overflow-x:auto; scrollbar-width:none;
    padding:8px 10px; gap:8px; flex-shrink:0;
    background:var(--s1); border-bottom:2px solid var(--bd);
    align-items:center;
  }
  .mobile-ia-selector::-webkit-scrollbar{ display:none; }
  .mobile-ia-chip{
    flex-shrink:0; padding:8px 16px; border-radius:8px; border:2px solid;
    font-size:13px; font-weight:600; cursor:pointer; font-family:'IBM Plex Mono',monospace;
    transition:all .15s; background:var(--s2); white-space:nowrap;
    display:flex; align-items:center; gap:6px; min-height:42px;
    color: var(--tx);
  }
  .mobile-ia-chip.active{
    font-weight:800;
    box-shadow: 0 0 12px rgba(255,255,255,.1);
    transform: scale(1.04);
  }

  /* ── Input chat mobile ── */
  .foot{ padding:8px 10px calc(8px + env(safe-area-inset-bottom)) !important; }
  .ta-wrap textarea{ font-size:16px !important; } /* 16px évite le zoom iOS */
  .sbtn{ min-height:40px !important; min-width:40px !important; }
  .gbtn, .mic-btn{ min-height:40px !important; }

  /* ── Rédaction mobile ── */
  .red-wrap{ flex-direction:column; }
  .red-left{ width:100% !important; border-right:none; border-bottom:1px solid var(--bd); max-height:45vh; flex-shrink:0; }
  .red-textarea{ font-size:15px !important; }
  .red-actions{ overflow-x:auto; flex-wrap:nowrap; }

  /* ── Workflow mobile ── */
  .wf-wrap{ flex-direction:column; }
  .wf-left{ width:100% !important; border-right:none; border-bottom:1px solid var(--bd); max-height:50vh; overflow-y:auto; flex-shrink:0; }

  /* ── Recherche mobile ── */
  .srch-inp{ font-size:16px !important; }

  /* ── Stats & Prompts mobile ── */
  .stats-grid{ grid-template-columns:1fr 1fr !important; }
  .prom-grid{ grid-template-columns:1fr !important; }

  /* ── YouTube grid mobile ── */
  .yt-ch-grid{ grid-template-columns:1fr 1fr !important; }

  /* ── Arène mobile ── */
  .arena-wrap{ padding:10px; }
  .arena-table td, .arena-table th{ padding:5px 4px !important; font-size:9px !important; }

  /* ── Messages taille tactile ── */
  .msg{ font-size:14px !important; line-height:1.65 !important; padding:10px 12px !important; }
  .voice-btn{ min-height:32px !important; min-width:32px !important; font-size:14px !important; }

  /* ── Hist sidebar mobile (drawer) ── */
  .hist-sidebar{
    position:fixed !important; z-index:300; top:0; left:0; bottom:0;
    width:85vw !important; max-width:320px;
    box-shadow:4px 0 30px rgba(0,0,0,.7);
    transform:translateX(-100%); transition:transform .28s cubic-bezier(.4,0,.2,1);
  }
  .hist-sidebar.open{
    transform:translateX(0) !important;
  }
  .hist-overlay{
    display:none;
    position:fixed; inset:0; background:rgba(0,0,0,.55); z-index:299;
  }
  .hist-overlay.open{ display:block; }
  
  /* ── Cards arena mobile ── */
  .arena-card{ padding:10px !important; }
  
  /* ── Débat mobile ── */
  .debate-cols{ flex-direction:column !important; }
  
  /* ── Masquer des éléments sur mobile ── */
  .tbar{ display:none !important; }
  .hide-mobile{ display:none !important; }
}

@media(max-width:767px){
  .mobile-tabbar{
    display:flex !important;
    position:fixed; bottom:0; left:0; right:0;
    background:rgba(14,14,18,.96);
    border-top:1px solid var(--bd);
    padding:5px 0 calc(5px + env(safe-area-inset-bottom));
    z-index:250;
    backdrop-filter:blur(18px);
    -webkit-backdrop-filter:blur(18px);
  }
  .mobile-tab-btn{
    flex:1; display:flex; flex-direction:column; align-items:center; gap:2px;
    background:none; border:none; cursor:pointer; padding:5px 2px;
    color:var(--mu); font-size:8px; font-family:'IBM Plex Mono',monospace;
    transition:all .18s; -webkit-tap-highlight-color:transparent;
  }
  .mobile-tab-btn .ico{ font-size:20px; line-height:1; transition:transform .18s; }
  .mobile-tab-btn.on{ color:var(--ac); }
  .mobile-tab-btn.on .ico{ transform:scale(1.18); }
  .mobile-tab-btn:active{ transform:scale(.88); }
  /* Menu "Plus" overlay */
  .mobile-more-overlay{
    position:fixed; inset:0; background:rgba(0,0,0,.65); z-index:248;
    backdrop-filter:blur(4px); -webkit-backdrop-filter:blur(4px);
    animation:fadeIn .15s ease;
  }
  .mobile-more-drawer{
    position:fixed; bottom:calc(62px + env(safe-area-inset-bottom)); left:0; right:0;
    background:rgba(18,18,24,.98); border-top:1px solid var(--bd);
    border-radius:18px 18px 0 0; z-index:249;
    padding:12px 10px 6px;
    animation:slideUp .2s cubic-bezier(.4,0,.2,1);
    max-height:72vh; overflow-y:auto;
  }
  @keyframes slideUp{ from{transform:translateY(100%);opacity:0} to{transform:translateY(0);opacity:1} }
  .mobile-more-grid{
    display:grid; grid-template-columns:repeat(4,1fr); gap:6px;
  }
  .mobile-more-btn{
    display:flex; flex-direction:column; align-items:center; gap:3px;
    padding:10px 4px; border-radius:10px; border:1px solid var(--bd);
    background:var(--s2); cursor:pointer; color:var(--mu);
    font-size:8px; font-family:'IBM Plex Mono',monospace;
    transition:all .15s; -webkit-tap-highlight-color:transparent;
    min-height:60px; justify-content:center;
  }
  .mobile-more-btn .mico{ font-size:20px; line-height:1; }
  .mobile-more-btn.on{ background:rgba(212,168,83,.12); border-color:rgba(212,168,83,.4); color:var(--ac); }
  .mobile-more-btn:active{ transform:scale(.92); background:rgba(212,168,83,.08); }
  .mobile-more-section{ font-size:8px; color:var(--mu); font-weight:700; letter-spacing:1px; padding:8px 4px 4px; }
}

/* ── Scrolling tactile amélioré partout ── */
.msgs, .prom-wrap, .stats-wrap, .srch-results, .red-results, .wf-output,
.yt-ch-grid, .img-wrap, .arena-wrap, .red-left, .wf-left, .wf-steps{
  -webkit-overflow-scrolling: touch;
}

/* ── Boutons tactiles 44pt minimum ── */
@media(hover:none) and (pointer:coarse){
  button{ min-height:40px; }
  .sbtn, .gbtn, .mic-btn, .wf-run-btn{ min-height:44px !important; }
  .nt, .prom-inject, .red-act-btn{ min-height:38px !important; }
  .persona-chip, .filter-btn{ min-height:36px !important; }
  .mobile-tab-btn{ min-height:50px !important; }
  /* Espacer les liens pour le toucher */
  .yt-link{ padding:8px !important; }
}

/* ── PWA Standalone — ajustements ── */
@media(display-mode:standalone){
  /* L'app tourne en standalone = vraie app */
  .app{
    padding-top: env(safe-area-inset-top, 0px);
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }
  /* Titre dans le header standalone */
  .pwa-standalone-badge{ display:inline-block !important; }
}

/* ── Animations fluides (prefers-reduced-motion) ── */
@media(prefers-reduced-motion:reduce){
  *, *::before, *::after{
    animation-duration:.01ms !important;
    transition-duration:.01ms !important;
  }
}

/* ── Desktop (garde l'ancien comportement) ── */
@media(min-width:768px) and (hover:hover){
  .mobile-header{ display:none; }
  .mobile-ia-selector{ display:none; }
  .mobile-tabbar{ display:none; }
  .hist-overlay{ display:none !important; }
  .col{ display:flex; }
  .hist-sidebar{ position:relative !important; transform:none !important; box-shadow:none !important; }
}

/* ── Toast mobile (repositionné au dessus de la tabbar) ── */
@media(max-width:767px){
  .toast{ bottom:calc(70px + env(safe-area-inset-bottom)) !important; }
  .pwa-banner{ bottom:calc(60px + env(safe-area-inset-bottom)) !important; }
}

/* ── Tablet (768-1024px) ── */
@media(min-width:768px) and (max-width:1024px){
  .cols{ flex-wrap:nowrap; overflow-x:auto; }
  .col{ min-width:280px !important; }
  .prom-grid{ grid-template-columns:1fr 1fr !important; }
  .stats-grid{ grid-template-columns:1fr 1fr 1fr !important; }
}

/* ── Offline indicator ── */
.offline-bar{
  display:none; position:fixed; top:0; left:0; right:0; z-index:9999;
  background:linear-gradient(90deg,#78350F,#92400E);
  color:#FDE68A; font-family:'IBM Plex Mono',monospace; font-size:10px;
  padding:6px 12px; text-align:center; letter-spacing:.5px;
  animation:slideDown .3s ease;
}
@keyframes slideDown{ from{transform:translateY(-100%)} to{transform:translateY(0)} }
.offline-bar.show{ display:block; }

/* ── Loading skeleton (offline UX) ── */
.skeleton{
  background:linear-gradient(90deg,var(--s1) 25%,var(--s2) 50%,var(--s1) 75%);
  background-size:200% 100%;
  animation:shimmer 1.5s infinite;
  border-radius:4px;
}
@keyframes shimmer{ 0%{background-position:200% 0} 100%{background-position:-200% 0} }

/* ── Pull-to-refresh visuel ── */
.ptr-indicator{
  position:absolute; top:-50px; left:0; right:0;
  display:flex; align-items:center; justify-content:center;
  color:var(--ac); font-size:11px; font-family:'IBM Plex Mono',monospace; gap:6px;
  transition:top .2s;
}
.ptr-indicator.visible{ top:8px; }

/* ── PWA Install Banner ── */
.pwa-banner{
  position:fixed; bottom:0; left:0; right:0; z-index:500;
  background:linear-gradient(135deg,#1A1208,#0F0F13);
  border-top:1px solid var(--ac);
  padding:12px clamp(12px,4vw,20px) calc(12px + env(safe-area-inset-bottom));
  display:flex; align-items:center; gap:12px;
  animation:slideUp .4s ease;
}
@keyframes slideUp{ from{transform:translateY(100%)} to{transform:translateY(0)} }
.pwa-banner-icon{ font-size:28px; flex-shrink:0; }
.pwa-banner-text{ flex:1 }
.pwa-banner-title{ font-family:'Syne',sans-serif; font-weight:800; font-size:13px; color:var(--ac); }
.pwa-banner-sub{ font-size:10px; color:var(--mu); margin-top:2px; }
.pwa-install-btn{
  background:var(--ac); border:none; border-radius:7px; color:#09090B;
  font-family:'Syne',sans-serif; font-weight:800; font-size:11px;
  padding:9px 16px; cursor:pointer; white-space:nowrap; flex-shrink:0;
}
.pwa-dismiss-btn{
  background:none; border:1px solid var(--bd); border-radius:5px; color:var(--mu);
  font-size:10px; padding:6px 10px; cursor:pointer; flex-shrink:0;
  font-family:'IBM Plex Mono',monospace;
}
/* ══════════════════════════════════════════════════════
   MARKDOWN RENDERER
   ══════════════════════════════════════════════════════ */
.mem-panel{position:fixed;top:0;left:0;bottom:0;width:min(320px,90vw);background:var(--bg);border-right:1px solid var(--bd);z-index:9991;display:flex;flex-direction:column;box-shadow:8px 0 40px rgba(0,0,0,.5);transition:transform .25s}
.mem-hdr{padding:10px 14px;border-bottom:1px solid var(--bd);display:flex;align-items:center;gap:8px;background:var(--s1);flex-shrink:0}
.mem-list{flex:1;overflow-y:auto;padding:10px;display:flex;flex-direction:column;gap:6px}
.mem-fact{background:var(--s2);border:1px solid var(--bd);border-radius:6px;padding:8px 10px;display:flex;align-items:flex-start;gap:8px;font-size:10px;color:var(--tx);line-height:1.5}
.mem-fact-del{background:none;border:none;color:var(--mu);cursor:pointer;font-size:12px;padding:0 2px;flex-shrink:0;margin-top:1px;line-height:1}
.mem-fact-del:hover{color:var(--red)}
.canvas-panel{position:fixed;top:0;right:0;bottom:0;width:min(540px,50vw);background:var(--bg);border-left:1px solid var(--bd);z-index:9990;display:flex;flex-direction:column;box-shadow:-8px 0 40px rgba(0,0,0,.5)}
.canvas-hdr{padding:10px 14px;border-bottom:1px solid var(--bd);display:flex;align-items:center;gap:8px;background:var(--s1);flex-shrink:0}
.canvas-iframe{flex:1;border:none;background:#fff}
@media(max-width:768px){.canvas-panel{width:100vw;top:50vh}}
.zen-mode .nav,.zen-mode .hist-sidebar,.zen-mode .mobile-header,.zen-mode .mobile-ia-selector{display:none !important}
.zen-mode .chat-area{flex:1}
.zen-mode .col-cmds{display:none !important}
.zen-mode-btn{position:fixed;bottom:18px;right:18px;z-index:9998;width:36px;height:36px;background:rgba(212,168,83,.15);border:1px solid rgba(212,168,83,.4);border-radius:50%;color:var(--ac);font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(6px);transition:background .2s}
.zen-mode-btn:hover{background:rgba(212,168,83,.3)}

/* ── Prism.js dark theme override ── */
.token.comment,.token.prolog,.token.doctype,.token.cdata{color:#6B6B85!important;font-style:italic}
.token.keyword,.token.selector,.token.important,.token.atrule{color:#C084FC!important}
.token.string,.token.attr-value,.token.char,.token.builtin{color:#FB923C!important}
.token.number,.token.boolean,.token.constant,.token.symbol{color:#60A5FA!important}
.token.operator,.token.entity,.token.url,.token.variable{color:#94A3B8!important}
.token.function,.token.class-name{color:#34D399!important}
.token.tag,.token.attr-name{color:#F472B6!important}
pre[class*="language-"],code[class*="language-"]{background:none!important;text-shadow:none!important}

.cot-block{margin-bottom:8px;border:1px solid rgba(96,165,250,.2);border-radius:5px;overflow:hidden}
.cot-toggle{width:100%;display:flex;align-items:center;gap:6px;padding:5px 9px;background:rgba(96,165,250,.06);border:none;cursor:pointer;color:var(--blue);font-family:'IBM Plex Mono',monospace;font-size:8.5px;text-align:left}
.cot-toggle:hover{background:rgba(96,165,250,.12)}
.cot-body{padding:8px 10px;background:rgba(96,165,250,.03);color:var(--mu);line-height:1.6;white-space:pre-wrap;font-family:'IBM Plex Mono',monospace;font-size:8px;max-height:220px;overflow-y:auto;border-top:1px solid rgba(96,165,250,.15)}
.md{line-height:1.72;font-size:inherit}
.md-h1{font-family:'Syne',sans-serif;font-size:clamp(13px,2.1vw,16px);font-weight:800;color:var(--ac);margin:10px 0 5px;border-bottom:1px solid var(--bd);padding-bottom:4px}
.md-h2{font-family:'Syne',sans-serif;font-size:clamp(11px,1.8vw,14px);font-weight:700;color:var(--tx);margin:8px 0 4px}
.md-h3{font-family:'Syne',sans-serif;font-size:clamp(10px,1.6vw,12px);font-weight:700;color:var(--blue);margin:6px 0 3px}
.md-p{margin:2px 0;line-height:1.72}
.md-p:empty{display:none}
.md-list{margin:4px 0 4px 18px;padding:0;display:flex;flex-direction:column;gap:2px}
.md-list li{font-size:inherit;color:var(--tx);line-height:1.65}
.md ul.md-list{list-style:disc}
.md ol.md-list{list-style:decimal}
.md-hr{border:none;border-top:1px solid var(--bd);margin:8px 0}
.md-bq{border-left:3px solid var(--ac);padding:4px 10px;margin:5px 0;background:rgba(212,168,83,.07);border-radius:0 4px 4px 0;color:var(--mu);font-style:italic;font-size:.95em}
.md-ic{background:var(--bg);border:1px solid rgba(255,255,255,.1);border-radius:3px;padding:1px 5px;font-family:'IBM Plex Mono',monospace;font-size:.88em;color:#FB923C}
.md-link{color:var(--ac);text-decoration:none}
.md-link:hover{text-decoration:underline}
.md strong{font-weight:700;color:var(--tx)}
.md em{font-style:italic;color:#BDB9D0}
.md del{text-decoration:line-through;color:var(--mu)}
/* ── Code blocks ── */
.md-code-block{background:#080810;border:1px solid var(--bd);border-radius:7px;overflow:hidden;margin:7px 0;font-size:11px}
.md-code-hdr{display:flex;align-items:center;padding:4px 10px;background:var(--s2);border-bottom:1px solid var(--bd)}
.md-code-lang{font-size:8px;color:var(--ac);font-weight:700;letter-spacing:.8px;text-transform:uppercase;flex:1}
.md-code-copy{font-size:8px;color:var(--mu);cursor:pointer;padding:2px 7px;border:1px solid var(--bd);border-radius:3px;background:transparent;font-family:'IBM Plex Mono',monospace;transition:all .15s}
.md-code-copy:hover{color:var(--green);border-color:var(--green)}
.md-code-copy.copied{color:var(--green);border-color:rgba(74,222,128,.5);background:rgba(74,222,128,.08)}
.md-code-body{padding:10px 13px;overflow-x:auto;font-family:'IBM Plex Mono',monospace;font-size:11px;line-height:1.75;color:#C8C8E0;white-space:pre}
/* ── Prompt vars hint ── */
.pvar-hint{display:flex;gap:5px;flex-wrap:wrap;padding:3px 8px;font-size:8px;color:var(--mu);border-top:1px solid var(--bd);background:rgba(212,168,83,.04)}
.pvar-chip{padding:1px 5px;border-radius:3px;background:rgba(212,168,83,.12);color:var(--ac);border:1px solid rgba(212,168,83,.25);cursor:pointer;font-family:var(--font-ui)}
.pvar-chip:hover{background:rgba(212,168,83,.22)}
`;

// ── COMPONENTS ────────────────────────────────────────────────────
function PSBlock({ title, code, comment }) {
  const copy = () => { try { navigator.clipboard.writeText(code); } catch {} };
  return (
    <div className="ps-block">
      <div className="ps-hdr">
        <span className="ps-lang">POWERSHELL {title && <span style={{color:"#9999AA",fontWeight:400,letterSpacing:0}}>— {title}</span>}</span>
        <button className="ps-copy" onClick={copy}>copier</button>
      </div>
      <div className="ps-code">
        <pre>{comment && <span className="ps-comment"># {comment}{"\n"}</span>}{code}</pre>
      </div>
    </div>
  );
}

function ScoreBar({ score, color }) {
  const fill = (score / 10) * 100;
  const c = score >= 9 ? "#4ADE80" : score >= 8 ? "#D4A853" : "#FB923C";
  return (
    <div className="score-bar">
      <span className="score-num" style={{ color: c }}>{score}</span>
      <div className="score-bg"><div className="score-fill" style={{ width: `${fill}%`, background: c }} /></div>
    </div>
  );
}

function MeterBar({ val, color }) {
  const c = val >= 8 ? "#4ADE80" : val >= 6 ? "#D4A853" : "#FB923C";
  return (
    <div>
      <div className="meter-bg"><div className="meter-fill" style={{ width: `${val * 10}%`, background: c }} /></div>
      <div className="meter-val" style={{ color: c }}>{val}/10</div>
    </div>
  );
}

// ── ACTUALITÉS IA — Fallback multi-IA (Gemini → Groq → Mistral → Statiques) ──
const NEWS_THEMES = [
  { id:"general",  label:"🔥 Toutes les news",  query:"actualités intelligence artificielle semaine nouvelles sorties modèles IA 2025" },
  { id:"modeles",  label:"🤖 Nouveaux modèles", query:"nouveaux modèles IA sortis 2025 GPT Claude Gemini DeepSeek Llama Mistral Grok" },
  { id:"gratuit",  label:"⭐ IA gratuites",     query:"nouveaux outils IA gratuits open source 2025 disponibles" },
  { id:"images",   label:"🎨 IA Images/Vidéo",  query:"nouveaux générateurs images vidéo IA 2025 FLUX MidJourney Sora Runway Kling" },
  { id:"france",   label:"🇫🇷 IA en France",    query:"intelligence artificielle France entreprises startups régulation actualités 2025" },
  { id:"code",     label:"💻 IA & Code",        query:"IA coding assistants nouveautés 2025 Copilot Cursor Devin Codex" },
];

const NEWS_PROMPT = (q) =>
  `Tu es un journaliste tech expert en IA. Génère 10 actualités IA récentes et détaillées sur : "${q}".

RÈGLES IMPORTANTES :
1. Les URL doivent être des RECHERCHES GOOGLE NEWS valides : https://news.google.com/search?q=MOTS_CLÉS&hl=fr
   Ex: https://news.google.com/search?q=DeepSeek+R1+open+source&hl=fr
   JAMAIS d'URLs d'articles directes qui peuvent être mortes.
2. summary doit faire 3 à 5 phrases complètes et détaillées en français.
3. detail doit faire 2-3 phrases supplémentaires d'analyse ou de contexte.
4. impact doit décrire en 1 phrase l'impact concret pour les utilisateurs.

Retourne UNIQUEMENT un tableau JSON valide, sans markdown :
[{
  "title": "Titre accrocheur en français (max 90 chars)",
  "source": "Nom du média ou de l'entreprise",
  "date": "Il y a Xj / Cette semaine / Ce mois / Xjours 2025",
  "category": "Nouveau modèle|Outil gratuit|Open Source|Entreprise|Recherche|Réglementation|Image/Vidéo|Code|Agent IA",
  "summary": "3 à 5 phrases complètes décrivant la news en détail...",
  "detail": "2-3 phrases de contexte ou d'analyse approfondie...",
  "impact": "Impact concret pour les développeurs/utilisateurs en 1 phrase.",
  "url": "https://news.google.com/search?q=MOTS+CLÉS+DE+LA+NEWS&hl=fr",
  "important": true/false
}]`;

function parseNewsJSON(text) {
  const clean = text.replace(/```json|```/g,"").trim();
  const m = clean.match(/\[[\s\S]*\]/);
  if (!m) throw new Error("JSON introuvable");
  return JSON.parse(m[0]);
}

async function tryGemini(query, apiKey) {
  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    { method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ contents:[{role:"user",parts:[{text:NEWS_PROMPT(query)}]}], generationConfig:{maxOutputTokens:2000} }) }
  );
  const d = await r.json();
  if (d.error) throw new Error("Gemini: " + d.error.message);
  return parseNewsJSON(d.candidates[0].content.parts[0].text);
}

async function tryGroq(query, apiKey) {
  const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method:"POST", headers:{"Content-Type":"application/json","Authorization":`Bearer ${apiKey}`},
    body: JSON.stringify({ model:"llama-3.3-70b-versatile", max_tokens:2000,
      messages:[{role:"user",content:NEWS_PROMPT(query)}] })
  });
  const d = await r.json();
  if (d.error) throw new Error("Groq: " + (d.error.message||JSON.stringify(d.error)));
  return parseNewsJSON(d.choices[0].message.content);
}

async function tryMistral(query, apiKey) {
  const r = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method:"POST", headers:{"Content-Type":"application/json","Authorization":`Bearer ${apiKey}`},
    body: JSON.stringify({ model:"mistral-small-latest", max_tokens:2000,
      messages:[{role:"user",content:NEWS_PROMPT(query)}] })
  });
  const d = await r.json();
  if (d.error) throw new Error("Mistral: " + (typeof d.error==="string"?d.error:(d.error.message||"")));
  return parseNewsJSON(d.choices[0].message.content);
}

async function tryOpenAI(query, apiKey) {
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method:"POST", headers:{"Content-Type":"application/json","Authorization":`Bearer ${apiKey}`},
    body: JSON.stringify({ model:"gpt-4o-mini", max_tokens:2000,
      messages:[{role:"user",content:NEWS_PROMPT(query)}] })
  });
  const d = await r.json();
  if (d.error) throw new Error("OpenAI: " + d.error.message);
  return parseNewsJSON(d.choices[0].message.content);
}

const GNEWS = (q) => "https://news.google.com/search?q=" + encodeURIComponent(q) + "&hl=fr";

const FALLBACK_NEWS = [
  {
    title:"DeepSeek R1 — l'IA open source qui a choqué la Silicon Valley",
    source:"DeepSeek / Nature", date:"Mars 2025", category:"Nouveau modèle",
    summary:"DeepSeek R1 est un modèle de raisonnement open source avec 671 milliards de paramètres en architecture Mixture-of-Experts (MoE), dont seulement 37B sont actifs à chaque inférence. Ses poids sont publiés librement sur HuggingFace, ce qui en fait le modèle open source le plus puissant disponible. Il rivalise directement avec GPT-o1 d'OpenAI sur les benchmarks mathématiques et scientifiques, avec un coût d'inférence 10 à 20 fois inférieur. Le lancement a provoqué une chute boursière des valeurs technologiques américaines, notamment Nvidia.",
    detail:"L'architecture MoE permet à DeepSeek d'être économique : seule une fraction des paramètres est activée par requête. Cette approche avait déjà été utilisée par Mixtral de Mistral AI. La publication des poids permet à n'importe qui de l'héberger localement ou de l'affiner pour des usages spécifiques.",
    impact:"Les développeurs peuvent désormais utiliser un modèle de niveau GPT-o1 à une fraction du coût, via API ou en local.",
    url:GNEWS("DeepSeek R1 open source raisonnement"), important:true
  },
  {
    title:"Claude 4 (Sonnet + Opus) — Anthropic repousse les limites des agents IA",
    source:"Anthropic", date:"Juin 2025", category:"Nouveau modèle",
    summary:"Anthropic a lancé Claude Sonnet 4 et Claude Opus 4 avec des capacités inédites : mémoire longue durée persistante entre les conversations, contrôle autonome d'ordinateur (computer use), et une fenêtre de contexte de 200 000 tokens. Opus 4 est positionné comme le modèle le plus capable d'Anthropic, rivalisant avec GPT-o1 sur les tâches de raisonnement complexe. Sonnet 4 offre un excellent rapport qualité-prix pour les usages professionnels intensifs.",
    detail:"La mémoire longue durée permet à Claude de se souvenir des préférences, projets et contextes entre sessions. Le computer use permet à Claude de naviguer sur le web, ouvrir des applications et effectuer des tâches complexes de manière autonome.",
    impact:"Les entreprises peuvent désormais déployer des agents IA capables d'effectuer des workflows complets sans supervision humaine constante.",
    url:GNEWS("Claude 4 Sonnet Opus Anthropic agents"), important:true
  },
  {
    title:"GPT-o3 et o4-mini — OpenAI établit de nouveaux records absolus",
    source:"OpenAI", date:"Avr 2025", category:"Recherche",
    summary:"OpenAI a lancé GPT-o3 et o4-mini, deux modèles de raisonnement qui établissent des records historiques sur ARC-AGI (89,5%) et le benchmark MATH (évaluation de niveau olympiade). o3 est le premier modèle à dépasser significativement les capacités humaines sur des tâches de raisonnement abstrait. o4-mini offre des performances proches d'o3 à un coût très inférieur, rendant le raisonnement profond accessible pour les applications à grande échelle.",
    detail:"ARC-AGI est un benchmark conçu pour être résistant aux LLMs entraînés par mémorisation. Le score de 89,5% d'o3 suggère une forme de généralisation qui dépasse le simple pattern matching. Les chercheurs débattent de ce que cela implique pour la définition de l'AGI.",
    impact:"Les développeurs d'applications scientifiques, médicales et d'ingénierie ont maintenant accès à un raisonnement de niveau expert via API.",
    url:GNEWS("GPT o3 o4-mini OpenAI ARC-AGI records"), important:true
  },
  {
    title:"Gemini 2.0 Flash Ultra — Google passe à 2 millions de tokens",
    source:"Google DeepMind", date:"Fév 2025", category:"Nouveau modèle",
    summary:"Google a lancé Gemini 2.0 Flash Ultra avec une fenêtre de contexte de 2 millions de tokens, soit l'équivalent de plusieurs livres entiers ou de plusieurs heures de vidéo. Le modèle peut analyser de longs documents, des films complets ou des bases de code entières en une seule requête. Gemini Live permet des conversations vocales en temps réel avec partage d'écran, ouvrant la voie aux assistants IA multimodaux interactifs.",
    detail:"Le modèle 2.0 Pro est également planifié avec des capacités d'agent et une intégration Search Google Live. La version Flash reste dans le tier gratuit d'AI Studio avec une généreuse limite de tokens.",
    impact:"Les développeurs peuvent analyser des bases de code complètes ou des rapports entiers en une seule requête API, sans avoir à fragmenter le contenu.",
    url:GNEWS("Gemini 2.0 Flash Ultra contexte 2 millions tokens"), important:true
  },
  {
    title:"Mistral AI lance les Agents dans Le Chat — navigation web autonome",
    source:"Mistral AI", date:"Jan 2025", category:"Outil gratuit",
    summary:"Mistral AI a intégré des agents autonomes dans son interface Le Chat, permettant à l'IA de naviguer sur le web, d'exécuter du code Python, de créer des documents Word et Excel, et d'effectuer des recherches approfondies. Ces fonctionnalités sont disponibles gratuitement pour les utilisateurs de Le Chat. Mistral Small 3 a également été publié sous licence Apache 2.0, permettant un usage commercial libre.",
    detail:"Les agents de Mistral utilisent une approche 'tool use' standard compatible avec l'API OpenAI. La décision de proposer ces fonctionnalités gratuitement est une stratégie agressive pour concurrencer ChatGPT et Claude.",
    impact:"Pour les utilisateurs européens soucieux du RGPD, Mistral offre une alternative complète aux outils américains avec des serveurs en France.",
    url:GNEWS("Mistral Le Chat agents navigation web 2025"), important:false
  },
  {
    title:"Llama 3.3 70B et l'annonce de Llama 4 — Meta en force dans l'OSS",
    source:"Meta AI", date:"Oct 2024", category:"Open Source",
    summary:"Meta a lancé Llama 3.3 70B avec des performances proches de Llama 3.1 405B malgré sa taille bien inférieure, grâce à des améliorations dans le fine-tuning instruction. Le modèle est disponible gratuitement via Groq avec jusqu'à 14 400 requêtes par jour. Meta a également annoncé Llama 4 pour 2025, avec une architecture MoE et des capacités multimodales natives intégrées dès la base.",
    detail:"Groq utilise des puces spécialisées LPU (Language Processing Unit) qui permettent d'inférer Llama 3.3 70B à des vitesses de 800+ tokens/seconde, soit 10x plus vite que les GPU classiques. C'est pourquoi la version Groq est si rapide.",
    impact:"Les développeurs obtiennent un modèle de qualité professionnelle gratuitement, idéal pour prototyper des applications ou pour des usages à faible volume.",
    url:GNEWS("Llama 3.3 70B Meta Groq gratuit open source"), important:false
  },
  {
    title:"FLUX.1 Schnell — la révolution open source de la génération d'images",
    source:"Black Forest Labs", date:"Nov 2024", category:"Image/Vidéo",
    summary:"Black Forest Labs, fondé par d'anciens chercheurs de Stability AI, a lancé FLUX.1 sous licence Apache 2.0. Le modèle surpasse Stable Diffusion XL et rivalise avec Midjourney v6 sur la qualité photo-réaliste, tout en étant 3 à 5 fois plus rapide grâce à une architecture flow matching avec seulement 1 à 4 étapes de débruitage. FLUX.1 Dev (usage non-commercial) et FLUX.1 Pro (payant) complètent la gamme.",
    detail:"L'architecture flow matching de FLUX remplace les diffusion models classiques, permettant une génération en moins d'étapes sans perte de qualité. ComfyUI et Fooocus ont rapidement intégré FLUX, créant un écosystème de workflows partagés.",
    impact:"Les créatifs peuvent générer des images photo-réalistes de qualité professionnelle localement sur leur PC sans abonnement, avec un GPU de 8GB VRAM minimum.",
    url:GNEWS("FLUX.1 Schnell Black Forest Labs image generation open source"), important:false
  },
  {
    title:"Grok 3 de xAI — l'IA d'Elon Musk avec accès temps réel à X/Twitter",
    source:"xAI", date:"Déc 2024", category:"Nouveau modèle",
    summary:"xAI a lancé Grok 3 avec des améliorations significatives par rapport à la version 2 : accès en temps réel aux données de la plateforme X (Twitter), génération d'images via Aurora, et un mode de raisonnement approfondi pour les problèmes complexes. L'API publique est maintenant accessible aux développeurs. Grok 3 se positionne comme le principal concurrent de Claude et GPT-4o, avec un avantage sur les actualités en temps réel.",
    detail:"L'intégration X/Twitter est une différenciation unique : Grok peut analyser les tendances du moment, les tweets viraux et les discussions en cours. Ce contexte temps réel est impossible à obtenir avec les autres modèles.",
    impact:"Idéal pour les applications de veille médiatique, d'analyse de sentiment social et de monitoring de marques qui ont besoin de données ultra-fraîches.",
    url:GNEWS("Grok 3 xAI Elon Musk Twitter temps réel 2024"), important:false
  },
  {
    title:"Qwen 2.5 d'Alibaba — le challenger chinois qui s'impose sur le code",
    source:"Alibaba DAMO Academy", date:"Déc 2024", category:"Nouveau modèle",
    summary:"Alibaba a lancé Qwen 2.5 en plusieurs tailles (7B, 14B, 32B, 72B) avec des performances remarquables sur les benchmarks de code et de mathématiques, surpassant GPT-4o sur HumanEval. Les poids open source sont disponibles sur HuggingFace. Qwen2.5-Max, la version non-publiée, rivalise avec Claude 3.5 Sonnet selon les évaluations internes. Les tarifs API sont parmi les plus compétitifs du marché.",
    detail:"La famille Qwen comprend aussi des modèles spécialisés : Qwen-Coder pour le code, Qwen-Math pour les mathématiques, et Qwen-VL pour la vision. L'écosystème Qwen est particulièrement populaire en Asie et dans la communauté open source mondiale.",
    impact:"Pour les développeurs et data scientists, Qwen 2.5 72B offre des performances de niveau GPT-4 à un coût très inférieur, avec possibilité de le faire tourner localement.",
    url:GNEWS("Qwen 2.5 Alibaba code open source benchmarks"), important:false
  },
  {
    title:"Ernie 5.0 de Baidu — multimodal complet pour le marché chinois",
    source:"Baidu", date:"Juil 2024", category:"Nouveau modèle",
    summary:"Baidu a lancé Ernie 5.0 (文心一言 5.0) avec des capacités multimodales complètes intégrant texte, images, audio et vidéo dans un seul modèle. Le modèle est optimisé pour le mandarin et les tâches spécifiques au marché chinois. Disponible via l'API Qianfan, Ernie 5.0 est intégré dans l'écosystème Baidu Search et les outils bureautiques Wenku.",
    detail:"Ernie 5.0 fait face à des défis de disponibilité hors de Chine en raison des restrictions réglementaires. L'accès via API est limité aux entités enregistrées en Chine ou disposant de partenariats officiels avec Baidu.",
    impact:"Principalement pertinent pour les entreprises travaillant sur le marché chinois ou nécessitant un traitement de texte en mandarin de haute qualité.",
    url:GNEWS("Ernie 5.0 Baidu multimodal intelligence artificielle Chine"), important:false
  },
];

async function fetchAINews(themeQuery, savedKeys) {
  const keys = savedKeys || {};
  const errors = [];
  // Gemini retiré (non disponible dans cette config)
  if (keys.groq_inf) { try { return { items:await tryGroq(themeQuery,keys.groq_inf),   provider:"Groq/Llama ⚡", fallback:false }; } catch(e) { errors.push(e.message); } }
  if (keys.mistral)  { try { return { items:await tryMistral(themeQuery,keys.mistral), provider:"Mistral ▲",     fallback:false }; } catch(e) { errors.push(e.message); } }
  if (keys.openai)   { try { return { items:await tryOpenAI(themeQuery,keys.openai),   provider:"GPT-4o mini ◈", fallback:false }; } catch(e) { errors.push(e.message); } }
  return { items:FALLBACK_NEWS, provider:"Cache statique", fallback:true, errors };
}

const CAT_COLORS = {
  "Nouveau modèle":"#D4A853","Outil gratuit":"#4ADE80","Open Source":"#4ADE80",
  "Entreprise":"#60A5FA","Recherche":"#A78BFA","Réglementation":"#FB923C",
  "Image/Vidéo":"#E07FA0","Code":"#6BA5E0",
};
const getCatColor = (cat) => {
  for (const [k,v] of Object.entries(CAT_COLORS)) { if (cat?.includes(k)) return v; }
  return "#9CA3AF";
};
function AINewsBlock() {
  const [activeTheme, setActiveTheme] = useState("general");
  const [newsItems, setNewsItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);
  const [cache, setCache] = useState({});
  const [usedProvider, setUsedProvider] = useState(null);
  const [isFallback, setIsFallback] = useState(false);

  const getKeys = () => {
    try { return JSON.parse(localStorage.getItem("multiia_keys") || "{}"); }
    catch { return {}; }
  };

  const fetchNews = async (themeId) => {
    if (cache[themeId]) {
      setNewsItems(cache[themeId].items);
      setUsedProvider(cache[themeId].provider);
      setIsFallback(cache[themeId].fallback || false);
      setLastFetch(new Date()); return;
    }
    const theme = NEWS_THEMES.find(t => t.id === themeId);
    setLoading(true); setError(null); setNewsItems([]);
    try {
      const result = await fetchAINews(theme.query, getKeys());
      setNewsItems(result.items);
      setUsedProvider(result.provider);
      setIsFallback(result.fallback || false);
      setCache(prev => ({ ...prev, [themeId]: result }));
      setLastFetch(new Date());
    } catch(e) {
      setError("Erreur inattendue : " + e.message);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchNews("general"); }, []);

  const handleTheme = (id) => { setActiveTheme(id); fetchNews(id); };

  const fmtTime = (d) => {
    if (!d) return "";
    const m = Math.floor((Date.now() - d.getTime()) / 60000);
    if (m < 1) return "à l'instant";
    if (m < 60) return `il y a ${m}min`;
    return `il y a ${Math.floor(m/60)}h`;
  };

  return (
    <div className="rss-wrap">
      <div className="rss-head">
        <span style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
          <span className="live-dot"/>
          <span className="rss-title">📰 ACTUALITÉS IA{usedProvider && !loading ? <span style={{fontWeight:400,fontSize:9,color:"var(--mu)",marginLeft:5}}>via {usedProvider}</span> : ""}</span>
        </span>
        <div className="rss-src-tabs">
          {NEWS_THEMES.map(t => (
            <button key={t.id}
              className={`rss-stab ${activeTheme===t.id?"on":""}`}
              onClick={() => handleTheme(t.id)}
              disabled={loading}>{t.label}
            </button>
          ))}
        </div>
        <button className="rss-refresh"
          onClick={() => { setCache(prev => ({...prev,[activeTheme]:null})); fetchNews(activeTheme); }}
          disabled={loading}>
          {loading ? "⟳" : "↺"} {lastFetch ? fmtTime(lastFetch) : ""}
        </button>
      </div>

      {loading && (
        <div className="rss-loading">
          <div style={{marginBottom:8}}>
            <span className="dots"><span>·</span><span>·</span><span>·</span></span>
          </div>
          <div>Recherche des actualités IA… (Gemini → Groq → Mistral)</div>
          <div style={{fontSize:9,marginTop:4,color:"var(--mu)"}}>Essai automatique sur tes IAs disponibles · ~5-15 secondes</div>
        </div>
      )}

      {isFallback && !loading && newsItems.length > 0 && (
        <div style={{padding:"7px 14px",background:"rgba(251,146,60,.08)",borderBottom:"1px solid rgba(251,146,60,.2)",fontSize:9,color:"var(--orange)",display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
          <span>⚠️ <strong>Aucune clé API dispo</strong> — affichage du cache statique (news 2024-2025)</span>
          <span style={{color:"var(--mu)"}}>·</span>
          <span>Active <strong>Gemini</strong> (gratuit) ou <strong>Groq</strong> (gratuit) dans Config pour les vraies actus</span>
        </div>
      )}

      {error && !loading && (
        <div className="rss-err">
          ⚠️ {error}
          <button onClick={() => fetchNews(activeTheme)}
            style={{marginLeft:10,padding:"2px 8px",borderRadius:3,border:"1px solid var(--orange)",background:"transparent",color:"var(--orange)",fontSize:9,cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace"}}>
            Réessayer
          </button>
        </div>
      )}

      {!loading && !error && newsItems.length > 0 && (() => {
        const NewsCard = ({ item, i }) => {
          const [open, setOpen] = React.useState(false);
          const catColor = getCatColor(item.category);
          // Toujours générer un lien Google News valide
          const gnewsUrl = item.url && item.url.startsWith("http")
            ? item.url
            : "https://news.google.com/search?q=" + encodeURIComponent(item.title) + "&hl=fr";
          return (
            <div className="rss-item" style={item.important ? { borderLeft:`3px solid ${catColor}`, paddingLeft:11 } : {}}
              onClick={() => setOpen(o => !o)}>
              <div className="rss-item-hdr">
                <div className="rss-item-hdr-left">
                  <div style={{display:"flex",alignItems:"flex-start",gap:6,marginBottom:4}}>
                    {item.important && <span style={{color:"#FACC15",fontSize:12,flexShrink:0,lineHeight:1.4}}>★</span>}
                    <div className="rss-ititle">{item.title}</div>
                  </div>
                  <div className="rss-meta">
                    <span className="rss-site" style={{background:catColor+"18",color:catColor}}>{item.category}</span>
                    <span style={{fontSize:8,color:"var(--mu)",fontWeight:600}}>{item.source}</span>
                    <span className="rss-date">{item.date}</span>
                  </div>
                  {/* Summary toujours visible */}
                  {item.summary && <div className="rss-summary">{item.summary}</div>}
                </div>
                <button className="rss-toggle" onClick={e => { e.stopPropagation(); setOpen(o=>!o); }}
                  style={{flexShrink:0,marginTop:2,fontSize:14,padding:"0 4px"}}>
                  {open ? "▲" : "▼"}
                </button>
              </div>

              {/* Contenu expandé */}
              {open && (
                <div className="rss-expand-body" onClick={e => e.stopPropagation()}>
                  {item.detail && (
                    <div>
                      <div style={{fontSize:8,fontWeight:700,color:"var(--mu)",letterSpacing:".5px",marginBottom:3,textTransform:"uppercase"}}>🔍 Analyse</div>
                      <div className="rss-detail">{item.detail}</div>
                    </div>
                  )}
                  {item.impact && (
                    <div className="rss-impact">
                      <strong>💡 Impact :</strong> {item.impact}
                    </div>
                  )}
                  <div className="rss-expand-footer">
                    <a href={gnewsUrl} target="_blank" rel="noreferrer"
                      className="rss-gnews-btn" onClick={e => e.stopPropagation()}>
                      🔎 Chercher sur Google News ↗
                    </a>
                    <a href={"https://www.google.com/search?q=" + encodeURIComponent(item.title + " " + (item.source||""))}
                      target="_blank" rel="noreferrer"
                      className="rss-gnews-btn" style={{background:"rgba(96,165,250,.08)",borderColor:"rgba(96,165,250,.3)",color:"#60A5FA"}}
                      onClick={e => e.stopPropagation()}>
                      🌐 Google ↗
                    </a>
                    {item.source && (
                      <span style={{fontSize:8,color:"var(--mu)",marginLeft:"auto"}}>Source : {item.source}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        };
        return (
          <div className="rss-list">
            {newsItems.map((item, i) => <NewsCard key={i} item={item} i={i} />)}
          </div>
        );
      })()}

      {!loading && !error && newsItems.length === 0 && (
        <div className="rss-loading">
          Clique sur un thème pour charger les actualités.
        </div>
      )}

      <div style={{padding:"6px 14px",borderTop:"1px solid var(--bd)",fontSize:8,color:"var(--mu)",display:"flex",gap:8,flexWrap:"wrap"}}>
        <span>⚡ Propulsé par Claude + Web Search</span>
        <span>·</span>
        <span>★ = News importante</span>
        <span>·</span>
        <span>Clique sur un article pour l'ouvrir</span>
        <span>·</span>
        <span>↺ pour rafraîchir</span>
      </div>
    </div>
  );
}

// ── YOUTUBE TAB COMPONENT ─────────────────────────────────────────

// ═══════════════════════════════════════════════════════════
// NOTES TAB
// ═══════════════════════════════════════════════════════════
function NotesTab({ onCopyToChat }) {
  const load = () => { try { return JSON.parse(localStorage.getItem("multiia_notes")||"[]"); } catch { return []; } };
  const save = (list) => { try { localStorage.setItem("multiia_notes", JSON.stringify(list)); } catch {} };
  const [notes, setNotes] = React.useState(load);
  const [activeId, setActiveId] = React.useState(null);
  const activeNote = notes.find(n => n.id === activeId);

  const newNote = () => {
    const n = { id: "n_"+Date.now(), title: "Nouvelle note", content: "", date: new Date().toISOString() };
    const updated = [n, ...notes]; setNotes(updated); save(updated); setActiveId(n.id);
  };
  const updateNote = (field, val) => {
    const updated = notes.map(n => n.id===activeId ? {...n, [field]:val, date:new Date().toISOString()} : n);
    setNotes(updated); save(updated);
  };
  const delNote = () => {
    if (!window.confirm("Supprimer cette note ?")) return;
    const updated = notes.filter(n => n.id!==activeId);
    setNotes(updated); save(updated); setActiveId(updated[0]?.id || null);
  };
  const fmtDate = (d) => new Date(d).toLocaleDateString("fr-FR",{day:"2-digit",month:"2-digit",year:"2-digit",hour:"2-digit",minute:"2-digit"});

  return (
    <div className="notes-wrap">
      <div className="notes-list">
        <div className="notes-list-hdr">
          <span>📝 {notes.length} note{notes.length!==1?"s":""}</span>
          <button className="notes-new-btn" onClick={newNote}>＋</button>
        </div>
        {notes.length === 0 && <div style={{padding:"20px 12px",fontSize:10,color:"var(--mu)",textAlign:"center"}}>Aucune note.<br/>Clique sur ＋</div>}
        {notes.map(n => (
          <div key={n.id} className={`notes-item ${n.id===activeId?"on":""}`} onClick={() => setActiveId(n.id)}>
            <div className="notes-item-title">{n.title||"Sans titre"}</div>
            <div className="notes-item-date">{fmtDate(n.date)}</div>
            {n.content && <div className="notes-item-preview">{n.content.slice(0,50)}</div>}
          </div>
        ))}
      </div>
      <div className="notes-editor">
        {!activeNote ? (
          <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:12,color:"var(--mu)"}}>
            <div style={{fontSize:32}}>📝</div>
            <div style={{fontSize:11}}>Sélectionne une note ou crée-en une</div>
            <button className="notes-new-btn" onClick={newNote} style={{padding:"8px 16px",fontSize:11}}>＋ Nouvelle note</button>
          </div>
        ) : (
          <>
            <div className="notes-editor-hdr">
              <input className="notes-title-inp" value={activeNote.title}
                onChange={e => updateNote("title", e.target.value)} placeholder="Titre de la note"/>
              <button className="notes-del-btn" onClick={delNote}>🗑</button>
            </div>
            <textarea className="notes-textarea" value={activeNote.content}
              onChange={e => updateNote("content", e.target.value)}
              placeholder="Écris ici... Markdown supporté (visuellement).&#10;&#10;Ctrl+A pour tout sélectionner, puis copie vers le chat."/>
            <div className="notes-toolbar">
              <button className="notes-tbtn" onClick={() => navigator.clipboard.writeText(activeNote.content||"")}>⎘ Copier</button>
              <button className="notes-tbtn" onClick={() => onCopyToChat && onCopyToChat(activeNote.content||"")}>↗ Vers Chat</button>
              <span style={{marginLeft:"auto",fontSize:8,color:"var(--mu)"}}>{(activeNote.content||"").length} car · {(activeNote.content||"").split(/\s+/).filter(Boolean).length} mots</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// TRADUCTEUR TAB
// ═══════════════════════════════════════════════════════════
function TraducteurTab({ enabled, apiKeys }) {
  const LANGS = ["🇫🇷 Français","🇬🇧 Anglais","🇪🇸 Espagnol","🇩🇪 Allemand","🇮🇹 Italien","🇵🇹 Portugais","🇷🇺 Russe","🇯🇵 Japonais","🇨🇳 Chinois","🇦🇪 Arabe"];
  const [src, setSrc] = React.useState("🇫🇷 Français");
  const [tgt, setTgt] = React.useState("🇬🇧 Anglais");
  const [text, setText] = React.useState("");
  const [results, setResults] = React.useState({});
  const [loading, setLoading] = React.useState({});
  const activeIds = Object.keys(MODEL_DEFS).filter(id => enabled[id]);

  const translate = async () => {
    if (!text.trim() || !activeIds.length) return;
    const prompt = `Traduis ce texte du ${src.replace(/^.+\s/,"")} vers le ${tgt.replace(/^.+\s/,"")}. Retourne UNIQUEMENT la traduction, sans commentaires ni explications.\n\n${text}`;
    const newLoad = {}; activeIds.forEach(id=>{newLoad[id]=true;}); setLoading(newLoad);
    const newRes = {}; activeIds.forEach(id=>{newRes[id]="";}); setResults(newRes);
    await Promise.all(activeIds.map(async id => {
      try {
        const r = await callModel(id,[{role:"user",content:prompt}],apiKeys,"Tu es un traducteur expert. Tu traduis fidèlement sans ajouter de commentaires.");
        setResults(prev=>({...prev,[id]:r}));
      } catch(e) { setResults(prev=>({...prev,[id]:"❌ "+e.message})); }
      finally { setLoading(prev=>({...prev,[id]:false})); }
    }));
  };

  return (
    <div className="trad-wrap">
      <div className="trad-left">
        <div className="trad-lang-bar">
          <span style={{fontSize:9,color:"var(--mu)"}}>De :</span>
          <select style={{background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:5,color:"var(--tx)",fontFamily:"'IBM Plex Mono',monospace",fontSize:10,padding:"3px 6px"}}
            value={src} onChange={e=>setSrc(e.target.value)}>
            {LANGS.map(l=><option key={l} value={l}>{l}</option>)}
          </select>
          <span style={{fontSize:12,color:"var(--mu)"}}>→</span>
          <select style={{background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:5,color:"var(--tx)",fontFamily:"'IBM Plex Mono',monospace",fontSize:10,padding:"3px 6px"}}
            value={tgt} onChange={e=>setTgt(e.target.value)}>
            {LANGS.map(l=><option key={l} value={l}>{l}</option>)}
          </select>
          <button style={{marginLeft:"auto",background:"none",border:"1px solid var(--bd)",borderRadius:4,color:"var(--mu)",fontSize:10,padding:"2px 6px",cursor:"pointer"}}
            onClick={()=>{const t=src; setSrc(tgt); setTgt(t);}}>⇄ Inverser</button>
        </div>
        <textarea className="trad-textarea" value={text} onChange={e=>setText(e.target.value)}
          placeholder={`Texte à traduire en ${tgt.replace(/^.+\s/,"")}...`}/>
        <div style={{padding:"8px 10px",borderTop:"1px solid var(--bd)",display:"flex",alignItems:"center",gap:8,background:"var(--s1)",flexShrink:0}}>
          <span style={{fontSize:9,color:"var(--mu)",flex:1}}>{activeIds.length} IA{activeIds.length!==1?"s":""} active{activeIds.length!==1?"s":""}</span>
          <button className="trad-run-btn" onClick={translate} disabled={!text.trim()||!activeIds.length}>
            🌍 Traduire avec toutes les IAs
          </button>
        </div>
      </div>
      <div className="trad-right">
        {activeIds.length===0 && <div style={{padding:20,fontSize:11,color:"var(--mu)"}}>Active au moins une IA dans Config.</div>}
        {activeIds.map(id => {
          const m = MODEL_DEFS[id];
          return (
            <div key={id} className="trad-result-card">
              <div style={{fontSize:9,fontWeight:700,color:m.color,marginBottom:6,display:"flex",alignItems:"center",gap:6}}>
                {m.icon} {m.name}
                {loading[id] && <span style={{fontSize:8,color:"var(--mu)"}}>⏳ traduction...</span>}
                {results[id] && !loading[id] && <button onClick={()=>navigator.clipboard.writeText(results[id])} style={{marginLeft:"auto",background:"none",border:"1px solid var(--bd)",borderRadius:3,color:"var(--mu)",fontSize:9,padding:"1px 5px",cursor:"pointer"}}>⎘</button>}
              </div>
              {results[id] ? <div style={{fontSize:12,color:"var(--tx)",lineHeight:1.7,whiteSpace:"pre-wrap"}}>{results[id]}</div>
                : <div style={{fontSize:10,color:"var(--bd)"}}>{loading[id]?"...":"—"}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// AGENT AUTONOME TAB
// ═══════════════════════════════════════════════════════════
function AgentTab({ enabled, apiKeys }) {
  const AGENT_PREFERRED = ["groq","mistral","cohere","cerebras","sambanova","mixtral"];
  const [objective, setObjective] = React.useState("");
  const [steps, setSteps] = React.useState([]);
  const [running, setRunning] = React.useState(false);
  const [currentStep, setCurrentStep] = React.useState(-1);
  const [finalResult, setFinalResult] = React.useState("");
  const activeAgentIds = Object.keys(MODEL_DEFS).filter(id => enabled[id]);
  const AGENT_PREF = ["groq","mistral","cohere","cerebras","sambanova","mixtral"];
  const defaultAgentIA = AGENT_PREF.find(id => enabled[id]) || "mistral";
  const [agentIA, setAgentIA] = React.useState(defaultAgentIA);
  const activeIds = Object.keys(MODEL_DEFS).filter(id => enabled[id]);

  const run = async () => {
    if (!objective.trim()) return;
    const ia = activeIds.includes(agentIA) ? agentIA : activeIds[0];
    if (!ia) return;
    setRunning(true); setSteps([]); setFinalResult(""); setCurrentStep(0);
    try {
      // Étape 1: Décomposer l'objectif
      const planPrompt = `Tu es un agent IA autonome. Décompose cet objectif en 3 à 5 étapes concrètes et exécutables.
Objectif : ${objective}

Réponds UNIQUEMENT avec un JSON valide dans ce format exact :
{"steps": [{"id":1,"title":"Titre court","action":"Description de l'action à réaliser"},...]}`;
      
      const planRaw = await callModel(ia,[{role:"user",content:planPrompt}],apiKeys,"Tu es un agent autonome. Tu réponds uniquement en JSON valide, sans markdown.");
      let plan;
      try {
        const clean = planRaw.replace(/\`\`\`json|\`\`\`/g,"").trim();
        plan = JSON.parse(clean);
      } catch { 
        plan = {steps:[
          {id:1,title:"Analyse",action:"Analyser l'objectif et les contraintes"},
          {id:2,title:"Exécution",action:"Réaliser la tâche principale : "+objective},
          {id:3,title:"Synthèse",action:"Synthétiser et présenter les résultats"}
        ]};
      }
      const plannedSteps = plan.steps.map(s=>({...s,output:"",status:"pending"}));
      setSteps(plannedSteps);

      // Exécuter chaque étape
      let context = "";
      for (let i=0; i<plannedSteps.length; i++) {
        setCurrentStep(i);
        const step = plannedSteps[i];
        setSteps(prev=>prev.map((s,idx)=>idx===i?{...s,status:"running"}:s));
        
        const stepPrompt = `Objectif global : ${objective}
${context ? "Contexte des étapes précédentes :\n"+context+"\n\n" : ""}Étape actuelle (${i+1}/${plannedSteps.length}) : ${step.title}
Action : ${step.action}

Réalise cette étape de façon concrète et utile. Sois précis et actionnable.`;
        
        try {
          const output = await callModel(ia,[{role:"user",content:stepPrompt}],apiKeys,"Tu es un agent IA expert. Tu exécutes chaque étape de façon concrète et précise.");
          context += `\nÉtape ${i+1} (${step.title}): ${output.slice(0,500)}`;
          setSteps(prev=>prev.map((s,idx)=>idx===i?{...s,output,status:"done"}:s));
        } catch(e) {
          setSteps(prev=>prev.map((s,idx)=>idx===i?{...s,output:"❌ "+e.message,status:"error"}:s));
        }
      }

      // Synthèse finale
      setCurrentStep(plannedSteps.length);
      const synthPrompt = `Objectif : ${objective}\n\nToutes les étapes ont été réalisées. Voici le contexte :\n${context}\n\nFais une synthèse finale claire, structurée et actionnable pour l'utilisateur.`;
      const synthesis = await callModel(ia,[{role:"user",content:synthPrompt}],apiKeys,"Tu es un expert en synthèse. Tu présentes les résultats de façon claire et utile.");
      setFinalResult(synthesis);
    } finally { setRunning(false); setCurrentStep(-1); }
  };

  const STEP_TEMPLATES = [
    {label:"📝 Article de blog",obj:"Écris un article de blog complet sur l'intelligence artificielle en 2025, avec introduction accrocheuse, 3 sections développées et conclusion"},
    {label:"📊 Analyse concurrentielle",obj:"Fais une analyse concurrentielle de ChatGPT, Claude et Gemini : forces, faiblesses, cas d'usage idéaux"},
    {label:"💻 Plan technique",obj:"Crée un plan technique détaillé pour développer une application React de gestion de tâches avec backend Node.js"},
    {label:"🎯 Stratégie marketing",obj:"Développe une stratégie marketing pour lancer une application mobile IA sur le marché français"},
  ];

  return (
    <div className="agent-wrap">
      <div className="agent-hdr">
        <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:14,color:"var(--ac)"}}>🤖 Agent Autonome</div>
        <div style={{fontSize:9,color:"var(--mu)",marginTop:3}}>Donne un objectif complexe → l'IA planifie, décompose et exécute étape par étape</div>
      </div>
      <div style={{padding:"10px 14px",borderBottom:"1px solid var(--bd)",flexShrink:0,background:"var(--s1)"}}>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8}}>
          {STEP_TEMPLATES.map(t=>(
            <button key={t.label} onClick={()=>setObjective(t.obj)}
              style={{padding:"4px 10px",background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:5,color:"var(--mu)",fontSize:9,cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace"}}>
              {t.label}
            </button>
          ))}
        </div>
        <textarea style={{width:"100%",background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:7,color:"var(--tx)",fontFamily:"'IBM Plex Mono',monospace",fontSize:12,padding:"10px 12px",resize:"none",outline:"none",minHeight:64,boxSizing:"border-box"}}
          value={objective} onChange={e=>setObjective(e.target.value)}
          placeholder="Décris ton objectif… Ex: Écris un article complet sur le machine learning, avec exemples de code Python et cas d'usage pratiques"/>
        <div style={{display:"flex",alignItems:"center",gap:8,marginTop:8}}>
          <span style={{fontSize:9,color:"var(--mu)"}}>IA :</span>
          <select className="yt-add-inp" style={{flex:"none",width:"auto",padding:"3px 6px",fontSize:10}} value={agentIA} onChange={e=>setAgentIA(e.target.value)}>
            {activeIds.map(id=><option key={id} value={id}>{MODEL_DEFS[id].icon} {MODEL_DEFS[id].short}</option>)}
          </select>
          <button onClick={run} disabled={running||!objective.trim()||!activeIds.length}
            style={{marginLeft:"auto",background:running?"var(--s2)":"var(--ac)",border:"none",borderRadius:7,color:running?"var(--mu)":"#09090B",fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:12,padding:"9px 20px",cursor:running?"not-allowed":"pointer"}}>
            {running?"⏳ Exécution...":"▶ Lancer l'agent"}
          </button>
        </div>
      </div>
      <div className="agent-body">
        {steps.length===0 && !running && (
          <div style={{textAlign:"center",padding:"40px 20px",color:"var(--mu)"}}>
            <div style={{fontSize:40,marginBottom:12}}>🤖</div>
            <div style={{fontSize:12,marginBottom:6}}>L'agent va :</div>
            <div style={{fontSize:10,lineHeight:1.9,color:"#555568"}}>
              1️⃣ Analyser ton objectif<br/>
              2️⃣ Le décomposer en étapes<br/>
              3️⃣ Exécuter chaque étape séquentiellement<br/>
              4️⃣ Produire une synthèse finale
            </div>
          </div>
        )}
        {steps.map((s,i)=>(
          <div key={s.id} className={`agent-step-card ${s.status}`}>
            <div style={{fontSize:9,color:"var(--mu)",marginBottom:4,display:"flex",alignItems:"center",gap:6}}>
              <span style={{background:s.status==="done"?"var(--green)":s.status==="running"?"var(--ac)":"var(--bd)",color:s.status==="done"||s.status==="running"?"#09090B":"var(--mu)",padding:"1px 6px",borderRadius:3,fontWeight:700}}>
                {s.status==="done"?"✓":s.status==="running"?"⏳":i+1}
              </span>
              ÉTAPE {i+1}/{steps.length}
            </div>
            <div style={{fontSize:12,fontWeight:700,color:"var(--tx)",marginBottom:4}}>{s.title}</div>
            <div style={{fontSize:9,color:"var(--mu)",marginBottom:6,fontStyle:"italic"}}>{s.action}</div>
            {s.output && <div className="agent-step-output">{s.output}</div>}
          </div>
        ))}
        {finalResult && (
          <div className="agent-final">
            <div style={{fontSize:10,color:"var(--ac)",fontWeight:700,marginBottom:8,display:"flex",alignItems:"center",gap:8}}>
              ✨ SYNTHÈSE FINALE
              <button onClick={()=>navigator.clipboard.writeText(finalResult)} style={{marginLeft:"auto",background:"none",border:"1px solid rgba(212,168,83,.3)",borderRadius:3,color:"var(--ac)",fontSize:9,padding:"2px 8px",cursor:"pointer"}}>⎘ Copier</button>
            </div>
            <div className="agent-final-content"><MarkdownRenderer text={finalResult}/></div>
          </div>
        )}
      </div>
    </div>
  );
}

function YouTubeTab({ apiKeys = {} }) {
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
                style={{display:"flex",flexDirection:"row",gap:10,alignItems:"center",borderRadius:6,textDecoration:"none",transition:"background .15s,border-color .15s",opacity:isWatched?.55:1,cursor:isSrch?"wait":"pointer"}}
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


// ── PROMPTS TAB ───────────────────────────────────────────────────
function PromptsTab({ onInject }) {
  const [catFilter, setCatFilter] = React.useState("Tout");
  const [customPrompts, setCustomPrompts] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem("multiia_prompts") || "[]"); } catch { return []; }
  });
  const [showAdd, setShowAdd] = React.useState(false);
  const [form, setForm] = React.useState({ title:"", cat:"Code", icon:"💡", text:"" });
  const [search, setSearch] = React.useState("");

  const saveCustom = (list) => { setCustomPrompts(list); try { localStorage.setItem("multiia_prompts", JSON.stringify(list)); } catch {} };
  const allPrompts = [...customPrompts, ...DEFAULT_PROMPTS, ...EXTRA_PROMPTS];
  const cats = ["Tout", ...new Set(allPrompts.map(p => p.cat))];
  const filtered = allPrompts.filter(p => {
    const matchCat = catFilter === "Tout" || p.cat === catFilter;
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.text.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const addPrompt = () => {
    if (!form.title.trim() || !form.text.trim()) return;
    const p = { id:"c_"+Date.now(), ...form, custom:true };
    saveCustom([p, ...customPrompts]);
    setShowAdd(false); setForm({ title:"", cat:"Code", icon:"💡", text:"" });
  };
  const delPrompt = (id) => saveCustom(customPrompts.filter(p => p.id !== id));
  const PROMPT_CATS_FORM = ["Code","Rédaction","Analyse","Créatif","Business","Traduction","Autre"];

  const [genDesc, setGenDesc] = React.useState("");
  const [genLoading, setGenLoading] = React.useState(false);
  const [genResults, setGenResults] = React.useState([]);

  // ── Prompt Genetics Lab ──────────────────────────────────────────
  const GENETICS_KEY = "multiia_prompt_genetics";
  const [geneticsPool, setGeneticsPool] = React.useState(() => {
    try { const s = localStorage.getItem(GENETICS_KEY); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  const [selectedForBreeding, setSelectedForBreeding] = React.useState([]);
  const [mutationLevel, setMutationLevel] = React.useState(0.3);
  const [evolving, setEvolving] = React.useState(false);
  const [generationCount, setGenerationCount] = React.useState(0);
  const [fitnessCriteria, setFitnessCriteria] = React.useState("clarté, précision, efficacité");

  const saveGenetics = (pool) => { setGeneticsPool(pool); try { localStorage.setItem(GENETICS_KEY, JSON.stringify(pool)); } catch {} };

  const addToPool = (prompt, title) => {
    const newPrompt = {
      id: "g_" + Date.now(),
      title: title || prompt.slice(0, 40) + "…",
      prompt,
      fitness: 50,
      generation: generationCount + 1,
      parents: selectedForBreeding.length === 2 ? selectedForBreeding : [],
      mutations: 0,
      createdAt: new Date().toISOString(),
    };
    const updated = [newPrompt, ...geneticsPool];
    saveGenetics(updated);
    setGenerationCount(generationCount + 1);
  };

  const calculateFitness = async (promptObj) => {
    // Simule un score de fitness basé sur plusieurs critères
    const p = promptObj.prompt;
    let score = 50;
    // Longueur optimale
    if (p.length > 100 && p.length < 1000) score += 15;
    // Présence de contexte
    if (p.toLowerCase().includes("contexte") || p.toLowerCase().includes("rôle")) score += 10;
    // Format de sortie spécifié
    if (p.toLowerCase().includes("format") || p.toLowerCase().includes("structure")) score += 10;
    // Exemples inclus
    if (p.toLowerCase().includes("exemple") || p.includes(":")) score += 10;
    // Contraintes
    if (p.toLowerCase().includes("contrainte") || p.toLowerCase().includes("limite")) score += 5;
    return Math.min(100, score);
  };

  const mutatePrompt = (prompt, level) => {
    const mutations = [
      (p) => p.replace(/analyse/gi, "analyse approfondie et détaillée"),
      (p) => p.replace(/génère/gi, "génère de manière créative et structurée"),
      (p) => p + "\n\nPrends une profonde inspiration et résous ce problème étape par étape.",
      (p) => "Tu es un expert mondial dans ce domaine. " + p,
      (p) => p + "\n\nFormat de sortie requis : sois clair, concis et utilise des sections.",
      (p) => p.replace(/\./g, ". ") + " Assure-toi que chaque point est bien développé.",
      (p) => "Contexte : Cette tâche est critique pour mon projet.\n" + p,
      (p) => p + "\n\nContrainte importante : ne fais aucune supposition non vérifiée.",
    ];
    let mutated = prompt;
    const numMutations = Math.floor(level * mutations.length);
    const shuffled = [...mutations].sort(() => Math.random() - 0.5);
    for (let i = 0; i < Math.max(1, numMutations); i++) {
      mutated = shuffled[i](mutated);
    }
    return { mutated, mutationCount: Math.max(1, numMutations) };
  };

  const crossover = (parent1, parent2) => {
    // Combine les meilleurs éléments des deux parents
    const p1Parts = parent1.prompt.split(/\n\n+/);
    const p2Parts = parent2.prompt.split(/\n\n+/);
    const childParts = [];
    
    // Prend l'intro du parent 1 si elle existe
    if (p1Parts[0] && p1Parts[0].length < 200) childParts.push(p1Parts[0]);
    else if (p2Parts[0]) childParts.push(p2Parts[0]);
    
    // Fusionne les instructions principales
    const middle1 = p1Parts.slice(1, -1).join("\n\n");
    const middle2 = p2Parts.slice(1, -1).join("\n\n");
    if (middle1 && middle2) {
      childParts.push(middle1 + "\n\n" + middle2);
    } else if (middle1) {
      childParts.push(middle1);
    } else if (middle2) {
      childParts.push(middle2);
    }
    
    // Prend la conclusion/format du parent 2
    if (p2Parts[p2Parts.length - 1] && p2Parts.length > 1) {
      childParts.push(p2Parts[p2Parts.length - 1]);
    } else if (p1Parts[p1Parts.length - 1] && p1Parts.length > 1) {
      childParts.push(p1Parts[p1Parts.length - 1]);
    }
    
    return childParts.join("\n\n") || parent1.prompt + " " + parent2.prompt;
  };

  const evolvePrompts = async () => {
    if (selectedForBreeding.length < 2) {
      alert("Sélectionne 2 prompts parents pour commencer l'évolution");
      return;
    }
    setEvolving(true);
    try {
      const parents = geneticsPool.filter(p => selectedForBreeding.includes(p.id));
      if (parents.length !== 2) throw new Error("Il faut exactement 2 parents");
      
      // Crossover
      const childPrompt = crossover(parents[0], parents[1]);
      
      // Mutation
      const { mutated, mutationCount } = mutatePrompt(childPrompt, mutationLevel);
      
      // Calcul du fitness
      const baseFitness = await calculateFitness({ prompt: mutated });
      
      const evolvedPrompt = {
        id: "e_" + Date.now(),
        title: `G${generationCount + 1} - Enfant de "${parents[0].title.slice(0, 20)}" & "${parents[1].title.slice(0, 20)}"`,
        prompt: mutated,
        fitness: baseFitness,
        generation: generationCount + 1,
        parents: selectedForBreeding,
        mutations: mutationCount,
        createdAt: new Date().toISOString(),
      };
      
      const updated = [evolvedPrompt, ...geneticsPool];
      saveGenetics(updated);
      setGenerationCount(generationCount + 1);
      setSelectedForBreeding([evolvedPrompt.id]);
    } catch (e) {
      alert("Erreur lors de l'évolution : " + e.message);
    }
    setEvolving(false);
  };

  const toggleSelection = (id) => {
    if (selectedForBreeding.includes(id)) {
      setSelectedForBreeding(selectedForBreeding.filter(sid => sid !== id));
    } else if (selectedForBreeding.length < 2) {
      setSelectedForBreeding([...selectedForBreeding, id]);
    }
  };

  const importFromLibrary = () => {
    // Importe des prompts de la bibliothèque vers le pool génétique
    const imported = allPrompts.slice(0, 5).map((p, i) => ({
      id: "gi_" + Date.now() + "_" + i,
      title: p.title,
      prompt: p.text,
      fitness: 60,
      generation: 0,
      parents: [],
      mutations: 0,
      createdAt: new Date().toISOString(),
    }));
    const updated = [...imported, ...geneticsPool];
    saveGenetics(updated);
  };

  // ── Trending Prompts ──────────────────────────────────────────
  const TRENDING_KEY = "multiia_trending_prompts";
  const DEFAULT_TRENDING = [
    { rank:1,  cat:"💼 Business",    title:"Analyse concurrentielle", usage:"Très demandé", trend:"▲", prompt:"Fais une analyse concurrentielle complète de [ENTREPRISE/PRODUIT]. Identifie les 5 principaux concurrents, compare les forces/faiblesses, prix, positionnement et propose une stratégie de différenciation." },
    { rank:2,  cat:"💻 Code",        title:"Refactoring & Clean Code", usage:"Tendance", trend:"▲", prompt:"Analyse ce code et propose un refactoring complet : améliore la lisibilité, applique les principes SOLID, extrait les fonctions trop longues, ajoute des commentaires JSDoc.\n\n[COLLE TON CODE]" },
    { rank:3,  cat:"✍️ Rédaction",   title:"Thread LinkedIn viral",   usage:"Populaire", trend:"→", prompt:"Crée un thread LinkedIn en 8 posts sur [SUJET]. Format : post d'accroche fort, 6 posts de valeur (insight, chiffre, astuce, erreur courante, exemple, leçon), CTA final. Ton authentique et engageant." },
    { rank:4,  cat:"🎯 Prompt Eng.", title:"Améliorer un prompt",     usage:"Incontournable", trend:"▲", prompt:"Tu es expert en prompt engineering. Analyse ce prompt et propose une version optimisée 10x plus précise, avec contexte, format de sortie, exemples et contraintes.\n\nPrompt original : [TON PROMPT]" },
    { rank:5,  cat:"📊 Analyse",     title:"Business Plan rapide",    usage:"Demandé", trend:"→", prompt:"Génère un business plan structuré pour : [IDÉE]. Sections : résumé exécutif, problème résolu, solution, marché cible (TAM/SAM/SOM), modèle économique, roadmap 12 mois, risques et mitigation." },
    { rank:6,  cat:"🤖 IA Pratique", title:"Prompt système expert",   usage:"Nouveau", trend:"🆕", prompt:"Crée un prompt système complet pour un assistant IA spécialisé en [DOMAINE]. Inclus : rôle, ton, expertise, règles de réponse, exemples de Q&A, limites et comportements par défaut." },
    { rank:7,  cat:"📧 Comm.",       title:"Cold email personnalisé", usage:"Populaire", trend:"→", prompt:"Rédige un cold email de prospection en [3/5/7] phrases pour [PRODUIT/SERVICE]. Cible : [PROFIL]. Accroche sur le problème spécifique, pas sur notre solution. Appel à l'action : réponse simple oui/non." },
    { rank:8,  cat:"🔍 Recherche",   title:"Synthèse de sources",     usage:"Tendance", trend:"▲", prompt:"Synthétise ces [N] sources/articles sur [SUJET] en : 1) Points de consensus, 2) Points contradictoires, 3) Ce qui manque dans la littérature, 4) Tes 3 conclusions actionnables.\n\n[SOURCES]" },
  ];
  const [trendingPrompts, setTrendingPrompts] = React.useState(() => {
    try { const s = localStorage.getItem(TRENDING_KEY); return s ? JSON.parse(s) : DEFAULT_TRENDING; } catch { return DEFAULT_TRENDING; }
  });
  const [trendingLoading, setTrendingLoading] = React.useState(false);
  const [trendingDate, setTrendingDate] = React.useState(() => {
    try { return localStorage.getItem(TRENDING_KEY+"_date") || null; } catch { return null; }
  });
  const [showTrending, setShowTrending] = React.useState(true);

  const refreshTrending = async () => {
    setTrendingLoading(true);
    try {
      const sysPrompt = "Tu es un expert en IA et prompt engineering. Tu surveilles les tendances des communautés : Reddit r/ChatGPT, r/ClaudeAI, r/PromptEngineering, PromptBase, FlowGPT, et les discussions Twitter/X IA. Tu réponds UNIQUEMENT en JSON valide, sans markdown ni backticks.";
      const userPrompt = "Génère 8 prompts tendance du moment pour les utilisateurs d'IA (ChatGPT, Claude, Groq). Ce sont les types de prompts les plus utilisés et partagés en ce moment.\nRetourne UNIQUEMENT ce JSON valide :\n[{\"rank\":1,\"cat\":\"emoji Catégorie\",\"title\":\"Titre court\",\"usage\":\"Populaire/Tendance/Nouveau/Viral\",\"trend\":\"▲/→/🆕\",\"prompt\":\"Le prompt complet prêt à l'emploi avec [PLACEHOLDERS]\"}]";
      let raw;
      if (apiKeys.groq_inf) {
        const r = await fetch("https://api.groq.com/openai/v1/chat/completions",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+apiKeys.groq_inf},body:JSON.stringify({model:"llama-3.3-70b-versatile",max_tokens:2500,messages:[{role:"system",content:sysPrompt},{role:"user",content:userPrompt}]})});
        const d = await r.json();
        raw = d.choices?.[0]?.message?.content;
      } else if (apiKeys.mistral) {
        const r = await fetch("https://api.mistral.ai/v1/chat/completions",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+apiKeys.mistral},body:JSON.stringify({model:"mistral-small-latest",max_tokens:2500,messages:[{role:"system",content:sysPrompt},{role:"user",content:userPrompt}]})});
        const d = await r.json();
        raw = d.choices?.[0]?.message?.content;
      } else { throw new Error("Active Groq ou Mistral dans Config pour rafraîchir"); }
      const clean = (raw||"").replace(/```json|```/g,"").trim();
      const m = clean.match(/\[[\s\S]*\]/);
      if (!m) throw new Error("Réponse invalide");
      const data = JSON.parse(m[0]);
      setTrendingPrompts(data);
      const now = new Date().toLocaleDateString("fr-FR",{day:"2-digit",month:"2-digit",year:"2-digit",hour:"2-digit",minute:"2-digit"});
      setTrendingDate(now);
      try { localStorage.setItem(TRENDING_KEY, JSON.stringify(data)); localStorage.setItem(TRENDING_KEY+"_date", now); } catch {}
    } catch(e) { alert("Erreur : "+e.message); }
    setTrendingLoading(false);
  };

  const generatePrompts = async () => {
    if (!genDesc.trim()) return;
    setGenLoading(true); setGenResults([]);
    try {
      const prompt = "Tu es un expert en prompt engineering. Genere exactement 5 prompts optimises pour cette intention : " + genDesc + "\n\nChaque prompt doit etre pret a l'emploi, precis et efficace.\nReponds UNIQUEMENT avec JSON valide :\n{\"prompts\":[{\"title\":\"Titre court\",\"prompt\":\"Le prompt complet\",\"use\":\"Ideal pour...\"}]}";
      const r = await callClaude([{role:"user",content:prompt}],"Tu es expert en prompt engineering. Tu reponds uniquement en JSON valide, sans markdown ni backticks.");
      const clean = r.replace(/```json|```/g,"").trim();
      const data = JSON.parse(clean);
      setGenResults(data.prompts||[]);
    } catch(e) { setGenResults([{title:"Erreur",prompt:"Impossible de generer : "+e.message,use:""}]); }
    setGenLoading(false);
  };

  return (
    <div className="prom-wrap">
      {/* ══ GÉNÉRATEUR DE PROMPTS IA ══ */}
      <div style={{padding:"12px 14px",borderBottom:"1px solid var(--bd)",flexShrink:0}}>
        <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:12,color:"var(--ac)",marginBottom:8}}>✨ Générateur de prompts IA
          <span style={{fontSize:8,color:"var(--mu)",fontWeight:400,marginLeft:6}}>— Décris ton intention → Claude génère 5 prompts optimisés</span>
        </div>
        <div style={{display:"flex",gap:8,marginBottom:8}}>
          <input style={{flex:1,background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:7,color:"var(--tx)",fontFamily:"'IBM Plex Mono',monospace",fontSize:12,padding:"8px 12px",outline:"none"}}
            value={genDesc} onChange={e=>setGenDesc(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")generatePrompts();}}
            placeholder="Ex: résumer un PDF, écrire un email pro, déboguer du Python…"/>
          <button onClick={generatePrompts} disabled={genLoading||!genDesc.trim()}
            style={{background:genLoading?"var(--s2)":"var(--ac)",border:"none",borderRadius:7,color:genLoading?"var(--mu)":"#09090B",fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:11,padding:"8px 14px",cursor:genLoading?"not-allowed":"pointer",whiteSpace:"nowrap"}}>
            {genLoading?"⏳...":"✨ Générer 5 prompts"}
          </button>
        </div>
        {genResults.length > 0 && (
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {genResults.map((p,i)=>(
              <div key={i} style={{background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:7,padding:"9px 11px"}}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:5,flexWrap:"wrap"}}>
                  <span style={{fontSize:9,fontWeight:700,color:"var(--ac)"}}>{i+1}. {p.title}</span>
                  {p.use && <span style={{fontSize:8,color:"var(--mu)",fontStyle:"italic"}}>{p.use}</span>}
                  <div style={{marginLeft:"auto",display:"flex",gap:4}}>
                    <button onClick={()=>navigator.clipboard.writeText(p.prompt)}
                      style={{background:"none",border:"1px solid var(--bd)",borderRadius:4,color:"var(--mu)",fontSize:9,padding:"2px 7px",cursor:"pointer"}}>⎘ Copier</button>
                    <button onClick={()=>onInject&&onInject(p.prompt)}
                      style={{background:"rgba(212,168,83,.15)",border:"1px solid rgba(212,168,83,.4)",borderRadius:4,color:"var(--ac)",fontSize:9,padding:"2px 7px",cursor:"pointer",fontWeight:700}}>↗ Utiliser</button>
                  </div>
                </div>
                <div style={{fontSize:11,color:"var(--tx)",lineHeight:1.65,fontFamily:"'IBM Plex Mono',monospace",wordBreak:"break-word"}}>{p.prompt}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ══ TRENDING PROMPTS ══ */}
      <div style={{padding:"10px 14px 14px",borderBottom:"1px solid var(--bd)",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8,flexWrap:"wrap"}}>
          <button onClick={()=>setShowTrending(v=>!v)} style={{display:"flex",alignItems:"center",gap:6,fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:12,color:"var(--orange)",background:"none",border:"none",cursor:"pointer",padding:0}}>
            🔥 Prompts Tendance {showTrending?"▲":"▼"}
          </button>
          {trendingDate && <span style={{fontSize:8,color:"var(--mu)"}}>Mis à jour le {trendingDate}</span>}
          <button onClick={refreshTrending} disabled={trendingLoading}
            style={{marginLeft:"auto",fontSize:8,padding:"3px 10px",background:trendingLoading?"var(--s2)":"rgba(251,146,60,.12)",border:"1px solid rgba(251,146,60,.4)",borderRadius:4,color:trendingLoading?"var(--mu)":"var(--orange)",cursor:trendingLoading?"not-allowed":"pointer",fontFamily:"'IBM Plex Mono',monospace",fontWeight:700}}>
            {trendingLoading ? "⏳ Génération…" : "🔄 Rafraîchir via IA"}
          </button>
        </div>
        {showTrending && (
          <div style={{overflowX:"auto",paddingBottom:4}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:10,minWidth:560}}>
              <thead>
                <tr style={{background:"var(--s2)"}}>
                  <th style={{padding:"5px 8px",textAlign:"left",color:"var(--mu)",fontWeight:600,fontSize:8,whiteSpace:"nowrap"}}>#</th>
                  <th style={{padding:"5px 8px",textAlign:"left",color:"var(--mu)",fontWeight:600,fontSize:8}}>Catégorie</th>
                  <th style={{padding:"5px 8px",textAlign:"left",color:"var(--mu)",fontWeight:600,fontSize:8}}>Prompt</th>
                  <th style={{padding:"5px 8px",textAlign:"left",color:"var(--mu)",fontWeight:600,fontSize:8}}>Usage</th>
                  <th style={{padding:"5px 8px",textAlign:"left",color:"var(--mu)",fontWeight:600,fontSize:8}}>Trend</th>
                  <th style={{padding:"5px 8px",color:"var(--mu)",fontWeight:600,fontSize:8}}></th>
                </tr>
              </thead>
              <tbody>
                {trendingPrompts.map((p,i) => (
                  <tr key={i} style={{borderTop:"1px solid var(--bd)",transition:"background .15s",cursor:"pointer"}}
                    onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,.03)"}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <td style={{padding:"6px 8px",fontWeight:700,color:"var(--ac)",fontSize:10}}>#{p.rank||i+1}</td>
                    <td style={{padding:"6px 8px",fontSize:9,color:"var(--orange)",whiteSpace:"nowrap"}}>{p.cat}</td>
                    <td style={{padding:"6px 8px",fontWeight:700,color:"var(--tx)",fontSize:10}}>{p.title}</td>
                    <td style={{padding:"6px 8px",fontSize:9,color:"var(--mu)",whiteSpace:"nowrap"}}>{p.usage}</td>
                    <td style={{padding:"6px 8px",fontSize:12,textAlign:"center"}}>{p.trend}</td>
                    <td style={{padding:"6px 8px",textAlign:"right",whiteSpace:"nowrap"}}>
                      <button onClick={()=>onInject&&onInject(p.prompt)}
                        style={{fontSize:8,padding:"3px 8px",background:"rgba(212,168,83,.12)",border:"1px solid rgba(212,168,83,.35)",borderRadius:4,color:"var(--ac)",cursor:"pointer",marginRight:3,fontFamily:"'IBM Plex Mono',monospace",fontWeight:700}}>↗ Injecter</button>
                      <button onClick={()=>{try{navigator.clipboard.writeText(p.prompt);}catch{}}}
                        style={{fontSize:8,padding:"3px 8px",background:"transparent",border:"1px solid var(--bd)",borderRadius:4,color:"var(--mu)",cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace"}}>⎘</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ══ PROMPT GENETICS LAB ══ */}
      <div style={{padding:"12px 14px",borderBottom:"1px solid var(--bd)",flexShrink:0,background:"linear-gradient(135deg, rgba(96,165,250,.08), rgba(212,168,83,.05))"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10,flexWrap:"wrap"}}>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:13,color:"var(--blue)"}}>🧬 Prompt Genetics Lab
            <span style={{fontSize:8,color:"var(--mu)",fontWeight:400,marginLeft:8}}>- Évolution algorithmique de prompts</span>
          </div>
          {generationCount > 0 && (
            <span style={{fontSize:8,color:"var(--ac)",background:"rgba(212,168,83,.1)",padding:"2px 8px",borderRadius:4}}>Génération #{generationCount}</span>
          )}
          <button onClick={importFromLibrary} disabled={geneticsPool.length >= 20}
            style={{marginLeft:"auto",fontSize:8,padding:"4px 10px",background:geneticsPool.length>=20?"var(--s2)":"rgba(96,165,250,.15)",border:"1px solid rgba(96,165,250,.4)",borderRadius:4,color:geneticsPool.length>=20?"var(--mu)":"var(--blue)",cursor:geneticsPool.length>=20?"not-allowed":"pointer",fontFamily:"'IBM Plex Mono',monospace",fontWeight:700}}>
            📥 Importer depuis bibliothèque
          </button>
        </div>
        
        {/* Pool génétique */}
        <div style={{display:"flex",gap:12,marginBottom:12}}>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:9,fontWeight:700,color:"var(--mu)",marginBottom:6}}>🧪 POOL GÉNÉTIQUE ({geneticsPool.length})</div>
            {geneticsPool.length === 0 ? (
              <div style={{fontSize:9,color:"var(--mu)",padding:"12px",background:"var(--s2)",borderRadius:6,textAlign:"center"}}>
                Aucun prompt dans le pool. Importe depuis la bibliothèque ou ajoute manuellement.
              </div>
            ) : (
              <div style={{display:"flex",flexDirection:"column",gap:4,maxHeight:220,overflowY:"auto"}}>
                {geneticsPool.map((p, idx) => (
                  <div key={p.id} onClick={()=>toggleSelection(p.id)}
                    style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",background:selectedForBreeding.includes(p.id)?"rgba(96,165,250,.15)":"var(--s2)",border:selectedForBreeding.includes(p.id)?"1px solid var(--blue)":"1px solid var(--bd)",borderRadius:5,cursor:"pointer",transition:"all .15s"}}
                    onMouseEnter={e=>{if(!selectedForBreeding.includes(p.id))e.currentTarget.style.borderColor="var(--mu)"}}
                    onMouseLeave={e=>{if(!selectedForBreeding.includes(p.id))e.currentTarget.style.borderColor="var(--bd)"}}>
                    <span style={{fontSize:8,color:selectedForBreeding.includes(p.id)?"var(--blue)":"var(--mu)",width:16,textAlign:"center"}}>
                      {selectedForBreeding.includes(p.id)?"☑":"☐"}
                    </span>
                    <span style={{fontSize:9,color:"var(--tx)",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.title}</span>
                    <span style={{fontSize:7,color:"var(--green)",background:"rgba(74,222,128,.1)",padding:"1px 5px",borderRadius:3}}>Fitness: {p.fitness}</span>
                    <span style={{fontSize:7,color:"var(--orange)"}}>G{p.generation}</span>
                    {p.mutations > 0 && <span style={{fontSize:7,color:"var(--blue)"}}>μ{p.mutations}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Contrôles d'évolution */}
          <div style={{width:200,flexShrink:0,display:"flex",flexDirection:"column",gap:8}}>
            <div style={{fontSize:9,fontWeight:700,color:"var(--mu)"}}>⚙️ CONTRÔLES</div>
            <div>
              <label style={{fontSize:8,color:"var(--tx)",display:"block",marginBottom:4}}>Taux de mutation: {Math.round(mutationLevel*100)}%</label>
              <input type="range" min="0" max="1" step="0.1" value={mutationLevel} onChange={e=>setMutationLevel(parseFloat(e.target.value))}
                style={{width:"100%",accentColor:"var(--blue)"}}/>
            </div>
            <div>
              <label style={{fontSize:8,color:"var(--tx)",display:"block",marginBottom:4}}>Critères fitness</label>
              <input value={fitnessCriteria} onChange={e=>setFitnessCriteria(e.target.value)}
                style={{width:"100%",background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:4,color:"var(--tx)",fontSize:8,padding:"4px 6px"}}/>
            </div>
            <button onClick={evolvePrompts} disabled={evolving || selectedForBreeding.length !== 2}
              style={{padding:"8px 12px",background:evolving||selectedForBreeding.length!==2?"var(--s2)":"linear-gradient(135deg, var(--blue), var(--ac))",border:"none",borderRadius:6,color:evolving||selectedForBreeding.length!==2?"var(--mu)":"#09090B",fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:10,cursor:evolving||selectedForBreeding.length!==2?"not-allowed":"pointer",marginTop:"auto"}}>
              {evolving ? "⏳ Évolution..." : selectedForBreeding.length===2 ? "🧬 ÉVOLUER →" : "Sélectionne 2 parents"}
            </button>
            {selectedForBreeding.length === 2 && (
              <div style={{fontSize:7,color:"var(--green)",textAlign:"center"}}>✓ Prêt pour croisement</div>
            )}
          </div>
        </div>
        
        {/* Dernières évolutions */}
        {geneticsPool.filter(p=>p.generation===generationCount && generationCount>0).length > 0 && (
          <div style={{marginTop:10,padding:"8px 10px",background:"rgba(74,222,128,.05)",border:"1px solid rgba(74,222,128,.2)",borderRadius:6}}>
            <div style={{fontSize:9,fontWeight:700,color:"var(--green)",marginBottom:6}}>✨ DERNIÈRE GÉNÉRATION</div>
            {geneticsPool.filter(p=>p.generation===generationCount).slice(0,3).map(p=>(
              <div key={p.id} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",background:"var(--s2)",borderRadius:4,marginBottom:4}}>
                <span style={{fontSize:8,color:"var(--green)"}}>🧬</span>
                <span style={{fontSize:9,color:"var(--tx)",flex:1}}>{p.title}</span>
                <span style={{fontSize:7,color:"var(--green)"}}>Fitness: {p.fitness}</span>
                <button onClick={()=>onInject&&onInject(p.prompt)}
                  style={{fontSize:7,padding:"2px 6px",background:"rgba(74,222,128,.15)",border:"1px solid rgba(74,222,128,.3)",borderRadius:3,color:"var(--green)",cursor:"pointer",fontWeight:700}}>↗ Utiliser</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="prom-hdr">
        <div style={{flex:1}}>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:"clamp(14px,2.5vw,18px)",color:"var(--tx)",marginBottom:4}}>📋 Bibliothèque de Prompts</div>
          <div style={{fontSize:9,color:"var(--mu)"}}>Clique sur <strong style={{color:"var(--ac)"}}>↗ Injecter</strong> pour envoyer le prompt dans le Chat · {allPrompts.length} prompts</div>
        </div>
        <button className="prom-inject" style={{flex:"none",padding:"7px 14px"}} onClick={() => setShowAdd(true)}>＋ Nouveau prompt</button>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap",alignItems:"center"}}>
        <input style={{background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:6,color:"var(--tx)",fontFamily:"'IBM Plex Mono',monospace",fontSize:11,padding:"6px 10px",outline:"none",flex:1,minWidth:160}}
          placeholder="Rechercher…" value={search} onChange={e=>setSearch(e.target.value)}/>
        <div className="prom-cats">
          {cats.map(c => <button key={c} className={"filter-btn "+(catFilter===c?"on":"")} onClick={()=>setCatFilter(c)}>{c}</button>)}
        </div>
      </div>
      <div className="prom-grid">
        {filtered.map(p => (
          <div key={p.id} className={"prom-card "+(p.custom?"custom":"")}>
            <div className="prom-card-hdr">
              <span className="prom-icon">{p.icon}</span>
              <span className="prom-title">{p.title}</span>
              <span className="prom-cat-badge">{p.cat}</span>
            </div>
            <div className="prom-preview">{p.text}</div>
            <div className="prom-btns">
              <button className="prom-inject" onClick={() => onInject(p.text)}>↗ Injecter dans Chat</button>
              <button className="prom-del" title="Partager ce prompt par lien" onClick={()=>{
                try{const b64=btoa(unescape(encodeURIComponent(JSON.stringify({type:"prompt",text:p.text,title:p.title}))));
                navigator.clipboard.writeText(window.location.origin+window.location.pathname+"?prompt="+encodeURIComponent(b64));
                }catch(e){navigator.clipboard.writeText(p.text);}
              }} style={{color:"var(--blue)",borderColor:"rgba(96,165,250,.3)"}}>🔗</button>
              {p.custom && <button className="prom-del" onClick={() => delPrompt(p.id)}>✕</button>}
            </div>
          </div>
        ))}
      </div>
      {showAdd && (
        <div className="yt-add-modal" onClick={e => { if(e.target===e.currentTarget) setShowAdd(false); }}>
          <div className="yt-add-modal-box" style={{maxWidth:520}}>
            <div className="yt-add-modal-title">📋 Nouveau Prompt</div>
            <div className="yt-add-row" style={{gap:8}}>
              <div className="yt-add-field" style={{flex:"none",width:60}}>
                <label className="yt-add-label">Icône</label>
                <input className="yt-add-inp" value={form.icon} onChange={e=>setForm(f=>({...f,icon:e.target.value}))} style={{textAlign:"center",fontSize:16}} maxLength={2}/>
              </div>
              <div className="yt-add-field" style={{flex:2}}>
                <label className="yt-add-label">Titre *</label>
                <input className="yt-add-inp" placeholder="Nom du prompt" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))}/>
              </div>
              <div className="yt-add-field" style={{flex:1}}>
                <label className="yt-add-label">Catégorie</label>
                <select className="yt-add-inp" value={form.cat} onChange={e=>setForm(f=>({...f,cat:e.target.value}))}>
                  {PROMPT_CATS_FORM.map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="yt-add-field">
              <label className="yt-add-label">Texte *</label>
              <textarea className="yt-add-inp" rows={6} placeholder="Écris ton prompt ici… Utilise [PLACEHOLDER] pour les zones à remplir." style={{resize:"vertical",lineHeight:1.6}} value={form.text} onChange={e=>setForm(f=>({...f,text:e.target.value}))}/>
            </div>
            <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
              <button onClick={()=>setShowAdd(false)} style={{padding:"7px 14px",background:"transparent",border:"1px solid var(--bd)",borderRadius:5,color:"var(--mu)",cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace",fontSize:10}}>Annuler</button>
              <button onClick={addPrompt} style={{padding:"7px 18px",background:"rgba(212,168,83,.15)",border:"1px solid var(--ac)",borderRadius:5,color:"var(--ac)",cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace",fontSize:10,fontWeight:700}}>＋ Créer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── RÉDACTION TAB ─────────────────────────────────────────────────
function RedactionTab({ enabled, apiKeys }) {
  const [inputText, setInputText] = React.useState("");
  const [activeAction, setActiveAction] = React.useState(null);
  const [results, setResults] = React.useState({});
  const [loading, setLoading] = React.useState({});
  const activeIds = Object.keys(MODEL_DEFS).filter(id => enabled[id]);

  const runAction = async (action) => {
    if (!inputText.trim()) return;
    setActiveAction(action.id);
    const prompt = action.prompt(inputText);
    const ids = activeIds;
    if (!ids.length) return;
    const newLoad = {}; ids.forEach(id=>{newLoad[id]=true;}); setLoading(newLoad);
    const newRes = {}; ids.forEach(id=>{newRes[id]="";}); setResults(newRes);
    await Promise.all(ids.map(async (id) => {
      try {
        const reply = await callModel(id, [{role:"user",content:prompt}], apiKeys);
        setResults(prev => ({...prev, [id]:reply}));
      } catch(e) {
        setResults(prev => ({...prev, [id]:"❌ "+e.message}));
      } finally { setLoading(prev => ({...prev,[id]:false})); }
    }));
  };

  return (
    <div className="red-wrap">
      <div className="red-left">
        <div style={{padding:"8px 10px",borderBottom:"1px solid var(--bd)",fontSize:9,color:"var(--mu)",display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
          <span style={{color:"var(--ac)",fontWeight:700}}>✍️ RÉDACTION</span>
          <span style={{flex:1}}>— Colle ou écris ton texte</span>
          <button style={{background:"none",border:"1px solid var(--bd)",borderRadius:3,color:"var(--mu)",cursor:"pointer",fontSize:8,padding:"1px 5px",fontFamily:"'IBM Plex Mono',monospace"}}
            onClick={()=>{setInputText("");setResults({});setActiveAction(null);}}>↺ Vider</button>
        </div>
        <textarea className="red-textarea" placeholder={"Colle ton texte ici…\n\nChoisis ensuite une action en bas."}
          value={inputText} onChange={e=>setInputText(e.target.value)}/>
        <div style={{padding:"4px 8px",borderTop:"1px solid var(--bd)",fontSize:8,color:"var(--mu)",background:"var(--s1)",flexShrink:0}}>
          {inputText.length} caractères · {activeIds.length} IA{activeIds.length>1?"s":""} active{activeIds.length>1?"s":""}
        </div>
        <div className="red-actions">
          {REDACTION_ACTIONS.map(a => (
            <button key={a.id} className={"red-act-btn "+(activeAction===a.id?"active":"")}
              onClick={() => runAction(a)} disabled={!inputText.trim()}>
              {a.icon} {a.label}
            </button>
          ))}
        </div>
      </div>
      <div className="red-right">
        {!activeAction ? (
          <div className="red-placeholder">
            <div style={{fontSize:32}}>✍️</div>
            <strong style={{color:"var(--tx)"}}>Choisis une action</strong>
            <div style={{maxWidth:280,color:"var(--mu)",textAlign:"center"}}>Colle un texte à gauche, puis clique sur une action pour le faire traiter par toutes tes IAs actives simultanément.</div>
          </div>
        ) : (
          <div className="red-results">
            {activeIds.map(id => {
              const m = MODEL_DEFS[id];
              const res = results[id];
              const isLoad = loading[id];
              return (
                <div key={id} className="red-result-card" style={{borderColor:m.color+"33"}}>
                  <div className="red-result-hdr" style={{borderBottomColor:m.border}}>
                    <span style={{color:m.color,fontSize:12}}>{m.icon}</span>
                    <span style={{color:m.color,fontWeight:700,fontSize:10,fontFamily:"'Syne',sans-serif"}}>{m.name}</span>
                    {res && !isLoad && <button className="red-copy-btn" onClick={()=>{try{navigator.clipboard.writeText(res);}catch{}}}>⎘ Copier</button>}
                  </div>
                  <div className="red-result-body">
                    {isLoad ? <span className="dots"><span>·</span><span>·</span><span>·</span></span> : (res ? <MarkdownRenderer text={res}/> : <span style={{color:"var(--mu)"}}>En attente…</span>)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── RECHERCHE TAB ─────────────────────────────────────────────────
function RechercheTab({ enabled, apiKeys, setChatInput, setTab }) {
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState({});
  const [loading, setLoading] = React.useState({});
  const [hasSearched, setHasSearched] = React.useState(false);
  const activeIds = Object.keys(MODEL_DEFS).filter(id => enabled[id]);

  const SUGGESTIONS = [
    "Quelle est la meilleure IA gratuite en 2025 ?",
    "Comment fonctionne un LLM en pratique ?",
    "Quelles IAs sont bonnes pour coder ?",
    "IA générative : quels risques éthiques ?",
    "Comment créer un agent IA autonome ?",
  ];
  const SEARCH_SYSTEM = "Tu es un assistant de recherche expert. Réponds de manière structurée, factuelle et complète. Utilise des sous-titres et listes pour organiser.";

  const doSearch = async (q) => {
    const qry = (q || query).trim();
    if (!qry || !activeIds.length) return;
    setQuery(qry); setHasSearched(true);
    const newLoad = {}; activeIds.forEach(id=>{newLoad[id]=true;}); setLoading(newLoad);
    const newRes = {}; activeIds.forEach(id=>{newRes[id]=""}); setResults(newRes);
    await Promise.all(activeIds.map(async (id) => {
      try {
        const reply = await callModel(id, [{role:"user",content:qry}], apiKeys, SEARCH_SYSTEM);
        setResults(prev => ({...prev,[id]:reply}));
      } catch(e) { setResults(prev => ({...prev,[id]:"❌ "+e.message})); }
      finally { setLoading(prev => ({...prev,[id]:false})); }
    }));
  };

  return (
    <div className="srch-wrap">
      <div className="srch-top">
        <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:"clamp(13px,2.2vw,16px)",color:"var(--tx)"}}>
          🔎 Recherche Multi-IA
          <span style={{fontWeight:400,fontSize:9,color:"var(--mu)",marginLeft:8}}>Toutes tes IAs actives répondent en parallèle</span>
        </div>
        <div className="srch-input-row">
          <input className="srch-inp" placeholder="Pose ta question…"
            value={query} onChange={e=>setQuery(e.target.value)}
            onKeyDown={e=>{ if(e.key==="Enter") doSearch(); }}/>
          <button className="srch-btn" onClick={()=>doSearch()} disabled={!query.trim()||!activeIds.length}>
            🔎 Chercher ({activeIds.length} IAs)
          </button>
        </div>
        {!hasSearched && (
          <div className="srch-suggestions">
            {SUGGESTIONS.map((s,i) => (
              <button key={i} className="filter-btn" style={{fontSize:9}} onClick={()=>doSearch(s)}>{s}</button>
            ))}
          </div>
        )}
      </div>
      <div className="srch-results">
        {!hasSearched && (
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",gap:10,color:"var(--mu)",fontSize:11,textAlign:"center",padding:20}}>
            <div style={{fontSize:36}}>🔎</div>
            <strong style={{color:"var(--tx)"}}>Recherche simultanée</strong>
            <div style={{maxWidth:300}}>Tape une question et compare les réponses de {activeIds.length} IA{activeIds.length>1?"s":""} côte à côte.</div>
          </div>
        )}
        {hasSearched && activeIds.map(id => {
          const m = MODEL_DEFS[id];
          return (
            <div key={id} className="srch-card" style={{borderColor:m.color+"33"}}>
              <div className="srch-card-hdr" style={{background:m.bg+"44"}}>
                <span style={{color:m.color,fontSize:13}}>{m.icon}</span>
                <span style={{color:m.color,fontWeight:700,fontSize:11,fontFamily:"'Syne',sans-serif"}}>{m.name}</span>
                {results[id] && !loading[id] && (
                  <button style={{marginLeft:"auto",background:"none",border:"1px solid var(--bd)",borderRadius:3,color:"var(--mu)",cursor:"pointer",fontSize:8,padding:"2px 6px",fontFamily:"'IBM Plex Mono',monospace"}}
                    onClick={()=>{setChatInput(query);navigateTab("chat");}}>↗ Chat</button>
                )}
              </div>
              <div className="srch-card-body">
                {loading[id] ? <span className="dots"><span>·</span><span>·</span><span>·</span></span> : (results[id] ? <MarkdownRenderer text={results[id]}/> : <span style={{color:"var(--mu)"}}>En attente…</span>)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── WORKFLOWS TAB ─────────────────────────────────────────────────

// ── STATS TAB ─────────────────────────────────────────────────────
function StatsTab({ stats, onReset }) {
  const totalMsgs = Object.values(stats.msgs||{}).reduce((a,b)=>a+b,0);
  const totalTok = Object.values(stats.tokens||{}).reduce((a,b)=>a+b,0);
  const totalConvs = stats.convs || 0;
  const topIA = Object.entries(stats.msgs||{}).sort(([,a],[,b])=>b-a)[0];
  const maxTok = Math.max(...Object.values(stats.tokens||{}).map(v=>v||0),1);
  const [activeView, setActiveView] = React.useState("overview");

  const estimateCost = (id) => {
    const tok = stats.tokens?.[id] || 0;
    const p = PRICING[id];
    if (!p || !tok) return 0;
    return ((tok*0.7/1e6)*p.in + (tok*0.3/1e6)*p.out);
  };
  const totalCost = Object.keys(MODEL_DEFS).reduce((a,id)=>a+estimateCost(id),0);
  const fmtN = (n) => n>=1e6?(n/1e6).toFixed(1)+"M":n>=1000?(n/1000).toFixed(1)+"k":String(n||0);
  const fmtCost = (c) => c<0.01?"< $0.01":"$"+c.toFixed(3);

  // ── Données par heure ──────────────────────────────────────────
  const byHour = stats.byHour || {};
  const maxHour = Math.max(...Array.from({length:24},(_,h)=>byHour[h]||0),1);
  const peakHour = Array.from({length:24},(_,h)=>h).sort((a,b)=>(byHour[b]||0)-(byHour[a]||0))[0];
  // ── Données par jour (7 derniers jours) ────────────────────────
  const byDate = stats.byDate || {};
  const last7 = Array.from({length:7},(_,i)=>{
    const d = new Date(); d.setDate(d.getDate()-i);
    return d.toISOString().slice(0,10);
  }).reverse();
  const maxDay = Math.max(...last7.map(d=>byDate[d]||0),1);

  const views = [["overview","📊 Vue globale"],["heure","🕐 Par heure"],["jours","📅 7 jours"],["cout","💰 Coûts"]];

  return (
    <div className="stats-wrap">
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12,flexWrap:"wrap"}}>
        <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:"clamp(14px,2.5vw,18px)",color:"var(--tx)"}}>📊 Statistiques avancées</div>
        <button style={{marginLeft:"auto",padding:"5px 12px",background:"rgba(248,113,113,.1)",border:"1px solid rgba(248,113,113,.3)",borderRadius:5,color:"var(--red)",cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace",fontSize:9}}
          onClick={()=>{ if(window.confirm("Réinitialiser les statistiques ?")) onReset(); }}>↺ Réinitialiser</button>
      </div>
      {/* Sous-onglets */}
      <div style={{display:"flex",gap:4,marginBottom:14,flexWrap:"wrap"}}>
        {views.map(([v,l])=>(
          <button key={v} onClick={()=>setActiveView(v)}
            style={{padding:"5px 12px",borderRadius:12,border:"1px solid "+(activeView===v?"var(--ac)":"var(--bd)"),background:activeView===v?"rgba(212,168,83,.12)":"transparent",color:activeView===v?"var(--ac)":"var(--mu)",fontSize:9,cursor:"pointer",fontWeight:activeView===v?700:400}}>
            {l}
          </button>
        ))}
      </div>

      {activeView==="overview" && <>
        <div className="stats-grid">
          <div className="stat-card"><div className="stat-val">{totalConvs}</div><div className="stat-lbl">Conversations</div></div>
          <div className="stat-card"><div className="stat-val">{fmtN(totalMsgs)}</div><div className="stat-lbl">Messages</div></div>
          <div className="stat-card"><div className="stat-val">{fmtN(totalTok)}</div><div className="stat-lbl">Tokens</div></div>
          <div className="stat-card"><div className="stat-val">{fmtCost(totalCost)}</div><div className="stat-lbl">Coût estimé</div></div>
          {topIA && <div className="stat-card"><div className="stat-val">{MODEL_DEFS[topIA[0]]?.icon}</div><div className="stat-lbl">IA préférée</div><div className="stat-sub" style={{color:MODEL_DEFS[topIA[0]]?.color}}>{MODEL_DEFS[topIA[0]]?.short} — {topIA[1]} msg</div></div>}
          {peakHour!==undefined && <div className="stat-card"><div className="stat-val">{peakHour}h</div><div className="stat-lbl">Heure de pointe</div><div className="stat-sub">{byHour[peakHour]||0} messages</div></div>}
        </div>
        <div className="stats-bar-section">
          <div style={{fontSize:10,fontWeight:700,color:"var(--tx)",marginBottom:10,borderBottom:"1px solid var(--bd)",paddingBottom:6}}>Messages par IA</div>
          {Object.keys(MODEL_DEFS).map(id => {
            const m = MODEL_DEFS[id]; const count = stats.msgs?.[id]||0;
            const maxC = Math.max(...Object.values(stats.msgs||{}).map(v=>v||0),1);
            return (<div key={id} className="stats-bar-row">
              <div className="stats-bar-name" style={{color:m.color}}>{m.icon} {m.short}</div>
              <div className="stats-bar-track"><div className="stats-bar-fill" style={{width:(count/maxC*100)+"%",background:m.color}}/></div>
              <div className="stats-bar-val">{count} msg</div>
            </div>);
          })}
        </div>
      </>}

      {activeView==="heure" && (
        <div className="stats-bar-section">
          <div style={{fontSize:10,fontWeight:700,color:"var(--tx)",marginBottom:4,borderBottom:"1px solid var(--bd)",paddingBottom:6}}>Activité par heure de la journée</div>
          <div style={{fontSize:8,color:"var(--mu)",marginBottom:12}}>Heure de pointe : {peakHour}h ({byHour[peakHour]||0} messages)</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(12,1fr)",gap:4,marginBottom:8}}>
            {Array.from({length:24},(_,h)=>{
              const count = byHour[h]||0;
              const pct = Math.round((count/maxHour)*100);
              const isNow = new Date().getHours()===h;
              const isPeak = h===peakHour && count>0;
              return <div key={h} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
                <div style={{width:"100%",height:60,display:"flex",alignItems:"flex-end",background:"var(--s2)",borderRadius:"3px 3px 0 0",overflow:"hidden",border:isNow?"1px solid var(--ac)":"1px solid transparent"}}>
                  <div style={{width:"100%",height:pct+"%",background:isPeak?"var(--ac)":isNow?"rgba(212,168,83,.6)":"var(--blue)",transition:"height .3s",minHeight:count>0?4:0,opacity:count>0?1:.2}}/>
                </div>
                <span style={{fontSize:7,color:isNow?"var(--ac)":"var(--mu)",fontFamily:"var(--font-mono)"}}>{h}h</span>
                {count>0 && <span style={{fontSize:7,color:"var(--tx)"}}>{count}</span>}
              </div>;
            })}
          </div>
        </div>
      )}

      {activeView==="jours" && (
        <div className="stats-bar-section">
          <div style={{fontSize:10,fontWeight:700,color:"var(--tx)",marginBottom:4,borderBottom:"1px solid var(--bd)",paddingBottom:6}}>Activité — 7 derniers jours</div>
          <div style={{display:"flex",gap:8,alignItems:"flex-end",height:120,marginBottom:8,padding:"0 4px"}}>
            {last7.map(d=>{
              const count = byDate[d]||0;
              const pct = Math.round((count/maxDay)*100);
              const isToday = d===new Date().toISOString().slice(0,10);
              const label = new Date(d).toLocaleDateString("fr-FR",{weekday:"short",day:"numeric"});
              return <div key={d} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                <span style={{fontSize:8,color:"var(--tx)",fontWeight:700}}>{count>0?count:""}</span>
                <div style={{width:"100%",flex:1,display:"flex",alignItems:"flex-end",background:"var(--s2)",borderRadius:"4px 4px 0 0",overflow:"hidden",border:isToday?"1px solid var(--ac)":"none"}}>
                  <div style={{width:"100%",height:Math.max(pct,count>0?8:0)+"%",background:isToday?"var(--ac)":"var(--blue)",transition:"height .4s"}}/>
                </div>
                <span style={{fontSize:7,color:isToday?"var(--ac)":"var(--mu)",textAlign:"center",lineHeight:1.2}}>{label}</span>
              </div>;
            })}
          </div>
          <div style={{fontSize:8,color:"var(--mu)"}}>Total 7 jours : {last7.reduce((a,d)=>a+(byDate[d]||0),0)} messages</div>
        </div>
      )}

      {activeView==="cout" && (
        <div className="stats-bar-section">
          <div style={{fontSize:10,fontWeight:700,color:"var(--tx)",marginBottom:10,borderBottom:"1px solid var(--bd)",paddingBottom:6}}>Tokens & Coûts estimés par IA</div>
          {Object.keys(MODEL_DEFS).map(id => {
            const m = MODEL_DEFS[id]; const tok = stats.tokens?.[id]||0; const p = PRICING[id];
            return (<div key={id} className="stats-bar-row">
              <div className="stats-bar-name" style={{color:m.color}}>{m.icon} {m.short}</div>
              <div className="stats-bar-track"><div className="stats-bar-fill" style={{width:(tok/maxTok*100)+"%",background:m.color}}/></div>
              <div className="stats-bar-val">{fmtN(tok)}t · {fmtCost(estimateCost(id))}</div>
            </div>);
          })}
          <div style={{marginTop:10,paddingTop:8,borderTop:"1px solid var(--bd)",display:"flex",justifyContent:"space-between",fontSize:11,fontWeight:700}}>
            <span style={{color:"var(--tx)"}}>Total estimé</span><span style={{color:"var(--ac)"}}>{fmtCost(totalCost)}</span>
          </div>
          <div style={{marginTop:4,fontSize:8,color:"var(--mu)"}}>⚠️ Estimation approx. (70% input / 30% output). Claude est intégré donc sans coût API ici.</div>
        </div>
      )}
    </div>
  );
}

// ── GlossaireTab ─────────────────────────────────────────────────
function GlossaireTab({ navigateTab, setChatInput }) {
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

// ── BenchmarkTab ──────────────────────────────────────────────────
function BenchmarkTab({ enabled, apiKeys }) {
  const [results, setResults] = React.useState({}); // {iaId: {testId: {response, time, score}}}
  const [running, setRunning] = React.useState(false);
  const [selectedTest, setSelectedTest] = React.useState("reasoning");
  const [customPrompt, setCustomPrompt] = React.useState("");
  const [useCustom, setUseCustom] = React.useState(false);
  const [progress, setProgress] = React.useState({});

  const activeIds = Object.keys(MODEL_DEFS).filter(id => enabled[id] && MODEL_DEFS[id].apiType !== "pollinations" && !MODEL_DEFS[id].serial);
  const test = BENCHMARK_TESTS.find(t => t.id === selectedTest) || BENCHMARK_TESTS[0];
  const prompt = useCustom ? customPrompt : test.prompt;

  const runBenchmark = async () => {
    if (!prompt.trim() || !activeIds.length) return;
    setRunning(true); setResults({}); setProgress({});
    const newResults = {};
    await Promise.all(activeIds.map(async (id) => {
      setProgress(p => ({...p, [id]:"running"}));
      const start = Date.now();
      try {
        const resp = await callModel(id, [{role:"user", content:prompt}], apiKeys, "Tu es un assistant concis. Réponds directement sans intro.");
        const time = ((Date.now() - start) / 1000).toFixed(1);
        newResults[id] = { response: resp, time: parseFloat(time), status:"ok" };
        setProgress(p => ({...p, [id]:"done"}));
      } catch(e) {
        newResults[id] = { response: "❌ "+e.message, time: null, status:"error" };
        setProgress(p => ({...p, [id]:"error"}));
      }
      setResults({...newResults});
    }));
    setRunning(false);
  };

  const sorted = Object.entries(results)
    .filter(([,r]) => r.status==="ok")
    .sort(([,a],[,b]) => (a.time||99)-(b.time||99));

  const medals = ["🥇","🥈","🥉"];

  return (
    <div style={{flex:1,overflow:"auto",padding:"clamp(10px,2vw,16px)"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14,flexWrap:"wrap"}}>
        <div style={{fontFamily:"var(--font-display)",fontWeight:800,fontSize:"clamp(14px,2.5vw,18px)",color:"var(--ac)"}}>⚡ Benchmark Live</div>
        <div style={{fontSize:9,color:"var(--mu)"}}>— Teste toutes tes IAs en parallèle sur le même prompt</div>
      </div>
      {/* Sélecteur de test */}
      <div style={{marginBottom:12,background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:8,padding:"12px"}}>
        <div style={{fontSize:8,color:"var(--mu)",fontWeight:700,letterSpacing:1,marginBottom:8}}>TESTS PRÉDÉFINIS</div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:useCustom?0:10}}>
          {BENCHMARK_TESTS.map(t=>(
            <button key={t.id} onClick={()=>{setSelectedTest(t.id);setUseCustom(false);}}
              style={{padding:"5px 11px",borderRadius:12,border:"1px solid "+(selectedTest===t.id&&!useCustom?"var(--ac)":"var(--bd)"),background:selectedTest===t.id&&!useCustom?"rgba(212,168,83,.12)":"transparent",color:selectedTest===t.id&&!useCustom?"var(--ac)":"var(--mu)",fontSize:9,cursor:"pointer",fontWeight:selectedTest===t.id&&!useCustom?700:400}}>
              {t.icon} {t.label}
            </button>
          ))}
          <button onClick={()=>setUseCustom(true)}
            style={{padding:"5px 11px",borderRadius:12,border:"1px solid "+(useCustom?"var(--ac)":"var(--bd)"),background:useCustom?"rgba(212,168,83,.12)":"transparent",color:useCustom?"var(--ac)":"var(--mu)",fontSize:9,cursor:"pointer",fontWeight:useCustom?700:400}}>
            ✏️ Prompt perso
          </button>
        </div>
        {!useCustom && <div style={{fontSize:9,color:"var(--mu)",fontStyle:"italic",lineHeight:1.5,marginTop:6,padding:"8px 10px",background:"var(--s2)",borderRadius:6}}>{test.prompt.slice(0,120)}…</div>}
        {useCustom && <textarea value={customPrompt} onChange={e=>setCustomPrompt(e.target.value)} placeholder="Tape ton prompt ici…" rows={3}
          style={{width:"100%",marginTop:8,background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:6,color:"var(--tx)",fontSize:10,padding:"8px 10px",resize:"vertical",outline:"none",boxSizing:"border-box"}}/>}
      </div>
      {/* Lancer */}
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14,flexWrap:"wrap"}}>
        <button onClick={runBenchmark} disabled={running||!activeIds.length}
          style={{padding:"8px 20px",background:running?"var(--s2)":"rgba(212,168,83,.15)",border:"1px solid "+(running?"var(--bd)":"rgba(212,168,83,.4)"),borderRadius:6,color:running?"var(--mu)":"var(--ac)",fontSize:10,cursor:running?"default":"pointer",fontWeight:700,fontFamily:"var(--font-mono)"}}>
          {running ? "⏳ Benchmark en cours…" : "▶ Lancer le benchmark"}
        </button>
        {activeIds.length===0 && <span style={{fontSize:9,color:"var(--red)"}}>Active au moins une IA dans Config</span>}
        {activeIds.length>0 && !running && <span style={{fontSize:9,color:"var(--mu)"}}>{activeIds.length} IAs testées en parallèle</span>}
      </div>
      {/* Progression */}
      {running && (
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>
          {activeIds.map(id=>{
            const m=MODEL_DEFS[id]; const s=progress[id];
            return <div key={id} style={{padding:"4px 10px",borderRadius:8,border:"1px solid "+(s==="done"?"var(--green)":s==="error"?"var(--red)":m.color+"44"),background:s==="done"?"rgba(74,222,128,.08)":s==="error"?"rgba(248,113,113,.08)":"rgba(255,255,255,.03)",fontSize:9,color:s==="done"?"var(--green)":s==="error"?"var(--red)":m.color,display:"flex",alignItems:"center",gap:5}}>
              {s==="running"?<span style={{animation:"spin 1s linear infinite",display:"inline-block"}}>⟳</span>:s==="done"?"✓":s==="error"?"✕":"…"}
              {m.short}
            </div>;
          })}
        </div>
      )}
      {/* Podium vitesse */}
      {sorted.length>0 && (
        <div style={{marginBottom:14,background:"var(--s1)",border:"1px solid rgba(212,168,83,.2)",borderRadius:8,padding:"12px"}}>
          <div style={{fontSize:9,color:"var(--ac)",fontWeight:700,marginBottom:8}}>🏆 CLASSEMENT VITESSE</div>
          <div style={{display:"flex",flexDirection:"column",gap:5}}>
            {sorted.map(([id,r],i)=>{
              const m=MODEL_DEFS[id];
              const fastest=sorted[0][1].time;
              const pct=fastest?Math.round((fastest/r.time)*100):100;
              return <div key={id} style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:16,width:24,textAlign:"center"}}>{medals[i]||"·"}</span>
                <span style={{color:m.color,fontSize:11,width:20}}>{m.icon}</span>
                <span style={{fontSize:10,color:"var(--tx)",width:80,flexShrink:0}}>{m.short}</span>
                <div style={{flex:1,height:6,background:"var(--s2)",borderRadius:3,overflow:"hidden"}}>
                  <div style={{height:"100%",width:pct+"%",background:m.color,borderRadius:3,transition:"width .5s"}}/>
                </div>
                <span style={{fontSize:9,color:"var(--mu)",fontFamily:"var(--font-mono)",width:40,textAlign:"right"}}>{r.time}s</span>
              </div>;
            })}
          </div>
        </div>
      )}
      {/* Réponses détaillées */}
      {Object.keys(results).length>0 && (
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:10}}>
          {Object.entries(results).sort(([,a],[,b])=>(a.time||99)-(b.time||99)).map(([id,r],i)=>{
            const m=MODEL_DEFS[id];
            return <div key={id} style={{background:"var(--s1)",border:"1px solid "+(r.status==="error"?"rgba(248,113,113,.3)":m.color+"33"),borderRadius:8,padding:"12px"}}>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
                <span style={{fontSize:16}}>{medals[i]||"·"}</span>
                <span style={{color:m.color,fontSize:14}}>{m.icon}</span>
                <span style={{fontWeight:700,fontSize:11,color:m.color}}>{m.name}</span>
                {r.time && <span style={{marginLeft:"auto",fontSize:9,fontFamily:"var(--font-mono)",color:"var(--mu)"}}>{r.time}s</span>}
              </div>
              <div style={{fontSize:9,color:"var(--tx)",lineHeight:1.6,maxHeight:120,overflow:"auto"}}>{r.response.slice(0,400)}{r.response.length>400?"…":""}</div>
            </div>;
          })}
        </div>
      )}
    </div>
  );
}

// ╔══════════════════════════════════════════════════════════════╗
// ║  1. PROMPT AUTOPSY                                           ║
// ╚══════════════════════════════════════════════════════════════╝
function PromptAutopsyTab({ enabled, apiKeys, conversations }) {
  const [badResponse, setBadResponse] = React.useState("");
  const [originalPrompt, setOriginalPrompt] = React.useState("");
  const [result, setResult] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const activeIds = Object.keys(MODEL_DEFS).filter(id => enabled[id] && !MODEL_DEFS[id]?.serial);

  // Pré-remplir depuis la dernière réponse du chat
  const lastResponses = React.useMemo(() => {
    return activeIds.map(id => {
      const msgs = conversations[id] || [];
      const last = [...msgs].reverse().find(m => m.role === "assistant");
      const q = [...msgs].reverse().find(m => m.role === "user");
      return last ? { id, text: last.content, question: q?.content || "" } : null;
    }).filter(Boolean);
  }, [conversations, activeIds]);

  const runAutopsy = async () => {
    if (!badResponse.trim()) return;
    setLoading(true); setResult(null);
    const judge = activeIds.find(id => ["groq","mistral","cerebras"].includes(id)) || activeIds[0];
    if (!judge) { setLoading(false); return; }
    const prompt = `Tu es un expert en prompt engineering et évaluation de LLMs. Analyse cette réponse d'IA qui a déçu l'utilisateur.

PROMPT ORIGINAL : ${originalPrompt || "(non fourni)"}
RÉPONSE DÉCEVANTE :
${badResponse.slice(0, 1500)}

Effectue une autopsie complète. Réponds UNIQUEMENT en JSON valide :
{
  "verdict": "phrase de 1 ligne résumant le problème principal",
  "score_mauvais": 3,
  "biais": [{"nom":"Nom du biais","description":"ce qui s'est passé","gravite":"haute|moyenne|faible"}],
  "erreurs_raisonnement": ["erreur 1","erreur 2"],
  "problemes_prompt": ["problème dans le prompt qui a causé ça"],
  "prompt_ameliore": "version améliorée du prompt original qui évite ces problèmes",
  "prompt_v2": "deuxième variante encore plus précise",
  "lecon": "conseil principal à retenir pour éviter ce problème"
}`;
    try {
      const { callModel: cm } = await import("./api/ai-service.js");
      const reply = await cm(judge, [{role:"user", content:prompt}], apiKeys, "Expert analyse IA. JSON uniquement, sans markdown.");
      const clean = reply.replace(/```json|```/g,"").trim();
      const data = JSON.parse(clean.match(/\{[\s\S]*\}/)?.[0] || clean);
      setResult(data);
    } catch(e) { setResult({ verdict:"Erreur d'analyse : "+e.message, biais:[], erreurs_raisonnement:[], problemes_prompt:[], prompt_ameliore:"", prompt_v2:"", lecon:"" }); }
    setLoading(false);
  };

  const graviteColor = g => g==="haute"?"var(--red)":g==="moyenne"?"var(--orange)":"var(--mu)";

  return (
    <div style={{flex:1,overflow:"auto",padding:"clamp(10px,2vw,16px)"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6,flexWrap:"wrap"}}>
        <div style={{fontFamily:"var(--font-display)",fontWeight:800,fontSize:"clamp(14px,2.5vw,18px)",color:"#F87171"}}>🔬 Prompt Autopsy</div>
        <div style={{fontSize:9,color:"var(--mu)"}}>— Disséquer pourquoi une réponse d'IA était mauvaise</div>
      </div>
      <div style={{fontSize:9,color:"var(--mu)",marginBottom:14,padding:"8px 12px",background:"rgba(248,113,113,.06)",border:"1px solid rgba(248,113,113,.15)",borderRadius:6}}>
        Colle une réponse d'IA qui t'a déçu. L'autopsie identifie les biais, erreurs de raisonnement, et génère un prompt amélioré qui évite ces problèmes.
      </div>

      {/* Pré-remplir depuis le chat */}
      {lastResponses.length > 0 && (
        <div style={{marginBottom:12,background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:8,padding:"10px 12px"}}>
          <div style={{fontSize:8,color:"var(--mu)",fontWeight:700,marginBottom:6}}>PRÉ-REMPLIR DEPUIS LE CHAT</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {lastResponses.slice(0,5).map(r=>{
              const m = MODEL_DEFS[r.id];
              return <button key={r.id} onClick={()=>{setBadResponse(r.text.slice(0,1500));setOriginalPrompt(r.question.slice(0,500));}}
                style={{padding:"4px 10px",borderRadius:8,border:"1px solid "+m.color+"44",background:m.color+"11",color:m.color,fontSize:8,cursor:"pointer"}}>
                {m.icon} Dernière réponse {m.short}
              </button>;
            })}
          </div>
        </div>
      )}

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
        <div>
          <div style={{fontSize:8,color:"var(--mu)",fontWeight:700,marginBottom:5}}>PROMPT ORIGINAL (optionnel)</div>
          <textarea value={originalPrompt} onChange={e=>setOriginalPrompt(e.target.value)} placeholder="Le prompt que tu avais envoyé…" rows={3}
            style={{width:"100%",background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:6,color:"var(--tx)",fontSize:10,padding:"8px 10px",resize:"vertical",outline:"none",boxSizing:"border-box"}}/>
        </div>
        <div>
          <div style={{fontSize:8,color:"var(--red)",fontWeight:700,marginBottom:5}}>RÉPONSE DÉCEVANTE *</div>
          <textarea value={badResponse} onChange={e=>setBadResponse(e.target.value)} placeholder="Colle ici la réponse qui t'a déçu…" rows={3}
            style={{width:"100%",background:"var(--s2)",border:"1px solid rgba(248,113,113,.3)",borderRadius:6,color:"var(--tx)",fontSize:10,padding:"8px 10px",resize:"vertical",outline:"none",boxSizing:"border-box"}}/>
        </div>
      </div>

      <button onClick={runAutopsy} disabled={loading||!badResponse.trim()||!activeIds.length}
        style={{padding:"9px 22px",background:loading?"var(--s2)":"rgba(248,113,113,.15)",border:"1px solid "+(loading?"var(--bd)":"rgba(248,113,113,.4)"),borderRadius:6,color:loading?"var(--mu)":"var(--red)",fontSize:10,cursor:loading?"default":"pointer",fontWeight:700,fontFamily:"var(--font-mono)",marginBottom:16}}>
        {loading?"🔬 Autopsie en cours…":"🔬 Lancer l'autopsie"}
      </button>

      {result && (
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {/* Verdict */}
          <div style={{padding:"12px 16px",background:"rgba(248,113,113,.08)",border:"1px solid rgba(248,113,113,.3)",borderRadius:8}}>
            <div style={{fontSize:8,color:"var(--red)",fontWeight:700,marginBottom:4}}>VERDICT</div>
            <div style={{fontSize:12,fontWeight:700,color:"var(--tx)",lineHeight:1.5}}>{result.verdict}</div>
            {result.lecon && <div style={{marginTop:6,fontSize:9,color:"var(--mu)",fontStyle:"italic"}}>💡 {result.lecon}</div>}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:10}}>
            {/* Biais */}
            {result.biais?.length > 0 && (
              <div style={{background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:8,padding:"12px"}}>
                <div style={{fontSize:8,color:"var(--orange)",fontWeight:700,marginBottom:8}}>🧠 BIAIS DÉTECTÉS</div>
                {result.biais.map((b,i)=>(
                  <div key={i} style={{marginBottom:8,paddingBottom:8,borderBottom:i<result.biais.length-1?"1px solid var(--bd)":"none"}}>
                    <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:3}}>
                      <span style={{fontWeight:700,fontSize:10,color:graviteColor(b.gravite)}}>{b.nom}</span>
                      <span style={{fontSize:7,padding:"1px 5px",borderRadius:8,background:graviteColor(b.gravite)+"22",color:graviteColor(b.gravite),fontWeight:700}}>{b.gravite}</span>
                    </div>
                    <div style={{fontSize:9,color:"var(--mu)",lineHeight:1.5}}>{b.description}</div>
                  </div>
                ))}
              </div>
            )}
            {/* Erreurs */}
            {result.erreurs_raisonnement?.length > 0 && (
              <div style={{background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:8,padding:"12px"}}>
                <div style={{fontSize:8,color:"var(--red)",fontWeight:700,marginBottom:8}}>⚠️ ERREURS DE RAISONNEMENT</div>
                {result.erreurs_raisonnement.map((e,i)=>(
                  <div key={i} style={{display:"flex",gap:6,marginBottom:5,fontSize:9,color:"var(--tx)"}}>
                    <span style={{color:"var(--red)",flexShrink:0}}>✗</span>{e}
                  </div>
                ))}
              </div>
            )}
            {/* Problèmes prompt */}
            {result.problemes_prompt?.length > 0 && (
              <div style={{background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:8,padding:"12px"}}>
                <div style={{fontSize:8,color:"var(--ac)",fontWeight:700,marginBottom:8}}>📝 PROBLÈMES DANS TON PROMPT</div>
                {result.problemes_prompt.map((p,i)=>(
                  <div key={i} style={{display:"flex",gap:6,marginBottom:5,fontSize:9,color:"var(--tx)"}}>
                    <span style={{color:"var(--ac)",flexShrink:0}}>→</span>{p}
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Prompts améliorés */}
          {(result.prompt_ameliore||result.prompt_v2) && (
            <div style={{background:"var(--s1)",border:"1px solid rgba(74,222,128,.25)",borderRadius:8,padding:"12px"}}>
              <div style={{fontSize:8,color:"var(--green)",fontWeight:700,marginBottom:10}}>✨ PROMPTS AMÉLIORÉS</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                {[["Version 1",result.prompt_ameliore],["Version 2",result.prompt_v2]].filter(([,t])=>t).map(([label,text])=>(
                  <div key={label}>
                    <div style={{fontSize:8,color:"var(--mu)",marginBottom:4}}>{label}</div>
                    <div style={{background:"var(--s2)",borderRadius:6,padding:"8px 10px",fontSize:9,color:"var(--tx)",lineHeight:1.6,position:"relative"}}>
                      {text}
                      <button onClick={()=>{navigator.clipboard.writeText(text);}}
                        style={{position:"absolute",top:4,right:4,fontSize:8,padding:"2px 6px",background:"rgba(212,168,83,.15)",border:"1px solid rgba(212,168,83,.3)",borderRadius:4,color:"var(--ac)",cursor:"pointer"}}>📋</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ╔══════════════════════════════════════════════════════════════╗
// ║  2. IA MENTOR — Apprentissage progressif                     ║
// ╚══════════════════════════════════════════════════════════════╝
function IaMentorTab({ enabled, apiKeys }) {
  const MENTOR_KEY = "multiia_mentor_sessions";
  const [sessions, setSessions] = React.useState(() => { try { return JSON.parse(localStorage.getItem(MENTOR_KEY)||"[]"); } catch { return []; } });
  const [activeSession, setActiveSession] = React.useState(null);
  const [creating, setCreating] = React.useState(false);
  const [topic, setTopic] = React.useState("");
  const [level, setLevel] = React.useState("débutant");
  const [sessionCount, setSessionCount] = React.useState(6);
  const [generating, setGenerating] = React.useState(false);
  const [currentStep, setCurrentStep] = React.useState(null); // {type:"lesson"|"exercise"|"quiz", content, answer:"", result}
  const [stepLoading, setStepLoading] = React.useState(false);
  const [userAnswer, setUserAnswer] = React.useState("");

  const saveS = (s) => { setSessions(s); try { localStorage.setItem(MENTOR_KEY, JSON.stringify(s)); } catch {} };
  const activeIds = Object.keys(MODEL_DEFS).filter(id => enabled[id] && !MODEL_DEFS[id]?.serial);
  const judge = activeIds.find(id=>["groq","mistral","cerebras","sambanova"].includes(id)) || activeIds[0];

  const createSession = async () => {
    if (!topic.trim() || !judge) return;
    setGenerating(true);
    const prompt = `Tu es un pédagogue expert. Crée un programme d'apprentissage de ${sessionCount} sessions pour apprendre : "${topic}" (niveau ${level}).

Réponds UNIQUEMENT en JSON valide :
{
  "titre": "titre du programme",
  "description": "2 phrases de description",
  "objectif_final": "ce que l'apprenant saura faire à la fin",
  "sessions": [
    {
      "num": 1,
      "titre": "titre de la session",
      "objectif": "objectif de cette session",
      "concepts": ["concept 1","concept 2"],
      "duree_min": 15
    }
  ]
}`;
    try {
      const reply = await callModel(judge, [{role:"user",content:prompt}], apiKeys, "Pédagogue expert. JSON uniquement.");
      const clean = reply.replace(/```json|```/g,"").trim();
      const data = JSON.parse(clean.match(/\{[\s\S]*\}/)?.[0]||clean);
      const session = {
        id: Date.now().toString(),
        topic, level, createdAt: new Date().toISOString(),
        ...data,
        sessions: (data.sessions||[]).map(s=>({...s, completed:false, score:null})),
        currentSession: 0,
        xp: 0,
      };
      const updated = [session, ...sessions];
      saveS(updated);
      setActiveSession(session.id);
      setCreating(false); setTopic("");
    } catch(e) { alert("Erreur : "+e.message); }
    setGenerating(false);
  };

  const launchStep = async (session, stepType) => {
    if (!judge) return;
    setStepLoading(true); setCurrentStep(null); setUserAnswer("");
    const sess = session.sessions[session.currentSession];
    const prompts = {
      lesson: `Tu es un professeur expert en "${session.topic}". Donne une leçon complète sur : "${sess.titre}" pour niveau ${session.level}.
Structure : 1) Explication claire (avec analogies), 2) Exemple concret, 3) Résumé en 3 points clés. Maximum 400 mots.`,
      exercise: `Crée un exercice pratique sur "${sess.titre}" pour niveau ${session.level}.
Format : Présente l'exercice clairement, sans donner la solution. Termine par "Ta réponse :"`,
      quiz: `Crée une question de quiz à choix multiples (A/B/C/D) sur "${sess.titre}".
Format : La question, puis A) B) C) D). Termine par "Ta réponse (A/B/C/D) :"`
    };
    try {
      const reply = await callModel(judge, [{role:"user",content:prompts[stepType]}], apiKeys, `Tu es un mentor pédagogue expert en "${session.topic}".`);
      setCurrentStep({ type:stepType, content:reply, answer:"", result:null, sessInfo:sess });
    } catch(e) { setCurrentStep({ type:stepType, content:"Erreur : "+e.message, answer:"", result:null }); }
    setStepLoading(false);
  };

  const submitAnswer = async () => {
    if (!currentStep || !userAnswer.trim() || !judge) return;
    setStepLoading(true);
    const evalPrompt = `L'apprenant a répondu à cet ${currentStep.type==="quiz"?"quiz":"exercice"} :

CONTENU : ${currentStep.content}
RÉPONSE DE L'APPRENANT : ${userAnswer}

Évalue la réponse. Réponds en JSON :
{"correct":true/false,"score":0-10,"feedback":"explication en 2-3 phrases","points_forts":["..."],"a_ameliorer":["..."],"bonne_reponse":"la réponse correcte complète"}`;
    try {
      const reply = await callModel(judge, [{role:"user",content:evalPrompt}], apiKeys, "Évaluateur pédagogique. JSON uniquement.");
      const clean = reply.replace(/```json|```/g,"").trim();
      const eval_ = JSON.parse(clean.match(/\{[\s\S]*\}/)?.[0]||clean);
      setCurrentStep(prev=>({...prev, result:eval_, answer:userAnswer}));
      // Update session XP + progression
      const xpGained = eval_.correct ? 30 : 10;
      setSessions(prev => {
        const updated = prev.map(s => {
          if (s.id !== activeSession) return s;
          return { ...s, xp: (s.xp||0) + xpGained };
        });
        saveS(updated);
        return updated;
      });
    } catch(e) { setCurrentStep(prev=>({...prev, result:{correct:false, feedback:"Erreur d'évaluation : "+e.message, score:0}})); }
    setStepLoading(false);
  };

  const completeSession = () => {
    setSessions(prev => {
      const updated = prev.map(s => {
        if (s.id !== activeSession) return s;
        const newSessions = s.sessions.map((sess,i) => i===s.currentSession ? {...sess, completed:true, score: currentStep?.result?.score||5} : sess);
        const nextIdx = Math.min(s.currentSession+1, s.sessions.length-1);
        return { ...s, sessions:newSessions, currentSession:nextIdx, xp:(s.xp||0)+50 };
      });
      saveS(updated);
      return updated;
    });
    setCurrentStep(null); setUserAnswer("");
  };

  const active = sessions.find(s=>s.id===activeSession);
  const levels = ["débutant","intermédiaire","avancé","expert"];

  return (
    <div style={{flex:1,display:"flex",overflow:"hidden"}}>
      {/* Sidebar sessions */}
      <div style={{width:200,flexShrink:0,borderRight:"1px solid var(--bd)",display:"flex",flexDirection:"column",overflow:"hidden",background:"var(--s1)"}}>
        <div style={{padding:"10px 12px",borderBottom:"1px solid var(--bd)"}}>
          <div style={{fontFamily:"var(--font-display)",fontWeight:800,fontSize:12,color:"var(--ac)",marginBottom:8}}>🎓 IA Mentor</div>
          <button onClick={()=>setCreating(true)}
            style={{width:"100%",padding:"6px 10px",background:"rgba(212,168,83,.15)",border:"1px solid rgba(212,168,83,.4)",borderRadius:5,color:"var(--ac)",fontSize:9,cursor:"pointer",fontWeight:700}}>
            + Nouveau programme
          </button>
        </div>
        <div style={{flex:1,overflow:"auto"}}>
          {sessions.length===0&&<div style={{padding:16,fontSize:9,color:"var(--mu)",textAlign:"center"}}>Aucun programme</div>}
          {sessions.map(s=>{
            const done = s.sessions?.filter(x=>x.completed).length||0;
            const total = s.sessions?.length||0;
            const pct = total>0?Math.round(done/total*100):0;
            return <div key={s.id} onClick={()=>{setActiveSession(s.id);setCreating(false);setCurrentStep(null);}}
              style={{padding:"9px 12px",cursor:"pointer",borderBottom:"1px solid var(--bd)",background:activeSession===s.id?"rgba(212,168,83,.08)":"transparent",borderLeft:"3px solid "+(activeSession===s.id?"var(--ac)":"transparent")}}>
              <div style={{fontSize:10,fontWeight:600,color:activeSession===s.id?"var(--ac)":"var(--tx)",marginBottom:3}}>{s.titre||s.topic}</div>
              <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:3}}>
                <div style={{flex:1,height:3,background:"var(--s2)",borderRadius:2}}><div style={{height:"100%",width:pct+"%",background:"var(--green)",borderRadius:2}}/></div>
                <span style={{fontSize:7,color:"var(--mu)"}}>{pct}%</span>
              </div>
              <div style={{fontSize:7,color:"var(--mu)"}}>{s.level} · ⚡{s.xp||0} XP · {done}/{total}</div>
            </div>;
          })}
        </div>
      </div>

      {/* Main */}
      <div style={{flex:1,overflow:"auto",padding:"14px 16px"}}>
        {/* Créer un programme */}
        {creating && (
          <div style={{maxWidth:500}}>
            <div style={{fontWeight:700,fontSize:14,color:"var(--ac)",marginBottom:14,fontFamily:"var(--font-display)"}}>🆕 Nouveau programme d'apprentissage</div>
            <div style={{marginBottom:10}}>
              <div style={{fontSize:8,color:"var(--mu)",fontWeight:700,marginBottom:5}}>JE VEUX APPRENDRE</div>
              <input value={topic} onChange={e=>setTopic(e.target.value)} placeholder="Ex: Python, Marketing digital, Photographie…"
                style={{width:"100%",background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:6,color:"var(--tx)",fontSize:11,padding:"8px 11px",outline:"none",boxSizing:"border-box"}}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
              <div>
                <div style={{fontSize:8,color:"var(--mu)",fontWeight:700,marginBottom:5}}>MON NIVEAU</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                  {levels.map(l=><button key={l} onClick={()=>setLevel(l)}
                    style={{padding:"4px 9px",borderRadius:10,border:"1px solid "+(level===l?"var(--ac)":"var(--bd)"),background:level===l?"rgba(212,168,83,.12)":"transparent",color:level===l?"var(--ac)":"var(--mu)",fontSize:8,cursor:"pointer"}}>{l}</button>)}
                </div>
              </div>
              <div>
                <div style={{fontSize:8,color:"var(--mu)",fontWeight:700,marginBottom:5}}>NOMBRE DE SESSIONS</div>
                <div style={{display:"flex",gap:4}}>
                  {[4,6,8,10].map(n=><button key={n} onClick={()=>setSessionCount(n)}
                    style={{flex:1,padding:"4px",borderRadius:6,border:"1px solid "+(sessionCount===n?"var(--ac)":"var(--bd)"),background:sessionCount===n?"rgba(212,168,83,.12)":"transparent",color:sessionCount===n?"var(--ac)":"var(--mu)",fontSize:9,cursor:"pointer"}}>{n}</button>)}
                </div>
              </div>
            </div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={createSession} disabled={generating||!topic.trim()||!judge}
                style={{flex:1,padding:"8px",background:"rgba(212,168,83,.15)",border:"1px solid rgba(212,168,83,.4)",borderRadius:6,color:"var(--ac)",fontSize:10,cursor:"pointer",fontWeight:700}}>
                {generating?"⏳ Génération du programme…":"✨ Créer le programme"}
              </button>
              <button onClick={()=>setCreating(false)} style={{padding:"8px 14px",background:"transparent",border:"1px solid var(--bd)",borderRadius:6,color:"var(--mu)",fontSize:10,cursor:"pointer"}}>Annuler</button>
            </div>
          </div>
        )}

        {/* Session active */}
        {active && !creating && (
          <>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12,flexWrap:"wrap"}}>
              <div style={{fontFamily:"var(--font-display)",fontWeight:800,fontSize:15,color:"var(--tx)"}}>{active.titre}</div>
              <div style={{marginLeft:"auto",display:"flex",gap:8,alignItems:"center"}}>
                <span style={{fontSize:9,color:"var(--green)",fontWeight:700}}>⚡ {active.xp} XP</span>
                <span style={{fontSize:9,color:"var(--mu)"}}>{active.sessions?.filter(s=>s.completed).length||0}/{active.sessions?.length||0} sessions</span>
              </div>
            </div>
            {/* Barre de progression globale */}
            <div style={{marginBottom:14}}>
              <div style={{height:6,background:"var(--s2)",borderRadius:3,overflow:"hidden"}}>
                <div style={{height:"100%",width:((active.sessions?.filter(s=>s.completed).length||0)/(active.sessions?.length||1)*100)+"%",background:"var(--green)",borderRadius:3,transition:"width .5s"}}/>
              </div>
            </div>
            {/* Sessions roadmap */}
            <div style={{display:"flex",gap:6,marginBottom:16,overflowX:"auto",paddingBottom:4}}>
              {active.sessions?.map((s,i)=>(
                <div key={i} style={{flexShrink:0,width:110,padding:"8px 10px",borderRadius:8,border:"2px solid "+(i===active.currentSession?"var(--ac)":s.completed?"var(--green)":"var(--bd)"),background:i===active.currentSession?"rgba(212,168,83,.08)":s.completed?"rgba(74,222,128,.06)":"var(--s1)",cursor:"pointer",opacity:i>active.currentSession+1?.6:1}}
                  onClick={()=>{setSessions(prev=>{const u=prev.map(x=>x.id===active.id?{...x,currentSession:i}:x);saveS(u);return u;});setCurrentStep(null);}}>
                  <div style={{fontSize:9,color:s.completed?"var(--green)":i===active.currentSession?"var(--ac)":"var(--mu)",fontWeight:700,marginBottom:2}}>{s.completed?"✓":i===active.currentSession?"▶":"○"} S{i+1}</div>
                  <div style={{fontSize:8,color:"var(--tx)",lineHeight:1.3}}>{s.titre}</div>
                  {s.score!==null&&<div style={{fontSize:7,color:"var(--ac)",marginTop:2}}>★ {s.score}/10</div>}
                </div>
              ))}
            </div>

            {/* Session courante */}
            {active.sessions?.[active.currentSession] && (
              <div style={{background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:10,padding:"14px 16px",marginBottom:14}}>
                <div style={{fontWeight:700,fontSize:13,color:"var(--ac)",marginBottom:4}}>
                  Session {active.currentSession+1} : {active.sessions[active.currentSession].titre}
                </div>
                <div style={{fontSize:9,color:"var(--mu)",marginBottom:10}}>{active.sessions[active.currentSession].objectif}</div>
                {!currentStep && !stepLoading && (
                  <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                    {[["📖","lesson","Leçon"],["✏️","exercise","Exercice"],["❓","quiz","Quiz"]].map(([ico,type,label])=>(
                      <button key={type} onClick={()=>launchStep(active,type)}
                        style={{padding:"8px 16px",background:"rgba(212,168,83,.1)",border:"1px solid rgba(212,168,83,.3)",borderRadius:6,color:"var(--ac)",fontSize:9,cursor:"pointer",fontWeight:700}}>
                        {ico} {label}
                      </button>
                    ))}
                    {active.sessions[active.currentSession].completed && (
                      <div style={{fontSize:9,color:"var(--green)",padding:"8px",display:"flex",alignItems:"center",gap:4}}>✅ Session complétée</div>
                    )}
                  </div>
                )}
                {stepLoading && <div style={{fontSize:10,color:"var(--mu)",padding:"12px 0"}}>⏳ Génération en cours…</div>}
                {currentStep && !stepLoading && (
                  <div>
                    <div style={{fontSize:8,color:"var(--ac)",fontWeight:700,marginBottom:8,textTransform:"uppercase"}}>
                      {currentStep.type==="lesson"?"📖 Leçon":currentStep.type==="exercise"?"✏️ Exercice":"❓ Quiz"}
                    </div>
                    <div style={{fontSize:10,color:"var(--tx)",lineHeight:1.7,marginBottom:12,whiteSpace:"pre-wrap"}}>{currentStep.content}</div>
                    {currentStep.type !== "lesson" && !currentStep.result && (
                      <>
                        <textarea value={userAnswer} onChange={e=>setUserAnswer(e.target.value)} placeholder="Ta réponse…" rows={3}
                          style={{width:"100%",background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:6,color:"var(--tx)",fontSize:10,padding:"8px 10px",resize:"vertical",outline:"none",boxSizing:"border-box",marginBottom:8}}/>
                        <button onClick={submitAnswer} disabled={!userAnswer.trim()}
                          style={{padding:"7px 18px",background:"rgba(212,168,83,.15)",border:"1px solid rgba(212,168,83,.4)",borderRadius:6,color:"var(--ac)",fontSize:9,cursor:"pointer",fontWeight:700}}>
                          Soumettre ma réponse
                        </button>
                      </>
                    )}
                    {currentStep.result && (
                      <div style={{padding:"10px 12px",borderRadius:8,background:currentStep.result.correct?"rgba(74,222,128,.08)":"rgba(248,113,113,.08)",border:"1px solid "+(currentStep.result.correct?"rgba(74,222,128,.3)":"rgba(248,113,113,.3)"),marginTop:8}}>
                        <div style={{fontWeight:700,fontSize:11,color:currentStep.result.correct?"var(--green)":"var(--red)",marginBottom:4}}>
                          {currentStep.result.correct?"✅ Correct !":"❌ Pas tout à fait…"} — {currentStep.result.score}/10
                        </div>
                        <div style={{fontSize:9,color:"var(--tx)",lineHeight:1.6,marginBottom:6}}>{currentStep.result.feedback}</div>
                        {currentStep.result.bonne_reponse && <div style={{fontSize:9,color:"var(--ac)",padding:"6px 8px",background:"rgba(212,168,83,.06)",borderRadius:5}}>✨ {currentStep.result.bonne_reponse}</div>}
                      </div>
                    )}
                    <div style={{display:"flex",gap:8,marginTop:10}}>
                      <button onClick={()=>{setCurrentStep(null);setUserAnswer("");}} style={{fontSize:9,padding:"5px 12px",background:"transparent",border:"1px solid var(--bd)",borderRadius:5,color:"var(--mu)",cursor:"pointer"}}>↺ Réessayer</button>
                      {(currentStep.type==="lesson"||currentStep.result) && (
                        <button onClick={completeSession} style={{fontSize:9,padding:"5px 12px",background:"rgba(74,222,128,.1)",border:"1px solid rgba(74,222,128,.3)",borderRadius:5,color:"var(--green)",cursor:"pointer",fontWeight:700}}>
                          ✓ Session suivante →
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
        {!active && !creating && <div style={{textAlign:"center",padding:40,color:"var(--mu)",fontSize:10}}>Sélectionne ou crée un programme d'apprentissage</div>}
      </div>
    </div>
  );
}

// ╔══════════════════════════════════════════════════════════════╗
// ║  3. PROMPT DNA — Généalogie des meilleurs prompts            ║
// ╚══════════════════════════════════════════════════════════════╝
function PromptDNATab({ onInject }) {
  const DNA_KEY = "multiia_prompt_dna";
  const [nodes, setNodes] = React.useState(() => { try { return JSON.parse(localStorage.getItem(DNA_KEY)||"[]"); } catch { return []; } });
  const [selected, setSelected] = React.useState(null);
  const [adding, setAdding] = React.useState(false);
  const [newPrompt, setNewPrompt] = React.useState("");
  const [newTitle, setNewTitle] = React.useState("");
  const [parentId, setParentId] = React.useState(null);
  const [search, setSearch] = React.useState("");

  const saveN = (n) => { setNodes(n); try { localStorage.setItem(DNA_KEY, JSON.stringify(n)); } catch {} };

  const addNode = () => {
    if (!newPrompt.trim()) return;
    const node = {
      id: Date.now().toString(),
      title: newTitle || newPrompt.slice(0,40)+"…",
      prompt: newPrompt,
      parentId: parentId || null,
      children: [],
      stars: 0,
      uses: 0,
      createdAt: new Date().toISOString(),
      tags: [],
    };
    const updated = [...nodes, node];
    // Ajouter l'enfant dans le parent
    if (parentId) {
      const withChild = updated.map(n => n.id===parentId ? {...n, children:[...n.children, node.id]} : n);
      saveN(withChild);
    } else {
      saveN(updated);
    }
    setAdding(false); setNewPrompt(""); setNewTitle(""); setParentId(null);
    setSelected(node.id);
  };

  const starNode = (id) => {
    const updated = nodes.map(n => n.id===id ? {...n, stars:(n.stars||0)+1} : n);
    saveN(updated);
  };

  const useNode = (id) => {
    const updated = nodes.map(n => n.id===id ? {...n, uses:(n.uses||0)+1} : n);
    saveN(updated);
    const node = nodes.find(n=>n.id===id);
    if (node) onInject(node.prompt);
  };

  const deleteNode = (id) => {
    const updated = nodes.filter(n=>n.id!==id).map(n=>({...n, children:n.children.filter(c=>c!==id)}));
    saveN(updated); if(selected===id) setSelected(null);
  };

  // Racines (nodes sans parent)
  const roots = nodes.filter(n=>!n.parentId);
  const getChildren = (id) => nodes.filter(n=>n.parentId===id);
  const filtered = search ? nodes.filter(n=>n.title.toLowerCase().includes(search.toLowerCase())||n.prompt.toLowerCase().includes(search.toLowerCase())) : null;
  const sel = nodes.find(n=>n.id===selected);

  const renderNode = (node, depth=0) => (
    <div key={node.id} style={{marginLeft:depth*16}}>
      <div onClick={()=>setSelected(node.id)}
        style={{display:"flex",alignItems:"center",gap:6,padding:"6px 10px",borderRadius:6,cursor:"pointer",border:"1px solid "+(selected===node.id?"rgba(212,168,83,.4)":"transparent"),background:selected===node.id?"rgba(212,168,83,.06)":"transparent",marginBottom:2}}>
        {depth>0&&<span style={{color:"var(--mu)",fontSize:10,flexShrink:0}}>└</span>}
        <span style={{fontSize:9,color:"var(--tx)",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{node.title}</span>
        {node.stars>0&&<span style={{fontSize:8,color:"var(--ac)"}}>★{node.stars}</span>}
        {node.uses>0&&<span style={{fontSize:7,color:"var(--mu)"}}>×{node.uses}</span>}
        {getChildren(node.id).length>0&&<span style={{fontSize:7,color:"var(--blue)",flexShrink:0}}>⬡{getChildren(node.id).length}</span>}
      </div>
      {getChildren(node.id).map(c=>renderNode(c, depth+1))}
    </div>
  );

  return (
    <div style={{flex:1,display:"flex",overflow:"hidden"}}>
      {/* Sidebar arbre */}
      <div style={{width:220,flexShrink:0,borderRight:"1px solid var(--bd)",display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{padding:"10px 12px",borderBottom:"1px solid var(--bd)",background:"var(--s1)"}}>
          <div style={{fontFamily:"var(--font-display)",fontWeight:800,fontSize:12,color:"var(--ac)",marginBottom:8}}>🧬 Prompt DNA</div>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Rechercher…"
            style={{width:"100%",background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:5,color:"var(--tx)",fontSize:8,padding:"5px 8px",outline:"none",boxSizing:"border-box",marginBottom:6}}/>
          <button onClick={()=>{setAdding(true);setParentId(null);}}
            style={{width:"100%",padding:"5px",background:"rgba(212,168,83,.15)",border:"1px solid rgba(212,168,83,.4)",borderRadius:5,color:"var(--ac)",fontSize:8,cursor:"pointer",fontWeight:700}}>
            + Nouveau prompt racine
          </button>
        </div>
        <div style={{flex:1,overflow:"auto",padding:"6px 4px"}}>
          {nodes.length===0&&<div style={{padding:12,fontSize:9,color:"var(--mu)",textAlign:"center"}}>Aucun prompt.<br/>Ajoute ton premier !</div>}
          {(filtered||roots).map(n=>renderNode(n))}
        </div>
        {nodes.length>0&&(
          <div style={{padding:"8px 12px",borderTop:"1px solid var(--bd)",fontSize:8,color:"var(--mu)"}}>
            {nodes.length} prompts · {nodes.reduce((a,n)=>a+(n.stars||0),0)} ★ total
          </div>
        )}
      </div>

      {/* Main */}
      <div style={{flex:1,overflow:"auto",padding:"14px 16px"}}>
        {/* Formulaire d'ajout */}
        {adding && (
          <div style={{background:"var(--s1)",border:"1px solid rgba(212,168,83,.3)",borderRadius:10,padding:"14px 16px",marginBottom:14}}>
            <div style={{fontWeight:700,fontSize:12,color:"var(--ac)",marginBottom:10}}>{parentId?"🌿 Variante de :"+nodes.find(n=>n.id===parentId)?.title:"🌱 Nouveau prompt racine"}</div>
            <input value={newTitle} onChange={e=>setNewTitle(e.target.value)} placeholder="Titre court (optionnel)"
              style={{width:"100%",background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:5,color:"var(--tx)",fontSize:10,padding:"6px 10px",outline:"none",boxSizing:"border-box",marginBottom:8}}/>
            <textarea value={newPrompt} onChange={e=>setNewPrompt(e.target.value)} placeholder="Le prompt complet…" rows={4}
              style={{width:"100%",background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:5,color:"var(--tx)",fontSize:10,padding:"8px 10px",resize:"vertical",outline:"none",boxSizing:"border-box",marginBottom:8}}/>
            <div style={{display:"flex",gap:8}}>
              <button onClick={addNode} disabled={!newPrompt.trim()}
                style={{padding:"7px 16px",background:"rgba(212,168,83,.15)",border:"1px solid rgba(212,168,83,.4)",borderRadius:5,color:"var(--ac)",fontSize:9,cursor:"pointer",fontWeight:700}}>
                💾 Enregistrer
              </button>
              <button onClick={()=>{setAdding(false);setNewPrompt("");setNewTitle("");setParentId(null);}}
                style={{padding:"7px 12px",background:"transparent",border:"1px solid var(--bd)",borderRadius:5,color:"var(--mu)",fontSize:9,cursor:"pointer"}}>Annuler</button>
            </div>
          </div>
        )}

        {/* Détail du prompt sélectionné */}
        {sel && !adding && (
          <div>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12,flexWrap:"wrap"}}>
              <div style={{fontFamily:"var(--font-display)",fontWeight:800,fontSize:14,color:"var(--tx)",flex:1}}>{sel.title}</div>
              <div style={{display:"flex",gap:6}}>
                <button onClick={()=>starNode(sel.id)} style={{padding:"5px 10px",background:"rgba(212,168,83,.1)",border:"1px solid rgba(212,168,83,.3)",borderRadius:5,color:"var(--ac)",fontSize:9,cursor:"pointer"}}>★ Star ({sel.stars||0})</button>
                <button onClick={()=>useNode(sel.id)} style={{padding:"5px 10px",background:"rgba(74,222,128,.1)",border:"1px solid rgba(74,222,128,.3)",borderRadius:5,color:"var(--green)",fontSize:9,cursor:"pointer",fontWeight:700}}>▶ Utiliser</button>
                <button onClick={()=>{setAdding(true);setParentId(sel.id);setNewPrompt(sel.prompt+" ");}} style={{padding:"5px 10px",background:"rgba(96,165,250,.1)",border:"1px solid rgba(96,165,250,.3)",borderRadius:5,color:"var(--blue)",fontSize:9,cursor:"pointer"}}>⬡ Créer variante</button>
                <button onClick={()=>deleteNode(sel.id)} style={{padding:"5px 10px",background:"rgba(248,113,113,.1)",border:"1px solid rgba(248,113,113,.3)",borderRadius:5,color:"var(--red)",fontSize:9,cursor:"pointer"}}>🗑</button>
              </div>
            </div>
            {/* Généalogie */}
            {sel.parentId && (
              <div style={{marginBottom:10,fontSize:9,color:"var(--mu)",display:"flex",alignItems:"center",gap:4}}>
                <span>Dérivé de :</span>
                <button onClick={()=>setSelected(sel.parentId)} style={{background:"transparent",border:"none",color:"var(--blue)",fontSize:9,cursor:"pointer",textDecoration:"underline"}}>
                  {nodes.find(n=>n.id===sel.parentId)?.title||"parent"}
                </button>
              </div>
            )}
            {/* Stats */}
            <div style={{display:"flex",gap:10,marginBottom:12}}>
              {[["★","Stars",sel.stars||0],["▶","Utilisations",sel.uses||0],["⬡","Variantes",getChildren(sel.id).length],["📅","Créé",new Date(sel.createdAt).toLocaleDateString("fr-FR")]].map(([ico,l,v])=>(
                <div key={l} style={{background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:6,padding:"6px 10px",textAlign:"center",minWidth:60}}>
                  <div style={{fontSize:14}}>{ico}</div>
                  <div style={{fontSize:11,fontWeight:700,color:"var(--ac)"}}>{v}</div>
                  <div style={{fontSize:7,color:"var(--mu)"}}>{l}</div>
                </div>
              ))}
            </div>
            {/* Prompt */}
            <div style={{background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:8,padding:"12px 14px",marginBottom:12,position:"relative"}}>
              <div style={{fontSize:8,color:"var(--mu)",fontWeight:700,marginBottom:6}}>PROMPT COMPLET</div>
              <div style={{fontSize:10,color:"var(--tx)",lineHeight:1.7,whiteSpace:"pre-wrap"}}>{sel.prompt}</div>
              <button onClick={()=>navigator.clipboard.writeText(sel.prompt)}
                style={{position:"absolute",top:8,right:8,fontSize:8,padding:"2px 7px",background:"rgba(212,168,83,.1)",border:"1px solid rgba(212,168,83,.3)",borderRadius:4,color:"var(--ac)",cursor:"pointer"}}>📋</button>
            </div>
            {/* Variantes enfants */}
            {getChildren(sel.id).length>0 && (
              <div>
                <div style={{fontSize:9,fontWeight:700,color:"var(--mu)",marginBottom:8}}>⬡ VARIANTES ({getChildren(sel.id).length})</div>
                <div style={{display:"flex",flexDirection:"column",gap:4}}>
                  {getChildren(sel.id).map(c=>(
                    <div key={c.id} onClick={()=>setSelected(c.id)}
                      style={{padding:"8px 10px",borderRadius:6,border:"1px solid var(--bd)",background:"var(--s1)",cursor:"pointer",display:"flex",alignItems:"center",gap:8}}>
                      <span style={{fontSize:9,color:"var(--blue)"}}>└</span>
                      <span style={{fontSize:9,color:"var(--tx)",flex:1}}>{c.title}</span>
                      <span style={{fontSize:8,color:"var(--ac)"}}>★{c.stars||0}</span>
                      <span style={{fontSize:8,color:"var(--mu)"}}>×{c.uses||0}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        {!sel&&!adding&&<div style={{textAlign:"center",padding:40,color:"var(--mu)",fontSize:10}}>Sélectionne un prompt ou crée-en un nouveau</div>}
      </div>
    </div>
  );
}

// ╔══════════════════════════════════════════════════════════════╗
// ║  4. MODE CONFÉRENCE — IAs en chaîne collaborative            ║
// ╚══════════════════════════════════════════════════════════════╝
function ConferenceTab({ enabled, apiKeys }) {
  const [question, setQuestion] = React.useState("");
  const [chain, setChain] = React.useState([]); // [{iaId, role, output, loading}]
  const [running, setRunning] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [synthesis, setSynthesis] = React.useState("");
  const [synthLoading, setSynthLoading] = React.useState(false);
  const activeIds = Object.keys(MODEL_DEFS).filter(id => enabled[id] && !MODEL_DEFS[id]?.serial);

  const ROLES = [
    { id:"explorateur", label:"🔭 Explorateur", color:"#60A5FA", instruction:"Tu es l'Explorateur. Ton rôle : explorer toutes les pistes, angles et perspectives possibles sur le sujet. Sois large, créatif, ne t'autocensure pas. Propose des idées inattendues." },
    { id:"critique",    label:"🔍 Critique",    color:"#F87171", instruction:"Tu es le Critique. Ton rôle : analyser rigoureusement ce qu'a dit l'Explorateur. Identifie les failles, les imprécisions, les angles manquants. Sois précis et constructif." },
    { id:"constructeur",label:"🔨 Constructeur",color:"#4ADE80", instruction:"Tu es le Constructeur. En tenant compte de ce qu'ont dit l'Explorateur ET le Critique, construis la meilleure réponse possible. Synthétise, enrichis, structure clairement." },
  ];

  const runConference = async () => {
    if (!question.trim() || activeIds.length < 1) return;
    setRunning(true); setDone(false); setSynthesis(""); setChain([]);
    const steps = ROLES.slice(0, Math.min(ROLES.length, activeIds.length));
    let context = "";
    const results = [];
    for (let i = 0; i < steps.length; i++) {
      const role = steps[i];
      const iaId = activeIds[i % activeIds.length];
      const m = MODEL_DEFS[iaId];
      const newEntry = { iaId, roleId:role.id, roleLabel:role.label, roleColor:role.color, output:"", loading:true };
      setChain(prev=>[...prev, newEntry]);
      const prompt = i===0
        ? `Question : "${question}"\n\n${role.instruction}`
        : `Question originale : "${question}"\n\nÉchanges précédents :\n${context}\n\n${role.instruction}\n\nAppuie-toi sur ce qui précède pour aller plus loin.`;
      try {
        const reply = await callModel(iaId, [{role:"user", content:prompt}], apiKeys, role.instruction);
        context += `\n\n[${role.label} — ${m.short}]:\n${reply}`;
        results.push({ ...newEntry, output:reply, loading:false });
        setChain([...results]);
      } catch(e) {
        results.push({ ...newEntry, output:"❌ "+e.message, loading:false });
        setChain([...results]);
      }
    }
    setRunning(false); setDone(true);
  };

  const runSynthesis = async () => {
    if (!chain.length) return;
    setSynthLoading(true);
    const judge = activeIds[activeIds.length-1] || activeIds[0];
    const fullContext = chain.map(c=>`[${c.roleLabel}]:\n${c.output}`).join("\n\n");
    const prompt = `Voici une conférence IA en 3 étapes sur : "${question}"\n\n${fullContext}\n\nTu es le Synthétiseur Final. Produis une réponse définitive, claire et actionnable qui capitalise sur toute cette réflexion collective. Structure : 1) Réponse principale, 2) Points clés, 3) Prochaines étapes concrètes.`;
    try {
      const reply = await callModel(judge, [{role:"user",content:prompt}], apiKeys, "Tu es le Synthétiseur Final d'une conférence IA.");
      setSynthesis(reply);
    } catch(e) { setSynthesis("❌ "+e.message); }
    setSynthLoading(false);
  };

  return (
    <div style={{flex:1,overflow:"auto",padding:"clamp(10px,2vw,16px)"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6,flexWrap:"wrap"}}>
        <div style={{fontFamily:"var(--font-display)",fontWeight:800,fontSize:"clamp(14px,2.5vw,18px)",color:"#A78BFA"}}>🎙 Mode Conférence</div>
        <div style={{fontSize:9,color:"var(--mu)"}}>— 3 IAs en chaîne : Explorateur → Critique → Constructeur</div>
      </div>
      <div style={{fontSize:9,color:"var(--mu)",marginBottom:14,padding:"8px 12px",background:"rgba(167,139,250,.06)",border:"1px solid rgba(167,139,250,.15)",borderRadius:6}}>
        Contrairement au Débat (positions opposées), ici chaque IA <strong style={{color:"var(--tx)"}}>construit sur la précédente</strong>. Le résultat final est collectivement meilleur que n'importe quelle IA seule.
      </div>

      {/* Rôles visuels */}
      <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
        {ROLES.map((r,i)=>{
          const iaId = activeIds[i%activeIds.length];
          const m = iaId ? MODEL_DEFS[iaId] : null;
          return <div key={r.id} style={{flex:1,minWidth:140,padding:"10px 12px",background:"var(--s1)",border:"1px solid "+r.color+"33",borderRadius:8}}>
            <div style={{fontSize:12,color:r.color,fontWeight:700,marginBottom:3}}>{r.label}</div>
            <div style={{fontSize:8,color:"var(--mu)",lineHeight:1.4}}>{r.instruction.split(":")[1]?.trim().slice(0,80)}…</div>
            {m&&<div style={{marginTop:5,fontSize:8,color:m.color,fontWeight:700}}>→ {m.icon} {m.short}</div>}
          </div>;
        })}
      </div>

      {/* Input */}
      <div style={{marginBottom:12}}>
        <textarea value={question} onChange={e=>setQuestion(e.target.value)} placeholder="Pose ta question ou sujet à la conférence…"
          rows={3} style={{width:"100%",background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:8,color:"var(--tx)",fontSize:11,padding:"10px 12px",resize:"vertical",outline:"none",boxSizing:"border-box"}}/>
      </div>
      <button onClick={runConference} disabled={running||!question.trim()||!activeIds.length}
        style={{padding:"9px 22px",background:running?"var(--s2)":"rgba(167,139,250,.15)",border:"1px solid "+(running?"var(--bd)":"rgba(167,139,250,.4)"),borderRadius:6,color:running?"var(--mu)":"#A78BFA",fontSize:10,cursor:running?"default":"pointer",fontWeight:700,fontFamily:"var(--font-mono)",marginBottom:16}}>
        {running?"🎙 Conférence en cours…":"🎙 Lancer la conférence"}
      </button>

      {/* Chaîne de réponses */}
      {chain.length>0 && (
        <div style={{display:"flex",flexDirection:"column",gap:2,marginBottom:16,position:"relative"}}>
          {/* Ligne verticale */}
          <div style={{position:"absolute",left:20,top:20,bottom:20,width:2,background:"linear-gradient(to bottom,#60A5FA,#F87171,#4ADE80)",borderRadius:2,zIndex:0}}/>
          {chain.map((c,i)=>(
            <div key={i} style={{display:"flex",gap:12,alignItems:"flex-start",position:"relative",zIndex:1}}>
              <div style={{width:40,height:40,borderRadius:"50%",background:"var(--bg)",border:"2px solid "+c.roleColor,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>
                {c.roleLabel.slice(0,2)}
              </div>
              <div style={{flex:1,background:"var(--s1)",border:"1px solid "+c.roleColor+"33",borderRadius:10,padding:"12px 14px",marginBottom:8}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                  <span style={{fontWeight:700,fontSize:10,color:c.roleColor}}>{c.roleLabel}</span>
                  <span style={{fontSize:8,color:MODEL_DEFS[c.iaId]?.color,fontWeight:600}}>— {MODEL_DEFS[c.iaId]?.icon} {MODEL_DEFS[c.iaId]?.short}</span>
                  {i<chain.length-1&&<span style={{fontSize:8,color:"var(--mu)",marginLeft:"auto"}}>↓ transmis au suivant</span>}
                </div>
                {c.loading
                  ? <div style={{fontSize:9,color:"var(--mu)"}}>⏳ En cours…</div>
                  : <div style={{fontSize:10,color:"var(--tx)",lineHeight:1.7,whiteSpace:"pre-wrap"}}>{c.output}</div>
                }
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Synthèse finale */}
      {done && (
        <div style={{background:"var(--s1)",border:"1px solid rgba(167,139,250,.3)",borderRadius:10,padding:"14px 16px"}}>
          {!synthesis && !synthLoading && (
            <button onClick={runSynthesis}
              style={{padding:"8px 20px",background:"rgba(167,139,250,.15)",border:"1px solid rgba(167,139,250,.4)",borderRadius:6,color:"#A78BFA",fontSize:10,cursor:"pointer",fontWeight:700}}>
              ✨ Générer la synthèse finale
            </button>
          )}
          {synthLoading && <div style={{fontSize:10,color:"var(--mu)"}}>⏳ Synthèse en cours…</div>}
          {synthesis && (
            <>
              <div style={{fontSize:9,color:"#A78BFA",fontWeight:700,marginBottom:8}}>✨ SYNTHÈSE FINALE</div>
              <div style={{fontSize:10,color:"var(--tx)",lineHeight:1.7,whiteSpace:"pre-wrap"}}>{synthesis}</div>
              <button onClick={()=>navigator.clipboard.writeText(synthesis)} style={{marginTop:10,fontSize:8,padding:"3px 10px",background:"rgba(212,168,83,.1)",border:"1px solid rgba(212,168,83,.3)",borderRadius:4,color:"var(--ac)",cursor:"pointer"}}>📋 Copier la synthèse</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ╔══════════════════════════════════════════════════════════════╗
// ║  5. CONSENSUS SCORE — Fiabilité par vote croisé              ║
// ╚══════════════════════════════════════════════════════════════╝
function ConsensusTab({ enabled, apiKeys, conversations }) {
  const [claim, setClaim] = React.useState("");
  const [result, setResult] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const activeIds = Object.keys(MODEL_DEFS).filter(id => enabled[id] && !MODEL_DEFS[id]?.serial);

  // Pré-remplir depuis le chat
  const lastResponses = React.useMemo(() => {
    return activeIds.map(id => {
      const msgs = conversations[id]||[];
      const last = [...msgs].reverse().find(m=>m.role==="assistant");
      return last ? {id, text:last.content.slice(0,300)} : null;
    }).filter(Boolean).slice(0,3);
  }, [conversations, activeIds]);

  const runConsensus = async () => {
    if (!claim.trim() || activeIds.length < 2) return;
    setLoading(true); setResult(null);
    const voters = activeIds.filter(id=>!MODEL_DEFS[id]?.serial).slice(0, 6);
    const votes = await Promise.all(voters.map(async (id) => {
      const prompt = `Évalue cette affirmation : "${claim.slice(0,500)}"

Réponds UNIQUEMENT en JSON :
{"verdict":"vrai|faux|partiel|incertain","confiance":85,"raison":"1 phrase","sources_suggérées":["source 1","source 2"]}

- vrai = tu es certain que c'est correct
- faux = tu es certain que c'est incorrect  
- partiel = partiellement vrai/faux
- incertain = tu ne peux pas vérifier`;
      try {
        const reply = await callModel(id, [{role:"user",content:prompt}], apiKeys, "Vérificateur de faits. JSON uniquement.");
        const clean = reply.replace(/```json|```/g,"").trim();
        const data = JSON.parse(clean.match(/\{[\s\S]*\}/)?.[0]||clean);
        return { id, ...data, ok:true };
      } catch(e) { return { id, verdict:"incertain", confiance:0, raison:"Erreur: "+e.message, ok:false }; }
    }));

    // Calcul du score de consensus
    const verdictCounts = {vrai:0, faux:0, partiel:0, incertain:0};
    votes.forEach(v=>{ if(verdictCounts[v.verdict]!==undefined) verdictCounts[v.verdict]++; });
    const total = votes.length;
    const topVerdict = Object.entries(verdictCounts).sort(([,a],[,b])=>b-a)[0];
    const consensusRate = Math.round((topVerdict[1]/total)*100);
    const avgConfidence = Math.round(votes.reduce((a,v)=>a+(v.confiance||0),0)/total);
    const reliabilityScore = Math.round((consensusRate*0.6 + avgConfidence*0.4));
    const sources = [...new Set(votes.flatMap(v=>v.sources_suggérées||[]))].slice(0,5);

    setResult({ votes, verdictCounts, topVerdict:topVerdict[0], consensusRate, avgConfidence, reliabilityScore, sources, total });
    setLoading(false);
  };

  const verdictColor = v => ({vrai:"var(--green)",faux:"var(--red)",partiel:"var(--orange)",incertain:"var(--mu)"}[v]||"var(--mu)");
  const verdictLabel = v => ({vrai:"✅ Vrai",faux:"❌ Faux",partiel:"⚠️ Partiel",incertain:"❓ Incertain"}[v]||v);
  const scoreColor = s => s>=75?"var(--green)":s>=50?"var(--orange)":"var(--red)";

  return (
    <div style={{flex:1,overflow:"auto",padding:"clamp(10px,2vw,16px)"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6,flexWrap:"wrap"}}>
        <div style={{fontFamily:"var(--font-display)",fontWeight:800,fontSize:"clamp(14px,2.5vw,18px)",color:"#34D399"}}>🔎 Consensus Score</div>
        <div style={{fontSize:9,color:"var(--mu)"}}>— Fiabilité d'une affirmation par vote croisé de toutes tes IAs</div>
      </div>
      <div style={{fontSize:9,color:"var(--mu)",marginBottom:14,padding:"8px 12px",background:"rgba(52,211,153,.06)",border:"1px solid rgba(52,211,153,.15)",borderRadius:6}}>
        Colle une affirmation, un fait, ou la réponse d'une IA. Toutes tes IAs actives votent indépendamment. Plus le consensus est élevé, plus l'affirmation est fiable.
      </div>

      {/* Pré-remplir */}
      {lastResponses.length>0 && (
        <div style={{marginBottom:12,background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:8,padding:"10px 12px"}}>
          <div style={{fontSize:8,color:"var(--mu)",fontWeight:700,marginBottom:6}}>VÉRIFIER UNE RÉPONSE DU CHAT</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {lastResponses.map(r=>{
              const m=MODEL_DEFS[r.id];
              return <button key={r.id} onClick={()=>setClaim(r.text)}
                style={{padding:"4px 10px",borderRadius:8,border:"1px solid "+m.color+"44",background:m.color+"11",color:m.color,fontSize:8,cursor:"pointer"}}>
                {m.icon} Réponse {m.short}
              </button>;
            })}
          </div>
        </div>
      )}

      <textarea value={claim} onChange={e=>setClaim(e.target.value)}
        placeholder="Ex: La Terre est plus vieille que le Soleil. / Ex: colle ici la réponse d'une IA à vérifier…"
        rows={3} style={{width:"100%",background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:8,color:"var(--tx)",fontSize:11,padding:"10px 12px",resize:"vertical",outline:"none",boxSizing:"border-box",marginBottom:10}}/>

      <button onClick={runConsensus} disabled={loading||!claim.trim()||activeIds.length<2}
        style={{padding:"9px 22px",background:loading?"var(--s2)":"rgba(52,211,153,.15)",border:"1px solid "+(loading?"var(--bd)":"rgba(52,211,153,.4)"),borderRadius:6,color:loading?"var(--mu)":"#34D399",fontSize:10,cursor:loading?"default":"pointer",fontWeight:700,fontFamily:"var(--font-mono)",marginBottom:16}}>
        {loading?"🔎 Vote en cours…":"🔎 Lancer le vote de fiabilité"}
      </button>
      {activeIds.length<2&&<div style={{fontSize:9,color:"var(--red)",marginBottom:10}}>Active au moins 2 IAs pour le vote croisé</div>}

      {result && (
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {/* Score principal */}
          <div style={{padding:"16px 20px",background:"var(--s1)",border:"2px solid "+scoreColor(result.reliabilityScore)+"55",borderRadius:12,textAlign:"center"}}>
            <div style={{fontSize:48,fontWeight:900,color:scoreColor(result.reliabilityScore),fontFamily:"var(--font-display)",lineHeight:1}}>
              {result.reliabilityScore}%
            </div>
            <div style={{fontSize:12,color:"var(--tx)",marginTop:4,fontWeight:700}}>Score de fiabilité</div>
            <div style={{fontSize:10,color:verdictColor(result.topVerdict),marginTop:4,fontWeight:700}}>
              {verdictLabel(result.topVerdict)} · {result.consensusRate}% de consensus · Confiance moy. {result.avgConfidence}%
            </div>
            <div style={{marginTop:10,height:8,background:"var(--s2)",borderRadius:4,overflow:"hidden",maxWidth:300,margin:"10px auto 0"}}>
              <div style={{height:"100%",width:result.reliabilityScore+"%",background:scoreColor(result.reliabilityScore),borderRadius:4,transition:"width .8s"}}/>
            </div>
          </div>

          {/* Distribution des votes */}
          <div style={{background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:8,padding:"12px"}}>
            <div style={{fontSize:9,color:"var(--mu)",fontWeight:700,marginBottom:10}}>DISTRIBUTION DES VOTES ({result.total} IAs)</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {Object.entries(result.verdictCounts).filter(([,v])=>v>0).map(([verdict,count])=>(
                <div key={verdict} style={{flex:1,minWidth:80,padding:"8px",background:verdictColor(verdict)+"11",border:"1px solid "+verdictColor(verdict)+"33",borderRadius:8,textAlign:"center"}}>
                  <div style={{fontSize:18}}>{verdictLabel(verdict).split(" ")[0]}</div>
                  <div style={{fontSize:16,fontWeight:900,color:verdictColor(verdict)}}>{count}</div>
                  <div style={{fontSize:8,color:"var(--mu)",textTransform:"capitalize"}}>{verdict}</div>
                  <div style={{fontSize:9,color:verdictColor(verdict),fontWeight:700}}>{Math.round(count/result.total*100)}%</div>
                </div>
              ))}
            </div>
          </div>

          {/* Votes détaillés */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:8}}>
            {result.votes.map((v,i)=>{
              const m=MODEL_DEFS[v.id];
              return <div key={i} style={{background:"var(--s1)",border:"1px solid "+verdictColor(v.verdict)+"33",borderRadius:8,padding:"10px 12px"}}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:5}}>
                  <span style={{color:m.color,fontSize:12}}>{m.icon}</span>
                  <span style={{fontWeight:700,fontSize:10,color:m.color}}>{m.short}</span>
                  <span style={{marginLeft:"auto",padding:"2px 7px",borderRadius:8,background:verdictColor(v.verdict)+"22",color:verdictColor(v.verdict),fontSize:8,fontWeight:700}}>{verdictLabel(v.verdict)}</span>
                </div>
                <div style={{fontSize:9,color:"var(--mu)",marginBottom:4}}>Confiance : <span style={{color:v.confiance>70?"var(--green)":v.confiance>40?"var(--orange)":"var(--red)",fontWeight:700}}>{v.confiance}%</span></div>
                <div style={{fontSize:9,color:"var(--tx)",lineHeight:1.5}}>{v.raison}</div>
              </div>;
            })}
          </div>

          {/* Sources suggérées */}
          {result.sources.length>0 && (
            <div style={{background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:8,padding:"10px 12px"}}>
              <div style={{fontSize:8,color:"var(--mu)",fontWeight:700,marginBottom:6}}>📚 SOURCES SUGGÉRÉES POUR VÉRIFIER</div>
              {result.sources.map((s,i)=><div key={i} style={{fontSize:9,color:"var(--blue)",marginBottom:3}}>• {s}</div>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ╔══════════════════════════════════════════════════════════════╗
// ║  MORNING BRIEF — Briefing IA proactif personnalisé           ║
// ╚══════════════════════════════════════════════════════════════╝
function MorningBriefTab({ enabled, apiKeys, projects, memFacts, usageStats }) {
  const BRIEF_KEY = "multiia_morning_brief";
  const BRIEF_CONF = "multiia_brief_config";

  const [config, setConfig] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem(BRIEF_CONF) || "{}"); } catch { return {}; }
  });
  const [brief, setBrief] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem(BRIEF_KEY) || "null"); } catch { return null; }
  });
  const [loading, setLoading] = React.useState(false);
  const [editConfig, setEditConfig] = React.useState(false);

  const saveConfig = (c) => { setConfig(c); try { localStorage.setItem(BRIEF_CONF, JSON.stringify(c)); } catch {} };
  const saveBrief  = (b) => { setBrief(b);  try { localStorage.setItem(BRIEF_KEY, JSON.stringify(b)); } catch {} };

  const activeIds = Object.keys(MODEL_DEFS).filter(id => enabled[id] && !MODEL_DEFS[id]?.serial);
  const bestIA    = activeIds.find(id => ["groq","mistral","cerebras","sambanova"].includes(id)) || activeIds[0];

  // Vérification auto chaque minute — génère le brief si l'heure est atteinte
  React.useEffect(() => {
    if (!config.autoTime || !config.enabled) return;
    const iv = setInterval(() => {
      const now  = new Date();
      const hhmm = now.getHours().toString().padStart(2,"0") + ":" + now.getMinutes().toString().padStart(2,"0");
      const today = now.toISOString().slice(0,10);
      if (hhmm === config.autoTime && brief?.date !== today) {
        generateBrief(true); // silent auto-generation
      }
    }, 60000);
    return () => clearInterval(iv);
  }, [config, brief]);

  const generateBrief = async (silent = false) => {
    if (!bestIA) return;
    if (!silent) setLoading(true);

    // Contexte personnalisé
    const topIA = Object.entries(usageStats?.msgs || {}).sort(([,a],[,b])=>b-a)[0];
    const activeProjects = (projects || []).filter(p => p.context || p.notes).slice(0,2);
    const memories = (memFacts || []).slice(0,5).map(f => "- " + f.text).join("\n");

    const date = new Date().toLocaleDateString("fr-FR", { weekday:"long", day:"numeric", month:"long", year:"numeric" });
    const sections = config.sections || ["actu","taches","conseil","citation"];

    const sectionPrompts = {
      actu:     "📰 ACTUALITÉS IA DU JOUR (3 tendances ou nouvelles importantes du monde de l'IA aujourd'hui)",
      taches:   "✅ TOP 3 TÂCHES (basé sur les projets actifs, suggère les 3 actions les plus impactantes pour aujourd'hui)",
      conseil:  "💡 CONSEIL IA DU JOUR (1 astuce pratique pour mieux utiliser les LLMs aujourd'hui)",
      citation: "✨ INSPIRATION (1 citation motivante en lien avec l'IA ou la créativité)",
      meteo_ia: "🌡️ MÉTÉO IA (température du marché IA : chaud/tiède/calme, et pourquoi en 1 phrase)",
      prompt:   "🎯 PROMPT DU JOUR (1 prompt prêt à l'emploi, utile et original)",
    };

    const prompt = `Tu es l'assistant personnel de quelqu'un qui utilise des IAs tous les jours. Génère son briefing du matin pour ${date}.

CONTEXTE UTILISATEUR :
- IA préférée : ${topIA ? MODEL_DEFS[topIA[0]]?.name : "non définie"}
- Projets actifs : ${activeProjects.map(p=>p.name+"("+p.desc+")").join(", ") || "aucun"}
- Mémoire personnelle : ${memories || "vide"}
- Sections demandées : ${sections.join(", ")}

Génère UNIQUEMENT un JSON valide :
{
  "salutation": "Bonjour [prénom si connu, sinon utilisateur] !",
  "date_str": "${date}",
  "sections": {
    ${sections.map(s => `"${s}": ${s === "taches" ? '["tâche 1","tâche 2","tâche 3"]' : s === "actu" ? '["actu 1","actu 2","actu 3"]' : '"contenu"'}`).join(",\n    ")}
  },
  "ia_du_jour": {"id":"${bestIA}","raison":"pourquoi utiliser cette IA aujourd'hui"},
  "minute_a_retenir": "1 chose importante à savoir aujourd'hui en IA (max 2 phrases)"
}`;

    try {
      const reply = await callModel(bestIA, [{role:"user", content:prompt}], apiKeys, "Assistant personnel briefing. JSON uniquement, sans markdown.");
      const clean = reply.replace(/```json|```/g,"").trim();
      const data  = JSON.parse(clean.match(/\{[\s\S]*\}/)?.[0] || clean);
      const result = { ...data, generatedAt: new Date().toISOString(), date: new Date().toISOString().slice(0,10), ia: bestIA };
      saveBrief(result);
    } catch(e) {
      if (!silent) saveBrief({ error: e.message, generatedAt: new Date().toISOString(), date: new Date().toISOString().slice(0,10) });
    }
    if (!silent) setLoading(false);
  };

  const SECTION_LABELS = {
    actu:     { icon:"📰", label:"Actualités IA" },
    taches:   { icon:"✅", label:"Mes 3 tâches" },
    conseil:  { icon:"💡", label:"Conseil du jour" },
    citation: { icon:"✨", label:"Inspiration" },
    meteo_ia: { icon:"🌡️", label:"Météo IA" },
    prompt:   { icon:"🎯", label:"Prompt du jour" },
  };

  const isToday = brief?.date === new Date().toISOString().slice(0,10);
  const m = MODEL_DEFS[brief?.ia];

  return (
    <div style={{flex:1, overflow:"auto", padding:"clamp(10px,2vw,16px)"}}>
      {/* Header */}
      <div style={{display:"flex", alignItems:"center", gap:10, marginBottom:6, flexWrap:"wrap"}}>
        <div style={{fontFamily:"var(--font-display)", fontWeight:800, fontSize:"clamp(14px,2.5vw,20px)", color:"var(--ac)"}}>☀️ Morning Brief</div>
        <div style={{fontSize:9, color:"var(--mu)"}}>— Ton briefing IA personnalisé, chaque matin</div>
        <div style={{marginLeft:"auto", display:"flex", gap:8}}>
          <button onClick={()=>setEditConfig(v=>!v)}
            style={{padding:"5px 12px", background:"transparent", border:"1px solid var(--bd)", borderRadius:5, color:"var(--mu)", fontSize:9, cursor:"pointer"}}>
            ⚙ Configurer
          </button>
          <button onClick={()=>generateBrief()} disabled={loading||!bestIA}
            style={{padding:"5px 14px", background:"rgba(212,168,83,.15)", border:"1px solid rgba(212,168,83,.4)", borderRadius:5, color:"var(--ac)", fontSize:9, cursor:"pointer", fontWeight:700}}>
            {loading ? "⏳ Génération…" : "🔄 Générer maintenant"}
          </button>
        </div>
      </div>

      {/* Config panel */}
      {editConfig && (
        <div style={{marginBottom:14, background:"var(--s1)", border:"1px solid var(--bd)", borderRadius:10, padding:"14px 16px"}}>
          <div style={{fontWeight:700, fontSize:11, color:"var(--tx)", marginBottom:12}}>⚙ Configuration du brief</div>
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12}}>
            <div>
              <div style={{fontSize:8, color:"var(--mu)", fontWeight:700, marginBottom:5}}>GÉNÉRATION AUTO</div>
              <div style={{display:"flex", alignItems:"center", gap:8}}>
                <input type="checkbox" checked={!!config.enabled} onChange={e=>saveConfig({...config, enabled:e.target.checked})}/>
                <label style={{fontSize:9, color:"var(--tx)"}}>Activer le brief automatique</label>
              </div>
              <div style={{marginTop:6, display:"flex", alignItems:"center", gap:6}}>
                <span style={{fontSize:9, color:"var(--mu)"}}>Heure :</span>
                <input type="time" value={config.autoTime||"08:00"} onChange={e=>saveConfig({...config, autoTime:e.target.value})}
                  style={{background:"var(--s2)", border:"1px solid var(--bd)", borderRadius:4, color:"var(--tx)", fontSize:9, padding:"3px 8px", outline:"none"}}/>
              </div>
            </div>
            <div>
              <div style={{fontSize:8, color:"var(--mu)", fontWeight:700, marginBottom:5}}>SECTIONS INCLUSES</div>
              <div style={{display:"flex", flexWrap:"wrap", gap:4}}>
                {Object.entries(SECTION_LABELS).map(([k,{icon,label}])=>{
                  const active = (config.sections||["actu","taches","conseil","citation"]).includes(k);
                  return <button key={k} onClick={()=>{
                    const cur = config.sections||["actu","taches","conseil","citation"];
                    const next = active ? cur.filter(s=>s!==k) : [...cur,k];
                    saveConfig({...config, sections:next});
                  }} style={{padding:"3px 8px", borderRadius:8, border:"1px solid "+(active?"var(--ac)":"var(--bd)"), background:active?"rgba(212,168,83,.12)":"transparent", color:active?"var(--ac)":"var(--mu)", fontSize:8, cursor:"pointer"}}>
                    {icon} {label}
                  </button>;
                })}
              </div>
            </div>
          </div>
          <div style={{fontSize:8, color:"var(--mu)", fontStyle:"italic"}}>
            💡 Le brief utilise tes projets actifs, ta mémoire personnelle et ton historique d'usage pour personnaliser le contenu.
          </div>
        </div>
      )}

      {/* Pas de brief */}
      {!brief && !loading && (
        <div style={{textAlign:"center", padding:"60px 20px"}}>
          <div style={{fontSize:48, marginBottom:12}}>☀️</div>
          <div style={{fontSize:14, fontWeight:700, color:"var(--tx)", marginBottom:6}}>Aucun brief généré</div>
          <div style={{fontSize:10, color:"var(--mu)", marginBottom:20}}>Clique sur "Générer maintenant" pour recevoir ton premier briefing personnalisé.</div>
          <button onClick={()=>generateBrief()} disabled={!bestIA}
            style={{padding:"10px 24px", background:"rgba(212,168,83,.15)", border:"1px solid rgba(212,168,83,.4)", borderRadius:8, color:"var(--ac)", fontSize:11, cursor:"pointer", fontWeight:700}}>
            ☀️ Créer mon premier brief
          </button>
          {!bestIA && <div style={{marginTop:8, fontSize:9, color:"var(--red)"}}>Active au moins une IA dans Config</div>}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{textAlign:"center", padding:"60px 20px"}}>
          <div style={{fontSize:32, marginBottom:10, animation:"spin 2s linear infinite", display:"inline-block"}}>⚙️</div>
          <div style={{fontSize:11, color:"var(--mu)"}}>Génération de ton briefing personnalisé…</div>
        </div>
      )}

      {/* Brief affiché */}
      {brief && !loading && !brief.error && (
        <div>
          {/* En-tête */}
          <div style={{marginBottom:16, padding:"16px 20px", background:"linear-gradient(135deg, rgba(212,168,83,.12), rgba(212,168,83,.04))", border:"1px solid rgba(212,168,83,.3)", borderRadius:12}}>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:6}}>
              <div>
                <div style={{fontFamily:"var(--font-display)", fontWeight:800, fontSize:"clamp(16px,3vw,22px)", color:"var(--ac)", marginBottom:2}}>{brief.salutation || "Bonjour !"}</div>
                <div style={{fontSize:10, color:"var(--mu)"}}>{brief.date_str}</div>
              </div>
              <div style={{display:"flex", alignItems:"center", gap:6, fontSize:9, color:"var(--mu)"}}>
                {m && <><span style={{color:m.color}}>{m.icon} {m.short}</span> · </>}
                {isToday ? <span style={{color:"var(--green)"}}>✓ Aujourd'hui</span> : <span style={{color:"var(--orange)"}}>Hier</span>}
              </div>
            </div>
            {brief.minute_a_retenir && (
              <div style={{marginTop:10, padding:"8px 12px", background:"rgba(212,168,83,.08)", borderRadius:6, fontSize:10, color:"var(--tx)", lineHeight:1.6, fontStyle:"italic"}}>
                🔑 {brief.minute_a_retenir}
              </div>
            )}
          </div>

          {/* IA du jour */}
          {brief.ia_du_jour && MODEL_DEFS[brief.ia_du_jour.id] && (
            <div style={{marginBottom:12, padding:"10px 14px", background:"var(--s1)", border:"1px solid "+MODEL_DEFS[brief.ia_du_jour.id].color+"33", borderRadius:8, display:"flex", alignItems:"center", gap:10}}>
              <span style={{fontSize:20}}>{MODEL_DEFS[brief.ia_du_jour.id].icon}</span>
              <div>
                <div style={{fontSize:9, color:"var(--mu)", fontWeight:700}}>IA DU JOUR</div>
                <div style={{fontSize:10, fontWeight:700, color:MODEL_DEFS[brief.ia_du_jour.id].color}}>{MODEL_DEFS[brief.ia_du_jour.id].name}</div>
                <div style={{fontSize:9, color:"var(--mu)"}}>{brief.ia_du_jour.raison}</div>
              </div>
            </div>
          )}

          {/* Sections */}
          <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:10}}>
            {Object.entries(brief.sections || {}).map(([key, content]) => {
              const meta = SECTION_LABELS[key] || {icon:"📌", label:key};
              const isList = Array.isArray(content);
              return (
                <div key={key} style={{background:"var(--s1)", border:"1px solid var(--bd)", borderRadius:10, padding:"12px 14px"}}>
                  <div style={{fontSize:9, fontWeight:700, color:"var(--ac)", marginBottom:8}}>{meta.icon} {meta.label.toUpperCase()}</div>
                  {isList
                    ? content.map((item,i) => (
                        <div key={i} style={{display:"flex", gap:8, marginBottom:6, fontSize:10, color:"var(--tx)", lineHeight:1.5}}>
                          <span style={{color:"var(--ac)", flexShrink:0, fontWeight:700}}>{i+1}.</span>{item}
                        </div>
                      ))
                    : <div style={{fontSize:10, color:"var(--tx)", lineHeight:1.7}}>{content}</div>
                  }
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div style={{marginTop:12, display:"flex", gap:8, justifyContent:"flex-end"}}>
            <button onClick={()=>{ const txt = `☀️ Morning Brief — ${brief.date_str}\n\n`+Object.entries(brief.sections||{}).map(([k,v])=>`${SECTION_LABELS[k]?.icon} ${SECTION_LABELS[k]?.label}\n${Array.isArray(v)?v.map((x,i)=>(i+1)+". "+x).join("\n"):v}`).join("\n\n"); navigator.clipboard.writeText(txt); }}
              style={{fontSize:9, padding:"5px 12px", background:"transparent", border:"1px solid var(--bd)", borderRadius:5, color:"var(--mu)", cursor:"pointer"}}>📋 Copier</button>
            <button onClick={()=>generateBrief()}
              style={{fontSize:9, padding:"5px 12px", background:"rgba(212,168,83,.1)", border:"1px solid rgba(212,168,83,.3)", borderRadius:5, color:"var(--ac)", cursor:"pointer"}}>🔄 Regénérer</button>
          </div>
        </div>
      )}

      {brief?.error && <div style={{padding:20, color:"var(--red)", fontSize:10}}>Erreur : {brief.error}</div>}
    </div>
  );
}

// ╔══════════════════════════════════════════════════════════════╗
// ║  TASK TO IAs — Décomposition + routage multi-modèle          ║
// ╚══════════════════════════════════════════════════════════════╝
function TaskToIAsTab({ enabled, apiKeys, navigateTab, setChatInput }) {
  const [task, setTask] = React.useState("");
  const [plan, setPlan] = React.useState(null);       // [{id,title,type,ia,prompt,status,output}]
  const [planning, setPlanning] = React.useState(false);
  const [running, setRunning] = React.useState(false);
  const [results, setResults] = React.useState([]);
  const [assembly, setAssembly] = React.useState("");
  const [assembling, setAssembling] = React.useState(false);
  const [editingPlan, setEditingPlan] = React.useState(false);

  const activeIds = Object.keys(MODEL_DEFS).filter(id => enabled[id] && !MODEL_DEFS[id]?.serial);

  // Spécialités par IA pour le routage intelligent
  const IA_SPECIALTIES = {
    groq:       { best:["vitesse","brainstorming","idées","recherche rapide","liste"], icon:"⚡" },
    mistral:    { best:["français","rédaction","reformulation","mail","rapport"], icon:"▲" },
    cohere:     { best:["résumé","extraction","analyse document","rag","structured"], icon:"⌘" },
    cerebras:   { best:["code","débogage","algorithme","fonction","script"], icon:"◉" },
    sambanova:  { best:["raisonnement","analyse complexe","stratégie","décision"], icon:"∞" },
    qwen3:      { best:["code","maths","multilingue","calcul","logique"], icon:"◈" },
    llama4s:    { best:["multimodal","image","vision","créatif","diversité"], icon:"🦙" },
    gemma2:     { best:["synthèse rapide","classification","catégorie","format"], icon:"◎" },
    poll_gpt:   { best:["polyvalent","créatif","général","conversation"], icon:"◈" },
    poll_claude:{ best:["analyse","nuance","éthique","long texte","profond"], icon:"✦" },
  };

  const TASK_TYPES = [
    { id:"recherche",  label:"🔍 Recherche",  color:"#60A5FA", desc:"Trouver, analyser, synthétiser" },
    { id:"redaction",  label:"✍️ Rédaction",  color:"#34D399", desc:"Écrire, reformuler, structurer" },
    { id:"code",       label:"💻 Code",       color:"#A78BFA", desc:"Programmer, déboguer, optimiser" },
    { id:"strategie",  label:"🎯 Stratégie",  color:"#F97316", desc:"Planifier, décider, prioriser" },
    { id:"analyse",    label:"🔬 Analyse",    color:"#F87171", desc:"Critiquer, évaluer, comparer" },
    { id:"creation",   label:"🎨 Création",   color:"#EC4899", desc:"Générer, inventer, brainstormer" },
  ];

  // Routage intelligent : trouve la meilleure IA pour un type de tâche
  const routeTask = (taskType) => {
    const available = activeIds;
    if (!available.length) return available[0];
    // Cherche l'IA dont les spécialités matchent le type
    const scored = available.map(id => {
      const spec = IA_SPECIALTIES[id]?.best || [];
      const score = spec.filter(s => taskType.toLowerCase().includes(s) || s.includes(taskType.toLowerCase())).length;
      return { id, score };
    }).sort((a,b) => b.score - a.score);
    return scored[0]?.id || available[0];
  };

  const generatePlan = async () => {
    if (!task.trim() || !activeIds.length) return;
    setPlanning(true); setPlan(null); setResults([]); setAssembly("");

    const plannerIA = activeIds.find(id=>["groq","mistral","sambanova"].includes(id)) || activeIds[0];
    const availableIAs = activeIds.map(id => `- ${id} (${MODEL_DEFS[id]?.short}): spécialités ${IA_SPECIALTIES[id]?.best?.join(", ")||"généraliste"}`).join("\n");

    const prompt = `Tu es un orchestrateur d'agents IA. L'utilisateur veut accomplir cette tâche complexe :
"${task}"

IAs disponibles :
${availableIAs}

Décompose cette tâche en 3 à 6 sous-tâches, en assignant chaque sous-tâche à l'IA la plus adaptée.
Types disponibles : recherche, redaction, code, strategie, analyse, creation.

Réponds UNIQUEMENT en JSON valide :
[
  {
    "id": "step1",
    "title": "Titre court de la sous-tâche",
    "type": "recherche|redaction|code|strategie|analyse|creation",
    "ia": "id_de_lia",
    "rationale": "pourquoi cette IA pour cette tâche (1 phrase)",
    "prompt": "Le prompt complet et précis à envoyer à cette IA pour accomplir SA partie"
  }
]`;

    try {
      const reply = await callModel(plannerIA, [{role:"user",content:prompt}], apiKeys, "Orchestrateur d'agents. JSON uniquement, sans markdown.");
      const clean = reply.replace(/```json|```/g,"").trim();
      const steps = JSON.parse(clean.match(/\[[\s\S]*\]/)?.[0] || clean);
      // Override le routage avec notre logique si l'IA suggérée n'est pas disponible
      const validatedSteps = steps.map((s,i) => ({
        ...s,
        id: `step${i+1}`,
        ia: activeIds.includes(s.ia) ? s.ia : routeTask(s.type),
        status: "pending",
        output: null,
      }));
      setPlan(validatedSteps);
    } catch(e) {
      alert("Erreur lors de la planification : " + e.message);
    }
    setPlanning(false);
  };

  const runPlan = async () => {
    if (!plan?.length) return;
    setRunning(true); setResults([]); setAssembly("");

    const newResults = [];
    for (const step of plan) {
      // Mettre à jour le statut
      setPlan(prev => prev.map(s => s.id===step.id ? {...s, status:"running"} : s));

      // Enrichir le prompt avec les outputs précédents si pertinent
      const prevOutputs = newResults.map(r => `[${r.title}]:\n${r.output}`).join("\n\n");
      const enrichedPrompt = prevOutputs
        ? `Contexte des étapes précédentes :\n${prevOutputs}\n\n---\nTa mission :\n${step.prompt}`
        : step.prompt;

      try {
        const start = Date.now();
        const output = await callModel(step.ia, [{role:"user", content:enrichedPrompt}], apiKeys,
          `Tu es un expert spécialisé en ${step.type}. Tu travailles sur la tâche : "${task}". Sois précis et actionnable.`
        );
        const duration = ((Date.now()-start)/1000).toFixed(1);
        const result = { ...step, output, status:"done", duration };
        newResults.push(result);
        setPlan(prev => prev.map(s => s.id===step.id ? result : s));
        setResults([...newResults]);
      } catch(e) {
        const result = { ...step, output:`❌ ${e.message}`, status:"error" };
        newResults.push(result);
        setPlan(prev => prev.map(s => s.id===step.id ? result : s));
        setResults([...newResults]);
      }
    }
    setRunning(false);
  };

  const assembleResults = async () => {
    if (!results.length) return;
    setAssembling(true);
    const assemblerIA = activeIds.find(id=>["mistral","groq","sambanova","poll_claude"].includes(id)) || activeIds[0];
    const allOutputs = results.filter(r=>r.status==="done").map((r,i) => `## Étape ${i+1} — ${r.title}\n${r.output}`).join("\n\n");

    const prompt = `Tu es un expert en synthèse. Voici les résultats d'un pipeline multi-IA pour accomplir :
"${task}"

Résultats des différentes IAs :
${allOutputs}

Assemble ces résultats en un livrable final cohérent, structuré et actionnable. 
Format : titre, introduction, sections claires, conclusion avec prochaines étapes.`;

    try {
      const output = await callModel(assemblerIA, [{role:"user",content:prompt}], apiKeys, "Expert en assemblage et synthèse. Produis un document final professionnel.");
      setAssembly(output);
    } catch(e) { setAssembly("❌ " + e.message); }
    setAssembling(false);
  };

  const typeInfo = (type) => TASK_TYPES.find(t=>t.id===type) || {label:type, color:"var(--mu)", icon:"📌"};
  const statusIcon = s => ({pending:"○", running:"⟳", done:"✓", error:"✗"}[s]||"○");
  const statusColor = s => ({pending:"var(--mu)", running:"var(--ac)", done:"var(--green)", error:"var(--red)"}[s]||"var(--mu)");

  return (
    <div style={{flex:1, overflow:"auto", padding:"clamp(10px,2vw,16px)"}}>
      {/* Header */}
      <div style={{display:"flex", alignItems:"center", gap:10, marginBottom:6, flexWrap:"wrap"}}>
        <div style={{fontFamily:"var(--font-display)", fontWeight:800, fontSize:"clamp(14px,2.5vw,18px)", color:"#F97316"}}>🔀 Task to IAs</div>
        <div style={{fontSize:9, color:"var(--mu)"}}>— Décompose une tâche complexe et route chaque partie vers la meilleure IA</div>
      </div>
      <div style={{fontSize:9, color:"var(--mu)", marginBottom:14, padding:"8px 12px", background:"rgba(249,115,22,.06)", border:"1px solid rgba(249,115,22,.15)", borderRadius:6}}>
        Tu décris une tâche complexe. Une IA orchestre et décompose en sous-tâches. <strong style={{color:"var(--tx)"}}>Chaque sous-tâche est automatiquement routée vers l'IA la plus adaptée</strong> (vitesse, rédaction, code, analyse…). Les résultats sont assemblés en un livrable final.
      </div>

      {/* IAs disponibles + spécialités */}
      <div style={{marginBottom:12, display:"flex", gap:6, flexWrap:"wrap"}}>
        {activeIds.map(id => {
          const m = MODEL_DEFS[id];
          const spec = IA_SPECIALTIES[id]?.best?.slice(0,2).join(", ") || "généraliste";
          return <div key={id} style={{padding:"4px 10px", borderRadius:8, border:"1px solid "+m.color+"33", background:m.color+"0A", fontSize:8}}>
            <span style={{color:m.color, fontWeight:700}}>{m.icon} {m.short}</span>
            <span style={{color:"var(--mu)"}}> · {spec}</span>
          </div>;
        })}
        {activeIds.length === 0 && <span style={{fontSize:9, color:"var(--red)"}}>Active des IAs dans Config</span>}
      </div>

      {/* Input */}
      {!plan && !planning && (
        <>
          <textarea value={task} onChange={e=>setTask(e.target.value)}
            placeholder="Décris ta tâche complexe…&#10;Ex: Lancer une newsletter IA hebdomadaire&#10;Ex: Créer un cours en ligne sur Python pour débutants&#10;Ex: Analyser et améliorer ma stratégie LinkedIn"
            rows={4} style={{width:"100%", background:"var(--s2)", border:"1px solid var(--bd)", borderRadius:8, color:"var(--tx)", fontSize:11, padding:"10px 12px", resize:"vertical", outline:"none", boxSizing:"border-box", marginBottom:10}}/>

          {/* Exemples rapides */}
          <div style={{marginBottom:12}}>
            <div style={{fontSize:8, color:"var(--mu)", fontWeight:700, marginBottom:6}}>EXEMPLES RAPIDES</div>
            <div style={{display:"flex", gap:6, flexWrap:"wrap"}}>
              {[
                "Lancer une newsletter IA hebdomadaire",
                "Créer un tutoriel vidéo sur React",
                "Préparer une présentation business pour investisseurs",
                "Rédiger un plan de formation Python débutants",
                "Analyser et améliorer une stratégie marketing",
              ].map(ex => (
                <button key={ex} onClick={()=>setTask(ex)}
                  style={{padding:"4px 10px", borderRadius:10, border:"1px solid var(--bd)", background:"var(--s1)", color:"var(--mu)", fontSize:8, cursor:"pointer"}}>
                  {ex}
                </button>
              ))}
            </div>
          </div>

          <button onClick={generatePlan} disabled={planning||!task.trim()||activeIds.length<1}
            style={{padding:"9px 22px", background:"rgba(249,115,22,.15)", border:"1px solid rgba(249,115,22,.4)", borderRadius:6, color:"#F97316", fontSize:10, cursor:"pointer", fontWeight:700, fontFamily:"var(--font-mono)"}}>
            🧠 Planifier et router les tâches
          </button>
        </>
      )}

      {planning && (
        <div style={{textAlign:"center", padding:"40px 20px"}}>
          <div style={{fontSize:28, marginBottom:8, display:"inline-block", animation:"spin 1.5s linear infinite"}}>🔀</div>
          <div style={{fontSize:11, color:"var(--mu)"}}>Analyse de la tâche et création du plan d'exécution…</div>
        </div>
      )}

      {/* Plan d'exécution */}
      {plan && (
        <div style={{marginBottom:16}}>
          {/* Tâche + actions */}
          <div style={{display:"flex", alignItems:"flex-start", gap:10, marginBottom:12, padding:"10px 14px", background:"var(--s1)", border:"1px solid rgba(249,115,22,.3)", borderRadius:8, flexWrap:"wrap"}}>
            <div style={{flex:1}}>
              <div style={{fontSize:8, color:"#F97316", fontWeight:700, marginBottom:2}}>TÂCHE PRINCIPALE</div>
              <div style={{fontSize:11, color:"var(--tx)", fontWeight:600}}>{task}</div>
              <div style={{fontSize:8, color:"var(--mu)", marginTop:3}}>{plan.length} sous-tâches · {activeIds.length} IAs disponibles</div>
            </div>
            <div style={{display:"flex", gap:6, flexShrink:0}}>
              <button onClick={()=>{setPlan(null);setResults([]);setAssembly("");}}
                style={{fontSize:8, padding:"4px 10px", background:"transparent", border:"1px solid var(--bd)", borderRadius:5, color:"var(--mu)", cursor:"pointer"}}>
                ✕ Recréer
              </button>
              {!running && results.length === 0 && (
                <button onClick={runPlan}
                  style={{fontSize:9, padding:"6px 16px", background:"rgba(249,115,22,.15)", border:"1px solid rgba(249,115,22,.4)", borderRadius:5, color:"#F97316", cursor:"pointer", fontWeight:700}}>
                  ▶ Exécuter le plan
                </button>
              )}
            </div>
          </div>

          {/* Étapes avec pipeline visuel */}
          <div style={{position:"relative"}}>
            <div style={{position:"absolute", left:19, top:0, bottom:0, width:2, background:"linear-gradient(to bottom,#F97316,#A78BFA,#34D399)", borderRadius:2, zIndex:0}}/>
            {plan.map((step, i) => {
              const m = MODEL_DEFS[step.ia];
              const type = typeInfo(step.type);
              const isDone = step.status === "done";
              const isRunning = step.status === "running";
              return (
                <div key={step.id} style={{display:"flex", gap:12, alignItems:"flex-start", marginBottom:10, position:"relative", zIndex:1}}>
                  {/* Numéro step */}
                  <div style={{width:38, height:38, borderRadius:"50%", background:"var(--bg)", border:"2px solid "+(isDone?"var(--green)":isRunning?"var(--ac)":"var(--bd)"), display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:isRunning?16:12, color:statusColor(step.status), fontWeight:700, transition:"all .3s"}}>
                    {isRunning ? <span style={{animation:"spin 1s linear infinite", display:"inline-block"}}>⟳</span> : isDone ? "✓" : i+1}
                  </div>
                  {/* Contenu */}
                  <div style={{flex:1, background:"var(--s1)", border:"1px solid "+(isDone?"var(--green)33":isRunning?"rgba(212,168,83,.3)":"var(--bd)"), borderRadius:10, padding:"10px 14px", marginBottom:2, transition:"border-color .3s"}}>
                    <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:4, flexWrap:"wrap"}}>
                      <span style={{fontSize:9, fontWeight:700, color:type.color, padding:"2px 6px", background:type.color+"18", borderRadius:6}}>{type.label}</span>
                      <span style={{fontSize:10, fontWeight:700, color:"var(--tx)", flex:1}}>{step.title}</span>
                      {m && <span style={{fontSize:8, color:m.color, fontWeight:600, display:"flex", alignItems:"center", gap:3}}>{m.icon} {m.short}</span>}
                      {step.duration && <span style={{fontSize:7, color:"var(--mu)", fontFamily:"var(--font-mono)"}}>{step.duration}s</span>}
                    </div>
                    {step.rationale && <div style={{fontSize:8, color:"var(--mu)", marginBottom:step.output?6:0, fontStyle:"italic"}}>{step.rationale}</div>}
                    {step.output && isDone && (
                      <div style={{fontSize:9, color:"var(--tx)", lineHeight:1.6, maxHeight:120, overflow:"auto", paddingTop:6, borderTop:"1px solid var(--bd)"}}>
                        {step.output.slice(0,400)}{step.output.length>400?"…":""}
                      </div>
                    )}
                    {step.output && step.status==="error" && (
                      <div style={{fontSize:9, color:"var(--red)", paddingTop:4}}>{step.output}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Assemblage */}
          {results.filter(r=>r.status==="done").length >= 2 && !running && (
            <div style={{marginTop:16, background:"var(--s1)", border:"1px solid rgba(52,211,153,.25)", borderRadius:10, padding:"14px 16px"}}>
              {!assembly && !assembling && (
                <button onClick={assembleResults}
                  style={{padding:"8px 20px", background:"rgba(52,211,153,.12)", border:"1px solid rgba(52,211,153,.35)", borderRadius:6, color:"var(--green)", fontSize:10, cursor:"pointer", fontWeight:700}}>
                  ✨ Assembler le livrable final
                </button>
              )}
              {assembling && <div style={{fontSize:10, color:"var(--mu)"}}>⏳ Assemblage en cours…</div>}
              {assembly && (
                <>
                  <div style={{fontSize:9, color:"var(--green)", fontWeight:700, marginBottom:10}}>✨ LIVRABLE FINAL</div>
                  <div style={{fontSize:10, color:"var(--tx)", lineHeight:1.8, whiteSpace:"pre-wrap"}}>{assembly}</div>
                  <div style={{display:"flex", gap:8, marginTop:12}}>
                    <button onClick={()=>navigator.clipboard.writeText(assembly)}
                      style={{fontSize:9, padding:"5px 12px", background:"transparent", border:"1px solid var(--bd)", borderRadius:5, color:"var(--mu)", cursor:"pointer"}}>📋 Copier</button>
                    <button onClick={()=>{setChatInput(assembly); navigateTab("chat");}}
                      style={{fontSize:9, padding:"5px 12px", background:"rgba(212,168,83,.1)", border:"1px solid rgba(212,168,83,.3)", borderRadius:5, color:"var(--ac)", cursor:"pointer"}}>→ Continuer dans le Chat</button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ╔══════════════════════════════════════════════════════════════╗
// ║  IA JOURNALISTE — Rapport de recherche multi-angles          ║
// ╚══════════════════════════════════════════════════════════════╝
function JournalisteTab({ enabled, apiKeys }) {
  const [subject, setSubject] = React.useState("");
  const [depth, setDepth] = React.useState("standard"); // rapide|standard|approfondi
  const [angles, setAngles] = React.useState([]);
  const [report, setReport] = React.useState(null);
  const [running, setRunning] = React.useState(false);
  const [phase, setPhase] = React.useState("idle"); // idle|planning|researching|writing|done

  const activeIds = Object.keys(MODEL_DEFS).filter(id => enabled[id] && !MODEL_DEFS[id]?.serial);
  const SAVED_KEY = "multiia_journalist_reports";
  const [savedReports, setSavedReports] = React.useState(() => { try { return JSON.parse(localStorage.getItem(SAVED_KEY)||"[]"); } catch { return []; } });
  const [viewReport, setViewReport] = React.useState(null);

  const ANGLES_PRESETS = {
    rapide:    ["📰 Faits essentiels", "🔍 Analyse critique", "🎯 Conclusions pratiques"],
    standard:  ["📰 Actualité & contexte", "📊 Données & chiffres", "🔍 Analyse experte", "🎯 Impact pratique", "🔮 Perspectives"],
    approfondi:["📰 Contexte historique", "📊 Données & sources", "🔍 Angles contradictoires", "🌍 Dimension internationale", "⚖️ Enjeux éthiques", "🎯 Applications concrètes", "🔮 Scénarios futurs"],
  };

  const QUICK_SUBJECTS = [
    "L'impact de l'IA générative sur l'emploi en 2026",
    "DeepSeek vs GPT-4 : qui domine vraiment ?",
    "Faut-il réguler les LLMs open source ?",
    "L'IA dans la santé : promesses et dangers",
    "Le marché des agents IA autonomes en 2026",
    "Mistral AI : l'espoir européen face à OpenAI",
  ];

  const generateReport = async () => {
    if (!subject.trim() || !activeIds.length) return;
    setRunning(true); setReport(null); setPhase("planning");
    const selectedAngles = ANGLES_PRESETS[depth];
    const numAngles = selectedAngles.length;
    const results = [];

    // Phase 1 : Chaque IA couvre un angle différent en parallèle
    setPhase("researching");
    await Promise.all(selectedAngles.map(async (angle, i) => {
      const iaId = activeIds[i % activeIds.length];
      const prompt = `Tu es un journaliste expert. Rédige une section d'article sur : "${subject}"
      
ANGLE ASSIGNÉ : ${angle}

Règles :
- 200-350 mots maximum
- Commence directement par le contenu (pas d'intro type "Dans cette section...")
- Inclus des faits concrets, des chiffres ou des exemples précis si possible
- Sois percutant et informatif
- Termine par 1 phrase de transition vers la suite`;

      try {
        const output = await callModel(iaId, [{role:"user", content:prompt}], apiKeys,
          `Tu es un journaliste expert spécialisé en ${angle.replace(/[^a-zA-ZÀ-ÿ\s]/g,"")}. Réponds directement avec le contenu.`
        );
        results[i] = { angle, iaId, output, ok:true };
      } catch(e) {
        results[i] = { angle, iaId, output:`⚠️ Erreur : ${e.message}`, ok:false };
      }
    }));

    // Phase 2 : IA rédactrice en chef assemble le rapport final
    setPhase("writing");
    const redacIa = activeIds.find(id => ["mistral","poll_claude","sambanova","groq"].includes(id)) || activeIds[0];
    const sections = results.map((r,i) => `### ${r.angle}\n${r.output}`).join("\n\n");

    const assemblPrompt = `Tu es rédacteur en chef. Voici les sections rédigées par différents journalistes sur : "${subject}"

${sections}

Assemble ces sections en un rapport journalistique cohérent et professionnel :
1. Ajoute un **titre accrocheur**
2. Écris un **chapeau** (2-3 phrases d'intro percutantes)
3. Intègre les sections en fluidifiant les transitions
4. Ajoute une **conclusion** avec les 3 points à retenir
5. Génère 3 **questions ouvertes** pour approfondir le sujet

Format Markdown propre.`;

    let finalReport = "";
    try {
      finalReport = await callModel(redacIa, [{role:"user", content:assemblPrompt}], apiKeys,
        "Tu es rédacteur en chef senior. Tu produis des rapports journalistiques clairs et percutants."
      );
    } catch(e) {
      finalReport = sections;
    }

    const reportObj = {
      id: Date.now().toString(),
      subject,
      depth,
      angles: selectedAngles,
      sections: results,
      finalReport,
      redacIa,
      date: new Date().toISOString(),
      ias: [...new Set(results.map(r=>r.iaId))],
    };

    setReport(reportObj);
    const updated = [reportObj, ...savedReports].slice(0, 10);
    setSavedReports(updated);
    try { localStorage.setItem(SAVED_KEY, JSON.stringify(updated)); } catch {}
    setPhase("done");
    setRunning(false);
  };

  const DEPTH_OPTIONS = [
    { id:"rapide",     label:"⚡ Flash",      desc:"3 angles · ~1 min", color:"#4ADE80" },
    { id:"standard",   label:"📰 Standard",   desc:"5 angles · ~2 min", color:"#60A5FA" },
    { id:"approfondi", label:"🔬 Approfondi", desc:"7 angles · ~4 min", color:"#A78BFA" },
  ];

  const PHASE_LABELS = {
    planning:"🧠 Analyse du sujet…", researching:"📰 Journalistes en cours…", writing:"✍️ Rédaction du rapport final…"
  };

  return (
    <div style={{flex:1,display:"flex",overflow:"hidden"}}>
      {/* Sidebar rapports sauvegardés */}
      {savedReports.length > 0 && (
        <div style={{width:180,flexShrink:0,borderRight:"1px solid var(--bd)",display:"flex",flexDirection:"column",overflow:"hidden",background:"var(--s1)"}}>
          <div style={{padding:"10px 12px",borderBottom:"1px solid var(--bd)",fontSize:8,color:"var(--mu)",fontWeight:700}}>RAPPORTS SAUVEGARDÉS</div>
          <div style={{flex:1,overflow:"auto"}}>
            {savedReports.map(r=>(
              <div key={r.id} onClick={()=>setViewReport(r.id===viewReport?null:r.id)}
                style={{padding:"8px 12px",cursor:"pointer",borderBottom:"1px solid var(--bd)",background:viewReport===r.id?"rgba(212,168,83,.08)":"transparent",borderLeft:"3px solid "+(viewReport===r.id?"var(--ac)":"transparent")}}>
                <div style={{fontSize:9,fontWeight:600,color:viewReport===r.id?"var(--ac)":"var(--tx)",lineHeight:1.3,marginBottom:2}}>{r.subject.slice(0,45)}{r.subject.length>45?"…":""}</div>
                <div style={{fontSize:7,color:"var(--mu)"}}>{new Date(r.date).toLocaleDateString("fr-FR")} · {r.angles.length} angles</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main */}
      <div style={{flex:1,overflow:"auto",padding:"clamp(10px,2vw,16px)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6,flexWrap:"wrap"}}>
          <div style={{fontFamily:"var(--font-display)",fontWeight:800,fontSize:"clamp(14px,2.5vw,18px)",color:"#60A5FA"}}>📰 IA Journaliste</div>
          <div style={{fontSize:9,color:"var(--mu)"}}>— Rapport complet multi-angles généré par tes IAs en équipe</div>
        </div>
        <div style={{fontSize:9,color:"var(--mu)",marginBottom:14,padding:"8px 12px",background:"rgba(96,165,250,.06)",border:"1px solid rgba(96,165,250,.15)",borderRadius:6}}>
          Chaque IA couvre un angle différent (faits, données, analyse, impact…) en parallèle. Une IA rédactrice en chef assemble le tout en un rapport professionnel.
        </div>

        {/* Rapport sauvegardé affiché */}
        {viewReport && (() => {
          const r = savedReports.find(x=>x.id===viewReport);
          if (!r) return null;
          return (
            <div>
              <div style={{display:"flex",gap:8,marginBottom:12,alignItems:"center"}}>
                <button onClick={()=>setViewReport(null)} style={{fontSize:9,padding:"4px 10px",background:"transparent",border:"1px solid var(--bd)",borderRadius:5,color:"var(--mu)",cursor:"pointer"}}>← Retour</button>
                <button onClick={()=>navigator.clipboard.writeText(r.finalReport)} style={{fontSize:9,padding:"4px 10px",background:"rgba(212,168,83,.1)",border:"1px solid rgba(212,168,83,.3)",borderRadius:5,color:"var(--ac)",cursor:"pointer"}}>📋 Copier</button>
                <button onClick={()=>{setSavedReports(prev=>{const u=prev.filter(x=>x.id!==viewReport);try{localStorage.setItem(SAVED_KEY,JSON.stringify(u));}catch{}return u;});setViewReport(null);}} style={{fontSize:9,padding:"4px 10px",background:"rgba(248,113,113,.1)",border:"1px solid rgba(248,113,113,.3)",borderRadius:5,color:"var(--red)",cursor:"pointer"}}>🗑</button>
              </div>
              <div style={{background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:10,padding:"16px",fontSize:10,lineHeight:1.8,color:"var(--tx)",whiteSpace:"pre-wrap"}}>{r.finalReport}</div>
            </div>
          );
        })()}

        {/* Formulaire */}
        {!viewReport && !running && !report && (
          <>
            <textarea value={subject} onChange={e=>setSubject(e.target.value)}
              placeholder="Sur quel sujet veux-tu un rapport complet ?"
              rows={3} style={{width:"100%",background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:8,color:"var(--tx)",fontSize:11,padding:"10px 12px",resize:"vertical",outline:"none",boxSizing:"border-box",marginBottom:10}}/>

            {/* Exemples */}
            <div style={{marginBottom:12}}>
              <div style={{fontSize:8,color:"var(--mu)",fontWeight:700,marginBottom:6}}>SUJETS POPULAIRES</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {QUICK_SUBJECTS.map(s=>(
                  <button key={s} onClick={()=>setSubject(s)}
                    style={{padding:"4px 10px",borderRadius:10,border:"1px solid var(--bd)",background:"var(--s1)",color:"var(--mu)",fontSize:8,cursor:"pointer"}}>
                    {s.slice(0,40)}{s.length>40?"…":""}
                  </button>
                ))}
              </div>
            </div>

            {/* Profondeur */}
            <div style={{marginBottom:14}}>
              <div style={{fontSize:8,color:"var(--mu)",fontWeight:700,marginBottom:6}}>PROFONDEUR D'ANALYSE</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {DEPTH_OPTIONS.map(d=>(
                  <button key={d.id} onClick={()=>setDepth(d.id)}
                    style={{flex:1,minWidth:100,padding:"10px 12px",borderRadius:8,border:"2px solid "+(depth===d.id?d.color:"var(--bd)"),background:depth===d.id?d.color+"15":"transparent",cursor:"pointer",textAlign:"center",transition:"all .15s"}}>
                    <div style={{fontSize:11,fontWeight:700,color:depth===d.id?d.color:"var(--tx)"}}>{d.label}</div>
                    <div style={{fontSize:8,color:"var(--mu)",marginTop:2}}>{d.desc}</div>
                    <div style={{marginTop:6,display:"flex",gap:3,justifyContent:"center"}}>
                      {ANGLES_PRESETS[d.id].map((a,i)=>(
                        <div key={i} style={{width:6,height:6,borderRadius:"50%",background:depth===d.id?d.color:"var(--bd)"}}/>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* IAs assignées */}
            <div style={{marginBottom:14,background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:8,padding:"10px 12px"}}>
              <div style={{fontSize:8,color:"var(--mu)",fontWeight:700,marginBottom:6}}>IAs ASSIGNÉES AUX ANGLES</div>
              <div style={{display:"flex",flexDirection:"column",gap:4}}>
                {ANGLES_PRESETS[depth].map((angle,i)=>{
                  const iaId = activeIds[i%activeIds.length];
                  const m = iaId ? MODEL_DEFS[iaId] : null;
                  return (
                    <div key={i} style={{display:"flex",alignItems:"center",gap:8,fontSize:9}}>
                      <span style={{width:160,color:"var(--tx)"}}>{angle}</span>
                      <span style={{color:"var(--bd)"}}>→</span>
                      {m ? <span style={{color:m.color,fontWeight:700}}>{m.icon} {m.short}</span> : <span style={{color:"var(--red)"}}>Aucune IA active</span>}
                    </div>
                  );
                })}
              </div>
            </div>

            <button onClick={generateReport} disabled={!subject.trim()||!activeIds.length}
              style={{padding:"10px 24px",background:"rgba(96,165,250,.15)",border:"1px solid rgba(96,165,250,.4)",borderRadius:6,color:"#60A5FA",fontSize:11,cursor:"pointer",fontWeight:700,fontFamily:"var(--font-mono)"}}>
              📰 Lancer la rédaction en équipe
            </button>
          </>
        )}

        {/* Loading */}
        {running && (
          <div style={{textAlign:"center",padding:"50px 20px"}}>
            <div style={{fontSize:32,marginBottom:12,display:"inline-block",animation:"spin 2s linear infinite"}}>📰</div>
            <div style={{fontSize:13,fontWeight:700,color:"var(--tx)",marginBottom:6}}>{PHASE_LABELS[phase]}</div>
            <div style={{display:"flex",gap:6,justifyContent:"center",flexWrap:"wrap",marginTop:12}}>
              {ANGLES_PRESETS[depth].map((a,i)=>(
                <div key={i} style={{fontSize:8,padding:"4px 10px",borderRadius:8,background:"var(--s1)",border:"1px solid var(--bd)",color:"var(--mu)"}}>{a}</div>
              ))}
            </div>
          </div>
        )}

        {/* Rapport généré */}
        {report && !running && !viewReport && (
          <div>
            <div style={{display:"flex",gap:8,marginBottom:12,alignItems:"center",flexWrap:"wrap"}}>
              <div style={{fontSize:9,color:"var(--mu)"}}>
                {report.ias.map(id=>MODEL_DEFS[id]?.icon+""+MODEL_DEFS[id]?.short).join(" · ")}
                <span style={{marginLeft:6}}>· {report.angles.length} angles couverts</span>
              </div>
              <div style={{marginLeft:"auto",display:"flex",gap:6}}>
                <button onClick={()=>navigator.clipboard.writeText(report.finalReport)} style={{fontSize:9,padding:"4px 10px",background:"rgba(212,168,83,.1)",border:"1px solid rgba(212,168,83,.3)",borderRadius:5,color:"var(--ac)",cursor:"pointer"}}>📋 Copier</button>
                <button onClick={()=>{setReport(null);setSubject("");setPhase("idle");}} style={{fontSize:9,padding:"4px 10px",background:"transparent",border:"1px solid var(--bd)",borderRadius:5,color:"var(--mu)",cursor:"pointer"}}>+ Nouveau rapport</button>
              </div>
            </div>
            <div style={{background:"var(--s1)",border:"1px solid rgba(96,165,250,.2)",borderRadius:10,padding:"16px",fontSize:10,lineHeight:1.9,color:"var(--tx)",whiteSpace:"pre-wrap"}}>{report.finalReport}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ╔══════════════════════════════════════════════════════════════╗
// ║  SKILL BUILDER — Crée tes automatisations en langage naturel ║
// ╚══════════════════════════════════════════════════════════════╝
function SkillBuilderTab({ enabled, apiKeys, navigateTab, setChatInput }) {
  const SKILLS_KEY = "multiia_skills";
  const [skills, setSkills] = React.useState(() => { try { return JSON.parse(localStorage.getItem(SKILLS_KEY)||"[]"); } catch { return []; } });
  const [creating, setCreating] = React.useState(false);
  const [description, setDescription] = React.useState("");
  const [generating, setGenerating] = React.useState(false);
  const [draft, setDraft] = React.useState(null);
  const [selected, setSelected] = React.useState(null);
  const [running, setRunning] = React.useState({});
  const [outputs, setOutputs] = React.useState({});

  const activeIds = Object.keys(MODEL_DEFS).filter(id => enabled[id] && !MODEL_DEFS[id]?.serial);
  const bestIA = activeIds.find(id=>["groq","mistral","sambanova"].includes(id)) || activeIds[0];

  const saveSkills = (s) => { setSkills(s); try { localStorage.setItem(SKILLS_KEY, JSON.stringify(s)); } catch {} };

  const SKILL_TEMPLATES = [
    { desc:"Chaque matin, génère-moi 3 idées de posts LinkedIn sur les actualités IA" },
    { desc:"Analyse n'importe quel texte que je colle et donne-moi ses points forts et faiblesses" },
    { desc:"Quand je colle une URL d'article, fais-en un résumé en 5 points avec une opinion critique" },
    { desc:"Transforme n'importe quelle idée brute en plan de projet structuré en 5 étapes" },
    { desc:"Lis mon texte et réécris-le dans un style professionnel adapté à LinkedIn" },
    { desc:"Prends n'importe quelle question technique et explique-la avec une analogie du quotidien" },
  ];

  const generateSkill = async () => {
    if (!description.trim() || !bestIA) return;
    setGenerating(true); setDraft(null);

    const prompt = `Tu es un expert en prompt engineering et automatisation IA. L'utilisateur veut créer ce skill automatisé :
"${description}"

Génère la configuration complète de ce skill. Réponds UNIQUEMENT en JSON valide :
{
  "name": "Nom court du skill (3-5 mots)",
  "icon": "emoji représentatif",
  "description": "Ce que fait ce skill en 1 phrase",
  "category": "Productivité|Rédaction|Analyse|Code|Créatif|Recherche",
  "color": "#hexcolor",
  "trigger": "Manuel|Auto-matin|Auto-soir|Sur texte collé",
  "inputLabel": "Ce que l'utilisateur doit fournir (ex: Ton texte à analyser)",
  "inputPlaceholder": "Exemple de ce qu'on peut coller ici",
  "needsInput": true,
  "systemPrompt": "Le system prompt complet pour ce skill (role, ton, règles)",
  "userPromptTemplate": "Le template de prompt avec {{input}} pour le contenu de l'utilisateur",
  "outputFormat": "Texte|Liste|JSON|Markdown|Tableau",
  "estimatedTime": "~10s|~30s|~1min",
  "tips": ["Conseil d'utilisation 1", "Conseil d'utilisation 2"]
}`;

    try {
      const reply = await callModel(bestIA, [{role:"user",content:prompt}], apiKeys, "Expert prompt engineering. JSON uniquement, sans markdown.");
      const clean = reply.replace(/```json|```/g,"").trim();
      const data = JSON.parse(clean.match(/\{[\s\S]*\}/)?.[0]||clean);
      setDraft({ ...data, id:Date.now().toString(), createdAt:new Date().toISOString(), uses:0 });
    } catch(e) {
      alert("Erreur : "+e.message);
    }
    setGenerating(false);
  };

  const saveSkill = () => {
    if (!draft) return;
    const updated = [draft, ...skills];
    saveSkills(updated);
    setSelected(draft.id);
    setDraft(null); setCreating(false); setDescription("");
  };

  const runSkill = async (skill, userInput="") => {
    if (!activeIds.length) return;
    const ia = activeIds.find(id=>["groq","mistral","cerebras"].includes(id)) || activeIds[0];
    setRunning(prev=>({...prev,[skill.id]:true}));
    setOutputs(prev=>({...prev,[skill.id]:""}));
    try {
      const prompt = skill.needsInput
        ? skill.userPromptTemplate.replace("{{input}}", userInput || "[Aucune entrée fournie]")
        : skill.userPromptTemplate;
      const output = await callModel(ia, [{role:"user",content:prompt}], apiKeys, skill.systemPrompt);
      setOutputs(prev=>({...prev,[skill.id]:output}));
      // Incrémenter les uses
      saveSkills(skills.map(s => s.id===skill.id ? {...s, uses:(s.uses||0)+1} : s));
    } catch(e) {
      setOutputs(prev=>({...prev,[skill.id]:"❌ "+e.message}));
    }
    setRunning(prev=>({...prev,[skill.id]:false}));
  };

  const deleteSkill = (id) => {
    saveSkills(skills.filter(s=>s.id!==id));
    if (selected===id) setSelected(null);
  };

  const CATS = ["Tout", ...new Set(skills.map(s=>s.category||"Autre"))];
  const [catFilter, setCatFilter] = React.useState("Tout");
  const [userInputs, setUserInputs] = React.useState({});
  const filteredSkills = catFilter==="Tout" ? skills : skills.filter(s=>s.category===catFilter);
  const sel = skills.find(s=>s.id===selected);

  return (
    <div style={{flex:1,display:"flex",overflow:"hidden"}}>
      {/* Sidebar */}
      <div style={{width:200,flexShrink:0,borderRight:"1px solid var(--bd)",display:"flex",flexDirection:"column",overflow:"hidden",background:"var(--s1)"}}>
        <div style={{padding:"10px 12px",borderBottom:"1px solid var(--bd)"}}>
          <div style={{fontFamily:"var(--font-display)",fontWeight:800,fontSize:12,color:"var(--ac)",marginBottom:8}}>🛠 Mes Skills</div>
          <button onClick={()=>{setCreating(true);setSelected(null);setDraft(null);}}
            style={{width:"100%",padding:"6px",background:"rgba(212,168,83,.15)",border:"1px solid rgba(212,168,83,.4)",borderRadius:5,color:"var(--ac)",fontSize:9,cursor:"pointer",fontWeight:700}}>
            + Créer un skill
          </button>
        </div>
        {/* Filtre catégories */}
        {CATS.length > 1 && (
          <div style={{padding:"6px 8px",borderBottom:"1px solid var(--bd)",display:"flex",gap:3,flexWrap:"wrap"}}>
            {CATS.map(c=>(
              <button key={c} onClick={()=>setCatFilter(c)}
                style={{padding:"2px 6px",borderRadius:6,border:"1px solid "+(catFilter===c?"var(--ac)":"transparent"),background:catFilter===c?"rgba(212,168,83,.12)":"transparent",color:catFilter===c?"var(--ac)":"var(--mu)",fontSize:7,cursor:"pointer"}}>
                {c}
              </button>
            ))}
          </div>
        )}
        <div style={{flex:1,overflow:"auto"}}>
          {filteredSkills.length===0 && <div style={{padding:16,fontSize:9,color:"var(--mu)",textAlign:"center"}}>Aucun skill.<br/>Crée le tien !</div>}
          {filteredSkills.map(s=>(
            <div key={s.id} onClick={()=>{setSelected(s.id);setCreating(false);}}
              style={{padding:"9px 12px",cursor:"pointer",borderBottom:"1px solid var(--bd)",background:selected===s.id?"rgba(212,168,83,.08)":"transparent",borderLeft:"3px solid "+(selected===s.id?s.color||"var(--ac)":"transparent")}}>
              <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:2}}>
                <span style={{fontSize:12}}>{s.icon}</span>
                <span style={{fontSize:9,fontWeight:600,color:selected===s.id?"var(--ac)":"var(--tx)",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.name}</span>
              </div>
              <div style={{fontSize:7,color:"var(--mu)"}}>{s.category||"Général"} · ×{s.uses||0}</div>
            </div>
          ))}
        </div>
        {skills.length>0 && (
          <div style={{padding:"6px 12px",borderTop:"1px solid var(--bd)",fontSize:7,color:"var(--mu)"}}>
            {skills.length} skills · {skills.reduce((a,s)=>a+(s.uses||0),0)} utilisations
          </div>
        )}
      </div>

      {/* Main */}
      <div style={{flex:1,overflow:"auto",padding:"14px 16px"}}>

        {/* Créer */}
        {creating && (
          <div style={{maxWidth:580}}>
            <div style={{fontFamily:"var(--font-display)",fontWeight:800,fontSize:14,color:"var(--ac)",marginBottom:14}}>🆕 Nouveau Skill</div>
            <div style={{fontSize:9,color:"var(--mu)",marginBottom:10,padding:"8px 12px",background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:6}}>
              Décris ce que tu veux automatiser en langage naturel. L'IA génère automatiquement le prompt, les paramètres et la configuration.
            </div>

            {/* Templates */}
            <div style={{marginBottom:12}}>
              <div style={{fontSize:8,color:"var(--mu)",fontWeight:700,marginBottom:6}}>EXEMPLES D'AUTOMATISATIONS</div>
              <div style={{display:"flex",flexDirection:"column",gap:4}}>
                {SKILL_TEMPLATES.map((t,i)=>(
                  <button key={i} onClick={()=>setDescription(t.desc)}
                    style={{padding:"6px 10px",textAlign:"left",background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:6,color:"var(--mu)",fontSize:9,cursor:"pointer",lineHeight:1.4}}>
                    → {t.desc}
                  </button>
                ))}
              </div>
            </div>

            <textarea value={description} onChange={e=>setDescription(e.target.value)}
              placeholder="Décris ton automatisation en langage naturel…"
              rows={4} style={{width:"100%",background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:6,color:"var(--tx)",fontSize:11,padding:"9px 12px",resize:"vertical",outline:"none",boxSizing:"border-box",marginBottom:10}}/>

            {!draft && (
              <button onClick={generateSkill} disabled={generating||!description.trim()||!bestIA}
                style={{padding:"8px 20px",background:"rgba(212,168,83,.15)",border:"1px solid rgba(212,168,83,.4)",borderRadius:6,color:"var(--ac)",fontSize:10,cursor:"pointer",fontWeight:700}}>
                {generating?"⏳ Génération…":"✨ Générer le skill"}
              </button>
            )}

            {/* Aperçu du draft */}
            {draft && (
              <div style={{marginTop:12,background:"var(--s1)",border:"1px solid rgba(74,222,128,.3)",borderRadius:10,padding:"14px 16px"}}>
                <div style={{fontSize:9,color:"var(--green)",fontWeight:700,marginBottom:10}}>✓ Skill généré — Aperçu</div>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                  <span style={{fontSize:24}}>{draft.icon}</span>
                  <div>
                    <div style={{fontWeight:700,fontSize:13,color:"var(--tx)"}}>{draft.name}</div>
                    <div style={{fontSize:9,color:"var(--mu)"}}>{draft.category} · {draft.trigger} · {draft.estimatedTime}</div>
                  </div>
                </div>
                <div style={{fontSize:9,color:"var(--tx)",marginBottom:8,lineHeight:1.5}}>{draft.description}</div>
                <div style={{fontSize:8,color:"var(--mu)",marginBottom:4,fontWeight:700}}>PROMPT SYSTÈME</div>
                <div style={{fontSize:9,color:"var(--mu)",background:"var(--s2)",borderRadius:5,padding:"6px 10px",marginBottom:10,lineHeight:1.5}}>{draft.systemPrompt?.slice(0,150)}…</div>
                {draft.tips?.length>0 && (
                  <div style={{fontSize:8,color:"var(--ac)",marginBottom:10}}>
                    {draft.tips.map((t,i)=><div key={i}>💡 {t}</div>)}
                  </div>
                )}
                <div style={{display:"flex",gap:8}}>
                  <button onClick={saveSkill}
                    style={{padding:"7px 18px",background:"rgba(74,222,128,.12)",border:"1px solid rgba(74,222,128,.3)",borderRadius:5,color:"var(--green)",fontSize:10,cursor:"pointer",fontWeight:700}}>
                    💾 Sauvegarder ce skill
                  </button>
                  <button onClick={()=>setDraft(null)}
                    style={{padding:"7px 12px",background:"transparent",border:"1px solid var(--bd)",borderRadius:5,color:"var(--mu)",fontSize:9,cursor:"pointer"}}>Regénérer</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Skill sélectionné */}
        {sel && !creating && (() => {
          const skillOutput = outputs[sel.id];
          const isRunning = running[sel.id];
          const userInput = userInputs[sel.id]||"";
          return (
            <div>
              {/* Header */}
              <div style={{display:"flex",alignItems:"flex-start",gap:12,marginBottom:14,flexWrap:"wrap"}}>
                <span style={{fontSize:32}}>{sel.icon}</span>
                <div style={{flex:1}}>
                  <div style={{fontFamily:"var(--font-display)",fontWeight:800,fontSize:16,color:sel.color||"var(--ac)",marginBottom:2}}>{sel.name}</div>
                  <div style={{fontSize:9,color:"var(--mu)",marginBottom:4}}>{sel.category} · {sel.trigger} · {sel.estimatedTime} · ×{sel.uses||0} utilisation{sel.uses!==1?"s":""}</div>
                  <div style={{fontSize:10,color:"var(--tx)"}}>{sel.description}</div>
                </div>
                <button onClick={()=>deleteSkill(sel.id)} style={{fontSize:9,padding:"4px 10px",background:"rgba(248,113,113,.1)",border:"1px solid rgba(248,113,113,.3)",borderRadius:5,color:"var(--red)",cursor:"pointer"}}>🗑</button>
              </div>

              {/* Input utilisateur */}
              {sel.needsInput && (
                <div style={{marginBottom:12}}>
                  <div style={{fontSize:8,color:"var(--mu)",fontWeight:700,marginBottom:5}}>{sel.inputLabel||"ENTRÉE"}</div>
                  <textarea value={userInput} onChange={e=>setUserInputs(prev=>({...prev,[sel.id]:e.target.value}))}
                    placeholder={sel.inputPlaceholder||"Colle ton contenu ici…"}
                    rows={4} style={{width:"100%",background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:6,color:"var(--tx)",fontSize:10,padding:"8px 10px",resize:"vertical",outline:"none",boxSizing:"border-box"}}/>
                </div>
              )}

              <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
                <button onClick={()=>runSkill(sel, userInput)} disabled={isRunning||(sel.needsInput&&!userInput.trim())}
                  style={{padding:"8px 20px",background:isRunning?"var(--s2)":`${sel.color||"#D4A853"}22`,border:`1px solid ${sel.color||"var(--ac)"}66`,borderRadius:6,color:isRunning?"var(--mu)":(sel.color||"var(--ac)"),fontSize:10,cursor:isRunning?"default":"pointer",fontWeight:700}}>
                  {isRunning?"⏳ Exécution…":`${sel.icon} Exécuter`}
                </button>
              </div>

              {/* Résultat */}
              {skillOutput && (
                <div style={{background:"var(--s1)",border:`1px solid ${sel.color||"var(--ac)"}33`,borderRadius:10,padding:"14px 16px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                    <div style={{fontSize:9,color:sel.color||"var(--ac)",fontWeight:700}}>RÉSULTAT</div>
                    <button onClick={()=>navigator.clipboard.writeText(skillOutput)} style={{fontSize:8,padding:"2px 8px",background:"rgba(212,168,83,.1)",border:"1px solid rgba(212,168,83,.3)",borderRadius:4,color:"var(--ac)",cursor:"pointer"}}>📋</button>
                    <button onClick={()=>{setChatInput(skillOutput);navigateTab("chat");}} style={{fontSize:8,padding:"2px 8px",background:"transparent",border:"1px solid var(--bd)",borderRadius:4,color:"var(--mu)",cursor:"pointer"}}>→ Chat</button>
                  </div>
                  <div style={{fontSize:10,color:"var(--tx)",lineHeight:1.8,whiteSpace:"pre-wrap"}}>{skillOutput}</div>
                </div>
              )}

              {/* Conseils */}
              {sel.tips?.length>0 && !skillOutput && (
                <div style={{marginTop:10,padding:"10px 12px",background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:8}}>
                  <div style={{fontSize:8,color:"var(--mu)",fontWeight:700,marginBottom:5}}>CONSEILS D'UTILISATION</div>
                  {sel.tips.map((t,i)=><div key={i} style={{fontSize:9,color:"var(--tx)",marginBottom:3}}>💡 {t}</div>)}
                </div>
              )}
            </div>
          );
        })()}

        {!creating && !sel && (
          <div style={{textAlign:"center",padding:"50px 20px"}}>
            <div style={{fontSize:40,marginBottom:10}}>🛠</div>
            <div style={{fontSize:13,fontWeight:700,color:"var(--tx)",marginBottom:6}}>Skill Builder</div>
            <div style={{fontSize:10,color:"var(--mu)",marginBottom:20,maxWidth:360,margin:"0 auto 20px"}}>Crée des automatisations IA personnalisées en décrivant ce que tu veux en langage naturel. L'IA génère le prompt parfait.</div>
            <button onClick={()=>setCreating(true)} style={{padding:"10px 24px",background:"rgba(212,168,83,.15)",border:"1px solid rgba(212,168,83,.4)",borderRadius:8,color:"var(--ac)",fontSize:11,cursor:"pointer",fontWeight:700}}>
              ✨ Créer mon premier skill
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ╔══════════════════════════════════════════════════════════════╗
// ║  CONTRADICTION DETECTOR — Scan de contradictions & biais     ║
// ╚══════════════════════════════════════════════════════════════╝
function ContradictionTab({ enabled, apiKeys, conversations }) {
  const [textA, setTextA] = React.useState("");
  const [textB, setTextB] = React.useState("");
  const [labelA, setLabelA] = React.useState("Texte A");
  const [labelB, setLabelB] = React.useState("Texte B");
  const [result, setResult] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [mode, setMode] = React.useState("compare"); // compare|single

  const activeIds = Object.keys(MODEL_DEFS).filter(id => enabled[id] && !MODEL_DEFS[id]?.serial);
  const judge = activeIds.find(id=>["sambanova","mistral","groq","poll_claude"].includes(id)) || activeIds[0];

  // Pré-remplir depuis les réponses du chat
  const lastResponses = React.useMemo(() => {
    return activeIds.map(id => {
      const msgs = conversations[id]||[];
      const last = [...msgs].reverse().find(m=>m.role==="assistant");
      return last ? {id, text:last.content, name:MODEL_DEFS[id]?.short} : null;
    }).filter(Boolean).slice(0,4);
  }, [conversations, activeIds]);

  const analyze = async () => {
    if (mode==="compare" && (!textA.trim()||!textB.trim())) return;
    if (mode==="single" && !textA.trim()) return;
    if (!judge) return;
    setLoading(true); setResult(null);

    const prompt = mode==="compare"
      ? `Tu es un expert en logique, rhétorique et analyse critique. Analyse ces deux textes :

TEXTE A (${labelA}) :
${textA.slice(0,1500)}

TEXTE B (${labelB}) :
${textB.slice(0,1500)}

Identifie toutes les contradictions, désaccords factuels et incohérences logiques entre eux.
Réponds UNIQUEMENT en JSON valide :
{
  "score_coherence": 75,
  "resume": "Résumé de la relation entre les deux textes (2 phrases)",
  "contradictions": [
    {
      "type": "Factuel|Logique|Rhétorique|Nuance",
      "gravite": "haute|moyenne|faible",
      "claim_a": "Ce que dit le texte A",
      "claim_b": "Ce que dit le texte B",
      "explication": "Pourquoi c'est contradictoire",
      "verdict": "A a raison|B a raison|Les deux|Aucun des deux|Contextuel"
    }
  ],
  "points_communs": ["Point sur lequel ils s'accordent"],
  "recommandation": "Que faire face à ces contradictions ?"
}`
      : `Tu es un expert en analyse critique et détection de biais. Analyse ce texte :

${textA.slice(0,2000)}

Effectue une analyse complète : contradictions internes, biais cognitifs, arguments fallacieux.
Réponds UNIQUEMENT en JSON valide :
{
  "score_coherence": 75,
  "resume": "Résumé de la qualité argumentative (2 phrases)",
  "contradictions": [
    {
      "type": "Contradiction interne|Biais cognitif|Argument fallacieux|Généralisation",
      "gravite": "haute|moyenne|faible",
      "passage": "Le passage problématique (courte citation)",
      "explication": "Pourquoi c'est problématique",
      "suggestion": "Comment l'améliorer"
    }
  ],
  "biais_detectes": ["Biais 1", "Biais 2"],
  "points_forts": ["Ce qui est bien argumenté"],
  "recommandation": "Conseil global pour améliorer ce texte"
}`;

    try {
      const reply = await callModel(judge, [{role:"user",content:prompt}], apiKeys, "Expert logique et analyse critique. JSON uniquement, sans markdown.");
      const clean = reply.replace(/```json|```/g,"").trim();
      const data = JSON.parse(clean.match(/\{[\s\S]*\}/)?.[0]||clean);
      setResult(data);
    } catch(e) {
      setResult({score_coherence:0, resume:"Erreur d'analyse : "+e.message, contradictions:[], points_communs:[], recommandation:""});
    }
    setLoading(false);
  };

  const graviteColor = g => ({haute:"var(--red)",moyenne:"var(--orange)",faible:"var(--mu)"}[g]||"var(--mu)");
  const scoreColor   = s => s>=75?"var(--green)":s>=50?"var(--orange)":"var(--red)";
  const typeColors   = {"Factuel":"#F87171","Logique":"#F97316","Rhétorique":"#A78BFA","Nuance":"#60A5FA","Contradiction interne":"#F87171","Biais cognitif":"#F97316","Argument fallacieux":"#A78BFA","Généralisation":"#FCD34D"};

  return (
    <div style={{flex:1,overflow:"auto",padding:"clamp(10px,2vw,16px)"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6,flexWrap:"wrap"}}>
        <div style={{fontFamily:"var(--font-display)",fontWeight:800,fontSize:"clamp(14px,2.5vw,18px)",color:"#F97316"}}>⚡ Contradiction Detector</div>
        <div style={{fontSize:9,color:"var(--mu)"}}>— Contradictions, biais et incohérences logiques détectés par IA</div>
      </div>

      {/* Mode switch */}
      <div style={{display:"flex",gap:6,marginBottom:14}}>
        {[["compare","⚖️ Comparer 2 textes"],["single","🔬 Analyser 1 texte"]].map(([m,l])=>(
          <button key={m} onClick={()=>{setMode(m);setResult(null);}}
            style={{padding:"6px 14px",borderRadius:8,border:"1px solid "+(mode===m?"var(--ac)":"var(--bd)"),background:mode===m?"rgba(212,168,83,.12)":"transparent",color:mode===m?"var(--ac)":"var(--mu)",fontSize:9,cursor:"pointer",fontWeight:mode===m?700:400}}>
            {l}
          </button>
        ))}
      </div>

      {/* Pré-remplir depuis le chat */}
      {lastResponses.length>=2 && (
        <div style={{marginBottom:12,background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:8,padding:"10px 12px"}}>
          <div style={{fontSize:8,color:"var(--mu)",fontWeight:700,marginBottom:6}}>COMPARER LES RÉPONSES DU CHAT</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {lastResponses.map((r,i)=>{
              const m=MODEL_DEFS[r.id];
              return <button key={r.id} onClick={()=>{
                if(i===0||mode==="single"){setTextA(r.text.slice(0,1500));setLabelA(m.short);}
                else{setTextB(r.text.slice(0,1500));setLabelB(m.short);}
              }}
                style={{padding:"4px 10px",borderRadius:8,border:"1px solid "+m.color+"44",background:m.color+"11",color:m.color,fontSize:8,cursor:"pointer"}}>
                {i===0||mode==="single"?"A":"B"}: {m.icon} {m.short}
              </button>;
            })}
          </div>
        </div>
      )}

      {/* Inputs */}
      <div style={{display:"grid",gridTemplateColumns:mode==="compare"?"1fr 1fr":"1fr",gap:10,marginBottom:12}}>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:5}}>
            <input value={mode==="compare"?labelA:"Texte à analyser"} readOnly={mode==="single"} onChange={e=>setLabelA(e.target.value)}
              style={{flex:1,background:"transparent",border:"none",color:"var(--ac)",fontSize:9,fontWeight:700,outline:"none",fontFamily:"var(--font-mono)"}}/>
          </div>
          <textarea value={textA} onChange={e=>setTextA(e.target.value)}
            placeholder={mode==="compare"?"Colle le premier texte, article ou réponse IA…":"Colle le texte à analyser…"}
            rows={6} style={{width:"100%",background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:6,color:"var(--tx)",fontSize:10,padding:"8px 10px",resize:"vertical",outline:"none",boxSizing:"border-box"}}/>
          <div style={{fontSize:7,color:"var(--mu)",marginTop:2}}>{textA.length} caractères</div>
        </div>
        {mode==="compare" && (
          <div>
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:5}}>
              <input value={labelB} onChange={e=>setLabelB(e.target.value)}
                style={{flex:1,background:"transparent",border:"none",color:"#60A5FA",fontSize:9,fontWeight:700,outline:"none",fontFamily:"var(--font-mono)"}}/>
            </div>
            <textarea value={textB} onChange={e=>setTextB(e.target.value)}
              placeholder="Colle le deuxième texte, article ou réponse IA…"
              rows={6} style={{width:"100%",background:"var(--s2)",border:"1px solid rgba(96,165,250,.3)",borderRadius:6,color:"var(--tx)",fontSize:10,padding:"8px 10px",resize:"vertical",outline:"none",boxSizing:"border-box"}}/>
            <div style={{fontSize:7,color:"var(--mu)",marginTop:2}}>{textB.length} caractères</div>
          </div>
        )}
      </div>

      <button onClick={analyze} disabled={loading||!judge||(mode==="compare"?(!textA.trim()||!textB.trim()):!textA.trim())}
        style={{padding:"9px 22px",background:loading?"var(--s2)":"rgba(249,115,22,.15)",border:"1px solid "+(loading?"var(--bd)":"rgba(249,115,22,.4)"),borderRadius:6,color:loading?"var(--mu)":"#F97316",fontSize:10,cursor:loading?"default":"pointer",fontWeight:700,fontFamily:"var(--font-mono)",marginBottom:16}}>
        {loading?"⚡ Analyse en cours…":"⚡ Lancer l'analyse"}
      </button>

      {/* Résultats */}
      {result && (
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {/* Score */}
          <div style={{padding:"14px 18px",background:"var(--s1)",border:"2px solid "+scoreColor(result.score_coherence)+"44",borderRadius:12,display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}}>
            <div style={{textAlign:"center",minWidth:70}}>
              <div style={{fontSize:36,fontWeight:900,color:scoreColor(result.score_coherence),fontFamily:"var(--font-display)",lineHeight:1}}>{result.score_coherence}%</div>
              <div style={{fontSize:8,color:"var(--mu)"}}>Cohérence</div>
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:10,color:"var(--tx)",lineHeight:1.6,marginBottom:6}}>{result.resume}</div>
              {result.recommandation && <div style={{fontSize:9,color:"var(--ac)",fontStyle:"italic"}}>→ {result.recommandation}</div>}
            </div>
          </div>

          {/* Contradictions */}
          {result.contradictions?.length>0 && (
            <div>
              <div style={{fontSize:10,fontWeight:700,color:"var(--red)",marginBottom:8}}>⚡ {result.contradictions.length} contradiction{result.contradictions.length>1?"s":""} détectée{result.contradictions.length>1?"s":""}</div>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {result.contradictions.map((c,i)=>(
                  <div key={i} style={{background:"var(--s1)",border:"1px solid "+graviteColor(c.gravite)+"44",borderRadius:10,padding:"12px 14px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8,flexWrap:"wrap"}}>
                      <span style={{padding:"2px 8px",borderRadius:8,background:(typeColors[c.type]||"var(--mu)")+"22",color:typeColors[c.type]||"var(--mu)",fontSize:8,fontWeight:700}}>{c.type}</span>
                      <span style={{padding:"2px 8px",borderRadius:8,background:graviteColor(c.gravite)+"22",color:graviteColor(c.gravite),fontSize:8,fontWeight:700}}>Gravité {c.gravite}</span>
                      {c.verdict && <span style={{fontSize:8,color:"var(--mu)",marginLeft:"auto"}}>Verdict : <strong style={{color:"var(--tx)"}}>{c.verdict}</strong></span>}
                    </div>
                    {mode==="compare" ? (
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                        <div style={{background:"rgba(212,168,83,.06)",borderRadius:6,padding:"6px 8px"}}>
                          <div style={{fontSize:7,color:"var(--ac)",fontWeight:700,marginBottom:3}}>{labelA}</div>
                          <div style={{fontSize:9,color:"var(--tx)",lineHeight:1.5}}>{c.claim_a}</div>
                        </div>
                        <div style={{background:"rgba(96,165,250,.06)",borderRadius:6,padding:"6px 8px"}}>
                          <div style={{fontSize:7,color:"#60A5FA",fontWeight:700,marginBottom:3}}>{labelB}</div>
                          <div style={{fontSize:9,color:"var(--tx)",lineHeight:1.5}}>{c.claim_b}</div>
                        </div>
                      </div>
                    ) : (
                      <div style={{background:"rgba(248,113,113,.06)",borderRadius:6,padding:"6px 8px",marginBottom:8}}>
                        <div style={{fontSize:7,color:"var(--red)",fontWeight:700,marginBottom:3}}>PASSAGE PROBLÉMATIQUE</div>
                        <div style={{fontSize:9,color:"var(--tx)",lineHeight:1.5,fontStyle:"italic"}}>"{c.passage}"</div>
                      </div>
                    )}
                    <div style={{fontSize:9,color:"var(--mu)",lineHeight:1.5}}>{c.explication}</div>
                    {c.suggestion && <div style={{marginTop:5,fontSize:9,color:"var(--green)"}}>✓ {c.suggestion}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Points communs ou forts */}
          {(result.points_communs||result.points_forts||result.biais_detectes) && (
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:8}}>
              {(result.points_communs||result.points_forts)?.length>0 && (
                <div style={{background:"var(--s1)",border:"1px solid rgba(74,222,128,.2)",borderRadius:8,padding:"10px 12px"}}>
                  <div style={{fontSize:8,color:"var(--green)",fontWeight:700,marginBottom:6}}>{mode==="compare"?"✓ POINTS COMMUNS":"✓ POINTS FORTS"}</div>
                  {(result.points_communs||result.points_forts||[]).map((p,i)=><div key={i} style={{fontSize:9,color:"var(--tx)",marginBottom:3}}>• {p}</div>)}
                </div>
              )}
              {result.biais_detectes?.length>0 && (
                <div style={{background:"var(--s1)",border:"1px solid rgba(249,115,22,.2)",borderRadius:8,padding:"10px 12px"}}>
                  <div style={{fontSize:8,color:"var(--orange)",fontWeight:700,marginBottom:6}}>🧠 BIAIS DÉTECTÉS</div>
                  {result.biais_detectes.map((b,i)=><div key={i} style={{fontSize:9,color:"var(--tx)",marginBottom:3}}>• {b}</div>)}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ╔══════════════════════════════════════════════════════════════╗
// ║  SECOND BRAIN EXPORT — Export total vers Obsidian/Notion/MD  ║
// ╚══════════════════════════════════════════════════════════════╝
function SecondBrainTab({ savedConvs, projects, memFacts, usageStats, apiKeys, enabled }) {
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
        // Premier message utilisateur
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
      // Top IAs
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

// ╔══════════════════════════════════════════════════════════════╗
// ║  LIVE DEBATE TIMER — Débat Oxford gamifié                    ║
// ╚══════════════════════════════════════════════════════════════╝
function LiveDebateTimerTab({ enabled, apiKeys }) {
  const [topic, setTopic] = React.useState("");
  const [phase, setPhase] = React.useState("setup"); // setup|running|done
  const [rounds, setRounds] = React.useState([]);
  const [currentRound, setCurrentRound] = React.useState(0);
  const [timer, setTimer] = React.useState(0);
  const [timerRunning, setTimerRunning] = React.useState(false);
  const [scores, setScores] = React.useState({});
  const [userVotes, setUserVotes] = React.useState([]);
  const [finalScore, setFinalScore] = React.useState(null);
  const [scoringIA, setScoringIA] = React.useState(null);
  const timerRef = React.useRef(null);

  const activeIds = Object.keys(MODEL_DEFS).filter(id => enabled[id] && !MODEL_DEFS[id]?.serial);
  const MAX_TOKENS = 300; // ~300 mots par réponse pour le timer
  const TIME_PER_ROUND = 90; // 90 secondes par tour

  const ROUND_STRUCTURE = [
    { label:"🎙 Ouverture",    role:"Pour",   desc:"Argumente EN FAVEUR de la proposition. Sois convaincant, concis, cite des faits. MAX 300 mots." },
    { label:"🎙 Ouverture",    role:"Contre", desc:"Argumente CONTRE la proposition. Démonte les arguments précédents. MAX 300 mots." },
    { label:"🔁 Réplique",     role:"Pour",   desc:"Réponds aux arguments adverses. Défends ta position et attaque les faiblesses de l'adversaire. MAX 250 mots." },
    { label:"🔁 Réplique",     role:"Contre", desc:"Réponds aux répliques. Renforce ta position avec des exemples concrets. MAX 250 mots." },
    { label:"🏁 Conclusion",   role:"Pour",   desc:"Conclusion finale POUR. Résume tes 3 arguments les plus forts. MAX 150 mots." },
    { label:"🏁 Conclusion",   role:"Contre", desc:"Conclusion finale CONTRE. Résume tes 3 contre-arguments. MAX 150 mots." },
  ];

  const QUICK_TOPICS = [
    "L'IA remplacera plus d'emplois qu'elle n'en créera d'ici 2030",
    "Les LLMs open source représentent un danger pour la société",
    "L'IA générative va tuer la créativité humaine",
    "Les réseaux sociaux font plus de mal que de bien",
    "Le travail à distance devrait être la norme par défaut",
    "La vie sur Mars est une priorité plus urgente que les problèmes terrestres",
  ];

  // Timer
  React.useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => {
        setTimer(t => {
          if (t <= 1) { clearInterval(timerRef.current); setTimerRunning(false); return 0; }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [timerRunning]);

  const startDebate = async () => {
    if (!topic.trim() || activeIds.length < 1) return;
    setPhase("running"); setRounds([]); setCurrentRound(0); setScores({}); setUserVotes([]); setFinalScore(null);
    const iaFor = activeIds[0];
    const iaAgainst = activeIds[1] || activeIds[0];
    // Générer le premier tour immédiatement
    await generateRound(0, iaFor, iaAgainst, []);
  };

  const generateRound = async (roundIdx, iaFor, iaAgainst, prevRounds) => {
    if (roundIdx >= ROUND_STRUCTURE.length) { setPhase("done"); return; }
    const roundDef = ROUND_STRUCTURE[roundIdx];
    const iaId = roundDef.role === "Pour" ? iaFor : iaAgainst;
    const m = MODEL_DEFS[iaId];
    setScoringIA(iaId);
    setTimer(TIME_PER_ROUND); setTimerRunning(true);

    const context = prevRounds.length > 0
      ? `\n\nÉchanges précédents :\n${prevRounds.map(r=>`[${r.role} — ${r.label}]: ${r.content.slice(0,200)}`).join("\n")}`
      : "";

    const prompt = `Débat Oxford sur : "${topic}"
Tu défends la position : ${roundDef.role==="Pour"?"EN FAVEUR":"CONTRE"}
${roundDef.desc}${context}

Commence directement par ton argument. Sois percutant et convaincant.`;

    try {
      const content = await callModel(iaId, [{role:"user",content:prompt}], apiKeys,
        `Tu es un débatteur expert. Tu défends la position "${roundDef.role==="Pour"?"POUR":"CONTRE"}" de façon convaincante et factuelle.`
      );
      const newRound = { roundIdx, label:roundDef.label, role:roundDef.role, iaId, iaName:m?.short||iaId, iaColor:m?.color||"#D4A853", content, ts:Date.now() };
      setRounds(prev => {
        const updated = [...prev, newRound];
        return updated;
      });
      setScoringIA(null);
    } catch(e) {
      setRounds(prev => [...prev, { roundIdx, label:roundDef.label, role:roundDef.role, iaId, content:`❌ ${e.message}`, ts:Date.now() }]);
    }
    setCurrentRound(roundIdx+1);
  };

  const nextRound = async () => {
    if (currentRound >= ROUND_STRUCTURE.length) { await computeFinalScore(); return; }
    const iaFor = activeIds[0];
    const iaAgainst = activeIds[1] || activeIds[0];
    await generateRound(currentRound, iaFor, iaAgainst, rounds);
  };

  const voteRound = (roundIdx, vote) => {
    setUserVotes(prev => {
      const filtered = prev.filter(v=>v.roundIdx!==roundIdx);
      return [...filtered, {roundIdx, vote}]; // "pour"|"contre"|"nul"
    });
  };

  const computeFinalScore = async () => {
    const judge = activeIds.find(id=>!activeIds.slice(0,2).includes(id)) || activeIds[activeIds.length-1] || activeIds[0];
    const transcript = rounds.map(r=>`[${r.role} — ${r.label}]:\n${r.content.slice(0,300)}`).join("\n\n");
    const userVotesSummary = userVotes.map(v=>`Tour ${v.roundIdx+1}: ${v.vote}`).join(", ");

    try {
      const reply = await callModel(judge, [{role:"user",content:`Tu es arbitre d'un débat Oxford sur : "${topic}"\n\nTranscript complet :\n${transcript}\n\nVotes du public : ${userVotesSummary||"aucun vote"}\n\nDécide du vainqueur. Réponds en JSON :\n{"winner":"Pour|Contre|Match nul","score_pour":7,"score_contre":6,"raison":"2 phrases","arguments_forts_pour":["arg1"],"arguments_forts_contre":["arg1"]}`}], apiKeys, "Arbitre objectif. JSON uniquement.");
      const clean = reply.replace(/```json|```/g,"").trim();
      const data = JSON.parse(clean.match(/\{[\s\S]*\}/)?.[0]||clean);
      setFinalScore(data);
    } catch(e) {
      setFinalScore({winner:"Match nul",score_pour:5,score_contre:5,raison:"Impossible de calculer le score : "+e.message});
    }
    setPhase("done");
  };

  const fmtTime = (s) => `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;
  const timerColor = timer > 30 ? "var(--green)" : timer > 10 ? "var(--orange)" : "var(--red)";

  return (
    <div style={{flex:1,overflow:"auto",padding:"clamp(10px,2vw,16px)"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6,flexWrap:"wrap"}}>
        <div style={{fontFamily:"var(--font-display)",fontWeight:800,fontSize:"clamp(14px,2.5vw,18px)",color:"#F59E0B"}}>⏱ Live Debate Timer</div>
        <div style={{fontSize:9,color:"var(--mu)"}}>— Format Oxford gamifié : 6 tours, timer, votes public, score final</div>
      </div>

      {/* Setup */}
      {phase==="setup" && (
        <>
          <textarea value={topic} onChange={e=>setTopic(e.target.value)}
            placeholder="La proposition à débattre…"
            rows={2} style={{width:"100%",background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:8,color:"var(--tx)",fontSize:11,padding:"10px 12px",resize:"vertical",outline:"none",boxSizing:"border-box",marginBottom:10}}/>
          <div style={{marginBottom:12}}>
            <div style={{fontSize:8,color:"var(--mu)",fontWeight:700,marginBottom:6}}>PROPOSITIONS RAPIDES</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {QUICK_TOPICS.map(t=>(
                <button key={t} onClick={()=>setTopic(t)}
                  style={{padding:"4px 10px",borderRadius:10,border:"1px solid var(--bd)",background:"var(--s1)",color:"var(--mu)",fontSize:8,cursor:"pointer"}}>
                  {t.slice(0,42)}{t.length>42?"…":""}
                </button>
              ))}
            </div>
          </div>
          {/* Assignation IAs */}
          <div style={{marginBottom:14,background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:8,padding:"10px 12px"}}>
            <div style={{fontSize:8,color:"var(--mu)",fontWeight:700,marginBottom:8}}>DÉBATTEURS</div>
            <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
              {[["🟢 POUR",activeIds[0]],["🔴 CONTRE",activeIds[1]||activeIds[0]]].map(([role,id])=>{
                const m=id?MODEL_DEFS[id]:null;
                return <div key={role} style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:10,fontWeight:700,color:role.includes("POUR")?"var(--green)":"var(--red)"}}>{role}</span>
                  <span style={{fontSize:10}}>{m?`${m.icon} ${m.short}`:"Aucune IA"}</span>
                </div>;
              })}
              {activeIds.length<2 && <div style={{fontSize:9,color:"var(--orange)"}}>⚠️ Active au moins 2 IAs pour un vrai débat</div>}
            </div>
            <div style={{marginTop:8,fontSize:8,color:"var(--mu)"}}>Format : 6 tours · Ouverture → Réplique → Conclusion · 90s par tour</div>
          </div>
          <button onClick={startDebate} disabled={!topic.trim()||!activeIds.length}
            style={{padding:"10px 24px",background:"rgba(245,158,11,.15)",border:"1px solid rgba(245,158,11,.4)",borderRadius:6,color:"#F59E0B",fontSize:11,cursor:"pointer",fontWeight:700}}>
            ⏱ Lancer le débat
          </button>
        </>
      )}

      {/* Débat en cours */}
      {(phase==="running"||phase==="done") && (
        <div>
          {/* Proposition */}
          <div style={{padding:"10px 14px",background:"var(--s1)",border:"1px solid rgba(245,158,11,.3)",borderRadius:8,marginBottom:12}}>
            <div style={{fontSize:8,color:"#F59E0B",fontWeight:700,marginBottom:2}}>PROPOSITION</div>
            <div style={{fontSize:11,fontWeight:700,color:"var(--tx)"}}>{topic}</div>
          </div>

          {/* Timer */}
          {phase==="running" && (
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14,padding:"10px 14px",background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:8,flexWrap:"wrap"}}>
              <div style={{fontSize:28,fontWeight:900,color:timerColor,fontFamily:"var(--font-mono)",minWidth:60}}>{fmtTime(timer)}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:8,color:"var(--mu)"}}>Tour {currentRound}/{ROUND_STRUCTURE.length}</div>
                {scoringIA && <div style={{fontSize:9,color:MODEL_DEFS[scoringIA]?.color}}>⏳ {MODEL_DEFS[scoringIA]?.short} rédige…</div>}
                <div style={{marginTop:4,height:4,background:"var(--s2)",borderRadius:2}}><div style={{height:"100%",width:`${(currentRound/ROUND_STRUCTURE.length)*100}%`,background:"#F59E0B",borderRadius:2,transition:"width .5s"}}/></div>
              </div>
              {!scoringIA && currentRound < ROUND_STRUCTURE.length && (
                <button onClick={nextRound}
                  style={{padding:"6px 16px",background:"rgba(245,158,11,.15)",border:"1px solid rgba(245,158,11,.4)",borderRadius:5,color:"#F59E0B",fontSize:9,cursor:"pointer",fontWeight:700}}>
                  ▶ Tour suivant
                </button>
              )}
              {!scoringIA && currentRound >= ROUND_STRUCTURE.length && !finalScore && (
                <button onClick={computeFinalScore}
                  style={{padding:"6px 16px",background:"rgba(212,168,83,.15)",border:"1px solid rgba(212,168,83,.4)",borderRadius:5,color:"var(--ac)",fontSize:9,cursor:"pointer",fontWeight:700}}>
                  🏆 Calculer le score
                </button>
              )}
            </div>
          )}

          {/* Tours */}
          <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
            {rounds.map((r,i)=>{
              const isPour = r.role==="Pour";
              const uVote = userVotes.find(v=>v.roundIdx===i);
              return (
                <div key={i} style={{background:"var(--s1)",border:"1px solid "+(isPour?"rgba(74,222,128,.2)":"rgba(248,113,113,.2)"),borderRadius:10,padding:"12px 14px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8,flexWrap:"wrap"}}>
                    <span style={{padding:"2px 8px",borderRadius:8,background:isPour?"rgba(74,222,128,.12)":"rgba(248,113,113,.12)",color:isPour?"var(--green)":"var(--red)",fontSize:8,fontWeight:700}}>{isPour?"🟢 POUR":"🔴 CONTRE"}</span>
                    <span style={{fontSize:9,color:"var(--mu)"}}>{r.label}</span>
                    <span style={{fontSize:8,color:r.iaColor||"var(--ac)",fontWeight:600,marginLeft:"auto"}}>{r.iaName}</span>
                  </div>
                  <div style={{fontSize:10,color:"var(--tx)",lineHeight:1.7}}>{r.content}</div>
                  {/* Vote utilisateur */}
                  <div style={{marginTop:8,display:"flex",gap:5,alignItems:"center"}}>
                    <span style={{fontSize:8,color:"var(--mu)"}}>Ton vote :</span>
                    {[["pour","🟢 Pour"],["contre","🔴 Contre"],["nul","⚖️ Nul"]].map(([v,l])=>(
                      <button key={v} onClick={()=>voteRound(i,v)}
                        style={{padding:"2px 8px",borderRadius:6,border:"1px solid "+(uVote?.vote===v?"var(--ac)":"var(--bd)"),background:uVote?.vote===v?"rgba(212,168,83,.12)":"transparent",color:uVote?.vote===v?"var(--ac)":"var(--mu)",fontSize:8,cursor:"pointer"}}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Score final */}
          {finalScore && (
            <div style={{padding:"16px 20px",background:"var(--s1)",border:"2px solid rgba(245,158,11,.4)",borderRadius:12}}>
              <div style={{fontSize:9,color:"#F59E0B",fontWeight:700,marginBottom:10}}>🏆 VERDICT FINAL</div>
              <div style={{fontSize:22,fontWeight:900,color:"var(--ac)",fontFamily:"var(--font-display)",marginBottom:6}}>{finalScore.winner}</div>
              <div style={{display:"flex",gap:16,marginBottom:10}}>
                <div style={{textAlign:"center"}}><div style={{fontSize:20,fontWeight:900,color:"var(--green)"}}>{finalScore.score_pour}/10</div><div style={{fontSize:8,color:"var(--mu)"}}>POUR</div></div>
                <div style={{textAlign:"center"}}><div style={{fontSize:20,fontWeight:900,color:"var(--red)"}}>{finalScore.score_contre}/10</div><div style={{fontSize:8,color:"var(--mu)"}}>CONTRE</div></div>
                <div style={{textAlign:"center"}}><div style={{fontSize:20,fontWeight:900,color:"var(--ac)"}}>{userVotes.filter(v=>v.vote==="pour").length}/{userVotes.length}</div><div style={{fontSize:8,color:"var(--mu)"}}>Votes POUR</div></div>
              </div>
              <div style={{fontSize:10,color:"var(--tx)",lineHeight:1.6,marginBottom:10}}>{finalScore.raison}</div>
              <div style={{display:"flex",gap:10}}>
                {[["var(--green)","Arguments POUR",finalScore.arguments_forts_pour],["var(--red)","Arguments CONTRE",finalScore.arguments_forts_contre]].map(([c,l,args])=>args?.length>0&&(
                  <div key={l} style={{flex:1,padding:"8px 10px",background:c+"11",border:"1px solid "+c+"33",borderRadius:6}}>
                    <div style={{fontSize:7,color:c,fontWeight:700,marginBottom:4}}>{l}</div>
                    {args.map((a,i)=><div key={i} style={{fontSize:8,color:"var(--tx)",marginBottom:2}}>• {a}</div>)}
                  </div>
                ))}
              </div>
              <button onClick={()=>{setPhase("setup");setTopic("");setRounds([]);setCurrentRound(0);setFinalScore(null);setUserVotes([]);}}
                style={{marginTop:12,fontSize:9,padding:"5px 14px",background:"rgba(212,168,83,.1)",border:"1px solid rgba(212,168,83,.3)",borderRadius:5,color:"var(--ac)",cursor:"pointer"}}>
                + Nouveau débat
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ╔══════════════════════════════════════════════════════════════╗
// ║  CONTEXT TRANSLATOR — 5 niveaux de compréhension            ║
// ╚══════════════════════════════════════════════════════════════╝
function ContextTranslatorTab({ enabled, apiKeys }) {
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

      {results && (
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:10}}>
          {LEVELS.map(level=>{
            const r = results[level.id];
            if (!r) return null;
            const m = MODEL_DEFS[r.iaId];
            const isTweet = level.id==="tweet";
            const charCount = r.output?.length||0;
            return (
              <div key={level.id} style={{background:"var(--s1)",border:"1px solid "+level.color+"33",borderRadius:10,padding:"12px 14px",position:"relative"}}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
                  <span style={{fontSize:9,fontWeight:700,color:level.color,padding:"2px 7px",background:level.color+"18",borderRadius:8}}>{level.label}</span>
                  {m&&<span style={{fontSize:7,color:m.color,marginLeft:"auto"}}>{m.icon}{m.short}</span>}
                </div>
                <div style={{fontSize:10,color:"var(--tx)",lineHeight:1.7}}>{r.output}</div>
                {isTweet&&<div style={{marginTop:6,fontSize:8,color:charCount>280?"var(--red)":"var(--mu)",textAlign:"right"}}>{charCount}/280</div>}
                <button onClick={()=>navigator.clipboard.writeText(r.output)}
                  style={{position:"absolute",bottom:8,right:8,fontSize:8,padding:"2px 6px",background:"rgba(212,168,83,.08)",border:"1px solid rgba(212,168,83,.2)",borderRadius:4,color:"var(--ac)",cursor:"pointer"}}>📋</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ╔══════════════════════════════════════════════════════════════╗
// ║  API OPTIMIZER — Optimise l'utilisation de tes clés API      ║
// ╚══════════════════════════════════════════════════════════════╝
function ApiOptimizerTab({ usageStats, enabled }) {
  const [recommendations, setRecommendations] = React.useState(null);

  React.useEffect(() => { computeRecommendations(); }, [usageStats]);

  const computeRecommendations = () => {
    const msgs    = usageStats?.msgs    || {};
    const tokens  = usageStats?.tokens  || {};
    const byHour  = usageStats?.byHour  || {};
    const totalMsgs = Object.values(msgs).reduce((a,b)=>a+b,0);
    if (totalMsgs === 0) { setRecommendations(null); return; }

    const recs = [];
    const costs = {};
    let totalSaved = 0;

    // Analyse chaque IA utilisée
    Object.entries(msgs).filter(([,v])=>v>0).forEach(([id, count]) => {
      const m = MODEL_DEFS[id];
      const tok = tokens[id]||0;
      const tp = TOKEN_PRICE[id];
      if (!m || !tp) return;
      const actualCost = (tok*0.7/1e6)*tp.in + (tok*0.3/1e6)*tp.out;
      costs[id] = { count, tok, actualCost };

      // Analyser les messages courts (< 500 tokens estimés = 2000 chars)
      const avgTok = tok / count;

      // Recommandation 1 : messages courts → Cerebras/Gemma (ultra rapide et gratuit)
      if (avgTok < 500 && count > 10 && !["cerebras","gemma2"].includes(id) && enabled["cerebras"]) {
        const altCost = (tok*0.7/1e6)*0.1 + (tok*0.3/1e6)*0.1;
        const saving = actualCost - altCost;
        if (saving > 0.001) {
          recs.push({
            type:"speed", icon:"⚡", priority:"haute",
            title:`Tes ${count} messages courts sur ${m.short}`,
            detail:`Tes messages sont courts (≈ ${Math.round(avgTok)} tokens/msg). Cerebras traite ça 10× plus vite pour le même prix.`,
            suggestion:`Utilise Cerebras pour les requêtes rapides < 500 tokens`,
            saving, altId:"cerebras"
          });
          totalSaved += saving;
        }
      }

      // Recommandation 2 : textes français → Mistral
      if (id !== "mistral" && count > 5 && enabled["mistral"]) {
        recs.push({
          type:"quality", icon:"▲", priority:"moyenne",
          title:`Rédaction française avec ${m.short}`,
          detail:`Mistral Small est optimisé pour le français et coûte moins cher pour la rédaction.`,
          suggestion:`Pour tes textes en français, Mistral Small donne souvent de meilleurs résultats`,
          saving:null, altId:"mistral"
        });
      }

      // Recommandation 3 : messages très longs → Cohere (RAG natif)
      if (avgTok > 3000 && count > 3 && id !== "cohere" && enabled["cohere"]) {
        recs.push({
          type:"rag", icon:"⌘", priority:"haute",
          title:`Tes ${count} longs messages sur ${m.short}`,
          detail:`Tes messages sont très longs (≈ ${Math.round(avgTok)} tokens). Cohere a un RAG natif avec citations — parfait pour l'analyse de documents.`,
          suggestion:`Pour les longs documents, utilise Cohere Command R+`,
          saving:null, altId:"cohere"
        });
      }
    });

    // Analyse heure de pointe
    const peakHour = Object.entries(byHour).sort(([,a],[,b])=>b-a)[0];
    if (peakHour) {
      const h = parseInt(peakHour[0]);
      const groqLimited = h >= 8 && h <= 10; // matin = souvent rate limited
      if (groqLimited) {
        recs.push({
          type:"timing", icon:"🕐", priority:"info",
          title:`Pic d'usage à ${h}h`,
          detail:`Tu utilises beaucoup l'app à ${h}h. C'est l'heure de pointe où Groq peut être rate-limited.`,
          suggestion:`Prépare tes prompts longs le matin et bascule sur Mistral si Groq est limité`,
          saving:null, altId:null
        });
      }
    }

    // Calcul économies potentielles totales
    const totalActualCost = Object.values(costs).reduce((a,c)=>a+c.actualCost,0);

    setRecommendations({
      recs: recs.slice(0,6),
      totalActualCost,
      totalSaved,
      totalMsgs,
      costs,
      peakHour: peakHour?parseInt(peakHour[0]):null,
    });
  };

  const prioColor = p => ({haute:"var(--red)",moyenne:"var(--orange)",info:"var(--blue)"}[p]||"var(--mu)");
  const fmtCost = c => c<0.001?"< $0.001":"$"+c.toFixed(4);

  return (
    <div style={{flex:1,overflow:"auto",padding:"clamp(10px,2vw,16px)"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6,flexWrap:"wrap"}}>
        <div style={{fontFamily:"var(--font-display)",fontWeight:800,fontSize:"clamp(14px,2.5vw,18px)",color:"#34D399"}}>💡 API Optimizer</div>
        <div style={{fontSize:9,color:"var(--mu)"}}>— Analyse ton historique et optimise l'usage de tes clés API</div>
      </div>

      {!recommendations && (
        <div style={{textAlign:"center",padding:"60px 20px"}}>
          <div style={{fontSize:40,marginBottom:10}}>📊</div>
          <div style={{fontSize:13,fontWeight:700,color:"var(--tx)",marginBottom:6}}>Pas encore de données</div>
          <div style={{fontSize:10,color:"var(--mu)"}}>Utilise l'app pendant quelques jours — l'optimiseur analysera ton historique.</div>
        </div>
      )}

      {recommendations && (
        <div>
          {/* Résumé */}
          <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
            {[
              ["💬", recommendations.totalMsgs.toLocaleString(), "Messages analysés"],
              ["💰", fmtCost(recommendations.totalActualCost), "Coût estimé total"],
              ["✂️", recommendations.totalSaved>0?fmtCost(recommendations.totalSaved):"—", "Économies potentielles"],
              ["📋", recommendations.recs.length.toString(), "Recommandations"],
            ].map(([ico,val,lbl])=>(
              <div key={lbl} style={{flex:1,minWidth:90,padding:"10px",background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:8,textAlign:"center"}}>
                <div style={{fontSize:16}}>{ico}</div>
                <div style={{fontSize:14,fontWeight:900,color:"var(--ac)",fontFamily:"var(--font-display)"}}>{val}</div>
                <div style={{fontSize:7,color:"var(--mu)"}}>{lbl}</div>
              </div>
            ))}
          </div>

          {/* Utilisation par IA */}
          <div style={{marginBottom:16,background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:8,padding:"12px 14px"}}>
            <div style={{fontSize:9,fontWeight:700,color:"var(--mu)",marginBottom:10}}>RÉPARTITION ACTUELLE</div>
            {Object.entries(recommendations.costs).sort(([,a],[,b])=>b.count-a.count).map(([id,c])=>{
              const m=MODEL_DEFS[id]; if(!m)return null;
              const pct=Math.round(c.count/recommendations.totalMsgs*100);
              return <div key={id} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                <span style={{color:m.color,width:20,fontSize:11}}>{m.icon}</span>
                <span style={{fontSize:9,color:"var(--tx)",width:80,flexShrink:0}}>{m.short}</span>
                <div style={{flex:1,height:6,background:"var(--s2)",borderRadius:3}}><div style={{height:"100%",width:pct+"%",background:m.color,borderRadius:3}}/></div>
                <span style={{fontSize:8,color:"var(--mu)",width:30,textAlign:"right"}}>{pct}%</span>
                <span style={{fontSize:8,color:"var(--mu)",width:60,textAlign:"right",fontFamily:"var(--font-mono)"}}>{fmtCost(c.actualCost)}</span>
              </div>;
            })}
          </div>

          {/* Recommandations */}
          {recommendations.recs.length > 0 ? (
            <div>
              <div style={{fontSize:10,fontWeight:700,color:"var(--tx)",marginBottom:10}}>💡 RECOMMANDATIONS PERSONNALISÉES</div>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {recommendations.recs.map((rec,i)=>{
                  const altM = rec.altId ? MODEL_DEFS[rec.altId] : null;
                  return (
                    <div key={i} style={{background:"var(--s1)",border:"1px solid "+prioColor(rec.priority)+"33",borderRadius:10,padding:"12px 14px"}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,flexWrap:"wrap"}}>
                        <span style={{fontSize:14}}>{rec.icon}</span>
                        <span style={{fontSize:10,fontWeight:700,color:"var(--tx)",flex:1}}>{rec.title}</span>
                        <span style={{fontSize:7,padding:"2px 6px",borderRadius:6,background:prioColor(rec.priority)+"22",color:prioColor(rec.priority),fontWeight:700}}>{rec.priority}</span>
                        {rec.saving>0&&<span style={{fontSize:8,color:"var(--green)",fontWeight:700}}>Économie : {fmtCost(rec.saving)}</span>}
                      </div>
                      <div style={{fontSize:9,color:"var(--mu)",lineHeight:1.5,marginBottom:6}}>{rec.detail}</div>
                      <div style={{fontSize:9,color:"var(--ac)",display:"flex",alignItems:"center",gap:6}}>
                        <span>→</span>
                        <span>{rec.suggestion}</span>
                        {altM&&<span style={{color:altM.color,fontWeight:700,marginLeft:4}}>{altM.icon} {altM.short}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div style={{textAlign:"center",padding:24,color:"var(--green)",fontSize:10}}>✅ Ton usage est déjà optimisé !</div>
          )}
        </div>
      )}
    </div>
  );
}

// ╔══════════════════════════════════════════════════════════════╗
// ║  COMPARATEUR DE CIVILISATIONS                                ║
// ╚══════════════════════════════════════════════════════════════╝
function CivilisationsTab({ enabled, apiKeys }) {
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

// ╔══════════════════════════════════════════════════════════════╗
// ║  MODE FLASH — Un prompt → toutes les IAs en 10 secondes      ║
// ╚══════════════════════════════════════════════════════════════╝
function ModeFlashTab({ enabled, apiKeys, navigateTab, setChatInput }) {
  const [prompt, setPrompt] = React.useState("");
  const [results, setResults] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [startTime, setStartTime] = React.useState(null);
  const [elapsed, setElapsed] = React.useState(0);
  const [winner, setWinner] = React.useState(null);
  const [history, setHistory] = React.useState(() => { try { return JSON.parse(localStorage.getItem("multiia_flash_history")||"[]"); } catch { return []; } });
  const timerRef = React.useRef(null);

  const activeIds = Object.keys(MODEL_DEFS).filter(id => enabled[id] && !MODEL_DEFS[id]?.serial && !MODEL_DEFS[id]?.serial);

  const FLASH_PROMPTS = [
    "Explique l'IA générative en 3 phrases",
    "Quel est le meilleur conseil pour être productif ?",
    "Nomme 5 startups IA qui vont changer le monde",
    "Quelle est la différence entre Groq et Mistral ?",
    "Écris un haïku sur l'intelligence artificielle",
    "Quel livre lire absolument sur l'IA ?",
    "Explique-moi les transformers simplement",
    "Quelle IA choisir pour écrire du code ?",
  ];

  // Timer en direct
  React.useEffect(() => {
    if (loading && startTime) {
      timerRef.current = setInterval(() => setElapsed(Date.now()-startTime), 100);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [loading, startTime]);

  const flash = async () => {
    if (!prompt.trim() || !activeIds.length) return;
    setLoading(true); setResults([]); setWinner(null);
    const t0 = Date.now(); setStartTime(t0);

    // Lancer toutes les IAs en même temps
    const promises = activeIds.map(async id => {
      const t = Date.now();
      try {
        const output = await callModel(id, [{role:"user",content:prompt}], apiKeys, "Tu es un assistant ultra-concis. Réponds directement et précisément en 2-5 phrases max.");
        return { id, output, time:Date.now()-t, ok:true };
      } catch(e) {
        return { id, output:"❌ "+e.message, time:Date.now()-t, ok:false };
      }
    });

    // Afficher les résultats au fur et à mesure
    const settled = [];
    await Promise.all(promises.map(p => p.then(r => {
      settled.push(r);
      setResults([...settled].sort((a,b)=>a.time-b.time));
    })));

    // Déterminer le plus rapide et le meilleur (le plus long = potentiellement plus complet)
    const successful = settled.filter(r=>r.ok);
    if (successful.length > 0) {
      const fastest = successful.reduce((a,b)=>a.time<b.time?a:b);
      setWinner(fastest.id);
      // Sauvegarder dans l'historique
      const entry = {
        id:Date.now().toString(),
        prompt,
        date:new Date().toLocaleString("fr-FR",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"}),
        fastest:fastest.id,
        count:successful.length,
        totalTime:Date.now()-t0,
      };
      const newHistory = [entry,...history].slice(0,15);
      setHistory(newHistory);
      try { localStorage.setItem("multiia_flash_history",JSON.stringify(newHistory)); } catch {}
    }

    setLoading(false);
    setElapsed(Date.now()-t0);
  };

  const fmtMs = ms => ms < 1000 ? ms+"ms" : (ms/1000).toFixed(1)+"s";
  const fastest = results.filter(r=>r.ok).length>0 ? results.filter(r=>r.ok).reduce((a,b)=>a.time<b.time?a:b) : null;
  const slowest = results.filter(r=>r.ok).length>0 ? results.filter(r=>r.ok).reduce((a,b)=>a.time>b.time?a:b) : null;

  return (
    <div style={{flex:1,overflow:"auto",padding:"clamp(10px,2vw,16px)"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6,flexWrap:"wrap"}}>
        <div style={{fontFamily:"var(--font-display)",fontWeight:800,fontSize:"clamp(14px,2.5vw,18px)",color:"#FCD34D"}}>⚡ Mode Flash</div>
        <div style={{fontSize:9,color:"var(--mu)"}}>— Un prompt → toutes tes IAs en même temps · Course de vitesse en temps réel</div>
      </div>
      <div style={{fontSize:9,color:"var(--mu)",marginBottom:14,padding:"8px 12px",background:"rgba(252,211,77,.06)",border:"1px solid rgba(252,211,77,.15)",borderRadius:6}}>
        Toutes tes IAs actives reçoivent le même prompt simultanément. Tu vois leurs réponses arriver en temps réel, classées par vitesse. Idéal pour les questions rapides ou comparer les styles.
      </div>

      {/* Exemples */}
      <div style={{marginBottom:10}}>
        <div style={{fontSize:8,color:"var(--mu)",fontWeight:700,marginBottom:5}}>PROMPTS FLASH</div>
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
          {FLASH_PROMPTS.map(p=>(
            <button key={p} onClick={()=>setPrompt(p)}
              style={{padding:"4px 9px",borderRadius:8,border:"1px solid var(--bd)",background:"var(--s1)",color:"var(--mu)",fontSize:8,cursor:"pointer"}}>
              {p.slice(0,36)}{p.length>36?"…":""}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div style={{display:"flex",gap:8,marginBottom:14}}>
        <input value={prompt} onChange={e=>setPrompt(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&!loading&&prompt.trim()&&flash()}
          placeholder="Tape ton prompt flash (Entrée pour lancer)…"
          style={{flex:1,background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:8,color:"var(--tx)",fontSize:11,padding:"10px 14px",outline:"none"}}/>
        <button onClick={flash} disabled={loading||!prompt.trim()||!activeIds.length}
          style={{padding:"10px 20px",background:loading?"var(--s2)":"rgba(252,211,77,.15)",border:"1px solid "+(loading?"var(--bd)":"rgba(252,211,77,.4)"),borderRadius:8,color:loading?"var(--mu)":"#FCD34D",fontSize:12,cursor:loading?"default":"pointer",fontWeight:900,fontFamily:"var(--font-mono)",minWidth:60}}>
          {loading?"…":"⚡"}
        </button>
      </div>

      {/* Timer en direct */}
      {(loading || results.length > 0) && (
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14,padding:"8px 14px",background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:8,flexWrap:"wrap"}}>
          <div style={{fontSize:24,fontWeight:900,color:"#FCD34D",fontFamily:"var(--font-mono)",minWidth:70}}>
            {fmtMs(loading ? elapsed : elapsed)}
          </div>
          <div style={{flex:1}}>
            <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
              {activeIds.map(id=>{
                const r = results.find(x=>x.id===id);
                const m = MODEL_DEFS[id];
                return <div key={id} style={{padding:"3px 8px",borderRadius:6,background:r?.ok?"rgba(74,222,128,.1)":r?"rgba(248,113,113,.1)":"var(--s2)",border:"1px solid "+(r?.ok?"rgba(74,222,128,.3)":r?"rgba(248,113,113,.3)":"var(--bd)"),fontSize:8,color:r?.ok?"var(--green)":r?"var(--red)":m.color,display:"flex",alignItems:"center",gap:4}}>
                  {r?.ok ? "✓" : r ? "✗" : <span style={{animation:"spin 1s linear infinite",display:"inline-block"}}>⟳</span>}
                  {m.short}
                  {r?.ok && <span style={{color:"var(--mu)"}}>{fmtMs(r.time)}</span>}
                </div>;
              })}
            </div>
          </div>
          <div style={{fontSize:9,color:"var(--mu)",textAlign:"right"}}>
            {results.filter(r=>r.ok).length}/{activeIds.length} IAs
          </div>
        </div>
      )}

      {/* Résultats classés */}
      {results.length > 0 && (
        <div>
          {/* Podium */}
          {!loading && results.filter(r=>r.ok).length >= 2 && (
            <div style={{display:"flex",gap:8,marginBottom:14,alignItems:"flex-end",justifyContent:"center",flexWrap:"wrap"}}>
              {results.filter(r=>r.ok).slice(0,3).map((r,i)=>{
                const m = MODEL_DEFS[r.id];
                const medals = ["🥇","🥈","🥉"];
                const heights = [80,60,50];
                return <div key={r.id} style={{textAlign:"center",minWidth:80}}>
                  <div style={{fontSize:16}}>{medals[i]}</div>
                  <div style={{height:heights[i],background:m.color+"22",border:"1px solid "+m.color+"44",borderRadius:"6px 6px 0 0",display:"flex",alignItems:"flex-end",justifyContent:"center",padding:"0 0 6px"}}>
                    <div>
                      <div style={{fontSize:16}}>{m.icon}</div>
                      <div style={{fontSize:8,color:m.color,fontWeight:700}}>{m.short}</div>
                    </div>
                  </div>
                  <div style={{background:m.color+"33",padding:"4px 8px",borderRadius:"0 0 6px 6px",fontSize:8,color:"var(--mu)",fontFamily:"var(--font-mono)"}}>{fmtMs(r.time)}</div>
                </div>;
              })}
            </div>
          )}

          {/* Réponses */}
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {results.map((r,i)=>{
              const m = MODEL_DEFS[r.id];
              const isFastest = r.id===fastest?.id && r.ok;
              const isSlowest = r.id===slowest?.id && r.ok && results.filter(x=>x.ok).length>1;
              return (
                <div key={r.id} style={{background:"var(--s1)",border:"1px solid "+(isFastest?"rgba(252,211,77,.4)":r.ok?"var(--bd)":"rgba(248,113,113,.2)"),borderRadius:10,padding:"12px 14px",position:"relative"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,flexWrap:"wrap"}}>
                    <span style={{fontSize:18}}>{["🥇","🥈","🥉","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣"][i]||"·"}</span>
                    <span style={{color:m.color,fontSize:12}}>{m.icon}</span>
                    <span style={{fontWeight:700,fontSize:10,color:m.color}}>{m.name}</span>
                    {isFastest&&<span style={{fontSize:8,padding:"2px 6px",background:"rgba(252,211,77,.2)",border:"1px solid rgba(252,211,77,.4)",borderRadius:6,color:"#FCD34D",fontWeight:700}}>⚡ Plus rapide</span>}
                    {isSlowest&&<span style={{fontSize:8,color:"var(--mu)"}}>🐢</span>}
                    <span style={{marginLeft:"auto",fontSize:9,color:"var(--mu)",fontFamily:"var(--font-mono)",fontWeight:700}}>{fmtMs(r.time)}</span>
                  </div>
                  <div style={{fontSize:10,color:r.ok?"var(--tx)":"var(--red)",lineHeight:1.7}}>{r.output}</div>
                  {r.ok && (
                    <div style={{display:"flex",gap:5,marginTop:8}}>
                      <button onClick={()=>navigator.clipboard.writeText(r.output)} style={{fontSize:8,padding:"2px 7px",background:"transparent",border:"1px solid var(--bd)",borderRadius:4,color:"var(--mu)",cursor:"pointer"}}>📋</button>
                      <button onClick={()=>{setChatInput(r.output);navigateTab("chat");}} style={{fontSize:8,padding:"2px 7px",background:"rgba(212,168,83,.08)",border:"1px solid rgba(212,168,83,.2)",borderRadius:4,color:"var(--ac)",cursor:"pointer"}}>→ Chat</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Stats de la session */}
          {!loading && results.filter(r=>r.ok).length > 1 && (
            <div style={{marginTop:12,padding:"10px 14px",background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:8,display:"flex",gap:16,flexWrap:"wrap",fontSize:9,color:"var(--mu)"}}>
              <span>⚡ Plus rapide : <strong style={{color:"var(--green)"}}>{fastest&&MODEL_DEFS[fastest.id]?.short} ({fmtMs(fastest?.time||0)})</strong></span>
              <span>⏱ Plus lent : <strong>{slowest&&MODEL_DEFS[slowest.id]?.short} ({fmtMs(slowest?.time||0)})</strong></span>
              <span>⏰ Total : <strong style={{color:"#FCD34D"}}>{fmtMs(elapsed)}</strong></span>
              <span>✓ {results.filter(r=>r.ok).length}/{activeIds.length} IAs</span>
            </div>
          )}
        </div>
      )}

      {/* Historique flash */}
      {history.length > 0 && !loading && results.length === 0 && (
        <div style={{marginTop:14}}>
          <div style={{fontSize:9,fontWeight:700,color:"var(--mu)",marginBottom:8}}>HISTORIQUE FLASH</div>
          <div style={{display:"flex",flexDirection:"column",gap:5}}>
            {history.slice(0,8).map(h=>(
              <div key={h.id} onClick={()=>setPrompt(h.prompt)}
                style={{padding:"7px 12px",background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:7,cursor:"pointer",display:"flex",gap:10,alignItems:"center"}}>
                <span style={{fontSize:9,color:"var(--tx)",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{h.prompt}</span>
                <span style={{fontSize:7,color:MODEL_DEFS[h.fastest]?.color,flexShrink:0}}>⚡ {MODEL_DEFS[h.fastest]?.short}</span>
                <span style={{fontSize:7,color:"var(--mu)",flexShrink:0,fontFamily:"var(--font-mono)"}}>{fmtMs(h.totalTime)}</span>
                <span style={{fontSize:7,color:"var(--mu)",flexShrink:0}}>{h.date}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────
// ── COMPOSANT WebIAsTab ─────────────────────────────────────────
function WebIAsTab() {
  const [discovered, setDiscovered] = React.useState(getDiscoveredAIs());
  const [discovering, setDiscovering] = React.useState(false);
  const [discMsg, setDiscMsg] = React.useState("");
  const [filterCat, setFilterCat] = React.useState("all");
  const [search, setSearch] = React.useState("");
  const [sortBy, setSortBy] = React.useState("trend"); // "trend" | "name" | "cat"
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

  // Tri + filtre
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

  // Top trending (trend >= 9)
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
          {[1,2,3,4,5].map(i=>(
            <div key={i} style={{width:5,height:5,borderRadius:1,background:i<=Math.round(score/2)?color:"var(--bd)"}}/>
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
          {/* Sort */}
          <div style={{display:"flex",gap:3}}>
            {[["trend","🔥 Tendances"],["name","A-Z"],["cat","Catégorie"]].map(([k,l])=>(
              <button key={k} onClick={()=>setSortBy(k)}
                style={{fontSize:8,padding:"2px 7px",borderRadius:4,border:`1px solid ${sortBy===k?"var(--ac)":"var(--bd)"}`,background:sortBy===k?"rgba(212,168,83,.15)":"transparent",color:sortBy===k?"var(--ac)":"var(--mu)",cursor:"pointer",fontFamily:"var(--font-mono)"}}>
                {l}
              </button>
            ))}
          </div>
          <button onClick={discoverNewAIs} disabled={discovering}
            style={{padding:"4px 10px",fontSize:9,fontWeight:700,borderRadius:5,border:"1px solid var(--ac)",background:"transparent",color:"var(--ac)",cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace",opacity:discovering?.6:1}}>
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



// ── VeilleTab ────────────────────────────────────────────────────
function VeilleTab({ enabled, apiKeys, navigateTab, setChatInput }) {
  const [feeds, setFeeds] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem("multiia_veille_feeds")||"[]"); } catch { return []; }
  });
  const [articles, setArticles] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [newFeed, setNewFeed] = React.useState("");
  const [summary, setSummary] = React.useState("");
  const DEFAULT_TOPICS = ["IA générative 2026","LLM nouveaux modèles","OpenAI Anthropic Google","IA outils productivité","Machine learning recherche"];

  const saveFeed = (f) => { localStorage.setItem("multiia_veille_feeds", JSON.stringify(f)); };

  const fetchVeille = async () => {
    setLoading(true); setArticles([]); setSummary("");
    const activeIds = Object.keys(MODEL_DEFS).filter(id => enabled[id] && !MODEL_DEFS[id]?.serial);
    if (!activeIds.length) { setLoading(false); return; }
    const id = activeIds.find(i=>i==="groq")||activeIds[0];
    const topics = feeds.length ? feeds : DEFAULT_TOPICS;
    const prompt = "Tu es un agr\u00e9gateur de veille technologique IA. G\u00e9n\u00e8re 10 articles r\u00e9cents fictifs mais r\u00e9alistes sur ces sujets : "+topics.slice(0,5).join(", ")+". Format JSON uniquement : [{titre:...,source:Blog,date:Mars 2026,resume:2 phrases,cat:Mod\u00e8les|Outils|Recherche|Business,hot:true}]. Vari\u00e9t\u00e9 de sources et cat\u00e9gories.";
    try {
      const r = await callModel(id, [{role:"user",content:prompt}], apiKeys, "Expert veille IA. JSON uniquement.");
      const d = JSON.parse(r.replace(/```json|```/g,"").trim());
      setArticles(Array.isArray(d)?d.slice(0,10):[]);
    } catch { setArticles([]); }
    setLoading(false);
  };

  const generateSummary = async () => {
    if (!articles.length) return;
    const activeIds = Object.keys(MODEL_DEFS).filter(id => enabled[id] && !MODEL_DEFS[id]?.serial);
    const id = activeIds.find(i=>i==="mistral")||activeIds[0];
    if (!id) return;
    const digest = articles.map(a=>a.titre+": "+a.resume).join("\n");
    try {
      const r = await callModel(id, [{role:"user",content:"Génère un résumé exécutif de veille IA en 5 points clés basé sur ces articles :\n"+digest}], apiKeys, "Expert synth\u00e8se. 5 bullet points maximum.");
      setSummary(r);
    } catch {}
  };

  return (
    <div style={{flex:1,overflow:"auto",padding:"clamp(10px,2vw,16px)"}}>
      <div style={{fontFamily:"var(--font-display)",fontWeight:800,fontSize:"clamp(14px,2.5vw,18px)",color:"var(--ac)",marginBottom:14}}>📰 Veille Intelligente</div>
      {/* Thèmes rapides */}
      <div style={{marginBottom:12,background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:8,padding:"12px"}}>
        <div style={{fontSize:9,fontWeight:700,color:"var(--mu)",marginBottom:8}}>THÈMES PRÉDÉFINIS — CLIQUE POUR CHARGER</div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {VEILLE_THEMES.map(t=>(
            <button key={t.id} onClick={()=>{
              setFeeds(t.topics);
              saveFeed(t.topics);
              setTimeout(fetchVeille, 100);
            }}
            style={{padding:"5px 11px",borderRadius:14,border:"1px solid "+t.color+"44",background:t.color+"11",color:t.color,fontSize:8,cursor:"pointer",fontWeight:600,transition:"all .15s"}}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>
      {/* Topics */}
      <div style={{marginBottom:12,background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:8,padding:"12px"}}>
        <div style={{fontSize:9,fontWeight:700,color:"var(--mu)",marginBottom:8}}>SUJETS DE VEILLE</div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8}}>
          {(feeds.length?feeds:DEFAULT_TOPICS).map((f,i)=>(
            <span key={i} style={{fontSize:8,padding:"2px 8px",background:"rgba(96,165,250,.1)",border:"1px solid rgba(96,165,250,.2)",borderRadius:10,color:"var(--blue)",display:"flex",alignItems:"center",gap:4}}>
              {f}
              {feeds.includes(f)&&<button onClick={()=>{const nf=feeds.filter(x=>x!==f);setFeeds(nf);saveFeed(nf);}} style={{background:"none",border:"none",color:"var(--mu)",cursor:"pointer",fontSize:10,padding:0}}>✕</button>}
            </span>
          ))}
        </div>
        <div style={{display:"flex",gap:7}}>
          <input value={newFeed} onChange={e=>setNewFeed(e.target.value)} placeholder="Ajouter un sujet de veille…"
            onKeyDown={e=>{if(e.key==="Enter"&&newFeed.trim()){const nf=[...feeds,newFeed.trim()];setFeeds(nf);saveFeed(nf);setNewFeed("");}}}
            style={{flex:1,background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:5,color:"var(--tx)",fontSize:9,padding:"5px 9px",outline:"none"}}/>
          <button onClick={fetchVeille} disabled={loading}
            style={{padding:"5px 14px",background:"rgba(212,168,83,.15)",border:"1px solid rgba(212,168,83,.4)",borderRadius:5,color:"var(--ac)",fontSize:9,cursor:"pointer",fontWeight:700,whiteSpace:"nowrap"}}>
            {loading?"⟳ Chargement…":"🔄 Actualiser"}
          </button>
        </div>
      </div>
      {/* Articles */}
      {articles.length>0&&(
        <>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
            <span style={{fontSize:9,color:"var(--mu)"}}>{articles.length} articles</span>
            <button onClick={generateSummary} style={{fontSize:8,padding:"3px 10px",background:"rgba(167,139,250,.1)",border:"1px solid rgba(167,139,250,.3)",borderRadius:4,color:"#A78BFA",cursor:"pointer"}}>✦ Résumé exécutif</button>
          </div>
          {summary&&(
            <div style={{marginBottom:12,padding:"10px 12px",background:"var(--s1)",border:"1px solid rgba(212,168,83,.3)",borderRadius:8,fontSize:9,lineHeight:1.6}}>
              <div style={{fontSize:8,color:"var(--ac)",fontWeight:700,marginBottom:6}}>✦ RÉSUMÉ EXÉCUTIF</div>
              <MarkdownRenderer text={summary}/>
            </div>
          )}
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:10}}>
            {articles.map((a,i)=>(
              <div key={i} style={{background:"var(--s1)",border:"1px solid "+(a.hot?"rgba(212,168,83,.35)":"var(--bd)"),borderRadius:8,padding:"12px 14px"}}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
                  <span style={{fontSize:7,padding:"1px 5px",background:"rgba(96,165,250,.1)",color:"var(--blue)",borderRadius:3,fontWeight:700}}>{a.cat}</span>
                  <span style={{fontSize:7,color:"var(--mu)",marginLeft:"auto"}}>{a.source} · {a.date}</span>
                  {a.hot&&<span style={{fontSize:10}}>🔥</span>}
                </div>
                <div style={{fontSize:10,fontWeight:700,color:"var(--tx)",marginBottom:5,lineHeight:1.4}}>{a.titre}</div>
                <div style={{fontSize:9,color:"var(--mu)",lineHeight:1.5}}>{a.resume}</div>
                <button onClick={()=>{setChatInput("Parle-moi de : "+a.titre);navigateTab("chat");}} style={{marginTop:8,fontSize:7,padding:"2px 7px",background:"transparent",border:"1px solid var(--bd)",borderRadius:3,color:"var(--mu)",cursor:"pointer"}}>💬 En savoir plus</button>
              </div>
            ))}
          </div>
        </>
      )}
      {!articles.length&&!loading&&<div style={{textAlign:"center",padding:40,color:"var(--mu)",fontSize:10}}>Clique sur "Actualiser" pour charger les actualités IA du jour.</div>}
    </div>
  );
}

// ── VoiceTab ─────────────────────────────────────────────────────
function VoiceTab({ enabled, apiKeys, conversations, setChatInput, navigateTab }) {
  const [listening, setListening] = React.useState(false);
  const [transcript, setTranscript] = React.useState("");
  const [voiceReply, setVoiceReply] = React.useState("");
  const [speaking, setSpeaking] = React.useState(false);
  const [voiceIA, setVoiceIA] = React.useState("");
  const [history, setHistory] = React.useState([]); // [{role,text}]
  const recognRef = React.useRef(null);

  const activeIds = Object.keys(MODEL_DEFS).filter(id => enabled[id] && !MODEL_DEFS[id]?.serial);
  const currentIA = voiceIA || activeIds[0] || "";

  const speak = (text) => {
    if (!text || !window.speechSynthesis) return;
    setSpeaking(true);
    const utt = new SpeechSynthesisUtterance(text.replace(/\*\*/g,"").replace(/#{1,6} /g,"").slice(0,1000));
    utt.lang = "fr-FR"; utt.rate = 1.1;
    utt.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(utt);
  };

  const stopSpeak = () => { window.speechSynthesis?.cancel(); setSpeaking(false); };

  const startListen = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Dictée vocale non supportée sur ce navigateur."); return; }
    const r = new SR(); r.lang="fr-FR"; r.continuous=false; r.interimResults=true;
    recognRef.current = r;
    r.onresult = e => { const t = Array.from(e.results).map(x=>x[0].transcript).join(""); setTranscript(t); };
    r.onend = async () => {
      setListening(false);
      const q = transcript; if (!q.trim()) return;
      setHistory(h=>[...h,{role:"user",text:q}]);
      setTranscript("");
      if (!currentIA) return;
      try {
        const hist = [...history,{role:"user",text:q}].map(m=>({role:m.role==="user"?"user":"assistant",content:m.text}));
        const reply = await callModel(currentIA, hist, apiKeys, "Tu es un assistant vocal. Réponds de façon concise, 2-3 phrases max, sans markdown.");
        setVoiceReply(reply);
        setHistory(h=>[...h,{role:"assistant",text:reply}]);
        speak(reply);
      } catch(e) { setVoiceReply("❌ "+e.message); }
    };
    r.start();
    setListening(true);
  };

  const stopListen = () => { recognRef.current?.stop(); setListening(false); };

  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",padding:"clamp(16px,3vw,32px)",overflow:"auto"}}>
      <div style={{fontFamily:"var(--font-display)",fontWeight:800,fontSize:"clamp(16px,3vw,22px)",color:"var(--ac)",marginBottom:6}}>🎙 Mode Vocal</div>
      <div style={{fontSize:9,color:"var(--mu)",marginBottom:24}}>Parle directement à l'IA, en mains libres</div>
      {/* IA selector */}
      <div style={{marginBottom:24,display:"flex",gap:6,flexWrap:"wrap",justifyContent:"center"}}>
        {activeIds.slice(0,6).map(id=>{
          const m=MODEL_DEFS[id];
          return (<button key={id} onClick={()=>setVoiceIA(id)}
            style={{padding:"6px 14px",borderRadius:20,border:"1px solid "+(currentIA===id?m.color:"var(--bd)"),background:currentIA===id?m.color+"18":"transparent",color:currentIA===id?m.color:"var(--mu)",fontSize:9,cursor:"pointer",fontWeight:currentIA===id?700:400}}>
            {m.icon} {m.short}
          </button>);
        })}
      </div>
      {/* Quick themes */}
      <div style={{width:"100%",maxWidth:600,marginBottom:20}}>
        <div style={{fontSize:8,color:"var(--mu)",fontWeight:700,letterSpacing:1,marginBottom:8,textAlign:"center"}}>QUESTIONS RAPIDES — CLIQUE POUR PARLER</div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",justifyContent:"center"}}>
          {VOICE_THEMES.map(t=>(
            <button key={t.id} onClick={async()=>{
              setTranscript(t.question);
              setHistory(h=>[...h,{role:"user",text:t.question}]);
              if(!currentIA) return;
              try {
                const hist = [...history,{role:"user",text:t.question}].map(m=>({role:m.role==="user"?"user":"assistant",content:m.text}));
                const reply = await callModel(currentIA,hist,apiKeys,"Tu es un assistant vocal. Réponds de façon concise, 2-3 phrases max, sans markdown.");
                setVoiceReply(reply);
                setHistory(h=>[...h,{role:"assistant",text:reply}]);
                speak(reply);
              } catch(e){setVoiceReply("❌ "+e.message);}
            }}
            style={{padding:"5px 10px",borderRadius:14,border:"1px solid "+t.color+"44",background:t.color+"11",color:t.color,fontSize:8,cursor:"pointer",fontWeight:600,transition:"all .15s"}}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>
      {/* Big mic button */}
      <button onClick={listening?stopListen:startListen}
        style={{width:100,height:100,borderRadius:"50%",border:"3px solid "+(listening?"var(--red)":"var(--ac)"),background:listening?"rgba(248,113,113,.15)":"rgba(212,168,83,.1)",color:listening?"var(--red)":"var(--ac)",fontSize:36,cursor:"pointer",marginBottom:20,transition:"all .2s",animation:listening?"pulse 1s infinite":speaking?"none":"none",display:"flex",alignItems:"center",justifyContent:"center"}}>
        {listening?"⏹":"🎙"}
      </button>
      <div style={{fontSize:9,color:"var(--mu)",marginBottom:16}}>{listening?"Écoute en cours…":speaking?"IA parle…":"Clique pour parler"}</div>
      {/* Transcript */}
      {(transcript||voiceReply)&&(
        <div style={{width:"100%",maxWidth:600,display:"flex",flexDirection:"column",gap:8}}>
          {transcript&&<div style={{padding:"10px 14px",background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:8,fontSize:10,color:"var(--tx)",fontStyle:"italic"}}>"{transcript}"</div>}
          {voiceReply&&(
            <div style={{padding:"10px 14px",background:"var(--s1)",border:"1px solid rgba(212,168,83,.3)",borderRadius:8,fontSize:10,lineHeight:1.6}}>
              <div style={{fontSize:8,color:"var(--ac)",fontWeight:700,marginBottom:5}}>{MODEL_DEFS[currentIA]?.icon} {MODEL_DEFS[currentIA]?.short}</div>
              {voiceReply}
              <div style={{display:"flex",gap:6,marginTop:8}}>
                <button onClick={()=>speak(voiceReply)} disabled={speaking} style={{fontSize:8,padding:"2px 8px",background:"transparent",border:"1px solid var(--bd)",borderRadius:3,color:"var(--mu)",cursor:"pointer"}}>🔊 Réécouter</button>
                <button onClick={stopSpeak} disabled={!speaking} style={{fontSize:8,padding:"2px 8px",background:"transparent",border:"1px solid var(--bd)",borderRadius:3,color:"var(--mu)",cursor:"pointer"}}>⏹ Stop</button>
                <button onClick={()=>{setChatInput(voiceReply.slice(0,2000));navigateTab("chat");}} style={{fontSize:8,padding:"2px 8px",background:"transparent",border:"1px solid var(--bd)",borderRadius:3,color:"var(--mu)",cursor:"pointer"}}>→ Chat</button>
              </div>
            </div>
          )}
        </div>
      )}
      {/* Conversation history */}
      {history.length>0&&(
        <div style={{width:"100%",maxWidth:600,marginTop:16}}>
          <div style={{fontSize:8,color:"var(--mu)",fontWeight:700,marginBottom:8}}>HISTORIQUE SESSION</div>
          {history.slice(-6).map((h,i)=>(
            <div key={i} style={{padding:"6px 10px",marginBottom:4,borderRadius:6,background:h.role==="user"?"var(--s2)":"var(--s1)",fontSize:9,color:h.role==="user"?"var(--tx)":"var(--ac)",textAlign:h.role==="user"?"right":"left"}}>
              {h.text.slice(0,200)}
            </div>
          ))}
          <button onClick={()=>setHistory([])} style={{fontSize:8,padding:"3px 8px",background:"transparent",border:"1px solid var(--bd)",borderRadius:3,color:"var(--mu)",cursor:"pointer",marginTop:6}}>↺ Effacer historique</button>
        </div>
      )}
    </div>
  );
}

// ── ProjectsTab ──────────────────────────────────────────────────
function ProjectsTab({ conversations, setChatInput, navigateTab, apiKeys, enabled }) {
  const PROJ_KEY = "multiia_projects";
  const [projects, setProjects] = React.useState(() => { try { return JSON.parse(localStorage.getItem(PROJ_KEY)||"[]"); } catch { return []; } });
  const [activeProj, setActiveProj] = React.useState(null);
  const [newName, setNewName] = React.useState("");
  const [editingId, setEditingId] = React.useState(null);

  const saveProjects = (p) => { setProjects(p); localStorage.setItem(PROJ_KEY, JSON.stringify(p)); };
  const createProject = () => {
    if (!newName.trim()) return;
    const p = {id:Date.now().toString(),name:newName.trim(),desc:"",context:"",notes:"",createdAt:new Date().toISOString(),color:"#"+(Math.random()*0xFFFFFF|0).toString(16).padStart(6,"0")};
    saveProjects([...projects,p]);
    setNewName("");
    setActiveProj(p.id);
  };
  const updateProject = (id, patch) => { saveProjects(projects.map(p=>p.id===id?{...p,...patch}:p)); };
  const deleteProject = (id) => { if(window.confirm("Supprimer ce projet ?")) { saveProjects(projects.filter(p=>p.id!==id)); if(activeProj===id) setActiveProj(null); }};

  const active = projects.find(p=>p.id===activeProj);

  return (
    <div style={{flex:1,display:"flex",overflow:"hidden"}}>
      {/* Sidebar */}
      <div style={{width:200,flexShrink:0,borderRight:"1px solid var(--bd)",display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{padding:"10px 12px",borderBottom:"1px solid var(--bd)",background:"var(--s1)"}}>
          <div style={{fontFamily:"var(--font-display)",fontWeight:700,fontSize:11,color:"var(--ac)",marginBottom:8}}>📁 Projets</div>
          <div style={{display:"flex",gap:5}}>
            <input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="Nouveau projet…"
              onKeyDown={e=>{if(e.key==="Enter")createProject();}}
              style={{flex:1,background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:4,color:"var(--tx)",fontSize:8,padding:"4px 7px",outline:"none"}}/>
            <button onClick={createProject} style={{background:"rgba(212,168,83,.15)",border:"1px solid rgba(212,168,83,.4)",borderRadius:4,color:"var(--ac)",fontSize:11,cursor:"pointer",padding:"2px 7px"}}>＋</button>
          </div>
        </div>
        {/* Templates */}
        <div style={{padding:"8px 10px",borderBottom:"1px solid var(--bd)",background:"var(--s2)",flexShrink:0}}>
          <div style={{fontSize:7,color:"var(--mu)",fontWeight:700,letterSpacing:1,marginBottom:6}}>TEMPLATES</div>
          <div style={{display:"flex",flexDirection:"column",gap:4}}>
            {PROJECT_TEMPLATES.map(tpl=>(
              <button key={tpl.id} onClick={()=>{
                const p={id:Date.now().toString(),name:tpl.name,desc:tpl.desc,context:tpl.context,notes:tpl.notes,createdAt:new Date().toISOString(),color:tpl.color};
                saveProjects([...projects,p]);
                setActiveProj(p.id);
              }}
              style={{padding:"5px 8px",borderRadius:5,border:"1px solid "+tpl.color+"33",background:tpl.color+"0D",color:tpl.color,fontSize:8,cursor:"pointer",textAlign:"left",fontWeight:600,transition:"all .15s"}}>
                {tpl.icon} {tpl.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{flex:1,overflow:"auto"}}>
          {projects.length===0&&<div style={{padding:16,fontSize:9,color:"var(--mu)",textAlign:"center"}}>Aucun projet</div>}
          {projects.map(p=>(
            <div key={p.id} onClick={()=>setActiveProj(p.id)}
              style={{padding:"9px 12px",cursor:"pointer",borderBottom:"1px solid var(--bd)",background:activeProj===p.id?"rgba(212,168,83,.08)":"transparent",borderLeft:"3px solid "+(activeProj===p.id?p.color:"transparent"),transition:"all .15s"}}>
              <div style={{fontSize:10,fontWeight:600,color:activeProj===p.id?"var(--ac)":"var(--tx)",marginBottom:2}}>{p.name}</div>
              <div style={{fontSize:7,color:"var(--mu)"}}>{new Date(p.createdAt).toLocaleDateString("fr-FR")}</div>
            </div>
          ))}
        </div>
      </div>
      {/* Main */}
      <div style={{flex:1,overflow:"auto",padding:"14px 16px"}}>
        {!active&&<div style={{textAlign:"center",padding:40,color:"var(--mu)",fontSize:10}}>Sélectionne ou crée un projet</div>}
        {active&&(
          <>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
              <div style={{width:12,height:12,borderRadius:"50%",background:active.color,flexShrink:0}}/>
              <input value={active.name} onChange={e=>updateProject(active.id,{name:e.target.value})}
                style={{fontSize:16,fontWeight:700,background:"transparent",border:"none",color:"var(--tx)",fontFamily:"var(--font-display)",outline:"none",flex:1}}/>
              <button onClick={()=>deleteProject(active.id)} style={{fontSize:9,padding:"3px 8px",background:"rgba(248,113,113,.1)",border:"1px solid rgba(248,113,113,.3)",borderRadius:4,color:"var(--red)",cursor:"pointer"}}>🗑 Supprimer</button>
            </div>
            <div style={{marginBottom:12}}>
              <div style={{fontSize:8,color:"var(--mu)",fontWeight:700,marginBottom:5}}>DESCRIPTION</div>
              <textarea value={active.desc||""} onChange={e=>updateProject(active.id,{desc:e.target.value})} placeholder="Description courte du projet…" rows={2}
                style={{width:"100%",background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:6,color:"var(--tx)",fontSize:10,padding:"8px 10px",fontFamily:"var(--font-ui)",resize:"vertical",outline:"none",boxSizing:"border-box"}}/>
            </div>
            <div style={{marginBottom:12}}>
              <div style={{fontSize:8,color:"var(--mu)",fontWeight:700,marginBottom:5}}>CONTEXTE IA (injecté dans chaque message)</div>
              <textarea value={active.context||""} onChange={e=>updateProject(active.id,{context:e.target.value})} placeholder="Contexte persistant : technologies utilisées, objectifs, contraintes… L'IA aura ce contexte en mémoire pour tout le projet." rows={4}
                style={{width:"100%",background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:6,color:"var(--tx)",fontSize:10,padding:"8px 10px",fontFamily:"var(--font-ui)",resize:"vertical",outline:"none",boxSizing:"border-box"}}/>
            </div>
            <div style={{marginBottom:12}}>
              <div style={{fontSize:8,color:"var(--mu)",fontWeight:700,marginBottom:5}}>NOTES PROJET</div>
              <textarea value={active.notes||""} onChange={e=>updateProject(active.id,{notes:e.target.value})} placeholder="Notes, idées, liens utiles…" rows={5}
                style={{width:"100%",background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:6,color:"var(--tx)",fontSize:10,padding:"8px 10px",fontFamily:"var(--font-ui)",resize:"vertical",outline:"none",boxSizing:"border-box"}}/>
            </div>
            <button onClick={()=>{
              const ctx = active.context ? "[Projet: "+active.name+"]\n"+active.context+"\n\n" : "";
              setChatInput(ctx);
              navigateTab("chat");
            }} style={{padding:"7px 16px",background:"rgba(212,168,83,.15)",border:"1px solid rgba(212,168,83,.4)",borderRadius:6,color:"var(--ac)",fontSize:9,cursor:"pointer",fontFamily:"var(--font-mono)",fontWeight:700}}>
              ◈ Ouvrir dans le Chat avec ce contexte
            </button>
          </>
        )}
      </div>
    </div>
  );
}


// ── PromptBuilderModal ──────────────────────────────────────────
function PromptBuilderModal({ onInsert, onClose, enabled, apiKeys }) {
  const BLOCKS = [
    { key:"role",    label:"🎭 Rôle",      placeholder:"Tu es un expert en...",      examples:["développeur senior React","copywriter professionnel","analyste financier","coach de vie"] },
    { key:"context", label:"📋 Contexte",  placeholder:"Voici le contexte...",       examples:["Je travaille sur une app web","Mon audience est débutante","C'est pour un usage professionnel"] },
    { key:"task",    label:"✅ Tâche",     placeholder:"Ta mission est de...",       examples:["Rédige un article","Analyse ce code","Génère 5 idées","Explique simplement"] },
    { key:"format",  label:"📐 Format",    placeholder:"Réponds avec...",            examples:["bullet points","tableau markdown","JSON","3 paragraphes max","étapes numérotées"] },
    { key:"rules",   label:"⚠️ Contraintes", placeholder:"Contraintes : ...",       examples:["sans jargon technique","en français uniquement","max 200 mots","avec des exemples concrets"] },
  ];
  const [blocks, setBlocks] = React.useState({role:"",context:"",task:"",format:"",rules:""});
  const [optimizing, setOptimizing] = React.useState(false);

  const assembled = BLOCKS.filter(b=>blocks[b.key]?.trim()).map(b=>blocks[b.key].trim()).join("\n\n");

  const optimizePrompt = async () => {
    if (!assembled.trim()) return;
    setOptimizing(true);
    const activeIds = Object.keys(MODEL_DEFS).filter(id=>enabled[id]&&!MODEL_DEFS[id]?.serial);
    const id = activeIds.find(i=>["groq","mistral"].includes(i))||activeIds[0];
    if (!id) { setOptimizing(false); return; }
    try {
      const r = await callModel(id,[{role:"user",content:"Améliore et optimise ce prompt pour obtenir les meilleures réponses IA. Garde la même structure mais rends-le plus précis et efficace. Réponds uniquement avec le prompt amélioré:\n\n"+assembled}],apiKeys,"Expert prompt engineering.");
      onInsert(r.trim());
      onClose();
    } catch(e) { onInsert(assembled); onClose(); }
    setOptimizing(false);
  };

  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:9200,background:"rgba(0,0,0,.88)",display:"flex",alignItems:"center",justifyContent:"center",padding:16,backdropFilter:"blur(8px)"}}>
      <div onClick={e=>e.stopPropagation()} style={{width:"min(680px,96vw)",maxHeight:"90vh",background:"var(--bg)",border:"1px solid var(--bd)",borderRadius:12,overflow:"auto",display:"flex",flexDirection:"column"}}>
        <div style={{padding:"12px 16px",borderBottom:"1px solid var(--bd)",background:"var(--s1)",display:"flex",alignItems:"center",gap:10,position:"sticky",top:0,zIndex:2}}>
          <span style={{fontSize:14}}>🧱</span>
          <div style={{flex:1,fontFamily:"var(--font-display)",fontWeight:800,fontSize:13,color:"var(--tx)"}}>Prompt Builder</div>
          <button onClick={onClose} style={{background:"none",border:"1px solid var(--bd)",borderRadius:4,color:"var(--mu)",fontSize:14,width:28,height:28,cursor:"pointer"}}>✕</button>
        </div>
        <div style={{padding:"12px 16px",display:"flex",flexDirection:"column",gap:10}}>
          {BLOCKS.map(block=>(
            <div key={block.key}>
              <div style={{fontSize:9,fontWeight:700,color:"var(--mu)",marginBottom:4}}>{block.label}</div>
              <textarea value={blocks[block.key]} onChange={e=>setBlocks(p=>({...p,[block.key]:e.target.value}))}
                placeholder={block.placeholder} rows={2}
                style={{width:"100%",background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:6,color:"var(--tx)",fontSize:10,padding:"7px 10px",fontFamily:"var(--font-ui)",resize:"vertical",outline:"none",boxSizing:"border-box"}}/>
              <div style={{display:"flex",gap:4,marginTop:3,flexWrap:"wrap"}}>
                {block.examples.map(ex=>(
                  <button key={ex} onClick={()=>setBlocks(p=>({...p,[block.key]:p[block.key]?(p[block.key]+", "+ex):ex}))}
                    style={{fontSize:7,padding:"1px 7px",background:"rgba(96,165,250,.08)",border:"1px solid rgba(96,165,250,.2)",borderRadius:3,color:"var(--blue)",cursor:"pointer"}}>
                    + {ex}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        {assembled&&(
          <div style={{padding:"10px 16px",borderTop:"1px solid var(--bd)",background:"var(--s2)"}}>
            <div style={{fontSize:8,color:"var(--mu)",fontWeight:700,marginBottom:5}}>APERÇU</div>
            <div style={{fontSize:9,color:"var(--tx)",lineHeight:1.6,maxHeight:100,overflow:"auto",fontStyle:"italic"}}>{assembled.slice(0,300)}{assembled.length>300?"…":""}</div>
          </div>
        )}
        <div style={{padding:"12px 16px",borderTop:"1px solid var(--bd)",display:"flex",gap:8}}>
          <button onClick={()=>{onInsert(assembled);onClose();}} disabled={!assembled.trim()}
            style={{flex:1,padding:"8px",background:"rgba(212,168,83,.15)",border:"1px solid rgba(212,168,83,.4)",borderRadius:7,color:"var(--ac)",fontSize:10,cursor:"pointer",fontWeight:700,opacity:assembled.trim()?.4:1}}>
            ↗ Insérer dans le Chat
          </button>
          <button onClick={optimizePrompt} disabled={optimizing||!assembled.trim()}
            style={{flex:1,padding:"8px",background:"rgba(167,139,250,.1)",border:"1px solid rgba(167,139,250,.3)",borderRadius:7,color:"#A78BFA",fontSize:10,cursor:"pointer",fontWeight:700}}>
            {optimizing?"⟳ Optimisation…":"✦ Optimiser avec l'IA"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── AideTab ──────────────────────────────────────────────────────
const TUTORIALS = [
  { id:"t01", num:"01", icon:"🤖", title:"Bienvenue sur Multi-IA Hub",   sub:"Présentation générale · 6 slides",        color:"#D4A853", level:"Débutant",       file:"tuto_01_bienvenue.html" },
  { id:"t02", num:"02", icon:"💬", title:"Premier Chat & Clés API",       sub:"Configurer les IAs gratuites · 6 slides", color:"#60A5FA", level:"Débutant",       file:"tuto_02_premier_chat.html" },
  { id:"t03", num:"03", icon:"🧭", title:"Le Smart Router",               sub:"Analyse de fichiers auto · 5 slides",     color:"#A78BFA", level:"Débutant",       file:"tuto_03_smart_router.html" },
  { id:"t04", num:"04", icon:"⚡", title:"Le Débat Multi-IAs",            sub:"Analyser sous tous les angles · 5 slides",color:"#F97316", level:"Intermédiaire",  file:"tuto_04_debat.html" },
  { id:"t05", num:"05", icon:"⬡", title:"ComfyUI — Images locales",       sub:"Générer avec ta GPU · 5 slides",          color:"#A78BFA", level:"Intermédiaire",  file:"tuto_05_comfyui.html" },
  { id:"t06", num:"06", icon:"🔀", title:"Les Workflows",                 sub:"Automatiser des tâches · 5 slides",       color:"#F97316", level:"Intermédiaire",  file:"tuto_06_workflows.html" },
  { id:"t07", num:"07", icon:"🧱", title:"Prompt Builder",                sub:"Écrire de meilleurs prompts · 5 slides",  color:"#D4A853", level:"Intermédiaire",  file:"tuto_07_prompt_builder.html" },
];

function AideTab() {
  const [activeTuto, setActiveTuto] = React.useState(null);
  const [filterLevel, setFilterLevel] = React.useState("all");
  const [search, setSearch] = React.useState("");
  const [iframeLoaded, setIframeLoaded] = React.useState(false);

  const filtered = TUTORIALS.filter(t => {
    if (filterLevel !== "all" && t.level !== filterLevel) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return t.title.toLowerCase().includes(q) || t.sub.toLowerCase().includes(q) || t.level.toLowerCase().includes(q);
    }
    return true;
  });

  const openTuto = (tuto) => {
    setIframeLoaded(false);
    setActiveTuto(tuto);
  };

  // ── VIEWER ──
  if (activeTuto) {
    return (
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {/* Topbar */}
        <div style={{padding:"7px 14px",borderBottom:"1px solid var(--bd)",background:"var(--s1)",display:"flex",alignItems:"center",gap:10,flexShrink:0,zIndex:10}}>
          <button onClick={()=>setActiveTuto(null)}
            style={{background:"transparent",border:"1px solid var(--bd)",borderRadius:5,color:"var(--mu)",fontSize:9,padding:"3px 10px",cursor:"pointer",fontFamily:"var(--font-mono)"}}>
            ← Retour
          </button>
          <span style={{fontSize:10,fontWeight:700,color:"var(--tx)",fontFamily:"var(--font-display)"}}>{activeTuto.icon} {activeTuto.title}</span>
          <span style={{marginLeft:"auto",fontSize:8,padding:"2px 8px",borderRadius:4,background:"rgba(255,255,255,.05)",color:"var(--mu)",fontFamily:"var(--font-mono)"}}>{activeTuto.level}</span>
          <button onClick={()=>window.open("tutos/"+activeTuto.file,"_blank")}
            style={{background:"transparent",border:"1px solid var(--bd)",borderRadius:5,color:"var(--mu)",fontSize:9,padding:"3px 10px",cursor:"pointer",fontFamily:"var(--font-mono)"}}>
            ⛶ Plein écran
          </button>
        </div>

        {/* iFrame viewer */}
        <div style={{flex:1,position:"relative",background:"var(--bg)"}}>
          {!iframeLoaded && (
            <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12,color:"var(--mu)",fontSize:12}}>
              <div style={{fontSize:32,animation:"spin 1s linear infinite"}}>⟳</div>
              <span style={{fontFamily:"var(--font-mono)",fontSize:10}}>Chargement du tuto…</span>
              <span style={{fontSize:9,opacity:.6,maxWidth:300,textAlign:"center"}}>
                Si le tuto ne s'affiche pas, place les fichiers HTML dans <code style={{color:"var(--ac)"}}>public/tutos/</code> de ton projet
              </span>
            </div>
          )}
          <iframe
            key={activeTuto.file}
            src={"tutos/" + activeTuto.file}
            style={{width:"100%",height:"100%",border:"none",display:iframeLoaded?"block":"block",opacity:iframeLoaded?1:0,transition:"opacity .3s"}}
            onLoad={()=>setIframeLoaded(true)}
            title={activeTuto.title}
            allow="fullscreen"
          />
        </div>
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  // ── LIBRARY ──
  return (
    <div style={{flex:1,overflow:"auto",padding:"clamp(10px,2vw,20px)"}}>
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16,flexWrap:"wrap"}}>
        <div style={{fontFamily:"var(--font-display)",fontWeight:800,fontSize:"clamp(14px,2.5vw,20px)",color:"var(--ac)"}}>❓ Centre d'aide</div>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Chercher un tuto…"
          style={{flex:1,minWidth:140,background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:6,color:"var(--tx)",fontSize:9,padding:"5px 10px",fontFamily:"var(--font-ui)",outline:"none"}}/>
        <div style={{display:"flex",gap:5}}>
          {["all","Débutant","Intermédiaire"].map(lvl=>(
            <button key={lvl} onClick={()=>setFilterLevel(lvl)}
              style={{fontSize:8,padding:"3px 9px",borderRadius:5,border:"1px solid "+(filterLevel===lvl?"var(--ac)":"var(--bd)"),
                background:filterLevel===lvl?"rgba(212,168,83,.12)":"transparent",
                color:filterLevel===lvl?"var(--ac)":"var(--mu)",cursor:"pointer",fontFamily:"var(--font-mono)"}}>
              {lvl==="all"?"Tous":lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Quick start banner */}
      <div style={{marginBottom:16,padding:"12px 16px",background:"rgba(212,168,83,.06)",border:"1px solid rgba(212,168,83,.2)",borderRadius:10,display:"flex",alignItems:"center",gap:12}}>
        <span style={{fontSize:24,flexShrink:0}}>🚀</span>
        <div>
          <div style={{fontFamily:"var(--font-display)",fontWeight:700,fontSize:12,color:"var(--ac)",marginBottom:2}}>Nouveau sur Multi-IA Hub ?</div>
          <div style={{fontSize:9,color:"var(--mu)"}}>Commence par le Tuto 01 — présentation complète de l'app en quelques slides.</div>
        </div>
        <button onClick={()=>openTuto(TUTORIALS[0])}
          style={{marginLeft:"auto",padding:"6px 14px",background:"rgba(212,168,83,.15)",border:"1px solid rgba(212,168,83,.4)",
            borderRadius:6,color:"var(--ac)",fontSize:9,cursor:"pointer",fontFamily:"var(--font-mono)",fontWeight:700,flexShrink:0}}>
          ▶ Commencer
        </button>
      </div>

      {/* Tutorial grid */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:10,marginBottom:16}}>
        {filtered.map(tuto=>(
          <div key={tuto.id} onClick={()=>openTuto(tuto)}
            style={{background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:10,overflow:"hidden",cursor:"pointer",transition:"all .2s"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=tuto.color+"66";e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 8px 24px "+tuto.color+"15";}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--bd)";e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="none";}}>
            <div style={{height:3,background:"linear-gradient(90deg,"+tuto.color+","+tuto.color+"88)"}}/>
            <div style={{padding:"12px 14px"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:7}}>
                <span style={{fontSize:22}}>{tuto.icon}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:8,color:"var(--mu)",fontFamily:"var(--font-mono)",marginBottom:1}}>TUTO {tuto.num}</div>
                  <div style={{fontFamily:"var(--font-display)",fontWeight:700,fontSize:11,color:"var(--tx)",lineHeight:1.2}}>{tuto.title}</div>
                </div>
                <span style={{fontSize:7,padding:"2px 6px",borderRadius:3,background:"rgba(255,255,255,.05)",color:"var(--mu)",fontFamily:"var(--font-mono)",flexShrink:0}}>{tuto.level}</span>
              </div>
              <div style={{fontSize:9,color:"var(--mu)",marginBottom:8}}>{tuto.sub}</div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div style={{display:"flex",gap:3}}>
                  {tuto.level==="Débutant"
                    ? <span style={{fontSize:7,padding:"1px 6px",background:"rgba(74,222,128,.08)",border:"1px solid rgba(74,222,128,.2)",borderRadius:8,color:"var(--green)"}}>Débutant</span>
                    : <span style={{fontSize:7,padding:"1px 6px",background:"rgba(212,168,83,.08)",border:"1px solid rgba(212,168,83,.2)",borderRadius:8,color:"var(--ac)"}}>Intermédiaire</span>
                  }
                </div>
                <span style={{fontSize:9,color:tuto.color,opacity:.7}}>▶ Voir</span>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{gridColumn:"1/-1",textAlign:"center",padding:"40px 20px",color:"var(--mu)",fontSize:12}}>
            Aucun tuto trouvé pour "{search}"
          </div>
        )}
      </div>

      {/* FAQ */}
      <div style={{padding:"12px 16px",background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:10}}>
        <div style={{fontSize:9,color:"var(--mu)",fontWeight:700,marginBottom:10,letterSpacing:1,fontFamily:"var(--font-mono)"}}>QUESTIONS FRÉQUENTES</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:6}}>
          {[
            ["C'est quoi une clé API ?","t02"],
            ["Comment obtenir Groq gratuit ?","t02"],
            ["Quelle IA choisir pour débuter ?","t01"],
            ["ComfyUI — comment installer ?","t05"],
            ["Comment automatiser ?","t06"],
            ["Comment améliorer mes prompts ?","t07"],
          ].map(([q,tid])=>(
            <div key={q} onClick={()=>openTuto(TUTORIALS.find(t=>t.id===tid))}
              style={{padding:"6px 10px",borderRadius:6,background:"var(--s2)",border:"1px solid var(--bd)",fontSize:9,color:"var(--mu)",cursor:"pointer",transition:"all .15s"}}
              onMouseEnter={e=>{e.currentTarget.style.color="var(--tx)";e.currentTarget.style.borderColor="var(--ac)";}}
              onMouseLeave={e=>{e.currentTarget.style.color="var(--mu)";e.currentTarget.style.borderColor="var(--bd)";}}>
              ❓ {q}
            </div>
          ))}
        </div>
      </div>

      {/* Install note */}
      <div style={{marginTop:12,padding:"10px 14px",background:"rgba(96,165,250,.05)",border:"1px solid rgba(96,165,250,.15)",borderRadius:8,fontSize:9,color:"var(--mu)",lineHeight:1.6}}>
        📂 <strong style={{color:"var(--tx)"}}>Pour afficher les tutos dans l'app :</strong> place les fichiers HTML dans le dossier <code style={{color:"var(--ac)",background:"rgba(212,168,83,.08)",padding:"1px 5px",borderRadius:3}}>public/tutos/</code> de ton projet Vite.
        Les tutos s'ouvriront directement en iframe dans cet onglet.
      </div>

      {/* CLI-Anything tunnels guide */}
      <div style={{marginTop:16}}>
        <div style={{fontSize:9,color:"var(--mu)",fontWeight:700,marginBottom:10,letterSpacing:1,fontFamily:"var(--font-mono)"}}>🔀 TUNNELS CLI-ANYTHING — OUTILS LOCAUX OPTIONNELS</div>
        <div style={{fontSize:9,color:"var(--mu)",marginBottom:12,lineHeight:1.7,padding:"8px 12px",background:"rgba(212,168,83,.05)",border:"1px solid rgba(212,168,83,.15)",borderRadius:7}}>
          Les tunnels CLI-Anything permettent à l'app de contrôler des logiciels locaux (GIMP, LibreOffice, Blender…). Ils sont <strong style={{color:"var(--tx)"}}>100% optionnels</strong> — si un logiciel n'est pas installé, l'étape est ignorée et l'app continue normalement.
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:10}}>
          {[
            { icon:"🔌", name:"Relay CLI-Anything", color:"#D4A853", required:true,
              desc:"Pont entre Multi-IA Hub et les logiciels locaux. À lancer une seule fois.",
              steps:["Télécharge cli_relay.py depuis ce projet","python cli_relay.py","Tourne sur http://localhost:5678"] },
            { icon:"📄", name:"LibreOffice", color:"#60A5FA", required:false,
              desc:"Génère des PDF, présentations et documents depuis les Workflows.",
              steps:["Si pas installé : winget install TheDocumentFoundation.LibreOffice","git clone https://github.com/HKUDS/CLI-Anything.git puis cd CLI-Anything\\libreoffice\\agent-harness && pip install -e .","Tester : cli-anything-libreoffice --help"] },
            { icon:"🎨", name:"GIMP", color:"#4ADE80", required:false,
              desc:"Traitement d'images, batch resize, création de visuels.",
              steps:["Si pas installé : winget install GIMP.GIMP","git clone https://github.com/HKUDS/CLI-Anything.git puis cd CLI-Anything\\gimp\\agent-harness && pip install -e .","Tester : cli-anything-gimp --help"] },
            { icon:"🎬", name:"Blender", color:"#F97316", required:false,
              desc:"Rendu 3D, animations, scènes depuis les Workflows.",
              steps:["Si pas installé : winget install BlenderFoundation.Blender","git clone https://github.com/HKUDS/CLI-Anything.git puis cd CLI-Anything\\blender\\agent-harness && pip install -e .","Tester : cli-anything-blender --help"] },
            { icon:"🗺", name:"Draw.io", color:"#A78BFA", required:false,
              desc:"Génère des diagrammes, flowcharts, mind maps automatiquement.",
              steps:["Si pas installé : winget install JGraph.Draw","git clone https://github.com/HKUDS/CLI-Anything.git puis cd CLI-Anything\\drawio\\agent-harness && pip install -e .","Tester : cli-anything-drawio --help"] },
            { icon:"🔴", name:"OBS Studio", color:"#F87171", required:false,
              desc:"Enregistre l'écran pour les tutos vidéo automatiques (Studio Auto).",
              steps:["Si pas installé : winget install OBSProject.OBSStudio","git clone https://github.com/HKUDS/CLI-Anything.git puis cd CLI-Anything\\obs-studio\\agent-harness && pip install -e .","Tester : cli-anything-obs-studio --help"] },
            { icon:"🎞", name:"Kdenlive", color:"#F97316", required:false,
              desc:"Monte les vidéos automatiquement après enregistrement OBS.",
              steps:["Si pas installé : winget install KDE.Kdenlive","git clone https://github.com/HKUDS/CLI-Anything.git puis cd CLI-Anything\\kdenlive\\agent-harness && pip install -e .","Tester : cli-anything-kdenlive --help"] },
            { icon:"🌐", name:"Browser-Use", color:"#4ADE80", required:false,
              desc:"Navigue dans les apps automatiquement pour les tutos vidéo.",
              steps:["PowerShell : pip install browser-use playwright","playwright install chromium","python -m browser_use.server --port 5679"] },
          ].map((tool,i) => (
            <div key={i} style={{padding:"12px 14px",background:"var(--s1)",border:"1px solid "+(tool.required?"rgba(212,168,83,.25)":"var(--bd)"),borderRadius:9}}>
              <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:7}}>
                <span style={{fontSize:18}}>{tool.icon}</span>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:11,color:tool.color}}>{tool.name}</div>
                  <div style={{fontSize:8,color:"var(--mu)"}}>{tool.desc}</div>
                </div>
                {tool.required && <span style={{fontSize:7,padding:"1px 5px",border:"1px solid rgba(212,168,83,.4)",borderRadius:3,color:"var(--ac)"}}>requis</span>}
              </div>
              <div style={{background:"var(--bg)",borderRadius:5,padding:"6px 9px"}}>
                {tool.steps.map((s,si) => (
                  <div key={si} style={{fontSize:8,color:"var(--green)",fontFamily:"var(--font-mono)",lineHeight:1.9,display:"flex",gap:5}}>
                    <span style={{color:"var(--mu)",flexShrink:0}}>{si+1}.</span>{s}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{marginTop:10,padding:"8px 12px",background:"rgba(74,222,128,.05)",border:"1px solid rgba(74,222,128,.15)",borderRadius:7,fontSize:9,color:"var(--mu)"}}>
          💡 <strong style={{color:"var(--tx)"}}>100% gratuit via PowerShell</strong> — les pilotes CLI-Anything sont pré-construits dans le repo GitHub. Un seul <code style={{color:"var(--ac)"}}>git clone</code> suffit, pas besoin de Claude Code ni de payer quoi que ce soit.
        </div>
      </div>
    </div>
  );
}


// ══════════════════════════════════════════════════════════════════
// 🎬 STUDIO AUTO — Générateur de tutos vidéo automatique
// Surcouche optionnelle : Browser-Use + OBS + IA + Kdenlive
// Si un outil est absent → l'étape est ignorée, le reste continue
// ══════════════════════════════════════════════════════════════════

const STUDIO_QUESTIONS = [
  { id:"subject",   label:"Sur quoi porte le tuto ?",         placeholder:"Ex : L'onglet Smart Router de Multi-IA Hub", type:"text" },
  { id:"url",       label:"URL ou application à filmer ?",     placeholder:"Ex : https://multiia-hub.vercel.app ou GIMP local", type:"text" },
  { id:"duration",  label:"Durée cible ?",                     placeholder:"Ex : 2 minutes, 5 minutes", type:"text" },
  { id:"audience",  label:"Pour qui ? (niveau public)",        placeholder:"Ex : Débutants, développeurs, utilisateurs avancés", type:"text" },
  { id:"style",     label:"Style de narration ?",              placeholder:"Ex : Détendu, professionnel, enthousiaste", type:"text" },
  { id:"lang",      label:"Langue du tuto ?",                  placeholder:"Ex : Français, Anglais", type:"text" },
];

const STUDIO_PIPELINE_STEPS = [
  { id:"script",   icon:"✍️", label:"Génération du script",        tool:"IA",           color:"#D4A853" },
  { id:"questions",icon:"💬", label:"Questions de clarification",   tool:"IA",           color:"#60A5FA" },
  { id:"navigate", icon:"🌐", label:"Navigation Browser-Use",       tool:"Browser-Use",  color:"#4ADE80",  optional:true },
  { id:"record",   icon:"🔴", label:"Enregistrement OBS",           tool:"OBS",          color:"#F87171",  optional:true },
  { id:"narration",icon:"🎙", label:"Script narration IA",          tool:"IA",           color:"#A78BFA" },
  { id:"assemble", icon:"🎬", label:"Montage Kdenlive",             tool:"Kdenlive",     color:"#F97316",  optional:true },
  { id:"export",   icon:"📹", label:"Export vidéo finale",          tool:"Kdenlive",     color:"#F97316",  optional:true },
];

// ══════════════════════════════════════════════════════════════════
// 🎬 STUDIO AUTO — Générateur de tutos vidéo automatique
// Surcouche optionnelle : Browser-Use + OBS + IA + Kdenlive
// Si un outil est absent → l'étape est ignorée, le reste continue
// ══════════════════════════════════════════════════════════════════

function StudioTab({ apiKeys, enabled, MODEL_DEFS, callModel, buildSystem, showToast }) {
  // ── État persistant via localStorage ──────────────────────────
  const _load = (key, def) => { try { const v = localStorage.getItem('studio_'+key); return v !== null ? JSON.parse(v) : def; } catch { return def; } };
  const _save = (key, val) => { try { localStorage.setItem('studio_'+key, JSON.stringify(val)); } catch {} };

  const [phase, setPhase]             = React.useState(() => _load('phase', 'intro'));
  const [subject, setSubject]         = React.useState(() => _load('subject', ''));
  const [answers, setAnswers]         = React.useState(() => _load('answers', {}));
  const [aiQuestions, setAiQuestions] = React.useState(() => _load('aiQuestions', []));
  const [aiAnswers, setAiAnswers]     = React.useState(() => _load('aiAnswers', {}));
  const [script, setScript]           = React.useState(() => _load('script', ''));
  const [narration, setNarration]     = React.useState(() => _load('narration', ''));
  const [pipelineLog, setPipelineLog] = React.useState(() => _load('pipelineLog', []));
  const [running, setRunning]         = React.useState(false);
  const [toolStatus, setToolStatus]   = React.useState({ browseruse: null, obs: null, kdenlive: null });

  // Sauvegarde automatique à chaque changement
  React.useEffect(() => { _save('phase', phase); }, [phase]);
  React.useEffect(() => { _save('subject', subject); }, [subject]);
  React.useEffect(() => { _save('answers', answers); }, [answers]);
  React.useEffect(() => { _save('aiQuestions', aiQuestions); }, [aiQuestions]);
  React.useEffect(() => { _save('aiAnswers', aiAnswers); }, [aiAnswers]);
  React.useEffect(() => { _save('script', script); }, [script]);
  React.useEffect(() => { _save('narration', narration); }, [narration]);
  React.useEffect(() => { _save('pipelineLog', pipelineLog); }, [pipelineLog]);

  const firstIA = (Object.keys(enabled || {}).find(id => enabled[id] && MODEL_DEFS?.[id])) || Object.keys(MODEL_DEFS || {})[0] || "";

  // ── Vérification optionnelle des outils ──────────────────────
  const checkTools = async () => {
    const status = { browseruse: false, obs: false, kdenlive: false };
    // Relay CLI-Anything (port 5678) — vérifie OBS, Kdenlive et Browser-Use
    try {
      const r = await fetch("http://localhost:5678/ping", { signal: AbortSignal.timeout(2000) });
      if(r.ok) {
        const d = await r.json();
        status.obs      = d.obs        || false;
        status.kdenlive = d.kdenlive   || false;
        status.browseruse = d.browseruse || false;
      }
    } catch {}
    setToolStatus(status);
    return status;
  };

  const log = (step, status, msg) => {
    setPipelineLog(prev => {
      const existing = prev.findIndex(l => l.step === step);
      const entry = { step, status, msg, ts: Date.now() };
      if(existing >= 0) { const n=[...prev]; n[existing]=entry; return n; }
      return [...prev, entry];
    });
  };

  // ── Phase 1 : l'IA pose des questions de clarification ───────
  const startQuestionsPhase = async () => {
    if(!subject.trim()) { showToast("Décris d'abord le sujet du tuto"); return; }
    setPhase("questions");
    try {
      const prompt = `Tu es un expert en création de tutoriels vidéo. Un utilisateur veut créer un tuto sur : "${subject}".
Pose exactement 5 questions courtes et précises pour t'assurer de créer le meilleur tuto possible.
Format de réponse : JSON array uniquement, sans texte avant ou après.
Exemple : ["Quel est le niveau de l'audience ?","Quelle durée idéale ?","URL ou logiciel à filmer ?","Style de narration ?","Points clés à montrer ?"]`;
      const reply = await callModel(firstIA, [{role:"user",content:prompt}], apiKeys, buildSystem(), null);
      const clean = reply.replace(/```json|```/g,"").trim();
      const questions = JSON.parse(clean);
      const finalQuestions = Array.isArray(questions) ? questions : STUDIO_QUESTIONS.map(q=>q.label);
      setAiQuestions(finalQuestions);
      // Init les réponses vides
      const initAnswers = {};
      finalQuestions.forEach(q => { initAnswers[q] = ""; });
      setAiAnswers(initAnswers);
    } catch(e) {
      const fallback = STUDIO_QUESTIONS.map(q => q.label);
      setAiQuestions(fallback);
      const initAnswers = {};
      fallback.forEach(q => { initAnswers[q] = ""; });
      setAiAnswers(initAnswers);
    }
  };

  // ── Phase 2 : Confirmation avant lancement ────────────────────
  const confirmAndStart = () => {
    setPhase("confirm");
    checkTools();
  };

  // ── Phase 3 : Pipeline complet ────────────────────────────────
  const runPipeline = async () => {
    setPhase("running");
    setRunning(true);
    setPipelineLog([]);
    const tools = await checkTools();

    // ÉTAPE 1 — Génération du script
    log("script","running","Génération du script de tuto…");
    let scriptContent = "";
    try {
      const answersStr = Object.entries(aiAnswers).map(([q,a])=>`${q}: ${a}`).join("\n");
      const prompt = `Crée un script complet de tutoriel vidéo sur : "${subject}".
Informations complémentaires :
${answersStr}

Format du script :
- INTRO (15s) : accroche, présentation du sujet
- PARTIE 1 (30s-1min) : première démonstration
- PARTIE 2 (30s-1min) : fonctionnalité principale  
- ASTUCE (20s) : conseil pratique
- CONCLUSION (15s) : résumé, call-to-action
Pour chaque partie : [TIMECODE] | ACTION À L'ÉCRAN | NARRATION

Sois précis sur ce que l'IA doit cliquer/montrer à l'écran.`;
      scriptContent = await callModel(firstIA, [{role:"user",content:prompt}], apiKeys, buildSystem(), null);
      setScript(scriptContent);
      log("script","done","✅ Script généré");
    } catch(e) { log("script","error","❌ "+e.message); scriptContent = subject; }

    // ÉTAPE 2 — Navigation manuelle (toi tu navigues pendant qu'OBS filme)
    log("navigate","done","🎬 OBS va démarrer — navigue dans l'app pendant l'enregistrement pour démontrer les fonctionnalités. Tu as 30 secondes.");

    // ÉTAPE 3 — Enregistrement OBS (optionnel)
    if(tools.obs) {
      log("record","running","OBS démarre l'enregistrement…");
      try {
        const r = await fetch("http://localhost:5678/obs/record/start", {
          method:"POST", headers:{"Content-Type":"application/json"},
          body: JSON.stringify({}),
          signal: AbortSignal.timeout(10000)
        });
        if(r.ok) {
            log("record","done","✅ OBS enregistre — Ouvre multiia-hub.vercel.app dans ton navigateur maintenant pour que l'écran ne soit pas noir ! Enregistrement pendant 30s…");
            await new Promise(res=>setTimeout(res, 30000)); // 30 secondes d'enregistrement
          }
        else log("record","skip","⚠️ OBS WebSocket non dispo — active-le dans OBS : Outils → WebSocket Server → port 4455");
      } catch { log("record","skip","ℹ️ OBS non disponible — ignoré"); }
    } else {
      log("record","skip","ℹ️ OBS non installé — étape ignorée");
    }

    // ÉTAPE 4 — Génération narration IA
    log("narration","running","Génération du script de narration voix off…");
    let narrationContent = "";
    try {
      const prompt = `À partir de ce script de tuto :\n${scriptContent}\n\nGénère uniquement le texte de narration voix off, sans les indications techniques. Ton naturel, fluide, en ${aiAnswers[aiQuestions[0]] ? "s'adaptant au niveau "+aiAnswers[aiQuestions[0]] : "français"}.`;
      narrationContent = await callModel(firstIA, [{role:"user",content:prompt}], apiKeys, buildSystem(), null);
      setNarration(narrationContent);
      log("narration","done","✅ Narration générée");
    } catch(e) { log("narration","error","❌ "+e.message); }

    // ÉTAPE 5 — Montage Kdenlive (optionnel)
    if(tools.kdenlive) {
      log("assemble","running","Kdenlive assemble la vidéo…");
      try {
        const r = await fetch("http://localhost:5678/execute", {
          method:"POST", headers:{"Content-Type":"application/json"},
          body: JSON.stringify({ command:"cli-anything-kdenlive project new --name tuto_output --width 1920 --height 1080 --fps-num 25 --fps-den 1 --output ./tuto_output.kdenlive", software:"kdenlive" }),
          signal: AbortSignal.timeout(30000)
        });
        if(r.ok) log("assemble","done","✅ Projet Kdenlive créé");
        else log("assemble","skip","⚠️ Kdenlive erreur — ignoré");
      } catch { log("assemble","skip","ℹ️ Kdenlive non disponible — ignoré"); }
    } else {
      log("assemble","skip","ℹ️ Kdenlive non installé — étape ignorée");
    }

    // ÉTAPE 6 — Arrêt OBS
    if(tools.obs) {
      try {
        await fetch("http://localhost:5678/obs/record/stop", {
          method:"POST", headers:{"Content-Type":"application/json"},
          body: JSON.stringify({}),
          signal: AbortSignal.timeout(10000)
        });
        log("export","done","✅ OBS a arrêté l'enregistrement");
      } catch { log("export","skip","ℹ️ OBS stop ignoré"); }
    } else {
      log("export","skip","ℹ️ Export manuel requis — voir script ci-dessous");
    }

    setRunning(false);
    setPhase("done");
  };

  const reset = () => {
    ['phase','subject','answers','aiQuestions','aiAnswers','script','narration','pipelineLog']
      .forEach(k => { try { localStorage.removeItem('studio_'+k); } catch {} });
    setPhase("intro"); setSubject(""); setAnswers({}); setAiQuestions([]); setAiAnswers({});
    setScript(""); setNarration(""); setPipelineLog([]);
  };

  const statusColor = s => s==="done"?"#4ADE80":s==="running"?"#D4A853":s==="error"?"#F87171":"#666674";
  const statusIcon  = s => s==="done"?"✅":s==="running"?"⏳":s==="error"?"❌":"⏸";

  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>

      {/* ── HEADER FIXE ── */}
      <div style={{flexShrink:0,padding:"10px clamp(10px,2vw,20px) 0",borderBottom:"1px solid var(--bd)",background:"var(--bg)"}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:8,flexWrap:"wrap"}}>
          <div style={{fontFamily:"var(--font-display)",fontWeight:800,fontSize:"clamp(14px,2.5vw,18px)",color:"var(--tx)"}}>🎬 Studio Auto</div>
          <div style={{fontSize:9,color:"var(--mu)",flex:1}}>Génère des tutos vidéo automatiquement · Surcouche optionnelle : Browser-Use + OBS + IA + Kdenlive</div>
          {phase !== "intro" && <button onClick={reset} style={{fontSize:9,padding:"4px 10px",border:"1px solid var(--bd)",borderRadius:5,background:"transparent",color:"var(--mu)",cursor:"pointer"}}>↺ Recommencer</button>}
        </div>

        {/* Barre outils compacte */}
        <div style={{display:"flex",gap:6,marginBottom:8,flexWrap:"wrap",alignItems:"center"}}>
          {[
            {key:"browseruse",label:"Browser-Use",icon:"🌐"},
            {key:"obs",       label:"OBS Studio", icon:"🔴"},
            {key:"kdenlive",  label:"Kdenlive",   icon:"🎬"},
          ].map(t => (
            <div key={t.key} style={{padding:"3px 9px",borderRadius:5,border:"1px solid "+(toolStatus[t.key]?"rgba(74,222,128,.3)":"var(--bd)"),background:toolStatus[t.key]?"rgba(74,222,128,.06)":"var(--s1)",display:"flex",alignItems:"center",gap:5,fontSize:8,color:toolStatus[t.key]?"var(--green)":"var(--mu)"}}>
              {t.icon} {t.label} <span style={{opacity:.6}}>{toolStatus[t.key]?"● actif":"○ opt."}</span>
            </div>
          ))}
          <button onClick={checkTools} style={{fontSize:8,padding:"3px 8px",border:"1px solid var(--bd)",borderRadius:4,background:"transparent",color:"var(--mu)",cursor:"pointer"}}>🔄</button>
        </div>
      </div>

      {/* ── CONTENU SCROLLABLE ── */}
      <div style={{flex:"1 1 0",overflow:"auto",minHeight:0,padding:"clamp(10px,2vw,20px)"}}>


        {/* ══ GUIDE D'INSTALLATION ══ */}
        <div style={{marginBottom:10,padding:"6px 12px",background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:7,fontSize:9,color:"var(--mu)",display:"flex",alignItems:"center",gap:8}}>
          💡 Outils non installés ? Consulte l'onglet <strong style={{color:"var(--ac)"}}>❓ Aide</strong> → section "Tunnels CLI-Anything" pour les commandes PowerShell.
        </div>

        {/* ══ PHASE : INTRO ══ */}
        {phase === "intro" && (
          <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
            {/* Explication */}
            <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <div style={{maxWidth:500,textAlign:"center",padding:"0 20px"}}>
                <div style={{fontSize:32,marginBottom:12}}>🎬</div>
                <div style={{fontWeight:800,fontSize:16,color:"var(--tx)",marginBottom:8}}>Crée un tuto vidéo automatiquement</div>
                <div style={{fontSize:10,color:"var(--mu)",lineHeight:1.8}}>
                  L'IA pose des questions · tu confirmes · le pipeline génère le script, la narration, et filme avec OBS
                </div>
                {!firstIA && <div style={{marginTop:10,fontSize:9,color:"var(--red)"}}>⚠️ Active au moins une IA dans l'onglet Config</div>}
              </div>
            </div>
            {/* Barre de saisie style Chat */}
            <div style={{flexShrink:0,borderTop:"1px solid var(--bd)",padding:"10px 14px",background:"var(--s1)"}}>
              <div style={{fontSize:9,color:"var(--mu)",marginBottom:6,fontFamily:"var(--font-mono)"}}>SUJET DU TUTO</div>
              <div className="ir">
                <div className="ta-wrap">
                  <textarea rows={2} value={subject} onChange={e=>setSubject(e.target.value)}
                    placeholder="Ex : Comment utiliser le Smart Router de Multi-IA Hub…"
                    onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();startQuestionsPhase();}}}
                    style={{fontSize:12,resize:"none"}}
                  />
                </div>
                <button className="sbtn" onClick={startQuestionsPhase}
                  disabled={!subject.trim()||!firstIA}
                  title="L'IA pose ses questions">↑</button>
              </div>
            </div>
          </div>
        )}

        {/* ══ PHASE : QUESTIONS IA ══ */}
        {phase === "questions" && (
          <div style={{maxWidth:620}}>
            <div style={{marginBottom:16,padding:"10px 14px",background:"rgba(96,165,250,.06)",border:"1px solid rgba(96,165,250,.2)",borderRadius:8,fontSize:10,color:"var(--blue)"}}>
              💬 L'IA a besoin de quelques précisions pour créer le meilleur tuto possible sur : <strong>"{subject}"</strong>
            </div>
            {aiQuestions.length === 0 ? (
              <div style={{fontSize:11,color:"var(--mu)"}}>⏳ L'IA génère ses questions…</div>
            ) : (
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                {aiQuestions.map((q,i) => (
                  <div key={i}>
                    <div style={{fontSize:10,color:"var(--tx)",fontWeight:700,marginBottom:5}}>{i+1}. {q}</div>
                    <input
                      value={aiAnswers[q]||""}
                      onChange={e=>setAiAnswers(prev=>({...prev,[q]:e.target.value}))}
                      placeholder="Ta réponse…"
                      style={{width:"100%",background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:6,color:"var(--tx)",fontSize:10,padding:"7px 10px",outline:"none"}}
                    />
                  </div>
                ))}
                <button
                  onClick={confirmAndStart}
                  disabled={aiQuestions.some(q => !aiAnswers[q]?.trim())}
                  style={{marginTop:8,padding:"10px 24px",background:"linear-gradient(135deg,#60A5FA,#93C5FD)",border:"none",borderRadius:8,color:"var(--bg)",fontWeight:700,fontSize:12,cursor:"pointer",alignSelf:"flex-start",opacity:aiQuestions.some(q=>!aiAnswers[q]?.trim())?0.5:1}}>
                  ✅ Confirmer et lancer le pipeline →
                </button>
                <div style={{fontSize:9,color:"var(--mu)",marginTop:4}}>Réponds à toutes les questions pour continuer</div>
              </div>
            )}
          </div>
        )}

        {/* ══ PHASE : CONFIRMATION ══ */}
        {phase === "confirm" && (
          <div style={{maxWidth:620}}>
            <div style={{marginBottom:16,padding:"14px 16px",background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:10}}>
              <div style={{fontWeight:700,fontSize:12,color:"var(--tx)",marginBottom:10}}>📋 Récapitulatif du tuto</div>
              <div style={{fontSize:10,color:"var(--mu)",marginBottom:5}}><strong style={{color:"var(--tx)"}}>Sujet :</strong> {subject}</div>
              {aiQuestions.map((q,i) => aiAnswers[q] && (
                <div key={i} style={{fontSize:10,color:"var(--mu)",marginBottom:3}}>
                  <strong style={{color:"var(--tx)"}}>{q} :</strong> {aiAnswers[q]}
                </div>
              ))}
            </div>
            <div style={{marginBottom:14,fontSize:10,color:"var(--mu)"}}>
              <strong style={{color:"var(--tx)"}}>Outils disponibles :</strong>
              {[["Browser-Use","browseruse","🌐"],["OBS","obs","🔴"],["Kdenlive","kdenlive","🎬"]].map(([label,key,icon])=>(
                <span key={key} style={{marginLeft:8,padding:"2px 7px",borderRadius:4,background:toolStatus[key]?"rgba(74,222,128,.1)":"rgba(255,255,255,.05)",border:"1px solid "+(toolStatus[key]?"rgba(74,222,128,.3)":"var(--bd)"),color:toolStatus[key]?"var(--green)":"var(--mu)"}}>
                  {icon} {label} {toolStatus[key]?"✓":"(ignoré)"}
                </span>
              ))}
            </div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={runPipeline} style={{padding:"10px 24px",background:"linear-gradient(135deg,#4ADE80,#22C55E)",border:"none",borderRadius:8,color:"var(--bg)",fontWeight:700,fontSize:12,cursor:"pointer"}}>
                🚀 Lancer la génération automatique
              </button>
              <button onClick={()=>setPhase("questions")} style={{padding:"10px 16px",background:"transparent",border:"1px solid var(--bd)",borderRadius:8,color:"var(--mu)",fontSize:11,cursor:"pointer"}}>
                ← Modifier
              </button>
            </div>
          </div>
        )}

        {/* ══ PHASE : RUNNING + DONE ══ */}
        {(phase === "running" || phase === "done") && (
          <div style={{maxWidth:680}}>
            {/* Pipeline steps */}
            <div style={{marginBottom:20}}>
              <div style={{fontSize:10,fontWeight:700,color:"var(--mu)",fontFamily:"var(--font-mono)",marginBottom:10,letterSpacing:1}}>PIPELINE EN COURS</div>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {STUDIO_PIPELINE_STEPS.map(step => {
                  const entry = pipelineLog.find(l=>l.step===step.id);
                  const status = entry?.status || "pending";
                  return (
                    <div key={step.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",borderRadius:8,background:"var(--s1)",border:"1px solid "+(status==="done"?"rgba(74,222,128,.25)":status==="running"?"rgba(212,168,83,.25)":status==="error"?"rgba(248,113,113,.2)":status==="skip"?"rgba(255,255,255,.04)":"var(--bd)")}}>
                      <span style={{fontSize:18}}>{step.icon}</span>
                      <div style={{flex:1}}>
                        <div style={{fontSize:11,fontWeight:700,color:"var(--tx)",display:"flex",alignItems:"center",gap:6}}>
                          {step.label}
                          {step.optional && <span style={{fontSize:7,padding:"1px 5px",borderRadius:3,background:"rgba(255,255,255,.07)",color:"var(--mu)"}}>optionnel</span>}
                        </div>
                        <div style={{fontSize:9,color:"var(--mu)",fontFamily:"var(--font-mono)"}}>{entry?.msg || "En attente…"}</div>
                      </div>
                      <span style={{fontSize:16}}>{statusIcon(status)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Script généré */}
            {script && (
              <div style={{marginBottom:16}}>
                <div style={{fontSize:10,fontWeight:700,color:"var(--ac)",fontFamily:"var(--font-mono)",marginBottom:8,letterSpacing:1}}>📄 SCRIPT GÉNÉRÉ</div>
                <textarea readOnly value={script}
                  style={{width:"100%",background:"var(--s2)",border:"1px solid rgba(212,168,83,.2)",borderRadius:8,color:"var(--tx)",fontSize:9,padding:"10px 12px",fontFamily:"var(--font-mono)",resize:"vertical",minHeight:140,outline:"none"}}/>
              </div>
            )}

            {/* Narration générée */}
            {narration && (
              <div style={{marginBottom:16}}>
                <div style={{fontSize:10,fontWeight:700,color:"var(--purple,#A78BFA)",fontFamily:"var(--font-mono)",marginBottom:8,letterSpacing:1}}>🎙 NARRATION VOIX OFF</div>
                <textarea readOnly value={narration}
                  style={{width:"100%",background:"var(--s2)",border:"1px solid rgba(167,139,250,.2)",borderRadius:8,color:"var(--tx)",fontSize:9,padding:"10px 12px",fontFamily:"var(--font-ui)",resize:"vertical",minHeight:120,outline:"none",lineHeight:1.7}}/>
                <div style={{marginTop:8,display:"flex",gap:8}}>
                  <button onClick={()=>{navigator.clipboard.writeText(narration);showToast("✓ Narration copiée");}} style={{fontSize:9,padding:"5px 12px",border:"1px solid rgba(167,139,250,.3)",borderRadius:5,background:"rgba(167,139,250,.08)",color:"#A78BFA",cursor:"pointer"}}>📋 Copier la narration</button>
                  <button onClick={()=>{navigator.clipboard.writeText(script);showToast("✓ Script copié");}} style={{fontSize:9,padding:"5px 12px",border:"1px solid rgba(212,168,83,.3)",borderRadius:5,background:"rgba(212,168,83,.08)",color:"var(--ac)",cursor:"pointer"}}>📋 Copier le script</button>
                </div>
              </div>
            )}

            {phase === "done" && (
              <div style={{padding:"12px 16px",background:"rgba(74,222,128,.06)",border:"1px solid rgba(74,222,128,.2)",borderRadius:8,display:"flex",alignItems:"center",gap:12}}>
                <span style={{fontSize:24}}>🎉</span>
                <div>
                  <div style={{fontWeight:700,fontSize:12,color:"var(--green)",marginBottom:3}}>Pipeline terminé !</div>
                  <div style={{fontSize:9,color:"var(--mu)"}}>Script et narration prêts. {!toolStatus.obs && "Enregistre manuellement ton écran avec OBS ou Loom."} {!toolStatus.kdenlive && "Monte la vidéo avec Kdenlive ou CapCut."}</div>
                </div>
                <button onClick={reset} style={{marginLeft:"auto",fontSize:9,padding:"6px 14px",border:"1px solid rgba(74,222,128,.3)",borderRadius:6,background:"rgba(74,222,128,.1)",color:"var(--green)",cursor:"pointer",fontWeight:700}}>+ Nouveau tuto</button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}


function App() {
  const prevTabRef = React.useRef(null);

  // Tab order for transition direction
  const TAB_ORDER = ["aide","studio","router","chat","prompts","redaction","recherche","workflows","medias","comfyui","arena","debate","expert","compare","notes","traducteur","agent","webia","veille","stats","analytics","voice","projects","benchmark","glossaire","autopsy","mentor","dna","conference","consensus","brief","taskia","journaliste","skills","contradict","secondbrain","livedebate","contexttrans","apioptim","civilisations","flash","advanced","config"];
  const navigateTab = (newTab) => {
    const oldIdx = TAB_ORDER.indexOf(prevTabRef.current || "chat");
    const newIdx = TAB_ORDER.indexOf(newTab);
    setTabAnimDir(newIdx > oldIdx ? "right" : newIdx < oldIdx ? "left" : "enter");
    prevTabRef.current = newTab;
    setTab(newTab);
  };

  const [tabAnimDir, setTabAnimDir] = React.useState('enter');
  const [tab, setTab] = useState(() => {
    const VALID_TABS = ["aide","studio","router","chat","prompts","redaction","recherche","workflows","workflow","web","medias","comfyui","arena","debate","expert","compare","notes","traducteur","agent","webia","veille","stats","analytics","voice","projects","benchmark","glossaire","autopsy","mentor","dna","conference","consensus","brief","taskia","journaliste","skills","contradict","secondbrain","livedebate","contexttrans","apioptim","civilisations","flash","advanced","config"];
    // 1. Raccourcis home screen (posé par main.jsx)
    const fromSession = sessionStorage.getItem("multiia_initial_tab");
    if (fromSession) { sessionStorage.removeItem("multiia_initial_tab"); if (VALID_TABS.includes(fromSession)) return fromSession; }
    // 2. Paramètre URL direct ?tab=xxx
    const params = new URLSearchParams(window.location.search);
    const t = params.get("tab");
    return VALID_TABS.includes(t) ? t : "chat";
  });
  const [mobileCol, setMobileCol] = useState("groq");
  const [soloId, setSoloId] = useState(null);
  const [arenaFilter, setArenaFilter] = useState("all");
  const [imgFilter, setImgFilter] = useState("free");
  const [arenaSort, setArenaSort] = useState("score");

  const [enabled, setEnabled] = useState(() => {
    try { const s = localStorage.getItem("multiia_enabled"); return s ? JSON.parse(s) : { groq:true,mistral:true,cohere:false,cerebras:false,sambanova:false,qwen3:false,llama4s:false,gemma2:false,poll_gpt:false,poll_claude:false,poll_deepseek:false,poll_gemini:false }; }
    catch { return { groq:true,mistral:true,cohere:false,cerebras:false,sambanova:false,qwen3:false,llama4s:false,gemma2:false,poll_gpt:false,poll_claude:false,poll_deepseek:false,poll_gemini:false }; }
  });

  const [apiKeys, setApiKeys] = useState(() => {
    try { const s = localStorage.getItem("multiia_keys"); return s ? JSON.parse(s) : { mistral:"",groq_inf:"",cohere:"",cerebras:"",sambanova:"",pollen:"" }; }
    catch { return { mistral:"",groq_inf:"",cohere:"",cerebras:"",sambanova:"",pollen:"" }; }
  });

  useEffect(() => { try { localStorage.setItem("multiia_keys", JSON.stringify(apiKeys)); } catch {} }, [apiKeys]);
  useEffect(() => { try { localStorage.setItem("multiia_enabled", JSON.stringify(enabled)); } catch {} }, [enabled]);

  const [limited, setLimited] = useState({});
  const [countdowns, setCountdowns] = useState({});

  useEffect(() => {
    const iv = setInterval(() => {
      const now = Date.now();
      const newCd = {};
      let changed = false;
      Object.entries(limited).forEach(([id, info]) => {
        const rem = Math.ceil((info.until - now) / 1000);
        if (rem > 0) newCd[id] = rem; else changed = true;
      });
      if (changed) setLimited(prev => { const n={...prev}; Object.keys(n).forEach(id => { if((n[id].until-now)<=0) delete n[id]; }); return n; });
      setCountdowns(newCd);
    }, 1000);
    return () => clearInterval(iv);
  }, [limited]);

  const markLimited = (id, type) => {
    if (type === "credit_warn") return; // Ne pas bloquer sur erreur de crédit — l'utilisateur a peut-être du crédit
    const secs = RATE_LIMIT_COOLDOWN;
    setLimited(prev => ({ ...prev, [id]: { until: Date.now() + secs * 1000, type } }));
  };
  const isLimited = (id) => limited[id] && limited[id].until > Date.now();
  const fmtCd = (id) => { const s = countdowns[id]; if(!s) return ""; return s >= 60 ? `${Math.floor(s/60)}m${s%60}s` : `${s}s`; };

  const exportConv = (id) => {
    const m = MODEL_DEFS[id];
    const msgs = conversations[id];
    if (!msgs || msgs.length === 0) { showToast("Aucune conversation à exporter"); return; }
    const lines = [
      `━━━ Conversation exportée depuis Multi-IA Hub ━━━`,
      `IA : ${m.name} (${m.provider})`,
      `Date : ${new Date().toLocaleString("fr-FR")}`,
      `Messages : ${msgs.filter(x=>x.role!=="error"&&x.role!=="blocked").length}`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      "",
      ...msgs.filter(x => x.role !== "error" && x.role !== "blocked").map(msg => {
        const label = msg.role === "user" ? "👤 Vous" : `🤖 ${m.short}`;
        return `${label} :\n${msg.content}\n`;
      }),
      `━━━ Fin de conversation ━━━`,
      `Copiez ce texte et collez-le dans une autre IA pour continuer.`,
    ];
    const txt = lines.join("\n");
    try {
      const blob = new Blob([txt], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `conv-${m.short.toLowerCase()}-${Date.now()}.txt`;
      a.click(); URL.revokeObjectURL(url);
      showToast(`✓ Conversation ${m.short} exportée`);
    } catch {
      // fallback: modal avec textarea
      const modal = document.createElement("div");
      modal.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px";
      modal.innerHTML = `<div style="background:#1A1A1A;border:1px solid #333;border-radius:10px;padding:20px;max-width:600px;width:100%;max-height:80vh;display:flex;flex-direction:column;gap:12px">
        <div style="font-family:'Syne',sans-serif;font-weight:700;color:#D4A853">📋 Conversation — ${m.name}</div>
        <textarea readonly style="flex:1;min-height:300px;background:#0D0D0D;border:1px solid #333;border-radius:6px;color:#CCC;padding:10px;font-size:11px;font-family:'IBM Plex Mono',monospace;resize:vertical">${txt}</textarea>
        <div style="display:flex;gap:8px;justify-content:flex-end">
          <button onclick="navigator.clipboard.writeText(this.closest('div').previousElementSibling.value)" style="padding:7px 14px;background:rgba(212,168,83,.15);border:1px solid #D4A853;border-radius:5px;color:#D4A853;cursor:pointer;font-family:'IBM Plex Mono',monospace;font-size:11px">⎘ Copier</button>
          <button onclick="this.closest('[style*=fixed]').remove()" style="padding:7px 14px;background:transparent;border:1px solid #333;border-radius:5px;color:#888;cursor:pointer;font-family:'IBM Plex Mono',monospace;font-size:11px">✕ Fermer</button>
        </div>
      </div>`;
      document.body.appendChild(modal);
    }
  };

  const [conversations, setConversations] = useState(() => Object.fromEntries(IDS.map(id => [id, []])));
  const [loading, setLoading] = useState(() => Object.fromEntries(IDS.map(id => [id, false])));
  const abortRefs = React.useRef({}); // {id: AbortController}
  const msgsEndRefs = React.useRef({}); // {id: ref}
  const [chatInput, setChatInput] = useState("");
  const [modal, setModal] = useState(null);
  const [keyDraft, setKeyDraft] = useState("");

  // ── Historique des conversations ──
  const [savedConvs, setSavedConvs] = useState(() => {
    try { return JSON.parse(localStorage.getItem("multiia_history") || "[]"); } catch { return []; }
  });
  const [activeHistId, setActiveHistId] = useState(null);
  const [showHist, setShowHist] = useState(false);
  const [toast, setToast] = useState(null);

  // ── Stats d'usage ───────────────────────────────────────────────
  const STATS_KEY = "multiia_stats";
  const loadStats = () => { try { return JSON.parse(localStorage.getItem(STATS_KEY)||"{}"); } catch { return {}; } };
  const [usageStats, setUsageStats] = React.useState(loadStats);
  const resetStats = () => { setUsageStats({}); localStorage.removeItem(STATS_KEY); };
  React.useEffect(() => { localStorage.setItem(STATS_KEY, JSON.stringify(usageStats)); }, [usageStats]);
  const [cfgDrafts, setCfgDrafts] = useState({});
  const [showExportModal, setShowExportModal] = useState(false);
  const fileRef = useRef(null);
  const msgRefs = useRef(Object.fromEntries(IDS.map(id => [id, null])));

  const [grammarLoading, setGrammarLoading] = useState(false);
  const [grammarResult, setGrammarResult] = useState(null);
  const [showGrammarPopup, setShowGrammarPopup] = useState(false);

  // ── Thème clair/sombre ──
  const [darkMode, setDarkMode] = useState(() => {
    try { return localStorage.getItem("multiia_theme") !== "light"; } catch { return true; }
  });
  useEffect(() => {
    document.documentElement.classList.toggle("light", !darkMode);
    try { localStorage.setItem("multiia_theme", darkMode?"dark":"light"); } catch {}
  }, [darkMode]);

  // ── Mode Focus (1 IA plein écran) ──────────────────────────────
  const [focusId, setFocusId] = useState(null);

  // ── Recherche plein-texte historique ───────────────────────────
  const [histSearch, setHistSearch] = useState("");
  const FOLDERS_KEY = "multiia_hist_folders";
  const [histFolders, setHistFolders] = useState(() => {
    try { return JSON.parse(localStorage.getItem(FOLDERS_KEY) || '["Tout","⭐ Favoris"]'); } catch { return ["Tout","⭐ Favoris"]; }
  });
  const [activeFolder, setActiveFolder] = useState("Tout");
  const [showFolderInput, setShowFolderInput] = useState(false);
  const [folderInput, setFolderInput] = useState("");
  const saveHistFolders = (fl) => { setHistFolders(fl); try { localStorage.setItem(FOLDERS_KEY, JSON.stringify(fl)); } catch {} };
  const addFolder = () => {
    const name = folderInput.trim(); if (!name || histFolders.includes(name)) return;
    saveHistFolders([...histFolders, name]);
    setFolderInput(""); setShowFolderInput(false);
  };
  const moveConvToFolder = (convId, folder) => {
    const updated = savedConvs.map(c => c.id === convId ? {...c, folder} : c);
    setSavedConvs(updated);
    try { localStorage.setItem("multiia_history", JSON.stringify(updated)); } catch {}
  };
  const filteredConvs = savedConvs.filter(c => {
    const matchFolder = activeFolder === "Tout" ? true
      : activeFolder === "⭐ Favoris" ? c.favorite === true
      : (c.folder || "Sans dossier") === activeFolder;
    if (!matchFolder) return false;
    if (!histSearch.trim()) return true;
    const q = histSearch.toLowerCase();
    if (c.title.toLowerCase().includes(q)) return true;
    return Object.values(c.conversations||{}).flat().some(m => m.content?.toLowerCase().includes(q));
  });

  // ── RAG : document long → chunks ───────────────────────────────
  const [ragText, setRagText] = useState("");
  const [ragChunks, setRagChunks] = useState([]);
  const [showRagPanel, setShowRagPanel] = useState(false);
  const processRagText = (text) => {
    const CHUNK = 1200;
    const chunks = [];
    for (let i = 0; i < text.length; i += CHUNK) chunks.push(text.slice(i, i+CHUNK));
    setRagChunks(chunks);
    setRagText(text);
    showToast(`✓ Document découpé en ${chunks.length} morceaux`);
  };
  const getRagContext = (query) => {
    if (!ragChunks.length) return null;
    const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const scored = ragChunks.map((chunk, i) => ({
      chunk, i,
      score: words.reduce((acc, w) => acc + (chunk.toLowerCase().split(w).length - 1), 0)
    })).sort((a,b) => b.score - a.score);
    const top = scored.slice(0, 2).map(s => s.chunk).join("\n\n---\n\n");
    return `[Contexte du document]\n${top}\n\n[Question de l'utilisateur]\n${query}`;
  };

  // ── Ollama local ────────────────────────────────────────────────
  const [ollamaUrl, setOllamaUrl] = useState(() => { try { return localStorage.getItem("multiia_ollama")||"http://localhost:11434"; } catch { return "http://localhost:11434"; } });

  // ── Open WebUI (OpenAI-compatible API) ──────────────────────────
  const OPENWEBUI_DEFAULT = "http://localhost:3000";

// ══ CLI-Anything Bridge ══════════════════════════════════════════
// Pont local optionnel (cli-bridge.js) — fallback auto sur HTTP direct
const CLI_BRIDGE = "http://127.0.0.1:9999";
let _cliBridgeAvailable = null; // null=inconnu, true/false

async function checkCliBridge() {
  if (_cliBridgeAvailable !== null) return _cliBridgeAvailable;
  try {
    const r = await fetch(CLI_BRIDGE + "/status", { signal: AbortSignal.timeout(800) });
    _cliBridgeAvailable = r.ok;
  } catch { _cliBridgeAvailable = false; }
  return _cliBridgeAvailable;
}
// ════════════════════════════════════════════════════════════════


  const [owuiUrl, setOwuiUrl]               = useState(() => { try { return localStorage.getItem("multiia_owui_url")||OPENWEBUI_DEFAULT; } catch { return OPENWEBUI_DEFAULT; } });
  const [owuiKey, setOwuiKey]               = useState(() => { try { return localStorage.getItem("multiia_owui_key")||""; } catch { return ""; } });
  const [owuiModels, setOwuiModels]         = useState([]);
  const [owuiConnected, setOwuiConnected]   = useState(false);
  const [owuiModel, setOwuiModel]           = useState("");
  const [owuiActive, setOwuiActive]         = useState(false);
  const [showOwuiPanel, setShowOwuiPanel]   = useState(false);

  const checkOwui = async (url, key) => {
    const base = (url||owuiUrl).replace(/\/$/, "");
    const apiKey = key !== undefined ? key : owuiKey;
    try {
      const headers = {"Content-Type":"application/json"};
      if (apiKey) headers["Authorization"] = "Bearer "+apiKey;
      const r = await fetch(base+"/api/models", { headers, signal: AbortSignal.timeout(3000) });
      if (r.ok) {
        const d = await r.json();
        // OpenAI-compatible format: {data: [{id:...}]}
        const models = (d.data||d.models||[]).map(m => m.id||m.name).filter(Boolean);
        setOwuiModels(models);
        setOwuiConnected(true);
        if (models.length && !owuiModel) setOwuiModel(models[0]);
        localStorage.setItem("multiia_owui_url", base);
        if (apiKey) localStorage.setItem("multiia_owui_key", apiKey);
        showToast("✓ Open WebUI connecté — "+models.length+" modèle(s)");
        return true;
      }
    } catch {}
    // Fallback: try Ollama models endpoint
    try {
      const r = await fetch((url||owuiUrl).replace(/\/$/, "")+"/api/tags", { signal: AbortSignal.timeout(2000) });
      if (r.ok) {
        const d = await r.json();
        const models = (d.models||[]).map(m=>m.name);
        setOwuiModels(models);
        setOwuiConnected(true);
        if (models.length && !owuiModel) setOwuiModel(models[0]);
        showToast("✓ Open WebUI (Ollama compat) connecté — "+models.length+" modèle(s)");
        return true;
      }
    } catch {}
    setOwuiConnected(false);
    setOwuiModels([]);
    showToast("✗ Open WebUI non trouvé — vérifie l'URL et lance Open WebUI");
    return false;
  };

  const callOwui = async (model, messages, system) => {
    const base = owuiUrl.replace(/\/$/, "");
    const msgs = system ? [{role:"system",content:system},...messages] : messages;
    const headers = {"Content-Type":"application/json"};
    if (owuiKey) headers["Authorization"] = "Bearer "+owuiKey;
    const r = await fetch(base+"/api/chat/completions", {
      method:"POST", headers,
      body: JSON.stringify({ model: model||owuiModel, messages: msgs, stream:false })
    });
    if (!r.ok) throw new Error("Open WebUI "+r.status+" — modèle disponible ?");
    const d = await r.json();
    return d.choices?.[0]?.message?.content || "";
  };
  const [ollamaModels, setOllamaModels] = useState([]);
  const [ollamaConnected, setOllamaConnected] = useState(false);
  const [ollamaActive, setOllamaActive] = useState(false);
  const [ollamaModel, setOllamaModel] = useState("");
  const [showOllamaPanel, setShowOllamaPanel] = useState(false);
  const checkCliRelay = async () => {
    // Vérifie si CLI-Anything relay est disponible (optionnel)
    try {
      const r = await fetch("http://localhost:5678/ping", { signal: AbortSignal.timeout(2000) });
      if (r.ok) { setCliRelayStatus("available"); showToast("✓ CLI-Anything disponible"); return true; }
    } catch {}
    setCliRelayStatus("unavailable");
    return false;
  };

  const checkOllama = async (url) => {
    const base = (url||ollamaUrl).replace(/\/$/, "");

    // ── Tente CLI-Anything bridge d'abord ────────────────────────
    if (await checkCliBridge()) {
      try {
        const br = await fetch(CLI_BRIDGE+"/ollama/models?url="+encodeURIComponent(base), { signal: AbortSignal.timeout(5000) });
        if (br.ok) {
          const bd = await br.json();
          if (bd.models?.length) {
            setOllamaModels(bd.models);
            setOllamaConnected(true);
            if (!ollamaModel) setOllamaModel(bd.models[0]);
            localStorage.setItem("multiia_ollama", base);
            showToast("✓ Ollama connecté via CLI-Anything — "+bd.models.length+" modèle(s)");
            return true;
          }
        }
      } catch {}
    }

    // ── Fallback : HTTP direct (code original) ───────────────────
    try {
      const r = await fetch(base+"/api/tags", { signal: AbortSignal.timeout(3000) });
      if (r.ok) {
        const d = await r.json();
        const models = (d.models||[]).map(m => m.name);
        setOllamaModels(models);
        setOllamaConnected(true);
        if (models.length && !ollamaModel) setOllamaModel(models[0]);
        localStorage.setItem("multiia_ollama", base);
        try {
          const vr = await fetch(base+"/api/version", { signal: AbortSignal.timeout(2000) });
          if (vr.ok) {
            const vd = await vr.json(); const ver = vd.version || "";
            showToast("✓ Ollama "+ver+" connecté — "+models.length+" modèle(s)");
          } else showToast("✓ Ollama connecté — "+models.length+" modèle(s)");
        } catch { showToast("✓ Ollama connecté — "+models.length+" modèle(s)"); }
        return true;
      }
    } catch {}
    setOllamaConnected(false); setOllamaModels([]);
    showToast("✗ Ollama non trouvé — Lance 'ollama serve' sur ton PC");
    return false;
  };
  const callOllama = async (model, messages, system) => {
    const base = ollamaUrl.replace(/\/$/, "");

    // ── Tente CLI-Anything bridge d'abord ────────────────────────
    if (await checkCliBridge()) {
      try {
        const br = await fetch(CLI_BRIDGE+"/ollama/generate", {
          method:"POST", headers:{"Content-Type":"application/json"},
          body: JSON.stringify({ model: model||ollamaModel, messages, system, url: base })
        });
        if (br.ok) {
          const bd = await br.json();
          if (bd.content !== undefined) return bd.content;
        }
      } catch {}
    }

    // ── Fallback : HTTP direct (code original) ───────────────────
    const msgs = system ? [{role:"system",content:system},...messages] : messages;
    const r = await fetch(base+"/api/chat", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ model: model||ollamaModel, messages: msgs, stream: false })
    });
    if (!r.ok) throw new Error("Ollama "+r.status+" — modèle disponible ?");
    const d = await r.json();
    return d.message?.content || "";
  };


  // ══════════════════════════════════════════════════════════════
  // ComfyUI local integration
  // ══════════════════════════════════════════════════════════════
  const COMFY_DEFAULT_URL = "http://127.0.0.1:8188";
  const [comfyUrl, setComfyUrl] = useState(() => {
    try { return localStorage.getItem("multiia_comfy_url")||COMFY_DEFAULT_URL; } catch { return COMFY_DEFAULT_URL; }
  });
  const [comfyConnected, setComfyConnected]     = useState(false);
  const [comfyNodes, setComfyNodes]             = useState({});   // object_info
  const [showComfyPanel, setShowComfyPanel]     = useState(false);
  const [comfyPrompt, setComfyPrompt]           = useState("");
  const [comfyNegPrompt, setComfyNegPrompt]     = useState("blurry, ugly, low quality, watermark");
  const [comfySteps, setComfySteps]             = useState(20);
  const [comfyCfg, setComfyCfg]                 = useState(7);
  const [comfyWidth, setComfyWidth]             = useState(512);
  const [comfyHeight, setComfyHeight]           = useState(512);
  const [comfyModel, setComfyModel]             = useState("");
  const [comfyModels, setComfyModels]           = useState([]);
  const [comfyGenerating, setComfyGenerating]   = useState(false);
  const [comfyProgress, setComfyProgress]       = useState(0);   // 0-100
  const [comfyResult, setComfyResult]           = useState(null); // {url, filename}
  const [comfyError, setComfyError]             = useState("");
  const [comfyWorkflows, setComfyWorkflows]     = useState(() => {
    try { return JSON.parse(localStorage.getItem("multiia_comfy_workflows")||"[]"); } catch { return []; }
  });
  const [comfyActiveWf, setComfyActiveWf]       = useState(null); // loaded workflow JSON
  const [comfyWfName, setComfyWfName]           = useState("");
  const [comfyHistory, setComfyHistory]         = useState([]);  // [{url,prompt,ts}]
  const [comfySubTab, setComfySubTab]           = useState("generate"); // generate|workflows|history|settings
  const [comfyLoras, setComfyLoras]             = useState([]);
  const [comfyActiveLoras, setComfyActiveLoras] = useState([]); // [{name,strength}]
  const [comfySampler, setComfySampler]         = useState("euler");
  const [comfySeed, setComfySeed]               = useState(-1); // -1 = random

  const checkComfy = async (url) => {
    const base = (url||comfyUrl).replace(/\/$/, "");

    // ── Tente CLI-Anything bridge d'abord ────────────────────────
    if (await checkCliBridge()) {
      try {
        const br = await fetch(CLI_BRIDGE+"/comfy/info?url="+encodeURIComponent(base), { signal: AbortSignal.timeout(5000) });
        if (br.ok) {
          const bd = await br.json();
          if (bd.connected !== false) {
            setComfyConnected(true);
            localStorage.setItem("multiia_comfy_url", base);
            if (bd.checkpoints?.length) {
              setComfyModels(bd.checkpoints);
              if (!comfyModel) setComfyModel(bd.checkpoints[0]);
            }
            if (bd.loras?.length) setComfyLoras(bd.loras);
            showToast("✓ ComfyUI connecté via CLI-Anything !");
            return true;
          }
        }
      } catch {}
    }

    // ── Fallback : HTTP direct (code original) ───────────────────
    try {
      const r = await fetch(base+"/system_stats", { signal: AbortSignal.timeout(3000) });
      if (r.ok) {
        setComfyConnected(true);
        localStorage.setItem("multiia_comfy_url", base);
        try {
          const ni = await fetch(base+"/object_info/CheckpointLoaderSimple").then(r=>r.json());
          const models = ni?.CheckpointLoaderSimple?.input?.required?.ckpt_name?.[0] || [];
          setComfyModels(models);
          if (models.length && !comfyModel) setComfyModel(models[0]);
          setComfyNodes(prev=>({...prev, checkpoints:models}));
        } catch {}
        try {
          const li = await fetch(base+"/object_info/LoraLoader").then(r=>r.json());
          const loras = li?.LoraLoader?.input?.required?.lora_name?.[0] || [];
          setComfyLoras(loras);
        } catch {}
        showToast("✓ ComfyUI connecté !");
        return true;
      }
    } catch {}
    setComfyConnected(false); setComfyModels([]);
    showToast("✗ ComfyUI non trouvé — Lance ComfyUI sur ton PC");
    return false;
  };

  // Build a standard txt2img workflow JSON
  const buildComfyWorkflow = (prompt, negPrompt, opts={}) => {
    const { steps=20, cfg=7, width=512, height=512, model="", sampler="euler", seed=-1, loras=[] } = opts;
    const realSeed = seed < 0 ? Math.floor(Math.random()*2**32) : seed;
    let workflow = {
      "1": { class_type:"CheckpointLoaderSimple", inputs:{ ckpt_name: model||comfyModel||"v1-5-pruned-emaonly.ckpt" }},
      "2": { class_type:"CLIPTextEncode", inputs:{ text: prompt, clip:["1",1] }},
      "3": { class_type:"CLIPTextEncode", inputs:{ text: negPrompt||"blurry, ugly, low quality", clip:["1",1] }},
      "4": { class_type:"EmptyLatentImage", inputs:{ width, height, batch_size:1 }},
      "5": { class_type:"KSampler", inputs:{ model:["1",0], positive:["2",0], negative:["3",0], latent_image:["4",0], seed:realSeed, steps, cfg, sampler_name:sampler, scheduler:"karras", denoise:1.0 }},
      "6": { class_type:"VAEDecode", inputs:{ samples:["5",0], vae:["1",2] }},
      "7": { class_type:"SaveImage", inputs:{ images:["6",0], filename_prefix:"multiia" }}
    };
    // Inject LoRAs as a chain
    if (loras.length > 0) {
      loras.forEach((lora, i) => {
        const nodeId = String(10+i);
        const prevModel = i===0 ? ["1",0] : [String(9+i),0];
        const prevClip  = i===0 ? ["1",1] : [String(9+i),1];
        workflow[nodeId] = { class_type:"LoraLoader", inputs:{ model:prevModel, clip:prevClip, lora_name:lora.name, strength_model:lora.strength||1, strength_clip:lora.strength||1 }};
        // Redirect KSampler and CLIPs to use LoRA chain output
        workflow["5"].inputs.model = [nodeId,0];
        workflow["2"].inputs.clip  = [nodeId,1];
        workflow["3"].inputs.clip  = [nodeId,1];
      });
    }
    return workflow;
  };

  // Submit workflow and poll for result
  const generateComfy = async (customWorkflow=null, customPrompt=null) => {
    const base = comfyUrl.replace(/\/$/, "");
    const promptText = customPrompt || comfyPrompt;
    if (!promptText.trim() && !customWorkflow) { showToast("Écris un prompt d'abord"); return; }
    if (!comfyConnected) { await checkComfy(); return; }
    setComfyGenerating(true); setComfyProgress(0); setComfyResult(null); setComfyError("");
    try {
      const wf = customWorkflow || buildComfyWorkflow(promptText, comfyNegPrompt, {
        steps:comfySteps, cfg:comfyCfg, width:comfyWidth, height:comfyHeight,
        model:comfyModel, sampler:comfySampler, seed:comfySeed, loras:comfyActiveLoras
      });
      const body = { prompt: wf, client_id: "multiia-"+Date.now() };
      const qr = await fetch(base+"/prompt", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) });
      if (!qr.ok) throw new Error("Erreur soumission : "+qr.status);
      const { prompt_id } = await qr.json();

      // Poll history for completion
      let attempts = 0;
      while (attempts < 120) {
        await new Promise(r=>setTimeout(r,1000));
        attempts++;
        const hr = await fetch(base+"/history/"+prompt_id);
        if (!hr.ok) continue;
        const hist = await hr.json();
        if (hist[prompt_id]) {
          const outputs = hist[prompt_id].outputs;
          // Find SaveImage output
          for (const nodeId of Object.keys(outputs)) {
            const images = outputs[nodeId]?.images;
            if (images?.length) {
              const img = images[0];
              const imgUrl = base+"/view?filename="+encodeURIComponent(img.filename)+"&subfolder="+encodeURIComponent(img.subfolder||"")+"&type="+encodeURIComponent(img.type||"output");
              setComfyResult({ url:imgUrl, filename:img.filename, prompt:promptText });
              setComfyHistory(prev=>[{url:imgUrl,prompt:promptText,ts:new Date().toISOString(),filename:img.filename},...prev].slice(0,50));
              setComfyGenerating(false);
              setComfyProgress(100);
              showToast("✓ Image générée !");
              return;
            }
          }
        }
        setComfyProgress(Math.min(95, attempts*2));
      }
      throw new Error("Timeout — génération trop longue");
    } catch(e) {
      setComfyError(e.message);
      setComfyGenerating(false);
    }
  };

  // Send generated image to chat
  const sendComfyToChat = (result) => {
    const r = result || comfyResult;
    if (!r) return;
    setChatInput(prev=>(prev?"\n":"")+`![Image ComfyUI](${r.url})\n> Prompt : ${r.prompt}`);
    navigateTab("chat");
    showToast("✓ Image envoyée dans le Chat");
  };

  // Save/load workflow
  const saveComfyWorkflow = (name, wfJson) => {
    const entry = { id:Date.now().toString(), name:name||"Workflow "+comfyWorkflows.length, json:wfJson, ts:new Date().toISOString() };
    const updated = [...comfyWorkflows, entry];
    setComfyWorkflows(updated);
    localStorage.setItem("multiia_comfy_workflows", JSON.stringify(updated));
    showToast("✓ Workflow sauvegardé");
  };
  const deleteComfyWorkflow = (id) => {
    const updated = comfyWorkflows.filter(w=>w.id!==id);
    setComfyWorkflows(updated);
    localStorage.setItem("multiia_comfy_workflows", JSON.stringify(updated));
  };

  // ── Vote automatique "Meilleure réponse" ────────────────────────
  const [bestVote, setBestVote] = useState(null); // { winner, scores:{id:{precision,clarte,completude,utilite,total}}, reason, points:{id:[]} }
  const [voteLoading, setVoteLoading] = useState(false);
  const [voteHistory, setVoteHistory] = useState([]); // historique tous les verdicts
  const [showVoteDetail, setShowVoteDetail] = useState(false); // expand jury bandeau
  const [showDiffModal, setShowDiffModal] = useState(false); // modal diff
  const [diffPair, setDiffPair] = useState([null,null]); // [id1, id2] pour diff
  const [showRecap, setShowRecap] = useState(false); // recap table collapsible
  const runAutoVote = async (convSnapshot) => {
    const activeIds = IDS.filter(id => enabled[id]);
    if (activeIds.length < 2) return;
    const responses = activeIds.map(id => {
      const msgs = convSnapshot[id] || [];
      const last = [...msgs].reverse().find(m => m.role === "assistant");
      return { id, text: last?.content || "" };
    }).filter(r => r.text.length > 10);
    if (responses.length < 2) return;
    setVoteLoading(true);
    try {
      const judge = IDS.find(id => enabled[id] && !isLimited(id));
      if (!judge) return;
      const sep = ",";
      const scoresSchema = responses.map(r=>'"'+r.id+'": {"precision":0,"clarte":0,"completude":0,"utilite":0,"total":0}').join(sep);
      const pointsSchema = responses.map(r=>'"'+r.id+'": ["point clé 1","point clé 2"]').join(sep);
      const rankingSchema = responses.map(r=>'"'+r.id+'"').join(",");
      const responsesText = responses.map((r,i)=>"IA "+(i+1)+" (id:"+r.id+"):\n"+r.text.slice(0,500)).join("\n\n");
      const prompt = "Tu es un juge expert en IA. Évalue ces "+responses.length+" réponses à la même question.\n\n"+responsesText+"\n\nRéponds UNIQUEMENT en JSON valide, sans markdown, sans texte autour :\n{\n  \"winner\": \"id_du_gagnant\",\n  \"scores\": {"+scoresSchema+"},\n  \"reason\": \"explication 1-2 phrases du classement\",\n  \"points\": {"+pointsSchema+"},\n  \"ranking\": ["+rankingSchema+"]\n}\nScores de 1 à 10. total = moyenne des 4. ranking = du meilleur au moins bon.";
      const reply = await callModel(judge, [{role:"user",content:prompt}], apiKeys, "Tu es un juge objectif. JSON uniquement, sans markdown ni texte autour.");
      const clean = reply.replace(/```json[\s\S]*?```|```[\s\S]*?```/g, s => s.replace(/```json|```/g,"")).replace(/```/g,"").trim();
      const result = JSON.parse(clean);
      setBestVote(result);
      setVoteHistory(prev => [...prev.slice(-49), {...result, ts: Date.now(), question: (Object.values(convSnapshot).find(msgs=>msgs)?.[0]?.content||"").slice(0,60) }]);
    } catch(e) { console.warn("Vote err:", e.message); }
    setVoteLoading(false);
  };

  // ── Workflow visuel (chaîne de prompts) ────────────────────────
  const [workflowNodes, setWorkflowNodes] = useState(() => {
    try { return JSON.parse(localStorage.getItem("multiia_workflow")||"[]"); } catch { return []; }
  });
  const [workflowRunning, setWorkflowRunning] = useState(false);
  const [workflowResults, setWorkflowResults] = useState([]); // [{nodeId,label,ia,output,ok,duration}]
  const [workflowRunStep, setWorkflowRunStep] = useState(null); // id of currently running step
  const [workflowSavedTpls, setWorkflowSavedTpls] = useState(() => {
    try { return JSON.parse(localStorage.getItem("multiia_wf_templates")||"[]"); } catch { return []; }
  });
  const [workflowInput, setWorkflowInput] = useState("");
  const wfAbortRef = React.useRef(null);

  const saveWorkflow = (nodes) => { setWorkflowNodes(nodes); try { localStorage.setItem("multiia_workflow", JSON.stringify(nodes)); } catch {} };
  const saveWfTemplates = (tpls) => { setWorkflowSavedTpls(tpls); try { localStorage.setItem("multiia_wf_templates", JSON.stringify(tpls)); } catch {} };

  const addWorkflowNode = (type="prompt") => {
    const firstActive = IDS.find(id=>enabled[id]) || IDS[0];
    const node = {
      id: Date.now().toString(),
      label: `Étape ${workflowNodes.length+1}`,
      type,                          // "prompt" | "parallel" | "transform" | "cli"
      ia: firstActive,
      parallel_ias: [firstActive],   // for parallel type
      prompt: "",
      name: `step${workflowNodes.length+1}`, // variable name for {stepN}
      usePrevOutput: workflowNodes.length > 0,
      maxTokens: 2000,
    };
    saveWorkflow([...workflowNodes, node]);
  };

  const cancelModelCall = (id) => {
    if (abortRefs.current[id]) {
      abortRefs.current[id].abort();
      delete abortRefs.current[id];
    }
    setLoading(prev => ({ ...prev, [id]: false }));
    setConversations(prev => ({
      ...prev,
      [id]: [...(prev[id]||[]), { role:"error", content:"⏹ Réponse annulée" }]
    }));
  };

  const cancelWorkflow = () => {
    if (wfAbortRef.current) wfAbortRef.current.abort();
    setWorkflowRunning(false);
    setWorkflowRunStep(null);
    showToast("⏹ Workflow annulé");
  };

  const runWorkflow = async (input) => {
    const inp = (input !== undefined ? input : workflowInput) || "";
    if (!workflowNodes.length) { showToast("Ajoute des étapes d'abord !"); return; }
    const abort = new AbortController();
    wfAbortRef.current = abort;
    setWorkflowRunning(true); setWorkflowResults([]); setWorkflowRunStep(null);

    const namedOutputs = { INPUT: inp }; // {stepName: output}
    let prevOutput = inp;
    const results = [];
    const t0 = Date.now();

    const resolvePrompt = (template, prev, named) => {
      let p = template || prev;
      p = p.replace(/\{INPUT\}/g, inp);
      p = p.replace(/\{PREVIOUS\}/g, prev);
      Object.entries(named).forEach(([k,v]) => { p = p.replace(new RegExp("\\{"+k+"\\}", "g"), v); });
      return p;
    };

    for (const node of workflowNodes) {
      if (abort.signal.aborted) break;
      setWorkflowRunStep(node.id);
      const stepT0 = Date.now();

      try {
        let output = "";
        if (node.type === "parallel") {
          // Run multiple IAs simultaneously, combine results
          const ias = (node.parallel_ias||[node.ia]).filter(id => enabled[id] || id === node.ia);
          const prompt = resolvePrompt(node.prompt, prevOutput, namedOutputs);
          const replies = await Promise.all(ias.map(async id => {
            try {
              const r = await callModel(id, [{role:"user",content:prompt}], apiKeys, buildSystem(), null);
              return `**${MODEL_DEFS[id]?.short||id}**: ${r}`;
            } catch(e) { return `**${MODEL_DEFS[id]?.short||id}**: ❌ ${e.message}`; }
          }));
          output = replies.join("\n\n---\n\n");
        } else if (node.type === "transform") {
          // JS transform function: receives prev output, returns transformed string
          try {
            // eslint-disable-next-line no-new-func
            const fn = new Function("input","prev","named", node.prompt || "return prev;");
            output = String(fn(inp, prevOutput, namedOutputs));
          } catch(e) { output = "❌ Erreur transform : " + e.message; }
        } else if (node.type === "cli") {
          // CLI-Anything — OPTIONNEL : si absent, le workflow continue normalement
          // L'app reste 100% indépendante de CLI-Anything
          const cmd = resolvePrompt(node.cliCommand || "", prevOutput, namedOutputs);
          let cliAvailable = false;
          try {
            // Test rapide si le relay est disponible (timeout 2s)
            const ping = await fetch("http://localhost:5678/ping", {
              signal: AbortSignal.timeout(2000)
            });
            cliAvailable = ping.ok;
          } catch { cliAvailable = false; }

          if (!cliAvailable) {
            // CLI-Anything absent ou arrêté → on continue le workflow sans bloquer
            output = prevOutput; // passe le contenu précédent tel quel
            results.push({ nodeId:node.id, label:node.label, ia:"cli", type:"cli",
              output:"ℹ️ Logiciel local "+( node.cliSoftware||"CLI")+" non disponible — étape ignorée.\nContenu transmis à l'étape suivante.",
              ok:true, duration:0, skipped:true });
            prevOutput = output;
            namedOutputs[node.name || node.id] = output;
            setWorkflowResults([...results]);
            continue;
          }

          // CLI-Anything disponible → on l'utilise
          try {
            const r = await fetch("http://localhost:5678/execute", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ command: cmd, software: node.cliSoftware }),
              signal: AbortSignal.timeout(60000)
            });
            if (r.ok) {
              const d = await r.json();
              output = d.output || d.result || "✅ " + (node.cliSoftware||"Logiciel") + " : commande exécutée";
            } else {
              const err = await r.text().catch(()=>"");
              output = prevOutput; // fallback : transmet le contenu précédent
              results.push({ nodeId:node.id, label:node.label, ia:"cli", type:"cli",
                output:"⚠️ Logiciel local erreur ("+r.status+") — contenu transmis à l'étape suivante.",
                ok:true, duration:0, skipped:true });
              prevOutput = output;
              namedOutputs[node.name || node.id] = output;
              setWorkflowResults([...results]);
              continue;
            }
          } catch(e) {
            output = prevOutput; // fallback silencieux
          }
        } else {
          // Default: prompt type
          const prompt = resolvePrompt(node.prompt, prevOutput, namedOutputs);
          const reply = await callModel(node.ia, [{role:"user",content:prompt}], apiKeys, buildSystem(), null);
          output = reply;
        }

        prevOutput = output;
        namedOutputs[node.name || node.id] = output;
        const duration = Date.now() - stepT0;
        results.push({ nodeId:node.id, label:node.label, ia:node.ia, type:node.type, output, ok:true, duration });
      } catch(e) {
        const duration = Date.now() - stepT0;
        results.push({ nodeId:node.id, label:node.label, ia:node.ia, type:node.type, output:e.message, ok:false, duration });
        setWorkflowResults([...results]);
        break;
      }
      setWorkflowResults([...results]);
    }
    setWorkflowRunStep(null); setWorkflowRunning(false);
    const totalTime = ((Date.now()-t0)/1000).toFixed(1);
    if (!abort.signal.aborted) showToast(`✓ Workflow — ${results.filter(r=>r.ok).length}/${workflowNodes.length} étapes en ${totalTime}s`);
  };

  // ── Plugins JS ──────────────────────────────────────────────────
  const [plugins, setPlugins] = useState(() => {
    try { return JSON.parse(localStorage.getItem("multiia_plugins")||"[]"); } catch { return []; }
  });
  const [showPluginPanel, setShowPluginPanel] = useState(false);
  const [pluginUrlInput, setPluginUrlInput] = useState("");
  const loadPlugin = async (url) => {
    try {
      const script = document.createElement("script");
      script.src = url;
      script.onload = () => {
        const name = url.split("/").pop().replace(".js","");
        const newPlugins = [...plugins.filter(p=>p.url!==url), {name, url, loaded:true}];
        setPlugins(newPlugins);
        localStorage.setItem("multiia_plugins", JSON.stringify(newPlugins));
        showToast(`✓ Plugin "${name}" chargé`);
      };
      script.onerror = () => showToast("✗ Impossible de charger le plugin");
      document.head.appendChild(script);
    } catch(e) { showToast("✗ Erreur plugin: "+e.message); }
  };

  // ── Export Markdown / PDF ───────────────────────────────────────
  const exportMarkdown = (id) => {
    const m = MODEL_DEFS[id] || { name:"Toutes les IAs", short:"all" };
    const ids = id ? [id] : IDS.filter(i => enabled[i]);
    let md = `# Conversation Multi-IA Hub\n**IA:** ${ids.map(i=>MODEL_DEFS[i]?.name||i).join(", ")}\n**Date:** ${new Date().toLocaleString("fr-FR")}\n\n---\n\n`;
    ids.forEach(cid => {
      const msgs = (conversations[cid]||[]).filter(m=>m.role==="user"||m.role==="assistant");
      if (!msgs.length) return;
      md += `## ${MODEL_DEFS[cid]?.icon} ${MODEL_DEFS[cid]?.name}\n\n`;
      msgs.forEach(msg => {
        md += msg.role==="user" ? `**👤 Vous :**\n${msg.content}\n\n` : `**🤖 ${MODEL_DEFS[cid]?.short} :**\n${msg.content}\n\n---\n\n`;
      });
    });
    const blob = new Blob([md], {type:"text/markdown;charset=utf-8"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href=url; a.download=`conversation-${Date.now()}.md`; a.click();
    URL.revokeObjectURL(url); showToast("✓ Export Markdown téléchargé");
  };
  const exportPDF = async (id) => {
    const ids = id ? [id] : IDS.filter(i => enabled[i]);
    const allMsgs = ids.flatMap(cid =>
      (conversations[cid]||[]).filter(m=>m.role==="user"||m.role==="assistant")
        .map(m=>({...m, ia:MODEL_DEFS[cid]?.short||cid, color:MODEL_DEFS[cid]?.color||"#888", icon:MODEL_DEFS[cid]?.icon||"🤖"}))
    );
    if (!allMsgs.length) { showToast("Aucun message à exporter"); return; }

    // Try jsPDF first (available via plugins), fallback to print window
    try {
      if (window.jsPDF || window.jspdf) {
        const { jsPDF } = window.jspdf || { jsPDF: window.jsPDF };
        const doc = new jsPDF({ unit:"mm", format:"a4" });
        const pageW = doc.internal.pageSize.getWidth();
        const margin = 14; const usableW = pageW - margin*2;
        let y = 20;

        // Header
        doc.setFillColor(26,26,28); doc.rect(0,0,pageW,16,'F');
        doc.setTextColor(212,168,83); doc.setFontSize(11); doc.setFont("helvetica","bold");
        doc.text("Multi-IA Hub — Conversation", margin, 10);
        doc.setTextColor(150,150,150); doc.setFontSize(8); doc.setFont("helvetica","normal");
        doc.text(new Date().toLocaleString("fr-FR"), pageW-margin, 10, {align:"right"});
        y = 24;

        allMsgs.forEach(msg => {
          if (y > 270) { doc.addPage(); y = 14; }
          const isUser = msg.role === "user";
          // Label
          doc.setFontSize(7); doc.setFont("helvetica","bold");
          doc.setTextColor(isUser ? 100 : 180, isUser ? 100 : 130, isUser ? 100 : 60);
          doc.text((isUser ? "👤 Vous" : msg.icon+" "+msg.ia).replace(/[^-~]/g,""), margin, y);
          y += 4;
          // Content
          doc.setFontSize(9); doc.setFont("helvetica","normal");
          doc.setTextColor(isUser ? 60 : 30, isUser ? 60 : 30, isUser ? 60 : 30);
          const clean = msg.content.replace(/[#*`>_~]/g,"").replace(/\n{3,}/g,"\n\n");
          const lines = doc.splitTextToSize(clean, usableW);
          const blockH = lines.length * 4 + 8;
          if (y + blockH > 275) { doc.addPage(); y = 14; }
          doc.setFillColor(isUser ? 245 : 255, isUser ? 245 : 249, isUser ? 245 : 240);
          doc.roundedRect(margin, y-2, usableW, blockH, 2, 2, "F");
          doc.setDrawColor(isUser ? 200 : 212, isUser ? 200 : 168, isUser ? 200 : 83);
          doc.line(margin, y-2, margin, y-2+blockH);
          doc.text(lines, margin+3, y+3);
          y += blockH + 4;
        });

        // Footer
        const pageCount = doc.internal.getNumberOfPages();
        for(let i=1;i<=pageCount;i++){
          doc.setPage(i);
          doc.setFontSize(7); doc.setTextColor(150,150,150);
          doc.text("Multi-IA Hub v"+APP_VERSION+" — p."+i+"/"+pageCount, pageW/2, 290, {align:"center"});
        }
        doc.save("conversation-multiia-"+Date.now()+".pdf");
        showToast("✓ PDF téléchargé !");
        return;
      }
    } catch(e) { console.warn("jsPDF unavailable, fallback:", e); }

    // Fallback: print window
    const win = window.open("","_blank");
    const escHtml = s => s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
    win.document.write("<!DOCTYPE html><html><head><meta charset=utf-8><title>Conversation</title><style>body{font-family:system-ui;max-width:800px;margin:32px auto;color:#222}.msg{margin:14px 0;padding:12px 16px;border-radius:6px;border-left:4px solid #ccc}.user{background:#f5f5f5;border-color:#888}.assistant{background:#fffbf0;border-color:#D4A853}.lbl{font-size:10px;font-weight:700;color:#888;margin-bottom:5px}.body{font-size:13px;white-space:pre-wrap;line-height:1.6}</style></head><body><h2>Multi-IA Hub v"+APP_VERSION+"</h2><p style='color:#888;font-size:11px'>"+new Date().toLocaleString("fr-FR")+"</p>"+allMsgs.map(m=>"<div class='msg "+m.role+"'><div class='lbl'>"+(m.role==="user"?"👤 Vous":"🤖 "+m.ia)+"</div><div class='body'>"+escHtml(m.content)+"</div></div>").join("")+"</body></html>");
    win.document.close();
    setTimeout(()=>win.print(),400);
    showToast("✓ Fenêtre impression → Enregistrer en PDF");
  };

  // ── Persona actif ──
  const [activePersona, setActivePersona] = useState("default");
  const [customPersonas, setCustomPersonas] = useState(() => {
    try { return JSON.parse(localStorage.getItem("multiia_personas")||"[]"); } catch { return []; }
  });
  const savePersonas = (list) => { setCustomPersonas(list); try{localStorage.setItem("multiia_personas",JSON.stringify(list));}catch{} };
  const [showPersonaModal, setShowPersonaModal] = useState(false);
  const [personaForm, setPersonaForm] = useState({name:"",icon:"🤖",color:"#D4A853",system:""});
  const allPersonas = [...DEFAULT_PERSONAS, ...customPersonas];
  const currentPersona = allPersonas.find(p=>p.id===activePersona) || DEFAULT_PERSONAS[0];
  const currentSystem = currentPersona.system;

  // ── Mémoire locale (faits persistants injectés dans system) ────
  const MEM_KEY = "multiia_memory";
  const [memFacts, setMemFacts] = useState(() => {
    try { return JSON.parse(localStorage.getItem(MEM_KEY) || "[]"); } catch { return []; }
  });
  const [showMemPanel, setShowMemPanel] = useState(false);
  const [memInput, setMemInput] = useState("");
  const addMemFact = (text) => {
    const fact = text.trim(); if (!fact) return;
    const updated = [...memFacts, { id: Date.now(), text: fact }];
    setMemFacts(updated);
    try { localStorage.setItem(MEM_KEY, JSON.stringify(updated)); } catch {}
    setMemInput("");
  };
  const delMemFact = (id) => {
    const updated = memFacts.filter(f => f.id !== id);
    setMemFacts(updated);
    try { localStorage.setItem(MEM_KEY, JSON.stringify(updated)); } catch {}
  };
  const buildSystem = React.useCallback(() => {
    let sys = currentSystem || "";
    if (memFacts.length > 0) {
      const facts = memFacts.map(f => "- " + f.text).join("\n");
      sys = `${sys}\n\n📌 Mémoire utilisateur (rappels persistants) :\n${facts}`.trim();
    }
    return sys;
  }, [memFacts, currentSystem]);

  // ── Raccourcis clavier globaux ─────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      const active = document.activeElement;
      const inInput = active && (active.tagName==="INPUT"||active.tagName==="TEXTAREA");
      // Ctrl+Enter = envoyer même depuis textarea
      if (e.ctrlKey && e.key==="Enter") { e.preventDefault(); if(tab==="chat" && chatInput.trim()) sendChat(); return; }
      if (inInput && e.key!=="Escape") return;
      // Ctrl+1..9 = toggle IA
      if (e.ctrlKey && e.key>="1" && e.key<="9") {
        const idx = parseInt(e.key)-1; const id = IDS[idx];
        if (id) { e.preventDefault(); setEnabled(prev=>({...prev,[id]:!prev[id]})); showToast(`${MODEL_DEFS[id].icon} ${MODEL_DEFS[id].short} ${enabled[id]?"désactivé":"activé"}`); }
      }
      // Ctrl+K = focus recherche historique
      if (e.ctrlKey && e.key==="k") { e.preventDefault(); navigateTab("chat"); setTimeout(()=>document.getElementById("hist-search-inp")?.focus(),150); }
      // Ctrl+L = clear conversations
      if (e.ctrlKey && e.key==="l") { e.preventDefault(); setConversations(Object.fromEntries(IDS.map(id=>[id,[]]))); showToast("💬 Conversations effacées"); }
      // Ctrl+M = export markdown
      if (e.ctrlKey && e.key==="m") { e.preventDefault(); exportMarkdown(null); }
      // Escape = quitter focus / solo
      if (e.key==="Escape") { setFocusId(null); setSoloId(null); setShowRagPanel(false); setCanvasContent(null); }
      // Ctrl+T = reset session tokens
      if (e.ctrlKey && e.key==="t" && !inInput) { e.preventDefault(); setSessionTokens({}); showToast("🔢 Compteur tokens réinitialisé"); }
    };
    window.addEventListener("keydown", handler);
    return ()=>window.removeEventListener("keydown", handler);
  }, [tab, chatInput, enabled, soloId, focusId]);

  // ── Voix (TTS) ──
  const [ttsEnabled, setTtsEnabled] = useState(false);
  // ── Son de notification fin de réponse ──────────────────────────
  const playBeep = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.35);
      setTimeout(() => ctx.close(), 500);
    } catch {}
  };

  const speakText = (text) => {
    if (!ttsEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text.slice(0,500));
    utt.lang="fr-FR"; utt.rate=1.05;
    window.speechSynthesis.speak(utt);
  };

  // ── Dictée vocale ──
  const [isListening, setIsListening] = useState(false);
  const recognizerRef = useRef(null);
  const shouldListenRef = useRef(false);   // intention de l'utilisateur (survive aux redémarrages)

  const startRecognizer = () => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec || !shouldListenRef.current) return;
    const rec = new SpeechRec();
    rec.lang = "fr-FR";
    rec.continuous = false;      // false = plus stable cross-browser, on redémarre dans onend
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => {
      let transcript = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) transcript += e.results[i][0].transcript + " ";
      }
      if (transcript.trim()) setChatInput(prev => prev ? prev + " " + transcript.trim() : transcript.trim());
    };
    rec.onend = () => {
      // Redémarre automatiquement tant que l'utilisateur n'a pas cliqué stop
      if (shouldListenRef.current) {
        try { startRecognizer(); } catch {}
      } else {
        setIsListening(false);
      }
    };
    rec.onerror = (e) => {
      if (e.error === "not-allowed") {
        shouldListenRef.current = false;
        setIsListening(false);
        showToast("❌ Micro refusé — autorise le micro dans les paramètres du navigateur");
      } else if (e.error === "aborted") {
        // silence volontaire, on laisse onend gérer
      } else if (e.error === "no-speech") {
        // pas de parole, continue d'écouter
      } else if (e.error === "network") {
        shouldListenRef.current = false;
        setIsListening(false);
        showToast("⚠️ Micro : réseau requis (Chrome envoie l'audio à Google). Essaie Edge ou connecte-toi à Internet.");
      } else {
        shouldListenRef.current = false;
        setIsListening(false);
        showToast("Erreur micro : " + e.error);
      }
    };
    recognizerRef.current = rec;
    try { rec.start(); } catch {}
  };

  const startVoice = async () => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) { showToast("Dictée non supportée — utilise Chrome ou Edge"); return; }
    if (isListening) {
      // Arrêt volontaire
      shouldListenRef.current = false;
      recognizerRef.current?.stop();
      setIsListening(false);
      return;
    }
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      showToast("❌ Micro refusé — autorise le micro dans les paramètres du navigateur"); return;
    }
    shouldListenRef.current = true;
    setIsListening(true);
    startRecognizer();
  };

  // ── Statistiques d'usage ──

  // ── Injection prompt depuis Bibliothèque ──
  const injectPrompt = (text) => { setChatInput(text); navigateTab("chat"); showToast("✓ Prompt injecté dans le Chat"); };

  // ── Onglet médias sous-onglet ──
  const [mediaSubTab, setMediaSubTab] = useState("youtube");

  // ── Détection mobile & offline ──
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  // mobileCol unified into mobileCol
  
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    const handleOnline  = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('resize',  handleResize,  {passive:true});
    window.addEventListener('online',  handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('resize',  handleResize);
      window.removeEventListener('online',  handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleTouchStart = () => {};
  const handleTouchEnd = () => {};

  // ── File attachment ──
  const [attachedFile, setAttachedFile] = React.useState(null);
  const fileInputRef = useRef(null);

  const handleFileAttach = async (file) => {
    if (!file) return;
    const name = file.name; const type = file.type;
    if (type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => setAttachedFile({name, type:"image", base64:reader.result.split(",")[1], mimeType:type, icon:"🖼"});
      reader.readAsDataURL(file);
    } else if (name.endsWith(".txt")||name.endsWith(".md")||name.endsWith(".csv")||name.endsWith(".json")) {
      const text = await file.text();
      setAttachedFile({name, type:"text", content:text.slice(0,12000), icon:"📄"});
    } else if (name.endsWith(".pdf")) {
      // Extraction basique PDF côté client
      const reader = new FileReader();
      reader.onload = () => {
        const raw = reader.result;
        // Extraire les séquences de texte lisibles (méthode simple sans lib externe)
        let extracted = "";
        const matches = raw.match(/[ -~À-ÿ]{4,}/g) || [];
        extracted = matches.filter(s => /[a-zA-ZÀ-ÿ]{3,}/.test(s)).join(" ").slice(0,8000);
        setAttachedFile({name, type:"pdf", content:extracted||"[PDF chargé — extraction de texte limitée]", icon:"📕"});
      };
      reader.readAsBinaryString(file);
    } else {
      showToast("⚠️ Format non supporté. Utilise PDF, TXT, MD, CSV, JSON ou image.");
    }
  };

  // ── Notifications PWA ──
  const requestNotifPerm = async () => {
    if ("Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }
  };
  const sendNotif = (title, body) => {
    if ("Notification" in window && Notification.permission === "granted" && document.hidden) {
      new Notification(title, { body, icon:"/icon-192.png", badge:"/icon-192.png" });
    }
  };

  // ── Zoom / Échelle UI ──
  const [zenMode, setZenMode] = React.useState(false);
  const [canvasContent, setCanvasContent] = React.useState(null); // {code, lang, title}
  const [canvasError, setCanvasError] = React.useState(null);
  const [canvasEditInput, setCanvasEditInput] = React.useState("");
  const [canvasEditing, setCanvasEditing] = React.useState(false);
  const [canvasHealCount, setCanvasHealCount] = React.useState(0);

  const editCanvas = async (prompt) => {
    const query = prompt || canvasEditInput;
    if (!query?.trim() || !canvasContent) return;
    setCanvasEditing(true);
    const activeIds = IDS.filter(id => enabled[id] && !MODEL_DEFS[id]?.serial);
    const id = activeIds.find(i => ["groq","mistral","cohere"].includes(i)) || activeIds[0];
    if (!id) { setCanvasEditing(false); return; }
    try {
      const sys = "Tu es un expert développeur. Réponds UNIQUEMENT avec le code modifié complet, sans explication ni balises markdown.";
      const msg = query + "\n\nCode actuel :\n" + canvasContent.code;
      const reply = await callModel(id, [{role:"user",content:msg}], apiKeys, sys);
      const cleaned = reply.replace(/^```[\w\s]*\n?/,"").replace(/\n?```[\w]*$/,"").trim();
      setCanvasContent(prev => ({...prev, code:cleaned}));
      setCanvasEditInput("");
      setCanvasError(null);
    } catch(e) { showToast("❌ " + e.message); }
    setCanvasEditing(false);
  };

  const healCanvas = React.useCallback(() => {
    if (!canvasError || !canvasContent) return;
    const healPrompt = "Ce code HTML/JS a g\u00e9n\u00e9r\u00e9 l'erreur suivante : \"" + canvasError + "\"\n\nCorrige le bug. R\u00e9ponds uniquement avec le code corrig\u00e9 complet.";
    setCanvasHealCount(n => n + 1);
    setCanvasError(null);
    editCanvas(healPrompt);
  }, [canvasError, canvasContent]);

  // Expose to window so CodeBlock (non-child) can trigger canvas
  React.useEffect(() => {
    window.__openCanvas = (code, lang, title) => { setCanvasContent({code, lang, title}); setCanvasError(null); setCanvasHealCount(0); };
    return () => {
      delete window.__openCanvas;
      // cleanup any stray canvas message listeners
      document.querySelectorAll('iframe.__canvas').forEach(el => {
        if(el.__msgHandler) window.removeEventListener('message',el.__msgHandler);
      });
    };
  }, []);
  const [sessionTokens, setSessionTokens] = React.useState({}); // {id: {in:N, out:N}}
  const estimateCost = (id, inTok, outTok) => {
    const p = TOKEN_PRICE[id];
    if (!p) return 0;
    return (inTok / 1e6 * p.in) + (outTok / 1e6 * p.out);
  };
  const addTokens = (id, inTok, outTok) => {
    setSessionTokens(prev => {
      const cur = prev[id] || {in:0, out:0};
      return {...prev, [id]: {in: cur.in + inTok, out: cur.out + outTok}};
    });
    // ── Enrichit usageStats avec msgs/tokens/heure ─────────────
    const hour = new Date().getHours();
    const dateKey = new Date().toISOString().slice(0,10); // "2026-03-18"
    setUsageStats(prev => ({
      ...prev,
      msgs:    { ...(prev.msgs||{}),    [id]: ((prev.msgs||{})[id]||0) + 1 },
      tokens:  { ...(prev.tokens||{}),  [id]: ((prev.tokens||{})[id]||0) + inTok + outTok },
      byHour:  { ...(prev.byHour||{}),  [hour]: ((prev.byHour||{})[hour]||0) + 1 },
      byDate:  { ...(prev.byDate||{}),  [dateKey]: ((prev.byDate||{})[dateKey]||0) + 1 },
      convs:   (prev.convs||0),
    }));
  };

  const [uiZoom, setUiZoom] = React.useState(() => {
    try { return parseFloat(localStorage.getItem("multiia_zoom") || "1"); } catch { return 1; }
  });
  const saveZoom = (v) => { setUiZoom(v); try { localStorage.setItem("multiia_zoom", v); } catch {} };

  // ── PWA Install prompt ──
  const [pwaPrompt, setPwaPrompt] = useState(null);
  const [showPwaBanner, setShowPwaBanner] = useState(false);
  const [pwaInstalled, setPwaInstalled] = useState(false);
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault(); setPwaPrompt(e);
      if (!localStorage.getItem("multiia_pwa_dismissed")) setShowPwaBanner(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    if (window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone) setPwaInstalled(true);
    window.addEventListener("appinstalled", () => { setPwaInstalled(true); setShowPwaBanner(false); });
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);
  const installPwa = async () => {
    if (!pwaPrompt) return;
    pwaPrompt.prompt();
    const { outcome } = await pwaPrompt.userChoice;
    if (outcome === "accepted") { setPwaInstalled(true); setShowPwaBanner(false); }
    setPwaPrompt(null);
  };
  const dismissPwaBanner = () => { setShowPwaBanner(false); localStorage.setItem("multiia_pwa_dismissed","1"); };

  const MOBILE_TABS = [["chat","◈","Chat"],["prompts","📋","Prompts"],["medias","🎬","Médias"],["recherche","🔎","Cherche"],["config","⚙","Config"]];
  const MOBILE_MORE_SECTIONS = [
    { label:"CRÉER & ÉCRIRE", tabs:[
      ["redaction","✍️","Rédaction"],["traducteur","🌍","Trad."],["notes","📝","Notes"],["studio","🎬","Studio"],
    ]},
    { label:"AUTOMATISER & ANALYSER", tabs:[
      ["workflows","🔀","Workflows"],["agent","🤖","Agent"],["taskia","🔀","Task→IAs"],["router","🧭","Router"],["autopsy","🔬","Autopsy"],
    ]},
    { label:"CRÉER & APPRENDRE", tabs:[
      ["redaction","✍️","Rédaction"],["notes","📝","Notes"],["mentor","🎓","Mentor"],["dna","🧬","DNA"],["skills","🛠","Skills"],
    ]},
    { label:"ANALYSER & COMPARER", tabs:[
      ["debate","⚡","Débat"],["livedebate","⏱","Débat Live"],["flash","⚡","Flash"],["expert","🧠","Experts"],["compare","⚖","Comparer"],["consensus","🔎","Consensus"],["contradict","⚡","Contradict"],
    ]},
    { label:"RECHERCHER & PRODUIRE", tabs:[
      ["journaliste","📰","Journaliste"],["conference","🎙","Conf."],["veille","📰","Veille"],["brief","☀️","Brief"],["contexttrans","🔄","Contexte"],["civilisations","🌍","Civilis."],
    ]},
    { label:"EXPLORER", tabs:[
      ["webia","🌐","IAs Web"],["arena","⚔","Arène"],["voice","🎙","Voice"],["comfyui","⬡","ComfyUI"],["traducteur","🌍","Trad."],
    ]},
    { label:"GÉRER & OPTIMISER", tabs:[
      ["projects","📁","Projets"],["secondbrain","🧠","2nd Brain"],["apioptim","💡","API Optim"],["benchmark","⚡","Bench"],["glossaire","📖","Glossaire"],["stats","📊","Stats"],["advanced","🔬","Avancé"],["aide","❓","Aide"],
    ]},];
  const [showMobileMore, setShowMobileMore] = useState(false);

  // ── Expert Panel (Panel d'Experts) ─────────────────────────────
  const EXPERT_PANELS = {
    "dev": [
      {name:"Expert Sécurité",icon:"🔒",system:"Tu es un expert en cybersécurité. Analyse le problème du point de vue des vulnérabilités, failles potentielles et bonnes pratiques de sécurité."},
      {name:"Expert Performance",icon:"⚡",system:"Tu es un expert en optimisation des performances. Analyse le problème du point de vue de la vitesse, scalabilité, et utilisation des ressources."},
      {name:"Expert Architecture",icon:"🏗",system:"Tu es un expert en architecture logicielle. Analyse le problème du point de vue de la maintenabilité, patterns de conception et dette technique."},
    ],
    "product": [
      {name:"Expert UX",icon:"🎨",system:"Tu es un expert UX/Design. Analyse le problème du point de vue de l'expérience utilisateur, accessibilité et ergonomie."},
      {name:"Expert Business",icon:"💼",system:"Tu es un expert business. Analyse le problème du point de vue de la valeur métier, ROI et impact stratégique."},
      {name:"Expert Tech",icon:"⚙️",system:"Tu es un expert technique. Analyse les contraintes techniques, la faisabilité et les solutions d'implémentation."},
    ],
    "content": [
      {name:"Expert SEO",icon:"🔍",system:"Tu es un expert SEO. Analyse le contenu du point de vue du référencement, mots-clés et visibilité en ligne."},
      {name:"Expert Copywriting",icon:"✍️",system:"Tu es un expert copywriter. Analyse le contenu du point de vue de la persuasion, clarté et engagement du lecteur."},
      {name:"Expert Audience",icon:"👥",system:"Tu es un expert en marketing d'audience. Analyse le contenu du point de vue des personas, besoin du lecteur et impact émotionnel."},
    ],
  };
  const [expertQuery, setExpertQuery] = useState("");
  const [expertPanel, setExpertPanel] = useState("dev");
  const [expertResults, setExpertResults] = useState({}); // {expertIdx: {analysis,expert}}
  const [expertSynthesis, setExpertSynthesis] = useState("");
  const [expertRunning, setExpertRunning] = useState(false);

  const runExpertPanel = async () => {
    const q = expertQuery.trim(); if (!q) return;
    const experts = EXPERT_PANELS[expertPanel] || EXPERT_PANELS.dev;
    const activeIds = IDS.filter(id => enabled[id] && !isLimited(id) && !MODEL_DEFS[id]?.serial);
    if (!activeIds.length) { showToast("Active au moins une IA"); return; }
    setExpertRunning(true); setExpertResults({}); setExpertSynthesis("");

    // Step 1: each expert analyses independently
    const analyses = {};
    await Promise.all(experts.map(async (expert, idx) => {
      const id = activeIds[idx % activeIds.length];
      try {
        const r = await callModel(id, [{role:"user",content:q}], apiKeys, expert.system);
        analyses[idx] = r;
        setExpertResults(prev => ({...prev, [idx]:{analysis:r, expert, ia:MODEL_DEFS[id]?.short}}));
      } catch(e) {
        analyses[idx] = "Erreur: " + e.message;
        setExpertResults(prev => ({...prev, [idx]:{analysis:"❌ "+e.message, expert, ia:""}}));
      }
    }));

    // Step 2: synthesis — a 4th IA reads all analyses
    const synthId = activeIds.find(id => !["poll_gpt","poll_gemini","poll_claude"].includes(id)) || activeIds[0];
    const analysisText = experts.map((e,idx2) => e.icon+" "+e.name+":\n"+(analyses[idx2]||"").slice(0,500)).join("\n\n---\n\n");
    const synthPrompt = "Question initiale : \""+q+"\"\\n\n"+analysisText+"\n\n---\n\nEn tant que coordinateur, synthétise ces analyses en :\n1. CONSENSUS\n2. TENSIONS\n3. RECOMMANDATION FINALE\n\nSois concis et actionnable.";
    try {
      const synth = await callModel(synthId, [{role:"user",content:synthPrompt}], apiKeys, "Tu es un coordinateur expert qui synthétise des analyses multiples.");
      setExpertSynthesis(synth);
    } catch(e) { setExpertSynthesis("❌ Synthèse impossible : "+e.message); }
    setExpertRunning(false);
    showToast("✓ Panel d'experts terminé !");
  };

  // ── Prompt Builder ───────────────────────────────────────────────
  const [showPromptBuilder, setShowPromptBuilder] = React.useState(false);

  // ── Auto-Memory (feature 10) ──────────────────────────────────────
  const [autoMemSuggestions, setAutoMemSuggestions] = React.useState([]);
  const [showMemSuggest, setShowMemSuggest] = React.useState(false);
  const extractAutoMemory = async (convHistory) => {
    if (convHistory.length < 4) return;
    const activeIds = IDS.filter(id=>enabled[id]&&!MODEL_DEFS[id]?.serial);
    const id = activeIds.find(i=>i==="groq")||activeIds[0];
    if (!id) return;
    const snippet = convHistory.slice(-6).filter(m=>m.role==="user"||m.role==="assistant").map(m=>(m.role==="user"?"U:":"A:")+m.content.slice(0,200)).join("\n");
    try {
      const r = await callModel(id,[{role:"user",content:"Extrais 2 faits importants sur l'utilisateur de cette conversation. Format JSON: [{fact:string}]. Si rien d'important, retourne []. JSON uniquement:\n"+snippet}],apiKeys,"Expert extraction de faits. JSON uniquement.");
      const d = JSON.parse(r.replace(/```json|```/g,"").trim());
      if(Array.isArray(d)&&d.length>0) {
        setAutoMemSuggestions(d.map(x=>x.fact||x).filter(Boolean));
        setShowMemSuggest(true);
      }
    } catch {}
  };

  // ── Advanced Settings ──────────────────────────────────────────
  const [customProviders, setCustomProviders] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem("multiia_custom_providers")||"[]"); } catch { return []; }
  });
  const [modelTemps, setModelTemps] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem("multiia_temps")||"{}"); } catch { return {}; }
  });
  const [globalSysPrompt, setGlobalSysPrompt] = React.useState(() => {
    try { return localStorage.getItem("multiia_global_sys")||""; } catch { return ""; }
  });
  const saveAdvSettings = () => {
    try {
      localStorage.setItem("multiia_custom_providers", JSON.stringify(customProviders));
      localStorage.setItem("multiia_temps", JSON.stringify(modelTemps));
      localStorage.setItem("multiia_global_sys", globalSysPrompt);
      showToast("✓ Paramètres avancés sauvegardés");
    } catch(e) { showToast("❌ "+e.message); }
  };

  // ── Response Diff ────────────────────────────────────────────────
  const [diffModal, setDiffModal] = React.useState(false);
  const [diffIA1, setDiffIA1] = React.useState("");
  const [diffIA2, setDiffIA2] = React.useState("");

  const computeDiff = (text1, text2) => {
    const words1 = text1.split(/\s+/);
    const words2 = text2.split(/\s+/);
    // Simple LCS-based word diff
    const m = words1.length, n = words2.length;
    const dp = Array.from({length:m+1}, ()=>new Array(n+1).fill(0));
    for(let i=m-1;i>=0;i--) for(let j=n-1;j>=0;j--)
      dp[i][j] = words1[i]===words2[j] ? dp[i+1][j+1]+1 : Math.max(dp[i+1][j],dp[i][j+1]);
    const result = []; let i=0, j=0;
    while(i<m || j<n) {
      if(i<m && j<n && words1[i]===words2[j]) { result.push({t:"eq",v:words1[i]}); i++;j++; }
      else if(j<n && (i>=m || dp[i+1]?.[j]<=dp[i]?.[j+1])) { result.push({t:"add",v:words2[j]}); j++; }
      else { result.push({t:"del",v:words1[i]}); i++; }
    }
    return result;
  };


  // ══════════════════════════════════════════════════════════════
  // 🧭 Smart Router — analyse fichier + propose onglet + lance
  // ══════════════════════════════════════════════════════════════
  const ROUTER_ROUTES = [
    { id:"chat",       icon:"◈", label:"Chat IA",          desc:"Poser des questions, discuter du contenu",      color:"#74C98C" },
    { id:"debate",     icon:"⚡", label:"Débat / Analyse",  desc:"Analyse multi-IAs sous plusieurs angles",       color:"#F59E0B" },
    { id:"redaction",  icon:"✍️", label:"Rédaction",         desc:"Réécrire, corriger, améliorer le texte",        color:"#60A5FA" },
    { id:"recherche",  icon:"🔎", label:"Recherche",         desc:"Questions de recherche sur ce contenu",         color:"#34D399" },
    { id:"workflows",  icon:"🔀", label:"Workflow",          desc:"Chaîner des traitements automatiques",          color:"#F97316" },
    { id:"comfyui",    icon:"⬡", label:"ComfyUI",           desc:"Générer/modifier des images avec ComfyUI",      color:"#A78BFA" },
    { id:"rag",        icon:"📄", label:"RAG Contextuel",   desc:"Indexer le document pour Q&A intelligent",      color:"#D4A853" },
    { id:"canvas",     icon:"🎨", label:"Canvas Exécution", desc:"Exécuter/visualiser le code HTML/SVG/JS",       color:"#F472B6" },
  ];

  const [routerFile, setRouterFile]           = useState(null);  // {name,type,content,base64,mimeType,icon,size}
  const [routerAnalysis, setRouterAnalysis]   = useState(null);  // {summary, suggestions:[{route,reason,confidence,params}], raw}
  const [routerAnalyzing, setRouterAnalyzing] = useState(false);
  const [routerSelected, setRouterSelected]   = useState(null);  // chosen route id
  const [routerLaunching, setRouterLaunching] = useState(false);
  const [routerDone, setRouterDone]           = useState(false);
  const [routerQuestion, setRouterQuestion]   = useState("");    // optional user question
  const routerFileRef = useRef(null);

  const ROUTER_MAX_SIZE = 15 * 1024 * 1024; // 15MB

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
        if (ext==="js"||ext==="jsx"||ext==="ts"||ext==="tsx"||ext==="py"||ext==="html"||ext==="css"||ext==="sql") icon="💻";
        if (ext==="json"||ext==="csv") icon="📊";
        if (ext==="md") icon="📝";
      } catch { content = "[Fichier binaire]"; }
    }

    setRouterFile({ name:file.name, type:isImage?"image":"text", ext, content, base64, mimeType:file.type, icon, sizeKB });
    showToast("✓ Fichier chargé — clique Analyser");
  };

  const analyzeRouterFile = async () => {
    if (!routerFile) return;
    setRouterAnalyzing(true); setRouterAnalysis(null); setRouterSelected(null);

    // Pick best available AI (prefer Groq for speed)
    const activeIds = IDS.filter(id=>enabled[id]&&!MODEL_DEFS[id]?.serial&&!isLimited(id));
    const id = activeIds.find(i=>["groq","mistral","cohere"].includes(i))||activeIds[0];

    if (!id) {
      // Fallback: static heuristic routing without AI
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
      // Validate routes exist
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

  // Heuristic routing without AI
  const heuristicRoute = (file) => {
    const ext = file.ext||"";
    const name = file.name.toLowerCase();
    let suggestions = [];
    if (["jpg","jpeg","png","gif","webp"].includes(ext)) {
      suggestions = [
        {route:"comfyui",reason:"Image détectée — ComfyUI peut la traiter ou générer des variantes",confidence:.9,params:{prompt:"analyze and describe this image",action:"Ouvrir dans ComfyUI"}},
        {route:"chat",reason:"Poser des questions sur l'image",confidence:.7,params:{prompt:"Décris en détail cette image",action:"Analyser dans le Chat"}},
        {route:"canvas",reason:"Afficher l'image dans le Canvas",confidence:.5,params:{prompt:"",action:"Visualiser"}},
      ];
    } else if (ext==="pdf"||ext==="docx") {
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
          setShowRagPanel(true);
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

  const [debInput, setDebInput] = useState("");
  const [debPhase, setDebPhase] = useState(0);
  const [debProgress, setDebProgress] = useState(0);
  const [debProgressLabel, setDebProgressLabel] = useState("");
  const [debRound1, setDebRound1] = useState({});
  const [debRound2, setDebRound2] = useState({});
  const [debSynthesis, setDebSynthesis] = useState("");
  const [debSynthBy, setDebSynthBy] = useState("Claude");
  const [debQuestion, setDebQuestion] = useState("");
  const [openPhases, setOpenPhases] = useState({ r1:true, r2:true, syn:true });
  // ── Pipeline de Concrétisation ──────────────────────────────────
  const [pipeMode, setPipeMode]       = useState(null);   // "action"|"code"|"doc"|null
  const [pipeRunning, setPipeRunning] = useState(false);
  const [pipeSteps, setPipeSteps]     = useState([]);     // [{id,label,icon,status,output,ia}]
  const [pipeOpen, setPipeOpen]       = useState({});     // {stepId: bool}
  const pipeAbortRef = useRef(null);
  // ── Fichier dans le Débat ────────────────────────────────────
  const [debFile, setDebFile] = useState(null);   // {name, type, content, base64, mimeType, icon}
  const [debMode, setDebMode] = useState("debate"); // "debate" | "analyse"
  const debFileRef = useRef(null);
  const handleDebFile = async (file) => {
    if (!file) return;
    const name = file.name; const ftype = file.type;
    if (ftype.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => setDebFile({name, type:"image", base64:reader.result.split(",")[1], mimeType:ftype, icon:"🖼"});
      reader.readAsDataURL(file);
    } else if (name.endsWith(".txt")||name.endsWith(".md")||name.endsWith(".csv")||name.endsWith(".json")) {
      const text = await file.text();
      setDebFile({name, type:"text", content:text.slice(0,12000), icon:"📄"});
    } else if (name.endsWith(".pdf")) {
      const reader = new FileReader();
      reader.onload = () => {
        const raw = reader.result;
        const matches = raw.match(/[ -~À-ÿ]{4,}/g) || [];
        const extracted = matches.filter(s=>/[a-zA-ZÀ-ÿ]{3,}/.test(s)).join(" ").slice(0,8000);
        setDebFile({name, type:"pdf", content:extracted||"[PDF chargé — extraction basique]", icon:"📕"});
      };
      reader.readAsBinaryString(file);
    } else if (name.endsWith(".docx")||name.endsWith(".doc")) {
      const text = await file.text().catch(()=>"[Fichier binaire — contenu non extractible]");
      setDebFile({name, type:"text", content:text.slice(0,10000), icon:"📝"});
    } else if (name.endsWith(".js")||name.endsWith(".py")||name.endsWith(".ts")||name.endsWith(".html")||name.endsWith(".css")||name.endsWith(".jsx")||name.endsWith(".tsx")||name.endsWith(".sql")||name.endsWith(".xml")) {
      const text = await file.text();
      setDebFile({name, type:"code", content:text.slice(0,12000), icon:"💻"});
    } else {
      showToast("Format supporté : PDF, TXT, MD, CSV, JSON, code source, images");
    }
  };

  useEffect(() => { IDS.forEach(id => { const el = msgRefs.current[id]; if(el) el.scrollTop = el.scrollHeight; }); }, [conversations, loading]);
  // Import shared prompt/URL params on mount
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const pp = params.get("prompt");
      if (pp) {
        const d = JSON.parse(decodeURIComponent(escape(atob(decodeURIComponent(pp)))));
        if (d?.text) setChatInput(d.text);
      }
    } catch {}
  }, []);

  const showToast = (msg, duration=2800) => { setToast(msg); setTimeout(() => setToast(null), duration); };

  const toggleModel = (id) => {
    const m = MODEL_DEFS[id];
    if (!enabled[id] && m.keyName && !apiKeys[m.keyName]) { setModal(id); setKeyDraft(""); return; }
    setEnabled(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const saveKeyModal = () => {
    const m = MODEL_DEFS[modal];
    setApiKeys(prev => ({ ...prev, [m.keyName]: keyDraft.trim() }));
    setEnabled(prev => ({ ...prev, [modal]: true }));
    setModal(null);
    showToast(`✓ Clé ${m.short} enregistrée`);
  };

  const saveCfgKey = (keyName) => {
    const val = (cfgDrafts[keyName] || "").trim();
    if (!val) return;
    setApiKeys(prev => ({ ...prev, [keyName]: val }));
    setCfgDrafts(prev => ({ ...prev, [keyName]: "" }));
    showToast("✓ Clé enregistrée");
  };

  const exportJson = JSON.stringify({ _info:`MultiIA v${APP_VERSION} - clés API`, ...apiKeys }, null, 2);

  const exportKeys = () => {
    try {
      const a = document.createElement("a");
      a.href = "data:application/json;charset=utf-8," + encodeURIComponent(exportJson);
      a.download = "multiia-keys.json";
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      showToast("✓ Fichier exporté");
    } catch { setShowExportModal(true); }
  };

  const importKeys = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const p = JSON.parse(ev.target.result);
        const merged = { ...apiKeys };
        let count = 0;
        Object.keys(apiKeys).forEach(k => { if(p[k]) { merged[k] = p[k]; count++; } });
        setApiKeys(merged); showToast(`✓ ${count} clé(s) importée(s)`);
      } catch { showToast("✗ Fichier invalide"); }
    };
    reader.readAsText(file); e.target.value = "";
  };

  // ── Fonctions d'historique ──
  const persistHistory = (list) => {
    setSavedConvs(list);
    try { localStorage.setItem("multiia_history", JSON.stringify(list)); } catch {}
  };

  const getConvTitle = (convs) => {
    // Cherche le premier message utilisateur dans n'importe quelle IA
    for (const id of IDS) {
      const first = (convs[id] || []).find(m => m.role === "user");
      if (first) return first.content.slice(0, 60) + (first.content.length > 60 ? "…" : "");
    }
    return "Conversation sans titre";
  };

  const saveConv = (customTitle) => {
    const hasContent = IDS.some(id => conversations[id].some(m => m.role === "user"));
    if (!hasContent) { showToast("Aucun message à sauvegarder"); return; }
    const title = customTitle || getConvTitle(conversations);
    const activeIds = IDS.filter(id => conversations[id].some(m => m.role === "user" || m.role === "assistant"));
    const entry = {
      id: Date.now().toString(),
      title,
      date: new Date().toLocaleString("fr-FR", { day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit" }),
      ias: activeIds,
      conversations: { ...conversations },
    };
    // Si conversation active déjà dans l'historique → màj
    if (activeHistId) {
      const updated = savedConvs.map(c => c.id === activeHistId ? { ...entry, id: activeHistId } : c);
      persistHistory(updated);
      showToast("✓ Conversation mise à jour");
    } else {
      const newList = [entry, ...savedConvs].slice(0, 50); // max 50 convs
      persistHistory(newList);
      setActiveHistId(entry.id);
      showToast("✓ Conversation sauvegardée");
    }
  };

  const loadConv = (entry) => {
    if (IDS.some(id => conversations[id].some(m => m.role === "user")) && !window.confirm("Charger cette conversation ? La conversation actuelle non sauvegardée sera perdue.")) return;
    setConversations(entry.conversations);
    setActiveHistId(entry.id);
    // Activer les IAs qui ont du contenu
    entry.ias.forEach(id => { if (!enabled[id]) setEnabled(prev => ({ ...prev, [id]: true })); });
    showToast(`✓ "${entry.title.slice(0,30)}" chargée`);
  };

  const deleteConv = (e, entryId) => {
    e.stopPropagation();
    const newList = savedConvs.filter(c => c.id !== entryId);
    persistHistory(newList);
    if (activeHistId === entryId) setActiveHistId(null);
    showToast("Conversation supprimée");
  };

  const newConv = () => {
    if (IDS.some(id => conversations[id].some(m => m.role === "user")) && !window.confirm("Nouvelle conversation ? La conversation actuelle non sauvegardée sera perdue.")) return;
    setConversations(Object.fromEntries(IDS.map(id => [id, []])));
    setActiveHistId(null);
    setChatInput("");
  };

  // Auto-save après chaque réponse complète
  const autoSave = (newConvs) => {
    const hasContent = IDS.some(id => (newConvs[id]||[]).some(m => m.role === "user"));
    if (!hasContent) return;
    const title = getConvTitle(newConvs);
    const activeIds = IDS.filter(id => (newConvs[id]||[]).some(m => m.role === "user" || m.role === "assistant"));
    const entry = {
      id: activeHistId || Date.now().toString(),
      title,
      date: new Date().toLocaleString("fr-FR", { day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit" }),
      ias: activeIds,
      conversations: { ...newConvs },
    };
    setSavedConvs(prev => {
      const exists = prev.find(c => c.id === entry.id);
      let newList = exists ? prev.map(c => c.id === entry.id ? entry : c) : [entry, ...prev];
      // ── Compression automatique : garde 50 convs, tronque les messages des anciennes ──
      if (newList.length > 50) {
        newList = newList.slice(0, 50).map((conv, i) => {
          // Compresse les convs > 30 (garde seulement titre + 2 premiers messages par IA)
          if (i > 30 && conv.conversations) {
            const compressedConvs = {};
            Object.entries(conv.conversations).forEach(([id, msgs]) => {
              if (Array.isArray(msgs) && msgs.length > 4) {
                compressedConvs[id] = msgs.slice(0, 2); // garde les 2 premiers msg
              } else {
                compressedConvs[id] = msgs;
              }
            });
            return { ...conv, conversations: compressedConvs, compressed: true };
          }
          return conv;
        });
      }
      try {
        localStorage.setItem("multiia_history", JSON.stringify(newList));
      } catch(e) {
        // Si storage plein, vider les plus anciennes conversations
        if (e.name === "QuotaExceededError") {
          const trimmed = newList.slice(0, 20).map(conv => ({
            ...conv,
            conversations: Object.fromEntries(
              Object.entries(conv.conversations || {}).map(([id, msgs]) => [id, (msgs||[]).slice(0,2)])
            ),
            compressed: true
          }));
          try { localStorage.setItem("multiia_history", JSON.stringify(trimmed)); } catch {}
          return trimmed;
        }
      }
      return newList;
    });
    if (!activeHistId) setActiveHistId(entry.id);
  };

  const handleGrammarCheck = async () => {
    const text = chatInput.trim(); if (!text || grammarLoading) return;
    if (grammarResult?.corrected && text === grammarResult.original) { setShowGrammarPopup(true); return; }
    setGrammarLoading(true);
    try {
      const corrected = await correctGrammar(text, apiKeys);
      if (corrected.trim() === text) showToast("✓ Aucune faute détectée !");
      else { setGrammarResult({ original: text, corrected: corrected.trim() }); setShowGrammarPopup(true); }
    } catch(e) { showToast("✗ Erreur: " + e.message); }
    finally { setGrammarLoading(false); }
  };

  const enabledIds   = React.useMemo(() => IDS.filter(id => enabled[id]),            [enabled]);
  const availableIds = React.useMemo(() => enabledIds.filter(id => !isLimited(id)), [enabledIds, limited]);
  const isLoadingAny = React.useMemo(() => Object.values(loading).some(Boolean),    [loading]);

  const sendChat = async () => {
    const text = applyPromptVars(chatInput.trim()); if (!text) return;
    setShowGrammarPopup(false); setGrammarResult(null); setChatInput(""); setBestVote(null);
    const file = attachedFile; setAttachedFile(null);
    requestNotifPerm();

    // ── Détection de langue automatique ───────────────────────────
    const detectLang = (t) => {
      const arabicRe = /[\u0600-\u06FF]/; const chineseRe = /[\u4E00-\u9FFF]/;
      const japaneseRe = /[\u3040-\u30FF]/; const koreanRe = /[\uAC00-\uD7AF]/;
      const cyrillicRe = /[\u0400-\u04FF]/;
      const words = t.trim().split(/\s+/);
      const frWords = ["le","la","les","un","une","des","je","tu","il","elle","nous","vous","ils","elles","et","ou","mais","donc","car","que","qui","quoi","comment","pourquoi","quand","où","est","sont","avoir","être","faire","je suis","c'est","bonjour","merci"];
      const enWords = ["the","is","are","was","were","i","you","he","she","we","they","and","or","but","so","because","that","what","how","why","when","where","hello","thanks","please"];
      if (arabicRe.test(t)) return "ar";
      if (chineseRe.test(t)) return "zh";
      if (japaneseRe.test(t)) return "ja";
      if (koreanRe.test(t)) return "ko";
      if (cyrillicRe.test(t)) return "ru";
      const lower = t.toLowerCase();
      const frScore = frWords.filter(w => lower.includes(" "+w+" ") || lower.startsWith(w+" ") || lower === w).length;
      const enScore = enWords.filter(w => lower.includes(" "+w+" ") || lower.startsWith(w+" ") || lower === w).length;
      if (words.length < 3) return "fr"; // trop court pour détecter
      if (enScore > frScore + 1) return "en";
      return "fr";
    };
    // Propose traducteur si langue non-française détectée sur texte long
    const detectedLang = detectLang(text);
    const nonFrLangs = {"en":"anglais","es":"espagnol","de":"allemand","it":"italien","pt":"portugais","ar":"arabe","zh":"chinois","ja":"japonais","ko":"coréen","ru":"russe"};
    if (nonFrLangs[detectedLang] && text.length > 30) {
      showToast(`🌍 Langue détectée : ${nonFrLangs[detectedLang]} — Onglet Traducteur disponible`, 4000);
    }
    // ── RAG : enrichir le message avec contexte document ──────────
    const ragCtx = ragChunks.length > 0 ? getRagContext(text) : null;
    const effectiveText = ragCtx || text;
    // ── Respect du mode solo : n'envoyer qu'à l'IA sélectionnée ──
    const targetIds = soloId ? [soloId] : IDS.filter(id => enabled[id]);
    // Sur mobile, n'envoyer qu'à l'IA visible
    const finalTargets = isMobile && !soloId ? [mobileCol] : targetIds;
    const ids = finalTargets.filter(id => !isLimited(id));
    const blockedIds = finalTargets.filter(id => isLimited(id));
    const userMsg = { role:"user", content:effectiveText, displayContent: ragCtx ? text : null, file: file ? {name:file.name, icon:file.icon} : null };
    const allActive = [...ids, ...blockedIds];
    setConversations(prev => { const n={...prev}; allActive.forEach(id => { n[id] = [...prev[id], userMsg]; }); return n; });
    if (blockedIds.length) {
      setConversations(prev => { const n={...prev}; blockedIds.forEach(id => { n[id] = [...prev[id], { role:"blocked", id_blocked:id, content:`⏳ ${MODEL_DEFS[id].short} temporairement limité (rate limit). Réessai dans ${fmtCd(id)||"..."}s — ou clique sur Débloquer` }]; }); return n; });
    }
    if (!ids.length) return;
    setLoading(prev => { const n={...prev}; ids.forEach(id => { n[id]=true; }); return n; });
    // Create AbortControllers per IA
    ids.forEach(id => { abortRefs.current[id] = new AbortController(); });
    await Promise.all(ids.map(async (id) => {
      try {
        const hist = [...conversations[id], userMsg];
        let reply;
        if (owuiActive && owuiConnected && owuiModel && id === "__owui__") {
          reply = await callOwui(owuiModel, hist, buildSystem());
        } else if (owuiActive && owuiConnected && owuiModel) {
          reply = await callOwui(owuiModel, hist, buildSystem());
        } else if (ollamaActive && ollamaConnected && ollamaModel && id === "__ollama__") {
          reply = await callOllama(ollamaModel, hist, buildSystem());
        } else {
          const safeHist = truncateForModel(hist, id, buildSystem());
          reply = await callModel(id, safeHist, apiKeys, buildSystem(), file);
        }
        const thinkContent = extractThink(reply);
        const cleanReply = stripThink(reply);
        if (ttsEnabled && ids.length===1) speakText(cleanReply);
        // Auto-scroll to bottom
        setTimeout(()=>{ const el = msgsEndRefs.current[id]; if(el) el.scrollIntoView({behavior:"smooth"}); }, 50);
        // Token estimation (heuristic: 1 token ≈ 4 chars)
        const inEst = Math.round(hist.reduce((a,m)=>(a+(m.content||"").length),0)/4);
        const outEst = Math.round((cleanReply||"").length/4);
        addTokens(id, inEst, outEst);
        setConversations(prev => {
          const updated = { ...prev, [id]: [...prev[id], { role:"assistant", content:cleanReply, think:thinkContent||undefined }] };
          return updated;
        });
      } catch(e) {
        const errType = classifyError(e.message);
        if (errType==="ratelimit") markLimited(id, errType);
        setConversations(prev => ({ ...prev, [id]: [...prev[id], { role:"error", content:`❌ ${e.message}` }] }));
      } finally { setLoading(prev => ({ ...prev, [id]:false })); }
    }));
    // ── Son + notification fin de réponse ──────────────────────────
    const successCount = IDS.filter(id=>enabled[id]).length;
    playBeep();
    sendNotif("✅ Réponses reçues", `${successCount} IA${successCount>1?"s":""} ont répondu`);
    // Auto-save après toutes les réponses
    setConversations(prev => {
      autoSave(prev);
      // Vote automatique si 2+ IAs actives
      const activeCount = IDS.filter(id => enabled[id]).length;
      if (activeCount >= 2) setTimeout(()=>runAutoVote(prev), 500);
      // Auto-memory: extract facts every 6 messages
      const firstId = IDS.find(id=>enabled[id]);
      const hist = firstId ? (prev[firstId]||[]) : [];
      if (hist.length > 0 && hist.length % 6 === 0) setTimeout(()=>extractAutoMemory(hist), 2000);
      return prev;
    });
  };

  const launchDebate = async () => {
    const question = debInput.trim();
    const hasFile = !!debFile;
    const isAnalyse = debMode === "analyse";
    if (!question && !hasFile) { showToast("Saisis une question ou attache un fichier"); return; }
    const ids = IDS.filter(id => enabled[id] && !isLimited(id));
    if (ids.length < 2) { showToast("Active au moins 2 IAs disponibles"); return; }

    // Build file context string for text injection
    const buildFileCtx = () => {
      if (!debFile) return "";
      if (debFile.type === "image") return ""; // handled via callModel file param
      return `\n\n📎 **Fichier joint : ${debFile.name}**\n\`\`\`\n${debFile.content}\n\`\`\``;
    };
    const fileCtx = buildFileCtx();
    const fileParam = (debFile?.type === "image") ? debFile : null; // image passed as file param
    const displayQ = question || `Analyse du fichier : ${debFile?.name}`;

    setDebQuestion(displayQ);
    setDebRound1({}); setDebRound2({}); setDebSynthesis(""); setDebSynthBy("Claude");
    setDebPhase(1); setOpenPhases({ r1:true, r2:true, syn:true });
    const total = ids.length + ids.length + 1; let done = 0;
    const tick = (lbl) => { done++; setDebProgress(Math.round(done/total*100)); setDebProgressLabel(lbl); };

    // Build Tour 1 prompt — inject file content
    const buildT1Prompt = (id) => {
      const m = MODEL_DEFS[id];
      if (isAnalyse) {
        // Mode Analyse : consignes précises d'analyse fichier
        const analyseInstructions = [
          "Identifie les points clés, la structure et le sujet principal",
          "Évalue la qualité, la cohérence et les lacunes",
          "Propose des améliorations ou des actions concrètes",
          "Donne ton avis d'expert avec exemples et arguments",
        ];
        const myTask = analyseInstructions[ids.indexOf(id) % analyseInstructions.length];
        return `${question ? `Contexte : "${question}"\n\n` : ""}Analyse ce fichier. Ta mission spécifique : **${myTask}**.${fileCtx}`;
      } else {
        // Mode Débat : chaque IA défend une perspective
        return `${question}${fileCtx}`;
      }
    };

    const sysT1 = isAnalyse
      ? "Tu es un expert analyste. Analyse le document fourni selon ta mission. Sois précis, factuel et actionnable."
      : "Tu es un expert. Réponds à la question de manière complète et précise. Si un fichier est joint, base-toi dessus.";

    const r1 = {};
    // Séparer les IAs "serial" (Pollinations) des autres
    const serialIds1 = ids.filter(id => MODEL_DEFS[id]?.serial);
    const parallelIds1 = ids.filter(id => !MODEL_DEFS[id]?.serial);

    // Lancer les IAs normales en parallèle (avec petit délai entre elles pour éviter le flood)
    await Promise.all(parallelIds1.map(async (id, idx) => {
      // Petit délai pour ne pas hitter les rate limits simultanément
      if (idx > 0) await new Promise(res => setTimeout(res, idx * 800));
      try {
        const prompt = buildT1Prompt(id);
        const truncated = truncateForModel([{ role:"user", content:prompt }], id, sysT1);
        r1[id] = await callModel(id, truncated, apiKeys, sysT1, fileParam);
      }
      catch(e) { const t=classifyError(e.message); if(t==="ratelimit") markLimited(id,t); r1[id]=`❌ ${e.message}`; }
      tick(`Tour 1 — ${MODEL_DEFS[id].short}`);
      setDebRound1(prev => ({ ...prev, [id]:r1[id] }));
    }));

    // Lancer les IAs serial (Pollinations) séquentiellement après les autres
    for (const id of serialIds1) {
      try {
        const prompt = buildT1Prompt(id);
        const truncated = truncateForModel([{ role:"user", content:prompt }], id, sysT1);
        r1[id] = await callModel(id, truncated, apiKeys, sysT1, null); // images non supportées par Pollinations
      }
      catch(e) { const t=classifyError(e.message); if(t==="ratelimit") markLimited(id,t); r1[id]=`❌ ${e.message}`; }
      tick(`Tour 1 — ${MODEL_DEFS[id].short}`);
      setDebRound1(prev => ({ ...prev, [id]:r1[id] }));
    }

    setDebPhase(2);
    const r2 = {};
    const sysT2 = "Tu analyses les réponses de tes pairs et affines ta propre analyse.";
    const buildT2Prompt = (id) => {
      const others = ids.filter(o=>o!==id).map(o=>`**${MODEL_DEFS[o].short}** :\n${r1[o]||"(pas de réponse)"}`).join("\n\n---\n\n");
      // Limiter la taille du contexte des "autres" pour les petits modèles
      const isSmall = (MODEL_DEFS[id]?.inputLimit||28000) < 8000;
      const othersCtx = isSmall ? others.slice(0, 2000) : others.slice(0, 8000);
      const fileReminder = hasFile && !fileParam && !isSmall ? `\n\n(Rappel fichier : ${debFile.name})\n${debFile.content?.slice(0,1500)||""}` : "";
      return isAnalyse
        ? `Voici les analyses des autres IAs sur "${debFile?.name||"ce document"}" :\n\n${othersCtx}${fileReminder}\n\n---\nComplète et enrichis l'analyse avec ce que les autres ont manqué.`
        : `Question : "${question}"\n\nRéponses des autres IAs :\n\n${othersCtx}\n\n---\nEn tenant compte de ces perspectives, affine ta réponse finale.`;
    };

    const serialIds2 = ids.filter(id => MODEL_DEFS[id]?.serial);
    const parallelIds2 = ids.filter(id => !MODEL_DEFS[id]?.serial);

    await Promise.all(parallelIds2.map(async (id, idx) => {
      if (idx > 0) await new Promise(res => setTimeout(res, idx * 800));
      try {
        const prompt = buildT2Prompt(id);
        const truncated = truncateForModel([{ role:"user", content:prompt }], id, sysT2);
        r2[id] = await callModel(id, truncated, apiKeys, sysT2);
      }
      catch(e) { const t=classifyError(e.message); if(t==="ratelimit") markLimited(id,t); r2[id]=`❌ ${e.message}`; }
      tick(`Tour 2 — ${MODEL_DEFS[id].short}`);
      setDebRound2(prev => ({ ...prev, [id]:r2[id] }));
    }));

    for (const id of serialIds2) {
      try {
        const prompt = buildT2Prompt(id);
        const truncated = truncateForModel([{ role:"user", content:prompt }], id, sysT2);
        r2[id] = await callModel(id, truncated, apiKeys, sysT2);
      }
      catch(e) { const t=classifyError(e.message); if(t==="ratelimit") markLimited(id,t); r2[id]=`❌ ${e.message}`; }
      tick(`Tour 2 — ${MODEL_DEFS[id].short}`);
      setDebRound2(prev => ({ ...prev, [id]:r2[id] }));
    }

    setDebPhase(3);
    const allAnswers = ids.map(id=>`**${MODEL_DEFS[id].short}** :\n${r2[id]||r1[id]||"(pas de réponse)"}`).join("\n\n---\n\n");
    const synPrompt = isAnalyse
      ? `Synthèse finale de l'analyse du fichier "${debFile?.name||"document"}"${question?` (contexte : "${question}")`:""}.\n\nToutes les analyses :\n\n${allAnswers}\n\n---\nProduis :\n1. **SYNTHÈSE COMPLÈTE** — combine toutes les analyses\n2. **POINTS CLÉS** — les insights les plus importants\n3. **ACTIONS RECOMMANDÉES** — que faire concrètement\n4. **POINTS DE DÉSACCORD** entre les IAs`
      : `Question : "${question}"${fileCtx.slice(0,300)}\n\nRéponses finales :\n\n${allAnswers}\n\n---\nProduis :\n1. La MEILLEURE RÉPONSE SYNTHÉTISÉE\n2. POINTS DE CONSENSUS\n3. DIVERGENCES notables`;

    const synthPriority = ["groq","mistral","cohere","cerebras","sambanova","mixtral"];
    let synDone = false;
    for (const sid of synthPriority) {
      if (!enabled[sid] || isLimited(sid)) continue;
      try {
        const syn = await callModel(sid, [{ role:"user", content:synPrompt }], apiKeys, "Tu produis des synthèses claires, structurées et actionnables.");
        setDebSynthesis(syn); setDebSynthBy(MODEL_DEFS[sid].name); synDone = true; break;
      } catch(e) { const t=classifyError(e.message); if(t==="ratelimit"||t==="credit") markLimited(sid,t); }
    }
    if (!synDone) {
      const valid = ids.filter(id => r2[id] && !r2[id].startsWith("❌"));
      if (valid.length > 0) { setDebSynthesis(`⚠️ Synthèse auto — ${MODEL_DEFS[valid[0]].short}:\n\n${r2[valid[0]]}`); setDebSynthBy(MODEL_DEFS[valid[0]].name + " (fallback)"); }
      else setDebSynthesis("❌ Aucune IA disponible pour produire une synthèse.");
    }
    tick("Synthèse générée"); setDebPhase(4);
  };

  const clearDebate = () => { setDebPhase(0); setDebInput(""); setDebRound1({}); setDebRound2({}); setDebSynthesis(""); setDebQuestion(""); setDebProgress(0); setDebFile(null); setPipeMode(null); setPipeSteps([]); setPipeRunning(false); };

  // ── PIPELINE DE CONCRÉTISATION ──────────────────────────────────
  // Prend la synthèse + fichier du débat → pipeline multi-étapes vérifiées
  const PIPE_CONFIGS = {
    action: {
      label:"Plan d'Action", icon:"🎯", color:"#D4A853",
      steps: [
        { id:"decomp",  icon:"📋", label:"Décomposition",    ia:0, prompt:(syn,ctx)=>`Tu es expert en gestion de projet. Basé sur cette analyse/synthèse :\n\n${syn}\n\n${ctx}\nDécompose en tâches concrètes et prioritisées :\n- Liste numérotée de toutes les actions à faire\n- Pour chaque tâche : priorité (CRITIQUE/HAUTE/NORMALE), effort estimé (XS/S/M/L/XL)\n- Dépendances entre tâches\nSois précis et exhaustif.` },
        { id:"risks",   icon:"⚠️",  label:"Risques & Blocages",ia:1, prompt:(syn,ctx,prev)=>`Analyse les risques de ce plan d'action :\n\n${prev}\n\nContexte original :\n${syn.slice(0,1000)}\n\nIdentifie :\n1. Risques critiques (bloquants)\n2. Risques modérés (à surveiller)\n3. Points d'attention techniques\nPour chaque risque : impact (1-10), probabilité (1-10), mitigation proposée.` },
        { id:"timeline",icon:"📅", label:"Planning & Séquence", ia:2, prompt:(syn,ctx,prev,all)=>`Basé sur les tâches et risques identifiés :\n\nTâches :\n${all.decomp||""}\n\nRisques :\n${all.risks||""}\n\nCrée un planning réaliste :\n1. Séquence optimale des tâches (en tenant compte des dépendances)\n2. Estimation de temps réaliste pour chaque phase\n3. Jalons clés (milestones)\n4. Critères de succès mesurables pour chaque étape` },
        { id:"valid",   icon:"✅", label:"Validation Croisée",  ia:3, prompt:(syn,ctx,prev,all)=>`Tu es un expert critique. Examine ce plan d'action et vérifie :\n\nPlan :\n${all.decomp||""}\nTimeline :\n${all.timeline||""}\n\n1. Ce plan est-il RÉALISTE et COMPLET ?\n2. Y a-t-il des tâches oubliées ?\n3. Le planning est-il cohérent ?\n4. Donne un score de faisabilité /10 avec justification\n5. Liste les 3 modifications prioritaires si nécessaire` },
        { id:"final",   icon:"🏆", label:"Synthèse Finale",    ia:0, prompt:(syn,ctx,prev,all)=>`Compile le plan d'action FINAL en format actionnable :\n\n## 🎯 PLAN D'ACTION FINAL\n\nBasé sur :\n- Tâches : ${(all.decomp||"").slice(0,500)}\n- Timeline : ${(all.timeline||"").slice(0,500)}\n- Validation : ${(all.valid||"").slice(0,400)}\n\nFormat de sortie :\n## Objectif\n## Tâches par priorité (tableau ou liste)\n## Planning (phases)\n## Risques principaux\n## Critères de succès\n## Prochaines étapes immédiates (les 3 premières choses à faire MAINTENANT)` },
      ]
    },
    code: {
      label:"Code + Vérification", icon:"💻", color:"#60A5FA",
      steps: [
        { id:"spec",    icon:"📐", label:"Spécifications Tech",  ia:0, prompt:(syn,ctx)=>`Tu es architecte logiciel. À partir de cette synthèse :\n\n${syn}\n\n${ctx}\nRédige les spécifications techniques :\n1. Architecture proposée (technologies, structure)\n2. Interfaces / API / structures de données\n3. Contraintes et pré-requis\n4. Points techniques à risque\nSois précis sur le langage/framework à utiliser.` },
        { id:"code",    icon:"⌨️",  label:"Implémentation",       ia:1, prompt:(syn,ctx,prev,all)=>`Tu es développeur senior expert. Implémente la solution basée sur ces specs :\n\n${all.spec||""}\n\nContexte : ${syn.slice(0,600)}\n\nÉcris le code complet :\n- Code propre, commenté, production-ready\n- Gestion des erreurs exhaustive (try/catch, validation)\n- Types/interfaces si TypeScript\n- Respect des bonnes pratiques (SOLID, DRY)\n- Inclus les imports/dépendances nécessaires` },
        { id:"tests",   icon:"🧪", label:"Tests Unitaires",       ia:2, prompt:(syn,ctx,prev,all)=>`Tu es expert QA/Testing. Écris des tests complets pour ce code :\n\n${all.code||""}\n\nInclus :\n1. Tests unitaires pour chaque fonction (cas nominaux)\n2. Tests des cas limites (edge cases)\n3. Tests d'erreurs (cas où ça doit échouer)\n4. Tests d'intégration si applicable\n5. Couverture cible : 90%+\nUtilise le framework de test approprié.` },
        { id:"review",  icon:"🔍", label:"Code Review & Bugs",    ia:3, prompt:(syn,ctx,prev,all)=>`Tu es expert en sécurité et qualité du code. Fais une code review critique :\n\n### CODE\n${all.code||""}\n\n### TESTS\n${all.tests||""}\n\nIdentifie :\n1. 🐛 Bugs potentiels (avec ligne approximative et correction)\n2. 🔒 Failles de sécurité\n3. ⚡ Problèmes de performance\n4. 🧹 Améliorations de lisibilité\n5. ✅ Points positifs\nDonne un score qualité /10 avec justification.` },
        { id:"final",   icon:"🏆", label:"Code Final Vérifié",    ia:0, prompt:(syn,ctx,prev,all)=>`Tu es développeur senior. Produis le CODE FINAL corrigé en intégrant tous les retours :\n\n### Code original :\n${all.code||""}\n\n### Issues identifiées :\n${all.review||""}\n\nLivrable final :\n1. Code corrigé et optimisé (COMPLET, prêt à copier-coller)\n2. Changelog : liste des corrections apportées\n3. Instructions d'installation/déploiement\n4. Exemples d'utilisation` },
      ]
    },
    doc: {
      label:"Document Formel", icon:"📄", color:"#34D399",
      steps: [
        { id:"struct",  icon:"🏗️",  label:"Structure du Document",ia:0, prompt:(syn,ctx)=>`Tu es expert en rédaction professionnelle. Basé sur cette synthèse :\n\n${syn}\n\n${ctx}\nPropose la structure optimale du document :\n1. Type de document recommandé (rapport, note de synthèse, guide, spec...)\n2. Plan détaillé avec sections et sous-sections\n3. Public cible et ton adapté\n4. Longueur estimée` },
        { id:"content", icon:"✍️", label:"Rédaction",              ia:1, prompt:(syn,ctx,prev,all)=>`Tu es rédacteur expert. Rédige le document complet basé sur :\n\nStructure :\n${all.struct||""}\n\nContenu source :\n${syn}\n\nRédige en respectant :\n- Ton professionnel et précis\n- Structure avec titres clairs (##, ###)\n- Paragraphes bien construits\n- Données et arguments concrets\n- Transitions fluides` },
        { id:"exec",    icon:"📊", label:"Résumé Exécutif",        ia:2, prompt:(syn,ctx,prev,all)=>`Écris un résumé exécutif PERCUTANT de max 250 mots pour ce document :\n\n${all.content||""}\n\nFormat :\n- 1 phrase d'accroche\n- Contexte (2-3 phrases)\n- Points clés (3-5 bullets)\n- Décision/action attendue\n- Impact attendu` },
        { id:"review",  icon:"🔍", label:"Relecture & Qualité",    ia:3, prompt:(syn,ctx,prev,all)=>`Tu es éditeur expert. Relis et améliore ce document :\n\n${all.content||""}\n\nVérifie :\n1. Cohérence et logique du propos\n2. Clarté et lisibilité\n3. Fautes et formulations maladroites\n4. Structure et transitions\n5. Ton adapté au public\nFournis : corrections + texte amélioré + score qualité /10` },
        { id:"final",   icon:"🏆", label:"Document Final",         ia:0, prompt:(syn,ctx,prev,all)=>`Produis le DOCUMENT FINAL en intégrant toutes les améliorations :\n\nRésumé exécutif :\n${all.exec||""}\n\nDocument principal :\n${all.content||""}\n\nSuggestions éditeur :\n${(all.review||"").slice(0,600)}\n\nLivre le document complet, poli, prêt à partager.` },
      ]
    }
  };

  const runPipeline = async (mode) => {
    if (pipeRunning) return;
    const config = PIPE_CONFIGS[mode];
    if (!config) return;
    const ids = IDS.filter(id => enabled[id] && !isLimited(id));
    if (!ids.length) { showToast("Active au moins une IA"); return; }

    const abort = new AbortController();
    pipeAbortRef.current = abort;
    setPipeMode(mode);
    setPipeRunning(true);
    setPipeOpen({});

    // Init steps as pending
    const initSteps = config.steps.map(s => ({...s, status:"pending", output:"", ia: ids[s.ia % ids.length] }));
    setPipeSteps(initSteps);

    const fileCtx = debFile && debFile.type !== "image"
      ? `\n\n📎 Fichier de référence (${debFile.name}) :\n\`\`\`\n${debFile.content?.slice(0,4000) || ""}\n\`\`\``
      : "";
    const synCtx = debSynthesis || debQuestion || "";
    const accumulated = {};

    for (let i = 0; i < config.steps.length; i++) {
      if (abort.signal.aborted) break;
      const step = config.steps[i];
      const ia = ids[step.ia % ids.length];

      setPipeSteps(prev => prev.map((s,idx) => idx===i ? {...s, status:"running", ia} : s));
      setPipeOpen(prev => ({...prev, [step.id]: true}));

      const prev = accumulated[config.steps[i-1]?.id] || "";
      try {
        const prompt = step.prompt(synCtx, fileCtx, prev, accumulated);
        const pipeSys = "Tu es expert. Réponds de façon précise, structurée et actionnable. Utilise du Markdown.";
        const safePipeMsg = truncateForModel([{role:"user", content:prompt}], ia, pipeSys);
        const reply = await callModel(ia, safePipeMsg, apiKeys, pipeSys, null);
        accumulated[step.id] = reply;
        setPipeSteps(prev2 => prev2.map((s,idx) => idx===i ? {...s, status:"done", output:reply, ia} : s));
        // Auto-close previous, keep current open
        if (i > 0) setPipeOpen(prev2 => ({...prev2, [config.steps[i-1].id]: false}));
      } catch(e) {
        accumulated[step.id] = "❌ " + e.message;
        setPipeSteps(prev2 => prev2.map((s,idx) => idx===i ? {...s, status:"error", output:"❌ "+e.message, ia} : s));
        if (classifyError(e.message) === "ratelimit") markLimited(ia, "ratelimit");
        break;
      }
    }
    setPipeRunning(false);
    if (!abort.signal.aborted) {
      playBeep();
      showToast(`✓ Pipeline "${config.label}" terminé`);
    }
  };

  const cancelPipeline = () => {
    if (pipeAbortRef.current) pipeAbortRef.current.abort();
    setPipeRunning(false);
    showToast("⏹ Pipeline annulé");
  };

  const exportPipeline = () => {
    const config = PIPE_CONFIGS[pipeMode];
    if (!config || !pipeSteps.length) return;
    const md = [
      `# ${config.icon} ${config.label}`,
      `> Généré par Multi-IA Hub v${APP_VERSION} · Basé sur : "${debQuestion}"`,
      "",
      ...pipeSteps.filter(s=>s.output&&!s.output.startsWith("❌")).map(s =>
        `## ${s.icon} ${s.label}\n\n${s.output}`
      )
    ].join("\n\n---\n\n");
    navigator.clipboard.writeText(md).then(()=>showToast("📋 Pipeline exporté en Markdown"));
  };

  const sendPipelineToChat = () => {
    const lastDone = [...pipeSteps].reverse().find(s=>s.status==="done"&&s.id==="final");
    const best = lastDone || [...pipeSteps].reverse().find(s=>s.status==="done");
    if (!best) return;
    setChatInput(best.output.slice(0,4000));
    navigateTab("chat");
    showToast("✓ Résultat envoyé dans le Chat");
  };

  const sendPipelineToWorkflow = () => {
    const config = PIPE_CONFIGS[pipeMode];
    if (!config || !pipeSteps.length) return;
    const finalStep = pipeSteps.find(s=>s.id==="final");
    if (!finalStep?.output) return;
    setWorkflowInput(debQuestion || "Résultat du débat");
    const nodes = config.steps.map((s,i) => ({
      id: Date.now().toString()+i,
      label: s.label, type:"prompt", ia: IDS.find(id=>enabled[id])||IDS[0],
      prompt: i===0 ? s.prompt("","")||"" : "{PREVIOUS}",
      name: s.id, usePrevOutput: i>0, parallel_ias:[]
    }));
    saveWorkflow(nodes);
    navigateTab("workflows");
    showToast("✓ Pipeline exporté dans Workflows");
  };

  const sortedArena = React.useMemo(() => [...ARENA_MODELS].sort((a,b) => {
    if (arenaSort === "score") return b.score - a.score;
    if (arenaSort === "free") return (b.free?1:0) - (a.free?1:0);
    return a.name.localeCompare(b.name);
  }).filter(m => {
    if (arenaFilter === "all") return true;
    if (arenaFilter === "free") return m.free;
    if (arenaFilter === "top") return m.score >= 9;
    if (arenaFilter === "oss") return m.tag === "OSS" || m.tag === "OSS KING" || m.tag === "FREE";
    return true;
  }), [arenaSort, arenaFilter]);

  const filteredImages = React.useMemo(() => IMAGE_GENERATORS.filter(g => {
    if (imgFilter === "all") return true;
    if (imgFilter === "free") return g.free;
    if (imgFilter === "oss") return g.license && (g.license.includes("Apache")||g.license.includes("GPL")||g.license.includes("OSS")||g.license.includes("Community"));
    if (imgFilter === "paid") return !g.free;
    return true;
  }), [imgFilter]);

  return (
    <>
      <style>{S}</style>
      <div className={`app ${zenMode?"zen-mode":""}`} style={{zoom: uiZoom, transformOrigin:"top left"}}>

        {/* ── OFFLINE BAR ── */}
        {!isOnline && (
          <div className="offline-bar show">
            📡 Hors-ligne — Les IAs sont indisponibles. L'app fonctionne mais les messages ne peuvent pas être envoyés.
          </div>
        )}

        {/* ── MOBILE HEADER (remplace la nav top sur mobile) ── */}

        <div className="mobile-header" style={isMobile?{display:"flex"}:{display:"none"}}>

          <span className="mobile-header-title">
            multi<span style={{color:"var(--mu)",fontWeight:400}}>IA</span>
          </span>


          {tab === "chat" && (
            <button className="mh-btn" title="Historique" onClick={()=>setShowHist(h=>!h)}>📋</button>
          )}
          <button className={`mh-btn ${ttsEnabled?"on":""}`} title="Lecture vocale" onClick={()=>setTtsEnabled(v=>!v)}>🔊</button>
          <button className={`mh-btn ${memFacts.length>0?"on":""}`} style={memFacts.length>0?{borderColor:"var(--ac)",color:"var(--ac)"}:{}} title="Mémoire locale" onClick={()=>setShowMemPanel(m=>!m)}>💾</button>
          <button className="mh-btn" title={darkMode?"Mode clair":"Mode sombre"} onClick={()=>setDarkMode(d=>!d)}>
            {darkMode?"☀":"🌙"}
          </button>
          {pwaPrompt && !pwaInstalled && (
            <button className="mh-btn" style={{borderColor:"var(--ac)",color:"var(--ac)"}} onClick={installPwa} title="Installer l'app">📲</button>
          )}
        </div>

        {/* ── HIST OVERLAY (mobile — ferme en cliquant à côté) ── */}
        {showHist && tab==="chat" && isMobile && (
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",zIndex:299,display:"block"}} onClick={()=>setShowHist(false)}/>
        )}

        {/* ── SÉLECTEUR IA MOBILE (dans le chat) ── */}
        {tab==="chat" && (
          <div className="mobile-ia-selector" style={isMobile?{display:"flex"}:{display:"none"}}>
            {IDS.filter(id=>enabled[id]).map(id => {
              const m = MODEL_DEFS[id];
              const lim = isLimited(id);
              const isActive = mobileCol===id;
              return (
                <button key={id}
                  className={`mobile-ia-chip ${isActive?"active":""}`}
                  style={{
                    borderColor: lim?"#F87171": isActive ? m.color : "var(--bd)",
                    color: lim?"#F87171": isActive ? "#fff" : "var(--mu)",
                    background: isActive ? m.color+"33" : "var(--s2)",
                  }}
                  onClick={()=>setMobileCol(id)}>
                  <span style={{fontSize:16}}>{m.icon}</span>
                  <span>{m.short}</span>
                  {lim && <span style={{fontSize:9,color:"#F87171",marginLeft:2}}>⏳</span>}
                </button>
              );
            })}
          </div>
        )}

        {/* NAV */}
        <div className="nav" style={isMobile?{display:"none"}:{}}>
          <button onClick={()=>setShowMemPanel(m=>!m)} title="Mémoire locale" style={{background:memFacts.length>0?"rgba(212,168,83,.15)":"var(--s1)",border:"1px solid "+(memFacts.length>0?"rgba(212,168,83,.4)":"var(--bd)"),borderRadius:5,color:memFacts.length>0?"var(--ac)":"var(--mu)",fontSize:10,padding:"4px 8px",cursor:"pointer",fontFamily:"var(--font-ui)",whiteSpace:"nowrap",flexShrink:0,position:"relative"}}>
            💾 Mémoire{memFacts.length>0?` (${memFacts.length})`:""}
          </button>
          <button className="zen-mode-btn" style={{position:"relative",bottom:"auto",right:"auto",width:28,height:28,fontSize:11,borderRadius:5,flexShrink:0}} title={zenMode?"Quitter le mode Zen":"Mode Zen (focus)"} onClick={()=>setZenMode(z=>!z)}>{zenMode?"⊡":"⊞"}</button>
          <div className="logo" style={{display:"flex",alignItems:"center",gap:6}}>multi<em>IA</em>
  <em style={{fontSize:11,color:"var(--ac)",background:"rgba(212,168,83,.15)",padding:"1px 6px",borderRadius:4,border:"1px solid rgba(212,168,83,.3)",cursor:"pointer"}}
    title="Cliquer pour forcer le rechargement"
    onClick={()=>{ if(window.caches) window.caches.keys().then(ks=>ks.forEach(k=>window.caches.delete(k))); window.location.reload(true); }}>
    v{APP_VERSION}
  </em>
</div>
          <div className="nav-tabs">
            {[
              ["aide","❓ Aide"],
              ["studio","🎬 Studio Auto"],
              ["router","🧭 Router"],
              ["chat","◈ Chat"],
              ["prompts","📋 Prompts"],
              ["redaction","✍️ Rédaction"],
              ["recherche","🔎 Recherche"],
              ["workflows","🔀 Workflows"],
              ["medias","🎬 Médias"],
              ["comfyui","⬡ ComfyUI"],
              ["arena","⚔ Arène"],
              ["debate","⚡ Débat"],
              ["expert","🧠 Experts"],
              ["notes","📝 Notes"],
              ["traducteur","🌍 Trad."],
              ["agent","🤖 Agent"],
              ["webia","🌐 IAs Web"],
              ["compare","⚖ Comparer"],
              ["stats","📊 Stats"],
              ["analytics","📈 Analytics"],
              ["veille","📰 Veille"],
              ["voice","🎙 Voice"],
              ["projects","📁 Projets"],
              ["benchmark","⚡ Benchmark"],
              ["glossaire","📖 Glossaire"],
              ["autopsy","🔬 Autopsy"],
              ["mentor","🎓 Mentor"],
              ["dna","🧬 DNA"],
              ["conference","🎙 Conférence"],
              ["consensus","🔎 Consensus"],
              ["brief","☀️ Brief"],
              ["taskia","🔀 Task→IAs"],
              ["journaliste","📰 Journaliste"],
              ["skills","🛠 Skills"],
              ["contradict","⚡ Contradict"],
              ["secondbrain","🧠 2nd Brain"],
              ["livedebate","⏱ Débat Live"],
              ["contexttrans","🔄 Contexte"],
              ["apioptim","💡 API Optim"],
              ["civilisations","🌍 Civilisations"],
              ["flash","⚡ Flash"],
              ["advanced","🔬 Avancé"],
              ["config","⚙ Config"],
            ].map(([t,l]) => (
              <button key={t} className={`nt ${tab===t?"on":""}`} onClick={()=>navigateTab(t)}>{l}</button>
            ))}
          </div>
          <div className="pills">
            {IDS.map(id => {
              const m = MODEL_DEFS[id];
              const needsKey = m.keyName && !apiKeys[m.keyName];
              const lim = isLimited(id);
              return (
                <button key={id} className="pill"
                  style={{ borderColor:lim?"var(--red)":enabled[id]?m.color:"var(--bd)", color:lim?"var(--red)":enabled[id]?m.color:"var(--mu)", background:enabled[id]?m.bg:"transparent" }}
                  onClick={() => toggleModel(id)} title={lim?`Bloqué ${fmtCd(id)}`:needsKey?"Clé requise":""}>
                  <span>{m.icon}</span><span>{m.short}</span>
                  {m.free && !lim && <span className="pfree">FREE</span>}
                  {lim && <span style={{fontSize:7,color:"var(--red)"}}>{fmtCd(id)}</span>}
                </button>
              );
            })}
            <button className="btn-xs" onClick={newConv} title="Nouvelle conversation">↺</button>
            <button className="theme-btn" onClick={()=>setDarkMode(d=>!d)} title={darkMode?"Thème clair":"Thème sombre"}>{darkMode?"☀":"🌙"}</button>
            <button className={`voice-btn ${ttsEnabled?"speaking":""}`} onClick={()=>setTtsEnabled(v=>!v)} title="Lecture vocale des réponses">🔊</button>
          </div>
        </div>

        {/* PERSONA BAR */}
        {tab==="chat" && (
          <div className="persona-bar" style={{overflowX:"auto",flexWrap:"nowrap"}}>
            <span className="persona-lbl">Mode :</span>
            <div className="persona-chips">
              {allPersonas.map(p => (
                <button key={p.id} className={`persona-chip ${activePersona===p.id?"on":""}`}
                  style={activePersona===p.id?{borderColor:p.color,color:p.color,background:p.color+"15"}:{}}
                  onClick={()=>setActivePersona(p.id)}>
                  {p.icon} {p.name}
                </button>
              ))}
              <button className="persona-add" onClick={()=>setShowPersonaModal(true)}>＋ Perso</button>
            </div>
          </div>
        )}

        {/* TOKEN BAR */}


        {/* MOBILE COL TABS */}
        {tab === "chat" && (
          <div className="mobile-col-tabs">
            {enabledIds.map(id => {
              const m = MODEL_DEFS[id]; const lim = isLimited(id);
              return (
                <button key={id} className={`mct-btn ${mobileCol===id?"active":""}`}
                  style={mobileCol===id?{}:{borderColor:lim?"var(--red)":m.color,color:lim?"var(--red)":m.color}}
                  onClick={() => setMobileCol(id)}>
                  {m.icon} {m.short}{lim?` ⏳${fmtCd(id)}`:""}
                </button>
              );
            })}
          </div>
        )}

        {/* ── CHAT TAB ── */}
        {tab === "chat" && <>
          {enabled.groq && <div style={{padding:"3px 14px",background:"rgba(249,115,22,.07)",borderBottom:"1px solid rgba(249,115,22,.2)",fontSize:9,color:"var(--orange)",flexShrink:0}}>⚡ <strong>Groq</strong> = <strong>Llama 3.3 70B</strong> (Meta) propulsé par l'infrastructure Groq — Gratuit jusqu'à 14 400 req/jour · Disponible aussi en Débat</div>}

          {/* Layout historique + chat */}
          <div style={{flex:1,display:"flex",overflow:"hidden"}}>

            {/* Bouton toggle sidebar */}
            <button className="hist-toggle" onClick={() => setShowHist(h => !h)} style={isMobile?{display:"none"}:{}}
              title={showHist ? "Masquer l'historique" : "Afficher l'historique"}>
              {showHist ? (isMobile?"✕":"◀") : (isMobile?"📋":"▶")}
            </button>

            {/* Sidebar historique */}
            <div className={`hist-sidebar ${showHist ? "" : "closed"}`}
              style={isMobile ? {
                position:"fixed", top:0, left:0, bottom:0, zIndex:300,
                width:"82vw", maxWidth:300,
                transform: showHist ? "translateX(0)" : "translateX(-105%)",
                transition:"transform .28s cubic-bezier(.4,0,.2,1)",
                boxShadow:"4px 0 30px rgba(0,0,0,.7)",
              } : {}}>
              <div className="hist-hdr">
                <span className="hist-hdr-title">📂 Historique</span>
                <button className="hist-save-btn" onClick={() => saveConv(null)} title="Sauvegarder maintenant">💾</button>
                <button className="hist-save-btn" style={{background:"rgba(96,165,250,.08)",border:"1px solid rgba(96,165,250,.3)",color:"var(--blue)"}} title="Partager la conversation" onClick={() => {
                  const msgs = Object.values(conversations).flat().slice(-8);
                  if (!msgs.length) { showToast("Aucun message à partager"); return; }
                  const txt = msgs.map(m=>(m.role==="user"?"Tu: ":"IA: ")+m.content.slice(0,300)).join("\n\n");
                  navigator.clipboard.writeText(txt);
                  showToast("📋 Conversation copiée !");
                }}>🔗</button>
                <button className="hist-new-btn" onClick={newConv} title="Nouvelle conversation">＋</button>
              </div>
              {/* 🔍 Recherche plein-texte */}
              <div style={{padding:"6px 8px",borderBottom:"1px solid var(--bd)",flexShrink:0}}>
                <input id="hist-search-inp" type="text" value={histSearch} onChange={e=>setHistSearch(e.target.value)}
                  placeholder="🔍 Rechercher… (Ctrl+K)"
                  style={{width:"100%",background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:4,padding:"4px 8px",color:"var(--tx)",fontSize:9,fontFamily:"'IBM Plex Mono',monospace",outline:"none"}}
                />
              </div>
              {/* 📁 Dossiers */}
              <div className="hist-folder-tabs">
                {histFolders.map(f => (
                  <button key={f} className={`hist-folder-tab ${activeFolder===f?"active":""}`}
                    onClick={()=>setActiveFolder(f)} title={f}>{f}</button>
                ))}
                {showFolderInput
                  ? <input autoFocus value={folderInput} onChange={e=>setFolderInput(e.target.value)}
                      onKeyDown={e=>{if(e.key==="Enter")addFolder();if(e.key==="Escape")setShowFolderInput(false);}}
                      onBlur={()=>setShowFolderInput(false)}
                      placeholder="Nom…"
                      style={{width:60,background:"var(--s2)",border:"1px solid var(--ac)",borderRadius:3,padding:"1px 5px",color:"var(--tx)",fontSize:8,fontFamily:"'IBM Plex Mono',monospace",outline:"none"}}/>
                  : <button className="hist-folder-add" onClick={()=>setShowFolderInput(true)} title="Nouveau dossier">＋</button>
                }
              </div>
              <div className="hist-list">
                {filteredConvs.length === 0 ? (
                  <div className="hist-empty">
                    {histSearch ? `Aucun résultat pour "${histSearch}"` : <>Aucune conversation.<br/>Envoie un message,<br/>ça se sauvegarde<br/>automatiquement. 💬</>}
                  </div>
                ) : filteredConvs.map(entry => (
                  <div key={entry.id}
                    className={`hist-item ${activeHistId === entry.id ? "active" : ""}`}
                    onClick={() => loadConv(entry)}>
                    <div className="hist-item-title" style={{display:"flex",alignItems:"flex-start",gap:4}}>
                      <button onClick={e=>{e.stopPropagation();const upd=savedConvs.map(cc=>cc.id===entry.id?{...cc,favorite:!cc.favorite}:cc);setSavedConvs(upd);try{localStorage.setItem("multiia_history",JSON.stringify(upd));}catch{}}}
                        style={{background:"none",border:"none",cursor:"pointer",fontSize:9,padding:0,flexShrink:0,opacity:entry.favorite?1:.3,color:"var(--ac)"}}>⭐</button>
                      <span>{histSearch ? entry.title.replace(new RegExp(`(${histSearch})`, "gi"), "**$1**") : entry.title}</span>
                    </div>
                    <div className="hist-item-meta">
                      <span className="hist-item-date">🕐 {entry.date}</span>
                      {entry.folder && <span style={{fontSize:7,background:"rgba(212,168,83,.12)",color:"var(--ac)",borderRadius:2,padding:"0 3px"}}>{entry.folder}</span>}
                      <div className="hist-item-ias">
                        {(entry.ias||[]).slice(0,4).map(id => (
                          <span key={id} className="hist-item-ia"
                            style={{background:MODEL_DEFS[id]?.color+"18",color:MODEL_DEFS[id]?.color}}>
                            {MODEL_DEFS[id]?.icon}
                          </span>
                        ))}
                      </div>
                    </div>
                    <select
                      title="Déplacer vers un dossier"
                      value={entry.folder||""}
                      onClick={e=>e.stopPropagation()}
                      onChange={e=>{e.stopPropagation();moveConvToFolder(entry.id, e.target.value);}}
                      style={{position:"absolute",top:7,right:24,fontSize:7,background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:3,color:"var(--mu)",padding:"1px 2px",cursor:"pointer",opacity:0,transition:"opacity .15s",width:14}}
                      className="hist-item-folder-sel">
                      <option value="">📁 Sans dossier</option>
                      {histFolders.filter(f=>f!=="Tout"&&f!=="⭐ Favoris").map(f=><option key={f} value={f}>{f}</option>)}
                    </select>
                    <button className="hist-item-del" onClick={e => deleteConv(e, entry.id)} title="Supprimer">✕</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Zone de chat principale */}
            <div className="chat-area">
          {Object.values(loading).some(Boolean) && (
            <div style={{position:"absolute",top:0,left:0,right:0,height:2,zIndex:100,overflow:"hidden",pointerEvents:"none"}}>
              <div style={{height:"100%",background:"linear-gradient(90deg,var(--ac),var(--blue),var(--green),var(--ac))",backgroundSize:"200% 100%",animation:"stream-bar-anim 2s linear infinite",width:"100%"}}/>
            </div>
          )}
          <div className="cols tab-content-mobile"
              onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}
              style={isMobile?{flexDirection:"column"}:{}}>
            {/* 🏆 Bandeau jury amélioré */}
            {voteLoading && (
              <div style={{position:"absolute",top:4,left:"50%",transform:"translateX(-50%)",zIndex:99,background:"rgba(212,168,83,.1)",border:"1px solid rgba(212,168,83,.35)",borderRadius:8,padding:"5px 16px",fontSize:10,color:"var(--mu)",fontFamily:"'IBM Plex Mono',monospace",whiteSpace:"nowrap",pointerEvents:"none",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",gap:6}}>
                <span style={{animation:"spin 1s linear infinite",display:"inline-block"}}>⚖️</span> Jury IA en train de noter…
              </div>
            )}
            {bestVote && !voteLoading && (() => {
              const ranking = bestVote.ranking || [bestVote.winner];
              const medals = ["🥇","🥈","🥉"];
              const winM = MODEL_DEFS[bestVote.winner];
              return (
                <div style={{position:"absolute",top:4,left:"50%",transform:"translateX(-50%)",zIndex:99,width:"min(96vw,1100px)",backdropFilter:"blur(10px)"}}>
                  {/* Header cliquable */}
                  <div onClick={()=>setShowVoteDetail(v=>!v)} style={{cursor:"pointer",background:`linear-gradient(135deg,rgba(212,168,83,.18),rgba(212,168,83,.08))`,border:"1px solid rgba(212,168,83,.5)",borderRadius:showVoteDetail?"8px 8px 0 0":"8px",padding:"6px 12px",display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:14}}>🏆</span>
                    <div style={{flex:1,minWidth:0}}>
                      <span style={{fontSize:10,fontWeight:700,color:winM?.color||"var(--ac)",fontFamily:"'Syne',sans-serif"}}>{winM?.icon} {winM?.short}</span>
                      <span style={{fontSize:9,color:"var(--mu)",marginLeft:8,fontFamily:"'IBM Plex Mono',monospace"}}>— {bestVote.reason?.slice(0,70)}{(bestVote.reason?.length||0)>70?"…":""}</span>
                    </div>
                    <div style={{display:"flex",gap:4,alignItems:"center",flexShrink:0}}>
                      {ranking.slice(0,3).map((id,i)=>( <span key={id} style={{fontSize:9,opacity:.85}}>{medals[i]}{MODEL_DEFS[id]?.icon}</span> ))}
                      <span style={{fontSize:9,color:"var(--mu)",marginLeft:4}}>{showVoteDetail?"▲":"▼"}</span>
                    </div>
                  </div>
                  {/* Détail expand */}
                  {showVoteDetail && (
                    <div style={{background:"rgba(18,18,28,.96)",border:"1px solid rgba(212,168,83,.35)",borderTop:"none",borderRadius:"0 0 8px 8px",padding:"10px 12px",display:"flex",flexDirection:"column",gap:8}}>
                      {/* Podium scores */}
                      <div style={{display:"grid",gridTemplateColumns:`repeat(${ranking.length},minmax(115px,1fr))`,gap:5,overflowX:"auto",paddingBottom:2}}>
                        {ranking.map((id,rank) => {
                          const m = MODEL_DEFS[id]; const sc = bestVote.scores?.[id]; const tot = sc?.total||0;
                          const pts = bestVote.points?.[id]||[];
                          return (
                            <div key={id} style={{background:`${m.color}12`,border:`1px solid ${m.color}40`,borderRadius:6,padding:"5px 7px",position:"relative",minWidth:0}}>
                              <div style={{position:"absolute",top:4,right:6,fontSize:12}}>{medals[rank]||""}</div>
                              <div style={{fontSize:10,fontWeight:700,color:m.color,marginBottom:4,fontFamily:"'Syne',sans-serif"}}>{m.icon} {m.short}</div>
                              {/* Mini score bars */}
                              {[["précision",sc?.precision],["clarté",sc?.clarte],["complétude",sc?.completude],["utilité",sc?.utilite]].map(([lbl,val])=>(
                                <div key={lbl} style={{marginBottom:3}}>
                                  <div style={{display:"flex",justifyContent:"space-between",fontSize:6.5,color:"var(--mu)",marginBottom:1}}><span>{lbl}</span><span style={{color:m.color,fontWeight:700}}>{val||0}</span></div>
                                  <div style={{height:3,background:"var(--s1)",borderRadius:2,overflow:"hidden"}}>
                                    <div style={{height:"100%",width:`${(val||0)*10}%`,background:m.color,borderRadius:2,transition:"width .4s"}}/>
                                  </div>
                                </div>
                              ))}
                              <div style={{marginTop:5,fontSize:8,fontWeight:700,color:m.color}}>TOTAL : {typeof tot==="number"?tot.toFixed(1):tot}/10</div>
                              {pts.length>0 && <div style={{marginTop:4,borderTop:`1px solid ${m.color}25`,paddingTop:4}}>{pts.slice(0,2).map((p,i)=><div key={i} style={{fontSize:7,color:"var(--mu)",marginBottom:1}}>• {p}</div>)}</div>}
                            </div>
                          );
                        })}
                      </div>
                      {/* Raison complète + actions */}
                      <div style={{fontSize:9,color:"var(--mu)",fontFamily:"'IBM Plex Mono',monospace",background:"var(--s1)",padding:"6px 8px",borderRadius:4,borderLeft:"3px solid rgba(212,168,83,.5)"}}>
                        {bestVote.reason}
                      </div>
                      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                        {ranking.length>=2 && (
                          <button onClick={()=>{setDiffPair([ranking[0],ranking[1]]);setShowDiffModal(true);}} style={{fontSize:8,padding:"4px 10px",background:"rgba(96,165,250,.1)",border:"1px solid rgba(96,165,250,.3)",borderRadius:4,color:"var(--blue)",cursor:"pointer"}}>
                            🔍 Voir diff {MODEL_DEFS[ranking[0]]?.icon} vs {MODEL_DEFS[ranking[1]]?.icon}
                          </button>
                        )}
                        <button onClick={()=>setShowRecap(v=>!v)} style={{fontSize:8,padding:"4px 10px",background:"rgba(74,222,128,.08)",border:"1px solid rgba(74,222,128,.25)",borderRadius:4,color:"var(--green)",cursor:"pointer"}}>
                          📋 {showRecap?"Masquer":"Voir"} tableau récap
                        </button>
                        <button onClick={()=>navigateTab("compare")} style={{fontSize:8,padding:"4px 10px",background:"rgba(212,168,83,.1)",border:"1px solid rgba(212,168,83,.3)",borderRadius:4,color:"var(--ac)",cursor:"pointer"}}>
                          📊 Historique comparaisons
                        </button>
                      </div>
                      {/* Tableau récap collapsible */}
                      {showRecap && (
                        <div style={{background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:6,overflow:"hidden"}}>
                          <div style={{overflowX:"auto"}}>
                          <table style={{width:"100%",borderCollapse:"collapse",fontSize:9,minWidth:580}}>
                            <thead>
                              <tr style={{background:"var(--s2)"}}>
                                <th style={{padding:"4px 8px",textAlign:"left",color:"var(--mu)",fontWeight:600}}>IA</th>
                                <th style={{padding:"4px 8px",color:"var(--mu)",fontWeight:600}}>Précision</th>
                                <th style={{padding:"4px 8px",color:"var(--mu)",fontWeight:600}}>Clarté</th>
                                <th style={{padding:"4px 8px",color:"var(--mu)",fontWeight:600}}>Complétude</th>
                                <th style={{padding:"4px 8px",color:"var(--mu)",fontWeight:600}}>Utilité</th>
                                <th style={{padding:"4px 8px",color:"var(--mu)",fontWeight:600}}>Total</th>
                                <th style={{padding:"4px 8px",color:"var(--mu)",fontWeight:600}}>Points clés</th>
                              </tr>
                            </thead>
                            <tbody>
                              {ranking.map((id,i) => {
                                const m=MODEL_DEFS[id]; const sc=bestVote.scores?.[id]||{}; const pts=bestVote.points?.[id]||[];
                                return (
                                  <tr key={id} style={{borderTop:"1px solid var(--bd)",background:i===0?`${m.color}08`:"transparent"}}>
                                    <td style={{padding:"4px 8px",color:m.color,fontWeight:700}}>{medals[i]||""} {m.icon} {m.short}</td>
                                    <td style={{padding:"4px 8px",textAlign:"center",color:"var(--tx)"}}>{sc.precision||"-"}</td>
                                    <td style={{padding:"4px 8px",textAlign:"center",color:"var(--tx)"}}>{sc.clarte||"-"}</td>
                                    <td style={{padding:"4px 8px",textAlign:"center",color:"var(--tx)"}}>{sc.completude||"-"}</td>
                                    <td style={{padding:"4px 8px",textAlign:"center",color:"var(--tx)"}}>{sc.utilite||"-"}</td>
                                    <td style={{padding:"4px 8px",textAlign:"center",fontWeight:700,color:m.color}}>{typeof sc.total==="number"?sc.total.toFixed(1):"-"}</td>
                                    <td style={{padding:"4px 8px",color:"var(--mu)"}}>{pts.slice(0,2).join(" · ")}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}
            {IDS.map(id => {
              const m = MODEL_DEFS[id];
              const lim = isLimited(id);
              const isMobileHidden = enabledIds.length > 0 && mobileCol !== id;
              const isSoloDim = soloId && soloId !== id;
              const isSoloFocus = soloId === id;
              const isFocus = focusId === id;
              const isWinner = bestVote?.winner === id;
              return (
                <div key={id}
                  className={`col ${!enabled[id]?"off":""} ${isSoloDim?"solo-dim":""} ${isSoloFocus?"solo-focus":""}`}
                  style={{
                    background:enabled[id]?`${m.bg}22`:"transparent",
                    display: focusId ? (focusId===id?"flex":"none") : isMobile && mobileCol !== id ? "none" : undefined,
                    flex: focusId===id ? "1" : isMobile && mobileCol === id ? "1" : undefined,
                    width: isMobile ? "100%" : undefined,
                    outline: isWinner ? `2px solid ${m.color}` : loading[id] ? `1px solid ${m.color}60` : undefined,
                    boxShadow: isWinner ? `0 0 20px ${m.color}40` : loading[id] ? `inset 0 0 30px ${m.color}08, 0 0 12px ${m.color}20` : undefined,
                    transition: "box-shadow .4s ease, outline .4s ease",
                  }}>
                  <div className="ch" style={{ borderBottomColor:lim?"var(--red)":loading[id]?m.color:m.border, transition:"border-color .3s" }}>
                    <span className="ci" style={{ color:lim?"var(--red)":m.color, animation: loading[id]?"pulse-glow 1.2s ease-in-out infinite":undefined }}>{m.icon}</span>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div className="cn" style={{ color:lim?"var(--red)":m.color }}>
                        {m.name}
                        {isWinner && <span style={{marginLeft:5,fontSize:9,color:"var(--ac)"}}>🏆</span>}
                      </div>
                      <div className="csub">{m.provider}{m.free&&<span style={{color:"var(--green)",marginLeft:4}}>· FREE</span>}</div>
                      {sessionTokens[id] && (() => {
                        const t = sessionTokens[id];
                        const cost = estimateCost(id, t.in, t.out);
                        const totalTok = t.in + t.out;
                        return (
                          <div style={{fontSize:7,color:"var(--mu)",marginTop:1,fontFamily:"'IBM Plex Mono',monospace"}}>
                            ~{totalTok > 1000 ? (totalTok/1000).toFixed(1)+"k" : totalTok} tokens
                            {cost > 0.0001 && <span style={{color:"var(--green)",marginLeft:4}}>${cost.toFixed(4)}</span>}
                            {cost <= 0.0001 && TOKEN_PRICE[id]?.free && <span style={{color:"var(--green)",marginLeft:4}}>gratuit</span>}
                          </div>
                        );
                      })()}
                    </div>
                    <div className="cm">
                      {loading[id] && (
                        <button onClick={()=>cancelModelCall(id)} title="Annuler la réponse"
                          style={{background:"rgba(248,113,113,.12)",border:"1px solid rgba(248,113,113,.35)",borderRadius:4,color:"var(--red)",fontSize:9,padding:"2px 6px",cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace",marginRight:3,flexShrink:0}}>⏹</button>
                      )}
                      {lim && <span className="countdown">⏳ {fmtCd(id)}</span>}
                      <div className={`dot ${loading[id]?"live":lim?"limited":""}`}/>
                    </div>
                    {/* Boutons Solo + Focus + Export */}
                    <div className="ch-actions">
                      <button className={`ch-btn ${isFocus?"solo-on":""}`}
                        title={isFocus?"Quitter le mode plein écran":"Mode plein écran — cette IA uniquement"}
                        onClick={() => setFocusId(isFocus ? null : id)}>
                        {isFocus ? "⊡" : "⛶"}
                      </button>
                      <button className={`ch-btn ${isSoloFocus?"solo-on":""}`}
                        title={isSoloFocus?"Quitter le mode solo":"Mode solo — envoyer uniquement à cette IA"}
                        onClick={() => setSoloId(isSoloFocus ? null : id)}>
                        {isSoloFocus ? "⊙" : "◎"}
                      </button>
                      <button className="ch-btn" title="Export Markdown" onClick={() => exportMarkdown(id)}>📝</button>
                      <button className="ch-btn" title="Export PDF / Impression" onClick={() => exportPDF(id)}>🖨</button>
                      <button className="ch-btn"
                        title="Exporter la conversation (fichier .txt collable dans une autre IA)"
                        onClick={() => exportConv(id)}>
                        ⬇
                      </button>
                    </div>
                  </div>
                  <div className="msgs" style={{position:"relative"}} ref={el => msgRefs.current[id] = el}>
                    {conversations[id].length === 0 && !loading[id] && <div className="empty">{enabled[id]?lim?`⏳ Bloqué — ${fmtCd(id)}`:"En attente…":"Désactivé"}</div>}
                    {conversations[id].map((msg, i) => (
                      <div key={i} className={`msg ${msg.role==="user"?"u":msg.role==="error"?"e":msg.role==="blocked"?"blocked":"a"}`} style={msg.role==="assistant"?{borderColor:m.border,position:"relative",animation:"fadeInUp .3s ease-out"}:{animation:"fadeInUp .25s ease-out"}}>
                        {msg.think && <CoTBlock think={msg.think}/>}
                        <MarkdownRenderer text={msg.displayContent || msg.content} />
                        {msg.displayContent && <span style={{fontSize:8,color:"var(--mu)",marginLeft:6,verticalAlign:"middle"}}>📄 RAG</span>}
                        {msg.role==="blocked" && (
                          <button onClick={()=>setLimited(prev=>{const n={...prev};delete n[id];return n;})}
                            style={{marginLeft:8,background:"rgba(251,146,60,.2)",border:"1px solid rgba(251,146,60,.5)",borderRadius:4,color:"var(--orange)",fontSize:9,padding:"2px 8px",cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace"}}>
                            🔓 Débloquer
                          </button>
                        )}
                        {msg.role==="assistant" && (
                          <div style={{display:"flex",gap:4,marginTop:5,justifyContent:"flex-end",flexWrap:"wrap"}}>
                            <button className="voice-btn" title="Lire à voix haute" onClick={()=>speakText(msg.content)}>🔊</button>
                            <button className="voice-btn" title="Copier" onClick={()=>{try{navigator.clipboard.writeText(msg.content);}catch{}}}>⎘</button>
                            <button className="voice-btn" title="Réutiliser dans le chat" onClick={()=>{
                              const prev=conversations[id].slice(0,i).reverse().find(x=>x.role==="user");
                              if(prev){setChatInput(prev.content);navigateTab("chat");}
                            }} style={{fontSize:8}}>↩ Renvoyer</button>
                          </div>
                        )}
                      </div>
                    ))}
                    {loading[id] && <div className="msg ld"><span className="dots"><span>·</span><span>·</span><span>·</span></span></div>}
                    <div ref={el => { if(el) msgsEndRefs.current[id] = el; }} style={{height:1}}/>
                  </div>
                  {/* Scroll-to-bottom btn */}
                  {conversations[id]?.length > 4 && !loading[id] && (
                    <button className="scroll-to-bottom" onClick={()=>msgsEndRefs.current[id]?.scrollIntoView({behavior:"smooth"})} title="Défiler vers le bas">↓</button>
                  )}
                </div>
              );
            })}
          </div>
          {/* File attachment preview */}
        {attachedFile && (
          <div className="attach-preview" style={{flexDirection:"column",alignItems:"flex-start",gap:6,padding:"8px 12px"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,width:"100%"}}>
              {attachedFile.type==="image" && attachedFile.base64 && (
                <img src={`data:${attachedFile.mimeType};base64,${attachedFile.base64}`}
                  alt={attachedFile.name}
                  style={{width:64,height:64,objectFit:"cover",borderRadius:5,border:"1px solid var(--bd)",flexShrink:0}}/>
              )}
              {attachedFile.type!=="image" && (
                <div style={{width:48,height:48,background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:5,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <span style={{fontSize:18}}>{attachedFile.icon||"📄"}</span>
                  <span style={{fontSize:6,color:"var(--mu)",marginTop:2}}>{(attachedFile.name||"").split(".").pop().toUpperCase()}</span>
                </div>
              )}
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:10,fontWeight:700,color:"var(--tx)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{attachedFile.name}</div>
                <div style={{fontSize:8,color:"var(--mu)",marginTop:2}}>
                  {attachedFile.type==="image" ? "🖼️ Image" : "📄 Document"} · {attachedFile.type!=="image" ? Math.round((attachedFile.content||"").length/1000)+"k car" : attachedFile.mimeType}
                </div>
                <div style={{fontSize:8,color:"var(--green)",marginTop:2}}>✓ Prêt à envoyer aux IAs</div>
              </div>
              <button onClick={()=>setAttachedFile(null)} style={{marginLeft:"auto",background:"rgba(248,113,113,.1)",border:"1px solid rgba(248,113,113,.3)",borderRadius:4,color:"var(--red)",fontSize:10,padding:"3px 7px",cursor:"pointer",flexShrink:0}}>✕ Retirer</button>
            </div>
          </div>
        )}
        {/* ── RAG Panel ── */}
        {showRagPanel && (
          <div style={{padding:"8px 14px",background:"rgba(96,165,250,.06)",borderBottom:"1px solid rgba(96,165,250,.25)",flexShrink:0}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
              <span style={{fontSize:10,color:"var(--blue)",fontWeight:700}}>📄 RAG — Document contextuel</span>
              {ragChunks.length>0&&<span style={{fontSize:9,color:"var(--green)"}}>✓ {ragChunks.length} morceaux · {Math.round(ragText.length/1000)}k car</span>}
              <button onClick={()=>{setRagText("");setRagChunks([]);showToast("Document RAG effacé");}} style={{marginLeft:"auto",background:"rgba(248,113,113,.1)",border:"1px solid rgba(248,113,113,.3)",borderRadius:4,color:"var(--red)",fontSize:9,padding:"2px 8px",cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace"}}>✕ Effacer</button>
              <button onClick={()=>setShowRagPanel(false)} style={{background:"transparent",border:"1px solid var(--bd)",borderRadius:4,color:"var(--mu)",fontSize:9,padding:"2px 8px",cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace"}}>Masquer</button>
            </div>
            <textarea
              placeholder="Colle ici un texte long (article, PDF, code, rapport…) et pose tes questions dessous. Les passages pertinents seront envoyés automatiquement aux IAs."
              value={ragText}
              onChange={e=>processRagText(e.target.value)}
              style={{width:"100%",minHeight:70,maxHeight:120,background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:5,color:"var(--tx)",fontSize:9,fontFamily:"'IBM Plex Mono',monospace",padding:"6px 10px",resize:"vertical",outline:"none"}}
            />
          </div>
        )}
        {/* ── Session cost strip ── */}
        {Object.keys(sessionTokens).length > 0 && (() => {
          const totalTok = Object.values(sessionTokens).reduce((a,t)=>a+t.in+t.out, 0);
          const totalCost = Object.entries(sessionTokens).reduce((a,[id,t])=>a+estimateCost(id,t.in,t.out), 0);
          return (
            <div style={{display:"flex",alignItems:"center",gap:8,padding:"3px 10px",background:"rgba(212,168,83,.04)",borderTop:"1px solid rgba(212,168,83,.1)",fontSize:8,color:"var(--mu)",fontFamily:"'IBM Plex Mono',monospace",flexShrink:0,flexWrap:"wrap"}}>
              <span>🔢 Session : ~{totalTok>1000?(totalTok/1000).toFixed(1)+"k":totalTok} tokens</span>
              {totalCost > 0.0001 && <span style={{color:"var(--green)"}}>💰 ${totalCost.toFixed(4)}</span>}
              {totalCost <= 0.0001 && <span style={{color:"var(--green)"}}>✓ Gratuit</span>}
              <button onClick={()=>setSessionTokens({})} style={{marginLeft:"auto",background:"none",border:"none",color:"var(--mu)",fontSize:7,cursor:"pointer",padding:"1px 4px",borderRadius:3}}>↺ Reset</button>
            </div>
          );
        })()}
        <div className="foot">
            {/* Prompt variables hint */}
            {chatInput.includes("{{") && (
              <div className="pvar-hint">
                <span style={{color:"var(--ac)",fontWeight:700,marginRight:4}}>📋 Vars :</span>
                {[["{{date}}","📅"],["{{heure}}","🕐"],["{{jour}}","📆"],["{{mois}}","🗓"],["{{annee}}","🔢"]].map(([v,ic])=>(
                  <button key={v} className="pvar-chip" onClick={()=>setChatInput(p=>p.replace(v,applyPromptVars(v)))} title={"Remplacer "+v}>{ic} {v}</button>
                ))}
              </div>
            )}
            {/* Barre d'outils supérieure */}
            <div style={{display:"flex",gap:4,padding:"3px 8px",borderBottom:"1px solid var(--bd)",flexWrap:"wrap",alignItems:"center"}}>
              <button onClick={()=>setShowRagPanel(r=>!r)} title="RAG — coller un document long"
                style={{background:showRagPanel?"rgba(96,165,250,.2)":"transparent",border:"1px solid "+(showRagPanel?"rgba(96,165,250,.6)":"var(--bd)"),borderRadius:4,color:showRagPanel?"var(--blue)":"var(--mu)",fontSize:9,padding:"2px 7px",cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace"}}>
                📄 RAG{ragChunks.length>0&&<span style={{color:"var(--green)",marginLeft:3}}>●</span>}
              </button>
              <button onClick={()=>setShowComfyPanel(r=>!r)} title="ComfyUI local — génération d'images"
                style={{background:comfyConnected?"rgba(124,58,237,.15)":"transparent",border:"1px solid "+(comfyConnected?"rgba(124,58,237,.5)":"var(--bd)"),borderRadius:4,color:comfyConnected?"#A78BFA":"var(--mu)",fontSize:9,padding:"2px 7px",cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace"}}>
                ⬡ ComfyUI{comfyConnected&&<span style={{fontSize:7,marginLeft:3}}>●</span>}
              </button>
              <button onClick={()=>setShowOwuiPanel(r=>!r)} title="Open WebUI — tous vos modèles Ollama via interface OpenAI-compatible"
                style={{background:owuiConnected?"rgba(14,165,233,.15)":"transparent",border:"1px solid "+(owuiConnected?"rgba(14,165,233,.5)":"var(--bd)"),borderRadius:4,color:owuiConnected?"#0EA5E9":"var(--mu)",fontSize:9,padding:"2px 7px",cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace"}}>
                🖥 WebUI{owuiConnected&&<span style={{fontSize:7,marginLeft:3}}>●</span>}
              </button>
              <button onClick={()=>setShowOllamaPanel(r=>!r)} title="Ollama local"
                style={{background:ollamaConnected?"rgba(74,222,128,.12)":"transparent",border:"1px solid "+(ollamaConnected?"rgba(74,222,128,.4)":"var(--bd)"),borderRadius:4,color:ollamaConnected?"var(--green)":"var(--mu)",fontSize:9,padding:"2px 7px",cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace"}}>
                🖥 Ollama{ollamaConnected&&<span style={{fontSize:7,marginLeft:3}}>●</span>}
              </button>
              <button onClick={()=>navigateTab("workflow")} title="Éditeur de workflow visuel"
                style={{background:"transparent",border:"1px solid var(--bd)",borderRadius:4,color:"var(--mu)",fontSize:9,padding:"2px 7px",cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace"}}>
                🔀 Workflow
              </button>
              <button onClick={()=>exportMarkdown(null)} title="Exporter toutes les conversations en Markdown (Ctrl+M)"
                style={{background:"transparent",border:"1px solid var(--bd)",borderRadius:4,color:"var(--mu)",fontSize:9,padding:"2px 7px",cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace"}}>
                📝 .md
              </button>
              <button onClick={()=>exportPDF(null)} title="Exporter en PDF / Imprimer"
                style={{background:"transparent",border:"1px solid var(--bd)",borderRadius:4,color:"var(--mu)",fontSize:9,padding:"2px 7px",cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace"}}>
                🖨 PDF
              </button>
              <button onClick={()=>setShowPromptBuilder(true)} title="Prompt Builder — construire un prompt en blocs"
                style={{background:"rgba(212,168,83,.08)",border:"1px solid rgba(212,168,83,.25)",borderRadius:4,color:"var(--ac)",fontSize:9,padding:"2px 7px",cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace"}}>
                🧱 Builder
              </button>
              <button onClick={()=>{const ids=IDS.filter(id=>enabled[id]);if(ids.length>=2){setDiffIA1(ids[0]);setDiffIA2(ids[1]);setDiffModal(true);}else showToast("Active 2 IAs pour comparer");}} title="Diff — comparer mot à mot les dernières réponses"
                style={{background:"transparent",border:"1px solid var(--bd)",borderRadius:4,color:"var(--mu)",fontSize:9,padding:"2px 7px",cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace"}}>
                ⚡ Diff
              </button>
              {focusId && <span style={{fontSize:9,color:"var(--ac)",marginLeft:"auto"}}>⛶ Plein écran : {MODEL_DEFS[focusId]?.short} — <button onClick={()=>setFocusId(null)} style={{background:"none",border:"none",color:"var(--ac)",cursor:"pointer",fontSize:9,fontFamily:"'IBM Plex Mono',monospace"}}>Esc pour quitter</button></span>}
            </div>
            {/* Ollama mini-panel */}
            {showOllamaPanel && (
              <div style={{padding:"8px 14px",background:"rgba(74,222,128,.06)",borderBottom:"1px solid rgba(74,222,128,.2)",flexShrink:0}}>
                <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                  <span style={{fontSize:10,color:"var(--green)",fontWeight:700}}>🖥 Ollama local</span>
                  <input value={ollamaUrl} onChange={e=>setOllamaUrl(e.target.value)}
                    style={{background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:4,color:"var(--tx)",fontSize:9,padding:"3px 8px",fontFamily:"'IBM Plex Mono',monospace",flex:1,minWidth:160,outline:"none"}} placeholder="http://localhost:11434"/>
                  <button onClick={()=>checkOllama(ollamaUrl)}
                    style={{background:"rgba(74,222,128,.15)",border:"1px solid rgba(74,222,128,.4)",borderRadius:4,color:"var(--green)",fontSize:9,padding:"3px 8px",cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace"}}>
                    {ollamaConnected?"↺ Refresh":"🔌 Connecter"}
                  </button>
                  {ollamaConnected && ollamaModels.length>0 && (
                    <select value={ollamaModel} onChange={e=>setOllamaModel(e.target.value)}
                      style={{background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:4,color:"var(--tx)",fontSize:9,padding:"3px 6px",fontFamily:"'IBM Plex Mono',monospace",outline:"none"}}>
                      {ollamaModels.map(m=><option key={m} value={m}>{m}</option>)}
                    </select>
                  )}
                  {ollamaConnected && (
                    <label style={{display:"flex",alignItems:"center",gap:4,fontSize:9,color:"var(--green)",cursor:"pointer"}}>
                      <input type="checkbox" checked={ollamaActive} onChange={e=>setOllamaActive(e.target.checked)} style={{accentColor:"var(--green)"}}/>
                      Activer pour le chat
                    </label>
                  )}
                  {!ollamaConnected && (
                    <div style={{fontSize:8,color:"var(--mu)",lineHeight:1.6}}>
                      Lance <code style={{color:"var(--ac)"}}>ollama serve</code> puis connecte.
                      <div style={{marginTop:4,display:"flex",gap:4,flexWrap:"wrap"}}>
                        {["llama3.3","mistral","qwen3.5:4b","gemma3","deepseek-r1:7b","phi4"].map(m=>(
                          <span key={m} onClick={()=>{navigator.clipboard.writeText("ollama pull "+m);showToast("✓ Copié : ollama pull "+m);}}
                            style={{fontSize:7,padding:"1px 6px",background:"rgba(74,222,128,.08)",border:"1px solid rgba(74,222,128,.2)",borderRadius:3,color:"var(--green)",cursor:"pointer"}} title="Cliquer pour copier la commande">
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            {/* Open WebUI mini-panel */}
            {showOwuiPanel && (
              <div style={{padding:"8px 14px",background:"rgba(14,165,233,.06)",borderBottom:"1px solid rgba(14,165,233,.2)",flexShrink:0}}>
                <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap",marginBottom:owuiConnected?5:0}}>
                  <span style={{fontSize:10,color:"#0EA5E9",fontWeight:700}}>🖥 Open WebUI</span>
                  <input value={owuiUrl} onChange={e=>setOwuiUrl(e.target.value)}
                    style={{background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:4,color:"var(--tx)",fontSize:9,padding:"3px 8px",fontFamily:"var(--font-mono)",flex:1,minWidth:160,outline:"none"}} placeholder="http://localhost:3000"/>
                  <input value={owuiKey} onChange={e=>setOwuiKey(e.target.value)}
                    style={{background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:4,color:"var(--tx)",fontSize:9,padding:"3px 8px",fontFamily:"var(--font-mono)",width:90,outline:"none"}} placeholder="API Key (opt.)"/>
                  <button onClick={()=>checkOwui(owuiUrl,owuiKey)}
                    style={{background:"rgba(14,165,233,.15)",border:"1px solid rgba(14,165,233,.4)",borderRadius:4,color:"#0EA5E9",fontSize:9,padding:"3px 8px",cursor:"pointer",fontFamily:"var(--font-mono)"}}>
                    {owuiConnected?"↺ Refresh":"🔌 Connecter"}
                  </button>
                </div>
                {owuiConnected&&(
                  <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
                    <span style={{fontSize:8,color:"var(--mu)"}}>{owuiModels.length} modèle{owuiModels.length!==1?"s":""} :</span>
                    <select value={owuiModel} onChange={e=>setOwuiModel(e.target.value)}
                      style={{background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:4,color:"var(--tx)",fontSize:9,padding:"3px 6px",fontFamily:"var(--font-mono)",outline:"none",flex:1,maxWidth:200}}>
                      {owuiModels.map(m=><option key={m} value={m}>{m}</option>)}
                    </select>
                    <label style={{display:"flex",alignItems:"center",gap:4,fontSize:9,color:"#0EA5E9",cursor:"pointer"}}>
                      <input type="checkbox" checked={owuiActive} onChange={e=>setOwuiActive(e.target.checked)} style={{accentColor:"#0EA5E9"}}/>
                      Activer pour le chat
                    </label>
                  </div>
                )}
                {!owuiConnected&&<span style={{fontSize:8,color:"var(--mu)"}}>Lance Open WebUI sur <code style={{color:"var(--ac)"}}>localhost:3000</code> puis connecte</span>}
              </div>
            )}
            {/* ComfyUI mini-panel */}
            {showComfyPanel && (
              <div style={{padding:"8px 14px",background:"rgba(124,58,237,.06)",borderBottom:"1px solid rgba(124,58,237,.2)",flexShrink:0}}>
                <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap",marginBottom:comfyConnected?6:0}}>
                  <span style={{fontSize:10,color:"#A78BFA",fontWeight:700}}>⬡ ComfyUI local</span>
                  <input value={comfyUrl} onChange={e=>setComfyUrl(e.target.value)}
                    style={{background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:4,color:"var(--tx)",fontSize:9,padding:"3px 8px",fontFamily:"var(--font-mono)",flex:1,minWidth:140,outline:"none"}} placeholder="http://127.0.0.1:8188"/>
                  <button onClick={()=>checkComfy(comfyUrl)}
                    style={{background:"rgba(124,58,237,.15)",border:"1px solid rgba(124,58,237,.4)",borderRadius:4,color:"#A78BFA",fontSize:9,padding:"3px 8px",cursor:"pointer",fontFamily:"var(--font-mono)"}}>
                    {comfyConnected?"↺ Refresh":"🔌 Connecter"}
                  </button>
                  <button onClick={()=>navigateTab("comfyui")} style={{background:"transparent",border:"1px solid var(--bd)",borderRadius:4,color:"var(--mu)",fontSize:9,padding:"3px 8px",cursor:"pointer",fontFamily:"var(--font-mono)"}}>
                    ↗ Onglet complet
                  </button>
                  {!comfyConnected&&<span style={{fontSize:8,color:"var(--mu)"}}>Lance ComfyUI puis clique Connecter</span>}
                </div>
                {comfyConnected&&(
                  <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"flex-end"}}>
                    <div style={{flex:2,minWidth:160}}>
                      <div style={{fontSize:7,color:"var(--mu)",marginBottom:2}}>PROMPT IMAGE</div>
                      <input value={comfyPrompt} onChange={e=>setComfyPrompt(e.target.value)}
                        onKeyDown={e=>{if(e.key==="Enter"&&comfyPrompt.trim())generateComfy();}}
                        placeholder="Décris l'image à générer (en anglais)…"
                        style={{width:"100%",background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:4,color:"var(--tx)",fontSize:9,padding:"4px 8px",fontFamily:"var(--font-ui)",outline:"none",boxSizing:"border-box"}}/>
                    </div>
                    {comfyModels.length>0&&(
                      <select value={comfyModel} onChange={e=>setComfyModel(e.target.value)}
                        style={{background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:4,color:"var(--tx)",fontSize:8,padding:"3px 6px",fontFamily:"var(--font-mono)",outline:"none",maxWidth:120}}>
                        {comfyModels.map(m=><option key={m} value={m}>{m.replace(".safetensors","").replace(".ckpt","").slice(0,20)}</option>)}
                      </select>
                    )}
                    <button onClick={()=>generateComfy()} disabled={comfyGenerating||!comfyPrompt.trim()}
                      style={{padding:"4px 12px",background:"rgba(124,58,237,.2)",border:"1px solid rgba(124,58,237,.5)",borderRadius:5,color:"#A78BFA",fontSize:9,cursor:"pointer",fontWeight:700,opacity:comfyGenerating||!comfyPrompt.trim()?.5:1,whiteSpace:"nowrap"}}>
                      {comfyGenerating?"⟳ "+comfyProgress+"%":"⬡ Générer"}
                    </button>
                  </div>
                )}
                {comfyResult&&(
                  <div style={{marginTop:6,display:"flex",alignItems:"center",gap:8}}>
                    <img src={comfyResult.url} alt="ComfyUI result" style={{height:48,width:48,objectFit:"cover",borderRadius:4,border:"1px solid var(--bd)"}}/>
                    <button onClick={()=>sendComfyToChat()} style={{fontSize:8,padding:"3px 8px",background:"rgba(74,222,128,.1)",border:"1px solid rgba(74,222,128,.3)",borderRadius:4,color:"var(--green)",cursor:"pointer"}}>→ Chat</button>
                    <button onClick={()=>{window.__openCanvas&&window.__openCanvas('<img src="'+comfyResult.url+'" style="max-width:100%;border-radius:8px;"/>','html','Résultat ComfyUI');}} style={{fontSize:8,padding:"3px 8px",background:"rgba(124,58,237,.1)",border:"1px solid rgba(124,58,237,.3)",borderRadius:4,color:"#A78BFA",cursor:"pointer"}}>▶ Canvas</button>
                    <a href={comfyResult.url} download style={{fontSize:8,padding:"3px 8px",background:"transparent",border:"1px solid var(--bd)",borderRadius:4,color:"var(--mu)",textDecoration:"none"}}>⬇ Sauver</a>
                  </div>
                )}
                {comfyError&&<div style={{marginTop:4,fontSize:8,color:"var(--red)"}}>{comfyError}</div>}
              </div>
            )}
            <div className="ir">
              <div className="ta-wrap">
                <textarea rows={1} value={chatInput} style={isMobile?{fontSize:"16px"}:{}}
                  placeholder={availableIds.length?`Envoyer à : ${availableIds.map(id=>MODEL_DEFS[id].short).join(", ")}… (Ctrl+Enter)`:"Toutes les IAs sont bloquées…"}
                  onChange={e => { setChatInput(e.target.value); setShowGrammarPopup(false); setGrammarResult(null); }}
                  onKeyDown={e => { if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendChat();} }}
                  onInput={e => { e.target.style.height="auto"; e.target.style.height=Math.min(e.target.scrollHeight,100)+"px"; }}
                />
                {showGrammarPopup && grammarResult && (
                  <div className="grammar-popup">
                    <div className="gp-title">✦ CORRECTION</div>
                    <div className="gp-orig">{grammarResult.original}</div>
                    <div className="gp-corr">{grammarResult.corrected}</div>
                    <div className="gp-btns">
                      <button className="gp-btn" onClick={() => setShowGrammarPopup(false)}>Ignorer</button>
                      <button className="gp-btn apply" onClick={() => { setChatInput(grammarResult.corrected); setShowGrammarPopup(false); }}>✓ Appliquer</button>
                    </div>
                  </div>
                )}
              </div>
              <div className="foot-btns">
                <button className={`gbtn ${grammarLoading?"loading":""}`} onClick={handleGrammarCheck} disabled={!chatInput.trim()||grammarLoading} title="Corriger">
                  {grammarLoading?"⟳":"✎"}
                </button>
                <button className={`mic-btn ${isListening?"on":""}`} onClick={startVoice} title={isListening?"Arrêter la dictée":"Dicter (voix)"}>🎙</button>
                <button className="sbtn" onClick={sendChat} disabled={isLoadingAny||!chatInput.trim()}>↑</button>
              </div>
            </div>
            <div className="fhint">Entrée = envoyer · Shift+Entrée = saut · Ctrl+1/2… = toggle IA · Ctrl+K = chercher · {availableIds.length}/{enabledIds.length} IA(s) dispo{enabledIds.length>availableIds.length&&<span style={{color:"var(--red)",marginLeft:6}}>· {enabledIds.length-availableIds.length} bloquée(s)</span>}</div>
          </div>
            </div>{/* fin chat-area */}
          </div>{/* fin layout hist+chat */}
        </>}

        {/* ── WORKFLOW TAB ── */}
        {(tab === "workflow" || tab === "workflows") && (
          <div className={`scroll-tab pad tab-animate${tabAnimDir==="left"?" tab-animate-left":tabAnimDir==="right"?" tab-animate-right":""}`}>
            {/* ── Header ── */}
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16,flexWrap:"wrap"}}>
              <div style={{fontFamily:"var(--font-display,'Syne',sans-serif)",fontWeight:800,fontSize:14,color:"var(--tx)"}}>🔀 Workflow Multi-Steps</div>
              <div style={{fontSize:9,color:"var(--mu)",flex:1}}>Chaîne d'IAs — sortie de chaque étape → entrée suivante · Variables : {"{INPUT}"} {"{PREVIOUS}"} {"{stepN}"}</div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                <button onClick={()=>addWorkflowNode("prompt")} style={{background:"rgba(212,168,83,.15)",border:"1px solid rgba(212,168,83,.4)",borderRadius:5,color:"var(--ac)",fontSize:9,padding:"5px 10px",cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace"}}>＋ Prompt</button>
                <button onClick={()=>addWorkflowNode("parallel")} style={{background:"rgba(96,165,250,.1)",border:"1px solid rgba(96,165,250,.3)",borderRadius:5,color:"var(--blue)",fontSize:9,padding:"5px 10px",cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace"}}>⚡ Parallèle</button>
                <button onClick={()=>addWorkflowNode("transform")} style={{background:"rgba(251,146,60,.1)",border:"1px solid rgba(251,146,60,.3)",borderRadius:5,color:"var(--orange)",fontSize:9,padding:"5px 10px",cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace"}}>⚙ Transform</button>
                <button onClick={()=>addWorkflowNode("cli")} style={{background:"rgba(74,222,128,.1)",border:"1px solid rgba(74,222,128,.3)",borderRadius:5,color:"var(--green)",fontSize:9,padding:"5px 10px",cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace"}}>🖥 CLI Local</button>
              </div>
            </div>

            {/* ── Quick templates ── */}
            <div style={{marginBottom:14,display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
              <span style={{fontSize:8,color:"var(--mu)",fontWeight:700,letterSpacing:".5px"}}>MODÈLES RAPIDES :</span>
              {[
                {name:"📝 Article blog", nodes:[
                  {id:"t1",label:"Plan en 5 parties",type:"prompt",ia:IDS.find(id=>enabled[id])||IDS[0],prompt:"Génère un plan en 5 parties pour un article sur : {INPUT}",name:"plan",usePrevOutput:false,parallel_ias:[]},
                  {id:"t2",label:"Rédaction complète",type:"prompt",ia:IDS.find(id=>enabled[id])||IDS[0],prompt:"Rédige l'article complet basé sur ce plan :\n{PREVIOUS}",name:"draft",usePrevOutput:true,parallel_ias:[]},
                  {id:"t3",label:"Révision & SEO",type:"prompt",ia:IDS.find(id=>enabled[id])||IDS[0],prompt:"Corrige et optimise SEO cet article :\n{PREVIOUS}",name:"final",usePrevOutput:true,parallel_ias:[]},
                ]},
                {name:"🔬 Analyse IA", nodes:[
                  {id:"t1",label:"Analyse parallèle",type:"parallel",ia:IDS.find(id=>enabled[id])||IDS[0],prompt:"Analyse ce sujet en profondeur : {INPUT}",name:"analyses",usePrevOutput:false,parallel_ias:IDS.filter(id=>enabled[id]).slice(0,3)},
                  {id:"t2",label:"Synthèse des analyses",type:"prompt",ia:IDS.find(id=>enabled[id])||IDS[0],prompt:"Synthétise ces analyses en points clés :\n{PREVIOUS}",name:"synthese",usePrevOutput:true,parallel_ias:[]},
                ]},
                {name:"📄 Texte → PDF", nodes:[
                  {id:"t1",label:"Générer le contenu",type:"prompt",ia:IDS.find(id=>enabled[id])||IDS[0],prompt:"Rédige un document structuré sur : {INPUT}",name:"texte",usePrevOutput:false,parallel_ias:[]},
                  {id:"t2",label:"Exporter en PDF",type:"cli",ia:"",prompt:"{PREVIOUS}",name:"pdf",usePrevOutput:true,parallel_ias:[],cliSoftware:"libreoffice",cliCommand:"cli-anything-libreoffice document create --format pdf --output ./output.pdf",cliDescription:"LibreOffice génère un PDF depuis le texte"},
                ]},
                {name:"🖼 Texte → Image GIMP", nodes:[
                  {id:"t1",label:"Décrire l'image",type:"prompt",ia:IDS.find(id=>enabled[id])||IDS[0],prompt:"Décris précisément une image illustrant : {INPUT}",name:"desc",usePrevOutput:false,parallel_ias:[]},
                  {id:"t2",label:"Créer dans GIMP",type:"cli",ia:"",prompt:"{PREVIOUS}",name:"image",usePrevOutput:true,parallel_ias:[],cliSoftware:"gimp",cliCommand:"cli-anything-gimp project new --width 1920 --height 1080 --output ./output.xcf",cliDescription:"GIMP crée un nouveau projet image"},
                ]},
                {name:"💼 Pitch produit", nodes:[
                  {id:"t1",label:"Problème",type:"prompt",ia:IDS.find(id=>enabled[id])||IDS[0],prompt:"Décris le problème que résout : {INPUT}. Sois factuel et précis.",name:"problem",usePrevOutput:false,parallel_ias:[]},
                  {id:"t2",label:"Solution & USP",type:"prompt",ia:IDS.find(id=>enabled[id])||IDS[0],prompt:"Propose une solution et un USP basés sur :\n{problem}",name:"solution",usePrevOutput:false,parallel_ias:[]},
                  {id:"t3",label:"Pitch 30s",type:"prompt",ia:IDS.find(id=>enabled[id])||IDS[0],prompt:"Rédige un pitch de 30 secondes à partir de :\nProblème: {problem}\nSolution: {solution}",name:"pitch",usePrevOutput:false,parallel_ias:[]},
                ]},
                // ── CLI-Anything tunnels — surcouche optionnelle ──────────────────
                // Si CLI-Anything absent → étapes CLI ignorées, workflow continue
                {name:"🖥 CLI · Rapport PDF", nodes:[
                  {id:"t1",label:"Rédiger le rapport",type:"prompt",ia:IDS.find(id=>enabled[id])||IDS[0],prompt:"Rédige un rapport structuré complet sur : {INPUT}. Utilise des titres, sous-titres et bullet points.",name:"rapport",usePrevOutput:false,parallel_ias:[]},
                  {id:"t2",label:"📄 LibreOffice → PDF",type:"cli",ia:"",prompt:"{PREVIOUS}",name:"pdf",usePrevOutput:true,parallel_ias:[],cliSoftware:"libreoffice",cliCommand:"cli-anything-libreoffice document create --format pdf --output ./rapport_output.pdf",cliDescription:"LibreOffice génère un PDF professionnel"},
                ]},
                {name:"🖥 CLI · Images réseaux", nodes:[
                  {id:"t1",label:"Texte pour post",type:"prompt",ia:IDS.find(id=>enabled[id])||IDS[0],prompt:"Génère un texte accrocheur pour un post sur : {INPUT}. Court, percutant, avec émojis.",name:"texte",usePrevOutput:false,parallel_ias:[]},
                  {id:"t2",label:"🎨 GIMP → formats sociaux",type:"cli",ia:"",prompt:"{PREVIOUS}",name:"image",usePrevOutput:true,parallel_ias:[],cliSoftware:"gimp",cliCommand:"cli-anything-gimp project new --width 1080 --height 1080 --output ./post_square.xcf",cliDescription:"GIMP crée le visuel carré pour Instagram"},
                  {id:"t3",label:"📐 GIMP → format LinkedIn",type:"cli",ia:"",prompt:"{PREVIOUS}",name:"linkedin",usePrevOutput:false,parallel_ias:[],cliSoftware:"gimp",cliCommand:"cli-anything-gimp project new --width 1200 --height 628 --output ./post_linkedin.xcf",cliDescription:"GIMP crée le visuel LinkedIn"},
                ]},
                {name:"🖥 CLI · Audio propre", nodes:[
                  {id:"t1",label:"Script narration",type:"prompt",ia:IDS.find(id=>enabled[id])||IDS[0],prompt:"Écris un script de narration clair et professionnel sur : {INPUT}. Adapté pour une voix off.",name:"script",usePrevOutput:false,parallel_ias:[]},
                  {id:"t2",label:"🔊 Audacity → export MP3",type:"cli",ia:"",prompt:"{PREVIOUS}",name:"audio",usePrevOutput:true,parallel_ias:[],cliSoftware:"audacity",cliCommand:"cli-anything-audacity project new --sample-rate 44100 --output ./narration.aup3",cliDescription:"Audacity prépare le projet audio"},
                ]},
                {name:"🖥 CLI · Présentation auto", nodes:[
                  {id:"t1",label:"Plan de présentation",type:"prompt",ia:IDS.find(id=>enabled[id])||IDS[0],prompt:"Crée un plan de présentation en 8 slides sur : {INPUT}. Format: Slide N | Titre | Contenu bullet points.",name:"plan",usePrevOutput:false,parallel_ias:[]},
                  {id:"t2",label:"✍️ Contenu slides",type:"prompt",ia:IDS.find(id=>enabled[id])||IDS[0],prompt:"Développe le contenu détaillé de chaque slide :\\n{plan}",name:"slides",usePrevOutput:false,parallel_ias:[]},
                  {id:"t3",label:"📊 LibreOffice → Impress",type:"cli",ia:"",prompt:"{PREVIOUS}",name:"pptx",usePrevOutput:true,parallel_ias:[],cliSoftware:"libreoffice",cliCommand:"cli-anything-libreoffice presentation create --format pptx --output ./presentation.pptx",cliDescription:"LibreOffice Impress crée la présentation .pptx"},
                ]},
                {name:"🖥 CLI · Pipeline vidéo", nodes:[
                  {id:"t1",label:"Script vidéo",type:"prompt",ia:IDS.find(id=>enabled[id])||IDS[0],prompt:"Écris un script vidéo de 2 minutes sur : {INPUT}. Format: [INTRO] [PARTIE 1] [PARTIE 2] [CONCLUSION] avec timecodes.",name:"script",usePrevOutput:false,parallel_ias:[]},
                  {id:"t2",label:"🎬 Kdenlive → projet vidéo",type:"cli",ia:"",prompt:"{PREVIOUS}",name:"video",usePrevOutput:true,parallel_ias:[],cliSoftware:"kdenlive",cliCommand:"cli-anything-kdenlive project new --fps 25 --resolution 1920x1080 --output ./video_projet.kdenlive",cliDescription:"Kdenlive crée le projet de montage vidéo"},
                ]},
                {name:"🖥 CLI · Batch images", nodes:[
                  {id:"t1",label:"Instructions de traitement",type:"prompt",ia:IDS.find(id=>enabled[id])||IDS[0],prompt:"Génère des instructions précises de traitement d'images pour : {INPUT}. Ex: resize, watermark, format.",name:"instructions",usePrevOutput:false,parallel_ias:[]},
                  {id:"t2",label:"🎨 GIMP → traitement batch",type:"cli",ia:"",prompt:"{PREVIOUS}",name:"batch",usePrevOutput:true,parallel_ias:[],cliSoftware:"gimp",cliCommand:"cli-anything-gimp batch resize --width 1920 --height 1080 --input ./images/ --output ./images_resized/",cliDescription:"GIMP redimensionne toutes les images du dossier"},
                ]},
                {name:"🖥 CLI · Draw.io Architecture", nodes:[
                  {id:"t1",label:"Analyser & décrire",type:"prompt",ia:IDS.find(id=>enabled[id])||IDS[0],prompt:"Analyse et décris l'architecture système de : {INPUT}. Liste tous les composants, leurs connexions et flux de données.",name:"analyse",usePrevOutput:false,parallel_ias:[]},
                  {id:"t2",label:"Générer le XML Draw.io",type:"prompt",ia:IDS.find(id=>enabled[id])||IDS[0],prompt:"Génère un diagramme Draw.io en XML pour cette architecture :\\n{analyse}\\nFormat : XML valide Draw.io avec tous les noeuds et connexions.",name:"xml",usePrevOutput:false,parallel_ias:[]},
                  {id:"t3",label:"🗺 Draw.io → .drawio",type:"cli",ia:"",prompt:"{PREVIOUS}",name:"diagram",usePrevOutput:true,parallel_ias:[],cliSoftware:"drawio",cliCommand:"cli-anything-drawio diagram create --input-xml ./diagram.xml --output ./architecture.drawio",cliDescription:"Draw.io génère le diagramme d'architecture"},
                ]},
                {name:"🖥 CLI · Draw.io Flowchart", nodes:[
                  {id:"t1",label:"Décrire le processus",type:"prompt",ia:IDS.find(id=>enabled[id])||IDS[0],prompt:"Décris étape par étape le processus de : {INPUT}. Identifie les décisions, les boucles et les points de sortie.",name:"process",usePrevOutput:false,parallel_ias:[]},
                  {id:"t2",label:"Générer XML flowchart",type:"prompt",ia:IDS.find(id=>enabled[id])||IDS[0],prompt:"Génère un flowchart Draw.io en XML pour ce processus :\\n{process}",name:"xml",usePrevOutput:false,parallel_ias:[]},
                  {id:"t3",label:"🔀 Draw.io → flowchart",type:"cli",ia:"",prompt:"{PREVIOUS}",name:"flow",usePrevOutput:true,parallel_ias:[],cliSoftware:"drawio",cliCommand:"cli-anything-drawio diagram create --type flowchart --output ./flowchart.drawio",cliDescription:"Draw.io génère le flowchart exportable"},
                ]},
                {name:"🖥 CLI · Draw.io Mind Map", nodes:[
                  {id:"t1",label:"Structurer les idées",type:"prompt",ia:IDS.find(id=>enabled[id])||IDS[0],prompt:"Crée une structure de mind map complète sur : {INPUT}. Catégories principales, sous-catégories, détails.",name:"structure",usePrevOutput:false,parallel_ias:[]},
                  {id:"t2",label:"🧠 Draw.io → mind map",type:"cli",ia:"",prompt:"{PREVIOUS}",name:"mindmap",usePrevOutput:true,parallel_ias:[],cliSoftware:"drawio",cliCommand:"cli-anything-drawio diagram create --type mindmap --output ./mindmap.drawio",cliDescription:"Draw.io génère le mind map"},
                ]},
                {name:"🖥 CLI · Draw.io Organigramme", nodes:[
                  {id:"t1",label:"Décrire la structure",type:"prompt",ia:IDS.find(id=>enabled[id])||IDS[0],prompt:"Décris la structure organisationnelle de : {INPUT}. Hiérarchie, rôles, responsabilités.",name:"structure",usePrevOutput:false,parallel_ias:[]},
                  {id:"t2",label:"🏢 Draw.io → organigramme",type:"cli",ia:"",prompt:"{PREVIOUS}",name:"org",usePrevOutput:true,parallel_ias:[],cliSoftware:"drawio",cliCommand:"cli-anything-drawio diagram create --type org-chart --output ./organigramme.drawio",cliDescription:"Draw.io génère l'organigramme"},
                ]},
                {name:"🖥 CLI · Draw.io → PNG/SVG", nodes:[
                  {id:"t1",label:"Créer le contenu",type:"prompt",ia:IDS.find(id=>enabled[id])||IDS[0],prompt:"Génère un schéma visuel clair pour : {INPUT}. Décris les éléments et leur disposition.",name:"contenu",usePrevOutput:false,parallel_ias:[]},
                  {id:"t2",label:"📊 Draw.io → export PNG",type:"cli",ia:"",prompt:"{PREVIOUS}",name:"export",usePrevOutput:true,parallel_ias:[],cliSoftware:"drawio",cliCommand:"cli-anything-drawio export --format png --width 1920 --output ./diagram.png",cliDescription:"Draw.io exporte en PNG haute résolution"},
                  {id:"t3",label:"📐 Draw.io → export SVG",type:"cli",ia:"",prompt:"{PREVIOUS}",name:"svg",usePrevOutput:false,parallel_ias:[],cliSoftware:"drawio",cliCommand:"cli-anything-drawio export --format svg --output ./diagram.svg",cliDescription:"Draw.io exporte en SVG vectoriel"},
                ]},
                {name:"🖥 CLI · Doc automatique", nodes:[
                  {id:"t1",label:"Analyser le code",type:"prompt",ia:IDS.find(id=>enabled[id])||IDS[0],prompt:"Analyse ce code et génère une documentation technique complète avec description, paramètres, exemples :\\n{INPUT}",name:"doc",usePrevOutput:false,parallel_ias:[]},
                  {id:"t2",label:"📝 Améliorer la doc",type:"prompt",ia:IDS.find(id=>enabled[id])||IDS[0],prompt:"Améliore et structure cette documentation pour la rendre professionnelle et complète :\\n{doc}",name:"doc_final",usePrevOutput:false,parallel_ias:[]},
                  {id:"t3",label:"📄 LibreOffice → PDF doc",type:"cli",ia:"",prompt:"{PREVIOUS}",name:"pdf_doc",usePrevOutput:true,parallel_ias:[],cliSoftware:"libreoffice",cliCommand:"cli-anything-libreoffice document create --format pdf --output ./documentation.pdf",cliDescription:"LibreOffice exporte la documentation en PDF"},
                ]},
              ].map((tpl,ti) => (
                <button key={ti} onClick={()=>{saveWorkflow(tpl.nodes.map(n=>({...n,id:Date.now().toString()+Math.random()})));setWorkflowResults([]);}}
                  style={{fontSize:8,padding:"3px 9px",background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:4,color:"var(--mu)",cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace",transition:"border-color .15s"}}
                  onMouseEnter={e=>e.currentTarget.style.borderColor="var(--ac)"}
                  onMouseLeave={e=>e.currentTarget.style.borderColor="var(--bd)"}
                >{tpl.name}</button>
              ))}
              {workflowSavedTpls.map((tpl,ti) => (
                <button key={"s"+ti} onClick={()=>{saveWorkflow(tpl.nodes.map(n=>({...n,id:Date.now().toString()+Math.random()})));setWorkflowResults([]);}}
                  style={{fontSize:8,padding:"3px 9px",background:"rgba(212,168,83,.08)",border:"1px solid rgba(212,168,83,.3)",borderRadius:4,color:"var(--ac)",cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace",position:"relative"}}>
                  ⭐ {tpl.name}
                  <span onClick={e=>{e.stopPropagation();saveWfTemplates(workflowSavedTpls.filter((_,i)=>i!==ti));}}
                    style={{marginLeft:4,opacity:.5,cursor:"pointer"}}>✕</span>
                </button>
              ))}
            </div>

            {/* ── Input + run bar ── */}
            <div style={{display:"flex",gap:8,marginBottom:16,alignItems:"center",flexWrap:"wrap"}}>
              <input value={workflowInput} onChange={e=>setWorkflowInput(e.target.value)}
                onKeyDown={e=>{if(e.key==="Enter"&&!workflowRunning&&workflowNodes.length)runWorkflow();}}
                placeholder="Entrée initiale — {INPUT} dans les prompts…"
                style={{flex:1,minWidth:200,background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:6,color:"var(--tx)",fontSize:10,padding:"8px 12px",fontFamily:"'IBM Plex Mono',monospace",outline:"none"}}/>
              {workflowRunning
                ? <button onClick={cancelWorkflow} style={{background:"rgba(248,113,113,.15)",border:"1px solid rgba(248,113,113,.4)",borderRadius:6,color:"var(--red)",fontSize:10,fontWeight:700,padding:"8px 14px",cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace",whiteSpace:"nowrap"}}>⏹ Annuler</button>
                : <button onClick={()=>runWorkflow()} disabled={!workflowNodes.length} style={{background:"rgba(212,168,83,.2)",border:"1px solid rgba(212,168,83,.5)",borderRadius:6,color:"var(--ac)",fontSize:11,fontWeight:700,padding:"8px 16px",cursor:workflowNodes.length?"pointer":"not-allowed",fontFamily:"var(--font-display,'Syne',sans-serif)",opacity:workflowNodes.length?1:.4,whiteSpace:"nowrap"}}>▶ Lancer</button>
              }
              {workflowNodes.length > 0 && !workflowRunning && (
                <button onClick={()=>{const name=prompt("Nom du template :");if(name?.trim())saveWfTemplates([...workflowSavedTpls,{name:name.trim(),nodes:workflowNodes}]);}}
                  style={{background:"rgba(212,168,83,.08)",border:"1px solid rgba(212,168,83,.3)",borderRadius:6,color:"var(--ac)",fontSize:9,padding:"6px 10px",cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace",whiteSpace:"nowrap"}}>⭐ Sauvegarder</button>
              )}
              {workflowResults.length > 0 && (
                <button onClick={()=>{
                  const md = workflowResults.map((r,i)=>`## Étape ${i+1}: ${r.label}\n\n${r.output}`).join("\n\n---\n\n");
                  navigator.clipboard.writeText(md).then(()=>showToast("📋 Résultats copiés en Markdown"));
                }} style={{background:"rgba(96,165,250,.1)",border:"1px solid rgba(96,165,250,.3)",borderRadius:6,color:"var(--blue)",fontSize:9,padding:"6px 10px",cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace",whiteSpace:"nowrap"}}>⎘ Exporter</button>
              )}
              <button onClick={()=>{if(window.confirm("Vider le workflow ?"))saveWorkflow([]);}} style={{background:"rgba(248,113,113,.08)",border:"1px solid rgba(248,113,113,.25)",borderRadius:6,color:"var(--red)",fontSize:9,padding:"6px 9px",cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace"}}>🗑</button>
            </div>

            {/* ── Timeline ── */}
            {workflowNodes.length > 0 && (
              <div style={{display:"flex",gap:0,alignItems:"center",marginBottom:16,overflowX:"auto",paddingBottom:4}}>
                {workflowNodes.map((node,idx) => {
                  const res = workflowResults.find(r=>r.nodeId===node.id);
                  const isRunning = workflowRunStep === node.id;
                  const color = node.type==="parallel"?"var(--blue)":node.type==="transform"?"var(--orange)":"var(--ac)";
                  return (
                    <React.Fragment key={node.id}>
                      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,flexShrink:0}}>
                        <div style={{width:28,height:28,borderRadius:"50%",background:res?.ok?"rgba(74,222,128,.2)":res&&!res.ok?"rgba(248,113,113,.2)":isRunning?`${color}22`:"var(--s2)",border:`2px solid ${res?.ok?"var(--green)":res&&!res.ok?"var(--red)":isRunning?color:"var(--bd)"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:res?.ok?"var(--green)":res&&!res.ok?"var(--red)":isRunning?color:"var(--mu)",animation:isRunning?"pulse-glow 1.2s ease-in-out infinite":undefined,transition:"all .3s"}}>
                          {res?.ok?"✓":res&&!res.ok?"✗":isRunning?"⟳":(idx+1)}
                        </div>
                        <div style={{fontSize:7,color:"var(--mu)",whiteSpace:"nowrap",maxWidth:60,overflow:"hidden",textOverflow:"ellipsis",textAlign:"center"}}>{node.label}</div>
                        {res?.duration && <div style={{fontSize:6,color:"var(--mu)"}}>{(res.duration/1000).toFixed(1)}s</div>}
                      </div>
                      {idx < workflowNodes.length-1 && <div style={{flex:1,height:2,minWidth:12,background:res?.ok?"var(--green)":"var(--bd)",margin:"0 2px",marginBottom:18,transition:"background .5s"}}/>}
                    </React.Fragment>
                  );
                })}
              </div>
            )}

            {/* ── Steps ── */}
            {workflowNodes.length === 0 && (
              <div style={{textAlign:"center",padding:"50px 20px",color:"var(--mu)",fontSize:11}}>
                <div style={{fontSize:40,marginBottom:12}}>🔀</div>
                <div style={{marginBottom:8,color:"var(--tx)",fontWeight:600}}>Aucune étape</div>
                <div style={{fontSize:10,opacity:.7,maxWidth:340,margin:"0 auto"}}>Ajoute des étapes Prompt, Parallèle ou Transform. Chaque sortie est transmise à l'étape suivante automatiquement.</div>
              </div>
            )}
            {workflowNodes.map((node, idx) => {
              const res = workflowResults.find(r=>r.nodeId===node.id);
              const isRunning = workflowRunStep === node.id;
              const typeColor = node.type==="parallel"?"var(--blue)":node.type==="transform"?"var(--orange)":"var(--ac)";
              const typeLabel = node.type==="parallel"?"⚡ Parallèle":node.type==="transform"?"⚙ Transform":"💬 Prompt";
              return (
                <div key={node.id} style={{background:"var(--s1)",border:`1px solid ${isRunning?typeColor:res?.ok?"rgba(74,222,128,.25)":res&&!res.ok?"rgba(248,113,113,.3)":"var(--bd)"}`,borderRadius:10,padding:12,marginBottom:8,display:"flex",flexDirection:"column",gap:8,transition:"border-color .3s",boxShadow:isRunning?`0 0 16px ${typeColor}20`:undefined}}>
                  {/* Step header */}
                  <div style={{display:"flex",alignItems:"center",gap:7,flexWrap:"wrap"}}>
                    <div style={{width:22,height:22,borderRadius:"50%",background:typeColor+"22",border:`1.5px solid ${typeColor}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:800,color:typeColor,flexShrink:0}}>{idx+1}</div>
                    <input value={node.label} onChange={e=>{const n=[...workflowNodes];n[idx]={...n[idx],label:e.target.value};saveWorkflow(n);}}
                      style={{flex:1,background:"transparent",border:"none",color:"var(--tx)",fontSize:11,fontFamily:"'IBM Plex Mono',monospace",outline:"none",fontWeight:600,minWidth:80}} placeholder="Nom de l'étape"/>
                    <span style={{fontSize:8,padding:"2px 6px",background:typeColor+"18",border:`1px solid ${typeColor}40`,borderRadius:3,color:typeColor,whiteSpace:"nowrap"}}>{typeLabel}</span>
                    {/* IA selector */}
                    {node.type !== "parallel" && (
                      <select value={node.ia} onChange={e=>{const n=[...workflowNodes];n[idx]={...n[idx],ia:e.target.value};saveWorkflow(n);}}
                        style={{background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:4,color:"var(--tx)",fontSize:8,padding:"2px 5px",fontFamily:"'IBM Plex Mono',monospace",outline:"none"}}>
                        {IDS.map(id=><option key={id} value={id}>{MODEL_DEFS[id].icon} {MODEL_DEFS[id].short}</option>)}
                      </select>
                    )}
                    {/* Variable name */}
                    <div style={{display:"flex",alignItems:"center",gap:3}}>
                      <span style={{fontSize:7,color:"var(--mu)"}}>{"{"}</span>
                      <input value={node.name||""} onChange={e=>{const n=[...workflowNodes];n[idx]={...n[idx],name:e.target.value.replace(/[^a-zA-Z0-9_]/g,"")};saveWorkflow(n);}}
                        style={{width:55,background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:3,color:"var(--ac)",fontSize:8,padding:"1px 4px",fontFamily:"'IBM Plex Mono',monospace",outline:"none"}}
                        placeholder="varName" title="Nom de variable pour référencer la sortie"/>
                      <span style={{fontSize:7,color:"var(--mu)"}}>{"}"}</span>
                    </div>
                    {/* Reorder */}
                    <button onClick={()=>{if(idx===0)return;const n=[...workflowNodes];[n[idx-1],n[idx]]=[n[idx],n[idx-1]];saveWorkflow(n);}} disabled={idx===0}
                      style={{background:"none",border:"1px solid var(--bd)",borderRadius:3,color:"var(--mu)",fontSize:9,width:20,height:20,cursor:idx===0?"default":"pointer",display:"flex",alignItems:"center",justifyContent:"center",opacity:idx===0?.3:1}}>↑</button>
                    <button onClick={()=>{if(idx===workflowNodes.length-1)return;const n=[...workflowNodes];[n[idx],n[idx+1]]=[n[idx+1],n[idx]];saveWorkflow(n);}} disabled={idx===workflowNodes.length-1}
                      style={{background:"none",border:"1px solid var(--bd)",borderRadius:3,color:"var(--mu)",fontSize:9,width:20,height:20,cursor:idx===workflowNodes.length-1?"default":"pointer",display:"flex",alignItems:"center",justifyContent:"center",opacity:idx===workflowNodes.length-1?.3:1}}>↓</button>
                    <button onClick={()=>saveWorkflow(workflowNodes.filter((_,i)=>i!==idx))}
                      style={{background:"rgba(248,113,113,.1)",border:"1px solid rgba(248,113,113,.3)",borderRadius:4,color:"var(--red)",fontSize:9,padding:"2px 6px",cursor:"pointer"}}>✕</button>
                  </div>

                  {/* Parallel IAs selector */}
                  {node.type === "parallel" && (
                    <div>
                      <div style={{fontSize:8,color:"var(--mu)",marginBottom:5}}>IAs à lancer en parallèle :</div>
                      <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                        {IDS.filter(id=>enabled[id]).map(id => (
                          <label key={id} style={{display:"flex",alignItems:"center",gap:3,fontSize:9,color:MODEL_DEFS[id].color,cursor:"pointer",padding:"2px 6px",background:(node.parallel_ias||[]).includes(id)?`${MODEL_DEFS[id].color}18`:"transparent",border:`1px solid ${(node.parallel_ias||[]).includes(id)?MODEL_DEFS[id].color+"60":"var(--bd)"}`,borderRadius:4,transition:"all .15s"}}>
                            <input type="checkbox" checked={(node.parallel_ias||[]).includes(id)} onChange={e=>{
                              const pias = e.target.checked ? [...(node.parallel_ias||[]), id] : (node.parallel_ias||[]).filter(x=>x!==id);
                              const n=[...workflowNodes]; n[idx]={...n[idx],parallel_ias:pias}; saveWorkflow(n);
                            }} style={{accentColor:MODEL_DEFS[id].color,margin:0}}/>
                            {MODEL_DEFS[id].icon} {MODEL_DEFS[id].short}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Prompt / Transform textarea */}
                  <div>
                    <div style={{fontSize:7,color:"var(--mu)",marginBottom:3}}>
                      {node.type==="transform" ? "Code JS — fonction(input, prev, named) { … return string; }" : "Prompt — variables : {INPUT} {PREVIOUS}"+( idx>0?" {"+workflowNodes[idx-1].name+"}":"" )}
                    </div>
                    <textarea value={node.prompt} onChange={e=>{const n=[...workflowNodes];n[idx]={...n[idx],prompt:e.target.value};saveWorkflow(n);}}
                      placeholder={node.type==="transform"?"return prev.toUpperCase();" : node.type==="parallel"?"Analyse ce sujet : {INPUT}":"Résume ceci en 5 points :\n{PREVIOUS}"}
                      rows={node.type==="transform"?3:2}
                      style={{width:"100%",background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:5,color:"var(--tx)",fontSize:9,fontFamily:"'IBM Plex Mono',monospace",padding:"6px 9px",resize:"vertical",outline:"none",lineHeight:1.55}}/>
                  </div>

                  {/* Result */}
                  {res && (
                    <div style={{background:res.ok?"rgba(74,222,128,.04)":"rgba(248,113,113,.04)",border:`1px solid ${res.ok?"rgba(74,222,128,.2)":"rgba(248,113,113,.2)"}`,borderRadius:6,overflow:"hidden"}}>
                      <div style={{display:"flex",alignItems:"center",gap:6,padding:"4px 9px",background:res.ok?"rgba(74,222,128,.06)":"rgba(248,113,113,.06)",borderBottom:`1px solid ${res.ok?"rgba(74,222,128,.15)":"rgba(248,113,113,.15)"}`}}>
                        <span style={{fontSize:9,color:res.ok?"var(--green)":"var(--red)"}}>{res.ok?"✓ Succès":"✗ Erreur"}</span>
                        {res.duration && <span style={{fontSize:8,color:"var(--mu)"}}>{(res.duration/1000).toFixed(1)}s</span>}
                        <button onClick={()=>{try{navigator.clipboard.writeText(res.output);}catch{}}} style={{marginLeft:"auto",background:"none",border:"1px solid var(--bd)",borderRadius:3,color:"var(--mu)",fontSize:8,padding:"1px 5px",cursor:"pointer"}}>⎘</button>
                        <button onClick={()=>{setChatInput(res.output);navigateTab("chat");}} style={{background:"rgba(212,168,83,.1)",border:"1px solid rgba(212,168,83,.3)",borderRadius:3,color:"var(--ac)",fontSize:8,padding:"1px 5px",cursor:"pointer"}}>→ Chat</button>
                      </div>
                      <div style={{padding:"8px 10px",maxHeight:160,overflowY:"auto"}}>
                        <MarkdownRenderer text={res.output}/>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* ── Plugin section (kept) ── */}
            <div style={{marginTop:24,borderTop:"1px solid var(--bd)",paddingTop:16}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
                <span style={{fontFamily:"var(--font-display,'Syne',sans-serif)",fontWeight:700,fontSize:12,color:"var(--tx)"}}>🔌 Plugins JS</span>
                <span style={{fontSize:9,color:"var(--mu)"}}>Charger des modules JavaScript depuis un CDN</span>
              </div>
              <div style={{marginBottom:14,overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:9,fontFamily:"'IBM Plex Mono',monospace"}}>
                  <thead><tr style={{borderBottom:"1px solid var(--bd)"}}>{["Plugin","Utilité","Action"].map(h=><th key={h} style={{padding:"5px 8px",color:"var(--mu)",textAlign:"left",fontWeight:600}}>{h}</th>)}</tr></thead>
                  <tbody>{[
                    {name:"📊 Chart.js",usage:"Graphiques",url:"https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js"},
                    {name:"🎨 Highlight.js",usage:"Coloration syntaxique",url:"https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"},
                    {name:"🔒 DOMPurify",usage:"Anti-XSS",url:"https://cdnjs.cloudflare.com/ajax/libs/dompurify/3.0.6/purify.min.js"},
                    {name:"📐 Math.js",usage:"Calcul avancé",url:"https://cdnjs.cloudflare.com/ajax/libs/mathjs/12.4.1/math.min.js"},
                    {name:"📦 JSZip",usage:"ZIP",url:"https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"},
                    {name:"🔁 Lodash",usage:"Utilitaires JS",url:"https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.min.js"},
                  ].map(p=>(<tr key={p.url} style={{borderBottom:"1px solid rgba(255,255,255,.03)"}}>
                    <td style={{padding:"5px 8px",color:"var(--tx)",fontWeight:600}}>{p.name}</td>
                    <td style={{padding:"5px 8px",color:"var(--mu)"}}>{p.usage}</td>
                    <td style={{padding:"5px 8px"}}><button onClick={()=>loadPlugin(p.url)} style={{background:"rgba(74,222,128,.12)",border:"1px solid rgba(74,222,128,.3)",borderRadius:3,color:"var(--green)",fontSize:8,padding:"2px 8px",cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace",whiteSpace:"nowrap"}}>{plugins.find(x=>x.url===p.url)?"✓ Chargé":"+ Charger"}</button></td>
                  </tr>))}</tbody>
                </table>
              </div>
              <div style={{display:"flex",gap:6,marginBottom:10}}>
                <input value={pluginUrlInput} onChange={e=>setPluginUrlInput(e.target.value)}
                  placeholder="URL CDN personnalisée…"
                  style={{flex:1,background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:5,color:"var(--tx)",fontSize:10,padding:"6px 10px",fontFamily:"'IBM Plex Mono',monospace",outline:"none"}}/>
                <button onClick={()=>{if(pluginUrlInput.trim()){loadPlugin(pluginUrlInput.trim());setPluginUrlInput("");}}} style={{background:"rgba(96,165,250,.15)",border:"1px solid rgba(96,165,250,.4)",borderRadius:5,color:"var(--blue)",fontSize:10,padding:"6px 12px",cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace"}}>Charger URL</button>
              </div>
              {plugins.length>0&&<div style={{fontSize:9,color:"var(--mu)",marginBottom:6}}>Plugins actifs :</div>}
              {plugins.map(p=>(<div key={p.url} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 8px",background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:5,marginBottom:5,fontSize:9,fontFamily:"'IBM Plex Mono',monospace"}}>
                <span style={{color:p.loaded?"var(--green)":"var(--mu)"}}>{p.loaded?"●":"○"}</span>
                <span style={{flex:1,color:"var(--tx)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</span>
                <button onClick={()=>{const np=plugins.filter(x=>x.url!==p.url);setPlugins(np);localStorage.setItem("multiia_plugins",JSON.stringify(np));}} style={{background:"rgba(248,113,113,.1)",border:"1px solid rgba(248,113,113,.3)",borderRadius:3,color:"var(--red)",fontSize:9,padding:"1px 6px",cursor:"pointer"}}>✕</button>
              </div>))}
            </div>
          </div>
        )}

        {/* ── WEB TAB ── */}
        {/* ── WEB TAB ── */}
        {tab === "web" && (
          <div className={`scroll-tab pad tab-animate${tabAnimDir==="left"?" tab-animate-left":tabAnimDir==="right"?" tab-animate-right":""}`}>
            <div style={{ marginBottom:12, fontSize:11, color:"var(--mu)" }}>
              🌐 <strong style={{ color:"var(--tx)" }}>IAs Web</strong> — Ces services ne peuvent pas être intégrés (sécurité iframe). Clique pour ouvrir dans un nouvel onglet.
            </div>
            <div className="web-grid">
              {WEB_AIS.map(ai => (
                <div key={ai.id} className="web-card" style={{ borderColor:ai.color+"33" }}>
                  <div className="wc-hdr">
                    <div className="wc-icon" style={{ background:ai.color+"18", color:ai.color }}>{ai.icon}</div>
                    <div><div className="wc-name" style={{ color:ai.color }}>{ai.name}</div><div className="wc-sub">{ai.subtitle}</div></div>
                  </div>
                  <div className="wc-desc">{ai.desc}</div>
                  <a href={ai.url} target="_blank" rel="noreferrer" className="wc-btn" style={{ borderColor:ai.color, color:ai.color }}>↗ Ouvrir {ai.name}</a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── ARENA TAB ── */}
        {tab === "arena" && (
          <div className="arena-wrap">
            <div className="arena-hero">
              <div className="arena-title">⚔ Arène Algorithmique</div>
              <div className="arena-sub">Pas de favoritisme. Comparaison sans pitié sur 5 critères réels. Les chiffres parlent, les benchmarks ne mentent pas (enfin, pas toujours).</div>
            </div>

            <div className="pad" style={{ paddingTop:0 }}>

              {/* ── ACTUALITÉS EN PREMIER ── */}
              <AINewsBlock />

              {/* ── CRITÈRES ── */}
              <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:11, color:"var(--ac)", marginBottom:10, letterSpacing:1 }}>📋 NOS CRITÈRES DE JUGEMENT</div>
              <div className="criteria-grid">
                {[
                  { icon:"⚡", title:"Performances pures", desc:"Taille du modèle (B params), rapidité d'inférence, taux d'hallucinations, benchmarks MMLU/HumanEval" },
                  { icon:"🔧", title:"Fonctionnalités avancées", desc:"Plugins, multimodal (image/audio/vidéo), agents autonomes, outils de code et recherche web" },
                  { icon:"💰", title:"Tarification (sans pitié)", desc:"Du gratuit total au 'plutôt douloureux'. Coût réel pour 1M tokens, tiers gratuits, limites" },
                  { icon:"🔐", title:"Vie privée & éthique", desc:"Données stockées où ? Censure ? Politique d'entraînement sur vos données ? Juridiction RGPD ?" },
                  { icon:"💼", title:"Cas d'usage réels", desc:"Parce que faire des haïkus ne paie pas les factures. Code, analyse, SEO, agents, RAG, multilingue" },
                ].map(c => (
                  <div key={c.title} className="crit-card">
                    <div className="crit-icon">{c.icon}</div>
                    <div className="crit-title">{c.title}</div>
                    <div className="crit-desc">{c.desc}</div>
                  </div>
                ))}
              </div>

              <div style={{ display:"flex", gap:6, marginBottom:10, flexWrap:"wrap", alignItems:"center" }}>
                <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:11, color:"var(--ac)", letterSpacing:1, marginRight:4 }}>🏆 TABLEAU COMPARATIF</div>
                <span style={{ fontSize:8, color:"var(--mu)", padding:"1px 5px", border:"1px solid var(--bd)", borderRadius:3 }}>Mis à jour manuellement · pas de source temps réel standardisée</span>
                {[["all","Tous"],["top","Top ≥9"],["free","Gratuits"],["oss","Open Source"]].map(([f,l]) => (
                  <button key={f} className={`filter-btn ${arenaFilter===f?"on":""}`} onClick={() => setArenaFilter(f)}>{l}</button>
                ))}
                <div style={{ marginLeft:"auto", display:"flex", gap:5 }}>
                  {[["score","Score"],["free","Gratuit"],["name","Nom"]].map(([s,l]) => (
                    <button key={s} className={`filter-btn ${arenaSort===s?"on":""}`} onClick={() => setArenaSort(s)} style={{ fontSize:8 }}>↕ {l}</button>
                  ))}
                </div>
              </div>

              <div className="tbl-wrap" style={{ marginBottom:24 }}>
                <table className="arena-tbl">
                  <thead>
                    <tr>
                      <th>#</th><th>IA</th><th>Provider</th><th>Params</th><th>Contexte</th><th>Cible</th><th>Score</th><th>Prix</th><th>Tag</th><th>Points forts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedArena.map((m, i) => (
                      <tr key={m.name}>
                        <td style={{ color:"var(--mu)", fontSize:9 }}>{i+1}</td>
                        <td>
                          <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                            <span style={{ color:m.color, fontSize:13 }}>{m.icon}</span>
                            <div>
                              <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:10, color:m.color }}>{m.name}</div>
                              {m.free && <span className="free-badge">FREE</span>}
                            </div>
                          </div>
                        </td>
                        <td style={{ color:"var(--mu)", fontSize:9 }}>{m.provider}</td>
                        <td><span className="params-badge">{m.params}</span></td>
                        <td style={{ fontSize:9 }}>{m.ctx}</td>
                        <td style={{ color:"var(--mu)", fontSize:9 }}>{m.target}</td>
                        <td><ScoreBar score={m.score} /></td>
                        <td><span className="prix-badge">{m.prix}</span></td>
                        <td><span className="tag-badge" style={{ color:m.color, background:m.color+"18" }}>{m.tag}</span></td>
                        <td style={{ fontSize:9, color:"var(--mu)", maxWidth:160 }}>{m.strengths.slice(0,3).join(" · ")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="cfg-note" style={{ marginBottom:20 }}>* = estimation non-officielle (les labs ne publient pas les tailles exactes) · Prix : ¢=très peu cher · $ à $$$$=progressif · B=milliards de paramètres d'entraînement</div>

              <div style={{ display:"flex", gap:12, marginBottom:16, flexWrap:"wrap" }}>
                <div style={{ flex:1, minWidth:200 }}>
                  <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:11, color:"var(--green)", marginBottom:8, letterSpacing:1 }}>🏆 TOPS</div>
                  {[
                    { icon:"◉", color:"#5AC87C", title:"Raisonnement : GPT-o3", sub:"Records absolus sur maths et science. Irremplaçable pour les problèmes complexes." },
                    { icon:"✦", color:"#D4A853", title:"Polyvalent Pro : Claude Sonnet 4", sub:"Meilleur ratio qualité/prix pour usage professionnel intensif." },
                    { icon:"⬡", color:"#A0C8FF", title:"Économique : DeepSeek V3/R1", sub:"671B MoE à des prix dérisoires. Parfait pour scaler en production." },
                    { icon:"◇", color:"#6BA5E0", title:"Contexte géant gratuit : Gemini Flash", sub:"1 million de tokens gratuits. Aucun rival sur ce terrain." },
                    { icon:"⚡", color:"#F97316", title:"OSS Gratuit : Llama 3.3 via Groq", sub:"14 400 requêtes/jour gratuitement. Résultats pro pour 0€." },
                  ].map(t => (
                    <div key={t.title} style={{ display:"flex", gap:7, padding:"6px 0", borderBottom:"1px solid var(--bd)" }}>
                      <span style={{ color:t.color, fontSize:14, flexShrink:0 }}>{t.icon}</span>
                      <div><div style={{ fontSize:10, fontWeight:700, color:t.color }}>{t.title}</div><div style={{ fontSize:9, color:"var(--mu)", lineHeight:1.5 }}>{t.sub}</div></div>
                    </div>
                  ))}
                </div>
                <div style={{ flex:1, minWidth:200 }}>
                  <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:11, color:"var(--red)", marginBottom:8, letterSpacing:1 }}>💀 FLOPS</div>
                  {[
                    { icon:"⊞", color:"#9999AA", title:"Copilot : marketing > substance", sub:"Les promesses de l'IA intégrée à Office déçoivent en pratique quotidienne." },
                    { icon:"文", color:"#9999AA", title:"Ernie 5.0 : inaccessible hors Chine", sub:"Censuré, serveurs saturés hors Asie, peu de confiance pour données pro." },
                    { icon:"◉", color:"#9999AA", title:"GPT-o3 : facture salée", sub:"Performances exceptionnelles mais coût prohibitif pour la plupart des usages." },
                    { icon:"φ", color:"#9999AA", title:"Phi-3.5 : trop petit pour tâches complexes", sub:"Bien pour l'edge/mobile mais les limites sont vite atteintes." },
                  ].map(t => (
                    <div key={t.title} style={{ display:"flex", gap:7, padding:"6px 0", borderBottom:"1px solid var(--bd)" }}>
                      <span style={{ color:t.color, fontSize:14, flexShrink:0 }}>{t.icon}</span>
                      <div><div style={{ fontSize:10, fontWeight:700, color:"var(--mu)" }}>{t.title}</div><div style={{ fontSize:9, color:"var(--mu)", lineHeight:1.5 }}>{t.sub}</div></div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom:8, display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:11, color:"var(--ac)", letterSpacing:1 }}>📅 GRANDES ACTUALITÉS 2024–2025</div>
                <span style={{ fontSize:8, color:"var(--mu)", padding:"1px 5px", border:"1px solid var(--bd)", borderRadius:3 }}>Chronologie · Voir flux RSS ci-dessus pour l'actu en temps réel</span>
              </div>
              <div className="news-grid" style={{ marginBottom:20 }}>
                {ARENA_NEWS.map((n, i) => (
                  <div key={i} className="news-card" style={{ borderColor:n.color+"33" }}>
                    <div className="news-icon" style={{ color:n.color }}>{n.icon}</div>
                    <div className="news-body">
                      <div className="news-hdr">
                        <div className="news-title" style={{ color:n.color }}>{n.title}</div>
                        <span className="news-tag" style={{ background:n.color+"18", color:n.color }}>{n.tag}</span>
                        <span className="news-date">{n.date}</span>
                      </div>
                      <div className="news-text">{n.text}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:11, color:"var(--ac)", marginBottom:10, letterSpacing:1 }}>🔌 PLUGINS & COMMUNAUTÉ EN CROISSANCE</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))", gap:8, marginBottom:20 }}>
                {[
                  { icon:"◈", color:"#74C98C", name:"GPTs / OpenAI Store", desc:"Des milliers d'agents spécialisés. Le plus grand écosystème de plugins IA.", note:"En croissance" },
                  { icon:"🤗", color:"#FFD21E", name:"HuggingFace Hub", desc:"200k+ modèles open source. LoRAs, datasets, Spaces interactifs.", note:"Très actif" },
                  { icon:"🔧", color:"#10B981", name:"ComfyUI Community", desc:"Des milliers de workflows image/vidéo partagés. Nodes custom.", note:"Explosion" },
                  { icon:"⚡", color:"#F97316", name:"Ollama + Open WebUI", desc:"Run local n'importe quel modèle. Interface web soignée.", note:"Viral" },
                  { icon:"▲", color:"#FF8C69", name:"Mistral Agents API", desc:"Agents avec outils, mémoire, navigation web. Européen RGPD.", note:"Nouveau" },
                  { icon:"✦", color:"#D4A853", name:"Claude Tool Use", desc:"Claude avec outils : computer use, navigation web, exécution code.", note:"En expansion" },
                ].map(p => (
                  <div key={p.name} style={{ background:"var(--s1)", border:`1px solid ${p.color}33`, borderRadius:8, padding:"10px 12px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:5 }}>
                      <span style={{ color:p.color, fontSize:16 }}>{p.icon}</span>
                      <div>
                        <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:10, color:p.color }}>{p.name}</div>
                        <span style={{ fontSize:7, padding:"1px 4px", borderRadius:2, background:p.color+"18", color:p.color, fontWeight:700 }}>{p.note}</span>
                      </div>
                    </div>
                    <div style={{ fontSize:9, color:"var(--mu)", lineHeight:1.5 }}>{p.desc}</div>
                  </div>
                ))}
              </div>

              <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:11, color:"var(--blue)", marginBottom:10, letterSpacing:1 }}>🐋 MODÈLES XXL — Les mastodontes</div>
              <div className="cfg-note">
                Les modèles qui jouent dans la cour des grands (150B+ paramètres ou 200k+ tokens) :<br/><br/>
                <strong style={{color:"var(--ac)"}}>GPT-o1/o3 (~300B*)</strong> — Raisonnement profond, records sur ARC-AGI, mathématiques complexes · 
                <strong style={{color:"var(--ac)"}}>  Claude Opus 4 (~200B*)</strong> — Multimodal, 200k tokens, agents autonomes sur PC · 
                <strong style={{color:"var(--ac)"}}>  DeepSeek V3/R1 (671B MoE)</strong> — Architecture Mixture-of-Experts, 37B params actifs, open source · 
                <strong style={{color:"var(--ac)"}}>  Llama 3.1 405B</strong> — Le géant open weights de Meta, 128k tokens · 
                <strong style={{color:"var(--ac)"}}>  Gemini 1.5 Pro (2M tokens)</strong> — Le seul modèle avec 2 millions de tokens de contexte · 
                <strong style={{color:"var(--ac)"}}>  Grok 3 (~300B*)</strong> — Accès temps réel, image/audio · 
                <strong style={{color:"var(--ac)"}}>  Ernie 5.0 (~260B*)</strong> — Multimodal full pour le marché chinois<br/><br/>
                Image, plugins, agents personnalisés… tout y est chez les top-tier. Les modèles XXL surpassent les petits sur le raisonnement en plusieurs étapes, le code complexe, et la cohérence sur de longs documents.
              </div>
            </div>
          </div>
        )}

        {/* ── YOUTUBE TAB ── */}
        {/* ── MÉDIAS TAB (YouTube + Images fusionnés) ── */}
        {tab === "medias" && (
          <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",paddingBottom:isMobile?"64px":"0"}}>
            <div className="media-subtabs">
              {[["youtube","▶ YouTube"],["images","🎨 Images IA"],["comfy","⬡ ComfyUI Local"],["webia","🌐 IAs Web"]].map(([k,l])=>(
                <button key={k} className={"media-stab "+(mediaSubTab===k?"on":"")} onClick={()=>setMediaSubTab(k)}>{l}</button>
              ))}
            </div>
            <div className="media-content">
              {mediaSubTab==="youtube" && <YouTubeTab apiKeys={apiKeys} />}
              {mediaSubTab==="comfy" && (
                <div style={{flex:1,overflow:"auto",padding:"12px 14px",display:"flex",flexDirection:"column",gap:12}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
                    <div style={{fontFamily:"var(--font-display)",fontWeight:800,fontSize:14,color:"#A78BFA"}}>⬡ ComfyUI Local</div>
                    <div style={{fontSize:9,color:comfyConnected?"var(--green)":"var(--red)"}}>
                      {comfyConnected?"● Connecté":"○ Non connecté"}
                    </div>
                    {!comfyConnected&&<button onClick={()=>checkComfy()} style={{fontSize:9,padding:"3px 10px",background:"rgba(124,58,237,.12)",border:"1px solid rgba(124,58,237,.35)",borderRadius:5,color:"#A78BFA",cursor:"pointer"}}>🔌 Connecter</button>}
                    <button onClick={()=>navigateTab("comfyui")} style={{marginLeft:"auto",fontSize:9,padding:"3px 10px",background:"transparent",border:"1px solid var(--bd)",borderRadius:5,color:"var(--mu)",cursor:"pointer"}}>↗ Onglet complet</button>
                  </div>
                  {/* Quick generate */}
                  <div style={{background:"var(--s1)",border:"1px solid rgba(124,58,237,.2)",borderRadius:8,padding:"12px 14px"}}>
                    <div style={{fontSize:9,fontWeight:700,color:"var(--mu)",marginBottom:8}}>GÉNÉRATION RAPIDE</div>
                    <div style={{display:"flex",gap:7,marginBottom:8}}>
                      <input value={comfyPrompt} onChange={e=>setComfyPrompt(e.target.value)}
                        placeholder="Décris l'image à générer (en anglais)…"
                        style={{flex:1,background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:5,color:"var(--tx)",fontSize:10,padding:"6px 9px",fontFamily:"var(--font-ui)",outline:"none"}}
                        onKeyDown={e=>{if(e.key==="Enter")generateComfy();}}/>
                      <button onClick={()=>generateComfy()} disabled={comfyGenerating||!comfyConnected}
                        style={{padding:"0 14px",background:"rgba(124,58,237,.2)",border:"1px solid rgba(124,58,237,.5)",borderRadius:5,color:"#A78BFA",fontSize:10,cursor:"pointer",fontWeight:700,opacity:!comfyConnected?.4:1}}>
                        {comfyGenerating?comfyProgress+"%":"⬡ Go"}
                      </button>
                    </div>
                    {comfyGenerating&&<div style={{height:3,background:"var(--bd)",borderRadius:2}}><div style={{height:"100%",width:comfyProgress+"%",background:"#A78BFA",transition:"width .5s",borderRadius:2}}/></div>}
                    {comfyResult&&(
                      <div style={{marginTop:8,display:"flex",gap:8,alignItems:"center"}}>
                        <img src={comfyResult.url} style={{width:80,height:80,objectFit:"cover",borderRadius:6,border:"1px solid var(--bd)"}}/>
                        <div style={{display:"flex",flexDirection:"column",gap:5}}>
                          <button onClick={()=>sendComfyToChat()} style={{fontSize:8,padding:"3px 9px",background:"rgba(74,222,128,.1)",border:"1px solid rgba(74,222,128,.3)",borderRadius:4,color:"var(--green)",cursor:"pointer"}}>💬 → Chat</button>
                          <a href={comfyResult.url} download style={{fontSize:8,padding:"3px 9px",background:"rgba(96,165,250,.08)",border:"1px solid rgba(96,165,250,.2)",borderRadius:4,color:"var(--blue)",textDecoration:"none",textAlign:"center"}}>⬇ Sauver</a>
                        </div>
                      </div>
                    )}
                  </div>
                  {/* History grid */}
                  {comfyHistory.length>0&&(
                    <div>
                      <div style={{fontSize:9,color:"var(--mu)",fontWeight:700,marginBottom:8}}>HISTORIQUE ({comfyHistory.length})</div>
                      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(120px,1fr))",gap:8}}>
                        {comfyHistory.slice(0,12).map((h,i)=>(
                          <div key={i} style={{borderRadius:6,overflow:"hidden",border:"1px solid var(--bd)",cursor:"pointer"}} onClick={()=>setComfyResult(h)}>
                            <img src={h.url} alt={h.prompt} style={{width:"100%",height:90,objectFit:"cover",display:"block"}} onError={e=>{e.target.style.opacity=".3";}}/>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              {mediaSubTab==="webia" && (
                <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
                  <div style={{padding:"8px 12px",borderBottom:"1px solid var(--bd)",flexShrink:0,background:"var(--s1)",display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
                    <span style={{fontSize:10,color:"var(--mu)"}}>Clique sur une IA pour l'ouvrir en iframe ·</span>
                    <span style={{fontSize:9,color:"var(--orange)"}}>⚠️ Certains sites bloquent les iframes (ouvrent dans un nouvel onglet)</span>
                  </div>
                  <div style={{display:"flex",gap:8,padding:"10px 12px",flexWrap:"wrap",flexShrink:0,borderBottom:"1px solid var(--bd)",background:"var(--s1)"}}>
                    {WEB_AIS.map(ia=>(
                      <a key={ia.id} href={ia.url} target="_blank" rel="noreferrer"
                        style={{display:"flex",alignItems:"center",gap:7,padding:"7px 12px",background:"var(--s2)",border:`1px solid ${ia.color}44`,borderRadius:8,textDecoration:"none",cursor:"pointer",transition:"all .15s"}}
                        onMouseEnter={e=>e.currentTarget.style.borderColor=ia.color}
                        onMouseLeave={e=>e.currentTarget.style.borderColor=ia.color+"44"}>
                        <span style={{fontSize:14,color:ia.color}}>{ia.icon}</span>
                        <div>
                          <div style={{fontSize:10,fontWeight:700,color:ia.color}}>{ia.name}</div>
                          <div style={{fontSize:8,color:"var(--mu)"}}>{ia.subtitle}</div>
                        </div>
                        <span style={{fontSize:9,color:"var(--mu)",marginLeft:4}}>↗</span>
                      </a>
                    ))}
                  </div>
                  <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12,color:"var(--mu)",padding:20,textAlign:"center"}}>
                    <div style={{fontSize:36}}>🌐</div>
                    <div style={{fontSize:12}}>Les IAs web s'ouvrent dans un nouvel onglet</div>
                    <div style={{fontSize:10}}>La plupart des sites IA bloquent les iframes pour des raisons de sécurité.</div>
                    <div style={{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"center",marginTop:8}}>
                      {WEB_AIS.map(ia=>(
                        <a key={ia.id} href={ia.url} target="_blank" rel="noreferrer"
                          style={{padding:"8px 16px",background:`${ia.color}18`,border:`1px solid ${ia.color}44`,borderRadius:8,color:ia.color,textDecoration:"none",fontSize:11,fontWeight:700,display:"flex",alignItems:"center",gap:6}}>
                          {ia.icon} {ia.name}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {mediaSubTab==="images" && (
          <div className="img-wrap">
            <div style={{ marginBottom:12 }}>
              <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:"clamp(14px,2.5vw,18px)", color:"var(--ac)", marginBottom:5 }}>🎨 Générateurs d'Images IA</div>
              <div style={{ fontSize:11, color:"var(--mu)", marginBottom:12 }}>Priorité aux outils <strong style={{color:"var(--green)"}}>gratuits et open source</strong>. Qualité, vitesse et facilité notées sur 10.</div>
              <div className="img-filter">
                {[["free","⭐ Gratuits d'abord"],["oss","🔓 Open Source"],["all","Tous"],["paid","💰 Payants"]].map(([f,l]) => (
                  <button key={f} className={`filter-btn ${imgFilter===f?"on":""}`} onClick={() => setImgFilter(f)}>{l}</button>
                ))}
              </div>
            </div>
            <div className="img-grid">
              {filteredImages.map(g => (
                <div key={g.id} className={`img-card ${g.license&&(g.license.includes("Apache")||g.license.includes("GPL"))?"oss":""}`} style={{ borderColor:g.color+"44" }}>
                  <div className="ic-hdr">
                    <div className="ic-icon" style={{ background:g.color+"18", color:g.color }}>{g.icon}</div>
                    <div style={{ flex:1 }}>
                      <div className="ic-name" style={{ color:g.color }}>{g.name}</div>
                      <div className="ic-sub">{g.provider}</div>
                    </div>
                    <div>
                      <span className="ic-free" style={{ background:g.free?"rgba(74,222,128,.12)":"rgba(251,146,60,.1)", color:g.free?"var(--green)":"var(--orange)" }}>{g.free?"GRATUIT":"PAYANT"}</span>
                      {g.license && (g.license.includes("Apache")||g.license.includes("GPL")) && <div style={{ fontSize:7, color:"var(--green)", marginTop:2 }}>🔓 {g.license}</div>}
                    </div>
                  </div>
                  <div className="ic-meters">
                    {[["Qualité",g.quality],["Vitesse",g.speed],["Facilité",g.ease]].map(([l,v]) => (
                      <div key={l} className="meter-item">
                        <div className="meter-lbl">{l}</div>
                        <MeterBar val={v} />
                      </div>
                    ))}
                  </div>
                  <div className="ic-desc">{g.desc}</div>
                  <div className="ic-strengths">{g.strengths.slice(0,4).map(s => <span key={s} className="ic-str">{s}</span>)}</div>
                  <div className="ic-limits">⚠️ {g.limits}</div>
                  <div className="ic-tags">{g.freeLabel && <span className="ic-tag" style={{ color:g.free?"var(--green)":"var(--orange)", borderColor:g.free?"rgba(74,222,128,.3)":"rgba(251,146,60,.3)" }}>{g.freeLabel}</span>}{g.tags.map(t=><span key={t} className="ic-tag">{t}</span>)}</div>
                  <a href={g.url} target="_blank" rel="noreferrer" className="ic-btn" style={{ borderColor:g.color, color:g.color }}>↗ {g.urlLabel}</a>
                </div>
              ))}
            </div>
            <div className="cfg-note" style={{ marginTop:14 }}>
              💡 <strong>Conseil</strong> : Pour la meilleure qualité gratuite localement → <strong style={{color:"var(--green)"}}>FLUX.1 via ComfyUI</strong>. Pour la plus simple sans installation → <strong style={{color:"#4FC3F7"}}>Bing Image Creator</strong> (DALL-E 3 gratuit). Pour le texte dans les images → <strong style={{color:"#F59E0B"}}>Ideogram</strong>.
            </div>
          </div>
              )}
            </div>
          </div>
        )}

        {/* ── PROMPTS TAB ── */}
        {tab === "prompts" && (
          <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
            <PromptsTab onInject={injectPrompt}/>
          </div>
        )}

        {/* ── RÉDACTION TAB ── */}
        {tab === "redaction" && (
          <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
            <RedactionTab enabled={enabled} apiKeys={apiKeys}/>
          </div>
        )}

        {/* ── RECHERCHE TAB ── */}
        {tab === "recherche" && (
          <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
            <RechercheTab enabled={enabled} apiKeys={apiKeys} setChatInput={setChatInput} setTab={setTab}/>
          </div>
        )}

        {/* ── WORKFLOWS TAB ── */}


        {/* ── WEB IAs TAB ── */}
        {tab === "webia" && (
          <WebIAsTab />
        )}
        {false && (
          <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
            <div style={{padding:"12px 16px",borderBottom:"1px solid var(--bd)",flexShrink:0,background:"var(--s1)",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
              <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:14,color:"var(--ac)"}}>🌐 IAs Web</div>
              <div style={{fontSize:9,color:"var(--mu)"}}>Toutes les IAs accessibles via navigateur — s'ouvrent dans un nouvel onglet</div>
            </div>
            <div style={{flex:1,overflow:"auto",padding:"16px",display:"flex",flexDirection:"column",gap:20}}>
              {["gratuit","payant"].map(cat=>{
                const items = WEB_AIS.filter(ia=>ia.cat===cat);
                return (
                  <div key={cat}>
                    <div style={{fontSize:10,fontWeight:700,color:cat==="gratuit"?"var(--green)":"var(--orange)",marginBottom:10,display:"flex",alignItems:"center",gap:6}}>
                      {cat==="gratuit"?"✅ GRATUITES — Aucun compte requis (ou compte gratuit)":"💳 PREMIUM — Abonnement payant pour accès complet"}
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))",gap:10}}>
                      {items.map(ia=>(
                        <a key={ia.id} href={ia.url} target="_blank" rel="noreferrer"
                          style={{display:"flex",flexDirection:"column",gap:8,padding:"12px 14px",background:"var(--s1)",border:`1px solid ${ia.color}33`,borderRadius:8,textDecoration:"none",transition:"all .2s"}}
                          onMouseEnter={e=>{e.currentTarget.style.borderColor=ia.color;e.currentTarget.style.transform="translateY(-2px)"}}
                          onMouseLeave={e=>{e.currentTarget.style.borderColor=ia.color+"33";e.currentTarget.style.transform=""}}>
                          <div style={{display:"flex",alignItems:"center",gap:8}}>
                            <div style={{width:32,height:32,borderRadius:"50%",background:ia.color+"18",border:`2px solid ${ia.color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,color:ia.color,flexShrink:0}}>{ia.icon}</div>
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{fontSize:11,fontWeight:700,color:ia.color}}>{ia.name}</div>
                              <div style={{fontSize:8,color:"var(--mu)"}}>{ia.subtitle}</div>
                            </div>
                            <span style={{fontSize:11,color:"var(--mu)"}}>↗</span>
                          </div>
                          <div style={{fontSize:9,color:"var(--mu)",lineHeight:1.4}}>{ia.desc}</div>
                        </a>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── NOTES TAB ── */}
        {tab === "notes" && (
          <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
            <NotesTab onCopyToChat={(text) => { navigateTab("chat"); setTimeout(()=>setChatInput(text),100); }}/>
          </div>
        )}

        {/* ── TRADUCTEUR TAB ── */}
        {tab === "traducteur" && (
          <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
            <div style={{padding:"10px 14px",borderBottom:"1px solid var(--bd)",flexShrink:0,background:"var(--s1)",display:"flex",alignItems:"center",gap:8}}>
              <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:14,color:"var(--ac)"}}>🌍 Traducteur Multi-IA</div>
              <div style={{fontSize:9,color:"var(--mu)",marginLeft:4}}>Toutes les IAs traduisent en parallèle — compare et choisis la meilleure version</div>
            </div>
            <TraducteurTab enabled={enabled} apiKeys={apiKeys}/>
          </div>
        )}

        {/* ── AGENT TAB ── */}
        {tab === "agent" && (
          <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
            <AgentTab enabled={enabled} apiKeys={apiKeys}/>
          </div>
        )}

        {/* ── STATS TAB ── */}
        {tab === "stats" && (
          <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
            <StatsTab stats={usageStats} onReset={resetStats}/>
          </div>
        )}

        {/* ── DEBATE TAB ── */}
        {tab === "debate" && <>
          <div className="debate-wrap"
            onDragOver={e=>{e.preventDefault();e.currentTarget.style.outline="2px dashed var(--ac)";}}
            onDragLeave={e=>{e.currentTarget.style.outline="none";}}
            onDrop={e=>{e.preventDefault();e.currentTarget.style.outline="none";const f=e.dataTransfer.files?.[0];if(f)handleDebFile(f);}}>
            {debPhase === 0 && (
              <div className="debate-intro">
                <div style={{ fontSize:28 }}>{debMode==="analyse"?"🔬":"⚡"}</div>
                <div className="debate-title">{debMode==="analyse"?"Mode Analyse":"Mode Débat"}</div>
                <div className="debate-desc">
                  {debMode==="analyse" ? <>
                    <strong>Chaque IA analyse sous un angle différent</strong> — structure, qualité, insights, améliorations — puis une synthèse complète combine tout.<br/><br/>
                    <strong style={{color:"var(--blue)"}}>Idéal pour :</strong> contrats, code, rapports, articles, emails importants.<br/><br/>
                    <em style={{fontSize:9}}>Glisse ton fichier ici ou clique sur 📎 · PDF, TXT, MD, code, images</em>
                  </> : <>
                    Les IAs répondent indépendamment, confrontent leurs points de vue, puis une synthèse finale est produite.<br/><br/>
                    <em style={{ fontSize:9 }}>IAs disponibles : {availableIds.length>0?availableIds.map(id=>`${MODEL_DEFS[id].icon}${MODEL_DEFS[id].short}`).join(" · "):"aucune"}</em>
                  </>}
                </div>
                {/* Drop zone visual */}
                <div style={{marginTop:12,border:"2px dashed rgba(96,165,250,.3)",borderRadius:8,padding:"12px 20px",color:"var(--mu)",fontSize:9,cursor:"pointer",transition:"all .2s"}}
                  onMouseEnter={e=>e.currentTarget.style.borderColor="var(--ac)"}
                  onMouseLeave={e=>e.currentTarget.style.borderColor="rgba(96,165,250,.3)"}
                  onClick={()=>debFileRef.current?.click()}>
                  {debFile
                    ? <span style={{color:"var(--blue)"}}>✓ {debFile.icon} <strong>{debFile.name}</strong> — {debFile.type==="image"?"Image":Math.round((debFile.content||"").length/1000)+"k car"}</span>
                    : <span>📎 Glisse un fichier ici ou <span style={{color:"var(--ac)",textDecoration:"underline"}}>clique pour parcourir</span><br/><span style={{opacity:.6}}>PDF · TXT · MD · CSV · JSON · Code · Images</span></span>
                  }
                </div>
              </div>
            )}
            {debPhase > 0 && debQuestion && (
              <div style={{ padding:"7px 14px", borderBottom:"1px solid var(--bd)", background:"var(--s1)", display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
                <div>
                  <span style={{ fontSize:8, color:"var(--ac)", fontWeight:600, letterSpacing:1 }}>{debMode==="analyse"?"ANALYSE":"QUESTION"} </span>
                  <span style={{ fontSize:10, color:"var(--tx)" }}>{debQuestion}</span>
                </div>
                {debFile && (
                  <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:5,background:"rgba(96,165,250,.08)",border:"1px solid rgba(96,165,250,.2)",borderRadius:4,padding:"2px 8px"}}>
                    <span style={{fontSize:10}}>{debFile.icon}</span>
                    <span style={{fontSize:8,color:"var(--blue)",fontFamily:"var(--font-mono)","overflow":"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:120}}>{debFile.name}</span>
                  </div>
                )}
              </div>
            )}
            {debPhase >= 1 && debPhase <= 3 && <>
              <div className="prog-bar"><div className="prog-fill" style={{ width:`${debProgress}%` }}/></div>
              <div className="prog-lbl">{["","⟳ Tour 1…","⟳ Tour 2…","⟳ Synthèse…"][debPhase]} {debProgressLabel&&<span style={{marginLeft:6,color:"var(--tx)"}}>{debProgressLabel}</span>}</div>
            </>}
            {Object.keys(debRound1).length > 0 && (
              <div className="phase-block">
                <div className="phase-header" onClick={() => setOpenPhases(p=>({...p,r1:!p.r1}))}>
                  <span className="ph-badge" style={{ background:"rgba(85,85,104,.2)", color:"var(--mu)" }}>TOUR 1</span>
                  <span className="ph-title">Réponses indépendantes</span>
                  <span className={`ph-chev ${openPhases.r1?"open":""}`}>▾</span>
                </div>
                {openPhases.r1 && <div className="phase-grid">
                  {IDS.filter(id=>enabled[id]).map(id => { const m=MODEL_DEFS[id]; return (
                    <div key={id} className="pg-cell">
                      <div className="pgc-hdr"><span style={{color:m.color,fontSize:12}}>{m.icon}</span><span style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:10,color:m.color}}>{m.short}</span></div>
                      <div className={`pgc-body ${debRound1[id]?"":"mu"}`}>{debRound1[id]?<MarkdownRenderer text={debRound1[id]}/>:"En attente…"}</div>
                    </div>
                  );})}
                </div>}
              </div>
            )}
            {Object.keys(debRound2).length > 0 && (
              <div className="phase-block">
                <div className="phase-header" onClick={() => setOpenPhases(p=>({...p,r2:!p.r2}))}>
                  <span className="ph-badge" style={{ background:"rgba(212,168,83,.12)", color:"var(--ac)" }}>TOUR 2</span>
                  <span className="ph-title">Confrontation des points de vue</span>
                  <span className={`ph-chev ${openPhases.r2?"open":""}`}>▾</span>
                </div>
                {openPhases.r2 && <div className="phase-grid">
                  {IDS.filter(id=>enabled[id]).map(id => { const m=MODEL_DEFS[id]; return (
                    <div key={id} className="pg-cell">
                      <div className="pgc-hdr"><span style={{color:m.color,fontSize:12}}>{m.icon}</span><span style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:10,color:m.color}}>{m.short}</span></div>
                      <div className={`pgc-body ${debRound2[id]?"":"mu"}`}>{debRound2[id]?<MarkdownRenderer text={debRound2[id]}/>:"En attente…"}</div>
                    </div>
                  );})}
                </div>}
              </div>
            )}
            {(debPhase === 3 || debPhase === 4) && (
              <div className="syn-block">
                <div className="syn-hdr">
                  <span style={{ fontSize:14 }}>✦</span>
                  <div className="syn-title">Synthèse Finale</div>
                  <span className="syn-by">par {debSynthBy}</span>
                  {debPhase===4 && debSynthesis && (
                    <button onClick={()=>navigator.clipboard.writeText(debSynthesis)} title="Copier la synthèse"
                      style={{marginLeft:"auto",background:"none",border:"1px solid var(--bd)",borderRadius:4,color:"var(--mu)",fontSize:9,padding:"2px 7px",cursor:"pointer",fontFamily:"var(--font-mono)"}}>⎘</button>
                  )}
                </div>
                <div className={`syn-body ${debSynthesis?"":"mu"}`}>{debSynthesis?<MarkdownRenderer text={debSynthesis}/>:"En cours…"}</div>
              </div>
            )}

            {/* ══ PIPELINE DE CONCRÉTISATION ══ */}
            {debPhase === 4 && debSynthesis && (
              <div style={{margin:"0 clamp(7px,1.5vw,12px) clamp(7px,1.5vw,12px)",border:"1px solid rgba(212,168,83,.25)",borderRadius:9,overflow:"hidden",background:"var(--s1)"}}>
                {/* Header */}
                <div style={{padding:"10px 14px",borderBottom:"1px solid var(--bd)",background:"linear-gradient(135deg,rgba(212,168,83,.08),rgba(212,168,83,.03))",display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                  <span style={{fontSize:16}}>🚀</span>
                  <div style={{flex:1}}>
                    <div style={{fontFamily:"var(--font-display)",fontWeight:800,fontSize:11,color:"var(--ac)"}}>Pipeline de Concrétisation</div>
                    <div style={{fontSize:8,color:"var(--mu)",marginTop:1}}>Transforme la synthèse en résultat concret et vérifié — chaque étape est validée par une IA différente</div>
                  </div>
                  {pipeRunning && (
                    <button onClick={cancelPipeline} style={{fontSize:8,padding:"3px 9px",background:"rgba(248,113,113,.1)",border:"1px solid rgba(248,113,113,.3)",borderRadius:4,color:"var(--red)",cursor:"pointer",fontFamily:"var(--font-mono)"}}>⏹ Arrêter</button>
                  )}
                  {pipeSteps.length > 0 && !pipeRunning && (
                    <>
                      <button onClick={exportPipeline} style={{fontSize:8,padding:"3px 9px",background:"rgba(96,165,250,.1)",border:"1px solid rgba(96,165,250,.3)",borderRadius:4,color:"var(--blue)",cursor:"pointer",fontFamily:"var(--font-mono)"}}>⎘ Exporter MD</button>
                      <button onClick={sendPipelineToChat} style={{fontSize:8,padding:"3px 9px",background:"rgba(74,222,128,.1)",border:"1px solid rgba(74,222,128,.3)",borderRadius:4,color:"var(--green)",cursor:"pointer",fontFamily:"var(--font-mono)"}}>💬 → Chat</button>
                      <button onClick={sendPipelineToWorkflow} style={{fontSize:8,padding:"3px 9px",background:"rgba(212,168,83,.1)",border:"1px solid rgba(212,168,83,.3)",borderRadius:4,color:"var(--ac)",cursor:"pointer",fontFamily:"var(--font-mono)"}}>🔀 → Workflow</button>
                    </>
                  )}
                </div>

                {/* Mode selector — only when no pipeline running */}
                {!pipeRunning && pipeSteps.length === 0 && (
                  <div style={{padding:"12px 14px",display:"flex",gap:8,flexWrap:"wrap"}}>
                    {Object.entries(PIPE_CONFIGS).map(([key, cfg]) => (
                      <button key={key} onClick={()=>runPipeline(key)}
                        style={{display:"flex",flexDirection:"column",alignItems:"flex-start",gap:4,padding:"10px 12px",background:"var(--s2)",border:`1px solid ${cfg.color}30`,borderRadius:8,cursor:"pointer",flex:"1 1 140px",minWidth:140,maxWidth:220,textAlign:"left",transition:"all .2s"}}
                        onMouseEnter={e=>{e.currentTarget.style.borderColor=cfg.color;e.currentTarget.style.background=cfg.color+"10";}}
                        onMouseLeave={e=>{e.currentTarget.style.borderColor=cfg.color+"30";e.currentTarget.style.background="var(--s2)";}}>
                        <div style={{display:"flex",alignItems:"center",gap:6}}>
                          <span style={{fontSize:16}}>{cfg.icon}</span>
                          <span style={{fontFamily:"var(--font-display)",fontWeight:700,fontSize:10,color:cfg.color}}>{cfg.label}</span>
                        </div>
                        <div style={{fontSize:8,color:"var(--mu)",lineHeight:1.45}}>
                          {key==="action" && "Plan d'action priorisé · Gestion des risques · Planning réaliste · Validation croisée"}
                          {key==="code" && "Specs techniques · Code complet · Tests unitaires · Code Review · Livrable final"}
                          {key==="doc" && "Structure doc · Rédaction · Résumé exécutif · Relecture · Document final"}
                        </div>
                        <div style={{fontSize:7,color:cfg.color,opacity:.7}}>{PIPE_CONFIGS[key].steps.length} étapes · {IDS.filter(id=>enabled[id]).length} IAs</div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Pipeline in progress or done */}
                {pipeSteps.length > 0 && (() => {
                  const cfg = PIPE_CONFIGS[pipeMode];
                  const doneCount = pipeSteps.filter(s=>s.status==="done").length;
                  const total = pipeSteps.length;
                  return (
                    <div style={{padding:"8px 14px 12px"}}>
                      {/* Progress bar */}
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                        <span style={{fontSize:10}}>{cfg?.icon}</span>
                        <span style={{fontFamily:"var(--font-display)",fontWeight:700,fontSize:10,color:cfg?.color}}>{cfg?.label}</span>
                        <div style={{flex:1,height:3,background:"var(--s2)",borderRadius:2,overflow:"hidden"}}>
                          <div style={{height:"100%",width:`${(doneCount/total)*100}%`,background:cfg?.color,borderRadius:2,transition:"width .4s ease"}}/>
                        </div>
                        <span style={{fontSize:8,color:"var(--mu)",whiteSpace:"nowrap"}}>{doneCount}/{total}</span>
                      </div>

                      {/* Steps */}
                      <div style={{display:"flex",flexDirection:"column",gap:5}}>
                        {pipeSteps.map((step,i) => {
                          const isOpen = pipeOpen[step.id] !== false && (step.status==="done"||step.status==="running");
                          const statusColor = step.status==="done"?"var(--green)":step.status==="running"?cfg?.color:step.status==="error"?"var(--red)":"var(--mu)";
                          const statusIcon = step.status==="done"?"✓":step.status==="running"?"⟳":step.status==="error"?"✗":"○";
                          const ia = step.ia ? MODEL_DEFS[step.ia] : null;
                          return (
                            <div key={step.id} style={{border:`1px solid ${step.status==="running"?cfg?.color+"60":step.status==="done"?"rgba(74,222,128,.2)":step.status==="error"?"rgba(248,113,113,.2)":"var(--bd)"}`,borderRadius:7,overflow:"hidden",transition:"border-color .3s"}}>
                              {/* Step header */}
                              <div onClick={()=>{if(step.output)setPipeOpen(p=>({...p,[step.id]:!isOpen}));}}
                                style={{display:"flex",alignItems:"center",gap:7,padding:"7px 10px",background:step.status==="running"?`${cfg?.color}08`:"transparent",cursor:step.output?"pointer":"default"}}>
                                <div style={{width:20,height:20,borderRadius:"50%",background:`${statusColor}18`,border:`1.5px solid ${statusColor}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:statusColor,flexShrink:0,animation:step.status==="running"?"pulse-glow 1.2s ease-in-out infinite":undefined}}>
                                  {statusIcon}
                                </div>
                                <span style={{fontSize:10}}>{step.icon}</span>
                                <span style={{fontFamily:"var(--font-mono)",fontWeight:600,fontSize:9,color:step.status==="pending"?"var(--mu)":"var(--tx)",flex:1}}>{step.label}</span>
                                {ia && step.status!=="pending" && <span style={{fontSize:8,color:ia.color,opacity:.8}}>{ia.icon} {ia.short}</span>}
                                {step.output && <span style={{fontSize:8,color:"var(--mu)"}}>{isOpen?"▲":"▼"}</span>}
                                {step.status==="done" && <button onClick={e=>{e.stopPropagation();navigator.clipboard.writeText(step.output);}}
                                  style={{background:"none",border:"1px solid var(--bd)",borderRadius:3,color:"var(--mu)",fontSize:7,padding:"1px 5px",cursor:"pointer",fontFamily:"var(--font-mono)"}}>⎘</button>}
                              </div>
                              {/* Step output */}
                              {isOpen && step.output && (
                                <div style={{padding:"8px 12px",borderTop:`1px solid ${step.status==="running"?cfg?.color+"30":"var(--bd)"}`,background:"var(--bg)",maxHeight:280,overflowY:"auto"}}>
                                  <MarkdownRenderer text={step.output}/>
                                </div>
                              )}
                              {step.status==="running" && !step.output && (
                                <div style={{padding:"6px 12px",borderTop:`1px solid ${cfg?.color}20`}}>
                                  <span className="dots"><span>·</span><span>·</span><span>·</span></span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Change mode button */}
                      {!pipeRunning && (
                        <div style={{marginTop:8,display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
                          <button onClick={()=>{setPipeSteps([]);setPipeMode(null);}} style={{fontSize:8,padding:"3px 9px",background:"transparent",border:"1px solid var(--bd)",borderRadius:4,color:"var(--mu)",cursor:"pointer",fontFamily:"var(--font-mono)"}}>← Changer de mode</button>
                          {Object.keys(PIPE_CONFIGS).filter(k=>k!==pipeMode).map(k=>(
                            <button key={k} onClick={()=>{setPipeSteps([]);runPipeline(k);}}
                              style={{fontSize:8,padding:"3px 9px",background:`${PIPE_CONFIGS[k].color}10`,border:`1px solid ${PIPE_CONFIGS[k].color}30`,borderRadius:4,color:PIPE_CONFIGS[k].color,cursor:"pointer",fontFamily:"var(--font-mono)"}}>
                              {PIPE_CONFIGS[k].icon} {PIPE_CONFIGS[k].label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
          <div className="debate-foot" style={{padding:"8px 12px",borderTop:"1px solid var(--bd)",background:"var(--bg)",flexShrink:0}}>
            {/* Mode selector */}
            <div style={{display:"flex",gap:5,marginBottom:8,flexWrap:"wrap",alignItems:"center"}}>
              <span style={{fontSize:8,color:"var(--mu)",fontWeight:700,letterSpacing:".5px"}}>MODE :</span>
              {[["debate","⚡ Débat","Les IAs défendent des positions différentes"],["analyse","🔬 Analyse","Chaque IA analyse selon un angle différent — idéal pour les fichiers"]].map(([m,label,desc])=>(
                <button key={m} onClick={()=>setDebMode(m)} title={desc}
                  style={{fontSize:9,padding:"3px 10px",background:debMode===m?"rgba(212,168,83,.2)":"transparent",border:`1px solid ${debMode===m?"rgba(212,168,83,.5)":"var(--bd)"}`,borderRadius:5,color:debMode===m?"var(--ac)":"var(--mu)",cursor:"pointer",fontFamily:"var(--font-ui)",transition:"all .15s"}}>
                  {label}
                </button>
              ))}
              {debFile && <span style={{marginLeft:"auto",fontSize:8,color:"var(--green)"}}>✓ Fichier : {debFile.icon} {debFile.name} · {debFile.type==="image"?"Image":Math.round((debFile.content||"").length/1000)+"k car"}</span>}
            </div>

            {/* File preview if attached */}
            {debFile && (
              <div style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",background:"rgba(96,165,250,.06)",border:"1px solid rgba(96,165,250,.2)",borderRadius:6,marginBottom:8}}>
                {debFile.type==="image" && debFile.base64 && (
                  <img src={`data:${debFile.mimeType};base64,${debFile.base64}`} alt={debFile.name}
                    style={{width:48,height:48,objectFit:"cover",borderRadius:4,border:"1px solid var(--bd)",flexShrink:0}}/>
                )}
                {debFile.type!=="image" && (
                  <div style={{width:40,height:40,background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:4,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    <span style={{fontSize:16}}>{debFile.icon}</span>
                    <span style={{fontSize:6,color:"var(--mu)",marginTop:1}}>{debFile.name.split(".").pop().toUpperCase()}</span>
                  </div>
                )}
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:10,fontWeight:700,color:"var(--tx)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{debFile.name}</div>
                  <div style={{fontSize:8,color:"var(--mu)",marginTop:1}}>
                    {debFile.type==="image"?"🖼️ Image":"📄 Document"}{debFile.content?" · "+Math.round(debFile.content.length/1000)+"k car":""}
                    {" · "}Les IAs analyseront ce fichier
                  </div>
                  {debFile.type!=="image" && debFile.content && (
                    <div style={{fontSize:7,color:"var(--mu)",marginTop:2,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:1,WebkitBoxOrient:"vertical",opacity:.6}}>
                      {debFile.content.slice(0,120)}…
                    </div>
                  )}
                </div>
                <button onClick={()=>setDebFile(null)}
                  style={{background:"rgba(248,113,113,.1)",border:"1px solid rgba(248,113,113,.3)",borderRadius:4,color:"var(--red)",fontSize:10,padding:"3px 7px",cursor:"pointer",flexShrink:0}}>✕</button>
              </div>
            )}

            {/* Input row */}
            <div style={{display:"flex",gap:6,alignItems:"flex-end",flexWrap:"wrap"}}>
              {/* File attach button */}
              <input type="file" ref={debFileRef} style={{display:"none"}}
                accept=".pdf,.txt,.md,.csv,.json,.js,.py,.ts,.jsx,.tsx,.html,.css,.sql,.xml,image/*"
                onChange={e=>{const f=e.target.files?.[0];if(f)handleDebFile(f);e.target.value="";}}/>
              <button onClick={()=>debFileRef.current?.click()} title="Joindre un fichier (PDF, texte, code, image)"
                disabled={debPhase>0&&debPhase<4}
                style={{background:debFile?"rgba(96,165,250,.15)":"var(--s2)",border:`1px solid ${debFile?"rgba(96,165,250,.4)":"var(--bd)"}`,borderRadius:7,color:debFile?"var(--blue)":"var(--mu)",fontSize:14,width:38,height:38,cursor:debPhase>0&&debPhase<4?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all .15s"}}>
                📎
              </button>
              <textarea rows={1} value={debInput}
                placeholder={debFile ? `Question sur "${debFile.name}"… (optionnel en mode Analyse)` : "Question à débattre ou analyser…"}
                onChange={e=>setDebInput(e.target.value)}
                onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();if(debPhase===0||debPhase===4)launchDebate();}}}
                onInput={e=>{e.target.style.height="auto";e.target.style.height=Math.min(e.target.scrollHeight,100)+"px";}}
                disabled={debPhase>0&&debPhase<4}
                style={{flex:1,minWidth:120,background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:7,color:"var(--tx)",fontFamily:"var(--font-ui)",fontSize:11,padding:"8px 11px",outline:"none",resize:"none",lineHeight:1.5,transition:"border-color .2s"}}
                onFocus={e=>e.target.style.borderColor="var(--ac)"}
                onBlur={e=>e.target.style.borderColor="var(--bd)"}
              />
              {(debPhase===0||debPhase===4) && (
                <button className="launch-btn" onClick={debPhase===4?clearDebate:launchDebate}
                  disabled={debPhase===0&&!debInput.trim()&&!debFile}
                  style={{background:debMode==="analyse"?"rgba(96,165,250,.2)":"var(--ac)",borderColor:debMode==="analyse"?"rgba(96,165,250,.5)":undefined,color:debMode==="analyse"?"var(--blue)":"#09090B"}}>
                  {debPhase===4?"↺ Nouveau":debMode==="analyse"?"🔬 Analyser":"⚡ Débattre"}
                </button>
              )}
              {debPhase>0&&debPhase<4 && <button className="launch-btn" disabled style={{opacity:.5}}>⟳ En cours…</button>}
            </div>

            {/* Drag-and-drop zone */}
            <div style={{marginTop:6,fontSize:8,color:"var(--mu)",opacity:.6}}>
              {debPhase===0&&`${availableIds.length} IA(s) active(s) · ${debMode==="analyse"?"Chaque IA analyse selon un angle différent":"Les IAs débattent et confrontent leurs points de vue"} · Glisse un fichier ici`}
              {debPhase===4&&`✓ Terminé · Synthèse par ${debSynthBy}`}
            </div>
          </div>
        </>}

        {/* ── CONFIG TAB ── */}
        {/* ── PWA CONFIG SECTION ── */}

        {/* ══ EXPERT PANEL TAB ══ */}
        {tab === "expert" && (
          <div style={{flex:1,overflow:"auto",padding:"clamp(10px,2vw,16px)"}}>
            <div style={{fontFamily:"var(--font-display)",fontWeight:800,fontSize:"clamp(14px,2.5vw,18px)",color:"var(--ac)",marginBottom:14}}>🧠 Panel d'Experts</div>
            <div style={{marginBottom:12,display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
              {Object.entries(EXPERT_PANELS).map(([key,experts])=>(
                <button key={key} onClick={()=>setExpertPanel(key)}
                  style={{padding:"4px 12px",borderRadius:12,border:"1px solid "+(expertPanel===key?"var(--ac)":"var(--bd)"),background:expertPanel===key?"var(--ac)":"transparent",color:expertPanel===key?"var(--bg)":"var(--mu)",fontSize:9,cursor:"pointer",fontWeight:600}}>
                  {key==="dev"?"💻 Dev":key==="product"?"📦 Produit":"✍️ Contenu"}
                </button>
              ))}
            </div>
            <div style={{marginBottom:10,display:"flex",gap:8,flexWrap:"wrap"}}>
              {(EXPERT_PANELS[expertPanel]||[]).map((e,i)=>(
                <div key={i} style={{flex:1,minWidth:160,padding:"8px 12px",background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:8,fontSize:9}}>
                  <div style={{fontWeight:700,marginBottom:3}}>{e.icon} {e.name}</div>
                  <div style={{color:"var(--mu)",fontSize:8,lineHeight:1.4}}>{e.system.slice(0,80)}…</div>
                </div>
              ))}
            </div>
            <div style={{display:"flex",gap:8,marginBottom:12}}>
              <textarea value={expertQuery} onChange={e=>setExpertQuery(e.target.value)}
                placeholder="Pose ta question, problème ou sujet à analyser par le panel d'experts…"
                rows={3} style={{flex:1,background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:7,color:"var(--tx)",fontSize:10,padding:"8px 11px",fontFamily:"var(--font-ui)",resize:"vertical",outline:"none"}}/>
              <button onClick={runExpertPanel} disabled={expertRunning||!expertQuery.trim()}
                style={{padding:"0 18px",background:"rgba(167,139,250,.15)",border:"1px solid rgba(167,139,250,.4)",borderRadius:7,color:"#A78BFA",fontSize:11,cursor:"pointer",fontWeight:700,opacity:expertRunning||!expertQuery.trim()?.4:1}}>
                {expertRunning?"⟳":"🧠 Analyser"}
              </button>
            </div>
            {Object.keys(expertResults).length>0&&(
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:10,marginBottom:12}}>
                {Object.entries(expertResults).map(([idx,{analysis,expert,ia}])=>(
                  <div key={idx} style={{background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:8,overflow:"hidden"}}>
                    <div style={{padding:"7px 10px",borderBottom:"1px solid var(--bd)",background:"var(--s2)",display:"flex",alignItems:"center",gap:6}}>
                      <span>{expert.icon}</span>
                      <span style={{fontSize:10,fontWeight:700,color:"var(--tx)"}}>{expert.name}</span>
                      {ia&&<span style={{marginLeft:"auto",fontSize:8,color:"var(--mu)"}}>{ia}</span>}
                    </div>
                    <div style={{padding:"10px",maxHeight:220,overflow:"auto",fontSize:9,lineHeight:1.6}}>
                      {analysis?<MarkdownRenderer text={analysis}/>:<span className="dots"><span>·</span><span>·</span><span>·</span></span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {expertSynthesis&&(
              <div style={{padding:"12px 14px",background:"var(--s1)",border:"1px solid rgba(212,168,83,.3)",borderRadius:9}}>
                <div style={{fontSize:9,color:"var(--ac)",fontWeight:700,marginBottom:8}}>✦ SYNTHÈSE DU COORDINATEUR</div>
                <MarkdownRenderer text={expertSynthesis}/>
                <button onClick={()=>{setChatInput(expertSynthesis.slice(0,3000));navigateTab("chat");}} style={{marginTop:8,fontSize:8,padding:"3px 10px",background:"rgba(74,222,128,.1)",border:"1px solid rgba(74,222,128,.3)",borderRadius:4,color:"var(--green)",cursor:"pointer"}}>💬 → Chat</button>
              </div>
            )}
          </div>
        )}

        {/* ══ ANALYTICS TAB ══ */}
        {tab === "analytics" && (
          <div style={{flex:1,overflow:"auto",padding:"clamp(10px,2vw,16px)"}}>
            <div style={{fontFamily:"var(--font-display)",fontWeight:800,fontSize:"clamp(14px,2.5vw,18px)",color:"var(--ac)",marginBottom:14}}>📈 Analytics</div>
            {/* Summary cards */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:10,marginBottom:18}}>
              {[
                ["💬",Object.values(usageStats.msgs||{}).reduce((a,b)=>a+b,0),"Messages"],
                ["🔤",Object.values(usageStats.tokens||{}).reduce((a,b)=>a+b,0).toLocaleString(),"Tokens"],
                ["📚",usageStats.convs||0,"Conversations"],
                ["💰","$"+(Object.entries(usageStats.tokens||{}).reduce((a,[id,t])=>{const p=PRICING[id];return a+(p?(t*0.7/1e6*p.in)+(t*0.3/1e6*p.out):0);},0)).toFixed(4),"Coût estimé"],
              ].map(([ic,val,lbl])=>(
                <div key={lbl} style={{background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:8,padding:"12px 14px"}}>
                  <div style={{fontSize:18,marginBottom:4}}>{ic}</div>
                  <div style={{fontSize:16,fontWeight:700,color:"var(--tx)"}}>{val}</div>
                  <div style={{fontSize:9,color:"var(--mu)"}}>{lbl}</div>
                </div>
              ))}
            </div>
            {/* Usage bars by model */}
            <div style={{background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:8,padding:"14px",marginBottom:12}}>
              <div style={{fontSize:10,fontWeight:700,color:"var(--tx)",marginBottom:10}}>Utilisation par modèle</div>
              {Object.entries(usageStats.msgs||{}).filter(([,v])=>v>0).sort(([,a],[,b])=>b-a).map(([id,count])=>{
                const m=MODEL_DEFS[id]; const maxV=Math.max(...Object.values(usageStats.msgs||{}).map(v=>v||0),1);
                const p=PRICING[id]; const tok=usageStats.tokens?.[id]||0;
                const cost=p?(tok*0.7/1e6*p.in)+(tok*0.3/1e6*p.out):0;
                return m&&count>0?(
                  <div key={id} style={{marginBottom:8}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                      <span style={{color:m.color,fontSize:10,width:22}}>{m.icon}</span>
                      <span style={{fontSize:9,fontWeight:600,color:"var(--tx)",flex:1}}>{m.short}</span>
                      <span style={{fontSize:8,color:"var(--mu)"}}>{count} msg</span>
                      <span style={{fontSize:8,color:cost>0?"var(--orange)":"var(--green)",fontFamily:"var(--font-mono)"}}>
                        {cost>0?"$"+cost.toFixed(4):"FREE"}
                      </span>
                    </div>
                    <div style={{height:6,background:"var(--s2)",borderRadius:3,overflow:"hidden"}}>
                      <div style={{height:"100%",width:(count/maxV*100)+"%",background:m.color,borderRadius:3,transition:"width .5s"}}/>
                    </div>
                  </div>
                ):null;
              })}
            </div>
            {/* Session live */}
            {Object.keys(sessionTokens).length>0&&(
              <div style={{background:"var(--s1)",border:"1px solid rgba(212,168,83,.3)",borderRadius:8,padding:"14px"}}>
                <div style={{fontSize:10,fontWeight:700,color:"var(--ac)",marginBottom:10}}>⚡ Session en cours</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:8}}>
                  {Object.entries(sessionTokens).filter(([,t])=>(t.in||0)+(t.out||0)>0).map(([id,t])=>{
                    const m=MODEL_DEFS[id]; const p=PRICING[id];
                    const cost=p?(t.in/1e6*p.in)+(t.out/1e6*p.out):0;
                    return (
                      <div key={id} style={{background:"var(--s2)",borderRadius:6,padding:"8px 10px",border:"1px solid "+m.color+"30"}}>
                        <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:4}}>
                          <span style={{color:m.color}}>{m.icon}</span>
                          <span style={{fontSize:9,fontWeight:700,color:m.color}}>{m.short}</span>
                          <span style={{marginLeft:"auto",fontSize:7,padding:"1px 4px",background:cost===0?"rgba(74,222,128,.12)":"rgba(251,146,60,.12)",color:cost===0?"var(--green)":"var(--orange)",borderRadius:3,fontWeight:700}}>
                            {cost===0?"FREE":"$"+cost.toFixed(5)}
                          </span>
                        </div>
                        <div style={{fontSize:8,color:"var(--mu)"}}>
                          ↓{(t.in/1000).toFixed(1)}k · ↑{(t.out/1000).toFixed(1)}k tokens
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}


        {/* ══ AIDE TAB ══ */}
        {tab === "aide" && (
          <AideTab navigateTab={navigateTab}/>
        )}


        {/* ══ STUDIO AUTO TAB ══ */}
        {tab === "studio" && (
          <StudioTab
            apiKeys={apiKeys}
            enabled={enabled}
            MODEL_DEFS={MODEL_DEFS}
            callModel={callModel}
            buildSystem={buildSystem}
            showToast={showToast}
          />
        )}

        {/* ══ SMART ROUTER TAB ══ */}
        {tab === "router" && (
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
                    style={{width:"100%",padding:"12px",background:"rgba(212,168,83,.15)",border:"2px solid rgba(212,168,83,.4)",borderRadius:9,color:"var(--ac)",fontSize:13,cursor:"pointer",fontWeight:800,fontFamily:"var(--font-display)",opacity:routerAnalyzing?.6:1}}>
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
                        style={{width:"100%",padding:"14px",background:"rgba(212,168,83,.2)",border:"2px solid var(--ac)",borderRadius:10,color:"var(--ac)",fontSize:14,cursor:"pointer",fontWeight:800,fontFamily:"var(--font-display)",opacity:routerLaunching?.6:1,transition:"all .2s"}}
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
        )}
        {/* ══ VEILLE INTELLIGENTE TAB ══ */}
        {tab === "veille" && (
          <VeilleTab enabled={enabled} apiKeys={apiKeys} navigateTab={navigateTab} setChatInput={setChatInput}/>
        )}

        {/* ══ VOICE MODE TAB ══ */}
        {tab === "voice" && (
          <VoiceTab enabled={enabled} apiKeys={apiKeys} conversations={conversations} setChatInput={setChatInput} navigateTab={navigateTab}/>
        )}

        {/* ══ PROJECTS TAB ══ */}
        {tab === "projects" && (
          <ProjectsTab conversations={conversations} setChatInput={setChatInput} navigateTab={navigateTab} apiKeys={apiKeys} enabled={enabled}/>
        )}


        {tab === "benchmark" && (
          <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
            <BenchmarkTab enabled={enabled} apiKeys={apiKeys}/>
          </div>
        )}

        {tab === "glossaire" && (
          <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
            <GlossaireTab navigateTab={navigateTab} setChatInput={setChatInput}/>
          </div>
        )}

        {tab === "autopsy" && (
          <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
            <PromptAutopsyTab enabled={enabled} apiKeys={apiKeys} conversations={conversations}/>
          </div>
        )}

        {tab === "mentor" && (
          <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
            <IaMentorTab enabled={enabled} apiKeys={apiKeys}/>
          </div>
        )}

        {tab === "dna" && (
          <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
            <PromptDNATab onInject={injectPrompt}/>
          </div>
        )}

        {tab === "conference" && (
          <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
            <ConferenceTab enabled={enabled} apiKeys={apiKeys}/>
          </div>
        )}

        {tab === "consensus" && (
          <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
            <ConsensusTab enabled={enabled} apiKeys={apiKeys} conversations={conversations}/>
          </div>
        )}

        {tab === "brief" && (
          <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
            <MorningBriefTab
              enabled={enabled}
              apiKeys={apiKeys}
              projects={projects}
              memFacts={memFacts}
              usageStats={usageStats}
            />
          </div>
        )}

        {tab === "taskia" && (
          <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
            <TaskToIAsTab
              enabled={enabled}
              apiKeys={apiKeys}
              navigateTab={navigateTab}
              setChatInput={setChatInput}
            />
          </div>
        )}

        {tab === "journaliste" && (
          <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
            <JournalisteTab enabled={enabled} apiKeys={apiKeys}/>
          </div>
        )}

        {tab === "skills" && (
          <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
            <SkillBuilderTab enabled={enabled} apiKeys={apiKeys} navigateTab={navigateTab} setChatInput={setChatInput}/>
          </div>
        )}

        {tab === "contradict" && (
          <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
            <ContradictionTab enabled={enabled} apiKeys={apiKeys} conversations={conversations}/>
          </div>
        )}

        {tab === "secondbrain" && (
          <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
            <SecondBrainTab savedConvs={savedConvs} projects={projects} memFacts={memFacts} usageStats={usageStats} apiKeys={apiKeys} enabled={enabled}/>
          </div>
        )}

        {tab === "livedebate" && (
          <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
            <LiveDebateTimerTab enabled={enabled} apiKeys={apiKeys}/>
          </div>
        )}

        {tab === "contexttrans" && (
          <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
            <ContextTranslatorTab enabled={enabled} apiKeys={apiKeys}/>
          </div>
        )}

        {tab === "apioptim" && (
          <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
            <ApiOptimizerTab usageStats={usageStats} enabled={enabled}/>
          </div>
        )}

        {tab === "civilisations" && (
          <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
            <CivilisationsTab enabled={enabled} apiKeys={apiKeys}/>
          </div>
        )}

        {tab === "flash" && (
          <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
            <ModeFlashTab enabled={enabled} apiKeys={apiKeys} navigateTab={navigateTab} setChatInput={setChatInput}/>
          </div>
        )}

        {/* ══ ADVANCED SETTINGS TAB ══ */}
        {tab === "advanced" && (
          <div style={{flex:1,overflow:"auto",padding:"clamp(10px,2vw,16px)"}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16,flexWrap:"wrap"}}>
              <div style={{fontFamily:"var(--font-display)",fontWeight:800,fontSize:"clamp(14px,2.5vw,18px)",color:"var(--ac)"}}>🔬 Paramètres Avancés</div>
              <button onClick={saveAdvSettings} style={{marginLeft:"auto",padding:"5px 14px",background:"rgba(212,168,83,.15)",border:"1px solid rgba(212,168,83,.4)",borderRadius:5,color:"var(--ac)",cursor:"pointer",fontSize:9,fontFamily:"var(--font-mono)",fontWeight:700}}>💾 Sauvegarder</button>
            </div>

            {/* Global system prompt */}
            <div style={{marginBottom:14,background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:8,padding:"12px 14px"}}>
              <div style={{fontSize:9,color:"var(--mu)",fontWeight:700,letterSpacing:1,marginBottom:8}}>SYSTEM PROMPT GLOBAL</div>
              <div style={{fontSize:8,color:"var(--mu)",marginBottom:6}}>Ajouté à toutes les requêtes, en plus du persona actif.</div>
              <textarea value={globalSysPrompt} onChange={e=>setGlobalSysPrompt(e.target.value)}
                placeholder="Ex: Réponds toujours en français. Sois concis. Utilise des bullet points..."
                rows={4} style={{width:"100%",background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:6,color:"var(--tx)",fontSize:10,padding:"8px 10px",fontFamily:"var(--font-ui)",resize:"vertical",outline:"none",boxSizing:"border-box"}}/>
            </div>

            {/* Temperature per model */}
            <div style={{marginBottom:14,background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:8,padding:"12px 14px"}}>
              <div style={{fontSize:9,color:"var(--mu)",fontWeight:700,letterSpacing:1,marginBottom:8}}>TEMPÉRATURE PAR MODÈLE</div>
              <div style={{fontSize:8,color:"var(--mu)",marginBottom:10}}>0 = déterministe / 1 = créatif. Défaut : 0.7</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:8}}>
                {IDS.filter(id=>enabled[id]).map(id=>{
                  const m=MODEL_DEFS[id];
                  const val=modelTemps[id]!==undefined?modelTemps[id]:0.7;
                  return (
                    <div key={id} style={{display:"flex",alignItems:"center",gap:8}}>
                      <span style={{color:m.color,fontSize:10,width:20}}>{m.icon}</span>
                      <span style={{fontSize:9,color:"var(--tx)",flex:1}}>{m.short}</span>
                      <input type="range" min="0" max="1" step="0.05" value={val}
                        onChange={e=>setModelTemps(prev=>({...prev,[id]:parseFloat(e.target.value)}))}
                        style={{width:80}}/>
                      <span style={{fontSize:8,color:"var(--mu)",fontFamily:"var(--font-mono)",width:26}}>{val.toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Custom providers */}
            <div style={{background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:8,padding:"12px 14px"}}>
              <div style={{fontSize:9,color:"var(--mu)",fontWeight:700,letterSpacing:1,marginBottom:8}}>PROVIDERS CUSTOM (OpenAI-compatible)</div>
              <div style={{fontSize:8,color:"var(--mu)",marginBottom:10}}>LM Studio, Jan, Ollama API, ou tout provider compatible OpenAI.</div>
              {customProviders.map((prov,i)=>(
                <div key={i} style={{display:"flex",gap:6,marginBottom:6,flexWrap:"wrap"}}>
                  <input value={prov.name||""} placeholder="Nom" onChange={e=>{const np=[...customProviders];np[i]={...np[i],name:e.target.value};setCustomProviders(np);}}
                    style={{flex:"0 0 100px",background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:4,color:"var(--tx)",fontSize:9,padding:"4px 8px",outline:"none"}}/>
                  <input value={prov.baseUrl||""} placeholder="http://localhost:1234/v1" onChange={e=>{const np=[...customProviders];np[i]={...np[i],baseUrl:e.target.value};setCustomProviders(np);}}
                    style={{flex:1,minWidth:180,background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:4,color:"var(--tx)",fontSize:9,padding:"4px 8px",outline:"none"}}/>
                  <input value={prov.model||""} placeholder="model-name" onChange={e=>{const np=[...customProviders];np[i]={...np[i],model:e.target.value};setCustomProviders(np);}}
                    style={{flex:"0 0 130px",background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:4,color:"var(--tx)",fontSize:9,padding:"4px 8px",outline:"none"}}/>
                  <button onClick={()=>setCustomProviders(prev=>prev.filter((_,j)=>j!==i))} style={{background:"rgba(248,113,113,.1)",border:"1px solid rgba(248,113,113,.3)",borderRadius:4,color:"var(--red)",fontSize:10,padding:"2px 8px",cursor:"pointer"}}>✕</button>
                </div>
              ))}
              <button onClick={()=>setCustomProviders(prev=>[...prev,{name:"",baseUrl:"",model:"",apiKey:""}])}
                style={{fontSize:9,padding:"4px 12px",background:"rgba(96,165,250,.1)",border:"1px solid rgba(96,165,250,.3)",borderRadius:5,color:"var(--blue)",cursor:"pointer",marginTop:4}}>
                ＋ Ajouter un provider
              </button>
            </div>
          </div>
        )}


        {/* ══ COMFYUI TAB ══ */}
        {tab === "comfyui" && (
          <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
            {/* Header */}
            <div style={{padding:"8px 14px",borderBottom:"1px solid var(--bd)",background:"var(--s1)",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",flexShrink:0}}>
              <div style={{fontFamily:"var(--font-display)",fontWeight:800,fontSize:14,color:"#A78BFA"}}>⬡ ComfyUI Studio</div>
              <div style={{fontSize:9,color:comfyConnected?"var(--green)":"var(--mu)"}}>
                {comfyConnected?"● Connecté — "+comfyUrl:"○ Non connecté"}
              </div>
              {/* Sub-tabs */}
              <div style={{marginLeft:"auto",display:"flex",gap:3}}>
                {[["generate","🎨 Générer"],["workflows","🔀 Workflows"],["history","🕐 Historique"],["settings","⚙ Config"]].map(([k,l])=>(
                  <button key={k} onClick={()=>setComfySubTab(k)}
                    style={{padding:"3px 10px",borderRadius:5,border:"1px solid "+(comfySubTab===k?"#A78BFA":"var(--bd)"),background:comfySubTab===k?"rgba(124,58,237,.15)":"transparent",color:comfySubTab===k?"#A78BFA":"var(--mu)",fontSize:9,cursor:"pointer",fontFamily:"var(--font-mono)"}}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* ── GENERATE SUB-TAB ── */}
            {comfySubTab==="generate"&&(
              <div style={{flex:1,overflow:"auto",display:"flex",gap:0,minHeight:0}}>
                {/* Left: controls */}
                <div style={{width:"min(300px,45%)",flexShrink:0,borderRight:"1px solid var(--bd)",overflow:"auto",padding:"12px 14px",display:"flex",flexDirection:"column",gap:10}}>
                  {!comfyConnected&&(
                    <div style={{padding:"10px 12px",background:"rgba(124,58,237,.06)",border:"1px solid rgba(124,58,237,.2)",borderRadius:7,fontSize:9,color:"var(--mu)"}}>
                      <div style={{fontWeight:700,color:"#A78BFA",marginBottom:4}}>⬡ ComfyUI non connecté</div>
                      Lance ComfyUI sur ton PC (port 8188), puis va dans l'onglet ⚙ Config pour connecter.
                      <button onClick={()=>setComfySubTab("settings")} style={{marginTop:6,display:"block",fontSize:8,padding:"3px 8px",background:"rgba(124,58,237,.15)",border:"1px solid rgba(124,58,237,.4)",borderRadius:4,color:"#A78BFA",cursor:"pointer"}}>→ Config</button>
                    </div>
                  )}

                  {/* Positive prompt */}
                  <div>
                    <div style={{fontSize:8,color:"var(--mu)",fontWeight:700,marginBottom:4}}>PROMPT POSITIF</div>
                    <textarea value={comfyPrompt} onChange={e=>setComfyPrompt(e.target.value)}
                      placeholder="masterpiece, best quality, detailed, a beautiful landscape at sunset, photorealistic…"
                      rows={4} style={{width:"100%",background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:6,color:"var(--tx)",fontSize:9,padding:"7px 9px",fontFamily:"var(--font-ui)",resize:"vertical",outline:"none",boxSizing:"border-box"}}/>
                    <div style={{display:"flex",gap:4,marginTop:3,flexWrap:"wrap"}}>
                      {["masterpiece","photorealistic","8k","anime style","oil painting","cinematic lighting"].map(tag=>(
                        <button key={tag} onClick={()=>setComfyPrompt(p=>p?(p+", "+tag):tag)}
                          style={{fontSize:7,padding:"1px 6px",background:"rgba(124,58,237,.08)",border:"1px solid rgba(124,58,237,.2)",borderRadius:3,color:"#A78BFA",cursor:"pointer"}}>
                          +{tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Negative prompt */}
                  <div>
                    <div style={{fontSize:8,color:"var(--mu)",fontWeight:700,marginBottom:4}}>PROMPT NÉGATIF</div>
                    <textarea value={comfyNegPrompt} onChange={e=>setComfyNegPrompt(e.target.value)}
                      rows={2} style={{width:"100%",background:"var(--s2)",border:"1px solid rgba(248,113,113,.2)",borderRadius:6,color:"var(--tx)",fontSize:9,padding:"7px 9px",fontFamily:"var(--font-ui)",resize:"vertical",outline:"none",boxSizing:"border-box"}}/>
                  </div>

                  {/* Model selector */}
                  {comfyModels.length>0&&(
                    <div>
                      <div style={{fontSize:8,color:"var(--mu)",fontWeight:700,marginBottom:4}}>MODÈLE (CHECKPOINT)</div>
                      <select value={comfyModel} onChange={e=>setComfyModel(e.target.value)}
                        style={{width:"100%",background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:5,color:"var(--tx)",fontSize:9,padding:"5px 7px",fontFamily:"var(--font-mono)",outline:"none"}}>
                        {comfyModels.map(m=><option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                  )}

                  {/* Size */}
                  <div>
                    <div style={{fontSize:8,color:"var(--mu)",fontWeight:700,marginBottom:4}}>DIMENSIONS</div>
                    <div style={{display:"flex",gap:6}}>
                      {[["W",comfyWidth,setComfyWidth],[" H",comfyHeight,setComfyHeight]].map(([lbl,val,setter])=>(
                        <div key={lbl} style={{flex:1}}>
                          <div style={{fontSize:7,color:"var(--mu)",marginBottom:2}}>{lbl}</div>
                          <select value={val} onChange={e=>setter(Number(e.target.value))}
                            style={{width:"100%",background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:4,color:"var(--tx)",fontSize:9,padding:"3px 5px",fontFamily:"var(--font-mono)",outline:"none"}}>
                            {[256,512,640,768,1024].map(v=><option key={v} value={v}>{v}</option>)}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Steps + CFG */}
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                    {[["STEPS",comfySteps,setComfySteps,1,50],["CFG",comfyCfg,setComfyCfg,1,20]].map(([lbl,val,setter,min,max])=>(
                      <div key={lbl}>
                        <div style={{fontSize:8,color:"var(--mu)",fontWeight:700,marginBottom:3}}>{lbl} <span style={{color:"var(--tx)",fontFamily:"var(--font-mono)"}}>{val}</span></div>
                        <input type="range" min={min} max={max} step={1} value={val} onChange={e=>setter(Number(e.target.value))} style={{width:"100%"}}/>
                      </div>
                    ))}
                  </div>

                  {/* Sampler */}
                  <div>
                    <div style={{fontSize:8,color:"var(--mu)",fontWeight:700,marginBottom:4}}>SAMPLER</div>
                    <select value={comfySampler} onChange={e=>setComfySampler(e.target.value)}
                      style={{width:"100%",background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:4,color:"var(--tx)",fontSize:9,padding:"4px 6px",fontFamily:"var(--font-mono)",outline:"none"}}>
                      {["euler","euler_ancestral","dpm_2","dpm_2_ancestral","dpmpp_2m","dpmpp_sde","ddim","lcm"].map(s=><option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  {/* Seed */}
                  <div>
                    <div style={{fontSize:8,color:"var(--mu)",fontWeight:700,marginBottom:4}}>SEED <span style={{fontWeight:400}}>(-1 = aléatoire)</span></div>
                    <div style={{display:"flex",gap:5}}>
                      <input type="number" value={comfySeed} onChange={e=>setComfySeed(Number(e.target.value))}
                        style={{flex:1,background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:4,color:"var(--tx)",fontSize:9,padding:"4px 7px",fontFamily:"var(--font-mono)",outline:"none"}}/>
                      <button onClick={()=>setComfySeed(Math.floor(Math.random()*2**32))}
                        style={{fontSize:9,padding:"4px 8px",background:"transparent",border:"1px solid var(--bd)",borderRadius:4,color:"var(--mu)",cursor:"pointer"}}>🎲</button>
                    </div>
                  </div>

                  {/* LoRAs */}
                  {comfyLoras.length>0&&(
                    <div>
                      <div style={{fontSize:8,color:"var(--mu)",fontWeight:700,marginBottom:4}}>LORAS ({comfyActiveLoras.length} actif{comfyActiveLoras.length!==1?"s":""})</div>
                      {comfyActiveLoras.map((lora,i)=>(
                        <div key={i} style={{display:"flex",alignItems:"center",gap:5,marginBottom:4}}>
                          <span style={{fontSize:8,flex:1,color:"var(--tx)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{lora.name.slice(0,20)}</span>
                          <input type="range" min={0} max={2} step={0.1} value={lora.strength}
                            onChange={e=>{const nl=[...comfyActiveLoras];nl[i]={...nl[i],strength:parseFloat(e.target.value)};setComfyActiveLoras(nl);}}
                            style={{width:60}}/>
                          <span style={{fontSize:7,color:"var(--mu)",fontFamily:"var(--font-mono)",width:22}}>{lora.strength.toFixed(1)}</span>
                          <button onClick={()=>setComfyActiveLoras(prev=>prev.filter((_,j)=>j!==i))} style={{background:"none",border:"none",color:"var(--red)",cursor:"pointer",fontSize:10}}>✕</button>
                        </div>
                      ))}
                      <select onChange={e=>{if(e.target.value)setComfyActiveLoras(p=>[...p,{name:e.target.value,strength:1.0}]);e.target.value="";}}
                        style={{width:"100%",background:"var(--s2)",border:"1px solid rgba(124,58,237,.3)",borderRadius:4,color:"#A78BFA",fontSize:8,padding:"3px 5px",fontFamily:"var(--font-mono)",outline:"none",marginTop:3}}>
                        <option value="">＋ Ajouter un LoRA…</option>
                        {comfyLoras.filter(l=>!comfyActiveLoras.find(a=>a.name===l)).map(l=><option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
                  )}

                  {/* Generate button */}
                  <button onClick={()=>generateComfy()} disabled={comfyGenerating||!comfyConnected}
                    style={{padding:"10px",background:"rgba(124,58,237,.2)",border:"2px solid rgba(124,58,237,.5)",borderRadius:8,color:"#A78BFA",fontSize:11,cursor:"pointer",fontWeight:800,fontFamily:"var(--font-mono)",opacity:!comfyConnected?.4:1}}>
                    {comfyGenerating?"⟳ Génération… "+comfyProgress+"%":"⬡ Générer l'image"}
                  </button>

                  {/* Progress bar */}
                  {comfyGenerating&&(
                    <div style={{height:4,background:"var(--bd)",borderRadius:2,overflow:"hidden"}}>
                      <div style={{height:"100%",width:comfyProgress+"%",background:"#A78BFA",borderRadius:2,transition:"width .5s"}}/>
                    </div>
                  )}
                  {comfyError&&<div style={{fontSize:9,color:"var(--red)",padding:"6px 8px",background:"rgba(248,113,113,.08)",border:"1px solid rgba(248,113,113,.2)",borderRadius:5}}>{comfyError}</div>}
                </div>

                {/* Right: result */}
                <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:16,overflow:"auto"}}>
                  {!comfyResult&&!comfyGenerating&&(
                    <div style={{textAlign:"center",color:"var(--mu)"}}>
                      <div style={{fontSize:48,opacity:.15,marginBottom:12}}>⬡</div>
                      <div style={{fontSize:11}}>Configure et génère ton image</div>
                      <div style={{fontSize:9,marginTop:6}}>FLUX · Stable Diffusion · SDXL · Toute checkpoint installée</div>
                    </div>
                  )}
                  {comfyGenerating&&!comfyResult&&(
                    <div style={{textAlign:"center",color:"var(--mu)"}}>
                      <div style={{fontSize:36,animation:"spin 2s linear infinite",display:"inline-block",marginBottom:12}}>⬡</div>
                      <div style={{fontSize:11,color:"#A78BFA"}}>Génération en cours… {comfyProgress}%</div>
                      <div style={{fontSize:9,marginTop:4}}>ComfyUI traite le workflow</div>
                    </div>
                  )}
                  {comfyResult&&(
                    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:12,maxWidth:600,width:"100%"}}>
                      <img src={comfyResult.url} alt="résultat"
                        style={{maxWidth:"100%",maxHeight:"60vh",objectFit:"contain",borderRadius:10,border:"1px solid var(--bd)",boxShadow:"0 8px 32px rgba(0,0,0,.3)"}}/>
                      <div style={{fontSize:9,color:"var(--mu)",textAlign:"center",fontStyle:"italic"}}>
                        {comfyResult.prompt?.slice(0,100)}{(comfyResult.prompt?.length||0)>100?"…":""}
                      </div>
                      <div style={{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"center"}}>
                        <button onClick={()=>sendComfyToChat()} style={{padding:"7px 16px",background:"rgba(74,222,128,.12)",border:"1px solid rgba(74,222,128,.3)",borderRadius:6,color:"var(--green)",fontSize:10,cursor:"pointer",fontWeight:700}}>💬 → Chat</button>
                        <button onClick={()=>{window.__openCanvas&&window.__openCanvas('<img src="'+comfyResult.url+'" style="max-width:100%;max-height:100vh;object-fit:contain;display:block;margin:auto;"/>','html','Image ComfyUI');}} style={{padding:"7px 16px",background:"rgba(124,58,237,.12)",border:"1px solid rgba(124,58,237,.3)",borderRadius:6,color:"#A78BFA",fontSize:10,cursor:"pointer",fontWeight:700}}>▶ Canvas</button>
                        <a href={comfyResult.url} download={comfyResult.filename||"image.png"} style={{padding:"7px 16px",background:"rgba(96,165,250,.1)",border:"1px solid rgba(96,165,250,.3)",borderRadius:6,color:"var(--blue)",fontSize:10,textDecoration:"none",fontWeight:700}}>⬇ Télécharger</a>
                        <button onClick={()=>{setComfyPrompt(p=>p);generateComfy();}} disabled={comfyGenerating} style={{padding:"7px 16px",background:"transparent",border:"1px solid var(--bd)",borderRadius:6,color:"var(--mu)",fontSize:10,cursor:"pointer"}}>↺ Régénérer</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── WORKFLOWS SUB-TAB ── */}
            {comfySubTab==="workflows"&&(
              <div style={{flex:1,overflow:"auto",padding:"12px 14px"}}>
                <div style={{fontSize:9,color:"var(--mu)",marginBottom:12}}>
                  Charge un fichier <code style={{color:"var(--ac)"}}>workflow_api.json</code> exporté depuis ComfyUI (menu Save → Save (API Format)).
                </div>
                {/* Upload workflow */}
                <div style={{marginBottom:14}}>
                  <input type="file" accept=".json" id="wf-upload" style={{display:"none"}}
                    onChange={async e=>{
                      const f=e.target.files?.[0]; if(!f) return;
                      try{
                        const txt=await f.text();
                        const json=JSON.parse(txt);
                        setComfyActiveWf(json);
                        setComfyWfName(f.name.replace(".json",""));
                        showToast("✓ Workflow chargé : "+f.name);
                      }catch{showToast("❌ JSON invalide");}
                      e.target.value="";
                    }}/>
                  <label htmlFor="wf-upload" style={{display:"inline-flex",alignItems:"center",gap:7,padding:"8px 16px",background:"rgba(124,58,237,.12)",border:"1px solid rgba(124,58,237,.35)",borderRadius:6,color:"#A78BFA",fontSize:10,cursor:"pointer",fontFamily:"var(--font-mono)",fontWeight:700}}>
                    📂 Charger un workflow .json
                  </label>
                  {comfyActiveWf&&(
                    <span style={{marginLeft:10,fontSize:9,color:"var(--green)"}}>
                      ✓ {comfyWfName} — {Object.keys(comfyActiveWf).length} nœuds
                    </span>
                  )}
                </div>

                {/* Workflow prompt injection */}
                {comfyActiveWf&&(
                  <div style={{marginBottom:14,padding:"10px 12px",background:"var(--s1)",border:"1px solid rgba(124,58,237,.2)",borderRadius:7}}>
                    <div style={{fontSize:9,fontWeight:700,color:"#A78BFA",marginBottom:7}}>Prompt à injecter dans le workflow</div>
                    <div style={{fontSize:8,color:"var(--mu)",marginBottom:7}}>L'app remplace automatiquement le premier nœud CLIPTextEncode (positif) par ce texte.</div>
                    <div style={{display:"flex",gap:7}}>
                      <input value={comfyPrompt} onChange={e=>setComfyPrompt(e.target.value)} placeholder="Ton prompt ici…"
                        style={{flex:1,background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:5,color:"var(--tx)",fontSize:10,padding:"7px 9px",fontFamily:"var(--font-ui)",outline:"none"}}/>
                      <button onClick={()=>{
                        if(!comfyActiveWf) return;
                        // Inject prompt into first CLIPTextEncode node
                        const wf=JSON.parse(JSON.stringify(comfyActiveWf));
                        for(const id of Object.keys(wf)){
                          if(wf[id].class_type==="CLIPTextEncode"&&wf[id].inputs?.text!==undefined){
                            wf[id].inputs.text=comfyPrompt||wf[id].inputs.text;
                            break;
                          }
                        }
                        generateComfy(wf, comfyPrompt);
                      }} disabled={comfyGenerating||!comfyConnected}
                        style={{padding:"0 14px",background:"rgba(124,58,237,.2)",border:"1px solid rgba(124,58,237,.5)",borderRadius:6,color:"#A78BFA",fontSize:10,cursor:"pointer",fontWeight:700,opacity:!comfyConnected?.4:1}}>
                        {comfyGenerating?"⟳":"⬡ Lancer"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Saved workflows */}
                <div style={{fontSize:9,fontWeight:700,color:"var(--mu)",marginBottom:8}}>WORKFLOWS SAUVEGARDÉS ({comfyWorkflows.length})</div>
                {comfyWorkflows.length===0&&<div style={{color:"var(--mu)",fontSize:9}}>Charge un workflow puis clique "Sauvegarder" pour le retrouver ici.</div>}
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:8}}>
                  {comfyWorkflows.map(wf=>(
                    <div key={wf.id} style={{background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:7,padding:"10px 12px"}}>
                      <div style={{fontSize:10,fontWeight:700,color:"var(--tx)",marginBottom:3}}>{wf.name}</div>
                      <div style={{fontSize:8,color:"var(--mu)",marginBottom:8}}>{new Date(wf.ts).toLocaleDateString("fr-FR")} · {Object.keys(wf.json||{}).length} nœuds</div>
                      <div style={{display:"flex",gap:5}}>
                        <button onClick={()=>{setComfyActiveWf(wf.json);setComfyWfName(wf.name);setComfySubTab("workflows");showToast("✓ "+wf.name+" chargé");}}
                          style={{flex:1,fontSize:8,padding:"3px 0",background:"rgba(124,58,237,.1)",border:"1px solid rgba(124,58,237,.3)",borderRadius:4,color:"#A78BFA",cursor:"pointer"}}>Charger</button>
                        <button onClick={()=>deleteComfyWorkflow(wf.id)} style={{fontSize:8,padding:"3px 7px",background:"rgba(248,113,113,.1)",border:"1px solid rgba(248,113,113,.25)",borderRadius:4,color:"var(--red)",cursor:"pointer"}}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>
                {comfyActiveWf&&(
                  <button onClick={()=>{const name=prompt("Nom du workflow :",comfyWfName||"Mon workflow");if(name)saveComfyWorkflow(name,comfyActiveWf);}}
                    style={{marginTop:12,padding:"6px 14px",background:"rgba(74,222,128,.1)",border:"1px solid rgba(74,222,128,.3)",borderRadius:5,color:"var(--green)",fontSize:9,cursor:"pointer",fontFamily:"var(--font-mono)"}}>
                    💾 Sauvegarder le workflow actuel
                  </button>
                )}
              </div>
            )}

            {/* ── HISTORY SUB-TAB ── */}
            {comfySubTab==="history"&&(
              <div style={{flex:1,overflow:"auto",padding:"12px 14px"}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
                  <div style={{fontSize:9,color:"var(--mu)"}}>{comfyHistory.length} image{comfyHistory.length!==1?"s":""} générée{comfyHistory.length!==1?"s":""}</div>
                  {comfyHistory.length>0&&<button onClick={()=>setComfyHistory([])} style={{fontSize:8,padding:"2px 8px",background:"rgba(248,113,113,.1)",border:"1px solid rgba(248,113,113,.25)",borderRadius:4,color:"var(--red)",cursor:"pointer",marginLeft:"auto"}}>🗑 Tout effacer</button>}
                </div>
                {comfyHistory.length===0&&<div style={{textAlign:"center",padding:40,color:"var(--mu)",fontSize:10}}>Aucune génération encore.</div>}
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:10}}>
                  {comfyHistory.map((h,i)=>(
                    <div key={i} style={{background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:8,overflow:"hidden"}}>
                      <img src={h.url} alt={h.prompt} style={{width:"100%",height:140,objectFit:"cover",display:"block"}}
                        onError={e=>{e.target.style.display="none";}}/>
                      <div style={{padding:"7px 9px"}}>
                        <div style={{fontSize:8,color:"var(--mu)",marginBottom:4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{h.prompt?.slice(0,50)}</div>
                        <div style={{fontSize:7,color:"var(--mu)",marginBottom:6}}>{new Date(h.ts).toLocaleString("fr-FR")}</div>
                        <div style={{display:"flex",gap:4}}>
                          <button onClick={()=>sendComfyToChat(h)} style={{flex:1,fontSize:7,padding:"2px 0",background:"rgba(74,222,128,.1)",border:"1px solid rgba(74,222,128,.25)",borderRadius:3,color:"var(--green)",cursor:"pointer"}}>→ Chat</button>
                          <a href={h.url} download style={{flex:1,fontSize:7,padding:"2px 0",background:"rgba(96,165,250,.08)",border:"1px solid rgba(96,165,250,.2)",borderRadius:3,color:"var(--blue)",textDecoration:"none",textAlign:"center"}}>⬇</a>
                          <button onClick={()=>{setComfyPrompt(h.prompt||"");setComfySubTab("generate");}} style={{flex:1,fontSize:7,padding:"2px 0",background:"transparent",border:"1px solid var(--bd)",borderRadius:3,color:"var(--mu)",cursor:"pointer"}}>↺</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── SETTINGS SUB-TAB ── */}
            {comfySubTab==="settings"&&(
              <div style={{flex:1,overflow:"auto",padding:"12px 14px"}}>
                <div style={{maxWidth:500}}>
                  <div style={{fontSize:9,color:"var(--mu)",fontWeight:700,marginBottom:8}}>CONNEXION COMFYUI</div>
                  <div style={{display:"flex",gap:7,marginBottom:10}}>
                    <input value={comfyUrl} onChange={e=>setComfyUrl(e.target.value)}
                      placeholder="http://127.0.0.1:8188"
                      style={{flex:1,background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:6,color:"var(--tx)",fontSize:10,padding:"7px 10px",fontFamily:"var(--font-mono)",outline:"none"}}/>
                    <button onClick={()=>checkComfy(comfyUrl)}
                      style={{padding:"0 16px",background:"rgba(124,58,237,.15)",border:"1px solid rgba(124,58,237,.4)",borderRadius:6,color:"#A78BFA",fontSize:10,cursor:"pointer",fontWeight:700}}>
                      🔌 Connecter
                    </button>
                  </div>
                  <div style={{padding:"10px 12px",background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:7,fontSize:9,lineHeight:1.7}}>
                    <div style={{fontWeight:700,color:"var(--tx)",marginBottom:6}}>📖 Guide rapide</div>
                    <div style={{color:"var(--mu)"}}>1. Installe ComfyUI : <code style={{color:"var(--ac)"}}>git clone https://github.com/comfyanonymous/ComfyUI</code></div>
                    <div style={{color:"var(--mu)"}}>2. Lance : <code style={{color:"var(--ac)"}}>python main.py --listen</code></div>
                    <div style={{color:"var(--mu)"}}>3. ComfyUI démarre sur <code style={{color:"var(--ac)"}}>http://127.0.0.1:8188</code></div>
                    <div style={{color:"var(--mu)"}}>4. Clique Connecter ci-dessus</div>
                    <div style={{marginTop:6,color:"var(--mu)"}}>Modèles : place tes <code style={{color:"var(--ac)"}}>.safetensors</code> dans <code style={{color:"var(--ac)"}}>ComfyUI/models/checkpoints/</code></div>
                    <div style={{color:"var(--mu)"}}>LoRAs : dans <code style={{color:"var(--ac)"}}>ComfyUI/models/loras/</code></div>
                  </div>
                  {comfyConnected&&(
                    <div style={{marginTop:10,padding:"8px 12px",background:"rgba(74,222,128,.07)",border:"1px solid rgba(74,222,128,.25)",borderRadius:6,fontSize:9}}>
                      <div style={{color:"var(--green)",fontWeight:700,marginBottom:4}}>● Connecté à {comfyUrl}</div>
                      <div style={{color:"var(--mu)"}}>{comfyModels.length} checkpoint{comfyModels.length!==1?"s":""} · {comfyLoras.length} LoRA{comfyLoras.length!==1?"s":""}</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "config" && pwaPrompt && !pwaInstalled && (
          <div style={{padding:"8px 14px",background:"rgba(212,168,83,.08)",borderBottom:"1px solid rgba(212,168,83,.2)",display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
            <span style={{fontSize:18}}>📲</span>
            <div style={{flex:1}}>
              <span style={{fontSize:10,fontWeight:700,color:"var(--ac)"}}>Installer comme application</span>
              <span style={{fontSize:9,color:"var(--mu)",marginLeft:8}}>Accès rapide, plein écran, fonctionne hors-ligne</span>
            </div>
            <button className="pwa-install-btn" style={{padding:"6px 14px",fontSize:10}} onClick={installPwa}>📲 Installer</button>
          </div>
        )}
        {tab === "config" && pwaInstalled && (
          <div style={{padding:"6px 14px",background:"rgba(74,222,128,.08)",borderBottom:"1px solid rgba(74,222,128,.2)",fontSize:9,color:"var(--green)",flexShrink:0}}>
            ✓ Application installée sur cet appareil — Ouvre-la depuis ton écran d'accueil
          </div>
        )}

        {/* ── DIFF MODAL ── */}
        {showDiffModal && diffPair[0] && diffPair[1] && (() => {
          const id1 = diffPair[0], id2 = diffPair[1];
          const m1 = MODEL_DEFS[id1], m2 = MODEL_DEFS[id2];
          const conv1 = conversations[id1]||[], conv2 = conversations[id2]||[];
          const last1 = [...conv1].reverse().find(m=>m.role==="assistant")?.content||"";
          const last2 = [...conv2].reverse().find(m=>m.role==="assistant")?.content||"";
          // Tokenize simple
          const tokenize = t => t.toLowerCase().replace(/[^a-zà-ÿ0-9\s]/g,"").split(/\s+/).filter(Boolean);
          const words1 = new Set(tokenize(last1));
          const words2 = new Set(tokenize(last2));
          const common = new Set([...words1].filter(w=>words2.has(w)&&w.length>3));
          const highlightText = (text, commonSet, uniqueColor) => {
            const parts = text.split(/(\s+)/);
            return parts.map((word, i) => {
              const clean = word.toLowerCase().replace(/[^a-zà-ÿ0-9]/g,"");
              if (clean.length <= 3) return word;
              if (commonSet.has(clean)) return (<span key={i} style={{background:"rgba(74,222,128,.2)",borderRadius:2,padding:"0 1px"}}>{word}</span>);
              return (<span key={i} style={{background:`rgba(${uniqueColor},.15)`,borderRadius:2,padding:"0 1px"}}>{word}</span>);
            });
          };
          return (
            <div style={{position:"fixed",inset:0,zIndex:1000,background:"rgba(0,0,0,.75)",backdropFilter:"blur(4px)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={()=>setShowDiffModal(false)}>
              <div style={{background:"var(--bg)",border:"1px solid var(--bd)",borderRadius:10,width:"min(900px,100%)",maxHeight:"85vh",display:"flex",flexDirection:"column",overflow:"hidden"}} onClick={e=>e.stopPropagation()}>
                <div style={{padding:"10px 16px",borderBottom:"1px solid var(--bd)",display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
                  <span style={{fontSize:16}}>🔍</span>
                  <span style={{fontWeight:700,color:"var(--tx)",fontSize:12,fontFamily:"'Syne',sans-serif"}}>Vue diff — comparaison côte à côte</span>
                  <div style={{display:"flex",gap:8,marginLeft:8,fontSize:9,color:"var(--mu)"}}>
                    <span style={{background:"rgba(74,222,128,.15)",border:"1px solid rgba(74,222,128,.3)",borderRadius:3,padding:"1px 6px",color:"var(--green)"}}>● mots communs</span>
                    <span style={{background:"rgba(248,113,113,.1)",border:"1px solid rgba(248,113,113,.2)",borderRadius:3,padding:"1px 6px",color:"var(--red)"}}>● unique IA 1</span>
                    <span style={{background:"rgba(96,165,250,.1)",border:"1px solid rgba(96,165,250,.2)",borderRadius:3,padding:"1px 6px",color:"var(--blue)"}}>● unique IA 2</span>
                  </div>
                  <div style={{marginLeft:"auto",display:"flex",gap:6}}>
                    {[id1,id2].map((id,i)=>(
                      <select key={i} value={id} onChange={e=>{const p=[...diffPair];p[i]=e.target.value;setDiffPair(p);}}
                        style={{fontSize:9,background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:4,color:"var(--tx)",padding:"2px 6px"}}>
                        {IDS.filter(x=>enabled[x]).map(x=><option key={x} value={x}>{MODEL_DEFS[x]?.icon} {MODEL_DEFS[x]?.short}</option>)}
                      </select>
                    ))}
                    <button onClick={()=>setShowDiffModal(false)} style={{background:"transparent",border:"1px solid var(--bd)",borderRadius:4,color:"var(--mu)",padding:"2px 8px",cursor:"pointer",fontSize:12}}>✕</button>
                  </div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:0,overflow:"auto",flex:1}}>
                  {[[id1,last1,"248,113,113"],[id2,last2,"96,165,250"]].map(([id,text,uniqueRgb],i)=>{
                    const m=MODEL_DEFS[id];
                    const otherWords = i===0 ? words2 : words1;
                    const myWords = i===0 ? words1 : words2;
                    return (
                      <div key={id} style={{padding:"12px 14px",borderRight:i===0?"1px solid var(--bd)":undefined}}>
                        <div style={{fontSize:10,fontWeight:700,color:m.color,marginBottom:8,fontFamily:"'Syne',sans-serif"}}>{m.icon} {m.name}</div>
                        <div style={{fontSize:9,color:"var(--tx)",lineHeight:1.7,whiteSpace:"pre-wrap",fontFamily:"'IBM Plex Mono',monospace"}}>
                          {text.split(/(\s+)/).map((word,j)=>{
                            const clean = word.toLowerCase().replace(/[^a-zà-ÿ0-9]/g,"");
                            if(clean.length<=3) return <span key={j}>{word}</span>;
                            if(common.has(clean)) return <span key={j} style={{background:"rgba(74,222,128,.2)",borderRadius:2}}>{word}</span>;
                            return <span key={j} style={{background:`rgba(${uniqueRgb},.12)`,borderRadius:2}}>{word}</span>;
                          })}
                        </div>
                        <div style={{marginTop:10,paddingTop:8,borderTop:"1px solid var(--bd)",fontSize:8,color:"var(--mu)",display:"flex",gap:12}}>
                          <span>📝 {text.split(/\s+/).length} mots</span>
                          <span style={{color:"var(--green)"}}>✦ {[...new Set(tokenize(text))].filter(w=>w.length>3&&common.has(w)).length} communs</span>
                          <span style={{color:`rgb(${uniqueRgb})`}}>◆ {[...new Set(tokenize(text))].filter(w=>w.length>3&&!common.has(w)).length} uniques</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── ONGLET COMPARE ── */}
        {tab === "compare" && (
          <div style={{flex:1,overflow:"auto",padding:16,display:"flex",flexDirection:"column",gap:16}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:2}}>
              <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:14,color:"var(--ac)",letterSpacing:1}}>⚖ COMPARAISON</div>
              {IDS.filter(id=>enabled[id]).length>=2&&(
                <button onClick={()=>{const ids=IDS.filter(id=>enabled[id]);setDiffIA1(ids[0]);setDiffIA2(ids[1]);setDiffModal(true);}} style={{marginLeft:"auto",fontSize:8,padding:"3px 10px",background:"rgba(74,222,128,.1)",border:"1px solid rgba(74,222,128,.3)",borderRadius:5,color:"var(--green)",cursor:"pointer"}}>⚡ Diff dernières réponses</button>
              )}
            </div>
            <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:14,color:"var(--ac)",letterSpacing:1}}>📊 HISTORIQUE DES COMPARAISONS</div>
            {voteHistory.length === 0 ? (
              <div style={{textAlign:"center",color:"var(--mu)",fontSize:11,padding:40}}>
                Aucune comparaison encore.<br/>
                <span style={{fontSize:9}}>Active 2+ IAs et envoie un message → le jury notera automatiquement.</span>
              </div>
            ) : (<>
              {/* Win rate cumulé */}
              <div style={{background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:8,padding:"12px 16px"}}>
                <div style={{fontSize:10,fontWeight:700,color:"var(--tx)",marginBottom:10,fontFamily:"'Syne',sans-serif"}}>🏆 CLASSEMENT CUMULÉ — {voteHistory.length} verdicts</div>
                <div style={{display:"flex",flexDirection:"column",gap:6}}>
                  {(() => {
                    const wins = {}; const totals = {}; const counts = {};
                    IDS.forEach(id => { wins[id]=0; totals[id]=0; counts[id]=0; });
                    voteHistory.forEach(v => {
                      if(v.winner) wins[v.winner]=(wins[v.winner]||0)+1;
                      Object.entries(v.scores||{}).forEach(([id,sc])=>{ const t=typeof sc==="object"?sc.total:sc; if(t){totals[id]=(totals[id]||0)+t; counts[id]=(counts[id]||0)+1;} });
                    });
                    const sorted = IDS.filter(id=>wins[id]||counts[id]).sort((a,b)=>wins[b]-wins[a]);
                    const maxWins = Math.max(...sorted.map(id=>wins[id]),1);
                    return sorted.map((id,i)=>{
                      const m=MODEL_DEFS[id];
                      const avgScore = counts[id]>0?(totals[id]/counts[id]).toFixed(1):"-";
                      const winRate = voteHistory.length>0?Math.round(wins[id]/voteHistory.length*100):0;
                      return (
                        <div key={id} style={{display:"flex",alignItems:"center",gap:10}}>
                          <span style={{fontSize:12,width:20}}>{["🥇","🥈","🥉"][i]||"  "}</span>
                          <span style={{width:80,fontSize:10,fontWeight:700,color:m.color,fontFamily:"'Syne',sans-serif"}}>{m.icon} {m.short}</span>
                          <div style={{flex:1,height:12,background:"var(--s2)",borderRadius:6,overflow:"hidden"}}>
                            <div style={{height:"100%",width:`${(wins[id]/maxWins)*100}%`,background:m.color,borderRadius:6,transition:"width .5s",display:"flex",alignItems:"center",justifyContent:"flex-end",paddingRight:4}}>
                            </div>
                          </div>
                          <span style={{fontSize:9,color:m.color,width:50,textAlign:"right",fontWeight:700}}>{wins[id]} victoire{wins[id]!==1?"s":""}</span>
                          <span style={{fontSize:9,color:"var(--mu)",width:40,textAlign:"right"}}>{winRate}%</span>
                          <span style={{fontSize:9,color:"var(--ac)",width:50,textAlign:"right"}}>⌀ {avgScore}/10</span>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
              {/* Liste des verdicts */}
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                <div style={{fontSize:10,fontWeight:700,color:"var(--tx)",fontFamily:"'Syne',sans-serif"}}>📋 TOUS LES VERDICTS</div>
                {[...voteHistory].reverse().map((v,i)=>{
                  const wm = MODEL_DEFS[v.winner];
                  const ranking = v.ranking||[v.winner];
                  const medals = ["🥇","🥈","🥉"];
                  return (
                    <div key={i} style={{background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:6,padding:"8px 12px",display:"flex",gap:10,alignItems:"flex-start"}}>
                      <div style={{flexShrink:0,textAlign:"center"}}>
                        <div style={{fontSize:16}}>🏆</div>
                        <div style={{fontSize:7,color:"var(--mu)",marginTop:2}}>{v.ts?new Date(v.ts).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}):""}</div>
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        {v.question && <div style={{fontSize:9,color:"var(--mu)",marginBottom:4,fontStyle:"italic"}}>« {v.question}… »</div>}
                        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:4}}>
                          {ranking.slice(0,3).map((id,ri)=>{ const m=MODEL_DEFS[id]; const sc=v.scores?.[id]; const tot=typeof sc==="object"?sc?.total:sc; return (
                            <span key={id} style={{fontSize:9,background:`${m?.color||"#888"}18`,border:`1px solid ${m?.color||"#888"}35`,borderRadius:4,padding:"2px 7px",color:m?.color||"var(--tx)"}}>
                              {medals[ri]} {m?.icon} {m?.short} {tot?`· ${typeof tot==="number"?tot.toFixed(1):tot}/10`:""}
                            </span>
                          );})}
                        </div>
                        <div style={{fontSize:9,color:"var(--mu)",fontFamily:"'IBM Plex Mono',monospace"}}>{v.reason}</div>
                      </div>
                      <button onClick={()=>{setBestVote(v);setShowVoteDetail(true);setShowDiffModal(false);navigateTab("chat");}} style={{flexShrink:0,fontSize:8,padding:"3px 8px",background:"rgba(212,168,83,.1)",border:"1px solid rgba(212,168,83,.3)",borderRadius:4,color:"var(--ac)",cursor:"pointer"}}>↩ Revoir</button>
                    </div>
                  );
                })}
              </div>
              <button onClick={()=>setVoteHistory([])} style={{alignSelf:"flex-start",fontSize:9,padding:"5px 12px",background:"rgba(248,113,113,.1)",border:"1px solid rgba(248,113,113,.3)",borderRadius:5,color:"var(--red)",cursor:"pointer"}}>🗑 Effacer l'historique</button>
            </>)}
          </div>
        )}

                {tab === "config" && (
          <div className="cfg-wrap">
            <div className="sec">
              <div className="sec-title">⌨️ Raccourcis clavier</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:6,fontSize:9,fontFamily:"'IBM Plex Mono',monospace"}}>
                {[
                  ["Ctrl+Enter","Envoyer le message"],
                  ["Ctrl+1..9","Activer/désactiver l'IA n°X"],
                  ["Ctrl+K","Rechercher dans l'historique"],
                  ["Ctrl+L","Effacer toutes les conversations"],
                  ["Ctrl+M","Exporter en Markdown"],
                  ["Escape","Quitter focus / solo / RAG"],
                ].map(([k,d])=>(
                  <div key={k} style={{display:"flex",alignItems:"center",gap:8,background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:5,padding:"5px 10px"}}>
                    <code style={{background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:3,padding:"2px 6px",color:"var(--ac)",fontSize:9,whiteSpace:"nowrap"}}>{k}</code>
                    <span style={{color:"var(--mu)"}}>{d}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* ── INFO POLLINATIONS ── */}
            <div className="sec" style={{background:"rgba(116,201,140,.04)",border:"1px solid rgba(116,201,140,.2)"}}>
              <div className="sec-title" style={{color:"var(--green)"}}>🌸 IAs Pollinations — Sans clé API</div>
              <div style={{fontSize:9,color:"var(--mu)",lineHeight:1.7,fontFamily:"'IBM Plex Mono',monospace"}}>
                {/* Tier 1 : GPT-4o legacy */}
                <div style={{marginBottom:8,padding:"6px 10px",background:"rgba(74,222,128,.06)",border:"1px solid rgba(74,222,128,.2)",borderRadius:5}}>
                  <strong style={{color:"var(--green)"}}>◈ GPT-4o</strong> — <code>text.pollinations.ai/openai</code> · <span style={{color:"var(--green)"}}>100% gratuit, sans clé</span>, 1 req/16s
                </div>
                {/* Tier 2 : gen.pollinations.ai avec clé Pollen */}
                <div style={{marginBottom:8,padding:"6px 10px",background:"rgba(212,168,83,.06)",border:"1px solid rgba(212,168,83,.25)",borderRadius:5}}>
                  <strong style={{color:"var(--ac)"}}>✦ Claude &nbsp;⬡ DeepSeek</strong> — <code>gen.pollinations.ai/v1</code><br/>
                  <span style={{color:"var(--ac)"}}>→ Clé Pollen requise (gratuite Seed tier)</span> :<br/>
                  <span style={{color:"var(--mu)"}}>1. Va sur <strong style={{color:"var(--tx)"}}>enter.pollinations.ai</strong> → crée un compte (gratuit)<br/>
                  2. Récupère ta clé API (Bearer token)<br/>
                  3. Colle-la dans le champ <strong style={{color:"var(--tx)"}}>Pollen API Key</strong> ci-dessous (tableau des clés)</span>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:6}}>
                  {[
                    {id:"poll_gpt",     note:"✅ Sans clé — anonymous",            tier:"free"},
                    {id:"poll_gemini",  note:"✅ Sans clé — openai-large anonymous",tier:"free"},
                    {id:"poll_claude",  note:"🔑 Clé Pollen Seed gratuite requise", tier:"paid"},
                    {id:"poll_deepseek",note:"🔑 Clé Pollen Seed gratuite requise", tier:"paid"},
                  ].map(p=>(
                    <div key={p.id} style={{background:"var(--s2)",border:"1px solid "+(p.tier==="free"?"rgba(74,222,128,.3)":"rgba(212,168,83,.3)"),borderRadius:5,padding:"6px 10px"}}>
                      <div style={{color:"var(--tx)",fontWeight:600,marginBottom:2}}>{MODEL_DEFS[p.id]?.icon} {MODEL_DEFS[p.id]?.name}</div>
                      <div style={{color:p.tier==="free"?"var(--green)":"var(--ac)",fontSize:8}}>{p.note}</div>
                      <div style={{color:"var(--mu)",fontSize:8,marginTop:2}}>Modèle : <code style={{color:"var(--ac)"}}>{MODEL_DEFS[p.id]?.model}</code></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="sec">
              
              <div className="sec-title">🤖 Modèles & Clés API</div>
              {/* ── YouTube Data API key ── */}
              <div style={{marginBottom:10,padding:"10px 14px",background:"rgba(255,0,0,.05)",border:"1px solid rgba(255,80,80,.25)",borderRadius:6,display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
                <div style={{flex:"0 0 auto"}}>
                  <div style={{fontSize:10,fontWeight:700,color:"#FF5555",marginBottom:2}}>▶ YouTube Data API v3 — Player intégré</div>
                  <div style={{fontSize:8,color:"var(--mu)",lineHeight:1.6}}>
                    Gratuit · 10 000 req/jour · <a href="https://console.cloud.google.com/apis/library/youtube.googleapis.com" target="_blank" rel="noreferrer" style={{color:"#FF5555"}}>console.cloud.google.com</a><br/>
                    <span style={{opacity:.7}}>1. Nouveau projet → Activer "YouTube Data API v3" → Identifiants → Clé API</span><br/>
                    <span style={{opacity:.7}}>Sans clé : clic vidéo = ouvre YouTube dans un nouvel onglet</span>
                  </div>
                </div>
                <div style={{display:"flex",gap:6,flex:1,minWidth:220,alignItems:"center"}}>
                  <input className="key-inp" type="password"
                    placeholder={apiKeys.youtube_data ? "••••••••" : "Coller la clé YouTube Data API v3…"}
                    value={cfgDrafts.youtube_data||""}
                    onChange={e=>setCfgDrafts(p=>({...p,youtube_data:e.target.value}))}
                    onKeyDown={e=>{if(e.key==="Enter"&&cfgDrafts.youtube_data)saveCfgKey("youtube_data");}}
                    style={{flex:1}}
                  />
                  <button className="save-btn" disabled={!cfgDrafts.youtube_data} onClick={()=>saveCfgKey("youtube_data")}>✓ Sauvegarder</button>
                  {apiKeys.youtube_data && <span style={{fontSize:8,color:"var(--green)",whiteSpace:"nowrap"}}>✓ Player actif</span>}
                </div>
              </div>

              {/* ── Pollen key banner ── */}
              <div style={{marginBottom:10,padding:"10px 14px",background:"rgba(212,168,83,.08)",border:"1px solid rgba(212,168,83,.3)",borderRadius:6,display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
                <div style={{flex:"0 0 auto"}}>
                  <div style={{fontSize:10,fontWeight:700,color:"var(--ac)",marginBottom:2}}>🌸 Clé Pollen — ✦ Claude · ⬡ DeepSeek · ◇ Gemini</div>
                  <div style={{fontSize:8,color:"var(--mu)"}}>Gratuit · <a href="https://enter.pollinations.ai" target="_blank" rel="noreferrer" style={{color:"var(--ac)"}}>enter.pollinations.ai</a> → inscription → copie ton Bearer token</div>
                </div>
                <div style={{display:"flex",gap:6,flex:1,minWidth:220,alignItems:"center"}}>
                  <input className="key-inp" type="password"
                    placeholder={apiKeys.pollen ? "••••••••" : "Coller ta clé Pollen ici…"}
                    value={cfgDrafts.pollen||""}
                    onChange={e=>setCfgDrafts(p=>({...p,pollen:e.target.value}))}
                    onKeyDown={e=>{if(e.key==="Enter"&&cfgDrafts.pollen)saveCfgKey("pollen");}}
                    style={{flex:1}}
                  />
                  <button className="save-btn" disabled={!cfgDrafts.pollen} onClick={()=>saveCfgKey("pollen")}>✓ Sauvegarder</button>
                  {apiKeys.pollen && <span style={{fontSize:8,color:"var(--green)",whiteSpace:"nowrap"}}>✓ Clé OK</span>}
                </div>
              </div>
              <div className="tbl-wrap">
                <table className="tbl">
                  <thead><tr><th>IA</th><th>Provider</th><th>Contexte</th><th>Prix</th><th>Statut</th><th>Clé API</th></tr></thead>
                  <tbody>
                    {IDS.map(id => {
                      const m = MODEL_DEFS[id]; const hasKey = !m.keyName || apiKeys[m.keyName]; const lim = isLimited(id);
                      return (
                        <tr key={id}>
                          <td><span style={{color:m.color,marginRight:4}}>{m.icon}</span><span style={{fontFamily:"'Syne',sans-serif",fontWeight:700,color:m.color,fontSize:10}}>{m.short}</span></td>
                          <td style={{color:"var(--mu)",fontSize:9}}>{m.provider}</td>
                          <td style={{fontSize:9}}>{fmt(m.maxTokens)}{m.inputLimit&&m.inputLimit<m.maxTokens?<span style={{fontSize:7,color:"var(--orange)",marginLeft:3}} title={"Limite input : "+fmt(m.inputLimit)+" tokens"}>⚡{fmt(m.inputLimit)}</span>:null}</td>
                          <td>{m.free?<span className="free-badge">FREE</span>:<span style={{fontSize:8,color:"var(--mu)"}}>Payant</span>}</td>
                          <td>
                            {lim?<span className="sbadge" style={{background:"rgba(248,113,113,.1)",color:"var(--red)"}}>⏳ {fmtCd(id)}</span>:
                            <span className="sbadge" style={{background:enabled[id]?"rgba(74,222,128,.1)":hasKey?"rgba(212,168,83,.08)":"rgba(85,85,104,.08)",color:enabled[id]?"var(--green)":hasKey?"var(--ac)":"var(--mu)"}}>
                              {enabled[id]?"● Actif":hasKey?"○ Prêt":"✗ Sans clé"}
                            </span>}
                          </td>
                          <td>
                            {!m.keyName?<span style={{fontSize:8,color:"var(--mu)"}}>Intégré</span>:(
                              <div className="key-row">
                                <input className="key-inp" type="password" placeholder={apiKeys[m.keyName]?"••••••••":"Coller ici…"} value={cfgDrafts[m.keyName]||""} onChange={e=>setCfgDrafts(p=>({...p,[m.keyName]:e.target.value}))} onKeyDown={e=>{if(e.key==="Enter"&&cfgDrafts[m.keyName])saveCfgKey(m.keyName);}}/>
                                <button className="save-btn" disabled={!cfgDrafts[m.keyName]} onClick={()=>saveCfgKey(m.keyName)}>✓</button>
                                {m.keyLink&&<a className="key-link" href={m.keyLink} target="_blank" rel="noreferrer">↗</a>}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="cfg-note">💡 Gratuits sans CB : <strong>Claude</strong> (intégré) · <strong>Gemini</strong> · <strong>Mistral</strong> · <strong style={{color:"var(--orange)"}}>⚡ Groq = Llama 3.3 70B</strong> gratuit (14 400 req/jour) — Llama tourne via l'infrastructure Groq</div>
            </div>

            <div className="sec">
              <div className="sec-title">💾 Fichier de Clés</div>
              <div className="file-btns">
                <button className="fbtn p" onClick={exportKeys}><span>⬇</span><div><div>Exporter les clés</div><div style={{fontSize:8,opacity:.7}}>multiia-keys.json</div></div></button>
                <button className="fbtn" onClick={()=>fileRef.current?.click()}><span>⬆</span><div><div>Importer les clés</div><div style={{fontSize:8,opacity:.7}}>Charger un .json</div></div></button>
                <input type="file" ref={fileRef} accept=".json" onChange={importKeys}/>
              </div>
              <div className="cfg-note" style={{marginTop:8}}>📁 Exporte tes clés avant chaque mise à jour. À la réouverture, importe le fichier → toutes tes clés sont restaurées instantanément.</div>
            </div>

            <div className="sec">
              <div className="sec">
                <div className="sec-title">🔍 Zoom de l'interface</div>
                <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
                  {[0.7,0.8,0.9,1.0,1.1,1.2,1.3,1.5,1.75,2.0].map(z=>(
                    <button key={z} onClick={()=>saveZoom(z)}
                      style={{padding:"5px 12px",borderRadius:5,border:`1px solid ${uiZoom===z?"var(--ac)":"var(--bd)"}`,
                        background:uiZoom===z?"rgba(212,168,83,.2)":"transparent",
                        color:uiZoom===z?"var(--ac)":"var(--mu)",cursor:"pointer",fontSize:11,fontFamily:"'IBM Plex Mono',monospace",fontWeight:uiZoom===z?700:400}}>
                      {Math.round(z*100)}%
                    </button>
                  ))}
                </div>
                <div className="cfg-note" style={{marginTop:8}}>
                  🖥️ 4K / grand écran → essaie <strong style={{color:"var(--ac)"}}>150%</strong> ou <strong style={{color:"var(--ac)"}}>175%</strong>. Laptop → 80% ou 90%. Sauvegardé automatiquement.
                </div>
              </div>

              <div className="sec-title">☁️ Backup complet (clés + notes + prompts + chaînes)</div>
              <div className="file-btns">
                <button className="fbtn p" onClick={() => {
                  const keys = JSON.parse(localStorage.getItem("multiia_keys")||"{}");
                  const prompts = JSON.parse(localStorage.getItem("multiia_prompts")||"[]");
                  const notes = JSON.parse(localStorage.getItem("multiia_notes")||"[]");
                  const channels = JSON.parse(localStorage.getItem("multiia_yt_channels")||"[]");
                  const backup = {_v:"multiia_backup_v1",_date:new Date().toISOString(),keys,prompts,notes,channels};
                  const blob = new Blob([JSON.stringify(backup,null,2)],{type:"application/json"});
                  const a = document.createElement("a"); a.href=URL.createObjectURL(blob);
                  a.download="multiia-backup-"+new Date().toISOString().slice(0,10)+".json"; a.click();
                  showToast("✅ Backup complet téléchargé !");
                }}><span>⬇</span><div><div>Télécharger backup</div><div style={{fontSize:8,opacity:.7}}>Tout en un fichier</div></div></button>
                <label className="fbtn" style={{cursor:"pointer"}}>
                  <span>⬆</span><div><div>Restaurer backup</div><div style={{fontSize:8,opacity:.7}}>Importe le .json</div></div>
                  <input type="file" accept=".json" style={{display:"none"}} onChange={async e => {
                    const f = e.target.files[0]; if (!f) return;
                    const text = await f.text();
                    try {
                      const backup = JSON.parse(text);
                      if (!backup._v||!backup._v.startsWith("multiia_backup")) { showToast("❌ Fichier invalide"); return; }
                      if (backup.keys) { localStorage.setItem("multiia_keys",JSON.stringify(backup.keys)); }
                      if (backup.prompts) localStorage.setItem("multiia_prompts",JSON.stringify(backup.prompts));
                      if (backup.notes) localStorage.setItem("multiia_notes",JSON.stringify(backup.notes));
                      if (backup.channels) localStorage.setItem("multiia_yt_channels",JSON.stringify(backup.channels));
                      showToast("✅ Tout restauré ! Recharge la page.");
                    } catch { showToast("❌ Erreur de lecture"); }
                    e.target.value="";
                  }}/>
                </label>
              </div>
              <div className="cfg-note" style={{marginTop:8}}>☁️ Ce fichier backup contient TOUT : clés API, prompts perso, notes et chaînes YouTube. Parfait pour sync entre appareils ou après mise à jour.</div>
            </div>

            {/* ── HISTORIQUE DES VERSIONS ── */}
            <div className="sec">
              <div className="sec-title">📋 Historique des versions</div>
              <div style={{display:"flex",flexDirection:"column",gap:4,maxHeight:420,overflowY:"auto",paddingRight:4}}>
                {[
                  { v:"v15 — actuelle", date:"Mar 2026", color:"#D4A853", items:[
                    "🔴 Fix Pollinations 401 : retour sur text.pollinations.ai/openai (endpoint anonyme gratuit)",
                    "🌸 4ème IA Pollinations : Gemini via Pollinations (sans clé)",
                    "🌱 Persona Débutant : explications comme à une personne âgée, étapes numérotées, max 3 étapes",
                    "🧑‍🏫 Persona Tuteur IA : apprend à utiliser les IAs, prompts, LLMs",
                    "🔌 Plugins JS : tableau de 12 plugins prêts à charger (Chart.js, Marked, Highlight, Math.js…)",
                    "🎬 Vidéos vues : badge ✓, masquer les vues, reset, bouton +Vu sur chaque carte",
                    "📋 Config : section Pollinations explicative + historique des versions",
                  ]},
                  { v:"v14", date:"Mar 2026", color:"#A78BFA", items:[
                    "🏆 Jury IA automatique : note les réponses après chaque échange, affiche la meilleure",
                    "⌨️ Raccourcis clavier : Ctrl+Enter, Ctrl+1..9, Ctrl+K, Ctrl+L, Ctrl+M, Escape",
                    "🔍 Recherche plein-texte dans l'historique (titres + contenu messages)",
                    "📝 Export Markdown + 🖨 Export PDF pour chaque colonne IA",
                    "😈 5 nouveaux Personas : Avocat du diable, Expert, Socrate, Optimiste radical, Philosophe stoïcien",
                    "📄 RAG : coller un document long, découpage auto en chunks, injection contextuelle",
                    "⛶ Mode Focus plein écran par colonne IA",
                    "🖥 Ollama local : auto-détection modèles, sélecteur, toggle chat",
                    "🔀 Onglet Workflow : éditeur chaîne de prompts séquentiels",
                    "🔌 Plugins JS : charger scripts JS par URL",
                  ]},
                  { v:"v13", date:"Fév 2026", color:"#60A5FA", items:[
                    "🌐 IAs Web : 37 IAs en 8 catégories (Chatbots, Recherche, Multi-modèles, Image, Code, Audio, Premium)",
                    "🔭 Bouton Découvrir : appel IA pour trouver 5 nouvelles IAs, sauvegardées en localStorage",
                  ]},
                  { v:"v12", date:"Fév 2026", color:"#4ADE80", items:[
                    "🗂 Nouvelle barre de navigation réorganisée (10 onglets)",
                    "🌙/☀ Thème clair/sombre",
                    "🔊 Lecture vocale TTS par réponse IA",
                    "🎙 Dictée vocale dans la zone de saisie Chat",
                    "🎭 Personas : 6 modes prêts + créer ses propres system prompts",
                    "⎘ Bouton Copier sur chaque réponse IA",
                  ]},
                  { v:"v11", date:"Jan 2026", color:"#FB923C", items:[
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
                  <div key={entry.v} style={{background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:6,padding:"8px 12px"}}>
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
        )}
      </div>

      {/* MODAL CLÉ */}
      {modal && MODEL_DEFS[modal] && (() => {
        const m = MODEL_DEFS[modal];
        return (
          <div className="ov" onClick={() => setModal(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h3 style={{ color:m.color }}>{m.icon} Clé API {m.name}</h3>
              <p>Entre ta clé API {m.provider}.{m.free&&<><br/><span style={{color:"var(--green)"}}>✦ Ce service a un tier gratuit !</span></>}{m.keyLink&&<><br/><br/>Obtenir une clé : <a href={m.keyLink} target="_blank" rel="noreferrer">{m.keyLink}</a></>}</p>
              <input type="password" autoFocus placeholder={`Clé API ${m.provider}…`} value={keyDraft} onChange={e=>setKeyDraft(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&keyDraft.trim())saveKeyModal();}}/>
              <div className="mbtns"><button className="mbg" onClick={()=>setModal(null)}>Annuler</button><button className="mbs" onClick={saveKeyModal} disabled={!keyDraft.trim()}>Activer</button></div>
            </div>
          </div>
        );
      })()}

      {/* MODAL EXPORT */}
      {showExportModal && (
        <div className="ov" onClick={() => setShowExportModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 style={{ color:"var(--ac)" }}>💾 Exporter les clés</h3>
            <p>Copie ce JSON dans un fichier <strong>multiia-keys.json</strong> sur ton PC.</p>
            <textarea className="exp-json" readOnly value={exportJson} onClick={e=>e.target.select()}/>
            <div className="mbtns">
              <button className="mbg" onClick={()=>setShowExportModal(false)}>Fermer</button>
              <button className="copy-btn" onClick={()=>{navigator.clipboard.writeText(exportJson).then(()=>showToast("✓ Copié")).catch(()=>showToast("Sélectionne et copie manuellement"));setShowExportModal(false);}}>⎘ Copier</button>
            </div>
          </div>
        </div>
      )}

      {/* PERSONA CREATION MODAL */}
      {showPersonaModal && (
        <div className="yt-add-modal" onClick={e=>{if(e.target===e.currentTarget)setShowPersonaModal(false);}}>
          <div className="yt-add-modal-box" style={{maxWidth:500}}>
            <div className="yt-add-modal-title">🎭 Créer un persona</div>
            <div className="yt-add-row">
              <div className="yt-add-field" style={{flex:"none",width:60}}>
                <label className="yt-add-label">Icône</label>
                <input className="yt-add-inp" value={personaForm.icon} onChange={e=>setPersonaForm(f=>({...f,icon:e.target.value}))} style={{textAlign:"center",fontSize:16}} maxLength={2}/>
              </div>
              <div className="yt-add-field" style={{flex:2}}>
                <label className="yt-add-label">Nom *</label>
                <input className="yt-add-inp" placeholder="Ex : Expert marketing, Dev Python…" value={personaForm.name} onChange={e=>setPersonaForm(f=>({...f,name:e.target.value}))}/>
              </div>
            </div>
            <div className="yt-add-field">
              <label className="yt-add-label">System prompt *</label>
              <textarea className="yt-add-inp" rows={5} placeholder={"Tu es un expert en [DOMAINE]. Tu réponds de façon [STYLE]…"} style={{resize:"vertical",lineHeight:1.6}} value={personaForm.system} onChange={e=>setPersonaForm(f=>({...f,system:e.target.value}))}/>
              <span style={{fontSize:8,color:"var(--mu)"}}>Ce texte est envoyé en instruction système à chaque message.</span>
            </div>
            <div className="yt-add-field">
              <label className="yt-add-label">Couleur</label>
              <div className="yt-add-colors">
                {["#D4A853","#4ADE80","#60A5FA","#A78BFA","#FB923C","#E07FA0","#34D399","#F97316","#FACC15","#C084FC"].map(col=>(
                  <div key={col} className={"yt-add-color "+(personaForm.color===col?"sel":"")} style={{background:col}} onClick={()=>setPersonaForm(f=>({...f,color:col}))}/>
                ))}
              </div>
            </div>
            {personaForm.name && (
              <div style={{padding:"7px 10px",background:personaForm.color+"12",border:"1px solid "+personaForm.color+"33",borderRadius:6,display:"flex",alignItems:"center",gap:8,fontSize:10}}>
                <span style={{fontSize:15}}>{personaForm.icon}</span>
                <span style={{color:personaForm.color,fontWeight:700}}>{personaForm.name}</span>
              </div>
            )}
            <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
              <button onClick={()=>setShowPersonaModal(false)} style={{padding:"7px 14px",background:"transparent",border:"1px solid var(--bd)",borderRadius:5,color:"var(--mu)",cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace",fontSize:10}}>Annuler</button>
              <button onClick={()=>{
                if(!personaForm.name.trim()||!personaForm.system.trim()) return;
                const p={id:"cp_"+Date.now(),...personaForm,custom:true};
                savePersonas([...customPersonas,p]);
                setActivePersona(p.id);
                setShowPersonaModal(false);
                setPersonaForm({name:"",icon:"🤖",color:"#D4A853",system:""});
                showToast("✓ Persona créé");
              }} style={{padding:"7px 18px",background:"rgba(212,168,83,.15)",border:"1px solid var(--ac)",borderRadius:5,color:"var(--ac)",cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace",fontSize:10,fontWeight:700}}>＋ Créer</button>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE BOTTOM TAB BAR */}
      <div className="mobile-tabbar" style={isMobile?{display:"flex"}:{display:"none"}}>
        {MOBILE_TABS.map(([t,ico,lbl])=>(
          <button key={t} className={"mobile-tab-btn "+(tab===t?"on":"")} onClick={()=>navigateTab(t)}>
            <span className="ico">{ico}</span>
            <span>{lbl}</span>
          </button>
        ))}
        {/* Bouton "Plus" */}
        <button className={"mobile-tab-btn "+(showMobileMore?"on":"")} onClick={()=>setShowMobileMore(v=>!v)}>
          <span className="ico">{showMobileMore?"✕":"⋯"}</span>
          <span>Plus</span>
        </button>
      </div>

      {/* MOBILE MORE OVERLAY */}
      {showMobileMore && isMobile && (
        <>
          <div className="mobile-more-overlay" onClick={()=>setShowMobileMore(false)}/>
          <div className="mobile-more-drawer">
            <div style={{textAlign:"center",marginBottom:10,fontSize:10,color:"var(--ac)",fontWeight:700,fontFamily:"var(--font-display)"}}>Tous les onglets</div>
            {MOBILE_MORE_SECTIONS.map(section=>(
              <div key={section.label}>
                <div className="mobile-more-section">{section.label}</div>
                <div className="mobile-more-grid">
                  {section.tabs.map(([t,ico,lbl])=>(
                    <button key={t} className={"mobile-more-btn "+(tab===t?"on":"")}
                      onClick={()=>{ navigateTab(t); setShowMobileMore(false); }}>
                      <span className="mico">{ico}</span>
                      <span>{lbl}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* PWA INSTALL BANNER */}
      {showPwaBanner && !pwaInstalled && (
        <div className="pwa-banner">
          <div className="pwa-banner-icon">📲</div>
          <div className="pwa-banner-text">
            <div className="pwa-banner-title">Installer Multi-IA Hub</div>
            <div className="pwa-banner-sub">Accès rapide depuis ton écran d'accueil, fonctionne hors-ligne</div>
          </div>
          {pwaPrompt && <button className="pwa-install-btn" onClick={installPwa}>Installer</button>}
          <button className="pwa-dismiss-btn" onClick={dismissPwaBanner}>✕</button>
        </div>
      )}

      {/* ══ CANVAS PANEL ══ */}
      {canvasContent && (() => {
        // Build HTML with error catcher injected
        const isHtml = canvasContent.lang === "html" || canvasContent.lang === "svg";
        const healScript = `<script>window.onerror=function(msg,src,line,col,err){parent.postMessage({type:'canvas-error',error:(err?.message||msg)+' (L'+line+':'+col+')'},'*');return true;};<\/script>`;
        const srcDoc = isHtml ? healScript + canvasContent.code : '<html><head>'+healScript+'</head><body style="margin:0;background:#fff;">'+canvasContent.code+'</body></html>';
        return (
          <div className="canvas-panel">
            <div className="canvas-hdr">
              <span style={{fontSize:11}}>🎨</span>
              <span style={{flex:1,fontFamily:"var(--font-display)",fontWeight:700,fontSize:11,color:"var(--tx)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                {canvasContent.title||"Canvas"}
                {canvasHealCount>0&&<span style={{marginLeft:6,fontSize:8,color:"var(--green)",fontFamily:"var(--font-mono)"}}>✓ {canvasHealCount} auto-correction{canvasHealCount>1?"s":""}</span>}
              </span>
              <span style={{fontSize:8,color:"var(--mu)",padding:"2px 6px",background:"var(--s2)",borderRadius:3,marginRight:4}}>{canvasContent.lang}</span>
              <button onClick={()=>{const b=new Blob([canvasContent.code],{type:"text/html"});const u=URL.createObjectURL(b);window.open(u,"_blank");}} style={{fontSize:8,padding:"3px 8px",background:"rgba(96,165,250,.1)",border:"1px solid rgba(96,165,250,.3)",borderRadius:4,color:"var(--blue)",cursor:"pointer",marginRight:4}}>↗</button>
              <button onClick={()=>{setCanvasContent(null);setCanvasError(null);}} style={{background:"none",border:"1px solid var(--bd)",borderRadius:4,color:"var(--mu)",fontSize:12,width:24,height:24,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
            </div>
            <iframe className="canvas-iframe" sandbox="allow-scripts"
              srcDoc={srcDoc} title="Canvas preview"
              ref={React.useCallback(el=>{
                if(el){
                  if(el.__msgHandler) window.removeEventListener('message',el.__msgHandler);
                  el.__msgHandler=(e)=>{ if(e.data?.type==='canvas-error') setCanvasError(e.data.error); };
                  window.addEventListener('message',el.__msgHandler);
                } else if(el===null){
                  // unmount — handled by effect cleanup
                }
              },[])}
            />
            {/* Error banner with auto-heal */}
            {canvasError && (
              <div style={{padding:"8px 12px",background:"rgba(248,113,113,.1)",borderTop:"1px solid rgba(248,113,113,.3)",flexShrink:0,display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:9,color:"var(--red)",fontFamily:"var(--font-mono)",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>⚠️ {canvasError}</span>
                <button onClick={healCanvas} disabled={canvasEditing}
                  style={{padding:"3px 10px",background:"rgba(248,113,113,.15)",border:"1px solid rgba(248,113,113,.4)",borderRadius:5,color:"var(--red)",fontSize:9,cursor:"pointer",fontFamily:"var(--font-mono)",fontWeight:700,flexShrink:0,opacity:canvasEditing?.5:1}}>
                  {canvasEditing?"⟳ Correction…":"🔧 Auto-corriger"}
                </button>
              </div>
            )}
            {/* Edit bar */}
            <div style={{padding:"8px 12px",borderTop:"1px solid var(--bd)",background:"var(--s1)",flexShrink:0}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
                <div style={{fontSize:8,color:"var(--mu)"}}>✦ Modifier avec l'IA</div>
                {comfyConnected&&<button onClick={()=>{
                  const promptAI = "illustration for: "+canvasContent?.title;
                  setComfyPrompt(promptAI);
                  generateComfy(null, promptAI);
                }} style={{marginLeft:"auto",fontSize:7,padding:"2px 7px",background:"rgba(124,58,237,.1)",border:"1px solid rgba(124,58,237,.3)",borderRadius:3,color:"#A78BFA",cursor:"pointer"}}>
                  ⬡ Générer image
                </button>}
              </div>
              <div style={{display:"flex",gap:7}}>
                <input value={canvasEditInput} onChange={e=>setCanvasEditInput(e.target.value)}
                  onKeyDown={e=>{if(e.key==="Enter"&&canvasEditInput.trim())editCanvas();}}
                  placeholder='Ex: "Ajoute un bouton", "Change le fond en noir"…'
                  style={{flex:1,background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:6,color:"var(--tx)",fontSize:9,padding:"6px 10px",fontFamily:"var(--font-ui)",outline:"none"}}/>
                <button onClick={()=>editCanvas()} disabled={canvasEditing||!canvasEditInput.trim()}
                  style={{padding:"0 12px",background:"rgba(212,168,83,.15)",border:"1px solid rgba(212,168,83,.4)",borderRadius:6,color:"var(--ac)",fontSize:10,cursor:"pointer",fontWeight:700,opacity:canvasEditing||!canvasEditInput.trim()?.4:1}}>
                  {canvasEditing?"⟳":"✦"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ══ DIFF MODAL ══ */}
      {diffModal && (() => {
        const activeIAs = IDS.filter(id=>enabled[id]);
        const ia1 = diffIA1 || activeIAs[0] || "";
        const ia2 = diffIA2 || activeIAs[1] || "";
        const msgs1 = (conversations[ia1]||[]).filter(m=>m.role==="assistant");
        const msgs2 = (conversations[ia2]||[]).filter(m=>m.role==="assistant");
        const lastMsg1 = msgs1[msgs1.length-1]?.content||"";
        const lastMsg2 = msgs2[msgs2.length-1]?.content||"";
        const diff = lastMsg1&&lastMsg2 ? computeDiff(lastMsg1,lastMsg2) : [];
        const added = diff.filter(d=>d.t==="add").length;
        const deleted = diff.filter(d=>d.t==="del").length;
        const similar = diff.filter(d=>d.t==="eq").length;
        const pct = diff.length>0?Math.round(similar/diff.length*100):0;
        return (
          <div onClick={()=>setDiffModal(false)} style={{position:"fixed",inset:0,zIndex:9100,background:"rgba(0,0,0,.88)",display:"flex",alignItems:"center",justifyContent:"center",padding:16,backdropFilter:"blur(8px)"}}>
            <div onClick={e=>e.stopPropagation()} style={{width:"min(860px,96vw)",maxHeight:"90vh",background:"var(--bg)",border:"1px solid var(--bd)",borderRadius:12,overflow:"auto",display:"flex",flexDirection:"column"}}>
              <div style={{padding:"12px 16px",borderBottom:"1px solid var(--bd)",background:"var(--s1)",display:"flex",alignItems:"center",gap:10,position:"sticky",top:0,zIndex:2}}>
                <span style={{fontSize:14}}>⚡</span>
                <div style={{flex:1,fontFamily:"var(--font-display)",fontWeight:800,fontSize:13,color:"var(--tx)"}}>Diff de réponses</div>
                <div style={{display:"flex",gap:6,alignItems:"center"}}>
                  {[ia1,ia2].map((ia,idx)=>(
                    <select key={idx} value={ia} onChange={e=>{idx===0?setDiffIA1(e.target.value):setDiffIA2(e.target.value);}}
                      style={{fontSize:9,background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:5,color:MODEL_DEFS[ia]?.color||"var(--tx)",padding:"3px 7px",fontFamily:"var(--font-mono)"}}>
                      {activeIAs.map(id=><option key={id} value={id}>{MODEL_DEFS[id]?.icon} {MODEL_DEFS[id]?.short}</option>)}
                    </select>
                  ))}
                </div>
                <button onClick={()=>setDiffModal(false)} style={{background:"none",border:"1px solid var(--bd)",borderRadius:4,color:"var(--mu)",fontSize:14,width:28,height:28,cursor:"pointer"}}>✕</button>
              </div>
              {/* Stats */}
              <div style={{padding:"8px 16px",borderBottom:"1px solid var(--bd)",display:"flex",gap:12,alignItems:"center",background:"var(--s2)"}}>
                <span style={{fontSize:9,color:"var(--green)",fontFamily:"var(--font-mono)"}}>+{added} mots ajoutés</span>
                <span style={{fontSize:9,color:"var(--red)",fontFamily:"var(--font-mono)"}}>{deleted} mots supprimés</span>
                <span style={{fontSize:9,color:"var(--mu)",fontFamily:"var(--font-mono)"}}>{pct}% similaire</span>
                <div style={{flex:1,height:4,background:"var(--bd)",borderRadius:2,overflow:"hidden"}}>
                  <div style={{height:"100%",width:pct+"%",background:"var(--green)",borderRadius:2,transition:"width .5s"}}/>
                </div>
              </div>
              {/* Diff text */}
              <div style={{padding:"14px 16px",fontSize:10,lineHeight:1.9,fontFamily:"var(--font-ui)"}}>
                {diff.length===0&&<div style={{color:"var(--mu)",textAlign:"center",padding:20}}>Envoie un message d'abord pour comparer les réponses.</div>}
                {diff.map((d,i)=>(
                  <span key={i} style={{
                    background:d.t==="add"?"rgba(74,222,128,.18)":d.t==="del"?"rgba(248,113,113,.18)":"transparent",
                    color:d.t==="add"?"var(--green)":d.t==="del"?"var(--red)":"var(--tx)",
                    textDecoration:d.t==="del"?"line-through":"none",
                    padding:d.t==="eq"?"0":"0 1px",
                    borderRadius:2,
                    marginRight:"3px",
                  }}>{d.v}{" "}</span>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ══ PROMPT BUILDER MODAL ══ */}
      {showPromptBuilder && (
        <PromptBuilderModal
          onInsert={(text)=>{setChatInput(text); showToast("✓ Prompt inséré");}}
          onClose={()=>setShowPromptBuilder(false)}
          enabled={enabled}
          apiKeys={apiKeys}
        />
      )}

      {/* ══ AUTO-MEMORY SUGGESTIONS ══ */}
      {showMemSuggest && autoMemSuggestions.length>0 && (
        <div style={{position:"fixed",bottom:70,left:"50%",transform:"translateX(-50%)",zIndex:9400,background:"var(--s1)",border:"1px solid rgba(212,168,83,.4)",borderRadius:10,padding:"10px 14px",maxWidth:460,boxShadow:"0 4px 24px rgba(0,0,0,.5)"}}>
          <div style={{fontSize:9,fontWeight:700,color:"var(--ac)",marginBottom:8}}>🧠 Mémoriser ces informations ?</div>
          {autoMemSuggestions.map((fact,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
              <span style={{fontSize:9,color:"var(--tx)",flex:1}}>• {fact}</span>
              <button onClick={()=>{
                const newFact={id:Date.now().toString()+i,text:fact};
                setMemFacts(p=>[...p,newFact]);
                try{localStorage.setItem("multiia_mem",JSON.stringify([...memFacts,newFact]));}catch{}
                setAutoMemSuggestions(p=>p.filter((_,j)=>j!==i));
                if(autoMemSuggestions.length<=1)setShowMemSuggest(false);
                showToast("✓ Mémorisé : "+fact.slice(0,40));
              }} style={{fontSize:8,padding:"2px 8px",background:"rgba(74,222,128,.12)",border:"1px solid rgba(74,222,128,.3)",borderRadius:4,color:"var(--green)",cursor:"pointer",whiteSpace:"nowrap"}}>
                ✓ Mémoriser
              </button>
            </div>
          ))}
          <div style={{display:"flex",gap:6,marginTop:8}}>
            <button onClick={()=>setShowMemSuggest(false)} style={{fontSize:8,padding:"3px 8px",background:"transparent",border:"1px solid var(--bd)",borderRadius:4,color:"var(--mu)",cursor:"pointer"}}>Ignorer tout</button>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}

export default App;
