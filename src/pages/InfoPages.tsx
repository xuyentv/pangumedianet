import {FormEvent, useEffect, useMemo, useState} from 'react';
import {Link, useSearchParams} from 'react-router-dom';
import {Mail, Search as SearchIcon, ShieldCheck} from 'lucide-react';
import {SEO} from '../components/seo/SEO';
import {ReviewCard} from '../components/ReviewCard';
import {PageIntro} from './DirectoryPages';
import {loadManifest, published} from '../data/generatedReviews';
import {SITE} from '../data/content';
import type {ManifestReview} from '../types/content';

const reviewed = 'October 8, 2026';

function InfoPage({title, kicker, description, children}: {title: string; kicker: string; description: string; children: React.ReactNode}) {
  const path = `/${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}/`;
  return <><SEO title={title} description={description} path={path}/><PageIntro kicker={kicker} title={title} text={description}/><article className="prose container">{children}<p className="reviewed">Last reviewed: {reviewed}</p></article></>;
}

export function AboutPage() {
  return <InfoPage title="About" kicker="Our publication" description="Independent software research designed to make buying decisions clearer."><h2>What Pangu Medianet does</h2><p>We organize documented product information into useful, comparable software assessments. Our aim is clarity: what a product says it does, who it may suit, and where the available evidence has limits.</p><h2>How we work</h2><p>Reviews are generated from structured source records and then presented with explicit methodology and evidence labels. We do not describe vendor-provided facts as hands-on findings.</p><div className="callout"><ShieldCheck/><div><strong>Evidence-conscious by design</strong><p>Every review identifies its source basis, limitations, and update date.</p></div></div><h2>Ownership and contact</h2><p>Pangu Medianet is an independent editorial website based in Alberta, Canada. Our contact is {SITE.contactName}. Editorial questions can be sent to <a href={`mailto:${SITE.email}`}>{SITE.email}</a> or discussed by phone at <a href={`tel:${SITE.phone.replace(/[^+\d]/g, '')}`}>{SITE.phone}</a>.</p><p><strong>Mailing address:</strong><br/>{SITE.address}</p></InfoPage>;
}

export function ContactPage() {
  const [sent, setSent] = useState(false);
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setSent(true); };
  return <><SEO title="Contact" description="Contact the Pangu Medianet editorial team with corrections, questions, or feedback." path="/contact/"/><PageIntro kicker="Get in touch" title="Contact" text="Send corrections, source updates, or questions to our editorial desk."/><section className="contact-grid container"><div><Mail size={32}/><h2>Contact information</h2><p><strong>{SITE.contactName}</strong></p><p><a href={`mailto:${SITE.email}`}>{SITE.email}</a><br/><a href={`tel:${SITE.phone.replace(/[^+\d]/g, '')}`}>{SITE.phone}</a></p><address>{SITE.address}</address><p>Include the relevant page URL when submitting a correction. We review credible source updates and clearly identify material revisions.</p></div><form className="contact-form" onSubmit={submit}>{sent?<div className="status" role="status">Your email application is ready. Please send your note directly to {SITE.email}.</div>:<><label>Name<input name="name" required autoComplete="name"/></label><label>Email<input name="email" required type="email" autoComplete="email"/></label><label>Message<textarea name="message" required rows={6}/></label><button className="button" type="submit">Prepare message</button></>}</form></section></>;
}

export function EditorialPolicyPage() {
  return <InfoPage title="Editorial Policy" kicker="Standards" description="How Pangu Medianet sources, structures, scores, updates, and corrects software coverage."><h2>Source hierarchy</h2><p>We prioritize official product websites, supplied structured records, and clearly identified first-party materials. Vendor descriptions are treated as claims, not independently verified performance.</p><h2>Scoring</h2><p>Scores use a deterministic weighted framework based on the completeness and clarity of available product information. They are editorial aids—not laboratory measurements or guarantees of fit.</p><h2>No invented testing</h2><p>We never claim hands-on testing, interviews, customer sentiment, pricing, integrations, security certifications, or performance results unless reliable evidence explicitly supports them.</p><h2>Corrections and updates</h2><p>Material corrections are incorporated into the page and reflected in its modified date. Readers and vendors may submit primary-source corrections through our contact page.</p></InfoPage>;
}

