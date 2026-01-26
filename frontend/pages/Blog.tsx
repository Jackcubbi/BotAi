import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bot, Sparkles, User, Menu, X, BookOpen, Zap, TrendingUp, MessageSquare } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

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
            <Link to="/resources" className="text-botai-accent-green font-space-grotesk font-medium text-sm uppercase tracking-wide">
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
            <Link to="/marketplace" onClick={() => setIsMenuOpen(false)} className="text-white font-space-grotesk font-medium text-lg uppercase tracking-wide">
              Marketplace
            </Link>
            <Link to="/about" onClick={() => setIsMenuOpen(false)} className="text-white font-space-grotesk font-medium text-lg uppercase tracking-wide">
              How It Works
            </Link>
            <Link to="/resources" onClick={() => setIsMenuOpen(false)} className="text-botai-accent-green font-space-grotesk font-medium text-lg uppercase tracking-wide">
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

const resources = [
  {
    id: 1,
    category: 'Getting Started',
    title: 'Building Your First AI Bot',
    description: 'Learn the fundamentals of creating an AI bot from scratch using our no-code platform.',
    icon: Bot,
    color: 'from-botai-accent-green to-botai-accent-blue'
  },
  {
    id: 2,
    category: 'Monetization',
    title: 'Pricing Strategies for Your Bot',
    description: 'Discover proven pricing models to maximize revenue from your AI bots.',
    icon: TrendingUp,
    color: 'from-botai-accent-blue to-botai-accent-purple'
  },
  {
    id: 3,
    category: 'Best Practices',
    title: 'Optimizing Bot Conversations',
    description: 'Tips and tricks to create engaging, natural conversations that users love.',
    icon: MessageSquare,
    color: 'from-botai-accent-purple to-botai-accent-green'
  },
  {
    id: 4,
    category: 'Tutorial',
    title: 'Advanced Bot Customization',
    description: 'Take your bot to the next level with advanced features and configurations.',
    icon: Sparkles,
    color: 'from-botai-accent-green to-botai-accent-blue'
  },
  {
    id: 5,
    category: 'Performance',
    title: 'Analytics & Optimization',
    description: 'Use data-driven insights to improve your bot\'s performance and user satisfaction.',
    icon: Zap,
    color: 'from-botai-accent-blue to-botai-accent-purple'
  },
  {
    id: 6,
    category: 'Guide',
    title: 'Marketing Your AI Bot',
    description: 'Strategies to promote your bot and reach more users in the marketplace.',
    icon: BookOpen,
    color: 'from-botai-accent-purple to-botai-accent-green'
  }
];

export default function Blog() {
  return (
    <div className="relative min-h-screen bg-botai-grey-bg">
      <Header />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-botai-black via-botai-dark to-botai-black pt-32 pb-20 px-5">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-space-grotesk font-bold text-white mb-6">
            Resources & Guides
          </h1>
          <p className="text-lg md:text-xl text-white/80 font-noto-sans max-w-3xl mx-auto">
            Learn everything you need to know about creating, optimizing, and monetizing AI bots. From beginner tutorials to advanced strategies.
          </p>
        </div>
      </section>

      {/* Resources Grid */}
      <section className="py-20 px-5">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {resources.map((resource) => {
              const Icon = resource.icon;
              return (
                <div
                  key={resource.id}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group cursor-pointer"
                >
                  <div className="p-8">
                    {/* Icon */}
                    <div className={`w-16 h-16 bg-gradient-to-br ${resource.color} rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>

                    {/* Category Badge */}
                    <span className="inline-block px-3 py-1 bg-botai-grey-bg rounded-full text-xs font-space-grotesk font-medium text-botai-text mb-4">
                      {resource.category}
                    </span>

                    {/* Title */}
                    <h3 className="text-2xl font-space-grotesk font-bold text-botai-black mb-4 group-hover:text-botai-accent-green transition-colors">
                      {resource.title}
                    </h3>

                    {/* Description */}
                    <p className="text-botai-text/70 font-noto-sans mb-6">
                      {resource.description}
                    </p>

                    {/* Read More Link */}
                    <button className="text-botai-accent-green font-space-grotesk font-medium hover:underline">
                      Read More →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 px-5 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-space-grotesk font-bold text-botai-black mb-4">
              Browse by Category
            </h2>
            <p className="text-lg text-botai-text/70 font-noto-sans">
              Find exactly what you're looking for
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['Getting Started', 'Tutorials', 'Best Practices', 'Monetization', 'Marketing', 'Analytics', 'API Guides', 'Community'].map((category) => (
              <button
                key={category}
                className="px-6 py-4 bg-botai-grey-bg hover:bg-botai-accent-green hover:text-white rounded-xl font-space-grotesk font-medium text-botai-text transition-all"
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-20 px-5 bg-gradient-to-br from-botai-black via-botai-dark to-botai-black">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-space-grotesk font-bold text-white mb-6">
            Stay Updated
          </h2>
          <p className="text-lg md:text-xl text-white/80 font-noto-sans mb-10">
            Get the latest tutorials, tips, and AI bot strategies delivered to your inbox.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-6 py-4 rounded-full border-none focus:outline-none focus:ring-2 focus:ring-botai-accent-green font-noto-sans"
            />
            <button className="px-8 py-4 bg-botai-accent-green text-white rounded-full font-space-grotesk font-medium text-lg hover:bg-white hover:text-botai-black transition-colors whitespace-nowrap">
              Subscribe
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

