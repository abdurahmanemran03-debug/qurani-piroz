import React, { useState } from 'react';
import { Heart, ShieldCheck } from 'lucide-react';
import { SeerahChapter, SahabiBio } from '../types';

interface SeerahViewProps {
  chapters: SeerahChapter[];
  sahabaList: SahabiBio[];
}

export const SeerahView: React.FC<SeerahViewProps> = ({ chapters, sahabaList }) => {
  const [activeTab, setActiveTab] = useState<'seerah' | 'sahaba'>('seerah');

  return (
    <div className="space-y-4 max-w-xl mx-auto p-4">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold text-amber-900">سیرەی پێغەمبەر ﷺ و هاوەڵان</h2>
        <p className="text-xs text-slate-500">مێژووی زێڕینی ئیسلام بە شێوازی کتێبی دیجیتاڵی</p>
      </div>

      <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
        <button
          onClick={() => setActiveTab('seerah')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'seerah' ? 'bg-white text-amber-900 shadow-sm border border-slate-200' : 'text-slate-500'
          }`}
        >
          <Heart className="w-4 h-4" />
          <span>کتێبی سیرەی پێغەمبەر ﷺ</span>
        </button>

        <button
          onClick={() => setActiveTab('sahaba')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'sahaba' ? 'bg-white text-amber-900 shadow-sm border border-slate-200' : 'text-slate-500'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>ئینسایکڵۆپیدیای هاوەڵان</span>
        </button>
      </div>

      {activeTab === 'seerah' && (
        <div className="space-y-3">
          {chapters.map(ch => (
            <div key={ch.id} className="p-4 rounded-3xl bg-white border border-slate-200 space-y-2 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-100 text-xs flex items-center justify-center text-amber-900 font-bold">{ch.id}</span>
                  {ch.title}
                </h3>
                <span className="text-[10px] text-slate-400 font-medium">{ch.era}</span>
              </div>
              <p className="text-xs text-amber-800 font-bold">{ch.summary}</p>
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-100">
                {ch.content}
              </p>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'sahaba' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {sahabaList.map((s, i) => (
            <div key={i} className="p-3.5 rounded-2xl bg-white border border-slate-200 text-xs space-y-1 shadow-xs">
              <strong className="text-slate-900 text-xs block font-bold">{s.name}</strong>
              <span className="text-amber-800 font-bold text-[11px] block">{s.title}</span>
              <p className="text-slate-600 text-[11px] leading-relaxed">{s.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
