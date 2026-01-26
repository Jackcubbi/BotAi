import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MessageSquare, Send, Shield, User, RefreshCcw, Archive, Trash2 } from 'lucide-react';
import apiClient from '../../lib/api';
import ConfirmDialog from '../../components/shared/ConfirmDialog';

export default function AdminSupportChat() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [selectedHistoryId, setSelectedHistoryId] = useState<number | null>(null);
  const [selectedHistory, setSelectedHistory] = useState<any>(null);
  const [historyMessages, setHistoryMessages] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [isArchiveConfirmOpen, setIsArchiveConfirmOpen] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isDeleteActiveConfirmOpen, setIsDeleteActiveConfirmOpen] = useState(false);
  const [isDeletingActive, setIsDeletingActive] = useState(false);
  const [isDeleteHistoryConfirmOpen, setIsDeleteHistoryConfirmOpen] = useState(false);
  const [isDeletingHistory, setIsDeletingHistory] = useState(false);
  const [continuingHistoryId, setContinuingHistoryId] = useState<number | null>(null);
  const [isStartingConversation, setIsStartingConversation] = useState(false);
  const selectedUserIdRef = useRef<number | null>(null);
  const selectedHistoryIdRef = useRef<number | null>(null);
  const selectedConversationIdRef = useRef<number | null>(null);

  const loadConversations = async (searchValue = searchTerm) => {
    const response = await apiClient.getAdminSupportConversations({
      page: 1,
      limit: 200,
      search: searchValue.trim() || undefined,
    });

    if (response.success && response.data) {
      const items = response.data.conversations || [];
      setConversations(items);
      setError('');

      if (items.length === 0) {
        setSelectedUserId(null);
        setSelectedConversation(null);
        setMessages([]);
        return;
      }

      if (!selectedUserId) {
        setSelectedUserId(items[0].user_id);
        setSelectedConversation(items[0]);
        setSelectedHistoryId(null);
        setSelectedHistory(null);
        setHistoryMessages([]);
        return;
      }

      const stillExists = items.find((item: any) => item.user_id === selectedUserId);
      if (stillExists) {
        setSelectedConversation(stillExists);
      } else {
        setSelectedUserId(items[0].user_id);
        setSelectedConversation(items[0]);
        setSelectedHistoryId(null);
        setSelectedHistory(null);
        setHistoryMessages([]);
        setMessages([]);
      }
    } else {
      setError(response.error || 'Failed to load support conversations');
    }
  };

  const loadSelectedConversation = async (conversationId?: number | null) => {
    const targetConversationId = conversationId ?? selectedConversation?.id;
    if (!targetConversationId) {
      setMessages([]);
      return;
    }

    const requestedUserId = selectedUserIdRef.current;
    const response = await apiClient.getAdminSupportMessages(targetConversationId);
    if (response.success && response.data) {
      const conversationUserId = response.data.conversation?.user_id;
      if (!requestedUserId || conversationUserId !== requestedUserId) {
        return;
      }
      setSelectedConversation(response.data.conversation);
      setMessages(response.data.messages || []);
      setError('');
    } else {
      setError(response.error || 'Failed to load conversation messages');
    }
  };

  const loadHistory = async (userId?: number | null) => {
    if (!userId) {
      setHistoryItems([]);
      setSelectedHistoryId(null);
      setSelectedHistory(null);
      setHistoryMessages([]);
      return;
    }

    setHistoryLoading(true);
    const response = await apiClient.getAdminSupportHistory({ user_id: userId, page: 1, limit: 100 });
    if (response.success && response.data) {
      const items = response.data.history || [];
      setHistoryItems(items);

      if (items.length === 0) {
        setSelectedHistoryId(null);
        setSelectedHistory(null);
        setHistoryMessages([]);
      } else if (!selectedHistoryId || !items.find((item: any) => item.id === selectedHistoryId)) {
        setSelectedHistoryId(items[0].id);
        setSelectedHistory(items[0]);
      } else {
        const current = items.find((item: any) => item.id === selectedHistoryId);
        setSelectedHistory(current || null);
      }

      setError('');
    } else {
      setError(response.error || 'Failed to load support history');
    }
    setHistoryLoading(false);
  };

  const loadHistoryMessages = async (historyId?: number | null) => {
    const targetHistoryId = historyId ?? selectedHistoryId;
    if (!targetHistoryId) {
      setHistoryMessages([]);
      return;
    }

    const requestedHistoryId = targetHistoryId;
    const requestedUserId = selectedUserIdRef.current;
    const response = await apiClient.getAdminSupportHistoryMessages(targetHistoryId);
    if (response.success && response.data) {
      const responseHistoryId = response.data.history?.id;
      const responseUserId = response.data.history?.user_id;
      if (responseHistoryId !== requestedHistoryId) {
        return;
      }
      if (requestedUserId && responseUserId && responseUserId !== requestedUserId) {
        return;
      }
      if (selectedHistoryIdRef.current && selectedHistoryIdRef.current !== requestedHistoryId) {
        return;
      }
      setSelectedHistory(response.data.history);
      setHistoryMessages(response.data.messages || []);
      setError('');
    } else {
      setError(response.error || 'Failed to load history messages');
    }
  };

  useEffect(() => {
    selectedUserIdRef.current = selectedUserId;
  }, [selectedUserId]);

  useEffect(() => {
    selectedHistoryIdRef.current = selectedHistoryId;
  }, [selectedHistoryId]);

  useEffect(() => {
    selectedConversationIdRef.current = selectedConversation?.id ?? null;
  }, [selectedConversation?.id]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await loadConversations();
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    const selectedItem = conversations.find((item) => item.user_id === selectedUserId);
    if (!selectedItem) {
      setSelectedConversation(null);
      setMessages([]);
      return;
    }

    setSelectedConversation(selectedItem);
    if (!selectedItem.id) {
      setMessages([]);
    }
  }, [selectedUserId, conversations]);

  useEffect(() => {
    if (!selectedUserId) {
      return;
    }

    const loadCurrentSelection = async () => {
      const currentConversationId = selectedConversationIdRef.current;
      if (currentConversationId) {
        await loadSelectedConversation(currentConversationId);
      } else {
        setMessages([]);
      }

      if (showHistory && selectedUserIdRef.current) {
        await loadHistory(selectedUserIdRef.current);
      }
    };

    loadCurrentSelection();

    const intervalId = window.setInterval(() => {
      loadConversations();

      const currentConversationId = selectedConversationIdRef.current;
      if (currentConversationId) {
        loadSelectedConversation(currentConversationId);
      }

      if (showHistory && selectedUserIdRef.current) {
        loadHistory(selectedUserIdRef.current);
      }
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [selectedUserId, showHistory]);

  useEffect(() => {
    if (!showHistory || !selectedHistoryId) return;
    loadHistoryMessages(selectedHistoryId);
  }, [selectedHistoryId, showHistory]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadConversations(searchTerm);
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim() || !selectedUserId) return;

    let targetConversationId = selectedConversation?.id;

    if (!targetConversationId) {
      setIsStartingConversation(true);
      const startResponse = await apiClient.startAdminSupportConversation(selectedUserId);
      if (startResponse.success && startResponse.data) {
        targetConversationId = startResponse.data.conversation?.id;
        setSelectedConversation(startResponse.data.conversation);
        setMessages(startResponse.data.messages || []);
      } else {
        setError(startResponse.error || 'Failed to start support conversation');
      }
      setIsStartingConversation(false);
    }

    if (!targetConversationId) return;

    setSending(true);
    const response = await apiClient.sendAdminSupportMessage(targetConversationId, reply.trim());

    if (response.success && response.data) {
      setSelectedConversation(response.data.conversation);
      setMessages(response.data.messages || []);
      setReply('');
      await loadConversations();
      setError('');
    } else {
      setError(response.error || 'Failed to send reply');
    }
    setSending(false);
  };

  const handleStatusToggle = async () => {
    if (!selectedConversation?.id || !selectedConversation) return;

    const nextStatus = selectedConversation.status === 'open' ? 'closed' : 'open';
    const response = await apiClient.updateAdminSupportConversationStatus(selectedConversation.id, nextStatus);

    if (response.success && response.data) {
      const updatedConversation = response.data.conversation;
      setSelectedConversation(updatedConversation || null);
      if (!updatedConversation) {
        setMessages([]);
        setShowHistory(true);
        if (selectedUserId) {
          await loadHistory(selectedUserId);
        }
      }
      await loadConversations();
      setError('');
    } else {
      setError(response.error || 'Failed to update status');
    }
  };

  const handleArchiveConversation = () => {
    if (!selectedConversation?.id) return;
    setIsArchiveConfirmOpen(true);
  };

  const confirmArchiveConversation = async () => {
    if (!selectedConversation?.id) return;

    setIsArchiving(true);
    const response = await apiClient.archiveAdminSupportConversation(selectedConversation.id);
    if (response.success) {
      setSelectedConversation(null);
      setMessages([]);
      if (selectedUserId) {
        await loadHistory(selectedUserId);
      }
      await loadConversations();
      setIsArchiveConfirmOpen(false);
      setError('');
    } else {
      setError(response.error || 'Failed to archive chat');
    }
    setIsArchiving(false);
  };

  const handleDeleteActiveChat = () => {
    if (!selectedConversation?.id) return;
    setIsDeleteActiveConfirmOpen(true);
  };

  const confirmDeleteActiveChat = async () => {
    if (!selectedConversation?.id) return;

    setIsDeletingActive(true);
    const response = await apiClient.deleteAdminSupportConversation(selectedConversation.id);
    if (response.success) {
      setSelectedConversation(null);
      setMessages([]);
      await loadConversations();
      setIsDeleteActiveConfirmOpen(false);
      setError('');
    } else {
      setError(response.error || 'Failed to remove chat');
    }
    setIsDeletingActive(false);
  };

  const handleDeleteHistory = () => {
    if (!selectedHistoryId) return;
    setIsDeleteHistoryConfirmOpen(true);
  };

  const confirmDeleteHistory = async () => {
    if (!selectedHistoryId) return;

    setIsDeletingHistory(true);
    const response = await apiClient.deleteAdminSupportHistory(selectedHistoryId);
    if (response.success) {
      if (selectedUserId) {
        await loadHistory(selectedUserId);
      }
      setIsDeleteHistoryConfirmOpen(false);
      setError('');
    } else {
      setError(response.error || 'Failed to remove chat history');
    }
    setIsDeletingHistory(false);
  };

  const handleContinueHistory = async (historyId: number) => {
    setContinuingHistoryId(historyId);
    const response = await apiClient.continueAdminSupportHistory(historyId);

    if (response.success && response.data) {
      const restoredConversation = response.data.conversation;
      setShowHistory(false);
      setSelectedUserId(restoredConversation.user_id);
      setSelectedConversation(restoredConversation);
      setMessages(response.data.messages || []);
      await loadConversations();
      await loadSelectedConversation(restoredConversation.id);
      setError('');
    } else {
      setError(response.error || 'Failed to continue archived conversation');
    }

    setContinuingHistoryId(null);
  };

  const statusBadge = useMemo(() => {
    if (!selectedConversation?.id) {
      return {
        label: 'No Chat',
        className: 'bg-gray-100 text-gray-700 border border-gray-200',
      };
    }

    const isClosed = selectedConversation?.status === 'closed';
    return {
      label: isClosed ? 'Closed' : 'Open',
      className: isClosed
        ? 'bg-red-100 text-red-700 border border-red-200'
        : 'bg-green-100 text-green-700 border border-green-200',
    };
  }, [selectedConversation?.status]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-botai-accent-green border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-space-grotesk font-bold text-4xl text-botai-dark mb-2">Support Chat</h1>
        <p className="font-noto-sans text-botai-text">Handle client support conversations in real time.</p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl  shadow-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-botai-grey-line flex items-center justify-between">
            <h2 className="font-space-grotesk font-semibold text-botai-dark">Conversations</h2>
            <button
              type="button"
              onClick={() => loadConversations(searchTerm)}
              className="text-botai-text hover:text-botai-dark"
              title="Refresh"
            >
              <RefreshCcw className="w-4 h-4" />
            </button>
          </div>

          <div className="px-4 py-3 border-b border-botai-grey-line">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by user name or email..."
              className="w-full px-3 py-2 rounded-lg border border-botai-grey-line focus:outline-none focus:ring-2 focus:ring-botai-accent-green"
            />
          </div>

          <div className="max-h-[560px] overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-6 text-center text-botai-text">No users found.</div>
            ) : (
              conversations.map((conversation) => (
                <button
                  key={conversation.user_id}
                  type="button"
                  onClick={() => {
                    setSelectedUserId(conversation.user_id);
                    setSelectedConversation(conversation);
                    setMessages([]);
                    setSelectedHistoryId(null);
                    setSelectedHistory(null);
                    setHistoryMessages([]);
                  }}
                  className={`w-full text-left px-4 py-3 border-b border-botai-grey-bg hover:bg-botai-grey-bg/40 transition-colors ${selectedUserId === conversation.user_id ? 'bg-botai-accent-green/10' : ''}`}
                >
                  {(() => {
                    const fallbackUnread = conversation?.id && conversation?.status === 'open' && conversation?.last_sender_role === 'user' ? 1 : 0;
                    const unreadCount = Number(conversation?.unread_count ?? fallbackUnread);
                    return (
                      <>
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-space-grotesk font-semibold text-botai-dark truncate">{conversation.full_name || conversation.email}</p>
                    <div className="flex items-center gap-1.5">
                      {conversation?.id && conversation?.status === 'open' && unreadCount > 0 && (
                        <span className="min-w-[20px] h-5 px-1 rounded-full text-[11px] font-bold bg-red-500 text-white flex items-center justify-center">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${conversation.id ? (conversation.status === 'closed' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700') : 'bg-gray-100 text-gray-700'}`}>
                        {conversation.id ? conversation.status : 'no chat'}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-botai-text truncate mt-1">{conversation.email}</p>
                  <p className="text-sm text-botai-text truncate mt-1">{conversation.last_message_preview || 'No messages yet'}</p>
                      </>
                    );
                  })()}
                </button>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl  shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-botai-grey-line flex items-center justify-between">
            <div>
              <h2 className="font-space-grotesk font-semibold text-botai-dark">
                {selectedConversation ? (selectedConversation.full_name || selectedConversation.email) : 'Select a conversation'}
              </h2>
              <p className="text-sm text-botai-text">{selectedConversation?.id ? `Conversation #${selectedConversation.id}` : 'No conversation started yet'}</p>
            </div>

            {selectedConversation?.id && (
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBadge.className}`}>
                  {statusBadge.label}
                </span>
                <button
                  type="button"
                  onClick={handleStatusToggle}
                  className="px-3 py-1.5 rounded-lg border border-botai-grey-line text-sm text-botai-dark hover:border-botai-dark transition-colors"
                >
                  Mark as {selectedConversation.status === 'open' ? 'Closed' : 'Open'}
                </button>
                <button
                  type="button"
                  onClick={handleArchiveConversation}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-amber-200 text-sm text-amber-700 hover:bg-amber-50 transition-colors"
                >
                  <Archive className="w-4 h-4" />
                  Archive Chat
                </button>
                <button
                  type="button"
                  onClick={handleDeleteActiveChat}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-200 text-sm text-red-700 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove Chat
                </button>
              </div>
            )}

            {selectedUserId && (
              <button
                type="button"
                onClick={async () => {
                  const next = !showHistory;
                  setShowHistory(next);
                  if (next && selectedUserId) {
                    await loadHistory(selectedUserId);
                  }
                }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-botai-grey-line text-sm text-botai-dark hover:border-botai-dark transition-colors"
              >
                <Archive className="w-4 h-4" />
                {showHistory ? 'Back to Active Chat' : 'View Chat History'}
              </button>
            )}
          </div>

          <div className="h-[460px] overflow-y-auto p-6 space-y-4 bg-botai-grey-bg/30">
            {showHistory ? (
              historyLoading ? (
                <div className="h-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-4 border-botai-accent-green border-t-transparent"></div>
                </div>
              ) : historyItems.length === 0 ? (
                <div className="h-full flex items-center justify-center text-center text-botai-text">
                  <div>
                    <Archive className="w-10 h-10 mx-auto mb-3 text-botai-grey-line" />
                    <p>No archived chats for this user yet.</p>
                  </div>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4 h-full">
                  <div className="space-y-2 overflow-y-auto max-h-[420px] pr-1">
                    {historyItems.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => setSelectedHistoryId(item.id)}
                        className={`w-full text-left p-3 rounded-lg border transition-colors cursor-pointer ${selectedHistoryId === item.id ? 'border-botai-accent-green bg-botai-accent-green/10' : 'border-botai-grey-line hover:bg-botai-accent-green/10 '}`}
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
                                handleContinueHistory(item.id);
                              }}
                              disabled={continuingHistoryId === item.id}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-botai-dark text-white text-xs font-space-grotesk hover:bg-botai-black transition-colors disabled:opacity-60"
                            >
                              {continuingHistoryId === item.id ? 'Continuing...' : 'Continue Chat'}
                            </button>
                          </div>
                        )}
                            </>
                          );
                        })()}
                      </div>
                    ))}
                  </div>

                  <div className="bg-white rounded-xl border border-botai-grey-line p-4 overflow-y-auto max-h-[420px]">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-space-grotesk font-semibold text-botai-dark">
                        {selectedHistory ? `History #${selectedHistory.id}` : 'Select history'}
                      </h3>
                      {selectedHistoryId && (
                        <button
                          type="button"
                          onClick={handleDeleteHistory}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 text-xs text-red-700 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Remove History
                        </button>
                      )}
                    </div>

                    {historyMessages.length === 0 ? (
                      <p className="text-sm text-botai-text">No history messages.</p>
                    ) : (
                      <div className="space-y-3">
                        {historyMessages.map((message) => {
                          const isAdmin = message.sender_role === 'admin';
                          return (
                            <div key={message.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[90%] rounded-xl px-3 py-2 ${isAdmin ? 'bg-botai-dark text-white' : 'bg-botai-grey-bg border border-botai-grey-line'}`}>
                                <p className="text-xs font-semibold mb-1">{isAdmin ? 'Admin' : (message.full_name || message.email || 'User')}</p>
                                <p className="text-sm">{message.message}</p>
                                <p className={`text-[11px] mt-1 ${isAdmin ? 'text-white/75' : 'text-botai-text'}`}>{message.created_at}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )
            ) : !selectedConversation ? (
              <div className="h-full flex items-center justify-center text-center text-botai-text">
                <div>
                  <MessageSquare className="w-10 h-10 mx-auto mb-3 text-botai-grey-line" />
                  <p>Select a conversation from the left panel.</p>
                </div>
              </div>
            ) : !selectedConversation?.id ? (
              <div className="h-full flex items-center justify-center text-center text-botai-text">
                <div>
                  <MessageSquare className="w-10 h-10 mx-auto mb-3 text-botai-grey-line" />
                  <p>This user has no support conversation yet.</p>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center text-botai-text">
                <div>
                  <MessageSquare className="w-10 h-10 mx-auto mb-3 text-botai-grey-line" />
                  <p>No messages yet.</p>
                </div>
              </div>
            ) : (
              messages.map((message) => {
                const isAdmin = message.sender_role === 'admin';
                return (
                  <div key={message.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${isAdmin ? 'bg-botai-dark text-white' : 'bg-white border border-botai-grey-line'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        {isAdmin ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4 text-botai-accent-green" />}
                        <span className="text-xs font-semibold uppercase tracking-wide">{isAdmin ? 'Admin' : (message.full_name || message.email || 'User')}</span>
                      </div>
                      <p className={`font-noto-sans text-sm ${isAdmin ? 'text-white' : 'text-botai-dark'}`}>{message.message}</p>
                      <p className={`text-[11px] mt-2 ${isAdmin ? 'text-white/75' : 'text-botai-text'}`}>{message.created_at}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <form onSubmit={handleSendReply} className="p-4 border-t border-botai-grey-line flex items-center gap-3">
            <input
              type="text"
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder={
                showHistory
                  ? 'History view is read-only'
                  : selectedConversation?.status === 'closed'
                    ? 'Conversation is closed. Mark as Open to reply.'
                    : (selectedConversation?.id ? 'Type your reply...' : 'Select a user with an active conversation')
              }
              className="flex-1 px-4 py-3 rounded-xl border border-botai-grey-line focus:outline-none focus:ring-2 focus:ring-botai-accent-green"
              disabled={showHistory || !selectedUserId || selectedConversation?.status === 'closed' || sending || isStartingConversation}
            />
            <button
              type="submit"
              disabled={showHistory || !selectedUserId || selectedConversation?.status === 'closed' || sending || isStartingConversation || !reply.trim()}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-botai-dark text-white font-space-grotesk font-semibold hover:bg-botai-black transition-colors disabled:opacity-60"
            >
              <Send className="w-4 h-4" />
              Reply
            </button>
          </form>
        </div>
      </div>

      <ConfirmDialog
        isOpen={isArchiveConfirmOpen}
        onClose={() => {
          if (!isArchiving) setIsArchiveConfirmOpen(false);
        }}
        onConfirm={confirmArchiveConversation}
        title="Archive Chat"
        message="Archive this chat? It will be moved to history and removed from active chats."
        confirmText="Archive"
        cancelText="Cancel"
        type="warning"
        isLoading={isArchiving}
      />

      <ConfirmDialog
        isOpen={isDeleteActiveConfirmOpen}
        onClose={() => {
          if (!isDeletingActive) setIsDeleteActiveConfirmOpen(false);
        }}
        onConfirm={confirmDeleteActiveChat}
        title="Remove Active Chat"
        message="Remove this active chat and all its messages?"
        confirmText="Remove"
        cancelText="Cancel"
        type="danger"
        isLoading={isDeletingActive}
      />

      <ConfirmDialog
        isOpen={isDeleteHistoryConfirmOpen}
        onClose={() => {
          if (!isDeletingHistory) setIsDeleteHistoryConfirmOpen(false);
        }}
        onConfirm={confirmDeleteHistory}
        title="Remove History"
        message="Remove this archived chat history permanently?"
        confirmText="Remove"
        cancelText="Cancel"
        type="danger"
        isLoading={isDeletingHistory}
      />
    </div>
  );
}
