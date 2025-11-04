"use client"

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import React, { useState, useEffect } from "react";
import { Loader2, AlertCircle, MessageSquare } from "lucide-react"; // Added MessageSquare
import api from "@/lib/api";
import { toast } from "sonner";
import { Product } from "@/types";
import { useUser } from "@/context/UserContext";
import countrycode from '@/data/countrycode_cleaned.json'
import Image from "next/image"; // Added Image import

// Utility function to generate a safe slug for the product link
const generateProductSlug = (product: Product): string => {
    const titleSlug = product.title?.toLowerCase().replace(/\s+/g, '-') || product.name?.toLowerCase().replace(/\s+/g, '-');
    return `${titleSlug}-${product.id}`;
};

// Utility function to generate the WhatsApp URL
const generateWhatsAppUrl = (
    phone: string,
    product: Product,
    formData: any, 
    userAddress: string
): string => {
    const productLink = `https://www.mhebazar.in/product/${generateProductSlug(product)}`;
    const productName = product.title || product.name || 'Material Handling Equipment';
    
    // NOTE: formData.message will contain the "WhatsApp: " prefix if confirmed.
    const messageTemplate = `
Hello! 👋
I'm contacting you through the MHE Bazar website.
I'd like to request a quotation for the following product:

Name: ${formData.fullName}
Email: ${formData.email}
Mobile No.: ${formData.phone}
Company Name: ${formData.companyName}
Product Name: ${productName}
Product Link: ${productLink}
Location: ${userAddress}
Message: ${formData.message || 'No additional message provided.'}

Please share the best quote and availability details.
Thank you!
    `.trim();

    const encodedMessage = encodeURIComponent(messageTemplate);
    return `https://api.whatsapp.com/send?phone=${phone}&text=${encodedMessage}`;
};


