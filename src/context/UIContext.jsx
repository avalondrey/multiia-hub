import React from 'react';

/**
 * @typedef {Object} UIContextValue
 * @property {string} theme
 * @property {function(string): void} setTheme
 * @property {number} uiZoom
 * @property {function(number): void} saveZoom
 * @property {{message:string,type:string}|null} toast
 * @property {function(string, string): void} showToast
 */

/** @type {import('react').Context<UIContextValue|null>} */
export const UIContext = React.createContext(null);

/**
 * @returns {UIContextValue}
 */
export function useUI() {
  const ctx = React.useContext(UIContext);
  if (!ctx) throw new Error('useUI must be used within UIProvider');
  return ctx;
}
