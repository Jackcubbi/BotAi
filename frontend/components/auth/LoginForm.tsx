import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff, Mail, Lock, AlertCircle } from 'lucide-react';

interface LoginFormProps {
  onClose?: () => void;
}

export default function LoginForm({ onClose }: LoginFormProps) {
  const { login, isLoading, authError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Load saved credentials on component mount
  useEffect(() => {
    const savedCredentials = localStorage.getItem('botai_remember_me');
    if (savedCredentials) {
      try {
        const { email, rememberMe: remembered, savedAt } = JSON.parse(savedCredentials);
        if (remembered) {
          // Check if saved credentials are not too old (30 days)
          const savedDate = new Date(savedAt).getTime();
          const now = new Date().getTime();
          const thirtyDays = 30 * 24 * 60 * 60 * 1000;

          if (now - savedDate < thirtyDays) {
            setFormData(prev => ({ ...prev, email }));
            setRememberMe(true);
          } else {
            // Clear old saved credentials
            localStorage.removeItem('botai_remember_me');
          }
        }
      } catch (error) {
        // Clear invalid saved data
        localStorage.removeItem('botai_remember_me');
      }
    }
  }, []);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    } else if (formData.password.length > 128) {
      newErrors.password = 'Password is too long (maximum 128 characters)';
    } else if (/\s/.test(formData.password)) {
      newErrors.password = 'Password cannot contain spaces';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const success = await login(formData.email, formData.password, rememberMe);

    if (success) {
      const params = new URLSearchParams(location.search);
      const redirectPath = params.get('redirect') || '/account';

      // Handle remember me functionality
      if (rememberMe) {
        // Save email for future logins (don't save password for security)
        const rememberData = {
          email: formData.email,
          rememberMe: true,
          savedAt: new Date().toISOString()
        };
        localStorage.setItem('botai_remember_me', JSON.stringify(rememberData));
      } else {
        // Clear saved credentials if remember me is unchecked
        localStorage.removeItem('botai_remember_me');
      }

      onClose?.();
      navigate(redirectPath);
    } else {
      setErrors({ general: authError || 'Invalid email or password. Please try again.' });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8">
      <div className="text-center mb-8">
        <h2 className="font-space-grotesk font-bold text-3xl text-botai-dark uppercase tracking-wide">
          Welcome Back
        </h2>
        <p className="font-noto-sans text-botai-text mt-2">
          Sign in to your BotAi account
        </p>
      </div>

      {errors.general && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className="text-red-700 text-sm">{errors.general}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block font-space-grotesk font-medium text-botai-dark uppercase tracking-wide text-sm mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-botai-text" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg font-noto-sans focus:ring-2 focus:ring-botai-accent-green focus:border-transparent ${
                  errors.email ? 'border-red-300' : 'border-botai-grey-line'
                }`}
                placeholder="Enter your email"
                disabled={isLoading}
              />
            </div>
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="block font-space-grotesk font-medium text-botai-dark uppercase tracking-wide text-sm mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-botai-text" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-12 py-3 border rounded-lg font-noto-sans focus:ring-2 focus:ring-botai-accent-green focus:border-transparent ${
                  errors.password ? 'border-red-300' : 'border-botai-grey-line'
                }`}
                placeholder="Enter your password"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-botai-text hover:text-botai-dark"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password}</p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-botai-accent-green border-botai-grey-line rounded focus:ring-botai-accent-green"
              />
              <span className="ml-2 font-noto-sans text-sm text-botai-text">Remember me</span>
            </label>
            <Link
              to="/forgot-password"
              className="font-noto-sans text-sm text-botai-accent-green hover:text-botai-dark transition-colors"
            >
              Forgot password?
            </Link>
          </div>

          {rememberMe && (
            <div className="bg-botai-accent-green/10 border border-botai-accent-green/20 rounded-lg p-3">
              <p className="font-noto-sans text-xs text-botai-text">
                Your email will be saved for quick sign-in, and you'll stay logged in for 30 days.
              </p>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-botai-black text-white py-3 rounded-lg font-space-grotesk font-bold uppercase tracking-wide hover:bg-botai-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>

      <div className="mt-8 text-center">
        <p className="font-noto-sans text-botai-text">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="text-botai-accent-green hover:text-botai-dark font-medium transition-colors"
          >
            Sign up here
          </Link>
        </p>
      </div>
    </div>
  );
}

