"use client";

import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ShoppingCart, Truck, Hash, CreditCard, User } from "lucide-react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import api from '@/lib/api';

// --- Types (copied from OrdersTable) ---
interface Image {
  id: number;
  image: string;
}
interface ProductDetails {
  name: string;
  images: Image[];
}
interface OrderItem {
  id: number;
  product_details: ProductDetails;
  quantity: number;
  unit_price: string;
}
type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
interface Order {
  id: number; order_number: string; user_name: string; status: OrderStatus;
  total_amount: string; item_count: number; shipping_address: string;
  phone_number: string; notes: string; items: OrderItem[]; created_at: string;
}

interface Delivery {
  id: number;
  tracking_id: string | null;
  status: 'not_shipped' | 'in_transit' | 'delivered';
  estimated_delivery_date: string | null;
  actual_delivery_date: string | null;
  courier_name: string | null;
}

// --- Component Props ---
interface OrderDetailsSheetProps {
  order: Order | null;
  isOpen: boolean;
  isUpdating: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onUpdateStatus: (orderId: number, newStatus: OrderStatus) => void;
}

// --- UI Helpers ---
const Section = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode; }) => (
  <div className="mb-6">
    <div className="flex items-center gap-2 mb-3"><h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">{icon}{title}</h3></div>
    <div className="space-y-3 rounded-lg border bg-gray-50/50 p-4">{children}</div>
  </div>
);

const DetailRow = ({ label, value }: { label: string; value: React.ReactNode; }) => (
  <div className="grid grid-cols-3 gap-4 py-1">
    <dt className="text-sm font-medium text-gray-500">{label}</dt>
    <dd className="col-span-2 text-sm text-gray-900">{value}</dd>
  </div>
);

// --- Main Component ---
export const OrderDetailsSheet = ({ order, isOpen, isUpdating, onOpenChange, onUpdateStatus }: OrderDetailsSheetProps) => {
  const [newStatus, setNewStatus] = useState<OrderStatus | null>(null);
  const [deliveryInfo, setDeliveryInfo] = useState<Delivery | null>(null);
  const [loadingDelivery, setLoadingDelivery] = useState(false);

  useEffect(() => {
    if (order) {
      setNewStatus(order.status);

      // --- NEW: FETCH DELIVERY INFO WHEN ORDER IS AVAILABLE ---
      const fetchDeliveryInfo = async () => {
        setLoadingDelivery(true);
        setDeliveryInfo(null); // Reset on order change
        try {
          // The backend supports filtering deliveries by order ID
          const response = await api.get(`/deliveries/?order=${order.id}`);
          if (response.data.results && response.data.results.length > 0) {
            setDeliveryInfo(response.data.results[0]);
          }
        } catch (error) {
          console.error("Failed to fetch delivery info:", error);
        } finally {
          setLoadingDelivery(false);
        }
      };

      fetchDeliveryInfo();
    }
  }, [order]);

  if (!order) return null;

  const handleSaveChanges = () => {
    if (newStatus && newStatus !== order.status) {
      onUpdateStatus(order.id, newStatus);
    }
  };

  const formatDate = (dateString: string | null) => {
    return dateString ? new Date(dateString).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : "N/A";
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-3xl flex flex-col">
        <SheetHeader className="pb-4 border-b">
          <SheetTitle className="text-xl font-semibold text-gray-900">
            Order Details: #{order.order_number}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-grow overflow-y-auto p-6">
          <Section title="Order Summary" icon={<Hash className="h-5 w-5 text-gray-600" />}>
            <DetailRow label="Order Number" value={<span className="font-mono">{order.order_number}</span>} />
            <DetailRow label="Order Date" value={new Date(order.created_at).toLocaleString()} />
            <DetailRow label="Status" value={<Badge className="capitalize">{order.status}</Badge>} />
          </Section>

          <Section title="Items in Order" icon={<ShoppingCart className="h-5 w-5 text-gray-600" />}>
            {/* Item mapping logic remains the same */}
            <div className="space-y-4">
              {order.items.map(item => (
                <div key={item.id} className="flex items-start gap-4 p-2 bg-white rounded-md border">
                  <img src={item.product_details.images?.[0]?.image || '/placeholder.svg'}
                    alt={item.product_details.name}
                    className="w-16 h-16 object-cover rounded-md bg-gray-100" />
                  <div className="flex-grow">
                    <p className="font-medium text-gray-800">{item.product_details.name}</p>
                    <p className="text-sm text-gray-500">
                      {item.quantity} x {Number(item.unit_price).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">
                    {(Number(item.unit_price) * item.quantity).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                  </p>
                </div>
              ))}
            </div>
          </Section>

          {/* --- NEW DELIVERY INFORMATION SECTION --- */}
          <Section title="Delivery Information" icon={<Truck className="h-5 w-5 text-gray-600" />}>
            {loadingDelivery ? (
              <p className="text-sm text-gray-500">Loading delivery details...</p>
            ) : deliveryInfo ? (
              <>
                <DetailRow label="Delivery Status" value={<Badge variant="outline" className="capitalize">{deliveryInfo.status.replace('_', ' ')}</Badge>} />
                <DetailRow label="Courier" value={deliveryInfo.courier_name || "N/A"} />
                <DetailRow label="Tracking ID" value={deliveryInfo.tracking_id ? <span className="font-mono">{deliveryInfo.tracking_id}</span> : "N/A"} />
                <DetailRow label="Est. Delivery Date" value={formatDate(deliveryInfo.estimated_delivery_date)} />
                <DetailRow label="Delivered On" value={formatDate(deliveryInfo.actual_delivery_date)} />
              </>
            ) : (
              <p className="text-sm text-gray-500">Delivery details will be available once the order is shipped.</p>
            )}
          </Section>

          <Section title="Payment & Total" icon={<CreditCard className="h-5 w-5 text-gray-600" />}>
            {/* Payment info remains the same */}
            <DetailRow label="Total Amount" value={
              <span className="font-bold text-lg text-green-700">
                {Number(order.total_amount).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
              </span>
            } />
          </Section>

          <Section title="Shipping & Customer" icon={<User className="h-5 w-5 text-gray-600" />}>
            {/* Customer info remains the same */}
            <DetailRow label="Customer" value={order.user_name} />
            <DetailRow label="Phone Number" value={order.phone_number} />
            <DetailRow label="Shipping Address" value={<p className="whitespace-pre-wrap">{order.shipping_address}</p>} />
            {order.notes && <DetailRow label="Order Notes" value={<p className="whitespace-pre-wrap italic">{order.notes}</p>} />}
          </Section>
        </div>

        <SheetFooter className="mt-auto p-4 border-t bg-gray-50 flex-col sm:flex-row sm:justify-between items-center gap-4">
          {/* Footer remains the same */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label htmlFor="status-select" className="text-sm font-medium">Update Status:</label>
            <Select value={newStatus ?? order.status} onValueChange={(value: OrderStatus) => setNewStatus(value)}>
              <SelectTrigger id="status-select" className="w-full sm:w-[160px] bg-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleSaveChanges} disabled={isUpdating || newStatus === order.status} className="w-full sm:w-auto">
            {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};