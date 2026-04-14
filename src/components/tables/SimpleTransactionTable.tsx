"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";

interface SimpleTransaction {
  transactionId?: string;
  id?: string;
  _id?: string;
  category: string;
  siteCode: string | null;
  siteName: string | null;
  ownerName: string | null;
  monthYear: string;
  paymentAmount?: number;
  pendingAmount?: number;
  expectedAmount?: number;
  paymentDate?: string;
  paidStatus: string;
  utrNumber?: string | null;
  paymentType?: string;
}

interface Props {
  data: SimpleTransaction[];
  title: string;
}

export default function SimpleTransactionTable({ data, title }: Props) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return '-';
    }
  };

  return (
    <div className="w-full">
      <div className="relative rounded-xl border border-white/[0.05] bg-[#0B0C10] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden">
              <div className="max-h-[450px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/[0.1] scrollbar-track-transparent">
                <Table className="min-w-full border-collapse">
                  <TableHeader className="sticky top-0 z-10 bg-[#121418] border-b border-white/[0.08]">
                    <TableRow className="border-none">
                      {[
                        { label: "Sr No", align: "text-center", width: "w-12" },
                        { label: "Site Code", align: "text-left", width: "w-24" },
                        { label: "Site Name", align: "text-left", width: "w-40" },
                        { label: "Owner", align: "text-left", width: "w-32" },
                        { label: "Month", align: "text-center", width: "w-24" },
                        { label: "Amount", align: "text-right", width: "w-28" },
                        { label: "Date", align: "text-center", width: "w-28" },
                        { label: "Status", align: "text-center", width: "w-20" },
                        { label: "Reference", align: "text-left", width: "w-32" }
                      ].map((col) => (
                        <TableCell
                          key={col.label}
                          className={`${col.width} px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-none ${col.align}`}
                        >
                          {col.label}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data && data.length > 0 ? (
                      data.map((item, index) => (
                        <TableRow
                          key={item.transactionId || item.id || item._id || index}
                          className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors group"
                        >
                          <TableCell className="px-4 py-3 text-[11px] text-gray-500 text-center">
                            {index + 1}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-[11px] text-white font-bold">
                            {item.siteCode || "-"}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-[11px] text-gray-300">
                            {item.siteName || "-"}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-[11px] text-gray-400 font-medium italic">
                            {item.ownerName || "-"}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-[11px] text-gray-500 text-center font-mono">
                            {item.monthYear}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-[11px] font-bold text-emerald-400 text-right">
                            {formatCurrency(item.pendingAmount ?? item.paymentAmount ?? 0)}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-[11px] text-gray-500 text-center">
                            {formatDate(item.paymentDate)}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-center">
                            <Badge
                              size="sm"
                              className="text-[8px] uppercase tracking-tighter px-2 h-4 leading-none inline-flex font-black"
                              variant="light"
                              color={
                                item.paidStatus?.toLowerCase() === "paid"
                                  ? "success"
                                  : item.paidStatus?.toLowerCase() === "pending"
                                    ? "warning"
                                    : "error"
                              }
                            >
                              {item.paidStatus || "N/A"}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-[10px] text-gray-600 font-mono group-hover:text-gray-400 transition-colors">
                            {item.utrNumber || (item.transactionId || item.id || "")?.substring(0, 12) || "-"}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={9} className="px-4 py-12 text-center">
                          <div className="flex flex-col items-center gap-2">
                             <span className="text-gray-600 text-sm font-medium">No transactions available</span>
                             <span className="text-gray-700 text-xs">Direct response data for this category is currently empty.</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

