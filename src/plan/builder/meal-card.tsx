'use client';

import { useTranslations } from 'next-intl';

import { useState } from 'react';
import { Card } from '@onecoach/ui';
import { Trash2, ArrowUp, ArrowDown, Plus, X } from 'lucide-react';
import { cn } from '@onecoach/lib-design-system';
import type { Meal, Food } from "@onecoach/types-nutrition";

interface MealCardProps {
  meal: Meal;
  index: number;
  totalMeals: number;
  onUpdate: (meal: Meal) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onAddFood: () => void;
}

const MEAL_TYPE_LABELS: Record<string, string> = {
  breakfast: 'Colazione',
  lunch: 'Pranzo',
  dinner: 'Cena',
  snack: 'Spuntino',
  'pre-workout': 'Pre-workout',
  'post-workout': 'Post-workout',
};

export function MealCard({
  meal,
  index,
  totalMeals,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
  onAddFood,
}: MealCardProps) {
  const t = useTranslations('nutrition');

  const [isExpanded, setIsExpanded] = useState(true);

  const handleRemoveFood = (foodIndex: number) => {
    const newFoods = [...(meal.foods || [])];
    const removedFood = newFoods[foodIndex];
    newFoods.splice(foodIndex, 1);

    const updatedMeal: Meal = {
      ...meal,
      foods: newFoods,
      totalMacros: {
        calories: Math.max(
          0,
          (meal.totalMacros?.calories || 0) - (removedFood?.macros?.calories || 0)
        ),
        protein: Math.max(
          0,
          (meal.totalMacros?.protein || 0) - (removedFood?.macros?.protein || 0)
        ),
        carbs: Math.max(0, (meal.totalMacros?.carbs || 0) - (removedFood?.macros?.carbs || 0)),
        fats: Math.max(0, (meal.totalMacros?.fats || 0) - (removedFood?.macros?.fats || 0)),
      },
    };

    onUpdate(updatedMeal);
  };

  const handleUpdateFoodQuantity = (foodIndex: number, newQuantity: number) => {
    const newFoods = [...(meal.foods || [])];
    const food = newFoods[foodIndex];
    if (!food || !food.macros) return;

    const ratio = newQuantity / (food.quantity || 100);
    const updatedFood: Food = {
      ...food,
      quantity: newQuantity,
      macros: {
        calories: Math.round((food.macros.calories || 0) * ratio),
        protein: Math.round((food.macros.protein || 0) * ratio * 10) / 10,
        carbs: Math.round((food.macros.carbs || 0) * ratio * 10) / 10,
        fats: Math.round((food.macros.fats || 0) * ratio * 10) / 10,
      },
    };

    newFoods[foodIndex] = updatedFood;

    // Recalculate total macros
    interface FoodWithMacros {
      macros?: {
        calories: number;
        protein: number;
        carbs: number;
        fats: number;
      };
    }
    const totalMacros = newFoods.reduce(
      (
        acc: { calories: number; protein: number; carbs: number; fats: number },
        f: FoodWithMacros
      ) => ({
        calories: acc.calories + (f.macros?.calories || 0),
        protein: acc.protein + (f.macros?.protein || 0),
        carbs: acc.carbs + (f.macros?.carbs || 0),
        fats: acc.fats + (f.macros?.fats || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );

    const updatedMeal: Meal = {
      ...meal,
      foods: newFoods,
      totalMacros,
    };

    onUpdate(updatedMeal);
  };

  const mealTypeLabel = MEAL_TYPE_LABELS[meal.type] || meal.type;

  return (
    <Card variant="glass" className="overflow-hidden p-0">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-200 bg-white/50 p-4 dark:border-neutral-700 dark:bg-neutral-900/30">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex flex-1 items-center gap-3 text-left"
          type="button"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <span className="font-bold text-green-600 dark:text-green-400">{index + 1}</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-neutral-900 dark:text-neutral-100">{meal.name}</span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                ({mealTypeLabel})
              </span>
              {meal.time && (
                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                  · {meal.time}
                </span>
              )}
            </div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">
              {Math.round(meal.totalMacros?.calories || 0)} {t('nutrition.meal_card.kcal')}{' '}
              {Math.round(meal.totalMacros?.protein || 0)}
              {t('nutrition.meal_card.g_p')} {Math.round(meal.totalMacros?.carbs || 0)}
              {t('nutrition.meal_card.g_c')} {Math.round(meal.totalMacros?.fats || 0)}
              {t('nutrition.meal_card.g_f')}
            </div>
          </div>
        </button>

        <div className="flex items-center gap-1">
          <button
            onClick={onMoveUp}
            disabled={index === 0}
            className={cn(
              'rounded-lg p-2 transition-all duration-200',
              'hover:bg-green-50 hover:shadow-sm',
              'active:scale-95 active:bg-green-100',
              'focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:outline-none',
              'disabled:cursor-not-allowed disabled:opacity-40',
              'dark:hover:bg-green-900/20 dark:active:bg-green-900/30',
              'dark:focus-visible:ring-green-400'
            )}
            type="button"
            aria-label="Sposta pasto in alto"
          >
            <ArrowUp
              size={16}
              className={cn(
                'text-green-700 dark:text-green-300',
                'transition-colors duration-200',
                index === 0 && 'text-neutral-400 dark:text-neutral-600'
              )}
            />
          </button>
          <button
            onClick={onMoveDown}
            disabled={index === totalMeals - 1}
            className={cn(
              'rounded-lg p-2 transition-all duration-200',
              'hover:bg-green-50 hover:shadow-sm',
              'active:scale-95 active:bg-green-100',
              'focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:outline-none',
              'disabled:cursor-not-allowed disabled:opacity-40',
              'dark:hover:bg-green-900/20 dark:active:bg-green-900/30',
              'dark:focus-visible:ring-green-400'
            )}
            type="button"
            aria-label="Sposta pasto in basso"
          >
            <ArrowDown
              size={16}
              className={cn(
                'text-green-700 dark:text-green-300',
                'transition-colors duration-200',
                index === totalMeals - 1 && 'text-neutral-400 dark:text-neutral-600'
              )}
            />
          </button>
          <button
            onClick={onRemove}
            className="rounded-lg p-2 transition-all duration-200 hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:outline-none active:scale-95 active:bg-red-100 dark:hover:bg-red-900/20 dark:focus-visible:ring-red-400 dark:active:bg-red-900/30"
            type="button"
            aria-label="Rimuovi pasto"
          >
            <Trash2 size={16} className="text-red-600 dark:text-red-400" />
          </button>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="space-y-4 p-4">
          {/* Foods List */}
          <div className="space-y-2">
            {meal.foods?.map((food, foodIndex) => (
              <div
                key={food.id || foodIndex}
                className="flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50/50 p-3 dark:border-neutral-700 dark:bg-neutral-800/30"
              >
                <div className="flex-1">
                  <div className="font-medium text-neutral-900 dark:text-neutral-100">
                    {food.name || 'Alimento'}
                  </div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">
                    {Math.round(food.macros?.calories || 0)} {t('nutrition.meal_card.kcal')}{' '}
                    {Math.round(food.macros?.protein || 0)}
                    {t('nutrition.meal_card.g_p')} {Math.round(food.macros?.carbs || 0)}
                    {t('nutrition.meal_card.g_c')}
                    {Math.round(food.macros?.fats || 0)}
                    {t('nutrition.meal_card.g_f')}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={food.quantity || 100}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleUpdateFoodQuantity(foodIndex, parseFloat(e.target.value) || 0)
                    }
                    className="w-20 rounded border border-neutral-300 bg-white px-2 py-1 text-sm text-neutral-900 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
                    min="0"
                    step="1"
                  />
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    {food.unit || 'g'}
                  </span>
                  <button
                    onClick={() => handleRemoveFood(foodIndex)}
                    className="rounded p-1 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
                    type="button"
                    aria-label="Rimuovi alimento"
                  >
                    <X size={14} className="text-red-600 dark:text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add Food Button */}
          <button
            onClick={onAddFood}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-neutral-300 py-3 transition-colors hover:bg-neutral-50 dark:border-neutral-600 dark:hover:bg-neutral-800"
            type="button"
          >
            <Plus size={16} className="text-neutral-500 dark:text-neutral-400" />
            <span className="font-medium text-neutral-600 dark:text-neutral-400">
              {t('nutrition.meal_card.aggiungi_alimento')}
            </span>
          </button>

          {/* Notes */}
          {meal.notes && (
            <div className="rounded-lg bg-neutral-100 p-3 dark:bg-neutral-800/50">
              <p className="text-sm text-neutral-600 dark:text-neutral-400">{meal.notes}</p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
