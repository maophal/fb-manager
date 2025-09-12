'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link'; // Import Link for the button
import Spinner from '../../components/Spinner'; // Import Spinner

export default function AccountPage() {
  const { user, isLoggedIn, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoggedIn && !isLoading) {
      router.push('/login'); // Redirect to login if not logged in and not loading
    }
  }, [isLoggedIn, router, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Spinner className="h-10 w-10 text-gray-600" />
        <p className="text-gray-600 ml-3">Loading account details...</p>
      </div>
    );
  }

  if (!isLoggedIn || !user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-600">Please log in to view your account details.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md text-center transform transition-all duration-300 hover:scale-105">
        <div className="mb-6">
          {/* Avatar Placeholder */}
          <div className="w-24 h-24 rounded-full bg-blue-200 flex items-center justify-center text-blue-800 text-4xl font-bold mx-auto mb-4">
            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome, {user.name}!</h1>
          <p className="text-gray-500 text-sm">Your Account Overview</p>
        </div>

        <div className="border-t border-gray-200 pt-6 mb-6">
          <div className="mb-4 text-left">
            <p className="text-gray-600 text-sm font-medium">Email Address:</p>
            <p className="text-gray-800 text-lg font-semibold">{user.email}</p>
          </div>

          <div className="mb-4 text-left">
            <p className="text-gray-600 text-sm font-medium">Current Plan:</p>
            <p className="text-gray-800 text-lg font-semibold">
              {user.plan_id ? user.plan_id : 'No plan selected'}
            </p>
          </div>

          <div className="mb-4 text-left">
            <p className="text-gray-600 text-sm font-medium">Member Since:</p>
            <p className="text-gray-800 text-lg font-semibold">
              {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </div>

        <Link href="/pricing" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out inline-block w-full">
          Manage Subscription
        </Link>

        {/* Optional: Edit Profile Button */}
        {/* <button className="mt-4 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out w-full">
          Edit Profile
        </button> */}
      </div>
    </div>
  );
}