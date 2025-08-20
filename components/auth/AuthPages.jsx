import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

function AuthPages() {
  return <LoginForm />;
}

export default AuthPages;