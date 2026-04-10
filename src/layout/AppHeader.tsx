"use client";
import UserDropdown from "@/components/header/UserDropdown";
import { useSidebar } from "@/context/SidebarContext";
import { useRouter, usePathname } from "next/navigation";
import React, { useState, useEffect, useRef, useCallback } from "react";

import Link from "next/link";
import Image from "next/image";
import {
  ChevronDownIcon,
} from "../icons/index";
import {
  BuildingIcon,
  FolderIcon,
  PlusCircleIcon,
  ZapIcon,
  Wrench,
  LayoutDashboard,
  CreditCard,
  ArrowRightLeft,
  UserPlus,
  Wallet,
  History,
  Plus,
  Menu
} from "lucide-react";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subtitle?: string;
  subItems?: { name: string; path: string; icon?: React.ReactNode; pro?: boolean; new?: boolean }[];
};

export const navItems: NavItem[] = [
  {
    name: "Dashboard",
    icon: <LayoutDashboard size={12} />,
    path: "/dashboard",
  },
  {
    icon: <PlusCircleIcon size={12} />,
    name: "Create",
    subtitle: "site/owner/consumer",
    subItems: [
      { name: "Add Site", path: "/form-elements", icon: <Plus size={12} /> },
      { name: "Add Owner", path: "/owners", icon: <UserPlus size={12} /> },
      { name: "Add Consumer", path: "/consumers", icon: <ZapIcon size={12} /> },
    ],
  },
  {
    icon: <CreditCard size={12} />,
    name: "Payments",
    subtitle: "rent/elec/maint",
    subItems: [
      { name: "Rent Payment", path: "/blank", icon: <Wallet size={12} /> },
      { name: "Electricity Payment", path: "/electricity", icon: <ZapIcon size={12} /> },
      { name: "Maintenance Payment", path: "/maintenance", icon: <Wrench size={12} /> },
    ],
  },
  {
    icon: <ArrowRightLeft size={12} />,
    name: "Transactions",
    subtitle: "history/ledger",
    subItems: [
      { name: "Rent Transactions", path: "/rent-transactions", icon: <History size={12} /> },
      { name: "Electricity Transactions", path: "/electricity-bills", icon: <ZapIcon size={12} /> },
      { name: "Maintenance Transactions", path: "/maintenance-transactions", icon: <History size={12} /> },
    ],
  },
  {
    name: "All Sites",
    icon: <BuildingIcon size={12} />,
    path: "/basic-tables",
  },
  {
    name: "Master File",
    icon: <FolderIcon size={12} />,
    path: "/master-tables",
  },
];

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

  const [siteCount, setSiteCount] = useState<number | null>(null);
  const [openSubmenu, setOpenSubmenu] = useState<number | null>(null);
  const navRef = useRef<HTMLDivElement>(null);


  const isActive = useCallback((path: string) => path === pathname, [pathname]);

  useEffect(() => {
    const isHomePage =
      pathname === "/" || pathname === "/dashboard" || pathname === "/home";
    setCanGoBack(!isHomePage);
    setOpenSubmenu(null);
  }, [pathname]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenSubmenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("token");
        // Using the same endpoint as EcommerceMetrics and RevenueMixChart
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/rent/dashboard/stats`, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        if (data.success) {
          // Access total sites from the standard stats object
          setSiteCount(data.data?.sites?.total ?? 0);
        }
      } catch (error) {
        console.error("Header site count fetch failed:", error);
        setSiteCount(null);
      }
    };
    fetchStats();
  }, []);

  const handleSubmenuToggle = (index: number) => {
    setOpenSubmenu((prev) => (prev === index ? null : index));
  };

  const getActiveBadgeText = () => {
    const activeItem = navItems.find((nav) => {
      if (nav.path === pathname) return true;
      return nav.subItems?.some((sub) => sub.path === pathname);
    });

    if (!activeItem) return null;

    const activeSubItem = activeItem.subItems?.find(
      (sub) => sub.path === pathname
    );

    if (activeSubItem) {
      return `${activeItem.name} › ${activeSubItem.name}`;
    }

    return activeItem.name;
  };

  const badgeText = getActiveBadgeText();

  return (
    <header className="sticky top-0 z-[99999] flex h-14 w-full items-center justify-between bg-white px-6 dark:bg-[#0D0D11] sm:px-8 shadow-sm">
      {/* ── Left: hamburger + Logo ── */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Mobile Toggle */}
        <button
          onClick={handleToggle}
          className="lg:hidden inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
          aria-label="Toggle Sidebar"
        >
          <Menu size={18} />
        </button>

        {/* Logo removed as per user request */}


        {/* Back button — only shows when not on home pages */}
        {canGoBack && (
          <button
            onClick={handleBackClick}
            aria-label="Go Back"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" clipRule="evenodd" d="M15.7071 4.29289C16.0976 4.68342 16.0976 5.31658 15.7071 5.70711L9.41421 12L15.7071 18.2929C16.0976 18.6834 16.0976 19.3166 15.7071 19.7071C15.3166 20.0976 14.6834 20.0976 14.2929 19.7071L7.29289 12.7071C6.90237 12.3166 6.90237 11.6834 7.29289 11.2929L14.2929 4.29289C14.6834 3.90237 15.3166 3.90237 15.7071 4.29289Z" fill="currentColor" />
            </svg>
          </button>
        )}
      </div>

      {/* ── Center: Navigation Pill Bar (Hidden on Mobile) ── */}
      <div ref={navRef} className="hidden lg:flex flex-1 justify-center overflow-visible">
        <nav className="flex flex-row items-center bg-gray-50 dark:bg-[#1b1b26] rounded-full px-5 py-1 w-max max-w-full overflow-visible no-scrollbar shadow-sm border border-gray-200 dark:border-white/[0.08]">
          <ul className="flex flex-row items-center">
            {navItems.map((nav, index) => {
              const isMenuOpen = openSubmenu === index;
              const hasActiveChild = nav.subItems?.some(sub => isActive(sub.path));
              const isDirectActive = nav.path && isActive(nav.path);
              const isCurrentlyActive = isDirectActive || hasActiveChild;

              return (
                <React.Fragment key={nav.name}>
                  {/* Divider - Show between items except the first */}
                  {index > 0 && (
                    <div className="w-[1px] h-3.5 bg-gray-300 dark:bg-gray-700 mx-5 opacity-50" />
                  )}

                  <li className="relative group flex items-center h-full">
                    {nav.subItems ? (
                      <button
                        onClick={() => handleSubmenuToggle(index)}
                        className={`flex items-center gap-2 whitespace-nowrap text-[13px] font-semibold transition-all duration-200 cursor-pointer py-1 px-1 hover:scale-105 ${isCurrentlyActive || isMenuOpen ? "text-brand-500 scale-105" : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                          }`}
                      >
                        <span className="opacity-80">{nav.icon}</span>
                        <span className="flex items-center gap-1">
                          <span>{nav.name}</span>
                          <ChevronDownIcon
                            className={`w-4 h-4 transition-transform duration-200 ${isMenuOpen ? "rotate-180" : ""
                              }`}
                          />
                        </span>
                      </button>
                    ) : (
                      nav.path && (
                        <Link
                          href={nav.path}
                          onClick={() => setOpenSubmenu(null)}
                          className={`flex items-center gap-2 whitespace-nowrap text-[13px] font-semibold transition-all duration-200 cursor-pointer py-1 px-1 hover:scale-105 ${isCurrentlyActive ? "text-brand-500 scale-105 font-bold" : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                            }`}
                        >
                          <span className="opacity-80">{nav.icon}</span>
                          <span>{nav.name}</span>
                          {nav.name === "All Sites" && siteCount !== null && (
                            <span className="ml-1 px-1.5 py-0.5 text-[8px] font-bold rounded-full bg-brand-500 text-white">
                              {siteCount}
                            </span>
                          )}
                        </Link>
                      )
                    )}

                    {/* Dropdown Menu */}
                    {nav.subItems && isMenuOpen && (
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3.5 min-w-[180px] bg-[#1b1b26] rounded-xl shadow-2xl py-2 z-[999999] border border-white/[0.08] animate-in fade-in slide-in-from-top-2 duration-200">
                        <ul className="flex flex-col">
                          {nav.subItems.map((subItem) => (
                            <li key={subItem.name} className="w-full">
                              <Link
                                href={subItem.path}
                                onClick={() => setOpenSubmenu(null)}
                                className={`flex items-center gap-3 px-4 py-2 hover:bg-white/5 transition-colors ${isActive(subItem.path) ? "text-brand-500 bg-white/5" : "text-gray-300 hover:text-white"
                                  }`}
                              >
                                {subItem.icon && <span className="text-current opacity-80">{subItem.icon}</span>}
                                <span className="text-xs font-medium">{subItem.name}</span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </li>
                </React.Fragment>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* ── Right: theme toggle + user ── */}
      <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
        {badgeText && (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-500/10 border border-brand-500/15 shadow-sm transition-all hover:bg-brand-500/20">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-brand-500"></span>
              </span>
              <span className="text-[9px] font-black text-brand-500 uppercase tracking-widest whitespace-nowrap">
                {badgeText}
              </span>
            </div>
          </div>
        )}
        <UserDropdown />
      </div>
    </header>
  );
};

export default AppHeader;
