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
import CategoryForm from "@/components/forms/uploadForm/CategoryForm";
import Image from "next/image";

// Types
interface Category {
  id: number;
  name: string;
  description?: string;
  meta_title?: string;
  meta_description?: string;
  cat_image?: string;
  cat_banner?: string;
  product_details: ProductDetailField[];
  created_at: string;
  updated_at: string;
  product_count?: number;
  is_active: boolean;
}

interface ProductDetailField {
  name: string;
  label: string;
  type: "text" | "textarea" | "select" | "radio" | "checkbox";
  required: boolean;
  options?: { label: string; value: string; }[];
  placeholder?: string;
}


const CategoriesTable = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | undefined>(undefined);

  // Filter and pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('Latest');
  const [showCount, setShowCount] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  // Delete confirmation state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      try {
        const response = await api.get('categories/');

        if (Array.isArray(response.data.results || response.data)) {
          setCategories(response.data.results || response.data);
        } else {
          console.warn("API response for categories was not an array:", response.data);
          setCategories([]);
        }

        setError(null);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
        setError("Could not load categories. Please try again later.");
        toast.error("Failed to fetch categories!");
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Filter and sort categories
  const filteredAndSortedCategories = useMemo(() => {
    let filtered = categories;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(category =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase())
        // ||
        // category.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'Latest': return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        case 'Oldest': return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
        case 'Name A-Z': return a.name.localeCompare(b.name);
        case 'Name Z-A': return b.name.localeCompare(a.name);
        default: return 0;
      }
    });
  }, [categories, searchTerm, sortBy]);

  // Pagination logic
  const totalPages = Math.ceil(filteredAndSortedCategories.length / showCount);
  const startIndex = (currentPage - 1) * showCount;
  const endIndex = startIndex + showCount;
  const currentCategories = filteredAndSortedCategories.slice(startIndex, endIndex);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
    setSelectAll(false);
    setSelectedCategories(new Set());
  }, [searchTerm, sortBy, showCount]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) setCurrentPage(newPage);
  };

  const handleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    if (newSelectAll) {
      setSelectedCategories(new Set(currentCategories.map(c => c.id)));
    } else {
      setSelectedCategories(new Set());
    }
  };

  const handleCategorySelect = (categoryId: number) => {
    const newSelected = new Set(selectedCategories);
    if (newSelected.has(categoryId)) newSelected.delete(categoryId);
    else newSelected.add(categoryId);
    setSelectedCategories(newSelected);
    setSelectAll(newSelected.size === currentCategories.length && currentCategories.length > 0);
  };

  // Handle category edit
  const handleEditClick = async (categoryId: number) => {
    try {
      const response = await api.get(`categories/${categoryId}/`);
      setSelectedCategory(response.data);
      setIsSheetOpen(true);
    } catch (error) {
      console.error('Error fetching category details:', error);
      toast.error("Failed to load category data for editing.");
    }
  };

  // Handle category delete
  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;

    try {
      await api.delete(`categories/${categoryToDelete.id}/`);
      toast.success(`Category "${categoryToDelete.name}" deleted successfully.`);
      setCategories(prev => prev.filter(c => c.id !== categoryToDelete.id));
      setDeleteModalOpen(false);
      setCategoryToDelete(null);
    } catch (err) {
      console.error("Failed to delete category:", err);
      toast.error("Failed to delete the category.");
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedCategories.size === 0) {
      toast.error('Please select categories to delete.');
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${selectedCategories.size} categories?`)) {
      try {
        await Promise.all(
          Array.from(selectedCategories).map(id => api.delete(`categories/${id}/`))
        );

        toast.success(`Deleted ${selectedCategories.size} categories.`);
        setCategories(prev => prev.filter(c => !selectedCategories.has(c.id)));
        setSelectedCategories(new Set());
        setSelectAll(false);
      } catch (err) {
        console.error("Failed to delete categories:", err);
        toast.error("An error occurred while deleting categories.");
      }
    }
  };

  // Handle image upload
  const handleImageUpload = async (categoryId: number, type: 'image' | 'banner', file: File) => {
    const formData = new FormData();
    formData.append(type === 'image' ? 'cat_image' : 'cat_banner', file);

    try {
      const endpoint = type === 'image' ? 'upload_Image' : 'upload_Banner';
      await api.post(`categories/${categoryId}/${endpoint}/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success(`${type === 'image' ? 'Image' : 'Banner'} uploaded successfully.`);

      // Refresh categories to get updated image URLs
      const response = await api.get('categories/');
      setCategories(response.data.results || response.data);
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
    return <div className="flex justify-center items-center h-screen">Loading categories...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-screen text-red-500 p-4 text-center">{error}</div>;
  }

  return (
    <div className="bg-gray-50 p-6 overflow-y-auto">
      <div className="w-full mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Categories Management</h1>
          <div className="flex space-x-2">
            <Button
              onClick={handleBulkDelete}
              variant="destructive"
              className="flex items-center space-x-2"
              disabled={selectedCategories.size === 0}
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
                  onClick={() => setSelectedCategory(undefined)}
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Category</span>
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md p-0 flex flex-col">
                <SheetHeader className="p-4 border-b">
                  <SheetTitle>{selectedCategory ? 'Edit Category' : 'Add New Category'}</SheetTitle>
                  <SheetDescription>
                    {selectedCategory ? 'Make changes to the category details below.' : 'Create a new category with custom fields.'}
                  </SheetDescription>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto">
                  <CategoryForm category={selectedCategory} />
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
                </select>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
            <div className="text-sm text-gray-600">
              Total: <span className="font-medium">{categories.length}</span> categories |
              Active: <span className="font-medium text-green-700">{categories.filter(c => c.is_active).length}</span>
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
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Fields Count</TableHead>
                <TableHead>Products</TableHead>
                {/* <TableHead>Status</TableHead> */}
                <TableHead>Updated</TableHead>
                <TableHead className="text-center">Actions</TableHead>
                <TableHead className="text-right">More</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentCategories.length > 0 ? (
                currentCategories.map((category) => (
                  <TableRow key={category.id} className="hover:bg-gray-50">
                    <TableCell className="px-4">
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={selectedCategories.has(category.id)}
                        onChange={() => handleCategorySelect(category.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-4">
                        <div className="relative h-16 w-16 flex-shrink-0">
                          <Image
                            src={getImageUrl(category.cat_image)}
                            alt={category.name}
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
                            {category.name}
                          </h3>
                          {category.meta_title && (
                            <p className="text-xs text-gray-500 truncate">
                              {category.meta_title}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="text-sm text-gray-600 truncate">
                        {category.meta_description || 'No description'}
                      </p>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">
                        {category.product_details?.length || 0} fields
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {category.product_count || 0}
                      </span>
                    </TableCell>
                    {/* <TableCell>
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${category.is_active
                          ? "text-green-600 bg-green-50"
                          : "text-gray-600 bg-gray-50"
                        }`}>
                        {category.is_active ? "Active" : "Inactive"}
                      </span>
                    </TableCell> */}
                    <TableCell>
                      <span className="text-xs text-gray-400">
                        {new Date(category.updated_at).toLocaleDateString()}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          id={`image-upload-${category.id}`}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(category.id, 'image', file);
                          }}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-2"
                          onClick={() => document.getElementById(`image-upload-${category.id}`)?.click()}
                        >
                          <ImageIcon className="w-3 h-3 mr-1" />
                          Image
                        </Button>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          id={`banner-upload-${category.id}`}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(category.id, 'banner', file);
                          }}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-2"
                          onClick={() => document.getElementById(`banner-upload-${category.id}`)?.click()}
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
                              handleEditClick(category.id);
                            }}
                            className="cursor-pointer"
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            <span>Edit</span>
                          </DropdownMenuItem>
                          {/* <DropdownMenuItem onClick={() => window.open(`/categories/${category.id}`, '_blank')}>
                            <ExternalLink className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem> */}
                          <DropdownMenuItem
                            onClick={() => {
                              setCategoryToDelete(category);
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
                    No categories found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center mt-6">
          <span className="text-sm text-gray-600">
            Showing {Math.min(startIndex + 1, filteredAndSortedCategories.length)} to {Math.min(endIndex, filteredAndSortedCategories.length)} of {filteredAndSortedCategories.length} results
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
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the category <span className="font-semibold">{categoryToDelete?.name}</span>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteCategory}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CategoriesTable;