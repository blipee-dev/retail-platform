import { format, toZonedTime, fromZonedTime } from 'date-fns-tz';
import { format as baseFormat, parseISO } from 'date-fns';
import { enUS, pt, es } from 'date-fns/locale';

// Timezone abbreviation mapping
const timezoneAbbreviations: Record<string, string> = {
  'Europe/Lisbon': 'WEST',
  'Europe/London': 'BST',
  'Europe/Paris': 'CEST',
  'Europe/Berlin': 'CEST',
  'Europe/Madrid': 'CEST',
  'America/New_York': 'EDT',
  'America/Los_Angeles': 'PDT',
  'America/Chicago': 'CDT',
  'America/Sao_Paulo': 'BRT',
  'Asia/Tokyo': 'JST',
  'Asia/Shanghai': 'CST',
  'Australia/Sydney': 'AEST',
  'UTC': 'UTC',
};

// Get timezone abbreviation or offset
function getTimezoneDisplay(timezone: string, date: Date): string {
  // Try to get abbreviation
  const abbr = timezoneAbbreviations[timezone];
  if (abbr) return abbr;
  
  // Fall back to offset
  try {
    const zonedDate = toZonedTime(date, timezone);
    const offset = format(zonedDate, 'zzz', { timeZone: timezone });
    return offset;
  } catch {
    return timezone;
  }
}

// Locale mapping
const localeMap = {
  en: enUS,
  pt: pt,
  es: es,
} as const;

export interface DateFormatOptions {
  timezone?: string;
  locale?: 'en' | 'pt' | 'es';
  showTimezone?: boolean;
  format?: string;
}

/**
 * Format a date with timezone support
 * @param date - Date string or Date object (assumed to be UTC if string)
 * @param options - Formatting options
 * @returns Formatted date string
 */
export function formatDate(
  date: string | Date,
  options: DateFormatOptions = {}
): string {
  const {
    timezone = 'UTC',
    locale = 'en',
    showTimezone = false,
    format: formatStr = 'yyyy-MM-dd HH:mm:ss'
  } = options;

  try {
    // Parse date if string
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    
    // Convert to target timezone
    const zonedDate = toZonedTime(dateObj, timezone);
    
    // Format the date
    let formatted = baseFormat(zonedDate, formatStr, {
      locale: localeMap[locale] || enUS
    });
    
    // Add timezone if requested
    if (showTimezone) {
      const tzDisplay = getTimezoneDisplay(timezone, dateObj);
      formatted += ` ${tzDisplay}`;
    }
    
    return formatted;
  } catch (error) {
    console.error('Error formatting date:', error);
    return typeof date === 'string' ? date : date.toString();
  }
}

/**
 * Format a date for display in sensor/analytics contexts
 * Shows time with timezone indicator
 */
export function formatSensorTime(
  date: string | Date,
  timezone: string = 'UTC',
  locale: 'en' | 'pt' | 'es' = 'en'
): string {
  return formatDate(date, {
    timezone,
    locale,
    showTimezone: true,
    format: 'HH:mm'
  });
}

/**
 * Format a date for display in analytics charts
 * Shows full date and time
 */
export function formatAnalyticsDate(
  date: string | Date,
  timezone: string = 'UTC',
  locale: 'en' | 'pt' | 'es' = 'en'
): string {
  return formatDate(date, {
    timezone,
    locale,
    showTimezone: true,
    format: 'MMM dd, HH:mm'
  });
}

/**
 * Format a date for display in tables/lists
 * Shows full date and time with timezone
 */
export function formatTableDate(
  date: string | Date,
  timezone: string = 'UTC',
  locale: 'en' | 'pt' | 'es' = 'en'
): string {
  return formatDate(date, {
    timezone,
    locale,
    showTimezone: true,
    format: 'yyyy-MM-dd HH:mm:ss'
  });
}

/**
 * Get the store's timezone from the store data
 * Falls back to browser timezone if not set
 */
export function getStoreTimezone(store: { timezone?: string | null } | null): string {
  if (store?.timezone) {
    return store.timezone;
  }
  
  // Fall back to browser timezone
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Convert a local time in a specific timezone to UTC
 * Useful for sending times to the API
 */
export function localToUTC(
  date: Date,
  timezone: string
): Date {
  return fromZonedTime(date, timezone);
}