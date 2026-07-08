export function getPersianRelativeOrExactDate(dateString?: string): string {
  if (!dateString) return '';

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      return diffMin <= 1 ? 'لحظاتی پیش' : `${diffMin} دقیقه پیش`;
    }
    if (diffHours < 24) {
      return `${diffHours} ساعت پیش`;
    }
    if (diffDays <= 7) {
      return `${diffDays} روز پیش`;
    }

    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  } catch {
    return '';
  }
}
