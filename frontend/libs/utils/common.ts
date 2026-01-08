export function formatDate(dateString: string): string {
    const date = new Date(dateString);

    const Y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    const H = String(date.getHours()).padStart(2, "0");
    const i = String(date.getMinutes()).padStart(2, "0");
    const s = String(date.getSeconds()).padStart(2, "0");

    return `${Y}-${m}-${d} ${H}:${i}:${s}`;
}

// 날짜를 YYYY-MM-DD 형식으로 정규화
export const normalizeDate = (dateString: string): string => {
  const [year, month, day] = dateString.split('-');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

export const getToday = (format: 'YYYY-MM-DD' | 'YYYY-MM-DD HH:mm:ss' = 'YYYY-MM-DD'): string => {
  const date = new Date();
  const Y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');

  if (format === 'YYYY-MM-DD') {
    return `${Y}-${m}-${d}`;
  } else {
    const H = String(date.getHours()).padStart(2, '0');
    const i = String(date.getMinutes()).padStart(2, '0');
    const s = String(date.getSeconds()).padStart(2, '0');
    return `${Y}-${m}-${d} ${H}:${i}:${s}`;
  }
}