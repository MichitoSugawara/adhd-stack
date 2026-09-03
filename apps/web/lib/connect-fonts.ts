import { IBM_Plex_Mono, IBM_Plex_Sans, IBM_Plex_Serif } from "next/font/google";

export const connectDisplay = IBM_Plex_Serif({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-connect-display",
  weight: ["400", "500", "600"],
});

export const connectBody = IBM_Plex_Sans({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-connect-body",
  weight: ["400", "500", "600", "700"],
});

export const connectMono = IBM_Plex_Mono({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-connect-mono",
  weight: ["400", "500", "600"],
});

export const connectFontVariables = `${connectDisplay.variable} ${connectBody.variable} ${connectMono.variable}`;
