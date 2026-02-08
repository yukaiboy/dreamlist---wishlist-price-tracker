import { supabase } from '../supabase';

export interface Product {
    id: string;
    user_id: string;
    name: string;
    price: number;
    original_price?: number;
    image_url?: string;
    store?: string;
    category?: '服飾配件' | '電子產品' | '居家生活' | '美妝保養';
    notes?: string;
    price_tracking_enabled: boolean;
    is_new_low?: boolean;
    discount?: string;
    status: 'active' | 'achieved' | 'abandoned';
    created_at: string;
    updated_at: string;
}

export interface CreateProductData {
    name: string;
    price: number;
    originalPrice?: number;
    imageUrl?: string;
    store?: string;
    category?: string;
    notes?: string;
    priceTrackingEnabled?: boolean;
}

export interface UpdateProductData {
    name?: string;
    price?: number;
    originalPrice?: number;
    imageUrl?: string;
    store?: string;
    category?: string;
    notes?: string;
    priceTrackingEnabled?: boolean;
}

/**
 * 商品/願望清單 API 服務
 */
export const productsApi = {
    /**
     * 取得用戶的所有願望清單商品
     */
    async getProducts(userId: string, category?: string) {
        let query = supabase
            .from('products')
            .select('*')
            .eq('user_id', userId)
            .eq('status', 'active')
            .order('created_at', { ascending: false });

        if (category) {
            query = query.eq('category', category);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data as Product[];
    },

    /**
     * 取得單一商品詳情
     */
    async getProduct(id: string) {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as Product;
    },

    /**
     * 取得商品的價格歷史
     */
    async getPriceHistory(productId: string) {
        const { data, error } = await supabase
            .from('price_history')
            .select('*')
            .eq('product_id', productId)
            .order('recorded_at', { ascending: true });

        if (error) throw error;
        return data;
    },

    /**
     * 新增願望項目
     */
    async createProduct(userId: string, productData: CreateProductData) {
        const { data, error } = await supabase
            .from('products')
            .insert({
                user_id: userId,
                name: productData.name,
                price: productData.price,
                original_price: productData.originalPrice,
                image_url: productData.imageUrl,
                store: productData.store,
                category: productData.category,
                notes: productData.notes,
                price_tracking_enabled: productData.priceTrackingEnabled ?? true,
            })
            .select();

        if (error) throw error;

        const product = data?.[0];

        // 同時記錄初始價格到歷史
        if (product) {
            await supabase.from('price_history').insert({
                product_id: product.id,
                price: productData.price,
                store: productData.store,
            });
        }

        return product as Product;
    },

    /**
     * 更新願望項目
     */
    async updateProduct(id: string, productData: UpdateProductData) {
        const updates: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
        };

        if (productData.name !== undefined) updates.name = productData.name;
        if (productData.price !== undefined) updates.price = productData.price;
        if (productData.originalPrice !== undefined) updates.original_price = productData.originalPrice;
        if (productData.imageUrl !== undefined) updates.image_url = productData.imageUrl;
        if (productData.store !== undefined) updates.store = productData.store;
        if (productData.category !== undefined) updates.category = productData.category;
        if (productData.notes !== undefined) updates.notes = productData.notes;
        if (productData.priceTrackingEnabled !== undefined) updates.price_tracking_enabled = productData.priceTrackingEnabled;

        const { data, error } = await supabase
            .from('products')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as Product;
    },

    /**
     * 刪除願望項目
     */
    async deleteProduct(id: string) {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    /**
     * 標記為已達成
     */
    async markAsAchieved(id: string, userId: string, finalPrice?: number) {
        // 取得商品資料
        const product = await this.getProduct(id);

        // 更新商品狀態
        const { error: updateError } = await supabase
            .from('products')
            .update({ status: 'achieved', updated_at: new Date().toISOString() })
            .eq('id', id);

        if (updateError) throw updateError;

        // 新增到歷史紀錄
        const { error: historyError } = await supabase
            .from('history')
            .insert({
                user_id: userId,
                product_id: id,
                name: product.name,
                image_url: product.image_url,
                category: product.category,
                status: 'achieved',
                final_price: finalPrice ?? product.price,
            });

        if (historyError) throw historyError;
    },

    /**
     * 標記為已放棄
     */
    async markAsAbandoned(id: string, userId: string) {
        const product = await this.getProduct(id);

        const { error: updateError } = await supabase
            .from('products')
            .update({ status: 'abandoned', updated_at: new Date().toISOString() })
            .eq('id', id);

        if (updateError) throw updateError;

        const { error: historyError } = await supabase
            .from('history')
            .insert({
                user_id: userId,
                product_id: id,
                name: product.name,
                image_url: product.image_url,
                category: product.category,
                status: 'abandoned',
                final_price: product.price,
            });

        if (historyError) throw historyError;
    },

    /**
     * 上傳商品圖片
     */
    async uploadProductImage(userId: string, file: File) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}-${Date.now()}.${fileExt}`;
        const filePath = `products/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('products')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
            .from('products')
            .getPublicUrl(filePath);

        return data.publicUrl;
    },

    /**
     * 計算清單總額與統計
     */
    async getStats(userId: string) {
        const { data, error } = await supabase
            .from('products')
            .select('price')
            .eq('user_id', userId)
            .eq('status', 'active');

        if (error) throw error;

        const total = data?.reduce((sum, p) => sum + (p.price || 0), 0) || 0;
        const count = data?.length || 0;

        return { total, count };
    },
};

export default productsApi;
