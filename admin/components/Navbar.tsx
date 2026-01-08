"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { menuItems } from "@/libs/codes/menuItem";

export default function Navbar() {
  const pathname = usePathname();

  // 메인 페이지에서는 Navbar 숨김
  if (pathname === "/client") {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-around py-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex flex-col items-center justify-center space-y-1 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? "text-pink-500"
                    : "text-gray-500 hover:text-pink-400"
                }`}
              >
                <div className={isActive ? "scale-110 transition-transform" : ""}>
                  {item.svg_icon}
                </div>
                <span className="text-xs font-medium">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
