
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../src/contexts/AuthContext';
import { sharedItemsApi, SharedItem, Vote } from '../src/lib/api/shared-items';
import { chatApi, ChatMessage } from '../src/lib/api/chat';
import { RealtimeChannel } from '@supabase/supabase-js';

interface Props {
  itemId?: string;
  onBack: () => void;
}

const VotingDetailView: React.FC<Props> = ({ itemId, onBack }) => {
  const { user, profile } = useAuth();
  const [item, setItem] = useState<SharedItem | null>(null);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [userVote, setUserVote] = useState<boolean | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [voteLoading, setVoteLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const chatChannelRef = useRef<RealtimeChannel | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 載入項目資料
  useEffect(() => {
    const fetchData = async () => {
      if (!itemId || !user) return;

      setLoading(true);
      try {
        const itemData = await sharedItemsApi.getSharedItem(itemId);
        setItem(itemData);
        setVotes(itemData.votes || []);

        // 檢查用戶投票狀態
        const vote = await sharedItemsApi.getUserVote(itemId, user.id);
        if (vote) {
          setUserVote(vote.is_approve);
        }

        // 載入聊天訊息
        const messagesData = await chatApi.getMessages(itemId);
        setMessages(messagesData);
      } catch (error) {
        console.error('載入失敗:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [itemId, user]);

  // 訂閱即時訊息
  useEffect(() => {
    if (!itemId) return;

    chatChannelRef.current = chatApi.subscribeToMessages(itemId, (newMessage) => {
      setMessages(prev => [...prev, newMessage]);
    });

    return () => {
      if (chatChannelRef.current) {
        chatApi.unsubscribe(chatChannelRef.current);
      }
    };
  }, [itemId]);

  // 自動捲動到最新訊息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleVote = async (isApprove: boolean) => {
    if (!itemId || !user || voteLoading) return;

    setVoteLoading(true);
    try {
      await sharedItemsApi.vote(itemId, user.id, isApprove);
      setUserVote(isApprove);

      // 重新載入項目資料
      const itemData = await sharedItemsApi.getSharedItem(itemId);
      setItem(itemData);
      setVotes(itemData.votes || []);
    } catch (error) {
      console.error('投票失敗:', error);
      alert('投票失敗，請稍後再試');
    } finally {
      setVoteLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemId || !user || !newMessage.trim() || sendingMessage) return;

    setSendingMessage(true);
    try {
      await chatApi.sendMessage(itemId, user.id, newMessage.trim());
      setNewMessage('');
    } catch (error) {
      console.error('發送失敗:', error);
      alert('發送訊息失敗');
    } finally {
      setSendingMessage(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fdfbf7] dark:bg-background-dark">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fdfbf7] dark:bg-background-dark">
        <span className="material-symbols-outlined text-6xl text-[#8b7361]/50 mb-4">search_off</span>
        <p className="text-[#8b7361] font-bold mb-4">找不到此項目</p>
        <button onClick={onBack} className="text-primary font-bold">返回</button>
      </div>
    );
  }

  const approveCount = votes.filter(v => v.is_approve).length;
  const rejectCount = votes.filter(v => !v.is_approve).length;
  const totalVotes = approveCount + rejectCount;
  const approvePercentage = totalVotes > 0 ? (approveCount / (item.total_members || 1)) * 100 : 0;

  return (
    <div className="min-h-screen bg-[#fdfbf7] dark:bg-background-dark pb-32">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#fdfbf7]/90 dark:bg-background-dark/90 backdrop-blur-md px-4 py-4">
        <button onClick={onBack} className="flex items-center gap-1 text-primary font-bold">
          <span className="material-symbols-outlined text-xl">arrow_back_ios</span>
          <span>返回</span>
        </button>
        <h1 className="text-2xl font-black mt-2 text-[#1c140d] dark:text-white">投票詳情</h1>
      </header>

      <main className="px-4 space-y-6">
        {/* Item Card */}
        <div className="bg-white dark:bg-card-dark rounded-3xl p-5 shadow-sm border border-black/[0.03] flex gap-4">
          <div className="w-24 h-24 rounded-2xl bg-[#f8f5f0] dark:bg-black/20 overflow-hidden flex-shrink-0">
            {item.image_url ? (
              <img src={item.image_url} className="w-full h-full object-cover" alt={item.name} />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#8b7361]/30">
                <span className="material-symbols-outlined text-4xl">image</span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-black text-xl text-[#1c140d] dark:text-white mb-1 truncate">{item.name}</h2>
            <p className="text-2xl font-black text-primary">${item.price.toLocaleString()}</p>
            {item.proposer && (
              <div className="flex items-center gap-2 mt-2 text-[#8b7361] text-sm">
                <span className="material-symbols-outlined text-base">person</span>
                <span>由 {item.proposer.display_name} 提案</span>
              </div>
            )}
          </div>
        </div>

        {/* Voting Progress */}
        <div className="bg-white dark:bg-card-dark rounded-3xl p-6 shadow-sm border border-black/[0.03]">
          <h3 className="font-black text-lg text-[#1c140d] dark:text-white mb-4">投票進度</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="font-bold text-green-600">同意 {approveCount}</span>
              <span className="font-bold text-red-500">反對 {rejectCount}</span>
            </div>
            <div className="h-3 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden flex">
              <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${approvePercentage}%` }}></div>
            </div>
            <p className="text-center text-sm text-[#8b7361]">
              {totalVotes} / {item.total_members || 0} 人已投票
            </p>
          </div>

          {/* Vote Buttons */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => handleVote(true)}
              disabled={voteLoading}
              className={`flex-1 h-14 rounded-2xl font-black flex items-center justify-center gap-2 transition-all ${userVote === true
                  ? 'bg-green-500 text-white shadow-lg'
                  : 'bg-green-100 dark:bg-green-500/20 text-green-600 hover:bg-green-200'
                } disabled:opacity-50`}
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: userVote === true ? "'FILL' 1" : undefined }}>thumb_up</span>
              同意
            </button>
            <button
              onClick={() => handleVote(false)}
              disabled={voteLoading}
              className={`flex-1 h-14 rounded-2xl font-black flex items-center justify-center gap-2 transition-all ${userVote === false
                  ? 'bg-red-500 text-white shadow-lg'
                  : 'bg-red-100 dark:bg-red-500/20 text-red-500 hover:bg-red-200'
                } disabled:opacity-50`}
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: userVote === false ? "'FILL' 1" : undefined }}>thumb_down</span>
              反對
            </button>
          </div>
        </div>

        {/* Chat Section */}
        <div className="bg-white dark:bg-card-dark rounded-3xl shadow-sm border border-black/[0.03] overflow-hidden">
          <div className="p-4 border-b border-black/5 dark:border-white/5">
            <h3 className="font-black text-lg text-[#1c140d] dark:text-white">討論區</h3>
          </div>

          {/* Messages */}
          <div className="h-64 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-[#8b7361] text-sm">
                還沒有討論訊息，說點什麼吧！
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.user_id === user?.id ? 'flex-row-reverse' : ''}`}
                >
                  <div className="size-8 rounded-full bg-primary/10 flex-shrink-0 overflow-hidden">
                    {msg.user?.avatar_url ? (
                      <img src={msg.user.avatar_url} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-primary text-xs font-bold">
                        {msg.user?.display_name?.charAt(0) || '?'}
                      </div>
                    )}
                  </div>
                  <div className={`max-w-[70%] ${msg.user_id === user?.id ? 'text-right' : ''}`}>
                    <p className="text-[10px] text-[#8b7361] mb-1">{msg.user?.display_name || '用戶'}</p>
                    <div className={`px-4 py-2 rounded-2xl ${msg.user_id === user?.id
                        ? 'bg-primary text-white rounded-br-md'
                        : 'bg-[#f8f5f0] dark:bg-white/5 text-[#1c140d] dark:text-white rounded-bl-md'
                      }`}>
                      <p className="text-sm">{msg.content}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-black/5 dark:border-white/5 flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="輸入訊息..."
              className="flex-1 h-12 px-4 rounded-full bg-[#f8f5f0] dark:bg-white/5 border-none outline-none focus:ring-2 focus:ring-primary/20"
              disabled={sendingMessage}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sendingMessage}
              className="size-12 rounded-full bg-primary text-white flex items-center justify-center disabled:opacity-50"
            >
              <span className="material-symbols-outlined">send</span>
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default VotingDetailView;
