'use client';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function HomePage() {
  const { isLoggedIn } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-gray-800 dark:text-white mb-4">Facebook Manager</h1>
        <p className="text-xl text-gray-600 dark:text-gray-300">Your content, simplified.</p>
      </div>

      {isLoggedIn ? (
        <div className="w-full max-w-2xl px-4">
          <div className="grid grid-cols-2 gap-6">
            <Link href="/post/text" className="flex items-center justify-center h-48 w-full bg-blue-500 hover:bg-blue-600 text-white font-bold text-2xl rounded-lg shadow-xl transition duration-300 ease-in-out transform hover:-translate-y-2">
              Text Post
            </Link>
            <Link href="/post/image" className="flex items-center justify-center h-48 w-full bg-green-500 hover:bg-green-600 text-white font-bold text-2xl rounded-lg shadow-xl transition duration-300 ease-in-out transform hover:-translate-y-2">
              Image Post
            </Link>
            <Link href="/post/video" className="flex items-center justify-center h-48 w-full bg-red-500 hover:bg-red-600 text-white font-bold text-2xl rounded-lg shadow-xl transition duration-300 ease-in-out transform hover:-translate-y-2">
              Video Post
            </Link>
            <Link href="/post/reel" className="flex items-center justify-center h-48 w-full bg-purple-500 hover:bg-purple-600 text-white font-bold text-2xl rounded-lg shadow-xl transition duration-300 ease-in-out transform hover:-translate-y-2">
              Reel Post
            </Link>
          </div>
        </div>
      ) : (
        <Link href="/login" className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-4 px-10 rounded-full shadow-lg transition duration-300 ease-in-out transform hover:scale-105">
          Login to Get Started
        </Link>
      )}
    </div>
  );
}
