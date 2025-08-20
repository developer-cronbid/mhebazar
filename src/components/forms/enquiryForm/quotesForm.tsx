import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import React, { useState, useEffect } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Product } from "@/types";
import DOMPurify from 'dompurify';
import { useUser } from "@/context/UserContext";

const QuoteForm = ({ product, onClose }: { product: Product, onClose: () => void }) => {
  const { user } = useUser();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    companyName: '',
    email: '',
    phone: '',
    message: ''
  });

  // Prefill form fields with user data if available
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: user.full_name || '',
        email: user.email || '',
        phone: user.phone || '',
        // The company name is not available in the user object, so we leave it empty.
        // The address is also not a direct field, so we'll just log it.
      }));
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const requiredFields = ['fullName', 'companyName', 'email', 'phone'];
    for (const field of requiredFields) {
      if (!formData[field].trim()) {
        return false;
      }
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(formData.email);
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('Please fill in all required fields with valid information.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Concatenate all form data into a single message string
      const fullMessage = `
        **Quote Request Details**
        - Full Name: ${formData.fullName.trim()}
        - Company Name: ${formData.companyName.trim()}
        - Email: ${formData.email.trim()}
        - Phone: ${formData.phone.trim()}
        ${user?.address?.address ? `- Address: ${user.address.address}` : ''}
        ${formData.message.trim() ? `\n---\nMessage:\n${formData.message.trim()}` : ''}
      `;

      const quotePayload: Record<string, any> = {
        message: fullMessage,
        product: product?.id,
      };

      await api.post('/quotes/', quotePayload);

      toast.success('Quote request submitted successfully!');

      // Reset form
      setFormData({
        fullName: '',
        companyName: '',
        email: '',
        phone: '',
        message: ''
      });

      // Close form after success
      if (onClose) {
        onClose();
      }
    } catch (err) {
      toast.error('Failed to submit quote request. Please try again.');
      console.error('Error submitting quote:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (error && !product) {
    return (
      <div className="h-[90vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <p className="text-red-600">{error}</p>
          <Button
            onClick={() => window.location.reload()}
            className="bg-[#5ca131] hover:bg-[#459426] text-white"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-h-[90vh] overflow-auto">
      <div className="w-full mx-auto">
        <Card className="border-none">
          <CardContent className="p-4 sm:p-6 lg:p-8 bg-white">
            {/* Product Information */}
            <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 mb-8">
              <div className="w-full lg:w-1/2 xl:w-2/5">
                <img
                  src={product?.image || product?.images[0].image || "/no-product.png"}
                  alt={product?.title || product?.name || "Product"}
                  className="w-full h-48 sm:h-64 lg:h-72 object-contain rounded-lg shadow-sm"
                />
              </div>
              <div className="flex-1 space-y-3">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 leading-tight">
                  {product?.title || product?.name || "Product"}
                </h2>
                <div className="space-y-2 text-sm sm:text-base text-gray-600">
                  {/* <p>
                    <span className="font-medium">Qty:</span> {product?.stock_quantity || 0}
                  </p> */}
                </div>
              </div>
            </div>

            {/* Product Description */}
            <div className="mb-8">
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(product?.subtitle || product?.description || "No description available.") }} />
              </p>
            </div>

            {/* Quote Form */}
            <div className="space-y-6">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 text-center">
                Get a Quote
              </h3>
              <div className="space-y-4">
                {/* Name and Company Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Input
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="h-12 text-sm"
                      placeholder="Full name *"
                    />
                  </div>
                  <div>
                    <Input
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleInputChange}
                      className="h-12 text-sm"
                      placeholder="Company name *"
                    />
                  </div>
                </div>

                {/* Email and Phone Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="h-12 text-sm"
                      placeholder="Email *"
                    />
                  </div>
                  <div>
                    <Input
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="h-12 text-sm"
                      placeholder="Phone *"
                    />
                  </div>
                </div>

                {/* Message */}
                <div>
                  <Textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    className="min-h-[80px] text-sm resize-none"
                    placeholder="Message (optional)"
                  />
                </div>

                {/* Submit Button */}
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full h-12 bg-[#5ca131] hover:bg-[#459426] disabled:bg-gray-400 text-white font-bold text-sm transition-colors duration-200"
                >
                  {submitting ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting...
                    </div>
                  ) : (
                    'Submit Quote Request'
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default QuoteForm;
