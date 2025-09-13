import { Suspense } from 'react';
import FacebookPageContent from '@/components/FacebookPageContent';
import Spinner from '@/components/Spinner';

export default function FacebookPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-full">
        <Spinner />
      </div>
    }>
      <FacebookPageContent />
    </Suspense>
  );
}
