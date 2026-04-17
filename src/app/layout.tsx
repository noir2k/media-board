import type { Metadata } from "next";

import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Media Board MVP",
  description: "A 16:9 live media board built with Next.js for kiosk and signage displays.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