export function AffiliateDisclosurePage() {
  return <InfoPage title="Affiliate Disclosure" kicker="Transparency" description="How commercial links may support Pangu Medianet without controlling editorial conclusions."><h2>Commercial relationships</h2><p>Some links may be affiliate or partner links. Pangu Medianet may receive compensation when a reader visits or purchases through one of these links, at no additional cost to the reader.</p><h2>Editorial separation</h2><p>Compensation does not guarantee coverage, placement, scores, or favorable conclusions. Official destination links are marked with appropriate sponsored and nofollow attributes.</p><h2>Your choice</h2><p>You can always navigate directly to a vendor website instead of using a link on this publication.</p></InfoPage>;
}

export function DisclaimerPage() {
  return <InfoPage title="Disclaimer" kicker="Important information" description="Limits that apply to Pangu Medianet software research and buying guidance."><h2>Informational purpose</h2><p>Content is general information, not legal, financial, security, procurement, or professional advice. Product capabilities, availability, and terms can change.</p><h2>Verify before buying</h2><p>Confirm current features, pricing, contractual terms, compliance, and suitability directly with the vendor before making a decision.</p><h2>No warranty</h2><p>We work to present sources accurately but make no warranty that every item is complete, current, or suitable for a particular purpose.</p></InfoPage>;
}

export function PrivacyPage() {
  return <InfoPage title="Privacy Policy" kicker="Your privacy" description="What information Pangu Medianet handles when you use this static publication."><h2>Minimal collection</h2><p>This website is designed as a static publication and does not require an account. We do not intentionally collect sensitive personal information through the site.</p><h2>Messages</h2><p>If you email us, we receive the information you choose to provide and use it to answer or act on your request.</p><h2>External services</h2><p>External vendor links and optional media embeds have their own privacy practices. YouTube embeds use the privacy-enhanced youtube-nocookie.com domain where applicable.</p><h2>Your choices</h2><p>You may avoid external embeds and links. Contact us at <a href={`mailto:${SITE.email}`}>{SITE.email}</a> about a privacy concern.</p></InfoPage>;
}

export function TermsPage() {
  return <InfoPage title="Terms" kicker="Site terms" description="Terms governing access to and use of Pangu Medianet."><h2>Acceptable use</h2><p>You may browse and link to our public pages. Do not disrupt the service, evade access controls, misrepresent our content, or use it unlawfully.</p><h2>Intellectual property</h2><p>Original editorial text, design, and branding belong to Pangu Medianet or their respective licensors. Product names and trademarks belong to their owners.</p><h2>External destinations</h2><p>We are not responsible for third-party sites, products, offers, or terms. Visiting an external destination is at your discretion.</p><h2>Changes</h2><p>We may update these terms and publication features. Continued use after an update constitutes acceptance of the revised terms.</p></InfoPage>;
}

export function SearchPage() {
  const [params, setParams] = useSearchParams();
  const query = params.get('q') || '';
  const [reviews, setReviews] = useState<ManifestReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => { loadManifest().then(x => setReviews(published(x))).catch(e => setError(String(e))).finally(() => setLoading(false)); }, []);
  const results = useMemo(() => query.trim() ? reviews.filter(r => `${r.name} ${r.category} ${r.excerpt}`.toLowerCase().includes(query.trim().toLowerCase())) : [], [query, reviews]);
  return <><SEO title="Search" description="Search the Pangu Medianet software review library." path="/search/" noindex/><PageIntro kicker="Publication search" title="Search our research" text="Find published reviews by product, category, or topic."/><section className="section container"><form className="search-form" role="search" onSubmit={e => e.preventDefault()}><SearchIcon/><label className="sr-only" htmlFor="site-search">Search reviews</label><input id="site-search" value={query} onChange={e => setParams(e.target.value ? {q: e.target.value} : {})} placeholder="Try “recruiting” or a product name" autoFocus/></form>{loading?<div className="status">Loading search index…</div>:error?<div className="status error">Search is temporarily unavailable.</div>:!query?<div className="status">Enter a product, category, or topic.</div>:results.length?<><p className="result-count">{results.length} matching review{results.length === 1 ? '' : 's'}</p><div className="card-grid">{results.map(r => <ReviewCard key={r.slug} r={r}/>)}</div></>:<div className="status"><h2>No published reviews found</h2><p>Try a broader term or browse the complete archive.</p><Link className="button" to="/reviews/">Browse reviews</Link></div>}</section></>;
}
