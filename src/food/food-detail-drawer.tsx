/**
 * FoodDetailDrawer
 *
 * Drawer laterale con i dettagli completi dell'alimento selezionato.
 * Mobile first, responsive, segue principi KISS, SOLID, DRY.
 */
'use client';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import type { FoodItem } from '@onecoach/types';
import { Button } from '@onecoach/ui-core';
import { Drawer } from '@onecoach/ui';
import {
  Edit3,
  Trash2,
  UtensilsCrossed,
  Package,
  Scan as Barcode,
  Camera,
  AlertCircle,
  Save,

} from 'lucide-react';
import { logger } from '@onecoach/lib-shared';
import type { Macros } from '@onecoach/types';
import { dialog } from '@onecoach/lib-stores';
import { LoadingIndicator } from '@onecoach/ui';
interface FoodDetailDrawerProps {
  isOpen: boolean;
  foodItemId?: string | null; // null per modalità create
  isLoading?: boolean;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onUpdate?: (updatedFood: FoodItem) => void;
  onCreate?: (newFood: FoodItem) => void;
}
interface UserProfile {
  role?: string;
}
export function FoodDetailDrawer({
  isOpen,
  foodItemId,
  isLoading = false,
  onClose,
  onEdit,
  onDelete,
  onUpdate,
  onCreate,
}: FoodDetailDrawerProps) {
  const isCreateMode = !foodItemId;
  const t = useTranslations('common');
  const [foodItem, setFoodItem] = useState<FoodItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
  const [isLoadingFood, setIsLoadingFood] = useState(false);
  const [isEditMode, setIsEditMode] = useState(isCreateMode); // In modalità create, parte già in edit
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [editForm, setEditForm] = useState<{
    name: string;
    macrosPer100g: Macros;
    servingSize?: number;
    unit: string;
    barcode?: string;
    metadata?: { brand?: string; category?: string; [key: string]: unknown };
    imageUrl?: string;
  } | null>(
    isCreateMode
      ? {
          name: '',
          macrosPer100g: { calories: 0, protein: 0, carbs: 0, fats: 0 },
          servingSize: 100,
          unit: 'g',
          barcode: undefined,
          metadata: undefined,
          imageUrl: undefined,
        }
      : null
  );
  // Verifica ruolo admin
  useEffect(() => {
    const checkAdmin = async () => {
      const t = useTranslations('common');
      try {
        const response = await fetch('/api/profile');
        if (response.ok) {
          const data = await response.json();
          const user: UserProfile = data?.profile?.user || {};
          setIsAdmin(user.role === 'ADMIN');
        }
      } catch (err: unknown) {
        logger.error(t('common.error'), err);
      } finally {
        setIsCheckingAdmin(false);
      }
    };
    void checkAdmin();
  }, [t]);
  // Load food item when foodItemId changes
  useEffect(() => {
    if (isCreateMode || !foodItemId) {
      setFoodItem(null);
      setError(null);
      setIsLoadingFood(false);
      return;
    }
    const loadFoodItem = async () => {
      const t = useTranslations('common');
      setIsLoadingFood(true);
      setError(null);
      try {
        const response = await fetch(`/api/food/${foodItemId}`);
        if (!response.ok) {
          throw new Error(t('errors.loadingError'));
        }
        const data = await response.json();
        setFoodItem(data.foodItem || data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : t('common.errors.loadingError'));
        setFoodItem(null);
      } finally {
        setIsLoadingFood(false);
      }
    };
    void loadFoodItem();
  }, [foodItemId, isCreateMode, t]);
  const handleEdit = () => {
    if (onEdit) {
      onEdit();
    } else if (foodItem) {
      setIsEditMode(true);
      // Assicurati che macrosPer100g includa tutti i campi, incluso fiber se presente
      const macros = {
        calories: foodItem.macrosPer100g.calories || 0,
        protein: foodItem.macrosPer100g.protein || 0,
        carbs: foodItem.macrosPer100g.carbs || 0,
        fats: foodItem.macrosPer100g.fats || 0,
        ...(foodItem.macrosPer100g.fiber !== undefined && {
          fiber: foodItem.macrosPer100g.fiber,
        }),
      };
      setEditForm({
        name: foodItem.name,
        macrosPer100g: macros,
        servingSize: foodItem.servingSize,
        unit: foodItem.unit || 'g',
        barcode: foodItem.barcode,
        metadata: foodItem.metadata ? { ...foodItem.metadata } : undefined,
        imageUrl: foodItem.imageUrl,
      });
    }
  };
  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditForm(null);
  };
  const handleSaveEdit = async () => {
    const t = useTranslations('common');
    if (!editForm) return;
    setIsSaving(true);
    setError(null);
    try {
      // Se è modalità create, usa POST
      if (isCreateMode) {
        const response = await fetch('/api/food', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editForm),
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || t('errors.createFailed'));
        }
        const data = await response.json();
        const newFood = data.foodItem;
        // Aggiorna stato con il nuovo alimento creato
        setFoodItem(newFood);
        setIsEditMode(false);
        setEditForm(null);
        setError(null);
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
        }, 3000);
        // Chiama callback dopo aver aggiornato lo stato
        if (onCreate) {
          onCreate(newFood);
        }
      } else if (foodItem) {
        // Modalità update
        const response = await fetch(`/api/food/${foodItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editForm),
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || t('common.errors.saveError'));
        }
        const data = await response.json();
        const updatedFood = data.foodItem;
        setFoodItem(updatedFood);
        setIsEditMode(false);
        setEditForm(null);
        setError(null);
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
        }, 3000);
        if (onUpdate) {
          onUpdate(updatedFood);
        }
      }
    } catch (_err: unknown) {
      setError(_err instanceof Error ? _err.message : t('common.errors.saveError'));
    } finally {
      setIsSaving(false);
    }
  };
  const handleDelete = async () => {
    const t = useTranslations('common');
    const confirmed = await dialog.confirm(t('confirmDeleteFood'));
    if (!confirmed) return;
    if (onDelete) {
      onDelete();
    } else if (foodItem) {
      try {
        const response = await fetch(`/api/food/${foodItem.id}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          throw new Error(t('errors.deleteFailed'));
        }
        await dialog.success(t('foodDeleted'));
        onClose();
      } catch (err: unknown) {
        await dialog.error(err instanceof Error ? err.message : t('errors.deleteFailed'));
      }
    }
  };
  if (isLoading || (isLoadingFood && !isCreateMode) || isCheckingAdmin) {
    return (
      <Drawer isOpen={isOpen} onClose={onClose} position="right" size="lg" mobileFullScreen>
        <div className="flex min-h-[300px] items-center justify-center">
          <LoadingIndicator message={t('loadingFood')} size="md" />
        </div>
      </Drawer>
    );
  }
  if (!isCreateMode && (error || !foodItem)) {
    return (
      <Drawer isOpen={isOpen} onClose={onClose} position="right" size="lg" mobileFullScreen>
        <div className="flex min-h-[300px] flex-col items-center justify-center px-6">
          <AlertCircle className="mb-4 h-12 w-12 text-red-500 dark:text-red-400" />
          <p className="text-center text-neutral-700 dark:text-neutral-300">
            {error || t('empty.noFood')}
          </p>
          <Button variant="outline" size="sm" onClick={onClose} className="mt-4">
            {t('actions.close')}
          </Button>
        </div>
      </Drawer>
    );
  }
  // Per modalità create, usa editForm. Per modalità view/edit, usa foodItem
  const macros =
    isEditMode && editForm
      ? editForm.macrosPer100g
      : foodItem?.macrosPer100g || { calories: 0, protein: 0, carbs: 0, fats: 0 };
  const displayName = isCreateMode ? 'Nuovo Alimento' : foodItem?.name || '';
  const renderContent = () => (
    <>
      {/* Admin Actions */}
      {isAdmin && (
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {isEditMode ? (
            <>
              <Button
                variant="secondary"
                size="sm"
                icon={isSaving ? undefined : Save}
                onClick={handleSaveEdit}
                disabled={isSaving}
                className="min-h-[44px] flex-1 touch-manipulation sm:flex-initial"
              >
                {isSaving ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    {isCreateMode ? t('common.actions.creating') : t('common.saving')}
                  </>
                ) : isCreateMode ? (
                  'Crea'
                ) : (
                  'Salva'
                )}
              </Button>
              {!isCreateMode && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="min-h-[44px] flex-1 touch-manipulation sm:flex-initial"
                >
                  Annulla
                </Button>
              )}
            </>
          ) : (
            <>
              <Button
                variant="secondary"
                size="sm"
                icon={Edit3}
                onClick={handleEdit}
                className="min-h-[44px] flex-1 touch-manipulation sm:flex-initial"
              >
                Modifica
              </Button>
              {(onDelete || foodItem) && (
                <Button
                  variant="danger"
                  size="sm"
                  icon={Trash2}
                  onClick={handleDelete}
                  className="min-h-[44px] flex-1 touch-manipulation sm:flex-initial"
                >
                  Elimina
                </Button>
              )}
            </>
          )}
        </div>
      )}
      {/* Success Message */}
      {showSuccess && (
        <div className="animate-fadeIn rounded-lg border border-green-200 bg-green-50 px-3 py-2.5 text-xs text-green-700 sm:px-4 sm:py-3 sm:text-sm">
          <div className="flex items-center gap-2">
            <span className="text-green-600">✓</span>
            <span>{isCreateMode ? t('food.createSuccess') : t('food.updateSuccess')}</span>
          </div>
        </div>
      )}
      {/* Error Message */}
      {error && (
        <div className="animate-fadeIn rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700 sm:px-4 sm:py-3 sm:text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 sm:h-4 sm:w-4" />
            <span className="break-words">{error}</span>
          </div>
        </div>
      )}
      {/* Macros Section */}
      <section className="rounded-xl border border-neutral-200 bg-white p-3 shadow-sm sm:p-4 dark:border-neutral-700 dark:bg-neutral-900">
        <h4 className="mb-2 flex items-center gap-2 text-xs font-semibold text-neutral-500 uppercase sm:mb-3 sm:text-sm dark:text-neutral-500">
          <UtensilsCrossed className="h-3.5 w-3.5 text-emerald-500 sm:h-4 sm:w-4" />
          {t('food.macros')}
        </h4>
        {isEditMode && editForm ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
            <div className="space-y-1">
              <label className="text-xs text-emerald-600 sm:text-sm">{t('food.calories')}</label>
              <input
                type="number"
                value={editForm.macrosPer100g.calories}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditForm({
                    ...editForm,
                    macrosPer100g: {
                      ...editForm.macrosPer100g,
                      calories: Number(e.target.value),
                    },
                  })
                }
                className="min-h-[44px] w-full touch-manipulation rounded border-neutral-300 px-2 text-sm dark:border-neutral-600"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-blue-600 sm:text-sm">
                {t('food.protein')} {t('common.food_detail_drawer.g')}
              </label>
              <input
                type="number"
                step="0.1"
                value={editForm.macrosPer100g.protein}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditForm({
                    ...editForm,
                    macrosPer100g: {
                      ...editForm.macrosPer100g,
                      protein: Number(e.target.value),
                    },
                  })
                }
                className="min-h-[44px] w-full touch-manipulation rounded border-neutral-300 px-2 text-sm dark:border-neutral-600"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-amber-600 sm:text-sm">
                {t('food.carbs')} {t('common.food_detail_drawer.g')}
              </label>
              <input
                type="number"
                step="0.1"
                value={editForm.macrosPer100g.carbs}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditForm({
                    ...editForm,
                    macrosPer100g: {
                      ...editForm.macrosPer100g,
                      carbs: Number(e.target.value),
                    },
                  })
                }
                className="min-h-[44px] w-full touch-manipulation rounded border-neutral-300 px-2 text-sm dark:border-neutral-600"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-purple-600 sm:text-sm">
                {t('food.fats')} {t('common.food_detail_drawer.g')}
              </label>
              <input
                type="number"
                step="0.1"
                value={editForm.macrosPer100g.fats}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditForm({
                    ...editForm,
                    macrosPer100g: {
                      ...editForm.macrosPer100g,
                      fats: Number(e.target.value),
                    },
                  })
                }
                className="min-h-[44px] w-full touch-manipulation rounded border-neutral-300 px-2 text-sm dark:border-neutral-600"
              />
            </div>
            {(foodItem?.macrosPer100g?.fiber !== undefined ||
              editForm.macrosPer100g.fiber !== undefined) && (
              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs text-neutral-600 sm:text-sm dark:text-neutral-400">
                  {t('food.fiber')} {t('common.food_detail_drawer.g')}
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={editForm.macrosPer100g.fiber || 0}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditForm({
                      ...editForm,
                      macrosPer100g: {
                        ...editForm.macrosPer100g,
                        fiber: Number(e.target.value) || undefined,
                      },
                    })
                  }
                  className="min-h-[44px] w-full touch-manipulation rounded border-neutral-300 px-2 text-sm dark:border-neutral-600"
                />
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
            <div className="rounded-lg bg-emerald-50 p-2.5 sm:p-3">
              <div className="text-xs text-emerald-600 sm:text-sm">Calorie</div>
              <div className="mt-1 text-base font-bold text-emerald-700 sm:text-lg md:text-xl">
                {Math.round(macros.calories)}
              </div>
              <div className="text-xs text-emerald-600">kcal</div>
            </div>
            <div className="rounded-lg bg-blue-50 p-2.5 sm:p-3">
              <div className="text-xs text-blue-600 sm:text-sm">Proteine</div>
              <div className="mt-1 text-base font-bold text-blue-700 sm:text-lg md:text-xl">
                {macros.protein.toFixed(1)}g
              </div>
            </div>
            <div className="rounded-lg bg-amber-50 p-2.5 sm:p-3">
              <div className="text-xs text-amber-600 sm:text-sm">Carboidrati</div>
              <div className="mt-1 text-base font-bold text-amber-700 sm:text-lg md:text-xl">
                {macros.carbs.toFixed(1)}g
              </div>
            </div>
            <div className="rounded-lg bg-purple-50 p-2.5 sm:p-3">
              <div className="text-xs text-purple-600 sm:text-sm">Grassi</div>
              <div className="mt-1 text-base font-bold text-purple-700 sm:text-lg md:text-xl">
                {macros.fats.toFixed(1)}g
              </div>
            </div>
          </div>
        )}
        {macros.fiber !== undefined && !isEditMode && (
          <div className="mt-3 rounded-lg bg-neutral-50 p-2 dark:bg-neutral-800/50">
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-600 dark:text-neutral-400">Fibre</span>
              <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                {macros.fiber.toFixed(1)}g
              </span>
            </div>
          </div>
        )}
      </section>
      {/* Serving Size */}
      {(foodItem?.servingSize || isEditMode) && (
        <section className="rounded-xl border border-neutral-200 bg-white p-3 shadow-sm sm:p-4 dark:border-neutral-700 dark:bg-neutral-900">
          <h4 className="mb-2 flex items-center gap-2 text-xs font-semibold text-neutral-500 uppercase sm:text-sm dark:text-neutral-500">
            <Package className="h-3.5 w-3.5 text-blue-500 sm:h-4 sm:w-4" />
            {t('food.portion')}
          </h4>
          {isEditMode && editForm ? (
            <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
              <div className="space-y-1">
                <label className="text-xs text-neutral-600 sm:text-sm dark:text-neutral-400">
                  {t('food.size')}
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={editForm.servingSize || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditForm({
                      ...editForm,
                      servingSize: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  className="min-h-[44px] w-full touch-manipulation rounded border-neutral-300 px-2 text-sm dark:border-neutral-600"
                  placeholder="100"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-neutral-600 sm:text-sm dark:text-neutral-400">
                  {t('food.unit')}
                </label>
                <input
                  type="text"
                  value={editForm.unit}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditForm({ ...editForm, unit: e.target.value })
                  }
                  className="min-h-[44px] w-full touch-manipulation rounded border-neutral-300 px-2 text-sm dark:border-neutral-600"
                  placeholder="g"
                />
              </div>
            </div>
          ) : (
            <div className="text-sm text-neutral-700 sm:text-base dark:text-neutral-300">
              <span className="font-semibold">{foodItem?.servingSize}</span>
              <span className="ml-1 text-neutral-500 dark:text-neutral-500">
                {foodItem?.unit || 'g'}
              </span>
            </div>
          )}
        </section>
      )}
      {/* Name & Metadata */}
      <section className="grid gap-2 sm:grid-cols-2 sm:gap-3">
        {isEditMode && editForm ? (
          <>
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-semibold text-neutral-500 uppercase sm:text-sm dark:text-neutral-500">
                {t('food.name')}
              </label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
                className="min-h-[44px] w-full touch-manipulation rounded border-neutral-300 px-2 text-sm dark:border-neutral-600"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-500 uppercase sm:text-sm dark:text-neutral-500">
                {t('food.barcode')}
              </label>
              <input
                type="text"
                value={editForm.barcode || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditForm({ ...editForm, barcode: e.target.value || undefined })
                }
                className="min-h-[44px] w-full touch-manipulation rounded border-neutral-300 px-2 text-sm dark:border-neutral-600"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-500 uppercase sm:text-sm dark:text-neutral-500">
                {t('food.brand')}
              </label>
              <input
                type="text"
                value={editForm.metadata?.brand || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditForm({
                    ...editForm,
                    metadata: {
                      ...editForm.metadata,
                      brand: e.target.value || undefined,
                    },
                  })
                }
                className="min-h-[44px] w-full touch-manipulation rounded border-neutral-300 px-2 text-sm dark:border-neutral-600"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-500 uppercase sm:text-sm dark:text-neutral-500">
                {t('food.category')}
              </label>
              <input
                type="text"
                value={editForm.metadata?.category || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditForm({
                    ...editForm,
                    metadata: {
                      ...editForm.metadata,
                      category: e.target.value || undefined,
                    },
                  })
                }
                className="min-h-[44px] w-full touch-manipulation rounded border-neutral-300 px-2 text-sm dark:border-neutral-600"
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-semibold text-neutral-500 uppercase sm:text-sm dark:text-neutral-500">
                {t('food.image')}
              </label>
              <input
                type="url"
                value={editForm.imageUrl || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditForm({ ...editForm, imageUrl: e.target.value || undefined })
                }
                className="min-h-[44px] w-full touch-manipulation rounded border-neutral-300 px-2 text-sm dark:border-neutral-600"
                placeholder="https://..."
              />
            </div>
          </>
        ) : (
          <>
            {foodItem?.metadata?.brand && (
              <div className="rounded-xl border border-neutral-200 bg-white p-3 shadow-sm sm:p-4 dark:border-neutral-700 dark:bg-neutral-900">
                <h4 className="mb-2 text-xs font-semibold text-neutral-500 uppercase sm:text-sm dark:text-neutral-500">
                  {t('food.brand')}
                </h4>
                <p className="text-sm text-neutral-700 sm:text-base dark:text-neutral-300">
                  {String(foodItem.metadata.brand)}
                </p>
              </div>
            )}
            {foodItem?.metadata?.category && (
              <div className="rounded-xl border border-neutral-200 bg-white p-3 shadow-sm sm:p-4 dark:border-neutral-700 dark:bg-neutral-900">
                <h4 className="mb-2 text-xs font-semibold text-neutral-500 uppercase sm:text-sm dark:text-neutral-500">
                  {t('food.category')}
                </h4>
                <p className="text-sm text-neutral-700 sm:text-base dark:text-neutral-300">
                  {foodItem.metadata.category}
                </p>
              </div>
            )}
          </>
        )}
      </section>
      {/* Barcode */}
      {!isEditMode && foodItem?.barcode && (
        <section className="rounded-xl border border-neutral-200 bg-white p-3 shadow-sm sm:p-4 dark:border-neutral-700 dark:bg-neutral-900">
          <h4 className="mb-2 flex items-center gap-2 text-xs font-semibold text-neutral-500 uppercase sm:text-sm dark:text-neutral-500">
            <Barcode className="h-3.5 w-3.5 text-neutral-500 sm:h-4 sm:w-4 dark:text-neutral-500" />
            {t('food.barcode')}
          </h4>
          <p className="font-mono text-xs break-all text-neutral-700 sm:text-sm md:text-base dark:text-neutral-300">
            {foodItem.barcode}
          </p>
        </section>
      )}
      {/* Image */}
      {foodItem?.imageUrl && (
        <section className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 sm:p-4 dark:border-neutral-700 dark:bg-neutral-800/50">
          <h4 className="mb-2 flex items-center gap-2 text-xs font-semibold text-neutral-500 uppercase sm:mb-3 sm:text-sm dark:text-neutral-500">
            <Camera className="h-3.5 w-3.5 text-purple-500 sm:h-4 sm:w-4" />
            {t('food.image')}
          </h4>
          <a
            href={foodItem.imageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block overflow-hidden rounded-lg border border-neutral-200 bg-white transition-transform hover:scale-105 active:scale-100 dark:border-neutral-700 dark:bg-neutral-900"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={foodItem.imageUrl}
              alt={foodItem?.name || 'Alimento'}
              className="h-auto w-full object-cover"
              loading="lazy"
            />
          </a>
          <a
            href={foodItem.imageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex min-h-[44px] touch-manipulation items-center justify-center gap-2 rounded-lg bg-purple-50 px-3 py-2.5 text-xs font-semibold text-purple-600 transition-colors hover:bg-purple-100 active:bg-purple-200 sm:text-sm"
          >
            {t('food.openImage')}
          </a>
        </section>
      )}
      {/* Timestamps - Solo per admin e non in modalità create */}
      {isAdmin && !isCreateMode && foodItem && (
        <section className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-xs text-neutral-500 sm:p-4 sm:text-sm dark:border-neutral-700 dark:bg-neutral-800/50 dark:text-neutral-500">
          <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
            <div>
              <span className="font-medium">{t('food.created')}:</span>{' '}
              {new Date(foodItem.createdAt).toLocaleString('it-IT')}
            </div>
            <div>
              <span className="font-medium">{t('food.updated')}:</span>{' '}
              {new Date(foodItem.updatedAt).toLocaleString('it-IT')}
            </div>
          </div>
        </section>
      )}
    </>
  );
  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={displayName}
      position="right"
      size="lg"
      mobileFullScreen
    >
      {isAdmin && !isCreateMode && foodItem && (
        <p className="mb-2 text-xs text-neutral-500 sm:text-sm dark:text-neutral-500">
          {t('common.food_detail_drawer.id')}
          {foodItem.id}
        </p>
      )}
      {renderContent()}
    </Drawer>
  );
}
