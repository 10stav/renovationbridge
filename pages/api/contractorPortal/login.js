// This file renders the public login screen (shared for admins & contractors).
// It uses the AuthContext to call the API route above.

'use client';

import LoginForm from '../../components/auth/LoginForm';

export default function LoginPage() {
  return <LoginForm />;
}
