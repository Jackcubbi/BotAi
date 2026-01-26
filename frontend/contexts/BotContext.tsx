import React, { createContext, useContext, useState, useCallback } from 'react';
import apiClient from '../lib/api';
import type { Bot, BotFilters, BotFormData, BotAnalytics } from '../types/bot.types';

interface BotContextType {
  bots: Bot[];
  currentBot: Bot | null;
  isLoading: boolean;
  error: string | null;
  fetchBots: (filters?: BotFilters) => Promise<void>;
  fetchBotById: (id: number) => Promise<Bot | null>;
  createBot: (botData: BotFormData) => Promise<Bot | null>;
  updateBot: (id: number, updates: Partial<BotFormData>) => Promise<Bot | null>;
  deleteBot: (id: number) => Promise<boolean>;
  purchaseBot: (botId: number) => Promise<boolean>;
  fetchBotAnalytics: (botId: number) => Promise<BotAnalytics | null>;
  setCurrentBot: (bot: Bot | null) => void;
  clearError: () => void;
}

const BotContext = createContext<BotContextType | undefined>(undefined);

export const BotProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [bots, setBots] = useState<Bot[]>([]);
  const [currentBot, setCurrentBot] = useState<Bot | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBots = useCallback(async (filters?: BotFilters) => {
    setIsLoading(true);
    setError(null);
    try {
      // Convert BotFilters to API params
      const params = filters ? {
        category: filters.category ? String(filters.category) : undefined,
      } : undefined;
      const response = await apiClient.getMarketplaceBots(params);
      if (response.data) {
        setBots(response.data as Bot[]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch bots');
      console.error('Error fetching bots:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchBotById = useCallback(async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.getBot(id);
      if (response.data) {
        const bot = response.data as Bot;
        setCurrentBot(bot);
        return bot;
      }
      return null;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch bot');
      console.error('Error fetching bot:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createBot = useCallback(async (botData: BotFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.createBot(botData);
      if (response.data) {
        const newBot = response.data as Bot;
        setBots((prev) => [newBot, ...prev]);
        return newBot;
      }
      return null;
    } catch (err: any) {
      setError(err.message || 'Failed to create bot');
      console.error('Error creating bot:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateBot = useCallback(async (id: number, updates: Partial<BotFormData>) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.updateBot(id, updates);
      if (response.data) {
        const updatedBot = response.data as Bot;
        setBots((prev) => prev.map((bot) => (bot.id === id ? updatedBot : bot)));
        if (currentBot?.id === id) {
          setCurrentBot(updatedBot);
        }
        return updatedBot;
      }
      return null;
    } catch (err: any) {
      setError(err.message || 'Failed to update bot');
      console.error('Error updating bot:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [currentBot]);

  const deleteBot = useCallback(async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      await apiClient.deleteBot(id);
      setBots((prev) => prev.filter((bot) => bot.id !== id));
      if (currentBot?.id === id) {
        setCurrentBot(null);
      }
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to delete bot');
      console.error('Error deleting bot:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [currentBot]);

  const purchaseBot = useCallback(async (botId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.purchaseBot(botId);
      if (response.data) {
        // Update the bot's isPurchased status
        setBots((prev) =>
          prev.map((bot) => (bot.id === botId ? { ...bot, isPurchased: true } : bot))
        );
        if (currentBot?.id === botId) {
          setCurrentBot({ ...currentBot, isPurchased: true });
        }
        return true;
      }
      return false;
    } catch (err: any) {
      setError(err.message || 'Failed to purchase bot');
      console.error('Error purchasing bot:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [currentBot]);

  const fetchBotAnalytics = useCallback(async (botId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.getBotAnalytics(botId);
      if (response.data) {
        return response.data as BotAnalytics;
      }
      return null;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch analytics');
      console.error('Error fetching analytics:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: BotContextType = {
    bots,
    currentBot,
    isLoading,
    error,
    fetchBots,
    fetchBotById,
    createBot,
    updateBot,
    deleteBot,
    purchaseBot,
    fetchBotAnalytics,
    setCurrentBot,
    clearError,
  };

  return <BotContext.Provider value={value}>{children}</BotContext.Provider>;
};

export const useBots = () => {
  const context = useContext(BotContext);
  if (context === undefined) {
    throw new Error('useBots must be used within a BotProvider');
  }
  return context;
};

export default BotContext;

