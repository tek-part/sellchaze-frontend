import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/client';
import PostCard from '../components/feed/PostCard';
import PostComposer from '../components/feed/PostComposer';
import CommunityShell from '../features/community/components/CommunityShell';

export default function CommunityGroupPage() {
    const { id } = useParams(); const [group, setGroup] = useState(null);
    useEffect(() => { api.get(`/community/groups/${id}`).then(({ data }) => setGroup(data.data)); }, [id]);
    if (!group) return <CommunityShell><div className="h-64 animate-pulse rounded-2xl bg-slate-100" /></CommunityShell>;
    return <CommunityShell><div className="space-y-5"><section className="overflow-hidden rounded-2xl bg-white shadow-xs ring-1 ring-slate-200"><div className="h-36 bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-500" /><div className="p-5"><h1 className="text-2xl font-bold text-slate-900">{group.name}</h1><p className="mt-2 text-sm text-slate-600">{group.description}</p><p className="mt-3 text-xs font-semibold text-slate-500">{group.members_count} عضو · {group.posts_count} منشور</p></div></section>{group.joined ? <PostComposer groupId={group.id} onCreated={(post) => setGroup((current) => ({ ...current, posts: [post, ...(current.posts || [])] }))} /> : null}<div className="space-y-4">{(group.posts || []).map((post) => <PostCard key={post.id} post={post} />)}</div></div></CommunityShell>;
}
