import React, { useEffect, useState } from 'react';

interface MushafPageViewProps {
  pageNumber: number;
  linesData: { text: string; centered: boolean }[];
  onBack?: () => void;
}

export const MushafPageView: React.FC<MushafPageViewProps> = ({ pageNumber, linesData, onBack }) => {
  const fontUrl = `${import.meta.env.BASE_URL}fonts/p${pageNumber}.ttf`;
  const [fontStatus, setFontStatus] = useState<'loading' | 'loaded' | 'failed'>('loading');

  useEffect(() => {
    const font = new FontFace('qcf-p1', `url('${fontUrl}')`);
    font.load()
      .then(() => setFontStatus('loaded'))
      .catch(() => setFontStatus('failed'));
  }, [fontUrl]);

  return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4" dir="rtl">
      <style>{`
        @font-face {
          font-family: 'qcf-p1';
          src: url('${fontUrl}') format('truetype');
          font-display: swap;
        }
        .qcf-line {
          font-family: 'qcf-p1', serif;
        }
      `}</style>

      <div className="relative bg-[#fdfcf7] border border-stone-300 rounded-lg shadow-xl w-full max-w-md p-6"
           style={{ aspectRatio: '1260 / 1980' }}>
        
        {onBack && (
          <button 
            onClick={onBack}
            className="mb-4 bg-stone-800 text-white px-3 py-1 rounded text-xs"
          >
            گەڕانەوە
          </button>
        )}

        <div className="border-2 border-stone-800 rounded px-4 py-2 text-center mb-6 mt-4">
          <span className="text-lg font-bold text-stone-900" style={{ fontFamily: 'serif' }}>
            سُورَةُ الْفَاتِحَةِ
          </span>
        </div>

        <div className="flex flex-col items-center gap-4 px-2 mt-8">
          {linesData.map((line, i) => (
            <p
              key={i}
              className="qcf-line text-stone-900 select-text"
              style={{ fontSize: '38px', lineHeight: '2.2', textAlign: line.centered ? 'center' : 'right', width: '100%' }}
            >
              {line.text}
            </p>
          ))}
        </div>

        <div className="absolute bottom-3 inset-x-0 text-center text-xs text-stone-500 font-mono">{pageNumber}</div>

        <div className={`absolute top-1 inset-x-0 text-center text-[10px] font-bold ${
          fontStatus === 'loaded' ? 'text-green-600' : fontStatus === 'failed' ? 'text-red-600' : 'text-slate-400'
        }`}>
          {fontStatus === 'loading' && 'فۆنت باردەکرێت...'}
          {fontStatus === 'loaded' && '✓ فۆنت بە سەرکەوتوویی بارکرا'}
          {fontStatus === 'failed' && `✗ فۆنت نەدۆزرایەوە لە: ${fontUrl}`}
        </div>
      </div>
    </div>
  );
};
