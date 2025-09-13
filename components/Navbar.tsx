'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { FaSun, FaMoon, FaBars, FaTimes } from 'react-icons/fa';

const Navbar = () => {
  const [showPostMenu, setShowPostMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isLoggedIn, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleMobileMenuLinkClick = (e, href) => {
    if (!isLoggedIn && (href.startsWith('/post') || href.startsWith('/account') || href.startsWith('/facebook') || href.startsWith('/settings'))) {
      e.preventDefault();
      router.push('/login');
    }
    setIsMobileMenuOpen(false);
  };

  const renderNavLinks = (isMobile = false) => (
    <>
      <Link href="/" className={isMobile ? "block py-2" : "hover:text-indigo-600 dark:hover:text-indigo-400"} onClick={(e) => isMobile && handleMobileMenuLinkClick(e, "/")}>
        Home
      </Link>
      <Link href="/pricing" className={isMobile ? "block py-2" : "hover:text-indigo-600 dark:hover:text-indigo-400"} onClick={(e) => isMobile && handleMobileMenuLinkClick(e, "/pricing")}>
        Pricing
      </Link>
      <div className={isMobile ? "" : "relative"}>
        <button
          onClick={() => setShowPostMenu(!showPostMenu)}
          className={isMobile ? "block w-full text-left py-2" : "hover:text-indigo-600 dark:hover:text-indigo-400 focus:outline-none"}
        >
          Post
        </button>
        {showPostMenu && (
          <div className={isMobile ? "pl-4" : "absolute left-0 mt-2 w-48 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md shadow-lg py-1 z-10"}>
            <Link href="/post/text" className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600" onClick={(e) => handleMobileMenuLinkClick(e, "/post/text")}>
              Post Text
            </Link>
            <Link href="/post/image" className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600" onClick={(e) => handleMobileMenuLinkClick(e, "/post/image")}>
              Post Image
            </Link>
            <Link href="/post/reel" className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600" onClick={(e) => handleMobileMenuLinkClick(e, "/post/reel")}>
              Post Reel
            </Link>
            <Link href="/post/video" className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600" onClick={(e) => handleMobileMenuLinkClick(e, "/post/video")}>
              Post Video
            </Link>
          </div>
        )}
      </div>
    </>
  );

  return (
    <nav className="bg-gray-50 dark:bg-gray-800 shadow-sm p-4 text-gray-700 dark:text-gray-200">
      <div className="container mx-auto flex justify-between items-center">
        {/* Left Section: Menu (Desktop) */}
        <div className="hidden md:flex items-center space-x-4">
          {renderNavLinks()}
        </div>

        {/* Center Section: Tool Name */}
        <div className="text-xl font-semibold text-indigo-600 dark:text-indigo-400">
          <Link href="/">Facebook Manager</Link>
        </div>

        {/* Right Section: Profile/Login/Register Buttons (Desktop) */}
        <div className="hidden md:flex items-center space-x-4">
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
                  <li><Link href="/account" className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600" onClick={() => setShowProfileMenu(false)}>My Account</Link></li>
                  <li><Link href="/facebook" className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600" onClick={() => setShowProfileMenu(false)}>Facebook</Link></li>
                  <li><Link href="/settings" className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600" onClick={() => setShowProfileMenu(false)}>Settings</Link></li>
                  <li><button onClick={() => { handleLogout(); setShowProfileMenu(false); }} className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600">Logout</button></li>
                </ul>
              )}
            </div>
          ) : (
            <>
              <Link href="/login" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-full">Login</Link>
              <Link href="/register" className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-full">Register</Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center">
          <button onClick={toggleTheme} className="focus:outline-none mr-4">
            {theme === 'light' ? <FaMoon /> : <FaSun />}
          </button>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="focus:outline-none">
            {isMobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden mt-4">
          <div className="flex flex-col space-y-4">
            {renderNavLinks(true)}
            <hr className="border-gray-200 dark:border-gray-700" />
            {isLoggedIn ? (
              <>
                <Link href="/account" className="block py-2" onClick={(e) => handleMobileMenuLinkClick(e, "/account")}>My Account</Link>
                <Link href="/facebook" className="block py-2" onClick={(e) => handleMobileMenuLinkClick(e, "/facebook")}>Facebook</Link>
                <Link href="/settings" className="block py-2" onClick={(e) => handleMobileMenuLinkClick(e, "/settings")}>Settings</Link>
                <button onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }} className="block w-full text-left py-2">Logout</button>
              </>
            ) : (
              <>
                <Link href="/login" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-full text-center" onClick={() => setIsMobileMenuOpen(false)}>Login</Link>
                <Link href="/register" className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-full text-center" onClick={() => setIsMobileMenuOpen(false)}>Register</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;