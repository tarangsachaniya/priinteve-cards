"use client";

import { useEffect, useRef } from "react";

/**
 * Fires `onSave` ~600ms after the last change to `value`, skipping the
 * initial mount. Used for text-entry fields in the builder so keystrokes
 * don't each trigger a network request.
 */
export function useDebouncedAutosave<T>(value: T, onSave: (value: T) => void, delayMs = 600) {
  const isFirstRun = useRef(true);
  const savedRef = useRef(onSave);
  savedRef.current = onSave;

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    const timer = setTimeout(() => savedRef.current(value), delayMs);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, delayMs]);
}
