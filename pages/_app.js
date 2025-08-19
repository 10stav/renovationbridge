import { AuthProvider } from '../components/auth/AuthContext';
import '../styles/globals.css'; // if this exists

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  );
}