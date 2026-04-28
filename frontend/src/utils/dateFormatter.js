/**
 * Formats a note's last-edited timestamp into a human-readable Vietnamese string.
 * Shows time if edited today, otherwise shows the date.
 *
 * @param {string | null | undefined} value - ISO date string
 * @returns {string}
 */
export function formatLastEditedText(value) {
  const parsedDate = value ? new Date(value) : new Date();

  if (Number.isNaN(parsedDate.getTime())) {
    return 'Đã chỉnh sửa lúc --:--';
  }

  const now = new Date();
  const isToday =
    parsedDate.getDate() === now.getDate() &&
    parsedDate.getMonth() === now.getMonth() &&
    parsedDate.getFullYear() === now.getFullYear();

  const formattedValue = isToday
    ? parsedDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    : parsedDate.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });

  return `Đã chỉnh sửa lúc ${formattedValue}`;
}
