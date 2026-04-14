"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import { Plus, Edit, Eye } from "lucide-react";

interface Owner {
  id: string;
  ownerName: string;
  ownerMobileNo: string;
}

interface Site {
  id: string;
  _id?: string;
  siteName: string;
  code: string;
  propertyLocation: string;
  monthlyRent: string;
  rentStatus: string;
  paidStatus: string;
  isActive: boolean;
  centreId: string;
  owners: Owner[];
  status: string;
}

const SiteOwnerCell = ({ siteId }: { siteId?: string }) => {
    const [ownerName, setOwnerName] = useState<string>("Loading...");

    useEffect(() => {
        if (!siteId) {
            setOwnerName("-");
            return;
        }

        const fetchOwner = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/rent/sites/${siteId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!res.ok) throw new Error();
                const json = await res.json();
                const siteData = json.data || json;
                if (siteData.owners && siteData.owners.length > 0) {
                    const names = siteData.owners.map((o: any) => o.ownerId?.ownerName || "Unknown").join(", ");
                    setOwnerName(names);
                } else {
                    setOwnerName("-");
                }
            } catch (err) {
                setOwnerName("-");
            }
        };

        fetchOwner();
    }, [siteId]);

    return <span>{ownerName}</span>;
};

export default function BasicTableOne() {
  const router = useRouter();
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchSites = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Authentication token not found");

        const url = `${process.env.NEXT_PUBLIC_API_URL}/api/rent/sites`;
        
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });


        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        const siteList = data.data || data.sites || (Array.isArray(data) ? data : []);
        setSites(siteList);
        setError(null);
      } catch (error) {
        console.error("Error fetching sites:", error);
        setError(
          error instanceof Error ? error.message : "Failed to fetch sites"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSites();
  }, []);

  const filteredSites = sites
    .filter((site) => {
      const searchString = searchTerm.toLowerCase();
      return (
        (site.code?.toLowerCase() ?? '').includes(searchString) ||
        (site.siteName?.toLowerCase() ?? '').includes(searchString) ||
        (site.propertyLocation?.toLowerCase() ?? '').includes(searchString) ||
        (site.paidStatus?.toLowerCase() ?? '').includes(searchString)
      );
    })
    .sort((a, b) => (a.code ?? "").localeCompare(b.code ?? ""));

  const navigateToTransactions = (siteId: string) => {
    router.push(`/sites/${siteId}/transactions`);
  };

  const navigateToEdit = (siteId: string) => {
    router.push(`/sites/${siteId}`);
  };

  if (loading) {
    return <div className="p-4 text-center">Loading...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-500">Error: {error}</div>;
  }

  return (
    <div className="space-y-2">
      {/* Search bar with sticky positioning */}
      <div className="flex items-center justify-between px-1 sticky top-0 z-20 py-2 border-b border-gray-200 dark:border-gray-700">
        <input
          type="text"
          placeholder="Search sites..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-sm px-3 py-1.5 text-sm rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-white/[0.05] dark:border-white/[0.1] dark:text-white"
        />
        <button
          onClick={() => router.push("/form-elements")}
          className="flex h-9 items-center gap-2 px-4 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 transition-all shadow-sm"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">Create Site</span>
        </button>
      </div>

      {/* Table container with fixed height for scrolling */}
      <div className="relative rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden">
              <div className="max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
                <Table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  {/* Fixed Header */}
                  <TableHeader className="sticky top-0 z-10 bg-white dark:bg-[#13141a] border-b border-gray-200 dark:border-gray-700">
                    <TableRow>
                      {[
                        { width: "w-16", label: "Sr No." },
                        { width: "w-24", label: "Site Code" },
                        { width: "w-40", label: "Site Name" },
                        { width: "w-40", label: "Location" },
                        { width: "w-32", label: "Owner" },
                        { width: "w-24", label: "Status" },
                        { width: "w-24", label: "Transaction" },
                        { width: "w-24", label: "Actions" },
                      ].map(({ width, label }) => (
                        <TableCell
                          key={label}
                          className={`${width} px-3 py-2 text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white whitespace-nowrap bg-gray-50 dark:bg-brand-500`}
                        >
                          {label}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHeader>

                  {/* Scrollable Body */}
                  <TableBody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredSites.map((site, index) => (
                      <TableRow
                        key={site._id || site.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <TableCell className="w-16 px-3 py-2 text-xs text-gray-900 dark:text-gray-100">
                          {index + 1}
                        </TableCell>
                        <TableCell className="w-24 px-3 py-2 text-xs text-gray-900 dark:text-gray-100">
                          {site.code}
                        </TableCell>
                        <TableCell className="w-40 px-3 py-2 text-xs text-gray-900 dark:text-gray-100">
                          {site.siteName}
                        </TableCell>
                        <TableCell className="w-40 px-3 py-2 text-xs text-gray-900 dark:text-gray-100">
                          {site.propertyLocation}
                        </TableCell>
                        <TableCell className="w-32 px-3 py-2 text-xs text-gray-900 dark:text-gray-100 font-medium">
                          <SiteOwnerCell siteId={site._id || site.id} />
                        </TableCell>
                        <TableCell className="w-24 px-3 py-2 text-xs text-gray-900 dark:text-gray-100">
                          <Badge
                            size="sm"
                            color={
                              site.status?.toLowerCase() === "active"
                                ? "success"
                                : site.status?.toLowerCase() === "inactive"
                                  ? "warning"
                                  : "error"
                            }
                          >
                            {site.status ?? "N/A"}
                          </Badge>
                        </TableCell>
                        <TableCell className="w-24 px-3 py-2 text-xs text-gray-900 dark:text-gray-100">
                           <button
                              onClick={() => navigateToTransactions(site._id || site.id)}
                              className="px-3 py-1 text-xs font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-all shadow-sm"
                              title="View Transactions"
                          >
                              HISTORY
                          </button>
                        </TableCell>
                        <TableCell className="w-24 px-3 py-2 text-xs text-gray-900 dark:text-gray-100">
                          <button
                            onClick={() => navigateToEdit(site._id || site.id)}
                            className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-all shadow-sm"
                          >
                            View
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </div>

        {filteredSites.length === 0 && (
          <div className="p-4 text-center text-gray-500">
            No results found for &quot;{searchTerm}&quot;
          </div>
        )}
      </div>
    </div>
  );
}