// src/components/layout/Navbar.tsx
"use client";

import {
  Menu,
  ShoppingCart,
  X,
  Phone,
  ChevronDown,
  Tag,
  User,
  Package,
  Heart,
  LogOut,
  UserIcon,
  Repeat,
} from "lucide-react";
import { useRef, useState, useEffect, JSX } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import CategoryMenu from "./NavOptions";
import VendorRegistrationDrawer from "@/components/forms/publicforms/VendorRegistrationForm";
import SearchBar from "./SearchBar";
import { useUser } from "@/context/UserContext";
import { useRouter, usePathname } from "next/navigation";
import { handleLogout } from "@/lib/auth/logout";

// Import the local JSON data directly
import categoriesData from "@/data/categories.json";

// Define interfaces based on the local JSON structure
export interface Subcategory {
  id: number;
  name: string;
}

export interface Category {
  id: number;
  name: string;
  image_url: string;
  subcategories: Subcategory[];
}

const navigationLinks = [
  { name: "About", href: "/about" },
  { name: "Rental/Used MHE", href: "/used" },
  { name: "Attachments", href: "/attachments" },
  { name: "Spare Parts", href: "/spare-parts" },
  { name: "Services", href: "/services" },
  { name: "Training", href: "/training" },
  { name: "Blogs", href: "/blog" },
];

export interface User {
  id: number;
  username?: string | { image: string }[];
  email: string;
  role?: {
    id: number;
    name: string;
  };
  user_banner?: { url: string }[];
}

// Define the ting animation using keyframes (if needed, otherwise remove)
const tingAnimation = `
  @keyframes ting {
    0%, 100% {
      transform: rotate(0deg);
    }
    50% {
      transform: rotate(3deg);
    }
  }
`;

