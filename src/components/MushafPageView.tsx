import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowRight, Loader2, BookOpen, Volume2, Play, Pause, 
  Bookmark, BookmarkCheck, ListFilter, X, Check, Mic, Globe, ChevronDown
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

  // لەمس بۆ پەڕە هەڵدانەوە
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);

  // مۆداڵەکان
  const [isRecitersModalOpen, setIsRecitersModalOpen] = useState(false);
  const [isTafsirSelectorOpen, setIsTafsirSelectorOpen] = useState(false);
  const [isSurahPickerOpen, setIsSurahPickerOpen] = useState(false);

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

  // پەڕەهەڵدانەوە بە لەمس (Swipe)
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEndX(null);
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStartX || !touchEndX) return;
    const distance = touchStartX - touchEndX;

    // ڕاکێشان بەرەو چەپ (distance > 40) -> لاپەڕەی دواتر (بەقەڕە)
    if (distance > 40 && currentPage < 604) {
      setLoadingPage(true);
      onNextPage();
    }
    // ڕاکێشان بەرەو ڕاست (distance < -40) -> لاپەڕەی پێشوو (فاتیحە)
    else if (distance < -40 && currentPage > 1) {
      setLoadingPage(true);
      onPrevPage();
    }
  };

  return (
    <div className="relative min-h-screen max-w-lg mx-auto flex flex-col justify-between select-none bg-white text-slate-900" dir="rtl">
      <audio ref={audioRef} onEnded={() => setIsPlayingAudio(false)} />

      {/* شریتی سەرەوە (ڕێک وەک وێنەکەت) */}
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

        <div className="flex items-center gap-1 text-slate-700">
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

      {/* ١. لاپەڕەی مەدینە - تەواو خاوێن، بێ بڕان، و لەسەر شاشەی مۆبایل ڕێکخراو */}
      {viewMode === 'mushaf' && (
        <div 
          className="relative flex-1 flex flex-col items-center justify-center p-2 cursor-pointer touch-pan-y"
          onClick={() => setShowControls(prev => !prev)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* لای چەپی شاشە کلیک بکە دەچێتە سەر لاپەڕەی دواتر (بەقەڕە) */}
          <div 
            onClick={(e) => { e.stopPropagation(); if (currentPage < 604) { setLoadingPage(true); onNextPage(); } }} 
            className="absolute left-0 top-0 bottom-0 w-1/3 z-20 cursor-pointer" 
            title="لاپەڕەی دواتر"
          />
          {/* لای ڕاستی شاشە کلیک بکە دەگەڕێتەوە سەر لاپەڕەی پێشوو (فاتیحە) */}
          <div 
            onClick={(e) => { e.stopPropagation(); if (currentPage > 1) { setLoadingPage(true); onPrevPage(); } }} 
            className="absolute right-0 top-0 bottom-0 w-1/3 z-20 cursor-pointer" 
            title="لاپەڕەی پێشوو"
          />

          {loadingPage && (
            <div className="absolute inset-0 bg-white/90 backdrop-blur-xs flex flex-col items-center justify-center gap-2 z-30">
              <Loader2 className="w-8 h-8 text-slate-600 animate-spin" />
              <span className="text-xs text-slate-700 font-bold">لاپەڕەی {currentPage} باردەکرێت...</span>
            </div>
          )}

          {/* وێنەی لاپەڕەی قورئان بە کوالیتی بەرز و بێ بڕان */}
          <div className="w-full flex items-center justify-center max-h-[82vh]">
            <img
              src={`https://android.quran.com/data/width_1260/page${formatPageNum(currentPage)}.png`}
              alt={`Page ${currentPage}`}
              onLoad={() => setLoadingPage(false)}
              className="w-full h-auto max-h-[82vh] object-contain select-none pointer-events-none mx-auto block"
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
        <div className="flex-1 overflow-y-auto p-4 space-y-6 animate-in fade-in bg-white">
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

      {/* شریتی خوارەوەی دەنگ (ڕێک وەک وێنەکەت) */}
      <footer className={`sticky bottom-0 z-30 bg-white border-t border-slate-200 px-4 py-3 flex items-center justify-between shadow-lg transition-all duration-300 ${
        showControls ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'
      }`}>
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

      {isSurahPickerOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs p-4 flex items-end sm:items-center justify-center animate-in fade-in select-none">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-5 space-y-4 max-h-[80vh] overflow-y-auto shadow-2xl text-slate-900" dir="rtl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm text-slate-900">هەڵبژاردنی سوورەت یان لاپەڕە</h3>
              <button onClick={() => setIsSurahPickerOpen(false)} className="p-1.5 rounded-xl bg-slate-100 text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {surahsList.map((s) => (
                <button
                  key={s.number}
                  onClick={() => {
                    if (onJumpToPage) onJumpToPage(s.startPage);
                    setIsSurahPickerOpen(false);
                    setLoadingPage(true);
                  }}
                  className={`p-3 rounded-2xl text-right border text-xs font-bold transition-all ${
                    currentPage >= s.startPage 
                      ? 'bg-amber-50 border-amber-200 text-amber-900' 
                      : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <span className="block text-slate-900">سورة {s.nameAr}</span>
                  <span className="text-[10px] text-slate-500 font-normal">لاپەڕەی {s.startPage}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
