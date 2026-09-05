import "./globals.css";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { ThemeBoot } from "../components/theme-boot";
import { fontVariables } from "../lib/fonts";

export const metadata: Metadata = {
  description: "何も考えずに始められる開発と公開",
  title: "ADHD Stack",
};

export const viewport: Viewport = {
  initialScale: 1,
  interactiveWidget: "resizes-content",
  themeColor: "#f3f5f2",
  viewportFit: "cover",
  width: "device-width",
};

interface RootLayoutProperties {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProperties) {
  return (
    <html className={fontVariables} lang="ja" suppressHydrationWarning>
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var k='adhd-stack-theme';var t=localStorage.getItem(k);if(t!=='dark'&&t!=='light'){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.dataset.theme=t}catch(e){}",
          }}
        />
        <ThemeBoot />
        {children}
      </body>
    </html>
  );
}
