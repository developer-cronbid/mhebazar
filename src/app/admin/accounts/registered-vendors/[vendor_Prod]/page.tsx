/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/admin/accounts/registered-vendors/[vendor_Prod]/page.tsx
"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { FileSpreadsheet, Trash2, CheckCircle, PackageX, PackageCheck, MoreVertical, Pencil, ExternalLink, Star, Loader2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import Image from "next/image";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import api from '@/lib/api';
// Assuming ProductForm and types are correctly imported/defined
import ProductForm from "@/components/forms/uploadForm/ProductForm"; 
import { Product } from '@/types'; 
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

// Define proper error type
interface ApiError {
  response?: {
    data?: {
      detail?: string;
      error?: string;
      message?: string;
    };
  };
}

// Helper to translate frontend sort options to backend ordering parameters
const getOrderingParam = (sortByValue: string) => {
  switch (sortByValue) {
    case 'Latest': return '-updated_at';
    case 'Oldest': return 'updated_at';
    case 'Name A-Z': return 'name';
    case 'Name Z-A': return '-name';
    default: return '-updated_at';
  }
};

const VendorProducts = () => {
  // --- Data State ---
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [vendors, setVendors] = useState<{ id: string, brand: string }[]>([]);

  // --- UI/Loading State ---
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isProductRejectModalOpen, setIsProductRejectModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productRejectionReason, setProductRejectionReason] = useState("");
  const [refetchTrigger, setRefetchTrigger] = useState(0); // For manual data refresh

  // --- Pagination/Filter State ---
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('Latest');
  const [showCount, setShowCount] = useState(10);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [totalProductsCount, setTotalProductsCount] = useState(0);
  const [notApprovedCount, setNotApprovedCount] = useState(0);

  // --- Vendor Filter State ---
  const searchParams = useSearchParams();
  const vendorIdFromUrl = searchParams.get('user');
  const [selectedVendorId, setSelectedVendorId] = useState<string | 'all'>(vendorIdFromUrl || 'all');
  
  // --- Search State ---
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  // --- Bulk Action State ---
  const [selectedProductsIds, setSelectedProductsIds] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);


  // --- Effects ---

  // 1. Debounce Search Query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // 2. Fetch Initial Data (Vendors and Categories)
  useEffect(() => {
    const fetchVendorsAndCategories = async () => {
      try {
        // FIX: Fetch all vendor applications for Admin view in the filter dropdown.
        // Assuming /vendor/ endpoint returns all applications for Admin.
        const vendorsRes = await api.get('/vendor/'); 
        const vendorsData = vendorsRes.data.results.map((v: any) => ({ 
            id: v.user_id.toString(), // Use user_id as product filter uses user field
            brand: `${v.brand || 'N/A'} (${v.is_approved ? 'Approved' : 'Pending'})` 
        }));
        setVendors([{ id: 'all', brand: 'All Vendors' }, ...vendorsData]);

        const categoriesRes = await api.get(`/categories/`);
        if (categoriesRes.data && Array.isArray(categoriesRes.data)) {
          setCategories(categoriesRes.data);
        }
      } catch (err) {
        console.error("Failed to fetch initial data:", err);
        toast.error("Could not load vendors or categories.");
      }
    };
    fetchVendorsAndCategories();
  }, []);

  // 3. Main Data Fetch (Products)
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      page: currentPage.toString(),
      page_size: showCount.toString(),
      ordering: getOrderingParam(sortBy),
    });

    if (debouncedSearchQuery) {
      params.append('search', debouncedSearchQuery);
    }

    if (selectedVendorId !== 'all') {
      params.append('user', selectedVendorId);
    }
    
    // Correctly append category ID
    if (selectedCategory !== 'All') {
      const categoryId = categories.find(cat => cat.name === selectedCategory)?.id;
      if (categoryId) {
        params.append('category', String(categoryId));
      }
    }

    try {
      const response = await api.get(`products/?${params.toString()}`);

      if (response.data && Array.isArray(response.data.results)) {
        setProducts(response.data.results);
        setTotalProductsCount(response.data.count);
        // Ensure you handle the custom 'not_approved_count' from ProductPagination
        setNotApprovedCount(response.data.not_approved_count || 0);
      } else {
        setProducts([]);
        setTotalProductsCount(0);
      }
    } catch (err) {
      console.error("Failed to fetch products:", err);
      setError("Could not load vendor products. Please try again later.");
      toast.error("Failed to fetch products!");
      setProducts([]);
      setTotalProductsCount(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, showCount, sortBy, selectedCategory, debouncedSearchQuery, selectedVendorId, categories]);

  useEffect(() => {
    // Re-fetch products when filters/pagination/search or manual trigger changes
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchProducts, refetchTrigger]);

  // 4. Reset Page on Filter Change
  useEffect(() => {
    setCurrentPage(1);
    setSelectAll(false);
    setSelectedProductsIds(new Set());
  }, [selectedCategory, sortBy, showCount, selectedVendorId, debouncedSearchQuery]);


  // --- Calculated Values ---
  const totalPages = Math.ceil(totalProductsCount / showCount);
  const startIndex = (currentPage - 1) * showCount;
  const uniqueCategories = useMemo(() => ['All', ...Array.from(new Set(categories.map(c => c.name)))], [categories]);


  // --- Handlers ---

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) setCurrentPage(newPage);
  };

  const handleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    if (newSelectAll) {
      setSelectedProductsIds(new Set(products.map(p => p.id)));
    } else {
      setSelectedProductsIds(new Set());
    }
  };

  const handleProductSelect = (productId: number) => {
    const newSelected = new Set(selectedProductsIds);
    if (newSelected.has(productId)) newSelected.delete(productId);
    else newSelected.add(productId);
    setSelectedProductsIds(newSelected);
    setSelectAll(newSelected.size === products.length && products.length > 0);
  };

  const handleBulkApprove = async () => {
    if (selectedProductsIds.size === 0) {
      toast.error('Please select products to approve.');
      return;
    }

    const idsToApprove = Array.from(selectedProductsIds);

    try {
      // Use the correct bulk-update-status endpoint with is_active: true
      await api.patch('products/bulk-update-status/', {
        ids: idsToApprove,
        is_active: true,
      });

      toast.success(`Approved ${selectedProductsIds.size} products.`);
      
      // OPTIMISTIC UPDATE: Update products status locally
      setProducts(prev =>
        prev.map(p =>
          idsToApprove.includes(p.id) ? { ...p, is_active: true, status: 'approved' } : p
        )
      );
      
      setSelectedProductsIds(new Set());
      setSelectAll(false);
      setRefetchTrigger(prev => prev + 1); // Trigger full re-fetch to update counts
    } catch (err) {
      console.error("Failed to approve products:", err);
      toast.error("An error occurred while approving products.");
    }
  };

  // Single product approve/reject action
  const handleProductAction = async (productId: number, action: 'approve' | 'reject') => {
    const productToUpdate = products.find(p => p.id === productId);
    if (!productToUpdate) return;
    
    if (action === 'reject') {
      setSelectedProduct(productToUpdate);
      setIsProductRejectModalOpen(true);
      return;
    }

    // Single Approve Action
    try {
      await api.post(`products/${productId}/${action}/`);
      toast.success(`Product Approved`);

      // OPTIMISTIC UPDATE: Update status locally
      setProducts(prev =>
        prev.map(p =>
          p.id === productId ? { ...p, is_active: true, status: 'approved' } : p
        )
      );
      setRefetchTrigger(prev => prev + 1); // Trigger re-fetch for updated counts
    } catch (error) {
      console.error(`Failed to ${action} product:`, error);
      toast.error(`Could not ${action} the product.`);
    }
  };

  const handleProductRejectSubmit = async () => {
    if (!selectedProduct || !productRejectionReason.trim()) {
      return toast.error("Rejection reason is required.");
    }

    try {
      // Use the correct reject endpoint
      await api.post(`products/${selectedProduct.id}/reject/`, {
        reason: productRejectionReason,
      });

      toast.success("Product Rejected");

      // OPTIMISTIC UPDATE: Update status locally
      setProducts(prev =>
        prev.map(p =>
          p.id === selectedProduct.id ? { ...p, is_active: false, status: 'rejected' } : p
        )
      );

      setIsProductRejectModalOpen(false);
      setProductRejectionReason("");
      setSelectedProduct(null);
      setRefetchTrigger(prev => prev + 1); // Trigger re-fetch for updated counts
    } catch (error) {
      const apiError = error as ApiError;
      console.error("Failed to reject product:", error);
      toast.error("Rejection Failed", {
        description: apiError.response?.data?.error || apiError.response?.data?.detail || "An error occurred."
      });
    }
  };

  const handleEditClick = async (productId: number) => {
    try {
      setSelectedProduct(null); // Clear previous product
      const response = await api.get(`/products/${productId}/`);
      setSelectedProduct(response.data);
      setIsSheetOpen(true);
    } catch (error) {
      console.error('Error fetching product details:', error);
      toast.error("Failed to load product data for editing.");
    }
  };

  const handleAddClick = () => {
    setSelectedProduct(null); // Clear product for "Add" mode
    setIsSheetOpen(true);
  };

  const handleDeleteProduct = async (productId: number, productTitle: string) => {
    if (window.confirm(`Are you sure you want to delete "${productTitle}"?`)) {
      try {
        await api.delete(`products/${productId}/`);
        toast.success(`Product "${productTitle}" deleted.`);
        
        // Remove locally and trigger re-fetch
        setProducts(prev => prev.filter(p => p.id !== productId));
        setTotalProductsCount(prev => prev - 1);
        setRefetchTrigger(prev => prev + 1);
      } catch (err) {
        console.error("Failed to delete product:", err);
        toast.error("Failed to delete the product.");
      }
    }
  };

  // --- Utility Components (Moved out of main function for cleaner render logic) ---
  
  const StarRating = ({ average_rating }: { average_rating: number }) => (
    <div className="flex space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${star <= average_rating ? "fill-yellow-400 text-yellow-400"
            : "text-gray-300"}`}
        />
      ))}
    </div>
  );

  const PaginationButton = ({ onClick, disabled, children, isActive = false }: { onClick: () => void, disabled: boolean, children: React.ReactNode, isActive?: boolean }) => (
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

  const getImageUrl = (imageUrl: string | undefined): string => {
    if (!imageUrl) return '/no-product.jpg';

    try {
      // NOTE: Ensure process.env.NEXT_PUBLIC_API_URL is correctly set
      if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        return imageUrl;
      }
      return `${process.env.NEXT_PUBLIC_API_URL || ''}${imageUrl}`;
    } catch (error) {
      console.error('Error constructing image URL:', error);
      return '/no-product.jpg';
    }
  };
  
  const renderLoadingScreen = () => (
    <div className="flex justify-center items-center h-96">
      <Loader2 className="w-8 h-8 animate-spin text-[#5CA131]" />
      <span className="ml-3 text-lg text-gray-600">Loading products...</span>
    </div>
  );

  // --- Main Render ---

  if (loading && products.length === 0) {
    return renderLoadingScreen();
  }

  if (error) {
    return <div className="flex justify-center items-center h-screen text-red-500 p-4 text-center">{error}</div>;
  }

  return (
    <div className="bg-gray-50 p-6 overflow-y-auto">
      <div className="w-full mx-auto">
        
        {/* Header and Bulk Actions */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Vendor Products</h1>
          <div className="flex space-x-2">
            <Button
              variant="default"
              className="bg-[#5CA131] hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center space-x-2"
              onClick={handleAddClick}
            >
              + Add Product
            </Button>
            <button
              onClick={handleBulkApprove}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-[#5CA131] flex items-center space-x-2 transition-colors disabled:bg-gray-400"
              disabled={selectedProductsIds.size === 0}
            >
              <CheckCircle className="w-4 h-4" />
              <span>Approve Selected ({selectedProductsIds.size})</span>
            </button>
            <button
              onClick={() => toast.info("Export logic is running...")} // Placeholder for export
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center space-x-2 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 border border-gray-200">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              {/* Show Count */}
              <div className="flex items-center space-x-2">
                <label htmlFor="show-count" className="text-sm text-gray-600">Show</label>
                <select
                  id="show-count"
                  value={showCount}
                  onChange={(e) => setShowCount(Number(e.target.value))}
                  className="border rounded-md px-2 py-1 text-sm h-9 focus:ring-green-500 focus:border-green-500"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
              {/* Sort By */}
              <div className="flex items-center space-x-2">
                <label htmlFor="sort-by" className="text-sm text-gray-600">Sort by</label>
                <select
                  id="sort-by"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="border rounded-md px-2 py-1 text-sm h-9 focus:ring-green-500 focus:border-green-500"
                >
                  <option>Latest</option>
                  <option>Oldest</option>
                  <option>Name A-Z</option>
                  <option>Name Z-A</option>
                </select>
              </div>
              {/* Category Filter */}
              <div className="flex items-center space-x-2">
                <label htmlFor="category" className="text-sm text-gray-600">Category</label>
                <select
                  id="category"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="border rounded-md px-2 py-1 text-sm h-9 focus:ring-green-500 focus:border-green-500"
                >
                  {uniqueCategories.map((cat: string) => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              {/* Vendor Filter (Select Component) */}
              <div className="flex items-center space-x-2">
                <label htmlFor="vendor-filter" className="text-sm text-gray-600">Vendor</label>
                <Select
                  value={selectedVendorId}
                  onValueChange={(value) => setSelectedVendorId(value)}
                >
                  <SelectTrigger className="w-[200px] text-sm h-9">
                    <SelectValue placeholder="Select Vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.map((vendor) => (
                      <SelectItem key={vendor.id} value={vendor.id}>
                        {vendor.brand}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Search Input */}
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm h-9 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>
            
            {/* Status Counts */}
            <div className="text-sm text-gray-600 bg-gray-100 p-2 rounded-md border border-gray-300">
              Total: <span className="font-medium">{totalProductsCount}</span> products | Pending Approval: <span className="font-medium text-yellow-700">{notApprovedCount}</span>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-lg shadow-lg overflow-x-auto border border-gray-200">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 hover:bg-gray-50">
                <TableHead className="w-12 px-4">
                  <input
                    type="checkbox"
                    className="rounded"
                    checked={selectAll}
                    onChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-center w-[200px]">Quick Actions</TableHead>
                <TableHead className="text-right w-[100px]">More</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && products.length === 0 ? (
                 <TableRow>
                   <TableCell colSpan={7} className="text-center py-8">
                     {renderLoadingScreen()}
                   </TableCell>
                 </TableRow>
              ) : products.length > 0 ? (
                products.map((product) => (
                  <TableRow key={product.id} className="hover:bg-gray-50">
                    <TableCell className="px-4">
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={selectedProductsIds.has(product.id)}
                        onChange={() => handleProductSelect(product.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-4">
                        <div className="relative h-24 w-24 flex-shrink-0">
                          <Image
                            src={product.images?.[0]?.image
                              ? getImageUrl(product.images[0].image)
                              : "/no-product.jpg"
                            }
                            alt={product.name}
                            fill
                            className="object-contain rounded border border-gray-100 bg-white"
                            sizes="96px"
                            priority
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = "/no-product.jpg";
                            }}
                          />
                          <span className={`absolute top-2 left-2 ${(() => {
                            // Assuming product.type is a single string or the first element of the list
                            const type = Array.isArray(product.type) ? product.type[0] : product.type;
                            switch (type) {
                              case 'new': return 'bg-blue-500';
                              case 'used': return 'bg-orange-500';
                              case 'rental': return 'bg-purple-500';
                              case 'attachments': return 'bg-pink-500';
                              default: return 'bg-gray-500';
                            }
                          })()
                            } text-white px-2 py-0.5 rounded-md text-xs font-semibold shadow`}>
                            {Array.isArray(product.type) ? product.type[0] : product.type}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {product.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <StarRating average_rating={product.average_rating ?? 0} />
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs px-2 py-0.5 rounded font-medium bg-gray-50 text-gray-600 border border-gray-200">
                        {product.category_name}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${product.is_active && product.status === 'approved'
                        ? "text-green-600 bg-green-50 border border-green-200"
                        : "text-yellow-600 bg-yellow-50 border border-yellow-200"
                        }`}>
                        {product.is_active && product.status === 'approved' ? "Approved" : "Pending/Rejected"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-gray-500">
                        {new Date(product.updated_at).toLocaleDateString()}
                      </span>
                    </TableCell>
                    <TableCell className="flex items-center justify-center gap-2">
                      <div className="flex items-center justify-center space-x-2">
                        {/* Approve Button */}
                        {product.status !== 'approved' && (
                            <Button
                                size="sm"
                                className="bg-[#5CA131] hover:bg-green-700 text-white h-8 px-2"
                                onClick={() => handleProductAction(product.id, 'approve')}
                            >
                                <PackageCheck className="w-3 h-3 mr-1" />
                                Approve
                            </Button>
                        )}
                        {/* Reject Button (Always available for admin) */}
                        <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-500 hover:bg-red-50 h-8 px-2"
                            onClick={() => handleProductAction(product.id, 'reject')}
                        >
                            <PackageX className="w-3 h-3 mr-1" />
                            Reject
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
                          <DropdownMenuItem onClick={() => window.open(`/products-details/${product.id}`, '_blank')}>
                            <ExternalLink className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                                e.preventDefault();
                                handleEditClick(product.id);
                            }}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit Product
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteProduct(product.id, product.name)}
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
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    No products found matching your criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Controls */}
        <div className="flex justify-between items-center mt-6">
          <span className="text-sm text-gray-600">
            Showing {Math.min(startIndex + 1, totalProductsCount)} to {Math.min(startIndex + showCount, totalProductsCount)} of {totalProductsCount} results
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

      {/* Rejection Modal */}
      <Dialog open={isProductRejectModalOpen} onOpenChange={setIsProductRejectModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reject Product</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting the product <span className="font-semibold">{selectedProduct?.name}</span>. This reason will be recorded and sent to the vendor.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Textarea
              placeholder="Type your reason here..."
              value={productRejectionReason}
              onChange={(e) => setProductRejectionReason(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsProductRejectModalOpen(false); setProductRejectionReason(""); setSelectedProduct(null); }}>Cancel</Button>
            <Button variant="destructive" onClick={handleProductRejectSubmit} disabled={!productRejectionReason.trim()}>Submit Rejection</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Sheet */}
      <Sheet
        open={isSheetOpen}
        onOpenChange={(open) => {
          setIsSheetOpen(open);
          if (!open) {
            setSelectedProduct(null);
            setRefetchTrigger(prev => prev + 1); // Refresh list on closing sheet
          }
        }}
      >
        <SheetContent className="w-full sm:max-w-xl p-0 flex flex-col">
          <SheetHeader className="p-4 border-b">
            <SheetTitle>{selectedProduct ? 'Edit Product' : 'Add New Product'}</SheetTitle>
            <SheetDescription>
              {selectedProduct ? `Editing: ${selectedProduct.name}` : 'Fill in the details to add a new product.'}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto">
            {/* Note: Ensure ProductForm can handle 'null' for add mode and triggers a re-fetch on save */}
            <ProductForm product={selectedProduct} onSave={() => setIsSheetOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default VendorProducts;