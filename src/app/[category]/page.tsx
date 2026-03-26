/* eslint-disable @typescript-eslint/no-unused-expressions */
// src/app/[category]/page.tsx
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams, notFound } from "next/navigation";
import Breadcrumb from "@/components/elements/Breadcrumb";
import api from "@/lib/api";
import { AxiosError } from "axios";
import { useQuery } from "@tanstack/react-query";
import ProductListing, { Product as ImportedProductType } from "@/components/products/ProductListing";


// --- START TYPE DEFINITIONS ---

// Helper type to omit the conflicting keys from the imported interface
type ProductListingBaseType = Omit<ImportedProductType, 'subcategory_name' | 'user_name'>;

// Define the local Product interface to safely override properties with string | null
interface Product extends ProductListingBaseType {
    subcategory_name: string | null;
    user_name: string | null;
}

// Define API data structures
interface ApiProduct {
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

interface ApiSubcategory {
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

interface ApiCategory {
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

interface ApiResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

// Validation context return type
interface RouteContext {
    type: 'category' | 'subcategory' | 'type' | 'invalid';
    name: string | null;
    subName: string | null;
    id: number | null;
    subId: number | null;
    metaTitle: string | null;
    metaDescription: string | null;
    errorMsg?: string | null;
}

// --- END TYPE DEFINITIONS ---

const PRODUCT_TYPE_CHOICES = ["new", "used", "rental", "attachments"];

// Helper function to format slugs to display names
const formatNameFromSlug = (slug: string): string => {
    return slug.replace(/-/g, ' ').split(' ').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

export default function CategoryOrTypePage({
    params,
}: {
    params: Promise<{ category: string; subcategory?: string }>;
}) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Accessing params directly is fine here in a Client Component entry.
    const { category: urlParamSlug, subcategory: subcategoryParamSlug } = React.use(params);

    // Use a single state object for filters to reduce re-renders and dependencies
    const [filterState, setFilterState] = useState({
        minPrice: '' as number | '',
        maxPrice: '' as number | '',
        selectedManufacturer: null as string | null,
        selectedRating: null as number | null,
        sortBy: 'relevance' as string,
        currentPage: 1 as number,
    });

    const { minPrice, maxPrice, selectedManufacturer, selectedRating, sortBy, currentPage } = filterState;

    // Effect to apply filters from URL search params on initial load
    useEffect(() => {
        let changed = false;
        const newFilterState = { ...filterState };

        const minP = searchParams.get('min_price');
        const maxP = searchParams.get('max_price');
        const manufacturer = searchParams.get('search');
        const rating = searchParams.get('average_rating');
        const sort = searchParams.get('sort_by');
        const page = searchParams.get('page');

        if (minP !== null && Number(minP) !== filterState.minPrice) { newFilterState.minPrice = Number(minP); changed = true; }
        if (maxP !== null && Number(maxP) !== filterState.maxPrice) { newFilterState.maxPrice = Number(maxP); changed = true; }
        if (manufacturer !== filterState.selectedManufacturer) { newFilterState.selectedManufacturer = manufacturer; changed = true; }
        if (rating !== null && Number(rating) !== filterState.selectedRating) { newFilterState.selectedRating = Number(rating); changed = true; }
        if (sort !== filterState.sortBy) { newFilterState.sortBy = sort || 'relevance'; changed = true; } // Default if null
        if (page !== null && Number(page) !== filterState.currentPage) { newFilterState.currentPage = Number(page); changed = true; }

        if (changed) {
            setFilterState(newFilterState);
        }
    }, [searchParams]);

    // --- React Query 1: Route Validation ---
    const {
        data: context,
        isLoading: isContextLoading,
        error: contextError
    } = useQuery<RouteContext>({
        queryKey: ['routeContext', urlParamSlug, subcategoryParamSlug],
        queryFn: async () => {
            const paramSlug = urlParamSlug;
            const subParamSlug = subcategoryParamSlug;
            const formattedParamName = formatNameFromSlug(paramSlug);
            const formattedSubParamName = subParamSlug ? formatNameFromSlug(subParamSlug) : null;

            if (PRODUCT_TYPE_CHOICES.includes(paramSlug)) {
                if (subParamSlug) {
                    return { type: 'invalid', name: null, subName: null, id: null, subId: null, metaTitle: null, metaDescription: null };
                }
                const typeName = formatNameFromSlug(paramSlug);
                return {
                    type: 'type',
                    name: typeName,
                    subName: null,
                    id: null,
                    subId: null,
                    metaTitle: `${typeName} Products | MHE Bazar`,
                    metaDescription: `Browse our selection of ${typeName} products.`
                };
            }

            try {
                const categoryResponse = await api.get<ApiCategory[]>(`/categories/?name=${formattedParamName}`);
                const categories = categoryResponse.data;

                if (categories && categories.length > 0) {
                    const category = categories[0];

                    if (formattedSubParamName) {
                        const subcategory = category.subcategories.find(
                            sub => sub.name.toLowerCase() === formattedSubParamName.toLowerCase()
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
                        } else {
                            return { type: 'invalid', name: null, subName: null, id: null, subId: null, metaTitle: null, metaDescription: null, errorMsg: `Subcategory not found` };
                        }
                    } else {
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
                }
            } catch (err) {
                if (err instanceof AxiosError && err.response?.status !== 404) {
                    return { type: 'invalid', name: null, subName: null, id: null, subId: null, metaTitle: null, metaDescription: null, errorMsg: `API Error: ${err.message}` };
                }
            }

            return { type: 'invalid', name: null, subName: null, id: null, subId: null, metaTitle: null, metaDescription: null };
        },
        staleTime: 5 * 60 * 1000, // Cache validation for 5 mins
    });


    // --- React Query 2: Product Fetching ---
    // Only runs if context is valid and not loading
    const {
        data: productsData,
        isLoading: isProductsLoading,
        isFetching: isProductsFetching,
        error: productsError
    } = useQuery({
        queryKey: [
            'products',
            context?.type,
            context?.name,
            context?.subName,
            context?.id,
            context?.subId,
            currentPage,
            minPrice,
            maxPrice,
            selectedManufacturer,
            selectedRating,
            sortBy
        ],
        queryFn: async () => {
            const queryParams = new URLSearchParams();

            if (context?.type === 'subcategory' && context.subId) {
                queryParams.append("subcategory", context.subId.toString());
            } else if (context?.type === 'category' && context.id) {
                queryParams.append("category", context.id.toString());
            } else if (context?.type === 'type') {
                if (context.name?.toLowerCase() === 'rental') {
                    queryParams.append("type", "rental");
                    queryParams.append("type", "used");
                } else if (context.name) {
                    queryParams.append("type", context.name.toLowerCase());
                }
            }

            queryParams.append("page", currentPage.toString());

            if (minPrice !== '') queryParams.append("min_price", minPrice.toString());
            if (maxPrice !== '') queryParams.append("max_price", maxPrice.toString());
            if (selectedRating !== null) queryParams.append("average_rating", selectedRating.toString());

            if (selectedManufacturer) queryParams.append("search", selectedManufacturer);

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
        },
        enabled: !!context && context.type !== 'invalid' && context.name !== null,
        staleTime: 60 * 1000,
    });


    const isLoading = isContextLoading || isProductsLoading;

    // Handle 404s (Commented out to show fallback products instead)
    if (!isContextLoading && context?.type === 'invalid' && !contextError && !context?.errorMsg) {
        // notFound();
    }


    const activeCategoryName = context?.type === 'category' || context?.type === 'subcategory' ? context.name : null;
    const activeSubcategoryName = context?.type === 'subcategory' ? context.subName : null;
    const activeTypeName = context?.type === 'type' ? context.name : null;

    const selectedFilters = useMemo(() => {
        const filters = new Set<string>();
        if (activeCategoryName) filters.add(activeCategoryName);
        if (activeSubcategoryName) filters.add(activeSubcategoryName);
        if (activeTypeName) filters.add(activeTypeName);
        return filters;
    }, [activeCategoryName, activeSubcategoryName, activeTypeName]);

    const handleFilterChange = useCallback((
        filterValue: string | number,
        filterType: "category" | "subcategory" | "type" | "price_range" | "manufacturer" | "rating" | "sort_by",
        newValue?: string | number | string[] | { min: number | ""; max: number | ""; } | null | undefined
    ) => {
        const currentPath = `/${urlParamSlug}${subcategoryParamSlug ? `/${subcategoryParamSlug}` : ''}`;
        const newSearchParams = new URLSearchParams(searchParams.toString());

        if (filterType === "category" || filterType === "subcategory" || filterType === "type") {
            let newPath = "";
            const formattedFilterSlug = String(filterValue).toLowerCase().replace(/\s+/g, '-');

            ['min_price', 'max_price', 'search', 'average_rating', 'sort_by'].forEach(p => newSearchParams.delete(p));
            newSearchParams.set('page', '1');

            setFilterState(prev => ({
                ...prev,
                minPrice: '',
                maxPrice: '',
                selectedManufacturer: null,
                selectedRating: null,
                sortBy: 'relevance',
                currentPage: 1,
            }));

            if (filterType === "category" || filterType === "type") {
                newPath = `/${formattedFilterSlug}`;
            } else if (filterType === "subcategory") {
                const currentCategorySlug = activeCategoryName?.toLowerCase().replace(/\s+/g, '-');
                newPath = currentCategorySlug ? `/${currentCategorySlug}/${formattedFilterSlug}` : `/${formattedFilterSlug}`;
            }

            router.push(`${newPath}?${newSearchParams.toString()}`);

        } else {
            if (filterType === "price_range" && typeof newValue === 'object' && newValue !== null) {
                const { min, max } = newValue as { min: number | '', max: number | '' };
                min === '' ? newSearchParams.delete('min_price') : newSearchParams.set('min_price', String(min));
                max === '' ? newSearchParams.delete('max_price') : newSearchParams.set('max_price', String(max));
            } else if (filterType === "manufacturer") {
                newValue ? newSearchParams.set('search', String(newValue)) : newSearchParams.delete('search');
            } else if (filterType === "rating") {
                newValue ? newSearchParams.set('average_rating', String(newValue)) : newSearchParams.delete('average_rating');
            } else if (filterType === "sort_by" && typeof filterValue === 'string') {
                filterValue === 'relevance' ? newSearchParams.delete('sort_by') : newSearchParams.set('sort_by', filterValue);
            }

            newSearchParams.set('page', '1');
            router.push(`${currentPath}?${newSearchParams.toString()}`);
        }
    }, [urlParamSlug, subcategoryParamSlug, activeCategoryName, router, searchParams]);

    const handlePageChange = (page: number) => {
        const currentPath = `/${urlParamSlug}${subcategoryParamSlug ? `/${subcategoryParamSlug}` : ''}`;
        const newSearchParams = new URLSearchParams(searchParams.toString());
        newSearchParams.set('page', page.toString());
        router.push(`${currentPath}?${newSearchParams.toString()}`);
        setFilterState(prev => ({ ...prev, currentPage: page }));
    };

    const handleSortChange = (value: string) => {
        const currentPath = `/${urlParamSlug}${subcategoryParamSlug ? `/${subcategoryParamSlug}` : ''}`;
        const newSearchParams = new URLSearchParams(searchParams.toString());

        value === 'relevance' ? newSearchParams.delete('sort_by') : newSearchParams.set('sort_by', value);
        newSearchParams.set('page', '1');

        router.push(`${currentPath}?${newSearchParams.toString()}`);
        setFilterState(prev => ({ ...prev, sortBy: value, currentPage: 1 }));
    };

    const breadcrumbItems = useMemo(() => {
        const items = [{ label: "Home", href: "/" }];
        if (activeCategoryName) {
            items.push({ label: activeCategoryName, href: `/${urlParamSlug}` });
            if (activeSubcategoryName) {
                items.push({ label: activeSubcategoryName, href: `/${urlParamSlug}/${subcategoryParamSlug}` });
            }
        } else if (activeTypeName) {
            items.push({ label: activeTypeName, href: `/${urlParamSlug}` });
        }
        return items;
    }, [activeCategoryName, activeSubcategoryName, activeTypeName, urlParamSlug, subcategoryParamSlug]);


    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[calc(100vh-100px)]">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-500"></div>
                <p className="ml-4 text-gray-600">Loading products...</p>
            </div>
        );
    }

