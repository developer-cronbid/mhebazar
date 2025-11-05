"use client";

import { useState, FormEvent, JSX, useEffect, ChangeEvent } from "react";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { toast } from "sonner";
import api from "@/lib/api";
import { useUser } from "@/context/UserContext";
import { Loader2, MessageSquare } from "lucide-react"; // Added MessageSquare
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import countrycode from "@/data/countrycode_cleaned.json";

// Since we don't have slugify source, we'll implement a basic one here for safety:
const slugify = (str: string): string =>
  str
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

interface RentalFormProps {
  productId: number;
  productDetails: {
    image: string;
    title: string;
    description: string;
    price: string | number;
    stock_quantity?: number;
  };
  onClose?: () => void;
}

// Utility function to generate the WhatsApp URL (reused logic)
const generateWhatsAppUrl = (
  phone: string,
  productId: number,
  productTitle: string,
  formData: any // Using any for local form data
): string => {
  // Generate a placeholder slug for the URL based on title and ID
  const productSlug = `${slugify(productTitle)}-${productId}`;
  const productLink = `https://www.mhebazar.in/product/${productSlug}`;

  // NOTE: formData.notes will contain the "WhatsApp: " prefix if confirmed.
  const messageTemplate = `
Hello! 👋
I'm contacting you through the MHE Bazar website.
I'd like to request a RENTAL for the following product:

Name: ${formData.fullName}
Email: ${formData.email}
Mobile No.: ${formData.phone}
Location: ${formData.address}
Product Name: ${productTitle}
Product Link: ${productLink}
Rental Dates: ${formData.startDate} to ${formData.endDate}
Notes: ${formData.notes || "No additional notes provided."}

Please share the best rental quote and availability details.
Thank you!
    `.trim();

  const encodedMessage = encodeURIComponent(messageTemplate);
  // Use the vendor's phone number as the recipient
  return `https://api.whatsapp.com/send?phone=${phone}&text=${encodedMessage}`;
};

