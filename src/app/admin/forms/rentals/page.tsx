//src/app/admin/forms/rentals/page.tsx
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import api from '@/lib/api';
import { useReactTable, getCoreRowModel, flexRender, ColumnDef, SortingState } from '@tanstack/react-table';
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationLink, PaginationNext, PaginationEllipsis } from '@/components/ui/pagination';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { RentalDetailsSheet } from './rentalDetails';
import { ImageIcon, Download } from 'lucide-react';
import { Button } from "@/components/ui/button";

// Define TypeScript interfaces based on your API response
interface Image {
  id: number;
  image: string;
}

interface ProductDetails {
  name: string;
  user_name: string;
  price: string;
  description: string;
  manufacturer: string;
  model: string;
  images: Image[];
}

interface Rental {
  id: number;
  product_details: ProductDetails;
  user_name: string;
  start_date: string;
  end_date: string;
  notes: string;
  status: 'pending' | 'approved' | 'rejected' | 'returned';
  created_at: string;
}

const formatProductName = (productData: ProductDetails) => {
  const title = productData.name || '';
  const manufacturer = productData.manufacturer || productData.user_name || '';
  const model = productData.model || '';

  return `${manufacturer} ${title} ${model}`
    .replace(/[^a-zA-Z0-9 \-]/g, "") // Remove special characters
    .replace(/\s+/g, " ") // Collapse multiple spaces
    .trim();
};

