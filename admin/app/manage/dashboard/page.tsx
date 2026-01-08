// @/app/manage/dashboard/page.tsx
"use client"
import React, { useEffect } from "react";

import { useDashboard } from "@/hooks/useDashboard";

export default function DashboardPage() {
  const { loading, initStat, fetchInitStat } = useDashboard();

  useEffect(() => {
    fetchInitStat();
  }, []);

  return (
    <div className="space-y-6">
      {/* 대시보드 헤더 */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">대시보드</h2>
        <p className="text-gray-400">BML 관리자 대시보드에 오신 것을 환영합니다</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 hover:border-gray-700 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-indigo-600/20 rounded-xl flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
            <h3 className="text-gray-400 text-sm font-medium mb-1">총 사용자</h3>
          </div>
          <p className="text-3xl font-bold text-white">{initStat?.total_users || 0}명</p>
        </div>

        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 hover:border-gray-700 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-600/20 rounded-xl flex items-center justify-center">
              <span className="text-2xl">📝</span>
            </div>
            <h3 className="text-gray-400 text-sm font-medium mb-1">총 피드</h3>
          </div>
          <p className="text-3xl font-bold text-white">{initStat?.total_feeds || 0}건</p>
        </div>

        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 hover:border-gray-700 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-pink-600/20 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🔥</span>
            </div>
            <h3 className="text-gray-400 text-sm font-medium mb-1">진행중 핫딜</h3>
          </div>
          <p className="text-3xl font-bold text-white">{initStat?.total_hotdeals || 0}개</p>
        </div>

      </div>

      {/* 최근 활동 & 빠른 작업 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 최근 활동 */}
        <div className="lg:col-span-2 bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h3 className="text-xl font-bold text-white mb-4">최근 활동</h3>
          <div className="space-y-4">
            {[
              { type: "피드", action: "새 피드가 등록되었습니다", time: initStat?.last_regist_feed_time || "", icon: "📝" },
              { type: "사용자", action: "신규 회원 가입", time: initStat?.last_regist_user_time || "", icon: "👤" },
              { type: "공지", action: "새 공지사항 발행", time: initStat?.last_regist_notice_time || "", icon: "📢" },
            ].map((activity, index) => (
              <div key={index} className="flex items-center space-x-4 p-3 rounded-xl hover:bg-gray-800 transition-colors">
                <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">{activity.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{activity.action}</p>
                  <p className="text-gray-400 text-sm">{activity.type}</p>
                </div>
                <span className="text-gray-500 text-sm whitespace-nowrap">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}