export default function RentalForm({
  productId,
  productDetails,
  onClose,
}: RentalFormProps): JSX.Element {
  const { user } = useUser();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false); // NEW STATE for custom popup
  const [vendorPhone, setVendorPhone] = useState<string | null>(null); // NEW STATE to hold vendor phone temporarily

  const [contactInfo, setContactInfo] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
  });

  // selected country dial code, e.g. "+1"
  const [selectedDialCode, setSelectedDialCode] = useState<string>("");

  const today = new Date().toISOString().split("T")[0];

  // Prefill contact info with user data if available
  useEffect(() => {
    if (user) {
      setContactInfo({
        fullName: user.full_name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: (user as any).address || "", // Assuming address is directly on user or via a nested property
      });
    }

    const userCca2 =
      (user as any)?.country || (user as any)?.country_code || "";
    const foundByUser = countrycode.find((c: any) => c.cca2 === userCca2);
    const foundIN = countrycode.find((c: any) => c.cca2 === "IN");
    const defaultCountry = foundByUser || foundIN || countrycode[0];
    const getDialFromCountry = (c: any) => {
      if (!c || !c.idd) return "+";
      const root = c.idd.root || "";
      const suffix = Array.isArray(c.idd.suffixes)
        ? c.idd.suffixes[0] ?? ""
        : "";
      return `${root}${suffix}`.replace(/\s+/g, "");
    };
    setSelectedDialCode(getDialFromCountry(defaultCountry));
  }, [user]);

  const handleContactChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setContactInfo((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // New function for submission and redirection logic
  const submitRentalAndRedirect = async (shouldRedirectToWhatsApp: boolean) => {
    try {
      setIsSubmitting(true);

      // Build full phone number
      const localNumber = contactInfo.phone
        .replace(/[\s\-()]+/g, "")
        .replace(/^0+/, "");
      const dial = selectedDialCode || "";
      const normalizedDial = dial.startsWith("+") ? dial : `+${dial}`;
      const fullPhone = `${normalizedDial}${localNumber}`;

      let finalNotes = notes;

      // Append "WhatsApp" prefix if confirmed
      if (shouldRedirectToWhatsApp) {
        finalNotes = `WhatsApp: ${finalNotes}`;
      }

      const rentalPayload: Record<string, any> = {
        product: productId,
        start_date: startDate,
        end_date: endDate,
        notes: finalNotes, // Use the potentially updated notes (includes 'WhatsApp' if confirmed)
        full_name: contactInfo.fullName,
        email: contactInfo.email,
        phone: fullPhone,
        address: contactInfo.address,
      };

      // 1. Submit Rental Request
      await api.post("/rentals/", rentalPayload);

      toast.success(
        "Rental request submitted successfully! We’ll get back to you soon."
      );

      // 2. Conditional Redirect
      if (shouldRedirectToWhatsApp && vendorPhone) {
        const whatsappUrl = generateWhatsAppUrl(
          vendorPhone,
          productId,
          productDetails.title,
          {
            ...contactInfo,
            phone: fullPhone,
            startDate,
            endDate,
            notes: finalNotes,
          } // Pass the notes with 'WhatsApp:' prefix
        );
        // Redirect to WhatsApp
        window.location.href = whatsappUrl;
        return;
      }

      // 3. Fallback: Reset and Close Form
      setContactInfo({
        fullName: "",
        email: "",
        phone: "",
        address: "",
      });
      setStartDate("");
      setEndDate("");
      setNotes("");

      onClose?.();
    } catch (error: unknown) {
      console.error("Error submitting rental form:", error);
      if (axios.isAxiosError(error) && error.response) {
        const errorData = error.response.data;
        let errorMessages = "Unknown error occurred.";
        if (typeof errorData === "object" && errorData !== null) {
          errorMessages =
            Object.values(errorData).flat().join(". ") ||
            error.response.statusText;
        } else if (typeof errorData === "string") {
          errorMessages = errorData;
        } else {
          errorMessages = error.response.statusText || "Unknown error";
        }
        toast.error(`Failed to submit rental request: ${errorMessages}`);
      } else {
        toast.error("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
      setShowConfirmation(false); // Hide the confirmation popup
    }
  };

  // UPDATED handleSubmit: Shows Confirmation Modal first
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!startDate || !endDate) {
      toast.error("Please select both start and end dates.");
      return;
    }

    if (new Date(startDate) >= new Date(endDate)) {
      toast.error("End date must be after start date.");
      return;
    }

    if (
      !contactInfo.fullName ||
      !contactInfo.email ||
      !contactInfo.phone ||
      !contactInfo.address
    ) {
      toast.error(
        "Please fill in your name, email, phone number, and address."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // Fetch Vendor Phone (required for WhatsApp)
      const vendorPhoneResponse = await api.get<{ company_phone: string }>(
        `/product/${productId}/vendor-phone/`
      );
      const phone = vendorPhoneResponse.data?.company_phone || null;
      setVendorPhone(phone); // Store it

      setIsSubmitting(false); // Stop loader after fetch

      if (phone) {
        // Show custom confirmation UI if vendor phone is available
        setShowConfirmation(true);
      } else {
        // If vendor phone is NOT available, submit directly without asking
        await submitRentalAndRedirect(false);
      }
    } catch (err) {
      // If fetching phone fails, submit the form directly and warn/log
      console.warn(
        "Failed to fetch vendor phone, submitting without WhatsApp prompt:",
        err
      );
      setIsSubmitting(false);
      await submitRentalAndRedirect(false);
    }
  };

  // Custom Confirmation Dialog Component (Responsive and Enhanced)
  const ConfirmationDialog = () => (
    // Backdrop: Increased opacity for better focus
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      {/* Card: Constrained max width and rounded corners for premium look */}
      <Card className="w-full max-w-sm md:max-w-md p-6 bg-white shadow-2xl rounded-xl border-none">
        <div className="flex flex-col items-center text-center space-y-4">
          <MessageSquare className="h-10 w-10 text-[#5ca131]" />
          <h4 className="text-xl font-bold text-gray-900">
            Contact Vendor Directly?
          </h4>
          <p className="text-sm text-gray-700">
            Your request has been saved. For an{" "}
            <span className="font-bold">immediate response</span> and faster
            discussion, would you like to{" "}
            <span className="font-bold">
              message the vendor directly on WhatsApp
            </span>
            ?
          </p>
        </div>

        {/* Buttons: Stacked vertically on mobile, reversed and aligned right on desktop */}
        <div className="mt-6 flex flex-col sm:flex-row-reverse gap-3 justify-center">
          <Button
            onClick={() => submitRentalAndRedirect(true)}
            disabled={isSubmitting}
            // Full width on mobile, standard height, green color
            className="w-full sm:w-auto h-10 bg-[#5ca131] hover:bg-[#459426] text-white font-medium"
          >
            Yes, WhatsApp Now
          </Button>
          <Button
            variant="outline"
            onClick={() => submitRentalAndRedirect(false)}
            disabled={isSubmitting}
            // Full width on mobile, better outline look
            className="w-full sm:w-auto h-10 border-gray-300 text-gray-700 hover:bg-gray-100 font-medium"
          >
            Just Submit Form
          </Button>
        </div>
      </Card>
    </div>
  );

  return (
    <div className="max-h-[90vh] overflow-auto custom-scrollbar">
      {/* Conditionally render the custom confirmation dialog */}
      {showConfirmation && <ConfirmationDialog />}

      <div className="w-full mx-auto">
        <Card className="border-none shadow-none">
          <CardContent className=" bg-white">
            {/* Product Information - kept for context */}
            <div className="flex flex-col-reverse items-center justify-center gap-6 lg:gap-8 mb-8">
              <div className="w-full lg:w-1/2 xl:w-2/5">
                <div className="relative w-full h-48 sm:h-64 lg:h-72 rounded-lg shadow-sm overflow-hidden">
                  <Image
                    src={productDetails.image || "/no-product.jpg"}
                    alt={productDetails.title}
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
              <div className="flex-1 space-y-3">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 leading-tight">
                  {productDetails.title}
                </h2>
                {/* ... */}
              </div>
            </div>

            {/* Rental Form */}
            <div className="space-y-6">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 text-center">
                Request This Item
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Contact Information Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Input
                      name="fullName"
                      value={contactInfo.fullName}
                      onChange={handleContactChange}
                      required
                      className="h-12 text-sm"
                      placeholder="Full name *"
                    />
                  </div>
                  <div>
                    <Input
                      name="email"
                      type="email"
                      value={contactInfo.email}
                      onChange={handleContactChange}
                      required
                      className="h-12 text-sm"
                      placeholder="Email *"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    {/* Country code selector is here */}
                    {/* NOTE: If you need to revert the phone input to a single field (without country code selector), you'll need to adjust this section. */}
                    <Input
                      name="phone"
                      type="tel"
                      value={contactInfo.phone}
                      onChange={handleContactChange}
                      required
                      className="h-12 text-sm"
                      placeholder="Phone *"
                    />
                  </div>
                  <div>
                    <Input
                      name="address"
                      type="text"
                      value={contactInfo.address}
                      onChange={handleContactChange}
                      required
                      className="h-12 text-sm"
                      placeholder="Address *"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="start-date"
                      className="block text-xs font-medium text-gray-600 mb-1"
                    >
                      Start Date *
                    </label>
                    <Input
                      id="start-date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                      min={today}
                      className="h-12 text-sm"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="end-date"
                      className="block text-xs font-medium text-gray-600 mb-1"
                    >
                      End Date *
                    </label>
                    <Input
                      id="end-date"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      required
                      min={startDate || today}
                      disabled={!startDate}
                      className="h-12 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="notes"
                    className="block text-xs font-medium text-gray-600 mb-1"
                  >
                    Notes
                  </label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="min-h-[80px] text-sm resize-none"
                    placeholder="Message (optional)"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting || showConfirmation}
                  className="w-full h-12 bg-[#5ca131] hover:bg-[#459426] disabled:bg-gray-400 text-white font-bold text-sm transition-colors duration-200"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading Contact...
                    </div>
                  ) : (
                    "Submit Rental Request"
                  )}
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
