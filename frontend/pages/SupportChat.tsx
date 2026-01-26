import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageSquare, Send, User, Shield, ArrowLeft, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../lib/api';

export default function SupportChat() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  const [messages, setMessages] = useState<any[]>([]);
  const [conversation, setConversation] = useState<any>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!user) {
      navigate('/login?redirect=/support-chat');
    }
  }, [isLoading, user, navigate]);

  const loadConversation = async (showLoader = false) => {
    if (!user) return;

    if (showLoader) {
      setLoading(true);
    }

    const response = await apiClient.getMySupportConversation();
    if (response.success && response.data) {
      setConversation(response.data.conversation);
      setMessages(response.data.messages || []);
      setError('');
    } else {
      setError(response.error || 'Failed to load support chat');
    }

    if (showLoader) {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;

    loadConversation(true);
    const intervalId = window.setInterval(() => loadConversation(false), 5000);
    return () => window.clearInterval(intervalId);
  }, [user]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setSending(true);
    const response = await apiClient.sendMySupportMessage(input.trim());

    if (response.success && response.data) {
      setConversation(response.data.conversation);
      setMessages(response.data.messages || []);
      setInput('');
      setError('');
    } else {
      setError(response.error || 'Failed to send message');
    }

    setSending(false);
  };

  const statusBadge = useMemo(() => {
    const isClosed = conversation?.status === 'closed';
    return {
      label: isClosed ? 'Closed' : 'Open',
      className: isClosed
        ? 'bg-red-100 text-red-700 border border-red-200'
        : 'bg-green-100 text-green-700 border border-green-200',
    };
  }, [conversation?.status]);

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-botai-grey-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-botai-accent-green border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-botai-grey-bg py-10 px-5">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-space-grotesk font-bold text-4xl text-botai-dark">Live Support Chat</h1>
            <p className="font-noto-sans text-botai-text mt-1">Chat directly with our support team.</p>
          </div>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-botai-grey-line text-botai-dark hover:border-botai-dark transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Contact
          </Link>
        </div>

        <div className="bg-white rounded-2xl  shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-botai-grey-line flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-botai-accent-blue/10 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-botai-accent-blue" />
              </div>
              <div>
                <p className="font-space-grotesk font-semibold text-botai-dark">Support Conversation</p>
                <p className="text-sm text-botai-text">Conversation ID: {conversation?.id || '-'}</p>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBadge.className}`}>
              {statusBadge.label}
            </span>
          </div>

          {error && (
            <div className="mx-6 mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <div className="h-[420px] overflow-y-auto px-6 py-5 space-y-4 bg-botai-grey-bg/30">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center text-botai-text">
                <div>
                  <MessageSquare className="w-10 h-10 mx-auto mb-3 text-botai-grey-line" />
                  <p>No messages yet.</p>
                  <p className="text-sm">Send your first message to support.</p>
                </div>
              </div>
            ) : (
              messages.map((message) => {
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

          <form onSubmit={handleSend} className="p-4 border-t border-botai-grey-line flex items-center gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message to support..."
              className="flex-1 px-4 py-3 rounded-xl border border-botai-grey-line focus:outline-none focus:ring-2 focus:ring-botai-accent-green"
              disabled={sending || conversation?.status === 'closed'}
            />
            <button
              type="submit"
              disabled={sending || !input.trim() || conversation?.status === 'closed'}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-botai-dark text-white font-space-grotesk font-semibold hover:bg-botai-black transition-colors disabled:opacity-60"
            >
              <Send className="w-4 h-4" />
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
