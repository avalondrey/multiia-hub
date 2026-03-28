import React from "react";

// Heatmap de Confiance - Visualisation des consensus/divergences entre IAs
export function ConfidenceHeatmap({ responses }) {
  if (!responses || responses.length < 2) return null;
  
  // Calculer la similarité entre les réponses
  const similarities = computeSimilarities(responses);
  
  return (
    <div className="confidence-heatmap" style={{
      background: 'var(--s1)',
      border: '1px solid var(--bd)',
      borderRadius: 12,
      padding: 16,
      marginTop: 16
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
        📊 Heatmap de Confiance
        <span style={{fontSize:9,color:'var(--mu)',fontWeight:400}}>
          — Zones de consensus entre les IAs
        </span>
      </div>
      
      {/* Barre de légende */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
        fontSize: 9,
        color: 'var(--mu)'
      }}>
        <span>Fort désaccord</span>
        <div style={{
          flex: 1,
          height: 6,
          borderRadius: 3,
          background: 'linear-gradient(90deg, #FF4D6A 0%, #FFB700 50%, #4ADE80 100%)'
        }} />
        <span>Fort accord</span>
      </div>
      
      {/* Grille de similarité */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${responses.length + 1}, 1fr)`,
        gap: 4,
        marginBottom: 12
      }}>
        {/* Header row */}
        <div />
        {responses.map((r, i) => {
          const m = MODEL_DEFS[r.ia];
          return (
            <div key={i} style={{
              fontSize: 9,
              fontWeight: 700,
              color: m?.color || 'var(--mu)',
              textAlign: 'center'
            }}>
              {m?.icon || '🤖'}
            </div>
          );
        })}
        
        {/* Rows */}
        {responses.map((r1, i) => {
          const m = MODEL_DEFS[r1.ia];
          return (
            <React.Fragment key={i}>
              <div style={{
                fontSize: 9,
                fontWeight: 700,
                color: m?.color || 'var(--mu)',
                display: 'flex',
                alignItems: 'center'
              }}>
                {m?.icon || '🤖'}
              </div>
              {responses.map((r2, j) => {
                if (i === j) {
                  return (
                    <div key={j} style={{
                      background: 'var(--s2)',
                      borderRadius: 4,
                      height: 32,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 9,
                      color: 'var(--mu)'
                    }}>
                      100%
                    </div>
                  );
                }
                const sim = similarities[`${i}-${j}`] || similarities[`${j}-${i}`] || 0;
                const color = getSimilarityColor(sim);
                return (
                  <div key={j} style={{
                    background: color,
                    borderRadius: 4,
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 9,
                    fontWeight: 700,
                    color: sim > 0.5 ? '#fff' : 'var(--tx)'
                  }}>
                    {Math.round(sim * 100)}%
                  </div>
                );
              })}
            </React.Fragment>
          );
        })}
      </div>
      
      {/* Stats globales */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 8,
        paddingTop: 12,
        borderTop: '1px solid var(--bd)'
      }}>
        <StatBox
          label="Consensus moyen"
          value={`${Math.round(averageSimilarity(similarities) * 100)}%`}
          color={getSimilarityColor(averageSimilarity(similarities))}
        />
        <StatBox
          label="Plus fort accord"
          value={`${Math.round(maxSimilarity(similarities) * 100)}%`}
          color={getSimilarityColor(maxSimilarity(similarities))}
        />
        <StatBox
          label="Plus fort désaccord"
          value={`${Math.round(minSimilarity(similarities) * 100)}%`}
          color={getSimilarityColor(minSimilarity(similarities))}
        />
      </div>
      
      {/* Analyse textuelle */}
      <div style={{
        marginTop: 12,
        padding: 12,
        background: 'rgba(157,78,255,.05)',
        border: '1px solid rgba(157,78,255,.15)',
        borderRadius: 8,
        fontSize: 10,
        color: 'var(--mu)'
      }}>
        <div style={{fontWeight:700,color:'var(--ac)',marginBottom:6,fontSize:9}}>
          🔍 Analyse
        </div>
        {generateAnalysis(similarities, responses)}
      </div>
    </div>
  );
}

// Calculer les similarités entre toutes les paires
function computeSimilarities(responses) {
  const similarities = {};
  
  for (let i = 0; i < responses.length; i++) {
    for (let j = i + 1; j < responses.length; j++) {
      const sim = jaccardSimilarity(responses[i].content, responses[j].content);
      similarities[`${i}-${j}`] = sim;
    }
  }
  
  return similarities;
}

// Similarité de Jaccard (overlap de mots)
function jaccardSimilarity(text1, text2) {
  const words1 = new Set(text1.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  const words2 = new Set(text2.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  
  if (words1.size === 0 || words2.size === 0) return 0;
  
  const intersection = [...words1].filter(w => words2.has(w)).length;
  const union = new Set([...words1, ...words2]).size;
  
  return intersection / union;
}

// Couleur basée sur la similarité
function getSimilarityColor(sim) {
  if (sim >= 0.7) return '#4ADE80'; // Vert
  if (sim >= 0.5) return '#A3E635'; // Vert clair
  if (sim >= 0.3) return '#FBBF24'; // Jaune
  if (sim >= 0.1) return '#FB923C'; // Orange
  return '#FF4D6A'; // Rouge
}

// Moyenne des similarités
function averageSimilarity(similarities) {
  const values = Object.values(similarities);
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

// Max
function maxSimilarity(similarities) {
  const values = Object.values(similarities);
  return values.length ? Math.max(...values) : 0;
}

// Min
function minSimilarity(similarities) {
  const values = Object.values(similarities);
  return values.length ? Math.min(...values) : 1;
}

// Générer une analyse textuelle
function generateAnalysis(similarities, responses) {
  const avg = averageSimilarity(similarities);
  const max = maxSimilarity(similarities);
  const min = minSimilarity(similarities);
  
  let analysis = '';
  
  if (avg > 0.7) {
    analysis = '✅ **Fort consensus** : Les IAs sont globalement d\'accord sur le sujet. Tu peux avoir confiance dans les réponses.';
  } else if (avg > 0.5) {
    analysis = '🟡 **Consensus modéré** : Les IAs s\'accordent sur les points principaux mais divergent sur certains détails.';
  } else if (avg > 0.3) {
    analysis = '⚠️ **Divergences notables** : Les IAs ont des approches différentes. Compare attentivement les réponses.';
  } else {
    analysis = '❌ **Fort désaccord** : Les IAs sont en désaccord majeur. Le sujet est probablement complexe ou controversé.';
  }
  
  if (max > 0.8) {
    analysis += '\n\n💡 **Point d\'accord** : Au moins deux IAs sont très alignées → ce point est probablement fiable.';
  }
  
  if (min < 0.2) {
    analysis += '\n\n⚠️ **Point de friction** : Certaines IAs sont en fort désaccord → vérifie ces affirmations.';
  }
  
  return <div style={{whiteSpace:'pre-wrap'}}>{analysis}</div>;
}

// Petit box de stat
function StatBox({ label, value, color }) {
  return (
    <div style={{
      background: 'var(--s2)',
      borderRadius: 6,
      padding: 8,
      textAlign: 'center'
    }}>
      <div style={{fontSize:8,color:'var(--mu)',marginBottom:4}}>{label}</div>
      <div style={{
        fontSize:14,
        fontWeight:800,
        color: color,
        background: color,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent'
      }}>
        {value}
      </div>
    </div>
  );
}

// Import MODEL_DEFS
import { MODEL_DEFS } from "../config/models.js";
