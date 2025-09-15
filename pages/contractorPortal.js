import { useAuth } from '../components/auth/AuthContext';
import ContractorPortal from '../components/contractor/ContractorPortal';
import AuthPages from '../components/auth/AuthPages';

export default function ContractorPortalPage() {
  const { user, isLoading, logout } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <AuthPages />;
  }

  if (user.role !== 'contractor') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl mb-4">Access Denied</h1>
          <p className="mb-6">Only contractors can access this portal. Try using the admin login button instead.</p>
          <button
            onClick={logout}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Beautiful blue header */}
      <div className="w-full">
        <div
          className="rounded-b-xl px-6 pt-8 pb-20 text-white"
          style={{ backgroundColor: '#313bc0' }}
        >
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-bold">
                Welcome back, {user.name}!
              </h2>
              <p className="mt-2 text-lg">
                {user.companyName && `${user.companyName} | `}
                What do you need to do today?
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                className="text-2xl cursor-pointer hover:opacity-75"
                onClick={() => { /* to settings */ }}
                title="Settings"
              >
                ⚙️
              </button>
              <button
                onClick={logout}
                aria-label="Log out"
                className="p-2 rounded-lg hover:bg-red-600 hover:text-white transition-colors text-xl"
                title="Logout"
              >
                🚪
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Cards pulled up under that gradient */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 pb-8">
        <ContractorPortal />
      </div>
    </div>
  );
}