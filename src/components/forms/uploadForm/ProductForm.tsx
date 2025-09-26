// ProductForm.tsx

'use client'

import { useForm } from 'react-hook-form'
import axios from 'axios'
import { useEffect, useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { FileText, Image as ImageIcon, Package, AlertCircle, X, Loader2 } from 'lucide-react'
import api from '@/lib/api'
import { useUser } from '@/context/UserContext'
import Image from 'next/image'
import { Product } from '@/types'
import { toast } from "sonner"
import Link from 'next/link'

// Helper function for SEO-friendly slug
const slugify = (text: string): string => {
  return (text || '')
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/-+$/, '')
}

type FieldOption = {
  label: string
  value: string
}

type ProductDetailField = {
  name: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'radio' | 'checkbox'
  required: boolean
  options?: FieldOption[]
  placeholder?: string
}

type Category = {
  id: number
  name: string
  subcategories: Subcategory[]
  product_details: ProductDetailField[]
}

type Subcategory = {
  id: number
  name: string
  product_details: ProductDetailField[]
}

type ProductImage = {
    id: number;
    image: string; // URL path to the image
    product: number;
}

type ProductFormData = {
  category: string;
  subcategory: string;
  name: string;
  description?: string;
  meta_title?: string;
  meta_description?: string;
  manufacturer?: string;
  model?: string;
  price: string;
  type: string[];
  direct_sale: boolean;
  hide_price: boolean;
  online_payment: boolean;
  stock_quantity: number;
  brochure?: FileList;
  images?: FileList;
  product_details: Record<string, string>;
}

const TYPE_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'used', label: 'Used' },
  { value: 'rental', label: 'Rental' },
  { value: 'attachments', label: 'Attachments' },
]

interface ProductFormProps {
  product?: Product;
  onSuccess?: () => void;
}

