// src/lib/product-api.ts
import api from "./api";
import { AxiosError } from "axios";

// --- TYPE DEFINITIONS ---

export interface ApiProduct {
    id: number;
    category_name: string;
    subcategory_name: string | null;
    images: { id: number; image: string }[];
    name: string;
    description: string;
    price: string;
    direct_sale: boolean;
    type: string;
    is_active: boolean;
    hide_price: boolean;
    stock_quantity: number;
    manufacturer: string;
    average_rating: number | null;
    category: number | null;
    model: string | null;
    user_name: string | null;
    created_at: string;
}

export interface Product {
    id: string;
    image: string;
    title: string;
    subtitle: string;
    price: number;
    currency: string;
    category_name: string;
    subcategory_name: string | null;
    direct_sale: boolean;
    is_active: boolean;
    hide_price: boolean;
    stock_quantity: number;
    manufacturer: string;
    average_rating: number | null;
    category_id: number | null;
    model: string | null;
    user_name: string | null;
    created_at: string;
    type: string;
}

export interface ApiSubcategory {
    id: number;
    name: string;
    category_name: string;
    sub_image: string | null;
    sub_banner: string | null;
    product_count: number;
    description: string | null;
    meta_title: string | null;
    meta_description: string | null;
    created_at: string;
    updated_at: string;
    category: number;
}

export interface ApiCategory {
    id: number;
    name: string;
    subcategories: ApiSubcategory[];
    cat_image: string | null;
    cat_banner: string | null;
    product_count: number;
    description: string | null;
    meta_title: string | null;
    meta_description: string | null;
    product_details: Record<string, any>;
    created_at: string;
    updated_at: string;
}

export interface ApiResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

export interface RouteContext {
    type: 'category' | 'subcategory' | 'type' | 'invalid';
    name: string | null;
    subName: string | null;
    id: number | null;
    subId: number | null;
    metaTitle: string | null;
    metaDescription: string | null;
    errorMsg?: string | null;
}

export const PRODUCT_TYPE_CHOICES = ["new", "used", "rental", "attachments"];

// --- API FETCHERS ---

/**
 * Validates the route based on slug and sub-slug.
 */
// Helper: convert a name to a URL-safe slug (must match SideFilter.tsx toSlug exactly)
function nameToSlug(name: string): string {
    let slug = name.toLowerCase();
    slug = slug.replace(/\s*\((\w[\w-]*)\)/g, '-$1'); // "(Lead-Acid)" → "-Lead-Acid"
    slug = slug.replace(/[^a-z0-9-]/g, '-');           // non-alphanumeric → hyphen
    slug = slug.replace(/--+/g, '-');                   // collapse multiple hyphens
    slug = slug.replace(/^-+|-+$/g, '');               // trim leading/trailing hyphens
    return slug;
}

export async function getRouteContext(urlParamSlug: string, subcategoryParamSlug?: string): Promise<RouteContext> {
    const formattedParamName = urlParamSlug.replace(/-/g, ' ').split(' ').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

    if (PRODUCT_TYPE_CHOICES.includes(urlParamSlug)) {
        if (subcategoryParamSlug) {
            return { type: 'invalid', name: null, subName: null, id: null, subId: null, metaTitle: null, metaDescription: null };
        }
        return {
            type: 'type',
            name: formattedParamName,
            subName: null,
            id: null,
            subId: null,
            metaTitle: `${formattedParamName} Products | MHE Bazar`,
            metaDescription: `Browse our selection of ${formattedParamName} products.`
        };
    }

    try {
        const categoryResponse = await api.get<ApiCategory[]>(`/categories/?name=${formattedParamName}`);
        const categories = categoryResponse.data;

        if (categories && categories.length > 0) {
            const category = categories[0];

            if (subcategoryParamSlug) {
                // 🚨 FIX: Compare slugs instead of reconstructed names.
                // e.g. "Electric (Lead-Acid) Forklift" → slug "electric-lead-acid-forklift"
                // This correctly matches URL param "electric-lead-acid-forklift".
                const subcategory = category.subcategories.find(
                    sub => nameToSlug(sub.name) === subcategoryParamSlug
                );

                if (subcategory) {
                    return {
                        type: 'subcategory',
                        name: category.name,
                        subName: subcategory.name,
                        id: category.id,
                        subId: subcategory.id,
                        metaTitle: subcategory.meta_title,
                        metaDescription: subcategory.meta_description
                    };
                }
                return { type: 'invalid', name: null, subName: null, id: null, subId: null, metaTitle: null, metaDescription: null, errorMsg: `Subcategory not found` };
            }
            return {
                type: 'category',
                name: category.name,
                subName: null,
                id: category.id,
                subId: null,
                metaTitle: category.meta_title,
                metaDescription: category.meta_description
            };
        }
    } catch (err) {
        if (err instanceof AxiosError && err.response?.status !== 404) {
            throw err;
        }
    }

    return { type: 'invalid', name: null, subName: null, id: null, subId: null, metaTitle: null, metaDescription: null };
}

