import React, { useState, useEffect } from 'react';

const CANVAS_W = 1260;
const CANVAS_H = 2020;

// لێرەدا دەتوانین داتای بۆکسەکان بۆ لاپەڕەکانی تریش فراوان بکەین
// بۆ نموونە نموونەی لاپەڕەی ١:
const PAGE_BOXES_MAP: Record<number, Array<{ s: number; a: number; l: number; x0: number; x1: number; y0: number; y1: number }>> = {
  1: [
    { s: 1, a: 1, l: 2, x0: 410, x1: 854, y0: 254, y1: 333 },
    { s: 1, a: 2, l: 3, x0: 318, x1: 945, y0: 365, y1: 442 },
    { s: 1, a: 3, l: 4, x0: 648, x1: 1009, y0: 474, y1: 552 },
    { s: 1, a: 4, l: 4, x0: 254, x1: 649, y0: 474, y1: 548 },
    { s: 1, a: 5, l: 5, x0: 387, x1: 999, y0: 579, y1: 658 },
    { s: 1, a: 6, l: 5, x0: 268, x1: 388, y0: 582, y1: 656 },
    { s: 1, a: 6, l: 6, x0: 598, x1: 1004, y0: 684, y1: 786 },
    { s: 1, a: 7, l: 6, x0: 267, x1: 599, y0: 680, y1: 767 },
    { s: 1, a: 7, l: 7, x0: 363, x1: 899, y0: 797, y1: 889 },
    { s: 1, a: 7, l: 8, x0: 472, x1: 788, y0: 907, y1: 985 },
  ],
  // دەتوانیت بۆ لاپەڕەکانی تریش لێرەدا بۆکسەکان زیاد بکەیت
};

export default function MushafPreciseTest() {
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [ayahs, setAyahs] = useState<any[]>([]);
  const [selected, setSelected] = useState<{ s: number; a: number; top: number } | null>(null);
  const [status, setStatus] = useState<string>('loading...');

  // هێنانی داتای لاپەڕە لە API
  useEffect(() => {
    setSelected(null);
    setStatus('loading...');
    Promise.all([
      fetch(`https://api.alquran.cloud/v1/page/${pageNumber}/quran-uthmani`).then(r => r.json()),
      fetch(`https://api.alquran.cloud/v1/page/${pageNumber}/ku.asan`).then(r => r.json())
    ])
      .then(([arData, kuData]) => {
        if (arData.code === 200 && kuData.code === 200) {
          const ar = arData.data.ayahs;
          const ku = kuData.data.ayahs;
          
          const combined = ar.map((x: any, i: number) => ({
            surah: x.surah.number,
            ayah: x.numberInSurah,
            arabic: x.text,
            tafsir: ku[i]?.text || ''
          }));

          setAyahs(combined);
          setStatus(`success (ayahs: ${combined.length})`);
        } else {
          setStatus('err: API Data Error');
        }
      })
      .catch(err => {
        setStatus(`err: ${err.message || 'Network Error'}`);
      });
  }, [pageNumber]);

  const currentBoxes = PAGE_BOXES_BOXES => PAGE_BOXES_MAP[pageNumber] || [];
  const padPageNum = (num: number) => String(num).padStart(3, '0');

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col items-center justify-center p-4" dir="rtl">
      
      {/* کۆنترۆڵی گۆڕینی لاپەڕەکان */}
      <div className="w-full max-w-md flex justify-between items-center mb-2 bg-white p-2 rounded-lg shadow-sm border border-stone-300">
        <button 
          onClick={() => setPageNumber(p => Math.min(p + 1, 604))}
          className="bg-stone-800 text-white px-3 py-1 rounded text-xs font-bold hover:bg-stone-700"
        >
          ← لاپەڕەی پێشوو
        </button>
        <span className="text-xs font-bold text-stone-700">لاپەڕەی {pageNumber} لە ٦٠٤</span>
        <button 
          onClick={() => setPageNumber(p => Math.max(p - 1, 1))}
          className="bg-stone-800 text-white px-3 py-1 rounded text-xs font-bold hover:bg-stone-700"
        >
          لاپەڕەی دواتر →
        </button>
      </div>

      <div className="relative w-full max-w-md" style={{ aspectRatio: `${CANVAS_W} / ${CANVAS_H}` }}>
        
        {/* باری زانیاری تاقیکاری */}
        <div className="absolute top-0 inset-x-0 bg-black/75 text-white text-[11px] py-1 px-2 text-center z-20 rounded-t-lg flex justify-around">
          <span>boxes: {PAGE_BOXES_MAP[pageNumber]?.length || 0}</span>
          <span>ayahs: {ayahs.length}</span>
          <span className="truncate max-w-[150px]">{status}</span>
        </div>

        {/* وێنەی لاپەڕەی قورئان بە پێی ژمارەی لاپەڕە */}
        <img
          src={`https://android.quran.com/data/width_1260/page${padPageNum(pageNumber)}.png`}
          alt={`page ${pageNumber}`}
          className="w-full h-full object-contain shadow-xl rounded-lg bg-white border border-stone-300 mt-6"
          style={{ filter: 'grayscale(100%) contrast(115%) brightness(102%)', mixBlendMode: 'multiply' }}
        />

        {/* بۆکسەکان و هایلایت */}
        <div className="absolute inset-0 mt-6">
          {(PAGE_BOXES_MAP[pageNumber] || []).map((box, i) => (
            <div
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                setSelected({ s: box.s, a: box.a, top: (box.y0 / CANVAS_H) * 100 });
              }}
              style={{
                position: 'absolute',
                left: `${(box.x0 / CANVAS_W) * 100}%`,
                top: `${(box.y0 / CANVAS_H) * 100}%`,
                width: `${((box.x1 - box.x0) / CANVAS_W) * 100}%`,
                height: `${((box.y1 - box.y0) / CANVAS_H) * 100}%`,
                background: selected?.s === box.s && selected?.a === box.a ? 'rgba(56,189,248,0.35)' : 'transparent',
              }}
              className="cursor-pointer hover:bg-sky-400/20 transition-colors"
            />
          ))}
        </div>

        {/* پەنجەرەی پیشاندانی تەفسیر / وەرگێڕان */}
        {selected && (
          <div
            className="absolute inset-x-2 bg-white border border-slate-300 rounded-xl shadow-xl p-3 z-30"
            style={{ top: `${Math.min(selected.top + 5, 85)}%` }}
          >
            <div className="flex justify-between items-center mb-1">
              <p className="text-[10px] text-slate-400 font-bold">سووڕەتی {selected.s} : ئایەتی {selected.a}</p>
              <button onClick={() => setSelected(null)} className="text-xs text-red-500 font-bold px-1">✕</button>
            </div>
            <p className="text-sm leading-relaxed text-slate-800">
              {ayahs.find(x => x.surah === selected.s && x.ayah === selected.a)?.tafsir || 'وەرگێڕان بەردەست نییە بۆ ئەم بۆکسە'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
