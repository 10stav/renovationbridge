import React, { useState } from 'react';
import { useRouter } from 'next/router'; // ← Next.js routing
import { useAuth } from './AuthContext';
import RegisterForm2 from './RegisterForm2';

function LoginForm() {
  const { login, isLoading } = useAuth();
  const router = useRouter(); // ← Next.js router
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    // ← CHANGED: guard against native navigation just in case
    e?.preventDefault?.();
    e?.stopPropagation?.();
    setError('');

    const result = await login(formData.email, formData.password);
    console.log('Login result:', result);

    if (!result?.success) {
      // ← CHANGED: ensure a non-empty string so the error box renders
      setError(result?.error || 'Invalid credentials. Please try again.');
      return; // ← CHANGED: stop here on failure (prevents redirect)
    }

    const role = result.user?.role;
    console.log('User role:', role);
    const adminEmails = ['admin@renovationbridge.com', 'admin2@company.com'];

    if (role === 'admin' || adminEmails.includes(formData.email)) {
      router.replace('/admin'); // ← Next.js navigation
    } else if (role === 'contractor') {
      router.replace('/contractorPortal'); // ← Stay on same page
    } else {
      router.replace('/contractorPortal');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header section: fixed 30% of viewport height */}
      <div className="relative w-full overflow-hidden flex-shrink-0" style={{ height: '60vh' }}>
        <img
          src="/assets/Creation-7-Project-Tice-7.jpg"
          alt="Header background"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-30" />
      </div>

      {/* Card overlapping header with slight negative margin */}
      <div className="relative z-20 w-full flex-grow flex items-start justify-center" style={{ marginTop: '-12rem' }}>
        <div
          className="bg-white shadow-lg p-8 w-full"
          style={{
            borderTopLeftRadius: '1.5rem',
            borderTopRightRadius: '1.5rem',
            borderBottomLeftRadius: '0.5rem',
            borderBottomRightRadius: '0.5rem',
            minHeight: '70vh',
          }}
        >
          <div className="w-full px-4 flex flex-col items-center">
            {/* Logo above title */}
            <img
              src="/assets/Renovation.png"
              alt="Logo"
              style={{
                height: '224px',
                width: '224px',
                marginBottom: '0',
                maxHeight: '224px',
                maxWidth: '224px',
              }}
            />

            {/* Conditional welcome text - only show for login */}
            {isLogin && (
              <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                Welcome Back!
              </h2>
            )}

            {isLogin ? (
              <>
                {/* ⛔ User-visible error message (outside form to avoid being unmounted) */}
                {Boolean(error) && (
                  <div className="w-full mb-4 px-4" role="alert" aria-live="assertive">
                    <div className="p-3 bg-red-100 border border-red-300 text-red-700 font-semibold rounded-md text-center shadow">
                      {error || 'Invalid email or password'}
                    </div>
                  </div>
                )}

                {/* CHANGED: no native submit; use button type="button" */}
                <form className="space-y-4 w-full">
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                    placeholder="Email address"
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />

                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                    placeholder="Password"
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />

                  <button
                    type="button"               // ← CHANGED: prevents native submit/navigation
                    onClick={handleSubmit}       // ← CHANGED: call handler explicitly
                    disabled={isLoading}
                    className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold disabled:opacity-50 mt-6"
                    style={{ boxShadow: '0 4px 0 #1e40af, 0 6px 8px rgba(0,0,0,0.3)' }}
                    onMouseEnter={(e) => {
                      if (!isLoading) {
                        e.currentTarget.style.boxShadow =
                          '0 8px 0 #1e40af, 0 10px 20px rgba(0,0,0,0.4)';
                        e.currentTarget.style.transform = 'translateY(-4px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow =
                        '0 4px 0 #1e40af, 0 6px 8px rgba(0,0,0,0.3)';
                      e.currentTarget.style.transform = 'translateY(0px)';
                    }}
                  >
                    {isLoading ? 'Logging in...' : 'Log In'}
                  </button>
                </form>
              </>
            ) : (
              <RegisterForm2 />
            )}

            <div className="mt-6 text-center w-full">
              <p className="text-gray-600">
                {isLogin ? 'New contractor? ' : 'Already have an account? '}
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-blue-600 font-semibold hover:text-blue-800"
                >
                  {isLogin ? 'Create Account' : 'Login'}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginForm;
