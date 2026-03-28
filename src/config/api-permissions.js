// Audit des permissions API - Transparence sur ce que chaque clé peut faire

export const API_PERMISSIONS = {
  openai: {
    id: 'openai',
    name: 'OpenAI',
    icon: '🟢',
    color: '#10A37F',
    permissions: [
      {type: 'ok', text: 'Génération de texte (GPT-4, GPT-4o, GPT-3.5)'},
      {type: 'ok', text: 'Génération d\'images (DALL-E 3)'},
      {type: 'ok', text: 'Transcription audio (Whisper)'},
      {type: 'warn', text: 'Accès à tes données de conversation'},
      {type: 'ok', text: 'Vision (analyse d\'images)'},
      {type: 'error', text: 'N\'a PAS accès à tes autres clés API'}
    ],
    pricing: '$0.01-0.06 / 1K tokens (GPT-4)',
    freeTier: 'Non (essai gratuit $5)',
    url: 'https://platform.openai.com/api-keys',
    docs: 'https://platform.openai.com/docs',
    limits: '3 RPM (gratuit) → 500+ RPM (payant)'
  },
  
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic (Claude)',
    icon: '🟣',
    color: '#D4A853',
    permissions: [
      {type: 'ok', text: 'Génération de texte (Claude 3.5/3 Sonnet, Opus, Haiku)'},
      {type: 'ok', text: 'Analyse de documents (PDF, TXT)'},
      {type: 'ok', text: 'Vision (analyse d\'images)'},
      {type: 'warn', text: 'Accès à tes conversations'},
      {type: 'error', text: 'N\'a PAS accès à tes autres clés API'}
    ],
    pricing: '$0.003-0.015 / 1K tokens (Claude 3.5 Sonnet)',
    freeTier: 'Oui (limité)',
    url: 'https://console.anthropic.com/settings/keys',
    docs: 'https://docs.anthropic.com',
    limits: '20-40 requests/min selon le modèle'
  },
  
  google: {
    id: 'google',
    name: 'Google (Gemini)',
    icon: '🔵',
    color: '#4285F4',
    permissions: [
      {type: 'ok', text: 'Génération de texte (Gemini Pro, Ultra)'},
      {type: 'ok', text: 'Vision (analyse d\'images)'},
      {type: 'ok', text: 'Accès à Google Search (optionnel)'},
      {type: 'warn', text: 'Accès à tes conversations'},
      {type: 'error', text: 'N\'a PAS accès à tes autres clés API'}
    ],
    pricing: 'Gratuit jusqu\'à 60 RPM, puis $0.00025 / 1K tokens',
    freeTier: 'Oui (généreux)',
    url: 'https://makersuite.google.com/app/apikey',
    docs: 'https://ai.google.dev/docs',
    limits: '60 RPM gratuit → illimité payant'
  },
  
  mistral: {
    id: 'mistral',
    name: 'Mistral AI',
    icon: '🟠',
    color: '#FF7000',
    permissions: [
      {type: 'ok', text: 'Génération de texte (Mistral Large, Medium, Small)'},
      {type: 'ok', text: 'Embeddings'},
      {type: 'warn', text: 'Accès à tes conversations'},
      {type: 'error', text: 'N\'a PAS accès à tes autres clés API'}
    ],
    pricing: '€0.004-0.012 / 1K tokens',
    freeTier: 'Oui (30 jours, €5 offerts)',
    url: 'https://console.mistral.ai/api-keys/',
    docs: 'https://docs.mistral.ai',
    limits: 'Variable selon le modèle'
  },
  
  groq: {
    id: 'groq',
    name: 'Groq',
    icon: '⚡',
    color: '#F59E0B',
    permissions: [
      {type: 'ok', text: 'Génération de texte (Llama 3.3 70B, Mixtral, Gemma)'},
      {type: 'ok', text: 'Vitesse extrême (100+ tokens/sec)'},
      {type: 'warn', text: 'Accès à tes conversations'},
      {type: 'error', text: 'N\'a PAS accès à tes autres clés API'}
    ],
    pricing: 'Gratuit (limité) → $0.0004-0.001 / 1K tokens',
    freeTier: 'Oui (excellent !)',
    url: 'https://console.groq.com/keys',
    docs: 'https://console.groq.com/docs',
    limits: '30 RPM gratuit → 500+ RPM payant'
  },
  
  cohere: {
    id: 'cohere',
    name: 'Cohere',
    icon: '🔷',
    color: '#3B82F6',
    permissions: [
      {type: 'ok', text: 'Génération de texte (Command R+)'},
      {type: 'ok', text: 'Embeddings'},
      {type: 'ok', text: 'Rerank'},
      {type: 'warn', text: 'Accès à tes conversations'},
      {type: 'error', text: 'N\'a PAS accès à tes autres clés API'}
    ],
    pricing: 'Gratuit (5/min) → $0.0015 / 1K tokens',
    freeTier: 'Oui (limité)',
    url: 'https://dashboard.cohere.com/api-keys',
    docs: 'https://docs.cohere.com',
    limits: '5 RPM gratuit'
  },
  
  cerebras: {
    id: 'cerebras',
    name: 'Cerebras',
    icon: '🧠',
    color: '#DC2626',
    permissions: [
      {type: 'ok', text: 'Génération de texte (Llama 3.1 8B/70B)'},
      {type: 'ok', text: 'Vitesse (inference sur wafer-scale)'},
      {type: 'warn', text: 'Accès à tes conversations'},
      {type: 'error', text: 'N\'a PAS accès à tes autres clés API'}
    ],
    pricing: 'Gratuit (bêta)',
    freeTier: 'Oui (totalement gratuit en bêta)',
    url: 'https://cloud.cerebras.ai/',
    docs: 'https://docs.cerebras.ai',
    limits: 'Variable'
  },
  
  sambanova: {
    id: 'sambanova',
    name: 'SambaNova',
    icon: '🔶',
    color: '#EA580C',
    permissions: [
      {type: 'ok', text: 'Génération de texte (Llama 3.1 405B, 70B)'},
      {type: 'ok', text: 'Modèles très larges (405B params)'},
      {type: 'warn', text: 'Accès à tes conversations'},
      {type: 'error', text: 'N\'a PAS accès à tes autres clés API'}
    ],
    pricing: 'Gratuit (bêta)',
    freeTier: 'Oui (accès gratuit en bêta)',
    url: 'https://cloud.sambanova.ai/',
    docs: 'https://docs.sambanova.ai',
    limits: 'Variable'
  },
  
  pollinations: {
    id: 'pollinations',
    name: 'Pollinations',
    icon: '🌸',
    color: '#EC4899',
    permissions: [
      {type: 'ok', text: 'Génération d\'images (SDXL, Flux)'},
      {type: 'ok', text: 'Génération de texte'},
      {type: 'ok', text: 'Totalement gratuit, sans clé'},
      {type: 'ok', text: 'Aucune donnée stockée'}
    ],
    pricing: '100% Gratuit',
    freeTier: 'Oui (totalement)',
    url: 'https://pollinations.ai',
    docs: 'https://github.com/pollinations/pollinations',
    limits: 'Rate limiting généreux'
  }
};

