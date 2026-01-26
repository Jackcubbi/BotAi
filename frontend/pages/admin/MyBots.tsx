import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Bot, AlertCircle } from 'lucide-react';
import BotCard from '@/components/bot/BotCard';
import api from '@/lib/api';
import ConfirmDialog from '@/components/shared/ConfirmDialog';

interface Bot {
  id: number;
  name: string;
  description: string;
  category: string;
  price: number;
  avatar_url?: string;
  average_rating: number;
  total_reviews: number;
  total_conversations: number;
  creator_id: number;
  is_public: boolean;
}

export default function AdminMyBots() {
  const navigate = useNavigate();
  const [bots, setBots] = useState<Bot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; botId: number | null; botName: string }>({ show: false, botId: null, botName: '' });
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchMyBots();
  }, []);

  const fetchMyBots = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setError('Session expired. Please log in again.');
        navigate('/login?redirect=/creator/bots');
        return;
      }

      const response = await api.getMyBots();
      if (response.success && response.data) {
        const data = response.data as any;
        setBots(data.bots || []);
      } else {
        const message = response.error || 'Failed to load your bots';
        setError(message);
        if (message.toLowerCase().includes('not authenticated') || message.toLowerCase().includes('session')) {
          navigate('/login?redirect=/creator/bots');
        }
      }
    } catch (err: any) {
      setError('Failed to load your bots');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (botId: number) => {
    navigate(`/creator/bots/${botId}/edit`);
  };

  const handleDeleteClick = (botId: number) => {
    const bot = bots.find(b => b.id === botId);
    setDeleteConfirm({ show: true, botId, botName: bot?.name || 'this bot' });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.botId) return;

    setIsDeleting(true);
    try {
      const response = await api.deleteBot(deleteConfirm.botId);
      if (response.success) {
        setBots(bots.filter(bot => bot.id !== deleteConfirm.botId));
        setDeleteConfirm({ show: false, botId: null, botName: '' });
      } else {
        alert(response.error || 'Failed to delete bot');
      }
    } catch (err: any) {
      alert('Failed to delete bot');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-botai-grey-bg">
      <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-space-grotesk font-bold text-4xl text-botai-dark">My Bots</h1>
          <p className="font-noto-sans text-botai-text mt-2">
            Manage your created bots
          </p>
        </div>
        <button
          onClick={() => navigate('/creator/bots/create')}
          className="bg-botai-dark text-white px-6 py-3 rounded-xl font-noto-sans font-semibold hover:bg-opacity-90 transition-all shadow-lg flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Create New Bot
        </button>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="font-noto-sans text-red-700">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-botai-accent-green border-t-transparent"></div>
        </div>
      ) : bots.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <Bot className="w-16 h-16 mx-auto mb-4 text-botai-grey-line" />
          <h3 className="font-space-grotesk font-bold text-2xl text-botai-dark mb-2">No bots yet</h3>
          <p className="font-noto-sans text-botai-text mb-6">
            Create your first AI bot to get started
          </p>
          <button
            onClick={() => navigate('/creator/bots/create')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-botai-dark text-white rounded-xl font-noto-sans font-semibold hover:bg-opacity-90 transition-all"
          >
            <Plus className="w-5 h-5" />
            Create Your First Bot
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bots.map((bot) => (
            <BotCard
              key={bot.id}
              bot={bot}
              showActions
              onEdit={() => handleEdit(bot.id)}
              onDelete={() => handleDeleteClick(bot.id)}
            />
          ))}
        </div>
      )}
      </div>

      <ConfirmDialog
        isOpen={deleteConfirm.show}
        onClose={() => setDeleteConfirm({ show: false, botId: null, botName: '' })}
        onConfirm={handleDeleteConfirm}
        title="DELETE BOT"
        message={`Are you sure you want to delete ${deleteConfirm.botName}? This action cannot be undone.`}
        confirmText="DELETE"
        cancelText="CANCEL"
        type="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}

