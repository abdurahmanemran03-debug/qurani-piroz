import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowRight, Loader2, BookOpen, Volume2, Play, Pause, 
  Bookmark, BookmarkCheck, ListFilter, X, Check, Mic, Globe
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
  const [loadingPage, setLoadingPage] = useState(false);
  const [showControls, setShowControls] = useState(true);

  // سیستەمی لەمس و ئەنیمەیشنی چەمانەوەی لاپەڕە (3D Flip)
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const [flipAnimation, setFlipAnimation] = useState<'next' | 'prev' | null>(null);

  // مۆداڵەکان
  const [isRecitersModalOpen, setIsRecitersModalOpen] = useState(false);
  const [isTafsirSelectorOpen, setIsTafsirSelectorOpen] = useState(false);

  const [selectedReciter, setSelectedReciter] = useState<ReciterItem>(ALL_RECITERS_DIRECTORY[18]);
  const [selectedTafsir, setSelectedTafsir] = useState<TafsirItem>(ALL_TAFSIRS_DIRECTORY[0]);

  const [pageAyahsData, setPageAyahsData] = useState<any[]>([]);
  const [loadingTafsir, setLoadingTafsir] = useState(false);

  // بووکمارک
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

  const isBookmarked = bookmarks.includes(currentPage);
  const formatPageNum = (n: number) => String(n).padStart(3, '0');
  const currentJuz = Math.ceil(currentPage / 20);

  const currentSurah = surahsList.slice().reverse().find(s => currentPage >= s.startPage) || surahsList[0];

  const toggleBookmark = () => {
    let updated: number[];
    if (isBookmarked) {
      updated = bookmarks.filter(p => p !== currentPage);
    } else {
      updated = [...bookmarks, currentPage];
    }
    setBookmarks(updated);
    localStorage.setItem('quran_bookmarks', JSON.stringify(updated));
    if (navigator.vibrate) navigator.vibrate(35);
  };

  // بارکردنی تەفسیر
  useEffect(() => {
    async function loadPageVerses() {
      setLoadingTafsir(true);
      try {
        const res = await fetch(`https://api.alquran.cloud/v1/page/${currentPage}/editions/quran-uthmani,ku.asan`);
        const data = await res.json();
        if (data.code === 200 && data.data.length >= 2) {
          const ar = data.data[0].ayahs;
          const ku = data.data[1].ayahs;
          const combined = ar.map((a: any, i: number) => ({
            surahNumber: a.surah.number,
            numberInSurah: a.numberInSurah,
            arabic: a.text,
            asanTafsir: ku[i]?.text || 'بە ناوی خودای بەخشندەی میهرەبان...'
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
  }, [currentPage]);

  // دەنگ
  const togglePageAudio = () => {
    if (isPlayingAudio) {
      audioRef.current?.pause();
      setIsPlayingAudio(false);
    } else {
      setIsPlayingAudio(true);
      if (audioRef.current) {
        audioRef.current.src = `https://everyayah.com/data/${selectedReciter.serverKey}/PageMp3s/Page${formatPageNum(currentPage)}.mp3`;
        audioRef.current.play().catch(() => {
          setIsPlayingAudio(false);
        });
      }
    }
  };

  // دەستپێکی لەمس
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const currentX = e.targetTouches[0].clientX;
    setDragOffset(currentX - touchStartX);
  };

  // هەڵدانەوەی لاپەڕە بە پەنجە ڕاکێشان (هاوشێوەی پەنجەلێدان: چەپ = دواتر، ڕاست = پێشوو)
  const handleTouchEnd = () => {
    setIsDragging(false);
    if (dragOffset < -35) {
      // ڕاکێشان بۆ چەپ ⬅️ -> لاپەڕەی دواتر (بەقەڕە)
      triggerPageTurn('next');
    } else if (dragOffset > 35) {
      // ڕاکێشان بۆ ڕاست ➡️ -> لاپەڕەی پێشوو (فاتیحە)
      triggerPageTurn('prev');
    }
    setDragOffset(0);
    setTouchStartX(null);
  };

  const triggerPageTurn = (direction: 'next' | 'prev') => {
    setFlipAnimation(direction);
    setTimeout(() => {
      setLoadingPage(true);
      if (direction === 'next') onNextPage();
      else onPrevPage();
      setFlipAnimation(null);
    }, 200);
  };

  // ئەژمارکردنی چەمانەوەی ٣ ڕەهەندی لاپەڕەکە
  const getPageTransform = () => {
    if (isDragging) {
      const rotateDeg = (dragOffset / 300) * 20; // چەمانەوە لە کاتی ڕاکێشان
      return {
        transform: `perspective(1200px) rotateY(${rotateDeg}deg) translateX(${dragOffset * 0.8}px)`,
        transition: 'none'
      };
    }
    if (flipAnimation === 'next') {
      return {
        transform: 'perspective(1200px) rotateY(-35deg) translateX(-60px)',
        opacity: 0.6,
        transition: 'all 0.22s ease-out'
      };
    }
    if (flipAnimation === 'prev') {
      return {
        transform: 'perspective(1200px) rotateY(35deg) translateX(60px)',
        opacity: 0.6,
        transition: 'all 0.22s ease-out'
      };
    }
    return {
      transform: 'perspective(1200px) rotateY(0deg) translateX(0px)',
      opacity: 1,
      transition: 'all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)'
    };
  };

  return (
    <div className="relative min-h-screen max-w-lg mx-auto flex flex-col justify-between overflow-hidden select-none bg-white text-slate-900" dir="rtl">
      <audio ref={audioRef} onEnded={() => setIsPlayingAudio(false)} />

      {/* شریتی سەرەوە */}
      <header className={`sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-3 py-2.5 flex items-center justify-between shadow-xs transition-all duration-300 ${
        showControls ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
      }`}>
        <button
          onClick={onBackToIndex}
          className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-700 transition-colors"
          title="گەڕانەوە"
        >
          <ArrowRight className="w-5 h-5" />
        </button>

        <div className="text-center">
          <h2 className="font-bold text-sm text-slate-800">
            سووڕه‌تی {currentSurah?.nameAr || 'الفاتحة'}
          </h2>
          <p className="text-[11px] text-slate-500 font-medium">
            په‌ڕه‌ی {currentPage} , جوزئی {currentJuz}
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-slate-700">
          <button
            onClick={() => setViewMode(prev => prev === 'mushaf' ? 'tafsir' : 'mushaf')}
            className={`p-2 rounded-xl transition-colors ${
              viewMode === 'tafsir' ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'hover:bg-slate-100'
            }`}
            title="تەفسیر"
          >
            <BookOpen className="w-4 h-4" />
          </button>

          <button
            onClick={toggleBookmark}
            className={`p-2 rounded-xl transition-colors ${
              isBookmarked ? 'text-amber-600' : 'hover:bg-slate-100'
            }`}
            title="نیشانەکردن"
          >
            {isBookmarked ? <BookmarkCheck className="w-4 h-4 fill-amber-500 text-amber-600" /> : <Bookmark className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setIsTafsirSelectorOpen(true)}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-700"
            title="تەفسیرەکان"
          >
            <Globe className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ١. لاپەڕەی موسحەف بە هەڵدانەوەی نەرمی ٣ ڕەهەندی */}
      {viewMode === 'mushaf' && (
        <div 
          className="relative flex-1 flex flex-col items-center justify-center p-2 cursor-pointer touch-pan-y"
          onClick={() => setShowControls(prev => !prev)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* پەنجەدان لە لای چەپ = دەچێتە بەقەڕە / لاپەڕەی دواتر */}
          <div 
            onClick={(e) => { e.stopPropagation(); triggerPageTurn('next'); }} 
            className="absolute left-0 top-0 bottom-0 w-2/5 z-20 cursor-pointer" 
            title="لاپەڕەی دواتر"
          />
          {/* پەنجەدان لە لای ڕاست = دەگەڕێتەوە فاتیحە / لاپەڕەی پێشوو */}
          <div 
            onClick={(e) => { e.stopPropagation(); triggerPageTurn('prev'); }} 
            className="absolute right-0 top-0 bottom-0 w-2/5 z-20 cursor-pointer" 
            title="لاپەڕەی پێشوو"
          />

          {loadingPage && (
            <div className="absolute inset-0 bg-white/95 backdrop-blur-xs flex flex-col items-center justify-center gap-2 z-30">
              <Loader2 className="w-8 h-8 text-slate-600 animate-spin" />
              <span className="text-xs text-slate-700 font-bold">لاپەڕەی {currentPage} باردەکرێت...</span>
            </div>
          )}

          {/* کانتینەری لاپەڕەکە بە سێبەر و چەمانەوەی کتێب */}
          <div 
            className="w-full origin-center relative rounded-3xl"
            style={getPageTransform()}
          >
            {/* سێبەری چەمانەوەی کاغەز لە کاتی هەڵدانەوەدا */}
            {isDragging && (
              <div 
                className="absolute inset-0 z-10 pointer-events-none rounded-3xl"
                style={{
                  background: dragOffset < 0
                    ? 'linear-gradient(to left, rgba(0,0,0,0.08), transparent)'
                    : 'linear-gradient(to right, rgba(0,0,0,0.08), transparent)'
                }}
              />
            )}

            <img
              src={`https://android.quran.com/data/width_1260/page${formatPageNum(currentPage)}.png`}
              alt={`Page ${currentPage}`}
              onLoad={() => setLoadingPage(false)}
              className="w-full h-auto max-h-[82vh] object-contain select-none pointer-events-none drop-shadow-sm"
              style={{
                filter: 'grayscale(100%) contrast(115%) brightness(102%)',
                mixBlendMode: 'multiply'
              }}
            />
          </div>
        </div>
      )}

      {/* ٢. شێوازی تەفسیر ئایەت بە ئایەت */}
      {viewMode === 'tafsir' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-6 animate-in fade-in">
          {loadingTafsir ? (
            <div className="text-center py-20">
              <Loader2 className="w-8 h-8 mx-auto text-amber-600 animate-spin" />
              <p className="text-xs text-slate-500 pt-2">تەفسیرەکان باردەکرێن...</p>
            </div>
          ) : (
            pageAyahsData.map((ayah) => (
              <div key={ayah.numberInSurah} className="space-y-3 pb-6 border-b border-slate-200 text-right">
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 text-xs font-mono font-bold">
                  {ayah.surahNumber}:{ayah.numberInSurah}
                </span>
                <p className="font-quran text-slate-900 text-xl sm:text-2xl leading-loose">
                  {ayah.arabic}
                </p>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-700 leading-relaxed">
                  <strong className="text-amber-800 block mb-1">تەفسیری کوردی:</strong>
                  {ayah.asanTafsir}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* شریتی خوارەوەی دەنگ */}
      <footer className="sticky bottom-0 z-30 bg-white border-t border-slate-200 px-4 py-3 flex items-center justify-between shadow-lg">
        <button 
          onClick={() => setIsRecitersModalOpen(true)}
          className="text-xs sm:text-sm font-bold text-slate-800 hover:text-amber-700 transition-colors flex items-center gap-1.5"
        >
          <span>{selectedReciter.name} (متصل)</span>
        </button>

        <button
          onClick={togglePageAudio}
          className="p-2 rounded-full bg-slate-900 text-white hover:bg-slate-800 transition-transform active:scale-95"
        >
          {isPlayingAudio ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
        </button>
      </footer>

      <RecitersModal
        isOpen={isRecitersModalOpen}
        onClose={() => setIsRecitersModalOpen(false)}
        selectedReciterId={selectedReciter.id}
        onSelectReciter={(r) => setSelectedReciter(r)}
      />

      <TafsirSelectorModal
        isOpen={isTafsirSelectorOpen}
        onClose={() => setIsTafsirSelectorOpen(false)}
        selectedTafsirId={selectedTafsir.id}
        onSelectTafsir={(t) => setSelectedTafsir(t)}
      />

    </div>
  );
};
