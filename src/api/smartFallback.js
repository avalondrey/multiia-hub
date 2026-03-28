// Smart Fallback System — Fallback Intelligent entre Providers
// Ordre : Pollinations (gratuit) → WebLLM (offline) → HF (gratuit lent) → Clé user
// + Cache des réponses fréquentes

import { pollinationsTextFetch, checkPollinationsStatus } from "./pollinations.js";
import { MODEL_DEFS } from "../config/models.js";

// Configuration des providers par ordre de priorité
export const FALLBACK_ORDER = [
  'pollinations',    // 1er choix : rapide, gratuit, sans clé
  'webllm',          // 2ème : offline si WebGPU dispo
  'huggingface',     // 3ème : gratuit mais lent
  'user-key'         // Dernier : clé utilisateur configurée
];

// Cache local pour les réponses fréquentes
const RESPONSE_CACHE = new Map();
const CACHE_TTL = 1000 * 60 * 60; // 1 heure

// Vérifier la disponibilité de chaque provider
export const providerStatus = {
  pollinations: { available: true, checked: false, lastCheck: 0 },
  webllm: { available: false, checked: false, lastCheck: 0 },
  huggingface: { available: true, checked: false, lastCheck: 0 },
  'user-key': { available: false, checked: false, lastCheck: 0 }
};

// Vérifier WebLLM (WebGPU)
export function checkWebLLMAvailability() {
  if (!navigator.gpu) {
    providerStatus.webllm.available = false;
    return false;
  }
  
  // Vérifier si la bibliothèque WebLLM est chargée
  if (typeof window.webllm === 'undefined') {
    providerStatus.webllm.available = false;
    return false;
  }
  
  providerStatus.webllm.available = true;
  return true;
}

// Vérifier si l'utilisateur a des clés configurées
export function checkUserKeyAvailability(apiKeys, enabledModels) {
  const hasKey = Object.keys(enabledModels || {}).some(id => {
    const model = MODEL_DEFS[id];
    if (!model) return false;
    if (!model.keyName) return true; // Modèle sans clé (Pollinations, etc.)
    return apiKeys && apiKeys[model.keyName];
  });
  
  providerStatus['user-key'].available = hasKey;
  return hasKey;
}

