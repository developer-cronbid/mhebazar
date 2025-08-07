import Breadcrumb from "@/components/elements/Breadcrumb";
import HomeBanner from "@/components/layout/HomeBanner";
import SubscriptionPlans from "@/components/elements/SubscriptionPlans";
import VendorRegistrationCard from "@/components/elements/VendorRegistrationCard";

const SubscriptionPlanPage = () => {
  return (
    <>
      {/* Breadcrumb */}
      <div className="w-full px-4 sm:px-8 pt-6">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Subscription Plan", href: "/pricing" },
          ]}
        />
      </div>

      {/* Page Title */}
      <section className="bg-white p-6 md:p-8 w-full">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Subscription Plan
        </h1>
      </section>

      {/* HomeBanner Section */}
      <div className="w-full ">
        <HomeBanner />
      </div>

      {/* Subscription Plan Paragraph */}
      <section className="mt-12 bg-white p-6 md:p-8  max-w-7xl mx-auto">
        <p className="text-base md:text-lg text-gray-700 leading-relaxed mb-3">
          Our subscription plans are designed to provide you with the best value
          for your material handling needs. Whether you are a small business or
          a large enterprise, we have a plan that fits your requirements.
        </p>
        <p className="text-base md:text-lg text-gray-700 leading-relaxed mb-3">
          With our subscription plans, you can enjoy exclusive benefits such as
          <span className="font-semibold text-[#56B13E]"> priority support</span>,{" "}
          <span className="font-semibold text-[#56B13E]">access to premium features</span>, and
          <span className="font-semibold text-[#56B13E]"> regular updates</span> to
          ensure you always have the latest tools at your disposal.
        </p>
        <p className="text-base md:text-lg text-gray-700 leading-relaxed">
          Choose from our flexible subscription options to get the most out of
          your experience with <span className="font-semibold text-[#56B13E]">MHE Bazar</span>. Our plans are designed to grow with
          your business, providing you with the resources you need to succeed.
        </p>
      </section>

      {/* Subscription Plan Cards */}
     
        <SubscriptionPlans />
   

      {/* Vendor Registration Card Section */}
      <div className="w-full max-w-7xl mx-auto px-2 sm:px-6 mt-12 mb-12">
        <VendorRegistrationCard />
      </div>
    </>
  );
};

export default SubscriptionPlanPage;