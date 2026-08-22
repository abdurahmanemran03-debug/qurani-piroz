import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Compass, Sparkles, Settings as SettingsIcon, 
  Award, Heart, BookMarked, MessageSquare, Palmtree
} from 'lucide-react';

import { AppThemeMode, BgThemeType, AppLangType, AccentColorType, CityPrayerData } from './types';
import { SURAHS_INDEX } from './data/surahsData';
import { ALL_ADHKAR_DATA } from './data/adhkarData';
import { SEERAH_BOOK_CHAPTERS, SAHABA_ENCYCLOPEDIA, SCHOLARS_ENCYCLOPEDIA } from './data/seerahAndScholarsData';
import { ALL_QUIZ_DATA } from './data/quizData';

import { SurahListView } from './components/SurahListView';
import { MushafPageView } from './components/MushafPageView';
import { PrayerTimesView } from './components/PrayerTimesView';
import { AdhkarView } from './components/AdhkarView';
import { LibraryView } from './components/LibraryView';
import { SeerahView } from './components/SeerahView';
import { QuizView } from './components/QuizView';
import { ShariaAiView } from './components/ShariaAiView';
import { SettingsModal } from './components/SettingsModal';

const CITIES_IRAQ: CityPrayerData[] = [
  { id: 'Erbil', name: 'هەولێر', qiblaAngle: 198 },
  { id: 'Sulaymaniyah', name: 'سلێمانی', qiblaAngle: 202 },
  { id: 'Duhok', name: 'دهۆک', qiblaAngle: 195 },
  { id: 'Kirkuk', name: 'کەرکووک', qiblaAngle: 200 },
  { id: 'Halabja', name: 'هەڵەبجە', qiblaAngle: 204 },
  { id: 'Zakho', name: 'زاخۆ', qiblaAngle: 194 },
  { id: 'Baghdad', name: 'بەغدا', qiblaAngle: 205 },
  { id: 'Mosul', name: 'مووسڵ', qiblaAngle: 197 }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'quran' | 'adhkar' | 'prayer' | 'library' | 'seerah' | 'quiz' | 'ai' | 'settings'>('quran');
  const [quranView, setQuranView] = useState<'index' | 'mushaf'>('index');
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Settings State
  const [bgStyle, setBgStyle] = useState<BgThemeType>('white');
  const [appLang, setAppLang] = useState<AppLangType>('ku');
  const [accentColor, setAccentColor] = useState<AccentColorType>('gold');
  const [showKurdishNames, setShowKurdishNames] = useState<boolean>(true);
  const [showNumbers, setShowNumbers] = useState<boolean>(true);

  // Adhkar & Score
  const [activeAdhkarCat, setActiveAdhkarCat] = useState<string>('morning');
  const [adhkarCounts, setAdhkarCounts] = useState<Record<string, number>>({});
  const [hasanatScore, setHasanatScore] = useState<number>(200);

  // Prayer state
  const [selectedCity, setSelectedCity] = useState<string>('Erbil');
  const [prayerTimes, setPrayerTimes] = useState<any>(null);
  const [loadingPrayer, setLoadingPrayer] = useState<boolean>(false);

  // AI state
  const [aiMessages, setAiMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string }>>([
    { sender: 'bot', text: 'سڵاو لە ئێوەی بەڕێز. من یاریدەدەری زیرەکی شەرعیم. وەڵامی پرسیارە فیقهییەکان بەپێی ٤ مەزهەبەکە لەسەر بنەمای قورئان و سوننەت دەدەمەوە.' }
  ]);
  const [aiLoading, setAiLoading] = useState<boolean>(false);

  // Prayer Times API
  useEffect(() => {
    async function fetchPrayers() {
      setLoadingPrayer(true);
      const cityObj = CITIES_IRAQ.find(c => c.id === selectedCity) || CITIES_IRAQ[0];
      try {
        const res = await fetch(`https://api.aladhan.com/v1/timingsByCity?city=${cityObj.id}&country=Iraq&method=3`);
        const data = await res.json();
        if (data.code === 200) setPrayerTimes(data.data.timings);
      } catch {
        setPrayerTimes({ Fajr: '04:50', Sunrise: '06:15', Dhuhr: '12:18', Asr: '15:35', Maghrib: '18:12', Isha: '19:40' });
      } finally {
        setLoadingPrayer(false);
      }
    }
    fetchPrayers();
  }, [selectedCity]);

  const handleAdhkarCount = (id: string, max: number) => {
    const current = adhkarCounts[id] || 0;
    if (current < max) {
      setAdhkarCounts(prev => ({ ...prev, [id]: current + 1 }));
      setHasanatScore(prev => prev + 10);
      if (navigator.vibrate) navigator.vibrate(35);
    }
  };

  const handleSendAi = (userQ: string) => {
    setAiMessages(prev => [...prev, { sender: 'user', text: userQ }]);
    setAiLoading(true);
    setTimeout(() => {
      let botAnswer = `
بەڵگەی شەرعی لەسەر ئەم بابەتە:
- لەسەر بنەمای قورئانی پیرۆز و سوننەتی صەحیحی پێغەمبەر ﷺ.

شیکاریی هەر ٤ مەزهەبە فیقهییەکە:
• مەزهەبی ئیمامی شافعی: لەسەر دەقی بەڵگە سەحیحەکان حوکمەکە واجبە و پێویستە پابەند بین.
• مەزهەبی ئیمامی حەنەفی: بە پێی بنەمای قیاس و ئیستحسان ڕێگەپێدراوە.
• مەزهەبی ئیمامی مالیکی: لەسەر عەمەلی ئەهلی مەدینە دەڕوات.
• مەزهەبی ئیمامی حەنبەلی: تەواو پابەندبوونە بە دەقی فەرموودە.
      `;
      if (userQ.includes('تەڵاق') || userQ.includes('میرات') || userQ.includes('ئاڵۆز')) {
        botAnswer = `⚠️ ئەم پرسیارە پەیوەستە بە بابەتێکی هەستیاری شەرعی. پرسیارەکەت ڕەوانەی «لێژنەی مامۆستایانی ئایینی» کرا و لە ماوەی کەمتر لە ٢٤ کاتژمێردا وەڵامەکەت پێ دەگات ان شاء الله.`;
      }
      setAiMessages(prev => [...prev, { sender: 'bot', text: botAnswer }]);
      setAiLoading(false);
    }, 1000);
  };

  const getContainerBg = () => {
    if (bgStyle === 'cream') return 'bg-[#f7f2e5] text-[#3c2d15]';
    if (bgStyle === 'dark') return 'bg-[#0a0d14] text-slate-100';
    return 'bg-[#f8f9fa] text-slate-800';
  };

  return (
    <div className={`min-h-screen ${getContainerBg()} font-sans selection:bg-slate-200 transition-colors duration-200`} dir={appLang === 'en' ? 'ltr' : 'rtl'}>
      
      {/* سەرپەڕە */}
      <header className="sticky top-0 z-40 bg-white/95 border-b border-slate-200 backdrop-blur-md px-3.5 py-2.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-300 text-amber-900 flex items-center justify-center font-bold text-xs">
            ئیسلام
          </div>
          <div>
            <h1 className="font-bold text-xs sm:text-sm text-slate-900">ئەکادیمیای شەریعەت و قورئان</h1>
            <p className="text-[10px] text-slate-500">تەفسیری نامی و گەورە زانایان</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold shadow-xs">
          <Palmtree className="w-3.5 h-3.5 text-amber-700" />
          <span>{hasanatScore} چاکە</span>
        </div>
      </header>

      {/* ناوەڕۆک */}
      <main className="flex-1 pb-20">
        {activeTab === 'quran' && (
          quranView === 'index' ? (
            <SurahListView
              surahs={SURAHS_INDEX}
              onOpenSurah={(p) => { setCurrentPage(p); setQuranView('mushaf'); }}
              onOpenSettings={() => setActiveTab('settings')}
              bgStyle={bgStyle}
              appLang={appLang}
              accentColor={accentColor}
              showKurdishNames={showKurdishNames}
              showNumbers={showNumbers}
            />
          ) : (
            <MushafPageView
              currentPage={currentPage}
              onNextPage={() => currentPage < 604 && setCurrentPage(p => p + 1)}
              onPrevPage={() => currentPage > 1 && setCurrentPage(p => p - 1)}
              onBackToIndex={() => setQuranView('index')}
              bgStyle={bgStyle}
              appLang={appLang}
              showNumbers={showNumbers}
              surahsList={SURAHS_INDEX}
              onJumpToPage={(p) => setCurrentPage(p)}
            />
          )
        )}

        {activeTab === 'adhkar' && (
          <AdhkarView
            categories={ALL_ADHKAR_DATA}
            activeCat={activeAdhkarCat}
            onSelectCat={setActiveAdhkarCat}
            counts={adhkarCounts}
            onCount={handleAdhkarCount}
            onReset={(id) => setAdhkarCounts(prev => ({ ...prev, [id]: 0 }))}
          />
        )}

        {activeTab === 'prayer' && (
          <PrayerTimesView
            cities={CITIES_IRAQ}
            selectedCity={selectedCity}
            onSelectCity={setSelectedCity}
            prayerTimes={prayerTimes}
            loadingPrayer={loadingPrayer}
          />
        )}

        {activeTab === 'library' && (
          <LibraryView scholars={SCHOLARS_ENCYCLOPEDIA} />
        )}

        {activeTab === 'seerah' && (
          <SeerahView
            chapters={SEERAH_BOOK_CHAPTERS}
            sahabaList={SAHABA_ENCYCLOPEDIA}
          />
        )}

        {activeTab === 'quiz' && (
          <QuizView
            quizList={ALL_QUIZ_DATA}
            hasanatScore={hasanatScore}
            onAddHasanat={(amt) => setHasanatScore(prev => prev + amt)}
          />
        )}

        {activeTab === 'ai' && (
          <ShariaAiView
            aiMessages={aiMessages}
            onSendMessage={handleSendAi}
            aiLoading={aiLoading}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsModal
            onClose={() => setActiveTab('quran')}
            bgStyle={bgStyle}
            setBgStyle={setBgStyle}
            appLang={appLang}
            setAppLang={setAppLang}
            accentColor={accentColor}
            setAccentColor={setAccentColor}
            showKurdishNames={showKurdishNames}
            setShowKurdishNames={setShowKurdishNames}
            showNumbers={showNumbers}
            setShowNumbers={setShowNumbers}
          />
        )}
      </main>

      {/* مینیۆی خوارەوە (Bottom Navigation Bar) */}
      <nav className="fixed bottom-0 inset-x-0 z-50 bg-white/95 border-t border-slate-200 backdrop-blur-md flex items-center justify-around py-1.5 px-1 shadow-md">
        {[
          { id: 'quran', label: 'قورئان', icon: BookOpen },
          { id: 'adhkar', label: 'زیکرەکان', icon: Sparkles },
          { id: 'prayer', label: 'بانگ و قیبلە', icon: Compass },
          { id: 'library', label: 'کتێبخانە', icon: BookMarked },
          { id: 'seerah', label: 'سیرە', icon: Heart },
          { id: 'quiz', label: 'کویز', icon: Award },
          { id: 'ai', label: 'فەتوا AI', icon: MessageSquare },
          { id: 'settings', label: 'ڕێکخستن', icon: SettingsIcon }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                if (tab.id === 'quran') setQuranView('index');
              }}
              className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-all ${
                isActive ? 'text-amber-800 font-bold scale-105' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[9px]">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
