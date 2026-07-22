/**
 * Voltage demo catalogue — consumer electronics and components.
 *
 * Voice: technical, specific, numbers-forward. A spec-led theme has to demonstrate that it can
 * carry real specifications, so titles and copy name chipsets, interfaces and tolerances rather
 * than adjectives.
 */
import { category, product, type DemoCatalog } from './types';

const CUR = 'USD';

export const VOLTAGE_CATALOG: DemoCatalog = {
  vertical: 'electronics',
  currency: CUR,
  products: [
    product({ i: 1, title: 'Meridian 14 Ultrabook', price: 1699, vendor: 'Meridian', photo: 'photo-1517336714731-489689fd1ca8', hover: 'photo-1496181133206-80ce9b88a853', rating: 4.7, reviews: 214, badge: 'New', currency: CUR, colors: ['Black', 'Silver'], sizes: ['13"', '14"', '16"'], material: 'Aluminium', tags: ['warranty-2yr'], categorySlug: 'laptops', categoryName: 'Laptops' }),
    product({ i: 2, title: 'Northwind X2 Mechanical Keyboard', price: 189, was: 229, vendor: 'Northwind', photo: 'photo-1587829741301-dc798b83add3', rating: 4.8, reviews: 486, badge: 'Save 17%', currency: CUR, colors: ['Charcoal', 'Cyan'], sizes: ['1TB', '2TB', '4TB'], material: 'ABS polymer', tags: ['bestseller'], categorySlug: 'peripherals', categoryName: 'Peripherals' }),
    product({ i: 3, title: 'Apex Labs 27" 4K Reference Display', price: 749, vendor: 'Apex Labs', photo: 'photo-1527814050087-3793815479db', rating: 4.6, reviews: 133, currency: CUR, colors: ['Black'], sizes: ['27"', '32"'], material: 'Steel', tags: ['new-2026'], categorySlug: 'displays', categoryName: 'Displays' }),
    product({ i: 4, title: 'Vanta NVMe 2TB Gen4 SSD', price: 179, was: 219, vendor: 'Vanta', photo: 'photo-1597872200969-2b65d56bd16b', rating: 4.9, reviews: 902, badge: 'Best seller', currency: CUR, colors: ['Silver', 'White'], sizes: ['13"', '14"', '16"'], material: 'Carbon composite', tags: ['pro-grade'], categorySlug: 'storage', categoryName: 'Storage' }),
    product({ i: 5, title: 'Helix Studio Monitor Headphones', price: 329, vendor: 'Helix', photo: 'photo-1546435770-a3e426bf472b', rating: 4.5, reviews: 267, currency: CUR, colors: ['Black', 'Silver'], sizes: ['1TB', '2TB', '4TB'], material: 'Aluminium', tags: ['rgb'], categorySlug: 'audio', categoryName: 'Audio' }),
    product({ i: 6, title: 'Gridworks Mesh Router — Tri-Band', price: 259, vendor: 'Gridworks', photo: 'photo-1544244015-0df4b3ffc6b0', rating: 4.3, reviews: 158, currency: CUR, colors: ['Charcoal', 'Cyan'], sizes: ['27"', '32"'], material: 'ABS polymer', tags: ['warranty-2yr'], categorySlug: 'networking', categoryName: 'Networking' }),
    product({ i: 7, title: 'Meridian Pro Wireless Mouse', price: 89, vendor: 'Meridian', photo: 'photo-1593642632823-8f785ba67e45', rating: 4.6, reviews: 641, currency: CUR, colors: ['Black'], sizes: ['13"', '14"', '16"'], material: 'Steel', tags: ['bestseller'], categorySlug: 'peripherals', categoryName: 'Peripherals' }),
    product({ i: 8, title: 'Apex Labs 65W GaN Charger', price: 59, was: 75, vendor: 'Apex Labs', photo: 'photo-1583863788434-e58a36330cf0', rating: 4.7, reviews: 388, badge: 'Save 21%', currency: CUR, colors: ['Silver', 'White'], sizes: ['1TB', '2TB', '4TB'], material: 'Carbon composite', tags: ['new-2026'], categorySlug: 'power', categoryName: 'Power' }),
    product({ i: 9, title: 'Vanta 1000W Platinum PSU', price: 219, vendor: 'Vanta', photo: 'photo-1587202372634-32705e3bf49c', rating: 4.8, reviews: 176, currency: CUR, colors: ['Black', 'Silver'], sizes: ['27"', '32"'], material: 'Aluminium', tags: ['pro-grade'], categorySlug: 'components', categoryName: 'Components' }),
    product({ i: 10, title: 'Helix Field Recorder XLR-4', price: 449, vendor: 'Helix', photo: 'photo-1520170350707-b2da59970118', rating: 4.4, reviews: 92, currency: CUR, colors: ['Charcoal', 'Cyan'], sizes: ['13"', '14"', '16"'], material: 'ABS polymer', tags: ['rgb'], categorySlug: 'studio', categoryName: 'Studio' }),
    product({ i: 11, title: 'Northwind Low-Profile Switch Set', price: 44, vendor: 'Northwind', photo: 'photo-1618384887929-16ec33fab9ef', rating: 4.5, reviews: 523, currency: CUR, colors: ['Black'], sizes: ['1TB', '2TB', '4TB'], material: 'Steel', tags: ['warranty-2yr'], categorySlug: 'peripherals', categoryName: 'Peripherals' }),
    product({ i: 12, title: 'Gridworks 2.5GbE Managed Switch', price: 189, vendor: 'Gridworks', photo: 'photo-1558494949-ef010cbdcc31', rating: 4.6, reviews: 141, currency: CUR, colors: ['Silver', 'White'], sizes: ['27"', '32"'], material: 'Carbon composite', tags: ['bestseller'], categorySlug: 'networking', categoryName: 'Networking' }),
    product({ i: 13, title: 'Meridian Dock Pro — 11 Port', price: 279, vendor: 'Meridian', photo: 'photo-1625842268584-8f3296236761', rating: 4.2, reviews: 204, currency: CUR, colors: ['Black', 'Silver'], sizes: ['13"', '14"', '16"'], material: 'Aluminium', tags: ['new-2026'], categorySlug: 'cables', categoryName: 'Cables & adapters' }),
    product({ i: 14, title: 'Apex Labs Colour Calibration Probe', price: 199, vendor: 'Apex Labs', photo: 'photo-1518770660439-4636190af475', rating: 4.7, reviews: 88, currency: CUR, colors: ['Charcoal', 'Cyan'], sizes: ['1TB', '2TB', '4TB'], material: 'ABS polymer', tags: ['pro-grade'], categorySlug: 'displays', categoryName: 'Displays' }),
    product({ i: 15, title: 'Vanta AIO 360 Liquid Cooler', price: 189, vendor: 'Vanta', photo: 'photo-1587202372775-e229f172b9d7', rating: 4.5, reviews: 312, soldOut: true, currency: CUR, colors: ['Black'], sizes: ['27"', '32"'], material: 'Steel', tags: ['rgb'], categorySlug: 'cooling', categoryName: 'Cooling' }),
    product({ i: 16, title: 'Helix Desk Microphone — Cardioid', price: 149, was: 179, vendor: 'Helix', photo: 'photo-1590602847861-f357a9332bbc', rating: 4.6, reviews: 447, badge: 'Save 17%', currency: CUR, colors: ['Silver', 'White'], sizes: ['13"', '14"', '16"'], material: 'Carbon composite', tags: ['warranty-2yr'], categorySlug: 'studio', categoryName: 'Studio' }),
  ],
  categories: [
    category('c1', 'Laptops', 'laptops', 'photo-1517336714731-489689fd1ca8', '24 products'),
    category('c2', 'Displays', 'displays', 'photo-1527814050087-3793815479db', '18 products'),
    category('c3', 'Storage', 'storage', 'photo-1597872200969-2b65d56bd16b', '31 products'),
    category('c4', 'Audio', 'audio', 'photo-1546435770-a3e426bf472b', '27 products'),
    category('c5', 'Peripherals', 'peripherals', 'photo-1587829741301-dc798b83add3', '46 products'),
    category('c6', 'Networking', 'networking', 'photo-1544244015-0df4b3ffc6b0', '22 products'),
    category('c7', 'Components', 'components', 'photo-1587202372634-32705e3bf49c', '38 products'),
    category('c8', 'Power', 'power', 'photo-1583863788434-e58a36330cf0', '15 products'),
    category('c9', 'Cooling', 'cooling', 'photo-1587202372775-e229f172b9d7', '19 products'),
    category('c10', 'Cables & adapters', 'cables', 'photo-1625842268584-8f3296236761', '52 products'),
    category('c11', 'Studio', 'studio', 'photo-1520170350707-b2da59970118', '14 products'),
    category('c12', 'Smart home', 'smart-home', 'photo-1558494949-ef010cbdcc31', '26 products'),
  ],
  brands: [
    { name: 'MERIDIAN', note: 'Portable computing' },
    { name: 'APEX LABS', note: 'Colour-critical displays' },
    { name: 'VANTA', note: 'Storage & power' },
    { name: 'HELIX', note: 'Studio audio' },
    { name: 'GRIDWORKS', note: 'Networking' },
    { name: 'NORTHWIND', note: 'Input devices' },
    { name: 'AXION', note: 'Cooling' },
    { name: 'PULSAR', note: 'Cables & docks' },
    { name: 'FERROUS', note: 'Chassis' },
    { name: 'ORBITAL', note: 'Smart home' },
    { name: 'KILN', note: 'Thermal compounds' },
    { name: 'STRATA', note: 'Memory' },
  ],
  testimonials: [
    { quote: 'The spec sheet matched the product exactly. That sounds like a low bar until you have been burned by a vendor that rounds up.', author: 'Daniel O.', detail: 'Verified buyer · Meridian 14', rating: 5 },
    { quote: 'Ordered at 4pm, arrived before 10am the next morning. Packaging was sensible rather than theatrical.', author: 'Priya S.', detail: 'Verified buyer · Vanta NVMe', rating: 5 },
    { quote: 'Support answered a compatibility question with an actual answer and a link to the datasheet. No script.', author: 'Marcus L.', detail: 'Verified buyer · Gridworks Mesh', rating: 5 },
    { quote: 'Returned a display that had a dead subpixel. Replacement shipped before the return was scanned in.', author: 'Anja K.', detail: 'Verified buyer · Apex Labs 27"', rating: 4 },
    { quote: 'The comparison table is the reason I bought here. Every competitor makes you open six tabs.', author: 'Tom R.', detail: 'Verified buyer · Helix Monitors', rating: 5 },
    { quote: 'Third build sourced entirely from this store. Nothing has failed in two years.', author: 'Elena V.', detail: 'Verified buyer', rating: 5 },
    { quote: 'Wish the stock notifications were faster — the cooler I wanted sold out while I was in the basket.', author: 'Sam W.', detail: 'Verified buyer · Vanta AIO', rating: 4 },
    { quote: 'Clear warranty terms, no argument when I claimed. Rarer than it should be.', author: 'Ibrahim N.', detail: 'Verified buyer · Northwind X2', rating: 5 },
  ],
  faqs: [
    { question: 'Do you ship internationally?', answer: 'Yes — tracked to 40 countries. Duties are calculated at checkout for most destinations and shown before you pay.' },
    { question: 'How fast is dispatch?', answer: 'Orders placed before 4pm on a business day are dispatched the same day. Orders over $150 ship free.' },
    { question: 'What warranty do products carry?', answer: 'Two years against manufacturing defects as standard, and the manufacturer warranty on top where it is longer.' },
    { question: 'Can I return a component I have installed?', answer: 'Yes, within 30 days, provided it is undamaged and in its original packaging with all accessories.' },
    { question: 'Do you price match?', answer: 'We publish our price and our specification. If you find the same part cheaper from an authorised seller, tell us and we will look at it.' },
    { question: 'Are your products genuine and authorised?', answer: 'Every item is sourced through authorised distribution. Serial numbers are traceable and warranty is valid worldwide.' },
    { question: 'Do you sell to businesses?', answer: 'Yes. Business accounts get net terms, consolidated invoicing and volume pricing — contact the sales team to open one.' },
    { question: 'How do I know a part is compatible with my build?', answer: 'Every product page lists interface, form factor and power draw. If you are unsure, send us your build list and support will check it.' },
    { question: 'What payment methods do you accept?', answer: 'All major cards, PayPal and Apple Pay. Card details are handled by our payment provider and never stored by us.' },
    { question: 'Do you offer extended warranties?', answer: 'On displays and laptops, a three-year extension is available at checkout.' },
    { question: 'Can I collect an order?', answer: 'Collection is available from our distribution point during business hours once you receive the ready-to-collect email.' },
    { question: 'What happens if an item arrives faulty?', answer: 'Tell us within 48 hours and we cover return shipping and send a replacement as a priority.' },
  ],
  announcements: [
    'Free 24-hour shipping on orders over $150',
    'Two-year warranty on every build — no fine print',
    '30-day returns, return shipping on us',
  ],
};
