import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HiOutlineClock, HiOutlineFaceSmile, HiOutlineFire, HiOutlineHandThumbUp, HiOutlineHeart, HiOutlineShoppingBag, HiOutlineSparkles, HiOutlineTruck } from 'react-icons/hi2';

const RECENTS_KEY = 'sellchaze:emoji-recents';
const RECENTS_MAX = 24;

/**
 * A hand-curated set, weighted for a business network: reactions and
 * celebration first, then commerce, logistics and industry. Each entry is
 * [emoji, keywords] and search matches both English and Arabic keywords.
 */
const CATEGORIES = [
    {
        id: 'smileys',
        Icon: HiOutlineFaceSmile,
        emojis: [
            ['😀', 'grin ابتسامة'], ['😄', 'smile سعيد'], ['😁', 'beam ضحكة'], ['😂', 'joy ضحك'], ['🤣', 'rofl ضحك'],
            ['😊', 'blush خجل'], ['🙂', 'slight ابتسامة'], ['😉', 'wink غمزة'], ['😍', 'love حب'], ['🤩', 'starstruck نجوم'],
            ['😎', 'cool نظارة'], ['🤔', 'thinking تفكير'], ['🤨', 'raised حاجب'], ['😅', 'sweat ارتباك'], ['😇', 'halo ملاك'],
            ['🥰', 'hearts حب'], ['😌', 'relieved ارتياح'], ['🤗', 'hug حضن'], ['🤝', 'handshake اتفاق صفقة'], ['🙏', 'thanks شكر'],
            ['😴', 'sleep نوم'], ['🤯', 'mindblown انفجار'], ['😢', 'cry حزن'], ['😡', 'angry غضب'], ['🥳', 'party احتفال'],
        ],
    },
    {
        id: 'gestures',
        Icon: HiOutlineHandThumbUp,
        emojis: [
            ['👍', 'like تمام'], ['👎', 'dislike رفض'], ['👏', 'clap تصفيق'], ['🙌', 'raise احتفال'], ['💪', 'strong قوة'],
            ['👊', 'fist قبضة'], ['✌️', 'victory نصر'], ['🤞', 'luck حظ'], ['👌', 'ok تمام'], ['🤙', 'call اتصال'],
            ['👋', 'wave تحية'], ['🫡', 'salute تحية'], ['✍️', 'write كتابة'], ['🤲', 'palms دعاء'], ['👀', 'eyes نظر'],
        ],
    },
    {
        id: 'celebrate',
        Icon: HiOutlineSparkles,
        emojis: [
            ['🎉', 'party احتفال'], ['🎊', 'confetti احتفال'], ['✨', 'sparkles لمعان'], ['🌟', 'star نجمة'], ['⭐', 'star نجمة'],
            ['🏆', 'trophy كأس فوز'], ['🥇', 'gold ذهب أول'], ['🎯', 'target هدف'], ['🚀', 'rocket انطلاق نمو'], ['💫', 'dizzy نجوم'],
            ['🎁', 'gift هدية'], ['🎈', 'balloon بالون'], ['🥂', 'cheers نخب'], ['🔔', 'bell جرس'], ['📣', 'megaphone إعلان'],
        ],
    },
    {
        id: 'love',
        Icon: HiOutlineHeart,
        emojis: [
            ['❤️', 'heart حب'], ['🧡', 'orange قلب'], ['💛', 'yellow قلب'], ['💚', 'green قلب'], ['💙', 'blue قلب'],
            ['💜', 'purple قلب'], ['🖤', 'black قلب'], ['🤍', 'white قلب'], ['💯', 'hundred مئة'], ['💥', 'boom انفجار'],
            ['🔥', 'fire نار رائج'], ['⚡', 'bolt برق سريع'], ['💎', 'diamond ألماس جودة'], ['🌹', 'rose وردة'], ['☀️', 'sun شمس'],
        ],
    },
    {
        id: 'commerce',
        Icon: HiOutlineShoppingBag,
        emojis: [
            ['💰', 'money مال'], ['💵', 'dollar دولار'], ['💳', 'card بطاقة دفع'], ['🛒', 'cart عربة شراء'], ['🛍️', 'bags تسوق'],
            ['🏷️', 'tag سعر خصم'], ['📈', 'chart نمو ارتفاع'], ['📉', 'chart هبوط'], ['📊', 'bar إحصاء'], ['🧾', 'receipt فاتورة'],
            ['💼', 'briefcase أعمال'], ['🤑', 'rich ربح'], ['🏦', 'bank بنك'], ['⚖️', 'scale ميزان عدل'], ['📝', 'note عقد كتابة'],
        ],
    },
    {
        id: 'logistics',
        Icon: HiOutlineTruck,
        emojis: [
            ['🚚', 'truck شحن توصيل'], ['🚛', 'lorry نقل'], ['📦', 'package طرد شحنة'], ['🏭', 'factory مصنع'], ['🏗️', 'crane إنشاء'],
            ['⚙️', 'gear تصنيع'], ['🔧', 'wrench صيانة'], ['🛠️', 'tools أدوات'], ['✈️', 'plane طيران تصدير'], ['🚢', 'ship سفينة استيراد'],
            ['🌍', 'globe عالمي'], ['📍', 'pin موقع'], ['🗓️', 'calendar موعد'], ['⏰', 'clock وقت'], ['🔒', 'lock أمان'],
        ],
    },
    {
        id: 'food',
        Icon: HiOutlineFire,
        emojis: [
            ['☕', 'coffee قهوة'], ['🍕', 'pizza بيتزا'], ['🍔', 'burger برجر'], ['🍰', 'cake كيك'], ['🍎', 'apple تفاح'],
            ['🥦', 'broccoli خضار'], ['🌾', 'wheat قمح محصول'], ['🥩', 'meat لحم'], ['🐟', 'fish سمك'], ['🍯', 'honey عسل'],
            ['🥛', 'milk حليب ألبان'], ['🧀', 'cheese جبن'], ['🍞', 'bread خبز'], ['🍬', 'candy حلوى'], ['🥤', 'drink مشروب'],
        ],
    },
];

