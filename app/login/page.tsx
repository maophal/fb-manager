'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link'; // Import Link
import { useAuth } from '@/context/AuthContext';
import Spinner from '../../components/Spinner';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false); // New state for copy feedback
  const router = useRouter();
  const { login, hasPickedPlan } = useAuth();

  const handleCopyCredentials = () => {
    const sampleEmail = 'tt@gmail.com';
    const samplePassword = '123456';
    const credentials = `Email: ${sampleEmail}\nPassword: ${samplePassword}`;

    navigator.clipboard.writeText(credentials).then(() => {
      setEmail(sampleEmail); // Set email input
      setPassword(samplePassword); // Set password input
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000); // Reset after 2 seconds
    }).catch(err => {
      console.error('Failed to copy: ', err);
      alert('Failed to copy credentials. Please copy manually.');
    });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Login successful
        login(data.user); // Pass user data to context login function
        router.push('/'); // Always redirect to home page after login
      } else {
        // Login failed
        setError(data.message || 'Login failed.');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'An unexpected error occurred during login.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6">Login</h2>
        {/* Sample User Credentials */}
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded relative mb-4 text-sm">
          <p className="font-bold">Sample User:</p>
          <p>Email: <span className="font-semibold">tt@gmail.com</span></p>
          <p>Password: <span className="font-semibold">123456</span></p>
          <button
            onClick={handleCopyCredentials}
            className="mt-2 bg-blue-200 hover:bg-blue-300 text-blue-800 font-bold py-1 px-3 rounded text-xs"
          >
            {copySuccess ? 'Copied!' : 'Copy Credentials'}
          </button>
        </div>
        {/* End Sample User Credentials */}
        <form onSubmit={handleLogin}>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <Spinner />
                  Logging in...
                </span>
              ) : (
                'Login'
              )}
            </button>
          </div>
          <p className="text-center text-gray-600 text-sm mt-4">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-blue-500 hover:text-blue-800">
              Register
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
