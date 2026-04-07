'use client';

import React, { useEffect, useState, useCallback } from 'react';

// Define types for the site props
interface SiteProps {
  monthly_rent?: string;
  agreement_years?: string;
  yearly_escalation_percentage?: string;
  agreement_date?: string;
}

// Define the structure for each row in the escalation table
interface EscalationRow {
  period: string;
  monthlyRent: string;
  yearlyTotal: string;
  increase: string;
}

export default function RentEscalationTable({ site }: { site: SiteProps }) {
  const [escalationTable, setEscalationTable] = useState<EscalationRow[]>([]);

  // Memoize the calculateEscalation function with useCallback
  const calculateEscalation = useCallback(() => {
    // Check if required data exists
    if (!site || !site.monthly_rent || !site.agreement_years || !site.yearly_escalation_percentage || !site.agreement_date) {
      return;
    }

    const baseRent = parseFloat(site.monthly_rent);
    const years = parseInt(site.agreement_years);
    const escalationRate = parseFloat(site.yearly_escalation_percentage) / 100;
    const agreementDate = site.agreement_date;

    // Check if all required values are present and valid
    if (isNaN(baseRent) || isNaN(years) || isNaN(escalationRate) || !agreementDate) {
      console.log('Missing or invalid values for escalation calculation');
      return;
    }

    const tableData: EscalationRow[] = [];
    let currentRent = baseRent;
    let previousRent = baseRent;
    // Changed 'let' to 'const' since currentDate is modified but not reassigned
    const currentDate = new Date(agreementDate);

    for (let year = 1; year <= years; year++) {
      if (year > 1) {
        currentRent = previousRent * (1 + escalationRate);
      }

      const yearlyRent = currentRent * 12;
      const increaseAmount = currentRent - previousRent;

      // Format the date range
      const formattedStartDate = `${currentDate.getMonth() + 1}/${currentDate.getFullYear().toString().substr(2)}`;
      const nextDate = new Date(currentDate);
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      nextDate.setDate(nextDate.getDate() - 1);
      const formattedEndDate = `${nextDate.getMonth() + 1}/${nextDate.getFullYear().toString().substr(2)}`;

      tableData.push({
        period: `${formattedStartDate} - ${formattedEndDate}`,
        monthlyRent: currentRent.toFixed(0),
        yearlyTotal: yearlyRent.toFixed(0),
        increase: year === 1 ? '-' : increaseAmount.toFixed(0)
      });

      previousRent = currentRent;
      currentDate.setFullYear(currentDate.getFullYear() + 1);
    }

    setEscalationTable(tableData);
  }, [site]); // Added site to the dependency array

  // Calculate escalation whenever site data changes
  useEffect(() => {
    calculateEscalation();
  }, [calculateEscalation]); // Now correctly depends on calculateEscalation

  if (escalationTable.length === 0) {
    return (
      <div className="p-3 text-gray-500 text-center">
        No escalation data available. Please ensure all required fields are filled.
      </div>
    );
  }

  return (
    <div className="relative rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full align-middle">
          <div className="overflow-hidden">
            <div className="max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-black dark:text-white">
                <thead className="sticky top-0 z-10 bg-white dark:bg-[#121212] border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="border p-2 text-left">Period</th>
                    <th className="border p-2 text-left">Monthly Rent</th>
                    <th className="border p-2 text-left">Yearly Total</th>
                    <th className="border p-2 text-left">Increase</th>
                  </tr>
                </thead>
                <tbody>
                  {escalationTable.map((row, index) => (
                    <tr key={index} className="border-b">
                      <td className="border p-2">{row.period}</td>
                      <td className="border p-2">₹{row.monthlyRent}</td>
                      <td className="border p-2">₹{row.yearlyTotal}</td>
                      <td className="border p-2">{row.increase === '-' ? '-' : `₹${row.increase}`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}