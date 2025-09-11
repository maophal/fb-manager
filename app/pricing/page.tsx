'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation'; // Import useRouter
import { useAuth } from '@/context/AuthContext'; // Import useAuth

export default function PricingPage() {
  const router = useRouter();
  const { setHasPickedPlan, user, isLoggedIn, hasPickedPlan } = useAuth();

  const handleChoosePlan = (planName: string) => {
    // Do not update plan_id here. It will be updated after payment.
    console.log(`User chose plan: ${planName}. Redirecting to payment.`);
    router.push(`/payment?plan=${planName}`); // Pass planName as query parameter
  };

  const pricingPlans = [
    {
      name: 'Basic',
      price: 5,
      features: [
        '1 Facebook Page',
        'Basic Posting',
        'Email Support',
        '500 Monthly Posts',
      ],
    },
    {
      name: 'Standard',
      price: 8,
      features: [
        '3 Facebook Pages',
        'Advanced Posting',
        'Priority Email Support',
        '2000 Monthly Posts',
        'Basic Analytics',
      ],
    },
    {
      name: 'Pro',
      price: 10,
      features: [
        '10 Facebook Pages',
        'Scheduled Posting',
        '24/7 Chat Support',
        'Unlimited Monthly Posts',
        'Advanced Analytics',
        'Team Collaboration',
      ],
    },
    {
      name: 'Enterprise',
      price: 12,
      features: [
        'Unlimited Facebook Pages',
        'Custom Integrations',
        'Dedicated Account Manager',
        'Unlimited Monthly Posts',
        'Real-time Analytics',
        'API Access',
        'Custom Reporting',
      ],
    },
  ];

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-4xl font-bold text-center mb-12">Our Pricing Plans</h1>

      {isLoggedIn && hasPickedPlan && user && user.plan_id && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-8 text-center">
          <p className="font-bold">Current Subscription:</p>
          <p className="text-lg">You are currently subscribed to the <span className="font-semibold">{user.plan_id}</span> plan.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {pricingPlans.map((plan, index) => (
          <div
            key={index}
            className={`bg-white rounded-lg shadow-lg p-6 flex flex-col ${
              isLoggedIn && hasPickedPlan && user && user.plan_id === plan.name
                ? 'border-4 border-green-500 ring-4 ring-green-300' // Highlight current plan box
                : ''
            }`}
          >
            <h2 className="text-2xl font-bold text-center mb-4">{plan.name}</h2>
            <div className="text-center mb-6">
              <span className="text-5xl font-extrabold">${plan.price}</span>
              <span className="text-gray-600">/month</span>
            </div>
            <ul className="text-gray-700 mb-8 flex-grow">
              {plan.features.map((feature, featureIndex) => (
                <li key={featureIndex} className="flex items-center mb-2">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleChoosePlan(plan.name)}
              className={`mt-auto font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out text-center ${
                isLoggedIn && hasPickedPlan && user && user.plan_id === plan.name
                  ? 'bg-green-500 hover:bg-green-600 text-white cursor-not-allowed' // Highlight current plan
                  : 'bg-blue-500 hover:bg-blue-700 text-white' // Default styling
              }`}
              disabled={isLoggedIn && hasPickedPlan && user && user.plan_id === plan.name} // Disable current plan button
            >
              {isLoggedIn && hasPickedPlan && user && user.plan_id === plan.name
                ? '✓ Your Current Plan' // Added tick symbol
                : isLoggedIn && hasPickedPlan
                ? 'Upgrade Plan'
                : 'Choose Plan'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}