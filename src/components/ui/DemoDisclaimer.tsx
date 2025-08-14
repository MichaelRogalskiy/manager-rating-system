'use client';

import { useState } from 'react';

interface DemoDisclaimerProps {
  isVisible: boolean;
  onDismiss: () => void;
}

export function DemoDisclaimer({ isVisible, onDismiss }: DemoDisclaimerProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-amber-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">
                🎭 <strong>Демонстраційний режим</strong>
              </p>
              <p className="text-xs text-amber-100 mt-1">
                База даних недоступна. Використовуються тестові дані з українськими менеджерами для демонстрації функціоналу.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <a
              href="https://github.com/MichaelRogalskiy/manager-rating-system"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition-colors duration-200"
            >
              📂 GitHub
            </a>
            <button
              onClick={onDismiss}
              className="p-1 hover:bg-white/20 rounded-full transition-colors duration-200"
              aria-label="Закрити повідомлення"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}