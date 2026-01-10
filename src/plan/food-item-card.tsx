'use client';

import { useTranslations } from 'next-intl';
/**
 * FoodItemCard Component
 *
 * Card per visualizzare e modificare un alimento
 * Design moderno, touch-friendly, mobile-first
 * Supporta drag and drop opzionale per riordinamento
 */

import { useState, memo, useCallback, useLayoutEffect } from 'react';
import { GripVertical, Trash2 } from 'lucide-react';
import { MacroDisplay } from './macro-display';
import { SortableItem, type SortableItemRenderProps } from '@onecoach/ui-core';
import { darkModeClasses, cn } from '@onecoach/lib-design-system';
import type { Food } from "@onecoach/types-nutrition";

interface FoodItemCardProps {
  food: Food;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
  onOpenDetails?: () => void;
  className?: string;
  // Drag and drop props (optional)
  draggable?: boolean;
  dragId?: string;
  dragData?: Record<string, unknown>;
}

// OPTIMIZATION: Wrap with React.memo to prevent unnecessary re-renders
// Only re-render when food data or drag props actually change
export const FoodItemCard = memo(function FoodItemCard({
  food,
  onQuantityChange,
  onRemove,
  onOpenDetails,
  className = '',
  draggable = false,
  dragId,
  dragData,
}: FoodItemCardProps) {
  const canOpenDetails = onOpenDetails && food.foodItemId && food.foodItemId !== `temp-${food.id}`;

  // Derive display value from food.quantity
  const getDisplayValue = useCallback((qty: number | undefined) => {
    if (qty === 0 || qty === undefined) return '';
    // Remove leading zeros and keep decimals
    return qty.toString().replace(/^0+(?=\d)/, '');
  }, []);

  const [quantityDisplay, setQuantityDisplay] = useState<string>(() =>
    getDisplayValue(food.quantity)
  );

  // Sync input value when food.quantity changes externally
  // quantityDisplay is intentionally used in condition but not as dependency to avoid loops
  useLayoutEffect(() => {
    const newDisplay = getDisplayValue(food.quantity);
    if (quantityDisplay !== newDisplay && document.activeElement?.tagName !== 'INPUT') {
      // Only update if not currently editing
      setQuantityDisplay(newDisplay);
    }
    // quantityDisplay is intentionally used in condition but not in dependencies to avoid infinite loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [food.quantity, getDisplayValue]);

  // Render function for the card content
  const renderCard = (dragProps?: SortableItemRenderProps) => {
    const t = useTranslations('nutrition');

    const isDragging = dragProps?.isDragging || false;

    return (
      <div
        ref={dragProps?.setNodeRef}
        style={dragProps?.style}
        className={cn(
          'group cursor-pointer touch-manipulation rounded-2xl border p-4 shadow-sm transition-all duration-200 ease-out',
          darkModeClasses.card.base,
          'hover:border-green-400 dark:hover:border-green-500',
          'hover:bg-green-50/30 dark:hover:bg-green-900/10',
          'hover:shadow-md dark:hover:shadow-lg',
          darkModeClasses.interactive.button,
          isDragging ? 'scale-[0.97] rotate-1 opacity-60 shadow-md ring-2 ring-green-500/30' : '',
          className
        )}
        onClick={(e: React.MouseEvent<HTMLElement>) => {
          if (canOpenDetails) {
            e.stopPropagation();
            onOpenDetails?.();
          }
        }}
        role={canOpenDetails ? 'button' : undefined}
        tabIndex={canOpenDetails ? 0 : undefined}
        aria-label={
          canOpenDetails ? `Visualizza dettagli di ${food.name || 'alimento'}` : undefined
        }
        onKeyDown={(e) => {
          if (canOpenDetails && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            e.stopPropagation();
            onOpenDetails?.();
          }
        }}
      >
        <div className="flex items-start gap-2">
          <div
            {...(dragProps?.attributes || {})}
            {...(dragProps?.listeners || {})}
            className={cn(
              'mt-1 flex-shrink-0',
              draggable &&
                cn(
                  '-ml-2 flex min-h-[44px] min-w-[44px] cursor-grab touch-manipulation items-center justify-center rounded-lg transition-all duration-200 active:cursor-grabbing',
                  'hover:bg-neutral-50/50 dark:hover:bg-neutral-700/30'
                )
            )}
            aria-label={draggable ? 'Trascina per riordinare' : undefined}
          >
            <GripVertical
              className={`h-5 w-5 ${
                draggable
                  ? cn(
                      'transition-colors hover:text-green-600 dark:hover:text-green-400',
                      darkModeClasses.text.tertiary
                    )
                  : darkModeClasses.text.tertiary
              }`}
            />
          </div>
          <div className="flex-1 space-y-2">
            <input
              type="text"
              value={food.name || ''}
              readOnly
              className={cn(
                'w-full cursor-default border-0 font-medium transition-colors duration-200 focus:ring-0 focus:outline-none',
                darkModeClasses.bg.subtle,
                darkModeClasses.text.secondary
              )}
              placeholder={t('nutrition.food_item_card.nome_alimento')}
            />
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  inputMode="decimal"
                  value={quantityDisplay}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    let inputValue = e.target.value;

                    // Rimuove gli zeri iniziali (tranne se è "0" seguito da un punto decimale o se è solo "0")
                    inputValue = inputValue.replace(/^0+(?=\d)/, '');

                    // Permette solo numeri e punto decimale
                    inputValue = inputValue.replace(/[^0-9.]/g, '');

                    // Permette solo un punto decimale
                    const parts = inputValue.split('.');
                    if (parts.length > 2) {
                      inputValue = parts[0] + '.' + parts.slice(1).join('');
                    }

                    setQuantityDisplay(inputValue);

                    // Converti in numero e chiama onQuantityChange
                    const numValue = parseFloat(inputValue);
                    if (!isNaN(numValue) && numValue >= 0) {
                      onQuantityChange(numValue);
                    } else if (inputValue === '' || inputValue === '.') {
                      // Permette campo vuoto o punto decimale durante la digitazione
                      onQuantityChange(0);
                    }
                  }}
                  onBlur={(_e) => {
                    // Quando perde il focus, assicura che il valore sia valido
                    const numValue = parseFloat(quantityDisplay);
                    if (isNaN(numValue) || numValue < 0) {
                      setQuantityDisplay(
                        food.quantity === 0 ? '' : food.quantity.toString().replace(/^0+(?=\d)/, '')
                      );
                    } else {
                      setQuantityDisplay(numValue.toString().replace(/^0+(?=\d)/, ''));
                    }
                  }}
                  onClick={(e: React.MouseEvent<HTMLElement>) => e.stopPropagation()}
                  onFocus={(e) => e.stopPropagation()}
                  className={cn(
                    'w-16 touch-manipulation rounded text-sm transition-all duration-200 focus:ring-2 focus:outline-none',
                    darkModeClasses.input.base,
                    'focus:border-green-500 focus:ring-green-500/20 dark:focus:border-green-400 dark:focus:ring-green-900/50'
                  )}
                />
                <input
                  type="text"
                  value={food.unit || 'g'}
                  readOnly
                  className={cn(
                    'w-12 cursor-default rounded text-sm',
                    darkModeClasses.border.base,
                    darkModeClasses.bg.subtle,
                    darkModeClasses.text.secondary
                  )}
                />
              </div>
              <span className={darkModeClasses.text.tertiary}>|</span>
              <MacroDisplay
                macros={food.macros || { calories: 0, protein: 0, carbs: 0, fats: 0 }}
                variant="inline"
              />
            </div>
          </div>
          <button
            onClick={(e: React.MouseEvent<HTMLElement>) => {
              e.stopPropagation();
              onRemove();
            }}
            className={cn(
              'flex min-h-[32px] min-w-[32px] flex-shrink-0 touch-manipulation items-center justify-center rounded-lg p-1 transition-all duration-200',
              'text-red-600 dark:text-red-400',
              'hover:bg-red-50 dark:hover:bg-red-900/20',
              darkModeClasses.interactive.button
            )}
            aria-label="Rimuovi alimento"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  };

  // If draggable, wrap with SortableItem
  if (draggable && dragId) {
    return (
      <SortableItem id={dragId} data={dragData}>
        {(dragProps) => renderCard(dragProps)}
      </SortableItem>
    );
  }

  // Otherwise, render directly
  return renderCard();
});