export default function ProductForm({ product, onSuccess }: ProductFormProps) {
  const [defaultCategory, setDefaultCategory] = useState<string>('')
  const [defaultSubcategory, setDefaultSubcategory] = useState<string>('')
  const [imageFiles, setImageFiles] = useState<File[]>([])
  // ✅ FIX: Added the missing state for the new brochure file
  const [brochureFile, setBrochureFile] = useState<File | null>(null)
  
  // Adjusted Product type for clarity on images
  const [existingImages, setExistingImages] = useState<ProductImage[]>(
    (product?.images as ProductImage[]) || []
  ); 
  const [keptBrochureUrl, setKeptBrochureUrl] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    resetField,
    formState: { errors },
  } = useForm<ProductFormData>({
    defaultValues: product
      ? {
        category: String(product.category),
        subcategory: product.subcategory ? String(product.subcategory) : '',
        name: product.name,
        description: product.description,
        meta_title: product.meta_title,
        meta_description: product.meta_description,
        manufacturer: product.manufacturer,
        model: product.model,
        price: product.price,
        type: Array.isArray(product.type) ? product.type : [],
        direct_sale: product.direct_sale,
        hide_price: product.hide_price,
        online_payment: product.online_payment,
        stock_quantity: product.stock_quantity,
        product_details: typeof product.product_details === 'string'
          ? JSON.parse(product.product_details || '{}')
          : product.product_details || {},
      }
      : {
        direct_sale: true,
        hide_price: false,
        online_payment: false,
        stock_quantity: 1,
        type: ['new'],
        price: '0.00',
        category: '',
        subcategory: '',
      },
  })

  const [categories, setCategories] = useState<Category[]>([])
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [dynamicFields, setDynamicFields] = useState<ProductDetailField[]>([])
  const [dynamicValues, setDynamicValues] = useState<Record<string, string>>(() => {
    if (product && typeof product.product_details === 'string') {
      return JSON.parse(product.product_details || '{}');
    }
    return product?.product_details || {};
  });

  const selectedCategoryId = watch('category')
  const selectedSubcategoryId = watch('subcategory')
  const productName = watch('name');
  const productManufacturer = watch('manufacturer');
  const productModel = watch('model');
  const { user } = useUser();

  const hasSelectedRequiredFields = selectedCategoryId &&
    (!subcategories.length || (subcategories.length > 0 && selectedSubcategoryId))

  const [warning, setWarning] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true)
        const response = await axios.get(`${API_BASE_URL}/categories/`)
        const categoriesData = response.data?.results || response.data || []

        if (Array.isArray(categoriesData)) {
          setCategories(categoriesData)
          if (product?.category) {
            const categoryId = String(product.category);
            setDefaultCategory(categoryId)
            setValue('category', categoryId)
          }
        } else {
          setCategories([])
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
        setCategories([])
        toast.error('Failed to load categories')
      } finally {
        setLoading(false)
      }
    }
    fetchCategories()
  }, [product, setValue, API_BASE_URL])

  // Handle category change (sets subcategories and initial dynamic fields)
  useEffect(() => {
    if (!selectedCategoryId) return

    const selectedCat = categories.find((cat) => String(cat.id) === selectedCategoryId)
    if (!selectedCat) return

    const subs = selectedCat.subcategories || []
    setSubcategories(subs)

    // Preserve subcategory if it exists on the product for edit mode
    let subToSet = '';
    if (product?.subcategory && subs.some(sub => String(sub.id) === String(product.subcategory))) {
        subToSet = String(product.subcategory);
    } else if (subs.length > 0) {
        // If categories switch, clear subcategory
        resetField('subcategory');
    }
    
    // Set default/existing subcategory only if available
    setDefaultSubcategory(subToSet);
    if (subToSet) setValue('subcategory', subToSet);

    // Set dynamic fields
    if (subs.length === 0) {
      const catDetails = selectedCat.product_details || []
      setDynamicFields(catDetails)
      setWarning(catDetails.length > 0 ? '' : 'No product details defined in this category.')
    } else if (!subToSet) {
      setDynamicFields([])
      setWarning('Select a subcategory to load product details.')
    }
    // If a subcategory is selected, the next effect handles dynamic fields
  }, [selectedCategoryId, categories, resetField, product, setValue])

  // Handle subcategory change (sets dynamic fields)
  useEffect(() => {
    if (!selectedSubcategoryId) {
        // Fallback to category-level details if no subcategory is selected and none exist
        const selectedCat = categories.find((cat) => String(cat.id) === selectedCategoryId)
        if (selectedCat && selectedCat.subcategories.length === 0) {
            const catDetails = selectedCat.product_details || []
            setDynamicFields(catDetails)
            setWarning(catDetails.length > 0 ? '' : 'No product details defined in this category.')
        }
        return;
    }

    const sub = subcategories.find((s) => String(s.id) === selectedSubcategoryId)
    if (!sub) return

    const subDetails = sub.product_details || []
    setDynamicFields(subDetails)
    setWarning(subDetails.length > 0 ? '' : 'No product details defined in this subcategory.')
  }, [selectedSubcategoryId, subcategories, selectedCategoryId, categories])

  const handleDynamicValueChange = (fieldName: string, value: string) => {
    setDynamicValues(prev => ({
      ...prev,
      [fieldName]: value
    }))
  }

  // Initialize kept brochure URL and existing images
  useEffect(() => {
    if (product?.brochure) {
      setKeptBrochureUrl(product.brochure);
    }
    if (product?.images) {
        // Safe type assertion for initial existing images
        setExistingImages(product.images as ProductImage[]); 
    }
  }, [product])

  const onSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true);
    const formData = new FormData();

    if (user?.id) formData.append("user", String(user.id));
    formData.append('category', data.category);
    // Send null or empty string if subcategory is not selected/available
    formData.append('subcategory', data.subcategory || ''); 
    formData.append('name', data.name);
    formData.append('description', data.description || '');
    formData.append('meta_title', data.meta_title || '');
    formData.append('meta_description', data.meta_description || '');
    formData.append('manufacturer', data.manufacturer || '');
    formData.append('model', data.model || '');
    formData.append('price', data.price);
    // The DRF view expects a JSON string for the 'type' JSONField
    formData.append('type', JSON.stringify(data.type || [])); 
    formData.append('direct_sale', String(data.direct_sale));
    formData.append('hide_price', String(data.hide_price));
    formData.append('online_payment', String(data.online_payment));
    formData.append('stock_quantity', String(data.stock_quantity));
    formData.append('product_details', JSON.stringify(dynamicValues));

    let productId: number | undefined;

    try {
      const method = product ? 'patch' : 'post'; // Use patch for updates to only send partial data
      const url = product ? `/products/${product.id}/` : '/products/';
      const productResponse = await api[method](url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      productId = product?.id || productResponse.data.id;

      // --- File Uploads (Brochure and Images) ---

      // 1. Brochure Upload/Update
      if (brochureFile) {
        const brochureFormData = new FormData()
        brochureFormData.append('brochure', brochureFile)
        const brochureUrl = `/products/${productId}/upload_brochure/`
        try {
          // Use POST for the upload_brochure custom action
          await api.post(brochureUrl, brochureFormData, { headers: { 'Content-Type': 'multipart/form-data' } })
          setKeptBrochureUrl(brochureFile.name) // Update kept URL locally
          setBrochureFile(null) // Clear new file state
          toast.success("Brochure uploaded successfully")
        } catch (brochureError) {
          console.error("Failed to upload brochure:", brochureError)
          toast.error("Failed to upload brochure")
        }
      }
      
      // 2. New Images Upload
      if (imageFiles.length > 0) {
        const imagesFormData = new FormData()
        // Use 'images' as the key to match ProductViewSet.upload_images
        imageFiles.forEach((img) => imagesFormData.append('images', img)) 
        const imagesUrl = `/products/${productId}/upload_images/`;
        try {
          // Use POST for the upload_images custom action
          const response = await api.post(imagesUrl, imagesFormData, { headers: { 'Content-Type': 'multipart/form-data' } })
          // Update the list of existing images with the new ones from the response
          setExistingImages(prev => [...prev, ...response.data]); 
          setImageFiles([]); // Clear new file selection state
          toast.success("New images uploaded successfully")
        } catch (imagesError) {
          console.error("Failed to upload images:", imagesError)
          toast.error("Failed to upload new images")
        }
      }

      toast.success(
        product ? "Product Updated" : "Product Created",
        {
          description: "Your product has been saved successfully!",
          duration: 3000,
        }
      )
      // Call onSuccess to close the sheet/modal if provided
      if (onSuccess) onSuccess(); 
    } catch (error) {
      console.error(error)
      toast.error(
        product ? "Failed to update product" : "Failed to create product",
        {
          description: "Something went wrong. Please check the form and try again.",
          duration: 3000,
        }
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBrochureChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === 'application/pdf') {
      setBrochureFile(file)
      setKeptBrochureUrl(null); // Clear existing brochure link if a new one is selected
    } else {
      setBrochureFile(null);
      toast.warning('Please select a valid PDF file for the brochure.')
    }
  }

  const handleImagesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      const validImages = Array.from(files).filter(file => file.type.startsWith('image/'))
      if (validImages.length !== files.length) {
        toast.warning('Some files were not images and were skipped.')
      }
      setImageFiles(prev => [...prev, ...validImages])
      // Clear the input value so the same file can be selected again
      event.target.value = ''; 
    }
  }

  const removeBrochure = () => {
    setBrochureFile(null)
    const input = document.getElementById('brochure-input') as HTMLInputElement
    if (input) input.value = ''
  }

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, idx) => idx !== index))
  }


  const removeExistingImage = async (imageId: number) => {
    if (!product?.id) return;

    // ✅ FIX: Added Confirmation Prompt
    const confirmation = window.confirm(
      "Warning: This action cannot be reversed. Are you sure you want to permanently delete this image?"
    );

    if (!confirmation) {
      return; // Stop deletion if user cancels
    }

    try {
      // Use the 'delete-images' custom action endpoint and send image_ids in the 'data' payload
      await api.delete(`/products/${product.id}/delete-images/`, { data: { image_ids: [imageId] } })
      
      // Update local state to remove the image from the display list
      setExistingImages(prev => prev.filter(img => img.id !== imageId)) 
      toast.success('Image removed successfully')
    } catch (error) {
      console.error('Failed to remove image:', error)
      toast.error('Failed to remove image')
    }
  }

  const removeExistingBrochure = async () => {
    if (!product?.id) return
    try {
      // Use the 'delete-brochure' custom action endpoint (DELETE method)
      await api.delete(`/products/${product.id}/delete-brochure/`)
      setKeptBrochureUrl(null);
      toast.success('Brochure removed successfully')
    } catch (error) {
      console.error('Failed to remove brochure:', error)
      toast.error('Failed to remove brochure')
    }
  }

  const renderDynamicField = (field: ProductDetailField) => {
    // Corrected dynamic values handling to prevent type errors
    const fieldValue = dynamicValues[field.name];

    switch (field.type) {
      case 'text':
        return (
          <Input
            className="h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-sm"
            placeholder={field.placeholder}
            value={fieldValue || ''}
            onChange={(e) => handleDynamicValueChange(field.name, e.target.value)}
            required={field.required}
          />
        )
      case 'textarea':
        return (
          <Textarea
            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 min-h-[80px] text-sm resize-none"
            placeholder={field.placeholder}
            value={fieldValue || ''}
            onChange={(e) => handleDynamicValueChange(field.name, e.target.value)}
            required={field.required}
          />
        )
      case 'select':
        return (
          <Select
            onValueChange={(value) => handleDynamicValueChange(field.name, value)}
            value={fieldValue || ''}
            required={field.required}
          >
            <SelectTrigger className="h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-sm">
              <SelectValue placeholder={`Select ${field.label}`} />
            </SelectTrigger>
            <SelectContent>
              {Array.isArray(field.options) && field.options.length > 0 ? (
                field.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))
              ) : (
                <div className="px-2 py-1 text-sm text-gray-500">
                  No options available
                </div>
              )}
            </SelectContent>
          </Select>
        )
      case 'radio':
        return (
          <RadioGroup
            onValueChange={(value: string) => handleDynamicValueChange(field.name, value)}
            value={fieldValue || ''}
            required={field.required}
            className="flex flex-col space-y-3"
          >
            {Array.isArray(field.options) && field.options.length > 0 ? (
              field.options.map((option: FieldOption) => (
                <div key={option.value} className="flex items-center space-x-3">
                  <RadioGroupItem
                    value={option.value}
                    id={`${field.name}-${option.value}`}
                    className="border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Label htmlFor={`${field.name}-${option.value}`} className="text-sm font-medium">
                    {option.label}
                  </Label>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-500">No options available</div>
            )}
          </RadioGroup>
        )
      case 'checkbox':
        return (
          <div className="flex flex-col space-y-3">
            {Array.isArray(field.options) && field.options.length > 0 ? (
              field.options.map((option) => (
                <div key={option.value} className="flex items-center space-x-3">
                  <Checkbox
                    id={`${field.name}-${option.value}`}
                    // The dynamic value stores a comma-separated string for checkboxes
                    checked={fieldValue?.split(',').includes(option.value) || false}
                    onCheckedChange={(checked: boolean | "indeterminate") => {
                      const currentValues: string[] = fieldValue?.split(',').filter(Boolean) || []
                      const newValues: string[] = checked === true
                        ? [...currentValues, option.value]
                        : currentValues.filter((v: string) => v !== option.value)
                      handleDynamicValueChange(field.name, newValues.join(','))
                    }}
                    className="border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  />
                  <Label htmlFor={`${field.name}-${option.value}`} className="text-sm font-medium">
                    {option.label}
                  </Label>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-500">No options available</div>
            )}
          </div>
        )
      default:
        return null
    }
  }


  const livePreviewUrl = useMemo(() => {
    if (productName) {
      const slug = slugify(productName);
      return `https://www.mhebazar.in/product/${slug}`;
    }
    return '';
  }, [productName]);

  const livePreviewName = useMemo(() => {
    const formattedName = `${productManufacturer || ''} ${productName || ''} ${productModel || ''}`.trim().replace(/\s+/g, ' ');
    return formattedName;
  }, [productName, productManufacturer, productModel]);

  // Determine the file name to display for the brochure
  const brochureDisplayName = useMemo(() => {
    if (brochureFile) return brochureFile.name;
    if (keptBrochureUrl) {
      // Extract file name from the URL path if it exists
      const parts = keptBrochureUrl.split('/');
      return parts[parts.length - 1] || "Existing Brochure";
    }
    return null;
  }, [brochureFile, keptBrochureUrl]);


  return (
    <div className="overflow-auto bg-white">
      <div className="max-w-md mx-auto bg-white">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h1 className="text-lg font-semibold text-gray-900">{product ? "Edit Product" : "Add Product"}</h1>
        </div>

        <div className="p-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Category Selection */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm text-gray-600 mb-1 block">
                  Select category <span className="text-red-500">*</span>
                </Label>
                <Select
                  onValueChange={(val) => {
                      setValue('category', val);
                      // Clear subcategory when category changes
                      setValue('subcategory', '');
                      setDefaultSubcategory(''); 
                  }}
                  value={selectedCategoryId || defaultCategory}
                  disabled={loading}
                  required
                >
                  <SelectTrigger className={`h-10 border-gray-300 text-sm text-gray-500 ${errors.category ? 'border-red-500' : ''}`}>
                    <SelectValue>
                      {categories.find(cat => String(cat.id) === (selectedCategoryId || defaultCategory))?.name || "Select"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(categories) && categories.length > 0 ? (
                      categories.map((cat) => (
                        <SelectItem key={cat.id} value={String(cat.id)}>
                          {cat.name}
                        </SelectItem>
                      ))
                    ) : (
                      !loading && (
                        <div className="px-2 py-1 text-sm text-gray-500">
                          No categories available
                        </div>
                      )
                    )}
                  </SelectContent>
                </Select>
                {errors.category && (
                  <p className="text-red-500 text-xs mt-1">Category is required</p>
                )}
              </div>

              {subcategories.length > 0 && (
                <div>
                  <Label className="text-sm text-gray-600 mb-1 block">
                    Select SubCategory <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    onValueChange={(val) => setValue('subcategory', val)}
                    value={watch('subcategory') || defaultSubcategory}
                    required
                  >
                    <SelectTrigger className={`h-10 border-gray-300 text-sm text-gray-500 ${errors.subcategory ? 'border-red-500' : ''}`}>
                      <SelectValue>
                        {subcategories.find(sub => String(sub.id) === (watch('subcategory') || defaultSubcategory))?.name || "Select subcategory"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {subcategories.map((sub) => (
                        <SelectItem key={sub.id} value={String(sub.id)}>
                          {sub.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.subcategory && (
                    <p className="text-red-500 text-xs mt-1">Subcategory is required</p>
                  )}
                </div>
              )}
            </div>

            {hasSelectedRequiredFields && (
              <>
                {/* Product Name */}
                <div>
                  <Label className="text-sm text-gray-600 mb-1 block">
                    Product Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    {...register('name', { required: true })}
                    placeholder="Enter product name"
                    className="h-10 border-gray-300 text-sm"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-xs mt-1">Product name is required</p>
                  )}
                  {/* Live Name and URL Preview */}
                  <div className="mt-2 text-xs text-gray-500">
                    <p>
                      <span className="font-semibold text-gray-700">Live Product Name:</span>{' '}
                      {livePreviewName || 'Enter product details to see a preview'}
                    </p>
                    <p className='truncate'>
                      <span className="font-semibold text-gray-700">Live URL:</span>{' '}
                      <Link href={livePreviewUrl} target="_blank" className="text-blue-600 hover:underline">
                        {livePreviewUrl}
                      </Link>
                    </p>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <Label className="text-sm text-gray-600 mb-1 block">Description</Label>
                  <Textarea
                    {...register('description')}
                    placeholder="Enter product description"
                    className="border-gray-300 min-h-[80px] text-sm resize-none"
                  />
                </div>

                {/* Vendor (Manufacturer) */}
                <div>
                  <Label className="text-sm text-gray-600 mb-1 block">Vendor (Manufacturer)</Label>
                  <Input
                    {...register('manufacturer')}
                    placeholder="Vendor name"
                    className="h-10 border-gray-300 text-sm"
                  />
                </div>

                {/* Model and Price */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm text-gray-600 mb-1 block">Model</Label>
                    <Input
                      {...register('model')}
                      placeholder="Model number"
                      className="h-10 border-gray-300 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600 mb-1 block">
                      Price <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      {...register('price', { required: true, valueAsNumber: false })}
                      placeholder="0.00"
                      className="h-10 border-gray-300 text-sm"
                    />
                    {errors.price && <p className="text-red-500 text-xs mt-1">Price is required</p>}
                  </div>
                </div>

                {/* SEO Information */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm text-gray-600 mb-1 block">Meta Title</Label>
                    <Input
                      {...register('meta_title')}
                      placeholder="SEO title"
                      className="h-10 border-gray-300 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600 mb-1 block">Meta Description</Label>
                    <Input
                      {...register('meta_description')}
                      placeholder="SEO description"
                      className="h-10 border-gray-300 text-sm"
                    />
                  </div>
                </div>

                {/* Type Selection */}
                <div>
                  <Label className="text-sm text-gray-600 mb-2 block">Type</Label>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                    {TYPE_OPTIONS.map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`type-${option.value}`}
                          checked={watch('type')?.includes(option.value) || false}
                          onCheckedChange={(checked) => {
                            const currentTypes = watch('type') || []
                            if (checked) {
                              setValue('type', [...currentTypes, option.value])
                            } else {
                              setValue('type', currentTypes.filter((value) => value !== option.value))
                            }
                          }}
                        />
                        <Label
                          htmlFor={`type-${option.value}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                  {errors.type && <p className="text-red-500 text-xs mt-1">At least one type is required</p>}
                </div>

                {/* Dynamic Fields */}
                {warning && (
                  <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                    <p className="text-yellow-800 text-xs">{warning}</p>
                  </div>
                )}

                {Array.isArray(dynamicFields) && dynamicFields.map((field) => (
                  <div key={field.name}>
                    <Label className="text-sm text-gray-600 mb-1 block">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    {renderDynamicField(field)}
                  </div>
                ))}

                {/* Stock and Visibility Settings */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm text-gray-600 mb-1 block">Stock Quantity</Label>
                    <Input
                      type="number"
                      {...register('stock_quantity', { valueAsNumber: true, min: 0 })}
                      className="h-10 border-gray-300 text-sm"
                    />
                  </div>
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="direct_sale"
                        checked={watch('direct_sale')}
                        onCheckedChange={(checked) => setValue('direct_sale', !!checked)}
                        className="border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                      />
                      <Label htmlFor="direct_sale" className="text-sm font-medium">Direct Sale</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="hide_price"
                        checked={watch('hide_price')}
                        onCheckedChange={(checked) => setValue('hide_price', !!checked)}
                        className="border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                      />
                      <Label htmlFor="hide_price" className="text-sm font-medium">Hide Price</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="online_payment"
                        checked={watch('online_payment')}
                        onCheckedChange={(checked) => setValue('online_payment', !!checked)}
                        className="border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                      />
                      <Label htmlFor="online_payment" className="text-sm font-medium">Online Payment</Label>
                    </div>
                  </div>
                </div>

                {/* File Upload Section */}
                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <h3 className="font-semibold text-gray-900">Media Upload</h3>

                  {/* Brochure Upload/Display */}
                  <div className='border p-3 rounded-lg'>
                      <Label className="text-sm text-gray-600 mb-2 block">Brochure (PDF Only)</Label>
                      <input
                        id="brochure-input"
                        type="file"
                        accept=".pdf"
                        style={{ display: 'none' }}
                        onChange={handleBrochureChange}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full h-10 border-gray-300 text-gray-600 text-sm"
                        onClick={() => document.getElementById('brochure-input')?.click()}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Select Brochure (PDF)
                      </Button>

                      {(brochureFile || keptBrochureUrl) && (
                        <div className="mt-3 p-3 bg-gray-50 rounded text-sm flex items-center justify-between">
                            <div className="flex items-center truncate">
                                <FileText className="w-4 h-4 mr-2 text-blue-600 flex-shrink-0" />
                                <span className="text-gray-700 truncate">
                                    {/* Use the computed display name */}
                                    {brochureDisplayName}
                                </span>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-700 h-6 p-1 ml-2 flex-shrink-0"
                                onClick={brochureFile ? removeBrochure : removeExistingBrochure}
                            >
                                <X size={14} className="mr-1" />
                                Remove
                            </Button>
                        </div>
                      )}
                  </div>


                  {/* Images Upload */}
                  <div className='border p-3 rounded-lg'>
                    <Label className="text-sm text-gray-600 mb-2 block">Product Images (Upload to add)</Label>
                    <input
                      id="images-input"
                      type="file"
                      accept="image/*"
                      multiple
                      style={{ display: 'none' }}
                      onChange={handleImagesChange}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full h-10 border-gray-300 text-gray-600 text-sm"
                      onClick={() => document.getElementById('images-input')?.click()}
                    >
                      <ImageIcon className="w-4 h-4 mr-2" />
                      Add New Product Images
                    </Button>

                    {/* New Images Preview */}
                    {imageFiles.length > 0 && (
                        <div className="mt-4">
                            <Label className="text-xs font-semibold text-gray-700 mb-1 block">New Images to Upload:</Label>
                            <div className="grid grid-cols-4 gap-2">
                                {imageFiles.map((file, idx) => (
                                <div key={idx} className="relative group aspect-square">
                                    <Image
                                    src={URL.createObjectURL(file)}
                                    alt={`New Image Preview ${idx + 1}`}
                                    fill
                                    style={{ objectFit: 'cover' }}
                                    className="rounded"
                                    />
                                    <button
                                    type="button"
                                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-100 transition-opacity z-10"
                                    onClick={() => removeImage(idx)}
                                    >
                                    <X size={10} />
                                    </button>
                                </div>
                                ))}
                            </div>
                        </div>
                    )}
                  
                    {/* Existing Images Display (for editing products) */}
                    {existingImages.length > 0 && (
                      <div className="mt-4">
                        <Label className="text-xs font-semibold text-gray-700 mb-1 block">Existing Images (Click to delete):</Label>
                        <div className="grid grid-cols-4 gap-2">
                          {existingImages.map((img) => (
                            <div key={img.id} className="relative group aspect-square">
                                <Image
                                // The image property holds the file path, we need to prefix it with the base URL if needed.
                                // In the component context, we don't have the imgUrl, but often Next.js Image handles relative paths correctly.
                                // Using the path directly from Django:
                                src={img.image} 
                                alt={product?.name || "Product Image"}
                                fill
                                style={{ objectFit: 'cover' }}
                                className="rounded"
                                />
                                <button
                                type="button"
                                onClick={() => removeExistingImage(img.id)}
                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-100 transition-opacity z-10"
                                >
                                <X size={10} />
                                </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting || !hasSelectedRequiredFields || watch('type').length === 0}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:bg-gray-300"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  {product ? "Updating Product..." : "Creating Product..."}
                </>
              ) : (
                <>
                  <Package className="w-4 h-4 mr-2" />
                  {product ? "Update Product" : "Create Product"}
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}