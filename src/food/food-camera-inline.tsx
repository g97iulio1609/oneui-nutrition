/**
 * Food Camera Inline Component
 *
 * Versione inline più compatta e raffinata
 * Premium design with enhanced micro-interactions
 */

'use client';

import { useTranslations } from 'next-intl';
import { FoodCamera, type FoodCameraMode } from './food-camera';
import { useState } from 'react';
import { Camera, Scan as ScanBarcode, Sparkles, ChevronRight } from 'lucide-react';
import type { FoodItem } from '@onecoach/types';
import { cn } from '@onecoach/lib-design-system';
import { logger } from '@onecoach/lib-shared';

export interface FoodCameraInlineProps {
  onFoodAdded?: (foodItem: FoodItem) => void;
  onDishSegmented?: (items: FoodItem[]) => void;
  className?: string;
}

export function FoodCameraInline({
  onFoodAdded,
  onDishSegmented,
  className = '',
}: FoodCameraInlineProps) {
  const t = useTranslations();
  const [mode, setMode] = useState<FoodCameraMode | null>(null);

  const handleCapture = async (imageBase64: string) => {
    const t = useTranslations('common');
    try {
      const isLabel = mode === 'label';
      const endpoint = isLabel ? '/api/food/analyze-label' : '/api/food/segment-dish';
      const payload = isLabel ? { image: imageBase64 } : { imageBase64 };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || "Errore nell'analisi");
      }

      const result = await response.json();

      if (isLabel) {
        if (result?.foodItem) onFoodAdded?.(result.foodItem);
      } else {
        const items = result?.data?.items || result?.items || [];
        if (items.length) onDishSegmented?.(items);
      }

      setMode(null);
    } catch (error: unknown) {
      logger.error('Error processing image:', error);
      const { dialog } = await import('@onecoach/lib-stores');
      await dialog.error(error instanceof Error ? error.message : t('common.errors.unknown'));
    }
  };

  if (mode) {
    return (
      <div className={className}>
        <FoodCamera mode={mode} onCapture={handleCapture} onClose={() => setMode(null)} />
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {/* Etichetta Button - Horizontal layout */}
      <button
        onClick={() => setMode('label')}
        className={cn(
          'group flex items-center gap-4 rounded-xl p-3 transition-all duration-200',
          'border border-white/10 bg-white/5',
          'hover:border-emerald-500/40 hover:bg-emerald-500/10',
          'active:scale-[0.98]'
        )}
      >
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 shadow-md shadow-emerald-500/25">
          <ScanBarcode className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">
              {t('common.food_camera_inline.scansiona_etichetta')}
            </span>
            <span className="flex items-center gap-0.5 rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400">
              <Sparkles className="h-2 w-2" />
              AI
            </span>
          </div>
          <span className="text-xs text-neutral-400">
            {t('common.food_camera_inline.leggi_valori_nutrizionali')}
          </span>
        </div>
        <ChevronRight className="h-4 w-4 text-neutral-500 transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-400" />
      </button>

      {/* Piatto Button - Horizontal layout */}
      <button
        onClick={() => setMode('dish')}
        className={cn(
          'group flex items-center gap-4 rounded-xl p-3 transition-all duration-200',
          'border border-white/10 bg-white/5',
          'hover:border-emerald-500/40 hover:bg-emerald-500/10',
          'active:scale-[0.98]'
        )}
      >
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 shadow-md shadow-green-500/25">
          <Camera className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">
              {t('common.food_camera_inline.analizza_piatto')}
            </span>
            <span className="flex items-center gap-0.5 rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400">
              <Sparkles className="h-2 w-2" />
              AI
            </span>
          </div>
          <span className="text-xs text-neutral-400">
            {t('common.food_camera_inline.identifica_ingredienti')}
          </span>
        </div>
        <ChevronRight className="h-4 w-4 text-neutral-500 transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-400" />
      </button>
    </div>
  );
}
