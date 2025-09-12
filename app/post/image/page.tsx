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
import { MdDoneOutline } from 'react-icons/md'; // Assuming this icon is still desired
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

export default function PostImagePage() {
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

  // Image specific states
  const [imageSourceType, setImageSourceType] = useState<'url' | 'upload'>('url');
  const [currentImageUrlInput, setCurrentImageUrlInput] = useState(''); // For single URL input
  const [imagePreviews, setImagePreviews] = useState<{ id: string; url: string; type: 'url' | 'file'; file?: File }[]>([]); // For displaying all image previews, including File object
  const [isGettingImage, setIsGettingImage] = useState(false);
  // Effect to open DatePicker when schedule option is selected
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

  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      const files = Array.from(e.dataTransfer.files);
      validateAndSetFiles(files);
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      validateAndSetFiles(files);
    }
  };

  const validateAndSetFiles = (files: File[]) => {
    const validFiles = files.filter(file => file.type.startsWith('image/'));
    if (validFiles.length !== files.length) {
      toast.error('Invalid file type. Please upload only images.');
    }

    const newImagePreviews = validFiles.map(file => ({
      id: 'upload-' + Date.now() + '-' + Math.random(),
      url: URL.createObjectURL(file),
      type: 'file' as 'file',
      file: file,
    }));
    setImagePreviews(prev => [...prev, ...newImagePreviews]);
    setCurrentImageUrlInput(''); // Clear URL input
  };

  const handleAddImageUrl = async () => {
    const urls = currentImageUrlInput.split('\n').filter(url => url.trim() !== '');
    if (urls.length > 0) {
      setIsGettingImage(true);
      const newImagePreviews = [];
      for (const url of urls) {
        let finalImageUrl = url.trim();
        if (finalImageUrl.includes('pinterest.com/pin/')) {
          try {
            const response = await fetch('/api/get-pinterest-image', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ pinterestUrl: finalImageUrl }),
            });
            const data = await response.json();
            if (response.ok && data.directImageUrl) {
              finalImageUrl = data.directImageUrl;
            } else {
              toast.error(`Could not extract direct image URL from Pinterest for: ${finalImageUrl}`);
              continue;
            }
          } catch (err) {
            toast.error(`Failed to process Pinterest URL: ${finalImageUrl}`);
            continue;
          }
        }
        newImagePreviews.push({ id: 'url-' + Date.now() + '-' + Math.random(), url: finalImageUrl, type: 'url' });
      }
      setImagePreviews(prev => [...prev, ...newImagePreviews]);
      setCurrentImageUrlInput('');
      setIsGettingImage(false);
    }
  };

  const handleRemoveImage = (id: string) => {
    setImagePreviews((prev) => prev.filter((img) => img.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setCountdown(0);
    setIsCountingDown(false);

    if (imagePreviews.length === 0) {
      toast.error('Please add at least one image URL or upload an image.');
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

    setPosting(true); // Start posting indicator for the whole process
    const postResults: { pageId: string; success: boolean; message?: string; postId?: string }[] = [];

    try {
      for (let i = 0; i < selectedPageIds.length; i++) {
        const pageId = selectedPageIds[i];
        const uploadedPhotoIds: string[] = [];

        // Step 1: Upload images for each page
        for (const image of imagePreviews) {
          const uploadFormData = new FormData();
          const response = await fetch(`/api/facebook/pages?userId=${user?.id}`);
          const data = await response.json();

          if (!response.ok) {
            toast.error(data.message || 'Failed to fetch connected Facebook accounts and pages for access token.');
            setPosting(false);
            return;
          }

          const selectedAccount = data.accounts.find((acc: ConnectedFacebookAccount) => acc.pages.some((p: FacebookPage) => p.page_id === pageId));
          const pageAccessToken = selectedAccount?.pages.find((p: FacebookPage) => p.page_id === pageId)?.page_access_token;

          if (!pageAccessToken) {
            toast.error(`Could not retrieve page access token for page ${pageId}.`);
            continue; // Skip to the next page
          }

          uploadFormData.append('access_token', pageAccessToken);
          uploadFormData.append('published', 'false');

          if (image.type === 'url') {
            uploadFormData.append('url', image.url);
          } else if (image.type === 'file' && image.file) {
            uploadFormData.append('source', image.file, image.file.name);
          }

          const uploadResponse = await fetch(`${process.env.NEXT_PUBLIC_FACEBOOK_GRAPH_API_BASE_URL}${pageId}/photos`, {
            method: 'POST',
            body: uploadFormData,
          });

          const uploadData = await uploadResponse.json();
          if (uploadResponse.ok && uploadData.id) {
            uploadedPhotoIds.push(uploadData.id);
          } else {
            toast.error(`Failed to upload image for page ${pageId}: ${uploadData.error?.message || 'Unknown error'}`);
            break; // Stop uploading for this page if one image fails
          }
        }

        if (uploadedPhotoIds.length !== imagePreviews.length) {
          toast.error(`Could not upload all images for page ${pageId}. Skipping post for this page.`);
          continue; // Skip to the next page
        }

        // Step 2: Create a post with the uploaded image IDs for the current page
        const postPayload = {
          pageId,
          caption: postCaption,
          attachedMedia: uploadedPhotoIds.map(id => ({ media_fbid: id })),
          scheduledPublishTime: postOption === 'schedule' && scheduledDate ? scheduledDate.toISOString() : undefined,
        };

        const postResponse = await fetch(`/api/facebook/post`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(postPayload),
        });

        const postData = await postResponse.json();

        if (postResponse.ok) {
          postResults.push({ pageId, success: true, postId: postData.postId });
          setSuccessMessage(`Post created for page ${pageId}! Post ID: ${postData.postId}`);
          setPublishedPageIds((prev) => [...prev, pageId]);
        } else {
          postResults.push({ pageId, success: false, message: postData.message || 'Failed to create post.' });
          toast.error(`Failed to create post for page ${pageId}: ${postData.message || 'Unknown error'}`);
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
          setSuccessMessage(`Successfully scheduled multi-image post to all ${successfulPosts} selected pages!`);
        } else {
          setSuccessMessage(`Successfully posted multi-image to all ${successfulPosts} selected pages!`);
        }
        // Clear inputs only on full success
        setCurrentImageUrlInput('');
        setImagePreviews([]);
        setPostCaption('');
      } else if (successfulPosts > 0 && failedPosts > 0) {
        if (postOption === 'schedule') {
          setSuccessMessage(`Scheduled multi-image to ${successfulPosts} pages. ${failedPosts} pages failed.`);
        } else {
          setSuccessMessage(`Posted multi-image to ${successfulPosts} pages. ${failedPosts} pages failed.`);
        }
      } else {
        toast.error('No multi-image posts were successful.');
      }

    } catch (err: unknown) {
      let errorMessage = 'An unexpected error occurred during the posting process.';
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      toast.error(errorMessage);
    } finally {
      setPosting(false);
      console.log('Final post results:', postResults); // Debug log
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
        <h1 className="text-4xl font-extrabold text-gray-900 text-center mb-8">Create Image Post</h1>

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
                placeholder="Add a compelling caption to your image post..."
                value={postCaption}
                onChange={(e) => setPostCaption(e.target.value)}
              ></textarea>
            </div>
          </div>

          {/* Image Input Section */}
          <div 
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors duration-300 ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex mb-4 border-b border-gray-200">
              <button
                type="button"
                className={`py-2 px-4 text-sm font-medium ${imageSourceType === 'url' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => { setImageSourceType('url'); setImagePreviews([]); }}
              >
                Image URL
              </button>
              <button
                type="button"
                className={`py-2 px-4 text-sm font-medium ${imageSourceType === 'upload' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => { setImageSourceType('upload'); setCurrentImageUrlInput(''); }}
              >
                Upload Image
              </button>
            </div>

            {imageSourceType === 'url' && (
              <div>
                <label htmlFor="currentImageUrlInput" className="block text-sm font-medium text-gray-700 mb-2">Add Image URLs (one per line):</label>
                <div className="flex space-x-2">
                  <textarea
                    id="currentImageUrlInput"
                    rows={3}
                    className="flex-grow mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out"
                    placeholder="e.g., https://example.com/your-image.jpg\nhttps://example.com/another-image.png"
                    value={currentImageUrlInput}
                    onChange={(e) => setCurrentImageUrlInput(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={handleAddImageUrl}
                    className="mt-1 px-4 py-2 bg-blue-500 text-white rounded-md shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out"
                    disabled={isGettingImage}                  >
                    {isGettingImage ? (
                      <span className="flex items-center">
                        <Spinner className="h-5 w-5 mr-3 text-white animate-spin" />
                        Getting Image...
                      </span>
                    ) : (
                      'Add Images'
                    )}
                  </button>
                </div>
                </div>
            )}

            {imageSourceType === 'upload' && (
              <div className="flex flex-col items-center justify-center">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-4-4V7a4 4 0 014-4h10a4 4 0 014 4v5a4 4 0 01-4 4h-2m-6 4h.01M12 12h.01M12 8h.01M7 16h.01"></path></svg>
                <p className="mt-2 text-sm text-gray-600">Drag & drop your images here, or <label htmlFor="imageUpload" className="text-blue-500 hover:underline cursor-pointer">browse</label></p>
                <input
                  type="file"
                  id="imageUpload"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageFileChange}
                />
              </div>
            )}

            {imagePreviews.length > 0 && (
              <div className="mt-4">
                <p className="block text-sm font-medium text-gray-700 mb-2">Selected Images:</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {imagePreviews.map((img) => (
                    <div key={img.id} className="relative group">
                      <img
                        src={img.url}
                        alt="Preview"
                        className="w-full h-24 object-cover rounded-md shadow-md"
                        onError={(e) => {
                          e.currentTarget.src = '/file.svg'; // Fallback to a generic image icon
                          e.currentTarget.alt = 'Image not found or failed to load';
                          e.currentTarget.className = 'w-full h-24 object-contain rounded-md shadow-md bg-gray-200 p-4'; // Adjust styling for fallback
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(img.id)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        title="Remove image"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
                  ref={datePickerRef}
                  id="scheduledDatePicker"
                  selected={scheduledDate}
                  onChange={(date: Date | null) => setScheduledDate(date)}
                  showTimeSelect
                  showMinutes
                  dateFormat="Pp"
                  minDate={moment().toDate()}
                  minTime={scheduledDate && moment(scheduledDate).isSame(moment(), 'day') ? moment().add(10, 'minutes').toDate() : moment().startOf('day').toDate()}
                  maxTime={moment().endOf('day').toDate()}
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
              'Post Image to Facebook'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
