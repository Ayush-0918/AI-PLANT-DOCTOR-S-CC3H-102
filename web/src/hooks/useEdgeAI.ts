/**
 * useEdgeAI - Custom React hook for offline AI scanning
 * Manages model loading, inference, and result caching
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { getEdgeAI, initializeEdgeAI, isOfflineScanningAvailable, ScanResult } from '@/lib/ai/edge-model';
import { fetchJson } from '@/lib/api';

export interface UseEdgeAIState {
  // Status
  isInitialized: boolean;
  isInitializing: boolean;
  isScanning: boolean;
  error: string | null;

  // Model info
  modelSize: string;
  accuracy: string;
  classCount: number;

  // Functions
  initialize: () => Promise<boolean>;
  scan: (imageData: HTMLCanvasElement | HTMLImageElement) => Promise<ScanResult | null>;
  checkAvailability: () => Promise<boolean>;
  clearError: () => void;

  // Cached results
  lastScan: ScanResult | null;
  scanHistory: ScanResult[];
}

export function useEdgeAI(): UseEdgeAIState {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastScan, setLastScan] = useState<ScanResult | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);
  const [modelAccuracy, setModelAccuracy] = useState('84.87%');
  const [modelClassCount, setModelClassCount] = useState(38);

  // Initialize model on component mount
  useEffect(() => {
    const init = async () => {
      setIsInitializing(true);
      try {
        const success = await initializeEdgeAI();
        if (success) {
          setIsInitialized(true);
          setError(null);
          console.log('[useEdgeAI] ✅ Model initialized successfully');
        } else {
          setError('Failed to load offline model');
          console.error('[useEdgeAI] ❌ Model initialization failed');
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        console.error('[useEdgeAI] ❌ Error:', message);
      } finally {
        setIsInitializing(false);
      }
    };

    init();
  }, []);

  useEffect(() => {
    const syncMetrics = async () => {
      try {
        const metrics = await fetchJson<{ accuracy_pct?: number; dataset_classes?: number }>('/api/v1/admin/ai/model/accuracy');
        if (typeof metrics?.accuracy_pct === 'number') {
          setModelAccuracy(`${metrics.accuracy_pct}%`);
        }
        if (typeof metrics?.dataset_classes === 'number') {
          setModelClassCount(metrics.dataset_classes);
        }
      } catch {
        // Keep safe fallback values for offline/demo mode.
      }
    };

    syncMetrics();
  }, []);

  // Initialize AI model
  const initialize = useCallback(async (): Promise<boolean> => {
    if (isInitialized) return true;

    setIsInitializing(true);
    setError(null);

    try {
      const success = await initializeEdgeAI();
      if (success) {
        setIsInitialized(true);
        return true;
      } else {
        setError('Failed to load offline model');
        return false;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      return false;
    } finally {
      setIsInitializing(false);
    }
  }, [isInitialized]);

  // Scan image
  const scan = useCallback(
    async (imageData: HTMLCanvasElement | HTMLImageElement): Promise<ScanResult | null> => {
      if (!isInitialized) {
        setError('Model not initialized. Call initialize() first.');
        return null;
      }

      setIsScanning(true);
      setError(null);

      try {
        const edgeAI = getEdgeAI();
        const result = await edgeAI.scan(imageData);

        // Update history
        setLastScan(result);
        setScanHistory((prev) => [result, ...prev].slice(0, 10)); // Keep last 10 scans

        // Save to localStorage for offline persistence
        try {
          const cached = JSON.parse(localStorage.getItem('edgeai_scan_history') || '[]');
          cached.push(result);
          localStorage.setItem('edgeai_scan_history', JSON.stringify(cached.slice(-20)));
        } catch (e) {
          console.warn('[useEdgeAI] Could not save to localStorage:', e);
        }

        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Scanning failed';
        setError(message);
        console.error('[useEdgeAI] Scan error:', message);
        return null;
      } finally {
        setIsScanning(false);
      }
    },
    [isInitialized]
  );

  // Check if offline scanning is available
  const checkAvailability = useCallback(async (): Promise<boolean> => {
    return await isOfflineScanningAvailable();
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Get model status
  const edgeAI = getEdgeAI();
  const status = edgeAI.getStatus();

  return {
    // Status
    isInitialized,
    isInitializing,
    isScanning,
    error,

    // Model info
    modelSize: `${status.size_mb}MB`,
    accuracy: modelAccuracy || status.accuracy,
    classCount: modelClassCount || status.classes,

    // Functions
    initialize,
    scan,
    checkAvailability,
    clearError,

    // Results
    lastScan,
    scanHistory,
  };
}
