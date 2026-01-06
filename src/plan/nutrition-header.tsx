'use client';

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

interface NutritionHeaderProps {
  title: string;
  subtitle?: string;
  backUrl?: string;
  backLabel?: string;
  actions?: React.ReactNode;
}

export function NutritionHeader({
  title,
  subtitle,
  backUrl,
  backLabel = 'Indietro',
  actions,
}: NutritionHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
      <div className="flex-1">
        {backUrl && (
          <Link
            href={backUrl}
            className="mb-6 flex items-center gap-2 text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
            {backLabel}
          </Link>
        )}

        <h1 className="text-4xl font-extrabold tracking-tight text-neutral-900 sm:text-5xl dark:text-white">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-neutral-600 dark:text-neutral-300">
            {subtitle}
          </p>
        )}
      </div>

      {actions && <div className="flex gap-3">{actions}</div>}
    </div>
  );
}
