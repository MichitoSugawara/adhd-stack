import "./globals.css";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  description: "何も考えずに始められる開発と公開",
  title: "ADHD Stack",
};

export const viewport: Viewport = {
  initialScale: 1,
  themeColor: "#f7f7f8",
  viewportFit: "cover",
  width: "device-width",
};

type RootLayoutProperties = Readonly<{
  children: ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProperties) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
