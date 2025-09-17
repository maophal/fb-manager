import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface VideoUploadProcessorProps {
  onVideoProcessed: (file: File | null) => void;
  onRemoveVideo: () => void;
  videoFile: File | null; // Pass videoFile from parent to allow parent to clear it
  videoPreviewUrl: string | null; // Pass videoPreviewUrl from parent
  setVideoPreviewUrl: (url: string | null) => void; // Allow parent to set preview URL
}

const MAX_VIDEO_BYTES = 2 * 1024 * 1024 * 1024; // 2GB safety cap

const VideoUploadProcessor: React.FC<VideoUploadProcessorProps> = ({
  onVideoProcessed,
  onRemoveVideo,
  videoFile,
  videoPreviewUrl,
  setVideoPreviewUrl,
}) => {
  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const originalFile = e.target.files[0];

      if (!originalFile.type.startsWith('video/')) {
        toast.error('Invalid file type. Please upload a video file.');
        onVideoProcessed(null);
        return;
      }
      if (originalFile.size > MAX_VIDEO_BYTES) {
        toast.error('Video file is too large.');
        onVideoProcessed(null);
        return;
      }

      // No client-side aspect ratio validation here, relying on server-side auto-cropping
      toast.success('Video selected. Server will process aspect ratio automatically.');
      onVideoProcessed(originalFile);
      if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
      setVideoPreviewUrl(URL.createObjectURL(originalFile));
    }
  };

  // Revoke preview URL on unmount or when video changes
  useEffect(() => {
    return () => {
      if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    };
  }, [videoPreviewUrl]);

  return (
    <div>
      <label htmlFor="videoUpload" className="block text-sm font-medium text-gray-700 mb-2">
        Upload Video:
      </label>
      <input
        type="file"
        id="videoUpload"
        accept="video/*"
        className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        onChange={handleVideoFileChange}
      />

      {videoPreviewUrl && (
        <div className="mt-4">
          <p className="block text-sm font-medium text-gray-700 mb-2">Video Preview:</p>
          <div className="relative">
            <video src={videoPreviewUrl} controls className="w-full rounded-md shadow-md"></video>
            <button
              type="button"
              onClick={onRemoveVideo}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
              title="Remove video"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoUploadProcessor;
