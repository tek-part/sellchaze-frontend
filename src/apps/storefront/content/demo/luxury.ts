/**
 * Luxury Fashion demo catalogue — ready-to-wear and leather goods.
 *
 * Voice: restrained and specific. Editorial fashion copy earns trust by naming the cloth, the mill
 * and the construction rather than reaching for superlatives.
 */
import { category, product, type DemoCatalog } from './types';

const CUR = 'USD';

export const LUXURY_CATALOG: DemoCatalog = {
  vertical: 'fashion',
  currency: CUR,
  products: [
    product({ i: 1, title: 'Wool-Cashmere Overcoat', price: 890, vendor: 'Maison Selchase', photo: 'photo-1490481651871-ab68de25d43d', hover: 'photo-1483985988355-763728e1935b', rating: 4.8, reviews: 164, badge: 'Best seller', currency: CUR, colors: ['Ivory', 'Camel', 'Black'], sizes: ['XS', 'S', 'M', 'L', 'XL'], material: 'Wool', tags: ['new-season'], categorySlug: 'outerwear', categoryName: 'Outerwear' }),
    product({ i: 2, title: 'Silk Column Dress', price: 620, vendor: 'Maison Selchase', photo: 'photo-1595777457583-95e059d581b8', rating: 4.7, reviews: 218, currency: CUR, colors: ['Black', 'Navy'], sizes: ['S', 'M', 'L'], material: 'Cashmere', tags: ['bestseller'], categorySlug: 'dresses', categoryName: 'Dresses' }),
    product({ i: 3, title: 'Double-Pleat Tailored Trouser', price: 340, was: 420, vendor: 'Atelier Nord', photo: 'photo-1594633312681-425c7b97ccd1', rating: 4.6, reviews: 342, badge: 'Save 19%', currency: CUR, colors: ['Charcoal', 'Ivory'], sizes: ['36', '38', '40', '42'], material: 'Silk', tags: ['made-in-italy'], categorySlug: 'trousers', categoryName: 'Trousers' }),
    product({ i: 4, title: 'Ribbed Cashmere Knit', price: 390, vendor: 'Maison Selchase', photo: 'photo-1523381210434-271e8be1f52b', rating: 4.9, reviews: 587, currency: CUR, colors: ['Camel', 'Oatmeal'], sizes: ['XS', 'S', 'M', 'L', 'XL'], material: 'Linen', tags: ['limited'], categorySlug: 'knitwear', categoryName: 'Knitwear' }),
    product({ i: 5, title: 'Leather Ankle Boot', price: 520, vendor: 'Carrera', photo: 'photo-1543163521-1bf539c55dd2', rating: 4.5, reviews: 276, currency: CUR, colors: ['Ivory', 'Camel', 'Black'], sizes: ['S', 'M', 'L'], material: 'Cotton', tags: ['sustainable'], categorySlug: 'shoes', categoryName: 'Shoes' }),
    product({ i: 6, title: 'Pleated Midi Skirt', price: 285, vendor: 'Atelier Nord', photo: 'photo-1591369822096-ffd140ec948f', rating: 4.4, reviews: 198, currency: CUR, colors: ['Black', 'Navy'], sizes: ['36', '38', '40', '42'], material: 'Leather', tags: ['new-season'], categorySlug: 'skirts', categoryName: 'Skirts' }),
    product({ i: 7, title: 'Structured Wool Blazer', price: 640, vendor: 'Maison Selchase', photo: 'photo-1592878904946-b3cd8ae243d0', rating: 4.7, reviews: 231, currency: CUR, colors: ['Charcoal', 'Ivory'], sizes: ['XS', 'S', 'M', 'L', 'XL'], material: 'Wool', tags: ['bestseller'], categorySlug: 'tailoring', categoryName: 'Tailoring' }),
    product({ i: 8, title: 'Merino Roll-Neck', price: 220, vendor: 'Atelier Nord', photo: 'photo-1516762689617-e1cffcef479d', rating: 4.6, reviews: 654, currency: CUR, colors: ['Camel', 'Oatmeal'], sizes: ['S', 'M', 'L'], material: 'Cashmere', tags: ['made-in-italy'], categorySlug: 'knitwear', categoryName: 'Knitwear' }),
    product({ i: 9, title: 'Structured Leather Tote', price: 780, vendor: 'Carrera', photo: 'photo-1584917865442-de89df76afd3', rating: 4.8, reviews: 312, badge: 'New', currency: CUR, colors: ['Ivory', 'Camel', 'Black'], sizes: ['36', '38', '40', '42'], material: 'Silk', tags: ['limited'], categorySlug: 'bags', categoryName: 'Bags' }),
    product({ i: 10, title: 'Cotton Poplin Shirt', price: 180, was: 240, vendor: 'Atelier Nord', photo: 'photo-1596755094514-f87e34085b2c', rating: 4.5, reviews: 489, badge: 'Save 25%', currency: CUR, colors: ['Black', 'Navy'], sizes: ['XS', 'S', 'M', 'L', 'XL'], material: 'Linen', tags: ['sustainable'], categorySlug: 'shirting', categoryName: 'Shirting' }),
    product({ i: 11, title: 'Belted Trench Coat', price: 720, vendor: 'Maison Selchase', photo: 'photo-1539533018447-63fcce2678e3', rating: 4.7, reviews: 176, currency: CUR, colors: ['Charcoal', 'Ivory'], sizes: ['S', 'M', 'L'], material: 'Cotton', tags: ['new-season'], categorySlug: 'outerwear', categoryName: 'Outerwear' }),
    product({ i: 12, title: 'Silk Scarf — Hand-Rolled', price: 165, vendor: 'Carrera', photo: 'photo-1601924994987-69e26d50dc26', rating: 4.6, reviews: 224, currency: CUR, colors: ['Camel', 'Oatmeal'], sizes: ['36', '38', '40', '42'], material: 'Leather', tags: ['bestseller'], categorySlug: 'accessories', categoryName: 'Accessories' }),
    product({ i: 13, title: 'Wide-Leg Linen Trouser', price: 260, vendor: 'Atelier Nord', photo: 'photo-1552902865-b72c031ac5ea', rating: 4.4, reviews: 301, currency: CUR, colors: ['Ivory', 'Camel', 'Black'], sizes: ['XS', 'S', 'M', 'L', 'XL'], material: 'Wool', tags: ['made-in-italy'], categorySlug: 'trousers', categoryName: 'Trousers' }),
    product({ i: 14, title: 'Cashmere Wrap Coat', price: 1180, vendor: 'Maison Selchase', photo: 'photo-1519710164239-da123dc03ef4', rating: 4.9, reviews: 94, badge: 'Limited', currency: CUR, colors: ['Black', 'Navy'], sizes: ['S', 'M', 'L'], material: 'Cashmere', tags: ['limited'], categorySlug: 'outerwear', categoryName: 'Outerwear' }),
    product({ i: 15, title: 'Leather Loafer — Hand-Stitched', price: 440, vendor: 'Carrera', photo: 'photo-1533867617858-e7b97e060509', rating: 4.5, reviews: 358, currency: CUR, colors: ['Charcoal', 'Ivory'], sizes: ['36', '38', '40', '42'], material: 'Silk', tags: ['sustainable'], categorySlug: 'shoes', categoryName: 'Shoes' }),
    product({ i: 16, title: 'Fine-Gauge Cardigan', price: 310, vendor: 'Maison Selchase', photo: 'photo-1576871337622-98d48d1cf531', rating: 4.6, reviews: 412, soldOut: true, currency: CUR, colors: ['Camel', 'Oatmeal'], sizes: ['XS', 'S', 'M', 'L', 'XL'], material: 'Linen', tags: ['new-season'], categorySlug: 'knitwear', categoryName: 'Knitwear' }),
  ],
  categories: [
    category('c1', 'New in', 'new-in', 'photo-1490481651871-ab68de25d43d', '32 pieces'),
    category('c2', 'Outerwear', 'outerwear', 'photo-1539533018447-63fcce2678e3', '48 pieces'),
    category('c3', 'Tailoring', 'tailoring', 'photo-1592878904946-b3cd8ae243d0', '41 pieces'),
    category('c4', 'Knitwear', 'knitwear', 'photo-1523381210434-271e8be1f52b', '56 pieces'),
    category('c5', 'Dresses', 'dresses', 'photo-1595777457583-95e059d581b8', '38 pieces'),
    category('c6', 'Shirting', 'shirting', 'photo-1596755094514-f87e34085b2c', '29 pieces'),
    category('c7', 'Trousers', 'trousers', 'photo-1594633312681-425c7b97ccd1', '34 pieces'),
    category('c8', 'Skirts', 'skirts', 'photo-1591369822096-ffd140ec948f', '22 pieces'),
    category('c9', 'Shoes', 'shoes', 'photo-1543163521-1bf539c55dd2', '45 pieces'),
    category('c10', 'Bags', 'bags', 'photo-1584917865442-de89df76afd3', '27 pieces'),
    category('c11', 'Accessories', 'accessories', 'photo-1601924994987-69e26d50dc26', '53 pieces'),
    category('c12', 'The archive', 'archive', 'photo-1519710164239-da123dc03ef4', '18 pieces'),
  ],
  brands: [
    { name: 'MAISON SELCHASE', note: 'The house' },
    { name: 'ATELIER NORD', note: 'Tailoring' },
    { name: 'CARRERA', note: 'Leather goods' },
    { name: 'LINNEA', note: 'Knitwear' },
    { name: 'VESTRA', note: 'Outerwear' },
    { name: 'CORVO', note: 'Shirting' },
    { name: 'ALMA', note: 'Silk' },
    { name: 'RIVA', note: 'Shoes' },
    { name: 'NOVA MILL', note: 'Wool' },
    { name: 'SERRA', note: 'Denim' },
    { name: 'FOND', note: 'Jewellery' },
    { name: 'ÉCRU', note: 'Linen' },
  ],
  testimonials: [
    { quote: 'The coat has been through three winters and still holds its line. It was the last one I needed to buy.', author: 'Verified buyer', detail: 'Wool-Cashmere Overcoat', rating: 5 },
    { quote: 'Sizing advice from the team was precise — they asked what I usually wear and got it right first time.', author: 'Verified buyer', detail: 'Structured Wool Blazer', rating: 5 },
    { quote: 'The cashmere is two-ply and it shows. No pilling after a full season of weekly wear.', author: 'Verified buyer', detail: 'Ribbed Cashmere Knit', rating: 5 },
    { quote: 'Alterations were arranged through the store and the trousers came back perfect.', author: 'Verified buyer', detail: 'Double-Pleat Trouser', rating: 5 },
    { quote: 'Packaging was restrained and entirely recyclable, which I appreciated at this price point.', author: 'Verified buyer', detail: 'Silk Column Dress', rating: 5 },
    { quote: 'The leather has softened beautifully. It looks better now than the day it arrived.', author: 'Verified buyer', detail: 'Structured Leather Tote', rating: 5 },
    { quote: 'Returns were straightforward — printed label, collected from my door, refunded in four days.', author: 'Verified buyer', detail: 'Leather Ankle Boot', rating: 4 },
    { quote: 'I wanted one good trench rather than three mediocre ones. This was the right decision.', author: 'Verified buyer', detail: 'Belted Trench Coat', rating: 5 },
  ],
  faqs: [
    { question: 'How does your sizing run?', answer: 'True to size, with flat garment measurements published on every product page. Where a cut runs generous or slim we say so at the top of the description.' },
    { question: 'Do you offer alterations?', answer: 'Yes — tailoring can be arranged on trousers, jackets and coats. Contact us within 14 days of delivery to book it.' },
    { question: 'What is your returns window?', answer: 'Thirty days from delivery, unworn and with tags attached. Return shipping is complimentary.' },
    { question: 'Is shipping free?', answer: 'Complimentary on orders over $200, tracked and signed for. Express options are shown at checkout.' },
    { question: 'How should I care for cashmere?', answer: 'Air between wears, wash cool with a wool detergent, dry flat and store folded. Never hang knitwear — it distorts the shoulder.' },
    { question: 'Where are your garments made?', answer: 'Predominantly in Portugal and northern Italy. The country of manufacture is stated on each product page.' },
    { question: 'Can I reserve a piece in my size?', answer: 'Sign in and use the size reminder on the product page — you will be notified the moment it is back.' },
    { question: 'Do you restock sold-out pieces?', answer: 'Core pieces are restocked each season. Archive and limited pieces are not — the page will say which it is.' },
    { question: 'Are your materials traceable?', answer: 'Wool and cashmere are traceable to the mill. Where we cannot verify a supply chain we do not make a provenance claim.' },
    { question: 'Do you offer a gift service?', answer: 'Gift wrapping and a handwritten note can be added at checkout at no charge, with prices removed from the packing slip.' },
    { question: 'How do I know a piece will suit me?', answer: 'Every product page lists the model’s height and the size worn, alongside flat measurements, so you can compare against something you own.' },
    { question: 'What if my item arrives damaged?', answer: 'Tell us within 48 hours with a photograph and we will replace it and cover all shipping both ways.' },
  ],
  announcements: [
    'Complimentary shipping on orders over $200',
    'Thirty-day returns, collection from your door',
    'Alterations available on tailoring — ask at checkout',
  ],
};
