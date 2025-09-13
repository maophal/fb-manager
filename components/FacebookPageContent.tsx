'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Spinner from './Spinner'; // Corrected path
import { useLoading } from '@/context/LoadingContext';

interface FacebookPage {
  id: number;
  page_id: string;
  page_name: string;
}

interface ConnectedFacebookAccount {
  facebook_user_id: string;
  facebook_user_name: string;
  pages: FacebookPage[];
}

export default function FacebookPageContent() {
  const { user, isLoggedIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showLoading, hideLoading } = useLoading();

  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedFacebookAccount[]>([]);
  const [connectingAccount, setConnectingAccount] = useState(false);
  const [disconnectingPageId, setDisconnectingPageId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);

  const planLimits: { [key: string]: number } = {
    Basic: 1,
    Standard: 3,
    Pro: 10,
    Enterprise: Infinity,
  };

  const currentPlanLimit = user?.plan_id ? planLimits[user.plan_id] : 0;
  const canConnectMoreAccounts = connectedAccounts.length < currentPlanLimit;

  const fetchConnectedAccounts = useCallback(async (userId: string) => {
    showLoading();
    setError(null);
    try {
      const response = await fetch(`/api/facebook/pages?userId=${userId}`);
      const data = await response.json();
      if (response.ok) {
        setConnectedAccounts(data.accounts);
      } else {
        setError(data.message || 'Failed to fetch connected Facebook accounts and pages.');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'An unexpected error occurred while fetching Facebook accounts and pages.');
      }
    } finally {
      hideLoading();
    }
  }, [hideLoading, showLoading]);

  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }

    if (user && user.id) {
      fetchConnectedAccounts(String(user.id));
    }
  }, [isLoggedIn, user, fetchConnectedAccounts, router]);

  useEffect(() => {
    const status = searchParams.get('status');
    const message = searchParams.get('message');

    if (status === 'success') {
      setSuccessMessage(message?.replace(/_/g, ' ') || 'Facebook account connected successfully!');
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.delete('status');
      newSearchParams.delete('message');
      router.replace(`/facebook?${newSearchParams.toString()}`);
    } else if (status === 'error') {
      setError(message?.replace(/_/g, ' ') || 'Failed to connect Facebook account.');
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.delete('status');
      newSearchParams.delete('message');
      router.replace(`/facebook?${newSearchParams.toString()}`);
    }
  }, [router, searchParams]);

  const toggleAccordion = (id: string) => {
    setOpenAccordion(openAccordion === id ? null : id);
  };

  const handleConnectPage = async () => {
    if (!user || !user.id) {
      setError('User data not available. Please log in again.');
      return;
    }
    if (!canConnectMoreAccounts) {
      setError(`You have reached the limit of ${currentPlanLimit} connected accounts for your plan.`);
      return;
    }

    setConnectingAccount(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`/api/facebook/auth?userId=${user.id}`);
      const data = await response.json();

      if (response.ok && data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        setError(data.message || 'Failed to initiate Facebook connection.');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'An unexpected error occurred while initiating Facebook connection.');
      }
    }
  };

  const handleDisconnectPage = async (pageId: string) => {
    if (!user || !user.id) {
      setError('User data not available for disconnect.');
      return;
    }
    setDisconnectingPageId(pageId);
    setError(null);
    setSuccessMessage(null);
    try {
      const response = await fetch('/api/facebook/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, pageId: pageId }),
      });
      const data = await response.json();
      if (response.ok) {
        setSuccessMessage(data.message || 'Facebook page disconnected successfully!');
        fetchConnectedAccounts(String(user.id));
      } else {
        setError(data.message || 'Failed to disconnect page.');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'An unexpected error occurred while disconnecting page.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-center mb-6">Manage Facebook Accounts & Pages</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{successMessage}</span>
          </div>
        )}

        <div className="mb-6 p-4 bg-blue-50 rounded-md border border-blue-200">
          <p className="text-blue-800 font-semibold">Your Plan: {user?.plan_id || 'N/A'}</p>
          <p className="text-blue-800">Connected Accounts: {connectedAccounts.length} / {currentPlanLimit === Infinity ? 'Unlimited' : currentPlanLimit}</p>
        </div>

        <div className="mb-8 border-b pb-6">
          <h2 className="text-2xl font-semibold mb-4">Connect a New Facebook Account</h2>
          <button
            onClick={handleConnectPage}
            disabled={connectingAccount || !canConnectMoreAccounts}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out flex-grow"
          >
            {connectingAccount ? (
              <span className="flex items-center justify-center">
                <Spinner className="h-5 w-5 text-white" />
                Connecting...
              </span>
            ) : (
              'Connect Facebook Account'
            )}
          </button>
          {!canConnectMoreAccounts && currentPlanLimit !== Infinity && (
            <p className="text-red-600 text-sm">You have reached your plan&apos;s limit for connected accounts.</p>
          )}
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4">Your Connected Facebook Accounts ({connectedAccounts.length})</h2>
          {connectedAccounts.length === 0 ? (
            <p className="text-gray-600">No Facebook accounts connected yet.</p>
          ) : (
            <div className="space-y-4">
              {connectedAccounts.map((account) => (
                <div key={account.facebook_user_id} className="border border-gray-200 rounded-md overflow-hidden">
                  <button
                    className="flex items-center justify-between w-full p-4 bg-gray-50 hover:bg-gray-100 focus:outline-none"
                    onClick={() => toggleAccordion(account.facebook_user_id)}
                  >
                    <span className="text-lg font-medium text-gray-800">
                      {account.facebook_user_name || 'Unknown Account'} (ID: {account.facebook_user_id})
                    </span>
                    <svg
                      className={`w-5 h-5 text-gray-500 transform transition-transform duration-200 ${
                        openAccordion === account.facebook_user_id ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </button>
                  {openAccordion === account.facebook_user_id && (
                    <div className="p-4 bg-white border-t border-gray-200">
                      {account.pages.length === 0 ? (
                        <p className="text-gray-600 text-sm">No pages connected to this account.</p>
                      ) : (
                        <ul className="space-y-2">
                          {account.pages.map((page) => (
                            <li key={page.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-md border border-gray-200">
                              <span className="text-gray-800 font-medium">{page.page_name}</span>
                              <button
                                onClick={() => handleDisconnectPage(page.page_id)}
                                disabled={disconnectingPageId === page.page_id}
                                className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded-lg transition duration-300 ease-in-out text-sm"
                              >
                                {disconnectingPageId === page.page_id ? (
                                  <span className="flex items-center justify-center">
                                    <Spinner className="h-4 w-4 text-white" />
                                    Disconnecting...
                                  </span>
                                ) : (
                                  'Disconnect'
                                )}
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
