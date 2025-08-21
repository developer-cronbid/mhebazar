// src/components/quotes/QuotesTable.tsx

"use client";

import React, { useState, useMemo, useEffect } from 'react';
import api from '@/lib/api';
import { useReactTable, getCoreRowModel, flexRender, ColumnDef, SortingState } from '@tanstack/react-table';
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationLink, PaginationNext, PaginationEllipsis } from '@/components/ui/pagination';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { QuoteDetailsSheet } from './quotesDetails';
import { ImageIcon } from 'lucide-react';

// Define TypeScript interfaces (can be shared in a types file)
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

interface Quote {
  id: number;
  product_details: ProductDetails;
  user_name: string;
  message: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

const QuotesTable = () => {
  const [data, setData] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalQuotes, setTotalQuotes] = useState(0);

  // States for sheet and actions
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false); // New state for approve/reject loading

  // ... (other states for filtering, sorting, pagination remain the same) ...
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
          // Map frontend ID to backend field name
          const orderingKey = sortField.id === 'product_name' ? 'product__name' : sortField.id;
          const ordering = sortField.desc ? `-${orderingKey}` : orderingKey;
          params.append('ordering', ordering);
        }

        if (statusFilter && statusFilter !== 'all') {
          params.append('status', statusFilter);
        }

        const response = await api.get(`/quotes/`, { params });
        setData(response.data.results);
        setTotalQuotes(response.data.count);

      } catch (error) {
        console.error("Failed to fetch quote data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [page, debouncedGlobalFilter, sortBy, statusFilter]);

  const handleApproveQuote = async (quoteId: number) => {
    setIsUpdating(true);
    try {
      const response = await api.post(`/quotes/${quoteId}/approve/`);
      const updatedQuote = response.data;

      // Update the table data without a full refetch
      setData(prevData =>
        prevData.map(quote =>
          quote.id === quoteId ? updatedQuote : quote
        )
      );

      // Also update the quote in the sheet if it's open
      setSelectedQuote(updatedQuote);

      // alert("Quote approved successfully!"); // Or use a toast notification
      setTimeout(() => setIsSheetOpen(false), 500); // Close sheet after a short delay

    } catch (error) {
      console.error("Failed to approve quote:", error);
      alert("Error: Could not approve the quote. You may not have permission.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRejectQuote = async (quoteId: number) => {
    setIsUpdating(true);
    try {
      const response = await api.post(`/quotes/${quoteId}/reject/`);
      const updatedQuote = response.data;

      setData(prevData =>
        prevData.map(quote =>
          quote.id === quoteId ? updatedQuote : quote
        )
      );

      setSelectedQuote(updatedQuote);

      // alert("Quote rejected successfully!");
      setTimeout(() => setIsSheetOpen(false), 500);

    } catch (error) {
      console.error("Failed to reject quote:", error);
      alert("Error: Could not reject the quote. You may not have permission.");
    } finally {
      setIsUpdating(false);
    }
  };

  const totalPages = Math.ceil(totalQuotes / 20); // Assuming page size is 20

  const columns = useMemo<ColumnDef<Quote>[]>(
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
              {/* <span className="font-medium text-gray-800">{product.name}</span> */}
            </div>
          );
        },
      },
      {
        id: 'product_name',
        accessorFn: row => row.product_details.name,
        header: 'Product Name',
      },
      {
        accessorFn: row => row.product_details.user_name,
        header: 'Vendor',
        enableSorting: false,
      },
      {
        accessorKey: 'user_name',
        header: 'Requester',
        enableSorting: false,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const status = row.original.status;
          const variant: "default" | "secondary" | "destructive" =
            status === 'approved' ? 'default' :
              status === 'rejected' ? 'destructive' : 'secondary';
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
    // ... (Your existing pagination logic remains unchanged)
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page <= 3) return [1, 2, 3, 4, '...', totalPages];
    if (page >= totalPages - 2) return [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, '...', page - 1, page, page + 1, '...', totalPages];
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <QuoteDetailsSheet
        quote={selectedQuote}
        isOpen={isSheetOpen}
        isUpdating={isUpdating}
        onOpenChange={setIsSheetOpen}
        onApprove={handleApproveQuote}
        onReject={handleRejectQuote}
      />
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Quote Requests</h1>
        <p className="text-sm text-gray-500 mt-1">Browse and manage all quote requests from users.</p>
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
                <tr><td colSpan={columns.length} className="text-center py-10">No quotes found.</td></tr>
              ) : (
                table.getRowModel().rows.map(row => (
                  <tr
                    key={row.id}
                    className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      setSelectedQuote(row.original);
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
          {!loading && `Showing ${data.length > 0 ? (page - 1) * 20 + 1 : 0} to ${Math.min(page * 20, totalQuotes)} of ${totalQuotes} entries`}
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

export default QuotesTable;