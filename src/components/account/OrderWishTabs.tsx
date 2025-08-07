// src/components/account/OrderWishTabs.tsx
"use client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Package, MapPin, ShoppingCart, CheckCircle, Clock, XCircle, Truck, Info } from "lucide-react"; // Added Info icon for missing details

// Re-defining interfaces to match the expected data structure based on *current* backend serializers
type OrderStatusBackend = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
type PaymentStatusBackend = "pending" | "success" | "failed" | "refunded";
type DeliveryStatusBackend = "not_shipped" | "in_transit" | "out_for_delivery" | "delivered" | "failed";

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

// These interfaces are kept for type consistency, but remember 'delivery'
// will NOT be populated by the backend's OrderSerializer as it stands.
interface DeliveryApi {
  id: number;
  tracking_id: string | null;
  status: DeliveryStatusBackend;
  estimated_delivery_date: string | null;
  actual_delivery_date: string | null;
  courier_name: string | null;
  delivery_notes: string | null;
}

// This PaymentApi interface reflects the structure when fetched directly from /api/payments/
interface PaymentApi {
  id: number;
  user: number;
  user_name: string;
  order: number; // The FK to Order
  order_number: string;
  razorpay_order_id: string;
  razorpay_payment_id: string | null;
  razorpay_signature: string | null;
  amount: string;
  currency: string;
  status: PaymentStatusBackend;
  payment_method: string | null;
  created_at: string;
  updated_at: string;
}

interface OrderApi {
  id: number;
  order_number: string;
  status: OrderStatusBackend;
  total_amount: string;
  shipping_address: string;
  phone_number: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  items: OrderItemApi[];
  delivery?: DeliveryApi; // Marked as optional as backend doesn't nest it
  payments?: PaymentApi[]; // Will be populated by frontend joining
}

interface WishlistItem {
  id: string;
  title: string;
  image: string;
  price: string;
}

type TabType = "orders" | "wishlist";

const tabs = [
  { label: "My Orders", value: "orders" },
  { label: "Wishlist", value: "wishlist" },
];

const statusTabs = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Confirmed", value: "confirmed" },
  { label: "In Transit", value: "shipped" },
  { label: "Delivered", value: "delivered" },
  { label: "Cancelled", value: "cancelled" },
];

// Helper function to format date
const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return "N/A";
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  return new Date(dateString).toLocaleDateString('en-IN', options);
};

