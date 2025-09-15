/**
 * ADMIN DASHBOARD - Main admin interface component (NOT TO BE CONFUSED WITH pages/adminPage.jsx) This one is for dashboard logic, that one is for the wrapped version that admin will see
 * 
 * frontend/src/components/admin/AdminDashboard.jsx(this file) - handles logic
 * frontend/src/pages/AdminPage.jsx - handles page layout using the AdminDashboard file(This file) to provide all the functionality
 * 
 * Provides the central hub for all administrative functions.
 * Extracted from App.jsx to create a focused admin management interface.
 * 
 * Features:
 * - Overview dashboard with action cards
 * - Navigation between different admin views
 * - Real-time data fetching for contractors and jobs
 * - Professional card-based interface
 * - State management for current view
 * 
 * Admin Functions:
 * - Contractor approval workflow
 * - Tag assignment and management
 * - Job oversight and monitoring
 * - System statistics and overview
 * 
 * Integration:
 * - Uses useAuth hook for authentication and API calls
 * - Connects to backend admin API endpoints
 * - Manages child component rendering based on current view
 * 
 * Usage:
 * <AdminDashboard />
 */

import React, { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import PendingContractors from './PendingContractors';
import ManageContractors from './ManageContractors';
import AdminJobsView from './AdminJobsView';

function AdminDashboard() {
  const { authenticatedRequest, logout } = useAuth();
  const [currentView, setCurrentView] = useState('overview');
  const [contractors, setContractors] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);

  /**
   * FETCH CONTRACTORS - Get all contractors from backend
   * 
   * Retrieves both pending and approved contractors for management.
   * Used by contractor management components.
   */
  const fetchContractors = async () => {
    setLoading(true);
    try {
      console.log('📊 AdminDashboard: Fetching contractors...');

      const response = await authenticatedRequest('/admin/contractors');

      if (response.ok) {
        const data = await response.json();
        setContractors(data.contractors || []);
        console.log('✅ AdminDashboard: Loaded', data.contractors?.length || 0, 'contractors');
      } else {
        console.error('❌ AdminDashboard: Failed to fetch contractors');
      }
    } catch (error) {
      console.error('❌ AdminDashboard: Error fetching contractors:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * FETCH JOBS - Get all available jobs from backend
   * 
   * Retrieves current job listings for admin oversight.
   * Shows jobs created from GHL "Need to Book" webhook.
   */
  const fetchJobs = async () => {
    setLoading(true);
    try {
      console.log('📊 AdminDashboard: Fetching jobs...');

      const response = await authenticatedRequest('/admin/jobs');

      if (response.ok) {
        const data = await response.json();
        setJobs(data.jobs || []);
        console.log('✅ AdminDashboard: Loaded', data.jobs?.length || 0, 'jobs');
      } else {
        console.error('❌ AdminDashboard: Failed to fetch jobs');
      }
    } catch (error) {
      console.error('❌ AdminDashboard: Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * APPROVE CONTRACTOR - Approve pending contractor registration
   * 
   * @param {string} contractorId - ID of contractor to approve
   */
  const approveContractor = async (contractorId, contractorGhlId, skipGhl = false) => {
    try {
      console.log('✅ AdminDashboard: Approving contractor:', contractorId, { contractorGhlId, skipGhl });

      // If skipGhl === true, we never call the HighLevel API
      let teamMemberId = skipGhl ? null : contractorGhlId;

      // … existing fetchContractorById, find user, etc …

      if (!skipGhl && !teamMemberId) {
        // your existing “auto-match by email” logic here
        // if no match → 400 error
      }

      // Now simply flip the flags
      contractor.isApproved = true;
      contractor.isActive = true;
      contractor.denied = false;

      if (teamMemberId) {
        contractor.contractorGhlId = teamMemberId;
      }

      await contractor.save();
      console.log('🎉 Contractor approved:', contractor.name);
      fetchContractors();
    } catch (err) {
      console.error('❌ AdminDashboard: Error approving contractor:', err);
    }
  };


  /**
   * UPDATE CONTRACTOR TAGS - Assign filtering tags to contractor
   * 
   * Tags control which jobs contractors can see based on project requirements.
   * 
   * @param {string} contractorId - ID of contractor to update
   * @param {Array} tags - Array of tag strings to assign
   */
  const updateContractorTags = async (contractorId, newTags) => {
    try {
      const response = await authenticatedRequest(`/admin/contractors/${contractorId}/tags`, {
        method: 'POST',
        body: JSON.stringify({ tags: newTags }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const updated = data.contractor;

        setContractors(prev =>
          prev.map(c => (c._id === contractorId ? { ...c, ...updated } : c))
        );

        console.log('✅ AdminDashboard: Tags updated successfully');
      } else {
        console.error('❌ AdminDashboard: Failed to update contractor tags');
      }
    } catch (err) {
      console.error('❌ AdminDashboard: Error updating tags:', err);
    }
  };




  /**
   * RENDER CURRENT VIEW - Display appropriate admin interface
   * 
   * Routes between different admin management interfaces based on current view state.
   */


  if (currentView === 'pending') {
    return (
      <PendingContractors
        contractors={contractors}
        loading={loading}
        onApprove={approveContractor}
        onDenyRefresh={fetchContractors} // ✅ new prop for contractor denial refresh
        onBack={() => setCurrentView('overview')}
      />
    );
  }

  if (currentView === 'manage') {
    return (
      <ManageContractors
        contractors={contractors}
        loading={loading}
        onUpdateTags={updateContractorTags}
        onBack={() => setCurrentView('overview')}
      />
    );
  }

  if (currentView === 'jobs') {
    return (
      <AdminJobsView
        jobs={jobs}
        loading={loading}
        onBack={() => setCurrentView('overview')}
      />
    );
  }

  /**
   * OVERVIEW DASHBOARD - Main admin landing page
   * 
   * Displays action cards for primary admin functions.
   * Each card navigates to a specific management interface.
   */
  return (
    <div>
      {/* Add this header section */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
        <button
          onClick={logout}
          className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors font-medium"
        >
          Logout
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">



        {/* Pending Contractors Card */}
        <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Pending Contractors
          </h3>
          <p className="text-gray-600 mb-4">
            Approve new contractor registrations and manage approval workflow
          </p>
          <button
            onClick={() => {
              setCurrentView('pending');
              fetchContractors();
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-200 font-medium"
          >
            View Pending
          </button>
        </div>

        {/* Manage Contractors Card */}
        <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Manage Contractors
          </h3>
          <p className="text-gray-600 mb-4">
            Edit specialties, assign filtering tags, and manage contractor accounts
          </p>
          <button
            onClick={() => {
              setCurrentView('manage');
              fetchContractors();
            }}
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors duration-200 font-medium"
          >
            Manage All
          </button>
        </div>

        {/* Available Jobs Card */}
        <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Available Jobs
          </h3>
          <p className="text-gray-600 mb-4">
            View all current opportunities from GHL "Need to Book" pipeline
          </p>
          <button
            onClick={() => {
              setCurrentView('jobs');
              fetchJobs();
            }}
            className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors duration-200 font-medium"
          >
            View Jobs
          </button>
        </div>
      </div>
      </div>
      );
}

      export default AdminDashboard;