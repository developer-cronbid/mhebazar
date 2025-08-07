import { useState, useCallback, useRef } from "react";
import { AxiosError } from "axios";

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiReturn<T, Args extends unknown[] = []> extends UseApiState<T> {
  execute: (...args: Args) => Promise<T | null>;
  reset: () => void;
  setData: (data: T | null) => void;
  cleanup: () => void; // Cleanup function to prevent memory leaks
}

// Enhanced error handling function
const getErrorMessage = (error: unknown): string => {
  if (error instanceof AxiosError) {
    // Handle different types of axios errors
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          return data?.message || data?.detail || "Bad request";
        case 401:
          return "Authentication required";
        case 403:
          return "Access forbidden";
        case 404:
          return "Resource not found";
        case 422:
          // Handle validation errors
          if (data?.errors) {
            return Object.values(data.errors).flat().join(", ");
          }
          return data?.message || "Validation error";
        case 500:
          return "Internal server error";
        default:
          return data?.message || data?.detail || `Server error (${status})`;
      }
    } else if (error.request) {
      // Network error
      return "Network error. Please check your internet connection.";
    } else {
      // Request setup error
      return error.message || "Request failed";
    }
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return "An unexpected error occurred";
};

export function useApi<T, Args extends unknown[] = []>(
  apiFunction: (...args: Args) => Promise<{ data: T }>
): UseApiReturn<T, Args> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  // Use ref to track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);

  const execute = useCallback(
    async (...args: Args): Promise<T | null> => {
      if (!isMountedRef.current) return null;
      
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      try {
        const response = await apiFunction(...args);
        
        if (isMountedRef.current) {
          setState({
            data: response.data,
            loading: false,
            error: null,
          });
        }
        
        return response.data;
      } catch (error: unknown) {
        const errorMessage = getErrorMessage(error);
        
        if (isMountedRef.current) {
          setState({
            data: null,
            loading: false,
            error: errorMessage,
          });
        }
        
        // Re-throw error so component can handle it if needed
        throw error;
      }
    },
    [apiFunction]
  );

  const reset = useCallback(() => {
    if (isMountedRef.current) {
      setState({ data: null, loading: false, error: null });
    }
  }, []);

  const setData = useCallback((data: T | null) => {
    if (isMountedRef.current) {
      setState(prev => ({ ...prev, data, error: null }));
    }
  }, []);

  // Cleanup function to prevent memory leaks
  const cleanup = useCallback(() => {
    isMountedRef.current = false;
  }, []);

  return { 
    ...state, 
    execute, 
    reset, 
    setData,
    cleanup // Add cleanup function for useEffect cleanup
  };
}

// Alternative hook for paginated data
export function usePaginatedApi<T>(
  apiFunction: (params: { page?: number; page_size?: number; [key: string]: unknown }) => Promise<{ data: { results: T[]; count: number; next: string | null; previous: string | null } }>
) {
  const [state, setState] = useState<{
    data: T[];
    loading: boolean;
    error: string | null;
    hasMore: boolean;
    total: number;
    page: number;
  }>({
    data: [],
    loading: false,
    error: null,
    hasMore: true,
    total: 0,
    page: 1,
  });

  const loadMore = useCallback(async (params: { [key: string]: unknown } = {}) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await apiFunction({ 
        page: state.page, 
        page_size: 10, 
        ...params 
      });
      
      setState(prev => ({
        ...prev,
        data: prev.page === 1 ? response.data.results : [...prev.data, ...response.data.results],
        loading: false,
        error: null,
        hasMore: !!response.data.next,
        total: response.data.count,
        page: prev.page + 1,
      }));
      
      return response.data;
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      
      throw error;
    }
  }, [apiFunction, state.page]);

  const reset = useCallback(() => {
    setState({
      data: [],
      loading: false,
      error: null,
      hasMore: true,
      total: 0,
      page: 1,
    });
  }, []);

  const refresh = useCallback(async (params: { [key: string]: unknown } = {}) => {
    setState(prev => ({ ...prev, page: 1, data: [], hasMore: true }));
    return loadMore(params);
  }, [loadMore]);

  return {
    ...state,
    loadMore,
    reset,
    refresh,
  };
}

