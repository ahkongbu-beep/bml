"use client";

import Link from "next/link";

export default function Header() {
  const appName = process.env.EXPO_PUBLIC_APP_NAME || "";
  return (
    <header className="fixed top-0 left-0 right-0 bg-white shadow-sm z-40">
      <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/client" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-pink-400 to-purple-400 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">{appName}</span>
          </div>
          <span className="text-lg font-bold text-gray-800">Baby Meal List</span>
        </Link>

        <div className="flex items-center space-x-3">
          {/* 알림 아이콘 */}
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
