import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, RegisterData } from '../../contexts/AuthContext';
import { Eye, EyeOff, Mail, Lock, User, Phone, AlertCircle, CheckCircle } from 'lucide-react';

interface RegisterFormProps {
  onClose?: () => void;
}

export default function RegisterForm({ onClose }: RegisterFormProps) {
  const { register, isLoading } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<RegisterData & { confirmPassword: string }>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (formData.phone && !/^\+?[\d\s\-\(\)]{10,}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number (minimum 10 digits)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const { confirmPassword, ...registerData } = formData;
    const success = await register(registerData);

    if (success) {
      onClose?.();
      navigate('/account');
    } else {
      // Check if it might be a duplicate email issue
      const registeredUsers = JSON.parse(localStorage.getItem('botai_registered_users') || '[]');
      const emailExists = registeredUsers.some((user: any) => user.email === formData.email.toLowerCase());

      if (emailExists) {
        setErrors({ email: 'An account with this email already exists. Try logging in instead.' });
        return;
      }
      setErrors({ general: 'Registration failed. Please check your information and try again.' });
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

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 6) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(formData.password);
  const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];

  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8">
      <div className="text-center mb-8">
        <h2 className="font-space-grotesk font-bold text-3xl text-botai-dark uppercase tracking-wide">
          Join To -BotAi-
        </h2>
        <p className="font-noto-sans text-botai-text mt-2">
          Create your BotAi account today
        </p>
      </div>

      {errors.general && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className="text-red-700 text-sm">{errors.general}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-space-grotesk font-medium text-botai-dark uppercase tracking-wide text-sm mb-2">
              First Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-botai-text" />
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg font-noto-sans focus:ring-2 focus:ring-botai-accent-green focus:border-transparent ${
                  errors.firstName ? 'border-red-300' : 'border-botai-grey-line'
                }`}
                placeholder="First name"
                disabled={isLoading}
              />
            </div>
            {errors.firstName && (
              <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
            )}
          </div>

          <div>
            <label className="block font-space-grotesk font-medium text-botai-dark uppercase tracking-wide text-sm mb-2">
              Last Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-botai-text" />
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg font-noto-sans focus:ring-2 focus:ring-botai-accent-green focus:border-transparent ${
                  errors.lastName ? 'border-red-300' : 'border-botai-grey-line'
                }`}
                placeholder="Last name"
                disabled={isLoading}
              />
            </div>
            {errors.lastName && (
              <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
            )}
          </div>
        </div>

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
            Phone Number (Optional)
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-botai-text" />
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg font-noto-sans focus:ring-2 focus:ring-botai-accent-green focus:border-transparent ${
                errors.phone ? 'border-red-300' : 'border-botai-grey-line'
              }`}
              placeholder="Enter your phone number"
              disabled={isLoading}
            />
          </div>
          {errors.phone && (
            <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
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
              placeholder="Create a password"
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
          {formData.password && (
            <div className="mt-2">
              <div className="flex items-center gap-2 mb-1">
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${strengthColors[passwordStrength - 1] || 'bg-gray-200'}`}
                    style={{ width: `${(passwordStrength / 5) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-botai-text">
                  {strengthLabels[passwordStrength - 1] || 'Too short'}
                </span>
              </div>
            </div>
          )}
          {errors.password && (
            <p className="text-red-500 text-sm mt-1">{errors.password}</p>
          )}
        </div>

        <div>
          <label className="block font-space-grotesk font-medium text-botai-dark uppercase tracking-wide text-sm mb-2">
            Confirm Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-botai-text" />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className={`w-full pl-10 pr-12 py-3 border rounded-lg font-noto-sans focus:ring-2 focus:ring-botai-accent-green focus:border-transparent ${
                errors.confirmPassword ? 'border-red-300' : 'border-botai-grey-line'
              }`}
              placeholder="Confirm your password"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-botai-text hover:text-botai-dark"
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {formData.confirmPassword && formData.password === formData.confirmPassword && (
            <div className="flex items-center gap-2 mt-1">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-green-600 text-sm">Passwords match</span>
            </div>
          )}
          {errors.confirmPassword && (
            <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
          )}
        </div>

        <div className="flex items-start">
          <input
            type="checkbox"
            required
            className="w-4 h-4 text-botai-accent-green border-botai-grey-line rounded focus:ring-botai-accent-green mt-1"
          />
          <span className="ml-2 font-noto-sans text-sm text-botai-text">
            I agree to the{' '}
            <Link to="/terms" className="text-botai-accent-green hover:text-botai-dark">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="text-botai-accent-green hover:text-botai-dark">
              Privacy Policy
            </Link>
          </span>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-botai-black text-white py-3 rounded-lg font-space-grotesk font-bold uppercase tracking-wide hover:bg-botai-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>

      <div className="mt-8 text-center">
        <p className="font-noto-sans text-botai-text">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-botai-accent-green hover:text-botai-dark font-medium transition-colors"
          >
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
}

