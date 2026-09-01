import React, { useState, useEffect } from 'react';
import ayahData from './ayahdata.json'; // هێنانی فایلی داتاکە

interface AyahCoord {
  s: number; // ژمارەی سورەت
  a: number; // ژمارەی ئایەت
  l: number; // هێڵ / پەڕە
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export default function App() {
  const [data, setData] = useState<AyahCoord[]>([]);
  const [selectedAyah, setSelectedAyah] = useState<string | null>(null);

  useEffect(() => {
    // لێرەدا دەتوانیت داتاکە بخەیتە ناو ستەیتەوە یان راستەوخۆ بەکاری بهێنیت
    setData(ayahData as AyahCoord[]);
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '600px', margin: '0 auto' }}>
      <h1>پڕۆژەی قورئان - هایلايتکردنی ئایەت</h1>
      
      {/* نموونەی وێنەی قورئان یان ڕوونما */}
      <div style={{ position: 'relative', border: '1px solid #ccc' }}>
        <img 
          src="/path-to-quran-page.png" 
          alt="Quran Page" 
          style={{ width: '100%', display: 'block' }} 
        />

        {/* گەڕان بەدوای مختصاتەکان و دروستکردنی بۆکس بۆ هایلايتکردن */}
        {data.map((item, index) => {
          const isSelected = selectedAyah === `${item.s}-${item.a}`;

          return (
            <div
              key={index}
              onClick={() => setSelectedAyah(`${item.s}-${item.a}`)}
              style={{
                position: 'absolute',
                left: `${item.x0}%`,
                top: `${item.y0}%`,
                width: `${item.x1 - item.x0}%`,
                height: `${item.y1 - item.y0}%`,
                backgroundColor: isSelected ? 'rgba(0, 123, 255, 0.4)' : 'transparent',
                border: isSelected ? '1px solid #007bff' : 'none',
                cursor: 'pointer',
              }}
              title={`سورەت: ${item.s}, ئایەت: ${item.a}`}
            />
          );
        })}
      </div>

      {selectedAyah && (
        <div style={{ marginTop: '10px', padding: '10px', background: '#e7f3ff' }}>
          هەڵبژێردراو - سورەت و ئایەت: {selectedAyah}
        </div>
      )}
    </div>
  );
}
