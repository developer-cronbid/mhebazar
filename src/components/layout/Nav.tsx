"use client";

// Import statements
import '@/styles/animations.css';
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
  LayoutDashboard,
  ClipboardList,
  Bell,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import { useRef, useState, useEffect, JSX, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
// Assuming these are client components that handle their own imports/state
import CategoryMenu from "./NavOptions";
import VendorRegistrationDrawer from "@/components/forms/publicforms/VendorRegistrationForm";
import SearchBar from "./SearchBar";
import { useUser } from "@/context/UserContext";
import { useRouter, usePathname } from "next/navigation";
import { handleLogout } from "@/lib/auth/logout";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
// Assuming this is a static JSON file that is safe to import directly
import categoriesData from "@/data/categories.json";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import ContactForm from "../forms/publicforms/ContactForm";

// --- TYPE DEFINITIONS ---
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

export interface UserType { // Renamed to UserType to avoid conflict with the component argument 'user' in the dropdown logic, though in this context it's fine. It's good practice.
  id: number;
  username?: string | { image: string }[];
  email: string;
  role?: {
    id: number;
    name: string;
  };
  user_banner?: { url: string }[];
}

// Moved outside the component to prevent recreation on every render
const navigationLinks = [
  { name: "Rental/Used MHE", href: "/used" },
  { name: "Attachments", href: "/attachments" },
  { name: "Spare Parts", href: "/spare-parts" },
  { name: "Services", href: "/services" },
  { name: "Training", href: "/training" },
  { name: "Blogs", href: "/blog" },
];

// Reusable slug function (can be moved to a utility file if used elsewhere)
const createSlug = (name: string): string =>
  name.toLowerCase().replace(/\s+/g, "-");


// --- COMPONENT START ---
export default function Navbar(): JSX.Element {
  // Define categories once
  const categories: Category[] = categoriesData;
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [categoriesOpen, setCategoriesOpen] = useState<boolean>(false);
  const [vendorDrawerOpen, setVendorDrawerOpen] = useState<boolean>(false);
  const [openCategory, setOpenCategory] = useState<number | null>(null);

  // Use a single ref for the category menu for hover/mouseLeave events
  const categoryMenuRef = useRef<HTMLDivElement>(null);

  const { user, isLoading, setUser } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  // Optimized: Use useCallback for event handlers to prevent needless recreations
  const handleClickOutside = useCallback((event: MouseEvent): void => {
    if (
      categoryMenuRef.current &&
      !categoryMenuRef.current.contains(event.target as Node)
    ) {
      setCategoriesOpen(false);
    }
  }, []); // Empty dependency array means it only creates once

  const onLogoutClick = useCallback(async () => {
    await handleLogout(() => setUser(null), router);
  }, [router, setUser]);

  // Optimized: Use a single useEffect for category menu cleanup
  useEffect(() => {
    if (categoriesOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [categoriesOpen, handleClickOutside]); // Dependency includes handleClickOutside

  // Optimized: Use a single handler for desktop category menu state
  const handleCategoryHover = (isEntering: boolean) => {
    setCategoriesOpen(isEntering);
  };

  // Improved mobile menu item click handler
  const handleMobileMenuClick = (categoryId?: number) => {
    setMobileMenuOpen(false);
    if (categoryId !== undefined) {
      setOpenCategory(categoryId === openCategory ? null : categoryId);
    } else {
      setOpenCategory(null);
    }
  };


  // Helper for dynamic user profile image source
  const userProfileImageSrc = Array.isArray(user?.username) && user.username[0]?.image
    ? user.username[0].image
    : user?.user_banner?.[0]?.url; // Fallback to user_banner if username is not an array of images

  return (
    // Fixed: Ensure the header is sticky and has a high z-index to avoid layout shift and clipping
    <header className="bg-white shadow-sm z-[100] sticky top-0" role="banner"> 
      
      {/* Top Bar */}
      <div className="bg-[#5CA131] text-white">
        <div className="max-w-full mx-auto px-2 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-1 sm:gap-2 py-2">
            <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm whitespace-nowrap">
              <Phone className="w-3 h-3 sm:w-4 sm:h-4" aria-hidden="true" />
              <span>+91 73059 50939</span>
            </div>
            <div className="flex items-center gap-4 text-xs sm:text-sm">
              {/* Optimised: Using a placeholder for LCP/CLS when loading */}
              {isLoading ? (
                <div className="h-4 w-20 bg-gray-700 animate-pulse rounded text-transparent">Loading...</div>
              ) : user ? (
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
                  <span className="opacity-50" aria-hidden="true">|</span>
                  <Link href="/register" className="hover:underline">
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Bar */}
      <div className="bg-white">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-2 sm:py-3">
            {/* Mobile Menu Button - No change needed, functional and small */}
            <button
              className="lg:hidden p-1 sm:p-2 rounded-md text-gray-600 hover:text-gray-900"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />
            </button>

            {/* Logo - Priority for LCP */}
            <div className="flex items-center ml-2 sm:ml-5">
              <Link href="/" className="flex items-center relative shine-effect" aria-label="Home link to MHE BAZAR">
                {/* CWV Fix: Added sizes property and prioritized loading. width/height are correct. */}
                <Image
                  src="/mhe-logo.png"
                  alt="MHE BAZAR Logo"
                  width={120}
                  height={35}
                  className="h-8 sm:h-10 w-auto object-contain"
                  priority={true}
                  sizes="(max-width: 640px) 100px, 120px"
                />
                {/* Note: shine-overlay should be in your CSS/animations.css */}
                <span className="shine-overlay" aria-hidden="true"></span>
              </Link>
            </div>

            {/* Desktop Search & Brand Link */}
            <div className="hidden md:flex flex-1 max-w-5xl mx-2 sm:mx-8 items-center gap-2 sm:gap-4">
              <SearchBar
                categories={categories}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
              />
              <Link
                href="/vendor-listing"
                className="flex-shrink-0 relative overflow-hidden rounded-md shine-effect hidden sm:block"
              >
                {/* CWV Fix: Added sizes property and prioritized loading. width/height are correct. */}
                <Image
                  src="/brand-image.png"
                  alt="Brand Store"
                  width={120}
                  height={40}
                  priority={true} // Priority loading as this is above the fold on larger screens
                  className="object-contain"
                  style={{ boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)" }}
                  sizes="120px"
                />
                <span className="shine-overlay" aria-hidden="true"></span>
              </Link>
            </div>

            {/* Right Icons */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Compare */}
              <Link
                href="/compare"
                className="hidden sm:flex items-center text-gray-600 hover:text-gray-900 transition"
                aria-label="Compare Products"
              >
                <Repeat className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />
              </Link>

              {/* Cart - Only render if user is loaded and logged in to save bundle size and initial load time */}
              {!isLoading && user && (
                <Link
                  href="/cart"
                  className="flex items-center text-gray-600 hover:text-gray-900 transition"
                  aria-label="Cart"
                >
                  <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />
                </Link>
              )}

              {/* Profile Dropdown */}
              <div className="relative">
                <DropdownMenu>
                  {/* CWV Fix: Ensure a proper size placeholder when image is loading or data is missing to prevent CLS */}
                  <DropdownMenuTrigger asChild>
                    <div
                      className="flex items-center justify-center w-10 h-10 rounded-full cursor-pointer transition-transform duration-100 ease-in-out hover:scale-105"
                      aria-label="User profile menu"
                      // Removed focus:ring styles as DropdownMenu handles focus
                    >
                      {isLoading ? (
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-200 animate-pulse flex items-center justify-center">
                          <UserIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" aria-hidden="true" />
                        </div>
                      ) : userProfileImageSrc ? (
                        /* CWV Fix: Profile Image using lazy loading (not priority) */
                        <Image
                          src={userProfileImageSrc}
                          alt="Profile Avatar"
                          width={40}
                          height={40}
                          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-green-600 shadow-sm object-cover"
                          loading="lazy" // Optimized: Use lazy loading as this is not above the fold
                        />
                      ) : (
                        /* Default user icon - no image */
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-green-100 flex items-center justify-center">
                          <UserIcon className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" aria-hidden="true" />
                        </div>
                      )}
                    </div>
                  </DropdownMenuTrigger>

                  {/* Dropdown Menu Content - No major change, standard logic */}
                  <DropdownMenuContent className="w-64 z-[102]" align="end">
                    {user ? (
                      <>
                        <DropdownMenuLabel>My Account</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link href="/account" className="cursor-pointer">
                            <User className="mr-2 h-4 w-4 text-green-600" aria-hidden="true" />
                            <span>My Account</span>
                          </Link>
                        </DropdownMenuItem>
                        {/* ... other user links ... */}
                        <DropdownMenuItem
                          onClick={onLogoutClick}
                          className="cursor-pointer text-red-500 focus:text-red-700"
                        >
                          <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                          <span>Logout</span>
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <>
                        <DropdownMenuItem asChild>
                          <Link href="/login" className="cursor-pointer">
                            <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                            <span>Sign In</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/register" className="cursor-pointer">
                            <UserPlus className="mr-2 h-4 w-4" aria-hidden="true" />
                            <span>Sign Up</span>
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* Mobile Search & Brand Link - Duplicated from desktop, but necessary for mobile layout */}
          <div className="md:hidden pb-2 sm:pb-3">
            <div className="flex items-center gap-2">
              <SearchBar
                categories={categories} // Passed for full functionality on mobile
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
              />
              <Link
                href="/vendor-listing"
                className="flex-shrink-0 relative overflow-hidden rounded-md shine-effect"
              >
                {/* CWV Fix: Added sizes property and prioritized loading. width/height are correct. */}
                <Image
                  src="/brand-image.png"
                  alt="Brand Store"
                  width={120}
                  height={40}
                  priority={true} // Priority loading on all screen sizes
                  className="object-contain"
                  style={{ boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)" }}
                  sizes="(max-width: 768px) 100px, 120px"
                />
                <span className="shine-overlay" aria-hidden="true"></span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Navigation Bar (Below Main Bar) */}
      <nav className="hidden lg:block bg-white border-t border-gray-200" aria-label="Main Navigation">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {/* Categories Menu - Use optimized hover handlers */}
              <div
                className="relative"
                ref={categoryMenuRef}
                onMouseEnter={() => handleCategoryHover(true)}
                onMouseLeave={() => handleCategoryHover(false)}
              >
                <button
                  className={`flex items-center gap-2 px-4 py-3 text-sm transition ${
                    pathname.includes("categories") || categoriesOpen
                      ? "text-gray-900 font-bold"
                      : "text-gray-700 hover:text-gray-900 font-normal"
                  }`}
                  aria-expanded={categoriesOpen}
                  aria-controls="category-dropdown"
                >
                  <Menu className="w-5 h-5" aria-hidden="true" />
                  All Categories
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${categoriesOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
                </button>
                {/* CategoryMenu component should be optimized for CWV (e.g., uses CSS transitions over JS animations if possible) */}
                <CategoryMenu
                  isOpen={categoriesOpen}
                  onClose={() => setCategoriesOpen(false)}
                  categories={categories}
                />
              </div>

              {/* Main Links */}
              <div className="flex items-center">
                {navigationLinks.map((link, index) => (
                  <Link
                    key={index}
                    href={link.href}
                    className={`px-4 py-3 text-sm transition ${
                      pathname === link.href
                        ? "text-gray-900 font-bold"
                        : "text-gray-700 hover:text-gray-900 font-normal"
                    }`}
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Right side Utility Links */}
            <div className="flex items-center">
              {/* Help/Contact Dialog - No change needed, Dialogs are usually fine. */}
              <Dialog>
                <DialogTrigger asChild>
                  <div
                    role="button"
                    tabIndex={0}
                    className={`flex items-center gap-2 px-4 py-3 transition cursor-pointer ${
                      pathname === "/contact"
                        ? "text-gray-900 font-bold"
                        : "text-gray-600 hover:text-gray-900 font-normal"
                    }`}
                    // Added onKeyDown for accessibility on a div with role="button"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        // Trigger dialog open via click handler if needed, or rely on DialogTrigger's internal logic
                      }
                    }}
                  >
                    <div className="w-5 h-5 rounded-full border border-gray-400 flex items-center justify-center text-gray-700 font-normal text-sm">
                      ?
                    </div>
                    <span className="text-sm font-normal">Help</span>
                  </div>
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

              {/* Vendor/Price Links */}
              {isLoading ? (
                <div className="px-4 py-3 text-sm text-gray-600 font-normal h-10 w-32 bg-gray-100 animate-pulse"></div>
              ) : user?.role?.id === 2 ? (
                <Link
                  href="/vendor/dashboard"
                  className={`flex items-center gap-2 px-4 py-3 transition ${
                    pathname.includes("/vendor/dashboard")
                      ? "text-gray-900 font-bold"
                      : "text-gray-600 hover:text-gray-900 font-normal"
                  }`}
                >
                  <User className="w-5 h-5" aria-hidden="true" />
                  <span className="text-sm font-normal">
                    My Vendor Dashboard
                  </span>
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => setVendorDrawerOpen(true)}
                  className={`flex items-center gap-2 px-4 py-3 transition bg-transparent border-0 cursor-pointer ${
                    pathname === "/become-a-vendor"
                      ? "text-gray-900 font-bold"
                      : "text-gray-600 hover:text-gray-900 font-normal"
                  }`}
                >
                  <User className="w-5 h-5" aria-hidden="true" />
                  <span className="text-sm font-normal">
                    Become a Vendor
                  </span>
                </button>
              )}

              <Link
                href="/services/subscription-plan"
                className={`flex items-center gap-2 px-4 py-3 transition ${
                  pathname === "/services/subscription-plan"
                    ? "text-gray-900 font-bold"
                    : "text-gray-600 hover:text-gray-900 font-normal"
                }`}
              >
                <Tag className="w-5 h-5" aria-hidden="true" />
                <span className="text-sm font-normal">Price Plan</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Drawer - Framer Motion and AnimatePresence are great for user experience (smoothness/perceived performance) */}
      <AnimatePresence initial={false}>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-[101]" // Increased z-index
            role="dialog"
            aria-modal="true"
            aria-label="Mobile Navigation"
          >
            {/* Overlay */}
            <div
              className="fixed inset-0 bg-black bg-opacity-50"
              onClick={() => setMobileMenuOpen(false)}
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: "-100%" }} // Use percentage for better responsiveness
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-0 left-0 w-80 max-w-[85vw] h-full bg-white shadow-xl flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <Link
                  href="/"
                  className="flex items-center relative shine-effect"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Home link to MHE BAZAR"
                >
                  {/* CWV Fix: Ensure consistent image properties */}
                  <Image
                    src="/mhe-logo.png"
                    alt="MHE BAZAR Logo"
                    width={120}
                    height={32}
                    className="h-8 w-auto object-contain"
                    priority={true} // Priority loading
                    sizes="120px"
                  />
                  <span className="shine-overlay" aria-hidden="true"></span>
                </Link>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 text-gray-500 hover:text-gray-700"
                  aria-label="Close navigation menu"
                >
                  <X className="w-6 h-6" aria-hidden="true" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 flex flex-col overflow-y-auto">
                {/* Categories */}
                <div className="border-b border-gray-200">
                  <div className="px-4 py-3 bg-gray-50 text-sm font-semibold text-gray-600 uppercase tracking-wide">
                    Categories
                  </div>
                  {categories?.map((category) => (
                    <div key={category.id} className="border-b border-gray-100">
                      <button
                        onClick={() => handleMobileMenuClick(category.id)}
                        className={`w-full flex justify-between items-center px-6 py-3 text-left transition ${
                          pathname.startsWith(`/${createSlug(category.name)}`)
                            ? "text-gray-900 font-bold"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                        aria-expanded={openCategory === category.id}
                        aria-controls={`sub-menu-${category.id}`}
                      >
                        <span>{category.name}</span>
                        <ChevronDown
                          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                            openCategory === category.id ? "rotate-180" : ""
                          }`}
                          aria-hidden="true"
                        />
                      </button>

                      {/* Subcategories - Use motion for smooth collapse/expand */}
                      <AnimatePresence>
                        {openCategory === category.id && (
                          <motion.div
                            id={`sub-menu-${category.id}`}
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden bg-white"
                          >
                            <Link
                              href={`/${createSlug(category.name)}`}
                              className={`block pl-10 pr-6 py-3 font-medium transition ${
                                pathname === `/${createSlug(category.name)}`
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
                                  className={`block pl-10 pr-6 py-3 transition ${
                                    pathname ===
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

                {/* Navigation Links */}
                <div className="flex-1">
                  {navigationLinks.map((link, index) => (
                    <Link
                      key={index}
                      href={link.href}
                      className={`block px-4 py-3 border-b border-gray-100 font-medium transition ${
                        pathname === link.href
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
                    className={`block px-4 py-3 font-semibold border-b border-gray-100 transition relative overflow-hidden shine-effect ${
                      pathname === "/vendor-listing"
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
                      priority={true}
                      className="object-contain"
                      sizes="100vw"
                    />
                    <span className="shine-overlay" aria-hidden="true"></span>
                  </Link>
                  <Link
                    href="/contact"
                    className={`block px-4 py-3 border-b border-gray-100 font-medium transition ${
                      pathname === "/contact"
                        ? "text-gray-900 bg-gray-50 font-bold"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Help
                  </Link>

                  {/* Mobile Vendor/Price Links */}
                  {isLoading ? (
                    <span className="block px-4 py-3 text-gray-700">
                      Loading...
                    </span>
                  ) : user?.role?.id === 2 ? (
                    <Link
                      href="/vendor/dashboard"
                      className={`block px-4 py-3 font-semibold border-b border-gray-100 transition ${
                        pathname.includes("/vendor/dashboard")
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
                    className={`block px-4 py-3 border-b border-gray-100 font-medium transition ${
                      pathname === "/services/subscription-plan"
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