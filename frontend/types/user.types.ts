// User Type Definitions

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: 'user' | 'admin' | 'creator';
  is_active: boolean;
  created_at: string;
  avatar_url?: string;
}

export interface UserRegistration {
  email: string;
  password: string;
  full_name: string;
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface UserProfile extends User {
  total_bots_created?: number;
  total_purchases?: number;
  total_conversations?: number;
  total_earnings?: number;
}

export interface UserSettings {
  notifications_enabled: boolean;
  email_notifications: boolean;
  public_profile: boolean;
  language: string;
  theme: 'light' | 'dark' | 'auto';
}

