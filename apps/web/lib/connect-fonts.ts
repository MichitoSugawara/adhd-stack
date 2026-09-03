import { IBM_Plex_Sans, JetBrains_Mono } from "next/font/google";

export const connectBody = IBM_Plex_Sans({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-connect-body",
  weight: ["400", "500", "600", "700"],
});

export const connectMono = JetBrains_Mono({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-connect-mono",
  weight: ["400", "500", "600", "700"],
});

export const connectFontVariables = `${connectBody.variable} ${connectMono.variable}`;
