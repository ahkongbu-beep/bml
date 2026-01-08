"use client";
import React, { useState, useEffect } from "react";
import { useFeed } from "@/hooks/useFeed";
import Image from "next/image";
import Link from "next/link";

export default function FeedListPage() {
  const { feeds, loading, error, fetchFeeds } = useFeed();

  // 검색 상태
  const [searchTitle, setSearchTitle] = useState("");
  const [searchNickname, setSearchNickname] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortBy, setSortBy] = useState<'like_count_asc' | 'like_count_desc' | 'created_at'>('created_at');

  // 초기 데이터 로드
  useEffect(() => {
    fetchFeeds(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 자동 검색
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchFeeds(true, {
        title: searchTitle,
        nickname: searchNickname,
        start_date: startDate,
        end_date: endDate,
        sort_by: sortBy,
      });
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTitle, searchNickname, startDate, endDate, sortBy]);

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">피드 관리</h2>
          <p className="text-sm md:text-base text-gray-400">피드를 조회하고 관리합니다</p>
        </div>
      </div>

      {/* 검색 영역 */}
      <div className="bg-gray-900 rounded-2xl p-4 md:p-6 border border-gray-800">
        <h3 className="text-lg font-bold text-white mb-4">검색 필터</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* 제목 검색 */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">제목</label>
            <input
              type="text"
              value={searchTitle}
              onChange={(e) => setSearchTitle(e.target.value)}
              placeholder="제목 검색"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* 닉네임 검색 */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">닉네임</label>
            <input
              type="text"
              value={searchNickname}
              onChange={(e) => setSearchNickname(e.target.value)}
              placeholder="닉네임 검색"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

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

          {/* 정렬 */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">정렬</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'like_count_asc' | 'like_count_desc')}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
            >
              <option value="created_at">최신순</option>
              <option value="like_count_desc">좋아요 내림차순</option>
              <option value="like_count_asc">좋아요 오름차순</option>
            </select>
          </div>
        </div>
      </div>

      {/* 피드 리스트 */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">ID</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">이미지</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">제목</th>
                <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">작성자</th>
                <th className="hidden lg:table-cell px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">조회수</th>
                <th className="px-4 md:px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">좋아요</th>
                <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">작성일</th>
                <th className="px-4 md:px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-400">
                    로딩 중...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-red-400">
                    {error}
                  </td>
                </tr>
              ) : feeds.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-400">
                    피드가 없습니다
                  </td>
                </tr>
              ) : (
                feeds.map((feed) => (

                  <tr key={feed.id} className="hover:bg-gray-800 transition-colors">
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {feed.id}
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                      {feed.images && feed.images.length > 0 && feed.images[0] &&
                       (feed.images[0].startsWith('http://') || feed.images[0].startsWith('https://')) ? (
                        <Link href={`/manage/feeds/${feed.id}`}>
                          <div className="relative w-16 h-16 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity">
                            <Image
                              src={feed.images[0]}
                              alt={feed.title}
                              fill
                              sizes="64px"
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                        </Link>
                      ) : (
                        <div className="w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center">
                          <span className="text-gray-500 text-xs">No Image</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 md:px-6 py-4 text-sm text-white">
                      <Link href={`/manage/feeds/${feed.id}`} className="hover:text-indigo-400 transition-colors">
                        <div className="font-medium truncate max-w-xs">{feed.title}</div>
                        <div className="text-xs text-gray-400 mt-1 truncate max-w-xs">{feed.content}</div>
                      </Link>
                    </td>
                    <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      <div className="flex items-center gap-2">
                        {feed.user?.profile_image &&
                         (feed.user.profile_image.startsWith('http://') || feed.user.profile_image.startsWith('https://')) ? (
                          <div className="relative w-8 h-8 rounded-full overflow-hidden">
                            <Image
                              src={feed.user.profile_image}
                              alt={feed.user.nickname}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                        ) : (
                          <div className="w-8 h-8 bg-gray-700 rounded-full" />
                        )}
                        <span>{feed.user?.nickname || '알 수 없음'}</span>
                      </div>
                    </td>
                    <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap text-center text-sm text-gray-300">
                      {feed.view_count}
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-center">
                      <span className="px-3 py-1 text-xs font-medium bg-pink-600/20 text-pink-400 rounded-full">
                        ❤️ {feed.like_count}
                      </span>
                    </td>
                    <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {new Date(feed.created_at).toLocaleDateString("ko-KR")}
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-center">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        feed.is_published === "Y"
                          ? "bg-green-600/20 text-green-400"
                          : "bg-gray-600/20 text-gray-400"
                      }`}>
                        {feed.is_published === "Y" ? "공개" : "비공개"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 피드 개수 표시 */}
      {feeds.length > 0 && (
        <div className="text-center text-sm text-gray-400">
          총 {feeds.length}개의 피드
        </div>
      )}
    </div>
  );
}