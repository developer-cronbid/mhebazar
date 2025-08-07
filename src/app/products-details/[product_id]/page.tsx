"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Package, Calendar, CheckCircle2, XCircle } from "lucide-react";
import api from "@/lib/api";
import ProductForm from "@/components/forms/uploadForm/ProductForm";
import { Product } from "@/types";

const TYPE_COLORS = {
  new: "bg-blue-500",
  used: "bg-orange-500",
  rental: "bg-purple-500",
  attachments: "bg-pink-500",
};

export default function ProductDetails() {
  const params = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/products/${params.product_id}/`);
        setProduct(response.data);
      } catch (err) {
        console.error("Error fetching product:", err);
        setError("Failed to load product details");
      } finally {
        setLoading(false);
      }
    };

    if (params.product_id) {
      fetchProduct();
    }
  }, [params.product_id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Oops!</h1>
          <p className="text-gray-600">{error || "Product not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {product.name}
              </h1>
              <div className="flex items-center gap-3">
                <Badge
                  className={`${TYPE_COLORS[product.type as keyof typeof TYPE_COLORS]} text-white`}
                >
                  {product.type.toUpperCase()}
                </Badge>
                <Badge
                  variant="secondary"
                  className={product.is_active ? "bg-green-500 text-white" : "bg-yellow-400 text-white"}
                >
                  {product.is_active ? "Active" : "Pending"}
                </Badge>
              </div>
            </div>
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Pencil className="h-4 w-4" />
                  Edit Product
                </Button>
              </SheetTrigger>
              <SheetContent>
                <ProductForm product={product} />
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Images */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Product Images</h2>
              <div className="grid grid-cols-2 gap-4">
                {product.images && product.images.length > 0 ? (
                  product.images.map((img, index) => (
                    <div key={index} className="relative aspect-square">
                      <Image
                        src={img.image}
                        alt={`${product.name} - ${index + 1}`}
                        fill
                        className="object-cover rounded-lg"
                      />
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                    <Package className="h-12 w-12 text-gray-400" />
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Description</h2>
              <p className="text-gray-600 whitespace-pre-wrap">
                {product.description || "No description provided"}
              </p>
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Product Details</h2>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm text-gray-500">Category</dt>
                  <dd className="text-gray-900">{product.category_name}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Subcategory</dt>
                  <dd className="text-gray-900">{product.subcategory_name}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Price</dt>
                  <dd className="text-gray-900">${product.price}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Stock</dt>
                  <dd className="text-gray-900">{product.stock_quantity}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Manufacturer</dt>
                  <dd className="text-gray-900">{product.manufacturer || "-"}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Model</dt>
                  <dd className="text-gray-900">{product.model || "-"}</dd>
                </div>
              </dl>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Settings</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Direct Sale</span>
                  {product.direct_sale ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Hide Price</span>
                  {product.hide_price ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Online Payment</span>
                  {product.online_payment ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Additional Info</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Added on{" "}
                    {new Date(product.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Last updated{" "}
                    {new Date(product.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}