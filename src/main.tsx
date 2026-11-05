import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
// All sign-in (including Admin) now starts in the existing homepage.
import './index.css';

// Old /quan-tri links used to open a disconnected GitHub console.
// Bring those visitors to the same homepage authentication entry point.
if (['/quan-tri','/admin-github'].includes(window.location.pathname.replace(/\/$/,''))) {
  window.history.replaceState(null,'','/');
}
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
