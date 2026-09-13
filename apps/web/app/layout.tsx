import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "100 Days Learning",
    template: "%s · 100 Days Learning",
  },
  description:
    "A focused 100-day learning journey for students, connected across web and mobile.",
  applicationName: "100 Days Learning",
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
