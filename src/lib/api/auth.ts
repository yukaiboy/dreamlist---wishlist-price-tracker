import { supabase } from '../supabase';

export interface SignUpData {
    email: string;
    password: string;
    displayName?: string;
}

export interface SignInData {
    email: string;
    password: string;
}

export interface UpdateProfileData {
    displayName?: string;
    avatarUrl?: string;
}

/**
 * 認證 API 服務
 */
export const authApi = {
    /**
     * 註冊新用戶
     */
    async signUp({ email, password, displayName }: SignUpData) {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    display_name: displayName,
                },
            },
        });

        if (error) throw error;
        return data;
    },

    /**
     * Email/密碼登入
     */
    async signIn({ email, password }: SignInData) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) throw error;
        return data;
    },

    /**
     * Google OAuth 登入
     */
    async signInWithGoogle() {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/`,
            },
        });

        if (error) throw error;
        return data;
    },

    /**
     * Apple OAuth 登入
     */
    async signInWithApple() {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'apple',
            options: {
                redirectTo: `${window.location.origin}/`,
            },
        });

        if (error) throw error;
        return data;
    },

    /**
     * 登出
     */
    async signOut() {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    },

    /**
     * 取得目前登入用戶
     */
    async getCurrentUser() {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        return user;
    },

    /**
     * 取得目前 Session
     */
    async getSession() {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        return session;
    },

    /**
     * 取得用戶資料
     */
    async getProfile(userId: string) {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId);

        if (error) throw error;
        return data?.[0];
    },

    /**
     * 更新用戶資料
     */
    async updateProfile(userId: string, { displayName, avatarUrl }: UpdateProfileData) {
        const updates: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
        };

        if (displayName !== undefined) updates.display_name = displayName;
        if (avatarUrl !== undefined) updates.avatar_url = avatarUrl;

        const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', userId)
            .select();

        if (error) throw error;
        return data?.[0];
    },

    /**
     * 修改密碼
     */
    async changePassword(newPassword: string) {
        const { data, error } = await supabase.auth.updateUser({
            password: newPassword,
        });

        if (error) throw error;
        return data;
    },

    /**
     * 刪除帳號
     * 注意：這需要在 Supabase Dashboard 中啟用 "Allow users to delete their account"
     */
    async deleteAccount() {
        // 首先登出
        await supabase.auth.signOut();
        // 實際刪除需要透過 Edge Function 或 Admin API
        // 這裡僅做登出處理，完整刪除需要後端支援
    },

    /**
     * 監聽認證狀態變化
     */
    onAuthStateChange(callback: (event: string, session: unknown) => void) {
        return supabase.auth.onAuthStateChange(callback);
    },

    /**
     * 上傳頭像
     */
    async uploadAvatar(userId: string, file: File) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}-${Date.now()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);

        return data.publicUrl;
    },

    /**
     * 重送驗證信
     */
    async resendVerification(email: string) {
        const { data, error } = await supabase.auth.resend({
            type: 'signup',
            email: email,
        });
        if (error) throw error;
        return data;
    },

    /**
     * 取得通知設定
     */
    async getNotificationSettings(userId: string) {
        const { data, error } = await supabase
            .from('notification_settings')
            .select('*')
            .eq('user_id', userId);

        if (error) throw error;

        // 如果沒有資料，建立一個預設的
        if (!data || data.length === 0) {
            const { data: newData, error: insertError } = await supabase
                .from('notification_settings')
                .insert({ user_id: userId })
                .select();

            if (insertError) throw insertError;
            return newData[0];
        }

        return data[0];
    },

    /**
     * 更新通知設定
     */
    async updateNotificationSettings(userId: string, settings: any) {
        const { data, error } = await supabase
            .from('notification_settings')
            .update({
                ...settings,
                updated_at: new Date().toISOString(),
            })
            .eq('user_id', userId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },
};

export default authApi;
