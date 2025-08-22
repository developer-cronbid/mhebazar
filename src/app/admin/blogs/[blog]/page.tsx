// src/app/admin/blogs/[blog]

'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner'; // Correct import for sonner
import { RichTextEditor } from './RichTextEditor';


const getCategories = async () => {
  const response = await api.get('/categories/');
  return response.data;
};

const saveBlog = async (data: FormData, blogUrl?: string) => {
  if (blogUrl) {
    const response = await api.put(`/blogs/${blogUrl}/`, data);
    return response.data;
  } else {
    const response = await api.post('/blogs/', data);
    return response.data;
  }
};
// --- END OF API LOGIC ---

// Zod validation schema
const formSchema = z.object({
  blog_title: z.string().min(5, 'Title must be at least 5 characters long.'),
  blog_category: z.string().min(1, 'Please select a category.'),
  image1: z.any().refine(file => file?.length === 1, 'Banner image is required.'),
  description: z.string().min(50, 'Description needs to be at least 50 characters.'),
  meta_title: z.string().optional(),
  description1: z.string().optional(), // Meta Description
  blog_url: z.string().min(3, 'Blog URL slug is required.'),
  tags: z.string().optional(),
  author_name: z.string().optional(),
});

interface Category {
  id: number;
  category_name: string;
}

interface BlogFormProps {
  initialData?: z.infer<typeof formSchema> & { blog_url: string };
}

export function BlogForm({ initialData }: BlogFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategories();
        setCategories(data);
      } catch (error) {
        // Updated toast call for sonner
        toast.error('Failed to fetch categories', {
          description: error instanceof Error ? error.message : 'An unknown error occurred.',
        });
      }
    };
    fetchCategories();
  }, []); // The toast function from sonner is stable and doesn't need to be a dependency

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      blog_title: '', blog_category: '', description: '',
      meta_title: '', description1: '', blog_url: '',
      tags: '', author_name: '',
    },
  });

  const fileRef = form.register("image1");

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    const formData = new FormData();

    Object.entries(values).forEach(([key, value]) => {
      if (key === 'image1' && value[0]) {
        formData.append(key, value[0]);
      } else if (value) {
        formData.append(key, String(value));
      }
    });

    try {
      await saveBlog(formData, initialData?.blog_url);
      // Updated success toast call for sonner
      toast.success('Success!', {
        description: `Blog has been ${initialData ? 'updated' : 'created'} successfully.`,
      });
    } catch (e) {
      // Updated error toast call for sonner
      toast.error('An error occurred', {
        description: e + 'Could not save the blog. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Form fields remain exactly the same */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
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
          </div>

          <div className="space-y-6">
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
            <FormField
              control={form.control}
              name="image1"
              render={() => (
                <FormItem>
                  <FormLabel>Banner Image</FormLabel>
                  <FormControl>
                    <Input type="file" {...fileRef} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="blog_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Blog URL Slug</FormLabel>
                  <FormControl>
                    <Input placeholder="my-awesome-blog-post" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <FormControl>
                    <Input placeholder="parts, mhe, online" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="space-y-6 border-t pt-6">
          <h3 className="text-lg font-medium">SEO Information</h3>
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

        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : (initialData ? 'Update Blog' : 'Create Blog')}
        </Button>
      </form>
    </Form>
  );
}