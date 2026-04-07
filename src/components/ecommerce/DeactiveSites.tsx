/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";
import { useEffect, useState, useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";

interface RentSite {
  code: number;
  id: number;
  site_name: string;
  property_location: string;
  monthly_rent: number;
  payment_day: string;
  paid_status: "Pending" | "Delivered" | "Canceled" | string | null;
}

export default function InactiveRentSitesTable() {
  const [rentSites, setRentSites] = useState<RentSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showTable, setShowTable] = useState(false);
  const [stats, setStats] = useState({
    totalSites: 0,
    totalPaidRentSites: 0,
    upcomingRentSitesCount: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [siteRes, statsRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/rental-dashboard/deactive-sites`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/rental-dashboard/stats`),
        ]);

        if (!siteRes.ok || !statsRes.ok) throw new Error("Failed to fetch data");

        const siteData = await siteRes.json();
        const statsData = await statsRes.json();

        setRentSites(siteData.deactiveSites || []);
        setStats(statsData);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredRentSites = useMemo(() => {
    if (!searchTerm) return rentSites;

    return rentSites.filter((site) =>
      site.site_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.code.toString().includes(searchTerm) ||
      site.property_location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.payment_day.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (site.paid_status && site.paid_status.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [rentSites, searchTerm]);

  const chartData = [
    { name: "Total Sites", value: stats.totalSites },
    { name: "Paid Sites", value: stats.totalPaidRentSites },
    { name: "Upcoming Rent", value: stats.upcomingRentSitesCount },
  ];

  const COLORS = ["#4f46e5", "#10b981", "#f59e0b"];

  return (
    <div className="w-full rounded-lg border shadow-sm border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-center p-4">

        <button
          onClick={() => setShowTable(!showTable)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-3 py-1 rounded"
        >
          {showTable ? "Show Graph" : "Show Table"}
        </button>
      </div>

      {!showTable ? (
        <div className="h-[300px] px-4">
            <h2 className="text-base font-semibold dark:text-white">Analysis</h2>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                label
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <>
          <div className="p-2">
            <h2 className="text-base font-semibold dark:text-white">Inactive Rent Sites</h2>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search by site name, location, payment day, or status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-white/[0.03] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <svg
                    className="w-4 h-4 text-gray-400 hover:text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>

          <div className="max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
            
            <Table className="min-w-full text-xs text-gray-600 dark:text-gray-300">
              <TableHeader className="bg-gray-200  dark:bg-[#4f46e5] dark:text-white text-[13px] border-y dark:border-gray-800">
                <TableRow>
                  <TableCell isHeader className="py-2 px-2 text-center">Site Code</TableCell>
                  <TableCell isHeader className="py-2 px-2 text-center">Site Name</TableCell>
                  <TableCell isHeader className="py-2 px-2 text-center">Location</TableCell>
                  <TableCell isHeader className="py-2 px-2 text-center">Payment Day</TableCell>
                  <TableCell isHeader className="py-2 px-2 text-center">Status</TableCell>
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-gray-100 dark:divide-gray-700">
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-3 text-center">
                      Loading inactive rent sites...
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-3 text-center text-red-500">
                      {error}
                    </TableCell>
                  </TableRow>
                ) : filteredRentSites.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-3 text-center">
                      {searchTerm
                        ? `No rent sites found matching "${searchTerm}".`
                        : "No inactive rent sites found."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRentSites.map((site) => (
                    <TableRow key={site.id}>
                      <TableCell className="py-2 px-2 text-center">{site.code}</TableCell>
                      <TableCell className="py-2 px-2 text-center">{site.site_name}</TableCell>
                      <TableCell className="py-2 px-2 text-center">{site.property_location}</TableCell>
                      <TableCell className="py-2 px-2 text-center">{site.payment_day}</TableCell>
                      <TableCell className="py-2 px-2 text-center">
                        <Badge
                          size="sm"
                          color={
                            site.paid_status === "Delivered"
                              ? "success"
                              : site.paid_status === "Pending"
                              ? "warning"
                              : "error"
                          }
                        >
                          {site.paid_status || "N/A"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
