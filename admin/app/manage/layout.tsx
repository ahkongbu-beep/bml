// @/app/manage/layout.tsx
"use client"
import React from "react"
import { Toaster } from "react-hot-toast"
import QueryProvider from "@/libs/providers/QueryProvider"
import Header from "@/components/manage/common/header"
import Navbar from "@/components/manage/common/navbar"
import Footer from "@/components/manage/common/footer"

export default function ManageLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <QueryProvider>
      <div className="min-h-screen bg-gray-950 flex flex-col">
        <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#1f2937",
            color: "#fff",
            border: "1px solid #374151",
            borderRadius: "12px",
          },
          success: {
            iconTheme: {
              primary: "#10b981",
              secondary: "#fff",
            },
          },
          error: {
            iconTheme: {
              primary: "#ef4444",
              secondary: "#fff",
            },
          },
        }}
      />
      <Header />

      <div className="flex flex-1">
        <Navbar />

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      <Footer />
      </div>
    </QueryProvider>
  )
}
