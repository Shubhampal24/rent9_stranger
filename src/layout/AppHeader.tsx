"use client";
import { ThemeToggleButton } from "@/components/common/ThemeToggleButton";
import UserDropdown from "@/components/header/UserDropdown";
import { useSidebar } from "@/context/SidebarContext";
import { useRouter, usePathname } from "next/navigation";
import React, { useState, useEffect, useRef } from "react";

import Link from "next/link";
import Image from "next/image";

const AppHeader: React.FC = () => {
  const [canGoBack, setCanGoBack] = useState(false);

  const { toggleSidebar, toggleMobileSidebar } = useSidebar();
  const router = useRouter();
  const pathname = usePathname();

  const handleToggle = () => {
    if (window.innerWidth >= 1024) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  };

  const handleBackClick = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  useEffect(() => {
    const isHomePage =
      pathname === "/" || pathname === "/dashboard" || pathname === "/home";
    setCanGoBack(!isHomePage);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-[99999] flex h-14 w-full items-center border-b border-gray-200 bg-white px-4 dark:border-gray-800 dark:bg-[#121212] sm:h-16 sm:px-6">
      {/* ── Left: hamburger + Logo ── */}
      <div className="flex items-center gap-4 flex-shrink-0">
        {/* Hamburger / sidebar toggle */}
        <button
          onClick={handleToggle}
          aria-label="Toggle sidebar"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d="M3 6.75A.75.75 0 013.75 6h16.5a.75.75 0 010 1.5H3.75A.75.75 0 013 6.75zm0 5.25a.75.75 0 01.75-.75h16.5a.75.75 0 010 1.5H3.75A.75.75 0 013 12zm0 5.25a.75.75 0 01.75-.75H20.25a.75.75 0 010 1.5H3.75a.75.75 0 01-.75-.75z" fill="currentColor" />
          </svg>
        </button>

        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
           <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
              <span className="font-bold text-lg">R</span>
           </div>
           <div className="hidden sm:flex flex-col leading-none">
              <span className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">ACE Rental</span>
              <span className="text-[10px] text-gray-400 font-medium uppercase tracking-[0.2em] mt-0.5">Admin</span>
           </div>
        </Link>

        {/* Back button — only shows when not on home pages */}
        {canGoBack && (
          <button
            onClick={handleBackClick}
            aria-label="Go Back"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" clipRule="evenodd" d="M15.7071 4.29289C16.0976 4.68342 16.0976 5.31658 15.7071 5.70711L9.41421 12L15.7071 18.2929C16.0976 18.6834 16.0976 19.3166 15.7071 19.7071C15.3166 20.0976 14.6834 20.0976 14.2929 19.7071L7.29289 12.7071C6.90237 12.3166 6.90237 11.6834 7.29289 11.2929L14.2929 4.29289C14.6834 3.90237 15.3166 3.90237 15.7071 4.29289Z" fill="currentColor" />
            </svg>
          </button>
        )}
      </div>

      {/* ── Spacer (Center) ── */}
      <div className="flex-1" />

      {/* ── Right: theme toggle + user ── */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        <ThemeToggleButton />
        <UserDropdown />
      </div>
    </header>
  );
};

export default AppHeader;
