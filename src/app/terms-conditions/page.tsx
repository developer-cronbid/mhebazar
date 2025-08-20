// app/terms-conditions/page.tsx
import React from 'react';

const TermsAndConditionsPage = () => {
  return (
    <div className="bg-white text-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Main Heading */}
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 text-center mb-8 md:mb-10">
          Terms & Conditions
        </h1>

        {/* Introduction */}
        <p className="text-base md:text-lg text-gray-600 leading-relaxed text-center mb-10 md:mb-12">
          These Terms & Conditions represent a legally binding agreement between you (the user) and <strong>MHE Bazar</strong>, governing the use of our website and services.
        </p>

        <div className="space-y-8 md:space-y-10">
          {/* Section: Acceptance of Terms */}
          <section>
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-3">
              1. Acceptance of Terms
            </h2>
            <p className="text-base text-gray-700 leading-relaxed">
              By accessing or using this website, you agree to be bound by these Terms & Conditions. If you do not agree, please refrain from using the site.
            </p>
          </section>

          {/* Section: Use of the Website */}
          <section>
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-3">
              2. Use of the Website
            </h2>
            <p className="text-base text-gray-700 leading-relaxed">
              The website is intended for lawful business and personal use related to material handling products and services.
            </p>
            <p className="text-base text-gray-700 leading-relaxed mt-2">
              Users agree not to misuse the platform through hacking, false information, or any illegal activity.
            </p>
          </section>

          {/* Section: Intellectual Property */}
          <section>
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-3">
              3. Intellectual Property
            </h2>
            <p className="text-base text-gray-700 leading-relaxed">
              All content, including text, images, product data, and branding, is the property of MHE Bazar or its partners.
            </p>
            <p className="text-base text-gray-700 leading-relaxed mt-2">
              Unauthorized use, reproduction, or distribution is strictly prohibited.
            </p>
          </section>

          {/* Section: Limitation of Liability */}
          <section>
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-3">
              4. Limitation of Liability
            </h2>
            <p className="text-base text-gray-700 leading-relaxed">
              MHE Bazar is not liable for any direct, indirect, or incidental damages arising from the use of the website, including errors, omissions, delays, or downtime.
            </p>
            <p className="text-base text-gray-700 leading-relaxed mt-2">
              Product details and availability are subject to change without prior notice.
            </p>
          </section>

          {/* Section: Warranty Disclaimer */}
          <section>
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-3">
              5. Warranty Disclaimer
            </h2>
            <p className="text-base text-gray-700 leading-relaxed">
              Product images and technical specs are for reference only.
            </p>
            <p className="text-base text-gray-700 leading-relaxed mt-2">
              It should vary brands to brands.
            </p>
            <p className="text-base text-gray-700 leading-relaxed mt-2">
              No guarantees are made beyond those expressly stated in individual product agreements or contracts.
            </p>
          </section>

          {/* Section: Jurisdiction & Governing Law */}
          <section>
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-3">
              6. Jurisdiction & Governing Law
            </h2>
            <p className="text-base text-gray-700 leading-relaxed">
              These terms are governed by and construed in accordance with the laws of <strong>India</strong>.
            </p>
            <p className="text-base text-gray-700 leading-relaxed mt-2">
              Any disputes shall be resolved under the jurisdiction of <strong>Chennai courts</strong>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditionsPage;