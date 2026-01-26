import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Star,
  ArrowUpRight,
  ArrowRight,
  Mail,
  MapPin,
  Phone,
  Twitter,
  Instagram,
  Facebook,
  Youtube,
  Bot,
  Sparkles,
  User,
  Menu,
  X,
  MessageSquare,
  TrendingUp,
  Rocket,
  Globe,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../lib/api';

const StarRating = () => (
  <div className="flex items-center gap-1">
    {[...Array(5)].map((_, i) => (
      <Star key={i} className="w-4 h-4 fill-botai-star text-botai-star" />
    ))}
  </div>
);

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

          {/* Desktop Navigation */}
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

          {/* Right Side Actions */}
          <div className="flex items-center gap-4">

            {user && (
              <Link
                to="/creator/bots"
                className="hidden md:flex items-center gap-2 text-white hover:text-botai-accent-green transition-colors"
              >
                <Bot className="w-5 h-5" />
                <span className="font-space-grotesk font-medium text-sm uppercase tracking-wide">My Bots</span>
              </Link>
            )}

            {/* User Menu */}
            {user ? (
              <div className="hidden md:flex items-center gap-3">
                <Link
                  to="/account"
                  className="text-white hover:text-botai-accent-green transition-colors"
                >
                  <User className="w-6 h-6" />
                </Link>
                <button
                  onClick={logout}
                  className="text-white font-space-grotesk font-medium text-sm uppercase tracking-wide hover:text-botai-accent-green transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-white font-space-grotesk font-medium text-sm uppercase tracking-wide hover:text-botai-accent-green transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-botai-accent-green text-botai-dark px-4 py-2 rounded-full font-space-grotesk font-medium text-sm uppercase tracking-wide hover:bg-white transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden text-white p-2"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 mx-4 bg-botai-black/95 backdrop-blur-sm rounded-2xl shadow-xl md:hidden">
              <div className="flex flex-col space-y-4 p-6">
                <Link
                  to="/marketplace"
                  className="text-white font-space-grotesk font-medium text-sm uppercase tracking-wide hover:text-botai-accent-green transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Marketplace
                </Link>
                <Link
                  to="/about"
                  className="text-white font-space-grotesk font-medium text-sm uppercase tracking-wide hover:text-botai-accent-green transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  How It Works
                </Link>
                <Link
                  to="/resources"
                  className="text-white font-space-grotesk font-medium text-sm uppercase tracking-wide hover:text-botai-accent-green transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Resources
                </Link>
                <Link
                  to="/contact"
                  className="text-white font-space-grotesk font-medium text-sm uppercase tracking-wide hover:text-botai-accent-green transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Contact
                </Link>
                <div className="border-t border-white/20 pt-4">
                  {user ? (
                    <>
                      <Link
                        to="/creator/bots"
                        className="block text-white font-space-grotesk font-medium text-sm uppercase tracking-wide hover:text-botai-accent-green transition-colors mb-2"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        My Bots
                      </Link>
                      <Link
                        to="/account"
                        className="block text-white font-space-grotesk font-medium text-sm uppercase tracking-wide hover:text-botai-accent-green transition-colors mb-2"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        My Account
                      </Link>
                      <button
                        onClick={() => {
                          logout();
                          setIsMenuOpen(false);
                        }}
                        className="text-white font-space-grotesk font-medium text-sm uppercase tracking-wide hover:text-botai-accent-green transition-colors"
                      >
                        Logout
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/login"
                        className="block text-white font-space-grotesk font-medium text-sm uppercase tracking-wide hover:text-botai-accent-green transition-colors mb-2"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Login
                      </Link>
                      <Link
                        to="/register"
                        className="block text-white font-space-grotesk font-medium text-sm uppercase tracking-wide hover:text-botai-accent-green transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Sign Up
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}        </nav>
      </header>
    </>
  );
};

const HeroSection = () => {
  const [platformStats, setPlatformStats] = useState({
    activeBots: 0,
    totalConversations: 0,
    totalCreators: 0,
  });

  useEffect(() => {
    let mounted = true;
    const loadStats = async () => {
      const response = await apiClient.getPublicBotStats();

      if (!mounted || !response.success || !response.data) {
        return;
      }

      setPlatformStats({
        activeBots: response.data.active_bots || 0,
        totalConversations: response.data.total_conversations || 0,
        totalCreators: response.data.total_creators || 0,
      });
    };

    loadStats();

    return () => {
      mounted = false;
    };
  }, []);

  return (
  <section className="relative bg-transparent overflow-hidden modern-grid-bg">
    <div className="pointer-events-none absolute inset-0">
      <div className="modern-orb modern-orb-green top-24 -left-10" />
      <div className="modern-orb modern-orb-blue top-10 right-10" />
      <div className="modern-orb modern-orb-purple bottom-10 left-1/3" />
    </div>

    <div className="relative max-w-7xl mx-auto px-5 pt-32 pb-20">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        {/* Left Content */}
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-botai-grey-line/30 bg-white/80 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-botai-accent-green" />
            <span className="font-space-grotesk text-xs uppercase tracking-[0.18em] text-botai-dark">Next-gen bot platform</span>
          </div>
          <h1 className="font-space-grotesk font-bold text-6xl lg:text-7xl leading-tight text-botai-dark uppercase tracking-wide">
            Create & Sell <br />
            AI Bots <br />
            <span className="text-botai-accent-green">Effortlessly</span>
          </h1>

          <p className="font-noto-sans text-lg text-botai-text leading-relaxed max-w-md">
            Build powerful AI chatbots with no code required. Customize, monetize, and sell your bots in our marketplace. Join thousands of creators transforming conversations into revenue.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Link to="/marketplace" className="inline-flex items-center gap-2 bg-botai-black text-white px-7 py-4 rounded-full font-noto-sans font-semibold text-base uppercase tracking-wide hover:bg-botai-dark transition-all duration-300 hover:-translate-y-0.5">
              Explore Marketplace
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/creator/bots/create" className="inline-flex items-center gap-2 px-6 py-4 rounded-full border border-botai-dark/20 text-botai-dark bg-white/80 backdrop-blur-sm font-space-grotesk font-semibold uppercase tracking-wide hover:border-botai-dark hover:bg-white transition-all duration-300 hover:-translate-y-0.5">
              Start Creating
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 pt-8">
            <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl py-4 border border-botai-grey-line/20 hover:-translate-y-0.5 transition-transform duration-300">
              <div className="font-space-grotesk font-bold text-3xl text-botai-dark">{platformStats.activeBots.toLocaleString()}</div>
              <div className="font-noto-sans text-sm text-botai-text uppercase">Active Bots</div>
            </div>
            <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl py-4 border border-botai-grey-line/20 hover:-translate-y-0.5 transition-transform duration-300">
              <div className="font-space-grotesk font-bold text-3xl text-botai-dark">{platformStats.totalConversations.toLocaleString()}</div>
              <div className="font-noto-sans text-sm text-botai-text uppercase">Conversations</div>
            </div>
            <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl py-4 border border-botai-grey-line/20 hover:-translate-y-0.5 transition-transform duration-300">
              <div className="font-space-grotesk font-bold text-3xl text-botai-dark">{platformStats.totalCreators.toLocaleString()}</div>
              <div className="font-noto-sans text-sm text-botai-text uppercase">Bot Creators</div>
            </div>
          </div>
        </div>

        {/* Right Content - AI Bot Visualization */}
        <div className="relative">
          <div className="bg-botai-accent-green rounded-3xl p-8 relative overflow-hidden border border-white/40">
            <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/40 blur-2xl animate-pulse" />
            <div className="text-center mb-6">
              <div className="font-space-grotesk font-bold text-2xl text-botai-dark uppercase tracking-wide">
                AI Powered <br />
                Bot Creation
              </div>
            </div>
            <div className="relative bg-white/95 rounded-2xl p-6 shadow-lg border border-white/60">
              <div className="flex items-center gap-3 mb-4">
                <Bot className="w-12 h-12 text-botai-accent-green" />
                <div>
                  <h3 className="font-space-grotesk font-bold text-lg">Swimming Trainer Bot</h3>
                  <p className="text-sm text-botai-text">GPT-5.2 Powered</p>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-xl border border-botai-grey-line/40 bg-botai-grey-bg">
                <video
                  src="/local-assets/recording.mp4"
                  className="w-full h-[350px] object-cover"
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="metadata"
                />
              </div>

              {/* Floating Cards */}
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
  );
};

const ScrollingBanner = () => (
  <section className="bg-botai-black py-6 overflow-hidden">
    <div className="flex items-center whitespace-nowrap animate-scroll">
      <div className="flex items-center gap-8 mx-8">
        <span className="text-white font-space-grotesk font-bold text-4xl uppercase tracking-wide">AI Marketplace</span>
        <div className="w-6 h-6 bg-botai-accent-blue rounded-full"></div>
        <span className="text-white font-space-grotesk font-bold text-4xl uppercase tracking-wide">Bot Creator</span>
        <div className="w-6 h-6 bg-botai-accent-blue rounded-full"></div>
        <span className="text-white font-space-grotesk font-bold text-4xl uppercase tracking-wide">Smart Monetization</span>
        <div className="w-6 h-6 bg-botai-accent-blue rounded-full"></div>
      </div>
      <div className="flex items-center gap-8 mx-8">
        <span className="text-white font-space-grotesk font-bold text-4xl uppercase tracking-wide">AI Marketplace</span>
        <div className="w-6 h-6 bg-botai-accent-blue rounded-full"></div>
        <span className="text-white font-space-grotesk font-bold text-4xl uppercase tracking-wide">Bot Creator</span>
        <div className="w-6 h-6 bg-botai-accent-blue rounded-full"></div>
        <span className="text-white font-space-grotesk font-bold text-4xl uppercase tracking-wide">Smart Monetization</span>
        <div className="w-6 h-6 bg-botai-accent-blue rounded-full"></div>
      </div>
    </div>
  </section>
);

const AboutSection = () => {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % 3);
    }, 3200);

    return () => window.clearInterval(intervalId);
  }, []);

  const slides = [
    {
      title: 'Build Powerful Bots',
      description: 'Create intelligent assistants in minutes with no-code workflows and modern AI models.',
      icon: Bot,
      iconClass: 'text-botai-dark',
      containerClass: 'bg-botai-accent-green'
    },
    {
      title: 'Converse Naturally',
      description: 'Deliver smooth customer interactions with contextual memory and responsive chat experiences.',
      icon: MessageSquare,
      iconClass: 'text-white',
      containerClass: 'bg-botai-accent-blue'
    },
    {
      title: 'Scale And Monetize',
      description: 'Track growth, optimize bot quality, and turn your assistants into reliable revenue streams.',
      icon: TrendingUp,
      iconClass: 'text-botai-accent-green',
      containerClass: 'bg-botai-black'
    }
  ] as const;

  return (
  <section className="bg-transparent py-20 relative overflow-hidden modern-grid-bg">

    <div className="relative max-w-7xl mx-auto px-5">
      <div className="grid lg:grid-cols-2 gap-16 items-center">
        {/* Left Content */}
        <div className="space-y-8">

          <p className="font-noto-sans text-lg text-botai-text leading-relaxed">
            At BotAi, we revolutionize conversations with artificial intelligence. Our platform empowers creators, entrepreneurs, and developers to build sophisticated AI chatbots without writing a single line of code.
            <br /><br />
            Each bot is a unique creation, powered by cutting-edge AI models like GPT-5.2 and GPT-4.1. We believe in democratizing AI technology, making it accessible to everyone. Whether you're automating customer service, creating virtual assistants, or building engaging conversational experiences - BotAi is your gateway to the future of intelligent automation.
            <br /><br />
            Join our thriving community of bot creators and turn your ideas into revenue-generating AI assistants. With BotAi, the only limit is your imagination.
          </p>
        </div>

        {/* Right Content */}
        <div className="text-right">
          <h2 className="font-space-grotesk font-bold text-6xl lg:text-7xl text-botai-dark uppercase tracking-wide leading-tight">
            Powering<br />
            The Future<br />
            Of AI Bots
          </h2>
        </div>
      </div>

      {/* Bot Feature Icons */}
      <div className="mt-16 relative">
        {/* Small circular bot icons */}
        <div className="flex justify-center items-center gap-6 mb-8">
          {slides.map((slide, index) => {
            const Icon = slide.icon;
            const isActive = activeSlide === index;

            return (
              <button
                key={slide.title}
                type="button"
                onClick={() => setActiveSlide(index)}
                className={`w-36 h-36 rounded-full border-4 border-white overflow-hidden flex items-center justify-center transition-all duration-500 ${slide.containerClass} ${isActive ? 'scale-105 shadow-2xl' : 'opacity-70 scale-95'}`}
                aria-label={`Show ${slide.title}`}
              >
                <Icon className={`w-20 h-20 ${slide.iconClass}`} />
              </button>
            );
          })}
        </div>

        {/* Main large bot showcase slider */}
        <div className="w-full h-80 rounded-full border-4 border-white overflow-hidden bg-botai-dark relative">
          <div
            className="h-full flex transition-transform duration-700 ease-in-out"
            style={{ transform: `translateX(-${activeSlide * 100}%)` }}
          >
            {slides.map((slide) => {
              const Icon = slide.icon;

              return (
                <div key={slide.title} className="min-w-full h-full flex items-center justify-center px-8">
                  <div className="max-w-2xl text-center text-white space-y-4">
                    <div className="flex items-center justify-center">
                    </div>
                    <h3 className="font-space-grotesk font-bold text-3xl uppercase tracking-wide">{slide.title}</h3>
                    <p className="font-noto-sans text-base lg:text-lg text-white/90">{slide.description}</p>
                    <div className="flex items-center justify-center pt-1">
                      <div className={`w-16 h-16 rounded-full border-2 border-white/60 flex items-center justify-center ${slide.containerClass}`}>
                        <Icon className={`w-8 h-8 ${slide.iconClass}`} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2">
            {slides.map((slide, index) => (
              <button
                key={`indicator-${slide.title}`}
                type="button"
                onClick={() => setActiveSlide(index)}
                className={`h-2.5 rounded-full transition-all duration-300 ${activeSlide === index ? 'w-8 bg-white' : 'w-2.5 bg-white/55'}`}
                aria-label={`Go to ${slide.title}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  </section>
  );
};

const ServicesSection = () => (
  <section className="bg-transparent py-20 relative overflow-hidden modern-grid-bg">

    <div className="relative max-w-7xl mx-auto px-5 space-y-0">
      {/* Bot Marketplace */}
      <Link
        to="/marketplace"
        className="flex items-center justify-between py-10 border-b border-white/20 cursor-pointer transition-all duration-300 hover:bg-botai-dark -mx-5 px-5 group relative overflow-hidden rounded-3xl"
      >
        <div className="relative z-10">
          <h3 className="font-space-grotesk font-bold text-3xl text-botai-dark uppercase tracking-wide mb-2 group-hover:text-white transition-colors inline-flex items-center gap-2">
            <Globe className="w-6 h-6" />
            Bot Marketplace
          </h3>
          <p className="font-noto-sans text-botai-text max-w-md group-hover:text-white transition-colors">
            Discover and purchase AI bots created by our community. Browse by category, rating, or price.
          </p>
        </div>
        <div className="w-16 h-9 border-2 border-botai-dark rounded-full flex items-center justify-center group-hover:bg-botai-accent-green group-hover:border-botai-accent-green group-hover:scale-110 transition-all duration-300 relative z-10">
          <ArrowRight className="w-5 h-5 text-botai-dark transition-colors" />
        </div>
      </Link>

      {/* Bot Creator */}
      <Link
        to="/creator/bots/create"
        className="flex items-center justify-between py-10 bg-botai-dark -mx-5 px-5 relative cursor-pointer transition-all duration-300 hover:bg-botai-black group overflow-hidden rounded-3xl"
      >
        <div className="relative z-10">
          <h3 className="font-space-grotesk font-bold text-3xl text-white uppercase tracking-wide mb-2 group-hover:text-botai-accent-green transition-colors inline-flex items-center gap-2">
            <Rocket className="w-6 h-6" />
            Create Your Bot
          </h3>
          <p className="font-noto-sans text-white max-w-md">
            Build powerful AI bots with our no-code builder. Configure AI models, customize behaviors, and set pricing.
          </p>
        </div>
        <div className="w-16 h-9 bg-botai-accent-green rounded-full flex items-center justify-center group-hover:scale-110 transition-all duration-300 relative z-10">
          <ArrowRight className="w-5 h-5 text-botai-dark" />
        </div>
      </Link>

      {/* Monetization */}
      <Link
        to="/about"
        className="flex items-center justify-between py-10 border-b border-white/20 cursor-pointer transition-all duration-300 hover:bg-botai-dark -mx-5 px-5 group relative overflow-hidden rounded-3xl"
      >
        <div className="relative z-10">
          <h3 className="font-space-grotesk font-bold text-3xl text-botai-dark uppercase tracking-wide mb-2 group-hover:text-white transition-colors inline-flex items-center gap-2">
            <ShieldCheck className="w-6 h-6" />
            Monetize & Earn
          </h3>
          <p className="font-noto-sans text-botai-text max-w-md group-hover:text-white transition-colors">
            Set your own pricing, track earnings, and get paid. Turn your bot creations into a revenue stream.
          </p>
        </div>
        <div className="w-16 h-9 border-2 border-botai-dark rounded-full flex items-center justify-center group-hover:bg-botai-accent-green group-hover:border-botai-accent-green group-hover:scale-110 transition-all duration-300 relative z-10">
          <ArrowRight className="w-5 h-5 text-botai-dark transition-colors" />
        </div>
      </Link>

      {/* Analytics */}
      <Link
        to="/creator/bots"
        className="flex items-center justify-between py-10 cursor-pointer transition-all duration-300 hover:bg-botai-dark -mx-5 px-5 group relative overflow-hidden rounded-3xl"
      >
        <div className="relative z-10">
          <h3 className="font-space-grotesk font-bold text-3xl text-botai-dark uppercase tracking-wide mb-2 group-hover:text-white transition-colors inline-flex items-center gap-2">
            <TrendingUp className="w-6 h-6" />
            Analytics & Insights
          </h3>
          <p className="font-noto-sans text-botai-text max-w-md group-hover:text-white transition-colors">
            Track your bot's performance with detailed analytics. Monitor conversations, revenue, and user engagement.
          </p>
        </div>
        <div className="w-16 h-9 border-2 border-botai-dark rounded-full flex items-center justify-center group-hover:bg-botai-accent-green group-hover:border-botai-accent-green group-hover:scale-110 transition-all duration-300 relative z-10">
          <ArrowRight className="w-5 h-5 text-botai-dark transition-colors" />
        </div>
      </Link>
    </div>
  </section>
);




const CTASection = () => (
  <section className="bg-transparent relative overflow-hidden modern-grid-bg">
    {/* Background Image */}
    <div className="absolute inset-0">
      <img
        src="/local-assets/botai-cta-bg.svg"
        alt="CTA Background"
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-botai-black/50"></div>
    </div>

    <div className="relative max-w-7xl mx-auto px-5 py-32 text-center">
      <div className="space-y-8 max-w-5xl mx-auto">
        <h2 className="font-space-grotesk font-bold text-5xl lg:text-6xl text-white uppercase tracking-wide leading-tight">
          Embrace Intelligence and Order bots now
        </h2>
        <p className="font-noto-sans text-lg text-white leading-relaxed max-w-4xl mx-auto">
          Elevate your AI experience today! Explore our curated collection and make a statement with powerful technology. Embrace the extraordinary – shop now for intelligent assistants that deliver results
        </p>

        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link to="/marketplace" className="inline-flex items-center gap-2 bg-botai-accent-green text-botai-dark px-10 py-5 rounded-full font-noto-sans font-bold text-lg uppercase tracking-wide hover:bg-white transition-all duration-300 hover:-translate-y-0.5">
            Buy Now
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link to="/creator/bots/create" className="w-16 h-16 bg-white rounded-full flex items-center justify-center hover:scale-105 transition-transform duration-300">
            <ArrowUpRight className="w-8 h-8 text-botai-dark" />
          </Link>
        </div>
      </div>
    </div>
  </section>
);

const Footer = () => (
  <footer className="bg-botai-black relative overflow-hidden py-20">

    <div className="relative max-w-7xl mx-auto px-5">
      <div className="grid md:grid-cols-3 gap-12">
        {/* Quick Links */}
        <div className="space-y-10">
          <h3 className="font-space-grotesk font-bold text-3xl text-white uppercase tracking-wide">
            Quick Links
          </h3>
          <div className="space-y-6">
            <Link to="/about" className="block text-white font-space-grotesk text-lg uppercase hover:text-botai-accent-green transition-colors">
              About Us
            </Link>
            <Link to="/shop" className="block text-white font-space-grotesk text-lg uppercase hover:text-botai-accent-green transition-colors">
              Shop
            </Link>
            <Link to="/resources" className="block text-white font-space-grotesk text-lg uppercase hover:text-botai-accent-green transition-colors">
              Blog
            </Link>
            <Link to="/contact" className="block text-white font-space-grotesk text-lg uppercase hover:text-botai-accent-green transition-colors">
              Contact Us
            </Link>
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-10">
          <h3 className="font-space-grotesk font-bold text-3xl text-white uppercase tracking-wide">
            Contact Us
          </h3>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-botai-accent-green" />
              <span className="text-white font-space-grotesk uppercase">info@botai.demo</span>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-botai-accent-green mt-1" />
              <span className="text-white font-space-grotesk uppercase">
                Demo Str, Helsinki, Finland
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-botai-accent-green" />
              <span className="text-white font-space-grotesk uppercase">+358 401234567</span>
            </div>
          </div>
        </div>

        {/* Newsletter */}
        <div className="space-y-10">
          <h3 className="font-space-grotesk font-bold text-3xl text-white uppercase tracking-wide">
            Newsletter
          </h3>
          <div className="space-y-6">
            <div className="flex">
              <input
                type="email"
                placeholder="Enter email address"
                className="flex-1 px-4 py-4 rounded-l-lg font-space-grotesk text-botai-text uppercase"
              />
              <button className="bg-botai-accent-green text-botai-dark px-6 py-4 rounded-r-lg font-noto-sans font-bold text-lg uppercase">
                Subscribe
              </button>
            </div>

            {/* Social Icons
            <div className="flex items-center gap-4">
              <a href="#" className="w-10 h-10 bg-botai-accent-green rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-300" aria-label="Twitter">
                <Twitter className="w-5 h-5 text-botai-black" />
              </a>
              <a href="#" className="w-10 h-10 border border-botai-accent-green rounded-full flex items-center justify-center hover:bg-botai-accent-green hover:text-botai-black transition-colors duration-300" aria-label="Instagram">
                <Instagram className="w-5 h-5 text-botai-accent-green" />
              </a>
              <a href="#" className="w-10 h-10 border border-botai-accent-green rounded-full flex items-center justify-center hover:bg-botai-accent-green hover:text-botai-black transition-colors duration-300" aria-label="Facebook">
                <Facebook className="w-5 h-5 text-botai-accent-green" />
              </a>
              <a href="#" className="w-10 h-10 border border-botai-accent-green rounded-full flex items-center justify-center hover:bg-botai-accent-green hover:text-botai-black transition-colors duration-300" aria-label="Youtube">
                <Youtube className="w-5 h-5 text-botai-accent-green" />
              </a>
            </div>*/}
          </div>
        </div>
      </div>
    </div>
  </footer>
);

export default function Index() {
  return (
    <div className="min-h-screen relative">
      <div className="main-bg-vanta z-0">
        <div className="main-bg-vanta-aurora" />
        <div className="main-bg-vanta-core" />
        <div className="main-bg-vanta-globe">
          <div className="main-bg-vanta-ring" />
          <div className="main-bg-vanta-ring" />
          <div className="main-bg-vanta-ring" />
        </div>
        <div className="main-bg-vanta-globe-secondary">
          <div className="main-bg-vanta-ring" />
          <div className="main-bg-vanta-ring" />
          <div className="main-bg-vanta-ring" />
        </div>
      </div>

      <div className="relative z-10">
        <Header />
        <HeroSection />
        <ScrollingBanner />
        <AboutSection />
        <ServicesSection />
        <CTASection />
        <Footer />
      </div>
    </div>
  );
}

