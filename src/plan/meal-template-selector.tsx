/**
 * Meal Template Selector
 *
 * Componente per visualizzare e selezionare template pasti salvati
 * Mobile-first, responsive, touch-friendly
 */

'use client';

import { useTranslations } from 'next-intl';
import { useCallback, useRef, useState, useEffect } from 'react';
import { Search, Loader2, Bookmark, Clock, X } from 'lucide-react';
import type { NutritionTemplate, Meal } from '@onecoach/types';
import { useDebounce } from '@onecoach/hooks';

interface MealTemplateSelectorProps {
  onSelect?: (template: NutritionTemplate & { type: 'meal' }) => void;
  onClose?: () => void;
  placeholder?: string;
  className?: string;
}

export function MealTemplateSelector({
  onSelect,
  onClose,
  placeholder,
  className = '',
}: MealTemplateSelectorProps) {
  const t = useTranslations('nutrition.templateSelector');
  const tCommon = useTranslations('common');
  const [searchQuery, setSearchQuery] = useState('');
  const [templates, setTemplates] = useState<(NutritionTemplate & { type: 'meal' })[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(true);

  const debouncedQuery = useDebounce(searchQuery, 300);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Carica template
  const loadTemplates = useCallback(
    async (query?: string) => {
      const t = useTranslations('nutrition');
      setIsLoading(true);
      setError(null);

      try {
        const url = new URL('/api/meal-templates', window.location.origin);
        if (query && query.length >= 2) {
          url.searchParams.set('search', query);
        }
        url.searchParams.set('limit', '20');

        const response = await fetch(url.toString());
        if (!response.ok) {
          throw new Error(t('common.errors.loadingTemplates'));
        }

        const data = await response.json();
        // Filtra solo template di tipo 'meal' e assicura che type sia 'meal'
        const mealTemplates = (data.templates || []).filter(
          (t: NutritionTemplate) => t.type === 'meal'
        ) as (NutritionTemplate & { type: 'meal' })[];
        setTemplates(mealTemplates);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : tCommon('errors.loadingError'));
        setTemplates([]);
      } finally {
        setIsLoading(false);
      }
    },
    [t]
  );

  // Carica template iniziali
  useEffect(() => {
    void loadTemplates();
  }, [loadTemplates]);

  // Ricerca con debounce
  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      void loadTemplates(debouncedQuery);
    } else if (debouncedQuery.length === 0) {
      void loadTemplates();
    }
  }, [debouncedQuery, loadTemplates]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < templates.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (templates[selectedIndex]) {
          handleSelect(templates[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setIsOpen(false);
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // handleSelect is a stable callback and doesn't need to be in dependencies
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, templates, selectedIndex, onClose]);

  // Scroll selected into view
  useEffect(() => {
    if (listRef.current && templates.length > 0) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex, templates]);

  const handleSelect = (template: NutritionTemplate & { type: 'meal' }) => {
    onSelect?.(template);
    setIsOpen(false);
    onClose?.();
  };

  const formatMacros = (meal: Meal) => {
    const { calories, protein, carbs, fats } = meal.totalMacros;
    return `${Math.round(calories)} kcal | P:${protein.toFixed(1)}g C:${carbs.toFixed(1)}g F:${fats.toFixed(1)}g`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center ${className}`}
      onClick={(e: React.MouseEvent<HTMLElement>) => {
        if (e.target === e.currentTarget) {
          setIsOpen(false);
          onClose?.();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-label={t('ariaLabel')}
    >
      <div
        className="animate-slide-up w-full max-w-2xl rounded-t-3xl bg-white shadow-2xl sm:max-h-[80vh] sm:rounded-2xl dark:bg-neutral-900"
        onClick={(e: React.MouseEvent<HTMLElement>) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-4 sm:px-6 dark:border-neutral-700 dark:bg-neutral-900">
          <div className="flex items-center gap-3">
            <Bookmark className="h-5 w-5 text-green-600 sm:h-6 sm:w-6" />
            <h3 className="text-lg font-semibold text-neutral-900 sm:text-xl dark:text-neutral-100">
              {t('title')}
            </h3>
          </div>
          <button
            onClick={() => {
              setIsOpen(false);
              onClose?.();
            }}
            className="flex min-h-[44px] min-w-[44px] flex-shrink-0 touch-manipulation items-center justify-center rounded-full border border-neutral-200 p-2 text-neutral-500 transition-all duration-200 hover:scale-105 hover:bg-neutral-100 active:scale-95 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-500"
            aria-label={tCommon('actions.close')}
            type="button"
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>

        {/* Search */}
        <div className="border-b border-neutral-200 px-4 py-3 sm:px-6 dark:border-neutral-700">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400 dark:text-neutral-600" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setSearchQuery(e.target.value);
                setSelectedIndex(0);
              }}
              placeholder={placeholder || t('searchPlaceholder')}
              className="min-h-[44px] w-full touch-manipulation rounded-lg border border-neutral-300 bg-white py-2.5 pr-4 pl-10 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-500/20 focus:outline-none dark:border-neutral-600 dark:bg-neutral-900"
              autoFocus
            />
            {isLoading && (
              <Loader2 className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin text-neutral-400 dark:text-neutral-600" />
            )}
          </div>
          {searchQuery.length > 0 && searchQuery.length < 2 && (
            <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-500">{t('minChars')}</p>
          )}
        </div>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto overscroll-contain px-4 py-4 sm:px-6">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {!error && templates.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bookmark className="mb-4 h-12 w-12 text-neutral-300" />
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                {searchQuery.length >= 2 ? t('noResults') : t('noTemplates')}
              </p>
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-500">
                {searchQuery.length >= 2 ? t('noResultsDetail') : t('noTemplatesDetail')}
              </p>
            </div>
          )}

          {!error && templates.length > 0 && (
            <div ref={listRef} className="space-y-2">
              {templates.map((template, index) => (
                <button
                  key={template.id}
                  onClick={() => handleSelect(template)}
                  className={`w-full touch-manipulation rounded-lg border-2 p-4 text-left transition-all duration-200 ${
                    index === selectedIndex
                      ? 'border-green-500 bg-green-50 shadow-md'
                      : 'border-neutral-200 bg-white hover:border-green-300 hover:bg-green-50/30 hover:shadow-sm active:scale-[0.98] dark:border-neutral-700 dark:bg-neutral-900'
                  }`}
                  type="button"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-base font-semibold text-neutral-900 sm:text-lg dark:text-neutral-100">
                        {template.name}
                      </h4>
                      {template.description && (
                        <p className="mt-1 line-clamp-2 text-sm text-neutral-600 dark:text-neutral-400">
                          {template.description}
                        </p>
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-neutral-500 dark:text-neutral-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(template.createdAt)}
                        </span>
                        <span className="font-medium text-green-600">
                          {formatMacros(template.data as Meal)}
                        </span>
                      </div>
                      {(template.data as Meal).foods &&
                        (template.data as Meal).foods.length > 0 && (
                          <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-500">
                            {t('foodCount', { count: (template.data as Meal).foods.length })}
                          </p>
                        )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {isLoading && templates.length === 0 && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-green-600" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
