import { NextRequest } from "next/server";
import { apiCall, createErrorResponse, createSuccessResponse } from "@/libs/utils/apiHelper";
import { BACKEND_ROUTES } from "@/libs/utils/apiRouter";
import { CommonResponse } from "@/libs/interface/common";

export async function GET(request: NextRequest) {
  const searchParams = new URL(request.url).searchParams;

  try {
    const queryParams = new URLSearchParams();

    const advertiserId = searchParams.get("advertiser_id");
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    const page = searchParams.get("page");
    const pageSize = searchParams.get("page_size");

    if (advertiserId) queryParams.append("advertiser_id", advertiserId);
    if (startDate) queryParams.append("start_date", startDate);
    if (endDate) queryParams.append("end_date", endDate);
    if (page) queryParams.append("page", page);
    if (pageSize) queryParams.append("page_size", pageSize);

    const callUrl = `${BACKEND_ROUTES.ADS()}/list${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
    const result = await apiCall(callUrl, "GET");

    return createSuccessResponse("광고 조회 성공", result.data);
  } catch (error) {
    return createErrorResponse(error, "광고 조회 중 오류가 발생했습니다.");
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const backendFormData = new FormData();

    const textFields = ["advertiser_hash", "amount", "start_date", "end_date", "target_link", "contents", "is_active"];
    for (const field of textFields) {
      const value = formData.get(field);
      if (value !== null && value !== undefined) {
        backendFormData.append(field, value as string);
      }
    }

    const imageFiles = formData.getAll("image_files");
    for (const file of imageFiles) {
      if (file instanceof File) {
        backendFormData.append("image_files", file);
      }
    }

    const response = await fetch(`${BACKEND_ROUTES.ADS()}/add`, {
      method: "POST",
      body: backendFormData,
    });

    const result = (await response.json()) as CommonResponse<null>;

    if (!response.ok || !result.success) {
      return createErrorResponse(null, result.error || result.message || "광고 등록에 실패했습니다.");
    }

    return createSuccessResponse("광고가 등록되었습니다.", result.data);
  } catch (error) {
    return createErrorResponse(error, "광고 등록 중 오류가 발생했습니다.");
  }
}

export async function PUT(request: NextRequest) {
  const searchParams = new URL(request.url).searchParams;
  const viewHash = searchParams.get("view_hash");

  if (!viewHash) {
    return createErrorResponse(null, "광고 해시가 필요합니다.");
  }

  try {
    const formData = await request.formData();
    const backendFormData = new FormData();

    const textFields = ["advertiser_hash", "amount", "start_date", "end_date", "target_link", "contents", "is_active"];
    for (const field of textFields) {
      const value = formData.get(field);
      if (value !== null && value !== undefined) {
        backendFormData.append(field, value as string);
      }
    }

    const imageFiles = formData.getAll("image_files");
    for (const file of imageFiles) {
      if (file instanceof File) {
        backendFormData.append("image_files", file);
      }
    }

    const response = await fetch(`${BACKEND_ROUTES.ADS()}/edit/${encodeURIComponent(viewHash)}`, {
      method: "PUT",
      body: backendFormData,
    });

    const result = (await response.json()) as CommonResponse<null>;

    if (!response.ok || !result.success) {
      return createErrorResponse(null, result.error || result.message || "광고 수정에 실패했습니다.");
    }

    return createSuccessResponse(result.message || "광고가 수정되었습니다.", result.data);
  } catch (error) {
    return createErrorResponse(error, "광고 수정 중 오류가 발생했습니다.");
  }
}
