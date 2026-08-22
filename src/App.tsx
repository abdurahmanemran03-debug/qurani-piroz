import React, { useState } from 'react';
import { SURAHS_INDEX } from './data/surahsData';
import { SurahListView } from './components/SurahListView';
import { MushafPageView } from './components/MushafPageView';
import { SettingsModal } from './components/SettingsModal';
import { BgThemeType, AppLangType, AccentColorType } from './types';

export default function App() {
  const [view, setView] = useState<'index' | 'mushaf' | 'settings'>('index');
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Settings State
  const [bgStyle, setBgStyle] = useState<BgThemeType>('white');
  const [appLang, setAppLang] = useState<AppLangType>('ku');
  const [accentColor, setAccentColor] = useState<AccentColorType>('gold');
  const [showKurdishNames, setShowKurdishNames] = useState<boolean>(true);
  const [showNumbers, setShowNumbers] = useState<boolean>(true);

  const openSurahPage = (page: number) => {
    setCurrentPage(page);
    setView('mushaf');
  };

  const getContainerBg = () => {
    if (bgStyle === 'cream') return 'bg-[#f7f2e5] text-[#3c2d15]';
    if (bgStyle === 'dark') return 'bg-[#0a0d14] text-slate-100';
    return 'bg-[#ffffff] text-slate-800';
  };

  return (
    <div className={`min-h-screen ${getContainerBg()} font-sans selection:bg-slate-200 transition-colors duration-200`} dir={appLang === 'en' ? 'ltr' : 'rtl'}>
      {view === 'index' && (
        <SurahListView
          surahs={SURAHS_INDEX}
          onOpenSurah={openSurahPage}
          onOpenSettings={() => setView('settings')}
          bgStyle={bgStyle}
          appLang={appLang}
          accentColor={accentColor}
          showKurdishNames={showKurdishNames}
          showNumbers={showNumbers}
        />
      )}

      {view === 'mushaf' && (
        <MushafPageView
          currentPage={currentPage}
          onNextPage={() => currentPage < 604 && setCurrentPage(p => p + 1)}
          onPrevPage={() => currentPage > 1 && setCurrentPage(p => p - 1)}
          onBackToIndex={() => setView('index')}
          bgStyle={bgStyle}
          appLang={appLang}
          showNumbers={showNumbers}
          surahsList={SURAHS_INDEX}
          onJumpToPage={(p) => setCurrentPage(p)}
        />
      )}

      {view === 'settings' && (
        <SettingsModal
          onClose={() => setView('index')}
          bgStyle={bgStyle}
          setBgStyle={setBgStyle}
          appLang={appLang}
          setAppLang={setAppLang}
          accentColor={accentColor}
          setAccentColor={setAccentColor}
          showKurdishNames={showKurdishNames}
          setShowKurdishNames={setShowKurdishNames}
          showNumbers={showNumbers}
          setShowNumbers={setShowNumbers}
        />
      )}
    </div>
  );
}
