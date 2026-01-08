// @/components/manage/common/footer.tsx
"use client"
import React from "react"

export default function Footer() {
  return (
    <footer className="bg-gray-900 border-t border-gray-800 mt-auto">
      <div className="px-6 py-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-400">
            <p>© 2025 BML (Baby Meal List). All rights reserved.</p>
          </div>

          <div className="flex items-center gap-6 text-sm text-gray-400">
            <a href="#" className="hover:text-white transition-colors rounded-lg px-2 py-1">
              개인정보처리방침
            </a>
            <a href="#" className="hover:text-white transition-colors rounded-lg px-2 py-1">
              이용약관
            </a>
            <a href="#" className="hover:text-white transition-colors rounded-lg px-2 py-1">
              고객지원
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}