/**
 * Rouge demo catalogue — luxury beauty and cosmetics.
 *
 * Voice: precise about formulation and finish, never gushing. A shade-first theme has to show a
 * range wide enough to prove the merchandising works, so complexion products carry shade counts.
 */
import { category, product, type DemoCatalog } from './types';

const CUR = 'USD';

export const ROUGE_CATALOG: DemoCatalog = {
  vertical: 'beauty',
  currency: CUR,
  products: [
    product({ i: 1, title: 'Luminous Silk Foundation', price: 58, vendor: 'Rouge', photo: 'photo-1596462502278-27bfdc403348', hover: 'photo-1571781926291-c477ebfd024b', rating: 4.7, reviews: 1284, badge: '40 shades', currency: CUR, colors: ['Rose', 'Nude'], sizes: ['15ml', '30ml', '50ml'], material: 'Vegan', tags: ['cruelty-free'], categorySlug: 'complexion', categoryName: 'Complexion' }),
    product({ i: 2, title: 'Velvet Matte Lipstick', price: 32, vendor: 'Rouge', photo: 'photo-1586495777744-4413f21062fa', rating: 4.8, reviews: 2140, badge: 'Best seller', currency: CUR, colors: ['Nude', 'Gold'], sizes: ['Travel', 'Full size'], material: 'Clean formula', tags: ['vegan'], categorySlug: 'lips', categoryName: 'Lips' }),
    product({ i: 3, title: 'Rosewater Hydrating Essence', price: 46, was: 58, vendor: 'Atelier Bloom', photo: 'photo-1620916566398-39f1143ab7be', rating: 4.6, reviews: 876, badge: 'Save 20%', currency: CUR, colors: ['Plum', 'Rose'], sizes: ['15ml', '30ml', '50ml'], material: 'Dermatologist-tested', tags: ['bestseller'], categorySlug: 'skincare', categoryName: 'Skincare' }),
    product({ i: 4, title: 'Cream Blush — Soft Focus', price: 28, vendor: 'Rouge', photo: 'photo-1522335789203-aabd1fc54bc9', rating: 4.9, reviews: 1533, currency: CUR, colors: ['Gold', 'Ivory'], sizes: ['Travel', 'Full size'], material: 'Fragrance-free', tags: ['new-in'], categorySlug: 'cheeks', categoryName: 'Cheeks' }),
    product({ i: 5, title: 'Overnight Ceramide Mask', price: 64, vendor: 'Atelier Bloom', photo: 'photo-1608248543803-ba4f8c70ae0b', rating: 4.5, reviews: 412, currency: CUR, colors: ['Rose', 'Nude'], sizes: ['15ml', '30ml', '50ml'], material: 'Vegan', tags: ['dermatologist-tested'], categorySlug: 'treatments', categoryName: 'Masks & treatments' }),
    product({ i: 6, title: 'Sculpting Brow Pencil', price: 24, vendor: 'Rouge', photo: 'photo-1512496015851-a90fb38ba796', rating: 4.4, reviews: 690, currency: CUR, colors: ['Nude', 'Gold'], sizes: ['Travel', 'Full size'], material: 'Clean formula', tags: ['cruelty-free'], categorySlug: 'eyes', categoryName: 'Eyes' }),
    product({ i: 7, title: 'Radiance Vitamin C Serum', price: 72, vendor: 'Maison Verte', photo: 'photo-1556228720-195a672e8a03', rating: 4.7, reviews: 1102, badge: 'New', currency: CUR, colors: ['Plum', 'Rose'], sizes: ['15ml', '30ml', '50ml'], material: 'Dermatologist-tested', tags: ['vegan'], categorySlug: 'skincare', categoryName: 'Skincare' }),
    product({ i: 8, title: 'Satin Lip Oil — Rose Noir', price: 30, vendor: 'Rouge', photo: 'photo-1631730359585-38a4935cbec4', rating: 4.8, reviews: 1876, currency: CUR, colors: ['Gold', 'Ivory'], sizes: ['Travel', 'Full size'], material: 'Fragrance-free', tags: ['bestseller'], categorySlug: 'lips', categoryName: 'Lips' }),
    product({ i: 9, title: 'Featherlight Setting Powder', price: 42, vendor: 'Rouge', photo: 'photo-1512207736890-6ffed8a84e8d', rating: 4.3, reviews: 534, currency: CUR, colors: ['Rose', 'Nude'], sizes: ['15ml', '30ml', '50ml'], material: 'Vegan', tags: ['new-in'], categorySlug: 'complexion', categoryName: 'Complexion' }),
    product({ i: 10, title: 'Botanical Cleansing Balm', price: 38, was: 48, vendor: 'Maison Verte', photo: 'photo-1585232004423-244e0e6904e3', rating: 4.6, reviews: 921, badge: 'Save 21%', currency: CUR, colors: ['Nude', 'Gold'], sizes: ['Travel', 'Full size'], material: 'Clean formula', tags: ['dermatologist-tested'], categorySlug: 'cleansers', categoryName: 'Cleansers' }),
    product({ i: 11, title: 'Precision Liquid Liner', price: 26, vendor: 'Rouge', photo: 'photo-1556228578-8c89e6adf883', rating: 4.5, reviews: 1340, currency: CUR, colors: ['Plum', 'Rose'], sizes: ['15ml', '30ml', '50ml'], material: 'Dermatologist-tested', tags: ['cruelty-free'], categorySlug: 'eyes', categoryName: 'Eyes' }),
    product({ i: 12, title: 'Nourishing Hair Oil', price: 44, vendor: 'Atelier Bloom', photo: 'photo-1608248597279-f99d160bfcbc', rating: 4.4, reviews: 388, currency: CUR, colors: ['Gold', 'Ivory'], sizes: ['Travel', 'Full size'], material: 'Fragrance-free', tags: ['vegan'], categorySlug: 'hair', categoryName: 'Hair' }),
    product({ i: 13, title: 'Eau de Parfum — Fig & Amber', price: 118, vendor: 'Maison Verte', photo: 'photo-1541643600914-78b084683601', rating: 4.9, reviews: 742, badge: 'Limited', currency: CUR, colors: ['Rose', 'Nude'], sizes: ['15ml', '30ml', '50ml'], material: 'Vegan', tags: ['bestseller'], categorySlug: 'fragrance', categoryName: 'Fragrance' }),
    product({ i: 14, title: 'Illuminating Highlighter', price: 34, vendor: 'Rouge', photo: 'photo-1596704017254-9b121068fb31', rating: 4.6, reviews: 655, currency: CUR, colors: ['Nude', 'Gold'], sizes: ['Travel', 'Full size'], material: 'Clean formula', tags: ['new-in'], categorySlug: 'complexion', categoryName: 'Complexion' }),
    product({ i: 15, title: 'Barrier Repair Moisturiser', price: 54, vendor: 'Atelier Bloom', photo: 'photo-1570172619644-dfd03ed5d881', rating: 4.7, reviews: 1487, currency: CUR, colors: ['Plum', 'Rose'], sizes: ['15ml', '30ml', '50ml'], material: 'Dermatologist-tested', tags: ['dermatologist-tested'], categorySlug: 'skincare', categoryName: 'Skincare' }),
    product({ i: 16, title: 'Sculpt & Define Brush Set', price: 88, vendor: 'Rouge', photo: 'photo-1522338140262-f46f5913618a', rating: 4.5, reviews: 296, soldOut: true, currency: CUR, colors: ['Gold', 'Ivory'], sizes: ['Travel', 'Full size'], material: 'Fragrance-free', tags: ['cruelty-free'], categorySlug: 'tools', categoryName: 'Tools & brushes' }),
  ],
  categories: [
    category('c1', 'Complexion', 'complexion', 'photo-1596462502278-27bfdc403348', '48 products'),
    category('c2', 'Lips', 'lips', 'photo-1586495777744-4413f21062fa', '62 products'),
    category('c3', 'Eyes', 'eyes', 'photo-1512496015851-a90fb38ba796', '54 products'),
    category('c4', 'Cheeks', 'cheeks', 'photo-1522335789203-aabd1fc54bc9', '31 products'),
    category('c5', 'Skincare', 'skincare', 'photo-1620916566398-39f1143ab7be', '76 products'),
    category('c6', 'Masks & treatments', 'treatments', 'photo-1608248543803-ba4f8c70ae0b', '28 products'),
    category('c7', 'Fragrance', 'fragrance', 'photo-1541643600914-78b084683601', '22 products'),
    category('c8', 'Hair', 'hair', 'photo-1608248597279-f99d160bfcbc', '35 products'),
    category('c9', 'Cleansers', 'cleansers', 'photo-1585232004423-244e0e6904e3', '26 products'),
    category('c10', 'Tools & brushes', 'tools', 'photo-1522338140262-f46f5913618a', '19 products'),
    category('c11', 'Sets & gifting', 'sets', 'photo-1571781926291-c477ebfd024b', '17 products'),
    category('c12', 'New in', 'new-in', 'photo-1556228720-195a672e8a03', '24 products'),
  ],
  brands: [
    { name: 'ROUGE', note: 'House colour' },
    { name: 'ATELIER BLOOM', note: 'Botanical skincare' },
    { name: 'MAISON VERTE', note: 'Clean formulation' },
    { name: 'LUMIÈRE', note: 'Complexion' },
    { name: 'SÉRAPHINE', note: 'Fragrance' },
    { name: 'ORCHIDÉE', note: 'Treatments' },
    { name: 'VELOURS', note: 'Lip' },
    { name: 'AURELIA', note: 'Tools' },
    { name: 'BOTANICA', note: 'Hair' },
    { name: 'MIROIR', note: 'Gifting' },
    { name: 'CALYX', note: 'Sun care' },
    { name: 'NOCTURNE', note: 'Night care' },
  ],
  testimonials: [
    { quote: 'The shade match was uncanny — it disappears into my skin and wears all day without a touch-up.', author: 'Verified buyer', detail: 'Deep neutral · Luminous Silk', rating: 5 },
    { quote: 'Lightweight, luminous, and the packaging feels like a gift to myself.', author: 'Verified buyer', detail: 'Medium warm · Cream Blush', rating: 5 },
    { quote: 'Finally a clean formula that actually performs. I have repurchased three times.', author: 'Verified buyer', detail: 'Fair cool · Rosewater Essence', rating: 5 },
    { quote: 'The ingredient list is published in full, which is why I trusted it with reactive skin.', author: 'Verified buyer', detail: 'Sensitive · Barrier Repair', rating: 5 },
    { quote: 'Colour is exactly as photographed. That is not always true elsewhere.', author: 'Verified buyer', detail: 'Velvet Matte', rating: 5 },
    { quote: 'Samples with my order let me find my shade without guessing. More brands should do this.', author: 'Verified buyer', detail: 'Tan neutral', rating: 5 },
    { quote: 'The serum is excellent but the pump can be temperamental in cold weather.', author: 'Verified buyer', detail: 'Radiance Vitamin C', rating: 4 },
    { quote: 'Beautifully made and it lasts. I have stopped buying drugstore versions of this.', author: 'Verified buyer', detail: 'Sculpt & Define', rating: 5 },
  ],
  faqs: [
    { question: 'How do I find my shade?', answer: 'Use the shade finder, or order up to three samples with any purchase and match in daylight before opening the full size.' },
    { question: 'Are your formulas cruelty-free?', answer: 'Yes. Every product is Leaping Bunny certified and we do not sell in markets that require animal testing.' },
    { question: 'Are products vegan?', answer: 'The majority are. Where a product contains beeswax or lanolin it is stated clearly at the top of the ingredient list.' },
    { question: 'Can I return an opened cosmetic?', answer: 'For hygiene reasons we cannot accept opened complexion or lip products unless faulty. Unopened items can be returned within 30 days.' },
    { question: 'Do you publish full ingredient lists?', answer: 'Yes — the complete INCI list appears on every product page, not just the marketing highlights.' },
    { question: 'Is the packaging recyclable?', answer: 'Cartons and glass are widely recyclable. Pumps and mixed-material caps are not yet, and we say so rather than implying otherwise.' },
    { question: 'How long do products last once opened?', answer: 'The period-after-opening symbol on each carton gives the figure in months. Serums with vitamin C are the shortest, typically three months.' },
    { question: 'Do you offer samples?', answer: 'Choose up to three with any order at checkout, free of charge.' },
    { question: 'What if a product reacts with my skin?', answer: 'Stop using it and contact us. We will refund it even if it has been opened — a reaction is not a change of mind.' },
    { question: 'Are your sunscreens broad spectrum?', answer: 'Yes, and the UVA rating is printed alongside the SPF rather than buried in the small print.' },
    { question: 'Do you ship fragrance internationally?', answer: 'Fragrance is restricted on air freight to some destinations. Availability is shown at checkout once you enter an address.' },
    { question: 'Can I buy a gift card?', answer: 'Digital gift cards are available in several denominations and are delivered by email with no expiry.' },
  ],
  announcements: [
    'Complimentary samples with every order — choose three at checkout',
    'Free shipping over $50 · 30-day returns on unopened items',
    'Leaping Bunny certified · vegan formulas marked on every page',
  ],
};
