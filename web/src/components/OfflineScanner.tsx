/**
 * OfflineScanner - UI component for offline crop scanning
 * Shows camera feed, capture button, and results
 * Works without internet connection using TensorFlow.js
 */

'use client';

import { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import { useEdgeAI } from '@/hooks/useEdgeAI';
import { ScanResult } from '@/lib/ai/edge-model';
import { AlertCircle, Loader2, Camera, Upload, Zap } from 'lucide-react';

interface OfflineScannerProps {
  onScanComplete?: (result: ScanResult) => void;
}

export function OfflineScanner({ onScanComplete }: OfflineScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [cameraActive, setCameraActive] = useState(false);
  const [mode, setMode] = useState<'idle' | 'camera' | 'upload'>('idle');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);

  // Edge AI hook
  const edgeAI = useEdgeAI();

  // Initialize camera
  useEffect(() => {
    if (!cameraActive) return;
    const videoElement = videoRef.current;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment', // Back camera on mobile
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });

        if (videoElement) {
          videoElement.srcObject = stream;
          videoElement.onloadedmetadata = () => {
            videoElement?.play();
          };
        }
      } catch (err) {
        edgeAI.clearError();
        alert('Cannot access camera. Please check permissions.');
        setCameraActive(false);
      }
    };

    startCamera();

    return () => {
      // Cleanup: stop camera stream
      if (videoElement && videoElement.srcObject) {
        const tracks = (videoElement.srcObject as MediaStream).getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, [cameraActive, edgeAI]);

  // Capture photo from camera
  const handleCapture = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match video
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;

    // Draw video frame to canvas
    ctx.drawImage(videoRef.current, 0, 0);

    // Run offline scan
    await runScan(canvasRef.current);
  };

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create image preview
    const reader = new FileReader();
    reader.onload = async (event) => {
      const imageSrc = event.target?.result as string;
      setUploadedImage(imageSrc);

      // Create image element and run scan
      const img = document.createElement('img');
      img.onload = async () => {
        await runScan(img);
      };
      img.src = imageSrc;
    };
    reader.readAsDataURL(file);
  };

  // Run the offline scan
  const runScan = async (imageData: HTMLCanvasElement | HTMLImageElement) => {
    if (!edgeAI.isInitialized) {
      edgeAI.clearError();
      const success = await edgeAI.initialize();
      if (!success) {
        alert('Failed to load AI model. Check internet and try again.');
        return;
      }
    }

    const result = await edgeAI.scan(imageData);
    if (result) {
      setScanResult(result);
      onScanComplete?.(result);

      // Auto-switch to result view
      setCameraActive(false);
    }
  };

  // Render loading state
  if (edgeAI.isInitializing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-gradient-to-b from-green-50 to-white rounded-lg p-6">
        <Loader2 className="w-12 h-12 text-green-600 animate-spin mb-4" />
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Loading AI Model...</h2>
        <p className="text-gray-600 text-center mb-4">
          Downloading {edgeAI.modelSize} offline scanning model
        </p>
        <div className="w-full max-w-xs bg-gray-200 rounded-full h-2">
          <div className="bg-green-600 h-2 rounded-full" style={{ width: '60%' }}></div>
        </div>
        <p className="text-xs text-gray-500 mt-2">This is a one-time download</p>
      </div>
    );
  }

  // Render error state
  if (edgeAI.error && !scanResult) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <div>
            <p className="font-semibold text-red-800">Offline Scanning Error</p>
            <p className="text-red-700 text-sm">{edgeAI.error}</p>
            <button
              onClick={() => edgeAI.clearError()}
              className="mt-2 text-sm text-red-600 hover:text-red-800 font-semibold"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render scan result
  if (scanResult) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center mb-4">
          {scanResult.success ? (
            <>
              <Zap className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{scanResult.disease}</h2>
              <p className="text-gray-600">
                Confidence: <span className="font-semibold text-green-600">{scanResult.confidence}%</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                ⚡ Offline scan completed in {scanResult.inference_time_ms}ms
              </p>
            </>
          ) : (
            <>
              <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-3" />
              <h2 className="text-xl font-bold text-gray-800 mb-2">Unable to Diagnose</h2>
              <p className="text-gray-600 text-sm">{scanResult.treatment?.instructions}</p>
            </>
          )}
        </div>

        {scanResult.success && (
          <div className="bg-green-50 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-green-900 mb-2">Treatment Protocol</h3>
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-gray-600">Medicine:</p>
                <p className="font-semibold text-green-900">{scanResult.treatment?.medicine}</p>
              </div>
              <div>
                <p className="text-gray-600">Dosage:</p>
                <p className="font-semibold text-green-900">{scanResult.treatment?.dosage}</p>
              </div>
              <div>
                <p className="text-gray-600">Instructions:</p>
                <p className="text-green-900">{scanResult.treatment?.instructions}</p>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={() => {
            setScanResult(null);
            setUploadedImage(null);
            setMode('idle');
          }}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
        >
          Scan Another Leaf
        </button>
      </div>
    );
  }

  // Render idle state (choose camera or upload)
  if (mode === 'idle') {
    return (
      <div className="space-y-4">
        <button
          onClick={() => {
            setMode('camera');
            setCameraActive(true);
          }}
          className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
        >
          <Camera className="w-5 h-5" />
          📷 Open Camera
        </button>

        <button
          onClick={() => {
            setMode('upload');
            fileInputRef.current?.click();
          }}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
        >
          <Upload className="w-5 h-5" />
          📁 Upload Photo
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-900 text-sm font-semibold mb-2">✅ Offline Scanning Ready</p>
          <p className="text-blue-800 text-xs">
            AI model is {edgeAI.isInitialized ? 'loaded' : 'loading'}. Scan without internet connection.
            Model size: {edgeAI.modelSize} | Accuracy: {edgeAI.accuracy}
          </p>
        </div>
      </div>
    );
  }

  // Render camera mode
  if (mode === 'camera' && cameraActive) {
    return (
      <div className="relative bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          className="w-full h-auto"
          playsInline
        />

        <canvas ref={canvasRef} className="hidden" />

        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 flex gap-4">
          <button
            onClick={() => {
              setCameraActive(false);
              setMode('idle');
            }}
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition"
          >
            ❌ Close
          </button>

          <button
            onClick={handleCapture}
            disabled={edgeAI.isScanning}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
          >
            {edgeAI.isScanning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Camera className="w-4 h-4" />
                📸 Capture
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // Render upload mode preview
  if (mode === 'upload' && uploadedImage && !scanResult) {
    return (
      <div className="space-y-4">
        <div className="relative w-full bg-gray-100 rounded-lg overflow-hidden">
          <Image
            src={uploadedImage}
            alt="Uploaded leaf"
            width={500}
            height={500}
            className="w-full h-auto"
          />
        </div>

        <button
          onClick={() => {
            setUploadedImage(null);
            setMode('idle');
          }}
          className="w-full bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition"
        >
          ❌ Cancel
        </button>
      </div>
    );
  }

  return null;
}
