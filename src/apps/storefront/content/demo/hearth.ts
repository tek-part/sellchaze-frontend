/**
 * Hearth demo catalogue — furniture and home living.
 *
 * Voice: warm and tactile, but concrete about materials and dimensions. Furniture buyers need
 * numbers — this catalogue names woods, weaves and finishes rather than moods.
 */
import { category, product, type DemoCatalog } from './types';

const CUR = 'USD';

export const HEARTH_CATALOG: DemoCatalog = {
  vertical: 'home',
  currency: CUR,
  products: [
    product({ i: 1, title: 'Alder Three-Seat Sofa — Oatmeal Bouclé', price: 1890, vendor: 'Hearth', photo: 'photo-1555041469-a586c61ea9bc', hover: 'photo-1550226891-ef816aed4a98', rating: 4.7, reviews: 218, badge: 'Best seller', currency: CUR, colors: ['Oatmeal', 'Sage'], sizes: ['2-seat', '3-seat', '4-seat'], material: 'Solid oak', tags: ['fsc-certified'], categorySlug: 'living', categoryName: 'Living' }),
    product({ i: 2, title: 'Fernwood Oak Dining Table — 200cm', price: 1450, vendor: 'Fernwood', photo: 'photo-1567016432779-094069958ea5', rating: 4.8, reviews: 142, currency: CUR, colors: ['Walnut', 'Oak'], sizes: ['King', 'Queen', 'Double'], material: 'Walnut', tags: ['made-to-order'], categorySlug: 'dining', categoryName: 'Dining' }),
    product({ i: 3, title: 'Rattan Lounge Chair', price: 620, was: 780, vendor: 'Hearth', photo: 'photo-1567538096630-e0c55bd6374c', rating: 4.6, reviews: 331, badge: 'Save 20%', currency: CUR, colors: ['Terracotta', 'Clay'], sizes: ['Small', 'Medium', 'Large'], material: 'Bouclé', tags: ['bestseller'], categorySlug: 'living', categoryName: 'Living' }),
    product({ i: 4, title: 'Handwoven Wool Rug — 200×300', price: 890, vendor: 'Loomfield', photo: 'photo-1600166898405-da9535204843', rating: 4.5, reviews: 176, currency: CUR, colors: ['Ivory', 'Brass'], sizes: ['2-seat', '3-seat', '4-seat'], material: 'Linen', tags: ['handmade'], categorySlug: 'rugs', categoryName: 'Rugs' }),
    product({ i: 5, title: 'Ceramic Table Lamp — Clay', price: 185, vendor: 'Kiln & Co', photo: 'photo-1513506003901-1e6a229e2d15', rating: 4.7, reviews: 289, currency: CUR, colors: ['Oatmeal', 'Sage'], sizes: ['King', 'Queen', 'Double'], material: 'Rattan', tags: ['quick-ship'], categorySlug: 'lighting', categoryName: 'Lighting' }),
    product({ i: 6, title: 'Solid Ash Bed Frame — King', price: 1240, vendor: 'Fernwood', photo: 'photo-1522708323590-d24dbb6b0267', rating: 4.6, reviews: 204, currency: CUR, colors: ['Walnut', 'Oak'], sizes: ['Small', 'Medium', 'Large'], material: 'Stoneware', tags: ['fsc-certified'], categorySlug: 'bedroom', categoryName: 'Bedroom' }),
    product({ i: 7, title: 'Linen Bedding Set — Sage', price: 240, was: 300, vendor: 'Loomfield', photo: 'photo-1586023492125-27b2c045efd7', rating: 4.8, reviews: 612, badge: 'Save 20%', currency: CUR, colors: ['Terracotta', 'Clay'], sizes: ['2-seat', '3-seat', '4-seat'], material: 'Wool', tags: ['made-to-order'], categorySlug: 'textiles', categoryName: 'Textiles' }),
    product({ i: 8, title: 'Walnut Sideboard — Four Door', price: 1680, vendor: 'Fernwood', photo: 'photo-1538688525198-9b88f6f53126', rating: 4.7, reviews: 98, currency: CUR, colors: ['Ivory', 'Brass'], sizes: ['King', 'Queen', 'Double'], material: 'Solid oak', tags: ['bestseller'], categorySlug: 'storage', categoryName: 'Storage' }),
    product({ i: 9, title: 'Stoneware Dinner Set — Six Place', price: 195, vendor: 'Kiln & Co', photo: 'photo-1516223725307-6f76b9ec8742', rating: 4.4, reviews: 421, currency: CUR, colors: ['Oatmeal', 'Sage'], sizes: ['Small', 'Medium', 'Large'], material: 'Walnut', tags: ['handmade'], categorySlug: 'tableware', categoryName: 'Tableware' }),
    product({ i: 10, title: 'Boucle Accent Chair — Ivory', price: 720, vendor: 'Hearth', photo: 'photo-1567538096630-e0c55bd6374c', rating: 4.5, reviews: 187, currency: CUR, colors: ['Walnut', 'Oak'], sizes: ['2-seat', '3-seat', '4-seat'], material: 'Bouclé', tags: ['quick-ship'], categorySlug: 'living', categoryName: 'Living' }),
    product({ i: 11, title: 'Oak Bookshelf — Five Tier', price: 540, vendor: 'Fernwood', photo: 'photo-1594620302200-9a762244a156', rating: 4.6, reviews: 253, currency: CUR, colors: ['Terracotta', 'Clay'], sizes: ['King', 'Queen', 'Double'], material: 'Linen', tags: ['fsc-certified'], categorySlug: 'storage', categoryName: 'Storage' }),
    product({ i: 12, title: 'Brass Floor Lamp — Arc', price: 395, vendor: 'Kiln & Co', photo: 'photo-1507473885765-e6ed057f782c', rating: 4.3, reviews: 144, currency: CUR, colors: ['Ivory', 'Brass'], sizes: ['Small', 'Medium', 'Large'], material: 'Rattan', tags: ['made-to-order'], categorySlug: 'lighting', categoryName: 'Lighting' }),
    product({ i: 13, title: 'Jute Storage Basket — Large', price: 78, vendor: 'Loomfield', photo: 'photo-1524758631624-e2822e304c36', rating: 4.5, reviews: 366, currency: CUR, colors: ['Oatmeal', 'Sage'], sizes: ['2-seat', '3-seat', '4-seat'], material: 'Stoneware', tags: ['bestseller'], categorySlug: 'baskets', categoryName: 'Baskets' }),
    product({ i: 14, title: 'Marble Coffee Table — Round', price: 980, vendor: 'Hearth', photo: 'photo-1533090161767-e6ffed986c88', rating: 4.7, reviews: 129, badge: 'New', currency: CUR, colors: ['Walnut', 'Oak'], sizes: ['King', 'Queen', 'Double'], material: 'Wool', tags: ['handmade'], categorySlug: 'living', categoryName: 'Living' }),
    product({ i: 15, title: 'Cotton Throw — Herringbone', price: 120, vendor: 'Loomfield', photo: 'photo-1616486338812-3dadae4b4ace', rating: 4.6, reviews: 498, currency: CUR, colors: ['Terracotta', 'Clay'], sizes: ['Small', 'Medium', 'Large'], material: 'Solid oak', tags: ['quick-ship'], categorySlug: 'textiles', categoryName: 'Textiles' }),
    product({ i: 16, title: 'Teak Outdoor Dining Bench', price: 640, vendor: 'Fernwood', photo: 'photo-1595428774223-ef52624120d2', rating: 4.4, reviews: 87, soldOut: true, currency: CUR, colors: ['Ivory', 'Brass'], sizes: ['2-seat', '3-seat', '4-seat'], material: 'Walnut', tags: ['fsc-certified'], categorySlug: 'outdoor', categoryName: 'Outdoor' }),
  ],
  categories: [
    category('c1', 'Living', 'living', 'photo-1555041469-a586c61ea9bc', '64 products'),
    category('c2', 'Dining', 'dining', 'photo-1567016432779-094069958ea5', '48 products'),
    category('c3', 'Bedroom', 'bedroom', 'photo-1522708323590-d24dbb6b0267', '52 products'),
    category('c4', 'Storage', 'storage', 'photo-1538688525198-9b88f6f53126', '37 products'),
    category('c5', 'Lighting', 'lighting', 'photo-1507473885765-e6ed057f782c', '41 products'),
    category('c6', 'Rugs', 'rugs', 'photo-1600166898405-da9535204843', '29 products'),
    category('c7', 'Textiles', 'textiles', 'photo-1586023492125-27b2c045efd7', '58 products'),
    category('c8', 'Tableware', 'tableware', 'photo-1516223725307-6f76b9ec8742', '46 products'),
    category('c9', 'Outdoor', 'outdoor', 'photo-1595428774223-ef52624120d2', '24 products'),
    category('c10', 'Office', 'office', 'photo-1594620302200-9a762244a156', '19 products'),
    category('c11', 'Baskets', 'baskets', 'photo-1524758631624-e2822e304c36', '22 products'),
    category('c12', 'Accessories', 'accessories', 'photo-1513506003901-1e6a229e2d15', '73 products'),
  ],
  brands: [
    { name: 'HEARTH', note: 'House upholstery' },
    { name: 'FERNWOOD', note: 'Solid timber' },
    { name: 'LOOMFIELD', note: 'Textiles & rugs' },
    { name: 'KILN & CO', note: 'Ceramics & lighting' },
    { name: 'HALLOW', note: 'Outdoor' },
    { name: 'TERRA', note: 'Stoneware' },
    { name: 'BIRCHWAY', note: 'Storage' },
    { name: 'MOORLAND', note: 'Wool' },
    { name: 'CANTEEN', note: 'Tableware' },
    { name: 'STILLWATER', note: 'Bathroom' },
    { name: 'ORCHARD', note: 'Kitchen' },
    { name: 'GABLE', note: 'Beds' },
  ],
  testimonials: [
    { quote: 'The sofa arrived exactly when they said, and the two-person delivery team took the packaging away with them.', author: 'Amara', detail: 'Lisbon · Alder Sofa', rating: 5 },
    { quote: 'I ordered swatches first, which saved me from a colour I would have regretted. The oatmeal is spot on.', author: 'Ben', detail: 'Leeds · Alder Sofa', rating: 5 },
    { quote: 'Solid oak, properly finished, and the dimensions on the site matched to the millimetre.', author: 'Noor', detail: 'Dubai · Fernwood Table', rating: 5 },
    { quote: 'Assembly took twenty minutes with the supplied tool. Instructions were actually legible.', author: 'Sofia', detail: 'Milan · Oak Bookshelf', rating: 5 },
    { quote: 'The rug sheds a little in the first month, which they warned me about. Settled down exactly as described.', author: 'James', detail: 'Bristol · Wool Rug', rating: 4 },
    { quote: 'Second room furnished from here. The pieces sit together properly because the palette is disciplined.', author: 'Yuki', detail: 'Osaka', rating: 5 },
    { quote: 'Linen softened beautifully after three washes, just as the care guide said it would.', author: 'Clara', detail: 'Copenhagen · Linen Bedding', rating: 5 },
    { quote: 'Delivery slot was a four-hour window rather than a day. That mattered more than I expected.', author: 'Idris', detail: 'Manchester · Walnut Sideboard', rating: 5 },
  ],
  faqs: [
    { question: 'How is large furniture delivered?', answer: 'Two-person delivery to the room of your choice, with packaging taken away. You will be offered a four-hour window to confirm.' },
    { question: 'Can I order fabric swatches?', answer: 'Yes — up to five swatches free of charge, so you can see a colour in your own light before committing.' },
    { question: 'What are the lead times?', answer: 'In-stock items ship within two business days. Made-to-order upholstery is six to eight weeks, shown on each product page.' },
    { question: 'Do you take away my old furniture?', answer: 'Removal and recycling can be added at checkout for most large items where local services allow it.' },
    { question: 'What warranty do you offer?', answer: 'Five years on frames and solid timber, two years on upholstery, mechanisms and finishes.' },
    { question: 'Can I return a bulky item?', answer: 'Yes, within 30 days. Return collection for large furniture carries a charge, shown before you confirm the return.' },
    { question: 'Is your timber responsibly sourced?', answer: 'All solid timber is FSC-certified and we publish the mill region for each range.' },
    { question: 'How do I care for solid wood?', answer: 'Keep it out of direct sun and away from radiators, and re-oil once a year with the kit we supply. The care guide has the detail.' },
    { question: 'Will the colour match my existing pieces?', answer: 'Timber and natural fibres vary between batches. Order a swatch, and where we know a range varies noticeably we say so on the page.' },
    { question: 'Do you offer interior design help?', answer: 'A free 30-minute consultation is available for orders over $2,000 — book it from your account after ordering.' },
    { question: 'Can I assemble items myself?', answer: 'Most pieces are flat-packed with tools included. Beds and wardrobes have an optional assembly service at checkout.' },
    { question: 'Do you deliver outside the country?', answer: 'Small items ship internationally. Large furniture is domestic only at present — we would rather say so than take an order we cannot fulfil well.' },
  ],
  announcements: [
    'Free two-person delivery on orders over $1,500',
    'Order up to five fabric swatches, free',
    'Five-year frame warranty · 30-day returns',
  ],
};
