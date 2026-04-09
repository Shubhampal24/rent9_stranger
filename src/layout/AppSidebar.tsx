"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  Plus
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
    icon: <LayoutDashboard />,
    path: "/dashboard",
  },
  {
    icon: <PlusCircleIcon />,
    name: "Create",
    subtitle: "site/owner/consumer",
    subItems: [
      { name: "Add Site", path: "/form-elements", icon: <Plus size={14} /> },
      { name: "Add Owner", path: "/owners", icon: <UserPlus size={14} /> },
      { name: "Add Consumer", path: "/consumers", icon: <ZapIcon size={14} /> },
    ],
  },
  {
    icon: <CreditCard />,
    name: "Payments",
    subtitle: "rent/elec/maint",
    subItems: [
      { name: "Rent Payment", path: "/blank", icon: <Wallet size={14} /> },
      { name: "Electricity Payment", path: "/electricity", icon: <ZapIcon size={14} /> },
      { name: "Maintenance Payment", path: "/maintenance", icon: <Wrench size={14} /> },
    ],
  },
  {
    icon: <ArrowRightLeft />,
    name: "Transactions",
    subtitle: "history/ledger",
    subItems: [
      { name: "Rent Transactions", path: "/rent-transactions", icon: <History size={14} /> },
      { name: "Electricity Transactions", path: "/electricity-bills", icon: <ZapIcon size={14} /> },
      { name: "Maintenance Transactions", path: "/maintenance-transactions", icon: <History size={14} /> },
    ],
  },
  {
    name: "All Sites",
    icon: <BuildingIcon />,
    path: "/basic-tables",
  },
  {
    name: "Master File",
    icon: <FolderIcon />,
    path: "/master-tables",
  },
];

// Commented out the Others section
/*
const othersItems: NavItem[] = [
  {
    icon: <PieChartIcon />,
    name: "Charts",
    subItems: [
      { name: "Line Chart", path: "/line-chart", pro: false },
      { name: "Bar Chart", path: "/bar-chart", pro: false },
    ],
  },
  {
    icon: <BoxCubeIcon />,
    name: "UI Elements",
    subItems: [
      { name: "Alerts", path: "/alerts", pro: false },
      { name: "Avatar", path: "/avatars", pro: false },
      { name: "Badge", path: "/badge", pro: false },
      { name: "Buttons", path: "/buttons", pro: false },
      { name: "Images", path: "/images", pro: false },
      { name: "Videos", path: "/videos", pro: false },
    ],
  },
  {
    icon: <PlugInIcon />,
    name: "Authentication",
    subItems: [
      { name: "Sign In", path: "/signin", pro: false },
      { name: "Sign Up", path: "/signup", pro: false },
    ],
  },
];
*/

const AppSidebar: React.FC = () => {
  const pathname = usePathname();
  const [siteCount, setSiteCount] = useState<number | null>(null);
  const [openSubmenu, setOpenSubmenu] = useState<number | null>(null);

  const isActive = useCallback((path: string) => path === pathname, [pathname]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/rental-dashboard/stats`, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        if (data.success) {
          setSiteCount(data.data?.totalSites ?? 0);
        }
      } catch (error) {
        console.error("Sidebar site count fetch failed:", error);
        setSiteCount(null);
      }
    };
    fetchStats();
  }, []);

  useEffect(() => {
    // Close submenu on click outside or when route changes
    setOpenSubmenu(null);
  }, [pathname]);

  const handleSubmenuToggle = (index: number) => {
    setOpenSubmenu((prev) => (prev === index ? null : index));
  };

  return (
    <div className="w-full relative z-40 bg-[#13141a] px-4 pt-4 pb-2">
      {/* Centered Navigation Container (Stranger style) */}
      <nav className="mx-auto flex flex-row items-center bg-[#1b1b26] rounded-full px-6 py-3 w-max max-w-full overflow-visible no-scrollbar shadow-md">
        <ul className="flex flex-row items-center gap-6">
          {navItems.map((nav, index) => {
            const isMenuOpen = openSubmenu === index;
            const hasActiveChild = nav.subItems?.some(sub => isActive(sub.path));
            const isDirectActive = nav.path && isActive(nav.path);
            const isCurrentlyActive = isDirectActive || hasActiveChild;

            return (
              <li key={nav.name} className="relative group">
                {nav.subItems ? (
                  <button
                    onClick={() => handleSubmenuToggle(index)}
                    className={`flex items-center gap-2 whitespace-nowrap text-sm font-medium transition-colors cursor-pointer py-1 ${
                      isCurrentlyActive || isMenuOpen ? "text-brand-500" : "text-gray-400 hover:text-white"
                    }`}
                  >
                    <span>{nav.icon}</span>
                    <span>{nav.name}</span>
                    <ChevronDownIcon
                      className={`w-4 h-4 transition-transform duration-200 ${
                        isMenuOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                ) : (
                  nav.path && (
                    <Link
                      href={nav.path}
                      onClick={() => setOpenSubmenu(null)}
                      className={`flex items-center gap-2 whitespace-nowrap text-sm font-medium transition-colors cursor-pointer py-1 ${
                        isCurrentlyActive ? "text-brand-500 border-b-2 border-brand-500" : "text-gray-400 hover:text-white"
                      }`}
                    >
                      <span>{nav.name}</span>
                      {nav.name === "All Sites" && siteCount !== null && (
                        <span className="ml-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-brand-500 text-white">
                          {siteCount}
                        </span>
                      )}
                    </Link>
                  )
                )}

                {/* Dropdown Menu */}
                {nav.subItems && isMenuOpen && (
                  <div className="absolute top-full left-0 mt-3 min-w-[200px] bg-[#292938] rounded-xl shadow-2xl py-2 z-50 border border-gray-700">
                    <ul className="flex flex-col">
                      {nav.subItems.map((subItem) => (
                        <li key={subItem.name} className="w-full">
                          <Link
                            href={subItem.path}
                            onClick={() => setOpenSubmenu(null)}
                            className={`flex items-center gap-3 px-4 py-2 hover:bg-white/5 transition-colors ${
                              isActive(subItem.path) ? "text-brand-500 bg-white/5" : "text-gray-300"
                            }`}
                          >
                            {subItem.icon && <span className="text-current opacity-80">{subItem.icon}</span>}
                            <span className="text-sm font-medium">{subItem.name}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
};

export default AppSidebar;