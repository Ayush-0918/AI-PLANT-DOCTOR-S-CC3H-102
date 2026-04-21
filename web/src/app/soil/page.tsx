'use client';

import { useState, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, FlaskConical, ChevronRight,
  CheckCircle2, AlertTriangle, Loader2,
  Sprout, RefreshCw, ClipboardList, ImageIcon, ScanLine, Calculator
} from 'lucide-react';
import Link from 'next/link';
import { useFarmerProfile } from '@/context/FarmerProfileContext';
import { useLanguage } from '@/context/LanguageContext';
import { getBackendBaseUrl } from '@/lib/api';
import { normalizeSoilType } from '@/lib/soil';

// ── Soil types ──────────────────────────────────────────────
const SOIL_TYPES = [
  { id: 'clay',   emoji: '🟤', label: 'Clay / चिकनी मिट्टी',     desc: 'Retains water, heavy' },
  { id: 'loam',   emoji: '🌿', label: 'Loam / दोमट मिट्टी',      desc: 'Best for most crops' },
  { id: 'sandy',  emoji: '🏜️', label: 'Sandy / रेतीली मिट्टी',   desc: 'Fast draining, light' },
  { id: 'black',  emoji: '⬛', label: 'Black / काली मिट्टी',      desc: 'Cotton belt soil' },
  { id: 'red',    emoji: '🔴', label: 'Red / लाल मिट्टी',         desc: 'Iron-rich soil' },
  { id: 'alluvial', emoji:'🌊', label: 'Alluvial / जलोढ़ मिट्टी', desc: 'River plains soil' },
];

const PH_OPTIONS = [
  { id: 'acidic',   label: 'Acidic (< 6)', labelHi: 'अम्लीय (< 6)',   color: '#ef4444' },
  { id: 'neutral',  label: 'Neutral (6–7)', labelHi: 'उदासीन (6–7)', color: '#22c55e' },
  { id: 'alkaline', label: 'Alkaline (> 7)', labelHi: 'क्षारीय (> 7)', color: '#3b82f6' },
];

const MOISTURE_OPTIONS = [
  { id: 'dry',       label: 'Dry / सूखी',       icon: '🏜️', color: '#f59e0b' },
  { id: 'moderate',  label: 'Moderate / सामान्य', icon: '🌤️', color: '#22c55e' },
  { id: 'wet',       label: 'Wet / गीली',        icon: '💧', color: '#3b82f6' },
  { id: 'waterlogged', label: 'Waterlogged / जलजमाव', icon: '🌊', color: '#7c3aed' },
];

