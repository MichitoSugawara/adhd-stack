"use client";

import { useEffect, useState } from "react";

const TICK_MS = 15_000;

export const useBoardNow = (): number => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, TICK_MS);
    return () => {
      window.clearInterval(timer);
    };
  }, []);
  return now;
};
