
export enum AppView {
  LANDING = 'LANDING',
  AUTH = 'AUTH',
  SIGNUP = 'SIGNUP',
  ONBOARDING = 'ONBOARDING',
  DASHBOARD = 'DASHBOARD',
  DETAIL = 'DETAIL',
  HISTORY = 'HISTORY',
  SHARED_LIST = 'SHARED_LIST',
  ADD_ITEM = 'ADD_ITEM',
  VOTING_DETAIL = 'VOTING_DETAIL',
  SETTINGS = 'SETTINGS',
  CREATE_GROUP = 'CREATE_GROUP',
  EDIT_GROUP = 'EDIT_GROUP'
}

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  store: string;
  discount?: string;
  isNewLow?: boolean;
  color?: string;
}

export interface SharedList {
  id: string;
  title: string;
  membersCount: number;
  totalBudget: number;
  spentBudget: number;
  items: SharedItem[];
}

export interface SharedItem {
  id: string;
  name: string;
  price: number;
  status: 'VOTING' | 'APPROVED' | 'REJECTED';
  proposer: string;
  proposerAvatar: string;
  image: string;
  discount?: string;
  votes: number;
  totalMembers: number;
}

export interface ChatMessage {
  id: string;
  user: string;
  avatar: string;
  time: string;
  content: string;
  isMe?: boolean;
}

export interface NotificationSettings {
  price_alerts: boolean;
  price_drop_notifications: boolean;
  voting_notifications: boolean;
  achievement_reminders: boolean;
}
