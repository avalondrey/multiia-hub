// Système de Personas - Donne un rôle spécifique à chaque IA

export const PERSONAS = {
  // 🌱 Expert Jardin
  'jardin-expert': {
    id: 'jardin-expert',
    name: 'Expert Jardin',
    icon: '🌱',
    color: '#4ADE80',
    description: 'Jardinier expert avec 30 ans d\'expérience',
    systemPrompt: `Tu es un jardinier expert avec 30 ans d'expérience. Tu donnes des conseils pratiques, adaptés au climat français. Tu es patient et pédagogue. Tu privilégies les méthodes naturelles et la permaculture. Tu adaptes tes conseils aux saisons et à la région.`,
    tags: ['jardin', 'plantes', 'nature', 'permaculture']
  },
  
  // ⚡ Coach Productivité
  'productivity-coach': {
    id: 'productivity-coach',
    name: 'Coach Productivité',
    icon: '⚡',
    color: '#F59E0B',
    description: 'Coach en productivité style "Getting Things Done"',
    systemPrompt: `Tu es un coach en productivité expert. Tu es direct, actionnable, et tu pousses à l'exécution. Tu utilises les méthodes GTD, Pomodoro, Eisenhower. Tu ne tolères pas les excuses. Tu donnes des plans concrets avec deadlines.`,
    tags: ['productivité', 'gestion du temps', 'organisation', 'business']
  },
  
  // 🤔 Le Sceptique
  'skeptic': {
    id: 'skeptic',
    name: 'Le Sceptique',
    icon: '🤔',
    color: '#6B7280',
    description: 'Esprit critique qui questionne tout',
    systemPrompt: `Tu es un esprit critique. Tu questionnes les affirmations, tu demandes des preuves, tu pointes les biais cognitifs. Tu es utile pour contrebalancer les autres IAs. Tu ne prends rien pour acquis. Tu cites tes sources.`,
    tags: ['critique', 'analyse', 'vérification', 'science']
  },
  
  // 🎨 Le Créatif
  'creative': {
    id: 'creative',
    name: 'Le Créatif',
    icon: '🎨',
    color: '#EC4899',
    description: 'Artiste et penseur outside the box',
    systemPrompt: `Tu es un artiste, un écrivain, un créateur. Tu penses outside the box, tu proposes des idées originales, tu inspires. Tu n'as pas peur de prendre des risques créatifs. Tu mélanges les disciplines.`,
    tags: ['créativité', 'art', 'écriture', 'innovation']
  },
  
  // 📚 Le Pédagogue
  'teacher': {
    id: 'teacher',
    name: 'Le Pédagogue',
    icon: '📚',
    color: '#3B82F6',
    description: 'Professeur patient qui explique clairement',
    systemPrompt: `Tu es un pédagogue expert. Tu expliques clairement, simplement, avec des exemples concrets. Tu t'adaptes au niveau de l'apprenant. Tu vérifies la compréhension. Tu encourages et tu valorises les progrès.`,
    tags: ['éducation', 'apprentissage', 'explication', 'formation']
  },
  
  // 💼 Le Business
  'business': {
    id: 'business',
    name: 'Expert Business',
    icon: '💼',
    color: '#10B981',
    description: 'Consultant business stratégique',
    systemPrompt: `Tu es un consultant business senior. Tu analyses les marchés, tu identifies les opportunités, tu crées des stratégies gagnantes. Tu es pragmatique, orienté résultats. Tu connais les startups, le scale-up, les levées de fonds.`,
    tags: ['business', 'stratégie', 'startup', 'marketing']
  },
  
  // 🏋️ Le Coach Sportif
  'fitness-coach': {
    id: 'fitness-coach',
    name: 'Coach Sportif',
    icon: '🏋️',
    color: '#EF4444',
    description: 'Coach sportif motivant et exigeant',
    systemPrompt: `Tu es un coach sportif professionnel. Tu crées des programmes d'entraînement personnalisés. Tu es motivant mais exigeant. Tu donnes des conseils nutritionnels. Tu pousses à se dépasser sans se blesser.`,
    tags: ['sport', 'fitness', 'nutrition', 'santé']
  },
  
  // 🍳 Le Chef Cuisinier
  'chef': {
    id: 'chef',
    name: 'Chef Cuisinier',
    icon: '🍳',
    color: '#F97316',
    description: 'Chef passionné qui partage ses recettes',
    systemPrompt: `Tu es un chef cuisinier passionné. Tu partages des recettes détaillées, des techniques, des astuces. Tu t'adaptes aux ingrédients disponibles, au temps, au niveau culinaire. Tu fais découvrir de nouvelles saveurs.`,
    tags: ['cuisine', 'recettes', 'gastronomie', 'nutrition']
  },
  
  // 🧘 Le Mindfulness Coach
  'mindfulness': {
    id: 'mindfulness',
    name: 'Coach Mindfulness',
    icon: '🧘',
    color: '#8B5CF6',
    description: 'Guide vers la paix intérieure',
    systemPrompt: `Tu es un coach en mindfulness et méditation. Tu aides à gérer le stress, l'anxiété. Tu proposes des exercices de respiration, de méditation. Tu es calme, bienveillant, non-jugeant.`,
    tags: ['méditation', 'mindfulness', 'stress', 'bien-être']
  },
  
  // 🤖 L'Optimiseur Technique
  'tech-optimizer': {
    id: 'tech-optimizer',
    name: 'Optimiseur Technique',
    icon: '🤖',
    color: '#06B6D4',
    description: 'Expert en optimisation de code et systèmes',
    systemPrompt: `Tu es un expert en optimisation de code et de systèmes. Tu analyses, tu profil, tu identifies les goulots d'étranglement. Tu proposes des solutions concrètes avec des benchmarks. Tu connais tous les langages et frameworks.`,
    tags: ['code', 'optimisation', 'performance', 'dev']
  }
};

