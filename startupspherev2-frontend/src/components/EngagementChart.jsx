import React from 'react';
import { X, Heart, Eye, Bookmark, TrendingUp, Sparkles, Facebook, Globe } from 'lucide-react';

export default function EngagementChart({ data, onClose }) {
  if (!data) return null;

  const colorHex = data.colorHex || data.heatmapColorHex || '#2563eb';
  const colorName = data.colorName || data.heatmapColor || 'Blue';
  const hasFbLink = Boolean(data.facebook && typeof data.facebook === 'string' && data.facebook.trim() !== '');
  const fbLikes = hasFbLink ? (data.facebookLikes !== undefined ? data.facebookLikes : 0) : 0;
  const ssLikes = data.startupSphereLikes !== undefined ? data.startupSphereLikes : (data.likes || 0);
  const totalLikes = hasFbLink ? (Number(fbLikes) + Number(ssLikes)) : Number(ssLikes);
  const score = hasFbLink ? (data.score !== undefined ? data.score : (data.engagementScore || 0)) : (Number(totalLikes) + Number(data.views || 0) + Number(data.bookmarks || 0));
  const views = data.views !== undefined ? data.views : 0;
  const bookmarks = data.bookmarks !== undefined ? data.bookmarks : 0;

  return (
    <div className="absolute top-16 left-3 md:left-5 bg-white/95 backdrop-blur-md p-5 rounded-2xl shadow-2xl border border-gray-200/90 z-[1000] w-88 max-w-[calc(100vw-28px)] text-gray-800 transition-all duration-300 animate-in fade-in zoom-in-95">
      {/* Header */}
      <div className="flex justify-between items-start gap-2 mb-3.5 pb-3 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="p-1 rounded-lg bg-indigo-50 text-indigo-600">
              <TrendingUp className="w-4 h-4" />
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
              Engagement Details
            </span>
          </div>
          <h3 className="text-base font-bold text-gray-900 leading-snug line-clamp-2">
            {data.name || "Business"}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors cursor-pointer shrink-0"
          title="Close details"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Engagement Summary Score Card with Heatmap Color Pill */}
      <div className="mb-4 p-3.5 rounded-xl bg-slate-900 text-white flex items-center justify-between shadow-sm relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full opacity-20 blur-xl" style={{ backgroundColor: colorHex }}></div>
        <div>
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-0.5">
            Engagement Summary Score
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {Number(score).toLocaleString()}
            </span>
            <span className="text-xs text-slate-400">pts</span>
          </div>
        </div>

        {/* Solid Color Classification Pill */}
        <div className="flex flex-col items-end gap-1">
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold text-white shadow-xs"
            style={{ backgroundColor: colorHex }}
          >
            <span className="w-2 h-2 rounded-full bg-white/90"></span>
            <span>{colorName}</span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium">Heatmap Color (60% Opacity)</span>
        </div>
      </div>

      {/* Metrics Breakdown Grid */}
      <div className="space-y-2.5">
        {/* Total Likes with Breakdown */}
        <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-100/80">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-rose-500 fill-rose-500/20" />
              <span className="text-xs font-bold text-rose-950">Total Likes</span>
            </div>
            <span className="text-sm font-extrabold text-rose-950">
              {Number(totalLikes).toLocaleString()}
            </span>
          </div>
          {hasFbLink ? (
            <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-rose-200/50 text-[11px]">
              <div className="flex items-center justify-between bg-white/70 px-2 py-1 rounded-lg">
                <span className="text-gray-500 flex items-center gap-1">
                  <Facebook className="w-3 h-3 text-blue-600" />
                  <span>Facebook</span>
                </span>
                <span className="font-bold text-gray-800">{Number(fbLikes).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between bg-white/70 px-2 py-1 rounded-lg">
                <span className="text-gray-500 flex items-center gap-1">
                  <Globe className="w-3 h-3 text-indigo-600" />
                  <span>StartUpSphere</span>
                </span>
                <span className="font-bold text-gray-800">{Number(ssLikes).toLocaleString()}</span>
              </div>
            </div>
          ) : (
            <div className="mt-2 pt-2 border-t border-rose-200/50 text-[11px]">
              <div className="flex items-center justify-between bg-white/70 px-2.5 py-1 rounded-lg">
                <span className="text-gray-500 flex items-center gap-1">
                  <Globe className="w-3 h-3 text-indigo-600" />
                  <span>StartUpSphere Platform Likes</span>
                </span>
                <span className="font-bold text-gray-800">{Number(ssLikes).toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>

        {/* Total Views */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-sky-50/70 border border-sky-100/80">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-sky-100 text-sky-600">
              <Eye className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-xs font-bold text-sky-950 block">Total Views</span>
              <span className="text-[10px] text-sky-700/80">Profile impressions on platform</span>
            </div>
          </div>
          <span className="text-sm font-extrabold text-sky-950">
            {Number(views).toLocaleString()}
          </span>
        </div>

        {/* Total Bookmarks */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-purple-50/70 border border-purple-100/80">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-purple-100 text-purple-600">
              <Bookmark className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-xs font-bold text-purple-950 block">Total Bookmarks</span>
              <span className="text-[10px] text-purple-700/80">Saved by platform users</span>
            </div>
          </div>
          <span className="text-sm font-extrabold text-purple-950">
            {Number(bookmarks).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-3.5 pt-2.5 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-500 font-medium">
        <span className="flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-indigo-500" />
          <span>Independent Business Metric</span>
        </span>
        <span className="text-indigo-600 font-semibold">Constant Screen Size</span>
      </div>
    </div>
  );
}
