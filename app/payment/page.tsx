import { Suspense } from 'react';
import PaymentPageContent from '@/components/PaymentPageContent';
import Spinner from '@/components/Spinner';

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-full">
        <Spinner />
      </div>
    }>
      <PaymentPageContent />
    </Suspense>
  );
}
