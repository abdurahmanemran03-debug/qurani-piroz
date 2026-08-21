import React, { useState } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { BgThemeType, AppLangType } from '../types';

interface MushafPageViewProps {
  currentPage: number;
  onNextPage: () => void;
  onPrevPage: () => void;
  onBackToIndex: () => void;
  bgStyle: BgThemeType;
  appLang: AppLangType;
  showNumbers: boolean;
}

export const MushafPageView: React.FC<MushafPageViewProps> = ({
  currentPage,
  onNextPage,
  onPrevPage,
  onBackToIndex,
  bgStyle,
  appLang,
  showNumbers
}) => {
  const [loadingPage, setLoadingPage] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const formatPageNum = (n: number) => String(n).padStart(3, '0');

  // سیستەمی پەڕەهەڵدانەوە بە پەنجە ڕاکێشان
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartX) return;
    const touchEndX = e.changedTouches[0].clientX;
    const distance = touchStartX - touchEndX;

    if (distance > 45) {
      setLoadingPage(true);
      onNextPage(); // ڕاکێشان بۆ چەپ -> پەڕەی دواتر
    } else if (distance < -45) {
      setLoadingPage(true);
      onPrevPage(); // ڕاکێشان بۆ ڕاست -> پەڕەی پێشوو
    }
  };

  return (
    <div 
      className="max-w-lg mx-auto p-2 sm:p-3 min-h-screen flex flex-col justify-between select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* شریتی سەرەوە */}
      <div className="flex items-center justify-between border border-slate-200 bg-white p-2 rounded-2xl shadow-xs">
        <button
          onClick={onBackToIndex}
          className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200"
        >
          <ArrowRight className="w-4 h-4" />
          <span>{appLang === 'ar' ? 'فهرس السور' : (appLang === 'en' ? 'Surah Index' : 'پێڕستی سوورەتەکان')}</span>
        </button>

        {showNumbers && (
          <span className="text-xs font-bold text-slate-700">
            {appLang === 'en' ? `Page ${currentPage} of 604` : `لاپەڕەی ${currentPage} لە ٦٠٤`}
          </span>
        )}
      </div>

      {/* وێنەی لاپەڕەی مەدینە */}
      <div className="relative my-2 rounded-3xl overflow-hidden flex flex-col items-center justify-center">
        {/* کلیکی سەر شاشە */}
        <div onClick={() => { setLoadingPage(true); onNextPage(); }} className="absolute left-0 top-0 bottom-0 w-1/3 z-20 cursor-pointer" />
        <div onClick={() => { setLoadingPage(true); onPrevPage(); }} className="absolute right-0 top-0 bottom-0 w-1/3 z-20 cursor-pointer" />

        {loadingPage && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-xs flex flex-col items-center justify-center gap-2 z-30">
            <Loader2 className="w-8 h-8 text-slate-600 animate-spin" />
            <span className="text-xs text-slate-700 font-bold">لاپەڕەی {currentPage} باردەکرێت...</span>
          </div>
        )}

        <img
          src={`https://android.quran.com/data/width_1260/page${formatPageNum(currentPage)}.png`}
          alt={`Page ${currentPage}`}
          onLoad={() => setLoadingPage(false)}
          className="w-full h-auto max-h-[82vh] object-contain select-none pointer-events-none"
          style={
            bgStyle === 'white'
              ? { filter: 'grayscale(100%) contrast(115%) brightness(102%)', mixBlendMode: 'multiply' }
              : bgStyle === 'dark'
              ? { filter: 'invert(1) hue-rotate(180deg) contrast(120%)' }
              : undefined
          }
        />
      </div>

      <div className="text-center py-1 text-[11px] text-slate-400">
        <span>👆 پەنجەت بە ڕاست و چەپدا ڕابکێشە بۆ پەڕەهەڵدانەوە</span>
      </div>
    </div>
  );
};
