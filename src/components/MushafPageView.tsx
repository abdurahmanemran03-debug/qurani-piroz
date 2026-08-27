import React, { useState } from 'react';

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

// داتای ئایەتەکان
const PAGE_AYAHS: Record<number, string[]> = {
  1: [
    'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
    'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ',
    'الرَّحْمَٰنِ الرَّحِيمِ',
    'مَالِكِ يَوْمِ الدِّينِ',
    'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ',
    'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ',
    'صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ',
  ],
  // زیاد بکە بۆ لاپەڕەکانی تر...
};

const getAyahsForPage = (page: number): string[] => {
  if (PAGE_AYAHS[page]) {
    return PAGE_AYAHS[page];
  }
  const count = 5 + (page % 3);
  return Array.from({ length: count }, (_, i) => 
    `ئایەتی ${i + 1} - لاپەڕە ${page}`
  );
};

export const MushafPageView: React.FC<MushafPageViewProps> = ({
  currentPage,
  onNextPage,
  onPrevPage,
  onBackToIndex,
  showNumbers,
}) => {
  const [selectedAyah, setSelectedAyah] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [popupPos, setPopupPos] = useState({ x: 0, y: 0 });

  const ayahs = getAyahsForPage(currentPage);

  const handleAyahClick = (e: React.MouseEvent, ayah: string) => {
    setSelectedAyah(ayah);
    setShowPopup(true);
    setPopupPos({
      x: e.clientX - 100,
      y: e.clientY - 60,
    });
  };

  const copyText = () => {
    if (selectedAyah) {
      navigator.clipboard.writeText(selectedAyah);
      alert('✅ کۆپی کرا!');
      setShowPopup(false);
    }
  };

  const shareText = () => {
    if (selectedAyah) {
      if (navigator.share) {
        navigator.share({ text: selectedAyah });
      } else {
        copyText();
      }
      setShowPopup(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f0e8] p-4">
      {/* سەرپەڕە */}
      <div className="flex items-center justify-between mb-4 bg-white/80 p-3 rounded-xl shadow-sm">
        <button 
          onClick={onBackToIndex} 
          className="text-amber-700 text-sm font-bold px-3 py-1 hover:bg-amber-50 rounded-lg"
        >
          ← فهرهه‌ند
        </button>
        <span className="text-sm font-bold text-slate-700">لاپەڕە {currentPage}</span>
        <div className="flex gap-2">
          <button 
            onClick={onPrevPage} 
            className="px-3 py-1 bg-amber-100 hover:bg-amber-200 rounded-lg text-sm font-bold"
          >
            ‹
          </button>
          <button 
            onClick={onNextPage} 
            className="px-3 py-1 bg-amber-100 hover:bg-amber-200 rounded-lg text-sm font-bold"
          >
            ›
          </button>
        </div>
      </div>

      {/* ناوەڕۆک - شێوازی موسحەفی مەدینە */}
      <div className="bg-white rounded-2xl shadow-lg p-6 min-h-[60vh]">
        {/* بسم الله */}
        <div className="text-center mb-6">
          <p className="text-3xl font-serif text-slate-800 font-bold">
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </p>
        </div>
        
        {ayahs.length === 0 ? (
          <p className="text-center text-slate-400 py-10">هیچ ئایەتێک نییە</p>
        ) : (
          <div className="space-y-3">
            {ayahs.map((ayah, index) => (
              <div
                key={index}
                onClick={(e) => handleAyahClick(e, ayah)}
                className={`group p-3 rounded-xl cursor-pointer transition-all hover:bg-amber-50 ${
                  selectedAyah === ayah ? 'bg-amber-100 border-r-4 border-amber-500' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* ژمارەی ئایەت وەک موسحەفی مەدینە (لەسەر هێڵ) */}
                  {showNumbers && (
                    <span className="flex-shrink-0 text-amber-700 font-bold text-sm mt-1 min-w-[30px]">
                      {index + 1}.
                    </span>
                  )}
                  <p className="flex-1 text-right text-2xl font-serif leading-loose text-slate-800">
                    {ayah}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* پۆپ-ئەپی کۆپی/هاوبەش */}
      {showPopup && selectedAyah && (
        <div
          className="fixed bg-white shadow-2xl rounded-2xl p-3 flex gap-2 z-50 border border-amber-200"
          style={{ left: popupPos.x, top: popupPos.y }}
        >
          <button
            onClick={copyText}
            className="px-4 py-2 bg-amber-100 hover:bg-amber-200 rounded-xl text-sm font-bold text-amber-800 transition-all"
          >
            📋 کۆپی
          </button>
          <button
            onClick={shareText}
            className="px-4 py-2 bg-blue-100 hover:bg-blue-200 rounded-xl text-sm font-bold text-blue-800 transition-all"
          >
            📤 هاوبەش
          </button>
          <button
            onClick={() => setShowPopup(false)}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm text-gray-600"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};
