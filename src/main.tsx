import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import GithubBackendPreview from './components/GithubBackendPreview.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {(new URLSearchParams(window.location.search).has('github-preview') || ['/quan-tri','/admin-github'].includes(window.location.pathname.replace(/\/$/,''))) ? <GithubBackendPreview/> : <App />}
  </StrictMode>,
);
