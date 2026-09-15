import { Geist_Mono, Inter } from "next/font/google";

export const sans = Inter({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-inter",
});

export const mono = Geist_Mono({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-mono-face",
});

export const fontVariables = `${sans.variable} ${mono.variable}`;
