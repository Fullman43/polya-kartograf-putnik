import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function translateWorkType(workType: string): string {
  const translations: Record<string, string> = {
    'repair': 'Ремонт',
    'diagnostics': 'Диагностика',
    'installation': 'Установка',
    'mounting': 'Монтаж',
    'maintenance': 'Обслуживание',
    'consultation': 'Консультация',
    'inspection': 'Осмотр',
    'configuration': 'Настройка'
  };
  return translations[workType.toLowerCase()] || workType;
}
