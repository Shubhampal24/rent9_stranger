/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react/no-unescaped-entities */

"use client";

import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";

import { Pencil, Trash2, Search, Plus, Calendar, MapPin, Building2, User } from "lucide-react";
import Button from "../ui/button/Button";

interface MasterData {
  _id?: string; // Correct ID field name
  srNo: number;
  cityName: string;
  spaName: string;
  area: string;
  spaCode: string;
  openingDate: string;
  status: string;
  lineTrack: string;
  location: string;
  mobile1: string;
  mobile2: string;
  mobile3: string;
  email: string;
  address: string;
  agreement: string;
  remark: string;
}

// Modal for editing record
interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: MasterData | null;
  onSave: (data: MasterData) => void;
  mode?: "edit" | "add"; // Add this line
}

const EditModal: React.FC<EditModalProps> = ({ isOpen, onClose, data, onSave, mode = "edit" }) => {
  const [formData, setFormData] = useState<MasterData | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) {
      setFormData({ ...data });
    } else if (mode === "add") {
      setFormData({
        srNo: 0,
        cityName: "",
        spaName: "",
        area: "",
        spaCode: "",
        openingDate: "",
        status: "Open",
        lineTrack: "",
        location: "",
        mobile1: "",
        mobile2: "",
        mobile3: "",
        email: "",
        address: "",
        agreement: "",
        remark: "",
      });
    }
  }, [data, mode]);

  if (!isOpen || !formData) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 ">
      <div className="bg-white dark:bg-gray-800 dark:text-amber-50 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-hide" style={{
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }}>
        <h2 className="text-xl font-semibold mb-2">{mode === "add" ? "Add New Record" : "Edit Record"}</h2>
        <form onSubmit={handleSubmit} className="space-y-2">
          {/* ...existing form fields... */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">SPA Name</label>
              <input
                name="spaName"
                value={formData.spaName}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">SPA Code</label>
              <input
                name="spaCode"
                value={formData.spaCode}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">City</label>
              <input
                name="cityName"
                value={formData.cityName}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Area</label>
              <input
                name="area"
                value={formData.area}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Opening Date</label>
              <input
                type="date"
                name="openingDate"
                value={formData.openingDate ? formData.openingDate.split('T')[0] : ''}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              >
                <option value="Open" className="dark:bg-gray-900">Open</option>
                <option value="Process" className="dark:bg-gray-900">Process</option>
                <option value="Close" className="dark:bg-gray-900">Close</option>
                <option value="T Close" className="dark:bg-gray-900">T Close</option>
                <option value="Handover" className="dark:bg-gray-900">Handover</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Line Track</label>
              <input
                name="lineTrack"
                value={formData.lineTrack || ''}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Location</label>
              <input
                name="location"
                value={formData.location || ''}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Mobile 1</label>
              <input
                name="mobile1"
                value={formData.mobile1 || ''}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Mobile 2</label>
              <input
                name="mobile2"
                value={formData.mobile2 || ''}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Mobile 3</label>
              <input
                name="mobile3"
                value={formData.mobile3 || ''}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
              <input
                name="email"
                value={formData.email || ''}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Address</label>
            <input
              name="address"
              value={formData.address || ''}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Agreement</label>
              <input
                name="agreement"
                value={formData.agreement || ''}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Remark</label>
              <input
                name="remark"
                value={formData.remark || ''}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
            >
              {saving ? (mode === "add" ? "Adding..." : "Saving...") : (mode === "add" ? "Add Record" : "Save Changes")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};


export default function MasterTable() {
  const [masterData, setMasterData] = useState<MasterData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<MasterData | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [updateStatus, setUpdateStatus] = useState<{
    message: string;
    type: 'success' | 'error' | null;
  }>({ message: '', type: null });

  useEffect(() => {
    fetchMasterData();
  }, []);

  const fetchMasterData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found");

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/rent/master/`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      console.log("Status:", response.status);
      console.log("Fetch response:", response);
      console.log("Fetch response status:", response.status);
      console.log("Status:", response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("data",data)
      
      // Inject SR NO if not provided by backend to ensure table is populated and CRUD logic works
      const mappedData = (data.data || []).map((item: any, index: number) => ({
        ...item,
        srNo: item.srNo || index + 1
      }));
      
      setMasterData(mappedData);
      setError(null);
    } catch (error) {
      console.error("Error fetching master data:", error);
      setError(
        error instanceof Error ? error.message : "Failed to fetch master data"
      );
    } finally {
      setLoading(false);
    }
  };
  const handleAddClick = () => {
    setIsAddModalOpen(true);
  };

  const handleAddRecord = async (newData: MasterData) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/rent/master/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newData) // Use flat object
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setMasterData((prev) => [...prev, result.data]);
      setUpdateStatus({
        message: "Record added successfully!",
        type: "success",
      });
      setTimeout(() => setUpdateStatus({ message: '', type: null }), 3000);
      setIsAddModalOpen(false);
      fetchMasterData(); // Refresh to ensure correct sorting/srNo from backend
    } catch (error) {
      setUpdateStatus({
        message: error instanceof Error ? error.message : "Failed to add record",
        type: "error",
      });
    }
  };
  const handleEditClick = (record: MasterData) => {
    setCurrentRecord(record);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentRecord(null);
  };

  const handleSaveChanges = async (updatedData: MasterData) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found");

      // Use _id for the API call
      const recordId = updatedData._id;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/rent/master/${recordId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedData), // Use flat object
        }
      );

      console.log("API Response Status:", response);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("API Response :", result);
      console.log("API Response Status :", response.status)

      // Update the local data
      setMasterData((prevData) =>
        prevData.map((item) =>
          item.srNo === updatedData.srNo ? updatedData : item
        )
      );

      setUpdateStatus({
        message: "Record updated successfully!",
        type: "success",
      });

      setTimeout(() => {
        setUpdateStatus({ message: '', type: null });
      }, 3000);

      handleCloseModal();
      fetchMasterData(); // Refresh to ensure data integrity
    } catch (error) {
      console.error("Error updating record:", error);
      setUpdateStatus({
        message: error instanceof Error ? error.message : "Failed to update record",
        type: "error",
      });
    }
  };



  const handleDelete = async (record: MasterData) => {
    if (!window.confirm(`Are you sure you want to delete "${record.spaName}"?`)) return;
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found");

      const recordId = record._id;
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/rent/master/${recordId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("API Response :", response);
      console.log("API Response Status :", response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setMasterData((prev) => prev.filter((item) => item.srNo !== record.srNo));
      setUpdateStatus({
        message: "Record deleted successfully!",
        type: "success",
      });
      setTimeout(() => setUpdateStatus({ message: '', type: null }), 3000);
      fetchMasterData(); // Refresh to ensure correct srNo count
    } catch (error) {
      setUpdateStatus({
        message: error instanceof Error ? error.message : "Failed to delete record",
        type: "error",
      });
    }
  };
    const filteredData = masterData
      .filter((item) => {
        const searchString = searchTerm.toLowerCase();
        return (
          (item.spaCode || '').toLowerCase().includes(searchString) ||
          (item.spaName || '').toLowerCase().includes(searchString) ||
          (item.cityName || '').toLowerCase().includes(searchString) ||
          (item.area || '').toLowerCase().includes(searchString) ||
          (item.status || '').toLowerCase().includes(searchString)
        );
      })
      .sort((a, b) => a.srNo - b.srNo);

  if (loading) {
    return <div className="p-4 text-center">Loading...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-500">Error: {error}</div>;
  }

  return (
    <div className="space-y-2">
      {/* Status message */}
      {updateStatus.type && (
        <div
          className={`p-4 rounded-md ${updateStatus.type === 'success'
            ? 'bg-green-50 text-green-800 border border-green-200'
            : 'bg-red-50 text-red-800 border border-red-200'
            }`}
        >
          {updateStatus.message}
        </div>
      )}
      {/* Add New Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-3 py-4 border-b border-gray-200 dark:border-gray-700 gap-4">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search records..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:bg-white/[0.05] dark:border-white/[0.1] dark:text-white text-sm shadow-sm"
          />
        </div>
        <Button
          variant="primary"
          onClick={handleAddClick}
          className="flex w-full sm:w-auto items-center justify-center gap-1.5 text-xs py-2 px-4 rounded-lg shadow-md transition-all hover:shadow-lg active:scale-95"
          size="sm"
        >
          <Plus size={14} strokeWidth={2.5} />
          <span>Add New</span>
        </Button>
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
                        { width: "w-16", label: "Sr No" },
                        { width: "w-24", label: "SPA Code" },
                        { width: "w-40", label: "SPA Name" },
                        { width: "w-32", label: "City" },
                        { width: "w-32", label: "Area" },
                        { width: "w-32", label: "Opening Date" },
                        { width: "w-24", label: "Status" },
                        { width: "w-48", label: "Address" }, // Reduced from w-96 to w-48
                        { width: "w-24", label: "Actions" },
                      ].map(({ width, label }) => (
                        <TableCell
                          key={label}
                          className={`${width} px-6 py-4 font-bold text-gray-900 dark:text-white whitespace-nowrap dark:bg-brand-500 text-center dark:from-gray-800 dark:to-gray-700 border-r border-gray-200 dark:border-gray-600 shadow-sm`}
                        >
                          <div className="flex items-center space-x-1">
                            <span className="text-sm uppercase tracking-wide">{label}</span>
                          </div>
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHeader>

                  {/* Scrollable Body */}
                  <TableBody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredData.map((item) => (
                      <TableRow
                        key={item._id || item.srNo}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <TableCell className="w-16 px-6 py-4 text-gray-900 dark:text-gray-100">{item.srNo}</TableCell>
                        <TableCell className="w-16 px-6 py-4 text-gray-900 dark:text-gray-100">{item.spaCode}</TableCell>
                        <TableCell className="w-16 px-6 py-4 text-gray-900 dark:text-gray-100">{item.spaName}</TableCell>
                        <TableCell className="w-16 px-6 py-4 text-gray-900 dark:text-gray-100">{item.cityName}</TableCell>
                        <TableCell className="w-16 px-6 py-4 text-gray-900 dark:text-gray-100">{item.area}</TableCell>

                        <TableCell className="w-16 px-6 py-4 text-gray-900 dark:text-gray-100">
                          {item.openingDate ? new Date(item.openingDate).toLocaleDateString() : '-'}
                        </TableCell>
                        <TableCell className="w-16 px-6 py-4 text-gray-900 dark:text-gray-100">
                         <Badge
                                size="sm"
                                color={
                                  (item.status || '').toLowerCase() === "open"
                                    ? "success"
                                    : (item.status || '').toLowerCase() === "pending"
                                      ? "warning"
                                      : "error"
                                }
                              >
                                {item.status || '-'}
                              </Badge>
                        </TableCell>
                        <TableCell className="w-48 px-6 py-4 text-gray-900 dark:text-gray-100">
                          <div className="truncate max-w-48" title={item.address || '-'}>
                            {item.address || '-'}
                          </div>
                        </TableCell>
                        <TableCell className="w-24 px-6 py-4 text-gray-900 dark:text-gray-100">
                          <div className="flex flex-row gap-1">
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => handleEditClick(item)}
                              className="flex items-center p-0.5 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md min-w-0"
                            >
                              <Pencil className="h-3 w-3 mr-0.5" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(item)}
                              className="flex items-center p-0.5 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md min-w-0"
                            >
                              <Trash2 className="h-3 w-3 mr-0.5" />
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </div>

        {filteredData.length === 0 && (
          <div className="p-4 text-center text-gray-500">
            No results found for "{searchTerm}"
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {isModalOpen && (
        <EditModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          data={currentRecord}
          onSave={handleSaveChanges}
        />
      )}
      {/* Add Modal */}
      {isAddModalOpen && (
        <EditModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          data={null}
          onSave={handleAddRecord}
          mode="add"
        />
      )}
    </div>
  );
}