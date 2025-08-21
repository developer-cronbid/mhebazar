"use client";

import React, { useState, useMemo, useEffect } from 'react';
import api from '@/lib/api';
import { useReactTable, getCoreRowModel, flexRender, ColumnDef, SortingState } from '@tanstack/react-table';
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationLink, PaginationNext, PaginationEllipsis } from '@/components/ui/pagination';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

// --- TypeScript Interface ---
interface ContactForm {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  company_name: string;
  location: string;
  phone: string;
  message: string;
  created_at: string;
}

const ContactFormsTable = () => {
  const [data, setData] = useState<ContactForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalSubmissions, setTotalSubmissions] = useState(0);

  // States for filtering, sorting, pagination
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
        if (debouncedGlobalFilter) params.append('search', debouncedGlobalFilter);
        if (sortBy.length > 0) {
          const sort = sortBy[0];
          params.append('ordering', `${sort.desc ? '-' : ''}${sort.id}`);
        }

        const response = await api.get(`/contact-forms/`, { params });
        setData(response.data.results);
        setTotalSubmissions(response.data.count);
      } catch (error) {
        console.error("Failed to fetch contact form submissions:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [page, debouncedGlobalFilter, sortBy]);

  const totalPages = Math.ceil(totalSubmissions / 20);

  const columns = useMemo<ColumnDef<ContactForm>[]>(() => [
    {
      header: 'Sr. No.',
      cell: info => info.row.index + 1 + (page - 1) * 20,
    },
    {
      header: 'Name',
      accessorFn: row => `${row.first_name} ${row.last_name}`,
    },
    {
      header: 'Company & Location',
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-gray-800">{row.original.company_name}</p>
          <p className="text-sm text-gray-500">{row.original.location}</p>
        </div>
      ),
    },
    {
      header: 'Contact Info',
      cell: ({ row }) => (
        <div>
          <a href={`mailto:${row.original.email}`} className="text-blue-600 hover:underline break-all">{row.original.email}</a>
          <div className="text-gray-500">{row.original.phone}</div>
        </div>
      ),
    },
    {
      accessorKey: 'message',
      header: 'Message',
      cell: info => <p className="max-w-md truncate" title={info.getValue() as string}>{info.getValue() as string}</p>,
    },
    {
      accessorKey: 'created_at',
      header: 'Submitted At',
      cell: info => new Date(info.getValue() as string).toLocaleString(),
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
        <h1 className="text-2xl font-semibold text-gray-900">Contact Form Submissions</h1>
        <p className="text-sm text-gray-500 mt-1">View all inquiries submitted through the contact form.</p>
      </div>

      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-4">
        <div className='flex items-center gap-4 flex-wrap'>
          <div className="flex items-center">
            <input type="text" placeholder="Search by name, email, company..." value={globalFilter}
              onChange={e => setGlobalFilter(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1 text-sm h-9 w-full md:w-[300px]" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Sort by</span>
            <Select
              value={sortBy[0] ? `${sortBy[0].id}:${sortBy[0].desc}` : 'created_at:true'}
              onValueChange={value => {
                const [id, desc] = value.split(':');
                setSortBy([{ id, desc: desc === 'true' }]);
              }}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at:true">Newest First</SelectItem>
                <SelectItem value="created_at:false">Oldest First</SelectItem>
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
                <tr><td colSpan={columns.length} className="text-center py-10">Loading submissions...</td></tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr><td colSpan={columns.length} className="text-center py-10">No submissions found.</td></tr>
              ) : (
                table.getRowModel().rows.map(row => (
                  <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50">
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="py-3 px-4 text-gray-800 align-top">
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
          {!loading && `Showing ${data.length > 0 ? (page - 1) * 20 + 1 : 0} to ${Math.min(page * 20, totalSubmissions)} of ${totalSubmissions} entries`}
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

export default ContactFormsTable;