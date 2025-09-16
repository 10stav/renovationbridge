import { useEffect } from 'react';
import { AuthProvider } from '../components/auth/AuthContext';
import '../styles/index.css';

export default function App({ Component, pageProps }) {
  // Global back button investigation
  useEffect(() => {
    const handlePopState = (e) => {
      console.log('🔍 Back button clicked anywhere in app!');
      console.log('Current URL:', window.location.href);
      console.log('Previous URL:', document.referrer);
      console.log('History state:', e.state);
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