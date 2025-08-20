import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

function AuthPages() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header section with background */}
      <div className="relative w-full h-[60vh] overflow-hidden flex-shrink-0">
        <img
          src="/assets/Creation-7-Project-Tice-7.jpg"
          alt="Header background"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-30" />
      </div>

      {/* Card overlapping header */}
      <div className="relative z-20 w-full -mt-48 flex-grow flex items-start justify-center">
        <div className="bg-white shadow-lg rounded-t-2xl rounded-b-lg p-8 w-full min-h-[70vh]">
          <div className="w-full px-4 flex flex-col items-center">
            {/* Logo */}
            <img
              src="/assets/Renovation.png"
              alt="Logo"
              style={{ height: '224px', width: '224px', marginBottom: '0' }}
            />

            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
              Welcome Back!
            </h2>

            {/* Switch between login and register forms */}
            {isLogin ? (
              <LoginForm />
            ) : (
              <RegisterForm />
            )}

            <div className="mt-6 text-center w-full">
              <p className="text-gray-600">
                {isLogin ? 'New contractor? ' : 'Already have an account? '}
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-blue-600 font-semibold hover:text-blue-800"
                >
                  {isLogin
                    ? 'Create Account (only for current GHL team members)'
                    : 'Login'}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthPages;