
import React, { useState, useRef } from 'react';
import { useAuth } from '../src/contexts/AuthContext';
import { groupsApi } from '../src/lib/api/groups';

interface Props {
  onBack: () => void;
  onComplete: () => void;
  isEdit?: boolean;
  groupId?: string;
}

const CreateGroupView: React.FC<Props> = ({ onBack, onComplete, isEdit = false, groupId }) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [groupName, setGroupName] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [inviteCode, setInviteCode] = useState('');
  const [votingThreshold, setVotingThreshold] = useState<'half' | 'two-thirds' | 'unanimous'>('half');
  const [allowMemberAdd, setAllowMemberAdd] = useState(true);
  const [notifyProgress, setNotifyProgress] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 處理頭像選擇
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAvatar(url);
      setAvatarFile(file);
    }
  };

  const nextStep = () => setStep(prev => Math.min(prev + 1, 4));
  const prevStep = () => {
    if (step === 1) onBack();
    else setStep(prev => prev - 1);
  };

  const handleComplete = async () => {
    if (!user) {
      setError('請先登入');
      return;
    }

    if (!groupName.trim()) {
      setError('請輸入群組名稱');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      let avatarUrl: string | undefined;

      // 建立群組
      const group = await groupsApi.createGroup(user.id, {
        name: groupName.trim(),
        avatarUrl,
        votingThreshold,
        allowMemberAdd,
        notifyProgress,
      });

      // 上傳頭像（如果有）
      if (avatarFile) {
        avatarUrl = await groupsApi.uploadGroupAvatar(group.id, avatarFile);
        await groupsApi.updateGroup(group.id, { avatarUrl });
      }

      setInviteCode(group.invite_code);
      nextStep(); // 進入完成步驟
    } catch (err) {
      setError((err as Error).message || '建立群組失敗');
    } finally {
      setLoading(false);
    }
  };

  const copyInviteLink = () => {
    const link = groupsApi.getInviteLink(inviteCode);
    navigator.clipboard.writeText(link);
    alert('已複製邀請連結！');
  };

  return (
    <div className="min-h-screen bg-[#fdfbf7] dark:bg-background-dark">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#fdfbf7]/90 dark:bg-background-dark/90 backdrop-blur-md px-4 py-4">
        <button onClick={prevStep} className="flex items-center gap-1 text-primary font-bold">
          <span className="material-symbols-outlined text-xl">arrow_back_ios</span>
          <span>{step === 1 ? '取消' : '上一步'}</span>
        </button>
        <h1 className="text-2xl font-black mt-2 text-[#1c140d] dark:text-white">
          {isEdit ? '編輯群組' : '建立群組'}
        </h1>
      </header>

      {/* Progress Bar */}
      {step < 4 && (
        <div className="px-4 py-2">
          <div className="flex gap-2">
            {[1, 2, 3].map(s => (
              <div
                key={s}
                className={`flex-1 h-1.5 rounded-full transition-all ${s <= step ? 'bg-primary' : 'bg-gray-200 dark:bg-white/10'}`}
              />
            ))}
          </div>
          <p className="text-center text-sm text-[#8b7361] mt-2 font-bold">
            步驟 {step}/3
          </p>
        </div>
      )}

      <main className="px-4 py-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl text-red-600 text-sm font-medium">
            {error}
          </div>
        )}

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-black text-[#1c140d] dark:text-white mb-2">群組資訊</h2>
              <p className="text-[#8b7361]">為你的群組取一個名字吧</p>
            </div>

            {/* Avatar Upload */}
            <div className="flex justify-center">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="size-32 rounded-full bg-[#f8f5f0] dark:bg-white/5 border-4 border-dashed border-[#e8e0d6] dark:border-zinc-700 flex items-center justify-center cursor-pointer hover:border-primary transition-colors overflow-hidden group"
              >
                {avatar ? (
                  <img src={avatar} alt="Group Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center text-[#8b7361]">
                    <span className="material-symbols-outlined text-4xl">add_a_photo</span>
                    <p className="text-xs mt-1">上傳頭像</p>
                  </div>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarChange}
                  className="hidden"
                  accept="image/*"
                />
              </div>
            </div>

            {/* Group Name */}
            <div className="space-y-2">
              <label className="block text-sm font-bold px-1 text-[#1c140d] dark:text-white">群組名稱</label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="例如：家人願望清單"
                className="w-full h-14 px-6 rounded-2xl bg-white dark:bg-white/5 border-2 border-[#f0ece6] dark:border-zinc-800 outline-none focus:border-primary transition-colors font-bold"
              />
            </div>

            <button
              onClick={nextStep}
              disabled={!groupName.trim()}
              className="w-full h-14 rounded-2xl bg-primary text-white font-black shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              下一步
            </button>
          </div>
        )}

        {/* Step 2: Members */}
        {step === 2 && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-black text-[#1c140d] dark:text-white mb-2">成員設定</h2>
              <p className="text-[#8b7361]">設定成員權限</p>
            </div>

            <div className="bg-white dark:bg-card-dark rounded-3xl p-6 shadow-sm border border-black/[0.03]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-black text-[#1c140d] dark:text-white">允許成員邀請他人</p>
                  <p className="text-sm text-[#8b7361]">成員可以透過邀請連結加入新成員</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={allowMemberAdd}
                    onChange={(e) => setAllowMemberAdd(e.target.checked)}
                  />
                  <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={prevStep}
                className="flex-1 h-14 rounded-2xl bg-[#f8f5f0] dark:bg-white/10 text-[#8b7361] font-black"
              >
                上一步
              </button>
              <button
                onClick={nextStep}
                className="flex-1 h-14 rounded-2xl bg-primary text-white font-black shadow-lg shadow-primary/20"
              >
                下一步
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Rules */}
        {step === 3 && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-black text-[#1c140d] dark:text-white mb-2">投票規則</h2>
              <p className="text-[#8b7361]">設定共同願望的投票門檻</p>
            </div>

            {/* Voting Threshold */}
            <div className="space-y-3">
              <label className="block text-sm font-bold px-1 text-[#1c140d] dark:text-white">投票通過門檻</label>
              <div className="space-y-2">
                {[
                  { value: 'half' as const, label: '過半數同意', desc: '超過 50% 成員同意即通過' },
                  { value: 'two-thirds' as const, label: '三分之二同意', desc: '超過 66% 成員同意即通過' },
                  { value: 'unanimous' as const, label: '全體同意', desc: '所有成員同意才通過' },
                ].map(option => (
                  <button
                    key={option.value}
                    onClick={() => setVotingThreshold(option.value)}
                    className={`w-full p-5 rounded-2xl text-left transition-all ${votingThreshold === option.value
                        ? 'bg-primary text-white shadow-lg'
                        : 'bg-white dark:bg-white/5 border border-[#f0ece6] dark:border-zinc-800 hover:border-primary'
                      }`}
                  >
                    <p className="font-black">{option.label}</p>
                    <p className={`text-sm ${votingThreshold === option.value ? 'text-white/70' : 'text-[#8b7361]'}`}>
                      {option.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Notify Progress */}
            <div className="bg-white dark:bg-card-dark rounded-3xl p-6 shadow-sm border border-black/[0.03]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-black text-[#1c140d] dark:text-white">投票進度通知</p>
                  <p className="text-sm text-[#8b7361]">當有新投票或進度更新時通知成員</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={notifyProgress}
                    onChange={(e) => setNotifyProgress(e.target.checked)}
                  />
                  <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={prevStep}
                className="flex-1 h-14 rounded-2xl bg-[#f8f5f0] dark:bg-white/10 text-[#8b7361] font-black"
              >
                上一步
              </button>
              <button
                onClick={handleComplete}
                disabled={loading}
                className="flex-1 h-14 rounded-2xl bg-primary text-white font-black shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    建立中...
                  </>
                ) : (
                  '建立群組'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Complete */}
        {step === 4 && (
          <div className="space-y-8 text-center py-8">
            <div className="size-24 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-5xl text-green-500" style={{ fontVariationSettings: "'FILL' 1" }}>
                check_circle
              </span>
            </div>

            <div>
              <h2 className="text-2xl font-black text-[#1c140d] dark:text-white mb-2">群組建立成功！</h2>
              <p className="text-[#8b7361]">分享邀請連結給朋友加入吧</p>
            </div>

            {/* Invite Link */}
            <div className="bg-white dark:bg-card-dark rounded-3xl p-6 shadow-sm border border-black/[0.03]">
              <p className="text-sm text-[#8b7361] mb-2">邀請碼</p>
              <p className="text-2xl font-black text-primary tracking-widest mb-4">{inviteCode}</p>
              <button
                onClick={copyInviteLink}
                className="w-full h-12 rounded-xl bg-[#f8f5f0] dark:bg-white/10 text-[#8b7361] font-bold flex items-center justify-center gap-2 hover:bg-[#f0ebe4] transition-colors"
              >
                <span className="material-symbols-outlined">content_copy</span>
                複製邀請連結
              </button>
            </div>

            <button
              onClick={onComplete}
              className="w-full h-14 rounded-2xl bg-primary text-white font-black shadow-lg shadow-primary/20"
            >
              完成
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default CreateGroupView;
