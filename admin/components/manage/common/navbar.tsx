// @/components/manage/common/navbar.tsx
"use client"
import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export default function Navbar() {
  const pathname = usePathname()

  const menuItems = [
    { name: "대시보드", path: "/manage/dashboard", icon: "📊" },
    { name: "사용자 관리", path: "/manage/users", icon: "👥" },
    { name: "카테고리 관리", path: "/manage/categories", icon: "📁" },
    { name: "피드 관리", path: "/manage/feeds", icon: "📝" },
    { name: "핫딜 관리", path: "/manage/hotdeals", icon: "🔥" },
    { name: "공지사항", path: "/manage/notices", icon: "📢" },
    { name: "Ai 요약관리", path: "/manage/summaries", icon: "💬" },
  ]

  return (
    <aside className="w-16 md:w-64 bg-gray-900 border-r border-gray-800 flex-shrink-0">
      <nav className="h-full overflow-y-auto py-6 px-2 md:px-4">
        <div className="space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.path
            return (
              <Link
                key={item.path}
                href={item.path}
                title={item.name}
                className={`flex items-center justify-center md:justify-start space-x-0 md:space-x-3 px-2 md:px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium hidden md:inline">{item.name}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </aside>
  )
}
