import React from 'react';

/**
 * @typedef {Object} AdvancedContextValue
 * @property {Array<{id:string,label:string,colors:string[],fonts:string[]}>} THEMES
 * @property {string} theme
 * @property {function(string): void} setTheme
 * @property {boolean} streamingEnabled
 * @property {function(boolean): void} setStreamingEnabled
 * @property {Record<string, number>} modelTemps
 * @property {function(string, number): void} setModelTemps
 * @property {Array<{id:string,label:string,apiUrl:string,apiKey:string,model:string}>} customProviders
 * @property {function(Array): void} setCustomProviders
 * @property {string} globalSysPrompt
 * @property {function(string): void} setGlobalSysPrompt
 * @property {function(): void} saveAdvSettings
 * @property {function(): void} setShowOnboarding
 * @property {function(number): void} setOnboardStep
 */

/** @type {import('react').Context<AdvancedContextValue|null>} */
export const AdvancedContext = React.createContext(null);

/**
 * @returns {AdvancedContextValue}
 */
export function useAdvanced() {
  const ctx = React.useContext(AdvancedContext);
  if (!ctx) throw new Error('useAdvanced must be used within AdvancedProvider');
  return ctx;
}

/**
 * @param {{children: React.ReactNode, value: AdvancedContextValue}} props
 * @returns {React.ReactElement}
 */
export function AdvancedProvider({ children, value }) {
  return React.createElement(AdvancedContext.Provider, { value }, children);
}
