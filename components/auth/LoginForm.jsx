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
        e.preventDefault();
        setError('');

        const result = await login(formData.email, formData.password);
        if (!result.success) {
            setError(result.error);
        } else {
            setTimeout(() => {
                const role = result.user?.role;
                if (role === 'admin') router.push('/adminDashboard'); // ← Next.js navigation
                else if (role === 'contractor') router.push('/contractorPortal'); // ← Stay on same page
                else router.push('/contractorPortal');
            }, 100);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (error) setError('');
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
                <div className="bg-white shadow-lg p-8 w-full" style={{
                    borderTopLeftRadius: '1.5rem',
                    borderTopRightRadius: '1.5rem',
                    borderBottomLeftRadius: '0.5rem',
                    borderBottomRightRadius: '0.5rem',
                    minHeight: '70vh'
                }}>                    <div className="w-full px-4 flex flex-col items-center">
                        {/* Logo above title */}
                        <img
                            src="/assets/Renovation.png"
                            alt="Logo"
                            style={{
                                height: '224px',
                                width: '224px',
                                marginBottom: '0',
                                maxHeight: '224px',
                                maxWidth: '224px'
                            }}
                        />

                        {/* Conditional welcome text - only show for login */}
                        {isLogin && (
                            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                                Welcome Back!
                            </h2>
                        )}

                        {isLogin ? (
                            <form onSubmit={handleSubmit} className="space-y-4 w-full">
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

                                {error && (
                                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                        <p className="text-red-600 text-sm">{error}</p>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold disabled:opacity-50 mt-6"
                                    style={{ boxShadow: '0 4px 0 #1e40af, 0 6px 8px rgba(0,0,0,0.3)' }}
                                    onMouseEnter={(e) => {
                                        if (!isLoading) {
                                            e.target.style.boxShadow = '0 8px 0 #1e40af, 0 10px 20px rgba(0,0,0,0.4)';
                                            e.target.style.transform = 'translateY(-4px)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.boxShadow = '0 4px 0 #1e40af, 0 6px 8px rgba(0,0,0,0.3)';
                                        e.target.style.transform = 'translateY(0px)';
                                    }}
                                >
                                    {isLoading ? 'Logging in...' : 'Log In'}
                                </button>
                            </form>
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
                                    {isLogin
                                        ? 'Create Account'
                                        : 'Login'}
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