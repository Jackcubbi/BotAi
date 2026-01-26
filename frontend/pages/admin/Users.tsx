import React, { useState, useEffect } from 'react';
import {
  User,
  Bot,
  MessageSquare,
  ShoppingBag,
  Search,
  Eye,
  Edit,
  Trash2,
  X,
  Save,
  Calendar,
  Mail
} from 'lucide-react';
import apiClient from '../../lib/api';
import ConfirmDialog from '../../components/shared/ConfirmDialog';

interface UserData {
  id: number;
  email: string;
  full_name: string;
  roles?: string[];
  created_at: string;
  total_bots: number;
  public_bots: number;
  purchases: number;
  conversations: number;
}

interface BotData {
  id: number;
  name: string;
  description: string;
  category: string;
  is_public: boolean;
  total_conversations: number;
  average_rating: number;
  price: number;
}

interface UserDetails extends UserData {
  bots: BotData[];
}

export default function UsersManagement() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedUser, setSelectedUser] = useState<UserDetails | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [editingUser, setEditingUser] = useState<{
    id: number;
    full_name: string;
    email: string;
    role_name: 'super_admin' | 'admin' | 'manager' | 'user';
    original_role_name: 'super_admin' | 'admin' | 'manager' | 'user';
  } | null>(null);
  const [availableRoles, setAvailableRoles] = useState<Array<'super_admin' | 'admin' | 'manager' | 'user'>>(['super_admin', 'admin', 'manager', 'user']);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; userId: number | null; userEmail: string }>({ show: false, userId: null, userEmail: '' });
  const [isDeleting, setIsDeleting] = useState(false);
  const limit = 20;

  useEffect(() => {
    fetchUsers();
  }, [page, searchQuery]);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await apiClient.getAdminRoles();
      if (response.success && response.data) {
        const roles = ((response.data as any).roles || [])
          .map((role: any) => role?.name)
          .filter(Boolean);
        if (roles.length > 0) {
          setAvailableRoles(roles);
        }
      }
    } catch (error) {
      console.error('Failed to fetch roles:', error);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await apiClient.getAdminUsers({
        page,
        limit,
        search: searchQuery || undefined
      });

      if (response.success && response.data) {
        const data = response.data as any;
        setUsers(data.users || []);
        setTotal(data.total || 0);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetails = async (userId: number) => {
    try {
      const response = await apiClient.getAdminUserDetails(userId);
      if (response.success && response.data) {
        setSelectedUser(response.data as UserDetails);
        setShowDetails(true);
      }
    } catch (error) {
      console.error('Failed to fetch user details:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleEdit = (user: UserData) => {
    const currentRole = ((user.roles && user.roles[0]) || 'user') as 'super_admin' | 'admin' | 'manager' | 'user';
    setEditingUser({
      id: user.id,
      full_name: user.full_name || '',
      email: user.email,
      role_name: currentRole,
      original_role_name: currentRole,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;

    try {
      const updateResponse = await apiClient.updateAdminUser(editingUser.id, {
        full_name: editingUser.full_name,
        email: editingUser.email
      });

      if (!updateResponse.success) {
        alert(updateResponse.error || 'Failed to update user');
        return;
      }

      if (editingUser.role_name !== editingUser.original_role_name) {
        const roleResponse = await apiClient.assignAdminUserRole(editingUser.id, editingUser.role_name);
        if (!roleResponse.success) {
          alert(roleResponse.error || 'User updated, but failed to assign role');
          return;
        }
      }

      fetchUsers();
      setEditingUser(null);
    } catch (error) {
      console.error('Failed to update user:', error);
      alert('Failed to update user');
    }
  };

  const handleDeleteClick = (userId: number, userEmail: string) => {
    setDeleteConfirm({ show: true, userId, userEmail });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.userId) return;

    setIsDeleting(true);
    try {
      const response = await apiClient.deleteAdminUser(deleteConfirm.userId);
      if (response.success) {
        fetchUsers();
        if (selectedUser?.id === deleteConfirm.userId) {
          setShowDetails(false);
          setSelectedUser(null);
        }
        setDeleteConfirm({ show: false, userId: null, userEmail: '' });
      } else {
        alert(response.error || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert('Failed to delete user');
    } finally {
      setIsDeleting(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-space-grotesk font-bold text-4xl text-botai-dark mb-2">
          Users & Creators Management
        </h1>
        <p className="font-noto-sans text-botai-text">
          Manage platform users and bot creators
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-noto-sans text-botai-text text-sm mb-1">Total Users</p>
              <p className="font-space-grotesk font-bold text-3xl text-botai-dark">{total}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-botai-dark flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-noto-sans text-botai-text text-sm mb-1">Total Creators</p>
              <p className="font-space-grotesk font-bold text-3xl text-botai-dark">
                {users.filter(u => u.total_bots > 0).length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-botai-dark flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-noto-sans text-botai-text text-sm mb-1">Active Creators</p>
              <p className="font-space-grotesk font-bold text-3xl text-botai-dark">
                {users.filter(u => u.public_bots > 0).length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-botai-dark flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-noto-sans text-botai-text text-sm mb-1">Total Purchases</p>
              <p className="font-space-grotesk font-bold text-3xl text-botai-dark">
                {users.reduce((sum, u) => sum + u.purchases, 0)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-botai-dark flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <form onSubmit={handleSearch} className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-botai-text" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users by email or name..."
              className="w-full pl-10 pr-4 py-3 border border-botai-grey-line rounded-lg font-noto-sans focus:ring-2 focus:ring-botai-accent-green focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-botai-black text-white rounded-lg font-noto-sans font-semibold hover:bg-botai-dark transition-colors"
          >
            Search
          </button>
          {searchQuery && (
            <button
              type="button"
              onClick={() => { setSearchQuery(''); setPage(1); }}
              className="px-6 py-3 bg-botai-grey-light text-botai-dark rounded-lg font-noto-sans font-semibold hover:bg-botai-grey-line transition-colors"
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-botai-grey-bg">
              <tr>
                <th className="px-6 py-4 text-left font-space-grotesk font-bold text-botai-dark uppercase tracking-wide text-sm">
                  User
                </th>
                <th className="px-6 py-4 text-left font-space-grotesk font-bold text-botai-dark uppercase tracking-wide text-sm">
                  Bots Created
                </th>
                <th className="px-6 py-4 text-left font-space-grotesk font-bold text-botai-dark uppercase tracking-wide text-sm">
                  Conversations
                </th>
                <th className="px-6 py-4 text-left font-space-grotesk font-bold text-botai-dark uppercase tracking-wide text-sm">
                  Purchases
                </th>
                <th className="px-6 py-4 text-left font-space-grotesk font-bold text-botai-dark uppercase tracking-wide text-sm">
                  Joined
                </th>
                <th className="px-6 py-4 text-right font-space-grotesk font-bold text-botai-dark uppercase tracking-wide text-sm">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-botai-grey-line">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-4 border-botai-accent-green border-t-transparent"></div>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <p className="font-noto-sans text-botai-text">No users found</p>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-botai-grey-bg transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex border items-center justify-center text-white font-bold">
                          {user.email[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-noto-sans font-semibold text-botai-dark">
                            {user.full_name || 'No Name'}
                          </p>
                          <p className="font-noto-sans text-sm text-botai-text">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-noto-sans font-semibold text-botai-dark">
                          {user.total_bots}
                        </span>
                        {user.public_bots > 0 && (
                          <span className="px-2 py-1 bg-botai-accent-green rounded-full text-xs font-noto-sans font-semibold">
                            {user.public_bots} public
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-noto-sans text-botai-dark">{user.conversations}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-noto-sans text-botai-dark">{user.purchases}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-botai-text">
                        <Calendar className="w-4 h-4" />
                        <span className="font-noto-sans text-sm">
                          {new Date(user.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => fetchUserDetails(user.id)}
                          className="p-2 bg-botai-accent-blue hover:bg-botai-accent-green rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4 text-white" />
                        </button>
                        <button
                          onClick={() => handleEdit(user)}
                          className="p-2 bg-botai-grey-light hover:bg-botai-grey-line rounded-lg transition-colors"
                          title="Edit User"
                        >
                          <Edit className="w-4 h-4 text-botai-dark" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(user.id, user.email)}
                          className="p-2 bg-red-100 hover:bg-red-200 rounded-lg transition-colors"
                          title="Delete User"
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
                Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} users
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
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-space-grotesk font-bold text-2xl text-botai-dark">Edit User</h2>
              <button
                onClick={() => setEditingUser(null)}
                className="p-2 hover:bg-botai-grey-light rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block font-noto-sans font-semibold text-botai-dark mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editingUser.full_name}
                  onChange={(e) => setEditingUser({ ...editingUser, full_name: e.target.value })}
                  className="w-full px-4 py-3 border border-botai-grey-line rounded-lg font-noto-sans focus:ring-2 focus:ring-botai-accent-green focus:border-transparent"
                />
              </div>

              <div>
                <label className="block font-noto-sans font-semibold text-botai-dark mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="w-full px-4 py-3 border border-botai-grey-line rounded-lg font-noto-sans focus:ring-2 focus:ring-botai-accent-green focus:border-transparent"
                />
              </div>

              <div>
                <label className="block font-noto-sans font-semibold text-botai-dark mb-2">
                  Role
                </label>
                <select
                  value={editingUser.role_name}
                  onChange={(e) => setEditingUser({
                    ...editingUser,
                    role_name: e.target.value as 'super_admin' | 'admin' | 'manager' | 'user'
                  })}
                  className="w-full px-4 py-3 border border-botai-grey-line rounded-lg font-noto-sans focus:ring-2 focus:ring-botai-accent-green focus:border-transparent"
                >
                  {availableRoles.map((role) => (
                    <option key={role} value={role}>
                      {role === 'user'
                        ? 'Customer'
                        : role.replace('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase())}
                    </option>
                  ))}
                </select>
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
                  onClick={() => setEditingUser(null)}
                  className="px-6 py-3 bg-botai-grey-light text-botai-dark rounded-lg font-noto-sans font-semibold hover:bg-botai-grey-line transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {showDetails && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-8">
            <div className="sticky top-0 bg-white rounded-t-2xl border-b border-botai-grey-line px-6 py-4 flex items-center justify-between">
              <h2 className="font-space-grotesk font-bold text-2xl text-botai-dark">User Details</h2>
              <button
                onClick={() => { setShowDetails(false); setSelectedUser(null); }}
                className="p-2 hover:bg-botai-grey-light rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* User Info */}
              <div className="bg-botai-grey-bg rounded-xl p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-botai-accent-green to-botai-accent-blue flex items-center justify-center text-white font-bold text-2xl">
                    {selectedUser.email[0].toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-space-grotesk font-bold text-xl text-botai-dark">
                      {selectedUser.full_name || 'No Name'}
                    </h3>
                    <div className="flex items-center gap-2 text-botai-text">
                      <Mail className="w-4 h-4" />
                      <p className="font-noto-sans">{selectedUser.email}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="font-noto-sans text-sm text-botai-text mb-1">Total Bots</p>
                    <p className="font-space-grotesk font-bold text-2xl text-botai-dark">
                      {selectedUser.total_bots}
                    </p>
                  </div>
                  <div>
                    <p className="font-noto-sans text-sm text-botai-text mb-1">Public Bots</p>
                    <p className="font-space-grotesk font-bold text-2xl text-botai-dark">
                      {selectedUser.public_bots}
                    </p>
                  </div>
                  <div>
                    <p className="font-noto-sans text-sm text-botai-text mb-1">Conversations</p>
                    <p className="font-space-grotesk font-bold text-2xl text-botai-dark">
                      {selectedUser.conversations}
                    </p>
                  </div>
                  <div>
                    <p className="font-noto-sans text-sm text-botai-text mb-1">Purchases</p>
                    <p className="font-space-grotesk font-bold text-2xl text-botai-dark">
                      {selectedUser.purchases}
                    </p>
                  </div>
                </div>
              </div>

              {/* User's Bots */}
              <div>
                <h3 className="font-space-grotesk font-bold text-xl text-botai-dark mb-4">
                  Created Bots ({selectedUser.bots.length})
                </h3>

                {selectedUser.bots.length === 0 ? (
                  <div className="bg-botai-grey-bg rounded-xl p-8 text-center">
                    <Bot className="w-12 h-12 mx-auto mb-3 text-botai-grey-line" />
                    <p className="font-noto-sans text-botai-text">No bots created yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedUser.bots.map((bot) => (
                      <div key={bot.id} className="bg-botai-grey-bg rounded-xl p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-botai-accent-green to-botai-accent-blue flex items-center justify-center">
                              <Bot className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h4 className="font-space-grotesk font-bold text-botai-dark">
                                {bot.name}
                              </h4>
                              <p className="font-noto-sans text-xs text-botai-text">{bot.category}</p>
                            </div>
                          </div>
                          {bot.is_public ? (
                            <span className="px-2 py-1 bg-botai-accent-green rounded-full text-xs font-noto-sans font-semibold">
                              Public
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-botai-grey-light rounded-full text-xs font-noto-sans font-semibold text-botai-text">
                              Private
                            </span>
                          )}
                        </div>

                        <p className="font-noto-sans text-sm text-botai-text mb-3 line-clamp-2">
                          {bot.description}
                        </p>

                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-3">
                            <span className="font-noto-sans text-botai-text">
                              {bot.total_conversations} chats
                            </span>
                            <span className="font-noto-sans text-botai-text">
                              ★ {bot.average_rating.toFixed(1)}
                            </span>
                          </div>
                          <span className="font-space-grotesk font-bold text-botai-dark">
                            ${bot.price}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteConfirm.show}
        onClose={() => setDeleteConfirm({ show: false, userId: null, userEmail: '' })}
        onConfirm={handleDeleteConfirm}
        title="DELETE USER"
        message={`Are you sure you want to delete user ${deleteConfirm.userEmail}? This action cannot be undone and will remove all their data.`}
        confirmText="DELETE"
        cancelText="CANCEL"
        type="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
