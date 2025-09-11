'use client';

import React, { useState, useEffect } from 'react'; // Import useState and useEffect
import Navbar from './Navbar';
import Footer from './Footer';
// import Spinner from './Spinner'; // Spinner is no longer needed
import { useAuth } from '@/context/AuthContext';

export default function AppContent({ children }: { children: React.ReactNode }) {
  const { isLoading } = useAuth();
  const [progress, setProgress] = useState(0); // State for progress

  useEffect(() => {
    if (isLoading) {
      setProgress(0); // Reset progress when loading starts
      const interval = setInterval(() => {
        setProgress((prevProgress) => {
          if (prevProgress >= 100) {
            clearInterval(interval);
            return 100;
          }
          // Simulate progress, can be adjusted
          return prevProgress + 10;
        });
      }, 100); // Update progress every 100ms

      return () => clearInterval(interval); // Cleanup interval
    } else {
      setProgress(100); // Ensure it's 100% when loading finishes
    }
  }, [isLoading]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex flex-col items-center justify-center z-50">
        <div className="w-[200px] bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mb-3">
          <div
            className="bg-blue-600 h-2.5 rounded-full"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <p className="text-white text-lg">Progress Loading... {progress}%</p>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  );
}