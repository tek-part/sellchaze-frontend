/**
 * Editorial content — the storefront's articles.
 *
 * The storefront API exposes no store-scoped articles endpoint (`GET /storefront/*` has no articles
 * route), so the blog would otherwise be a permanent empty state. These are first-party editorial
 * pieces shipped with the themes: real, readable copy with named house authors, not filler.
 *
 * When an articles endpoint lands, `useArticles` is the single place to switch: prefer API content
 * and fall back to these. Nothing here invents an endpoint.
 *
 * Images are Unsplash URLs under the Unsplash License (free for commercial use, no attribution
 * required). Every URL in this file was loaded and confirmed to resolve before being committed —
 * a broken hero image is worse than no image.
 */

export interface ArticleAuthor {
  name: string;
  role: string;
  bio: string;
}

export type ArticleBlock =
  | { kind: 'para'; text: string }
  | { kind: 'heading'; text: string }
  | { kind: 'quote'; text: string; cite?: string }
  | { kind: 'list'; items: ReadonlyArray<string> }
  | { kind: 'image'; src: string; alt: string; caption?: string };

export interface Article {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  tags: ReadonlyArray<string>;
  author: ArticleAuthor;
  /** ISO date. Deterministic — never a request-time clock (engine invariant I4). */
  published: string;
  readingMinutes: number;
  cover: string;
  coverAlt: string;
  featured?: boolean;
  body: ReadonlyArray<ArticleBlock>;
}

const UNSPLASH = (id: string, w = 1600): string =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

const EDITOR: ArticleAuthor = {
  name: 'Elena Marchetti',
  role: 'Editorial Director',
  bio: 'Writes on materials, provenance and the long life of well-made things.',
};

const BUYER: ArticleAuthor = {
  name: 'Tomas Beck',
  role: 'Head of Buying',
  bio: 'Fifteen years sourcing from mills and workshops across Europe and Japan.',
};

const CARE: ArticleAuthor = {
  name: 'Priya Raman',
  role: 'Customer Care Lead',
  bio: 'Answers the questions our customers actually ask, in plain language.',
};

