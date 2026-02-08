import { supabase } from '../supabase';

export interface SharedItem {
    id: string;
    group_id: string;
    proposer_id: string;
    name: string;
    price: number;
    image_url?: string;
    discount?: string;
    status: 'voting' | 'approved' | 'rejected';
    created_at: string;
    updated_at: string;
    proposer?: {
        display_name: string;
        avatar_url: string;
    };
    votes_count?: number;
    total_members?: number;
}

export interface Vote {
    id: string;
    item_id: string;
    user_id: string;
    is_approve: boolean;
    created_at: string;
}

export interface CreateSharedItemData {
    name: string;
    price: number;
    imageUrl?: string;
    discount?: string;
}

/**
 * 共同項目與投票 API 服務
 */
export const sharedItemsApi = {
    /**
     * 取得群組的所有共同項目
     */
    async getSharedItems(groupId: string) {
        const { data, error } = await supabase
            .from('shared_items')
            .select(`
        *,
        profiles:proposer_id (
          display_name,
          avatar_url
        )
      `)
            .eq('group_id', groupId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // 取得每個項目的投票統計
        const itemsWithVotes = await Promise.all(
            (data || []).map(async (item) => {
                const { count: votesCount } = await supabase
                    .from('votes')
                    .select('*', { count: 'exact', head: true })
                    .eq('item_id', item.id)
                    .eq('is_approve', true);

                const { count: totalMembers } = await supabase
                    .from('group_members')
                    .select('*', { count: 'exact', head: true })
                    .eq('group_id', groupId);

                return {
                    ...item,
                    proposer: item.profiles,
                    votes_count: votesCount || 0,
                    total_members: totalMembers || 0,
                };
            })
        );

        return itemsWithVotes as SharedItem[];
    },

    /**
     * 取得單一共同項目詳情
     */
    async getSharedItem(itemId: string) {
        const { data, error } = await supabase
            .from('shared_items')
            .select(`
        *,
        profiles:proposer_id (
          display_name,
          avatar_url
        )
      `)
            .eq('id', itemId)
            .single();

        if (error) throw error;

        // 取得投票資料
        const { data: votes } = await supabase
            .from('votes')
            .select(`
        *,
        profiles:user_id (
          display_name,
          avatar_url
        )
      `)
            .eq('item_id', itemId);

        // 取得群組成員數
        const { count: totalMembers } = await supabase
            .from('group_members')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', data.group_id);

        const approveCount = votes?.filter(v => v.is_approve).length || 0;

        return {
            ...data,
            proposer: data.profiles,
            votes: votes || [],
            votes_count: approveCount,
            total_members: totalMembers || 0,
        };
    },

    /**
     * 提案新項目
     */
    async proposeItem(groupId: string, proposerId: string, itemData: CreateSharedItemData) {
        const { data, error } = await supabase
            .from('shared_items')
            .insert({
                group_id: groupId,
                proposer_id: proposerId,
                name: itemData.name,
                price: itemData.price,
                image_url: itemData.imageUrl,
                discount: itemData.discount,
                status: 'voting',
            })
            .select()
            .single();

        if (error) throw error;
        return data as SharedItem;
    },

    /**
     * 投票
     */
    async vote(itemId: string, userId: string, isApprove: boolean) {
        // 使用 upsert 來處理重複投票
        const { data, error } = await supabase
            .from('votes')
            .upsert(
                {
                    item_id: itemId,
                    user_id: userId,
                    is_approve: isApprove,
                },
                {
                    onConflict: 'item_id,user_id',
                }
            )
            .select()
            .single();

        if (error) throw error;

        // 檢查是否需要更新項目狀態
        await this.checkAndUpdateStatus(itemId);

        return data as Vote;
    },

    /**
     * 取得用戶對項目的投票
     */
    async getUserVote(itemId: string, userId: string) {
        const { data, error } = await supabase
            .from('votes')
            .select('*')
            .eq('item_id', itemId)
            .eq('user_id', userId)
            .single();

        if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
        return data as Vote | null;
    },

    /**
     * 檢查並更新項目狀態
     */
    async checkAndUpdateStatus(itemId: string) {
        const item = await this.getSharedItem(itemId);

        // 取得群組設定
        const { data: group } = await supabase
            .from('groups')
            .select('voting_threshold')
            .eq('id', item.group_id)
            .single();

        if (!group) return;

        const approvalRate = item.votes_count / item.total_members;
        let requiredRate = 0.5;

        switch (group.voting_threshold) {
            case 'two-thirds':
                requiredRate = 2 / 3;
                break;
            case 'unanimous':
                requiredRate = 1;
                break;
            default:
                requiredRate = 0.5;
        }

        if (approvalRate >= requiredRate) {
            await this.updateItemStatus(itemId, 'approved');
        }
    },

    /**
     * 更新項目狀態
     */
    async updateItemStatus(itemId: string, status: 'voting' | 'approved' | 'rejected') {
        const { data, error } = await supabase
            .from('shared_items')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', itemId)
            .select()
            .single();

        if (error) throw error;
        return data as SharedItem;
    },

    /**
     * 刪除共同項目
     */
    async deleteItem(itemId: string) {
        const { error } = await supabase
            .from('shared_items')
            .delete()
            .eq('id', itemId);

        if (error) throw error;
    },

    /**
     * 上傳項目圖片
     */
    async uploadItemImage(groupId: string, file: File) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${groupId}-${Date.now()}.${fileExt}`;
        const filePath = `shared-items/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('shared-items')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
            .from('shared-items')
            .getPublicUrl(filePath);

        return data.publicUrl;
    },
};

export default sharedItemsApi;
