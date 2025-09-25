import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

// The main app is always rendered. 
// The privacy policy is now a separate static HTML file.
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
