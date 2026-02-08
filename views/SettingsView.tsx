
import React, { useState, useRef } from 'react';
import { useAuth } from '../src/contexts/AuthContext';
import { authApi } from '../src/lib/api/auth';

interface Props {
  onBack: () => void;
  onLogout: () => void;
}

const SettingsView: React.FC<Props> = ({ onBack, onLogout }) => {
  const { profile, signOut, updateProfile, refreshProfile, notificationSettings, updateNotificationSettings } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatar_url || null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && profile) {
      // 立即顯示本地預覽
      const objectUrl = URL.createObjectURL(file);
      setAvatarUrl(objectUrl);

      try {
        setLoading(true);
        const url = await authApi.uploadAvatar(profile.id, file);
        await updateProfile(undefined, url);
        setAvatarUrl(url); // 更新為服務器上的真正 URL
        await refreshProfile();
      } catch (error) {
        console.error('上傳頭像失敗 (請確認 Supabase Storage 已建立 avatars bucket):', error);
        alert('上傳失敗。請確認 Supabase 的 Storage 已建立名為 avatars 的 Bucket，且權限設定為公開。');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const newPassword = (form.elements.namedItem('newPassword') as HTMLInputElement).value;

    if (newPassword.length < 8) {
      setPasswordError('密碼需至少 8 個字元');
      return;
    }

    try {
      setLoading(true);
      await authApi.changePassword(newPassword);
      alert('密碼已成功修改！');
      setShowPasswordModal(false);
    } catch (error) {
      setPasswordError((error as Error).message || '修改密碼失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('登出失敗:', error);
    } finally {
      onLogout(); // 確保不論如何都回到登入頁
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await authApi.deleteAccount();
      alert('帳號已成功刪除');
      onLogout();
    } catch (error) {
      console.error('刪除帳號失敗:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#fdfbf7] dark:bg-background-dark pb-32 overflow-x-hidden relative">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#fdfbf7]/90 dark:bg-background-dark/90 backdrop-blur-md px-4 py-4">
        <button onClick={onBack} className="flex items-center gap-1 text-primary font-bold">
          <span className="material-symbols-outlined text-xl">arrow_back_ios</span>
          <span>返回</span>
        </button>
        <h1 className="text-3xl font-black mt-2 px-2 text-[#1c140d] dark:text-white">設定</h1>
      </header>

      <main className="px-4 space-y-8 mt-4">
        {/* Account Settings */}
        <section>
          <h2 className="px-2 mb-3 text-[13px] font-bold text-[#8b7361] dark:text-[#a68d7a] uppercase tracking-wider">帳號設定</h2>
          <div className="bg-white dark:bg-card-dark rounded-3xl p-6 shadow-sm border border-black/5">
            <div className="flex items-center gap-4">
              <div
                onClick={handleAvatarClick}
                className={`relative size-20 rounded-full overflow-hidden bg-orange-50 dark:bg-primary/10 border-4 border-white dark:border-zinc-800 shadow-sm cursor-pointer group ${loading ? 'opacity-50' : ''}`}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover group-hover:opacity-80 transition-opacity" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-3xl">add_a_photo</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <span className="material-symbols-outlined text-white text-xl">edit</span>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*"
                  disabled={loading}
                />
              </div>
              <div className="flex flex-col">
                <h3 className="text-2xl font-black text-[#1c140d] dark:text-white">
                  {profile?.display_name || '用戶'}
                </h3>
                <p className="text-[#8b7361] text-sm mb-2">{profile?.email || ''}</p>
                <div className="flex gap-4">
                  <button
                    onClick={() => setShowPasswordModal(true)}
                    className="text-primary text-sm font-bold hover:underline"
                  >
                    修改密碼
                  </button>
                  <div className="w-px h-4 bg-black/10 dark:bg-white/10 self-center"></div>
                  <button
                    onClick={() => setShowLogoutConfirm(true)}
                    className="text-red-500 text-sm font-bold hover:underline"
                  >
                    登出
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Notification Settings */}
        <section>
          <h2 className="px-2 mb-3 text-[13px] font-bold text-[#8b7361] dark:text-[#a68d7a] uppercase tracking-wider">通知設定</h2>
          <div className="bg-white dark:bg-card-dark rounded-3xl overflow-hidden shadow-sm border border-black/5 divide-y divide-black/5 dark:divide-white/5">
            {[
              { key: 'price_alerts', icon: 'notifications', label: '價格追蹤提醒' },
              { key: 'price_drop_notifications', icon: 'trending_down', label: '降價優惠通知' },
              { key: 'voting_notifications', icon: 'how_to_vote', label: '共同清單投票通知' },
              { key: 'achievement_reminders', icon: 'grade', label: '願望達成提醒' }
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-5">
                <div className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-[#8b7361]">{item.icon}</span>
                  <span className="font-bold text-[#1c140d] dark:text-white">{item.label}</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={notificationSettings ? (notificationSettings as any)[item.key] : false}
                    onChange={(e) => updateNotificationSettings({ [item.key]: e.target.checked })}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            ))}
          </div>
        </section>

        {/* List Preferences */}
        <section>
          <h2 className="px-2 mb-3 text-[13px] font-bold text-[#8b7361] dark:text-[#a68d7a] uppercase tracking-wider">清單偏好</h2>
          <div className="bg-white dark:bg-card-dark rounded-3xl overflow-hidden shadow-sm border border-black/5 divide-y divide-black/5 dark:divide-white/5">
            <div className="flex items-center justify-between p-5">
              <span className="font-bold text-[#1c140d] dark:text-white">預設開啟價格追蹤</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            <div className="flex items-center justify-between p-5">
              <span className="font-bold text-[#1c140d] dark:text-white">偏好平台</span>
              <div className="flex items-center gap-1 text-[#8b7361] text-sm">
                <span>所有平台</span>
                <span className="material-symbols-outlined text-lg">chevron_right</span>
              </div>
            </div>
          </div>
        </section>

        {/* About */}
        <section>
          <h2 className="px-2 mb-3 text-[13px] font-bold text-[#8b7361] dark:text-[#a68d7a] uppercase tracking-wider">關於</h2>
          <div className="bg-white dark:bg-card-dark rounded-3xl overflow-hidden shadow-sm border border-black/5 divide-y divide-black/5 dark:divide-white/5">
            <div className="flex items-center justify-between p-5">
              <span className="font-bold text-[#1c140d] dark:text-white">版本號</span>
              <span className="text-[#8b7361] text-sm">v1.0.0</span>
            </div>
            <div className="w-full flex items-center justify-between p-5">
              <span className="font-bold text-[#1c140d] dark:text-white">作者 : Yu Kai Lin</span>
            </div>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="pt-4">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full flex items-center justify-center gap-2 p-5 bg-red-50 dark:bg-red-500/10 rounded-3xl text-red-500 font-bold border border-red-100 dark:border-red-500/20 active:scale-[0.98] transition-all"
          >
            <span className="material-symbols-outlined">delete_forever</span>
            <span>刪除帳號</span>
          </button>
        </section>

        {/* Footer */}
        <footer className="pt-4 pb-8 flex flex-col items-center gap-2 opacity-50">
          <p className="text-[11px] font-bold text-[#8b7361]">WishList & PriceTracker © 2026</p>
        </footer>
      </main>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white dark:bg-card-dark rounded-[32px] p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
            <h2 className="text-2xl font-black mb-6">修改密碼</h2>
            <form onSubmit={handleSavePassword} className="space-y-4">
              {passwordError && (
                <div className="p-3 bg-red-50 dark:bg-red-500/10 rounded-xl text-red-600 text-sm">
                  {passwordError}
                </div>
              )}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#8b7361] px-1">新密碼</label>
                <input
                  name="newPassword"
                  type="password"
                  required
                  className="w-full h-12 rounded-xl bg-[#fdfbf7] dark:bg-black/20 border border-black/5 px-4 outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="至少 8 個字元"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordError(null);
                  }}
                  className="flex-1 h-12 rounded-xl font-bold text-[#8b7361] hover:bg-black/5 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 h-12 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                  {loading ? '儲存中...' : '儲存修改'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-xs bg-white dark:bg-card-dark rounded-[32px] p-8 shadow-2xl text-center animate-in fade-in zoom-in duration-300">
            <div className="size-16 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center text-red-500 mx-auto mb-4">
              <span className="material-symbols-outlined text-3xl">logout</span>
            </div>
            <h2 className="text-xl font-black mb-2">確認登出？</h2>
            <p className="text-sm text-[#8b7361] mb-8">您確定要離開目前的帳號嗎？</p>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleLogout}
                className="w-full h-12 rounded-xl bg-red-500 text-white font-bold shadow-lg shadow-red-500/20"
              >
                確認登出
              </button>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="w-full h-12 rounded-xl font-bold text-[#8b7361] hover:bg-black/5 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-xs bg-white dark:bg-card-dark rounded-[32px] p-8 shadow-2xl text-center animate-in fade-in zoom-in duration-300">
            <div className="size-16 bg-red-500/10 rounded-full flex items-center justify-center text-red-600 mx-auto mb-4">
              <span className="material-symbols-outlined text-3xl">warning</span>
            </div>
            <h2 className="text-xl font-black mb-2 text-red-600">確定要刪除帳號？</h2>
            <p className="text-sm text-[#8b7361] dark:text-gray-400 mb-8">此操作無法復原，您的所有願望清單與設定將會被永久移除。</p>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleDeleteAccount}
                className="w-full h-12 rounded-xl bg-red-600 text-white font-bold shadow-lg shadow-red-600/30 active:scale-95 transition-all"
              >
                確定刪除，永不後悔
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="w-full h-12 rounded-xl font-bold text-[#8b7361] hover:bg-black/5 transition-colors"
              >
                我再考慮一下
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsView;
