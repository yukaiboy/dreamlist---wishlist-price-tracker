import React, { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { authApi } from '../lib/api/auth';
import { NotificationSettings } from '../../types';

interface Profile {
    id: string;
    email: string;
    display_name: string;
    avatar_url: string | null;
}

interface AuthContextType {
    user: User | null;
    profile: Profile | null;
    session: Session | null;
    loading: boolean;
    signUp: (email: string, password: string, displayName?: string) => Promise<any>;
    signIn: (email: string, password: string) => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    signInWithApple: () => Promise<void>;
    signOut: () => Promise<void>;
    updateProfile: (displayName?: string, avatarUrl?: string) => Promise<void>;
    refreshProfile: () => Promise<void>;
    resendVerification: (email: string) => Promise<void>;
    notificationSettings: NotificationSettings | null;
    updateNotificationSettings: (settings: Partial<NotificationSettings>) => Promise<void>;
    refreshNotificationSettings: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth 必須在 AuthProvider 內使用');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [notificationSettings, setNotificationSettings] = useState<NotificationSettings | null>(null);
    const [loading, setLoading] = useState(true);

    // 取得用戶資料
    const fetchProfile = async (userId: string) => {
        try {
            console.log('Fetching profile for:', userId);
            const data = await authApi.getProfile(userId);
            if (data) {
                setProfile(data as Profile);
            } else {
                console.warn('Profile not found, waiting for trigger...');
                // 如果 profile 不存在，延遲 1.5 秒再試一次（可能觸發還在跑）
                setTimeout(async () => {
                    const retryData = await authApi.getProfile(userId);
                    if (retryData) {
                        setProfile(retryData as Profile);
                        console.log('Profile found on retry');
                    }
                }, 1500);
            }
        } catch (error) {
            console.error('取得用戶資料失敗:', error);
        }
    };

    // 取得通知設定
    const fetchNotificationSettings = async (userId: string) => {
        try {
            const data = await authApi.getNotificationSettings(userId);
            setNotificationSettings(data as NotificationSettings);
        } catch (error) {
            console.error('取得通知設定失敗:', error);
        }
    };

    // 初始化與監聽
    useEffect(() => {
        let mounted = true;

        const syncState = async (session: Session | null, event?: string) => {
            if (!mounted) return;
            console.log(`SyncState triggered by ${event || 'init'}:`, session?.user?.email);

            setSession(session);
            const currentUser = session?.user ?? null;
            setUser(currentUser);

            if (currentUser) {
                // 異步抓取 Profile
                await fetchProfile(currentUser.id);
            } else {
                setProfile(null);
                setNotificationSettings(null);
            }

            // 確保每次同步最後都會關閉載入狀態
            if (mounted) setLoading(false);
        };

        // 1. 取得初始狀態
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (mounted) syncState(session, 'INITIAL_GET');
        });

        // 2. 監聽後續變化
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (mounted) {
                    console.log('Supabase Auth Event:', event);
                    syncState(session, event);
                }
            }
        );

        // 安全保險：5秒後無論如何都關閉載入中
        const timer = setTimeout(() => {
            if (mounted) {
                console.log('Auth loading safety timeout hit');
                setLoading(false);
            }
        }, 5000);

        return () => {
            mounted = false;
            clearTimeout(timer);
            subscription.unsubscribe();
        };
    }, []);

    // 註冊
    const signUp = async (email: string, password: string, displayName?: string) => {
        return await authApi.signUp({ email, password, displayName });
    };

    // 登入
    const signIn = async (email: string, password: string) => {
        setLoading(true); // 登入過程顯示載入中
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) throw error;

            // 登入成功
            if (data.session) {
                setSession(data.session);
                setUser(data.session.user);
                await fetchProfile(data.session.user.id);
            }
        } finally {
            setLoading(false);
        }
    };

    // OAuth 登入
    const signInWithGoogle = async () => { await authApi.signInWithGoogle(); };
    const signInWithApple = async () => { await authApi.signInWithApple(); };

    // 登出
    const signOut = async () => {
        setLoading(true);
        try {
            // 1. 先通知 Supabase (這會讓所有設備的 Session 失效，並觸發實時更新)
            await supabase.auth.signOut();

            // 2. 強制清除本地所有相關狀態
            setUser(null);
            setProfile(null);
            setSession(null);
            setNotificationSettings(null);

            // 3. 清理存儲
            localStorage.clear(); // 徹底清理，包括 supabase 的 token
            sessionStorage.clear();

            console.log('Logged out and storage cleared.');
        } catch (error) {
            console.error('Logout error but clearing state anyway:', error);
            setUser(null);
            setProfile(null);
            setSession(null);
        } finally {
            setLoading(false);
        }
    };

    // 更新用戶資料
    const updateProfile = async (displayName?: string, avatarUrl?: string) => {
        if (!user) return;
        try {
            await authApi.updateProfile(user.id, { displayName, avatarUrl });
            await fetchProfile(user.id);
        } catch (error) {
            console.error('更新用戶資料失敗:', error);
            throw error;
        }
    };

    const refreshProfile = async () => { if (user) await fetchProfile(user.id); };
    const resendVerification = async (email: string) => { await authApi.resendVerification(email); };

    const updateNotificationSettings = async (settings: Partial<NotificationSettings>) => {
        if (!user) return;
        try {
            const updated = await authApi.updateNotificationSettings(user.id, settings);
            setNotificationSettings(updated as NotificationSettings);
        } catch (error) {
            console.error('更新通知設定失敗:', error);
            throw error;
        }
    };

    const refreshNotificationSettings = async () => { if (user) await fetchNotificationSettings(user.id); };

    const value: AuthContextType = {
        user, profile, session, loading,
        signUp, signIn, signInWithGoogle, signInWithApple, signOut,
        updateProfile, refreshProfile, resendVerification,
        notificationSettings, updateNotificationSettings, refreshNotificationSettings,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
