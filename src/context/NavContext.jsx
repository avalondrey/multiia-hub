import React from 'react';

/**
 * @typedef {Object} NavContextValue
 * @property {string} tab
 * @property {function(string): void} setTab
 * @property {function(string): void} navigateTab
 */

/** @type {import('react').Context<NavContextValue|null>} */
export const NavContext = React.createContext(null);

/**
 * @returns {NavContextValue}
 */
export function useNav() {
  const ctx = React.useContext(NavContext);
  if (!ctx) throw new Error('useNav must be used within NavProvider');
  return ctx;
}
