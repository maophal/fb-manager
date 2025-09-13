'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Spinner from '@/components/Spinner';

export default function PostLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { isLoggedIn, hasPickedPlan, isLoading } = useAuth();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isLoading || !isClient) {
      return;
    }

    if (!isLoggedIn) {
      router.push('/login');
    } else if (!hasPickedPlan) {
      router.push('/pricing');
    }
  }, [isLoading, isLoggedIn, hasPickedPlan, router, isClient]);

  if (!isClient) {
    // On the server, render nothing to prevent hydration errors.
    return null;
  }

  if (isLoading || !isLoggedIn || !hasPickedPlan) {
    // On the client, show a spinner while loading or redirecting.
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner />
      </div>
    );
  }

  return <>{children}</>;
}