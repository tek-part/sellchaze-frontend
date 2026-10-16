import { HiOutlineArrowPath, HiOutlineBell, HiOutlineChatBubbleLeftRight, HiOutlineCheckBadge, HiOutlineCreditCard, HiOutlineCube, HiOutlineCursorArrowRays, HiOutlineGift, HiOutlineGlobeAlt, HiOutlineHandThumbUp, HiOutlineHeart, HiOutlineMapPin, HiOutlineQuestionMarkCircle, HiOutlineShieldCheck, HiOutlineStar, HiOutlineTruck } from 'react-icons/hi2';

import { FaCog } from 'react-icons/fa';

const icons = { gear: FaCog, truck: HiOutlineTruck, box: HiOutlineCube, shield: HiOutlineShieldCheck, support: HiOutlineChatBubbleLeftRight, gift: HiOutlineGift, card: HiOutlineCreditCard, returns: HiOutlineArrowPath, location: HiOutlineMapPin, star: HiOutlineStar, globe: HiOutlineGlobeAlt, bell: HiOutlineBell, like: HiOutlineHandThumbUp, touch: HiOutlineCursorArrowRays, badge: HiOutlineCheckBadge, heart: HiOutlineHeart, help: HiOutlineQuestionMarkCircle };
export const storeFeatureIcons = [
  ['gear', 'ترس'], ['truck', 'شحن'], ['box', 'طرد'], ['shield', 'حماية'], ['support', 'محادثة'], ['gift', 'هدية'], ['card', 'بطاقة'], ['returns', 'استبدال'], ['location', 'موقع'], ['star', 'نجمة'], ['globe', 'العالم'], ['bell', 'إشعارات'], ['like', 'إعجاب'], ['touch', 'تحكم'], ['badge', 'شارة'], ['heart', 'قلب'], ['help', 'مساعدة'],
] as const;
export function StoreFeatureIcon({ name }: { name?: string }) {
  const Icon = name && Object.hasOwn(icons, name) ? icons[name as keyof typeof icons] : null;
  return Icon ? <Icon aria-hidden /> : name ? <span className="lp-feature-symbol" aria-hidden>{name}</span> : null;
}
