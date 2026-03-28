import React from "react";

// Système de badges "NEW" pour mettre en avant les nouvelles fonctionnalités
// S'affiche pendant 7 jours après la première visite

const NEW_FEATURES = [
  {
    id: 'greenhouse',
    name: '🌱 Greenhouse',
    description: 'Ton jardin intelligent piloté par l\'IA',
    icon: '🌱',
    color: '#4ADE80',
    tab: 'greenhouse'
  },
  {
    id: 'personas',
    name: '🎭 Mode Persona',
    description: 'Donne un rôle à tes IAs',
    icon: '🎭',
    color: '#EC4899',
    tab: null // Feature globale
  },
  {
    id: 'heatmap',
    name: '📊 Heatmap Confiance',
    description: 'Visualise les consensus entre IAs',
    icon: '📊',
    color: '#F59E0B',
    tab: null
  },
  {
    id: 'encryption',
    name: '🔐 Clés chiffrées',
    description: 'Protection AES-GCM 256-bit',
    icon: '🔐',
    color: '#3B82F6',
    tab: 'config'
  },
  {
    id: 'indexeddb',
    name: '💾 IndexedDB',
    description: 'Historique illimité (2GB+)',
    icon: '💾',
    color: '#10B981',
    tab: null
  }
];

// Vérifier si une feature est "nouvelle" (moins de 7 jours)
export function isNewFeature(featureId) {
  const firstVisit = localStorage.getItem('multiia_first_visit');
  if (!firstVisit) return true;
  
  const daysSinceFirstVisit = (Date.now() - parseInt(firstVisit)) / (1000 * 60 * 60 * 24);
  return daysSinceFirstVisit <= 7;
}

// Initialiser la date de première visite
export function initFirstVisit() {
  if (!localStorage.getItem('multiia_first_visit')) {
    localStorage.setItem('multiia_first_visit', Date.now().toString());
  }
}

// Composant Badge NEW
export function NewBadge({ small = false }) {
  if (!isNewFeature('all')) return null;
  
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: small ? '2px 6px' : '4px 10px',
      background: 'linear-gradient(135deg, #FF6B9D, #F59E0B)',
      borderRadius: small ? '4px' : '6px',
      fontSize: small ? '7px' : '9px',
      fontWeight: 800,
      color: '#fff',
      fontFamily: 'var(--font-mono)',
      letterSpacing: '0.5px',
      animation: 'pulse 2s infinite',
      boxShadow: '0 0 10px rgba(255,107,157,.4)'
    }}>
      NEW
    </span>
  );
}

// Composant pour wrapper un onglet avec badge
export function withNewBadge(WrappedComponent, featureId) {
  return function WithNewBadge(props) {
    const showBadge = isNewFeature(featureId);
    
    return (
      <div style={{position: 'relative', display: 'inline-block'}}>
        <WrappedComponent {...props} />
        {showBadge && (
          <NewBadge small />
        )}
      </div>
    );
  };
}

