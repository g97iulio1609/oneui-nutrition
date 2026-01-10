/**
 * Nutrition Plan Card Component
 *
 * Thin wrapper around ProgramCard for nutrition-specific configuration.
 * Follows DRY principle by using shared ProgramCard abstraction.
 */

'use client';

import { Apple, Calendar, Target, Eye, Edit, Trash2, Send, Copy } from 'lucide-react';
import { ProgramCard, type ProgramCardAction } from '@onecoach/ui';
import { useTranslations } from 'next-intl';
import type { NutritionPlan } from "@onecoach/types-nutrition";

interface NutritionPlanCardProps {
  plan: NutritionPlan;
  onDelete: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onDeploy?: (id: string, name: string) => void;
  onToggleSelect?: (id: string) => void;
  isSelected?: boolean;
  selectionMode?: boolean;
  className?: string;
}

export function NutritionPlanCard({
  plan,
  onDelete,
  onDuplicate,
  onDeploy,
  onToggleSelect,
  isSelected = false,
  selectionMode = false,
  className,
}: NutritionPlanCardProps) {
  const t = useTranslations('nutrition.card');

  // Build actions array
  const actions: ProgramCardAction[] = [
    {
      icon: <Eye className="h-4 w-4" />,
      title: t('actions.view'),
      colorOnHover: 'emerald',
    },
  ];

  if (onDeploy) {
    actions.push({
      icon: <Send className="h-3.5 w-3.5" />,
      title: t('actions.deploy'),
      colorOnHover: 'emerald',
      onClick: () => onDeploy(plan.id, plan.name),
    });
  }

  actions.push({
    icon: <Edit className="h-3.5 w-3.5" />,
    title: t('actions.edit'),
    colorOnHover: 'emerald',
    href: `/nutrition/${plan.id}/edit`,
  });

  if (onDuplicate) {
    actions.push({
      icon: <Copy className="h-3.5 w-3.5" />,
      title: t('actions.duplicate'),
      colorOnHover: 'blue',
      onClick: () => onDuplicate(plan.id),
    });
  }

  actions.push({
    icon: <Trash2 className="h-3.5 w-3.5" />,
    title: t('actions.delete'),
    colorOnHover: 'rose',
    onClick: () => onDelete(plan.id),
  });

  // Get badge from first goal

  const firstGoal = plan.goals?.[0] as string | undefined;
  const badge =
    firstGoal && ['WEIGHT_LOSS', 'MUSCLE_GAIN', 'MAINTENANCE', 'PERFORMANCE'].includes(firstGoal)
      ? t(`goals.${firstGoal}`)
      : firstGoal || t('badge.general');

  return (
    <ProgramCard
      id={plan.id}
      name={plan.name}
      description={plan.description}
      href={`/nutrition/${plan.id}`}
      badge={badge}
      icon={<Apple className="h-6 w-6" />}
      colorTheme="emerald"
      stats={[
        {
          icon: <Calendar className="h-3.5 w-3.5" />,
          label: t('stats.duration'),
          value: `${plan.durationWeeks} ${t('stats.weeks')}`,
        },
        {
          icon: <Target className="h-3.5 w-3.5" />,
          label: t('stats.calories'),
          value: `${Math.round(plan.targetMacros?.calories || 0)} kcal`,
        },
      ]}
      actions={actions}
      isSelected={isSelected}
      selectionMode={selectionMode}
      onToggleSelect={onToggleSelect}
      className={className}
    />
  );
}
