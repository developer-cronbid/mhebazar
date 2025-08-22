'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import dynamic from 'next/dynamic';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';

// --- UI Imports ---
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
  SheetFooter,
  SheetClose
} from '@/components/ui/sheet';
import { Loader2 } from 'lucide-react';

const RichTextEditor = dynamic(() => import('./RichTextEditor').then(mod => mod.RichTextEditor), {
  ssr: false,
  loading: () => <p>Loading editor...</p> // Optional loading component
});

// --- API Logic ---
const getCategories = async () => {
  const response = await api.get('/categories/');
  return response.data;
};

const getBlog = async (blogUrl: string) => {
  const response = await api.get(`/blogs/${blogUrl}/`);
  return response.data;
};

const saveBlog = async (data: FormData, blogUrl?: string) => {
  if (blogUrl) {
    // For PUT, some backends might not need multipart/form-data. Adjust if necessary.
    // Here we use PUT for updating.
    const response = await api.put(`/blogs/${blogUrl}/`, data);
    return response.data;
  } else {
    const response = await api.post('/blogs/', data);
    return response.data;
  }
};

// --- Zod Schema (with adjustments for editing) ---
const formSchema = z.object({
  blog_title: z.string().min(5, 'Title must be at least 5 characters long.'),
  blog_category: z.string().min(1, 'Please select a category.'),
  // Image is optional when updating
  image1: z.any().optional(),
  description: z.string().min(50, 'Description needs to be at least 50 characters.'),
  meta_title: z.string().optional(),
  description1: z.string().optional(), // Meta Description
  blog_url: z.string().min(3, 'Blog URL slug is required.'),
  tags: z.string().optional(),
  author_name: z.string().optional(),
});

type BlogFormData = z.infer<typeof formSchema>;

interface Category {
  id: number;
  category_name: string;
}

// --- Refactored BlogForm Component ---
interface BlogFormProps {
  initialData?: BlogFormData & { blog_url: string };
  onSuccess: () => void;
}

function BlogForm({ initialData, onSuccess }: BlogFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Set default values. Note: for category, we need to find the ID string from initialData.
  const defaultValues = initialData ? {
    ...initialData,
    blog_category: String(initialData.blog_category),
  } : {
    blog_title: '', blog_category: '', description: '',
    meta_title: '', description1: '', blog_url: '',
    tags: '', author_name: '',
  };

  const form = useForm<BlogFormData>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const fileRef = form.register("image1");

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategories();
        setCategories(data);
      } catch (error) {
        toast.error('Failed to fetch categories');
        console.log(error);
      }
    };
    fetchCategories();
  }, []);

  // Reset form when initialData changes (e.g., opening sheet for a different blog)
  useEffect(() => {
    form.reset(defaultValues);
  }, [initialData, form]);


  async function onSubmit(values: BlogFormData) {
    setIsLoading(true);
    const formData = new FormData();

    // If it's an update, don't require the image if it hasn't been changed
    if (initialData && !values.image1?.[0]) {
      formSchema.shape.image1.parse(undefined);
    } else if (!initialData) {
      // For new blogs, validate that the image exists
      const imageValidation = z.any().refine(file => file?.length === 1, 'Banner image is required.');
      const validationResult = imageValidation.safeParse(values.image1);
      if (!validationResult.success) {
        form.setError("image1", { type: "manual", message: validationResult.error.errors[0].message });
        setIsLoading(false);
        return;
      }
    }

    // Build FormData
    Object.entries(values).forEach(([key, value]) => {
      if (key === 'image1' && value?.[0]) {
        formData.append(key, value[0]);
      } else if (value !== null && value !== undefined && key !== 'image1') {
        formData.append(key, String(value));
      }
    });

    try {
      await saveBlog(formData, initialData?.blog_url);
      toast.success('Success!', {
        description: `Blog has been ${initialData ? 'updated' : 'created'} successfully.`,
      });
      onSuccess(); // Trigger parent action (e.g., refetch and close sheet)
    } catch (e: any) {
      const errorMsg = e.response?.data?.blog_url?.[0] || 'Could not save the blog. Please try again.';
      toast.error('An error occurred', {
        description: errorMsg,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Blog Title */}
        <FormField
          control={form.control}
          name="blog_title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Blog Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g., The Future of Material Handling" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Blog Content */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Blog Content</FormLabel>
              <FormControl>
                <RichTextEditor {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Category */}
        <FormField
          control={form.control}
          name="blog_category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a blog category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={String(cat.id)}>
                      {cat.category_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Banner Image */}
        <FormField
          control={form.control}
          name="image1"
          render={() => (
            <FormItem>
              <FormLabel>Banner Image {initialData && <span className="text-xs text-muted-foreground">(Leave empty to keep existing image)</span>}</FormLabel>
              <FormControl>
                <Input type="file" {...fileRef} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* URL Slug */}
        <FormField
          control={form.control}
          name="blog_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Blog URL Slug</FormLabel>
              <FormControl>
                <Input placeholder="my-awesome-blog-post" {...field} disabled={!!initialData} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Author Name */}
        <FormField
          control={form.control}
          name="author_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Author Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* SEO Section */}
        <div className="space-y-4 border-t pt-4">
          <h3 className="text-md font-medium">SEO Information</h3>
          <FormField
            control={form.control}
            name="meta_title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Meta Title</FormLabel>
                <FormControl>
                  <Input placeholder="A catchy title for search engines" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description1"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Meta Description</FormLabel>
                <FormControl>
                  <Textarea placeholder="A concise summary for search engine results." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Submit Button in Sheet Footer */}
        <SheetFooter className="mt-6">
          <SheetClose asChild>
            <Button type="button" variant="outline">Cancel</Button>
          </SheetClose>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? 'Saving...' : (initialData ? 'Update Blog' : 'Create Blog')}
          </Button>
        </SheetFooter>
      </form>
    </Form>
  );
}

// --- The Main Sheet Component ---
interface BlogSheetProps {
  blogUrl?: string;
  onSuccess: () => void;
  trigger: React.ReactNode;
}

export function BlogSheet({ blogUrl, onSuccess, trigger }: BlogSheetProps) {
  const [open, setOpen] = useState(false);
  const [blogData, setBlogData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isEditMode = !!blogUrl;

  const handleOpenChange = async (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && isEditMode) {
      setIsLoading(true);
      try {
        const data = await getBlog(blogUrl);
        setBlogData(data);
      } catch (error) {
        toast.error("Failed to load blog data.");
        console.log(error);
        setOpen(false); // Close sheet if data loading fails
      } finally {
        setIsLoading(false);
      }
    } else if (!isOpen) {
      // Reset data when closing
      setBlogData(null);
    }
  };

  const handleSuccess = () => {
    onSuccess();
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent className="sm:max-w-3xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEditMode ? 'Edit Blog' : 'Create New Blog'}</SheetTitle>
          <SheetDescription>
            {isEditMode ? "Update the details of your blog post." : "Fill out the form to publish a new blog post."}
          </SheetDescription>
        </SheetHeader>
        <div className="py-4">
          {isEditMode && isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <BlogForm onSuccess={handleSuccess} initialData={blogData} />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}