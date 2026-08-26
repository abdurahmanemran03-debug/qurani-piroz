import React, { useState, useEffect } from 'react';
import { SURAHS_INDEX } from './data/surahsData';
import { SurahListView } from './components/SurahListView';
import { MushafPageView } from './components/MushafPageView';
import { MushafTextPage1Test } from './components/MushafTextPage1Test';

export default function App() {
  const [view, setView] = useState<'index' | 'mushaf' | 'test'>(() => {
    try {
      const saved = localStorage.getItem('quran_last_view');
      return saved === 'mushaf' ? 'mushaf' : 'index';
    } catch {
      return 'index';
    }
  });

  const [currentPage, setCurrentPage] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('quran_last_page');
      const n = saved ? parseInt(saved, 10) : 1;
      return n >= 1 && n <= 604 ? n : 1;
    } catch {
      return 1;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('quran_last_view', view);
    } catch {}
  }, [view]);

  useEffect(() => {
    try {
      localStorage.setItem('quran_last_page', String(currentPage));
    } catch {}
  }, [currentPage]);

  // پاراستنی شوێنی سکرۆڵی پێڕستی سوورەتەکان (view === 'index')
  useEffect(() => {
    if (view !== 'index') return;

    const raf = requestAnimationFrame(() => {
      try {
        const saved = sessionStorage.getItem('quran_index_scroll');
        if (saved) {
          window.scrollTo({ top: parseInt(saved, 10), behavior: 'auto' });
        }
      } catch {}
    });

    let saveTimer: ReturnType<typeof setTimeout> | null = null;
    const handleScroll = () => {
      if (saveTimer) clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        try {
          sessionStorage.setItem('quran_index_scroll', String(window.scrollY));
        } catch {}
      }, 150);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', handleScroll);
      if (saveTimer) clearTimeout(saveTimer);
    };
  }, [view]);

  const openSurahPage = (page: number) => {
    setCurrentPage(page);
    setView('mushaf');
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-slate-200" dir="rtl">
      
      {/* دوگمەیەکی کاتی بۆ بینینی تاقیکردنەوەی فۆنتەکە */}
      <div className="bg-amber-100 p-2 text-center text-xs border-b border-amber-300 flex justify-center gap-4">
        <span>حالەتی ئێستا: {view}</span>
        <button 
          onClick={() => setView(view === 'test' ? 'index' : 'test')} 
          className="bg-amber-600 text-white px-2 py-0.5 rounded shadow hover:bg-amber-700 transition"
        >
          {view === 'test' ? 'گەڕانەوە بۆ پڕۆژە' : 'تاقیکردنەوەی فۆنتی لاپەڕەی ١'}
        </button>
      </div>

      {view === 'test' && <MushafTextPage1Test />}

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
