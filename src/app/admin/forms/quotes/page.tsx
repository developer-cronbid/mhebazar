// src/components/quotes/QuotesTable.tsx

"use client";

import React, { useState, useMemo, useEffect } from 'react';
import api from '@/lib/api';
import { useReactTable, getCoreRowModel, flexRender, ColumnDef, SortingState } from '@tanstack/react-table';
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationLink, PaginationNext, PaginationEllipsis } from '@/components/ui/pagination';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { QuoteDetailsSheet } from './quotesDetails';
import { ImageIcon, Download } from 'lucide-react';
import { Button } from "@/components/ui/button";
import quoteData from '@/data/quoteData.json';
import Link from 'next/link';

// Interfaces for data structure
interface Image {
  id: number;
  image: string;
}

interface ProductDetails {
  name: string;
  user_name: string; // Vendor
  price: string;
  description: string;
  manufacturer: string;
  model: string;
  images: Image[];
}

interface Quote {
  id: number | string; // ID can be number (from API) or string (from JSON)
  product_details: ProductDetails;
  user_name: string; // Requester
  message: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

// Helper to format product names consistently
const formatProductName = (productData: ProductDetails) => {
  const title = productData.name || '';
  const manufacturer = productData.manufacturer || productData.user_name || '';
  const model = productData.model || '';

  return `${manufacturer} ${title} ${model}`
    .replace(/[^a-zA-Z0-9 \-\.]/g, "")
    .replace(/\s+/g, " ")
    .trim();
};


const QuotesTable = () => {
  const [allQuotes, setAllQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);

  // States for sheet and actions
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // States for client-side filtering, sorting, pagination
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [globalFilter, setGlobalFilter] = useState('');
  const [debouncedGlobalFilter, setDebouncedGlobalFilter] = useState('');
  const [sortBy, setSortBy] = useState<SortingState>([
    { id: 'created_at', desc: true }
  ]);
  const pageSize = 20;

  // Debounce search input for performance
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedGlobalFilter(globalFilter);
      setPage(1); // Reset to first page on new search
    }, 500);
    return () => clearTimeout(handler);
  }, [globalFilter]);

  // Fetch and combine data from API and local JSON on component mount
  useEffect(() => {
    const fetchAndCombineData = async () => {
      setLoading(true);
      try {
        // Fetch live data from the API
        const apiResponse = await api.get(`/quotes/`);
        const liveQuotes: Quote[] = apiResponse.data.results || [];

        // Load and normalize archived data from JSON
        const archivedQuotes: Quote[] = quoteData.map((quote, index) => ({
          id: `archive-${quote.id}`, // Ensure unique ID
          user_name: quote.name,
          message: quote.meg,
          status: (['pending', 'approved', 'rejected'] as const)[index % 3], // Assign a mock status
          created_at: quote.created_at,
          product_details: {
            name: quote.pname,
            user_name: quote.cname,
            price: 'N/A',
            description: '',
            manufacturer: quote.brand || '',
            model: quote.model || '',
            images: [],
          },
        }));

        setAllQuotes([...liveQuotes, ...archivedQuotes]);

      } catch (error) {
        console.error("Failed to fetch or process quote data:", error);
        // Fallback to only archived data if API fails
        const archivedQuotes: Quote[] = quoteData.map((quote, index) => ({
          id: `archive-${quote.id}`,
          user_name: quote.name,
          message: quote.meg,
          status: (['pending', 'approved', 'rejected'] as const)[index % 3],
          created_at: quote.created_at,
          product_details: {
            name: quote.pname, user_name: quote.cname, price: 'N/A',
            description: '', manufacturer: quote.brand || '', model: quote.model || '', images: [],
          },
        }));
        setAllQuotes(archivedQuotes);
      } finally {
        setLoading(false);
      }
    };

    fetchAndCombineData();
  }, []); // Empty dependency array ensures this runs only once

  // Memoized function to process data based on filters, search, and sort
  const processedData = useMemo(() => {
    let filteredData = [...allQuotes];

    // Apply status filter
    if (statusFilter !== 'all') {
      filteredData = filteredData.filter(quote => quote.status === statusFilter);
    }

    // Apply global search filter
    if (debouncedGlobalFilter) {
      const lowercasedFilter = debouncedGlobalFilter.toLowerCase();
      filteredData = filteredData.filter(quote =>
        formatProductName(quote.product_details).toLowerCase().includes(lowercasedFilter) ||
        quote.user_name?.toLowerCase().includes(lowercasedFilter) ||
        quote.product_details.user_name?.toLowerCase().includes(lowercasedFilter)
      );
    }

    // Apply sorting
    if (sortBy.length > 0) {
      const sort = sortBy[0];
      const key = sort.id as keyof Quote | 'product_name';

      filteredData.sort((a, b) => {
        let valA, valB;
        if (key === 'product_name') {
          valA = formatProductName(a.product_details);
          valB = formatProductName(b.product_details);
        } else {
          valA = a[key as keyof Quote];
          valB = b[key as keyof Quote];
        }

        if (valA < valB) return sort.desc ? 1 : -1;
        if (valA > valB) return sort.desc ? -1 : 1;
        return 0;
      });
    }

    return filteredData;
  }, [allQuotes, statusFilter, debouncedGlobalFilter, sortBy]);

  const totalQuotes = processedData.length;
  const totalPages = Math.ceil(totalQuotes / pageSize);

  // Memoized function to get the current page's data
  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return processedData.slice(start, end);
  }, [processedData, page, pageSize]);

  /**
   * Handles the approve and reject actions for a quote.
   * If the quote ID is a number, it's treated as a live API quote and a POST request is made.
   * For all quotes (live and archived), the local state is updated for an immediate UI response.
   */
  const handleApproveReject = async (quoteId: number | string, action: 'approve' | 'reject') => {
    setIsUpdating(true);
    // If the ID is a number, it's from the API, so we make a real API call
    if (typeof quoteId === 'number') {
      try {
        await api.post(`/quotes/${quoteId}/${action}/`);
      } catch (error) {
        console.error(`Failed to ${action} quote:`, error);
        alert(`Error: Could not ${action} the quote. You may not have permission.`);
        setIsUpdating(false);
        return;
      }
    }

    // For both API and local data, we update the client state for immediate feedback
    setAllQuotes(prevData =>
      prevData.map(quote =>
        quote.id === quoteId ? { ...quote, status: action === 'approve' ? 'approved' : 'rejected' } : quote
      )
    );
    setSelectedQuote(prev => prev ? { ...prev, status: action === 'approve' ? 'approved' : 'rejected' } : null);

    setIsUpdating(false);
    setTimeout(() => setIsSheetOpen(false), 500);
  };

  const handleExportToExcel = () => {
    const headers = [
      'Quote ID', 'Status', 'Date Requested', 'Requester Name',
      'Product Name', 'Vendor Name', 'Message'
    ];
    const csvRows = [headers.join(',')];

    processedData.forEach(quote => {
      const row = [
        `"${quote.id}"`,
        `"${quote.status}"`,
        `"${new Date(quote.created_at).toLocaleString()}"`,
        `"${quote.user_name.replace(/"/g, '""')}"`,
        `"${formatProductName(quote.product_details).replace(/"/g, '""')}"`,
        `"${quote.product_details.user_name.replace(/"/g, '""')}"`,
        `"${quote.message.replace(/"/g, '""').replace(/\r\n|\n/g, ' ')}"`
      ];
      csvRows.push(row.join(','));
    });

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'all_quotes.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Define table columns
  const columns = useMemo<ColumnDef<Quote>[]>
    (() => [
      {
        header: 'Sr. No.',
        cell: info => info.row.index + 1 + (page - 1) * pageSize,
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
        cell: ({ row }) => (
          <Link
            href={`/products-details/${row.original.product_details.id}`}
            onClick={(e) => e.stopPropagation()} // Prevent sheet from opening
            className="text-blue-600 hover:underline"
          >
            {formatProductName(row.original.product_details)}
          </Link>
        )
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
          const variant: "success" | "secondary" | "destructive" =
            status === 'approved' ? 'success' :
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
    data: paginatedData,
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

  // Helper to generate pagination links
  const generatePagination = () => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page <= 3) return [1, 2, 3, 4, '...', totalPages];
    if (page >= totalPages - 2) return [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, '...', page - 1, page, page + 1, '...', totalPages];
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm overflow-auto">
      <QuoteDetailsSheet
        quote={selectedQuote}
        isOpen={isSheetOpen}
        isUpdating={isUpdating}
        onOpenChange={setIsSheetOpen}
        onApprove={() => selectedQuote && handleApproveReject(selectedQuote.id, 'approve')}
        onReject={() => selectedQuote && handleApproveReject(selectedQuote.id, 'reject')}
      />
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">All Quote Requests (Live & Archived)</h1>
          <p className="text-sm text-gray-500 mt-1">Browse and manage all quote requests from users.</p>
        </div>
        <Button onClick={handleExportToExcel} disabled={loading || paginatedData.length === 0} className="flex items-center gap-2">
          <Download size={16} />
          Export as Excel
        </Button>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-4">
        <div className='flex items-center gap-4 flex-wrap'>
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
          {!loading && `Showing ${totalQuotes > 0 ? (page - 1) * pageSize + 1 : 0} to ${Math.min(page * pageSize, totalQuotes)} of ${totalQuotes} entries`}
        </div>
        {!loading && totalPages > 1 && (
          <Pagination className='justify-end'>
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