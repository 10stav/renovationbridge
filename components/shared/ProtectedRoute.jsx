/**
 * PROTECTED ROUTE - Authentication and authorization guard component
 * 
 * Wraps routes that require authentication and specific user roles.
 * Provides security layer for admin and contractor functionality.
 * 
 * Features:
 * - Authentication verification
 * - Role-based access control
 * - Automatic redirects for unauthorized access
 * - Loading states during authentication checks
 * - Contractor approval status verification
 * 
 * Security Checks:
 * - User must be logged in (valid JWT token)
 * - User must have required role (admin/contractor)
 * - Contractors must be approved by admin
 * - Handles expired tokens gracefully
 * 
 * Usage:
 * <ProtectedRoute requiredRole="admin">
 *   <AdminDashboard />
 * </ProtectedRoute>
 * 
 * <ProtectedRoute requiredRole="contractor">
 *   <ContractorPortal />
 * </ProtectedRoute>
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

function ProtectedRoute({ children, requiredRole }) {
  const { user, isInitializing, logout } = useAuth();

  // Show loading spinner during initial authentication check
  if (isInitializing) {
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

  // Check for token and user - fixed authentication check
  const token = localStorage.getItem('token');
  
  if (!token || !user) {
    console.log('🔒 ProtectedRoute: User not authenticated, redirecting to login');
    console.log('Token exists:', !!token);
    console.log('User exists:', !!user);
    return <Navigate to="/login" replace />;
  }

  // Check if user has required role
  if (requiredRole && user?.role !== requiredRole) {
    console.log(`🚫 ProtectedRoute: User role "${user?.role}" does not match required role "${requiredRole}"`);
    
    // Redirect to appropriate dashboard based on actual role
    if (user?.role === 'admin') {
      return <Navigate to="/admin" replace />;
    } else if (user?.role === 'contractor') {
      return <Navigate to="/contractor" replace />;
    } else {
      // Unknown role, redirect to login
      return <Navigate to="/login" replace />;
    }
  }

  // Special check for contractors - must be approved
  if (requiredRole === 'contractor' && !user?.isApproved) {
    console.log('⏳ ProtectedRoute: Contractor not yet approved by admin');
    
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Account Pending Approval
          </h2>
          
          <p className="text-gray-600 mb-6 leading-relaxed">
            Thanks for registering, <strong>{user?.name}</strong>! 
            Your contractor account is currently being reviewed by our admin team.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-800 mb-2">What's Next?</h3>
            <ul className="text-blue-700 text-sm space-y-1 text-left">
              <li>• Admin will review your application</li>
              <li>• You'll be notified when approved</li>
              <li>• Then you can access job opportunities</li>
            </ul>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              🔄 Check Approval Status
            </button>
            
            <button
              onClick={logout}
              className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              👋 Logout
            </button>
          </div>
          
          <p className="text-xs text-gray-500 mt-6">
            Questions? Contact admin for assistance.
          </p>
        </div>
      </div>
    );
  }

  // User is authenticated and authorized - render protected content
  console.log(`✅ ProtectedRoute: User authorized for ${requiredRole} access`);
  return children;
}

export default ProtectedRoute;