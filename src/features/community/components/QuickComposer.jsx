import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { HiOutlineDocumentText, HiOutlinePhoto, HiOutlinePlayCircle, HiOutlineShoppingBag } from 'react-icons/hi2';
import api from '../../../api/client';

export default function QuickComposer() {
    const [me, setMe] = useState(null);
    useEffect(() => { api.get('/auth/me').then(({ data }) => setMe(data.user || data)).catch(() => {}); }, []);
    const avatar = me?.profile?.photo_url || me?.avatar;
    return (
        <section className="rounded-[22px] bg-white p-4 shadow-[0_8px_30px_-20px_rgba(15,23,42,.35)] ring-1 ring-slate-200/80">
            <div className="flex items-center gap-3">{avatar ? <img src={avatar} alt="" className="h-11 w-11 rounded-full object-cover ring-2 ring-blue-100" /> : <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 font-black text-white">{(me?.name || 'S').charAt(0)}</span>}<Link to="/community/create" className="flex-1 rounded-full bg-slate-100 px-5 py-3 text-start text-sm font-medium text-slate-500 transition hover:bg-slate-200">بماذا تفكر؟ شارك فرصة أو منتجاً مع مجتمع الأعمال...</Link></div>
            <div className="mt-3 grid grid-cols-4 border-t border-slate-100 pt-3">
                <Link to="/community/create" className="flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"><HiOutlineDocumentText className="h-5 w-5 text-blue-600" />منشور</Link>
                <Link to="/community/create?media=image" className="flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"><HiOutlinePhoto className="h-5 w-5 text-emerald-500" />صورة</Link>
                <Link to="/community/create?format=reel" className="flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"><HiOutlinePlayCircle className="h-5 w-5 text-fuchsia-500" />فيديو</Link>
                <Link to="/community/create?type=rfq" className="flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"><HiOutlineShoppingBag className="h-5 w-5 text-amber-500" />طلب توريد</Link>
            </div>
        </section>
    );
}

