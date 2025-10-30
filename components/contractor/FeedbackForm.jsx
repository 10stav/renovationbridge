import React, { useState } from 'react';
import { useAuth } from '../auth/AuthContext'; // ADD THIS IMPORT

function FeedbackForm({ job, appointmentTime, onClose, onSuccess }) {
  const { authenticatedRequest } = useAuth(); // ADD THIS LINE
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // NEW FIELDS
  const [planningProposal, setPlanningProposal] = useState('');
  const [proposalWhyNot, setProposalWhyNot] = useState('');
  const [projectAsDescribed, setProjectAsDescribed] = useState('');
  const [projectWhyNot, setProjectWhyNot] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    // Validation
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    if (!planningProposal) {
      setError('Please answer if you are planning on submitting a proposal');
      return;
    }

    if (planningProposal === 'No' && !proposalWhyNot.trim()) {
      setError('Please explain why you are not submitting a proposal');
      return;
    }

    if (!projectAsDescribed) {
      setError('Please answer if the project was as described');
      return;
    }

    if (projectAsDescribed === 'No' && !projectWhyNot.trim()) {
      setError('Please explain why the project was not as described');
      return;
    }

    if (!comment.trim()) {
      setError('Please provide additional comments');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await authenticatedRequest('/contractor/submit-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: job.jobId || job._id,
          appointmentTime: appointmentTime,
          rating: rating,
          comment: comment.trim(),
          planningProposal: planningProposal,
          proposalWhyNot: planningProposal === 'No' ? proposalWhyNot.trim() : '',
          projectAsDescribed: projectAsDescribed,
          projectWhyNot: projectAsDescribed === 'No' ? projectWhyNot.trim() : ''
        })
      });

      const result = await response.json();

      if (result.success) {
        onSuccess();
      } else {
        setError(result.error || 'Failed to submit feedback');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">Leave Feedback</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-1">Homeowner: <span className="font-medium">{job.customerName}</span></p>
          <p className="text-sm text-gray-600">Appointment: <span className="font-medium">{appointmentTime}</span></p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Star Rating */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              How was your experience?
            </label>
            <div className="flex space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="text-4xl focus:outline-none transition-colors"
                >
                  <span className={
                    star <= (hoveredRating || rating)
                      ? 'text-yellow-400'
                      : 'text-gray-300'
                  }>
                    ★
                  </span>
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-sm text-gray-500 mt-1">
                {rating === 5 ? 'Excellent!' : rating === 4 ? 'Good' : rating === 3 ? 'Average' : rating === 2 ? 'Poor' : 'Very Poor'}
              </p>
            )}
          </div>

          {/* NEW: Planning Proposal */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Are you planning on submitting a proposal? *
            </label>
            <select
              value={planningProposal}
              onChange={(e) => {
                setPlanningProposal(e.target.value);
                if (e.target.value === 'Yes') setProposalWhyNot('');
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select...</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
            
            {planningProposal === 'No' && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Why not? *
                </label>
                <textarea
                  value={proposalWhyNot}
                  onChange={(e) => setProposalWhyNot(e.target.value)}
                  placeholder="Please explain..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  required
                />
              </div>
            )}
          </div>

          {/* NEW: Project As Described */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Was the project as described? *
            </label>
            <select
              value={projectAsDescribed}
              onChange={(e) => {
                setProjectAsDescribed(e.target.value);
                if (e.target.value === 'Yes') setProjectWhyNot('');
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select...</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
            
            {projectAsDescribed === 'No' && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Why not? *
                </label>
                <textarea
                  value={projectWhyNot}
                  onChange={(e) => setProjectWhyNot(e.target.value)}
                  placeholder="Please explain..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  required
                />
              </div>
            )}
          </div>

          {/* Comment - NOW REQUIRED, NO LIMIT */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Comments *
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience with this homeowner..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              required
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default FeedbackForm;