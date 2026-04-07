"use client";
import Link from "next/link";
import { navItems } from "@/layout/AppSidebar";
import React, { useEffect, useState } from "react";
import { MoveRight } from "lucide-react";

const ICON_COLORS: Record<string, {
  lightBox: string;
  darkBg: string;
  darkBorder: string;
  icon: string;
  darkIcon: string;
  rgb: string;
}> = {
  "All Sites":          { lightBox: "bg-blue-100 border-blue-200",       darkBg: "rgba(96,165,250,0.15)",   darkBorder: "rgba(96,165,250,0.25)",   icon: "text-blue-600",    darkIcon: "text-blue-400",    rgb: "#60a5fa" },
  "Rent Payment's":     { lightBox: "bg-purple-100 border-purple-200",   darkBg: "rgba(192,132,252,0.15)",  darkBorder: "rgba(192,132,252,0.25)",  icon: "text-purple-600",  darkIcon: "text-purple-400",  rgb: "#c084fc" },
  "Electricity Bill's": { lightBox: "bg-amber-100 border-amber-200",     darkBg: "rgba(251,191,36,0.15)",   darkBorder: "rgba(251,191,36,0.25)",   icon: "text-amber-600",   darkIcon: "text-amber-400",   rgb: "#fbbf24" },
  "Rent Transaction's": { lightBox: "bg-emerald-100 border-emerald-200", darkBg: "rgba(52,211,153,0.15)",   darkBorder: "rgba(52,211,153,0.25)",   icon: "text-emerald-600", darkIcon: "text-emerald-400", rgb: "#34d399" },
  "Advertisement":      { lightBox: "bg-pink-100 border-pink-200",       darkBg: "rgba(244,114,182,0.15)",  darkBorder: "rgba(244,114,182,0.25)",  icon: "text-pink-600",    darkIcon: "text-pink-400",    rgb: "#f472b6" },
  "Reports":            { lightBox: "bg-cyan-100 border-cyan-200",       darkBg: "rgba(34,211,238,0.15)",   darkBorder: "rgba(34,211,238,0.25)",   icon: "text-cyan-600",    darkIcon: "text-cyan-400",    rgb: "#22d3ee" },
  "Commission":         { lightBox: "bg-orange-100 border-orange-200",   darkBg: "rgba(251,146,60,0.15)",   darkBorder: "rgba(251,146,60,0.25)",   icon: "text-orange-600",  darkIcon: "text-orange-400",  rgb: "#fb923c" },
  "Centers":            { lightBox: "bg-teal-100 border-teal-200",       darkBg: "rgba(45,212,191,0.15)",   darkBorder: "rgba(45,212,191,0.25)",   icon: "text-teal-600",    darkIcon: "text-teal-400",    rgb: "#2dd4bf" },
  "Issues":             { lightBox: "bg-red-100 border-red-200",         darkBg: "rgba(248,113,113,0.15)",  darkBorder: "rgba(248,113,113,0.25)",  icon: "text-red-600",     darkIcon: "text-red-400",     rgb: "#f87171" },
  "Settings":           { lightBox: "bg-indigo-100 border-indigo-200",   darkBg: "rgba(129,140,248,0.15)",  darkBorder: "rgba(129,140,248,0.25)",  icon: "text-indigo-600",  darkIcon: "text-indigo-400",  rgb: "#818cf8" },
};

const FALLBACK_COLORS = [
  { lightBox: "bg-violet-100 border-violet-200",   darkBg: "rgba(167,139,250,0.15)", darkBorder: "rgba(167,139,250,0.25)", icon: "text-violet-600",  darkIcon: "text-violet-400",  rgb: "#a78bfa" },
  { lightBox: "bg-rose-100 border-rose-200",       darkBg: "rgba(251,113,133,0.15)", darkBorder: "rgba(251,113,133,0.25)", icon: "text-rose-600",    darkIcon: "text-rose-400",    rgb: "#fb7185" },
  { lightBox: "bg-lime-100 border-lime-200",       darkBg: "rgba(163,230,53,0.15)",  darkBorder: "rgba(163,230,53,0.25)",  icon: "text-lime-600",    darkIcon: "text-lime-400",    rgb: "#a3e635" },
  { lightBox: "bg-sky-100 border-sky-200",         darkBg: "rgba(56,189,248,0.15)",  darkBorder: "rgba(56,189,248,0.25)",  icon: "text-sky-600",     darkIcon: "text-sky-400",     rgb: "#38bdf8" },
  { lightBox: "bg-fuchsia-100 border-fuchsia-200", darkBg: "rgba(232,121,249,0.15)", darkBorder: "rgba(232,121,249,0.25)", icon: "text-fuchsia-600", darkIcon: "text-fuchsia-400", rgb: "#e879f9" },
  { lightBox: "bg-yellow-100 border-yellow-200",   darkBg: "rgba(250,204,21,0.15)",  darkBorder: "rgba(250,204,21,0.25)",  icon: "text-yellow-600",  darkIcon: "text-yellow-400",  rgb: "#facc15" },
];

