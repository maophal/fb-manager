'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Spinner from './Spinner'; // Assuming Spinner is in the same components directory

export default function ProgressLoader() {
  const { isLoading } = useAuth();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isLoading) {
      setProgress(0);
      const interval = setInterval(() => {
        setProgress((prevProgress) => {
          if (prevProgress >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prevProgress + 10;
        });
      }, 100);

      return () => clearInterval(interval);
    } else {
      setProgress(100);
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

  return null;
}