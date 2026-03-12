/* eslint-disable @typescript-eslint/no-unused-expressions */
// src/app/[category]/[subcategory]/page.tsx
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams, notFound } from "next/navigation";
import ProductListing, { Product as ImportedProductType } from "@/components/products/ProductListing";
import Breadcrumb from "@/components/elements/Breadcrumb";
import api from "@/lib/api";
import { AxiosError } from "axios";
import { useQuery } from "@tanstack/react-query";

// Helper function to format slugs to display names
const formatNameFromSlug = (slug: string): string => {
    return slug.replace(/-/g, ' ').split(' ').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

// Helper function to create a URL-friendly slug
const slugify = (str: string): string =>
    str.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");


// --- START TYPE DEFINITIONS ---

// Helper type to omit the conflicting keys from the imported interface
type ProductListingBaseType = Omit<ImportedProductType, 'subcategory_name' | 'user_name'>;

export interface Product extends ProductListingBaseType {
    subcategory_name: string | null;
    user_name: string | null;
}

interface ApiSubcategory {
    id: number;
    name: string;
    category_name: string;
    category: number;
    meta_title: string | null;
    meta_description: string | null;
}

interface ApiCategory {
    id: number;
    name: string;
    subcategories: ApiSubcategory[];
    meta_title: string | null;
    meta_description: string | null;
}

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

interface ApiResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

interface RouteContext {
    category: string | null;
    subcategory: string | null;
    categoryId: number | null;
    subcategoryId: number | null;
    metaTitle: string | null;
    metaDescription: string | null;
    errorMsg?: string | null;
}
// --- END TYPE DEFINITIONS ---


export default function SubCategoryPage({
    params,
}: {
    params: Promise<{ category: string; subcategory: string }>;
}) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const { category: urlCategorySlug, subcategory: urlSubcategorySlug } = React.use(params);

    const [filterState, setFilterState] = useState({
        minPrice: '' as number | '',
        maxPrice: '' as number | '',
        selectedManufacturer: null as string | null,
        selectedRating: null as number | null,
        sortBy: 'relevance' as string,
        currentPage: 1 as number,
    });

    const { minPrice, maxPrice, selectedManufacturer, selectedRating, sortBy, currentPage } = filterState;

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
        if (sort !== filterState.sortBy) { newFilterState.sortBy = sort || 'relevance'; changed = true; }
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
        queryKey: ['subRouteContext', urlCategorySlug, urlSubcategorySlug],
        queryFn: async () => {
            const formattedCatName = formatNameFromSlug(urlCategorySlug);
            const formattedSubcatName = formatNameFromSlug(urlSubcategorySlug);

            try {
                const categoryResponse = await api.get<ApiCategory[]>(`/categories/?name=${formattedCatName}`);
                const category = categoryResponse.data[0];

                if (!category) {
                    return { category: null, subcategory: null, categoryId: null, subcategoryId: null, metaTitle: null, metaDescription: null, errorMsg: `Category "${formattedCatName}" not found.` };
                }

                const subcategory = category.subcategories.find((sub: ApiSubcategory) =>
                    slugify(sub.name) === slugify(formattedSubcatName)
                );

                if (!subcategory) {
                    return { category: null, subcategory: null, categoryId: null, subcategoryId: null, metaTitle: null, metaDescription: null, errorMsg: `Subcategory "${formattedSubcatName}" not found under category "${formattedCatName}".` };
                }

                return {
                    category: category.name,
                    subcategory: subcategory.name,
                    categoryId: category.id,
                    subcategoryId: subcategory.id,
                    metaTitle: subcategory.meta_title,
                    metaDescription: subcategory.meta_description,
                };

            } catch (err: unknown) {
                if (err instanceof AxiosError && err.response?.status !== 404) {
                    return { category: null, subcategory: null, categoryId: null, subcategoryId: null, metaTitle: null, metaDescription: null, errorMsg: `API Service Error: ${err.message}` };
                }
                return { category: null, subcategory: null, categoryId: null, subcategoryId: null, metaTitle: null, metaDescription: null };
            }
        },
        staleTime: 5 * 60 * 1000,
    });


    // --- React Query 2: Product Fetching ---
    const {
        data: productsData,
        isLoading: isProductsLoading,
        isFetching: isProductsFetching,
        error: productsError
    } = useQuery({
        queryKey: [
            'subProducts',
            context?.categoryId,
            context?.subcategoryId,
            currentPage,
            minPrice,
            maxPrice,
            selectedManufacturer,
            selectedRating,
            sortBy
        ],
        queryFn: async () => {
            const queryParams = new URLSearchParams();
            queryParams.append("category", context!.categoryId!.toString());
            queryParams.append("subcategory", context!.subcategoryId!.toString());
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

            let transformedProducts: Product[] = response.data.results.map((p: ApiProduct) => ({
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

            if (context?.category?.toLowerCase().includes('spare parts')) {
                transformedProducts = transformedProducts.sort((a, b) => {
                    const aIsMHE = a.manufacturer?.toLowerCase().includes("mhe");
                    const bIsMHE = b.manufacturer?.toLowerCase().includes("mhe");

                    if (aIsMHE && !bIsMHE) return -1;
                    if (!aIsMHE && bIsMHE) return 1;
                    return 0;
                });
            }

            return {
                products: transformedProducts,
                totalCount: response.data.count,
                totalPages: Math.ceil(response.data.count / 12),
                noProductsFound: response.data.results.length === 0
            };
        },
        enabled: !!context && context.categoryId !== null && context.subcategoryId !== null,
        staleTime: 60 * 1000,
    });

    const isLoading = isContextLoading || isProductsLoading;

    if (!isContextLoading && !context?.category && !contextError && !context?.errorMsg) {
        notFound();
    }

    const validCategoryName = context?.category || null;
    const validSubcategoryName = context?.subcategory || null;

    const selectedFilters = useMemo(() => {
        const filters = new Set<string>();
        if (validCategoryName) filters.add(validCategoryName);
        if (validSubcategoryName) filters.add(validSubcategoryName);
        return filters;
    }, [validCategoryName, validSubcategoryName]);

    const handleFilterChange = useCallback((
        filterValue: string | number,
        filterType: "category" | "subcategory" | "type" | "price_range" | "manufacturer" | "rating" | "sort_by",
        newValue?: string | number | string[] | { min: number | ""; max: number | ""; } | null | undefined
    ) => {
        const currentPath = `/${urlCategorySlug}/${urlSubcategorySlug}`;
        const newSearchParams = new URLSearchParams(searchParams.toString());

        if (filterType === "category" || filterType === "subcategory" || filterType === "type") {
            let newPath = "";
            const formattedFilterSlug = slugify(String(filterValue));

            newSearchParams.delete('min_price');
            newSearchParams.delete('max_price');
            newSearchParams.delete('search');
            newSearchParams.delete('average_rating');
            newSearchParams.delete('sort_by');
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

            if (filterType === "category") {
                newPath = `/${formattedFilterSlug}`;
            } else if (filterType === "subcategory") {
                newPath = `/${urlCategorySlug}/${formattedFilterSlug}`;
            } else if (filterType === "type") {
                newPath = `/${formattedFilterSlug}`;
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
    }, [urlCategorySlug, urlSubcategorySlug, router, searchParams]);

    const breadcrumbItems = useMemo(() => {
        const items = [{ label: "Home", href: "/" }];
        if (validCategoryName) {
            items.push({ label: validCategoryName, href: `/${slugify(validCategoryName)}` });
        }
        if (validSubcategoryName) {
            const categorySlug = validCategoryName ? slugify(validCategoryName) : urlCategorySlug;
            items.push({ label: validSubcategoryName, href: `/${categorySlug}/${slugify(validSubcategoryName)}` });
        }
        return items;
    }, [validCategoryName, validSubcategoryName, urlCategorySlug]);


    const handlePageChange = (page: number) => {
        const newSearchParams = new URLSearchParams(searchParams.toString());
        newSearchParams.set('page', page.toString());
        router.push(`/${urlCategorySlug}/${urlSubcategorySlug}?${newSearchParams.toString()}`);
        setFilterState(prev => ({ ...prev, currentPage: page }));
    };

    const handleSortChange = (value: string) => {
        const newSearchParams = new URLSearchParams(searchParams.toString());
        newSearchParams.set('page', '1');
        value === 'relevance' ? newSearchParams.delete('sort_by') : newSearchParams.set('sort_by', value);
        router.push(`/${urlCategorySlug}/${urlSubcategorySlug}?${newSearchParams.toString()}`);
        setFilterState(prev => ({ ...prev, sortBy: value, currentPage: 1 }));
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[calc(100vh-100px)]">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-500"></div>
                <p className="ml-4 text-gray-600">Loading products...</p>
            </div>
        );
    }

    const errorToDisplay = contextError?.message || context?.errorMsg || productsError?.message;
    if (errorToDisplay) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)] text-center">
                <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Data</h2>
                <p className="text-gray-700 text-lg">{errorToDisplay}</p>
            </div>
        );
    }

    return (
        <>
            <Breadcrumb items={breadcrumbItems} />
            <div className={`transition-opacity duration-300 ${isProductsFetching && !isLoading ? 'opacity-50' : 'opacity-100'}`}>
                <ProductListing
                    products={productsData?.products as ImportedProductType[] || []}
                    title={validSubcategoryName || validCategoryName || "Products"}
                    totalCount={productsData?.totalCount || 0}
                    onFilterChange={handleFilterChange}
                    selectedFilters={selectedFilters}
                    selectedCategoryName={validCategoryName}
                    selectedSubcategoryName={validSubcategoryName}
                    selectedTypeName={null}
                    currentPage={currentPage}
                    totalPages={productsData?.totalPages || 1}
                    onPageChange={handlePageChange}
                    noProductsMessage={productsData?.noProductsFound ? `No products found with the selected filters.` : null}
                    minPrice={minPrice}
                    maxPrice={maxPrice}
                    selectedManufacturer={selectedManufacturer}
                    sortBy={sortBy}
                    onSortChange={handleSortChange}
                    showManufacturerFilter={true}
                    selectedRating={selectedRating}
                    pageUrlType={""}
                />
            </div>
        </>
    );
}