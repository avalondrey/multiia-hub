// Chiffrement AES-GCM avec Web Crypto API
// Protège les clés API et données sensibles dans localStorage

const CRYPTO_KEY_NAME = 'multiia-crypto-master-key-v1';

export const crypto = {
  // Générer une clé maîtresse
  async generateMasterKey() {
    return await window.crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256
      },
      true, // extractable
      ['encrypt', 'decrypt']
    );
  },
  
  // Exporter la clé pour stockage
  async exportKey(key) {
    const raw = await window.crypto.subtle.exportKey('raw', key);
    return btoa(String.fromCharCode(...new Uint8Array(raw)));
  },
  
  // Importer la clé depuis le stockage
  async importKey(base64Key) {
    const binary = atob(base64Key);
    const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
    
    return await window.crypto.subtle.importKey(
      'raw',
      bytes,
      { name: 'AES-GCM' },
      true,
      ['encrypt', 'decrypt']
    );
  },
  
  // Obtenir ou créer la clé maîtresse
  async getMasterKey() {
    let stored = localStorage.getItem(CRYPTO_KEY_NAME);
    
    if (!stored) {
      // Générer nouvelle clé
      const key = await this.generateMasterKey();
      stored = await this.exportKey(key);
      localStorage.setItem(CRYPTO_KEY_NAME, stored);
      console.log('🔐 Nouvelle clé maîtresse générée');
    }
    
    return await this.importKey(stored);
  },
  
  // Chiffrer un texte
  async encrypt(text) {
    if (!text) return '';
    
    const key = await this.getMasterKey();
    const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV
    const encoded = new TextEncoder().encode(text);
    
    const encrypted = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      encoded
    );
    
    // Combiner IV + données chiffrées
    const result = new Uint8Array(iv.length + encrypted.byteLength);
    result.set(iv, 0);
    result.set(new Uint8Array(encrypted), iv.length);
    
    // Retourner en base64
    return btoa(String.fromCharCode(...result));
  },
  
  // Déchiffrer un texte
  async decrypt(encryptedText) {
    if (!encryptedText) return '';
    
    try {
      const key = await this.getMasterKey();
      const data = Uint8Array.from(atob(encryptedText), c => c.charCodeAt(0));
      
      // Extraire IV et données
      const iv = data.slice(0, 12);
      const encrypted = data.slice(12);
      
      const decrypted = await window.crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        key,
        encrypted
      );
      
      return new TextDecoder().decode(decrypted);
    } catch (error) {
      console.error('❌ Erreur déchiffrement:', error);
      return '';
    }
  },
  
  // Chiffrer un objet
  async encryptObject(obj) {
    const json = JSON.stringify(obj);
    return await this.encrypt(json);
  },
  
  // Déchiffrer un objet
  async decryptObject(encryptedText) {
    const json = await this.decrypt(encryptedText);
    return json ? JSON.parse(json) : null;
  },
  
  // Hacher un texte (SHA-256)
  async hash(text) {
    const encoded = new TextEncoder().encode(text);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', encoded);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  },
  
  // Générer un ID unique sécurisé
  async generateId() {
    const array = new Uint8Array(16);
    window.crypto.getRandomValues(array);
    return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
  },
  
  // Vérifier l'intégrité d'un message
  async sign(message, secret) {
    const key = await window.crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await window.crypto.subtle.sign(
      'HMAC',
      key,
      new TextEncoder().encode(message)
    );
    
    return btoa(String.fromCharCode(...new Uint8Array(signature)));
  },
  
  // Vérifier une signature
  async verify(message, signature, secret) {
    try {
      const key = await window.crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['verify']
      );
      
      const signatureBuffer = Uint8Array.from(atob(signature), c => c.charCodeAt(0));
      
      const valid = await window.crypto.subtle.verify(
        'HMAC',
        key,
        signatureBuffer,
        new TextEncoder().encode(message)
      );
      
      return valid;
    } catch {
      return false;
    }
  }
};

// Wrapper pour sauvegarder des clés API chiffrées
export const secureStorage = {
  async set(key, value) {
    const encrypted = await crypto.encrypt(value);
    localStorage.setItem(`enc_${key}`, encrypted);
  },
  
  async get(key) {
    const encrypted = localStorage.getItem(`enc_${key}`);
    if (!encrypted) return null;
    return await crypto.decrypt(encrypted);
  },
  
  async setObject(key, obj) {
    const encrypted = await crypto.encryptObject(obj);
    localStorage.setItem(`enc_${key}`, encrypted);
  },
  
  async getObject(key) {
    const encrypted = localStorage.getItem(`enc_${key}`);
    if (!encrypted) return null;
    return await crypto.decryptObject(encrypted);
  },
  
  remove(key) {
    localStorage.removeItem(`enc_${key}`);
  },
  
  clear() {
    Object.keys(localStorage)
      .filter(k => k.startsWith('enc_'))
      .forEach(k => localStorage.removeItem(k));
  }
};