// ── AI soil advice engine ───────────────────────────────────
function generateSoilAdvice(soil: string, ph: string, moisture: string, crop: string, lang: string) {
  const isHindi = lang !== 'English';

  const adviceDB: Record<string, Record<string, string[]>> = {
    clay: {
      acidic:   [ isHindi ? 'चूना (Lime) डालें — 2-4 क्विंटल/एकड़' : 'Apply Agricultural Lime — 2-4 qtl/acre to raise pH',
                  isHindi ? 'जल निकासी के लिए नाली बनाएं' : 'Install drainage channels to prevent waterlogging',
                  isHindi ? 'जैविक खाद (FYM) 5-8 टन/एकड़ मिलाएं' : 'Mix 5-8 ton FYM/acre to improve porosity' ],
      neutral:  [ isHindi ? 'N:P:K = 60:30:30 kg/acre डालें' : 'Apply N:P:K = 60:30:30 kg/acre balanced dose',
                  isHindi ? 'सरसों/गेहूं के लिए आदर्श है' : 'Ideal for mustard, wheat, paddy crops',
                  isHindi ? 'गहरी जुताई करें — 8-10 इंच' : 'Deep tillage 8-10 inches for better aeration' ],
      alkaline: [ isHindi ? 'जिप्सम 2-3 क्विंटल/एकड़ डालें' : 'Apply Gypsum 2-3 qtl/acre to lower pH',
                  isHindi ? 'हरी खाद (Dhaincha) उगाएं' : 'Grow green manure (Dhaincha) before crop season',
                  isHindi ? 'सल्फर 8-10 kg/acre मिट्टी में मिलाएं' : 'Incorporate Elemental Sulphur 8-10 kg/acre' ],
    },
    loam: {
      acidic:   [ isHindi ? 'यह मिट्टी सुधार के बाद सर्वोत्तम है' : 'Loam is excellent after pH correction',
                  isHindi ? 'चूना 1-2 क्विंटल/एकड़ डालें' : 'Light lime application 1-2 qtl/acre sufficient',
                  isHindi ? 'टमाटर, मिर्च, सब्जियां लगाएं' : 'Suitable for tomato, chili, vegetables after correction' ],
      neutral:  [ isHindi ? 'यह मिट्टी सभी फसलों के लिए सर्वोत्तम है!' : 'Perfect soil! Suitable for all crops',
                  isHindi ? 'N:P:K अनुसार खाद डालें' : 'Follow crop-specific N:P:K schedule',
                  isHindi ? 'जैविक खाद से उर्वरकता बनाए रखें' : 'Maintain fertility with 3-4 ton FYM yearly' ],
      alkaline: [ isHindi ? 'जिप्सम और गंधक का उपयोग करें' : 'Use Gypsum + Sulphur for pH correction',
                  isHindi ? 'सिंचाई में फेरस सल्फेट मिलाएं' : 'Mix Ferrous Sulphate in irrigation water',
                  isHindi ? 'नीम की खली 50 kg/एकड़ डालें' : 'Apply Neem Cake 50 kg/acre as amendment' ],
    },
    sandy: {
      acidic:   [ isHindi ? 'जैविक खाद बड़ी मात्रा में डालें — 10+ टन' : 'Heavy organic matter application essential 10+ ton',
                  isHindi ? 'ड्रिप सिंचाई करें — पानी बचाएं' : 'Use drip irrigation to conserve water',
                  isHindi ? 'मूंगफली, तरबूज, खरबूजा अच्छे रहेंगे' : 'Go for groundnut, watermelon, melon crops' ],
      neutral:  [ isHindi ? 'ड्रिप सिंचाई से साथ-साथ खाद दें' : 'Fertigation through drip irrigation is most effective',
                  isHindi ? 'पोटाश 40-50 kg/एकड़ जरूरी है' : 'Potash application 40-50 kg/acre critical for sandy soil',
                  isHindi ? 'हल्की फसलें लगाएं — मूंग, तिल' : 'Light crops recommended — mungbean, sesame' ],
      alkaline: [ isHindi ? 'सल्फर + गंधक से pH कम करें' : 'Sulphur application to correct high pH',
                  isHindi ? 'गहरी सिंचाई से लवण बाहर निकालें' : 'Leach salts with deep irrigation + drainage',
                  isHindi ? 'हरी खाद उगाकर कार्बन बढ़ाएं' : 'Grow cover crops to build organic carbon' ],
    },
    black: {
      neutral:  [ isHindi ? 'काली मिट्टी कपास के लिए आदर्श है' : 'Black soil is ideal for cotton cultivation',
                  isHindi ? 'जुताई नम अवस्था में करें' : 'Till when slightly moist to avoid clod formation',
                  isHindi ? 'सोयाबीन, चना, ज्वार भी अच्छे विकल्प हैं' : 'Soybean, chickpea, sorghum are excellent alternatives' ],
      acidic:   [ isHindi ? 'चूना डालें, pH 6.5-7 पर लाएं' : 'Lime application to bring pH to 6.5-7 range',
                  isHindi ? 'कपास के लिए बोरॉन 0.5 kg/एकड़ जरूरी' : 'Boron 0.5 kg/acre essential for cotton yield' ],
      alkaline: [ isHindi ? 'जिप्सम 3-4 क्विंटल/एकड़ से शुरू करें' : 'Start with Gypsum 3-4 qtl/acre for sodic correction',
                  isHindi ? 'वर्मीकम्पोस्ट मिलाएं — मिट्टी की संरचना सुधरेगी' : 'Vermicompost improves structure and reduces alkalinity' ],
    },
    red:    { neutral: [ isHindi ? 'लाल मिट्टी में लोहा अधिक होता है' : 'Red soil is iron-rich but low in N, P, organic matter', isHindi ? 'N:P:K 50:25:25 + जिंक सल्फेट डालें' : 'N:P:K 50:25:25 + Zinc Sulphate 5 kg/acre essential', isHindi ? 'दलहनी फसलें नाइट्रोजन बढ़ाएंगी' : 'Legume crops (pulses) will fix nitrogen naturally' ], acidic: [isHindi?'चूना 1.5 क्विंटल/एकड़':'Lime 1.5 qtl/acre to correct acidity'], alkaline:[isHindi?'गंधक 10 kg/एकड़':'Sulphur 10 kg/acre for pH correction'] },
    alluvial:{ neutral: [ isHindi ? 'जलोढ़ मिट्टी उत्तरी भारत की सबसे उपजाऊ मिट्टी है' : 'Alluvial soil is most fertile — found in Indo-Gangetic plains', isHindi ? 'गेहूं, धान, गन्ना के लिए सर्वोत्तम' : 'Best for wheat, paddy, sugarcane, mustard crops', isHindi ? 'N:P:K:S अनुसार संतुलित खाद दें' : 'Follow balanced N:P:K:S fertilization schedule' ], acidic:[isHindi?'चूना 1 qtl/एकड़':'Lime 1 qtl/acre'], alkaline:[isHindi?'जिप्सम 2 qtl/एकड़':'Gypsum 2 qtl/acre + organic matter'] },
  };

  const moistureAdvice: Record<string, string> = {
    dry:          isHindi ? '⚠️ सिंचाई तुरंत करें। ड्रिप सिंचाई सबसे अच्छी है।' : '⚠️ Irrigate immediately. Drip irrigation saves 40% water.',
    moderate:     isHindi ? '✅ मिट्टी की नमी आदर्श है। नियमित सिंचाई जारी रखें।' : '✅ Soil moisture is optimal. Maintain with regular irrigation.',
    wet:          isHindi ? '⚠️ सिंचाई रोकें। अतिरिक्त पानी जड़ सड़न कर सकता है।' : '⚠️ Stop irrigation. Excess water causes root rot diseases.',
    waterlogged:  isHindi ? '🚨 तुरंत जल निकासी करें! फसल 48 घंटे में खराब हो सकती है।' : '🚨 Drain immediately! Crop can die in 48 hours from waterlogging.',
  };

  const soilAdvices = adviceDB[soil]?.[ph] || adviceDB[soil]?.neutral || [
    isHindi ? 'मिट्टी जांच कराएं (मृदा परीक्षण)' : 'Get soil test done at nearest Krishi Kendra',
    isHindi ? 'जैविक खाद डालें' : 'Apply organic manure to improve soil health',
    isHindi ? 'KVK से संपर्क करें' : 'Contact your local KVK for soil-specific advice',
  ];

  const cropAdvice = crop
    ? (isHindi
        ? `${crop} के लिए: नियमित निगरानी और समय पर खाद डालने से 20-30% अतिरिक्त उपज संभव है।`
        : `For ${crop}: Regular monitoring + timely fertilization can increase yield by 20-30%.`)
    : '';

  return { soilAdvices, moistureNote: moistureAdvice[moisture] || '', cropAdvice };
}

