export interface AiSummaryAnswerModalProps {
  visible: boolean;
  onClose: () => void;
  question: string;
  answer: string;
  title?: string;
}

export interface SummaryListRequest {
  userHash: string;
  model: string;
}

export interface SummaryItems {
  title: string;
  feed_id: number;
  question: string;
  answer: string;
  created_at: string;
  feed_image_url: string;
}

export interface SummaryListResponse {
  summaries: SummaryItems[];
  total: number;
}

