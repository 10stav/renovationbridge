/**
 * REGISTER FORM - Contractor registration form component
 * 
 * Handles new contractor account creation with comprehensive form fields.
 * Extracted from App.jsx to create a reusable registration component.
 * 
 * Features:
 * - Complete contractor information collection
 * - Multiple specialty selection with checkboxes
 * - Form validation and error display
 * - Success message after registration
 * - Professional styling and user experience
 * - Integration with AuthContext for registration functionality
 * 
 * Business Logic:
 * - All registrations create 'contractor' role accounts
 * - New contractors require admin approval before login
 * - Form resets after successful registration
 * 
 * Usage:
 * <RegisterForm />
 */
import { useRouter } from 'next/router'; // ← Changed from react-router-dom
import React, { useState } from 'react';
import { useAuth } from './AuthContext';

function RegisterForm() {
  const { register, isLoading } = useAuth();
  const router = useRouter(); // ← Changed from useNavigate
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    companyName: '',
    kitchenRemodeling: false,
    testTag2: false,
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  /**
   * HANDLE FORM SUBMISSION
   * 
   * Validates input and calls AuthContext register function.
   * Shows success message and resets form on successful registration.
   * Displays error message if registration fails.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    console.log('📝 RegisterForm: Attempting registration for:', formData.email);

    const result = await register(formData);

    if (result.success) {
      setMessage(result.message);
      console.log('✅ RegisterForm: Registration successful');

      // Reset form
      setFormData({
        name: '',
        email: '',
        password: '',
        phone: '',
        companyName: '',
        kitchenRemodeling: false,
        testTag2: false,
      });
    } else {
      console.log('❌ RegisterForm: Registration failed:', result.error);

      // Check for team member error
      const errorText = result.error?.toLowerCase() || '';
      if (errorText.includes('team member') || errorText.includes('not a team member')) {
        router.push('/not-team-member'); // ← Changed from navigate
      } else {
        setError(result.error || 'Registration failed');
      }
    }
  };

  /**
   * HANDLE INPUT CHANGES
   * 
   * Updates form state when user types in text input fields.
   * Clears any existing messages when user starts making changes.
   */
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });

    // Clear messages when user starts typing
    if (error || message) {
      setError('');
      setMessage('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* Full Name Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Full Name
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          placeholder="John Smith"
          required
          disabled={isLoading}
        />
      </div>

      {/* Email Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          placeholder="john@smithconstruction.com"
          required
          disabled={isLoading}
        />
      </div>

      {/* Password Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Password
        </label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          placeholder="••••••••"
          minLength="6"
          required
          disabled={isLoading}
        />
      </div>

      {/* Phone Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Phone
        </label>
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          placeholder="(555) 123-4567"
          disabled={isLoading}
        />
      </div>

      {/* Company Name Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Company Name
        </label>
        <input
          type="text"
          name="companyName"
          value={formData.companyName}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          placeholder="Smith Construction LLC"
          disabled={isLoading}
        />
      </div>

      

      {/* Success Message Display */}
      {message && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-600 text-sm">{message}</p>
        </div>
      )}

      {/* Error Message Display */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-green-700 hover:to-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Creating Account...' : 'Create Account'}
      </button>
    </form>
  );
}

export default RegisterForm;