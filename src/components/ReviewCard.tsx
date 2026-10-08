import{ArrowUpRight,Star}from'lucide-react';import{Link}from'react-router-dom';import type{ManifestReview}from'../types/content';

export function ReviewCard({r}:{r:ManifestReview}){
  const href=`/reviews/${r.slug}/`;
  return <article className="review-card">
    <Link className="review-cover" to={href} aria-label={`Read the ${r.name} review`}>
      {r.cover?.src?<img loading="lazy" src={r.cover.src} alt={r.cover.alt}/>:<span className="review-initials" aria-hidden="true">{r.name.split(/\s+/).slice(0,2).map(x=>x[0]).join('')}</span>}
      <span className="review-score"><Star size={13} fill="currentColor" aria-hidden="true"/>{r.score.toFixed(1)}</span>
    </Link>
    <div className="review-card-body">
      <div className="review-meta"><span>{r.category}</span><time dateTime={r.updatedAt}>{new Date(r.updatedAt).toLocaleDateString('en-US',{month:'short',year:'numeric'})}</time></div>
      <h3><Link to={href}>{r.name}<span className="sr-only"> review</span></Link></h3>
      <p>{r.excerpt}</p>
      <Link className="review-card-link" to={href}>View full review <ArrowUpRight size={16} aria-hidden="true"/></Link>
    </div>
  </article>
}