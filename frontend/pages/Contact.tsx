import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bot, Sparkles, User, Menu, X, Mail, MessageSquare, Phone, MapPin } from 'lucide-react';
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
            <Link to="/resources" className="text-white font-space-grotesk font-medium text-sm uppercase tracking-wide hover:text-botai-accent-green transition-colors">
              Resources
            </Link>
            <Link to="/contact" className="text-botai-accent-green font-space-grotesk font-medium text-sm uppercase tracking-wide">
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
            <Link to="/resources" onClick={() => setIsMenuOpen(false)} className="text-white font-space-grotesk font-medium text-lg uppercase tracking-wide">
              Resources
            </Link>
            <Link to="/contact" onClick={() => setIsMenuOpen(false)} className="text-botai-accent-green font-space-grotesk font-medium text-lg uppercase tracking-wide">
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

export default function Contact() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission here
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="relative min-h-screen bg-botai-grey-bg">
      <Header />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-botai-black via-botai-dark to-botai-black pt-32 pb-20 px-5">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-space-grotesk font-bold text-white mb-6">
            Get In Touch
          </h1>
          <p className="text-lg md:text-xl text-white/80 font-noto-sans max-w-3xl mx-auto">
            Have questions about BotAi? We're here to help. Reach out to our team and we'll get back to you as soon as possible.
          </p>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 px-5">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className="bg-white rounded-2xl shadow-lg p-8 md:p-10">
              <h2 className="text-3xl font-space-grotesk font-bold text-botai-black mb-6">
                Send Us A Message
              </h2>

              {submitted && (
                <div className="mb-6 p-4 bg-botai-accent-green/10 border-l-4 border-botai-accent-green rounded-lg">
                  <p className="text-botai-accent-green font-noto-sans">
                    Thank you! Your message has been sent successfully.
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-space-grotesk font-medium text-botai-text mb-2">
                    Your Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-botai-text/20 focus:outline-none focus:ring-2 focus:ring-botai-accent-green font-noto-sans"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-space-grotesk font-medium text-botai-text mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-botai-text/20 focus:outline-none focus:ring-2 focus:ring-botai-accent-green font-noto-sans"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-space-grotesk font-medium text-botai-text mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-botai-text/20 focus:outline-none focus:ring-2 focus:ring-botai-accent-green font-noto-sans"
                    placeholder="How can we help?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-space-grotesk font-medium text-botai-text mb-2">
                    Message
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    className="w-full px-4 py-3 rounded-xl border border-botai-text/20 focus:outline-none focus:ring-2 focus:ring-botai-accent-green font-noto-sans resize-none"
                    placeholder="Tell us more about your inquiry..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full px-8 py-4 bg-botai-accent-green text-white rounded-full font-space-grotesk font-medium text-lg hover:bg-botai-black transition-colors"
                >
                  Send Message
                </button>
              </form>
            </div>

            {/* Contact Info */}
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-space-grotesk font-bold text-botai-black mb-6">
                  Contact Information
                </h2>
                <p className="text-botai-text/70 font-noto-sans mb-8">
                  Choose your preferred way to reach us. We're available to assist you with any questions about our platform.
                </p>
              </div>

              {/* Contact Cards */}
              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-botai-accent-green/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Mail className="w-6 h-6 text-botai-accent-green" />
                    </div>
                    <div>
                      <h3 className="text-xl font-space-grotesk font-bold text-botai-black mb-2">
                        Email Us
                      </h3>
                      <p className="text-botai-text/70 font-noto-sans mb-2">
                        For general inquiries and support
                      </p>
                      <a href="mailto:info@botai.demo" className="text-botai-text font-noto-sans hover:underline">
                        info@botai.demo
                      </a>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-botai-accent-blue/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-6 h-6 text-botai-accent-blue" />
                    </div>
                    <div>
                      <h3 className="text-xl font-space-grotesk font-bold text-botai-black mb-2">
                        Live Chat
                      </h3>
                      <p className="text-botai-text/70 font-noto-sans mb-2">
                        Chat with our support team
                      </p>
                      <Link
                        to={user ? '/account?tab=help-center' : '/login?redirect=/account?tab=help-center'}
                        className="text-botai-text font-noto-sans hover:underline"
                      >
                        {user ? 'Open Live Chat' : 'Login to start chat'}
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

