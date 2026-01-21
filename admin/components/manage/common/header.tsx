// @/components/manage/common/header.tsx
"use client"
import React from "react"

export default function Header() {
  const appName = process.env.EXPO_PUBLIC_APP_NAME || "";
  const appEmail = process.env.EXPO_PUBLIC_APP_EMAIL || "";
  return (
    <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
      <div className="container mx-auto px-4 md:px-6 py-3 md:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 md:space-x-4">
            <h1 className="text-lg md:text-2xl font-bold text-white">{appName} Admin</h1>
            <span className="hidden sm:inline-block px-3 py-1 text-xs font-medium text-gray-300 bg-gray-800 rounded-full">
              관리자 페이지
            </span>
          </div>

          <div className="flex items-center space-x-2 md:space-x-4">
            <button className="px-2 md:px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors rounded-lg hover:bg-gray-800">
              <span className="hidden sm:inline">알림</span>
              <span className="sm:hidden">🔔</span>
            </button>
            <div className="flex items-center space-x-2 md:space-x-3">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-xs md:text-sm">A</span>
              </div>
              <div className="text-sm hidden md:block">
                <p className="text-white font-medium">관리자</p>
                <p className="text-gray-400 text-xs">{appEmail}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
