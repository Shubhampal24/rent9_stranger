"use client";

import AppHeader from "@/layout/AppHeader";
import Backdrop from "@/layout/Backdrop";
import MobileSidebar from "@/layout/MobileSidebar";
import { useSidebar } from "@/context/SidebarContext";
import React from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  // Sidebar width is no longer needed since it will be a horizontal top nav, but keeping hook for states if needed.

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-[#13141a]">
      {/* Full-width sticky header */}
      <AppHeader />

      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && <Backdrop />}

      {/* Mobile Navigation Drawer */}
      <MobileSidebar />

      {/* Persistent Sidebar removed to move nav to header */}


      <main className="flex-1 w-full transition-all duration-300">
        <div className="w-full p-2">
          {children}
        </div>
      </main>
    </div>
  );
}