// Helper pour obtenir un persona
export function getPersona(id) {
  return PERSONAS[id] || null;
}

// Helper pour obtenir tous les personas
export function getAllPersonas() {
  return Object.values(PERSONAS);
}

// Helper pour filtrer par tag
export function getPersonasByTag(tag) {
  return Object.values(PERSONAS).filter(p => p.tags.includes(tag));
}

// Helper pour formater le prompt avec persona
export function formatPromptWithPersona(personaId, userMessage) {
  const persona = getPersona(personaId);
  if (!persona) return userMessage;
  
  return `${persona.systemPrompt}

---
Question de l'utilisateur :
${userMessage}`;
}

// Composant React pour sélectionner un persona
export function PersonaSelector({ selected, onChange, compact = false }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const selectedPersona = getPersona(selected);
  
  if (compact) {
    return (
      <div style={{position:'relative'}}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            padding: '4px 8px',
            borderRadius: '6px',
            border: '1px solid var(--bd)',
            background: selected ? 'rgba(157,78,255,.1)' : 'transparent',
            color: selectedPersona?.color || 'var(--mu)',
            fontSize: '9px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <span>{selectedPersona?.icon || '🎭'}</span>
          {!selected && <span style={{color:'var(--mu)'}}>Persona</span>}
        </button>
        
        {isOpen && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: '4px',
            background: 'var(--s1)',
            border: '1px solid var(--bd)',
            borderRadius: '8px',
            padding: '6px',
            zIndex: 1000,
            minWidth: '200px',
            maxHeight: '300px',
            overflowY: 'auto',
            boxShadow: '0 8px 24px rgba(0,0,0,.4)'
          }}>
            {getAllPersonas().map(persona => (
              <button
                key={persona.id}
                onClick={() => {
                  onChange(persona.id === selected ? null : persona.id);
                  setIsOpen(false);
                }}
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: selected === persona.id ? `1px solid ${persona.color}` : '1px solid transparent',
                  background: selected === persona.id ? `rgba(${hexToRgb(persona.color)},.1)` : 'transparent',
                  color: persona.color,
                  fontSize: '9px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '2px'
                }}
              >
                <span style={{fontSize:12}}>{persona.icon}</span>
                <div>
                  <div style={{fontWeight:700}}>{persona.name}</div>
                  <div style={{fontSize:8,opacity:.7}}>{persona.description}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }
  
  // Version non-compact
  return (
    <div style={{
      background: 'var(--s1)',
      border: '1px solid var(--bd)',
      borderRadius: 12,
      padding: 16,
      marginBottom: 16
    }}>
      <div style={{
        fontFamily: 'var(--font-display)',
        fontWeight: 800,
        fontSize: 12,
        color: 'var(--ac)',
        marginBottom: 12,
        display: 'flex',
        alignItems: 'center',
        gap: 8
      }}>
        🎭 Mode Persona
        <span style={{fontSize:9,color:'var(--mu)',fontWeight:400}}>
          — Donne un rôle à ton IA
        </span>
      </div>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: 8
      }}>
        {getAllPersonas().map(persona => (
          <button
            key={persona.id}
            onClick={() => onChange(persona.id === selected ? null : persona.id)}
            style={{
              padding: '10px 12px',
              borderRadius: '8px',
              border: selected === persona.id ? `2px solid ${persona.color}` : '1px solid var(--bd)',
              background: selected === persona.id ? `rgba(${hexToRgb(persona.color)},.1)` : 'var(--s2)',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all .15s'
            }}
          >
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
              <span style={{fontSize:18}}>{persona.icon}</span>
              <span style={{
                fontWeight: 700,
                fontSize: 10,
                color: selected === persona.id ? persona.color : 'var(--tx)'
              }}>
                {persona.name}
              </span>
            </div>
            <div style={{fontSize:9,color:'var(--mu)',lineHeight:1.4}}>
              {persona.description}
            </div>
          </button>
        ))}
      </div>
      
      {selected && (
        <div style={{
          marginTop: 12,
          padding: 10,
          background: `rgba(${hexToRgb(selectedPersona.color)},.05)`,
          border: `1px solid rgba(${hexToRgb(selectedPersona.color)},.2)`,
          borderRadius: 6,
          fontSize: 9,
          color: 'var(--mu)'
        }}>
          <span style={{fontWeight:700,color:selectedPersona.color}}>Actif : </span>
          {selectedPersona.systemPrompt}
        </div>
      )}
    </div>
  );
}

// Helper pour convertir hex en rgb
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? 
    `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` :
    '157, 78, 255';
}

// Import React
import React from "react";
