/**
 * ADMIN PAGE - Admin dashboard page wrapper (NOT TO BE CONFUSED WITH components/admin/AdminDashboard.jsx) That one is for dashboard logic, this one is for the wrapped version that admin will see)
 * 
 * Page component that renders the complete admin interface.
 * Provides clean URL routing and layout for admin functionality.
 * 
 * frontend/src/components/admin/AdminDashboard.jsx - handles logic
 * frontend/src/pages/AdminPage.jsx(this file) - handles page layout, using the AdminDashboard file to provide all the functionality
 * 
 * Features:
 * - Clean URL: /admin
 * - Professional admin layout with header
 * - User information and logout functionality
 * - Responsive design for admin dashboard
 * 
 * Admin Functions Available:
 * - Contractor approval workflow
 * - Tag assignment and management
 * - Job oversight and monitoring
 * - System administration
 * 
 * Integration:
 * - Uses AdminDashboard component for main functionality
 * - AuthContext for user information and logout
 * - Protected by ProtectedRoute component
 * 
 * Usage:
 * Accessed via /admin route - requires admin authentication
 */

import React from 'react';
import { useAuth } from '../components/auth/AuthContext';
import AdminDashboard from '../components/admin/AdminDashboard';
import AuthPages from '../components/auth/AuthPages'; // Add this line

function AdminPage() {
  const { user, logout, isLoading } = useAuth();

  // Add these checks like the contractor page
  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <AuthPages />; // Show login when no user
  }

  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl mb-4">Access Denied</h1>
          <p>Only admins can access this portal.</p>
          <button onClick={logout}>Back to Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Admin Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Admin Info */}
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Renovation Bridge Admin
              </h1>
              <p className="text-gray-600">
                Welcome back, <span className="font-medium">{user?.name}</span>
              </p>
            </div>

            {/* Admin Actions */}
            <div className="flex items-center space-x-4">
              {/* User Info */}
              <div className="text-right">
                <p className="text-sm font-medium text-gray-700">{user?.email}</p>
                <p className="text-xs text-blue-600 font-medium">Administrator</p>
              </div>

              {/* Logout Button */}
              <button
                onClick={logout}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors duration-200 font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Admin Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AdminDashboard />
      </div>
    </div>
  );
}

export default AdminPage;