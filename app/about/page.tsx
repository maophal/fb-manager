import React from 'react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white text-center mb-8">
          About Our Facebook Manager Tool
        </h1>
        <div className="prose prose-lg dark:prose-dark max-w-none text-gray-600 dark:text-gray-300">
          <p className="lead">
            Welcome to the Facebook Manager Tool, your all-in-one solution for streamlining your Facebook page management. We understand that managing a social media presence can be demanding, which is why we built this tool to make it easier, faster, and more efficient.
          </p>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mt-10">Our Mission</h2>
          <p>
            Our mission is to empower social media managers, small business owners, and content creators by providing a powerful yet user-friendly platform to manage their Facebook presence. We aim to simplify your workflow so you can focus on what truly matters: creating engaging content and connecting with your audience.
          </p>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mt-10">Key Features</h2>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>Multi-Page Management:</strong> Connect multiple Facebook pages and switch between them seamlessly from a single dashboard.</li>
            <li><strong>Versatile Post Creation:</strong> Whether it&apos;s a simple text update, a stunning image, a compelling video, or a trendy Reel, our tool supports all major post formats.</li>
            <li><strong>Intuitive Interface:</strong> A clean and modern interface designed for an effortless user experience.</li>
            <li><strong>Secure Connection:</strong> We use official Facebook APIs and secure authentication to protect your account and data. Your credentials and tokens are handled with the utmost care.</li>
          </ul>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mt-10">Who Is It For?</h2>
          <p>
            This tool is perfect for anyone who manages one or more Facebook pages, including:
          </p>
          <ul className="list-disc list-inside space-y-2">
            <li>Social Media Managers</li>
            <li>Digital Marketing Agencies</li>
            <li>Small to Medium-sized Business Owners</li>
            <li>Content Creators and Influencers</li>
            <li>Non-profits and Community Organizers</li>
          </ul>
          <p className="mt-10 text-center font-semibold">
            Ready to take control of your Facebook management? Get started today!
          </p>
        </div>
      </div>
    </div>
  );
}