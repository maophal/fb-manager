'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function PaymentPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  useEffect(() => {
    const plan = searchParams.get('plan');
    if (plan) {
      setSelectedPlan(plan);
    } else {
      router.push('/pricing');
    }
  }, [searchParams, router]);

  const handleNext = (method: string) => {
    if (!user || !user.id || !selectedPlan) {
      router.push('/login'); // Redirect to login if not logged in or missing info
      return;
    }
    router.push(`/payment/details?plan=${selectedPlan}&method=${method}`);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl flex justify-start mb-4"> {/* Added div for back button */}
        <button
          onClick={() => router.back()} // Back button
          className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out"
        >
          Back
        </button>
      </div>
      <h1 className="text-4xl font-bold text-gray-800 mb-8">Choose Your Payment Method</h1>
      {selectedPlan && (
        <p className="text-xl text-gray-700 mb-6">Selected Plan: <span className="font-semibold">{selectedPlan}</span></p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl">
        {/* KHQR Payment Method */}
        <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col items-center text-center">
          <h2 className="text-2xl font-bold text-gray-700 mb-4">KHQR</h2>
          <p className="text-gray-600 mb-4">Scan the QR code to complete your payment.</p>
          {/* Placeholder for QR Code Image */}
          <div className="w-32 h-32 bg-gray-200 flex items-center justify-center rounded-md mb-4">
            <span className="text-gray-500 text-sm">QR Code Here</span>
          </div>
          <button
            onClick={() => handleNext('khqr')}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out"
          >
            Next
          </button>
        </div>

        {/* Card Payment Method */}
        <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col items-center text-center">
          <h2 className="text-2xl font-bold text-gray-700 mb-4">Card Payment</h2>
          <p className="text-gray-600 mb-4">Pay securely with your credit or debit card.</p>
          {/* Placeholder for Card Form */}
          <div className="w-full bg-gray-200 p-4 rounded-md mb-4">
            <p className="text-gray-500 text-sm">Card input fields will go here (e.g., Card Number, Expiry, CVC)</p>
          </div>
          <button
            onClick={() => handleNext('card')}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out"
          >
            Next
          </button>
        </div>

        {/* Bank Transfer Payment Method */}
        <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col items-center text-center">
          <h2 className="text-2xl font-bold text-gray-700 mb-4">Bank Transfer</h2>
          <p className="text-gray-600 mb-4">Transfer funds directly to our bank account.</p>
          {/* Placeholder for Bank Details */}
          <div className="w-full bg-gray-200 p-4 rounded-md mb-4 text-left">
            <p className="text-gray-700 text-sm">Bank Name: ABC Bank</p>
            <p className="text-gray-700 text-sm">Account Name: Facebook Manager</p>
            <p className="text-gray-700 text-sm">Account Number: 1234567890</p>
            <p className="text-gray-700 text-sm">SWIFT/BIC: ABCDEFGH</p>
          </div>
          <button
            onClick={() => handleNext('bankTransfer')}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}