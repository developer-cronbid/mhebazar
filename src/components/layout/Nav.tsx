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
  Bell,
  ClipboardList,
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import ContactForm from "../forms/publicforms/ContactForm";

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
  // { name: "About", href: "/about" },
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

const shineAnimation = `
  @keyframes shine {
    0% {
      left: -150%;
    }
    100% {
      left: 150%;
    }
  }

  .shine-effect .shine-overlay {
    background: linear-gradient(
      120deg,
      rgba(255, 255, 255, 0.4) 0%,
      rgba(255, 255, 255, 0.1) 60%,
      transparent 100%
    );
    transform: skewX(-20deg);
    position: absolute;
    top: 0;
    left: -150%;
    width: 50%;
    height: 100%;
    animation: shine 2s infinite;
  }
`;

export default function Navbar(): JSX.Element {
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
  const pathname = usePathname();

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
      <style>{tingAnimation}{shineAnimation}</style>
      <div className="bg-[#5CA131] text-white">
        <div className="max-w-full mx-auto px-2 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-1 sm:gap-2 py-2">
            <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm whitespace-nowrap">
              <Phone className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="">+91 73059 50939</span>
              {/* <span className="xs:hidden">Call</span> */}
            </div>
            <div className="flex items-center gap-4 text-xs sm:text-sm">
              {isLoading ? (
                <span>Loading...</span>
              ) : user ? (
                // Added text-center for mobile view
                <span className="font-semibold text-center sm:text-left text-xs sm:text-sm text-nowrap">
                  | Welcome,{" "}
                  {typeof user.username === "string"
                    ? user.username
                    : user.email}
                  !
                </span>
              ) : (
                <>
                  <Link href="/login" className="hover:underline">
                    Sign In
                  </Link>
                  <span className="opacity-50">|</span>
                  <Link href="/register" className="hover:underline">
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-2 sm:py-3">
            <button
              className="lg:hidden p-1 sm:p-2 rounded-md text-gray-600 hover:text-gray-900"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            <div className="flex items-center ml-2 sm:ml-5">
              <Link href="/" className="flex items-center">
                <Image
                  src="/mhe-logo.png"
                  alt="MHE BAZAR Logo"
                  width={120}
                  height={35}
                  className="h-8 sm:h-10 w-auto object-contain"
                  style={{ maxWidth: "120px" }}
                  priority
                />
              </Link>
            </div>

            {/* Update search bar container */}
            <div className="hidden md:flex flex-1 max-w-5xl mx-2 sm:mx-8 items-center gap-2 sm:gap-4">
              <SearchBar
                categories={categories}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
              />
              <Link href="/vendor-listing" className="flex-shrink-0 relative overflow-hidden rounded-md shine-effect hidden sm:block">
                <Image
                  src="/brand-image.png"
                  alt="Brand Store"
                  width={120}
                  height={40}
                  priority
                  className="object-contain"
                  style={{ boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)" }}
                />
                <span className="shine-overlay"></span>
              </Link>
            </div>

            {/* Update icons section */}
            <div className="flex items-center gap-2 sm:gap-4">
              <Link
                href="/compare"
                className="hidden sm:flex items-center text-gray-600 hover:text-gray-900 transition"
                aria-label="Compare Products"
              >
                <Repeat className="w-5 h-5 sm:w-6 sm:h-6" />
              </Link>

              {!isLoading && user && (
                <Link
                  href="/cart"
                  className="flex items-center text-gray-600 hover:text-gray-900 transition"
                  aria-label="Cart"
                >
                  <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />
                </Link>
              )}

              {/* Update profile button */}
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => setProfileMenuOpen((v) => !v)}
                  className="focus:outline-none"
                  aria-label="Open profile menu"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-200 animate-pulse flex items-center justify-center">
                      <UserIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
                    </div>
                  ) : user ? (
                    <>
                      {Array.isArray(user.username) && user.username[0]?.image ? (
                        <Image
                          src={user.username[0].image}
                          alt="Profile"
                          width={40}
                          height={40}
                          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-green-600 shadow-sm object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-green-100 flex items-center justify-center">
                          <UserIcon className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <UserIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
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
                                href="/vendor/product-list"
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
                              <Link
                                href="/vendor/notifications"
                                className="flex items-center gap-3 px-6 py-3 text-gray-800 hover:bg-gray-50 transition text-base"
                                onClick={() => setProfileMenuOpen(false)}
                              >
                                <Bell className="w-5 h-5 text-blue-600" />
                                Vendor Notifications
                              </Link>
                              <Link
                                href="/vendor/enquiry"
                                className="flex items-center gap-3 px-6 py-3 text-gray-800 hover:bg-gray-50 transition text-base"
                                onClick={() => setProfileMenuOpen(false)}
                              >
                                <ClipboardList className="w-5 h-5 text-blue-600" />
                                Vendor Enquiries
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

          {/* 3. Update mobile search bar section */}
          <div className="md:hidden pb-2 sm:pb-3">
            <div className="flex items-center gap-2">
              <SearchBar
                categories={categories}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
              />
              <Link href="/vendor-listing" className="flex-shrink-0 relative overflow-hidden rounded-md shine-effect">
                <Image
                  src="/brand-image.png"
                  alt="Brand Store"
                  width={100}
                  height={35}
                  priority
                  className="object-contain"
                  style={{ boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)" }}
                />
                <span className="shine-overlay"></span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <nav className="hidden lg:block bg-white border-t border-gray-200">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="relative" ref={categoryMenuRef}>
                <button
                  className={`flex items-center gap-2 px-4 py-3 text-sm transition ${pathname.includes("categories") || categoriesOpen
                      ? "text-gray-900 font-bold"
                      : "text-gray-700 hover:text-gray-900 font-normal"
                    }`}
                  onClick={() => setCategoriesOpen(!categoriesOpen)}
                >
                  <Menu className="w-5 h-5" />
                  All Categories
                  <ChevronDown className="w-4 h-4" />
                </button>
                <CategoryMenu
                  isOpen={categoriesOpen}
                  onClose={() => setCategoriesOpen(false)}
                />
              </div>

              <div className="flex items-center">
                {navigationLinks.map((link, index) => (
                  <Link
                    key={index}
                    href={link.href}
                    className={`px-4 py-3 text-sm transition ${pathname === link.href
                        ? "text-gray-900 font-bold"
                        : "text-gray-700 hover:text-gray-900 font-normal"
                      }`}
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex items-center">
              <Dialog>
                <DialogTrigger>
                  <button
                    className={`flex items-center gap-2 px-4 py-3 transition ${pathname === "/contact"
                      ? "text-gray-900 font-bold"
                      : "text-gray-600 hover:text-gray-900 font-normal"
                      }`}
                  >
                    <div className="w-5 h-5 rounded-full border border-gray-400 flex items-center justify-center text-gray-700 font-normal text-sm">
                      {" "}
                      ?
                    </div>
                    <span className="text-sm font-normal">Help</span>{" "}
                  </button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Help</DialogTitle>
                    <DialogDescription>
                      <ContactForm />
                    </DialogDescription>
                  </DialogHeader>
                </DialogContent>
              </Dialog>


              {isLoading ? (
                <span className="px-4 py-3 text-sm text-gray-600 font-normal">
                  {" "}
                  Loading...
                </span>
              ) : user ? (
                user.role?.id === 2 ? (
                  <Link
                    href="/vendor/dashboard"
                    className={`flex items-center gap-2 px-4 py-3 transition ${pathname.includes("/vendor/dashboard")
                        ? "text-gray-900 font-bold"
                        : "text-gray-600 hover:text-gray-900 font-normal"
                      }`}
                  >
                    <User className="w-5 h-5" />
                    <span className="text-sm font-normal">
                      {" "}
                      My Vendor Dashboard
                    </span>
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => setVendorDrawerOpen(true)}
                    className={`flex items-center gap-2 px-4 py-3 transition bg-transparent border-0 cursor-pointer ${pathname === "/become-a-vendor"
                        ? "text-gray-900 font-bold"
                        : "text-gray-600 hover:text-gray-900 font-normal"
                      }`}
                  >
                    <User className="w-5 h-5" />
                    <span className="text-sm font-normal">
                      Become a Vendor
                    </span>{" "}
                  </button>
                )
              ) : (
                <button
                  type="button"
                  onClick={() => setVendorDrawerOpen(true)}
                  className={`flex items-center gap-2 px-4 py-3 transition bg-transparent border-0 cursor-pointer ${pathname === "/become-a-vendor"
                      ? "text-gray-900 font-bold"
                      : "text-gray-600 hover:text-gray-900 font-normal"
                    }`}
                >
                  <User className="w-5 h-5" />
                  <span className="text-sm font-normal">Become a Vendor</span>
                </button>
              )}

              <Link
                href="/services/subscription-plan"
                className={`flex items-center gap-2 px-4 py-3 transition ${pathname === "/services/subscription-plan"
                    ? "text-gray-900 font-bold"
                    : "text-gray-600 hover:text-gray-900 font-normal"
                  }`}
              >
                <Tag className="w-5 h-5" />
                <span className="text-sm font-normal">Price Plan</span>{" "}
              </Link>
            </div>
          </div>
        </div>
      </nav>

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

              <div className="flex-1 flex flex-col overflow-y-auto">
                <div className="border-b border-gray-200">
                  <div className="px-4 py-3 bg-gray-50 text-sm font-semibold text-gray-600 uppercase tracking-wide">
                    Categories
                  </div>
                  {categories.map((category) => (
                    <div key={category.id} className="border-b border-gray-100">
                      <button
                        onClick={() => {
                          setOpenCategory(
                            openCategory === category.id ? null : category.id
                          );
                        }}
                        className={`w-full flex justify-between items-center px-6 py-3 text-left transition ${pathname.startsWith(`/${createSlug(category.name)}`)
                            ? "text-gray-900 font-bold"
                            : "text-gray-700 hover:bg-gray-50"
                          }`}
                      >
                        <span>{category.name}</span>
                        <ChevronDown
                          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${openCategory === category.id ? "rotate-180" : ""
                            }`}
                        />
                      </button>

                      <AnimatePresence>
                        {openCategory === category.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden bg-white"
                          >
                            <Link
                              href={`/${createSlug(category.name)}`}
                              className={`block pl-10 pr-6 py-3 font-medium transition ${pathname === `/${createSlug(category.name)}`
                                  ? "text-gray-900 font-bold"
                                  : "text-gray-800 hover:bg-gray-50"
                                }`}
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              All {category.name}
                            </Link>

                            {category.subcategories.length > 0 ? (
                              category.subcategories.map((sub) => (
                                <Link
                                  key={sub.id}
                                  href={`/${createSlug(
                                    category.name
                                  )}/${createSlug(sub.name)}`}
                                  className={`block pl-10 pr-6 py-3 transition ${pathname ===
                                      `/${createSlug(category.name)}/${createSlug(
                                        sub.name
                                      )}`
                                      ? "text-gray-900 font-bold"
                                      : "text-gray-600 hover:bg-gray-50"
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

                <div className="flex-1">
                  {navigationLinks.map((link, index) => (
                    <Link
                      key={index}
                      href={link.href}
                      className={`block px-4 py-3 border-b border-gray-100 font-medium transition ${pathname === link.href
                          ? "text-gray-900 bg-gray-50 font-bold"
                          : "text-gray-700 hover:bg-gray-50"
                        }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {link.name}
                    </Link>
                  ))}
                  <Link
                    href="/vendor-listing"
                    className={`block px-4 py-3 font-semibold border-b border-gray-100 transition relative overflow-hidden shine-effect ${pathname === "/vendor-listing"
                        ? "text-gray-900 bg-gray-50 font-bold"
                        : "hover:bg-gray-50"
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
                      style={{ boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)" }}
                    />
                    <span className="shine-overlay"></span>
                  </Link>
                  <Link
                    href="/contact"
                    className={`block px-4 py-3 border-b border-gray-100 font-medium transition ${pathname === "/contact"
                        ? "text-gray-900 bg-gray-50 font-bold"
                        : "text-gray-700 hover:bg-gray-50"
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
                      className={`block px-4 py-3 font-semibold border-b border-gray-100 transition ${pathname.includes("/vendor/dashboard")
                          ? "text-gray-900 bg-gray-50 font-bold"
                          : "text-gray-700 hover:bg-gray-50"
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
                      className="block w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 border-b border-gray-100 font-medium transition bg-transparent"
                    >
                      Become a Vendor
                    </button>
                  )}
                  <Link
                    href="/services/subscription-plan"
                    className={`block px-4 py-3 border-b border-gray-100 font-medium transition ${pathname === "/services/subscription-plan"
                        ? "text-gray-900 bg-gray-50 font-bold"
                        : "text-gray-700 hover:bg-gray-50"
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

      <VendorRegistrationDrawer
        open={vendorDrawerOpen}
        onClose={() => setVendorDrawerOpen(false)}
      />
    </header>
  );
}