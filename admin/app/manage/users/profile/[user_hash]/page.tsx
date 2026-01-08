"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Image from "next/image";

/*
 * 사용자 프로필 페이지 (관리자용)
 * 사용자 정보를 조회하기 위한 페이지
 * 사용자가 등록한 feed 정보, 작성한 댓글 정보를 함께 보여줄꺼야
 * 아래 샘플을 참조하여 화면을 구성해줘
 * backend 연동 코드는 내가 작성할예정이니 신경쓰지마
 * backend 샘플
{
    "user": {
        "sns_login_type": "EMAIL",
        "sns_id": "test55",
        "address": "",
        "name": "테스트5",
        "nickname": "테스트5",
        "email": "test55@naver.com",
        "phone": "01055555555",
        "role": "USER",
        "profile_image": "http://10.11.1.62:8000/attaches/users/9/20251208161803_f66029e5.jpeg",
        "description": "",
        "is_active": 1,
        "child_birth": null,
        "child_gender": "M",
        "child_age_group": 4,
        "marketing_agree": 0,
        "push_agree": 0,
        "created_at": "2025-12-08T16:18:03",
        "updated_at": "2025-12-08T16:18:03",
        "last_login_at": "2025-12-19T15:51:40",
        "deleted_at": null,
        "view_hash": "546f41bd860c2319bb800369fc055d8b0c21d0143f94c1029d0052afd85b35c1"
    },
    "comments": [
        {
            "feed_id": 11,
            "parent_id": null,
            "comment": "첫 번째 댓글입니다.",
            "created_at": "2025-12-09T08:39:29",
            "updated_at": "2025-12-10T01:16:23",
            "deleted_at": null,
            "is_owner": true,
            "view_hash": "45ktnkj24ntj2ntj69fc055d8b0c21d0143f94c1029d0052afd85b35c12afd85",
            "parent_hash": "",
            "children": []
        },
        {
            "feed_id": 11,
            "parent_id": 0,
            "comment": "tset",
            "created_at": "2025-12-10T15:02:51",
            "updated_at": "2025-12-10T15:02:51",
            "deleted_at": null,
            "is_owner": true,
            "view_hash": "c37984b3b7ac6be682834713dac80be3e6ed4a0779fd8b6b4691130d9336d7b5",
            "parent_hash": "",
            "children": []
        },
        {
            "feed_id": 11,
            "parent_id": 3,
            "comment": "tset",
            "created_at": "2025-12-10T15:03:52",
            "updated_at": "2025-12-10T16:50:28",
            "deleted_at": "2025-12-10T16:50:27",
            "is_owner": true,
            "view_hash": "60a947e2af59636a4dd55065cec35b6623663de4dd78d0aa78693a4e8abc2d97",
            "parent_hash": "c37984b3b7ac6be682834713dac80be3e6ed4a0779fd8b6b4691130d9336d7b5",
            "children": []
        },
        {
            "feed_id": 11,
            "parent_id": 0,
            "comment": "야야",
            "created_at": "2025-12-11T17:29:51",
            "updated_at": "2025-12-11T17:29:51",
            "deleted_at": null,
            "is_owner": true,
            "view_hash": "f37b314344adf327d837ba2c01bfd5ed8b693e91ca2cccb5d9fa7b62cbd8e1b0",
            "parent_hash": "",
            "children": []
        }
    ],
    "feeds": [
        {
            "id": 17,
            "user_id": 9,
            "title": "테스트",
            "content": "테스트",
            "is_published": "Y",
            "view_count": 9,
            "like_count": 0,
            "created_at": "2025-12-17T15:20:43",
            "updated_at": "2025-12-23T09:28:35",
            "is_liked": false,
            "tags": [],
            "images": [
                "http://10.11.1.62:8000/attaches/feeds/17/17/099f91a5ed6852a9e66347c8d33308708eda67b146c051b823ea2798b5c97276.jpeg?iid=20"
            ],
            "user_hash": null,
            "user": {
                "nickname": "테스트5",
                "profile_image": "http://10.11.1.62:8000/attaches/users/9/20251208161803_f66029e5.jpeg",
                "user_hash": "546f41bd860c2319bb800369fc055d8b0c21d0143f94c1029d0052afd85b35c1"
            },
            "comments": []
        },
        {
            "id": 16,
            "user_id": 9,
            "title": "고량주2",
            "content": "고량주2",
            "is_published": "Y",
            "view_count": 7,
            "like_count": 0,
            "created_at": "2025-12-17T15:19:54",
            "updated_at": "2025-12-23T09:35:52",
            "is_liked": false,
            "tags": [
                "고량주"
            ],
            "images": [
                "http://10.11.1.62:8000/attaches/feeds/16/16/400de800ace1efe0ed0f19c6332c80fe5ce2adc0b739033ee622526f68f9012b.jpeg?iid=19"
            ],
            "user_hash": null,
            "user": {
                "nickname": "테스트5",
                "profile_image": "http://10.11.1.62:8000/attaches/users/9/20251208161803_f66029e5.jpeg",
                "user_hash": "546f41bd860c2319bb800369fc055d8b0c21d0143f94c1029d0052afd85b35c1"
            },
            "comments": []
        },
        {
            "id": 15,
            "user_id": 9,
            "title": "고량주",
            "content": "고량주",
            "is_published": "Y",
            "view_count": 3,
            "like_count": 0,
            "created_at": "2025-12-17T15:16:59",
            "updated_at": "2025-12-18T15:32:46",
            "is_liked": false,
            "tags": [
                "고량주"
            ],
            "images": [
                "http://10.11.1.62:8000/attaches/feeds/15/15/37ce75fea12f6a553f803a8a360dded14422e60d30e240ab99d6a4ca487ce76d.jpeg?iid=18"
            ],
            "user_hash": null,
            "user": {
                "nickname": "테스트5",
                "profile_image": "http://10.11.1.62:8000/attaches/users/9/20251208161803_f66029e5.jpeg",
                "user_hash": "546f41bd860c2319bb800369fc055d8b0c21d0143f94c1029d0052afd85b35c1"
            },
            "comments": []
        },
        {
            "id": 14,
            "user_id": 9,
            "title": "치킨2",
            "content": "치킨2",
            "is_published": "Y",
            "view_count": 4,
            "like_count": 1,
            "created_at": "2025-12-17T15:15:43",
            "updated_at": "2025-12-19T15:55:22",
            "is_liked": false,
            "tags": [
                "치킨"
            ],
            "images": [
                "http://10.11.1.62:8000/attaches/feeds/14/14/2314caef91ff68aa77c86cd94e74be6c5e58e0ba95de90ff1c6aab94f4ef3d5b.jpeg?iid=17"
            ],
            "user_hash": null,
            "user": {
                "nickname": "테스트5",
                "profile_image": "http://10.11.1.62:8000/attaches/users/9/20251208161803_f66029e5.jpeg",
                "user_hash": "546f41bd860c2319bb800369fc055d8b0c21d0143f94c1029d0052afd85b35c1"
            },
            "comments": []
        },
        {
            "id": 13,
            "user_id": 9,
            "title": "치킨",
            "content": "치킨",
            "is_published": "Y",
            "view_count": 0,
            "like_count": 1,
            "created_at": "2025-12-17T15:07:51",
            "updated_at": "2025-12-18T15:30:25",
            "is_liked": false,
            "tags": [
                "치킨"
            ],
            "images": [
                "http://10.11.1.62:8000/attaches/feeds/13/13/ec15d3c685bc536622a33075ba543bcfdbe5811b69b02f4e8dc77f5add55f11b.jpeg?iid=16"
            ],
            "user_hash": null,
            "user": {
                "nickname": "테스트5",
                "profile_image": "http://10.11.1.62:8000/attaches/users/9/20251208161803_f66029e5.jpeg",
                "user_hash": "546f41bd860c2319bb800369fc055d8b0c21d0143f94c1029d0052afd85b35c1"
            },
            "comments": []
        },
        {
            "id": 12,
            "user_id": 9,
            "title": "나의 앱자랑",
            "content": "이야아야이양",
            "is_published": "Y",
            "view_count": 0,
            "like_count": 0,
            "created_at": "2025-12-11T17:41:42",
            "updated_at": "2025-12-11T18:47:10",
            "is_liked": false,
            "tags": [
                "신도림",
                "내앱자랑",
                "술먹음",
                "얻어먹장"
            ],
            "images": [
                "http://10.11.1.62:8000/attaches/feeds/12/12/2d568ac4e48739b827442cf29f53f1cfc7cf222c702b644d8a8fdbc3ceb3834d.jpeg?iid=15"
            ],
            "user_hash": null,
            "user": {
                "nickname": "테스트5",
                "profile_image": "http://10.11.1.62:8000/attaches/users/9/20251208161803_f66029e5.jpeg",
                "user_hash": "546f41bd860c2319bb800369fc055d8b0c21d0143f94c1029d0052afd85b35c1"
            },
            "comments": []
        }
    ]
}
 */

