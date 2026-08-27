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
  2: [
    'الم',
    'ذَٰلِكَ الْكِتَابُ لَا رَيْبَ ۛ فِيهِ ۛ هُدًى لِّلْمُتَّقِينَ',
    'الَّذِينَ يُؤْمِنُونَ بِالْغَيْبِ وَيُقِيمُونَ الصَّلَاةَ',
    'وَمِمَّا رَزَقْنَاهُمْ يُنفِقُونَ',
  ],
};

const getAyahsForPage = (page: number): string[] => {
  if (PAGE_AYAHS[page]) return PAGE_AYAHS[page];
  return Array.from({ length: 7 }, (_, i) => `ئایەتی ${i + 1}`);
};

export const MushafPageView: React.FC<MushafPageViewProps> = ({
  currentPage,
  onNextPage,
  onPrevPage,
  onBackToIndex,
  showNumbers,
}) => {
  const ayahs = getAyahsForPage(currentPage);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showCopied, setShowCopied] = useState(false);

  const handleAyahClick = (text: string, index: number) => {
    setSelectedIndex(index);
    navigator.clipboard.writeText(text);
    setShowCopied(true);
    setTimeout(() => {
      setShowCopied(false);
      setSelectedIndex(null);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#f0ebe3] p-4">
      {/* سەرپەڕە - شیک و جوان */}
      <div className="flex items-center justify-between mb-5 bg-white/90 backdrop-blur-sm p-3.5 rounded-2xl shadow-md border border-[#d4c5b0]/30">
        <button 
          onClick={onBackToIndex} 
          className="text-[#7a6548] text-sm font-bold px-4 py-1.5 hover:bg-[#7a6548]/10 rounded-xl transition-all"
        >
          ← پێڕست
        </button>
        <div className="text-center">
          <span className="text-sm font-bold text-[#7a6548]">لاپەڕە {currentPage}</span>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={onPrevPage} 
            className="px-4 py-1.5 bg-[#7a6548]/15 hover:bg-[#7a6548]/25 rounded-xl text-sm font-bold text-[#7a6548] transition-all"
          >
            ‹
          </button>
          <button 
            onClick={onNextPage} 
            className="px-4 py-1.5 bg-[#7a6548]/15 hover:bg-[#7a6548]/25 rounded-xl text-sm font-bold text-[#7a6548] transition-all"
          >
            ›
          </button>
        </div>
      </div>

      {/* 🎯 ناوەڕۆک - وێنە + تێکست + هایلایتی شینی جوان */}
      <div className="relative bg-white rounded-3xl shadow-xl overflow-hidden border border-[#d4c5b0]/20">
        
        {/* وێنەی موسحەف */}
        <img 
          src="/mushaf-page-1.jpg"
          alt="موسحەفی مەدینە"
          className="w-full h-auto"
          draggable={false}
        />
        
        {/* چینی تێکست - بە هایلایتی شینی جوان */}
        <div className="absolute inset-0 flex flex-col px-8 py-12">
          {/* بسم الله */}
          <div className="text-center mb-3">
            <p className="text-3xl font-serif text-[#1a2a3a]/80 font-bold select-none tracking-wide">
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </p>
          </div>
          
          {/* ئایەتەکان */}
          <div className="flex-1 flex flex-col justify-center space-y-0.5 px-6">
            {ayahs.map((ayah, index) => (
              <div
                key={index}
                onClick={() => handleAyahClick(ayah, index)}
                className={`
                  group flex items-start gap-2.5 cursor-pointer rounded-xl p-1.5 transition-all duration-300
                  ${selectedIndex === index 
                    ? 'bg-blue-300/50 shadow-lg shadow-blue-200/30' 
                    : 'hover:bg-blue-200/20'
                  }
                `}
              >
                {showNumbers && (
                  <span className={`
                    text-sm font-bold min-w-[32px] select-none transition-all duration-300
                    ${selectedIndex === index 
                      ? 'text-blue-700' 
                      : 'text-[#7a6548]/60 group-hover:text-[#7a6548]/80'
                    }
                  `}>
                    {index + 1}.
                  </span>
                )}
                <p className={`
                  text-2xl font-serif leading-loose select-text transition-all duration-300
                  ${selectedIndex === index 
                    ? 'text-[#0a1a2a] font-bold' 
                    : 'text-[#1a2a3a]/85 group-hover:text-[#1a2a3a]'
                  }
                `}>
                  {ayah}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* پەیامی کۆپی - جوان و شیک */}
      {showCopied && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3.5 rounded-2xl shadow-2xl text-sm font-bold z-50 animate-bounce">
          ✅ ئایەت کۆپی کرا!
        </div>
      )}
    </div>
  );
};
