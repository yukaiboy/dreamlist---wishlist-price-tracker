
import React, { useState, useRef } from 'react';
import { useAuth } from '../src/contexts/AuthContext';
import { productsApi } from '../src/lib/api/products';
import { useGroups } from '../src/lib/hooks/useGroups';

interface Props {
  onBack: () => void;
  onSave: () => void;
}

const AddItemView: React.FC<Props> = ({ onBack, onSave }) => {
  const { user } = useAuth();
  const { groups } = useGroups();

  const [selectedList, setSelectedList] = useState({ id: 'personal', name: '個人清單', icon: 'person' });
  const [showListPicker, setShowListPicker] = useState(false);
  const [category, setCategory] = useState('服飾配件');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [priceTracking, setPriceTracking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 組合清單選項（個人 + 群組）
  const listOptions = [
    { id: 'personal', name: '個人清單', icon: 'person' },
    ...groups.map(g => ({ id: g.id, name: g.name, icon: 'groups' }))
  ];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewImage(url);
      setImageFile(file);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleSave = async () => {
    if (!user) {
      setError('請先登入');
      return;
    }

    if (!name.trim()) {
      setError('請輸入商品名稱');
      return;
    }

    if (!price || isNaN(parseFloat(price))) {
      setError('請輸入有效的價格');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      let imageUrl: string | undefined;

      // 1. 上傳圖片
      if (imageFile) {
        try {
          imageUrl = await productsApi.uploadProductImage(user.id, imageFile);
        } catch (uploadErr) {
          console.error('圖片上傳失敗:', uploadErr);
          throw new Error('圖片上傳失敗，請檢查 Supabase Storage 設定 (Bucket 是否改為 Public 並設定 Policy)');
        }
      }

      // 2. 建立商品
      try {
        await productsApi.createProduct(user.id, {
          name: name.trim(),
          price: parseFloat(price),
          imageUrl,
          category,
          notes: notes.trim() || undefined,
          priceTrackingEnabled: priceTracking,
        });
      } catch (createErr) {
        console.error('建立商品失敗:', createErr);
        throw new Error('儲存產品失敗: ' + (createErr as Error).message);
      }

      onSave();
    } catch (err) {
      setError((err as Error).message || '儲存失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[480px] mx-auto min-h-screen flex flex-col bg-[#fdfbf7] dark:bg-background-dark animate-in fade-in duration-300">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-5 sticky top-0 bg-[#fdfbf7]/90 dark:bg-background-dark/90 backdrop-blur-md z-[60]">
        <button onClick={onBack} disabled={loading} className="text-[#8b7361] dark:text-[#a68d7a] text-lg font-bold disabled:opacity-50">取消</button>
        <h1 className="text-xl font-black text-[#1c140d] dark:text-white">新增願望</h1>
        <button onClick={handleSave} disabled={loading} className="text-primary text-lg font-black disabled:opacity-50">
          {loading ? '儲存中...' : '儲存'}
        </button>
      </header>

      <main className="flex-1 overflow-y-auto px-6 pb-12 space-y-10">
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl text-red-600 text-sm font-medium">
            {error}
          </div>
        )}

        {/* Product Image Upload Section */}
        <div className="mt-4">
          <div
            onClick={triggerFileUpload}
            className="relative w-full aspect-square bg-[#f8f5f0] dark:bg-[#2d241c] rounded-[48px] flex flex-col items-center justify-center border-2 border-dashed border-[#e7dbd0] dark:border-[#4d3f32] overflow-hidden group cursor-pointer transition-all active:scale-[0.98]"
          >
            {previewImage ? (
              <div className="w-full h-full relative">
                <img src={previewImage} className="w-full h-full object-cover" alt="Preview" />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-[2px]">
                  <div className="bg-white/90 p-3 rounded-full text-primary shadow-lg">
                    <span className="material-symbols-outlined text-3xl">edit</span>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="size-20 bg-[#fde1cc] dark:bg-primary/20 rounded-full flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-primary text-[40px]" style={{ fontVariationSettings: "'FILL' 1" }}>photo_camera</span>
                </div>
                <p className="text-[#8b7361] font-black text-lg">上傳商品圖片</p>
              </>
            )}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleImageUpload}
            />
          </div>
        </div>

        {/* Form Content */}
        <div className="space-y-10">
          {/* Product Name */}
          <div className="space-y-3">
            <label className="block text-xl font-black px-1">商品名稱</label>
            <input
              className="w-full h-[72px] px-8 rounded-[28px] border-2 border-[#f0ece6] dark:border-zinc-800 bg-white dark:bg-zinc-900 outline-none focus:border-primary/50 transition-all font-bold placeholder:text-gray-300"
              placeholder="輸入商品名稱..."
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Estimated Price */}
          <div className="space-y-3">
            <label className="block text-xl font-black px-1">預估價格</label>
            <div className="relative">
              <span className="absolute left-8 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xl">$</span>
              <input
                className="w-full h-[72px] pl-14 pr-8 rounded-[28px] border-2 border-[#f0ece6] dark:border-zinc-800 bg-white dark:bg-zinc-900 outline-none focus:border-primary/50 font-bold placeholder:text-gray-300 text-xl"
                placeholder="0.00"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          {/* Category */}
          <div className="space-y-4">
            <label className="block text-xl font-black px-1">分類</label>
            <div className="flex flex-wrap gap-3">
              {['服飾配件', '電子產品', '居家生活', '美妝保養'].map(label => (
                <button
                  key={label}
                  onClick={() => setCategory(label)}
                  disabled={loading}
                  className={`px-6 py-3.5 rounded-full font-black text-sm border-2 transition-all ${category === label
                    ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                    : 'bg-white dark:bg-zinc-900 border-[#f0ece6] dark:border-zinc-800 text-[#8b7361]'
                    }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* List Selection */}
          <div className="space-y-4 relative">
            <label className="block text-xl font-black px-1">存入清單</label>
            <div className="relative">
              <div
                onClick={() => !loading && setShowListPicker(!showListPicker)}
                className={`bg-white dark:bg-zinc-900 rounded-[32px] border-2 border-[#f0ece6] dark:border-zinc-800 px-8 py-6 flex items-center justify-between group cursor-pointer transition-all active:scale-[0.99] z-[50] relative ${showListPicker ? 'border-primary shadow-lg' : 'shadow-sm'}`}
              >
                <div className="flex items-center gap-4">
                  <div className="size-14 rounded-full bg-[#fde1cc] dark:bg-primary/20 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {selectedList.icon}
                    </span>
                  </div>
                  <span className="text-lg font-black text-[#1c140d] dark:text-white">{selectedList.name}</span>
                </div>
                <span className={`material-symbols-outlined text-gray-300 transition-transform duration-300 text-3xl ${showListPicker ? 'rotate-180 text-primary' : ''}`}>
                  keyboard_arrow_down
                </span>
              </div>

              {/* Picker Dropdown */}
              {showListPicker && (
                <div className="absolute top-[110%] left-0 right-0 bg-white dark:bg-zinc-900 rounded-[32px] border-2 border-[#f0ece6] dark:border-zinc-800 shadow-2xl z-[70] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  {listOptions.map((list) => (
                    <button
                      key={list.id}
                      onClick={() => {
                        setSelectedList(list);
                        setShowListPicker(false);
                      }}
                      className={`w-full px-8 py-5 flex items-center gap-4 hover:bg-[#fef5ed] dark:hover:bg-primary/5 transition-colors border-b last:border-b-0 border-[#f0ece6] dark:border-zinc-800 ${selectedList.id === list.id ? 'bg-[#fef5ed]/50 dark:bg-primary/10' : ''}`}
                    >
                      <div className={`size-12 rounded-full flex items-center justify-center ${selectedList.id === list.id ? 'bg-primary text-white' : 'bg-[#f8f5f0] text-[#8b7361]'}`}>
                        <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>{list.icon}</span>
                      </div>
                      <span className={`text-base font-black ${selectedList.id === list.id ? 'text-primary' : 'text-[#1c140d] dark:text-white'}`}>
                        {list.name}
                      </span>
                      {selectedList.id === list.id && (
                        <span className="material-symbols-outlined ml-auto text-primary">check_circle</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-3">
            <label className="block text-xl font-black px-1">備註</label>
            <textarea
              className="w-full h-48 p-8 rounded-[40px] border-2 border-[#f0ece6] dark:border-zinc-800 bg-white dark:bg-zinc-900 outline-none focus:border-primary/50 transition-all font-bold placeholder:text-gray-300 resize-none leading-relaxed"
              placeholder="在此輸入更多關於這個願望的細節..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={loading}
            ></textarea>
          </div>

          {/* Price Tracking Toggle */}
          <div className="flex items-center justify-between py-6 px-1 border-t-2 border-[#f0ece6] dark:border-zinc-800 mt-6">
            <div className="flex flex-col gap-1">
              <span className="text-xl font-black text-[#1c140d] dark:text-white">開啟價格追蹤</span>
              <span className="text-[#8b7361] text-sm font-bold opacity-70 tracking-tight">當價格下跌時我們會主動通知您</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={priceTracking}
                onChange={(e) => setPriceTracking(e.target.checked)}
                disabled={loading}
              />
              <div className="w-16 h-9 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-[28px] after:w-[28px] after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>
      </main>

      {/* Backdrop for closing picker */}
      {showListPicker && (
        <div
          className="fixed inset-0 z-[40] bg-transparent"
          onClick={() => setShowListPicker(false)}
        />
      )}
    </div>
  );
};

export default AddItemView;
