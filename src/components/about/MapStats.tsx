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
    <section className="w-full bg-white py-8 px-4">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">Global Map</h2>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'impressions'
                ? 'bg-green-600 text-white'
                : 'bg-green-100 text-gray-800'
            }`}
            onClick={() => {
              if (isTabSwitchingEnabled) setActiveTab('impressions');
            }}
          >
            Worldwide Impressions
          </button>
          <button
            className="px-4 py-2 rounded-md text-sm font-medium bg-green-100 text-gray-800"
            onClick={() => {
              if (isTabSwitchingEnabled) setActiveTab('clicks');
            }}
          >
            Date - 1st July - 31st July 2024
          </button>
        </div>

        {/* Content */}
        <div className="flex gap-8 items-start">
          {/* Map Image */}
          <div className="flex-1">
            <div className="w-full">
              <Image
                src="/about/map.png"
                alt="Global Impressions Map"
                width={500}
                height={300}
                className="w-full h-auto object-contain rounded-lg"
                priority
              />
            </div>
          </div>

          {/* Table */}
          <div className="w-80">
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-green-50 border-b border-gray-200">
                    <th className="py-3 px-4 text-left font-semibold text-gray-700">Country</th>
                    <th className="py-3 px-4 text-left font-semibold text-gray-700">Impressions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map(({ country, impressions }, index) => (
                    <tr key={country} className={`border-b ${index % 2 === 0 ? 'bg-white' : 'bg-white'}`}>
                      <td className="py-2 px-4 text-gray-700">{country}</td>
                      <td className="py-2 px-4 text-gray-700">
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