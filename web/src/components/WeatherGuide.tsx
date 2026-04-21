'use client';

/**
 * WeatherGuide — Real-time farming weather from OpenWeatherMap
 * Displays live temp, humidity, wind, rain, and smart farming alerts.
 */

import { useEffect, useState } from 'react';
import {
  Cloud,
  CloudRain,
  Droplets,
  Wind,
  Wifi,
  WifiOff,
  Loader2,
  MapPin,
} from 'lucide-react';
import { fetchJson } from '@/lib/api';
import { useFarmerProfile } from '@/context/FarmerProfileContext';

interface WeatherDetails {
  temperature_c: number;
  feels_like_c: number;
  humidity_pct: number;
  wind_kmh: number;
  description: string;
  city?: string;
  rain_1h_mm: number;
  cloud_pct: number;
  source: string;
}

interface WeatherRisk {
  risk_score: number;
  risk_level: string;
  reasons: string[];
  farming_alerts: string[];
}

interface WeatherResponse {
  success: boolean;
  weather: WeatherDetails;
  disease_risk: WeatherRisk;
}

export function WeatherGuide() {
  const { profile } = useFarmerProfile();
  const [weather, setWeather] = useState<WeatherResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (profile.village && profile.village.trim() !== '') {
      fetchWeatherByCity(profile.village.trim());
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => fetchWeatherByCoords(coords.latitude, coords.longitude),
        () => {
          // Default to central India if denied
          fetchWeatherByCoords(23.5, 80.3);
        },
        { timeout: 8000 }
      );
    } else {
      fetchWeatherByCoords(23.5, 80.3);
    }
  }, [profile.village]);

  const fetchWeatherByCoords = async (lat: number, lon: number) => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchJson<WeatherResponse>(`/api/v1/geo/weather?lat=${lat}&lon=${lon}`);
      setWeather(data);
    } catch {
      setError('Weather data unavailable. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const fetchWeatherByCity = async (city: string) => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchJson<WeatherResponse>(`/api/v1/geo/weather?q=${encodeURIComponent(city)}`);
      setWeather(data);
    } catch {
      setError('Weather data unavailable. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Derive temp number for gradient ── */
  const tempNum = weather ? Math.round(weather.weather.temperature_c) : 0;
  const tempGradient =
    tempNum >= 38
      ? 'from-rose-900 to-orange-800'
      : tempNum >= 30
      ? 'from-orange-800 to-amber-700'
      : tempNum >= 20
      ? 'from-emerald-900 to-teal-800'
      : 'from-blue-900 to-indigo-800';

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="rounded-2xl p-6 flex flex-col items-center gap-3"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <Loader2 size={28} className="text-emerald-400 animate-spin" />
        <p className="text-sm text-white/40 font-medium">Fetching live weather...</p>
      </div>
    );
  }

  /* ── Error ── */
  if (error || !weather) {
    return (
      <div className="rounded-2xl p-5 flex items-center gap-3"
        style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
        <WifiOff size={18} className="text-rose-400 shrink-0" />
        <p className="text-sm text-rose-300">{error || 'Weather unavailable'}</p>
      </div>
    );
  }

  const isLive = weather.weather.source === 'openweathermap_live';
  const weatherData = weather.weather;
  const diseaseRisk = weather.disease_risk;
  const weatherAlerts: string[] =
    (diseaseRisk.farming_alerts && diseaseRisk.farming_alerts.length > 0)
      ? diseaseRisk.farming_alerts
      : diseaseRisk.reasons.length > 0
      ? diseaseRisk.reasons.map((r) => `Disease risk ${diseaseRisk.risk_level}: ${r}`)
      : ['No weather risk detected for your crops right now.'];

  return (
    <div className="space-y-3">

      {/* ── Hero Card ── */}
      <div className={`relative rounded-2xl overflow-hidden bg-gradient-to-br ${tempGradient} p-5`}
        style={{ border: '1px solid rgba(255,255,255,0.1)' }}>

        {/* Data source badge */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full"
          style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(10px)' }}>
          {isLive
            ? <Wifi size={10} className="text-emerald-400" />
            : <WifiOff size={10} className="text-amber-400" />}
          <span className="text-[9px] font-black uppercase tracking-widest"
            style={{ color: isLive ? '#4ade80' : '#fbbf24' }}>
            {isLive ? 'Live' : 'Offline'}
          </span>
        </div>

        {/* Location */}
        <div className="flex items-center gap-1.5 mb-4">
          <MapPin size={12} className="text-white/60" />
          <span className="text-xs font-semibold text-white/60">{weatherData.city || 'Your Area'}</span>
        </div>

        {/* Temperature */}
        <div className="flex items-end gap-3 mb-1">
          <span className="text-5xl font-black text-white tracking-tighter">{tempNum}°C</span>
          <div className="pb-1">
            <p className="text-sm font-bold text-white/70">{weatherData.description}</p>
            <p className="text-xs text-white/40">Feels like {weatherData.feels_like_c}°C</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          {[
            { icon: Droplets,  label: 'Humidity',  value: `${weatherData.humidity_pct}%` },
            { icon: Wind,      label: 'Wind',      value: `${weatherData.wind_kmh} km/h` },
            { icon: CloudRain, label: 'Rain',      value: weatherData.rain_1h_mm > 0 ? `${weatherData.rain_1h_mm}mm/h` : 'None' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="rounded-xl p-2.5 text-center"
              style={{ background: 'rgba(0,0,0,0.25)' }}>
              <Icon size={14} className="text-white/60 mx-auto mb-1" />
              <p className="text-[9px] text-white/40 font-bold uppercase">{label}</p>
              <p className="text-xs font-black text-white">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Farming Alerts ── */}
      <div className="space-y-2">
        <p className="text-[10px] font-black text-white/30 uppercase tracking-widest px-1">
          🌾 Farming Alerts
        </p>
        {weatherAlerts.map((alert, i) => {
          const isGood = alert.startsWith('No weather');
          return (
            <div key={i} className="flex items-start gap-3 rounded-xl p-3"
              style={{
                background: isGood ? 'rgba(34,197,94,0.06)' : 'rgba(245,158,11,0.08)',
                border: `1px solid ${isGood ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.2)'}`,
              }}>
              <span className="shrink-0 mt-0.5 text-sm leading-none">{isGood ? '✅' : '⚠️'}</span>
              <p className="text-xs text-white/80 leading-relaxed font-medium break-words min-w-0 flex-1">{alert}</p>
            </div>
          );
        })}
      </div>

      {/* ── Clouds ── */}
      <div className="flex items-center gap-3 rounded-xl p-3"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <Cloud size={16} className="text-blue-300" />
        <div className="flex-1">
          <div className="flex justify-between mb-1">
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-wide">Cloud Cover</span>
            <span className="text-[10px] font-black text-white/60">{weatherData.cloud_pct}%</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${weatherData.cloud_pct}%`,
                background: 'linear-gradient(90deg, #93c5fd, #bfdbfe)',
              }} />
          </div>
        </div>
      </div>

    </div>
  );
}
