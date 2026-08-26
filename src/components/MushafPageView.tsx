import { getAyahBoxesForPage } from '../data/ayahCoordinates';

// ... لە ناو کامپۆنێنتەکەدا، ئەم فنکشنە جێگیر بکە بدلێ handleWrapperClick کۆن:

const handleAyahClick = (e: React.MouseEvent<HTMLDivElement>, ayah: any, index: number) => {
  e.stopPropagation();
  const containerRect = e.currentTarget.getBoundingClientRect();
  const clickX = e.clientX - containerRect.left;
  const clickY = e.clientY - containerRect.top;

  setActiveAyah(ayah);

  // دیاریکردنی قەبارە و شوێنی بۆکسی هایلایت بە پێی قەبارەی ڕاستەقینەی وێنەکە
  const boxHeight = containerRect.height / pageAyahsData.length;
  const calculatedTop = index * boxHeight;

  setHighlightBox({
    top: calculatedTop,
    height: Math.max(boxHeight, 35)
  });

  setPopupPos({
    x: Math.min(Math.max(clickX, 90), containerRect.width - 90),
    y: Math.max(calculatedTop - 20, 50)
  });
};
