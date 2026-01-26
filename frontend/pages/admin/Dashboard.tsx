import React, { useEffect, useState } from 'react';
import { Package, DollarSign, Users, ShoppingBag, TrendingUp, AlertCircle } from 'lucide-react';

interface Stats {
  total_products: number;
  total_orders: number;
  low_stock_products: number;
  total_users: number;
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
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }

      const data = await response.json();
      setStats(data);
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
      title: 'Total Products',
      value: stats?.total_products || 0,
      icon: Package,
      color: 'bg-botai-dark',
    },
    {
      title: 'Total Orders',
      value: stats?.total_orders || 0,
      icon: ShoppingBag,
      color: 'bg-botai-dark',
    },
    {
      title: 'Total Users',
      value: stats?.total_users || 0,
      icon: Users,
      color: 'bg-botai-dark',
    },
    {
      title: 'Low Stock Items',
      value: stats?.low_stock_products || 0,
      icon: AlertCircle,
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
          Welcome to your admin dashboard
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
          <a
            href="/admin/products/new"
            className="flex items-center gap-3 p-4 border-2 border-botai-grey-line rounded-lg hover:border-botai-accent-green transition-colors"
          >
            <Package className="w-6 h-6 text-botai-accent-green" />
            <div>
              <p className="font-noto-sans font-semibold text-botai-dark">Add New Product</p>
              <p className="text-sm text-botai-text">Create a new product listing</p>
            </div>
          </a>

          <a
            href="/admin/orders"
            className="flex items-center gap-3 p-4 border-2 border-botai-grey-line rounded-lg hover:border-botai-accent-green transition-colors"
          >
            <ShoppingBag className="w-6 h-6 text-botai-accent-green" />
            <div>
              <p className="font-noto-sans font-semibold text-botai-dark">View Orders</p>
              <p className="text-sm text-botai-text">Manage customer orders</p>
            </div>
          </a>

          <a
            href="/admin/products"
            className="flex items-center gap-3 p-4 border-2 border-botai-grey-line rounded-lg hover:border-botai-accent-green transition-colors"
          >
            <AlertCircle className="w-6 h-6 text-botai-accent-green" />
            <div>
              <p className="font-noto-sans font-semibold text-botai-dark">Low Stock Alert</p>
              <p className="text-sm text-botai-text">Check products running low</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}

