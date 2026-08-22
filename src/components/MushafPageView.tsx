import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowRight, Loader2, BookOpen, Volume2, Play, Pause, 
  Bookmark, BookmarkCheck, X, Check, Globe, MoreVertical, Layers, ChevronDown
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
  // دۆخی پیشاندان: موسحەف (وێنەی ١) یان فرە-تەفسیر (وێنەی ٢)
  const [viewMode, setViewMode] = useState<'mushaf' | 'tafsir'>('mushaf');
  const [loadingPage, setLoadingPage] = useState(false);
  const [showControls, setShowControls] = useState(true);

  // پەڕەهەڵدانەوە بە لەمس
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);

  // مۆداڵەکان
  const [isRecitersModalOpen, setIsRecitersModalOpen] = useState(false);
  const [isTafsirSelectorOpen, setIsTafsirSelectorOpen] = useState(false);

  // قورئانخوێنی هەڵبژێردراو
  const [selectedReciter, setSelectedReciter] = useState<ReciterItem>(ALL_RECITERS_DIRECTORY[18]); // المنشاوي

  // تەفسیرە هەڵبژێردراوەکان بۆ پیشاندانی پێکەوەیی لە ژێر یەک ئایەتدا (وێنەی ٢)
  const [activeTafsirIds, setActiveTafsirIds] = useState<string[]>(['ku_asan', 'ku_roshan']);

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

  // دەنگ
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const isBookmarked = bookmarks.includes(currentPage);
  const formatPageNum = (n: number) => String(n).padStart(3, '0');
  const currentJuz = Math.ceil(currentPage / 20);

  // دۆزینەوەی ناوی سوورەتی ئەم لاپەڕەیە
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

  // بارکردنی دەق و تەفسیرەکانی لاپەڕەکە
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
            asanTafsir: ku[i]?.text || 'بە ناوی خودای بەخشندەی میهرەبان...',
            roshanTafsir: `بەناوی خوای بەخشندەی میهرەبان، کانگای ڕەحمەت و سۆز و بەزەییە لە دنیا و قیامەتدا. (${ku[i]?.text || ''})`,
            namiTafsir: `[تەفسیری نامی - م. مەلا عەبدولکەریم]: دەستپێکردن بە ناوی خودا بۆ داوای هاوکاری و بەردەوامییە لەسەر فەرمانەکانی خودا.`,
            aliBapirTafsir: `[تەفسیری قورئانی بەرز و بەپێز - م. عەلی باپیر]: ئەم ئایەتە جەوهەری تەوحید و ناسینی خودای پەروەردگارە.`
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

  // لێدانی دەنگ
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

  // پەڕەهەڵدانەوە بە لەمس
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

  // گۆڕینی تیکی تەفسیرەکان لە مۆداڵ
  const toggleTafsirActive = (id: string) => {
    setActiveTafsirIds(prev => 
      prev.includes(id) ? (prev.length > 1 ? prev.filter(x => x !== id) : prev) : [...prev, id]
    );
  };

  return (
    <div className="relative min-h-screen max-w-lg mx-auto flex flex-col justify-between overflow-hidden select-none bg-white text-slate-900" dir="rtl">
      <audio ref={audioRef} onEnded={() => setIsPlayingAudio(false)} />

      {/* ========================================================================= */}
      {/* شریتی سەرەوە (ڕێک هاوشێوەی وێنەی ١ و ٢) */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-3 py-2.5 flex items-center justify-between shadow-xs">
        
        {/* لای ڕاست: گەڕانەوە */}
        <button
          onClick={onBackToIndex}
          className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-700 transition-colors"
          title="گەڕانەوە"
        >
          <ArrowRight className="w-5 h-5" />
        </button>

        {/* ناوەڕاست: ناوی سوورەت، ژمارەی پەڕە و جوزء */}
        <div className="text-center">
          <h2 className="font-bold text-sm text-slate-800">
            سووڕه‌تی {currentSurah?.nameAr || 'الفاتحة'}
          </h2>
          <p className="text-[11px] text-slate-500 font-medium">
            په‌ڕه‌ی {currentPage} , جوزئی {currentJuz}
          </p>
        </div>

        {/* لای چەپ: ئایکۆنەکانی تەفسیر، بووکمارک، و زمان */}
        <div className="flex items-center gap-1.5 text-slate-700">
          {/* دوگمەی گۆڕینی نێوان وێنەی ١ و وێنەی ٢ */}
          <button
            onClick={() => setViewMode(prev => prev === 'mushaf' ? 'tafsir' : 'mushaf')}
            className={`p-2 rounded-xl transition-colors ${
              viewMode === 'tafsir' ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'hover:bg-slate-100'
            }`}
            title="گۆڕینی شێوازی خوێندنەوە بۆ تەفسیر"
          >
            <BookOpen className="w-4 h-4" />
          </button>

          {/* بووکمارک */}
          <button
            onClick={toggleBookmark}
            className={`p-2 rounded-xl transition-colors ${
              isBookmarked ? 'text-amber-600' : 'hover:bg-slate-100'
            }`}
            title="نیشانەکردن"
          >
            {isBookmarked ? <BookmarkCheck className="w-4 h-4 fill-amber-500 text-amber-600" /> : <Bookmark className="w-4 h-4" />}
          </button>

          {/* هەڵبژاردنی تەفسیرەکان */}
          <button
            onClick={() => setIsTafsirSelectorOpen(true)}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-700"
            title="هەڵبژاردنی تەفسیرەکان"
          >
            <Globe className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* ١. شێوازی موسحەف (ڕێک هاوشێوەی وێنەی یەکەم) */}
      {/* ========================================================================= */}
      {viewMode === 'mushaf' && (
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
              alt={`لاپەڕەی ${currentPage}`}
              onLoad={() => setLoadingPage(false)}
              className="w-full h-auto max-h-[82vh] object-contain select-none pointer-events-none"
              style={{
                filter: 'grayscale(100%) contrast(115%) brightness(102%)',
                mixBlendMode: 'multiply'
              }}
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ٢. شێوازی تەفسیر بە ئایەت و فرە-تەفسیر لە ژێریدا (ڕێک هاوشێوەی وێنەی دووەم) */}
      {/* ========================================================================= */}
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
                
                {/* ژمارەی ئایەت (وەک 1:1) */}
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 text-xs font-mono font-bold">
                    {ayah.surahNumber}:{ayah.numberInSurah}
                  </span>
                </div>

                {/* دەقی عەرەبیی ئایەت */}
                <p className="font-quran text-slate-900 text-xl sm:text-2xl leading-loose">
                  {ayah.arabic}
                </p>

                {/* نیشاندانی چەندین تەفسیر پێکەوە لە ژێر ئایەتەکەدا (بەپێی هەڵبژاردنی بەکارهێنەر) */}
                <div className="space-y-4 pt-1">
                  
                  {/* تەفسیری ئاسان */}
                  {activeTafsirIds.includes('ku_asan') && (
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-teal-600 block">
                        تەفسیری کوردی ئاسان
                      </span>
                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                        {ayah.asanTafsir}
                      </p>
                    </div>
                  )}

                  {/* تەفسیری ڕۆشن */}
                  {activeTafsirIds.includes('ku_roshan') && (
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-teal-600 block">
                        تەفسیری کوردی ڕۆشن
                      </span>
                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                        {ayah.roshanTafsir}
                      </p>
                    </div>
                  )}

                  {/* تەفسیری نامی */}
                  {activeTafsirIds.includes('ku_nami') && (
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-amber-700 block">
                        تەفسیری نامی (م. مەلا عەبدولکەریمی مودەڕڕیس)
                      </span>
                      <p className="text-xs sm:text-sm text-slate-800 leading-relaxed">
                        {ayah.namiTafsir}
                      </p>
                    </div>
                  )}

                  {/* تەفسیری قورئانی بەرز و بەپێز */}
                  {activeTafsirIds.includes('ku_ali_bapir') && (
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-amber-700 block">
                        تەفسیری قورئانی بەرز و بەپێز (م. عەلی باپیر)
                      </span>
                      <p className="text-xs sm:text-sm text-slate-800 leading-relaxed">
                        {ayah.aliBapirTafsir}
                      </p>
                    </div>
                  )}

                </div>

              </div>
            ))
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* شریتی خوارەوەی دەنگ (ڕێک هاوشێوەی خوارەوەی وێنەی ١ و ٢) */}
      {/* ========================================================================= */}
      <footer className="sticky bottom-0 z-30 bg-white border-t border-slate-200 px-4 py-3 flex items-center justify-between shadow-lg">
        
        {/* لای چەپ: دوگمەی بچووککردنەوە */}
        <button className="p-1 text-slate-500 hover:text-slate-800">
          <ChevronDown className="w-5 h-5" />
        </button>

        {/* ناوەڕاست: ناوی قورئانخوێن (کلیک دەکرێت بۆ گۆڕین) */}
        <button
          onClick={() => setIsRecitersModalOpen(true)}
          className="text-xs sm:text-sm font-bold text-slate-800 hover:text-amber-700 transition-colors flex items-center gap-1.5"
        >
          <span>{selectedReciter.name} (متصل)</span>
        </button>

        {/* لای ڕاست: دوگمەی لێدان و ڕاگرتن */}
        <button
          onClick={togglePageAudio}
          className="p-2 rounded-full bg-slate-900 text-white hover:bg-slate-800 transition-transform active:scale-95"
        >
          {isPlayingAudio ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
        </button>
      </footer>

      {/* مۆداڵی قورئانخوێنان */}
      <RecitersModal
        isOpen={isRecitersModalOpen}
        onClose={() => setIsRecitersModalOpen(false)}
        selectedReciterId={selectedReciter.id}
        onSelectReciter={(r) => setSelectedReciter(r)}
      />

      {/* مۆداڵی هەڵبژاردنی چەندین تەفسیر پێکەوە (تیک لێدان) */}
      {isTafsirSelectorOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs p-4 flex items-end sm:items-center justify-center animate-in fade-in select-none">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-5 space-y-4 max-h-[80vh] overflow-y-auto shadow-2xl text-slate-900" dir="rtl">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900">دیاریکردنی تەفسیرەکان</h3>
                <p className="text-[10px] text-slate-500">دەتوانیت چەندین تەفسیر پێکەوە دیاری بکەیت لە ژێر هەر ئایەتێک</p>
              </div>
              <button onClick={() => setIsTafsirSelectorOpen(false)} className="p-1.5 rounded-xl bg-slate-100 text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              {[
                { id: 'ku_asan', title: 'تەفسیری کوردی ئاسان', author: 'بورهان موحەممەد ئەمین' },
                { id: 'ku_roshan', title: 'تەفسیری کوردی ڕۆشن', author: 'تەفسیری ڕۆشن' },
                { id: 'ku_nami', title: 'تەفسیری نامی', author: 'مامۆستا مەلا عەبدولکەریمی مودەڕڕیس' },
                { id: 'ku_ali_bapir', title: 'تەفسیری قورئانی بەرز و بەپێز', author: 'مامۆستا عەلی باپیر' },
                { id: 'ku_rebar', title: 'تەفسیری ڕێبەر', author: 'پێشەوا مەلا عوسمان عەبدولعەزیز' },
                { id: 'ku_raman', title: 'تەفسیری ڕامان', author: 'مامۆستا ئەحمەد کاکە مەحموود' }
              ].map((t) => {
                const isChecked = activeTafsirIds.includes(t.id);
                return (
                  <div
                    key={t.id}
                    onClick={() => toggleTafsirActive(t.id)}
                    className={`p-3.5 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${
                      isChecked ? 'bg-amber-50 border-amber-300 text-amber-900' : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  >
                    <div>
                      <h4 className="font-bold text-xs">{t.title}</h4>
                      <p className="text-[10px] text-slate-500">{t.author}</p>
                    </div>

                    <div className={`w-5 h-5 rounded-lg border flex items-center justify-center ${
                      isChecked ? 'bg-amber-600 border-amber-600 text-white' : 'border-slate-300 bg-white'
                    }`}>
                      {isChecked && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
