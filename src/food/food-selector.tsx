/**
 * Food Selector Component
 *
 * Autocomplete con search BM25 per selezione alimenti
 * Usato per aggiungere alimenti ai piani nutrizionali
 */

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, Loader2, X, Check } from 'lucide-react';
import type { FoodItem } from '@onecoach/types';
import { logger } from '@onecoach/lib-shared';
import { useTranslations } from 'next-intl';

export interface FoodSelectorProps {
  onSelect: (foodItem: FoodItem, quantity?: number) => void;
  placeholder?: string;
  className?: string;
  limit?: number;
}

export function FoodSelector({
  onSelect,
  placeholder,
  className = '',
  limit = 10,
}: FoodSelectorProps) {
  const t = useTranslations('common');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoodItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const searchFoods = useCallback(
    async (searchQuery: string) => {
      const t = useTranslations('common');
      if (!searchQuery.trim()) {
        setResults([]);
        setIsOpen(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/food/search?q=${encodeURIComponent(searchQuery)}&limit=${limit}`
        );

        if (!response.ok) {
          throw new Error(t('food.searchError'));
        }

        const data = await response.json();
        setResults(data.data || []);
        setIsOpen(true);
      } catch (error: unknown) {
        logger.error(t('error'), error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    },
    [limit, t]
  );

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchFoods(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, searchFoods]);

  const handleSelect = (foodItem: FoodItem) => {
    onSelect(foodItem);
    setQuery('');
    setResults([]);
    setIsOpen(false);
    searchRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          const selected = results[selectedIndex];
          if (selected) {
            handleSelect(selected);
          }
        }
        break;
      case 'Escape':
        setIsOpen(false);
        searchRef.current?.blur();
        break;
    }
  };

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && resultsRef.current) {
      const selectedElement = resultsRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-neutral-400 dark:text-neutral-600" />
        <input
          ref={searchRef}
          type="text"
          value={query}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setQuery(e.target.value);
            setSelectedIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0) {
              setIsOpen(true);
            }
          }}
          onBlur={() => {
            // Delay to allow click events
            setTimeout(() => setIsOpen(false), 200);
          }}
          placeholder={placeholder || t('food.searchPlaceholder')}
          className="w-full rounded-xl border border-neutral-300 bg-white py-3 pr-10 pl-10 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100 dark:text-neutral-600"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
              setIsOpen(false);
            }}
            className="absolute top-1/2 right-3 -translate-y-1/2 rounded p-1 text-neutral-400 hover:text-neutral-600 dark:text-neutral-400 dark:text-neutral-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isOpen && (
        <div
          ref={resultsRef}
          className="absolute z-50 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-neutral-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-900"
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-neutral-400 dark:text-neutral-600" />
            </div>
          ) : results.length === 0 ? (
            <div className="py-8 text-center text-sm text-neutral-500 dark:text-neutral-500">
              {t('empty.noFoods')}
            </div>
          ) : (
            <div className="py-2">
              {results.map((food, index) => (
                <button
                  key={food.id}
                  onClick={() => handleSelect(food)}
                  className={`w-full px-4 py-3 text-left transition-colors ${
                    index === selectedIndex
                      ? 'bg-blue-50'
                      : 'hover:bg-neutral-50 dark:bg-neutral-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-neutral-900 dark:text-neutral-100">
                        {food.name}
                      </div>
                      <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-500">
                        {food.macrosPer100g.calories} {t('common.food_selector.kcal_p')}
                        {food.macrosPer100g.protein}
                        {t('common.food_selector.g_c')}
                        {food.macrosPer100g.carbs}
                        {t('common.food_selector.g_f')}
                        {food.macrosPer100g.fats}g
                      </div>
                    </div>
                    {index === selectedIndex && <Check className="h-5 w-5 text-blue-600" />}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
