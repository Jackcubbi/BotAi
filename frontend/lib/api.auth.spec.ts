import { describe, it, expect, beforeEach } from 'vitest';
import { apiClient } from '../lib/api';

describe('Authentication Flow', () => {
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'Test123!@#';
  let authToken: string;
  let userId: number;

  describe('Registration', () => {
    it('should register a new user successfully', async () => {
      const response = await apiClient.register({
        email: testEmail,
        password: testPassword,
        firstName: 'Test',
        lastName: 'User',
        phone: '1234567890'
      });

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.data.user).toBeDefined();
      expect(response.data.token).toBeDefined();
      expect(response.data.user.email).toBe(testEmail.toLowerCase());

      authToken = response.data.token;
      userId = response.data.user.id;
    });

    it('should reject registration with existing email', async () => {
      const response = await apiClient.register({
        email: testEmail,
        password: testPassword,
        firstName: 'Test',
        lastName: 'User'
      });

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
    });

    it('should reject weak passwords', async () => {
      const response = await apiClient.register({
        email: `new-${Date.now()}@example.com`,
        password: '12345', // Too short
        firstName: 'Test',
        lastName: 'User'
      });

      expect(response.success).toBe(false);
    });

    it('should reject invalid email formats', async () => {
      const response = await apiClient.register({
        email: 'invalid-email',
        password: testPassword,
        firstName: 'Test',
        lastName: 'User'
      });

      expect(response.success).toBe(false);
    });
  });

  describe('Login', () => {
    it('should login with valid credentials', async () => {
      const response = await apiClient.login(testEmail, testPassword);

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.data.user).toBeDefined();
      expect(response.data.token).toBeDefined();
      expect(response.data.user.email).toBe(testEmail.toLowerCase());
    });

    it('should reject invalid email', async () => {
      const response = await apiClient.login('nonexistent@example.com', testPassword);

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
    });

    it('should reject wrong password', async () => {
      const response = await apiClient.login(testEmail, 'WrongPassword123!');

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
    });
  });

  describe('Email Availability Check', () => {
    it('should confirm existing email is not available', async () => {
      const response = await apiClient.checkEmailAvailability(testEmail);

      expect(response.success).toBe(true);
      expect(response.data.exists).toBe(true);
      expect(response.data.available).toBe(false);
    });

    it('should confirm new email is available', async () => {
      const response = await apiClient.checkEmailAvailability(`available-${Date.now()}@example.com`);

      expect(response.success).toBe(true);
      expect(response.data.exists).toBe(false);
      expect(response.data.available).toBe(true);
    });
  });
});

