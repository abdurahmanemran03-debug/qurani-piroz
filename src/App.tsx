import React, { useState, useEffect } from 'react';

const CANVAS_W = 1260;
const CANVAS_H = 2020;

export default function MushafPreciseTest() {
  const [pageNumber, setPageNumber] = useState<number>(6); // دەستپێکردن بە لاپەڕەی ٦ وەک لە وێنەکەدا دیارە
  const [ayahs, setAyahs] = useState<any[]>([]);
  const [allBoxesMap, setAllBoxesMap] = useState<any>(null);
  const [selected, setSelected] = useState<{ s: number; a: number; top: number } | null>(null);
  const [status, setStatus] = useState<string>('loading...');

  // خوێندنەوەی فایلی ayahdata.json لە ڕێڕەوی ڕاستی خۆی
  useEffect(() => {
    fetch('/ayahdata/ayahdata.json')
      .then(r => r.json())
      .then(data => {
        setAllBoxesMap(data);
      })
      .catch(err => {
        console.error('Error loading ayahdata.json:', err);
      });
  }, []);

  // هێنانی داتای لاپەڕە لە APIـی قورئان
  useEffect(() => {
    setSelected(null);
    setStatus('loading api...');
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

  // وەرگرتنی بۆکسەکان بە پێی ژمارەی لاپەڕە
  const getBoxesForCurrentPage = () => {
    if (!allBoxesMap) return [];
    
    // ئەگەر فایلەکە ئۆبۆکت بێت و لاپەڕەکان بە کلیلی (page_X یان ژمارە) تێیدا بن
    if (allBoxesMap[pageNumber]) return allBoxesMap[pageNumber];
    if (allBoxesMap[String(pageNumber)]) return allBoxesMap[String(pageNumber)];
    
    // ئەگەر فایلەکە ئارای (Array) بێت و فیلتەر بکرێت
    if (Array.isArray(allBoxesMap)) {
      return allBoxesMap.filter((b: any) => b.page === pageNumber || b.p === pageNumber || b.pageNumber === pageNumber);
    }
    
    return [];
  };

  const currentBoxes = getBoxesForCurrentPage();
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
          <span>boxes: {currentBoxes.length}</span>
          <span>ayahs: {ayahs.length}</span>
          <span className="truncate max-w-[150px]">{status}</span>
        </div>

        {/* وێنەی لاپەڕەی قورئان */}
        <img
          src={`https://android.quran.com/data/width_1260/page${padPageNum(pageNumber)}.png`}
          alt={`page ${pageNumber}`}
          className="w-full h-full object-contain shadow-xl rounded-lg bg-white border border-stone-300 mt-6"
          style={{ filter: 'grayscale(100%) contrast(115%) brightness(102%)', mixBlendMode: 'multiply' }}
        />

        {/* بۆکسەکان و هایلایت */}
        <div className="absolute inset-0 mt-6">
          {currentBoxes.map((box: any, i: number) => {
            const sVal = box.s || box.surah;
            const aVal = box.a || box.ayah;
            const x0Val = box.x0;
            const x1Val = box.x1;
            const y0Val = box.y0;
            const y1Val = box.y1;

            return (
              <div
                key={i}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelected({ s: sVal, a: aVal, top: (y0Val / CANVAS_H) * 100 });
                }}
                style={{
                  position: 'absolute',
                  left: `${(x0Val / CANVAS_W) * 100}%`,
                  top: `${(y0Val / CANVAS_H) * 100}%`,
                  width: `${((x1Val - x0Val) / CANVAS_W) * 100}%`,
                  height: `${((y1Val - y0Val) / CANVAS_H) * 100}%`,
                  background: selected?.s === sVal && selected?.a === aVal ? 'rgba(56,189,248,0.35)' : 'transparent',
                }}
                className="cursor-pointer hover:bg-sky-400/20 transition-colors"
              />
            );
          })}
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
