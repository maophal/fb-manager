'use client'; // Add use client directive
import Link from 'next/link';
import { useEffect } from 'react'; // Import useEffect
import { useAuth } from '@/context/AuthContext'; // Import useAuth

export default function HomePage() {
  const { isLoggedIn, hasPickedPlan } = useAuth(); // Use useAuth hook

  useEffect(() => {
    console.log('User Details on Home Page:');
    console.log('Is Logged In:', isLoggedIn);
    console.log('Has Picked Plan:', hasPickedPlan);
  }, [isLoggedIn, hasPickedPlan]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-4xl font-bold text-gray-800 mb-6">Welcome to Facebook Manager Tool!</h1>
      <p className="text-lg text-gray-600 mb-8">Manage your Facebook pages and posts with ease.</p>
      {!isLoggedIn && ( // Conditionally render the button
        <Link href="/login" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition duration-300 ease-in-out transform hover:scale-105">
          Login to Get Started
        </Link>
      )}
    </div>
  );
}
