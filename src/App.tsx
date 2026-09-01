import React, { useState, useEffect } from 'react';

interface AyahCoord {
  s: number;
  a: number;
  l: number;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export default function App() {
  const [data, setData] = useState<AyahCoord[]>([]);
  const [selectedAyah, setSelectedAyah] = useState<string | null>(null);

  useEffect(() => {
    // ڕێڕەوی ڕاستەقینەی فایلەکە لە ناو بۆخچەی public
    fetch('/ayahdata/ayahdata.json')
      .then((res) => {
        if (!res.ok) {
          throw new Error('فایلی داتاکە نەدۆزرایەوە!');
        }
        return res.json();
      })
      .then((jsonData) => setData(jsonData))
      .catch((err) => console.error('کێشە لە خوێندنەوەی داتا:', err));
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '600px', margin: '0 auto' }}>
      <h1>پڕۆژەی قورئان - هایلايتکردنی ئایەت</h1>
      
      <div style={{ position: 'relative', border: '1px solid #ccc' }}>
        <img 
          src="/path-to-quran-page.png" 
          alt="Quran Page" 
          style={{ width: '100%', display: 'block' }} 
        />

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
    </div>
  );
}