// 샘플 데이터 (백엔드 연동 전 임시)
const SAMPLE_DATA = {
  user: {
    sns_login_type: "EMAIL",
    sns_id: "test55",
    address: "",
    name: "테스트5",
    nickname: "테스트5",
    email: "test55@naver.com",
    phone: "01055555555",
    role: "USER",
    profile_image: "http://10.11.1.62:8000/attaches/users/9/20251208161803_f66029e5.jpeg",
    description: "",
    is_active: 1,
    child_birth: null,
    child_gender: "M",
    child_age_group: 4,
    marketing_agree: 0,
    push_agree: 0,
    created_at: "2025-12-08T16:18:03",
    updated_at: "2025-12-08T16:18:03",
    last_login_at: "2025-12-19T15:51:40",
    deleted_at: null,
    view_hash: "546f41bd860c2319bb800369fc055d8b0c21d0143f94c1029d0052afd85b35c1"
  },
  comments: [
    {
      feed_id: 11,
      parent_id: null,
      comment: "첫 번째 댓글입니다.",
      created_at: "2025-12-09T08:39:29",
      updated_at: "2025-12-10T01:16:23",
      deleted_at: null,
      is_owner: true,
      view_hash: "45ktnkj24ntj2ntj69fc055d8b0c21d0143f94c1029d0052afd85b35c12afd85",
      parent_hash: "",
      children: []
    },
    {
      feed_id: 11,
      parent_id: 0,
      comment: "tset",
      created_at: "2025-12-10T15:02:51",
      updated_at: "2025-12-10T15:02:51",
      deleted_at: null,
      is_owner: true,
      view_hash: "c37984b3b7ac6be682834713dac80be3e6ed4a0779fd8b6b4691130d9336d7b5",
      parent_hash: "",
      children: []
    }
  ],
  feeds: [
    {
      id: 17,
      user_id: 9,
      title: "테스트",
      content: "테스트",
      is_published: "Y",
      view_count: 9,
      like_count: 0,
      created_at: "2025-12-17T15:20:43",
      updated_at: "2025-12-23T09:28:35",
      is_liked: false,
      tags: [],
      images: [
        "http://10.11.1.62:8000/attaches/feeds/17/17/099f91a5ed6852a9e66347c8d33308708eda67b146c051b823ea2798b5c97276.jpeg?iid=20"
      ],
      user_hash: null,
      user: {
        nickname: "테스트5",
        profile_image: "http://10.11.1.62:8000/attaches/users/9/20251208161803_f66029e5.jpeg",
        user_hash: "546f41bd860c2319bb800369fc055d8b0c21d0143f94c1029d0052afd85b35c1"
      },
      comments: []
    }
  ]
};

