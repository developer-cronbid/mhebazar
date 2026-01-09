"use client";
import React from 'react';
import Link from 'next/link';
import SideFilter from '@/components/products/SideFilter';

export default function NotFound() {
    // satisfy SideFilter TypeScript requirements
    const handleFilterChange = () => {
        // No-op for 404 page
    };

    return (
        <main className="flex h-screen w-full bg-gray-50 overflow-hidden">

            {/* --- 1. SIDEBAR FILTER SECTION --- */}
            <div className="hidden md:block w-[260px] shrink-0 border-r border-gray-200 bg-white overflow-y-auto">
                <SideFilter
                    selectedFilters={new Set<string>()}
                    onFilterChange={handleFilterChange}
                    selectedCategoryName={null}
                    selectedSubcategoryName={null}
                    selectedTypes={[]}
                    minPrice={''}
                    maxPrice={''}
                    selectedManufacturer={null}
                    selectedRating={null}
                    showManufacturerFilter={true}
                />
            </div>

            {/* --- 2. MAIN CONTENT AREA (Centered Truck Only) --- */}
            <div className="flex-1 flex flex-col h-full overflow-hidden justify-center items-center p-4 md:p-6 md:p-6 -mt-12 md:-mt-20">

                <div className="max-w-4xl w-full text-center">
                    {/* --- RESPONSIVE ANIMATED TRUCK SECTION --- */}
                    <div className="relative h-48 md:h-72 w-full mb-8 md:mb-12 flex items-end justify-center">
                        {/* The Road */}
                        <div className="absolute bottom-0 w-full h-1 md:h-1.5 bg-gray-300 rounded-full"></div>

                        {/* Moving Lorry / Truck - Responsive Scaling */}
                        <div className="relative animate-bounce-slow flex flex-col items-end mr-4 md:mr-10">
                            {/* Truck Cabin & Trailer */}
                            <div className="flex items-end">
                                {/* BIG Trailer/Container */}
                                <div className="w-40 h-24 md:w-64 md:h-40 bg-orange-600 rounded-t-lg md:rounded-t-xl relative flex flex-col items-center justify-center shadow-2xl border-b-[3px] md:border-b-4 border-orange-700">
                                    <span className="text-5xl md:text-8xl font-black text-white/20 select-none leading-none tracking-tighter">404</span>
                                    <span className="text-[8px] md:text-xs font-bold text-white/40 border md:border-2 border-white/10 px-2 md:px-3 py-0.5 md:py-1 mt-1 md:mt-2 uppercase tracking-[0.2em]">MHE BAZAR</span>

                                    <div className="absolute top-2 left-2 md:top-4 md:left-4 w-0.5 md:w-1 h-16 md:h-32 bg-white/5 rounded-full"></div>
                                    <div className="absolute top-2 right-2 md:top-4 md:right-4 w-0.5 md:w-1 h-16 md:h-32 bg-white/5 rounded-full"></div>
                                </div>

                                {/* Truck Head */}
                                <div className="w-14 h-14 md:w-24 md:h-24 bg-gray-800 rounded-r-xl md:rounded-r-2xl relative shadow-lg">
                                    <div className="absolute top-2 right-1 md:top-4 md:right-2 w-7 md:w-12 h-5 md:h-8 bg-blue-400 rounded-sm md:rounded-md opacity-40 border-l-2 md:border-l-4 border-blue-200"></div>
                                    <div className="absolute bottom-2 -right-1 md:bottom-3 md:-right-2 w-2.5 h-2.5 md:w-4 md:h-4 bg-yellow-400 rounded-full animate-pulse shadow-[0_0_15px_rgba(250,204,21,0.8)]"></div>
                                </div>
                            </div>

                            {/* Wheels Section - Tire running animation applied here */}
                            <div className="w-full flex justify-around px-2 md:px-4 -mt-2.5 md:-mt-4">
                                <div className="w-8 h-8 md:w-12 md:h-12 bg-gray-900 rounded-full border-[4px] md:border-[6px] border-gray-700 flex items-center justify-center animate-spin-slow">
                                     {/* Rim Detail to make spin visible */}
                                     <div className="w-full h-[2px] bg-gray-700 absolute rotate-45"></div>
                                     <div className="w-full h-[2px] bg-gray-700 absolute -rotate-45"></div>
                                </div>
                                <div className="w-8 h-8 md:w-12 md:h-12 bg-gray-900 rounded-full border-[4px] md:border-[6px] border-gray-700 flex items-center justify-center animate-spin-slow">
                                     <div className="w-full h-[2px] bg-gray-700 absolute rotate-45"></div>
                                     <div className="w-full h-[2px] bg-gray-700 absolute -rotate-45"></div>
                                </div>
                                <div className="w-8 h-8 md:w-12 md:h-12 bg-gray-900 rounded-full border-[4px] md:border-[6px] border-gray-700 flex items-center justify-center animate-spin-slow ml-auto mr-2 md:mr-4">
                                     <div className="w-full h-[2px] bg-gray-700 absolute rotate-45"></div>
                                     <div className="w-full h-[2px] bg-gray-700 absolute -rotate-45"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* --- TEXT CONTENT --- */}
                    <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2"> Path Not Found</h1>
                    <p className="mt-2 text-lg text-gray-600 max-w-lg mx-auto font-medium px-4">
                        We don’t have what you&apos;re looking for, but you can check our categories.
                    </p>

                    {/* --- ACTION BUTTON --- */}
                    <div className="mt-8 md:mt-10 px-4">
                        <Link
                            href="/"
                            className="inline-block w-full sm:w-auto rounded-full bg-green-600 px-10 md:px-12 py-4 text-sm md:text-base font-bold text-white shadow-xl hover:bg-green-700 transition-all active:scale-95 uppercase tracking-wider"
                        >
                            Back to Home
                        </Link>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @keyframes bounce-slow {
                    0%, 100% { transform: translateY(0) rotate(0deg); }
                    50% { transform: translateY(-5px) md:translateY(-8px) rotate(0.5deg); }
                }
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-bounce-slow {
                    animation: bounce-slow 1.2s infinite ease-in-out;
                }
                .animate-spin-slow {
                    animation: spin-slow 0.6s infinite linear;
                }
            `}</style>
        </main>
    );
}