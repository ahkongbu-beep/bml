// @/components/pager.tsx
"use client"
import React from "react"

interface PagerProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

export default function Pager({ currentPage, totalPages, onPageChange, className }: PagerProps) {
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisible = 5

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      pages.push(1)

      if (currentPage > 3) {
        pages.push("...")
      }

      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)

      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      if (currentPage < totalPages - 2) {
        pages.push("...")
      }

      pages.push(totalPages)
    }

    return pages
  }

  return (
    <div className={`flex items-center justify-center gap-2 mt-4 ${className}`}>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-2 rounded-xl bg-gray-100 text-gray-600 hover:bg-gradient-to-r hover:from-pink-400 hover:to-purple-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-sm"
      >
        이전
      </button>

      {getPageNumbers().map((page, index) => (
        <React.Fragment key={index}>
          {typeof page === "number" ? (
            <button
              onClick={() => onPageChange(page)}
              className={`px-4 py-2 rounded-xl font-medium transition-all text-sm ${
                currentPage === page
                  ? "bg-gradient-to-r from-pink-400 to-purple-400 text-white shadow-md"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {page}
            </button>
          ) : (
            <span className="px-2 text-gray-400">...</span>
          )}
        </React.Fragment>
      ))}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-2 rounded-xl bg-gray-100 text-gray-600 hover:bg-gradient-to-r hover:from-pink-400 hover:to-purple-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-sm"
      >
        다음
      </button>
    </div>
  )
}
