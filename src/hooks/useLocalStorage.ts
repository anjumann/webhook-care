import { useCallback } from 'react';

/**
 * Hook to manage localStorage with error handling.
 * @param key The localStorage key to manage
 */
export function useLocalStorage<T = any>(key: string) {
  // Get value from localStorage
  const get = useCallback((): T | null => {
    try {
      const item = window.localStorage.getItem(key);
      if (item === null) return null;
      return JSON.parse(item) as T;
    } catch (error) {
      console.error(`Error getting localStorage key "${key}":`, error);
      return null;
    }
  }, [key]);

  // Set value in localStorage
  const set = useCallback((value: T) => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key]);

  // Remove value from localStorage
  const remove = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key]);

  return { get, set, remove };
} 