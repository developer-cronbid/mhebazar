/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, FormEvent, useEffect } from "react";
import { RefreshCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { toast } from "sonner";

export default function ContactForm() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [captchaText, setCaptchaText] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const generateCaptcha = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaText(result.toUpperCase());
    setCaptchaInput("");
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setCompanyName("");
    setLocation("");
    setPhone("");
    setMessage("");
    setCaptchaInput("");
    setHoneypot("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (captchaInput.trim().toUpperCase() !== captchaText.trim().toUpperCase()) {
      toast.error("CAPTCHA verification failed. Please try again.");
      generateCaptcha();
      setIsSubmitting(false);
      return;
    }

    if (honeypot) {
      toast.error("Bot detected. Submission blocked.");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await api.post("/contact-forms/", {
        first_name: firstName,
        last_name: lastName,
        email: email,
        company_name: companyName,
        location: location,
        phone: phone,
        message: message,
        captcha: captchaText,
        captcha_answer: captchaInput.toUpperCase(),
        honeypot: honeypot,
      });

      if (response.status === 201) {
        toast.success("Message sent successfully! We will get back to you soon.");
        resetForm();
        generateCaptcha();
      }
    } catch (error: any) {
      console.error("Error submitting contact form:", error);
      if (error.response && error.response.data) {
        const errors = error.response.data;
        if (errors.captcha || errors.captcha_answer) {
          toast.error("CAPTCHA verification failed. Please try again.");
          generateCaptcha();
        } else if (errors.honeypot) {
          toast.error("Bot detected. Submission blocked.");
        } else {
          // Handle both array and string error messages
          const errorMessages = Object.values(errors)
            .map((msg) => Array.isArray(msg) ? msg.join(". ") : msg)
            .join(". ");
          toast.error(`Failed to send message: ${errorMessages}`);
        }
      } else {
        toast.error("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      className="flex-1 bg-white border border-gray-200 rounded-lg p-6 shadow-lg flex flex-col gap-4"
      onSubmit={handleSubmit}
      autoComplete="off"
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Send us a message</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          type="text"
          placeholder="First Name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
          className="rounded-md border border-gray-300 focus:ring-green-500 focus:border-green-500"
        />
        <Input
          type="text"
          placeholder="Last Name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          required
          className="rounded-md border border-gray-300 focus:ring-green-500 focus:border-green-500"
        />
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="col-span-1 sm:col-span-2 rounded-md border border-gray-300 focus:ring-green-500 focus:border-green-500"
        />
        <Input
          type="text"
          placeholder="Company Name (Optional)"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          className="rounded-md border border-gray-300 focus:ring-green-500 focus:border-green-500"
        />
        <Input
          type="text"
          placeholder="Location (Optional)"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="rounded-md border border-gray-300 focus:ring-green-500 focus:border-green-500"
        />
        <Input
          type="text"
          placeholder="Phone (Optional)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="rounded-md border border-gray-300 focus:ring-green-500 focus:border-green-500"
        />
        <Textarea
          placeholder="Your Message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          rows={4}
          className="col-span-1 sm:col-span-2 rounded-md border border-gray-300 focus:ring-green-500 focus:border-green-500"
        />

        {/* CAPTCHA */}
        <div className="col-span-1 sm:col-span-2 flex items-center gap-2">
          <div
            className="flex-1 flex items-center bg-gray-100 border border-gray-300 rounded-md p-2 text-lg font-bold text-gray-700 justify-center select-none"
            aria-label={`CAPTCHA code: ${captchaText}`}
          >
            {captchaText}
          </div>
          <Button
            type="button"
            onClick={generateCaptcha}
            variant="outline"
            size="icon"
            className="h-10 w-10 text-gray-600 hover:bg-gray-100"
            aria-label="Refresh CAPTCHA"
          >
            <RefreshCcw className="h-5 w-5" />
          </Button>
          <Input
            type="text"
            placeholder="Enter CAPTCHA"
            value={captchaInput}
            onChange={(e) => setCaptchaInput(e.target.value)}
            required
            maxLength={6}
            className="flex-1 rounded-md border border-gray-300 focus:ring-green-500 focus:border-green-500 uppercase"
          />
        </div>

        {/* Honeypot field - hidden from users */}
        <input
          type="text"
          name="honeypot"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          className="hidden"
          aria-hidden="true"
        />
      </div>
      <Button
        type="submit"
        className="mt-2 bg-[#5CA131] hover:bg-green-700 text-white font-semibold text-base rounded-md py-3 px-6 transition-colors"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Sending Message..." : "Send Message"}
      </Button>
    </form>
  );
}