function readRecents() {
    try {
        const raw = JSON.parse(localStorage.getItem(RECENTS_KEY) || '[]');
        return Array.isArray(raw) ? raw.filter((entry) => typeof entry === 'string') : [];
    } catch {
        return [];
    }
}

function pushRecent(emoji) {
    try {
        const next = [emoji, ...readRecents().filter((entry) => entry !== emoji)].slice(0, RECENTS_MAX);
        localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
    } catch {
        /* private mode — recents just won't persist */
    }
}

/**
 * The emoji library popover. Self-contained (no dependency): categories along
 * the top, live search across English and Arabic keywords, and a Recents row
 * persisted in localStorage. Calls onPick(emoji) and leaves closing to the
 * parent so it can also refocus the editor.
 */
export default function EmojiPicker({ onPick, onClose }) {
    const { t } = useTranslation();
    const [query, setQuery] = useState('');
    const [category, setCategory] = useState('smileys');
    const [recents, setRecents] = useState(readRecents);
    const rootRef = useRef(null);

    // Close on outside click / Escape.
    useEffect(() => {
        const onDown = (event) => {
            if (rootRef.current && !rootRef.current.contains(event.target)) onClose?.();
        };
        const onKey = (event) => {
            if (event.key === 'Escape') onClose?.();
        };
        document.addEventListener('mousedown', onDown);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onDown);
            document.removeEventListener('keydown', onKey);
        };
    }, [onClose]);

    const results = useMemo(() => {
        const needle = query.trim().toLowerCase();
        if (!needle) return null;
        return CATEGORIES.flatMap((group) => group.emojis).filter(([, keywords]) => keywords.toLowerCase().includes(needle));
    }, [query]);

    const pick = (emoji) => {
        pushRecent(emoji);
        setRecents(readRecents());
        onPick?.(emoji);
    };

    const activeGroup = CATEGORIES.find((group) => group.id === category) ?? CATEGORIES[0];

    const grid = (list) => (
        <div className="grid grid-cols-8 gap-0.5">
            {list.map(([emoji, keywords]) => (
                <button
                    key={emoji + keywords}
                    type="button"
                    onClick={() => pick(emoji)}
                    title={keywords.split(' ')[0]}
                    className="sc-press flex h-9 w-9 items-center justify-center rounded-lg text-xl transition hover:bg-slate-100"
                >
                    {emoji}
                </button>
            ))}
        </div>
    );

    return (
        <div
            ref={rootRef}
            className="sc-pop w-80 rounded-2xl bg-white p-3 shadow-[0_20px_60px_-20px_rgba(15,23,42,.4)] ring-1 ring-slate-200"
            role="dialog"
            aria-label={t('composer_emoji', 'Emoji')}
        >
            <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t('composer_emoji_search', 'Search emoji…')}
                className="w-full rounded-xl bg-slate-100 px-3 py-2 text-sm outline-hidden transition focus:ring-2 focus:ring-brand/30"
            />

            {results ? (
                <div className="mt-2 max-h-56 overflow-y-auto">
                    {results.length ? grid(results) : (
                        <p className="py-8 text-center text-xs text-slate-400">{t('no_results', 'No results')}</p>
                    )}
                </div>
            ) : (
                <>
                    <div className="mt-2 flex items-center gap-0.5 border-b border-slate-100 pb-2">
                        {recents.length ? (
                            <button
                                type="button"
                                onClick={() => setCategory('recents')}
                                aria-pressed={category === 'recents'}
                                title={t('composer_emoji_recent', 'Recently used')}
                                className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${category === 'recents' ? 'bg-brand-light text-brand' : 'text-slate-400 hover:bg-slate-100'}`}
                            >
                                <HiOutlineClock className="h-5 w-5" aria-hidden />
                            </button>
                        ) : null}
                        {CATEGORIES.map(({ id, Icon }) => (
                            <button
                                key={id}
                                type="button"
                                onClick={() => setCategory(id)}
                                aria-pressed={category === id}
                                className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${category === id ? 'bg-brand-light text-brand' : 'text-slate-400 hover:bg-slate-100'}`}
                            >
                                <Icon className="h-5 w-5" aria-hidden />
                            </button>
                        ))}
                    </div>
                    <div className="mt-2 max-h-56 overflow-y-auto">
                        {category === 'recents'
                            ? grid(recents.map((emoji) => [emoji, '']))
                            : grid(activeGroup.emojis)}
                    </div>
                </>
            )}
        </div>
    );
}
