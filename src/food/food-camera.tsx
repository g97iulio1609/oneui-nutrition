/**
 * Food Camera Component
 *
 * Componente per accesso fotocamera webcam/smartphone
 * Supporta analisi etichetta e segmentazione piatto
 */

'use client';

import { useTranslations } from 'next-intl';
import { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, X, Loader2, CheckCircle2, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { Button } from '@onecoach/ui-core';
import { logger } from '@onecoach/lib-shared';

export type FoodCameraMode = 'label' | 'dish';

export interface FoodCameraProps {
  mode: FoodCameraMode;
  onCapture: (imageBase64: string) => Promise<void>;
  onClose?: () => void;
  className?: string;
}

export function FoodCamera({ mode, onCapture, onClose, className = '' }: FoodCameraProps) {
  const t = useTranslations();
  const [isOpen, setIsOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startCamera = useCallback(async () => {
    const t = useTranslations('common');
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode === 'label' ? 'environment' : 'user', // Back camera for labels, front for dishes
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });

      setStream(mediaStream);
      setIsOpen(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: unknown) {
      logger.error(t('common.error'), err);
      setError(
        err instanceof Error && err.name === 'NotAllowedError'
          ? "Permesso fotocamera negato. Abilita l'accesso alle impostazioni del browser."
          : "Errore nell'accesso alla fotocamera"
      );
    }
  }, [mode, t]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      setStream(null);
    }
    setIsOpen(false);
    setCapturedImage(null);
    setSuccess(false);
  }, [stream]);

  const captureImage = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0);

    // Convert to base64
    const imageData = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(imageData);
    stopCamera();
  }, [stopCamera]);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        setCapturedImage(result);
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const handleConfirm = useCallback(async () => {
    const t = useTranslations('common');
    if (!capturedImage) return;

    setIsProcessing(true);
    setError(null);
    setSuccess(false);

    try {
      await onCapture(capturedImage);
      setSuccess(true);

      // Auto close after 1.5s
      setTimeout(() => {
        setCapturedImage(null);
        setSuccess(false);
        onClose?.();
      }, 1500);
    } catch (err: unknown) {
      logger.error(t('common.error'), err);
      setError(err instanceof Error ? err.message : "Errore nell'elaborazione dell'immagine");
    } finally {
      setIsProcessing(false);
    }
  }, [capturedImage, onCapture, onClose, t]);

  const handleRetake = useCallback(() => {
    setCapturedImage(null);
    setError(null);
    setSuccess(false);
    startCamera();
  }, [startCamera]);

  const handleClose = useCallback(() => {
    stopCamera();
    setCapturedImage(null);
    setError(null);
    setSuccess(false);
    onClose?.();
  }, [stopCamera, onClose]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      }
    };
  }, [stream]);

  return (
    <div className={`relative ${className}`}>
      {!isOpen && !capturedImage && (
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <Button onClick={startCamera} className="flex-1" variant="default">
              <Camera className="mr-2 h-4 w-4" />
              {mode === 'label' ? 'Scatta Foto Etichetta' : 'Scatta Foto Piatto'}
            </Button>
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="flex-1"
            >
              <ImageIcon className="mr-2 h-4 w-4" />
              {t('common.food_camera.carica_foto')}
            </Button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}

      {isOpen && !capturedImage && (
        <div className="relative overflow-hidden rounded-lg bg-black">
          <video ref={videoRef} autoPlay playsInline className="h-auto w-full max-w-full" />
          <div className="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <div className="flex gap-2">
              <Button onClick={captureImage} className="flex-1" size="lg">
                <Camera className="mr-2 h-5 w-5" />
                Scatta
              </Button>
              <Button onClick={stopCamera} variant="outline" size="lg">
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {capturedImage && (
        <div className="relative">
          <div className="border-primary relative overflow-hidden rounded-lg border-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={capturedImage}
              alt="Captured"
              className="h-auto max-h-96 w-full bg-neutral-100 object-contain dark:bg-neutral-800"
            />
            {success && (
              <div className="absolute inset-0 flex items-center justify-center bg-green-500/20">
                <div className="rounded-full bg-white p-3 dark:bg-neutral-900">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-2 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
              <p className="flex-1 text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="mt-3 flex gap-2">
            <Button onClick={handleConfirm} disabled={isProcessing || success} className="flex-1">
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('common.food_camera.analisi_in_corso')}
                </>
              ) : success ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  {t('common.food_camera.completato')}
                </>
              ) : (
                'Conferma e Analizza'
              )}
            </Button>
            <Button onClick={handleRetake} variant="outline" disabled={isProcessing || success}>
              {t('common.food_camera.rifai_foto')}
            </Button>
            <Button onClick={handleClose} variant="ghost" disabled={isProcessing}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default FoodCamera;
