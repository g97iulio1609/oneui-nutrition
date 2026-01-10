/**
 * DayCard Component
 *
 * Card per visualizzare e modificare un giorno
 * Include header, lista pasti, azioni
 */

'use client';

import { useMemo } from 'react';
import { Trash2, GripVertical, Plus, BookOpen, Bookmark } from 'lucide-react';
import { MealCard } from './meal-card';
import { SortableList, SortableItem, type SortableItemRenderProps } from '@onecoach/ui-core';
import { createMealDragId } from '@onecoach/lib-shared';
import { darkModeClasses, cn } from '@onecoach/lib-design-system';
import { useTranslations } from 'next-intl';
import type { NutritionDay } from "@onecoach/types-nutrition";
import type { FoodItem } from "@onecoach/types-nutrition";

interface DayCardProps {
  day: NutritionDay;
  weekNumber: number;
  isExpanded: boolean;
  onToggle: () => void;
  onAddMeal: () => void;
  onAddMealFromTemplate?: () => void;
  onMealNameChange: (mealId: string, name: string) => void;
  onAddFood: (mealId: string) => void;
  onAddFoodFromCatalog: (mealId: string, foodItem: FoodItem) => void;
  onFoodQuantityChange: (mealId: string, foodId: string, quantity: number) => void;
  onRemoveFood: (mealId: string, foodId: string) => void;
  onOpenFoodDetails?: (foodId: string) => void;
  onRemoveMeal: (mealId: string) => void;
  onSaveMealAsTemplate?: (mealId: string) => void;
  onSaveDayAsTemplate?: () => void;
  onRemoveDay: () => void;
  onCreateNewFood?: () => void;
  isAdmin?: boolean;
  expandedMeals: Set<string>;
  onToggleMeal: (mealKey: string) => void;
  enableDragDrop?: boolean;
  draggable?: boolean;
  dragId?: string;
  dragData?: Record<string, unknown>;
}

