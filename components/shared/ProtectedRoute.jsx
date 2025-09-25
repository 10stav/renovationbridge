/**
 * PROTECTED ROUTE - Authentication and authorization guard component
 * - Skips auth checks on public routes (e.g., /login)
 * - Waits for AuthContext initialization before redirecting
 * - Uses replace() to avoid polluting browser history
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../auth/AuthContext';

// Public pages that must NOT be guarded
const PUBLIC_ROUTES = new Set([
  '/contractorPortal/login',
  //'/', // only if home is public
]);

function normalizePath(router) {
  const p = (router.asPath && router.asPath.split('?')[0]) || router.pathname || '/';
  const trimmed = p.replace(/\/+$/, '');
  return trimmed || '/';
}

function ProtectedRoute({ children, requiredRole }) {
  const { user, isInitializing, isAuthenticated } = useAuth();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const path = normalizePath(router);
  const isPublic = PUBLIC_ROUTES.has(path);

  // If this is a public route, DO NOT guard — render immediately
  if (isPublic) return children;

  // Handle redirects only for protected routes
  useEffect(() => {
    if (isInitializing) return;

    const authed = typeof isAuthenticated === 'function' ? isAuthenticated() : !!user;

    // Not authenticated → go to login page
    if (!authed) {
      setIsRedirecting(true);
      router.replace('/contractorPortal/login');
      return;
    }

    // Role enforcement (only on protected routes)
    if (requiredRole && user && user.role !== requiredRole) {
      setIsRedirecting(true);
      if (user.role === 'admin') router.replace('/admin');
      else router.replace('/contractorPortal');
      return;
    }

    setIsRedirecting(false);
  }, [isInitializing, user, requiredRole, router, isAuthenticated, path]);

  // Minimal interstitial while checking a PROTECTED route
  if (isInitializing || isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 shadow-xl">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-gray-700 font-medium">Verifying access...</span>
          </div>
        </div>
      </div>
    );
  }

  // By here: PROTECTED route + authenticated (+ role ok)
  return children;
}

export default ProtectedRoute;
