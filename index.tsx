import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import PrivacyPolicyPage from './PrivacyPolicyPage';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

// Simple router based on pathname to ensure the privacy policy has a public URL
const path = window.location.pathname;

if (path === '/privacy-policy.html' || path === '/privacy-policy') {
    root.render(
        <React.StrictMode>
            <PrivacyPolicyPage />
        </React.StrictMode>
    );
} else {
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
}
