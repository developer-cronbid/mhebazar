"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { FileSpreadsheet, Trash2, Search, Plus, MoreVertical, Pencil, Upload, Image as ImageIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import api from '@/lib/api';
import SubcategoryForm from '@/components/forms/uploadForm/SubcategoryForm';
import Image from "next/image";
import { Subcategory, Category } from '@/types';

const SubcategoriesTable = () => {
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedSubcategory, setSelectedSubcategory] = useState<Subcategory | undefined>(undefined);

  // Filter and pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('Latest');
  const [showCount, setShowCount] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubcategories, setSelectedSubcategories] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('');

  // Delete confirmation state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [subcategoryToDelete, setSubcategoryToDelete] = useState<Subcategory | null>(null);

  // Fetch subcategories and categories
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch subcategories
        const subcategoriesResponse = await api.get('subcategories/');
        if (Array.isArray(subcategoriesResponse.data.results || subcategoriesResponse.data)) {
          setSubcategories(subcategoriesResponse.data.results || subcategoriesResponse.data);
        } else {
          console.warn("API response for subcategories was not an array:", subcategoriesResponse.data);
          setSubcategories([]);
        }

        // Fetch categories for filter dropdown
        const categoriesResponse = await api.get('categories/');
        if (Array.isArray(categoriesResponse.data.results || categoriesResponse.data)) {
          setCategories(categoriesResponse.data.results || categoriesResponse.data);
        } else {
          setCategories([]);
        }

        setError(null);
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setError("Could not load subcategories. Please try again later.");
        toast.error("Failed to fetch subcategories!");
        setSubcategories([]);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Helper function to get category name
  // const getCategoryName = (subcategory: Subcategory): string => {
  //   return subcategory.category_name || 'Unknown Category';
  // };

  // Filter and sort subcategories
  const filteredAndSortedSubcategories = useMemo(() => {
    let filtered = subcategories;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(subcategory =>
        subcategory.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subcategory.category_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply category filter
    if (categoryFilter) {
      filtered = filtered.filter(subcategory =>
        subcategory.category.toString() === categoryFilter
      );
    }

    // Apply sorting
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'Latest': return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        case 'Oldest': return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
        case 'Name A-Z': return a.name.localeCompare(b.name);
        case 'Name Z-A': return b.name.localeCompare(a.name);
        case 'Category A-Z': return a.category_name.localeCompare(b.category_name);
        case 'Category Z-A': return b.category_name.localeCompare(a.category_name);
        default: return 0;
      }
    });
  }, [subcategories, searchTerm, sortBy, categoryFilter]);

  // Pagination logic
  const totalPages = Math.ceil(filteredAndSortedSubcategories.length / showCount);
  const startIndex = (currentPage - 1) * showCount;
  const endIndex = startIndex + showCount;
  const currentSubcategories = filteredAndSortedSubcategories.slice(startIndex, endIndex);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
    setSelectAll(false);
    setSelectedSubcategories(new Set());
  }, [searchTerm, sortBy, showCount, categoryFilter]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) setCurrentPage(newPage);
  };

  const handleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    if (newSelectAll) {
      setSelectedSubcategories(new Set(currentSubcategories.map(s => s.id)));
    } else {
      setSelectedSubcategories(new Set());
    }
  };

  const handleSubcategorySelect = (subcategoryId: number) => {
    const newSelected = new Set(selectedSubcategories);
    if (newSelected.has(subcategoryId)) newSelected.delete(subcategoryId);
    else newSelected.add(subcategoryId);
    setSelectedSubcategories(newSelected);
    setSelectAll(newSelected.size === currentSubcategories.length && currentSubcategories.length > 0);
  };

  // Handle subcategory edit
  const handleEditClick = async (subcategoryId: number) => {
    try {
      const response = await api.get(`subcategories/${subcategoryId}/`);
      setSelectedSubcategory(response.data);
      setIsSheetOpen(true);
    } catch (error) {
      console.error('Error fetching subcategory details:', error);
      toast.error("Failed to load subcategory data for editing.");
    }
  };

  // Handle subcategory delete
  const handleDeleteSubcategory = async () => {
    if (!subcategoryToDelete) return;

    try {
      await api.delete(`subcategories/${subcategoryToDelete.id}/`);
      toast.success(`Subcategory "${subcategoryToDelete.name}" deleted successfully.`);
      setSubcategories(prev => prev.filter(s => s.id !== subcategoryToDelete.id));
      setDeleteModalOpen(false);
      setSubcategoryToDelete(null);
    } catch (err) {
      console.error("Failed to delete subcategory:", err);
      toast.error("Failed to delete the subcategory.");
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedSubcategories.size === 0) {
      toast.error('Please select subcategories to delete.');
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${selectedSubcategories.size} subcategories?`)) {
      try {
        await Promise.all(
          Array.from(selectedSubcategories).map(id => api.delete(`subcategories/${id}/`))
        );

        toast.success(`Deleted ${selectedSubcategories.size} subcategories.`);
        setSubcategories(prev => prev.filter(s => !selectedSubcategories.has(s.id)));
        setSelectedSubcategories(new Set());
        setSelectAll(false);
      } catch (err) {
        console.error("Failed to delete subcategories:", err);
        toast.error("An error occurred while deleting subcategories.");
      }
    }
  };

  // Handle image upload
  const handleImageUpload = async (subcategoryId: number, type: 'image' | 'banner', file: File) => {
    const formData = new FormData();
    formData.append(type === 'image' ? 'sub_image' : 'sub_banner', file);

    try {
      const endpoint = type === 'image' ? 'upload_Image' : 'upload_Banner';
      await api.post(`subcategories/${subcategoryId}/${endpoint}/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success(`${type === 'image' ? 'Image' : 'Banner'} uploaded successfully.`);

      // Refresh subcategories to get updated image URLs
      const response = await api.get('subcategories/');
      setSubcategories(response.data.results || response.data);
    } catch (error) {
      console.error(`Failed to upload ${type}:`, error);
      toast.error(`Failed to upload ${type}.`);
    }
  };

  // Helper function for image URLs
  const getImageUrl = (imageUrl: string | undefined): string => {
    if (!imageUrl) return '/no-image.png';

    try {
      if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        return imageUrl;
      }
      return `${process.env.NEXT_PUBLIC_API_URL}${imageUrl}`;
    } catch (error) {
      console.error('Error constructing image URL:', error);
      return '/no-image.png';
    }
  };

  const PaginationButton = ({ onClick, disabled, children, isActive = false }: {
    onClick: () => void,
    disabled: boolean,
    children: React.ReactNode,
    isActive?: boolean
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-3 py-1 rounded-md text-sm transition-colors ${isActive
        ? 'bg-[#5CA131] text-white hover:bg-green-700'
        : disabled
          ? 'text-gray-400 cursor-not-allowed'
          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 border border-gray-200'
        }`}
    >
      {children}
    </button>
  );

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading subcategories...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-screen text-red-500 p-4 text-center">{error}</div>;
  }

  return (
    <div className="bg-gray-50 p-6 overflow-y-auto">
      <div className="w-full mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Subcategories Management</h1>
          <div className="flex space-x-2">
            <Button
              onClick={handleBulkDelete}
              variant="destructive"
              className="flex items-center space-x-2"
              disabled={selectedSubcategories.size === 0}
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Selected</span>
            </Button>
            <Button
              onClick={() => {/* Implement export logic */ }}
              className="bg-blue-500 hover:bg-blue-600 flex items-center space-x-2"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export as Excel</span>
            </Button>
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button
                  className="bg-[#5CA131] hover:bg-green-700 flex items-center space-x-2"
                  onClick={() => setSelectedSubcategory(undefined)}
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Subcategory</span>
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md p-0 flex flex-col">
                <SheetHeader className="p-4 border-b">
                  <SheetTitle>{selectedSubcategory ? 'Edit Subcategory' : 'Add New Subcategory'}</SheetTitle>
                  <SheetDescription>
                    {selectedSubcategory ? 'Make changes to the subcategory details below.' : 'Create a new subcategory with custom fields.'}
                  </SheetDescription>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto">
                  <SubcategoryForm subcategory={selectedSubcategory} onSuccess={() => {
                    setIsSheetOpen(false);
                    // Refresh data
                    const fetchData = async () => {
                      try {
                        const response = await api.get('subcategories/');
                        setSubcategories(response.data.results || response.data);
                      } catch (error) {
                        console.error('Failed to refresh data:', error);
                      }
                    };
                    fetchData();
                  }} />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label htmlFor="show-count" className="text-sm text-gray-600">Show</label>
                <select
                  id="show-count"
                  value={showCount}
                  onChange={(e) => setShowCount(Number(e.target.value))}
                  className="border rounded-md px-2 py-1 text-sm focus:ring-green-500 focus:border-green-500"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <label htmlFor="category-filter" className="text-sm text-gray-600">Category</label>
                <select
                  id="category-filter"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="border rounded-md px-2 py-1 text-sm focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id.toString()}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <label htmlFor="sort-by" className="text-sm text-gray-600">Sort by</label>
                <select
                  id="sort-by"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="border rounded-md px-2 py-1 text-sm focus:ring-green-500 focus:border-green-500"
                >
                  <option>Latest</option>
                  <option>Oldest</option>
                  <option>Name A-Z</option>
                  <option>Name Z-A</option>
                  <option>Category A-Z</option>
                  <option>Category Z-A</option>
                </select>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search subcategories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
            <div className="text-sm text-gray-600">
              Total: <span className="font-medium">{subcategories.length}</span> subcategories
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-12 px-4">
                  <input
                    type="checkbox"
                    className="rounded"
                    checked={selectAll}
                    onChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Subcategory</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Fields Count</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-center">Actions</TableHead>
                <TableHead className="text-right">More</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentSubcategories.length > 0 ? (
                currentSubcategories.map((subcategory) => (
                  <TableRow key={subcategory.id} className="hover:bg-gray-50">
                    <TableCell className="px-4">
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={selectedSubcategories.has(subcategory.id)}
                        onChange={() => handleSubcategorySelect(subcategory.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-4">
                        <div className="relative h-16 w-16 flex-shrink-0">
                          <Image
                            src={getImageUrl(subcategory.sub_image)}
                            alt={subcategory.name}
                            fill
                            className="object-cover rounded border border-gray-100 bg-white"
                            sizes="64px"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = "/no-image.png";
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {subcategory.name}
                          </h3>
                          {subcategory.meta_title && (
                            <p className="text-xs text-gray-500 truncate">
                              {subcategory.meta_title}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium text-blue-600">
                        {subcategory.category_name}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="text-sm text-gray-600 truncate">
                        {subcategory.meta_description || subcategory.description || 'No description'}
                      </p>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">
                        {subcategory.product_details?.length || 0} fields
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {subcategory.product_count || 0}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-gray-400">
                        {new Date(subcategory.updated_at).toLocaleDateString()}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          id={`sub-image-upload-${subcategory.id}`}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(subcategory.id, 'image', file);
                          }}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-2"
                          onClick={() => document.getElementById(`sub-image-upload-${subcategory.id}`)?.click()}
                        >
                          <ImageIcon className="w-3 h-3 mr-1" />
                          Image
                        </Button>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          id={`sub-banner-upload-${subcategory.id}`}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(subcategory.id, 'banner', file);
                          }}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-2"
                          onClick={() => document.getElementById(`sub-banner-upload-${subcategory.id}`)?.click()}
                        >
                          <Upload className="w-3 h-3 mr-1" />
                          Banner
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full">
                            <MoreVertical className="h-4 w-4 mx-auto" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[160px]">
                          <DropdownMenuItem
                            onSelect={(e) => {
                              e.preventDefault();
                              handleEditClick(subcategory.id);
                            }}
                            className="cursor-pointer"
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            <span>Edit</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSubcategoryToDelete(subcategory);
                              setDeleteModalOpen(true);
                            }}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                    No subcategories found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center mt-6">
          <span className="text-sm text-gray-600">
            Showing {Math.min(startIndex + 1, filteredAndSortedSubcategories.length)} to {Math.min(endIndex, filteredAndSortedSubcategories.length)} of {filteredAndSortedSubcategories.length} results
          </span>
          <div className="flex items-center space-x-2">
            <PaginationButton onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
              Previous
            </PaginationButton>
            <span className="text-sm text-gray-500">
              Page {currentPage} of {totalPages > 0 ? totalPages : 1}
            </span>
            <PaginationButton onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages || totalPages === 0}>
              Next
            </PaginationButton>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Subcategory</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the subcategory <span className="font-semibold">{subcategoryToDelete?.name}</span>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteSubcategory}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubcategoriesTable;