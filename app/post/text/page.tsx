'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Spinner from '../../../components/Spinner'; // Adjust path as needed
import Link from 'next/link'; // Import Link
import BackButton from '../../../components/BackButton'; // Import BackButton
import FacebookAccountSelector from '../../../components/FacebookAccountSelector';
import FacebookPageSelector from '../../../components/FacebookPageSelector';

interface FacebookPage {
  id: number; // Database ID of the connected page entry
  page_id: string; // Facebook's ID for the page
  page_name: string;
  page_picture_url?: string; // Optional: URL to the page's profile picture
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
  const [selectedPageIds, setSelectedPageIds] = useState<string[]>([]);
  const [postInterval, setPostInterval] = useState<number>(5); // New state for post interval
  const [countdown, setCountdown] = useState<number>(0); // New state for countdown
  const [isCountingDown, setIsCountingDown] = useState<boolean>(false); // New state for countdown status
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [postOption, setPostOption] = useState<'now' | 'schedule'>('now'); // 'now' or 'schedule'

  // New state for managing connected accounts and selected account
  const [allConnectedAccounts, setAllConnectedAccounts] = useState<ConnectedFacebookAccount[]>([]);
  const [selectedFacebookAccountId, setSelectedFacebookAccountId] = useState<string | null>(null);
  const [availablePagesForSelectedAccount, setAvailablePagesForSelectedAccount] = useState<FacebookPage[]>([]);

  // Effect to fetch connected accounts and pages
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
        // Reset selected pages when account changes
        setSelectedPageIds([]);
      } else {
        setAvailablePagesForSelectedAccount([]);
        setSelectedPageIds([]);
      }
    } else {
      setAvailablePagesForSelectedAccount([]);
      setSelectedPageIds([]);
    }
  }, [selectedFacebookAccountId, allConnectedAccounts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setCountdown(0); // Reset countdown
    setIsCountingDown(false); // Reset counting down state

    if (!postContent.trim() && !postCaption.trim()) {
      setError('Post content or caption cannot be empty.');
      return;
    }
    if (selectedPageIds.length === 0) {
      setError('Please select at least one Facebook page to post to.');
      return;
    }

    const postResults: { pageId: string; success: boolean; message?: string; postId?: string }[] = [];

    for (let i = 0; i < selectedPageIds.length; i++) {
      const pageId = selectedPageIds[i];
      try {
        setPosting(true); // Set true before each fetch
        const response = await fetch('/api/facebook/post', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ pageId, message: postContent, caption: postCaption }),
        });

        const data = await response.json();
        setPosting(false); // Set false after fetch returns

        if (response.ok) {
          postResults.push({ pageId, success: true, postId: data.postId });
          setSuccessMessage(`Posted to page ${pageId}! Post ID: ${data.postId}`);
        } else {
          postResults.push({ pageId, success: false, message: data.message || 'Failed to post.' });
          setError(`Failed to post to page ${pageId}: ${data.message || 'Unknown error'}`);
        }
      } catch (err: any) {
        setPosting(false); // Set false on error too
        postResults.push({ pageId, success: false, message: err.message || 'An unexpected error occurred.' });
        setError(`Error posting to page ${pageId}: ${err.message || 'Unknown error'}`);
      }

      // Introduce delay if interval is specified and it's not the last page
      if (postInterval > 0 && i < selectedPageIds.length - 1) {
        setIsCountingDown(true); // Start counting down
        setCountdown(postInterval);
        let timer = postInterval;
        while (timer > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          timer--;
          setCountdown(timer);
        }
        setCountdown(0); // Clear countdown after interval
        setIsCountingDown(false); // Stop counting down
      }
    }

    // setPosting(false); // Removed from here
    // Optionally, display a summary of all posts
    const successfulPosts = postResults.filter(res => res.success).length;
    const failedPosts = postResults.length - successfulPosts;
    if (successfulPosts > 0 && failedPosts === 0) {
      setSuccessMessage(`Successfully posted to all ${successfulPosts} selected pages!`);
    } else if (successfulPosts > 0 && failedPosts > 0) {
      setSuccessMessage(`Posted to ${successfulPosts} pages. ${failedPosts} pages failed.`);
    } else {
      setError('No posts were successful.');
    }
    setPostContent(''); // Clear content after successful post
    setPostCaption(''); // Clear caption
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
      <BackButton className="mb-4" />
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
        <FacebookAccountSelector
          allConnectedAccounts={allConnectedAccounts}
          selectedFacebookAccountId={selectedFacebookAccountId}
          onSelectAccount={setSelectedFacebookAccountId}
          loading={loading}
        />

        <FacebookPageSelector
          availablePages={availablePagesForSelectedAccount}
          selectedPageIds={selectedPageIds}
          onSelectPages={setSelectedPageIds}
          disabled={!selectedFacebookAccountId}
        />

        {/* Post Interval */}
        <div className="mb-4">
          <label htmlFor="postInterval" className="block text-gray-700 text-sm font-bold mb-2">Interval between posts (seconds):</label>
          <input
            type="number"
            id="postInterval"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="0 for no interval"
            value={postInterval}
            onChange={(e) => setPostInterval(Number(e.target.value))}
            min="0"
          />
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
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out w-full cursor-pointer"
          disabled={posting || isCountingDown}
        >
          {posting ? (
            <span className="flex items-center justify-center">
              <Spinner className="h-5 w-5 text-white" />
              Posting...
            </span>
          ) : isCountingDown ? (
            <span className="flex items-center justify-center">
              <Spinner className="h-5 w-5 text-white" />
              Waiting for next post... {countdown}
            </span>
          ) : (
            'Post to Facebook'
          )}
        </button>
      </form>
    </div>
  );
}
