"use client";

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useReactTable, getCoreRowModel, flexRender, ColumnDef, SortingState } from '@tanstack/react-table';

// UI Components from shadcn/ui
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationLink, PaginationNext, PaginationEllipsis } from '@/components/ui/pagination';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"; // Assuming you use a toast library like sonner

// Icons
import { PlusCircle, Pencil, Trash2, LayoutTemplate } from "lucide-react";

// --- TypeScript Interface for a Blog Post ---
interface Blog {
  id: number;
  blog_title: string;
  image1: string;
  author_name: string | null;
  created_at: string;
}

const PAGE_SIZE = 10; // You can adjust the page size

const BlogsTable = () => {
  const router = useRouter();
  const [data, setData] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalBlogs, setTotalBlogs] = useState(0);

  // States for filtering, sorting, pagination
  const [page, setPage] = useState(1);
  const [globalFilter, setGlobalFilter] = useState('');
  const [debouncedGlobalFilter, setDebouncedGlobalFilter] = useState('');
  const [sortBy, setSortBy] = useState<SortingState>([
    { id: 'created_at', desc: true } // Default sort by newest
  ]);

  // Debounce search input to avoid excessive API calls
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedGlobalFilter(globalFilter);
      setPage(1); // Reset to first page on new search
    }, 500);
    return () => clearTimeout(handler);
  }, [globalFilter]);

  // --- API Request Logic ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('page_size', String(PAGE_SIZE));

      if (debouncedGlobalFilter) {
        params.append('search', debouncedGlobalFilter);
      }

      if (sortBy.length > 0) {
        const sort = sortBy[0];
        params.append('ordering', `${sort.desc ? '-' : ''}${sort.id}`);
      }

      const response = await api.get(`/blogs/`, { params });
      setData(response.data.results);
      setTotalBlogs(response.data.count);
    } catch (error) {
      console.error("Failed to fetch blogs:", error);
      toast.error("Failed to fetch blogs. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedGlobalFilter, sortBy]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalPages = Math.ceil(totalBlogs / PAGE_SIZE);

  // --- Delete Blog Handler ---
  const handleDelete = async (blogId: number) => {
    try {
      await api.delete(`/blogs/${blogId}/`);
      toast.success("Blog deleted successfully!");
      // Refresh data after deletion
      fetchData();
    } catch (error) {
      console.error("Failed to delete blog:", error);
      toast.error("Failed to delete blog. Please try again.");
    }
  };

  // --- Table Column Definitions ---
  const columns = useMemo<ColumnDef<Blog>[]>(() => [
    {
      header: 'Sr. No.',
      cell: info => info.row.index + 1 + (page - 1) * PAGE_SIZE,
    },
    // {
    //   accessorKey: 'image1',
    //   header: 'Image',
    //   cell: ({ row }) => (
    //     <img
    //       src={row.original.image1 || } // Provide a fallback image
    //       alt={row.original.blog_title}
    //       className="w-16 h-10 object-cover rounded"
    //       onError={(e) => { e.currentTarget.src = '/placeholder.png'; }} // Fallback on error
    //     />
    //   ),
    // },
    {
      accessorKey: 'blog_title',
      header: 'Blog Title',
    },
    {
      accessorKey: 'author_name',
      header: 'Author',
      cell: info => info.getValue() || 'N/A',
    },
    {
      accessorKey: 'created_at',
      header: 'Date Published',
      cell: info => new Date(info.getValue() as string).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {/* Edit Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/dashboard/blogs/edit/${row.original.id}`)}
          >
            <Pencil className="h-4 w-4" />
          </Button>

          {/* Delete Button with Confirmation */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the blog post.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleDelete(row.original.id)}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ),
    },
  ], [page, router]);

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

  // --- Pagination Logic ---
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
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
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="mb-6 flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Manage Blogs</h1>
          <p className="text-sm text-gray-500 mt-1">Add, edit, or delete blog posts.</p>
        </div>
        <Button onClick={() => router.push('/admin/blogs/add')} className="flex items-center gap-2">
          <PlusCircle size={16} />
          Add New Blog
        </Button>
      </div>

      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-4">
        <div className='flex items-center gap-4 flex-wrap'>
          <div className="flex items-center">
            <input
              type="text"
              placeholder="Search by title..."
              value={globalFilter}
              onChange={e => setGlobalFilter(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1 text-sm h-9 w-full md:w-[300px]"
            />
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
                <SelectItem value="blog_title:false">Title (A-Z)</SelectItem>
                <SelectItem value="blog_title:true">Title (Z-A)</SelectItem>
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
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={columns.length} className="text-center py-10">Loading blogs...</td></tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr><td colSpan={columns.length} className="text-center py-10">No blogs found.</td></tr>
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
          {!loading && `Showing ${data.length > 0 ? (page - 1) * PAGE_SIZE + 1 : 0} to ${Math.min(page * PAGE_SIZE, totalBlogs)} of ${totalBlogs} entries`}
        </div>
        {!loading && totalPages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious onClick={() => handlePageChange(page - 1)} className={page === 1 ? "pointer-events-none opacity-50" : ""} />
              </PaginationItem>
              {generatePagination().map((p, index) => (
                <PaginationItem key={index}>
                  {typeof p === 'string' ? <PaginationEllipsis /> : <PaginationLink isActive={page === p} onClick={() => handlePageChange(p)}>{p}</PaginationLink>}
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext onClick={() => handlePageChange(page + 1)} className={page === totalPages ? "pointer-events-none opacity-50" : ""} />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </div>
  );
};

export default BlogsTable;