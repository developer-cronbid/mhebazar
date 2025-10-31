"use client";
import api from "@/lib/api";
import { useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function NewsletterSubscribeForm() {
    const [email, setEmail] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
    const handleNewsletterSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!email) {
        toast.error("Please enter your email address.");
        return;
      }
  
      setIsSubmitting(true);
      try {
        const response = await api.post('/newsletter-subscriptions/', { email });
        // console.log('Newsletter subscription successful:', response.data);
        toast.success("Thank you for subscribing to our newsletter!");
        setEmail('');
      } catch (error: any) {
        // console.error('Error subscribing to newsletter:', error);
        const errorMessage = error.response?.data?.detail || error.response?.data?.email?.[0] || "Failed to subscribe. Please try again.";
        toast.error(errorMessage);
      } finally {
        setIsSubmitting(false);
      }
    };
  
    return (
      <div className="bg-gradient-to-r from-blue-700 to-blue-500 text-white px-4 py-8 md:py-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:justify-between md:items-center gap-6">
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
              Subscribe & Get{" "}
              <span className="text-yellow-400">10% Discount</span>
            </h2>
            <p className="text-base sm:text-lg">
              Get E-mail updates about our latest shop and special offers.
            </p>
          </div>
          <motion.form
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            onSubmit={handleNewsletterSubmit}
            className="flex flex-col sm:flex-row items-center gap-3 md:gap-0 md:items-stretch justify-center md:justify-end w-full md:w-auto"
          >
            <input
              type="email"
              placeholder="Enter email address"
              className="px-4 py-2 rounded md:rounded-l md:rounded-r-none w-full sm:w-72 text-black bg-white outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button
              type="submit"
              className="bg-yellow-400 text-black px-6 py-2 rounded md:rounded-r md:rounded-l-none font-semibold transition hover:bg-yellow-300 w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Subscribing...' : 'Submit'}
            </button>
          </motion.form>
        </div>
      </div>
    );
  }
