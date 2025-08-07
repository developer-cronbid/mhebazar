"use client";
import Breadcrumb from "@/components/elements/Breadcrumb";
import HomeBanner from "@/components/layout/HomeBanner";
import { useState } from 'react';
import { ChevronDown, ChevronUp, Wrench, Shield, Clock, Users, Settings, CheckCircle } from 'lucide-react';
import Link from "next/link";

const ServicesPage = () => {
  const [amcOpen, setAmcOpen] = useState(true);
  const [cmcOpen, setCmcOpen] = useState(false);

  return (
    <>
      {/* Breadcrumb */}
      <div className="w-full px-4 sm:px-8 ">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Services", href: "/services" },
          ]}
        />
      </div>

      {/* Page Title */}
      <section className="bg-white p-3 md:p-5 w-full">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Services
        </h1>
      </section>

      {/* HomeBanner Section */}
      <div className="w-full ">
        <HomeBanner />
      </div>

      <div className="w-full px-4 md:px-8 py-6 space-y-6">
        {/* AMC Services Accordion */}
        <div className="bg-white border border-gray-300 rounded-xl shadow-sm overflow-hidden transition-all duration-300">
          {/* Header */}
          <div
            className="flex items-center justify-between px-6 py-4 cursor-pointer select-none hover:bg-gray-50 transition-colors"
            onClick={() => setAmcOpen((prev) => !prev)}
          >
            <div className="flex items-center space-x-3">
              <Wrench className="h-6 w-6 text-[#5CA131]" />
              <h2 className="text-lg font-semibold text-gray-800">Annual Maintenance Contracts (AMC) Services</h2>
            </div>
            {amcOpen ? (
              <ChevronUp className="h-5 w-5 text-gray-600" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-600" />
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200" />

          {/* Collapsible Content */}
          <div
            className={`transition-all duration-500 ${
              amcOpen ? 'max-h-[2000px] opacity-100 py-6 px-6' : 'max-h-0 opacity-0 py-0 px-6'
            } overflow-hidden`}
          >
            <div className="space-y-6">
              <p className="text-gray-700 leading-relaxed">
                MHE Bazar is a leading provider of Annual Maintenance Contracts (AMC) services for material handling equipment. We are dedicated to ensuring that our clients' businesses run smoothly and efficiently by providing comprehensive maintenance services for their material handling equipment.
              </p>
              
              <p className="text-gray-700 leading-relaxed">
                Our AMC services are designed to provide preventive maintenance, repair, overhaul, and emergency repairs for material handling equipment. We offer regular inspections to identify any potential issues before they become costly problems. This proactive approach ensures that your equipment continues to operate smoothly and reliably, minimizing downtime and maximizing productivity.
              </p>

              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <CheckCircle className="h-5 w-5 text-[#5CA131] mr-2" />
                  Why choose MHE Bazar for your AMC services?
                </h3>
                
                <div className="grid md:grid-cols-2 gap-4 space-y-4 md:space-y-0">
                  <div className="flex items-start space-x-3">
                    <Users className="h-5 w-5 text-[#5CA131] mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-800">Experienced and skilled technicians</h4>
                      <p className="text-gray-600 text-sm">Our team of highly experienced and skilled technicians are trained to handle all types of material handling equipment, from forklifts to cranes. They are equipped with the latest tools and technologies to provide high-quality maintenance services.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <Settings className="h-5 w-5 text-[#5CA131] mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-800">Customized solutions</h4>
                      <p className="text-gray-600 text-sm">We understand that every business has unique needs and requirements. That's why we offer customized AMC solutions tailored to meet the specific needs of our clients.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <Shield className="h-5 w-5 text-[#5CA131] mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-800">Cost-effective</h4>
                      <p className="text-gray-600 text-sm">Our AMC services are designed to be cost-effective, providing long-term savings for our clients. By regularly maintaining your equipment, you can avoid costly repairs and replacements in the future.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-[#5CA131] mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-800">Reliable and efficient</h4>
                      <p className="text-gray-600 text-sm">We pride ourselves on providing reliable and efficient AMC services. Our team is dedicated to ensuring that your equipment is always in top condition, minimizing downtime and maximizing productivity.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 md:col-span-2">
                    <Clock className="h-5 w-5 text-[#5CA131] mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-800">Timely maintenance</h4>
                      <p className="text-gray-600 text-sm">We understand the importance of timely maintenance for material handling equipment. That's why we provide regular inspections and maintenance services to ensure that your equipment is always operating at its best.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-l-4 border-[#5CA131] pl-6 bg-green-50 py-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Other important information about our AMC services:</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-[#5CA131] mr-2">•</span>
                    We offer flexible AMC contracts, including monthly, quarterly, and yearly contracts, to meet the needs of our clients.
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#5CA131] mr-2">•</span>
                    Our AMC services cover a wide range of material handling equipment, including forklifts, cranes, pallet trucks, and more.
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#5CA131] mr-2">•</span>
                    Our team is available 24/7 to provide emergency repairs, minimizing downtime and ensuring that your business stays up and running.
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#5CA131] mr-2">•</span>
                    We use genuine spare parts and components to ensure the longevity and reliability of your equipment.
                  </li>
                </ul>
              </div>

              <div className="bg-[#5CA131] text-white rounded-lg p-6">
                <p className="text-center font-medium">
                  MHE Bazar is your one-stop shop for all your material handling equipment maintenance needs. Our comprehensive AMC services provide preventive maintenance, repair, overhaul, and emergency repairs for all types of material handling equipment. With our experienced technicians, customized solutions, cost-effective services, and reliable and efficient maintenance, you can trust us to keep your equipment running smoothly and reliably for years to come.
                </p>
              </div>

              <div className="text-center">
                <p className="text-gray-600 mb-4 italic">Invest in your equipment's future with our Annual and Comprehensive Maintenance Contract services.</p>
                <Link href="/contact">
  <button className="bg-[#5CA131] hover:bg-green-700 text-white text-sm px-6 py-3 rounded-md transition-colors">
    Contact us
  </button>
</Link>
              </div>
            </div>
          </div>
        </div>

        {/* CMC Services Accordion */}
        <div className="bg-white border border-gray-300 rounded-xl shadow-sm overflow-hidden transition-all duration-300">
          {/* Header */}
          <div
            className="flex items-center justify-between px-6 py-4 cursor-pointer select-none hover:bg-gray-50 transition-colors"
            onClick={() => setCmcOpen((prev) => !prev)}
          >
            <div className="flex items-center space-x-3">
              <Shield className="h-6 w-6 text-[#5CA131]" />
              <h2 className="text-lg font-semibold text-gray-800">Comprehensive Maintenance Contract (CMC) Services</h2>
            </div>
            {cmcOpen ? (
              <ChevronUp className="h-5 w-5 text-gray-600" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-600" />
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200" />

          {/* Collapsible Content */}
          <div
            className={`transition-all duration-500 ${
              cmcOpen ? 'max-h-[2000px] opacity-100 py-6 px-6' : 'max-h-0 opacity-0 py-0 px-6'
            } overflow-hidden`}
          >
            <div className="space-y-6">
              <p className="text-gray-700 leading-relaxed">
                MHE Bazar is proud to offer comprehensive maintenance contract (CMC) services for material handling equipment. Our team of experienced professionals has the expertise and knowledge to provide top-quality maintenance services for your equipment, ensuring that it operates at peak performance and remains safe and reliable.
              </p>

              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <Settings className="h-5 w-5 text-[#5CA131] mr-2" />
                  What do our CMC services include?
                </h3>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
                      <CheckCircle className="h-4 w-4 text-[#5CA131] mr-2" />
                      Preventive maintenance
                    </h4>
                    <p className="text-gray-600 text-sm">Our preventive maintenance services include regular inspections and maintenance checks to identify any potential issues before they become major problems. By catching these issues early, we can help you avoid costly downtime and repairs in the future.</p>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
                      <Wrench className="h-4 w-4 text-[#5CA131] mr-2" />
                      Repair and overhaul
                    </h4>
                    <p className="text-gray-600 text-sm">If your equipment does require repairs or an overhaul, our team is here to help. We have the skills and expertise to diagnose and fix any problems your equipment may be experiencing, getting it back up and running as quickly as possible.</p>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
                      <Settings className="h-4 w-4 text-[#5CA131] mr-2" />
                      Troubleshooting
                    </h4>
                    <p className="text-gray-600 text-sm">Our team is trained to identify and troubleshoot any issues with your equipment, whether it's a minor problem or a major malfunction. We use the latest diagnostic tools and techniques to quickly identify the root cause of the issue and provide an effective solution.</p>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
                      <Shield className="h-4 w-4 text-[#5CA131] mr-2" />
                      Parts replacement
                    </h4>
                    <p className="text-gray-600 text-sm">If your equipment requires replacement parts, we use only genuine parts to ensure that your equipment remains safe and reliable. We have access to a wide range of parts for all types of material handling equipment, ensuring that we can quickly and efficiently replace any faulty parts.</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <CheckCircle className="h-5 w-5 text-[#5CA131] mr-2" />
                  Why choose MHE Bazar for your CMC services?
                </h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-start space-x-3">
                    <Users className="h-5 w-5 text-[#5CA131] mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-800">Experienced professionals</h4>
                      <p className="text-gray-600 text-sm">Our team of experienced professionals has the knowledge and expertise to provide top-quality maintenance services for all types of material handling equipment.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <Settings className="h-5 w-5 text-[#5CA131] mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-800">Customized solutions</h4>
                      <p className="text-gray-600 text-sm">We understand that every business has unique needs and requirements. That's why we offer customized CMC solutions tailored to meet the specific needs of our clients.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <Shield className="h-5 w-5 text-[#5CA131] mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-800">Cost-effective</h4>
                      <p className="text-gray-600 text-sm">Our CMC services are designed to be cost-effective, providing long-term savings for our clients. By regularly maintaining your equipment, you can avoid costly repairs and replacements in the future.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-[#5CA131] mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-800">Reliable and efficient</h4>
                      <p className="text-gray-600 text-sm">We pride ourselves on providing reliable and efficient CMC services. Our team is dedicated to ensuring that your equipment is always in top condition, minimizing downtime and maximizing productivity.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-l-4 border-[#5CA131] pl-6 bg-green-50 py-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Other important information about our CMC services:</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-[#5CA131] mr-2">•</span>
                    We offer flexible CMC contracts, including monthly, quarterly, and yearly contracts, to meet the needs of our clients.
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#5CA131] mr-2">•</span>
                    Our CMC services cover a wide range of material handling equipment, including forklifts, cranes, pallet trucks, and more.
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#5CA131] mr-2">•</span>
                    Our team is available 24/7 to provide emergency repairs, minimizing downtime and ensuring that your business stays up and running.
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#5CA131] mr-2">•</span>
                    We use only genuine parts and components to ensure the longevity and reliability of your equipment.
                  </li>
                </ul>
              </div>

              <div className="bg-[#5CA131] text-white rounded-lg p-6">
                <p className="text-center font-medium">
                  MHE Bazar is your go-to provider for comprehensive maintenance contract (CMC) services for material handling equipment. Our experienced professionals offer customized solutions, cost-effective services, and reliable and efficient maintenance to keep your equipment running at peak performance. With our CMC services, you can trust us to keep your equipment safe and reliable for years to come.
                </p>
              </div>

              <div className="text-center">
                <Link href="/contact">
  <button className="bg-[#5CA131] hover:bg-green-700 text-white text-sm px-6 py-3 rounded-md transition-colors">
    Contact us
  </button>
</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ServicesPage;