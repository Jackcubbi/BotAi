import React, { useMemo, useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiClient } from '../lib/api';
import { hasAnyPermission } from '../lib/rbac';
import OrderDetails from '../components/account/OrderDetails';
import { OrderCardSkeleton } from '../components/shared/LoadingSkeletons';
import { getProductImage } from '../data/products';
import {
  User,
  Package,
  MapPin,
  Settings,
  LogOut,
  Edit,
  Eye,
  Calendar,
  CreditCard,
  ShoppingBag,
  Camera,
  Save,
  X,
  Trash2,
  Shield,
  Bot,
  MessageSquare,
  Archive,
  Send,
  AlertCircle,
  Heart,
  Pen,
  TrendingUp,
  DollarSign,
  Plus
} from 'lucide-react';

interface Order {
  id: number;
  date: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total: number;
  items?: any[];
}

export default function Account() {
  const { user, logout, updateProfile, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('overview');
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [profileImage, setProfileImage] = useState<string>('');
  const [orderToRemove, setOrderToRemove] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [myBots, setMyBots] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [earnings, setEarnings] = useState({ total: 0, thisMonth: 0, bots: [] });
  const [supportMessages, setSupportMessages] = useState<any[]>([]);
  const [supportConversation, setSupportConversation] = useState<any>(null);
  const [supportInput, setSupportInput] = useState('');
  const [supportLoading, setSupportLoading] = useState(false);
  const [supportSending, setSupportSending] = useState(false);
  const [supportError, setSupportError] = useState('');
  const [showSupportHistory, setShowSupportHistory] = useState(false);
  const [supportHistoryItems, setSupportHistoryItems] = useState<any[]>([]);
  const [selectedSupportHistoryId, setSelectedSupportHistoryId] = useState<number | null>(null);
  const [selectedSupportHistory, setSelectedSupportHistory] = useState<any>(null);
  const [supportHistoryMessages, setSupportHistoryMessages] = useState<any[]>([]);
  const [supportHistoryLoading, setSupportHistoryLoading] = useState(false);
  const [supportHistoryContinuing, setSupportHistoryContinuing] = useState(false);
  const [continuingSupportHistoryId, setContinuingSupportHistoryId] = useState<number | null>(null);
  const [supportBadgeCount, setSupportBadgeCount] = useState(0);
  const [botsLoading, setBotsLoading] = useState(false);
  const [purchasesLoading, setPurchasesLoading] = useState(false);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: {
      street: user?.address?.street || '',
      city: user?.address?.city || '',
      state: user?.address?.state || '',
      zipCode: user?.address?.zipCode || '',
      country: user?.address?.country || ''
    }
  });
  const [addressData, setAddressData] = useState({
    street: user?.address?.street || '',
    city: user?.address?.city || '',
    state: user?.address?.state || '',
    zipCode: user?.address?.zipCode || '',
    country: user?.address?.country || ''
  });

  // Sync profileData with user data when user becomes available
  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        address: {
          street: user.address?.street || '',
          city: user.address?.city || '',
          state: user.address?.state || '',
          zipCode: user.address?.zipCode || '',
          country: user.address?.country || ''
        }
      });
      setAddressData({
        street: user.address?.street || '',
        city: user.address?.city || '',
        state: user.address?.state || '',
        zipCode: user.address?.zipCode || '',
        country: user.address?.country || ''
      });

      // Load orders from API
      loadOrders();
      // Load favorites from localStorage
      const savedFavorites = JSON.parse(localStorage.getItem('botai_favorites') || '[]');
      setFavorites(savedFavorites);
    }
  }, [user]);

  const loadOrders = async () => {
    if (!user) return;

    setOrdersLoading(true);
    try {
      const response = await apiClient.getUserOrders();
      if (response.success && response.data) {
        const apiOrders = (response.data as any).orders || [];
        setOrders(apiOrders.map((order: any) => ({
          id: order.id,
          date: order.createdAt,
          status: order.status,
          total: order.totalAmount,
          items: order.items || []
        })));
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
      // Fallback to localStorage for backward compatibility
      const savedOrders = JSON.parse(localStorage.getItem('botai_orders') || '[]');
      setOrders(savedOrders);
    } finally {
      setOrdersLoading(false);
    }
  };

  const loadMyBots = async () => {
    if (!user) return;
    setBotsLoading(true);
    try {
      const response = await apiClient.getMyBots();
      if (response.success && response.data) {
        setMyBots((response.data as any).bots || []);
      }
    } catch (error) {
      console.error('Failed to load bots:', error);
    } finally {
      setBotsLoading(false);
    }
  };

  const loadPurchases = async () => {
    if (!user) return;
    setPurchasesLoading(true);
    try {
      const response = await apiClient.getMyPurchases();
      if (response.success && response.data) {
        setPurchases((response.data as any).purchases || []);
      }
    } catch (error) {
      console.error('Failed to load purchases:', error);
    } finally {
      setPurchasesLoading(false);
    }
  };

  const loadConversations = async () => {
    if (!user) return;
    setConversationsLoading(true);
    try {
      // For now, we'll need to get conversations from all user's bots
      // This is a placeholder - ideally the backend should have an endpoint for all user conversations
      const myBotsResponse = await apiClient.getMyBots();
      if (myBotsResponse.success && myBotsResponse.data) {
        const bots = (myBotsResponse.data as any).bots || [];
        const conversationResponses = await Promise.all(
          bots.map(async (bot: any) => {
            const convResponse = await apiClient.getBotConversations(bot.id);
            if (!convResponse.success || !convResponse.data) {
              return [];
            }

            const botConversations = (convResponse.data as any).conversations || [];
            return botConversations.map((conv: any) => ({
              ...conv,
              botName: bot.name,
              botId: bot.id,
            }));
          })
        );

        const allConversations = conversationResponses.flat();
        setConversations(allConversations);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setConversationsLoading(false);
    }
  };

  const calculateEarnings = async () => {
    if (!user) return;
    try {
      // Get all user's bots and their analytics
      const response = await apiClient.getMyBots();
      if (response.success && response.data) {
        const bots = (response.data as any).bots || [];
        const analyticsResults = await Promise.all(
          bots.map(async (bot: any) => {
            const analyticsResponse = await apiClient.getBotAnalytics(bot.id);
            if (!analyticsResponse.success || !analyticsResponse.data) {
              return null;
            }

            const analytics = analyticsResponse.data as any;
            const botEarnings = (analytics.total_purchases || 0) * (bot.price || 0);
            const thisMonthPurchases = analytics.purchases_this_month || 0;

            return {
              bot,
              botEarnings,
              thisMonthEarnings: thisMonthPurchases * (bot.price || 0),
              purchases: analytics.total_purchases || 0,
            };
          })
        );

        const successfulAnalytics = analyticsResults.filter(Boolean) as Array<{
          bot: any;
          botEarnings: number;
          thisMonthEarnings: number;
          purchases: number;
        }>;

        const totalEarnings = successfulAnalytics.reduce((sum, item) => sum + item.botEarnings, 0);
        const thisMonthEarnings = successfulAnalytics.reduce((sum, item) => sum + item.thisMonthEarnings, 0);
        const botsWithEarnings = successfulAnalytics.map((item) => ({
          ...item.bot,
          earnings: item.botEarnings,
          purchases: item.purchases,
        }));

        setEarnings({
          total: totalEarnings,
          thisMonth: thisMonthEarnings,
          bots: botsWithEarnings
        });
      }
    } catch (error) {
      console.error('Failed to calculate earnings:', error);
    }
  };

  // Load data when tabs are activated
  useEffect(() => {
    if (activeTab === 'my-bots' && myBots.length === 0) {
      loadMyBots();
    } else if (activeTab === 'purchases' && purchases.length === 0) {
      loadPurchases();
    } else if (activeTab === 'conversations' && conversations.length === 0) {
      loadConversations();
    } else if (activeTab === 'earnings' && earnings.total === 0) {
      calculateEarnings();
    }
  }, [activeTab]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');

    if (tab === 'help-center') {
      setActiveTab('help-center');
    }
  }, [location.search]);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!user) {
      navigate('/login');
      return;
    }
  }, [user, navigate, isLoading]);

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const loadSupportConversation = async (showLoader = false, markRead = false) => {
    if (!user) return;

    if (showLoader) {
      setSupportLoading(true);
    }

    const response = await apiClient.getMySupportConversation(markRead);
    if (response.success && response.data) {
      const conversation = (response.data as any).conversation;
      const messages = (response.data as any).messages || [];
      let unreadFromSupportCount = 0;

      if (conversation?.status === 'open') {
        const lastReadAt = conversation?.last_read_by_user_at ? new Date(conversation.last_read_by_user_at).getTime() : null;
        unreadFromSupportCount = messages.filter((message: any) => {
          if (message?.sender_role !== 'admin') return false;
          if (!lastReadAt) return true;
          const messageTime = message?.created_at ? new Date(message.created_at).getTime() : 0;
          return messageTime > lastReadAt;
        }).length;
      }

      setSupportConversation(conversation);
      setSupportMessages(messages);
      setSupportBadgeCount(activeTab !== 'help-center' ? unreadFromSupportCount : 0);
      setSupportError('');
    } else {
      setSupportError(response.error || 'Failed to load support chat');
    }

    if (showLoader) {
      setSupportLoading(false);
    }
  };

  const handleSupportSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportInput.trim()) return;

    setSupportSending(true);
    const response = await apiClient.sendMySupportMessage(supportInput.trim());

    if (response.success && response.data) {
      setSupportConversation((response.data as any).conversation);
      setSupportMessages((response.data as any).messages || []);
      setSupportInput('');
      setSupportError('');
    } else {
      setSupportError(response.error || 'Failed to send message');
    }

    setSupportSending(false);
  };

  const loadMySupportHistory = async () => {
    setSupportHistoryLoading(true);
    const response = await apiClient.getMySupportHistory({ page: 1, limit: 100 });
    if (response.success && response.data) {
      const items = (response.data as any).history || [];
      setSupportHistoryItems(items);

      if (items.length === 0) {
        setSelectedSupportHistoryId(null);
        setSelectedSupportHistory(null);
        setSupportHistoryMessages([]);
      } else if (!selectedSupportHistoryId || !items.find((item: any) => item.id === selectedSupportHistoryId)) {
        setSelectedSupportHistoryId(items[0].id);
        setSelectedSupportHistory(items[0]);
      } else {
        const current = items.find((item: any) => item.id === selectedSupportHistoryId);
        setSelectedSupportHistory(current || null);
      }

      setSupportError('');
    } else {
      setSupportError(response.error || 'Failed to load archived conversations');
    }
    setSupportHistoryLoading(false);
  };

  const loadMySupportHistoryMessages = async (historyId?: number | null) => {
    const targetHistoryId = historyId ?? selectedSupportHistoryId;
    if (!targetHistoryId) {
      setSupportHistoryMessages([]);
      return;
    }

    const response = await apiClient.getMySupportHistoryMessages(targetHistoryId);
    if (response.success && response.data) {
      setSelectedSupportHistory((response.data as any).history);
      setSupportHistoryMessages((response.data as any).messages || []);
      setSupportError('');
    } else {
      setSupportError(response.error || 'Failed to load archived messages');
    }
  };

  const continueFromSupportHistory = async (historyId: number) => {
    setSupportHistoryContinuing(true);
    setContinuingSupportHistoryId(historyId);
    const response = await apiClient.continueMySupportHistory(historyId);
    if (response.success && response.data) {
      setSupportConversation((response.data as any).conversation);
      setSupportMessages((response.data as any).messages || []);
      setShowSupportHistory(false);
      await loadMySupportHistory();
      setSupportError('');
    } else {
      setSupportError(response.error || 'Failed to continue conversation');
    }
    setContinuingSupportHistoryId(null);
    setSupportHistoryContinuing(false);
  };

  const handleSupportStatusToggle = async () => {
    if (!supportConversation?.id) return;

    const nextStatus = supportConversation.status === 'open' ? 'closed' : 'open';
    const response = await apiClient.updateMySupportConversationStatus(nextStatus);

    if (response.success && response.data) {
      const updatedConversation = (response.data as any).conversation;
      setSupportConversation(updatedConversation);
      if (nextStatus === 'closed') {
        setSupportMessages([]);
        setShowSupportHistory(true);
        await loadMySupportHistory();
      }
      setSupportError('');
    } else {
      setSupportError(response.error || 'Failed to update conversation status');
    }
  };

  const supportStatusBadge = useMemo(() => {
    if (!supportConversation?.id) {
      return {
        label: 'No Chat',
        className: 'bg-gray-100 text-gray-700 border border-gray-200',
      };
    }

    const isClosed = supportConversation?.status === 'closed';
    return {
      label: isClosed ? 'Closed' : 'Open',
      className: isClosed
        ? 'bg-red-100 text-red-700 border border-red-200'
        : 'bg-green-100 text-green-700 border border-green-200',
    };
  }, [supportConversation?.status]);

  useEffect(() => {
    if (!user || activeTab !== 'help-center') return;

    loadSupportConversation(true, true);
    const intervalId = window.setInterval(() => loadSupportConversation(false, true), 5000);
    return () => window.clearInterval(intervalId);
  }, [user, activeTab]);

  useEffect(() => {
    if (!user) return;
    if (activeTab === 'help-center') {
      setSupportBadgeCount(0);
      return;
    }

    loadSupportConversation(false, false);
    const intervalId = window.setInterval(() => loadSupportConversation(false, false), 5000);
    return () => window.clearInterval(intervalId);
  }, [user, activeTab]);

  useEffect(() => {
    if (!user || activeTab !== 'help-center' || !showSupportHistory) return;

    loadMySupportHistory();
  }, [user, activeTab, showSupportHistory]);

  useEffect(() => {
    if (!showSupportHistory || !selectedSupportHistoryId) return;
    loadMySupportHistoryMessages(selectedSupportHistoryId);
  }, [showSupportHistory, selectedSupportHistoryId]);

  const handleProfileUpdate = async () => {
    const updatedData = {
      ...profileData,
      profileImage: profileImage
    };
    const success = await updateProfile(updatedData);
    if (success) {
      setIsEditing(false);
      // Force component re-render to show updated user data
      setRefreshKey(prev => prev + 1);
    }
  };

  const handleLogoutConfirm = () => {
    logout();
    setShowLogoutModal(false);
  };

  const handleViewOrderDetails = (orderId: number) => {
    // Find the actual order from the orders array
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    // Create detailed order data with product images
    const productImages: { [key: string]: string } = {
      'Pink Suit Jacket': 'https://api.builder.io/api/v1/image/assets/TEMP/27c361a92078ded646e7bb081b2459444472a25c?width=420',
      'White Hoodie': 'https://api.builder.io/api/v1/image/assets/TEMP/1ba06dbe8aa77c8ba77e5d1c1941c7f4fe4a3451?width=420',
      'Blue Cowboy Hat': 'https://api.builder.io/api/v1/image/assets/TEMP/8c3f0a48b578cffaa1354efef81dcba2bc95fb00?width=420',
      'Black T-Shirt': 'https://api.builder.io/api/v1/image/assets/TEMP/8b8f4b1b38ac1a960b22545fd5b66d4f8ba8cb72?width=420',
      'Designer Leather Jacket': 'https://api.builder.io/api/v1/image/assets/TEMP/27c361a92078ded646e7bb081b2459444472a25c?width=420',
      'Premium Jeans': 'https://api.builder.io/api/v1/image/assets/TEMP/1ba06dbe8aa77c8ba77e5d1c1941c7f4fe4a3451?width=420',
      'Summer Dress': 'https://api.builder.io/api/v1/image/assets/TEMP/8c3f0a48b578cffaa1354efef81dcba2bc95fb00?width=420',
      'Canvas Sneakers': 'https://api.builder.io/api/v1/image/assets/TEMP/8b8f4b1b38ac1a960b22545fd5b66d4f8ba8cb72?width=420'
    };

    const detailedOrder = {
      ...order,
      items: order.items?.map(item => ({
        ...item,
        image: productImages[item.name] || 'https://api.builder.io/api/v1/image/assets/TEMP/27c361a92078ded646e7bb081b2459444472a25c?width=420'
      })) || [],
      shippingAddress: {
        name: `${user?.firstName} ${user?.lastName}`,
        street: user?.address?.street || '123 Main Street',
        city: user?.address?.city || 'New York',
        state: user?.address?.state || 'NY',
        zipCode: user?.address?.zipCode || '10001',
        country: user?.address?.country || 'United States'
      },
      billingAddress: {
        name: `${user?.firstName} ${user?.lastName}`,
        street: user?.address?.street || '123 Main Street',
        city: user?.address?.city || 'New York',
        state: user?.address?.state || 'NY',
        zipCode: user?.address?.zipCode || '10001',
        country: user?.address?.country || 'United States'
      },
      paymentMethod: {
        type: 'Visa',
        last4: '4242'
      }
    };
    setSelectedOrder(detailedOrder);
  };

  const handleSaveAddress = async () => {
    const updatedProfile = {
      ...profileData,
      address: addressData
    };
    const success = await updateProfile(updatedProfile);
    if (success) {
      setIsEditingAddress(false);
      setProfileData(updatedProfile);
    }
  };

  const handleProfileImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setProfileImage(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveOrder = (orderId: number) => {
    setOrderToRemove(orderId);
  };

  const confirmRemoveOrder = () => {
    if (orderToRemove) {
      // Remove order from localStorage
      const updatedOrders = orders.filter(order => order.id !== orderToRemove);
      localStorage.setItem('botai_orders', JSON.stringify(updatedOrders));

      // Update local state
      setOrders(updatedOrders);

      // Close modal
      setOrderToRemove(null);
    }
  };

  const cancelRemoveOrder = () => {
    setOrderToRemove(null);
  };

  const toggleFavorite = (botId: number) => {
    const currentFavorites = JSON.parse(localStorage.getItem('botai_favorites') || '[]');
    let updatedFavorites;

    if (currentFavorites.includes(botId)) {
      updatedFavorites = currentFavorites.filter((id: number) => id !== botId);
    } else {
      updatedFavorites = [...currentFavorites, botId];
    }

    localStorage.setItem('botai_favorites', JSON.stringify(updatedFavorites));
    setFavorites(updatedFavorites);
  };

  const isFavorite = (botId: number) => {
    return favorites.includes(botId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'orders', label: 'Orders', icon: Package },
    { id: 'my-bots', label: 'My Bots', icon: Bot },
    { id: 'purchases', label: 'Bot Purchases', icon: ShoppingBag },
    { id: 'conversations', label: 'Conversations', icon: MessageSquare },
    { id: 'help-center', label: 'Help Center', icon: MessageSquare },
    { id: 'favorites', label: 'Favorites', icon: Heart },
    { id: 'earnings', label: 'Earnings', icon: DollarSign },
    { id: 'profile', label: 'Profile', icon: Settings },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-botai-grey-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-botai-accent-green border-t-transparent"></div>
      </div>
    );
  }

  if (!user) return null;

  const canAccessAdminPanel = hasAnyPermission(user as any, [
    'admin.access',
    'analytics.read',
    'support.manage',
    'users.read',
    'bots.manage',
    'products.manage',
  ]);

  return (
    <div className="min-h-screen bg-botai-grey-bg">
      <div className="h-24"></div>

      <div className="max-w-7xl mx-auto px-5 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-space-grotesk font-bold text-4xl text-botai-dark uppercase tracking-wide mb-2">
            My Account
          </h1>
          <p className="font-noto-sans text-botai-text">
            Welcome back, {user.firstName}! Manage your account and view your orders.
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div key={`sidebar-${refreshKey}`} className="flex items-center gap-3 mb-6 pb-6 border-b">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-botai-accent-green flex items-center justify-center">
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-6 h-6 text-botai-dark" />
                  )}
                </div>
                <div>
                  <h3 className="font-space-grotesk font-bold text-botai-dark">
                    {user.firstName} {user.lastName}
                  </h3>
                  <p className="text-sm text-botai-text">{user.email}</p>
                </div>
              </div>

              {/* Admin Link */}
              {canAccessAdminPanel && (
                <div className="mb-4">
                  <button
                    onClick={() => navigate('/admin')}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <Shield className="w-5 h-5" />
                    <span className="font-space-grotesk font-semibold">Admin Panel</span>
                  </button>
                </div>
              )}

              {/* Creator Hub Link */}
              <div className="mb-4">
                <button
                  onClick={() => navigate('/creator/dashboard')}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-botai-accent-green to-botai-accent-blue text-botai-black hover:shadow-lg transition-all duration-200 shadow-md"
                >
                  <Pen className="w-5 h-5" />
                  <span className="font-space-grotesk font-semibold">Creator Hub</span>
                </button>
              </div>

              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-space-grotesk font-medium text-sm uppercase tracking-wide transition-colors ${
                        activeTab === tab.id
                          ? 'bg-botai-black text-white'
                          : 'text-botai-dark hover:bg-botai-grey-light'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="flex-1 text-left">{tab.label}</span>
                      {tab.id === 'help-center' && supportBadgeCount > 0 && (
                        <span className={`min-w-[20px] h-5 px-1 rounded-full text-[11px] font-bold flex items-center justify-center ${activeTab === tab.id ? 'bg-white text-botai-black' : 'bg-red-500 text-white'}`}>
                          {supportBadgeCount > 99 ? '99+' : supportBadgeCount}
                        </span>
                      )}
                    </button>
                  );
                })}
                <button
                  onClick={() => setShowLogoutModal(true)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-space-grotesk font-medium text-sm uppercase tracking-wide text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  Logout
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Quick Stats */}
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-botai-accent-green rounded-lg flex items-center justify-center">
                        <Package className="w-6 h-6 text-botai-dark" />
                      </div>
                      <div>
                        <h3 className="font-space-grotesk font-bold text-2xl text-botai-dark">
                          {orders.length}
                        </h3>
                        <p className="font-noto-sans text-botai-text uppercase text-sm">Total Orders</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-botai-accent-blue rounded-lg flex items-center justify-center">
                        <ShoppingBag className="w-6 h-6 text-botai-dark" />
                      </div>
                      <div>
                        <h3 className="font-space-grotesk font-bold text-2xl text-botai-dark">
                          ${orders.reduce((sum, order) => sum + order.total, 0).toFixed(2)}
                        </h3>
                        <p className="font-noto-sans text-botai-text uppercase text-sm">Total Spent</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-botai-accent-purple rounded-lg flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-botai-dark" />
                      </div>
                      <div>
                        <h3 className="font-space-grotesk font-bold text-2xl text-botai-dark">
                          {user.createdAt ? new Date(user.createdAt).getFullYear() : new Date().getFullYear()}
                        </h3>
                        <p className="font-noto-sans text-botai-text uppercase text-sm">Member Since</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Orders */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h2 className="font-space-grotesk font-bold text-xl text-botai-dark uppercase tracking-wide mb-6">
                    Recent Orders
                  </h2>
                  {ordersLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map(i => (
                        <OrderCardSkeleton key={i} />
                      ))}
                    </div>
                  ) : orders.length > 0 ? (
                    <div className="space-y-4">
                      {orders.slice(0, 3).map((order) => (
                        <div key={order.id} className="flex items-center justify-between p-4 border border-botai-grey-light rounded-lg">
                          <div>
                            <h3 className="font-space-grotesk font-bold text-botai-dark">
                              Order #{order.id}
                            </h3>
                            <p className="font-noto-sans text-sm text-botai-text">
                              {new Date(order.date).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                            <p className="font-space-grotesk font-bold text-botai-dark mt-1">
                              ${order.total.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Package className="w-16 h-16 text-botai-grey-line mx-auto mb-4" />
                      <h3 className="font-space-grotesk font-bold text-xl text-botai-dark mb-2">
                        No orders yet
                      </h3>
                      <p className="font-noto-sans text-botai-text mb-4">
                        Start shopping to see your orders here
                      </p>
                      <button
                        onClick={() => navigate('/shop')}
                        className="bg-botai-black text-white px-6 py-3 rounded-lg font-space-grotesk font-bold uppercase tracking-wide hover:bg-botai-dark transition-colors"
                      >
                        Start Shopping
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* My Bots Tab */}
            {activeTab === 'my-bots' && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-space-grotesk font-bold text-xl text-botai-dark uppercase tracking-wide">
                    My Bots
                  </h2>
                  <button
                    onClick={() => navigate('/creator/bots/create')}
                    className="flex items-center gap-2 px-4 py-2 bg-botai-accent-green text-botai-black rounded-lg font-space-grotesk font-medium hover:bg-botai-black hover:text-white transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Create New Bot
                  </button>
                </div>

                {botsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-botai-accent-green border-t-transparent"></div>
                  </div>
                ) : myBots.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-6">
                    {myBots.map((bot: any) => (
                      <div key={bot.id} className="border border-botai-grey-line rounded-2xl p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-start gap-4 mb-4">
                          <div className="w-12 h-12 bg-botai-accent-green rounded-lg flex items-center justify-center flex-shrink-0">
                            {bot.avatar_url ? (
                              <img src={bot.avatar_url} alt={bot.name} className="w-full h-full object-cover rounded-lg" />
                            ) : (
                              <Bot className="w-6 h-6 text-botai-black" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-space-grotesk font-bold text-botai-dark">{bot.name}</h3>
                            <p className="text-sm text-botai-text line-clamp-2">{bot.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mb-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                            bot.is_public ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {bot.is_public ? 'Public' : 'Private'}
                          </span>
                          <span className="font-space-grotesk font-bold text-botai-dark">
                            {bot.price > 0 ? `$${bot.price.toFixed(2)}` : 'Free'}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => navigate(`/creator/bots/${bot.id}/edit`)}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-botai-grey-line rounded-lg text-sm hover:bg-botai-grey-bg transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                            Edit
                          </button>
                          <button
                            onClick={() => navigate(`/bots/${bot.id}`)}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-botai-grey-line rounded-lg text-sm hover:bg-botai-grey-bg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </button>
                          <button
                            onClick={() => navigate(`/creator/bots/${bot.id}/analytics`)}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-botai-accent-blue text-botai-black rounded-lg text-sm hover:bg-botai-black hover:text-white transition-colors"
                          >
                            <TrendingUp className="w-4 h-4" />
                            Analytics
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Bot className="w-20 h-20 text-botai-grey-line mx-auto mb-4" />
                    <h3 className="font-space-grotesk font-bold text-2xl text-botai-dark mb-2">
                      No bots yet
                    </h3>
                    <p className="font-noto-sans text-botai-text mb-6">
                      Create your first AI bot and start earning
                    </p>
                    <button
                      onClick={() => navigate('/creator/bots/create')}
                      className="bg-botai-black text-white px-8 py-3 rounded-lg font-space-grotesk font-bold uppercase tracking-wide hover:bg-botai-dark transition-colors"
                    >
                      Create Your First Bot
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Bot Purchases Tab */}
            {activeTab === 'purchases' && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="font-space-grotesk font-bold text-xl text-botai-dark uppercase tracking-wide mb-6">
                  Bot Purchases
                </h2>

                {purchasesLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-botai-accent-green border-t-transparent"></div>
                  </div>
                ) : purchases.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-6">
                    {purchases.map((purchase: any) => (
                      <div key={purchase.id} className="border border-botai-grey-line rounded-2xl p-6">
                        <div className="flex items-start gap-4 mb-4">
                          <div className="w-12 h-12 bg-botai-accent-purple rounded-lg flex items-center justify-center flex-shrink-0">
                            <Bot className="w-6 h-6 text-botai-black" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-space-grotesk font-bold text-botai-dark">{purchase.bot?.name || 'Bot'}</h3>
                            <p className="text-sm text-botai-text">
                              Purchased on {new Date(purchase.purchased_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mb-4">
                          <span className="font-space-grotesk font-bold text-botai-dark">
                            ${purchase.price_paid?.toFixed(2) || '0.00'}
                          </span>
                        </div>
                        <button
                          onClick={() => navigate(`/bots/${purchase.bot_id}`)}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-botai-accent-green text-botai-black rounded-lg hover:bg-botai-black hover:text-white transition-colors"
                        >
                          <MessageSquare className="w-4 h-4" />
                          Chat with Bot
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <ShoppingBag className="w-20 h-20 text-botai-grey-line mx-auto mb-4" />
                    <h3 className="font-space-grotesk font-bold text-2xl text-botai-dark mb-2">
                      No purchases yet
                    </h3>
                    <p className="font-noto-sans text-botai-text mb-6">
                      Browse the marketplace to find amazing AI bots
                    </p>
                    <button
                      onClick={() => navigate('/marketplace')}
                      className="bg-botai-black text-white px-8 py-3 rounded-lg font-space-grotesk font-bold uppercase tracking-wide hover:bg-botai-dark transition-colors"
                    >
                      Browse Marketplace
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Conversations Tab */}
            {activeTab === 'conversations' && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="font-space-grotesk font-bold text-xl text-botai-dark uppercase tracking-wide mb-6">
                  Bot Conversations
                </h2>

                {conversationsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-botai-accent-green border-t-transparent"></div>
                  </div>
                ) : conversations.length > 0 ? (
                  <div className="space-y-4">
                    {conversations.map((conversation: any) => (
                      <div key={conversation.id} className="border border-botai-grey-line rounded-lg p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-botai-accent-blue rounded-lg flex items-center justify-center">
                              <MessageSquare className="w-5 h-5 text-botai-black" />
                            </div>
                            <div>
                              <h3 className="font-space-grotesk font-bold text-botai-dark">{conversation.botName}</h3>
                              <p className="text-sm text-botai-text">
                                {new Date(conversation.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => navigate(`/bots/${conversation.botId}?conversation=${conversation.id}`)}
                            className="px-4 py-2 bg-botai-accent-green text-botai-black rounded-lg hover:bg-botai-black hover:text-white transition-colors"
                          >
                            Continue Chat
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <MessageSquare className="w-20 h-20 text-botai-grey-line mx-auto mb-4" />
                    <h3 className="font-space-grotesk font-bold text-2xl text-botai-dark mb-2">
                      No conversations yet
                    </h3>
                    <p className="font-noto-sans text-botai-text mb-6">
                      Start chatting with bots to see your conversations here
                    </p>
                    <button
                      onClick={() => navigate('/marketplace')}
                      className="bg-botai-black text-white px-8 py-3 rounded-lg font-space-grotesk font-bold uppercase tracking-wide hover:bg-botai-dark transition-colors"
                    >
                      Explore Bots
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Favorites Tab */}
            {activeTab === 'favorites' && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="font-space-grotesk font-bold text-xl text-botai-dark uppercase tracking-wide mb-6">
                  Favorite Bots
                </h2>

                {favorites.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-6">
                    {favorites.map((botId: number) => (
                      <div key={botId} className="border border-botai-grey-line rounded-2xl p-6">
                        <div className="flex items-start gap-4 mb-4">
                          <div className="w-12 h-12 bg-botai-accent-purple rounded-lg flex items-center justify-center flex-shrink-0">
                            <Heart className="w-6 h-6 text-red-500 fill-red-500" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-space-grotesk font-bold text-botai-dark">Bot #{botId}</h3>
                            <p className="text-sm text-botai-text">Saved to favorites</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => navigate(`/bots/${botId}`)}
                            className="flex-1 px-4 py-2 bg-botai-accent-green text-botai-black rounded-lg hover:bg-botai-black hover:text-white transition-colors"
                          >
                            View Bot
                          </button>
                          <button
                            onClick={() => toggleFavorite(botId)}
                            className="px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Heart className="w-20 h-20 text-botai-grey-line mx-auto mb-4" />
                    <h3 className="font-space-grotesk font-bold text-2xl text-botai-dark mb-2">
                      No favorites yet
                    </h3>
                    <p className="font-noto-sans text-botai-text mb-6">
                      Add bots to your favorites to see them here
                    </p>
                    <button
                      onClick={() => navigate('/marketplace')}
                      className="bg-botai-black text-white px-8 py-3 rounded-lg font-space-grotesk font-bold uppercase tracking-wide hover:bg-botai-dark transition-colors"
                    >
                      Browse Marketplace
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Help Center Tab */}
            {activeTab === 'help-center' && (
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="px-6 py-4 border-b flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-botai-accent-blue/10 flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-botai-accent-blue" />
                    </div>
                    <div>
                      <p className="font-space-grotesk font-semibold text-botai-dark">Help Center Chat</p>
                      <p className="text-sm text-botai-text">Conversation ID: {supportConversation?.id || '-'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${supportStatusBadge.className}`}>
                      {supportStatusBadge.label}
                    </span>
                    {supportConversation?.id && !showSupportHistory && (
                      <button
                        type="button"
                        onClick={handleSupportStatusToggle}
                        className="px-3 py-1.5 rounded-lg border border-botai-grey-line text-sm text-botai-dark hover:border-botai-dark transition-colors"
                      >
                        Mark as {supportConversation.status === 'open' ? 'Closed' : 'Open'}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={async () => {
                        const next = !showSupportHistory;
                        setShowSupportHistory(next);
                        if (next) {
                          await loadMySupportHistory();
                        }
                      }}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-botai-grey-line text-sm text-botai-dark hover:border-botai-dark transition-colors"
                    >
                      <Archive className="w-4 h-4" />
                      {showSupportHistory ? 'Back to Active Chat' : 'Archived Story'}
                    </button>
                  </div>
                </div>

                {supportError && (
                  <div className="mx-6 mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">{supportError}</span>
                  </div>
                )}

                <div className="h-[420px] overflow-y-auto px-6 py-5 space-y-4 bg-botai-grey-bg/30">
                  {showSupportHistory ? (
                    supportHistoryLoading ? (
                      <div className="h-full flex items-center justify-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-4 border-botai-accent-green border-t-transparent"></div>
                      </div>
                    ) : supportHistoryItems.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-center text-botai-text">
                        <div>
                          <Archive className="w-10 h-10 mx-auto mb-3 text-botai-grey-line" />
                          <p>No archived conversations yet.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid md:grid-cols-2 gap-4 h-full">
                        <div className="space-y-2 overflow-y-auto max-h-[370px] pr-1">
                          {supportHistoryItems.map((item) => (
                            <div
                              key={item.id}
                              onClick={() => setSelectedSupportHistoryId(item.id)}
                              className={`w-full text-left p-3 rounded-lg border transition-colors cursor-pointer ${selectedSupportHistoryId === item.id ? 'border-botai-accent-green bg-botai-accent-green/10' : 'border-botai-grey-line hover:bg-botai-grey-bg/50'}`}
                            >
                              {(() => {
                                const isClosed = item.status === 'closed';
                                const statusLabel = isClosed ? 'Closed' : 'Opened';
                                const statusBadgeClass = isClosed
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-green-100 text-green-700';
                                return (
                                  <>
                              <div className="flex items-center justify-between gap-2">
                                <p className="font-space-grotesk font-semibold text-botai-dark">Archived Chat #{item.id}</p>
                              </div>
                              <div className="mt-1 flex items-center justify-between gap-2">
                                <p className="text-xs text-botai-text">Archived at: {item.closed_at || '-'}</p>
                                <div className="flex items-center gap-1.5">
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-botai-grey-bg text-botai-text">
                                    Archived
                                  </span>
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusBadgeClass}`}>
                                    {statusLabel}
                                  </span>
                                </div>
                              </div>
                              <p className="text-xs text-botai-text mt-1">Messages: {item.message_count || 0}</p>
                              {!isClosed && (
                                <div className="mt-2 flex justify-end">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      continueFromSupportHistory(item.id);
                                    }}
                                    disabled={supportHistoryContinuing}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-botai-dark text-white text-xs font-space-grotesk hover:bg-botai-black transition-colors disabled:opacity-60"
                                  >
                                    {continuingSupportHistoryId === item.id ? 'Continuing...' : 'Continue Chat'}
                                  </button>
                                </div>
                              )}
                                  </>
                                );
                              })()}
                            </div>
                          ))}
                        </div>

                        <div className="bg-white rounded-xl border border-botai-grey-line p-4 overflow-y-auto max-h-[370px]">
                          <div className="flex items-center justify-between mb-4 gap-3">
                            <h3 className="font-space-grotesk font-semibold text-botai-dark">
                              {selectedSupportHistory ? `Story #${selectedSupportHistory.id}` : 'Select story'}
                            </h3>
                            {selectedSupportHistoryId && selectedSupportHistory?.status !== 'closed' && (
                              <span className="text-xs text-botai-text">Use Continue Chat on the selected card</span>
                            )}
                          </div>

                          {supportHistoryMessages.length === 0 ? (
                            <p className="text-sm text-botai-text">No archived messages.</p>
                          ) : (
                            <div className="space-y-3">
                              {supportHistoryMessages.map((message) => {
                                const isAdmin = message.sender_role === 'admin';
                                return (
                                  <div key={message.id} className={`flex ${isAdmin ? 'justify-start' : 'justify-end'}`}>
                                    <div className={`max-w-[90%] rounded-xl px-3 py-2 ${isAdmin ? 'bg-white border border-botai-grey-line' : 'bg-botai-dark text-white'}`}>
                                      <p className={`text-xs font-semibold mb-1 ${isAdmin ? 'text-botai-dark' : 'text-white'}`}>
                                        {isAdmin ? 'Support' : 'You'}
                                      </p>
                                      <p className={`text-sm ${isAdmin ? 'text-botai-dark' : 'text-white'}`}>{message.message}</p>
                                      <p className={`text-[11px] mt-1 ${isAdmin ? 'text-botai-text' : 'text-white/75'}`}>{message.created_at}</p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  ) : supportLoading ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="animate-spin rounded-full h-10 w-10 border-4 border-botai-accent-green border-t-transparent"></div>
                    </div>
                  ) : supportMessages.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-center text-botai-text">
                      <div>
                        <MessageSquare className="w-10 h-10 mx-auto mb-3 text-botai-grey-line" />
                        <p>No messages yet.</p>
                        <p className="text-sm">Send your first message to support.</p>
                      </div>
                    </div>
                  ) : (
                    supportMessages.map((message) => {
                      const isAdmin = message.sender_role === 'admin';
                      return (
                        <div key={message.id} className={`flex ${isAdmin ? 'justify-start' : 'justify-end'}`}>
                          <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${isAdmin ? 'bg-white border border-botai-grey-line' : 'bg-botai-dark text-white'}`}>
                            <div className="flex items-center gap-2 mb-1">
                              {isAdmin ? <Shield className="w-4 h-4 text-botai-accent-green" /> : <User className="w-4 h-4" />}
                              <span className="text-xs font-semibold uppercase tracking-wide">
                                {isAdmin ? 'Support' : 'You'}
                              </span>
                            </div>
                            <p className={`font-noto-sans text-sm ${isAdmin ? 'text-botai-dark' : 'text-white'}`}>
                              {message.message}
                            </p>
                            <p className={`text-[11px] mt-2 ${isAdmin ? 'text-botai-text' : 'text-white/75'}`}>
                              {message.created_at}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <form onSubmit={handleSupportSend} className="p-4 border-t flex items-center gap-3">
                  <input
                    type="text"
                    value={supportInput}
                    onChange={(e) => setSupportInput(e.target.value)}
                    placeholder={showSupportHistory ? 'Archived story is read-only' : 'Type your message to support...'}
                    className="flex-1 px-4 py-3 rounded-xl border border-botai-grey-line focus:outline-none focus:ring-2 focus:ring-botai-accent-green"
                    disabled={showSupportHistory || supportSending || supportConversation?.status === 'closed'}
                  />
                  <button
                    type="submit"
                    disabled={showSupportHistory || supportSending || !supportInput.trim() || supportConversation?.status === 'closed'}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-botai-dark text-white font-space-grotesk font-semibold hover:bg-botai-black transition-colors disabled:opacity-60"
                  >
                    <Send className="w-4 h-4" />
                    Send
                  </button>
                </form>
              </div>
            )}

            {/* Earnings Tab */}
            {activeTab === 'earnings' && (
              <div className="space-y-6">
                {/* Earnings Stats */}
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-botai-accent-green rounded-lg flex items-center justify-center">
                        <DollarSign className="w-6 h-6 text-botai-black" />
                      </div>
                      <div>
                        <h3 className="font-space-grotesk font-bold text-2xl text-botai-dark">
                          ${earnings.total.toFixed(2)}
                        </h3>
                        <p className="font-noto-sans text-botai-text uppercase text-sm">Total Earnings</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-botai-accent-blue rounded-lg flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-botai-black" />
                      </div>
                      <div>
                        <h3 className="font-space-grotesk font-bold text-2xl text-botai-dark">
                          ${earnings.thisMonth.toFixed(2)}
                        </h3>
                        <p className="font-noto-sans text-botai-text uppercase text-sm">This Month</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-botai-accent-purple rounded-lg flex items-center justify-center">
                        <Bot className="w-6 h-6 text-botai-black" />
                      </div>
                      <div>
                        <h3 className="font-space-grotesk font-bold text-2xl text-botai-dark">
                          {myBots.length}
                        </h3>
                        <p className="font-noto-sans text-botai-text uppercase text-sm">Active Bots</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Earnings by Bot */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h2 className="font-space-grotesk font-bold text-xl text-botai-dark uppercase tracking-wide mb-6">
                    Earnings by Bot
                  </h2>

                  {earnings.bots.length > 0 ? (
                    <div className="space-y-4">
                      {earnings.bots.map((bot: any) => (
                        <div key={bot.id} className="flex items-center justify-between p-4 border border-botai-grey-line rounded-lg">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-botai-accent-green rounded-lg flex items-center justify-center">
                              <Bot className="w-5 h-5 text-botai-black" />
                            </div>
                            <div>
                              <h3 className="font-space-grotesk font-bold text-botai-dark">{bot.name}</h3>
                              <p className="text-sm text-botai-text">{bot.purchases} purchases</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-space-grotesk font-bold text-botai-dark">
                              ${bot.earnings.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <DollarSign className="w-16 h-16 text-botai-grey-line mx-auto mb-4" />
                      <p className="font-noto-sans text-botai-text">No earnings yet. Create and publish bots to start earning!</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="font-space-grotesk font-bold text-xl text-botai-dark uppercase tracking-wide mb-6">
                  Order History
                </h2>
                {ordersLoading ? (
                  <div className="space-y-6">
                    {[1, 2, 3, 4].map(i => (
                      <OrderCardSkeleton key={i} />
                    ))}
                  </div>
                ) : orders.length > 0 ? (
                  <div className="space-y-6">
                    {orders.map((order) => (
                      <div key={order.id} className="border border-botai-grey-light rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="font-space-grotesk font-bold text-botai-dark">
                              Order #{order.id}
                            </h3>
                            <p className="font-noto-sans text-sm text-botai-text">
                              Placed on {new Date(order.date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                            <p className="font-space-grotesk font-bold text-botai-dark mt-1">
                              ${order.total.toFixed(2)}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-4">
                          <button
                            onClick={() => handleViewOrderDetails(order.id)}
                            className="flex items-center gap-2 px-4 py-2 border border-botai-grey-line rounded-lg font-noto-sans text-sm hover:bg-botai-grey-light transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            View Details
                          </button>
                          {order.status === 'delivered' && (
                            <button className="flex items-center gap-2 px-4 py-2 border border-botai-grey-line rounded-lg font-noto-sans text-sm hover:bg-botai-grey-light transition-colors">
                              Reorder
                            </button>
                          )}
                          <button
                            onClick={() => handleRemoveOrder(order.id)}
                            className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg font-noto-sans text-sm hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Package className="w-20 h-20 text-botai-grey-line mx-auto mb-4" />
                    <h3 className="font-space-grotesk font-bold text-2xl text-botai-dark mb-2">
                      No orders found
                    </h3>
                    <p className="font-noto-sans text-botai-text mb-6">
                      You haven't placed any orders yet. Start shopping to see your order history here.
                    </p>
                    <button
                      onClick={() => navigate('/shop')}
                      className="bg-botai-black text-white px-8 py-3 rounded-lg font-space-grotesk font-bold uppercase tracking-wide hover:bg-botai-dark transition-colors"
                    >
                      Start Shopping
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-space-grotesk font-bold text-xl text-botai-dark uppercase tracking-wide">
                    Profile Information
                  </h2>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="flex items-center gap-2 px-4 py-2 border border-botai-grey-line rounded-lg font-noto-sans text-sm hover:bg-botai-grey-light transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    {isEditing ? 'Cancel' : 'Edit'}
                  </button>
                </div>

                {/* Profile Image Section */}
                <div className="mb-8">
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full overflow-hidden bg-botai-grey-bg border-4 border-white shadow-lg">
                        {profileImage ? (
                          <img
                            src={profileImage}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-botai-accent-green flex items-center justify-center">
                            <User className="w-12 h-12 text-botai-dark" />
                          </div>
                        )}
                      </div>
                      {isEditing && (
                        <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-botai-black rounded-full flex items-center justify-center cursor-pointer hover:bg-botai-dark transition-colors">
                          <Camera className="w-4 h-4 text-white" />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleProfileImageChange}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                    <div key={`profile-header-${refreshKey}`}>
                      <h3 className="font-space-grotesk font-bold text-xl text-botai-dark">
                        {user.firstName} {user.lastName}
                      </h3>
                      <p className="font-noto-sans text-botai-text">{user.email}</p>
                      {isEditing && (
                        <p className="font-noto-sans text-sm text-botai-text mt-2">
                          Click the camera icon to upload a new profile picture
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block font-space-grotesk font-medium text-botai-dark uppercase tracking-wide text-sm mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={profileData.firstName}
                      onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 border border-botai-grey-line rounded-lg font-noto-sans focus:ring-2 focus:ring-botai-accent-green focus:border-transparent disabled:bg-botai-grey-bg"
                    />
                  </div>

                  <div>
                    <label className="block font-space-grotesk font-medium text-botai-dark uppercase tracking-wide text-sm mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={profileData.lastName}
                      onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 border border-botai-grey-line rounded-lg font-noto-sans focus:ring-2 focus:ring-botai-accent-green focus:border-transparent disabled:bg-botai-grey-bg"
                    />
                  </div>

                  <div>
                    <label className="block font-space-grotesk font-medium text-botai-dark uppercase tracking-wide text-sm mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 border border-botai-grey-line rounded-lg font-noto-sans focus:ring-2 focus:ring-botai-accent-green focus:border-transparent disabled:bg-botai-grey-bg"
                    />
                  </div>

                  <div>
                    <label className="block font-space-grotesk font-medium text-botai-dark uppercase tracking-wide text-sm mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 border border-botai-grey-line rounded-lg font-noto-sans focus:ring-2 focus:ring-botai-accent-green focus:border-transparent disabled:bg-botai-grey-bg"
                    />
                  </div>
                </div>

                {isEditing && (
                  <div className="flex gap-4 mt-6">
                    <button
                      onClick={handleProfileUpdate}
                      disabled={isLoading}
                      className="bg-botai-black text-white px-6 py-3 rounded-lg font-space-grotesk font-bold uppercase tracking-wide hover:bg-botai-dark transition-colors disabled:opacity-50"
                    >
                      {isLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="border border-botai-grey-line text-botai-dark px-6 py-3 rounded-lg font-space-grotesk font-bold uppercase tracking-wide hover:bg-botai-grey-light transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Addresses Tab */}
            {activeTab === 'addresses' && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-space-grotesk font-bold text-xl text-botai-dark uppercase tracking-wide">
                    Saved Addresses
                  </h2>
                  {!isEditingAddress && user.address && (
                    <button
                      onClick={() => setIsEditingAddress(true)}
                      className="flex items-center gap-2 px-4 py-2 border border-botai-grey-line rounded-lg font-noto-sans text-sm hover:bg-botai-grey-light transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      Edit Address
                    </button>
                  )}
                </div>

                {user.address || isEditingAddress ? (
                  <div className="border border-botai-grey-line rounded-lg p-6">
                    {!isEditingAddress ? (
                      <div>
                        <h3 className="font-space-grotesk font-bold text-botai-dark mb-4">Default Address</h3>
                        <div className="text-botai-text space-y-2">
                          <p>{user.address?.street}</p>
                          <p>{user.address?.city}, {user.address?.state} {user.address?.zipCode}</p>
                          <p>{user.address?.country}</p>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <h3 className="font-space-grotesk font-bold text-botai-dark mb-6">
                          {user.address ? 'Edit Address' : 'Add New Address'}
                        </h3>
                        <div className="grid gap-6">
                          <div>
                            <label className="block font-space-grotesk font-medium text-botai-dark uppercase tracking-wide text-sm mb-2">
                              Street Address
                            </label>
                            <input
                              type="text"
                              value={addressData.street}
                              onChange={(e) => setAddressData(prev => ({ ...prev, street: e.target.value }))}
                              className="w-full px-4 py-3 border border-botai-grey-line rounded-lg font-noto-sans focus:ring-2 focus:ring-botai-accent-green focus:border-transparent"
                              placeholder="Enter your street address"
                            />
                          </div>

                          <div className="grid md:grid-cols-2 gap-6">
                            <div>
                              <label className="block font-space-grotesk font-medium text-botai-dark uppercase tracking-wide text-sm mb-2">
                                City
                              </label>
                              <input
                                type="text"
                                value={addressData.city}
                                onChange={(e) => setAddressData(prev => ({ ...prev, city: e.target.value }))}
                                className="w-full px-4 py-3 border border-botai-grey-line rounded-lg font-noto-sans focus:ring-2 focus:ring-botai-accent-green focus:border-transparent"
                                placeholder="Enter city"
                              />
                            </div>

                            <div>
                              <label className="block font-space-grotesk font-medium text-botai-dark uppercase tracking-wide text-sm mb-2">
                                State
                              </label>
                              <input
                                type="text"
                                value={addressData.state}
                                onChange={(e) => setAddressData(prev => ({ ...prev, state: e.target.value }))}
                                className="w-full px-4 py-3 border border-botai-grey-line rounded-lg font-noto-sans focus:ring-2 focus:ring-botai-accent-green focus:border-transparent"
                                placeholder="Enter state"
                              />
                            </div>
                          </div>

                          <div className="grid md:grid-cols-2 gap-6">
                            <div>
                              <label className="block font-space-grotesk font-medium text-botai-dark uppercase tracking-wide text-sm mb-2">
                                ZIP Code
                              </label>
                              <input
                                type="text"
                                value={addressData.zipCode}
                                onChange={(e) => setAddressData(prev => ({ ...prev, zipCode: e.target.value }))}
                                className="w-full px-4 py-3 border border-botai-grey-line rounded-lg font-noto-sans focus:ring-2 focus:ring-botai-accent-green focus:border-transparent"
                                placeholder="Enter ZIP code"
                              />
                            </div>

                            <div>
                              <label className="block font-space-grotesk font-medium text-botai-dark uppercase tracking-wide text-sm mb-2">
                                Country
                              </label>
                              <input
                                type="text"
                                value={addressData.country}
                                onChange={(e) => setAddressData(prev => ({ ...prev, country: e.target.value }))}
                                className="w-full px-4 py-3 border border-botai-grey-line rounded-lg font-noto-sans focus:ring-2 focus:ring-botai-accent-green focus:border-transparent"
                                placeholder="Enter country"
                              />
                            </div>
                          </div>

                          <div className="flex gap-4 pt-4">
                            <button
                              onClick={handleSaveAddress}
                              disabled={isLoading}
                              className="flex items-center gap-2 bg-botai-black text-white px-6 py-3 rounded-lg font-space-grotesk font-bold uppercase tracking-wide hover:bg-botai-dark transition-colors disabled:opacity-50"
                            >
                              <Save className="w-4 h-4" />
                              {isLoading ? 'Saving...' : 'Save Address'}
                            </button>
                            <button
                              onClick={() => {
                                setIsEditingAddress(false);
                                setAddressData({
                                  street: user?.address?.street || '',
                                  city: user?.address?.city || '',
                                  state: user?.address?.state || '',
                                  zipCode: user?.address?.zipCode || '',
                                  country: user?.address?.country || ''
                                });
                              }}
                              className="flex items-center gap-2 border border-botai-grey-line text-botai-dark px-6 py-3 rounded-lg font-space-grotesk font-bold uppercase tracking-wide hover:bg-botai-grey-light transition-colors"
                            >
                              <X className="w-4 h-4" />
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <MapPin className="w-20 h-20 text-botai-grey-line mx-auto mb-4" />
                    <h3 className="font-space-grotesk font-bold text-2xl text-botai-dark mb-2">
                      No addresses saved
                    </h3>
                    <p className="font-noto-sans text-botai-text mb-6">
                      Add an address to make checkout faster
                    </p>
                    <button
                      onClick={() => setIsEditingAddress(true)}
                      className="bg-botai-black text-white px-6 py-3 rounded-lg font-space-grotesk font-bold uppercase tracking-wide hover:bg-botai-dark transition-colors"
                    >
                      Add Address
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Logout Verification Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowLogoutModal(false)}
          ></div>

          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl p-8 mx-4 max-w-md w-full">
            <div className="text-center">
              {/* Icon */}
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <LogOut className="w-8 h-8 text-red-600" />
              </div>

              {/* Title */}
              <h3 className="font-space-grotesk font-bold text-2xl text-botai-dark uppercase tracking-wide mb-4">
                Confirm Logout
              </h3>

              {/* Message */}
              <p className="font-noto-sans text-botai-text mb-8 leading-relaxed">
                Are you sure you want to logout? You'll need to sign in again to access your account.
              </p>

              {/* Actions */}
              <div className="flex gap-4">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 px-6 py-3 border-2 border-botai-grey-line text-botai-dark rounded-lg font-space-grotesk font-bold uppercase tracking-wide hover:bg-botai-grey-light transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogoutConfirm}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-space-grotesk font-bold uppercase tracking-wide hover:bg-red-700 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <OrderDetails
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}

      {/* Remove Order Confirmation Modal */}
      {orderToRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={cancelRemoveOrder}
          ></div>

          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl p-8 mx-4 max-w-md w-full">
            <div className="text-center">
              {/* Icon */}
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>

              {/* Title */}
              <h3 className="font-space-grotesk font-bold text-2xl text-botai-dark uppercase tracking-wide mb-4">
                Remove Order
              </h3>

              {/* Message */}
              <p className="font-noto-sans text-botai-text mb-8 leading-relaxed">
                Are you sure you want to remove order <strong>#{orderToRemove}</strong>? This action cannot be undone and will permanently delete the order from your history.
              </p>

              {/* Actions */}
              <div className="flex gap-4">
                <button
                  onClick={cancelRemoveOrder}
                  className="flex-1 px-6 py-3 border-2 border-botai-grey-line text-botai-dark rounded-lg font-space-grotesk font-bold uppercase tracking-wide hover:bg-botai-grey-light transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmRemoveOrder}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-space-grotesk font-bold uppercase tracking-wide hover:bg-red-700 transition-colors"
                >
                  Remove Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

