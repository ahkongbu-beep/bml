// @/components/manage/common/navbar.tsx
"use client"
import React, { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

type MenuItem = { name: string; path: string; icon: string }
type MenuGroup = { name: string; icon: string; children: MenuItem[] }
type MenuEntry = MenuItem | MenuGroup

function isGroup(entry: MenuEntry): entry is MenuGroup {
  return "children" in entry
}

export default function Navbar() {
  const pathname = usePathname()

  const menuItems: MenuEntry[] = [
    { name: "대시보드", path: "/manage/dashboard", icon: "📊" },
    { name: "사용자 관리", path: "/manage/users", icon: "👥" },
    { name: "카테고리 관리", path: "/manage/categories", icon: "📁" },
    { name: "알레르기", path: "/manage/allergies", icon: "⚠️" },
    {
      name: "광고관리", icon: "🔥",
      children: [
        { name: "광고주 관리", path: "/manage/advertisers", icon: "👤" },
        { name: "광고 내역 관리", path: "/manage/ads", icon: "📋" },
      ],
    },
    {
      name: "재료 관리", icon: "🥗",
      children: [
        { name: "요청 재료", path: "/manage/ingredients", icon: "📥" },
        { name: "재료 목록", path: "/manage/org_ingredients", icon: "📦" },
      ],
    },
    { name: "피드 관리", path: "/manage/feeds", icon: "📝" },
//    { name: "Ai 요약관리", path: "/manage/summaries", icon: "💬" },
    { name: "공지 관리", path: "/manage/notices", icon: "📢" },
  ]

  const isGroupActive = (group: MenuGroup) =>
    group.children.some((child) => pathname === child.path)

  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    const initial = new Set<string>()
    menuItems.forEach((entry) => {
      if (isGroup(entry) && entry.children.some((c) => pathname === c.path)) {
        initial.add(entry.name)
      }
    })
    return initial
  })

  const toggleGroup = (name: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  return (
    <aside className="w-16 md:w-64 bg-gray-900 border-r border-gray-800 flex-shrink-0">
      <nav className="h-full overflow-y-auto py-6 px-2 md:px-4">
        <div className="space-y-2">
          {menuItems.map((entry) => {
            if (isGroup(entry)) {
              const active = isGroupActive(entry)
              const open = openGroups.has(entry.name)
              return (
                <div key={entry.name}>
                  <button
                    onClick={() => toggleGroup(entry.name)}
                    title={entry.name}
                    className={`w-full flex items-center justify-center md:justify-between px-2 md:px-4 py-3 rounded-xl transition-all duration-200 ${
                      active
                        ? "bg-indigo-600/20 text-indigo-400"
                        : "text-gray-400 hover:text-white hover:bg-gray-800"
                    }`}
                  >
                    <div className="flex items-center space-x-0 md:space-x-3">
                      <span className="text-xl">{entry.icon}</span>
                      <span className="font-medium hidden md:inline">{entry.name}</span>
                    </div>
                    <span className="hidden md:inline text-xs transition-transform duration-200"
                      style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
                    >
                      ▼
                    </span>
                  </button>
                  {open && (
                    <div className="mt-1 ml-0 md:ml-4 space-y-1">
                      {entry.children.map((child) => {
                        const childActive = pathname === child.path
                        return (
                          <Link
                            key={child.path}
                            href={child.path}
                            title={child.name}
                            className={`flex items-center justify-center md:justify-start space-x-0 md:space-x-3 px-2 md:px-4 py-2.5 rounded-xl transition-all duration-200 ${
                              childActive
                                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                                : "text-gray-400 hover:text-white hover:bg-gray-800"
                            }`}
                          >
                            <span className="text-lg">{child.icon}</span>
                            <span className="text-sm font-medium hidden md:inline">{child.name}</span>
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            }

            const isActive = pathname === entry.path
            return (
              <Link
                key={entry.path}
                href={entry.path}
                title={entry.name}
                className={`flex items-center justify-center md:justify-start space-x-0 md:space-x-3 px-2 md:px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                }`}
              >
                <span className="text-xl">{entry.icon}</span>
                <span className="font-medium hidden md:inline">{entry.name}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </aside>
  )
}
