'use client';

import { useState } from 'react';
import Image from 'next/image';

const data = [
  { country: 'United States', impressions: 6000 },
  { country: 'South Korea', impressions: 3257 },
  { country: 'Russia', impressions: 2456 },
  { country: 'United Kingdom', impressions: 1711 },
  { country: 'Vietnam', impressions: 1274 },
  { country: 'Brazil', impressions: 1019 },
  { country: 'Germany', impressions: 836 },
  { country: 'Indonesia', impressions: 754 },
  { country: 'Malaysia', impressions: 698 },
  { country: 'Canada', impressions: 646 },
  { country: 'Philippines', impressions: 630 },
];

export default function GlobalMapStats() {
  const [activeTab, setActiveTab] = useState<'impressions' | 'clicks'>('impressions');

  // Toggle this to false to disable tab switching functionality
  const isTabSwitchingEnabled = false;

  return (
    <section className="w-full bg-white py-10 px-4 md:px-8">
      <div className=" mx-auto">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">Global Map</h2>

        {/* Tabs */}
        <div className="flex flex-wrap gap-4 mb-6">
          <button
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'impressions'
                ? 'bg-[#5CA131] text-white'
                : 'bg-[#f3fbea] text-gray-800'
            }`}
            onClick={() => {
              if (isTabSwitchingEnabled) setActiveTab('impressions');
            }}
          >
            Worldwide Impressions
          </button>
          <button
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'clicks'
                ? 'bg-[#5CA131] text-white'
                : 'bg-[#f3fbea] text-gray-800'
            }`}
            onClick={() => {
              if (isTabSwitchingEnabled) setActiveTab('clicks');
            }}
          >
             Date - 1st July - 31st July 2024
          </button>
          
        </div>

        {/* Content */}
        <div className="flex flex-col lg:flex-row justify-between gap-6">
          {/* Map Image */}
          <div className="flex-1 flex items-center justify-center">
            <div className="w-full max-w-[420px] md:max-w-[600px] lg:max-w-[420px] xl:max-w-[420px] 2xl:max-w-[620px] mx-auto">
              <Image
                src="/about/map.png"
                alt="Global Impressions Map"
                width={420}
                height={280}
                className="w-full h-auto object-contain rounded-xl shadow"
                priority
              />
            </div>
          </div>

          {/* Table */}
          <div className="w-full lg:w-1/2 xl:w-1/3">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse rounded-lg overflow-hidden text-sm shadow-sm">
                <thead>
                  <tr className="bg-[#e9f6db] text-gray-800 font-semibold text-left">
                    <th className="py-2 px-4 border-b border-gray-200">Country</th>
                    <th className="py-2 px-4 border-b border-gray-200 capitalize">
                      {activeTab}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.map(({ country, impressions }) => (
                    <tr key={country} className="bg-white even:bg-gray-50 text-gray-700">
                      <td className="py-2 px-4 border-b border-gray-200">{country}</td>
                      <td className="py-2 px-4 border-b border-gray-200">
                        {activeTab === 'impressions' ? impressions : Math.floor(impressions / 5)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
