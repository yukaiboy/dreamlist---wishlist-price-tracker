
import React, { useState, useEffect } from 'react';
import { useAuth } from '../src/contexts/AuthContext';
import { historyApi, HistoryItem } from '../src/lib/api/history';

interface Props {
  onBack: () => void;
}

const CATEGORIES = ['服飾配件', '電子產品', '居家生活', '美妝保養'];

const HistoryView: React.FC<Props> = ({ onBack }) => {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<'achieved' | 'abandoned'>('achieved');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [historyData, setHistoryData] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) return;

      setLoading(true);
      setError(null);

      try {
        const data = await historyApi.getHistory(user.id, statusFilter, activeCategory || undefined);
        setHistoryData(data);
      } catch (err) {
        setError((err as Error).message || '載入歷史紀錄失敗');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user, statusFilter, activeCategory]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-TW', { month: 'long', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-[#fdfbf7] dark:bg-background-dark pb-12">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#fdfbf7]/90 dark:bg-background-dark/90 backdrop-blur-md px-4 py-4">
        <button onClick={onBack} className="flex items-center gap-1 text-primary font-bold">
          <span className="material-symbols-outlined text-xl">arrow_back_ios</span>
          <span>返回</span>
        </button>
        <h1 className="text-3xl font-black mt-2 px-2 text-[#1c140d] dark:text-white">歷史紀錄</h1>
      </header>

      <main className="px-4">
        {/* Status Tabs */}
        <div className="flex bg-white dark:bg-white/5 p-1.5 rounded-2xl gap-1 shadow-inner border border-black/[0.02] mb-6">
          <button
            onClick={() => setStatusFilter('achieved')}
            className={`flex-1 py-3 rounded-xl text-sm font-black transition-all duration-300 flex items-center justify-center gap-2 ${statusFilter === 'achieved'
                ? 'bg-green-500 text-white shadow-lg'
                : 'text-[#8b7361] hover:bg-[#f8f5f0]'
              }`}
          >
            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            已達成
          </button>
          <button
            onClick={() => setStatusFilter('abandoned')}
            className={`flex-1 py-3 rounded-xl text-sm font-black transition-all duration-300 flex items-center justify-center gap-2 ${statusFilter === 'abandoned'
                ? 'bg-gray-500 text-white shadow-lg'
                : 'text-[#8b7361] hover:bg-[#f8f5f0]'
              }`}
          >
            <span className="material-symbols-outlined text-lg">close</span>
            已放棄
          </button>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 flex-wrap mb-6">
          <button
            onClick={() => setActiveCategory(null)}
            className={`px-4 py-2 rounded-full text-[13px] font-bold transition-all ${activeCategory === null
                ? 'bg-[#1c140d] dark:bg-white text-white dark:text-black shadow-md'
                : 'bg-white dark:bg-white/5 text-[#8b7361] border border-[#e8e0d6]'
              }`}
          >
            全部
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-[13px] font-bold transition-all ${activeCategory === cat
                  ? 'bg-[#1c140d] dark:bg-white text-white dark:text-black shadow-md'
                  : 'bg-white dark:bg-white/5 text-[#8b7361] border border-[#e8e0d6]'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* History List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-500">
            <span className="material-symbols-outlined text-4xl mb-2">error</span>
            <p className="font-bold">{error}</p>
          </div>
        ) : historyData.length === 0 ? (
          <div className="text-center py-12 text-[#8b7361]">
            <span className="material-symbols-outlined text-5xl mb-3 opacity-50">
              {statusFilter === 'achieved' ? 'emoji_events' : 'sentiment_dissatisfied'}
            </span>
            <p className="font-bold">
              {statusFilter === 'achieved' ? '還沒有達成的願望' : '太棒了！沒有放棄的願望'}
            </p>
            <p className="text-sm mt-1 opacity-70">
              {statusFilter === 'achieved' ? '繼續努力，願望終會實現！' : '繼續保持這份堅持！'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {historyData.map(item => (
              <div
                key={item.id}
                className="bg-white dark:bg-card-dark rounded-3xl p-4 flex gap-4 shadow-sm border border-black/[0.03]"
              >
                <div className="w-20 h-20 rounded-2xl bg-[#f8f5f0] dark:bg-black/20 overflow-hidden flex-shrink-0">
                  {item.image_url ? (
                    <img src={item.image_url} className="w-full h-full object-cover" alt={item.name} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#8b7361]/30">
                      <span className="material-symbols-outlined text-3xl">image</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 flex flex-col justify-center min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${item.status === 'achieved'
                        ? 'bg-green-100 dark:bg-green-500/20 text-green-600'
                        : 'bg-gray-100 dark:bg-gray-500/20 text-gray-500'
                      }`}>
                      {item.status === 'achieved' ? '已達成' : '已放棄'}
                    </span>
                    {item.category && (
                      <span className="text-[10px] font-bold text-[#8b7361] uppercase tracking-wider">
                        {item.category}
                      </span>
                    )}
                  </div>
                  <h3 className="font-black text-[16px] text-[#1c140d] dark:text-white truncate">
                    {item.name}
                  </h3>
                  <div className="flex items-center justify-between mt-2">
                    {item.final_price && (
                      <span className="font-bold text-primary">${item.final_price.toLocaleString()}</span>
                    )}
                    <span className="text-[11px] text-[#8b7361]">{formatDate(item.completed_at)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default HistoryView;
