"use client";

import { useState, useEffect } from "react";

function useLocalStorageState<T>(
  key: string,
  defaultValue: T
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    if (typeof window === "undefined") return defaultValue;

    try {
      const stored = localStorage.getItem(key);
      return stored ? (JSON.parse(stored) as T) : defaultValue;
    } catch (e) {
      console.warn(`useLocalStorageState: failed to parse ${key}`, e);
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (e) {
      console.warn(`useLocalStorageState: failed to store ${key}`, e);
    }
  }, [key, state]);

  return [state, setState];
}

export default useLocalStorageState;
