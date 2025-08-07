import React from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export default function CartSummary() {
  return (
    <Card className="w-full max-w-sm p-4 space-y-4">
      {/* Coupon Code */}
      <div>
        <label className="block mb-2 text-sm font-medium text-gray-700">Coupons</label>
        <div className="relative">
          <Input defaultValue="MEH200" className="pr-10" />
          <X className="absolute right-2 top-2.5 w-4 h-4 text-gray-500 cursor-pointer" />
        </div>
      </div>

      {/* Price Details */}
      <div className="space-y-2">
        <h2 className="text-md font-semibold">Price Details</h2>
        <div className="flex justify-between text-sm">
          <span>Item 1</span>
          <span>₹ ******</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Item 2</span>
          <span>₹ ******</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Coupon Discount</span>
          <span className="text-green-600">₹ ***</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Delivery charges</span>
          <span className="text-green-600">Free delivery</span>
        </div>
        <div className="flex justify-between font-semibold border-t pt-2">
          <span>Total</span>
          <span>₹ ******</span>
        </div>
      </div>

      {/* Place Order Button */}
      <Button className="w-full bg-[#5CA131] hover:bg-green-700 text-white">
        Place Order
      </Button>
    </Card>
  );
}
