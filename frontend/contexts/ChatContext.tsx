import React, { createContext, useContext, useState, useCallback } from 'react';
import apiClient from '../lib/api';
import type { Conversation, Message, ChatRequest } from '../types/chat.types';

interface ChatContextType {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  isLoading: boolean;
  isSending: boolean;
  error: string | null;
  fetchConversations: (botId?: number) => Promise<void>;
  loadConversation: (id: number) => Promise<void>;
  sendMessage: (content: string, botId: number, conversationId?: number) => Promise<boolean>;
  createConversation: (botId: number) => Promise<Conversation | null>;
  deleteConversation: (id: number) => Promise<boolean>;
  setCurrentConversation: (conversation: Conversation | null) => void;
  clearMessages: () => void;
  clearError: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = useCallback(async (botId?: number) => {
    setIsLoading(true);
    setError(null);
    try {
      // Note: API requires botId for getBotConversations
      // This will need to be updated when user-wide conversation endpoint is available
      if (botId) {
        const response = await apiClient.getBotConversations(botId);
        if (response.data) {
          setConversations(response.data as Conversation[]);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch conversations');
      console.error('Error fetching conversations:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadConversation = useCallback(async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.getConversationMessages(id);
      if (response.data) {
        const conversationData = response.data as any;
        setMessages(conversationData.messages || []);

        // Find and set the current conversation
        const conversation = conversations.find((c) => c.id === id);
        if (conversation) {
          setCurrentConversation(conversation);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load conversation');
      console.error('Error loading conversation:', err);
    } finally {
      setIsLoading(false);
    }
  }, [conversations]);

  const sendMessage = useCallback(async (
    content: string,
    botId: number,
    conversationId?: number
  ): Promise<boolean> => {
    setIsSending(true);
    setError(null);

    // Add user message optimistically
    const userMessage: Message = {
      id: Date.now(), // Temporary ID
      conversation_id: conversationId || 0,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const response = await apiClient.chatWithBot(botId, content, conversationId);
      if (response.data) {
        const chatResponse = response.data as any;
        const assistantMessage = chatResponse.message;
        const newConversationId = chatResponse.conversation_id;

        // Replace optimistic user message and add assistant response
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== userMessage.id),
          {
            ...userMessage,
            id: chatResponse.user_message_id || userMessage.id,
            conversation_id: newConversationId,
          },
          assistantMessage,
        ]);

        // Update conversation ID if this was a new conversation
        if (!conversationId && currentConversation) {
          setCurrentConversation({
            ...currentConversation,
            id: newConversationId,
          });
        }

        return true;
      }
      return false;
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
      console.error('Error sending message:', err);
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
      return false;
    } finally {
      setIsSending(false);
    }
  }, [currentConversation]);

  const createConversation = useCallback(async (botId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      // Conversations are created automatically when sending first message
      // This is a placeholder for explicit conversation creation
      const newConversation: Conversation = {
        id: 0, // Will be assigned by backend
        bot_id: botId,
        user_id: 0, // Will be filled by backend
        title: 'New Conversation',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        message_count: 0,
      };

      setCurrentConversation(newConversation);
      setMessages([]);
      return newConversation;
    } catch (err: any) {
      setError(err.message || 'Failed to create conversation');
      console.error('Error creating conversation:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteConversation = useCallback(async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      // TODO: Implement delete conversation API endpoint
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (currentConversation?.id === id) {
        setCurrentConversation(null);
        setMessages([]);
      }
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to delete conversation');
      console.error('Error deleting conversation:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [currentConversation]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: ChatContextType = {
    conversations,
    currentConversation,
    messages,
    isLoading,
    isSending,
    error,
    fetchConversations,
    loadConversation,
    sendMessage,
    createConversation,
    deleteConversation,
    setCurrentConversation,
    clearMessages,
    clearError,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export default ChatContext;

