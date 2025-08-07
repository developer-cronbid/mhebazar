// src/app/account/orders/page.tsx
"use client";
import Breadcrumb from "@/components/elements/Breadcrumb";
import AccountTabsUI from "@/components/account/OrderWishTabs";
import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

// Frontend-specific status types
type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
type PaymentStatus = "pending" | "success" | "failed" | "refunded";
// DeliveryStatus is defined but will only be used if delivery object is explicitly added by backend
type DeliveryStatus = "not_shipped" | "in_transit" | "out_for_delivery" | "delivered" | "failed"; 

interface ProductDetailsInOrder {
  id: number;
  name: string;
  images: { id: number; image: string }[];
  price: string;
  hide_price: boolean;
}

interface OrderItemApi {
  id: number;
  product: number;
  product_details: ProductDetailsInOrder;
  quantity: number;
  unit_price: string;
  total_price: string;
}

// DeliveryApi will be null or undefined if not nested in OrderSerializer
interface DeliveryApi {
  id: number;
  tracking_id: string | null;
  status: DeliveryStatus; 
  estimated_delivery_date: string | null;
  actual_delivery_date: string | null;
  courier_name: string | null;
  delivery_notes: string | null;
}

interface PaymentApi { // Matches the data from /api/payments/
  id: number;
  user: number;
  user_name: string;
  order: number; // This is the foreign key ID for the Order
  order_number: string;
  razorpay_order_id: string;
  razorpay_payment_id: string | null;
  razorpay_signature: string | null;
  amount: string;
  currency: string;
  status: PaymentStatus;
  payment_method: string | null; // Can be null as per your provided data
  created_at: string;
  updated_at: string;
}

// Consolidated OrderApi including potentially matched payments and delivery (if available)
interface OrderApi {
  id: number;
  order_number: string;
  status: OrderStatus; // This is the status coming from OrderSerializer
  total_amount: string;
  shipping_address: string;
  phone_number: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  items: OrderItemApi[];
  // These will be manually attached in frontend from separate API calls
  delivery?: DeliveryApi; 
  payments?: PaymentApi[]; 
}

interface ApiResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrdersAndPayments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const ordersResponse = await api.get<ApiResponse<OrderApi>>("/orders/");
      const paymentsResponse = await api.get<ApiResponse<PaymentApi>>("/payments/"); // Fetch payments separately

      const fetchedOrders = ordersResponse.data.results;
      const allPayments = paymentsResponse.data.results;

      // Map payments to their respective orders
      const ordersWithPayments = fetchedOrders.map(order => {
        const orderPayments = allPayments.filter(payment => payment.order === order.id);
        return {
          ...order,
          payments: orderPayments,
          // Delivery will still be undefined as it's not in OrderSerializer
        };
      });

      setOrders(ordersWithPayments);
      console.log("Orders with merged payments fetched:", ordersWithPayments);
    } catch (err: unknown) {
      console.error("Failed to fetch orders or payments:", err);
      setError("Failed to load your orders. Please try again later.");
      toast.error("Failed to load orders.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrdersAndPayments();
  }, [fetchOrdersAndPayments]);

  const mapOrderStatusToDisplay = (status: OrderStatus | null | undefined) => { 
    if (!status) return { display: "Unknown", color: "bg-gray-100 text-gray-700" };
    switch (status) {
      case "pending":
        return { display: "Pending", color: "bg-yellow-100 text-yellow-700" };
      case "confirmed":
        return { display: "Confirmed", color: "bg-green-100 text-green-700" };
      case "shipped":
        return { display: "In Transit", color: "bg-blue-100 text-blue-700" };
      case "delivered":
        return { display: "Delivered", color: "bg-green-100 text-green-700" };
      case "cancelled":
        return { display: "Cancelled", color: "bg-red-100 text-red-700" };
      default:
        return { display: "Unknown", color: "bg-gray-100 text-gray-700" };
    }
  };

  const mapPaymentStatusToDisplay = (status: PaymentStatus | null | undefined) => { 
    if (!status) return { display: "N/A", color: "bg-gray-100 text-gray-700" };
    switch (status) {
      case "pending":
        return { display: "Payment Pending", color: "bg-yellow-100 text-yellow-700" };
      case "success":
        return { display: "Payment Successful", color: "bg-green-100 text-green-700" };
      case "failed":
        return { display: "Payment Failed", color: "bg-red-100 text-red-700" };
      case "refunded":
        return { display: "Refunded", color: "bg-blue-100 text-blue-700" };
      default:
        return { display: "Unknown", color: "bg-gray-100 text-gray-700" };
    }
  };

  // This function will still be passed, but its ability to reflect detailed delivery
  // status depends solely on order.status and not a separate delivery object.
  const mapDeliveryStatusToDisplay = (status: DeliveryStatus | null | undefined) => { 
    if (!status) return { display: "Unknown", color: "bg-gray-100 text-gray-700" };
    switch (status) {
      case "not_shipped":
        return { display: "Not Shipped", color: "bg-gray-100 text-gray-700" };
      case "in_transit":
        return { display: "In Transit", color: "bg-blue-100 text-blue-700" };
      case "out_for_delivery":
        return { display: "Out for Delivery", color: "bg-orange-100 text-orange-700" };
      case "delivered":
        return { display: "Delivered", color: "bg-green-100 text-green-700" };
      case "failed":
        return { display: "Delivery Failed", color: "bg-red-100 text-red-700" };
      default:
        return { display: "Unknown", color: "bg-gray-100 text-gray-700" };
    }
  };


  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 text-center">
        <div className="flex justify-center items-center min-h-[200px]">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-500"></div>
          <p className="ml-4 text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 text-center">
        <p className="text-red-500">{error}</p>
        <Button onClick={fetchOrdersAndPayments} className="mt-4">Retry Loading Orders</Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "My Account", href: "/account/orders" },
        ]}
      />
      <AccountTabsUI
        activeTab="orders"
        orders={orders}
        mapOrderStatusToDisplay={mapOrderStatusToDisplay}
        mapPaymentStatusToDisplay={mapPaymentStatusToDisplay}
        mapDeliveryStatusToDisplay={mapDeliveryStatusToDisplay}
      />
    </div>
  );
}