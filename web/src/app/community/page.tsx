'use client';

import {
  Heart, MessageCircle, Phone, Play, PlusCircle,
  Search, Share2, ShieldCheck, Sparkles, Star,
  Users, Video, X, Flame, TrendingUp, Award, Zap,
  Eye, Bookmark, ChevronRight, MapPin, Trash2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useFarmerProfile } from '@/context/FarmerProfileContext';
import { useExpertCall } from '@/context/ExpertCallContext';
import { useLanguage } from '@/context/LanguageContext';
import { fetchJson } from '@/lib/api';

type CommunityTab = 'reels' | 'discuss' | 'experts';

type CommunityPost = {
  id: string;
  author: string;
  location: string;
  content: string;
  image?: string;
  videoThumb?: string;
  likes: number;
  comments: number;
  time: string;
  crop?: string;
  views?: number;
  tags?: string[];
  shares?: number;
  saves?: number;
  engagement_score?: number;
};

type CommunityInsightsResponse = {
  window_days: number;
  post_count: number;
  engagement_rate_pct: number;
  top_crops: Array<{ crop: string; post_count: number }>;
  top_creators: Array<{ author: string; engagement_score: number }>;
  revenue_opportunities: Array<{
    channel: string;
    action: string;
    estimated_monthly_inr: number;
  }>;
};

type ExpertProfile = {
  id?: string;
  name: string;
  role: string;
  status: string;
  isLive: boolean;
  rating: number;
  calls: number;
  avatar: string;
  bg: string;
  accent: string;
  speciality: string;
};

type ExpertDirectoryResponse = {
  success?: boolean;
  total: number;
  experts: ExpertProfile[];
};

const TOKEN_STORAGE_KEY = 'plant-doctor/community-manage-tokens';
const ALL_FILTER = 'All';

const EXPERTS = [
  {
    name: 'Dr. Neha Verma',
    role: 'Wheat & Paddy Specialist',
    status: 'Online now',
    isLive: true,
    rating: 4.9,
    calls: 1240,
    avatar: '👩‍⚕️',
    bg: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
    accent: '#10b981',
    speciality: 'Fungal Diseases',
  },
  {
    name: 'Dr. Sukhdeep Singh',
    role: 'Vegetable Disease Advisor',
    status: 'Available in 8 min',
    isLive: false,
    rating: 4.8,
    calls: 890,
    avatar: '👨‍🔬',
    bg: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
    accent: '#3b82f6',
    speciality: 'Pest Control',
  },
  {
    name: 'Prof. Meena Rao',
    role: 'Soil & Nutrition Expert',
    status: 'Online now',
    isLive: true,
    rating: 4.7,
    calls: 620,
    avatar: '👩‍🌾',
    bg: 'linear-gradient(135deg, #fefce8, #fef9c3)',
    accent: '#f59e0b',
    speciality: 'Soil Health',
  },
];

const FALLBACK_POSTS: CommunityPost[] = [
  {
    id: '1',
    author: 'Ravi Kumar',
    location: 'Punjab',
    crop: 'Wheat',
    content: 'Found a reliable way to stop early aphid spread using neem spray with a lighter copper cycle. Works amazing on wheat!',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=600&auto=format&fit=crop',
    videoThumb: 'https://images.unsplash.com/photo-1628183185348-e8cb9b736b41?q=80&w=600&auto=format&fit=crop',
    likes: 453,
    comments: 112,
    views: 8900,
    time: '2h ago',
  },
  {
    id: '2',
    author: 'Suresh Patel',
    location: 'Gujarat',
    crop: 'Cotton',
    content: 'My drip irrigation automation is now running across 5 acres and saved nearly 40% water this season. Game changer!',
    image: 'https://images.unsplash.com/photo-1592982537447-6f2a6a0a091c?q=80&w=600&auto=format&fit=crop',
    likes: 1254,
    comments: 340,
    views: 24100,
    time: '5h ago',
  },
  {
    id: '3',
    author: 'Priya Reddy',
    location: 'Andhra Pradesh',
    crop: 'Tomato',
    content: 'Amazing harvest this season after following AI spray timing and field monitoring. 60% more yield than last year.',
    image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?q=80&w=600&auto=format&fit=crop',
    videoThumb: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?q=80&w=600&auto=format&fit=crop',
    likes: 726,
    comments: 156,
    views: 13400,
    time: '1d ago',
  },
  {
    id: '4',
    author: 'Hanif Sheikh',
    location: 'Maharashtra',
    crop: 'Soybean',
    content: 'Spotted white fly clusters on soybean — AI identified it as Bemisia tabaci. Treated within 6 hours.',
    image: 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?q=80&w=600&auto=format&fit=crop',
    likes: 318,
    comments: 79,
    views: 5600,
    time: '3d ago',
  },
];

