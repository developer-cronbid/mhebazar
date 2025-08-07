import React from 'react';
import { Search, Bell, User } from 'lucide-react';

const Navbar = () => {
  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left side - Logo and greeting */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-lg">M</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Greetings</h1>
            <p className="text-sm text-gray-600">Start your day with MHE</p>
          </div>
        </div>

        {/* Right side - Search, notifications, and account */}
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search"
              className="w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Notification bell */}
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <Bell className="h-5 w-5 text-gray-600" />
          </button>

          {/* My Account button */}
          <button className="flex items-center space-x-2 bg-[#5CA131] hover:bg-green-700 text-white px-4 py-2 rounded-full transition-colors">
            <User className="h-4 w-4" />
            <span className="text-sm font-medium">My Account</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;