/**
 * PENDING CONTRACTORS - Contractor approval interface component
 * 
 * Handles the review and approval of new contractor registrations.
 * Extracted from App.jsx to create a focused approval management interface.
 * 
 * Features:
 * - Display pending contractor applications
 * - Review contractor information and specialties
 * - Approve/deny contractor applications
 * - Loading states and empty state handling
 * - Professional card-based layout
 * 
 * Business Logic:
 * - Only shows contractors with isApproved: false
 * - Approval allows contractors to login and access jobs
 * - Shows all contractor registration details for informed decisions
 * 
 * Integration:
 * - Receives contractor data from parent AdminDashboard
 * - Calls approval functions passed from parent
 * - Updates UI based on loading states
 * 
 * Usage:
 * <PendingContractors 
 *   contractors={contractors}
 *   loading={loading}
 *   onApprove={approveFunction}
 *   onBack={backFunction}
 * />
 */

import React, { useState } from 'react';
import { useAuth } from '../auth/AuthContext';



function PendingContractors({ contractors, loading, onApprove, onDenyRefresh, onBack }) {
  const [ghlIds, setGhlIds] = useState({}); //new - ensures each contractor will have their own GHL ID tracked by ID
  const { authenticatedRequest } = useAuth();
  /**
   * FILTER PENDING CONTRACTORS
   * 
   * Extracts only contractors who haven't been approved yet.
   * These are new registrations waiting for admin review.
   */
  const pendingContractors = contractors.filter(c => !c.isApproved && !c.denied);


  /**
   * HANDLE CONTRACTOR APPROVAL
   * 
   * Confirms approval decision and calls the approval function.
   * Shows confirmation dialog to prevent accidental approvals.
   * 
   * @param {Object} contractor - Contractor object to approve
   */
  const handleApprove = (contractor) => {
    const confirmed = window.confirm(
      `Approve contractor "${contractor.name}" from ${contractor.companyName}?\n\n` +
      `This will allow them to login and access job opportunities.`
    );

    if (confirmed) {
      console.log('✅ PendingContractors: Approving contractor:', contractor.name);
      onApprove(contractor._id, ghlIds[contractor._id] || '');
    }
  };

  /**
   * HANDLE CONTRACTOR DENIAL
   * 
   * Placeholder for future denial functionality.
   * Currently shows alert - would integrate with backend denial endpoint.
   * 
   * @param {Object} contractor - Contractor object to deny
   */
  const handleDeny = async (contractorId, contractorName) => {
    if (!window.confirm(`Are you sure you want to deny ${contractorName}?`)) return;

    console.log(`PendingContractors: Denying contractor: ${contractorName}`);

    try {
      const response = await authenticatedRequest(`/admin/contractors/${contractorId}/deny`, {
        method: 'POST'
      });

      const data = await response.json();

      if (data.success) {
        console.log(` Contractor denied: ${contractorName}`);
        alert(`Contractor ${contractorName} has been denied.`);
        onDenyRefresh(); //  Let the parent refresh the list
      } else {
        alert(`Failed to deny contractor: ${data.message}`);
      }
    } catch (error) {
      console.error(' Error denying contractor:', error);
      alert('An error occurred while denying the contractor.');
    }
  };


  return (
    <div className="bg-white rounded-lg shadow-lg p-6">

      {/* Header with Back Button */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Pending Contractors</h2>
        <button
          onClick={onBack}
          className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors duration-200 font-medium"
        >
          Back to Dashboard
        </button>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <p className="text-gray-500 font-medium">Loading contractors...</p>
          </div>
        </div>

        /* Empty State - No Pending Contractors */
      ) : pendingContractors.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">All Caught Up!</h3>
          <p className="text-gray-500">No pending contractors to approve at this time.</p>
          <p className="text-sm text-gray-400 mt-2">New contractor registrations will appear here for review.</p>
        </div>

        /* Contractor List - Show Pending Applications */
      ) : (
        <div className="space-y-6">
          <div className="mb-4">
            <p className="text-gray-600">
              <span className="font-semibold text-blue-600">{pendingContractors.length}</span> contractor{pendingContractors.length === 1 ? '' : 's'} waiting for approval
            </p>
          </div>

          {pendingContractors.map(contractor => (
            <div key={contractor._id} className="border border-gray-200 rounded-lg p-5 hover:bg-gray-50 transition-colors duration-200">

              {/* Contractor Header Info */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-800 mb-1">{contractor.name}</h3>
                  <p className="text-lg text-blue-600 font-medium">{contractor.companyName || 'No company specified'}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Applied: {new Date(contractor.createdAt).toLocaleDateString()} at {new Date(contractor.createdAt).toLocaleTimeString()}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 ml-4">
                  <button
                    onClick={() => handleApprove(contractor)}
                    className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors duration-200 font-medium shadow-sm"
                  >
                     Approve
                  </button>
                  <button
                    onClick={() => onApprove(contractor._id, '', true)}
                    className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition-colors duration-200 font-medium shadow-sm"
                  >
                     Approve w/o GHL
                  </button>
                  <button
                    className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded"
                    onClick={() => handleDeny(contractor._id, contractor.name)}
                  >
                     Deny
                  </button>

                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Contact Information:</p>
                  <p className="text-gray-600">EMAIL: {contractor.email}</p>
                  {contractor.phone && (
                    <p className="text-gray-600">PHONE NUMBER: {contractor.phone}</p>
                  )}
                </div>

                {contractor.address && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Address:</p>
                    <p className="text-gray-600">
                       {contractor.address.street && `${contractor.address.street}, `}
                      {contractor.address.city && `${contractor.address.city}, `}
                      {contractor.address.state} {contractor.address.zipCode}
                    </p>
                  </div>
                )}
              </div>

              {/* 
  <div className="mb-4">
    <p className="text-sm font-medium text-gray-700 mb-2">Contractor Specialties:</p>
    {contractor.specialties && contractor.specialties.length > 0 ? (
      <div className="flex flex-wrap gap-2">
        {contractor.specialties.map((specialty) => (
          <span
            key={specialty}
            className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full font-medium"
          >
            {specialty}
          </span>
        ))}
      </div>
    ) : (
      <p className="text-gray-400 text-sm italic">No specialties specified</p>
    )}
  </div>
*/}

              {/* Current Tags (if any) */}
              {contractor.contractorTags && contractor.contractorTags.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Current Admin Tags:</p>
                  <div className="flex flex-wrap gap-2">
                    {contractor.contractorTags.map(tag => (
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

              {/* Additional Notes Section */}
              <div className="mt-4">
                <label className="text-sm font-medium text-gray-700">
                  GHL User ID (Team Member ID)
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  If this contractor is already listed under <strong>GHL → Settings → Team Management</strong>, you do <strong>not</strong> need to enter anything — just click <strong>✅ Approve</strong>.<br /><br />
                  Otherwise, if this contractor is new and not yet a GHL team member, you must enter their GHL ID here.
                  <br /><br />
                  Since team member URLs aren't clickable, here’s how to get the ID:
                  <br />
                  1. Right click the team member’s name in GHL and choose <strong>“Copy link address”</strong>.
                  <br />
                  2. Paste it and look for something like <code>team-members/abc123</code>.
                  <br />
                  3. Enter just the <code>abc123</code> portion here.
                </p>

                <input
                  type="text"
                  placeholder="e.g. abc123..."
                  value={ghlIds[contractor._id] || ''}
                  onChange={(e) =>
                    setGhlIds((prev) => ({ ...prev, [contractor._id]: e.target.value }))
                  }
                  className="border px-2 py-1 rounded w-full"
                />
              </div>

              <div className="bg-gray-50 rounded-lg p-3 mt-4">
                <p className="text-xs text-gray-500">
                   <strong>Next Steps:</strong> After approval, this contractor will be able to login and view available jobs.
                  You can assign filtering tags in the "Manage Contractors" section to control which jobs they see.
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PendingContractors;