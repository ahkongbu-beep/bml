// @/app/api/feeds/[mealHash]/route.ts
import { apiCall, createErrorResponse, createSuccessResponse } from "@/libs/utils/apiHelper";
import { BACKEND_ROUTES } from "@/libs/utils/apiRouter";
import { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ mealHash: string }> }
) {
  const { mealHash } = await params;
  const callURL = `${BACKEND_ROUTES.FEEDS()}/${mealHash}`;
  try {
    const data = await apiCall(callURL, 'GET');
    if (!data.success) {
      throw new Error(data.error || '피드 상세 조회에 실패했습니다.');
    }

    // 새 데이터 구조: { meal: {...}, comments: [...] }
    const rawData = data.data as { meal?: Record<string, unknown>; comments?: unknown[] } | Record<string, unknown>;
    const meal = (rawData as { meal?: Record<string, unknown> })?.meal ?? rawData;
    const comments = (rawData as { comments?: unknown[] })?.comments ?? [];

    const imageUrl = Array.isArray(meal.image_url)
      ? meal.image_url
      : meal.image_url
        ? [meal.image_url]
        : [];

    const normalized = {
      id: meal.meal_id ?? meal.id ?? 0,
      user_id: meal.user_id ?? 0,
      title: meal.contents ?? meal.title ?? "",
      content: meal.contents ?? meal.content ?? "",
      image_url: imageUrl,
      is_published: meal.is_public ?? meal.is_published ?? "N",
      is_public: meal.is_public ?? "N",
      is_active: meal.is_active,
      view_count: meal.view_count ?? 0,
      like_count: meal.like_count ?? 0,
      created_at: meal.created_at ?? "",
      updated_at: meal.updated_at ?? "",
      view_hash: meal.view_hash ?? "",
      user_hash: meal.user_hash ?? null,
      nickname: meal.nickname ?? "",
      profile_image: meal.profile_image ?? "",
      category_code: meal.category_code,
      category_name: meal.category_name,
      input_date: meal.input_date,
      meal_stage: meal.meal_stage,
      meal_stage_detail: meal.meal_stage_detail,
      meal_condition: meal.meal_condition,
      comments,
    };

    return createSuccessResponse("피드 상세 조회 성공", normalized);
  } catch (error) {
    return createErrorResponse(error, "피드 상세 조회 중 오류가 발생했습니다.");
  }
}
