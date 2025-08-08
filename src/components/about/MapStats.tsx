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
  const isTabSwitchingEnabled = false;

  return (
    <section className="w-full bg-white py-12 px-4">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-left">
          Global Map
        </h2>

        {/* Tabs */}
        <div className="flex flex-wrap gap-3 mb-8">
          <button
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'impressions'
                ? 'bg-green-600 text-white'
                : 'bg-green-50 text-gray-700 border border-green-200'
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
                ? 'bg-green-600 text-white'
                : 'bg-green-50 text-gray-700 border border-green-200'
            }`}
            onClick={() => {
              if (isTabSwitchingEnabled) setActiveTab('clicks');
            }}
          >
            Date - 1st July - 31st July 2024
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Map Image */}
          <div className="flex-1">
            <div className="w-full">
              <Image
                src="/about/map.png"
                alt="Global Impressions Map"
                width={600}
                height={350}
                className="w-full h-auto object-contain rounded-lg shadow-sm"
                priority
              />
            </div>
          </div>

          {/* Table */}
          <div className="w-full lg:w-80">
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-green-50 border-b border-gray-200">
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">
                      Country
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700 capitalize">
                      {activeTab}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.map(({ country, impressions }, index) => (
                    <tr 
                      key={country} 
                      className={`border-b border-gray-100 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      }`}
                    >
                      <td className="py-3 px-4 text-sm text-gray-700">
                        {country}
                      </td>
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">
                        {activeTab === 'impressions' ? impressions.toLocaleString() : Math.floor(impressions / 5).toLocaleString()}
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