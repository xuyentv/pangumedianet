import {readFile, writeFile, mkdir, rename, access, readdir} from 'node:fs/promises';
import {resolve} from 'node:path';

// Optional private local fallback. Prefer setting SERPER_API_KEY in the environment.
// Never commit a real key or expose it in public JSON, HTML, browser code, or logs.
const SERPER_API_KEY = '0710ebee84996e9e65a512de2e89555a1d3146d2';

const root = resolve(import.meta.dirname, '..');
const sourcePath = resolve(root, 'public/data/partnerdata.json');
const outputDir = resolve(root, 'public/data/reviews');
const cacheDir = resolve(root, '.cache/partner-review-research');
const serperKey = process.env.SERPER_API_KEY || SERPER_API_KEY;
const args = process.argv.slice(2);
const has = flag => args.includes(flag);
const value = flag => { const item = args.find(x => x.startsWith(`${flag}=`)); return item?.slice(flag.length + 1); };
const publish = has('--publish');
const cachedOnly = has('--cached-only');
const ids = new Set((value('--ids') || '').split(',').filter(Boolean));
const limit = Math.max(0, Number(value('--limit')) || 0);
const overwriteMedia = has('--overwrite-media');
const generatedAt = new Date().toISOString();

const clean = value => String(value || '').replace(/\s+/g, ' ').trim();
const sentence = value => { const text = clean(value); return text && !/[.!?]$/.test(text) ? `${text}.` : text; };
const categoryOf = partner => {
  const tag = partner.tags?.[0];
  return clean(typeof tag === 'string' ? tag : tag?.name || tag?.label) || 'Business software';
};
const siteUrl = value => !value ? '' : /^https?:\/\//i.test(value) ? value : `https://${value}`;
const eligible = partner => partner.approved === true && partner.archived !== true && partner.test !== true && partner.churned !== true && partner.restrict_marketplace_display !== true && partner.slug && partner.name;
const round = number => Math.round(number * 10) / 10;
const dateOf = partner => {
  const raw = partner.updated_at || partner.created_at;
  if (!raw) return generatedAt.slice(0, 10);
  const date = new Date(Number(raw) < 1e12 ? Number(raw) * 1000 : Number(raw));
  return Number.isNaN(date.valueOf()) ? generatedAt.slice(0, 10) : date.toISOString().slice(0, 10);
};
async function exists(path) { try { await access(path); return true; } catch { return false; } }
const sleep = milliseconds => new Promise(resolvePromise => setTimeout(resolvePromise, milliseconds));
const validImageUrl = value => {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && !/\.svg(?:$|\?)/i.test(url.pathname);
  } catch { return false; }
};
async function atomicJson(path, data) {
  await writeFile(`${path}.tmp`, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  await rename(`${path}.tmp`, path);
}
async function fetchJsonWithRetry(url, options, attempts = 3) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const response = await fetch(url, {signal: AbortSignal.timeout(20000), ...options});
      if (!response.ok) throw new Error(`Serper request failed with HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await sleep(500 * 2 ** (attempt - 1));
    }
  }
  throw lastError;
}
function selectMedia(partner, research) {
  const officialHost = (() => { try { return new URL(siteUrl(partner.website)).hostname.replace(/^www\./, ''); } catch { return ''; } })();
  const blockedText = /(?:favicon|logo|avatar|badge|sprite|placeholder|transparent|tracking)/i;
  const iconAsset = /(?:^|[\/_.-])icon(?:[\/_.-]|$)/i;
  const candidates = (research?.images || [])
    .filter(item => {
      if (!validImageUrl(item.imageUrl)) return false;
      const title = clean(item.title);
      const imageUrl = clean(item.imageUrl);
      return !blockedText.test(`${title} ${imageUrl}`) && !iconAsset.test(new URL(imageUrl).pathname);
    })
    .map(item => {
      const width = Number(item.imageWidth) || 0;
      const height = Number(item.imageHeight) || 0;
      const domain = clean(item.domain).replace(/^www\./, '');
      const official = officialHost && (domain === officialHost || domain.endsWith(`.${officialHost}`));
      const productMatch = clean(item.title).toLowerCase().includes(clean(partner.name).toLowerCase());
      const landscape = width >= height;
      const score = (official ? 100 : 0) + (productMatch ? 30 : 0) + (width >= 800 ? 20 : width >= 400 ? 10 : 0) + (landscape ? 8 : 0);
      return {...item, width, height, score};
    })
    .filter(item => !item.width || !item.height || (item.width >= 320 && item.height >= 180))
    .sort((a, b) => b.score - a.score);
  const unique = [...new Map(candidates.map(item => [item.imageUrl, item])).values()].slice(0, 4);
  if (!unique.length) return undefined;
  const toMedia = (item, index) => ({
    src: item.imageUrl,
    alt: index === 0 ? `${partner.name} product interface or official product visual` : `${partner.name} product visual ${index + 1}`,
    caption: clean(item.title) ? `${clean(item.title)} — source: ${clean(item.domain || item.source)}` : `Image source: ${clean(item.domain || item.source)}`
  });
  return {
    cover: toMedia(unique[0], 0),
    gallery: unique.slice(1).map((item, index) => toMedia(item, index + 1)),
    sourcePages: unique.map(item => item.link).filter(link => /^https?:\/\//i.test(link || ''))
  };
}
async function researchMedia(partner) {
  const cachePath = resolve(cacheDir, `${partner.slug}.images.json`);
  if (await exists(cachePath)) {
    try { return selectMedia(partner, JSON.parse(await readFile(cachePath, 'utf8'))); } catch { /* refresh invalid cache */ }
  }
  if (cachedOnly) return undefined;
  if (!serperKey) return undefined;
  const query = `${partner.name} ${categoryOf(partner)} software product screenshot official`;
  const research = await fetchJsonWithRetry('https://google.serper.dev/images', {
    method: 'POST',
    headers: {'X-API-KEY': serperKey, 'Content-Type': 'application/json'},
    body: JSON.stringify({q: query, num: 10})
  });
  await atomicJson(cachePath, {query, fetchedAt: new Date().toISOString(), images: research.images || []});
  return selectMedia(partner, research);
}
async function priorReview(slug) {
  const path = resolve(outputDir, `${slug}-review.json`);
  if (!await exists(path)) return undefined;
  try { return JSON.parse(await readFile(path, 'utf8')); } catch { return undefined; }
}
function criteria(partner) {
  const description = clean(partner.description_product || partner.description);
  const tags = partner.tags?.length || 0;
  const offers = partner.base_offers?.length || 0;
  const values = [
    ['productClarity', 'Product clarity', Math.min(9.1, 5.1 + Math.min(description.length, 650) / 170), 28, 'How clearly the source material defines the product, its purpose, and expected workflow.'],
    ['audienceFit', 'Audience fit', Math.min(8.9, 5 + Math.min(tags, 8) * .48), 24, 'How specifically the available categories identify likely teams and use cases.'],
    ['buyerAccess', 'Buyer access', partner.website ? 8.4 : 4.2, 18, 'Whether buyers have an official destination where current claims can be checked.'],
    ['buyingDetail', 'Buying detail', Math.min(8.6, 4.8 + Math.min(offers, 7) * .52), 18, 'The depth of structured commercial and offer information available to a buyer.'],
    ['recordConfidence', 'Record confidence', partner.updated_at ? 7.8 : 5.2, 12, 'The presence of dated source metadata and enough context to support an initial evaluation.']
  ];
  return values.map(([key, label, score, weight, summary]) => ({key, label, score: round(score), weight, summary}));
}
function build(partner, previous, researchedMedia) {
  const category = categoryOf(partner);
  const description = sentence(partner.description_product || partner.description) || `${partner.name} is listed as ${category.toLowerCase()} software in the supplied partner dataset.`;
  const website = siteUrl(partner.website);
  const scores = criteria(partner);
  const overall = round(scores.reduce((sum, item) => sum + item.score * item.weight, 0) / 100);
  const updatedAt = dateOf(partner);
  const slug = `${partner.slug}-review`;
  const previousMedia = previous?.media || {};
  const media = {
    ...previousMedia,
    ...((overwriteMedia || !previousMedia.cover?.src) && researchedMedia?.cover ? {cover: researchedMedia.cover} : {}),
    gallery: (overwriteMedia || !previousMedia.gallery?.length) && researchedMedia?.gallery?.length ? researchedMedia.gallery : (previousMedia.gallery || []),
    videoTitle: previousMedia.videoTitle || `${partner.name} product overview`
  };
  return {
    schemaVersion: 2,
    id: String(partner.id),
    slug,
    status: publish ? 'published' : 'draft',
    name: clean(partner.name),
    entityType: 'SoftwareApplication',
    category,
    tagline: `A buyer-focused look at ${partner.name} for teams comparing ${category.toLowerCase()} options`,
    summary: description,
    website,
    brand: {name: clean(partner.name)},
    partner: {id: String(partner.id), slug: partner.slug, source: 'partnerdata.json'},
    publishedAt: previous?.publishedAt || updatedAt,
    updatedAt,
    evidenceLevel: 'Desk research — structured record and official product material',
    methodology: {
      basis: 'Our buyer brief is assembled from the supplied partner record, product positioning, categories, official-site availability, commercial fields, and source timestamps. Each scoring input follows the same published weighting model.',
      limitations: 'This is a desk-research assessment, not a hands-on lab test. Performance, pricing, integrations, security, implementation effort, and support quality should be confirmed with the vendor.'
    },
    media,
    author: {name: 'Pangu Medianet Editorial', slug: 'pangu-medianet-editorial'},
    highlights: [
      description,
      `The source record categorizes ${partner.name} under ${category}.`,
      website ? 'An official product destination is available for current details.' : 'No official destination was available in the supplied record.'
    ],
    ...(website ? {offer: {description: `Review current ${partner.name} product information on the official website.`, url: website}} : {}),
    keywords: {primary: `${partner.name} review`, secondary: [category, `${partner.name} software`, `${partner.name} alternatives`]},
    rating: {value: overall, scale: 10, label: overall >= 8 ? 'Compelling research profile' : overall >= 7 ? 'Promising research profile' : 'Worth further investigation', criteria: scores},
    verdict: `${partner.name} presents a ${overall >= 8 ? 'well-documented' : overall >= 7 ? 'reasonably documented' : 'developing'} option for teams exploring ${category.toLowerCase()}. Its ${overall.toFixed(1)}/10 research score measures the quality of available buying information rather than product performance. Put it on the shortlist when its stated use case matches your needs, then validate pricing, implementation, and must-have capabilities in a live vendor conversation.`,
    pros: [
      description,
      partner.tags?.length ? `The record supplies ${partner.tags.length} category or use-case tag${partner.tags.length === 1 ? '' : 's'}.` : 'The product has a defined software category.',
      website ? 'The record provides an official destination for further verification.' : 'The structured record provides a starting point for evaluation.'
    ],
    cons: [
      'No hands-on testing evidence is included in the supplied dataset.',
      'Current pricing, implementation requirements, and contract terms require vendor confirmation.',
      'Integrations, security controls, and support quality are not independently verified here.'
    ],
    bestFor: [`Teams building an initial shortlist of ${category.toLowerCase()} products`, 'Buyers prepared to verify workflow fit through a demonstration', 'Decision-makers who value clearly documented product positioning'],
    notIdealFor: ['Teams needing independently benchmarked performance results', 'Buyers who require public, verified pricing before a sales conversation', 'Regulated organizations treating this page as a compliance assessment'],
    keyFacts: [{label: 'Market category', value: category}, {label: 'Research method', value: 'Structured desk research'}, {label: 'Hands-on tested', value: 'No — vendor validation recommended'}],
    sections: [
      {heading: `${partner.name} at a glance`, body: description},
      {heading: 'Where it may fit in a shortlist', body: `Based on its positioning under ${category}, ${partner.name} is most relevant during early market discovery. The available record includes ${partner.tags?.length || 0} category signal${partner.tags?.length === 1 ? '' : 's'} and ${partner.base_offers?.length || 0} commercial record${partner.base_offers?.length === 1 ? '' : 's'}, giving buyers a starting point—not a substitute for requirements validation.`},
      {heading: 'Questions to ask before buying', body: `Ask ${partner.name} for a workflow-specific demonstration, itemized pricing, implementation responsibilities, data-processing terms, support response targets, and references from organizations with a similar scale and use case.`},
      {heading: 'Our research perspective', body: `The strongest signal in this assessment is ${scores.slice().sort((a,b) => b.score - a.score)[0].label.toLowerCase()}; the area requiring the most buyer diligence is ${scores.slice().sort((a,b) => a.score - b.score)[0].label.toLowerCase()}. These signals describe documentation quality and should not be read as measured product performance.`}
    ],
    faq: [
      {question: `What is ${partner.name}?`, answer: description},
      {question: `Did Pangu Medianet hands-on test ${partner.name}?`, answer: 'No. This generated assessment is based on the supplied structured partner record and clearly identified vendor information.'},
      {question: `How is the ${partner.name} score calculated?`, answer: 'The research score weights product clarity (28%), audience fit (24%), buyer access (18%), buying detail (18%), and record confidence (12%). It evaluates available buying information, not product performance.'},
      {question: `Who should consider ${partner.name}?`, answer: `Teams comparing ${category.toLowerCase()} options may use this brief as a starting point, then confirm workflow, pricing, implementation, security, and support requirements directly with the vendor.`}
    ],
    images: media.cover ? [media.cover, ...media.gallery] : [...media.gallery],
    sources: [
      {title: `${partner.name} official website`, url: website, type: 'official'},
      {title: 'Supplied partner dataset record', url: '', type: 'dataset'},
      ...(researchedMedia?.sourcePages || []).map((url, index) => ({title: `${partner.name} image source ${index + 1}`, url, type: 'image-source'}))
    ].filter(item => item.url || item.type === 'dataset'),
    generation: {generator: 'generate-partner-reviews.mjs', generatedAt, sourceRecordUpdatedAt: updatedAt}
  };
}

const manifestEntry = review => ({
  slug: review.slug,
  name: review.name,
  category: review.category,
  status: review.status,
  score: review.rating.value,
  excerpt: review.summary,
  updatedAt: review.updatedAt,
  ...(review.media?.cover ? {cover: review.media.cover} : {}),
  file: `/data/reviews/${review.slug}.json`
});

async function manualReviews() {
  const files = (await readdir(outputDir)).filter(file => file.endsWith('.json') && file !== 'index.json');
  const manual = [];
  for (const file of files) {
    try {
      const review = JSON.parse(await readFile(resolve(outputDir, file), 'utf8'));
      if (review?.generation?.generator !== 'manual') continue;
      if (review.schemaVersion !== 2 || !review.slug || !review.name || !review.category || !review.summary || !review.updatedAt || !review.rating || !review.media || !Array.isArray(review.sections)) {
        console.warn(`Skipped invalid manual review: ${file}`);
        continue;
      }
      if (file !== `${review.slug}.json`) {
        console.warn(`Skipped manual review with mismatched filename: ${file} (expected ${review.slug}.json)`);
        continue;
      }
      manual.push(review);
    } catch (error) {
      console.warn(`Skipped unreadable review file ${file}: ${error.message}`);
    }
  }
  return manual;
}

await mkdir(outputDir, {recursive: true});
await mkdir(cacheDir, {recursive: true});
const source = JSON.parse(await readFile(sourcePath, 'utf8'));
let partners = source.data.filter(eligible).sort((a, b) => String(a.slug).localeCompare(String(b.slug)));
if (ids.size) partners = partners.filter(item => ids.has(String(item.id)) || ids.has(item.slug));
if (limit) partners = partners.slice(0, limit);
const reviews = [];
for (const [index, partner] of partners.entries()) {
  const slug = `${partner.slug}-review`;
  const path = resolve(outputDir, `${slug}.json`);
  const previous = await priorReview(partner.slug);
  let researchedMedia;
  if (overwriteMedia || !previous?.media?.cover?.src) {
    try { researchedMedia = await researchMedia(partner); }
    catch (error) { console.warn(`[${index + 1}/${partners.length}] ${partner.slug}: image research failed (${error.message})`); }
  }
  const review = build(partner, previous, researchedMedia);
  await atomicJson(path, review);
  reviews.push(manifestEntry(review));
  console.log(`[${index + 1}/${partners.length}] ${partner.slug}: ${review.media.cover?.src ? 'cover ready' : 'no cover'}`);
}
const manual = await manualReviews();
for (const review of manual) {
  if (reviews.some(item => item.slug === review.slug)) {
    console.warn(`Skipped manual review with generated slug collision: ${review.slug}`);
    continue;
  }
  reviews.push(manifestEntry(review));
}
reviews.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || a.name.localeCompare(b.name));
const manifest = {schemaVersion: 2, generatedAt, reviews};
const manifestPath = resolve(outputDir, 'index.json');
await atomicJson(manifestPath, manifest);
const covers = reviews.filter(review => review.cover?.src).length;
console.log(`Indexed ${reviews.length} reviews: ${reviews.length - manual.length} generated and ${manual.length} manual (${covers} with covers).`);
if (!serperKey && !cachedOnly) console.warn('No Serper key configured; set SERPER_API_KEY or fill the private SERPER_API_KEY constant to research missing images.');