/**
 * Fetches products based on context and filters.
 */
export async function getProducts(params: {
    context?: RouteContext;
    page?: number;
    minPrice?: number | '';
    maxPrice?: number | '';
    manufacturer?: string | null;
    rating?: number | null;
    sortBy?: string;
}) {
    const { context, page = 1, minPrice, maxPrice, manufacturer, rating, sortBy } = params;

    if (!context || context.type === 'invalid' || !context.name) {
        return { products: [], totalCount: 0, totalPages: 0, noProductsFound: true };
    }

    const queryParams = new URLSearchParams();

    if (context.type === 'subcategory' && context.subId) {
        queryParams.append("subcategory", context.subId.toString());
    } else if (context.type === 'category' && context.id) {
        queryParams.append("category", context.id.toString());
    } else if (context.type === 'type') {
        if (context.name.toLowerCase() === 'rental') {
            queryParams.append("type", "rental");
            queryParams.append("type", "used");
        } else {
            queryParams.append("type", context.name.toLowerCase());
        }
    }

    queryParams.append("page", page.toString());

    if (typeof minPrice === 'number') queryParams.append("min_price", minPrice.toString());
    if (typeof maxPrice === 'number') queryParams.append("max_price", maxPrice.toString());
    if (rating !== null && rating !== undefined) queryParams.append("average_rating", rating.toString());
    if (manufacturer) queryParams.append("search", manufacturer);

    if (sortBy && sortBy !== 'relevance') {
        let sortParam = '';
        if (sortBy === 'price_asc') sortParam = 'price';
        else if (sortBy === 'price_desc') sortParam = '-price';
        else if (sortBy === 'newest') sortParam = '-created_at';
        if (sortParam) queryParams.append("ordering", sortParam);
    }

    const response = await api.get<ApiResponse<ApiProduct>>(`/products/?${queryParams.toString()}`);

    const transformedProducts: Product[] = response.data.results.map((p: ApiProduct) => ({
        id: p.id.toString(),
        image: p.images.length > 0 ? p.images[0].image : "/placeholder-product.jpg",
        title: p.name,
        subtitle: p.description,
        price: parseFloat(p.price),
        currency: "₹",
        category_name: p.category_name,
        subcategory_name: p.subcategory_name,
        direct_sale: p.direct_sale,
        is_active: p.is_active,
        hide_price: p.hide_price,
        stock_quantity: p.stock_quantity,
        manufacturer: p.manufacturer,
        average_rating: p.average_rating,
        type: p.type,
        category_id: p.category,
        model: p.model,
        user_name: p.user_name,
        created_at: p.created_at
    }));

    return {
        products: transformedProducts,
        totalCount: response.data.count,
        totalPages: Math.ceil(response.data.count / 12),
        noProductsFound: response.data.results.length === 0
    };
}

/**
 * Fetches unique manufacturers for the filter sidebar.
 */
export async function getManufacturers(): Promise<string[]> {
    try {
        const response = await api.get<{ results: { manufacturer: string }[] }>("/products/unique-manufacturers/");
        const uniqueManufacturers = Array.from(new Set(response.data.results.map(item => item.manufacturer)));
        return uniqueManufacturers.filter(Boolean) as string[];
    } catch (err) {
        console.error("[product-api] Failed to fetch manufacturers:", err);
        return [];
    }
}
