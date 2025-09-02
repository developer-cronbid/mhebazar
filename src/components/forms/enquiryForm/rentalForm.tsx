"use client"

import { useState, FormEvent, JSX, useEffect, ChangeEvent } from "react"
import axios from "axios"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { toast } from "sonner"
import api from "@/lib/api"
import { useUser } from "@/context/UserContext"
import { Loader2 } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import DOMPurify from 'dompurify'
import countrycode from '@/data/countrycode_cleaned.json'

interface RentalFormProps {
  productId: number
  productDetails: {
    image: string
    title: string
    description: string
    price: string | number
    stock_quantity?: number
  }
  onClose?: () => void
}

export default function RentalForm({ productId, productDetails, onClose }: RentalFormProps): JSX.Element {
  const { user } = useUser()
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [contactInfo, setContactInfo] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
  });

  // selected country dial code, e.g. "+1"
  const [selectedDialCode, setSelectedDialCode] = useState<string>('');

  const today = new Date().toISOString().split("T")[0]

  // Prefill contact info with user data if available
  useEffect(() => {
    if (user) {
      setContactInfo({
        fullName: user.full_name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address?.address || '',
      });
    }

    // set default dial code: prefer user's country (user.country or user.country_code),
    // fall back to US if present, else first in list
    const userCca2 = (user as any)?.country || (user as any)?.country_code || '';
    const foundByUser = countrycode.find((c: any) => c.cca2 === userCca2);
    const foundUS = countrycode.find((c: any) => c.cca2 === 'IN');
    const defaultCountry = foundByUser || foundUS || countrycode[0];
    const getDialFromCountry = (c: any) => {
      if (!c || !c.idd) return '+';
      const root = c.idd.root || '';
      const suffix = Array.isArray(c.idd.suffixes) ? (c.idd.suffixes[0] ?? '') : '';
      return `${root}${suffix}`.replace(/\s+/g, '');
    };
    setSelectedDialCode(getDialFromCountry(defaultCountry));
  }, [user]);

  const handleContactChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setContactInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast.error("You must be logged in to submit a rental request.")
      return
    }

    if (!startDate || !endDate) {
      toast.error("Please select both start and end dates.")
      return
    }

    if (new Date(startDate) >= new Date(endDate)) {
      toast.error("End date must be after start date.")
      return
    }

    // Validate contact info
    if (!contactInfo.fullName || !contactInfo.email || !contactInfo.phone) {
      toast.error("Please fill in your name, email, and phone number.");
      return;
    }


    try {
      setIsSubmitting(true)

      // Build full phone by concatenating selected dial code and local number.
      // Remove spaces, dashes, parentheses and leading zeros from the local part
      const localNumber = contactInfo.phone.replace(/[\s\-()]+/g, '').replace(/^0+/, '');
      const dial = selectedDialCode || '';
      const normalizedDial = dial.startsWith('+') ? dial : `+${dial}`;
      const fullPhone = `${normalizedDial}${localNumber}`;

      const rentalPayload: Record<string, any> = {
        product: productId,
        start_date: startDate,
        end_date: endDate,
        notes: notes,
        full_name: contactInfo.fullName,
        email: contactInfo.email,
        phone: fullPhone,
        address: contactInfo.address,
      }

      await api.post("/rentals/", rentalPayload)

      toast.success("Rental request submitted successfully! We’ll get back to you soon.")

      // Reset form fields
      setContactInfo({
        fullName: '',
        email: '',
        phone: '',
        address: '',
      });
      setStartDate("")
      setEndDate("")
      setNotes("")

      // Close modal
      onClose?.()
    } catch (error: unknown) {
      console.error("Error submitting rental form:", error)
      if (axios.isAxiosError(error) && error.response) {
        const errorMessages = Object.values(error.response.data).flat().join(". ")
        toast.error(`Failed to submit rental request: ${errorMessages || error.response.statusText || "Unknown error"}`)
      } else {
        toast.error("An unexpected error occurred. Please try again.")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-h-[90vh] overflow-auto custom-scrollbar">
      <div className="w-full mx-auto">
        <Card className="border-none shadow-none">
          <CardContent className=" bg-white">
            {/* Product Information */}
            <div className="flex flex-col-reverse items-center justify-center gap-6 lg:gap-8 mb-8">
              <div className="w-full lg:w-1/2 xl:w-2/5">
                <div className="relative w-full h-48 sm:h-64 lg:h-72 rounded-lg shadow-sm overflow-hidden">
                  <Image
                    src={productDetails.image || "/no-product.png"}
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
                {/* <div className="space-y-2 text-sm sm:text-base text-gray-600">
                  <p>
                    <span className="font-medium">In Stock:</span> {productDetails.stock_quantity ?? "N/A"}
                  </p>
                  {productDetails.price !== "0.00" && (
                    <p className="text-lg font-semibold text-green-600">
                      ₹
                      {typeof productDetails.price === "number"
                        ? productDetails.price.toLocaleString("en-IN")
                        : productDetails.price}
                      <span className="text-sm font-normal text-gray-500"> / day</span>
                    </p>
                  )}
                </div> */}
              </div>
            </div>

            {/* Product Description */}
            {/* <div className="mb-8 prose prose-sm sm:prose-base max-w-none text-gray-600 leading-relaxed">
              <div
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(
                    productDetails.description || "No description available."
                  )
                }}
              />
            </div> */}

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
                      className="h-12 text-sm"
                      placeholder="Address (optional)"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="start-date" className="block text-xs font-medium text-gray-600 mb-1">
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
                    <label htmlFor="end-date" className="block text-xs font-medium text-gray-600 mb-1">
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
                  <label htmlFor="notes" className="block text-xs font-medium text-gray-600 mb-1">
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
                  disabled={isSubmitting}
                  className="w-full h-12 bg-[#5ca131] hover:bg-[#459426] disabled:bg-gray-400 text-white font-bold text-sm transition-colors duration-200"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting...
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
  )
}
