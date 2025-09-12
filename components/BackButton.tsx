'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

interface BackButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export default function BackButton({ className, children }: BackButtonProps) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className={`px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition duration-300 cursor-pointer ${className || ''}`}
    >
      {children || '      ← Back'}
    </button>
  );
}
