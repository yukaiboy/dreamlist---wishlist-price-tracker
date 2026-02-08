
import React, { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../src/contexts/AuthContext';
import { useProduct } from '../src/lib/hooks/useProducts';
import { productsApi } from '../src/lib/api/products';

interface Props {
  productId: string | null;
  onBack: () => void;
  onSharedList: () => void;
}

type Timeframe = '1M' | '3M' | '6M';

const ItemDetailView: React.FC<Props> = ({ productId, onBack, onSharedList }) => {
  const { user } = useAuth();
  const { product, priceHistory, loading } = useProduct(productId);
  const [timeframe, setTimeframe] = useState<Timeframe>('1M');
  const [notifyEnabled, setNotifyEnabled] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // 根據時間範圍過濾價格歷史
  const chartData = useMemo(() => {
    if (!priceHistory.length) return [];

    const now = new Date();
    let cutoffDate = new Date();

    switch (timeframe) {
      case '1M':
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case '3M':
        cutoffDate.setMonth(now.getMonth() - 3);
        break;
      case '6M':
        cutoffDate.setMonth(now.getMonth() - 6);
        break;
    }

    return priceHistory
      .filter(p => new Date(p.recorded_at) >= cutoffDate)
      .map(p => ({
        date: new Date(p.recorded_at).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' }),
        price: p.price
      }));
  }, [priceHistory, timeframe]);

  const handleMarkAchieved = async () => {
    if (!product || !user) return;

    setActionLoading(true);
    try {
      await productsApi.markAsAchieved(product.id, user.id);
      onBack();
    } catch (error) {
      console.error('標記失敗:', error);
      alert('操作失敗，請稍後再試');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fdfbf7] dark:bg-background-dark">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fdfbf7] dark:bg-background-dark">
        <span className="material-symbols-outlined text-6xl text-[#8b7361]/50 mb-4">search_off</span>
        <p className="text-[#8b7361] font-bold mb-4">找不到此商品</p>
        <button onClick={onBack} className="text-primary font-bold">返回</button>
      </div>
    );
  }

  // 模擬商店價格（實際應從 API 獲取）
  const storePrices = [
    { store: product.store || 'MOMO', price: product.price },
    { store: '蝦皮', price: Math.round(product.price * 1.05) },
    { store: 'Amazon', price: Math.round(product.price * 1.1) }
  ].sort((a, b) => a.price - b.price);

  return (
    <div className="min-h-screen bg-[#fdfbf7] dark:bg-background-dark pb-48 animate-in fade-in duration-300">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#fdfbf7]/90 dark:bg-background-dark/90 backdrop-blur-md px-4 py-4 flex items-center gap-3">
        <button onClick={onBack} className="flex items-center justify-center size-11 rounded-full bg-white dark:bg-white/10 shadow-sm border border-black/[0.03]">
          <span className="material-symbols-outlined text-[#8b7361]">arrow_back_ios_new</span>
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold text-[#8b7361] uppercase tracking-wider truncate">{product.category || '未分類'}</p>
          <h1 className="text-xl font-black text-[#1c140d] dark:text-white truncate">{product.name}</h1>
        </div>
        <button className="flex items-center justify-center size-11 rounded-full bg-white dark:bg-white/10 shadow-sm border border-black/[0.03]">
          <span className="material-symbols-outlined text-[#8b7361]">share</span>
        </button>
      </header>

      <main className="px-4 space-y-8">
        {/* Product Image */}
        <div className="w-full aspect-square bg-[#f8f5f0] dark:bg-black/20 rounded-[40px] overflow-hidden">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#8b7361]/30">
              <span className="material-symbols-outlined text-[80px]">image</span>
            </div>
          )}
        </div>

        {/* Price Display */}
        <div className="bg-white dark:bg-card-dark rounded-3xl p-6 shadow-sm border border-black/[0.03]">
          <div className="flex items-end gap-3 mb-2">
            <span className="text-4xl font-black text-primary">${product.price.toLocaleString()}</span>
            {product.original_price && product.original_price > product.price && (
              <span className="text-xl text-gray-400 line-through">${product.original_price.toLocaleString()}</span>
            )}
          </div>
          {product.is_new_low && (
            <div className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-500/20 text-green-600 rounded-full text-sm font-bold">
              <span className="material-symbols-outlined text-lg">trending_down</span>
              歷史新低價！
            </div>
          )}
        </div>

        {/* Price Trend Chart */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black text-[#1c140d] dark:text-white">價格趨勢</h2>
            <div className="flex gap-1 bg-[#f8f5f0] dark:bg-white/5 p-1 rounded-xl">
              {(['1M', '3M', '6M'] as Timeframe[]).map(tf => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${timeframe === tf
                    ? 'bg-white dark:bg-white/10 shadow-sm text-primary'
                    : 'text-[#8b7361]'
                    }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>
          <div className="bg-white dark:bg-card-dark rounded-3xl p-6 shadow-sm border border-black/[0.03]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f18c27" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#f18c27" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#8b7361', fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#8b7361', fontSize: 11 }} width={50} />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8e0d6" />
                  <Tooltip
                    formatter={(value: number) => [`$${value.toLocaleString()}`, '價格']}
                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  />
                  <Area type="monotone" dataKey="price" stroke="#f18c27" strokeWidth={3} fill="url(#colorPrice)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-[#8b7361]">
                <span className="text-sm">尚無價格歷史資料</span>
              </div>
            )}
          </div>
        </section>

        {/* Store Comparison */}
        <section>
          <h2 className="text-xl font-black text-[#1c140d] dark:text-white mb-4">平台比價</h2>
          <div className="bg-white dark:bg-card-dark rounded-3xl overflow-hidden shadow-sm border border-black/[0.03] divide-y divide-black/5 dark:divide-white/5">
            {storePrices.map((item, idx) => (
              <div key={item.store} className="flex items-center justify-between p-5">
                <div className="flex items-center gap-3">
                  <div className={`size-10 rounded-full flex items-center justify-center ${idx === 0 ? 'bg-green-100 text-green-600' : 'bg-[#f8f5f0] text-[#8b7361]'}`}>
                    <span className="material-symbols-outlined text-xl">store</span>
                  </div>
                  <span className="font-bold text-[#1c140d] dark:text-white">{item.store}</span>
                  {idx === 0 && <span className="px-2 py-0.5 bg-green-100 text-green-600 text-[10px] font-black rounded-full">最低價</span>}
                </div>
                <span className={`font-black text-lg ${idx === 0 ? 'text-green-600' : 'text-[#1c140d] dark:text-white'}`}>
                  ${item.price.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Notify Toggle */}
        <div className="bg-white dark:bg-card-dark rounded-3xl p-5 shadow-sm border border-black/[0.03] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-2xl">notifications_active</span>
            </div>
            <div>
              <p className="font-black text-[#1c140d] dark:text-white">降價即時通知</p>
              <p className="text-sm text-[#8b7361]">當價格下跌時我們會通知您</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={notifyEnabled}
              onChange={(e) => setNotifyEnabled(e.target.checked)}
            />
            <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary shadow-inner"></div>
          </label>
        </div>
      </main>

      {/* Bottom Action Buttons */}
      <div className="fixed bottom-0 left-0 right-0 z-40 max-w-[480px] mx-auto bg-white dark:bg-[#1a140e]/95 backdrop-blur-xl border-t border-black/[0.05] dark:border-white/5 p-5">
        <div className="flex gap-3">
          <button
            onClick={handleMarkAchieved}
            disabled={actionLoading}
            className="flex-1 h-14 rounded-2xl bg-primary text-white font-black flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:bg-[#e67e16] active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {actionLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                標記為已達成
              </>
            )}
          </button>
          <button
            onClick={onSharedList}
            className="h-14 px-6 rounded-2xl bg-[#f8f5f0] dark:bg-white/10 text-[#8b7361] font-black flex items-center justify-center gap-2 hover:bg-[#f0ebe4] active:scale-[0.98] transition-all"
          >
            <span className="material-symbols-outlined">group_add</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ItemDetailView;
