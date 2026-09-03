"use client";

import { useEffect } from "react";

export const useVisualViewport = (): void => {
  useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      const viewport = window.visualViewport;
      const height = viewport?.height ?? window.innerHeight;
      const offsetTop = viewport?.offsetTop ?? 0;
      const bottomGap = Math.max(0, window.innerHeight - height - offsetTop);
      root.style.setProperty("--vvh", `${Math.round(height)}px`);
      root.style.setProperty("--vv-bottom", `${Math.round(bottomGap)}px`);
    };
    apply();
    window.visualViewport?.addEventListener("resize", apply);
    window.visualViewport?.addEventListener("scroll", apply);
    window.addEventListener("resize", apply);
    return () => {
      window.visualViewport?.removeEventListener("resize", apply);
      window.visualViewport?.removeEventListener("scroll", apply);
      window.removeEventListener("resize", apply);
    };
  }, []);
};
