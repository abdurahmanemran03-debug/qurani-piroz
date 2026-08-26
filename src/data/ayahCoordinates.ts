// داتای شوێنی ئایەتەکان بۆ لاپەڕەکان (بە شێوازی ڕێژەیی / Percentage بۆ ئەوەی لەسەر هەموو شاشەیەک ڕێک بێت)
export interface AyahBox {
  ayahNumber: number; // ژمارەی گشتی ئایەت
  top: number;     // ڕێژەی دووری لە سەرەوە (%)
  height: number;  // بەرزی (%)
}

// لێرەدا دەتوانین داتای پێویست بۆ لاپەڕەکان دابنێین
export const PAGE_AYAH_BOXES: Record<number, AyahBox[]> = {
  // بۆ نموونە بۆ لاپەڕەی ١ (سورەتی فاتیحە) داتای نموونەیی بۆ ٧ ئایەتەکە:
  1: [
    { ayahNumber: 1, top: 22, height: 12 }, // بسملة
    { ayahNumber: 2, top: 38, height: 12 }, // الحمد لله
    { ayahNumber: 3, top: 52, height: 10 }, // الرحمن الرحيم
    { ayahNumber: 4, top: 64, height: 10 }, // مالك يوم الدين
    { ayahNumber: 5, top: 75, height: 10 }, // إياك نعبد
    { ayahNumber: 6, top: 86, height: 10 }, // اهدنا الصراط
    { ayahNumber: 7, top: 96, height: 12 }, // صراط الذين
  ]
  // بۆ لاپەڕەکانی تر، ئەگەر داتات نەبوو، کۆدەکە خۆکار دابەشکردنێکی یەکسان بەکاردێنێت
};

export function getAyahBoxesForPage(page: number, totalAyahs: number): AyahBox[] {
  if (PAGE_AYAH_BOXES[page]) {
    return PAGE_AYAH_BOXES[page];
  }
  // ئەگەر لاپەڕەکە داتای تایبەتی نەبوو، بە شێوازێکی یەکسان دابەشی دەکات بەسەر بەرزی وێنەکەدا
  const boxHeight = 100 / Math.max(totalAyahs, 1);
  return Array.from({ length: totalAyahs }, (_, i) => ({
    ayahNumber: i + 1,
    top: i * boxHeight,
    height: boxHeight
  }));
}

