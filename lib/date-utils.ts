/**
 * Utility functions for date formatting and manipulation across the application.
 */

/**
 * Formats a concert presentation date safely in pt-BR using UTC timezone
 * to prevent off-by-one day bugs caused by local timezone conversion.
 */
export function formatConcertDate(
  date: Date | string | undefined | null,
  options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }
): string {
  if (!date) return "";

  const d =
    typeof date === "string"
      ? new Date(date.includes("T") ? date : `${date}T00:00:00.000Z`)
      : new Date(date);

  if (isNaN(d.getTime())) return "";

  return d.toLocaleDateString("pt-BR", {
    timeZone: "UTC",
    ...options,
  });
}
