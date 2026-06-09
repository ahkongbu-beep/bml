// @/app/api/feeds/route.ts
import { apiCall, createErrorResponse, createSuccessResponse } from "@/libs/utils/apiHelper";
import { BACKEND_ROUTES } from "@/libs/utils/apiRouter";
import { NextRequest } from "next/server";

type RawMealItem = {
  id?: number;
  meal_id?: number;
  title?: string;
  content?: string;
  contents?: string;
  images?: string[];
  image_url?: string | string[];
  is_published?: "Y" | "N";
  is_public?: "Y" | "N";
  view_count?: number;
  like_count?: number;
  created_at?: string;
  updated_at?: string;
  view_hash?: string;
  user?: {
    nickname?: string;
    profile_image?: string;
    user_hash?: string | null;
  };
  nickname?: string;
  profile_image?: string;
  user_hash?: string | null;
};

function normalizeMealToFeed(item: RawMealItem) {
  const imageList = Array.isArray(item.images)
    ? item.images
    : Array.isArray(item.image_url)
      ? item.image_url
      : item.image_url
        ? [item.image_url]
        : [];

  return {
    id: item.id ?? item.meal_id ?? 0,
    title: item.title ?? item.contents ?? "",
    content: item.content ?? item.contents ?? "",
    images: imageList,
    is_published: item.is_published ?? item.is_public ?? "N",
    view_count: item.view_count ?? 0,
    like_count: item.like_count ?? 0,
    created_at: item.created_at ?? "",
    updated_at: item.updated_at ?? "",
    view_hash: item.view_hash ?? "",
    user: {
      nickname: item.user?.nickname ?? item.nickname ?? "",
      profile_image: item.user?.profile_image ?? item.profile_image ?? "",
      user_hash: item.user?.user_hash ?? item.user_hash ?? null,
    },
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = searchParams.get('limit') || '15';
  const offset = searchParams.get('offset') || '0';
  const title = searchParams.get('title');
  const nickname = searchParams.get('nickname');
  const startDate = searchParams.get('start_date');
  const endDate = searchParams.get('end_date');
  const sortBy = searchParams.get('sort_by');

  let callURL = `${BACKEND_ROUTES.FEEDS()}?limit=${limit}&offset=${offset}`;

  // 검색 파라미터 추가
  if (title) callURL += `&title=${encodeURIComponent(title)}`;
  if (nickname) callURL += `&nickname=${encodeURIComponent(nickname)}`;
  if (startDate) callURL += `&start_date=${startDate}`;
  if (endDate) callURL += `&end_date=${endDate}`;
  if (sortBy) callURL += `&sort_by=${sortBy}`;

  try {
    console.log(callURL);
    const result = await apiCall(callURL, 'GET');
    if (!result.success) {
      throw new Error(result.error || '피드 조회에 실패했습니다.');
    }

    const responseData = result.data as { meal_list?: RawMealItem[] } | RawMealItem[] | undefined;
    const mealList = Array.isArray(responseData)
      ? responseData
      : Array.isArray(responseData?.meal_list)
        ? responseData.meal_list
        : [];
    const normalizedFeeds = mealList.map(normalizeMealToFeed);

    return createSuccessResponse("피드 조회 성공", normalizedFeeds);
  } catch (error) {
    return createErrorResponse(error, "피드 조회 중 오류가 발생했습니다.");
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const callURL = `${BACKEND_ROUTES.FEEDS()}/create`;

    // FormData를 그대로 백엔드로 전달
    const response = await fetch(callURL, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || '피드 생성에 실패했습니다.');
    }

    return createSuccessResponse("피드 생성 성공", data.data);
  } catch (error) {
    return createErrorResponse(error, "피드 생성 중 오류가 발생했습니다.");
  }
}

export async function PUT(request: NextRequest) {
  try {
    const formData = await request.formData();

    const callURL = `${BACKEND_ROUTES.FEEDS()}/update`;

    const response = await fetch(callURL, {
      method: 'PUT',
      body: formData,
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || '피드 수정에 실패했습니다.');
    }

    return createSuccessResponse("피드 수정 성공", data.data);
  } catch (error) {
    return createErrorResponse(error, "피드 수정 중 오류가 발생했습니다.");
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const callURL = `${BACKEND_ROUTES.FEEDS()}/delete`;

    const data = await apiCall(callURL, 'POST', null, body);

    if (!data.success) {
      throw new Error(data.error || '피드 삭제에 실패했습니다.');
    }

    return createSuccessResponse("피드 삭제 성공", data.data);
  } catch (error) {
    return createErrorResponse(error, "피드 삭제 중 오류가 발생했습니다.");
  }
}
