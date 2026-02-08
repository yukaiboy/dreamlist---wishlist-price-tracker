import { useState, useEffect, useCallback } from 'react';
import { groupsApi, Group, CreateGroupData, UpdateGroupData } from '../api/groups';
import { sharedItemsApi, SharedItem, CreateSharedItemData } from '../api/shared-items';
import { useAuth } from '../../contexts/AuthContext';

interface GroupWithRole extends Group {
    role: 'owner' | 'admin' | 'member';
}

interface UseGroupsReturn {
    groups: GroupWithRole[];
    loading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
    createGroup: (data: CreateGroupData) => Promise<Group>;
    joinGroup: (inviteCode: string) => Promise<void>;
}

/**
 * 群組列表 Hook
 */
export function useGroups(): UseGroupsReturn {
    const { user } = useAuth();
    const [groups, setGroups] = useState<GroupWithRole[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchGroups = useCallback(async () => {
        if (!user) {
            setGroups([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const data = await groupsApi.getGroups(user.id);
            setGroups(data as GroupWithRole[]);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchGroups();
    }, [fetchGroups]);

    const createGroup = async (data: CreateGroupData) => {
        if (!user) throw new Error('用戶未登入');
        const group = await groupsApi.createGroup(user.id, data);
        await fetchGroups();
        return group;
    };

    const joinGroup = async (inviteCode: string) => {
        if (!user) throw new Error('用戶未登入');
        await groupsApi.joinGroup(inviteCode, user.id);
        await fetchGroups();
    };

    return {
        groups,
        loading,
        error,
        refetch: fetchGroups,
        createGroup,
        joinGroup,
    };
}

interface GroupDetail extends Group {
    members: {
        id: string;
        user_id: string;
        role: string;
        joined_at: string;
        profile: {
            display_name: string;
            avatar_url: string;
            email: string;
        };
    }[];
}

interface UseGroupReturn {
    group: GroupDetail | null;
    sharedItems: SharedItem[];
    loading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
    updateGroup: (data: UpdateGroupData) => Promise<Group>;
    deleteGroup: () => Promise<void>;
    removeMember: (memberId: string) => Promise<void>;
    leaveGroup: () => Promise<void>;
    proposeItem: (data: CreateSharedItemData) => Promise<SharedItem>;
}

/**
 * 單一群組詳情 Hook
 */
export function useGroup(groupId: string | null): UseGroupReturn {
    const { user } = useAuth();
    const [group, setGroup] = useState<GroupDetail | null>(null);
    const [sharedItems, setSharedItems] = useState<SharedItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchGroup = useCallback(async () => {
        if (!groupId) {
            setGroup(null);
            setSharedItems([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const [groupData, itemsData] = await Promise.all([
                groupsApi.getGroup(groupId),
                sharedItemsApi.getSharedItems(groupId),
            ]);
            setGroup(groupData as GroupDetail);
            setSharedItems(itemsData);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    }, [groupId]);

    useEffect(() => {
        fetchGroup();
    }, [fetchGroup]);

    const updateGroup = async (data: UpdateGroupData) => {
        if (!groupId) throw new Error('群組 ID 不存在');
        const updated = await groupsApi.updateGroup(groupId, data);
        await fetchGroup();
        return updated;
    };

    const deleteGroup = async () => {
        if (!groupId) throw new Error('群組 ID 不存在');
        await groupsApi.deleteGroup(groupId);
    };

    const removeMember = async (memberId: string) => {
        if (!groupId) throw new Error('群組 ID 不存在');
        await groupsApi.removeMember(groupId, memberId);
        await fetchGroup();
    };

    const leaveGroup = async () => {
        if (!groupId || !user) throw new Error('群組或用戶不存在');
        await groupsApi.leaveGroup(groupId, user.id);
    };

    const proposeItem = async (data: CreateSharedItemData) => {
        if (!groupId || !user) throw new Error('群組或用戶不存在');
        const item = await sharedItemsApi.proposeItem(groupId, user.id, data);
        await fetchGroup();
        return item;
    };

    return {
        group,
        sharedItems,
        loading,
        error,
        refetch: fetchGroup,
        updateGroup,
        deleteGroup,
        removeMember,
        leaveGroup,
        proposeItem,
    };
}

export default useGroups;
