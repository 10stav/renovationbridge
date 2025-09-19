// src/components/contractor/ContractorJobsList.jsx

import React, { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import AcceptJobButton from './AcceptJobButton';

function ContractorJobsList({ jobs, loading, onBook, onBack }) {
  const { user } = useAuth();
  const [selectedJob, setSelectedJob] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [hiddenJobs, setHiddenJobs] = useState(new Set());

  /**
   * FILTER JOBS - Apply search filtering
   */
  const filteredJobs = jobs.filter(job => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      job.customerName?.toLowerCase().includes(searchLower) ||
      job.customerEmail?.toLowerCase().includes(searchLower) ||
      job.location?.fullAddress?.toLowerCase().includes(searchLower) ||
      job.projectDescription?.toLowerCase().includes(searchLower) ||
      job.projectBudget?.toLowerCase().includes(searchLower)
    );
  });

  /**
   * HANDLE JOB ACCEPTED - Callback when AcceptJobButton books appointment
   */
  const handleJobAccepted = (jobId, appointmentData) => {
    console.log('✅ Job accepted:', jobId, appointmentData);
    if (onBook) onBook(jobId, appointmentData);
  };

  /**
   * TOGGLE JOB DETAILS - Expand/collapse job information
   */
  const toggleJobDetails = jobId => {
    setSelectedJob(selectedJob === jobId ? null : jobId);
  };

  /**
   * GET STATUS COLOR - Return styling for job status
   */
  const getStatusColor = status => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'claimed':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  /**
   * COUNT AVAILABLE TIMES - Number of free time slots
   */
  const countAvailableTimes = job => {
    if (!job.availableTimes) return 0;
    if (!job.bookedTimes) return job.availableTimes.length;
    return job.availableTimes.filter(t => !job.bookedTimes.includes(t)).length;
  };

  /**
 * HIDE JOB - Add job to hidden set
 */
  const hideJob = (jobId) => {
    setHiddenJobs(prev => new Set([...prev, jobId]));
  };

  /**
   * UNHIDE JOB - Remove job from hidden set  
   */
  const unhideJob = (jobId) => {
    setHiddenJobs(prev => {
      const newSet = new Set(prev);
      newSet.delete(jobId);
      return newSet;
    });
  };


  return (
    <div className="space-y-6">
      {/* Moved "Your Filters" */}
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

      {/* Available Jobs Card */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        {/* Header with Back Button */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Available Jobs</h2>
          <button
            onClick={onBack}
            className="bg-gray-500 text-black px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors duration-200 font-medium"
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search jobs by customer, location, or project details..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Tag Filtering Info
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-800 mb-2"> Personalized Job Filtering</h3>
          <p className="text-blue-700 text-sm">
          </p>
        </div> */}

        {/* Jobs Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing <span className="font-semibold text-blue-600">{filteredJobs.length}</span>
            {searchTerm && ` of ${jobs.length}`} job
            {filteredJobs.length === 1 ? '' : 's'} available for you
          </p>
        </div>

        {/* Loading / Empty / No Results / Jobs List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center space-x-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
              <p className="text-gray-500 font-medium text-lg">Loading your available jobs...</p>
            </div>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-12">
            {/* Empty State */}
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">No Jobs Available</h3>
            <p className="text-gray-500 mb-2">
              Jobs will appear here when homeowners move to "Need to Book."
            </p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-12">
            {/* No Search Results */}
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Matching Jobs Found</h3>
            <button onClick={() => setSearchTerm('')} className="mt-3 text-blue-600 hover:text-blue-800 font-medium">
              Clear Search
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Jobs List */}
            {filteredJobs.map(job => {
              const availableSlots = countAvailableTimes(job);
              const isExpanded = selectedJob === job._id;
              const isHidden = hiddenJobs.has(job._id);

              return (
                <div key={job._id} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow duration-200">
                  {isHidden ? (
                    // HIDDEN/MINIMIZED VIEW
                    <div className="flex justify-between items-center py-2">
                      <div className="flex items-center text-gray-500">
                        <span className="text-sm">📋 {job.customerName} - Hidden</span>
                        <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">
                          {countAvailableTimes(job)} slots available
                        </span>
                      </div>
                      <button
                        onClick={() => unhideJob(job._id)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium px-3 py-1 rounded hover:bg-blue-50"
                      >
                        Show Job
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Job Header */}
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-800 mb-2">{job.customerName}</h3>
                          <div className="space-y-1 text-gray-600">
                            <p className="flex items-center">
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              {job.customerEmail}
                            </p>
                            {job.customerPhone && (
                              <p className="flex items-center">
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                {job.customerPhone}
                              </p>
                            )}
                            {job.location?.fullAddress && (
                              <p className="flex items-center">
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {job.location.fullAddress}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* ADD HIDE BUTTON HERE */}
                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={() => toggleJobDetails(job._id)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >

                          </button>
                          <button
                            onClick={() => hideJob(job._id)}
                            className="text-gray-400 hover:text-gray-600 text-sm font-medium"
                            title="Hide this job"
                          >
                            Hide Job
                          </button>
                        </div>
                      </div>

                      {/* Status and Slots (commented out) */}
                      {/* <div className="text-right ml-6">…</div> */}

                      {/* Project Budget */}
                      {job.projectBudget && (
                        <div className="mb-4">
                          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                            Budget: {job.projectBudget}
                          </span>
                        </div>
                      )}

                      {/* Homeowner Tags */}
                      {job.homeownerTags && job.homeownerTags.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm font-medium text-gray-700 mb-2">Project Requirements:</p>
                          <div className="flex flex-wrap gap-2">
                            {job.homeownerTags.map(tag => (
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


                      {/* Description
                  <div className="mb-4">
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {job.projectDescription
                        ? job.projectDescription.length > 150 && !isExpanded
                          ? `${job.projectDescription.slice(0, 150)}…`
                          : job.projectDescription
                        : `Renovation consultation with ${job.customerName}.`}
                    </p>
                  </div> */}

                      {/* Available Times Display */}
                      <div className="bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-sm mb-4">
                        {(() => {
                          // Expand ranges first, then filter
                          const expandedTimes = expandTimeRanges(job.availableTimes || []);
                          let actuallyAvailableTimes = [];

                          if (expandedTimes && Array.isArray(expandedTimes)) {
                            // Filter out times that are in bookedTimes array
                            actuallyAvailableTimes = expandedTimes.filter(time => {
                              // If no booked times, all are available
                              if (!job.bookedTimes || !Array.isArray(job.bookedTimes)) {
                                return true;
                              }

                              // Check if this time is NOT in the booked times (using .some() to check .time property)
                              return !job.bookedTimes.some(booked => booked.time === time);
                            });
                          }

                          if (actuallyAvailableTimes.length > 0) {
                            return (
                              <div>
                                <div className="font-medium mb-2">Available Times:</div>
                                <div className="text-xs space-y-1">
                                  {actuallyAvailableTimes.map((time, index) => (
                                    <div key={index}>{time}</div>
                                  ))}
                                </div>
                              </div>
                            );
                          } else {
                            return 'No times available';
                          }
                        })()}
                      </div>

                      {/* Action Buttons */}
                      {/* <div className="flex flex-wrap gap-1 mb-4">
          <span className="bg-gray-50 text-gray-600 px-3 py-2 rounded-lg text-xs">
            Posted: {new Date(job.createdAt).toLocaleDateString()}
          </span>
        </div> */}

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-3">
                          {job.projectTimeline && (
                            <div>
                              <h4 className="font-medium text-gray-800">Timeline:</h4>
                              <p className="text-gray-600 text-sm">{job.projectTimeline}</p>
                            </div>
                          )}
                          <div>
                            <h4 className="font-medium text-gray-800">Job Details:</h4>
                            <div className="text-sm text-gray-600 space-y-1">
                              <p>Customer ID: {job.customerId}</p>
                              <p>Job ID: {job._id}</p>
                              <p>Created: {new Date(job.createdAt).toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* AcceptJobButton */}
                      <div className="border-t pt-4">
                        <AcceptJobButton job={job} onJobAccepted={handleJobAccepted} />
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>     // This closes the main jobs card
        )}
      </div>
    </div>
  );
}

/**
 * Expand time ranges and normalize time formats
 */
function expandTimeRanges(timeArray) {
  const expandedTimes = [];

  for (let timeEntry of timeArray) {
    if (!timeEntry || typeof timeEntry !== 'string') continue;

    // Normalize the time format first (Issue 2)
    timeEntry = normalizeTimeFormat(timeEntry);

    // Check if it's a time range (Issue 1)
    if (isTimeRange(timeEntry)) {
      const expanded = expandSingleTimeRange(timeEntry);
      expandedTimes.push(...expanded);
    } else {
      expandedTimes.push(timeEntry);
    }
  }

  // Remove duplicates
  return [...new Set(expandedTimes)];
}

/**
 * Normalize time formats (4:20pm -> 4:20 PM)
 */
function normalizeTimeFormat(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return timeStr;
  
  // Simply find any am/pm (case insensitive) and make it uppercase
  return timeStr.replace(/\b([ap])m\b/gi, function(match, letter) {
    return letter.toUpperCase() + 'M';
  });
}

/**
 * Check if a time string contains a range
 */
function isTimeRange(timeStr) {
  // Patterns: "11:00 AM - 2:00 PM", "11:00 AM to 2:00 PM", "11:00 AM-2:00 PM"
  return /\d+:\d+\s*[AP]M\s*(-|to)\s*\d+:\d+\s*[AP]M/i.test(timeStr);
}

/**
 * Expand a single time range into hourly slots
 */
function expandSingleTimeRange(timeStr) {
  try {
    // Extract date part if present (e.g., "9/28/25, 11:00 AM - 2:00 PM")
    const parts = timeStr.split(',');
    const datePart = parts.length > 1 ? parts[0].trim() + ', ' : '';
    const timeRangePart = parts.length > 1 ? parts[1].trim() : timeStr.trim();

    // Parse the time range
    const rangeMatch = timeRangePart.match(/(\d+:\d+\s*[AP]M)\s*(-|to)\s*(\d+:\d+\s*[AP]M)/i);
    if (!rangeMatch) return [timeStr];

    const startTimeStr = rangeMatch[1].trim();
    const endTimeStr = rangeMatch[3].trim();

    // Convert to 24-hour for easier calculation
    const startTime24 = convertTo24Hour(startTimeStr);
    const endTime24 = convertTo24Hour(endTimeStr);

    const startHour = parseInt(startTime24.split(':')[0]);
    const endHour = parseInt(endTime24.split(':')[0]);

    const expandedSlots = [];

    // Generate hourly slots from start to end (inclusive)
    for (let hour = startHour; hour <= endHour; hour++) {
      const time12h = convertTo12Hour(hour);
      expandedSlots.push(datePart + time12h);
    }

    return expandedSlots;

  } catch (error) {
    console.error('Error expanding time range:', timeStr, error);
    return [timeStr]; // Return original if parsing fails
  }
}

/**
 * Convert 12-hour time to 24-hour format
 */
function convertTo24Hour(time12h) {
  const [time, modifier] = time12h.split(' ');
  let [hours, minutes] = time.split(':');

  if (hours === '12') hours = '00';
  if (modifier.toUpperCase() === 'PM') hours = parseInt(hours, 10) + 12;

  hours = hours.toString().padStart(2, '0');
  return `${hours}:${minutes || '00'}`;
}

/**
 * Convert 24-hour format back to 12-hour
 */
function convertTo12Hour(hour24) {
  const hour = hour24 % 12 || 12;
  const modifier = hour24 < 12 ? 'AM' : 'PM';
  return `${hour}:00 ${modifier}`;
}


export default ContractorJobsList;