export default function Navbar(): JSX.Element {
  // Use the imported data directly instead of state
  const categories: Category[] = categoriesData;

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [categoriesOpen, setCategoriesOpen] = useState<boolean>(false);
  const [vendorDrawerOpen, setVendorDrawerOpen] = useState<boolean>(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState<boolean>(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const categoryMenuRef = useRef<HTMLDivElement>(null);

  const createSlug = (name: string): string =>
    name.toLowerCase().replace(/\s+/g, "-");

  const [openCategory, setOpenCategory] = useState<number | null>(null);

  const { user, isLoading, setUser } = useUser();
  const router = useRouter();
  const pathname = usePathname(); // Get the current pathname

  // Close dropdown on outside click for profile menu
  useEffect(() => {
    const handleClick = (e: MouseEvent): void => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(e.target as Node)
      ) {
        setProfileMenuOpen(false);
      }
    };
    if (profileMenuOpen) {
      document.addEventListener("mousedown", handleClick);
    }
    return () => document.removeEventListener("mousedown", handleClick);
  }, [profileMenuOpen]);

  // Close dropdown on outside click for category menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (
        categoryMenuRef.current &&
        !categoryMenuRef.current.contains(event.target as Node)
      ) {
        setCategoriesOpen(false);
      }
    };
    if (categoriesOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [categoriesOpen]);

  return (
    <header className="bg-white shadow-sm z-50 sticky top-0">
      <style>{tingAnimation}</style>
      {/* Top Green Banner */}
      <div className="bg-[#5CA131] text-white"> {/* Original green, matches image */}
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-2">
            <div className="flex items-center gap-2 text-sm">
              <Phone className="w-4 h-4" />
              <span>+91 73059 50939</span>
            </div>
            <div className="flex items-center gap-4 text-sm">
              {isLoading ? (
                <span>Loading...</span>
              ) : user ? (
                <span className="font-semibold">
                  Welcome, {typeof user.username === 'string' ? user.username : user.email}!
                </span>
              ) : (
                <span className="font-semibold">
                  Welcome, John Doe
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="bg-white">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3">
            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <Image
                  src="/mhe-logo.png"
                  alt="MHE BAZAR Logo"
                  width={140}
                  height={40}
                  className="h-10 w-auto object-contain"
                  style={{ maxWidth: 140 }}
                  priority
                />
              </Link>
            </div>

            {/* Search Bar with Brand Store - Desktop */}
            <div className="hidden md:flex flex-1 max-w-2xl mx-8 items-center gap-4">
              <SearchBar
                categories={categories}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
              />
              {/* Brand Store Image with animation and shadow */}
              <Link
                href="/vendor-listing"
                className="flex-shrink-0"
              >
                <motion.div
                  animate={{ rotate: [0, 3, 0, -3, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  style={{ transformOrigin: 'bottom center' }}
                  className="rounded-md" // Removed shadow-md, will use custom shadow
                  style={{boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)'}} // Custom natural shadow
                >
                  <Image
                    src="/brand-image.png"
                    alt="Brand Store"
                    width={120}
                    height={40}
                    priority
                    className="object-contain"
                  />
                </motion.div>
              </Link>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-4">
              {/* Compare Icon using Repeat */}
              <Link
                href="/compare"
                className="flex items-center text-gray-600 hover:text-gray-900 transition" // Changed hover color
                aria-label="Compare Products"
              >
                <Repeat className="w-6 h-6" />
              </Link>

              {/* Conditional rendering for Cart */}
              {!isLoading && user && (
                <Link
                  href="/cart"
                  className="flex items-center text-gray-600 hover:text-gray-900 transition" // Changed hover color
                  aria-label="Cart"
                >
                  <ShoppingCart className="w-6 h-6" />
                </Link>
              )}

              {/* Profile Dropdown */}
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => setProfileMenuOpen((v) => !v)}
                  className="focus:outline-none"
                  aria-label="Open profile menu"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse flex items-center justify-center">
                      <UserIcon className="w-6 h-6 text-gray-500" />
                    </div>
                  ) : user ? (
                    <>
                      {/* Check if user.username is an array and has an image */}
                      {Array.isArray(user.username) && user.username[0]?.image ? (
                        <Image
                          src={user.username[0].image}
                          alt="Profile"
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-full border-2 border-green-600 shadow-sm object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                          <UserIcon className="w-6 h-6 text-green-600" />
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <UserIcon className="w-6 h-6 text-gray-500" />
                    </div>
                  )}
                </button>
                <AnimatePresence>
                  {profileMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50"
                    >
                      {user ? (
                        <>
                          <div className="px-6 py-2 text-sm text-gray-500 font-semibold uppercase">
                            My Account
                          </div>
                          <Link
                            href="/account"
                            className="flex items-center gap-3 px-6 py-3 text-gray-800 hover:bg-gray-50 transition text-base"
                            onClick={() => setProfileMenuOpen(false)}
                          >
                            <User className="w-5 h-5 text-green-600" />
                            My Account
                          </Link>
                          <Link
                            href="/account/orders"
                            className="flex items-center gap-3 px-6 py-3 text-gray-800 hover:bg-gray-50 transition text-base"
                            onClick={() => setProfileMenuOpen(false)}
                          >
                            <Package className="w-5 h-5 text-green-600" />
                            My Orders
                          </Link>
                          <Link
                            href="/account/wishlist"
                            className="flex items-center gap-3 px-6 py-3 text-gray-800 hover:bg-gray-50 transition text-base"
                            onClick={() => setProfileMenuOpen(false)}
                          >
                            <Heart className="w-5 h-5 text-green-600" />
                            Wishlist
                          </Link>

                          {user.role?.id === 2 && (
                            <>
                              <div className="border-t border-gray-100 mt-2" />
                              <div className="px-6 py-2 text-sm text-gray-500 font-semibold uppercase">
                                Vendor Panel
                              </div>
                              <Link
                                href="/vendor/dashboard"
                                className="flex items-center gap-3 px-6 py-3 text-gray-800 hover:bg-gray-50 transition text-base"
                                onClick={() => setProfileMenuOpen(false)}
                              >
                                <User className="w-5 h-5 text-blue-600" />
                                Dashboard
                              </Link>
                              <Link
                                href="/vendor/products"
                                className="flex items-center gap-3 px-6 py-3 text-gray-800 hover:bg-gray-50 transition text-base"
                                onClick={() => setProfileMenuOpen(false)}
                              >
                                <Tag className="w-5 h-5 text-blue-600" />
                                My Products
                              </Link>
                              <Link
                                href="/vendor/profile"
                                className="flex items-center gap-3 px-6 py-3 text-gray-800 hover:bg-gray-50 transition text-base"
                                onClick={() => setProfileMenuOpen(false)}
                              >
                                <User className="w-5 h-5 text-blue-600" />
                                Vendor Profile
                              </Link>
                            </>
                          )}

                          {user.role?.id === 1 && (
                            <>
                              <div className="border-t border-gray-100 mt-2" />
                              <div className="px-6 py-2 text-sm text-gray-500 font-semibold uppercase">
                                Admin Panel
                              </div>
                              <Link
                                href="/admin/"
                                className="flex items-center gap-3 px-6 py-3 text-gray-800 hover:bg-gray-50 transition text-base"
                                onClick={() => setProfileMenuOpen(false)}
                              >
                                <User className="w-5 h-5 text-red-600" />
                                Admin Dashboard
                              </Link>
                            </>
                          )}

                          <div className="border-t border-gray-100 mt-2" />
                          <button
                            className="flex items-center gap-3 px-6 py-3 text-gray-800 hover:bg-gray-50 transition text-base w-full text-left"
                            onClick={async () => {
                              setProfileMenuOpen(false);
                              await handleLogout(() => setUser(null), router);
                            }}
                          >
                            <LogOut className="w-5 h-5 text-green-600" />
                            Logout
                          </button>
                        </>
                      ) : (
                        // Not logged in, show login/register options
                        <>
                          <Link
                            href="/login"
                            className="flex items-center gap-3 px-6 py-3 text-gray-800 hover:bg-gray-50 transition text-base"
                            onClick={() => setProfileMenuOpen(false)}
                          >
                            <User className="w-5 h-5 text-green-600" />
                            Sign In
                          </Link>
                          <Link
                            href="/register"
                            className="flex items-center gap-3 px-6 py-3 text-gray-800 hover:bg-gray-50 transition text-base"
                            onClick={() => setProfileMenuOpen(false)}
                          >
                            <User className="w-5 h-5 text-green-600" />
                            Sign Up
                          </Link>
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Mobile Search Bar with Brand Store */}
          <div className="md:hidden pb-3">
            <div className="flex items-center gap-2">
              <SearchBar
                categories={categories}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
              />
              <Link
                href="/vendor-listing"
                className="flex-shrink-0"
              >
                <Image
                  src="/brand-image.png"
                  alt="Brand Store"
                  width={120}
                  height={40}
                  priority
                  className="object-contain"
                  style={{boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)'}} // Custom natural shadow
                />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Navigation */}
      <nav className="hidden lg:block bg-white border-t border-gray-200">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Left Navigation */}
            <div className="flex items-center">
              {/* Categories Dropdown */}
              <div className="relative" ref={categoryMenuRef}>
                <button
                  className="flex items-center gap-2 px-4 py-3 text-gray-700 hover:text-gray-900 text-sm font-normal transition" // Changed font-medium to font-normal, hover:text-green-600 to hover:text-gray-900
                  onClick={() => setCategoriesOpen(!categoriesOpen)}
                >
                  <Menu className="w-5 h-5" />
                  All Categories
                  <ChevronDown className="w-4 h-4" />
                </button>
                <CategoryMenu
                  isOpen={categoriesOpen}
                  onClose={() => setCategoriesOpen(false)}
                  categories={categories}
                />
              </div>

              {/* Navigation Links */}
              <div className="flex items-center">
                {navigationLinks.map((link, index) => (
                  <Link
                    key={index}
                    href={link.href}
                    className={`px-4 py-3 text-sm font-normal transition ${ // Changed font-medium to font-normal
                      pathname === link.href ? "text-gray-900 font-bold" : "text-gray-700 hover:text-gray-900" // Changed active state to dark font
                    }`}
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Right Navigation */}
            <div className="flex items-center">
              <Link
                href="/contact"
                className={`flex items-center gap-2 px-4 py-3 transition ${
                  pathname === "/contact" ? "text-gray-900 font-bold" : "text-gray-600 hover:text-gray-900" // Changed active state and hover
                }`}
              >
                <div className="w-5 h-5 rounded-full border border-gray-400 flex items-center justify-center text-gray-700 font-normal text-sm"> {/* Changed bg-gray-200 to border, font-semibold to font-normal */}
                  ?
                </div>
                <span className="text-sm font-normal">Help</span> {/* Changed font-medium to font-normal */}
              </Link>

              {/* Conditional rendering for Become a Vendor / My Vendor Dashboard */}
              {isLoading ? (
                <span className="px-4 py-3 text-sm text-gray-600 font-normal"> {/* Changed font-medium to font-normal */}
                  Loading...
                </span>
              ) : user ? (
                user.role?.id === 2 ? (
                  <Link
                    href="/vendor/dashboard"
                    className={`flex items-center gap-2 px-4 py-3 transition ${
                      pathname === "/vendor/dashboard" ? "text-gray-900 font-bold" : "text-gray-600 hover:text-gray-900" // Changed active state and hover
                    }`}
                  >
                    <User className="w-5 h-5" />
                    <span className="text-sm font-normal"> {/* Changed font-semibold to font-normal */}
                      My Vendor Dashboard
                    </span>
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => setVendorDrawerOpen(true)}
                    className={`flex items-center gap-2 px-4 py-3 transition bg-transparent border-0 cursor-pointer ${
                      pathname === "/become-a-vendor" ? "text-gray-900 font-bold" : "text-gray-600 hover:text-gray-900" // Changed active state and hover
                    }`}
                  >
                    <User className="w-5 h-5" />
                    <span className="text-sm font-normal">Become a Vendor</span> {/* Changed font-medium to font-normal */}
                  </button>
                )
              ) : null}

              <Link
                href="/services/subscription-plan"
                className={`flex items-center gap-2 px-4 py-3 transition ${
                  pathname === "/services/subscription-plan" ? "text-gray-900 font-bold" : "text-gray-600 hover:text-gray-900" // Changed active state and hover
                }`}
              >
                <Tag className="w-5 h-5" />
                <span className="text-sm font-normal">Price Plan</span> {/* Changed font-medium to font-normal */}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-50"
          >
            <div
              className="fixed inset-0 bg-black bg-opacity-50"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-0 left-0 w-80 max-w-[85vw] h-full bg-white shadow-xl flex flex-col"
            >
              {/* Mobile Menu Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <Link
                  href="/"
                  className="flex items-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Image
                    src="/mhe-logo.png"
                    alt="MHE BAZAR Logo"
                    width={120}
                    height={32}
                    className="h-8 w-auto object-contain"
                    style={{ maxWidth: 120 }}
                    priority
                  />
                </Link>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Mobile Menu Content */}
              <div className="flex-1 flex flex-col overflow-y-auto">
                {/* Categories Section */}
                <div className="border-b border-gray-200">
                  <div className="px-4 py-3 bg-gray-50 text-sm font-semibold text-gray-600 uppercase tracking-wide">
                    Categories
                  </div>
                  {categories.map((category) => (
                    <div key={category.id} className="border-b border-gray-100">
                      <button
                        onClick={() => {
                          setOpenCategory(openCategory === category.id ? null : category.id);
                        }}
                        className={`w-full flex justify-between items-center px-6 py-3 text-left transition ${
                          pathname.startsWith(`/${createSlug(category.name)}`) ? "text-gray-900 font-bold" : "text-gray-700 hover:bg-gray-50" // Changed active state
                        }`}
                      >
                        <span>{category.name}</span>
                        <ChevronDown
                          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                            openCategory === category.id ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {/* Animate the appearance of the sub-menu */}
                      <AnimatePresence>
                        {openCategory === category.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden bg-white"
                          >
                            {/* Special link to all products in the category */}
                            <Link
                              href={`/${createSlug(category.name)}`}
                              className={`block pl-10 pr-6 py-3 font-medium transition ${
                                pathname === `/${createSlug(category.name)}` ? "text-gray-900 font-bold" : "text-gray-800 hover:bg-gray-50" // Changed active state
                              }`}
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              All {category.name}
                            </Link>

                            {/* Filter and list the subcategories for the open category */}
                            {category.subcategories.length > 0 ? (
                              category.subcategories.map((sub) => (
                                <Link
                                  key={sub.id}
                                  href={`/${createSlug(category.name)}/${createSlug(
                                    sub.name
                                  )}`}
                                  className={`block pl-10 pr-6 py-3 transition ${
                                    pathname === `/${createSlug(category.name)}/${createSlug(sub.name)}` ? "text-gray-900 font-bold" : "text-gray-600 hover:bg-gray-50" // Changed active state
                                  }`}
                                  onClick={() => setMobileMenuOpen(false)}
                                >
                                  {sub.name}
                                </Link>
                              ))
                            ) : (
                              <p className="pl-10 pr-6 py-3 text-gray-400 text-sm italic">
                                No subcategories found.
                              </p>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>

                {/* Navigation Links */}
                <div className="flex-1">
                  {navigationLinks.map((link, index) => (
                    <Link
                      key={index}
                      href={link.href}
                      className={`block px-4 py-3 border-b border-gray-100 font-medium transition ${
                        pathname === link.href ? "text-gray-900 bg-gray-50" : "text-gray-700 hover:bg-gray-50" // Changed active state
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {link.name}
                    </Link>
                  ))}
                  <Link
                    href="/vendor-listing"
                    className={`block px-4 py-3 font-semibold border-b border-gray-100 transition ${
                      pathname === "/vendor-listing" ? "text-gray-900 bg-gray-50" : "hover:bg-gray-50" // Changed active state
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Image
                      src="/brand-image.png"
                      alt="Brand Store"
                      width={120}
                      height={40}
                      priority
                      className="object-contain"
                      style={{boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)'}} // Custom natural shadow
                    />
                  </Link>
                  <Link
                    href="/contact"
                    className={`block px-4 py-3 border-b border-gray-100 font-medium transition ${
                      pathname === "/contact" ? "text-gray-900 bg-gray-50" : "text-gray-700 hover:bg-gray-50" // Changed active state
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Help
                  </Link>
                  {isLoading ? (
                    <span className="block px-4 py-3 text-gray-700">
                      Loading...
                    </span>
                  ) : user?.role?.id === 2 ? (
                    <Link
                      href="/vendor/dashboard"
                      className={`block px-4 py-3 font-semibold border-b border-gray-100 transition ${
                        pathname === "/vendor/dashboard" ? "text-gray-900 bg-gray-50" : "text-gray-700 hover:bg-gray-50" // Changed active state
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      My Vendor Dashboard
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setVendorDrawerOpen(true);
                      }}
                      className="block w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 border-b border-gray-100 font-medium transition bg-transparent" // Changed hover:bg-green-50 to hover:bg-gray-50
                    >
                      Become a Vendor
                    </button>
                  )}
                  <Link
                    href="/services/subscription-plan"
                    className={`block px-4 py-3 border-b border-gray-100 font-medium transition ${
                      pathname === "/services/subscription-plan" ? "text-gray-900 bg-gray-50" : "text-gray-700 hover:bg-gray-50" // Changed active state
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Price Plan
                  </Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drawer Component */}
      <VendorRegistrationDrawer
        open={vendorDrawerOpen}
        onClose={() => setVendorDrawerOpen(false)}
      />
    </header>
  );
}
