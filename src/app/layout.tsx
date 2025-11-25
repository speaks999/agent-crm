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

export const metadata: Metadata = {
  title: "Whitespace CRM - AI-Powered Sales Assistant",
  description: "Agent-driven CRM for modern sales teams",
};

import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <div className="flex h-screen bg-slate-50 text-slate-900 font-sans">
          <Sidebar />
          <main className="flex-1 flex flex-col overflow-hidden">
            <Header />
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}

