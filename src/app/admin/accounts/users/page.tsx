// page.tsx
"use client";

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { Trash2, Download, MoreHorizontal, UserCheck, UserX, User, UserMinus, UserPlus, X, Save, Shield, CheckCircle, XCircle, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
  SortingState,
} from '@tanstack/react-table';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';

// --- GLOBAL ROLE MAPS ---
const RoleMap = { 1: 'ADMIN', 2: 'VENDOR', 3: 'USER' };

interface User {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  username: string;
  date_joined: string;
  role: { id: number, name: string };
  is_active: boolean; // Assuming this is now returned by API
  is_email_verified: boolean;
  // Note: Add any other fields you want to display/manage here
}

interface EditUserModalProps {
  user: User;
  onClose: () => void;
  onUpdate: (userId: number, roleId: number, isActive: boolean) => Promise<void>;
  isLoading: boolean;
}

// --- Mock Modal Component (Replace with your actual Modal/Dialog component) ---
const EditUserModal: React.FC<EditUserModalProps> = ({ user, onClose, onUpdate, isLoading }) => {
  const [selectedRole, setSelectedRole] = useState(user.role.id);
  const [selectedIsActive, setSelectedIsActive] = useState(user.is_active);

  const roleOptions = useMemo(() => [
    { id: 1, name: 'ADMIN' },
    { id: 2, name: 'VENDOR' },
    { id: 3, name: 'USER' },
  ], []);

  const handleSave = () => {
    onUpdate(user.id, selectedRole, selectedIsActive);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6">
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h2 className="text-xl font-bold text-gray-800">Manage {user.full_name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div className='flex justify-between items-center'>
            <label className="font-semibold text-gray-700">Role</label>
            <Select
              value={String(selectedRole)}
              onValueChange={value => setSelectedRole(Number(value))}
              disabled={isLoading}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map(role => (
                  <SelectItem key={role.id} value={String(role.id)}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='flex justify-between items-center'>
            <label className="font-semibold text-gray-700">Status (Active/Inactive)</label>
            <Select
              value={String(selectedIsActive)}
              onValueChange={value => setSelectedIsActive(value === 'true')}
              disabled={isLoading}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Active (Can Login)</SelectItem>
                <SelectItem value="false">Inactive (Blocked)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className='flex justify-between items-center border-t pt-4'>
            <label className="font-semibold text-gray-700">Email Verification</label>
            <span className={`px-3 py-1 text-xs font-medium rounded-full ${user.is_email_verified ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {user.is_email_verified ? 'Verified' : 'Unverified'}
            </span>
          </div>

        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <Button onClick={onClose} className="bg-gray-200 text-gray-700 hover:bg-gray-300">
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isLoading || (selectedRole === user.role.id && selectedIsActive === user.is_active)}
            className="bg-[#5CA131] text-white hover:bg-[#4a8f28] flex items-center gap-2"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
};
// --- END Mock Modal Component ---


const UsersTable = () => {
  const [data, setData] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // States for filtering (server-side, for initial fetch)
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');

  // States for client-side search and pagination
  const [page, setPage] = useState(1);
  const pageSize = 10; // Adjusted for better viewing
  const [globalFilter, setGlobalFilter] = useState('');
  const [sortBy, setSortBy] = useState<SortingState>([
    { id: 'date_joined', desc: true }
  ]);
  

  // --- API & State Management ---

  // Fetches ALL data matching server-side filters once
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      if (statusFilter !== 'all') {
        // API field is 'is_email_verified'
        params.append('is_email_verified', statusFilter === 'verified' ? 'true' : 'false');
      }

      if (roleFilter !== 'all') {
        // API field is 'role__name'
        params.append('role__name', roleFilter);
      }

      // Fetch all data that matches the status and role filters
      const allData: User[] = [];
      let nextPage = 1;
      let hasMore = true;

      while (hasMore) {
        const response = await api.get(`/users/`, {
          params: {
            ...Object.fromEntries(params.entries()),
            page: String(nextPage),
            page_size: '100', // Fetch large page size
          },
        });
        
        allData.push(...response.data.results);
        if (response.data.next) {
          nextPage++;
        } else {
          hasMore = false;
        }
      }
      
      setData(allData);
      setPage(1); // Reset page to 1 whenever server filters change
    } catch (error) {
      console.error("Failed to fetch user data:", error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, roleFilter]);

  useEffect(() => {
    fetchAllData();
  }, [statusFilter, roleFilter, fetchAllData]); // Re-fetch only when server-side filters change

  
  // --- Admin Action Handlers ---

  const handleUserUpdate = useCallback(async (userId: number, newRoleId: number, newIsActive: boolean) => {
    setIsUpdating(true);
    try {
      // Use the dedicated admin_update endpoint
      const response = await api.patch(`/users/${userId}/admin_update/`, {
        role_id: newRoleId,
        is_active: newIsActive,
      });

      // Update the client-side state with the response data
      setData(prevData => prevData.map(user => 
        user.id === userId ? { 
          ...user, 
          role: response.data.role, 
          is_active: response.data.is_active,
        } : user
      ));

      setEditingUser(null); // Close modal on success
      alert(`User ${userId} updated successfully!`);
    } catch (error) {
      console.error("Failed to update user:", error);
      alert('Error updating user. Check console for details.');
    } finally {
      setIsUpdating(false);
    }
  }, []);

  const handleUserDelete = useCallback(async (userId: number) => {
    if (!confirm(`Are you sure you want to delete user ID ${userId}?`)) return;

    try {
      // DELETE endpoint
      await api.delete(`/users/${userId}/`);

      // Remove from client-side state
      setData(prevData => prevData.filter(user => user.id !== userId));

      alert(`User ${userId} deleted successfully.`);
    } catch (error) {
      console.error("Failed to delete user:", error);
      alert('Error deleting user. Check console for details.');
    }
  }, []);

  // --- Client-Side Search, Filter, Sort, Paginate ---

  const searchedAndSortedData = useMemo(() => {
    let result = [...data];

    // Apply client-side search filtering
    if (globalFilter) {
      const filterValue = globalFilter.toLowerCase();
      result = result.filter(user =>
        user.full_name?.toLowerCase().includes(filterValue) ||
        user.email?.toLowerCase().includes(filterValue) ||
        user.username?.toLowerCase().includes(filterValue)
      );
    }
    
    // Apply client-side sorting
    if (sortBy.length > 0) {
      const sortField = sortBy[0];
      const { id, desc } = sortField;

      result.sort((a, b) => {
        const valA = (a as any)[id];
        const valB = (b as any)[id];

        // Custom sorting logic for role ID
        if (id === 'role.id') {
            const roleIdA = a.role.id;
            const roleIdB = b.role.id;
            return desc ? roleIdB - roleIdA : roleIdA - roleIdB;
        }

        // Custom sorting logic for date_joined
        if (id === 'date_joined') {
          const dateA = new Date(valA).getTime();
          const dateB = new Date(valB).getTime();
          return desc ? dateB - dateA : dateA - dateB;
        }
        
        // Default sorting
        if (valA === valB) return 0;
        return desc ? (valB > valA ? 1 : -1) : (valA > valB ? 1 : -1);
      });
    }

    return result;
  }, [data, globalFilter, sortBy]);


  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return searchedAndSortedData.slice(start, end);
  }, [searchedAndSortedData, page, pageSize]);

  const totalUsers = searchedAndSortedData.length;
  const totalPages = Math.ceil(totalUsers / pageSize);

  // --- Table Column Definitions ---

  const columns = useMemo<ColumnDef<User>[]>(
    () => [
      {
        header: 'ID',
        accessorKey: 'id',
        size: 64,
        cell: info => info.getValue(),
      },
      {
        accessorKey: 'full_name',
        header: 'Full Name',
        size: 150,
      },
      {
        accessorKey: 'email',
        header: 'Email',
        size: 200,
      },
      {
        accessorKey: 'phone',
        header: 'Mobile No.',
        size: 120,
        cell: info => info.getValue() || 'N/A',
      },
      {
        accessorKey: 'role.id',
        header: 'Role',
        size: 100,
        cell: ({ row }) => {
            const roleId = row.original.role.id;
            const roleName = RoleMap[roleId as keyof typeof RoleMap] || 'USER';
            const colorClass = roleId === 1 ? 'bg-purple-100 text-purple-800' : 
                               roleId === 2 ? 'bg-blue-100 text-blue-800' :
                               'bg-gray-100 text-gray-700';
            return <span className={`px-2 py-1 text-xs font-medium rounded-full ${colorClass}`}>{roleName}</span>;
        },
      },
      {
        accessorKey: 'is_active',
        header: 'Status',
        size: 100,
        cell: ({ row }) => {
            const isActive = row.original.is_active;
            const verified = row.original.is_email_verified;

            return (
                <div className='flex flex-col gap-1'>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {isActive ? 'Active' : 'Inactive'}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${verified ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {verified ? 'Email Verified' : 'Unverified'}
                    </span>
                </div>
            );
        },
      },
      {
        accessorKey: 'date_joined',
        header: 'Date Joined',
        size: 120,
        cell: info => new Date(info.getValue() as string).toLocaleDateString(),
      },
      {
        id: 'actions',
        header: 'Actions',
        size: 80,
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="text-gray-400 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors">
                <MoreHorizontal size={16} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditingUser(row.original)} className='cursor-pointer text-blue-600 font-medium'>
                <UserCheck size={16} className="mr-2" />
                Edit Role/Status
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleUserDelete(row.original.id)} className='cursor-pointer text-red-600'>
                <Trash2 size={16} className="mr-2" />
                Delete User
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
        enableSorting: false,
      },
    ],
    []
  );

  // Configure TanStack Table
  const table = useReactTable({
    data: paginatedData,
    columns,
    state: { sorting: sortBy },
    onSortingChange: setSortBy,
    getCoreRowModel: getCoreRowModel(),
    // Client-side control
    manualPagination: true,
    manualFiltering: false,
    manualSorting: false,
    pageCount: totalPages,
  });

  // Handle page change
  function handlePageChange(newPage: number) {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  }

  // Generate pagination items for the UI
  const generatePagination = () => {
    const maxVisiblePages = 5;
    const items: (number | string)[] = [];
    
    // Logic to show page numbers with ellipses
    if (totalPages <= maxVisiblePages + 2) {
        for (let i = 1; i <= totalPages; i++) items.push(i);
    } else if (page <= maxVisiblePages - 2) { // Start
        for (let i = 1; i <= maxVisiblePages; i++) items.push(i);
        items.push('...');
        items.push(totalPages);
    } else if (page > totalPages - (maxVisiblePages - 1)) { // End
        items.push(1);
        items.push('...');
        for (let i = totalPages - maxVisiblePages + 1; i <= totalPages; i++) items.push(i);
    } else { // Middle
        items.push(1);
        items.push('...');
        for (let i = page - 1; i <= page + 1; i++) items.push(i);
        items.push('...');
        items.push(totalPages);
    }
    return items;
  };
  
  // Placeholder Button component (defined here since it's used by the modal/table)
  const Button = ({ children, className = '', ...props }: React.ComponentPropsWithoutRef<'button'>) => (
    <button
      className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors duration-150 flex items-center justify-center ${className}`}
      {...props}
    >
      {children}
    </button>
  );

  return (
    <div className="bg-white p-6 min-h-full">
      <div className="w-full mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">User Management Dashboard</h1>
          <div className="flex gap-3">
            <Button className="bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors">
              <UserMinus size={16} />
              Bulk Delete
            </Button>
            <Button
              className="bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              // onClick={handleExportToExcel} (Placeholder for full export logic)
              disabled={loading || searchedAndSortedData.length === 0}
            >
              <Download size={16} />
              Export to CSV
            </Button>
          </div>
        </div>

        {/* Controls (Filters & Search) */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-4">
          <div className='flex items-center gap-4 flex-wrap'>
            
            {/* Role Filter (Server-side) */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Filter by Role:</span>
              <Select
                value={roleFilter}
                onValueChange={value => setRoleFilter(value)}
              >
                <SelectTrigger className="w-[140px] h-9">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="USER">User</SelectItem>
                  <SelectItem value="VENDOR">Vendor</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter (Server-side) */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Email Status:</span>
              <Select
                value={statusFilter}
                onValueChange={value => setStatusFilter(value)}
              >
                <SelectTrigger className="w-[140px] h-9">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="not_verified">Not Verified</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Search Input (Client-side) */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search name, email, or username..."
                value={globalFilter}
                onChange={e => {
                    setGlobalFilter(e.target.value);
                    setPage(1); // Reset page on search
                }}
                className="border border-gray-300 rounded px-3 py-1 text-sm h-9 w-64"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          <div className="relative overflow-auto max-h-[68vh]">
            <table className="w-full border-collapse">
              <thead className='bg-gray-100'>
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <th
                        key={header.id}
                        className={`
                          py-3 px-4 text-left font-semibold text-gray-700 uppercase text-xs tracking-wider border-b border-gray-200
                          ${header.column.getCanSort() ? 'cursor-pointer select-none hover:bg-gray-200' : ''}
                        `}
                        onClick={header.column.getToggleSortingHandler()}
                        style={{
                          position: 'sticky',
                          top: 0,
                          zIndex: 10,
                          backgroundColor: '#f9fafb',
                        }}
                      >
                        <div className="flex items-center gap-1">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getCanSort() && (
                            <span className="text-gray-400">
                              {{ asc: ' ▲', desc: ' ▼' }[header.column.getIsSorted() as string] ?? '⇅'}
                            </span>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={columns.length} className="text-center h-24 py-8">
                       <Loader2 size={24} className="animate-spin text-[#5CA131] mx-auto" />
                       <span className='mt-2 text-sm text-gray-600'>Loading users...</span>
                    </td>
                  </tr>
                ) : paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="text-center py-8 text-gray-500">
                      No users found matching current filters.
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row, index) => (
                    <tr
                      key={row.id}
                      className={`border-b border-gray-100 hover:bg-gray-50 transition-colors`}
                    >
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id} className="py-3 px-4 text-sm text-gray-900">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between gap-4 mt-6">
          <div className="text-sm text-gray-600">
            {!loading && totalUsers > 0 && `Showing ${paginatedData.length > 0 ? (page - 1) * pageSize + 1 : 0} to ${Math.min(page * pageSize, totalUsers)} of ${totalUsers} entries`}
          </div>
          <div className="cursor-default">
            <div className="flex items-center space-x-2">
                <Button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                    className={`p-2 rounded-full border transition-colors ${page === 1 ? 'text-gray-400 bg-gray-100 cursor-not-allowed' : 'text-[#5CA131] hover:bg-gray-100 border-gray-300'}`}
                >
                    <ChevronLeft size={16} />
                </Button>
                
                {generatePagination().map((p, index) => (
                    <div key={index} className='flex'>
                        {typeof p === 'string' ? (
                            <span className='px-2 py-1 text-gray-500'>...</span>
                        ) : (
                            <Button
                                onClick={() => handlePageChange(p)}
                                className={`w-8 h-8 p-0 rounded-md text-sm ${page === p
                                    ? "bg-[#5CA131] text-white hover:bg-green-700 shadow-md"
                                    : "bg-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100 border border-gray-200"
                                    }`}
                            >
                                {p}
                            </Button>
                        )}
                    </div>
                ))}

                <Button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === totalPages}
                    className={`p-2 rounded-full border transition-colors ${page === totalPages ? 'text-gray-400 bg-gray-100 cursor-not-allowed' : 'text-[#5CA131] hover:bg-gray-100 border-gray-300'}`}
                >
                    <ChevronRight size={16} />
                </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Edit User Modal */}
      {editingUser && (
        <EditUserModal 
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onUpdate={handleUserUpdate}
          isLoading={isUpdating}
        />
      )}
    </div>
  );
};

export default UsersTable;