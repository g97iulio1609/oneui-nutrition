/**
 * Templates List Component
 *
 * Lista completa dei template nutrizionali dell'utente con filtri avanzati
 * Mobile-first, responsive, touch-friendly
 * Segue principi KISS, DRY, SOLID
 */

'use client';

import { useCallback, useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import {
  Search,
  Loader2,
  X,
  Filter,
  UtensilsCrossed,
  Calendar,
  CalendarDays,
  Trash2,
  Edit3,
  Bookmark,
  Clock,
} from 'lucide-react';
import { darkModeClasses, cn } from '@onecoach/lib-design-system';
import { useDebounce } from '@onecoach/hooks';
import type { NutritionTemplate, NutritionTemplateType } from "@onecoach/types-nutrition";

interface TemplatesListProps {
  onSelect?: (template: NutritionTemplate) => void;
  onEdit?: (template: NutritionTemplate) => void;
  onDelete?: (template: NutritionTemplate) => void;
  onClose?: () => void;
}

const TYPE_ICONS = {
  meal: UtensilsCrossed,
  day: Calendar,
  week: CalendarDays,
};

export function TemplatesList({ onSelect, onEdit, onDelete, onClose }: TemplatesListProps) {
  const t = useTranslations('nutrition.templates');
  const tCommon = useTranslations('common');
  const locale = useLocale();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<NutritionTemplateType | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'createdAt' | 'lastUsedAt' | 'usageCount' | 'name'>(
    'lastUsedAt'
  );
  const [templates, setTemplates] = useState<NutritionTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);

  const debouncedQuery = useDebounce(searchQuery, 300);

  // Load categories from API
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await fetch('/api/nutrition-templates/categories');
        if (response.ok) {
          const data = await response.json();
          setCategories(data.categories || []);
        }
      } catch (_error: unknown) {
        // Fallback to empty array
        setCategories([]);
      }
    };
    void loadCategories();
  }, []);

  // Carica template
  const loadTemplates = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (selectedType !== 'all') {
        params.set('type', selectedType);
      }
      if (selectedCategory !== 'all') {
        params.set('category', selectedCategory);
      }
      if (debouncedQuery.trim()) {
        params.set('search', debouncedQuery.trim());
      }
      params.set('sortBy', sortBy);
      params.set('sortOrder', 'desc');

      const response = await fetch(`/api/nutrition-templates?${params.toString()}`);

      if (!response.ok) {
        throw new Error(tCommon('error'));
      }

      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : tCommon('error'));
      setTemplates([]);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedQuery, selectedType, selectedCategory, sortBy, tCommon]);

  useEffect(() => {
    void loadTemplates();
  }, [loadTemplates]);

  const handleDelete = async (template: NutritionTemplate) => {
    const t = useTranslations('nutrition');
    const { dialog } = await import('@onecoach/lib-stores');
    const confirmed = await dialog.confirm(t('confirmDelete', { name: template.name }));
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/nutrition-templates/${template.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(t('deleteError'));
      }

      // Ricarica lista
      void loadTemplates();

      if (onDelete) {
        onDelete(template);
      }
    } catch (err: unknown) {
      await dialog.error(err instanceof Error ? err.message : t('deleteError'));
    }
  };

  const getTypeIcon = (templateType: NutritionTemplateType) => {
    const Icon = TYPE_ICONS[templateType];
    return Icon ? <Icon className="h-4 w-4" /> : null;
  };

  return (
    <div className="w-full">
      {/* Header */}
      {onClose && (
        <div className="mb-4 flex items-center justify-between">
          <h2 className={cn('text-xl font-semibold', darkModeClasses.text.primary)}>
            {t('myTemplates')}
          </h2>
          <button
            onClick={onClose}
            className={cn(
              'flex min-h-[44px] min-w-[44px] flex-shrink-0 touch-manipulation items-center justify-center rounded-full border p-2 transition-all duration-200 hover:scale-105 active:scale-95',
              darkModeClasses.border.base,
              darkModeClasses.bg.elevated,
              darkModeClasses.text.muted,
              darkModeClasses.interactive.hover
            )}
            aria-label={tCommon('actions.close')}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Search and Filters */}
      <div
        className={cn(
          'mb-4 space-y-3 rounded-lg border p-3 sm:p-4',
          darkModeClasses.border.base,
          darkModeClasses.bg.subtle
        )}
      >
        <div className="relative">
          <Search
            className={cn(
              'absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2',
              darkModeClasses.text.tertiary
            )}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className={cn(
              'min-h-[44px] w-full touch-manipulation rounded-lg border py-2.5 pr-4 pl-10 text-sm focus:ring-2 focus:outline-none',
              darkModeClasses.input.base,
              'focus:border-green-500 focus:ring-green-500/20 dark:focus:border-green-400 dark:focus:ring-green-900/50'
            )}
          />
        </div>

        {/* Type Filter */}
        <div className="flex items-center gap-2 overflow-x-auto">
          <Filter className={cn('h-4 w-4 flex-shrink-0', darkModeClasses.text.muted)} />
          <button
            onClick={() => setSelectedType('all')}
            className={`min-h-[32px] flex-shrink-0 touch-manipulation rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              selectedType === 'all'
                ? 'bg-green-600 text-white'
                : 'bg-white text-neutral-700 hover:bg-neutral-100 dark:bg-neutral-800 dark:bg-neutral-900 dark:text-neutral-300'
            }`}
            type="button"
          >
            {t('type.all')}
          </button>
          {(['meal', 'day', 'week'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`flex min-h-[32px] flex-shrink-0 touch-manipulation items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                selectedType === type
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-neutral-700 hover:bg-neutral-100 dark:bg-neutral-800 dark:bg-neutral-900 dark:text-neutral-300'
              }`}
              type="button"
            >
              {getTypeIcon(type)}
              {t(`type.${type}`)}
            </button>
          ))}
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`min-h-[32px] flex-shrink-0 touch-manipulation rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-neutral-700 hover:bg-neutral-100 dark:bg-neutral-800 dark:bg-neutral-900 dark:text-neutral-300'
            }`}
            type="button"
          >
            {t('category.all')}
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`min-h-[32px] flex-shrink-0 touch-manipulation rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-neutral-700 hover:bg-neutral-100 dark:bg-neutral-800 dark:bg-neutral-900 dark:text-neutral-300'
              }`}
              type="button"
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <label className={cn('text-xs font-medium', darkModeClasses.text.secondary)}>
            {t('sort.label')}
          </label>
          <select
            value={sortBy}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setSortBy(e.target.value as 'createdAt' | 'lastUsedAt' | 'usageCount' | 'name')
            }
            className={cn(
              'min-h-[32px] flex-1 touch-manipulation rounded-lg border px-3 py-1.5 text-xs focus:ring-2 focus:outline-none',
              darkModeClasses.input.base,
              'focus:border-green-500 focus:ring-green-500/20 dark:focus:border-green-400 dark:focus:ring-green-900/50'
            )}
          >
            <option value="lastUsedAt">{t('sort.recent')}</option>
            <option value="usageCount">{t('sort.used')}</option>
            <option value="createdAt">{t('sort.created')}</option>
            <option value="name">{t('sort.name')}</option>
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-green-600" />
            <span className={cn('ml-3 text-sm', darkModeClasses.text.tertiary)}>
              {tCommon('loading')}
            </span>
          </div>
        ) : error ? (
          <div className="py-12 text-center">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        ) : templates.length === 0 ? (
          <div className="py-12 text-center">
            <Bookmark className="mx-auto h-12 w-12 text-neutral-300" />
            <p className={cn('mt-3 text-sm', darkModeClasses.text.tertiary)}>
              {searchQuery || selectedType !== 'all' || selectedCategory !== 'all'
                ? t('notFound')
                : t('empty')}
            </p>
          </div>
        ) : (
          templates.map((template) => {
            const t = useTranslations('nutrition');
            const TypeIcon = TYPE_ICONS[template.type];

            return (
              <div
                key={template.id}
                className={cn(
                  'group rounded-lg border p-4 shadow-sm transition-all duration-200 hover:shadow-md',
                  darkModeClasses.card.base,
                  'hover:border-green-300 dark:hover:border-green-500'
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 rounded-lg bg-green-100 p-2 text-green-700">
                    {TypeIcon && <TypeIcon className="h-5 w-5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
                          {template.name}
                        </h3>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="flex-shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                            {t(`type.${template.type}`)}
                          </span>
                          {template.category && (
                            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                              {template.category}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {onSelect && (
                          <button
                            onClick={() => onSelect(template)}
                            className="flex min-h-[44px] min-w-[44px] touch-manipulation items-center justify-center rounded-lg p-2 text-green-600 hover:bg-green-50"
                            title={tCommon('actions.use')}
                            type="button"
                          >
                            <Bookmark className="h-4 w-4" />
                          </button>
                        )}
                        {onEdit && (
                          <button
                            onClick={() => onEdit(template)}
                            className="flex min-h-[44px] min-w-[44px] touch-manipulation items-center justify-center rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                            title={tCommon('actions.edit')}
                            type="button"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => handleDelete(template)}
                            className="flex min-h-[44px] min-w-[44px] touch-manipulation items-center justify-center rounded-lg p-2 text-red-600 hover:bg-red-50"
                            title={tCommon('actions.delete')}
                            type="button"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    {template.description && (
                      <p className="mt-2 line-clamp-2 text-sm text-neutral-600 dark:text-neutral-400">
                        {template.description}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-neutral-500 dark:text-neutral-500">
                      {template.usageCount > 0 && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {t('usageCount', { count: template.usageCount })}
                        </span>
                      )}
                      {template.lastUsedAt && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(template.lastUsedAt).toLocaleDateString(locale, {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      )}
                      <span className="text-neutral-400 dark:text-neutral-600">•</span>
                      <span>
                        {t('createdOn')}{' '}
                        {new Date(template.createdAt).toLocaleDateString(locale, {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    {template.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {template.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
