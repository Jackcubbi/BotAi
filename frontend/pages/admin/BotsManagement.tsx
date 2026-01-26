import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bot,
  Search,
  Eye,
  Edit,
  Trash2,
  X,
  Save,
  Globe,
  Lock,
  MessageSquare,
  Star,
  DollarSign,
  Users,
  TrendingUp,
  Filter
} from 'lucide-react';
import apiClient from '../../lib/api';
import ConfirmDialog from '../../components/shared/ConfirmDialog';

interface BotData {
  id: number;
  name: string;
  description: string;
  category: string;
  price: number;
  is_public: boolean;
  creator_id: number;
  creator_name: string;
  creator_email: string;
  total_conversations: number;
  average_rating: number;
  avatar_url?: string;
  created_at: string;
}

interface BotDetailsData extends BotData {
  stats: {
    total_conversations: number;
    total_reviews: number;
    average_rating: number;
    total_purchases: number;
  };
  system_prompt: string;
  ai_model: string;
  temperature: number;
  max_tokens: number;
  welcome_message: string;
}

export default function BotsManagement() {
  const navigate = useNavigate();
  const [bots, setBots] = useState<BotData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'public' | 'private'>('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedBot, setSelectedBot] = useState<BotDetailsData | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [editingBot, setEditingBot] = useState<Partial<BotData> | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; botId: number | null; botName: string }>({ show: false, botId: null, botName: '' });
  const [isDeleting, setIsDeleting] = useState(false);
  const limit = 20;

  const categories = [
    'Customer Support',
    'Sales & Marketing',
    'Education & Tutoring',
    'Personal Assistant',
    'Entertainment',
    'Health & Wellness',
    'Finance',
    'Creative Writing',
    'Technical Support',
    'Other'
  ];

  useEffect(() => {
    fetchBots();
  }, [page, searchQuery, categoryFilter, statusFilter]);

  const fetchBots = async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        limit,
        search: searchQuery || undefined,
        category: categoryFilter || undefined
      };

      if (statusFilter === 'public') params.is_public = true;
      if (statusFilter === 'private') params.is_public = false;

      const response = await apiClient.getAdminBots(params);

      if (response.success && response.data) {
        const backendResponse = response.data as any;
        const data = backendResponse.data || backendResponse; // Handle both wrapped and unwrapped responses
        setBots(data.bots || []);
        setTotal(data.total || 0);
      }
    } catch (error) {
      console.error('Failed to fetch bots:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBotDetails = async (botId: number) => {
    try {
      const response = await apiClient.getAdminBotDetails(botId);
      if (response.success && response.data) {
        const backendResponse = response.data as any;
        const botData = backendResponse.data || backendResponse; // Handle both wrapped and unwrapped responses
        setSelectedBot(botData as BotDetailsData);
        setShowDetails(true);
      }
    } catch (error) {
      console.error('Failed to fetch bot details:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchBots();
  };

  const handleEdit = (bot: BotData) => {
    setEditingBot({
      id: bot.id,
      name: bot.name,
      description: bot.description,
      category: bot.category,
      price: bot.price,
      is_public: bot.is_public
    });
  };

  const handleSaveEdit = async () => {
    if (!editingBot || !editingBot.id) return;

    try {
      const response = await apiClient.updateAdminBot(editingBot.id, {
        name: editingBot.name,
        description: editingBot.description,
        category: editingBot.category,
        price: editingBot.price,
        is_public: editingBot.is_public
      });

      if (response.success) {
        fetchBots();
        setEditingBot(null);
      } else {
        alert(response.error || 'Failed to update bot');
      }
    } catch (error) {
      console.error('Failed to update bot:', error);
      alert('Failed to update bot');
    }
  };

  const handleDeleteClick = (botId: number, botName: string) => {
    setDeleteConfirm({ show: true, botId, botName });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.botId) return;

    setIsDeleting(true);
    try {
      const response = await apiClient.deleteAdminBot(deleteConfirm.botId);
      if (response.success) {
        fetchBots();
        if (selectedBot?.id === deleteConfirm.botId) {
          setShowDetails(false);
          setSelectedBot(null);
        }
        setDeleteConfirm({ show: false, botId: null, botName: '' });
      } else {
        alert(response.error || 'Failed to delete bot');
      }
    } catch (error) {
      console.error('Failed to delete bot:', error);
      alert('Failed to delete bot');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleTogglePublish = async (botId: number, currentStatus: boolean) => {
    try {
      const response = await apiClient.toggleAdminBotPublish(botId, !currentStatus);
      if (response.success) {
        fetchBots();
      } else {
        alert(response.error || 'Failed to update bot status');
      }
    } catch (error) {
      console.error('Failed to toggle bot status:', error);
      alert('Failed to update bot status');
    }
  };

  const totalPages = Math.ceil(total / limit);
  const publicBots = bots.filter(b => b.is_public).length;
  const privateBots = bots.filter(b => !b.is_public).length;
  const totalConversations = bots.reduce((sum, b) => sum + (b.total_conversations || 0), 0);
  const avgRating = bots.length > 0
    ? bots.reduce((sum, b) => sum + (b.average_rating || 0), 0) / bots.length
    : 0;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-space-grotesk font-bold text-4xl text-botai-dark mb-2">
          Bots Management
        </h1>
        <p className="font-noto-sans text-botai-text">
          Manage all bots on the platform
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-noto-sans text-botai-text text-sm mb-1">Total Bots</p>
              <p className="font-space-grotesk font-bold text-3xl text-botai-dark">{total}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-botai-dark flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-noto-sans text-botai-text text-sm mb-1">Public Bots</p>
              <p className="font-space-grotesk font-bold text-3xl text-botai-dark">{publicBots}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-botai-dark flex items-center justify-center">
              <Globe className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-noto-sans text-botai-text text-sm mb-1">Total Conversations</p>
              <p className="font-space-grotesk font-bold text-3xl text-botai-dark">{totalConversations}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-botai-dark flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-noto-sans text-botai-text text-sm mb-1">Avg Rating</p>
              <p className="font-space-grotesk font-bold text-3xl text-botai-dark">{avgRating.toFixed(1)}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-botai-dark flex items-center justify-center">
              <Star className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <div className="flex items-center gap-4 flex-wrap">
          <form onSubmit={handleSearch} className="flex-1 min-w-[300px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-botai-text" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search bots by name or description..."
                className="w-full pl-10 pr-4 py-3 border border-botai-grey-line rounded-lg font-noto-sans focus:ring-2 focus:ring-botai-accent-green focus:border-transparent"
              />
            </div>
          </form>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-6 py-3 bg-botai-grey-light text-botai-dark rounded-lg font-noto-sans font-semibold hover:bg-botai-grey-line transition-colors flex items-center gap-2"
          >
            <Filter className="w-5 h-5" />
            Filters
          </button>

          {(searchQuery || categoryFilter || statusFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setCategoryFilter('');
                setStatusFilter('all');
                setPage(1);
              }}
              className="px-6 py-3 bg-red-100 text-red-600 rounded-lg font-noto-sans font-semibold hover:bg-red-200 transition-colors"
            >
              Clear All
            </button>
          )}
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-botai-grey-line grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-noto-sans font-semibold text-botai-dark mb-2">
                Category
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
                className="w-full px-4 py-3 border border-botai-grey-line rounded-lg font-noto-sans focus:ring-2 focus:ring-botai-accent-green focus:border-transparent"
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-noto-sans font-semibold text-botai-dark mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value as any); setPage(1); }}
                className="w-full px-4 py-3 border border-botai-grey-line rounded-lg font-noto-sans focus:ring-2 focus:ring-botai-accent-green focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="public">Public Only</option>
                <option value="private">Private Only</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Bots Table */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-botai-grey-bg">
              <tr>
                <th className="px-6 py-4 text-left font-space-grotesk font-bold text-botai-dark uppercase tracking-wide text-sm">
                  Bot
                </th>
                <th className="px-6 py-4 text-left font-space-grotesk font-bold text-botai-dark uppercase tracking-wide text-sm">
                  Creator
                </th>
                <th className="px-6 py-4 text-left font-space-grotesk font-bold text-botai-dark uppercase tracking-wide text-sm">
                  Category
                </th>
                <th className="px-6 py-4 text-left font-space-grotesk font-bold text-botai-dark uppercase tracking-wide text-sm">
                  Price
                </th>
                <th className="px-6 py-4 text-left font-space-grotesk font-bold text-botai-dark uppercase tracking-wide text-sm">
                  Status
                </th>
                <th className="px-6 py-4 text-left font-space-grotesk font-bold text-botai-dark uppercase tracking-wide text-sm">
                  Stats
                </th>
                <th className="px-6 py-4 text-right font-space-grotesk font-bold text-botai-dark uppercase tracking-wide text-sm">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-botai-grey-line">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-4 border-botai-accent-green border-t-transparent"></div>
                    </div>
                  </td>
                </tr>
              ) : bots.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <p className="font-noto-sans text-botai-text">No bots found</p>
                  </td>
                </tr>
              ) : (
                bots.map((bot) => (
                  <tr key={bot.id} className="hover:bg-botai-grey-bg transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-botai-accent-green to-botai-accent-blue flex items-center justify-center">
                          <Bot className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-noto-sans font-semibold text-botai-dark">
                            {bot.name}
                          </p>
                          <p className="font-noto-sans text-sm text-botai-text line-clamp-1">
                            {bot.description}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-noto-sans text-botai-dark">
                        {bot.creator_name || 'Unknown'}
                      </p>
                      <p className="font-noto-sans text-sm text-botai-text">
                        {bot.creator_email}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-botai-grey-light rounded-full text-xs font-noto-sans font-semibold text-botai-dark">
                        {bot.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4 text-botai-text" />
                        <span className="font-space-grotesk font-bold text-botai-dark">
                          {bot.price.toFixed(2)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleTogglePublish(bot.id, bot.is_public)}
                        className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-noto-sans font-semibold transition-colors ${
                          bot.is_public
                            ? 'bg-botai-accent-green text-white hover:bg-opacity-80'
                            : 'bg-botai-grey-light text-botai-dark hover:bg-botai-grey-line'
                        }`}
                      >
                        {bot.is_public ? (
                          <>
                            <Globe className="w-3 h-3" />
                            Public
                          </>
                        ) : (
                          <>
                            <Lock className="w-3 h-3" />
                            Private
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3 text-sm">
                        <span className="font-noto-sans text-botai-text">
                          {bot.total_conversations || 0} chats
                        </span>
                        <span className="font-noto-sans text-botai-text">
                          ★ {(bot.average_rating || 0).toFixed(1)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => fetchBotDetails(bot.id)}
                          className="p-2 bg-botai-accent-blue hover:bg-botai-accent-green rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4 text-white" />
                        </button>
                        <button
                          onClick={() => handleEdit(bot)}
                          className="p-2 bg-botai-grey-light hover:bg-botai-grey-line rounded-lg transition-colors"
                          title="Edit Bot"
                        >
                          <Edit className="w-4 h-4 text-botai-dark" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(bot.id, bot.name)}
                          className="p-2 bg-red-100 hover:bg-red-200 rounded-lg transition-colors"
                          title="Delete Bot"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-botai-grey-bg border-t border-botai-grey-line">
            <div className="flex items-center justify-between">
              <p className="font-noto-sans text-botai-text">
                Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} bots
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-white border border-botai-grey-line rounded-lg font-noto-sans hover:bg-botai-grey-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-4 py-2 font-noto-sans text-botai-dark">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-white border border-botai-grey-line rounded-lg font-noto-sans hover:bg-botai-grey-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingBot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-space-grotesk font-bold text-2xl text-botai-dark">Edit Bot</h2>
              <button
                onClick={() => setEditingBot(null)}
                className="p-2 hover:bg-botai-grey-light rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block font-noto-sans font-semibold text-botai-dark mb-2">
                  Bot Name
                </label>
                <input
                  type="text"
                  value={editingBot.name || ''}
                  onChange={(e) => setEditingBot({ ...editingBot, name: e.target.value })}
                  className="w-full px-4 py-3 border border-botai-grey-line rounded-lg font-noto-sans focus:ring-2 focus:ring-botai-accent-green focus:border-transparent"
                />
              </div>

              <div>
                <label className="block font-noto-sans font-semibold text-botai-dark mb-2">
                  Description
                </label>
                <textarea
                  value={editingBot.description || ''}
                  onChange={(e) => setEditingBot({ ...editingBot, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-botai-grey-line rounded-lg font-noto-sans focus:ring-2 focus:ring-botai-accent-green focus:border-transparent"
                />
              </div>

              <div>
                <label className="block font-noto-sans font-semibold text-botai-dark mb-2">
                  Category
                </label>
                <select
                  value={editingBot.category || ''}
                  onChange={(e) => setEditingBot({ ...editingBot, category: e.target.value })}
                  className="w-full px-4 py-3 border border-botai-grey-line rounded-lg font-noto-sans focus:ring-2 focus:ring-botai-accent-green focus:border-transparent"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-noto-sans font-semibold text-botai-dark mb-2">
                  Price ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editingBot.price || 0}
                  onChange={(e) => setEditingBot({ ...editingBot, price: parseFloat(e.target.value) })}
                  className="w-full px-4 py-3 border border-botai-grey-line rounded-lg font-noto-sans focus:ring-2 focus:ring-botai-accent-green focus:border-transparent"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingBot.is_public || false}
                    onChange={(e) => setEditingBot({ ...editingBot, is_public: e.target.checked })}
                    className="w-5 h-5 text-botai-accent-green focus:ring-botai-accent-green rounded"
                  />
                  <span className="font-noto-sans font-semibold text-botai-dark">
                    Make bot public
                  </span>
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 px-6 py-3 bg-botai-black text-white rounded-lg font-noto-sans font-semibold hover:bg-botai-dark transition-colors flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  Save Changes
                </button>
                <button
                  onClick={() => setEditingBot(null)}
                  className="px-6 py-3 bg-botai-grey-light text-botai-dark rounded-lg font-noto-sans font-semibold hover:bg-botai-grey-line transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetails && selectedBot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-8">
            <div className="sticky top-0 bg-white rounded-t-2xl border-b border-botai-grey-line px-6 py-4 flex items-center justify-between">
              <h2 className="font-space-grotesk font-bold text-2xl text-botai-dark">Bot Details</h2>
              <button
                onClick={() => { setShowDetails(false); setSelectedBot(null); }}
                className="p-2 hover:bg-botai-grey-light rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[calc(90vh-80px)] overflow-y-auto">
              {/* Bot Info */}
              <div className="bg-botai-grey-bg rounded-xl p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-botai-accent-green to-botai-accent-blue flex items-center justify-center">
                    <Bot className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-space-grotesk font-bold text-xl text-botai-dark">
                          {selectedBot.name}
                        </h3>
                        <p className="font-noto-sans text-botai-text mt-1">
                          {selectedBot.description}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-noto-sans font-semibold ${
                        selectedBot.is_public
                          ? 'bg-botai-accent-green text-white'
                          : 'bg-botai-grey-light text-botai-dark'
                      }`}>
                        {selectedBot.is_public ? 'Public' : 'Private'}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 mt-3 text-sm">
                      <span className="font-noto-sans text-botai-text">
                        Category: <strong>{selectedBot.category}</strong>
                      </span>
                      <span className="font-noto-sans text-botai-text">
                        Price: <strong>${selectedBot.price}</strong>
                      </span>
                    </div>

                    <div className="mt-3 p-3 bg-white rounded-lg">
                      <p className="font-noto-sans text-sm text-botai-text">
                        <strong>Creator:</strong> {selectedBot.creator_name || 'Unknown'} ({selectedBot.creator_email})
                      </p>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div className="bg-white rounded-lg p-3">
                    <p className="font-noto-sans text-xs text-botai-text mb-1">Conversations</p>
                    <p className="font-space-grotesk font-bold text-xl text-botai-dark">
                      {selectedBot.stats?.total_conversations || 0}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <p className="font-noto-sans text-xs text-botai-text mb-1">Reviews</p>
                    <p className="font-space-grotesk font-bold text-xl text-botai-dark">
                      {selectedBot.stats?.total_reviews || 0}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <p className="font-noto-sans text-xs text-botai-text mb-1">Rating</p>
                    <p className="font-space-grotesk font-bold text-xl text-botai-dark">
                      ★ {(selectedBot.stats?.average_rating || 0).toFixed(1)}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <p className="font-noto-sans text-xs text-botai-text mb-1">Purchases</p>
                    <p className="font-space-grotesk font-bold text-xl text-botai-dark">
                      {selectedBot.stats?.total_purchases || 0}
                    </p>
                  </div>
                </div>
              </div>

              {/* AI Configuration */}
              <div className="bg-botai-grey-bg rounded-xl p-6">
                <h4 className="font-space-grotesk font-bold text-lg text-botai-dark mb-4">
                  AI Configuration
                </h4>
                <div className="space-y-3">
                  <div className="bg-white rounded-lg p-3">
                    <p className="font-noto-sans text-sm text-botai-text mb-1">Model</p>
                    <p className="font-noto-sans font-semibold text-botai-dark">{selectedBot.ai_model}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-3">
                      <p className="font-noto-sans text-sm text-botai-text mb-1">Temperature</p>
                      <p className="font-noto-sans font-semibold text-botai-dark">{selectedBot.temperature}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <p className="font-noto-sans text-sm text-botai-text mb-1">Max Tokens</p>
                      <p className="font-noto-sans font-semibold text-botai-dark">{selectedBot.max_tokens}</p>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <p className="font-noto-sans text-sm text-botai-text mb-2">System Prompt</p>
                    <p className="font-noto-sans text-sm text-botai-dark whitespace-pre-wrap">{selectedBot.system_prompt}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <p className="font-noto-sans text-sm text-botai-text mb-2">Welcome Message</p>
                    <p className="font-noto-sans text-sm text-botai-dark">{selectedBot.welcome_message}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.show}
        onClose={() => setDeleteConfirm({ show: false, botId: null, botName: '' })}
        onConfirm={handleDeleteConfirm}
        title="DELETE BOT"
        message={`Are you sure you want to delete "${deleteConfirm.botName}"? This action cannot be undone and will remove all associated data.`}
        confirmText="DELETE"
        cancelText="CANCEL"
        type="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
