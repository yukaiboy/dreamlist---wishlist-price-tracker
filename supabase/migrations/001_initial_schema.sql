-- ============================================================================
-- DreamList - Supabase 資料庫架構
-- 版本: 1.0.0
-- 描述: 願望清單與價格追蹤應用的完整資料庫架構
-- ============================================================================

-- 啟用 UUID 擴展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. 用戶資料表 (profiles)
-- 用於存儲用戶的額外資料，與 auth.users 關聯
-- ============================================================================
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    display_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 當新用戶註冊時自動建立 profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, display_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 2. 商品/願望清單資料表 (products)
-- ============================================================================
CREATE TABLE public.products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    original_price NUMERIC(10, 2),
    image_url TEXT,
    store TEXT,
    category TEXT CHECK (category IN ('服飾配件', '電子產品', '居家生活', '美妝保養')),
    notes TEXT,
    price_tracking_enabled BOOLEAN DEFAULT TRUE,
    is_new_low BOOLEAN DEFAULT FALSE,
    discount TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'achieved', 'abandoned')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 商品索引
CREATE INDEX idx_products_user_id ON public.products(user_id);
CREATE INDEX idx_products_category ON public.products(category);
CREATE INDEX idx_products_status ON public.products(status);

-- ============================================================================
-- 3. 價格歷史資料表 (price_history)
-- ============================================================================
CREATE TABLE public.price_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    store TEXT,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_price_history_product_id ON public.price_history(product_id);
CREATE INDEX idx_price_history_recorded_at ON public.price_history(recorded_at);

-- ============================================================================
-- 4. 群組資料表 (groups)
-- ============================================================================
CREATE TABLE public.groups (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    avatar_url TEXT,
    invite_code TEXT UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex'),
    voting_threshold TEXT DEFAULT 'half' CHECK (voting_threshold IN ('half', 'two-thirds', 'unanimous')),
    allow_member_add BOOLEAN DEFAULT TRUE,
    notify_progress BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_groups_owner_id ON public.groups(owner_id);
CREATE INDEX idx_groups_invite_code ON public.groups(invite_code);

-- ============================================================================
-- 5. 群組成員資料表 (group_members)
-- ============================================================================
CREATE TABLE public.group_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);

CREATE INDEX idx_group_members_group_id ON public.group_members(group_id);
CREATE INDEX idx_group_members_user_id ON public.group_members(user_id);

-- ============================================================================
-- 6. 共同項目資料表 (shared_items)
-- ============================================================================
CREATE TABLE public.shared_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
    proposer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    image_url TEXT,
    discount TEXT,
    status TEXT DEFAULT 'voting' CHECK (status IN ('voting', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_shared_items_group_id ON public.shared_items(group_id);
CREATE INDEX idx_shared_items_status ON public.shared_items(status);

-- ============================================================================
-- 7. 投票資料表 (votes)
-- ============================================================================
CREATE TABLE public.votes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    item_id UUID REFERENCES public.shared_items(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    is_approve BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(item_id, user_id)
);

CREATE INDEX idx_votes_item_id ON public.votes(item_id);

-- ============================================================================
-- 8. 聊天訊息資料表 (chat_messages)
-- ============================================================================
CREATE TABLE public.chat_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    item_id UUID REFERENCES public.shared_items(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_item_id ON public.chat_messages(item_id);
CREATE INDEX idx_chat_messages_created_at ON public.chat_messages(created_at);

-- ============================================================================
-- 9. 通知設定資料表 (notification_settings)
-- ============================================================================
CREATE TABLE public.notification_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
    price_alerts BOOLEAN DEFAULT TRUE,
    price_drop_notifications BOOLEAN DEFAULT TRUE,
    voting_notifications BOOLEAN DEFAULT FALSE,
    achievement_reminders BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 10. 歷史紀錄資料表 (history)
-- ============================================================================
CREATE TABLE public.history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    image_url TEXT,
    category TEXT,
    status TEXT NOT NULL CHECK (status IN ('achieved', 'abandoned')),
    final_price NUMERIC(10, 2),
    completed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_history_user_id ON public.history(user_id);
CREATE INDEX idx_history_status ON public.history(status);

-- ============================================================================
-- 行級安全策略 (RLS)
-- ============================================================================

-- 啟用 RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.history ENABLE ROW LEVEL SECURITY;

-- Profiles 策略
CREATE POLICY "用戶可查看所有 profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "用戶只能更新自己的 profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Products 策略
CREATE POLICY "用戶可查看自己的商品" ON public.products FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "用戶可新增自己的商品" ON public.products FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "用戶可更新自己的商品" ON public.products FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "用戶可刪除自己的商品" ON public.products FOR DELETE USING (auth.uid() = user_id);

-- Price History 策略
CREATE POLICY "用戶可查看自己商品的價格歷史" ON public.price_history FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.products WHERE products.id = price_history.product_id AND products.user_id = auth.uid()));

-- Groups 策略
CREATE POLICY "群組成員可查看群組" ON public.groups FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.group_members WHERE group_members.group_id = groups.id AND group_members.user_id = auth.uid()));
CREATE POLICY "登入用戶可建立群組" ON public.groups FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "群組擁有者可更新群組" ON public.groups FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "群組擁有者可刪除群組" ON public.groups FOR DELETE USING (auth.uid() = owner_id);

