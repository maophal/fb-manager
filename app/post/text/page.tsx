'use client';

import React, { useState, useEffect, useRef } from 'react'; // Import useRef
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Spinner from '../../../components/Spinner'; // Adjust path as needed
import Link from 'next/link'; // Import Link
import BackButton from '../../../components/BackButton'; // Import BackButton
import FacebookAccountSelector from '../../../components/FacebookAccountSelector';
import FacebookPageSelector from '../../../components/FacebookPageSelector';
import DatePicker from 'react-datepicker'; // Import DatePicker
import 'react-datepicker/dist/react-datepicker.css'; // Import DatePicker CSS
import moment from 'moment'; // Import moment.js

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
  const [publishedPageIds, setPublishedPageIds] = useState<string[]>([]); // New state for successfully posted page IDs
  const [scheduledDate, setScheduledDate] = useState<Date | null>(moment().add(10, 'minutes').toDate()); // New state for scheduled date, defaults to 10 minutes from now using moment
  const datePickerRef = useRef<DatePicker>(null); // Create a ref for the DatePicker

  // Effect to open DatePicker when schedule option is selected
  useEffect(() => {
    if (postOption === 'schedule' && datePickerRef.current) {
      datePickerRef.current.setOpen(true);
    }
  }, [postOption]);

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

    if (postOption === 'schedule' && !scheduledDate) {
      setError('Please select a date and time for the scheduled post.');
      return;
    }

    if (postOption === 'schedule' && scheduledDate && scheduledDate < new Date()) {
      setError('Scheduled date and time must be in the future.');
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
          body: JSON.stringify({
            pageId,
            message: postContent,
            caption: postCaption,
            scheduledPublishTime: postOption === 'schedule' && scheduledDate ? scheduledDate.toISOString() : undefined,
          }),
        });

        const data = await response.json();
        setPosting(false); // Set false after fetch returns

        if (response.ok) {
          postResults.push({ pageId, success: true, postId: data.postId });
          setSuccessMessage(`Posted to page ${pageId}! Post ID: ${data.postId}`);
          setPublishedPageIds((prev) => [...prev, pageId]); // Add to publishedPageIds
        } else {
          postResults.push({ pageId, success: false, message: data.message || 'Failed to post.' });
          setError(`Failed to post to page ${pageId}: ${data.message || 'Unknown error'}`);
        }
      } catch (err: unknown) {
        setPosting(false); // Set false on error too
        let errorMessage = 'An unexpected error occurred.';
        if (err instanceof Error) {
          errorMessage = err.message;
        }
        postResults.push({ pageId, success: false, message: errorMessage });
        setError(`Error posting to page ${pageId}: ${errorMessage}`);
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
      if (postOption === 'schedule') {
        setSuccessMessage(`Successfully scheduled post to all ${successfulPosts} selected pages!`);
      } else {
        setSuccessMessage(`Successfully posted to all ${successfulPosts} selected pages!`);
      }
    } else if (successfulPosts > 0 && failedPosts > 0) {
      if (postOption === 'schedule') {
        setSuccessMessage(`Scheduled to ${successfulPosts} pages. ${failedPosts} pages failed.`);
      } else {
        setSuccessMessage(`Posted to ${successfulPosts} pages. ${failedPosts} pages failed.`);
      }
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
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl w-full bg-white rounded-xl shadow-lg p-6 sm:p-8">
        <BackButton className="mb-6" />
        <h1 className="text-4xl font-extrabold text-gray-900 text-center mb-8">Create Text Post</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-6 shadow-md" role="alert">
            <span className="block sm:inline font-medium">{error}</span>
          </div>
        )}
        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg relative mb-6 shadow-md" role="alert">
            <span className="block sm:inline font-medium">{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
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
            publishedPageIds={publishedPageIds} // Pass the new prop
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Post Interval */}
            <div>
              <label htmlFor="postInterval" className="block text-sm font-medium text-gray-700 mb-2">Interval between posts (seconds):</label>
              <input
                type="number"
                id="postInterval"
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out"
                placeholder="0 for no interval"
                value={postInterval}
                onChange={(e) => setPostInterval(Number(e.target.value))}
                min="0"
              />
            </div>

            {/* Caption Box */}
            <div>
              <label htmlFor="postCaption" className="block text-sm font-medium text-gray-700 mb-2">Caption (Optional):</label>
              <textarea
                id="postCaption"
                rows={3}
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out resize-y"
                placeholder="Add a compelling caption to your post..."
                value={postCaption}
                onChange={(e) => setPostCaption(e.target.value)}
              ></textarea>
            </div>
          </div>

          {/* Text Box */}
          <div>
            <label htmlFor="postContent" className="block text-sm font-medium text-gray-700 mb-2">Post Content:</label>
            <textarea
              id="postContent"
              rows={8}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out resize-y"
              placeholder="What's on your mind? Share your thoughts here..."
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              required={postOption === 'now'}
            ></textarea>
          </div>

          {/* Publish Option */}
        <div className="pb-4">
            <span className="block text-sm font-medium text-gray-700 mb-2">Publish Option:</span>
            <div className="mt-2 flex items-center space-x-6">
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="radio"
                  className="form-radio h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  name="postOption"
                  value="now"
                  checked={postOption === 'now'}
                  onChange={() => setPostOption('now')}
                />
                <span className="ml-2 text-gray-900">Publish Now</span>
              </label>
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="radio"
                  className="form-radio h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  name="postOption"
                  value="schedule"
                  checked={postOption === 'schedule'}
                  onChange={() => setPostOption('schedule')}
                />
                <span className="ml-2 text-gray-900">Schedule</span>
              </label>
            </div>
            {postOption === 'schedule' && (
              <div className="mt-4">
                <label htmlFor="scheduledDatePicker" className="block text-sm font-medium text-gray-700 mb-2">Schedule Date and Time:</label>
                <DatePicker
                  ref={datePickerRef} // Attach the ref
                  id="scheduledDatePicker"
                  selected={scheduledDate}
                  onChange={(date: Date | null) => setScheduledDate(date)}
                  showTimeSelect
                  
                  dateFormat="Pp"
                  minDate={moment().toDate()} // Only allow scheduling in the future
                  minTime={scheduledDate && moment(scheduledDate).isSame(moment(), 'day') ? moment().add(10, 'minutes').toDate() : moment().startOf('day').toDate()} // Lock previous times only for today's date
                  maxTime={moment().endOf('day').toDate()} // Allow selection up to end of day
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out"
                  placeholderText="Select date and time"
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-300 ease-in-out transform hover:-translate-y-0.5"
            disabled={posting || isCountingDown}
          >
            {posting ? (
              <span className="flex items-center">
                <Spinner className="h-5 w-5 mr-3 text-white animate-spin" />
                Posting...
              </span>
            ) : isCountingDown ? (
              <span className="flex items-center">
                <Spinner className="h-5 w-5 mr-3 text-white animate-spin" />
                Waiting for next post... {countdown}s
              </span>
            ) : (
              'Post to Facebook'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
