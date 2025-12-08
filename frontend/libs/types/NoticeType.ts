export interface Notice {
  id: number;
  title: string;
  content: string;
  category_text: string;
  is_important: string;
  created_at: string;
  admin_name: string;
  view_hash: string;
}

export interface NoticeDetail {
  title: string;
  content: string;
  category_text: string;
  is_important: string;
  created_at: string;
  updated_at: string;
  admin_name: string;
  view_hash: string;
}
