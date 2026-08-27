import React, { useState, useEffect } from 'react';

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

// داتای هەموو لاپەڕەکان (نموونەیی - دەتوانیت لە APIـی خۆت بۆ بگۆڕیت)
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
  2: [
    'الم',
    'ذَٰلِكَ الْكِتَابُ لَا رَيْبَ ۛ فِيهِ ۛ هُدًى لِّلْمُتَّقِينَ',
    'الَّذِينَ يُؤْمِنُونَ بِالْغَيْبِ وَيُقِيمُونَ الصَّلَاةَ',
    'وَمِمَّا رَزَقْنَاهُمْ يُنفِقُونَ',
    'وَالَّذِينَ يُؤْمِنُونَ بِمَا أُنزِلَ إِلَيْكَ',
  ],
  3: [
    'إِنَّ الَّذِينَ كَفَرُوا سَوَاءٌ عَلَيْهِمْ أَأَنذَرْتَهُمْ أَمْ لَمْ تُنذِرْهُمْ لَا يُؤْمِنُونَ',
    'خَتَمَ اللَّهُ عَلَىٰ قُلُوبِهِمْ وَعَلَىٰ سَمْعِهِمْ',
    'وَلَهُمْ عَذَابٌ عَظِيمٌ',
  ],
  // زیاد بکە بۆ هەموو لاپەڕەکان
};

// فانکشن بۆ وەرگرتنی ئایەتەکانی لاپەڕە
const getAyahsForPage = (page: number): string[] => {
  // ئەگەر لاپەڕەکە لە داتاکاندا بوو، بیگەڕێنەوە
  if (PAGE_AYAHS[page]) {
    return PAGE_AYAHS[page];
  }
  
  // ئەگەر نەبوو، ئایەتی گشتی دروست بکە بە پێی ژمارەی لاپەڕە
  const count = 5 + (page % 3); // ژمارەی ئایەتەکان دەگۆڕێت
  const surahName = page < 10 ? 'الفاتحة' : 'البقرة';
  
  return Array.from({ length: count }, (_, i) => 
    `ئایەتی ${i + 1} - لاپەڕە ${page} (سوورەت ${surahName})`
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
          ← پێڕست
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

      {/* ناوەڕۆک - ئایەتەکان */}
      <div className="bg-white rounded-2xl shadow-lg p-6 min-h-[60vh]">
        <div className="text-center text-sm text-amber-600 mb-4 border-b border-amber-100 pb-3">
          <span className="font-bold">📖 ژمارەی ئایەتەکان: {ayahs.length}</span>
        </div>
        
        {ayahs.length === 0 ? (
          <p className="text-center text-slate-400 py-10">هیچ ئایەتێک نییە</p>
        ) : (
          <div className="space-y-2">
            {ayahs.map((ayah, index) => (
              <div
                key={index}
                onClick={(e) => handleAyahClick(e, ayah)}
                className={`p-4 rounded-xl cursor-pointer transition-all hover:bg-amber-50 ${
                  selectedAyah === ayah ? 'bg-amber-100 border-r-4 border-amber-500' : ''
                }`}
              >
                <p className="text-right text-xl font-serif leading-loose text-slate-800">
                  {ayah}
                </p>
                {showNumbers && (
                  <span className="text-xs text-amber-600 mr-2">({index + 1})</span>
                )}
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