const formatPrice = (price: string | number | null | undefined) => {
  if (price === null || price === undefined) return "N/A";
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(numPrice)) return "N/A";
  return `₹ ${numPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export default function AccountTabsUI({
  activeTab,
  orders = [],
  wishlist = [],
  mapOrderStatusToDisplay,
  mapPaymentStatusToDisplay, // Still passed, but its use will be simplified for tracking UI
}: {
  activeTab: TabType;
  orders?: OrderApi[];
  wishlist?: WishlistItem[];
  mapOrderStatusToDisplay: (status: OrderApi['status'] | null | undefined) => { display: string; color: string };
  mapPaymentStatusToDisplay: (status: PaymentApi['status'] | null | undefined) => { display: string; color: string };
  mapDeliveryStatusToDisplay: (status: DeliveryApi['status'] | null | undefined) => { display: string; color: string };
}) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredOrders =
    statusFilter === "all"
      ? orders
      : orders.filter((order) => {
          if (statusFilter === "shipped") {
            return order.status === "shipped";
          }
          return order.status === statusFilter;
        });

  const handleTabClick = (tab: TabType) => {
    router.replace(`/account/${tab}`);
  };

  // Order Tracking Steps Definition - Based ONLY on Order.status if delivery isn't available
  // This is a simplified linear tracker
  const orderTrackingSteps = [
    { status: 'pending', label: 'Order Placed', icon: Clock },
    { status: 'confirmed', label: 'Order Confirmed', icon: CheckCircle },
    { status: 'shipped', label: 'Shipped', icon: Truck },
    { status: 'delivered', label: 'Delivered', icon: Package }, // Assuming order.status will eventually become 'delivered'
  ];

  const renderOrderTracking = (currentOrderStatus: OrderStatusBackend) => {
    let activeStepIndex = -1;

    if (currentOrderStatus === 'cancelled') {
        return (
            <div className="flex items-center text-red-600 font-semibold gap-2 mb-4">
                <XCircle className="w-5 h-5" /> Order Cancelled
            </div>
        );
    }

    // Determine the highest achieved status based on order.status
    for (let i = orderTrackingSteps.length - 1; i >= 0; i--) {
        if (orderTrackingSteps[i].status === currentOrderStatus) {
            activeStepIndex = i;
            break;
        }
    }

    return (
      <div className="w-full flex justify-between items-center py-4 relative mb-4 flex-col md:flex-row">
        {/* Progress line (hidden on small screens, shown on md and up) */}
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 z-0 mx-4 hidden md:block">
            <div
                className="h-full bg-green-500 transition-all duration-500"
                style={{ width: `${activeStepIndex >= 0 ? (activeStepIndex / (orderTrackingSteps.length - 1)) * 100 : 0}%` }}
            ></div>
        </div>

        {orderTrackingSteps.map((step, index) => {
          const isActive = index <= activeStepIndex;
          const IconComponent = step.icon;
          return (
            <div key={step.status} className="flex flex-col items-center flex-1 z-10 text-center relative px-2 mb-4 md:mb-0">
              <div
                className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all duration-300
                  ${isActive ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}
                  ${index < activeStepIndex && 'md:bg-green-500'} `} 
              >
                <IconComponent className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <p
                className={`mt-2 text-xs md:text-sm font-medium whitespace-nowrap ${isActive ? 'text-green-700' : 'text-gray-600'}`}
              >
                {step.label}
              </p>
            </div>
          );
        })}
      </div>
    );
  };


  return (
    <div className="flex flex-col sm:flex-row items-start gap-6 mt-4">
      {/* Tabs */}
      <div className="flex sm:flex-col w-full sm:w-56 mb-4 sm:mb-0">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleTabClick(tab.value as TabType)}
            className={`w-full text-left px-6 py-4 rounded-lg font-medium text-base transition
              ${
                activeTab === tab.value
                  ? "bg-green-100 text-green-700"
                  : "hover:bg-gray-50 text-gray-700"
              }
              `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 w-full">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6">
          {activeTab === "orders" ? "My Orders" : "Wishlist"}
        </h1>
        {/* Status Tabs (only for orders) */}
        {activeTab === "orders" && (
          <div className="flex gap-6 mb-4 text-base font-medium overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
            {statusTabs.map((tab) => (
              <button
                key={tab.value}
                className={`pb-2 transition whitespace-nowrap ${
                  statusFilter === tab.value
                    ? "text-green-600 border-b-2 border-green-600"
                    : "text-gray-500 hover:text-green-600"
                }`}
                onClick={() => setStatusFilter(tab.value)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
        {/* List */}
        {activeTab === "orders" ? (
          <div className="flex flex-col gap-6">
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order) => {
                const orderStatus = mapOrderStatusToDisplay(order.status);
                // Find the latest payment for this order, assuming order.payments is an array sorted by created_at DESC or the latest is first
                const payment = order.payments?.[0]; // Access first payment if it exists
                const paymentStatus = mapPaymentStatusToDisplay(payment?.status);

                const displayItem = order.items?.[0]?.product_details;
                const displayImage = displayItem?.images?.[0]?.image || "/no-product.png";
                const displayTitle = displayItem?.name || "No Product Info";

                return (
                  <Accordion
                    type="single"
                    collapsible
                    key={order.id}
                    className="w-full"
                  >
                    <AccordionItem value={`order-${order.id}`} className="border-b rounded-2xl shadow-[0_4px_16px_0_rgba(0,0,0,0.03)] bg-white overflow-hidden">
                      <AccordionTrigger className="px-6 py-4 flex items-center justify-between hover:no-underline">
                        <div className="flex items-center gap-4 w-full">
                          <Image
                            src={displayImage}
                            alt={displayTitle}
                            width={64}
                            height={64}
                            className="rounded-lg object-contain flex-shrink-0"
                            unoptimized={displayImage.startsWith('http')}
                          />
                          <div className="flex-1 text-left min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span
                                className={`text-xs px-3 py-1 rounded-full font-semibold ${orderStatus.color}`}
                              >
                                {orderStatus.display}
                              </span>
                              {/* Display Payment Status here */}
                              <span
                                className={`text-xs px-3 py-1 rounded-full font-semibold ${paymentStatus.color}`}
                              >
                                {`Payment: ${paymentStatus.display}`} 
                              </span>
                            </div>
                            <div className="font-bold text-gray-800 text-base truncate">
                              Order ID: {order.order_number}
                            </div>
                            <div className="text-gray-700 text-sm truncate max-w-[calc(100%-1rem)]">
                              {order.items.length} item(s) • {formatPrice(order.total_amount)}
                            </div>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-6 py-4 border-t border-gray-100">
                        {/* Order Tracking UI based on order.status only */}
                        <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <Truck className="w-4 h-4" /> Order Tracking
                        </h4>
                        {renderOrderTracking(order.status)}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-700 mt-4"> {/* Added mt-4 */}
                          {/* Order Details */}
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                              <Package className="w-4 h-4" /> Order Details
                            </h4>
                            <ul className="space-y-1 text-sm">
                              <li><strong>Order Date:</strong> {formatDate(order.created_at)}</li>
                              <li><strong>Total Amount:</strong> {formatPrice(order.total_amount)}</li>
                              <li><strong>Payment Method:</strong> {payment?.payment_method || 'N/A'}</li>
                              {payment?.razorpay_payment_id && (
                                <li><strong>Payment ID:</strong> {payment.razorpay_payment_id}</li>
                              )}
                              {payment?.status === 'failed' && payment?.payment_method === 'razorpay' && (
                                <li>
                                    <span className="text-red-500 font-medium">Payment Failed. Please try again or contact support.</span>
                                </li>
                              )}
                            </ul>
                          </div>

                          {/* Shipping Details - Now explicitly states missing tracking if not available */}
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                              <MapPin className="w-4 h-4" /> Shipping Details
                            </h4>
                            <ul className="space-y-1 text-sm">
                              <li><strong>Address:</strong> {order.shipping_address || 'N/A'}</li>
                              <li><strong>Phone:</strong> {order.phone_number || 'N/A'}</li>
                              <li>
                                <strong>Delivery Status:</strong>
                                {/* Since delivery object isn't nested, we'll use order.status for display here */}
                                <span className={`font-medium ${mapOrderStatusToDisplay(order.status).color.replace('bg-', 'text-')}`}>
                                    {mapOrderStatusToDisplay(order.status).display}
                                </span>
                              </li>
                              {/* If delivery details are not coming from backend, show N/A */}
                              <li><strong>Tracking ID:</strong> N/A <Info className="w-3 h-3 inline-block text-gray-400"  /></li> 
                              <li><strong>Courier:</strong> N/A</li>
                              <li><strong>Est. Delivery:</strong> N/A</li>
                              <li><strong>Actual Delivery:</strong> N/A</li>
                            </ul>
                          </div>

                          {/* Items in Order */}
                          <div className="md:col-span-2">
                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                              <ShoppingCart className="w-4 h-4" /> Items in Order ({order.items.length})
                            </h4>
                            {order.items.length > 0 ? (
                                <div className="space-y-3">
                                {order.items.map((item) => (
                                    <div key={item.id} className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                                    <Image
                                        src={item.product_details?.images?.[0]?.image || "/no-product.png"}
                                        alt={item.product_details?.name || "Product Image"}
                                        width={40}
                                        height={40}
                                        className="object-cover rounded-md flex-shrink-0"
                                        unoptimized={item.product_details?.images?.[0]?.image?.startsWith('http')}
                                    />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-800">{item.product_details?.name || 'N/A'}</p>
                                        <p className="text-xs text-gray-600">Qty: {item.quantity} x {formatPrice(item.unit_price)}</p>
                                    </div>
                                    {!item.product_details?.hide_price && (
                                        <p className="text-sm font-semibold text-green-700">{formatPrice(item.total_price)}</p>
                                    )}
                                    </div>
                                ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500">No items found for this order.</p>
                            )}
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                );
              })
            ) : (
              <div className="text-gray-500 text-center py-10">No orders found.</div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {wishlist.length > 0 ? (
              wishlist.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center bg-white rounded-2xl shadow-[0_4px_16px_0_rgba(0,0,0,0.03)] px-6 py-6"
                >
                  <Image
                    src={item.image}
                    alt={item.title}
                    width={80}
                    height={80}
                    className="rounded-lg object-contain mr-6 flex-shrink-0"
                    unoptimized={item.image.startsWith('http')}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-800 text-base mb-1 truncate">
                      {item.title}
                    </div>
                    <div className="text-green-700 font-bold text-lg">
                      {item.price}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-gray-500 text-center py-10">No wishlist items found.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}