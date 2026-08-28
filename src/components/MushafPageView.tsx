import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  ArrowRight, Loader2, BookOpen, Play, Pause, 
  Bookmark, BookmarkCheck, Globe, Share2, X, Copy, Check
} from 'lucide-react';
import { BgThemeType, AppLangType, SurahItem } from '../types';
import { ALL_RECITERS_DIRECTORY, ReciterItem } from '../data/recitersList';
import { ALL_TAFSIRS_DIRECTORY, TafsirItem } from '../data/tafsirList';
import { ayahCoordinates, AyahCoordinate } from '../data/ayahCoordinates';
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

// ئەندازەی ستانداردی وێنەکانی قورئانی مەدینە (1260x1980)
const BASE_IMG_WIDTH = 1260;
const BASE_IMG_HEIGHT = 1980;

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

  const [selectedReciter, setSelectedReciter] = useState<ReciterItem>(() => ALL_RECITERS_DIRECTORY[0] || { id: '1', name: 'قورئانخوێن', serverKey: 'Ghamadi_40kbps' });
  const [selectedTafsir, setSelectedTafsir] = useState<TafsirItem>(() => ALL_TAFSIRS_DIRECTORY[0] || { id: '1', name: 'تەفسیری ئاسان', key: 'ku.asan' });

  const [pageAyahsData, setPageAyahsData] = useState<any[]>([]);
  const [loadingTafsir, setLoadingTafsir] = useState(false);
  const [copied, setCopied] = useState(false);

  // داتای کۆردیناتەکانی لاپەڕەی ئێستا
  const [pageCoords, setPageCoords] = useState<AyahCoordinate[]>([]);

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

  // ئایەتی دەستنیشانکراو لەسەر وێنەکە
  const [selectedAyahInfo, setSelectedAyahInfo] = useState<{ surah: number; ayah: number; clickPosPercent: { top: number; left: number } } | null>(null);
  const [tafsirOpenKey, setTafsirOpenKey] = useState<string | null>(null);
  const [playingAyahKey, setPlayingAyahKey] = useState<string | null>(null);

  const [ayahBookmarks, setAyahBookmarks] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('quran_ayah_bookmarks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const ayahKey = (surah: number, ayah: number) => `${surah}:${ayah}`;
  const isAyahBookmarked = (surah: number, ayah: number) => ayahBookmarks.includes(ayahKey(surah, ayah));

  const toggleAyahBookmark = (surah: number, ayah: number) => {
    const key = ayahKey(surah, ayah);
    const updated = isAyahBookmarked(surah, ayah)
      ? ayahBookmarks.filter(k => k !== key)
      : [...ayahBookmarks, key];
    setAyahBookmarks(updated);
    localStorage.setItem('quran_ayah_bookmarks', JSON.stringify(updated));
    if (navigator.vibrate) navigator.vibrate(35);
  };

  // بارکردنی کۆردیناتی لاپەڕەکە لە فایلی داتا یان وەرگرتنی لە سەرچاوەی ئۆنلاین
  useEffect(() => {
    if (ayahCoordinates[currentPage] && ayahCoordinates[currentPage].length > 0) {
      setPageCoords(ayahCoordinates[currentPage]);
    } else {
      // ئەگەر لاپەڕەکە لەناو داتاکەتدا نەبوو، خۆکارانە باردەبێت
      fetch(`https://api.quran.com/api/v4/verses/by_page/${currentPage}?words=true&fields=chapter_id`)
        .then(res => res.json())
        .then(data => {
          if (data && data.verses) {
            const fetchedCoords: AyahCoordinate[] = [];
            data.verses.forEach((v: any) => {
              v.words?.forEach((w: any) => {
                if (w.x && w.y) {
                  fetchedCoords.push({
                    surah: v.chapter_id || v.surah_number || 1,
                    ayah: v.verse_number || 1,
                    word: w.position || 0,
                    x: w.x,
                    y: w.y,
                    w: w.w || w.width || 40,
                    h: w.h || w.height || 40
                  });
                }
              });
            });
            if (fetchedCoords.length > 0) setPageCoords(fetchedCoords);
          }
        })
        .catch(() => {});
    }
  }, [currentPage]);

  // بارکردنی دەقی ئایەتەکان و تەفسیر بۆ لاپەڕەی ئێستا
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
            asanTafsir: ku[i]?.text || 'تەفسیری کوردی لەم بەشەدا باردەکرێت...'
          }));
          setPageAyahsData(combined);
        }
      } catch (e) {
        console.error("Failed loading tafsir:", e);
      } finally {
        setLoadingTafsir(false);
      }
    }
    loadPageVerses();
  }, [currentPage]);

  // ڕووداوی کلیک و دۆزینەوەی ئایەت بەپێی شوێنی دەستلێدان لەسەر وێنە
  const handlePageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // گۆڕینی پیکسڵی دەستلێدان بۆ ئەندازەی بنەڕەتی وێنەکە (1260x1980)
    const scaleX = BASE_IMG_WIDTH / rect.width;
    const scaleY = BASE_IMG_HEIGHT / rect.height;

    const originalX = clickX * scaleX;
    const originalY = clickY * scaleY;

    // دۆزینەوەی ئەو کۆردیناتەی کە لەژێر پەنجەدایە
    const clickedCoord = pageCoords.find(c => {
      // ئەگەر بە ڕێژەی سەدی بێت یان پیکسڵ
      const minX = c.x <= 1 ? c.x * BASE_IMG_WIDTH : c.x;
      const minY = c.y <= 1 ? c.y * BASE_IMG_HEIGHT : c.y;
      const maxX = minX + (c.w <= 1 ? c.w * BASE_IMG_WIDTH : c.w);
      const maxY = minY + (c.h <= 1 ? c.h * BASE_IMG_HEIGHT : c.h);

      return originalX >= minX && originalX <= maxX && originalY >= minY && originalY <= maxY;
    });

    if (clickedCoord) {
      const topPercent = (clickY / rect.height) * 100;
      const leftPercent = (clickX / rect.width) * 100;

      setSelectedAyahInfo({
        surah: clickedCoord.surah,
        ayah: clickedCoord.ayah,
        clickPosPercent: { top: topPercent, left: leftPercent }
      });
      setTafsirOpenKey(null);
    } else {
      // ئەگەر لە شوێنێکی بەتاڵ درا، مێنیو و هایلایت لابدە
      setSelectedAyahInfo(null);
      setTafsirOpenKey(null);
      setShowControls(prev => !prev);
    }
  };

  // ئەو چوارچێوانەی کە ئایەتی هەڵبژێردراو پێکدەهێنن
  const activeAyahBoxes = useMemo(() => {
    if (!selectedAyahInfo) return [];
    return pageCoords.filter(
      c => c.surah === selectedAyahInfo.surah && c.ayah === selectedAyahInfo.ayah
    );
  }, [selectedAyahInfo, pageCoords]);

  // دەقی ئەو ئایەتەی کە ئێستا هەڵبژێردراوە
  const currentSelectedAyahData = useMemo(() => {
    if (!selectedAyahInfo) return null;
    return pageAyahsData.find(
      a => a.surahNumber === selectedAyahInfo.surah && a.numberInSurah === selectedAyahInfo.ayah
    );
  }, [selectedAyahInfo, pageAyahsData]);

  const playAyahAudio = (surah: number, ayah: number) => {
    const key = ayahKey(surah, ayah);
    if (playingAyahKey === key) {
      audioRef.current?.pause();
      setPlayingAyahKey(null);
      return;
    }
    const surahPadded = String(surah).padStart(3, '0');
    const ayahPadded = String(ayah).padStart(3, '0');
    if (audioRef.current) {
      audioRef.current.src = `https://everyayah.com/data/${selectedReciter.serverKey}/${surahPadded}${ayahPadded}.mp3`;
      audioRef.current.play().catch(() => setPlayingAyahKey(null));
      setPlayingAyahKey(key);
      setIsPlayingAudio(false);
    }
  };

  const copyAyah = async (a: any) => {
    if (!a) return;
    const text = `${a.arabic}\n[${a.surahNumber}:${a.numberInSurah}]\n${a.asanTafsir}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareAyah = async (a: any) => {
    if (!a) return;
    const text = `${a.arabic}\n\n(${a.surahNumber}:${a.numberInSurah})\n\n${a.asanTafsir}`;
    try {
      if (navigator.share) {
        await navigator.share({ text });
      } else {
        await navigator.clipboard.writeText(text);
      }
    } catch {}
  };

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
    setSelectedAyahInfo(null);
    setTafsirOpenKey(null);
  }, [currentPage]);

  // کۆنتڕۆڵی سکرۆڵ بۆ په‌ڕه‌کان
  useEffect(() => {
    if (scrollInitiatedByUser.current) {
      scrollInitiatedByUser.current = false;
      return;
    }
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

  return (
    <div className="relative h-screen max-w-lg mx-auto flex flex-col justify-between select-none bg-stone-100 text-slate-900 overflow-hidden" dir="rtl">
      <audio ref={audioRef} onEnded={() => { setIsPlayingAudio(false); setPlayingAyahKey(null); }} />

      {/* هێدەر */}
      <header className={`absolute top-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-2.5 flex items-center justify-between shadow-xs transition-all duration-300 ${
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
            په‌ڕه‌ی {currentPage} ، جوزئی {currentJuz}
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
            className={`p-2 rounded-xl transition-colors ${isBookmarked ? 'text-amber-600' : 'hover:bg-slate-100'}`}
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

      {/* پیشاندانی موسحەف بە وێنە و هایلایتی کۆردینات */}
      {viewMode === 'mushaf' && (
        <div className="relative flex-1 flex items-center justify-center bg-stone-200/60 overflow-hidden">
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
                  <div
                    className="relative max-h-[76vh] cursor-pointer"
                    style={{ aspectRatio: '1260 / 1980' }}
                    onClick={isActivePage ? handlePageClick : undefined}
                  >
                    {/* وێنەی لاپەڕەی قورئان */}
                    <img
                      src={pageImgUrl(pageNum)}
                      alt={`Page ${pageNum}`}
                      loading="lazy"
                      className="w-full h-full max-h-[76vh] object-contain select-none shadow-xl rounded-lg bg-white border border-stone-300"
                      style={PAGE_IMG_FILTER}
                    />

                    {/* 🎯 چینی کێشانی هایلایتی ئەندازەیی (SVG Overlay) */}
                    {isActivePage && activeAyahBoxes.length > 0 && (
                      <svg 
                        className="absolute inset-0 w-full h-full pointer-events-none z-20"
                        viewBox={`0 0 ${BASE_IMG_WIDTH} ${BASE_IMG_HEIGHT}`}
                        preserveAspectRatio="none"
                      >
                        {activeAyahBoxes.map((box, idx) => {
                          const x = box.x <= 1 ? box.x * BASE_IMG_WIDTH : box.x;
                          const y = box.y <= 1 ? box.y * BASE_IMG_HEIGHT : box.y;
                          const w = box.w <= 1 ? box.w * BASE_IMG_WIDTH : box.w;
                          const h = box.h <= 1 ? box.h * BASE_IMG_HEIGHT : box.h;

                          return (
                            <rect
                              key={idx}
                              x={x}
                              y={y}
                              width={w}
                              height={h}
                              fill="rgba(59, 130, 246, 0.28)" // ڕەنگی شینی شەفاف
                              stroke="rgba(37, 99, 235, 0.5)"
                              strokeWidth="2"
                              rx="8"
                            />
                          );
                        })}
                      </svg>
                    )}

                    {/* 🎛 مێنیوی کرداری ئایەت (Popup Toolbar) */}
                    {isActivePage && selectedAyahInfo && (
                      <div
                        className="absolute z-40 transform -translate-x-1/2"
                        style={{ 
                          top: `${Math.min(Math.max(selectedAyahInfo.clickPosPercent.top - 8, 5), 85)}%`,
                          left: '50%'
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex flex-col items-center gap-1.5 animate-in fade-in zoom-in duration-200">
                          <div className="flex items-center gap-1 bg-slate-900/95 backdrop-blur-md text-white rounded-2xl shadow-2xl px-2 py-1.5 border border-white/10">
                            <button
                              onClick={() => playAyahAudio(selectedAyahInfo.surah, selectedAyahInfo.ayah)}
                              className="p-2 rounded-xl hover:bg-white/15 transition-colors"
                              title="گوێگرتن لە دەنگ"
                            >
                              {playingAyahKey === ayahKey(selectedAyahInfo.surah, selectedAyahInfo.ayah)
                                ? <Pause className="w-4 h-4 text-emerald-400" />
                                : <Play className="w-4 h-4 fill-white" />}
                            </button>

                            <button
                              onClick={() => setTafsirOpenKey(prev => prev ? null : 'open')}
                              className={`p-2 rounded-xl transition-colors ${tafsirOpenKey ? 'bg-amber-500 text-slate-900' : 'hover:bg-white/15'}`}
                              title="تەفسیر"
                            >
                              <Globe className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => copyAyah(currentSelectedAyahData)}
                              className="p-2 rounded-xl hover:bg-white/15 transition-colors"
                              title="کۆپیکردن"
                            >
                              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            </button>

                            <button
                              onClick={() => shareAyah(currentSelectedAyahData)}
                              className="p-2 rounded-xl hover:bg-white/15 transition-colors"
                              title="ناردن"
                            >
                              <Share2 className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => toggleAyahBookmark(selectedAyahInfo.surah, selectedAyahInfo.ayah)}
                              className="p-2 rounded-xl hover:bg-white/15 transition-colors"
                              title="نیشانەکردن"
                            >
                              {isAyahBookmarked(selectedAyahInfo.surah, selectedAyahInfo.ayah)
                                ? <BookmarkCheck className="w-4 h-4 fill-amber-400 text-amber-400" />
                                : <Bookmark className="w-4 h-4" />}
                            </button>

                            <button
                              onClick={() => { setSelectedAyahInfo(null); setTafsirOpenKey(null); }}
                              className="p-2 rounded-xl hover:bg-white/15 text-slate-400 hover:text-white transition-colors"
                              title="داخستن"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          {/* پەنجەرەی پیشاندانی تەفسیر کاتێک کرتە دەکرێت */}
                          {tafsirOpenKey && currentSelectedAyahData && (
                            <div className="w-72 max-w-[85vw] bg-white border border-slate-200 rounded-2xl shadow-2xl p-3.5 text-right max-h-56 overflow-y-auto" dir="rtl">
                              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-2">
                                <span className="text-[11px] font-bold text-amber-800 font-mono">
                                  سووڕەتی {selectedAyahInfo.surah} : ئایەتی {selectedAyahInfo.ayah}
                                </span>
                                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                                  {selectedTafsir.name}
                                </span>
                              </div>
                              <p className="text-xs text-slate-700 leading-relaxed">
                                {currentSelectedAyahData.asanTafsir}
                              </p>
                            </div>
                          )}
                        </div>
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

      {/* بەشی پیشاندانی تەفسیری تەواوی پەڕە */}
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

      {/* فووتەر و پلەیەر */}
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
            title="لێدانی دەنگی پەڕە"
          >
            {isPlayingAudio ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
          </button>
        </div>
      </footer>

      {/* مۆداڵی قورئانخوێنەکان */}
      <RecitersModal
        isOpen={isRecitersModalOpen}
        onClose={() => setIsRecitersModalOpen(false)}
        selectedReciterId={selectedReciter.id}
        onSelectReciter={(r) => setSelectedReciter(r)}
      />

      {/* مۆداڵی تەفسیرەکان */}
      <TafsirSelectorModal
        isOpen={isTafsirSelectorOpen}
        onClose={() => setIsTafsirSelectorOpen(false)}
        selectedTafsirId={selectedTafsir.id}
        onSelectTafsir={(t) => setSelectedTafsir(t)}
      />
    </div>
  );
};
