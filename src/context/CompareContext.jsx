import React from 'react';

/**
 * @typedef {Object} CompareContextValue
 * @property {Array} voteHistory
 * @property {function(Array): void} setVoteHistory
 * @property {function(string): void} setDiffIA1
 * @property {function(string): void} setDiffIA2
 * @property {function(boolean): void} setDiffModal
 * @property {function(any): void} setBestVote
 * @property {function(boolean): void} setShowVoteDetail
 */

/** @type {import('react').Context<CompareContextValue|null>} */
export const CompareContext = React.createContext(null);

/**
 * @returns {CompareContextValue}
 */
export function useCompare() {
  const ctx = React.useContext(CompareContext);
  if (!ctx) throw new Error('useCompare must be used within CompareProvider');
  return ctx;
}

/**
 * @param {{children: React.ReactNode, value: CompareContextValue}} props
 * @returns {React.ReactElement}
 */
export function CompareProvider({ children, value }) {
  return React.createElement(CompareContext.Provider, { value }, children);
}
