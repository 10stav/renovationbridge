export default function App({ Component, pageProps }) {
  return (
    // Remove this wrapper temporarily:
    // <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800">
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    // </div>
  );
}