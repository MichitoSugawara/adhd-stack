import "./globals.css";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { ConvexClientProvider } from "./convex-client-provider";

export const metadata: Metadata = {
  description: "何も考えずに始められる開発と公開",
  title: "ADHD Stack",
};

export const viewport: Viewport = {
  initialScale: 1,
  themeColor: "#0f172a",
  viewportFit: "cover",
  width: "device-width",
};

interface RootLayoutProperties {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProperties) {
  return (
    <html lang="ja">
      <body>
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
