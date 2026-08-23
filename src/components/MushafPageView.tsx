import React, { useState, useEffect, useRef, useCallback } from 'react';
import HTMLFlipBook from 'react-pageflip';
import {
  ArrowRight,
  Loader2,
  BookOpen,
  Play,
  Pause,
  Bookmark,
  BookmarkCheck,
  X,
  Globe,
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

interface QuranPageProps {
  page: number;
}

const TOTAL_PAGES = 604;

const formatPageNum = (n: number) =>
  String(n).padStart(3, '0');

const pageImgUrl = (n: number) =>
  `https://android.quran.com/data/width_1260/page${formatPageNum(n)}.png`;

const PAGE_IMG_FILTER = {
  filter: 'grayscale(100%) contrast(115%) brightness(102%)',
  mixBlendMode: 'multiply' as const,
};

const QuranPage = React.forwardRef<HTMLDivElement, QuranPageProps>(
  ({ page }, ref) => {
    return (
      <div
        ref={ref}
        className="relative bg-[#fffdf8] overflow-hidden"
        style={{
          width: '100%',
          height: '100%',
          boxShadow: 'inset 0 0 18px rgba(0,0,0,0.07)',
        }}
      >
        <div className="absolute inset-0 pointer-events-none z-10 bg-gradient-to-r from-black/[0.025] via-transparent to-black/[0.02]" />

        <img
          src={pageImgUrl(page)}
          alt={`Quran page ${page}`}
          draggable={false}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-contain select-none pointer-events-none"
          style={PAGE_IMG_FILTER}
        />

        <div className="absolute bottom-2 left-0 right-0 flex justify-center pointer-events-none">
          <span className="text-[9px] text-slate-400/70 font-mono">
            {page}
          </span>
        </div>
      </div>
    );
  }
);

QuranPage.displayName = 'QuranPage';

export const MushafPageView: React.FC<MushafPageViewProps> = ({
  currentPage,
  onNextPage,
  onPrevPage,
  onBackToIndex,
  bgStyle,
  appLang,
  showNumbers,
  surahsList = [],
  onJumpToPage,
}) => {
  const [viewMode, setViewMode] =
    useState<'mushaf' | 'tafsir'>('mushaf');

  const [showControls, setShowControls] = useState(true);
  const [loadingPage, setLoadingPage] = useState(true);

  const [isRecitersModalOpen, setIsRecitersModalOpen] =
    useState(false);

  const [isTafsirSelectorOpen, setIsTafsirSelectorOpen] =
    useState(false);

  const [isSurahPickerOpen, setIsSurahPickerOpen] =
    useState(false);

  const [selectedReciter, setSelectedReciter] =
    useState<ReciterItem>(ALL_RECITERS_DIRECTORY[18]);

  const [selectedTafsir, setSelectedTafsir] =
    useState<TafsirItem>(ALL_TAFSIRS_DIRECTORY[0]);

  const [pageAyahsData, setPageAyahsData] =
    useState<any[]>([]);

  const [loadingTafsir, setLoadingTafsir] =
    useState(false);

  const [bookmarks, setBookmarks] = useState<number[]>(() => {
    try {
      const saved =
        localStorage.getItem('quran_bookmarks');

      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isPlayingAudio, setIsPlayingAudio] =
    useState(false);

  const audioRef =
    useRef<HTMLAudioElement | null>(null);

  const bookRef = useRef<any>(null);

  const isBookmarked =
    bookmarks.includes(currentPage);

  const currentJuz =
    Math.ceil(currentPage / 20);

  const currentSurah =
    surahsList
      .slice()
      .reverse()
      .find(s => currentPage >= s.startPage) ||
    surahsList[0];

  /*
   * =========================================================
   * RTL PAGEFLIP
   *
   * react-pageflip index:
   *   0 = first child
   *   603 = last child
   *
   * Mushaf:
   *   1 = first Quran page
   *   604 = last Quran page
   *
   * بۆ RTL، index ـەکەمان پێچەوانە دەکەین.
   * =========================================================
   */

  const pageToFlipIndex = useCallback(
    (page: number) => TOTAL_PAGES - page,
    []
  );

  const flipIndexToPage = useCallback(
    (index: number) => TOTAL_PAGES - index,
    []
  );

  /*
   * When currentPage changes from outside the component
   * (surah picker, bookmark, etc.), move the book there.
   */
  useEffect(() => {
    if (!bookRef.current) return;

    const flipBook = bookRef.current.pageFlip();

    if (!flipBook) return;

    const targetIndex =
      pageToFlipIndex(currentPage);

    const currentIndex =
      flipBook.getCurrentPageIndex();

    if (currentIndex !== targetIndex) {
      flipBook.turnToPage(targetIndex);
    }
  }, [currentPage, pageToFlipIndex]);

  /*
   * PageFlip event.
   *
   * Every time the user finishes a real page turn,
   * update the parent currentPage.
   */
  const handleFlip = useCallback(
    (e: any) => {
      const index = Number(e.data);

      if (!Number.isFinite(index)) return;

      const page =
        flipIndexToPage(index);

      if (
        page >= 1 &&
        page <= TOTAL_PAGES &&
        page !== currentPage
      ) {
        if (onJumpToPage) {
          onJumpToPage(page);
        } else if (page > currentPage) {
          onNextPage();
        } else {
          onPrevPage();
        }
      }

      setLoadingPage(false);
    },
    [
      currentPage,
      flipIndexToPage,
      onJumpToPage,
      onNextPage,
      onPrevPage,
    ]
  );

  /*
   * Manual next / previous buttons.
   */
  const goNext = useCallback(() => {
    if (currentPage >= TOTAL_PAGES) return;

    const flipBook =
      bookRef.current?.pageFlip();

    if (flipBook) {
      flipBook.flipNext('bottom');
    } else if (onJumpToPage) {
      onJumpToPage(currentPage + 1);
    } else {
      onNextPage();
    }
  }, [
    currentPage,
    onJumpToPage,
    onNextPage,
  ]);

  const goPrev = useCallback(() => {
    if (currentPage <= 1) return;

    const flipBook =
      bookRef.current?.pageFlip();

    if (flipBook) {
      flipBook.flipPrev('bottom');
    } else if (onJumpToPage) {
      onJumpToPage(currentPage - 1);
    } else {
      onPrevPage();
    }
  }, [
    currentPage,
    onJumpToPage,
    onPrevPage,
  ]);

  const toggleBookmark = () => {
    let updated: number[];

    if (isBookmarked) {
      updated =
        bookmarks.filter(
          p => p !== currentPage
        );
    } else {
      updated = [
        ...bookmarks,
        currentPage,
      ];
    }

    setBookmarks(updated);

    localStorage.setItem(
      'quran_bookmarks',
      JSON.stringify(updated)
    );

    if (navigator.vibrate) {
      navigator.vibrate(35);
    }
  };

  /*
   * Tafsir / translation data
   */
  useEffect(() => {
    async function loadPageVerses() {
      setLoadingTafsir(true);

      try {
        const res = await fetch(
          `https://api.alquran.cloud/v1/page/${currentPage}/editions/quran-uthmani,ku.asan`
        );

        const data = await res.json();

        if (
          data.code === 200 &&
          data.data?.length >= 2
        ) {
          const ar =
            data.data[0].ayahs;

          const ku =
            data.data[1].ayahs;

          const combined = ar.map(
            (a: any, i: number) => ({
              surahNumber:
                a.surah.number,

              numberInSurah:
                a.numberInSurah,

              arabic: a.text,

              asanTafsir:
                ku[i]?.text ||
                'بە ناوی خودای بەخشندەی میهرەبان...',
            })
          );

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

  /*
   * Audio
   */
  const togglePageAudio = () => {
    if (isPlayingAudio) {
      audioRef.current?.pause();
      setIsPlayingAudio(false);
      return;
    }

    setIsPlayingAudio(true);

    if (audioRef.current) {
      audioRef.current.src =
        `https://everyayah.com/data/${selectedReciter.serverKey}/PageMp3s/Page${formatPageNum(currentPage)}.mp3`;

      audioRef.current
        .play()
        .catch(() => {
          setIsPlayingAudio(false);
        });
    }
  };

  return (
    <div
      className="relative min-h-screen max-w-lg mx-auto flex flex-col justify-between select-none bg-[#f8f7f2] text-slate-900"
      dir="rtl"
    >
      <audio
        ref={audioRef}
        onEnded={() =>
          setIsPlayingAudio(false)
        }
      />

      {/* =====================================================
          HEADER
      ====================================================== */}

      <header
        className={`
          sticky top-0 z-40
          bg-white/95 backdrop-blur-md
          border-b border-slate-200
          px-3 py-2.5
          flex items-center justify-between
          shadow-sm
          transition-all duration-300
          ${
            showControls
              ? 'translate-y-0 opacity-100'
              : '-translate-y-full opacity-0 pointer-events-none'
          }
        `}
      >
        <button
          onClick={onBackToIndex}
          className="p-2 rounded-xl hover:bg-slate-100 active:scale-95 text-slate-700 transition-all"
          title="گەڕانەوە"
        >
          <ArrowRight className="w-5 h-5" />
        </button>

        <div className="text-center">
          <h2 className="font-bold text-sm text-slate-800">
            سووڕەتی{' '}
            {currentSurah?.nameAr ||
              'الفاتحة'}
          </h2>

          <p className="text-[11px] text-slate-500 font-medium">
            پەڕەی {currentPage} · جوزئی {currentJuz}
          </p>
        </div>

        <div className="flex items-center gap-1 text-slate-700">
          <button
            onClick={() =>
              setViewMode(prev =>
                prev === 'mushaf'
                  ? 'tafsir'
                  : 'mushaf'
              )
            }
            className={`
              p-2 rounded-xl
              transition-all
              ${
                viewMode === 'tafsir'
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'hover:bg-slate-100'
              }
            `}
            title="تەفسیر"
          >
            <BookOpen className="w-4 h-4" />
          </button>

          <button
            onClick={toggleBookmark}
            className={`
              p-2 rounded-xl transition-all
              ${
                isBookmarked
                  ? 'text-amber-600 bg-amber-50'
                  : 'hover:bg-slate-100'
              }
            `}
            title="نیشانەکردن"
          >
            {isBookmarked ? (
              <BookmarkCheck
                className="w-4 h-4 fill-amber-500 text-amber-600"
              />
            ) : (
              <Bookmark className="w-4 h-4" />
            )}
          </button>

          <button
            onClick={() =>
              setIsTafsirSelectorOpen(true)
            }
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-700 transition-all"
            title="تەفسیرەکان"
          >
            <Globe className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* =====================================================
          MUSHAF
      ====================================================== */}

      {viewMode === 'mushaf' && (
        <main
          className="relative flex-1 flex items-center justify-center overflow-hidden px-2 py-3"
          onClick={() =>
            setShowControls(prev => !prev)
          }
        >
          {loadingPage && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-[#f8f7f2]/90 backdrop-blur-sm">
              <Loader2 className="w-8 h-8 text-amber-700 animate-spin" />

              <span className="text-xs text-slate-700 font-bold">
                لاپەڕەکە باردەکرێت...
              </span>
            </div>
          )}

          <div
            className="relative w-full flex justify-center items-center"
            style={{
              perspective: '1800px',
            }}
          >
            <div
              className="
                relative
                w-full
                max-w-[480px]
                rounded-sm
                overflow-visible
              "
              style={{
                filter:
                  'drop-shadow(0 12px 25px rgba(0,0,0,0.16))',
              }}
              onClick={e =>
                e.stopPropagation()
              }
            >
              <HTMLFlipBook
                ref={bookRef}
                width={420}
                height={680}
                size="stretch"
                minWidth={280}
                maxWidth={480}
                minHeight={420}
                maxHeight={780}
                startPage={pageToFlipIndex(
                  currentPage
                )}
                drawShadow={true}
                maxShadowOpacity={0.38}
                flippingTime={720}
                usePortrait={true}
                autoSize={true}
                showCover={false}
                mobileScrollSupport={true}
                useMouseEvents={true}
                swipeDistance={25}
                clickEventForward={false}
                disableFlipByClick={false}
                showPageCorners={true}
                startZIndex={10}
                onFlip={handleFlip}
                onInit={() =>
                  setLoadingPage(false)
                }
              >
                {Array.from(
                  { length: TOTAL_PAGES },
                  (_, index) => {
                    const page =
                      TOTAL_PAGES - index;

                    return (
                      <QuranPage
                        key={page}
                        page={page}
                      />
                    );
                  }
                )}
              </HTMLFlipBook>
            </div>
          </div>

          {/* Page indicator */}

          <div
            className="
              absolute
              bottom-3
              left-1/2
              -translate-x-1/2
              z-20
              px-3 py-1
              rounded-full
              bg-black/55
              backdrop-blur-md
              text-white
              text-[10px]
              font-medium
              pointer-events-none
            "
          >
            {currentPage} / {TOTAL_PAGES}
          </div>
        </main>
      )}

      {/* =====================================================
          TAFSIR
      ====================================================== */}

      {viewMode === 'tafsir' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-6 animate-in fade-in bg-white">
          {loadingTafsir ? (
            <div className="text-center py-20">
              <Loader2 className="w-8 h-8 mx-auto text-amber-600 animate-spin" />

              <p className="text-xs text-slate-500 pt-2">
                تەفسیرەکان باردەکرێن...
              </p>
            </div>
          ) : (
            pageAyahsData.map(ayah => (
              <div
                key={`${ayah.surahNumber}-${ayah.numberInSurah}`}
                className="space-y-3 pb-6 border-b border-slate-200 text-right"
              >
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 text-xs font-mono font-bold">
                  {ayah.surahNumber}:
                  {ayah.numberInSurah}
                </span>

                <p className="font-quran text-slate-900 text-xl sm:text-2xl leading-loose">
                  {ayah.arabic}
                </p>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-700 leading-relaxed">
                  <strong className="text-amber-800 block mb-1">
                    تەفسیری کوردی:
                  </strong>

                  {ayah.asanTafsir}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* =====================================================
          FOOTER
      ====================================================== */}

      <footer
        className={`
          sticky bottom-0 z-40
          bg-white/95 backdrop-blur-md
          border-t border-slate-200
          px-4 py-3
          flex items-center justify-between
          shadow-lg
          transition-all duration-300
          ${
            showControls
              ? 'translate-y-0 opacity-100'
              : 'translate-y-full opacity-0 pointer-events-none'
          }
        `}
      >
        <button
          onClick={() =>
            setIsRecitersModalOpen(true)
          }
          className="text-xs sm:text-sm font-bold text-slate-800 hover:text-amber-700 transition-colors"
        >
          {selectedReciter.name}
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={goPrev}
            className="
              w-9 h-9
              rounded-full
              bg-slate-100
              hover:bg-slate-200
              active:scale-90
              transition-all
              text-slate-700
            "
            title="پەڕەی پێشوو"
          >
            ‹
          </button>

          <button
            onClick={togglePageAudio}
            className="
              w-10 h-10
              rounded-full
              bg-slate-900
              text-white
              hover:bg-slate-800
              active:scale-90
              transition-all
              shadow-md
            "
          >
            {isPlayingAudio ? (
              <Pause className="w-4 h-4 mx-auto" />
            ) : (
              <Play className="w-4 h-4 mx-auto fill-white" />
            )}
          </button>

          <button
            onClick={goNext}
            className="
              w-9 h-9
              rounded-full
              bg-slate-100
              hover:bg-slate-200
              active:scale-90
              transition-all
              text-slate-700
            "
            title="پەڕەی داهاتوو"
          >
            ›
          </button>
        </div>
      </footer>

      {/* =====================================================
          MODALS
      ====================================================== */}

      <RecitersModal
        isOpen={isRecitersModalOpen}
        onClose={() =>
          setIsRecitersModalOpen(false)
        }
        selectedReciterId={
          selectedReciter.id
        }
        onSelectReciter={r =>
          setSelectedReciter(r)
        }
      />

      <TafsirSelectorModal
        isOpen={isTafsirSelectorOpen}
        onClose={() =>
          setIsTafsirSelectorOpen(false)
        }
        selectedTafsirId={
          selectedTafsir.id
        }
        onSelectTafsir={t =>
          setSelectedTafsir(t)
        }
      />

      {/* =====================================================
          SURAH PICKER
      ====================================================== */}

      {isSurahPickerOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm p-4 flex items-end sm:items-center justify-center animate-in fade-in">
          <div
            className="
              bg-white
              border border-slate-200
              rounded-3xl
              max-w-lg
              w-full
              p-5
              space-y-4
              max-h-[80vh]
              overflow-y-auto
              shadow-2xl
            "
            dir="rtl"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm">
                هەڵبژاردنی سوورەت یان لاپەڕە
              </h3>

              <button
                onClick={() =>
                  setIsSurahPickerOpen(false)
                }
                className="p-1.5 rounded-xl bg-slate-100 text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {surahsList.map(s => (
                <button
                  key={s.number}
                  onClick={() => {
                    if (onJumpToPage) {
                      onJumpToPage(
                        s.startPage
                      );
                    }

                    setIsSurahPickerOpen(
                      false
                    );
                  }}
                  className={`
                    p-3
                    rounded-2xl
                    text-right
                    border
                    text-xs
                    font-bold
                    transition-all
                    ${
                      currentPage >=
                      s.startPage
                        ? 'bg-amber-50 border-amber-200 text-amber-900'
                        : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                    }
                  `}
                >
                  <span className="block">
                    سورة {s.nameAr}
                  </span>

                  <span className="text-[10px] text-slate-500 font-normal">
                    لاپەڕەی {s.startPage}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
