import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function ValidationTest() {
  const { register, login } = useAuth();
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (result: string) => {
    setTestResults(prev => [...prev, result]);
    console.log(result);
  };

  const clearResults = () => {
    setTestResults([]);
    console.clear();
  };

  const runComprehensiveTests = async () => {
    clearResults();
    addResult('🔄 Starting Comprehensive Authentication Tests...');

    // Test 1: Email Format Validation
    addResult('\n=== EMAIL FORMAT VALIDATION ===');
    const emailTests = [
      { email: '', expected: 'Required' },
      { email: 'invalid', expected: 'Invalid format' },
      { email: 'test@', expected: 'Invalid format' },
      { email: 'test@domain', expected: 'Invalid format' },
      { email: 'test@domain.c', expected: 'Invalid format' },
      { email: 'test@domain.com', expected: 'Valid' },
      { email: ' test@domain.com ', expected: 'Valid (trimmed)' }
    ];

    emailTests.forEach(test => {
      const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(test.email);
      addResult(`📧 "${test.email}" → ${isValid ? '✅ Valid' : '❌ Invalid'} (Expected: ${test.expected})`);
    });

    // Test 2: Password Validation
    addResult('\n=== PASSWORD VALIDATION ===');
    const passwordTests = [
      { password: '', expected: 'Required' },
      { password: '12345', expected: 'Too short' },
      { password: '123456', expected: 'Valid length' },
      { password: 'pass word', expected: 'Contains spaces' },
      { password: 'a'.repeat(129), expected: 'Too long' },
      { password: 'ValidPass123', expected: 'Strong (register)' },
      { password: 'weakpass', expected: 'Weak (register)' }
    ];

    passwordTests.forEach(test => {
      const issues = [];
      if (!test.password) issues.push('Required');
      if (test.password.length < 6) issues.push('Too short');
      if (test.password.length > 128) issues.push('Too long');
      if (/\s/.test(test.password)) issues.push('Contains spaces');
      if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(test.password)) issues.push('Weak');

      addResult(`🔐 "${test.password.substring(0, 20)}${test.password.length > 20 ? '...' : ''}" → ${issues.length ? '❌ ' + issues.join(', ') : '✅ Valid'}`);
    });

    // Test 3: Registration Flow
    addResult('\n=== REGISTRATION FLOW TEST ===');
    try {
      const testUser = {
        email: 'test@example.com',
        password: 'TestPass123',
        firstName: 'Test',
        lastName: 'User',
        phone: '+1234567890'
      };

      addResult('🔄 Attempting registration...');
      const registerSuccess = await register(testUser);
      addResult(registerSuccess ? '✅ Registration successful' : '❌ Registration failed');

      // Test duplicate registration
      addResult('🔄 Testing duplicate email...');
      const duplicateSuccess = await register(testUser);
      addResult(duplicateSuccess ? '❌ Duplicate allowed (BUG!)' : '✅ Duplicate correctly rejected');

    } catch (error) {
      addResult(`❌ Registration test error: ${error}`);
    }

    // Test 4: Login Flow
    addResult('\n=== LOGIN FLOW TEST ===');
    try {
      // Test with registered user
      addResult('🔄 Testing login with registered user...');
      const loginSuccess = await login('test@example.com', 'TestPass123');
      addResult(loginSuccess ? '✅ Login successful' : '❌ Login failed');

      // Test with wrong password
      addResult('🔄 Testing login with wrong password...');
      const wrongPasswordSuccess = await login('test@example.com', 'WrongPass');
      addResult(wrongPasswordSuccess ? '❌ Wrong password accepted (BUG!)' : '✅ Wrong password correctly rejected');

      // Test with non-existent email
      addResult('🔄 Testing login with non-existent email...');
      const nonExistentSuccess = await login('nonexistent@example.com', 'TestPass123');
      addResult(nonExistentSuccess ? '❌ Non-existent email accepted (BUG!)' : '✅ Non-existent email correctly rejected');

    } catch (error) {
      addResult(`❌ Login test error: ${error}`);
    }

    addResult('\n✨ Comprehensive tests completed!');
  };

  const seedTestUsers = () => {
    const testUsers = [
      {
        id: 'user_1',
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890',
        password: 'password123',
        createdAt: new Date().toISOString()
      },
      {
        id: 'user_2',
        email: 'jane@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '+0987654321',
        password: 'password123',
        createdAt: new Date().toISOString()
      },
      {
        id: 'user_3',
        email: 'jackcubbi@gmail.com',
        firstName: 'Jack',
        lastName: 'Cubbins',
        phone: '+1234567890',
        password: 'password123',
        createdAt: new Date().toISOString()
      }
    ];

    localStorage.setItem('botai_registered_users', JSON.stringify(testUsers));
    addResult('✅ Test users seeded: john@example.com, jane@example.com, jackcubbi@gmail.com');
  };

  const getRegistryInfo = () => {
    const registeredUsers = JSON.parse(localStorage.getItem('botai_registered_users') || '[]');
    const currentUser = JSON.parse(localStorage.getItem('botai_user') || 'null');
    const session = JSON.parse(localStorage.getItem('botai_session') || 'null');

    addResult('\n=== CURRENT REGISTRY STATE ===');
    addResult(`📊 Registered users: ${registeredUsers.length}`);
    registeredUsers.forEach((user: any, index: number) => {
      addResult(`   ${index + 1}. ${user.email} (${user.firstName} ${user.lastName})`);
    });
    addResult(`👤 Current user: ${currentUser ? currentUser.email : 'None'}`);
    addResult(`⏱️ Session: ${session ? (new Date(session.expiresAt) > new Date() ? 'Active' : 'Expired') : 'None'}`);
  };

  const clearAllData = () => {
    localStorage.removeItem('botai_registered_users');
    localStorage.removeItem('botai_user');
    localStorage.removeItem('botai_session');
    localStorage.removeItem('botai_remember_me');
    localStorage.removeItem('botai_orders');
    addResult('🗑️ All authentication data cleared');
  };

  return (
    <div className="bg-blue-50 border border-blue-300 rounded-lg p-6 m-4 max-w-4xl">
      <h2 className="font-bold text-blue-800 text-xl mb-4">🔐 Complete Authentication Testing Suite</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
        <button
          onClick={runComprehensiveTests}
          className="bg-green-600 text-white px-3 py-2 rounded text-sm font-semibold hover:bg-green-700"
        >
          🧪 Run All Tests
        </button>
        <button
          onClick={seedTestUsers}
          className="bg-blue-600 text-white px-3 py-2 rounded text-sm font-semibold hover:bg-blue-700"
        >
          ��� Seed Test Users
        </button>
        <button
          onClick={getRegistryInfo}
          className="bg-purple-600 text-white px-3 py-2 rounded text-sm font-semibold hover:bg-purple-700"
        >
          📊 Registry Info
        </button>
        <button
          onClick={clearAllData}
          className="bg-red-600 text-white px-3 py-2 rounded text-sm font-semibold hover:bg-red-700"
        >
          🗑️ Clear All
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={clearResults}
          className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600"
        >
          Clear Results
        </button>
      </div>

      {testResults.length > 0 && (
        <div className="bg-white border border-gray-300 rounded-lg p-4 max-h-96 overflow-y-auto">
          <h3 className="font-semibold text-gray-800 mb-2">Test Results:</h3>
          <div className="font-mono text-sm">
            {testResults.map((result, index) => (
              <div key={index} className="whitespace-pre-wrap">
                {result}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 text-xs text-blue-700">
        <p><strong>Instructions:</strong></p>
        <ol className="list-decimal list-inside">
          <li>Click "Run All Tests" to validate the entire authentication system</li>
          <li>Use "Seed Test Users" to create sample accounts for testing</li>
          <li>Check "Registry Info" to see current user data</li>
          <li>Open browser console for detailed logs</li>
        </ol>
      </div>
    </div>
  );
}

