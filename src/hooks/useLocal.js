import { useEffect, useState } from "react";
export function useLocal(key, start) {
  const [val, setVal] = useState(() => {
    const got = localStorage.getItem(key);
    if (got === null || got === undefined) return start;
    try {
      return JSON.parse(got);
    } catch {
      return got;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch {
      localStorage.setItem(key, String(val));
    }
  }, [key, val]);
  return [val, setVal];
}
