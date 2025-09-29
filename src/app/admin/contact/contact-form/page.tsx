// src/app/admin/contact-forms/page.tsx
"use client";

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { useReactTable, getCoreRowModel, flexRender, ColumnDef, SortingState } from '@tanstack/react-table';
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationLink, PaginationNext, PaginationEllipsis } from '@/components/ui/pagination';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download, Search, Mail, Phone, MapPin, Loader2, ArrowUpDown, MessageSquare, Clock } from "lucide-react";
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'; // Required Dialog Imports

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
  // Constants
  const PAGE_SIZE = 20;

  // States for data
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
  
  // States for Dialog/Modal
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<ContactForm | null>(null);

  // --- Handlers ---
  
  const handleViewMessage = (submission: ContactForm) => {
    setSelectedSubmission(submission);
    setIsDetailsModalOpen(true);
  };
  
  // --- Effects ---

  // 1. Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedGlobalFilter(globalFilter);
      if (globalFilter !== debouncedGlobalFilter) setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [globalFilter, debouncedGlobalFilter]);

  // 2. API Request Logic
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('page_size', String(PAGE_SIZE)); 
      
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
  }, [page, debouncedGlobalFilter, sortBy]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalPages = Math.ceil(totalSubmissions / PAGE_SIZE);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) setPage(newPage);
  };

  const handleExportToExcel = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page_size', String(totalSubmissions)); 

      const response = await api.get(`/contact-forms/`, { params });
      const submissionsToExport: ContactForm[] = response.data.results;

      const headers = ['First Name', 'Last Name', 'Email', 'Company', 'Location', 'Phone', 'Message', 'Submitted At'];
      const csvRows = [headers.join(',')];

      submissionsToExport.forEach(sub => {
        const row = [
          `"${sub.first_name}"`,
          `"${sub.last_name}"`,
          `"${sub.email}"`,
          `"${sub.company_name}"`,
          `"${sub.location}"`,
          `"${sub.phone}"`,
          `"${sub.message.replace(/"/g, '""').replace(/\n/g, ' ')}"`,
          `"${new Date(sub.created_at).toLocaleString()}"`,
        ];
        csvRows.push(row.join(','));
      });

      const csvString = csvRows.join('\n');

      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'contact_form_submissions.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error("Failed to export submissions:", error);
      alert("Failed to export data. Please ensure the total submission count is not too large or check the network.");
    } finally {
      setLoading(false);
    }
  };

  // --- Table Configuration ---
  const columns = useMemo<ColumnDef<ContactForm>[]>(() => [
    {
      header: 'ID',
      accessorKey: 'id',
      size: 50,
      enableSorting: false,
      cell: info => info.row.index + 1 + (page - 1) * PAGE_SIZE,
    },
    {
      accessorKey: 'first_name',
      header: ({ column }) => (
        <div className="flex items-center" onClick={column.getToggleSortingHandler()}>
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </div>
      ),
      accessorFn: row => `${row.first_name} ${row.last_name}`,
      id: 'first_name', 
    },
    {
      accessorKey: 'company_name',
      header: ({ column }) => (
        <div className="flex items-center" onClick={column.getToggleSortingHandler()}>
          Company
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </div>
      ),
      id: 'company_name',
      cell: ({ row }) => (
        <div>
          <p className="font-semibold text-gray-900">{row.original.company_name || 'N/A'}</p>
          <p className="text-xs text-gray-500 flex items-center mt-1">
            <MapPin size={12} className="mr-1 flex-shrink-0" />
            {row.original.location || 'Not provided'}
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Contact Info',
      id: 'email',
      cell: ({ row }) => (
        <div className="text-sm">
          <a href={`mailto:${row.original.email}`} className="text-blue-600 hover:underline break-all flex items-center">
            <Mail size={12} className="mr-1 flex-shrink-0" />
            {row.original.email}
          </a>
          <div className="text-gray-500 mt-1 flex items-center">
            <Phone size={12} className="mr-1 flex-shrink-0" />
            {row.original.phone || 'N/A'}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'message',
      header: 'Message',
      enableSorting: false,
      cell: ({ row, cell }) => (
        <div className='flex items-center'>
            <p 
                className="max-w-xs text-gray-800 line-clamp-2 cursor-pointer hover:underline" 
                title={cell.getValue() as string}
                onClick={() => handleViewMessage(row.original)} // Make the text clickable
            >
                {cell.getValue() as string}
            </p>
            <MessageSquare size={16} className='ml-2 text-blue-500 flex-shrink-0 cursor-pointer' onClick={() => handleViewMessage(row.original)} />
        </div>
      ),
    },
    {
      accessorKey: 'created_at',
      header: ({ column }) => (
        <div className="flex items-center justify-end w-full" onClick={column.getToggleSortingHandler()}>
          Submitted At
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </div>
      ),
      id: 'created_at',
      size: 150,
      cell: info => (
        <div className="text-right text-xs">
          {new Date(info.getValue() as string).toLocaleString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
          })}
        </div>
      ),
    },
  ], [page]); 

  const table = useReactTable({
    data, columns, state: { sorting: sortBy }, onSortingChange: setSortBy,
    getCoreRowModel: getCoreRowModel(), manualPagination: true, manualFiltering: true,
    manualSorting: true, pageCount: totalPages,
  });

  const generatePagination = () => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 5) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
        return pages;
    }
    
    if (page <= 3) return [1, 2, 3, 4, '...', totalPages];
    if (page >= totalPages - 2) return [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, '...', page - 1, page, page + 1, '...', totalPages];
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10">
      <Card className="shadow-xl">
        <CardHeader className="flex flex-row justify-between items-center bg-gray-50 border-b p-4">
          <CardTitle className="text-2xl font-bold text-gray-800">Contact Form Submissions</CardTitle>
          <Button 
            onClick={handleExportToExcel} 
            disabled={loading || totalSubmissions === 0} 
            className="bg-[#5CA131] hover:bg-green-700 text-white flex items-center gap-2 transition-colors"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            Export ({totalSubmissions})
          </Button>
        </CardHeader>

        <CardContent className="p-4">
          {/* Controls Bar */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
            {/* Search Input */}
            <div className="relative flex-grow max-w-lg">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                type="text" 
                placeholder="Search by name, email, company, or message..." 
                value={globalFilter}
                onChange={e => setGlobalFilter(e.target.value)}
                className="pl-10 h-10 border-gray-300 focus:border-[#5CA131] focus:ring-1 focus:ring-[#5CA131]" 
              />
            </div>
            
            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Sort by:</span>
              <Select
                value={sortBy[0] ? `${sortBy[0].id}:${sortBy[0].desc}` : 'created_at:true'}
                onValueChange={value => {
                  const [id, desc] = value.split(':');
                  setSortBy([{ id, desc: desc === 'true' }]);
                }}>
                <SelectTrigger className="w-[180px] h-10 border-gray-300">
                  <SelectValue placeholder="Select Sort Option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at:true">Newest First</SelectItem>
                  <SelectItem value="created_at:false">Oldest First</SelectItem>
                  <SelectItem value="company_name:false">Company (A-Z)</SelectItem>
                  <SelectItem value="company_name:true">Company (Z-A)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table Container - Using max-h and overflow-y-auto for scrolling */}
          <div className="border border-gray-200 rounded-lg shadow-sm">
            <div className="relative overflow-auto max-h-[68vh] w-full"> 
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-20 bg-gray-100 border-b border-gray-200">
                  {table.getHeaderGroups().map(headerGroup => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map(header => (
                        <th 
                          key={header.id} 
                          className="py-3 px-4 text-xs uppercase font-semibold text-gray-700 tracking-wider"
                          style={{ width: header.getSize() }}
                        >
                          <div 
                            className={`flex items-center ${header.column.getCanSort() ? 'cursor-pointer select-none' : ''} ${header.id === 'created_at' ? 'justify-end' : 'justify-start'}`}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {header.column.getIsSorted() === 'asc' ? ' ▲' : header.column.getIsSorted() === 'desc' ? ' ▼' : ''}
                          </div>
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={columns.length} className="text-center py-20 text-gray-500"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" /> Loading submissions...</td></tr>
                  ) : table.getRowModel().rows.length === 0 ? (
                    <tr><td colSpan={columns.length} className="text-center py-20 text-gray-500">No submissions found matching your criteria.</td></tr>
                  ) : (
                    table.getRowModel().rows.map(row => (
                      <tr key={row.id} className="border-b border-gray-100 transition-colors hover:bg-blue-50/50">
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
        </CardContent>
      </Card>
      
      {/* Pagination Bar */}
      <div className="flex items-center justify-between mt-6 p-3 border border-gray-200 bg-white rounded-lg shadow-sm">
        <div className="text-sm text-gray-600">
          {!loading && `Showing ${data.length > 0 ? (page - 1) * PAGE_SIZE + 1 : 0} to ${Math.min(page * PAGE_SIZE, totalSubmissions)} of ${totalSubmissions} entries`}
        </div>
        {!loading && totalPages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious onClick={() => handlePageChange(page - 1)} className={page === 1 ? "pointer-events-none opacity-50" : "hover:bg-gray-100"} />
              </PaginationItem>
              
              {generatePagination().map((p, index) => (
                <PaginationItem key={index}>
                  {typeof p === 'string' 
                    ? <PaginationEllipsis className="text-gray-500" /> 
                    : <PaginationLink 
                        isActive={page === p} 
                        onClick={() => handlePageChange(p)}
                        className={`font-semibold ${page === p ? 'bg-[#5CA131] text-white hover:bg-green-700' : 'text-gray-700 hover:bg-gray-100'}`}
                      >
                        {p}
                      </PaginationLink>
                  }
                </PaginationItem>
              ))}
              
              <PaginationItem>
                <PaginationNext onClick={() => handlePageChange(page + 1)} className={page === totalPages ? "pointer-events-none opacity-50" : "hover:bg-gray-100"} />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
      
      {/* --- Message Details Dialog --- */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="sm:max-w-[600px] p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-800">
              Message Details
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600">
              Complete submission details from {selectedSubmission?.first_name} {selectedSubmission?.last_name}.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4 border-b pb-3 text-sm">
              <DetailItem icon={<Mail size={16} className='text-blue-500' />} label="Email" value={selectedSubmission?.email} href={`mailto:${selectedSubmission?.email}`} />
              <DetailItem icon={<Phone size={16} className='text-blue-500' />} label="Phone" value={selectedSubmission?.phone} href={`tel:${selectedSubmission?.phone}`} />
              <DetailItem icon={<MapPin size={16} className='text-gray-500' />} label="Company" value={selectedSubmission?.company_name} />
              <DetailItem icon={<Clock size={16} className='text-gray-500' />} label="Submitted" value={selectedSubmission?.created_at ? new Date(selectedSubmission.created_at).toLocaleString() : 'N/A'} />
              <DetailItem icon={<MessageSquare size={16} className='text-gray-500' />} label="Location" value={selectedSubmission?.location} />
            </div>

            <div>
                <p className="font-semibold text-gray-800 mb-2 flex items-center">
                    <MessageSquare size={18} className='mr-2 text-[#5CA131]' />
                    Full Message:
                </p>
                <div className="bg-gray-50 border p-3 rounded-md max-h-60 overflow-y-auto">
                    <p className="text-gray-700 text-sm whitespace-pre-wrap">
                        {selectedSubmission?.message || "No message provided."}
                    </p>
                </div>
            </div>
          </div>
          <div className='flex justify-end pt-4'>
              <Button onClick={() => setIsDetailsModalOpen(false)} variant="outline">Close</Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Helper component for rendering dialog details */}
      {selectedSubmission && <style jsx global>{`
          .whitespace-pre-wrap {
              white-space: pre-wrap;
          }
      `}</style>}
    </div>
  );
};

// Helper component for clean detail list in the dialog
const DetailItem = ({ icon, label, value, href }: { icon: React.ReactNode, label: string, value?: string, href?: string }) => (
    <div className="flex items-center space-x-2">
        {icon}
        <div>
            <span className="text-gray-500 text-xs block">{label}</span>
            {href ? (
                <a href={href} className="text-sm text-blue-600 hover:underline font-medium break-words">{value || 'N/A'}</a>
            ) : (
                <p className="text-sm text-gray-800 font-medium break-words">{value || 'N/A'}</p>
            )}
        </div>
    </div>
);

export default ContactFormsTable;