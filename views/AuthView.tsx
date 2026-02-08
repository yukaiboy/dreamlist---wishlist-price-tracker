
import React, { useState } from 'react';
import { useAuth } from '../src/contexts/AuthContext';

interface Props {
  onEmailClick: () => void;
  onLogin: () => void;
  initialShowLogin?: boolean;
}

const AuthView: React.FC<Props> = ({ onEmailClick, onLogin, initialShowLogin = false }) => {
  const { signIn, signInWithGoogle, signInWithApple, resendVerification } = useAuth();
  const [showLoginForm, setShowLoginForm] = useState(initialShowLogin);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error('Google login error:', err);
      setError((err as Error).message || 'Google 登入失敗');

      // 檢測是否為配置錯誤，給予友善提示
      if ((err as Error).message?.includes('provider is not enabled')) {
        alert('請先至 Supabase Dashboard > Authentication > Providers 開啟 Google 登入功能，並設定 Client ID。');
      }
    } finally {
      // 注意：如果成功跳轉，這個 finally 可能不會執行（因為頁面已重整），但如果是失敗或尚未設定就會取消 loading
      setLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    setLoading(true);
    try {
      await signInWithApple();
    } catch (err) {
      console.error('Apple login error:', err);
      setError((err as Error).message || 'Apple 登入失敗');

      if ((err as Error).message?.includes('provider is not enabled')) {
        alert('請先至 Supabase Dashboard > Authentication > Providers 開啟 Apple 登入功能。');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email) return;
    setLoading(true);
    try {
      await resendVerification(email);
      setSuccess('驗證信已重送，請檢查您的信箱。');
      setError(null);
    } catch (err: any) {
      setError(err.message || '重送失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email || !password) {
      setError('請填寫電子郵件和密碼');
      return;
    }

    setLoading(true);
    try {
      await signIn(email, password);
      onLogin();
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.message === 'Invalid login credentials') {
        setError('登入失敗：帳號或密碼錯誤，或者您的信箱尚未驗證');
      } else if (err.message === 'Email not confirmed') {
        setError('您的電子郵件尚未驗證，請先至信箱點擊驗證連結。');
      } else {
        setError(err.message || '登入失敗，請檢查您的帳號密碼');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden bg-gradient-to-b from-[#f7f1eb] to-[#fdfbf7] dark:from-[#1a140f] dark:to-[#120d09]">
      {/* 上方標題區域 */}
      <div className="flex flex-col items-center pt-24 px-8 z-20">
        {/* 標誌性圖示 */}
        <div className="mb-10 relative">
          <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-3xl transform scale-150"></div>
          <div className="relative flex items-center justify-center w-24 h-24 bg-white/80 dark:bg-white/10 backdrop-blur-md rounded-[32px] shadow-sm border border-white/40">
            <span className="material-symbols-outlined text-primary text-5xl" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400" }}>
              flare
            </span>
          </div>
        </div>

        <h1 className="text-[#3c2f25] dark:text-white text-[32px] font-bold tracking-tight text-center leading-tight mb-4">
          {showLoginForm ? '歡迎回來' : '加入我們，'}<br />{showLoginForm ? '' : '開始圓夢之旅'}
        </h1>
        <p className="text-[#8b7361] dark:text-[#a68d7a] text-center text-lg font-medium leading-relaxed max-w-[280px]">
          {showLoginForm ? '登入您的帳號以繼續' : '管理你的清單，追蹤心儀價格，優雅地實現生活願望'}
        </p>
        <br />
      </div>

      {/* 下方控制按鈕區域 */}
      <div className="mt-auto flex flex-col items-center pb-16 px-8 z-30 w-full">
        {error && (
          <div className="w-full max-w-[360px] mb-4 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl text-red-600 text-sm font-medium text-center flex flex-col items-center gap-2">
            <span>{error}</span>
            {error.includes('尚未驗證') && (
              <button
                onClick={handleResendVerification}
                className="text-primary underline font-bold"
                disabled={loading}
              >
                重送驗證信
              </button>
            )}
          </div>
        )}

        {success && (
          <div className="w-full max-w-[360px] mb-4 p-4 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-2xl text-green-600 text-sm font-medium text-center">
            {success}
          </div>
        )}

        {showLoginForm ? (
          <form onSubmit={handleEmailLogin} className="flex flex-col w-full max-w-[360px] gap-4">
            <input
              type="email"
              placeholder="電子郵件"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-full border border-[#e8dbcf] dark:border-[#4a3929] bg-white dark:bg-[#2d2218] px-6 h-[56px] text-base focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-[#8b7361]/50"
              disabled={loading}
            />
            <input
              type="password"
              placeholder="密碼"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-full border border-[#e8dbcf] dark:border-[#4a3929] bg-white dark:bg-[#2d2218] px-6 h-[56px] text-base focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-[#8b7361]/50"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-[#f18c27] flex items-center justify-center gap-3 rounded-full h-[64px] px-6 text-white text-base font-bold transition-transform active:scale-[0.98] shadow-lg shadow-primary/20 hover:bg-[#e67e16] disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>登入中...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-2xl">login</span>
                  <span>登入</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowLoginForm(false);
                setError(null);
                setSuccess(null);
              }}
              className="text-[#8b7361] font-bold hover:text-primary transition-colors"
            >
              返回
            </button>
          </form>
        ) : (
          <div className="flex flex-col w-full max-w-[360px] gap-4">
            {/* Google 與 Apple 登入按鈕暫時隱藏，待後台設定完成後開啟
            <button
              onClick={handleGoogleLogin}
              className="bg-[#eeebe6] dark:bg-white/15 flex items-center justify-center gap-3 rounded-full h-[64px] px-6 text-[#1c140d] dark:text-white text-base font-bold shadow-sm border border-black/5 transition-transform active:scale-[0.98] hover:bg-[#e6e2db]"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <img src="https://www.gstatic.com/images/branding/googleg/1x/googleg_standard_color_128dp.png" className="w-6 h-6 object-contain" alt="Google" />
                  <span className="truncate">透過 Google 繼續</span>
                </>
              )}
            </button>

            <button
              onClick={handleAppleLogin}
              className="bg-black flex items-center justify-center gap-3 rounded-full h-[64px] px-6 text-white text-base font-bold transition-transform active:scale-[0.98] shadow-sm hover:bg-zinc-900"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>ios</span>
                  <span className="truncate">透過 Apple 繼續</span>
                </>
              )}
            </button>
            */}

            {/* 電子郵件按鈕 (註冊) */}
            <button
              onClick={onEmailClick}
              className="bg-[#f18c27] flex items-center justify-center gap-3 rounded-full h-[64px] px-6 text-white text-base font-bold transition-transform active:scale-[0.98] shadow-lg shadow-primary/20 hover:bg-[#e67e16]"
            >
              <span className="material-symbols-outlined text-2xl">mail</span>
              <span className="truncate">透過電子郵件註冊</span>
            </button>
          </div>
        )}

        {!showLoginForm && (
          <div className="mt-10 flex items-center gap-1.5 text-[#8b7361] dark:text-[#a68d7a] text-sm font-medium">
            <span>已有帳號？</span>
            <button
              onClick={() => setShowLoginForm(true)}
              className="text-primary hover:text-primary/80 transition-colors font-bold text-base"
            >
              登入
            </button>
          </div>
        )}
      </div>

      {/* 底部裝飾條 */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-black/5 dark:bg-white/10 rounded-full"></div>
    </div>
  );
};

export default AuthView;
