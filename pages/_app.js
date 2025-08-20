import { AuthProvider } from '../components/auth/AuthContext';
import '../styles/index.css';

export default function App({ Component, pageProps }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800">
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    </div>
  );
}