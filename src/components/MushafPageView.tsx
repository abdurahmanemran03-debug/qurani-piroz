import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowRight, Loader2, BookOpen, Volume2, Play, Pause, 
  Bookmark, BookmarkCheck, X, Check, Globe, Share2, Copy
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

  // دەستنیشانکردنی ئایەت و مینیۆی سەوزی سەر ئایەت
  const [selectedAyahIndex, setSelectedAyahIndex] = useState<number | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);

  // مۆداڵەکان
  const [isRecitersModalOpen, setIsRecitersModalOpen] = useState(false);
  const [isTafsirSelectorOpen, setIsTafsirSelectorOpen] = useState(false);

  const [selectedReciter, setSelectedReciter] = useState<ReciterItem>(ALL_RECITERS_DIRECTORY[18]);
  const [selectedTafsir, setSelectedTafsir] = useState<TafsirItem>(ALL_TAFSIRS_DIRECTORY[0]);

  const [pageAyahsData, setPageAyahsData] = useState<any[]>([]);
  const [loadingTafsir, setLoadingTafsir] = useState(false);
  const [isSingleTafsirModalOpen, setIsSingleTafsirModalOpen] = useState(false);

  // بووکمارک
  const [bookmarks, setBookmarks] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('quran_bookmarks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [bookmarkedAyahs, setBookmarkedAyahs] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('quran_ayah_bookmarks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [playingAyahAudio, setPlayingAyahAudio] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const isBookmarked = bookmarks.includes(currentPage);
  const formatPageNum = (n: number) => String(n).padStart(3, '0');
  const currentJuz = Math.ceil(currentPage / 20);

  const currentSurah = surahsList.slice().reverse().find(s => currentPage >= s.startPage) || surahsList[0];

  const togglePageBookmark = () => {
    let updated: number[];
    if (isBookmarked) updated = bookmarks.filter(p => p !== currentPage);
    else updated = [...bookmarks, currentPage];
    setBookmarks(updated);
    localStorage.setItem('quran_bookmarks', JSON.stringify(updated));
    if (navigator.vibrate) navigator.vibrate(35);
  };

  const toggleAyahBookmark = (ayahKey: string) => {
    let updated: string[];
    if (bookmarkedAyahs.includes(ayahKey)) updated = bookmarkedAyahs.filter(k => k !== ayahKey);
    else updated = [...bookmarkedAyahs, ayahKey];
    setBookmarkedAyahs(updated);
    localStorage.setItem('quran_ayah_bookmarks', JSON.stringify(updated));
    if (navigator.vibrate) navigator.vibrate(35);
  };

  // بارکردنی ئایەتەکانی لاپەڕەکە
  useEffect(() => {
    async function loadPageVerses() {
      setLoadingTafsir(true);
      setSelectedAyahIndex(null);
      setMenuPosition(null);
      try {
        const res = await fetch(`https://api.alquran.cloud/v1/page/${currentPage}/editions/quran-uthmani,ku.asan`);
        const data = await res.json();
        if (data.code === 200 && data.data.length >= 2) {
          const ar = data.data[0].ayahs;
          const ku = data.data[1].ayahs;
          const combined = ar.map((a: any, i: number) => {
            const padS = String(a.surah.number).padStart(3, '0');
            const padA = String(a.numberInSurah).padStart(3, '0');
            return {
              surahNumber: a.surah.number,
              surahName: a.surah.name,
              numberInSurah: a.numberInSurah,
              arabic: a.text,
              kurdish: ku[i]?.text || 'بە ناوی خوای بەخشندەی میهرەبان...',
              audioUrl: `https://everyayah.com/data/${selectedReciter.serverKey}/${padS}${padA}.mp3`
            };
          });
          setPageAyahsData(combined);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingTafsir(false);
      }
    }
    loadPageVerses();
  }, [currentPage, selectedReciter]);

  // کلیک لەسەر ئایەت لەسەر وێنەکە: هایلایتکردن و کردنەوەی مینیۆ سەوزەکە
  const handlePageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const clickX = e.clientX - rect.left;
    const height = rect.height;

    // ئەگەر ئایەت هەبێت لەم لاپەڕەیەدا
    if (pageAyahsData.length > 0) {
      // ئەژمارکردنی ئایەتەکە بەپێی شوێنی دەستلێدان لەسەر لاپەڕەکە
      const relativeY = clickY / height;
      const index = Math.min(
        Math.floor(relativeY * pageAyahsData.length),
        pageAyahsData.length - 1
      );

      setSelectedAyahIndex(index);
      setMenuPosition({
        top: Math.max(clickY - 50, 10),
        left: Math.min(Math.max(clickX - 90, 10), rect.width - 190)
      });
    }
  };

  // لێدانی دەنگی تەنها ئەو ئایەتە
  const playSpecificAyah = (ayah: any) => {
    if (playingAyahAudio === ayah.numberInSurah && isPlayingAudio) {
      audioRef.current?.pause();
      setIsPlayingAudio(false);
      setPlayingAyahAudio(null);
    } else {
      setPlayingAyahAudio(ayah.numberInSurah);
      setIsPlayingAudio(true);
      if (audioRef.current) {
        audioRef.current.src = ayah.audioUrl;
        audioRef.current.play();
      }
    }
  };

  // هاوبەشکردنی ئایەت
  const shareAyah = (ayah: any) => {
    const shareText = `${ayah.arabic}\n\nواتای کوردی:\n${ayah.kurdish}\n\n[سوورەتی ${ayah.surahName} - ئایەتی ${ayah.numberInSurah}]`;
    if (navigator.share) {
      navigator.share({ title: 'ئایەتی پیرۆز', text: shareText });
    } else {
      navigator.clipboard.writeText(shareText);
      alert('ئایەتەکە لەبەرگیرایەوە ✅');
    }
  };

  // لێدانی تەواوی لاپەڕە
  const togglePageAudio = () => {
    if (isPlayingAudio) {
      audioRef.current?.pause();
      setIsPlayingAudio(false);
      setPlayingAyahAudio(null);
    } else {
      setIsPlayingAudio(true);
      if (audioRef.current) {
        audioRef.current.src = `https://everyayah.com/data/${selectedReciter.serverKey}/PageMp3s/Page${formatPageNum(currentPage)}.mp3`;
        audioRef.current.play();
      }
    }
  };

  const selectedAyahObj = selectedAyahIndex !== null ? pageAyahsData[selectedAyahIndex] : null;

  return (
    <div className="relative min-h-screen max-w-lg mx-auto flex flex-col justify-between select-none bg-white text-slate-900" dir="rtl">
      <audio ref={audioRef} onEnded={() => { setIsPlayingAudio(false); setPlayingAyahAudio(null); }} />

      {/* شریتی سەرەوە (ڕێک وەک وێنەکەت) */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-3 py-2.5 flex items-center justify-between shadow-xs">
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
              viewMode === 'tafsir' ? 'bg-amber-100 text-amber-900' : 'hover:bg-slate-100'
            }`}
            title="تەفسیر"
          >
            <BookOpen className="w-4 h-4" />
          </button>

          <button
            onClick={togglePageBookmark}
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

      {/* لاپەڕەی موسحەف لەگەڵ هایلایتی ئایەت و مینیۆی سەوزی سەر ئایەت (ڕێک وەک وێنەکە) */}
      {viewMode === 'mushaf' && (
        <div 
          className="relative flex-1 flex flex-col items-center justify-center p-2 cursor-pointer touch-pan-y"
          onClick={handlePageClick}
        >
          {loadingPage && (
            <div className="absolute inset-0 bg-white/95 backdrop-blur-xs flex flex-col items-center justify-center gap-2 z-30">
              <Loader2 className="w-8 h-8 text-slate-600 animate-spin" />
              <span className="text-xs text-slate-700 font-bold">لاپەڕەی {currentPage} باردەکرێت...</span>
            </div>
          )}

          {/* وێنەی لاپەڕەی مەدینە */}
          <div className="relative w-full flex items-center justify-center max-h-[82vh]">
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

            {/* هایلایتی شینی کاڵ لەسەر ئایەتی هەڵبژێردراو (ڕێک وەک وێنەی یەکەم) */}
            {selectedAyahIndex !== null && (
              <div 
                className="absolute inset-x-4 bg-sky-400/25 border-y border-sky-400/40 pointer-events-none rounded-lg transition-all"
                style={{
                  top: `${(selectedAyahIndex / Math.max(pageAyahsData.length, 1)) * 80 + 10}%`,
                  height: `${85 / Math.max(pageAyahsData.length, 1)}%`
                }}
              />
            )}

            {/* مینیۆی سەوزی تۆخی سەر ئایەتەکە (ڕێک هاوشێوەی وێنەی یەکەم) */}
            {selectedAyahObj && menuPosition && (
              <div 
                className="absolute z-40 bg-[#1e4630] text-white px-3 py-2 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in zoom-in-95 border border-emerald-600/40"
                style={{
                  top: `${menuPosition.top}px`,
                  left: `${menuPosition.left}px`
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* ١. بووکمارک */}
                <button
                  onClick={() => toggleAyahBookmark(`${selectedAyahObj.surahNumber}:${selectedAyahObj.numberInSurah}`)}
                  className="p-1 hover:text-amber-300 transition-colors"
                  title="نیشانەکردنی ئایەت"
                >
                  <Bookmark className={`w-4 h-4 ${bookmarkedAyahs.includes(`${selectedAyahObj.surahNumber}:${selectedAyahObj.numberInSurah}`) ? 'fill-amber-400 text-amber-400' : ''}`} />
                </button>

                {/* ٢. شەیرکردن */}
                <button
                  onClick={() => shareAyah(selectedAyahObj)}
                  className="p-1 hover:text-amber-300 transition-colors"
                  title="شەیرکردن"
                >
                  <Share2 className="w-4 h-4" />
                </button>

                {/* ٣. تەفسیر */}
                <button
                  onClick={() => setIsSingleTafsirModalOpen(true)}
                  className="p-1 hover:text-amber-300 transition-colors"
                  title="تەفسیری ئەم ئایەتە"
                >
                  <Globe className="w-4 h-4" />
                </button>

                {/* ٤. دەنگ */}
                <button
                  onClick={() => playSpecificAyah(selectedAyahObj)}
                  className="p-1 hover:text-amber-300 transition-colors"
                  title="خوێندنەوەی دەنگ"
                >
                  {playingAyahAudio === selectedAyahObj.numberInSurah && isPlayingAudio ? (
                    <Pause className="w-4 h-4 fill-white" />
                  ) : (
                    <Play className="w-4 h-4 fill-white" />
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ٢. شێوازی تەفسیر ئایەت بە ئایەت */}
      {viewMode === 'tafsir' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-6 animate-in fade-in bg-white">
          {loadingTafsir ? (
            <div className="text-center py-20">
              <Loader2 className="w-8 h-8 mx-auto text-amber-600 animate-spin" />
              <p className="text-xs text-slate-500 pt-2">تەفسیر باردەکرێت...</p>
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
                  <strong className="text-amber-800 block mb-1">
                    {selectedTafsir.title}:
                  </strong>
                  {ayah.kurdish}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* شریتی خوارەوەی دەنگ (ڕێک وەک وێنەکەت) */}
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

      {/* مۆداڵی تەفسیری تەنها ئەو تاکە ئایەتەی کلیکی لێکراوە */}
      {isSingleTafsirModalOpen && selectedAyahObj && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs p-4 flex items-end sm:items-center justify-center animate-in fade-in select-none">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-5 space-y-4 max-h-[80vh] overflow-y-auto shadow-2xl text-slate-900" dir="rtl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm text-slate-900">
                تەفسیری ئایەتی {selectedAyahObj.numberInSurah} لە سوورەتی {selectedAyahObj.surahName}
              </h3>
              <button onClick={() => setIsSingleTafsirModalOpen(false)} className="p-1.5 rounded-xl bg-slate-100 text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="font-quran text-slate-900 text-lg leading-loose text-right">
              {selectedAyahObj.arabic}
            </p>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-700 leading-relaxed">
              <strong className="text-amber-800 block mb-1 text-[11px]">{selectedTafsir.title}:</strong>
              {selectedAyahObj.kurdish}
            </div>
          </div>
        </div>
      )}

      {/* مۆداڵی قورئانخوێنان */}
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