-- Group Members 策略
CREATE POLICY "群組成員可查看成員列表" ON public.group_members FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = group_members.group_id AND gm.user_id = auth.uid()));
CREATE POLICY "群組擁有者可新增成員" ON public.group_members FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.groups WHERE groups.id = group_members.group_id AND groups.owner_id = auth.uid()) OR group_members.user_id = auth.uid());
CREATE POLICY "群組擁有者可移除成員" ON public.group_members FOR DELETE
    USING (EXISTS (SELECT 1 FROM public.groups WHERE groups.id = group_members.group_id AND groups.owner_id = auth.uid()) OR group_members.user_id = auth.uid());

-- Shared Items 策略
CREATE POLICY "群組成員可查看共同項目" ON public.shared_items FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.group_members WHERE group_members.group_id = shared_items.group_id AND group_members.user_id = auth.uid()));
CREATE POLICY "群組成員可新增共同項目" ON public.shared_items FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.group_members WHERE group_members.group_id = shared_items.group_id AND group_members.user_id = auth.uid()));
CREATE POLICY "群組擁有者可更新項目" ON public.shared_items FOR UPDATE
    USING (EXISTS (SELECT 1 FROM public.groups WHERE groups.id = shared_items.group_id AND groups.owner_id = auth.uid()));

-- Votes 策略
CREATE POLICY "群組成員可查看投票" ON public.votes FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.shared_items si
        JOIN public.group_members gm ON gm.group_id = si.group_id
        WHERE si.id = votes.item_id AND gm.user_id = auth.uid()
    ));
CREATE POLICY "群組成員可投票" ON public.votes FOR INSERT
    WITH CHECK (auth.uid() = user_id AND EXISTS (
        SELECT 1 FROM public.shared_items si
        JOIN public.group_members gm ON gm.group_id = si.group_id
        WHERE si.id = votes.item_id AND gm.user_id = auth.uid()
    ));
CREATE POLICY "用戶可更新自己的投票" ON public.votes FOR UPDATE USING (auth.uid() = user_id);

-- Chat Messages 策略
CREATE POLICY "群組成員可查看訊息" ON public.chat_messages FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.shared_items si
        JOIN public.group_members gm ON gm.group_id = si.group_id
        WHERE si.id = chat_messages.item_id AND gm.user_id = auth.uid()
    ));
CREATE POLICY "群組成員可發送訊息" ON public.chat_messages FOR INSERT
    WITH CHECK (auth.uid() = user_id AND EXISTS (
        SELECT 1 FROM public.shared_items si
        JOIN public.group_members gm ON gm.group_id = si.group_id
        WHERE si.id = chat_messages.item_id AND gm.user_id = auth.uid()
    ));

-- Notification Settings 策略
CREATE POLICY "用戶可查看自己的通知設定" ON public.notification_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "用戶可新增自己的通知設定" ON public.notification_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "用戶可更新自己的通知設定" ON public.notification_settings FOR UPDATE USING (auth.uid() = user_id);

-- History 策略
CREATE POLICY "用戶可查看自己的歷史" ON public.history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "用戶可新增自己的歷史" ON public.history FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 即時訂閱設置
-- ============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.votes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.shared_items;

-- ============================================================================
-- 完成
-- ============================================================================
