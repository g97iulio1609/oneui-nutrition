'use client';

import { useTranslations } from 'next-intl';
/**
 * Modal di import AI per Nutrizione (riusa il generic ImportModal)
 */

import { ImportModal } from '@onecoach/ui';

type NutritionImportModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (planId?: string) => void | Promise<void>;
};

export function NutritionImportModal({ isOpen, onClose, onSuccess }: NutritionImportModalProps) {
  const t = useTranslations('nutrition');

  return (
    <ImportModal
      isOpen={isOpen}
      onClose={onClose}
      endpoint="/api/nutrition/import"
      title={t('nutrition_import_modal.importa_piano_nutrizionale_ai')}
      description={t('nutrition_import_modal.carica_pdf_docx_immagini_o_csv_xlsx_l_ai')}
      buildPayload={(files: any[]) => ({
        files,
        options: { mode: 'auto' },
      })}
      onSuccess={async (res: any) => {
        if (onSuccess) {
          await onSuccess((res as { planId?: string })?.planId);
        }
      }}
    />
  );
}
