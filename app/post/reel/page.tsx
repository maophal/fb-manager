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
import VideoUploadProcessor from '../../../components/VideoUploadProcessor';

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



export default function PostReelPage() {
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null); // New state for persistent error message
  const [postOption, setPostOption] = useState<'now' | 'schedule'>('now');
  const [publishedPageIds, setPublishedPageIds] = useState<string[]>([]);
  const [scheduledDate, setScheduledDate] = useState<Date | null>(moment().add(10, 'minutes').toDate());
  const datePickerRef = useRef<DatePicker>(null);

  // State to store the video ID after a successful post for status checking
  const [postedVideoId, setPostedVideoId] = useState<string | null>(null);

  // Reel specific states
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [isProcessingVideo, setIsProcessingVideo] = useState<boolean>(false); // New state for video processing
  const [processedVideoFilePath, setProcessedVideoFilePath] = useState<string | null>(null); // New state for processed video path

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

  // Revoke preview URL on unmount or when video changes
  useEffect(() => {
    return () => {
      if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    };
  }, [videoPreviewUrl]);

  

      

  const handleRemoveVideo = () => {
    setVideoFile(null);
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    setVideoPreviewUrl(null);
    setProcessedVideoFilePath(null); // Clear processed video path
  };

  const checkReelStatus = async (videoId: string, pageId: string) => {
    toast.loading('Checking reel status...');
    try {
      const response = await fetch(`/api/facebook/reel-status?videoId=${videoId}&pageId=${pageId}`);
      const data = await response.json();
      toast.dismiss(); // Dismiss loading toast

      if (response.ok) {
        toast.success(`Reel Status for ${videoId} on page ${pageId}: ${JSON.stringify(data.status)}`, { duration: 5000 });
      } else {
        toast.error(`Failed to get status for ${videoId} on page ${pageId}: ${data.message || 'Unknown error'}`);
      }
    } catch (error: unknown) {
      toast.dismiss(); // Dismiss loading toast
      if (error instanceof Error) {
        toast.error(`Error checking reel status: ${error.message}`);
      } else {
        toast.error('An unknown error occurred while checking reel status.');
      }
    }
  };

  const canSubmit =
    !!videoFile &&
    !isProcessingVideo && // Ensure video processing is complete
    !!processedVideoFilePath && // Ensure processed video path exists
    selectedPageIds.length > 0 &&
    postCaption.trim().length > 0 &&
    (postOption === 'now' || (!!scheduledDate && scheduledDate > new Date()));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setCountdown(0);
    setIsCountingDown(false);

    if (!videoFile) {
      toast.error('Please select a video to upload.');
      return;
    }
    if (isProcessingVideo) {
      toast.error('Video is still being processed. Please wait.');
      return;
    }
    if (!processedVideoFilePath) {
      toast.error('Processed video path is missing. Please re-upload the video.');
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
        formData.append('processedVideoPath', processedVideoFilePath); // Use processed video path
        formData.append('pageId', pageId);   // <-- server expects 'pageId'
        formData.append('caption', postCaption); // <-- server expects 'caption'
        if (postOption === 'schedule' && scheduledDate) {
          // server expects 'scheduledPublishTime' as ISO string; server converts to epoch
          formData.append('scheduledPublishTime', scheduledDate.toISOString());
        }

        const response = await fetch('/api/facebook/post-reel', {
          method: 'POST',
          body: formData, // keep browser-managed multipart; do not set Content-Type manually
        });

        let data: { success?: boolean; postId?: string; message?: string } = {};
        try {
          data = await response.json();
        } catch {
          // Non-JSON error
        }

        if (response.ok) {
          postResults.push({ pageId, success: true, postId: data.postId });
          setSuccessMessage(`Reel post created for page ${pageId}! Post ID: ${data.postId}`);
          setPublishedPageIds((prev) => [...prev, pageId]);
          setPostedVideoId(data.postId ?? null); // Store the videoId for status checking
        } else {
          const msg = data?.message || `HTTP ${response.status}`;
          postResults.push({ pageId, success: false, message: msg });
          toast.error(`Failed to create reel post for page ${pageId}: ${msg}`);
          setErrorMessage(`Failed to post to ${pageId}: ${msg}`); // Set persistent error message
        }

        // Interval between pages
        if (i < selectedPageIds.length - 1) {
          const delay = postInterval > 0 ? postInterval : 2;
          setIsCountingDown(true);
          setCountdown(delay);

          await new Promise<void>((resolve) => {
            let count = delay;
            const timer = setInterval(() => {
              count--;
              setCountdown(count);
              if (count <= 0) {
                clearInterval(timer);
                resolve();
              }
            }, 1000);
          });

          setIsCountingDown(false);
          setCountdown(0);
        }
      }

      const successful = postResults.filter((r) => r.success).length;
      const failed = postResults.length - successful;

      if (successful > 0 && failed === 0) {
        setSuccessMessage(
          postOption === 'schedule'
            ? `Successfully scheduled reel post to all ${successful} selected pages!`
            : `Successfully posted reel to all ${successful} selected pages!`
        );
        setVideoFile(null);
        if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
        setVideoPreviewUrl(null);
        setPostCaption('');
      } else if (successful > 0 && failed > 0) {
        setSuccessMessage(
          postOption === 'schedule'
            ? `Scheduled reel to ${successful} pages. ${failed} pages failed.`
            : `Posted reel to ${successful} pages. ${failed} pages failed.`
        );
      } else {
        toast.error('No reel posts were successful.');
      }
    } catch (err: unknown) {
      let msg = 'An unexpected error occurred during the posting process.';
      if (err instanceof Error) msg = err.message;
      toast.error(msg);
      setErrorMessage(msg); // Set persistent error message
    } finally {
      setPosting(false);
      // console.log('Final post results:', postResults);

      // Clean up the processed video file on the server
      if (processedVideoFilePath) {
        try {
          await fetch('/api/facebook/cleanup-video', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ filePath: processedVideoFilePath }),
          });
          console.log('Processed video file cleanup initiated.');
        } catch (cleanupError) {
          console.error('Failed to initiate processed video file cleanup:', cleanupError);
        }
      }
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
        <p className="text-red-600">
          No Facebook accounts connected. Please connect an account in your{' '}
          <Link href="/facebook" className="text-blue-500 hover:underline">
            Facebook Accounts &amp; Pages
          </Link>{' '}
          section.
        </p>
      </div>
    );
  }

  console.log('canSubmit:', canSubmit, 'videoFile:', !!videoFile, 'isProcessingVideo:', isProcessingVideo, 'processedVideoFilePath:', !!processedVideoFilePath, 'selectedPageIds.length:', selectedPageIds.length, 'postCaption.length:', postCaption.trim().length);
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl w-full bg-white rounded-xl shadow-lg p-6 sm:p-8">
        <BackButton className="mb-6" />
        <h1 className="text-4xl font-extrabold text-gray-900 text-center mb-8">Create Reel Post</h1>

        {successMessage && (
          <div
            className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg relative mb-6 shadow-md"
            role="alert"
          >
            <span className="block sm:inline font-medium">{successMessage}</span>
            {postedVideoId && selectedPageIds.length > 0 && (
              <div className="mt-4 flex justify-center">
                <button
                  type="button"
                  onClick={() => checkReelStatus(postedVideoId, selectedPageIds[0])} // Assuming checking status for the first selected page for simplicity
                  className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Check Reel Status
                </button>
              </div>
            )}
          </div>
        )}

        {errorMessage && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-6 shadow-md"
            role="alert"
          >
            <span className="block sm:inline font-medium">{errorMessage}</span>
            <button
              type="button"
              className="absolute top-0 bottom-0 right-0 px-4 py-3"
              onClick={() => setErrorMessage(null)}
            >
              <svg
                className="fill-current h-6 w-6 text-red-500"
                role="button"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
              >
                <title>Close</title>
                <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z" />
              </svg>
            </button>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="postInterval" className="block text-sm font-medium text-gray-700 mb-2">
                Interval between posts (seconds):
              </label>
              <input
                type="number"
                id="postInterval"
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out"
                placeholder="0 for no interval"
                value={postInterval}
                onChange={(e) => setPostInterval(Number(e.target.value))}
                min={0}
              />
            </div>

            <div>
              <label htmlFor="postCaption" className="block text-sm font-medium text-gray-700 mb-2">
                Caption (Required for Reels):
              </label>
              <textarea
                id="postCaption"
                rows={3}
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out resize-y"
                placeholder="Add a compelling caption to your reel..."
                value={postCaption}
                onChange={(e) => setPostCaption(e.target.value)}
                required
              ></textarea>
            </div>
          </div>

          <VideoUploadProcessor
            onVideoProcessed={async (file) => {
              setVideoFile(file);
              if (file) {
                setIsProcessingVideo(true);
                setProcessedVideoFilePath(null); // Clear previous processed path
                console.log('Starting video processing...');
                try {
                  const formData = new FormData();
                  formData.append('video', file);
                  const response = await fetch('/api/facebook/process-video', {
                    method: 'POST',
                    body: formData,
                  });
                  if (response.ok) {
                    const data = await response.json();
                    setProcessedVideoFilePath(data.processedVideoPath);
                    toast.success('Video processed successfully!');
                    console.log('Video processed. processedVideoFilePath:', data.processedVideoPath);
                  } else {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to process video.');
                  }
                } catch (error: unknown) { // Changed 'any' to 'unknown'
                  let errorMessage = 'An unknown error occurred during video processing.';
                  if (error instanceof Error) {
                    errorMessage = error.message;
                  }
                  toast.error(`Video processing failed: ${errorMessage}`);
                  setVideoFile(null); // Clear the selected video if processing fails
                  if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
                  setVideoPreviewUrl(null);
                  console.error('Video processing failed:', errorMessage);
                } finally {
                  setIsProcessingVideo(false);
                  console.log('Video processing finished. isProcessingVideo:', false);
                }
              }
            }}
            onRemoveVideo={handleRemoveVideo}
            videoFile={videoFile}
            videoPreviewUrl={videoPreviewUrl}
            setVideoPreviewUrl={setVideoPreviewUrl}
          />

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
                <label htmlFor="scheduledDatePicker" className="block text-sm font-medium text-gray-700 mb-2">
                  Schedule Date and Time:
                </label>
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
            disabled={posting || !canSubmit} // Removed isCountingDown from disabled prop
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
              'Post Reel to Facebook'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
