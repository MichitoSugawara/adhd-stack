"use client";

import { useEffect } from "react";

import { applyTheme, readChoice } from "../lib/theme";

export const ThemeBoot = () => {
  useEffect(() => {
    applyTheme(readChoice());
  }, []);
  return null;
};