const RentalsTable = () => {
  const [data, setData] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalRentals, setTotalRentals] = useState(0);

  // States for sheet and actions
  const [selectedRental, setSelectedRental] = useState<Rental | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // States for filtering, sorting, pagination
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [globalFilter, setGlobalFilter] = useState('');
  const [debouncedGlobalFilter, setDebouncedGlobalFilter] = useState('');
  const [sortBy, setSortBy] = useState<SortingState>([
    { id: 'created_at', desc: true }
  ]);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedGlobalFilter(globalFilter);
      setPage(1);
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

        if (debouncedGlobalFilter) {
          params.append('search', debouncedGlobalFilter);
        }

        if (sortBy.length > 0) {
          const sortField = sortBy[0];
          const orderingKey = sortField.id === 'product_name' ? 'product__name' : sortField.id;
          const ordering = sortField.desc ? `-${orderingKey}` : orderingKey;
          params.append('ordering', ordering);
        }

        if (statusFilter && statusFilter !== 'all') {
          params.append('status', statusFilter);
        }

        const response = await api.get(`/rentals/`, { params });
        setData(response.data.results);
        setTotalRentals(response.data.count);

      } catch (error) {
        console.error("Failed to fetch rental data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [page, debouncedGlobalFilter, sortBy, statusFilter]);

  const handleUpdateRentalStatus = async (rentalId: number, action: 'approve' | 'reject' | 'mark_returned') => {
    setIsUpdating(true);
    try {
      const response = await api.post(`/rentals/${rentalId}/${action}/`);
      const updatedRental = response.data;

      setData(prevData =>
        prevData.map(rental =>
          rental.id === rentalId ? updatedRental : rental
        )
      );

      setSelectedRental(updatedRental); // Update sheet data

      setTimeout(() => setIsSheetOpen(false), 500);
    } catch (error) {
      console.error(`Failed to ${action} rental:`, error);
      alert(`Error: Could not update the rental. You may not have permission.`);
    } finally {
      setIsUpdating(false);
    }
  };


  const totalPages = Math.ceil(totalRentals / 20); // Assuming page size is 20

  const handleExportToExcel = async () => {
    setLoading(true);
    try {
      // Fetch all data for export, applying current filters and sorting
      const params = new URLSearchParams();
      if (debouncedGlobalFilter) params.append('search', debouncedGlobalFilter);
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
      if (sortBy.length > 0) {
        const sortField = sortBy[0];
        const orderingKey = sortField.id === 'product_name' ? 'product__name' : sortField.id;
        const ordering = sortField.desc ? `-${orderingKey}` : orderingKey;
        params.append('ordering', ordering);
      }
      
      const response = await api.get(`/rentals/`, { params });
      const rentalsToExport: Rental[] = response.data.results;
      
      // Define CSV headers
      const headers = [
        'Rental ID', 'Status', 'Date Requested', 'Requester Name',
        'Product Name', 'Vendor Name', 'Product Model', 'Product Manufacturer',
        'Start Date', 'End Date', 'Notes'
      ];
      const csvRows = [headers.join(',')];
      
      // Map data to CSV rows
      rentalsToExport.forEach(rental => {
        const row = [
          `"${rental.id}"`,
          `"${rental.status}"`,
          `"${new Date(rental.created_at).toLocaleString()}"`,
          `"${rental.user_name}"`,
          `"${rental.product_details.name}"`,
          `"${rental.product_details.user_name}"`,
          `"${rental.product_details.model || 'N/A'}"`,
          `"${rental.product_details.manufacturer || 'N/A'}"`,
          `"${new Date(rental.start_date).toLocaleDateString()}"`,
          `"${new Date(rental.end_date).toLocaleDateString()}"`,
          `"${rental.notes.replace(/"/g, '""')}"` // Handle quotes in notes
        ];
        csvRows.push(row.join(','));
      });
      
      const csvString = csvRows.join('\n');
      
      // Create a Blob and trigger download
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'rental_requests.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error("Failed to export rentals:", error);
      alert("Failed to export data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const columns = useMemo<ColumnDef<Rental>[]>(
    () => [
      {
        header: 'Sr. No.',
        cell: info => info.row.index + 1 + (page - 1) * 20,
      },
      {
        id: 'product',
        header: 'Product',
        cell: ({ row }) => {
          const product = row.original.product_details;
          const firstImage = product.images?.[0]?.image;
          return (
            <div className="flex items-center gap-3">
              {firstImage ? (
                <img
                  src={firstImage}
                  alt={product.name}
                  className="w-12 h-12 object-cover rounded-md bg-gray-100"
                />
              ) : (
                <div className="w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center">
                  <ImageIcon className="w-6 h-6 text-gray-400" />
                </div>
              )}
            </div>
          );
        },
      },
      {
        id: 'product_name',
        accessorFn: row => formatProductName(row.product_details),
        header: 'Product Name',
      },
      {
        accessorKey: 'user_name',
        header: 'Requester',
        enableSorting: false,
      },
      {
        accessorKey: 'start_date',
        header: 'Start Date',
        cell: info => new Date(info.getValue() as string).toLocaleDateString(),
        enableSorting: false,
      },
      {
        accessorKey: 'end_date',
        header: 'End Date',
        cell: info => new Date(info.getValue() as string).toLocaleDateString(),
        enableSorting: false,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const status = row.original.status;
          const variant: "default" | "secondary" | "destructive" | "outline" =
            status === 'approved' ? 'default' :
              status === 'rejected' ? 'destructive' :
                status === 'returned' ? 'outline' : 'secondary';
          return <Badge variant={variant} className="capitalize">{status}</Badge>;
        },
        enableSorting: false,
      },
      {
        accessorKey: 'created_at',
        header: 'Date Requested',
        cell: info => new Date(info.getValue() as string).toLocaleDateString(),
      },
    ],
    [page]
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting: sortBy },
    onSortingChange: setSortBy,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualFiltering: true,
    manualSorting: true,
    pageCount: totalPages,
  });

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const generatePagination = () => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page <= 3) return [1, 2, 3, 4, '...', totalPages];
    if (page >= totalPages - 2) return [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, '...', page - 1, page, page + 1, '...', totalPages];
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <RentalDetailsSheet
        rental={selectedRental}
        isOpen={isSheetOpen}
        isUpdating={isUpdating}
        onOpenChange={setIsSheetOpen}
        onUpdateStatus={handleUpdateRentalStatus}
      />
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Rental Requests</h1>
          <p className="text-sm text-gray-500 mt-1">Browse and manage all rental requests from users.</p>
        </div>
        <Button onClick={handleExportToExcel} disabled={loading || data.length === 0} className="flex items-center gap-2">
          <Download size={16} />
          Export as Excel
        </Button>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-4">
        <div className='flex items-center gap-4 flex-wrap'>
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Status</span>
            <Select value={statusFilter} onValueChange={value => { setStatusFilter(value); setPage(1); }}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Filter by status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="returned">Returned</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Sort by</span>
            <Select
              value={sortBy[0] ? `${sortBy[0].id}:${sortBy[0].desc}` : 'created_at:true'}
              onValueChange={value => {
                const [id, desc] = value.split(':');
                setSortBy([{ id, desc: desc === 'true' }]);
              }}
            >
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at:true">Newest First</SelectItem>
                <SelectItem value="created_at:false">Oldest First</SelectItem>
                <SelectItem value="product_name:false">Product Name (A-Z)</SelectItem>
                <SelectItem value="product_name:true">Product Name (Z-A)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Search Input */}
          <div className="flex items-center">
            <input
              type="text"
              placeholder="Search by product, user..."
              value={globalFilter}
              onChange={e => setGlobalFilter(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1 text-sm h-9 w-full md:w-auto"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="relative overflow-auto h-[68vh]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-gray-50">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th key={header.id} className="py-3 px-4 text-left font-medium text-gray-600 border-b border-gray-200">
                      <div
                        className={`flex items-center gap-1 ${header.column.getCanSort() ? 'cursor-pointer select-none hover:text-gray-900' : ''}`}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {{ asc: ' ▲', desc: ' ▼' }[header.column.getIsSorted() as string] ?? null}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={columns.length} className="text-center py-10">Loading...</td></tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr><td colSpan={columns.length} className="text-center py-10">No rentals found.</td></tr>
              ) : (
                table.getRowModel().rows.map(row => (
                  <tr
                    key={row.id}
                    className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      setSelectedRental(row.original);
                      setIsSheetOpen(true);
                    }}
                  >
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="py-2 px-4 text-gray-800">
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
      <div className="flex items-center justify-between gap-4 mt-4">
        <div className="text-sm text-gray-600">
          {!loading && `Showing ${data.length > 0 ? (page - 1) * 20 + 1 : 0} to ${Math.min(page * 20, totalRentals)} of ${totalRentals} entries`}
        </div>
        {!loading && totalPages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem><PaginationPrevious onClick={() => handlePageChange(page - 1)} aria-disabled={page === 1} className={page === 1 ? "pointer-events-none opacity-50" : ""} /></PaginationItem>
              {generatePagination().map((p, index) => (
                <PaginationItem key={index}>
                  {typeof p === 'string' ? <PaginationEllipsis /> : <PaginationLink isActive={page === p} onClick={() => handlePageChange(p)}>{p}</PaginationLink>}
                </PaginationItem>
              ))}
              <PaginationItem><PaginationNext onClick={() => handlePageChange(page + 1)} aria-disabled={page === totalPages} className={page === totalPages ? "pointer-events-none opacity-50" : ""} /></PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </div>
  );
};

export default RentalsTable;