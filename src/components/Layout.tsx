import {useState} from 'react';
import {Link, NavLink} from 'react-router-dom';
import {Menu, Search, X} from 'lucide-react';
import {SITE} from '../data/content';

const links = [
  ['/', 'Home'],
  ['/software/', 'Software'],
  ['/reviews/', 'Reviews'],
  ['/about/', 'About'],
  ['/contact/', 'Contact']
];

function SocialLinks({placement}: {placement: 'header' | 'footer'}) {
  const size = placement === 'header' ? 16 : 20;
  const brandIcon = (path: React.ReactNode) => <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">{path}</svg>;
  const channels = [
    {key: 'facebook', label: 'Facebook', url: SITE.socials.facebook, icon: brandIcon(<path d="M13.5 22v-9h3l.45-3.5H13.5V7.27c0-1.01.28-1.7 1.74-1.7H17.1V2.44c-.32-.04-1.43-.14-2.72-.14-2.69 0-4.53 1.64-4.53 4.66V9.5H6.8V13h3.05v9h3.65Z"/>)},
    {key: 'youtube', label: 'YouTube', url: SITE.socials.youtube, icon: brandIcon(<path d="M23.5 6.2a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.51A3.02 3.02 0 0 0 .5 6.2 31.5 31.5 0 0 0 0 12a31.5 31.5 0 0 0 .5 5.8 3.02 3.02 0 0 0 2.12 2.14c1.88.51 9.38.51 9.38.51s7.5 0 9.38-.51a3.02 3.02 0 0 0 2.12-2.14A31.5 31.5 0 0 0 24 12a31.5 31.5 0 0 0-.5-5.8ZM9.6 15.6V8.4L15.83 12 9.6 15.6Z"/>)},
    {key: 'instagram', label: 'Instagram', url: SITE.socials.instagram, icon: brandIcon(<><path d="M12 2.16c3.2 0 3.58.01 4.85.07 3.26.15 4.78 1.69 4.93 4.93.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.15 3.24-1.67 4.78-4.93 4.93-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-3.27-.15-4.78-1.69-4.93-4.93-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.15-3.24 1.67-4.78 4.93-4.93C8.42 2.17 8.8 2.16 12 2.16ZM12 0C8.74 0 8.33.01 7.05.07 2.7.27.27 2.69.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.2 4.36 2.63 6.78 6.98 6.98C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c4.35-.2 6.78-2.62 6.98-6.98.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95C23.73 2.69 21.3.27 16.95.07 15.67.01 15.26 0 12 0Z"/><path d="M12 5.84A6.16 6.16 0 1 0 12 18.16 6.16 6.16 0 0 0 12 5.84Zm0 10.16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm7.84-10.4a1.44 1.44 0 1 1-2.88 0 1.44 1.44 0 0 1 2.88 0Z"/></>)},
    {key: 'x', label: 'X', url: SITE.socials.x, icon: brandIcon(<path d="M18.9 2h3.68l-8.04 9.19L24 22h-7.4l-5.8-7.58L4.17 22H.48l8.6-9.83L0 2h7.59l5.24 6.93L18.9 2Zm-1.3 18.1h2.04L6.48 3.8H4.3l13.3 16.3Z"/>)}
  ];

  return <div className={`social-links social-links-${placement}`} aria-label={`${SITE.name} social media`}>
    {channels.map(channel => <a
      className={`social-link social-${channel.key}`}
      href={channel.url}
      key={channel.key}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Follow ${SITE.name} on ${channel.label} (opens in a new tab)`}
      title={channel.label}
    >
      <span className="social-icon">{channel.icon}</span>
      {placement === 'footer' && <span>{channel.label}</span>}
    </a>)}
  </div>;
}

export function Layout({children}: {children: React.ReactNode}) {
  const [open, setOpen] = useState(false);

  return <>
    <a className="skip" href="#main">Skip to content</a>
    <header className="header">
      <div className="container nav">
        <Link className="brand" to="/"><span>P</span>{SITE.name}</Link>
        <button className="menu" aria-label="Toggle navigation" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <X/> : <Menu/>}</button>
        <nav aria-label="Primary" className={open ? 'open' : ''}>
          {links.map(([to, name]) => <NavLink key={to} to={to} onClick={() => setOpen(false)}>{name}</NavLink>)}
          <SocialLinks placement="header"/>
          <Link className="header-search" aria-label="Search" to="/search/"><Search size={18}/></Link>
        </nav>
      </div>
    </header>
    <main id="main">{children}</main>
    <footer>
      <div className="container footer-grid">
        <div className="footer-identity">
          <Link className="brand" to="/"><span>P</span>{SITE.name}</Link>
          <p>{SITE.tagline}</p>
          <address><strong>{SITE.contactName}</strong><br/>{SITE.address}<br/><a href={`tel:${SITE.phone.replace(/[^+\d]/g, '')}`}>{SITE.phone}</a></address>
        </div>
        <nav aria-label="Editorial"><b>Editorial</b><Link to="/editorial-policy/">Editorial policy</Link><Link to="/affiliate-disclosure/">Affiliate disclosure</Link><Link to="/disclaimer/">Disclaimer</Link></nav>
        <nav aria-label="Legal"><b>Legal</b><Link to="/privacy-policy/">Privacy policy</Link><Link to="/terms/">Terms</Link><a href={`mailto:${SITE.email}`}>{SITE.email}</a></nav>
        <aside className="footer-social" aria-labelledby="social-heading">
          <span className="social-kicker">Stay connected</span>
          <b id="social-heading">Follow our research</b>
          <p>New reviews, software insights, and transparent buying guidance.</p>
          <SocialLinks placement="footer"/>
        </aside>
      </div>
      <div className="container copyright"><span>© {new Date().getFullYear()} {SITE.name}. Independent editorial research.</span><span className="trust-note"><i aria-hidden="true"/> Evidence-conscious publishing</span></div>
    </footer>
  </>;
}
