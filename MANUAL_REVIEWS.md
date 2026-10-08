# Publishing additional manual reviews

Pangu Medianet supports multiple schema-v2 review articles for the same product. Generated reviews and manually authored reviews can live together in `public/data/reviews/`.

## Recommended URL strategy

Keep one primary review and give each additional article a unique search-focused slug:

- `800-review` — primary review
- `800-pricing-review` — pricing analysis
- `800-alternatives-review` — alternatives
- `800-features-review` — feature analysis
- `800-vs-openphone-review` — comparison

The JSON filename must exactly match its `slug`:

```text
public/data/reviews/800-pricing-review.json
```

```json
{
  "slug": "800-pricing-review"
}
```

## Create a manual review

1. Copy the product's existing primary review JSON.
2. Rename the copied file to its new unique slug.
3. Keep `schemaVersion` set to `2`.
4. Change `id` to a unique editorial ID, for example `manual-800-pricing-2026`.
5. Change `slug` so it exactly matches the filename.
6. Keep `partner.id` and `partner.slug` unchanged. These fields associate all articles with the same product.
7. Rewrite the title-facing fields and article content so the page serves a distinct search intent.
8. Set the generation marker shown below.
9. Set `status` to `published` only when the article is ready.
10. Run the generator in cached-only mode, then build the site.

## Required manual marker

Every manually maintained review must contain:

```json
"generation": {
  "generator": "manual",
  "generatedAt": "2026-10-08T00:00:00.000Z"
}
```

The generator discovers this marker and preserves the file in `index.json`. It never rewrites the contents of a manual review.

Do not use a generated review's slug for a manual file. A generated slug such as `800-review` is reserved for the generator and a collision will be skipped.

## Fields to rewrite

At minimum, review all of these fields before publishing:

- `id`
- `slug`
- `status`
- `tagline`
- `summary`
- `publishedAt`
- `updatedAt`
- `evidenceLevel`
- `methodology`
- `media`
- `highlights`
- `keywords`
- `rating`
- `verdict`
- `pros`
- `cons`
- `bestFor`
- `notIdealFor`
- `keyFacts`
- `sections`
- `faq`
- `images`
- `sources`
- `generation`

Keep these product association fields unchanged:

```json
"partner": {
  "id": "9511",
  "slug": "800",
  "source": "partnerdata.json"
}
```

## Media and YouTube

Use the existing media schema:

```json
"media": {
  "cover": {
    "src": "https://example.com/cover.jpg",
    "alt": "Descriptive product image alternative text",
    "caption": "Image description and source"
  },
  "gallery": [],
  "youtubeUrl": "https://www.youtube.com/watch?v=VIDEO_ID",
  "videoTitle": "800.com pricing overview"
}
```

The review page automatically embeds supported YouTube URLs.

## Publish commands

After adding or changing manual review JSON:

```bash
npm run reviews:partners -- --publish --cached-only
npm run check
npm run build
```

The first command regenerates generated reviews from cache and merges every valid manual review into `public/data/reviews/index.json`. The production build then prerenders the new route and updates sitemap, feed, and route-manifest artifacts.

## Validation rules

A manual review is indexed only when:

- It is valid JSON.
- `schemaVersion` is `2`.
- `generation.generator` is `manual`.
- Its filename exactly equals `<slug>.json`.
- It has `name`, `category`, `summary`, `updatedAt`, `rating`, and `media`.
- `sections` is an array.
- Its slug does not collide with a generated review.

Invalid manual files are not deleted. The generator prints a warning and leaves them available for correction.
