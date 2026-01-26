import { describe, it, expect, beforeAll } from 'vitest';
import { apiClient } from '../lib/api';

describe('Cart Operations', () => {
  let authToken: string;
  let userId: number;
  const testEmail = `cart-test-${Date.now()}@example.com`;

  beforeAll(async () => {
    // Create a test user for cart operations
    const registerResponse = await apiClient.register({
      email: testEmail,
      password: 'Test123!@#',
      firstName: 'Cart',
      lastName: 'Test'
    });

    if (registerResponse.success && registerResponse.data) {
      authToken = registerResponse.data.token;
      userId = registerResponse.data.user.id;
      // Store token for authenticated requests
      localStorage.setItem('auth_token', authToken);
    }
  });

  describe('Add to Cart', () => {
    it('should add item to cart', async () => {
      const response = await apiClient.addToCart(1, 2);

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
    });

    it('should require authentication', async () => {
      localStorage.removeItem('auth_token');
      const response = await apiClient.addToCart(1, 1);

      expect(response.success).toBe(false);

      // Restore token
      localStorage.setItem('auth_token', authToken);
    });
  });

  describe('Get Cart', () => {
    it('should retrieve user cart', async () => {
      const response = await apiClient.getCart();

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.data.cart).toBeDefined();
      expect(response.data.cart.items).toBeInstanceOf(Array);
    });
  });

  describe('Update Cart', () => {
    it('should update item quantity', async () => {
      const response = await apiClient.updateCartItem(1, 3);

      expect(response.success).toBe(true);
    });

    it('should remove item when quantity is 0', async () => {
      const response = await apiClient.updateCartItem(1, 0);

      expect(response.success).toBe(true);
    });
  });

  describe('Remove from Cart', () => {
    it('should remove specific item', async () => {
      // First add an item
      await apiClient.addToCart(2, 1);

      // Then remove it
      const response = await apiClient.removeFromCart(2);

      expect(response.success).toBe(true);
    });
  });

  describe('Clear Cart', () => {
    it('should clear entire cart', async () => {
      // Add some items first
      await apiClient.addToCart(1, 1);
      await apiClient.addToCart(2, 2);

      // Clear cart
      const response = await apiClient.clearCart();

      expect(response.success).toBe(true);

      // Verify cart is empty
      const cartResponse = await apiClient.getCart();
      expect(cartResponse.data.cart.items).toHaveLength(0);
    });
  });
});

