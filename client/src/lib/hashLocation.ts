/**
 * Custom hash location hook for wouter
 *
 * This hook enables hash-based routing for wouter, supporting URLs like:
 * https://example.com/#/atividades?token=xxx
 *
 * The path is extracted from the hash (e.g., "/atividades")
 * Query params in the hash are preserved but not used for routing.
 */

import { useSyncExternalStore, useCallback } from 'react';

// Extract path from hash, handling query params
function getHashPath(): string {
  const hash = window.location.hash || '#/';
  // Remove the leading #
  const hashContent = hash.slice(1);
  // Get path before any query params
  const queryIndex = hashContent.indexOf('?');
  const path = queryIndex === -1 ? hashContent : hashContent.slice(0, queryIndex);
  // Ensure path starts with /
  return path.startsWith('/') ? path : '/' + path;
}

// Subscribe to hash changes
function subscribeToHashChange(callback: () => void): () => void {
  window.addEventListener('hashchange', callback);
  return () => window.removeEventListener('hashchange', callback);
}

// Get current hash path (for SSR compatibility)
function getHashPathSnapshot(): string {
  return typeof window !== 'undefined' ? getHashPath() : '/';
}

/**
 * Hook for wouter that uses hash-based routing
 * Usage: <Router hook={useHashLocation}>...</Router>
 */
export function useHashLocation(): [string, (to: string, options?: { replace?: boolean }) => void] {
  const path = useSyncExternalStore(
    subscribeToHashChange,
    getHashPathSnapshot,
    () => '/' // Server snapshot
  );

  const navigate = useCallback((to: string, options?: { replace?: boolean }) => {
    // Preserve query params from current hash if navigating to same base path
    const currentHash = window.location.hash;
    const currentQueryIndex = currentHash.indexOf('?');
    const currentQuery = currentQueryIndex !== -1 ? currentHash.slice(currentQueryIndex) : '';

    // Build new hash
    const newHash = '#' + (to.startsWith('/') ? to : '/' + to);

    // If the new path doesn't have query params, preserve current ones
    const hasNewQuery = to.includes('?');
    const finalHash = hasNewQuery ? newHash : newHash + currentQuery;

    if (options?.replace) {
      window.history.replaceState(null, '', finalHash);
    } else {
      window.history.pushState(null, '', finalHash);
    }

    // Dispatch hashchange event for subscribers
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  }, []);

  return [path, navigate];
}

export default useHashLocation;
