import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "LULE — Let Us Learn English",
    template: "%s · LULE",
  },
  description:
    "LULE's 100-day English learning journey, connected across web and mobile.",
  applicationName: "LULE — Let Us Learn English",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#4B4FD8",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
