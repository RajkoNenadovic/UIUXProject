import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

// All dates, numbers, lists and sorting go through Intl. Never build them with string concatenation.
// English uses en-GB (24-hour clock, day/month/year) because the audience is in Croatia.
const INTL_LOCALES = { en: 'en-GB', es: 'es-ES', hr: 'hr-HR' };
const RELATIVE_UNITS = [['year', 31536000], ['month', 2592000], ['day', 86400], ['hour', 3600], ['minute', 60]];

// SQLite CURRENT_TIMESTAMP is UTC without a zone marker ("2026-11-14 18:30:00").
// Parse it as UTC so the browser can display it in the user's own time zone.
export function parseUtc(value) {
  if (value instanceof Date) return value;
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)) {
    return new Date(`${value.replace(' ', 'T')}Z`);
  }
  return new Date(value);
}

export function createFormatters(appLocale) {
  const locale = INTL_LOCALES[appLocale] || appLocale;
  const dateShort = new Intl.DateTimeFormat(locale, { dateStyle: 'short' });
  const dateLong = new Intl.DateTimeFormat(locale, { dateStyle: 'full' });
  const timeShort = new Intl.DateTimeFormat(locale, { timeStyle: 'short' });
  const relativeTime = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const numberPlain = new Intl.NumberFormat(locale);
  const numberDecimal = new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const numberPercent = new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 1 });
  const numberCurrency = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' });
  const listFormat = new Intl.ListFormat(locale, { style: 'long', type: 'conjunction' });
  const collator = new Intl.Collator(locale);

  return {
    locale,
    shortDate: (value) => dateShort.format(parseUtc(value)),
    longDate: (value) => dateLong.format(parseUtc(value)),
    time: (value) => timeShort.format(parseUtc(value)),
    relative(value, now = Date.now()) {
      const seconds = Math.round((parseUtc(value).getTime() - now) / 1000);
      for (const [unit, size] of RELATIVE_UNITS) {
        if (Math.abs(seconds) >= size) return relativeTime.format(Math.trunc(seconds / size), unit);
      }
      return relativeTime.format(0, 'second');
    },
    number: (value) => numberPlain.format(value),
    decimal: (value) => numberDecimal.format(value),
    percent: (value) => numberPercent.format(value),
    currency: (value) => numberCurrency.format(value),
    list: (items) => listFormat.format(items),
    // Locale-aware sort: in Croatian Č, Ć, Š, Ž and Đ sort as letters of their own, not after Z.
    compare: (a, b) => collator.compare(a, b),
    sort: (items) => [...items].sort(collator.compare),
    // Diacritic-insensitive text for search, so "skola" finds "Škola" and "dacki" finds "Đački".
    fold: (text) => text
      .toLocaleLowerCase(locale)
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .replace(/đ/g, 'd')
  };
}

export function useFormat() {
  const { i18n } = useTranslation();
  const language = i18n.resolvedLanguage || i18n.language || 'en';
  return useMemo(() => createFormatters(language), [language]);
}
