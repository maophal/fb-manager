import React, { useEffect } from 'react';
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
  videoFile, // Add videoFile to destructuring
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
    <div className="border border-gray-300 rounded-lg p-6 bg-gray-50 shadow-sm">
      <label className="block text-lg font-semibold text-gray-800 mb-4">Video for Reel:</label>

      {!videoPreviewUrl ? (
        <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-blue-300 rounded-lg bg-white hover:border-blue-500 transition-all duration-200 ease-in-out cursor-pointer">
          <input
            type="file"
            id="videoUpload"
            accept="video/*"
            className="hidden" // Hide the default input
            onChange={handleVideoFileChange}
          />
          <label htmlFor="videoUpload" className="flex flex-col items-center cursor-pointer">
            <svg
              className="w-12 h-12 text-blue-500 mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 0115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              ></path>
            </svg>
            <p className="text-blue-600 text-base font-medium">Drag & drop a video here, or click to select</p>
            <p className="text-gray-500 text-sm mt-1">(Max 2GB, MP4, MOV, etc.)</p>
          </label>
        </div>
      ) : (
        <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-white shadow-md relative">
          <p className="block text-sm font-medium text-gray-700 mb-2">Selected Video:</p>
          <div className="flex items-center mb-3">
            <svg
              className="w-5 h-5 text-green-500 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
            <span className="text-gray-800 font-medium truncate">{videoFile?.name || 'Video File'}</span>
          </div>
          <video src={videoPreviewUrl} controls className="w-full rounded-md shadow-md"></video>
          <button
            type="button"
            onClick={onRemoveVideo}
            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600 transition-colors duration-200"
            title="Remove video"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default VideoUploadProcessor;
