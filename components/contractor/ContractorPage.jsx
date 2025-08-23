// src/pages/ContractorPage.jsx
import React from 'react';
import { useAuth } from '../components/auth/AuthContext';
import { CogIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import ContractorPortal from '../components/contractor/ContractorPortal';

export default function ContractorPage() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      {/* ← Full‑width gradient header with extra bottom padding */}
      <div className="w-full">
        <div
          className="rounded-b-xl px-6 pt-8 pb-20 text-white"
          style={{ backgroundColor: '#313bc0' }}
        >
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-bold">
                Welcome back, {user.name}! 
              </h2>
              <p className="mt-2 text-lg">
                {user.companyName && `${user.companyName} | `}
                What do you need to do today?
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <CogIcon
                className="h-6 w-6 cursor-pointer"
                onClick={() => { /* to settings */ }}
              />
              <button
                onClick={logout}
                aria-label="Log out"
                className="p-2 rounded-lg hover:bg-red-600 hover:text-white transition-colors"
              >
                <ArrowRightOnRectangleIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ← Cards pulled up under that gradient */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 pb-8">
        <ContractorPortal />
      </div>
    </div>
  );
}
