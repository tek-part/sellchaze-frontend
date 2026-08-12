import { Link } from 'react-router-dom';
import { HiArrowLeft, HiOutlineShieldCheck, HiOutlineUsers } from 'react-icons/hi2';

export default function CommunityHero() {
    return (
        <section className="relative isolate overflow-hidden rounded-[28px] bg-slate-950 shadow-[0_18px_60px_-28px_rgba(15,46,100,.65)]">
            <img src="/community/sellchaze-community-hero-v1.png" alt="موردون وتجار في مجتمع Sellchaze" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#071b3f]/95 via-[#0b3b7c]/70 to-transparent rtl:bg-gradient-to-l" />
            <div className="relative flex min-h-[238px] max-w-md flex-col justify-end p-6 text-white sm:p-8">
                <div className="mb-auto flex items-center gap-2 text-xs font-bold text-blue-100"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/15 backdrop-blur"><HiOutlineUsers className="h-5 w-5" /></span>SELLCHAZE BUSINESS NETWORK</div>
                <h1 className="text-2xl font-black leading-tight sm:text-3xl">مجتمع الأعمال الذي يحوّل العلاقات إلى صفقات</h1>
                <p className="mt-2 max-w-sm text-sm leading-6 text-blue-50/90">اكتشف مورّدين موثوقين، شارك فرص التوريد، واعرض منتجاتك أمام المشترين المناسبين.</p>
                <div className="mt-5 flex flex-wrap items-center gap-3"><Link to="/community/create" className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-black text-blue-800 shadow-lg shadow-black/10 transition hover:-translate-y-0.5">ابدأ منشوراً <HiArrowLeft className="h-4 w-4 rtl:rotate-180" /></Link><span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-100"><HiOutlineShieldCheck className="h-4 w-4" />مجتمع أعمال موثّق</span></div>
            </div>
        </section>
    );
}

