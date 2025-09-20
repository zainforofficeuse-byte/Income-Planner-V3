import React from 'react';

const PrivacyPolicyPage: React.FC = () => {

    React.useEffect(() => {
        // Apply dark mode based on localStorage to match the main app's theme
        if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
    }, []);

    return (
        <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="prose prose-lg text-gray-700 dark:text-gray-300">
                    <h1 className="text-gray-900 dark:text-gray-50">Privacy Policy for Income Planner</h1>
                    <p><strong>Last Updated:</strong> {new Date().toLocaleDateString()}</p>
                    <p>This Privacy Policy describes how Income Planner ("we", "us", or "our") handles your information when you use our application.</p>
                    
                    <h2 className="text-gray-900 dark:text-gray-100">1. Data Storage</h2>
                    <p>All financial data you enter (including transactions, categories, and goals) is stored exclusively in your web browser's local storage on your device. We do not have a backend server, and we do not store, see, or have access to any of your financial information.</p>

                    <h2 className="text-gray-900 dark:text-gray-100">2. Google Account Integration (Optional)</h2>
                    <p>You may choose to connect your Google account to enable data synchronization and backup.</p>
                    <ul>
                        <li><strong>Permissions:</strong> We request permissions to access your basic profile information (name, email, profile picture) and to manage files and spreadsheets in your Google Drive.</li>
                        <li><strong>Data Usage:</strong> Your profile information is used only to display your logged-in status within the app. The Google Drive and Sheets permissions are used to create and update a single spreadsheet named "IncomeExpenseAppData" which is stored <em>only in your own Google Drive</em>.</li>
                        <li><strong>No Data Sharing:</strong> We do not share your Google profile information or any of your financial data with any third parties. Your data remains under your control in your personal Google account.</li>
                    </ul>

                    <h2 className="text-gray-900 dark:text-gray-100">3. How to Revoke Access</h2>
                    <p>You can revoke our application's access to your Google Account at any time by visiting the <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">Google Account permissions page</a>. Revoking access will stop all synchronization, but will not delete data already stored on your device or in your Google Sheet.</p>
                
                    <h2 className="text-gray-900 dark:text-gray-100">4. Changes to This Policy</h2>
                     <p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy within the application.</p>
                </div>
                <div className="text-center mt-12">
                    <a href="/" className="text-blue-600 dark:text-blue-400 hover:underline">← Back to Income Planner</a>
                </div>
            </div>
            <style>{`
                .prose a { color: #2563eb; }
                .prose a:hover { text-decoration: underline; }
                .dark .prose a { color: #60a5fa; }
                .dark .prose a:hover { color: #93c5fd; }
            `}</style>
        </div>
    );
};

export default PrivacyPolicyPage;
