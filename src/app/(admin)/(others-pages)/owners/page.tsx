import OwnerTable from "@/components/owners/OwnerTable";
import { Metadata } from "next";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "Owner Management | Rental Admin",
  description: "Manage property owners and their bank accounts.",
};

export default function OwnersPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}


      <OwnerTable />
    </div>
  );
}
