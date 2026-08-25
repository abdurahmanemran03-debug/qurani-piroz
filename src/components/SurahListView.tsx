import React, { useState, useEffect, useMemo } from 'react';
import { Search, BookOpen, Settings as SettingsIcon, Loader2, X } from 'lucide-react';
import { SurahItem, BgThemeType, AppLangType, AccentColorType } from '../types';

interface SurahListViewProps {
  surahs: SurahItem[];
  onOpenSurah: (startPage: number) => void;
  onOpenSettings: () => void;
  bgStyle: BgThemeType;
  appLang: AppLangType;
  accentColor: AccentColorType;
  showKurdishNames: boolean;
  showNumbers: boolean;
}

const JUZ_START_PAGES = [
  1, 22, 42, 62, 82, 102, 121, 142, 162, 182,
  201, 222, 242, 262, 282, 302, 322, 342, 362, 382,
  402, 422, 442, 462, 482, 502, 522, 542, 562, 582,
];

type CombinedItem =
  | { kind: 'juz'; juzNumber: number; page: number }
  | { kind: 'surah'; surah: SurahItem };

const KaabaIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="6" width="18" height="15" rx="1" fill="#111111" />
    <rect x="3" y="6" width="18" height="4.2" fill="#d4af37" />
    <rect x="10.2" y="12" width="3.6" height="9" fill="#1a1a1a" stroke="#d4af37" strokeWidth="0.5" />
    <path d="M3 6 L12 2 L21 6" stroke="#111111" strokeWidth="1.2" strokeLinejoin="round" fill="none" />
  </svg>
);

const MedinaIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="15" width="16" height="6" rx="0.5" fill="#0f6b4c" />
    <rect x="2" y="19" width="20" height="2" rx="0.5" fill="#0a4a34" />
    <circle cx="12" cy="10.5" r="4" fill="#0f6b4c" />
    <rect x="10.5" y="6" width="3" height="4" fill="#0f6b4c" />
    <circle cx="12" cy="5" r="1" fill="#d4af37" />
    <rect x="4.4" y="9" width="1.6" height="10" fill="#0f6b4c" />
    <rect x="18" y="9" width="1.6" height="10" fill="#0f6b4c" />
    <path d="M5.2 9 L5.2 5.5" stroke="#0f6b4c" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M18.8 9 L18.8 5.5" stroke="#0f6b4c" strokeWidth="1.6" strokeLinecap="round" />
    <circle cx="5.2" cy="5" r="0.9" fill="#d4af37" />
    <circle cx="18.8" cy="5" r="0.9" fill="#d4af37" />
  </svg>
);

