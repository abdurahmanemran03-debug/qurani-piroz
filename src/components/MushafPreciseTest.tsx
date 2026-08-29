import React, { useState, useEffect } from 'react';

// کوردینەیتی وردی هەموو ئایەتەکانی لاپەڕەی ١ (لە ayahinfo_1260.db)
const PAGE_1_BOXES = [
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
];

const CANVAS_W = 1260;
const CANVAS_H = 2020;

export const MushafPreciseTest: React.FC = () => {
  const [ayahs, setAyahs] = useState<any[]>([]);
  const [selected, setSelected] = useState<{ s: number; a: number; top: number } | null>(null);

  useEffect(() => {
    fetch('https://api.alquran.cloud/v1/page/1/editions/quran-uthmani,ku.asan')
      .then(r => r.json())
      .then(data => {
        if (data.code === 200) {
          const ar = data.data[0].ayahs;
          const ku = data.data[1].ayahs;
          setAyahs(ar.map((x: any, i: number) => ({
            surah: x.surah.number,
            ayah: x.numberInSurah,
            arabic: x.text,
            tafsir: ku[i]?.text || ''
          })));
        }
      });
  }, []);

  return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4" dir="rtl">
      <div className="relative w-full max-w-md" style={{ aspectRatio: `${CANVAS_W} / ${CANVAS_H}` }}>
        <img
          src="https://android.quran.com/data/width_1260/page001.png"
          alt="page1"
          className="w-full h-full object-contain shadow-xl rounded-lg bg-white border border-stone-300"
          style={{ filter: 'grayscale(100%) contrast(115%) brightness(102%)', mixBlendMode: 'multiply' }}
        />

        <div className="absolute inset-0">
          {PAGE_1_BOXES.map((box, i) => (
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
              className="cursor-pointer"
            />
          ))}
        </div>

        {selected && (
          <div
            className="absolute inset-x-2 bg-white border border-slate-300 rounded-xl shadow-xl p-3 z-10"
            style={{ top: `${Math.min(selected.top + 5, 85)}%` }}
          >
            <p className="text-[10px] text-slate-400 font-bold mb-1">{selected.s}:{selected.a}</p>
            <p className="text-sm leading-relaxed">
              {ayahs.find(x => x.surah === selected.s && x.ayah === selected.a)?.tafsir}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
