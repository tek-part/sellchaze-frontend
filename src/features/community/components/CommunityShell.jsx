import { NavLink } from 'react-router-dom';
import { HiOutlineBookmark, HiOutlineFire, HiOutlineHome, HiOutlinePlayCircle, HiOutlineSquares2X2, HiOutlineUserGroup, HiOutlineUsers, HiOutlineVideoCamera } from 'react-icons/hi2';
import FollowSuggestions from '../../../components/feed/FollowSuggestions';

const links = [
    ['/feed', 'الرئيسية', HiOutlineHome], ['/community/following', 'أتابعهم', HiOutlineUsers], ['/reels', 'Reels', HiOutlinePlayCircle],
    ['/community/groups', 'المجموعات', HiOutlineUserGroup], ['/community/saved', 'المحفوظات', HiOutlineBookmark], ['/community/trending', 'الرائج', HiOutlineFire],
];

function Navigation({ mobile = false }) {
    return <nav className={mobile ? 'grid grid-cols-6 gap-1' : 'space-y-1.5'} aria-label="Community">{links.map(([to, label, Icon]) => <NavLink key={to} to={to} className={({ isActive }) => `${mobile ? 'flex flex-col items-center gap-0.5 p-2 text-[10px]' : 'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold'} transition ${isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}><Icon className="h-5 w-5" /><span>{label}</span></NavLink>)}</nav>;
}

export default function CommunityShell({ children, rightRail = true }) {
    return <div className="mx-auto max-w-[1530px] pb-20 lg:pb-0"><div className="grid items-start gap-5 lg:grid-cols-[238px_minmax(0,740px)] xl:grid-cols-[238px_minmax(0,740px)_312px] xl:justify-center">
        <aside className="sticky top-24 hidden overflow-hidden rounded-[22px] bg-white p-3 shadow-[0_12px_40px_-28px_rgba(15,23,42,.55)] ring-1 ring-slate-200/80 lg:block"><div className="mb-4 flex items-center gap-3 px-2 py-2"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-700 to-blue-500 text-white shadow-lg shadow-blue-500/20"><HiOutlineSquares2X2 className="h-6 w-6" /></span><div><p className="font-black text-slate-900">مجتمع Sellchaze</p><p className="text-xs text-slate-500">تجارة وعلاقات B2B</p></div></div><Navigation /><NavLink to="/community/create" className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-700 to-blue-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5"><HiOutlineVideoCamera className="h-5 w-5" />إنشاء محتوى</NavLink></aside>
        <main className="min-w-0">{children}</main>
        {rightRail ? <aside className="sticky top-24 hidden space-y-4 xl:block"><section className="group relative min-h-52 overflow-hidden rounded-[22px] text-white shadow-lg"><img src="/community/b2b-opportunity-cover-v1.png" alt="فرص توريد وتصدير" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" /><div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-blue-950/55 to-transparent" /><div className="absolute inset-x-0 bottom-0 p-5"><p className="text-[11px] font-black tracking-widest text-blue-200">فرص هذا الأسبوع</p><h2 className="mt-1 text-xl font-black">اكتشف فرص التوريد والتصدير</h2><p className="mt-1 text-xs leading-5 text-white/80">تواصل مباشرة مع مشترين ومصنّعين داخل مجتمع موثوق.</p></div></section><FollowSuggestions /></aside> : null}
    </div><div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-1 backdrop-blur lg:hidden"><Navigation mobile /></div></div>;
}
