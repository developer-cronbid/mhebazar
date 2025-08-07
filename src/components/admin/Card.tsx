import React from 'react';
import { FileText, ChevronRight } from 'lucide-react';

const ProductQuoteCard = () => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200 cursor-pointer relative overflow-hidden">
      {/* Background circle */}
      <div className="absolute top-0 left-0 w-20 h-20 bg-green-100 rounded-full opacity-50 -translate-x-4 -translate-y-4"></div>

      {/* Content */}
      <div className="relative z-10">
        {/* Icon */}
        <div className="mb-4">
          <div className="w-10 h-10 bg-[#5CA131] rounded-lg flex items-center justify-center">
            <FileText className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Number */}
        <div className="mb-2">
          <h2 className="text-3xl font-bold text-green-600">482</h2>
        </div>

        {/* Label and Arrow */}
        <div className="flex items-center justify-between">
          <span className="text-gray-500 text-sm">Product Quote</span>
          <ChevronRight className="w-4 h-4 text-green-600" />
        </div>
      </div>
    </div>
  );
};

export default ProductQuoteCard;