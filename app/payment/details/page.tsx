import { Suspense } from 'react';
import PaymentDetailsPageContent from '@/components/PaymentDetailsPageContent';
import Spinner from '@/components/Spinner';

export default function PaymentDetailsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-full">
        <Spinner />
      </div>
    }>
      <PaymentDetailsPageContent />
    </Suspense>
  );
}
