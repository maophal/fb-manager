import React from 'react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white text-center mb-8">
          Terms and Conditions
        </h1>
        <div className="prose prose-lg dark:prose-dark max-w-none text-gray-600 dark:text-gray-300">
          <p className="text-sm text-center text-red-500 dark:text-red-400">_**Disclaimer:** This is a template and not legal advice. Please consult with a legal professional to ensure your Terms and Conditions are compliant with all applicable laws and regulations._</p>

          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mt-10">1. Introduction</h2>
          <p>Welcome to the Facebook Manager Tool ("Service"). These Terms and Conditions ("Terms") govern your use of our service, which is designed to help you manage your Facebook pages more easily. By accessing or using the Service, you agree to be bound by these Terms.</p>

          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mt-10">2. Use of the Service</h2>
          <p>You must be at least 18 years old to use the Service. You are responsible for your account and all activity that occurs under it. You agree to use the Service in compliance with all applicable laws and with the Facebook Platform Policies.</p>

          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mt-10">3. Content and Data</h2>
          <p>Our Service allows you to post content to Facebook. You retain ownership of your content, but you grant us a license to use, store, and process it as necessary to provide the Service. We are not responsible for the content you post. You agree not to post content that is illegal, offensive, or violates the rights of others.</p>

          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mt-10">4. Disclaimers and Limitation of Liability</h2>
          <p>The Service is provided "as is" without any warranties. We do not guarantee that the service will be uninterrupted or error-free. In no event shall our liability exceed the amount you have paid us in the last 12 months.</p>

          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mt-10">5. Termination</h2>
          <p>We may terminate or suspend your access to the Service at any time, without prior notice or liability, for any reason, including if you breach these Terms.</p>

          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mt-10">6. Governing Law</h2>
          <p>These Terms shall be governed by the laws of your jurisdiction, without regard to its conflict of law provisions.</p>

          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mt-10">7. Changes to Terms</h2>
          <p>We reserve the right to modify these terms at any time. We will notify you of any changes by posting the new Terms on this page.</p>
        </div>
      </div>
    </div>
  );
}