export const SurahListView: React.FC<SurahListViewProps> = ({
  surahs,
  onOpenSurah,
  onOpenSettings,
  bgStyle,
  appLang,
  accentColor,
  showKurdishNames,
  showNumbers
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);

  const combinedList = useMemo<CombinedItem[]>(() => {
    const list: CombinedItem[] = [];
    let juzIndex = 0;
    for (const s of surahs) {
      while (juzIndex < JUZ_START_PAGES.length && JUZ_START_PAGES[juzIndex] <= s.startPage) {
        list.push({ kind: 'juz', juzNumber: juzIndex + 1, page: JUZ_START_PAGES[juzIndex] });
        juzIndex++;
      }
      list.push({ kind: 'surah', surah: s });
    }
    return list;
  }, [surahs]);

  const [ayahResults, setAyahResults] = useState<any[]>([]);
  const [loadingAyah, setLoadingAyah] = useState(false);
  const [ayahSearchDone, setAyahSearchDone] = useState(false);

  // گەڕان بۆ هەموو ئەنجامەکان لە سەرتاسەری قورئاندا بێ سنووردارکردن بە 30 دانە
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q || q.length < 1) {
      setAyahResults([]);
      setAyahSearchDone(false);
      setLoadingAyah(false);
      return;
    }

    setLoadingAyah(true);
    setAyahSearchDone(false);
    const timer = setTimeout(async () => {
      try {
        const [resAr, resKu] = await Promise.all([
          fetch(`https://api.alquran.cloud/v1/search/${encodeURIComponent(q)}/all/quran-uthmani`),
          fetch(`https://api.alquran.cloud/v1/search/${encodeURIComponent(q)}/all/ku.asan`)
        ]);
        
        const dataAr = await resAr.json();
        const dataKu = await resKu.json();
        
        let combinedMatches: any[] = [];
        if (dataAr.code === 200 && dataAr.data?.matches) {
          combinedMatches = [...dataAr.data.matches];
        }
        if (dataKu.code === 200 && dataKu.data?.matches) {
          dataKu.data.matches.forEach((kuMatch: any) => {
            if (!combinedMatches.some(m => m.number === kuMatch.number)) {
              combinedMatches.push(kuMatch);
            }
          });
        }

        // لێرەدا کۆتایی بە سنووردارکردن هێنراوە تاوەکو هەموو ئەنجامەکان نیشان بدات
        setAyahResults(combinedMatches);
      } catch {
        setAyahResults([]);
      } finally {
        setLoadingAyah(false);
        setAyahSearchDone(true);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const openAyahResult = async (match: any) => {
    if (match.page) {
      onOpenSurah(match.page);
      return;
    }
    try {
      const res = await fetch(`https://api.alquran.cloud/v1/ayah/${match.surah.number}:${match.numberInSurah}/quran-uthmani`);
      const data = await res.json();
      if (data.code === 200 && data.data?.page) {
        onOpenSurah(data.data.page);
      }
    } catch {}
  };

  const getCardStyle = () => {
    if (bgStyle === 'cream') return 'bg-[#fcfaf5] border-[#ebdcb9] hover:bg-[#f4ebd8] text-[#3c2d15]';
    if (bgStyle === 'dark') return 'bg-[#121722] border-slate-800 hover:bg-[#181f2e] text-slate-100';
    return 'bg-white border-slate-200 hover:bg-slate-50 text-slate-900 shadow-xs';
  };

  const getAccentText = () => {
    if (accentColor === 'emerald') return 'text-emerald-700';
    if (accentColor === 'blue') return 'text-blue-700';
    return 'text-[#854d0e]';
  };

  const renderSurahCard = (surah: SurahItem) => {
    const isMeccan = surah.typeKu === 'مەککەیی';
    return (
      <div
        key={surah.number}
        onClick={() => onOpenSurah(surah.startPage)}
        className={`p-3.5 rounded-2xl border cursor-pointer flex items-center justify-between transition-all active:scale-[0.99] ${getCardStyle()}`}
      >
        <div className="flex items-center gap-3">
          {showNumbers && (
            <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
              {surah.number}
            </div>
          )}
          <div>
            <h3 className="font-bold text-sm">سورة {surah.nameAr}</h3>
            <p className="text-[11px] opacity-75 flex items-center gap-1 flex-wrap">
              {showKurdishNames && <span>{appLang === 'en' ? surah.nameEn : surah.nameKu} • </span>}
              <span className="flex items-center gap-1">
                {isMeccan ? <KaabaIcon className="w-4 h-4 shrink-0" /> : <MedinaIcon className="w-4 h-4 shrink-0" />}
                <span>{appLang === 'ar' ? surah.typeAr : (appLang === 'en' ? surah.typeEn : surah.typeKu)}</span>
              </span>
              <span>• {surah.ayahs} {appLang === 'ar' ? 'آيات' : (appLang === 'en' ? 'verses' : 'ئایەت')}</span>
            </p>
          </div>
        </div>

        {showNumbers && (
          <div className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 shrink-0">
            {appLang === 'en' ? `Page ${surah.startPage}` : `لاپەڕەی ${surah.startPage}`}
          </div>
        )}
      </div>
    );
  };

  const renderJuzHeader = (juzNumber: number, page: number) => (
    <div
      key={`juz-${juzNumber}`}
      className="px-3.5 py-2 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-between"
    >
      <span className="text-[11px] font-bold text-slate-500">
        {appLang === 'ar' ? `صفحة ${page}` : (appLang === 'en' ? `Page ${page}` : `لاپەڕەی ${page}`)}
      </span>
      <span className="text-xs font-bold text-slate-700">
        {appLang === 'ar' ? `الجزء ${juzNumber}` : (appLang === 'en' ? `Juz ${juzNumber}` : `جوزئی ${juzNumber}`)}
      </span>
    </div>
  );

  const showingSearch = searchQuery.trim().length > 0;

  return (
    <div className="max-w-xl mx-auto p-4 space-y-4" dir="rtl">
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <BookOpen className={`w-6 h-6 ${getAccentText()}`} />
          <h1 className={`text-xl sm:text-2xl font-bold font-serif ${getAccentText()}`}>
            {appLang === 'ku' && 'قورئانی پیرۆز'}
            {appLang === 'ar' && 'القرآن الكريم'}
            {appLang === 'en' && 'The Noble Quran'}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {isSearchActive ? (
            <div className="relative flex items-center">
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={appLang === 'ku' ? 'گەڕان لە ئایەت و تەفسیر...' : 'Search ayahs & tafsir...'}
                className="w-44 sm:w-56 text-xs px-3 py-2 pl-7 pr-8 rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-slate-500 shadow-xs"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
              <button 
                onClick={() => { setIsSearchActive(false); setSearchQuery(''); }}
                className="absolute left-2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsSearchActive(true)}
              className="p-2.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-xs transition-all flex items-center gap-1.5 px-3"
              title="گەڕان"
            >
              <Search className="w-4 h-4 text-slate-600" />
              <span className="text-xs font-medium hidden sm:inline">گەڕان</span>
            </button>
          )}

          <button
            onClick={onOpenSettings}
            className="p-2.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-xs transition-all"
            title="ڕێکخستنەکان"
          >
            <SettingsIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="space-y-2 pt-1">
        {!showingSearch && combinedList.map((item) =>
          item.kind === 'juz'
            ? renderJuzHeader(item.juzNumber, item.page)
            : renderSurahCard(item.surah)
        )}

        {showingSearch && (
          <div className="space-y-2">
            {loadingAyah && (
              <div className="flex items-center justify-center gap-2 py-10 text-slate-500 text-xs">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>گەڕان لە هەموو سورەت و ئایەتەکاندا...</span>
              </div>
            )}

            {!loadingAyah && ayahSearchDone && ayahResults.length === 0 && (
              <div className="text-center py-12 text-xs text-slate-400">
                هیچ ئەنجامێک بۆ ئەم وشەیە نەدۆزرایەوە
              </div>
            )}

            {!loadingAyah && ayahResults.map((match, idx) => (
              <div
                key={`${match.number}-${idx}`}
                onClick={() => openAyahResult(match)}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all active:scale-[0.99] ${getCardStyle()}`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-600">
                    سورة {match.surah?.name || match.surah?.englishName} • ئایەتی {match.numberInSurah}
                  </span>
                </div>
                <p className="font-quran text-sm leading-relaxed text-right">{match.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
