"use client";

import React, { useState, useEffect } from 'react';
import { toast } from "sonner";
import Cookies from 'js-cookie'; // Make sure you have js-cookie installed
import api from '@/lib/api';

// --- UI Components ---
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import dynamic from 'next/dynamic';
const RichTextEditor = dynamic(() => import('./RichTextEditor'), {
  ssr: false,
  loading: () => <div className="p-4 border rounded-md bg-gray-50">Loading Editor...</div>
});

// --- Type Definitions ---
export interface BlogData {
  blog_title: string;
  description: string;
  description1: string;
  meta_title: string;
  blog_url: string;
  blog_category: string;
  author_name: string;
  image1?: File | null;
}

export interface BlogCategory {
  id: number;
  name: string;
}

interface BlogFormProps {
  formSessionId: number; // Add the new prop
  initialData: BlogData | null;
  categories: BlogCategory[];
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSuccess: () => void;
}

const initialFormState: BlogData = {
  blog_title: '',
  description: '',
  description1: '',
  meta_title: '',
  blog_url: '',
  blog_category: '',
  author_name: '',
  image1: null,
};

const DRAFT_COOKIE_KEY = 'blogDraft';

export default function BlogForm({ formSessionId, initialData, categories, isOpen, onOpenChange, onSuccess }: BlogFormProps) {
  const [formData, setFormData] = useState<BlogData>(initialFormState);
  const [editorFiles, setEditorFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const isEditMode = !!initialData;

  useEffect(() => {
    if (isOpen) {
      // If editing a saved blog, use its data.
      if (isEditMode) {
        setFormData(initialData);
      } else {
        // If creating a new blog, check for a draft in cookies.
        const draft = Cookies.get(DRAFT_COOKIE_KEY);
        if (draft) {
          toast.info("Loaded a saved draft.");
          // console.log("LOADING FROM COOKIE:", JSON.parse(draft));
          setFormData(JSON.parse(draft));
        } else {
          setFormData(initialFormState);
        }
      }
    } else {
      // Reset form when the sheet is closed
      setFormData(initialFormState);
      setEditorFiles([]);
    }
  }, [isOpen, initialData, isEditMode]);

  // ✅ HELPER FUNCTION to update state and save draft to cookie
  const updateAndSaveDraft = (updatedValues: Partial<BlogData>) => {
    const newFormData = { ...formData, ...updatedValues };
    setFormData(newFormData);
    // Only save to cookies if we are in "create" mode (not editing a pre-existing blog)
    if (!isEditMode) {
      // We don't save the File object in cookies, so we exclude it.
      const { image1, ...dataToSave } = newFormData;
      // console.log("SAVING TO COOKIE:", dataToSave); 
      Cookies.set(DRAFT_COOKIE_KEY, JSON.stringify(dataToSave), { expires: 1 }); // Expires in 24 hours
    }
  };


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    updateAndSaveDraft({ [name]: value });
  };

  const handleSelectChange = (value: string) => {
    updateAndSaveDraft({ blog_category: value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({ ...prev, image1: e.target.files![0] }));
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    let processedHtml = formData.description;
    const finalFiles: File[] = [];
    if (editorFiles.length > 0) {
      const tempUrlToFileMap = new Map<string, File>();
      editorFiles.forEach(file => {
        const url = URL.createObjectURL(file);
        tempUrlToFileMap.set(url, file);
      });
      const imgRegex = /<img src="(blob:[^"]+)"/g;
      let imageIndex = 0;
      processedHtml = processedHtml.replace(imgRegex, (match, blobUrl) => {
        const file = tempUrlToFileMap.get(blobUrl);
        if (file) {
          finalFiles.push(file);
          URL.revokeObjectURL(blobUrl);
          return `<img src="{{editor_image_${imageIndex++}}}"`;
        }
        return match;
      });
    }

    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (key !== 'image1' && value !== null && value !== '') {
        data.append(key, value as string);
      }
    });
    if (formData.image1) data.append('image1', formData.image1);
    finalFiles.forEach(file => data.append('editor_images', file));
    data.set('description', processedHtml);

    try {
      const url = isEditMode && initialData.blog_url ? `/blogs/${initialData.blog_url}/` : '/blogs/';
      const method = isEditMode ? 'patch' : 'post';

      await api[method](url, data, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(`Blog ${isEditMode ? 'updated' : 'created'} successfully!`);

      // ✅ Clear the draft from cookies on successful submission
      Cookies.remove(DRAFT_COOKIE_KEY);

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || `Failed to ${isEditMode ? 'update' : 'create'} blog.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-4xl overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <SheetHeader>
            <SheetTitle>{isEditMode ? 'Edit Blog Post' : 'Create New Blog Post'}</SheetTitle>
            <SheetDescription>
              {isEditMode ? 'Update the details of the blog post.' : 'Fill in the details to create a new blog.'}
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-6 py-6 px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="blog_title">Blog Title</Label>
                <Input id="blog_title" name="blog_title" value={formData.blog_title} onChange={handleInputChange} required />
              </div>
              <div>
                <Label htmlFor="blog_url">Blog URL (Slug)</Label>
                <Input id="blog_url" name="blog_url" value={formData.blog_url} onChange={handleInputChange} required />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="meta_title">Meta Title</Label>
                <Input id="meta_title" name="meta_title" value={formData.meta_title} onChange={handleInputChange} />
              </div>
              <div>
                <Label htmlFor="blog_category">Category</Label>
                {/* ✅ Use the dedicated handler for select change */}
                <Select name="blog_category" value={String(formData.blog_category)} onValueChange={handleSelectChange} required>
                  <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="description1">Meta Description</Label>
              <Textarea id="description1" name="description1" value={formData.description1} onChange={handleInputChange} rows={3} />
            </div>
            <div className='flex w-full gap-4'>
              <div className='w-full'>
                <Label htmlFor="author_name">Author</Label>
                <Input id="author_name" name="author_name" value={formData.author_name} onChange={handleInputChange} required />
              </div>
              <div className='w-full'>
                <Label htmlFor="image1">Main Blog Image</Label>
                <Input id="image1" name="image1" type="file" onChange={handleFileChange} accept="image/*" />
                {isEditMode && <p className="text-xs text-gray-500 mt-1">Leave blank to keep current image.</p>}
              </div>
            </div>

            <div>
              <Label>Blog Content</Label>
              <RichTextEditor
                key={formSessionId} // Keep the key from the previous step
                initialData={formData.description}
                onFilesChange={(files) => setEditorFiles(files)}
                onChange={(data) => {
                  // Only save changes to the cookie if the form is actually open.
                  // This prevents the final "on-close" event from erasing the data.
                  if (isOpen) {
                    updateAndSaveDraft({ description: data });
                  }
                }}
              />
            </div>
          </div>
          <SheetFooter>
            <Button type="submit" variant="default" className='bg-green-700' disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button type="button" variant="destructive" onClick={() => onOpenChange(false)} disabled={isLoading}>Cancel</Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}