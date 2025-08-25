
"use client";

import React, { useState, useMemo } from "react";
import { Search, Bell, User, LogOut, Home } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { handleLogout } from "@/lib/auth/logout";
import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";

// Admin pages ki list
const PAGES = [
  { name: "Dashboard", href: "/admin" },
  { name: "Users", href: "/admin/accounts/users" },
  { name: "Vendors", href: "/admin/accounts/registered-vendors" },
  { name: "Categories", href: "/admin/add-products/categories" },
  { name: "Subcategories", href: "/admin/add-products/subcategories" },
  { name: "Contact Form Submissions", href: "/admin/contact/contact-form" },
  { name: "Newsletter Subscriptions", href: "/admin/contact/newsletter" },
  { name: "Direct Buy Forms", href: "/admin/forms/direct-buy" },
  { name: "Quote Requests", href: "/admin/forms/quotes" },
  { name: "Rental Requests", href: "/admin/forms/rentals" },
  {
    name: "Training Registrations",
    href: "/admin/forms/training-registrations",
  },
];

const Navbar = () => {
  const { setUser } = useUser();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");

  const filteredPages = useMemo(() => {
    if (!searchQuery) return [];
    const lowercasedQuery = searchQuery.toLowerCase();
    return PAGES.filter((page) =>
      page.name.toLowerCase().includes(lowercasedQuery)
    );
  }, [searchQuery]);

  const handleSearchItemClick = (href: string) => {
    router.push(href);
    setSearchQuery(""); // Clear search bar after navigation
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4">
      <div className="flex items-center justify-between flex-wrap sm:flex-nowrap gap-4">
        {/* Left side - Logo and greeting */}
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <Link href="/" className="flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity">
            <Image
              src="/favicon-32x32.png"
              alt="MHE Logo"
              width={40}
              height={40}
              className="w-10 h-10 object-contain"
            />
          </Link>

          <div className="hidden sm:block">
            <h1 className="text-lg font-semibold text-gray-900">Greetings</h1>
            <p className="text-sm text-gray-600">Start your day with MHE</p>
          </div>
        </div>

        {/* Right side - Search, notifications, and account */}
        <div className="flex items-center justify-end space-x-2 sm:space-x-4 w-full sm:w-auto">
          {/* Simple Search with custom dropdown */}
          <div className="relative w-full sm:w-auto sm:min-w-[200px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {filteredPages.length > 0 && (
              <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-10 overflow-hidden">
                {filteredPages.map((page) => (
                  <Link
                    key={page.href}
                    href={page.href}
                    onClick={() => handleSearchItemClick(page.href)}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    {page.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Notification bell */}
          <Link
            href="/admin/forms/quotes"
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <Bell className="h-5 w-5 text-gray-600" />
          </Link>

          {/* My Account button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center space-x-2 bg-[#5CA131] hover:bg-green-700 text-white px-4 py-2 rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                <User className="h-4 w-4" />
                <span className="text-sm font-medium text-nowrap hidden sm:inline">
                  My Account
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <Link href={"/"} className="flex w-full">
                    <Home className="mr-2 h-4 w-4" />
                    <span>Home Page</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleLogout(() => setUser(null), router)}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;