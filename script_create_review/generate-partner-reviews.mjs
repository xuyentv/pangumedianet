import {readFile, writeFile, mkdir, rename, access} from 'node:fs/promises';
import {resolve} from 'node:path';

const root = resolve(import.meta.dirname, '..');
const sourcePath = resolve(root, 'partnerdata.json');
const outputDir = resolve(root, 'public/data/reviews');
const args = process.argv.slice(2);
const has = flag => args.includes(flag);
const value = flag => { const item = args.find(x => x.startsWith(`${flag}=`)); return item?.slice(flag.length + 1); };
const publish = has('--publish');
const cachedOnly = has('--cached-only');
const ids = new Set((value('--ids') || '').split(',').filter(Boolean));
const limit = Math.max(0, Number(value('--limit')) || 0);
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
    ['information', 'Information clarity', Math.min(9, 5.4 + Math.min(description.length, 500) / 180), 30, 'Measures how clearly the available source record explains the product.'],
    ['positioning', 'Use-case positioning', Math.min(8.8, 5.2 + Math.min(tags, 8) * .4), 25, 'Reflects the specificity of the categories and use cases in the supplied record.'],
    ['access', 'Product access', partner.website ? 8 : 4.5, 20, 'Reflects whether an official product destination is available for verification.'],
    ['commercial', 'Commercial detail', Math.min(8.5, 5 + Math.min(offers, 7) * .45), 15, 'Reflects the amount of structured offer information available in the source data.'],
    ['freshness', 'Record freshness', partner.updated_at ? 7.5 : 5.5, 10, 'Reflects whether the source record provides an update timestamp.']
  ];
  return values.map(([key, label, score, weight, summary]) => ({key, label, score: round(score), weight, summary}));
}
function build(partner, previous) {
  const category = categoryOf(partner);
  const description = sentence(partner.description_product || partner.description) || `${partner.name} is listed as ${category.toLowerCase()} software in the supplied partner dataset.`;
  const website = siteUrl(partner.website);
  const scores = criteria(partner);
  const overall = round(scores.reduce((sum, item) => sum + item.score * item.weight, 0) / 100);
  const updatedAt = dateOf(partner);
  const slug = `${partner.slug}-review`;
  const media = previous?.media || {gallery: [], videoTitle: `${partner.name} product overview`};
  media.gallery ||= [];
  media.videoTitle ||= `${partner.name} product overview`;
  return {
    schemaVersion: 2,
    id: String(partner.id),
    slug,
    status: publish ? 'published' : 'draft',
    name: clean(partner.name),
    entityType: 'SoftwareApplication',
    category,
    tagline: `${partner.name} assessment for ${category.toLowerCase()} buyers`,
    summary: description,
    website,
    brand: {name: clean(partner.name)},
    partner: {id: String(partner.id), slug: partner.slug, source: 'partnerdata.json'},
    publishedAt: previous?.publishedAt || updatedAt,
    updatedAt,
    evidenceLevel: 'Vendor and structured dataset information',
    methodology: {
      basis: 'This assessment is generated deterministically from the supplied partner record, including its descriptions, categories, website availability, offer count, and timestamps.',
      limitations: 'Pangu Medianet has not independently verified performance, pricing, integrations, security, customer sentiment, or hands-on usability for this generated assessment.'
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
    rating: {value: overall, scale: 10, label: overall >= 8 ? 'Strong documented profile' : overall >= 7 ? 'Solid documented profile' : 'Developing documented profile', criteria: scores},
    verdict: `${description} The ${overall.toFixed(1)}/10 editorial score reflects the completeness and clarity of the supplied record—not independent product testing. Buyers should confirm current capabilities, terms, and fit directly with the vendor.`,
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
    bestFor: [`Teams researching ${category.toLowerCase()} options`, 'Buyers who will validate requirements directly with the vendor'],
    notIdealFor: ['Buyers seeking independently benchmarked performance data', 'Teams requiring verified pricing or compliance conclusions from this page alone'],
    keyFacts: [{label: 'Category', value: category}, {label: 'Evidence basis', value: 'Structured partner record'}, {label: 'Independent hands-on test', value: 'Not performed'}],
    sections: [
      {heading: `What is ${partner.name}?`, body: description},
      {heading: 'Available product evidence', body: `This review uses the supplied record's product description, ${partner.tags?.length || 0} tags, ${partner.base_offers?.length || 0} structured offers, website field, and update metadata. Vendor-originated information is treated as product positioning rather than independent proof.`},
      {heading: 'Evaluation guidance', body: `Shortlist ${partner.name} only after mapping your requirements to a current demonstration, written pricing, implementation scope, data handling terms, support commitments, and references relevant to your organization.`}
    ],
    faq: [
      {question: `What is ${partner.name}?`, answer: description},
      {question: `Did Pangu Medianet hands-on test ${partner.name}?`, answer: 'No. This generated assessment is based on the supplied structured partner record and clearly identified vendor information.'},
      {question: `How is the ${partner.name} score calculated?`, answer: 'The score deterministically weights information clarity, use-case positioning, product access, commercial detail, and record freshness. It is not a performance benchmark.'}
    ],
    images: media.cover ? [media.cover, ...media.gallery] : [...media.gallery],
    sources: [{title: `${partner.name} official website`, url: website, type: 'official'}, {title: 'Supplied partner dataset record', url: '', type: 'dataset'}].filter(item => item.url || item.type === 'dataset'),
    generation: {generator: 'generate-partner-reviews.mjs', generatedAt, sourceRecordUpdatedAt: updatedAt}
  };
}

await mkdir(outputDir, {recursive: true});
const source = JSON.parse(await readFile(sourcePath, 'utf8'));
let partners = source.data.filter(eligible).sort((a, b) => String(a.slug).localeCompare(String(b.slug)));
if (ids.size) partners = partners.filter(item => ids.has(String(item.id)) || ids.has(item.slug));
if (limit) partners = partners.slice(0, limit);
const reviews = [];
for (const partner of partners) {
  const slug = `${partner.slug}-review`;
  const path = resolve(outputDir, `${slug}.json`);
  if (cachedOnly && !await exists(path)) continue;
  const previous = await priorReview(partner.slug);
  const review = build(partner, previous);
  await writeFile(`${path}.tmp`, `${JSON.stringify(review, null, 2)}\n`, 'utf8');
  await rename(`${path}.tmp`, path);
  reviews.push({slug, name: review.name, category: review.category, status: review.status, score: review.rating.value, excerpt: review.summary, updatedAt: review.updatedAt, ...(review.media.cover ? {cover: review.media.cover} : {}), file: `/data/reviews/${slug}.json`});
}
const manifest = {schemaVersion: 2, generatedAt, reviews};
const manifestPath = resolve(outputDir, 'index.json');
await writeFile(`${manifestPath}.tmp`, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
await rename(`${manifestPath}.tmp`, manifestPath);
console.log(`Generated ${reviews.length} ${publish ? 'published' : 'draft'} reviews.`);
