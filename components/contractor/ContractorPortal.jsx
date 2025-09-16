import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router'; // added this for back button behavior fix below
import { useAuth } from '../auth/AuthContext';
import ContractorJobsList from './ContractorJobList.jsx';
import ContractorYourAppointments from './ContractorYourAppointments.jsx';

export default function ContractorPortal() {
  const { user, authenticatedRequest } = useAuth();
  const [currentView, setCurrentView] = useState('overview');
  const [jobs, setJobs] = useState([]);
  const [bookedJobs, setBookedJobs] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch available jobs
  const fetchAvailableJobs = async () => {
    setLoading(true);
    try {
      const res = await authenticatedRequest('/contractor/available-jobs');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setJobs(data.jobs || []);
    } catch {
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  //fetch booked jobs
  const fetchBookedJobs = async () => {
    setLoading(true);
    try {
      console.log('🔄 Fetching appointments...');

      // // Auto-sync first
      // try {
      //   console.log('🔄 Auto-syncing appointments...');
      //   await authenticatedRequest('/contractor/sync-appointments', { method: 'POST' });
      //   console.log('✅ Auto-sync completed');
      // } catch (syncError) {
      //   console.warn('⚠️ Auto-sync failed:', syncError);
      //   // Continue even if sync fails
      // }

      // Then fetch appointments
      const res = await authenticatedRequest('/contractor/my-appointments');
      const data = await res.json();
      console.log('📊 Fetched appointments:', data.appointments?.length || 0, 'appointments');
      setBookedJobs(data.appointments || []);
    } catch (error) {
      console.error('❌ Error fetching appointments:', error);
      setBookedJobs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {    //call these two functions on this mount so dashboard cards can update with correct totals
    fetchAvailableJobs()
    fetchBookedJobs()
  }, [])

  //added useEffects HERE to prevent weird back button behavior(redirects/auto logout issue) from happening:
  const router = useRouter();

  // Fix browser history for contractor navigation
  useEffect(() => {
    // Replace current history entry to point back to contractor overview instead of admin
    window.history.replaceState(
      { view: 'contractor-overview' },
      'Contractor Dashboard',
      '/contractorPortal'
    );
  }, []);

  // Handle internal navigation within contractor dashboard
  useEffect(() => {
    // When navigating within contractor (overview -> jobs -> appointments), update history
    if (currentView !== 'overview') {
      window.history.pushState(
        { view: `contractor-${currentView}` },
        `Contractor ${currentView}`,
        '/contractorPortal'
      );
    }
  }, [currentView]);

  // Handle browser back button within contractor
  useEffect(() => {
    const handlePopState = (e) => {
      if (e.state?.view?.startsWith('contractor-')) {
        // Back button within contractor - go to overview
        setCurrentView('overview');
      } else {
        // Back button trying to leave contractor - stay on overview
        setCurrentView('overview');
        window.history.pushState({ view: 'contractor-overview' }, 'Contractor Dashboard', '/contractorPortal');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // If we're in the "jobs" view, show the list
  if (currentView === 'jobs') {
    return (
      <ContractorJobsList
        jobs={jobs}
        loading={loading}
        onBack={() => setCurrentView('overview')}
      />
    );
  }

  if (currentView === 'appointments') {
    return (
      <ContractorYourAppointments
        jobs={bookedJobs}
        loading={loading}
        onBack={() => setCurrentView('overview')}
        onRefresh={fetchBookedJobs} // ← Add this line
      />
    );
  }



  // Otherwise show the two action cards
  return (



    <div className="grid grid-cols-2 gap-6">
      <Card
        title="Your Available Jobs test"
        subtitle={
          <>
            Ready to book
            {/* —{' '}
            <span className="text-green-600">
              {jobs.length}
            </span>{' '}
            available */}
          </>
        }
        buttonText="View Available Jobs"
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" width="140" height="140" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M12.5 21h-6.5a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v5" />
            <path d="M16 3v4" />
            <path d="M8 3v4" />
            <path d="M4 11h16" />
            <path d="M16 19h6" />
            <path d="M19 16v6" />
          </svg>
        }
        onClick={() => {
          setCurrentView('jobs');
          fetchAvailableJobs();
        }}
      />
      <Card
        title="Your Appointments"
        subtitle={
          <>Confirmed</>
          //<>Scheduled & confirmed — <span className="text-red-600">{bookedJobs.length}</span> booked</> //temp removal since sync button is inside of this page and doesnt update before click
        }

        onClick={() => {
          setCurrentView('appointments');
          fetchBookedJobs();
        }}
        buttonText="View Appointments"
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" width="140" height="140" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600">
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M4 7a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12z" />
            <path d="M16 3v4" />
            <path d="M8 3v4" />
            <path d="M4 11h16" />
            <path d="M7 14h.013" />
            <path d="M10.01 14h.005" />
            <path d="M13.01 14h.005" />
            <path d="M16.015 14h.005" />
            <path d="M13.015 17h.005" />
            <path d="M7.01 17h.005" />
            <path d="M10.01 17h.005" />
          </svg>
        }
      />
    </div>
  );
}

// Reusable Card component
function Card({ title, subtitle, buttonText, icon, onClick }) {
  return (
    <div className="bg-white rounded-lg p-6 hover:shadow-x0 transition-shadow duration-200">
      <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
      <p className="text-sm text-gray-500 mb-8">{subtitle}</p>
      <div className="flex items-center justify-center mb-[5rem] mt-12">
        {icon}
      </div>
      <button
        onClick={onClick}
        className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold disabled:opacity-50 mt-6"
        style={{ boxShadow: '0 4px 0 #1e40af, 0 6px 8px rgba(0,0,0,0.3)' }}
        onMouseEnter={(e) => {
          e.target.style.boxShadow = '0 8px 0 #1e2b7a, 0 10px 20px rgba(0,0,0,0.4)';
          e.target.style.transform = 'translateY(-4px)';
        }}
        onMouseLeave={(e) => {
          e.target.style.boxShadow = '0 4px 0 #1e2b7a, 0 6px 8px rgba(0,0,0,0.3)';
          e.target.style.transform = 'translateY(0px)';
        }}
      >
        {buttonText}
      </button>
    </div>
  );
}

