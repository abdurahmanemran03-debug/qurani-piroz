{isActivePage && currentBoxes.length > 0 && (
  <div className="absolute inset-0">
    {currentBoxes.map((box, idx) => {
      // لێرەدا دەگونجێت لەگەڵ x, y, w, h کە لە فایلی ayahCoordinates هەیە
      const { surah: s, ayah: a, x, y, w, h } = box;
      const matched = pageAyahsData.find(item => item.surahNumber === s && item.numberInSurah === a);
      const isSelected = selectedAyah?.s === s && selectedAyah?.a === a;

      return (
        <div
          key={idx}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedAyah({
              s: s,
              a: a,
              top: (y / AYAH_CANVAS_HEIGHT) * 100,
              arabic: matched?.arabic || '',
              tafsir: matched?.tafsir || 'تەفسیر بەردەست نییە...'
            });
          }}
          style={{
            position: 'absolute',
            left: `${(x / AYAH_CANVAS_WIDTH) * 100}%`,
            top: `${(y / AYAH_CANVAS_HEIGHT) * 100}%`,
            width: `${(w / AYAH_CANVAS_WIDTH) * 100}%`,
            height: `${(h / AYAH_CANVAS_HEIGHT) * 100}%`,
            background: isSelected ? 'rgba(56,189,248,0.35)' : 'transparent',
          }}
          className="cursor-pointer"
        />
      );
    })}
  </div>
)}
