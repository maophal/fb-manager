'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface ConnectedFacebookAccount {
  facebook_user_id: string;
  facebook_user_name: string;
  pages: {
    id: number;
    page_id: string;
    page_name: string;
  }[];
}

export default function PricingPage() {
  const router = useRouter();
  const { user, isLoggedIn, hasPickedPlan } = useAuth();
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedFacebookAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchConnectedAccounts = async () => {
      if (user?.id) {
        setIsLoading(true);
        try {
          const response = await fetch(`/api/facebook/pages?userId=${user.id}`);
          if (response.ok) {
            const data = await response.json();
            setConnectedAccounts(data.accounts || []);
          } else {
            console.error('Failed to fetch connected accounts');
          }
        } catch (error) {
          console.error('Error fetching connected accounts:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchConnectedAccounts();
  }, [user]);

  const getAccountLimit = (planName: string): number => {
    const plan = pricingPlans.find(p => p.name === planName);
    if (!plan) return 0;

    const feature = plan.features.find(f => f.includes('Facebook Account'));
    if (!feature) return 0;

    if (feature.startsWith('Unlimited')) {
      return Infinity;
    }

    const match = feature.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  };

  const handleChoosePlan = (planName: string) => {
    const currentPlanName = user?.plan_id;
    const newPlan = pricingPlans.find(p => p.name === planName);
    if (!newPlan || !currentPlanName) {
      router.push(`/payment?plan=${planName}`);
      return;
    }

    const currentPlan = pricingPlans.find(p => p.name === currentPlanName);
    if (!currentPlan) {
      router.push(`/payment?plan=${planName}`);
      return;
    }

    const isDowngrade = newPlan.price < currentPlan.price;
    const newAccountLimit = getAccountLimit(planName);

    if (isDowngrade && connectedAccounts.length > newAccountLimit) {
      alert(`You have ${connectedAccounts.length} connected accounts. To downgrade to the ${planName} plan, you must have no more than ${newAccountLimit} connected accounts.`);
      return;
    }

    router.push(`/payment?plan=${planName}`);
  };

  const pricingPlans = [
    {
      name: 'Basic',
      price: 5,
      features: [
        '1 Facebook Account',
        'Basic Posting',
        'Email Support',
        '500 Monthly Posts',
      ],
    },
    {
      name: 'Standard',
      price: 8,
      features: [
        '3 Facebook Accounts',
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
        '10 Facebook Accounts',
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
        'Unlimited Facebook Accounts',
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

      {isLoggedIn && hasPickedPlan && user?.plan_id && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-8 text-center">
          <p className="font-bold">Current Subscription:</p>
          <p className="text-lg">You are currently subscribed to the <span className="font-semibold">{user.plan_id}</span> plan.</p>
        </div>
      )}

      {isLoading && <p className="text-center">Loading your account data...</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {pricingPlans.map((plan, index) => {
          const isCurrentPlan = user?.plan_id === plan.name;
          const currentPlan = pricingPlans.find(p => p.name === user?.plan_id);
          const isDowngrade = currentPlan ? plan.price < currentPlan.price : false;
          const accountLimit = getAccountLimit(plan.name);
          const canDowngrade = isDowngrade && connectedAccounts.length > accountLimit;

          const buttonText = () => {
            if (isCurrentPlan) return '✓ Your Current Plan';
            if (canDowngrade) return 'Downgrade Not Available';
            if (isLoggedIn && hasPickedPlan) return isDowngrade ? 'Downgrade Plan' : 'Upgrade Plan';
            return 'Choose Plan';
          };

          return (
            <div
              key={index}
              className={`bg-white rounded-lg shadow-lg p-6 flex flex-col ${
                isCurrentPlan ? 'border-4 border-green-500 ring-4 ring-green-300' : ''
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
                  isCurrentPlan
                    ? 'bg-green-500 hover:bg-green-600 text-white cursor-not-allowed'
                    : canDowngrade
                    ? 'bg-red-500 text-white cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-700 text-white'
                }`}
                disabled={isCurrentPlan || canDowngrade}
              >
                {buttonText()}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
