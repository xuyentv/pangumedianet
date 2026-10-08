import {StrictMode} from 'react';
import {createRoot, hydrateRoot} from 'react-dom/client';
import {BrowserRouter} from 'react-router-dom';
import {HelmetProvider} from 'react-helmet-async';
import {App} from './App';
import type {GeneratedReview} from './types/content';
import './styles/index.css';
import './styles/home-reviews.css';
import './styles/home-card-redesign.css';
import './styles/social-channels.css';
import './styles/review-archive.css';
import './styles/reviews.css';
import './styles/review-video.css';
import './styles/info-pages.css';

declare global {
  interface Window { __INITIAL_REVIEW__?: GeneratedReview; }
}

const element = <StrictMode><HelmetProvider><BrowserRouter><App initialReview={window.__INITIAL_REVIEW__}/></BrowserRouter></HelmetProvider></StrictMode>;
const root = document.getElementById('root');
if (!root) throw new Error('Missing application root');
if (root.hasChildNodes()) hydrateRoot(root, element);
else createRoot(root).render(element);
