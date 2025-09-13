'use client';

import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import "./globals.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { LoadingProvider } from '@/context/LoadingContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { Toaster } from 'react-hot-toast';
import { useState, useEffect, Suspense } from 'react';
import MainContent from '../components/MainContent';
import ProgressBar from '../components/ProgressBar';

const geistSans = GeistSans;

const geistMono = GeistMono;

function ProgressLoader() {
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
      >
        <AuthProvider>
          <ThemeProvider>
            <LoadingProvider>
              <ProgressLoader />
              <Navbar />
              <MainContent>
                <Suspense>
                  <ProgressBar />
                </Suspense>
                {children}
              </MainContent>
              <Footer />
              <Toaster />
            </LoadingProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
