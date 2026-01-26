// API base configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  details?: any;
}

class ApiClient {
  private getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${API_BASE_URL}${endpoint}`;

      // Add auth token if available
      const token = this.getAuthToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Check if response has content and is JSON
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch (jsonError) {
          console.error('Failed to parse JSON response:', jsonError);
          return {
            success: false,
            error: 'Invalid response format',
          };
        }
      } else {
        // If not JSON, try to get text for error messages
        try {
          const text = await response.text();
          data = { error: (text && text.trim()) || `HTTP ${response.status}: ${response.statusText}` };
        } catch (textError) {
          data = { error: `HTTP ${response.status}: ${response.statusText}` };
        }
      }

      if (!response.ok) {
        const backendError = data?.error || data?.detail;
        return {
          success: false,
          error: backendError || `HTTP ${response.status}: ${response.statusText}`,
          details: data?.details || data?.detail,
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred',
      };
    }
  }

  // Authentication APIs
  async register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }) {
    // Backend expects full_name, not firstName/lastName
    const { firstName, lastName, phone, ...rest } = userData;
    const full_name = `${firstName} ${lastName}`.trim();

    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        ...rest,
        full_name,
      }),
    });
  }

  async login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async checkEmailAvailability(email: string) {
    return this.request(`/auth/check-email?email=${encodeURIComponent(email)}`);
  }

  async getUserProfile(userId: number) {
    return this.request(`/auth/profile/${userId}`);
  }

  async updateMyProfile(data: { email?: string; full_name?: string }) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Product APIs
  async getProducts() {
    return this.request('/products');
  }

  async getProduct(id: number) {
    return this.request(`/products/${id}`);
  }

  // Cart APIs
  async getCart() {
    return this.request('/cart');
  }

  async addToCart(productId: number, quantity: number, size?: string, color?: string) {
    return this.request('/cart/add', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity, size, color }),
    });
  }

  async updateCartItem(productId: number, quantity: number, size?: string, color?: string) {
    return this.request('/cart/update', {
      method: 'PUT',
      body: JSON.stringify({ productId, quantity, size, color }),
    });
  }

  async removeFromCart(productId: number, size?: string, color?: string) {
    const params = new URLSearchParams();
    if (size) params.append('size', size);
    if (color) params.append('color', color);
    const queryString = params.toString();

    return this.request(`/cart/remove/${productId}${queryString ? `?${queryString}` : ''}`, {
      method: 'DELETE',
    });
  }

  async clearCart() {
    return this.request('/cart/clear', {
      method: 'DELETE',
    });
  }

  // Order APIs
  async createOrder(shippingAddressId?: number) {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify({ shippingAddressId }),
    });
  }

  async getUserOrders() {
    return this.request('/orders');
  }

  async getOrder(id: number) {
    return this.request(`/orders/${id}`);
  }

  // Bot APIs
  async getBots(params?: { page?: number; limit?: number; category?: string; creator_id?: number; is_public?: boolean }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }
    const queryString = queryParams.toString();
    return this.request(`/bots${queryString ? `?${queryString}` : ''}`);
  }

  async getMyBots(params?: { page?: number; limit?: number }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }
    const queryString = queryParams.toString();
    return this.request(`/bots/my-bots${queryString ? `?${queryString}` : ''}`);
  }

  async getMarketplaceBots(params?: { page?: number; limit?: number; category?: string }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }
    const queryString = queryParams.toString();
    return this.request(`/bots/marketplace${queryString ? `?${queryString}` : ''}`);
  }

  async getBot(id: number) {
    return this.request(`/bots/${id}`);
  }

  async getPublicBotStats() {
    return this.request<{
      active_bots: number;
      total_conversations: number;
      total_creators: number;
    }>(`/bots/public-stats`);
  }

  // Support Chat APIs (Client)
  async getMySupportConversation(markRead: boolean = false) {
    const query = markRead ? '?mark_read=true' : '';
    return this.request<{
      conversation: any;
      messages: any[];
    }>(`/support/my-conversation${query}`);
  }

  async sendMySupportMessage(message: string) {
    return this.request<{
      conversation: any;
      messages: any[];
    }>(`/support/my-conversation/messages`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  async updateMySupportConversationStatus(status: 'open' | 'closed') {
    return this.request<{
      message: string;
      conversation: any;
    }>(`/support/my-conversation/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async getMySupportHistory(params?: { page?: number; limit?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', String(params.page));
    if (params?.limit) queryParams.append('limit', String(params.limit));
    const queryString = queryParams.toString();

    return this.request<{
      history: any[];
      page: number;
      limit: number;
    }>(`/support/my-history${queryString ? `?${queryString}` : ''}`);
  }

  async getMySupportHistoryMessages(historyId: number) {
    return this.request<{
      history: any;
      messages: any[];
    }>(`/support/my-history/${historyId}/messages`);
  }

  async continueMySupportHistory(historyId: number) {
    return this.request<{
      message: string;
      conversation: any;
      messages: any[];
      history: any;
    }>(`/support/my-history/${historyId}/continue`, {
      method: 'POST',
    });
  }

  // Support Chat APIs (Admin)
  async getAdminSupportConversations(params?: { status?: 'open' | 'closed'; page?: number; limit?: number; search?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', String(params.page));
    if (params?.limit) queryParams.append('limit', String(params.limit));
    if (params?.search) queryParams.append('search', params.search);
    const queryString = queryParams.toString();

    return this.request<{
      conversations: any[];
      page: number;
      limit: number;
    }>(`/support/admin/conversations${queryString ? `?${queryString}` : ''}`);
  }

  async getAdminSupportMessages(conversationId: number) {
    return this.request<{
      conversation: any;
      messages: any[];
    }>(`/support/admin/conversations/${conversationId}/messages`);
  }

  async startAdminSupportConversation(userId: number) {
    return this.request<{
      message: string;
      conversation: any;
      messages: any[];
    }>(`/support/admin/users/${userId}/start-conversation`, {
      method: 'POST',
    });
  }

  async sendAdminSupportMessage(conversationId: number, message: string) {
    return this.request<{
      conversation: any;
      messages: any[];
    }>(`/support/admin/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  async updateAdminSupportConversationStatus(conversationId: number, status: 'open' | 'closed') {
    return this.request<{
      message: string;
      conversation: any;
      archived_conversation?: any;
    }>(`/support/admin/conversations/${conversationId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async archiveAdminSupportConversation(conversationId: number) {
    return this.request<{
      message: string;
      archived_conversation: any;
    }>(`/support/admin/conversations/${conversationId}/archive`, {
      method: 'POST',
    });
  }

  async deleteAdminSupportConversation(conversationId: number) {
    return this.request<{ message: string }>(`/support/admin/conversations/${conversationId}`, {
      method: 'DELETE',
    });
  }

  async getAdminSupportHistory(params?: { user_id?: number; page?: number; limit?: number; search?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.user_id) queryParams.append('user_id', String(params.user_id));
    if (params?.page) queryParams.append('page', String(params.page));
    if (params?.limit) queryParams.append('limit', String(params.limit));
    if (params?.search) queryParams.append('search', params.search);
    const queryString = queryParams.toString();

    return this.request<{
      history: any[];
      page: number;
      limit: number;
    }>(`/support/admin/history${queryString ? `?${queryString}` : ''}`);
  }

  async getAdminSupportHistoryMessages(historyId: number) {
    return this.request<{
      history: any;
      messages: any[];
    }>(`/support/admin/history/${historyId}/messages`);
  }

  async continueAdminSupportHistory(historyId: number) {
    return this.request<{
      message: string;
      conversation: any;
      messages: any[];
      history: any;
    }>(`/support/admin/history/${historyId}/continue`, {
      method: 'POST',
    });
  }

  async deleteAdminSupportHistory(historyId: number) {
    return this.request<{ message: string }>(`/support/admin/history/${historyId}`, {
      method: 'DELETE',
    });
  }

  async createBot(botData: any) {
    return this.request('/bots', {
      method: 'POST',
      body: JSON.stringify(botData),
    });
  }

  async updateBot(id: number, botData: any) {
    return this.request(`/bots/${id}`, {
      method: 'PUT',
      body: JSON.stringify(botData),
    });
  }

  async deleteBot(id: number) {
    return this.request(`/bots/${id}`, {
      method: 'DELETE',
    });
  }

  async chatWithBot(id: number, message: string, conversationId?: number) {
    return this.request(`/bots/${id}/chat`, {
      method: 'POST',
      body: JSON.stringify({ message, conversation_id: conversationId }),
    });
  }

  async generateBotImage(id: number, prompt: string) {
    return this.request(`/bots/${id}/generate-image`, {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    });
  }

  async generateBotAudio(id: number, prompt: string) {
    return this.request(`/bots/${id}/generate-audio`, {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    });
  }

  async generateBotVideo(id: number, prompt: string) {
    return this.request(`/bots/${id}/generate-video`, {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    });
  }

  async getBotConversations(id: number) {
    return this.request(`/bots/${id}/conversations`);
  }

  async getConversationMessages(conversationId: number) {
    return this.request(`/bots/conversations/${conversationId}/messages`);
  }

  async purchaseBot(id: number) {
    return this.request(`/bots/${id}/purchase`, {
      method: 'POST',
    });
  }

  async getMyPurchases() {
    return this.request('/bots/purchases/my-purchases');
  }

  async createBotReview(id: number, rating: number, comment?: string) {
    return this.request(`/bots/${id}/reviews`, {
      method: 'POST',
      body: JSON.stringify({ rating, comment }),
    });
  }

  async getBotReviews(id: number) {
    return this.request(`/bots/${id}/reviews`);
  }

  async getBotAnalytics(id: number) {
    return this.request(`/bots/${id}/analytics`);
  }

  // Admin APIs
  async getAdminStats() {
    return this.request('/admin/stats');
  }

  async getAdminAuditLogs(params?: {
    page?: number;
    limit?: number;
    actor_user_id?: number;
    action?: string;
    from_date?: string;
    to_date?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', String(params.page));
    if (params?.limit) queryParams.append('limit', String(params.limit));
    if (params?.actor_user_id) queryParams.append('actor_user_id', String(params.actor_user_id));
    if (params?.action) queryParams.append('action', params.action);
    if (params?.from_date) queryParams.append('from_date', params.from_date);
    if (params?.to_date) queryParams.append('to_date', params.to_date);
    const queryString = queryParams.toString();
    return this.request(`/admin/audit-logs${queryString ? `?${queryString}` : ''}`);
  }

  async getAdminUsers(params?: { page?: number; limit?: number; search?: string }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }
    const queryString = queryParams.toString();
    return this.request(`/admin/users${queryString ? `?${queryString}` : ''}`);
  }

  async getAdminUserDetails(userId: number) {
    return this.request(`/admin/users/${userId}`);
  }

  async getAdminRoles() {
    return this.request('/admin/roles');
  }

  async assignAdminUserRole(userId: number, roleName: 'super_admin' | 'admin' | 'manager' | 'user') {
    return this.request(`/admin/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role_name: roleName }),
    });
  }

  async updateAdminUser(userId: number, data: { full_name?: string; email?: string }) {
    return this.request(`/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteAdminUser(userId: number) {
    return this.request(`/admin/users/${userId}`, {
      method: 'DELETE',
    });
  }

  // Admin Bot Management
  async getAdminBots(params?: { page?: number; limit?: number; search?: string; category?: string; is_public?: boolean }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.is_public !== undefined) queryParams.append('is_public', params.is_public.toString());

    return this.request(`/admin/bots?${queryParams.toString()}`);
  }

  async getAdminBotDetails(botId: number) {
    return this.request(`/admin/bots/${botId}`);
  }

  async updateAdminBot(botId: number, data: any) {
    return this.request(`/admin/bots/${botId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteAdminBot(botId: number) {
    return this.request(`/admin/bots/${botId}`, {
      method: 'DELETE',
    });
  }

  async toggleAdminBotPublish(botId: number, isPublic: boolean) {
    return this.request(`/admin/bots/${botId}/publish`, {
      method: 'PUT',
      body: JSON.stringify({ is_public: isPublic }),
    });
  }

  // Admin Category Management
  async getAdminCategories() {
    return this.request('/admin/categories');
  }

  async getAdminCategoryDetails(categoryId: number) {
    return this.request(`/admin/categories/${categoryId}`);
  }

  async createAdminCategory(data: { name: string; description?: string; icon?: string }) {
    return this.request('/admin/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAdminCategory(categoryId: number, data: { name?: string; description?: string; icon?: string }) {
    return this.request(`/admin/categories/${categoryId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteAdminCategory(categoryId: number) {
    return this.request(`/admin/categories/${categoryId}`, {
      method: 'DELETE',
    });
  }

  // Admin Subcategory Management
  async getAdminSubcategories(categoryId?: number) {
    const params = categoryId ? `?category_id=${categoryId}` : '';
    return this.request(`/admin/subcategories${params}`);
  }

  async getAdminSubcategoryDetails(subcategoryId: number) {
    return this.request(`/admin/subcategories/${subcategoryId}`);
  }

  async createAdminSubcategory(data: { category_id: number; name: string; description?: string }) {
    return this.request('/admin/subcategories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAdminSubcategory(subcategoryId: number, data: { name?: string; description?: string; category_id?: number }) {
    return this.request(`/admin/subcategories/${subcategoryId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteAdminSubcategory(subcategoryId: number) {
    return this.request(`/admin/subcategories/${subcategoryId}`, {
      method: 'DELETE',
    });
  }
}

export const apiClient = new ApiClient();

// Default export for convenience
export default apiClient;
