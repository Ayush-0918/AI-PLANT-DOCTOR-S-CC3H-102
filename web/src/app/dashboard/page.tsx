'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  AlertTriangle,
  ArrowUpRight,
  Bell,
  Camera,
  Cloud,
  Droplets,
  Leaf,
  Map,
  MapPin,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Sun,
  TrendingDown,
  Users,
  Wind,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAtmosphere } from '@/context/AtmosphericContext';
import { useFarmerProfile } from '@/context/FarmerProfileContext';
import { useLanguage } from '@/context/LanguageContext';
import { formatSoilTypeLabel, normalizeSoilType } from '@/lib/soil';
import WealthPredictor from '@/components/WealthPredictor';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

type WeatherData = {
  temperature: string;
  feels_like: string;
  humidity: string;
  wind_speed: string;
  description: string;
  city: string;
  weather_alerts: string[];
};

type ThreatData = {
  disease: string;
  distance_km: number;
  alert_level: string;
  recommendation: string;
  farmer_count: number;
};

type AlertItem = {
  type: string;
  title: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
};

type SubscriptionStatus = {
  plan_code: string;
  plan_name: string;
  status: string;
};

type SmartIrrigationData = {
  recommendation: string;
  irrigation_interval_days: number;
  source: string;
  week_plan: Array<{ date: string; action: string; rain_mm: number; note: string }>;
};

type RoiDashboardData = {
  crop: string;
  market: {
    mandi_price_per_kg: number;
    trend: string;
    delta_pct: number;
    insight: string;
  };
  investment: {
    fertilizer_inr: number;
    operations_inr: number;
    total_inr: number;
  };
  income: {
    estimated_yield_kg: number;
    gross_inr: number;
    net_inr: number;
    roi_pct: number;
    margin_pct: number;
  };
};

const cropIcons: Record<string, string> = {
  Wheat: '🌾', Rice: '🌿', Tomato: '🍅', Potato: '🥔',
  Corn: '🌽', Cotton: '☁️', Soybean: '🫘', Sugarcane: '🎋', Default: '🌱',
};

// Crop name translations per language
const cropTranslations: Record<string, Record<string, string>> = {
  'हिंदी': { Wheat: 'गेहूँ', Rice: 'धान', Tomato: 'टमाटर', Potato: 'आलू', Corn: 'मक्का', Cotton: 'कपास', Soybean: 'सोयाबीन', Sugarcane: 'गन्ना' },
  'भोजपुरी': { Wheat: 'गेहूँ', Rice: 'धान', Tomato: 'टमाटर', Potato: 'आलू', Corn: 'मक्का', Cotton: 'कपास' },
  'ਪੰਜਾਬੀ': { Wheat: 'ਕਣਕ', Rice: 'ਝੋਨਾ', Tomato: 'ਟਮਾਟਰ', Potato: 'ਆਲੂ', Corn: 'ਮੱਕੀ', Cotton: 'ਕਪਾਹ' },
  'मैथिली': { Wheat: 'गहूम', Rice: 'धान', Tomato: 'टमाटर', Potato: 'आलू', Corn: 'मकई' },
  'मराठी': { Wheat: 'गहू', Rice: 'भात', Tomato: 'टोमॅटो', Potato: 'बटाटा', Corn: 'मका', Cotton: 'कापूस' },
  'ગુજરાતી': { Wheat: 'ઘઉં', Rice: 'ડાંગ', Tomato: 'ટામેટા', Potato: 'બટાકા', Corn: 'મકાઈ', Cotton: 'કપાસ' },
  'తెలుగు': { Wheat: 'గోధుమ', Rice: 'వరి', Tomato: 'టమాట', Potato: 'బంగాళా', Corn: 'మొక్కజొన్న' },
};

