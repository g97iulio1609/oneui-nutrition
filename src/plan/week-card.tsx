/**
 * WeekCard Component
 *
 * Card per visualizzare e modificare una settimana
 * Include header con gradient, lista giorni, azioni
 */

'use client';

import { useMemo } from 'react';
import { Plus, Trash2, BookOpen, Bookmark, GripVertical } from 'lucide-react';
import type { NutritionWeek } from '@onecoach/types';
import { DayCard } from './day-card';
import type { FoodItem } from '@onecoach/types';
import { SortableList, SortableItem, type SortableItemRenderProps } from '@onecoach/ui-core';
import { createNutritionDayDragId } from '@onecoach/lib-shared';
import { darkModeClasses, cn } from '@onecoach/lib-design-system';
import { useTranslations } from 'next-intl';

interface WeekCardProps {
  week: NutritionWeek;
  isExpanded: boolean;
  onToggle: () => void;
  onAddDay: () => void;
  onAddDayFromTemplate?: () => void;
  onDayAddMeal: (dayNumber: number) => void;
  onDayAddMealFromTemplate?: () => void;
  onMealNameChange: (dayNumber: number, mealId: string, name: string) => void;
  onAddFood: (dayNumber: number, mealId: string) => void;
  onAddFoodFromCatalog: (dayNumber: number, mealId: string, foodItem: FoodItem) => void;
  onFoodQuantityChange: (
    dayNumber: number,
    mealId: string,
    foodId: string,
    quantity: number
  ) => void;
  onRemoveFood: (dayNumber: number, mealId: string, foodId: string) => void;
  onOpenFoodDetails?: (foodId: string) => void;
  onRemoveMeal: (dayNumber: number, mealId: string) => void;
  onSaveMealAsTemplate?: (dayNumber: number, mealId: string) => void;
  onSaveDayAsTemplate?: (dayNumber: number) => void;
  onRemoveDay: (dayNumber: number) => void;
  onRemoveWeek: () => void;
  onSaveWeekAsTemplate?: () => void;
  onCreateNewFood?: () => void;
  isAdmin?: boolean;
  expandedDays: Set<string>;
  expandedMeals: Set<string>;
  onToggleDay: (dayKey: string) => void;
  onToggleMeal: (mealKey: string) => void;
  enableDragDrop?: boolean;
  draggable?: boolean;
  dragId?: string;
  dragData?: Record<string, unknown>;
}

