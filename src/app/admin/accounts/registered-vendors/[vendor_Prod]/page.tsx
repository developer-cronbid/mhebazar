"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { FileSpreadsheet, Trash2, CheckCircle, PackageX, PackageCheck, MoreVertical, Pencil, ExternalLink, Star } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import Image from "next/image";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import api from '@/lib/api';
import ProductForm from "@/components/forms/uploadForm/ProductForm";
import { Product } from '@/types';

// Define proper error type
interface ApiError {
  response?: {
    data?: {
      error?: string;
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
    default: return '-updated_at'; // Default ordering
  }
};

const VendorProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // --- OPTIMIZATION: State for server-side filtering, sorting, and pagination ---
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('Latest');
  const [showCount, setShowCount] = useState(10);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [totalProductsCount, setTotalProductsCount] = useState(0);
  const [notApprovedCount, setNotApprovedCount] = useState(0);
  // --- END OPTIMIZATION ---

  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  const [isProductRejectModalOpen, setIsProductRejectModalOpen] = useState(false);
  const [productRejectionReason, setProductRejectionReason] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editedProduct, setEditedProduct] = useState<Product | undefined>(undefined);

  const searchParams = useSearchParams();
  const vendorId = searchParams.get('user');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get(`/categories/`);
        if (res.data && Array.isArray(res.data)) {
          setCategories(res.data);
        } else {
          console.warn("Categories API response was not in the expected format:", res.data);
        }
      } catch (err) {
        console.error("Failed to fetch categories:", err);
        toast.error("Could not load categories.");
      }
    };

    fetchCategories();
  }, []);

  // --- OPTIMIZATION: Data fetching now includes all filter, sort, and pagination params ---
  useEffect(() => {
    if (!vendorId) {
      setError("Vendor ID is missing from the URL query parameter.");
      setLoading(false);
      return;
    }

    const fetchProducts = async () => {
      setLoading(true);

      // Construct query parameters
      const params = new URLSearchParams({
        user: vendorId,
        page: currentPage.toString(),
        page_size: showCount.toString(),
        ordering: getOrderingParam(sortBy),
      });

      if (selectedCategory !== 'All') {
        params.append('category_name', selectedCategory);
      }

      try {
        const response = await api.get(`products/?${params.toString()}`);

        // The API now returns a paginated response object
        if (response.data && Array.isArray(response.data.results)) {
          setProducts(response.data.results);
          setTotalProductsCount(response.data.count);
          // Assuming backend provides this count in the response (see backend optimization)
          setNotApprovedCount(response.data.not_approved_count || 0);
        }
        else {
          console.warn("API response was not in the expected format:", response.data);
          setProducts([]);
          setTotalProductsCount(0);
        }
        setError(null);
      } catch (err) {
        console.error("Failed to fetch products:", err);
        setError("Could not load vendor products. Please try again later.");
        toast.error("Failed to fetch products!");
        setProducts([]);
        setTotalProductsCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
    // This effect re-runs whenever any of these dependencies change
  }, [vendorId, currentPage, showCount, sortBy, selectedCategory]);

  // --- OPTIMIZATION: This useEffect resets the page to 1 when filters change ---
  useEffect(() => {
    setCurrentPage(1);
    setSelectAll(false);
    setSelectedProducts(new Set());
  }, [selectedCategory, sortBy, showCount]);

  // Pagination logic now uses the total count from the API
  const totalPages = Math.ceil(totalProductsCount / showCount);
  const startIndex = (currentPage - 1) * showCount;
  // const currentProducts = ...; // REMOVED, we now use `products` state directly

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) setCurrentPage(newPage);
  };

  const handleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    if (newSelectAll) {
      setSelectedProducts(new Set(products.map(p => p.id))); // Use `products` directly
    } else {
      setSelectedProducts(new Set());
    }
  };

  const handleProductSelect = (productId: number) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) newSelected.delete(productId);
    else newSelected.add(productId);
    setSelectedProducts(newSelected);
    setSelectAll(newSelected.size === products.length && products.length > 0); // Use `products` directly
  };

  const handleApproveSelected = async () => {
    if (selectedProducts.size === 0) {
      toast.error('Please select products to approve.');
      return;
    }

    try {
      await api.patch('products/bulk-update-status/', {
        ids: Array.from(selectedProducts),
        is_active: true,
      });

      toast.success(`Approved ${selectedProducts.size} products.`);
      setProducts(prev =>
        prev.map(p =>
          selectedProducts.has(p.id) ? { ...p, is_active: true } : p
        )
      );
      setSelectedProducts(new Set());
      setSelectAll(false);
    } catch (err) {
      console.error("Failed to approve products:", err);
      toast.error("An error occurred while approving products.");
    }
  };

  // Individual product approve/reject functionality
  const handleProductAction = async (productId: number, action: 'approve' | 'reject') => {
    if (action === 'reject') {
      const product = products.find(p => p.id === productId);
      setSelectedProduct(product || null);
      setIsProductRejectModalOpen(true);
      return;
    }

    try {
      await api.post(`products/${productId}/${action}/`);
      toast.success(`Product ${action === 'approve' ? 'Approved' : 'Rejected'}`, {
        description: `The product has been successfully ${action === 'approve' ? 'approved' : 'rejected'}.`
      });

      // Update local state to reflect the change
      setProducts(prev =>
        prev.map(p =>
          p.id === productId ? { ...p, is_active: action === 'approve' } : p
        )
      );
    } catch (error) {
      console.error(`Failed to ${action} product:`, error);
      toast.error("Action Failed", { description: `Could not ${action} the product.` });
    }
  };

  // Handle product rejection submission
  const handleProductRejectSubmit = async () => {
    if (!selectedProduct || !productRejectionReason.trim()) {
      return toast.error("Validation Error", { description: "Rejection reason is required." });
    }

    try {
      await api.post(`products/${selectedProduct.id}/reject/`, {
        reason: productRejectionReason,
      });

      toast.success("Product Rejected", { description: "The product has been rejected." });

      // Update local state
      setProducts(prev =>
        prev.map(p =>
          p.id === selectedProduct.id ? { ...p, is_active: false } : p
        )
      );

      setIsProductRejectModalOpen(false);
      setProductRejectionReason("");
      setSelectedProduct(null);
    } catch (error) {
      const apiError = error as ApiError;
      console.error("Failed to reject product:", error);
      toast.error("Rejection Failed", {
        description: apiError.response?.data?.error || "An error occurred."
      });
    }
  };

  // Handle product edit
  const handleEditClick = async (productId: number) => {
    try {
      setEditedProduct(undefined);
      const response = await api.get(`/products/${productId}/`);
      setEditedProduct(response.data);
      setIsSheetOpen(true);
    } catch (error) {
      console.error('Error fetching product details:', error);
      toast.error("Failed to load product data for editing.");
    }
  };

  // Handle product delete
  const handleDeleteProduct = async (productId: number, productTitle: string) => {
    if (window.confirm(`Are you sure you want to delete "${productTitle}"?`)) {
      try {
        await api.delete(`products/${productId}/`);
        toast.success(`Product "${productTitle}" deleted.`);
        // Refresh data by fetching again
        setCurrentPage(1); // Or stay on the same page if desired
        // A full refetch is simplest after a delete
        // This can be done by adding a "refetch" state trigger to the useEffect dependency array
      } catch (err) {
        console.error("Failed to delete product:", err);
        toast.error("Failed to delete the product.");
      }
    }
  };

  // ✅ Export to Excel function added
  const handleExportToExcel = async () => {
    if (totalProductsCount === 0) {
      toast.error("No products to export.");
      return;
    }

    toast.info("Preparing your export...", { description: "This may take a moment." });

    // Construct query parameters to fetch all data based on current filters
    const params = new URLSearchParams({
      user: vendorId!,
      ordering: getOrderingParam(sortBy),
      page_size: totalProductsCount.toString(), // Fetch all products in one go
    });

    if (selectedCategory !== 'All') {
      params.append('category_name', selectedCategory);
    }

    try {
      const response = await api.get(`products/?${params.toString()}`);
      const productsToExport: Product[] = response.data.results || [];

      const headers = [
        'ID', 'Name', 'Category', 'Type', 'Price', 'Description',
        'Manufacturer', 'Model', 'Rating', 'Status', 'Updated At'
      ];
      const csvRows = [headers.join(',')];

      productsToExport.forEach(product => {
        const row = [
          `"${product.id}"`,
          `"${product.name}"`,
          `"${product.category_name}"`,
          `"${product.type}"`,
          `"${product.price || ''}"`,
          `"${product.description?.replace(/"/g, '""') || ''}"`,
          `"${product.manufacturer?.replace(/"/g, '""') || ''}"`,
          `"${product.model?.replace(/"/g, '""') || ''}"`,
          `"${product.average_rating ?? 0}"`,
          `"${product.is_active ? 'Approved' : 'Pending'}"`,
          `"${new Date(product.updated_at).toLocaleString()}"`,
        ];
        csvRows.push(row.join(','));
      });

      const csvString = csvRows.join('\n');
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'vendor_products.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Products exported successfully!");

    } catch (err) {
      console.error("Failed to export products:", err);
      toast.error("An error occurred while exporting products.");
    }
  };

  // Star Rating Component
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

  // Add this helper function for image URLs
  const getImageUrl = (imageUrl: string | undefined): string => {
    if (!imageUrl) return '/no-product.png';

    try {
      if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        return imageUrl;
      }
      return `${process.env.NEXT_PUBLIC_API_URL}${imageUrl}`;
    } catch (error) {
      console.error('Error constructing image URL:', error);
      return '/no-product.png';
    }
  };

  const uniqueCategories = useMemo(() => ['All', ...Array.from(new Set(categories.map(c => c.name)))], [categories]);


  if (loading && products.length === 0) { // Show loading only on initial load
    return <div className="flex justify-center items-center h-screen">Loading products...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-screen text-red-500 p-4 text-center">{error}</div>;
  }

  return (
    <div className="bg-gray-50 p-6 overflow-y-auto">
      <div className="w-full mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Vendor Products</h1>
          <div className="flex space-x-2">
            <button
              onClick={handleApproveSelected}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-[#5CA131] flex items-center space-x-2 transition-colors disabled:bg-gray-400"
              disabled={selectedProducts.size === 0}
            >
              <CheckCircle className="w-4 h-4" />
              <span>Approve Selected</span>
            </button>
            <button
              onClick={handleExportToExcel}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center space-x-2 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export as Excel</span>
            </button>
          </div>
        </div>

        {/* --- START: Implemented Filter Bar --- */}
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
              <div className="flex items-center space-x-2">
                <label htmlFor="category" className="text-sm text-gray-600">Category</label>
                <select
                  id="category"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="border rounded-md px-2 py-1 text-sm focus:ring-green-500 focus:border-green-500"
                >
                  {/* Use the new variable and add the string type to 'cat' */}
                  {uniqueCategories.map((cat: string) => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              Total: <span className="font-medium">{totalProductsCount}</span> products | Pending Approval: <span className="font-medium text-yellow-700">{notApprovedCount}</span>
            </div>
          </div>
        </div>
        {/* --- END: Implemented Filter Bar --- */}

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
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-center">Quick Actions</TableHead>
                <TableHead className="text-right">More Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* OPTIMIZATION: Map over `products` directly */}
              {products.length > 0 ? (
                products.map((product) => (
                  <TableRow key={product.id} className="hover:bg-gray-50">
                    <TableCell className="px-4">
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={selectedProducts.has(product.id)}
                        onChange={() => handleProductSelect(product.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-4">
                        <div className="relative h-24 w-24 flex-shrink-0">
                          <Image
                            src={product.images?.[0]?.image
                              ? getImageUrl(product.images[0].image)
                              : "/no-product.png"
                            }
                            alt={product.name}
                            fill
                            className="object-contain rounded border border-gray-100 bg-white"
                            sizes="96px"
                            priority
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = "/no-product.png";
                            }}
                          />
                          <span className={`absolute top-2 left-2 ${(() => {
                            switch (product.type) {
                              case 'new': return 'bg-blue-500';
                              case 'used': return 'bg-orange-500';
                              case 'rental': return 'bg-purple-500';
                              case 'attachments': return 'bg-pink-500';
                              default: return 'bg-gray-500';
                            }
                          })()
                            } text-white px-2 py-0.5 rounded-md text-xs font-semibold shadow`}>
                            {product.type}
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
                      <span className="text-xs px-2 py-0.5 rounded font-medium bg-gray-50 text-gray-600">
                        {product.category_name}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${product.is_active
                        ? "text-green-600 bg-green-50"
                        : "text-yellow-600 bg-yellow-50"
                        }`}>
                        {product.is_active ? "Approved" : "Pending"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-gray-400">
                        {new Date(product.updated_at).toLocaleDateString()}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center space-x-2">
                        {!product.is_active && (
                          <>
                            <Button
                              size="sm"
                              className="bg-[#5CA131] hover:bg-green-700 text-white h-8 px-2"
                              onClick={() => handleProductAction(product.id, 'approve')}
                            >
                              <PackageCheck className="w-3 h-3 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-500 hover:bg-red-50 h-8 px-2"
                              onClick={() => handleProductAction(product.id, 'reject')}
                            >
                              <PackageX className="w-3 h-3 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                        {product.is_active && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-500 hover:bg-red-50 h-8 px-2"
                            onClick={() => handleProductAction(product.id, 'reject')}
                          >
                            <PackageX className="w-3 h-3 mr-1" />
                            Reject
                          </Button>
                        )}
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
                              handleEditClick(product.id);
                            }}
                            className="cursor-pointer"
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            <span>Edit</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => window.open(`/products-details/${product.id}`, '_blank')}>
                            <ExternalLink className="mr-2 h-4 w-4" />
                            View Details
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
                    No products found for this vendor.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* --- START: Implemented Pagination --- */}
        <div className="flex justify-between items-center mt-6">
          <span className="text-sm text-gray-600">
            {/* OPTIMIZATION: Update pagination text */}
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

      {/* Product Rejection Modal */}
      <Dialog open={isProductRejectModalOpen} onOpenChange={setIsProductRejectModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reject Product</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting the product <span className="font-semibold">{selectedProduct?.name}</span>. This reason will be sent to the vendor.
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
            <Button variant="outline" onClick={() => setIsProductRejectModalOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleProductRejectSubmit}>Submit Rejection</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-full sm:max-w-md p-0 flex flex-col">
          <SheetHeader className="p-4 border-b">
            <SheetTitle>{editedProduct ? 'Edit Product' : 'Add Product'}</SheetTitle>
            <SheetDescription>
              Make changes to the product details below.
            </SheetDescription>
          </SheetHeader>

          {/* The form goes AFTER the header and has its own scrolling */}
          <div className="flex-1 overflow-y-auto">
            {editedProduct && <ProductForm product={editedProduct} />}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default VendorProducts;