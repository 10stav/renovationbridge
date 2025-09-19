/**
 * ADMIN JOBS VIEW - Job oversight and monitoring interface
 * 
 * Provides comprehensive view of all available jobs in the system.
 * Extracted from App.jsx to create a focused job management interface.
 * 
 * Features:
 * - Display all jobs from GHL "Need to Book" webhook
 * - Show job details, customer information, and appointment times
 * - Monitor job status and booking progress
 * - View homeowner tags for filtering reference
 * - Professional job card layout with detailed information
 * 
 * Business Logic:
 * - Shows jobs created by GHL webhook when admin drags to "Need to Book"
 * - Displays admin-set appointment times from GHL custom fields
 * - Shows which jobs have been booked vs still available
 * - Provides insight into job distribution and contractor activity
 * 
 * Data Sources:
 * - Jobs from AvailableJob database model
 * - Customer data from GHL webhook
 * - Appointment times from GHL custom fields
 * - Booking status and contractor assignments
 * 
 * Integration:
 * - Receives job data from parent AdminDashboard
 * - Displays real-time job status and availability
 * - Shows the flow from GHL → Database → Contractor Portal
 * 
 * Usage:
 * <AdminJobsView 
 *   jobs={jobs}
 *   loading={loading}
 *   onBack={backFunction}
 * />
 */

import React, { useState } from 'react';

