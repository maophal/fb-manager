'use client';

import React, { Suspense } from 'react';
import Spinner from './Spinner';

function PageLoader() {
  return (
    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Spinner className="h-10 w-10 text-white" />
    </div>
  );
}

export default function MainContent({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative flex-grow h-full">
      <Suspense fallback={<PageLoader />}>
        {children}
      </Suspense>
    </main>
  );
}
