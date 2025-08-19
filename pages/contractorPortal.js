import { useAuth } from '../components/auth/AuthContext';
import ContractorPortal from '../components/contractor/ContractorPortal';
import AuthPages from '../components/auth/AuthPages'; // ← Add this import

export default function ContractorPortalPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    // ← Replace the basic message with your actual login form
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

  return <ContractorPortal />;
}