// ── Steps ───────────────────────────────────────────────────
type Step = 'photo-scan' | 'photo-result' | 'soil' | 'ph' | 'moisture' | 'result';

type SoilFertilizerPlanItem = {
  nutrient: string;
  product_name: string;
  dosage_kg_per_acre: number;
  dosage_for_farm_kg: number;
  estimated_cost_inr: number;
  estimated_cost_label: string;
  application_method: string;
  advisory: string;
};

type SoilScanResult = {
  success: boolean;
  soil_type?: string;
  confidence_pct?: number | null;
  analysis_method?: string;
  source_model?: string;
  crop_focus?: string;
  area_acres?: number;
  overall_advice?: string;
  nitrogen_advice: string;
  phosphorus_advice?: string;
  potassium_advice?: string;
  estimated_cost?: string;
  estimated_cost_per_acre?: string;
  recommended_fertilizers?: SoilFertilizerPlanItem[];
  raw_text: string;
};

export default function SoilGuidePage() {
  const { profile, updateProfile } = useFarmerProfile();
  const { language } = useLanguage();
  const searchParams = useSearchParams();
  const isHindi = language !== 'English';
  const isPunjabi = language === 'ਪੰਜਾਬੀ';

  // If came from scanner with ?scan=1, start in photo-scan mode
  const initialStep: Step = searchParams?.get('scan') === '1' ? 'photo-scan' : 'soil';

  const [step, setStep]         = useState<Step>(initialStep);
  const [soilType, setSoilType] = useState('');
  const [phLevel, setPhLevel]   = useState('');
  const [moisture, setMoisture] = useState('');
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState<ReturnType<typeof generateSoilAdvice> | null>(null);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanResult, setScanResult] = useState<SoilScanResult | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentCrop = profile.crops?.[0] || '';
  const farmAreaAcres = parseFloat(profile.farmSize) || 1;

  const goNext = (next: Step) => {
    if (navigator.vibrate) navigator.vibrate(12);
    setStep(next);
  };

  const handleSoilImageUpload = useCallback(async (file: File) => {
    setScanLoading(true);
    setScanResult(null);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('crop', currentCrop);
      formData.append('area_acres', String(farmAreaAcres));
      formData.append('growth_stage', 'vegetative');
      formData.append('language', language);
      const res = await fetch(`${getBackendBaseUrl()}/api/v1/ai/soil-scan`, {
        method: 'POST',
        body: formData,
      });
      const data: SoilScanResult = await res.json();
      setScanResult(data);
      if (data?.success && data.soil_type) {
        updateProfile({ soilType: normalizeSoilType(data.soil_type) });
      }
      setStep('photo-result');
    } catch {
      setScanResult({
        success: false,
        nitrogen_advice: 'AI analysis failed. Please retry.',
        phosphorus_advice: '',
        potassium_advice: '',
        raw_text: '',
      });
      setStep('photo-result');
    } finally {
      setScanLoading(false);
    }
  }, [currentCrop, farmAreaAcres, language, updateProfile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleSoilImageUpload(file);
  };

  const handleGetAdvice = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    const advice = generateSoilAdvice(soilType, phLevel, moisture, currentCrop, language);
    setResult(advice);
    setLoading(false);
    setStep('result');
  };

  const reset = () => {
    setStep(searchParams?.get('scan') === '1' ? 'photo-scan' : 'soil');
    setSoilType(''); setPhLevel(''); setMoisture(''); setResult(null);
    setScanResult(null); setImagePreview(null);
  };

  const progressSteps = ['soil', 'ph', 'moisture', 'result'];
  const progressIdx   = progressSteps.indexOf(step);

  return (
    <div className="min-h-full pb-32 bg-[#f8fafc]">

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-50 px-4 py-4 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard"
              className="h-9 w-9 rounded-2xl flex items-center justify-center bg-slate-100"
            >
              <ArrowLeft size={16} className="text-slate-600" />
            </Link>
            <div>
              <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">
                {isPunjabi ? 'AI ਮਿੱਟੀ ਵਿਸ਼ਲੇਸ਼ਣ' : isHindi ? 'AI मृदा विश्लेषण' : 'AI Soil Analysis'}
              </p>
              <h1 className="text-lg font-black text-slate-900">
                {isPunjabi ? 'ਮਿੱਟੀ ਗਾਈਡ' : isHindi ? 'मिट्टी गाइड' : 'Soil Guide'}
              </h1>
            </div>
          </div>
          {step !== 'soil' && (
            <button onClick={reset} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-xs font-black text-slate-600">
              <RefreshCw size={12} /> {isHindi ? 'दोबारा' : 'Reset'}
            </button>
          )}
        </div>

        {/* Progress bar */}
        <div className="flex gap-1.5 mt-3">
          {progressSteps.slice(0,-1).map((s, i) => (
            <div key={s} className="flex-1 h-1.5 rounded-full overflow-hidden bg-slate-100">
              <motion.div
                className="h-full rounded-full bg-emerald-500"
                animate={{ width: i <= progressIdx - 1 ? '100%' : (i === progressIdx && step !== 'result' ? '50%' : '0%') }}
                transition={{ duration: 0.4 }}
              />
            </div>
          ))}
        </div>
      </header>

      <div className="px-4 py-5 space-y-4">
        <AnimatePresence mode="wait">

          {/* ── PHOTO SCAN MODE ── */}
          {step === 'photo-scan' && (
            <motion.div key="photo-scan" initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-20 }} className="space-y-6">
              <div className="text-center pt-4">
                <div
                  className="h-20 w-20 rounded-3xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(16,185,129,0.1))', border: '1px solid rgba(34,197,94,0.3)' }}
                >
                  <ScanLine size={36} className="text-emerald-500" />
                </div>
                <h2 className="text-2xl font-black text-slate-900">
                  {isHindi ? '📸 मिट्टी की फोटो लें' : '📸 Photograph Your Soil'}
                </h2>
                <p className="text-sm text-slate-500 mt-2">
                  {isHindi ? 'खेत की मिट्टी का क्लोज़-अप फोटो खींचें — AI मिट्टी का प्रकार पहचानेगा' : 'Take a close-up photo of your field soil. AI will identify its type, moisture & NPK needs.'}
                </p>
              </div>

              {scanLoading ? (
                <motion.div
                  initial={{ opacity:0 }} animate={{ opacity:1 }}
                  className="rounded-3xl p-10 flex flex-col items-center gap-4 text-center"
                  style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.2)' }}
                >
                  {imagePreview && (
                    <img src={imagePreview} alt="soil" className="h-32 w-32 rounded-2xl object-cover opacity-70" />
                  )}
                  <Loader2 size={32} className="text-emerald-500 animate-spin" />
                  <p className="font-black text-slate-700">{isHindi ? 'AI मिट्टी विश्लेषण कर रहा है...' : 'AI analysing your soil sample...'}</p>
                  <p className="text-xs text-slate-400">{isHindi ? 'थोड़ा इंतज़ार करें' : 'This may take a few seconds'}</p>
                </motion.div>
              ) : (
                <div className="space-y-3">
                  {/* Upload button */}
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full rounded-3xl p-6 flex items-center gap-4"
                    style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '2px dashed #22c55e' }}
                  >
                    <div className="h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 bg-emerald-500">
                      <ImageIcon size={24} className="text-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-lg font-black text-slate-900">{isHindi ? '📁 गैलरी से चुनें' : '📁 Choose from Gallery'}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{isHindi ? 'JPG, PNG — मिट्टी का फोटो डालें' : 'Upload a photo of your soil'}</p>
                    </div>
                    <ChevronRight size={20} className="text-slate-400 ml-auto" />
                  </motion.button>
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />

                  {/* Divider */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-slate-200" />
                    <span className="text-xs font-bold text-slate-400">{isHindi ? 'या' : 'OR'}</span>
                    <div className="flex-1 h-px bg-slate-200" />
                  </div>

                  {/* Manual analysis */}
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setStep('soil')}
                    className="w-full rounded-2xl p-4 flex items-center gap-3 text-left"
                    style={{ background: 'white', border: '1.5px solid #e2e8f0' }}
                  >
                    <ClipboardList size={20} className="text-slate-400 shrink-0" />
                    <div>
                      <p className="font-black text-slate-700 text-sm">{isHindi ? 'मैन्युअल जांच करें' : 'Manual Soil Analysis'}</p>
                      <p className="text-xs text-slate-400">{isHindi ? 'सवालों के जवाब देकर सलाह पाएं' : 'Answer quick questions to get advice'}</p>
                    </div>
                  </motion.button>
                </div>
              )}
            </motion.div>
          )}

          {/* ── PHOTO RESULT ── */}
          {step === 'photo-result' && scanResult && (
            <motion.div
              key="photo-result"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6 pb-20"
            >
              {/* Top Banner / Image */}
              <div className="relative h-64 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-emerald-200/50">
                <img
                  src={imagePreview || '/api/placeholder/400/320'}
                  alt="Soil sample"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
                
                {/* Confidence Badge */}
                <div className="absolute top-4 right-4 px-4 py-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
                  <p className="text-[10px] font-black text-white/70 uppercase tracking-widest text-center">Confidence</p>
                  <p className="text-lg font-black text-emerald-400 text-center">
                    {scanResult.confidence_pct ? `${scanResult.confidence_pct}%` : 'Estimate'}
                  </p>
                </div>

                <div className="absolute bottom-6 left-6 right-6">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">
                      {isHindi ? 'विश्लेषण पूर्ण' : 'Analysis Complete'}
                    </p>
                  </div>
                  <h2 className="text-3xl font-black text-white leading-tight">
                    {scanResult.soil_type || (isHindi ? 'मिट्टी की रिपोर्ट' : 'Soil Report')}
                  </h2>
                </div>
              </div>

              {/* Analysis Summary Card */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-[0.03]">
                  <FlaskConical size={80} />
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-2xl bg-emerald-50 flex items-center justify-center">
                    <ScanLine className="text-emerald-600" size={20} />
                  </div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                    {isHindi ? 'AI मृदा विश्लेषण रिपोर्ट' : 'AI Soil Analysis Report'}
                  </p>
                </div>
                <p className="text-slate-600 leading-relaxed font-medium">
                  {scanResult.overall_advice}
                </p>
              </motion.div>

              {/* NPK Grid */}
              <div className="grid grid-cols-1 gap-4">
                {[
                  { 
                    label: isHindi ? 'N नाइट्रोजन' : 'N Nitrogen', 
                    value: scanResult.nitrogen_advice, 
                    icon: 'N', 
                    color: '#22c55e',
                    bg: '#f0fdf4'
                  },
                  { 
                    label: isHindi ? 'P फॉस्फोरस' : 'P Phosphorus', 
                    value: scanResult.phosphorus_advice, 
                    icon: 'P', 
                    color: '#3b82f6',
                    bg: '#eff6ff'
                  },
                  { 
                    label: isHindi ? 'K पोटैशियम' : 'K Potassium', 
                    value: scanResult.potassium_advice, 
                    icon: 'K', 
                    color: '#7c3aed',
                    bg: '#f5f3ff'
                  },
                ].filter(item => item.value).map((item, idx) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + idx * 0.1 }}
                    className="p-5 rounded-[2rem] border border-slate-100 flex gap-4"
                    style={{ background: 'white' }}
                  >
                    <div 
                      className="h-14 w-14 rounded-[1.25rem] shrink-0 flex items-center justify-center text-xl font-black text-white"
                      style={{ background: item.color }}
                    >
                      {item.icon}
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-1">
                        {item.label}
                      </h3>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {item.value}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Fertilizer Recommendation Section */}
              {scanResult.recommended_fertilizers && scanResult.recommended_fertilizers.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <h3 className="text-lg font-black text-slate-900">
                      {isHindi ? 'सुझाया गया खाद प्लान' : 'Suggested Fertilizer Plan'}
                    </h3>
                    <div className="px-3 py-1 rounded-full bg-emerald-100 text-[10px] font-black text-emerald-700 uppercase">
                      {scanResult.crop_focus || 'Crop Specific'}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {scanResult.recommended_fertilizers.map((item, idx) => (
                      <motion.div
                        key={idx}
                        className="bg-white rounded-[2rem] border border-slate-100 p-5 shadow-sm"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4 + idx * 0.1 }}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">
                              {item.nutrient}
                            </p>
                            <h4 className="text-lg font-black text-slate-900 uppercase">{item.product_name}</h4>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-black text-slate-900">{item.estimated_cost_label}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">{isHindi ? 'अनुमानित' : 'Estimated'}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 mb-4">
                          <div className="bg-slate-50 p-3 rounded-2xl text-center">
                            <p className="text-[9px] font-black text-slate-400 uppercase">{isHindi ? 'खुराक/एकड़' : 'Dose/Acre'}</p>
                            <p className="text-sm font-black text-slate-800">{item.dosage_kg_per_acre} kg</p>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-2xl text-center">
                            <p className="text-[9px] font-black text-slate-400 uppercase">{isHindi ? 'कुल' : 'Total'}</p>
                            <p className="text-sm font-black text-slate-800">{item.dosage_for_farm_kg} kg</p>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-2xl text-center">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-tight">{isHindi ? 'विधि' : 'Method'}</p>
                            <p className="text-[10px] font-bold text-slate-800 leading-tight">{item.application_method.split(' ')[0]}</p>
                          </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100/50">
                          <p className="text-xs text-emerald-800 font-medium leading-relaxed italic">
                            {item.advisory}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Global Bill Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Calculator size={120} />
                </div>
                
                <div className="flex justify-between items-center mb-6">
                  <span className="px-4 py-1.5 rounded-full bg-white/10 text-[10px] font-black uppercase tracking-[0.2em]">
                    {isHindi ? 'अनुमानित कुल बिल' : 'Estimated Total Bill'}
                  </span>
                  <span className="text-xs text-white/50 font-bold">{scanResult.area_acres || farmAreaAcres} acre</span>
                </div>

                <div className="mb-6">
                  <p className="text-5xl font-black mb-1">{scanResult.estimated_cost || '₹0'}</p>
                  <p className="text-xs text-white/40 font-medium tracking-widest uppercase">
                    {isHindi ? 'प्रति एकड़:' : 'Per acre:'} {scanResult.estimated_cost_per_acre}
                  </p>
                </div>

                <div className="pt-6 border-t border-white/10">
                  <p className="text-[10px] text-white/30 leading-relaxed">
                    {isHindi 
                      ? '*कीमतें भारतीय मानक दरों पर आधारित अनुमान हैं (Urea, DAP, Potash)' 
                      : '*Costs are estimated using standard Indian fertilizer rates (Urea, DAP, Potash)'}
                  </p>
                </div>
              </motion.div>

              {/* Plant Doctor Intelligence Suite branding */}
              <div className="pt-8 pb-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Sprout size={16} className="text-emerald-500" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                    Plant Doctor Intelligence Suite
                  </p>
                </div>
              </div>

              {/* Expert Hotline Button */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="w-full bg-violet-600 rounded-[2.5rem] p-6 text-white text-left relative overflow-hidden group shadow-xl shadow-violet-200"
              >
                <div className="absolute top-1/2 -right-4 -translate-y-1/2 opacity-20 group-hover:scale-110 transition-transform duration-500">
                  <RefreshCw size={120} />
                </div>
                <div className="flex items-center gap-4 relative z-10">
                  <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center">
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-0.5">24/7 Expert Support</p>
                    <p className="text-lg font-black">{isHindi ? '24/7 विशेषज्ञ डॉक्टर हॉटलाइन' : '24/7 Expert Doctor Hotline'}</p>
                  </div>
                </div>
              </motion.button>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={reset}
                  className="p-5 rounded-[2rem] bg-white border border-slate-200 text-slate-900 font-black text-sm flex items-center justify-center gap-2"
                >
                  <RefreshCw size={18} /> {isHindi ? 'फिर से स्कैन' : 'Scan Again'}
                </button>
                <button
                   onClick={() => setStep('soil')}
                  className="p-5 rounded-[2rem] bg-slate-900 text-white font-black text-sm flex items-center justify-center gap-2"
                >
                  <ChevronRight size={18} /> {isHindi ? 'विस्तार जांच' : 'Full Analysis'}
                </button>
              </div>

              {scanResult.raw_text && (
                <details className="px-4 group cursor-pointer">
                  <summary className="text-[10px] font-black text-slate-300 uppercase tracking-widest group-open:mb-4">
                    {isHindi ? 'OCR कच्चा डेटा देखें' : 'View raw OCR data'}
                  </summary>
                  <div className="p-4 rounded-3xl bg-slate-50 border border-slate-200 font-mono text-[10px] text-slate-500 whitespace-pre-wrap">
                    {scanResult.raw_text}
                  </div>
                </details>
              )}
            </motion.div>
          )}


          {/* ── STEP 1: SOIL TYPE ── */}
          {step === 'soil' && (
            <motion.div key="soil" initial={{ opacity:0, x:30 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-30 }} className="space-y-4">

              <div>
                <h2 className="text-2xl font-black text-slate-900">
                  {isHindi ? '🌍 आपकी मिट्टी का प्रकार?' : '🌍 What type of soil do you have?'}
                </h2>
                <p className="text-sm text-slate-500 mt-1 font-medium">
                  {isHindi ? 'खेत में हाथ डालकर देखें — कैसी है?' : 'Touch your field soil — what does it feel like?'}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {SOIL_TYPES.map(s => (
                  <motion.button
                    key={s.id}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      setSoilType(s.id);
                      updateProfile({ soilType: normalizeSoilType(s.id) });
                      goNext('ph');
                    }}
                    className="p-4 rounded-2xl text-left transition-all"
                    style={{ background: 'white', border: '1.5px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
                  >
                    <span className="text-2xl">{s.emoji}</span>
                    <p className="text-xs font-black text-slate-800 mt-2 leading-tight">{s.label}</p>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">{s.desc}</p>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── STEP 2: pH LEVEL ── */}
          {step === 'ph' && (
            <motion.div key="ph" initial={{ opacity:0, x:30 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-30 }} className="space-y-4">
              <div>
                <p className="text-[11px] font-black text-emerald-600 uppercase tracking-widest">
                  {SOIL_TYPES.find(s => s.id === soilType)?.emoji} {SOIL_TYPES.find(s => s.id === soilType)?.label}
                </p>
                <h2 className="text-2xl font-black text-slate-900 mt-1">
                  {isHindi ? '🧪 मिट्टी का pH स्तर?' : '🧪 What is your soil pH?'}
                </h2>
                <p className="text-sm text-slate-500 mt-1 font-medium">
                  {isHindi ? 'मृदा परीक्षण रिपोर्ट देखें या अनुमान लगाएं' : 'Check your soil test report or estimate below'}
                </p>
              </div>

              {/* pH visual scale */}
              <div className="rounded-2xl p-4 bg-white border border-slate-100">
                <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  <span>0 — Acidic</span><span>7 — Neutral</span><span>14 — Alkaline</span>
                </div>
                <div className="h-4 rounded-full overflow-hidden"
                  style={{ background: 'linear-gradient(90deg, #ef4444 0%, #f59e0b 25%, #22c55e 50%, #3b82f6 75%, #7c3aed 100%)' }} />
              </div>

              <div className="space-y-3">
                {PH_OPTIONS.map(p => (
                  <motion.button
                    key={p.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { setPhLevel(p.id); goNext('moisture'); }}
                    className="w-full flex items-center justify-between p-4 rounded-2xl text-left bg-white border border-slate-100"
                    style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
                  >
                    <div>
                      <p className="font-black text-slate-800">{isHindi ? p.labelHi : p.label}</p>
                    </div>
                    <div className="h-5 w-5 rounded-full" style={{ background: p.color }} />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── STEP 3: MOISTURE ── */}
          {step === 'moisture' && (
            <motion.div key="moisture" initial={{ opacity:0, x:30 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-30 }} className="space-y-4">
              <h2 className="text-2xl font-black text-slate-900">
                {isHindi ? '💧 अभी मिट्टी कैसी है?' : '💧 Current soil moisture?'}
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {MOISTURE_OPTIONS.map(m => (
                  <motion.button
                    key={m.id}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => { setMoisture(m.id); }}
                    className="p-4 rounded-2xl text-center transition-all"
                    style={{
                      background: moisture === m.id ? `${m.color}15` : 'white',
                      border: moisture === m.id ? `2px solid ${m.color}` : '1.5px solid #e2e8f0',
                    }}
                  >
                    <span className="text-3xl">{m.icon}</span>
                    <p className="text-xs font-black text-slate-800 mt-2 leading-tight">{m.label}</p>
                  </motion.button>
                ))}
              </div>
              <motion.button
                whileTap={{ scale: 0.97 }}
                disabled={!moisture || loading}
                onClick={handleGetAdvice}
                className="w-full py-4 rounded-2xl font-black text-white flex items-center justify-center gap-2 disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', boxShadow: '0 6px 24px rgba(34,197,94,0.4)' }}
              >
                {loading ? <><Loader2 size={18} className="animate-spin" /> {isHindi ? 'विश्लेषण हो रहा है...' : 'Analysing...'}</> : <><ClipboardList size={18} /> {isHindi ? 'मिट्टी सलाह पाएं' : 'Get Soil Advice'}</>}
              </motion.button>
            </motion.div>
          )}

          {/* ── STEP 4: RESULT ── */}
          {step === 'result' && result && (
            <motion.div key="result" initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} className="space-y-4">

              {/* Summary pill */}
              <div className="rounded-2xl p-4 bg-white border border-slate-100" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-2">
                  {isHindi ? 'आपकी मिट्टी का सारांश' : 'Your Soil Summary'}
                </p>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { label: isHindi ? 'प्रकार' : 'Type',     value: SOIL_TYPES.find(s=>s.id===soilType)?.emoji + ' ' + soilType },
                    { label: 'pH',                              value: phLevel },
                    { label: isHindi ? 'नमी' : 'Moisture',     value: moisture },
                    { label: isHindi ? 'फसल' : 'Crop',         value: currentCrop || '—' },
                  ].map(item => (
                    <div key={item.label} className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-100">
                      <p className="text-[9px] text-slate-400 font-medium uppercase">{item.label}</p>
                      <p className="text-xs font-black text-slate-800 capitalize">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Moisture alert */}
              {result.moistureNote && (
                <div className="rounded-2xl p-4 flex items-start gap-3"
                  style={{ background: moisture === 'waterlogged' ? '#fef2f2' : moisture === 'dry' ? '#fffbeb' : '#f0fdf4',
                           border: `1px solid ${moisture === 'waterlogged' ? '#fecaca' : moisture==='dry' ? '#fde68a' : '#bbf7d0'}` }}>
                  {moisture === 'waterlogged' || moisture === 'dry'
                    ? <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
                    : <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />}
                  <p className="text-sm font-bold text-slate-800">{result.moistureNote}</p>
                </div>
              )}

              {/* Soil recommendations */}
              <div className="rounded-2xl overflow-hidden bg-white border border-slate-100" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <div className="px-4 py-3 bg-emerald-500 flex items-center gap-2">
                  <FlaskConical size={15} className="text-white" />
                  <p className="text-sm font-black text-white">
                    {isHindi ? 'मिट्टी सुधार की सलाह' : 'Soil Improvement Advice'}
                  </p>
                </div>
                {result.soilAdvices.map((advice, i) => (
                  <div key={i} className={`px-4 py-3.5 flex items-start gap-3 ${i < result.soilAdvices.length-1 ? 'border-b border-slate-100' : ''}`}>
                    <div className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[10px] font-black text-emerald-700">{i+1}</span>
                    </div>
                    <p className="text-sm text-slate-700 font-medium leading-relaxed">{advice}</p>
                  </div>
                ))}
              </div>

              {/* Crop-specific tip */}
              {result.cropAdvice && (
                <div className="rounded-2xl p-4 flex items-start gap-3"
                  style={{ background: '#f5f3ff', border: '1px solid #ddd6fe' }}>
                  <Sprout size={16} className="text-violet-500 shrink-0 mt-0.5" />
                  <p className="text-sm font-bold text-violet-800">{result.cropAdvice}</p>
                </div>
              )}

              {/* Quick actions */}
              <div className="grid grid-cols-2 gap-3">
                <button onClick={reset}
                  className="py-3.5 rounded-2xl font-black text-sm text-slate-700 flex items-center justify-center gap-2"
                  style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <RefreshCw size={15} /> {isHindi ? 'दोबारा जांचें' : 'Check Again'}
                </button>
                <Link href="/scanner"
                  className="py-3.5 rounded-2xl font-black text-sm text-white flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)', boxShadow: '0 4px 16px rgba(34,197,94,0.35)' }}>
                  <Sprout size={15} /> {isHindi ? 'फसल स्कैन करें' : 'Scan Crop'}
                </Link>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
