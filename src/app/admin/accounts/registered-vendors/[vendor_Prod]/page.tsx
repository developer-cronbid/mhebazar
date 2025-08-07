"use client";

import React, { useState, useMemo, useEffect } from 'react';
// Correctly import useSearchParams
import { useSearchParams } from 'next/navigation';
import { FileSpreadsheet, Trash2, CheckCircle, PackageX, PackageCheck } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Pencil, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import Image from "next/image";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import api from '@/lib/api';
// Import ProductForm - adjust the import path as needed
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

const VendorProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('Latest');
  const [showCount, setShowCount] = useState(10);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  // Add new state variables for modals and actions
  const [isProductRejectModalOpen, setIsProductRejectModalOpen] = useState(false);
  const [productRejectionReason, setProductRejectionReason] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editedProduct, setEditedProduct] = useState<Product | undefined>(undefined);


  // Use useSearchParams to get the vendor ID from the query string
  const searchParams = useSearchParams();
  // const router = useRouter();
  const vendorId = searchParams.get('user');

  // Fetch products for the specific vendor
  useEffect(() => {
    if (!vendorId) {
      setError("Vendor ID is missing from the URL query parameter.");
      setLoading(false);
      return;
    }

    const fetchProducts = async () => {
      setLoading(true);
      try {
        const response = await api.get(`products/?user=${vendorId}`);

        // ✅ FIX: Ensure the API response is an array before setting state
        if (Array.isArray(response.data.results)) {
          setProducts(response.data.results);
        } else {
          // Log a warning and set an empty array if the response is not as expected
          console.warn("API response for products was not an array:", response.data.results);
          setProducts([]);
        }

        setError(null);
      } catch (err) {
        console.error("Failed to fetch products:", err);
        setError("Could not load vendor products. Please try again later.");
        toast.error("Failed to fetch products!");
        setProducts([]); // Also ensure products is an array on error
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [vendorId]); // Re-fetch if vendorId from the query string changes

  console.log(products)

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = products;

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(product => product.category_name === selectedCategory);
    }

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'Latest': return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        case 'Oldest': return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
        case 'Name A-Z': return a.name.localeCompare(b.name);
        case 'Name Z-A': return b.name.localeCompare(a.name);
        default: return 0;
      }
    });
  }, [products, selectedCategory, sortBy]);

  // Pagination logic
  const totalPages = Math.ceil(filteredAndSortedProducts.length / showCount);
  const startIndex = (currentPage - 1) * showCount;
  const endIndex = startIndex + showCount;
  const currentProducts = filteredAndSortedProducts.slice(startIndex, endIndex);

  // Reset page number when filters change
  useEffect(() => {
    setCurrentPage(1);
    setSelectAll(false);
    setSelectedProducts(new Set());
  }, [selectedCategory, sortBy, showCount]);

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category_name)))];
  const totalProducts = products.length;
  const notApprovedCount = products.filter(p => !p.is_active).length;

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) setCurrentPage(newPage);
  };

  const handleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    if (newSelectAll) {
      setSelectedProducts(new Set(currentProducts.map(p => p.id)));
    } else {
      setSelectedProducts(new Set());
    }
  };

  const handleProductSelect = (productId: number) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) newSelected.delete(productId);
    else newSelected.add(productId);
    setSelectedProducts(newSelected);
    setSelectAll(newSelected.size === currentProducts.length && currentProducts.length > 0);
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
        setProducts(prev => prev.filter(p => p.id !== productId));
      } catch (err) {
        console.error("Failed to delete product:", err);
        toast.error("Failed to delete the product.");
      }
    }
  };


  // Star Rating Component
  const StarRating = ({ average_rating }: { average_rating: number }) => (
    <div className="flex space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <div
          key={star}
          className={`w-2 h-2 rounded-full ${star <= average_rating ? 'bg-yellow-300' : 'bg-gray-300'}`}
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

  if (loading) {
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
              onClick={() => { /* Implement export logic */ }}
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
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              Total: <span className="font-medium">{totalProducts}</span> products | Pending Approval: <span className="font-medium text-yellow-700">{notApprovedCount}</span>
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
              {currentProducts.length > 0 ? (
                currentProducts.map((product) => (
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
            Showing {Math.min(startIndex + 1, filteredAndSortedProducts.length)} to {Math.min(endIndex, filteredAndSortedProducts.length)} of {filteredAndSortedProducts.length} results
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
        {/* --- END: Implemented Pagination --- */}

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