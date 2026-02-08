import { supabase } from '../supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface ChatMessage {
    id: string;
    item_id: string;
    user_id: string;
    content: string;
    created_at: string;
    user?: {
        display_name: string;
        avatar_url: string;
    };
}

/**
 * 聊天訊息 API 服務
 */
export const chatApi = {
    /**
     * 取得項目的所有聊天訊息
     */
    async getMessages(itemId: string) {
        const { data, error } = await supabase
            .from('chat_messages')
            .select(`
        *,
        profiles:user_id (
          display_name,
          avatar_url
        )
      `)
            .eq('item_id', itemId)
            .order('created_at', { ascending: true });

        if (error) throw error;

        return (data || []).map(msg => ({
            ...msg,
            user: msg.profiles,
        })) as ChatMessage[];
    },

    /**
     * 發送訊息
     */
    async sendMessage(itemId: string, userId: string, content: string) {
        const { data, error } = await supabase
            .from('chat_messages')
            .insert({
                item_id: itemId,
                user_id: userId,
                content,
            })
            .select(`
        *,
        profiles:user_id (
          display_name,
          avatar_url
        )
      `)
            .single();

        if (error) throw error;

        return {
            ...data,
            user: data.profiles,
        } as ChatMessage;
    },

    /**
     * 訂閱即時訊息
     */
    subscribeToMessages(
        itemId: string,
        onNewMessage: (message: ChatMessage) => void
    ): RealtimeChannel {
        const channel = supabase
            .channel(`chat:${itemId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'chat_messages',
                    filter: `item_id=eq.${itemId}`,
                },
                async (payload) => {
                    // 取得完整訊息資料（包含用戶資訊）
                    const { data } = await supabase
                        .from('chat_messages')
                        .select(`
              *,
              profiles:user_id (
                display_name,
                avatar_url
              )
            `)
                        .eq('id', payload.new.id)
                        .single();

                    if (data) {
                        onNewMessage({
                            ...data,
                            user: data.profiles,
                        } as ChatMessage);
                    }
                }
            )
            .subscribe();

        return channel;
    },

    /**
     * 取消訂閱
     */
    unsubscribe(channel: RealtimeChannel) {
        supabase.removeChannel(channel);
    },

    /**
     * 刪除訊息
     */
    async deleteMessage(messageId: string) {
        const { error } = await supabase
            .from('chat_messages')
            .delete()
            .eq('id', messageId);

        if (error) throw error;
    },
};

export default chatApi;
