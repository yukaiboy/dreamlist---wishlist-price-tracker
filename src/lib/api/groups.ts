import { supabase } from '../supabase';

export interface Group {
    id: string;
    owner_id: string;
    name: string;
    avatar_url?: string;
    invite_code: string;
    voting_threshold: 'half' | 'two-thirds' | 'unanimous';
    allow_member_add: boolean;
    notify_progress: boolean;
    created_at: string;
    updated_at: string;
}

export interface GroupMember {
    id: string;
    group_id: string;
    user_id: string;
    role: 'owner' | 'admin' | 'member';
    joined_at: string;
    profile?: {
        display_name: string;
        avatar_url: string;
        email: string;
    };
}

export interface CreateGroupData {
    name: string;
    avatarUrl?: string;
    votingThreshold?: 'half' | 'two-thirds' | 'unanimous';
    allowMemberAdd?: boolean;
    notifyProgress?: boolean;
}

export interface UpdateGroupData {
    name?: string;
    avatarUrl?: string;
    votingThreshold?: 'half' | 'two-thirds' | 'unanimous';
    allowMemberAdd?: boolean;
    notifyProgress?: boolean;
}

/**
 * 群組管理 API 服務
 */
export const groupsApi = {
    /**
     * 取得用戶的所有群組
     */
    async getGroups(userId: string) {
        const { data, error } = await supabase
            .from('group_members')
            .select(`
        group_id,
        role,
        groups (
          id,
          name,
          avatar_url,
          invite_code,
          voting_threshold,
          allow_member_add,
          notify_progress,
          owner_id,
          created_at
        )
      `)
            .eq('user_id', userId);

        if (error) throw error;
        return data?.map(item => ({
            ...item.groups,
            role: item.role,
        })) || [];
    },

    /**
     * 取得群組詳情含成員
     */
    async getGroup(groupId: string) {
        const { data: group, error: groupError } = await supabase
            .from('groups')
            .select('*')
            .eq('id', groupId)
            .single();

        if (groupError) throw groupError;

        const { data: members, error: membersError } = await supabase
            .from('group_members')
            .select(`
        id,
        user_id,
        role,
        joined_at,
        profiles (
          display_name,
          avatar_url,
          email
        )
      `)
            .eq('group_id', groupId);

        if (membersError) throw membersError;

        return {
            ...group,
            members: members?.map(m => ({
                ...m,
                profile: m.profiles,
            })) || [],
        };
    },

    /**
     * 建立新群組
     */
    async createGroup(ownerId: string, groupData: CreateGroupData) {
        // 建立群組
        const { data: group, error: groupError } = await supabase
            .from('groups')
            .insert({
                owner_id: ownerId,
                name: groupData.name,
                avatar_url: groupData.avatarUrl,
                voting_threshold: groupData.votingThreshold ?? 'half',
                allow_member_add: groupData.allowMemberAdd ?? true,
                notify_progress: groupData.notifyProgress ?? true,
            })
            .select()
            .single();

        if (groupError) throw groupError;

        // 將擁有者加入成員
        const { error: memberError } = await supabase
            .from('group_members')
            .insert({
                group_id: group.id,
                user_id: ownerId,
                role: 'owner',
            });

        if (memberError) throw memberError;

        return group as Group;
    },

    /**
     * 更新群組設定
     */
    async updateGroup(groupId: string, groupData: UpdateGroupData) {
        const updates: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
        };

        if (groupData.name !== undefined) updates.name = groupData.name;
        if (groupData.avatarUrl !== undefined) updates.avatar_url = groupData.avatarUrl;
        if (groupData.votingThreshold !== undefined) updates.voting_threshold = groupData.votingThreshold;
        if (groupData.allowMemberAdd !== undefined) updates.allow_member_add = groupData.allowMemberAdd;
        if (groupData.notifyProgress !== undefined) updates.notify_progress = groupData.notifyProgress;

        const { data, error } = await supabase
            .from('groups')
            .update(updates)
            .eq('id', groupId)
            .select()
            .single();

        if (error) throw error;
        return data as Group;
    },

    /**
     * 刪除群組
     */
    async deleteGroup(groupId: string) {
        const { error } = await supabase
            .from('groups')
            .delete()
            .eq('id', groupId);

        if (error) throw error;
    },

    /**
     * 透過邀請碼加入群組
     */
    async joinGroup(inviteCode: string, userId: string) {
        // 查找群組
        const { data: group, error: findError } = await supabase
            .from('groups')
            .select('id')
            .eq('invite_code', inviteCode)
            .single();

        if (findError) throw new Error('邀請碼無效或群組不存在');

        // 檢查是否已是成員
        const { data: existing } = await supabase
            .from('group_members')
            .select('id')
            .eq('group_id', group.id)
            .eq('user_id', userId)
            .single();

        if (existing) throw new Error('您已經是此群組的成員');

        // 加入群組
        const { error: joinError } = await supabase
            .from('group_members')
            .insert({
                group_id: group.id,
                user_id: userId,
                role: 'member',
            });

        if (joinError) throw joinError;

        return group;
    },

    /**
     * 離開群組
     */
    async leaveGroup(groupId: string, userId: string) {
        const { error } = await supabase
            .from('group_members')
            .delete()
            .eq('group_id', groupId)
            .eq('user_id', userId);

        if (error) throw error;
    },

    /**
     * 移除成員（僅限擁有者）
     */
    async removeMember(groupId: string, memberId: string) {
        const { error } = await supabase
            .from('group_members')
            .delete()
            .eq('group_id', groupId)
            .eq('user_id', memberId);

        if (error) throw error;
    },

    /**
     * 取得成員數量
     */
    async getMemberCount(groupId: string) {
        const { count, error } = await supabase
            .from('group_members')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', groupId);

        if (error) throw error;
        return count || 0;
    },

    /**
     * 上傳群組頭像
     */
    async uploadGroupAvatar(groupId: string, file: File) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${groupId}-${Date.now()}.${fileExt}`;
        const filePath = `groups/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('groups')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
            .from('groups')
            .getPublicUrl(filePath);

        return data.publicUrl;
    },

    /**
     * 生成邀請連結
     */
    getInviteLink(inviteCode: string) {
        return `${window.location.origin}/join/${inviteCode}`;
    },
};

export default groupsApi;
