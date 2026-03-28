import React from "react";
import { db } from "../db/index.js";
import { callModel } from "../api/ai-service.js";
import { MODEL_DEFS } from "../config/models.js";

// 🌱 MULTI-IA GREENHOUSE — Version Jardinier Réel
// Pour Avalon qui a VRAIMENT une serre et cultive ses plants !

export default function GreenhouseTab({ enabled, apiKeys }) {
  const [activeSection, setActiveSection] = React.useState('overview');
  const [gardenData, setGardenData] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  
  // Charger les données du jardin
  React.useEffect(() => {
    loadGardenData();
  }, []);
  
  const loadGardenData = async () => {
    const data = await db.getGardenData('avalon-garden');
    if (data) setGardenData(data);
  };
  
  const saveGardenData = async (data) => {
    await db.saveGardenData('avalon-garden', data);
    setGardenData(data);
  };
  
  return (
    <div className="greenhouse-wrap" style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
      {/* Header */}
      <div className="greenhouse-hdr" style={{padding:'14px 18px',borderBottom:'1px solid var(--bd)',display:'flex',alignItems:'center',gap:'12px',background:'rgba(5,3,10,.4)',flexShrink:0}}>
        <div style={{fontFamily:'var(--font-display)',fontWeight:900,fontSize:'clamp(16px,3vw,22px)',background:'linear-gradient(135deg,#4ADE80,#10B981)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
          🌱 Ta Serre — Multi-IA Greenhouse
        </div>
        <div style={{fontSize:10,color:'var(--mu)',marginTop:3}}>
          Piloté par l'IA — 100% Gratuit avec Pollinations
        </div>
      </div>
      
      {/* Navigation */}
      <div className="greenhouse-nav" style={{padding:'8px 18px',borderBottom:'1px solid var(--bd)',display:'flex',gap:'6px',flexWrap:'wrap',background:'rgba(5,3,10,.3)',flexShrink:0}}>
        <NavButton 
          active={activeSection === 'overview'} 
          onClick={() => setActiveSection('overview')}
          icon="📊"
          label="Vue d'ensemble"
        />
        <NavButton 
          active={activeSection === 'plants'} 
          onClick={() => setActiveSection('plants')}
          icon="🌿"
          label="Mes Plants"
          badge="NEW"
        />
        <NavButton 
          active={activeSection === 'advisor'} 
          onClick={() => setActiveSection('advisor')}
          icon="🤖"
          label="Conseiller"
        />
        <NavButton 
          active={activeSection === 'diagnostic'} 
          onClick={() => setActiveSection('diagnostic')}
          icon="📸"
          label="Diagnostic Photo"
          badge="NEW"
        />
        <NavButton 
          active={activeSection === 'planning'} 
          onClick={() => setActiveSection('planning')}
          icon="📅"
          label="Planning"
        />
        <NavButton 
          active={activeSection === 'harvest'} 
          onClick={() => setActiveSection('harvest')}
          icon="🧺"
          label="Récoltes"
          badge="NEW"
        />
        <NavButton 
          active={activeSection === 'weather'} 
          onClick={() => setActiveSection('weather')}
          icon="🌤️"
          label="Météo"
        />
      </div>
      
      {/* Content */}
      <div className="greenhouse-body" style={{flex:1,overflow:'auto',padding:'16px'}}>
        {activeSection === 'overview' && <GardenOverview gardenData={gardenData} onChangeSection={setActiveSection} />}
        {activeSection === 'advisor' && <GardenAdvisor apiKeys={apiKeys} enabled={enabled} gardenData={gardenData} onSave={saveGardenData} />}
        {activeSection === 'diagnostic' && <PlantDiagnostic apiKeys={apiKeys} enabled={enabled} />}
        {activeSection === 'planning' && <GardenPlanning apiKeys={apiKeys} enabled={enabled} gardenData={gardenData} onSave={saveGardenData} />}
        {activeSection === 'plants' && <MyPlants apiKeys={apiKeys} enabled={enabled} gardenData={gardenData} onSave={saveGardenData} />}
        {activeSection === 'harvest' && <HarvestLog gardenData={gardenData} onSave={saveGardenData} />}
        {activeSection === 'weather' && <GardenWeather />}
      </div>
    </div>
  );
}

// Bouton de navigation
function NavButton({ active, onClick, icon, label, badge }) {
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
        fontFamily: 'var(--font-mono)',
        position: 'relative'
      }}
    >
      <span style={{fontSize:14}}>{icon}</span>
      <span>{label}</span>
      {badge && (
        <span style={{
          position: 'absolute',
          top: '-4px',
          right: '-4px',
          background: 'linear-gradient(135deg, #FF6B9D, #F59E0B)',
          borderRadius: '10px',
          padding: '2px 5px',
          fontSize: '7px',
          fontWeight: 800,
          color: '#fff',
          fontFamily: 'var(--font-mono)'
        }}>
          {badge}
        </span>
      )}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// VUE D'ENSEMBLE
// ─────────────────────────────────────────────────────────────
function GardenOverview({ gardenData, onChangeSection }) {
  const stats = {
    totalPlants: gardenData?.plants?.length || 0,
    activeTasks: gardenData?.planning?.tasks?.filter(t => t.status === 'pending').length || 0,
    harvests: gardenData?.harvests?.length || 0,
    lastAdvice: gardenData?.lastAdvice?.date ? new Date(gardenData.lastAdvice.date).toLocaleDateString('fr-FR') : 'Jamais'
  };
  
  return (
    <div>
      <div style={{fontFamily:'var(--font-display)',fontWeight:800,fontSize:18,color:'var(--tx)',marginBottom:16}}>
        🌱 Ta Serre — Vue d'ensemble
      </div>
      
      {/* Stats cards */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:12,marginBottom:20}}>
        <StatCard icon="🌿" label="Plants" value={stats.totalPlants} color="#4ADE80" onClick={() => onChangeSection('plants')} />
        <StatCard icon="✅" label="Tâches en cours" value={stats.activeTasks} color="#F59E0B" onClick={() => onChangeSection('planning')} />
        <StatCard icon="🧺" label="Récoltes" value={stats.harvests} color="#EC4899" onClick={() => onChangeSection('harvest')} />
        <StatCard icon="🤖" label="Dernier conseil" value={stats.lastAdvice === 'Jamais' ? '—' : stats.lastAdvice} color="#3B82F6" onClick={() => onChangeSection('advisor')} />
      </div>
      
      {/* Quick actions */}
      <div style={{background:'var(--s1)',border:'1px solid var(--bd)',borderRadius:12,padding:16,marginBottom:16}}>
        <div style={{fontSize:9,color:'var(--mu)',fontWeight:700,marginBottom:12,letterSpacing:1}}>
          ⚡ ACTIONS RAPIDES
        </div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          <QuickAction icon="📸" label="Diagnostiquer une plante" onClick={() => onChangeSection('diagnostic')} />
          <QuickAction icon="💧" label="Arrosage de la semaine" onClick={() => onChangeSection('planning')} />
          <QuickAction icon="🌡️" label="Météo & conseils" onClick={() => onChangeSection('weather')} />
          <QuickAction icon="🧺" label="Noter une récolte" onClick={() => onChangeSection('harvest')} />
        </div>
      </div>
      
      {/* Dernier conseil */}
      {gardenData?.lastAdvice && (
        <div style={{background:'var(--s1)',border:'1px solid var(--green)',borderRadius:12,padding:16}}>
          <div style={{fontSize:9,color:'var(--green)',fontWeight:700,marginBottom:8}}>
            🤖 Dernier conseil de l'IA
          </div>
          <div style={{fontSize:10,color:'var(--mu)',marginBottom:8}}>
            {new Date(gardenData.lastAdvice.date).toLocaleString('fr-FR', {dateStyle:'full',timeStyle:'short'})}
          </div>
          <div style={{fontSize:11,lineHeight:1.7,whiteSpace:'pre-wrap',color:'var(--tx)'}}>
            {gardenData.lastAdvice.advice?.slice(0,300)}...
          </div>
          <button 
            onClick={() => onChangeSection('advisor')}
            style={{marginTop:12,padding:'6px 12px',borderRadius:6,border:'1px solid var(--green)',background:'transparent',color:'var(--green)',fontSize:9,cursor:'pointer',fontFamily:'var(--font-mono)'}}
          >
            Voir tout le conseil →
          </button>
        </div>
      )}
    </div>
  );
}

