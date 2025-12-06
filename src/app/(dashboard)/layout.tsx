'use client';

import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-background text-foreground font-sans">
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-hidden bg-background">
          <Header />
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}

