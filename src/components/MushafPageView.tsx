import React, { useEffect, useState } from 'react';

interface MushafPageViewProps {
  pageNumber: number;
  linesData: { text: string; centered: boolean }[];
  onBack?: () => void;
}

export const MushafPageView: React.FC<MushafPageViewProps> = ({ pageNumber, linesData, onBack }) => {
  const fontName = `qcf-p${pageNumber}`;
  const fontUrl = `/qurani-piroz/fonts/p${pageNumber}.ttf`;
  
  const [fontStatus, setFontStatus] = useState<'loading' | 'loaded' | 'failed'>('loading');

  useEffect(() => {
    setFontStatus('loading');
    const font = new FontFace(fontName, `url('${fontUrl}')`);
    font.load()
      .then((loadedFont) => {
        document.fonts.add(loadedFont);
        setFontStatus('loaded');
      })
      .catch((err) => {
        console.error(`Font load error for page ${pageNumber}:`, err);
        setFontStatus('failed');
      });
  }, [pageNumber, fontUrl, fontName]);

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col items-center justify-center p-4" dir="rtl">
      <style>{`
        @font-face {
          font-family: '${fontName}';
          src: url('${fontUrl}') format('truetype');
          font-display: swap;
        }
        .qcf-page-line {
          font-family: '${fontName}', serif;
        }
      `}</style>

      <div className="mb-2 text-xs font-bold flex items-center justify-between w-full max-w-md px-2">
        {onBack && (
          <button 
            onClick={onBack}
            className="bg-stone-800 text-white px-3 py-1 rounded text-xs hover:bg-stone-700 transition-colors"
          >
            گەڕانەوە
          </button>
        )}
        <div>
          {fontStatus === 'loading' && <span className="text-slate-500">بارکردنی فۆنت...</span>}
          {fontStatus === 'loaded' && <span className="text-green-600">✓ فۆنت بارکرا</span>}
          {fontStatus === 'failed' && <span className="text-red-600">✗ فۆنت نەدۆزرایەوە</span>}
        </div>
      </div>

      <div className="relative bg-[#fdfcf7] border border-stone-300 rounded-lg shadow-xl w-full max-w-md p-6"
           style={{ aspectRatio: '1260 / 1980' }}>
        
        <div className="flex flex-col items-center gap-3 px-2 mt-6">
          {linesData.map((line, i) => (
            <p
              key={i}
              className="qcf-page-line text-stone-900 select-text"
              style={{ fontSize: '36px', lineHeight: '2.1', textAlign: line.centered ? 'center' : 'right', width: '100%' }}
            >
              {line.text}
            </p>
          ))}
        </div>

        <div className="absolute bottom-3 inset-x-0 text-center text-xs text-stone-500 font-mono">
          {pageNumber}
        </div>
      </div>
    </div>
  );
};
