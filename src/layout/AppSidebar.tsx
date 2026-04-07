"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import {
  ChevronDownIcon,
  HorizontaLDots,
  ListIcon,
} from "../icons/index";
import { 
  BuildingIcon, 
  FileTextIcon, 
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
      { name: "Add/Owner", path: "/owners", icon: <UserPlus size={14} /> },
      { name: "Add/Consumer", path: "/consumers", icon: <ZapIcon size={14} /> },
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
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();
  const [siteCount, setSiteCount] = useState<number | null>(null);

  useEffect(() => {
    // Fetch the stats (same as EcommerceMetrics)
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/rent/dashboard/stats`, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });
        const data = await res.json();
        if (data.success) {
          setSiteCount(data.data?.sites?.total ?? 0);
        }
      } catch (error) {
        console.error("Sidebar site count fetch failed:", error);
        setSiteCount(null);
      }
    };
    fetchStats();
  }, []);

  const renderMenuItems = (
    navItems: NavItem[],
    menuType: "main" | "others"
  ) => (
    <ul className="flex flex-col gap-4">
      {navItems.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`menu-item group ${openSubmenu?.type === menuType && openSubmenu?.index === index
                ? "menu-item-active"
                : "menu-item-inactive"
                } cursor-pointer ${!isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "lg:justify-start"
                }`}
            >
              <span
                className={`${openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "menu-item-icon-active"
                  : "menu-item-icon-inactive"
                  }`}
              >
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <div className="flex flex-col items-start gap-0.5 overflow-hidden">
                  <span className="menu-item-text leading-tight">{nav.name}</span>
                  {nav.subtitle && (
                    <span className="text-[10px] text-gray-400 font-medium leading-none truncate w-full">
                      {nav.subtitle}
                    </span>
                  )}
                </div>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon
                  className={`ml-auto w-5 h-5 transition-transform duration-200 ${openSubmenu?.type === menuType &&
                    openSubmenu?.index === index
                    ? "rotate-180 text-brand-500"
                    : ""
                    }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                href={nav.path}
                onClick={() => setOpenSubmenu(null)}
                className={`menu-item group ${isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                  }`}
              >
                <span
                  className={`${isActive(nav.path)
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                    }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <div className="flex flex-col items-start gap-0.5 overflow-hidden">
                    <span className="menu-item-text flex items-center leading-tight">
                      {nav.name}
                      {/* Show badge for All Sites */}
                      {nav.name === "All Sites" && siteCount !== null && (
                        <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500 text-white">
                          {siteCount}
                        </span>
                      )}
                    </span>
                    {nav.subtitle && (
                      <span className="text-[10px] text-gray-400 font-medium leading-none truncate w-full">
                        {nav.subtitle}
                      </span>
                    )}
                  </div>
                )}
              </Link>
            )
          )}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.type === menuType &&
                    openSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="mt-2 space-y-1 ml-6">
                {nav.subItems.map((subItem: { name: string; path: string; icon?: React.ReactNode; pro?: boolean; new?: boolean }) => (
                  <li key={subItem.name}>
                    <Link
                      href={subItem.path}
                      className={`menu-dropdown-item flex items-center gap-3 ${isActive(subItem.path)
                        ? "menu-dropdown-item-active"
                        : "menu-dropdown-item-inactive"
                        }`}
                    >
                      {subItem.icon && (
                        <span className="flex-shrink-0 text-gray-400 group-hover:text-brand-500 transition-colors">
                          {subItem.icon}
                        </span>
                      )}
                      <span className="truncate">{subItem.name}</span>
                      <span className="flex items-center gap-1 ml-auto font-medium">
                        {subItem.new && (
                          <span
                            className={`ml-auto ${isActive(subItem.path)
                              ? "menu-dropdown-badge-active"
                              : "menu-dropdown-badge-inactive"
                              } menu-dropdown-badge`}
                          >
                            new
                          </span>
                        )}
                        {subItem.pro && (
                          <span
                            className={`ml-auto ${isActive(subItem.path)
                              ? "menu-dropdown-badge-active"
                              : "menu-dropdown-badge-inactive"
                              } menu-dropdown-badge`}
                          >
                            pro
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {}
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isActive = useCallback((path: string) => path === pathname, [pathname]);

  useEffect(() => {
    let submenuMatched = false;
    ["main"].forEach((menuType) => {
      const items = navItems;
      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem: { name: string; path: string; pro?: boolean; new?: boolean }) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({
                type: menuType as "main",
                index,
              });
              submenuMatched = true;
            }
          });
        }
      });
    });

    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [pathname, isActive]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  return (
    <aside
      className={`fixed mt-16 flex flex-col top-0 px-5 left-0 bg-white dark:bg-[#121212] dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${isExpanded || isMobileOpen
          ? "w-[240px]"
          : isHovered
            ? "w-[240px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex flex-col pt-4 overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${!isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "justify-start"
                  }`}
              >
                {isExpanded || isHovered || isMobileOpen ? "Menu" : <HorizontaLDots />}
              </h2>
              {renderMenuItems(navItems, "main")}
            </div>

            {/* 
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? "Others" : <HorizontaLDots />}
              </h2>
              {renderMenuItems(othersItems, "others")}
            </div> 
            */}

          </div>
        </nav>
        {/* {isExpanded || isHovered || isMobileOpen ? <SidebarWidget /> : null} */}
      </div>
    </aside>
  );
};

export default AppSidebar;