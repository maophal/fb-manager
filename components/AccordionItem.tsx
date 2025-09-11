'use client';

import React, { useState } from 'react';
import Spinner from './Spinner'; // Adjust path as needed

interface FacebookPage {
  id: number;
  page_id: string;
  page_name: string;
}

interface AccordionItemProps {
  page: FacebookPage;
  handleDisconnectPage: (pageId: string) => Promise<void>;
  disconnectingPageId: string | null;
}

const AccordionItem: React.FC<AccordionItemProps> = ({ page, handleDisconnectPage, disconnectingPageId }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleAccordion = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="border border-gray-200 rounded-md overflow-hidden">
      <button
        className="flex items-center justify-between w-full p-4 bg-gray-50 hover:bg-gray-100 focus:outline-none"
        onClick={toggleAccordion}
      >
        <span className="text-lg font-medium text-gray-800">{page.page_name}</span>
        <svg
          className={`w-5 h-5 text-gray-500 transform transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </button>
      {isOpen && (
        <div className="p-4 bg-white border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-gray-700">Page ID: {page.page_id}</span>
            <button
              onClick={() => handleDisconnectPage(page.page_id)}
              disabled={disconnectingPageId === page.page_id}
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded-lg transition duration-300 ease-in-out text-sm"
            >
              {disconnectingPageId === page.page_id ? (
                <span className="flex items-center justify-center">
                  <Spinner className="h-4 w-4 text-white" />
                  Disconnecting...
                </span>
              ) : (
                'Disconnect'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccordionItem;