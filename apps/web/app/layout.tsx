import "./globals.css";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  description: "デモモード。接続から公開までをモックで体験する",
  title: "ADHD Stack（デモ）",
};

export const viewport: Viewport = {
  initialScale: 1,
  interactiveWidget: "resizes-content",
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
      <body>{children}</body>
    </html>
  );
}
