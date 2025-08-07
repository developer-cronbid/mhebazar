"use client";

import { useState } from "react";
import api from "@/lib/api"; // Correct import
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CartFormProps {
  productId: number;
  productName: string;
  productPrice: number;
}

export default function CartForm({
  productId,
  productName,
  productPrice,
}: CartFormProps) {
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await api.post("/quote/create/", {
        product: productId,
        quantity,
        message: message || undefined,
      });
      setSuccess(true);
      setMessage("");
      setQuantity(1);
    } catch (err) {
      setError("Failed to submit quote request");
      console.error("Error creating quote:", err);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="text-green-600 mb-4">
            <svg
              className="w-12 h-12 mx-auto"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">
            Quote Request Submitted!
          </h3>
          <p className="text-gray-600 mb-4">
            Your quote request has been submitted successfully. We&apos;ll get back
            to you soon.
          </p>
          <Button onClick={() => setSuccess(false)}>
            Submit Another Request
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Request Quote</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 p-4 bg-gray-50 rounded">
          <h4 className="font-semibold">{productName}</h4>
          <p className="text-gray-600">Price: ₹{productPrice}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              required
            />
          </div>

          <div>
            <Label htmlFor="message">Additional Message (Optional)</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Any specific requirements or questions..."
              rows={4}
            />
          </div>

          {error && <div className="text-red-500 text-sm">{error}</div>}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Submitting..." : "Submit Quote Request"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
