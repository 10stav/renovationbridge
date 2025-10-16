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

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router'; // ADD THIS
import { useAuth } from '../auth/AuthContext';
import ManageContractors from './ManageContractors';
import AdminJobsView from './AdminJobsView';
import CreateContractorForm from './CreateContractorForm';


function AdminDashboard() {
  const { authenticatedRequest, logout } = useAuth();
  const [currentView, setCurrentView] = useState('overview');
  const [contractors, setContractors] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter(); // ADD THIS after your other hooks

  useEffect(() => {
    // Replace current history entry to point back to admin overview instead of contractorPortal
    window.history.replaceState(
      { view: 'admin-overview' },
      'Admin Dashboard',
      '/admin'
    );
  }, []);

  // Handle internal navigation within admin dashboard
  useEffect(() => {
    // When navigating within admin (overview -> manage -> jobs), update history
    if (currentView !== 'overview') {
      window.history.pushState(
        { view: `admin-${currentView}` },
        `Admin ${currentView}`,
        '/admin'
      );
    }
  }, [currentView]);

  // Handle browser back button within admin
  useEffect(() => {
    const handlePopState = (e) => {
      if (e.state?.view?.startsWith('admin-')) {
        // Back button within admin - go to overview
        setCurrentView('overview');
      } else {
        // Back button trying to leave admin - stay on overview
        setCurrentView('overview');
        window.history.pushState({ view: 'admin-overview' }, 'Admin Dashboard', '/admin');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  /**
   * FETCH CONTRACTORS - Get all contractors from backend
   * 
   * Retrieves active contractors for management.
   * Used by contractor management components.
   */
  const fetchContractors = async () => {
    setLoading(true);
    try {
      console.log(' AdminDashboard: Fetching contractors...');

      const response = await authenticatedRequest('/admin/contractors');

      if (response.ok) {
        const data = await response.json();
        setContractors(data.contractors || []);
        console.log(' AdminDashboard: Loaded', data.contractors?.length || 0, 'contractors');
      } else {
        console.error(' AdminDashboard: Failed to fetch contractors');
      }
    } catch (error) {
      console.error(' AdminDashboard: Error fetching contractors:', error);
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
      console.log(' AdminDashboard: Fetching jobs...');

      const response = await authenticatedRequest('/admin/jobs');

      if (response.ok) {
        const data = await response.json();
        setJobs(data.jobs || []);
        console.log(' AdminDashboard: Loaded', data.jobs?.length || 0, 'jobs');
      } else {
        console.error(' AdminDashboard: Failed to fetch jobs');
      }
    } catch (error) {
      console.error(' AdminDashboard: Error fetching jobs:', error);
    } finally {
      setLoading(false);
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

        console.log('AdminDashboard: Tags updated successfully');
      } else {
        console.error('AdminDashboard: Failed to update contractor tags');
      }
    } catch (err) {
      console.error('AdminDashboard: Error updating tags:', err);
    }
  };




  /**
   * RENDER CURRENT VIEW - Display appropriate admin interface
   * 
   * Routes between different admin management interfaces based on current view state.
   */




  if (currentView === 'manage') {
    return (
      <div>
        {/* Go Back Button */}
        <div className="mb-6">
          <button
            onClick={() => setCurrentView('overview')}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </button>
        </div>

        <ManageContractors
          contractors={contractors}
          loading={loading}
          onUpdateTags={updateContractorTags}
          onBack={() => setCurrentView('overview')}
        />
      </div>
    );
  }

  if (currentView === 'jobs') {
    return (
      <div>
        {/* Go Back Button */}
        <div className="mb-6">
          <button
            onClick={() => setCurrentView('overview')}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </button>
        </div>

        <AdminJobsView
          jobs={jobs}
          loading={loading}
          onBack={() => setCurrentView('overview')}
        />
      </div>
    );
  }

  if (currentView === 'booked-jobs') {
    return (
      <div>
        <div className="mb-6">
          <button
            onClick={() => setCurrentView('overview')}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </button>
        </div>

        <AdminJobsView
          jobs={jobs.filter(job =>
            job.feedback &&
            job.feedback.length > 0 &&
            (job.bookedTimes && job.bookedTimes.length > 0)
          )}
          loading={loading}
          onBack={() => setCurrentView('overview')}
          showFeedbackOnly={true}
        />
      </div>
    );
  }

  if (currentView === 'create-contractor') {
    return (
      <CreateContractorForm
        onBack={() => setCurrentView('overview')}
        onSuccess={() => {
          alert('Contractor created successfully!');
          setCurrentView('overview');
        }}
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


    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">


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
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-200 font-medium"
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
          className="inline-block bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors duration-200 font-medium border-0 cursor-pointer"
          style={{
            backgroundColor: '#8b5cf6',
            color: 'white',
            border: 'none',
            outline: 'none'
          }}
        >
          View Jobs
        </button>
      </div>

      {/* Booked Jobs with Feedback Card */}
      <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Booked Jobs with Feedback
        </h3>
        <p className="text-gray-600 mb-4">
          View completed appointments and contractor feedback ratings
        </p>
        <button
          onClick={() => {
            setCurrentView('booked-jobs');
            fetchJobs();
          }}
          className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors duration-200 font-medium"
        >
          View Feedback
        </button>
      </div>

      {/* Create New Contractor Card */}
      <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Create New Contractor
        </h3>
        <p className="text-gray-600 mb-4">
          Register a new contractor account in the system
        </p>
        <button
          onClick={() => setCurrentView('create-contractor')}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-200 font-medium"
        >
          Add Contractor
        </button>
      </div>



    </div>
  );
}

export default AdminDashboard;