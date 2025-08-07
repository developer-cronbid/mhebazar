// components/cart/PaymentStep.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Truck, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import api from '@/lib/api';
import axios from 'axios';
import { useUser } from '@/context/UserContext';
import Image from 'next/image';
import { useRouter } from 'next/navigation'; // Import useRouter

// Type definitions
interface PaymentMethod {
  id: string;
  type: 'card' | 'upi' | 'netbanking' | 'cod';
  name: string;
  icon: React.ReactNode;
  description?: string;
}

interface ProductDetails {
  id: number;
  name: string;
  price: string;
  images: { id: number; image: string }[];
  hide_price: boolean;
}

interface CartItemApi {
  id: number;
  product: number;
  product_details: ProductDetails;
  quantity: number;
  total_price: number;
}

interface ApiResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

interface PaymentStepProps {
  onComplete: () => void;
  onBack: () => void;
  cartTotal: number;
  shippingAddress: string;
  phoneNumber: string;
}

// Declare Razorpay type globally
declare global {
  interface Window {
    Razorpay: {
      new(options: Record<string, unknown>): {
        on(event: string, callback: (response: unknown) => void): void;
        open(): void;
      };
    };
  }
}

const RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

export default function PaymentStep({ onComplete, onBack, cartTotal, shippingAddress, phoneNumber }: PaymentStepProps) {
  const { user } = useUser();
  const router = useRouter();
  const [selectedPayment, setSelectedPayment] = useState<string>('cod');
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  const [cartItems, setCartItems] = useState<CartItemApi[]>([]);

  useEffect(() => {
    console.log("Loading Razorpay SDK script...");
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => console.log("Razorpay SDK loaded successfully.");
    script.onerror = (e) => console.error("Failed to load Razorpay SDK script:", e);
    document.body.appendChild(script);

    return () => {
      console.log("Cleaning up Razorpay SDK script.");
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const fetchCartItems = useCallback(async () => {
    try {
      console.log("Fetching cart items for summary...");
      const response = await api.get<ApiResponse<CartItemApi>>("/cart/");
      setCartItems(response.data.results);
      console.log("Cart items fetched:", response.data.results);
    } catch (error) {
      console.error("Failed to fetch cart items for payment summary:", error);
      toast.error("Failed to load cart details for order summary.");
    }
  }, []);

  useEffect(() => {
    fetchCartItems();
  }, [fetchCartItems]);

  const paymentMethods: PaymentMethod[] = [
    {
      id: 'razorpay',
      type: 'card',
      name: 'Pay Online (Razorpay)',
      icon: <CreditCard className="w-5 h-5" />,
      description: 'Secure payment via Razorpay'
    },
    {
      id: 'cod',
      type: 'cod',
      name: 'Cash on Delivery',
      icon: <Truck className="w-5 h-5" />,
      description: 'Pay when your order is delivered'
    }
  ];

  const formatPrice = (price: number) => `₹ ${price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const handlePlaceOrder = async () => {
    if (!user) {
      toast.error("User not logged in. Please log in to place an order.");
      return;
    }
    if (cartItems.length === 0 || cartTotal <= 0) {
      toast.error("Your cart is empty or total is invalid.");
      return;
    }
    if (!shippingAddress || !phoneNumber) {
      toast.error("Shipping address or phone number is missing. Please go back to address step.");
      return;
    }

    setIsProcessingOrder(true);
    try {
      console.log("Attempting to create order from cart on backend...");
      // Reverted: Do not send payment_method to create_from_cart
      const orderResponse = await api.post('/orders/create_from_cart/', {
        shipping_address: shippingAddress,
        phone_number: phoneNumber,
        // payment_method: selectedPayment, // Removed this line as backend's create_from_cart doesn't use it.
      });
      const createdOrder = orderResponse.data;
      const orderId = createdOrder.id;
      const orderNumber = createdOrder.order_number;
      console.log("Order successfully created on MHE backend:", createdOrder);

      if (selectedPayment === 'cod') {
        // For COD, the order is considered placed and confirmed immediately by backend's create_from_cart
        toast.success(`Order ${orderNumber} placed successfully with Cash on Delivery!`);
        router.push('/account/orders'); // Redirect immediately for COD
        onComplete();
      } else if (selectedPayment === 'razorpay') {
        if (!RAZORPAY_KEY_ID) {
            toast.error("Razorpay Key ID is not configured. Please check environment variables and restart server.");
            setIsProcessingOrder(false);
            return;
        }

        console.log("Attempting to create Razorpay order on backend...");
        const razorpayOrderCreationResponse = await api.post('/payments/create_razorpay_order/', {
          order_id: orderId,
        });
        const razorpayOrderDetails = razorpayOrderCreationResponse.data;
        console.log("Razorpay order successfully created on backend:", razorpayOrderDetails);

        if (typeof window.Razorpay === 'undefined') {
          toast.error("Razorpay SDK not loaded. Please try again after a moment.");
          setIsProcessingOrder(false);
          return;
        }

        const options = {
          key: RAZORPAY_KEY_ID,
          amount: razorpayOrderDetails.amount,
          currency: razorpayOrderDetails.currency,
          name: "MHE Bazar",
          description: `Payment for Order #${orderNumber}`,
          order_id: razorpayOrderDetails.razorpay_order_id,
          handler: async (response: {
            razorpay_payment_id: string;
            razorpay_order_id: string;
            razorpay_signature: string;
          }) => {
            console.log("Razorpay handler response received:", response);
            try {
              console.log("Attempting to verify payment on backend...");
              const verificationResponse = await api.post(`/payments/verify_payment/`, {
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              });
              console.log("Payment verification backend response:", verificationResponse.data);

              toast.success(`Payment successful! Order ${orderNumber} confirmed.`);
              router.push('/account/orders'); // Redirect to orders page
              onComplete();
            } catch (error) {
              console.error("Payment verification failed:", error);
              if (axios.isAxiosError(error) && error.response) {
                toast.error(error.response.data?.error || `Payment verification failed: ${error.response.statusText}`);
              } else {
                toast.error("Payment verification failed. Please contact support.");
              }
            } finally {
                setIsProcessingOrder(false);
            }
          },
          prefill: {
            name: user?.full_name || user?.username || '',
            email: user?.email || '',
            contact: user?.phone || phoneNumber || '',
          },
          theme: {
            color: "#16A34A",
          },
          modal: {
            ondismiss: () => {
              toast.info('Payment window closed. If payment was made, check My Orders for status.');
              setIsProcessingOrder(false);
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      }
    } catch (error: unknown) {
      console.error("Error during order placement or payment initiation:", error);
      if (axios.isAxiosError(error) && error.response) {
        toast.error(error.response.data?.error || error.response.data?.message || `Failed to place order: ${error.response.statusText}`);
      } else {
        toast.error("An unexpected error occurred while placing the order.");
      }
    } finally {
      setIsProcessingOrder(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="max-w-6xl mx-auto"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Payment Methods */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <CreditCard className="w-5 h-5 mr-2" />
            Payment Method
          </h2>

          <RadioGroup value={selectedPayment} onValueChange={setSelectedPayment}>
            <div className="space-y-4">
              {paymentMethods.map((method) => (
                <motion.div
                  key={method.id}
                  whileHover={{ scale: 1.01 }}
                  className="relative"
                >
                  <Card className={`cursor-pointer transition-all ${
                    selectedPayment === method.id ? 'ring-2 ring-green-600 border-green-600' : ''
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem value={method.id} id={method.id} />
                        <div className="flex items-center space-x-3 flex-1">
                          <div className="p-2 bg-gray-100 rounded-lg">
                            {method.icon}
                          </div>
                          <div>
                            <Label htmlFor={method.id} className="text-base font-medium cursor-pointer">
                              {method.name}
                            </Label>
                            {method.description && (
                              <p className="text-sm text-gray-500">{method.description}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </RadioGroup>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <ShoppingCart className="w-5 h-5 mr-2"/> Order Summary
              </h3>

              {cartItems.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No items in cart for summary.</p>
              ) : (
                <>
                  <div className="space-y-4 max-h-48 overflow-y-auto mb-4 border-b pb-4">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex items-start gap-3">
                        <Image
                          src={item.product_details.images?.[0]?.image || "/no-product.png"}
                          alt={item.product_details.name}
                          width={48}
                          height={48}
                          className="object-cover rounded-md flex-shrink-0"
                          unoptimized={item.product_details.images?.[0]?.image?.startsWith('http')}
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-800 line-clamp-2">{item.product_details.name}</p>
                          <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                          {!item.product_details.hide_price && (
                             <p className="text-sm font-semibold text-green-700">{formatPrice(item.total_price)}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Shipping Address and Phone Number in Summary */}
                  <div className="space-y-2 mb-4">
                      <h4 className="text-sm font-semibold text-gray-700">Shipping To:</h4>
                      <p className="text-sm text-gray-600 line-clamp-2">{shippingAddress}</p>
                      <p className="text-sm text-gray-600">Phone: {phoneNumber}</p>
                  </div>

                  <div className="space-y-2 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal ({cartItems.length} items)</span>
                      <span className="font-medium">{formatPrice(cartTotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount</span>
                      <span>-{formatPrice(0)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Delivery charges</span>
                      <span className="font-medium text-green-600">Free</span>
                    </div>
                    <hr className="my-3" />
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total Amount</span>
                      <span>{formatPrice(cartTotal)}</span>
                    </div>
                  </div>

                  {cartTotal > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                      <p className="text-sm text-green-800 font-medium">
                        You will save ₹{0} on this order
                      </p>
                    </div>
                  )}

                  <Button
                    onClick={handlePlaceOrder}
                    className="w-full bg-[#5CA131] hover:bg-green-700 text-white py-3 text-base font-medium"
                    disabled={isProcessingOrder || cartItems.length === 0 || cartTotal <= 0}
                  >
                    {isProcessingOrder ? "Processing..." : `Place Order • ${formatPrice(cartTotal)}`}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Back Button */}
          <div className="flex space-x-3 mt-6">
            <Button variant="outline" onClick={onBack} className="flex-1" disabled={isProcessingOrder}>
              Back
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}