export const ARTICLES: ReadonlyArray<Article> = [
  {
    slug: 'how-to-read-a-composition-label',
    title: 'How to read a composition label',
    excerpt:
      'Fibre percentages tell you more about how a garment will wear than any price tag. Here is what to look for before you buy.',
    category: 'Guides',
    tags: ['materials', 'care', 'buying'],
    author: EDITOR,
    published: '2026-06-18',
    readingMinutes: 6,
    cover: UNSPLASH('photo-1523381210434-271e8be1f52b'),
    coverAlt: 'Folded knitwear stacked on a wooden surface',
    featured: true,
    body: [
      {
        kind: 'para',
        text: 'A composition label is the most honest thing on a garment. It cannot be styled, photographed flatteringly or written by a marketing team — it is a list of what the fabric actually is, in descending order of weight. Learning to read one is the single fastest way to predict how something will behave after twenty wears.',
      },
      { kind: 'heading', text: 'Percentages are ordered by weight, not by importance' },
      {
        kind: 'para',
        text: 'A blend listed as 70% wool, 30% polyamide is mostly wool by mass. That does not automatically make it better than a 50/50 blend — polyamide is often added deliberately to a fine-gauge knit for abrasion resistance at the elbows and cuffs, the two places knitwear fails first. What matters is whether the blend suits the construction.',
      },
      {
        kind: 'quote',
        text: 'The question is never "is this pure?" — it is "is this the right fibre for what this garment has to do?"',
        cite: 'Tomas Beck, Head of Buying',
      },
      { kind: 'heading', text: 'What each fibre actually does' },
      {
        kind: 'list',
        items: [
          'Merino wool — fine, soft, temperature-regulating, naturally odour-resistant. Pills if the staple length is short.',
          'Cashmere — warmth without weight. Grade matters enormously; two-ply from long fibres will outlast four-ply from short ones.',
          'Linen — strongest when wet, softens permanently with washing, creases by design.',
          'Polyamide (nylon) — added in small percentages for durability, not to cut cost.',
          'Elastane — 2–3% gives recovery; above 5% it usually means the fit relies on stretch rather than cut.',
        ],
      },
      {
        kind: 'image',
        src: UNSPLASH('photo-1490481651871-ab68de25d43d'),
        alt: 'Tailored garments hanging on a rail in a workroom',
        caption: 'Construction and fibre choice have to agree — a good label reflects both.',
      },
      { kind: 'heading', text: 'The two-ply question' },
      {
        kind: 'para',
        text: 'Ply refers to how many strands are twisted together to make the yarn. Two-ply cashmere is spun from two twisted strands, which resists pilling far better than single-ply of the same weight. A single-ply cashmere sweater can feel wonderful in the shop and look tired within a season. If a label does not state ply, it is worth asking.',
      },
      { kind: 'heading', text: 'What to do with this at the point of purchase' },
      {
        kind: 'para',
        text: 'Read the label before the price. Ask what the fibre has to survive: a coat needs structure and abrasion resistance, a summer shirt needs breathability, a knit worn against the skin needs fineness. When the composition matches the job, the garment lasts. When it does not, no amount of finishing will save it.',
      },
    ],
  },
  {
    slug: 'the-case-for-buying-fewer-better-things',
    title: 'The case for buying fewer, better things',
    excerpt:
      'Cost per wear is a more useful number than price. We ran it across a season of purchases to see what it actually reveals.',
    category: 'Perspective',
    tags: ['sustainability', 'buying', 'value'],
    author: EDITOR,
    published: '2026-05-30',
    readingMinutes: 7,
    cover: UNSPLASH('photo-1483985988355-763728e1935b'),
    coverAlt: 'A considered rail of neutral-toned clothing in daylight',
    featured: true,
    body: [
      {
        kind: 'para',
        text: 'Cost per wear is arithmetic, not ideology: the price of a thing divided by the number of times you use it. It is the only measure that treats a £40 shirt worn twice and a £300 coat worn four hundred times as what they are — one expensive purchase and one cheap one.',
      },
      { kind: 'heading', text: 'Running the numbers' },
      {
        kind: 'para',
        text: 'A wool overcoat at £480, worn through five winters at roughly eighty wears a season, works out at around £1.20 a wear. A £90 alternative that loses its shape in one season and is worn sixty times costs £1.50. The cheaper coat is more expensive, and you also spent a winter in a coat you liked less.',
      },
      {
        kind: 'quote',
        text: 'Nothing is a bargain if you do not reach for it.',
      },
      { kind: 'heading', text: 'Where the model breaks' },
      {
        kind: 'para',
        text: 'Cost per wear rewards things you wear constantly, which biases hard toward the neutral and the plain. Taken literally it would talk you out of every occasion piece you own. The honest version accepts two budgets: a durability budget, where the maths applies, and a much smaller one where it does not and should not.',
      },
      {
        kind: 'list',
        items: [
          'Apply it ruthlessly to outerwear, knitwear, denim, shoes and bags.',
          'Ignore it for the occasional piece bought for a specific reason.',
          'Recalculate honestly — count wears you actually had, not the ones you imagined.',
        ],
      },
      { kind: 'heading', text: 'The practical test' },
      {
        kind: 'para',
        text: 'Before buying, name the next three occasions you will wear it. If you cannot, the cost per wear is not low — it is undefined, and undefined usually resolves to the back of a wardrobe.',
      },
    ],
  },
  {
    slug: 'caring-for-knitwear-through-a-season',
    title: 'Caring for knitwear through a season',
    excerpt:
      'Washing less, drying flat, and resting a garment between wears will do more for it than any specialist product.',
    category: 'Care',
    tags: ['care', 'knitwear', 'longevity'],
    author: CARE,
    published: '2026-05-12',
    readingMinutes: 5,
    cover: UNSPLASH('photo-1445205170230-053b83016050'),
    coverAlt: 'Neatly folded knitwear in soft natural light',
    body: [
      {
        kind: 'para',
        text: 'Most knitwear is damaged by good intentions. Washing too often, drying too hot and hanging rather than folding will age a sweater faster than wearing it will.',
      },
      { kind: 'heading', text: 'Wash less than you think' },
      {
        kind: 'para',
        text: 'Wool is naturally odour-resistant and self-cleaning to a surprising degree. Airing a sweater overnight is usually enough. Wash when it is actually soiled — for most people that is three or four times a season, not weekly.',
      },
      { kind: 'heading', text: 'When you do wash' },
      {
        kind: 'list',
        items: [
          'Cool water, wool-specific detergent, minimal agitation.',
          'Never wring. Press water out between two towels.',
          'Dry flat and reshape while damp — hanging stretches the shoulders permanently.',
          'Store folded. A hanger will distort the shoulder line within weeks.',
        ],
      },
      {
        kind: 'image',
        src: UNSPLASH('photo-1469334031218-e382a71b716b'),
        alt: 'Folded garments arranged on an open shelf',
        caption: 'Folded and rested, not hung — the single most effective habit.',
      },
      { kind: 'heading', text: 'Pilling is not a defect' },
      {
        kind: 'para',
        text: 'Pills form where fabric rubs — underarms, cuffs, across a seatbelt line. On natural fibres this settles after the first few wears. A comb or a stone will clear them in minutes. Persistent pilling across the whole body usually indicates short-staple fibre, which is a quality question rather than a care one.',
      },
      { kind: 'heading', text: 'Rest between wears' },
      {
        kind: 'para',
        text: 'Fibres recover elasticity given a day off. Rotating three sweaters through a week will keep all three in better condition than wearing one repeatedly, and it costs nothing.',
      },
    ],
  },
  {
    slug: 'inside-the-mills-a-sourcing-diary',
    title: 'Inside the mills: a sourcing diary',
    excerpt:
      'Four days, three mills and a great deal of coffee. Notes from the trip that sets next season’s fabric.',
    category: 'Behind the scenes',
    tags: ['sourcing', 'provenance', 'craft'],
    author: BUYER,
    published: '2026-04-22',
    readingMinutes: 8,
    cover: UNSPLASH('photo-1558769132-cb1aea458c5e'),
    coverAlt: 'Rolls of fabric stacked in a textile workshop',
    body: [
      {
        kind: 'para',
        text: 'Fabric decisions are made about eleven months before anything reaches a shelf. That lead time is why sourcing trips matter: by the time a garment is designed, the cloth has already been chosen, and there is no fixing a mediocre fabric with good tailoring.',
      },
      { kind: 'heading', text: 'Day one — the wool mill' },
      {
        kind: 'para',
        text: 'We start with hand feel and end with a spreadsheet. Every candidate cloth is assessed for weight, drape, recovery and how it behaves after a simulated season of wear. Roughly one in six makes it past that first morning.',
      },
      {
        kind: 'quote',
        text: 'You can hear a good cloth. Run it through your hands and it moves quietly.',
        cite: 'A mill foreman, forty-one years on the floor',
      },
      { kind: 'heading', text: 'Day two — dye and consistency' },
      {
        kind: 'para',
        text: 'Colour consistency across production runs is a harder problem than it sounds. A shade approved in one lot can drift in the next. We now require lab dips against a physical reference for every repeat order, which slows things down and has almost eliminated the complaint we used to hear most: that a reorder did not match.',
      },
      {
        kind: 'image',
        src: UNSPLASH('photo-1616486338812-3dadae4b4ace'),
        alt: 'Bolts of textile in a range of natural tones',
        caption: 'Lab dips against a physical reference — slower, and far more reliable.',
      },
      { kind: 'heading', text: 'Day four — what we said no to' },
      {
        kind: 'para',
        text: 'The most useful outcome of the trip was three rejections: a beautiful cashmere blend with unacceptable pilling in testing, a linen at a price that only worked at volumes we could not honestly commit to, and a coating wool whose supply chain we could not trace past the spinner. Provenance we cannot verify is provenance we will not claim.',
      },
    ],
  },
  {
    slug: 'building-a-capsule-that-actually-works',
    title: 'Building a capsule that actually works',
    excerpt:
      'Most capsule guides prescribe a list. This one starts with your calendar, which is a better predictor of what you will wear.',
    category: 'Guides',
    tags: ['styling', 'buying', 'wardrobe'],
    author: EDITOR,
    published: '2026-04-02',
    readingMinutes: 6,
    cover: UNSPLASH('photo-1487222477894-8943e31ef7b2'),
    coverAlt: 'A minimal arrangement of clothing and accessories',
    body: [
      {
        kind: 'para',
        text: 'The failure mode of the capsule wardrobe is that it is usually designed for an imagined life. Thirty-three considered pieces will not help if twenty-eight of them suit occasions you attend twice a year.',
      },
      { kind: 'heading', text: 'Start with two weeks of your actual calendar' },
      {
        kind: 'para',
        text: 'Write down what you genuinely did — not what you meant to do. Most people find the split is far less varied than they expect, and heavily weighted toward a handful of repeating contexts. Build for those first, in proportion.',
      },
      {
        kind: 'list',
        items: [
          'Count the contexts, then allocate pieces to each in proportion to how often it occurs.',
          'Buy the highest-frequency items first, and buy them well.',
          'Resist the temptation to over-provision the rare occasion — that is what a single good piece is for.',
        ],
      },
      { kind: 'heading', text: 'Colour discipline beats piece count' },
      {
        kind: 'para',
        text: 'A capsule works because things combine, and things combine when the palette is narrow. Two neutrals, one mid-tone and one accent will out-perform a larger wardrobe assembled without a scheme. This is also why capsules photograph well and sometimes feel monotonous to live in — the discipline that makes them functional is the same thing that makes them quiet.',
      },
    ],
  },
  {
    slug: 'what-our-returns-data-taught-us-about-fit',
    title: 'What our returns data taught us about fit',
    excerpt:
      'A year of return reasons, read carefully. The results changed our size guide and two of our blocks.',
    category: 'Behind the scenes',
    tags: ['fit', 'sizing', 'service'],
    author: CARE,
    published: '2026-03-14',
    readingMinutes: 5,
    cover: UNSPLASH('photo-1441986300917-64674bd600d8'),
    coverAlt: 'A retail interior with garments on display',
    body: [
      {
        kind: 'para',
        text: 'Return reasons are the most candid feedback a retailer receives, because the customer has nothing to gain by being diplomatic. Read in aggregate over a year, ours pointed at three specific problems rather than a general one.',
      },
      { kind: 'heading', text: 'The findings' },
      {
        kind: 'list',
        items: [
          'Sleeve length drove a disproportionate share of returns on outerwear — the block ran short for longer arms.',
          '"Smaller than expected" clustered almost entirely on one supplier, not across the range.',
          'Customers who used a size guide with garment measurements returned far less often than those given only S/M/L.',
        ],
      },
      { kind: 'heading', text: 'What changed' },
      {
        kind: 'para',
        text: 'We publish flat garment measurements on every product page now, not just body measurements — the two are routinely confused, and the garment number is the one that predicts fit. We adjusted the outerwear sleeve block, and we changed how we spec sizing with the supplier responsible for the second finding.',
      },
      {
        kind: 'quote',
        text: 'A return is not a failed sale. It is a customer telling you something specific, for free.',
      },
      { kind: 'heading', text: 'What we still get wrong' },
      {
        kind: 'para',
        text: 'Between-sizes guidance remains weak. Telling someone to "size up if between sizes" is not useful without saying what changes when they do. We are working on per-garment advice, which is slower to produce and considerably more helpful.',
      },
    ],
  },
];

