import { supabase } from '../supabase';

export interface HistoryItem {
    id: string;
    user_id: string;
    product_id?: string;
    name: string;
    image_url?: string;
    category?: string;
    status: 'achieved' | 'abandoned';
    final_price?: number;
    completed_at: string;
}

export interface HistoryStats {
    totalAchieved: number;
    totalAbandoned: number;
    totalSpent: number;
    byCategory: Record<string, number>;
}

/**
 * 歷史紀錄 API 服務
 */
export const historyApi = {
    /**
     * 取得用戶的歷史紀錄
     */
    async getHistory(
        userId: string,
        status?: 'achieved' | 'abandoned',
        category?: string
    ) {
        let query = supabase
            .from('history')
            .select('*')
            .eq('user_id', userId)
            .order('completed_at', { ascending: false });

        if (status) {
            query = query.eq('status', status);
        }

        if (category) {
            query = query.eq('category', category);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data as HistoryItem[];
    },

    /**
     * 取得單一歷史紀錄
     */
    async getHistoryItem(id: string) {
        const { data, error } = await supabase
            .from('history')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as HistoryItem;
    },

    /**
     * 取得統計摘要
     */
    async getHistoryStats(userId: string): Promise<HistoryStats> {
        const { data, error } = await supabase
            .from('history')
            .select('*')
            .eq('user_id', userId);

        if (error) throw error;

        const items = data || [];

        const totalAchieved = items.filter(i => i.status === 'achieved').length;
        const totalAbandoned = items.filter(i => i.status === 'abandoned').length;
        const totalSpent = items
            .filter(i => i.status === 'achieved')
            .reduce((sum, i) => sum + (i.final_price || 0), 0);

        const byCategory: Record<string, number> = {};
        items.forEach(item => {
            if (item.category && item.status === 'achieved') {
                byCategory[item.category] = (byCategory[item.category] || 0) + 1;
            }
        });

        return {
            totalAchieved,
            totalAbandoned,
            totalSpent,
            byCategory,
        };
    },

    /**
     * 按月份分組取得歷史紀錄
     */
    async getHistoryByMonth(userId: string, status?: 'achieved' | 'abandoned') {
        const items = await this.getHistory(userId, status);

        const grouped: Record<string, HistoryItem[]> = {};

        items.forEach(item => {
            const date = new Date(item.completed_at);
            const monthKey = `${date.getFullYear()}年${date.getMonth() + 1}月`;

            if (!grouped[monthKey]) {
                grouped[monthKey] = [];
            }
            grouped[monthKey].push(item);
        });

        return grouped;
    },

    /**
     * 刪除歷史紀錄
     */
    async deleteHistoryItem(id: string) {
        const { error } = await supabase
            .from('history')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },
};

export default historyApi;
