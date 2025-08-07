'use client';

import { Check, X } from 'lucide-react';

const plans = ['Gold', 'Silver', 'Bronze', 'Platinum', 'Diamond'];

const services = [
  { name: 'Service #1', values: [true, true, true, true, true] },
  { name: 'Service #2', values: [true, true, false, false, false] },
  { name: 'Service #3', values: [true, true, true, true, true] },
  { name: 'Service #4', values: [true, false, false, false, false] },
  { name: 'Service #3', values: [true, true, true, true, true] },
  { name: 'Service #2', values: [true, true, false, false, false] },
];

export default function SubscriptionPlans() {
  return (
    <section className="w-full bg-[#f8f9fb] py-10 px-5 md:px-8">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-black mb-6">Subscription Plans</h2>

        <div className="overflow-x-auto border-gray-200 bg-white">
          <table className="min-w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-white border-b">
                <th className="py-4 px-6 font-semibold text-gray-800 min-w-[150px]">
                  Service Details
                </th>
                {plans.map((plan) => (
                  <th
                    key={plan}
                    className="py-4 px-6 font-semibold text-gray-800 text-center min-w-[100px]"
                  >
                    {plan}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {services.map((service, index) => (
                <tr
                  key={service.name + index}
                  className={`${index % 2 === 0 ? 'bg-[#f9fafb]' : 'bg-white'} border-b`}
                >
                  <td className="py-3 px-6 text-gray-700 font-medium">{service.name}</td>
                  {service.values.map((value, idx) => (
                    <td key={idx} className="py-3 px-6 text-center">
                      {value ? (
                        <Check className="mx-auto text-green-600 w-5 h-5" />
                      ) : (
                        <X className="mx-auto text-red-500 w-5 h-5" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
