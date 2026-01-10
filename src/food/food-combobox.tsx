'use client';



import { useCallback, useEffect, useRef, useState } from 'react';
import { Search, Loader2, X, Check } from 'lucide-react';
import { useDebounce } from '@onecoach/hooks';
import type { FoodItem } from "@onecoach/types-nutrition";

interface FoodComboboxProps {
  onSelect?: (food: FoodItem) => void;
  placeholder?: string;
  locale?: string;
  limit?: number;
  className?: string;
  autoFocus?: boolean;
  noResultsMessage?: string;
}

function detectBrowserLocale(): string {
  if (typeof navigator === 'undefined') return 'it';
  const browserLocale = navigator.language || navigator.languages?.[0];
  return (browserLocale ?? 'it').toLowerCase().split('-')[0] ?? 'it';
}

export function FoodCombobox({
  onSelect,
  placeholder = 'Cerca alimento per nome o marca... ',
  locale,
  limit = 10,
  className = '',
  autoFocus = false,
  noResultsMessage = 'Nessun alimento trovato. Prova un altro termine.',
}: FoodComboboxProps) {
  const [internalValue, setInternalValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<FoodItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(internalValue, 300);

  const detectedLocale = locale || detectBrowserLocale();

  const fetchResults = useCallback(
    async (query: string) => {
      if (query.length < 2) {
        setResults([]);
        setIsOpen(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        params.set('q', query);
        params.set('locale', detectedLocale);
        params.set('limit', String(limit));

        const response = await fetch(`/api/food/search?${params.toString()}`);
        if (!response.ok) throw new Error('Errore ricerca alimenti');
        const data = await response.json();
        const foods: FoodItem[] = data.results || data.data || [];
        setResults(foods);
        setIsOpen(true);
        setSelectedIndex(0);
      } catch (_err: unknown) {
        setError(_err instanceof Error ? _err.message : 'Errore ricerca');
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    },
    [detectedLocale, limit]
  );

  useEffect(() => {
    if (debouncedQuery) {
      void fetchResults(debouncedQuery);
    } else {
      setResults([]);
      setIsOpen(false);
    }
  }, [debouncedQuery, fetchResults]);

  const handleSelect = (food: FoodItem) => {
    if (onSelect) onSelect(food);
    setInternalValue('');
    setResults([]);
    setIsOpen(false);
    setSelectedIndex(0);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      if (isOpen && results.length > 0 && results[selectedIndex]) {
        event.preventDefault();
        handleSelect(results[selectedIndex]);
        return;
      }
    }

    if (!isOpen || results.length === 0) {
      if (event.key === 'Escape') {
        event.preventDefault();
        setIsOpen(false);
      }
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % results.length);
        break;
      case 'ArrowUp':
        event.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
        break;
      case 'Escape':
        event.preventDefault();
        setIsOpen(false);
        break;
    }
  };

  useEffect(() => {
    if (listRef.current && isOpen) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement && typeof selectedElement.scrollIntoView === 'function') {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex, isOpen]);

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400 dark:text-neutral-600" />
        <input
          ref={inputRef}
          type="text"
          value={internalValue}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInternalValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 pr-9 pl-9 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:outline-none dark:border-neutral-600"
          aria-label="Search foods"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls="food-listbox"
          role="combobox"
        />
        {isLoading && (
          <Loader2 className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin text-neutral-400 dark:text-neutral-600" />
        )}
        {!isLoading && internalValue && (
          <button
            onClick={() => {
              setInternalValue('');
              setResults([]);
              setIsOpen(false);
              inputRef.current?.focus();
            }}
            className="absolute top-1/2 right-3 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:text-neutral-400 dark:text-neutral-600"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div
          ref={listRef}
          id="food-listbox"
          role="listbox"
          className="absolute z-50 mt-1 max-h-80 w-full overflow-auto rounded-lg border border-neutral-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-900"
        >
          {results.map((food, index) => (
            <button
              key={food.id}
              role="option"
              aria-selected={index === selectedIndex}
              onClick={() => handleSelect(food)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`flex w-full items-start gap-3 border-b border-neutral-100 px-4 py-3 text-left transition-colors last:border-b-0 ${
                index === selectedIndex
                  ? 'bg-green-50 text-green-900'
                  : 'text-neutral-900 hover:bg-neutral-50 dark:bg-neutral-800/50 dark:text-neutral-100'
              }`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{food.name}</span>
                  {!!food.metadata?.brand && (
                    <span className="text-xs text-neutral-500 dark:text-neutral-500">
                      {String(food.metadata.brand)}
                    </span>
                  )}
                </div>
                <div className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                  {Math.round(food.macrosPer100g.calories)} kcal/100g · P:
                  {food.macrosPer100g.protein}g · C:
                  {food.macrosPer100g.carbs}g · F:
                  {food.macrosPer100g.fats}g
                </div>
                {food.servingSize && (
                  <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-500">
                    Serving:
                    {food.servingSize}
                    {food.unit || 'g'}
                  </div>
                )}
              </div>
              {index === selectedIndex && (
                <Check className="h-4 w-4 flex-shrink-0 text-green-600" />
              )}
            </button>
          ))}
        </div>
      )}

      {error && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {isOpen && debouncedQuery.length >= 2 && results.length === 0 && !isLoading && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-500 shadow-lg dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-500">
          {noResultsMessage}
        </div>
      )}
    </div>
  );
}

export default FoodCombobox;
