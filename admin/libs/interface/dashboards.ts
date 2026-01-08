export interface DashboardStats {
  last_regist_feed_time: string;       // 최근 피드 생성 시간
  last_regist_user_time: string; // 최근 회원 가입 시간
  last_regist_notice_time: string;     // 최근 공지사항 등록 시간
  total_feeds: number;
  total_users: number;
  total_hotdeals: number;
}