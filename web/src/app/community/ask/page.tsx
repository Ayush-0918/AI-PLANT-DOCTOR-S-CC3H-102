'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Lightbulb, Loader2, Play, Send, Sparkles } from 'lucide-react';
import { useFarmerProfile } from '@/context/FarmerProfileContext';
import { useLanguage } from '@/context/LanguageContext';
import { fetchJson } from '@/lib/api';

type AskAssistResponse = {
  formatted_post: string;
  crop: string;
  tags: string[];
  suggested_actions: string[];
  monetization_tip: string;
};

type CreatePostResponse = {
  success?: boolean;
  post?: {
    id: string;
  };
  manage_token?: string;
  business_hint?: {
    next_best_action?: string;
  };
};

type PostMode = 'post' | 'reel';
type PostTemplate = 'roi' | 'lifecycle' | '';

const TOKEN_STORAGE_KEY = 'plant-doctor/community-manage-tokens';

function getTemplateTags(template: PostTemplate): string[] {
  if (template === 'roi') return ['roi', 'profitability', 'farm-finance'];
  if (template === 'lifecycle') return ['lifecycle', 'crop-plan', '90-day-plan'];
  return [];
}

function saveManageToken(postId: string, token: string) {
  if (!postId || !token || typeof window === 'undefined') return;
  try {
    const raw = window.localStorage.getItem(TOKEN_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) as Record<string, string> : {};
    parsed[postId] = token;
    window.localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    // ignore storage errors
  }
}

