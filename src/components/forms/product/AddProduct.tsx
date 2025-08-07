"use client";
import { useEffect, useState } from "react";
import { ChevronDown, X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

// Dummy data for categories and subcategories
const categories = [
  { value: "forklift", label: "Forklift" },
  { value: "pallet", label: "Pallet" },
];

const subCategoriesMap: Record<string, { value: string; label: string }[]> = {
  forklift: [
    { value: "electric-forklift", label: "Electric Forklift" },
    { value: "diesel-forklift", label: "Diesel Forklift" },
  ],
  pallet: [
    { value: "hand-pallet", label: "Hand Pallet" },
    { value: "electric-pallet", label: "Electric Pallet" },
  ],
};

// Dummy input fields mapping for subcategories
const subCategoryFields: Record<
  string,
  { name: string; label: string; placeholder?: string; type?: string }[]
> = {
  "electric-forklift": [
    { name: "voltage", label: "Voltage (V)", placeholder: "Voltage" },
    { name: "capacity", label: "Capacity (AH)", placeholder: "Capacity" },
    { name: "batteryWeight", label: "Battery Weight", placeholder: "Enter weight" },
    { name: "size", label: "Size (LxWxH in mm)", placeholder: "Enter size" },
  ],
  "diesel-forklift": [
    { name: "enginePower", label: "Engine Power (kW)", placeholder: "Engine Power" },
    { name: "fuelType", label: "Fuel Type", placeholder: "Fuel Type" },
    { name: "weight", label: "Weight", placeholder: "Enter weight" },
  ],
  "hand-pallet": [
    { name: "maxLoad", label: "Max Load (kg)", placeholder: "Max Load" },
    { name: "forkLength", label: "Fork Length (mm)", placeholder: "Fork Length" },
  ],
  "electric-pallet": [
    { name: "batteryType", label: "Battery Type", placeholder: "Battery Type" },
    { name: "runTime", label: "Run Time (hrs)", placeholder: "Run Time" },
    { name: "chargerType", label: "Charger Type", placeholder: "Charger Type" },
    { name: "weight", label: "Weight", placeholder: "Enter weight" },
  ],
};

export default function AddProductForm({ open, onClose }: Props) {
  // Prevent background scroll when drawer is open
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Form state
  const [category, setCategory] = useState<string>("");
  const [subCategory, setSubCategory] = useState<string>("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [subDropdownOpen, setSubDropdownOpen] = useState(false);

  // Reset subcategory when category changes
  useEffect(() => {
    setSubCategory("");
  }, [category]);

  // Common fields
  const [form, setForm] = useState({
    name: "",
    description: "",
    longDescription: "",
    manufacturer: "",
  });

  // Dynamic fields
  const [dynamicFields, setDynamicFields] = useState<Record<string, string>>({});

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Handle dynamic field change
  const handleDynamicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDynamicFields({ ...dynamicFields, [e.target.name]: e.target.value });
  };

  // Get fields for selected subcategory
  const extraFields = subCategoryFields[subCategory] || [];

  // Reset all on close
  useEffect(() => {
    if (!open) {
      setCategory("");
      setSubCategory("");
      setForm({
        name: "",
        description: "",
        longDescription: "",
        manufacturer: "",
      });
      setDynamicFields({});
    }
  }, [open]);

  return (
    <div
      className={`fixed inset-0 z-50 transition-all duration-300 ${
        open ? "pointer-events-auto" : "pointer-events-none"
      }`}
      aria-modal="true"
      role="dialog"
    >
      {/* Overlay */}
      <div
        className={`absolute inset-0 bg-black/30 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />
      {/* Drawer */}
      <div
        className={`absolute right-0 top-0 h-full w-full max-w-xl bg-white shadow-xl transition-transform duration-300 flex flex-col ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Close Button */}
        <button
          className="absolute right-6 top-6 text-2xl text-gray-700 hover:text-black"
          onClick={onClose}
          aria-label="Close"
        >
          <X className="w-7 h-7" />
        </button>
        {/* Content */}
        <form
          className="flex flex-col flex-1 h-full"
          onSubmit={e => {
            e.preventDefault();
            // handle submit here
          }}
        >
          <div className="p-8 pt-14 flex-1 overflow-y-auto">
            <h2 className="text-2xl font-bold mb-8">Add Product</h2>
            <form
              className="flex flex-col gap-6"
              onSubmit={e => {
                e.preventDefault();
                // handle submit here
              }}
            >
              {/* Category & Subcategory */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="block font-medium mb-2">
                    Select category<span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      className="w-full border border-gray-200 rounded-lg px-4 py-3 text-left bg-white flex items-center justify-between focus:outline-none"
                      onClick={() => setDropdownOpen((v) => !v)}
                    >
                      <span className={category ? "text-gray-900" : "text-gray-400"}>
                        {category
                          ? categories.find((c) => c.value === category)?.label
                          : "Select"}
                      </span>
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    </button>
                    {dropdownOpen && (
                      <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
                        {categories.map((cat) => (
                          <div
                            key={cat.value}
                            className={`px-4 py-2 cursor-pointer hover:bg-green-50 ${
                              category === cat.value ? "text-green-600 font-semibold" : ""
                            }`}
                            onClick={() => {
                              setCategory(cat.value);
                              setDropdownOpen(false);
                            }}
                          >
                            {cat.label}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <label className="block font-medium mb-2">
                    Select Product Category
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      className="w-full border border-gray-200 rounded-lg px-4 py-3 text-left bg-white flex items-center justify-between focus:outline-none"
                      onClick={() => setSubDropdownOpen((v) => !v)}
                      disabled={!category}
                    >
                      <span className={subCategory ? "text-gray-900" : "text-gray-400"}>
                        {subCategory
                          ? subCategoriesMap[category]?.find((c) => c.value === subCategory)?.label
                          : "Select sub category"}
                      </span>
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    </button>
                    {subDropdownOpen && category && (
                      <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
                        {subCategoriesMap[category]?.map((sub) => (
                          <div
                            key={sub.value}
                            className={`px-4 py-2 cursor-pointer hover:bg-green-50 ${
                              subCategory === sub.value ? "text-green-600 font-semibold" : ""
                            }`}
                            onClick={() => {
                              setSubCategory(sub.value);
                              setSubDropdownOpen(false);
                            }}
                          >
                            {sub.label}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Common Fields */}
              <div>
                <label className="block font-medium mb-2">
                  Select Name<span className="text-red-500">*</span>
                </label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-200"
                  placeholder="Enter name"
                  required
                />
              </div>
              <div>
                <label className="block font-medium mb-2">
                  Description<span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 min-h-[60px] focus:outline-none focus:ring-2 focus:ring-green-200"
                  placeholder="Minimum 100 words"
                  required
                />
              </div>
              <div>
                <label className="block font-medium mb-2">
                  Long Description<span className="text-red-500">*</span>
                </label>
                <textarea
                  name="longDescription"
                  value={form.longDescription}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 min-h-[60px] focus:outline-none focus:ring-2 focus:ring-green-200"
                  placeholder="Explain your product"
                  required
                />
              </div>
              <div>
                <label className="block font-medium mb-2">
                  Manufacturer Company Name<span className="text-red-500">*</span>
                </label>
                <input
                  name="manufacturer"
                  value={form.manufacturer}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-200"
                  placeholder="Enter name"
                  required
                />
              </div>

              {/* Dynamic Fields */}
              {extraFields.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {extraFields.map((field) => (
                    <div key={field.name}>
                      <label className="block font-medium mb-2">{field.label}</label>
                      <input
                        name={field.name}
                        value={dynamicFields[field.name] || ""}
                        onChange={handleDynamicChange}
                        className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-200"
                        placeholder={field.placeholder}
                        type={field.type || "text"}
                      />
                    </div>
                  ))}
                </div>
              )}
            </form>
          </div>
          {/* Sticky Submit Button */}
          <div className="sticky bottom-0 left-0 w-full bg-white px-8 pb-6 pt-4 border-t border-gray-100 flex justify-end">
            <button
              type="submit"
              className="bg-[#5CA131] hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg transition"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}