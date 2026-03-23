import React from 'react';

/**
 * @typedef {Object} ModelContextValue
 * @property {Record<string, {icon:string,short:string,name:string,desc:string,border:string,bg:string,color:string,keyName:string,url:string,free:boolean,keyLink:string,provider:string}>} MODEL_DEFS
 * @property {string[]} IDS
 * @property {function(string): boolean} isLimited
 * @property {function(string): string} fmtCd
 */

/** @type {import('react').Context<ModelContextValue|null>} */
export const ModelContext = React.createContext(null);

/**
 * @returns {ModelContextValue}
 */
export function useModels() {
  const ctx = React.useContext(ModelContext);
  if (!ctx) throw new Error('useModels must be used within ModelProvider');
  return ctx;
}
