
import React from 'react';
import { SharedItem } from '../types';

interface Props {
  onBack: () => void;
  onSelectItem: (id: string) => void;
}

const SHARED_ITEMS: SharedItem[] = [
  { id: '1', name: '北歐風三人座沙發', price: 18900, status: 'VOTING', proposer: '小明', proposerAvatar: 'https://images.unsplash.com/photo-1540560485459-c219cd00f2a5?auto=format&fit=crop&q=80&w=100', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=400', votes: 3, totalMembers: 5 },
  { id: '2', name: '智慧型空氣清淨機', price: 8500, status: 'APPROVED', proposer: '小明', proposerAvatar: 'https://images.unsplash.com/photo-1540560485459-c219cd00f2a5?auto=format&fit=crop&q=80&w=100', image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=400', votes: 5, totalMembers: 5 },
  { id: '3', name: '復古黑膠唱片機', price: 4200, status: 'VOTING', proposer: '阿強', proposerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix', image: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?auto=format&fit=crop&q=80&w=400', votes: 1, totalMembers: 5 }
];

const SharedListView: React.FC<Props> = ({ onBack, onSelectItem }) => {
  return (
    <div className="bg-[#fdfbf7] dark:bg-background-dark min-h-screen pb-40">
      {/* Header */}
      <nav className="sticky top-0 z-50 bg-[#fdfbf7]/80 dark:bg-background-dark/80 backdrop-blur-md px-6 py-5 flex items-center justify-between">
        <button onClick={onBack} className="flex items-center justify-center">
          <span className="material-symbols-outlined text-2xl font-bold">arrow_back</span>
        </button>
        <button className="flex items-center justify-center">
          <span className="material-symbols-outlined text-2xl">person_add</span>
        </button>
      </nav>

      <main className="px-6">
        {/* Group Info Section */}
        <section className="mt-4 mb-8">
          <h1 className="text-[34px] font-black tracking-tight text-[#1c140d] dark:text-white leading-tight mb-2">
            我們的新家
          </h1>
          <p className="text-primary font-bold text-lg mb-6">3 位成員共同參與</p>
          
          <div className="flex items-center -space-x-4">
            <div className="size-12 rounded-full border-[3px] border-[#fdfbf7] dark:border-background-dark overflow-hidden shadow-sm">
              <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100" className="w-full h-full object-cover" />
            </div>
            <div className="size-12 rounded-full border-[3px] border-[#fdfbf7] dark:border-background-dark overflow-hidden shadow-sm">
              <img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=100" className="w-full h-full object-cover" />
            </div>
            <div className="size-12 rounded-full border-[3px] border-[#fdfbf7] dark:border-background-dark overflow-hidden shadow-sm">
              <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=100" className="w-full h-full object-cover" />
            </div>
            <div className="size-12 rounded-full border-[3px] border-[#fdfbf7] dark:border-background-dark bg-primary flex items-center justify-center text-white text-sm font-black shadow-sm">
              +2
            </div>
          </div>
        </section>

        {/* Budget Tracker Card */}
        <section className="mb-12">
          <div className="bg-[#fef5ed] dark:bg-primary/10 p-8 rounded-[40px] flex flex-col gap-6 border border-primary/5 shadow-sm">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-[#8b7361] font-bold text-lg opacity-80">清單總額</p>
                <p className="text-[32px] font-black tracking-tight text-[#1c140d] dark:text-white">
                  NT$ 45,800
                </p>
              </div>
              <div className="bg-white dark:bg-black/20 px-4 py-2 rounded-full text-xs font-black text-primary border border-primary/10">
                預算追蹤中
              </div>
            </div>
            <div className="w-full space-y-3">
              <div className="flex justify-between items-end">
                <span className="text-base font-bold text-[#8b7361]">預算達成率</span>
                <span className="text-xl font-black text-[#1c140d] dark:text-white">65%</span>
              </div>
              <div className="h-2.5 w-full bg-white/60 dark:bg-black/20 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: '65%' }}></div>
              </div>
            </div>
          </div>
        </section>

        {/* Wishes List Section */}
        <section>
          <div className="flex items-center justify-between mb-6 px-1">
            <h2 className="text-2xl font-black text-[#1c140d] dark:text-white">共同願望</h2>
            <button className="text-primary text-base font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-xl">filter_list</span>
              篩選
            </button>
          </div>
          
          <div className="space-y-5">
            {SHARED_ITEMS.map(item => (
              <div 
                key={item.id} 
                onClick={() => onSelectItem(item.id)}
                className="bg-white dark:bg-card-dark p-4 rounded-[32px] shadow-[0_8px_20px_rgba(0,0,0,0.03)] border border-black/5 dark:border-white/5 flex gap-5 cursor-pointer active:scale-[0.98] transition-all relative group overflow-hidden"
              >
                {/* Status Tag */}
                <div className="absolute top-4 right-4 z-10">
                  <span className={`text-xs font-black px-3 py-1.5 rounded-full ${
                    item.status === 'VOTING' ? 'bg-[#fef5ed] text-[#f18c27]' : 'bg-[#e7f8ef] text-[#22c55e]'
                  }`}>
                    {item.status === 'VOTING' ? '投票中' : '已通過'}
                  </span>
                </div>

                {/* Item Image */}
                <div className="w-28 h-28 shrink-0 rounded-[24px] overflow-hidden">
                  <img src={item.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={item.name} />
                </div>

                {/* Item Details */}
                <div className="flex flex-col justify-between py-1 grow pr-20">
                  <div className="space-y-1">
                    <h3 className="font-bold text-lg text-[#1c140d] dark:text-white leading-tight truncate">
                      {item.name}
                    </h3>
                    <p className="text-primary font-black text-xl">
                      NT$ {item.price.toLocaleString()}
                    </p>
                  </div>
                  
                  {/* Proposer Info */}
                  <div className="flex items-center gap-2 mt-2">
                    <img className="size-6 rounded-full object-cover border border-orange-50" src={item.proposerAvatar} alt={item.proposer} />
                    <span className="text-sm font-bold text-[#8b7361] dark:text-gray-400">由 {item.proposer} 新增</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Floating Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 p-8 pb-10 bg-gradient-to-t from-[#fdfbf7] via-[#fdfbf7] to-transparent dark:from-background-dark dark:via-background-dark z-50">
        <button className="w-full h-18 bg-[#f18c27] hover:bg-[#e67e16] text-white font-black text-xl rounded-3xl shadow-[0_12px_24px_rgba(241,140,39,0.25)] transition-all active:scale-[0.98] flex items-center justify-center gap-3">
          <span className="material-symbols-outlined text-3xl font-bold">add</span>
          新增共同願望
        </button>
      </div>
    </div>
  );
};

export default SharedListView;
