import {Route, Routes} from 'react-router-dom';
import {Layout} from './components/Layout';
import {HomePage, ReviewsPage, SoftwarePage} from './pages/DirectoryPages';
import {NotFound, ReviewPage} from './pages/ReviewPage';
import {
  AboutPage,
  AffiliateDisclosurePage,
  ContactPage,
  DisclaimerPage,
  EditorialPolicyPage,
  PrivacyPage,
  SearchPage,
  TermsPage
} from './pages/InfoPages';
import type {GeneratedReview} from './types/content';

export function App({initialReview}: {initialReview?: GeneratedReview}) {
  return <Layout><Routes>
    <Route path="/" element={<HomePage/>}/>
    <Route path="/software/" element={<SoftwarePage/>}/>
    <Route path="/reviews/" element={<ReviewsPage/>}/>
    <Route path="/reviews/:slug/" element={<ReviewPage initialReview={initialReview}/>}/>
    <Route path="/about/" element={<AboutPage/>}/>
    <Route path="/contact/" element={<ContactPage/>}/>
    <Route path="/disclaimer/" element={<DisclaimerPage/>}/>
    <Route path="/editorial-policy/" element={<EditorialPolicyPage/>}/>
    <Route path="/affiliate-disclosure/" element={<AffiliateDisclosurePage/>}/>
    <Route path="/privacy-policy/" element={<PrivacyPage/>}/>
    <Route path="/terms/" element={<TermsPage/>}/>
    <Route path="/search/" element={<SearchPage/>}/>
    <Route path="/404/" element={<NotFound/>}/>
    <Route path="*" element={<NotFound/>}/>
  </Routes></Layout>;
}
