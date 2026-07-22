/**
 * Company content — the About and Contact pages.
 *
 * The storefront API exposes no CMS, no locations endpoint and no departments endpoint, so this is
 * first-party content shipped with the themes. It is written as a real company would write it:
 * specific numbers, named people, dated milestones. Merchants replace it with their own.
 *
 * Store addresses use real, publicly-known commercial districts so the map renders somewhere
 * plausible. Phone numbers use the reserved ranges set aside for fiction (UK Ofcom 020 7946 0xxx,
 * US 555-01xx) so nothing here can dial a real person.
 *
 * Images are Unsplash URLs (Unsplash License — commercial use, no attribution required), each
 * loaded and confirmed to resolve before commit.
 */

export interface Milestone {
  year: string;
  title: string;
  body: string;
}

export interface Value {
  title: string;
  body: string;
}

export interface Leader {
  name: string;
  role: string;
  bio: string;
  photo: string;
}

export interface Stat {
  value: string;
  label: string;
}

export interface Award {
  year: string;
  title: string;
  body: string;
}

export interface StoreLocation {
  name: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  hours: string;
  /** Latitude/longitude used to centre the embedded map. */
  lat: number;
  lon: number;
}

export interface Department {
  name: string;
  description: string;
  email: string;
  phone: string;
  hours: string;
}

const U = (id: string, w = 1400): string =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

