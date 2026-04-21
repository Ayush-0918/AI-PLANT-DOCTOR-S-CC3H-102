/**
 * ThreatRadar - Community-driven pest and disease threat map
 * Shows nearby disease clusters detected by other farmers
 * Alerts farmer when 14+ detect same disease within 10km
 */

'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Map, Zap, Users } from 'lucide-react';
import { fetchJson } from '@/lib/api';

interface Threat {
  disease: string;
  farmer_count: number;
  distance_km: number;
  alert_level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  confidence_score: number;
  hours_since_last_detection: number;
  hours_remaining_alert: number;
  recommendation: string;
  affected_area_km2: number;
}

interface ThreatRadarProps {
  latitude: number;
  longitude: number;
  onThreatsUpdate?: (threats: Threat[]) => void;
  language?: string;
}

const ALERT_COLORS = {
  CRITICAL: { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-700', badge: 'bg-red-600' },
  HIGH: { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-700', badge: 'bg-orange-600' },
  MEDIUM: { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-700', badge: 'bg-yellow-600' },
  LOW: { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-700', badge: 'bg-blue-600' },
};

export function ThreatRadar({ latitude, longitude, onThreatsUpdate, language: _language = 'en' }: ThreatRadarProps) {
  void _language;
  const [threats, setThreats] = useState<Threat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Fetch threat data
  useEffect(() => {
    const fetchThreats = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchJson<{ threats?: Threat[] }>(
          `/api/v1/geo/threats?lat=${latitude}&lon=${longitude}&radius_km=10`
        );
        const threatsList = data.threats || [];

        setThreats(threatsList);
        setLastUpdated(new Date());
        onThreatsUpdate?.(threatsList);

        console.log('[ThreatRadar] ✅ Threat data updated:', threatsList.length, 'threats found');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch threats';
        console.error('[ThreatRadar] ❌ Error:', message);
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchThreats();

    // Poll every 30 minutes for updates
    const interval = setInterval(fetchThreats, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, [latitude, longitude, onThreatsUpdate]);

  // Render loading state
  if (loading) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-3">
          <Zap className="w-6 h-6 text-blue-600 animate-pulse" />
          <h3 className="font-semibold text-blue-900">Scanning for Disease Threats...</h3>
        </div>
        <p className="text-blue-800 text-sm">
          Checking geospatial data from {latitude.toFixed(4)}°N, {longitude.toFixed(4)}°E
        </p>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700 text-sm font-semibold mb-2">Unable to load threat data</p>
        <p className="text-red-600 text-xs">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 text-red-600 hover:text-red-800 text-xs font-semibold"
        >
          Retry
        </button>
      </div>
    );
  }

  // Render no threats state
  if (threats.length === 0) {
    return (
      <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-300 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-3">
          <Zap className="w-6 h-6 text-green-600" />
          <h3 className="font-semibold text-green-900">Your Area is Safe ✅</h3>
        </div>
        <p className="text-green-800 text-sm mb-2">
          No crop diseases reported within 10km of your location
        </p>
        <p className="text-green-700 text-xs">
          Last updated: {lastUpdated?.toLocaleTimeString()}
        </p>
      </div>
    );
  }

  // Calculate highest alert level
  const highestAlertLevel = threats[0]?.alert_level || 'LOW';
  const totalFarmersAffected = threats.reduce((sum, t) => sum + t.farmer_count, 0);

  return (
    <div className="space-y-4">
      {/* Summary card */}
      <div className={`border rounded-lg p-4 ${ALERT_COLORS[highestAlertLevel].bg} ${ALERT_COLORS[highestAlertLevel].border}`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <AlertTriangle className={`w-6 h-6 ${ALERT_COLORS[highestAlertLevel].text}`} />
            <div>
              <h3 className={`font-bold text-lg ${ALERT_COLORS[highestAlertLevel].text}`}>
                {highestAlertLevel} ALERT
              </h3>
              <p className={`text-sm ${ALERT_COLORS[highestAlertLevel].text}`}>
                {threats.length} disease threat{threats.length !== 1 ? 's' : ''} detected nearby
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 justify-end">
              <Users className="w-4 h-4" />
              <span className="font-bold">{totalFarmersAffected}</span>
            </div>
            <p className="text-xs opacity-75">farmers</p>
          </div>
        </div>
      </div>

      {/* Threat list */}
      <div className="space-y-3">
        {threats.map((threat, idx) => (
          <div
            key={idx}
            className={`border rounded-lg p-4 ${ALERT_COLORS[threat.alert_level].bg} ${ALERT_COLORS[threat.alert_level].border}`}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-white text-xs font-bold ${ALERT_COLORS[threat.alert_level].badge}`}>
                  {threat.alert_level}
                </span>
                <h4 className={`font-bold ${ALERT_COLORS[threat.alert_level].text}`}>
                  {threat.disease.replace(/_/g, ' ')}
                </h4>
              </div>
              <div className="text-right">
                <p className={`font-bold text-lg ${ALERT_COLORS[threat.alert_level].text}`}>
                  {threat.distance_km}km away
                </p>
                <p className="text-xs opacity-75">
                  {threat.confidence_score.toFixed(0)}% confidence
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
              <div className="bg-white/50 rounded p-2">
                <p className="text-gray-600 text-xs">Farmers Reporting</p>
                <p className="font-bold text-lg">{threat.farmer_count}</p>
              </div>
              <div className="bg-white/50 rounded p-2">
                <p className="text-gray-600 text-xs">Affected Area</p>
                <p className="font-bold text-lg">{threat.affected_area_km2} km²</p>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-2 mb-3 border-t border-current/20 pt-3">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold">Last detected:</span>
                <span className="opacity-75">{threat.hours_since_last_detection.toFixed(1)}h ago</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold">Alert valid for:</span>
                <span className="opacity-75">{threat.hours_remaining_alert.toFixed(0)} more hours</span>
              </div>
            </div>

            {/* Recommendation */}
            <div className="bg-white/40 rounded p-3 border-l-4 border-current/50">
              <p className={`text-sm font-semibold ${ALERT_COLORS[threat.alert_level].text} mb-1`}>
                🎯 Recommendation
              </p>
              <p className="text-sm opacity-90">{threat.recommendation}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="bg-gray-50 rounded-lg p-3 text-center text-xs text-gray-600">
        <div className="flex items-center justify-center gap-2">
          <Map className="w-4 h-4" />
          <span>
            Last updated: {lastUpdated?.toLocaleTimeString()}
            <br />
            Location: {latitude.toFixed(4)}°N, {longitude.toFixed(4)}°E
          </span>
        </div>
      </div>
    </div>
  );
}
