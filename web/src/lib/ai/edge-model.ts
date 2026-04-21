/**
 * Edge AI Model - TensorFlow.js wrapper for offline crop scanning
 * Enables farmers to diagnose crop diseases without internet connection
 * Runs on device, preserves privacy, instant results
 */

import * as tf from '@tensorflow/tfjs';
import { PLANTVILLAGE_CLASSES, PLANT_TREATMENTS } from './disease-mapping';

export interface ScanResult {
  success: boolean;
  disease: string;
  confidence: number;
  class_id: string;
  treatment: {
    medicine: string;
    dosage: string;
    instructions: string;
    pesticide?: string;
  };
  timestamp: string;
  mode: 'offline' | 'online';
  inference_time_ms: number;
}

export interface ModelStatus {
  loaded: boolean;
  size_mb: number;
  accuracy: string;
  classes: number;
  last_updated: string;
}

/**
 * EdgeAIModel - Encapsulates TensorFlow.js model and inference logic
 * Handles:
 * - Model loading and caching
 * - Image preprocessing
 * - Inference
 * - Result mapping to treatment data
 */
class EdgeAIModel {
  private model: tf.LayersModel | null = null;
  private modelLoaded = false;
  private modelURL = '/models/plantvillage-mobilenet-v3-lite.json';
  private modelSize = 12.5; // MB (lite version ~12.5MB)

  /**
   * Initialize the model
   * Loads from IndexedDB cache if available, otherwise downloads
   */
  async initialize(): Promise<boolean> {
    try {
      if (this.modelLoaded) return true;

      console.log('[EdgeAI] Initializing model...');

      // Try to load from cache first
      try {
        this.model = await tf.loadLayersModel('indexeddb://plantvillage-model');
        console.log('[EdgeAI] ✅ Model loaded from IndexedDB cache');
        this.modelLoaded = true;
        return true;
      } catch {
        console.log('[EdgeAI] Cache miss, downloading from server...');
      }

      // Download model (shows progress for farmer)
      this.model = await tf.loadLayersModel(this.modelURL);

      // Save to IndexedDB for future offline use
      await this.model.save('indexeddb://plantvillage-model');
      console.log('[EdgeAI] ✅ Model loaded and cached');

      this.modelLoaded = true;
      return true;
    } catch (error) {
      console.error('[EdgeAI] Failed to initialize model:', error);
      return false;
    }
  }

  /**
   * Check if model is ready
   */
  isReady(): boolean {
    return this.modelLoaded && this.model !== null;
  }

  /**
   * Preprocess image for inference
   * Converts image to tensor, normalizes, resizes to 224x224
   */
  private preprocessImage(
    imageData: HTMLCanvasElement | HTMLImageElement
  ): tf.Tensor3D {
    return tf.tidy(() => {
      // Convert image to tensor
      let tensor = tf.browser.fromPixels(imageData, 3);

      // Resize to 224x224 (MobileNetV3 input size)
      tensor = tf.image.resizeBilinear(tensor, [224, 224]);

      // Normalize to [-1, 1] range (ImageNet normalization)
      tensor = tensor.cast('float32');
      tensor = tf.mul(tensor, 1 / 127.5);
      tensor = tf.sub(tensor, 1);

      // Add batch dimension
      return tensor.expandDims(0) as tf.Tensor3D;
    });
  }

  /**
   * Run inference on image
   * Returns disease diagnosis with confidence
   */
  async predict(
    imageData: HTMLCanvasElement | HTMLImageElement
  ): Promise<{ class_id: number; confidence: number }> {
    if (!this.modelLoaded || !this.model) {
      throw new Error('Model not loaded. Call initialize() first.');
    }

    const startTime = performance.now();

    try {
      return tf.tidy(() => {
        // Preprocess
        const tensor = this.preprocessImage(imageData);

        // Inference
        const logits = this.model!.predict(tensor) as tf.Tensor;
        const probabilities = tf.softmax(logits);

        // Get top prediction
        const prediction = tf.topk(probabilities, 1);
        const classId = prediction.indices.dataSync()[0];
        const confidence = prediction.values.dataSync()[0] * 100;

        return {
          class_id: classId,
          confidence: confidence,
        };
      });
    } finally {
      const endTime = performance.now();
      console.log(
        `[EdgeAI] Inference completed in ${(endTime - startTime).toFixed(1)}ms`
      );
    }
  }

