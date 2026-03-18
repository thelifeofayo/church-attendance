import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// Format with full day of week and ordinal date (e.g., "Sunday, 22nd March 2026")
export function formatDateWithDay(date: string | Date): string {
  const d = new Date(date);
  const day = d.getDate();
  const ordinal = getOrdinalSuffix(day);

  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    year: 'numeric',
  }).replace(/(\d+)/, `${day}${ordinal}`).replace(/,\s*/, `, ${day}${ordinal} `).split(',')[0] +
    `, ${day}${ordinal} ` +
    d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

// Get ordinal suffix for a number (1st, 2nd, 3rd, etc.)
function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

// Format for reports with full details (e.g., "Sunday, 22nd March 2026")
export function formatDateForReport(date: string | Date): string {
  const d = new Date(date);
  const day = d.getDate();
  const ordinal = getOrdinalSuffix(day);
  const weekday = d.toLocaleDateString('en-US', { weekday: 'long' });
  const month = d.toLocaleDateString('en-US', { month: 'long' });
  const year = d.getFullYear();

  return `${weekday}, ${day}${ordinal} ${month} ${year}`;
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getWeekStart(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getWeekEnd(date: Date = new Date()): Date {
  const start = getWeekStart(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}
