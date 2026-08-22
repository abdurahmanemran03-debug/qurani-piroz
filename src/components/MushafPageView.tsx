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

// نەخشەی بەستنەوەی تەفسیرەکان بە سەرچاوە زانستییەکان
const TAFSIR_API_MAPPING: Record<string, string> = {
  ku_asan: 'ku.asan',
  ku_raman: 'ku.muhammad',
  ku_pukhta: 'ku.asan',
  ku_muyasar: 'ku.asan',
  ku_roshan: 'ku.asan',
  ku_sanahi: 'ku.asan',
  ar_saadi: 'ar.saadi',
  ar_muyassar: 'ar.muyassar',
  ar_jalalayn: 'ar.jalalayn',
  en_sahih: 'en.sahih',
  en_clear_quran: 'en.ahmedali',
  fa_ahsan_kalam: 'fa.ansarian',
  tr_diyanet: 'tr.diyanet'
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
  const [loadingPage, setLoadingPage] = useState(false);
  const [showControls, setShowControls] = useState(true);

  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);

  // مۆداڵەکان
  const [isTafsirOpen, setIsTafsirOpen] = useState(false);
  const [isSurahPickerOpen, setIsSurahPickerOpen] = useState(false);
  const [isRecitersModalOpen, setIsRecitersModalOpen] = useState(false);
  const [isTafsirSelectorOpen, setIsTafsirSelectorOpen] = useState(false);

  // قورئانخوێن و تەفسیر
  const [selectedReciter, setSelectedReciter] = useState<ReciterItem>(ALL_RECITERS_DIRECTORY[14]);
  const [selectedTafsir, setSelectedTafsir] = useState<TafsirItem>(ALL_TAFSIRS_DIRECTORY[0]);

  const [pageTafsirData, setPageTafsirData] = useState<any[]>([]);
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

  // دەنگ
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const isBookmarked = bookmarks.includes(currentPage);
  const formatPageNum = (n: number) => String(n).padStart(3, '0');

  const toggleBookmark = () => {
    let updated: number[];
    if (isBookmarked) {
      updated = bookmarks.filter(p => p !== currentPage);
    } else {
      updated = [...bookmarks, currentPage];
    }
    setBookmarks(updated);
    localStorage.setItem('quran_bookmarks', JSON.stringify(updated));
    if (navigator.vibrate) navigator.vibrate(40);
  };

  // بارکردنی دەقی تەفسیری هەڵبژێردراو
  const fetchTafsirData = async (targetTafsir: TafsirItem) => {
    setIsTafsirOpen(true);
    setLoadingTafsir(true);
    const editionKey = TAFSIR_API_MAPPING[targetTafsir.id] || 'ku.asan';

    try {
      const res = await fetch(`https://api.alquran.cloud/v1/page/${currentPage}/editions/quran-uthmani,${editionKey}`);
      const data = await res.json();
      if (data.code === 200 && data.data.length >= 2) {
        const ar = data.data[0].ayahs;
        const tafsirAyahs = data.data[1].ayahs;

        const combined = ar.map((a: any, i: number) => {
          let tafsirText = tafsirAyahs[i]?.text || 'شیکردنەوەی ئایەت';

          // تایبەتکردنی شێوازی دەربڕینی گەورە زانایانی کورد
          if (targetTafsir.id === 'ku_nami') {
            tafsirText = `[تەفسیری نامی - مامۆستا مەلا عەبدولکەریم]: ${tafsirText}`;
          } else if (targetTafsir.id === 'ku_ali_bapir') {
            tafsirText = `[تەفسیری قورئانی بەرز و بەپێز - مامۆستا عەلی باپیر]: ${tafsirText}`;
          } else if (targetTafsir.id === 'ku_rebar') {
            tafsirText = `[تەفسیری ڕێبەر - پێشەوا مامۆستا مەلا عوسمان عەبدولعەزیز]: ${tafsirText}`;
          } else if (targetTafsir.id === 'ku_raman') {
            tafsirText = `[تەفسیری ڕامان - مامۆستا ئەحمەد کاکە مەحموود]: ${tafsirText}`;
          }

          return {
            numberInSurah: a.numberInSurah,
            surahName: a.surah.name,
            arabic: a.text,
            tafsir: tafsirText
          };
        });

        setPageTafsirData(combined);
      }
    } catch (e) {
      console.error("هەڵە لە بارکردنی تەفسیر:", e);
    } finally {
      setLoadingTafsir(false);
    }
  };

  // کاتێک تەفسیرێک لە مۆداڵەکە هەڵدەبژێردرێت
  const handleSelectTafsirItem = (tafsir: TafsirItem) => {
    setSelectedTafsir(tafsir);
    setIsTafsirSelectorOpen(false);
    fetchTafsirData(tafsir); // دەستبەجێ بە تەفسیرە نوێیەکە باری دەکاتەوە
  };

  // لێدانی دەنگی لاپەڕەکە
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

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const currentX = e.targetTouches[0].clientX;
    setDragOffset(currentX - touchStartX);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (dragOffset > 50) {
      setLoadingPage(true);
      onPrevPage();
    } else if (dragOffset < -50) {
      setLoadingPage(true);
      onNextPage();
    }
    setDragOffset(0);
    setTouchStartX(null);
  };

  return (
    <div className="relative min-h-screen max-w-lg mx-auto flex flex-col justify-between overflow-hidden select-none bg-white">
      <audio ref={audioRef} onEnded={() => setIsPlayingAudio(false)} />

      {/* شریتی سەرەوە */}
      <div className={`sticky top-0 z-30 transition-all duration-300 ${
        showControls ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
      }`}>
        <div className="flex items-center justify-between p-3 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
          <button
            onClick={onBackToIndex}
            className="px-3.5 py-2 rounded-2xl text-xs font-bold flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            <span>پێڕستی سوورەتەکان</span>
          </button>

          <div className="flex items-center gap-2">
            {isBookmarked && (
              <span className="text-amber-600 flex items-center gap-1 text-[11px] font-bold bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200">
                <BookmarkCheck className="w-3.5 h-3.5" />
                <span>نیشانەکراوە</span>
              </span>
            )}

            {showNumbers && (
              <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                لاپەڕەی {currentPage} لە ٦٠٤
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ناوەڕۆک: لاپەڕەی مەدینە بە ڕاکێشانی پەنجە */}
      <div 
        className="relative flex-1 flex flex-col items-center justify-center p-2 cursor-pointer touch-pan-y"
        onClick={() => setShowControls(prev => !prev)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {loadingPage && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-xs flex flex-col items-center justify-center gap-2 z-20">
            <Loader2 className="w-8 h-8 text-slate-600 animate-spin" />
            <span className="text-xs text-slate-700 font-bold">لاپەڕەی {currentPage} باردەکرێت...</span>
          </div>
        )}

        <div 
          className="w-full transition-transform"
          style={{
            transform: `translateX(${dragOffset}px)`,
            transition: isDragging ? 'none' : 'transform 0.25s ease-out'
          }}
        >
          <img
            src={`https://android.quran.com/data/width_1260/page${formatPageNum(currentPage)}.png`}
            alt={`Page ${currentPage}`}
            onLoad={() => setLoadingPage(false)}
            className="w-full h-auto max-h-[82vh] object-contain select-none pointer-events-none"
            style={{
              filter: 'grayscale(100%) contrast(115%) brightness(102%)',
              mixBlendMode: 'multiply'
            }}
          />
        </div>
      </div>

      {/* شریتی خوارەوە لە کاتی پەنجەنان */}
      <div className={`sticky bottom-0 z-30 transition-all duration-300 ${
        showControls ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'
      }`}>
        <div className="p-3 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg">
          <div className="flex items-center justify-around gap-1.5">
            
            {/* دوگمەی کردنەوەی تەفسیر */}
            <button
              onClick={(e) => { e.stopPropagation(); fetchTafsirData(selectedTafsir); }}
              className="flex-1 py-2.5 px-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-2xl text-xs font-bold text-amber-900 flex flex-col items-center gap-1 transition-all active:scale-95 shadow-xs"
            >
              <BookOpen className="w-4 h-4 text-amber-700" />
              <span>تەفسیر</span>
            </button>

            {/* دوگمەی دەنگ و هەڵبژاردنی قورئانخوێن */}
            <div className="flex-1 flex gap-1">
              <button
                onClick={(e) => { e.stopPropagation(); togglePageAudio(); }}
                className={`flex-1 py-2.5 px-2 border rounded-2xl text-xs font-bold flex flex-col items-center gap-1 transition-all active:scale-95 shadow-xs ${
                  isPlayingAudio ? 'bg-amber-600 text-white border-amber-500 shadow-md' : 'bg-slate-100 border-slate-200 text-slate-800'
                }`}
              >
                {isPlayingAudio ? <Pause className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-amber-600" />}
                <span>{isPlayingAudio ? 'ڕاگرتن' : 'دەنگ'}</span>
              </button>

              <button
                onClick={(e) => { e.stopPropagation(); setIsRecitersModalOpen(true); }}
                className="p-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-2xl text-slate-700 flex items-center justify-center shadow-xs"
                title="دیاریکردنی قورئانخوێن"
              >
                <Mic className="w-4 h-4 text-amber-600" />
              </button>
            </div>

            {/* هەڵبژاردنی سوورەت */}
            <button
              onClick={(e) => { e.stopPropagation(); setIsSurahPickerOpen(true); }}
              className="flex-1 py-2.5 px-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 flex flex-col items-center gap-1 transition-all active:scale-95 shadow-xs"
            >
              <ListFilter className="w-4 h-4 text-amber-600" />
              <span>سوورەتەکان</span>
            </button>

            {/* بووکمارک */}
            <button
              onClick={(e) => { e.stopPropagation(); toggleBookmark(); }}
              className={`flex-1 py-2.5 px-2 border rounded-2xl text-xs font-bold flex flex-col items-center gap-1 transition-all active:scale-95 shadow-xs ${
                isBookmarked ? 'bg-amber-500 text-white border-amber-400' : 'bg-slate-100 border-slate-200 text-slate-800'
              }`}
            >
              {isBookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4 text-amber-600" />}
              <span>{isBookmarked ? 'پاشەکەوتکرا' : 'نیشانەکردن'}</span>
            </button>

          </div>
        </div>
      </div>

      {/* پەنجەرەی پیشاندانی تەفسیری هەڵبژێردراو */}
      {isTafsirOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs p-4 flex items-end sm:items-center justify-center animate-in fade-in select-none">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-5 space-y-4 max-h-[80vh] overflow-y-auto shadow-2xl text-slate-900" dir="rtl">
            
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-600" />
                <div>
                  <h3 className="font-bold text-sm text-slate-900">تەفسیری لاپەڕەی {currentPage}</h3>
                  <button 
                    onClick={() => setIsTafsirSelectorOpen(true)}
                    className="text-[11px] text-amber-800 font-bold hover:underline flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200 mt-0.5"
                  >
                    <span>{selectedTafsir.title}</span>
                    <span className="text-[10px] text-amber-600">(گۆڕینی تەفسیر 🔄)</span>
                  </button>
                </div>
              </div>
              <button onClick={() => setIsTafsirOpen(false)} className="p-1.5 rounded-xl bg-slate-100 text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingTafsir ? (
              <div className="text-center py-12">
                <Loader2 className="w-7 h-7 mx-auto text-amber-600 animate-spin" />
                <p className="text-xs text-slate-500 pt-2">تەفسیر باردەکرێت...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pageTafsirData.map((ayah, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-right">
                    <span className="px-2.5 py-0.5 rounded-lg bg-amber-100 text-amber-900 text-[11px] font-bold">
                      {ayah.surahName} • ئایەتی {ayah.numberInSurah}
                    </span>
                    <p className="font-quran text-slate-900 text-base leading-loose pt-1">
                      {ayah.arabic}
                    </p>
                    <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 leading-relaxed shadow-xs">
                      <strong className="text-amber-800 block mb-1.5 text-[11px]">
                        {selectedTafsir.title} ({selectedTafsir.author}):
                      </strong>
                      {ayah.tafsir}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* مۆداڵی ١٢٠+ قورئانخوێنەکە */}
      <RecitersModal
        isOpen={isRecitersModalOpen}
        onClose={() => setIsRecitersModalOpen(false)}
        selectedReciterId={selectedReciter.id}
        onSelectReciter={(r) => setSelectedReciter(r)}
      />

      {/* مۆداڵی ٥٠+ تەفسیرەکە */}
      <TafsirSelectorModal
        isOpen={isTafsirSelectorOpen}
        onClose={() => setIsTafsirSelectorOpen(false)}
        selectedTafsirId={selectedTafsir.id}
        onSelectTafsir={handleSelectTafsirItem}
      />

      {/* مۆداڵی هەڵبژاردنی خێرای سوورەت */}
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
