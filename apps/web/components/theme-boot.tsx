"use client";

import { useEffect } from "react";

import { applyTheme, readTheme } from "../lib/theme";

export const ThemeBoot = () => {
  useEffect(() => {
    applyTheme(readTheme());
  }, []);
  return null;
};
