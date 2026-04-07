"use client";
import { useEffect, useState, useMemo } from "react";
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

export default function OverdueRentSitesTable() {
    const [rentSites, setRentSites] = useState<RentSite[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const fetchRentSites = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/rental-dashboard/overdue-rent-sites`);
                if (!res.ok) throw new Error("Failed to fetch overdue sites");
                const data = await res.json();
                setRentSites(data.overdueSites || []);
            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : "Something went wrong");
            } finally {
                setLoading(false);
            }
        };

        fetchRentSites();
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

    return (
        <div className="w-full rounded-lg border shadow-sm border-gray-200 dark:border-gray-700">
            {/* Search Bar */}
            <div className="p-2">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        placeholder="Search by site name, location, payment day, or status..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-blue-500/0 focus:border-transparent bg-white dark:bg-white/[0.03] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    />
                    {searchTerm && (
                        <button onClick={() => setSearchTerm("")} className="absolute inset-y-0 right-0 pr-3 flex items-center">
                            <svg className="w-4 h-4 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {/* Table Container */}
            <div className="max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 relative">
                <Table className="min-w-full text-xs text-gray-600 dark:text-gray-300">
                    <TableHeader className="bg-gray-200 dark:bg-[#4f46e5] dark:text-white text-[13px] border-y dark:border-gray-800 sticky top-0 z-10">
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
                                <TableCell colSpan={5} className="py-3 text-center">Loading overdue rent sites...</TableCell>
                            </TableRow>
                        ) : error ? (
                            <TableRow>
                                <TableCell colSpan={5} className="py-3 text-center text-red-500">{error}</TableCell>
                            </TableRow>
                        ) : filteredRentSites.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="py-3 text-center">
                                    {searchTerm
                                        ? `No overdue rent sites found matching "${searchTerm}".`
                                        : "No overdue rent payments found."}
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
        </div>
    );
}
