export const PERCENTILES = [
  { key: '3rd', rank: 3 },
  { key: '10th', rank: 10 },
  { key: '25th', rank: 25 },
  { key: '50th', rank: 50 },
  { key: '75th', rank: 75 },
  { key: '90th', rank: 90 },
  { key: '97th', rank: 97 },
] as const;

export const TYPE_META: Record<string, { label: string; unit: string; icon: string; color: string; bg: string }> = {
  height: { label: '키', unit: 'cm', icon: 'resize-outline', color: '#4B9EFF', bg: '#EEF5FF' },
  weight: { label: '체중', unit: 'kg', icon: 'barbell-outline', color: '#FF8C69', bg: '#FFF3EE' },
  head:   { label: '머리둘레', unit: 'cm', icon: 'ellipse-outline', color: '#73C8A9', bg: '#EDFAF4' },
};