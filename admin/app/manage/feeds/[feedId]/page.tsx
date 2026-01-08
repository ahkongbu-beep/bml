"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Image from "next/image";
import { FeedDetail } from "@/libs/interface/feeds";
import { useFeed } from "@/hooks/useFeed";
/*
 * 피드 상세페이지
 * - 피드의 상세 정보를 보여줍니다.
    * - 피드 ID를 URL 파라미터로 받아와서 표시합니다.
    * 뒤로가기 링크 제공
    * 피드와 관련된 댓글 또한 함께 조회
    * 피드 이미지가 여러장이라면 슬라이더 형태로 표시
    * 피드 수정 및 삭제 기능 (추후 구현)
    * 화면구성은 상품 상세페이지와 유사하게하며, 댓글리스트는 하단에 배치
*/
export default function FeedDetailPage() {
  const params = useParams();
  const feedId = params?.feedId as string;
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { feed_detail, loading, error, fetchFeedDetail } = useFeed();

  useEffect(() => {
    if (feedId) {
      fetchFeedDetail(Number(feedId));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedId]);

  const handleRedirectProfile = (user_hash: string | null) => () => {
    if (user_hash) {
      window.open(`/manage/users/profile/${user_hash}`, '_blank');
    }
  };

  const nextImage = () => {
    if (feed_detail?.images && currentImageIndex < feed_detail.images.length - 1) {
      setCurrentImageIndex(prev => prev + 1);
    }
  };

  const prevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(prev => prev - 1);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-400">로딩 중...</div>
      </div>
    );
  }

  if (error || !feed_detail) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
        <div className="text-red-400">{error || '피드를 찾을 수 없습니다'}</div>
        <Link
          href="/manage/feeds"
          className="text-indigo-500 hover:text-indigo-400 transition-colors"
        >
          피드 목록으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* 뒤로가기 헤더 */}
      <div className="flex items-center gap-4">
        <Link
          href="/manage/feeds"
          className="text-indigo-500 hover:text-indigo-400 transition-colors flex items-center gap-2"
        >
          <span>←</span>
          <span>피드 목록</span>
        </Link>
      </div>

      {/* 피드 상세 정보 */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 이미지 영역 */}
          <div className="relative bg-gray-800 p-6">
            {feed_detail.images && feed_detail.images.length > 0 ? (
              <div className="relative aspect-square">
                {feed_detail.images[currentImageIndex] &&
                 (feed_detail.images[currentImageIndex].startsWith('http://') ||
                  feed_detail.images[currentImageIndex].startsWith('https://')) ? (
                  <Image
                    src={feed_detail.images[currentImageIndex]}
                    alt={feed_detail.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-gray-500">이미지 없음</span>
                  </div>
                )}

                {/* 이미지 네비게이션 */}
                {feed_detail.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      disabled={currentImageIndex === 0}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full disabled:opacity-30 hover:bg-black/70 transition-colors"
                    >
                      ←
                    </button>
                    <button
                      onClick={nextImage}
                      disabled={currentImageIndex === feed_detail.images.length - 1}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full disabled:opacity-30 hover:bg-black/70 transition-colors"
                    >
                      →
                    </button>

                    {/* 이미지 인디케이터 */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                      {feed_detail.images.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`w-2 h-2 rounded-full transition-colors ${
                            index === currentImageIndex ? 'bg-white' : 'bg-white/40'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="aspect-square flex items-center justify-center">
                <span className="text-gray-500">이미지 없음</span>
              </div>
            )}
          </div>

          {/* 정보 영역 */}
          <div className="p-6 space-y-6">
            {/* 상태 배지 */}
            <div>
              <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                feed_detail.is_published === "Y"
                  ? "bg-green-600/20 text-green-400"
                  : "bg-gray-600/20 text-gray-400"
              }`}>
                {feed_detail.is_published === "Y" ? "공개" : "비공개"}
              </span>
            </div>

            {/* 제목 */}
            <h1 className="text-3xl font-bold text-white">{feed_detail.title}</h1>

            {/* 작성자 정보 */}
            <div className="flex items-center gap-3 pb-6 border-b border-gray-800">
              {feed_detail.user?.profile_image &&
               (feed_detail.user.profile_image.startsWith('http://') ||
                feed_detail.user.profile_image.startsWith('https://')) ? (
                <div className="relative w-12 h-12 rounded-full overflow-hidden">
                  <Image
                    src={feed_detail.user.profile_image}
                    alt={feed_detail.user.nickname}
                    fill
                    className="object-cover"
                    unoptimized
                    onClick={handleRedirectProfile(feed_detail.user.user_hash)}
                  />
                </div>
              ) : (
                <div className="w-12 h-12 bg-gray-700 rounded-full" />
              )}
              <div>
                <div className="text-white font-medium">{feed_detail.user?.nickname}</div>
                <div className="text-sm text-gray-400">
                  {new Date(feed_detail.created_at).toLocaleDateString("ko-KR", {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
            </div>

            {/* 통계 정보 */}
            <div className="flex items-center gap-6 py-4 border-y border-gray-800">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{feed_detail.view_count}</div>
                <div className="text-sm text-gray-400">조회수</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-pink-400">{feed_detail.like_count}</div>
                <div className="text-sm text-gray-400">좋아요</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">
                  {feed_detail.comments?.length || 0}
                </div>
                <div className="text-sm text-gray-400">댓글</div>
              </div>
            </div>

            {/* 태그 */}
            {feed_detail.tags && feed_detail.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {feed_detail.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-indigo-600/20 text-indigo-400 text-sm rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* 내용 */}
            <div className="text-gray-300 whitespace-pre-wrap leading-relaxed">
              {feed_detail.content}
            </div>
          </div>
        </div>
      </div>

      {/* 댓글 섹션 */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
        <h2 className="text-xl font-bold text-white mb-6">
          댓글 ({feed_detail.comments?.length || 0})
        </h2>

        {feed_detail.comments && feed_detail.comments.length > 0 ? (
          <div className="space-y-4">
            {feed_detail.comments.map((comment) => (
              <CommentItem key={comment.view_hash} comment={comment} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            아직 댓글이 없습니다
          </div>
        )}
      </div>
    </div>
  );
}

// 댓글 컴포넌트
function CommentItem({ comment, isReply = false }: {
  comment: any;
  isReply?: boolean;
}) {
  if (comment.deleted_at) {
    return (
      <div className={`${isReply ? 'ml-12' : ''} p-4 bg-gray-800/50 rounded-lg`}>
        <span className="text-gray-500 text-sm">삭제된 댓글입니다</span>
      </div>
    );
  }

  return (
    <div className={`${isReply ? 'ml-12' : ''}`}>
      <div className="p-4 bg-gray-800/50 rounded-lg space-y-3">
        {/* 작성자 정보 */}
        <div className="flex items-center gap-3">
          {comment.user?.profile_image &&
           (comment.user.profile_image.startsWith('http://') ||
            comment.user.profile_image.startsWith('https://')) ? (
            <div className="relative w-8 h-8 rounded-full overflow-hidden">
              <Image
                src={comment.user.profile_image}
                alt={comment.user.nickname}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          ) : (
            <div className="w-8 h-8 bg-gray-700 rounded-full" />
          )}
          <div className="flex-1">
            <div className="text-white font-medium text-sm">
              {comment.user?.nickname}
            </div>
            <div className="text-xs text-gray-400">
              {new Date(comment.created_at).toLocaleString("ko-KR")}
            </div>
          </div>
        </div>

        {/* 댓글 내용 */}
        <div className="text-gray-300 text-sm">{comment.comment}</div>
      </div>

      {/* 대댓글 */}
      {comment.children && comment.children.length > 0 && (
        <div className="mt-2 space-y-2">
          {comment.children.map((child: any) => (
            <CommentItem key={child.view_hash} comment={child} isReply={true} />
          ))}
        </div>
      )}
    </div>
  );
}