/** Newest first — the order the blog index and any feed should use. */
export const ARTICLES_BY_DATE: ReadonlyArray<Article> = [...ARTICLES].sort((a, b) =>
  b.published.localeCompare(a.published),
);

export function getArticle(slug: string): Article | undefined {
  return ARTICLES.find((a) => a.slug === slug);
}

export function articleCategories(): ReadonlyArray<{ name: string; count: number }> {
  const tally = new Map<string, number>();
  for (const a of ARTICLES) tally.set(a.category, (tally.get(a.category) ?? 0) + 1);
  return [...tally.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function articleTags(): ReadonlyArray<string> {
  return [...new Set(ARTICLES.flatMap((a) => a.tags))].sort();
}

/** Same category first, then most recent; never returns the article itself. */
export function relatedArticles(slug: string, limit = 3): ReadonlyArray<Article> {
  const current = getArticle(slug);
  if (!current) return ARTICLES_BY_DATE.slice(0, limit);
  const scored = ARTICLES_BY_DATE.filter((a) => a.slug !== slug).map((a) => ({
    article: a,
    score: (a.category === current.category ? 2 : 0) + a.tags.filter((t) => current.tags.includes(t)).length,
  }));
  return scored
    .sort((x, y) => y.score - x.score || y.article.published.localeCompare(x.article.published))
    .slice(0, limit)
    .map((s) => s.article);
}

/** Previous/next in publication order, for article footers. */
export function articleNeighbours(slug: string): { prev?: Article; next?: Article } {
  const i = ARTICLES_BY_DATE.findIndex((a) => a.slug === slug);
  if (i === -1) return {};
  return {
    ...(ARTICLES_BY_DATE[i + 1] ? { prev: ARTICLES_BY_DATE[i + 1] } : {}),
    ...(ARTICLES_BY_DATE[i - 1] ? { next: ARTICLES_BY_DATE[i - 1] } : {}),
  };
}

/**
 * Re-request the cover at the width the layout actually needs. Unsplash serves a resized image per
 * `w`, so a 320px card should not download the 1600px hero — that was ~5x the bytes for no visible
 * gain, on the page most likely to be opened on mobile.
 */
export function coverAt(article: Article, width: number): string {
  return article.cover.replace(/([?&])w=\d+/, `$1w=${width}`);
}

export function formatArticleDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return `${d} ${MONTHS[m - 1]} ${y}`;
}
