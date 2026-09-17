import { Geist_Mono, Inter, Noto_Sans_JP } from "next/font/google";

export const sans = Inter({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-inter",
});

export const jpSans = Noto_Sans_JP({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-noto-sans-jp",
});

export const mono = Geist_Mono({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-mono-face",
});

export const fontVariables = `${sans.variable} ${jpSans.variable} ${mono.variable}`;
