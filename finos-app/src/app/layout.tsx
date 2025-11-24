import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { PortfolioProvider } from "@/context/PortfolioContext";
import AppLayout from "@/components/layout/AppLayout";

export const metadata: Metadata = {
  title: "FinOS - AI Financial Assistant",
  description: "Your expert financial advisor and trading companion.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <PortfolioProvider>
          <AppLayout>{children}</AppLayout>
        </PortfolioProvider>
      </body>
    </html>
  );
}
