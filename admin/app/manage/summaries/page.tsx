"use client";
// @/app/manage/summaries/page.tsx
/*
 * ai 요약페이지
  -
  - 요약된 ai 데이터 리스트
  - 요약된 ai 데이터 검색(시작일, 종료일, 낙네임, searchType(질문키워드, 피드ID), searchValue)
  - 요약된 ai 데이터 상세보기
 */

import React, { useState, useEffect } from "react";
import { useSummary } from "@/hooks/useSummaries";
import { summary_models } from "@/libs/codes/summary";
import { SummaryRequest, SummaryResponse } from "@/libs/interface/summaries"

export default function SummariesPage() {
  // 검색 상태
  const [nickname, setNickname] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchModel, setSearchModel] = useState("");
  const [searchType, setSearchType] = useState<"question" | "model_id">("question");
  const [searchValue, setSearchValue] = useState("");


  // 상세보기 모달 상태
  const [selectedSummary, setSelectedSummary] = useState<string | null>(null);

  // TODO: Hook으로 데이터 가져오기
  const { summaries, loading, error, fetchSummary } = useSummary();

  const [summaryDetails, setSummaryDetails] = useState<SummaryResponse | null>(null);

  // 초기 데이터 로드
  useEffect(() => {
    fetchSummary()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleDetailLayer = (summary: SummaryResponse) => {
    setSelectedSummary(summary.view_hash);
    setSummaryDetails(summary);
  }

  // 검색 핸들러
  const handleSearch = () => {
    const params: SummaryRequest = {};

    if (nickname) params.nickname = nickname;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (searchModel) params.model = searchModel;
    if (searchType) params.searchType = searchType;
    if (searchValue) params.searchValue = searchValue;
    fetchSummary(params);
  };

  // 초기화 핸들러
  const handleReset = () => {
    setNickname("");
    setStartDate("");
    setEndDate("");
    setSearchModel("");
    setSearchType("question");
    setSearchValue("");

    // 초기 데이터 다시 로드
    fetchSummary();
  };

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">AI 요약 관리</h2>
          <p className="text-sm md:text-base text-gray-400">AI로 생성된 요약 데이터를 조회하고 관리합니다</p>
        </div>
      </div>

      {/* 검색 영역 */}
      <div className="bg-gray-900 rounded-2xl p-4 md:p-6 border border-gray-800">
        <h3 className="text-lg font-bold text-white mb-4">검색 필터</h3>
        <div className="space-y-4">
          {/* 첫 번째 줄: 닉네임, 시작일, 종료일 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 시작 날짜 */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">시작 날짜</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            {/* 종료 날짜 */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">종료 날짜</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            {/* 닉네임 검색 */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">닉네임</label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="닉네임 검색"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          {/* 두 번째 줄: 검색 타입, 검색 값 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 검색 타입 */}
            <div>
              <select
                value={searchModel}
                onChange={(e) => setSearchModel(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
              >
                {Object.entries(summary_models).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value as "question" | "model_id")}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="question">질문 키워드</option>
                <option value="model_id">모델 번호</option>
              </select>
            </div>

            {/* 검색 값 */}
            <div>
              <input
                type={searchType === "model_id" ? "number" : "text"}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder={searchType === "question" ? "질문 키워드 입력" : "모델 번호 입력"}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          {/* 세 번째 줄: 검색 버튼 */}
          <div className="flex justify-center items-end gap-2">
            <button
              onClick={handleSearch}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
            >
              검색
            </button>
            <button
              onClick={handleReset}
              className="bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-6 rounded-lg transition-colors"
            >
              초기화
            </button>
          </div>
        </div>
      </div>

      {/* AI 요약 리스트 */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">구분</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">모델ID</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">질문</th>
                <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">닉네임</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">생성일</th>
                <th className="px-4 md:px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">상세</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                    로딩 중...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-red-400">
                    {error}
                  </td>
                </tr>
              ) : summaries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                    AI 요약 데이터가 없습니다
                  </td>
                </tr>
              ) : (
                summaries.map((summary, seq) => (
                  <tr key={seq} className="hover:bg-gray-800 transition-colors">
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {summary.model}
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {summary.model_id}
                    </td>
                    <td className="px-4 md:px-6 py-4 text-sm text-white max-w-xs">
                      <div className="truncate">{summary.question}</div>
                    </td>
                    <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      <div className="flex items-center gap-2">
                        <img
                          src={summary.user?.profile_image || "/default-avatar.png"}
                          alt={summary.user?.nickname || "사용자"}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <span>{summary.user?.nickname || "알 수 없음"}</span>
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {summary.created_at}
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-center text-sm">
                      <button
                        onClick={() => handleDetailLayer(summary)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg transition-colors text-xs font-medium"
                      >
                        상세보기
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 상세보기 모달 */}
      {selectedSummary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-2xl border border-gray-800 max-w-3xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              {/* 모달 헤더 */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">AI 요약 상세보기</h3>
                <button
                  onClick={() => setSelectedSummary(null)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* 모달 내용 */}
              <div className="space-y-4">
                {/* TODO: 실제 데이터로 교체 */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">hash번호</label>
                  <div className="text-white">{summaryDetails?.view_hash}</div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">구분</label>
                  <div className="text-white">{summaryDetails?.model || "-"}</div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">모델 번호</label>
                  <div className="text-white">{summaryDetails?.model_id || "-"}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">사용자</label>
                  <div className="text-white">{summaryDetails?.user?.nickname || "알 수 없음"}</div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">질문</label>
                  <div className="bg-gray-800 rounded-lg p-4 text-white">{summaryDetails?.question || "-"}</div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">AI 요약 내용</label>
                  <div className="bg-gray-800 rounded-lg p-4 text-white whitespace-pre-wrap">{summaryDetails?.answer || "-"}</div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">생성일시</label>
                  <div className="text-white">{summaryDetails?.created_at || "-"}</div>
                </div>
              </div>

              {/* 모달 푸터 */}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedSummary(null)}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}