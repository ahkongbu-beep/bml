export const CATEGORY_LABELS: Record<string, string> = {
  vegetable: '채소', fruit: '과일', meat: '육류', seafood: '해산물', protein: '단백질',
  dairy: '유제품', grain: '곡류', seed_nut: '견과/씨앗', seaweed: '해조류', etc: '기타',
};

export const CATEGORY_ICONS: Record<string, string> = {
    vegetable: '🥦', fruit: '🍎', meat: '🥩', seafood: '🐟', protein: '🍗',
    dairy: '🥛', grain: '🌾', seed_nut: '🥜', seaweed: '🌿', etc: '🍽️',
  };

export const INGREDIENT_AMOUNT_OPTIONS = [
  { label: '많이', value: 1, circles: 3 },
  { label: '보통', value: 0.6, circles: 2 },
  { label: '적게', value: 0.3, circles: 1 },
];

export const getAmountCircles = (amount: number): string => {
  if (amount === 1) return '●●●';
  if (amount === 0.6) return '●●';
  if (amount === 0.3) return '●';
  return '●●'; // default
};

export const getAmountColor = (amount: number): string => {
  if (amount === 1) return '#D4EDDA';
  if (amount === 0.6) return '#FFF3CD';
  if (amount === 0.3) return '#F8D7DA';
  return '#FFF3CD'; // default
};

export const getBorderColor = (amount: number): string => {
  if (amount === 1) return '#28A745';
  if (amount === 0.6) return '#FFC107';
  if (amount === 0.3) return '#DC3545';
  return '#FFC107'; // default
};