"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/context/SidebarContext";
import { navItems } from "./AppHeader";
import { ChevronDown, X } from "lucide-react";

export default function MobileSidebar() {
  const { isMobileOpen, toggleMobileSidebar } = useSidebar();
  const pathname = usePathname();
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

  if (!isMobileOpen) return null;

  const isActive = (path?: string) => path === pathname;

  const handleToggleSubmenu = (name: string) => {
    setOpenSubmenu(prev => (prev === name ? null : name));
  };

  return (
    <aside className={`fixed inset-y-0 left-0 z-[100000] w-72 transform bg-white dark:bg-[#13141a] transition-transform duration-300 ease-in-out lg:hidden shadow-2xl border-r border-gray-100 dark:border-gray-800 ${
      isMobileOpen ? "translate-x-0" : "-translate-x-full"
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
        <span className="text-xl font-bold bg-gradient-to-r from-brand-500 to-brand-400 bg-clip-text text-transparent">
          Stranger
        </span>
        <button 
          onClick={toggleMobileSidebar}
          className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Navigation */}
      <div className="overflow-y-auto h-[calc(100vh-80px)] p-4 no-scrollbar">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const hasSubItems = item.subItems && item.subItems.length > 0;
            const isSubOpen = openSubmenu === item.name;
            const isParentActive = item.path ? isActive(item.path) : item.subItems?.some(sub => isActive(sub.path));

            return (
              <li key={item.name}>
                {hasSubItems ? (
                  <div>
                      <button
                      onClick={() => handleToggleSubmenu(item.name)}
                      className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                        isParentActive ? "bg-brand-500/10 text-brand-500" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={isParentActive ? "text-brand-500" : "text-gray-500"}>{item.icon}</span>
                        <span>{item.name}</span>
                      </div>
                      <ChevronDown 
                        size={16} 
                        className={`transition-transform duration-200 ${isSubOpen ? "rotate-180" : ""}`} 
                      />
                    </button>
                    
                    {/* Submenu Accordion */}
                    <div className={`overflow-hidden transition-all duration-300 ${isSubOpen ? "max-h-96 opacity-100 mt-1" : "max-h-0 opacity-0"}`}>
                      <ul className="pl-11 space-y-1">
                        {item.subItems?.map((sub) => (
                          <li key={sub.name}>
                            <Link
                              href={sub.path}
                              onClick={toggleMobileSidebar}
                              className={`block rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                                isActive(sub.path) ? "text-brand-500 bg-brand-500/5" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/5"
                              }`}
                            >
                              {sub.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <Link
                    href={item.path || "#"}
                    onClick={toggleMobileSidebar}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                      isActive(item.path) ? "bg-brand-500/10 text-brand-500 border border-brand-500/20" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white"
                    }`}
                  >
                    <span className={isActive(item.path) ? "text-brand-500" : "text-gray-500"}>{item.icon}</span>
                    <span>{item.name}</span>
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {/* Footer Info */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white dark:from-[#13141a] to-transparent">
        <p className="text-[10px] text-gray-600 uppercase tracking-widest font-bold">
          Rental Management System
        </p>
      </div>
    </aside>
  );
}
