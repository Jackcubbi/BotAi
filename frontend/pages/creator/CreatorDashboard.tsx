import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bot, TrendingUp, DollarSign, MessageSquare, Plus, Eye, Star } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../lib/api';

interface DashboardStats {
  total_bots: number;
  public_bots: number;
  private_bots: number;
  total_conversations: number;
  total_earnings: number;
  total_purchases: number;
}

interface BotPreview {
  id: number;
  name: string;
  description: string;
  category: string;
  is_public: boolean;
  total_conversations: number;
  average_rating: number | string | null;
  total_reviews: number;
  created_at: string;
}

export default function CreatorDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    total_bots: 0,
    public_bots: 0,
    private_bots: 0,
    total_conversations: 0,
    total_earnings: 0,
    total_purchases: 0
  });
  const [recentBots, setRecentBots] = useState<BotPreview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await apiClient.getMyBots({ page: 1, limit: 5 });

      if (response.success && response.data) {
        const data = response.data as any;
        const bots = (data.bots || []).map((bot: any) => ({
          ...bot,
          total_conversations: Number(bot?.total_conversations || 0),
          average_rating: Number(bot?.average_rating || 0),
        }));
        setRecentBots(bots);

        // Calculate stats from bots
        const publicBots = bots.filter((b: any) => b.is_public).length;
        const privateBots = bots.length - publicBots;
        const totalConversations = bots.reduce((sum: number, b: any) => sum + (b.total_conversations || 0), 0);

        setStats({
          total_bots: bots.length,
          public_bots: publicBots,
          private_bots: privateBots,
          total_conversations: totalConversations,
          total_earnings: 0, // Would come from sales API
          total_purchases: 0  // Would come from purchases API
        });
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-botai-accent-green border-t-transparent"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Bots',
      value: stats.total_bots,
      icon: Bot,
      color: 'bg-botai-dark',
      change: null
    },
    {
      title: 'Public Bots',
      value: stats.public_bots,
      icon: Eye,
      color: 'bg-botai-dark',
      change: null
    },
    {
      title: 'Conversations',
      value: stats.total_conversations,
      icon: MessageSquare,
      color: 'bg-botai-dark',
      change: null
    },
    {
      title: 'Total Earnings',
      value: `$${stats.total_earnings.toFixed(2)}`,
      icon: DollarSign,
      color: 'bg-botai-dark',
      change: null
    }
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-space-grotesk font-bold text-4xl text-botai-dark mb-2">
          Welcome back, {(user as any)?.full_name || 'Creator'}!
        </h1>
        <p className="font-noto-sans text-botai-text">
          Manage your AI bots and track their performance
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-lg p-6 transition-transform hover:scale-105"
            >
              <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4`}>
                <Icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-noto-sans text-botai-text text-sm mb-1">
                {stat.title}
              </h3>
              <p className="font-space-grotesk font-bold text-3xl text-botai-dark">
                {stat.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="font-space-grotesk font-bold text-2xl text-botai-dark mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/creator/bots/create"
            className="bg-gradient-to-br from-botai-accent-green to-botai-accent-blue rounded-2xl p-6 text-botai-black hover:shadow-2xl transition-all"
          >
            <Plus className="w-8 h-8 mb-3" />
            <h3 className="font-space-grotesk font-bold text-xl mb-2">
              Create New Bot
            </h3>
            <p className="font-noto-sans text-sm opacity-80">
              Build a new AI assistant from scratch
            </p>
          </Link>

          <Link
            to="/creator/bots"
            className="bg-white rounded-2xl p-6 border-2 border-botai-grey-line hover:border-botai-accent-blue hover:shadow-lg transition-all"
          >
            <Bot className="w-8 h-8 mb-3 text-botai-accent-blue" />
            <h3 className="font-space-grotesk font-bold text-xl mb-2 text-botai-dark">
              View All Bots
            </h3>
            <p className="font-noto-sans text-sm text-botai-text">
              Manage and edit your existing bots
            </p>
          </Link>

          <Link
            to="/creator/analytics"
            className="bg-white rounded-2xl p-6 border-2 border-botai-grey-line hover:border-botai-accent-purple hover:shadow-lg transition-all"
          >
            <TrendingUp className="w-8 h-8 mb-3 text-botai-accent-purple" />
            <h3 className="font-space-grotesk font-bold text-xl mb-2 text-botai-dark">
              View Analytics
            </h3>
            <p className="font-noto-sans text-sm text-botai-text">
              Track performance and insights
            </p>
          </Link>
        </div>
      </div>

      {/* Recent Bots */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-space-grotesk font-bold text-2xl text-botai-dark">
            Recent Bots
          </h2>
          <Link
            to="/creator/bots"
            className="font-noto-sans text-botai-accent-blue hover:text-botai-dark transition-colors"
          >
            View all →
          </Link>
        </div>

        {recentBots.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center">
            <Bot className="w-16 h-16 mx-auto mb-4 text-botai-grey-line" />
            <h3 className="font-space-grotesk font-bold text-xl text-botai-dark mb-2">
              No bots yet
            </h3>
            <p className="font-noto-sans text-botai-text mb-6">
              Create your first AI bot to get started
            </p>
            <Link
              to="/creator/bots/create"
              className="inline-flex items-center gap-2 px-6 py-3 bg-botai-black text-white rounded-full font-noto-sans hover:bg-botai-dark transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Bot
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentBots.map((bot) => (
              <div
                key={bot.id}
                className="bg-white rounded-2xl border border-botai-grey-line shadow-sm hover:shadow-lg transition-all p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-full bg-botai-grey-bg border border-botai-grey-line flex items-center justify-center">
                    <Bot className="w-5 h-5 text-botai-text" />
                  </div>
                  {bot.is_public ? (
                    <span className="px-3 py-1 bg-botai-accent-green/20 text-botai-black rounded-full text-xs font-space-grotesk font-semibold">
                      Public
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-botai-grey-bg border border-botai-grey-line rounded-full text-xs font-space-grotesk font-semibold text-botai-text">
                      Private
                    </span>
                  )}
                </div>

                <h3 className="font-space-grotesk font-bold text-3xl text-botai-dark mb-2 truncate">
                  {bot.name}
                </h3>
                <p className="font-noto-sans text-botai-text mb-4 line-clamp-2">
                  {bot.description}
                </p>

                <div className="flex items-center gap-4 text-sm text-botai-text mb-5">
                  <div className="flex items-center gap-1">
                    <MessageSquare className="w-4 h-4" />
                    <span>{bot.total_conversations}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-botai-star text-botai-star" />
                    <span>{Number(bot.average_rating) > 0 ? Number(bot.average_rating).toFixed(1) : 'New'}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link
                    to={`/creator/bots/${bot.id}/edit`}
                    className="flex-1 px-4 py-2.5 border border-botai-grey-line rounded-xl text-center font-noto-sans font-semibold text-botai-dark text-sm hover:bg-botai-grey-bg transition-colors"
                  >
                    Edit
                  </Link>
                  <Link
                    to={`/creator/bots/${bot.id}/analytics`}
                    className="px-4 py-2.5 bg-botai-grey-bg rounded-xl font-noto-sans font-semibold text-sm text-botai-dark hover:bg-botai-grey-light transition-colors"
                  >
                    Analytics
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

