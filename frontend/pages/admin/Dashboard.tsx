import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bot, Globe, Users, MessageSquare, TrendingUp, Shield } from 'lucide-react';
import { apiClient } from '../../lib/api';

interface Stats {
  total_users: number;
  total_bots: number;
  public_bots: number;
  total_orders: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await apiClient.getAdminStats();
      if (response.success && response.data) {
        setStats(response.data as Stats);
      } else {
        setError(response.error || 'Failed to load stats');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-botai-black"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {error}
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.total_users ?? 0,
      icon: Users,
      color: 'bg-botai-dark',
    },
    {
      title: 'Total Bots',
      value: stats?.total_bots ?? 0,
      icon: Bot,
      color: 'bg-botai-dark',
    },
    {
      title: 'Public Bots',
      value: stats?.public_bots ?? 0,
      icon: Globe,
      color: 'bg-botai-dark',
    },
    {
      title: 'Private Bots',
      value: (stats?.total_bots ?? 0) - (stats?.public_bots ?? 0),
      icon: Shield,
      color: 'bg-botai-dark',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-space-grotesk font-bold text-4xl text-botai-dark mb-2">
          Dashboard
        </h1>
        <p className="font-noto-sans text-botai-text">
          Platform overview
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className="bg-white rounded-xl p-6 border border-botai-grey-line hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <TrendingUp className="w-5 h-5 text-green-500" />
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
      <div className="bg-white rounded-xl p-6 border border-botai-grey-line">
        <h2 className="font-space-grotesk font-bold text-2xl text-botai-dark mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/admin/bots"
            className="flex items-center gap-3 p-4 border-2 border-botai-grey-line rounded-lg hover:border-botai-accent-green transition-colors"
          >
            <Bot className="w-6 h-6 text-botai-accent-green" />
            <div>
              <p className="font-noto-sans font-semibold text-botai-dark">Manage Bots</p>
              <p className="text-sm text-botai-text">View and moderate all bots</p>
            </div>
          </Link>

          <Link
            to="/admin/users"
            className="flex items-center gap-3 p-4 border-2 border-botai-grey-line rounded-lg hover:border-botai-accent-green transition-colors"
          >
            <Users className="w-6 h-6 text-botai-accent-green" />
            <div>
              <p className="font-noto-sans font-semibold text-botai-dark">Manage Users</p>
              <p className="text-sm text-botai-text">View users and assign roles</p>
            </div>
          </Link>

          <Link
            to="/admin/support-chat"
            className="flex items-center gap-3 p-4 border-2 border-botai-grey-line rounded-lg hover:border-botai-accent-green transition-colors"
          >
            <MessageSquare className="w-6 h-6 text-botai-accent-green" />
            <div>
              <p className="font-noto-sans font-semibold text-botai-dark">Support Chat</p>
              <p className="text-sm text-botai-text">Respond to user support tickets</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
