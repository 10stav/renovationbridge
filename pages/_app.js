import { AuthProvider } from '../components/auth/AuthContext';
import '../styles/app.css'; 

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  );
}