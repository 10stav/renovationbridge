/**
 * MANAGE CONTRACTORS - Tag assignment and contractor management interface
 * 
 * Handles the assignment of filtering tags to approved contractors.
 * Extracted from App.jsx to create a focused contractor management interface.
 * 
 * Features:
 * - View all approved contractors
 * - Assign/edit filtering tags for job matching
 * - Inline editing interface for tag management
 * - Contractor deactivation (placeholder)
 * - Professional contractor information display
 * 
 * Business Logic:
 * - Only shows approved contractors (isApproved: true)
 * - Tags control which jobs contractors can see
 * - Homeowner GHL tags match against contractor tags
 * - Multiple tags can be assigned per contractor
 * 
 * Tag System:
 * - prefab: Specialized prefab/modular construction
 * - luxury: High-end luxury projects
 * - kitchen-exclusive: Kitchen specialists only
 * - bathroom-only: Bathroom renovation specialists
 * - commercial: Commercial/business projects
 * - residential: Residential projects
 * 
 * Integration:
 * - Receives contractor data from parent AdminDashboard
 * - Calls tag update functions passed from parent
 * - Updates UI based on loading states
 * 
 * Usage:
 * <ManageContractors 
 *   contractors={contractors}
 *   loading={loading}
 *   onUpdateTags={updateTagsFunction}
 *   onBack={backFunction}
 * />
 */

import React, { useState, useEffect } from 'react';