// Hash simple pour le cache
function hashPrompt(prompt) {
  let hash = 0;
  for (let i = 0; i < prompt.length; i++) {
    const char = prompt.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

// Récupérer du cache
function getCachedResponse(prompt) {
  const hash = hashPrompt(prompt);
  const cached = RESPONSE_CACHE.get(hash);
  
  if (!cached) return null;
  
  if (Date.now() - cached.timestamp > CACHE_TTL) {
    RESPONSE_CACHE.delete(hash);
    return null;
  }
  
  return cached.response;
}

// Mettre en cache
function cacheResponse(prompt, response) {
  const hash = hashPrompt(prompt);
  RESPONSE_CACHE.set(hash, {
    response: response,
    timestamp: Date.now()
  });
  
  // Limiter la taille du cache
  if (RESPONSE_CACHE.size > 100) {
    const firstKey = RESPONSE_CACHE.keys().next().value;
    RESPONSE_CACHE.delete(firstKey);
  }
}

// Fetch depuis Pollinations
async function fetchFromPollinations(prompt, messages, options) {
  const result = await pollinationsTextFetch(messages, {
    model: options.model || 'llama-3.3-70b-instruct',
    maxTokens: options.maxTokens || 2048,
    temperature: options.temperature || 0.7
  });
  
  if (result.success) {
    return {
      ...result,
      provider: 'pollinations',
      providerName: 'Pollinations (Gratuit)'
    };
  }
  
  throw new Error(result.error || 'Pollinations failed');
}

// Fetch depuis WebLLM (offline)
async function fetchFromWebLLM(prompt, messages, options) {
  if (!checkWebLLMAvailability()) {
    throw new Error('WebLLM non disponible (WebGPU requis)');
  }
  
  try {
    // WebLLM doit être initialisé ailleurs
    const engine = window.webLLMEngine;
    if (!engine) {
      throw new Error('WebLLM engine not initialized');
    }
    
    const completion = await engine.chat.completions.create({
      messages: messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 1024
    });
    
    return {
      success: true,
      content: completion.choices?.[0]?.message?.content || '',
      provider: 'webllm',
      providerName: 'WebLLM (Offline)',
      offline: true
    };
  } catch (error) {
    throw new Error(`WebLLM error: ${error.message}`);
  }
}

// Fetch depuis Hugging Face Serverless
async function fetchFromHuggingFace(prompt, messages, options) {
  const model = options.model || 'mistralai/Mixtral-8x7B-Instruct-v0.1';
  
  try {
    const response = await fetch(
      `https://api-inference.huggingface.co/models/${model}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: options.maxTokens || 1024,
            temperature: options.temperature || 0.7
          }
        })
      }
    );
    
    if (!response.ok) {
      throw new Error(`HF API error: ${response.status}`);
    }
    
    const data = await response.json();
    const content = Array.isArray(data) ? data[0]?.generated_text : data?.generated_text || '';
    
    return {
      success: true,
      content: content,
      provider: 'huggingface',
      providerName: 'Hugging Face (Gratuit)'
    };
  } catch (error) {
    throw new Error(`Hugging Face failed: ${error.message}`);
  }
}

// Fetch depuis les clés utilisateur
async function fetchFromUserKey(prompt, messages, options, apiKeys, enabledModels) {
  // Trouver le premier modèle activé avec clé
  const activeModelId = Object.keys(enabledModels || {}).find(id => {
    const model = MODEL_DEFS[id];
    return model && model.keyName && apiKeys && apiKeys[model.keyName];
  });
  
  if (!activeModelId) {
    throw new Error('Aucune clé API configurée');
  }
  
  // Utiliser callModel existant (déjà implémenté dans ai-service.js)
  const { callModel } = await import('./ai-service.js');
  const result = await callModel(activeModelId, messages, apiKeys, options.systemPrompt);
  
  return {
    success: true,
    content: result,
    provider: 'user-key',
    providerName: MODEL_DEFS[activeModelId]?.name || 'Clé Utilisateur'
  };
}

// === FONCTION PRINCIPALE ===
export async function smartFetch(prompt, options = {}, apiKeys = {}, enabledModels = {}) {
  const startTime = Date.now();
  
  // 1. Vérifier le cache
  const cached = getCachedResponse(prompt);
  if (cached) {
    console.log('✅ SmartFallback: Cache hit');
    return {
      ...cached,
      cached: true,
      provider: 'cache',
      providerName: 'Cache',
      responseTime: Date.now() - startTime
    };
  }
  
  // 2. Vérifier les providers disponibles
  checkWebLLMAvailability();
  checkUserKeyAvailability(apiKeys, enabledModels);
  
  // 3. Essayer chaque provider dans l'ordre
  const providers = [
    {
      id: 'pollinations',
      name: 'Pollinations (Gratuit)',
      fetch: () => fetchFromPollinations(prompt, options.messages || [{role: 'user', content: prompt}], options)
    },
    {
      id: 'webllm',
      name: 'WebLLM (Offline)',
      fetch: () => fetchFromWebLLM(prompt, options.messages || [{role: 'user', content: prompt}], options)
    },
    {
      id: 'huggingface',
      name: 'Hugging Face (Gratuit)',
      fetch: () => fetchFromHuggingFace(prompt, options.messages || [{role: 'user', content: prompt}], options)
    },
    {
      id: 'user-key',
      name: 'Clé Utilisateur',
      fetch: () => fetchFromUserKey(prompt, options.messages || [{role: 'user', content: prompt}], options, apiKeys, enabledModels)
    }
  ];
  
  let lastError = null;
  
  for (const provider of providers) {
    // Skip si provider non disponible
    if (!providerStatus[provider.id].available && provider.id !== 'pollinations') {
      console.log(`⏭️ SmartFallback: Skip ${provider.name} (non disponible)`);
      continue;
    }
    
    try {
      console.log(`🔄 SmartFallback: Trying ${provider.name}...`);
      const result = await provider.fetch();
      
      if (result?.success && result?.content) {
        console.log(`✅ SmartFallback: Success with ${provider.name} (${Date.now() - startTime}ms)`);
        
        // Cache la réponse
        cacheResponse(prompt, result);
        
        return {
          ...result,
          responseTime: Date.now() - startTime,
          attempts: providers.indexOf(provider) + 1
        };
      }
    } catch (error) {
      console.warn(`❌ SmartFallback: ${provider.name} failed: ${error.message}`);
      lastError = error;
    }
  }
  
  // Tous les providers ont échoué
  console.error('❌ SmartFallback: All providers failed');
  return {
    success: false,
    error: lastError?.message || 'Aucun provider disponible',
    provider: 'none',
    providerName: 'Échec',
    responseTime: Date.now() - startTime,
    attempts: providers.length
  };
}

// Hook React pour utiliser SmartFallback
export function useSmartFallback(apiKeys, enabledModels) {
  const [currentProvider, setCurrentProvider] = React.useState(null);
  const [providerStats, setProviderStats] = React.useState({
    pollinations: { success: 0, fail: 0 },
    webllm: { success: 0, fail: 0 },
    huggingface: { success: 0, fail: 0 },
    'user-key': { success: 0, fail: 0 }
  });
  
  const smartCall = React.useCallback(async (prompt, options = {}) => {
    const result = await smartFetch(prompt, options, apiKeys, enabledModels);
    
    // Update stats
    if (result.provider && result.provider !== 'cache') {
      setProviderStats(prev => ({
        ...prev,
        [result.provider]: {
          ...prev[result.provider],
          success: result.success ? prev[result.provider].success + 1 : prev[result.provider].success,
          fail: result.success ? prev[result.provider].fail : prev[result.provider].fail + 1
        }
      }));
    }
    
    setCurrentProvider(result.provider);
    return result;
  }, [apiKeys, enabledModels]);
  
  return {
    smartCall,
    currentProvider,
    providerStats,
    providerStatus
  };
}

// Import React (pour le hook)
import React from "react";
