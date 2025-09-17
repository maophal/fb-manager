import React from 'react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white text-center mb-8">
          Privacy Policy
        </h1>
        <div className="prose prose-lg dark:prose-dark max-w-none text-gray-600 dark:text-gray-300">
          <p className="text-sm text-center text-red-500 dark:text-red-400">_**Disclaimer:** This is a template and not legal advice. Please consult with a legal professional to ensure your Privacy Policy is compliant with all applicable laws and regulations, including GDPR, CCPA, etc._</p>

          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mt-10">1. Information We Collect</h2>
          <p>We collect information necessary to provide our service. This includes:</p>
          <ul className="list-disc list-inside space-y-2">
            <li>**Account Information:** Your name, email, and password when you register.</li>
            <li>**Facebook Data:** When you connect your Facebook account, we securely store access tokens and retrieve information about the pages you manage (such as page ID and name). We do not store your Facebook password.</li>
            <li>**Content:** Any text, images, videos, or other content you upload to post through our service.</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mt-10">2. How We Use Your Information</h2>
          <p>Your information is used to:</p>
          <ul className="list-disc list-inside space-y-2">
            <li>Provide, maintain, and improve the Service.</li>
            <li>Authenticate you and grant access to your connected Facebook pages.</li>
            <li>Publish content to your Facebook pages on your behalf.</li>
            <li>Communicate with you about your account or our services.</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mt-10">3. Information Sharing</h2>
          <p>We do not sell your personal data. We only share information under the following circumstances:</p>
          <ul className="list-disc list-inside space-y-2">
            <li>**With Facebook:** We share content and instructions with the Facebook API to execute your posts. Our use of the API is subject to Facebook&apos;s policies.</li>
            <li>**For Legal Reasons:** We may disclose information if required by law or to protect our rights.</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mt-10">4. Data Security</h2>
          <p>We take reasonable measures to protect your information. Access tokens are encrypted, and we use secure protocols for data transmission. However, no method of transmission over the Internet is 100% secure.</p>

          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mt-10">5. Your Rights</h2>
          <p>You have the right to access, update, or delete your personal information. You can disconnect your Facebook account from our service at any time through your account settings.</p>

          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mt-10">6. Changes to This Policy</h2>
          <p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page.</p>
        </div>
      </div>
    </div>
  );
}