    const errorToDisplay = contextError?.message || (context?.errorMsg && !context?.errorMsg.includes("not found") ? context.errorMsg : null) || productsError?.message;
    if (errorToDisplay) {
        return (
            <div className="text-center p-8 min-h-[50vh] text-red-600">
                <h2>Error Loading Data</h2>
                <p>{errorToDisplay}</p>
            </div>
        );
    }

    const metaTitle = context?.metaTitle || `${activeSubcategoryName || activeCategoryName || activeTypeName} Products | MHE Bazar`;
    const metaDescription = context?.metaDescription || `Browse our wide range of ${activeSubcategoryName || activeCategoryName || activeTypeName} products and equipment.`;

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "http://schema.org",
                        "@type": "BreadcrumbList",
                        "itemListElement": [
                            {
                                "@type": "ListItem",
                                "position": 1,
                                "name": "Material Handling Equipment Manufacturer and Supplier in India | MHE Bazar",
                                "item": "https://www.mhebazar.in/"
                            },
                            ...(activeCategoryName
                                ? [
                                    {
                                        "@type": "ListItem",
                                        "position": 2,
                                        "name": `${activeCategoryName} – MHE Bazar`,
                                        "item": `https://www.mhebazar.in/${urlParamSlug}`
                                    }
                                ]
                                : []),
                            ...(activeSubcategoryName
                                ? [
                                    {
                                        "@type": "ListItem",
                                        "position": 3,
                                        "name": `${activeSubcategoryName} – MHE Bazar`,
                                        "item": `https://www.mhebazar.in/${urlParamSlug}/${subcategoryParamSlug}`
                                    }
                                ]
                                : [])
                        ]
                    })
                }}
            />
            <Breadcrumb items={breadcrumbItems} />

            {/* Show an indicator when refetching data in background for a seamless experience */}
            <div className={`transition-opacity duration-300 ${isProductsFetching && !isLoading ? 'opacity-50' : 'opacity-100'}`}>
                <ProductListing
                    products={productsData?.products as ImportedProductType[] || []}
                    title={activeSubcategoryName || activeCategoryName || activeTypeName || "All Products"}
                    totalCount={productsData?.totalCount || 0}
                    onFilterChange={handleFilterChange}
                    selectedFilters={selectedFilters}
                    selectedCategoryName={activeCategoryName}
                    selectedSubcategoryName={activeSubcategoryName}
                    selectedTypeName={activeTypeName}
                    currentPage={currentPage}
                    totalPages={productsData?.totalPages || 1}
                    onPageChange={handlePageChange}
                    noProductsMessage={productsData?.noProductsFound ? `No products found for "${context?.subName || context?.name}" with the selected filters.` : null}
                    minPrice={minPrice}
                    maxPrice={maxPrice}
                    selectedManufacturer={selectedManufacturer}
                    selectedRating={selectedRating}
                    sortBy={sortBy}
                    onSortChange={handleSortChange}
                    pageUrlType={urlParamSlug}
                />
            </div>
        </>
    );
}