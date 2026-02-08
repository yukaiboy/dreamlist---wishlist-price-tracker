
import React, { useState } from 'react';
import { useAuth } from '../src/contexts/AuthContext';

interface Props {
  onBack: () => void;
  onSignup: () => void;
}

const SignupView: React.FC<Props> = ({ onBack, onSignup }) => {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email || !password) {
      setError('請填寫電子郵件和密碼');
      return;
    }

    if (password.length < 8) {
      setError('密碼需至少 8 個字元');
      return;
    }

    setLoading(true);
    try {
      const result = await signUp(email, password, displayName || undefined);
      if (result && !result.session && result.user) {
        setSuccess('註冊成功！請至您的信箱驗證帳號後登入。');
        return;
      }
      onSignup();
    } catch (err) {
      setError((err as Error).message || '註冊失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex h-screen w-full flex-col overflow-x-hidden bg-background-light dark:bg-background-dark">
      <header className="flex items-center justify-between px-4 py-4 sticky top-0 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md z-10">
        <button onClick={onBack} className="flex items-center justify-center size-10 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
          <span className="material-symbols-outlined text-[#1c140d] dark:text-white">arrow_back_ios_new</span>
        </button>
        <h2 className="text-[#1c140d] dark:text-white text-lg font-bold flex-1 text-center pr-10">建立帳號</h2>
      </header>

      <main className="flex-1 overflow-y-auto px-6 pb-12">
        <div className="pt-8 pb-10">
          <h1 className="text-[#1c140d] dark:text-white tracking-tight text-[36px] font-bold leading-tight flex items-center gap-2">
            讓我們開始吧 <span className="text-primary">😊</span>
          </h1>
          <p className="text-accent-brown dark:text-[#c4a68a] mt-2 text-lg">加入我們，開始追蹤你的願望清單</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 max-w-md mx-auto">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl text-red-600 text-sm font-medium">
              {error}
            </div>
          )}
          {success && (
            <div className="p-4 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-2xl text-green-600 text-sm font-medium">
              {success}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold px-1">電子郵件</label>
            <input
              className="rounded-full border border-[#e8dbcf] dark:border-[#4a3929] bg-white dark:bg-[#2d2218] px-6 h-14 text-base focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-accent-brown/50 shadow-sm"
              placeholder="example@mail.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold px-1">顯示名稱 (選填)</label>
            <input
              className="rounded-full border border-[#e8dbcf] dark:border-[#4a3929] bg-white dark:bg-[#2d2218] px-6 h-14 text-base focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-accent-brown/50 shadow-sm"
              placeholder="想讓我們怎麼稱呼你？"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold px-1">密碼</label>
            <div className="relative">
              <input
                className="rounded-full border border-[#e8dbcf] dark:border-[#4a3929] bg-white dark:bg-[#2d2218] px-6 h-14 text-base focus:border-primary focus:ring-1 focus:ring-primary pr-14 w-full"
                placeholder="至少 8 個字元"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-accent-brown"
              >
                <span className="material-symbols-outlined">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>
          <div className="pt-6">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-14 rounded-full text-lg shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>註冊中...</span>
                </>
              ) : (
                '註冊帳號'
              )}
            </button>
          </div>
        </form>
      </main>

      <footer className="px-8 py-8 text-center mt-auto">
        <p className="text-accent-brown dark:text-[#c4a68a] text-sm leading-relaxed max-w-xs mx-auto">
          註冊即代表您同意我們的
          <a className="text-primary font-semibold hover:underline px-1" href="#">服務條款</a>
          與
          <a className="text-primary font-semibold hover:underline px-1" href="#">隱私權政策</a>
        </p>
      </footer>
    </div>
  );
};

export default SignupView;
