// src/app/admin/forms/rentals/page.tsx
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
import rentData from '@/data/rentData.json';
import { toast } from 'sonner';

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
  id: number | string;
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
    .replace(/[^a-zA-Z0-9 \-\.]/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

const RentalsTable = () => {
  const [allRentals, setAllRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedRental, setSelectedRental] = useState<Rental | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [globalFilter, setGlobalFilter] = useState('');
  const [debouncedGlobalFilter, setDebouncedGlobalFilter] = useState('');
  const [sortBy, setSortBy] = useState<SortingState>([
    { id: 'created_at', desc: true }
  ]);
  const pageSize = 20;

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedGlobalFilter(globalFilter);
      setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [globalFilter]);

  useEffect(() => {
    const fetchAndCombineData = async () => {
      setLoading(true);
      try {
        const apiResponse = await api.get(`/rentals/`);
        const liveRentals: Rental[] = apiResponse.data.results || [];

        const archivedRentals: Rental[] = rentData.map((rental, index) => {
          const createdDate = new Date(rental.created_at);
          return {
            id: `archive-${rental.id}`,
            user_name: rental.name,
            notes: rental.meg,
            status: (['pending', 'approved', 'rejected', 'returned'] as const)[index % 4],
            created_at: rental.created_at,
            start_date: createdDate.toISOString(),
            end_date: new Date(createdDate.setDate(createdDate.getDate() + 30)).toISOString(),
            product_details: {
              name: rental.pname,
              user_name: rental.cname,
              price: 'N/A',
              description: '',
              manufacturer: '',
              model: '',
              images: [],
            },
          };
        });

        setAllRentals([...liveRentals, ...archivedRentals]);

      } catch (error) {
        console.error("Failed to fetch or process rental data:", error);
        const archivedRentals: Rental[] = rentData.map((rental, index) => {
          const createdDate = new Date(rental.created_at);
          return {
            id: `archive-${rental.id}`, user_name: rental.name, notes: rental.meg,
            status: (['pending', 'approved', 'rejected', 'returned'] as const)[index % 4],
            created_at: rental.created_at, start_date: createdDate.toISOString(),
            end_date: new Date(createdDate.setDate(createdDate.getDate() + 30)).toISOString(),
            product_details: {
              name: rental.pname, user_name: rental.cname, price: 'N/A', description: '',
              manufacturer: '', model: '', images: [],
            },
          };
        });
        setAllRentals(archivedRentals);
      } finally {
        setLoading(false);
      }
    };

    fetchAndCombineData();
  }, []);

  const processedData = useMemo(() => {
    let filteredData = [...allRentals];

    if (statusFilter !== 'all') {
      filteredData = filteredData.filter(rental => rental.status === statusFilter);
    }

    if (debouncedGlobalFilter) {
      const lowercasedFilter = debouncedGlobalFilter.toLowerCase();
      filteredData = filteredData.filter(rental =>
        formatProductName(rental.product_details).toLowerCase().includes(lowercasedFilter) ||
        rental.user_name?.toLowerCase().includes(lowercasedFilter) ||
        rental.product_details.user_name?.toLowerCase().includes(lowercasedFilter)
      );
    }

    if (sortBy.length > 0) {
      const sort = sortBy[0];
      const key = sort.id as keyof Rental | 'product_name';

      filteredData.sort((a, b) => {
        let valA, valB;
        if (key === 'product_name') {
          valA = formatProductName(a.product_details);
          valB = formatProductName(b.product_details);
        } else {
          valA = a[key as keyof Rental];
          valB = b[key as keyof Rental];
        }

        if (valA < valB) return sort.desc ? 1 : -1;
        if (valA > valB) return sort.desc ? -1 : 1;
        return 0;
      });
    }

    return filteredData;
  }, [allRentals, statusFilter, debouncedGlobalFilter, sortBy]);

  const totalRentals = processedData.length;
  const totalPages = Math.ceil(totalRentals / pageSize);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return processedData.slice(start, end);
  }, [processedData, page, pageSize]);

  const handleUpdateRentalStatus = async (rentalId: number | string, action: 'approve' | 'reject' | 'mark_returned') => {
    setIsUpdating(true);
    const newStatus = action === 'mark_returned' ? 'returned' : action;

    if (typeof rentalId === 'number') {
      try {
        await api.post(`/rentals/${rentalId}/${action}/`);
      } catch (error) {
        console.error(`Failed to ${action} rental:`, error);
        alert(`Error: Could not update the rental. You may not have permission.`);
        setIsUpdating(false);
        return;
      }
    }
    setAllRentals(prevData =>
      prevData.map(rental =>
        rental.id === rentalId ? { ...rental, status: newStatus } : rental
      )
    );

    toast.success(`Rental ${action === 'mark_returned' ? 'marked as returned' : action + 'd'} successfully.`);
    setSelectedRental(prev => prev ? { ...prev, status: newStatus } : null);
    setIsUpdating(false);
    setTimeout(() => setIsSheetOpen(false), 500);
  };

  const handleExportToExcel = () => {
    const headers = [
      'Rental ID', 'Status', 'Date Requested', 'Requester Name', 'Product Name', 'Vendor Name', 'Start Date', 'End Date', 'Notes'
    ];
    const csvRows = [headers.join(',')];

    processedData.forEach(rental => {
      const row = [
        `"${rental.id}"`, `"${rental.status}"`, `"${new Date(rental.created_at).toLocaleString()}"`,
        `"${rental.user_name.replace(/"/g, '""')}"`, `"${formatProductName(rental.product_details).replace(/"/g, '""')}"`,
        `"${rental.product_details.user_name.replace(/"/g, '""')}"`, `"${new Date(rental.start_date).toLocaleDateString()}"`,
        `"${new Date(rental.end_date).toLocaleDateString()}"`, `"${rental.notes.replace(/"/g, '""').replace(/\r\n|\n/g, ' ')}"`
      ];
      csvRows.push(row.join(','));
    });

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'all_rental_requests.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns = useMemo<ColumnDef<Rental>[]>(
    () => [
      { header: 'Sr. No.', cell: info => info.row.index + 1 + (page - 1) * pageSize },
      {
        id: 'product',
        header: 'Product',
        // MODIFICATION: Reverted to original logic to show image or fallback
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
      { id: 'product_name', accessorFn: row => formatProductName(row.product_details), header: 'Product Name' },
      { accessorKey: 'user_name', header: 'Requester', enableSorting: false },
      { accessorKey: 'start_date', header: 'Start Date', cell: info => new Date(info.getValue() as string).toLocaleDateString(), enableSorting: false },
      { accessorKey: 'end_date', header: 'End Date', cell: info => new Date(info.getValue() as string).toLocaleDateString(), enableSorting: false },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const status = row.original.status;
          const variant: "default" | "secondary" | "destructive" | "outline" | "success" =
            status === 'approved' ? 'success' :
              status === 'rejected' ? 'destructive' :
                status === 'returned' ? 'outline' : 'secondary';
          return <Badge variant={variant} className="capitalize">{status}</Badge>;
        },
        enableSorting: false,
      },
      { accessorKey: 'created_at', header: 'Date Requested', cell: info => new Date(info.getValue() as string).toLocaleDateString() },
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

  const generatePagination = () => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page <= 3) return [1, 2, 3, 4, '...', totalPages];
    if (page >= totalPages - 2) return [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, '...', page - 1, page, page + 1, '...', totalPages];
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm overflow-auto">
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
          <h1 className="text-2xl font-semibold text-gray-900">All Rental Requests (Live & Archived)</h1>
          <p className="text-sm text-gray-500 mt-1">Browse and manage all rental requests from users.</p>
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
                <SelectItem value="returned">Returned</SelectItem>
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
          {!loading && `Showing ${totalRentals > 0 ? (page - 1) * pageSize + 1 : 0} to ${Math.min(page * pageSize, totalRentals)} of ${totalRentals} entries`}
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

export default RentalsTable;