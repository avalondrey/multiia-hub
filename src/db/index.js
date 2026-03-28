// IndexedDB Database Layer - Remplace localStorage pour l'historique
// Permet de stocker bien plus que 5MB (jusqu'à 2GB+)

const DB_NAME = 'multiia-hub-db';
const DB_VERSION = 1;

export const db = {
  // Ouvrir la base de données
  async open() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Store conversations
        if (!db.objectStoreNames.contains('conversations')) {
          const convStore = db.createObjectStore('conversations', { keyPath: 'id' });
          convStore.createIndex('updatedAt', 'updatedAt');
          convStore.createIndex('title', 'title');
        }
        
        // Store messages
        if (!db.objectStoreNames.contains('messages')) {
          const msgStore = db.createObjectStore('messages', { keyPath: 'id' });
          msgStore.createIndex('conversationId', 'conversationId');
          msgStore.createIndex('timestamp', 'timestamp');
        }
        
        // Store settings
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
        
        // Store garden data (Greenhouse)
        if (!db.objectStoreNames.contains('garden')) {
          db.createObjectStore('garden', { keyPath: 'id' });
        }
      };
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },
  
  // ========== CONVERSATIONS ==========
  async saveConversation(conversation) {
    const database = await this.open();
    return new Promise((resolve, reject) => {
      const tx = database.transaction('conversations', 'readwrite');
      tx.objectStore('conversations').put(conversation);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject();
    });
  },
  
  async getConversation(id) {
    const database = await this.open();
    return new Promise((resolve, reject) => {
      const tx = database.transaction('conversations', 'readonly');
      const request = tx.objectStore('conversations').get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject();
    });
  },
  
  async getAllConversations() {
    const database = await this.open();
    return new Promise((resolve, reject) => {
      const tx = database.transaction('conversations', 'readonly');
      const request = tx.objectStore('conversations').getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject();
    });
  },
  
  async deleteConversation(id) {
    const database = await this.open();
    return new Promise((resolve, reject) => {
      const tx = database.transaction('conversations', 'readwrite');
      tx.objectStore('conversations').delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject();
    });
  },
  
  async clearConversations() {
    const database = await this.open();
    return new Promise((resolve, reject) => {
      const tx = database.transaction('conversations', 'readwrite');
      tx.objectStore('conversations').clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject();
    });
  },
  
  // ========== MESSAGES ==========
  async saveMessage(message) {
    const database = await this.open();
    return new Promise((resolve, reject) => {
      const tx = database.transaction('messages', 'readwrite');
      tx.objectStore('messages').put(message);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject();
    });
  },
  
  async getMessagesByConversation(conversationId) {
    const database = await this.open();
    return new Promise((resolve, reject) => {
      const tx = database.transaction('messages', 'readonly');
      const index = tx.objectStore('messages').index('conversationId');
      const request = index.getAll(conversationId);
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject();
    });
  },
  
  async deleteMessagesByConversation(conversationId) {
    const database = await this.open();
    return new Promise((resolve, reject) => {
      const tx = database.transaction('messages', 'readwrite');
      const index = tx.objectStore('messages').index('conversationId');
      index.getAllKeys(conversationId).onsuccess = (e) => {
        const keys = e.target.result;
        keys.forEach(key => tx.objectStore('messages').delete(key));
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject();
    });
  },
  
  // ========== SETTINGS ==========
  async saveSetting(key, value) {
    const database = await this.open();
    return new Promise((resolve, reject) => {
      const tx = database.transaction('settings', 'readwrite');
      tx.objectStore('settings').put({ key, value });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject();
    });
  },
  
  async getSetting(key) {
    const database = await this.open();
    return new Promise((resolve, reject) => {
      const tx = database.transaction('settings', 'readonly');
      const request = tx.objectStore('settings').get(key);
      request.onsuccess = () => resolve(request.result?.value);
      request.onerror = () => reject();
    });
  },
  
  // ========== GARDEN (Greenhouse) ==========
  async saveGardenData(id, data) {
    const database = await this.open();
    return new Promise((resolve, reject) => {
      const tx = database.transaction('garden', 'readwrite');
      tx.objectStore('garden').put({ id, ...data, updatedAt: Date.now() });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject();
    });
  },
  
  async getGardenData(id) {
    const database = await this.open();
    return new Promise((resolve, reject) => {
      const tx = database.transaction('garden', 'readonly');
      const request = tx.objectStore('garden').get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject();
    });
  },
  
  async getAllGardenData() {
    const database = await this.open();
    return new Promise((resolve, reject) => {
      const tx = database.transaction('garden', 'readonly');
      const request = tx.objectStore('garden').getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject();
    });
  },
  
  // ========== MIGRATION ==========
  async migrateFromLocalStorage() {
    // Migration des conversations depuis localStorage vers IndexedDB
    const localConvs = localStorage.getItem('multiia_conversations');
    if (localConvs) {
      const conversations = JSON.parse(localConvs);
      for (const conv of conversations) {
        await this.saveConversation(conv);
      }
      console.log('✅ Migration conversations vers IndexedDB:', conversations.length);
    }
    
    const localSettings = localStorage.getItem('multiia_settings');
    if (localSettings) {
      const settings = JSON.parse(localSettings);
      for (const [key, value] of Object.entries(settings)) {
        await this.saveSetting(key, value);
      }
      console.log('✅ Migration settings vers IndexedDB');
    }
  }
};

// Helper pour formater les dates
export const fmtDate = (timestamp) => {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(timestamp));
};
