// Pollinations.ai — API 100% Gratuite, Sans Clé, Sans Compte
// https://pollinations.ai
//
// TEXT: https://text.pollinations.ai/openai (POST, compatible OpenAI)
// IMAGE: https://image.pollinations.ai/prompt/{prompt} (GET simple)
// AUDIO: https://pollinations.ai/tts/{text} (GET simple)

import { MODEL_DEFS } from "../config/models.js";

// Modèles Pollinations disponibles
export const POLLINATIONS_MODELS = {
  text: [
    {
      id: 'pollinations-llama',
      name: 'Llama 3.3 70B',
      endpoint: 'https://text.pollinations.ai/openai',
      maxTokens: 4096,
      description: 'Le plus puissant — 70B paramètres'
    },
    {
      id: 'pollinations-mistral',
      name: 'Mistral Nemo',
      endpoint: 'https://text.pollinations.ai/openai',
      maxTokens: 2048,
      description: 'Rapide et efficace'
    },
    {
      id: 'pollinations-codellama',
      name: 'Code Llama',
      endpoint: 'https://text.pollinations.ai/openai',
      maxTokens: 2048,
      description: 'Spécialisé code'
    }
  ],
  image: [
    {
      id: 'pollinations-sdxl',
      name: 'SDXL Turbo',
      endpoint: 'https://image.pollinations.ai/prompt/',
      description: 'Génération rapide, bonne qualité'
    },
    {
      id: 'pollinations-flux',
      name: 'FLUX.1',
      endpoint: 'https://image.pollinations.ai/prompt/',
      description: 'Meilleure qualité, plus lent'
    },
    {
      id: 'pollinations-playground',
      name: 'Playground v2',
      endpoint: 'https://image.pollinations.ai/prompt/',
      description: 'Style artistique'
    }
  ]
};

// Appel API texte (compatible OpenAI)
export async function pollinationsTextFetch(messages, options = {}) {
  const {
    model = 'llama-3.3-70b-instruct',
    maxTokens = 2048,
    temperature = 0.7,
    stream = false
  } = options;
  
  try {
    const response = await fetch('https://text.pollinations.ai/openai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        max_tokens: maxTokens,
        temperature: temperature,
        stream: stream
      })
    });
    
    if (!response.ok) {
      throw new Error(`Pollinations API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return {
      success: true,
      content: data.choices?.[0]?.message?.content || '',
      provider: 'pollinations',
      model: model,
      usage: data.usage
    };
  } catch (error) {
    console.warn('Pollinations text failed:', error.message);
    return {
      success: false,
      error: error.message,
      provider: 'pollinations'
    };
  }
}

// Génération d'image (GET simple)
export function pollinationsImageUrl(prompt, options = {}) {
  const {
    model = 'flux',
    width = 1024,
    height = 1024,
    seed = Math.floor(Math.random() * 1000000),
    nologo = true
  } = options;
  
  const baseUrl = 'https://image.pollinations.ai/prompt/';
  const params = new URLSearchParams({
    width: width.toString(),
    height: height.toString(),
    seed: seed.toString(),
    model: model,
    nologo: nologo ? 'true' : 'false'
  });
  
  return `${baseUrl}${encodeURIComponent(prompt)}?${params.toString()}`;
}

// Appel API image (retourne un Blob)
export async function pollinationsImageFetch(prompt, options = {}) {
  const url = pollinationsImageUrl(prompt, options);
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Pollinations image error: ${response.status}`);
    }
    
    const blob = await response.blob();
    return {
      success: true,
      blob: blob,
      url: url,
      provider: 'pollinations'
    };
  } catch (error) {
    console.warn('Pollinations image failed:', error.message);
    return {
      success: false,
      error: error.message,
      provider: 'pollinations'
    };
  }
}

// Text-to-Speech (gratuit !)
export function pollinationsTTSUrl(text, options = {}) {
  const {
    voice = 'default',
    lang = 'fr'
  } = options;
  
  return `https://pollinations.ai/tts/${encodeURIComponent(text)}?voice=${voice}&lang=${lang}`;
}

// Vérifier si Pollinations est disponible
export async function checkPollinationsStatus() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch('https://text.pollinations.ai/', {
      method: 'GET',
      signal: controller.signal
    });
    
    clearTimeout(timeout);
    return response.ok;
  } catch {
    return false;
  }
}

// Helper pour formater les messages
export function formatPollinationsMessages(userMessage, systemPrompt = null) {
  const messages = [];
  
  if (systemPrompt) {
    messages.push({
      role: 'system',
      content: systemPrompt
    });
  }
  
  messages.push({
    role: 'user',
    content: userMessage
  });
  
  return messages;
}
