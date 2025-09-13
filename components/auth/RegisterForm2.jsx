/**
 * Simplified register form that directs users to contact email
 */
import { useRouter } from 'next/router';
import React from 'react';

function RegisterForm() {
  const router = useRouter();

  const handleLoginRedirect = () => {
    router.push('/login');
  };

  return (
    <div className="space-y-6">
      {/* Contact Message */}
      <div className="text-center p-8 bg-blue-50 border border-blue-200 rounded-lg">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Registration</h2>
        <p className="text-gray-700 text-lg">
          Please Email <a 
            href="mailto:onn@renovationbridge.com" 
            className="text-blue-600 hover:text-blue-800 underline"
          >
            onn@renovationbridge.com
          </a>
        </p>
      </div>

      {/* Login Redirect */}
      <div className="text-center">
        <p className="text-gray-600 mb-3">Already have an account?</p>
        <button
          onClick={handleLoginRedirect}
          className="bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-green-700 hover:to-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
        >
          Go to Login
        </button>
      </div>
    </div>
  );
}

export default RegisterForm;