import { useState, useEffect, useCallback } from 'react';
import { productsApi, Product, CreateProductData, UpdateProductData } from '../api/products';
import { useAuth } from '../../contexts/AuthContext';

interface UseProductsReturn {
    products: Product[];
    loading: boolean;
    error: Error | null;
    stats: { total: number; count: number };
    refetch: () => Promise<void>;
    createProduct: (data: CreateProductData) => Promise<Product>;
    updateProduct: (id: string, data: UpdateProductData) => Promise<Product>;
    deleteProduct: (id: string) => Promise<void>;
    markAsAchieved: (id: string, finalPrice?: number) => Promise<void>;
    markAsAbandoned: (id: string) => Promise<void>;
}

/**
 * 商品資料 Hook
 */
export function useProducts(category?: string): UseProductsReturn {
    const { user } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [stats, setStats] = useState({ total: 0, count: 0 });

    const fetchProducts = useCallback(async () => {
        if (!user) {
            setProducts([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const [data, statsData] = await Promise.all([
                productsApi.getProducts(user.id, category),
                productsApi.getStats(user.id),
            ]);
            setProducts(data);
            setStats(statsData);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    }, [user, category]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const createProduct = async (data: CreateProductData) => {
        if (!user) throw new Error('用戶未登入');

        const product = await productsApi.createProduct(user.id, data);
        await fetchProducts();
        return product;
    };

    const updateProduct = async (id: string, data: UpdateProductData) => {
        const product = await productsApi.updateProduct(id, data);
        await fetchProducts();
        return product;
    };

    const deleteProduct = async (id: string) => {
        await productsApi.deleteProduct(id);
        await fetchProducts();
    };

    const markAsAchieved = async (id: string, finalPrice?: number) => {
        if (!user) throw new Error('用戶未登入');
        await productsApi.markAsAchieved(id, user.id, finalPrice);
        await fetchProducts();
    };

    const markAsAbandoned = async (id: string) => {
        if (!user) throw new Error('用戶未登入');
        await productsApi.markAsAbandoned(id, user.id);
        await fetchProducts();
    };

    return {
        products,
        loading,
        error,
        stats,
        refetch: fetchProducts,
        createProduct,
        updateProduct,
        deleteProduct,
        markAsAchieved,
        markAsAbandoned,
    };
}

interface UseProductReturn {
    product: Product | null;
    priceHistory: { price: number; store: string; recorded_at: string }[];
    loading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
}

/**
 * 單一商品詳情 Hook
 */
export function useProduct(productId: string | null): UseProductReturn {
    const [product, setProduct] = useState<Product | null>(null);
    const [priceHistory, setPriceHistory] = useState<{ price: number; store: string; recorded_at: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchProduct = useCallback(async () => {
        if (!productId) {
            setProduct(null);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const [productData, historyData] = await Promise.all([
                productsApi.getProduct(productId),
                productsApi.getPriceHistory(productId),
            ]);
            setProduct(productData);
            setPriceHistory(historyData);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    }, [productId]);

    useEffect(() => {
        fetchProduct();
    }, [fetchProduct]);

    return {
        product,
        priceHistory,
        loading,
        error,
        refetch: fetchProduct,
    };
}

export default useProducts;