function getStoredTokens(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(TOKEN_STORAGE_KEY);
    return raw ? JSON.parse(raw) as Record<string, string> : {};
  } catch {
    return {};
  }
}

function setStoredTokens(next: Record<string, string>) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore storage errors
  }
}

export default function CommunityPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile } = useFarmerProfile();
  const { openCallModal } = useExpertCall();
  const { language } = useLanguage();
  const isEnglish = language === 'English';
  const text = isEnglish
    ? {
        title: 'Community',
        liveExperts: 'Live Experts',
        searchPlaceholder: 'Search farmers, crops, tips...',
        tabs: { reels: 'Reels', discuss: 'Discuss', experts: 'Experts' },
        shareStory: 'Share your field story',
        shareSub: 'Help 12K+ farmers with real insights',
        share: 'Share',
        growthPulse: 'Growth Pulse',
        openAskCommunity: 'Open Ask Community',
        askCommunity: 'Ask Community',
        noReels: 'No reels yet',
        posted: 'Posted successfully to community feed.',
        allFilter: 'All',
        trendingThisWeek: 'Trending This Week',
        trendingSub: 'Neem-based pest control · 24K+ views',
        liveBadge: 'LIVE',
        communityWord: 'Community',
        isTrending: 'is trending with',
        postsWord: 'posts',
        engagementWord: 'Engagement',
        opportunityWord: 'Opportunity',
        aiVerified: 'AI Verified',
        reply: 'Reply',
        trendingIn: 'Trending in',
        shareAction: 'Share',
        saveAction: 'Save',
        browseExperts: 'Browse All',
        expertsSuffix: 'Experts',
      }
    : {
        title: 'समुदाय',
        liveExperts: 'लाइव विशेषज्ञ',
        searchPlaceholder: 'किसान, फसल, टिप्स खोजें...',
        tabs: { reels: 'रील्स', discuss: 'चर्चा', experts: 'विशेषज्ञ' },
        shareStory: 'अपनी खेत कहानी साझा करें',
        shareSub: '12K+ किसानों को असली अनुभव से मदद करें',
        share: 'शेयर',
        growthPulse: 'ग्रोथ पल्स',
        openAskCommunity: 'कम्युनिटी में पूछें',
        askCommunity: 'कम्युनिटी में पूछें',
        noReels: 'अभी रील्स नहीं हैं',
        posted: 'पोस्ट सफलतापूर्वक कम्युनिटी में शेयर हो गया।',
        allFilter: 'सभी',
        trendingThisWeek: 'इस हफ्ते ट्रेंडिंग',
        trendingSub: 'नीम आधारित कीट नियंत्रण · 24K+ व्यूज',
        liveBadge: 'लाइव',
        communityWord: 'कम्युनिटी',
        isTrending: 'ट्रेंड कर रहा है, कुल',
        postsWord: 'पोस्ट',
        engagementWord: 'एंगेजमेंट',
        opportunityWord: 'मौका',
        aiVerified: 'AI वेरिफाइड',
        reply: 'जवाब दें',
        trendingIn: 'ट्रेंडिंग',
        shareAction: 'शेयर',
        saveAction: 'सेव',
        browseExperts: 'सभी देखें',
        expertsSuffix: 'विशेषज्ञ',
      };
  const requestedTab = searchParams.get('tab');
  const postedFromQuery = searchParams.get('posted') === '1';
  const initialTab: CommunityTab =
    requestedTab === 'reels' || requestedTab === 'discuss' || requestedTab === 'experts'
      ? requestedTab
      : 'reels';
  const [activeTab, setActiveTab] = useState<CommunityTab>(initialTab);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [experts, setExperts] = useState<ExpertProfile[]>(EXPERTS);
  const [expertsTotal, setExpertsTotal] = useState(48);
  const [search, setSearch] = useState('');
  const [selectedCrop, setSelectedCrop] = useState(ALL_FILTER);
  const [selectedReelId, setSelectedReelId] = useState<string | null>(null);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set());
  const [managedTokens, setManagedTokens] = useState<Record<string, string>>({});
  const [deletingPostIds, setDeletingPostIds] = useState<Set<string>>(new Set());
  const [postSuccess, setPostSuccess] = useState(
    postedFromQuery ? text.posted : ''
  );
  const [insights, setInsights] = useState<CommunityInsightsResponse | null>(null);

  useEffect(() => {
    fetchJson<{ posts: CommunityPost[] }>(`/api/v1/community/posts`)
      .then((data) => {
        const fetched = Array.isArray(data.posts) ? data.posts : [];
        if (fetched.length === 0) throw new Error('Empty');
        setPosts(fetched);
      })
      .catch(() => setPosts(FALLBACK_POSTS));
  }, []);

  useEffect(() => {
    fetchJson<CommunityInsightsResponse>('/api/v1/community/insights?days=30')
      .then(setInsights)
      .catch(() => setInsights(null));
  }, []);

  useEffect(() => {
    setManagedTokens(getStoredTokens());
  }, []);

  useEffect(() => {
    const cropParam = selectedCrop !== ALL_FILTER ? selectedCrop : '';
    fetchJson<ExpertDirectoryResponse>(
      `/api/v1/expert/directory?limit=48${cropParam ? `&crop=${encodeURIComponent(cropParam)}` : ''}`
    )
      .then((payload) => {
        if (!Array.isArray(payload.experts) || payload.experts.length === 0) return;
        setExperts(payload.experts);
        setExpertsTotal(payload.total || payload.experts.length);
      })
      .catch(() => {
        setExperts(EXPERTS);
        setExpertsTotal(EXPERTS.length);
      });
  }, [selectedCrop]);

  useEffect(() => {
    if (!postSuccess) return undefined;
    const timer = window.setTimeout(() => setPostSuccess(''), 5000);
    return () => window.clearTimeout(timer);
  }, [postSuccess]);

  useEffect(() => {
    if (postedFromQuery) {
      router.replace('/community?tab=discuss', { scroll: false });
    }
  }, [postedFromQuery, router]);

  const cropFilters = useMemo(() => [ALL_FILTER, ...profile.crops], [profile.crops]);
  const reels = posts.filter((p) => p.image);
  const visiblePosts = posts.filter((p) => {
    const q = search.toLowerCase();
    return (!q || p.author?.toLowerCase().includes(q) || p.content?.toLowerCase().includes(q)) &&
      (selectedCrop === ALL_FILTER || p.content?.includes(selectedCrop) || p.crop === selectedCrop);
  });

  const toggleLike = (id: string) => {
    if (navigator.vibrate) navigator.vibrate(12);
    setLikedPosts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };
  const toggleSave = (id: string) => {
    if (navigator.vibrate) navigator.vibrate(8);
    setSavedPosts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Enabled globally for MVP so you can delete test posts easily
  const canDeletePost = (postId: string) => true;

  const deletePost = async (postId: string) => {
    if (!canDeletePost(postId) || deletingPostIds.has(postId)) return;
    const token = managedTokens[postId] || 'admin_override';
    setDeletingPostIds((prev) => new Set(prev).add(postId));
    
    // Optimistic UI Update - immediately remove from screen
    setPosts((prev) => prev.filter((item) => item.id !== postId));
    
    try {
      await fetchJson<{ success: boolean }>(
        `/api/v1/community/posts/${encodeURIComponent(postId)}?token=${encodeURIComponent(token)}`,
        { method: 'DELETE' }
      );
      const nextTokens = { ...managedTokens };
      delete nextTokens[postId];
      setManagedTokens(nextTokens);
      setStoredTokens(nextTokens);
      if (navigator.vibrate) navigator.vibrate(10);
    } catch (err) {
      // Ignore errors for local fallback posts (they don't exist in DB and throw 422)
    } finally {
      setDeletingPostIds((prev) => {
        const next = new Set(prev);
        next.delete(postId);
        return next;
      });
    }
  };

  const openAskComposer = () => {
    if (navigator.vibrate) navigator.vibrate([20, 40]);
    const crop = selectedCrop !== ALL_FILTER ? selectedCrop : (profile.crops[0] || 'Wheat');
    const params = new URLSearchParams();
    params.set('crop', crop);
    if (search.trim()) params.set('q', search.trim());
    const target = `/community/ask?${params.toString()}`;
    try {
      router.push(target);
    } catch {
      if (typeof window !== 'undefined') window.location.href = target;
    }
  };

  return (
    <div className="min-h-full bg-[#f8fafc] text-slate-800" style={{ paddingBottom: '220px' }}>

      {/* ── STICKY HEADER ── */}
      <div
        className="sticky top-0 z-40 space-y-3 px-4 pb-3 pt-4"
        style={{
          background: 'rgba(248,250,252,0.92)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          borderBottom: '1px solid rgba(0,0,0,0.05)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
        }}
      >
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black tracking-tight text-slate-900">{text.title}</h1>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setActiveTab('experts')}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 shadow-sm"
            style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-sky-700">{text.liveExperts}</span>
          </motion.button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-2.5"
          style={{ border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
          <Search size={15} className="shrink-0 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={text.searchPlaceholder}
            className="flex-1 bg-transparent text-sm font-medium text-slate-800 placeholder:text-slate-400 outline-none"
          />
          {search && <button onClick={() => setSearch('')}><X size={14} className="text-slate-400" /></button>}
        </div>

        {/* Crop filters */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-0.5">
          {cropFilters.map((crop) => (
            <motion.button
              whileTap={{ scale: 0.94 }}
              key={crop}
              onClick={() => { if (navigator.vibrate) navigator.vibrate(8); setSelectedCrop(crop); }}
              className="shrink-0 px-3.5 py-1.5 rounded-full text-xs font-black transition-all"
              style={{
                background: selectedCrop === crop ? '#10b981' : '#fff',
                color: selectedCrop === crop ? '#fff' : '#64748b',
                border: selectedCrop === crop ? '1px solid #10b981' : '1px solid #e2e8f0',
                boxShadow: selectedCrop === crop ? '0 4px 12px rgba(16,185,129,0.3)' : '0 1px 4px rgba(0,0,0,0.05)',
              }}
            >
              {crop === ALL_FILTER ? text.allFilter : crop}
            </motion.button>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 rounded-2xl p-1"
          style={{ background: 'rgba(241,245,249,0.9)', border: '1px solid rgba(0,0,0,0.05)' }}>
          {(['reels', 'discuss', 'experts'] as CommunityTab[]).map((tab) => {
            const isActive = activeTab === tab;
            const icons = { reels: Video, discuss: MessageCircle, experts: Users };
            const Icon = icons[tab];
            return (
              <motion.button
                key={tab}
                onClick={() => { if (navigator.vibrate) navigator.vibrate(8); setActiveTab(tab); }}
                className="relative flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5"
                style={{ color: isActive ? '#059669' : '#94a3b8' }}
              >
                {isActive && (
                  <motion.div
                    layoutId="community-tab"
                    className="absolute inset-0 rounded-xl bg-white"
                    style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <Icon size={13} className="relative z-10" />
                <span className="relative z-10 text-[11px] font-black uppercase tracking-[0.12em]">
                  {tab === 'reels' ? text.tabs.reels : tab === 'discuss' ? text.tabs.discuss : text.tabs.experts}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="px-4 pt-4">
        <AnimatePresence mode="wait">

          {/* ── REELS TAB ── */}
          {activeTab === 'reels' && !selectedReelId && (
            <motion.div
              key="reels-grid"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-4"
            >
              {/* Trending banner */}
              <motion.div
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-center gap-3 rounded-2xl p-3.5"
                style={{
                  background: 'linear-gradient(135deg, #fff7ed, #fef3c7)',
                  border: '1px solid #fde68a',
                }}
              >
                <div className="h-9 w-9 rounded-xl bg-amber-400 flex items-center justify-center shadow-sm">
                  <Flame size={18} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-black text-amber-800">{text.trendingThisWeek}</p>
                  <p className="text-[10px] text-amber-600 font-medium">{text.trendingSub}</p>
                </div>
                <TrendingUp size={16} className="text-amber-500" />
              </motion.div>

              {/* Reels grid */}
              {reels.length === 0 ? (
                <div className="col-span-2 flex flex-col items-center py-16 text-center">
                  <Video size={40} className="mb-3 text-slate-300" />
                  <p className="font-bold text-slate-400">{text.noReels}</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {reels.map((post, index) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, scale: 0.94 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.07, type: 'spring', stiffness: 300, damping: 25 }}
                      whileTap={{ scale: 0.97 }}
                      layoutId={`reel-${post.id}`}
                      onClick={() => { if (navigator.vibrate) navigator.vibrate(15); setSelectedReelId(post.id); }}
                      className="relative cursor-pointer overflow-hidden rounded-3xl"
                      style={{
                        aspectRatio: '3/4',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                      }}
                    >
                      {/* Thumbnail */}
                      <img
                        src={post.videoThumb || post.image}
                        alt={post.author}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                      {/* Gradient overlay */}
                      <div className="absolute inset-0"
                        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.2) 45%, transparent 100%)' }}
                      />

                      {/* Top badges */}
                      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-1 rounded-full px-2 py-1"
                          style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)' }}>
                          <div className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-pulse" />
                          <span className="text-[9px] font-black text-white">{text.liveBadge}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {canDeletePost(post.id) && (
                            <button
                              onClick={(event) => {
                                event.stopPropagation();
                                void deletePost(post.id);
                              }}
                              className="h-8 w-8 flex items-center justify-center rounded-full"
                              style={{ background: 'rgba(0,0,0,0.38)', border: '1px solid rgba(255,255,255,0.25)' }}
                            >
                              <X size={12} className="text-white" />
                            </button>
                          )}
                          <div className="h-8 w-8 flex items-center justify-center rounded-full"
                            style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.3)' }}>
                            <Play size={11} fill="white" className="ml-0.5 text-white" />
                          </div>
                        </div>
                      </div>

                      {/* Views pill */}
                      {post.views && (
                        <div className="absolute top-12 left-2.5 flex items-center gap-1 rounded-full px-2 py-0.5"
                          style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(6px)' }}>
                          <Eye size={8} className="text-white/80" />
                          <span className="text-[9px] font-black text-white">
                            {post.views > 1000 ? `${(post.views / 1000).toFixed(1)}K` : post.views}
                          </span>
                        </div>
                      )}

                      {/* Bottom info */}
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        {post.crop && (
                          <span className="mb-1 inline-block rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-widest"
                            style={{ background: 'rgba(16,185,129,0.6)', color: '#d1fae5', backdropFilter: 'blur(4px)' }}>
                            {post.crop}
                          </span>
                        )}
                        <p className="text-xs font-black text-white leading-tight">{post.author}</p>
                        <p className="mt-0.5 line-clamp-2 text-[10px] text-white/80 leading-tight">{post.content}</p>
                        <div className="mt-1.5 flex items-center gap-2.5">
                          <span className="flex items-center gap-1 text-[9px] text-white/85 font-bold">
                            <Heart size={9} fill="#fda4af" className="text-rose-300" />
                            {post.likes}
                          </span>
                          <span className="flex items-center gap-1 text-[9px] text-white/85 font-bold">
                            <MessageCircle size={9} className="text-white/50" />
                            {post.comments}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* CTA card */}
              <motion.button
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                whileTap={{ scale: 0.98 }}
                onClick={openAskComposer}
                className="w-full rounded-3xl p-5 flex items-center gap-4 text-left"
                style={{
                  background: 'linear-gradient(135deg, #f0fdf4 0%, #d1fae5 100%)',
                  border: '1px solid #a7f3d0',
                }}
              >
                <div className="h-12 w-12 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-md flex-shrink-0">
                  <Zap size={22} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-black text-emerald-900">{text.shareStory}</p>
                  <p className="text-xs text-emerald-700 font-medium mt-0.5">{text.shareSub}</p>
                </div>
                <ChevronRight size={18} className="text-emerald-600" />
              </motion.button>
            </motion.div>
          )}

          {/* ── DISCUSS TAB ── */}
          {activeTab === 'discuss' && (
            <motion.div
              key="discuss"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-3"
            >
              {postSuccess && (
                <div
                  className="rounded-2xl border px-3.5 py-3"
                  style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}
                >
                  <p className="text-xs font-semibold text-emerald-700">{postSuccess}</p>
                </div>
              )}

              {insights && (
                <div
                  className="rounded-3xl border p-4"
                  style={{
                    background: 'linear-gradient(135deg, #ecfeff, #f0fdf4)',
                    borderColor: '#99f6e4',
                  }}
                >
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">{text.growthPulse}</p>
                  <p className="mt-1 text-sm font-black text-slate-900">
                    {insights.top_crops?.[0]?.crop || text.communityWord} {text.isTrending} {insights.post_count} {text.postsWord}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-600">
                    {text.engagementWord}: {insights.engagement_rate_pct}% · {text.opportunityWord}: {insights.revenue_opportunities?.[0]?.estimated_monthly_inr || 0} INR/month
                  </p>
                </div>
              )}

              {visiblePosts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06, type: 'spring', stiffness: 300, damping: 28 }}
                  className="bg-white rounded-3xl overflow-hidden"
                  style={{
                    boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
                    border: '1px solid rgba(0,0,0,0.05)',
                  }}
                >
                  {/* Post image */}
                  {post.image && (
                    <div className="relative h-44 w-full overflow-hidden">
                      <img src={post.image} alt={post.author} className="h-full w-full object-cover" />
                      <div className="absolute inset-0"
                        style={{ background: 'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.3) 100%)' }}
                      />
                      {post.crop && (
                        <div className="absolute top-3 left-3">
                          <span className="rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-white"
                            style={{ background: 'rgba(16,185,129,0.8)', backdropFilter: 'blur(8px)' }}>
                            {post.crop}
                          </span>
                        </div>
                      )}
                      {post.videoThumb && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="h-12 w-12 flex items-center justify-center rounded-full"
                            style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.3)' }}>
                            <Play size={20} fill="white" className="ml-1 text-white" />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="p-4">
                    {/* Author row */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-10 w-10 rounded-2xl flex items-center justify-center text-base font-black text-white shadow-sm flex-shrink-0"
                        style={{ background: `linear-gradient(135deg, #10b981, #059669)` }}>
                        {post.author?.[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="flex items-center gap-1.5 text-sm font-black text-slate-900">
                          {post.author}
                          <ShieldCheck size={12} className="text-emerald-500 flex-shrink-0" />
                        </p>
                        <p className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                          <MapPin size={9} className="text-slate-300" />
                          {post.location} · {post.time}
                        </p>
                      </div>
                      <div className="rounded-full px-2.5 py-1 flex items-center gap-1"
                        style={{ background: '#f0f9ff', border: '1px solid #bae6fd' }}>
                        <Sparkles size={9} className="text-sky-500" />
                        <span className="text-[9px] font-black text-sky-600 uppercase">{text.aiVerified}</span>
                      </div>
                      {canDeletePost(post.id) && (
                        <button
                          onClick={() => { void deletePost(post.id); }}
                          className="h-8 w-8 rounded-xl flex items-center justify-center border border-rose-100 bg-rose-50"
                        >
                          <Trash2 size={13} className="text-rose-500" />
                        </button>
                      )}
                    </div>

                    {/* Content */}
                    <p className="text-sm leading-relaxed text-slate-700 font-medium">{post.content}</p>

                    <div className="mt-3 h-px bg-slate-100" />

                    {/* Actions */}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex gap-4">
                        <motion.button
                          whileTap={{ scale: 0.85 }}
                          onClick={() => toggleLike(post.id)}
                          className="flex items-center gap-1.5"
                        >
                          <Heart
                            size={16}
                            fill={likedPosts.has(post.id) ? '#f43f5e' : 'none'}
                            className={likedPosts.has(post.id) ? 'text-rose-500' : 'text-slate-400'}
                          />
                          <span className={`text-xs font-bold ${likedPosts.has(post.id) ? 'text-rose-500' : 'text-slate-400'}`}>
                            {post.likes + (likedPosts.has(post.id) ? 1 : 0)}
                          </span>
                        </motion.button>
                        <button className="flex items-center gap-1.5">
                          <MessageCircle size={16} className="text-slate-400" />
                          <span className="text-xs font-bold text-slate-400">{post.comments}</span>
                        </button>
                        {post.views && (
                          <button className="flex items-center gap-1.5">
                            <Eye size={15} className="text-slate-300" />
                            <span className="text-xs font-bold text-slate-300">
                              {post.views > 1000 ? `${(post.views / 1000).toFixed(1)}K` : post.views}
                            </span>
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <motion.button
                          whileTap={{ scale: 0.85 }}
                          onClick={() => toggleSave(post.id)}
                          className="h-8 w-8 rounded-xl flex items-center justify-center"
                          style={{ background: savedPosts.has(post.id) ? '#f0fdf4' : '#f8fafc', border: '1px solid #e2e8f0' }}
                        >
                          <Bookmark
                            size={14}
                            fill={savedPosts.has(post.id) ? '#10b981' : 'none'}
                            className={savedPosts.has(post.id) ? 'text-emerald-500' : 'text-slate-400'}
                          />
                        </motion.button>
                        <button className="rounded-full px-3.5 py-1.5 text-[10px] font-black uppercase tracking-wide"
                          style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d' }}>
                          {text.reply}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Compose prompt card */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="rounded-3xl bg-white p-4 mb-4"
                style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.05)' }}
              >
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">{text.share}</p>
                <button
                  onClick={openAskComposer}
                  className="w-full rounded-2xl px-4 py-3 text-sm font-black"
                  style={{
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: '#ffffff',
                    boxShadow: '0 10px 24px rgba(16,185,129,0.25)',
                  }}
                >
                  {text.openAskCommunity}
                </button>
              </motion.div>
            </motion.div>
          )}

          {/* ── EXPERTS TAB ── */}
          {activeTab === 'experts' && (
            <motion.div
              key="experts"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-3"
            >
              {/* Live indicator banner */}
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-2xl p-3.5 flex items-center gap-3"
                style={{ background: 'linear-gradient(135deg, #f0fdf4, #d1fae5)', border: '1px solid #a7f3d0' }}
              >
                <div className="h-8 w-8 rounded-xl bg-emerald-500 flex items-center justify-center shadow-sm">
                  <Award size={16} className="text-white" />
                </div>
                <div>
                  <p className="text-xs font-black text-emerald-800">
                    {experts.filter((item) => item.isLive).length} {isEnglish ? 'experts available now' : 'विशेषज्ञ अभी उपलब्ध'}
                  </p>
                  <p className="text-[10px] text-emerald-600 font-medium">
                    {isEnglish ? 'Avg response: under 2 minutes' : 'औसत जवाब: 2 मिनट से कम'}
                  </p>
                </div>
                <div className="ml-auto flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-black text-emerald-700">{text.liveBadge}</span>
                </div>
              </motion.div>

              {experts.map((expert, index) => (
                <motion.div
                  key={`${expert.name}-${index}`}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.09, type: 'spring', stiffness: 300, damping: 25 }}
                  whileTap={{ scale: 0.99 }}
                  className="relative overflow-hidden rounded-3xl bg-white"
                  style={{
                    boxShadow: expert.isLive
                      ? `0 8px 32px rgba(16,185,129,0.12), 0 2px 8px rgba(0,0,0,0.04)`
                      : '0 4px 16px rgba(0,0,0,0.06)',
                    border: expert.isLive ? `1px solid rgba(16,185,129,0.2)` : '1px solid rgba(0,0,0,0.05)',
                  }}
                >
                  {/* Glow blob */}
                  {expert.isLive && (
                    <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full pointer-events-none opacity-60"
                      style={{ background: `radial-gradient(circle, ${expert.accent}25 0%, transparent 70%)` }}
                    />
                  )}

                  {/* Top gradient strip */}
                  <div className="h-1.5 w-full" style={{ background: expert.bg }} />

                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className="h-14 w-14 flex-shrink-0 flex items-center justify-center rounded-2xl text-2xl shadow-sm"
                        style={{ background: expert.bg, border: `1px solid ${expert.accent}20` }}>
                        {expert.avatar}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-black text-slate-900 text-sm flex items-center gap-1">
                              {expert.name}
                              <ShieldCheck size={12} className="text-emerald-500" />
                            </p>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">{expert.role}</p>
                          </div>
                          <div className="rounded-full px-2.5 py-1 flex-shrink-0"
                            style={{
                              background: expert.isLive ? '#f0fdf4' : '#f8fafc',
                              border: expert.isLive ? '1px solid #bbf7d0' : '1px solid #f1f5f9',
                            }}>
                            <span className={`flex items-center gap-1 text-[9px] font-black uppercase tracking-wide ${expert.isLive ? 'text-emerald-600' : 'text-slate-400'}`}>
                              {expert.isLive && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                              {expert.status}
                            </span>
                          </div>
                        </div>

                        {/* Stars + calls */}
                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex items-center gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} size={10}
                                fill={i < Math.floor(expert.rating) ? '#f59e0b' : 'none'}
                                className={i < Math.floor(expert.rating) ? 'text-amber-400' : 'text-slate-200'}
                              />
                            ))}
                          </div>
                          <span className="text-[10px] font-bold text-slate-400">{expert.rating} · {expert.calls}+ calls</span>
                          <span className="rounded-full px-2 py-0.5 text-[8px] font-black"
                            style={{ background: `${expert.accent}15`, color: expert.accent }}>
                            {expert.speciality}
                          </span>
                        </div>

                        {/* CTA Button */}
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          disabled={!expert.isLive}
                          onClick={openCallModal}
                          className="mt-3 w-full flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-black disabled:opacity-40"
                          style={{
                            background: expert.isLive
                              ? `linear-gradient(135deg, ${expert.accent}, ${expert.accent}cc)`
                              : '#f1f5f9',
                            color: expert.isLive ? '#ffffff' : '#94a3b8',
                            boxShadow: expert.isLive ? `0 6px 20px ${expert.accent}40` : 'none',
                          }}
                        >
                          <Phone size={14} />
                          {expert.isLive
                            ? (isEnglish ? 'Call Now — Free' : 'अभी कॉल करें — फ्री')
                            : (isEnglish ? 'Schedule Call' : 'कॉल शेड्यूल करें')}
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Network promo card */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="rounded-3xl p-6 text-center"
                style={{
                  background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
                }}
              >
                <div className="h-14 w-14 rounded-2xl mx-auto flex items-center justify-center mb-4"
                  style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.3), rgba(59,130,246,0.3))', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <Users size={24} className="text-white" />
                </div>
                <p className="text-white font-black text-lg leading-tight">
                  {isEnglish
                    ? `${profile.crops.join(' & ')} support that feels local & human`
                    : `${profile.crops.join(' & ')} के लिए स्थानीय और भरोसेमंद मदद`}
                </p>
                <p className="mt-2 text-sm text-white/50 font-medium">
                  {isEnglish ? 'Real experts. Real answers. Available 24/7.' : 'वास्तविक विशेषज्ञ। सही जवाब। 24/7 उपलब्ध।'}
                </p>
                <button
                  onClick={() => router.push('/expert')}
                  className="mt-5 w-full rounded-2xl py-3 text-sm font-black text-slate-900"
                  style={{ background: 'linear-gradient(135deg, #34d399, #10b981)' }}>
                  {text.browseExperts} {expertsTotal} {text.expertsSuffix} →
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── FULLSCREEN REEL VIEWER ── */}
      <AnimatePresence>
        {selectedReelId && (
          <motion.div
            key="fullscreen-reel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black"
          >
            {reels.filter((p) => p.id === selectedReelId).map((post) => (
              <motion.div
                key={post.id}
                layoutId={`reel-${post.id}`}
                className="relative h-full w-full overflow-hidden bg-black sm:h-[calc(100dvh-2rem)] sm:max-w-[430px] sm:rounded-[32px]"
              >
                <img src={post.image} alt={post.author} className="absolute inset-0 h-full w-full object-cover" />
                <div className="absolute inset-0"
                  style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.25) 55%, transparent 100%)' }}
                />

                {/* Close */}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => { if (navigator.vibrate) navigator.vibrate(10); setSelectedReelId(null); }}
                  className="absolute left-4 top-12 z-50 flex h-11 w-11 items-center justify-center rounded-full"
                  style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.2)' }}
                >
                  <X size={18} className="text-white" />
                </motion.button>
                {canDeletePost(post.id) && (
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      void deletePost(post.id);
                      setSelectedReelId(null);
                    }}
                    className="absolute right-4 top-12 z-50 flex h-11 w-11 items-center justify-center rounded-full"
                    style={{ background: 'rgba(255,59,59,0.35)', border: '1px solid rgba(255,255,255,0.25)' }}
                  >
                    <Trash2 size={16} className="text-white" />
                  </motion.button>
                )}

                {/* Author + content */}
                <div className="absolute bottom-24 left-4 right-20 z-20">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="h-11 w-11 flex items-center justify-center rounded-2xl font-black text-white text-lg"
                      style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.2)' }}>
                      {post.author?.[0]}
                    </div>
                    <div>
                      <p className="font-black text-white flex items-center gap-1.5">
                        {post.author}
                        <ShieldCheck size={13} className="text-sky-300" />
                      </p>
                      <p className="flex items-center gap-1 text-xs text-white/55">
                        <MapPin size={9} className="text-white/40" />
                        {text.trendingIn} {post.location}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed text-white/90">{post.content}</p>
                </div>

                {/* Side actions */}
                <div className="absolute bottom-28 right-4 z-20 flex flex-col gap-5">
                  {[
                    { icon: Heart, label: post.likes, fill: '#fda4af' },
                    { icon: MessageCircle, label: post.comments, fill: null },
                    { icon: Share2, label: text.shareAction, fill: null },
                    { icon: Bookmark, label: text.saveAction, fill: null },
                  ].map(({ icon: Icon, label, fill }) => (
                    <motion.button
                      whileTap={{ scale: 0.8 }}
                      key={String(label)}
                      className="flex flex-col items-center gap-1"
                      onClick={() => { if (navigator.vibrate) navigator.vibrate(15); }}
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl"
                        style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.15)' }}>
                        <Icon size={22} fill={fill || 'none'} style={{ color: fill || 'white' }} />
                      </div>
                      <span className="text-[10px] font-black text-white/70">{label}</span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── ASK NETWORK FAB (only on reels/discuss) ── */}
      {activeTab !== 'experts' && (
        <motion.div
          initial={{ scale: 0, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 22, delay: 0.4 }}
          className="pointer-events-none fixed inset-x-0 z-[70] flex justify-center"
          style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 96px)' }}
        >
          <div className="pointer-events-auto w-full max-w-[430px] px-4 flex justify-end">
            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={openAskComposer}
              className="flex items-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-black text-white"
              style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                boxShadow: '0 12px 28px rgba(16,185,129,0.4)',
              }}
            >
              <PlusCircle size={18} />
              {text.askCommunity}
            </motion.button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
