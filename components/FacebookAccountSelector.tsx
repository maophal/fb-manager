'use client';

import React from 'react';
import Spinner from './Spinner'; // Adjust path as needed

interface FacebookAccount {
  facebook_user_id: string;
  facebook_user_name: string;
}

interface FacebookAccountSelectorProps {
  allConnectedAccounts: FacebookAccount[];
  selectedFacebookAccountId: string | null;
  onSelectAccount: (accountId: string) => void;
  loading: boolean;
}

const FacebookAccountSelector: React.FC<FacebookAccountSelectorProps> = ({
  allConnectedAccounts,
  selectedFacebookAccountId,
  onSelectAccount,
  loading,
}) => {
  if (loading) {
    return (
      <div className="container mx-auto p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Spinner className="h-10 w-10 text-gray-600" />
          <p className="text-gray-600 mt-2">Loading connected accounts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <label htmlFor="facebookAccountSelect" className="block text-gray-700 text-sm font-bold mb-2">Select Facebook Account:</label>
      <select
        id="facebookAccountSelect"
        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        value={selectedFacebookAccountId || ''}
        onChange={(e) => onSelectAccount(e.target.value)}
        required
      >
        {allConnectedAccounts.map((account) => (
          <option key={account.facebook_user_id} value={account.facebook_user_id}>
            {account.facebook_user_name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default FacebookAccountSelector;