// Composant React pour afficher l'audit
export function APIAuditCard({ providerId }) {
  const provider = API_PERMISSIONS[providerId];
  if (!provider) return null;
  
  return (
    <div style={{
      background: 'var(--s1)',
      border: `1px solid ${provider.color}33`,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginBottom: 12,
        paddingBottom: 12,
        borderBottom: '1px solid var(--bd)'
      }}>
        <span style={{fontSize: 20}}>{provider.icon}</span>
        <div style={{flex: 1}}>
          <div style={{
            fontWeight: 800,
            fontSize: 12,
            color: provider.color
          }}>
            {provider.name}
          </div>
          <div style={{fontSize: 9, color: 'var(--mu)'}}>
            {provider.pricing}
          </div>
        </div>
        <a
          href={provider.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            padding: '4px 10px',
            borderRadius: 6,
            border: '1px solid var(--bd)',
            background: 'transparent',
            color: 'var(--ac)',
            fontSize: 9,
            textDecoration: 'none',
            fontFamily: 'var(--font-mono)'
          }}
        >
          Gérer la clé ↗
        </a>
      </div>
      
      {/* Permissions */}
      <div style={{display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12}}>
        {provider.permissions.map((perm, idx) => (
          <div key={idx} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 9,
            color: perm.type === 'ok' ? 'var(--green)' : 
                   perm.type === 'warn' ? 'var(--orange)' : 
                   perm.type === 'error' ? 'var(--red)' : 'var(--mu)'
          }}>
            <span>
              {perm.type === 'ok' ? '✅' : 
               perm.type === 'warn' ? '⚠️' : 
               perm.type === 'error' ? '❌' : 'ℹ️'}
            </span>
            <span>{perm.text}</span>
          </div>
        ))}
      </div>
      
      {/* Footer */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 8,
        paddingTop: 12,
        borderTop: '1px solid var(--bd)',
        fontSize: 9
      }}>
        <div>
          <span style={{color: 'var(--mu)'}}>Free Tier : </span>
          <span style={{color: provider.freeTier.includes('Oui') ? 'var(--green)' : 'var(--orange)'}}>
            {provider.freeTier}
          </span>
        </div>
        <div>
          <span style={{color: 'var(--mu)'}}>Limits : </span>
          <span style={{color: 'var(--tx)'}}>{provider.limits}</span>
        </div>
      </div>
    </div>
  );
}

// Helper pour obtenir les infos d'un provider
export function getProviderInfo(id) {
  return API_PERMISSIONS[id] || null;
}

// Helper pour obtenir tous les providers
export function getAllProviders() {
  return Object.values(API_PERMISSIONS);
}
