'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext'; // Adjust path as needed

export default function PostLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { isLoggedIn, hasPickedPlan } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/login');
    } else if (!hasPickedPlan) {
      router.push('/pricing');
    }
  }, [isLoggedIn, hasPickedPlan, router]);

  if (!isLoggedIn || !hasPickedPlan) {
    // Optionally render a loading state or null while redirecting
    return null;
  }

  return <>{children}</>;
}