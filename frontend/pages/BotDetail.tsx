import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Star, MessageSquare, DollarSign, Bot, ArrowLeft, Sparkles, User, Menu, X } from 'lucide-react';
import BotChat from '@/components/bot/BotChat';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface BotData {
  id: number;
  name: string;
  description: string;
  category: string;
  price: number;
  avatar_url?: string;
  welcome_message?: string;
  ai_model: string;
  output_mode?: 'text' | 'image' | 'audio' | 'video';
  temperature: number;
  max_tokens: number;
  average_rating: number;
  total_reviews: number;
  total_conversations: number;
  creator_id: number;
  is_public: boolean;
}

interface Review {
  id: number;
  user_id: number;
  rating: number;
  comment: string;
  full_name: string;
  created_at: string;
}

const Header = () => {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 px-5 transition-all duration-300 ${isScrolled ? 'py-3' : 'py-6'}`}>
        <nav className={`max-w-7xl mx-auto flex items-center justify-between bg-botai-black/95 backdrop-blur-sm rounded-full px-6 lg:px-8 shadow-xl transition-all duration-300 ${isScrolled ? 'py-2 lg:py-3' : 'py-3 lg:py-4'}`}>
          <Link to="/" className="text-white font-space-grotesk font-bold text-xl lg:text-2xl tracking-wide flex items-center gap-2">
            <Bot className="w-7 h-7" />
            BotAi
          </Link>

          <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
            <Link to="/marketplace" className="text-white font-space-grotesk font-medium text-sm uppercase tracking-wide hover:text-botai-accent-green transition-colors">
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
                <Sparkles className="w-5 h-5" />
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
            <Link to="/marketplace" onClick={() => setIsMenuOpen(false)} className="text-white font-space-grotesk font-medium text-lg uppercase tracking-wide">
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

export default function BotDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'chat' | 'reviews'>('chat');

  const [bot, setBot] = useState<BotData | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [purchasing, setPurchasing] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);

  useEffect(() => {
    if (id) {
      fetchBotDetails();
      fetchReviews();
    }
  }, [id]);

  const fetchBotDetails = async () => {
    try {
      const response = await api.getBot(Number(id));
      if (response.success && response.data) {
        setBot(response.data as BotData);
      } else {
        setError(response.error || 'Failed to load bot');
      }
    } catch (err: any) {
      setError('Failed to load bot');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await api.getBotReviews(Number(id));
      if (response.success && response.data) {
        setReviews(response.data as Review[]);
      }
    } catch (err) {
      console.error('Failed to load reviews:', err);
    }
  };

  const handlePurchase = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setPurchasing(true);
    try {
      const response = await api.purchaseBot(Number(id));
      if (response.success) {
        setHasPurchased(true);
        alert('Bot purchased successfully!');
      } else {
        alert(response.error || 'Failed to purchase bot');
      }
    } catch (err: any) {
      alert('Failed to purchase bot');
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="relative min-h-screen bg-botai-grey-bg">
        <Header />
        <div className="pt-32 px-5">
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse space-y-8">
              <div className="h-12 bg-white/50 rounded-2xl w-1/3" />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="h-96 bg-white/50 rounded-2xl" />
                <div className="lg:col-span-2 h-96 bg-white/50 rounded-2xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !bot) {
    return (
      <div className="relative min-h-screen bg-botai-grey-bg">
        <Header />
        <div className="pt-32 px-5">
          <div className="max-w-7xl mx-auto">
            <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-2xl">
              <p className="text-red-700 font-noto-sans">{error || 'Bot not found'}</p>
              <button
                onClick={() => navigate('/marketplace')}
                className="mt-4 px-6 py-2 bg-botai-accent-green text-white rounded-full font-space-grotesk font-medium hover:bg-botai-black transition-colors"
              >
                Back to Marketplace
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const canUseBot = !!user && (bot.is_public || bot.price === 0 || hasPurchased || bot.creator_id === user.id);

  return (
    <div className="relative min-h-screen bg-botai-grey-bg">
      <Header />

      <div className="pt-32 pb-16 px-5">
        <div className="max-w-7xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => navigate('/marketplace')}
            className="flex items-center gap-2 text-botai-text hover:text-botai-accent-green transition-colors font-space-grotesk font-medium mb-8"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Marketplace
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Bot Info */}
            <div className="lg:col-span-1 space-y-6">
              {/* Main Bot Card */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                {/* Bot Avatar & Title */}
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-botai-accent-green to-botai-accent-blue rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h1 className="text-2xl font-space-grotesk font-bold text-botai-black mb-2">
                      {bot.name}
                    </h1>
                    <span className="inline-block px-3 py-1 bg-botai-grey-bg rounded-full text-xs font-space-grotesk font-medium text-botai-text">
                      {bot.category}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-botai-text/70 font-noto-sans mb-6">
                  {bot.description}
                </p>

                {/* Stats */}
                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between pb-3 border-b border-botai-text/10">
                    <span className="text-sm font-noto-sans text-botai-text/60">Rating</span>
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 fill-botai-star text-botai-star" />
                      <span className="font-space-grotesk font-bold text-botai-text">
                        {bot.average_rating > 0 ? bot.average_rating.toFixed(1) : 'New'}
                      </span>
                      {bot.total_reviews > 0 && (
                        <span className="text-sm font-noto-sans text-botai-text/60">
                          ({bot.total_reviews})
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pb-3 border-b border-botai-text/10">
                    <span className="text-sm font-noto-sans text-botai-text/60">Conversations</span>
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-botai-accent-blue" />
                      <span className="font-space-grotesk font-bold text-botai-text">
                        {bot.total_conversations}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-noto-sans text-botai-text/60">AI Model</span>
                    <span className="font-space-grotesk font-medium text-botai-text text-sm">
                      {bot.ai_model}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-noto-sans text-botai-text/60">Output Mode</span>
                    <span className="font-space-grotesk font-medium text-botai-text text-sm capitalize">
                      {bot.output_mode || 'text'}
                    </span>
                  </div>
                </div>

                {/* Price & Purchase */}
                <div className="pt-6 border-t border-botai-text/10">
                  {bot.price > 0 ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="font-space-grotesk font-medium text-botai-text">Price</span>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-6 h-6 text-botai-accent-green" />
                          <span className="text-3xl font-space-grotesk font-bold text-botai-accent-green">
                            {bot.price.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      {!canUseBot && user && (
                        <button
                          onClick={handlePurchase}
                          disabled={purchasing}
                          className="w-full px-6 py-3 bg-botai-accent-green text-white rounded-full font-space-grotesk font-medium hover:bg-botai-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {purchasing ? 'Processing...' : 'Purchase Bot'}
                        </button>
                      )}
                      {!canUseBot && !user && (
                        <button
                          onClick={() => navigate('/login')}
                          className="w-full px-6 py-3 bg-botai-accent-green text-white rounded-full font-space-grotesk font-medium hover:bg-botai-black transition-colors"
                        >
                          Login to Purchase
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-3 px-6 bg-botai-accent-green/10 rounded-full">
                      <span className="text-2xl font-space-grotesk font-bold text-botai-accent-green">
                        Free
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Technical Details Card */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-space-grotesk font-bold text-botai-black mb-4">
                  Technical Details
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-noto-sans text-botai-text/60">Temperature</span>
                    <span className="font-space-grotesk font-medium text-botai-text">
                      {bot.temperature}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-noto-sans text-botai-text/60">Max Tokens</span>
                    <span className="font-space-grotesk font-medium text-botai-text">
                      {bot.max_tokens}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Chat & Reviews */}
            <div className="lg:col-span-2">
              {/* Tabs */}
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="flex border-b border-botai-text/10">
                  <button
                    onClick={() => setActiveTab('chat')}
                    className={`flex-1 px-6 py-4 font-space-grotesk font-medium transition-colors ${
                      activeTab === 'chat'
                        ? 'bg-botai-accent-green text-white'
                        : 'bg-white text-botai-text hover:bg-botai-grey-bg'
                    }`}
                  >
                    Chat
                  </button>
                  <button
                    onClick={() => setActiveTab('reviews')}
                    className={`flex-1 px-6 py-4 font-space-grotesk font-medium transition-colors ${
                      activeTab === 'reviews'
                        ? 'bg-botai-accent-green text-white'
                        : 'bg-white text-botai-text hover:bg-botai-grey-bg'
                    }`}
                  >
                    Reviews ({bot.total_reviews})
                  </button>
                </div>

                <div className="p-6">
                  {/* Chat Tab */}
                  {activeTab === 'chat' && (
                    <>
                      {!user ? (
                        <div className="text-center py-20">
                          <div className="w-20 h-20 bg-botai-grey-bg rounded-full flex items-center justify-center mx-auto mb-6">
                            <User className="w-10 h-10 text-botai-text/40" />
                          </div>
                          <h3 className="text-2xl font-space-grotesk font-bold text-botai-black mb-3">
                            Login Required
                          </h3>
                          <p className="text-botai-text/70 font-noto-sans mb-6">
                            Sign in to start a conversation with this bot
                          </p>
                          <button
                            onClick={() => navigate('/login')}
                            className="px-8 py-3 bg-botai-accent-green text-white rounded-full font-space-grotesk font-medium hover:bg-botai-black transition-colors"
                          >
                            Login to Chat
                          </button>
                        </div>
                      ) : canUseBot ? (
                        <BotChat
                          botId={bot.id}
                          botName={bot.name}
                          botAvatar={bot.avatar_url}
                          welcomeMessage={bot.welcome_message}
                          outputMode={bot.output_mode || 'text'}
                        />
                      ) : (
                        <div className="text-center py-20">
                          <div className="w-20 h-20 bg-botai-grey-bg rounded-full flex items-center justify-center mx-auto mb-6">
                            <Bot className="w-10 h-10 text-botai-text/40" />
                          </div>
                          <h3 className="text-2xl font-space-grotesk font-bold text-botai-black mb-3">
                            Purchase Required
                          </h3>
                          <p className="text-botai-text/70 font-noto-sans mb-6">
                            Purchase this bot to start chatting
                          </p>
                          {!user && (
                            <button
                              onClick={() => navigate('/login')}
                              className="px-8 py-3 bg-botai-accent-green text-white rounded-full font-space-grotesk font-medium hover:bg-botai-black transition-colors"
                            >
                              Login to Purchase
                            </button>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {/* Reviews Tab */}
                  {activeTab === 'reviews' && (
                    <div className="space-y-4">
                      {reviews.length === 0 ? (
                        <div className="text-center py-20">
                          <Star className="w-20 h-20 text-botai-text/20 mx-auto mb-4" />
                          <p className="text-botai-text/60 font-noto-sans">
                            No reviews yet. Be the first to review this bot!
                          </p>
                        </div>
                      ) : (
                        reviews.map((review) => (
                          <div key={review.id} className="bg-botai-grey-bg rounded-xl p-5">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-botai-accent-green rounded-full flex items-center justify-center">
                                  <span className="text-white font-space-grotesk font-bold">
                                    {review.full_name?.charAt(0) || 'U'}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-space-grotesk font-medium text-botai-black">
                                    {review.full_name || 'Anonymous'}
                                  </p>
                                  <p className="text-xs font-noto-sans text-botai-text/60">
                                    {new Date(review.created_at).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-4 h-4 ${
                                      i < review.rating
                                        ? 'fill-botai-star text-botai-star'
                                        : 'text-botai-text/20'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            {review.comment && (
                              <p className="text-sm font-noto-sans text-botai-text/80">
                                {review.comment}
                              </p>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

