import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowRight, Loader2, BookOpen, Play, Pause, 
  Bookmark, BookmarkCheck, Globe, Share2, X
} from 'lucide-react';
import { BgThemeType, AppLangType, SurahItem } from '../types';
import { ALL_RECITERS_DIRECTORY, ReciterItem } from '../data/recitersList';
import { ALL_TAFSIRS_DIRECTORY, TafsirItem } from '../data/tafsirList';
import { RecitersModal } from './RecitersModal';
import { TafsirSelectorModal } from './TafsirSelectorModal';

interface MushafPageViewProps {
  currentPage: number;
  onNextPage: () => void;
  onPrevPage: () => void;
  onBackToIndex: () => void;
  bgStyle: BgThemeType;
  appLang: AppLangType;
  showNumbers: boolean;
  surahsList?: SurahItem[];
  onJumpToPage?: (page: number) => void;
}

const formatPageNum = (n: number) => String(n).padStart(3, '0');
const pageImgUrl = (n: number) => `https://android.quran.com/data/width_1260/page${formatPageNum(n)}.png`;

const AYAH_CANVAS_WIDTH = 1260;
const AYAH_CANVAS_HEIGHT = 2020;

// نموونەی بۆکسەکانی لاپەڕەی ١ (دەتوانیت بۆ لاپەڕەکانی تریش لێرە داتاکانیان زیاد بکەیت یان فایلی کۆئۆردیناتەکەتی بۆ ڕێک بخەین)
const PAGE_BOXES_DATA: Record<number, Array<{ s: number; a: number; l: number; x0: number; x1: number; y0: number; y1: number }>> = {
  1: [
    { s: 1, a: 1, l: 2, x0: 410, x1: 854, y0: 254, y1: 333 },
    { s: 1, a: 2, l: 3, x0: 318, x1: 945, y0: 365, y1: 442 },
    { s: 1, a: 3, l: 4, x0: 648, x1: 1009, y0: 474, y1: 552 },
    { s: 1, a: 4, l: 4, x0: 254, x1: 649, y0: 474, y1: 548 },
    { s: 1, a: 5, l: 5, x0: 387, x1: 999, y0: 579, y1: 658 },
    { s: 1, a: 6, l: 5, x0: 268, x1: 388, y0: 582, y1: 656 },
    { s: 1, a: 6, l: 6, x0: 598, x1: 1004, y0: 684, y1: 786 },
    { s: 1, a: 7, l: 6, x0: 267, x1: 599, y0: 680, y1: 767 },
    { s: 1, a: 7, l: 7, x0: 363, x1: 899, y0: 797, y1: 889 },
    { s: 1, a: 7, l: 8, x0: 472, x1: 788, y0: 907, y1: 985 },
  ],
  // دەتوانیت لێرە لاپەڕەکانی تریش زیاد بکەیت بە هەمان شێواز
};

