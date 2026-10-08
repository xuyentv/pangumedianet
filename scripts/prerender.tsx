import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import React from 'react';
import {renderToString} from 'react-dom/server';
import {StaticRouter} from 'react-router-dom';
import {HelmetProvider} from 'react-helmet-async';
import {App} from '../src/App';
import {SITE, STATIC_ROUTES} from '../src/data/content';
import type {GeneratedReview, ReviewManifest} from '../src/types/content';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(root, 'dist');
const dataDir = resolve(root, 'public/data/reviews');
const template = await readFile(resolve(dist, 'index.html'), 'utf8');
const manifest = JSON.parse(await readFile(resolve(dataDir, 'index.json'), 'utf8')) as ReviewManifest;
const reviews = manifest.reviews.filter(item => item.status === 'published');
const reviewRoutes = reviews.map(item => `/reviews/${item.slug}/`);
const routes = [...STATIC_ROUTES, ...reviewRoutes];
const outputPath = (route: string) => route === '/' ? resolve(dist, 'index.html') : resolve(dist, route.slice(1), 'index.html');
const escapeScript = (value: unknown) => JSON.stringify(value).replace(/</g, '\\u003c').replace(/-->/g, '--\\>');

for (const route of routes) {
  let initialReview: GeneratedReview | undefined;
  if (route.startsWith('/reviews/') && route !== '/reviews/') {
    const slug = route.split('/').filter(Boolean).at(-1)!;
    initialReview = JSON.parse(await readFile(resolve(dataDir, `${slug}.json`), 'utf8')) as GeneratedReview;
  }
  const helmetContext: Record<string, any> = {};
  const body = renderToString(<HelmetProvider context={helmetContext}><StaticRouter location={route}><App initialReview={initialReview}/></StaticRouter></HelmetProvider>);
  const helmet = helmetContext.helmet;
  const head = [helmet?.title?.toString(), helmet?.meta?.toString(), helmet?.link?.toString(), helmet?.script?.toString()].filter(Boolean).join('\n');
  const state = initialReview ? `<script>window.__INITIAL_REVIEW__=${escapeScript(initialReview)}</script>` : '';
  const html = template
    .replace(/<title>.*?<\/title>/, '')
    .replace('</head>', `${head}\n</head>`)
    .replace('<div id="root"></div>', `<div id="root">${body}</div>${state}`);
  const path = outputPath(route);
  await mkdir(dirname(path), {recursive: true});
  await writeFile(path, html, 'utf8');
}

const indexableRoutes = routes.filter(route => route !== '/search/' && route !== '/404/');
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${indexableRoutes.map(route => `  <url><loc>${SITE.url}${route}</loc></url>`).join('\n')}\n</urlset>\n`;
await writeFile(resolve(dist, 'sitemap.xml'), sitemap, 'utf8');
await writeFile(resolve(dist, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE.url}/sitemap.xml\n`, 'utf8');
const feedItems = reviews.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 30).map(item => `  <entry><title>${xml(item.name)} review</title><id>${SITE.url}/reviews/${item.slug}/</id><link href="${SITE.url}/reviews/${item.slug}/"/><updated>${new Date(item.updatedAt).toISOString()}</updated><summary>${xml(item.excerpt)}</summary></entry>`).join('\n');
const feed = `<?xml version="1.0" encoding="utf-8"?>\n<feed xmlns="http://www.w3.org/2005/Atom"><title>${SITE.name}</title><id>${SITE.url}/</id><link href="${SITE.url}/feed.xml" rel="self"/><updated>${manifest.generatedAt}</updated>\n${feedItems}\n</feed>\n`;
await writeFile(resolve(dist, 'feed.xml'), feed, 'utf8');
await writeFile(resolve(dist, 'route-manifest.json'), `${JSON.stringify({generatedAt: new Date().toISOString(), routes}, null, 2)}\n`, 'utf8');
console.log(`Prerendered ${routes.length} routes (${reviews.length} reviews).`);

function xml(value: string) {
  const amp = String.fromCharCode(38);
  return value.replace(/[<>&'"]/g, character => {
    if (character === '<') return amp + 'lt;';
    if (character === '>') return amp + 'gt;';
    if (character === '&') return amp + 'amp;';
    if (character.charCodeAt(0) === 39) return amp + 'apos;';
    return amp + 'quot;';
  });
}
