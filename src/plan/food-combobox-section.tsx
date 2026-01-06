'use client';

import { useTranslations } from 'next-intl';
/**
 * FoodComboboxSection Component
 *
 * Sezione per aggiungere alimenti dal catalogo
 * Include combobox e bottone "Crea Nuovo" per admin
 */

import { Plus } from 'lucide-react';
import { FoodCombobox } from '../food/food-combobox';
import type { FoodItem } from '@onecoach/types';
import { darkModeClasses, cn } from '@onecoach/lib-design-system';

interface FoodComboboxSectionProps {
  onSelect: (foodItem: FoodItem) => void;
  onCreateNew?: () => void;
  isAdmin?: boolean;
  placeholder?: string;
  noResultsMessage?: string;
  className?: string;
}

export function FoodComboboxSection({
  onSelect,
  onCreateNew,
  isAdmin = false,
  placeholder = 'Cerca alimento per nome o marca...',
  noResultsMessage = 'Nessun alimento trovato. Prova un altro termine.',
  className = '',
}: FoodComboboxSectionProps) {
  const t = useTranslations('nutrition');

  return (
    <div
      className={cn(
        'rounded-2xl border-2 border-dashed p-4 shadow-sm transition-all duration-200 ease-out hover:shadow-md dark:hover:shadow-lg',
        'border-green-300 dark:border-green-600',
        'bg-green-50/50 dark:bg-green-900/10',
        'hover:border-green-400 dark:hover:border-green-500',
        className
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <label className={cn('block text-sm font-semibold', darkModeClasses.text.secondary)}>
          {t('nutrition.food_combobox_section.aggiungi_alimento_dal_catalogo')}
        </label>
        {isAdmin && onCreateNew && (
          <button
            onClick={onCreateNew}
            className={cn(
              'flex min-h-[36px] touch-manipulation items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-all duration-200',
              'bg-orange-600 hover:bg-orange-700 active:bg-orange-800 dark:bg-orange-500 dark:hover:bg-orange-600 dark:active:bg-orange-700',
              darkModeClasses.interactive.button
            )}
            type="button"
          >
            <Plus className="h-3 w-3" />
            {t('nutrition.food_combobox_section.crea_nuovo')}
          </button>
        )}
      </div>
      <FoodCombobox
        onSelect={onSelect}
        placeholder={placeholder}
        noResultsMessage={noResultsMessage}
      />
      <p className={cn('mt-2 text-xs', darkModeClasses.text.muted)}>
        <span className="hidden sm:inline">
          {t('nutrition.food_combobox_section.digita_almeno_2_caratteri')}
        </span>
        {t('nutrition.food_combobox_section.usa_per_navigare_invio_per_selezionare')}
        {isAdmin && (
          <span className="hidden md:inline">
            {' '}
            {t('nutrition.food_combobox_section.oppure_clicca_quot_crea_nuovo_quot_per_a')}
          </span>
        )}
      </p>
    </div>
  );
}
