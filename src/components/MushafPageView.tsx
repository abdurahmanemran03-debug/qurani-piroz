import React, { useState, useRef } from 'react';

interface MushafPageViewProps {
  currentPage: number;
  onNextPage: () => void;
  onPrevPage: () => void;
  onBackToIndex: () => void;
  bgStyle: string;
  appLang: string;
  showNumbers: boolean;
  surahsList: any[];
  onJumpToPage: (p: number) => void;
}

export const MushafPageView: React.FC<MushafPageViewProps> = ({
  currentPage,
  onNextPage,
  onPrevPage,
  onBackToIndex,
  onJumpToPage,
}) => {
  const [activeAyah, setActiveAyah] = useState<any>(null);
  const [highlightStyle, setHighlightStyle] = useState({ top: 0, height: 0 });
  const [popupStyle, setPopupStyle] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // داتای ئایەتەکان بۆ لاپەڕەکە (ئەمە نموونەیە، لە شوێنی خۆی داتاکان دێنن)
  const pageAyahs = [
    { id: 1, text: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ' },
    { id: 2, text: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ' },
    { id: 3, text: 'الرَّحْمَٰنِ الرَّحِيمِ' },
    { id: 4, text: 'مَالِكِ يَوْمِ الدِّينِ' },
    { id: 5, text: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ' },
    { id: 6, text: 'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ' },
    { id: 7, text: 'صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ' },
  ];

  const handleAyahClick = (e: React.MouseEvent, ayah: any, index: number) => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const total = pageAyahs.length;
    const padding = 10;
    const ayahHeight = (rect.height - padding * 2) / total;

    const topPos = padding + index * ayahHeight;

    setActiveAyah(ayah);
    setHighlightStyle({
      top: (topPos / rect.height) * 100,
      height: ((ayahHeight - 4) / rect.height) * 100,
    });

    const clickX = e.clientX - rect.left;
    setPopupStyle({
      x: Math.min(Math.max(clickX - 80, 20), rect.width - 180),
      y: topPos - 30,
    });
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('کۆپی کرا! ✅');
    setActiveAyah(null);
  };

  const shareText = (text: string) => {
    if (navigator.share) {
      navigator.share({ text });
    } else {
      copyText(text);
    }
    setActiveAyah(null);
  };

  return (
    <div className="min-h-screen bg-[#f5f0e8] p-4">
      {/* سەرپەڕە */}
      <div className="flex items-center justify-between mb-4 bg-white/80 p-3 rounded-xl shadow-sm">
        <button onClick={onBackToIndex} className="text-amber-700 text-sm font-bold">
          ← پێڕست
        </button>
        <span className="text-sm font-bold text-slate-700">لاپەڕە {currentPage}</span>
        <div className="flex gap-1">
          <button onClick={onPrevPage} className="px-2 py-1 bg-amber-100 rounded">‹</button>
          <button onClick={onNextPage} className="px-2 py-1 bg-amber-100 rounded">›</button>
        </div>
      </div>

      {/* ناوەڕۆک */}
      <div
        ref={containerRef}
        className="relative bg-white rounded-2xl shadow-lg p-5 min-h-[70vh]"
      >
        {/* هایلایت */}
        <div
          className="absolute pointer-events-none transition-all duration-300 bg-amber-200/40 border-r-4 border-amber-500 rounded-r-xl"
          style={{
            top: `${highlightStyle.top}%`,
            height: `${highlightStyle.height}%`,
            width: '96%',
            left: '2%',
            opacity: activeAyah ? 1 : 0,
          }}
        />

        {/* ئایەتەکان */}
        <div className="relative z-10 space-y-2">
          {pageAyahs.map((ayah, index) => (
            <div
              key={ayah.id}
              className="p-3 cursor-pointer hover:bg-amber-50/50 rounded-xl transition-all"
              onClick={(e) => handleAyahClick(e, ayah, index)}
            >
              <p className="text-right text-xl font-serif leading-loose text-slate-800">
                {ayah.text}
              </p>
              {showNumbers && (
                <span className="text-xs text-amber-600 font-bold mr-2">
                  {index + 1}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* پۆپ-ئەپ */}
        {activeAyah && (
          <div
            className="fixed z-50 bg-white shadow-2xl rounded-2xl p-3 flex gap-2 border border-amber-200/80 backdrop-blur-sm"
            style={{
              left: popupStyle.x,
              top: popupStyle.y,
            }}
          >
            <button
              onClick={() => copyText(activeAyah.text)}
              className="px-4 py-2 bg-amber-100 hover:bg-amber-200 rounded-xl text-sm font-bold text-amber-800 transition-all"
            >
              📋 کۆپی
            </button>
            <button
              onClick={() => shareText(activeAyah.text)}
              className="px-4 py-2 bg-blue-100 hover:bg-blue-200 rounded-xl text-sm font-bold text-blue-800 transition-all"
            >
              📤 هاوبەش
            </button>
            <button
              onClick={() => setActiveAyah(null)}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm text-slate-600"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
