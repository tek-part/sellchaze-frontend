import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/client';
import PostCard from '../components/feed/PostCard';
import CommunityShell from '../features/community/components/CommunityShell';

export default function CommunityPostPage() {
    const { id } = useParams(); const [post, setPost] = useState(null); const [error, setError] = useState('');
    useEffect(() => { api.get(`/posts/${id}`).then(({ data }) => setPost(data.data)).catch((e) => setError(e.response?.data?.message || e.message)); }, [id]);
    return <CommunityShell>{error ? <p className="rounded-xl bg-red-50 p-4 text-red-700">{error}</p> : post ? <PostCard post={post} /> : <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />}</CommunityShell>;
}

