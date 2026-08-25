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

const PAGE_IMG_FILTER = {
  filter: 'grayscale(100%) contrast(115%) brightness(102%)',
  mixBlendMode: 'multiply' as const,
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

  // دۆخی پۆپ-ئاپ و شوێنەکەی
  const [activeAyah, setActiveAyah] = useState<any | null>(null);
  const [popupPos, setPopupPos] = useState<{ x: number; y: number } | null>(null);
  const [activeAyahTafsir, setActiveAyahTafsir] = useState<any | null>(null);

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

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const isUpdating = useRef(false);

  const pageRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const isFirstScroll = useRef(true);
  const scrollInitiatedByUser = useRef(false);

  const isBookmarked = bookmarks.includes(currentPage);
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
            number: a.number,
            surahNumber: a.surah.number,
            surahName: a.surah.name,
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
    setActiveAyah(null);
    setPopupPos(null);
  }, [currentPage]);

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
        setTimeout(() => {
          isUpdating.current = false;
        }, 400);
      }
    };

    if (isFirstScroll.current) {
      const raf1 = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          scrollToTarget();
        });
      });
      return () => cancelAnimationFrame(raf1);
    } else {
      scrollToTarget();
    }
  }, [currentPage]);

  const togglePageAudio = () => {
    if (isPlayingAudio) {
      audioRef.current?.pause();
      setIsPlayingAudio(false);
    } else {
      setIsPlayingAudio(true);
      if (audioRef.current) {
        audioRef.current.src = `https://everyayah.com/data/${selectedReciter.serverKey}/PageMp3s/Page${formatPageNum(currentPage)}.mp3`;
        audioRef.current.play().catch(() => setIsPlayingAudio(false));
      }
    }
  };

  const playSingleAyahAudio = (ayah: any) => {
    setIsPlayingAudio(true);
    if (audioRef.current) {
      audioRef.current.src = `https://cdn.islamic.network/quran/audio/128/${selectedReciter.serverKey}/${ayah.number}.mp3`;
      audioRef.current.play().catch(() => setIsPlayingAudio(false));
    }
  };

  const saveAyahBookmark = (ayah: any) => {
    try {
      const saved = localStorage.getItem('quran_ayah_bookmarks');
      const list = saved ? JSON.parse(saved) : [];
      if (!list.some((item: any) => item.number === ayah.number)) {
        list.push(ayah);
        localStorage.setItem('quran_ayah_bookmarks', JSON.stringify(list));
        alert('ئایەتەکە بە سەرکەوتوویی خزنکرا!');
      } else {
        alert('ئەم ئایەتە پێشتر خزنکراوە.');
      }
    } catch {}
  };

  const shareAyah = (ayah: any) => {
    if (navigator.share) {
      navigator.share({
        title: 'قورئانی پیرۆز',
        text: `${ayah.arabic}\n(سورة ${ayah.surahName} - ئایەتی ${ayah.numberInSurah})`,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${ayah.arabic}\n(سورة ${ayah.surahName} - ئایەتی ${ayah.numberInSurah})`);
      alert('دەقی ئایەت کۆپی کرا!');
    }
  };

  // چارەسەری گرنگ: وەرگرتنی شوێنی وردی کلیک لەسەر وێنەکە و نیشاندانی پۆپ-ئاپ
  const handleWrapperClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ratio = y / rect.height;
    const index = Math.min(
      Math.floor(ratio * pageAyahsData.length),
      pageAyahsData.length - 1
    );

    if (pageAyahsData.length > 0) {
      const targetAyah = pageAyahsData[index >= 0 ? index : 0];
      setActiveAyah(targetAyah);
      setPopupPos({
        x: Math.min(Math.max(x, 90), rect.width - 90),
        y: Math.max(y - 60, 50)
      });
    }
  };

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
        setActiveAyah(null);
        setPopupPos(null);
        if (onJumpToPage) {
          onJumpToPage(targetPage);
        } else if (targetPage > currentPage) {
          onNextPage();
        } else {
          onPrevPage();
        }
        setTimeout(() => {
          isUpdating.current = false;
        }, 300);
      }
    }
  };

  return (
    <div className="relative h-screen max-w-lg mx-auto flex flex-col justify-between select-none bg-stone-100 text-slate-900 overflow-hidden" dir="rtl">
      <audio ref={audioRef} onEnded={() => setIsPlayingAudio(false)} />

      <header className={`absolute top-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-2.5 flex items-center justify-between shadow-xs transition-all duration-300 ${
        showControls ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
      }`}>
        <button
          onClick={onBackToIndex}
          className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-700 transition-colors"
        >
          <ArrowRight className="w-5 h-5" />
        </button>

        <div className="text-center">
          <h2 className="font-bold text-sm text-slate-800">
            سووڕه‌تی {currentSurah?.nameAr || 'الفاتحة'}
          </h2>
          <p className="text-[11px] text-slate-500 font-medium">
            په‌ڕه‌ی {currentPage} ، جوزئی {currentJuz}
          </p>
        </div>

        <div className="flex items-center gap-1 text-slate-700">
          <button
            onClick={() => setViewMode(prev => prev === 'mushaf' ? 'tafsir' : 'mushaf')}
            className={`p-2 rounded-xl transition-colors ${
              viewMode === 'tafsir' ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'hover:bg-slate-100'
            }`}
          >
            <BookOpen className="w-4 h-4" />
          </button>

          <button
            onClick={toggleBookmark}
            className={`p-2 rounded-xl transition-colors ${
              isBookmarked ? 'text-amber-600' : 'hover:bg-slate-100'
            }`}
          >
            {isBookmarked ? <BookmarkCheck className="w-4 h-4 fill-amber-500 text-amber-600" /> : <Bookmark className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setIsTafsirSelectorOpen(true)}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-700"
          >
            <Globe className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* شێوازی وێنەی موسحەف لەگەڵ چینێکی هەستیاری تەواو */}
      {viewMode === 'mushaf' && (
        <div 
          className="relative flex-1 flex items-center justify-center bg-stone-200/60 overflow-hidden"
          onClick={() => {
            setShowControls(prev => !prev);
            setActiveAyah(null);
            setPopupPos(null);
          }}
        >
          <div 
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex w-full h-full overflow-x-auto snap-x snap-mandatory scrollbar-none items-center"
            style={{ direction: 'ltr' }}
          >
            {Array.from({ length: 604 }, (_, i) => {
              const pageNum = 604 - i;
              return (
                <div 
                  key={pageNum}
                  ref={(el) => { pageRefs.current[pageNum] = el; }}
                  className="min-w-full h-full flex flex-col items-center justify-center snap-center snap-always p-2 shrink-0 relative"
                  style={{ direction: 'rtl' }}
                >
                  {/* کانتێنەری وێنەکە کە لەسەری کلیک و دەستکاریکردن کارا دەکات */}
                  <div 
                    className="relative inline-block cursor-pointer"
                    onClick={pageNum === currentPage ? handleWrapperClick : undefined}
                  >
                    <img
                      src={pageImgUrl(pageNum)}
                      alt={`Page ${pageNum}`}
                      loading="lazy"
                      className="max-w-full max-h-[76vh] object-contain select-none shadow-xl rounded-lg bg-white border border-stone-300 pointer-events-auto"
                      style={PAGE_IMG_FILTER}
                    />

                    {/* پۆپ-ئاپەکە لە هەمان شوێنی کلیککراو */}
                    {pageNum === currentPage && popupPos && activeAyah && (
                      <div 
                        className="absolute z-50 bg-[#1b2a22] text-white px-4 py-2 rounded-xl shadow-2xl flex items-center gap-2.5 border border-emerald-600/60 backdrop-blur-md -translate-x-1/2 -translate-y-full animate-in fade-in zoom-in-95 duration-150 pointer-events-auto"
                        style={{ left: popupPos.x, top: popupPos.y }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => { saveAyahBookmark(activeAyah); setPopupPos(null); }}
                          className="p-1 hover:text-emerald-400 transition-colors"
                          title="خەزنکردن"
                        >
                          <Bookmark className="w-4 h-4 text-emerald-400" />
                        </button>

                        <div className="w-[1px] h-4 bg-white/20" />

                        <button
                          onClick={() => { shareAyah(activeAyah); setPopupPos(null); }}
                          className="p-1 hover:text-blue-400 transition-colors"
                          title="شەیرکردن"
                        >
                          <Share2 className="w-4 h-4 text-blue-400" />
                        </button>

                        <div className="w-[1px] h-4 bg-white/20" />

                        <button
                          onClick={() => {
                            setActiveAyahTafsir(activeAyah);
                            setPopupPos(null);
                          }}
                          className="p-1 hover:text-amber-400 transition-colors"
                          title="تەفسیر"
                        >
                          <BookOpen className="w-4 h-4 text-amber-400" />
                        </button>

                        <div className="w-[1px] h-4 bg-white/20" />

                        <button
                          onClick={() => { playSingleAyahAudio(activeAyah); setPopupPos(null); }}
                          className="p-1 hover:text-emerald-400 transition-colors"
                          title="خوێندنەوە"
                        >
                          <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                        </button>

                        <button
                          onClick={() => setPopupPos(null)}
                          className="mr-1 p-0.5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  <span className="text-xs font-bold text-slate-700 mt-2 font-mono bg-white/90 px-3 py-1 rounded-full shadow-xs">
                    {pageNum}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* دۆخی تەفسیر و دەق */}
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
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 text-xs font-mono font-bold">
                    {ayah.surahNumber}:{ayah.numberInSurah}
                  </span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => playSingleAyahAudio(ayah)} className="p-1.5 rounded-lg bg-slate-100 hover:bg-amber-100 text-slate-700">
                      <Play className="w-4 h-4" />
                    </button>
                    <button onClick={() => saveAyahBookmark(ayah)} className="p-1.5 rounded-lg bg-slate-100 hover:bg-amber-100 text-slate-700">
                      <Bookmark className="w-4 h-4" />
                    </button>
                    <button onClick={() => shareAyah(ayah)} className="p-1.5 rounded-lg bg-slate-100 hover:bg-amber-100 text-slate-700">
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
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

      {/* مۆداڵی تەفسیری فراوان */}
      {activeAyahTafsir && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 text-right">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
                ئایەتی {activeAyahTafsir.numberInSurah}
              </span>
              <button onClick={() => setActiveAyahTafsir(null)} className="p-1 hover:bg-slate-100 rounded-full text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="font-quran text-lg leading-relaxed text-slate-900">
              {activeAyahTafsir.arabic}
            </p>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs sm:text-sm leading-relaxed text-slate-700">
              <strong className="text-amber-800 block mb-1">تەفسیر:</strong>
              {activeAyahTafsir.asanTafsir}
            </div>
          </div>
        </div>
      )}

      <footer className={`absolute bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 px-4 py-3 flex items-center justify-between shadow-lg transition-all duration-300 ${
        showControls ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'
      }`} dir="rtl">
        <button 
          onClick={() => setIsRecitersModalOpen(true)}
          className="text-xs sm:text-sm font-bold text-slate-800 hover:text-amber-700 transition-colors flex items-center gap-1.5"
        >
          <span>{selectedReciter.name}</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={togglePageAudio}
            className="p-2.5 rounded-full bg-slate-900 text-white hover:bg-slate-800 transition-transform active:scale-95 shadow-md"
          >
            {isPlayingAudio ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
          </button>
        </div>
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
