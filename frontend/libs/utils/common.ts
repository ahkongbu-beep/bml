export function formatDate(dateString: string, format: 'YYYY-MM-DD' | 'YYYY-MM-DD HH:mm:ss' = 'YYYY-MM-DD HH:mm:ss'): string {
    const date = new Date(dateString);

    const Y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");

    if (format === 'YYYY-MM-DD') {
        return `${Y}-${m}-${d}`;
    }

    const H = String(date.getHours()).padStart(2, "0");
    const i = String(date.getMinutes()).padStart(2, "0");
    const s = String(date.getSeconds()).padStart(2, "0");

    return `${Y}-${m}-${d} ${H}:${i}:${s}`;
}

// 상대적인 시간 표현 (몇 분 전, 며칠 전 등)
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffSeconds < 60) {
    return '방금 전';
  } else if (diffMinutes < 60) {
    return `${diffMinutes}분 전`;
  } else if (diffHours < 24) {
    return `${diffHours}시간 전`;
  } else if (diffDays < 30) {
    return `${diffDays}일 전`;
  } else if (diffMonths < 12) {
    return `${diffMonths}개월 전`;
  } else {
    return formatDate(dateString, 'YYYY-MM-DD');
  }
}

// 날짜를 YYYY-MM-DD 형식으로 정규화
export const normalizeDate = (dateString: string): string => {
  const [year, month, day] = dateString.split('-');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

export const getStaticImage = (type: string, imagePath?: string | null): string => {
  if (!imagePath) return '';

  // 이미 완전한 URL이면 그대로 사용
  if (
    imagePath.startsWith('http') ||
    imagePath.startsWith('file://') ||
    imagePath.startsWith('content://') ||
    imagePath.startsWith('data:') ||
    imagePath.startsWith('asset://') ||
    imagePath.startsWith('ph://')
  ) {
    return imagePath;
  }

  // 앞에 / 보장
  let normalizedPath = imagePath.startsWith('/') ? imagePath : '/' + imagePath;

  const STATIC_BASE_URL = process.env.EXPO_PUBLIC_STATIC_BASE_URL || '';

  // 실제 파일 경로
  const base = `${STATIC_BASE_URL}${normalizedPath}_${type}.webp`;

  /**
   * 🔥 핵심: Fresco 캐시 무효화용 버전 파라미터
   * path 자체가 고유값(업로드시 변경)이라 안정적
   */
  const cacheKey = encodeURIComponent(normalizedPath + '_' + type);

  return `${base}?v=${cacheKey}`;
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

export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^01[016789]-?\d{3,4}-?\d{4}$/;
  return phoneRegex.test(phone);
}

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

  // 만 나이 계산
export const calculateAge = (birthDate: string): number => {
  if (birthDate.length !== 8) return 0;

    const year = parseInt(birthDate.substring(0, 4));
    const month = parseInt(birthDate.substring(4, 6));
    const day = parseInt(birthDate.substring(6, 8));

    const today = new Date();
    const birth = new Date(year, month - 1, day);

    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    return age;
  };

// Y-m-d 를 개월로 환산
export function diffMonthsFrom(dateString: string): number {
  const start = new Date(dateString);
  const now = new Date();

  let months =
    (now.getFullYear() - start.getFullYear()) * 12 +
    (now.getMonth() - start.getMonth());

  // 날짜가 아직 안 지났으면 한 달 차감
  if (now.getDate() < start.getDate()) {
    months -= 1;
  }

  return Math.max(months, 0);
}

// 프로필 이동 (내 프로필 or 타인 프로필)
export const handleViewProfile = (navigation: any, myUserHash: string, targetUserHash: string) => {
  // 해쉬정보가 같은 경우 내 프로필로 이동
  if (myUserHash === targetUserHash) {
    console.log("내 프로필로 이동");
    navigation.navigate('MyPage');
  } else {
    // 타인 프로필로 이동
    console.log("타인 프로필로 이동");
    navigation.navigate('UserProfile', { userHash:targetUserHash });
  }
};