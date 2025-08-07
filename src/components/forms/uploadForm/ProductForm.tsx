'use client'

import { useForm } from 'react-hook-form'
import axios from 'axios'
import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { FileText, Image as ImageIcon, Package, AlertCircle, X } from 'lucide-react'
import api from '@/lib/api'
import { useUser } from '@/context/UserContext'
import Image from 'next/image'
import { Product } from '@/types'
import { toast } from "sonner"
import { useRouter } from 'next/navigation'

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
  type: string;
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
}

export default function ProductForm({ product }: ProductFormProps) {
  const router = useRouter()

  // Add defaultCategory and defaultSubcategory states
  const [defaultCategory, setDefaultCategory] = useState<string>('')
  const [defaultSubcategory, setDefaultSubcategory] = useState<string>('')

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    resetField,
    formState: { errors },
  } = useForm<ProductFormData>({
    defaultValues: product ? {
      category: String(product.category),
      subcategory: String(product.subcategory),
      name: product.name,
      description: product.description,
      meta_title: product.meta_title,
      meta_description: product.meta_description,
      manufacturer: product.manufacturer,
      model: product.model,
      price: product.price,
      type: product.type,
      direct_sale: product.direct_sale,
      hide_price: product.hide_price,
      online_payment: product.online_payment,
      stock_quantity: product.stock_quantity,
      // Safely parse product_details
      product_details: typeof product.product_details === 'string'
        ? JSON.parse(product.product_details || '{}')
        : product.product_details || {}
    } : undefined
  })

  const [categories, setCategories] = useState<Category[]>([])
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [dynamicFields, setDynamicFields] = useState<ProductDetailField[]>([])
  const [dynamicValues, setDynamicValues] = useState<Record<string, string>>({})

  // Add validation for category and subcategory
  const selectedCategoryId = watch('category')
  const selectedSubcategoryId = watch('subcategory')
  const hasSelectedRequiredFields = selectedCategoryId &&
    (!subcategories.length || (subcategories.length > 0 && selectedSubcategoryId))
  const [warning, setWarning] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [brochureFile, setBrochureFile] = useState<File | null>(null)
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(true)

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  // categories fetch
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true)
        const response = await axios.get(`${API_BASE_URL}/categories/`)

        if (Array.isArray(response.data)) {
          setCategories(response.data)
          // Set default category if editing
          if (product?.category) {
            setDefaultCategory(String(product.category))
            setValue('category', String(product.category))
          }
        } else if (response.data && Array.isArray(response.data.results)) {
          setCategories(response.data.results)
          // Set default category if editing
          if (product?.category) {
            setDefaultCategory(String(product.category))
            setValue('category', String(product.category))
          }
        } else {
          console.error('Unexpected API response format:', response.data)
          setCategories([])
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
        setCategories([])
        setMessage('Failed to load categories')
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [product, setValue])

  useEffect(() => {
    if (!selectedCategoryId) return

    const selectedCat = categories.find((cat) => String(cat.id) === selectedCategoryId)
    if (!selectedCat) return

    const subs = selectedCat.subcategories || []
    setSubcategories(subs)

    // Set subcategory values when editing
    if (product?.subcategory) {
      const subId = String(product.subcategory)
      setDefaultSubcategory(subId)
      setValue('subcategory', subId)
    } else {
      resetField('subcategory')
    }

    if (subs.length === 0) {
      const catDetails = selectedCat.product_details || []
      if (catDetails.length > 0) {
        setDynamicFields(catDetails)
        setWarning('')
      } else {
        setDynamicFields([])
        setWarning('No product details defined in this category.')
      }
    } else {
      setDynamicFields([])
      setWarning('Select a subcategory to load product details.')
    }
  }, [selectedCategoryId, categories, resetField, product, setValue])

  useEffect(() => {
    if (!selectedSubcategoryId) return

    const sub = subcategories.find((s) => String(s.id) === selectedSubcategoryId)
    if (!sub) return

    const subDetails = sub.product_details || []
    if (subDetails.length > 0) {
      setDynamicFields(subDetails)
      setWarning('')
    } else {
      setDynamicFields([])
      setWarning('No product details defined in this subcategory.')
    }
  }, [selectedSubcategoryId, subcategories])

  const handleDynamicValueChange = (fieldName: string, value: string) => {
    setDynamicValues(prev => ({
      ...prev,
      [fieldName]: value
    }))
  }

  const { user } = useUser();

  const onSubmit = async (data: ProductFormData) => {
    const formData = new FormData();

    // Add all fields to formData
    if (user?.id !== undefined) {
      formData.append("user", String(user.id));
    }
    formData.append('category', data.category);
    formData.append('subcategory', data.subcategory);
    formData.append('name', data.name);
    formData.append('description', data.description || '');
    formData.append('meta_title', data.meta_title || '');
    formData.append('meta_description', data.meta_description || '');
    formData.append('manufacturer', data.manufacturer || '');
    formData.append('model', data.model || '');
    formData.append('price', data.price);
    formData.append('type', data.type);
    formData.append('direct_sale', String(data.direct_sale));
    formData.append('hide_price', String(data.hide_price));
    formData.append('online_payment', String(data.online_payment));
    formData.append('stock_quantity', String(data.stock_quantity));
    formData.append('product_details', JSON.stringify(dynamicValues));

    try {
      setIsSubmitting(true);
      const method = product ? 'put' : 'post';
      const url = product ? `/products/${product.id}/` : '/products/';
      const productResponse = await api[method](url, formData);

      // Step 2: Upload brochure if provided
      if (brochureFile) {
        const brochureFormData = new FormData()
        brochureFormData.append('brochure', brochureFile)

        try {
          const brochureUrl = product
            ? `/products/${product.id}/update-brochure/`
            : `/products/${productResponse.data.id}/upload_brochure/`

          await api.put(brochureUrl, brochureFormData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          })
          console.log("Brochure uploaded successfully")
        } catch (brochureError) {
          console.error("Failed to upload brochure:", brochureError)
          toast.error("Failed to upload brochure")
        }
      }

      // Step 3: Upload images if provided
      if (imageFiles.length > 0) {
        const imagesFormData = new FormData()
        imageFiles.forEach((img) => imagesFormData.append('images', img))

        try {
          const imagesUrl = product
            ? `/products/${product.id}/update-images/`
            : `/products/${productResponse.data.id}/upload_images/`

          // If updating existing product, include existing image IDs to keep
          if (product) {
            const existingImageIds = product.images
              ?.map(img => img.id)
              ?.filter(Boolean) || []
            existingImageIds.forEach(id => {
              imagesFormData.append('image_ids[]', String(id))
            })
          }

          await api[product ? 'put' : 'post'](imagesUrl, imagesFormData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          })
          console.log("Images uploaded successfully")
        } catch (imagesError) {
          console.error("Failed to upload images:", imagesError)
          toast.error("Failed to upload images")
        }
      }

      // Show success toast and refresh
      toast.success(
        product ? "Product Updated" : "Product Created",
        {
          description: "Successfully processed with all files uploaded!",
          duration: 3000,
        }
      )

      // Wait for 5 seconds then refresh
      setTimeout(() => {
        if (product) {
          // Refresh the current page
          window.location.reload()
        } else {
          // Redirect to products page or refresh
          router.refresh()
          router.push('/products')
        }
      }, 3000)

    } catch (error) {
      console.error(error)
      toast.error(
        product ? "Failed to update product" : "Failed to create product",
        {
          description: "Something went wrong. Please try again.",
          duration: 3000,
        }
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  // Helper functions for file handling
  const handleBrochureChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === 'application/pdf') {
      setBrochureFile(file)
    } else {
      alert('Please select a valid PDF file')
    }
  }

  const handleImagesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      const validImages = Array.from(files).filter(file =>
        file.type.startsWith('image/')
      )
      if (validImages.length !== files.length) {
        alert('Some files were skipped. Please select only image files.')
      }
      setImageFiles(prev => [...prev, ...validImages])
    }
  }

  const removeBrochure = () => {
    setBrochureFile(null)
    // Clear the file input
    const input = document.getElementById('brochure-input') as HTMLInputElement
    if (input) input.value = ''
  }

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, idx) => idx !== index))
  }

  const removeExistingImage = async (imageId: number) => {
    try {
      await api.delete(`/products/${product?.id}/delete-images/`, {
        data: {
          image_ids: [imageId]
        }
      })
      toast.success('Image removed successfully')
      // Refresh the page to show updated images
      window.location.reload()
    } catch (error) {
      console.error('Failed to remove image:', error)
      toast.error('Failed to remove image')
    }
  }

  const removeExistingBrochure = async () => {
    if (!product?.id) return

    try {
      await api.delete(`/products/${product.id}/delete-brochure/`)
      toast.success('Brochure removed successfully')
      // Refresh the page to show updated files
      window.location.reload()
    } catch (error) {
      console.error('Failed to remove brochure:', error)
      toast.error('Failed to remove brochure')
    }
  }

  const renderDynamicField = (field: ProductDetailField) => {
    switch (field.type) {
      case 'text':
        return (
          <Input
            className="h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-sm"
            placeholder={field.placeholder}
            value={dynamicValues[field.name] || ''}
            onChange={(e) => handleDynamicValueChange(field.name, e.target.value)}
            required={field.required}
          />
        )
      case 'textarea':
        return (
          <Textarea
            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 min-h-[80px] text-sm"
            placeholder={field.placeholder}
            value={dynamicValues[field.name] || ''}
            onChange={(e) => handleDynamicValueChange(field.name, e.target.value)}
            required={field.required}
          />
        )
      case 'select':
        return (
          <Select
            onValueChange={(value) => handleDynamicValueChange(field.name, value)}
            value={dynamicValues[field.name] || ''}
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
            value={dynamicValues[field.name] || ''}
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
                    checked={dynamicValues[field.name]?.includes(option.value) || false}
                    onCheckedChange={(checked: boolean | "indeterminate") => {
                      const currentValues: string[] = dynamicValues[field.name]?.split(',').filter(Boolean) || []
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

  return (
    <div className="overflow-auto bg-white">
      <div className="max-w-md mx-auto bg-white">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h1 className="text-lg font-semibold text-gray-900">Add Product</h1>
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
                  onValueChange={(val) => setValue('category', val)}
                  value={selectedCategoryId || defaultCategory}
                  disabled={loading}
                  required
                >
                  <SelectTrigger className={`h-10 border-gray-300 text-sm text-gray-500 ${errors.category ? 'border-red-500' : ''
                    }`}>
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
                    <SelectTrigger
                      className={`h-10 border-gray-300 text-sm text-gray-500 ${errors.subcategory ? 'border-red-500' : ''
                        }`}
                    >
                      <SelectValue>
                        {subcategories.find(
                          sub => String(sub.id) === (watch('subcategory') || defaultSubcategory)
                        )?.name || "Select subcategory"}
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

            {/* Only show other fields when category (and subcategory if required) are selected */}
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

                {/* Manufacturer */}
                <div>
                  <Label className="text-sm text-gray-600 mb-1 block">Manufacturer</Label>
                  <Input
                    {...register('manufacturer')}
                    placeholder="Manufacturer name"
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
                      {...register('price', { required: true })}
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
                  <Label className="text-sm text-gray-600 mb-1 block">Type</Label>
                  <Select onValueChange={(val) => setValue('type', val)}>
                    <SelectTrigger className="h-10 border-gray-300 text-sm text-gray-500">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {TYPE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                      {...register('stock_quantity')}
                      className="h-10 border-gray-300 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="direct_sale"
                        {...register('direct_sale')}
                      />
                      <Label htmlFor="direct_sale">Direct Sale</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="hide_price"
                        {...register('hide_price')}
                      />
                      <Label htmlFor="hide_price">Hide Price</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="online_payment"
                        {...register('online_payment')}
                      />
                      <Label htmlFor="online_payment">Online Payment</Label>
                    </div>
                  </div>
                </div>

                {/* File Upload Section */}
                <div className="space-y-4">
                  {/* Brochure Upload */}
                  <div>
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
                    {brochureFile && (
                      <div className="flex items-center gap-2 mt-2 p-2 bg-gray-50 rounded text-xs">
                        <FileText className="w-3 h-3 text-gray-500" />
                        <span className="text-gray-700 flex-1 truncate">{brochureFile.name}</span>
                        <button
                          type="button"
                          className="text-red-500 hover:text-red-700"
                          onClick={removeBrochure}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Images Upload */}
                  <div>
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
                      Select Product Images
                    </Button>
                    {imageFiles.length > 0 && (
                      <div className="grid grid-cols-4 gap-2 mt-2">
                        {imageFiles.map((file, idx) => (
                          <div key={idx} className="relative group">
                            <div className="aspect-square bg-gray-100 rounded overflow-hidden">
                              <Image
                                src={URL.createObjectURL(file)}
                                alt={`Preview ${idx + 1}`}
                                fill
                                style={{ objectFit: 'cover' }}
                                className="rounded"
                              />
                            </div>
                            <button
                              type="button"
                              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => removeImage(idx)}
                            >
                              <X size={10} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Existing Files Display (for editing products) */}
                {product && product.images && product.images.length > 0 && (
                  <div className="mt-4">
                    <Label className="text-sm text-gray-600 mb-1 block">Current Images</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {product.images.map((img) => (
                        <div key={img.id} className="relative group">
                          <div className="aspect-square bg-gray-100 rounded overflow-hidden">
                            <Image
                              src={img.image}
                              alt={product.name}
                              fill
                              style={{ objectFit: 'cover' }}
                              className="rounded"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeExistingImage(img.id)}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {product?.brochure && (
                  <div className="mt-4">
                    <Label className="text-sm text-gray-600 mb-1 block">Current Brochure</Label>
                    <div className="flex items-center justify-between">
                      <a
                        href={product.brochure}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm flex items-center"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        View Brochure
                      </a>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={removeExistingBrochure}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X size={16} className="mr-1" />
                        Remove
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Submit Button - disable if required fields aren't selected */}
            <Button
              type="submit"
              disabled={isSubmitting || !hasSelectedRequiredFields}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:bg-gray-300"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating Product...
                </>
              ) : (
                <>
                  <Package className="w-4 h-4 mr-2" />
                  Create Product
                </>
              )}
            </Button>

            {message && (
              <div className={`p-3 rounded text-center text-xs ${message.includes('successfully')
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                {message}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}