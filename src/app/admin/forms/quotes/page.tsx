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
// import quoteData from '@/data/quoteData.json';
import Link from 'next/link';
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { RequestStats } from "@/components/stats/RequestStats";

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
  const [periodFilter, setPeriodFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [globalFilter, setGlobalFilter] = useState('');
  const [debouncedGlobalFilter, setDebouncedGlobalFilter] = useState('');
  const [serverTotalCount, setServerTotalCount] = useState(0); // New state for total count from server
  const [sortBy, setSortBy] = useState<SortingState>([
    { id: 'created_at', desc: true }
  ]);
  const [dateRange, setDateRange] = useState<DateRange>();
  const pageSize = 10;

  // Debounce search input for performance
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedGlobalFilter(globalFilter);
      setPage(1); // Reset to first page on new search
    }, 500);
    return () => clearTimeout(handler);
  }, [globalFilter]);

  // Fetch and combine data from API and local JSON on component mount
// 1. ADD THIS STATE at the top of your component
const [isInitialLoad, setIsInitialLoad] = useState(true);

// 2. MODIFY the useEffect
useEffect(() => {
  const fetchQuotes = async () => {
    // Only show the spinner on the very first visit
    if (allQuotes.length === 0) setLoading(true);
    
    try {
      const response = await api.get(`/quotes/?page_size=10000`);
      const actualDatabaseQuotes = response.data.results || response.data || [];
      
      setAllQuotes(actualDatabaseQuotes);
    } catch (error) {
      console.error("Failed to fetch database quotes:", error);
    } finally {
      setLoading(false);
      setIsInitialLoad(false); // Mark that we have data
    }
  };
  fetchQuotes();
}, []);
  // Memoized function to process data based on filters, search, and sort
 const processedData = useMemo(() => {
  // if (!allQuotes.length) return [];
    let filteredData = [...allQuotes];

    if (statusFilter !== 'all') {
      filteredData = filteredData.filter(quote => quote.status === statusFilter);
    }

    // Apply global search filter
 if (debouncedGlobalFilter) {
    const searchTerms = debouncedGlobalFilter.toLowerCase().trim(); // Define once
    filteredData = filteredData.filter(quote => {
      // Use logical OR short-circuiting for speed
      return (
        formatProductName(quote.product_details).toLowerCase().includes(searchTerms) ||
        (quote.user_name || '').toLowerCase().includes(searchTerms) ||
        (quote.product_details.user_name || '').toLowerCase().includes(searchTerms)
      );
    }); 
  }

    // Apply date range filter
if (dateRange?.from) {
  const filterStart = new Date(dateRange.from);
  filterStart.setHours(0, 0, 0, 0);

  // If 'to' is missing (single click), use 'from' as end. 
  // Otherwise, use the selected 'to'.
  const filterEnd = new Date(dateRange.to || dateRange.from);
  filterEnd.setHours(23, 59, 59, 999);

  filteredData = filteredData.filter(rental => {
    const rentalDate = new Date(rental.created_at);
    // This comparison now includes the entire last day
    return rentalDate >= filterStart && rentalDate <= filterEnd;
  });
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
  }, [allQuotes, statusFilter, debouncedGlobalFilter, sortBy, dateRange]);

const totalQuotes = processedData.length;
const totalPages = Math.ceil(totalQuotes / pageSize);

  // Memoized function to get the current page's data
const paginatedData = useMemo(() => {
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  return processedData.slice(start, end); // This is what limits the view to 20
}, [processedData, page, pageSize]);

  /**
   * Handles the approve and reject actions for a quote.
   * If the quote ID is a number, it's treated as a live API quote and a POST request is made.
   * For all quotes (live and archived), the local state is updated for an immediate UI response.
   */
const handleApproveReject = async (quoteId: number | string, action: 'approve' | 'reject') => {
    setIsUpdating(true);
    
    try {
      // All IDs are now live IDs from the API
      await api.post(`/quotes/${quoteId}/${action}/`);
      
      // Update local state so the UI reflects the change immediately
      setAllQuotes(prevData =>
        prevData.map(quote =>
          quote.id === quoteId ? { ...quote, status: action === 'approve' ? 'approved' : 'rejected' } : quote
        )
      );
      
      // Update the selected quote in the sheet view
      setSelectedQuote(prev => prev ? { ...prev, status: action === 'approve' ? 'approved' : 'rejected' } : null);
      
      // Close the sheet after a short delay
      setTimeout(() => setIsSheetOpen(false), 500);
    } catch (error) {
      console.error(`Failed to ${action} quote:`, error);
      alert(`Error: Could not ${action} the quote. Please check your permissions.`);
    } finally {
      setIsUpdating(false);
    }
  };

const handleExportToExcel = () => {
  // 1. Define headers
  const headers = [
    'Quote ID', 'Status', 'Date Requested', 'Requester Name',
    'Product Name', 'Vendor Name', 'Message'
  ];

  // 2. Create a helper to safely handle null values and escape quotes
  const escapeCSV = (val: any) => {
    if (val === null || val === undefined) return '""';
    // Ensure it's a string, then escape double quotes and remove newlines
    const str = String(val).replace(/"/g, '""'); 
    return `"${str.replace(/\r\n|\n/g, ' ')}"`; 
  };

  const csvRows = [headers.join(',')];

  // 3. Process the data
  processedData.forEach(quote => {
    try {
      const row = [
        escapeCSV(quote.id),
        escapeCSV(quote.status),
        escapeCSV(new Date(quote.created_at).toLocaleString()),
        escapeCSV(quote.user_name),
        escapeCSV(formatProductName(quote.product_details)),
        escapeCSV(quote.product_details?.user_name),
        escapeCSV(quote.message)
      ];
      csvRows.push(row.join(','));
    } catch (err) {
      console.error("Error processing row for export:", err, quote);
    }
  });

  // 4. Create the Blob with UTF-8 BOM (prevents character errors in Excel)
  const csvString = csvRows.join('\n');
  const blob = new Blob(['\ufeff' + csvString], { type: 'text/csv;charset=utf-8;' });
  
  // 5. Trigger the download
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `quotes_export_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  
  // 6. Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
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
    manualFiltering: false,
    manualSorting: false,
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
    <div className="bg-white p-6 rounded-lg shadow-sm space-y-6">
      {/* Details Sheet - Add it back */}
      <QuoteDetailsSheet
        quote={selectedQuote}
        isOpen={isSheetOpen}
        isUpdating={isUpdating}
        onOpenChange={setIsSheetOpen}
        onApprove={() => selectedQuote && handleApproveReject(selectedQuote.id, 'approve')}
        onReject={() => selectedQuote && handleApproveReject(selectedQuote.id, 'reject')}
      />

      {/* Header with title and export */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Quote Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and track all quote requests</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Entries count and pagination */}
          <div className="flex items-center gap-4">
            {!loading && (
              <span className="text-sm text-gray-600 whitespace-nowrap">
                {`Showing ${totalQuotes > 0 ? (page - 1) * pageSize + 1 : 0} to ${Math.min(page * pageSize, totalQuotes)} of ${totalQuotes} entries`}
              </span>
            )}
            {!loading && totalPages > 1 && (
             <Pagination>
  <PaginationContent>
    <PaginationItem>
      <PaginationPrevious 
        className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
        onClick={() => handlePageChange(page - 1)} 
      />
    </PaginationItem>

    {generatePagination().map((p, idx) => (
      <PaginationItem key={idx}>
        {p === '...' ? (
          <PaginationEllipsis />
        ) : (
          <PaginationLink
            isActive={page === p}
            className="cursor-pointer"
            onClick={() => setPage(p as number)}
          >
            {p}
          </PaginationLink>
        )}
      </PaginationItem>
    ))}

    <PaginationItem>
      <PaginationNext 
        className={page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
        onClick={() => handlePageChange(page + 1)} 
      />
    </PaginationItem>
  </PaginationContent>
</Pagination>
            )}
          </div>
          <Button 
            onClick={handleExportToExcel} 
            disabled={loading || paginatedData.length === 0} 
            className="flex items-center gap-2 whitespace-nowrap"
          >
            <Download size={16} />
            Export Data
          </Button>
        </div>
      </div>

      {/* Stats Section */}
      <RequestStats
        data={allQuotes}
        dateField="created_at"
        periodFilter={periodFilter}
        onPeriodChange={setPeriodFilter}
      />

      {/* Filters Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-wrap gap-4">
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
          </div>
          <input
            type="text"
            placeholder="Search by product, user..."
            value={globalFilter}
            onChange={e => setGlobalFilter(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          />
        </div>
        <div className="w-full">
          <DateRangePicker
            date={dateRange}
            onDateChange={setDateRange}
            periodFilter={periodFilter}
            className="w-full"
          />
        </div>
      </div>

      {/* Table Section - Update onClick handler */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="relative overflow-auto" style={{ height: 'calc(100vh - 50px)' }}>
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
              {loading && allQuotes.length === 0 ? (
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

      {/* Remove the bottom info section since it's now at the top */}
      {/* <div className="text-sm text-gray-600">
        {!loading && `Showing ${totalQuotes > 0 ? (page - 1) * pageSize + 1 : 0} to ${Math.min(page * pageSize, totalQuotes)} of ${totalQuotes} entries`}
      </div> */}
    </div>
  );
};

export default QuotesTable;