// Chat Type Definitions

export interface Conversation {
  id: number;
  bot_id: number;
  user_id: number;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;

  // Extended fields
  bot?: {
    id: number;
    name: string;
    avatar_url?: string;
  };
  last_message?: Message;
}

export interface Message {
  id: number;
  conversation_id: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
  tokens_used?: number;
}

export interface ChatRequest {
  message: string;
  bot_id: number;
  conversation_id?: number;
}

export interface ChatResponse {
  message: Message;
  conversation_id: number;
  bot_id: number;
}

export interface ConversationHistory {
  conversations: Conversation[];
  total: number;
  page: number;
  per_page: number;
}

