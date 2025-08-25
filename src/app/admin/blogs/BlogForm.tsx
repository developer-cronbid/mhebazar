"use client";

import React, { useState, useEffect } from 'react';
import { toast } from "sonner";
import api from '@/lib/api';

// --- UI Components ---
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import RichTextEditor from './RichTextEditor';

// --- Type Definitions ---
// Full blog data structure expected from the parent
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
  initialData: BlogData | null; // Receive the full blog object or null for creation
  categories: BlogCategory[];     // Receive categories from parent
  isOpen: boolean;                // Control visibility from parent
  onOpenChange: (isOpen: boolean) => void; // Notify parent of visibility changes
  onSuccess: () => void;          // Callback to refresh the table
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

export default function BlogForm({ initialData, categories, isOpen, onOpenChange, onSuccess }: BlogFormProps) {
  const [formData, setFormData] = useState<BlogData>(initialFormState);
  const [editorFiles, setEditorFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const isEditMode = !!initialData;

  // Effect to populate form when initialData changes (e.g., when an edit button is clicked)
  useEffect(() => {
    if (isOpen) {
      // If in edit mode, populate with initialData, otherwise use the empty state
      setFormData(initialData || initialFormState);
    } else {
      // Reset form when the sheet is closed
      setFormData(initialFormState);
      setEditorFiles([]);
    }
  }, [isOpen, initialData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({ ...prev, image1: e.target.files![0] }));
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    // Image placeholder logic remains the same...
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
      const url = isEditMode ? `/blogs/${initialData.blog_url}/` : '/blogs/';
      const method = isEditMode ? 'patch' : 'post';

      await api[method](url, data, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(`Blog ${isEditMode ? 'updated' : 'created'} successfully!`);
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
          {/* The form layout (SheetHeader, inputs, RichTextEditor, SheetFooter) remains identical to the previous version */}
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
                <Select name="blog_category" value={String(formData.blog_category)} onValueChange={(value) => setFormData(p => ({ ...p, blog_category: value }))} required>
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
            <div>
              <Label htmlFor="image1">Main Blog Image</Label>
              <Input id="image1" name="image1" type="file" onChange={handleFileChange} accept="image/*" />
              {isEditMode && <p className="text-xs text-gray-500 mt-1">Leave blank to keep current image.</p>}
            </div>
            <div>
              <Label>Blog Content</Label>
              <RichTextEditor
                initialData={formData.description}
                onChange={(data) => setFormData(p => ({ ...p, description: data }))}
                onFilesChange={(files) => setEditorFiles(files)}
              />
            </div>
            <div>
              <Label htmlFor="author_name">Author</Label>
              <Input id="author_name" name="author_name" value={formData.author_name} onChange={handleInputChange} required />
            </div>
          </div>
          <SheetFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>Cancel</Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}