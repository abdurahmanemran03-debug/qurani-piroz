import React, { useState } from 'react';
import { Search, BookOpen, Settings as SettingsIcon } from 'lucide-react';
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

  const filtered = surahs.filter(s =>
    s.nameKu.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.nameAr.includes(searchQuery) ||
    s.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
    String(s.number).includes(searchQuery)
  );

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

  return (
    <div className="max-w-xl mx-auto p-4 space-y-4">
      {/* سەرپەڕە */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <BookOpen className={`w-6 h-6 ${getAccentText()}`} />
          <h1 className={`text-xl sm:text-2xl font-bold font-serif ${getAccentText()}`}>
            {appLang === 'ku' && 'قورئانی پیرۆز'}
            {appLang === 'ar' && 'القرآن الكريم'}
            {appLang === 'en' && 'The Noble Quran'}
          </h1>
        </div>

        <button
          onClick={onOpenSettings}
          className="p-2.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-xs transition-all"
        >
          <SettingsIcon className="w-5 h-5" />
        </button>
      </div>

      {/* سێرچ */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={
            appLang === 'ku' ? 'گەڕان لە ناوی سوورەت یان ژمارە (یوسف، ٦٧)...' :
            appLang === 'ar' ? 'بحث عن اسم السورة أو الرقم...' :
            'Search surah name or number...'
          }
          className="w-full text-xs px-4 py-3.5 pr-10 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:border-slate-400 shadow-xs"
        />
        <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
      </div>

      {/* پێڕست */}
      <div className="space-y-2 pt-1">
        {filtered.map((surah) => (
          <div
            key={surah.number}
            onClick={() => onOpenSurah(surah.startPage)}
            className={`p-3.5 rounded-2xl border cursor-pointer flex items-center justify-between transition-all active:scale-[0.99] ${getCardStyle()}`}
          >
            <div className="flex items-center gap-3">
              {showNumbers && (
                <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center">
                  {surah.number}
                </div>
              )}
              <div>
                <h3 className="font-bold text-sm">سورة {surah.nameAr}</h3>
                <p className="text-[11px] opacity-75">
                  {showKurdishNames && <span>{appLang === 'en' ? surah.nameEn : surah.nameKu} • </span>}
                  <span>{appLang === 'ar' ? surah.typeAr : (appLang === 'en' ? surah.typeEn : surah.typeKu)} • </span>
                  <span>{surah.ayahs} {appLang === 'ar' ? 'آيات' : (appLang === 'en' ? 'verses' : 'ئایەت')}</span>
                </p>
              </div>
            </div>

            {showNumbers && (
              <div className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200 text-slate-600">
                {appLang === 'en' ? `Page ${surah.startPage}` : `لاپەڕەی ${surah.startPage}`}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
