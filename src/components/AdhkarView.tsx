import React from 'react';
import { RotateCcw, CheckCircle2, Volume2 } from 'lucide-react';
import { DhikrCategory } from '../types';

interface AdhkarViewProps {
  categories: DhikrCategory[];
  activeCat: string;
  onSelectCat: (id: string) => void;
  counts: Record<string, number>;
  onCount: (id: string, max: number) => void;
  onReset: (id: string) => void;
}

export const AdhkarView: React.FC<AdhkarViewProps> = ({
  categories,
  activeCat,
  onSelectCat,
  counts,
  onCount,
  onReset
}) => {
  const currentCategory = categories.find(c => c.id === activeCat) || categories[0];

  return (
    <div className="space-y-4 max-w-xl mx-auto p-4">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold text-amber-900">ئینسایکڵۆپیدیای زیکرەکان</h2>
        <p className="text-xs text-slate-500">قەڵای موسڵمان بە تەسبیحی لەرزۆک و پاداشتی چاکە</p>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => onSelectCat(cat.id)}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
              activeCat === cat.id
                ? 'bg-amber-600 text-white shadow-md scale-102'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {cat.title}
          </button>
        ))}
      </div>

      <div className="space-y-3.5">
        {currentCategory.items.map(item => {
          const currentCount = counts[item.id] || 0;
          const isCompleted = currentCount >= item.count;
          return (
            <div 
              key={item.id} 
              className={`p-5 rounded-3xl border transition-all space-y-3 bg-white shadow-xs ${
                isCompleted ? 'border-emerald-500/60 bg-emerald-50/20' : 'border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <span className="text-xs font-bold text-amber-800">دووبارەکردنەوە: {item.count} جار</span>
                {isCompleted && (
                  <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> تەواو بوو
                  </span>
                )}
              </div>

              <p className="text-xl font-quran text-slate-900 leading-loose text-right">
                {item.arabic}
              </p>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed text-right bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                {item.kurdish}
              </p>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => onCount(item.id, item.count)}
                  disabled={isCompleted}
                  className={`flex-1 py-3.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-transform active:scale-95 ${
                    isCompleted 
                      ? 'bg-emerald-600/20 text-emerald-800 border border-emerald-300' 
                      : 'bg-amber-600 hover:bg-amber-700 text-white shadow-md'
                  }`}
                >
                  <span>تەسبیح بکە ({currentCount} / {item.count})</span>
                </button>

                <button
                  onClick={() => onReset(item.id)}
                  className="p-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200"
                  title="سفرکردنەوە"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