// Modal de bienvenue pour les nouvelles features
export function NewFeaturesModal({ onClose }) {
  const [isVisible, setIsVisible] = React.useState(false);
  
  React.useEffect(() => {
    const hasSeenModal = localStorage.getItem('multiia_seen_new_features_modal');
    const firstVisit = localStorage.getItem('multiia_first_visit');
    
    // Afficher si première visite OU si moins de 7 jours
    if (!hasSeenModal || !firstVisit) {
      setIsVisible(true);
      initFirstVisit();
    }
  }, []);
  
  const handleClose = () => {
    localStorage.setItem('multiia_seen_new_features_modal', 'true');
    setIsVisible(false);
    if (onClose) onClose();
  };
  
  if (!isVisible) return null;
  
  return (
    <div className="new-features-modal" style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,.85)',
      backdropFilter: 'blur(8px)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, rgba(10,7,20,.98), rgba(20,10,40,.98))',
        border: '1px solid rgba(157,78,255,.28)',
        borderRadius: '20px',
        padding: '32px',
        maxWidth: '600px',
        width: '100%',
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: '0 50px 120px rgba(0,0,0,.65), 0 0 50px rgba(157,78,255,.15)',
        animation: 'modalIn .25s cubic-bezier(.4,0,.2,1) both'
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '24px'
        }}>
          <div style={{
            fontSize: '32px',
            marginBottom: '8px'
          }}>🎉</div>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 900,
            fontSize: 'clamp(20px, 4vw, 28px)',
            background: 'linear-gradient(135deg, #FF6B9D, #F59E0B, #4ADE80)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '8px'
          }}>
            NOUVELLES FONCTIONNALITÉS
          </h2>
          <p style={{
            fontSize: '11px',
            color: 'var(--mu)',
            fontFamily: 'var(--font-mono)'
          }}>
            v22.0 — Découvre ce qui change dans Multi-IA Hub
          </p>
        </div>
        
        {/* Features list */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          marginBottom: '24px'
        }}>
          {NEW_FEATURES.map(feature => (
            <div key={feature.id} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px',
              background: 'rgba(157,78,255,.05)',
              border: `1px solid ${feature.color}22`,
              borderRadius: '12px',
              transition: 'all .2s'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '10px',
                background: `${feature.color}11`,
                border: `1px solid ${feature.color}33`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                flexShrink: 0
              }}>
                {feature.icon}
              </div>
              <div style={{flex: 1}}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '4px'
                }}>
                  <span style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 800,
                    fontSize: '12px',
                    color: feature.color
                  }}>
                    {feature.name}
                  </span>
                  <NewBadge small />
                </div>
                <div style={{
                  fontSize: '9px',
                  color: 'var(--mu)',
                  lineHeight: '1.4'
                }}>
                  {feature.description}
                </div>
              </div>
              {feature.tab && (
                <button
                  onClick={() => {
                    handleClose();
                    // Navigation vers l'onglet
                    if (window.navigateToTab) {
                      window.navigateToTab(feature.tab);
                    }
                  }}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: `1px solid ${feature.color}`,
                    background: 'transparent',
                    color: feature.color,
                    fontSize: '9px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-mono)'
                  }}
                >
                  Essayer →
                </button>
              )}
            </div>
          ))}
        </div>
        
        {/* Footer */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          alignItems: 'center'
        }}>
          <button
            onClick={handleClose}
            style={{
              width: '100%',
              padding: '12px 20px',
              borderRadius: '10px',
              border: 'none',
              background: 'linear-gradient(135deg, #FF6B9D, #F59E0B)',
              color: '#fff',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)',
              boxShadow: '0 0 20px rgba(255,107,157,.3)'
            }}
          >
            ✨ C'est parti !
          </button>
          <div style={{
            fontSize: '8px',
            color: 'var(--mu)',
            fontFamily: 'var(--font-mono)',
            textAlign: 'center'
          }}>
            💡 Astuce : Tu peux retrouver ces features dans les onglets correspondants
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook pour gérer l'affichage du modal
export function useNewFeaturesModal() {
  const [showModal, setShowModal] = React.useState(false);
  
  React.useEffect(() => {
    const hasSeenModal = localStorage.getItem('multiia_seen_new_features_modal');
    if (!hasSeenModal) {
      setShowModal(true);
      initFirstVisit();
    }
  }, []);
  
  const dismiss = () => {
    localStorage.setItem('multiia_seen_new_features_modal', 'true');
    setShowModal(false);
  };
  
  return { showModal, dismiss, setShowModal };
}

// Composant pour afficher un tooltip "NEW" au survol
export function NewTooltip({ children, featureId }) {
  const [isHovered, setIsHovered] = React.useState(false);
  const showBadge = isNewFeature(featureId);
  
  if (!showBadge) return children;
  
  return (
    <div
      style={{position: 'relative', display: 'inline-block'}}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
      {isHovered && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginTop: '8px',
          padding: '8px 12px',
          background: 'rgba(10,7,20,.97)',
          border: '1px solid rgba(157,78,255,.28)',
          borderRadius: '8px',
          fontSize: '9px',
          fontWeight: 600,
          color: 'var(--tx)',
          whiteSpace: 'nowrap',
          zIndex: 1000,
          boxShadow: '0 8px 24px rgba(0,0,0,.4)',
          fontFamily: 'var(--font-ui)'
        }}>
          ✨ Nouvelle fonctionnalité !
        </div>
      )}
    </div>
  );
}

// Helper pour reset (debug)
export function resetNewFeatures() {
  localStorage.removeItem('multiia_first_visit');
  localStorage.removeItem('multiia_seen_new_features_modal');
  window.location.reload();
}
