
"use client";
import React, { useState, useEffect } from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";

interface User {
  id: number;
  name: string;
  userName: string;
  role: string;
  createdAt: string;
}

export default function UsersTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isOpen, openModal, closeModal } = useModal();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    userName: '',
    password: '',
    role: 'user'
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}` // Assuming token is stored in localStorage
          }
        });

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        setUsers(data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch users:", err);
        setError("Failed to load users. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleCreateUser = async () => {
    try {
      setIsAddingUser(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newUser)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create user');
      }

      // Refresh users list
      const updatedResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const updatedUsers = await updatedResponse.json();
      setUsers(updatedUsers);

      // Reset form and close modal
      setNewUser({
        name: '',
        userName: '',
        password: '',
        role: 'user'
      });
      closeModal();
    } catch (err) {
      console.error("Failed to create user:", err);
      alert((err as Error).message || "Failed to create user. Please try again later.");
    } finally {
      setIsAddingUser(false);
    }
  };

  const handleDeleteUser = async (userId: unknown) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      setIsDeleting(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      // Remove user from the state
      setUsers(users.filter(user => user.id !== userId));
    } catch (err) {
      console.error("Failed to delete user:", err);
      alert("Failed to delete user. Please try again later.");
    } finally {
      setIsDeleting(false);
    }
  };


  const handleSave = () => {
    // Handle save logic here - would need to implement API call to update user
    console.log("Saving changes for user:", selectedUser);
    closeModal();
  };

  const formatDate = (dateString: string | number | Date) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return (
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <p className="text-center text-gray-500 dark:text-gray-400">Loading users...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <p className="text-center text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <>
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              All Users
            </h4>

            <div className="flex flex-wrap items-center gap-3">
              {/* Search Input */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-64 px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-700 dark:bg-white/[0.03] dark:text-white/90"
                />
              </div>

              {/* Role Filter */}
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
              >
                <option value="" className="dark:bg-gray-950">All Roles</option>
                <option value="admin" className="dark:bg-gray-950">Admin</option>
                <option value="user" className="dark:bg-gray-950">User</option>
                <option value="acestaff" className="dark:bg-gray-950">Ace Staff</option>
              </select>

              <Button size="sm" variant="primary" onClick={() => {
                setSelectedUser(null);
                openModal();
              }}>
                Add New User
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead className="bg-gray-50 dark:bg-[#4f46e5]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">Username</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">Created At</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-[#121212] divide-y divide-gray-200 dark:divide-gray-800">
                {users
                  .filter((user) => {
                    const matchesSearch =
                      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      user.userName.toLowerCase().includes(searchTerm.toLowerCase());
                    const matchesRole = roleFilter === "" || user.role === roleFilter;
                    return matchesSearch && matchesRole;
                  })
                  .map((user) => (
                    <tr key={user.id}>
                      <td className="px-4 py-4 text-sm text-gray-800 dark:text-white/90">{user.id}</td>
                      <td className="px-4 py-4 text-sm text-gray-800 dark:text-white/90">{user.name}</td>
                      <td className="px-4 py-4 text-sm text-gray-800 dark:text-white/90">{user.userName}</td>
                      <td className="px-4 py-4 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs ${user.role === 'admin'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                          : user.role === 'acestaff'
                            ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                            : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-800 dark:text-white/90">{formatDate(user.createdAt)}</td>
                      <td className="px-4 py-4 text-sm">
                        <div className="flex items-center gap-3">
                          {/* <button
                          onClick={() => handleEditUser(user)}
                          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          disabled={isDeleting}
                        >
                          <svg
                            className="fill-current"
                            width="18"
                            height="18"
                            viewBox="0 0 18 18"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.6359 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.1262 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z"
                            />
                          </svg>
                          Edit
                        </button> */}
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="inline-flex items-center gap-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                            disabled={isDeleting}
                          >
                            <svg
                              className="fill-current"
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                            >
                              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                            </svg>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isOpen && (
        <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
          <div className="relative w-full p-4 overflow-y-auto bg-white no-scrollbar rounded-3xl dark:bg-[#121212] lg:p-11">
            <div className="px-2 pr-14">
              <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                {selectedUser ? 'Edit User' : 'Create New User'}
              </h4>
              <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
                {selectedUser ? 'Update user details.' : 'Create a new user account.'}
              </p>
            </div>
            <div className="flex flex-col">
              <div className="px-2 overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                  <div>
                    <Label>Name</Label>
                    <Input
                      type="text"
                      value={selectedUser ? selectedUser.name : newUser.name}
                      onChange={(e) => selectedUser
                        ? setSelectedUser({ ...selectedUser, name: e.target.value })
                        : setNewUser({ ...newUser, name: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <Label>Username</Label>
                    <Input
                      type="text"
                      value={selectedUser ? selectedUser.userName : newUser.userName}
                      onChange={(e) => selectedUser
                        ? setSelectedUser({ ...selectedUser, userName: e.target.value })
                        : setNewUser({ ...newUser, userName: e.target.value })
                      }
                    />
                  </div>

                  {!selectedUser && (
                    <div>
                      <Label>Password</Label>
                      <Input
                        type="password"
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      />
                    </div>
                  )}

                  <div>
                    <Label>Role</Label>
                    <select
                      className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
                      value={selectedUser ? selectedUser.role : newUser.role}
                      onChange={(e) => selectedUser
                        ? setSelectedUser({ ...selectedUser, role: e.target.value })
                        : setNewUser({ ...newUser, role: e.target.value })
                      }
                    >
                      <option value="user" className="dark:bg-gray-950">User</option>
                      <option value="admin" className="dark:bg-gray-950">Admin</option>
                      <option value="acestaff" className="dark:bg-gray-950">Ace Staff</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
                <Button size="sm" variant="outline" onClick={closeModal}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={selectedUser ? handleSave : handleCreateUser}
                  disabled={isAddingUser}
                >
                  {selectedUser ? 'Save Changes' : 'Create User'}
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}