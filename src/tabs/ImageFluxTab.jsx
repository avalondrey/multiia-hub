import React from 'react';

const STYLES_PRESETS = [
  { label:'Réaliste',      value:'photorealistic, 8k, detailed, natural lighting' },
  { label:'Illustration',  value:'digital illustration, vibrant colors, artistic, detailed' },
  { label:'Anime',         value:'anime style, manga, detailed, colorful, Studio Ghibli' },
  { label:'Cinématique',   value:'cinematic, dramatic lighting, movie still, professional photography' },
  { label:'Concept Art',   value:'concept art, fantasy, detailed, professional, artstation' },
  { label:'Minimaliste',   value:'minimalist, clean, simple, geometric, flat design' },
];

const SIZES = [
  { label:'Carré 1:1',       w:1024, h:1024 },
  { label:'Paysage 16:9',    w:1280, h:720  },
  { label:'Portrait 9:16',   w:720,  h:1280 },
  { label:'Large 4:3',       w:1024, h:768  },
];

export default function ImageFluxTab({ apiKeys }) {
  const [prompt,       setPrompt]       = React.useState('');
  const [negPrompt,    setNegPrompt]    = React.useState('blurry, low quality, distorted, watermark');
  const [style,        setStyle]        = React.useState('');
  const [size,         setSize]         = React.useState(SIZES[0]);
  const [loading,      setLoading]      = React.useState(false);
  const [images,       setImages]       = React.useState([]);   // [{url, prompt, ts}]
  const [error,        setError]        = React.useState('');
  const [steps,        setSteps]        = React.useState(4);    // 1-8 pour schnell
  const [hfKeyInput,   setHfKeyInput]   = React.useState(() => {
    try { return JSON.parse(localStorage.getItem('multiia_keys')||'{}').huggingface || ''; } catch { return ''; }
  });

  const hfKey = hfKeyInput || (() => { try { return JSON.parse(localStorage.getItem('multiia_keys')||'{}').huggingface||''; } catch { return ''; } })();

  const saveHfKey = (k) => {
    setHfKeyInput(k);
    try {
      const keys = JSON.parse(localStorage.getItem('multiia_keys')||'{}');
      keys.huggingface = k;
      localStorage.setItem('multiia_keys', JSON.stringify(keys));
    } catch {}
  };

  const generate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError('');

    const fullPrompt = [prompt.trim(), style].filter(Boolean).join(', ');

    try {
      // Flux.1-schnell via HuggingFace Inference API
      const response = await fetch(
        'https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${hfKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: fullPrompt,
            parameters: {
              negative_prompt: negPrompt || undefined,
              width:  size.w,
              height: size.h,
              num_inference_steps: steps,
              guidance_scale: 0,  // Flux schnell = 0
            },
          }),
        }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${response.status}`);
      }

      const blob = await response.blob();
      const url  = URL.createObjectURL(blob);
      setImages(prev => [{ url, prompt: fullPrompt, ts: new Date().toLocaleTimeString('fr-FR') }, ...prev].slice(0, 20));
    } catch(e) {
      setError(e.message);
    }
    setLoading(false);
  };

  return (
    <div style={{flex:1,overflow:'auto',padding:'clamp(10px,2vw,16px)'}}>
      {/* Header */}
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:6,flexWrap:'wrap'}}>
        <div style={{fontFamily:'var(--font-display)',fontWeight:800,fontSize:'clamp(14px,2.5vw,18px)',color:'#F472B6'}}>⚡ Flux.1 — Génération d'images</div>
        <div style={{fontSize:9,color:'var(--mu)'}}>— Flux.1-schnell via HuggingFace · Gratuit · Qualité état de l'art</div>
      </div>
      <div style={{fontSize:9,color:'var(--mu)',marginBottom:14,padding:'8px 12px',background:'rgba(244,114,182,.06)',border:'1px solid rgba(244,114,182,.15)',borderRadius:6}}>
        Flux.1-schnell est le modèle de génération d'images le plus rapide du moment — rivalise avec Midjourney. Gratuit via HuggingFace (clé gratuite, 1000 req/jour).{' '}
        <a href='https://huggingface.co/settings/tokens' target='_blank' rel='noreferrer' style={{color:'#F472B6'}}>Obtenir une clé HF →</a>
      </div>

      {/* Clé HuggingFace */}
      <div style={{marginBottom:14,padding:'10px 14px',background:'var(--s1)',border:'1px solid var(--bd)',borderRadius:8}}>
        <div style={{fontSize:8,color:'var(--mu)',fontWeight:700,marginBottom:5}}>CLÉ HUGGINGFACE (gratuite)</div>
        <div style={{display:'flex',gap:8}}>
          <input type='password' value={hfKeyInput} onChange={e=>saveHfKey(e.target.value)}
            placeholder='hf_...'
            style={{flex:1,background:'var(--s2)',border:'1px solid '+(hfKey?'rgba(244,114,182,.4)':'var(--bd)'),borderRadius:5,color:'var(--tx)',fontSize:10,padding:'6px 10px',outline:'none'}}/>
          {hfKey && <span style={{fontSize:9,color:'var(--green)',display:'flex',alignItems:'center'}}>✓ Clé OK</span>}
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 320px',gap:14}}>
        {/* Formulaire */}
        <div>
          {/* Prompt principal */}
          <div style={{marginBottom:10}}>
            <div style={{fontSize:8,color:'#F472B6',fontWeight:700,marginBottom:5}}>PROMPT *</div>
            <textarea value={prompt} onChange={e=>setPrompt(e.target.value)}
              onKeyDown={e=>{if(e.key==='Enter'&&e.ctrlKey)generate();}}
              placeholder='Décris l'image à générer… (Ctrl+Enter pour lancer)'
              rows={3} style={{width:'100%',background:'var(--s2)',border:'1px solid rgba(244,114,182,.3)',borderRadius:6,color:'var(--tx)',fontSize:11,padding:'9px 12px',resize:'vertical',outline:'none',boxSizing:'border-box'}}/>
          </div>

          {/* Prompt négatif */}
          <div style={{marginBottom:10}}>
            <div style={{fontSize:8,color:'var(--mu)',fontWeight:700,marginBottom:5}}>PROMPT NÉGATIF (ce qu'on ne veut pas)</div>
            <input value={negPrompt} onChange={e=>setNegPrompt(e.target.value)}
              style={{width:'100%',background:'var(--s2)',border:'1px solid var(--bd)',borderRadius:6,color:'var(--tx)',fontSize:10,padding:'7px 10px',outline:'none',boxSizing:'border-box'}}/>
          </div>

          {/* Styles rapides */}
          <div style={{marginBottom:10}}>
            <div style={{fontSize:8,color:'var(--mu)',fontWeight:700,marginBottom:5}}>STYLE</div>
            <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
              <button onClick={()=>setStyle('')}
                style={{padding:'4px 10px',borderRadius:8,border:'1px solid '+(style===''?'#F472B6':'var(--bd)'),background:style===''?'rgba(244,114,182,.12)':'transparent',color:style===''?'#F472B6':'var(--mu)',fontSize:8,cursor:'pointer'}}>
                Aucun
              </button>
              {STYLES_PRESETS.map(s=>(
                <button key={s.label} onClick={()=>setStyle(s.value)}
                  style={{padding:'4px 10px',borderRadius:8,border:'1px solid '+(style===s.value?'#F472B6':'var(--bd)'),background:style===s.value?'rgba(244,114,182,.12)':'transparent',color:style===s.value?'#F472B6':'var(--mu)',fontSize:8,cursor:'pointer'}}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Taille + Steps */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:14}}>
            <div>
              <div style={{fontSize:8,color:'var(--mu)',fontWeight:700,marginBottom:5}}>TAILLE</div>
              <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                {SIZES.map(s=>(
                  <button key={s.label} onClick={()=>setSize(s)}
                    style={{padding:'4px 9px',borderRadius:6,border:'1px solid '+(size.label===s.label?'#F472B6':'var(--bd)'),background:size.label===s.label?'rgba(244,114,182,.12)':'transparent',color:size.label===s.label?'#F472B6':'var(--mu)',fontSize:8,cursor:'pointer'}}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div style={{fontSize:8,color:'var(--mu)',fontWeight:700,marginBottom:5}}>ÉTAPES DE DIFFUSION ({steps}) — plus = meilleur/plus lent</div>
              <input type='range' min={1} max={8} value={steps} onChange={e=>setSteps(+e.target.value)}
                style={{width:'100%',accentColor:'#F472B6'}}/>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:7,color:'var(--mu)'}}>
                <span>1 (rapide)</span><span>4 (défaut)</span><span>8 (qualité)</span>
              </div>
            </div>
          </div>

          {/* Bouton générer */}
          <button onClick={generate} disabled={loading||!prompt.trim()||!hfKey}
            style={{width:'100%',padding:'11px',background:loading?'var(--s2)':'rgba(244,114,182,.15)',border:'2px solid '+(loading?'var(--bd)':'rgba(244,114,182,.5)'),borderRadius:8,color:loading?'var(--mu)':'#F472B6',fontSize:12,cursor:loading?'default':'pointer',fontWeight:700,fontFamily:'var(--font-display)',transition:'all .2s',opacity:!hfKey?0.5:1}}>
            {loading ? '⏳ Génération Flux.1…' : !hfKey ? '⚠️ Clé HuggingFace requise' : '⚡ Générer avec Flux.1-schnell'}
          </button>

          {error && (
            <div style={{marginTop:8,padding:'8px 12px',background:'rgba(248,113,113,.08)',border:'1px solid rgba(248,113,113,.3)',borderRadius:6,fontSize:9,color:'var(--red)'}}>
              ❌ {error}
            </div>
          )}
        </div>

        {/* Galerie */}
        <div>
          <div style={{fontSize:8,color:'var(--mu)',fontWeight:700,marginBottom:8}}>GALERIE ({images.length} images)</div>
          {images.length === 0 && !loading && (
            <div style={{padding:'40px 20px',textAlign:'center',color:'var(--mu)',fontSize:10,background:'var(--s1)',border:'1px solid var(--bd)',borderRadius:8}}>
              <div style={{fontSize:32,marginBottom:8}}>🖼</div>
              Tes images apparaîtront ici
            </div>
          )}
          {loading && (
            <div style={{padding:'40px 20px',textAlign:'center',background:'var(--s1)',border:'1px solid rgba(244,114,182,.2)',borderRadius:8}}>
              <div style={{fontSize:32,marginBottom:8,display:'inline-block',animation:'spin 2s linear infinite'}}>⚡</div>
              <div style={{fontSize:10,color:'#F472B6'}}>Flux.1 génère…</div>
            </div>
          )}
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {images.map((img,i) => (
              <div key={i} style={{background:'var(--s1)',border:'1px solid rgba(244,114,182,.2)',borderRadius:8,overflow:'hidden'}}>
                <img src={img.url} alt={img.prompt} style={{width:'100%',display:'block',borderRadius:'8px 8px 0 0'}}/>
                <div style={{padding:'6px 8px'}}>
                  <div style={{fontSize:8,color:'var(--mu)',marginBottom:3}}>{img.ts}</div>
                  <div style={{fontSize:8,color:'var(--tx)',lineHeight:1.4,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{img.prompt.slice(0,60)}</div>
                  <div style={{display:'flex',gap:5,marginTop:5}}>
                    <a href={img.url} download={`flux-${i}.png`}
                      style={{fontSize:8,padding:'2px 8px',background:'rgba(244,114,182,.1)',border:'1px solid rgba(244,114,182,.3)',borderRadius:4,color:'#F472B6',textDecoration:'none'}}>
                      ⬇ Télécharger
                    </a>
                    <button onClick={()=>setPrompt(img.prompt)}
                      style={{fontSize:8,padding:'2px 8px',background:'transparent',border:'1px solid var(--bd)',borderRadius:4,color:'var(--mu)',cursor:'pointer'}}>
                      ↺ Réutiliser
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
