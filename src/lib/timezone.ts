// Eastern Time timezone utilities
// All dates in the app are displayed and stored in ET

const ET_TIMEZONE = 'America/New_York';

// Get current date string in ET (YYYY-MM-DD)
export function getETDateString(date: Date = new Date()): string {
  return date.toLocaleDateString('en-CA', { timeZone: ET_TIMEZONE });
}

// Check if a date string is today in ET
export function isToday(dateString: string): boolean {
  return dateString === getETDateString();
}

// Format a date for display in ET
export function formatDateET(
  date: Date | string,
  style: 'short' | 'long' | 'time' | 'full' = 'short'
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const options: Intl.DateTimeFormatOptions = { timeZone: ET_TIMEZONE };

  switch (style) {
    case 'short':
      return d.toLocaleDateString('en-US', {
        ...options,
        month: 'short',
        day: 'numeric'
      });
    case 'long':
      return d.toLocaleDateString('en-US', {
        ...options,
        weekday: 'long',
        month: 'long',
        day: 'numeric'
      });
    case 'time':
      return d.toLocaleTimeString('en-US', {
        ...options,
        hour: 'numeric',
        minute: '2-digit'
      });
    case 'full':
      return d.toLocaleDateString('en-US', {
        ...options,
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
  }
}

// Get the current time in ET as HH:MM
export function getETTimeString(date: Date = new Date()): string {
  return date.toLocaleTimeString('en-US', {
    timeZone: ET_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

// Parse a YYYY-MM-DD string and return a Date object (interpreting as ET)
export function parseETDate(dateString: string): Date {
  // Append time and timezone to ensure correct parsing
  return new Date(`${dateString}T12:00:00-05:00`);
}

// Get day of week in ET (0 = Sunday, 6 = Saturday)
export function getETDayOfWeek(date: Date = new Date()): number {
  const etDateStr = date.toLocaleDateString('en-US', {
    timeZone: ET_TIMEZONE,
    weekday: 'short'
  });
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days.indexOf(etDateStr);
}

// Check if it's Sunday in ET (for weekly reflection)
export function isSundayET(date: Date = new Date()): boolean {
  return getETDayOfWeek(date) === 0;
}

// Add days to a date
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// Get the start of the current week (Sunday) in ET
export function getWeekStartET(date: Date = new Date()): string {
  const dayOfWeek = getETDayOfWeek(date);
  const weekStart = addDays(date, -dayOfWeek);
  return getETDateString(weekStart);
}
