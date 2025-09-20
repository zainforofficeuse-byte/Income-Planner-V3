import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import PrivacyPolicyPage from './PrivacyPolicyPage';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

// Simple router to handle the privacy policy page separately.
const path = window.location.pathname;

if (path === '/privacy-policy') {
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