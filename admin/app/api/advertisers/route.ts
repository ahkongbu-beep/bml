import { NextRequest } from "next/server";
import { apiCall, createErrorResponse, createSuccessResponse } from "@/libs/utils/apiHelper";
import { BACKEND_ROUTES } from "@/libs/utils/apiRouter";
import { CommonResponse } from "@/libs/interface/common";

export async function GET(request: NextRequest) {
  const searchParams = new URL(request.url).searchParams;
  const viewHash = searchParams.get("view_hash");

  try {
    let callUrl = "";

    if (viewHash) {
      callUrl = `${BACKEND_ROUTES.ADVERTISERS()}/detail/${encodeURIComponent(viewHash)}`;
    } else {
      const queryParams = new URLSearchParams();
      const accountId = searchParams.get("account_id");
      const company = searchParams.get("company");
      const companyNumber = searchParams.get("company_number");
      const page = searchParams.get("page");
      const pageSize = searchParams.get("page_size");

      if (accountId) queryParams.append("account_id", accountId);
      if (company) queryParams.append("company", company);
      if (companyNumber) queryParams.append("company_number", companyNumber);
      if (page) queryParams.append("page", page);
      if (pageSize) queryParams.append("page_size", pageSize);

      callUrl = `${BACKEND_ROUTES.ADVERTISERS()}/list${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
    }

    const result = await apiCall(callUrl, "GET");
    return createSuccessResponse("광고주 조회 성공", result.data);
  } catch (error) {
    return createErrorResponse(error, "광고주 조회 중 오류가 발생했습니다.");
  }
}

export async function PUT(request: NextRequest) {
  const searchParams = new URL(request.url).searchParams;
  const viewHash = searchParams.get("view_hash");

  if (!viewHash) {
    return createErrorResponse(null, "광고주 해시가 필요합니다.");
  }

  try {
    const formData = await request.formData();
    const backendFormData = new FormData();
    const textFields = [
      "account_id",
      "account_name",
      "company",
      "account_tel",
      "company_number",
      "description",
      "company_biz",
      "company_item",
    ];

    for (const field of textFields) {
      const value = formData.get(field);
      if (typeof value === "string") {
        backendFormData.append(field, value);
      }
    }

    const accountImage = formData.get("account_image");
    if (accountImage instanceof File) {
      backendFormData.append("account_image", accountImage);
    }

    const response = await fetch(
      `${BACKEND_ROUTES.ADVERTISERS()}/edit/${encodeURIComponent(viewHash)}`,
      { method: "PUT", body: backendFormData }
    );

    const result = (await response.json()) as CommonResponse<null>;

    if (!response.ok || !result.success) {
      throw new Error(result.error || result.message || "광고주 수정에 실패했습니다.");
    }

    return createSuccessResponse(result.message || "광고주 수정 성공", result.data);
  } catch (error) {
    return createErrorResponse(error, "광고주 수정 중 오류가 발생했습니다.");
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const backendFormData = new FormData();
    const textFields = [
      "account_id",
      "account_name",
      "company",
      "account_tel",
      "company_number",
      "description",
      "company_biz",
      "company_item",
    ];

    for (const field of textFields) {
      const value = formData.get(field);
      if (typeof value === "string") {
        backendFormData.append(field, value);
      }
    }

    const accountImage = formData.get("account_image");
    if (accountImage instanceof File) {
      backendFormData.append("account_image", accountImage);
    }

    const response = await fetch(`${BACKEND_ROUTES.ADVERTISERS()}/add`, {
      method: "POST",
      body: backendFormData,
    });

    const result = (await response.json()) as CommonResponse<null>;

    if (!response.ok || !result.success) {
      throw new Error(result.error || result.message || "광고주 등록에 실패했습니다.");
    }

    return createSuccessResponse(result.message || "광고주 등록 성공", result.data);
  } catch (error) {
    return createErrorResponse(error, "광고주 등록 중 오류가 발생했습니다.");
  }
}
