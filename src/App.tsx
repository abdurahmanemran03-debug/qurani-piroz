import React, { useState, useEffect } from 'react';
import { MushafPageView } from './components/MushafPageView';

export default function App() {
  const [currentPage, setCurrentPage] = useState(1);

  return (
    <div className="min-h-screen bg-[#f5f0e8]">
      <MushafPageView
        currentPage={currentPage}
        onNextPage={() => setCurrentPage(p => Math.min(p + 1, 604))}
        onPrevPage={() => setCurrentPage(p => Math.max(p - 1, 1))}
        onBackToIndex={() => alert('گەڕانەوە بۆ پێڕست')}
        bgStyle="white"
        appLang="ku"
        showNumbers={true}
        surahsList={[]}
        onJumpToPage={(p) => setCurrentPage(p)}
      />
    </div>
  );
}
