"use client";

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { useReactTable, getCoreRowModel, flexRender, ColumnDef, SortingState } from '@tanstack/react-table';
import { toast } from "sonner";
import Cookies from 'js-cookie';

// --- Component & UI Imports ---
import BlogForm, { BlogData, BlogCategory } from './BlogForm';
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationLink, PaginationNext, PaginationEllipsis } from '@/components/ui/pagination';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { PlusCircle, Pencil, Trash2 } from "lucide-react";

// --- TypeScript Interfaces ---
interface Blog {
  id: number | string;
  blog_title: string;
  author_name: string | null;
  created_at: string;
  blog_url: string;
  isDraft?: boolean;
}

const PAGE_SIZE = 20;
const DRAFT_COOKIE_KEY = 'blogDraft';

const BlogsTable = () => {
  const [data, setData] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalBlogs, setTotalBlogs] = useState(0);
  const [page, setPage] = useState(1);
  const [globalFilter, setGlobalFilter] = useState('');
  const [debouncedGlobalFilter, setDebouncedGlobalFilter] = useState('');
  const [sortBy, setSortBy] = useState<SortingState>([{ id: 'created_at', desc: true }]);

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<BlogData | null>(null);
  const [categories, setCategories] = useState<BlogCategory[]>([]);

  const [formSessionId, setFormSessionId] = useState<number>(Date.now());

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        page_size: String(PAGE_SIZE),
        ...(debouncedGlobalFilter && { search: debouncedGlobalFilter }),
        ...(sortBy.length > 0 && { ordering: `${sortBy[0].desc ? '-' : ''}${sortBy[0].id}` }),
      });
      const response = await api.get(`/blogs/`, { params });

      let blogs: Blog[] = response.data.results;
      let finalCount = response.data.count;
      const draftCookie = Cookies.get(DRAFT_COOKIE_KEY);

      if (draftCookie) {
        try {
          const draftData = JSON.parse(draftCookie);
          if (draftData && draftData.blog_title) {
            const draftEntry: Blog = {
              ...draftData,
              id: 'draft',
              created_at: new Date().toISOString(),
              isDraft: true,
            };
            blogs = [draftEntry, ...blogs];
            finalCount += 1;
          }
        } catch (e) {
          console.error("Failed to parse blog draft cookie:", e);
          Cookies.remove(DRAFT_COOKIE_KEY);
        }
      }
      setData(blogs);
      setTotalBlogs(finalCount);
    } catch (error) {
      toast.error("Failed to fetch blogs.");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedGlobalFilter, sortBy]);

  useEffect(() => {
    const handler = setTimeout(() => { setDebouncedGlobalFilter(globalFilter); setPage(1); }, 500);
    return () => clearTimeout(handler);
  }, [globalFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/categories/');
        setCategories(response.data.results || response.data);
      } catch (error) {
        toast.error("Failed to load blog categories.");
      }
    };
    fetchCategories();
  }, []);

  const handleDelete = async (blogUrl: string) => {
    try {
      await api.delete(`/blogs/${blogUrl}/`);
      toast.success("Blog deleted successfully!");
      fetchData();
    } catch (error) {
      toast.error("Failed to delete blog.");
    }
  };

  const handleCreateOrContinueDraft = () => {
    setEditingBlog(null);
    setFormSessionId(Date.now()); // Generate a new key for this session
    setIsSheetOpen(true);
  };

  const handleEditSavedBlog = async (blog: Blog) => {
    try {
      toast.loading("Loading blog data...");
      const response = await api.get(`/blogs/${blog.blog_url}/`);
      const blogData = { ...response.data, blog_category: String(response.data.blog_category) };
      setEditingBlog(blogData);
      setFormSessionId(Date.now()); // Generate a new key for this session
      setIsSheetOpen(true);
      toast.dismiss();
    } catch (error) {
      toast.dismiss();
      toast.error("Failed to load blog for editing.");
    }
  };

  const columns = useMemo<ColumnDef<Blog>[]>(() => [
    { header: 'Sr. No.', cell: info => info.row.original.isDraft ? <span className="font-bold text-blue-600">Draft</span> : info.row.index + (page - 1) * PAGE_SIZE },
    { accessorKey: 'blog_title', header: 'Blog Title' },
    { accessorKey: 'author_name', header: 'Author', cell: info => info.getValue() || 'N/A' },
    { accessorKey: 'created_at', header: 'Date', cell: info => info.row.original.isDraft ? '—' : new Date(info.getValue() as string).toLocaleDateString() },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {/* ✅ --- START: THE KEY FIX --- */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (row.original.isDraft) {
                // For drafts, open the form in "create" mode.
                handleCreateOrContinueDraft();
              } else {
                // For saved blogs, open the form in "edit" mode.
                handleEditSavedBlog(row.original);
              }
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          {/* ✅ --- END: THE KEY FIX --- */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={row.original.isDraft}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>This will permanently delete the blog post. This action cannot be undone.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleDelete(row.original.blog_url)}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ),
    },
  ], [page, fetchData]); // Dependency array is correct

  // The rest of the component (table definition, pagination, JSX) remains unchanged.
  // ...
  const table = useReactTable({
    data,
    columns,
    state: { sorting: sortBy },
    onSortingChange: setSortBy,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualFiltering: true,
    manualSorting: true,
    pageCount: Math.ceil(totalBlogs / PAGE_SIZE),
  });

  const totalPages = table.getPageCount();

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
      <div className="mb-6 flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Manage Blogs</h1>
          <p className="text-sm text-gray-500 mt-1">Add, edit, or delete blog posts.</p>
        </div>
        <Button className="flex items-center gap-2" onClick={handleCreateOrContinueDraft}>
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
                  <tr key={row.id} className={`border-b border-gray-100 hover:bg-gray-50 ${row.original.isDraft ? 'bg-blue-50' : ''}`}>
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
          {!loading && `Showing ${data.length > 0 ? (page - 1) * PAGE_SIZE + 1 : 0} to ${Math.min((page - 1) * PAGE_SIZE + data.length, totalBlogs)} of ${totalBlogs} entries`}
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

      <BlogForm
        formSessionId={formSessionId} // Pass the session key as a prop
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        initialData={editingBlog}
        categories={categories}
        onSuccess={() => {
          setIsSheetOpen(false);
          fetchData();
        }}
      />
    </div>
  );
};

export default BlogsTable;