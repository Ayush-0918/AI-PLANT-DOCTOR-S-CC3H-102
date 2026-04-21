'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
   Camera,
   ChevronLeft,
   ClipboardList,
   Image as ImageIcon,
   Loader2,
   RefreshCcw,
   ShieldCheck,
   ShoppingBag,
   Sparkles,
   Droplets,
   ScanLine,
   ChevronRight,
   FileText,
   Phone,
   Leaf,
   Mountain,
} from 'lucide-react';
import Link from 'next/link';
import {
   useCallback,
   useEffect,
   useRef,
   useState,
} from 'react';
import { useRouter } from 'next/navigation';
import { useFarmerProfile } from '@/context/FarmerProfileContext';
import { useLanguage } from '@/context/LanguageContext';
import { useExpertCall } from '@/context/ExpertCallContext';
import { fetchJson, getBackendBaseUrl } from '@/lib/api';
import dynamic from 'next/dynamic';

const ThreeLeafModel = dynamic(() => import('@/components/ThreeLeafModel'), { ssr: false });

type ScanMode = 'choose' | 'camera' | 'scanning' | 'result';
type PipelineStep = 'Scan' | 'Diagnose' | 'Prevent' | 'Dosage' | 'Precaution';

type Treatment = {
   medicine?: string;
   raw_medicine?: string;
   dosage?: string;
   instructions?: string;
};

type ScanResponse = {
   success?: boolean;
   prediction_id?: string;
   escalation_required?: boolean;
   escalation_reason?: string;
   confidence_threshold?: number;
   context?: {
      language?: string;
      stage?: string;
      severity?: string;
   };
   disease_risk?: {
      risk_level?: string;
   };
   recommendation?: {
      action?: string;
      action_en?: string;
      action_hi?: string;
   };
   diagnosis: {
      name: string;
      class_id?: string;
      confidence?: number;
      treatment?: Treatment;
   };
};

type DosageResponse = {
   dosage_exact?: {
      chemical?: string;
      water_mix?: string;
   };
   instructions?: string;
   warnings?: string;
};

const PIPELINE_STEPS: PipelineStep[] = ['Scan', 'Diagnose', 'Prevent', 'Dosage', 'Precaution'];

const formatDiseaseName = (rawName: string) => {
   if (!rawName) return '';
   return rawName.replace(/___/g, ' — ').replace(/_/g, ' ');
};

const extractCropFromDiagnosis = (rawName: string) => {
   if (!rawName || !rawName.includes('___')) return '';
   return rawName.split('___')[0].replace(/_\(maize\)/g, ' (maize)').replace(/_/g, ' ').trim();
};

const formatSeverityCode = (raw?: string) => {
   const normalized = (raw || '').trim().toLowerCase();
   if (normalized === 'critical' || normalized === 'high') return 'High Severity';
   if (normalized === 'medium') return 'Medium Severity';
   if (normalized === 'low') return 'Early Detection';
   return '';
};