// Carte de stat
function StatCard({ icon, label, value, color, onClick }) {
  return (
    <div 
      onClick={onClick}
      style={{
        background: 'var(--s1)',
        border: `1px solid ${color}22`,
        borderRadius: 12,
        padding: 16,
        cursor: 'pointer',
        transition: 'all .2s'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.borderColor = `${color}44`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = `${color}22`;
      }}
    >
      <div style={{fontSize:24,marginBottom:8}}>{icon}</div>
      <div style={{fontSize:9,color:'var(--mu)',marginBottom:4}}>{label}</div>
      <div style={{fontSize:20,fontWeight:800,color:color}}>{value}</div>
    </div>
  );
}

// Action rapide
function QuickAction({ icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '8px 14px',
        borderRadius: 8,
        border: '1px solid var(--bd)',
        background: 'var(--s2)',
        color: 'var(--tx)',
        fontSize: 9,
        cursor: 'pointer',
        fontFamily: 'var(--font-mono)',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        transition: 'all .15s'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--ac)';
        e.currentTarget.style.color = '#fff';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'var(--s2)';
        e.currentTarget.style.color = 'var(--tx)';
      }}
    >
      <span style={{fontSize:14}}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// MES PLANTS (NOUVEAU)
// ─────────────────────────────────────────────────────────────
function MyPlants({ apiKeys, enabled, gardenData, onSave }) {
  const [plants, setPlants] = React.useState(gardenData?.plants || []);
  const [newPlant, setNewPlant] = React.useState({name: '', variety: '', plantedDate: '', location: '', notes: ''});
  const [showAddForm, setShowAddForm] = React.useState(false);
  
  const activeIds = Object.keys(MODEL_DEFS).filter(id => enabled[id]);
  const advisorIA = activeIds[0] || 'groq';
  
  const addPlant = async () => {
    if (!newPlant.name) return;
    
    // Demander des conseils à l'IA pour ce plant
    const prompt = `Donne des conseils de culture pour : ${newPlant.name} ${newPlant.variety ? `(${newPlant.variety})` : ''}
    Planté le : ${newPlant.plantedDate || 'à venir'}
    Emplacement : ${newPlant.location || 'serre'}
    
    Format JSON :
    {
      "watering": "conseils arrosage",
      "sunlight": "besoins lumière",
      "temperature": "température idéale",
      "growth_days": "jours avant récolte estimé",
      "companions": ["plantes compagnes"],
      "warnings": ["attention à..."]
    }`;
    
    try {
      const result = await callModel(advisorIA, [{role: 'user', content: prompt}], apiKeys);
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      const careInfo = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
      
      const plant = {
        id: Date.now().toString(),
        ...newPlant,
        careInfo,
        addedDate: Date.now(),
        status: 'growing',
        health: 'good',
        images: []
      };
      
      const updatedPlants = [...plants, plant];
      setPlants(updatedPlants);
      if (onSave) {
        onSave({...gardenData, plants: updatedPlants});
      }
      setNewPlant({name: '', variety: '', plantedDate: '', location: '', notes: ''});
      setShowAddForm(false);
    } catch (e) {
      console.error('Erreur ajout plant:', e);
    }
  };
  
  const deletePlant = (id) => {
    const updatedPlants = plants.filter(p => p.id !== id);
    setPlants(updatedPlants);
    if (onSave) {
      onSave({...gardenData, plants: updatedPlants});
    }
  };
  
  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div style={{fontFamily:'var(--font-display)',fontWeight:800,fontSize:16,color:'var(--green)'}}>
          🌿 Mes Plants
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          style={{
            padding:'8px 16px',
            borderRadius:8,
            border:'none',
            background:'linear-gradient(135deg, #4ADE80, #10B981)',
            color:'#fff',
            fontSize:10,
            fontWeight:700,
            cursor:'pointer'
          }}
        >
          + Ajouter un plant
        </button>
      </div>
      
      {/* Formulaire d'ajout */}
      {showAddForm && (
        <div style={{background:'var(--s1)',border:'1px solid var(--bd)',borderRadius:12,padding:16,marginBottom:16}}>
          <div style={{fontSize:9,color:'var(--mu)',fontWeight:700,marginBottom:12}}>NOUVEAU PLANT</div>
          <div style={{display:'grid',gap:12}}>
            <input
              placeholder="Nom (ex: Tomate)"
              value={newPlant.name}
              onChange={(e) => setNewPlant({...newPlant, name: e.target.value})}
              style={{width:'100%',background:'var(--s2)',border:'1px solid var(--bd)',borderRadius:6,color:'var(--tx)',fontSize:10,padding:'8px 10px'}}
            />
            <input
              placeholder="Variété (ex: Coeur de Boeuf)"
              value={newPlant.variety}
              onChange={(e) => setNewPlant({...newPlant, variety: e.target.value})}
              style={{width:'100%',background:'var(--s2)',border:'1px solid var(--bd)',borderRadius:6,color:'var(--tx)',fontSize:10,padding:'8px 10px'}}
            />
            <input
              type="date"
              value={newPlant.plantedDate}
              onChange={(e) => setNewPlant({...newPlant, plantedDate: e.target.value})}
              style={{width:'100%',background:'var(--s2)',border:'1px solid var(--bd)',borderRadius:6,color:'var(--tx)',fontSize:10,padding:'8px 10px'}}
            />
            <select
              value={newPlant.location}
              onChange={(e) => setNewPlant({...newPlant, location: e.target.value})}
              style={{width:'100%',background:'var(--s2)',border:'1px solid var(--bd)',borderRadius:6,color:'var(--tx)',fontSize:10,padding:'8px 10px'}}
            >
              <option value="">Emplacement</option>
              <option value="serre">🏠 Serre</option>
              <option value="exterieur">☀️ Extérieur</option>
              <option value="balcon">🌆 Balcon</option>
              <option value="interieur">🏡 Intérieur</option>
            </select>
            <textarea
              placeholder="Notes (optionnel)"
              value={newPlant.notes}
              onChange={(e) => setNewPlant({...newPlant, notes: e.target.value})}
              rows={2}
              style={{width:'100%',background:'var(--s2)',border:'1px solid var(--bd)',borderRadius:6,color:'var(--tx)',fontSize:10,padding:'8px 10px',resize:'vertical'}}
            />
            <button onClick={addPlant} style={{padding:'8px',borderRadius:6,border:'none',background:'var(--green)',color:'#fff',fontSize:10,fontWeight:700,cursor:'pointer'}}>
              💾 Enregistrer
            </button>
          </div>
        </div>
      )}
      
      {/* Liste des plants */}
      {plants.length === 0 ? (
        <div style={{padding:40,textAlign:'center',color:'var(--mu)',fontSize:11}}>
          🌱 Aucun plant enregistré pour le moment<br/>
          Clique sur "+ Ajouter un plant" pour commencer
        </div>
      ) : (
        <div style={{display:'grid',gap:12}}>
          {plants.map(plant => (
            <div key={plant.id} style={{
              background:'var(--s1)',
              border:'1px solid var(--bd)',
              borderRadius:12,
              padding:14
            }}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
                <div>
                  <div style={{fontWeight:800,fontSize:12,color:'var(--green)'}}>
                    🌿 {plant.name} {plant.variety && <span style={{color:'var(--mu)',fontWeight:400}}>({plant.variety})</span>}
                  </div>
                  <div style={{fontSize:9,color:'var(--mu)',marginTop:4}}>
                    📍 {plant.location === 'serre' ? '🏠 Serre' : plant.location === 'exterieur' ? '☀️ Extérieur' : plant.location} • 
                    📅 Planté le {plant.plantedDate ? new Date(plant.plantedDate).toLocaleDateString('fr-FR') : 'non planté'}
                  </div>
                </div>
                <button onClick={() => deletePlant(plant.id)} style={{background:'none',border:'none',color:'var(--red)',fontSize:16,cursor:'pointer'}}>✕</button>
              </div>
              
              {/* Infos de culture */}
              {plant.careInfo && (
                <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:8,marginTop:12,padding:10,background:'var(--s2)',borderRadius:6}}>
                  <div style={{fontSize:9}}>
                    <span style={{color:'var(--blue)'}}>💧 Arrosage : </span>
                    {plant.careInfo.watering}
                  </div>
                  <div style={{fontSize:9}}>
                    <span style={{color:'var(--orange)'}}>☀️ Lumière : </span>
                    {plant.careInfo.sunlight}
                  </div>
                  <div style={{fontSize:9}}>
                    <span style={{color:'var(--red)'}}>🌡️ Température : </span>
                    {plant.careInfo.temperature}
                  </div>
                  <div style={{fontSize:9}}>
                    <span style={{color:'var(--green)'}}>📅 Récolte : </span>
                    {plant.careInfo.growth_days} jours
                  </div>
                </div>
              )}
              
              {plant.notes && (
                <div style={{marginTop:8,fontSize:9,color:'var(--mu)',fontStyle:'italic'}}>
                  "{plant.notes}"
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// JOURNAL DES RÉCOLTES (NOUVEAU)
// ─────────────────────────────────────────────────────────────
function HarvestLog({ gardenData, onSave }) {
  const [harvests, setHarvests] = React.useState(gardenData?.harvests || []);
  const [newHarvest, setNewHarvest] = React.useState({plant: '', weight: '', date: new Date().toISOString().split('T')[0], notes: ''});
  const [showAddForm, setShowAddForm] = React.useState(false);
  
  const addHarvest = () => {
    if (!newHarvest.plant) return;
    
    const harvest = {
      id: Date.now().toString(),
      ...newHarvest,
      recordedDate: Date.now()
    };
    
    const updatedHarvests = [harvest, ...harvests];
    setHarvests(updatedHarvests);
    if (onSave) {
      onSave({...gardenData, harvests: updatedHarvests});
    }
    setNewHarvest({plant: '', weight: '', date: new Date().toISOString().split('T')[0], notes: ''});
    setShowAddForm(false);
  };
  
  const totalWeight = harvests.reduce((sum, h) => sum + (parseFloat(h.weight) || 0), 0);
  
  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div style={{fontFamily:'var(--font-display)',fontWeight:800,fontSize:16,color:'var(--pink)'}}>
          🧺 Journal des Récoltes
        </div>
        <div style={{fontSize:10,color:'var(--mu)'}}>
          Total : <strong style={{color:'var(--green)'}}>{totalWeight.toFixed(2)} kg</strong>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          style={{
            padding:'8px 16px',
            borderRadius:8,
            border:'none',
            background:'linear-gradient(135deg, #EC4899, #F59E0B)',
            color:'#fff',
            fontSize:10,
            fontWeight:700,
            cursor:'pointer'
          }}
        >
          + Nouvelle récolte
        </button>
      </div>
      
      {/* Formulaire */}
      {showAddForm && (
        <div style={{background:'var(--s1)',border:'1px solid var(--bd)',borderRadius:12,padding:16,marginBottom:16}}>
          <div style={{fontSize:9,color:'var(--mu)',fontWeight:700,marginBottom:12}}>NOUVELLE RÉCOLTE</div>
          <div style={{display:'grid',gap:12}}>
            <input
              placeholder="Plant récolté (ex: Tomate Coeur de Boeuf)"
              value={newHarvest.plant}
              onChange={(e) => setNewHarvest({...newHarvest, plant: e.target.value})}
              style={{width:'100%',background:'var(--s2)',border:'1px solid var(--bd)',borderRadius:6,color:'var(--tx)',fontSize:10,padding:'8px 10px'}}
            />
            <input
              type="number"
              step="0.01"
              placeholder="Poids (kg)"
              value={newHarvest.weight}
              onChange={(e) => setNewHarvest({...newHarvest, weight: e.target.value})}
              style={{width:'100%',background:'var(--s2)',border:'1px solid var(--bd)',borderRadius:6,color:'var(--tx)',fontSize:10,padding:'8px 10px'}}
            />
            <input
              type="date"
              value={newHarvest.date}
              onChange={(e) => setNewHarvest({...newHarvest, date: e.target.value})}
              style={{width:'100%',background:'var(--s2)',border:'1px solid var(--bd)',borderRadius:6,color:'var(--tx)',fontSize:10,padding:'8px 10px'}}
            />
            <textarea
              placeholder="Notes (qualité, goût, etc.)"
              value={newHarvest.notes}
              onChange={(e) => setNewHarvest({...newHarvest, notes: e.target.value})}
              rows={2}
              style={{width:'100%',background:'var(--s2)',border:'1px solid var(--bd)',borderRadius:6,color:'var(--tx)',fontSize:10,padding:'8px 10px',resize:'vertical'}}
            />
            <button onClick={addHarvest} style={{padding:'8px',borderRadius:6,border:'none',background:'var(--pink)',color:'#fff',fontSize:10,fontWeight:700,cursor:'pointer'}}>
              💾 Enregistrer
            </button>
          </div>
        </div>
      )}
      
      {/* Liste des récoltes */}
      {harvests.length === 0 ? (
        <div style={{padding:40,textAlign:'center',color:'var(--mu)',fontSize:11}}>
          🧺 Aucune récolte enregistrée<br/>
          Note tes premières récoltes !
        </div>
      ) : (
        <div style={{display:'grid',gap:10}}>
          {harvests.map(h => (
            <div key={h.id} style={{
              background:'var(--s1)',
              border:'1px solid var(--pink)22',
              borderRadius:8,
              padding:12,
              display:'flex',
              justifyContent:'space-between',
              alignItems:'center'
            }}>
              <div>
                <div style={{fontWeight:700,fontSize:11,color:'var(--tx)'}}>
                  🧺 {h.plant}
                </div>
                <div style={{fontSize:9,color:'var(--mu)',marginTop:4}}>
                  📅 {new Date(h.date).toLocaleDateString('fr-FR')} • 
                  ⚖️ {h.weight} kg
                  {h.notes && ` • "${h.notes}"`}
                </div>
              </div>
              <div style={{fontSize:12,color:'var(--green)',fontWeight:800}}>
                +{h.weight} kg
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// CONSEILLER (inchangé, utilise Pollinations en priorité)
// ─────────────────────────────────────────────────────────────
function GardenAdvisor({ apiKeys, enabled, gardenData, onSave }) {
  const [climate, setClimate] = React.useState({temp: '', humidity: '', region: '', season: 'Printemps'});
  const [plants, setPlants] = React.useState([]);
  const [advice, setAdvice] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  
  const activeIds = Object.keys(MODEL_DEFS).filter(id => enabled[id]);
  // Utiliser Pollinations en priorité (gratuit !)
  const advisorIA = activeIds.find(id => id.includes('pollinations')) || activeIds[0] || 'groq';
  
  const getAdvice = async () => {
    if (!plants.length) return;
    setLoading(true);
    
    const prompt = `
🌱 CONSEILLER JARDIN EXPERT — Serre de Avalon

Contexte :
- Région : ${climate.region || 'France'}
- Saison : ${climate.season}
- Température : ${climate.temp || 'non spécifiée'}°C
- Humidité : ${climate.humidity || 'non spécifiée'}%
- Plantes : ${plants.join(', ')}

Tu es un jardinier expert avec 30 ans d'expérience. Donne des conseils PRATIQUES et ACTIONNABLES pour :

1. 🚿 ARROSAGE (fréquence, quantité, moment)
2. ✂️ ENTRETIEN (taille, fertilisation, paillage)
3. ⚠️ PROBLÈMES À SURVEILLER (maladies, ravageurs)
4. 📅 TÂCHES DE LA SEMAINE (priorisées)

Sois concret, adapté au climat français, tone encourageant.
    `;
    
    try {
      const result = await callModel(advisorIA, [{role: 'user', content: prompt}], apiKeys);
      setAdvice(result);
      
      if (onSave) {
        onSave({...gardenData, lastAdvice: {date: Date.now(), climate, plants, advice: result}});
      }
    } catch (e) {
      setAdvice('❌ Erreur: ' + e.message);
    }
    
    setLoading(false);
  };
  
  return (
    <div>
      <div style={{fontFamily:'var(--font-display)',fontWeight:800,fontSize:16,color:'var(--blue)',marginBottom:12}}>
        🤖 Conseiller Jardin IA
      </div>
      
      <div style={{background:'var(--s1)',border:'1px solid var(--bd)',borderRadius:12,padding:16,marginBottom:16}}>
        <div style={{fontSize:9,color:'var(--mu)',fontWeight:700,marginBottom:12}}>TON JARDIN</div>
        
        <div style={{marginBottom:12}}>
          <label style={{fontSize:9,color:'var(--mu)',display:'block',marginBottom:6}}>🌿 Tes plantes</label>
          <textarea
            value={plants.join(', ')}
            onChange={(e) => setPlants(e.target.value.split(',').filter(p => p.trim()))}
            placeholder="Tomates, courgettes, basilic, rosiers..."
            rows={2}
            style={{width:'100%',background:'var(--s2)',border:'1px solid var(--bd)',borderRadius:6,color:'var(--tx)',fontSize:10,padding:'8px 10px',resize:'vertical'}}
          />
        </div>
        
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:12}}>
          <input type="number" placeholder="Temp (°C)" value={climate.temp} onChange={(e) => setClimate({...climate, temp: e.target.value})} style={{width:'100%',background:'var(--s2)',border:'1px solid var(--bd)',borderRadius:6,color:'var(--tx)',fontSize:10,padding:'6px 8px'}} />
          <input type="number" placeholder="Humidité (%)" value={climate.humidity} onChange={(e) => setClimate({...climate, humidity: e.target.value})} style={{width:'100%',background:'var(--s2)',border:'1px solid var(--bd)',borderRadius:6,color:'var(--tx)',fontSize:10,padding:'6px 8px'}} />
        </div>
        
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
          <input placeholder="Région" value={climate.region} onChange={(e) => setClimate({...climate, region: e.target.value})} style={{width:'100%',background:'var(--s2)',border:'1px solid var(--bd)',borderRadius:6,color:'var(--tx)',fontSize:10,padding:'6px 8px'}} />
          <select value={climate.season} onChange={(e) => setClimate({...climate, season: e.target.value})} style={{width:'100%',background:'var(--s2)',border:'1px solid var(--bd)',borderRadius:6,color:'var(--tx)',fontSize:10,padding:'6px 8px'}}>
            <option value="Printemps">🌸 Printemps</option>
            <option value="Été">☀️ Été</option>
            <option value="Automne">🍂 Automne</option>
            <option value="Hiver">❄️ Hiver</option>
          </select>
        </div>
        
        <button onClick={getAdvice} disabled={loading || !plants.length} style={{width:'100%',marginTop:12,padding:'10px',borderRadius:8,border:'none',background:loading?'var(--s2)':'linear-gradient(135deg, #4ADE80, #10B981)',color:loading?'var(--mu)':'#fff',fontSize:10,fontWeight:700,cursor:loading?'default':'pointer',fontFamily:'var(--font-mono)'}}>
          {loading ? '⏳ Analyse...' : '🌱 Obtenir mes conseils'}
        </button>
      </div>
      
      {advice && (
        <div style={{background:'var(--s1)',border:'1px solid var(--green)',borderRadius:12,padding:16}}>
          <div style={{fontSize:9,color:'var(--green)',fontWeight:700,marginBottom:8}}>✅ Conseils</div>
          <div style={{fontSize:11,lineHeight:1.7,whiteSpace:'pre-wrap'}}>{advice}</div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// DIAGNOSTIC PHOTO (inchangé)
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
    
    const prompt = `📸 DIAGNOSTIC DE PLANTE

Analyse cette photo de plante de façon EXPERT :

1. 🌿 IDENTIFICATION (nom probable, variété)
2. ⚠️ PROBLÈMES DÉTECTÉS (maladies, ravageurs, carences, stress)
3. 💊 TRAITEMENTS RECOMMANDÉS (solutions naturelles en priorité)
4. 🛡️ PRÉVENTION (comment éviter que ça recommence)

Sois précis, donne des noms scientifiques si possible, conseils actionnables.
    `;
    
    const results = await Promise.all(
      diagnosticIAs.map(async (ia) => {
        try {
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
            return {ia, result: "❌ Cette IA ne supporte pas l'analyse d'images.", error: null};
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
    <div>
      <div style={{fontFamily:'var(--font-display)',fontWeight:800,fontSize:16,color:'var(--cyan)',marginBottom:12}}>
        📸 Diagnostic Photo
      </div>
      
      <div style={{background:'var(--s1)',border:'1px solid var(--bd)',borderRadius:12,padding:16,marginBottom:16}}>
        <label style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'30px',border:'2px dashed var(--bd)',borderRadius:8,cursor:'pointer',background:'var(--s2)'}}>
          <span style={{fontSize:32,marginBottom:8}}>📷</span>
          <span style={{fontSize:10,color:'var(--mu)'}}>{image ? 'Changer la photo' : 'Clique pour uploader une photo'}</span>
          <input type="file" accept="image/*" onChange={handleImageUpload} style={{display:'none'}} />
        </label>
        
        {image && (
          <div style={{marginTop:12,textAlign:'center'}}>
            <img src={image} alt="Plante" style={{maxWidth:'100%',maxHeight:300,borderRadius:8,border:'1px solid var(--bd)'}} />
            <br/>
            <button onClick={diagnose} disabled={loading} style={{marginTop:12,padding:'10px 20px',borderRadius:8,border:'none',background:loading?'var(--s2)':'linear-gradient(135deg, #00D4FF, #0099CC)',color:'#fff',fontSize:10,fontWeight:700,cursor:loading?'default':'pointer'}}>
              {loading ? '⏳ Analyse...' : '🔍 Lancer le diagnostic'}
            </button>
          </div>
        )}
      </div>
      
      {diagnoses.length > 0 && (
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          {diagnoses.map(({ia, result, error}) => {
            const m = MODEL_DEFS[ia];
            return (
              <div key={ia} style={{background:'var(--s1)',border:`1px solid ${error ? 'var(--red)' : m.color}`,borderRadius:12,padding:14}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                  <span style={{fontSize:16}}>{m.icon}</span>
                  <span style={{fontWeight:700,fontSize:11,color:m.color}}>{m.name}</span>
                  {error && <span style={{fontSize:9,color:'var(--red)'}}>❌ {error}</span>}
                </div>
                <div style={{fontSize:10,lineHeight:1.6,whiteSpace:'pre-wrap'}}>{result}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PLANNING (inchangé)
// ─────────────────────────────────────────────────────────────
function GardenPlanning({ apiKeys, enabled, gardenData, onSave }) {
  const [constraints, setConstraints] = React.useState({timeAvailable: '30min/jour', physicalLimits: '', tools: '', goals: ''});
  const [planning, setPlanning] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  
  const activeIds = Object.keys(MODEL_DEFS).filter(id => enabled[id]);
  const plannerIA = activeIds[0] || 'groq';
  
  const generatePlanning = async () => {
    setLoading(true);
    
    const prompt = `📅 GÉNÉRATION DE PLANNING JARDIN

Crée un planning HEBDOMADAIRE d'entretien de jardin personnalisé.

Contraintes :
- Temps disponible : ${constraints.timeAvailable}
- Limitations physiques : ${constraints.physicalLimits || 'Aucune'}
- Outils disponibles : ${constraints.tools || 'Basiques'}
- Objectifs : ${constraints.goals || 'Jardin productif et beau'}

Format JSON :
{
  "weekPlan": [{"day": "Lundi", "tasks": [{"task": "...", "duration": 15, "difficulty": "facile", "priority": "high", "notes": "..."}]}],
  "monthlyTasks": [{"task": "...", "week": 1, "difficulty": "moyen"}],
  "tips": ["Conseil 1", "Conseil 2"]
}

Sois pragmatique, ne surcharge pas.
    `;
    
    try {
      const result = await callModel(plannerIA, [{role: 'user', content: prompt}], apiKeys);
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      const planning = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
      setPlanning(planning);
      
      if (onSave) {
        onSave({...gardenData, planning: {date: Date.now(), constraints, data: planning}});
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
`;
    
    planning.weekPlan?.forEach(day => {
      day.tasks?.forEach(task => {
        const date = new Date();
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
PRIORITY:${task.priority === 'high' ? '1' : '5'}
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
    <div>
      <div style={{fontFamily:'var(--font-display)',fontWeight:800,fontSize:16,color:'var(--orange)',marginBottom:12}}>
        📅 Planning Intelligent
      </div>
      
      <div style={{background:'var(--s1)',border:'1px solid var(--bd)',borderRadius:12,padding:16,marginBottom:16}}>
        <div style={{fontSize:9,color:'var(--mu)',fontWeight:700,marginBottom:12}}>TES CONTRAINTES</div>
        
        <select value={constraints.timeAvailable} onChange={(e) => setConstraints({...constraints, timeAvailable: e.target.value})} style={{width:'100%',background:'var(--s2)',border:'1px solid var(--bd)',borderRadius:6,color:'var(--tx)',fontSize:10,padding:'6px 8px',marginBottom:8}}>
          <option value="15min/jour">15 min/jour</option>
          <option value="30min/jour">30 min/jour</option>
          <option value="45min/jour">45 min/jour</option>
          <option value="1h/jour">1h/jour</option>
          <option value="Week-end uniquement">Week-end uniquement</option>
        </select>
        
        <input placeholder="Limitations physiques (optionnel)" value={constraints.physicalLimits} onChange={(e) => setConstraints({...constraints, physicalLimits: e.target.value})} style={{width:'100%',background:'var(--s2)',border:'1px solid var(--bd)',borderRadius:6,color:'var(--tx)',fontSize:10,padding:'6px 8px',marginBottom:8}} />
        <input placeholder="Outils disponibles" value={constraints.tools} onChange={(e) => setConstraints({...constraints, tools: e.target.value})} style={{width:'100%',background:'var(--s2)',border:'1px solid var(--bd)',borderRadius:6,color:'var(--tx)',fontSize:10,padding:'6px 8px',marginBottom:8}} />
        <input placeholder="Objectifs" value={constraints.goals} onChange={(e) => setConstraints({...constraints, goals: e.target.value})} style={{width:'100%',background:'var(--s2)',border:'1px solid var(--bd)',borderRadius:6,color:'var(--tx)',fontSize:10,padding:'6px 8px',marginBottom:8}} />
        
        <button onClick={generatePlanning} disabled={loading} style={{width:'100%',padding:'10px',borderRadius:8,border:'none',background:loading?'var(--s2)':'linear-gradient(135deg, #F59E0B, #D97706)',color:'#fff',fontSize:10,fontWeight:700,cursor:loading?'default':'pointer'}}>
          {loading ? '⏳ Génération...' : '📅 Générer mon planning'}
        </button>
      </div>
      
      {planning && (
        <>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
            <div style={{fontSize:11,color:'var(--mu)'}}>Planning généré</div>
            <button onClick={exportToCalendar} style={{padding:'6px 12px',borderRadius:6,border:'1px solid var(--green)',background:'rgba(74,222,128,.1)',color:'var(--green)',fontSize:9,cursor:'pointer',fontWeight:600}}>
              📥 Exporter vers Calendar
            </button>
          </div>
          
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {planning.weekPlan?.map((day, idx) => (
              <div key={idx} style={{background:'var(--s1)',border:'1px solid var(--bd)',borderRadius:8,padding:12}}>
                <div style={{fontWeight:700,fontSize:11,color:'var(--ac)',marginBottom:8}}>{day.day}</div>
                {day.tasks?.map((task, tidx) => (
                  <div key={tidx} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 0',borderBottom:tidx < day.tasks.length - 1 ? '1px solid var(--bd)' : 'none'}}>
                    <div style={{width:8,height:8,borderRadius:'50%',background:task.priority === 'high' ? 'var(--red)' : task.priority === 'medium' ? 'var(--orange)' : 'var(--green)'}} />
                    <div style={{flex:1,fontSize:10}}>{task.task}</div>
                    <div style={{fontSize:9,color:'var(--mu)'}}>{task.duration}min</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
          
          {planning.tips && (
            <div style={{background:'rgba(74,222,128,.05)',border:'1px solid rgba(74,222,128,.2)',borderRadius:8,padding:12,marginTop:12}}>
              <div style={{fontWeight:700,fontSize:10,color:'var(--green)',marginBottom:8}}>💡 Conseils</div>
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
// MÉTÉO (SIMPLIFIÉ)
// ─────────────────────────────────────────────────────────────
function GardenWeather() {
  const [weather, setWeather] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  
  const fetchWeather = async () => {
    setLoading(true);
    // Simulation pour l'instant — à connecter à une API météo gratuite (Open-Meteo)
    setTimeout(() => {
      setWeather({
        temp: 18,
        humidity: 65,
        condition: 'Partiellement nuageux',
        forecast: [
          {day: 'Aujourd\'hui', temp: 18, rain: 10},
          {day: 'Demain', temp: 20, rain: 5},
          {day: 'Après-demain', temp: 16, rain: 40}
        ]
      });
      setLoading(false);
    }, 1000);
  };
  
  React.useEffect(() => {
    fetchWeather();
  }, []);
  
  return (
    <div>
      <div style={{fontFamily:'var(--font-display)',fontWeight:800,fontSize:16,color:'var(--blue)',marginBottom:12}}>
        🌤️ Météo du Jardin
      </div>
      
      {loading ? (
        <div style={{padding:40,textAlign:'center',color:'var(--mu)'}}>⏳ Chargement...</div>
      ) : weather ? (
        <>
          <div style={{background:'var(--s1)',border:'1px solid var(--bd)',borderRadius:12,padding:16,marginBottom:16}}>
            <div style={{fontSize:24,fontWeight:800,color:'var(--tx)'}}>{weather.temp}°C</div>
            <div style={{fontSize:10,color:'var(--mu)',marginTop:4}}>{weather.condition} • 💧 {weather.humidity}%</div>
          </div>
          
          <div style={{background:'var(--s1)',border:'1px solid var(--bd)',borderRadius:12,padding:16}}>
            <div style={{fontSize:9,color:'var(--mu)',fontWeight:700,marginBottom:12}}>PRÉVISIONS 3 JOURS</div>
            {weather.forecast.map((day, idx) => (
              <div key={idx} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:idx < weather.forecast.length - 1 ? '1px solid var(--bd)' : 'none'}}>
                <span style={{fontSize:10,color:'var(--tx)'}}>{day.day}</span>
                <span style={{fontSize:10,color:'var(--tx)'}}>{day.temp}°C</span>
                <span style={{fontSize:10,color:day.rain > 30 ? 'var(--blue)' : 'var(--mu)'}}>🌧️ {day.rain}%</span>
              </div>
            ))}
          </div>
          
          <div style={{marginTop:16,padding:12,background:'rgba(59,130,246,.05)',border:'1px solid rgba(59,130,246,.2)',borderRadius:8,fontSize:10,color:'var(--mu)'}}>
            💡 Conseil : {weather.forecast[0].rain > 30 ? 'Pluie prévue, pense à protéger tes plants fragiles !' : 'Temps sec, arrosage nécessaire.'}
          </div>
        </>
      ) : null}
    </div>
  );
}
