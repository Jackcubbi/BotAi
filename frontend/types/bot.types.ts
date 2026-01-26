// Bot Type Definitions

export interface Bot {
  id: number;
  name: string;
  description: string;
  category_id: number;
  creator_id: number;
  system_prompt: string;
  ai_model: string;
  output_mode?: 'text' | 'image' | 'audio' | 'video';
  temperature: number;
  max_tokens: number;
  is_public: boolean;
  is_free: boolean;
  price: number;
  avatar_url?: string;
  rating: number;
  total_conversations: number;
  created_at: string;
  updated_at: string;

  // Extended fields
  category?: BotCategory;
  creator?: BotCreator;
  reviews?: BotReview[];
  isPurchased?: boolean;
}

export interface BotCategory {
  id: number;
  name: string;
  description: string;
  icon?: string;
}

export interface BotCreator {
  id: number;
  full_name: string;
  email: string;
  avatar_url?: string;
}

export interface BotReview {
  id: number;
  bot_id: number;
  user_id: number;
  rating: number;
  comment: string;
  created_at: string;
  user_name?: string;
}

export interface BotFormData {
  name: string;
  description: string;
  category_id: number;
  system_prompt: string;
  ai_model: string;
  output_mode?: 'text' | 'image' | 'audio' | 'video';
  temperature: number;
  max_tokens: number;
  is_public: boolean;
  is_free: boolean;
  price: number;
  avatar_url?: string;
}

export interface BotFilters {
  search?: string;
  category?: number;
  is_free?: boolean;
  min_rating?: number;
  sort_by?: 'rating' | 'conversations' | 'created_at' | 'price';
  sort_order?: 'asc' | 'desc';
}

export interface BotAnalytics {
  bot_id: number;
  total_conversations: number;
  total_messages: number;
  total_revenue: number;
  unique_users: number;
  average_rating: number;
  total_reviews: number;
  conversations_by_date: Record<string, number>;
  messages_by_date: Record<string, number>;
  revenue_by_date: Record<string, number>;
}

export interface BotPurchase {
  id: number;
  bot_id: number;
  user_id: number;
  price: number;
  purchased_at: string;
  bot?: Bot;
}

// AI Model options
export const AI_MODELS = [
  { value: 'gpt-5.2', label: 'GPT-5.2', description: 'Flagship model' },
  { value: 'gpt-5-mini', label: 'GPT-5 Mini', description: 'Fast and capable' },
  { value: 'gpt-4.1', label: 'GPT-4.1', description: 'Strong general model' },
  { value: 'gpt-4.1-mini', label: 'GPT-4.1 Mini', description: 'Compact and efficient' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini', description: 'Compact and fast' },
  { value: 'gpt-audio', label: 'GPT-Audio', description: 'Audio input/output creative workflows' },
  { value: 'gpt-audio-mini', label: 'GPT-Audio Mini', description: 'Affordable audio creative workflows' },
  { value: 'gpt-image-1.5', label: 'GPT-Image 1.5', description: 'High-quality image generation' },
  { value: 'sora-2', label: 'Sora 2', description: 'Video generation model' },
] as const;

export type AIModel = typeof AI_MODELS[number]['value'];

