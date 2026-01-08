// @/hooks/useFeed.ts
// 피드 관련 훅

import { useState } from "react";
import { Feed, FeedDetail, FeedCreateRequest, FeedUpdateRequest } from "@/libs/interface/feeds";
import { apiCall } from "@/libs/utils/apiHelper"
import { FRONTEND_ROUTES } from "@/libs/utils/apiRouter"
import { CommonResponse } from "@/libs/interface/common";

export function useFeed() {
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [feed_detail, setFeedDetail] = useState<FeedDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const LIMIT = 15;

  // 피드 목록 조회 (무한 스크롤용)
  const fetchFeeds = async (reset: boolean = false, searchParams?: {
    title?: string;
    nickname?: string;
    start_date?: string;
    end_date?: string;
    sort_by?: 'like_count_asc' | 'like_count_desc' | 'created_at';
  }) => {
    try {
      setLoading(true);
      setError(null);

      const currentOffset = reset ? 0 : offset;
      let apiURL = `${FRONTEND_ROUTES.FEEDS()}?limit=${LIMIT}&offset=${currentOffset}`;

      // 검색 파라미터 추가
      if (searchParams?.title) {
        apiURL += `&title=${encodeURIComponent(searchParams.title)}`;
      }
      if (searchParams?.nickname) {
        apiURL += `&nickname=${encodeURIComponent(searchParams.nickname)}`;
      }
      if (searchParams?.start_date) {
        apiURL += `&start_date=${searchParams.start_date}`;
      }
      if (searchParams?.end_date) {
        apiURL += `&end_date=${searchParams.end_date}`;
      }
      if (searchParams?.sort_by) {
        apiURL += `&sort_by=${searchParams.sort_by}`;
      }

      const response = await apiCall(apiURL, 'GET') as CommonResponse<Feed[]>;

      if (!response.success) {
        throw new Error(response.error || '피드 조회 실패');
      }

      const newFeeds = response.data || [];

      if (reset) {
        setFeeds(newFeeds);
        setOffset(LIMIT);
      } else {
        setFeeds(prev => [...prev, ...newFeeds]);
        setOffset(prev => prev + LIMIT);
      }

      setHasMore(newFeeds.length === LIMIT);

      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : "피드 조회 실패했습니다");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchFeedDetail = async (feedId: number) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiCall(`${FRONTEND_ROUTES.FEEDS()}/${feedId}`, 'GET');

      if (!response.success) {
        throw new Error(response.error || '피드 조회 실패');
      }

      setFeedDetail(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "피드 조회 실패");
    } finally {
      setLoading(false);
    }
  };

  // 피드 생성
  const createFeed = async (data: FeedCreateRequest) => {
    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append('user_id', '1'); // TODO: 실제 로그인 유저 ID
      formData.append('title', data.title);
      formData.append('content', data.content);
      formData.append('is_public', data.is_public);
      if (data.tags) formData.append('tags', data.tags);
      if (data.image) formData.append('file', data.image);

      const response = await fetch('/api/feeds', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '피드 생성 실패');
      }

      // 목록 새로고침
      await fetchFeeds(true);

      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : "피드 생성 실패");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 피드 수정
  const updateFeed = async (data: FeedUpdateRequest) => {
    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append('feed_id', data.id.toString());
      if (data.title) formData.append('title', data.title);
      if (data.content) formData.append('content', data.content);
      if (data.is_public) formData.append('is_public', data.is_public);
      if (data.tags) formData.append('tags', data.tags);
      if (data.image) formData.append('file', data.image);

      const response = await fetch('/api/feeds', {
        method: 'PUT',
        body: formData,
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '피드 수정 실패');
      }

      // 목록 새로고침
      await fetchFeeds(true);

      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : "피드 수정 실패");
      throw err;
    } finally {
      setLoading(false);
    }
  };



  // 피드 삭제
  const deleteFeed = async (feedId: number) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/feeds', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ feed_id: feedId }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '피드 삭제 실패');
      }

      // 목록에서 제거
      setFeeds(prev => prev.filter(feed => feed.id !== feedId));

      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : "피드 삭제 실패");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 좋아요 토글
  const toggleLike = async (feedId: number) => {
    try {
      const response = await fetch('/api/feeds/like', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feed_id: feedId,
          user_id: 1 // TODO: 실제 로그인 유저 ID
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '좋아요 실패');
      }

      // 로컬 상태 업데이트
      setFeeds(prev => prev.map(feed =>
        feed.id === feedId
          ? {
              ...feed,
              is_liked: !feed.is_liked,
              like_count: feed.is_liked ? feed.like_count - 1 : feed.like_count + 1
            }
          : feed
      ));

      return result;
    } catch (err) {
      console.error('좋아요 실패:', err);
      throw err;
    }
  };

  // 찜하기 토글
  const toggleBookmark = async (feedId: number) => {
    try {
      const response = await fetch('/api/feeds/bookmark', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feed_id: feedId,
          user_id: 1 // TODO: 실제 로그인 유저 ID
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '찜하기 실패');
      }

      // 로컬 상태 업데이트
      setFeeds(prev => prev.map(feed =>
        feed.id === feedId
          ? { ...feed, is_bookmarked: !feed.is_bookmarked }
          : feed
      ));

      return result;
    } catch (err) {
      console.error('찜하기 실패:', err);
      throw err;
    }
  };

  return {
    feeds,
    feed_detail,
    loading,
    error,
    hasMore,
    fetchFeeds,
    fetchFeedDetail,
    createFeed,
    updateFeed,
    deleteFeed,
    toggleLike,
    toggleBookmark,
  };
}