const QuoteForm = ({ product, onClose }: { product: Product, onClose: () => void }) => {
  const { user } = useUser();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false); 
  const [vendorPhone, setVendorPhone] = useState<string | null>(null); 
  
  const [formData, setFormData] = useState({
    fullName: '',
    companyName: '',
    email: '',
    phone: '',
    message: '',
    address: ''
  });

  const [selectedDialCode, setSelectedDialCode] = useState<string>('');

  const getDialFromCountry = (c: any) => {
    if (!c || !c.idd) return '+';
    const root = c.idd.root || '';
    const suffix = Array.isArray(c.idd.suffixes) ? (c.idd.suffixes[0] ?? '') : '';
    return `${root}${suffix}`.replace(/\s+/g, '');
  };

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: user.full_name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: (user as any).address || '', 
      }));
    }
    const userCca2 = (user as any)?.country || (user as any)?.country_code || '';
    const foundByUser = countrycode.find((c: any) => c.cca2 === userCca2);
    const foundIN = countrycode.find((c: any) => c.cca2 === 'IN');
    const defaultCountry = foundByUser || foundIN || countrycode[0];
    setSelectedDialCode(getDialFromCountry(defaultCountry));
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const requiredFields = ['fullName', 'companyName', 'email', 'phone', 'address'];
    for (const field of requiredFields) {
      if (!formData[field].trim()) {
        return false;
      }
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(formData.email);
  };
  
  // Function to handle the actual API submission and redirection
  const submitQuoteAndRedirect = async (shouldRedirectToWhatsApp: boolean) => {
    try {
        setSubmitting(true);
        
        // Build full phone number
        const localNumber = formData.phone.replace(/[\s\-()]+/g, '').replace(/^0+/, '');
        const dial = selectedDialCode || '';
        const normalizedDial = dial.startsWith('+') ? dial : `+${dial}`;
        const fullPhone = `${normalizedDial}${localNumber}`;

        let finalQuoteMessage = formData.message.trim();
        
        // Append "WhatsApp" prefix if confirmed
        if (shouldRedirectToWhatsApp) {
            finalQuoteMessage = `WhatsApp: ${finalQuoteMessage}`;
        }

        const addressString = `Company Address: ${formData.address.trim()}`;
        const apiMessage = finalQuoteMessage.trim() ? `${finalQuoteMessage.trim()}\n\n---\n${addressString}` : addressString;

        const quotePayload: Record<string, any> = {
            message: apiMessage,
            full_name: formData.fullName,
            email: formData.email,
            phone: fullPhone,
            company_name: formData.companyName,
            product: product?.id,
        };

        // 1. Submit Quote Request
        await api.post('/quotes/', quotePayload);

        toast.success('Quote request submitted successfully!');

        // 2. Conditional Redirect
        if (shouldRedirectToWhatsApp && vendorPhone) {
            const whatsappUrl = generateWhatsAppUrl(
                vendorPhone,
                product,
                { ...formData, phone: fullPhone, message: finalQuoteMessage },
                formData.address
            );
            window.location.href = whatsappUrl;
            return; 
        }

        // 3. Fallback: Reset and Close Form
        setFormData({
            fullName: '',
            companyName: '',
            email: '',
            phone: '',
            message: '',
            address: ''
        });

        if (onClose) {
            onClose();
        }

    } catch (err) {
        toast.error('Failed to submit quote request. Please try again.');
        console.error('Error submitting quote:', err);
    } finally {
        setSubmitting(false);
        setShowConfirmation(false); // Hide the confirmation popup
    }
  }

  // UPDATED handleSubmit: Shows Confirmation Modal first
  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fill in all required fields with valid information.');
      return;
    }
    
    // Set submitting state while fetching the vendor phone
    setSubmitting(true);
    
    try {
        // Fetch Vendor Phone (required for WhatsApp)
        const vendorPhoneResponse = await api.get<{ company_phone: string }>(`/product/${product.id}/vendor-phone/`);
        const phone = vendorPhoneResponse.data?.company_phone || null;
        setVendorPhone(phone); 
        
        setSubmitting(false); // Stop loader after fetch

        if (phone) {
            // Show custom confirmation UI if vendor phone is available
            setShowConfirmation(true);
        } else {
            // If vendor phone is NOT available, submit directly without asking
            await submitQuoteAndRedirect(false);
        }

    } catch (err) {
        // If fetching phone fails, submit the form directly and warn/log
        console.warn("Failed to fetch vendor phone, submitting without WhatsApp prompt:", err);
        setSubmitting(false);
        await submitQuoteAndRedirect(false);
    }
  };
  
  // Custom Confirmation Dialog Component
  const ConfirmationDialog = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <Card className="w-full max-w-md p-6 bg-white shadow-2xl rounded-lg">
        <div className="flex flex-col items-center text-center space-y-4">
          <MessageSquare className="h-10 w-10 text-[#5ca131]" />
          <h4 className="text-xl font-bold text-gray-900">
            Contact Vendor Directly?
          </h4>
          <p className="text-sm text-gray-700">
            Your request has been saved. For an **immediate quote** and faster discussion, would you like to **message the vendor directly on WhatsApp**?
          </p>
        </div>
        <div className="mt-6 flex gap-3 justify-end">
          <Button 
            variant="outline"
            onClick={() => submitQuoteAndRedirect(false)}
            disabled={submitting}
            className="h-10 border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            Just Submit Form
          </Button>
          <Button 
            onClick={() => submitQuoteAndRedirect(true)}
            disabled={submitting}
            className="h-10 bg-[#5ca131] hover:bg-[#459426] text-white"
          >
            Yes, WhatsApp Now
          </Button>
        </div>
      </Card>
    </div>
  );


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
      {/* Conditionally render the custom confirmation dialog */}
      {showConfirmation && <ConfirmationDialog />}
      
      <div className="w-full mx-auto">
        <Card className="border-none">
          <CardContent className=" bg-white">
            {/* Product Information - kept for context */}
            <div className="flex flex-col-reverse justify-center items-center gap-6 lg:gap-8 mb-8">
              <div className="w-full lg:w-1/2 xl:w-2/5">
                <div className="relative w-full h-48 sm:h-64 lg:h-72 rounded-lg shadow-sm overflow-hidden">
                    <Image
                        src={product?.image || product?.images?.[0]?.image || "/no-product.jpg"}
                        alt={product?.title || product?.name || "Product"}
                        fill
                        className="object-contain"
                    />
                </div>
              </div>
              <div className="flex-1 space-y-3">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 leading-tight">
                  {product?.title || product?.name || "Product"}
                </h2>
                <div className="space-y-2 text-sm sm:text-base text-gray-600">
                  {/* Additional product details here if needed */}
                </div>
              </div>
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
                      required
                      className="h-12 text-sm"
                      placeholder="Full name *"
                    />
                  </div>
                  <div>
                    <Input
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleInputChange}
                      required
                      className="h-12 text-sm"
                      placeholder="Company name *"
                    />
                  </div>
                </div>

                {/* Email and Phone Row (Country code select) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="h-12 text-sm"
                      placeholder="Email *"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <select
                        aria-label="Country code"
                        value={selectedDialCode}
                        onChange={(e) => setSelectedDialCode(e.target.value)}
                        className="h-12 px-2 text-sm border border-gray-200 rounded-md bg-white"
                      >
                        {countrycode.map((c: any) => {
                          const dial = getDialFromCountry(c);
                          return (
                            <option key={c.cca2} value={dial}>
                              {dial} {c.cca2 ? `(${c.cca2})` : ''}
                            </option>
                          );
                        })}
                      </select>
                      <Input
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                        className="h-12 text-sm flex-1"
                        placeholder="Phone *"
                      />
                    </div>
                  </div>
                </div>

                {/* Address Field */}
                <div>
                  <Input
                    name="address"
                    type="text"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                    className="h-12 text-sm"
                    placeholder="Company Address *"
                  />
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

                {/* Submit Button - Now triggers confirmation or direct submission */}
                <Button
                  onClick={handleSubmit} 
                  disabled={submitting || showConfirmation} 
                  className="w-full h-12 bg-[#5ca131] hover:bg-[#459426] disabled:bg-gray-400 text-white font-bold text-sm transition-colors duration-200"
                >
                  {submitting ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading Contact...
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