export function DayCard({
  day,
  weekNumber: _weekNumber,
  isExpanded,
  onToggle,
  onAddMeal,
  onAddMealFromTemplate,
  onMealNameChange,
  onAddFood,
  onAddFoodFromCatalog,
  onFoodQuantityChange,
  onRemoveFood,
  onOpenFoodDetails,
  onRemoveMeal,
  onSaveMealAsTemplate,
  onSaveDayAsTemplate,
  onRemoveDay,
  onCreateNewFood,
  isAdmin = false,
  expandedMeals,
  onToggleMeal,
  enableDragDrop = false,
  draggable = false,
  dragId,
  dragData,
}: DayCardProps) {

  // Memoize meal drag IDs
  const mealDragIds = useMemo(
    () => day.meals.map((meal) => createMealDragId(day.dayNumber, meal.id)),
    [day.meals, day.dayNumber]
  );

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
          isDragging ? 'scale-[0.97] rotate-1 opacity-60 shadow-md ring-2 ring-blue-500/30' : ''
        )}
      >
        <div
          className={cn(
            'flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between',
            darkModeClasses.divider.base,
            'bg-blue-50/30 dark:bg-blue-900/10'
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
                aria-label={t('ariaLabels.dragDay')}
              >
                <GripVertical
                  className={cn(
                    'h-5 w-5 transition-colors hover:text-blue-600 dark:hover:text-blue-400',
                    darkModeClasses.text.tertiary
                  )}
                />
              </div>
            )}
            <button
              onClick={onToggle}
              className={cn(
                '-mx-2 flex items-center gap-2 rounded-lg px-2 text-lg font-semibold',
                darkModeClasses.text.primary,
                darkModeClasses.interactive.hover,
                darkModeClasses.interactive.button
              )}
            >
              {t('viewer.labels.day')} {day.dayNumber}
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onAddMeal}
              className={cn(
                'flex min-h-[40px] touch-manipulation items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all duration-200',
                'bg-green-50 dark:bg-green-900/20',
                'text-green-700 dark:text-green-400',
                'hover:bg-green-100 dark:hover:bg-green-900/30',
                darkModeClasses.interactive.button
              )}
            >
              <Plus className="h-4 w-4 flex-shrink-0" />
              <span>{t('visualBuilder.dayEditor.mealPrefix')}</span>
            </button>
            {onAddMealFromTemplate && (
              <button
                onClick={onAddMealFromTemplate}
                className={cn(
                  'flex min-h-[40px] touch-manipulation items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all duration-200',
                  'bg-purple-50 dark:bg-purple-900/20',
                  'text-purple-700 dark:text-purple-400',
                  'hover:bg-purple-100 dark:hover:bg-purple-900/30',
                  darkModeClasses.interactive.button
                )}
                title={t('visualBuilder.dayEditor.loadFromTemplate')}
              >
                <BookOpen className="h-4 w-4 flex-shrink-0" />
                <span>{t('visualBuilder.editor')}</span>
              </button>
            )}
            {day.meals.length > 0 && onSaveDayAsTemplate && (
              <button
                onClick={(e: React.MouseEvent<HTMLElement>) => {
                  e.stopPropagation();
                  onSaveDayAsTemplate();
                }}
                className={cn(
                  'flex min-h-[40px] touch-manipulation items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all duration-200',
                  'bg-indigo-50 dark:bg-indigo-900/20',
                  'text-indigo-700 dark:text-indigo-400',
                  'hover:bg-indigo-100 dark:hover:bg-indigo-900/30',
                  darkModeClasses.interactive.button
                )}
                title={t('saveAsTemplate.day')}
              >
                <Bookmark className="h-4 w-4 flex-shrink-0" />
                <span>{t('saveAsTemplate.day')}</span>
              </button>
            )}
            <button
              onClick={onRemoveDay}
              className={cn(
                'flex min-h-[40px] min-w-[40px] touch-manipulation items-center justify-center rounded-xl transition-all duration-200',
                'text-red-600 dark:text-red-400',
                'hover:bg-red-50 hover:shadow-sm dark:hover:bg-red-900/20',
                darkModeClasses.interactive.button
              )}
              aria-label={t('ariaLabels.removeDay')}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className={cn('animate-in fade-in slide-in-from-top-2 space-y-3 p-4 duration-200')}>
            {day.meals.length === 0 ? (
              <p className={cn('text-center text-sm', darkModeClasses.text.muted)}>
                {t('emptyStates.noMeals')}
              </p>
            ) : enableDragDrop ? (
              <SortableList items={mealDragIds} strategy="vertical">
                {day.meals.map((meal, index) => {
                  const mealKey = `${day.dayNumber}-${meal.id}`;
                  return (
                    <MealCard
                      key={mealKey}
                      meal={meal}
                      dayNumber={day.dayNumber}
                      isExpanded={expandedMeals.has(mealKey)}
                      onToggle={() => onToggleMeal(mealKey)}
                      onNameChange={(name) => onMealNameChange(meal.id, name)}
                      onAddFood={() => onAddFood(meal.id)}
                      onAddFoodFromCatalog={(foodItem) => onAddFoodFromCatalog(meal.id, foodItem)}
                      onFoodQuantityChange={(foodId, quantity) =>
                        onFoodQuantityChange(meal.id, foodId, quantity)
                      }
                      onRemoveFood={(foodId) => onRemoveFood(meal.id, foodId)}
                      onOpenFoodDetails={onOpenFoodDetails}
                      onRemoveMeal={() => onRemoveMeal(meal.id)}
                      onSaveAsTemplate={
                        onSaveMealAsTemplate ? () => onSaveMealAsTemplate(meal.id) : undefined
                      }
                      onCreateNewFood={onCreateNewFood}
                      isAdmin={isAdmin}
                      enableDragDrop={enableDragDrop}
                      draggable={enableDragDrop}
                      dragId={mealDragIds[index]}
                      dragData={{
                        dayNumber: day.dayNumber,
                        mealId: meal.id,
                      }}
                    />
                  );
                })}
              </SortableList>
            ) : (
              day.meals.map((meal) => {
                const mealKey = `${day.dayNumber}-${meal.id}`;
                return (
                  <MealCard
                    key={mealKey}
                    meal={meal}
                    dayNumber={day.dayNumber}
                    isExpanded={expandedMeals.has(mealKey)}
                    onToggle={() => onToggleMeal(mealKey)}
                    onNameChange={(name) => onMealNameChange(meal.id, name)}
                    onAddFood={() => onAddFood(meal.id)}
                    onAddFoodFromCatalog={(foodItem) => onAddFoodFromCatalog(meal.id, foodItem)}
                    onFoodQuantityChange={(foodId, quantity) =>
                      onFoodQuantityChange(meal.id, foodId, quantity)
                    }
                    onRemoveFood={(foodId) => onRemoveFood(meal.id, foodId)}
                    onOpenFoodDetails={onOpenFoodDetails}
                    onRemoveMeal={() => onRemoveMeal(meal.id)}
                    onSaveAsTemplate={
                      onSaveMealAsTemplate ? () => onSaveMealAsTemplate(meal.id) : undefined
                    }
                    onCreateNewFood={onCreateNewFood}
                    isAdmin={isAdmin}
                    enableDragDrop={enableDragDrop}
                  />
                );
              })
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
}
