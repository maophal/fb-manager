'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const Navbar = () => {
  const [showPostMenu, setShowPostMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false); // Add state for profile menu
  const { isLoggedIn, logout } = useAuth();
  const router = useRouter();

  

  const handleLogout = () => {
    logout(); // Use context logout function
    router.push('/login'); // Redirect to login page
  };

  return (
    <nav className="bg-gray-800 p-4 text-white">
      <div className="container mx-auto flex justify-between items-center relative">
        {/* Left Section: Menu */}
        <ul className="flex space-x-4">
          <li>
            <Link href="/" className="hover:text-gray-300">
              Home
            </Link>
          </li>
          <li>
            <Link href="/pricing" className="hover:text-gray-300">
              Pricing
            </Link>
          </li>
          <li className="relative">
            <button
              onClick={() => setShowPostMenu(!showPostMenu)}
              className="hover:text-gray-300 focus:outline-none"
            >
              Post
            </button>
            {showPostMenu && (
              <ul className="absolute left-0 mt-2 w-48 bg-white text-gray-800 rounded-md shadow-lg py-1 z-10">
                <li>
                  <Link href="/post/text" className="block px-4 py-2 hover:bg-gray-100" onClick={(e) => {
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
                  <Link href="/post/image" className="block px-4 py-2 hover:bg-gray-100" onClick={(e) => {
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
                  <Link href="/post/reel" className="block px-4 py-2 hover:bg-gray-100" onClick={(e) => {
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
                  <Link href="/post/video" className="block px-4 py-2 hover:bg-gray-100" onClick={(e) => {
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
        <div className="absolute left-1/2 transform -translate-x-1/2 text-lg font-bold">
          Facebook Manager
        </div>

        {/* Right Section: Profile/Login/Register Buttons */}
        <div className="flex items-center space-x-4">
          {isLoggedIn ? (
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none"
              >
                Profile
              </button>
              {showProfileMenu && (
                <ul className="absolute right-0 mt-2 w-48 bg-white text-gray-800 rounded-md shadow-lg py-1 z-10">
                  <li>
                    <Link href="/account" className="block px-4 py-2 hover:bg-gray-100" onClick={() => setShowProfileMenu(false)}>
                      My Account
                    </Link>
                  </li>
                  <li>
                    <Link href="/facebook" className="block px-4 py-2 hover:bg-gray-100" onClick={() => setShowProfileMenu(false)}>
                      Facebook
                    </Link>
                  </li>
                  <li>
                    <Link href="/settings" className="block px-4 py-2 hover:bg-gray-100" onClick={() => setShowProfileMenu(false)}>
                      Settings
                    </Link>
                  </li>
                  <li>
                    <button
                      onClick={() => {
                        handleLogout();
                        setShowProfileMenu(false);
                      }}
                      className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </li>
                </ul>
              )}
            </div>
          ) : (
            <>
              <Link href="/login" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                Login
              </Link>
              <Link href="/register" className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
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
