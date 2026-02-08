// API 服務匯出
export { authApi } from './api/auth';
export { productsApi } from './api/products';
export { groupsApi } from './api/groups';
export { sharedItemsApi } from './api/shared-items';
export { chatApi } from './api/chat';
export { historyApi } from './api/history';

// 型別匯出
export type { SignUpData, SignInData, UpdateProfileData } from './api/auth';
export type { Product, CreateProductData, UpdateProductData } from './api/products';
export type { Group, GroupMember, CreateGroupData, UpdateGroupData } from './api/groups';
export type { SharedItem, Vote, CreateSharedItemData } from './api/shared-items';
export type { ChatMessage } from './api/chat';
export type { HistoryItem, HistoryStats } from './api/history';

// Supabase 客戶端
export { supabase } from './supabase';
