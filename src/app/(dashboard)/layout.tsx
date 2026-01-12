'use client';

import Header from "@/components/Header";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ChatTabs } from "@/components/chat/ChatTabs";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="flex h-screen supports-[height:100dvh]:h-dvh bg-background text-foreground font-sans">
        <main className="flex-1 flex flex-col bg-background overflow-auto">
          <Header />
          <ChatTabs />
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}

