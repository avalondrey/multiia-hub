import React from 'react';

/**
 * @typedef {Object} ApiContextValue
 * @property {Record<string, string>} apiKeys
 * @property {function(string, string): void} setApiKeys
 * @property {Record<string, boolean>} enabled
 * @property {function(string, boolean): void} setEnabled
 */

/** @type {import('react').Context<ApiContextValue|null>} */
export const ApiContext = React.createContext(null);

/**
 * @returns {ApiContextValue}
 */
export function useApi() {
  const ctx = React.useContext(ApiContext);
  if (!ctx) throw new Error('useApi must be used within ApiProvider');
  return ctx;
}
