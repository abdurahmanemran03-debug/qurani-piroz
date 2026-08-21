import React from 'react';
import { ArrowRight, Palette, Globe, Eye, Sliders } from 'lucide-react';
import { BgThemeType, AppLangType, AccentColorType } from '../types';

interface SettingsModalProps {
  onClose: () => void;
  bgStyle: BgThemeType;
  setBgStyle: (val: BgThemeType) => void;
  appLang: AppLangType;
  setAppLang: (val: AppLangType) => void;
  accentColor: AccentColorType;
  setAccentColor: (val: AccentColorType) => void;
  showKurdishNames: boolean;
  setShowKurdishNames: (val: boolean) => void;
  showNumbers: boolean;
  setShowNumbers: (val: boolean) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  onClose,
  bgStyle,
  setBgStyle,
  appLang,
  setAppLang,
  accentColor,
  setAccentColor,
  showKurdishNames,
  setShowKurdishNames,
  showNumbers,
  setShowNumbers
}) => {
  return (
    <div className="max-w-xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between border-b pb-3">
        <div className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-amber-700" />
          <h2 className="text-lg font-bold">
            {appLang === 'ar' ? 'الإعدادات' : (appLang === 'en' ? 'Settings' : 'ڕێکخستنەکان')}
          </h2>
        </div>

        <button
          onClick={onClose}
          className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 bg-slate-100 border border-slate-200 text-slate-800"
        >
          <ArrowRight className="w-4 h-4" />
          <span>گەڕانەوە</span>
        </button>
      </div>

      {/* باکگراوند */}
      <div className="p-5 rounded-3xl border border-slate-200 bg-white space-y-3 shadow-xs">
        <span className="text-xs font-bold flex items-center gap-1.5">
          <Palette className="w-4 h-4" />
          شێوازی باکگراوندی قورئان:
        </span>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'white', label: 'سپیی پاک ⚪' },
            { id: 'cream', label: 'شاموا 📜' },
            { id: 'dark', label: 'تاریک 🖤' }
          ].map(st => (
            <button
              key={st.id}
              onClick={() => setBgStyle(st.id as BgThemeType)}
              className={`p-3 rounded-2xl text-xs font-bold border transition-all ${
                bgStyle === st.id ? 'bg-amber-600 text-white border-amber-500 shadow-sm' : 'bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* زمان */}
      <div className="p-5 rounded-3xl border border-slate-200 bg-white space-y-3 shadow-xs">
        <span className="text-xs font-bold flex items-center gap-1.5">
          <Globe className="w-4 h-4" />
          زمانی بەرنامە:
        </span>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'ku', label: 'کوردی' },
            { id: 'ar', label: 'العربية' },
            { id: 'en', label: 'English' }
          ].map(lg => (
            <button
              key={lg.id}
              onClick={() => setAppLang(lg.id as AppLangType)}
              className={`py-2.5 rounded-2xl text-xs font-bold border transition-all ${
                appLang === lg.id ? 'bg-amber-600 text-white border-amber-500 shadow-sm' : 'bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              {lg.label}
            </button>
          ))}
        </div>
      </div>

      {/* پیشاندان و شاردنەوە */}
      <div className="p-5 rounded-3xl border border-slate-200 bg-white space-y-4 shadow-xs">
        <span className="text-xs font-bold flex items-center gap-1.5">
          <Eye className="w-4 h-4" />
          ڕێکخستنی پیشاندان:
        </span>

        <div className="flex items-center justify-between border-b pb-3">
          <span className="text-xs font-bold">پیشاندانی وەرگێڕانی ناوی سوورەتەکان</span>
          <input
            type="checkbox"
            checked={showKurdishNames}
            onChange={(e) => setShowKurdishNames(e.target.checked)}
            className="w-5 h-5 accent-amber-600 rounded cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs font-bold">پیشاندانی ژمارەی لاپەڕە و سوورەتەکان</span>
          <input
            type="checkbox"
            checked={showNumbers}
            onChange={(e) => setShowNumbers(e.target.checked)}
            className="w-5 h-5 accent-amber-600 rounded cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
