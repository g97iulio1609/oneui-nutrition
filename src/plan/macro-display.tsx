'use client';

import { useTranslations } from 'next-intl';
/**
 * MacroDisplay Component
 *
 * Componente per visualizzare macro con design moderno
 * Supporta visualizzazione circolare (ProgressRing) e compatta
 */

import { ProgressRing } from '@onecoach/ui-core';
import type { Macros } from '@onecoach/types';

interface MacroDisplayProps {
  macros: Macros;
  targetMacros?: Macros;
  variant?: 'circular' | 'compact' | 'inline';
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  className?: string;
}

const MACRO_COLORS = {
  protein: 'purple-600',
  carbs: 'green-600',
  fats: 'orange-600',
  calories: 'blue-600',
} as const;

export function MacroDisplay({
  macros,
  targetMacros,
  variant = 'compact',
  size = 'md',
  showLabels = true,
  className = '',
}: MacroDisplayProps) {
  const t = useTranslations('nutrition');

  const getPercentage = (actual: number, target: number): number => {
    if (target === 0) return 0;
    return Math.min((actual / target) * 100, 100);
  };

  const sizeMap = {
    sm: { ring: 60, text: 'text-xs' },
    md: { ring: 80, text: 'text-sm' },
    lg: { ring: 120, text: 'text-base' },
  };

  if (variant === 'circular' && targetMacros) {
    const proteinRemaining = Math.max(0, targetMacros.protein - macros.protein);
    const carbsRemaining = Math.max(0, targetMacros.carbs - macros.carbs);
    const fatsRemaining = Math.max(0, targetMacros.fats - macros.fats);
    const caloriesRemaining = Math.max(0, targetMacros.calories - macros.calories);

    return (
      <div className={`flex flex-wrap justify-center gap-6 sm:gap-8 ${className}`}>
        {/* Protein - Purple */}
        <div className="flex flex-col items-center gap-2">
          <ProgressRing
            percentage={getPercentage(macros.protein, targetMacros.protein)}
            size={sizeMap[size].ring}
            color={MACRO_COLORS.protein}
            showPercentage={false}
          />
          <div className="text-center">
            <div className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
              Protein
            </div>
            <div className={`font-bold ${sizeMap[size].text} text-purple-700`}>
              Consumed {Math.round(macros.protein)}/{Math.round(targetMacros.protein)}g
            </div>
            <div className="text-xs font-medium text-neutral-500 dark:text-neutral-500">
              Remaining {Math.round(proteinRemaining)}g
            </div>
          </div>
        </div>

        {/* Fat - Orange */}
        <div className="flex flex-col items-center gap-2">
          <ProgressRing
            percentage={getPercentage(macros.fats, targetMacros.fats)}
            size={sizeMap[size].ring}
            color={MACRO_COLORS.fats}
            showPercentage={false}
          />
          <div className="text-center">
            <div className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Fat</div>
            <div className={`font-bold ${sizeMap[size].text} text-orange-700`}>
              Consumed {Math.round(macros.fats)}/{Math.round(targetMacros.fats)}g
            </div>
            <div className="text-xs font-medium text-neutral-500 dark:text-neutral-500">
              Remaining {Math.round(fatsRemaining)}g
            </div>
          </div>
        </div>

        {/* Net Carbohydrate - Green */}
        <div className="flex flex-col items-center gap-2">
          <ProgressRing
            percentage={getPercentage(macros.carbs, targetMacros.carbs)}
            size={sizeMap[size].ring}
            color={MACRO_COLORS.carbs}
            showPercentage={false}
          />
          <div className="text-center">
            <div className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
              {t('nutrition.macro_display.net_carbohydrate')}
            </div>
            <div className={`font-bold ${sizeMap[size].text} text-green-700`}>
              Consumed {Math.round(macros.carbs)}/{Math.round(targetMacros.carbs)}g
            </div>
            <div className="text-xs font-medium text-neutral-500 dark:text-neutral-500">
              Remaining {Math.round(carbsRemaining)}g
            </div>
          </div>
        </div>

        {/* Calories - Blue (optional, se mostrato) */}
        {showLabels && (
          <div className="flex flex-col items-center gap-2">
            <ProgressRing
              percentage={getPercentage(macros.calories, targetMacros.calories)}
              size={sizeMap[size].ring}
              color={MACRO_COLORS.calories}
              showPercentage={false}
            />
            <div className="text-center">
              <div className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                Calories
              </div>
              <div className={`font-bold ${sizeMap[size].text} text-blue-700`}>
                {Math.round(macros.calories)} / {Math.round(targetMacros.calories)}
              </div>
              <div className="text-xs font-medium text-neutral-500 dark:text-neutral-500">
                Remaining {Math.round(caloriesRemaining)} kcal
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`flex flex-wrap items-center gap-2 ${className}`}>
        <div className="flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1">
          <span className="text-xs font-medium text-blue-700">
            {Math.round(macros.calories)} kcal
          </span>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-purple-50 px-2 py-1">
          <span className="text-xs font-medium text-purple-700">
            {t('nutrition.macro_display.p')}
            {Math.round(macros.protein)}g
          </span>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-green-50 px-2 py-1">
          <span className="text-xs font-medium text-green-700">
            {t('nutrition.macro_display.c')}
            {Math.round(macros.carbs)}g
          </span>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-orange-50 px-2 py-1">
          <span className="text-xs font-medium text-orange-700">
            {t('nutrition.macro_display.f')}
            {Math.round(macros.fats)}g
          </span>
        </div>
      </div>
    );
  }

  // Inline variant
  return (
    <div className={`flex flex-wrap items-center gap-2 text-sm ${className}`}>
      <span className="text-neutral-600 dark:text-neutral-400">
        <span className="font-medium text-blue-600">{Math.round(macros.calories)}</span> kcal
      </span>
      <span className="text-neutral-400 dark:text-neutral-600">|</span>
      <span className="text-neutral-600 dark:text-neutral-400">
        <span className="font-medium text-purple-600">{t('nutrition.macro_display.p')}</span>{' '}
        {Math.round(macros.protein)}g
      </span>
      <span className="text-neutral-600 dark:text-neutral-400">
        <span className="font-medium text-green-600">{t('nutrition.macro_display.c')}</span>{' '}
        {Math.round(macros.carbs)}g
      </span>
      <span className="text-neutral-600 dark:text-neutral-400">
        <span className="font-medium text-orange-600">{t('nutrition.macro_display.f')}</span>{' '}
        {Math.round(macros.fats)}g
      </span>
    </div>
  );
}