// Hook for mutations (create, update, delete operations)
export function useMutation<T, Args extends unknown[] = []>(
  mutationFunction: (...args: Args) => Promise<{ data: T }>
) {
  const [state, setState] = useState<{
    data: T | null;
    loading: boolean;
    error: string | null;
    isSuccess: boolean;
  }>({
    data: null,
    loading: false,
    error: null,
    isSuccess: false,
  });

  const mutate = useCallback(
    async (...args: Args): Promise<T | null> => {
      setState({ data: null, loading: true, error: null, isSuccess: false });
      
      try {
        const response = await mutationFunction(...args);
        
        setState({
          data: response.data,
          loading: false,
          error: null,
          isSuccess: true,
        });
        
        return response.data;
      } catch (error: unknown) {
        const errorMessage = getErrorMessage(error);
        
        setState({
          data: null,
          loading: false,
          error: errorMessage,
          isSuccess: false,
        });
        
        throw error;
      }
    },
    [mutationFunction]
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null, isSuccess: false });
  }, []);

  return { ...state, mutate, reset };
}

/*
USAGE EXAMPLES:

1. Basic API call with useApi:
```tsx
import { useApi } from './hooks/useApi';
import { productAPI } from './api';

const ProductList = () => {
  const { data: products, loading, error, execute, reset } = useApi(productAPI.getProducts);

  useEffect(() => {
    execute({ category: 1, page: 1 });
  }, [execute]);

  const handleRefresh = () => {
    reset();
    execute({ category: 1, page: 1 });
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error} <button onClick={handleRefresh}>Retry</button></div>;

  return (
    <div>
      {products?.map(product => (
        <div key={product.id}>{product.name}</div>
      ))}
    </div>
  );
};
```

2. Paginated data with usePaginatedApi:
```tsx
import { usePaginatedApi } from './hooks/useApi';
import { productAPI } from './api';

const InfiniteProductList = () => {
  const { data: products, loading, error, hasMore, loadMore, refresh } = usePaginatedApi(productAPI.getProducts);

  useEffect(() => {
    loadMore({ category: 1 });
  }, []);

  return (
    <div>
      {products.map(product => (
        <div key={product.id}>{product.name}</div>
      ))}
      
      {hasMore && (
        <button onClick={() => loadMore({ category: 1 })} disabled={loading}>
          {loading ? 'Loading...' : 'Load More'}
        </button>
      )}
      
      <button onClick={() => refresh({ category: 1 })}>
        Refresh
      </button>
    </div>
  );
};
```

3. Mutations with useMutation:
```tsx
import { useMutation } from './hooks/useApi';
import { productAPI } from './api';

const AddToCartButton = ({ productId }: { productId: number }) => {
  const { mutate: addToCart, loading, error, isSuccess } = useMutation(productAPI.addToCart);

  const handleAddToCart = async () => {
    try {
      await addToCart(productId, 1);
      alert('Added to cart successfully!');
    } catch (error) {
      // Error is already handled by the hook
      console.error('Failed to add to cart');
    }
  };

  return (
    <div>
      <button onClick={handleAddToCart} disabled={loading}>
        {loading ? 'Adding...' : 'Add to Cart'}
      </button>
      {error && <div className="error">{error}</div>}
      {isSuccess && <div className="success">Added to cart!</div>}
    </div>
  );
};
```

4. Form handling with mutation:
```tsx
import { useMutation } from './hooks/useApi';
import { authAPI } from './api';

const LoginForm = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const { mutate: login, loading, error } = useMutation(authAPI.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await login(credentials);
      localStorage.setItem('access_token', response.access);
      localStorage.setItem('refresh_token', response.refresh);
      window.location.href = '/dashboard';
    } catch (error) {
      // Error is handled by the hook
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Username"
        value={credentials.username}
        onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={credentials.password}
        onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
      {error && <div className="error">{error}</div>}
    </form>
  );
};
```

5. File upload example:
```tsx
import { useMutation } from './hooks/useApi';
import { productAPI } from './api';

const ProductImageUpload = ({ productId }: { productId: number }) => {
  const { mutate: uploadImages, loading, error, isSuccess } = useMutation(productAPI.uploadImages);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      try {
        await uploadImages(productId, files);
        alert('Images uploaded successfully!');
      } catch (error) {
        console.error('Upload failed');
      }
    }
  };

  return (
    <div>
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileUpload}
        disabled={loading}
      />
      {loading && <div>Uploading...</div>}
      {error && <div className="error">{error}</div>}
      {isSuccess && <div className="success">Upload successful!</div>}
    </div>
  );
};
```
*/