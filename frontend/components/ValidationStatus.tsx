import React from 'react';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface ValidationRule {
  name: string;
  status: 'implemented' | 'partial' | 'missing';
  description: string;
}

export default function ValidationStatus() {
  const loginValidations: ValidationRule[] = [
    {
      name: 'Email Required',
      status: 'implemented',
      description: 'Email field is required with proper error message'
    },
    {
      name: 'Email Format',
      status: 'implemented', 
      description: 'Enhanced regex validation for email format'
    },
    {
      name: 'Email Existence Check',
      status: 'implemented',
      description: 'Checks if email exists in user registry before login'
    },
    {
      name: 'Password Required',
      status: 'implemented',
      description: 'Password field is required with proper error message'
    },
    {
      name: 'Password Length',
      status: 'implemented',
      description: 'Minimum 6 characters, maximum 128 characters'
    },
    {
      name: 'Password Spaces',
      status: 'implemented',
      description: 'Prevents passwords with spaces'
    },
    {
      name: 'Specific Error Messages',
      status: 'implemented',
      description: 'Different errors for email not found vs wrong password'
    },
    {
      name: 'Remember Me',
      status: 'implemented',
      description: 'Secure credential saving with session extension'
    },
    {
      name: 'Real-time Validation',
      status: 'implemented',
      description: 'Errors clear as user types'
    }
  ];

  const registerValidations: ValidationRule[] = [
    {
      name: 'Name Fields Required',
      status: 'implemented',
      description: 'First name and last name required with trimming'
    },
    {
      name: 'Email Duplication Check',
      status: 'implemented',
      description: 'Prevents registration with existing email'
    },
    {
      name: 'Password Strength',
      status: 'implemented',
      description: 'Requires uppercase, lowercase, and number'
    },
    {
      name: 'Password Confirmation',
      status: 'implemented',
      description: 'Confirms passwords match with visual indicator'
    },
    {
      name: 'Phone Validation',
      status: 'implemented',
      description: 'Optional phone number with format validation'
    },
    {
      name: 'Terms Agreement',
      status: 'implemented',
      description: 'Required checkbox for terms and privacy policy'
    },
    {
      name: 'Password Strength Meter',
      status: 'implemented',
      description: '5-level visual strength indicator with colors'
    },
    {
      name: 'Visual Feedback',
      status: 'implemented',
      description: 'Real-time validation with match indicators'
    }
  ];

  const securityFeatures: ValidationRule[] = [
    {
      name: 'Session Management',
      status: 'implemented',
      description: '24h/30d sessions with auto-logout on expiry'
    },
    {
      name: 'No Password Storage',
      status: 'implemented',
      description: 'Only session tokens stored, no passwords'
    },
    {
      name: 'Input Sanitization',
      status: 'implemented',
      description: 'Email normalization and data trimming'
    },
    {
      name: 'User Registry',
      status: 'implemented',
      description: 'Multi-user support with proper email tracking'
    },
    {
      name: 'Session Monitoring',
      status: 'implemented',
      description: 'Background session validation every 5 minutes'
    },
    {
      name: 'Rate Limiting',
      status: 'missing',
      description: 'No protection against brute force attacks'
    },
    {
      name: 'CSRF Protection',
      status: 'missing',
      description: 'No CSRF tokens implemented'
    }
  ];

  const getStatusIcon = (status: ValidationRule['status']) => {
    switch (status) {
      case 'implemented':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'partial':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'missing':
        return <XCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getStatusColor = (status: ValidationRule['status']) => {
    switch (status) {
      case 'implemented':
        return 'bg-green-50 border-green-200';
      case 'partial':
        return 'bg-yellow-50 border-yellow-200';
      case 'missing':
        return 'bg-red-50 border-red-200';
    }
  };

  const ValidationSection = ({ title, validations }: { title: string; validations: ValidationRule[] }) => {
    const implementedCount = validations.filter(v => v.status === 'implemented').length;
    const totalCount = validations.length;
    const percentage = Math.round((implementedCount / totalCount) * 100);

    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800">{title}</h3>
          <div className="flex items-center gap-2">
            <div className="text-sm text-gray-600">
              {implementedCount}/{totalCount} ({percentage}%)
            </div>
            <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 transition-all duration-300"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          {validations.map((validation, index) => (
            <div key={index} className={`p-3 rounded-lg border ${getStatusColor(validation.status)}`}>
              <div className="flex items-start gap-3">
                {getStatusIcon(validation.status)}
                <div className="flex-1">
                  <div className="font-semibold text-gray-800">{validation.name}</div>
                  <div className="text-sm text-gray-600">{validation.description}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const overallImplemented = [
    ...loginValidations,
    ...registerValidations,
    ...securityFeatures
  ].filter(v => v.status === 'implemented').length;

  const overallTotal = loginValidations.length + registerValidations.length + securityFeatures.length;
  const overallPercentage = Math.round((overallImplemented / overallTotal) * 100);

  return (
    <div className="bg-white border border-gray-300 rounded-lg p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">🔐 Authentication Validation Status</h2>
        <div className="flex items-center gap-4">
          <div className="text-lg font-semibold text-gray-700">
            Overall Progress: {overallImplemented}/{overallTotal} ({overallPercentage}%)
          </div>
          <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden max-w-xs">
            <div 
              className="h-full bg-green-500 transition-all duration-300"
              style={{ width: `${overallPercentage}%` }}
            />
          </div>
        </div>
      </div>

      <ValidationSection title="🔑 Login Form Validations" validations={loginValidations} />
      <ValidationSection title="🆕 Register Form Validations" validations={registerValidations} />
      <ValidationSection title="🛡️ Security Features" validations={securityFeatures} />

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-bold text-blue-800 mb-2">📋 Testing Instructions</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Use the ValidationTest component above to run comprehensive tests</li>
          <li>• Test email duplication by registering the same email twice</li>
          <li>• Test password validation with various input combinations</li>
          <li>• Verify remember me functionality works correctly</li>
          <li>• Check session expiration and auto-logout features</li>
        </ul>
      </div>
    </div>
  );
}

