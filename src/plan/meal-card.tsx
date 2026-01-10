/**
 * MealCard Component
 *
 * Card per visualizzare e modificare un pasto
 * Include header, macro summary, lista alimenti, azioni
 * Supporta drag and drop per riordinamento alimenti
 */

'use client';

import { useMemo, useCallback, memo } from 'react';
import { ChevronDown, ChevronRight, Plus, Trash2, Bookmark, GripVertical } from 'lucide-react';
import { FoodItemCard } from './food-item-card';
import { FoodComboboxSection } from './food-combobox-section';
import { SortableList, SortableItem, type SortableItemRenderProps } from '@onecoach/ui-core';
import { createFoodDragId } from '@onecoach/lib-shared';
import { darkModeClasses, cn } from '@onecoach/lib-design-system';
import { useTranslations } from 'next-intl';
import type { Meal } from "@onecoach/types-nutrition";
import type { FoodItem } from "@onecoach/types-nutrition";

interface MealCardProps {
  meal: Meal;
  dayNumber: number;
  isExpanded: boolean;
  onToggle: () => void;
  onNameChange: (name: string) => void;
  onAddFood: () => void;
  onAddFoodFromCatalog: (foodItem: FoodItem) => void;
  onFoodQuantityChange: (foodId: string, quantity: number) => void;
  onRemoveFood: (foodId: string) => void;
  onOpenFoodDetails?: (foodId: string) => void;
  onRemoveMeal: () => void;
  onSaveAsTemplate?: () => void;
  onCreateNewFood?: () => void;
  isAdmin?: boolean;
  // Drag and drop support
  enableDragDrop?: boolean;
  draggable?: boolean;
  dragId?: string;
  dragData?: Record<string, unknown>;
}

