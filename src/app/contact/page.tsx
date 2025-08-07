/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, FormEvent, useEffect } from "react";
import { Phone, Mail, CheckCircle, RefreshCcw } from "lucide-react";
import Breadcrumb from "@/components/elements/Breadcrumb";
import { Input } from "@/components/ui/input"; // Assuming shadcn/ui Input
import { Textarea } from "@/components/ui/textarea"; // Assuming shadcn/ui Textarea
import { Button } from "@/components/ui/button"; // Assuming shadcn/ui Button
import api from "@/lib/api"; // Your existing API instance
import { toast } from "sonner"; // For notifications

const offices = [
  {
    title: "Registered Office:",
    address: `E-228, Goyla Vihar, Block D, Lajpat Nagar I, Lajpat Nagar, New Delhi, Delhi 110024`,
    person: "Mr. Manik Thapar",
    phone: "+91 928 909 4445",
    email: "sales.1@mhebazar.com",
    mapUrl:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3502.184168869489!2d77.2430170754067!3d28.62433268496406!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390ce3e9b7e8e0e1%3A0x6e3b1e1c9e4b9a7e!2sMHE%20Bazar!5e0!3m2!1sen!2sin!4v1688123456789!5m2!1sen!2sin",
  },
  {
    title: "Corporate Office:",
    address: `Survey no.76/1A, Poonamallee High Road, Velappanchavadi, Chennai-600077`,
    person: "Mr. Ulhas Makeshwar",
    phone: "+91 984 008 8428",
    email: "sales.2@mhebazar.com",
    mapUrl:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3916.3333333333335!2d80.12345678901234!3d13.09876543210987!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a5267e8e0e1e0e1%3A0x6e3b1e1c9e4b9a7e!2sCorporate%20Office!5e0!3m2!1sen!2sin!4v1688123456790!5m2!1sen!2sin",
  },
  {
    title: "Branch Office:",
    address: `Plot No A-61, Next to Spree Hotel, H Block, MIDC, MIDC, Pimpri Colony, Pimpri-Chinchwad, Pune Maharashtra 411018`,
    person: "Mr. Sumedh Ramteke",
    phone: "+91 730 5950 939",
    email: "sumedh.ramteke@mhebazar.com",
    mapUrl:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3782.3333333333335!2d73.81234567890123!3d18.62345678901234!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bc2b7e8e0e1e0e1%3A0x6e3b1e1c9e4b9a7e!2sBranch%20Office!5e0!3m2!1sen!2sin!4v1688123456791!5m2!1sen!2sin",
  },
];

export default function ContactPage() {
  const [selectedOfficeIndex, setSelectedOfficeIndex] = useState(0);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [captchaText, setCaptchaText] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");
  const [honeypot, setHoneypot] = useState(""); // Honeypot field
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Function to generate a random CAPTCHA string
  const generateCaptcha = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaText(result);
    setCaptchaInput(""); // Clear captcha input on refresh
  };

  useEffect(() => {
    generateCaptcha(); // Generate CAPTCHA on component mount
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (captchaInput.toUpperCase() !== captchaText) {
      toast.error("CAPTCHA verification failed. Please try again.");
      generateCaptcha(); // Regenerate CAPTCHA on failure
      setIsSubmitting(false);
      return;
    }

    if (honeypot) { // If honeypot field is filled, it's likely a bot
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
        captcha: captchaText, // Send the generated CAPTCHA text
        captcha_answer: captchaInput.toUpperCase(), // Send the user's input for verification
        honeypot: honeypot, // Send honeypot value
      });

      if (response.status === 201) {
        toast.success("Message sent successfully! We will get back to you soon.");
        // Clear form fields
        setFirstName("");
        setLastName("");
        setEmail("");
        setCompanyName("");
        setLocation("");
        setPhone("");
        setMessage("");
        setCaptchaInput("");
        generateCaptcha(); // Generate new CAPTCHA
      }
    } catch (error: any) {
      console.error("Error submitting contact form:", error);
      if (error.response && error.response.data) {
        // Display specific backend errors
        const errors = error.response.data;
        if (errors.captcha || errors.captcha_answer) {
          toast.error("CAPTCHA verification failed. Please try again.");
          generateCaptcha();
        } else if (errors.honeypot) {
          toast.error("Bot detected. Submission blocked.");
        } else {
          // General error message for other validation errors
          const errorMessages = Object.values(errors).flat().join(". ");
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
    <>
      {/* Breadcrumb */}
      <div className="w-full px-4 sm:px-8 pt-6">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Contact", href: "/contact" },
          ]}
        />
      </div>

      <section className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
        <h2 className="text-xl sm:text-2xl font-semibold mb-1 text-gray-900">Contact us</h2>
        <p className="text-gray-700 mb-6">
          We love to hear from you! Please let us know if you have any questions
          or concerns and we will get back to you soon. Thank you!
        </p>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left - Office Cards */}
          <div className="flex-1 flex flex-col gap-4">
            {offices.map((office, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setSelectedOfficeIndex(index)}
                className={`text-left bg-white border rounded-lg p-4 shadow-sm transition-all duration-300 ease-in-out ${
                  selectedOfficeIndex === index
                    ? "border-green-600 ring-2 ring-green-200 scale-[1.01]"
                    : "border-gray-200 hover:shadow-md"
                }`}
                style={{ cursor: "pointer" }}>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-semibold text-sm text-gray-900">{office.title}</span>
                </div>
                <div className="text-gray-800 text-sm mb-1">
                  {office.address}
                </div>
                <div className="text-gray-800 text-sm font-semibold mb-2">
                  {office.person}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700 mb-1">
                  <Phone className="h-4 w-4 text-green-600" />
                  <span>{office.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Mail className="h-4 w-4 text-green-600" />
                  <span>{office.email}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Right - Contact Form */}
          <form
            className="flex-1 bg-white border border-gray-200 rounded-lg p-6 shadow-lg flex flex-col gap-4"
            onSubmit={handleSubmit}>
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
                <div className="flex-1 flex items-center bg-gray-100 border border-gray-300 rounded-md p-2 text-lg font-bold text-gray-700 justify-center select-none">
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
                tabIndex={-1} // Make it not focusable
                autoComplete="off" // Prevent browser autofill
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                className="hidden" // Hide it visually
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
        </div>
      </section>

      {/* Map Embed */}
      <div className="w-full h-[350px] mt-8">
        <iframe
          title={offices[selectedOfficeIndex].title + " Map"}
          src={offices[selectedOfficeIndex].mapUrl}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"></iframe>
      </div>
    </>
  );
}
