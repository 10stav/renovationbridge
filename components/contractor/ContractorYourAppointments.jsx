import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import FeedbackForm from './FeedbackForm'; // ADD THIS IMPORT

export default function ContractorYourAppointments({ jobs, loading, onBack, onRefresh }) {
    const { user, authenticatedRequest } = useAuth();
    const [selectedJob, setSelectedJob] = useState(null);
    const [searchTerm, setSearchTerm] = useState(''); //creates a react variable called searchTerm, sets it initially to '', creates a function called setSearchTerm to update the state, this state is then available throuought this entire file(ContractorYourAppointments.jsx)
    const [syncing, setSyncing] = useState(false);
    const [feedbackModal, setFeedbackModal] = useState({ show: false, job: null, time: null });

    // // Auto-sync with GHL when component loads
    // useEffect(() => {
    //     const syncAppointments = async () => {
    //         try {
    //             setSyncing(true);
    //             console.log('🔄 Auto-syncing appointments with GHL...');

    //             const response = await authenticatedRequest('/contractor/sync-appointments', {
    //                 method: 'POST'
    //             });

    //             if (response.ok) {
    //                 const result = await response.json();
    //                 console.log('✅ Sync completed:', result.results);

    //                 // If any appointments were removed, refresh the data
    //                 if (result.results.appointmentsRemoved > 0) {
    //                     console.log(`🧹 Removed ${result.results.appointmentsRemoved} deleted appointments`);

    //                     // Force refresh with a small delay to ensure backend is updated
    //                     setTimeout(() => {
    //                         if (onRefresh) {
    //                             onRefresh();
    //                         }
    //                     }, 500);
    //                 }
    //             }
    //         } catch (error) {
    //             console.error('❌ Auto-sync failed:', error);
    //         } finally {
    //             setSyncing(false);
    //         }
    //     };

    //     // Only sync if we have appointments to check
    //     if (jobs && jobs.length > 0) {
    //         syncAppointments();
    //     }
    // }, []); // Trigger when jobs array changes

    // Manual sync function for the sync button
    const handleManualSync = async () => {
        try {
            setSyncing(true);
            console.log('🔄 Manual sync triggered...');

            const response = await authenticatedRequest('/contractor/sync-appointments', {
                method: 'POST'
            });

            if (response.ok) {
                const result = await response.json();
                console.log('✅ Manual sync completed:', result.results);

                // Show user the results
                if (result.results.appointmentsRemoved > 0) {
                    alert(`✅ Sync complete! Removed ${result.results.appointmentsRemoved} deleted appointments.`);
                    // Refresh the data
                    if (onRefresh) {
                        onRefresh();
                    }
                } else {
                    alert('✅ Sync complete! All appointments are up to date.');
                }
            }
        } catch (error) {
            console.error('❌ Manual sync failed:', error);
            alert('❌ Sync failed. Please try again.');
        } finally {
            setSyncing(false);
        }
    };

    // // Filter by name, email, address, description or budget
    // const filteredJobs = jobs.filter(job => { 
    // // Creates a NEW array called filteredJobs by calling the .filter() method on the jobs array
    // // .filter() tests each job against the condition below and only includes jobs that return true
    //     if (!searchTerm) return true; 
    //     // If searchTerm is empty/null/undefined, return true (include this job in filtered results)
    //     const term = searchTerm.toLowerCase();
    //     // Convert searchTerm to lowercase once and store it in 'term' variable for reuse
    //     return (
    //         job.customerName?.toLowerCase().includes(term) ||
    //         job.customerEmail?.toLowerCase().includes(term) ||
    //         job.location?.fullAddress?.toLowerCase().includes(term) ||
    //         job.projectDescription?.toLowerCase().includes(term) ||
    //         String(job.projectBudget)?.toLowerCase().includes(term) ||
    //         // also allow searching by date/time
    //         job.appointments?.some(app =>
    //             app.scheduledDate.includes(term) ||
    //             app.scheduledTime.toLowerCase().includes(term)
    //         )
    //     );
    // });

    console.log('jobs array:', jobs);
    console.log('jobs.length:', jobs.length);
    const filteredJobs = jobs; // No filtering at all, just use all jobs
    console.log('filteredJobs.length:', filteredJobs.length);

    const toggleJobDetails = jobId =>
        setSelectedJob(selectedJob === jobId ? null : jobId);

    return (
        <div className="space-y-6">
            {user?.contractorTags?.length > 0 && (
                <div className="bg-purple border border-white-200 rounded-lg p-4">
                    <h3 className="font-semibold text-purple-800 mb-2"> Your Filters</h3>
                    <div className="flex flex-wrap gap-2">
                        {user.contractorTags.map(tag => (
                            <span
                                key={tag}
                                className="bg-purple-100 text-purple-800 text-sm px-3 py-1 rounded-full font-medium"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Your Appointments</h2>
                    <div className="flex gap-2">
                        {/* Sync button
                        <button
                            onClick={handleManualSync}
                            disabled={syncing}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${syncing
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-blue-500 text-white hover:bg-blue-600'
                                }`}
                        >
                            {syncing ? '🔄 Syncing...' : '🔄 Sync'}
                        </button> */}

                        <button
                            onClick={onBack}
                            className="bg-gray-500 text-black px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors duration-200 font-medium"
                        >
                            ← Back to Dashboard
                        </button>
                    </div>
                </div>

                {/* Show sync status */}
                {syncing && (
                    <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-blue-700">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />
                            <span className="text-sm">Checking for deleted appointments...</span>
                        </div>
                    </div>
                )}

                <div className="mb-6">
                    <input
                        type="text"
                        placeholder="Search appointments by customer, date, time, location, or project..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                <div className="mb-6">
                    <p className="text-gray-600">
                        Showing{' '}
                        <span className="font-semibold text-blue-600">
                            {filteredJobs.length}
                        </span>{' '}
                        {filteredJobs.length === 1 ? 'appointment' : 'appointments'}
                        {searchTerm && ` of ${jobs.length}`}
                    </p>
                </div>

                {loading ? (
                    <div className="text-center py-12">
                        <div className="inline-flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                            <p className="text-gray-500 font-medium text-lg">
                                Loading your appointments...
                            </p>
                        </div>
                    </div>
                ) : jobs.length === 0 ? (
                    <div className="text-center py-12">
                        <h3 className="text-xl font-semibold text-gray-900 mb-3">
                            No Appointments Yet
                        </h3>
                        <p className="text-gray-500">
                            Once you've booked, your appointments will appear here.
                        </p>
                    </div>
                ) : filteredJobs.length === 0 ? (
                    <div className="text-center py-12">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            No Matching Appointments
                        </h3>
                        <button
                            onClick={() => setSearchTerm('')}
                            className="mt-3 text-blue-600 hover:text-blue-800 font-medium"
                        >
                            Clear Search
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {filteredJobs.map(job => {
                            const isExpanded = selectedJob === job._id;
                            return (
                                <div
                                    key={job._id}
                                    className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow duration-200"
                                >
                                    {/* Job Header */}
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex-1">
                                            <h3 className="text-xl font-bold text-gray-800 mb-1">
                                                {job.customerName}
                                            </h3>
                                            <div className="space-y-1 text-gray-600 text-sm">
                                                <p>Email: {job.customerEmail}</p>
                                                {job.customerPhone && <p>Phone number: {job.customerPhone}</p>}
                                                {job.location?.fullAddress && (
                                                    <p>Address: {job.location.fullAddress}</p>
                                                )}
                                                {/* Appointments info moved here */}
                                                {job.appointments?.map(app => (
                                                    <div
                                                        key={app.ghlAppointmentId}
                                                        className="bg-gray-50 rounded-lg p-3 mt-2"
                                                    >
                                                        <p className="text-gray-800">
                                                            <strong>Date:</strong> {app.scheduledDate}
                                                        </p>
                                                        <p className="text-gray-800">
                                                            <strong>Time:</strong> {app.scheduledTime}
                                                        </p>
                                                        {/* ADD FEEDBACK BUTTON HERE */}
                                                        {(() => {
                                                            const hasFeedback = job.feedback?.some(f =>
                                                                f.contractorId === user.id.toString() &&
                                                                f.appointmentTime === `${app.scheduledDate}, ${app.scheduledTime}`
                                                            );

                                                            if (hasFeedback) {
                                                                return (
                                                                    <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3">
                                                                        <p className="text-green-800 font-medium mb-1">✓ Feedback Submitted</p>
                                                                        <p className="text-sm text-gray-600">
                                                                            Add or change feedback? Contact{' '}
                                                                            <a href="mailto:onn@renovationbridge.com" className="text-blue-600 hover:underline">
                                                                                onn@renovationbridge.com
                                                                            </a>
                                                                        </p>
                                                                    </div>
                                                                );
                                                            } else {
                                                                return (
                                                                    <button
                                                                        onClick={() => {
                                                                            setFeedbackModal({
                                                                                show: true,
                                                                                job: job,
                                                                                time: `${app.scheduledDate}, ${app.scheduledTime}`
                                                                            });
                                                                        }}
                                                                        className="mt-3 bg-blue-600 text-white py-2 px-4 rounded-xl font-semibold"
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
                                                                        Leave Feedback
                                                                    </button>
                                                                );
                                                            }
                                                        })()}

                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>


                                    {/* Project Budget / Description */}
                                    {/* {job.projectBudget && (
                                                <p className="text-green-800">
                                                    💰 <strong>Budget:</strong> {job.projectBudget}
                                                </p>
                                            )}
                                            <p className="text-gray-700">
                                                {job.projectDescription || 'No description provided.'}
                                            </p> */}

                                    {/* Debug / Meta Info */}
                                    {/* <div className="text-xs text-gray-500">
                                                <p>Job ID: {job._id}</p>
                                                <p>
                                                    Created:{' '}
                                                    {new Date(job.createdAt).toLocaleString()}
                                                </p>
                                            </div> */}
                                </div>
                            );
                        })}
                    </div>
                )}

            </div>
            {/* ADD FEEDBACK MODAL AT THE END */}
            {feedbackModal.show && (
                <FeedbackForm
                    job={feedbackModal.job}
                    appointmentTime={feedbackModal.time}
                    onClose={() => setFeedbackModal({ show: false, job: null, time: null })}
                    onSuccess={() => {
                        alert('Thank you for your feedback!');
                        setFeedbackModal({ show: false, job: null, time: null });
                        if (onRefresh) {
                            onRefresh();
                        }
                    }}
                />
            )}

        </div>
    );
}