export default function ScannerPage() {
   const { t, language } = useLanguage();
   const { profile } = useFarmerProfile();
   const { openCallModal } = useExpertCall();
   const router = useRouter();

   const [mode, setMode] = useState<ScanMode>('choose');
   const [activeStep, setActiveStep] = useState<PipelineStep>('Scan');
   const [result, setResult] = useState<ScanResponse | null>(null);
   const [dosage, setDosage] = useState<DosageResponse | null>(null);
   const [imagePreview, setImagePreview] = useState<string | null>(null);
   const [cameraError, setCameraError] = useState<string | null>(null);
   const [isCameraReady, setIsCameraReady] = useState(false);
   const [isMixLoading, setIsMixLoading] = useState(false);
   const [showLanguagePdfModal, setShowLanguagePdfModal] = useState(false);
   const [isPdfLoading, setIsPdfLoading] = useState(false);
   const [scanProgress, setScanProgress] = useState(0);
   const [scanError, setScanError] = useState<string | null>(null);

   const videoRef = useRef<HTMLVideoElement>(null);
   const fileInputRef = useRef<HTMLInputElement>(null);
   const streamRef = useRef<MediaStream | null>(null);

   const diagnosis = result?.diagnosis;
   const diagnosisConfidence = Number(diagnosis?.confidence ?? 0);
   const contextualSeverityLabel = formatSeverityCode(result?.context?.severity);
   const severityLabel =
      contextualSeverityLabel || (diagnosisConfidence >= 90 ? 'High Severity' : diagnosisConfidence >= 75 ? 'Medium Severity' : 'Early Detection');
   const severityColor = severityLabel === 'High Severity' ? '#fda4af' : severityLabel === 'Medium Severity' ? '#fdba74' : '#6ee7d8';

   const stopCamera = useCallback(() => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setIsCameraReady(false);
   }, []);

   const startCamera = useCallback(async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
         setCameraError('Camera not available in this browser.');
         return;
      }
      stopCamera();
      try {
         const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 1280 } },
            audio: false,
         });
         streamRef.current = stream;
         if (videoRef.current) {
            videoRef.current.srcObject = stream;
            await videoRef.current.play().catch(() => undefined);
         }
         setCameraError(null);
         setIsCameraReady(true);
      } catch {
         setCameraError('Camera permission blocked. Scan from gallery instead.');
      }
   }, [stopCamera]);

   useEffect(() => {
      if (mode !== 'camera') { stopCamera(); return undefined; }
      startCamera();
      return () => stopCamera();
   }, [mode, startCamera, stopCamera]);

   useEffect(() => {
      if (mode === 'scanning') {
         setScanProgress(0);
         const interval = setInterval(() => {
            setScanProgress(p => {
               if (p >= 92) { clearInterval(interval); return p; }
               return p + Math.random() * 8;
            });
         }, 200);
         return () => clearInterval(interval);
      }
   }, [mode]);

   const scanBlob = async (blob: Blob) => {
      setMode('scanning');
      setActiveStep('Diagnose');
      setDosage(null);
      setScanError(null);
      if (navigator.vibrate) navigator.vibrate(40);

      const buildPayload = () => {
         const payload = new FormData();
         payload.append('image', new File([blob], 'plant-scan.jpg', { type: 'image/jpeg' }));
         payload.append('lat', `${profile.latitude ?? 25.0}`);
         payload.append('lon', `${profile.longitude ?? 85.3}`);
         payload.append('language', language || 'English');
         payload.append('stage', 'vegetative');
         return payload;
      };

      try {
         const data = await fetchJson<ScanResponse>(`${getBackendBaseUrl()}/api/v1/ai/scan`, {
            method: 'POST',
            body: buildPayload(),
         });

         if (!data?.diagnosis?.name) {
            throw new Error('Invalid scan response');
         }

         setResult(data);
         setMode('result');
         setActiveStep('Prevent');
         if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
      } catch (error) {
         const message = error instanceof Error ? error.message : 'Scan failed. Please retry.';
         setScanError(message);
         setMode('camera');
         setActiveStep('Scan');
      }
   };

   const captureFromCamera = async () => {
      if (!videoRef.current) return;
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      const width = video.videoWidth || 1080;
      const height = video.videoHeight || 1350;
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d')?.drawImage(video, 0, 0, width, height);
      const previewDataUrl = canvas.toDataURL('image/jpeg', 0.92);
      setImagePreview(previewDataUrl);
      canvas.toBlob(async (blob) => { if (blob) await scanBlob(blob); }, 'image/jpeg', 0.92);
   };

   const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
      await scanBlob(file);
   };

   const getSmartDosage = async () => {
      if (!diagnosis) return;
      setIsMixLoading(true);
      setActiveStep('Dosage');
      try {
         const data = await fetchJson<DosageResponse>(`${getBackendBaseUrl()}/api/v1/ai/dosage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
               crop: profile.crops[0] || 'Unknown',
               area_acres: parseFloat(profile.farmSize) || 2.5,
               disease: diagnosis.name,
               language: language || 'English',
            }),
         });
         setDosage(data);
         setActiveStep('Precaution');
      } catch (error) {
         console.error(error);
      } finally {
         setIsMixLoading(false);
      }
   };

   const downloadPDF = async (selectedLanguage: string) => {
      if (!diagnosis) return;
      setIsPdfLoading(true);
      try {
         const langName = selectedLanguage.split(' ')[0]; 
         const diagnosedCrop = extractCropFromDiagnosis(diagnosis.name);
         const reportSeverity = (result?.context?.severity || '').toLowerCase();
         const data = await fetchJson<{ report_url?: string }>(`${getBackendBaseUrl()}/api/v1/ai/report`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
               language: langName,
               farmer_name: profile.name || 'Farmer',
               location: profile.locationLabel || '',
               crop: diagnosedCrop || profile.crops?.[0] || 'Unknown',
               diagnosis_name: diagnosis.name,
               confidence: diagnosisConfidence,
               recommendation: result?.recommendation?.action || '',
               stage: result?.context?.stage || 'vegetative',
               severity: reportSeverity || (severityLabel === 'High Severity' ? 'high' : severityLabel === 'Medium Severity' ? 'medium' : 'low'),
               weather_risk: result?.disease_risk?.risk_level || 'medium',
               treatment: diagnosis.treatment || {},
            }),
         });
         
         if (data?.report_url) {
            window.open(getBackendBaseUrl() + data.report_url, '_blank');
         } else {
            throw new Error('PDF URL missing');
         }
      } catch (error) {
         console.error('Failed to generate PDF:', error);
         alert('Failed to generate PDF. Please try again.');
      } finally {
         setIsPdfLoading(false);
         setShowLanguagePdfModal(false);
      }
   };

   const resetScanner = () => {
      setMode('choose'); setActiveStep('Scan');
      setResult(null); setDosage(null);
      setImagePreview(null); setCameraError(null); setScanError(null);
   };

   return (
      <div
         className="min-h-screen text-white"
         style={{
            background: 'radial-gradient(circle at 50% 0%, rgba(30,64,175,0.22) 0%, transparent 40%), linear-gradient(180deg, #070f1c 0%, #0a1426 46%, #081224 100%)',
         }}
      >

         {/* ── PIPELINE PROGRESS HEADER ── */}
         <div
            className="px-5 pt-4 pb-4 sticky top-0 z-40"
            style={{
               background: 'linear-gradient(180deg, rgba(8,17,31,0.94), rgba(8,17,31,0.82))',
               backdropFilter: 'blur(24px)',
               borderBottom: '1px solid rgba(255,255,255,0.08)',
            }}
         >
            <div className="flex items-center justify-between mb-3">
               <Link
                  href="/dashboard"
                  className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0 transition-opacity active:opacity-70"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
               >
                  <ChevronLeft size={18} className="text-white/70" />
               </Link>

               <div className="flex items-center gap-2">
                  <div
                     className="h-8 w-8 rounded-xl flex items-center justify-center"
                     style={{ background: 'rgba(125,211,252,0.16)', border: '1px solid rgba(125,211,252,0.25)' }}
                  >
                     <ScanLine size={15} className="text-sky-200" />
                  </div>
                  <h1 className="text-base font-black text-white tracking-tight">{t('scanner_app_title')}</h1>
               </div>

               <Link
                  href="/history"
                  className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
               >
                  <ClipboardList size={15} className="text-white/60" />
               </Link>
            </div>

            <div className="flex items-center gap-1.5">
               {PIPELINE_STEPS.map((step, idx) => {
                  const isActive = activeStep === step;
                  const isPast = PIPELINE_STEPS.indexOf(activeStep) > idx;
                  return (
                     <div key={step} className="flex-1 flex flex-col gap-1">
                        <div
                           className="h-1 rounded-full transition-all duration-500"
                           style={{
                              background: isActive
                                 ? 'linear-gradient(90deg, #dbeafe, #7dd3fc, #6ee7d8)'
                                 : isPast
                                 ? 'rgba(125,211,252,0.3)'
                                 : 'rgba(255,255,255,0.06)',
                              boxShadow: isActive ? '0 0 8px rgba(125,211,252,0.6)' : 'none',
                           }}
                        />
                        <p
                           className="text-[8px] font-black uppercase tracking-widest text-center transition-colors duration-300"
                           style={{ color: isActive ? '#dbeafe' : isPast ? 'rgba(125,211,252,0.6)' : 'rgba(255,255,255,0.2)' }}
                        >
                           {t(`scanner_pipeline_${step.toLowerCase()}`)}
                        </p>
                     </div>
                  );
               })}
            </div>
         </div>

         <AnimatePresence mode="wait">

            {/* ── CHOOSE SCAN TYPE ── */}
            {mode === 'choose' && (
               <motion.div
                  key="choose"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex flex-col items-center justify-center min-h-[80vh] px-6 gap-6"
               >
                  <div className="text-center">
                     <div
                        className="h-20 w-20 rounded-3xl flex items-center justify-center mx-auto mb-5"
                        style={{ background: 'rgba(125,211,252,0.12)', border: '1px solid rgba(125,211,252,0.25)', boxShadow: '0 0 40px rgba(125,211,252,0.15)' }}
                     >
                        <ScanLine size={36} className="text-sky-200" />
                     </div>
                     <h2 className="text-3xl font-black text-white tracking-tight">
                        {language === 'हिंदी' || language === 'भोजपुरी' ? 'क्या स्कैन करना है?' : 'What to Scan?'}
                     </h2>
                     <p className="text-sm text-white/40 mt-2 font-medium">
                        {language === 'हिंदी' || language === 'भोजपुरी' ? 'पौधा या मिट्टी — एक चुनें' : 'Choose your scan target below'}
                     </p>
                  </div>

                  <div className="w-full max-w-sm space-y-4">
                     <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setMode('camera')}
                        className="w-full rounded-3xl p-6 text-left flex items-center gap-5"
                        style={{
                           background: 'linear-gradient(135deg, rgba(110,231,216,0.15), rgba(125,211,252,0.08))',
                           border: '1.5px solid rgba(110,231,216,0.3)',
                           boxShadow: '0 8px 32px rgba(110,231,216,0.1)',
                        }}
                     >
                        <div
                           className="h-14 w-14 rounded-2xl flex items-center justify-center shrink-0"
                           style={{ background: 'rgba(110,231,216,0.2)', border: '1px solid rgba(110,231,216,0.4)' }}
                        >
                           <Leaf size={26} className="text-teal-200" />
                        </div>
                        <div>
                           <p className="text-lg font-black text-white">
                              {language === 'हिंदी' || language === 'भोजपुरी' ? '🌿 पौधा स्कैन' : '🌿 Plant Scan'}
                           </p>
                           <p className="text-xs text-white/50 mt-0.5">
                              {language === 'हिंदी' || language === 'भोजपुरी' ? 'पत्ती की बीमारी पहचानें, दवाई पाएं' : 'Detect leaf disease, get medicine & dosage'}
                           </p>
                        </div>
                        <ChevronRight size={20} className="text-white/30 ml-auto shrink-0" />
                     </motion.button>

                     <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => router.push('/soil?scan=1')}
                        className="w-full rounded-3xl p-6 text-left flex items-center gap-5"
                        style={{
                           background: 'linear-gradient(135deg, rgba(180,140,100,0.18), rgba(120,80,40,0.1))',
                           border: '1.5px solid rgba(180,140,100,0.35)',
                           boxShadow: '0 8px 32px rgba(180,140,100,0.1)',
                        }}
                     >
                        <div
                           className="h-14 w-14 rounded-2xl flex items-center justify-center shrink-0"
                           style={{ background: 'rgba(180,140,100,0.25)', border: '1px solid rgba(180,140,100,0.4)' }}
                        >
                           <Mountain size={26} style={{ color: '#d4a26a' }} />
                        </div>
                        <div>
                           <p className="text-lg font-black text-white">
                              {language === 'हिंदी' || language === 'भोजपुरी' ? '🌍 मिट्टी स्कैन' : '🌍 Soil Scan'}
                           </p>
                           <p className="text-xs text-white/50 mt-0.5">
                              {language === 'हिंदी' || language === 'भोजपुरी' ? 'मिट्टी की फोटो से NPK, pH पहचानें' : 'Upload soil photo to detect type, NPK & pH advice'}
                           </p>
                        </div>
                        <ChevronRight size={20} className="text-white/30 ml-auto shrink-0" />
                     </motion.button>
                  </div>

                  <p className="text-[10px] text-white/25 font-bold uppercase tracking-widest text-center">
                     {language === 'हिंदी' || language === 'भोजपुरी' ? 'AI द्वारा संचालित • बिल्कुल मुफ्त' : 'Powered by Edge AI • 100% Free'}
                  </p>
               </motion.div>
            )}

            {/* ── CAMERA MODE ── */}
            {mode === 'camera' && (
               <motion.div
                  key="camera"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  className="flex flex-col"
               >
                  <div className="relative bg-black" style={{ height: '65vh' }}>
                     {cameraError ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 p-8 text-center">
                           <div
                              className="h-20 w-20 rounded-3xl flex items-center justify-center"
                              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                           >
                              <Camera size={36} className="text-white/40" />
                           </div>
                           <div>
                              <p className="text-lg font-bold text-white">{t('scanner_camera_unavailable')}</p>
                              <p className="mt-1.5 text-sm text-white/40">{cameraError}</p>
                           </div>
                           <button
                              onClick={startCamera}
                              className="px-8 py-3 rounded-2xl text-sm font-bold text-white haptic-btn"
                              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}
                           >
                              {t('scanner_try_again')}
                           </button>
                        </div>
                     ) : (
                        <>
                           <video ref={videoRef} muted playsInline className="h-full w-full object-cover" />

                           <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 70% 70% at center, transparent 40%, rgba(0,0,0,0.7) 100%)' }} />

                              <div className="relative w-[70%] aspect-[3/4]">
                                 <div className="scanner-corner scanner-corner-tl" />
                                 <div className="scanner-corner scanner-corner-tr" />
                                 <div className="scanner-corner scanner-corner-bl" />
                                 <div className="scanner-corner scanner-corner-br" />

                                 {isCameraReady && <div className="scan-line" />}

                              <div className="absolute inset-0 flex items-center justify-center">
                                 <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest text-center px-4">
                                    {t('scanner_center_leaf')}
                                    </p>
                                 </div>
                              </div>
                           </div>

                           {isCameraReady && (
                              <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                 <span className="h-1.5 w-1.5 rounded-full bg-sky-200 animate-pulse" />
                                 <span className="text-[10px] font-black text-white/80 uppercase tracking-widest">{t('scanner_live_badge')}</span>
                              </div>
                           )}
                        </>
                     )}
                  </div>


                  <div
                     className="px-5 py-6 flex items-center justify-center gap-6"
                     style={{
                        background: 'rgba(8,12,20,0.95)',
                        backdropFilter: 'blur(20px)',
                     }}
                  >
                     {/* Upload from gallery */}
                     <motion.button
                        whileTap={{ scale: 0.88 }}
                        onClick={() => fileInputRef.current?.click()}
                        className="h-14 w-14 rounded-2xl flex items-center justify-center haptic-btn"
                        style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
                        aria-label="Upload from gallery"
                     >
                        <ImageIcon size={22} className="text-white/70" />
                     </motion.button>

                     <input type="file" ref={fileInputRef} onChange={handleUpload} className="hidden" accept="image/*" />

                     {/* Capture Photo button */}
                     <motion.button
                        whileTap={{ scale: 0.88 }}
                        onClick={captureFromCamera}
                        disabled={!isCameraReady && !cameraError}
                        className="relative h-20 w-20 rounded-full flex flex-col items-center justify-center disabled:opacity-40 haptic-btn"
                        style={{
                           background: 'linear-gradient(135deg, #dbeafe, #7dd3fc, #6ee7d8)',
                           boxShadow: '0 0 0 4px rgba(125,211,252,0.2), 0 10px 32px rgba(125,211,252,0.35)',
                        }}
                        aria-label="Capture Photo"
                     >
                        <div
                           className="absolute inset-0 rounded-full animate-ping opacity-20"
                           style={{ background: '#7dd3fc' }}
                        />
                        <Camera size={30} className="text-slate-900 relative z-10" />
                        <span className="text-[11px] font-bold text-slate-900 mt-1 relative z-10">Capture</span>
                     </motion.button>

                     {/* Stop Camera button */}
                     <motion.button
                        whileTap={{ scale: 0.92 }}
                        onClick={() => setMode('choose')}
                        className="h-14 w-14 rounded-2xl flex flex-col items-center justify-center haptic-btn border border-rose-400/40 bg-rose-400/10"
                        aria-label="Stop Camera"
                     >
                        <span className="text-rose-400 font-bold text-lg">✕</span>
                        <span className="text-[11px] font-bold text-rose-300 mt-0.5">Stop</span>
                     </motion.button>
                  </div>

                  <p className="text-center text-xs text-white/45 font-medium">
                     {t('scanner_upload_gallery')}
                  </p>
                  {scanError && (
                     <p className="px-5 pb-4 text-center text-xs font-semibold text-rose-300/90">
                        {scanError}
                     </p>
                  )}
               </motion.div>
            )}

            {/* ── SCANNING STATE ── */}
            {mode === 'scanning' && (
               <motion.div
                  key="scanning"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center min-h-[70vh] px-8 text-center gap-8"
               >
                  {imagePreview && (
                     <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="relative w-32 h-40 rounded-3xl overflow-hidden"
                        style={{ border: '2px solid rgba(125,211,252,0.34)', boxShadow: '0 0 32px rgba(125,211,252,0.22)' }}
                     >
                        <img src={imagePreview} alt="Scanning" className="h-full w-full object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
                           <Loader2 size={28} className="text-sky-200 animate-spin" />
                        </div>
                        <div className="scan-line" />
                     </motion.div>
                  )}

                  <div>
                     <h2 className="text-2xl font-black text-white tracking-tight">{t('scanner_analyzing_leaf')}</h2>
                     <p className="text-sm text-white/40 mt-2">{t('scanner_checking_pathogens')}</p>
                  </div>

                  <div className="w-full max-w-xs">
                     <div className="flex justify-between mb-2">
                        <span className="text-xs font-bold text-white/40">{t('scanner_ai_processing')}</span>
                        <span className="text-xs font-bold text-sky-200">{Math.min(Math.round(scanProgress), 99)}%</span>
                     </div>
                     <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <motion.div
                           className="h-full rounded-full"
                           style={{ background: 'linear-gradient(90deg, #dbeafe, #7dd3fc, #6ee7d8)', boxShadow: '0 0 8px rgba(125,211,252,0.6)' }}
                           animate={{ width: `${Math.min(scanProgress, 99)}%` }}
                           transition={{ duration: 0.3 }}
                        />
                     </div>
                  </div>

                  <div className="space-y-2 w-full max-w-xs">
                     {[t('scanner_step_0'), t('scanner_step_1'), t('scanner_step_2')].map((step, i) => (
                        <motion.div
                           key={step}
                           initial={{ opacity: 0, x: -10 }}
                           animate={{ opacity: 1, x: 0 }}
                           transition={{ delay: i * 0.4, duration: 0.3 }}
                           className="flex items-center gap-3"
                        >
                           <div
                              className="h-5 w-5 rounded-full flex items-center justify-center shrink-0"
                              style={{ background: 'rgba(125,211,252,0.15)', border: '1px solid rgba(125,211,252,0.3)' }}
                           >
                              <Loader2 size={10} className="text-sky-200 animate-spin" />
                           </div>
                           <span className="text-xs font-semibold text-white/50">{step}</span>
                        </motion.div>
                     ))}
                  </div>
               </motion.div>
            )}

            {/* ── RESULT MODE ── */}
            {mode === 'result' && diagnosis && (
               <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="px-4 pb-32 pt-4 space-y-5 max-w-lg mx-auto"
               >
                  {/* Premium Intelligence Suite Header */}
                  <div className="flex items-center justify-between px-2 mb-1">
                     <div>
                       <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-400">
                         {t('pd_suite')}
                       </h2>
                       <p className="text-[9px] font-bold text-white/30 uppercase tracking-tighter">
                         Powered by PlantVillage AI
                       </p>
                     </div>
                     <div className="flex h-5 items-center gap-1 rounded-full bg-sky-500/10 px-2 py-0 border border-sky-500/20 text-[9px] font-black text-sky-200">
                        <Sparkles size={10} />
                        <span>ULTRA-HD ANALYZED</span>
                     </div>
                  </div>

                  {/* Hero result card */}
                  <div
                     className="relative overflow-hidden rounded-[2.5rem] bg-white/5 border border-white/10 shadow-2xl"
                     style={{
                        boxShadow: `0 24px 64px -12px rgba(0,0,0,0.5), 0 0 20px ${severityColor}15`,
                     }}
                  >
                     <div className="relative h-64 bg-slate-900">
                        {imagePreview ? (
                           <img src={imagePreview} alt="Scanned plant" className="h-full w-full object-cover opacity-90" />
                        ) : (
                           <div className="h-full w-full flex items-center justify-center">
                              <ThreeLeafModel />
                           </div>
                        )}
                        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #080c14 0%, transparent 60%)' }} />

                        <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: 'rgba(0,0,0,0.4)', border: `1px solid ${severityColor}40`, backdropFilter: 'blur(12px)' }}>
                           <div className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: severityColor }} />
                           <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: severityColor }}>
                               {severityLabel === 'High Severity' ? t('scanner_high_severity') : severityLabel === 'Medium Severity' ? t('scanner_medium_severity') : t('scanner_early_detection')}
                           </span>
                        </div>

                        <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                           <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">ID: {result?.prediction_id?.slice(0,8) || 'AUTO'}</span>
                        </div>

                        <div className="absolute bottom-0 left-0 right-0 p-6">
                           <h2 className="text-3xl font-black text-white leading-tight drop-shadow-lg">
                              {formatDiseaseName(diagnosis.name)}
                           </h2>
                           <div className="flex items-center gap-2 mt-2">
                              <div className="flex -space-x-1">
                                 {[1,2,3].map(i => (
                                    <div key={i} className="h-4 w-4 rounded-full border border-slate-900 bg-slate-800 flex items-center justify-center overflow-hidden">
                                        <div className="w-full h-full bg-sky-500/20" />
                                    </div>
                                 ))}
                              </div>
                              <p className="text-[10px] font-bold text-white/40">{t('scanner_based_on_visual')}</p>
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* AI Action Card (Prominent Treatment) */}
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="rounded-[2rem] bg-gradient-to-br from-sky-500/10 to-teal-500/5 border border-white/10 p-6 relative overflow-hidden group"
                  >
                     <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-sky-500/10 blur-2xl rounded-full" />
                     <div className="flex items-center gap-3 mb-4">
                        <div className="h-10 w-10 rounded-2xl bg-sky-400 flex items-center justify-center border border-sky-300 shadow-[0_0_15px_rgba(56,189,248,0.4)]">
                           <Sparkles size={20} className="text-sky-900" />
                        </div>
                        <div>
                           <p className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-400">{t('scanner_ai_action')}</p>
                           <p className="text-xs font-bold text-white/40">{t('scanner_smart_rx')}</p>
                        </div>
                     </div>
                     <p className="text-base font-bold text-white leading-relaxed">
                        {result?.recommendation?.action || 'No specific treatment action generated. Consult an expert.'}
                     </p>
                  </motion.div>

                  <div className="grid grid-cols-2 gap-4">
                     <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="rounded-[1.8rem] p-5 bg-white/5 border border-white/5 backdrop-blur-sm"
                     >
                        <div className="flex items-center gap-2 mb-3">
                           <div className="h-7 w-7 rounded-lg bg-emerald-500/20 flex items-center justify-center border border-emerald-500/20">
                              <ShieldCheck size={16} className="text-emerald-400" />
                           </div>
                           <span className="text-[9px] font-black text-emerald-400/80 uppercase tracking-[0.15em]">{t('scanner_medicine')}</span>
                        </div>
                        <p className="text-sm font-black text-white leading-snug">
                          {diagnosis.treatment?.medicine || 'Supportive Care'}
                        </p>
                     </motion.div>

                     <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="rounded-[1.8rem] p-5 bg-white/5 border border-white/5 backdrop-blur-sm"
                     >
                        <div className="flex items-center gap-2 mb-3">
                           <div className="h-7 w-7 rounded-lg bg-amber-500/20 flex items-center justify-center border border-amber-500/20">
                              <Droplets size={16} className="text-amber-400" />
                           </div>
                           <span className="text-[9px] font-black text-amber-400/80 uppercase tracking-[0.15em]">{t('scanner_dosage')}</span>
                        </div>
                        <p className="text-sm font-black text-white leading-snug">
                           {diagnosis.treatment?.dosage || 'Variable Rate'}
                        </p>
                     </motion.div>
                  </div>

                  {result?.escalation_required && (
                     <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="rounded-[2rem] p-5 relative overflow-hidden bg-rose-500/5 border border-rose-500/20 shadow-lg shadow-rose-500/5"
                     >
                        <div className="flex items-start gap-4">
                           <div className="h-10 w-10 rounded-2xl bg-rose-500/20 flex items-center justify-center border border-rose-500/30 shrink-0">
                              <Phone size={20} className="text-rose-400" />
                           </div>
                           <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-rose-400 mb-1">{t('scanner_human_review')}</p>
                              <p className="text-sm font-bold text-white/90">
                                 Confidence below safety threshold ({result.confidence_threshold ?? 75}%).
                              </p>
                              <p className="mt-1 text-xs text-white/40 leading-relaxed italic">
                                 {t('scanner_spray_decision')}
                              </p>
                           </div>
                        </div>
                     </motion.div>
                  )}

                  {dosage && (
                     <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-[2.2rem] p-6 overflow-hidden bg-white/5 border border-white/10 shadow-xl"
                     >
                        <div className="flex items-center gap-3 mb-5">
                           <div className="h-10 w-10 rounded-2xl bg-cyan-500/20 flex items-center justify-center border border-cyan-500/20">
                              <ClipboardList size={20} className="text-cyan-400" />
                           </div>
                           <div>
                              <span className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.2em] block">{t('scanner_treatment_plan')}</span>
                              <span className="text-[9px] font-bold text-white/30 uppercase">{profile.farmSize} Acres Area</span>
                           </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-5">
                           {[
                              { label: t('scanner_chemical_req'), value: dosage.dosage_exact?.chemical, color: 'emerald' },
                              { label: t('scanner_water_mix'), value: dosage.dosage_exact?.water_mix, color: 'sky' },
                           ].map(({ label, value }) => (
                              <div key={label} className="rounded-2xl p-4 bg-white/5 border border-white/5">
                                 <p className="text-[9px] font-black text-white/30 uppercase tracking-wider mb-2">{label}</p>
                                 <p className="text-base font-black text-white">{value || 'N/A'}</p>
                              </div>
                           ))}
                        </div>
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                           <p className="text-xs font-medium text-white/60 leading-relaxed italic">
                              {dosage.instructions || 'Ensure complete canopy coverage. Do not spray during peak heat hours.'}
                           </p>
                        </div>
                     </motion.div>
                  )}

                  <div className="space-y-4 pt-4">
                     {result?.escalation_required && (
                        <motion.button
                           whileTap={{ scale: 0.95 }}
                           onClick={openCallModal}
                           className="w-full py-5 rounded-[1.8rem] font-black text-xs uppercase tracking-[0.15em] flex items-center justify-center gap-3 haptic-btn bg-white text-slate-900 shadow-xl"
                        >
                           <Phone size={18} /> {t('scanner_btn_talk')}
                        </motion.button>
                     )}

                     {!dosage && (
                        <motion.button
                           whileTap={{ scale: 0.95 }}
                           onClick={getSmartDosage}
                           disabled={isMixLoading}
                           className="w-full py-5 rounded-[1.8rem] font-black text-xs uppercase tracking-[0.15em] flex items-center justify-center gap-3 haptic-btn bg-sky-500 text-white shadow-[0_12px_32px_-8px_rgba(14,165,233,0.5)] disabled:opacity-40"
                        >
                           {isMixLoading ? <Loader2 size={18} className="animate-spin" /> : <Droplets size={18} />}
                           {t('scanner_btn_compute')}
                        </motion.button>
                     )}

                     <div className="flex gap-4">
                        <Link
                           href={`/marketplace?category=Medicines&search=${encodeURIComponent(diagnosis.treatment?.raw_medicine || diagnosis.treatment?.medicine || '')}`}
                           className="flex-1 py-4 rounded-[1.8rem] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 haptic-btn bg-white/5 border border-white/10 hover:bg-white/10"
                        >
                           <ShoppingBag size={16} /> {t('scanner_btn_shop')}
                        </Link>

                        <button
                           onClick={resetScanner}
                           className="flex-1 py-4 rounded-[1.8rem] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 haptic-btn bg-white/5 border border-white/10 hover:bg-white/10"
                        >
                           <RefreshCcw size={16} /> {t('scanner_btn_new')}
                        </button>
                     </div>

                     <button
                        onClick={() => setShowLanguagePdfModal(true)}
                        disabled={isPdfLoading}
                        className="w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 text-white/40 hover:text-white transition-colors"
                     >
                        {isPdfLoading ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
                        {t('scanner_btn_download_report')}
                     </button>
                  </div>
               </motion.div>
            )}
         </AnimatePresence>

         <AnimatePresence>
            {showLanguagePdfModal && (
               <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                  <motion.div
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     exit={{ opacity: 0 }}
                     onClick={() => setShowLanguagePdfModal(false)}
                     className="absolute inset-0 bg-black/80 backdrop-blur-xl"
                  />
                  <motion.div
                     initial={{ opacity: 0, scale: 0.9, y: 20 }}
                     animate={{ opacity: 1, scale: 1, y: 0 }}
                     exit={{ opacity: 0, scale: 0.9, y: 20 }}
                     className="relative w-full max-w-sm rounded-[2.5rem] bg-slate-900/50 border border-white/10 p-8 text-center"
                     style={{ backdropFilter: 'blur(32px)', boxShadow: '0 32px 64px rgba(0,0,0,0.5)' }}
                  >
                     <div className="h-16 w-16 rounded-3xl bg-sky-500/20 flex items-center justify-center mx-auto mb-6 border border-sky-500/30">
                        <FileText size={32} className="text-sky-400" />
                     </div>
                     <h3 className="text-xl font-black text-white mb-2">Select Report Language</h3>
                     <p className="text-sm text-white/40 mb-8 font-medium">Choose your preferred language for the localized Health Report.</p>
                     
                     <div className="grid grid-cols-1 gap-3">
                        {['English (Global)', 'हिंदी (Hindi)', 'मराठी (Marathi)', 'ਪੰਜਾਬੀ (Punjabi)'].map((lang) => (
                           <button
                              key={lang}
                              onClick={() => downloadPDF(lang)}
                              className="w-full py-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all font-black text-sm text-white"
                           >
                              {lang}
                           </button>
                        ))}
                     </div>
                     
                     <button
                        onClick={() => setShowLanguagePdfModal(false)}
                        className="mt-6 text-xs font-black uppercase tracking-widest text-white/30 hover:text-white/60 transition-colors"
                     >
                        Cancel
                     </button>
                  </motion.div>
               </div>
            )}
         </AnimatePresence>
      </div>
   );
}
