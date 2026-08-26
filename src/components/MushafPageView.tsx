import React, { useEffect, useState } from 'react';

interface MushafPageViewProps {
  pageNumber: number; // ژمارەی لاپەڕە (لە 1 بۆ 604)
  linesData: { text: string; centered: boolean }[]; // دەقی هێڵەکانی ئەم لاپەڕەیە
  onBack?: () =>جاتەوە بۆ لیستی سورەتەکان
}

export const MushafPageView: React.FC<MushafPageViewProps> = ({ pageNumber, linesData }) => {
  // دروستکردنی ناونیشانی فۆنتەکە بە شێوەیەکی داینامیکی بۆ هەر لاپەڕەیەک
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

      {/* باری سەرەوە بۆ نیشاندانی باری فۆنت */}
      <div className="mb-2 text-xs font-bold">
        {fontStatus === 'loading' && <span className="text-slate-500">بارکردنی فۆنتی لاپەڕەی {pageNumber}...</span>}
        {fontStatus === 'loaded' && <span className="text-green-600">✓ فۆنتی لاپەڕە {pageNumber} بە سەرکەوتوویی بارکرا</span>}
        {fontStatus === 'failed' && <span className="text-red-600">✗ فۆنتی لاپەڕە {pageNumber} نەدۆزرایەوە</span>}
      </div>

      <div className="relative bg-[#fdfcf7] border border-stone-300 rounded-lg shadow-xl w-full max-w-md p-6"
           style={{ aspectRatio: '1260 / 1980' }}>
        
        {/* هێڵەکانی دەقی قورئان بە فۆنتی تایبەتی هەموو لاپەڕەیەک */}
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

        {/* ژمارەی لاپەڕە لە خوارەوە */}
        <div className="absolute bottom-3 inset-x-0 text-center text-xs text-stone-500 font-mono">
          {pageNumber}
        </div>
      </div>
    </div>
  );
};