export default function DashboardPage() {
  const { profile, updateProfile } = useFarmerProfile();
  const { setHealthScore } = useAtmosphere();
  const { language, t } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [time, setTime] = useState(() =>
    new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
  );
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [threatAlert, setThreatAlert] = useState<ThreatData | null>(null);
  const [mandiPrice, setMandiPrice] = useState<{ price: string; trend: string; status?: 'up' | 'down' | 'stable' } | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [smartIrrigation, setSmartIrrigation] = useState<SmartIrrigationData | null>(null);
  const [roiData, setRoiData] = useState<RoiDashboardData | null>(null);

  const fetchMandiPrices = useCallback(async (crop: string) => {
    try {
      const [priceRes, trendRes] = await Promise.all([
        fetch(`${API_BASE}/api/v1/mandi/prices?commodity=${crop}&limit=1`),
        fetch(`${API_BASE}/api/v1/mandi/trends?commodity=${crop}`)
      ]);

      if (priceRes.ok) {
        const data = await priceRes.json();
        if (data.success && data.data.length > 0) {
          const item = data.data[0];
          let trendVal = '-2.4%';
          let trendStat = 'down';

          if (trendRes.ok) {
            const trendData = await trendRes.json();
            const trends = Array.isArray(trendData?.trends)
              ? (trendData.trends as Array<{ commodity?: string; delta_pct?: number; trend?: 'up' | 'down' | 'stable' }>)
              : [];
            const cropTrend = trends.find((item) => (item.commodity || '').toLowerCase() === crop.toLowerCase());
            if (cropTrend) {
              const delta = Number(cropTrend.delta_pct || 0);
              trendVal = `${delta > 0 ? '+' : ''}${delta}%`;
              trendStat = cropTrend.trend || 'stable';
            }
          }

          setMandiPrice({
            price: `₹${item.modal_price.toLocaleString('en-IN')}`,
            trend: trendVal,
            status: trendStat as 'up' | 'down' | 'stable'
          });
        }
      }
    } catch {
      console.warn('Mandi API error');
    }
  }, []);

  const fetchWeatherAndThreats = useCallback(async (lat: number, lon: number) => {
    try {
      const [wRes, tRes] = await Promise.all([
        fetch(`${API_BASE}/api/v1/geo/weather?lat=${lat}&lon=${lon}`),
        fetch(`${API_BASE}/api/v1/geo/threats?lat=${lat}&lon=${lon}&radius=10`),
      ]);
      if (wRes.ok) {
        const wData = await wRes.json();
        const weatherNode = wData?.weather || {};
        setWeather({
          temperature: `${Math.round(weatherNode.temperature_c ?? 0)}°C`,
          feels_like: `${Math.round(weatherNode.feels_like_c ?? 0)}°C`,
          humidity: `${Math.round(weatherNode.humidity_pct ?? 0)}%`,
          wind_speed: `${Math.round(weatherNode.wind_kmh ?? 0)} km/h`,
          description: weatherNode.description || 'Weather unavailable',
          city: weatherNode.city || profile.locationLabel || 'Your location',
          weather_alerts: weatherNode?.disease_risk?.farming_alerts || [],
        });
        const riskScore = Number(weatherNode?.disease_risk?.risk_score || 0);
        setHealthScore(Math.max(45, 100 - riskScore));
      }
      if (tRes.ok) {
        const tData = await tRes.json();
        if (tData.has_threats && tData.threats?.length > 0) {
          setThreatAlert(tData.threats[0]);
        }
      }
    } catch {
      console.warn('Weather API unavailable, using defaults');
    } finally {
      setWeatherLoading(false);
    }
  }, [profile.locationLabel, setHealthScore]);

  const fetchSubscriptionStatus = useCallback(async (userId: string) => {
    try {
      const response = await fetch(
        `${API_BASE}/api/v1/store/subscription/status?user_id=${encodeURIComponent(userId)}`
      );
      if (!response.ok) return;
      const payload = await response.json();
      if (payload?.success) {
        setSubscription({
          plan_code: payload.plan_code || 'basic',
          plan_name: payload.plan_name || 'Basic',
          status: payload.status || 'trial',
        });
      }
    } catch {
      // keep dashboard working even if subscription endpoint is unavailable
    }
  }, []);

  const fetchIntelligenceInsights = useCallback(async (lat: number, lon: number, crop: string) => {
    try {
      const areaAcre = parseFloat(profile.farmSize) || 1;
      const soilType = normalizeSoilType(profile.soilType);
      const [irrigationRes, roiRes] = await Promise.all([
        fetch(
          `${API_BASE}/api/v1/intelligence/smart-irrigation?crop=${encodeURIComponent(
            crop
          )}&soil_type=${encodeURIComponent(soilType)}&lat=${lat}&lon=${lon}`
        ),
        fetch(
          `${API_BASE}/api/v1/intelligence/roi-dashboard?crop=${encodeURIComponent(
            crop
          )}&area_acres=${areaAcre}&soil_type=${encodeURIComponent(soilType)}&growth_stage=vegetative`
        ),
      ]);

      if (irrigationRes.ok) {
        const irrigationPayload = await irrigationRes.json();
        if (irrigationPayload?.success) {
          setSmartIrrigation(irrigationPayload);
        }
      }

      if (roiRes.ok) {
        const roiPayload = await roiRes.json();
        if (roiPayload?.success) {
          setRoiData(roiPayload);
        }
      }
    } catch {
      // keep dashboard resilient if intelligence APIs are not reachable
    }
  }, [profile.farmSize, profile.soilType]);
  const [lat, setLat] = useState<number | null>(null);
  const [lon, setLon] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
    setHealthScore(85 + (Math.random() * 5)); // Dynamic base health
    const update = () => setTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
    const timer = setInterval(update, 60000);

    const derivedUserId = `${profile.name || 'farmer'}-${profile.locationLabel || 'india'}`
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '-')
      .slice(0, 60);
    void fetchSubscriptionStatus(derivedUserId);

    // Try geolocation, fallback to Bihar coords
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(pos.coords.latitude);
          setLon(pos.coords.longitude);
          void fetchWeatherAndThreats(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          setLat(25.5);
          setLon(85.1);
          void fetchWeatherAndThreats(25.5, 85.1);
        },
        { timeout: 5000 }
      );
    } else {
      setLat(25.5);
      setLon(85.1);
      void fetchWeatherAndThreats(25.5, 85.1);
    }

    return () => clearInterval(timer);
  }, [setHealthScore, fetchWeatherAndThreats, fetchSubscriptionStatus, profile.name, profile.locationLabel]);

  // Refetch crop-specific data whenever the activeCrop or location changes
  useEffect(() => {
    const activeCrop = profile.activeCrop || profile.crops?.[0] || 'Wheat';
    fetchMandiPrices(activeCrop);
    const resolvedLat = lat ?? profile.latitude ?? 25.5;
    const resolvedLon = lon ?? profile.longitude ?? 85.1;
    void fetchIntelligenceInsights(resolvedLat, resolvedLon, activeCrop);
  }, [profile.activeCrop, profile.crops, lat, lon, profile.latitude, profile.longitude, fetchMandiPrices, fetchIntelligenceInsights]);


  const firstName = useMemo(() => profile.name.split(' ')[0] || 'Kishan', [profile.name]);

  // ── Language-aware strings ────────────────────────────────
  type LangStrings = {
    greeting: ((args: { h: number }) => string) | string; copilot: string; tagline: string; subtitle: string;
    farmHealth: string; activeFields: string; watchAlerts: string;
    scanBtn: string; weather: string; sunny: string; rustRisk: string;
    wind: string; humidity: string; tomorrow: string; lightRain: string;
    actionCenter: string; tools: string;
    soilHealth: string; soilSub: string; fertPlan: string; fertSub: string;
    agriStore: string; agriSub: string; farmerNet: string; farmerSub: string;
    aiDiag: string; scanHeadline: string; scanSub: string; takePic: string;
    marketIntel: string; live: string; pricesSell: string; priceDown: string; perQuintal: string;
    highRust: string; rustMsg: string; rainAlert: string; rainMsg: string;
  };
  const L: Record<string, LangStrings> = {
    English: {
      greeting: ({ h }: { h: number }) => h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening',
      copilot: 'Plant Doctor Copilot', tagline: 'Premium crop intelligence', subtitle: 'Diagnose disease, track field risk, and connect farmers to trusted experts from one mobile-first workspace.',
      farmHealth: 'Field Condition', activeFields: 'Fields Watched', watchAlerts: 'Important Alerts',
      scanBtn: 'Take a Picture', weather: 'Field Weather', sunny: 'Sunny sky · mild breeze', rustRisk: 'Rust Risk',
      wind: 'Wind', humidity: 'Humidity', tomorrow: 'Tomorrow', lightRain: 'Light Rain',
      actionCenter: 'Action Center', tools: 'Tools',
      soilHealth: 'Soil Health', soilSub: 'NPK, pH and moisture',
      fertPlan: 'Fertilizer Plan', fertSub: 'Exact dosage by acreage',
      agriStore: 'Agri Store', agriSub: 'Inputs, rentals, packs',
      farmerNet: 'Farmer Network', farmerSub: 'Ask local experts',
      aiDiag: 'AI Diagnosis', scanHeadline: 'Scan once, get diagnosis and treatment instantly.',
      scanSub: 'Camera-first diagnosis with confidence score, treatment path, dosage calculation, and multilingual report.',
      takePic: 'Take a Picture',
      marketIntel: 'Market Intel', live: 'Wheat • Live', pricesSell: 'SELL', priceDown: 'Prices dropping by ₹120/q', perQuintal: 'per quintal',
      highRust: 'High Rust Fungi Risk', rustMsg: 'Ideal conditions for rust detected. Apply protective spray before 4 PM.',
      rainAlert: 'Rain Expected at 4 PM', rainMsg: 'Complete irrigation cycle early and keep fungicide ready.',
    },
    'हिंदी': {
      greeting: ({ h }: { h: number }) => h < 12 ? 'सुप्रभात' : h < 17 ? 'नमस्कार' : 'शुभ संध्या',
      copilot: 'प्लांट डॉक्टर सहायक', tagline: 'उन्नत फसल जानकारी', subtitle: 'रोग पहचानें, खेत का जोखिम ट्रैक करें, और विशेषज्ञों से जुड़ें — एक जगह।',
      farmHealth: 'खेत की हालत', activeFields: 'नज़र में खेत', watchAlerts: 'ज़रूरी सूचनाएं',
      scanBtn: 'तस्वीर लें', weather: 'खेत का मौसम', sunny: 'साफ आसमान · हल्की हवा', rustRisk: 'रतुआ जोखिम',
      wind: 'हवा', humidity: 'नमी', tomorrow: 'कल', lightRain: 'हल्की बारिश',
      actionCenter: 'कार्य केंद्र', tools: 'औजार',
      soilHealth: 'मिट्टी स्वास्थ्य', soilSub: 'NPK, pH और नमी',
      fertPlan: 'खाद योजना', fertSub: 'एकड़ के हिसाब से सटीक मात्रा',
      agriStore: 'कृषि स्टोर', agriSub: 'इनपुट, किराया, पैक',
      farmerNet: 'किसान नेटवर्क', farmerSub: 'स्थानीय विशेषज्ञ से पूछें',
      aiDiag: 'AI जाँच', scanHeadline: 'एक बार स्कैन करें, तुरंत निदान पाएं।',
      scanSub: 'कैमरा से जाँच, विश्वास स्कोर, उपचार, खुराक और बहुभाषी रिपोर्ट।',
      takePic: 'तस्वीर खींचें',
      marketIntel: 'मंडी भाव', live: 'गेहूँ • लाइव', pricesSell: 'बेचें', priceDown: '₹120/क्विंटल गिरावट', perQuintal: 'प्रति क्विंटल',
      highRust: 'रतुआ रोग का उच्च खतरा', rustMsg: 'रतुआ के अनुकूल परिस्थितियाँ। शाम 4 बजे से पहले सुरक्षात्मक स्प्रे करें।',
      rainAlert: 'शाम 4 बजे बारिश संभव', rainMsg: 'सिंचाई जल्दी पूरी करें और फफूंदनाशक तैयार रखें।',
    },
    'भोजपुरी': {
      greeting: ({ h }: { h: number }) => h < 12 ? 'प्रणाम' : h < 17 ? 'नमस्कार' : 'शुभ संझा',
      copilot: 'प्लांट डॉक्टर सहायक', tagline: 'उन्नत फसल जानकारी', subtitle: 'रोग पहचानीं, खेत के खतरा ट्रैक करीं, आउर विशेषज्ञ से जुड़ीं — एक जगह।',
      farmHealth: 'खेत के हालत', activeFields: 'खेत नजर में', watchAlerts: 'जरूरी सूचना',
      scanBtn: 'तस्वीर खींचीं', weather: 'खेत के मौसम', sunny: 'साफ़ आसमान · हल्की हवा', rustRisk: 'रतुआ खतरा',
      wind: 'हवा', humidity: 'नमी', tomorrow: 'काल्ह', lightRain: 'हल्की बरखा',
      actionCenter: 'काम केंद्र', tools: 'औजार',
      soilHealth: 'मिट्टी स्वास्थ्य', soilSub: 'NPK, pH आउर नमी',
      fertPlan: 'खाद योजना', fertSub: 'एकड़ के हिसाब से सही मात्रा',
      agriStore: 'कृषि दुकान', agriSub: 'इनपुट, किराया, पैक',
      farmerNet: 'किसान नेटवर्क', farmerSub: 'स्थानीय विशेषज्ञ से पूछीं',
      aiDiag: 'AI जाँच', scanHeadline: 'एक बेर स्कैन करीं, तुरंत इलाज पाईं।',
      scanSub: 'कैमरे से जाँच, विश्वास स्कोर, इलाज आउर रिपोर्ट।',
      takePic: 'तस्वीर खींचीं',
      marketIntel: 'मंडी भाव', live: 'गेहूँ • लाइव', pricesSell: 'बेचीं', priceDown: '₹120/क्विंटल गिरावट', perQuintal: 'प्रति क्विंटल',
      highRust: 'रतुआ रोग के उच्च खतरा', rustMsg: 'रतुआ के अनुकूल परिस्थिति बा। शाम 4 बजे से पहले स्प्रे करीं।',
      rainAlert: 'शाम 4 बजे बरखा संभव', rainMsg: 'सिंचाई जल्दी पूरा करीं आउर फफूंदनाशक तैयार रखीं।',
    },
    'ਪੰਜਾਬੀ': {
      greeting: ({ h }: { h: number }) => h < 12 ? 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ' : h < 17 ? 'ਨਮਸਕਾਰ' : 'ਸ਼ੁਭ ਸ਼ਾਮ',
      copilot: 'ਪਲਾਂਟ ਡਾਕਟਰ ਮਦਦਗਾਰ', tagline: 'ਪ੍ਰੀਮੀਅਮ ਫਸਲ ਜਾਣਕਾਰੀ', subtitle: 'ਰੋਗ ਪਛਾਣੋ, ਖੇਤ ਖਤਰਾ ਟ੍ਰੈਕ ਕਰੋ, ਮਾਹਰਾਂ ਨਾਲ ਜੁੜੋ।',
      farmHealth: 'ਖੇਤ ਦੀ ਹਾਲਤ', activeFields: 'ਨਜ਼ਰ ਵਿੱਚ ਖੇਤ', watchAlerts: 'ਜ਼ਰੂਰੀ ਸੂਚਨਾ',
      scanBtn: 'ਫੋਟੋ ਖਿੱਚੋ', weather: 'ਖੇਤ ਦਾ ਮੌਸਮ', sunny: 'ਸਾਫ਼ ਅਸਮਾਨ · ਹਲਕੀ ਹਵਾ', rustRisk: 'ਰਸਟ ਖਤਰਾ',
      wind: 'ਹਵਾ', humidity: 'ਨਮੀ', tomorrow: 'ਕੱਲ੍ਹ', lightRain: 'ਹਲਕੀ ਬਾਰਿਸ਼',
      actionCenter: 'ਕਾਰਜ ਕੇਂਦਰ', tools: 'ਸੰਦ',
      soilHealth: 'ਮਿੱਟੀ ਸਿਹਤ', soilSub: 'NPK, pH ਅਤੇ ਨਮੀ',
      fertPlan: 'ਖਾਦ ਯੋਜਨਾ', fertSub: 'ਏਕੜ ਅਨੁਸਾਰ ਸਹੀ ਮਾਤਰਾ',
      agriStore: 'ਖੇਤੀ ਦੁਕਾਨ', agriSub: 'ਖਾਦ, ਕਿਰਾਇਆ, ਪੈਕ',
      farmerNet: 'ਕਿਸਾਨ ਨੈੱਟਵਰਕ', farmerSub: 'ਸਥਾਨਕ ਮਾਹਰ ਤੋਂ ਪੁੱਛੋ',
      aiDiag: 'AI ਜਾਂਚ', scanHeadline: 'ਇੱਕ ਵਾਰ ਸਕੈਨ ਕਰੋ, ਤੁਰੰਤ ਨਤੀਜਾ ਪਾਓ।',
      scanSub: 'ਕੈਮਰੇ ਨਾਲ ਜਾਂਚ, ਭਰੋਸਾ ਸਕੋਰ, ਇਲਾਜ, ਅਤੇ ਬਹੁਭਾਸ਼ੀ ਰਿਪੋਰਟ।',
      takePic: 'ਫੋਟੋ ਖਿੱਚੋ',
      marketIntel: 'ਮੰਡੀ ਭਾਅ', live: 'ਕਣਕ • ਲਾਈਵ', pricesSell: 'ਵੇਚੋ', priceDown: '₹120/ਕੁਇੰਟਲ ਗਿਰਾਵਟ', perQuintal: 'ਪ੍ਰਤੀ ਕੁਇੰਟਲ',
      highRust: 'ਰਸਟ ਫੰਗਸ ਦਾ ਉੱਚ ਖਤਰਾ', rustMsg: 'ਰਸਟ ਲਈ ਅਨੁਕੂਲ ਸਥਿਤੀਆਂ। ਸ਼ਾਮ 4 ਵਜੇ ਤੋਂ ਪਹਿਲਾਂ ਸਪ੍ਰੇ ਕਰੋ।',
      rainAlert: 'ਸ਼ਾਮ 4 ਵਜੇ ਬਾਰਿਸ਼ ਸੰਭਵ', rainMsg: 'ਸਿੰਚਾਈ ਜਲਦੀ ਪੂਰੀ ਕਰੋ ਅਤੇ ਉੱਲੀਨਾਸ਼ਕ ਤਿਆਰ ਰੱਖੋ।',
    },
    'मैथिली': {
      greeting: ({ h }: { h: number }) => h < 12 ? 'प्रणाम' : h < 17 ? 'नमस्कार' : 'शुभ संझा',
      copilot: 'प्लांट डॉक्टर सहायक', tagline: 'उन्नत फसल जानकारी', subtitle: 'रोग पहचानीं, खेत जोखिम ट्रैक करीं, आउर विशेषज्ञ सँ जुड़ीं।',
      farmHealth: 'खेत के हालत', activeFields: 'खेत नजर में', watchAlerts: 'जरूरी खबर',
      scanBtn: 'तस्वीर लीं', weather: 'खेत मौसम', sunny: 'साफ आकाश · हल्की हवा', rustRisk: 'रतुआ खतरा',
      wind: 'हवा', humidity: 'नमी', tomorrow: 'काल्हि', lightRain: 'हल्की वर्षा',
      actionCenter: 'काज केंद्र', tools: 'औजार',
      soilHealth: 'माटि स्वास्थ्य', soilSub: 'NPK, pH आउर नमी',
      fertPlan: 'खाद योजना', fertSub: 'एकड़ अनुसार सही मात्रा',
      agriStore: 'कृषि दुकान', agriSub: 'इनपुट, किराया, पैक',
      farmerNet: 'किसान नेटवर्क', farmerSub: 'स्थानीय विशेषज्ञ सँ पूछीं',
      aiDiag: 'AI जाँच', scanHeadline: 'एक बेर स्कैन करीं, तुरंत इलाज पाबीं।',
      scanSub: 'कैमरा सँ जाँच, विश्वास स्कोर, इलाज, आउर रिपोर्ट।',
      takePic: 'तस्वीर लीं',
      marketIntel: 'मंडी भाव', live: 'गहूम • लाइव', pricesSell: 'बेचीं', priceDown: '₹120/क्विंटल गिरावट', perQuintal: 'प्रति क्विंटल',
      highRust: 'रतुआ रोग के उच्च खतरा', rustMsg: 'रतुआ के अनुकूल स्थिति। शाम 4 बजे पहिने स्प्रे करीं।',
      rainAlert: 'शाम 4 बजे वर्षा संभव', rainMsg: 'सिंचाई जल्दी पूरा करीं आउर फफूंदनाशक तैयार रखीं।',
    },
    'मराठी': {
      greeting: ({ h }: { h: number }) => h < 12 ? 'सुप्रभात' : h < 17 ? 'नमस्कार' : 'शुभ संध्या',
      copilot: 'प्लांट डॉक्टर सहायक', tagline: 'उत्तम पीक माहिती', subtitle: 'रोग ओळखा, शेत धोका ट्रॅक करा, आणि तज्ञांशी जोडा — एका ठिकाणी।',
      farmHealth: 'शेताची स्थिती', activeFields: 'लक्ष ठेवलेली शेते', watchAlerts: 'महत्त्वाचे इशारे',
      scanBtn: 'फोटो काढा', weather: 'शेताचे हवामान', sunny: 'स्वच्छ आकाश · सौम्य वारा', rustRisk: 'गंज धोका',
      wind: 'वारा', humidity: 'आर्द्रता', tomorrow: 'उद्या', lightRain: 'हलका पाऊस',
      actionCenter: 'कृती केंद्र', tools: 'साधने',
      soilHealth: 'माती आरोग्य', soilSub: 'NPK, pH आणि ओलावा',
      fertPlan: 'खत योजना', fertSub: 'एकरानुसार अचूक मात्रा',
      agriStore: 'कृषी दुकान', agriSub: 'निविष्ठा, भाडे, पॅक',
      farmerNet: 'शेतकरी नेटवर्क', farmerSub: 'स्थानिक तज्ञांना विचारा',
      aiDiag: 'AI निदान', scanHeadline: 'एकदा स्कॅन करा, लगेच उपचार मिळवा।',
      scanSub: 'कॅमेऱ्याने निदान, विश्वास स्कोर, उपचार आणि अहवाल.',
      takePic: 'फोटो काढा',
      marketIntel: 'बाजार भाव', live: 'गहू • लाइव्ह', pricesSell: 'विका', priceDown: '₹120/क्विंटल घसरण', perQuintal: 'प्रति क्विंटल',
      highRust: 'गंज बुरशीचा उच्च धोका', rustMsg: 'गंजासाठी अनुकूल परिस्थिती. संध्याकाळी 4 पूर्वी फवारणी करा.',
      rainAlert: 'संध्याकाळी 4 वाजता पाऊस संभव', rainMsg: 'सिंचन लवकर पूर्ण करा आणि बुरशीनाशक तयार ठेवा.',
    },
    'ગુજરાતી': {
      greeting: ({ h }: { h: number }) => h < 12 ? 'સુપ્રભાત' : h < 17 ? 'નમસ્કાર' : 'શુભ સંધ્યા',
      copilot: 'પ્લાન્ટ ડૉક્ટર સહાયક', tagline: 'ઉત્તમ પાક માહિતી', subtitle: 'રોગ ઓળખો, ખેતર જોખમ ટ્રૅક કરો, અને નિષ્ણાતો સાથે જોડાઓ — એક જગ્યાએ।',
      farmHealth: 'ખેતરની હાલત', activeFields: 'નજર હેઠળ ખેતર', watchAlerts: 'જરૂरी ચેતવણી',
      scanBtn: 'ફોટો પાડો', weather: 'ખેતનું હવામાન', sunny: 'સ્વચ્છ આકાશ · સૌમ્ય પવન', rustRisk: 'કળ ખતરો',
      wind: 'પવન', humidity: 'ભેજ', tomorrow: 'આવતીકાલ', lightRain: 'હળવો વરસાદ',
      actionCenter: 'ક્રિયા કેન્દ્ર', tools: 'સાધનો',
      soilHealth: 'જમીન આરોગ્ય', soilSub: 'NPK, pH અને ભેજ',
      fertPlan: 'ખાતર યોજના', fertSub: 'એકર અનુસાર સચોટ માત્રા',
      agriStore: 'કૃષિ દુકાન', agriSub: 'ઇનપુટ, ભાડું, પૅક',
      farmerNet: 'ખેડૂત નેટવર્ક', farmerSub: 'સ્થાનિક નિષ્ણાતને પૂછો',
      aiDiag: 'AI નિદાન', scanHeadline: 'એક વાર સ્કૅન કરો, તરત ઉપચાર મળો।',
      scanSub: 'કૅમેરાથી નિદાન, વિશ્વાસ સ્કોર, ઉપચાર અને અહેવાલ.',
      takePic: 'ફોટો પાડો',
      marketIntel: 'બજાર ભાવ', live: 'ઘઉં • લાઇવ', pricesSell: 'વેચો', priceDown: '₹120/ક્વિન્ટલ ઘટાડો', perQuintal: 'પ્રતિ ક્વિન્ટલ',
      highRust: 'કળ ફૂગ નો ઉચ્ચ ખતરો', rustMsg: 'કળ માટે અનુકૂળ સ્થિતિ. સાંજે 4 પહેલા છંટકાવ કરો.',
      rainAlert: 'સાંજે 4 વાગ્યે વરસાદ સંભવ', rainMsg: 'સિંચાઈ વહેલી પૂર્ણ કરો અને ફૂગનાશક તૈયાર રાખો.',
    },
    'తెలుగు': {
      greeting: ({ h }: { h: number }) => h < 12 ? 'శుభోదయం' : h < 17 ? 'నమస్కారం' : 'శుభ సాయంత్రం',
      copilot: 'ప్లాంట్ డాక్టర్ సహాయకుడు', tagline: 'అత్యుత్తమ పంట సమాచారం', subtitle: 'వ్యాధి గుర్తించండి, పొల ప్రమాదం ట్రాక్ చేయండి, నిపుణులతో అనుసంధానం అవ్వండి।',
      farmHealth: 'పొల పరిస్థితి', activeFields: 'పొలాలు పర్యవేక్షణలో', watchAlerts: 'ముఖ్యమైన హెచ్చరికలు',
      scanBtn: 'ఫోటో తీయండి', weather: 'పొల వాతావరణం', sunny: 'స్వచ్ఛమైన ఆకాశం · మందమైన గాలి', rustRisk: 'తుప్పు ప్రమాదం',
      wind: 'గాలి', humidity: 'తేమ', tomorrow: 'రేపు', lightRain: 'తేలికపాటి వర్షం',
      actionCenter: 'చర్య కేంద్రం', tools: 'పరికరాలు',
      soilHealth: 'నేల ఆరోగ్యం', soilSub: 'NPK, pH మరియు తేమ',
      fertPlan: 'ఎరువు పథకం', fertSub: 'ఎకరాకు సరైన మోతాదు',
      agriStore: 'వ్యవసాయ దుకాణం', agriSub: 'ఇన్‌పుట్లు, అద్దె, ప్యాక్లు',
      farmerNet: 'రైతు నెట్‌వర్క్', farmerSub: 'స్థానిక నిపుణులను అడగండి',
      aiDiag: 'AI నిర్ధారణ', scanHeadline: 'ఒక్కసారి స్కా్ న్ చేయండి, వెంటనే చికిత్స పొందండి।',
      scanSub: 'కెమెరాతో నిర్ధారణ, నమ్మకం స్కోరు, చికిత్స మరియు నివేదిక.',
      takePic: 'ఫోటో తీయండి',
      marketIntel: 'మార్కెట్ ధరలు', live: 'గోధుమ • లైవ్', pricesSell: 'అమ్మండి', priceDown: '₹120/క్వింటాల్ తగ్గింపు', perQuintal: 'క్వింటాల్‌కు',
      highRust: 'తుప్పు శిలీంధ్రం అధిక ప్రమాదం', rustMsg: 'తుప్పుకు అనుకూల పరిస్థితులు. సాయంత్రం 4 లోపు పిచికారీ చేయండి.',
      rainAlert: 'సాయంత్రం 4కి వర్షం సంభావ్యత', rainMsg: 'నీటిపారుదల త్వరగా పూర్తి చేయండి మరియు శీలీంద్రనాశినిని సిద్ధం చేయండి.',
    },
  };

  const T = L[language] ?? L['English'];
  const isEnglish = language === 'English';
  const soilTypeLabel = useMemo(() => formatSoilTypeLabel(profile.soilType), [profile.soilType]);
  const hour = new Date().getHours();
  const greeting = typeof T.greeting === 'function' ? (T.greeting as (args: { h: number }) => string)({ h: hour }) : T.greeting;

  const cropList = useMemo(
    () => (profile.crops?.length ? profile.crops : ['Wheat', 'Rice', 'Tomato', 'Potato', 'Corn', 'Cotton', 'Soybean', 'Sugarcane']),
    [profile.crops]
  );
  const activeCrop = profile.activeCrop || cropList[0];
  const alerts: AlertItem[] = useMemo(() => {
    const items: AlertItem[] = [];

    if (threatAlert) {
      items.push({
        type: 'disease',
        title: threatAlert.disease.replace(/_/g, ' '),
        message: threatAlert.recommendation || (T.rustMsg as string),
        priority: 'high',
      });
    } else {
      items.push({ type: 'disease', title: T.highRust as string, message: T.rustMsg as string, priority: 'high' });
    }

    if (weather?.weather_alerts?.[0]) {
      items.push({
        type: 'weather',
        title: T.rainAlert as string,
        message: weather.weather_alerts[0],
        priority: 'medium',
      });
    } else {
      items.push({ type: 'weather', title: T.rainAlert as string, message: T.rainMsg as string, priority: 'medium' });
    }

    items.push({
      type: 'market',
      title: `${T.marketIntel as string} • ${activeCrop || 'Wheat'}`,
      message: isEnglish
        ? `Current mandi trend: ${mandiPrice?.trend || '-2.4%'} (${mandiPrice?.price || '₹2,350'}). Plan sale in 24 hours.`
        : `वर्तमान मंडी ट्रेंड: ${mandiPrice?.trend || '-2.4%'} (${mandiPrice?.price || '₹2,350'}). 24 घंटे में बिक्री योजना बनाएं।`,
      priority: 'low',
    });

    if (!subscription || subscription.status === 'trial' || subscription.plan_code === 'basic') {
      items.push({
        type: 'subscription',
        title: isEnglish ? 'Premium Insights Available' : 'प्रीमियम इनसाइट्स उपलब्ध',
        message: isEnglish
          ? 'Upgrade to Premium for advanced weather-market alerts and expert priority.'
          : 'एडवांस मौसम-मंडी अलर्ट और विशेषज्ञ प्राथमिकता के लिए प्रीमियम लें।',
        priority: 'low',
      });
    }

    return items.slice(0, 4);
  }, [
    threatAlert,
    weather?.weather_alerts,
    mandiPrice?.price,
    mandiPrice?.trend,
    T.highRust,
    T.rustMsg,
    T.rainAlert,
    T.rainMsg,
    T.marketIntel,
    cropList,
    isEnglish,
    subscription,
  ]);

  const roiShareHref = useMemo(() => {
    if (!roiData) return '/community/ask';
    const lines = isEnglish
      ? [
          `Expected ROI update for ${roiData.crop}:`,
          `Soil: ${soilTypeLabel}`,
          `Investment: ₹${Math.round(roiData.investment.total_inr).toLocaleString('en-IN')}`,
          `Expected income: ₹${Math.round(roiData.income.gross_inr).toLocaleString('en-IN')}`,
          `Net profit: ₹${Math.round(roiData.income.net_inr).toLocaleString('en-IN')}`,
          `ROI: ${roiData.income.roi_pct}%`,
          `Mandi trend: ${roiData.market.trend} (${roiData.market.delta_pct}%)`,
          'Any practical suggestions to improve this plan?',
        ]
      : [
          `${roiData.crop} के लिए Expected ROI शेयर कर रहा/रही हूँ:`,
          `मिट्टी: ${soilTypeLabel}`,
          `कुल निवेश: ₹${Math.round(roiData.investment.total_inr).toLocaleString('en-IN')}`,
          `अनुमानित आय: ₹${Math.round(roiData.income.gross_inr).toLocaleString('en-IN')}`,
          `अनुमानित लाभ: ₹${Math.round(roiData.income.net_inr).toLocaleString('en-IN')}`,
          `ROI: ${roiData.income.roi_pct}%`,
          `मंडी ट्रेंड: ${roiData.market.trend} (${roiData.market.delta_pct}%)`,
          'इस ROI को बेहतर बनाने के लिए आपकी क्या सलाह है?',
        ];

    const params = new URLSearchParams({
      crop: roiData.crop,
      template: 'roi',
      prefill_question: isEnglish ? 'Please review my expected ROI.' : 'मेरे expected ROI को review करें।',
      prefill: lines.join('\n'),
    });
    return `/community/ask?${params.toString()}`;
  }, [isEnglish, roiData, soilTypeLabel]);

  const toolCards = [
    { href: '/mandi', icon: BarChart3, label: T.marketIntel as string, sub: T.live as string, color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
    { href: '/soil', icon: Map, label: T.soilHealth as string, sub: T.soilSub as string, color: '#fdba74', bg: 'rgba(253,186,116,0.12)' },
    { href: '/calendar', icon: Droplets, label: T.fertPlan as string, sub: T.fertSub as string, color: '#7dd3fc', bg: 'rgba(125,211,252,0.12)' },
    { href: '/marketplace', icon: ShoppingBag, label: T.agriStore as string, sub: T.agriSub as string, color: '#c4b5fd', bg: 'rgba(196,181,253,0.12)' },
    { href: '/community', icon: Users, label: T.farmerNet as string, sub: T.farmerSub as string, color: '#fda4af', bg: 'rgba(253,164,175,0.12)' },
  ];

  if (!mounted) {
    return <div className="min-h-screen bg-[#f8fafc]" />;
  }

  return (
    <div className="min-h-full space-y-5 px-4 pb-32 pt-5 bg-[#f8fafc] text-slate-800">

      {/* ── Greeting row ─────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-emerald-600/80 mb-1" suppressHydrationWarning>{greeting}</p>
          <h1 className="text-[2.2rem] font-black tracking-tight text-slate-900 leading-none" suppressHydrationWarning>{firstName}</h1>
          <div className="mt-2.5 flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600 shadow-sm ring-1 ring-slate-900/5">
              <MapPin size={11} className="text-emerald-500" />
              {profile.locationLabel || 'Nalanda, Bihar'}
            </div>
            <div className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1.5 border border-emerald-500/20 text-[10px] font-bold text-emerald-600">
              <Zap size={10} className="text-emerald-500" />
              <span>Live</span>
            </div>
          </div>
        </div>
        <motion.button whileTap={{ scale: 0.9 }}
          onClick={() => {
            if (navigator.vibrate) navigator.vibrate(8);
            setIsNotificationsOpen((prev) => !prev);
          }}
          className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-900/5">
          <Bell size={20} className="text-slate-400" />
          {alerts.length > 0 && (
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-[1.5px] border-white bg-rose-500 animate-pulse" />
          )}
        </motion.button>
      </motion.div>

      <AnimatePresence>
        {isNotificationsOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            className="rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_8px_30px_rgb(0,0,0,0.08)]"
          >
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                {isEnglish ? 'Live Notifications' : 'लाइव नोटिफिकेशन'}
              </p>
              <button
                onClick={() => setIsNotificationsOpen(false)}
                className="text-[10px] font-bold text-slate-400"
              >
                {isEnglish ? 'Close' : 'बंद करें'}
              </button>
            </div>
            <div className="space-y-2">
              {alerts.map((item, index) => (
                <div
                  key={`${item.type}-${index}`}
                  className="rounded-xl border px-3 py-2.5"
                  style={{
                    borderColor:
                      item.priority === 'high'
                        ? 'rgba(244,63,94,0.28)'
                        : item.priority === 'medium'
                          ? 'rgba(245,158,11,0.25)'
                          : 'rgba(148,163,184,0.25)',
                    background:
                      item.priority === 'high'
                        ? 'rgba(255,241,242,0.8)'
                        : item.priority === 'medium'
                          ? 'rgba(255,251,235,0.85)'
                          : 'rgba(248,250,252,0.8)',
                  }}
                >
                  <p className="text-[11px] font-black text-slate-800">{item.title}</p>
                  <p className="mt-0.5 text-[11px] font-medium text-slate-500">{item.message}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Health Score + Copilot card ───────────────────────── */}
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06, duration: 0.5 }}
        className="relative overflow-hidden rounded-[2rem] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-900/5 bg-white">

        {/* Top row: badge + time */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-emerald-600">
              {T.copilot as string}
            </div>
          </div>
          <span className="text-xs font-semibold text-slate-400" suppressHydrationWarning>{time}</span>
        </div>

        {/* Main content: text + leaf icon */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-black leading-tight text-slate-800 text-balance">
              {T.tagline as string}
              <span className="block text-slate-500 font-bold text-base mt-0.5">{t('field_walk')}</span>
            </h2>
            <p className="mt-2.5 text-[13px] leading-relaxed text-slate-500 font-medium text-pretty pl-[1px]">
              {T.subtitle as string}
            </p>
          </div>
          <div className="flex-shrink-0 flex h-12 w-12 items-center justify-center rounded-[1.2rem] bg-emerald-50">
            <Leaf size={22} className="text-emerald-500" />
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-4 grid grid-cols-3 gap-2.5">
          {[
            { label: T.farmHealth as string, value: '88%', tone: 'emerald', icon: '🌾' },
            { label: T.activeFields as string, value: `${cropList.length}`, tone: 'sky', icon: '📍' },
            { label: T.watchAlerts as string, value: `${alerts.length}`, tone: 'amber', icon: '⚠️' },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl p-3 bg-slate-50 border border-slate-100">
              <p className="text-xs">{item.icon}</p>
              <p className="mt-1.5 text-lg font-black text-slate-800 leading-none">{item.value}</p>
              <p className="mt-1 text-[9px] font-bold text-slate-400 leading-snug break-words" style={{ wordBreak: 'break-word', lineHeight: '1.3' }}>{item.label}</p>
            </div>
          ))}
        </div>
      </motion.section>

      {/* ── Quick Scan CTA — prominent green card ─────────────── */}
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1, duration: 0.5 }}
        className="relative overflow-hidden rounded-[2rem] p-5 shadow-[0_12px_40px_rgb(16,185,129,0.15)]"
        style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md">
            <ShieldCheck size={16} className="text-white" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-100">{T.aiDiag as string}</span>
        </div>
        <h2 className="text-[1.15rem] font-black leading-tight text-white mb-2">{T.scanHeadline as string}</h2>
        <p className="text-xs text-emerald-50 leading-relaxed font-medium mb-5">{T.scanSub as string}</p>
        <Link href="/scanner"
          className="flex w-full items-center justify-center gap-2.5 rounded-2xl py-3.5 text-sm font-black text-emerald-900 bg-white shadow-lg active:scale-95 transition-transform">
          <Camera size={18} />
          {T.takePic as string}
          <ArrowUpRight size={16} />
        </Link>
      </motion.div>

      {/* ── Crop pills ────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14, duration: 0.5 }}
        className="flex gap-3 overflow-x-auto hide-scrollbar pb-1">
        {cropList.map((crop, idx) => {
          const localName = cropTranslations[language]?.[crop] ?? crop;
          const isActive = crop === activeCrop;
          return (
            <motion.button key={idx} whileTap={{ scale: 0.92 }}
              onClick={() => {
                if (navigator.vibrate) navigator.vibrate(10);
                updateProfile({ activeCrop: crop });
              }}
              className="group flex shrink-0 cursor-pointer flex-col items-center gap-2">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-2xl text-2xl bg-white shadow-sm transition-all"
                style={{
                  ring: isActive ? '2px solid #10b981' : '1px solid rgba(0,0,0,0.05)',
                  boxShadow: isActive
                    ? '0 0 0 2.5px #10b981, 0 4px 12px rgba(16,185,129,0.25)'
                    : '0 1px 4px rgba(0,0,0,0.06)',
                }}
              >
                {cropIcons[crop] || cropIcons.Default}
              </div>
              <span
                className="text-[10px] font-bold uppercase tracking-[0.16em] transition-colors"
                style={{ color: isActive ? '#059669' : '#64748b' }}
              >{localName}</span>
            </motion.button>
          );
        })}
        <motion.div whileTap={{ scale: 0.92 }} className="flex shrink-0 cursor-pointer flex-col items-center gap-2 opacity-75">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50">
            <Plus size={20} className="text-slate-400" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">{t('add') || 'Add'}</span>
        </motion.div>
      </motion.div>

      {/* ── Weather card — LIVE API ───────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18, duration: 0.5 }}
        className="overflow-hidden rounded-[2rem] bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-900/5">
        <div className="p-5">
          {/* Header row: label + city only */}
          <div className="mb-1.5 flex items-center gap-2">
            <Sun size={15} className="text-amber-500" />
            <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">{T.weather as string}</span>
            {weather && (
              <span className="text-[9px] font-bold text-slate-400 ml-1">• {weather.city}</span>
            )}
          </div>

          {/* Temperature + description */}
          {weatherLoading ? (
            <div className="space-y-2 mb-3">
              <div className="h-10 w-28 rounded-xl bg-slate-100 animate-pulse" />
              <div className="h-4 w-40 rounded-lg bg-slate-100 animate-pulse" />
            </div>
          ) : (
            <>
              <p className="text-4xl font-black tracking-tighter text-slate-900">
                {weather?.temperature || '28°C'}
              </p>
              <p className="mt-0.5 text-sm font-semibold text-slate-500 mb-3">
                {weather?.description || T.sunny as string}
              </p>
            </>
          )}

          {/* Alert badge — BELOW temperature, full width, no overlap */}
          {!weatherLoading && (
            <div className="mb-3">
              {weather?.weather_alerts?.[0] ? (
                <div className="flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2.5 border border-amber-100">
                  <span className="text-sm shrink-0">⚠️</span>
                  <span className="text-[11px] font-bold text-amber-800 leading-snug">{weather.weather_alerts[0]}</span>
                </div>
              ) : (
                <div className="inline-flex rounded-full bg-amber-50 px-3 py-1.5 border border-amber-100">
                  <span className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-600">{T.rustRisk as string}</span>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-3 gap-3 border-t border-slate-100 pt-4">
            {[
              { icon: Wind, label: T.wind as string, value: weatherLoading ? '—' : (weather?.wind_speed || '12 km/h'), color: '#64748b' },
              { icon: Droplets, label: T.humidity as string, value: weatherLoading ? '—' : (weather?.humidity || '68%'), color: '#0ea5e9' },
              { icon: Cloud, label: T.tomorrow as string, value: T.lightRain as string, color: '#8b5cf6' },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="rounded-2xl bg-slate-50 border border-slate-100 p-3">
                <div className="flex items-center gap-1.5">
                  <Icon size={12} style={{ color }} />
                  <span className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">{label}</span>
                </div>
                {weatherLoading ? (
                  <div className="mt-2 h-4 w-14 rounded bg-slate-200 animate-pulse" />
                ) : (
                  <p className="mt-2 text-sm font-bold text-slate-700">{value}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── Live Pest Threat (from community scan network) ────── */}
      {threatAlert && (
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.22, duration: 0.4 }}
          className="rounded-2xl border border-rose-200 bg-white shadow-[0_4px_16px_rgba(244,63,94,0.08)] px-4 py-3.5"
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 shrink-0">
              <span className="text-base">🦟</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-sm font-bold text-slate-800 truncate">
                  {threatAlert.disease.replace(/_/g, ' ')}
                </p>
                <span className="text-[9px] font-black uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                  {threatAlert.alert_level}
                </span>
              </div>
              <p className="text-xs font-medium text-slate-500">
                {threatAlert.farmer_count} farmers • {threatAlert.distance_km.toFixed(1)} km away
              </p>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{threatAlert.recommendation.slice(0, 80)}...</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Alerts ───────────────────────────────────────────── */}
      <AnimatePresence>
        {alerts.map((alert, index) => (
          <motion.div key={alert.title} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.22 + index * 0.06 }}
            className="rounded-2xl border bg-white shadow-[0_4px_12px_rgb(0,0,0,0.02)] px-4 py-3"
            style={{
              borderColor: alert.priority === 'high' ? 'rgba(244,63,94,0.2)' : 'rgba(245,158,11,0.2)',
            }}>
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl shrink-0"
                style={{ background: alert.priority === 'high' ? 'rgba(255,228,230,1)' : 'rgba(254,243,199,1)' }}>
                <AlertTriangle size={14} className={alert.priority === 'high' ? 'text-rose-500' : 'text-amber-500'} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-800">{alert.title}</p>
                <p className="mt-0.5 text-xs font-medium text-slate-500">{alert.message}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* ── Action Center (tool grid) ─────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28, duration: 0.5 }}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-[1.1rem] font-extrabold text-slate-800">{T.actionCenter as string}</h3>
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">{T.tools as string}</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {toolCards.map(({ href, icon: Icon, label, sub, color }) => (
            <Link key={label} href={href}
              className="bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-900/5 active:scale-95 transition-transform overflow-hidden rounded-[1.6rem] p-4 haptic-btn">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
                <Icon size={18} style={{ color }} />
              </div>
              <p className="text-sm font-bold text-slate-800">{label}</p>
              <p className="mt-0.5 text-[11px] leading-relaxed font-medium text-slate-500">{sub}</p>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* ── Smart Irrigation Advisor ───────────────────────── */}
      {smartIrrigation && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.31, duration: 0.45 }}
          className="bg-white shadow-[0_12px_44px_rgba(0,0,0,0.06)] border border-slate-200 overflow-hidden rounded-[2.5rem] p-6"
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-sky-50 flex items-center justify-center border border-sky-100">
                <Droplets size={16} className="text-sky-500" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-500 block">
                  {t('intel_smart_irrigation')}
                </span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                  {t('intel_live_forecast')}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1 border border-slate-100">
               <span className="text-[10px] font-bold text-slate-500">{t('intel_soil_profile')}: {soilTypeLabel}</span>
            </div>
          </div>
          
          <div className="mb-6 p-4 rounded-[1.8rem] bg-sky-500/5 border border-sky-500/10">
            <p className="text-sm font-bold text-slate-800 leading-relaxed">
              {smartIrrigation.recommendation}
            </p>
            <p className="mt-2 text-[11px] font-semibold text-sky-600/70">
              {t('intel_suggested_interval')}: every {smartIrrigation.irrigation_interval_days} days
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {(smartIrrigation.week_plan || []).slice(0, 3).map((day) => (
              <div key={day.date} className="rounded-2xl border border-slate-100 bg-slate-50 p-3 flex flex-col items-center text-center">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">{day.date.slice(5)}</p>
                <div className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter mb-1.5 ${day.action.toLowerCase() === 'normal' ? 'bg-emerald-100 text-emerald-600 border border-emerald-200' : 'bg-sky-100 text-sky-600 border border-sky-200'}`}>
                   {day.action === 'normal' ? (isEnglish ? 'NORMAL' : 'सामान्य') : day.action.toUpperCase()}
                </div>
                <p className="text-[11px] font-black text-slate-700">{day.rain_mm} mm</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── ROI Dashboard ───────────────────────────────────── */}
      {roiData && (
        <WealthPredictor />
      )}

      {/* ── Market Intel ─────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.34, duration: 0.5 }}
        className="bg-white shadow-[0_12px_44px_rgba(0,0,0,0.06)] border border-slate-200 overflow-hidden rounded-[2.5rem] p-6">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-rose-50 flex items-center justify-center border border-rose-100">
               <TrendingDown size={16} className="text-rose-500" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500">{t('intel_mandi_live')}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 border border-rose-100">
             <div className="h-1 w-1 rounded-full bg-rose-500 animate-pulse" />
             <span className="text-[9px] font-black uppercase tracking-widest text-rose-600">{cropTranslations[language]?.[profile.crops?.[0] || 'Wheat'] || 'Wheat'}</span>
          </div>
        </div>
        
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
               <p className={`text-4xl font-black leading-none tracking-tighter ${mandiPrice?.status === 'up' ? 'text-emerald-500' : 'text-rose-500'}`}>
                 {mandiPrice?.price || '₹2,300'}
               </p>
            </div>
            <p className={`text-[11px] font-bold ${mandiPrice?.status === 'up' ? 'text-emerald-400' : 'text-rose-400'} flex items-center gap-1.5`}>
              {mandiPrice?.status === 'up' ? <ArrowUpRight size={12} /> : <TrendingDown size={12} />}
              {mandiPrice?.status === 'up' ? t('intel_price_rising') : t('intel_price_falling')}
            </p>
          </div>
          <div className="text-right">
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{t('intel_per_quintal')}</p>
             <p className={`text-sm font-black ${mandiPrice?.status === 'up' ? 'text-emerald-500' : 'text-rose-500'}`}>
               {mandiPrice?.trend || '0%'}
             </p>
          </div>
        </div>

        <div className="h-20 w-full relative mb-2">
          <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="marketGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="rgba(244,63,94,0.2)" />
                <stop offset="100%" stopColor="rgba(244,63,94,0.0)" />
              </linearGradient>
            </defs>
            <motion.path
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              d="M0,10 C15,10 25,25 40,22 C55,19 65,32 100,35"
              fill="none" stroke="#f43f5e" strokeWidth="3" strokeLinecap="round"
            />
            <motion.path
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 1 }}
              d="M0,10 C15,10 25,25 40,22 C55,19 65,32 100,35 L100,40 L0,40 Z"
              fill="url(#marketGradient)"
            />
          </svg>
        </div>
      </motion.div>

      {/* ── Hotline CTA ──────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.38 }}
        className="rounded-[2.5rem] p-6 bg-slate-900 border border-slate-800 shadow-xl overflow-hidden relative"
      >
        <div className="absolute -right-8 -top-8 w-32 h-32 bg-emerald-500/10 blur-[40px] rounded-full" />
        <div className="relative z-10 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-[1.2rem] bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                 <Users size={22} className="text-emerald-400" />
              </div>
              <div>
                 <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-400 mb-1">24/7 LIVE SUPPORT</p>
                 <h3 className="text-lg font-black text-white">{t('247_hotline')}</h3>
              </div>
           </div>
           <motion.button
             whileTap={{ scale: 0.9 }}
             className="h-10 w-10 rounded-2xl bg-white flex items-center justify-center text-slate-900 shadow-lg shadow-white/5"
           >
              <ArrowUpRight size={20} />
           </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
