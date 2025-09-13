'use client';

import React from 'react';

export default function MainContent({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative flex-grow h-full">
      {children}
    </main>
  );
}