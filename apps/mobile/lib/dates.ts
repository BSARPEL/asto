/** YYYY-MM-DD — sunucu ile aynı mantık (IANA timezone). */
export function localTodayKey(timezone = 'Europe/Istanbul'): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export function userTimezone(birth?: { timezone?: string }): string {
  return birth?.timezone || 'Europe/Istanbul';
}
