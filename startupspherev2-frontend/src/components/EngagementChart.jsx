import React from 'react';
import { X, Heart, Eye, Bookmark, TrendingUp } from 'lucide-react';

export default function EngagementChart({ data, onClose }) {
  if (!data) return null;

  return (
    <div className="absolute top-4 left-4 bg-white bg-opacity-95 backdrop-blur-md p-5 rounded-lg shadow-xl border border-gray-100 z-[10000] w-80 max-w-[90vw]">
      <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-3">
        <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-indigo-500" />
          Engagement Summary
        </h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="mb-4">
        <p className="text-sm font-medium text-gray-900 mb-1">{data.name}</p>
        <p className="text-xs text-gray-500">Grid Activity Profile</p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between p-2 rounded bg-red-50 border border-red-100">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-red-500" />
            <span className="text-sm text-gray-700 font-medium">Likes</span>
          </div>
          <span className="text-sm font-bold text-gray-900">{data.likes.toLocaleString()}</span>
        </div>

        <div className="flex items-center justify-between p-2 rounded bg-blue-50 border border-blue-100">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-blue-500" />
            <span className="text-sm text-gray-700 font-medium">Views</span>
          </div>
          <span className="text-sm font-bold text-gray-900">{data.views.toLocaleString()}</span>
        </div>

        <div className="flex items-center justify-between p-2 rounded bg-purple-50 border border-purple-100">
          <div className="flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-purple-500" />
            <span className="text-sm text-gray-700 font-medium">Bookmarks</span>
          </div>
          <span className="text-sm font-bold text-gray-900">{data.bookmarks.toLocaleString()}</span>
        </div>
      </div>

      <div className="mt-5 pt-3 border-t border-gray-100 flex justify-between items-center">
        <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Total Score</span>
        <span className="text-lg font-black text-indigo-600">{data.score.toLocaleString()}</span>
      </div>
    </div>
  );
}
