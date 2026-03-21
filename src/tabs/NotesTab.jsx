import React from "react";

export default function NotesTab({ onCopyToChat }) {
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
