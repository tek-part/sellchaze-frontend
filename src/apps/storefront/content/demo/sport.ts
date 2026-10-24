/**
 * Sportswear demo catalogue — shoes, training apparel and kit (previews the Stride theme).
 *
 * Voice: direct and spec-led, the way sport retail sells: what the shoe is for, what it is made of,
 * what sizes are left. Shoes run EU 39–46 and apparel XS–XXL; every product carries colourways so
 * Stride's colour dots have something to show, a few carry a real stock count (2–3 left) for its
 * low-stock badge, one is sold out, and two are marked New.
 *
 * Order is deliberate: in preview every collection resolves to this one list, and Stride's kit
 * builder fills its three slots with the 1st, 3rd and 5th in-stock products — so those are a shoe,
 * the socks and the duffel, and the demo kit reads shoe + socks + bag rather than three trainers.
 * Product ids (`p1`…) follow the product, not its position, so the Arabic overlay stays keyed.
 *
 * Photography: Unsplash (free licence), each id checked to return 200 and viewed to confirm it shows
 * the product it is attached to; shots dominated by a sportswear brand's logo were left out.
 */
import { category, product, type DemoCatalog } from './types';

const CUR = 'USD';
const SHOE = ['39', '40', '41', '42', '43', '44', '45', '46'];
const FIT = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export const SPORT_CATALOG: DemoCatalog = {
  vertical: 'sportswear',
  currency: CUR,
  products: [
    product({ i: 1, title: 'Velo Knit Road Runner', price: 129, vendor: 'Velo', photo: 'photo-1562183241-b937e95585b6', rating: 4.8, reviews: 412, badge: 'New', currency: CUR, colors: ['Grey', 'Volt', 'Black'], sizes: SHOE, material: 'Engineered knit', tags: ['road', 'neutral'], categorySlug: 'running', categoryName: 'Running' }),
    product({ i: 2, title: 'Ridge Trail Runner', price: 149, vendor: 'Terra Trail', photo: 'photo-1673726803855-695741a96051', rating: 4.6, reviews: 188, stock: 3, currency: CUR, colors: ['White', 'Black', 'Volt'], sizes: SHOE, material: 'Ripstop mesh', tags: ['trail', 'grip'], categorySlug: 'running', categoryName: 'Running' }),
    product({ i: 15, title: 'Cushioned Crew Socks — 3 Pack', price: 19, vendor: 'Pace & Co', photo: 'photo-1597843797221-e34b4a320b97', rating: 4.8, reviews: 843, stock: 3, currency: CUR, colors: ['Sand', 'White', 'Black'], sizes: ['S 36–39', 'M 40–43', 'L 44–47'], material: 'Cotton blend', tags: ['cushioned'], categorySlug: 'accessories', categoryName: 'Accessories' }),
    product({ i: 4, title: 'Pulse Knit Training Shoe', price: 109, vendor: 'Kinetik', photo: 'photo-1562046433-dd0db5baddcd', rating: 4.6, reviews: 221, currency: CUR, colors: ['Purple', 'Black', 'Pink'], sizes: SHOE, material: 'Knit', tags: ['hiit', 'lightweight'], categorySlug: 'training', categoryName: 'Training' }),
    product({ i: 17, title: 'Gym Duffel — 40 L', price: 65, vendor: 'Carryall', photo: 'photo-1699319656128-6e353d6b9c7c', rating: 4.8, reviews: 201, currency: CUR, colors: ['Black'], material: 'Ripstop nylon', tags: ['shoe-pocket'], categorySlug: 'accessories', categoryName: 'Accessories' }),
    product({ i: 7, title: 'Firm-Ground Speed Football Boot', price: 169, vendor: 'Rally', photo: 'photo-1704411616472-1f3ffeb4f979', rating: 4.7, reviews: 143, stock: 2, currency: CUR, colors: ['Fuchsia', 'Teal'], sizes: SHOE, material: 'Synthetic upper', tags: ['firm-ground'], categorySlug: 'football', categoryName: 'Football' }),
    product({ i: 8, title: 'Elevate High-Top Basketball Shoe', price: 139, vendor: 'Courtside', photo: 'photo-1631984564919-1f6b2313a71c', rating: 4.6, reviews: 97, stock: 3, currency: CUR, colors: ['Black', 'Orange', 'Sky'], sizes: SHOE, material: 'Mesh & TPU', tags: ['indoor', 'ankle-support'], categorySlug: 'basketball', categoryName: 'Basketball' }),
    product({ i: 9, title: 'Seamless High-Rise Leggings', price: 59, vendor: 'Forma', photo: 'photo-1763771522867-c26bf75f12bc', rating: 4.9, reviews: 621, currency: CUR, colors: ['Sand', 'Sky', 'Mustard', 'Black'], sizes: FIT, material: 'Nylon-elastane', tags: ['squat-proof'], categorySlug: 'apparel', categoryName: 'Apparel' }),
    product({ i: 10, title: 'Medium-Support Sports Bra', price: 39, vendor: 'Forma', photo: 'photo-1788463127138-01e87414a936', rating: 4.9, reviews: 388, currency: CUR, colors: ['Pink', 'Black', 'Grey'], sizes: FIT, material: 'Nylon-elastane', tags: ['medium-support'], categorySlug: 'apparel', categoryName: 'Apparel' }),
    product({ i: 3, title: 'Everyday Gym Trainer', price: 89, was: 109, vendor: 'Kinetik', photo: 'photo-1577982886439-c25dc08b0c01', rating: 4.5, reviews: 534, badge: 'Save 18%', currency: CUR, colors: ['White', 'Black'], sizes: SHOE, material: 'Mesh', tags: ['gym', 'stable'], categorySlug: 'training', categoryName: 'Training' }),
    product({ i: 5, title: 'Retro Runner 90', price: 119, vendor: 'Northline', photo: 'photo-1560769629-975ec94e6a86', rating: 4.7, reviews: 309, badge: 'New', currency: CUR, colors: ['White', 'Teal', 'Orange'], sizes: SHOE, material: 'Suede & mesh', tags: ['lifestyle'], categorySlug: 'lifestyle', categoryName: 'Lifestyle' }),
    product({ i: 6, title: 'Club Leather Court Sneaker', price: 99, vendor: 'Northline', photo: 'photo-1603808033192-082d6919d3e1', rating: 4.4, reviews: 156, currency: CUR, colors: ['White', 'Sand'], sizes: SHOE, material: 'Leather', tags: ['lifestyle'], categorySlug: 'lifestyle', categoryName: 'Lifestyle' }),
    product({ i: 11, title: 'Colour-Block Track Jacket', price: 89, vendor: 'Motus', photo: 'photo-1571867424485-369464ed33cc', rating: 4.5, reviews: 142, currency: CUR, colors: ['Purple', 'Orange'], sizes: FIT, material: 'Recycled polyester', tags: ['windproof'], categorySlug: 'apparel', categoryName: 'Apparel' }),
    product({ i: 12, title: 'Heavyweight Fleece Hoodie', price: 69, vendor: 'Motus', photo: 'photo-1620799140188-3b2a02fd9a77', rating: 4.7, reviews: 907, currency: CUR, colors: ['White', 'Grey', 'Black'], sizes: FIT, material: 'Cotton fleece', tags: ['400gsm'], categorySlug: 'apparel', categoryName: 'Apparel' }),
    product({ i: 13, title: 'Tapered Fleece Joggers', price: 55, vendor: 'Motus', photo: 'photo-1789110520164-2389992e5d0f', rating: 4.6, reviews: 298, soldOut: true, currency: CUR, colors: ['Grey', 'Black'], sizes: FIT, material: 'Cotton fleece', tags: ['tapered'], categorySlug: 'apparel', categoryName: 'Apparel' }),
    product({ i: 14, title: '7-Inch Training Shorts', price: 35, was: 45, vendor: 'Forma', photo: 'photo-1719473442915-016f3ebda79a', rating: 4.5, reviews: 176, badge: 'Save 22%', currency: CUR, colors: ['Grey', 'Charcoal', 'White', 'Black'], sizes: FIT, material: 'Quick-dry polyester', tags: ['zip-pocket'], categorySlug: 'apparel', categoryName: 'Apparel' }),
    product({ i: 16, title: 'Insulated Steel Bottle — 750 ml', price: 29, vendor: 'Hydra', photo: 'photo-1602143407151-7111542de6e8', rating: 4.7, reviews: 356, currency: CUR, colors: ['Green', 'Black', 'White'], sizes: ['500 ml', '750 ml'], material: 'Stainless steel', tags: ['24h-cold'], categorySlug: 'accessories', categoryName: 'Accessories' }),
  ],
  categories: [
    category('c1', 'Running', 'running', 'photo-1786181321837-4fe85242d17c', '64 styles'),
    category('c2', 'Training', 'training', 'photo-1584735935682-2f2b69dff9d2', '52 styles'),
    category('c3', 'Football', 'football', 'photo-1789925941495-3af02891b48d', '31 styles'),
    category('c4', 'Basketball', 'basketball', 'photo-1546519638-68e109498ffc', '24 styles'),
    category('c5', 'Lifestyle', 'lifestyle', 'photo-1574565083763-40de4ea4cd9b', '47 styles'),
    category('c6', 'Apparel', 'apparel', 'photo-1699275303942-47957eea44b1', '118 styles'),
    category('c7', 'Accessories', 'accessories', 'photo-1516876345887-6dd74f80787a', '73 styles'),
  ],
  brands: [
    { name: 'SELLCHAZE SPORT', note: 'The house' },
    { name: 'VELO', note: 'Road running' },
    { name: 'TERRA TRAIL', note: 'Trail' },
    { name: 'KINETIK', note: 'Gym & HIIT' },
    { name: 'NORTHLINE', note: 'Lifestyle' },
    { name: 'RALLY', note: 'Football' },
    { name: 'COURTSIDE', note: 'Basketball' },
    { name: 'FORMA', note: 'Women’s training' },
    { name: 'MOTUS', note: 'Fleece & layers' },
    { name: 'PACE & CO', note: 'Socks' },
    { name: 'HYDRA', note: 'Bottles' },
    { name: 'CARRYALL', note: 'Bags' },
  ],
  testimonials: [
    { quote: 'Ran my first half marathon in them straight out of the box. No hot spots, no blisters.', author: 'Verified buyer', detail: 'Velo Knit Road Runner', rating: 5 },
    { quote: 'The size guide was spot on — I went half a size up as it suggested and the fit is perfect.', author: 'Verified buyer', detail: 'Ridge Trail Runner', rating: 5 },
    { quote: 'Squat-proof as promised and the waistband stays put through a full class.', author: 'Verified buyer', detail: 'Seamless High-Rise Leggings', rating: 5 },
    { quote: 'Took two days to arrive and the boot needed almost no breaking in.', author: 'Verified buyer', detail: 'Firm-Ground Football Boot', rating: 5 },
    { quote: 'Heavy, warm and the hood actually holds its shape after washing.', author: 'Verified buyer', detail: 'Heavyweight Fleece Hoodie', rating: 5 },
    { quote: 'Exchanged a size in the app and the courier swapped them at my door.', author: 'Verified buyer', detail: 'Everyday Gym Trainer', rating: 4 },
    { quote: 'Ice still in the bottle after a full day at the beach. Worth it.', author: 'Verified buyer', detail: 'Insulated Steel Bottle', rating: 5 },
    { quote: 'Separate shoe pocket keeps the gym kit away from my work clothes. Simple and solid.', author: 'Verified buyer', detail: 'Gym Duffel — 40 L', rating: 5 },
  ],
  faqs: [
    { question: 'How do your shoe sizes run?', answer: 'Shoes are listed in EU sizes and run true to size. Each product page has a centimetre chart; between sizes, go up half a size for running.' },
    { question: 'Can I exchange a size?', answer: 'Yes — free size exchanges within 30 days on unworn items. Book it from your order page and the courier swaps it at your door.' },
    { question: 'Which running shoe should I choose?', answer: 'Road shoes for pavement and treadmills, trail shoes for sand, gravel and hills. If you are unsure, our team will advise on chat.' },
    { question: 'Are football boots suitable for artificial pitches?', answer: 'Firm-ground boots are made for natural grass. For artificial pitches choose an AG or turf model to protect the studs and your joints.' },
    { question: 'How fast is delivery?', answer: 'Next-day delivery in major cities for orders before 4 pm; two to four working days elsewhere.' },
    { question: 'Is shipping free?', answer: 'Free on orders over $75. Below that a flat delivery fee is shown at checkout before you pay.' },
    { question: 'Can I pay cash on delivery?', answer: 'Yes, cash or card on delivery is available, alongside online card payment and instalments.' },
    { question: 'What does "low stock" mean?', answer: 'It is the real number of units left in that product across sizes. When it reaches zero the product is marked sold out.' },
    { question: 'How do I wash performance wear?', answer: 'Cold machine wash inside out, no fabric softener, and hang to dry. Softener clogs the fibres that move sweat away.' },
    { question: 'Do you restock sold-out styles?', answer: 'Core styles are restocked every season. Tap "notify me" on the product page and we will message you when your size is back.' },
    { question: 'Are your leggings squat-proof?', answer: 'Yes. Every legging is stretch-tested for opacity before it is listed, and the product page says so only when it passes.' },
    { question: 'Do you sell team kits?', answer: 'We supply clubs and schools with printed kits from 10 pieces. Contact us with your colours and quantities for a quote.' },
  ],
  announcements: [
    'Free delivery on orders over $75',
    'Free size exchanges for 30 days — collected from your door',
    'New drop every Thursday',
  ],
};
