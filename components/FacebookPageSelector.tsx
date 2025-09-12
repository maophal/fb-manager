'use client';

import React from 'react';
import Image from 'next/image';
import { MdDoneOutline } from 'react-icons/md'; // Import the MdDoneOutline icon

interface FacebookPage {
  id: number; // Database ID of the connected page entry
  page_id: string; // Facebook's ID for the page
  page_name: string;
  page_picture_url?: string; // Optional: URL to the page's profile picture
}

interface FacebookPageSelectorProps {
  availablePages: FacebookPage[];
  selectedPageIds: string[];
  onSelectPages: (pageIds: string[]) => void;
  disabled: boolean;
  publishedPageIds?: string[]; // New prop for pages that have been successfully published to
}

const FacebookPageSelector: React.FC<FacebookPageSelectorProps> = ({
  availablePages,
  selectedPageIds,
  onSelectPages,
  disabled,
  publishedPageIds, // Add this line
}) => {
  const handleSelectAll = () => {
    if (selectedPageIds.length === availablePages.length) {
      onSelectPages([]); // Deselect all
    } else {
      onSelectPages(availablePages.map(page => page.page_id)); // Select all
    }
  };

  const handlePageCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pageId = e.target.value;
    if (e.target.checked) {
      onSelectPages([...selectedPageIds, pageId]);
    } else {
      onSelectPages(selectedPageIds.filter(id => id !== pageId));
    }
  };

  return (
    <div className="mb-4">
      <label className="block text-gray-700 text-sm font-bold mb-2">Select Pages:</label>
      <button
        type="button"
        onClick={handleSelectAll}
        className="mb-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 cursor-pointer"
        disabled={disabled}
      >
        {selectedPageIds.length === availablePages.length ? 'Deselect All Pages' : 'Select All Pages'}
      </button>
      <div className="p-2 rounded-md shadow-inner max-h-60 overflow-y-auto">
        {availablePages.length > 0 ? (
          availablePages.map((page) => (
            <div
              key={page.page_id}
              className="flex items-center justify-between py-2 border-b border-gray-200 last:border-b-0" // Added justify-between and border
            >
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id={`page-${page.page_id}`}
                  value={page.page_id}
                  checked={selectedPageIds.includes(page.page_id)}
                  onChange={handlePageCheckboxChange}
                  className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" // Added some styling for checkbox
                  disabled={disabled}
                />
                {/* Placeholder for page logo - In a real app, you'd fetch this */}
                <Image
                  src={page.page_picture_url || "/file.svg"}
                  alt="Page Logo"
                  width={32}
                  height={32}
                  className="rounded-full mr-2 object-cover"
                />
                <label htmlFor={`page-${page.page_id}`} className="text-gray-800 font-medium cursor-pointer">
                  {page.page_name} <span className="text-sm text-gray-500 ml-1">({page.page_id})</span>
                </label>
              </div>
              {publishedPageIds?.includes(page.page_id) && (
                <MdDoneOutline className="h-6 w-6 text-green-500" />
              )}
            </div>
          ))
        ) : (
          <p className="text-gray-500">No pages available for this account</p>
        )}
      </div>
    </div>
  );
};

export default FacebookPageSelector;