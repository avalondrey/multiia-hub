import React from 'react';

/**
 * @typedef {Object} RouterContextValue
 * @property {function(string, object?, function?, function?): Promise<object>} callModel
 * @property {function(string): void} setDebInput
 * @property {function(File): void} setDebFile
 * @property {function(string): void} setComfyPrompt
 * @property {function(string): void} setComfySubTab
 * @property {boolean} comfyConnected
 * @property {function(string, object?, function?): Promise<void>} generateComfy
 * @property {function(string, function?, function?): Promise<any>} processRagText
 * @property {Array} ragChunks
 * @property {function(string): void} setRedInput
 * @property {function(string): void} setRechercheInput
 */

/** @type {import('react').Context<RouterContextValue|null>} */
export const RouterContext = React.createContext(null);

/**
 * @returns {RouterContextValue}
 */
export function useRouter() {
  const ctx = React.useContext(RouterContext);
  if (!ctx) throw new Error('useRouter must be used within RouterProvider');
  return ctx;
}

/**
 * @param {{children: React.ReactNode, value: RouterContextValue}} props
 * @returns {React.ReactElement}
 */
export function RouterProvider({ children, value }) {
  return React.createElement(RouterContext.Provider, { value }, children);
}
