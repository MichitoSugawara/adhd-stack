import { Source_Code_Pro, Source_Serif_4 } from "next/font/google";

export const display = Source_Serif_4({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["400", "500", "600", "700"],
});

export const mono = Source_Code_Pro({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600"],
});

export const fontVariables = `${display.variable} ${mono.variable}`;
