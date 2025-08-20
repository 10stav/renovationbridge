// src/pages/NotTeamMember.jsx
import React from 'react';
import { useRouter } from 'next/router';

export default function NotTeamMember() {
    const router = useRouter();

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-100 text-center p-4">
            <h1 className="text-3xl font-bold text-red-600 mb-4">Access Denied</h1>
            <p className="text-lg text-gray-700 mb-6">
                You are not currently a team member in our system.
                <br />
                Please contact <strong>Onn Matalon</strong> at <a href="mailto:onn@example.com" className="text-blue-600 underline">onn@example.com</a> to become a team member.
            </p>
            <button
                onClick={() => router.push('/login')}
                className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
                Return to Login Page
            </button>
        </div>
    );
}
