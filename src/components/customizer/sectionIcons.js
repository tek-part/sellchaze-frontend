import {
    HiOutlineArrowsRightLeft,
    HiOutlineBars3,
    HiOutlineBars3BottomLeft,
    HiOutlineBell,
    HiOutlineBolt,
    HiOutlineBookOpen,
    HiOutlineBuildingStorefront,
    HiOutlineChatBubbleBottomCenterText,
    HiOutlineChatBubbleLeftRight,
    HiOutlineCheckBadge,
    HiOutlineClock,
    HiOutlineCube,
    HiOutlineCurrencyDollar,
    HiOutlineDevicePhoneMobile,
    HiOutlineDocumentText,
    HiOutlineEnvelope,
    HiOutlineFilm,
    HiOutlineFire,
    HiOutlineGift,
    HiOutlineGlobeAlt,
    HiOutlineHashtag,
    HiOutlineHeart,
    HiOutlineHome,
    HiOutlineInformationCircle,
    HiOutlineLightBulb,
    HiOutlineLink,
    HiOutlineListBullet,
    HiOutlineMapPin,
    HiOutlineMegaphone,
    HiOutlineMinus,
    HiOutlineNewspaper,
    HiOutlinePaintBrush,
    HiOutlinePhone,
    HiOutlinePhoto,
    HiOutlinePlayCircle,
    HiOutlinePresentationChartLine,
    HiOutlineQuestionMarkCircle,
    HiOutlineQueueList,
    HiOutlineRectangleGroup,
    HiOutlineRectangleStack,
    HiOutlineRocketLaunch,
    HiOutlineShare,
    HiOutlineShieldCheck,
    HiOutlineShoppingBag,
    HiOutlineShoppingCart,
    HiOutlineSparkles,
    HiOutlineSquare3Stack3D,
    HiOutlineSquares2X2,
    HiOutlineSquaresPlus,
    HiOutlineStar,
    HiOutlineSwatch,
    HiOutlineTableCells,
    HiOutlineTag,
    HiOutlineTicket,
    HiOutlineTruck,
    HiOutlineUserGroup,
    HiOutlineUsers,
    HiOutlineVideoCamera,
    HiOutlineViewColumns,
    HiOutlineWindow,
} from 'react-icons/hi2';

/**
 * Dynamic icon map for section schemas (contract §1 `SectionSchema.icon` = a react-icons/hi2
 * name such as 'HiOutlinePhoto'). A curated map keeps the customizer chunk small — the full
 * hi2 namespace is ~600KB. Unknown names fall back to a category icon.
 */
export const ICON_MAP = {
    HiOutlineArrowsRightLeft, HiOutlineBars3, HiOutlineBars3BottomLeft, HiOutlineBell, HiOutlineBolt, HiOutlineBookOpen,
    HiOutlineBuildingStorefront, HiOutlineChatBubbleBottomCenterText, HiOutlineChatBubbleLeftRight, HiOutlineCheckBadge,
    HiOutlineClock, HiOutlineCube, HiOutlineCurrencyDollar, HiOutlineDevicePhoneMobile, HiOutlineDocumentText,
    HiOutlineEnvelope, HiOutlineFilm, HiOutlineFire, HiOutlineGift, HiOutlineGlobeAlt, HiOutlineHashtag, HiOutlineHeart,
    HiOutlineHome, HiOutlineInformationCircle, HiOutlineLightBulb, HiOutlineLink, HiOutlineListBullet, HiOutlineMapPin,
    HiOutlineMegaphone, HiOutlineMinus, HiOutlineNewspaper, HiOutlinePaintBrush, HiOutlinePhone, HiOutlinePhoto,
    HiOutlinePlayCircle, HiOutlinePresentationChartLine, HiOutlineQuestionMarkCircle, HiOutlineQueueList,
    HiOutlineRectangleGroup, HiOutlineRectangleStack, HiOutlineRocketLaunch, HiOutlineShare, HiOutlineShieldCheck,
    HiOutlineShoppingBag, HiOutlineShoppingCart, HiOutlineSparkles, HiOutlineSquare3Stack3D, HiOutlineSquares2X2,
    HiOutlineSquaresPlus, HiOutlineStar, HiOutlineSwatch, HiOutlineTableCells, HiOutlineTag, HiOutlineTicket,
    HiOutlineTruck, HiOutlineUserGroup, HiOutlineUsers, HiOutlineVideoCamera, HiOutlineViewColumns, HiOutlineWindow,
};

const CATEGORY_ICON = {
    hero: HiOutlinePhoto,
    products: HiOutlineShoppingBag,
    categories: HiOutlineSquares2X2,
    content: HiOutlineDocumentText,
    marketing: HiOutlineMegaphone,
    social: HiOutlineShare,
    layout: HiOutlineViewColumns,
};

/** Resolve a schema's icon component: explicit `icon` name → category fallback → generic. */
export function sectionIcon(schema) {
    const name = schema?.icon;
    if (name && ICON_MAP[name]) return ICON_MAP[name];
    // Tolerate the solid variant name for an outline icon we ship.
    if (name && ICON_MAP[name.replace(/^Hi(?!Outline)/, 'HiOutline')]) return ICON_MAP[name.replace(/^Hi(?!Outline)/, 'HiOutline')];
    return CATEGORY_ICON[schema?.category] || HiOutlineSquares2X2;
}

export const categoryIcon = (category) => CATEGORY_ICON[category] || HiOutlineSquares2X2;