// OPTIMIZATION: Wrap with React.memo to prevent unnecessary re-renders
export const MealCard = memo(function MealCard({
  meal,
  dayNumber,
  isExpanded,
  onToggle,
  onNameChange,
  onAddFood,
  onAddFoodFromCatalog,
  onFoodQuantityChange,
  onRemoveFood,
  onOpenFoodDetails,
  onRemoveMeal,
  onSaveAsTemplate,
  onCreateNewFood,
  isAdmin = false,
  enableDragDrop = false,
  draggable = false,
  dragId,
  dragData,
}: MealCardProps) {

  // OPTIMIZATION: Memoize drag IDs to prevent recalculation on every render
  const foodDragIds = useMemo(
    () => meal.foods.map((food) => createFoodDragId(dayNumber, meal.id, food.id)),
    [meal.foods, meal.id, dayNumber]
  );

  // OPTIMIZATION: Memoize render function to prevent recreation on every render
  // Render food items (DRY - single render function)
  const renderFoodItems = useCallback(
    () =>
      meal.foods.map((food, index) => (
        <FoodItemCard
          key={food.id}
          food={food}
          onQuantityChange={(quantity) => onFoodQuantityChange(food.id, quantity)}
          onRemove={() => onRemoveFood(food.id)}
          onOpenDetails={
            onOpenFoodDetails && food.foodItemId && food.foodItemId !== `temp-${food.id}`
              ? () => onOpenFoodDetails(food.foodItemId!)
              : undefined
          }
          draggable={enableDragDrop}
          dragId={enableDragDrop ? foodDragIds[index] : undefined}
          dragData={
            enableDragDrop
              ? {
                  dayNumber,
                  mealId: meal.id,
                  foodId: food.id,
                }
              : undefined
          }
        />
      )),
    [
      meal.foods,
      meal.id,
      dayNumber,
      enableDragDrop,
      foodDragIds,
      onFoodQuantityChange,
      onRemoveFood,
      onOpenFoodDetails,
    ]
  );

  // Render function for the card content
  const renderCard = (dragProps?: SortableItemRenderProps) => {
    const t = useTranslations('nutrition');
    const isDragging = dragProps?.isDragging || false;

    return (
      <div
        ref={dragProps?.setNodeRef}
        style={dragProps?.style}
        className={cn(
          'overflow-hidden rounded-2xl border shadow-sm transition-all duration-200 ease-out hover:shadow-md dark:hover:shadow-lg',
          darkModeClasses.card.base,
          isDragging ? 'scale-[0.97] rotate-1 opacity-60 shadow-md ring-2 ring-purple-500/30' : ''
        )}
      >
        <div
          className={cn(
            'flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between',
            darkModeClasses.divider.base,
            'bg-purple-50/30 dark:bg-purple-900/10'
          )}
        >
          <div className="flex items-center gap-2">
            {draggable && (
              <div
                {...(dragProps?.attributes || {})}
                {...(dragProps?.listeners || {})}
                className={cn(
                  '-ml-2 flex min-h-[44px] min-w-[44px] flex-shrink-0 cursor-grab touch-manipulation items-center justify-center rounded-lg transition-all duration-200 active:cursor-grabbing',
                  'hover:bg-neutral-50/50 dark:hover:bg-neutral-700/30'
                )}
                aria-label={t('ariaLabels.dragMeal')}
              >
                <GripVertical
                  className={cn(
                    'h-5 w-5 transition-colors hover:text-purple-600 dark:hover:text-purple-400',
                    darkModeClasses.text.tertiary
                  )}
                />
              </div>
            )}
            <button
              onClick={onToggle}
              className={cn(
                '-mx-2 flex items-center gap-2 rounded-lg px-2 font-medium',
                darkModeClasses.text.primary,
                darkModeClasses.interactive.hover,
                darkModeClasses.interactive.button
              )}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 flex-shrink-0" />
              ) : (
                <ChevronRight className="h-4 w-4 flex-shrink-0" />
              )}
              <input
                type="text"
                value={meal.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onNameChange(e.target.value)}
                onClick={(e: React.MouseEvent<HTMLElement>) => e.stopPropagation()}
                className={cn(
                  'border-0 bg-transparent transition-colors duration-200 focus:ring-0 focus:outline-none',
                  darkModeClasses.text.primary
                )}
                placeholder={t('placeholders.mealName')}
              />
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div
              className={cn(
                'flex items-center gap-2 rounded-full px-3 py-1.5 shadow-sm',
                'bg-orange-100 dark:bg-orange-900/30'
              )}
            >
              <span
                className={cn(
                  'text-xs font-bold whitespace-nowrap',
                  'text-orange-700 dark:text-orange-400'
                )}
              >
                {Math.round(meal.totalMacros.calories)} kcal
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={onAddFood}
                className={cn(
                  'flex min-h-[40px] touch-manipulation items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all duration-200',
                  'bg-green-50 dark:bg-green-900/20',
                  'text-green-700 dark:text-green-400',
                  'hover:bg-green-100 dark:hover:bg-green-900/30',
                  darkModeClasses.interactive.button
                )}
              >
                <Plus className="h-4 w-4 flex-shrink-0" />
                <span>{t('viewer.labels.foods')}</span>
              </button>
              {meal.foods.length > 0 && onSaveAsTemplate && (
                <button
                  onClick={(e: React.MouseEvent<HTMLElement>) => {
                    e.stopPropagation();
                    onSaveAsTemplate();
                  }}
                  className={cn(
                    'flex min-h-[40px] touch-manipulation items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all duration-200',
                    'bg-blue-50 dark:bg-blue-900/20',
                    'text-blue-700 dark:text-blue-400',
                    'hover:bg-blue-100 dark:hover:bg-blue-900/30',
                    darkModeClasses.interactive.button
                  )}
                  title={t('saveAsTemplate.meal')}
                >
                  <Bookmark className="h-4 w-4 flex-shrink-0" />
                  <span>{t('saveAsTemplate.meal')}</span>
                </button>
              )}
              <button
                onClick={onRemoveMeal}
                className={cn(
                  'flex min-h-[40px] min-w-[40px] touch-manipulation items-center justify-center rounded-xl transition-all duration-200',
                  'text-red-600 dark:text-red-400',
                  'hover:bg-red-50 hover:shadow-sm dark:hover:bg-red-900/20',
                  darkModeClasses.interactive.button
                )}
                aria-label={t('ariaLabels.removeMeal')}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className={cn('animate-in fade-in slide-in-from-top-2 space-y-2 p-3 duration-200')}>
            <FoodComboboxSection
              onSelect={onAddFoodFromCatalog}
              onCreateNew={onCreateNewFood}
              isAdmin={isAdmin}
            />

            {meal.foods.length === 0 ? (
              <p className={cn('text-center text-sm', darkModeClasses.text.muted)}>
                {t('emptyStates.noFoods')}
              </p>
            ) : enableDragDrop ? (
              <SortableList items={foodDragIds} strategy="vertical">
                {renderFoodItems()}
              </SortableList>
            ) : (
              renderFoodItems()
            )}
          </div>
        )}
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