function ManageContractors({ contractors, loading, onUpdateTags, onBack }) {
  const [editingContractor, setEditingContractor] = useState(null);
  const [newTags, setNewTags] = useState([]);

  useEffect(() => {
    if (!editingContractor) return;

    const contractor = contractors.find(c => c._id === editingContractor);
    if (contractor) {
      setNewTags(contractor.contractorTags || []);
    }
  }, [contractors.length, editingContractor]);




  /**
   * AVAILABLE TAGS - Predefined filtering tags for job matching
   * 
   * These tags control which jobs contractors can see based on project requirements.
   * Tags should match the homeowner tags set in GHL for proper filtering.
   */
  const tagGroups = {
    Renovation: ['kitchen remodeling', 'bathroom remodeling', 'roofing'],
    Location: ['bay area', 'los angeles', 'orange county'],
    Grouping: ['group a', 'group b', 'group c']
  };



  /**
   * FILTER APPROVED CONTRACTORS
   * 
   * Shows only contractors who have been approved by admin.
   * Pending contractors are handled in the PendingContractors component.
   */
  const approvedContractors = contractors.filter(contractor => contractor.isApproved);

  /**
   * START EDITING TAGS
   * 
   * Initiates tag editing mode for a specific contractor.
   * Pre-loads current tags for editing.
   * 
   * @param {Object} contractor - Contractor to edit tags for
   */
  const startEditing = (contractor) => {
    setEditingContractor(contractor._id);
    setNewTags(contractor.contractorTags || []);
    console.log(' ManageContractors: Starting tag edit for:', contractor.name);
  };

  /**
   * CANCEL EDITING
   * 
   * Exits tag editing mode without saving changes.
   */
  function cancelEditing() {
    setEditingContractor(null);
    setNewTags([]);
  }


  /**
   * SAVE TAGS
   * 
   * Saves the updated tags for a contractor and exits editing mode.
   * 
   * @param {string} contractorId - ID of contractor to update
   */
  const handleSaveTags = (contractorId) => {
    console.log(' ManageContractors: Saving tags for contractor:', contractorId, newTags);
    onUpdateTags(contractorId, newTags);
    setEditingContractor(null);
    setNewTags([]);
  };

  /**
   * TOGGLE TAG SELECTION
   * 
   * Adds or removes a tag from the current selection.
   * 
   * @param {string} tag - Tag to toggle
   */
  const toggleTag = (tag) => {
    if (newTags.includes(tag)) {
      setNewTags(newTags.filter(t => t !== tag));
    } else {
      setNewTags([...newTags, tag]);
    }
  };

  /**
   * HANDLE CONTRACTOR DEACTIVATION
   * 
   * Placeholder for contractor deactivation functionality.
   * Would prevent contractors from accessing the system.
   * 
   * @param {Object} contractor - Contractor to deactivate
   */
  const handleDeactivate = (contractor) => {
    const confirmed = window.confirm(
      `Deactivate contractor "${contractor.name}"?\n\n` +
      `This will prevent them from accessing job opportunities. ` +
      `They can be reactivated later if needed.`
    );

    if (confirmed) {
      console.log(' ManageContractors: Deactivating contractor:', contractor.name);
      // TODO: Implement deactivation functionality
      alert('Deactivation functionality not yet implemented.');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">

      {/* Header with Back Button */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Manage Contractors</h2>
        <button
          onClick={onBack}
          className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors duration-200 font-medium"
        >
          Back to Dashboard
        </button>
      </div>

      {/* Tag System Explanation */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-blue-800 mb-2"> Tag-Based Job Filtering System</h3>
        <p className="text-blue-700 text-sm">
          Assign tags to contractors to control which jobs they can see. Jobs with matching homeowner tags
          (set in GHL) will only be visible to contractors with those same tags. Jobs with no tags are visible to all contractors.
        </p>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
            <p className="text-gray-500 font-medium">Loading contractors...</p>
          </div>
        </div>

        /* Empty State - No Approved Contractors */
      ) : approvedContractors.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Approved Contractors</h3>
          <p className="text-gray-500">Approved contractors will appear here for tag management.</p>
          <p className="text-sm text-gray-400 mt-2">Check the "Pending Contractors" section to approve new registrations.</p>
        </div>

        /* Contractor Management List */
      ) : (
        <div className="space-y-6">
          <div className="mb-4">
            <p className="text-gray-600">
              Managing <span className="font-semibold text-green-600">{approvedContractors.length}</span> approved contractor{approvedContractors.length === 1 ? '' : 's'}
            </p>
          </div>

          {approvedContractors.map(contractor => (
            <div key={contractor._id} className="border border-gray-200 rounded-lg p-5 hover:bg-gray-50 transition-colors duration-200">

              {/* Contractor Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-800 mb-1">{contractor.name}</h3>
                  <p className="text-lg text-green-600 font-medium">{contractor.companyName || 'No company specified'}</p>
                  <p className="text-gray-600 text-sm">{contractor.email}</p>
                  {contractor.phone && (
                    <p className="text-gray-600 text-sm">{contractor.phone}</p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 ml-4">
                  <button
                    onClick={() => startEditing(contractor)}
                    disabled={editingContractor === contractor._id}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:bg-blue-300 transition-colors duration-200 font-medium shadow-sm"
                  >
                    Edit Tags
                  </button>
                  <button
                    onClick={() => handleDeactivate(contractor)}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors duration-200 font-medium shadow-sm"
                  >
                    Deactivate
                  </button>
                </div>
              </div>

              {/*
  contractor.specialties && contractor.specialties.length > 0 && (
    <div className="mb-4">
      <p className="text-sm font-medium text-gray-700 mb-2">Contractor Specialties:</p>
      <div className="flex flex-wrap gap-2">
        {contractor.specialties.map((specialty) => (
          <span
            key={specialty}
            className="bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full"
          >
            {specialty}
          </span>
        ))}
      </div>
    </div>
  )
*/}

              {/* Current Tags Display */}
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Current Filtering Tags:</p>
                {contractor.contractorTags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {contractor.contractorTags.map(tag => (
                      <span key={tag} className="…">{tag}</span>
                    ))}
                  </div>
                ) : (
                  <span className="text-gray-500 italic">
                    No filtering tags assigned – can see all jobs
                  </span>
                )}
              </div>


              {/* Tag Editing Interface */}
              {editingContractor === contractor._id && (
                <div className="bg-gray-50 rounded-lg p-4 border-2 border-blue-200">
                  <h4 className="font-medium text-gray-800 mb-3">Assign Filtering Tags:</h4>

                  {/* Grouped Tag Selection Grid */}
                  {Object.entries(tagGroups).map(([groupName, tags]) => (
                    <div key={groupName}>
                      <h4 className="text-sm font-semibold text-gray-700 mt-4 mb-2">{groupName} Tags</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                        {tags.map(tag => (
                          <label key={tag} className="flex items-center cursor-pointer hover:bg-white p-2 rounded border transition-colors">
                            <input
                              type="checkbox"
                              checked={newTags.includes(tag)}
                              onChange={() => toggleTag(tag)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                            />
                            <span className="text-sm font-medium text-gray-700">{tag}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}


                  {/* Tag Preview */}
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Selected Tags Preview:</p>
                    {newTags.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {newTags.map(tag => (
                          <span
                            key={tag}
                            className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full font-medium"
                          >
                             {tag}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm italic">No tags selected - contractor will see all jobs</p>
                    )}
                  </div>

                  {/* Save/Cancel Buttons */}
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleSaveTags(contractor._id)}
                      className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors duration-200 font-medium"
                    >
                       Save Tags
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors duration-200 font-medium"
                    >
                       Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Job Filtering Explanation */}
              <div className="bg-gray-50 rounded-lg p-3 mt-4">
                <p className="text-xs text-gray-500">
                 <strong>Job Filtering:</strong> This contractor will only see jobs where homeowner GHL tags match their assigned tags.
                  Jobs with no homeowner tags are visible to all contractors.
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ManageContractors;