import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, MessageSquare, Star, DollarSign, Users } from 'lucide-react';
import api from '@/lib/api';

interface Analytics {
  bot_id: number;
  total_conversations: number;
  total_messages: number;
  average_rating: number;
  total_reviews: number;
  total_revenue: number;
}

export default function BotAnalytics() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [botName, setBotName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      fetchAnalytics();
      fetchBotInfo();
    }
  }, [id]);

  const fetchBotInfo = async () => {
    try {
      const response = await api.getBot(Number(id));
      if (response.success && response.data) {
        setBotName((response.data as any).name);
      }
    } catch (err) {
      console.error('Failed to fetch bot info:', err);
    }
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.getBotAnalytics(Number(id));
      if (response.success && response.data) {
        setAnalytics(response.data as Analytics);
      } else {
        setError(response.error || 'Failed to load analytics');
      }
    } catch (err: any) {
      setError('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <Alert variant="destructive">
          <AlertDescription>{error || 'Failed to load analytics'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const stats = [
    {
      title: 'Total Conversations',
      value: analytics.total_conversations,
      icon: MessageSquare,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Total Messages',
      value: analytics.total_messages,
      icon: MessageSquare,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Average Rating',
      value: analytics.average_rating > 0 ? analytics.average_rating.toFixed(1) : 'N/A',
      icon: Star,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
    {
      title: 'Total Reviews',
      value: analytics.total_reviews,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: 'Total Revenue',
      value: `$${analytics.total_revenue.toFixed(2)}`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    }
  ];

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <Button
        variant="ghost"
        className="mb-4"
        onClick={() => navigate('/admin/bots')}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to My Bots
      </Button>

      <div className="mb-6">
        <h1 className="text-3xl font-bold">{botName} - Analytics</h1>
        <p className="text-muted-foreground mt-2">
          Performance metrics and insights for your bot
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-4 h-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => navigate(`/admin/bots/${id}/edit`)}
          >
            Edit Bot
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(`/bots/${id}`)}
          >
            View Bot Page
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

