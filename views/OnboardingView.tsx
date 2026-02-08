
import React from 'react';

interface Props {
  onComplete: () => void;
}

const OnboardingView: React.FC<Props> = ({ onComplete }) => {
  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden max-w-[480px] mx-auto bg-background-light dark:bg-background-dark">
      <div className="flex items-center p-4 justify-end">
        <button onClick={onComplete} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5">
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      <div className="flex flex-col items-center justify-center px-6 pt-4 pb-8">
        <div className="mb-8 relative">
          <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150"></div>
          <div className="relative bg-primary/10 dark:bg-primary/20 p-8 rounded-full">
            <span className="material-symbols-outlined text-primary !text-6xl animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
          </div>
        </div>
        <h1 className="text-3xl font-bold leading-tight text-center pb-3">太棒了，小明！</h1>
        <p className="text-accent-brown text-base text-center px-4">你的圓夢之旅正式開始。現在，你可以先從這裡開始：</p>
      </div>

      <div className="px-4 space-y-4 flex-1">
        <div 
          onClick={onComplete}
          className="group flex flex-col gap-4 rounded-xl bg-white dark:bg-[#2d2218] p-5 shadow-sm border border-[#f3ede7] dark:border-[#3d2e21] cursor-pointer hover:border-primary/50 transition-all"
        >
          <div className="flex items-start gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <span className="material-symbols-outlined !text-3xl">add_shopping_cart</span>
            </div>
            <div className="flex flex-col gap-1 pr-4">
              <h3 className="text-lg font-bold">新增第一個願望</h3>
              <p className="text-accent-brown text-sm leading-normal">貼上商品連結，我們幫你追蹤價格變化，讓你買在最低點。</p>
            </div>
            <div className="ml-auto self-center text-accent-brown">
              <span className="material-symbols-outlined">chevron_right</span>
            </div>
          </div>
          <div className="w-full h-32 overflow-hidden rounded-xl bg-background-light dark:bg-background-dark/50">
            <img src="https://picsum.photos/seed/ui/600/300" className="w-full h-full object-cover opacity-80" alt="Preview" />
          </div>
        </div>

        <div 
          onClick={onComplete}
          className="group flex flex-col gap-4 rounded-xl bg-white dark:bg-[#2d2218] p-5 shadow-sm border border-[#f3ede7] dark:border-[#3d2e21] cursor-pointer hover:border-primary/50 transition-all"
        >
          <div className="flex items-start gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-[#f3ede7] dark:bg-[#3d2e21] text-[#1c140d] dark:text-white">
              <span className="material-symbols-outlined !text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>groups</span>
            </div>
            <div className="flex flex-col gap-1 pr-4">
              <h3 className="text-lg font-bold">建立或加入共同清單</h3>
              <p className="text-accent-brown text-sm leading-normal">與家人朋友一起討論並決定下一個願望。</p>
            </div>
            <div className="ml-auto self-center text-accent-brown">
              <span className="material-symbols-outlined">chevron_right</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-8 flex flex-col items-center">
        <button onClick={onComplete} className="text-accent-brown text-sm font-medium hover:text-primary transition-colors">
          稍後再說，先帶我隨便看看
        </button>
        <div className="mt-4 h-1 w-24 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
      </div>
    </div>
  );
};

export default OnboardingView;
