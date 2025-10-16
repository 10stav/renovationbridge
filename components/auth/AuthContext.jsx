/**
 * AUTHENTICATION CONTEXT - Extracted from App.jsx
 * 
 * Provides authentication state and methods to the entire application.
 * Handles login, registration, logout, and token management.
 * 
 * Features:
 * - JWT token management
 * - Role-based authentication (admin/contractor)
 * - Contractor approval workflow (removed 10/16/25)
 * - Error handling and loading states
 * - Persistent login via localStorage
 * 
 * Usage:
 * - Wrap app with <AuthProvider>
 * - Use useAuth() hook in any component
 */

'use client'; // required for client-side usage (localStorage, hooks)

import React, { useState, useContext, createContext, useEffect } from 'react';
import { useRouter } from 'next/router';

// API Base URL - Points to your backend
const API_BASE_URL = '/api/contractorPortal';

// Create the authentication context
const AuthContext = createContext();

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Normalize route (strip query + trailing slashes)
function useNormalizedPath() {
  const router = useRouter();
  const path =
    (router?.asPath?.split('?')[0] || router?.pathname || '/').replace(/\/+$/, '') || '/';
  return { router, path };
}

// Authentication Provider Component
export function AuthProvider({ children }) {
  const { router, path } = useNormalizedPath();

  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Routes that should render immediately (no "Loading..." gate)
  // IMPORTANT: login is public; contractorPortal (dashboard) is NOT public
  // Public pages that must NOT be guarded
const PUBLIC_ROUTES = new Set([
  '/contractorPortal/login',
  //'/', // only if home is public
]);

  const isPublicRoute = PUBLIC_ROUTES.has(path);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;

      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token is invalid, clear it and return
          localStorage.removeItem('token');
          setUser(null);
          return null;
        }
        console.error('Failed to load user profile');
        return null;
      }

      const { user: rawUser } = await response.json();

      const flatTags =
        rawUser.contractorTags ??
        [
          ...(rawUser.tags?.renovation || []),
          ...(rawUser.tags?.location || []),
          ...(rawUser.tags?.grouping || [])
        ];

   

      const finalUser = { ...rawUser, contractorTags: flatTags };

      setUser(finalUser);
      console.log('Refreshed user profile:', finalUser);
      return finalUser;
    } catch (err) {
      console.error('Error fetching user profile:', err);
      localStorage.removeItem('token');
      setUser(null);
      return null;
    }
  };

  // Check for existing token on app startup
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsInitializing(false);
        return;
      }

      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Date.now() / 1000;

        if (payload.exp && payload.exp > currentTime) {
          await fetchUserProfile();
        } else {
          console.log('⚠️ Token expired, removing from localStorage');
          localStorage.removeItem('token');
        }
      } catch (err) {
        console.error('Error checking auth status:', err);
        localStorage.removeItem('token');
      } finally {
        setIsInitializing(false);
      }
    };

    checkAuthStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email, password) => {
    try {
      setIsLoading(true);

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      // Attempt to parse response (even if error)
      let data = {};
      try {
        data = await response.json();
      } catch {
        // ignore parse failures
      }

      // Failure
      if (!response.ok) {
        const errorMessage =
          data?.error ||
          data?.message ||
          (response.status === 400
            ? 'Invalid credentials. Please try again.'
            : 'An unexpected error occurred.');

        return { success: false, error: errorMessage };
      }

      // Success
      localStorage.setItem('token', data.token);
      const fetchedUser = await fetchUserProfile();

      return { success: true, user: fetchedUser };
    } catch (error) {
      console.error('❌ Login error:', error);
      return { success: false, error: 'Network error. Please try again later.' };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setIsLoading(true);
      console.log('📝 Attempting registration for:', userData.email);

      const registrationData = { ...userData, role: 'contractor' };

      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || 'Registration failed',
        };
      }

      console.log('✅ Registration successful - waiting for approval');
      return {
        success: true,
        message: data.message || 'Account created! Please wait for admin approval.',
      };
    } catch (error) {
      console.error('❌ Registration error:', error);
      return { success: false, error: error.message || 'Registration failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    console.log(' LOGOUT TRIGGERED - Stack trace:');
    console.trace();
    console.log(' Logging out user:', user?.name);
    localStorage.removeItem('token');
    setUser(null);
  };

  const isAuthenticated = () => !!user && !!localStorage.getItem('token');

  const hasRole = (requiredRole) => user?.role === requiredRole;

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  };

  const authenticatedRequest = async (endpoint, options = {}) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...options.headers,
      },
    });

    if (response.status === 401) {
      logout();
      throw new Error('Session expired. Please login again.');
    }

    return response;
  };

  const authValue = {
    user,
    isLoading,
    isInitializing,
    login,
    register,
    logout,
    isAuthenticated,
    hasRole,
    getAuthHeaders,
    authenticatedRequest,
    API_BASE_URL,
  };

  // Only show the Loading gate on protected routes
  if (isInitializing && !isPublicRoute) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-white to-blue-800 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 shadow-xl">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-gray-700 font-medium">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>;
}