export function WeekCard({
  week,
  isExpanded,
  onToggle,
  onAddDay,
  onAddDayFromTemplate,
  onDayAddMeal,
  onDayAddMealFromTemplate,
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
  onRemoveWeek,
  onSaveWeekAsTemplate,
  onCreateNewFood,
  isAdmin = false,
  expandedDays,
  expandedMeals,
  onToggleDay,
  onToggleMeal,
  enableDragDrop = false,
  draggable = false,
  dragId,
  dragData,
}: WeekCardProps) {

  // Memoize day drag IDs
  const dayDragIds = useMemo(
    () => week.days?.map((day) => createNutritionDayDragId(week.weekNumber, day.dayNumber)) || [],
    [week.days, week.weekNumber]
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
          isDragging ? 'scale-[0.97] rotate-1 opacity-60 shadow-md ring-2 ring-green-500/30' : ''
        )}
      >
        <div
          className={cn(
            'flex flex-col gap-3 border-b p-5 sm:flex-row sm:items-center sm:justify-between',
            darkModeClasses.divider.base,
            'bg-green-50/30 dark:bg-green-900/10'
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
                aria-label={t('ariaLabels.dragWeek')}
              >
                <GripVertical
                  className={cn(
                    'h-6 w-6 transition-colors hover:text-green-600 dark:hover:text-green-400',
                    darkModeClasses.text.tertiary
                  )}
                />
              </div>
            )}
            <button
              onClick={onToggle}
              className={cn(
                '-mx-2 flex items-center gap-2 rounded-lg px-2 text-left text-lg font-semibold',
                darkModeClasses.text.primary,
                darkModeClasses.interactive.hover,
                darkModeClasses.interactive.button
              )}
            >
              {t('viewer.labels.week')} {week.weekNumber}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onAddDay}
              className={cn(
                'flex min-h-[40px] touch-manipulation items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold whitespace-nowrap text-white transition-all duration-200',
                'bg-green-600 hover:bg-green-700 active:bg-green-800 dark:bg-green-500 dark:hover:bg-green-600 dark:active:bg-green-700',
                darkModeClasses.interactive.button
              )}
            >
              <Plus className="h-4 w-4 flex-shrink-0" />
              <span>{t('viewer.labels.day')}</span>
            </button>
            {onAddDayFromTemplate && (
              <button
                onClick={onAddDayFromTemplate}
                className={cn(
                  'flex min-h-[40px] touch-manipulation items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold whitespace-nowrap text-white transition-all duration-200',
                  'bg-purple-600 hover:bg-purple-700 active:bg-purple-800 dark:bg-purple-500 dark:hover:bg-purple-600 dark:active:bg-purple-700',
                  darkModeClasses.interactive.button
                )}
                title={t('templates.title')}
              >
                <BookOpen className="h-4 w-4 flex-shrink-0" />
                <span>{t('visualBuilder.editor')}</span>
              </button>
            )}
            {week.days && week.days.length > 0 && onSaveWeekAsTemplate && (
              <button
                onClick={(e: React.MouseEvent<HTMLElement>) => {
                  e.stopPropagation();
                  onSaveWeekAsTemplate();
                }}
                className={cn(
                  'flex min-h-[40px] touch-manipulation items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold whitespace-nowrap text-white transition-all duration-200',
                  'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 dark:bg-indigo-500 dark:hover:bg-indigo-600 dark:active:bg-indigo-700',
                  darkModeClasses.interactive.button
                )}
                title={t('saveAsTemplate.week')}
              >
                <Bookmark className="h-4 w-4 flex-shrink-0" />
                <span>{t('saveAsTemplate.week')}</span>
              </button>
            )}
            <button
              onClick={onRemoveWeek}
              className={cn(
                'flex min-h-[40px] min-w-[40px] touch-manipulation items-center justify-center rounded-xl transition-all duration-200',
                'text-red-600 dark:text-red-400',
                'hover:bg-red-50 hover:shadow-sm dark:hover:bg-red-900/20',
                darkModeClasses.interactive.button
              )}
              aria-label={t('ariaLabels.removeWeek')}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className={cn('animate-in fade-in slide-in-from-top-2 space-y-3 p-4 duration-200')}>
            {!week.days || week.days.length === 0 ? (
              <p className={cn('text-center text-sm', darkModeClasses.text.muted)}>
                {t('emptyStates.noDays')}
              </p>
            ) : enableDragDrop ? (
              <SortableList items={dayDragIds} strategy="vertical">
                {week.days.map((day, index) => {
                  const dayKey = `${week.weekNumber}-${day.dayNumber}`;
                  return (
                    <DayCard
                      key={dayKey}
                      day={day}
                      weekNumber={week.weekNumber}
                      isExpanded={expandedDays.has(dayKey)}
                      onToggle={() => onToggleDay(dayKey)}
                      onAddMeal={() => onDayAddMeal(day.dayNumber)}
                      onAddMealFromTemplate={onDayAddMealFromTemplate}
                      onMealNameChange={(mealId, name) =>
                        onMealNameChange(day.dayNumber, mealId, name)
                      }
                      onAddFood={(mealId) => onAddFood(day.dayNumber, mealId)}
                      onAddFoodFromCatalog={(mealId, foodItem) =>
                        onAddFoodFromCatalog(day.dayNumber, mealId, foodItem)
                      }
                      onFoodQuantityChange={(mealId, foodId, quantity) =>
                        onFoodQuantityChange(day.dayNumber, mealId, foodId, quantity)
                      }
                      onRemoveFood={(mealId, foodId) => onRemoveFood(day.dayNumber, mealId, foodId)}
                      onOpenFoodDetails={onOpenFoodDetails}
                      onRemoveMeal={(mealId) => onRemoveMeal(day.dayNumber, mealId)}
                      onSaveMealAsTemplate={
                        onSaveMealAsTemplate
                          ? (mealId) => onSaveMealAsTemplate(day.dayNumber, mealId)
                          : undefined
                      }
                      onSaveDayAsTemplate={
                        onSaveDayAsTemplate ? () => onSaveDayAsTemplate(day.dayNumber) : undefined
                      }
                      onRemoveDay={() => onRemoveDay(day.dayNumber)}
                      onCreateNewFood={onCreateNewFood}
                      isAdmin={isAdmin}
                      expandedMeals={expandedMeals}
                      onToggleMeal={onToggleMeal}
                      enableDragDrop={enableDragDrop}
                      draggable={enableDragDrop}
                      dragId={dayDragIds[index]}
                      dragData={{
                        weekNumber: week.weekNumber,
                        dayNumber: day.dayNumber,
                      }}
                    />
                  );
                })}
              </SortableList>
            ) : (
              week.days.map((day) => {
                const dayKey = `${week.weekNumber}-${day.dayNumber}`;
                return (
                  <DayCard
                    key={dayKey}
                    day={day}
                    weekNumber={week.weekNumber}
                    isExpanded={expandedDays.has(dayKey)}
                    onToggle={() => onToggleDay(dayKey)}
                    onAddMeal={() => onDayAddMeal(day.dayNumber)}
                    onAddMealFromTemplate={onDayAddMealFromTemplate}
                    onMealNameChange={(mealId, name) =>
                      onMealNameChange(day.dayNumber, mealId, name)
                    }
                    onAddFood={(mealId) => onAddFood(day.dayNumber, mealId)}
                    onAddFoodFromCatalog={(mealId, foodItem) =>
                      onAddFoodFromCatalog(day.dayNumber, mealId, foodItem)
                    }
                    onFoodQuantityChange={(mealId, foodId, quantity) =>
                      onFoodQuantityChange(day.dayNumber, mealId, foodId, quantity)
                    }
                    onRemoveFood={(mealId, foodId) => onRemoveFood(day.dayNumber, mealId, foodId)}
                    onOpenFoodDetails={onOpenFoodDetails}
                    onRemoveMeal={(mealId) => onRemoveMeal(day.dayNumber, mealId)}
                    onSaveMealAsTemplate={
                      onSaveMealAsTemplate
                        ? (mealId) => onSaveMealAsTemplate(day.dayNumber, mealId)
                        : undefined
                    }
                    onSaveDayAsTemplate={
                      onSaveDayAsTemplate ? () => onSaveDayAsTemplate(day.dayNumber) : undefined
                    }
                    onRemoveDay={() => onRemoveDay(day.dayNumber)}
                    onCreateNewFood={onCreateNewFood}
                    isAdmin={isAdmin}
                    expandedMeals={expandedMeals}
                    onToggleMeal={onToggleMeal}
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
