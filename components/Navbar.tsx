'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { FaSun, FaMoon } from 'react-icons/fa';

const Navbar = () => {
  const [showPostMenu, setShowPostMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false); // Add state for profile menu
  const { isLoggedIn, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  

  const handleLogout = () => {
    logout(); // Use context logout function
    router.push('/login'); // Redirect to login page
  };

  return (
    <nav className="bg-gray-50 dark:bg-gray-800 shadow-sm p-4 text-gray-700 dark:text-gray-200">
      <div className="container mx-auto flex justify-between items-center relative">
        {/* Left Section: Menu */}
        <ul className="flex space-x-4">
          <li>
            <Link href="/" className="hover:text-indigo-600 dark:hover:text-indigo-400">
              Home
            </Link>
          </li>
          <li>
            <Link href="/pricing" className="hover:text-indigo-600 dark:hover:text-indigo-400">
              Pricing
            </Link>
          </li>
          <li className="relative">
            <button
              onClick={() => setShowPostMenu(!showPostMenu)}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 focus:outline-none"
            >
              Post
            </button>
            {showPostMenu && (
              <ul className="absolute left-0 mt-2 w-48 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md shadow-lg py-1 z-10">
                <li>
                  <Link href="/post/text" className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600" onClick={(e) => {
  if (!isLoggedIn) {
    e.preventDefault(); // Prevent default navigation
    router.push('/login'); // Redirect to login page
  }
  setShowPostMenu(false); // Close the menu
}}>
                    Post Text
                  </Link>
                </li>
                <li>
                  <Link href="/post/image" className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600" onClick={(e) => {
  if (!isLoggedIn) {
    e.preventDefault(); // Prevent default navigation
    router.push('/login'); // Redirect to login page
  }
  setShowPostMenu(false); // Close the menu
}}>
                    Post Image
                  </Link>
                </li>
                <li>
                  <Link href="/post/reel" className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600" onClick={(e) => {
  if (!isLoggedIn) {
    e.preventDefault(); // Prevent default navigation
    router.push('/login'); // Redirect to login page
  }
  setShowPostMenu(false); // Close the menu
}}>
                    Post Reel
                  </Link>
                </li>
                <li>
                  <Link href="/post/video" className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600" onClick={(e) => {
  if (!isLoggedIn) {
    e.preventDefault(); // Prevent default navigation
    router.push('/login'); // Redirect to login page
  }
  setShowPostMenu(false); // Close the menu
}}>
                    Post Video
                  </Link>
                </li>
              </ul>
            )}
          </li>
        </ul>

        {/* Center Section: Tool Name */}
        <div className="absolute left-1/2 transform -translate-x-1/2 text-xl font-semibold text-indigo-600 dark:text-indigo-400">
          Facebook Manager
        </div>

        {/* Right Section: Profile/Login/Register Buttons */}
        <div className="flex items-center space-x-4">
          <button onClick={toggleTheme} className="focus:outline-none">
            {theme === 'light' ? <FaMoon /> : <FaSun />}
          </button>
          {isLoggedIn ? (
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-full focus:outline-none"
              >
                Profile
              </button>
              {showProfileMenu && (
                <ul className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md shadow-lg py-1 z-10">
                  <li>
                    <Link href="/account" className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600" onClick={() => setShowProfileMenu(false)}>
                      My Account
                    </Link>
                  </li>
                  <li>
                    <Link href="/facebook" className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600" onClick={() => setShowProfileMenu(false)}>
                      Facebook
                    </Link>
                  </li>
                  <li>
                    <Link href="/settings" className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600" onClick={() => setShowProfileMenu(false)}>
                      Settings
                    </Link>
                  </li>
                  <li>
                    <button
                      onClick={() => {
                        handleLogout();
                        setShowProfileMenu(false);
                      }}
                      className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600"
                    >
                      Logout
                    </button>
                  </li>
                </ul>
              )}
            </div>
          ) : (
            <>
              <Link href="/login" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-full">
                Login
              </Link>
              <Link href="/register" className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-full">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
