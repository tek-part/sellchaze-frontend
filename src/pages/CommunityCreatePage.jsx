import { useNavigate, useSearchParams } from 'react-router-dom';
import PostComposer from '../components/feed/PostComposer';
import CommunityShell from '../features/community/components/CommunityShell';

export default function CommunityCreatePage() {
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const format = params.get('format') === 'reel' ? 'reel' : 'post';
    const initialType = params.get('type') || undefined;
    return <CommunityShell><div className="space-y-5"><header className="overflow-hidden rounded-[26px] bg-slate-950 p-6 text-white shadow-lg"><p className="text-xs font-bold tracking-widest text-blue-300">SELLCHAZE CREATOR STUDIO</p><h1 className="mt-2 text-2xl font-black">{format === 'reel' ? 'أنشئ فيديو قصيراً يلفت المشترين' : 'شارك محتوى يصنع فرصة تجارية'}</h1><p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">اكتب الفكرة، أضف وسائطك ومنتجك، وحدد الجمهور. سيستمر الرفع في الخلفية دون تعطيل عملك.</p></header><PostComposer fullPage initialFormat={format} initialType={initialType} onCreated={(post) => navigate(post.format === 'reel' ? '/reels' : `/community/post/${post.id}`)} /></div></CommunityShell>;
}
