"use client";

import React, { useState, useMemo, useEffect } from 'react';
import api from '@/lib/api';
import { useReactTable, getCoreRowModel, flexRender, ColumnDef, SortingState } from '@tanstack/react-table';
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationLink, PaginationNext, PaginationEllipsis } from '@/components/ui/pagination';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

// --- TypeScript Interface ---
interface NewsletterSubscription {
  id: number;
  email: string;
  subscribed_at: string;
}

const NewsletterSubscriptionsTable = () => {
  const [data, setData] = useState<NewsletterSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalSubscriptions, setTotalSubscriptions] = useState(0);

  // States for filtering, sorting, pagination
  const [page, setPage] = useState(1);
  const [globalFilter, setGlobalFilter] = useState('');
  const [debouncedGlobalFilter, setDebouncedGlobalFilter] = useState('');
  const [sortBy, setSortBy] = useState<SortingState>([
    { id: 'subscribed_at', desc: true }
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

        if (debouncedGlobalFilter) params.append('search', debouncedGlobalFilter);

        if (sortBy.length > 0) {
          const sort = sortBy[0];
          params.append('ordering', `${sort.desc ? '-' : ''}${sort.id}`);
        }

        const response = await api.get(`/newsletter-subscriptions/`, { params });
        setData(response.data.results);
        setTotalSubscriptions(response.data.count);
      } catch (error) {
        console.error("Failed to fetch newsletter subscriptions:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [page, debouncedGlobalFilter, sortBy]);

  const totalPages = Math.ceil(totalSubscriptions / 20);

  const columns = useMemo<ColumnDef<NewsletterSubscription>[]>(() => [
    {
      header: 'Sr. No.',
      cell: info => info.row.index + 1 + (page - 1) * 20,
    },
    {
      accessorKey: 'email',
      header: 'Email Address',
    },
    {
      accessorKey: 'subscribed_at',
      header: 'Date Subscribed',
      cell: info => new Date(info.getValue() as string).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
    },
  ], [page]);

  const table = useReactTable({
    data, columns, state: { sorting: sortBy }, onSortingChange: setSortBy,
    getCoreRowModel: getCoreRowModel(), manualPagination: true, manualFiltering: true,
    manualSorting: true, pageCount: totalPages,
  });

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) setPage(newPage);
  };

  const generatePagination = () => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page <= 3) return [1, 2, 3, 4, '...', totalPages];
    if (page >= totalPages - 2) return [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, '...', page - 1, page, page + 1, '...', totalPages];
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Newsletter Subscriptions</h1>
        <p className="text-sm text-gray-500 mt-1">View all email addresses subscribed to the newsletter.</p>
      </div>

      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-4">
        <div className='flex items-center gap-4 flex-wrap'>
          <div className="flex items-center">
            <input type="text" placeholder="Search by email..." value={globalFilter}
              onChange={e => setGlobalFilter(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1 text-sm h-9 w-full md:w-[300px]" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Sort by</span>
            <Select
              value={sortBy[0] ? `${sortBy[0].id}:${sortBy[0].desc}` : 'subscribed_at:true'}
              onValueChange={value => {
                const [id, desc] = value.split(':');
                setSortBy([{ id, desc: desc === 'true' }]);
              }}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="subscribed_at:true">Newest First</SelectItem>
                <SelectItem value="subscribed_at:false">Oldest First</SelectItem>
                <SelectItem value="email:false">Email (A-Z)</SelectItem>
                <SelectItem value="email:true">Email (Z-A)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="relative overflow-auto h-[68vh]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-gray-50">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th key={header.id} className="py-3 px-4 text-left font-medium text-gray-600 border-b">
                      <div className={`flex items-center gap-1 ${header.column.getCanSort() ? 'cursor-pointer select-none' : ''}`}
                        onClick={header.column.getToggleSortingHandler()}>
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
                <tr><td colSpan={columns.length} className="text-center py-10">Loading subscribers...</td></tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr><td colSpan={columns.length} className="text-center py-10">No subscriptions found.</td></tr>
              ) : (
                table.getRowModel().rows.map(row => (
                  <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50">
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="py-3 px-4 text-gray-800">
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

      <div className="flex items-center justify-between gap-4 mt-4">
        <div className="text-sm text-gray-600">
          {!loading && `Showing ${data.length > 0 ? (page - 1) * 20 + 1 : 0} to ${Math.min(page * 20, totalSubscriptions)} of ${totalSubscriptions} entries`}
        </div>
        {!loading && totalPages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem><PaginationPrevious onClick={() => handlePageChange(page - 1)} className={page === 1 ? "pointer-events-none opacity-50" : ""} /></PaginationItem>
              {generatePagination().map((p, index) => (
                <PaginationItem key={index}>
                  {typeof p === 'string' ? <PaginationEllipsis /> : <PaginationLink isActive={page === p} onClick={() => handlePageChange(p)}>{p}</PaginationLink>}
                </PaginationItem>
              ))}
              <PaginationItem><PaginationNext onClick={() => handlePageChange(page + 1)} className={page === totalPages ? "pointer-events-none opacity-50" : ""} /></PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </div>
  );
};

export default NewsletterSubscriptionsTable;