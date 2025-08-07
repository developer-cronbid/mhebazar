"use client";

import React, { useState, useMemo } from 'react';
import { Trash2, Download, MoreHorizontal } from 'lucide-react';
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationLink, PaginationNext } from '@/components/ui/pagination';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
} from '@tanstack/react-table';
import { ProductQuote } from '@/types';
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

const ProductQuoteTable = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [globalFilter, setGlobalFilter] = useState('');
  const [sortBy, setSortBy] = useState<{ id: string; desc: boolean }[]>([
    { id: 'date', desc: true }
  ]);

  const totalEntries = 29;

  // Simulated data for all entries (replace with real data in production)
  const allData = useMemo<ProductQuote[]>(() =>
    Array.from({ length: totalEntries }, (_, i) => ({
      id: i + 1,
      name: "John Doe John",
      email: "jdoe@email.com",
      mobile: "9876543210",
      company: "Armin Industries",
      product: "Godrej Uno Electric Stacker 1.5 Tonne ES...",
      date: `${String(25 - i).padStart(2, "0")}/05/25`
    })), [totalEntries]
  );

  // Table columns definition
  const columns = useMemo<ColumnDef<ProductQuote>[]>(
    () => [
      {
        accessorKey: 'id',
        header: 'Sr. No.',
        cell: info => info.getValue(),
        size: 64,
      },
      {
        accessorKey: 'name',
        header: 'Name',
        cell: info => info.getValue(),
      },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: info => info.getValue(),
      },
      {
        accessorKey: 'mobile',
        header: 'Mobile No.',
        cell: info => info.getValue(),
      },
      {
        accessorKey: 'company',
        header: 'Company Name',
        cell: info => info.getValue(),
      },
      {
        accessorKey: 'product',
        header: 'Product Name',
        cell: info => info.getValue(),
      },
      {
        accessorKey: 'date',
        header: 'Date',
        cell: info => info.getValue(),
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
      },
    ],
    []
  );

  // Filtering and sorting logic
  const filteredData = useMemo(() => {
    if (!globalFilter) return allData;
    const filter = globalFilter.toLowerCase();
    return allData.filter(
      item =>
        item.name.toLowerCase().includes(filter) ||
        item.email.toLowerCase().includes(filter) ||
        item.mobile.toLowerCase().includes(filter) ||
        item.company.toLowerCase().includes(filter) ||
        item.product.toLowerCase().includes(filter) ||
        item.date.toLowerCase().includes(filter)
    );
  }, [allData, globalFilter]);

  // Table instance
  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting: sortBy,
    },
    onSortingChange: setSortBy,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination: true,
    pageCount: Math.ceil(filteredData.length / pageSize),
  });

  // Paginated data
  const paginatedRows = table.getSortedRowModel().rows.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(filteredData.length / pageSize);

  function handlePageChange(newPage: number) {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  }

  return (
    <div className="bg-white p-6 overflow-y-auto">
      <div className="w-full mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Product Catalogue</h1>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-md hover:bg-red-100 transition-colors">
              <Trash2 size={16} />
              Delete
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors">
              <Download size={16} />
              Export as Excel
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-2">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Show</span>
            <Select value={String(pageSize)} onValueChange={val => { setPageSize(Number(val)); setPage(1); }}>
              <SelectTrigger className="w-[80px] border border-gray-300 rounded px-3 py-1 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className='flex gap-6'>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Sort by</span>
              <Select
                value={
                  sortBy[0]?.id === 'date'
                    ? sortBy[0].desc
                      ? 'Latest'
                      : 'Oldest'
                    : sortBy[0]?.id === 'name'
                      ? 'Name'
                      : sortBy[0]?.id === 'company'
                        ? 'Company'
                        : 'Latest'
                }
                onValueChange={value => {
                  if (value === 'Latest') setSortBy([{ id: 'date', desc: true }]);
                  else if (value === 'Oldest') setSortBy([{ id: 'date', desc: false }]);
                  else if (value === 'Name') setSortBy([{ id: 'name', desc: false }]);
                  else if (value === 'Company') setSortBy([{ id: 'company', desc: false }]);
                }}
              >
                <SelectTrigger className="w-[120px] border border-gray-300 rounded px-3 py-1 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Latest">Latest</SelectItem>
                  <SelectItem value="Oldest">Oldest</SelectItem>
                  <SelectItem value="Name">Name</SelectItem>
                  <SelectItem value="Company">Company</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search..."
                value={globalFilter}
                onChange={e => {
                  setGlobalFilter(e.target.value);
                  setPage(1);
                }}
                className="border border-gray-300 rounded px-3 py-1 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-100">
                {table.getHeaderGroups()[0].headers.map(header => {
                  const isSortable = header.column.getCanSort?.();
                  const sorted = header.column.getIsSorted?.();
                  return (
                    <TableHead
                      key={header.id}
                      style={{ width: header.getSize() }}
                      className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none ${isSortable ? 'hover:text-blue-600' : ''}`}
                      onClick={isSortable ? header.column.getToggleSortingHandler() : undefined}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {sorted === 'asc' && <span> ▲</span>}
                      {sorted === 'desc' && <span> ▼</span>}
                    </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRows.length === 0 ? (
                <TableRow className="">
                  <TableCell colSpan={columns.length} className="text-center py-8">
                    No data found.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedRows.map(row => (
                  <TableRow key={row.original.id} className="hover:bg-[#5ca131]/20">
                    {row.getVisibleCells().map(cell => (
                      <TableCell
                        key={cell.id}
                        className="px-4 py-4 text-sm text-gray-900 "
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between gap-4 mt-6">
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
                {page > 2 && totalPages > 4 && (
                  <PaginationItem>
                    <PaginationLink
                      isActive={page === 1}
                      onClick={() => handlePageChange(1)}
                      className={`w-8 h-8 p-0 rounded-md border-none text-sm ${page === 1
                        ? "bg-[#5CA131] text-white hover:bg-green-700"
                        : "bg-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                        }`}
                    >
                      1
                    </PaginationLink>
                  </PaginationItem>
                )}
                {page > 3 && totalPages > 5 && (
                  <PaginationItem>
                    <span className="px-2 text-gray-400">...</span>
                  </PaginationItem>
                )}
                {Array.from({ length: totalPages }, (_, idx) => idx + 1)
                  .filter(
                    (p) =>
                      p === 1 ||
                      p === totalPages ||
                      (p >= page - 1 && p <= page + 1)
                  )
                  .map((p) => (
                    <PaginationItem key={p}>
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
                    </PaginationItem>
                  ))}
                {page < totalPages - 2 && totalPages > 5 && (
                  <PaginationItem>
                    <span className="px-2 text-gray-400">...</span>
                  </PaginationItem>
                )}
                {page < totalPages - 1 && totalPages > 4 && (
                  <PaginationItem>
                    <PaginationLink
                      isActive={page === totalPages}
                      onClick={() => handlePageChange(totalPages)}
                      className={`w-8 h-8 p-0 rounded-md border-none text-sm ${page === totalPages
                        ? "bg-[#5CA131] text-white hover:bg-green-700"
                        : "bg-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                        }`}
                    >
                      {totalPages}
                    </PaginationLink>
                  </PaginationItem>
                )}
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
          <div className="text-sm text-gray-600">
            Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, filteredData.length)} out of {filteredData.length} entries
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductQuoteTable;