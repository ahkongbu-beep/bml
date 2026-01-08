"use client";

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 pb-20">
      <div className="max-w-md mx-auto px-4 py-6">
        <div className="text-center space-y-2">
          <p className="text-xs text-gray-500">
            © 2025 Baby Meal List. All rights reserved.
          </p>
          <div className="flex items-center justify-center space-x-4 text-xs text-gray-600">
            <button className="hover:text-pink-500 transition-colors">이용약관</button>
            <span className="text-gray-300">|</span>
            <button className="hover:text-pink-500 transition-colors">개인정보처리방침</button>
          </div>
        </div>
      </div>
    </footer>
  );
}
