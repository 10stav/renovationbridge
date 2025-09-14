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

    
      </div>
  );
}

export default RegisterForm;