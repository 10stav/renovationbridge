import React, { useState, useCallback } from 'react';
import { useAuth } from '../auth/AuthContext'; // adjust path if needed




function AcceptJobButton({ job, onJobAccepted }) {
  const { user, authenticatedRequest } = useAuth();
  const [booking, setBooking] = useState(false);
  const [showTimeSelection, setShowTimeSelection] = useState(false);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [selectedTimeOption, setSelectedTimeOption] = useState('');
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [alreadyBooked, setAlreadyBooked] = useState(false);
  const [checkingBookingStatus, setCheckingBookingStatus] = useState(false);

  // Move checkExistingBooking here (before any early returns)
  const checkExistingBooking = useCallback(async () => {
    console.log('🔍 checkExistingBooking called');
    console.log('Job check:', !!job, 'User check:', !!user);

    if (!job || !user) {
      console.log('❌ Early return - missing job or user');
      return;
    }

    console.log('📧 Checking for homeowner:', job.customerEmail);
    console.log('👤 Contractor ID:', user._id);

    setCheckingBookingStatus(true);
    try {
      const response = await authenticatedRequest('/contractor/check-existing-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          homeownerEmail: job._originalEmail || job.customerEmail,
          contractorId: user._id
        })
      });

      const data = await response.json();
      if (data.hasExistingBooking) {
        setAlreadyBooked(true);
      }
    } catch (error) {
      console.error('Error checking existing booking:', error);
    } finally {
      setCheckingBookingStatus(false);
    }
  }, [job?.customerEmail, job?._originalEmail, user?._id, authenticatedRequest]);

  React.useEffect(() => {
    console.log('🔍 AcceptJobButton useEffect triggered');
    console.log('Job:', job?.customerName);
    console.log('User:', user?.name);
    checkExistingBooking();
  }, [checkExistingBooking]);

  // Safety check AFTER all hooks
  if (!job) {
    return null;
  }

  const fetchContactTimes = async () => {
    setLoadingTimes(true);
    try {
      console.log('🔍 Fetching available times for:', job.customerEmail);

      const response = await fetch('/api/contractorPortal/contractor/contact-times', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          homeownerEmail: job._originalEmail || job.customerEmail  // ← to avoid masking causing issues
        })
      });

      const data = await response.json();

      if (data.success && data.availableTimes) {
        const times = data.availableTimes.filter(time => time && time.trim());
        setAvailableTimes(times);

        if (times.length > 0) {
          setSelectedTimeOption(times[0]); // Default to first option
        }
        setShowTimeSelection(true);
      } else {
        console.error('Failed to fetch contact times:', data.error);
        alert(`❌ ${data.error || 'Failed to fetch available times'}`);
      }
    } catch (error) {
      console.error('Error fetching contact times:', error);
      alert('❌ Error fetching available times');
    } finally {
      setLoadingTimes(false);
    }
  };

  const parseTimeOption = timeOption => {
    const [datePart, timePart] = timeOption.split(',').map(s => s.trim());
    const [M, D, YY] = datePart.split('/');
    const isoDate = `20${YY.padStart(2, '0')}-${M.padStart(2, '0')}-${D.padStart(2, '0')}`;
    return { date: isoDate, time: timePart };
  };

  const handleAcceptJob = async () => {
    console.log('🎯 BUTTON CLICKED - Starting job acceptance process');
    console.log('📋 Job data:', job);

    // First fetch the available times
    await fetchContactTimes();
  };



  const confirmBooking = async () => {
    if (!selectedTimeOption) {
      alert('Please select an available time.');
      return;
    }

    const confirmed = window.confirm(`Are you sure you want to book an appointment with ${job.customerName} for:\n\n${selectedTimeOption}`);

    if (!confirmed) {
      console.log('❌ User cancelled booking');
      return;
    }

    console.log('✅ User confirmed booking, proceeding...');
    setBooking(true);
    setShowTimeSelection(false);

    try {
      // Parse the selected time option to extract date and time
      const parsedTime = parseTimeOption(selectedTimeOption);

      console.log('📅 Parsed date:', parsedTime.date);
      console.log('⏰ Parsed time:', parsedTime.time);

      const appointmentData = {
        jobId: job._id,
        timeSlot: selectedTimeOption,  // ← This sends "8/30/25, 10:30 AM" directly
        notes: `Appointment between contractor and ${job.customerName}`
      };

      console.log('📤 SENDING TO BACKEND:');
      console.log(JSON.stringify(appointmentData, null, 2));

      const response = await authenticatedRequest('/contractor/book-appointment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointmentData)
      });

      console.log('📥 Response status:', response.status);

      const result = await response.json();
      console.log('📥 Full response data:', result);

      if (result.success) {
        console.log('🎉 SUCCESS!');
        alert(`✅ Job accepted successfully!\nAppointment scheduled for ${selectedTimeOption}`);

        // Update local state to show restriction immediately
        setAlreadyBooked(true);

        if (onJobAccepted) {
          onJobAccepted(job._id, result.data);
        }
      } else {
        // FIX: Better error handling - this will show the actual error message
        console.log('❌ Backend returned error:');
        console.log('  - Message:', result.message);
        console.log('  - Error:', result.error);
        console.log('  - Full result:', result);

        const errorMessage = result.message || 'Unknown error occurred';
        alert(`❌ Error: ${errorMessage}`);  // ← FIXED: Use result.message instead of result.error
      }
    } catch (error) {
      console.error('❌ Frontend error:', error);
      alert(`❌ Error connecting to server: ${error.message}`); //
    } finally {
      setBooking(false);
    }
  };





  const cancelTimeSelection = () => {
    setShowTimeSelection(false);
    setSelectedTimeOption('');
    setAvailableTimes([]);
  };


  const unbookedTimes = availableTimes.filter(time =>
    !job.bookedTimes?.some(booked => booked.time === time)
  );




  return (
    <div className="space-y-4">
      {/* Time Selection Modal - Portal Style */}
      {showTimeSelection && (
        <>
          {/* Backdrop */}
          <div
            className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999999,
              backgroundColor: 'rgba(0, 0, 0, 0.5)'
            }}
            onClick={cancelTimeSelection}
          ></div>

          {/* Modal Content */}
          <div
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl"
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 1000000,
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '24px',
              maxWidth: '400px',
              width: '90%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}
          >
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>
              📅 Select Appointment Time
            </h3>

            <div style={{ marginBottom: '24px' }}>
              <div style={{ marginBottom: '12px' }}>
                <strong>Customer:</strong> {job.customerName}
              </div>
              <div style={{ marginBottom: '12px' }}>
                <strong>Project:</strong> {job.projectDescription || 'Details to be discussed'}
              </div>

              <div>
                <strong>Available Times (Set by Admin):</strong>
                {loadingTimes ? (
                  <div style={{ marginTop: '8px', color: '#666' }}>Loading available times...</div>
                ) : (
                  <select
                    value={selectedTimeOption}
                    onChange={(e) => setSelectedTimeOption(e.target.value)}
                    style={{
                      marginTop: '8px',
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #ccc',
                      borderRadius: '6px',
                      backgroundColor: 'white',
                      fontSize: '14px'
                    }}
                  >
                    {unbookedTimes.map((time, index) => (
                      <option key={index} value={time}>
                        {time}
                      </option>
                    ))}

                  </select>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={confirmBooking}
                disabled={booking || !selectedTimeOption || loadingTimes}
                style={{
                  flex: 1,
                  backgroundColor: booking || !selectedTimeOption || loadingTimes ? '#ccc' : '#16a34a',
                  color: 'white',
                  padding: '12px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  fontWeight: '600',
                  cursor: booking || !selectedTimeOption || loadingTimes ? 'not-allowed' : 'pointer'
                }}
              >
                {booking ? 'Booking...' : 'Confirm & Book'}
              </button>
              <button
                onClick={cancelTimeSelection}
                disabled={booking}
                style={{
                  flex: 1,
                  backgroundColor: booking ? '#ccc' : '#6b7280',
                  color: 'white',
                  padding: '12px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  fontWeight: '600',
                  cursor: booking ? 'not-allowed' : 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </>
      )}

      {/* Appointment Preview
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-semibold text-blue-800 mb-2"> Appointment Preview:</h4>
        <div className="space-y-1 text-sm">
          <p><span className="font-medium">Date & Time:</span> Admin will provide available times</p>
          <p><span className="font-medium">Homeowner:</span> {job.customerName}</p>
          <p><span className="font-medium">Email:</span> {job.customerEmail}</p>
          <p><span className="font-medium">Phone:</span> {job.customerPhone}</p>
          <p><span className="font-medium">Project:</span> {job.projectDescription || 'Details to be discussed'}</p>
          <p><span className="font-medium">Budget:</span> ${job.projectBudget || 'TBD'}</p>
        </div>
      </div> */}

      {/*
       // Debug Info 
      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h5 className="font-medium text-yellow-800 mb-1">🔍 Debug Info:</h5>
        <div className="text-xs space-y-1">
          <p>Job ID: {job._id}</p>
          <p>Customer Email: {job.customerEmail}</p>
          <p>Will fetch times from custom fields when clicked</p>
        </div>
      </div> 
      */}

      {/* Accept Button or Already Booked Message */}
      {alreadyBooked ? (
        <div className="relative">
          {/* Blur overlay */}
          <div className="absolute inset-0 bg-white bg-opacity-75 backdrop-blur-sm rounded-lg z-10 flex items-center justify-center">
            <div className="text-center p-4">
              <div className="text-lg font-semibold text-gray-700 mb-2">
                You've already booked an appointment with this homeowner.
              </div>
              <div className="text-sm text-gray-500">
                Check your appointments to view details.
              </div>
            </div>
          </div>

          {/* Blurred content underneath */}
          <button
            disabled
            className="w-full py-3 px-4 rounded-lg font-semibold bg-gray-300 text-gray-500 cursor-not-allowed filter blur-sm"
          >
            Preview & Schedule
          </button>
        </div>
      ) : (
        <button
          onClick={handleAcceptJob}
          disabled={booking || loadingTimes || checkingBookingStatus || (job?.status && job.status !== 'available')}
          className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${(!job?.status || job.status === 'available') && !booking && !loadingTimes && !checkingBookingStatus
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          style={{
            boxShadow: (!job?.status || job.status === 'available') && !booking && !loadingTimes && !checkingBookingStatus
              ? '0 4px 0 #1e40af, 0 6px 8px rgba(0,0,0,0.3)'
              : 'none'
          }}
          onMouseEnter={(e) => {
            if ((!job?.status || job.status === 'available') && !booking && !loadingTimes && !checkingBookingStatus) {
              e.target.style.boxShadow = '0 8px 0 #1e40af, 0 10px 20px rgba(0,0,0,0.4)';
              e.target.style.transform = 'translateY(-4px)';
            }
          }}
          onMouseLeave={(e) => {
            if ((!job?.status || job.status === 'available') && !booking && !loadingTimes && !checkingBookingStatus) {
              e.target.style.boxShadow = '0 4px 0 #1e40af, 0 6px 8px rgba(0,0,0,0.3)';
              e.target.style.transform = 'translateY(0px)';
            }
          }}
        >
          {checkingBookingStatus ? 'Checking...' : loadingTimes ? 'Loading Times...' : booking ? 'Creating Appointment...' : 'Preview & Schedule'}
        </button>
      )}
    </div>
  );
}

export default AcceptJobButton;