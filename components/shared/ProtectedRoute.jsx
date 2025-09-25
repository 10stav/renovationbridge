/**
 * PROTECTED ROUTE - Authentication and authorization guard component
 * - Skips auth checks on public routes (e.g., /contractorPortal/login)
 * - Waits for AuthContext initialization before redirecting
 * - Uses replace() to avoid polluting browser history
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../auth/AuthContext';

// Public pages that must NOT be guarded (MUST start with '/')
const PUBLIC_ROUTES = new Set([
  '/contractorPortal/login',
  // '/', // add only if your home is public
]);

function normalizePath(router) {
  const p = (router.asPath && router.asPath.split('?')[0]) || router.pathname || '/';
  const trimmed = p.replace(/\/+$/, '');
  return trimmed || '/';
}

function ProtectedRoute({ children, requiredRole }) {
  const router = useRouter();
  const { user, isInitializing, isAuthenticated } = useAuth();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const path = normalizePath(router);
  const isPublic = PUBLIC_ROUTES.has(path);

  // 👇 Hooks must be called unconditionally; the effect early-returns if public.
  useEffect(() => {
    if (isPublic) return;               // public route: do nothing
    if (isInitializing) return;         // still bootstrapping

    const authed =
      typeof isAuthenticated === 'function' ? isAuthenticated() : !!user;

    if (!authed) {
      setIsRedirecting(true);
      router.replace('/contractorPortal/login');
      return;
    }

    if (requiredRole && user && user.role !== requiredRole) {
      setIsRedirecting(true);
      router.replace(user.role === 'admin' ? '/admin' : '/contractorPortal');
      return;
    }

    setIsRedirecting(false);
  }, [isPublic, isInitializing, isAuthenticated, user, requiredRole, router]);

  // Public route? Render immediately (no guard)
  if (isPublic) return children;

  // Protected route: show minimal interstitial while checking/redirecting
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

  // Auth OK for this protected route
  return children;
}

export default ProtectedRoute;
