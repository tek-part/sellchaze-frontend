import { Link } from 'react-router-dom';
import { HiArrowLeft, HiOutlineBolt, HiOutlineBuildingStorefront, HiOutlinePlayCircle, HiOutlineUserGroup } from 'react-icons/hi2';

const items = [
    { title: 'فرص توريد اليوم', subtitle: 'طلبات شراء جديدة', icon: HiOutlineBolt, to: '/community/trending', tone: 'from-amber-400 to-orange-600' },
    { title: 'مصانع موثّقة', subtitle: 'اعثر على شريكك', icon: HiOutlineBuildingStorefront, to: '/directory', tone: 'from-blue-500 to-indigo-700' },
    { title: 'Reels المنتجات', subtitle: 'شاهد الجديد', icon: HiOutlinePlayCircle, to: '/reels', tone: 'from-fuchsia-500 to-purple-700' },
    { title: 'مجتمع قطاعك', subtitle: 'خبرات وعلاقات', icon: HiOutlineUserGroup, to: '/community/groups', tone: 'from-cyan-500 to-blue-700' },
];

export default function BusinessHighlights() {
    return <section><div className="mb-3 flex items-center justify-between"><h2 className="text-base font-black text-slate-900">اكتشف مجتمع الأعمال</h2><Link to="/community/trending" className="flex items-center gap-1 text-xs font-bold text-blue-700">عرض الكل <HiArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" /></Link></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{items.map(({ title, subtitle, icon: Icon, to, tone }) => <Link key={title} to={to} className={`group relative min-h-28 overflow-hidden rounded-2xl bg-gradient-to-br ${tone} p-4 text-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg`}><div className="absolute -end-4 -top-4 h-20 w-20 rounded-full bg-white/10 transition group-hover:scale-125" /><Icon className="relative h-6 w-6" /><p className="relative mt-4 text-sm font-black">{title}</p><p className="relative mt-0.5 text-[11px] text-white/75">{subtitle}</p></Link>)}</div></section>;
}