  /**
   * Scan image and return full diagnosis with treatment
   */
  async scan(imageData: HTMLCanvasElement | HTMLImageElement): Promise<ScanResult> {
    const startTime = performance.now();

    try {
      if (!this.isReady()) {
        throw new Error('Model not initialized');
      }

      // Run inference
      const { class_id, confidence } = await this.predict(imageData);

      // Map to disease class
      const diseaseKey = Object.keys(PLANTVILLAGE_CLASSES).find(
        (key) => PLANTVILLAGE_CLASSES[key] === class_id
      );

      if (!diseaseKey) {
        return {
          success: false,
          disease: 'Unknown',
          confidence: 0,
          class_id: '',
          treatment: {
            medicine: 'Unable to diagnose',
            dosage: 'N/A',
            instructions: 'Please use online scanning or consult agronomist',
          },
          timestamp: new Date().toISOString(),
          mode: 'offline',
          inference_time_ms: Math.round(performance.now() - startTime),
        };
      }

      // Check if healthy
      const isHealthy = diseaseKey.toLowerCase().includes('healthy');

      const result: ScanResult = {
        success: true,
        disease: diseaseKey,
        confidence: Math.round(confidence),
        class_id: `PV_${class_id}`,
        treatment: isHealthy
          ? {
              medicine: '✅ Crop is Healthy!',
              dosage: 'No treatment needed',
              instructions: 'Continue regular maintenance and monitoring',
            }
          : PLANT_TREATMENTS[diseaseKey] || {
              medicine: 'Consult Agronomist',
              dosage: 'N/A',
              instructions: 'Please consult with an agricultural expert',
            },
        timestamp: new Date().toISOString(),
        mode: 'offline',
        inference_time_ms: Math.round(performance.now() - startTime),
      };

      return result;
    } catch (error) {
      console.error('[EdgeAI] Scan error:', error);
      return {
        success: false,
        disease: 'Error',
        confidence: 0,
        class_id: '',
        treatment: {
          medicine: 'Scanning failed',
          dosage: 'N/A',
          instructions: 'Please check internet and try again or use online mode',
        },
        timestamp: new Date().toISOString(),
        mode: 'offline',
        inference_time_ms: Math.round(performance.now() - startTime),
      };
    }
  }

  /**
   * Get model status info
   */
  getStatus(): ModelStatus {
    return {
      loaded: this.modelLoaded,
      size_mb: this.modelSize,
      accuracy: '84.87%',
      classes: 38,
      last_updated: new Date().toISOString(),
    };
  }

  /**
   * Clear model from memory (if needed)
   */
  dispose(): void {
    if (this.model) {
      this.model.dispose();
      this.model = null;
      this.modelLoaded = false;
      console.log('[EdgeAI] Model disposed');
    }
  }
}

// Global singleton instance
let edgeAI: EdgeAIModel | null = null;

/**
 * Get or create EdgeAIModel singleton
 */
export function getEdgeAI(): EdgeAIModel {
  if (!edgeAI) {
    edgeAI = new EdgeAIModel();
  }
  return edgeAI;
}

/**
 * Initialize EdgeAI (typically called on app startup)
 */
export async function initializeEdgeAI(): Promise<boolean> {
  const ai = getEdgeAI();
  return await ai.initialize();
}

/**
 * Check if offline scanning is available
 */
export async function isOfflineScanningAvailable(): Promise<boolean> {
  const ai = getEdgeAI();
  if (ai.isReady()) return true;

  // Try to initialize
  return await ai.initialize();
}
