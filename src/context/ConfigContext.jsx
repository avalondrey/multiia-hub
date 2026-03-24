import React from 'react';

/**
 * @typedef {Object} ConfigContextValue
 * @property {Record<string, string>} cfgDrafts
 * @property {function(Record<string, string>): void} setCfgDrafts
 * @property {function(string, string?): void} saveCfgKey
 * @property {function(): void} exportKeys
 * @property {function(): void} importKeys
 * @property {React.RefObject<HTMLInputElement>} fileRef
 * @property {object} pwaPrompt
 * @property {boolean} pwaInstalled
 * @property {function(): void} installPwa
 */

/**
 * @param {{children: React.ReactNode, value: ConfigContextValue}} props
 * @returns {React.ReactElement}
 */
export function ConfigProvider({ children, value }) {
  return React.createElement(ConfigContext.Provider, { value }, children);
}

/** @type {import('react').Context<ConfigContextValue|null>} */
export const ConfigContext = React.createContext(null);

/**
 * @returns {ConfigContextValue}
 */
export function useConfig() {
  const ctx = React.useContext(ConfigContext);
  if (!ctx) throw new Error('useConfig must be used within ConfigProvider');
  return ctx;
}
