import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Junta classes condicionais e resolve conflitos do Tailwind (a última vence). */
export function cn(...entradas) {
  return twMerge(clsx(entradas));
}
