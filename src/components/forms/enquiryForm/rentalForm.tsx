// components/RentalForm.tsx
"use client"

import { useState, FormEvent, JSX } from "react"
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
  // --- Original state and functionality are preserved ---
  const { user } = useUser()
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false) // State for inline success message
  const today = new Date().toISOString().split("T")[0]

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    if (!user) {
      toast.error("You must be logged in to submit a rental request.")
      setIsSubmitting(false)
      return
    }

    if (!startDate || !endDate) {
      toast.error("Please select both start and end dates for your rental.")
      setIsSubmitting(false)
      return
    }

    if (new Date(startDate) >= new Date(endDate)) {
      toast.error("End date must be after start date.")
      setIsSubmitting(false)
      return
    }

    try {
      const response = await api.post("/rentals/", {
        product: productId,
        start_date: startDate,
        end_date: endDate,
        notes,
      })

      if (response.status === 201) {
        toast.success("Rental request submitted successfully! We will get back to you soon.")
        setSuccess(true) // Trigger inline success message
        setStartDate("")
        setEndDate("")
        setNotes("")
        // Reset success message and close modal after a delay
        setTimeout(() => {
          setSuccess(false)
          onClose?.()
        }, 3000)
      }
    } catch (error: unknown) {
      console.error("Error submitting rental form:", error)
      if (axios.isAxiosError(error) && error.response) {
        const errorMessages = Object.values(error.response.data).flat().join(". ")
        toast.error(`Failed to submit rental request: ${errorMessages || error.response.statusText || 'Unknown error'}`)
      } else {
        toast.error("An unexpected error occurred. Please try again.")
      }
    } finally {
      // Delay setting isSubmitting to false to allow success message to show
      if (!(success)) {
        setIsSubmitting(false);
      }
    }
  }

  // --- New JSX using the design from QuoteForm ---
  return (
    <div className="max-h-[90vh] overflow-auto custom-scrollbar">
      <div className="w-full mx-auto">
        <Card className="border-none shadow-none">
          <CardContent className="p-4 sm:p-6 lg:p-8 bg-white">
            {/* Success Message */}
            {success && (
              <div className="mb-6 p-4 bg-[#5ca131]/10 border-2 border-[#5ca131] rounded-lg">
                <p className="text-[#5ca131] font-semibold">
                  ✓ Request submitted successfully! We&apos;ll get back to you soon.
                </p>
              </div>
            )}

            {/* Product Information */}
            <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 mb-8">
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

                <div className="space-y-2 text-sm sm:text-base text-gray-600">
                  <p>
                    <span className="font-medium">In Stock:</span> {productDetails.stock_quantity ?? 'N/A'}
                  </p>
                  {productDetails.price !== "0.00" && (
                    <p className="text-lg font-semibold text-green-600">
                      ₹{typeof productDetails.price === "number" ? productDetails.price.toLocaleString("en-IN") : productDetails.price}
                      <span className="text-sm font-normal text-gray-500"> / day</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Product Description */}
            <div className="mb-8 prose prose-sm sm:prose-base max-w-none text-gray-600 leading-relaxed">
              <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(productDetails.description || "No description available.") }} />
            </div>

            {/* Quote Form - using original fields and functionality */}
            <div className="space-y-6">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 text-center">
                Request This Item
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Date Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="start-date" className="block text-xs font-medium text-gray-600 mb-1">Start Date *</label>
                    <Input
                      id="start-date"
                      name="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                      min={today}
                      className="h-12 text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="end-date" className="block text-xs font-medium text-gray-600 mb-1">End Date *</label>
                    <Input
                      id="end-date"
                      name="endDate"
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

                {/* Message */}
                <div>
                  <label htmlFor="notes" className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="min-h-[80px] text-sm resize-none"
                    placeholder="Message (optional)"
                  />
                </div>

                {/* Submit Button */}
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
                    'Submit Rental Request'
                  )}
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};