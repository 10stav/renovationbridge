import { useAuth } from '../components/auth/AuthContext';
import ContractorPortal from '../components/contractor/ContractorPortal';

export default function ContractorPortalPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl mb-4">Contractor Portal</h1>
          <p>Please log in to access the contractor portal.</p>
        </div>
      </div>
    );
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