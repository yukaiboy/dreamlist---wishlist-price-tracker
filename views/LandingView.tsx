
import React from 'react';

interface Props {
  onNext: () => void;
  onLogin: () => void;
}

const LandingView: React.FC<Props> = ({ onNext, onLogin }) => {
  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen flex flex-col relative overflow-hidden">
      <div className="relative flex flex-col flex-1 w-full max-w-md mx-auto px-6 pt-16 pb-12 z-10">
        <header className="mb-12">
          <h1 className="text-[#2D241E] dark:text-white text-[32px] font-bold leading-tight tracking-tight mb-4">
            有些願望，<br />值得等一個對的時機
          </h1>
          <p className="text-[#6B5E54] dark:text-gray-300 text-base font-normal leading-relaxed">
            不只是想買 - 而是為自己、重要的人<br />留下每一個願望的軌跡
          </p>
        </header>

        <main className="flex-1 space-y-4">
          {[
            { icon: 'favorite', title: '個人收藏', desc: '為自己收藏想要的東西' },
            { icon: 'group', title: '共同願望', desc: '和家人朋友一起決定' },
            { icon: 'sell', title: '價格追蹤', desc: '等到最值得的那一刻' }
          ].map((item, idx) => (
            <div key={idx} className="flex items-center gap-5 p-4 rounded-2xl bg-white/50 dark:bg-white/5 border border-[#F3EDE7] dark:border-white/10">
              <div className="flex items-center justify-center rounded-full bg-primary/10 text-primary shrink-0 size-14">
                <span className="material-symbols-outlined text-[28px]">{item.icon}</span>
              </div>
              <div className="flex flex-col justify-center">
                <h3 className="text-[#2D241E] dark:text-white text-lg font-semibold leading-tight mb-1">{item.title}</h3>
                <p className="text-[#8B7E74] dark:text-gray-400 text-sm font-normal">{item.desc}</p>
              </div>
            </div>
          ))}
        </main>

        <div className="w-full py-8 flex justify-center opacity-40">
          <div className="w-32 h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent rounded-full"></div>
        </div>

        <footer className="mt-auto space-y-4">
          <button
            onClick={onNext}
            className="w-full bg-primary hover:bg-primary/90 text-white font-semibold text-lg py-5 px-4 rounded-full transition-all active:scale-[0.98] shadow-lg shadow-primary/20"
          >
            開始建立我的願望清單
          </button>
          <button
            onClick={onLogin}
            className="w-full py-3 text-[#8B7E74] dark:text-gray-400 font-medium text-base hover:text-primary transition-colors"
          >
            已有帳號？<span className="text-primary font-bold">登入</span>
          </button>
        </footer>
      </div>

      <div className="fixed top-[-10%] right-[-10%] w-[300px] h-[300px] rounded-full bg-primary/5 blur-[100px] pointer-events-none"></div>
      <div className="fixed bottom-[20%] left-[-20%] w-[400px] h-[400px] rounded-full bg-orange-100/30 blur-[120px] dark:bg-primary/10 pointer-events-none"></div>
    </div>
  );
};

export default LandingView;
