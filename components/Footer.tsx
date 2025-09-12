'use client';

import { FaFacebook, FaTwitter, FaInstagram } from 'react-icons/fa';
import { useTheme } from '@/context/ThemeContext';

export default function Footer() {
  const { theme } = useTheme();

  return (
    <footer className={`p-8 mt-12 ${theme === 'light' ? 'bg-gray-100 text-gray-600' : 'bg-gray-800 text-gray-300'}`}>
      <div className="container mx-auto text-center">
        <div className="flex justify-center space-x-6 mb-4">
          <a href="#" className="hover:text-indigo-500"><FaFacebook size={24} /></a>
          <a href="#" className="hover:text-blue-400"><FaTwitter size={24} /></a>
          <a href="#" className="hover:text-pink-500"><FaInstagram size={24} /></a>
        </div>
        <p>&copy; {new Date().getFullYear()} Facebook Manager Tool. All rights reserved.</p>
      </div>
    </footer>
  );
}