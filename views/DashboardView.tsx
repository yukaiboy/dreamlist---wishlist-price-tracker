
import React, { useState, useMemo } from 'react';
import { AppView } from '../types';
import { useAuth } from '../src/contexts/AuthContext';
import { useProducts } from '../src/lib/hooks/useProducts';
import { useGroups } from '../src/lib/hooks/useGroups';

interface Props {
  onSelectProduct: (id: string) => void;
  onNavigate: (view: AppView) => void;
  initialTab?: 'personal' | 'shared';
}

const CATEGORIES = [
  { key: null, label: '全部' },
  { key: '服飾配件', label: '服飾配件' },
  { key: '電子產品', label: '電子產品' },
  { key: '居家生活', label: '居家生活' },
  { key: '美妝保養', label: '美妝保養' }
];

const DashboardView: React.FC<Props> = ({ onSelectProduct, onNavigate, initialTab = 'personal' }) => {
  const { profile } = useAuth();
  const { products, loading: productsLoading, stats, deleteProduct } = useProducts();
  const { groups, loading: groupsLoading } = useGroups();

  const [listType, setListType] = useState<'personal' | 'shared'>(initialTab);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedGroupIndex, setSelectedGroupIndex] = useState(0);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  // 過濾商品
  const filteredProducts = useMemo(() => {
    if (listType === 'shared') return [];

    return activeCategory
      ? products.filter(p => p.category === activeCategory)
      : products;
  }, [products, activeCategory, listType]);

  // 選擇的群組
  const selectedGroup = groups[selectedGroupIndex];

  const loading = productsLoading || groupsLoading;

  // 計算預算進度（示範用，可自訂預算）
  const budgetLimit = 10000;
  const budgetProgress = Math.min((stats.total / budgetLimit) * 100, 100);

  return (
    <div className="relative flex flex-col min-h-screen overflow-x-hidden bg-[#fdfbf7] dark:bg-background-dark pb-32">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#fdfbf7]/80 dark:bg-background-dark/80 backdrop-blur-xl px-5 pt-4 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md" alt="Avatar" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">person</span>
            </div>
          )}
          <div className="text-left">
            <p className="text-[13px] text-[#8b7361] dark:text-[#a68d7a] font-semibold">
              {new Date().toLocaleDateString('zh-TW', { month: 'long', day: 'numeric' })} · {new Date().toLocaleDateString('zh-TW', { weekday: 'short' })}
            </p>
            <h2 className="text-[22px] font-black text-[#1c140d] dark:text-white leading-tight tracking-tight">嗨 {profile?.display_name || '用戶'}！</h2>
          </div>
        </div>
        <button
          onClick={() => onNavigate(AppView.SETTINGS)}
          className="flex items-center justify-center size-11 rounded-full bg-white dark:bg-white/10 shadow-sm border border-black/[0.03] text-[#8b7361] hover:bg-gray-50 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined">settings</span>
        </button>
      </header>

      {/* Tab Switcher */}
      <div className="px-5 pt-2 pb-4">
        <div className="flex bg-white dark:bg-white/5 p-1.5 rounded-2xl gap-1 shadow-inner border border-black/[0.02]">
          <button
            onClick={() => setListType('personal')}
            className={`flex-1 py-3 rounded-xl text-sm font-black transition-all duration-300 ${listType === 'personal' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-[#8b7361] hover:bg-[#f8f5f0]'}`}
          >
            個人清單
          </button>
          <button
            onClick={() => setListType('shared')}
            className={`flex-1 py-3 rounded-xl text-sm font-black transition-all duration-300 ${listType === 'shared' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-[#8b7361] hover:bg-[#f8f5f0]'}`}
          >
            共同清單
          </button>
        </div>
      </div>

      {listType === 'personal' ? (
        <>
          {/* Budget Progress Card */}
          <div className="px-5">
            <div className="bg-gradient-to-br from-primary to-[#d97b15] rounded-3xl p-6 text-white shadow-xl shadow-primary/15">
              <div className="flex justify-between items-start mb-5">
                <div>
                  <p className="text-white/70 text-[13px] font-semibold tracking-wide mb-1">清單總額</p>
                  <p className="text-[34px] font-black tracking-tight">${stats.total.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>savings</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[13px]">
                  <span className="font-bold text-white/80">預算使用</span>
                  <span className="font-black">{budgetProgress.toFixed(0)}%</span>
                </div>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${budgetProgress}%` }}></div>
                </div>
              </div>
              <div className="flex justify-between mt-4 pt-4 border-t border-white/15 text-[13px]">
                <span className="text-white/70 font-semibold">願望數量</span>
                <span className="font-black">{stats.count}</span>
              </div>
            </div>
          </div>

          {/* Category Filter */}
          <div className="mt-8 px-5">
            <h2 className="text-[22px] font-black text-[#1c140d] dark:text-white mb-4">我的願望</h2>
            <div className="flex gap-2 flex-wrap mb-5">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.key || 'all'}
                  onClick={() => setActiveCategory(cat.key)}
                  className={`px-4 py-2 rounded-full text-[13px] font-bold transition-all ${activeCategory === cat.key
                    ? 'bg-[#1c140d] dark:bg-white text-white dark:text-black shadow-md'
                    : 'bg-white dark:bg-white/5 text-[#8b7361] border border-[#e8e0d6]'
                    }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Products List */}
            <div className="space-y-4">
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-12 text-[#8b7361]">
                  <span className="material-symbols-outlined text-5xl mb-3 opacity-50">inventory_2</span>
                  <p className="font-bold">還沒有願望項目</p>
                  <p className="text-sm mt-1 opacity-70">點擊下方按鈕新增第一個願望吧！</p>
                </div>
              ) : (
                filteredProducts.map(product => (
                  <div
                    key={product.id}
                    onClick={() => onSelectProduct(product.id)}
                    className="bg-white dark:bg-card-dark rounded-3xl p-4 flex gap-4 shadow-sm border border-black/[0.03] cursor-pointer hover:shadow-md transition-all active:scale-[0.99]"
                  >
                    <div className="w-24 h-24 rounded-2xl bg-[#f8f5f0] dark:bg-black/20 overflow-hidden flex-shrink-0">
                      {product.image_url ? (
                        <img src={product.image_url} className="w-full h-full object-cover" alt={product.name} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#8b7361]/30">
                          <span className="material-symbols-outlined text-4xl">image</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 flex flex-col justify-center min-w-0">
                      <p className="text-[11px] font-bold text-[#8b7361] dark:text-[#a68d7a] mb-1 uppercase tracking-wider">{product.category || '未分類'}</p>
                      <h3 className="font-black text-[17px] text-[#1c140d] dark:text-white truncate mb-1">{product.name}</h3>
                      <div className="flex items-center gap-2 mt-auto">
                        <span className="font-black text-primary text-lg">${product.price.toLocaleString()}</span>
                        {product.is_new_low && (
                          <span className="px-2 py-0.5 bg-green-100 dark:bg-green-500/20 text-green-600 text-[10px] font-black rounded-full">新低價</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setProductToDelete(product.id);
                        }}
                        className="size-10 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[22px]">delete</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      ) : (
        /* Shared List View */
        <div className="px-5">
          {/* Group Selector */}
          {groups.length > 0 && (
            <div className="flex gap-3 overflow-x-auto pb-4 -mx-5 px-5 scrollbar-hide">
              {groups.map((group, idx) => (
                <button
                  key={group.id}
                  onClick={() => setSelectedGroupIndex(idx)}
                  className={`flex items-center gap-3 px-5 py-4 rounded-2xl shrink-0 transition-all ${selectedGroupIndex === idx
                    ? 'bg-primary text-white shadow-lg'
                    : 'bg-white dark:bg-white/5 border border-black/[0.03]'
                    }`}
                >
                  <div className={`size-10 rounded-full flex items-center justify-center ${selectedGroupIndex === idx ? 'bg-white/20' : 'bg-primary/10 text-primary'}`}>
                    <span className="material-symbols-outlined text-xl">groups</span>
                  </div>
                  <span className="font-black text-[15px]">{group.name}</span>
                </button>
              ))}
              <button
                onClick={() => onNavigate(AppView.CREATE_GROUP)}
                className="flex items-center gap-2 px-5 py-4 rounded-2xl shrink-0 bg-white dark:bg-white/5 border-2 border-dashed border-[#e8e0d6] dark:border-zinc-700 text-[#8b7361] hover:border-primary hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined">add</span>
                <span className="font-bold text-sm">新增群組</span>
              </button>
            </div>
          )}

          {groups.length === 0 ? (
            <div className="text-center py-16 text-[#8b7361]">
              <span className="material-symbols-outlined text-6xl mb-4 opacity-50">group_add</span>
              <p className="font-bold text-lg mb-2">還沒有共同清單</p>
              <p className="text-sm opacity-70 mb-6">建立一個群組，和朋友或家人一起規劃願望吧！</p>
              <button
                onClick={() => onNavigate(AppView.CREATE_GROUP)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-full font-bold shadow-lg shadow-primary/20"
              >
                <span className="material-symbols-outlined">add</span>
                建立群組
              </button>
            </div>
          ) : selectedGroup && (
            <div className="mt-4">
              {/* Group Budget Card */}
              <div className="bg-gradient-to-br from-[#5b4639] to-[#3d2e24] rounded-3xl p-6 text-white shadow-xl mb-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <p className="text-white/60 text-[13px] font-semibold mb-1">共同預算</p>
                    <p className="text-[28px] font-black">$0</p>
                  </div>
                  <button
                    onClick={() => onNavigate(AppView.EDIT_GROUP)}
                    className="size-10 rounded-xl bg-white/10 flex items-center justify-center"
                  >
                    <span className="material-symbols-outlined text-xl">edit</span>
                  </button>
                </div>
                <div className="text-[13px] text-white/70">目前尚無共同項目</div>
              </div>

              {/* Shared Items Placeholder */}
              <h3 className="text-lg font-black text-[#1c140d] dark:text-white mb-4">共同項目</h3>
              <div className="text-center py-8 text-[#8b7361]">
                <span className="material-symbols-outlined text-4xl mb-2 opacity-50">how_to_vote</span>
                <p className="font-bold">尚無共同項目</p>
                <p className="text-sm mt-1 opacity-70">提案一個新項目開始投票吧！</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 max-w-[480px] mx-auto bg-white dark:bg-[#1a140e]/95 backdrop-blur-xl border-t border-black/[0.05] dark:border-white/5 px-6">
        <div className="flex items-center justify-around h-20">
          <button
            onClick={() => setListType('personal')}
            className={`flex flex-col items-center gap-1 pt-2 ${listType === 'personal' ? 'text-primary' : 'text-[#8b7361]'}`}
          >
            <span className="material-symbols-outlined text-[26px]" style={{ fontVariationSettings: listType === 'personal' ? "'FILL' 1" : undefined }}>person</span>
            <span className="text-[11px] font-bold">個人</span>
          </button>
          <button
            onClick={() => setListType('shared')}
            className={`flex flex-col items-center gap-1 pt-2 ${listType === 'shared' ? 'text-primary' : 'text-[#8b7361]'}`}
          >
            <span className="material-symbols-outlined text-[26px]" style={{ fontVariationSettings: listType === 'shared' ? "'FILL' 1" : undefined }}>groups</span>
            <span className="text-[11px] font-bold">共同</span>
          </button>
          <div className="relative -mt-10">
            <button
              onClick={() => onNavigate(AppView.ADD_ITEM)}
              className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-3xl">add</span>
            </button>
          </div>
          <button
            onClick={() => onNavigate(AppView.HISTORY)}
            className="flex flex-col items-center gap-1 pt-2 text-[#8b7361]"
          >
            <span className="material-symbols-outlined text-[26px]">history</span>
            <span className="text-[11px] font-bold">歷史</span>
          </button>
          <button
            onClick={() => onNavigate(AppView.SETTINGS)}
            className="flex flex-col items-center gap-1 pt-2 text-[#8b7361]"
          >
            <span className="material-symbols-outlined text-[26px]">settings</span>
            <span className="text-[11px] font-bold">設定</span>
          </button>
        </div>
      </nav>
      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setProductToDelete(null)}
          ></div>
          <div className="relative w-full max-w-sm bg-white dark:bg-[#1c1c1e] rounded-[32px] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="size-16 rounded-3xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-red-500 mb-6">
                <span className="material-symbols-outlined text-3xl">delete_forever</span>
              </div>
              <h3 className="text-xl font-black text-[#1c140d] dark:text-white mb-2">確認刪除願望？</h3>
              <p className="text-[#8b7361] dark:text-[#a68d7a] text-sm leading-relaxed mb-8">
                刪除後將無法復原此項目的所有追蹤資料。
              </p>
              <div className="flex w-full gap-3">
                <button
                  onClick={() => setProductToDelete(null)}
                  className="flex-1 py-4 rounded-2xl text-sm font-black text-[#8b7361] dark:text-[#a68d7a] bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={async () => {
                    if (productToDelete) {
                      await deleteProduct(productToDelete);
                      setProductToDelete(null);
                    }
                  }}
                  className="flex-1 py-4 rounded-2xl text-sm font-black bg-red-500 text-white shadow-lg shadow-red-500/20 hover:bg-red-600 transition-colors"
                >
                  確認刪除
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardView;
