'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Spinner from './Spinner'; // Adjust path as needed

export default function PaymentDetailsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, setHasPickedPlan } = useAuth();

  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const plan = searchParams.get('plan');
    const method = searchParams.get('method');

    if (plan && method) {
      setSelectedPlan(plan);
      setPaymentMethod(method);
    } else {
      // Redirect to payment selection if details are missing
      router.push('/payment');
    }
  }, [searchParams, router]);

  const handlePaymentConfirmation = async () => {
    if (!user || !user.id || !selectedPlan || !paymentMethod) {
      setErrorMessage('Missing user details, selected plan, or payment method.');
      return;
    }

    setPaymentStatus('processing');
    setErrorMessage(null);

    try {
      // Call simulated Bakong payment API
      const response = await fetch('/api/payment/bakong', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id, planId: selectedPlan }),
      });

      if (response.ok) {
        setPaymentStatus('success');
        setHasPickedPlan(selectedPlan); // Update context and localStorage with actual planId
        router.push('/'); // Redirect to home page after successful payment
      } else {
        const errorData = await response.json();
        setPaymentStatus('error');
        setErrorMessage(errorData.message || 'Payment confirmation failed.');
      }
    } catch (error) {
      console.error('Payment confirmation error:', error);
      setPaymentStatus('error');
      setErrorMessage('An unexpected error occurred during payment confirmation.');
    }
  };

  const renderPaymentDetails = () => {
    switch (paymentMethod) {
      case 'khqr':
        return (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-700 mb-4">KHQR Payment Details</h2>
            <p className="text-gray-600 mb-4">Scan the QR code below to complete your payment for the <span className="font-semibold">{selectedPlan}</span> plan.</p>
            {/* Placeholder for QR Code Image */}
            <div className="w-48 h-48 bg-gray-200 flex items-center justify-center rounded-md mx-auto mb-6">
              <span className="text-gray-500 text-sm">Actual KHQR Code Here</span>
            </div>
            <p className="text-gray-700 text-sm">Amount: $XX.XX</p> {/* Placeholder for amount */}
          </div>
        );
      case 'card':
        return (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-700 mb-4">Card Payment Details</h2>
            <p className="text-gray-600 mb-4">Enter your card details for the <span className="font-semibold">{selectedPlan}</span> plan.</p>
            {/* Placeholder for Card Form */}
            <div className="w-full bg-gray-200 p-4 rounded-md mb-4">
              <p className="text-gray-500 text-sm">Card Number: **** **** **** ****</p>
              <p className="text-gray-500 text-sm">Expiry Date: MM/YY</p>
              <p className="text-gray-500 text-sm">CVC: ***</p>
            </div>
          </div>
        );
      case 'bankTransfer':
        return (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-700 mb-4">Bank Transfer Details</h2>
            <p className="text-gray-600 mb-4">Transfer funds directly to our bank account for the <span className="font-semibold">{selectedPlan}</span> plan.</p>
            {/* Placeholder for Bank Details */}
            <div className="w-full bg-gray-200 p-4 rounded-md mb-4 text-left mx-auto">
              <p className="text-gray-700 text-sm">Bank Name: ABC Bank</p>
              <p className="text-gray-700 text-sm">Account Name: Facebook Manager</p>
              <p className="text-gray-700 text-sm">Account Number: 1234567890</p>
              <p className="text-gray-700 text-sm">SWIFT/BIC: ABCDEFGH</p>
            </div>
          </div>
        );
      default:
        return <p className="text-red-500">Invalid payment method selected.</p>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold text-gray-800 mb-8">Payment Confirmation</h1>

      {paymentStatus === 'processing' && (
        <p className="text-blue-600 mb-4">Processing your payment...</p>
      )}
      {paymentStatus === 'success' && (
        <p className="text-green-600 mb-4">Payment successful! Redirecting...</p>
      )}
      {paymentStatus === 'error' && (
        <p className="text-red-600 mb-4">Error: {errorMessage}</p>
      )}

      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        {renderPaymentDetails()}

        <div className="flex justify-between mt-8"> {/* Added div for buttons */}
          <button
            onClick={() => router.back()} // Back button
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out"
          >
            Back
          </button>

          <button
            onClick={handlePaymentConfirmation}
            disabled={paymentStatus === 'processing'}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out"
          >
            {paymentStatus === 'processing' ? (
              <span className="flex items-center justify-center">
                <Spinner className="h-5 w-5 text-white" />
                Confirming Payment...
              </span>
            ) : (
              'Confirm Payment'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