export default function UserProfilePage() {
  const params = useParams();
  const userHash = params?.user_hash as string;
  const [activeTab, setActiveTab] = useState<'feeds' | 'comments'>('feeds');

  // TODO: 백엔드 연동 시 실제 데이터 fetch
  const data = SAMPLE_DATA;
  const { user, feeds, comments } = data;

  return (
    <div className="space-y-6 pb-10">
      {/* 뒤로가기 헤더 */}
      <div className="flex items-center gap-4">
        <Link
          href="/manage/users"
          className="text-indigo-500 hover:text-indigo-400 transition-colors flex items-center gap-2"
        >
          <span>←</span>
          <span>사용자 목록</span>
        </Link>
      </div>

      {/* 사용자 프로필 정보 */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* 프로필 이미지 */}
          <div className="flex-shrink-0">
            {user.profile_image &&
             (user.profile_image.startsWith('http://') ||
              user.profile_image.startsWith('https://')) ? (
              <div className="relative w-32 h-32 rounded-full overflow-hidden">
                <Image
                  src={user.profile_image}
                  alt={user.nickname}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <div className="w-32 h-32 bg-gray-700 rounded-full flex items-center justify-center">
                <span className="text-4xl text-gray-500">👤</span>
              </div>
            )}
          </div>

          {/* 사용자 기본 정보 */}
          <div className="flex-1 space-y-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-white">{user.name}</h1>
                <span className="text-gray-400">@{user.nickname}</span>
                <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                  user.is_active
                    ? "bg-green-600/20 text-green-400"
                    : "bg-red-600/20 text-red-400"
                }`}>
                  {user.is_active ? "활성" : "비활성"}
                </span>
                <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-600/20 text-blue-400">
                  {user.role}
                </span>
              </div>
              {user.description && (
                <p className="text-gray-400 text-sm">{user.description}</p>
              )}
            </div>

            {/* 연락처 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-500 mb-1">이메일</div>
                <div className="text-white">{user.email}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">전화번호</div>
                <div className="text-white">{user.phone}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">로그인 타입</div>
                <div className="text-white">{user.sns_login_type}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">SNS ID</div>
                <div className="text-white">{user.sns_id}</div>
              </div>
            </div>

            {/* 날짜 정보 */}
            <div className="flex flex-wrap gap-4 text-sm">
              <div>
                <span className="text-gray-500">가입일: </span>
                <span className="text-white">
                  {new Date(user.created_at).toLocaleDateString("ko-KR")}
                </span>
              </div>
              <div>
                <span className="text-gray-500">마지막 로그인: </span>
                <span className="text-white">
                  {new Date(user.last_login_at).toLocaleDateString("ko-KR")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 통계 정보 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 text-center">
          <div className="text-2xl font-bold text-white">{feeds.length}</div>
          <div className="text-sm text-gray-400">작성한 피드</div>
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 text-center">
          <div className="text-2xl font-bold text-white">{comments.length}</div>
          <div className="text-sm text-gray-400">작성한 댓글</div>
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 text-center">
          <div className="text-2xl font-bold text-white">
            {feeds.reduce((sum, feed) => sum + feed.like_count, 0)}
          </div>
          <div className="text-sm text-gray-400">받은 좋아요</div>
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 text-center">
          <div className="text-2xl font-bold text-white">
            {feeds.reduce((sum, feed) => sum + feed.view_count, 0)}
          </div>
          <div className="text-sm text-gray-400">총 조회수</div>
        </div>
      </div>

      {/* 탭 메뉴 */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        <div className="flex border-b border-gray-800">
          <button
            onClick={() => setActiveTab('feeds')}
            className={`flex-1 px-6 py-4 font-medium transition-colors ${
              activeTab === 'feeds'
                ? 'bg-indigo-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            피드 ({feeds.length})
          </button>
          <button
            onClick={() => setActiveTab('comments')}
            className={`flex-1 px-6 py-4 font-medium transition-colors ${
              activeTab === 'comments'
                ? 'bg-indigo-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            댓글 ({comments.length})
          </button>
        </div>

        {/* 탭 컨텐츠 */}
        <div className="p-6">
          {activeTab === 'feeds' ? (
            <div className="space-y-4">
              {feeds.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  작성한 피드가 없습니다
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {feeds.map((feed) => (
                    <Link
                      key={feed.id}
                      href={`/manage/feeds/${feed.id}`}
                      className="bg-gray-800 rounded-lg overflow-hidden hover:ring-2 hover:ring-indigo-500 transition-all"
                    >
                      {/* 피드 이미지 */}
                      {feed.images && feed.images.length > 0 && feed.images[0] &&
                       (feed.images[0].startsWith('http://') ||
                        feed.images[0].startsWith('https://')) ? (
                        <div className="relative aspect-video">
                          <Image
                            src={feed.images[0]}
                            alt={feed.title}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      ) : (
                        <div className="aspect-video bg-gray-700 flex items-center justify-center">
                          <span className="text-gray-500">No Image</span>
                        </div>
                      )}

                      {/* 피드 정보 */}
                      <div className="p-4 space-y-2">
                        <h3 className="font-medium text-white truncate">{feed.title}</h3>
                        <p className="text-sm text-gray-400 line-clamp-2">{feed.content}</p>

                        {/* 통계 */}
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>👁️ {feed.view_count}</span>
                          <span>❤️ {feed.like_count}</span>
                          <span>{new Date(feed.created_at).toLocaleDateString("ko-KR")}</span>
                        </div>

                        {/* 태그 */}
                        {feed.tags && feed.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {feed.tags.slice(0, 3).map((tag, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-indigo-600/20 text-indigo-400 text-xs rounded"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {comments.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  작성한 댓글이 없습니다
                </div>
              ) : (
                comments.map((comment) => (
                  <div
                    key={comment.view_hash}
                    className="bg-gray-800 rounded-lg p-4 space-y-3"
                  >
                    {comment.deleted_at ? (
                      <div className="text-gray-500 text-sm">삭제된 댓글입니다</div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between">
                          <Link
                            href={`/manage/feeds/${comment.feed_id}`}
                            className="text-indigo-400 hover:text-indigo-300 text-sm transition-colors"
                          >
                            피드 #{comment.feed_id} 보기 →
                          </Link>
                          <span className="text-xs text-gray-500">
                            {new Date(comment.created_at).toLocaleString("ko-KR")}
                          </span>
                        </div>
                        <div className="text-white">{comment.comment}</div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}