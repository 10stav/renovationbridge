import { useAuth } from '../components/auth/AuthContext';
import ContractorPortal from '../components/contractor/ContractorPortal';
import AuthPages from '../components/auth/AuthPages';
import { CogIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline'; // Add this

export default function ContractorPortalPage() {
  const { user, isLoading, logout } = useAuth(); // Add logout here

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
          <p>Only contractors can access this portal.</p>
        </div>
      </div>
    );
  }

  // Replace this simple return with your enhanced design:
  return (
    <div className="min-h-screen bg-white">
      {/* Your beautiful blue header */}
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
              <CogIcon
                className="h-6 w-6 cursor-pointer"
                onClick={() => { /* to settings */ }}
              />
              <button
                onClick={logout}
                aria-label="Log out"
                className="p-2 rounded-lg hover:bg-red-600 hover:text-white transition-colors"
              >
                <ArrowRightOnRectangleIcon className="h-6 w-6" />
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