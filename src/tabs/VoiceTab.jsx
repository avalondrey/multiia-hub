import React from 'react';
import { MODEL_DEFS } from "../config/models.js";

export default function VoiceTab({ enabled, apiKeys, conversations, setChatInput, navigateTab }) {
  const [listening, setListening] = React.useState(false);
  const [transcript, setTranscript] = React.useState("");
  const [voiceReply, setVoiceReply] = React.useState("");
  const [speaking, setSpeaking] = React.useState(false);
  const [voiceIA, setVoiceIA] = React.useState("");
  const [history, setHistory] = React.useState([]);
  const recognRef = React.useRef(null);

  const activeIds = Object.keys(MODEL_DEFS).filter(id => enabled[id] && !MODEL_DEFS[id]?.serial);
  const currentIA = voiceIA || activeIds[0] || "";

  const speak = (text) => {
    if (!text || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    setSpeaking(true);
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "fr-FR";
    u.rate = 1.1;
    u.pitch = 1;
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(u);
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { alert("Ton navigateur ne supporte pas la reconnaissance vocale."); return; }
    const recogn = new SpeechRecognition();
    recogn.lang = "fr-FR";
    recogn.continuous = false;
    recogn.interimResults = false;

    recogn.onresult = (event) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
    };
    recogn.onerror = () => setListening(false);
    recogn.onend = () => setListening(false);
    recognRef.current = recogn;
    recogn.start();
    setListening(true);
  };

  const stopListening = () => {
    recognRef.current?.stop();
    setListening(false);
  };

  const sendToIA = async () => {
    if (!transcript.trim() || !currentIA) return;
    const userMsg = { role:"user", content:transcript };
    setHistory(h=>[...h, userMsg]);
    try {
      const { callModel } = await import("../api/ai-service.js");
      const reply = await callModel(currentIA, [...history, userMsg], apiKeys, "Assistant vocal amical et concis.");
      setHistory(h=>[...h, { role:"assistant", content:reply }]);
      setVoiceReply(reply);
      speak(reply);
    } catch(e) {
      const errMsg = "Erreur: "+e.message;
      setVoiceReply(errMsg);
      speak(errMsg);
    }
  };

  return (
    <div style={{flex:1,overflow:"auto",padding:"clamp(10px,2vw,16px)"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6,flexWrap:"wrap"}}>
        <div style={{fontFamily:"var(--font-display)",fontWeight:800,fontSize:"clamp(14px,2.5vw,18px)",color:"#A78BFA"}}>🎙 Voice Tab</div>
        <div style={{fontSize:9,color:"var(--mu)"}}>— Interface vocale multi-IA avec synthèse et reconnaissance</div>
      </div>
      <div style={{fontSize:9,color:"var(--mu)",marginBottom:14,padding:"8px 12px",background:"rgba(167,139,250,.06)",border:"1px solid rgba(167,139,250,.15)",borderRadius:6}}>
        Parle à ton IA directement. Sélectionne le modèle, appuie sur le micro et l'IA te répondra par synthèse vocale.
      </div>

      {/* Sélection IA */}
      <div style={{marginBottom:14}}>
        <div style={{fontSize:8,color:"var(--mu)",fontWeight:700,marginBottom:6}}>MODÈLE VOCAL</div>
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
          {activeIds.map(id=>(
            <button key={id} onClick={()=>setVoiceIA(id)}
              style={{padding:"5px 12px",borderRadius:10,border:"1px solid "+(currentIA===id?MODEL_DEFS[id].color:"var(--bd)"),background:currentIA===id?MODEL_DEFS[id].color+"1A":"transparent",color:currentIA===id?MODEL_DEFS[id].color:"var(--mu)",fontSize:9,cursor:"pointer",fontWeight:currentIA===id?700:400}}>
              {MODEL_DEFS[id].icon} {MODEL_DEFS[id].short}
            </button>
          ))}
        </div>
      </div>

      {/* Micro */}
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:16,marginBottom:20}}>
        <button
          onClick={listening?stopListening:startListening}
          style={{width:80,height:80,borderRadius:"50%",border:"3px solid "+(listening?"var(--red)":"var(--ac)"),background:listening?"rgba(248,113,113,.15)":"rgba(167,139,250,.1)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .2s",boxShadow:listening?"0 0 20px rgba(248,113,113,.4)":"0 0 0 rgba(167,139,250,0)"}}>
          {listening ? (
            <span style={{fontSize:28}}>🔴</span>
          ) : (
            <span style={{fontSize:28}}>🎤</span>
          )}
        </button>
        <div style={{fontSize:10,color:listening?"var(--red)":"var(--mu)",fontWeight:600}}>
          {listening ? "⏹ Arrêter" : "🎤 Parler"}
        </div>
      </div>

      {/* Transcript */}
      {transcript && (
        <div style={{background:"var(--s1)",border:"1px solid rgba(167,139,250,.2)",borderRadius:10,padding:"12px 14px",marginBottom:14}}>
          <div style={{fontSize:8,color:"#A78BFA",fontWeight:700,marginBottom:6}}>TU AS DIT</div>
          <div style={{fontSize:11,color:"var(--tx)",lineHeight:1.6,marginBottom:10}}>{transcript}</div>
          <button onClick={sendToIA} disabled={!currentIA}
            style={{padding:"8px 20px",background:"rgba(167,139,250,.15)",border:"1px solid rgba(167,139,250,.4)",borderRadius:6,color:"#A78BFA",fontSize:10,cursor:"pointer",fontWeight:700}}>
            ↗ Envoyer à {MODEL_DEFS[currentIA]?.short || "l'IA"}
          </button>
        </div>
      )}

      {/* Reply */}
      {voiceReply && (
        <div style={{background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:10,padding:"12px 14px",marginBottom:14}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
            <span style={{fontSize:8,color:"#A78BFA",fontWeight:700}}>{MODEL_DEFS[currentIA]?.icon} {MODEL_DEFS[currentIA]?.short} RÉPOND</span>
            {speaking && <span style={{fontSize:8,color:"var(--green)"}}>🔊 En cours…</span>}
          </div>
          <div style={{fontSize:11,color:"var(--tx)",lineHeight:1.6}}>{voiceReply}</div>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div>
          <div style={{fontSize:8,color:"var(--mu)",fontWeight:700,marginBottom:8}}>HISTORIQUE</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {history.map((m,i)=>(
              <div key={i} style={{padding:"8px 12px",background:m.role==="user"?"rgba(96,165,250,.06)":"var(--s1)",border:"1px solid "+m.role==="user"?"rgba(96,165,250,.2)":"var(--bd)",borderRadius:8}}>
                <div style={{fontSize:7,color:m.role==="user"?"var(--blue)":"#A78BFA",fontWeight:700,marginBottom:3}}>{m.role==="user"?"🎤 TOI":"🤖 "+MODEL_DEFS[currentIA]?.short}</div>
                <div style={{fontSize:10,color:"var(--tx)",lineHeight:1.5}}>{m.content}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
