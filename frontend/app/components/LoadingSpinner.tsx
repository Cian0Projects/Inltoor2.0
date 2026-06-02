'use client';

export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center gap-3">
      <div className="relative w-5 h-5">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-spin" />
        <div className="absolute inset-1 bg-white rounded-full" />
      </div>
      <span className="text-sm font-semibold text-gray-600 animate-pulse">Calculating...</span>
    </div>
  );
}
