// WebLLM — IA 100% dans le Navigateur (Offline après cache)
// https://webllm.mlc.ai/
// Nécessite WebGPU (Chrome/Edge récent)

// Modèles disponibles
export const WEBLLM_MODELS = [
  {
    id: 'Llama-3-8B-Instruct-q4f32_1-MLC',
    name: 'Llama 3 8B Instruct',
    size: '4.2 GB',
    description: 'Rapide, bon pour chat général',
    license: 'Open'
  },
  {
    id: 'Mistral-7B-Instruct-v0.3-q4f32_1-MLC',
    name: 'Mistral 7B Instruct',
    size: '4.1 GB',
    description: 'Excellent en français',
    license: 'Apache 2.0'
  },
  {
    id: 'Phi-3-mini-4k-instruct-q4f32_1-MLC',
    name: 'Phi-3 Mini',
    size: '2.5 GB',
    description: 'Le plus léger, Microsoft',
    license: 'MIT'
  },
  {
    id: 'Qwen2-7B-Instruct-q4f32_1-MLC',
    name: 'Qwen2 7B Instruct',
    size: '4.5 GB',
    description: 'Bon pour code et maths',
    license: 'Apache 2.0'
  },
  {
    id: 'Gemma-2-2B-it-q4f32_1-MLC',
    name: 'Gemma 2 2B',
    size: '1.6 GB',
    description: 'Très léger, Google',
    license: 'Gemma'
  }
];

// Initialiser le moteur WebLLM
export async function initWebLLMEngine(modelId, progressCallback = null) {
  // Vérifier WebGPU
  if (!navigator.gpu) {
    throw new Error('WebGPU non supporté. Utilise Chrome/Edge récent.');
  }
  
  // Vérifier si webllm est chargé
  if (typeof window.webllm === 'undefined') {
    // Charger dynamiquement
    await loadWebLLMLibrary();
  }
  
  const initProgressCallback = (progress) => {
    console.log('WebLLM Progress:', progress);
    if (progressCallback) {
      progressCallback(progress);
    }
  };
  
  try {
    const engine = await window.webllm.CreateMLCEngine(modelId, {
      initProgressCallback: initProgressCallback
    });
    
    return { success: true, engine };
  } catch (error) {
    console.error('WebLLM init error:', error);
    return { success: false, error: error.message };
  }
}

// Charger la bibliothèque WebLLM dynamiquement
async function loadWebLLMLibrary() {
  return new Promise((resolve, reject) => {
    if (window.webllm) {
      resolve();
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2.78/dist/index.min.js';
    script.onload = () => {
      console.log('WebLLM library loaded');
      resolve();
    };
    script.onerror = () => {
      reject(new Error('Failed to load WebLLM library'));
    };
    document.head.appendChild(script);
  });
}

// Appel chat avec WebLLM
export async function webLLMChat(engine, messages, options = {}) {
  if (!engine) {
    throw new Error('WebLLM engine not initialized');
  }
  
  try {
    const completion = await engine.chat.completions.create({
      messages: messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 1024,
      stream: options.stream || false
    });
    
    if (options.stream) {
      // Streaming
      const chunks = [];
      for await (const chunk of completion) {
        chunks.push(chunk.choices?.[0]?.delta?.content || '');
      }
      return {
        success: true,
        content: chunks.join(''),
        provider: 'webllm',
        offline: true
      };
    } else {
      // Non-streaming
      return {
        success: true,
        content: completion.choices?.[0]?.message?.content || '',
        provider: 'webllm',
        offline: true
      };
    }
  } catch (error) {
    console.error('WebLLM chat error:', error);
    return {
      success: false,
      error: error.message,
      provider: 'webllm'
    };
  }
}

// Streaming chat avec callback
export async function webLLMChatStream(engine, messages, options = {}, onChunk) {
  if (!engine || !onChunk) {
    throw new Error('Engine and onChunk callback required');
  }
  
  try {
    const completion = await engine.chat.completions.create({
      messages: messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 1024,
      stream: true
    });
    
    let fullContent = '';
    
    for await (const chunk of completion) {
      const content = chunk.choices?.[0]?.delta?.content || '';
      if (content) {
        fullContent += content;
        onChunk(content, fullContent);
      }
    }
    
    return {
      success: true,
      content: fullContent,
      provider: 'webllm',
      offline: true
    };
  } catch (error) {
    console.error('WebLLM stream error:', error);
    return {
      success: false,
      error: error.message,
      provider: 'webllm'
    };
  }
}

// Vérifier si WebGPU est disponible
export function isWebGPUAvailable() {
  return !!navigator.gpu;
}

// Obtenir les infos WebGPU
export function getWebGPUInfo() {
  if (!navigator.gpu) {
    return { available: false };
  }
  
  return {
    available: true,
    adapter: navigator.gpu.requestAdapter ? 'Supporté' : 'Non supporté'
  };
}

// Nettoyer le cache WebLLM
export async function clearWebLLMCache() {
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    const webllmCaches = cacheNames.filter(name => name.includes('webllm') || name.includes('mlc'));
    
    await Promise.all(webllmCaches.map(name => caches.delete(name)));
    console.log('WebLLM cache cleared');
  }
}

// Hook React pour WebLLM
export function useWebLLM(modelId, progressCallback) {
  const [engine, setEngine] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [progress, setProgress] = React.useState(null);
  
  const initEngine = React.useCallback(async () => {
    if (!isWebGPUAvailable()) {
      setError('WebGPU non supporté');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    const result = await initWebLLMEngine(modelId, (prog) => {
      setProgress(prog);
      if (progressCallback) progressCallback(prog);
    });
    
    if (result.success) {
      setEngine(result.engine);
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  }, [modelId, progressCallback]);
  
  const chat = React.useCallback(async (messages, options = {}) => {
    if (!engine) {
      throw new Error('Engine not initialized');
    }
    return await webLLMChat(engine, messages, options);
  }, [engine]);
  
  const chatStream = React.useCallback(async (messages, options = {}, onChunk) => {
    if (!engine) {
      throw new Error('Engine not initialized');
    }
    return await webLLMChatStream(engine, messages, options, onChunk);
  }, [engine]);
  
  const reset = React.useCallback(() => {
    setEngine(null);
    setError(null);
    setProgress(null);
  }, []);
  
  return {
    engine,
    loading,
    error,
    progress,
    initEngine,
    chat,
    chatStream,
    reset,
    isWebGPUAvailable: isWebGPUAvailable()
  };
}

// Import React
import React from "react";
