import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bot, Sparkles, User, Menu, X, Zap, Shield, TrendingUp, Users } from 'lucide-react';
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
            <Link to="/about" className="text-botai-accent-green font-space-grotesk font-medium text-sm uppercase tracking-wide">
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
            <Link to="/marketplace" onClick={() => setIsMenuOpen(false)} className="text-white font-space-grotesk font-medium text-lg uppercase tracking-wide">
              Marketplace
            </Link>
            <Link to="/about" onClick={() => setIsMenuOpen(false)} className="text-botai-accent-green font-space-grotesk font-medium text-lg uppercase tracking-wide">
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

export default function About() {
  return (
    <div className="relative min-h-screen bg-botai-grey-bg">
      <Header />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-botai-black via-botai-dark to-botai-black pt-32 pb-20 px-5">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-space-grotesk font-bold text-white mb-6">
            How BotAi Works
          </h1>
          <p className="text-lg md:text-xl text-white/80 font-noto-sans max-w-3xl mx-auto">
            Create, customize, and monetize AI chatbots with no coding required. Join thousands of creators building the future of AI.
          </p>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 px-5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-space-grotesk font-bold text-botai-black mb-4">
              Three Simple Steps
            </h2>
            <p className="text-lg text-botai-text/70 font-noto-sans">
              From idea to income in minutes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="bg-b rounded-2xl shadow-lg p-8 hover:shadow-2xl transition-shadow">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6 border-4 border-botai-accent-green/50">
                <Sparkles className="w-8 h-8 text-botai-dark" />
              </div>
              <div className="text-6xl font-space-grotesk font-bold text-botai-black/10 mb-4">01</div>
              <h3 className="text-2xl font-space-grotesk font-bold text-botai-black mb-4">
                Create Your Bot
              </h3>
              <p className="text-botai-text/70 font-noto-sans">
                Use our intuitive no-code builder to design your AI bot. Choose from pre-trained models, customize personality, and set behaviors.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-2xl transition-shadow">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6 border-4 border-botai-accent-green/50">
                <Bot className="w-8 h-8 text-botai-dark" />
              </div>
              <div className="text-6xl font-space-grotesk font-bold text-botai-black/10 mb-4">02</div>
              <h3 className="text-2xl font-space-grotesk font-bold text-botai-black mb-4">
                Configure & Test
              </h3>
              <p className="text-botai-text/70 font-noto-sans">
                Fine-tune your bot's responses, set pricing, and test conversations. Make it perfect before going live to the marketplace.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-2xl transition-shadow">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6 border-4 border-botai-accent-green/50  ">
                <TrendingUp className="w-8 h-8 text-botai-dark" />
              </div>
              <div className="text-6xl font-space-grotesk font-bold text-botai-black/10 mb-4">03</div>
              <h3 className="text-2xl font-space-grotesk font-bold text-botai-black mb-4">
                Launch & Earn
              </h3>
              <p className="text-botai-text/70 font-noto-sans">
                Publish to our marketplace and start earning. Track analytics, gather reviews, and watch your bot conversations grow.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-5 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-space-grotesk font-bold text-botai-black mb-4">
              Why Choose BotAi?
            </h2>
            <p className="text-lg text-botai-text/70 font-noto-sans">
              Everything you need to succeed in the AI economy
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="text-center">
              <div className="w-20 h-20 bg-botai-accent-green/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Zap className="w-10 h-10 text-botai-accent-green" />
              </div>
              <h3 className="text-xl font-space-grotesk font-bold text-botai-black mb-3">
                No Code Required
              </h3>
              <p className="text-botai-text/70 font-noto-sans">
                Build powerful AI bots without writing a single line of code
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center">
              <div className="w-20 h-20 bg-botai-accent-blue/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="w-10 h-10 text-botai-accent-blue" />
              </div>
              <h3 className="text-xl font-space-grotesk font-bold text-botai-black mb-3">
                Secure & Reliable
              </h3>
              <p className="text-botai-text/70 font-noto-sans">
                Enterprise-grade security and 99.9% uptime guarantee
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center">
              <div className="w-20 h-20 bg-botai-accent-purple/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <TrendingUp className="w-10 h-10 text-botai-accent-purple" />
              </div>
              <h3 className="text-xl font-space-grotesk font-bold text-botai-black mb-3">
                Full Analytics
              </h3>
              <p className="text-botai-text/70 font-noto-sans">
                Track performance, user engagement, and revenue in real-time
              </p>
            </div>

            {/* Feature 4 */}
            <div className="text-center">
              <div className="w-20 h-20 bg-botai-accent-green/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-10 h-10 text-botai-accent-green" />
              </div>
              <h3 className="text-xl font-space-grotesk font-bold text-botai-black mb-3">
                Growing Community
              </h3>
              <p className="text-botai-text/70 font-noto-sans">
                Join thousands of creators and bot users worldwide
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-5 bg-gradient-to-br from-botai-black via-botai-dark to-botai-black">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-space-grotesk font-bold text-white mb-6">
            Ready to Create Your First Bot?
          </h2>
          <p className="text-lg md:text-xl text-white/80 font-noto-sans mb-10">
            Join the AI revolution today. Free to start, easy to scale.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="px-8 py-4 bg-botai-accent-green text-white rounded-full font-space-grotesk font-medium text-lg hover:bg-white hover:text-botai-black transition-colors inline-block"
            >
              Get Started Free
            </Link>
            <Link
              to="/marketplace"
              className="px-8 py-4 bg-white/10 text-white rounded-full font-space-grotesk font-medium text-lg hover:bg-white hover:text-botai-black transition-colors inline-block border border-white/20"
            >
              Explore Marketplace
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

