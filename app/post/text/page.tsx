'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Spinner from '../../../components/Spinner'; // Adjust path as needed
import Link from 'next/link'; // Import Link

interface FacebookPage {
  id: number; // Database ID of the connected page entry
  page_id: string; // Facebook's ID for the page
  page_name: string;
}

interface ConnectedFacebookAccount {
  facebook_user_id: string;
  facebook_user_name: string;
  pages: FacebookPage[];
}

export default function PostTextPage() {
  const { user, isLoggedIn } = useAuth();
  const router = useRouter();

  const [postCaption, setPostCaption] = useState('');
  const [postContent, setPostContent] = useState('');
  const [selectedFacebookAccountId, setSelectedFacebookAccountId] = useState<string | null>(null);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [allConnectedAccounts, setAllConnectedAccounts] = useState<ConnectedFacebookAccount[]>([]);
  const [availablePagesForSelectedAccount, setAvailablePagesForSelectedAccount] = useState<FacebookPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [postOption, setPostOption] = useState<'now' | 'schedule'>('now'); // 'now' or 'schedule'

  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }
    if (!user || !user.id) {
      setError('User data not available. Please log in again.');
      setLoading(false);
      return;
    }

    const fetchConnectedAccountsAndPages = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/facebook/pages?userId=${user.id}`);
        const data = await response.json();
        if (response.ok) {
          setAllConnectedAccounts(data.accounts);
          if (data.accounts.length > 0) {
            // Set default selected account to the first one
            setSelectedFacebookAccountId(data.accounts[0].facebook_user_id);
          }
        } else {
          setError(data.message || 'Failed to fetch connected Facebook accounts and pages.');
        }
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message || 'An unexpected error occurred while fetching Facebook accounts and pages.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchConnectedAccountsAndPages();
  }, [isLoggedIn, user, router]);

  // Effect to update available pages when selected Facebook account changes
  useEffect(() => {
    if (selectedFacebookAccountId) {
      const selectedAccount = allConnectedAccounts.find(
        (account) => account.facebook_user_id === selectedFacebookAccountId
      );
      if (selectedAccount) {
        setAvailablePagesForSelectedAccount(selectedAccount.pages);
        if (selectedAccount.pages.length > 0) {
          setSelectedPageId(selectedAccount.pages[0].page_id); // Select first page of the chosen account
        } else {
          setSelectedPageId(null);
        }
      } else {
        setAvailablePagesForSelectedAccount([]);
        setSelectedPageId(null);
      }
    } else {
      setAvailablePagesForSelectedAccount([]);
      setSelectedPageId(null);
    }
  }, [selectedFacebookAccountId, allConnectedAccounts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!postContent.trim() && !postCaption.trim()) {
      setError('Post content or caption cannot be empty.');
      return;
    }
    if (!selectedPageId) {
      setError('Please select a Facebook page to post to.');
      return;
    }

    setPosting(true);
    try {
      const response = await fetch('/api/facebook/post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pageId: selectedPageId, message: postContent, caption: postCaption }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage('Post successful! Post ID: ' + data.postId);
        setPostContent(''); // Clear content after successful post
        setPostCaption(''); // Clear caption
      } else {
        setError(data.message || 'Failed to post content.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during posting.');
    } finally {
      setPosting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Spinner className="h-10 w-10 text-gray-600" />
          <p className="text-gray-600 mt-2">Loading connected accounts and pages...</p>
        </div>
      </div>
    );
  }

  if (allConnectedAccounts.length === 0) {
    return (
      <div className="container mx-auto p-8 text-center">
        <p className="text-red-600">No Facebook accounts connected. Please connect an account in your <Link href="/facebook" className="text-blue-500 hover:underline">Facebook Accounts & Pages</Link> section.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Post Text to Facebook</h1>

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

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
        {/* Select Facebook Account */}
        <div className="mb-4">
          <label htmlFor="facebookAccountSelect" className="block text-gray-700 text-sm font-bold mb-2">Select Facebook Account:</label>
          <select
            id="facebookAccountSelect"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={selectedFacebookAccountId || ''}
            onChange={(e) => setSelectedFacebookAccountId(e.target.value)}
            required
          >
            {allConnectedAccounts.map((account) => (
              <option key={account.facebook_user_id} value={account.facebook_user_id}>
                {account.facebook_user_name}
              </option>
            ))}
          </select>
        </div>

        {/* Select Page */}
        <div className="mb-4">
          <label htmlFor="pageSelect" className="block text-gray-700 text-sm font-bold mb-2">Select Page:</label>
          <select
            id="pageSelect"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={selectedPageId || ''}
            onChange={(e) => setSelectedPageId(e.target.value)}
            required
            disabled={availablePagesForSelectedAccount.length === 0}
          >
            {availablePagesForSelectedAccount.length > 0 ? (
              availablePagesForSelectedAccount.map((page) => (
                <option key={page.id} value={page.page_id}>
                  {page.page_name} ({page.page_id})
                </option>
              ))
            ) : (
              <option value="">No pages available for this account</option>
            )}
          </select>
        </div>

        {/* Caption Box */}
        <div className="mb-4">
          <label htmlFor="postCaption" className="block text-gray-700 text-sm font-bold mb-2">Caption (Optional):</label>
          <textarea
            id="postCaption"
            rows={2}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Add a caption to your post..."
            value={postCaption}
            onChange={(e) => setPostCaption(e.target.value)}
          ></textarea>
        </div>

        {/* Text Box */}
        <div className="mb-4">
          <label htmlFor="postContent" className="block text-gray-700 text-sm font-bold mb-2">Post Content:</label>
          <textarea
            id="postContent"
            rows={6}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="What's on your mind?"
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
            required={postOption === 'now'} // Required only for immediate posts
          ></textarea>
        </div>

        {/* Public Option */}
        <div className="mb-6">
          <span className="block text-gray-700 text-sm font-bold mb-2">Publish Option:</span>
          <div className="mt-2">
            <label className="inline-flex items-center mr-6">
              <input
                type="radio"
                className="form-radio"
                name="postOption"
                value="now"
                checked={postOption === 'now'}
                onChange={() => setPostOption('now')}
              />
              <span className="ml-2">Public Now</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio"
                name="postOption"
                value="schedule"
                checked={postOption === 'schedule'}
                onChange={() => setPostOption('schedule')}
                disabled // Schedule option is not yet implemented
              />
              <span className="ml-2">Schedule (Coming Soon)</span>
            </label>
          </div>
        </div>

        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out w-full"
          disabled={posting}
        >
          {posting ? (
            <span className="flex items-center justify-center">
              <Spinner className="h-5 w-5 text-white" />
              Posting...
            </span>
          ) : (
            'Post to Facebook'
          )}
        </button>
      </form>
    </div>
  );
}