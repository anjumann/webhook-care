import { useCallback, useState } from 'react';

export type UseBooleanReturn = {
  value: boolean;
  setTrue: () => void;
  setFalse: () => void;
  toggle: () => void;
  set: (val: boolean) => void;
};

export function useBoolean(initialValue = false): UseBooleanReturn {
  const [value, setValue] = useState<boolean>(initialValue);

  const setTrue = useCallback(() => setValue(true), []);
  const setFalse = useCallback(() => setValue(false), []);
  const toggle = useCallback(() => setValue((v) => !v), []);
  const set = useCallback((val: boolean) => setValue(val), []);

  return { value, setTrue, setFalse, toggle, set };
} 