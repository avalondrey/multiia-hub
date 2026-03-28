import React from "react";
import { db } from "../db/index.js";
import { callModel } from "../api/ai-service.js";

// 🌱 MULTI-IA GREENHOUSE - Ton écosystème jardin intelligent
export default function GreenhouseTab({ enabled, apiKeys }) {
  const [activeSection, setActiveSection] = React.useState('advisor');
  const [gardenData, setGardenData] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  
  // Charger les données du jardin
  React.useEffect(() => {
    loadGardenData();
  }, []);
  
  const loadGardenData = async () => {
    const data = await db.getGardenData('my-garden');
    if (data) setGardenData(data);
  };
  
  const saveGardenData = async (data) => {
    await db.saveGardenData('my-garden', data);
    setGardenData(data);
  };
  
  return (
    <div className="greenhouse-wrap" style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
      {/* Header */}
      <div className="greenhouse-hdr" style={{padding:'14px 18px',borderBottom:'1px solid var(--bd)',display:'flex',alignItems:'center',gap:'12px',background:'rgba(5,3,10,.4)',flexShrink:0}}>
        <div style={{fontFamily:'var(--font-display)',fontWeight:900,fontSize:'clamp(16px,3vw,22px)',background:'linear-gradient(135deg,#4ADE80,#10B981)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
          🌱 Multi-IA Greenhouse
        </div>
        <div style={{fontSize:10,color:'var(--mu)',marginTop:3}}>
          Ton jardin intelligent piloté par l'IA
        </div>
      </div>
      
      {/* Navigation */}
      <div className="greenhouse-nav" style={{padding:'8px 18px',borderBottom:'1px solid var(--bd)',display:'flex',gap:'6px',flexWrap:'wrap',background:'rgba(5,3,10,.3)',flexShrink:0}}>
        <NavButton 
          active={activeSection === 'advisor'} 
          onClick={() => setActiveSection('advisor')}
          icon="🤖"
          label="Conseiller Jardin"
        />
        <NavButton 
          active={activeSection === 'diagnostic'} 
          onClick={() => setActiveSection('diagnostic')}
          icon="📸"
          label="Diagnostic Photo"
        />
        <NavButton 
          active={activeSection === 'planning'} 
          onClick={() => setActiveSection('planning')}
          icon="📅"
          label="Planning"
        />
        <NavButton 
          active={activeSection === 'plants'} 
          onClick={() => setActiveSection('plants')}
          icon="🌿"
          label="Mes Plantes"
        />
        <NavButton 
          active={activeSection === 'calendar'} 
          onClick={() => setActiveSection('calendar')}
          icon="📆"
          label="Calendrier"
        />
      </div>
      
      {/* Content */}
      <div className="greenhouse-body" style={{flex:1,overflow:'auto',padding:'16px'}}>
        {activeSection === 'advisor' && <GardenAdvisor apiKeys={apiKeys} enabled={enabled} gardenData={gardenData} onSave={saveGardenData} />}
        {activeSection === 'diagnostic' && <PlantDiagnostic apiKeys={apiKeys} enabled={enabled} />}
        {activeSection === 'planning' && <GardenPlanning apiKeys={apiKeys} enabled={enabled} gardenData={gardenData} onSave={saveGardenData} />}
        {activeSection === 'plants' && <MyPlants apiKeys={apiKeys} enabled={enabled} gardenData={gardenData} onSave={saveGardenData} />}
        {activeSection === 'calendar' && <GardenCalendar gardenData={gardenData} />}
      </div>
    </div>
  );
}

// Bouton de navigation
function NavButton({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 12px',
        borderRadius: '8px',
        border: active ? '1px solid var(--green)' : '1px solid var(--bd)',
        background: active ? 'rgba(74,222,128,.1)' : 'transparent',
        color: active ? 'var(--green)' : 'var(--mu)',
        fontSize: '9px',
        cursor: 'pointer',
        fontWeight: active ? 700 : 400,
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        fontFamily: 'var(--font-mono)'
      }}
    >
      <span style={{fontSize:14}}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// CONSEILLER JARDIN
// ─────────────────────────────────────────────────────────────
function GardenAdvisor({ apiKeys, enabled, gardenData, onSave }) {
  const [climate, setClimate] = React.useState({
    temp: '',
    humidity: '',
    region: '',
    season: 'Printemps'
  });
  const [plants, setPlants] = React.useState([]);
  const [advice, setAdvice] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  
  const activeIds = Object.keys(MODEL_DEFS).filter(id => enabled[id]);
  const advisorIA = activeIds[0] || 'groq';
  
  const getAdvice = async () => {
    if (!plants.length) return;
    setLoading(true);
    
    const prompt = `
🌱 CONSEILLER JARDIN EXPERT

Contexte :
- Région : ${climate.region || 'France'}
- Saison : ${climate.season}
- Température : ${climate.temp || 'non spécifiée'}°C
- Humidité : ${climate.humidity || 'non spécifiée'}%
- Plantes : ${plants.join(', ')}

Tu es un jardinier expert avec 30 ans d'expérience. Donne des conseils PRATIQUES et ACTIONNABLES pour :

1. 🚿 ARROSAGE
   - Fréquence recommandée
   - Quantité par plante
   - Meilleur moment de la journée

2. ✂️ ENTRETIEN
   - Taille nécessaire
   - Fertilisation
   - Paillage

3. ⚠️ PROBLÈMES À SURVEILLER
   - Maladies potentielles
   - Ravageurs de saison
   - Signes d'alerte

4. 📅 TÂCHES DE LA SEMAINE
   Liste priorisée des actions à faire cette semaine

Sois concret, précis, adapté au climat français. Utilise un ton encourageant et pédagogique.
    `;
    
    try {
      const result = await callModel(advisorIA, [{role: 'user', content: prompt}], apiKeys);
      setAdvice(result);
      
      // Sauvegarder l'historique
      if (onSave) {
        onSave({
          ...gardenData,
          lastAdvice: {
            date: Date.now(),
            climate,
            plants,
            advice: result
          }
        });
      }
    } catch (e) {
      setAdvice('❌ Erreur: ' + e.message);
    }
    
    setLoading(false);
  };
  
  return (
    <div className="advisor-section">
      <div style={{fontFamily:'var(--font-display)',fontWeight:800,fontSize:16,color:'var(--green)',marginBottom:12}}>
        🤖 IA Conseiller Jardin
      </div>
      
      {/* Formulaire */}
      <div style={{background:'var(--s1)',border:'1px solid var(--bd)',borderRadius:12,padding:16,marginBottom:16}}>
        <div style={{fontSize:9,color:'var(--mu)',fontWeight:700,marginBottom:12,letterSpacing:1}}>
          TON JARDIN
        </div>
        
        {/* Plantes */}
        <div style={{marginBottom:12}}>
          <label style={{fontSize:9,color:'var(--mu)',display:'block',marginBottom:6}}>
            🌿 Tes plantes (séparées par des virgules)
          </label>
          <textarea
            value={plants.join(', ')}
            onChange={(e) => setPlants(e.target.value.split(',').filter(p => p.trim()))}
            placeholder="Tomates, courgettes, basilic, rosiers..."
            rows={2}
            style={{
              width:'100%',
              background:'var(--s2)',
              border:'1px solid var(--bd)',
              borderRadius:6,
              color:'var(--tx)',
              fontSize:10,
              padding:'8px 10px',
              resize:'vertical',
              fontFamily:'var(--font-ui)'
            }}
          />
        </div>
        
        {/* Climat */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:12}}>
          <div>
            <label style={{fontSize:9,color:'var(--mu)',display:'block',marginBottom:4}}>
              🌡️ Température (°C)
            </label>
            <input
              type="number"
              value={climate.temp}
              onChange={(e) => setClimate({...climate, temp: e.target.value})}
              placeholder="20"
              style={{
                width:'100%',
                background:'var(--s2',
                border:'1px solid var(--bd)',
                borderRadius:6,
                color:'var(--tx)',
                fontSize:10,
                padding:'6px 8px'
              }}
            />
          </div>
          <div>
            <label style={{fontSize:9,color:'var(--mu)',display:'block',marginBottom:4}}>
              💧 Humidité (%)
            </label>
            <input
              type="number"
              value={climate.humidity}
              onChange={(e) => setClimate({...climate, humidity: e.target.value})}
              placeholder="60"
              style={{
                width:'100%',
                background:'var(--s2)',
                border:'1px solid var(--bd)',
                borderRadius:6,
                color:'var(--tx)',
                fontSize:10,
                padding:'6px 8px'
              }}
            />
          </div>
        </div>
        
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
          <div>
            <label style={{fontSize:9,color:'var(--mu)',display:'block',marginBottom:4}}>
              📍 Région
            </label>
            <input
              type="text"
              value={climate.region}
              onChange={(e) => setClimate({...climate, region: e.target.value})}
              placeholder="Île-de-France"
              style={{
                width:'100%',
                background:'var(--s2)',
                border:'1px solid var(--bd)',
                borderRadius:6,
                color:'var(--tx)',
                fontSize:10,
                padding:'6px 8px'
              }}
            />
          </div>
          <div>
            <label style={{fontSize:9,color:'var(--mu)',display:'block',marginBottom:4}}>
              🍂 Saison
            </label>
            <select
              value={climate.season}
              onChange={(e) => setClimate({...climate, season: e.target.value})}
              style={{
                width:'100%',
                background:'var(--s2)',
                border:'1px solid var(--bd)',
                borderRadius:6,
                color:'var(--tx)',
                fontSize:10,
                padding:'6px 8px'
              }}
            >
              <option value="Printemps">🌸 Printemps</option>
              <option value="Été">☀️ Été</option>
              <option value="Automne">🍂 Automne</option>
              <option value="Hiver">❄️ Hiver</option>
            </select>
          </div>
        </div>
        
        {/* Bouton */}
        <button
          onClick={getAdvice}
          disabled={loading || !plants.length}
          style={{
            width:'100%',
            marginTop:12,
            padding:'10px',
            borderRadius:8,
            border:'none',
            background: loading ? 'var(--s2)' : 'linear-gradient(135deg, #4ADE80, #10B981)',
            color: loading ? 'var(--mu)' : '#fff',
            fontSize:10,
            fontWeight:700,
            cursor: loading ? 'default' : 'pointer',
            fontFamily:'var(--font-mono)'
          }}
        >
          {loading ? '⏳ Analyse en cours...' : '🌱 Obtenir mes conseils'}
        </button>
      </div>
      
      {/* Résultat */}
      {advice && (
        <div style={{background:'var(--s1)',border:'1px solid var(--green)',borderRadius:12,padding:16}}>
          <div style={{fontSize:9,color:'var(--green)',fontWeight:700,marginBottom:8}}>
            ✅ Conseils générés
          </div>
          <div style={{fontSize:11,lineHeight:1.7,whiteSpace:'pre-wrap'}}>
            {advice}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// DIAGNOSTIC PHOTO
// ─────────────────────────────────────────────────────────────
function PlantDiagnostic({ apiKeys, enabled }) {
  const [image, setImage] = React.useState(null);
  const [diagnoses, setDiagnoses] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  
  const activeIds = Object.keys(MODEL_DEFS).filter(id => enabled[id]);
  const diagnosticIAs = activeIds.slice(0, 3);
  
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setImage(e.target.result);
      reader.readAsDataURL(file);
    }
  };
  
  const diagnose = async () => {
    if (!image) return;
    setLoading(true);
    setDiagnoses([]);
    
    const prompt = `
📸 DIAGNOSTIC DE PLANTE

Analyse cette photo de plante de façon EXPERT :

1. 🌿 IDENTIFICATION
   - Nom probable de la plante
   - Variété si identifiable

2. ⚠️ PROBLÈMES DÉTECTÉS
   - Maladies (champignons, bactéries, virus)
   - Ravageurs (insectes, acariens)
   - Carences (azote, fer, etc.)
   - Stress (eau, soleil, température)

3. 💊 TRAITEMENTS RECOMMANDÉS
   - Solutions naturelles en priorité
   - Produits si nécessaire
   - Fréquence de traitement

4. 🛡️ PRÉVENTION
   - Comment éviter que ça recommence

Sois précis, donne des noms scientifiques si possible, et des conseils actionnables.
    `;
    
    const results = await Promise.all(
      diagnosticIAs.map(async (ia) => {
        try {
          // Pour les IAs avec vision (Claude, Gemini)
          if (MODEL_DEFS[ia].vision) {
            const result = await callModel(ia, [{
              role: 'user',
              content: [
                {type: 'image_url', image_url: {url: image}},
                {type: 'text', text: prompt}
              ]
            }], apiKeys);
            return {ia, result, error: null};
          } else {
            // IAs sans vision
            return {
              ia,
              result: "❌ Cette IA ne supporte pas l'analyse d'images. Utilise Claude ou Gemini.",
              error: null
            };
          }
        } catch (e) {
          return {ia, result: null, error: e.message};
        }
      })
    );
    
    setDiagnoses(results);
    setLoading(false);
  };
  
  return (
    <div className="diagnostic-section">
      <div style={{fontFamily:'var(--font-display)',fontWeight:800,fontSize:16,color:'var(--cyan)',marginBottom:12}}>
        📸 Diagnostic Photo
      </div>
      
      {/* Upload */}
      <div style={{background:'var(--s1)',border:'1px solid var(--bd)',borderRadius:12,padding:16,marginBottom:16}}>
        <label style={{
          display:'flex',
          flexDirection:'column',
          alignItems:'center',
          justifyContent:'center',
          padding:'30px',
          border:'2px dashed var(--bd)',
          borderRadius:8,
          cursor:'pointer',
          background:'var(--s2)'
        }}>
          <span style={{fontSize:32,marginBottom:8}}>📷</span>
          <span style={{fontSize:10,color:'var(--mu)'}}>
            {image ? 'Changer la photo' : 'Clique pour uploader une photo de ta plante'}
          </span>
          <input type="file" accept="image/*" onChange={handleImageUpload} style={{display:'none'}} />
        </label>
        
        {image && (
          <div style={{marginTop:12,textAlign:'center'}}>
            <img src={image} alt="Plante" style={{maxWidth:'100%',maxHeight:300,borderRadius:8,border:'1px solid var(--bd)'}} />
            <br/>
            <button
              onClick={diagnose}
              disabled={loading}
              style={{
                marginTop:12,
                padding:'10px 20px',
                borderRadius:8,
                border:'none',
                background: loading ? 'var(--s2)' : 'linear-gradient(135deg, #00D4FF, #0099CC)',
                color:'#fff',
                fontSize:10,
                fontWeight:700,
                cursor: loading ? 'default' : 'pointer'
              }}
            >
              {loading ? '⏳ Analyse en cours...' : '🔍 Lancer le diagnostic'}
            </button>
          </div>
        )}
      </div>
      
      {/* Résultats */}
      {diagnoses.length > 0 && (
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          {diagnoses.map(({ia, result, error}) => {
            const m = MODEL_DEFS[ia];
            return (
              <div key={ia} style={{
                background:'var(--s1)',
                border:`1px solid ${error ? 'var(--red)' : m.color}`,
                borderRadius:12,
                padding:14
              }}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                  <span style={{fontSize:16}}>{m.icon}</span>
                  <span style={{fontWeight:700,fontSize:11,color: m.color}}>{m.name}</span>
                  {error && <span style={{fontSize:9,color:'var(--red)'}}>❌ {error}</span>}
                </div>
                <div style={{fontSize:10,lineHeight:1.6,whiteSpace:'pre-wrap'}}>
                  {result}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PLANNING INTELLIGENT
// ─────────────────────────────────────────────────────────────
function GardenPlanning({ apiKeys, enabled, gardenData, onSave }) {
  const [constraints, setConstraints] = React.useState({
    timeAvailable: '30min/jour',
    physicalLimits: '',
    tools: '',
    goals: ''
  });
  const [planning, setPlanning] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  
  const activeIds = Object.keys(MODEL_DEFS).filter(id => enabled[id]);
  const plannerIA = activeIds[0] || 'groq';
  
  const generatePlanning = async () => {
    setLoading(true);
    
    const prompt = `
📅 GÉNÉRATION DE PLANNING JARDIN

Crée un planning HEBDOMADAIRE d'entretien de jardin personnalisé.

Contraintes de l'utilisateur :
- Temps disponible : ${constraints.timeAvailable}
- Limitations physiques : ${constraints.physicalLimits || 'Aucune'}
- Outils disponibles : ${constraints.tools || 'Basiques'}
- Objectifs : ${constraints.goals || 'Jardin productif et beau'}

Génère un planning RÉALISTE et ADAPTÉ aux contraintes.

Format JSON attendu :
{
  "weekPlan": [
    {
      "day": "Lundi",
      "tasks": [
        {
          "task": "Arroser les tomates",
          "duration": 15,
          "difficulty": "facile",
          "priority": "high",
          "notes": "Tôt le matin de préférence"
        }
      ]
    }
  ],
  "monthlyTasks": [
    {
      "task": "Tailler les rosiers",
      "week": 1,
      "difficulty": "moyen"
    }
  ],
  "tips": [
    "Conseil 1",
    "Conseil 2"
  ]
}

Sois pragmatique, ne surcharge pas, adapte aux limitations physiques.
    `;
    
    try {
      const result = await callModel(plannerIA, [{role: 'user', content: prompt}], apiKeys);
      
      // Extraire le JSON
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      const planning = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
      
      setPlanning(planning);
      
      if (onSave) {
        onSave({
          ...gardenData,
          planning: {
            date: Date.now(),
            constraints,
            data: planning
          }
        });
      }
    } catch (e) {
      console.error('Erreur génération planning:', e);
    }
    
    setLoading(false);
  };
  
  const exportToCalendar = () => {
    if (!planning) return;
    
    let ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//MultiIA Hub//Greenhouse//FR
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Mon Jardin
X-WR-DESC:Planning d'entretien du jardin
`;
    
    planning.weekPlan?.forEach(day => {
      day.tasks?.forEach(task => {
        const date = new Date();
        // Calculer la date du jour de la semaine
        const dayOfWeek = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'].indexOf(day.day);
        const diff = dayOfWeek - date.getDay();
        date.setDate(date.getDate() + diff);
        date.setHours(8, 0, 0);
        
        const formatDate = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        
        ics += `BEGIN:VEVENT
SUMMARY:${task.task}
DTSTART:${formatDate(date)}
DURATION:PT${task.duration}M
DESCRIPTION:${task.notes || ''}
PRIORITY:${task.priority === 'high' ? '1' : task.priority === 'medium' ? '5' : '9'}
CATEGORIES:Jardin,${task.difficulty}
END:VEVENT
`;
      });
    });
    
    ics += 'END:VCALENDAR';
    
    const blob = new Blob([ics], {type: 'text/calendar'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'planning-jardin.ics';
    a.click();
  };
  
  return (
    <div className="planning-section">
      <div style={{fontFamily:'var(--font-display)',fontWeight:800,fontSize:16,color:'var(--orange)',marginBottom:12}}>
        📅 Planning Intelligent
      </div>
      
      {/* Contraintes */}
      <div style={{background:'var(--s1)',border:'1px solid var(--bd)',borderRadius:12,padding:16,marginBottom:16}}>
        <div style={{fontSize:9,color:'var(--mu)',fontWeight:700,marginBottom:12}}>
          TES CONTRAINTES
        </div>
        
        <div style={{display:'grid',gap:12}}>
          <div>
            <label style={{fontSize:9,color:'var(--mu)',display:'block',marginBottom:4}}>
              ⏱️ Temps disponible par jour
            </label>
            <select
              value={constraints.timeAvailable}
              onChange={(e) => setConstraints({...constraints, timeAvailable: e.target.value})}
              style={{width:'100%',background:'var(--s2)',border:'1px solid var(--bd)',borderRadius:6,color:'var(--tx)',fontSize:10,padding:'6px 8px'}}
            >
              <option value="15min/jour">15 min/jour</option>
              <option value="30min/jour">30 min/jour</option>
              <option value="45min/jour">45 min/jour</option>
              <option value="1h/jour">1h/jour</option>
              <option value="2h/jour">2h/jour</option>
              <option value="Week-end uniquement">Week-end uniquement</option>
            </select>
          </div>
          
          <div>
            <label style={{fontSize:9,color:'var(--mu)',display:'block',marginBottom:4}}>
              🦽 Limitations physiques (optionnel)
            </label>
            <input
              type="text"
              value={constraints.physicalLimits}
              onChange={(e) => setConstraints({...constraints, physicalLimits: e.target.value})}
              placeholder="Ex: Mal de dos, mobilité réduite..."
              style={{width:'100%',background:'var(--s2)',border:'1px solid var(--bd)',borderRadius:6,color:'var(--tx)',fontSize:10,padding:'6px 8px'}}
            />
          </div>
          
          <div>
            <label style={{fontSize:9,color:'var(--mu)',display:'block',marginBottom:4}}>
              🛠️ Outils disponibles
            </label>
            <input
              type="text"
              value={constraints.tools}
              onChange={(e) => setConstraints({...constraints, tools: e.target.value})}
              placeholder="Ex: Arrosoir, bêche, taille-haie..."
              style={{width:'100%',background:'var(--s2)',border:'1px solid var(--bd)',borderRadius:6,color:'var(--tx)',fontSize:10,padding:'6px 8px'}}
            />
          </div>
          
          <div>
            <label style={{fontSize:9,color:'var(--mu)',display:'block',marginBottom:4}}>
              🎯 Objectifs
            </label>
            <input
              type="text"
              value={constraints.goals}
              onChange={(e) => setConstraints({...constraints, goals: e.target.value})}
              placeholder="Ex: Légumes pour la famille, jardin d'ornement..."
              style={{width:'100%',background:'var(--s2)',border:'1px solid var(--bd)',borderRadius:6,color:'var(--tx)',fontSize:10,padding:'6px 8px'}}
            />
          </div>
        </div>
        
        <button
          onClick={generatePlanning}
          disabled={loading}
          style={{
            width:'100%',
            marginTop:12,
            padding:'10px',
            borderRadius:8,
            border:'none',
            background: loading ? 'var(--s2)' : 'linear-gradient(135deg, #F59E0B, #D97706)',
            color:'#fff',
            fontSize:10,
            fontWeight:700,
            cursor: loading ? 'default' : 'pointer'
          }}
        >
          {loading ? '⏳ Génération...' : '📅 Générer mon planning'}
        </button>
      </div>
      
      {/* Résultat */}
      {planning && (
        <>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
            <div style={{fontSize:11,color:'var(--mu)'}}>Planning généré</div>
            <button
              onClick={exportToCalendar}
              style={{
                padding:'6px 12px',
                borderRadius:6,
                border:'1px solid var(--green)',
                background:'rgba(74,222,128,.1)',
                color:'var(--green)',
                fontSize:9,
                cursor:'pointer',
                fontWeight:600
              }}
            >
              📥 Exporter vers Calendar
            </button>
          </div>
          
          {/* Planning hebdo */}
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {planning.weekPlan?.map((day, idx) => (
              <div key={idx} style={{
                background:'var(--s1)',
                border:'1px solid var(--bd)',
                borderRadius:8,
                padding:12
              }}>
                <div style={{fontWeight:700,fontSize:11,color:'var(--ac)',marginBottom:8}}>
                  {day.day}
                </div>
                {day.tasks?.map((task, tidx) => (
                  <div key={tidx} style={{
                    display:'flex',
                    alignItems:'center',
                    gap:8,
                    padding:'6px 0',
                    borderBottom: tidx < day.tasks.length - 1 ? '1px solid var(--bd)' : 'none'
                  }}>
                    <div style={{
                      width:8,
                      height:8,
                      borderRadius:'50%',
                      background: task.priority === 'high' ? 'var(--red)' : task.priority === 'medium' ? 'var(--orange)' : 'var(--green)'
                    }} />
                    <div style={{flex:1,fontSize:10}}>{task.task}</div>
                    <div style={{fontSize:9,color:'var(--mu)'}}>{task.duration}min</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
          
          {/* Conseils */}
          {planning.tips && (
            <div style={{
              background:'rgba(74,222,128,.05)',
              border:'1px solid rgba(74,222,128,.2)',
              borderRadius:8,
              padding:12,
              marginTop:12
            }}>
              <div style={{fontWeight:700,fontSize:10,color:'var(--green)',marginBottom:8}}>
                💡 Conseils
              </div>
              {planning.tips.map((tip, idx) => (
                <div key={idx} style={{fontSize:10,color:'var(--tx)',marginBottom:4}}>• {tip}</div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MES PLANTES (placeholder)
// ─────────────────────────────────────────────────────────────
function MyPlants({ gardenData, onSave }) {
  const [plants, setPlants] = React.useState(gardenData?.plants || []);
  
  return (
    <div className="plants-section">
      <div style={{fontFamily:'var(--font-display)',fontWeight:800,fontSize:16,color:'var(--pink)',marginBottom:12}}>
        🌿 Mes Plantes
      </div>
      <div style={{padding:20,textAlign:'center',color:'var(--mu)',fontSize:11}}>
        🚧 Fonctionnalité en développement<br/>
        Bientôt : catalogue de tes plantes avec suivi individuel
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// CALENDRIER (placeholder)
// ─────────────────────────────────────────────────────────────
function GardenCalendar({ gardenData }) {
  return (
    <div className="calendar-section">
      <div style={{fontFamily:'var(--font-display)',fontWeight:800,fontSize:16,color:'var(--blue)',marginBottom:12}}>
        📆 Calendrier
      </div>
      <div style={{padding:20,textAlign:'center',color:'var(--mu)',fontSize:11}}>
        🚧 Fonctionnalité en développement<br/>
        Bientôt : vue calendrier avec toutes les tâches
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MODEL_DEFS (importé depuis config)
// ─────────────────────────────────────────────────────────────
import { MODEL_DEFS } from "../config/models.js";
