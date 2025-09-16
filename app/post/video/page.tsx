'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Spinner from '../../../components/Spinner';
import Link from 'next/link';
import BackButton from '../../../components/BackButton';
import FacebookAccountSelector from '../../../components/FacebookAccountSelector';
import FacebookPageSelector from '../../../components/FacebookPageSelector';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import moment from 'moment';
import toast from 'react-hot-toast';

interface FacebookPage {
  id: number;
  page_id: string;
  page_name: string;
  page_picture_url?: string;
}

interface ConnectedFacebookAccount {
  facebook_user_id: string;
  facebook_user_name: string;
  pages: FacebookPage[];
}

export default function PostVideoPage() {
  const { user, isLoggedIn } = useAuth();
  const router = useRouter();

  const [postCaption, setPostCaption] = useState('');
  const [selectedPageIds, setSelectedPageIds] = useState<string[]>([]);
  const [postInterval, setPostInterval] = useState<number>(5);
  const [countdown, setCountdown] = useState<number>(0);
  const [isCountingDown, setIsCountingDown] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [postOption, setPostOption] = useState<'now' | 'schedule'>('now');
  const [publishedPageIds, setPublishedPageIds] = useState<string[]>([]);
  const [scheduledDate, setScheduledDate] = useState<Date | null>(moment().add(10, 'minutes').toDate());
  const datePickerRef = useRef<DatePicker>(null);

  // Video specific states
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [postType, setPostType] = useState<'video' | 'reel'>('video');

  useEffect(() => {
    if (postOption === 'schedule' && datePickerRef.current) {
      datePickerRef.current.setOpen(true);
    }
  }, [postOption]);

  const [allConnectedAccounts, setAllConnectedAccounts] = useState<ConnectedFacebookAccount[]>([]);
  const [selectedFacebookAccountId, setSelectedFacebookAccountId] = useState<string | null>(null);
  const [availablePagesForSelectedAccount, setAvailablePagesForSelectedAccount] = useState<FacebookPage[]>([]);

  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }
    if (!user || !user.id) {
      toast.error('User data not available. Please log in again.');
      setLoading(false);
      return;
    }

    const fetchConnectedAccountsAndPages = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/facebook/pages?userId=${user.id}`);
        const data = await response.json();
        if (response.ok) {
          setAllConnectedAccounts(data.accounts);
          if (data.accounts.length > 0) {
            setSelectedFacebookAccountId(data.accounts[0].facebook_user_id);
          }
        } else {
          toast.error(data.message || 'Failed to fetch connected Facebook accounts and pages.');
        }
      } catch (err: unknown) {
        if (err instanceof Error) {
          toast.error(err.message || 'An unexpected error occurred while fetching Facebook accounts and pages.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchConnectedAccountsAndPages();
  }, [isLoggedIn, user, router]);

  useEffect(() => {
    if (selectedFacebookAccountId) {
      const selectedAccount = allConnectedAccounts.find(
        (account) => account.facebook_user_id === selectedFacebookAccountId
      );
      if (selectedAccount) {
        setAvailablePagesForSelectedAccount(selectedAccount.pages);
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

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type.startsWith('video/')) {
        setVideoFile(file);
        const previewUrl = URL.createObjectURL(file);
        setVideoPreviewUrl(previewUrl);
      } else {
        toast.error('Invalid file type. Please upload a video file.');
      }
    }
  };

  const handleRemoveVideo = () => {
    setVideoFile(null);
    if (videoPreviewUrl) {
      URL.revokeObjectURL(videoPreviewUrl);
    }
    setVideoPreviewUrl(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setCountdown(0);
    setIsCountingDown(false);

    if (!videoFile) {
      toast.error('Please select a video to upload.');
      return;
    }
    if (selectedPageIds.length === 0) {
      toast.error('Please select at least one Facebook page to post to.');
      return;
    }

    if (postOption === 'schedule' && !scheduledDate) {
      toast.error('Please select a date and time for the scheduled post.');
      return;
    }

    if (postOption === 'schedule' && scheduledDate && scheduledDate < new Date()) {
      toast.error('Scheduled date and time must be in the future.');
      return;
    }

    setPosting(true);
    const postResults: { pageId: string; success: boolean; message?: string; postId?: string }[] = [];

    try {
      for (let i = 0; i < selectedPageIds.length; i++) {
        const pageId = selectedPageIds[i];
        
        const formData = new FormData();
        formData.append('video', videoFile);
        formData.append('pageId', pageId);
        formData.append('caption', postCaption);
        formData.append('postType', postType);
        if (postOption === 'schedule' && scheduledDate) {
            formData.append('scheduledPublishTime', scheduledDate.toISOString());
        }

        const response = await fetch('/api/facebook/post-video', {
            method: 'POST',
            body: formData,
        });

        const data = await response.json();

        if (response.ok) {
            postResults.push({ pageId, success: true, postId: data.postId });
            setSuccessMessage(`Video post created for page ${pageId}! Post ID: ${data.postId}`);
            setPublishedPageIds((prev) => [...prev, pageId]);
        } else {
            postResults.push({ pageId, success: false, message: data.message || 'Failed to create video post.' });
            toast.error(`Failed to create video post for page ${pageId}: ${data.message || 'Unknown error'}`);
        }

        if (i < selectedPageIds.length - 1) {
          const delay = postInterval > 0 ? postInterval : 2;
          console.log(`Waiting for ${delay} seconds before posting to next page...`);
          setIsCountingDown(true);
          setCountdown(delay);

          await new Promise(resolve => {
            let count = delay;
            const intervalId = setInterval(() => {
              count--;
              setCountdown(count);
              if (count === 0) {
                clearInterval(intervalId);
                resolve(null);
              }
            }, 1000);
          });

          setIsCountingDown(false);
          setCountdown(0);
        }
      }

      const successfulPosts = postResults.filter(res => res.success).length;
      const failedPosts = postResults.length - successfulPosts;

      if (successfulPosts > 0 && failedPosts === 0) {
        if (postOption === 'schedule') {
          setSuccessMessage(`Successfully scheduled video post to all ${successfulPosts} selected pages!`);
        } else {
          setSuccessMessage(`Successfully posted video to all ${successfulPosts} selected pages!`);
        }
        setVideoFile(null);
        setVideoPreviewUrl(null);
        setPostCaption('');
      } else if (successfulPosts > 0 && failedPosts > 0) {
        if (postOption === 'schedule') {
          setSuccessMessage(`Scheduled video to ${successfulPosts} pages. ${failedPosts} pages failed.`);
        } else {
          setSuccessMessage(`Posted video to ${successfulPosts} pages. ${failedPosts} pages failed.`);
        }
      } else {
        toast.error('No video posts were successful.');
      }

    } catch (err: unknown) {
      let errorMessage = 'An unexpected error occurred during the posting process.';
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      toast.error(errorMessage);
    } finally {
      setPosting(false);
      console.log('Final post results:', postResults);
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
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl w-full bg-white rounded-xl shadow-lg p-6 sm:p-8">
        <BackButton className="mb-6" />
        <h1 className="text-4xl font-extrabold text-gray-900 text-center mb-8">Create Video Post</h1>

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
            publishedPageIds={publishedPageIds}
          />

          <div className="pb-4">
            <span className="block text-sm font-medium text-gray-700 mb-2">Post Type:</span>
            <div className="mt-2 flex items-center space-x-6">
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="radio"
                  className="form-radio h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  name="postType"
                  value="video"
                  checked={postType === 'video'}
                  onChange={() => setPostType('video')}
                />
                <span className="ml-2 text-gray-900">Video</span>
              </label>
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="radio"
                  className="form-radio h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  name="postType"
                  value="reel"
                  checked={postType === 'reel'}
                  onChange={() => setPostType('reel')}
                />
                <span className="ml-2 text-gray-900">Reel</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

            <div>
              <label htmlFor="postCaption" className="block text-sm font-medium text-gray-700 mb-2">Caption (Optional):</label>
              <textarea
                id="postCaption"
                rows={3}
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out resize-y"
                placeholder="Add a compelling caption to your video post..."
                value={postCaption}
                onChange={(e) => setPostCaption(e.target.value)}
              ></textarea>
            </div>
          </div>

          <div>
            <label htmlFor="videoUpload" className="block text-sm font-medium text-gray-700 mb-2">Upload Video:</label>
            <input
              type="file"
              id="videoUpload"
              accept="video/*"
              className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              onChange={handleVideoFileChange}
            />
          </div>

          {videoPreviewUrl && (
            <div className="mt-4">
              <p className="block text-sm font-medium text-gray-700 mb-2">Video Preview:</p>
              <div className="relative">
                <video src={videoPreviewUrl} controls className="w-full rounded-md shadow-md"></video>
                <button
                  type="button"
                  onClick={handleRemoveVideo}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                  title="Remove video"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}

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
                  ref={datePickerRef}
                  id="scheduledDatePicker"
                  selected={scheduledDate}
                  onChange={(date: Date | null) => setScheduledDate(date)}
                  showTimeSelect
                  dateFormat="Pp"
                  minDate={moment().toDate()}
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
            {isCountingDown ? (
              <span className="flex items-center">
                <Spinner className="h-5 w-5 mr-3 text-white animate-spin" />
                Waiting for next post... {countdown}s
              </span>
            ) : posting ? (
              <span className="flex items-center">
                <Spinner className="h-5 w-5 mr-3 text-white animate-spin" />
                Posting...
              </span>
            ) : (
              'Post Video to Facebook'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}