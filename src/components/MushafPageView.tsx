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
  const [loadingAyahs, setLoadingAyahs] = useState(false);

  const [activeAyah, setActiveAyah] = useState<any | null>(null);
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
      setLoadingAyahs(true);
      try {
        const res = await fetch(`https://api.alquran.cloud/v1/page/${currentPage}/editions/quran-uthmani,ku.asan`);
        const data = await res.json();
        if (data.code === 200 && data.data && data.data.length >= 2) {
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
        setLoadingAyahs(false);
      }
    }
    loadPageVerses();
    setActiveAyah(null);
  }, [currentPage]);

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
        alert('ئایەتەکە خزنکرا!');
      } else {
        alert('ئەم ئایەتە پێشتر خزنکراوە.');
      }
    } catch {}
  };

  const shareAyah = (ayah: any) => {
    const textToShare = `${ayah.arabic}\n(سورة ${ayah.surahName} - ئایەتی ${ayah.numberInSurah})`;
    if (navigator.share) {
      navigator.share({ title: 'قورئانی پیرۆز', text: textToShare }).catch(() => {});
    } else {
      navigator.clipboard.writeText(textToShare);
      alert('دەقی ئایەت کۆپی کرا!');
    }
  };

  return (
    <div className="relative h-screen max-w-lg mx-auto flex flex-col justify-between select-none bg-[#fbf9f1] text-slate-900 overflow-hidden" dir="rtl">
      <audio ref={audioRef} onEnded={() => setIsPlayingAudio(false)} />

      {/* سەرپەڕە */}
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
          <button
            onClick={() => setViewMode(prev => prev === 'mushaf' ? 'tafsir' : 'mushaf')}
            className={`p-2 rounded-xl transition-colors ${viewMode === 'tafsir' ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'hover:bg-slate-100'}`}
          >
            <BookOpen className="w-4 h-4" />
          </button>
          <button onClick={toggleBookmark} className="p-2 rounded-xl hover:bg-slate-100">
            {isBookmarked ? <BookmarkCheck className="w-4 h-4 fill-amber-500 text-amber-600" /> : <Bookmark className="w-4 h-4" />}
          </button>
          <button onClick={() => setIsTafsirSelectorOpen(true)} className="p-2 rounded-xl hover:bg-slate-100">
            <Globe className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* دیمەنی دەقی قورئان بە فۆنتی عوسمانی و قابلیت هایلایت */}
      {viewMode === 'mushaf' && (
        <div 
          className="relative flex-1 flex flex-col items-center justify-start p-4 pt-16 overflow-y-auto bg-[#fbf9f1]" 
          onClick={() => { setShowControls(prev => !prev); setActiveAyah(null); }}
        >
          {loadingAyahs ? (
            <div className="text-center py-32">
              <Loader2 className="w-8 h-8 mx-auto text-amber-700 animate-spin" />
              <p className="text-xs text-slate-500 pt-2">پەڕەکە باردەکرێت...</p>
            </div>
          ) : (
            <div className="w-full max-w-md bg-white p-6 rounded-2xl shadow-md border border-amber-200/60 text-right leading-[2.8] font-quran-mushaf text-2xl my-auto">
              {pageAyahsData.map((ayah) => {
                const isSelected = activeAyah?.number === ayah.number;
                return (
                  <span
                    key={ayah.number}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveAyah(ayah);
                    }}
                    className={`inline cursor-pointer transition-colors px-1 rounded ${
                      isSelected ? 'bg-amber-300/60 text-amber-950 font-bold border-b-2 border-amber-600' : 'hover:bg-amber-100/40 text-slate-900'
                    }`}
                  >
                    {ayah.arabic}{' '}
                    <span className="text-xs font-sans font-bold text-amber-800 border border-amber-300 px-1.5 py-0.5 rounded-full inline-block mx-1">
                      {ayah.numberInSurah}
                    </span>
                  </span>
                );
              })}
            </div>
          )}

          {/* مینیوی چالاک کاتێک ئایەتێک دەستنیشان دەکرێت */}
          {activeAyah && (
            <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-[#1b2a22] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-600/60 backdrop-blur-md" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => { saveAyahBookmark(activeAyah); setActiveAyah(null); }} title="خەزنکردن" className="p-1 hover:text-emerald-400">
                <Bookmark className="w-4 h-4 text-emerald-400" />
              </button>
              <div className="w-[1px] h-5 bg-white/20" />
              <button onClick={() => { shareAyah(activeAyah); setActiveAyah(null); }} title="شەیرکردن" className="p-1 hover:text-blue-400">
                <Share2 className="w-4 h-4 text-blue-400" />
              </button>
              <div className="w-[1px] h-5 bg-white/20" />
              <button onClick={() => { setActiveAyahTafsir(activeAyah); setActiveAyah(null); }} title="تەفسیر" className="p-1 hover:text-amber-400">
                <BookOpen className="w-4 h-4 text-amber-400" />
              </button>
              <div className="w-[1px] h-5 bg-white/20" />
              <button onClick={() => { playSingleAyahAudio(activeAyah); setActiveAyah(null); }} title="خوێندنەوە" className="p-1 hover:text-emerald-400">
                <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />
              </button>
              <button onClick={() => setActiveAyah(null)} className="mr-2 p-1 hover:bg-white/10 rounded-full text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* فۆرماتی تەفسیر */}
      {viewMode === 'tafsir' && (
        <div className="flex-1 overflow-y-auto p-4 pt-16 space-y-6 bg-white" dir="rtl">
          {pageAyahsData.map((ayah) => (
            <div key={ayah.numberInSurah} className="space-y-3 pb-6 border-b border-slate-200 text-right">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-xs font-bold">{ayah.surahNumber}:{ayah.numberInSurah}</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => playSingleAyahAudio(ayah)} className="p-1.5 rounded-lg bg-slate-100 hover:bg-amber-100"><Play className="w-4 h-4" /></button>
                  <button onClick={() => saveAyahBookmark(ayah)} className="p-1.5 rounded-lg bg-slate-100 hover:bg-amber-100"><Bookmark className="w-4 h-4" /></button>
                  <button onClick={() => shareAyah(ayah)} className="p-1.5 rounded-lg bg-slate-100 hover:bg-amber-100"><Share2 className="w-4 h-4" /></button>
                </div>
              </div>
              <p className="font-quran-mushaf text-2xl leading-loose">{ayah.arabic}</p>
              <div className="p-3.5 rounded-2xl bg-slate-50 border text-sm text-slate-700 leading-relaxed">
                <strong className="text-amber-800 block mb-1">تەفسیری کوردی:</strong>
                {ayah.asanTafsir}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* مۆدالی پیشاندانی تەفسیری تاکەکەسی */}
      {activeAyahTafsir && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border text-right">
            <div className="flex items-center justify-between border-b pb-3">
              <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800">ئایەتی {activeAyahTafsir.numberInSurah}</span>
              <button onClick={() => setActiveAyahTafsir(null)} className="p-1 rounded-full text-slate-500"><X className="w-5 h-5" /></button>
            </div>
            <p className="font-quran-mushaf text-xl leading-relaxed">{activeAyahTafsir.arabic}</p>
            <div className="bg-slate-50 p-4 rounded-xl border text-sm leading-relaxed text-slate-700">
              <strong className="text-amber-800 block mb-1">تەفسیر:</strong>
              {activeAyahTafsir.asanTafsir}
            </div>
          </div>
        </div>
      )}

      {/* ناویگەیشنی خوارەوە */}
      <footer className={`absolute bottom-0 left-0 right-0 z-30 bg-white border-t px-4 py-3 flex items-center justify-between shadow-lg transition-all duration-300 ${
        showControls ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'
      }`} dir="rtl">
        <div className="flex items-center gap-2">
          <button onClick={onPrevPage} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold">پەڕەی پێشوو</button>
          <button onClick={onNextPage} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold">پەڕەی داهاتوو</button>
        </div>
        <button onClick={() => setIsRecitersModalOpen(true)} className="text-xs font-bold text-slate-800 hover:text-amber-700">
          {selectedReciter.name}
        </button>
      </footer>

      <RecitersModal isOpen={isRecitersModalOpen} onClose={() => setIsRecitersModalOpen(false)} selectedReciterId={selectedReciter.id} onSelectReciter={setSelectedReciter} />
      <TafsirSelectorModal isOpen={isTafsirSelectorOpen} onClose={() => setIsTafsirSelectorOpen(false)} selectedTafsirId={selectedTafsir.id} onSelectTafsir={setSelectedTafsir} />
    </div>
  );
};
