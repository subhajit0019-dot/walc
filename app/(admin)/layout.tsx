import React from "react";
import { AdminNavbar } from "@/components/admin-navbar";
import { AdminSidebar } from "@/components/admin-sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <AdminNavbar />
      <div className="flex-1 flex">
        <AdminSidebar />
        <main className="flex-1 p-8 overflow-y-auto max-w-7xl">
          {children}
        </main>
      </div>
    </div>
  );
}
