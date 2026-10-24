/**
 * Fine Jewellery demo catalogue — gold, diamonds, pearls and watches (previews the Karat theme).
 *
 * Voice: precise and reassuring. Jewellery is bought on facts — karat, metal, weight, stone — so
 * every piece carries them: the metal in `material`, the karat and gram weight as tags (`18k`,
 * `3.4g`) that Karat's card turns into its "18K · Yellow Gold · 3.4 g" spec line. Ring sizes are
 * EU (circumference in mm), bangle sizes the Gulf/Egyptian 2.4–2.8 scale, chains in centimetres.
 *
 * Photography: Unsplash (free licence), each id checked to return 200 and viewed to confirm it shows
 * the piece it is attached to; shots with a prominent maker's logo were left out.
 */
import { category, product, type DemoCatalog } from './types';

const CUR = 'USD';
const RING = ['48', '50', '52', '54', '56'];
const MENS_RING = ['58', '60', '62', '64', '66'];
const WRIST = ['16 cm', '17 cm', '18 cm'];

export const JEWEL_CATALOG: DemoCatalog = {
  vertical: 'jewellery',
  currency: CUR,
  products: [
    product({ i: 1, title: 'Emerald-Cut Solitaire Ring', price: 3450, vendor: 'Sellchaze Fine', photo: 'photo-1598560917807-1bae44bd2be8', rating: 4.9, reviews: 86, badge: 'Best seller', currency: CUR, colors: ['Yellow Gold', 'White Gold', 'Rose Gold'], sizes: RING, material: 'Yellow Gold', tags: ['18k', '3.4g'], categorySlug: 'bridal', categoryName: 'Bridal' }),
    product({ i: 2, title: 'Pear-Cut Halo Ring', price: 5200, vendor: 'Lumen Diamonds', photo: 'photo-1607703829739-c05b7beddf60', rating: 4.8, reviews: 41, badge: 'New', currency: CUR, colors: ['White Gold', 'Rose Gold'], sizes: RING, material: 'White Gold', tags: ['18k', '4.1g'], categorySlug: 'bridal', categoryName: 'Bridal' }),
    product({ i: 3, title: 'Classic Wedding Bands — Pair', price: 1280, vendor: 'Safa Gold', photo: 'photo-1622398925373-3f91b1e275f5', rating: 4.9, reviews: 203, currency: CUR, colors: ['Yellow Gold'], sizes: RING, material: 'Yellow Gold', tags: ['21k', '9.5g'], categorySlug: 'bridal', categoryName: 'Bridal' }),
    product({ i: 4, title: 'Pink Sapphire Halo Ring', price: 1890, vendor: 'Atelier Rim', photo: 'photo-1603561591411-07134e71a2a9', hover: 'photo-1603561596973-8166e9e089d1', rating: 4.7, reviews: 58, currency: CUR, colors: ['Rose Gold'], sizes: RING, material: 'Rose Gold', tags: ['18k', '2.9g'], categorySlug: 'rings', categoryName: 'Rings' }),
    product({ i: 5, title: 'Engraved Signet Band', price: 145, vendor: 'Siwa Silver', photo: 'photo-1593295583578-fda964d48b72', rating: 4.6, reviews: 132, currency: CUR, colors: ['Sterling Silver'], sizes: MENS_RING, material: 'Sterling Silver 925', tags: ['6.8g'], categorySlug: 'rings', categoryName: 'Rings' }),
    product({ i: 6, title: 'Halo Diamond Stud Earrings', price: 2350, vendor: 'Lumen Diamonds', photo: 'photo-1735480165343-96034e9528f9', rating: 4.8, reviews: 97, currency: CUR, colors: ['White Gold', 'Yellow Gold'], material: 'White Gold', tags: ['18k', '2.2g'], categorySlug: 'earrings', categoryName: 'Earrings' }),
    product({ i: 7, title: 'Sculpted Gold Hoops', price: 1150, was: 1290, vendor: 'Oro Vela', photo: 'photo-1708220040824-b273dd0a17cc', rating: 4.7, reviews: 164, badge: 'Save 11%', currency: CUR, colors: ['Yellow Gold'], material: 'Yellow Gold', tags: ['21k', '7.2g'], categorySlug: 'earrings', categoryName: 'Earrings' }),
    product({ i: 8, title: 'Akoya Pearl Strand', price: 1650, vendor: 'Dana Pearls', photo: 'photo-1654699991520-aaaf4dd2608b', hover: 'photo-1595345705177-ffe090eb0784', rating: 4.9, reviews: 72, currency: CUR, sizes: ['42 cm', '45 cm'], material: 'Akoya Pearl', tags: ['18k'], categorySlug: 'pearls', categoryName: 'Pearls' }),
    product({ i: 9, title: 'Pearl Drop Pendant', price: 690, vendor: 'Dana Pearls', photo: 'photo-1682629846138-7db022565bd5', rating: 4.6, reviews: 48, soldOut: true, currency: CUR, colors: ['Yellow Gold'], sizes: ['42 cm', '45 cm'], material: 'Yellow Gold', tags: ['18k', '2.4g'], categorySlug: 'pearls', categoryName: 'Pearls' }),
    product({ i: 10, title: 'Cushion Halo Pendant', price: 240, vendor: 'Siwa Silver', photo: 'photo-1589128777073-263566ae5e4d', rating: 4.5, reviews: 189, currency: CUR, colors: ['Sterling Silver'], sizes: ['45 cm', '50 cm'], material: 'Sterling Silver 925', tags: ['4.5g'], categorySlug: 'necklaces', categoryName: 'Necklaces' }),
    product({ i: 11, title: 'Cuban Link Chain', price: 3900, vendor: 'Safa Gold', photo: 'photo-1721807550979-6e662d370e92', rating: 4.8, reviews: 66, currency: CUR, colors: ['Yellow Gold'], sizes: ['50 cm', '55 cm', '60 cm'], material: 'Yellow Gold', tags: ['21k', '42g'], categorySlug: 'gold', categoryName: 'Gold 21K' }),
    product({ i: 12, title: 'Ornate Gold Bangles — Set of Four', price: 4650, vendor: 'Safa Gold', photo: 'photo-1758995116383-f51775896add', rating: 4.9, reviews: 38, currency: CUR, colors: ['Yellow Gold'], sizes: ['2.4', '2.6', '2.8'], material: 'Yellow Gold', tags: ['21k', '48g'], categorySlug: 'gold', categoryName: 'Gold 21K' }),
    product({ i: 13, title: 'Diamond Tennis Bracelet', price: 5800, vendor: 'Lumen Diamonds', photo: 'photo-1619119069152-a2b331eb392a', rating: 4.9, reviews: 29, badge: 'Limited', currency: CUR, colors: ['White Gold', 'Yellow Gold'], sizes: WRIST, material: 'White Gold', tags: ['18k', '11.2g'], categorySlug: 'bracelets', categoryName: 'Bracelets' }),
    product({ i: 14, title: 'Engravable Name Bar Bracelet', price: 420, was: 520, vendor: 'Oro Vela', photo: 'photo-1777999802051-f6f0296e76af', rating: 4.7, reviews: 256, badge: 'Save 19%', currency: CUR, colors: ['Yellow Gold', 'Rose Gold', 'White Gold'], sizes: WRIST, material: 'Yellow Gold', tags: ['18k', '2.1g'], categorySlug: 'bracelets', categoryName: 'Bracelets' }),
    product({ i: 15, title: 'Heritage Chronograph — Leather Strap', price: 690, vendor: 'Tempo', photo: 'photo-1557531365-e8b22d93dbd0', rating: 4.6, reviews: 118, currency: CUR, colors: ['Silver'], sizes: ['42 mm'], material: 'Stainless Steel', categorySlug: 'watches', categoryName: 'Watches' }),
    product({ i: 16, title: 'Crystal Bezel Watch — Rose Gold', price: 540, vendor: 'Tempo', photo: 'photo-1751437774882-deeea4352018', rating: 4.7, reviews: 84, currency: CUR, colors: ['Rose Gold'], sizes: ['36 mm'], material: 'Rose Gold-Tone Steel', categorySlug: 'watches', categoryName: 'Watches' }),
  ],
  categories: [
    category('c1', 'Bridal', 'bridal', 'photo-1559006864-38a01f201f95', '36 pieces'),
    category('c2', 'Rings', 'rings', 'photo-1631982690223-8aa4be0a2497', '84 pieces'),
    category('c3', 'Necklaces', 'necklaces', 'photo-1625792508553-5e66a81659fa', '57 pieces'),
    category('c4', 'Earrings', 'earrings', 'photo-1638734205377-f21045bf6ebe', '63 pieces'),
    category('c5', 'Bracelets', 'bracelets', 'photo-1778000000743-87e855360c51', '41 pieces'),
    category('c6', 'Watches', 'watches', 'photo-1604242692760-2f7b0c26856d', '28 pieces'),
    category('c7', 'Gold 21K', 'gold', 'photo-1650455221359-3aebf920bcc5', '72 pieces'),
    category('c8', 'Pearls', 'pearls', 'photo-1595345705177-ffe090eb0784', '19 pieces'),
  ],
  brands: [
    { name: 'SELLCHAZE FINE', note: 'The house' },
    { name: 'LUMEN DIAMONDS', note: 'Certified diamonds' },
    { name: 'SAFA GOLD', note: '21K gold' },
    { name: 'DANA PEARLS', note: 'Pearls' },
    { name: 'ORO VELA', note: 'Everyday gold' },
    { name: 'ATELIER RIM', note: 'Coloured stones' },
    { name: 'SIWA SILVER', note: 'Sterling silver' },
    { name: 'TEMPO', note: 'Watches' },
    { name: 'QIRAT', note: 'Bridal sets' },
    { name: 'HALA', note: 'Children’s gold' },
    { name: 'MERAKI', note: 'Engraving' },
    { name: 'NAJMA', note: 'High jewellery' },
  ],
  testimonials: [
    { quote: 'The solitaire arrived with its grading report and the stone matched it exactly. My fiancée has not stopped looking at it.', author: 'Verified buyer', detail: 'Emerald-Cut Solitaire Ring', rating: 5 },
    { quote: 'They resized the band free of charge and it came back in four days, polished like new.', author: 'Verified buyer', detail: 'Classic Wedding Bands', rating: 5 },
    { quote: 'The weight on the receipt matched the hallmark and the scale at home. That is why I buy gold here.', author: 'Verified buyer', detail: 'Ornate Gold Bangles', rating: 5 },
    { quote: 'Pearls with real lustre and a knotted silk thread between each one. Beautifully finished.', author: 'Verified buyer', detail: 'Akoya Pearl Strand', rating: 5 },
    { quote: 'Engraving was crisp and they sent a proof on WhatsApp before cutting it. A perfect Eid gift.', author: 'Verified buyer', detail: 'Engravable Name Bar Bracelet', rating: 5 },
    { quote: 'Insured delivery, signed for, in a box that felt like a gift on its own.', author: 'Verified buyer', detail: 'Halo Diamond Stud Earrings', rating: 5 },
    { quote: 'Keeps time to the second and the leather strap softened within a week.', author: 'Verified buyer', detail: 'Heritage Chronograph', rating: 4 },
    { quote: 'I asked for a lighter chain and they suggested the 50 cm in the same link. Honest advice.', author: 'Verified buyer', detail: 'Cuban Link Chain', rating: 5 },
  ],
  faqs: [
    { question: 'How do I find my ring size?', answer: 'Use our printable sizer or measure a ring that fits — sizes are EU, the inner circumference in millimetres. The first resize within 60 days is free.' },
    { question: 'Are your diamonds certified?', answer: 'Every diamond over 0.30 ct comes with an independent grading report; the report number is laser-inscribed on the girdle.' },
    { question: 'What is the difference between 18K and 21K?', answer: '18K is 75% pure gold and holds stones securely; 21K is 87.5% gold, richer in colour and the traditional choice for Gulf bangles and chains.' },
    { question: 'Is the gold weight guaranteed?', answer: 'Yes. The gram weight on the product page is the finished weight, and it is printed on your invoice next to the hallmark.' },
    { question: 'Why does the price of gold pieces change?', answer: 'Gold pieces follow the daily gold rate plus a fixed making charge. The price you see at checkout is locked once you pay.' },
    { question: 'Do you buy back or exchange gold?', answer: 'You can exchange gold bought from us against a new piece at the day’s rate, less the original making charge. Bring the invoice.' },
    { question: 'Can I engrave a piece?', answer: 'Bands, bars and pendant backs can be engraved in Arabic or English. We send a proof before cutting, and engraved pieces are final sale.' },
    { question: 'Is shipping insured?', answer: 'Always. Every order is fully insured, sent in discreet packaging and handed over only against a signature.' },
    { question: 'What is your returns policy?', answer: 'Thirty days from delivery for unworn pieces with tags and certificates. Engraved, resized and made-to-order pieces cannot be returned.' },
    { question: 'How do I care for pearls?', answer: 'Put them on last and take them off first. Wipe with a soft dry cloth after wearing and keep them away from perfume and hairspray.' },
    { question: 'Do you offer instalments?', answer: 'Yes — orders over $300 can be split into four interest-free payments at checkout, subject to approval.' },
    { question: 'Can you gift wrap and hide the price?', answer: 'Every order ships in our signature box. Add a handwritten card at checkout and we remove prices from the packing slip.' },
  ],
  announcements: [
    'Complimentary insured shipping on every order',
    'First ring resize free within 60 days',
    'Engraving in Arabic or English — proof before we cut',
  ],
};