export const MushafPageView: React.FC<MushafPageViewProps> = ({
  currentPage,
  onNextPage,
  onPrevPage,
  onBackToIndex,
  bgStyle,
  appLang,
  showNumbers,
  surahsList = [],
  onJumpToPage
}) => {
  const [viewMode, setViewMode] = useState<'mushaf' | 'tafsir'>('mushaf');
  const [showControls, setShowControls] = useState(true);

  const [isRecitersModalOpen, setIsRecitersModalOpen] = useState(false);
  const [isTafsirSelectorOpen, setIsTafsirSelectorOpen] = useState(false);

  const [selectedReciter, setSelectedReciter] = useState<ReciterItem>(ALL_RECITERS_DIRECTORY[18]);
  const [selectedTafsir, setSelectedTafsir] = useState<TafsirItem>(ALL_TAFSIRS_DIRECTORY[0]);

  const [pageAyahsData, setPageAyahsData] = useState<any[]>([]);
  const [loadingTafsir, setLoadingTafsir] = useState(false);

  const [bookmarks, setBookmarks] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('quran_bookmarks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // گۆڕاوە تایبەتەکانی هایلایت و کلیکی ورد کە لە تاقیکردنەوەکەدا هەبوون
  const [selectedAyah, setSelectedAyah] = useState<{ s: number; a: number; top: number; arabic: string; tafsir: string } | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const isUpdating = useRef(false);
  const pageRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const isFirstScroll = useRef(true);
  const scrollInitiatedByUser = useRef(false);

  const isBookmarked = bookmarks.includes(currentPage);
  const currentJuz = Math.ceil(currentPage / 20);
  const currentSurah = surahsList.slice().reverse().find(s => currentPage >= s.startPage) || surahsList[0];

  const toggleBookmark = () => {
    const updated = isBookmarked ? bookmarks.filter(p => p !== currentPage) : [...bookmarks, currentPage];
    setBookmarks(updated);
    localStorage.setItem('quran_bookmarks', JSON.stringify(updated));
    if (navigator.vibrate) navigator.vibrate(35);
  };

  useEffect(() => {
    setSelectedAyah(null);
  }, [currentPage]);

  // هێنانی ئایەت و تەفسیر بۆ لاپەڕەی ئێستا
  useEffect(() => {
    async function loadPageVerses() {
      setLoadingTafsir(true);
      try {
        const tafsirEdition = (selectedTafsir as any)?.editionId || (selectedTafsir as any)?.id || 'ku.asan';
        const res = await fetch(`https://api.alquran.cloud/v1/page/${currentPage}/editions/quran-uthmani,${tafsirEdition}`);
        const data = await res.json();
        if (data.code === 200 && data.data.length >= 2) {
          const ar = data.data[0].ayahs;
          const tf = data.data[1].ayahs;
          const combined = ar.map((a: any, i: number) => ({
            surahNumber: a.surah.number,
            numberInSurah: a.numberInSurah,
            arabic: a.text,
            tafsir: tf[i]?.text || ''
          }));
          setPageAyahsData(combined);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingTafsir(false);
      }
    }
    loadPageVerses();
  }, [currentPage, selectedTafsir]);

  // کۆنتڕۆڵی ئاراستە و سووڕانەوەی لاپەڕەکان
  useEffect(() => {
    if (scrollInitiatedByUser.current) {
      scrollInitiatedByUser.current = false;
      return;
    }

    const scrollToTarget = () => {
      const el = pageRefs.current[currentPage];
      if (el) {
        isUpdating.current = true;
        el.scrollIntoView({
          behavior: isFirstScroll.current ? 'auto' : 'smooth',
          inline: 'center',
          block: 'nearest',
        });
        isFirstScroll.current = false;
        setTimeout(() => { isUpdating.current = false; }, 400);
      }
    };

    if (isFirstScroll.current) {
      const raf1 = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          scrollToTarget();
          setTimeout(() => {
            const el = pageRefs.current[currentPage];
            const container = scrollContainerRef.current;
            if (el && container) {
              const elRect = el.getBoundingClientRect();
              const containerRect = container.getBoundingClientRect();
              const isVisible = elRect.left >= containerRect.left - 5 && elRect.right <= containerRect.right + 5;
              if (!isVisible) {
                el.scrollIntoView({ behavior: 'auto', inline: 'center', block: 'nearest' });
              }
            }
          }, 250);
        });
      });
      return () => cancelAnimationFrame(raf1);
    } else {
      scrollToTarget();
    }
  }, [currentPage]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (isUpdating.current) return;
    const target = e.currentTarget;
    const scrollLeft = target.scrollLeft;
    const pageWidth = target.clientWidth;

    if (pageWidth > 0) {
      const pageIndex = Math.round(scrollLeft / pageWidth);
      const targetPage = 604 - pageIndex;

      if (targetPage >= 1 && targetPage <= 604 && targetPage !== currentPage) {
        isUpdating.current = true;
        scrollInitiatedByUser.current = true;
        if (onJumpToPage) {
          onJumpToPage(targetPage);
        } else if (targetPage > currentPage) {
          onNextPage();
        } else {
          onPrevPage();
        }
        setTimeout(() => { isUpdating.current = false; }, 300);
      }
    }
  };

  const currentBoxes = PAGE_BOXES_DATA[currentPage] || [];

  return (
    <div className="relative h-screen max-w-lg mx-auto flex flex-col justify-between select-none bg-stone-100 text-slate-900 overflow-hidden" dir="rtl">
      <audio ref={audioRef} onEnded={() => setIsPlayingAudio(false)} />

      {/* سەرەوەی کۆنتڕۆڵ */}
      <header className={`absolute top-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-2.5 flex items-center justify-between shadow-xs transition-all duration-300 ${
        showControls ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
      }`}>
        <button onClick={onBackToIndex} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-700">
          <ArrowRight className="w-5 h-5" />
        </button>

        <div className="text-center">
          <h2 className="font-bold text-sm text-slate-800">سووڕه‌تی {currentSurah?.nameAr || 'الفاتحة'}</h2>
          <p className="text-[11px] text-slate-500 font-medium">په‌ڕه‌ی {currentPage} ، جوزئی {currentJuz}</p>
        </div>

        <div className="flex items-center gap-1 text-slate-700">
          <button onClick={() => setViewMode(prev => prev === 'mushaf' ? 'tafsir' : 'mushaf')} className={`p-2 rounded-xl transition-colors ${viewMode === 'tafsir' ? 'bg-amber-100 text-amber-900' : 'hover:bg-slate-100'}`}>
            <BookOpen className="w-4 h-4" />
          </button>
          <button onClick={toggleBookmark} className={`p-2 rounded-xl ${isBookmarked ? 'text-amber-600' : 'hover:bg-slate-100'}`}>
            {isBookmarked ? <BookmarkCheck className="w-4 h-4 fill-amber-500 text-amber-600" /> : <Bookmark className="w-4 h-4" />}
          </button>
          <button onClick={() => setIsTafsirSelectorOpen(true)} className="p-2 rounded-xl hover:bg-slate-100">
            <Globe className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ناوەڕۆک و وێنەی قورئان */}
      {viewMode === 'mushaf' && (
        <div 
          className="relative flex-1 flex items-center justify-center bg-stone-200/60 overflow-hidden"
          onClick={() => { setShowControls(prev => !prev); setSelectedAyah(null); }}
        >
          <div 
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex w-full h-full overflow-x-auto snap-x snap-mandatory scrollbar-none items-center"
            style={{ direction: 'ltr' }}
          >
            {Array.from({ length: 604 }, (_, i) => {
              const pageNum = 604 - i;
              const isActivePage = pageNum === currentPage;

              return (
                <div 
                  key={pageNum}
                  ref={(el) => { pageRefs.current[pageNum] = el; }}
                  className="min-w-full h-full flex flex-col items-center justify-center snap-center snap-always p-2 shrink-0"
                  style={{ direction: 'rtl' }}
                >
                  <div className="relative max-h-[76vh]" style={{ aspectRatio: `${AYAH_CANVAS_WIDTH} / ${AYAH_CANVAS_HEIGHT}` }}>
                    <img
                      src={pageImgUrl(pageNum)}
                      alt={`Page ${pageNum}`}
                      loading="lazy"
                      className="w-full h-full max-h-[76vh] object-contain select-none shadow-xl rounded-lg bg-white border border-stone-300"
                    />

                    {/* بەشی هایلایتەکان و کرتە کردن وەک فایلی تاقیکردنەوەکە */}
                    {isActivePage && currentBoxes.length > 0 && (
                      <div className="absolute inset-0">
                        {currentBoxes.map((box, idx) => {
                          const matched = pageAyahsData.find(x => x.surahNumber === box.s && x.numberInSurah === box.a);
                          const isSelected = selectedAyah?.s === box.s && selectedAyah?.a === box.a;

                          return (
                            <div
                              key={idx}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedAyah({
                                  s: box.s,
                                  a: box.a,
                                  top: (box.y0 / AYAH_CANVAS_HEIGHT) * 100,
                                  arabic: matched?.arabic || '',
                                  tafsir: matched?.tafsir || 'تەفسیر بەردەست نییە...'
                                });
                              }}
                              style={{
                                position: 'absolute',
                                left: `${(box.x0 / AYAH_CANVAS_WIDTH) * 100}%`,
                                top: `${(box.y0 / AYAH_CANVAS_HEIGHT) * 100}%`,
                                width: `${((box.x1 - box.x0) / AYAH_CANVAS_WIDTH) * 100}%`,
                                height: `${((box.y1 - box.y0) / AYAH_CANVAS_HEIGHT) * 100}%`,
                                background: isSelected ? 'rgba(56,189,248,0.35)' : 'transparent',
                              }}
                              className="cursor-pointer"
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* پەنجەرەی نیشاندانی تفسیری ڕاستەوخۆی ئایەتە هەڵبژێردراوەکە */}
                  {isActivePage && selectedAyah && (
                    <div
                      className="absolute inset-x-4 bg-white border border-slate-300 rounded-2xl shadow-2xl p-4 z-40"
                      style={{ top: `${Math.min(selectedAyah.top + 8, 75)}%` }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md">
                          سووڕەت {selectedAyah.s} : ئایەت {selectedAyah.a}
                        </span>
                        <button onClick={() => setSelectedAyah(null)} className="p-1 text-slate-400 hover:text-slate-700">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-sm font-quran leading-relaxed text-slate-900 mb-1">{selectedAyah.arabic}</p>
                      <p className="text-xs leading-relaxed text-slate-600 border-t border-slate-100 pt-1.5">{selectedAyah.tafsir}</p>
                    </div>
                  )}

                  <span className="text-xs font-bold text-slate-700 mt-2 font-mono bg-white/90 px-3 py-1 rounded-full shadow-xs">
                    {pageNum}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* شێوازی بینینی تەفسیر بە شێوەی لیست */}
      {viewMode === 'tafsir' && (
        <div className="flex-1 overflow-y-auto p-4 pt-16 space-y-6 bg-white" dir="rtl">
          {loadingTafsir ? (
            <div className="text-center py-20">
              <Loader2 className="w-8 h-8 mx-auto text-amber-600 animate-spin" />
              <p className="text-xs text-slate-500 pt-2">تەفسیرەکان باردەکرێن...</p>
            </div>
          ) : (
            pageAyahsData.map((ayah) => (
              <div key={ayah.numberInSurah} className="space-y-3 pb-6 border-b border-slate-200 text-right">
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-mono font-bold">
                  {ayah.surahNumber}:{ayah.numberInSurah}
                </span>
                <p className="font-quran text-slate-900 text-xl leading-loose">{ayah.arabic}</p>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-700 leading-relaxed">
                  {ayah.tafsir}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* خوارەوەی کۆنتڕۆڵ */}
      <footer className={`absolute bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 px-4 py-3 flex items-center justify-between shadow-lg transition-all duration-300 ${
        showControls ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'
      }`} dir="rtl">
        <button onClick={() => setIsRecitersModalOpen(true)} className="text-xs font-bold text-slate-800 hover:text-amber-700">
          <span>{selectedReciter.name}</span>
        </button>
        <button onClick={() => setIsPlayingAudio(prev => !prev)} className="p-2.5 rounded-full bg-slate-900 text-white shadow-md">
          {isPlayingAudio ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
        </button>
      </footer>

      <RecitersModal isOpen={isRecitersModalOpen} onClose={() => setIsRecitersModalOpen(false)} selectedReciterId={selectedReciter.id} onSelectReciter={setSelectedReciter} />
      <TafsirSelectorModal isOpen={isTafsirSelectorOpen} onClose={() => setIsTafsirSelectorOpen(false)} selectedTafsirId={selectedTafsir.id} onSelectTafsir={setSelectedTafsir} />
    </div>
  );
};
