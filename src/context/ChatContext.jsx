import React from 'react';

/**
 * @typedef {Object} ChatContextValue
 * @property {Record<string, Array<{role:string,text:string,time:number}>>} conversations
 * @property {function(string, Array<{role:string,text:string,time:number}>): void} setConversations
 * @property {string} chatInput
 * @property {function(string): void} setChatInput
 */

/** @type {import('react').Context<ChatContextValue|null>} */
export const ChatContext = React.createContext(null);

/**
 * @returns {ChatContextValue}
 */
export function useChat() {
  const ctx = React.useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
}
