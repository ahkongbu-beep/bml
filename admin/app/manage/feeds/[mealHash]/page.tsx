"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Image from "next/image";
import { FeedDetail } from "@/libs/interface/feeds";
import { useFeed } from "@/hooks/useFeed";
import { getStaticImage } from "@/libs/utils/common";
/*
 * 피드 상세페이지
 * - 피드의 상세 정보를 보여줍니다.
    * - 피드 ID를 URL 파라미터로 받아와서 표시합니다.
    * 뒤로가기 링크 제공
    * 피드와 관련된 댓글 또한 함께 조회
    * 피드 이미지가 여러장이라면 슬라이더 형태로 표시
    * 피드 수정 및 삭제 기능 (추후 구현)
    * 화면구성은 상품 상세페이지와 유사하게하며, 댓글리스트는 하단에 배치

    backend 데이터 구조
{
    "success": true,
    "message": "식단 상세 조회 성공",
    "error": null,
    "data": {
        "meal": {
            "meal_id": 90,
            "category_code": "20",
            "category_name": "저녁",
            "user_id": 82,
            "nickname": "백호아빠",
            "username": "",
            "user_hash": "088aceb2d32c3291ccf6297700d68c33eee358dc479ea7792d9fd049c43ad79f",
            "profile_image": "/attaches/Users/82/82/20260527023736_1f9b8b56",
            "is_published": "Y",
            "input_date": "2026-05-28",
            "meal_stage": 2,
            "meal_stage_detail": "home",
            "image_url": [
                "/attaches/Meals/90/90/20260527145753_f0e31c28"
            ],
            "contents": "Test",
            "month": "2026-05",
            "meal_condition": "0",
            "view_count": 2,
            "like_count": 2,
            "is_public": "Y",
            "is_active": "Y",
            "created_at": "2026-05-27 23:57:53",
            "updated_at": "2026-05-28 09:54:05",
            "deleted_at": null,
            "view_hash": "951f72e1a2bb8d402c4952176f91d67d699a03db566d09794cb6c0386ebc638c"
        },
        "comments": [
            {
                "meal_id": 90,
                "parent_id": 0,
                "comment": "우오ㅓ",
                "created_at": "2026-05-28T00:42:50",
                "updated_at": "2026-05-28T00:42:50",
                "deleted_at": null,
                "is_owner": false,
                "view_hash": "4dca93ce239b7168df4718857194df8f2a632afe0b234cf872f151f0e7790867",
                "parent_hash": "",
                "user": {
                    "id": null,
                    "nickname": "백호아빠",
                    "profile_image": "/attaches/Users/82/82/20260527023736_1f9b8b56",
                    "user_hash": "088aceb2d32c3291ccf6297700d68c33eee358dc479ea7792d9fd049c43ad79f"
                },
                "children": [
                    {
                        "meal_id": 90,
                        "parent_id": 15,
                        "comment": "하하",
                        "created_at": "2026-05-28T01:07:58",
                        "updated_at": "2026-05-28T01:07:58",
                        "deleted_at": null,
                        "is_owner": false,
                        "view_hash": "13d287e9ba823884226f6ca910525d272ad25366e76d8ccd5a19b30d199d898a",
                        "parent_hash": "4dca93ce239b7168df4718857194df8f2a632afe0b234cf872f151f0e7790867",
                        "user": {
                            "id": null,
                            "nickname": "백호아빠",
                            "profile_image": "/attaches/Users/82/82/20260527023736_1f9b8b56",
                            "user_hash": "088aceb2d32c3291ccf6297700d68c33eee358dc479ea7792d9fd049c43ad79f"
                        },
                        "children": []
                    }
                ]
            },
            {
                "meal_id": 90,
                "parent_id": 0,
                "comment": "RORO",
                "created_at": "2026-05-28T01:07:48",
                "updated_at": "2026-05-28T01:07:48",
                "deleted_at": null,
                "is_owner": false,
                "view_hash": "f932da70ea746584d7585eb2d214a9ea5cf9c55497eb39f70225c25f75a6639d",
                "parent_hash": "",
                "user": {
                    "id": null,
                    "nickname": "백호아빠",
                    "profile_image": "/attaches/Users/82/82/20260527023736_1f9b8b56",
                    "user_hash": "088aceb2d32c3291ccf6297700d68c33eee358dc479ea7792d9fd049c43ad79f"
                },
                "children": []
            }
        ]
    }
}
*/
export default function FeedDetailPage() {
  const params = useParams();
  const mealHash = params?.mealHash as string;
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { feed_detail, loading, error, fetchFeedDetail } = useFeed();

  useEffect(() => {
    if (mealHash) {
      fetchFeedDetail(mealHash);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mealHash]);

  const handleRedirectProfile = (user_hash: string | null) => () => {
    if (user_hash) {
      window.open(`/manage/users/profile/${user_hash}`, '_blank');
    }
  };

  const nextImage = () => {
    if (feed_detail?.image_url && currentImageIndex < feed_detail.image_url.length - 1) {
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
    console.log("feed_detail", feed_detail);

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
            {feed_detail.image_url && feed_detail.image_url.length > 0 ? (
              <div className="relative aspect-square">
                {feed_detail.image_url[currentImageIndex] &&
                 (feed_detail.image_url[currentImageIndex]) ? (
                  <Image
                    src={getStaticImage("small", feed_detail.image_url[currentImageIndex])}
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
                {feed_detail.image_url.length > 1 && (
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
                      disabled={currentImageIndex === feed_detail.image_url.length - 1}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full disabled:opacity-30 hover:bg-black/70 transition-colors"
                    >
                      →
                    </button>

                    {/* 이미지 인디케이터 */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                      {feed_detail.image_url.map((_, index) => (
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
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                (feed_detail.is_public ?? feed_detail.is_published) === "Y"
                  ? "bg-green-600/20 text-green-400"
                  : "bg-gray-600/20 text-gray-400"
              }`}>
                {(feed_detail.is_public ?? feed_detail.is_published) === "Y" ? "공개" : "비공개"}
              </span>
              {feed_detail.category_name && (
                <span className="px-3 py-1 text-xs font-medium rounded-full bg-indigo-600/20 text-indigo-400">
                  {feed_detail.category_name}
                </span>
              )}
              {feed_detail.input_date && (
                <span className="text-xs text-gray-400">{feed_detail.input_date}</span>
              )}
            </div>

            {/* 내용 */}
            <h1 className="text-3xl font-bold text-white">{feed_detail.title}</h1>

            {/* 작성자 정보 */}
            <div className="flex items-center gap-3 pb-6 border-b border-gray-800">
              {feed_detail?.profile_image ? (
                <div className="relative w-12 h-12 rounded-full overflow-hidden cursor-pointer" onClick={handleRedirectProfile(feed_detail?.user_hash ?? null)}>
                  <Image
                    src={getStaticImage("thumbnail", feed_detail.profile_image)}
                    alt={feed_detail?.nickname ?? ""}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="w-12 h-12 bg-gray-700 rounded-full" />
              )}
              <div>
                <div className="text-white font-medium">{feed_detail?.nickname}</div>
                <div className="text-sm text-gray-400">
                  {new Date(feed_detail?.created_at).toLocaleDateString("ko-KR", {
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
                <div className="text-2xl font-bold text-white">{feed_detail?.view_count}</div>
                <div className="text-sm text-gray-400">조회수</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-pink-400">{feed_detail?.like_count}</div>
                <div className="text-sm text-gray-400">좋아요</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">
                  {feed_detail?.comments?.length || 0}
                </div>
                <div className="text-sm text-gray-400">댓글</div>
              </div>
            </div>

            {/* 태그 */}
            {feed_detail?.tags && feed_detail.tags.length > 0 && (
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
              {feed_detail?.content}
            </div>
          </div>
        </div>
      </div>

      {/* 댓글 섹션 */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
        <h2 className="text-xl font-bold text-white mb-6">
          댓글 ({feed_detail?.comments?.length || 0})
        </h2>

        {feed_detail?.comments && feed_detail.comments.length > 0 ? (
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
          {comment.user?.profile_image ? (
            <div className="relative w-8 h-8 rounded-full overflow-hidden">
              <Image
                src={getStaticImage("thumbnail", comment.user.profile_image)}
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