"use client";

import React, { useState, useMemo, useEffect } from 'react';
import api from '@/lib/api';
import { Trash2, Download, MoreHorizontal } from 'lucide-react';
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationLink, PaginationNext, PaginationEllipsis } from '@/components/ui/pagination';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
  SortingState,
} from '@tanstack/react-table';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

interface User {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  username: string;
  date_joined: string;
}

const UsersTable = () => {
  const [data, setData] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalUsers, setTotalUsers] = useState(0);

  // States for filtering
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');

  // States for server-side operations
  const [page, setPage] = useState(1);
  const pageSize = 20; // Hardcoded page size
  const [globalFilter, setGlobalFilter] = useState('');
  const [debouncedGlobalFilter, setDebouncedGlobalFilter] = useState('');
  const [sortBy, setSortBy] = useState<SortingState>([
    { id: 'date_joined', desc: true }
  ]);

  // Debounce the search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedGlobalFilter(globalFilter);
    }, 500);

    return () => clearTimeout(handler);
  }, [globalFilter]);

  // API Request Logic
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.append('page', String(page));
        params.append('page_size', String(pageSize));

        if (sortBy.length > 0) {
          const sortField = sortBy[0];
          const ordering = sortField.desc ? `-${sortField.id}` : sortField.id;
          params.append('ordering', ordering);
        }

        if (statusFilter !== 'all') {
          if (statusFilter === 'verified') {
            params.append('is_email_verified', 'true');
          } else if (statusFilter === 'not_verified') {
            params.append('is_email_verified', 'false');
          }
        }

        if (roleFilter !== 'all') {
          params.append('role__name', roleFilter);
        }

        const response = await api.get(`/users/`, { params });
        setData(response.data.results);
        setTotalUsers(response.data.count);

      } catch (error) {
        console.error("Failed to fetch user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [page, sortBy, statusFilter, roleFilter]);


  // Apply client-side search filtering
  const filteredData = useMemo(() => {
    if (!debouncedGlobalFilter) {
      return data;
    }
    const filterValue = debouncedGlobalFilter.toLowerCase();
    return data.filter(user =>
      user.full_name.toLowerCase().includes(filterValue) ||
      user.email.toLowerCase().includes(filterValue) ||
      user.username.toLowerCase().includes(filterValue)
    );
  }, [data, debouncedGlobalFilter]);

  const totalPages = Math.ceil(totalUsers / pageSize);

  // Table columns definition
  const columns = useMemo<ColumnDef<User>[]>(
    () => [
      {
        header: 'Sr. No.',
        cell: info => info.row.index + 1 + (page - 1) * pageSize,
        size: 64,
      },
      {
        accessorKey: 'full_name',
        header: 'Full Name',
      },
      {
        accessorKey: 'email',
        header: 'Email',
      },
      {
        accessorKey: 'phone',
        header: 'Mobile No.',
        cell: info => info.getValue() || 'N/A',
      },
      {
        accessorKey: 'username',
        header: 'Username',
      },
      {
        accessorKey: 'date_joined',
        header: 'Date Joined',
        cell: info => new Date(info.getValue() as string).toLocaleDateString(),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="text-gray-400 hover:text-gray-600">
                <MoreHorizontal size={16} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => alert(`Edit ${row.original.id}`)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => alert(`Delete ${row.original.id}`)}>
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
        size: 48,
        enableSorting: false,
      },
    ],
    [page]
  );

  // Configure TanStack Table
  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting: sortBy },
    onSortingChange: setSortBy,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualFiltering: false, // Changed to false for client-side filtering
    manualSorting: true,
    pageCount: totalPages,
  });

  function handlePageChange(newPage: number) {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  }

  // Function to handle export to Excel
  const handleExportToExcel = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      if (sortBy.length > 0) {
        const sortField = sortBy[0];
        const ordering = sortField.desc ? `-${sortField.id}` : sortField.id;
        params.append('ordering', ordering);
      }

      if (statusFilter !== 'all') {
        if (statusFilter === 'verified') {
          params.append('is_email_verified', 'true');
        } else if (statusFilter === 'not_verified') {
          params.append('is_email_verified', 'false');
        }
      }

      if (roleFilter !== 'all') {
        params.append('role__name', roleFilter);
      }
      
      const response = await api.get(`/users/`, { params });
      const usersToExport: User[] = response.data.results;
      
      const headers = ['Full Name', 'Email', 'Mobile No.', 'Username', 'Date Joined'];
      const csvRows = [headers.join(',')];
      
      usersToExport.forEach(user => {
        const row = [
          `"${user.full_name}"`,
          `"${user.email}"`,
          `"${user.phone || 'N/A'}"`,
          `"${user.username}"`,
          `"${new Date(user.date_joined).toLocaleDateString()}"`,
        ];
        csvRows.push(row.join(','));
      });
      
      const csvString = csvRows.join('\n');
      
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'registered_users.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error("Failed to export user data:", error);
      alert("Failed to export data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const generatePagination = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (page <= 3) {
      return [1, 2, 3, 4, '...', totalPages];
    }

    if (page >= totalPages - 2) {
      return [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }

    return [1, '...', page - 1, page, page + 1, '...', totalPages];
  };

  return (
    <div className="bg-white p-6">
      <div className="w-full mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Registered Users</h1>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-md hover:bg-red-100 transition-colors">
              <Trash2 size={16} />
              Delete
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleExportToExcel}
              disabled={loading || data.length === 0}
            >
              <Download size={16} />
              Export as Excel
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-4">
          <div className='flex items-center gap-4 flex-wrap'>
            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Status</span>
              <Select
                value={statusFilter}
                onValueChange={value => {
                  setStatusFilter(value);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="not_verified">Not Verified</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Role Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Role</span>
              <Select
                value={roleFilter}
                onValueChange={value => {
                  setRoleFilter(value);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="USER">User</SelectItem>
                  <SelectItem value="VENDOR">Vendor</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Sort by</span>
              <Select
                value={sortBy[0] ? `${sortBy[0].id}:${sortBy[0].desc}` : 'date_joined:true'}
                onValueChange={value => {
                  const [id, desc] = value.split(':');
                  setSortBy([{ id, desc: desc === 'true' }]);
                }}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date_joined:true">Latest</SelectItem>
                  <SelectItem value="date_joined:false">Oldest</SelectItem>
                  <SelectItem value="full_name:false">Name</SelectItem>
                  <SelectItem value="username:false">Username</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Search Input */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search..."
                value={globalFilter}
                onChange={e => setGlobalFilter(e.target.value)}
                className="border border-gray-300 rounded px-3 py-1 text-sm h-9"
              />
            </div>
          </div>
        </div>

        {/* Table - FIXED VERSION */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="relative overflow-auto h-[68vh]">
            <table className="w-full border-collapse">
              <thead>
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <th
                        key={header.id}
                        className={`
                          sticky top-0 z-30 bg-gray-100 py-3 px-4 text-left font-medium text-gray-900 border-b border-gray-200
                          ${header.column.getCanSort() ? 'cursor-pointer select-none hover:bg-gray-200' : ''}
                        `}
                        onClick={header.column.getToggleSortingHandler()}
                        style={{
                          position: 'sticky',
                          top: 0,
                          zIndex: 30,
                          backgroundColor: '#f3f4f6',
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
                      Loading...
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="text-center py-8">
                      No data found.
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row, index) => (
                    <tr
                      key={row.id}
                      className={`border-b border-gray-100 hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
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
            {!loading && `Showing ${filteredData.length > 0 ? (page - 1) * pageSize + 1 : 0} to ${Math.min(page * pageSize, totalUsers)} of ${totalUsers} entries`}
          </div>
          <div className="cursor-default">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => handlePageChange(page - 1)}
                    aria-disabled={page === 1}
                    className={`${page === 1 ? "pointer-events-none opacity-50" : ""} rounded-md border-none bg-transparent hover:bg-gray-100 text-green-600`}
                  />
                </PaginationItem>

                {generatePagination().map((p, index) => (
                  <PaginationItem key={index}>
                    {typeof p === 'string' ? (
                      <PaginationEllipsis />
                    ) : (
                      <PaginationLink
                        isActive={page === p}
                        onClick={() => handlePageChange(p)}
                        className={`w-8 h-8 p-0 rounded-md text-sm ${page === p
                          ? "bg-[#5CA131] text-white hover:bg-green-700"
                          : "bg-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100 border border-gray-200"
                          }`}
                      >
                        {p}
                      </PaginationLink>
                    )}
                  </PaginationItem>
                ))}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => handlePageChange(page + 1)}
                    aria-disabled={page === totalPages}
                    className={`${page === totalPages ? "pointer-events-none opacity-50" : ""} rounded-md border-none bg-transparent hover:bg-gray-100 text-green-600`}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsersTable;