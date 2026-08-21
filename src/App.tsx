import React, { useState } from 'react';
import { Search, ChevronRight, ChevronLeft, ArrowRight, Loader2 } from 'lucide-react';

const SURAHS_INDEX = [
  { number: 1, nameAr: "الفاتحة", nameKu: "فاتحة", type: "مەککەیی", ayahs: 7, startPage: 1 },
  { number: 2, nameAr: "البقرة", nameKu: "بەقەڕە", type: "مەدینەیی", ayahs: 286, startPage: 2 },
  { number: 3, nameAr: "آل عمران", nameKu: "ئالی عیمران", type: "مەدینەیی", ayahs: 200, startPage: 50 },
  { number: 4, nameAr: "النساء", nameKu: "نیساء", type: "مەدینەیی", ayahs: 176, startPage: 77 },
  { number: 5, nameAr: "المائدة", nameKu: "مائیدە", type: "مەدینەیی", ayahs: 120, startPage: 106 },
  { number: 6, nameAr: "الأنعام", nameKu: "ئەنعام", type: "مەککەیی", ayahs: 165, startPage: 128 },
  { number: 7, nameAr: "الأعراف", nameKu: "ئەعراف", type: "مەککەیی", ayahs: 206, startPage: 151 },
  { number: 8, nameAr: "الأنفال", nameKu: "ئەنفال", type: "مەدینەیی", ayahs: 75, startPage: 177 },
  { number: 9, nameAr: "التوبة", nameKu: "تەوبە", type: "مەدینەیی", ayahs: 129, startPage: 187 },
  { number: 10, nameAr: "يونس", nameKu: "یوونس", type: "مەککەیی", ayahs: 109, startPage: 208 },
  { number: 11, nameAr: "هود", nameKu: "هوود", type: "مەککەیی", ayahs: 123, startPage: 221 },
  { number: 12, nameAr: "يوسف", nameKu: "یووسف", type: "مەککەیی", ayahs: 111, startPage: 235 },
  { number: 13, nameAr: "الرعد", nameKu: "ڕەعد", type: "مەدینەیی", ayahs: 43, startPage: 249 },
  { number: 14, nameAr: "إبراهيم", nameKu: "ئیبراهیم", type: "مەککەیی", ayahs: 52, startPage: 255 },
  { number: 15, nameAr: "الحجر", nameKu: "حیجر", type: "مەککەیی", ayahs: 99, startPage: 262 },
  { number: 16, nameAr: "النحل", nameKu: "نەحل", type: "مەککەیی", ayahs: 128, startPage: 267 },
  { number: 17, nameAr: "الإسراء", nameKu: "ئیسراء", type: "مەککەیی", ayahs: 111, startPage: 282 },
  { number: 18, nameAr: "الكهف", nameKu: "کەهف", type: "مەککەیی", ayahs: 110, startPage: 293 },
  { number: 19, nameAr: "مريم", nameKu: "مەریەم", type: "مەککەیی", ayahs: 98, startPage: 305 },
  { number: 20, nameAr: "طه", nameKu: "تاها", type: "مەککەیی", ayahs: 135, startPage: 312 },
  { number: 21, nameAr: "الأنبياء", nameKu: "ئەنبیاء", type: "مەککەیی", ayahs: 112, startPage: 322 },
  { number: 22, nameAr: "الحج", nameKu: "حەج", type: "مەدینەیی", ayahs: 78, startPage: 332 },
  { number: 23, nameAr: "المؤمنون", nameKu: "مومنون", type: "مەککەیی", ayahs: 118, startPage: 342 },
  { number: 24, nameAr: "النور", nameKu: "نوور", type: "مەدینەیی", ayahs: 64, startPage: 350 },
  { number: 25, nameAr: "الفرقان", nameKu: "فورقان", type: "مەککەیی", ayahs: 77, startPage: 359 },
  { number: 26, nameAr: "الشعراء", nameKu: "شوعەراء", type: "مەککەیی", ayahs: 227, startPage: 367 },
  { number: 27, nameAr: "النمل", nameKu: "نەمل", type: "مەککەیی", ayahs: 93, startPage: 377 },
  { number: 28, nameAr: "القصص", nameKu: "قەسەس", type: "مەککەیی", ayahs: 88, startPage: 385 },
  { number: 29, nameAr: "العنكبوت", nameKu: "عەنکەبووت", type: "مەککەیی", ayahs: 69, startPage: 396 },
  { number: 30, nameAr: "الروم", nameKu: "ڕووم", type: "مەککەیی", ayahs: 60, startPage: 404 },
  { number: 31, nameAr: "لقمان", nameKu: "لوقمان", type: "مەککەیی", ayahs: 34, startPage: 411 },
  { number: 32, nameAr: "السجدة", nameKu: "سەجدە", type: "مەککەیی", ayahs: 30, startPage: 415 },
  { number: 33, nameAr: "الأحزاب", nameKu: "ئەحزاب", type: "مەدینەیی", ayahs: 73, startPage: 418 },
  { number: 34, nameAr: "سبإ", nameKu: "سەبەء", type: "مەککەیی", ayahs: 54, startPage: 428 },
  { number: 35, nameAr: "فاطر", nameKu: "فاتر", type: "مەککەیی", ayahs: 45, startPage: 434 },
  { number: 36, nameAr: "يس", nameKu: "یاسین", type: "مەککەیی", ayahs: 83, startPage: 440 },
  { number: 37, nameAr: "الصافات", nameKu: "سافات", type: "مەککەیی", ayahs: 182, startPage: 446 },
  { number: 38, nameAr: "ص", nameKu: "ساد", type: "مەککەیی", ayahs: 88, startPage: 453 },
  { number: 39, nameAr: "الزمر", nameKu: "زومەر", type: "مەککەیی", ayahs: 75, startPage: 458 },
  { number: 40, nameAr: "غافر", nameKu: "غافیر", type: "مەککەیی", ayahs: 85, startPage: 467 },
  { number: 41, nameAr: "فصلت", nameKu: "فوسیلەت", type: "مەککەیی", ayahs: 54, startPage: 477 },
  { number: 42, nameAr: "الشورى", nameKu: "شوورا", type: "مەککەیی", ayahs: 53, startPage: 483 },
  { number: 43, nameAr: "الزخرف", nameKu: "زوخروف", type: "مەککەیی", ayahs: 89, startPage: 489 },
  { number: 44, nameAr: "الدخان", nameKu: "دوخان", type: "مەککەیی", ayahs: 59, startPage: 496 },
  { number: 45, nameAr: "الجاثية", nameKu: "جاسیە", type: "مەککەیی", ayahs: 37, startPage: 499 },
  { number: 46, nameAr: "الأحقاف", nameKu: "ئەحقاف", type: "مەککەیی", ayahs: 35, startPage: 502 },
  { number: 47, nameAr: "محمد", nameKu: "موحەممەد", type: "مەدینەیی", ayahs: 38, startPage: 507 },
  { number: 48, nameAr: "الفتح", nameKu: "فەتح", type: "مەدینەیی", ayahs: 29, startPage: 511 },
  { number: 49, nameAr: "الحجرات", nameKu: "حوجورات", type: "مەدینەیی", ayahs: 18, startPage: 515 },
  { number: 50, nameAr: "ق", nameKu: "قاف", type: "مەککەیی", ayahs: 45, startPage: 518 },
  { number: 51, nameAr: "الذاريات", nameKu: "زاریات", type: "مەککەیی", ayahs: 60, startPage: 520 },
  { number: 52, nameAr: "الطور", nameKu: "توور", type: "مەککەیی", ayahs: 49, startPage: 523 },
  { number: 53, nameAr: "النجم", nameKu: "نەجم", type: "مەککەیی", ayahs: 62, startPage: 526 },
  { number: 54, nameAr: "القمر", nameKu: "قەمەر", type: "مەککەیی", ayahs: 55, startPage: 528 },
  { number: 55, nameAr: "الرحمن", nameKu: "ڕەحمان", type: "مەدینەیی", ayahs: 78, startPage: 531 },
  { number: 56, nameAr: "الواقعة", nameKu: "واقیعە", type: "مەککەیی", ayahs: 96, startPage: 534 },
  { number: 57, nameAr: "الحديد", nameKu: "حەدید", type: "مەدینەیی", ayahs: 29, startPage: 537 },
  { number: 58, nameAr: "المجادلة", nameKu: "موجادەلە", type: "مەدینەیی", ayahs: 22, startPage: 542 },
  { number: 59, nameAr: "الحشر", nameKu: "حەشر", type: "مەدینەیی", ayahs: 24, startPage: 545 },
  { number: 60, nameAr: "الممتحنة", nameKu: "مومتەحەنە", type: "مەدینەیی", ayahs: 13, startPage: 549 },
  { number: 61, nameAr: "الصف", nameKu: "سەف", type: "مەدینەیی", ayahs: 14, startPage: 551 },
  { number: 62, nameAr: "الجمعة", nameKu: "جومعە", type: "مەدینەیی", ayahs: 11, startPage: 553 },
  { number: 63, nameAr: "المنافقون", nameKu: "مونافیقوون", type: "مەدینەیی", ayahs: 11, startPage: 554 },
  { number: 64, nameAr: "التغابن", nameKu: "تەغابون", type: "مەدینەیی", ayahs: 18, startPage: 556 },
  { number: 65, nameAr: "الطلاق", nameKu: "تەڵاق", type: "مەدینەیی", ayahs: 12, startPage: 558 },
  { number: 66, nameAr: "التحريم", nameKu: "تەحریم", type: "مەدینەیی", ayahs: 12, startPage: 560 },
  { number: 67, nameAr: "الملك", nameKu: "مولک", type: "مەککەیی", ayahs: 30, startPage: 562 },
  { number: 68, nameAr: "القلم", nameKu: "قەلەم", type: "مەککەیی", ayahs: 52, startPage: 564 },
  { number: 69, nameAr: "الحاقة", nameKu: "حاقە", type: "مەککەیی", ayahs: 52, startPage: 566 },
  { number: 70, nameAr: "المعارج", nameKu: "مەعاریج", type: "مەککەیی", ayahs: 44, startPage: 568 },
  { number: 71, nameAr: "نوح", nameKu: "نووح", type: "مەککەیی", ayahs: 28, startPage: 570 },
  { number: 72, nameAr: "الجن", nameKu: "جن", type: "مەککەیی", ayahs: 28, startPage: 572 },
  { number: 73, nameAr: "المزمل", nameKu: "موزەممیل", type: "مەککەیی", ayahs: 20, startPage: 574 },
  { number: 74, nameAr: "المدثر", nameKu: "مودەسیر", type: "مەککەیی", ayahs: 56, startPage: 575 },
  { number: 75, nameAr: "القيامة", nameKu: "قیامەت", type: "مەککەیی", ayahs: 40, startPage: 577 },
  { number: 76, nameAr: "الإنسان", nameKu: "ئینسان", type: "مەدینەیی", ayahs: 31, startPage: 578 },
  { number: 77, nameAr: "المرسلات", nameKu: "مورسەلات", type: "مەککەیی", ayahs: 50, startPage: 580 },
  { number: 78, nameAr: "النبإ", nameKu: "نەبەء", type: "مەککەیی", ayahs: 40, startPage: 582 },
  { number: 79, nameAr: "النازعات", nameKu: "نازیعات", type: "مەککەیی", ayahs: 46, startPage: 583 },
  { number: 80, nameAr: "عبس", nameKu: "عەبەس", type: "مەککەیی", ayahs: 42, startPage: 585 },
  { number: 81, nameAr: "التكوير", nameKu: "تەکویر", type: "مەککەیی", ayahs: 29, startPage: 586 },
  { number: 82, nameAr: "الانفطار", nameKu: "ئینفیتار", type: "مەککەیی", ayahs: 19, startPage: 587 },
  { number: 83, nameAr: "المطففين", nameKu: "موتەفیفین", type: "مەککەیی", ayahs: 36, startPage: 587 },
  { number: 84, nameAr: "الانشقاق", nameKu: "ئینشيقاق", type: "مەککەیی", ayahs: 25, startPage: 589 },
  { number: 85, nameAr: "البروج", nameKu: "بورووج", type: "مەککەیی", ayahs: 22, startPage: 590 },
  { number: 86, nameAr: "الطارق", nameKu: "تاریق", type: "مەککەیی", ayahs: 17, startPage: 591 },
  { number: 87, nameAr: "الأعلى", nameKu: "ئەعلا", type: "مەککەیی", ayahs: 19, startPage: 591 },
  { number: 88, nameAr: "الغاشية", nameKu: "غاشیە", type: "مەککەیی", ayahs: 26, startPage: 592 },
  { number: 89, nameAr: "الفجر", nameKu: "فەجر", type: "مەککەیی", ayahs: 30, startPage: 593 },
  { number: 90, nameAr: "البلد", nameKu: "بەلەد", type: "مەککەیی", ayahs: 20, startPage: 594 },
  { number: 91, nameAr: "الشمس", nameKu: "شەمس", type: "مەککەیی", ayahs: 15, startPage: 595 },
  { number: 92, nameAr: "الليل", nameKu: "لەیل", type: "مەککەیی", ayahs: 21, startPage: 595 },
  { number: 93, nameAr: "الضحى", nameKu: "زوحا", type: "مەککەیی", ayahs: 11, startPage: 596 },
  { number: 94, nameAr: "الشرح", nameKu: "شەرح", type: "مەککەیی", ayahs: 8, startPage: 596 },
  { number: 95, nameAr: "التين", nameKu: "تین", type: "مەککەیی", ayahs: 8, startPage: 597 },
  { number: 96, nameAr: "العلق", nameKu: "عەلەق", type: "مەککەیی", ayahs: 19, startPage: 597 },
  { number: 97, nameAr: "القدر", nameKu: "قەدر", type: "مەککەیی", ayahs: 5, startPage: 598 },
  { number: 98, nameAr: "البينة", nameKu: "بەینە", type: "مەدینەیی", ayahs: 8, startPage: 598 },
  { number: 99, nameAr: "الزلزلة", nameKu: "زەلزەلە", type: "مەدینەیی", ayahs: 8, startPage: 599 },
  { number: 100, nameAr: "العاديات", nameKu: "عادیات", type: "مەککەیی", ayahs: 11, startPage: 599 },
  { number: 101, nameAr: "القارعة", nameKu: "قاریعە", type: "مەککەیی", ayahs: 11, startPage: 600 },
  { number: 102, nameAr: "التكاثر", nameKu: "تەکاسور", type: "مەککەیی", ayahs: 8, startPage: 600 },
  { number: 103, nameAr: "العصر", nameKu: "عەسر", type: "مەککەیی", ayahs: 3, startPage: 601 },
  { number: 104, nameAr: "الهمزة", nameKu: "هومەزە", type: "مەککەیی", ayahs: 9, startPage: 601 },
  { number: 105, nameAr: "الفيل", nameKu: "فیل", type: "مەککەیی", ayahs: 5, startPage: 601 },
  { number: 106, nameAr: "قريش", nameKu: "قورەیش", type: "مەککەیی", ayahs: 4, startPage: 602 },
  { number: 107, nameAr: "الماعون", nameKu: "ماعوون", type: "مەککەیی", ayahs: 7, startPage: 602 },
  { number: 108, nameAr: "الكوثر", nameKu: "کەوسەر", type: "مەککەیی", ayahs: 3, startPage: 602 },
  { number: 109, nameAr: "الكافرون", nameKu: "کافیروون", type: "مەککەیی", ayahs: 6, startPage: 603 },
  { number: 110, nameAr: "النصر", nameKu: "نەسر", type: "مەدینەیی", ayahs: 3, startPage: 603 },
  { number: 111, nameAr: "المسد", nameKu: "مەسەد", type: "مەککەیی", ayahs: 5, startPage: 603 },
  { number: 112, nameAr: "الإخلاص", nameKu: "ئیخلاس", type: "مەککەیی", ayahs: 4, startPage: 604 },
  { number: 113, nameAr: "الفلق", nameKu: "فەلەق", type: "مەککەیی", ayahs: 5, startPage: 604 },
  { number: 114, nameAr: "الناس", nameKu: "ناس", type: "مەککەیی", ayahs: 6, startPage: 604 }
];

export default function App() {
  const [view, setView] = useState<'index' | 'mushaf'>('index');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loadingPage, setLoadingPage] = useState<boolean>(false);

  const filteredSurahs = SURAHS_INDEX.filter(s => 
    s.nameKu.includes(searchQuery) || 
    s.nameAr.includes(searchQuery) || 
    String(s.number).includes(searchQuery)
  );

  const openSurahPage = (startPage: number) => {
    setCurrentPage(startPage);
    setView('mushaf');
    setLoadingPage(true);
  };

  const nextPage = () => {
    if (currentPage < 604) {
      setLoadingPage(true);
      setCurrentPage(prev => prev + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setLoadingPage(true);
      setCurrentPage(prev => prev - 1);
    }
  };

  const formatPageNum = (n: number) => String(n).padStart(3, '0');

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-slate-800 font-sans selection:bg-amber-100" dir="rtl">
      
      {/* ========================================================================= */}
      {/* ١. پێڕستی سوورەتەکان بە باکگراوندی سپی و زۆر پاک */}
      {/* ========================================================================= */}
      {view === 'index' && (
        <div className="max-w-xl mx-auto p-4 space-y-4">
          
          {/* سەرپەڕە */}
          <div className="text-center py-4 space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#854d0e] font-serif tracking-wide">
              القرآن الكريم
            </h1>
            <p className="text-xs text-slate-500 font-medium">موسحەفی فەرمیی مەدینەی منەوەرە</p>
          </div>

          {/* شریتی سێرچی سپیی خاوێن */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="گەڕان لە ناوی سوورەت یان ژمارە (بۆ نموونە: یوسف، ٦٧، الملك)..."
              className="w-full bg-white text-slate-800 placeholder-slate-400 text-xs px-4 py-3.5 pr-10 rounded-2xl border border-slate-200 focus:outline-none focus:border-amber-600 shadow-xs"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
          </div>

          {/* پێڕستی سوورەتەکان بە کارتی سپیی شاهانە */}
          <div className="space-y-2 pt-1">
            {filteredSurahs.map((surah) => (
              <div
                key={surah.number}
                onClick={() => openSurahPage(surah.startPage)}
                className="p-3.5 rounded-2xl bg-white hover:bg-amber-50/40 border border-slate-200/90 hover:border-amber-400/80 cursor-pointer flex items-center justify-between transition-all active:scale-[0.99] group shadow-xs"
              >
                <div className="flex items-center gap-3">
                  {/* ژمارەی سوورەت بە بازنەی زێڕینی نەرم */}
                  <div className="w-9 h-9 rounded-xl bg-amber-100/80 border border-amber-300/80 text-amber-900 font-bold text-xs flex items-center justify-center">
                    {surah.number}
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-slate-900 group-hover:text-amber-800 transition-colors">
                      سورة {surah.nameAr}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      سوورەتی {surah.nameKu} • {surah.type} • {surah.ayahs} ئایەت
                    </p>
                  </div>
                </div>

                <div className="text-left text-[11px] text-amber-800 font-bold bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200">
                  لاپەڕەی {surah.startPage}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ٢. پەڕەی موسحەفی ڕاستەقینەی مەدینەی منەوەرە (HD) */}
      {/* ========================================================================= */}
      {view === 'mushaf' && (
        <div className="max-w-lg mx-auto p-2 sm:p-4 space-y-3">
          
          {/* شریتی سەرەوەی گەڕانەوە */}
          <div className="flex items-center justify-between bg-white border border-slate-200 p-2 rounded-2xl shadow-xs">
            <button
              onClick={() => setView('index')}
              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-amber-200"
            >
              <ArrowRight className="w-4 h-4" />
              <span>پێڕستی سوورەتەکان</span>
            </button>

            <span className="text-xs text-amber-900 font-bold">
              لاپەڕەی {currentPage} لە ٦٠٤
            </span>
          </div>

          {/* چوارچێوەی لاپەڕەی مەدینە */}
          <div className="relative rounded-3xl bg-[#f7f2e5] border-4 border-[#c8a96e] shadow-xl p-2 sm:p-3 overflow-hidden min-h-[550px] flex flex-col items-center justify-center">
            
            {loadingPage && (
              <div className="absolute inset-0 bg-[#f7f2e5]/80 backdrop-blur-xs flex flex-col items-center justify-center gap-2 z-10">
                <Loader2 className="w-8 h-8 text-[#8c6b2d] animate-spin" />
                <span className="text-xs text-[#5c441b] font-bold">لاپەڕەی {currentPage} باردەکرێت...</span>
              </div>
            )}

            <img
              src={`https://android.quran.com/data/width_1260/page${formatPageNum(currentPage)}.png`}
              alt={`لاپەڕەی ${currentPage}`}
              onLoad={() => setLoadingPage(false)}
              className="w-full h-auto max-h-[80vh] object-contain rounded-xl select-none pointer-events-none"
            />

            <div className="w-full text-center pt-2 border-t border-[#dfcfb0]/60 mt-1 flex items-center justify-between text-[11px] text-[#785b24] font-bold px-3">
              <span>جوزء {Math.ceil(currentPage / 20)}</span>
              <span className="bg-[#ebdcb9] px-3 py-0.5 rounded-full border border-[#c4a66e]/40">
                {currentPage}
              </span>
              <span>حیزب {Math.ceil(currentPage / 10)}</span>
            </div>
          </div>

          {/* دوگمەکانی پەڕەهەڵدانەوە */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              onClick={nextPage}
              disabled={currentPage >= 604}
              className="flex-1 py-3 bg-white hover:bg-slate-50 disabled:opacity-40 border border-slate-200 text-amber-900 font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition-transform active:scale-95"
            >
              <ChevronRight className="w-4 h-4" />
              <span>لاپەڕەی دواتر ({currentPage + 1})</span>
            </button>

            <button
              onClick={prevPage}
              disabled={currentPage <= 1}
              className="flex-1 py-3 bg-white hover:bg-slate-50 disabled:opacity-40 border border-slate-200 text-amber-900 font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition-transform active:scale-95"
            >
              <span>لاپەڕەی پێشوو ({currentPage - 1})</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