export default function AskCommunityPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile } = useFarmerProfile();
  const { language } = useLanguage();
  const isEnglish = language === 'English';

  const text = isEnglish
    ? {
        back: 'Back to Community',
        title: 'Ask Community',
        subtitle: 'Create one strong post or reel and get fast answers from farmers.',
        share: 'Share with 12K+ farmers',
        shareSub: 'Clear crop context + symptom details = better replies.',
        crop: 'Crop',
        askType: 'Share Type',
        postType: 'Post',
        reelType: 'Reel',
        question: 'What do you want to ask?',
        questionPh: 'Example: white spots on leaves after rain, what to do?',
        mediaLabel: 'Reel media URL',
        mediaPh: 'Paste image/video URL for your reel preview',
        previewReady: 'Reel preview link ready',
        draft: 'Generate smart draft',
        drafting: 'Preparing draft...',
        yourPost: 'Your content',
        yourPostPh: 'Write what happened in your field, what you already tried, and what help you need.',
        checklist: 'Better replies checklist',
        growthIdea: 'Growth idea',
        postNow: 'Post to Community',
        reelNow: 'Post Reel',
        posting: 'Posting...',
        minError: 'Please write at least 8 characters before posting.',
        reelError: 'For reel, add image/video URL first.',
        posted: 'Posted successfully.',
      }
    : {
        back: 'समुदाय पर वापस जाएं',
        title: 'कम्युनिटी में पूछें',
        subtitle: 'एक अच्छा पोस्ट या रील बनाएं और जल्दी जवाब पाएं।',
        share: '12K+ किसानों के साथ साझा करें',
        shareSub: 'फसल + लक्षण साफ लिखेंगे तो बेहतर जवाब मिलेंगे।',
        crop: 'फसल',
        askType: 'शेयर प्रकार',
        postType: 'पोस्ट',
        reelType: 'रील',
        question: 'आप क्या पूछना चाहते हैं?',
        questionPh: 'उदाहरण: बारिश के बाद पत्तों पर सफेद धब्बे हैं, क्या करें?',
        mediaLabel: 'रील मीडिया URL',
        mediaPh: 'रील के लिए image/video लिंक डालें',
        previewReady: 'रील प्रीव्यू लिंक तैयार है',
        draft: 'स्मार्ट ड्राफ्ट बनाएं',
        drafting: 'ड्राफ्ट तैयार हो रहा है...',
        yourPost: 'आपकी सामग्री',
        yourPostPh: 'खेत में क्या समस्या है, क्या ट्राय किया, और कैसी मदद चाहिए लिखें।',
        checklist: 'बेहतर जवाब चेकलिस्ट',
        growthIdea: 'ग्रोथ आइडिया',
        postNow: 'कम्युनिटी में पोस्ट करें',
        reelNow: 'रील पोस्ट करें',
        posting: 'पोस्ट हो रहा है...',
        minError: 'पोस्ट करने से पहले कम से कम 8 अक्षर लिखें।',
        reelError: 'रील के लिए image/video URL डालना जरूरी है।',
        posted: 'सफलतापूर्वक पोस्ट हो गया।',
      };

  const quickPrompts = isEnglish
    ? [
        'Pest issue spreading fast',
        'Leaves turning yellow',
        'Irrigation cost too high',
        'Need yield improvement tips',
      ]
    : [
        'कीट तेजी से फैल रहे हैं',
        'पत्ते पीले हो रहे हैं',
        'सिंचाई खर्च बहुत बढ़ गया',
        'उपज बढ़ाने की सलाह चाहिए',
      ];

  const queryCrop = searchParams.get('crop')?.trim();
  const queryQuestion = searchParams.get('q')?.trim();
  const queryPrefill = searchParams.get('prefill')?.trim();
  const queryPrefillQuestion = searchParams.get('prefill_question')?.trim();
  const queryTemplateRaw = (searchParams.get('template') || '').trim().toLowerCase();
  const queryTemplate: PostTemplate =
    queryTemplateRaw === 'roi' || queryTemplateRaw === 'lifecycle' ? queryTemplateRaw : '';
  const queryModeRaw = (searchParams.get('mode') || '').trim().toLowerCase();
  const queryMode: PostMode = queryModeRaw === 'reel' ? 'reel' : 'post';
  const cropList = useMemo(
    () => (profile.crops.length ? profile.crops : ['Wheat', 'Rice', 'Tomato']),
    [profile.crops]
  );

  const [crop, setCrop] = useState(queryCrop || cropList[0]);
  const [postMode, setPostMode] = useState<PostMode>(queryMode);
  const [question, setQuestion] = useState(queryQuestion || queryPrefillQuestion || '');
  const [content, setContent] = useState(queryPrefill || '');
  const [mediaUrl, setMediaUrl] = useState('');
  const [assistTips, setAssistTips] = useState<string[]>([]);
  const [incomeTip, setIncomeTip] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isAssistLoading, setIsAssistLoading] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => {
    if (queryPrefill) {
      setContent(queryPrefill);
      if (queryTemplate === 'lifecycle') {
        setAssistTips(
          isEnglish
            ? [
                'Mention your irrigation source in the plan.',
                'Include any spray already completed.',
                'Ask farmers in the same crop stage for local timing tweaks.',
              ]
            : [
                'प्लान में सिंचाई का तरीका जरूर लिखें।',
                'कौन सा स्प्रे पहले किया है, यह जोड़ें।',
                'इसी स्टेज के किसानों से लोकल टाइमिंग सुझाव मांगें।',
              ]
        );
      } else if (queryTemplate === 'roi') {
        setAssistTips(
          isEnglish
            ? [
                'Mention farm area and stage for better ROI suggestions.',
                'Ask for cost-saving alternatives (fertilizer, irrigation, labor).',
                'Share mandi trend so others can suggest timing.',
              ]
            : [
                'बेहतर सलाह के लिए खेत का एरिया और स्टेज लिखें।',
                'खर्च कम करने के विकल्प पूछें (खाद, सिंचाई, मजदूरी)।',
                'मंडी ट्रेंड जोड़ें ताकि बिक्री टाइमिंग सुझाव मिलें।',
              ]
        );
      }
      setIncomeTip(
        queryTemplate === 'roi'
          ? (isEnglish
              ? 'ROI posts often get high-quality practical tips from nearby farmers.'
              : 'ROI पोस्ट पर आसपास के किसानों से practical सुझाव जल्दी मिलते हैं।')
          : (queryTemplate === 'lifecycle'
              ? (isEnglish
                  ? 'Lifecycle posts help you benchmark task timing with other farmers.'
                  : 'Lifecycle पोस्ट से आप दूसरे किसानों की timing से अपना प्लान compare कर सकते हैं।')
              : '')
      );
      return;
    }
    if (!queryQuestion) return;
    void generateDraft(queryQuestion, queryCrop || cropList[0]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generateDraft = async (seedQuestion?: string, seedCrop?: string) => {
    const questionText = (seedQuestion ?? question).trim();
    const cropText = seedCrop ?? crop;
    const fallbackQuestion = questionText || (isEnglish ? `Need urgent help in ${cropText}.` : `${cropText} में तुरंत मदद चाहिए।`);

    setError('');
    setSuccess('');
    setIsAssistLoading(true);
    try {
      const assist = await fetchJson<AskAssistResponse>('/api/v1/community/ask-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: fallbackQuestion,
          crop: cropText,
          location: profile.locationLabel || 'India',
        }),
      });
      setQuestion(fallbackQuestion);
      setCrop(assist.crop || cropText);
      setContent(assist.formatted_post || fallbackQuestion);
      setAssistTips(Array.isArray(assist.suggested_actions) ? assist.suggested_actions : []);
      setIncomeTip(assist.monetization_tip || '');
    } catch {
      setContent(
        isEnglish
          ? `Need quick help in ${cropText} from ${profile.locationLabel || 'my area'}. ${fallbackQuestion}`
          : `${cropText} में ${profile.locationLabel || 'मेरे क्षेत्र'} से तुरंत मदद चाहिए। ${fallbackQuestion}`
      );
      setAssistTips(
        isEnglish
          ? [
              'Add 1 clear symptom.',
              'Mention days since issue started.',
              'Share what spray or treatment you already used.',
            ]
          : [
              '1 स्पष्ट लक्षण लिखें।',
              'समस्या कितने दिन से है लिखें।',
              'कौन सी दवा/स्प्रे पहले किया है लिखें।',
            ]
      );
      setIncomeTip(
        isEnglish
          ? 'Good community posts can convert into expert sessions and shop leads.'
          : 'अच्छे कम्युनिटी पोस्ट से expert call और shop leads बढ़ती हैं।'
      );
    } finally {
      setIsAssistLoading(false);
    }
  };

  const submitPost = async () => {
    const finalContent = content.trim();
    const finalMedia = mediaUrl.trim();

    if (finalContent.length < 8 || isPosting) {
      setError(text.minError);
      return;
    }
    if (postMode === 'reel' && !finalMedia) {
      setError(text.reelError);
      return;
    }

    setError('');
    setSuccess('');
    setIsPosting(true);
    try {
      const payload = await fetchJson<CreatePostResponse>('/api/v1/community/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: finalContent,
          location: profile.locationLabel || 'India',
          crop,
          tags: getTemplateTags(queryTemplate),
          author: profile.name || '',
          media_type: postMode,
          image: postMode === 'reel' ? finalMedia : '',
          video_url: postMode === 'reel' ? finalMedia : '',
        }),
      });

      if (payload.post?.id && payload.manage_token) {
        saveManageToken(payload.post.id, payload.manage_token);
      }
      const growthTip = payload.business_hint?.next_best_action;
      setSuccess(growthTip ? `${text.posted} ${growthTip}` : text.posted);
      if (navigator.vibrate) navigator.vibrate(16);
      window.setTimeout(() => {
        router.push('/community?tab=discuss&posted=1');
      }, 450);
    } catch (postError) {
      setError(postError instanceof Error ? postError.message : (isEnglish ? 'Could not post right now. Try again.' : 'अभी पोस्ट नहीं हो पाया, फिर कोशिश करें।'));
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="min-h-full bg-[#f8fafc] text-slate-800" style={{ paddingBottom: '220px' }}>
      <div
        className="sticky top-0 z-40 px-4 pb-3 pt-4"
        style={{
          background: 'rgba(248,250,252,0.92)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          borderBottom: '1px solid rgba(0,0,0,0.05)',
        }}
      >
        <button
          onClick={() => router.push('/community?tab=discuss')}
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-slate-700"
          style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}
        >
          <ArrowLeft size={15} />
          {text.back}
        </button>
        <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-900">{text.title}</h1>
        <p className="mt-1 text-xs font-semibold text-slate-500">{text.subtitle}</p>
      </div>

      <div className="space-y-4 px-4 pt-4">
        <div
          className="rounded-3xl border p-4"
          style={{ background: 'linear-gradient(135deg, #ecfeff, #f0fdf4)', borderColor: '#99f6e4' }}
        >
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">{text.share}</p>
          <p className="mt-1 text-sm font-semibold text-slate-700">{text.shareSub}</p>
        </div>

        <div className="rounded-3xl bg-white p-4" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.05)' }}>
          <label className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">{text.crop}</label>
          <div className="mt-2 flex gap-2 overflow-x-auto hide-scrollbar">
            {cropList.map((cropName) => (
              <button
                key={cropName}
                onClick={() => setCrop(cropName)}
                className="shrink-0 rounded-full px-3.5 py-1.5 text-xs font-black"
                style={{
                  background: crop === cropName ? '#10b981' : '#f8fafc',
                  border: crop === cropName ? '1px solid #10b981' : '1px solid #e2e8f0',
                  color: crop === cropName ? '#ffffff' : '#64748b',
                }}
              >
                {cropName}
              </button>
            ))}
          </div>

          <label className="mt-4 block text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">{text.askType}</label>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {(['post', 'reel'] as PostMode[]).map((mode) => {
              const active = postMode === mode;
              return (
                <button
                  key={mode}
                  onClick={() => setPostMode(mode)}
                  className="rounded-2xl px-3 py-2.5 text-sm font-black"
                  style={{
                    background: active ? '#ecfdf5' : '#f8fafc',
                    border: active ? '1px solid #34d399' : '1px solid #e2e8f0',
                    color: active ? '#047857' : '#64748b',
                  }}
                >
                  {mode === 'post' ? text.postType : text.reelType}
                </button>
              );
            })}
          </div>

          <label className="mt-4 block text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">{text.question}</label>
          <input
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder={text.questionPh}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-700 placeholder:text-slate-400 outline-none"
          />

          <div className="mt-3 flex flex-wrap gap-2">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => setQuestion(prompt)}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-500"
              >
                {prompt}
              </button>
            ))}
          </div>

          {postMode === 'reel' && (
            <>
              <label className="mt-4 block text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">{text.mediaLabel}</label>
              <input
                value={mediaUrl}
                onChange={(event) => setMediaUrl(event.target.value)}
                placeholder={text.mediaPh}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-700 placeholder:text-slate-400 outline-none"
              />
              {mediaUrl.trim() && (
                <div className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 font-semibold inline-flex items-center gap-1.5">
                  <Play size={12} className="text-emerald-600" />
                  {text.previewReady}
                </div>
              )}
            </>
          )}

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => { void generateDraft(); }}
            disabled={isAssistLoading}
            className="mt-4 w-full rounded-2xl px-4 py-3 text-sm font-black text-white disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #0ea5e9, #0284c7)' }}
          >
            {isAssistLoading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 size={15} className="animate-spin" />
                {text.drafting}
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                <Sparkles size={15} />
                {text.draft}
              </span>
            )}
          </motion.button>
        </div>

        <div className="rounded-3xl bg-white p-4" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.05)' }}>
          <label className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">{text.yourPost}</label>
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder={text.yourPostPh}
            className="mt-2 h-36 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm font-medium leading-relaxed text-slate-700 placeholder:text-slate-400 outline-none"
          />

          {assistTips.length > 0 && (
            <div className="mt-3 rounded-2xl border p-3" style={{ borderColor: '#bfdbfe', background: '#eff6ff' }}>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-sky-700">{text.checklist}</p>
              <div className="mt-2 space-y-1.5">
                {assistTips.map((tip) => (
                  <p key={tip} className="text-xs font-semibold text-slate-600">- {tip}</p>
                ))}
              </div>
            </div>
          )}

          {incomeTip && (
            <div className="mt-3 rounded-2xl border p-3" style={{ borderColor: '#86efac', background: '#f0fdf4' }}>
              <p className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
                <Lightbulb size={12} />
                {text.growthIdea}
              </p>
              <p className="mt-1 text-xs font-semibold text-emerald-800">{incomeTip}</p>
            </div>
          )}

          {error && <p className="mt-3 text-xs font-semibold text-rose-600">{error}</p>}
          {success && <p className="mt-3 text-xs font-semibold text-emerald-700">{success}</p>}
        </div>
      </div>

      <div
        className="pointer-events-none fixed inset-x-0 z-[70] flex justify-center"
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 96px)' }}
      >
        <div className="pointer-events-auto w-full max-w-[430px] px-4">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => { void submitPost(); }}
            disabled={isPosting}
            className="w-full rounded-2xl px-5 py-3.5 text-sm font-black text-white disabled:opacity-60"
            style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              boxShadow: '0 12px 28px rgba(16,185,129,0.35)',
            }}
          >
            {isPosting ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                {text.posting}
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                <Send size={16} />
                {postMode === 'reel' ? text.reelNow : text.postNow}
              </span>
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
