import { defineConfig } from "oxfmt";
import ultracite from "ultracite/oxfmt";

export default defineConfig({
  ...ultracite,
  ignorePatterns: [
    ...ultracite.ignorePatterns,
    ".cursor/skills/**",
    "design-system/**",
    "design_handoff/**",
    "apps/web/app/beautifui/**",
    "apps/web/components/primitives/**",
  ],
});