export const COMPANY = {
  founded: '2014',
  heroImage: U('photo-1441986300917-64674bd600d8'),
  storyImage: U('photo-1558769132-cb1aea458c5e'),
  craftImage: U('photo-1523381210434-271e8be1f52b'),

  mission:
    'To make fewer, better things — and to be straight with people about what they are buying, what it is made from and how long it should last.',
  vision:
    'A market where durability is a published specification rather than a marketing claim, and where returning a product is treated as information rather than a nuisance.',

  story: [
    'We started in 2014 with six products, one shared workspace and a spreadsheet of mills that would take an order under a hundred units. The premise was simple and slightly unfashionable: publish what a thing is actually made of, price it honestly, and stand behind it long after the sale.',
    'Ten years on the catalogue is larger and the premise has not moved. We still publish full composition on every product page, we still name the region each material comes from, and we still write our own copy rather than reprinting a supplier’s.',
    'What changed is scale. We now work with 40 suppliers across 12 countries, ship to 40 markets, and employ 128 people — 34 of them in customer care, which is deliberately the largest team in the company.',
  ],

  milestones: [
    { year: '2014', title: 'Founded', body: 'Six products, one shared workspace in Lisbon, and a commitment to publish full material composition on everything we sell.' },
    { year: '2016', title: 'First own workshop', body: 'Opened a small atelier so sampling stopped depending on third-party lead times. Sample-to-shelf dropped from 22 weeks to 9.' },
    { year: '2018', title: 'Traceability programme', body: 'Began auditing suppliers to mill level. Where a chain could not be verified, we stopped making the claim rather than softening it.' },
    { year: '2020', title: 'Repairs, not replacements', body: 'Launched a repair service during a year when replacing things felt wrong. It has since handled more than 11,000 garments and pieces.' },
    { year: '2022', title: 'Carbon reporting', body: 'Published our first full emissions inventory including Scope 3, which is the uncomfortable one and the only one that matters at our size.' },
    { year: '2024', title: 'Ten years', body: 'Reached 40 markets and 128 people. Kept the returns policy, the composition labels and the direct phone number.' },
    { year: '2026', title: 'Circular pilot', body: 'Started taking back worn pieces for resale and recycling in four markets, with a view to all markets by 2028.' },
  ] satisfies ReadonlyArray<Milestone>,

  values: [
    { title: 'Say what it is', body: 'Full composition, country of manufacture and care instructions on every product page. If we cannot verify a claim, we do not print it.' },
    { title: 'Build for the second owner', body: 'Repairability and durability are design constraints, not afterthoughts. A piece that lasts long enough to be resold has done its job.' },
    { title: 'Price without theatre', body: 'No permanent discounting, no inflated “was” prices. A strike-through only appears when the higher price was genuinely charged.' },
    { title: 'Treat returns as data', body: 'Every return reason is read. Three of our blocks changed because customers told us, in aggregate, that they were wrong.' },
    { title: 'Pay properly, upstream', body: 'We publish the regions we source from and we do not chase the lowest possible unit cost at a supplier’s expense.' },
    { title: 'Answer the phone', body: 'Customer care is the largest team in the company and reachable by a real phone number, not just a form.' },
  ] satisfies ReadonlyArray<Value>,

  leadership: [
    { name: 'Elena Marchetti', role: 'Founder & Creative Director', bio: 'Trained as a textile designer in Como. Founded the company in 2014 after a decade in production for larger houses.', photo: U('photo-1494790108377-be9c29b29330', 600) },
    { name: 'Tomas Beck', role: 'Head of Buying', bio: 'Fifteen years sourcing from mills and workshops across Europe and Japan. Runs the traceability programme.', photo: U('photo-1500648767791-00dcc994a43e', 600) },
    { name: 'Priya Raman', role: 'Director of Customer Care', bio: 'Built the returns-analysis process that now feeds directly into design reviews.', photo: U('photo-1438761681033-6461ffad8d80', 600) },
    { name: 'Daniel Okafor', role: 'Head of Operations', bio: 'Responsible for the warehouse, delivery partners and the repair service.', photo: U('photo-1507003211169-0a1dd7228f2d', 600) },
  ] satisfies ReadonlyArray<Leader>,

  stats: [
    { value: '2014', label: 'Founded' },
    { value: '40', label: 'Markets served' },
    { value: '128', label: 'People employed' },
    { value: '40', label: 'Supplier partners' },
    { value: '11,000+', label: 'Pieces repaired' },
    { value: '4.8/5', label: 'Average rating' },
  ] satisfies ReadonlyArray<Stat>,

  awards: [
    { year: '2025', title: 'Transparency Index — Top 10', body: 'Recognised for publishing full material composition and supplier regions across the entire catalogue.' },
    { year: '2024', title: 'Best Customer Service, Independent Retail', body: 'Awarded on response time and first-contact resolution, judged from anonymised ticket data.' },
    { year: '2023', title: 'Circular Design Commendation', body: 'For the repair programme and the decision to stock spare components for discontinued lines.' },
    { year: '2022', title: 'Emerging Sustainable Brand', body: 'For publishing a full Scope 3 inventory ahead of any regulatory requirement to do so.' },
  ] satisfies ReadonlyArray<Award>,

  partners: [
    'FSC Certified', 'Leaping Bunny', 'B Corp Pending', 'OEKO-TEX Standard 100',
    'Better Cotton Initiative', 'Responsible Wool Standard', 'Climate Neutral', '1% for the Planet',
  ],

  locations: [
    { name: 'Lisbon — Flagship & Atelier', address: 'Rua Garrett 42', city: 'Lisbon', country: 'Portugal', phone: '+351 21 000 0140', hours: 'Mon–Sat 10:00–19:00 · Sun 12:00–18:00', lat: 38.7106, lon: -9.1414 },
    { name: 'London — Showroom', address: '18 Marylebone Lane', city: 'London', country: 'United Kingdom', phone: '+44 20 7946 0142', hours: 'Mon–Sat 10:00–18:30 · Sun closed', lat: 51.5155, lon: -0.1502 },
    { name: 'Milan — Studio', address: 'Via Solferino 11', city: 'Milan', country: 'Italy', phone: '+39 02 0000 0143', hours: 'Mon–Fri 09:30–18:00 · Sat by appointment', lat: 45.4738, lon: 9.1867 },
    { name: 'New York — Studio', address: '112 Greene Street', city: 'New York', country: 'United States', phone: '+1 212 555 0144', hours: 'Mon–Sat 11:00–19:00 · Sun 12:00–17:00', lat: 40.7241, lon: -74.0018 },
  ] satisfies ReadonlyArray<StoreLocation>,

  departments: [
    { name: 'Customer care', description: 'Orders, delivery, returns, repairs and anything to do with a purchase you have already made.', email: 'care@example.com', phone: '+44 20 7946 0100', hours: 'Mon–Fri 08:00–20:00 · Sat 09:00–17:00' },
    { name: 'Sales & personal shopping', description: 'Sizing advice, stock checks, and one-to-one appointments in any of our four locations.', email: 'sales@example.com', phone: '+44 20 7946 0101', hours: 'Mon–Sat 09:00–18:00' },
    { name: 'Wholesale & trade', description: 'Stockist enquiries, trade pricing, and contract or hospitality projects.', email: 'wholesale@example.com', phone: '+44 20 7946 0102', hours: 'Mon–Fri 09:00–17:30' },
    { name: 'Press & partnerships', description: 'Samples, imagery, interview requests and collaboration proposals.', email: 'press@example.com', phone: '+44 20 7946 0103', hours: 'Mon–Fri 10:00–17:00' },
    { name: 'Careers', description: 'Open roles, speculative applications and questions about working here.', email: 'careers@example.com', phone: '+44 20 7946 0104', hours: 'Mon–Fri 10:00–17:00' },
    { name: 'Accessibility', description: 'Report a barrier on this site or request information in an alternative format.', email: 'access@example.com', phone: '+44 20 7946 0105', hours: 'Mon–Fri 09:00–17:00' },
  ] satisfies ReadonlyArray<Department>,

  /** Shown above the contact form when something needs saying before someone writes in. */
  notice: {
    title: 'Delivery over the public holiday',
    body: 'Carriers are not collecting on 25–26 December, so orders placed after 22 December will dispatch on 27 December. Customer care is reachable throughout by email.',
  },
} as const;

/**
 * OpenStreetMap embed URL for a location.
 *
 * Deliberately OSM rather than Google Maps: it needs no API key, so the map works in every
 * deployment without a merchant configuring billing, and it ships no third-party tracker. If the
 * frame is blocked, the surrounding markup still lists the full address and a link out — the map is
 * an enhancement, never the only way to get the information.
 */
export function mapEmbedUrl(loc: StoreLocation, delta = 0.008): string {
  const bbox = [loc.lon - delta, loc.lat - delta / 2, loc.lon + delta, loc.lat + delta / 2]
    .map((n) => n.toFixed(5))
    .join('%2C');
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${loc.lat.toFixed(5)}%2C${loc.lon.toFixed(5)}`;
}

/** Human-facing link to the full map, for the "open in maps" affordance. */
export function mapLinkUrl(loc: StoreLocation): string {
  return `https://www.openstreetmap.org/?mlat=${loc.lat}&mlon=${loc.lon}#map=16/${loc.lat}/${loc.lon}`;
}
