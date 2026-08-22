import React, { useState } from 'react';
import { SURAHS_INDEX } from './data/surahsData';
import { SurahListView } from './components/SurahListView';
import { MushafPageView } from './components/MushafPageView';

export default function App() {
  const [view, setView] = useState<'index' | 'mushaf'>('index');
  const [currentPage, setCurrentPage] = useState<number>(1);

  const openSurahPage = (page: number) => {
    setCurrentPage(page);
    setView('mushaf');
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-slate-200" dir="rtl">
      
      {/* ١. پێڕستی سەرەکیی سوورەتەکان */}
      {view === 'index' && (
        <SurahListView
          surahs={SURAHS_INDEX}
          onOpenSurah={openSurahPage}
          onOpenSettings={() => {}}
          bgStyle="white"
          appLang="ku"
          accentColor="gold"
          showKurdishNames={true}
          showNumbers={true}
        />
      )}

      {/* ٢. لاپەڕەی ڕاستەقینەی موسحەفی مەدینە */}
      {view === 'mushaf' && (
        <MushafPageView
          currentPage={currentPage}
          onNextPage={() => currentPage < 604 && setCurrentPage(p => p + 1)}
          onPrevPage={() => currentPage > 1 && setCurrentPage(p => p - 1)}
          onBackToIndex={() => setView('index')}
          bgStyle="white"
          appLang="ku"
          showNumbers={true}
          surahsList={SURAHS_INDEX}
          onJumpToPage={(p) => setCurrentPage(p)}
        />
      )}

    </div>
  );
}
