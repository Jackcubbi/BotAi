import React from 'react';
import LoginForm from '../components/auth/LoginForm';

export default function Login() {
  return (
    <div className="min-h-screen bg-botai-grey-bg">
      <div className="flex items-center justify-center px-4 py-8">
        <LoginForm />
      </div>
    </div>
  );
}

