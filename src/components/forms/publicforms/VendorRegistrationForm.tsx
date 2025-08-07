// components/publicforms/VendorRegistrationForm.tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation"; // Correct hook for App Router
import { toast } from "sonner";
import api from "@/lib/api";

// --- IMPORTANT ---
// Replace this with the actual path to your authentication hook.
// This hook should provide the user's authentication status.
import { useUser } from "@/context/UserContext";

interface Props {
  open: boolean;
  onClose: () => void;
}

// Interface now only contains company fields
interface VendorFormData {
  company_name: string;
  company_email: string;
  company_address: string;
  company_phone: string;
  brand: string;
  pcode: string;
  gst_no: string;
}

interface ApiError {
  [key: string]: string[] | string;
}

export default function VendorRegistrationDrawer({ open, onClose }: Props) {
  const router = useRouter();

  // Use useUser instead of useAuth
  const { user, isLoading } = useUser();

  // State now only holds company data
  const [formData, setFormData] = useState<VendorFormData>({
    company_name: "",
    company_email: "",
    company_address: "",
    company_phone: "",
    brand: "",
    pcode: "",
    gst_no: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<ApiError>({});

  // Effect to handle redirection for unauthenticated users
  useEffect(() => {
    // Don't do anything if the drawer isn't open or if we are still checking auth status
    if (!open || isLoading) {
      return;
    }

    // If auth check is complete and user is not logged in, redirect them.
    if (!user) {
      toast.error("Please log in or create an account to become a vendor.");
      onClose(); // Close the drawer before redirecting
      router.push("/register");
    }
  }, [open, user, isLoading, router, onClose]);


  // Effect to prevent background scroll
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Effect to reset form when drawer closes
  useEffect(() => {
    if (!open) {
      setFormData({
        company_name: "",
        company_email: "",
        company_address: "",
        company_phone: "",
        brand: "",
        pcode: "",
        gst_no: "",
      });
      setErrors({});
    }
  }, [open]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // Simplified validation for company fields only
  const validateForm = (): boolean => {
    const newErrors: ApiError = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+?1?\d{9,15}$/;
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

    if (!formData.company_name.trim()) newErrors.company_name = "Company name is required";
    if (!formData.company_email.trim()) newErrors.company_email = "Company email is required";
    else if (!emailRegex.test(formData.company_email)) newErrors.company_email = "Invalid company email format";
    if (!formData.company_address.trim()) newErrors.company_address = "Company address is required";
    if (!formData.company_phone.trim()) newErrors.company_phone = "Company phone is required";
    else if (!phoneRegex.test(formData.company_phone)) newErrors.company_phone = "Invalid company phone number";
    if (formData.gst_no && !gstRegex.test(formData.gst_no.toUpperCase())) newErrors.gst_no = "Invalid GST number format";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Simplified submission logic
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors in the form.");
      return;
    }

    setIsSubmitting(true);

    const vendorApplicationData = {
      ...formData,
      brand: formData.brand || null,
      pcode: formData.pcode || null,
      gst_no: formData.gst_no || null,
    };

    try {
      // The API call assumes the user is authenticated.
      // Your 'api' instance should be configured to send the auth token/cookie.
      await api.post("/vendor/apply/", vendorApplicationData);

      toast.success(
        "Vendor application submitted! You will be notified once it's reviewed."
      );
      onClose();
      // You might want to redirect the user to their dashboard or a pending page
      // router.push("/dashboard");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      if (error.response && error.response.data) {
        // Handle specific API errors (e.g., "You already have an application")
        const errorData = error.response.data;
        if (typeof errorData === 'object' && errorData !== null) {
          setErrors(errorData);
          const firstError = Object.values(errorData)[0];
          toast.error(Array.isArray(firstError) ? firstError[0] : 'Vendor application failed.');
        } else {
          toast.error(errorData.error || "An unknown API error occurred.");
        }
      } else {
        toast.error("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderError = (fieldName: keyof VendorFormData) => {
    const errorValue = errors?.[fieldName];
    if (!errorValue) return null;
    const errorMessage = Array.isArray(errorValue) ? errorValue[0] : errorValue;
    return <p className="text-red-500 text-sm mt-1">{errorMessage}</p>;
  };

  // Do not render the form if the user isn't authenticated, as they will be redirected.
  if (!user && !isLoading) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 z-50 transition-all duration-300 ${open ? "pointer-events-auto" : "pointer-events-none"
        }`}
      aria-modal="true"
      role="dialog"
    >
      <div
        className={`absolute inset-0 bg-black/30 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"
          }`}
        onClick={onClose}
      />
      <div
        className={`absolute right-0 top-0 h-full w-full max-w-lg bg-white shadow-xl transition-transform duration-300 flex flex-col ${open ? "translate-x-0" : "translate-x-full"
          }`}
      >
        <button
          className="absolute right-4 top-4 text-2xl text-gray-700 hover:text-black z-10"
          onClick={onClose}
          aria-label="Close"
          disabled={isSubmitting}
        >
          &times;
        </button>

        <div className="p-8 pt-14 flex-1 overflow-y-auto">
          <h2 className="text-2xl font-bold mb-2">Become a Vendor</h2>
          <p className="text-gray-600 mb-6">
            Fill out your company details to apply for vendor status. Your
            application will be reviewed by our team.
          </p>

          {/* Form now only contains company information */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <h3 className="text-lg font-semibold mb-4">
                Company Information
              </h3>
              <div>
                <label className="block font-medium mb-1">
                  Company Name<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter company name"
                  className="w-full bg-gray-50 border border-gray-200 rounded px-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
                  disabled={isSubmitting}
                />
                {renderError("company_name")}
              </div>
              <div className="mt-4">
                <label className="block font-medium mb-1">
                  Company Email<span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="company_email"
                  value={formData.company_email}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter company email"
                  className="w-full bg-gray-50 border border-gray-200 rounded px-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
                  disabled={isSubmitting}
                />
                {renderError("company_email")}
              </div>
              <div className="mt-4">
                <label className="block font-medium mb-1">
                  Company Address<span className="text-red-500">*</span>
                </label>
                <textarea
                  name="company_address"
                  value={formData.company_address}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter company address"
                  rows={3}
                  className="w-full bg-gray-50 border border-gray-200 rounded px-4 py-3 outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  disabled={isSubmitting}
                />
                {renderError("company_address")}
              </div>
              <div className="mt-4">
                <label className="block font-medium mb-1">
                  Company Phone<span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="company_phone"
                  value={formData.company_phone}
                  onChange={handleInputChange}
                  required
                  placeholder="+919876543210"
                  className="w-full bg-gray-50 border border-gray-200 rounded px-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
                  disabled={isSubmitting}
                />
                {renderError("company_phone")}
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block font-medium mb-1">Brand</label>
                  <input
                    type="text"
                    name="brand"
                    value={formData.brand}
                    onChange={handleInputChange}
                    placeholder="Enter brand name"
                    className="w-full bg-gray-50 border border-gray-200 rounded px-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
                    disabled={isSubmitting}
                  />
                  {renderError("brand")}
                </div>
                <div>
                  <label className="block font-medium mb-1">Pin Code</label>
                  <input
                    type="text"
                    name="pcode"
                    value={formData.pcode}
                    onChange={handleInputChange}
                    placeholder="Enter pin code"
                    className="w-full bg-gray-50 border border-gray-200 rounded px-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
                    disabled={isSubmitting}
                  />
                  {renderError("pcode")}
                </div>
              </div>
              <div className="mt-4">
                <label className="block font-medium mb-1">GST Number</label>
                <input
                  type="text"
                  name="gst_no"
                  value={formData.gst_no}
                  onChange={handleInputChange}
                  placeholder="12ABCDE1234F1Z5"
                  className="w-full bg-gray-50 border border-gray-200 rounded px-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
                  disabled={isSubmitting}
                />
                {renderError("gst_no")}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="mt-6 w-full bg-[#5CA131] hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded py-3 text-base transition-colors"
            >
              {isSubmitting ? "Submitting..." : "Submit Vendor Application"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}