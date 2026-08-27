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

// داتای ئایەتەکان بە شێوازی موسحەفی مەدینە
const PAGE_AYAHS: Record<number, Array<{ text: string; number: number }>> = {
  1: [
    { text: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', number: 1 },
    { text: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ', number: 2 },
    { text: 'الرَّحْمَٰنِ الرَّحِيمِ', number: 3 },
    { text: 'مَالِكِ يَوْمِ الدِّينِ', number: 4 },
    { text: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ', number: 5 },
    { text: 'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ', number: 6 },
    { text: 'صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ', number: 7 },
  ],
  2: [
    { text: 'الم', number: 1 },
    { text: 'ذَٰلِكَ الْكِتَابُ لَا رَيْبَ ۛ فِيهِ ۛ هُدًى لِّلْمُتَّقِينَ', number: 2 },
    { text: 'الَّذِينَ يُؤْمِنُونَ بِالْغَيْبِ وَيُقِيمُونَ الصَّلَاةَ', number: 3 },
    { text: 'وَمِمَّا رَزَقْنَاهُمْ يُنفِقُونَ', number: 4 },
    { text: 'وَالَّذِينَ يُؤْمِنُونَ بِمَا أُنزِلَ إِلَيْكَ', number: 5 },
  ],
  // زیاد بکە بۆ هەموو لاپەڕەکان...
};

// فانکشن بۆ وەرگرتنی ئایەتەکان
const getAyahsForPage = (page: number): Array<{ text: string; number: number }> => {
  if (PAGE_AYAHS[page]) {
    return PAGE_AYAHS[page];
  }
  
  // ئەگەر داتا نەبوو، ئایەتی گشتی دروست بکە
  const count = 5 + (page % 3);
  return Array.from({ length: count }, (_, i) => ({
    text: `ئایەتی ${i + 1} - لاپەڕە ${page}`,
    number: i + 1,
  }));
};

export const MushafPageView: React.FC<MushafPageViewProps> = ({
  currentPage,
  onNextPage,
  onPrevPage,
  onBackToIndex,
  showNumbers,
}) => {
  const [selectedAyah, setSelectedAyah] = useState<{ text: string; number: number } | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [popupPos, setPopupPos] = useState({ x: 0, y: 0 });

  const ayahs = getAyahsForPage(currentPage);

  const handleAyahClick = (e: React.MouseEvent, ayah: { text: string; number: number }) => {
    setSelectedAyah(ayah);
    setShowPopup(true);
    setPopupPos({
      x: e.clientX - 100,
      y: e.clientY - 60,
    });
  };

  const copyText = () => {
    if (selectedAyah) {
      navigator.clipboard.writeText(selectedAyah.text);
      alert('✅ کۆپی کرا!');
      setShowPopup(false);
    }
  };

  const shareText = () => {
    if (selectedAyah) {
      if (navigator.share) {
        navigator.share({ text: selectedAyah.text });
      } else {
        copyText();
      }
      setShowPopup(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f0e8] p-4">
      {/* سەرپەڕە - بە شێوازی موسحەف */}
      <div className="flex items-center justify-between mb-4 bg-[#8B7355]/10 p-3 rounded-xl shadow-sm border border-[#8B7355]/20">
        <button 
          onClick={onBackToIndex} 
          className="text-[#8B7355] text-sm font-bold px-3 py-1 hover:bg-[#8B7355]/10 rounded-lg"
        >
          ← فهرهه‌ند
        </button>
        <div className="text-center">
          <span className="text-sm font-bold text-[#8B7355]">لاپەڕە {currentPage}</span>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={onPrevPage} 
            className="px-3 py-1 bg-[#8B7355]/20 hover:bg-[#8B7355]/30 rounded-lg text-sm font-bold text-[#8B7355]"
          >
            ‹
          </button>
          <button 
            onClick={onNextPage} 
            className="px-3 py-1 bg-[#8B7355]/20 hover:bg-[#8B7355]/30 rounded-lg text-sm font-bold text-[#8B7355]"
          >
            ›
          </button>
        </div>
      </div>

      {/* ناوەڕۆک - ئایەتەکان بە شێوازی موسحەفی مەدینە */}
      <div className="bg-[#fcf8f0] rounded-2xl shadow-lg p-6 min-h-[60vh] border border-[#8B7355]/10">
        {/* ناوی سوورەت */}
        <div className="text-center mb-6 border-b-2 border-[#8B7355]/20 pb-4">
          <h3 className="text-2xl font-bold text-[#5C4033]">سوورەتی الفاتحة</h3>
          <p className="text-sm text-[#8B7355]">بەرەی 1، جوزئی 1</p>
        </div>
        
        {/* بسم الله */}
        <div className="text-center mb-6">
          <p className="text-3xl font-serif text-[#5C4033] font-bold">
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
                className={`group p-3 rounded-xl cursor-pointer transition-all hover:bg-[#8B7355]/10 ${
                  selectedAyah?.number === ayah.number ? 'bg-[#8B7355]/20 border-r-4 border-[#8B7355]' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* ژمارەی ئایەت بە شێوازی موسحەف (لە ناو دەوری ٢٥دا) */}
                  <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-[#8B7355] text-white rounded-full text-xs font-bold">
                    {ayah.number}
                  </span>
                  <p className="flex-1 text-right text-2xl font-serif leading-loose text-[#2C1810]">
                    {ayah.text}
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
          className="fixed bg-white shadow-2xl rounded-2xl p-3 flex gap-2 z-50 border border-[#8B7355]/30"
          style={{ left: popupPos.x, top: popupPos.y }}
        >
          <button
            onClick={copyText}
            className="px-4 py-2 bg-[#8B7355]/20 hover:bg-[#8B7355]/30 rounded-xl text-sm font-bold text-[#5C4033] transition-all"
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
