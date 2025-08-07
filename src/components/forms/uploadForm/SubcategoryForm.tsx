/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useForm, useFieldArray, Controller } from 'react-hook-form'
import axios from 'axios'
import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { X, Plus, ImageIcon, Trash2 } from 'lucide-react'
import Image from 'next/image'
import Cookies from 'js-cookie'

// --- TYPE DEFINITIONS ---
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

type SubcategoryFormData = {
  category: string
  name: string
  description?: string
  meta_title?: string
  meta_description?: string
  product_details: ProductDetailField[]
}

// Type for a single category fetched from the API
type Category = {
  id: number
  name: string
}

// Type for the subcategory data passed as a prop for editing
type SubcategoryProp = {
  id: number
  name: string
  category: { id: number; name: string } | number // Can be a full object or just an ID
  description?: string
  meta_title?: string
  meta_description?: string
  sub_image?: string // URL of the existing image
  sub_banner?: string // URL of the existing banner
  product_details: ProductDetailField[] | string // Can be an array or a JSON string
}

// --- COMPONENT PROPS ---
interface SubcategoryFormProps {
  subcategory?: SubcategoryProp
  onSuccess: () => void
}

export default function SubcategoryForm({ subcategory, onSuccess }: SubcategoryFormProps) {
  // --- FORM & STATE INITIALIZATION ---
  const isEditMode = !!subcategory

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<SubcategoryFormData>({
    defaultValues: {
      name: '',
      description: '',
      meta_title: '',
      meta_description: '',
      product_details: [],
    },
  })

  const { fields, append, remove, update } = useFieldArray({
    control,
    name: 'product_details',
  })

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

  const [categories, setCategories] = useState<Category[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

  // State for image files and previews
  const [subImageFile, setSubImageFile] = useState<File | null>(null)
  const [subBannerFile, setSubBannerFile] = useState<File | null>(null)
  const [subImagePreview, setSubImagePreview] = useState<string | null>(subcategory?.sub_image || null)
  const [subBannerPreview, setSubBannerPreview] = useState<string | null>(subcategory?.sub_banner || null)

  // --- DATA FETCHING & FORM POPULATION ---
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true)
        const response = await axios.get(`${API_BASE_URL}/categories/`)
        const results = response.data.results || response.data
        if (Array.isArray(results)) {
          setCategories(results)
        } else {
          console.error('Unexpected API response format for categories:', response.data)
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
        setMessage('Failed to load categories')
      } finally {
        setLoading(false)
      }
    }
    fetchCategories()
  }, [API_BASE_URL])

  useEffect(() => {
    //
    // --- FIX APPLIED HERE ---
    // Ensure we have the subcategory data AND the list of categories before setting the form value.
    // This prevents a race condition where the form is reset before the category options are loaded.
    //
    if (isEditMode && subcategory && categories.length > 0) {
      // Parse product_details if it's a JSON string
      let details = subcategory.product_details
      if (typeof details === 'string') {
        try {
          details = JSON.parse(details)
        } catch (e) {
          console.error("Failed to parse product_details JSON:", e)
          details = []
        }
      }

      reset({
        category: String(typeof subcategory.category === 'object' ? subcategory.category.id : subcategory.category),
        name: subcategory.name,
        description: subcategory.description || '',
        meta_title: subcategory.meta_title || '',
        meta_description: subcategory.meta_description || '',
        product_details: Array.isArray(details) ? details : [],
      })

      // Set image previews from existing URLs
      setSubImagePreview(subcategory.sub_image || null)
      setSubBannerPreview(subcategory.sub_banner || null)
    }
  }, [subcategory, isEditMode, reset, categories]) // Add `categories` as a dependency

  // --- IMAGE HANDLING ---
  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: (file: File | null) => void,
    setPreview: (preview: string | null) => void
  ) => {
    const file = e.target.files?.[0]
    if (file) {
      setFile(file)
      const previewUrl = URL.createObjectURL(file)
      setPreview(previewUrl)
    }
  }

  const removeImage = (
    setFile: (file: File | null) => void,
    setPreview: (preview: string | null) => void,
    currentPreview: string | null
  ) => {
    setFile(null)
    if (currentPreview && currentPreview.startsWith('blob:')) {
      URL.revokeObjectURL(currentPreview)
    }
    setPreview(null)
  }

  // --- FORM SUBMISSION ---
  const onSubmit = async (data: SubcategoryFormData) => {
    setIsSubmitting(true)
    setMessage('')

    const formData = new FormData()
    formData.append('category', data.category)
    formData.append('name', data.name)
    formData.append('description', data.description || '')
    formData.append('meta_title', data.meta_title || '')
    formData.append('meta_description', data.meta_description || '')
    formData.append('product_details', JSON.stringify(data.product_details))

    // Handle image updates
    if (subImageFile) {
      formData.append('sub_image', subImageFile)
    } else if (isEditMode && !subImagePreview) {
      formData.append('sub_image', '') // Send empty string to delete
    }

    if (subBannerFile) {
      formData.append('sub_banner', subBannerFile)
    } else if (isEditMode && !subBannerPreview) {
      formData.append('sub_banner', '') // Send empty string to delete
    }

    // --- TOKEN REFRESH LOGIC ---
    let token = Cookies.get("access_token")
    if (!token) {
      try {
        const refreshResponse = await axios.post(
          `${API_BASE_URL}/token/refresh/`,
          {},
          { withCredentials: true }
        );
        token = refreshResponse.data?.access;
        if (token) {
          Cookies.set("access_token", token, { expires: 1 / 24, secure: true, sameSite: "Lax" });
        } else {
          throw new Error("No new access token returned");
        }
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        setMessage("Your session has expired. Please log in again.");
        setIsSubmitting(false);
        return;
      }
    }

    // --- API CALL (CREATE OR UPDATE) ---
    try {
      const url = isEditMode
        ? `${API_BASE_URL}/subcategories/${subcategory.id}/`
        : `${API_BASE_URL}/subcategories/`
      const method = isEditMode ? 'patch' : 'post'

      await axios({
        method,
        url,
        data: formData,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      })

      setMessage(`Subcategory ${isEditMode ? 'updated' : 'created'} successfully!`)
      onSuccess() // Trigger callback on success

    } catch (error: any) {
      console.error('Form submission error:', error)
      const errorMsg = error.response?.data?.detail || `Failed to ${isEditMode ? 'update' : 'create'} subcategory.`
      setMessage(errorMsg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const addOption = (fieldIndex: number) => {
    const field = watch(`product_details.${fieldIndex}`)
    update(fieldIndex, {
      ...field,
      options: [...(field.options || []), { label: '', value: '' }]
    })
  }

  const removeOption = (fieldIndex: number, optionIndex: number) => {
    const field = watch(`product_details.${fieldIndex}`)
    const newOptions = field.options?.filter((_, idx) => idx !== optionIndex)
    update(fieldIndex, { ...field, options: newOptions })
  }


  const renderImageUploader = (
    label: string,
    id: string,
    preview: string | null,
    fileHandler: (e: React.ChangeEvent<HTMLInputElement>) => void,
    removeHandler: () => void
  ) => (
    <div>
      <Label className="text-sm text-gray-600 mb-1 block">{label}</Label>
      {preview ? (
        <div className="relative w-32 h-32">
          <Image src={preview} alt={label} layout="fill" objectFit="cover" className="rounded-md border" />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
            onClick={removeHandler}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <>
          <input
            id={id}
            type="file"
            accept="image/*"
            onChange={fileHandler}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => document.getElementById(id)?.click()}
            className="w-full h-10 border-gray-300 text-gray-600 text-sm"
          >
            <ImageIcon className="w-4 h-4 mr-2" />
            Select Image
          </Button>
        </>
      )}
    </div>
  )

  return (
    <div className=" bg-white">
      <div className="max-w-md mx-auto bg-white">

        <div className="p-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Basic Information Section */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm text-gray-600 mb-1 block">
                    Category <span className="text-red-500">*</span>
                  </Label>
                  <Controller
                    name="category"
                    control={control}
                    rules={{ required: "Category is required" }}
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={loading}
                      >
                        <SelectTrigger className="h-10 border-gray-300 text-sm text-gray-500">
                          <SelectValue placeholder={loading ? "Loading..." : "Select a category"} />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={String(cat.id)}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>}
                </div>

                <div>
                  <Label className="text-sm text-gray-600 mb-1 block">
                    Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    {...register('name', { required: "Name is required" })}
                    className="h-10 border-gray-300 text-sm"
                    placeholder="Enter subcategory name"
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                </div>
              </div>

              <div>
                <Label className="text-sm text-gray-600 mb-1 block">Description</Label>
                <Textarea
                  {...register('description')}
                  className="min-h-[80px] border-gray-300 text-sm resize-none"
                  placeholder="Enter subcategory description"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm text-gray-600 mb-1 block">Meta Title</Label>
                  <Input {...register('meta_title')} className="h-10 border-gray-300 text-sm" />
                </div>
                <div>
                  <Label className="text-sm text-gray-600 mb-1 block">Meta Description</Label>
                  <Input {...register('meta_description')} className="h-10 border-gray-300 text-sm" />
                </div>
              </div>
            </div>

            {/* Media Section */}
            <div className="space-y-4 pt-4 border-t">
              {renderImageUploader(
                'Subcategory Image',
                'sub-image-input',
                subImagePreview,
                (e) => handleFileChange(e, setSubImageFile, setSubImagePreview),
                () => removeImage(setSubImageFile, setSubImagePreview, subImagePreview)
              )}
              {renderImageUploader(
                'Subcategory Banner',
                'sub-banner-input',
                subBannerPreview,
                (e) => handleFileChange(e, setSubBannerFile, setSubBannerPreview),
                () => removeImage(setSubBannerFile, setSubBannerPreview, subBannerPreview)
              )}
            </div>

            {/* Product Details Section */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-md font-semibold text-gray-800">Product Detail Fields</h3>
              <div className="space-y-4">
                {fields.map((field, fieldIndex) => {
                  const fieldType = watch(`product_details.${fieldIndex}.type`)
                  const showOptions = ['select', 'radio', 'checkbox'].includes(fieldType)
                  return (
                    <div key={field.id} className="p-4 border rounded-lg space-y-4 bg-gray-50">
                      {/* Field Name & Label */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <Label className="text-sm text-gray-600 mb-1 block">Field Name *</Label>
                          <Input
                            placeholder="e.g. 'material'"
                            {...register(`product_details.${fieldIndex}.name`, { required: true })}
                          />
                        </div>
                        <div>
                          <Label className="text-sm text-gray-600 mb-1 block">Display Label *</Label>
                          <Input
                            placeholder="e.g. 'Material Type'"
                            {...register(`product_details.${fieldIndex}.label`, { required: true })}
                          />
                        </div>
                      </div>
                      {/* Field Type & Required Checkbox */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">Field Type *</Label>
                          <Controller
                            name={`product_details.${fieldIndex}.type`}
                            control={control}
                            render={({ field }) => (
                              <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger><SelectValue placeholder="Select field type" /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="text">Text Input</SelectItem>
                                  <SelectItem value="textarea">Text Area</SelectItem>
                                  <SelectItem value="select">Dropdown</SelectItem>
                                  <SelectItem value="radio">Radio Buttons</SelectItem>
                                  <SelectItem value="checkbox">Checkbox</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          />
                        </div>
                        <div className="flex items-end">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`required-${fieldIndex}`}
                              {...register(`product_details.${fieldIndex}.required`)}
                              className="h-4 w-4 rounded border-gray-300"
                            />
                            <Label htmlFor={`required-${fieldIndex}`} className="text-sm font-medium text-gray-700">
                              Required Field
                            </Label>
                          </div>
                        </div>
                      </div>

                      {/* Options for Select/Radio/Checkbox */}
                      {showOptions && (
                        <div className="space-y-3 pt-2">
                          <Label className="text-sm text-gray-600 block">Options</Label>
                          {watch(`product_details.${fieldIndex}.options`)?.map((_, optionIndex) => (
                            <div key={optionIndex} className="flex gap-2 items-center">
                              <Input placeholder="Option label" {...register(`product_details.${fieldIndex}.options.${optionIndex}.label`, { required: true })} />
                              <Input placeholder="Option value" {...register(`product_details.${fieldIndex}.options.${optionIndex}.value`, { required: true })} />
                              <Button type="button" variant="ghost" size="icon" onClick={() => removeOption(fieldIndex, optionIndex)} className="text-red-500 hover:bg-red-50">
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                          <Button type="button" variant="outline" size="sm" onClick={() => addOption(fieldIndex)}>
                            <Plus className="w-4 h-4 mr-2" /> Add Option
                          </Button>
                        </div>
                      )}

                      {/* Remove Field Button */}
                      <div className="flex justify-end pt-3 border-t">
                        <Button type="button" variant="ghost" size="sm" onClick={() => remove(fieldIndex)} className="text-red-500 hover:text-red-700">
                          <Trash2 className="w-4 h-4 mr-1" /> Remove Field
                        </Button>
                      </div>
                    </div>
                  )
                })}

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => append({ name: '', label: '', type: 'text', required: false, options: [] })}
                  className="w-full h-12 border-2 border-dashed"
                >
                  <Plus className="w-4 h-4 mr-2" /> Add Product Field
                </Button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <Button type="submit" disabled={isSubmitting} className="w-full h-10">
                {isSubmitting
                  ? (isEditMode ? 'Updating...' : 'Creating...')
                  : (isEditMode ? 'Update Subcategory' : 'Create Subcategory')}
              </Button>
            </div>

            {/* Status Message */}
            {message && (
              <div className={`p-3 rounded text-center text-xs ${message.includes('success')
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