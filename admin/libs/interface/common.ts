export interface CommonResponse<T> {
  success: boolean;
  error?: string;
  data?: T;
  message?: string;
}