import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Bot, Sparkles, User, Menu, X, Star, MessageSquare, DollarSign } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '@/lib/api';

const BOT_CATEGORIES = [
  'All',
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
}

const Header = () => {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <header className="absolute top-0 left-0 right-0 z-50 px-5 py-6">
        <nav className="max-w-7xl mx-auto flex items-center justify-between bg-botai-black/95 backdrop-blur-sm rounded-full px-6 lg:px-8 py-3 lg:py-4 shadow-xl">
          <Link to="/" className="text-white font-space-grotesk font-bold text-xl lg:text-2xl tracking-wide flex items-center gap-2">
            <Bot className="w-7 h-7" />
            BotAi
          </Link>

          <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
            <Link to="/marketplace" className="text-botai-accent-green font-space-grotesk font-medium text-sm uppercase tracking-wide">
              Marketplace
            </Link>
            <Link to="/about" className="text-white font-space-grotesk font-medium text-sm uppercase tracking-wide hover:text-botai-accent-green transition-colors">
              How It Works
            </Link>
            <Link to="/resources" className="text-white font-space-grotesk font-medium text-sm uppercase tracking-wide hover:text-botai-accent-green transition-colors">
              Resources
            </Link>
            <Link to="/contact" className="text-white font-space-grotesk font-medium text-sm uppercase tracking-wide hover:text-botai-accent-green transition-colors">
              Contact
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {user && (
              <Link to="/creator/bots" className="hidden md:flex items-center gap-2 text-white hover:text-botai-accent-green transition-colors">
                <Bot className="w-5 h-5" />
                <span className="font-space-grotesk font-medium text-sm uppercase tracking-wide">My Bots</span>
              </Link>
            )}

            {user ? (
              <div className="hidden md:flex items-center gap-3">
                <Link to="/account" className="text-white hover:text-botai-accent-green transition-colors">
                  <User className="w-6 h-6" />
                </Link>
                <button onClick={logout} className="text-white font-space-grotesk font-medium text-sm uppercase tracking-wide hover:text-botai-accent-green transition-colors">
                  Logout
                </button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-3">
                <Link to="/login" className="text-white font-space-grotesk font-medium text-sm uppercase tracking-wide hover:text-botai-accent-green transition-colors">
                  Login
                </Link>
                <Link to="/register" className="bg-botai-accent-green text-botai-dark px-4 py-2 rounded-full font-space-grotesk font-medium text-sm uppercase tracking-wide hover:bg-white transition-colors">
                  Sign Up
                </Link>
              </div>
            )}

            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden text-white">
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </nav>
      </header>

      {isMenuOpen && (
        <div className="fixed inset-0 z-40 bg-botai-black">
          <div className="flex flex-col items-center justify-center h-full space-y-8">
            <Link to="/marketplace" onClick={() => setIsMenuOpen(false)} className="text-botai-accent-green font-space-grotesk font-medium text-lg uppercase tracking-wide">
              Marketplace
            </Link>
            <Link to="/about" onClick={() => setIsMenuOpen(false)} className="text-white font-space-grotesk font-medium text-lg uppercase tracking-wide">
              How It Works
            </Link>
            <Link to="/resources" onClick={() => setIsMenuOpen(false)} className="text-white font-space-grotesk font-medium text-lg uppercase tracking-wide">
              Resources
            </Link>
            <Link to="/contact" onClick={() => setIsMenuOpen(false)} className="text-white font-space-grotesk font-medium text-lg uppercase tracking-wide">
              Contact
            </Link>
            {user && (
              <Link to="/creator/bots" onClick={() => setIsMenuOpen(false)} className="text-white font-space-grotesk font-medium text-lg uppercase tracking-wide">
                My Bots
              </Link>
            )}
            {user ? (
              <>
                <Link to="/account" onClick={() => setIsMenuOpen(false)} className="text-white font-space-grotesk font-medium text-lg uppercase tracking-wide">
                  Account
                </Link>
                <button onClick={() => { logout(); setIsMenuOpen(false); }} className="text-white font-space-grotesk font-medium text-lg uppercase tracking-wide">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setIsMenuOpen(false)} className="text-white font-space-grotesk font-medium text-lg uppercase tracking-wide">
                  Login
                </Link>
                <Link to="/register" onClick={() => setIsMenuOpen(false)} className="bg-botai-accent-green text-botai-dark px-6 py-3 rounded-full font-space-grotesk font-medium text-lg uppercase tracking-wide">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default function BotMarketplace() {
  const navigate = useNavigate();
  const [bots, setBots] = useState<Bot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchBots();
  }, [selectedCategory, activeTab]);

  const fetchBots = async () => {
    setLoading(true);
    setError('');

    try {
      const params: any = { page: 1, limit: 20 };

      if (selectedCategory !== 'All') {
        params.category = selectedCategory;
      }

      const response = await api.getMarketplaceBots(params);
      if (response.success && response.data) {
        const data = response.data as any;
        setBots(data.bots || []);
      } else {
        setError(response.error || 'Failed to load bots');
      }
    } catch (err: any) {
      setError('Failed to load bots');
    } finally {
      setLoading(false);
    }
  };

  const filteredBots = bots.filter((bot) => {
    const matchesSearch = bot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          bot.description.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === 'free') {
      return matchesSearch && bot.price === 0;
    } else if (activeTab === 'paid') {
      return matchesSearch && bot.price > 0;
    }

    return matchesSearch;
  });

  return (
    <div className="relative min-h-screen bg-botai-grey-bg">
      <Header />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-botai-black via-botai-dark to-botai-black pt-32 pb-16 px-5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-space-grotesk font-bold text-white mb-4">
              Bot Marketplace
            </h1>
            <p className="text-lg md:text-xl text-white/80 font-noto-sans max-w-3xl mx-auto">
              Discover and use AI-powered bots created by the community
            </p>
          </div>

          {/* Search and Filters */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-botai-text/40 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search bots by name or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-botai-text/20 focus:outline-none focus:ring-2 focus:ring-botai-accent-green font-noto-sans"
                />
              </div>

              {/* Category Filter & Tabs */}
              <div className="flex flex-col md:flex-row gap-4">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl border border-botai-text/20 focus:outline-none focus:ring-2 focus:ring-botai-accent-green font-noto-sans bg-white"
                >
                  {BOT_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>

                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveTab('all')}
                    className={`px-6 py-3 rounded-xl font-space-grotesk font-medium transition-all ${
                      activeTab === 'all'
                        ? 'bg-botai-dark text-white'
                        : 'bg-white border border-botai-text/20 text-botai-text hover:border-botai-accent-green'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setActiveTab('free')}
                    className={`px-6 py-3 rounded-xl font-space-grotesk font-medium transition-all ${
                      activeTab === 'free'
                        ? 'bg-botai-dark text-white'
                        : 'bg-white border border-botai-text/20 text-botai-text hover:border-botai-accent-green'
                    }`}
                  >
                    Free
                  </button>
                  <button
                    onClick={() => setActiveTab('paid')}
                    className={`px-6 py-3 rounded-xl font-space-grotesk font-medium transition-all ${
                      activeTab === 'paid'
                        ? 'bg-botai-dark text-white'
                        : 'bg-white border border-botai-text/20 text-botai-text hover:border-botai-accent-green'
                    }`}
                  >
                    Paid
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bots Grid Section */}
      <section className="py-16 px-5">
        <div className="max-w-7xl mx-auto">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8 rounded-lg">
              <p className="text-red-700 font-noto-sans">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl shadow-lg p-6 animate-pulse">
                  <div className="w-16 h-16 bg-botai-text/10 rounded-full mb-4" />
                  <div className="h-6 bg-botai-text/10 rounded mb-2" />
                  <div className="h-4 bg-botai-text/10 rounded mb-4" />
                  <div className="h-10 bg-botai-text/10 rounded" />
                </div>
              ))}
            </div>
          ) : filteredBots.length === 0 ? (
            <div className="text-center py-20">
              <Bot className="w-20 h-20 text-botai-text/20 mx-auto mb-4" />
              <p className="text-2xl font-space-grotesk font-bold text-botai-text mb-2">
                No bots found
              </p>
              <p className="text-botai-text/60 font-noto-sans">
                Try adjusting your search or filters
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredBots.map((bot) => (
                <div
                  key={bot.id}
                  onClick={() => navigate(`/bots/${bot.id}`)}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer group"
                >
                  <div className="p-6">
                    {/* Bot Avatar/Icon */}
                    <div className="w-16 h-16 bg-botai-dark rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Bot className="w-8 h-8 text-white" />
                    </div>

                    {/* Bot Info */}
                    <h3 className="text-xl font-space-grotesk font-bold text-botai-black mb-2  transition-colors">
                      {bot.name}
                    </h3>
                    <p className="text-botai-text/70 font-noto-sans text-sm mb-4 line-clamp-2">
                      {bot.description}
                    </p>

                    {/* Category Badge */}
                    <span className="inline-block px-3 py-1 bg-botai-grey-bg rounded-full text-xs font-space-grotesk font-medium text-botai-text mb-4">
                      {bot.category}
                    </span>

                    {/* Stats */}
                    <div className="flex items-center gap-4 mb-4 text-sm text-botai-text/60">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-botai-star text-botai-star" />
                        <span className="font-noto-sans">{bot.average_rating.toFixed(1)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" />
                        <span className="font-noto-sans">{bot.total_conversations}</span>
                      </div>
                    </div>

                    {/* Price & CTA */}
                    <div className="flex items-center justify-between pt-4 border-t border-botai-text/10">
                      <div>
                        {bot.price === 0 ? (
                          <span className="text-2xl font-space-grotesk font-bold text-botai-dark">
                            Free
                          </span>
                        ) : (
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-5 h-5 text-botai-text" />
                            <span className="text-2xl font-space-grotesk font-bold text-botai-text">
                              {bot.price}
                            </span>
                          </div>
                        )}
                      </div>
                      <button className="px-4 py-2 bg-botai-accent-green text-white rounded-full font-space-grotesk font-medium text-sm hover:bg-botai-black transition-colors">
                        View Bot
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

