"use client";
import React, { useState } from 'react';
import {
  LayoutDashboard,
  FileText,
  Users,
  UserPlus,
  Plus,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import Link from 'next/link';

const Sidebar = () => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [openSubmenu, setOpenSubmenu] = useState<number | null>(null);

  const menuItems = [
    {
      icon: LayoutDashboard,
      label: 'Dashboard',
      href: '/admin/',
    },
    {
      icon: FileText,
      label: 'All Forms',
      // href: '/admin/forms',
      subItems: [
        { label: 'Quotes Forms', href: '/admin/forms/quotes' },
        { label: 'Rent and Buy Forms', href: '/admin/forms/rent-buy' },
        { label: 'Rental Forms', href: '/admin/forms/rentals' },
        // { label: 'Specification Forms', href: '/admin/forms/specification' },
        // { label: 'Catalogue Forms', href: '/admin/forms/catalogue' }
      ]
    },
    {
      icon: Users,
      label: 'Registered User',
      // href: '/admin/accounts',
      subItems: [
        { label: 'Registered Vendors', href: '/admin/accounts/registered-vendors' },
        { label: 'Registered Users', href: '/admin/accounts/users' },
      ]
    },
    {
      icon: UserPlus,
      label: 'Add Sub Admin',
      // href: '/admin/add-admin',
      subItems: [
        { label: 'Create Admin', href: '/admin/add-admin/create' },
        { label: 'Admin Permissions', href: '/admin/add-admin/permissions' },
        { label: 'Admin Roles', href: '/admin/add-admin/roles' }
      ]
    },
    {
      icon: Plus,
      label: 'Add Products',
      // href: '/admin/add-product',
      subItems: [
        { label: 'Categories', href: '/admin/add-products/categories' },
        { label: 'Subcategories', href: '/admin/add-products/subcategories' },
      ]
    },
    {
      icon: MessageSquare,
      label: 'Enquiry History',
      // href: '/admin/enquiry',
      subItems: [
        { label: 'Recent Enquiries', href: '/admin/enquiry/recent' },
        { label: 'Pending Enquiries', href: '/admin/enquiry/pending' },
        { label: 'Resolved Enquiries', href: '/admin/enquiry/resolved' },
        { label: 'Enquiry Reports', href: '/admin/enquiry/reports' }
      ]
    },
  ];

  const toggleSubmenu = (index: number) => {
    if (!isExpanded) return;
    setOpenSubmenu(openSubmenu === index ? null : index);
  };

  return (
    <div className="sticky top-0 left-0 w-fit h-screen">
      <div
        className={`h-full bg-gradient-to-b from-white to-green-50 border-r-2 border-[#5da031]/20 shadow-lg transition-all duration-100 ease-linear ${isExpanded ? 'w-64' : 'w-16'
          }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="px-3 py-3 border-b-2 border-[#5da031]/20 bg-gradient-to-r from-[#5da031]/5 to-white">
            <div className="flex items-center justify-between">
              {isExpanded ? (
                <div className="flex items-center space-x-2">
                  <div className="w-9 h-9 bg-gradient-to-br from-[#5da031] to-[#4a8b2a] rounded-lg flex items-center justify-center shadow-lg shadow-[#5da031]/25 ring-2 ring-[#5da031]/10">
                    <span className="text-white font-bold text-lg">M</span>
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-gray-800">MTE</h1>
                    <p className="text-xs text-[#5da031] font-semibold">Jagrat</p>
                  </div>
                </div>
              ) : ""}

              <button
                onClick={() => {
                  setOpenSubmenu(null); // Close any open submenu when collapsing
                  setIsExpanded((prev) => !prev);
                }}
                className="p-2 rounded-lg hover:bg-[#5da031]/10 transition-all duration-100 border border-transparent hover:border-[#5da031]/20"
                aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
              >
                {isExpanded ? (
                  <ChevronLeft className="w-5 h-5 text-gray-600 hover:text-[#5da031]" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-600 hover:text-[#5da031]" />
                )}
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-2 overflow-y-auto">
            <ul className="space-y-0.5">
              {menuItems.map((item, index) => (
                <li key={item.label}>
                  <div>
                    <div
                      className="flex items-center p-1.5 rounded-lg hover:bg-gradient-to-r hover:from-[#5da031]/10 hover:to-[#5da031]/20 transition-colors duration-75 cursor-pointer group border border-transparent hover:border-[#5da031]/30"
                      onClick={() => item.subItems ? toggleSubmenu(index) : null}
                    >
                      <div className="p-1 rounded-md group-hover:bg-[#5da031]/10 border border-transparent group-hover:border-[#5da031]/20">
                        <item.icon className="w-5 h-5 text-gray-600 group-hover:text-[#5da031]" />
                      </div>

                      {isExpanded && (
                        <>
                          {item.href ? (<Link href={item.href} className="ml-2 text-gray-700 group-hover:text-[#5da031] font-medium flex-1 group-hover:font-semibold">
                            {item.label}
                          </Link>) : (<span className="ml-2 text-gray-700 group-hover:text-[#5da031] font-medium flex-1 group-hover:font-semibold">
                            {item.label}
                          </span>)}


                          {item.subItems && (
                            <div className="p-1 rounded group-hover:bg-[#5da031]/10">
                              <ChevronDown
                                className={`w-4 h-4 text-gray-400 group-hover:text-[#5da031] transition-all duration-100 ${openSubmenu === index ? 'rotate-0' : '-rotate-90'
                                  }`}
                              />
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Submenu */}
                    {isExpanded && item.subItems && (
                      <div className={`overflow-hidden transition-all duration-100 ${openSubmenu === index ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
                        }`}>
                        <div className="mt-0.5 ml-5 space-y-0.5">
                          {item.subItems.map((subItem) => (
                            <Link
                              key={subItem.label}
                              href={subItem.href}
                              className="flex items-center p-1 pl-2 rounded-lg hover:bg-gradient-to-r hover:from-[#5da031]/10 hover:to-[#5da031]/20 transition-colors duration-75 group border-l-2 border-[#5da031]/20 hover:border-[#5da031] hover:shadow-md hover:shadow-[#5da031]/10"
                            >
                              <div className="w-2 h-2 bg-[#5da031]/40 rounded-full mr-2 group-hover:bg-[#5da031] group-hover:scale-110"></div>
                              <span className="text-sm text-gray-600 group-hover:text-[#5da031] group-hover:font-medium">
                                {subItem.label}
                              </span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </nav>
          {/* Footer */}
          <div className="p-3 border-t-2 border-[#5da031]/20 bg-gradient-to-r from-[#5da031]/5 to-white">
            {isExpanded ? (
              <div className="text-center">
                <p className="text-xs text-[#5da031] font-medium">© 2025 MTE Jagrat</p>
                <p className="text-xs text-[#5da031]/70">All rights reserved</p>
              </div>
            ) : (
              <div className="w-8 h-8 bg-gradient-to-br from-[#5da031]/20 to-[#5da031]/40 rounded-lg mx-auto shadow-sm" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;