export default function DashboardMenuCards() {
  const [siteCount, setSiteCount] = useState<number | null>(null);
  const [upcomingPayments, setUpcomingPayments] = useState<number | null>(null);
  const [electricityBillCount, setElectricityBillCount] = useState<number | null>(null);
  const [totalRentTransactions, setTotalRentTransactions] = useState<number | null>(null);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains("dark"));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found");

      const statsResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/rental-dashboard/stats`
      );

      if (!statsResponse.ok) {
        throw new Error("Failed to fetch dashboard stats");
      }

      const statsJson = await statsResponse.json();
      console.log("Dashboard Stats:", statsJson);

      setSiteCount(Number(statsJson?.data?.totalSites) || 0);
      setUpcomingPayments(Number(statsJson?.data?.upcomingRentSitesCount) || 0);


      const rentResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/rent/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!rentResponse.ok) {
        throw new Error("Failed to fetch rent transactions");
      }

      const rentJson = await rentResponse.json();
      console.log("Rent Transactions:", rentJson);

      // Normalize array safely
      const rentArray: any[] =
        Array.isArray(rentJson)
          ? rentJson
          : Array.isArray(rentJson?.rentPayments)
          ? rentJson.rentPayments
          : Array.isArray(rentJson?.data?.rentPayments)
          ? rentJson.data.rentPayments
          : [];

        setTotalRentTransactions(rentArray.length);

        // ── Electricity ──
        const electricityResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/electricity/all-payments`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!electricityResponse.ok) {
          throw new Error("Failed to fetch electricity payments");
        }

        const electricityJson = await electricityResponse.json();
        console.log("Electricity Payments:", electricityJson);

        const electricityArray: any[] =
          Array.isArray(electricityJson)
            ? electricityJson
            : Array.isArray(electricityJson?.data)
            ? electricityJson.data
            : [];

        setElectricityBillCount(electricityArray.length);

      } catch (error) {
        console.error("Dashboard fetch error:", error);

        // Safe fallback
        setSiteCount(0);
        setUpcomingPayments(0);
        setTotalRentTransactions(0); 
        setElectricityBillCount(0);
      }
    };

  fetchDashboardData();
}, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
      {navItems.map((item, index) =>
        item.path ? (() => {
          const color = ICON_COLORS[item.name] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length];
          const isHovered = hoveredCard === item.name;

          return (
            <Link
              key={item.name}
              href={item.path}
              onMouseEnter={() => setHoveredCard(item.name)}
              onMouseLeave={() => setHoveredCard(null)}
              className="relative group cursor-pointer w-full rounded-2xl flex flex-col justify-between h-44 overflow-hidden p-6 transition-all duration-300 ease-out hover:-translate-y-1"
              style={{
                backgroundColor: isDark ? "#1A1A1F" : "#ffffff",
                border: isHovered
                  ? `1px solid ${color.rgb}`
                  : isDark
                    ? "1px solid rgba(255,255,255,0.08)"
                    : "1px solid rgba(0,0,0,0.08)",
                boxShadow: isHovered
                  ? `0 0 0 1px ${color.rgb}33, 0 8px 32px ${color.rgb}22`
                  : isDark
                    ? "none"
                    : "0 1px 4px rgba(0,0,0,0.06)",
                transition: "border 0.25s ease, box-shadow 0.25s ease, transform 0.3s ease",
              }}
            >
              {/* Radial gradient overlay on hover */}
              <div
                className="absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-300"
                style={{
                  opacity: isHovered ? 1 : 0,
                  background: `radial-gradient(ellipse at top left, ${color.rgb}10 0%, transparent 65%)`,
                }}
              />

              {/* Icon Box */}
              <div className="relative z-10 text-xs">
                <div
                  className={`inline-flex items-center justify-center w-11 h-11 rounded-xl border transition-all duration-300 group-hover:scale-110 ${isDark ? "" : color.lightBox}`}
                  style={isDark ? {
                    backgroundColor: color.darkBg,
                    borderColor: color.darkBorder,
                    borderWidth: "1px",
                    borderStyle: "solid",
                  } : {}}
                >
                  <span className={`text-2xl ${isDark ? color.darkIcon : color.icon}`}>
                    {item.icon}
                  </span>
                </div>
              </div>

              {/* Title + Badge + Arrow */}
              <div className="relative z-10 flex items-end justify-between">
                <div className="flex flex-col">
                  <span
                    className="text-[11px] font-semibold tracking-widest uppercase transition-colors duration-300"
                    style={{ color: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.45)" }}
                  >
                    {item.name}
                  </span>

                  {item.name === "All Sites" && siteCount !== null && (
                    <span className="mt-1 inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-lg w-fit bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
                      {siteCount} Sites
                    </span>
                  )}
                  {item.name === "Rent Payment's" && upcomingPayments !== null && (
                    <span className="mt-1 inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-lg w-fit bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400">
                      {upcomingPayments} Upcoming
                    </span>
                  )}
                  {item.name === "Electricity Bill's" && electricityBillCount !== null && (
                    <span className="mt-1 inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-lg w-fit bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                      {electricityBillCount} Bills
                    </span>
                  )}
                  {item.name === "Rent Transaction's" && totalRentTransactions !== null && (
                    <span className="mt-1 inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-lg w-fit bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                      {totalRentTransactions} Paid
                    </span>
                  )}
                </div>

               <span
                    className={`
                      transition-all duration-300
                      ${isHovered ? "opacity-100" : "opacity-0"}
                      text-gray-500
                      dark:text-white
                    `}
                  >
                    <MoveRight size={16} />
                  </span>
              </div>
            </Link>
          );
        })()
        : null
      )}
    </div>
  );
}