function AdminJobsView({ jobs, loading, onBack }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  /**
   * FILTER JOBS - Apply search and status filters
   * 
   * Allows admin to filter jobs by customer name, email, or status.
   * Helps manage large lists of jobs efficiently.
   */
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = searchTerm === '' ||
      job.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.location?.fullAddress?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  /**
   * GET STATUS COLOR - Return appropriate styling for job status
   * 
   * @param {string} status - Job status (available, claimed, completed, etc.)
   * @returns {string} - Tailwind CSS classes for status styling
   */
  const getStatusColor = (status) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'claimed':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  /**
   * FORMAT DATE - Format creation date for display
   * 
   * @param {string} dateString - ISO date string
   * @returns {string} - Formatted date and time
   */
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  /**
   * COUNT APPOINTMENTS - Count booked vs available appointments
   * 
   * @param {Object} job - Job object
   * @returns {Object} - Appointment counts
   */
  const getAppointmentCounts = (job) => {
    const totalTimes = job.availableTimes?.length || 0;
    const bookedTimes = job.bookedTimes?.length || 0;
    const appointments = job.appointments?.length || 0;

    return {
      total: totalTimes,
      booked: bookedTimes,
      available: totalTimes - bookedTimes,
      appointments: appointments
    };
  };

  /**
 * REMOVE CONTRACTOR BOOKING - Remove a specific contractor's booking
 */
  const removeContractorBooking = async (jobId, contractorId, timeSlot, contractorName) => {
    const confirmed = window.confirm(
      `Remove booking for ${contractorName} at ${timeSlot}?\n\nThis will allow the contractor to book with this homeowner again.\n\n⚠️ REMINDER: You must also manually cancel/delete the corresponding appointment in the GoHighLevel calendar. This action only removes the booking from our database.`
    );

    if (!confirmed) return;

    try {
      const response = await fetch('/api/contractorPortal/admin/remove-contractor-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, contractorId, timeSlot })
      });

      const result = await response.json();

      if (result.success) {
        alert('OK. Contractor booking removed successfully from database.\n\n REMINDER: Don\'t forget to cancel the appointment in GoHighLevel calendar as well.');
        window.location.reload();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error removing contractor booking:', error);
      alert('Error removing contractor booking');
    }
  };

  /**
//  * DELETE ENTIRE JOB - Remove job completely from system
//  */
//   const deleteEntireJob = async (jobId, customerName) => {
//     const confirmed = window.confirm(
//       `Delete entire job for ${customerName}?\n\nThis will permanently remove the job and all associated bookings.\n\nNote: This job would normally be removed by dragging it out of "Need to Book" into "Not Interested" in GoHighLevel instead of deleting it here.`
//     );

//     if (!confirmed) return;

//     try {
//       const response = await fetch('/api/contractorPortal/admin/delete-job', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ jobId })
//       });

//       const result = await response.json();

//       if (result.success) {
//         alert('Job deleted successfully');
//         window.location.reload();
//       } else {
//         alert(`Error: ${result.error}`);
//       }
//     } catch (error) {
//       console.error('Error deleting job:', error);
//       alert('Error deleting job');
//     }
//   };


  return (
    <div className="bg-white rounded-lg shadow-lg p-6">

      {/* Header with Back Button */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Available Jobs Overview</h2>
        <button
          onClick={onBack}
          className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors duration-200 font-medium"
        >
          Back to Dashboard
        </button>
      </div>

      {/* System Overview */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-purple-800 mb-2"> GHL Integration Overview</h3>
        <p className="text-purple-700 text-sm">
          These jobs were created when you dragged homeowners to "Need to Book" in GoHighLevel.
          Admin-set appointment times are captured from GHL custom fields and displayed to contractors for booking.
        </p>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by customer name, email, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
        <div className="md:w-48">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="available">Available</option>
            <option value="claimed">Claimed</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Jobs Summary */}
      <div className="mb-6">
        <p className="text-gray-600">
          Showing <span className="font-semibold text-purple-600">{filteredJobs.length}</span> of <span className="font-semibold">{jobs.length}</span> total jobs
        </p>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
            <p className="text-gray-500 font-medium">Loading jobs...</p>
          </div>
        </div>

        /* Empty State - No Jobs */
      ) : jobs.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Jobs Available</h3>
          <p className="text-gray-500">When homeowners are moved to "Need to Book" in GHL, they'll appear here.</p>
          <p className="text-sm text-gray-400 mt-2">Jobs are created automatically via webhook integration.</p>
        </div>

        /* No Filtered Results */
      ) : filteredJobs.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Matching Jobs</h3>
          <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
        </div>

        /* Jobs List */
      ) : (
        <div className="space-y-6">
          {filteredJobs.map(job => {
            const created = formatDate(job.createdAt);
            const appointmentCounts = getAppointmentCounts(job);

            return (
              <div key={job._id} className="border border-gray-200 rounded-lg p-5 hover:bg-gray-50 transition-colors duration-200">

                {/* Job Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-800 mb-1">{job.customerName}</h3>
                    <p className="text-gray-600">{job.customerEmail}</p>
                    {job.customerPhone && (
                      <p className="text-gray-600">{job.customerPhone}</p>
                    )}
                  </div>

                  {/* Status and Stats */}
                  <div className="text-right ml-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(job.status)}`}>
                      {job.status?.toUpperCase() || 'UNKNOWN'}
                    </span>
                    <div className="text-sm text-gray-500 mt-2">
                      Created: {created.date} at {created.time}
                    </div>
                  </div>
                </div>

                {/* Project Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Project Details:</p>
                    <p className="text-gray-600">
                      {job.projectDescription || 'Renovation consultation and project discussion'}
                    </p>
                    {job.projectBudget && (
                      <p className="text-green-600 font-medium mt-1">Budget: {job.projectBudget}</p>
                    )}
                    {job.projectTimeline && (
                      <p className="text-blue-600 text-sm">Timeline: {job.projectTimeline}</p>
                    )}
                  </div>

                  {job.location && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Location:</p>
                      <p className="text-gray-600">
                         {job.location.fullAddress ||
                          `${job.location.address || ''} ${job.location.city || ''} ${job.location.state || ''}`.trim() ||
                          'Location details pending'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Homeowner Tags */}
                {job.homeownerTags && job.homeownerTags.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Homeowner Tags (GHL):</p>
                    <div className="flex flex-wrap gap-2">
                      {job.homeownerTags.map(tag => (
                        <span
                          key={tag}
                          className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full font-medium"
                        >
                           {tag}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Only contractors with matching tags can see this job
                    </p>
                  </div>
                )}

                {/* Available Times and Bookings */}
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Appointment Times (Set by Admin in GHL):
                  </p>

                  {/* Available Times */}
                  {job.availableTimes && job.availableTimes.length > 0 ? (
                    <div className="space-y-2 mb-4">
                      <h4 className="text-sm font-medium text-green-700">Available Times:</h4>
                      <div className="space-y-1">
                        {job.availableTimes.map((time, index) => {
                          const isBooked = job.bookedTimes?.some(booking => booking.time === time);
                          return (
                            <div key={index} className="flex items-center space-x-2">
                              <span className={`text-sm px-3 py-1 rounded-full ${isBooked
                                ? 'bg-red-100 text-red-800'
                                : 'bg-green-100 text-green-800'
                                }`}>
                                {time}
                              </span>
                              {isBooked && (
                                <span className="text-xs text-gray-500">(Booked)</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-400 text-sm italic mb-4">No appointment times set by admin</p>
                  )}

                  {/* Contractor Bookings */}
                  {job.bookedTimes && job.bookedTimes.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-red-700">Contractor Bookings:</h4>
                      <div className="space-y-2">
                        {job.bookedTimes.map((booking, index) => (
                          <div key={index} className="flex items-center justify-between bg-red-50 p-3 rounded-lg">
                            <div>
                              <div className="font-medium text-red-800">{booking.time}</div>
                              <div className="text-sm text-red-600">
                                {booking.contractorName} ({booking.contractorEmail})
                              </div>
                              <div className="text-xs text-gray-500">
                                Booked: {new Date(booking.bookedAt).toLocaleString()}
                              </div>
                            </div>
                            <div className="flex flex-col items-end space-y-1">
                              <button
                                onClick={() => removeContractorBooking(
                                  job._id,
                                  booking.contractorId,
                                  booking.time,
                                  booking.contractorName
                                )}
                                className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                              >
                                Remove Booking
                              </button>
                              <p className="text-xs text-red-600 text-right max-w-32">
                                REMINDER: You must also cancel the appointment in GoHighLevel calendar
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Appointment Statistics */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-lg font-bold text-blue-600">{appointmentCounts.total}</div>
                      <div className="text-xs text-gray-500">Total Slots</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-green-600">{appointmentCounts.available}</div>
                      <div className="text-xs text-gray-500">Available</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-red-600">{appointmentCounts.booked}</div>
                      <div className="text-xs text-gray-500">Booked</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-purple-600">{appointmentCounts.appointments}</div>
                      <div className="text-xs text-gray-500">Appointments</div>
                    </div>
                  </div>
                </div>

                {/* Job ID for Reference */}
                <div className="mt-3 text-xs text-gray-400">
                  Job ID: {job._id} | Customer ID: {job.customerId}
                </div>

                {/* Add this new section
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => deleteEntireJob(job._id, job.customerName)}
                    style={{
                      backgroundColor: '#4B5563',
                      color: 'white',
                      padding: '8px 16px',
                      fontSize: '14px',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'block'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#374151'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#4B5563'}
                  >
                    Delete Entire Job
                  </button>
                  <p className="text-xs text-gray-500 mt-1">
                    This job would normally be removed by dragging it out of "Need to Book" into "Not Interested" in GoHighLevel.
                  </p>
                </div> */}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default AdminJobsView;