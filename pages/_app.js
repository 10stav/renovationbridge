import { useEffect } from 'react';
import { AuthProvider } from '../components/auth/AuthContext';
import '../styles/index.css';

export default function App({ Component, pageProps }) {
  // Global back button investigation
  // prevent cross-portal navigation - especially when clicking browser back button
useEffect(() => {
  const handlePopState = (e) => {
    const currentPath = window.location.pathname;
    if (currentPath === '/admin' && document.referrer.includes('/contractorPortal')) {
      e.preventDefault();
      window.history.pushState(null, null, '/admin');
    }
  };

  window.addEventListener('popstate', handlePopState);
  return () => window.removeEventListener('popstate', handlePopState);
}, []);

  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  );
}